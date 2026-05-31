-- Diagnostics: duplicate normalized content in truths and claims
-- READ-ONLY. No mutations. Run with: wrangler d1 execute humanx --file=migrations/diagnostics_duplicate_normalized_content.sql

-- Duplicate normalized_statement in truths
SELECT normalized_statement, COUNT(*) AS cnt
FROM truths
WHERE normalized_statement IS NOT NULL
GROUP BY normalized_statement
HAVING cnt > 1;

-- Truths missing normalized_statement
SELECT id, statement FROM truths
WHERE normalized_statement IS NULL OR normalized_statement = '';

-- Candidate canonical truth per duplicate group (oldest by created_at)
SELECT t.id, t.normalized_statement, t.created_at
FROM truths t
INNER JOIN (
  SELECT normalized_statement, MIN(created_at) AS min_created
  FROM truths
  WHERE normalized_statement IS NOT NULL
  GROUP BY normalized_statement
  HAVING COUNT(*) > 1
) dup ON t.normalized_statement = dup.normalized_statement AND t.created_at = dup.min_created;

-- Duplicate members (non-canonical)
SELECT t.id, t.normalized_statement, t.created_at
FROM truths t
INNER JOIN (
  SELECT normalized_statement, MIN(created_at) AS min_created
  FROM truths
  WHERE normalized_statement IS NOT NULL
  GROUP BY normalized_statement
  HAVING COUNT(*) > 1
) dup ON t.normalized_statement = dup.normalized_statement AND t.created_at != dup.min_created
ORDER BY t.normalized_statement, t.created_at;

-- Duplicate normalized_claim in claims
SELECT normalized_claim, COUNT(*) AS cnt
FROM claims
WHERE normalized_claim IS NOT NULL
GROUP BY normalized_claim
HAVING cnt > 1;

-- Claims missing normalized_claim
SELECT id, claim FROM claims
WHERE normalized_claim IS NULL OR normalized_claim = '';

-- Candidate canonical claim per duplicate group
SELECT c.id, c.normalized_claim, c.created_at
FROM claims c
INNER JOIN (
  SELECT normalized_claim, MIN(created_at) AS min_created
  FROM claims
  WHERE normalized_claim IS NOT NULL
  GROUP BY normalized_claim
  HAVING COUNT(*) > 1
) dup ON c.normalized_claim = dup.normalized_claim AND c.created_at = dup.min_created;

-- Duplicate claim members (non-canonical)
SELECT c.id, c.normalized_claim, c.created_at
FROM claims c
INNER JOIN (
  SELECT normalized_claim, MIN(created_at) AS min_created
  FROM claims
  WHERE normalized_claim IS NOT NULL
  GROUP BY normalized_claim
  HAVING COUNT(*) > 1
) dup ON c.normalized_claim = dup.normalized_claim AND c.created_at != dup.min_created
ORDER BY c.normalized_claim, c.created_at;
