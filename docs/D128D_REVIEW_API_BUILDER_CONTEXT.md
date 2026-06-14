# D-128D Review API Builder Context Read Path

**Date:** 2026-06-14
**Branch:** `fix/d128d-review-api-builder-context-read-path`
**Basis:** D-128C Worker write path merged (PR #187, merge `c0926f3`).

---

## Scope

Review/admin API read path only. No frontend payload change. No Review UI change. No public endpoint change. No D1 schema change. No deploy.

---

## Files Changed

| File | Change |
|---|---|
| `src/claim-builder-contexts.js` | Added `safeJsonArray()`, `mapClaimBuilderContext()`, `attachClaimBuilderContexts()` |
| `src/worker.js` | Updated import; `reviewQueue()` calls `attachClaimBuilderContexts()` before assembling `review` |
| `docs/D128D_REVIEW_API_BUILDER_CONTEXT.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: `src/truths.js`, `public/app-v10.js`, `public/styles.css`, migrations, any public endpoint.

---

## New Helpers in `src/claim-builder-contexts.js`

### `safeJsonArray(raw)`

Parses a JSON string and returns an array. Returns `[]` on any error (null input, parse failure, non-array result). Used to deserialise `system_flags_json` safely.

### `mapClaimBuilderContext(row)`

Maps a raw `claim_builder_contexts` DB row to the camelCase Review shape:

```js
{
  id, targetType, targetId, route, version,
  rawText, whyUserThinksThis, scope, pressureOrFalsifier,
  draftClaim, finalClaim, category, claimType,
  systemFlags,   // array, parsed via safeJsonArray()
  createdAt, updatedAt
}
```

Returns `null` for a null row.

### `attachClaimBuilderContexts(env, claimRows, truthRows)`

Attaches `claimBuilderContext` to claim and truth review rows in-place. Uses one point-lookup per row (`SELECT ... LIMIT 1 ORDER BY created_at DESC`) — safe because the review queue is capped at 100 rows per type, so at most ~200 queries per `reviewQueue()` call.

- For repeated truths with multiple context rows, the **most recent** row is used (`created_at DESC`).
- Per-row lookup failures are silently swallowed — the field is simply absent on that row.
- Outer failures (e.g. table missing) are also swallowed — the rest of the Review queue is unaffected.
- Evidence and pressure rows are not touched.

---

## `reviewQueue()` Change

Single call added after `claimRows` and `truthRows` are populated and before the combined `review` array is assembled:

```js
await attachClaimBuilderContexts(env, claimRows, truthRows);
```

The rest of `reviewQueue()` — evidence, pressure, archived metadata, sorting, limit — is unchanged. The response shape gains only optional `claimBuilderContext` on qualifying claim/truth items.

---

## Public Boundary

`attachClaimBuilderContexts()` is called only from `reviewQueue()`, which is guarded by `requireAdmin()`. No public endpoint (`/api/claims`, `/api/truths`, `/api/evidence-vault`, etc.) is affected.

---

## D-127D Legacy Parser Fallback

The `parseClaimBuilderContext()` function in `public/app-v10.js` is untouched. The Review UI currently uses it to parse `initialEvidence` plain-text. That path remains fully functional for:
- Items submitted before D-128C (no structured row exists)
- Any row where `claimBuilderContext` is absent on the API response

D-128F will update the Review UI to prefer `item.claimBuilderContext` over the plain-text parse.

---

## What Is NOT Done Yet

| Item | Task |
|---|---|
| Frontend sends `claim_builder` field | D-128E |
| Review UI prefers structured data over plain-text parse | D-128F |
| Deploy | Pending owner authorisation |

---

## Checks

```
node --check src/worker.js                    →  syntax OK (exit 0)
node --check src/claim-builder-contexts.js    →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```

---

## Deploy Note

**Deploy required** (worker code changed). No D1 schema change. Standard `wrangler deploy` after PR merges.

---

## Recommended Next Tasks

- **D-128E** — Frontend structured payload: `submitBuilderClaim()` and `submitBuilderTruth()` send `claim_builder` JSON field alongside existing `initialEvidence` sentinel.
- **D-128F** — Review UI structured fallback: `reviewBuilderContextHtml()` prefers `item.claimBuilderContext` (structured) over `parseClaimBuilderContext(item.initialEvidence)` (legacy), with a source label indicating which path was used.
