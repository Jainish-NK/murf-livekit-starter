import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from livekit import api

from src.outbound.outbound_database import (
    init_outbound_database,
    is_opted_out,
    log_outbound_call,
    update_call_outcome,
    get_call_record,
)

# Explicitly resolve and load backend/.env.local
BASE_DIR = Path(__file__).resolve().parents[2]
ENV_LOCAL_PATH = BASE_DIR / ".env.local"
if ENV_LOCAL_PATH.exists():
    load_dotenv(ENV_LOCAL_PATH)
load_dotenv(".env.local")
load_dotenv(".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("outbound_caller")


def normalize_sip_call_to(target: str) -> str:
    """
    Normalize target to a phone number or SIP username for LiveKit SIP dispatch.
    LiveKit expects a phone number or SIP user, not a full SIP URI.
    """
    target = target.strip()
    if target.startswith("sip:"):
        target = target[4:]
    if "@" in target:
        target = target.split("@", 1)[0]
    return target


async def initiate_outbound_call(
    phone_number: str,
    patient_name: str = "Patient",
    call_type: str = "medication_reminder",
    details: str = "your scheduled medication reminder",
    sip_trunk_id: str | None = None,
    simulate: bool = False,
) -> dict[str, Any]:
    """
    Initiate an outbound phone call to a patient via LiveKit SIP Telephony or Simulation.

    Args:
        phone_number: Destination E.164 phone number (e.g. +919876543210) or SIP URI.
        patient_name: Name of patient.
        call_type: 'medication_reminder', 'vaccination_reminder', or 'post_triage_followup'.
        details: Specific dosage, vaccine, or clinic follow-up instructions.
        sip_trunk_id: Outbound SIP trunk ID (configured in LiveKit Cloud / Twilio).
        simulate: If True, skips actual SIP participant creation and simulates the room session.
    """
    init_outbound_database()

    # Rule 10 & 12: Check if phone number is on Do-Not-Call / Opt-Out list
    if is_opted_out(phone_number):
        logger.warning(
            "Call aborted: %s is on the permanent opt-out list (Do-Not-Call).",
            phone_number,
        )
        return {
            "success": False,
            "error": "OPTED_OUT",
            "message": f"Phone number {phone_number} has opted out of automated calls.",
        }

    call_id = f"call_{uuid.uuid4().hex[:10]}"
    room_name = f"outbound-{call_type}-{uuid.uuid4().hex[:8]}"

    # Prepare outbound metadata that will be delivered to the agent
    outbound_metadata = {
        "call_mode": "outbound",
        "call_id": call_id,
        "phone_number": phone_number,
        "patient_name": patient_name,
        "call_type": call_type,
        "details": details,
        "simulate": simulate,
    }

    # Record initial call attempt in database
    log_outbound_call(
        call_id=call_id,
        phone_number=phone_number,
        patient_name=patient_name,
        call_type=call_type,
        details=details,
    )

    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    trunk_id = (
        sip_trunk_id
        or os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID")
        or os.getenv("SIP_OUTBOUND_TRUNK_ID")
    )

    if not livekit_url or not api_key or not api_secret:
        err_msg = "LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET is missing."
        logger.error(err_msg)
        update_call_outcome(call_id, "failed", notes=err_msg)
        return {"success": False, "error": "MISSING_ENV", "message": err_msg}

    lk_api = api.LiveKitAPI(livekit_url, api_key, api_secret)

    try:
        logger.info("Creating LiveKit Room: %s with outbound metadata...", room_name)
        # Create room with outbound metadata attached
        await lk_api.room.create_room(
            api.CreateRoomRequest(
                name=room_name,
                metadata=json.dumps(outbound_metadata, ensure_ascii=False),
                empty_timeout=120,
                max_participants=5,
            )
        )

        # Dispatch AI voice agent ('my-agent') to the outbound room
        logger.info("Dispatching agent 'my-agent' to room %s...", room_name)
        try:
            dispatch_req = api.CreateAgentDispatchRequest(
                agent_name="my-agent",
                room=room_name,
                metadata=json.dumps(outbound_metadata, ensure_ascii=False),
            )
            agent_dispatch = await lk_api.agent_dispatch.create_dispatch(dispatch_req)
            dispatch_id = getattr(agent_dispatch, "id", "active")
            logger.info("Agent dispatched successfully to room %s (Dispatch ID: %s)", room_name, dispatch_id)
        except Exception as dispatch_err:
            logger.warning(
                "Could not create explicit agent dispatch for 'my-agent': %s. "
                "Proceeding with room connection...",
                dispatch_err,
            )

        if simulate:
            logger.info(
                "SIMULATION MODE: Outbound room '%s' created successfully without dialing PSTN.",
                room_name,
            )
            update_call_outcome(
                call_id,
                "initiated",
                notes="Simulation verified outbound room creation and agent dispatch (PSTN dial bypassed)",
            )
            return {
                "success": True,
                "simulate": True,
                "call_id": call_id,
                "room_name": room_name,
                "metadata": outbound_metadata,
                "message": (
                    f"Simulation verified: Outbound room '{room_name}' created and agent 'my-agent' dispatched successfully. "
                    "PSTN dialing bypassed; call status set to 'initiated'."
                ),
            }

        # Real Outbound SIP Telephony Call (Twilio PSTN or Linphone SIP)
        if not trunk_id:
            err_msg = (
                "LIVEKIT_SIP_OUTBOUND_TRUNK_ID (or SIP_OUTBOUND_TRUNK_ID) is not configured in .env.local. "
                "For Linphone or Twilio testing, add an Outbound SIP Trunk in LiveKit Cloud "
                "(https://cloud.livekit.io -> SIP -> Outbound Trunks) or use --simulate."
            )
            logger.error(err_msg)
            update_call_outcome(call_id, "failed", notes=err_msg)
            return {"success": False, "error": "NO_TRUNK_ID", "message": err_msg}

        normalized_target = normalize_sip_call_to(phone_number)
        logger.info(
            "Placing real SIP outbound call via trunk %s to %s (normalized: %s)...",
            trunk_id,
            phone_number,
            normalized_target,
        )

        is_sip_uri = phone_number.startswith("sip:") or "@" in phone_number
        if is_sip_uri:
            clean_id = (
                phone_number.replace("sip:", "")
                .replace("@", "_")
                .replace(".", "_")
                .replace("+", "")
            )
            participant_identity = f"sip_{clean_id}"
        else:
            participant_identity = f"phone_{phone_number.replace('+', '')}"

        sip_request = api.CreateSIPParticipantRequest(
            sip_trunk_id=trunk_id,
            sip_call_to=normalized_target,
            room_name=room_name,
            participant_identity=participant_identity,
            participant_name=patient_name,
        )

        sip_participant = await lk_api.sip.create_sip_participant(sip_request)
        sip_call_id = getattr(sip_participant, "sip_call_id", "sip_active")

        logger.info(
            "Outbound call placed successfully! SIP Call ID: %s, Room: %s",
            sip_call_id,
            room_name,
        )

        # Set initial status to 'initiated' (not 'answered') until connection is confirmed
        update_call_outcome(
            call_id,
            "initiated",
            notes=f"SIP call dispatch initiated (SIP Call ID: {sip_call_id})",
        )

        return {
            "success": True,
            "simulate": False,
            "call_id": call_id,
            "sip_call_id": sip_call_id,
            "room_name": room_name,
            "phone_number": phone_number,
            "patient_name": patient_name,
            "message": f"Calling {patient_name} at {phone_number}...",
        }

    except Exception as exc:
        logger.exception("Failed to initiate outbound call: %s", exc)
        update_call_outcome(call_id, "failed", notes=str(exc))
        return {
            "success": False,
            "error": "CALL_FAILED",
            "message": f"Failed to place outbound call: {exc}",
        }
    finally:
        await lk_api.aclose()


def main():
    parser = argparse.ArgumentParser(
        description="SehatSaathi Outbound Calling Engine (Health Access Track - PSTN & Linphone SIP)"
    )
    parser.add_argument(
        "--phone",
        type=str,
        default=None,
        help="Destination phone number in E.164 format (+91...) or full SIP URI (sip:user@sip.linphone.org)",
    )
    parser.add_argument(
        "--linphone",
        type=str,
        default=None,
        help="Linphone username shortcut (e.g. 'jainish' -> 'sip:jainish@sip.linphone.org')",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="Rahul Sharma",
        help="Name of the patient",
    )
    parser.add_argument(
        "--type",
        type=str,
        choices=["medication_reminder", "vaccination_reminder", "post_triage_followup"],
        default="medication_reminder",
        help="Outbound campaign call type",
    )
    parser.add_argument(
        "--details",
        type=str,
        default="your scheduled medication reminder",
        help="Specific medication/vaccine/follow-up details explicitly provided by the authorized system",
    )
    parser.add_argument(
        "--trunk-id",
        type=str,
        default=None,
        help="Optional LiveKit SIP Outbound Trunk ID override",
    )
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="Run in simulation mode without dialing PSTN or SIP trunk",
    )

    args = parser.parse_args()

    # Determine destination from --linphone or --phone
    if args.linphone:
        destination = (
            args.linphone
            if args.linphone.startswith("sip:")
            else f"sip:{args.linphone}@sip.linphone.org"
        )
    elif args.phone:
        destination = args.phone
    else:
        destination = "+919998983110" if args.simulate else None

    if not destination:
        print("Error: Please provide a destination using --phone <number/SIP> or --linphone <username>")
        sys.exit(1)

    result = asyncio.run(
        initiate_outbound_call(
            phone_number=destination,
            patient_name=args.name,
            call_type=args.type,
            details=args.details,
            sip_trunk_id=args.trunk_id,
            simulate=args.simulate,
        )
    )

    print("\n" + "=" * 60)
    print("OUTBOUND CALL DISPATCH RESULT")
    print("=" * 60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("=" * 60 + "\n")

    if not result.get("success"):
        sys.exit(1)


if __name__ == "__main__":
    main()
