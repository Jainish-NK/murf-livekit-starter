import logging
from typing import Any
from livekit.agents import RunContext, function_tool
from src.outbound.outbound_database import (
    record_opt_out,
    log_adherence,
    update_call_outcome,
)

logger = logging.getLogger("outbound_tools")


@function_tool()
async def opt_out_patient(
    context: RunContext,
    reason: str | None = "Caller requested opt-out",
) -> dict[str, Any]:
    """
    Opt out the current patient from all future outbound automated calls.

    USE THIS IMMEDIATELY when the patient says 'stop', 'don't call me', 'remove me',
    'कॉल बंद करो', 'कॉल मत करना', or expresses any desire to stop receiving automated calls.

    This tool permanently marks the phone number on the Do-Not-Call list and prevents retries.
    """
    userdata = getattr(context.session, "userdata", {}) or {}
    phone_number = userdata.get("phone_number") or userdata.get("caller_id") or "unknown_number"
    patient_name = userdata.get("patient_name", "Caller")
    call_id = userdata.get("call_id")

    logger.info("Processing opt-out request for %s (%s)", patient_name, phone_number)
    result = record_opt_out(
        phone_number=phone_number,
        patient_name=patient_name,
        reason=reason,
    )

    if call_id:
        update_call_outcome(
            call_id=call_id,
            outcome="opted_out",
            notes=f"Patient opted out: {reason}",
        )

    return {
        "success": True,
        "opted_out": True,
        "message": (
            "Patient has been successfully opted out. Inform the caller politely that "
            "their request is recorded and they will receive no further automated calls."
        ),
    }


@function_tool()
async def record_medication_intake(
    context: RunContext,
    status: str,
    medication_name: str | None = None,
    notes: str | None = None,
) -> dict[str, Any]:
    """
    Record whether the patient has taken their scheduled medication or completed their vaccination.

    Args:
        status: One of 'taken', 'missed', 'postponed', 'already_done', 'refused'.
        medication_name: Name of medicine or vaccine (e.g. 'Metformin', 'BP tablet', 'Booster vaccine').
        notes: Optional extra notes provided by patient (e.g. 'taken with breakfast').
    """
    userdata = getattr(context.session, "userdata", {}) or {}
    phone_number = userdata.get("phone_number") or userdata.get("caller_id") or "unknown"
    patient_name = userdata.get("patient_name", "Patient")
    med_item = medication_name or userdata.get("medication_name") or "Scheduled Medication"

    logger.info("Recording medication adherence: %s - %s: %s", patient_name, med_item, status)
    result = log_adherence(
        phone_number=phone_number,
        patient_name=patient_name,
        item_name=med_item,
        status=status,
        notes=notes,
    )

    return {
        "success": True,
        "recorded_status": status,
        "item": med_item,
        "message": f"Adherence record logged as '{status}'.",
    }


@function_tool()
async def schedule_followup_reminder(
    context: RunContext,
    preferred_time: str,
    notes: str | None = None,
) -> dict[str, Any]:
    """
    Record the patient's preferred callback or reminder time when they ask to be contacted later.

    This records the patient's callback preference in clinic records. It does not promise
    an automatic outbound dial unless confirmed by the clinic team.

    Args:
        preferred_time: When the patient prefers to be contacted (e.g. 'in 2 hours', 'evening 6 PM', 'tomorrow morning').
        notes: Context or details regarding the callback request.
    """
    userdata = getattr(context.session, "userdata", {}) or {}
    phone_number = userdata.get("phone_number") or userdata.get("caller_id") or "unknown"
    patient_name = userdata.get("patient_name", "Patient")

    logger.info("Recording callback preference for %s at %s", patient_name, preferred_time)
    log_adherence(
        phone_number=phone_number,
        patient_name=patient_name,
        item_name="Callback Preference",
        status="requested",
        notes=f"Preferred time: {preferred_time}. Notes: {notes or 'None'}",
    )

    return {
        "success": True,
        "preferred_time": preferred_time,
        "message": (
            f"Callback preference recorded for {preferred_time}. "
            "Politely inform the patient that their preferred callback time has been noted."
        ),
    }

