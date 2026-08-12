import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

# Ensure backend and backend/src are on sys.path
backend_dir = Path(__file__).resolve().parents[1]
src_dir = backend_dir / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from tools.privacy import sanitize_text
from tools.escalation_tools import (
    create_escalation,
    generate_reference_id,
    save_escalation,
    init_escalation_db,
    get_connection,
)
from tools.email_service import send_escalation_email
from tools.healthcare_tools import check_triage_level


def test_privacy_sanitizer_redacts_otp():
    """Verify that OTP numbers are sanitized from strings."""
    input_text = "My OTP is 482931 and I have chest pain."
    sanitized = sanitize_text(input_text)
    assert "482931" not in sanitized
    assert "chest pain" in sanitized


def test_privacy_sanitizer_redacts_passwords_and_pins():
    """Verify passwords, PINs, and card numbers are redacted."""
    sample = "My password is SuperSecret123 and pin is 9988."
    sanitized = sanitize_text(sample)
    assert "SuperSecret123" not in sanitized
    assert "9988" not in sanitized


def test_reference_id_format():
    """Verify reference ID matches ESC-YYYY-XXX format."""
    init_escalation_db()
    ref_id = generate_reference_id()
    assert ref_id.startswith("ESC-")
    parts = ref_id.split("-")
    assert len(parts) == 3
    assert len(parts[1]) == 4  # Year
    assert len(parts[2]) == 3  # 001, 002...


def test_save_escalation_in_sqlite():
    """Verify escalation is persisted with OPEN status."""
    init_escalation_db()
    ref_id = generate_reference_id()
    saved = save_escalation(
        reference_id=ref_id,
        reason="RED_FLAG_SYMPTOM",
        summary="Caller reported severe chest pain.",
        what_agent_checked="Triage detected emergency chest pain.",
        urgency="EMERGENCY",
        language="Hindi",
        preferred_followup="Phone",
        caller_id="test_patient_1",
        email_sent=True,
    )

    assert saved["reference_id"] == ref_id
    assert saved["status"] == "OPEN"
    assert saved["urgency"] == "EMERGENCY"
    assert saved["email_sent"] is True

    # Check database query
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM escalations WHERE reference_id = ?",
            (ref_id,),
        ).fetchone()
        assert row is not None
        assert row["reason"] == "RED_FLAG_SYMPTOM"
        assert row["status"] == "OPEN"
        assert row["email_sent"] == 1


@pytest.mark.asyncio
async def test_email_configuration_missing_handled_gracefully():
    """Verify missing email configuration returns False without crashing."""
    with patch.dict(os.environ, {
        "ESCALATION_EMAIL_TO": "",
        "ESCALATION_EMAIL_FROM": "",
        "SMTP_HOST": "",
    }):
        result = await send_escalation_email(
            reference_id="ESC-2026-999",
            reason="RED_FLAG_SYMPTOM",
            summary="Emergency summary",
            what_agent_checked="Checked triage",
            urgency="EMERGENCY",
            language="Hindi",
            preferred_followup="Phone",
        )
        assert result is False


@pytest.mark.asyncio
async def test_email_send_success_mocked():
    """Verify successful SMTP dispatch when email helper succeeds."""
    with patch.dict(os.environ, {
        "ESCALATION_EMAIL_TO": "support@example.com",
        "ESCALATION_EMAIL_FROM": "agent@example.com",
        "SMTP_HOST": "smtp.example.com",
        "SMTP_PORT": "587",
        "SMTP_USERNAME": "user@example.com",
        "SMTP_PASSWORD": "password123",
    }):
        with patch("tools.email_service._send_email_sync", return_value=True):
            result = await send_escalation_email(
                reference_id="ESC-2026-001",
                reason="Red-Flag Symptom",
                summary="Caller reported chest pain.",
                what_agent_checked="Triage emergency",
                urgency="EMERGENCY",
                language="Hindi",
                preferred_followup="Phone",
            )
            assert result is True


@pytest.mark.asyncio
async def test_create_escalation_tool_success():
    """Verify create_escalation tool returns reference ID and success when email succeeds."""
    mock_context = MagicMock()
    mock_context.session = MagicMock()
    mock_context.session.userdata = {"caller_id": "test_caller_42"}

    with patch("tools.escalation_tools.send_escalation_email", new=AsyncMock(return_value=True)):
        result = await create_escalation(
            mock_context,
            reason="RED_FLAG_SYMPTOM",
            summary="Caller has chest pain. OTP is 123456.",
            what_agent_checked="Triage marked emergency",
            urgency="EMERGENCY",
            language="Hindi",
            preferred_followup="Phone",
        )
        assert result["success"] is True
        assert result["email_sent"] is True
        assert "reference_id" in result
        assert result["reference_id"].startswith("ESC-")
        assert "Your request has been created successfully." in result["message"]


@pytest.mark.asyncio
async def test_create_escalation_tool_email_failure_graceful():
    """Verify create_escalation tool handles email failure gracefully and returns failure message."""
    mock_context = MagicMock()
    mock_context.session = MagicMock()
    mock_context.session.userdata = {}

    with patch("tools.escalation_tools.send_escalation_email", new=AsyncMock(return_value=False)):
        result = await create_escalation(
            mock_context,
            reason="DIAGNOSIS_REQUEST",
            summary="User asked for disease diagnosis.",
            what_agent_checked="Refused diagnosis",
            urgency="MEDIUM",
            language="English",
            preferred_followup="Phone",
        )
        assert result["success"] is False
        assert result["email_sent"] is False
        assert result["error"] == "EMAIL_FAILED"
        assert "couldn't send the support request email" in result["message"]


@pytest.mark.asyncio
async def test_triage_emergency_detection():
    """Verify triage tool correctly flags emergency red-flags."""
    result = await check_triage_level(None, "I have severe chest pain and cannot breathe")
    assert result["success"] is True
    assert result["triage_level"] == "emergency"
    assert "chest pain" in result["matched_red_flags"]

    routine_res = await check_triage_level(None, "I have a mild headache since yesterday")
    assert routine_res["success"] is True
    assert routine_res["triage_level"] == "routine"
