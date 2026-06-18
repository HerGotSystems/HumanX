-- D-137B: My HumanX personal dashboard — user_id indexes.
--
-- Additive, zero-risk: pure index creation, no column or data changes.
-- Production apply is GATED — do NOT run this migration without explicit
-- per-session approval. Safe to run multiple times (IF NOT EXISTS).
--
-- Of the user-linked tables, only belief_snapshots already had a user_id
-- index (idx_belief_snapshots_user_id, see 0003_full_schema.sql). The
-- My HumanX dashboard (GET /api/my-humanx) queries claims, truths,
-- evidence, pressure_points, and home_tests by user_id — without these
-- indexes those queries would be full table scans.

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_truths_user_id ON truths(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_pressure_points_user_id ON pressure_points(user_id);
CREATE INDEX IF NOT EXISTS idx_home_tests_user_id ON home_tests(user_id);
