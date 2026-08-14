import sqlite3
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from memory.database import get_connection, init_database
except ImportError:
    from src.memory.database import get_connection, init_database


def mask_caller_id(caller_id: str | None) -> str:
    """
    Mask phone numbers / SIP identities for privacy, e.g. +919876543210 -> +91******3210.
    Identifies browser-based clients and maps them to 'Browser User'.
    """
    if not caller_id:
        return "Browser User"

    caller_id = str(caller_id).strip()

    # Detect browser/UUID strings
    if (
        "voice_assistant_room" in caller_id
        or "day7_user" in caller_id
        or "day8_user" in caller_id
        or len(caller_id) > 20
    ):
        return "Browser User"

    # Normalize out prefix prefixes
    clean_id = caller_id
    if clean_id.startswith("phone_"):
        clean_id = "+" + clean_id[6:]
    elif clean_id.startswith("sip_"):
        clean_id = clean_id[4:]

    # Mask phone number format
    digits = [c for c in clean_id if c.isdigit()]
    if len(digits) >= 7:
        if clean_id.startswith("+"):
            return clean_id[:3] + "******" + clean_id[-4:]
        else:
            return clean_id[:2] + "******" + clean_id[-4:]

    if clean_id in {"user", "participant", "day7_user", "day8_user", "Browser User"}:
        return "Browser User"

    return clean_id


def log_call_start(call_id: str, caller_id: str, call_mode: str) -> None:
    """
    Record call initiation. Defaults outcome to 'failed' and failure_reason to 'INCOMPLETE_TASK'
    until the session successfully reaches a success path.
    """
    init_database()
    masked_id = mask_caller_id(caller_id)
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO call_analytics (
                call_id, caller_id, call_mode, language, start_time,
                end_time, duration, status, outcome, failure_reason,
                success_reason, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(call_id) DO UPDATE SET
                caller_id = excluded.caller_id,
                call_mode = excluded.call_mode,
                status = excluded.status
            """,
            (
                call_id,
                masked_id,
                call_mode,
                "Unknown",
                now,
                None,
                0,
                "in_progress",
                "failed",
                "INCOMPLETE_TASK",
                None,
                now,
            ),
        )
        conn.commit()


def log_call_end(
    call_id: str,
    outcome: str,
    failure_reason: str | None = None,
    success_reason: str | None = None,
    language: str | None = None,
    handoff_count: int = 0,
    specialist_used: str | None = None,
    agent_path: str | None = None,
    handoff_status: str | None = None,
    specialist_task: str | None = None,
) -> None:
    """
    Compute call duration and record final status, outcome, and metadata including handoffs.
    """
    init_database()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    with get_connection() as conn:
        row = conn.execute(
            "SELECT start_time FROM call_analytics WHERE call_id = ?", (call_id,)
        ).fetchone()

        duration = 0
        if row and row["start_time"]:
            try:
                start_dt = datetime.fromisoformat(row["start_time"])
                duration = int((now - start_dt).total_seconds())
            except Exception:
                pass

        # Update call analytics
        conn.execute(
            """
            UPDATE call_analytics
            SET end_time = ?,
                duration = ?,
                status = 'completed',
                outcome = ?,
                failure_reason = ?,
                success_reason = ?,
                language = COALESCE(?, language),
                handoff_count = ?,
                specialist_used = ?,
                agent_path = ?,
                handoff_status = ?,
                specialist_task = ?
            WHERE call_id = ?
            """,
            (
                now_iso,
                duration,
                outcome,
                failure_reason if outcome == "failed" else None,
                success_reason if outcome == "success" else None,
                language,
                handoff_count,
                specialist_used,
                agent_path,
                handoff_status,
                specialist_task,
                call_id,
            ),
        )
        conn.commit()


def get_call_analytics() -> dict[str, Any]:
    """
    Get summary stats of all calls.
    """
    init_database()
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM call_analytics").fetchone()[0]
        successful = conn.execute(
            "SELECT COUNT(*) FROM call_analytics WHERE outcome = 'success'"
        ).fetchone()[0]
        failed = conn.execute(
            "SELECT COUNT(*) FROM call_analytics WHERE outcome = 'failed'"
        ).fetchone()[0]

        total_handoffs = conn.execute(
            "SELECT COALESCE(SUM(handoff_count), 0) FROM call_analytics"
        ).fetchone()[0]
        successful_handoffs = conn.execute(
            "SELECT COUNT(*) FROM call_analytics WHERE handoff_status = 'SUCCESS'"
        ).fetchone()[0]
        failed_handoffs = conn.execute(
            "SELECT COUNT(*) FROM call_analytics WHERE handoff_status = 'FAILED'"
        ).fetchone()[0]

        success_rate = 0
        if total > 0:
            success_rate = int((successful / total) * 100)

        return {
            "total_calls": total,
            "successful_calls": successful,
            "failed_calls": failed,
            "success_rate": success_rate,
            "total_handoffs": int(total_handoffs),
            "successful_handoffs": int(successful_handoffs),
            "failed_handoffs": int(failed_handoffs),
        }


def get_call_history() -> list[dict[str, Any]]:
    """
    Retrieve latest 50 call history items.
    """
    init_database()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT call_id, caller_id, call_mode, language, start_time, end_time, duration, status, outcome, failure_reason, success_reason,
                   handoff_count, specialist_used, agent_path, handoff_status, specialist_task
            FROM call_analytics
            ORDER BY start_time DESC
            LIMIT 50
            """
        ).fetchall()
        return [dict(r) for r in rows]


