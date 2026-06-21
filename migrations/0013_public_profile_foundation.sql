-- D-140B: Public profile settings foundation.
--
-- Additive only: new nullable/default-0 columns and one partial unique
-- index, no data changes, no column removal. Production apply is GATED —
-- do NOT run this migration without explicit per-session approval.
--
-- This migration only adds the storage for a future public profile. It does
-- NOT make anything public by itself — profile_public defaults to 0 for
-- every existing and new user, and no read endpoint exposes these columns
-- to anyone but the owner (see GET /api/my-humanx). The public read route
-- and public profile page are explicitly deferred to a later patch
-- (see docs/D140A audit).
--
-- profile_slug is a separate, user-chosen public identifier — distinct
-- from `handle`, which has no uniqueness constraint and is also used as
-- the anonymous display name everywhere else in the app.
--
-- The partial unique index follows the same NULLs-never-collide pattern
-- already used for users.email in migration 0010_invite_auth.sql.

ALTER TABLE users ADD COLUMN profile_public INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN profile_slug TEXT;
ALTER TABLE users ADD COLUMN profile_bio TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_slug
  ON users(profile_slug) WHERE profile_slug IS NOT NULL;

-- Per-snapshot opt-in for future Belief Mirror sharing — independent of
-- belief_snapshots.hidden_at (hide from self), since "shown to others" and
-- "hidden from my own dashboard" are separate states. Unused by any
-- endpoint in this patch.
ALTER TABLE belief_snapshots ADD COLUMN public_summary_enabled INTEGER DEFAULT 0;
