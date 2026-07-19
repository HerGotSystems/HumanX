#!/usr/bin/env python3
"""Run UNTESTED schema/trigger smoke checks against an in-memory SQLite DB.

No Wrangler, network, repository, or persistent database writes are performed.
"""
from pathlib import Path
import sqlite3
import sys

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "migrations" / "0010_untested_schema.sql"
TRIGGERS = ROOT / "migrations" / "0011_untested_triggers.sql"

passed = 0


def check(name, fn):
    global passed
    try:
        fn()
        passed += 1
        print(f"PASS {name}")
    except Exception as exc:
        print(f"FAIL {name}: {exc}", file=sys.stderr)
        raise


def expect_error(conn, sql, params, marker):
    try:
        conn.execute(sql, params)
    except sqlite3.DatabaseError as exc:
        if marker not in str(exc):
            raise AssertionError(f"expected {marker}, got {exc}") from exc
        return
    raise AssertionError(f"expected database error containing {marker}")


conn = sqlite3.connect(":memory:")
conn.execute("PRAGMA foreign_keys=ON")
conn.executescript(SCHEMA.read_text(encoding="utf-8"))
conn.executescript(TRIGGERS.read_text(encoding="utf-8"))

version = "smoke-v1"
conn.execute(
    "INSERT INTO untested_instrument_versions (instrument_version,created_at) VALUES (?,?)",
    (version, 1),
)

check(
    "unsealed session rejected",
    lambda: expect_error(
        conn,
        "INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES (?,?,?)",
        ("unt_unsealed", version, 1),
        "UNTESTED_VERSION_NOT_SEALED",
    ),
)

before = conn.execute(
    "SELECT draft_revision FROM untested_instrument_versions WHERE instrument_version=?",
    (version,),
).fetchone()[0]
conn.execute(
    "INSERT INTO untested_instrument_copy VALUES (?,?,?,?,?)",
    (version, "open", "close", "confidence", "results"),
)
after_insert = conn.execute(
    "SELECT draft_revision FROM untested_instrument_versions WHERE instrument_version=?",
    (version,),
).fetchone()[0]
check("definition insert increments revision", lambda: (_ for _ in ()).throw(AssertionError()) if after_insert != before + 1 else None)

conn.execute(
    "UPDATE untested_instrument_copy SET opening_text=? WHERE instrument_version=?",
    ("open-2", version),
)
after_update = conn.execute(
    "SELECT draft_revision FROM untested_instrument_versions WHERE instrument_version=?",
    (version,),
).fetchone()[0]
check("definition update increments revision", lambda: (_ for _ in ()).throw(AssertionError()) if after_update != after_insert + 1 else None)

stale_revision = after_insert
result = conn.execute(
    "UPDATE untested_instrument_versions SET content_hash=?,sealed_at=? WHERE instrument_version=? AND sealed_at IS NULL AND draft_revision=?",
    ("a" * 64, 2, version, stale_revision),
)
check("stale revision cannot seal", lambda: (_ for _ in ()).throw(AssertionError()) if result.rowcount != 0 else None)

current_revision = conn.execute(
    "SELECT draft_revision FROM untested_instrument_versions WHERE instrument_version=?",
    (version,),
).fetchone()[0]
result = conn.execute(
    "UPDATE untested_instrument_versions SET content_hash=?,sealed_at=? WHERE instrument_version=? AND sealed_at IS NULL AND draft_revision=?",
    ("b" * 64, 3, version, current_revision),
)
check("matching revision seals exactly once", lambda: (_ for _ in ()).throw(AssertionError()) if result.rowcount != 1 else None)

check(
    "session accepted after seal",
    lambda: conn.execute(
        "INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES (?,?,?)",
        ("unt_sealed", version, 4),
    ),
)

check(
    "sealed definition insert rejected",
    lambda: expect_error(
        conn,
        "INSERT INTO untested_confidence_definitions VALUES (?,?,?,?)",
        (version, 0, "No", 0),
        "UNTESTED_VERSION_SEALED",
    ),
)
check(
    "sealed definition update rejected",
    lambda: expect_error(
        conn,
        "UPDATE untested_instrument_copy SET opening_text=? WHERE instrument_version=?",
        ("mutated", version),
        "UNTESTED_VERSION_SEALED",
    ),
)
check(
    "sealed definition delete rejected",
    lambda: expect_error(
        conn,
        "DELETE FROM untested_instrument_copy WHERE instrument_version=?",
        (version,),
        "UNTESTED_VERSION_SEALED",
    ),
)
check(
    "sealed version update rejected",
    lambda: expect_error(
        conn,
        "UPDATE untested_instrument_versions SET content_hash=? WHERE instrument_version=?",
        ("c" * 64, version),
        "UNTESTED_VERSION_IMMUTABLE",
    ),
)
check(
    "sealed version delete rejected",
    lambda: expect_error(
        conn,
        "DELETE FROM untested_instrument_versions WHERE instrument_version=?",
        (version,),
        "UNTESTED_VERSION_IMMUTABLE",
    ),
)

print(f"\n{passed} passed, 0 failed")
