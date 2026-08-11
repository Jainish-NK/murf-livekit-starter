import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
OUTBOUND_DB_PATH = DATA_DIR / "outbound_calls.db"


def get_outbound_connection() -> sqlite3.Connection:
    """
    Create and return a connection to data/outbound_calls.db.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(OUTBOUND_DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def init_outbound_database() -> None:
    """
    Initialize the tables in outbound_calls.db.
    """
    with get_outbound_connection() as conn:
        # Table 1: Outbound call history and outcomes
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS outbound_calls (
                call_id TEXT PRIMARY KEY,
                phone_number TEXT NOT NULL,
                patient_name TEXT,
                call_type TEXT NOT NULL,
                details TEXT,
                status TEXT NOT NULL,
                outcome TEXT,
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 2,
                last_attempt_at TEXT,
                created_at TEXT NOT NULL,
                notes TEXT
            )
            """
        )

        # Table 2: Do Not Call / Opt-Out List (Strict enforcement)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS opt_out_list (
                phone_number TEXT PRIMARY KEY,
                patient_name TEXT,
                opted_out_at TEXT NOT NULL,
                reason TEXT
            )
            """
        )

        # Table 3: Medication / Followup adherence logs
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS outbound_adherence_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT,
                patient_name TEXT,
                item_name TEXT,
                status TEXT,
                notes TEXT,
                logged_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def is_opted_out(phone_number: str) -> bool:
    """
    Check if a phone number has requested to opt out of outbound calls.
    """
    init_outbound_database()
    normalized = phone_number.strip().replace(" ", "").replace("-", "")
    with get_outbound_connection() as conn:
        row = conn.execute(
            "SELECT phone_number FROM opt_out_list WHERE phone_number = ?",
            (normalized,),
        ).fetchone()
        return row is not None


def record_opt_out(
    phone_number: str,
    patient_name: str | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    """
    Register a phone number onto the permanent opt-out list.
    """
    init_outbound_database()
    normalized = phone_number.strip().replace(" ", "").replace("-", "")
    timestamp = datetime.now(timezone.utc).isoformat()

    with get_outbound_connection() as conn:
        conn.execute(
            """
            INSERT INTO opt_out_list (phone_number, patient_name, opted_out_at, reason)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(phone_number) DO UPDATE SET
                opted_out_at = excluded.opted_out_at,
                reason = excluded.reason
            """,
            (normalized, patient_name, timestamp, reason or "Caller requested opt-out"),
        )
        conn.commit()

    return {
        "success": True,
        "phone_number": normalized,
        "opted_out_at": timestamp,
        "message": "Opt-out recorded successfully. No further calls will be placed.",
    }


def log_outbound_call(
    call_id: str,
    phone_number: str,
    patient_name: str,
    call_type: str,
    details: str | None = None,
    max_retries: int = 2,
) -> dict[str, Any]:
    """
    Log an outbound call attempt upon initiation.
    """
    init_outbound_database()
    normalized = phone_number.strip().replace(" ", "").replace("-", "")
    now = datetime.now(timezone.utc).isoformat()

    with get_outbound_connection() as conn:
        conn.execute(
            """
            INSERT INTO outbound_calls (
                call_id, phone_number, patient_name, call_type, details,
                status, outcome, retry_count, max_retries, last_attempt_at,
                created_at, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
            ON CONFLICT(call_id) DO UPDATE SET
                phone_number = excluded.phone_number,
                patient_name = excluded.patient_name,
                call_type = excluded.call_type,
                details = excluded.details,
                last_attempt_at = excluded.last_attempt_at
            """,
            (
                call_id,
                normalized,
                patient_name,
                call_type,
                details or "",
                "initiated",
                None,
                max_retries,
                now,
                now,
                "",
            ),
        )
        conn.commit()

    return {"call_id": call_id, "status": "initiated", "phone_number": normalized}


def update_call_outcome(
    call_id: str,
    outcome: str,
    notes: str | None = None,
    increment_retry: bool = False,
) -> dict[str, Any]:
    """
    Update the final outcome of an outbound call.
    Valid outcomes: answered, busy, no_answer, voicemail, immediate_hangup, opted_out, failed.
    """
    init_outbound_database()
    now = datetime.now(timezone.utc).isoformat()

    valid_outcomes = {
        "initiated",
        "ringing",
        "answered",
        "busy",
        "no_answer",
        "voicemail",
        "immediate_hangup",
        "opted_out",
        "failed",
    }

    normalized_outcome = outcome.strip().lower()
    if normalized_outcome not in valid_outcomes:
        normalized_outcome = "other"

    status = (
        "completed"
        if normalized_outcome in {"answered", "opted_out"}
        else ("in_progress" if normalized_outcome in {"initiated", "ringing"} else "attempted")
    )

    with get_outbound_connection() as conn:
        if increment_retry:
            conn.execute(
                """
                UPDATE outbound_calls
                SET outcome = ?,
                    status = ?,
                    retry_count = retry_count + 1,
                    last_attempt_at = ?,
                    notes = COALESCE(notes || '; ', '') || ?
                WHERE call_id = ?
                """,
                (normalized_outcome, status, now, notes or "", call_id),
            )
        else:
            conn.execute(
                """
                UPDATE outbound_calls
                SET outcome = ?,
                    status = ?,
                    last_attempt_at = ?,
                    notes = COALESCE(notes || '; ', '') || ?
                WHERE call_id = ?
                """,
                (normalized_outcome, status, now, notes or "", call_id),
            )
        conn.commit()

    return {"call_id": call_id, "outcome": normalized_outcome, "status": status}


def log_adherence(
    phone_number: str,
    patient_name: str,
    item_name: str,
    status: str,
    notes: str | None = None,
) -> dict[str, Any]:
    """
    Record medication or appointment adherence status from conversation.
    """
    init_outbound_database()
    timestamp = datetime.now(timezone.utc).isoformat()
    normalized = phone_number.strip().replace(" ", "").replace("-", "")

    with get_outbound_connection() as conn:
        conn.execute(
            """
            INSERT INTO outbound_adherence_logs (
                phone_number, patient_name, item_name, status, notes, logged_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (normalized, patient_name, item_name, status, notes or "", timestamp),
        )
        conn.commit()

    return {
        "success": True,
        "phone_number": normalized,
        "patient_name": patient_name,
        "status": status,
        "logged_at": timestamp,
    }


def get_call_record(call_id: str) -> dict[str, Any] | None:
    """
    Fetch a single outbound call record.
    """
    init_outbound_database()
    with get_outbound_connection() as conn:
        row = conn.execute(
            "SELECT * FROM outbound_calls WHERE call_id = ?",
            (call_id,),
        ).fetchone()
        if row:
            return dict(row)
    return None


def get_all_opt_outs() -> list[dict[str, Any]]:
    """
    Fetch all opted out phone numbers.
    """
    init_outbound_database()
    with get_outbound_connection() as conn:
        rows = conn.execute("SELECT * FROM opt_out_list ORDER BY opted_out_at DESC").fetchall()
        return [dict(r) for r in rows]
