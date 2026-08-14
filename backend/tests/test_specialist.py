import sys
from pathlib import Path
from unittest.mock import MagicMock
import pytest

# Ensure backend and backend/src are on sys.path
backend_dir = Path(__file__).resolve().parents[1]
src_dir = backend_dir / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from tools.clinic_tools import (
    init_clinic_db,
    get_clinic_info_and_timings,
    check_doctor_availability,
    book_appointment,
    reschedule_appointment,
    cancel_appointment,
    CLINIC_DETAILS,
)
from specialist_agents.clinic_agent import ClinicSpecialistAgent, build_specialist_instructions
from tools.handoff_tools import HandoffContext, HandoffState


@pytest.fixture(autouse=True)
def setup_db():
    init_clinic_db()


@pytest.mark.asyncio
async def test_get_clinic_info_and_timings():
    """Verify clinic timing and departments retrieval."""
    mock_ctx = MagicMock()
    result = await get_clinic_info_and_timings(mock_ctx)
    assert result["success"] is True
    assert result["clinic_name"] == "Sunrise Family Clinic"
    assert "9:00 AM to 7:00 PM" in result["clinic_hours"]
    assert "General Medicine" in result["departments"]
    assert len(result["doctors"]) >= 3


@pytest.mark.asyncio
async def test_get_clinic_info_department_filter():
    """Verify clinic timings filtered by department."""
    mock_ctx = MagicMock()
    result = await get_clinic_info_and_timings(mock_ctx, department="Pediatrics")
    assert result["success"] is True
    assert len(result["doctors"]) == 1
    assert result["doctors"][0]["name"] == "Dr. Priya Sharma"


@pytest.mark.asyncio
async def test_check_doctor_availability_found():
    """Verify doctor availability for Dr. Sharma."""
    mock_ctx = MagicMock()
    result = await check_doctor_availability(mock_ctx, doctor_name="Dr. Sharma", preferred_date="tomorrow")
    assert result["success"] is True
    assert result["doctor_name"] == "Dr. Sharma"
    assert result["department"] == "General Medicine"
    assert len(result["available_slots"]) > 0


@pytest.mark.asyncio
async def test_check_doctor_availability_not_found():
    """Verify check_doctor_availability returns polite failure when doctor is not on roster."""
    mock_ctx = MagicMock()
    result = await check_doctor_availability(mock_ctx, doctor_name="Dr. NonExistent")
    assert result["success"] is False
    assert "not found" in result["message"].lower()
    assert "Dr. Sharma" in result["available_doctors"]


@pytest.mark.asyncio
async def test_book_reschedule_cancel_appointment_flow():
    """Verify complete appointment booking, rescheduling, and cancellation workflow."""
    mock_ctx = MagicMock()
    mock_ctx.session = MagicMock()
    mock_ctx.session.userdata = {"caller_id": "test_caller_99"}

    # 1. Book appointment
    book_res = await book_appointment(
        mock_ctx,
        patient_name="Ramesh Patel",
        doctor_name="Dr. Sharma",
        preferred_date="2026-08-16",
        preferred_time="10:30 AM",
        department="General Medicine",
        reason="Routine Checkup",
    )
    assert book_res["success"] is True
    assert "appointment_id" in book_res
    apt_id = book_res["appointment_id"]
    assert apt_id.startswith("APT-")
    assert book_res["status"] == "CONFIRMED"
    assert mock_ctx.session.userdata.get("specialist_task") == "APPOINTMENT_BOOKED"

    # 2. Reschedule appointment
    resched_res = await reschedule_appointment(
        mock_ctx,
        appointment_id=apt_id,
        new_date="2026-08-17",
        new_time="04:30 PM",
    )
    assert resched_res["success"] is True
    assert resched_res["status"] == "RESCHEDULED"
    assert resched_res["new_date"] == "2026-08-17"
    assert mock_ctx.session.userdata.get("specialist_task") == "APPOINTMENT_RESCHEDULED"

    # 3. Cancel appointment
    cancel_res = await cancel_appointment(
        mock_ctx,
        appointment_id=apt_id,
        reason="Schedule conflict",
    )
    assert cancel_res["success"] is True
    assert cancel_res["status"] == "CANCELLED"
    assert mock_ctx.session.userdata.get("specialist_task") == "APPOINTMENT_CANCELLED"


def test_clinic_specialist_agent_boundaries():
    """Verify ClinicSpecialistAgent prompt defines strict limits and no diagnosis."""
    ctx = HandoffContext(
        intent="Book consultation with pediatrician",
        doctor_preference="Dr. Priya Sharma",
        requested_date="tomorrow",
        preferred_time="11:30 AM",
        language="Hindi",
    )
    agent = ClinicSpecialistAgent(handoff_context=ctx)
    instructions = agent.instructions

    # Verify identity & limits
    assert "Clinic & Appointment Specialist" in instructions
    assert "NEVER diagnose diseases" in instructions
    assert "NEVER prescribe medications" in instructions
    assert "Dr. Priya Sharma" in instructions
    assert "tomorrow" in instructions
    assert "11:30 AM" in instructions
    assert "Devanagari" in instructions


def test_specialist_instructions_builder_without_context():
    """Verify fallback instructions when handoff context is empty."""
    instructions = build_specialist_instructions(None)
    assert "Clinic & Appointment Specialist" in instructions
    assert "NEVER diagnose" in instructions


def test_specialist_murf_nikhil_voice_configuration():
    """Verify ClinicSpecialistAgent creates Murf Nikhil with FALCON, hi-IN, Conversational, and 24000Hz."""
    from specialist_agents.clinic_agent import create_specialist_tts
    from unittest.mock import patch

    with patch.dict("os.environ", {"MURF_API_KEY": "test_murf_key_123"}):
        # Hindi Specialist TTS
        tts_hindi = create_specialist_tts(language="Hindi")
        assert tts_hindi._opts.voice == "Nikhil"
        assert tts_hindi._opts.model == "FALCON"
        assert tts_hindi._opts.locale == "hi-IN"
        assert tts_hindi._opts.style == "Conversational"
        assert tts_hindi._opts.sample_rate == 24000

        # English Specialist TTS
        tts_english = create_specialist_tts(language="English")
        assert tts_english._opts.voice == "Nikhil"
        assert tts_english._opts.model == "FALCON"
        assert tts_english._opts.locale == "en-IN"
        assert tts_english._opts.style == "Conversational"


def test_main_agent_murf_anisha_voice_configuration():
    """Verify Main Agent Assistant uses Murf Anisha voice."""
    from agent import create_main_tts
    from unittest.mock import patch

    with patch.dict("os.environ", {"MURF_API_KEY": "test_murf_key_123"}):
        main_tts = create_main_tts()
        assert main_tts._opts.voice == "Anisha"
        assert main_tts._opts.style == "Conversation"

