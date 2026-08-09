import json
from datetime import datetime, timezone
from typing import Any

from .database import (
    get_connection,
    init_database,
)


# ---------------------------------------------------------
# LOOKUP CALLER
# ---------------------------------------------------------

def lookup_caller(
    caller_id: str,
) -> dict[str, Any]:
    """
    Look up a caller from persistent SQLite memory.

    Returns:
        {
            "found": True/False,
            "caller_id": "...",
            "name": "...",
            "language_preference": "...",
            "facts": {...},
            "last_interaction": "..."
        }
    """

    init_database()

    with get_connection() as connection:

        row = connection.execute(
            """
            SELECT
                caller_id,
                name,
                language_preference,
                facts,
                last_interaction
            FROM caller_memory
            WHERE caller_id = ?
            """,
            (caller_id,),
        ).fetchone()

    # -----------------------------------------------------
    # Caller not found
    # -----------------------------------------------------

    if row is None:

        return {
            "found": False,
            "caller_id": caller_id,
        }

    # -----------------------------------------------------
    # Convert JSON facts back into dictionary
    # -----------------------------------------------------

    try:

        facts = (
            json.loads(row["facts"])
            if row["facts"]
            else {}
        )

    except json.JSONDecodeError:

        facts = {}

    return {
        "found": True,
        "caller_id": row["caller_id"],
        "name": row["name"],
        "language_preference": row[
            "language_preference"
        ],
        "facts": facts,
        "last_interaction": row[
            "last_interaction"
        ],
    }


# ---------------------------------------------------------
# SAVE / UPDATE CALLER
# ---------------------------------------------------------

def save_caller(
    caller_id: str,
    name: str,
    language_preference: str | None = None,
    facts: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Create or update caller memory.

    Only non-sensitive information should be stored.
    """

    init_database()

    if facts is None:
        facts = {}

    # -----------------------------------------------------
    # Current UTC timestamp
    # -----------------------------------------------------

    timestamp = datetime.now(
        timezone.utc
    ).isoformat()

    # -----------------------------------------------------
    # Convert dictionary → JSON
    # -----------------------------------------------------

    facts_json = json.dumps(
        facts,
        ensure_ascii=False,
    )

    with get_connection() as connection:

        existing = connection.execute(
            """
            SELECT
                caller_id,
                name,
                language_preference,
                facts
            FROM caller_memory
            WHERE caller_id = ?
            """,
            (caller_id,),
        ).fetchone()

        # -------------------------------------------------
        # UPDATE EXISTING CALLER
        # -------------------------------------------------

        if existing:

            existing_facts = {}

            try:

                if existing["facts"]:
                    existing_facts = json.loads(
                        existing["facts"]
                    )

            except json.JSONDecodeError:

                existing_facts = {}

            # New facts overwrite matching keys.
            # Existing facts remain untouched.
            merged_facts = {
                **existing_facts,
                **facts,
            }

            final_name = (
                name
                if name
                else existing["name"]
            )

            final_language = (
                language_preference
                if language_preference
                else existing[
                    "language_preference"
                ]
            )

            connection.execute(
                """
                UPDATE caller_memory

                SET
                    name = ?,
                    language_preference = ?,
                    facts = ?,
                    last_interaction = ?

                WHERE caller_id = ?
                """,
                (
                    final_name,
                    final_language,
                    json.dumps(
                        merged_facts,
                        ensure_ascii=False,
                    ),
                    timestamp,
                    caller_id,
                ),
            )

        # -------------------------------------------------
        # INSERT NEW CALLER
        # -------------------------------------------------

        else:

            connection.execute(
                """
                INSERT INTO caller_memory (
                    caller_id,
                    name,
                    language_preference,
                    facts,
                    last_interaction
                )

                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    caller_id,
                    name,
                    language_preference,
                    facts_json,
                    timestamp,
                ),
            )

        connection.commit()

    # Return the saved record.
    return lookup_caller(caller_id)


# ---------------------------------------------------------
# FORGET CALLER
# ---------------------------------------------------------

def forget_caller(
    caller_id: str,
) -> dict[str, Any]:
    """
    Permanently delete saved memory for a caller.
    """

    init_database()

    with get_connection() as connection:

        cursor = connection.execute(
            """
            DELETE FROM caller_memory
            WHERE caller_id = ?
            """,
            (caller_id,),
        )

        connection.commit()

        deleted = cursor.rowcount > 0

    return {
        "success": deleted,
        "caller_id": caller_id,
        "message": (
            "Caller memory deleted."
            if deleted
            else "No saved memory found."
        ),
    }