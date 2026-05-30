-- HumanX normalized claim key migration v1
-- Speeds up belief/truth promotion deduplication.
-- Safe to run once on live D1.

ALTER TABLE claims ADD COLUMN normalized_claim TEXT;

CREATE INDEX IF NOT EXISTS idx_claims_normalized_claim
ON claims(normalized_claim);

-- Approximate backfill for existing rows.
-- New writes use the app's stronger JavaScript normalizer.
UPDATE claims
SET normalized_claim = lower(trim(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(claim,
  '— this statement reflects reality consistently enough to survive evidence and repeatable pressure testing.', ''),
  '.', ' '), ',', ' '), ':', ' '), ';', ' '), '!', ' '), '?', ' '), '"', ' '), '''', ' '), '-', ' ')))
WHERE normalized_claim IS NULL OR normalized_claim = '';
