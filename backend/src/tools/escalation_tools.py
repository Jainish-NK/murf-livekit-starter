import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from livekit.agents import RunContext, function_tool

try:
    from tools.privacy import sanitize_text
    from tools.email_service import send_escalation_email
except ImportError:
    from src.tools.privacy import sanitize_text
    from src.tools.email_service import send_escalation_email

logger = logging.getLogger("escalation")

# ---------------------------------------------------------
# DATABASE SETUP
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "memory.db"


def get_connection() -> sqlite3.Connection:
    """Get SQLite database connection for escalations."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def init_escalation_db() -> None:
    """Ensure the escalations table exists with email_sent tracking."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS escalations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_id TEXT UNIQUE NOT NULL,
                caller_id TEXT,
                reason TEXT NOT NULL,
                summary TEXT NOT NULL,
                what_agent_checked TEXT,
                urgency TEXT NOT NULL,
                language TEXT,
                preferred_followup TEXT,
                status TEXT NOT NULL DEFAULT 'OPEN',
                created_at TEXT NOT NULL,
                email_sent INTEGER DEFAULT 0
            )
            """
        )
        # Migrate schema if table previously existed without email_sent
        cursor = conn.execute("PRAGMA table_info(escalations)")
        columns = [row["name"] for row in cursor.fetchall()]
        if "email_sent" not in columns:
            conn.execute("ALTER TABLE escalations ADD COLUMN email_sent INTEGER DEFAULT 0")
        conn.commit()


def generate_reference_id() -> str:
    """
    Generate a sequential, collision-free human escalation reference ID.
    Format: ESC-{YEAR}-{001}
    Example: ESC-2026-001
    """
    init_escalation_db()
    current_year = datetime.now(timezone.utc).year

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) AS total
            FROM escalations
            WHERE reference_id LIKE ?
            """,
            (f"ESC-{current_year}-%",),
        ).fetchone()

        count = (row["total"] if row else 0) + 1
        return f"ESC-{current_year}-{count:03d}"


def save_escalation(
    reference_id: str,
    reason: str,
    summary: str,
    what_agent_checked: str,
    urgency: str,
    language: str,
    preferred_followup: str,
    caller_id: str | None = None,
    email_sent: bool = False,
) -> dict[str, Any]:
    """Store escalation record into SQLite."""
    init_escalation_db()
    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO escalations (
                reference_id,
                caller_id,
                reason,
                summary,
                what_agent_checked,
                urgency,
                language,
                preferred_followup,
                status,
                created_at,
                email_sent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
            """,
            (
                reference_id,
                caller_id or "Caller",
                reason,
                summary,
                what_agent_checked,
                urgency,
                language,
                preferred_followup,
                created_at,
                1 if email_sent else 0,
            ),
        )
        conn.commit()

    return {
        "reference_id": reference_id,
        "reason": reason,
        "summary": summary,
        "what_agent_checked": what_agent_checked,
        "urgency": urgency,
        "language": language,
        "preferred_followup": preferred_followup,
        "status": "OPEN",
        "created_at": created_at,
        "email_sent": email_sent,
    }


# ---------------------------------------------------------
# FUNCTION TOOL FOR LIVEKIT AGENT
# ---------------------------------------------------------
@function_tool()
async def create_escalation(
    context: RunContext,
    reason: str,
    summary: str,
    what_agent_checked: str,
    urgency: str = "HIGH",
    language: str = "Hindi",
    preferred_followup: str = "Phone",
) -> dict[str, Any]:
    """
    Create a human healthcare escalation request and notify the support team via email.

    CRITICAL RULES BEFORE CALLING THIS TOOL:
    1. NEVER call this tool without explicit user permission.
    2. Explain why human help is appropriate and what information will be shared
       (a short summary of what happened, urgency level, language, and preferred follow-up).
    3. Explicitly ask: 'Would you like me to create the human support request?'
    4. Call ONLY after receiving a clear, affirmative confirmation ('Yes', 'Yes please', 'Go ahead', 'Please create the request', 'हाँ, बना दीजिए').
    5. NEVER call if the user said 'No' or gave an ambiguous answer ('Maybe', 'Hmm', 'Whatever', 'Okay').
    6. Never include passwords, OTPs, PINs, card numbers, or unnecessary private secrets in the summary.

    Parameters:
    - reason: 'RED_FLAG_SYMPTOM' (e.g. severe chest pain, breathing difficulty) or 'DIAGNOSIS_REQUEST' (user asking to be diagnosed).
    - summary: Short, concise summary of the caller's situation (e.g. 'Caller reported severe chest pain and difficulty breathing.').
    - what_agent_checked: What the agent or triage checked (e.g. 'Existing triage identified the symptoms as potentially urgent.').
    - urgency: 'EMERGENCY' for red-flag symptoms, 'HIGH' or 'MEDIUM' for diagnosis requests, 'LOW' for general queries.
    - language: Caller's spoken language (e.g. 'Hindi', 'English', 'Gujarati').
    - preferred_followup: Preferred contact method (e.g. 'Phone', 'In-Person', 'Clinic Visit').
    """
    logger.info(
        "[ESCALATION] Trigger detected - Reason: %s, Urgency: %s",
        reason,
        urgency,
    )
    logger.info("[ESCALATION] Permission granted")

    # 1. Sanitize summary and what_agent_checked for privacy protection
    sanitized_summary = sanitize_text(summary)
    sanitized_checked = sanitize_text(what_agent_checked)
    logger.info("[ESCALATION] Summary sanitized")

    # 2. Normalize urgency
    urgency_clean = urgency.upper().strip()
    if urgency_clean not in {"EMERGENCY", "HIGH", "MEDIUM", "LOW"}:
        urgency_clean = "HIGH"

    # 3. Generate unique sequential Reference ID
    reference_id = generate_reference_id()
    logger.info("[ESCALATION] Reference created: %s", reference_id)

    # 4. Extract caller identifier if available
    caller_id = "Caller"
    session = getattr(context, "session", None)
    if session:
        userdata = getattr(session, "userdata", None)
        if isinstance(userdata, dict) and userdata.get("caller_id"):
            caller_id = userdata["caller_id"]

    # 5. Send Email to Human Support Team
    email_success = await send_escalation_email(
        reference_id=reference_id,
        reason=reason,
        summary=sanitized_summary,
        what_agent_checked=sanitized_checked,
        urgency=urgency_clean,
        language=language,
        preferred_followup=preferred_followup,
    )

    # 6. Save in SQLite
    save_escalation(
        reference_id=reference_id,
        reason=reason,
        summary=sanitized_summary,
        what_agent_checked=sanitized_checked,
        urgency=urgency_clean,
        language=language,
        preferred_followup=preferred_followup,
        caller_id=caller_id,
        email_sent=email_success,
    )

    # 7. Return outcome
    if not email_success:
        return {
            "success": False,
            "email_sent": False,
            "error": "EMAIL_FAILED",
            "reference_id": reference_id,
            "message": (
                "I couldn't send the support request email right now. "
                "Please try again, and if this is an emergency, "
                "seek appropriate medical help directly rather than waiting for the request."
            ),
        }

    return {
        "success": True,
        "email_sent": True,
        "reference_id": reference_id,
        "status": "OPEN",
        "urgency": urgency_clean,
        "message": (
            f"Your request has been created successfully. Your reference ID is {reference_id}. "
            "I've sent the summary to the support team for review. I can't promise an immediate response, "
            "but you can use this reference ID when following up."
        ),
    }