def get_failure_breakdown() -> dict[str, int]:
    """
    Retrieve counts grouped by failure reason.
    """
    init_database()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT failure_reason, COUNT(*) 
            FROM call_analytics 
            WHERE outcome = 'failed' 
            GROUP BY failure_reason
            """
        ).fetchall()
        return {row[0] or "UNKNOWN": row[1] for row in rows}


def classify_call_outcome(
    session_success: bool,
    success_reason: str | None,
    failure_reason: str | None,
    details: str,
    user_messages: list[str],
    assistant_messages: list[str],
    ev_error: str | None = None,
) -> tuple[str, str | None, str | None, str]:
    """
    Classify the outcome of a call based on session state, transcript, and errors.
    Returns (outcome, success_reason, failure_reason, details)
    """
    if ev_error:
        err_msg = str(ev_error).lower()
        if (
            "api" in err_msg
            or "google" in err_msg
            or "deepgram" in err_msg
            or "murf" in err_msg
        ):
            return "failed", None, "API_ERROR", f"Session error: {ev_error}"
        return "failed", None, "TOOL_FAILURE", f"Session error: {ev_error}"

    if session_success:
        return "success", success_reason, None, details

    if failure_reason == "TOOL_FAILURE":
        return "failed", None, "TOOL_FAILURE", details

    if not user_messages:
        return "failed", None, "NO_RESPONSE", "Caller did not speak"

    # Check for silence timeout in assistant messages
    has_silence_timeout = any(
        "लगता है लाइन ठीक नहीं है" in msg for msg in assistant_messages
    )
    if has_silence_timeout:
        return "failed", None, "SILENCE_TIMEOUT", "Call disconnected due to user silence"

    user_text = " ".join(user_messages).lower()

    guidance_keywords = [
        "breakfast",
        "healthy",
        "diet",
        "food",
        "nutrition",
        "eat",
        "नाश्ता",
        "स्वस्थ",
        "आहार",
        "भोजन",
        "सलाह",
        "दवा",
        "बीमारी",
        "doctor",
        "medical",
        "symptom",
        "pain",
        "fever",
        "cough",
        "hospital",
        "दर्द",
        "बुखार",
        "खांसी",
        "अस्पताल",
        "इलाज",
        "तबीयत",
    ]

    clinic_keywords = [
        "time",
        "timing",
        "hour",
        "open",
        "close",
        "schedule",
        "service",
        "department",
        "location",
        "address",
        "phone",
        "contact",
        "reception",
        "clinic",
        "समय",
        "घंटे",
        "खुलने",
        "बंद",
        "सेवा",
        "विभाग",
        "पता",
        "संपर्क",
        "फोन",
        "क्लीनिक",
    ]

    appointment_keywords = [
        "appointment",
        "book",
        "reserve",
        "reschedule",
        "doctor visit",
        "अपॉइंटमेंट",
        "बुक",
        "मिलना",
    ]

    has_guidance_query = any(kw in user_text for kw in guidance_keywords)
    has_clinic_query = any(kw in user_text for kw in clinic_keywords)
    has_appointment_query = any(kw in user_text for kw in appointment_keywords)

    assistant_offered_escalation = any(
        "human support request" in msg or "सपोर्ट टीम" in msg or "मदद" in msg
        for msg in assistant_messages
    )
    user_declined = any(w in user_text for w in ["नहीं", "don't", "no", "stop", "बंद"])

    assistant_text = " ".join(assistant_messages).lower()
    has_apt_confirmation = any(
        kw in assistant_text
        for kw in ["apt-", "confirmed", "rescheduled", "cancelled", "पुष्टि", "तय", "रद्द"]
    )

    if assistant_offered_escalation and user_declined:
        return "failed", None, "INCOMPLETE_TASK", "User declined human escalation offer"
    elif has_appointment_query and has_apt_confirmation:
        return "success", "APPOINTMENT_BOOKED", None, "Appointment request completed successfully"
    elif has_appointment_query:
        return "failed", None, "INCOMPLETE_TASK", "Appointment request initiated but incomplete"
    elif assistant_messages and has_guidance_query:
        return "success", "SAFE_GUIDANCE", None, "Provided safe health guidance to caller"
    elif assistant_messages and has_clinic_query:
        return "success", "CLINIC_INFORMATION", None, "Provided clinic information to caller"
    else:
        return (
            "failed",
            None,
            "USER_HANGUP",
            "Call ended without reaching a useful outcome",
        )

