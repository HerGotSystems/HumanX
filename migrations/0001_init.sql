CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  claim TEXT NOT NULL,
  category TEXT,
  type TEXT,
  status TEXT,
  testability INTEGER DEFAULT 0,
  evidence_score INTEGER DEFAULT 0,
  survivability INTEGER DEFAULT 0,
  contradictions INTEGER DEFAULT 0,
  supporters INTEGER DEFAULT 0,
  challengers INTEGER DEFAULT 0,
  damage TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  source_quality TEXT,
  strength INTEGER DEFAULT 0,
  verdict TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pressure_points (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
