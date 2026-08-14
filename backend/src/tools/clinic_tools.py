import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from livekit.agents import function_tool, RunContext

try:
    from memory.database import get_connection, init_database
except ImportError:
    from src.memory.database import get_connection, init_database


def init_clinic_db() -> None:
    """
    Ensure the appointments table exists in the database.
    """
    init_database()
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS clinic_appointments (
                appointment_id TEXT PRIMARY KEY,
                patient_name TEXT NOT NULL,
                doctor_name TEXT NOT NULL,
                department TEXT,
                preferred_date TEXT NOT NULL,
                preferred_time TEXT NOT NULL,
                reason TEXT,
                status TEXT DEFAULT 'CONFIRMED',
                caller_id TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


# Demo Clinic Data for Sunrise Family Clinic
CLINIC_DETAILS = {
    "name": "Sunrise Family Clinic",
    "address": "Shop 4-5, Sunrise Heights, Sector 12, Main Road",
    "hours": "Monday to Saturday, 9:00 AM to 7:00 PM (Closed on Sundays)",
    "departments": ["General Medicine", "Pediatrics", "Gynecology"],
    "doctors": [
        {
            "name": "Dr. Sharma",
            "department": "General Medicine",
            "qualification": "MBBS, MD (Internal Medicine)",
            "schedule": "Monday to Saturday: 9:00 AM - 1:00 PM and 4:00 PM - 7:00 PM",
            "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
            "slots": ["09:30 AM", "10:30 AM", "11:30 AM", "04:30 PM", "05:30 PM", "06:30 PM"],
        },
        {
            "name": "Dr. Priya Sharma",
            "department": "Pediatrics",
            "qualification": "MBBS, DCH (Child Specialist)",
            "schedule": "Monday to Friday: 10:00 AM - 3:00 PM",
            "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
            "slots": ["10:30 AM", "11:30 AM", "12:30 PM", "02:00 PM"],
        },
        {
            "name": "Dr. Rajesh Patel",
            "department": "Gynecology",
            "qualification": "MBBS, MS (OB-GYN)",
            "schedule": "Tuesday, Thursday, Saturday: 11:00 AM - 5:00 PM",
            "available_days": ["tuesday", "thursday", "saturday"],
            "slots": ["11:30 AM", "01:00 PM", "03:00 PM", "04:30 PM"],
        },
    ],
}


def generate_appointment_id() -> str:
    """Generate unique appointment reference ID (e.g. APT-2026-001)."""
    init_clinic_db()
    year = datetime.now(timezone.utc).year
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM clinic_appointments WHERE appointment_id LIKE ?",
            (f"APT-{year}-%",),
        ).fetchone()
        count = (row[0] if row else 0) + 1
        return f"APT-{year}-{count:03d}"


@function_tool()
async def get_clinic_info_and_timings(
    context: RunContext,
    department: str | None = None,
) -> dict[str, Any]:
    """
    Get official clinic details, operating hours, and doctor departments for Sunrise Family Clinic.
    Use this tool when the caller asks about clinic hours, location, services, or available departments.
    """
    if department:
        dept_clean = department.strip().lower()
        matched_doctors = [
            d for d in CLINIC_DETAILS["doctors"]
            if dept_clean in d["department"].lower() or dept_clean in d["name"].lower()
        ]
        if matched_doctors:
            return {
                "success": True,
                "clinic_name": CLINIC_DETAILS["name"],
                "clinic_hours": CLINIC_DETAILS["hours"],
                "department": department,
                "doctors": [
                    {
                        "name": doc["name"],
                        "department": doc["department"],
                        "schedule": doc["schedule"],
                    }
                    for doc in matched_doctors
                ],
            }

    return {
        "success": True,
        "clinic_name": CLINIC_DETAILS["name"],
        "clinic_address": CLINIC_DETAILS["address"],
        "clinic_hours": CLINIC_DETAILS["hours"],
        "departments": CLINIC_DETAILS["departments"],
        "doctors": [
            {
                "name": doc["name"],
                "department": doc["department"],
                "schedule": doc["schedule"],
            }
            for doc in CLINIC_DETAILS["doctors"]
        ],
        "note": "Clinic is closed on Sundays. Emergency patients should contact emergency services directly.",
    }


@function_tool()
async def check_doctor_availability(
    context: RunContext,
    doctor_name: str | None = None,
    preferred_date: str | None = None,
) -> dict[str, Any]:
    """
    Check availability and available appointment slots for a doctor at Sunrise Family Clinic.
    Never fabricate unverified availability.
    """
    doctors = CLINIC_DETAILS["doctors"]

    if doctor_name:
        doc_clean = doctor_name.strip().lower()
        matched = [d for d in doctors if doc_clean in d["name"].lower()]
        if not matched:
            return {
                "success": False,
                "message": f"Doctor '{doctor_name}' is not found at Sunrise Family Clinic. Available doctors: Dr. Sharma (General Medicine), Dr. Priya Sharma (Pediatrics), Dr. Rajesh Patel (Gynecology).",
                "available_doctors": [d["name"] for d in doctors],
            }
        doc = matched[0]
    else:
        doc = doctors[0]  # Default to Dr. Sharma (General Physician)

    return {
        "success": True,
        "doctor_name": doc["name"],
        "department": doc["department"],
        "schedule": doc["schedule"],
        "requested_date": preferred_date or "Next available clinic day",
        "available_slots": doc["slots"],
        "message": f"{doc['name']} ({doc['department']}) is available on {doc['schedule']}. Available slots: {', '.join(doc['slots'][:3])}.",
    }


