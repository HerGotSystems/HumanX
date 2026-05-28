-- HumanX reusable evidence links v1
-- Allows one evidence item to support or pressure multiple claims.

CREATE TABLE IF NOT EXISTS evidence_claim_links (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  stance TEXT DEFAULT 'support',
  link_note TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(evidence_id, claim_id, stance),
  FOREIGN KEY(evidence_id) REFERENCES evidence(id),
  FOREIGN KEY(claim_id) REFERENCES claims(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim_links_evidence ON evidence_claim_links(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_claim_links_claim ON evidence_claim_links(claim_id);
