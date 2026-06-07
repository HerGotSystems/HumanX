# D-83D: Production Status Lock Apply Plan

Date: 2026-06-07
Step: D-83D — docs-only production apply plan following D-83C merge
Type: Docs-only. Direct main.
No D1 writes. No Wrangler. No migration apply. No status correction. No route calls.

---

## 1. Purpose

D-83C merged PR #104 (`7f69f26`) and delivered:

- `migrations/0008_add_status_locked.sql` — `ALTER TABLE claims ADD COLUMN status_locked INTEGER NOT NULL DEFAULT 0`
- `src/claim-scoring.js` — `recalcClaimScore` guard: when `status_locked = 1`, UPDATE skips `status=?` and preserves the editorial label
- `src/worker.js` — `mapClaim` exposes `statusLocked` in the API response
- 8 new hardening smoke tests (127 total)

The code support exists in production (deployed via Cloudflare Worker on merge).
The DB schema change has **not** been applied to production D1 yet.
The A1 lock has **not** been set yet.

D-83D documents the exact planned production operations and their sequencing, confirms all
preconditions, and defines failure handling and rollback procedures.

**D-83D executes nothing.** All operations below are marked BLOCKED / DO NOT RUN.

---

## 2. Non-Execution Statement

D-83D makes no D1 writes.
D-83D runs no Wrangler commands.
D-83D applies no migration.
D-83D calls no live routes.
D-83D does not set `status_locked = 1` on any claim.
D-83D does not correct any claim's `status` field.
No DB row was modified during D-83D.
No admin token was used in D-83D.

---

## 3. Current State

| Item | Status |
|------|--------|
| D-83C code merged | ✅ — PR #104 merged (`7f69f26`), branch commits `327e789` + `383e631` |
| `recalcClaimScore` lock guard in production Worker | ✅ — deployed on merge |
| `mapClaim` exposes `statusLocked` | ✅ — deployed on merge |
| Migration 0008 applied to production D1 | ❌ — NOT YET |
| `claims.status_locked` column exists in production | ❌ — NOT YET |
| `clm_seed_55e17c22e13e` (A1) `status_locked = 1` | ❌ — NOT YET |
| `clm_seed_55e17c22e13e` (A1) `status = 'Strongly Supported'` | ❌ — currently `'Proven'` (computed by recalcClaimScore when evidence was promoted in D-80E) |

**Risk note:** Until migration 0008 is applied, the `status_locked` column does not exist.
`recalcClaimScore` queries `SELECT type,testability,status_locked FROM claims WHERE id=?`.
In production D1 today, this query silently returns `status_locked = undefined` (D1 returns
`null`/`undefined` for missing columns without erroring on most clients). The `if (claim?.status_locked)`
guard evaluates `undefined` as falsy — correct behavior: the unlocked path runs.

No production malfunction exists today. The guard is safe even before the migration is applied.
The migration simply makes the column formally present with a typed default.

---

## 4. Planned Production Operations

### BLOCKED — DO NOT RUN IN D-83D

All operations in this section require explicit same-session D1 write approval in D-83E.
They are documented here exactly as they should be executed, in order, when that approval
is given.

---

#### Step 1 — Preflight: Verify production schema

Before applying the migration, run a PRAGMA check to confirm whether `status_locked`
already exists:

```sql
-- BLOCKED — DO NOT RUN IN D-83D
PRAGMA table_info(claims);
```

Expected output (column not yet present — safe to apply):
No row with `name = 'status_locked'` in the result set.

If `status_locked` is already present (unexpected), skip Step 2 and proceed to Step 3.

---

#### Step 2 — Apply migration 0008

```sql
-- BLOCKED — DO NOT RUN IN D-83D
ALTER TABLE claims ADD COLUMN status_locked INTEGER NOT NULL DEFAULT 0;
```

Source file: `migrations/0008_add_status_locked.sql`

Safety properties:
- `ADD COLUMN` with a literal `DEFAULT 0` in SQLite/D1 does not rewrite the table
- All existing rows automatically receive `status_locked = 0`
- Safe to run on a live database with concurrent reads/writes
- If run a second time (accidentally), D1 will error "duplicate column name: status_locked"
  — non-destructive; just confirms the column already exists

---

#### Step 3 — Verify A1 row exists and current state

```sql
-- BLOCKED — DO NOT RUN IN D-83D
SELECT id, claim, status, status_locked
FROM claims
WHERE id = 'clm_seed_55e17c22e13e';
```

Expected:
| id | claim | status | status_locked |
|----|-------|--------|---------------|
| clm_seed_55e17c22e13e | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | Proven | 0 |

