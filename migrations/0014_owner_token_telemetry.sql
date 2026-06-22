-- D-147B: persistent owner-token telemetry foundation.
--
-- Additive only: one new table, no changes to any existing table. Does not
-- touch users/claims/truths/evidence/pressure_points/belief_snapshots or
-- any other existing data. Production apply is GATED — do NOT run this
-- migration without explicit per-session approval.
--
-- This table stores only safe, already-sanitized metadata that the existing
-- console-only telemetry (D-146B) already computes: a route name, a status
-- bucket (secret_missing/missing/invalid/expired/uid_mismatch/valid), an
-- optional 6-character non-reversible suffix of the user id, and an
-- optional non-reversible hash of the request's User-Agent header for
-- rough request-family grouping.
--
-- Deliberately NEVER stored here or anywhere else:
--   - the raw owner_token value
--   - HUMANX_OWNER_SECRET
--   - the full user id
--   - request headers (beyond the one-way User-Agent hash)
--   - request body
--   - IP address
--
-- Writes to this table are best-effort (see logOwnerTokenTelemetry() in
-- src/worker.js) — a failed insert never blocks or fails the calling route,
-- and console logging continues regardless of whether this table exists.

CREATE TABLE IF NOT EXISTS owner_token_telemetry (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  status TEXT NOT NULL,
  uid_suffix TEXT,
  user_agent_hash TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_owner_token_telemetry_created_at ON owner_token_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_owner_token_telemetry_status ON owner_token_telemetry(status);
CREATE INDEX IF NOT EXISTS idx_owner_token_telemetry_route ON owner_token_telemetry(route);
