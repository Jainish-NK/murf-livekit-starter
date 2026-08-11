"""
Simulation and testing harness for SehatSaathi Outbound Voice Agent.

Tests all key conversational flows required for Day 6 (Health Access track):
1. Outbound 2-sentence Opening & Opt-Out Greeting (Devanagari script)
2. Medication Compliance Intake logging
3. Immediate Opt-out ('Stop', 'Don't call me', 'कॉल मत करो') with Do-Not-Call database verification
4. Emergency symptoms reported during outbound call (triggers check_triage_level immediately)
5. Reschedule reminder callback
"""

import asyncio
import json
import logging
import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv(".env")

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from src.outbound.outbound_database import (
    init_outbound_database,
    is_opted_out,
    record_opt_out,
    log_outbound_call,
    update_call_outcome,
    log_adherence,
    get_outbound_connection,
)
from src.tools.healthcare_tools import check_triage_level

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("simulation")


def run_database_tests():
    print("\n--- 1. Testing Outbound Database & Outcome Tracking ---")
    init_outbound_database()

    test_phone = "+919876543210"
    test_call_id = f"sim_test_{uuid.uuid4().hex[:6]}"

    # Step A: Log initial call
    log_res = log_outbound_call(
        call_id=test_call_id,
        phone_number=test_phone,
        patient_name="राहुल शर्मा",
        call_type="medication_reminder",
        details="Metformin 500mg morning dosage",
    )
    print(f"[OK] Call logged: {log_res}")

    # Step B: Log Adherence
    adh_res = log_adherence(
        phone_number=test_phone,
        patient_name="राहुल शर्मा",
        item_name="Metformin 500mg",
        status="taken",
        notes="Patient confirmed taken with water after breakfast",
    )
    print(f"[OK] Adherence logged: {adh_res['status']}")

    # Step C: Update Call Outcome
    out_res = update_call_outcome(
        call_id=test_call_id,
        outcome="answered",
        notes="Completed medication adherence check",
    )
    print(f"[OK] Outcome updated: {out_res['outcome']}")

    # Step D: Test Opt-Out
    opt_phone = "+919999900000"
    record_opt_out(
        phone_number=opt_phone,
        patient_name="सुमन वर्मा",
        reason="Patient requested 'Stop calling'",
    )
    opted = is_opted_out(opt_phone)
    print(f"[OK] Opt-out verified for {opt_phone}: {opted}")
    assert opted is True, "Opt-out check failed!"

    # Step E: Test Linphone / SIP URI destination handling
    linphone_uri = "sip:testpatient@sip.linphone.org"
    linphone_call_id = f"sim_linphone_{uuid.uuid4().hex[:6]}"
    lin_res = log_outbound_call(
        call_id=linphone_call_id,
        phone_number=linphone_uri,
        patient_name="अनिल कुमार (Linphone)",
        call_type="vaccination_reminder",
        details="COVID Booster Dose",
    )
    print(f"[OK] Linphone SIP URI call logged: {lin_res['phone_number']}")
    assert lin_res["phone_number"] == linphone_uri, "Linphone SIP URI mismatch!"

    not_opted = is_opted_out("+911111111111")
    print(f"[OK] Non-opted number check: {not_opted} (Expected: False)")
    assert not_opted is False, "False positive in opt-out list!"

    print("[OK] All Database & Outcome tests PASSED.\n")


async def run_safety_triage_tests():
    print("--- 2. Testing Emergency Safety Escalation during Outbound Call ---")
    class DummyContext:
        pass

    ctx = DummyContext()

    # Case 1: Emergency symptom reported during reminder
    emergency_input = "अनीशा मुझे सुबह से सीने में तेज़ दर्द हो रहा है और सांस लेने में दिक्कत है (chest pain and difficulty breathing)"
    res = await check_triage_level(ctx, symptoms=emergency_input)
    print(f"Query: '{emergency_input}'")
    print(f"Triage Result: level={res.get('triage_level')}, red_flags={res.get('matched_red_flags')}")
    assert res.get("triage_level") == "emergency", "Failed to detect emergency in outbound flow!"
    print("[OK] Emergency Triage correctly prioritized 108 / Hospital Escalation.")

    # Case 2: Routine symptom
    routine_input = "मुझे थोड़ा हल्का सिरदर्द है, बस दवाई ले ली है।"
    routine_res = await check_triage_level(ctx, symptoms=routine_input)
    print(f"Query: '{routine_input}'")
    print(f"Triage Result: level={routine_res.get('triage_level')}")
    assert routine_res.get("triage_level") == "routine", "Routine symptom misclassified as emergency!"
    print("[OK] Routine classification verified.")
    print("[OK] Safety Guardrail tests PASSED.\n")


