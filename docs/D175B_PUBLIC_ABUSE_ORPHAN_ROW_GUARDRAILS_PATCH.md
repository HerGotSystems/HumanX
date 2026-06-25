# D-175B — Public Abuse and Orphan-Row Guardrails Patch

**Date:** 2026-06-25
**Commit:** (set after commit)
**Entering baseline:** 1308/24/57
**Exiting baseline:** 1322/24/57
**Files changed:** `src/worker.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`

---

## What Changed

### P1 — `/api/session` rate limit (`src/worker.js`)

**D-175A F1:** `createOrGetUser()` had no rate limit. Any IP could make unlimited calls, each potentially creating a new row in the `users` table (via `INSERT OR IGNORE`).

Added `safeRateLimit` as the first operation in `createOrGetUser()`, before `readJson`:

```js
async function createOrGetUser(request, env) {
  await safeRateLimit(request, env, `session:${ip(request)}`, 30, 3600000);
  const body = await readJson(request);
  ...
```

- **Key:** `session:${ip(request)}` — IP-scoped via `cf-connecting-ip` (Cloudflare edge, not user-spoofable)
- **Limit:** 30 requests per hour per IP — generous enough for normal page-load and reconnect behavior
- **Placement:** Before `readJson` so rate-limited requests are rejected before body parsing or DB writes
- **Response on limit:** Standard `RATE_LIMITED` error from `safeRateLimit` (same pattern as all other rate-limited routes)
- **No change to response shape:** Session still returns `{ user, owner_token }` — no IP or fingerprint exposed

### P2 — `addEvidence()` claim existence check (`src/worker.js`)

**D-175A F2:** `addEvidence()` validated that `claimId` was non-empty but did not verify the claim exists before calling `insertEvidence()`. A fabricated or deleted `claimId` would produce an orphaned `evidence` row with no parent claim.

Added existence check after input validation, before `ensureUser` and `insertEvidence`:

```js
if (!claimId || note.length < 3) return json({ error:'BAD_EVIDENCE' },400);
const evidenceClaimRow=await env.DB.prepare(`SELECT id FROM claims WHERE id=? LIMIT 1`).bind(claimId).first();
if (!evidenceClaimRow) return json({ error:'CLAIM_NOT_FOUND' },404);
await ensureUser(env,userId);
const item=await insertEvidence(env,claimId,userId,...);
```

- **Rejection:** `{ error:'CLAIM_NOT_FOUND' }` 404 — same pattern as `addHomeTest` and `addAnalysisResult`
- **No internal claim metadata exposed** — query selects `id` only; error response contains no claim fields
- **Review-first preserved** — `insertEvidence` behavior unchanged; all valid evidence still enters `review_state='review'`
- **Scoring unchanged** — `recalcClaimScore` still called on valid path

### P3 — `addPressure()` claim existence check (`src/worker.js`)

**D-175A F3:** `addPressure()` same pattern — no claim existence check before `INSERT INTO pressure_points`.

Added existence check after input validation, before `ensureUser` and INSERT:

```js
if (!claimId || note.length < 3) return json({ error:'BAD_PRESSURE' },400);
const pressureClaimRow=await env.DB.prepare(`SELECT id FROM claims WHERE id=? LIMIT 1`).bind(claimId).first();
if (!pressureClaimRow) return json({ error:'CLAIM_NOT_FOUND' },404);
await ensureUser(env,userId);
const now=Date.now();
const pressureId=makeId('prs');
await env.DB.prepare(`INSERT INTO pressure_points ...`);
```

- **Rejection:** `{ error:'CLAIM_NOT_FOUND' }` 404
- **No internal claim metadata exposed** — same minimal query as P2
- **Review-first preserved** — `review_state='review'` hardcoded in INSERT, unchanged
- **Response unchanged** — valid path still returns `{ pressure:{...}, claim:await claimOnly(env,claimId) }`

---

## Consistency After This Patch

