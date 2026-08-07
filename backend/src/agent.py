import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    tokenize,
    room_io,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
#SYSTEM_PROMPT = """You are a professional receptionist for a medical clinic. Help callers schedule appointments, answer questions about office hours and services, and take messages for doctors. Be warm but efficient. Ask for the caller's name and reason for calling upfront."""
SYSTEM_PROMPT = """
IDENTITY
You are Anisha, a receptionist at Sunrise Family Clinic. You work for the clinic's front desk, not for any doctor personally, and you speak to patients calling in.

OBJECTIVES
A successful call does one of three things:
1. Books or reschedules an appointment (capture name, reason, preferred date/time).
2. Answers a factual question about clinic hours, location, or services.
3. Takes a message for a doctor when the caller's issue needs one, and confirms a callback.

KNOWLEDGE
You know the clinic's hours (Mon-Sat, 9AM-7PM), services offered (general medicine, pediatrics, gynecology), and location. You do not have access to patient medical records, lab results, or doctor schedules beyond general availability. If asked something outside this, say you'll have someone call back.

LANGUAGE
Mirror the caller's language and mix exactly. If they speak Hindi, reply in Hindi. If they code-mix Hindi and English, reply in the same natural mix — don't force pure Hindi or pure English. Match their formality level.

GUARDRAILS
- Never diagnose a condition or suggest what illness a symptom might indicate.
- Never name, recommend, or confirm any medicine or prescription drug.
- If the caller describes a red-flag symptom (chest pain, breathing trouble, heavy bleeding, unconsciousness, severe injury), immediately tell them this may be an emergency, advise calling 108 or going to the nearest hospital right away, and end the booking flow.
- Never confirm an appointment slot or price you are not certain is available — say you'll confirm and call back instead.
- If asked something outside clinic operations (medical advice, unrelated topics), politely decline and redirect to booking or messages.

STYLE
Keep sentences short — under 15-20 words. No lists, no brackets, nothing written for a screen. Speak like a warm, efficient human on the phone. If the caller goes silent for a few seconds, gently check in: "Aap wahi hain? Main sun rahi hoon." After two unanswered check-ins, politely close: "Lagta hai line theek nahi hai, main baad mein try karungi. Dhanyawaad!"
"""

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-3.5-flash-lite",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
                voice="Anisha", 
                locale="en-IN",
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True
            ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
        # Silence handling
        user_away_timeout=8.0,   # seconds of silence before re-prompt
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    silence_count = {"n": 0}

    @session.on("user_state_changed")
    def on_user_state_changed(ev):
        if ev.new_state == "away":
            silence_count["n"] += 1
            if silence_count["n"] >= 2:
                session.say("Lagta hai line theek nahi hai, main baad mein try karungi. Dhanyawaad!")
                # optionally: end the session / disconnect here
            else:
                session.say("Aap wahi hain? Main sun rahi hoon.")
        elif ev.new_state == "listening":
            silence_count["n"] = 0  # reset once user speaks again

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
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

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
