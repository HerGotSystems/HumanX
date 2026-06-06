# D-50: Score Public Evidence Only

Date: 2026-06-06
Branch: `fix/d50-score-public-evidence-only`
Status: Branch + PR. Not merged.

---

## Purpose

Fix `recalcClaimScore` to count only evidence with `COALESCE(review_state,'public')='public'`.
Without this filter, pending and rejected evidence affects claim scores immediately on submission
and after admin decisions — producing stale or inflated `evidence_score`, `survivability`, and
`status` values.

This fix closes the four gap scenarios identified in D-49 (`docs/D49_SCORE_RECALC_EVIDENCE_REVIEW_AUDIT.md`).

---

## Changes

### `src/claim-scoring.js` — Filter both evidence queries

**Direct evidence** — added `COALESCE(review_state,'public')='public'`:

```js
// Before
const directEvidence = await env.DB.prepare(
  `SELECT quality, stance FROM evidence WHERE claim_id=?`
).bind(claimId).all();

// After
const directEvidence = await env.DB.prepare(
  `SELECT quality, stance FROM evidence WHERE claim_id=? AND COALESCE(review_state,'public')='public'`
).bind(claimId).all();
```

**Reused evidence** — added `COALESCE(e.review_state,'public')='public'` on the joined table:

```js
// Before
const reusedEvidence = await env.DB.prepare(`
  SELECT e.quality, l.stance
  FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=?
`).bind(claimId).all();

// After
const reusedEvidence = await env.DB.prepare(`
  SELECT e.quality, l.stance
  FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
`).bind(claimId).all();
```

`COALESCE(...,'public')` treats any `NULL` row (pre-migration legacy) as public, consistent
with the D-42B pattern used in all other evidence queries.

---

### `src/worker.js` — Add `recalcClaimScore` after `reviewDecision` evidence branch

**Problem:** Admin approving, rejecting, or re-queuing evidence never triggered a score
recalculation. The evidence row already had its `review_state` changed, but the claim's
`evidence_score`, `survivability`, and `status` remained stale until an unrelated event
triggered a recalc.

**Fix:** Added `if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(()=>null);`
before the `return json(...)` in the evidence branch of `reviewDecision`. The `row` variable
already contains `claim_id` from `e.*` in the SELECT.

```js
// After (evidence branch, before return)
if (!row) return json({ error:'EVIDENCE_NOT_FOUND' },404);
if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(()=>null);
return json({ ok:true, targetType:'evidence', decision, item:row });
```

This fires for all three `reviewDecision` values:
- `public` (approve) — score is updated to include the newly-public evidence
- `rejected` — score is updated to exclude the rejected evidence
- `review` (re-queue / keep pending) — score is updated to exclude the re-queued evidence

The `.catch(()=>null)` is fail-safe: score recalc failure does not fail the admin action.

---

### `src/worker.js` — Add `recalcClaimScore` after `reportTarget` evidence escalation

**Problem:** When evidence accumulated ≥ 2 reports, `reportTarget` auto-escalated it from
`public` to `review_state='review'`, but did not trigger a score recalculation. The evidence
continued to count toward the claim score even after being pulled from public view.

**Fix:** Added a `claim_id` lookup and conditional recalc. The recalc fires only when the
escalation threshold is crossed for the first time (`report_count+1 === 2`), avoiding
unnecessary recalcs on repeat reports where the state is already `'review'`.

```js
// After (evidence branch of reportTarget)
if (targetType === 'evidence') {
  const evRow=await env.DB.prepare(`SELECT claim_id, report_count FROM evidence WHERE id=?`).bind(targetId).first();
  await env.DB.prepare(`UPDATE evidence SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END WHERE id=?`).bind(targetId).run();
  if (evRow?.claim_id && (evRow.report_count+1)===2) await recalcClaimScore(env, evRow.claim_id).catch(()=>null);
}
```

---

### `addEvidence` — no change

