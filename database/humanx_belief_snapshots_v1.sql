-- HumanX belief snapshots migration v1
-- Required by /api/belief-snapshots and /api/belief-promote.

CREATE TABLE IF NOT EXISTS belief_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  engine_version TEXT DEFAULT 'belief-engine-v1',
  source TEXT DEFAULT 'belief-engine',
  dominant_pattern TEXT,
  summary TEXT,
  belief_count INTEGER DEFAULT 0,
  contradiction_count INTEGER DEFAULT 0,
  stability_score INTEGER DEFAULT 0,
  openness_score INTEGER DEFAULT 0,
  pressure_score INTEGER DEFAULT 0,
  dimensions_json TEXT DEFAULT '{}',
  top_beliefs_json TEXT DEFAULT '[]',
  contradictions_json TEXT DEFAULT '[]',
  stress_points_json TEXT DEFAULT '[]',
  raw_json TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_belief_snapshots_user_created ON belief_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_belief_snapshots_pattern ON belief_snapshots(dominant_pattern);