Stop conditions:
- If row not found → **STOP. Do not proceed. Report missing row.**
- If `status_locked` column not found → migration not applied; return to Step 2
- If `status` is already `'Strongly Supported'` and `status_locked = 0` → proceed to Step 4 (still lock it to make the correction durable)
- If `status_locked` is already `1` → investigate unexpected prior write; do not re-apply

---

#### Step 4 — Apply A1 status lock and correction

```sql
-- BLOCKED — DO NOT RUN IN D-83D
-- ONLY CLAIM TARGETED: clm_seed_55e17c22e13e (launch-A1)
-- EXACT TEXT GUARD: claim text must match to prevent wrong-row update
UPDATE claims
SET
  status_locked = 1,
  status = 'Strongly Supported',
  updated_at = <current_unix_ms>
WHERE id = 'clm_seed_55e17c22e13e'
  AND claim = 'Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism';
```

The `AND claim = '...'` guard ensures that if the `id` were to match an unexpected row
(which it cannot in normal operation — IDs are unique and seed-generated), the wrong row
would not be locked.

Expected affected rows: **exactly 1**

Stop conditions:
- If affected rows = 0 → claim text guard failed; inspect A1 claim text before retrying
- If affected rows > 1 → impossible by design (id is unique primary key); stop and investigate

**Important:** `updated_at` must be the current Unix timestamp in milliseconds (e.g., `Date.now()` → `1780840000000`). The exact value is determined at execution time in D-83E, not hardcoded here.

---

#### Step 5 — Post-write verification

```sql
-- BLOCKED — DO NOT RUN IN D-83D
SELECT id, claim, status, status_locked, updated_at
FROM claims
WHERE id = 'clm_seed_55e17c22e13e';
```

Expected:
| id | claim | status | status_locked | updated_at |
|----|-------|--------|---------------|------------|
| clm_seed_55e17c22e13e | Large population studies... | Strongly Supported | 1 | <recent_ts> |

**AND** verify public API reflects the change:

```
GET https://humanx.rinkimirikata.com/api/claims/clm_seed_55e17c22e13e
```

Expected in response:
- `claim.status` = `"Strongly Supported"`
- `claim.statusLocked` = `true` (only if mapClaim has the column — it does, as of D-83C)

---

#### Step 6 — Verify no other claims are targeted

```sql
-- BLOCKED — DO NOT RUN IN D-83D
SELECT id, claim, status_locked FROM claims WHERE status_locked = 1;
```

Expected: exactly 1 row — `clm_seed_55e17c22e13e`.

If any other row appears, that is an unexpected write. Investigate before proceeding.

---

## 5. Preflight Checklist for D-83E

Before executing any D-83E writes, verify all of the following:

| # | Check | Method | Expected |
|---|-------|--------|----------|
| 1 | D-83C merged and deployed | `git log --oneline -5` on main; Cloudflare dashboard | Merge commit `7f69f26` on main; Worker deployed |
| 2 | Production schema — no `status_locked` column yet | `PRAGMA table_info(claims)` via D1 console | No `status_locked` row |
| 3 | A1 row exists | `SELECT id FROM claims WHERE id='clm_seed_55e17c22e13e'` | 1 row |
| 4 | A1 current status | `SELECT status FROM claims WHERE id='clm_seed_55e17c22e13e'` | `'Proven'` (expected) or `'Strongly Supported'` (migration already ran — adjust plan) |
| 5 | A1 claim text exact match | `SELECT claim FROM claims WHERE id='clm_seed_55e17c22e13e'` | "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism" |
| 6 | No other status_locked writes pending | None | Only A1 in scope |
| 7 | Static checks pass on main | `node scripts/hardening-smoke-test.mjs` | 127/0 |
| 8 | D-83E explicit write approval received in same session | User confirms in session | Required before any D1 write |

---

## 6. Expected Post-Write State

After D-83E successful execution:

| Item | Before D-83E | After D-83E |
|------|-------------|------------|
| `claims.status_locked` column exists in production | No | Yes |
| All existing claims `status_locked` | N/A | 0 (default) |
| `clm_seed_55e17c22e13e` `status_locked` | N/A | 1 |
| `clm_seed_55e17c22e13e` `status` | `'Proven'` | `'Strongly Supported'` |
| API `GET /api/claims/clm_seed_55e17c22e13e` `status` | `"Proven"` | `"Strongly Supported"` |
| API `GET /api/claims/clm_seed_55e17c22e13e` `statusLocked` | `false` | `true` |
| `recalcClaimScore` on A1 overwrites status | Yes | No — lock guard preserves `'Strongly Supported'` |
| `recalcClaimScore` on A1 updates computed fields | Yes | Yes — `evidence_score`, `survivability`, `contradictions`, `updated_at` still update |
| All other seed claims `status_locked` | N/A | 0 |
| All other seed claims `status` | Unchanged | Unchanged |
| Launch-B5/A4/D2 `status` | `'Strongly Supported'` (computed) | `'Strongly Supported'` (no lock needed, accepted) |
| Launch-C1 `status` | `'Plausible'` (computed matches seed) | `'Plausible'` (no lock needed) |

