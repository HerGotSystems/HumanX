-- D-136B: invite-code auth backend foundation
--
-- Adds optional verified-identity fields to users and a single-use
-- invite_codes table. Backward compatible: all new users columns are
-- nullable / default 0, existing anonymous rows and existing
-- claims/truths/evidence linked by user_id are untouched.
--
-- Production apply is GATED — do NOT run this migration without explicit
-- per-session approval and a PRAGMA preflight confirming the columns/table
-- are absent.
--
-- Do NOT rerun if columns already exist — ALTER TABLE will fail with
-- "duplicate column name". Always check with:
--   PRAGMA table_info(users);
-- before applying.
--
-- This migration MUST be applied to the production D1 database BEFORE
-- deploying any Worker code that references these columns/table.
-- Deploying the Worker first will cause INSERT/UPDATE failures and
-- query errors against the live database.
--
-- Does NOT add a UNIQUE constraint on users.handle — handle uniqueness
-- is a pre-existing gap (unrelated to this change) and is intentionally
-- left for a separate follow-up migration once duplicate handles in the
-- existing data are resolved.
--
-- Does NOT touch users.is_admin — invite redemption must never grant
-- admin rights; that column is untouched by this migration and by the
-- D-136B Worker code that consumes these new columns.

ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verified_at INTEGER;
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Partial unique index: enforces one user per email while allowing many
-- NULL emails (anonymous users do not collide with each other).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  created_by TEXT,
  created_at INTEGER,
  redeemed_by TEXT,
  redeemed_at INTEGER,
  email_hint TEXT,
  expires_at INTEGER,
  revoked INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_redeemed_by
  ON invite_codes(redeemed_by);
