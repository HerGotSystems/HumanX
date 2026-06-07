# D-83E: Production Status Lock Apply Result

Date: 2026-06-07
Step: D-83E — production application of claims.status_locked column and A1 editorial lock
Type: Docs-only record of manually executed production D1 writes.
No further D1 writes in this step. No Wrangler. No route writes. No moderation actions.

---

## 1. Purpose

D-83E completes the production correction for launch-A1 (MMR/autism claim) that was planned
across D-83A → D-83D. The root cause (documented in D-83A) was that `recalcClaimScore`
unconditionally overwrites `claims.status`, producing "Proven" for A1 based on evidence quality
(avg=85, survivability=87), while the editorial intent established in D-76C was "Strongly
Supported" — a deliberately conservative label for a politically sensitive claim.

The solution (adopted in D-83B, implemented in D-83C, planned in D-83D) is a
`status_locked` boolean column that prevents `recalcClaimScore` from overwriting the
editorial label on specific claims.

D-83E applies that solution to production:
1. Migration 0008 applied — `claims.status_locked INTEGER NOT NULL DEFAULT 0` column added
2. A1 locked — `status_locked = 1`, `status = 'Strongly Supported'`

---

## 2. Execution Method

Direct Cloudflare D1 Console execution by user (Option B from `docs/D83E_BLOCKED_D1_AUTH_SCOPE.md`).

Wrangler CLI was not used (auth scope blocker documented in D-83E-BLOCKED).
No route write calls were made.
No moderation API calls were made.

---

## 3. Pre-Execution State

| Item | State Before D-83E |
|------|-------------------|
| `claims.status_locked` column exists | No — not yet present |
| A1 `status` | `'Proven'` (computed by `recalcClaimScore` when evidence promoted in D-80E) |
| A1 `status_locked` | N/A — column absent |
| A1 `review_state` | `'public'` |
| A1 public API `statusLocked` | `false` (column absent → `!!(undefined) = false`) |

---

## 4. SQL Executed in Cloudflare D1 Console

All commands run against database `humanx` (`f68709d8-b93a-4e5b-8a0e-5b58cc357125`).

### Step 1 — Schema preflight

```sql
PRAGMA table_info(claims);
```

Result: `status_locked` column **absent** from output — migration had not yet been applied.
Proceeded to Step 2.

---

### Step 2 — Apply migration 0008

```sql
ALTER TABLE claims ADD COLUMN status_locked INTEGER NOT NULL DEFAULT 0;
```

Result: Executed successfully. 0 rows changed (DDL statement).

---

### Step 3 — Verify schema

```sql
PRAGMA table_info(claims);
```

Result: `status_locked` row confirmed present in PRAGMA output:

| cid | name | type | notnull | dflt_value | pk |
|-----|------|------|---------|------------|-----|
| … | status_locked | INTEGER | 1 | 0 | 0 |

All existing rows automatically received `status_locked = 0` via the column default.

---

### Step 4 — Verify A1 target row

```sql
SELECT id, claim, status, status_locked
FROM claims
WHERE id = 'clm_seed_55e17c22e13e';
```

Result:

| id | claim | status | status_locked |
|----|-------|--------|---------------|
| clm_seed_55e17c22e13e | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | Proven | 0 |

Exactly 1 row. Claim text exact match. `status_locked = 0`. Proceeded to Step 5.

---

### Step 5 — Apply A1 status lock and correction

```sql
UPDATE claims
SET
  status_locked = 1,
  status = 'Strongly Supported',
  updated_at = 1780843764151
WHERE id = 'clm_seed_55e17c22e13e'
  AND claim = 'Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism';
```

`updated_at` value: `1780843764151` (Unix milliseconds — 2026-06-07)

Result: **1 row changed**. Claim text guard matched. Update successful.

---

### Step 6 — Verify A1 after update

```sql
SELECT id, claim, status, status_locked, updated_at
FROM claims
WHERE id = 'clm_seed_55e17c22e13e';
```

Result:

| id | claim | status | status_locked | updated_at |
|----|-------|--------|---------------|------------|
| clm_seed_55e17c22e13e | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | Strongly Supported | 1 | 1780843764151 |

Status corrected. Lock confirmed. Timestamp recorded.

---

### Step 7 — Verify no other claims locked

```sql
SELECT id, claim, status, status_locked
FROM claims
WHERE status_locked = 1;
```

Result: **exactly 1 row**:

| id | claim | status | status_locked |
|----|-------|--------|---------------|
| clm_seed_55e17c22e13e | Large population studies… | Strongly Supported | 1 |

No other claim was locked.

---

## 5. API Verification (Read-Only)

### 5.1 — A1 claim detail

