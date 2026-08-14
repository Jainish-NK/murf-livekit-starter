import logging
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from livekit.agents import function_tool, RunContext

try:
    from tools.privacy import sanitize_text
except ImportError:
    from src.tools.privacy import sanitize_text

logger = logging.getLogger("handoff_tools")


class HandoffState(str, Enum):
    MAIN = "MAIN"
    HANDOFF_REQUESTED = "HANDOFF_REQUESTED"
    SPECIALIST_ACTIVE = "SPECIALIST_ACTIVE"
    TASK_COMPLETED = "TASK_COMPLETED"
    HAND_BACK_TO_MAIN = "HAND_BACK_TO_MAIN"
    HANDOFF_FAILED = "HANDOFF_FAILED"


class HandoffContext(BaseModel):
    intent: str = Field(description="Summary of the user appointment or clinic intent")
    doctor_preference: str | None = Field(default=None, description="Preferred doctor name if specified")
    requested_date: str | None = Field(default=None, description="Preferred date (e.g. tomorrow, 2026-08-15)")
    preferred_time: str | None = Field(default=None, description="Preferred time or slot (e.g. afternoon, 10:30 AM)")
    language: str = Field(default="Hindi", description="Language preference (Hindi/English/Gujarati)")
    relevant_consented_memory: dict[str, Any] | None = Field(default=None, description="Only relevant consented facts")
    relevant_tool_results: dict[str, Any] | None = Field(default=None, description="Relevant clinic or schedule lookups")


MAX_HANDOFF_TRANSITIONS = 6  # Prevent infinite ping-pong handoffs


def get_handoff_state(userdata: dict[str, Any] | None) -> HandoffState:
    if not userdata or not isinstance(userdata, dict):
        return HandoffState.MAIN
    return HandoffState(userdata.get("handoff_state", HandoffState.MAIN.value))


def set_handoff_state(userdata: dict[str, Any] | None, state: HandoffState) -> None:
    if userdata and isinstance(userdata, dict):
        userdata["handoff_state"] = state.value


def can_transition(userdata: dict[str, Any] | None) -> bool:
    if not userdata or not isinstance(userdata, dict):
        return True
    count = userdata.get("handoff_count", 0)
    return count < MAX_HANDOFF_TRANSITIONS


@function_tool()
async def transfer_to_clinic_specialist(
    context: RunContext,
    intent: str,
    doctor_preference: str | None = None,
    requested_date: str | None = None,
    preferred_time: str | None = None,
    language: str | None = None,
) -> dict[str, Any]:
    """
    Connect the caller to SehatSaathi AI's Clinic & Appointment Specialist.
    Call this tool whenever the caller asks for:
    - Doctor appointment booking
    - Appointment rescheduling
    - Appointment cancellation
    - Doctor schedule / availability
    - Clinic timings and department services

    DO NOT call this tool if the user is describing emergency red-flag symptoms or requesting disease diagnosis.
    Safety, triage, and human escalation must take priority on the Main Agent.
    """
    userdata = getattr(context.session, "userdata", None) if hasattr(context, "session") else None

    # Check loop prevention guard
    if not can_transition(userdata):
        logger.warning("Handoff limit reached. Retaining Main Agent.")
        return {
            "success": False,
            "message": "मैं आपकी मदद यहीं जारी रखती हूँ।",
        }

    # Sanitize and prepare HandoffContext
    safe_intent = sanitize_text(intent.strip()) if intent else "Appointment Assistance"
    safe_doctor = sanitize_text(doctor_preference.strip()) if doctor_preference else None
    safe_date = sanitize_text(requested_date.strip()) if requested_date else None
    safe_time = sanitize_text(preferred_time.strip()) if preferred_time else None

    # Extract relevant language
    active_lang = language or (userdata.get("language") if userdata else "Hindi")
    if not active_lang or active_lang == "Unknown":
        active_lang = "Hindi"

    # Extract ONLY relevant consented memory (e.g. preferred doctor or time slot)
    consented_mem = None
    if userdata and isinstance(userdata, dict):
        raw_facts = userdata.get("facts", {})
        if isinstance(raw_facts, dict):
            consented_mem = {
                k: sanitize_text(str(v))
                for k, v in raw_facts.items()
                if k in {"preferred_doctor", "preferred_time", "preferred_slot", "department"}
            }

    handoff_ctx = HandoffContext(
        intent=safe_intent,
        doctor_preference=safe_doctor,
        requested_date=safe_date,
        preferred_time=safe_time,
        language=active_lang,
        relevant_consented_memory=consented_mem,
        relevant_tool_results=None,
    )

    try:
        set_handoff_state(userdata, HandoffState.HANDOFF_REQUESTED)

        # Import specialist dynamically to prevent circular dependencies
        try:
            from specialist_agents.clinic_agent import ClinicSpecialistAgent
        except ImportError:
            from src.specialist_agents.clinic_agent import ClinicSpecialistAgent

        specialist = ClinicSpecialistAgent(handoff_context=handoff_ctx)

        # Update LiveKit session agent
        context.session.update_agent(specialist)

        # Update state and metrics
        set_handoff_state(userdata, HandoffState.SPECIALIST_ACTIVE)
        if userdata and isinstance(userdata, dict):
            userdata["handoff_count"] = userdata.get("handoff_count", 0) + 1
            userdata["specialist_used"] = "Clinic & Appointment Specialist"
            userdata["handoff_status"] = "SUCCESS"
            curr_path = userdata.get("agent_path", "Main")
            if not curr_path.endswith("Clinic Specialist"):
                userdata["agent_path"] = f"{curr_path} -> Clinic Specialist"

        logger.info(
            "Handoff executed: Main -> Clinic Specialist (Doctor=%s, Date=%s, Time=%s)",
            safe_doctor,
            safe_date,
            safe_time,
        )

        announcement = (
            "ज़रूर। मैं आपको हमारे Clinic और Appointment Specialist से connect करती हूँ।"
            if active_lang.lower().startswith("hi")
            else "Sure. I'll connect you with our Clinic and Appointment Specialist."
        )

        return {
            "success": True,
            "message": announcement,
            "handoff_state": HandoffState.SPECIALIST_ACTIVE.value,
        }

    except Exception as e:
        logger.error("Failed to handoff to specialist: %s", str(e), exc_info=True)
        set_handoff_state(userdata, HandoffState.HANDOFF_FAILED)
        if userdata and isinstance(userdata, dict):
            userdata["handoff_status"] = "FAILED"

        fallback_msg = (
            "Appointment specialist अभी उपलब्ध नहीं हो पाए। मैं आपकी मदद यहीं जारी रखती हूँ।"
            if str(active_lang).lower().startswith("hi")
            else "The appointment specialist is currently unavailable. I will continue helping you right here."
        )
        return {
            "success": False,
            "message": fallback_msg,
            "handoff_state": HandoffState.HANDOFF_FAILED.value,
        }