`addEvidence` already called `recalcClaimScore` after `insertEvidence`. With the query filter
now in place, new pending evidence (inserted as `review_state='review'`) is excluded from the
score computation. The call is retained for any future path where evidence is inserted as
`public` directly (e.g., an admin-bypass insert).

---

### `scripts/hardening-smoke-test.mjs` — Section 25 (3 new checks, 110 → 113)

Added section 25 with three checks:

1. `recalcClaimScore` direct evidence query includes `COALESCE(review_state,'public')='public'`
2. `recalcClaimScore` reused evidence query includes `COALESCE(e.review_state,'public')='public'`
3. `reviewDecision` evidence branch calls `recalcClaimScore` after updating `review_state`

Self-reference in the README assertion updated from 110 → 113.

---

## Verification

| Check | Command | Result |
|-------|---------|--------|
| `src/claim-scoring.js` syntax | `node --check src/claim-scoring.js` | exit 0 |
| `src/worker.js` syntax | `node --check src/worker.js` | exit 0 |
| Hardening smoke | `node scripts/hardening-smoke-test.mjs` | **113 passed, 0 failed** |
| Belief engine check | `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| Worker route check | `node scripts/worker-route-static-check.mjs` | **39 passed, 0 failed** |

---

## Gap Scenarios Closed

| Scenario | Description | Status |
|----------|-------------|--------|
| A | New pending evidence counted in score immediately at submission | Closed — filter excludes `review_state='review'` from score query |
| B | Approving evidence does not recalculate score | Closed — `reviewDecision` evidence branch now calls `recalcClaimScore` |
| C | Rejecting evidence does not recalculate score | Closed — same fix covers all `reviewDecision` values |
| D | Report escalation removes evidence from public view but not from score | Closed — `reportTarget` now calls `recalcClaimScore` on first escalation |

---

## What Is NOT Changed

| Item | Status |
|------|--------|
| Score algorithm / formula | Unchanged — formula, weights, and `verdict()` function are unchanged |
| Schema / D1 migrations | None — application code change only |
| Frontend | None |
| `pressure_points` query | Unchanged — pressure always counted regardless of any state (no `review_state` on pressure rows) |
| Production score backfill | Not included — existing stale scores self-correct next time evidence or pressure is submitted to each claim. A batch recalc requires explicit approval; it is not part of D-50. |

---

## Safety Boundaries

| Boundary | Status |
|----------|--------|
| No schema migration | ✅ |
| No D1 commands | ✅ |
| No Wrangler | ✅ |
| No live write smoke | ✅ |
| No frontend changes | ✅ |
| Branch + PR (not direct main) | ✅ — branch `fix/d50-score-public-evidence-only` |
| No Co-Authored-By | ✅ |
| No production mutations | ✅ |
| No merge without review | ✅ — stop after PR |

---

## D-50 Completion Record

| Item | Status |
|------|--------|
| `src/claim-scoring.js` direct evidence query filtered | ✅ |
| `src/claim-scoring.js` reused evidence query filtered | ✅ |
| `src/worker.js` `reviewDecision` evidence branch adds recalc | ✅ |
| `src/worker.js` `reportTarget` evidence branch adds recalc on escalation | ✅ |
| `addEvidence` recalc call preserved | ✅ |
| 3 new hardening checks added (section 25, 110→113) | ✅ |
| `node --check src/claim-scoring.js` exit 0 | ✅ |
| `node --check src/worker.js` exit 0 | ✅ |
| `hardening-smoke-test.mjs` 113 passed, 0 failed | ✅ |
| `belief-engine-static-check.mjs` 24 passed, 0 failed | ✅ |
| `worker-route-static-check.mjs` 39 passed, 0 failed | ✅ |
| `docs/D50_SCORE_PUBLIC_EVIDENCE_ONLY.md` created | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| `docs/API_ENDPOINT_INVENTORY.md` updated | ✅ |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` updated | ✅ |
| `docs/README.md` count updated (110→113) | ✅ |
| Branch committed and pushed | ✅ |
| PR opened | ✅ |
| Not merged | ✅ |
