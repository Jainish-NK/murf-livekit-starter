import asyncio
import logging
import os
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage

logger = logging.getLogger("email_service")


def _send_email_sync(
    to_email: str,
    from_email: str,
    subject: str,
    body: str,
    smtp_host: str,
    smtp_port: int,
    smtp_username: str | None = None,
    smtp_password: str | None = None,
) -> bool:
    """Synchronous SMTP email sender helper."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    msg.set_content(body)

    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)

        with server:
            if smtp_port != 465:
                server.ehlo()
                server.starttls()
                server.ehlo()

            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)

            server.send_message(msg)
            logger.info("[ESCALATION] Email notification sent successfully to %s", to_email)
            return True
    except Exception as exc:
        logger.error(
            "[ESCALATION] SMTP email dispatch failed: %s",
            type(exc).__name__,
        )
        return False


async def send_escalation_email(
    reference_id: str,
    reason: str,
    summary: str,
    what_agent_checked: str,
    urgency: str,
    language: str,
    preferred_followup: str,
) -> bool:
    """
    Send formatted escalation notification email to the human support team.
    Returns True if successfully sent, False otherwise.
    """
    to_email = os.environ.get("ESCALATION_EMAIL_TO", "").strip()
    from_email = os.environ.get("ESCALATION_EMAIL_FROM", "").strip()
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    port_str = os.environ.get("SMTP_PORT", "587").strip()
    smtp_username = os.environ.get("SMTP_USERNAME", "").strip() or None
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip() or None

    if not to_email or not from_email or not smtp_host:
        logger.error(
            "[ESCALATION] Email configuration missing (ESCALATION_EMAIL_TO, ESCALATION_EMAIL_FROM, or SMTP_HOST is not set)"
        )
        return False

    try:
        smtp_port = int(port_str)
    except ValueError:
        smtp_port = 587

    urgency_upper = urgency.upper()
    now_utc = datetime.now(timezone.utc)
    created_readable = now_utc.strftime("%d %B %Y, %H:%M UTC")

    # Format Subject: [SehatSaathi] Human Escalation — ESC-2026-025 — EMERGENCY
    subject = f"[SehatSaathi] Human Escalation — {reference_id} — {urgency_upper}"

    # Format Professional Body
    body = (
        "SEHATSAATHI HUMAN ESCALATION REQUEST\n\n"
        f"Reference ID:\n{reference_id}\n\n"
        f"Reason:\n{reason}\n\n"
        f"Urgency:\n{urgency_upper}\n\n"
        f"Summary:\n{summary}\n\n"
        f"What the Agent Checked:\n{what_agent_checked}\n\n"
        f"Language:\n{language}\n\n"
        f"Preferred Follow-up:\n{preferred_followup}\n\n"
        "Status:\nOPEN\n\n"
        f"Created At:\n{created_readable}\n"
    )

    # Run blocking SMTP in a separate thread so asyncio loop is not blocked
    return await asyncio.to_thread(
        _send_email_sync,
        to_email=to_email,
        from_email=from_email,
        subject=subject,
        body=body,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_username=smtp_username,
        smtp_password=smtp_password,
    )
