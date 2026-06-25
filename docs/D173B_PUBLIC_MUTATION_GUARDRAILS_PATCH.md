# D-173B — Public Mutation Guardrails Patch

**Date:** 2026-06-25
**Commit:** (set after commit)
**Entering baseline:** 1285/24/57
**Exiting baseline:** 1300/24/57
**Files changed:** `src/worker.js`, `src/truths.js`, `src/truth-claim-bridge.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`

---

## What Changed

Four backend-only patches addressing all D-173A findings. No schema changes. No migration. No frontend changes. No admin/review route semantics changed.

### P1 — `reportTarget()` target type allowlist (F1)

**File:** `src/worker.js`

Added an explicit allowlist `ALLOWED_REPORT_TYPES = new Set(['claim', 'evidence', 'pressure', 'truth'])` checked before any DB write. Unsupported types return `{ error: 'BAD_TARGET_TYPE', allowed: [...ALLOWED_REPORT_TYPES] }` with HTTP 400. Valid types are unchanged: `claim`, `evidence`, `pressure`, `truth`.

Previously any string passed through `cleanText(body.targetType || 'claim', 30)` was accepted and inserted into `reports.target_type`, creating spurious rows. No content state was affected since the downstream `if (targetType === 'claim')` blocks only fired for known types, but the rows themselves were noise and could complicate reporting queries.

### P2 — `reportTarget()` per-user per-target dedupe (F2)

**File:** `src/worker.js`

Added a soft pre-query after `ensureUser()`:

```js
const dupReport = await env.DB.prepare(
  `SELECT id FROM reports WHERE target_id=? AND reporter_id=? AND status='open' LIMIT 1`
).bind(targetId, userId).first();
if (dupReport) return json({ ok: true, duplicate: true });
```

If the same user already has an open report against the same target, the function returns `{ ok: true, duplicate: true }` immediately — no INSERT, no `report_count` increment, no `review_state` trigger. First-time reports are unaffected; the review trigger threshold (5 distinct open reports) is preserved for genuine distinct reporters.

No schema change. Dedupe is code-level using the existing `reports` table.

### P3 — `createTruth()` `linkedClaimId` validation (F3)

**File:** `src/truths.js`

If `linkedClaimId` is supplied in the request body, it is now validated before the INSERT:

1. The claim must exist in the `claims` table (→ `LINKED_CLAIM_NOT_FOUND` 400 if not).
2. The claim must not be in a terminal state (`archived`, `rejected`, `duplicate`) (→ `LINKED_CLAIM_NOT_ELIGIBLE` 400 if so).

Valid states (`public`, `review`, `null`) are accepted — a truth entering review can legitimately link to a claim still in review.

When no `linkedClaimId` is provided, `validLinkedClaimId` is `null` and behavior is unchanged.

Previously the raw `cleanId(body.linkedClaimId ...)` was passed directly to the INSERT, allowing links to non-existent or rejected/archived claims.

### P4 — `convertTruthToClaim()` response sanitization (F4)

**File:** `src/truth-claim-bridge.js`

Added a local `mapClaim()` function matching the worker's public claim shape. All four claim return paths now pass the raw DB row through `mapClaim()`:

| Path | Before | After |
|---|---|---|
| Existing public claim | `claim: existing` (raw `SELECT *`) | `claim: mapClaim(existing)` |
| Non-public existing claim | `claim: nonPublic` (raw `SELECT *`) | `claim: mapClaim(nonPublic)` |
| Raced claim | `claim: raced` (raw `SELECT *`) | `claim: mapClaim(raced)` |
| New claim | `claim` shorthand (raw `SELECT *`) | `claim: mapClaim(claim)` |

Fields omitted by `mapClaim()` (never returned):
- `normalized_claim`
- `status_locked` (raw DB field — exposed as camelCase boolean `statusLocked`)
- `damage`
- `user_id`
- `archived_by_user`
- `near_duplicate_of` / `duplicate_of` (exposed as `nearDuplicateOf` / `duplicateOf`)
- Any other raw internal column

