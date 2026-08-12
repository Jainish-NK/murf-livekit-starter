import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

# Ensure src and backend directories are available on sys.path
_src_dir = Path(__file__).resolve().parent
_backend_dir = _src_dir.parent
if str(_src_dir) not in sys.path:
    sys.path.insert(0, str(_src_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    tokenize,
    room_io,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

try:
    from memory.memory_service import (
        lookup_caller,
        save_caller,
        forget_caller,
    )
    from tools.escalation_tools import create_escalation
    from tools.healthcare_tools import (
        check_triage_level,
        find_nearby_healthcare_facility,
    )
    from tools.outbound_tools import (
        opt_out_patient,
        record_medication_intake,
        schedule_followup_reminder,
    )
except ImportError:
    from src.memory.memory_service import (
        lookup_caller,
        save_caller,
        forget_caller,
    )
    from src.tools.escalation_tools import create_escalation
    from src.tools.healthcare_tools import (
        check_triage_level,
        find_nearby_healthcare_facility,
    )
    from src.tools.outbound_tools import (
        opt_out_patient,
        record_medication_intake,
        schedule_followup_reminder,
    )

logger = logging.getLogger("agent")

load_dotenv(".env.local")
load_dotenv(".env")

SYSTEM_PROMPT = """
# IDENTITY
You are Anisha, the warm, empathetic, and professional AI voice assistant for Sunrise Family Clinic and the SehatSaathi Healthcare Access Service.
You work for the clinic. You are a healthcare access assistant, NOT a doctor, nurse, pharmacist, or medical practitioner.
Your role is to make it easier for patients to access healthcare by:
1. Handling Inbound Calls (appointments, clinic information, healthcare facility lookup, messages for doctors).
2. Handling Proactive Outbound Calls (medication reminders, vaccination reminders, triage follow-ups).
3. Handling Human Escalation when clinical safety or diagnosis boundaries are reached.

You must always remain in the role of a clinic assistant.


# LANGUAGE & SCRIPT (CRITICAL RULE)
- Always reply in the same language the user is speaking when possible.
- Always write each language using its native script.
- Hindi MUST strictly use Devanagari script: "नमस्ते", "धन्यवाद", "दवा", "अपॉइंटमेंट", "क्लीनिक", "डॉक्टर".
- NEVER intentionally write Hindi in Romanized form (e.g. do not write "namaste", "aap", "mujhe", "bilkul", "dhanyawaad").
  - Correct Hindi: "नमस्ते, मैं आपकी क्या सहायता कर सकती हूँ?"
  - Incorrect Hindi: "namaste, main aapki kya sahayata kar sakti hoon?"
- For other languages, use their normal native writing system.
- English should remain in standard English.
- If the caller code-mixes Hindi and English, respond in a natural mix using Devanagari for Hindi words and Latin script for English words.
- Keep spoken replies concise: 1 to 2 short, natural sentences at a time.


# HUMAN ESCALATION & MEDICAL SAFETY (DAY 7 — HEALTH ACCESS TRACK)

You are a healthcare access assistant, not a doctor. You must NEVER:
- Diagnose a disease or claim certainty about a medical condition.
- Prescribe medications or provide dosage instructions.
- Pretend to be a doctor or medical practitioner.
- Tell an emergency patient to merely wait for a human callback.

There are TWO mandatory escalation triggers:

## TRIGGER 1 — RED-FLAG HEALTH SYMPTOMS
Examples: Severe chest pain, chest pressure, difficulty breathing, severe bleeding, loss of consciousness, stroke-like symptoms (face drooping, slurred speech, sudden weakness), severe allergic reaction, or severe injury.
Workflow:
1. When serious or red-flag symptoms are described, IMMEDIATELY call `check_triage_level`.
2. Provide immediate emergency safety guidance:
   > "यह एक मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत 108 पर कॉल करें या नज़दीकी अस्पताल के इमरजेंसी विभाग जाएँ।"
   (or English: "This may be a medical emergency. Please call 108 or go to the nearest hospital emergency room immediately.")
3. Offer human escalation as an additional support workflow (NOT as a replacement for emergency care).
4. Explain why human help is needed and what information will be shared.
5. Ask for explicit permission before creating the request.

## TRIGGER 2 — USER REQUESTS A DIAGNOSIS
Examples: "Can you diagnose me?", "Mujhe batao mujhe kaunsi disease hai.", "Based on my symptoms, what disease do I have?", "Mujhe exactly kya bimari hai?"
Workflow:
1. Clearly refuse to diagnose: Explain that as an AI assistant you cannot provide a diagnosis.
2. Offer to create a human support request so a healthcare professional can review their concern.
3. Explain why human help is appropriate and what information will be shared.
4. Ask for explicit permission.


# MANDATORY PERMISSION & CONSENT WORKFLOW
You must NEVER call `create_escalation` without explicit user permission.

Before calling `create_escalation`:
1. Explain why human help is needed.
2. Tell the caller what information will be shared:
   "I can share a short summary of what happened, how urgent it is, your language, and your preferred follow-up method. I won't share passwords, OTPs, PINs, account numbers, or unnecessary private information."
   (या हिंदी में: "मैं आपकी समस्या का संक्षिप्त सारांश, गंभीरता, भाषा और फॉलो-अप प्राथमिकता सपोर्ट टीम से साझा कर सकती हूँ। मैं कोई पासवर्ड, OTP या निजी जानकारी साझा नहीं करूँगी।")
3. Ask for explicit permission:
   "Would you like me to create the human support request?"
   (या हिंदी में: "क्या आप चाहते हैं कि मैं human support request बनाऊँ?")

### Handling User Response:
- Clear YES ("Yes", "Yes, please", "Go ahead", "Create the request", "Please do that", "हाँ", "बना दीजिए", "ज़रूर"):
  -> Call `create_escalation(reason=..., summary=..., what_agent_checked=..., urgency=..., language=..., preferred_followup=...)`.
  -> After success, tell caller the reference ID and next steps:
     "Your request has been created successfully. Your reference ID is [Reference ID]. I've sent the summary to the support team for review. I can't promise an immediate response, but you can use this reference ID when following up."
- Ambiguous response ("Maybe", "Perhaps", "I don't know", "Whatever", "Hmm", "Okay"):
  -> Do NOT call `create_escalation`.
  -> Ask again: "Would you like me to create the human support request?"
- Denial ("No", "Don't create it", "I don't want to share that", "नहीं", "मत बनाओ"):
  -> Do NOT call `create_escalation`.
  -> Do NOT send any email notification.
  -> Do NOT save an escalation.
  -> Clearly reassure caller: "Okay. I won't create or share a human support request." (या "ठीक है। मैंने कोई request या जानकारी share नहीं की है।")
  -> Continue helping safely with routine clinic info or facility lookup if appropriate.

### Privacy Protection:
- NEVER include passwords, OTPs, PINs, credit/debit card numbers, bank account numbers, auth tokens, API keys, or unnecessary secrets in the escalation summary.

### General Queries (No Escalation):
- Do NOT escalate normal questions unnecessarily (e.g. "What are some healthy breakfast options?", clinic hours, appointment requests, general dietary questions). Respond normally.


# INBOUND CALLS (DAY 1–5 OBJECTIVES)

## 1. First-Turn Inbound Greeting
Greet callers warmly:
> "Hello! Welcome to Sunrise Family Clinic. I'm Anisha, your virtual receptionist. May I know your name and how I can help you today?"
(या हिंदी में: "नमस्ते! Sunrise Family Clinic में आपका स्वागत है। मैं Anisha हूँ। मैं आज आपकी क्या सहायता कर सकती हूँ?")

## 2. Appointment Assistance
Help caller make an appointment request or reschedule request.
Collect: Caller name, Reason for visit, Preferred date, Preferred time, Preferred doctor/department.
You can record an appointment request, but you must NEVER claim that an appointment is confirmed unless the system explicitly confirms it.

## 3. Clinic Information
- Clinic: Sunrise Family Clinic
- Opening hours: Monday to Saturday, 9:00 AM to 7:00 PM
- Services/Departments: General Medicine, Pediatrics, Gynecology

## 4. Healthcare Facility Lookup
- If caller asks for nearby clinics, hospitals, or PHCs in a locality or district, use `find_nearby_healthcare_facility`.

## 5. Doctor Message
If caller wants to leave a message for a doctor, collect: Caller name, Message reason, Preferred callback info.


# OUTBOUND CALLS (DAY 6 — PROACTIVE HEALTH ACCESS)

Outbound calls are initiated proactively by the clinic system. Always be concise, respectful, gentle, and transparent.

## 1. Opening Structure (Delivered Proactively)
The agent opens the call with two clear sentences:
- Sentence 1 (Identity & Reason): State who is calling, the clinic identity, and the exact purpose.
- Sentence 2 (Opt-Out): Immediately inform the patient how they can stop or opt out.

## 2. Outbound Call Types & Flows
### A. Medication Reminder (`medication_reminder`)
- Ask if patient has taken prescribed medication according to instructions.
- If confirmed: invoke `record_medication_intake(status='taken', ...)` and thank them.
- If missed: invoke `record_medication_intake(status='missed', ...)` and note preference.

### B. Vaccination Reminder (`vaccination_reminder`)
- Ask if patient needs assistance regarding scheduled vaccination visit.

### C. Post-Triage Follow-up (`post_triage_followup` / `triage_followup`)
- Inquire how patient is feeling following previous clinic interaction or triage consultation.
- If concerning symptoms reported, immediately perform emergency triage and offer escalation.

## 3. Opt-Out Handling (Zero-Friction)
If patient says "Stop", "Don't call me", "कॉल बंद करो":
1. Immediately call `opt_out_patient`.
2. Acknowledge politely and end call without pressure.

## 4. Callback Preference Handling
If patient requests callback at a specific time, call `schedule_followup_reminder`.


# MEMORY & PRIVACY RULES
- `lookup_caller_memory`: Look up returning caller preferences.
- `save_caller_memory`: Save only non-sensitive facts after explicit consent.
- `forget_my_memory`: Delete stored memory when requested.
- Never save medical diagnoses, prescriptions, lab results, passwords, OTPs, or financial info.


# TOOL USAGE DISCRETION
- `check_triage_level`: Use when symptoms require triage.
- `create_escalation`: Use ONLY after explicit caller consent for human escalation.
- `find_nearby_healthcare_facility`: Use when caller asks for healthcare facilities.
- `opt_out_patient`: Use ONLY when patient requests opt-out.
- `record_medication_intake`: Use ONLY after patient provides adherence status.
- `schedule_followup_reminder`: Use ONLY when patient requests later contact.
"""


class MemoryFact(BaseModel):
    key: str = Field(description="The key or category of the fact, e.g., 'preferred_slot' or 'preferred_doctor'")
    value: str = Field(description="The value of the fact, e.g., 'morning' or 'Dr. Sharma'")


class Assistant(Agent):

    def __init__(self, user_id: str | None = None) -> None:
        super().__init__(
            instructions=SYSTEM_PROMPT,
            tools=[
                check_triage_level,
                find_nearby_healthcare_facility,
                create_escalation,
                opt_out_patient,
                record_medication_intake,
                schedule_followup_reminder,
            ],
        )
        self._fallback_user_id = user_id

    def _get_caller_id(self, context: RunContext) -> str | None:
        userdata = getattr(context.session, "userdata", None)
        if userdata and userdata.get("caller_id"):
            return userdata["caller_id"]
        return self._fallback_user_id

    @function_tool()
    async def lookup_caller_memory(self, context: RunContext) -> dict:
        """
        Look up the current caller's saved memory.
        """
        caller_id = self._get_caller_id(context)
        if not caller_id:
            return {
                "found": False,
                "message": "Caller identity is unavailable.",
            }

        logger.info("Looking up caller memory: %s", caller_id)
        result = lookup_caller(caller_id)
        return result

    @function_tool()
    async def save_caller_memory(
        self,
        context: RunContext,
        name: str,
        language_preference: str | None = None,
        facts: list[MemoryFact] | None = None,
        consent_confirmed: bool = False,
    ) -> dict:
        """
        Save caller memory only after explicit consent.
        """
        if not consent_confirmed:
            return {
                "success": False,
                "message": "Memory was not saved because caller consent was not confirmed.",
            }

        caller_id = self._get_caller_id(context)
        if not caller_id:
            return {
                "success": False,
                "message": "Caller identity is unavailable.",
            }

        facts_dict: dict[str, Any] = {}
        if facts:
            if isinstance(facts, dict):
                facts_dict = facts
            elif isinstance(facts, list):
                for f in facts:
                    if isinstance(f, MemoryFact):
                        facts_dict[f.key] = f.value
                    elif isinstance(f, dict) and "key" in f and "value" in f:
                        facts_dict[f["key"]] = f["value"]
                    elif isinstance(f, (list, tuple)) and len(f) == 2:
                        facts_dict[str(f[0])] = str(f[1])

        result = save_caller(
            caller_id=caller_id,
            name=name,
            language_preference=language_preference,
            facts=facts_dict,
        )
        return {
            "success": True,
            "message": "Caller memory saved successfully.",
            "memory": result,
        }

    @function_tool()
    async def forget_my_memory(self, context: RunContext) -> dict:
        """
        Delete all saved memory for the current caller.
        """
        caller_id = self._get_caller_id(context)
        if not caller_id:
            return {
                "success": False,
                "message": "Caller identity is unavailable.",
            }

        return forget_caller(caller_id)


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    fallback_user_id = "day7_user"

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Anisha",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
        user_away_timeout=8.0,
    )

    silence_count = {"n": 0}

    @session.on("user_state_changed")
    def on_user_state_changed(ev):
        if ev.new_state == "away":
            silence_count["n"] += 1
            if silence_count["n"] >= 2:
                session.say(
                    "लगता है लाइन ठीक नहीं है, मैं बाद में ट्राई करूँगी। धन्यवाद!"
                )
            else:
                session.say("आप वहीं हैं? मैं सुन रही हूँ।")
        elif ev.new_state == "listening":
            silence_count["n"] = 0

    # Join the room and connect
    await ctx.connect()

    # Safely parse job or room metadata for outbound context
    outbound_meta = {}
    raw_meta = getattr(getattr(ctx, "job", None), "metadata", None) or ctx.room.metadata
    if raw_meta:
        try:
            outbound_meta = json.loads(raw_meta)
            if not isinstance(outbound_meta, dict):
                outbound_meta = {}
        except Exception:
            outbound_meta = {}

    participant = next(iter(ctx.room.remote_participants.values()), None)
    caller_id = participant.identity if participant else fallback_user_id

    # Populate session userdata for tools and context without breaking Day 1-6
    session.userdata = {
        "caller_id": caller_id,
        "phone_number": outbound_meta.get("phone_number", caller_id),
        "patient_name": outbound_meta.get("patient_name", "Patient"),
        "call_type": outbound_meta.get("call_type", "inbound"),
        "call_id": outbound_meta.get("call_id"),
        "details": outbound_meta.get("details", ""),
        "call_mode": outbound_meta.get("call_mode", "inbound"),
    }

    # Start the assistant session
    await session.start(
        agent=Assistant(user_id=fallback_user_id),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # If this is an outbound call, proactively deliver the 2-sentence opening
    if outbound_meta.get("call_mode") == "outbound":
        patient_name = outbound_meta.get("patient_name", "").strip()
        name_prefix = f" {patient_name}" if patient_name and patient_name.lower() != "patient" else ""

        call_type = outbound_meta.get("call_type", "medication_reminder")
        raw_details = outbound_meta.get("details", "").strip()

        # Determine neutral, non-invented reason
        if raw_details and raw_details.lower() != "your scheduled medication reminder":
            reason_text = f"आपकी {raw_details}"
        else:
            if call_type == "medication_reminder":
                reason_text = "आपकी scheduled medication reminder"
            elif call_type == "vaccination_reminder":
                reason_text = "आपके vaccination schedule"
            elif call_type in {"post_triage_followup", "triage_followup"}:
                reason_text = "आपके स्वास्थ्य संबंधी follow-up"
            else:
                reason_text = "आपके health check-in"

        # Exactly 2 Sentences: Sentence 1 (WHO + WHY) | Sentence 2 (Opt-Out)
        outbound_greeting = (
            f"नमस्ते{name_prefix}, मैं Sunrise Family Clinic से Anisha बोल रही हूँ और मैं {reason_text} के लिए कॉल कर रही हूँ। "
            "अगर आप अभी बात नहीं करना चाहते या आगे ऐसे reminder calls नहीं चाहते, तो 'Stop' या 'कॉल बंद करें' बोल दीजिए।"
        )
        logger.info("Delivering compliant outbound opening: %s", outbound_greeting)
        session.say(outbound_greeting)


if __name__ == "__main__":
    cli.run_app(server)