`GET https://humanx.rinkimirikata.com/api/claims/clm_seed_55e17c22e13e`

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| `status` | `"Strongly Supported"` | `"Strongly Supported"` | ✅ |
| `statusLocked` | `true` | `true` | ✅ |
| `reviewState` | `"public"` | `"public"` | ✅ |
| `claim` text | exact match | exact match | ✅ |
| `evidenceScore` | 85 (unchanged) | 85 | ✅ |
| `survivability` | 87 (unchanged) | 87 | ✅ |
| `contradictions` | 1 (unchanged) | 1 | ✅ |

### 5.2 — All seed claims in public feed

`GET https://humanx.rinkimirikata.com/api/claims?limit=50`

| claim id | status | statusLocked | Expected locked | Pass |
|----------|--------|--------------|----------------|------|
| `clm_seed_55e17c22e13e` (launch-A1) | Strongly Supported | `true` | Yes | ✅ |
| `clm_seed_8e095b6f6d30` (launch-B5) | Strongly Supported | `false` | No | ✅ |
| `clm_seed_c4e0335e7aae` (launch-A4) | Strongly Supported | `false` | No | ✅ |
| `clm_seed_8ad9ff121579` (launch-C1) | Plausible | `false` | No | ✅ |
| `clm_seed_7fb1c24747c2` (launch-D2) | Strongly Supported | `false` | No | ✅ |

All 5 seed claims public. Only A1 is locked. No unintended locks on any other claim.

---

## 6. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| Only A1 (`clm_seed_55e17c22e13e`) modified | ✅ Confirmed |
| No other claim's `status_locked` changed | ✅ Confirmed — all others remain `0` |
| No other claim's `status` changed | ✅ Confirmed |
| No scoring thresholds changed | ✅ Confirmed |
| No moderation action (no review decision, no rejection, no promotion) | ✅ Confirmed |
| No route write calls | ✅ Confirmed |
| No `POST /api/review/decision` | ✅ Confirmed |
| No Wrangler write | ✅ Confirmed |
| No secrets printed or committed | ✅ Confirmed |
| Temp API verification files deleted after reading | ✅ Confirmed |

---

## 7. Effect on recalcClaimScore

The lock is now durable. The `recalcClaimScore` guard in `src/claim-scoring.js` (D-83C) reads
`status_locked` from the claim row. When `status_locked = 1`:

- `evidence_score`, `survivability`, `contradictions`, `updated_at` — **continue to update**
- `claims.status` — **preserved at `'Strongly Supported'`; not overwritten**

Any future event that triggers recalculation (new evidence, evidence report, pressure point,
evidence vote) will no longer reset A1's label to "Proven". The editorial intent from D-76C
is now durably preserved.

---

## 8. Final Production State for launch-A1

| Field | Value |
|-------|-------|
| DB id | `clm_seed_55e17c22e13e` |
| seed_id | `launch-A1` |
| claim text | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism |
| status | `Strongly Supported` |
| status_locked | `1` |
| evidence_score | 85 |
| survivability | 87 |
| contradictions | 1 |
| review_state | `public` |
| updated_at | `1780843764151` |

---

## 9. Gate

| Step | Status |
|------|--------|
| D-83A — scoring audit | ✅ COMPLETE |
| D-83B — policy decision | ✅ COMPLETE |
| D-83C — code support (PR #104) | ✅ COMPLETE |
| D-83D — production apply plan | ✅ COMPLETE |
| D-83E-BLOCKED — auth scope blocker documented | ✅ COMPLETE |
| D-83E — production apply execution | ✅ COMPLETE (this doc) |
| D-83F — durability test (optional) | ⛔ BLOCKED — requires explicit approval; design must be non-destructive |
| D-82 — public UX spot check | ⛔ BLOCKED / optional |
| D-84 — reported claims cleanup | ⛔ BLOCKED / optional |

The D-83 scoring/status consistency work is complete.

---

## D-83E Completion Record

| Item | Status |
|------|--------|
| git HEAD confirmed at D-83E-BLOCKED commit (3640d3b) | ✅ |
| Migration 0008 applied via D1 Console | ✅ |
| `status_locked` column confirmed present post-migration | ✅ |
| A1 pre-update row confirmed (id, text, status=Proven, locked=0) | ✅ |
| A1 UPDATE executed: status_locked=1, status=Strongly Supported, updated_at=1780843764151 | ✅ |
| Changed rows = 1 (claim text guard matched) | ✅ |
| A1 post-update row confirmed (status=Strongly Supported, locked=1) | ✅ |
| WHERE status_locked=1 query returned exactly 1 row (A1 only) | ✅ |
| Public API A1 detail: status=Strongly Supported, statusLocked=true | ✅ |
| Public API feed: all 5 seed claims public, only A1 locked | ✅ |
| Static checks 127/24/39 passed on main | ✅ |
| No other claim modified | ✅ |
| No Wrangler write | ✅ |
| No route write | ✅ |
| No moderation action | ✅ |
| No secrets printed or committed | ✅ |
| Temp verification files deleted | ✅ |
| docs/D83E_PRODUCTION_STATUS_LOCK_APPLY_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