Fields returned by `mapClaim()`: `id`, `claim`, `category`, `type`, `status`, `evidenceScore`, `survivability`, `testability`, `contradictions`, `reportCount`, `reviewState`, `beliefYes`, `beliefNo`, `uncertainty`, `createdAt`, `updatedAt`, `handle`, `nearDuplicateOf`, `duplicateOf`, `statusLocked`.

---

## What Did Not Change

- No schema changes. No migration.
- No `wrangler.toml` changes.
- No owner-token work resumed. D-149H hold remains in effect.
- No admin/review route semantics changed (`/api/review/*` routes remain `requireAdmin`-gated and are untouched).
- All public content insertions remain `review_state='review'` (review-first). This patch does not change that.
- Shadow-ban enforcement via `requireUser()` is preserved on all write routes.
- Review trigger threshold (5 distinct open reports) is preserved for distinct reporters.
- `exportMyHumanX()` (`SELECT *`) remains accepted per D-138B (private endpoint, user owns the data).
- `promoteBeliefSnapshot()` → `promoteToClaim()` in `belief-bridge.js` already uses its own `mapClaim()` — no change needed there.

---

## Tests

**15 new D-173B smoke tests** added to `scripts/hardening-smoke-test.mjs`:

| Test | What it proves |
|---|---|
| reportTarget allowlist exists | `ALLOWED_REPORT_TYPES` set is present in worker |
| Invalid report target rejected | `BAD_TARGET_TYPE` error + allowlist check present |
| Report dedupe exists | dedupe query + `dupReport` variable present |
| Duplicate returns early | early return before INSERT confirmed |
| Valid first report still INSERTs | INSERT INTO reports path still exists |
| createTruth validates linkedClaimId | `rawLinkedClaimId` extraction + DB check present |
| Invalid linkedClaimId rejected | `LINKED_CLAIM_NOT_FOUND` error present |
| Terminal-state linkedClaimId rejected | `LINKED_CLAIM_NOT_ELIGIBLE` + state check present |
| No linkedClaimId path still works | `validLinkedClaimId = null` default + bind param present |
| convertTruthToClaim no raw rows | all raw shorthand claim patterns absent |
| convertTruthToClaim uses mapClaim | all four paths use `mapClaim()` |
| mapClaim omits normalized_claim | confirmed absent from mapClaim body |
| mapClaim omits user_id / damage | confirmed absent from mapClaim body |
| Review routes remain requireAdmin | requireAdmin present, review routes exist |
| No owner-token work resumed | D-149H hold confirmed |

**New baseline: 1300/24/57**
- hardening-smoke-test.mjs: **1300** (was 1285, +15)
- belief-engine-static-check.mjs: **24** (unchanged)
- worker-route-static-check.mjs: **57** (unchanged)

---

## D-173A Findings Addressed

| Finding | Description | Patch | Status |
|---|---|---|---|
| F1 | `reportTarget()` accepts any `targetType` string | P1 — allowlist | ✅ Patched |
| F2 | Single user can stack report_count to 5 via repeated reports | P2 — dedupe | ✅ Patched |
| F3 | `createTruth()` accepts `linkedClaimId` without validation | P3 — validate | ✅ Patched |
| F4 | `convertTruthToClaim()` returns raw `SELECT *` claim rows | P4 — mapClaim | ✅ Patched |

---

## No Owner-Token Work Resumed

D-149H hold is in effect. No owner-token enforcement added, no soft warnings added, no owner-token detection or telemetry changed.

## No Schema/Migration

All patches are code-level only. No new columns, no new tables, no index changes, no migration files.

## No Admin/Review Route Semantics Changed

`/api/review/decision`, `/api/review/cleanup`, `/api/review/mark-duplicate`, `/api/review/resolve-similar` are untouched. `requireAdmin()` gate is unchanged.

---

## Recommended Next Step

D-173C — Bump deploy metadata for D-173B. Update `src/deploy-meta.js` checkpoint, commit hash, and baseline.
