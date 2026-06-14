-- =============================================================================
-- D-128H: Manual Repair Script — Dedupe evidence_claim_links
-- =============================================================================
-- PURPOSE:
--   Remove exact duplicate bridge rows in evidence_claim_links so that
--   CREATE UNIQUE INDEX idx_evidence_claim_links_unique (evidence_id, claim_id)
--   can succeed and migration 0003 replay is unblocked.
--
-- STATUS: DRAFT ONLY. NOT EXECUTED. NOT AN AUTO MIGRATION.
--   Do NOT run via wrangler d1 migrations apply.
--   Run only via explicit wrangler d1 execute after owner approval.
--
-- PREREQUISITE:
--   1. Export / backup evidence_claim_links before running any DELETE.
--      wrangler d1 export humanx --output=humanx_backup_pre_repair_<date>.sql
--      OR:
--      wrangler d1 execute humanx --command="SELECT * FROM evidence_claim_links;"
--
--   2. Run AUDIT and PREVIEW queries first. Confirm counts match expected
--      (4 duplicate pairs, 4 rows to remove). Do not proceed if counts differ.
--
-- SAFETY:
--   - evidence_claim_links is a join/bridge table only.
--   - Removing a duplicate bridge row does NOT delete any evidence or claim record.
--   - One row per (evidence_id, claim_id) pair is preserved (earliest by rowid).
--   - All other columns (user_id, stance, link_note, created_at) are preserved
--     on the surviving row; duplicates may differ only in rowid / insert order.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1: AUDIT — confirm current duplicate state
-- Expected: exactly 4 pairs, count = 2 each.
-- If you see different pairs or counts, STOP and investigate before proceeding.
-- -----------------------------------------------------------------------------

SELECT
  evidence_id,
  claim_id,
  COUNT(*) AS row_count
FROM evidence_claim_links
GROUP BY evidence_id, claim_id
HAVING COUNT(*) > 1
ORDER BY evidence_id, claim_id;

-- Expected output:
-- evd_3859ca2419a94bbf8d | clm_5624bd2c8d9246598a | 2
-- evd_3859ca2419a94bbf8d | clm_79f69a5075df45f181 | 2
-- evd_a869e41473a5409394 | clm_8ad342e93c594f1082 | 2
-- evd_aaf91e98294b4b     | clm_1695187b3d6140b88b | 2


-- -----------------------------------------------------------------------------
-- STEP 2: PREVIEW — inspect all rows involved in duplicate pairs
-- Review both rows for each pair. Confirm they are true duplicates.
-- Note any differences in user_id, stance, link_note, or created_at.
-- -----------------------------------------------------------------------------

SELECT
  rowid,
  id,
  evidence_id,
  claim_id,
  user_id,
  stance,
  link_note,
  created_at
FROM evidence_claim_links
WHERE (evidence_id, claim_id) IN (
  SELECT evidence_id, claim_id
  FROM evidence_claim_links
  GROUP BY evidence_id, claim_id
  HAVING COUNT(*) > 1
)
ORDER BY evidence_id, claim_id, rowid;


-- -----------------------------------------------------------------------------
-- STEP 3: DELETE — remove duplicate rows, keeping earliest (lowest rowid)
--
-- Strategy: for each duplicate (evidence_id, claim_id) pair, keep the row with
-- the minimum rowid and delete all other rows for that pair.
--
-- SQLite does not support DELETE ... USING or DELETE with subquery aliases in
-- some versions. The correlated subquery below is broadly compatible.
--
-- DRY RUN FIRST: Replace DELETE with SELECT COUNT(*) to confirm row count
-- before executing the actual DELETE.
-- -----------------------------------------------------------------------------

-- DRY RUN (replace DELETE with count check first):
SELECT COUNT(*) AS rows_to_delete
FROM evidence_claim_links
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM evidence_claim_links
  GROUP BY evidence_id, claim_id
);
-- Expected: 4

-- ACTUAL DELETE (run only after dry-run confirms count = 4):
DELETE FROM evidence_claim_links
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM evidence_claim_links
  GROUP BY evidence_id, claim_id
);


-- -----------------------------------------------------------------------------
-- STEP 4: POST-DELETE VERIFICATION
-- Must return 0 rows. If any rows returned, DELETE did not fully succeed.
-- -----------------------------------------------------------------------------

SELECT
  evidence_id,
  claim_id,
  COUNT(*) AS row_count
FROM evidence_claim_links
GROUP BY evidence_id, claim_id
HAVING COUNT(*) > 1;

-- Expected: 0 rows returned.


-- -----------------------------------------------------------------------------
-- STEP 5: TOTAL ROW COUNT CHECK
-- Confirm total row count decreased by exactly 4.
-- (Check count before and after DELETE via separate queries.)
-- -----------------------------------------------------------------------------

SELECT COUNT(*) AS total_rows FROM evidence_claim_links;

-- Before delete: N rows
-- After delete:  N - 4 rows


-- -----------------------------------------------------------------------------
-- STEP 6: CREATE UNIQUE INDEX (unblocks migration 0003 replay)
-- Run only after STEP 4 confirms 0 duplicates remain.
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_claim_links_unique
  ON evidence_claim_links (evidence_id, claim_id);


-- -----------------------------------------------------------------------------
-- STEP 7: VERIFY INDEX EXISTS
-- -----------------------------------------------------------------------------

SELECT name, tbl_name, sql
FROM sqlite_master
WHERE type = 'index'
  AND name = 'idx_evidence_claim_links_unique';

-- Expected: 1 row with name = 'idx_evidence_claim_links_unique'


-- =============================================================================
-- END OF SCRIPT
-- After this script succeeds, migration 0003 replay should proceed past
-- the unique index creation. Proceed to migration bookkeeping resolution
-- per D-128H repair plan Step 6.
-- =============================================================================
