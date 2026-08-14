import logging
from typing import Any

import os
from livekit.agents import NOT_GIVEN, Agent, RunContext, function_tool, tokenize
from livekit.plugins import murf

try:
    from tools.clinic_tools import (
        book_appointment,
        cancel_appointment,
        check_doctor_availability,
        get_clinic_info_and_timings,
        reschedule_appointment,
    )
    from tools.handoff_tools import HandoffContext, handback_to_main_agent
except ImportError:
    from src.tools.clinic_tools import (
        book_appointment,
        cancel_appointment,
        check_doctor_availability,
        get_clinic_info_and_timings,
        reschedule_appointment,
    )
    from src.tools.handoff_tools import HandoffContext, handback_to_main_agent

logger = logging.getLogger("clinic_agent")


def create_specialist_tts(language: str | None = "Hindi"):
    """
    Configure the Clinic & Appointment Specialist with the Murf Nikhil voice,
    FALCON model, Conversational style, and appropriate locale.
    """
    if not os.environ.get("MURF_API_KEY"):
        return NOT_GIVEN

    lang_str = str(language).lower() if language else "hindi"
    is_hindi = lang_str.startswith("hi") or "devanagari" in lang_str
    locale = "hi-IN" if is_hindi else "en-IN"

    return murf.TTS(
        voice="Nikhil",
        model="FALCON",
        locale=locale,
        style="Conversational",
        sample_rate=24000,
        tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
        text_pacing=True,
    )


SPECIALIST_SYSTEM_PROMPT = """
# IDENTITY & ROLE
You are SehatSaathi AI's Clinic & Appointment Specialist for Sunrise Family Clinic.
You are a dedicated specialist assistant for clinic timings, doctor schedules, and appointment management.
You are NOT a doctor, nurse, or medical practitioner.

# SCOPE OF RESPONSIBILITIES
You handle ONLY:
1. Clinic timings and location details.
2. Department and doctor services (General Medicine, Pediatrics, Gynecology).
3. Doctor availability and schedule checks.
4. Booking new appointments with reference IDs.
5. Rescheduling existing appointments.
6. Cancelling existing appointments.
7. Answering clinic/appointment questions.

# STRICT BOUNDARIES & LIMITS (MANDATORY RULES)
1. NEVER diagnose diseases or claim certainty about a medical condition.
2. NEVER prescribe medications or advise dosages.
3. NEVER make emergency medical decisions or advise waiting for severe symptoms.
4. NEVER fabricate doctor availability. Always call `check_doctor_availability` or `get_clinic_info_and_timings`.
5. NEVER ask for passwords, OTPs, PINs, bank details, card numbers, or unnecessary secrets.
6. Ask only information needed for appointments (patient name, doctor, preferred date, time slot, reason).

# OUT-OF-SCOPE & SAFETY HANDBACK (CRITICAL)
- If the user asks a GENERAL HEALTH question (healthy breakfast, nutrition, diet, water intake, general illness questions like fever tips):
  -> Call `handback_to_main_agent(reason="general_health_query", context_summary=...)`.
  -> Announce: "यह general health question है। मैं आपको SehatSaathi assistant के पास वापस connect करता हूँ।" (or English: "That is a general health question. Let me connect you back with the main SehatSaathi assistant.")
- If the user describes EMERGENCY / RED-FLAG symptoms (severe chest pain, difficulty breathing, heavy bleeding, stroke symptoms) or REQUESTS A DIAGNOSIS ("Can you diagnose me?"):
  -> IMMEDIATELY call `handback_to_main_agent(reason="emergency_safety_escalation", context_summary=...)`.
  -> The Main Agent will immediately take over and execute the safety triage / Day 7 human escalation protocol.

# LANGUAGE & SCRIPT
- Reply in the caller's preferred language.
- Hindi MUST strictly use Devanagari script: "नमस्ते", "अपॉइंटमेंट", "डॉक्टर", "क्लीनिक", "तारीख", "समय".
- NEVER write Romanized Hindi (e.g. do NOT write "namaste", "appointment book kar deta hoon").
- English should remain standard English.
- Keep responses concise: 1 to 2 short sentences at a time.
"""


