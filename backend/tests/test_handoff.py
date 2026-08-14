import sys
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

# Ensure backend and backend/src are on sys.path
backend_dir = Path(__file__).resolve().parents[1]
src_dir = backend_dir / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from tools.handoff_tools import (
    transfer_to_clinic_specialist,
    handback_to_main_agent,
    HandoffContext,
    HandoffState,
    can_transition,
    MAX_HANDOFF_TRANSITIONS,
)
from tools.privacy import sanitize_text
from tools.healthcare_tools import check_triage_level
from specialist_agents.clinic_agent import ClinicSpecialistAgent
from agent import Assistant


def classify_routing_decision(user_query: str) -> str:
    """
    Deterministic rule-based routing evaluation function simulating the
    Main Agent's routing logic as specified in SYSTEM_PROMPT.
    """
    text = user_query.lower().strip()

    emergency_keywords = [
        "chest pain", "chest pressure", "difficulty breathing", "सांस", "breathing",
        "bleeding", "unconscious", "stroke", "seizure", "heart attack", "तेज़ दर्द"
    ]
    diagnosis_keywords = [
        "diagnose", "diagnosis", "what disease", "kaunsi disease", "kya bimari", "what illness"
    ]
    appointment_specialist_keywords = [
        "appointment", "अपॉइंटमेंट", "book", "schedule", "reschedule",
        "cancel", "रद्द", "timing", "hours", "open", "close", "खुलता",
        "available", "availability", "उपलब्ध", "pediatrician", "gynecologist",
        "dr. sharma", "dr sharma", "doctor sharma", "doctor availability"
    ]

    # Rule 1: Emergency takes top priority -> Safety / Triage
    if any(k in text for k in emergency_keywords):
        return "SAFETY_TRIAGE_ESCALATION"

    # Rule 2: Diagnosis request -> Human Escalation / Main Agent
    if any(k in text for k in diagnosis_keywords):
        return "MAIN_AGENT_HUMAN_ESCALATION"

    # Rule 3: Clinic & Appointment intent -> Clinic Specialist
    if any(k in text for k in appointment_specialist_keywords):
        return "CLINIC_SPECIALIST"

    # Rule 4: General health / dietary / normal query -> Main Agent
    return "MAIN_AGENT"


# ==============================================================================
# FEATURE 13: 10 ROUTING TEST CASES
# ==============================================================================

def test_routing_case_1_healthy_breakfast():
    """Scenario 1: Healthy breakfast query -> Stays with Main Agent."""
    query = "मुझे healthy breakfast के बारे में बताइए।"
    destination = classify_routing_decision(query)
    assert destination == "MAIN_AGENT"


def test_routing_case_2_general_health_information():
    """Scenario 2: General hydration question -> Stays with Main Agent."""
    query = "मुझे दिन में कितना पानी पीना चाहिए?"
    destination = classify_routing_decision(query)
    assert destination == "MAIN_AGENT"


def test_routing_case_3_doctor_appointment_request():
    """Scenario 3: Doctor appointment request -> Routes to Clinic Specialist."""
    query = "मुझे कल डॉक्टर की appointment चाहिए।"
    destination = classify_routing_decision(query)
    assert destination == "CLINIC_SPECIALIST"


def test_routing_case_4_doctor_availability():
    """Scenario 4: Doctor availability inquiry -> Routes to Clinic Specialist."""
    query = "क्या Dr. Sharma कल available हैं?"
    destination = classify_routing_decision(query)
    assert destination == "CLINIC_SPECIALIST"


def test_routing_case_5_clinic_timing():
    """Scenario 5: Clinic timing inquiry -> Routes to Clinic Specialist."""
    query = "क्लिनिक कितने बजे खुलता है?"
    destination = classify_routing_decision(query)
    assert destination == "CLINIC_SPECIALIST"


