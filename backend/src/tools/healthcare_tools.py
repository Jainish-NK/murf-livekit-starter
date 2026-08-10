import csv
from pathlib import Path
from typing import Any

from livekit.agents import function_tool, RunContext


DATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "healthcare_facilities.csv"
)


@function_tool()
async def find_nearby_healthcare_facility(
    context: RunContext,
    location: str,
) -> dict[str, Any]:
    """
    Find healthcare facilities for the caller's requested location.

    Use this tool when the caller asks for a nearby PHC,
    hospital, clinic, health centre, or healthcare facility.

    The location can be a city, district, or locality.

    Never invent facility names, addresses, phone numbers,
    distances, or availability. Only return information
    found in the healthcare dataset.
    """

    try:
        if not DATA_FILE.exists():
            return {
                "success": False,
                "error": "Healthcare data source is unavailable.",
            }

        location = location.strip().lower()

        matches = []

        with open(
            DATA_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            reader = csv.DictReader(file)

            for row in reader:

                city = row.get("city", "").lower()
                district = row.get("district", "").lower()

                if (
                    location in city
                    or location in district
                ):
                    matches.append(row)

        if not matches:
            return {
                "success": False,
                "error": (
                    f"No healthcare facility was found "
                    f"for {location}."
                ),
            }

        return {
            "success": True,
            "location": location,
            "facilities": matches[:5],
            "data_updated": matches[0].get(
                "updated_at"
            ),
        }

    except Exception as error:

        return {
            "success": False,
            "error": (
                "Healthcare facility data could not "
                "be accessed right now."
            ),
        }



@function_tool()
async def check_triage_level(
    context: RunContext,
    symptoms: str,
) -> dict[str, Any]:
    """
    Classify a caller's described symptoms into a basic safety triage level.

    Use this tool when the caller describes symptoms and asks what
    they should do next, especially when emergency red-flag symptoms
    may be present.

    This tool is NOT a diagnostic tool.
    It must never identify a disease, recommend medicine, provide
    dosage, or suggest treatment.

    Possible levels:
    - emergency: immediate emergency escalation is required
    - routine: no predefined emergency red flag was detected

    If emergency symptoms are detected, the caller should be told
    to call 108 or go to the nearest hospital immediately.
    """

    if not symptoms or not symptoms.strip():
        return {
            "success": False,
            "triage_level": "unknown",
            "message": "No symptoms were provided.",
        }

    text = symptoms.lower().strip()

    emergency_keywords = [
        "chest pain",
        "chest pressure",
        "difficulty breathing",
        "trouble breathing",
        "can't breathe",
        "cannot breathe",
        "breathing problem",
        "unconscious",
        "passed out",
        "heavy bleeding",
        "severe bleeding",
        "major bleeding",
        "severe injury",
        "serious injury",
        "stroke",
        "face drooping",
        "slurred speech",
        "sudden weakness",
        "seizure",
    ]

    matched = [
        keyword
        for keyword in emergency_keywords
        if keyword in text
    ]

    if matched:
        return {
            "success": True,
            "triage_level": "emergency",
            "matched_red_flags": matched,
            "action": (
                "Tell the caller this may be an emergency. "
                "Advise them to call 108 or go to the nearest "
                "hospital immediately."
            ),
        }

    return {
        "success": True,
        "triage_level": "routine",
        "matched_red_flags": [],
        "action": (
            "No predefined emergency red flag was detected. "
            "Do not diagnose or recommend medication. "
            "Offer a doctor appointment or callback."
        ),
    }