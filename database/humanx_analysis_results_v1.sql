-- HumanX Analysis Results schema v1
-- Analysis is a separate object type. It is not evidence.

CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  source TEXT DEFAULT 'aip-user',
  verdict TEXT,
  evidence_score INTEGER DEFAULT 0,
  testability INTEGER DEFAULT 0,
  survivability INTEGER DEFAULT 0,
  strongest_support_json TEXT,
  strongest_pressure_json TEXT,
  missing_tests_json TEXT,
  plain_language_summary TEXT,
  raw_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_claim ON analysis_results(claim_id);
CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_results(created_at DESC);
