-- D-90B: pressure point moderation
-- Adds review_state, report_count, and updated_at to pressure_points.
--
-- Production apply is GATED — do NOT run this migration without explicit
-- per-session approval and a PRAGMA preflight confirming the columns are absent.
--
-- Do NOT rerun if columns already exist — ALTER TABLE will fail with
-- "duplicate column name". Always check with:
--   PRAGMA table_info(pressure_points);
-- before applying.
--
-- This migration MUST be applied to the production D1 database BEFORE
-- deploying any Worker code that references these columns (D-90B PR).
-- Deploying the Worker first will cause INSERT failures and query errors
-- against the live database.
--
-- DEFAULT 'public' on review_state preserves all existing pressure rows
-- as publicly visible — no retroactive hiding. New inserts after the
-- Worker code is deployed will use review_state='review' explicitly.

ALTER TABLE pressure_points ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE pressure_points ADD COLUMN report_count INTEGER DEFAULT 0;
ALTER TABLE pressure_points ADD COLUMN updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_pressure_points_review_state
  ON pressure_points (review_state);

CREATE INDEX IF NOT EXISTS idx_pressure_points_report_count
  ON pressure_points (report_count);