---

## 7. Failure Handling

| Scenario | Response |
|----------|----------|
| Migration 0008 already applied (column exists) | Skip Step 2. Run Step 1 PRAGMA to confirm. Proceed to Step 3. Do not re-apply. |
| A1 row not found | **STOP.** Report missing row. Do not apply UPDATE. |
| A1 claim text mismatch | **STOP.** Retrieve actual text. Re-draft UPDATE with exact text before retrying. |
| Affected rows = 0 after UPDATE | Claim text guard rejected. Retrieve actual text. Do not retry until text is confirmed. |
| Affected rows > 1 | Impossible (id is unique primary key). Stop. Investigate DB integrity. |
| `statusLocked: true` not visible in API response | Non-blocking — column may be NULL/absent before migration applied. Confirm via PRAGMA. If column exists and `mapClaim` has `statusLocked` field (it does, as of D-83C), the response will include it. |
| `status` shows `'Proven'` in API after write | Cache or CDN delay. Wait 30 seconds and retry GET. If persists, recheck D1 row directly. |
| Wrong claim accidentally locked (should not happen with text guard) | See Section 8 — rollback plan. |

---

## 8. Rollback Plan

D-83E changes are reversible. All rollbacks require explicit approval in the same session
as execution.

### Rollback A — Unlock a wrong row

If an unexpected claim was accidentally locked:

```sql
-- BLOCKED — requires explicit rollback approval
UPDATE claims
SET status_locked = 0, updated_at = <current_unix_ms>
WHERE id = '<wrong_claim_id>';
```

Verify with: `SELECT id, status, status_locked FROM claims WHERE id = '<wrong_claim_id>'`

### Rollback B — Correct A1 status if wrong value set

If A1 was locked with the wrong status value:

```sql
-- BLOCKED — requires explicit rollback approval
UPDATE claims
SET status = '<correct_value>', updated_at = <current_unix_ms>
WHERE id = 'clm_seed_55e17c22e13e'
  AND status_locked = 1;
```

Acceptable values: `'Strongly Supported'` (intended), `'Proven'` (computed, not editorial goal).

### Rollback C — Unlock A1 entirely

If the lock itself needs to be removed (e.g., policy reversal):

```sql
-- BLOCKED — requires explicit rollback approval
UPDATE claims
SET status_locked = 0, updated_at = <current_unix_ms>
WHERE id = 'clm_seed_55e17c22e13e';
```

After unlocking, the next `recalcClaimScore` trigger will recompute `status = 'Proven'`
(based on current evidence quality: avg=85, survivability=87).

### Rollback D — Remove migration (not recommended)

`ALTER TABLE ... DROP COLUMN` is supported in SQLite 3.35+ and D1. However, removing
`status_locked` would require that no locks are currently set (all values = 0). If the
lock is already set on A1, first run Rollback C, then:

```sql
-- BLOCKED — requires explicit rollback approval — only if no rows have status_locked = 1
ALTER TABLE claims DROP COLUMN status_locked;
```

Migration removal is a last resort. It would revert the schema to the pre-D-83C state.

---

## 9. Gate

| Step | Status |
|------|--------|
| D-83A — scoring audit | ✅ COMPLETE |
| D-83B — policy decision | ✅ COMPLETE |
| D-83C — code support (branch + PR) | ✅ COMPLETE (PR #104 merged) |
| D-83D — production apply plan | ✅ COMPLETE (this doc) |
| D-83E — production apply execution | ⛔ BLOCKED |

**D-83E is blocked until:**
1. The user provides explicit D1 write approval in the same session as execution
2. The user confirms they have access to the Cloudflare D1 console or Wrangler CLI
3. This plan (D-83D) has been reviewed and accepted

**No status correction will be made until D-83E is explicitly approved.**
The production site will continue to show A1 as `"Proven"` until then.

---

## D-83D Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-83C merge commit (7f69f26) | ✅ |
| Current production state documented | ✅ |
| Migration 0008 SQL documented exactly | ✅ |
| A1 update SQL documented exactly with text guard | ✅ |
| Pre/post-write state table included | ✅ |
| Preflight checklist complete | ✅ |
| Failure handling table complete | ✅ |
| Rollback plan (4 scenarios) included | ✅ |
| D-83E gate defined | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| No migration apply | ✅ |
| No status correction | ✅ |
| No route calls | ✅ |
| No admin token | ✅ |
| docs/D83D_PRODUCTION_STATUS_LOCK_APPLY_PLAN.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
