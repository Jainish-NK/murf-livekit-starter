import sqlite3
import pytest
from pathlib import Path
from datetime import datetime, timezone, timedelta
import sys

# Ensure src directory is available on sys.path
_src_dir = Path(__file__).resolve().parents[1] / "src"
if str(_src_dir) not in sys.path:
    sys.path.insert(0, str(_src_dir))

from memory.database import DB_PATH, init_database, get_connection
from analytics_service import (
    mask_caller_id,
    log_call_start,
    log_call_end,
    get_call_analytics,
    get_call_history,
    get_failure_breakdown,
    classify_call_outcome
)

@pytest.fixture(autouse=True)
def clean_db():
    # Setup - init database structure
    init_database()
    # Clean database before each test
    with get_connection() as conn:
        conn.execute("DELETE FROM call_analytics")
        conn.commit()
    yield

def test_caller_id_masking():
    # 1. Phone number
    assert mask_caller_id("+919876543210") == "+91******3210"
    assert mask_caller_id("phone_919876543210") == "+91******3210"
    
    # 2. Browser calls
    assert mask_caller_id("voice_assistant_room_12345") == "Browser User"
    assert mask_caller_id("day7_user") == "Browser User"
    assert mask_caller_id("day8_user") == "Browser User"
    assert mask_caller_id("") == "Browser User"
    assert mask_caller_id(None) == "Browser User"
    
    # 3. Short / Custom ids
    assert mask_caller_id("user") == "Browser User"

def test_log_call_start():
    call_id = "test_room_1"
    log_call_start(call_id, "day8_user", "browser")
    
    # Check inserted row
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM call_analytics WHERE call_id = ?", (call_id,)).fetchone()
        assert row is not None
        assert row["call_id"] == call_id
        assert row["caller_id"] == "Browser User"
        assert row["call_mode"] == "browser"
        assert row["status"] == "in_progress"
        assert row["outcome"] == "failed"
        assert row["failure_reason"] == "INCOMPLETE_TASK"

def test_log_call_end_success():
    call_id = "test_room_success"
    log_call_start(call_id, "+919876543210", "outbound")
    
    # End successfully
    log_call_end(
        call_id=call_id,
        outcome="success",
        success_reason="SAFE_GUIDANCE",
        language="Hindi"
    )
    
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM call_analytics WHERE call_id = ?", (call_id,)).fetchone()
        assert row is not None
        assert row["outcome"] == "success"
        assert row["success_reason"] == "SAFE_GUIDANCE"
        assert row["failure_reason"] is None
        assert row["status"] == "completed"
        assert row["language"] == "Hindi"

def test_log_call_end_failed():
    call_id = "test_room_failed"
    log_call_start(call_id, "+919876543210", "outbound")
    
    # End with failure
    log_call_end(
        call_id=call_id,
        outcome="failed",
        failure_reason="SILENCE_TIMEOUT",
        language="English"
    )
    
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM call_analytics WHERE call_id = ?", (call_id,)).fetchone()
        assert row is not None
        assert row["outcome"] == "failed"
        assert row["failure_reason"] == "SILENCE_TIMEOUT"
        assert row["success_reason"] is None
        assert row["status"] == "completed"
        assert row["language"] == "English"

def test_duration_calculation():
    call_id = "test_room_duration"
    
    # Backdate start_time
    start_time = (datetime.now(timezone.utc) - timedelta(seconds=45)).isoformat()
    init_database()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO call_analytics (call_id, caller_id, call_mode, start_time, status, outcome)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (call_id, "Browser User", "browser", start_time, "in_progress", "failed")
        )
        conn.commit()
        
    log_call_end(call_id, "success", success_reason="CLINIC_INFORMATION")
    
    with get_connection() as conn:
        row = conn.execute("SELECT duration, start_time, end_time FROM call_analytics WHERE call_id = ?", (call_id,)).fetchone()
        assert row is not None
        assert row["start_time"] != row["end_time"]
        assert row["duration"] > 0
        # Should be approximately 45 seconds
        assert 43 <= row["duration"] <= 47

