# D-38: Public Visibility Guards

Date: 2026-06-06
Branch: `security/d38-public-visibility-guards`
Status: Implemented — branch, PR. No migrations. No D1 commands. No Wrangler. No live tests.

---

## Purpose

D-37 (security audit) identified three confirmed visibility gaps where non-public claims
(those with `review_state` other than `'public'`) could be accessed by unauthenticated
callers. D-38 closes all three gaps with no-migration guards.

---

## Gaps Closed

### Gap A — Evidence Vault (`GET /api/evidence-vault`)

**File:** `src/evidence-vault.js`

**Before D-38:** The evidence vault query joined `claims` but did not filter on
`review_state`. Any evidence item linked to a non-public claim appeared in vault results
with its parent claim text, category, and status exposed.

**Fix:** Added `COALESCE(c.review_state,'public')='public'` to the WHERE clause.
Evidence items linked to non-public claims are now excluded from all vault results.

```sql
-- Before
WHERE e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?

-- After
WHERE COALESCE(c.review_state,'public')='public'
  AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
```

---

### Gap B — Direct Claim Fetch (`GET /api/claims/:id`)

**File:** `src/worker.js` — `getClaim` handler

**Before D-38:** The `getClaim` handler fetched the claim row and returned full detail
(evidence, pressure, tests, analyses, lineage) without checking `review_state`. Any caller
who knew a claim ID could retrieve full detail for claims in `review`, `rejected`,
`archived`, or `duplicate` state.

**Fix B-1 (decouple):** `createClaim` previously called `getClaim(request, env, claimId)`
as its success response. New claims land in `review_state='review'`. After adding the
public guard, this call would have returned 404 for all new claims. The tail of
`createClaim` was decoupled: it now calls `claimDetail` + `claimLineage` directly and
constructs the response shape inline, bypassing the HTTP guard.

**Fix B-2 (guard):** Added a `review_state` check in `getClaim` after the `!claim` null
check:

```js
if ((claim.review_state||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404);
```

Non-public claims now return HTTP 404 with `CLAIM_NOT_FOUND` — identical to the response
for a genuinely missing claim, giving no information about whether the claim exists.

---

### Gap C — RunPack Export (`POST /api/runpack`, `POST /api/aip`)

**File:** `src/worker.js` — `createAipPacket` handler

**Before D-38:** The `createAipPacket` handler fetched full claim detail via `claimDetail`
(which has no HTTP-layer guard by design) and built a full RunPack packet with no
`review_state` check. Any unauthenticated caller who knew a claim ID could export a full
RunPack for a non-public claim.

**Fix:** Added a `reviewState` check after the `!detail.claim` null check:

```js
if ((detail.claim.reviewState||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404);
```

Note: `claimDetail` returns `claim` already mapped through `mapClaim()` (camelCase), so
`detail.claim.reviewState` is the correct field (not `review_state`). Non-public claims now
return 404 before any RunPack is built or stored in `aip_packets`.

---

## What Was NOT Changed

- `claimOnly` and `claimDetail` — internal helpers with no HTTP-layer guard. Filter belongs
  in the HTTP handler layer only. These helpers are intentionally ungated so they can be
  used internally (e.g. `createClaim` tail, `addEvidence`, admin paths).
- No `requireUser` added to `createAipPacket`. Public claims remain exportable without auth
  (RunPack-first design). Only the `review_state` guard was added.
- No D1 migrations. All fixes are query/logic only.
- No new tables, columns, or indexes.
- No changes to `review_state` values or moderation logic.
- No changes to rate limits, scoring, or duplicate detection.

---

## Design Invariant: COALESCE Default

All `review_state` guards use the same pattern as the existing `listClaims` filter:

```js
COALESCE(c.review_state,'public')='public'   // SQL
(claim.review_state||'public')!=='public'     // JS (raw row)
(detail.claim.reviewState||'public')!=='public'  // JS (mapClaim'd row)
```

A NULL `review_state` (legacy rows predating the column) defaults to `'public'`. This
matches the existing behaviour in `listClaims` and `mapClaim`.

---

## Static Checks Added (section 22 of hardening-smoke-test.mjs)

Three new assertions were added to `scripts/hardening-smoke-test.mjs`, raising the total
from 100 to 103:

1. `evidence-vault.js contains COALESCE(c.review_state,'public')='public' public filter`
2. `getClaim has public visibility guard for non-public claims (D-38)`
3. `createAipPacket checks review_state public before buildRunPack (D-38)`

The self-reference check in `hardening-smoke-test.mjs` and `docs/README.md` Known-good
checks table were updated from `100 passed, 0 failed` to `103 passed, 0 failed`.

---

## Docs Updated

- `docs/API_ENDPOINT_INVENTORY.md` — updated risk notes for `GET /api/claims/:id`,
  `GET /api/evidence-vault`, `POST /api/runpack`, `POST /api/aip`
- `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` — updated runpack/aip rows and notes section
- `docs/README.md` — Known-good checks table updated: 100 → 103
- `docs/PROJECT_STATE.md` — D-38 batch row added

---

## Files Changed

| File | Change |
|---|---|
| `src/evidence-vault.js` | Fix A: added `COALESCE(c.review_state,'public')='public'` filter |
| `src/worker.js` | Fix B-1: decoupled `createClaim` tail from `getClaim` HTTP handler |
| `src/worker.js` | Fix B-2: added `review_state` public guard to `getClaim` |
| `src/worker.js` | Fix C: added `reviewState` public guard to `createAipPacket` |
| `scripts/hardening-smoke-test.mjs` | Added section 22 (3 checks); updated self-reference from 100→103 |
| `docs/README.md` | Updated known-good count 100→103 |
| `docs/API_ENDPOINT_INVENTORY.md` | Updated risk notes for affected endpoints |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` | Updated runpack/aip rows and notes |
| `docs/D38_PUBLIC_VISIBILITY_GUARDS.md` | This document |
| `docs/PROJECT_STATE.md` | D-38 batch row |