@function_tool()
async def handback_to_main_agent(
    context: RunContext,
    reason: str,
    context_summary: str | None = None,
) -> dict[str, Any]:
    """
    Hand the caller back to the Main SehatSaathi Assistant (Anisha).
    Call this tool when:
    1. The user asks an out-of-scope general health query (diet, healthy breakfast, hydration, illness information).
    2. The user reports a serious symptom or requests a medical diagnosis (Main Agent handles safety & human escalation).
    3. The appointment task is finished and the user wants to discuss something else.
    """
    userdata = getattr(context.session, "userdata", None) if hasattr(context, "session") else None

    # Check loop prevention guard
    if not can_transition(userdata):
        logger.warning("Handoff limit reached. Retaining current agent.")
        return {
            "success": False,
            "message": "मैं आपकी मदद यहीं जारी रखता हूँ।",
        }

    active_lang = userdata.get("language", "Hindi") if userdata else "Hindi"
    fallback_user_id = userdata.get("caller_id", "caller") if userdata else "caller"

    try:
        set_handoff_state(userdata, HandoffState.HAND_BACK_TO_MAIN)

        # Import main Assistant
        try:
            from agent import Assistant
        except ImportError:
            from src.agent import Assistant

        main_assistant = Assistant(
            user_id=fallback_user_id,
            returned_context=context_summary,
            return_reason=reason,
        )

        context.session.update_agent(main_assistant)

        set_handoff_state(userdata, HandoffState.MAIN)
        if userdata and isinstance(userdata, dict):
            userdata["handoff_count"] = userdata.get("handoff_count", 0) + 1
            curr_path = userdata.get("agent_path", "Main -> Clinic Specialist")
            if not curr_path.endswith("Main"):
                userdata["agent_path"] = f"{curr_path} -> Main"

        logger.info("Handback executed: Clinic Specialist -> Main (Reason: %s)", reason)

        is_safety = "emergency" in reason.lower() or "safety" in reason.lower() or "diagnosis" in reason.lower()
        if is_safety:
            handback_announcement = (
                "स्वास्थ्य और सुरक्षा के संबंध में, मैं आपको हमारे मुख्य SehatSaathi सहायक से वापस जोड़ता हूँ।"
                if str(active_lang).lower().startswith("hi")
                else "For your health and safety, let me connect you back with the main SehatSaathi assistant."
            )
        else:
            handback_announcement = (
                "यह general health question है। मैं आपको SehatSaathi assistant के पास वापस connect करता हूँ।"
                if str(active_lang).lower().startswith("hi")
                else "That is a general health question. Let me connect you back with the main SehatSaathi assistant."
            )

        return {
            "success": True,
            "message": handback_announcement,
            "handoff_state": HandoffState.MAIN.value,
        }

    except Exception as e:
        logger.error("Failed to hand back to main agent: %s", str(e), exc_info=True)
        return {
            "success": False,
            "message": "मैं आपकी मदद यहीं जारी रखता हूँ।",
        }
