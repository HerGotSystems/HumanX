# D1 Duplicate Cleanup Guide

## Why migration 0004 may fail on production D1

Migration `0004_unique_normalized_content.sql` creates partial unique indexes on
`truths.normalized_statement` and `claims.normalized_claim`. D1 will refuse to
create a unique index if the table already contains duplicate values in those
columns. This happens when:

- Rows were inserted before the unique index existed (races between concurrent
  requests, or bulk imports that ran before the constraint was in place).
- Rows were inserted with `normalized_statement` / `normalized_claim` left NULL
  or empty (these are excluded from the partial index but still indicate data
  quality issues).

The error from D1 will resemble:
```
Error: UNIQUE constraint failed: truths.normalized_statement
```

## How to run the diagnostics SQL against D1

Use `wrangler d1 execute` with the read-only diagnostics file:

```sh
npx wrangler d1 execute humanx \
  --file=migrations/diagnostics_duplicate_normalized_content.sql \
  --remote
```

Each SELECT statement runs in order and prints results. Identify which
normalized values have `cnt > 1` — those are the duplicates blocking the index.

To run a single query interactively:

```sh
npx wrangler d1 execute humanx --remote --command \
  "SELECT normalized_statement, COUNT(*) AS cnt FROM truths WHERE normalized_statement IS NOT NULL GROUP BY normalized_statement HAVING cnt > 1"
```

## What duplicate rows mean in this context

A duplicate `normalized_statement` means two truth rows represent the same
semantic claim (same meaning key). Only one should be the canonical record. The
others are orphan duplicates that accrued before uniqueness was enforced.

A duplicate `normalized_claim` means the same semantic claim was created twice
as a claim row. The oldest `created_at` is the canonical record by convention.

Downstream rows (`truth_claim_links`, `evidence_claim_links`, `claim_votes`,
`truth_votes`, `analysis_results`, etc.) may point to either the canonical or
duplicate row, so deletion is not straightforward.

## Safe manual cleanup principles

**Do NOT blindly delete duplicate rows.** Related rows in child tables will
become orphaned (foreign key constraints may not be enforced on D1 at the row
level, so orphans will silently exist and cause confusing query results).

Before removing a duplicate row:

1. Run the diagnostics to identify canonical vs non-canonical rows (oldest
   `created_at` = canonical).
2. Check all child table references for the duplicate row's `id`:
   - `truth_claim_links.truth_id`
   - `truth_claim_links.claim_id`
   - `evidence_claim_links.claim_id`
   - `claim_votes.claim_id`
   - `truth_votes.truth_id`
   - `analysis_results.claim_id`
   - `belief_snapshots` (indirectly via promoted truths/claims)
3. Re-point child rows to the canonical id before deleting the duplicate.
4. Test that the canonical row's counts and scores still make sense after
   re-pointing.

## Preferred approach: mark duplicates before deletion

Rather than deleting immediately, add a `duplicate_of` column to the table:

```sql
ALTER TABLE truths ADD COLUMN duplicate_of TEXT REFERENCES truths(id);
ALTER TABLE claims ADD COLUMN duplicate_of TEXT REFERENCES claims(id);
```

Then mark duplicates:

```sql
UPDATE truths SET duplicate_of = '<canonical_id>' WHERE id = '<duplicate_id>';
UPDATE claims SET duplicate_of = '<canonical_id>' WHERE id = '<duplicate_id>';
```

This lets the application surface a redirect or merge notice, preserves the
audit trail, and gives you time to re-point child rows before the duplicate is
finally deleted.

Only after all child rows are re-pointed should you delete the marked duplicates
and then apply migration 0004 to enforce the unique index.

## Reference

- Diagnostics SQL: `migrations/diagnostics_duplicate_normalized_content.sql`
- Migration that adds the unique index: `migrations/0004_unique_normalized_content.sql`
- Meaning key logic: `src/meaning-key.js`
- Backfill script for rows with missing normalized content: `scripts/backfill-normalized-content.mjs`
