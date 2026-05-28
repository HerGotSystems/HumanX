-- HumanX Truth to Claim bridge v1
-- Allows repeated truth statements to generate pressure-testable public claims.

ALTER TABLE truths ADD COLUMN converted_claim_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS truth_claim_links (
  id TEXT PRIMARY KEY,
  truth_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  bridge_note TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(truth_id, claim_id),
  FOREIGN KEY(truth_id) REFERENCES truths(id),
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_truth_claim_links_truth ON truth_claim_links(truth_id);
CREATE INDEX IF NOT EXISTS idx_truth_claim_links_claim ON truth_claim_links(claim_id);
