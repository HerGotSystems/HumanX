# D-180B — Production D1 Schema Preflight

**Date:** 2026-06-26
**Local commit:** 400113f (D-180A — Review admin queue failure diagnostic)
**Baseline:** 1358/24/57
**Type:** Diagnostic / preflight only. No migration applied. No code changes.

---

## Safety Constraints

- Admin token not printed, not echoed, not stored, not documented here.
- Owner token not touched.
- D-149H hold remains in effect.
- No migration applied in this task.
- No route semantics changed.
- No wrangler.toml edits.

---

## Git State

| Check | Result |
|---|---|
| Local HEAD | 400113f (D-180A) |
| origin/main | 837f442 (D-179A) |
| Status | Local main 1 commit ahead — D-180A not yet pushed |
| Working tree | Clean |

D-180A commit is local only. The diagnostic doc exists on-disk but is not yet on origin/main.

---

## Baseline Check Results

All three test suites pass at confirmed baseline 1358/24/57:
- `hardening-smoke-test.mjs` — 1358 passed, 0 failed
- `belief-engine-static-check.mjs` — all hard checks passed
- `worker-route-static-check.mjs` — all hard checks passed

---

## Migration 0012 Inspection

**File:** `migrations/0012_user_owned_archive_export.sql`

### Columns Added

| Table | Column | Type | Default | Nullable |
|---|---|---|---|---|
| `claims` | `archived_by_user` | `INTEGER` | `0` | — |
| `truths` | `archived_by_user` | `INTEGER` | `0` | — |
| `evidence` | `archived_by_user` | `INTEGER` | `0` | — |
| `pressure_points` | `archived_by_user` | `INTEGER` | `0` | — |
| `belief_snapshots` | `hidden_at` | `INTEGER` | NULL | Yes |
| `evidence` | `updated_at` | `INTEGER` | NULL | Yes |

One index added: `idx_belief_snapshots_hidden_at ON belief_snapshots(hidden_at)`.

### Safety Assessment

| Property | Value |
|---|---|
| Change type | Additive only — `ALTER TABLE ADD COLUMN` and `CREATE INDEX` |
| Data rewrite | None |
| Destructive changes | None |
| Idempotent | **No** — re-running will fail with "duplicate column name" on the first `ALTER TABLE` |
| Hard-delete columns | None |
| Schema rollback complexity | Low — no data migration to reverse |

### Gate Warning (verbatim from migration file)

> "Production apply is GATED — do NOT run this migration without explicit per-session approval and a PRAGMA preflight confirming the columns are absent."
> "Safe to run multiple times" is NOT stated — the opposite is stated: re-running errors on duplicate column.

---

## Production D1 Schema Preflight

### Why Claude Cannot Run These

The `wrangler d1 execute --remote` command requires `CLOUDFLARE_API_TOKEN` set in the environment. The Claude shell has no Cloudflare auth token. Running from the Claude shell fails with:

> `In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.`

**All D1 schema checks must be run from your own local terminal** (where `wrangler whoami` already authenticates via browser or stored token).

### Commands to Run (owner terminal only)

Run these three PRAGMA queries from your local project directory. They are **read-only** — PRAGMA table_info never writes.

D1 database name confirmed from `wrangler.toml`: **`humanx`**

```powershell
# PRAGMA 1 — claims schema
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(claims);"

# PRAGMA 2 — truths schema
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(truths);"

# PRAGMA 3 — pressure_points schema
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(pressure_points);"
```

### What to Look For

**In `PRAGMA table_info(claims)` output — look for these columns:**

Columns the `reviewQueue()` claims query explicitly selects:

| Column | Added by | Migration gated? | Must exist? |
|---|---|---|---|
| `id` | 0001_init / 0003_full_schema | No | Yes |
| `user_id` | 0003_full_schema | No | Yes |
| `claim` | 0003_full_schema | No | Yes |
| `category` | 0003_full_schema | No | Yes |
| `type` | 0003_full_schema | No | Yes |
| `status` | 0003_full_schema | No | Yes |
| `evidence_score` | 0003_full_schema | No | Yes |
| `survivability` | 0003_full_schema | No | Yes |
| `testability` | 0003_full_schema | No | Yes |
| `contradictions` | 0003_full_schema | No | Yes |
| `report_count` | 0003_full_schema | No | Yes |
| `review_state` | 0003_full_schema | No | Yes |
| `normalized_claim` | 0003_full_schema | No | Yes |
| `duplicate_of` | 0003_full_schema | No | Yes |
| `near_duplicate_of` | **0006_add_near_duplicate_of** | Yes | Yes |
| `damage` | 0001_init / 0003_full_schema | No | Yes |
| `status_locked` | **0008_add_status_locked** | Yes | Yes |
| `archived_by_user` | **0012_user_owned_archive_export** | **Yes — GATED** | **⚠ PRIMARY SUSPECT** |
| `created_at` | 0003_full_schema | No | Yes |
| `updated_at` | 0003_full_schema | No | Yes |

