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

CREATE INDEX IF NOT EXISTS idx_home_tests_claim_id ON home_tests (claim_id);
CREATE INDEX IF NOT EXISTS idx_home_tests_created_at ON home_tests (created_at);
