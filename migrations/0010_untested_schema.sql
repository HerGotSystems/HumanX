-- UNTESTED v9 normalized schema.
-- Do not apply to production without explicit approval.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS untested_instrument_versions (
  instrument_version TEXT PRIMARY KEY,
  content_hash TEXT UNIQUE,
  draft_revision INTEGER NOT NULL DEFAULT 0,
  sealed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS untested_instrument_copy (
  instrument_version TEXT PRIMARY KEY,
  opening_text TEXT NOT NULL,
  closing_text TEXT NOT NULL,
  confidence_prompt_text TEXT NOT NULL,
  results_intro_text TEXT NOT NULL,
  FOREIGN KEY (instrument_version) REFERENCES untested_instrument_versions(instrument_version)
);

CREATE TABLE IF NOT EXISTS untested_confidence_definitions (
  instrument_version TEXT NOT NULL,
  certainty_value INTEGER NOT NULL CHECK (certainty_value BETWEEN 0 AND 2),
  label_text TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  PRIMARY KEY (instrument_version, certainty_value),
  FOREIGN KEY (instrument_version) REFERENCES untested_instrument_versions(instrument_version)
);

CREATE TABLE IF NOT EXISTS untested_scenario_definitions (
  instrument_version TEXT NOT NULL,
  scenario_id INTEGER NOT NULL CHECK (scenario_id BETWEEN 1 AND 5),
  scenario_key TEXT NOT NULL,
  title TEXT NOT NULL,
  PRIMARY KEY (instrument_version, scenario_id),
  FOREIGN KEY (instrument_version) REFERENCES untested_instrument_versions(instrument_version)
);

CREATE TABLE IF NOT EXISTS untested_variant_definitions (
  instrument_version TEXT NOT NULL,
  scenario_id INTEGER NOT NULL CHECK (scenario_id BETWEEN 1 AND 5),
  variant TEXT NOT NULL CHECK (variant IN ('mild','pressure')),
  prompt_text TEXT NOT NULL,
  PRIMARY KEY (instrument_version, scenario_id, variant),
  FOREIGN KEY (instrument_version, scenario_id)
    REFERENCES untested_scenario_definitions(instrument_version, scenario_id)
);

CREATE TABLE IF NOT EXISTS untested_choice_definitions (
  instrument_version TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  scenario_id INTEGER NOT NULL CHECK (scenario_id BETWEEN 1 AND 5),
  variant TEXT NOT NULL CHECK (variant IN ('mild','pressure')),
  choice_text TEXT NOT NULL,
  action_orientation TEXT NOT NULL,
  involvement_level INTEGER NOT NULL CHECK (involvement_level BETWEEN 0 AND 3),
  personal_cost_accepted INTEGER NOT NULL CHECK (personal_cost_accepted BETWEEN 0 AND 3),
  value_prioritized TEXT NOT NULL,
  PRIMARY KEY (instrument_version, choice_id),
  UNIQUE (instrument_version, choice_id, scenario_id, variant),
  FOREIGN KEY (instrument_version, scenario_id, variant)
    REFERENCES untested_variant_definitions(instrument_version, scenario_id, variant)
);

CREATE TABLE IF NOT EXISTS untested_sessions (
  session_id TEXT PRIMARY KEY,
  instrument_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (session_id, instrument_version),
  FOREIGN KEY (instrument_version) REFERENCES untested_instrument_versions(instrument_version)
);

CREATE TABLE IF NOT EXISTS untested_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  instrument_version TEXT NOT NULL,
  scenario_id INTEGER NOT NULL CHECK (scenario_id BETWEEN 1 AND 5),
  variant TEXT NOT NULL CHECK (variant IN ('mild','pressure')),
  choice_id TEXT NOT NULL,
  certainty_stated INTEGER NOT NULL CHECK (certainty_stated BETWEEN 0 AND 2),
  created_at INTEGER NOT NULL,
  UNIQUE (session_id, scenario_id, variant),
  FOREIGN KEY (session_id, instrument_version)
    REFERENCES untested_sessions(session_id, instrument_version) ON DELETE CASCADE,
  FOREIGN KEY (instrument_version, choice_id, scenario_id, variant)
    REFERENCES untested_choice_definitions(instrument_version, choice_id, scenario_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_untested_responses_session
  ON untested_responses(session_id);