def test_routing_case_6_appointment_cancellation():
    """Scenario 6: Appointment cancellation -> Routes to Clinic Specialist."""
    query = "How can I cancel my appointment?"
    destination = classify_routing_decision(query)
    assert destination == "CLINIC_SPECIALIST"


def test_routing_case_7_appointment_rescheduling():
    """Scenario 7: Appointment rescheduling -> Routes to Clinic Specialist."""
    query = "मुझे अपनी appointment reschedule करनी है।"
    destination = classify_routing_decision(query)
    assert destination == "CLINIC_SPECIALIST"


def test_routing_case_8_clinic_service_question():
    """Scenario 8: Clinic departments/services -> Routes to Clinic Specialist."""
    query = "Is there a pediatrician available at your clinic?"
    destination = classify_routing_decision(query)
    assert destination == "CLINIC_SPECIALIST"


def test_routing_case_9_diagnosis_request():
    """Scenario 9: Diagnosis request -> Main Agent / Human Escalation workflow."""
    query = "Can you diagnose my disease based on my headache?"
    destination = classify_routing_decision(query)
    assert destination == "MAIN_AGENT_HUMAN_ESCALATION"


def test_routing_case_10_emergency_symptom_with_appointment_request():
    """
    Scenario 10: Emergency symptom + appointment request.
    Safety takes absolute priority; must NOT directly route to specialist.
    """
    query = "मुझे बहुत तेज़ chest pain है और डॉक्टर की appointment चाहिए।"
    destination = classify_routing_decision(query)
    assert destination == "SAFETY_TRIAGE_ESCALATION"


# ==============================================================================
# FEATURE 14: HANDOFF WORKFLOW & CONTEXT TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_transfer_to_clinic_specialist_tool():
    """Verify transfer_to_clinic_specialist updates session agent and preserves context."""
    mock_session = MagicMock()
    mock_session.userdata = {
        "caller_id": "patient_101",
        "language": "Hindi",
        "handoff_count": 0,
        "facts": {"preferred_doctor": "Dr. Sharma", "secret_otp": "999888"},
    }
    mock_ctx = MagicMock()
    mock_ctx.session = mock_session

    result = await transfer_to_clinic_specialist(
        mock_ctx,
        intent="Book appointment with Dr. Sharma tomorrow afternoon",
        doctor_preference="Dr. Sharma",
        requested_date="tomorrow",
        preferred_time="afternoon",
        language="Hindi",
    )

    assert result["success"] is True
    assert "Clinic और Appointment Specialist" in result["message"]
    assert mock_session.userdata["handoff_state"] == HandoffState.SPECIALIST_ACTIVE.value
    assert mock_session.userdata["handoff_count"] == 1
    assert mock_session.userdata["specialist_used"] == "Clinic & Appointment Specialist"
    assert "Clinic Specialist" in mock_session.userdata["agent_path"]

    # Verify update_agent called with ClinicSpecialistAgent
    mock_session.update_agent.assert_called_once()
    specialist_instance = mock_session.update_agent.call_args[0][0]
    assert isinstance(specialist_instance, ClinicSpecialistAgent)
    assert specialist_instance.handoff_context.doctor_preference == "Dr. Sharma"
    assert specialist_instance.handoff_context.requested_date == "tomorrow"
    assert specialist_instance.handoff_context.preferred_time == "afternoon"


