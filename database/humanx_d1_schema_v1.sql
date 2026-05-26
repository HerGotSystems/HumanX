-- HumanX D1 schema v1
-- Pseudonymous only. No email/password auth.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  fingerprint_hash TEXT,
  created_at INTEGER NOT NULL,
  trust_score INTEGER DEFAULT 0,
  strike_count INTEGER DEFAULT 0,
  is_shadow_banned INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Plausible',
  evidence_score INTEGER DEFAULT 5,
  survivability INTEGER DEFAULT 50,
  testability INTEGER DEFAULT 50,
  contradictions INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  report_count INTEGER DEFAULT 0,
  review_state TEXT DEFAULT 'public',
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  stance TEXT NOT NULL,
  quality TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source_url TEXT,
  created_at INTEGER NOT NULL,
  votes INTEGER DEFAULT 0,
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pressure_points (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  votes INTEGER DEFAULT 0,
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS aip_packets (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  packet_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(claim_id) REFERENCES claims(id)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_created ON claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_evidence_claim ON evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_pressure_claim ON pressure_points(claim_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
