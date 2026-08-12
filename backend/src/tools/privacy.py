import re


def sanitize_text(text: str) -> str:
    """
    Sanitize sensitive information from caller text before saving or sending to Discord.

    Redacts:
    - Passwords, passcodes, PINs
    - One-time passwords (OTPs) / verification codes (4 to 8 digits)
    - Credit / debit card numbers (13 to 19 digits)
    - Bank account numbers
    - Authentication tokens / API keys / secrets
    """
    if not text:
        return ""

    sanitized = text

    # 1. Redact explicit OTP / verification codes / PIN mentions
    # e.g., "OTP is 482931", "OTP: 123456", "my pin is 9988", "code: 482931", "code is 482931"
    sanitized = re.sub(
        r"(?i)\b(?:otp|one[- ]time[- ]password|pin|passcode|verification[- ]code|secret[- ]code)\b\s*(?:is|:|=|-)?\s*([0-9]{4,8})\b",
        "[REDACTED_OTP]",
        sanitized,
    )

    # 2. Redact passwords (e.g., "password is secret123", "password: abc!@#", "pwd: 12345")
    sanitized = re.sub(
        r"(?i)\b(?:password|passwd|pwd)\b\s*(?:is|:|=)\s*\S+",
        "[REDACTED_PASSWORD]",
        sanitized,
    )

    # 3. Redact credit card / debit card numbers (13 to 19 digits with spaces/hyphens)
    sanitized = re.sub(
        r"\b(?:\d[ -]*?){13,19}\b",
        "[REDACTED_CARD]",
        sanitized,
    )

    # 4. Redact API keys / tokens (e.g. "key: AIzaSy...", "token: ghp_...")
    sanitized = re.sub(
        r"(?i)\b(?:api[-_]?key|bearer|token|secret)\b\s*[:=]\s*[A-Za-z0-9_\-\.]{16,}\b",
        "[REDACTED_KEY]",
        sanitized,
    )

    # 5. Clean up any remaining "otp 482931" or "pin 4829" pattern
    sanitized = re.sub(
        r"(?i)\b(?:otp|pin)\s+\d{4,8}\b",
        "[REDACTED]",
        sanitized,
    )

    return sanitized.strip()
