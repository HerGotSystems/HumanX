# D-174B — Home Test Raw-Row Response Patch

**Date:** 2026-06-25
**Commit:** (set after commit)
**Entering baseline:** 1300/24/57
**Exiting baseline:** 1308/24/57
**Files changed:** `src/worker.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`

---

## What Changed

### `addHomeTest()` — `src/worker.js`

`addHomeTest()` previously returned the raw result of `SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?` directly as `test: row` in the response. This is the only route in the backend that returned a raw `SELECT *` row to an own-user caller without an explicit allowlist mapper.

**Before:**
```js
const row = await env.DB.prepare(`SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(testId).first();
return json({ ok:true, test:row, claim:await claimOnly(env,claimId) });
```

**After:**
```js
const row = await env.DB.prepare(`SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(testId).first();
return json({ ok:true, test:mapHomeTest(row), claim:await claimOnly(env,claimId) });
```

### New `mapHomeTest()` mapper — `src/worker.js`

Added adjacent to the existing `mapClaim()` / `mapClaims()` helpers:

```js
function mapHomeTest(t) {
  if (!t) return null;
  return {
    id: t.id,
    claimId: t.claim_id,
    title: t.title,
    instructions: t.instructions,
    safetyLevel: t.safety_level,
    difficulty: t.difficulty,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    handle: t.handle || 'anon',
  };
}
```

---

## Why Raw `test: row` Was Replaced

D-174A (global raw-row audit, finding F1) identified this as the only own-user write route not covered by an explicit mapper. Current risk is low — `home_tests` has no moderation or admin columns. The structural risk is that any future column added to `home_tests` (e.g. a review_state, report_count, or admin flag) would be silently exposed to the submitting user without any code change required.

All other own-user write routes (`addEvidence`, `addPressure`, `createClaim`, `voteClaim`, `createTruth`, `convertTruthToClaim`, `attachEvidenceToClaim`, `addAnalysisResult`, `saveBeliefSnapshot`) already use explicit mappers. This patch makes `addHomeTest()` consistent.

---

## Fields Preserved

| Response field | Source column | Notes |
|---|---|---|
| `id` | `home_tests.id` | Test ID |
| `claimId` | `home_tests.claim_id` | CamelCase, consistent with other claim references |
| `title` | `home_tests.title` | Test title |
| `instructions` | `home_tests.instructions` | Full instructions text |
| `safetyLevel` | `home_tests.safety_level` | Camelcase |
| `difficulty` | `home_tests.difficulty` | |
| `createdAt` | `home_tests.created_at` | Camelcase |
| `updatedAt` | `home_tests.updated_at` | Camelcase |
| `handle` | `users.handle` (joined) | Display handle, defaults to `'anon'` |

The frontend (`app-v10.js`) does not use the `test` field from the POST response — it discards the response and calls `selectClaim(selected.id)` to reload the claim detail. No frontend impact.

---

## Fields Excluded

| Field | Reason |
|---|---|
| `user_id` | Caller is the owner — redundant. Consistent with all other own-user mappers omitting `user_id`. |
| Any future column | `mapHomeTest()` is an explicit allowlist — new columns are excluded by default until deliberately added. |

---

## What Did Not Change

- No schema change. No migration.
- No `wrangler.toml` changes.
- No owner-token work resumed. D-149H hold remains in effect.
- No admin/review route semantics changed. All `/api/review/*` routes remain `requireAdmin()`-gated and untouched.
- No public claim/evidence/truth routes changed.
- No shadow-ban enforcement changed.
- Test creation behavior is identical — the INSERT, rate limit, and claim recalc are unchanged.
- The `claim` field in the response (returned by `claimOnly()` → `mapClaim()`) is unchanged.

---

## Tests

**8 new D-174B smoke tests** added to `scripts/hardening-smoke-test.mjs`:

| Test | What it proves |
|---|---|
| mapHomeTest mapper exists | `function mapHomeTest(` present in worker |
| addHomeTest uses mapHomeTest | `test:mapHomeTest(row)` present; `test:row` absent |
| mapHomeTest omits user_id | `user_id` absent from mapHomeTest body |
| mapHomeTest omits email/is_admin/is_shadow_banned | Sensitive user fields absent from mapper |
| mapHomeTest preserves product fields | id, title, instructions, safety_level, difficulty, createdAt, handle all present |
| Public routes do not expose admin/owner tokens | requireAdmin enforced in worker |
| Review routes remain requireAdmin-gated | /api/review/decision, /api/review/cleanup, /api/review/mark-duplicate all present |
| No owner-token work resumed | D-149H hold confirmed |

**New baseline: 1308/24/57**
- hardening-smoke-test.mjs: **1308** (was 1300, +8)
- belief-engine-static-check.mjs: **24** (unchanged)
- worker-route-static-check.mjs: **57** (unchanged)

---

## No Owner-Token Work Resumed

D-149H hold is in effect. No owner-token enforcement added or changed.

## No Schema/Migration

Backend-only change to response shape. No new columns, no new tables, no index changes, no migration files.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched. `requireAdmin()` gate is unchanged.

---

## Recommended Next Step

D-174C — Bump deploy metadata for D-174B. Or begin the next audit/patch cycle.