@function_tool()
async def book_appointment(
    context: RunContext,
    patient_name: str,
    doctor_name: str,
    preferred_date: str,
    preferred_time: str,
    department: str | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    """
    Book an appointment with a doctor at Sunrise Family Clinic.
    Returns a confirmed appointment reference ID (e.g. APT-2026-001).
    """
    init_clinic_db()
    caller_id = "caller"
    userdata = getattr(context.session, "userdata", None) if hasattr(context, "session") else None
    if userdata and isinstance(userdata, dict):
        caller_id = userdata.get("caller_id", "caller")

    # Match doctor name to standard doctor roster
    doc_clean = doctor_name.strip().lower()
    matched_doc = next(
        (d for d in CLINIC_DETAILS["doctors"] if doc_clean in d["name"].lower()),
        None,
    )
    formal_doc_name = matched_doc["name"] if matched_doc else doctor_name
    formal_dept = matched_doc["department"] if matched_doc else (department or "General Medicine")

    apt_id = generate_appointment_id()
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO clinic_appointments (
                appointment_id, patient_name, doctor_name, department,
                preferred_date, preferred_time, reason, status, caller_id, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)
            """,
            (
                apt_id,
                patient_name.strip(),
                formal_doc_name,
                formal_dept,
                preferred_date.strip(),
                preferred_time.strip(),
                reason or "General Consultation",
                caller_id,
                now_iso,
            ),
        )
        conn.commit()

    if userdata and isinstance(userdata, dict):
        userdata["success"] = True
        userdata["success_reason"] = "APPOINTMENT_BOOKED"
        userdata["details"] = f"Booked appointment {apt_id} with {formal_doc_name}"
        userdata["specialist_task"] = "APPOINTMENT_BOOKED"

    return {
        "success": True,
        "appointment_id": apt_id,
        "patient_name": patient_name,
        "doctor_name": formal_doc_name,
        "department": formal_dept,
        "date": preferred_date,
        "time": preferred_time,
        "status": "CONFIRMED",
        "message": f"Appointment confirmed with {formal_doc_name} on {preferred_date} at {preferred_time}. Reference ID: {apt_id}.",
    }


@function_tool()
async def reschedule_appointment(
    context: RunContext,
    appointment_id: str,
    new_date: str,
    new_time: str,
) -> dict[str, Any]:
    """
    Reschedule an existing appointment at Sunrise Family Clinic.
    """
    init_clinic_db()
    clean_id = appointment_id.strip().upper()

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM clinic_appointments WHERE appointment_id = ?",
            (clean_id,),
        ).fetchone()

        if not row:
            return {
                "success": False,
                "message": f"No appointment found with Reference ID {clean_id}. Please check the ID.",
            }

        conn.execute(
            """
            UPDATE clinic_appointments
            SET preferred_date = ?, preferred_time = ?, status = 'RESCHEDULED'
            WHERE appointment_id = ?
            """,
            (new_date.strip(), new_time.strip(), clean_id),
        )
        conn.commit()

    userdata = getattr(context.session, "userdata", None) if hasattr(context, "session") else None
    if userdata and isinstance(userdata, dict):
        userdata["success"] = True
        userdata["success_reason"] = "APPOINTMENT_RESCHEDULED"
        userdata["details"] = f"Rescheduled appointment {clean_id} to {new_date} {new_time}"
        userdata["specialist_task"] = "APPOINTMENT_RESCHEDULED"

    return {
        "success": True,
        "appointment_id": clean_id,
        "doctor_name": row["doctor_name"],
        "new_date": new_date,
        "new_time": new_time,
        "status": "RESCHEDULED",
        "message": f"Appointment {clean_id} has been rescheduled to {new_date} at {new_time}.",
    }


@function_tool()
async def cancel_appointment(
    context: RunContext,
    appointment_id: str,
    reason: str | None = None,
) -> dict[str, Any]:
    """
    Cancel an existing appointment at Sunrise Family Clinic.
    """
    init_clinic_db()
    clean_id = appointment_id.strip().upper()

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM clinic_appointments WHERE appointment_id = ?",
            (clean_id,),
        ).fetchone()

        if not row:
            return {
                "success": False,
                "message": f"No appointment found with Reference ID {clean_id}.",
            }

        conn.execute(
            """
            UPDATE clinic_appointments
            SET status = 'CANCELLED'
            WHERE appointment_id = ?
            """,
            (clean_id,),
        )
        conn.commit()

    userdata = getattr(context.session, "userdata", None) if hasattr(context, "session") else None
    if userdata and isinstance(userdata, dict):
        userdata["success"] = True
        userdata["success_reason"] = "APPOINTMENT_CANCELLED"
        userdata["details"] = f"Cancelled appointment {clean_id}"
        userdata["specialist_task"] = "APPOINTMENT_CANCELLED"

    return {
        "success": True,
        "appointment_id": clean_id,
        "status": "CANCELLED",
        "message": f"Appointment {clean_id} has been successfully cancelled.",
    }
