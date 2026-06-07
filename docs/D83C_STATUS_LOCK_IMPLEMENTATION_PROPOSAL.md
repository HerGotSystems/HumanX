# D-83C: Status Lock Implementation Proposal

Date: 2026-06-07
Step: D-83C — branch implementation of status_locked support
Branch: feature/d83c-status-lock
Type: Branch + PR. No direct main commit. No production D1. No Wrangler. No live route calls.

---

## 1. Purpose

D-83C implements the `status_locked` boolean column on the `claims` table as decided in D-83B
(Option 4). This is a branch-only change — no production writes are made until D-83D is
explicitly approved in a separate session after this PR is merged.

---

## 2. Non-Execution Statement

D-83C makes no production DB changes.
D-83C calls no live routes.
D-83C runs no D1 direct commands.
D-83C runs no Wrangler.
D-83C does not set `status_locked = 1` on any claim in production.
D-83C does not correct any claim's `status` field.
All changes are code-only on the feature branch.

---

## 3. Files Changed

### 3.1 — `migrations/0008_add_status_locked.sql` (new file)

```sql
ALTER TABLE claims ADD COLUMN status_locked INTEGER NOT NULL DEFAULT 0;
```

- Idiomatic SQLite boolean: `INTEGER DEFAULT 0`
- Safe to run on live D1 — ADD COLUMN with a literal DEFAULT does not rewrite table
- All existing rows automatically receive `status_locked = 0`
- No data migration required
- Applied-in-production record: pending D-83C merge + D-83D approval

### 3.2 — `src/claim-scoring.js`

**Claim query extended** (line 10):
```js
// Before:
const claim = await env.DB.prepare(`SELECT type,testability FROM claims WHERE id=?`).bind(claimId).first();

// After:
const claim = await env.DB.prepare(`SELECT type,testability,status_locked FROM claims WHERE id=?`).bind(claimId).first();
```

**UPDATE split on lock state** (lines 23–25 → conditional block):
```js
if (claim?.status_locked) {
  // Status is editorially locked — update computed fields only, preserve existing status
  await env.DB.prepare(`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, updated_at=? WHERE id=?`)
    .bind(avg, survivability, contradictions, Date.now(), claimId)
    .run();
} else {
  // Default behavior — update all fields including status
  await env.DB.prepare(`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=? WHERE id=?`)
    .bind(avg, survivability, contradictions, computedStatus, Date.now(), claimId)
    .run();
}
```

**Return value** extended with `statusLocked` flag:
```js
return { evidenceScore: avg, survivability, contradictions, status: computedStatus, statusLocked: !!(claim?.status_locked), testability };
```

The returned `status` always reflects the computed verdict (what the algorithm would assign),
which allows callers to observe the computed value independent of the lock state.

### 3.3 — `scripts/hardening-smoke-test.mjs`

Section 27 (D-83C) added before Summary, with 8 tests:

| Test | Description |
|------|-------------|
| 1 | migration 0008 contains `status_locked INTEGER NOT NULL DEFAULT 0` |
| 2 | migration 0008 uses `ALTER TABLE claims ADD COLUMN` |
| 3 | migration 0008 does not UPDATE any row's status_locked value |
| 4 | recalcClaimScore reads status_locked from claims row |
| 5 | claim query selects status_locked |
| 6 | locked branch present (UPDATE without `status=?`) |
| 7 | unlocked branch present (UPDATE with `status=?`) |
| 8 | no hardcoded claim IDs in scoring code |

### 3.4 — `src/worker.js` — `mapClaim` (optional, included)

`statusLocked: !!(c.status_locked)` added to mapClaim response shape.

Exposes lock state in the API for future admin UI use. Does not affect public-facing claim
display logic — frontend currently renders `status` directly. `statusLocked: false` is the
default for all existing and new claims.

---

## 4. Behavior Guarantees

| Scenario | Behavior |
|----------|----------|
| `status_locked = 0` (all current claims) | `recalcClaimScore` behavior unchanged — status updated on every trigger |
| `status_locked = 1` (future, after D-83D) | `recalcClaimScore` preserves existing status; still updates evidence_score, survivability, contradictions, updated_at |
| New user-submitted claim | Default `status_locked = 0` — no change to existing behavior |
| Evidence promotion triggers recalcClaimScore | Lock state respected |
| Pressure point added triggers recalcClaimScore | Lock state respected |
| Report on evidence triggers recalcClaimScore | Lock state respected |
| Evidence reuse (linkEvidenceToClaim) triggers recalcClaimScore | Lock state respected |

---

## 5. What This Does NOT Do

- Does not set `status_locked = 1` on any claim (not in migration, not in code)
- Does not correct launch-A1's status to "Strongly Supported" — that is D-83D
- Does not add an admin UI for setting lock state
- Does not add a public-facing lock indicator to the frontend
- Does not modify the importer (`src/importer.js`) to accept status_locked from seed data
- Does not run the migration against production D1

---

## 6. D-83D Gate

D-83D (production correction) is still blocked. It requires:
1. This PR merged to main
2. Migration 0008 applied to production D1 (explicit approval)
3. Explicit write approval in the same session as execution for:
   - `UPDATE claims SET status_locked=1, status='Strongly Supported' WHERE id='clm_seed_55e17c22e13e'`

---

## 7. Static Test Results

All static check suites pass on the branch:

| Suite | Tests | Result |
|-------|-------|--------|
| Hardening smoke (D-83C section added) | 119 + 8 = 127 | ✅ |
| Belief engine | 24 | ✅ |
| Worker route | 39 | ✅ |

---

## D-83C Completion Record

| Item | Status |
|------|--------|
| Branch feature/d83c-status-lock created | ✅ |
| migrations/0008_add_status_locked.sql created | ✅ |
| src/claim-scoring.js — claim query reads status_locked | ✅ |
| src/claim-scoring.js — UPDATE split on lock state | ✅ |
| src/claim-scoring.js — return includes statusLocked flag | ✅ |
| src/worker.js — mapClaim exposes statusLocked | ✅ |
| scripts/hardening-smoke-test.mjs — section 27 added (8 tests) | ✅ |
| All static checks pass | ✅ |
| No hardcoded claim IDs in scoring code | ✅ |
| No production D1 commands | ✅ |
| No live route calls | ✅ |
| No status correction | ✅ |
| No status_locked = 1 set on any claim | ✅ |
| docs/D83C_STATUS_LOCK_IMPLEMENTATION_PROPOSAL.md created | ✅ |
| Committed to branch: feat: add status lock support for claim scoring | ✅ |
| PR opened against main | ✅ |
| D-83D remains blocked | ✅ |
