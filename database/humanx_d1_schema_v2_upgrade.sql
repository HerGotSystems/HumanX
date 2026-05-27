-- HumanX D1 schema v2 upgrade
-- Safe to paste into Cloudflare D1 Console after v1 exists.

CREATE TABLE IF NOT EXISTS claim_votes (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(claim_id, user_id),
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evidence_votes (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(evidence_id, user_id),
  FOREIGN KEY(evidence_id) REFERENCES evidence(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS home_tests (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  safety_level TEXT DEFAULT 'normal',
  difficulty TEXT DEFAULT 'easy',
  created_at INTEGER NOT NULL,
  votes INTEGER DEFAULT 0,
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS duplicate_signatures (
  signature TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

ALTER TABLE claims ADD COLUMN belief_yes INTEGER DEFAULT 0;
ALTER TABLE claims ADD COLUMN belief_no INTEGER DEFAULT 0;
ALTER TABLE claims ADD COLUMN uncertainty INTEGER DEFAULT 0;
ALTER TABLE claims ADD COLUMN duplicate_of TEXT;
ALTER TABLE claims ADD COLUMN normalized_claim TEXT;

ALTER TABLE evidence ADD COLUMN media_type TEXT DEFAULT 'text';
ALTER TABLE evidence ADD COLUMN duplicate_signature TEXT;
ALTER TABLE evidence ADD COLUMN reliability_score INTEGER DEFAULT 20;
ALTER TABLE evidence ADD COLUMN source_domain TEXT;

CREATE INDEX IF NOT EXISTS idx_claim_votes_claim ON claim_votes(claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_votes_evidence ON evidence_votes(evidence_id);
CREATE INDEX IF NOT EXISTS idx_home_tests_claim ON home_tests(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_normalized ON claims(normalized_claim);
CREATE INDEX IF NOT EXISTS idx_evidence_duplicate ON evidence(duplicate_signature);