def build_specialist_instructions(handoff_ctx: HandoffContext | None) -> str:
    instructions = SPECIALIST_SYSTEM_PROMPT
    if handoff_ctx:
        instructions += "\n\n# CURRENT TRANSFERRED CONTEXT FROM MAIN AGENT\n"
        instructions += f"- User Intent: {handoff_ctx.intent}\n"
        if handoff_ctx.doctor_preference:
            instructions += f"- Doctor Preference: {handoff_ctx.doctor_preference}\n"
        if handoff_ctx.requested_date:
            instructions += f"- Requested Date: {handoff_ctx.requested_date}\n"
        if handoff_ctx.preferred_time:
            instructions += f"- Preferred Time: {handoff_ctx.preferred_time}\n"
        if handoff_ctx.language:
            instructions += f"- Language: {handoff_ctx.language}\n"
        if handoff_ctx.relevant_consented_memory:
            instructions += f"- Consented Memory: {handoff_ctx.relevant_consented_memory}\n"
        instructions += "\nIMPORTANT: The user ALREADY told the main agent the above information. Do NOT ask them to repeat it. Acknowledge and proceed immediately."
    return instructions


class ClinicSpecialistAgent(Agent):

    def __init__(self, handoff_context: HandoffContext | None = None) -> None:
        self.handoff_context = handoff_context
        instructions = build_specialist_instructions(handoff_context)
        language = handoff_context.language if handoff_context else "Hindi"
        specialist_tts = create_specialist_tts(language)

        super().__init__(
            instructions=instructions,
            tts=specialist_tts,
            tools=[
                get_clinic_info_and_timings,
                check_doctor_availability,
                book_appointment,
                reschedule_appointment,
                cancel_appointment,
                handback_to_main_agent,
            ],
        )

    async def on_enter(self) -> None:
        """
        Deliver the specialist introduction as soon as the agent becomes active.
        Acknowledges transferred context so the caller never needs to repeat their request.
        """
        ctx = self.handoff_context
        lang = str(ctx.language).lower() if ctx and ctx.language else "hindi"
        is_hindi = lang.startswith("hi") or lang.startswith("devanagari")

        # Formulate contextual greeting acknowledging transferred context
        if is_hindi:
            if ctx and (ctx.doctor_preference or ctx.requested_date or ctx.preferred_time):
                details = []
                if ctx.requested_date:
                    details.append(ctx.requested_date)
                if ctx.preferred_time:
                    details.append(ctx.preferred_time)
                if ctx.doctor_preference:
                    details.append(ctx.doctor_preference)
                details_str = " ".join(details)
                greeting = f"नमस्ते! मैं SehatSaathi का Clinic और Appointment Specialist हूँ। आपने {details_str} की appointment के बारे में पूछा था। मैं आपकी booking में मदद करता हूँ।"
            else:
                greeting = "नमस्ते! मैं SehatSaathi का Clinic और Appointment Specialist हूँ। मैं आपकी appointment में मदद करूँगा। आपने डॉक्टर की appointment के बारे में पूछा था।"
        else:
            if ctx and (ctx.doctor_preference or ctx.requested_date or ctx.preferred_time):
                details = []
                if ctx.doctor_preference:
                    details.append(f"with {ctx.doctor_preference}")
                if ctx.requested_date:
                    details.append(f"for {ctx.requested_date}")
                if ctx.preferred_time:
                    details.append(f"in the {ctx.preferred_time}")
                details_str = " ".join(details)
                greeting = f"Hello! I'm SehatSaathi's Clinic and Appointment Specialist. You asked for an appointment {details_str}. I'll help you complete the booking."
            else:
                greeting = "Hello! I'm SehatSaathi's Clinic and Appointment Specialist. I'll help you with your appointment."

        logger.info("Delivering specialist introduction: %s", greeting)
        if hasattr(self, "session") and self.session:
            self.session.say(greeting)
