-- D-128B — Claim Builder structured context table
-- Draft migration only. Do not run against production D1 without explicit owner approval.
-- Purpose: store Claim Builder intake context separately from initialEvidence.

CREATE TABLE IF NOT EXISTS claim_builder_contexts (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('claim','truth')),
  target_id TEXT NOT NULL,
  user_id TEXT,
  route TEXT NOT NULL CHECK (route IN ('claim','truth')),
  version TEXT NOT NULL DEFAULT '1.0',
  raw_text TEXT NOT NULL,
  why_user_thinks_this TEXT,
  scope TEXT,
  pressure_or_falsifier TEXT,
  draft_claim TEXT,
  final_claim TEXT,
  category TEXT,
  claim_type TEXT,
  system_flags_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claim_builder_contexts_target
  ON claim_builder_contexts(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_claim_builder_contexts_user
  ON claim_builder_contexts(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_claim_builder_contexts_route
  ON claim_builder_contexts(route, created_at);
