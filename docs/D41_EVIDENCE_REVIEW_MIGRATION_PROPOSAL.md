# D-41: Evidence Review Migration Proposal

Date: 2026-06-06
Status: Docs-only. Migration file created. NOT applied to production.
No code changes, no Worker changes, no D1 commands, no Wrangler, no live tests.

---

## Purpose

This document records the migration proposal for evidence-level moderation as designed
in `docs/D40_EVIDENCE_MODERATION_PHASE2_PLAN.md`. It accompanies
`migrations/0007_add_evidence_review_state.sql` and explains why each decision was made,
what D-42 must do after the migration applies, and what the production safety checklist
requires before any apply.

---

## Migration file

`migrations/0007_add_evidence_review_state.sql`

---

## Exact SQL

```sql
ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE evidence ADD COLUMN report_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_evidence_review_state ON evidence (review_state);
CREATE INDEX IF NOT EXISTS idx_evidence_report_count ON evidence (report_count);
```

No other tables are touched. No rows are deleted. No existing data is modified.

---

## Why `DEFAULT 'public'` and not `DEFAULT 'review'`

SQLite `ALTER TABLE ... ADD COLUMN` fills all existing rows with the column's default
value at the time the statement runs.

- `DEFAULT 'public'`: every current evidence row becomes `review_state='public'`
  immediately. No disruption — existing evidence on the live site remains visible.
  The admin moderation queue starts empty for evidence and fills only with new
  submissions after D-42 deploys.

- `DEFAULT 'review'` would instead hide all current evidence until an admin individually
  approves each item. On a live site with many evidence items this would break the public
  Study views for all approved claims. **This option is explicitly rejected.**

The default does not govern what the Worker writes for new evidence. After D-42, the
`insertEvidence` helper in `src/worker.js` passes `review_state='review'` explicitly in
its INSERT statement. The column default of `'public'` is a migration-safety value, not
the runtime default for new submissions.

---

## What happens to existing evidence after the migration

| Scenario | Before migration | After migration |
|----------|-----------------|-----------------|
| Evidence on an approved public claim | Publicly visible | Still publicly visible (review_state='public' from DEFAULT) |
| Evidence on a non-public claim (any review state) | Hidden from Vault by D-38 parent filter | Still hidden — parent filter unchanged |
| Newly submitted evidence (after D-42 deploys) | Immediately public | Held in review_state='review' until admin approves |

Existing evidence is unaffected in terms of public visibility. No approval wave is
required for current content.

---

## What this migration does NOT do

- Does not apply to production until explicitly approved in a separate session.
- Does not add `CHECK (review_state IN (...))` — a CHECK constraint requires a full
  SQLite table rebuild (no `ALTER TABLE ADD CONSTRAINT`). The Worker layer enforces
  allowed values. No constraint in Phase 2.
- Does not add `updated_at` to `evidence` — deferred to a later migration.
- Does not backfill any rows beyond the automatic column default.
- Does not delete, archive, or modify any existing evidence.
- Does not touch `evidence_claim_links`, `claims`, `users`, or any other table.
- Does not change any Worker route — that is D-42.
- Does not change any frontend — that is D-43.
- Does not add a unique constraint on any evidence field.

---

## SQLite-specific hazards

### No `ADD COLUMN IF NOT EXISTS`

SQLite does not support `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Each `ALTER TABLE`
statement in this migration will fail with `duplicate column name: review_state` (or
`report_count`) if either column already exists on the `evidence` table.

**Always run `PRAGMA table_info(evidence);` before applying.** If either column appears
in the output, skip the corresponding `ALTER TABLE` statement. The `CREATE INDEX IF NOT
EXISTS` statements are safe to re-run — they are idempotent.

### No transactional DDL rollback

D1 (SQLite) does not guarantee transactional DDL. If the first `ALTER TABLE` succeeds
and the second fails, the table is left with `review_state` but no `report_count`. The
safe recovery is to run the second statement alone after diagnosing the failure.

### No DROP COLUMN rollback without rebuild

If this migration is applied in error, removing the columns requires either:
- `ALTER TABLE evidence DROP COLUMN review_state` (SQLite 3.35+ / D1 supports this, but
  it triggers an internal table rebuild — do not do this casually in production).
- Or a restore from a pre-migration backup.

Do not attempt to roll back without an explicit recovery plan and user approval.

---

## Production safety checklist

Before applying to the production D1 database, all of the following must be confirmed
in the current session:

- [ ] **Explicit user approval** in the current task session: "apply migration 0007 to
      production now".
- [ ] **PRAGMA check**: run `PRAGMA table_info(evidence);` via the Cloudflare D1 console
      or Wrangler and confirm that neither `review_state` nor `report_count` appears.
- [ ] **D-42 backend changes are staged and ready to deploy** — the migration and the
      Worker change should land in the same deployment window. Applying the migration
      without D-42 means new evidence still inserts without a `review_state` value
      (defaulting to `'public'`), which is safe but defeats the purpose.
- [ ] **D-43 frontend changes are ready or not required** — the Review UI must be able
      to display evidence cards before the admin queue fills with evidence items.
- [ ] **Read smoke baseline recorded** before apply, so any regression is detectable
      immediately after.

---

## What D-42 backend must do after this migration applies

The migration creates the columns. D-42 (`feature/d42-evidence-moderation-backend`)
must update the Worker to use them:

1. **`insertEvidence` helper** — change INSERT to pass `review_state='review'` explicitly:
   ```js
   `INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,
    source_url,created_at,review_state) VALUES (?,?,?,?,?,?,?,?,?,?)`
   .bind(..., 'review')
   ```

2. **`listEvidenceVault`** — add evidence-level filter:
   ```sql
   AND COALESCE(e.review_state,'public')='public'
   ```

3. **`claimDetail` and `getClaim`** — add evidence-level filter to both direct and
   reused evidence queries.

4. **`reportTarget`** — add `targetType='evidence'` branch that increments
   `report_count` and auto-escalates to `review_state='review'` at threshold 2.

5. **`reviewQueue`** — add evidence items query (non-public state OR report_count > 0).

6. **`reviewDecision`** — add `targetType='evidence'` branch.

Full change spec is in `docs/D40_EVIDENCE_MODERATION_PHASE2_PLAN.md` section 6.

---

## D-41 implementation record

| Item | Status |
|------|--------|
| `migrations/0007_add_evidence_review_state.sql` created | ✅ Done |
| `docs/D41_EVIDENCE_REVIEW_MIGRATION_PROPOSAL.md` created | ✅ Done |
| `docs/PROJECT_STATE.md` updated with D-41 row and safety rule | ✅ Done |
| Migration applied to production | ❌ Not applied |
| D-42 backend changes implemented | ❌ Not started |
| D-43 frontend changes implemented | ❌ Not started |

---

## Next step

D-42 — backend Worker branch + PR. Prerequisites:

1. Production migration approved and applied (PRAGMA check first).
2. D-40 plan reviewed and no outstanding design questions.
3. Branch `feature/d42-evidence-moderation-backend` created from synced main.
4. All static checks at 103/24/39 before starting.
