import sqlite3
from pathlib import Path


# ---------------------------------------------------------
# DATABASE LOCATION
# ---------------------------------------------------------

# database.py
#   ↓
# backend/src/memory/database.py
#
# parents[0] = memory
# parents[1] = src
# parents[2] = backend

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR / "data"

DB_PATH = DATA_DIR / "memory.db"


# ---------------------------------------------------------
# DATABASE CONNECTION
# ---------------------------------------------------------

def get_connection() -> sqlite3.Connection:
    """
    Create and return a SQLite database connection.
    """

    # Create backend/data automatically.
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    connection = sqlite3.connect(
        DB_PATH,
        timeout=10,
    )

    # Allow:
    # row["name"]
    # instead of:
    # row[1]

    connection.row_factory = sqlite3.Row

    return connection


# ---------------------------------------------------------
# INITIALIZE DATABASE
# ---------------------------------------------------------

def init_database() -> None:
    """
    Create the caller_memory and call_analytics tables if they do not exist.
    """

    with get_connection() as connection:

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS caller_memory (
                caller_id TEXT PRIMARY KEY,
                name TEXT,
                language_preference TEXT,
                facts TEXT,
                last_interaction TEXT
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS call_analytics (
                call_id TEXT PRIMARY KEY,
                caller_id TEXT,
                call_mode TEXT,
                language TEXT,
                start_time TEXT,
                end_time TEXT,
                duration INTEGER,
                status TEXT,
                outcome TEXT,
                failure_reason TEXT,
                success_reason TEXT,
                handoff_count INTEGER DEFAULT 0,
                specialist_used TEXT,
                agent_path TEXT,
                handoff_status TEXT,
                specialist_task TEXT,
                created_at TEXT
            )
            """
        )

        # Ensure newly added columns exist in older database files
        existing_cols = {
            col[1]
            for col in connection.execute("PRAGMA table_info(call_analytics)").fetchall()
        }
        for col_name, col_type in [
            ("handoff_count", "INTEGER DEFAULT 0"),
            ("specialist_used", "TEXT"),
            ("agent_path", "TEXT"),
            ("handoff_status", "TEXT"),
            ("specialist_task", "TEXT"),
        ]:
            if col_name not in existing_cols:
                try:
                    connection.execute(
                        f"ALTER TABLE call_analytics ADD COLUMN {col_name} {col_type}"
                    )
                except Exception:
                    pass

        connection.commit()


# ---------------------------------------------------------
# TEST DATABASE DIRECTLY
# ---------------------------------------------------------

if __name__ == "__main__":

    init_database()

    print("SQLite database initialized successfully.")

    print(
        f"Database location: {DB_PATH}"
    )