-- HumanX Truths schema v1
-- Truths are repeated statements, doctrines, slogans, inherited assumptions or public certainties.
-- They are not automatically facts. They can be converted into claims for pressure testing.

CREATE TABLE IF NOT EXISTS truths (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  normalized_statement TEXT,
  category TEXT DEFAULT 'general',
  origin TEXT DEFAULT 'unknown',
  truth_type TEXT DEFAULT 'common',
  confidence_label TEXT DEFAULT 'claimed',
  repetition_score INTEGER DEFAULT 1,
  pressure_score INTEGER DEFAULT 0,
  linked_claim_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  review_state TEXT DEFAULT 'public',
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(linked_claim_id) REFERENCES claims(id)
);

CREATE TABLE IF NOT EXISTS truth_votes (
  id TEXT PRIMARY KEY,
  truth_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(truth_id, user_id),
  FOREIGN KEY(truth_id) REFERENCES truths(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_truths_created ON truths(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_truths_normalized ON truths(normalized_statement);
CREATE INDEX IF NOT EXISTS idx_truths_category ON truths(category);
CREATE INDEX IF NOT EXISTS idx_truth_votes_truth ON truth_votes(truth_id);
