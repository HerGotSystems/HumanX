# D-128H Migration State Repair Plan

**Date:** 2026-06-14
**Branch:** `fix/d128h-migration-state-repair-plan`
**Scope:** Docs and SQL draft only. No live execution. No runtime code changes. No deploy.

---

## ⚠ No Live Execution Yet

> **Nothing in this document has been applied to production D1.**
> **No `wrangler d1 execute` command has been run.**
> **This document and the companion SQL draft are planning artefacts only.**
> **Owner must review and explicitly approve before any repair step is executed.**

---

## 1. Verified Current State

From owner D1 audit:

| Item | State |
|---|---|
| `d1_migrations` table records | `0001_init.sql`, `0002_home_tests.sql` only |
| `claim_builder_contexts` table | **Does not exist** |
| `idx_evidence_claim_links_unique` index | **Does not exist** |
| `evidence_claim_links` table | Exists (created historically, not via migration bookkeeping) |
| Most other schema tables | Exist (created via historical/manual evolution) |
| `wrangler d1 migrations apply` | **Failed** — blocked by duplicate rows in `evidence_claim_links` |

---

## 2. Why Migration Replay Failed

`migrations/0003_full_schema.sql` (line 235) contains:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_claim_links_unique
  ON evidence_claim_links (evidence_id, claim_id);
```

A `UNIQUE INDEX` on `(evidence_id, claim_id)` cannot be created if any two rows share the same `(evidence_id, claim_id)` pair. SQLite raises:

```
SQLITE_CONSTRAINT: UNIQUE constraint failed
```

The migration fails at this line and does not complete. Because Wrangler marks the migration as failed, `d1_migrations` does not record it as applied, and subsequent migrations in the sequence are also blocked.

---

## 3. Schema Drift vs Migration Bookkeeping

The live D1 database evolved ahead of the migration bookkeeping:

- Tables like `evidence_claim_links`, `truths`, `claims`, `evidence`, etc. were created manually or via direct D1 console operations before formal Wrangler migration tracking was fully in place.
- `d1_migrations` only shows `0001` and `0002`, meaning migrations `0003` through `0009` (and `0006_claim_builder_contexts.sql`) have **never been formally applied via Wrangler**, even though most of the schema those migrations describe already exists in production.
- This is schema drift: the actual database is ahead of what the migration bookkeeper knows about, but also missing some items (the unique indexes, `claim_builder_contexts`).

**Effect:** Re-running `wrangler d1 migrations apply` attempts to replay `0003_full_schema.sql` from scratch. The `CREATE TABLE IF NOT EXISTS` statements skip harmlessly (tables already exist), but the `CREATE UNIQUE INDEX` at line 235 fails hard because the data violates the uniqueness constraint.

---

## 4. Exact Duplicate Rows Found

The following `(evidence_id, claim_id)` pairs each have 2 rows in `evidence_claim_links`:

| evidence_id | claim_id | count |
|---|---|---|
| `evd_3859ca2419a94bbf8d` | `clm_5624bd2c8d9246598a` | 2 |
| `evd_3859ca2419a94bbf8d` | `clm_79f69a5075df45f181` | 2 |
| `evd_a869e41473a5409394` | `clm_8ad342e93c594f1082` | 2 |
| `evd_aaf91e98294b4b` | `clm_1695187b3d6140b88b` | 2 |

4 pairs × 1 duplicate each = **4 rows to remove**.

These are bridge/join table rows. The duplicate does not represent additional evidence or additional linking intent — it is a repeated insert of the same relationship.

---

## 5. Risks of Blindly Replaying Migrations

| Risk | Detail |
|---|---|
| Dropping data | `0003` uses `CREATE TABLE IF NOT EXISTS` — tables are preserved. Safe. |
| Duplicate index blocking | `CREATE UNIQUE INDEX` fails if duplicates exist. Confirmed blocker. |
| Cascade effects | `evidence_claim_links` is a join table. Removing duplicate rows does not orphan any primary evidence or claim record. |
| `claim_builder_contexts` | Not present. Safe to create fresh via `0006_claim_builder_contexts.sql` once migration replay unblocks. |
| Out-of-order replay | Wrangler applies unapplied migrations in filename order. After `0003` succeeds, `0004`–`0009` and `0006_claim_builder_contexts.sql` will run. Review each for idempotency before approving replay. |
| `0004_unique_normalized_content.sql` | Per prior docs warning, already applied manually to production. `CREATE UNIQUE INDEX IF NOT EXISTS` — should skip harmlessly if index already exists. Verify. |
| `0005_add_home_tests_updated_at.sql` | Per prior docs warning, applied manually via D1 console. `ALTER TABLE` statements are NOT idempotent in SQLite — re-running will fail if column already exists. **May need to be skipped or stubbed.** |

---

## 6. Safe Repair Sequence (Proposed — Not Yet Executed)

### Step 0 — Export / backup

Before any write:
```sh
wrangler d1 export humanx --output=humanx_backup_pre_repair_$(date +%Y%m%d).sql
```

Or at minimum export the affected table:
```sh
wrangler d1 execute humanx --command="SELECT * FROM evidence_claim_links;" > evidence_claim_links_backup.json
```

### Step 1 — Audit duplicates

Run the audit query from the companion SQL draft. Confirm exactly 4 duplicate pairs are present and nothing else. Do not proceed if the count is different from expected.

### Step 2 — Preview rows to delete

Run the SELECT preview query from the companion SQL draft. Inspect the rows. Confirm they are true duplicates (same evidence_id, claim_id, user_id, stance, link_note — or acceptably close).

### Step 3 — Delete duplicates

Run the DELETE query from the companion SQL draft. This keeps the row with the lowest `rowid` (earliest insert) for each `(evidence_id, claim_id)` pair and removes the later duplicate.

### Step 4 — Verify post-delete

Run the post-delete verification query. Confirm 0 duplicate pairs remain.

### Step 5 — Create unique index

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_claim_links_unique
  ON evidence_claim_links (evidence_id, claim_id);
```

If this succeeds, the blocker is cleared.

### Step 6 — Address migration bookkeeping

Options (owner decides):
- **Option A:** Mark `0003` through current as applied in `d1_migrations` manually, then run `wrangler d1 migrations apply` for any genuinely unapplied items only.
- **Option B:** Run `wrangler d1 migrations apply` after confirming each migration in `0003`–`0009` is safe to replay (idempotent or already applied). Handle `0005` separately (ALTER TABLE may fail if column exists).
- **Option C:** Apply `0006_claim_builder_contexts.sql` directly via `wrangler d1 execute` (bypasses migration tracking but creates the table needed for D-128C).

### Step 7 — Verify `claim_builder_contexts`

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='claim_builder_contexts';
```

Must return one row before D-128C work begins.

---

## 7. Rollback Thinking

- The `evidence_claim_links` table is a join/bridge table. Removing duplicate rows does not delete any `evidence` or `claims` records.
- If the DELETE removes the wrong row, the backup export (Step 0) allows re-inserting the missing row.
- The unique index creation (Step 5) is additive — if it fails, no data is lost; the blocker simply remains.
- No irreversible action exists in this sequence except the DELETE — which is why the audit/preview steps precede it.

---

## 8. Recommended Next Steps

1. Owner reviews this plan.
2. Owner authorises Step 0 (backup export).
3. Owner authorises Steps 1–5 (dedupe + index creation).
4. Owner decides on migration bookkeeping strategy (Step 6, Options A/B/C).
5. Once `claim_builder_contexts` exists and is verified, D-128C worker write-path can begin.
