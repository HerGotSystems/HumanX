-- HumanX duplicate race hardening
-- Purpose: enforce one canonical truth/claim per normalized meaning key.
--
-- This protects runtime paths that do SELECT existing -> INSERT new.
-- Without database uniqueness, simultaneous requests can create duplicates.
--
-- Important deployment note:
-- If live D1 already contains duplicate normalized_statement or normalized_claim
-- values, these indexes will fail to create until duplicates are merged or marked.

CREATE UNIQUE INDEX IF NOT EXISTS idx_truths_normalized_statement_unique
ON truths (normalized_statement)
WHERE normalized_statement IS NOT NULL AND normalized_statement != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_normalized_claim_unique
ON claims (normalized_claim)
WHERE normalized_claim IS NOT NULL AND normalized_claim != '';
