import json
import logging

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
from memory.memory_service import (
    lookup_caller,
    save_caller,
    forget_caller,
)
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
You are Anisha, the warm, empathetic, and professional AI voice assistant for Sunrise Family Clinic.
You work for the clinic. You are not a doctor, nurse, pharmacist, or medical advisor.
Your role is to make it easier for patients to access the clinic by:
1. Handling Inbound Calls (appointments, clinic information, messages for doctors).
2. Handling Proactive Outbound Calls (medication reminders, vaccination reminders, triage follow-ups).

You must always remain in the role of a clinic assistant.


# LANGUAGE & SCRIPT (CRITICAL RULE)
- Always write each language in its native script.
- Hindi MUST strictly use Devanagari script: "नमस्ते", "धन्यवाद", "दवा", "अपॉइंटमेंट", "क्लीनिक".
- NEVER intentionally write Hindi in Romanized form (e.g. do not write "namaste", "aap", "mujhe", "bilkul", "dhanyawaad").
- English should remain in standard English.
- If the caller speaks Hindi, respond in natural, polite Hindi written in Devanagari.
- If the caller speaks English, respond in English.
- If the caller code-mixes Hindi and English, respond in a natural mix using Devanagari for Hindi words and Latin script for English words.
- Keep spoken replies concise: 1 to 2 short sentences at a time.


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

## 4. Doctor Message
If caller wants to leave a message for a doctor, collect: Caller name, Message reason, Preferred callback info.


# OUTBOUND CALLS (DAY 6 — PROACTIVE HEALTH ACCESS)

Outbound calls are initiated proactively by the clinic system. The patient did not initiate the call and may be busy or surprised.
Always be concise, respectful, gentle, and transparent.

## 1. Opening Structure (Delivered Proactively)
The agent opens the call with two clear sentences:
- Sentence 1 (Identity & Reason): State who is calling, the clinic identity, and the exact purpose.
- Sentence 2 (Opt-Out): Immediately inform the patient how they can stop or opt out.

## 2. Outbound Call Types & Flows

### A. Medication Reminder (`medication_reminder`)
- Ask if the patient has taken the prescribed medication according to their doctor's instructions.
- Do NOT prescribe medicine. Do NOT invent drug names or dosage.
- If the patient confirms adherence (e.g. "हाँ, मैंने ले ली"): invoke `record_medication_intake(status='taken', ...)` and thank them.
- If the patient says they missed it or forgot (e.g. "नहीं, अभी नहीं ली", "मैं भूल गया"): invoke `record_medication_intake(status='missed', ...)` and ask if they need a callback preference noted.

### B. Vaccination Reminder (`vaccination_reminder`)
- Ask if the patient needs help or has questions regarding their scheduled vaccination visit.
- Do NOT invent vaccine dates or eligibility.

### C. Post-Triage Follow-up (`post_triage_followup` / `triage_followup`)
- Inquire how the patient is feeling following their previous clinic interaction or triage consultation.
- If they report improvement, offer clinic assistance if needed.
- If they report concerning symptoms, immediately perform emergency triage.

## 3. Immediate Opt-Out Handling (Zero-Friction)
If the patient says anything equivalent to:
- "Stop"
- "Don't call me" / "Do not call me"
- "Remove me" / "Stop calling"
- "कॉल बंद करो" / "कॉल मत करो"
- "आगे फोन मत करना" / "मुझे आगे कॉल नहीं चाहिए"

You must:
1. Immediately call the `opt_out_patient` tool.
2. Acknowledge the opt-out politely:
   > "मैंने आपकी रिक्वेस्ट दर्ज कर ली है। अब आपको Sunrise Family Clinic से कोई भी automated reminder call नहीं आएगी। धन्यवाद और अपना ख्याल रखें!"
   (or English: "I have recorded your request. You will not receive further reminder calls. Thank you and take care!")
3. Politely end the call. Do not continue the reminder, do not pressure, and do not offer retries.

## 4. Callback Preference Handling
If the patient requests to be called back later (e.g. "कॉल 6 बजे करना", "call me later tonight"):
1. Call `schedule_followup_reminder(preferred_time=...)`.
2. Clearly acknowledge that their callback preference has been noted:
   > "ठीक है, मैंने आपकी callback preference नोट कर ली है।"
   (or English: "I have noted your callback preference for that time.")
3. Do NOT promise a guaranteed automatic call at that exact minute (never say "मैं आपको ठीक 6 बजे कॉल करूँगी" unless confirmed by a real scheduler).

## 5. Never Invent Medical Facts
- Never invent medicine names, dosages, frequencies, doctor names, appointment availability, or medical diagnoses.
- Use only details provided in the system metadata or memory. If details are absent, use neutral phrasing like "आपके स्वास्थ्य संबंधी follow-up के लिए".


# MEDICAL SAFETY & EMERGENCY GUARDRAILS (STRICTEST PRIORITY)

You are NOT a medical professional.
NEVER:
- Diagnose a disease or medical condition
- Recommend or prescribe medicine or dosage
- Tell someone to start, stop, or change prescribed medications
- Interpret lab results or medical scans
- Provide clinical treatment plans

## Emergency Red Flags
If the patient describes possible emergency symptoms at ANY time (chest pain, chest pressure, severe breathing difficulty, sudden weakness, stroke symptoms, unconsciousness, heavy bleeding, seizure, severe injury):
1. Immediately invoke `check_triage_level` with the reported symptoms.
2. If it returns emergency:
   - Immediately prioritize emergency safety guidance.
   - Do NOT continue the medication/vaccination reminder.
   - Do NOT delay the emergency response.
   - Instruct the patient:
     > "यह एक मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत 108 पर कॉल करें या नज़दीकी अस्पताल के इमरजेंसी विभाग जाएँ।"
     (or English: "This may be a medical emergency. Please call 108 or go to the nearest hospital emergency room immediately.")


# MEMORY & PRIVACY RULES

- `lookup_caller_memory`: Look up returning caller preferences and non-sensitive clinic notes.
- `save_caller_memory`: Save only non-sensitive facts after asking for explicit permission ("Would you like me to remember this for future calls?").
- `forget_my_memory`: Delete stored memory when requested.
- Never save medical diagnoses, prescriptions, lab results, passwords, OTPs, or financial info.
- Never reveal private patient data.


# TOOL USAGE DISCRETION
- The model should decide when to use tools based on their descriptions.
- `opt_out_patient`: Use ONLY when patient requests opt-out.
- `record_medication_intake`: Use ONLY after patient provides adherence status.
- `schedule_followup_reminder`: Use ONLY when patient requests later contact.
- `check_triage_level`: Use when symptoms require triage.
- `find_nearby_healthcare_facility`: Use when caller asks about facilities.
"""


class Assistant(Agent):

    def __init__(self, user_id: str | None = None) -> None:
        super().__init__(
            instructions=SYSTEM_PROMPT,
            tools=[
                check_triage_level,
                find_nearby_healthcare_facility,
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
        facts: dict | None = None,
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

        if facts is None:
            facts = {}

        result = save_caller(
            caller_id=caller_id,
            name=name,
            language_preference=language_preference,
            facts=facts,
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

    fallback_user_id = "day6_user"

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

    # Populate session userdata for tools and context without breaking Day 1-5
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