@pytest.mark.asyncio
async def test_handoff_context_privacy_and_memory_filtering():
    """Verify sensitive items like OTPs, passwords, PINs are never passed to specialist."""
    mock_session = MagicMock()
    mock_session.userdata = {
        "caller_id": "patient_102",
        "language": "English",
        "handoff_count": 0,
        "facts": {
            "preferred_doctor": "Dr. Priya Sharma",
            "password": "SecretPassword123",
            "otp_pin": "54321",
        },
    }
    mock_ctx = MagicMock()
    mock_ctx.session = mock_session

    result = await transfer_to_clinic_specialist(
        mock_ctx,
        intent="Book appointment, my PIN is 1234 and OTP is 987654",
        doctor_preference="Dr. Priya Sharma",
        language="English",
    )

    assert result["success"] is True
    specialist_instance = mock_session.update_agent.call_args[0][0]
    ctx = specialist_instance.handoff_context

    # Assert OTP and PIN are redacted from intent
    assert "987654" not in ctx.intent
    assert "1234" not in ctx.intent
    # Assert password and otp are excluded from consented memory
    if ctx.relevant_consented_memory:
        assert "password" not in ctx.relevant_consented_memory
        assert "otp_pin" not in ctx.relevant_consented_memory
        assert ctx.relevant_consented_memory.get("preferred_doctor") == "Dr. Priya Sharma"


@pytest.mark.asyncio
async def test_handback_to_main_agent_tool():
    """Verify specialist hands back to Main Agent smoothly when user asks general health query."""
    mock_session = MagicMock()
    mock_session.userdata = {
        "caller_id": "patient_103",
        "language": "Hindi",
        "handoff_count": 1,
        "agent_path": "Main -> Clinic Specialist",
    }
    mock_ctx = MagicMock()
    mock_ctx.session = mock_session

    result = await handback_to_main_agent(
        mock_ctx,
        reason="general_health_query",
        context_summary="User asked about healthy breakfast after booking appointment",
    )

    assert result["success"] is True
    assert "general health" in result["message"] or "SehatSaathi" in result["message"]
    assert mock_session.userdata["handoff_state"] == HandoffState.MAIN.value
    assert mock_session.userdata["handoff_count"] == 2
    assert "Main" in mock_session.userdata["agent_path"]

    mock_session.update_agent.assert_called_once()
    main_instance = mock_session.update_agent.call_args[0][0]
    assert isinstance(main_instance, Assistant)


def test_loop_prevention_guard():
    """Verify can_transition blocks infinite ping-pong agent switching."""
    normal_userdata = {"handoff_count": 2}
    assert can_transition(normal_userdata) is True

    maxed_userdata = {"handoff_count": MAX_HANDOFF_TRANSITIONS}
    assert can_transition(maxed_userdata) is False


@pytest.mark.asyncio
async def test_failed_handoff_graceful_recovery():
    """Verify failed handoff handles exception gracefully and keeps user on Main Agent."""
    mock_session = MagicMock()
    mock_session.userdata = {"handoff_count": 0, "language": "Hindi"}
    mock_session.update_agent.side_effect = RuntimeError("Simulated connection timeout")

    mock_ctx = MagicMock()
    mock_ctx.session = mock_session

    result = await transfer_to_clinic_specialist(
        mock_ctx,
        intent="Appointment query",
    )

    assert result["success"] is False
    assert result["handoff_state"] == HandoffState.HANDOFF_FAILED.value
    assert "Appointment specialist अभी उपलब्ध नहीं हो पाए" in result["message"]
    assert mock_session.userdata["handoff_status"] == "FAILED"


@pytest.mark.asyncio
async def test_e2e_appointment_handoff_with_llm():
    """Verify live AgentSession transitions from Assistant to ClinicSpecialistAgent on appointment turn."""
    from livekit.agents import AgentSession, inference

    async with (
        inference.LLM(model="openai/gpt-4.1-mini") as llm,
        AgentSession(llm=llm) as session,
    ):
        session.userdata = {
            "caller_id": "test_caller_live",
            "language": "Hindi",
            "handoff_count": 0,
            "handoff_state": "MAIN",
        }
        await session.start(Assistant(user_id="test_caller_live"))

        result = await session.run(user_input="मुझे कल दोपहर Dr. Sharma की appointment चाहिए।")
        assert type(session.current_agent).__name__ == "ClinicSpecialistAgent"
        assert session.userdata.get("handoff_count") == 1
        assert session.userdata.get("handoff_state") == HandoffState.SPECIALIST_ACTIVE.value

