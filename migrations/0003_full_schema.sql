-- HumanX full schema safety migration
-- Purpose: document the current Worker/D1 table surface and make fresh D1 rebuilds possible.
-- Safe on existing databases: CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS only.
-- Note: indexes are intentionally non-unique except bridge/vote uniqueness where runtime expects one user/link row.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT,
  fingerprint_hash TEXT,
  trust_score INTEGER DEFAULT 0,
  strike_count INTEGER DEFAULT 0,
  is_shadow_banned INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  claim TEXT NOT NULL,
  category TEXT,
  type TEXT,
  status TEXT,
  evidence_score INTEGER DEFAULT 0,
  survivability INTEGER DEFAULT 0,
  testability INTEGER DEFAULT 0,
  contradictions INTEGER DEFAULT 0,
  supporters INTEGER DEFAULT 0,
  challengers INTEGER DEFAULT 0,
  belief_yes INTEGER DEFAULT 0,
  belief_no INTEGER DEFAULT 0,
  uncertainty INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  review_state TEXT DEFAULT 'review',
  normalized_claim TEXT,
  duplicate_of TEXT,
  damage TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  stance TEXT,
  quality TEXT,
  title TEXT,
  body TEXT,
  source_url TEXT,
  url TEXT,
  summary TEXT,
  source_quality TEXT,
  strength INTEGER DEFAULT 0,
  verdict TEXT,
  media_type TEXT,
  duplicate_signature TEXT,
  reliability_score INTEGER DEFAULT 0,
  source_domain TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS pressure_points (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT,
  body TEXT,
  severity INTEGER DEFAULT 1,
  label TEXT,
  kind TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'open',
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS aip_packets (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  packet_json TEXT NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS rate_limits (
  "key" TEXT PRIMARY KEY,
  hits INTEGER DEFAULT 0,
  window_start INTEGER
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  source TEXT,
  verdict TEXT,
  evidence_score INTEGER DEFAULT 0,
  testability INTEGER DEFAULT 0,
  survivability INTEGER DEFAULT 0,
  strongest_support_json TEXT,
  strongest_pressure_json TEXT,
  missing_tests_json TEXT,
  plain_language_summary TEXT,
  raw_json TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS belief_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT,
  engine_version TEXT,
  source TEXT,
  dominant_pattern TEXT,
  summary TEXT,
  belief_count INTEGER DEFAULT 0,
  contradiction_count INTEGER DEFAULT 0,
  stability_score INTEGER DEFAULT 0,
  openness_score INTEGER DEFAULT 0,
  pressure_score INTEGER DEFAULT 0,
  dimensions_json TEXT,
  top_beliefs_json TEXT,
  contradictions_json TEXT,
  stress_points_json TEXT,
  raw_json TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS truths (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  statement TEXT NOT NULL,
  normalized_statement TEXT,
  category TEXT,
  origin TEXT,
  truth_type TEXT,
  confidence_label TEXT,
  repetition_score INTEGER DEFAULT 1,
  pressure_score INTEGER DEFAULT 0,
  linked_claim_id TEXT,
  converted_claim_count INTEGER DEFAULT 0,
  review_state TEXT DEFAULT 'review',
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS truth_claim_links (
  id TEXT PRIMARY KEY,
  truth_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  bridge_note TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS evidence_claim_links (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  stance TEXT,
  link_note TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS claim_votes (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS evidence_votes (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS truth_votes (
  id TEXT PRIMARY KEY,
  truth_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS duplicate_signatures (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS home_tests (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  safety_level TEXT DEFAULT 'low',
  difficulty TEXT DEFAULT 'easy',
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_claims_normalized_claim ON claims (normalized_claim);
CREATE INDEX IF NOT EXISTS idx_claims_review_state ON claims (review_state);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims (created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_claim_id ON evidence (claim_id);
CREATE INDEX IF NOT EXISTS idx_pressure_points_claim_id ON pressure_points (claim_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id, status);
CREATE INDEX IF NOT EXISTS idx_aip_packets_claim_id ON aip_packets (claim_id);
CREATE INDEX IF NOT EXISTS idx_truths_normalized_statement ON truths (normalized_statement);
CREATE INDEX IF NOT EXISTS idx_truths_review_state ON truths (review_state);
CREATE INDEX IF NOT EXISTS idx_truth_claim_links_truth_id ON truth_claim_links (truth_id);
CREATE INDEX IF NOT EXISTS idx_truth_claim_links_claim_id ON truth_claim_links (claim_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_truth_claim_links_unique ON truth_claim_links (truth_id, claim_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_claim_links_unique ON evidence_claim_links (evidence_id, claim_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_votes_unique ON claim_votes (claim_id, user_id);
CREATE INDEX IF NOT EXISTS idx_belief_snapshots_user_id ON belief_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_claim_id ON analysis_results (claim_id);
CREATE INDEX IF NOT EXISTS idx_home_tests_claim_id ON home_tests (claim_id);
CREATE INDEX IF NOT EXISTS idx_home_tests_created_at ON home_tests (created_at);