def test_analytics_aggregation_and_empty():
    # Empty DB checks
    stats = get_call_analytics()
    assert stats["total_calls"] == 0
    assert stats["successful_calls"] == 0
    assert stats["failed_calls"] == 0
    assert stats["success_rate"] == 0
    
    # Insert mock calls
    log_call_start("c1", "u1", "browser")
    log_call_end("c1", "success", success_reason="SAFE_GUIDANCE")
    
    log_call_start("c2", "u2", "browser")
    log_call_end("c2", "success", success_reason="HUMAN_ESCALATION")
    
    log_call_start("c3", "u3", "browser")
    log_call_end("c3", "failed", failure_reason="USER_HANGUP")
    
    log_call_start("c4", "u4", "browser")
    # c4 is left in progress or failed by default
    
    stats = get_call_analytics()
    assert stats["total_calls"] == 4
    assert stats["successful_calls"] == 2
    assert stats["failed_calls"] == 2
    assert stats["success_rate"] == 50
    
    history = get_call_history()
    assert len(history) == 4
    
    breakdown = get_failure_breakdown()
    assert breakdown["USER_HANGUP"] == 1
    assert breakdown["INCOMPLETE_TASK"] == 1  # c4 default failure reason


def test_classification_logic():
    # 1. Simple greeting (2 turns of hello/bye) should NOT become successful
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=False,
        success_reason=None,
        failure_reason="INCOMPLETE_TASK",
        details="Call ended prematurely",
        user_messages=["hello", "bye"],
        assistant_messages=["hello, how can I help?", "goodbye"]
    )
    assert outcome == "failed"
    assert failure_reason == "USER_HANGUP"

    # 2. Safe guidance becomes success
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=False,
        success_reason=None,
        failure_reason="INCOMPLETE_TASK",
        details="Call ended prematurely",
        user_messages=["healthy breakfast options?"],
        assistant_messages=["you can eat oatmeal or fruit."]
    )
    assert outcome == "success"
    assert success_reason == "SAFE_GUIDANCE"

    # 3. Successful human escalation becomes success
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=True,
        success_reason="HUMAN_ESCALATION",
        failure_reason=None,
        details="Escalated to human support",
        user_messages=["Yes, please create it", "severe pain"],
        assistant_messages=["Should I escalate this?", "I will create a request"]
    )
    assert outcome == "success"
    assert success_reason == "HUMAN_ESCALATION"

    # 4. Failed escalation does NOT become success (offered but rejected)
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=False,
        success_reason=None,
        failure_reason="INCOMPLETE_TASK",
        details="Call ended prematurely",
        user_messages=["no", "don't create it"],
        assistant_messages=["Should I create a human support request?"]
    )
    assert outcome == "failed"
    assert failure_reason == "INCOMPLETE_TASK"

    # 5. Incomplete task becomes failed (appointment query without completion)
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=False,
        success_reason=None,
        failure_reason="INCOMPLETE_TASK",
        details="Call ended prematurely",
        user_messages=["I want to book an appointment"],
        assistant_messages=["What is your name?"]
    )
    assert outcome == "failed"
    assert failure_reason == "INCOMPLETE_TASK"

    # 6. Tool failure becomes failed
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=False,
        success_reason=None,
        failure_reason="TOOL_FAILURE",
        details="Tool execution failed",
        user_messages=["book appt"],
        assistant_messages=["booking..."]
    )
    assert outcome == "failed"
    assert failure_reason == "TOOL_FAILURE"

    # 7. User hangup before success becomes failed (short single word call)
    outcome, success_reason, failure_reason, details = classify_call_outcome(
        session_success=False,
        success_reason=None,
        failure_reason="INCOMPLETE_TASK",
        details="Call ended prematurely",
        user_messages=["hello"],
        assistant_messages=["hello, how can I help?"]
    )
    assert outcome == "failed"
    assert failure_reason == "USER_HANGUP"


def test_log_call_end_updates_same_row():
    call_id = "same_row_test"
    log_call_start(call_id, "test_user", "browser")
    
    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM call_analytics").fetchone()[0]
        assert count == 1
        row = conn.execute("SELECT status, outcome FROM call_analytics WHERE call_id = ?", (call_id,)).fetchone()
        assert row["status"] == "in_progress"
        assert row["outcome"] == "failed"

    log_call_end(call_id, "success", success_reason="SAFE_GUIDANCE")

    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM call_analytics").fetchone()[0]
        assert count == 1  # Verify no duplicate rows
        row = conn.execute("SELECT status, outcome, success_reason FROM call_analytics WHERE call_id = ?", (call_id,)).fetchone()
        assert row["status"] == "completed"
        assert row["outcome"] == "success"
        assert row["success_reason"] == "SAFE_GUIDANCE"