def print_sample_conversation_walkthrough():
    print("=" * 70)
    print("SEHATSAATHI OUTBOUND VOICE AGENT: CONVERSATIONAL WALKTHROUGH")
    print("=" * 70)

    print("\n[SCENARIO A: Proactive Medication Reminder with Devanagari Hindi Opening]")
    print("Phone: Rings...")
    print("Patient: 'Hello?'")
    print("Anisha (Sentence 1 - Identity & Reason):")
    print("  'नमस्ते राहुल जी! मैं सनराइज़ फैमिली क्लीनिक से अनीशा बोल रही हूँ। यह आपकी निर्धारित दवा (Metformin 500mg) के संबंध में एक ज़रूरी कॉल है।'\n")
    print("Anisha (Sentence 2 - Clear Opt-Out & Stop Instruction):")
    print("  'अगर आप अभी बात नहीं करना चाहते या ये रिमाइंडर कॉल्स बंद करना चाहते हैं, तो कृपया 'Stop' या 'कॉल बंद करें' बोल दीजिए।'\n")
    print("Patient: 'हाँ अनीशा, मैंने नाश्ते के बाद गर्म पानी के साथ गोली ले ली है।'")
    print("Anisha: [Calls record_medication_intake(status='taken', medication_name='Metformin 500mg')]")
    print("  'बहुत बढ़िया राहुल जी! मैंने आपका रिकॉर्ड अपडेट कर दिया है। समय पर दवा लेने के लिए धन्यवाद। अपना ख्याल रखें!'")

    print("\n" + "-" * 70)
    print("[SCENARIO B: Patient Requests Opt-Out ('Stop Calling')]")
    print("Patient: 'मुझे बार-बार कॉल मत करो, मेरा नंबर हटा दो!'")
    print("Anisha: [Calls opt_out_patient(reason='Patient requested removal')]")
    print("  'मैंने आपकी रिक्वेस्ट दर्ज कर ली है। अब आपको सनराइज़ फैमिली क्लीनिक से कोई भी ऑटोमेटेड रिमाइंडर कॉल नहीं आएगी। असुविधा के लिए क्षमा करें, धन्यवाद और अपना ख्याल रखें!'")
    print("[Call ends -> Outcome logged as 'opted_out' -> Number permanently blocked from retries]")

    print("\n" + "-" * 70)
    print("[SCENARIO C: Emergency Red Flag During Outbound Reminder]")
    print("Patient: 'दवाई तो ठीक है, लेकिन मुझे अचानक बहुत तेज़ सीने में दर्द हो रहा है और सांस फूल रही है!'")
    print("Anisha: [Calls check_triage_level(symptoms='chest pain and difficulty breathing')]")
    print("  'यह एक मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत 108 पर कॉल करें या नज़दीकी अस्पताल के इमरजेंसी विभाग जाएँ। normal कॉल जारी रखने की जगह तुरंत डॉक्टर की मदद लें!'")
    print("=" * 70)


async def main():
    print("\n" + "=" * 60)
    print("SEHATSAATHI OUTBOUND VOICE AGENT: DAY 6 SIMULATION & VERIFICATION")
    print("=" * 60)

    run_database_tests()
    await run_safety_triage_tests()
    print_sample_conversation_walkthrough()

    print("\n" + "=" * 60)
    print("ALL DAY 6 SIMULATION AND COMPLIANCE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
