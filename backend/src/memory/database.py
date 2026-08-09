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
    Create the caller_memory table if it does not exist.
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