**The critical check: does `archived_by_user` appear in the PRAGMA output?**

**In `PRAGMA table_info(truths)` output — look for:**

| Column | Notes |
|---|---|
| `review_state` | Required by WHERE clause |
| `linked_claim_id` | Required by JOIN |
| `archived_by_user` | Added by migration 0012 — NOT directly selected by reviewQueue truths query (query uses `t.*`) |
| `updated_at` | Required by ORDER BY |

The truths query uses `t.*` (select all), so if any column has a schema issue (like an index pointing at a non-existent column), it could fail. But the more important check is `t.linked_claim_id` and `t.review_state`.

**In `PRAGMA table_info(pressure_points)` output — look for:**

| Column | Added by | Gated? |
|---|---|---|
| `review_state` | **0009_add_pressure_review_state** | Yes |
| `report_count` | **0009_add_pressure_review_state** | Yes |
| `updated_at` | **0009_add_pressure_review_state** | Yes |

If migration 0009 was not applied, the pressure query would also fail. However, prior D-130 chain work on the review queue implies 0009 was applied.

---

## Decision Matrix

### If `archived_by_user` is ABSENT from claims:

**D-180A root cause is confirmed.** The `reviewQueue()` claims SQL explicitly selects `c.archived_by_user`. If the column is absent, D1 throws → global catch → 500.

**Recommended fix:** Apply migration 0012 to production D1.

**Required preflight before applying (per migration file gate):**
```powershell
# Confirm archived_by_user is absent before applying
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(claims);" | grep archived_by_user
```
Expected output: no rows. If a row appears, the column already exists — do NOT apply migration.

**Apply command (do NOT run until owner approves):**
```powershell
npx wrangler d1 execute humanx --remote --file "migrations/0012_user_owned_archive_export.sql"
```

**Post-apply verification:**
```powershell
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(claims);" | grep archived_by_user
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(evidence);" | grep updated_at
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(belief_snapshots);" | grep hidden_at
```

Expected: all three columns now appear.

Then re-test the Review queue from the browser.

---

### If `archived_by_user` EXISTS in claims:

Migration 0012 was already applied. The root cause is something else.

Next steps:
1. Run `wrangler tail` and trigger the Review queue once from browser.
2. Capture only the exception class and message from the tail output.
3. Share the error message only (no headers, no token values).
4. Likely candidates at that point: truths schema mismatch, pressure_points 0009 not applied, or a D1 transient error.

---

### If PRAGMA output shows all columns present:

The schema is correct. Use `wrangler tail` to capture the actual thrown error. Possible causes at that point:
- D1 transient error (network, quota)
- A query execution plan issue (should be visible in tail)
- Deployed Worker version mismatch (Worker running older code without the correct SQL)

To check deployed Worker version:
```powershell
# Fetch deploy metadata from live app
Invoke-RestMethod -Uri "https://humanx.rinkimirikata.com/api/health" | ConvertTo-Json
```
Check whether the returned checkpoint matches `D-178B` (current `deploy-meta.js` value). If the live Worker is older, a re-deploy may be needed.

---

## Schema Preflight Summary Table

| Column | Table | Gated migration | Status before preflight |
|---|---|---|---|
| `archived_by_user` | claims | 0012 — GATED | **UNKNOWN — run PRAGMA to confirm** |
| `archived_by_user` | truths | 0012 — GATED | **UNKNOWN** |
| `archived_by_user` | evidence | 0012 — GATED | **UNKNOWN** |
| `archived_by_user` | pressure_points | 0012 — GATED | **UNKNOWN** |
| `hidden_at` | belief_snapshots | 0012 — GATED | **UNKNOWN** |
| `updated_at` | evidence | 0012 — GATED | **UNKNOWN** |
| `near_duplicate_of` | claims | 0006 — gated | Likely present (D-125/130 chain used it) |
| `status_locked` | claims | 0008 — gated | Likely present (D-130B referenced it) |
| `review_state` | pressure_points | 0009 — gated | Likely present (D-90 chain deployed) |

---

## No Code Changes, No Migration Applied

D-180B is preflight/diagnostic only. No files modified except this doc.

---

## Recommended Next Step

1. Run the three PRAGMA commands above in your local terminal.
2. Paste the `PRAGMA table_info(claims)` column list back here (no secrets in schema output).
3. I will confirm the root cause and provide the exact apply command if migration 0012 is needed.

Or, if you prefer to skip the PRAGMA step:
- Run `wrangler tail` in one terminal.
- Click "Load Queue" in the browser (with correct admin token entered).
- Paste only the exception line from the tail output (no headers/token values).