All public content-attachment routes now verify claim existence before INSERT:

| Route | Claim existence check | Added by |
|---|---|---|
| `addEvidence` | `SELECT id FROM claims WHERE id=? LIMIT 1` | **D-175B P2** |
| `addPressure` | `SELECT id FROM claims WHERE id=? LIMIT 1` | **D-175B P3** |
| `addHomeTest` | `SELECT id FROM claims WHERE id=?` | Pre-existing |
| `addAnalysisResult` | `SELECT id FROM claims WHERE id=?` | Pre-existing |
| `attachEvidenceToClaim` | Both evidence and claim verified | Pre-existing |

---

## D-175A Findings Addressed

| Finding | Status |
|---|---|
| F1 — `/api/session` no rate limit | Patched (P1) |
| F2 — `addEvidence` no claim existence check | Patched (P2) |
| F3 — `addPressure` no claim existence check | Patched (P3) |

---

## What Did Not Change

- No schema change. No migration.
- No `wrangler.toml` changes.
- No owner-token work resumed. D-149H hold remains in effect.
- No admin/review route semantics changed. All `/api/review/*` routes remain `requireAdmin()`-gated.
- No shadow-ban enforcement changed — `requireUser()` on `addEvidence` and `addPressure` is identical.
- No scoring or review-state semantics changed.
- Session response shape is unchanged: `{ user, owner_token }`.
- Rate limits on all other routes are unchanged.
- Frontend (`public/app-v10.js`) is unchanged.

---

## Tests

**14 new D-175B smoke tests** added to `scripts/hardening-smoke-test.mjs`:

| Test | What it proves |
|---|---|
| `/api/session` applies safeRateLimit before readJson | `safeRateLimit` call precedes `readJson` in `createOrGetUser` |
| Session rate-limit key is IP-scoped | Key contains `session:${ip(request)}` |
| Session rate-limit is 30/hr/IP | Limit value is `30, 3600000` |
| Session response does not expose IP or fingerprint | SELECT omits `fingerprint_hash`; return is `json({ user, owner_token })` only |
| `addEvidence` validates claimId existence before insertEvidence | `SELECT id FROM claims` precedes `insertEvidence` in function |
| Invalid evidence claimId rejected with CLAIM_NOT_FOUND | `CLAIM_NOT_FOUND` present in `addEvidence` |
| Valid evidence still inserts review-first | `insertEvidence` call still present; no `review_state='public'` |
| `addPressure` validates claimId existence before INSERT | `SELECT id FROM claims` precedes `INSERT INTO pressure_points` |
| Invalid pressure claimId rejected with CLAIM_NOT_FOUND | `CLAIM_NOT_FOUND` present in `addPressure` |
| Valid pressure still inserts review-first | INSERT still present; `'review'` hardcoded |
| No orphan evidence insert path before claim validation | `evidenceClaimRow` appears between `addEvidence` start and `insertEvidence(env,claimId` |
| No orphan pressure insert path before claim validation | `pressureClaimRow` appears between `addPressure` start and `INSERT INTO pressure_points` |
| Review routes remain requireAdmin-gated | `requireAdmin` call still present |
| No owner-token work resumed | D-149H hold confirmed |

**New baseline: 1322/24/57**
- `scripts/hardening-smoke-test.mjs`: **1322** (was 1308, +14)
- `scripts/belief-engine-static-check.mjs`: **24** (unchanged)
- `scripts/worker-route-static-check.mjs`: **57** (unchanged)

---

## No Owner-Token Work Resumed

D-149H hold is in effect. No owner-token enforcement added or changed.

## No Schema / Migration

Backend-only changes to three existing functions. No new columns, no new tables, no index changes, no migration files.

## No Admin / Review Route Semantics Changed

`/api/review/*` routes are untouched. `requireAdmin()` gate is unchanged.

---

## Recommended Next Step

D-175C — Bump deploy metadata for D-175B. Or D-175D live verification preflight.
