-- D-138B: User-owned archive/export backend foundation.
--
-- Additive only: new nullable/default-0 columns and one index, no data
-- changes, no column removal. Production apply is GATED — do NOT run this
-- migration without explicit per-session approval. Safe to run multiple
-- times (ADD COLUMN is not idempotent in SQLite, so re-running against an
-- already-migrated database will error on the duplicate column — this is
-- expected and matches the pattern of prior gated migrations in this repo).
--
-- Adds an `archived_by_user` flag to the four moderated content tables so a
-- user-initiated archive (review_state='archived') can be told apart from an
-- admin reviewCleanup() archive, without changing review_state semantics or
-- any existing queue-exclusion query (`NOT IN ('archived',...)` continues to
-- work unchanged for both archive sources).
--
-- Adds `hidden_at` to belief_snapshots, which has no review_state column at
-- all today (immutable, insert-only table) — this is its first soft-hide
-- mechanism.
--
-- Adds `updated_at` to evidence, which previously had no updated_at column
-- (see src/worker.js myHumanX() comment "evidence has no updated_at
-- column") — needed so the archive endpoint can stamp evidence rows the
-- same way it stamps claims/truths/pressure_points.
--
-- No hard-delete columns. No deletion-timestamp column. No restore endpoint
-- in this patch.

ALTER TABLE claims ADD COLUMN archived_by_user INTEGER DEFAULT 0;
ALTER TABLE truths ADD COLUMN archived_by_user INTEGER DEFAULT 0;
ALTER TABLE evidence ADD COLUMN archived_by_user INTEGER DEFAULT 0;
ALTER TABLE pressure_points ADD COLUMN archived_by_user INTEGER DEFAULT 0;

ALTER TABLE belief_snapshots ADD COLUMN hidden_at INTEGER;

ALTER TABLE evidence ADD COLUMN updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_belief_snapshots_hidden_at ON belief_snapshots(hidden_at);
