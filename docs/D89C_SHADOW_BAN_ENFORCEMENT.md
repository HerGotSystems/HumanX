# D-89C Shadow Ban Enforcement

**Branch:** `fix/d89c-shadow-ban-enforcement`
**Feature commit:** `6f451d7`
**PR:** #106
**Merge commit:** `5fedf8d`
**Merged to:** `main`
**Date:** 2026-06-07

---

## Problem

`users.is_shadow_banned` (INTEGER DEFAULT 0) has existed in the DB schema since `migrations/0003_full_schema.sql`, but was never enforced. Shadow-banned users could write claims, evidence, pressure points, truths, votes, and belief snapshots without restriction.

---

## What Changed

### `src/worker.js`

**`requireUser` made async with DB ban check:**

```js
async function requireUser(request, env) {
  const userId = requireUserId(request);
  if (env?.DB) {
    const row = await env.DB.prepare(
      `SELECT is_shadow_banned FROM users WHERE id=?`
    ).bind(userId).first();
    if (Number(row?.is_shadow_banned||0) === 1) throw new Error('USER_SHADOW_BANNED');
  }
  return userId;
}
```

Note: D-89D strengthened the truthiness check from `if (row?.is_shadow_banned)` to `if (Number(row?.is_shadow_banned||0)===1)` for explicit numeric comparison.

**`env?.DB` guard** — if `env` is undefined (fallback/test contexts), the DB lookup is skipped. Header check still runs.

**`USER_SHADOW_BANNED` catch block added** (top-level error handler):

```js
if (message.includes('USER_SHADOW_BANNED'))
  return json({ error: 'UNAUTHORIZED', message: 'Action not permitted.' }, 403);
```

Shadow-banned writes return HTTP 403 `{ error: 'UNAUTHORIZED', message: 'Action not permitted.' }` — indistinguishable from a general auth failure. The user is not told they are shadow-banned.

**Module dispatch pattern** — external modules receive `requireUser` as a helper but do not have direct access to `env`. Each module dispatch wraps it:

```js
requireUser: async (req) => requireUser(req, env)
```

**Five inline write routes updated** to `await requireUser(request, env)`:

- `createClaim`
- `addEvidence`
- `addPressure`
- `addHomeTest`
- `reportTarget`

### External modules

All call sites changed from `requireUser(request)` (sync) to `await requireUser(request)` (async):

| File | Call site |
|------|-----------|
| `src/votes.js` | `const userId = await requireUser(request);` |
| `src/truths.js` | `const userId = await requireUser(request);` (line 24) |
| `src/truth-claim-bridge.js` | `const userId = await requireUser(request);` (line 5) |
| `src/evidence-reuse.js` | `const userId = await requireUser(request);` (line 5) |
| `src/analysis-results.js` | `const userId = await requireUser(request);` (line 3) |
| `src/belief-snapshots.js` | Both call sites — `await requireUser(request);` (replace_all) |
| `src/belief-bridge.js` | `const userId = await requireUser(request);` (line 5) |

---

## Write Routes Covered (shadow-ban enforced)

All user write routes now enforce the ban:

| Route | Handler |
|-------|---------|
| `POST /api/claims` | `createClaim` |
| `POST /api/evidence` | `addEvidence` |
| `POST /api/pressure` | `addPressure` |
| `POST /api/home-tests` | `addHomeTest` |
| `POST /api/reports` | `reportTarget` |
| `POST /api/votes/*` | `src/votes.js` |
| `POST /api/truths` | `src/truths.js` |
| `POST /api/truth-claim-bridge` | `src/truth-claim-bridge.js` |
| `POST /api/evidence-reuse` | `src/evidence-reuse.js` |
| `POST /api/analysis-results` | `src/analysis-results.js` |
| `POST /api/belief-snapshots` | `src/belief-snapshots.js` (saveBeliefSnapshot) |
| `POST /api/belief-promote` | `src/belief-snapshots.js` (promoteBeliefSnapshot) |
| `POST /api/belief-bridge` | `src/belief-bridge.js` |

---

## Routes Intentionally Not Blocked

| Route | Reason |
|-------|--------|
| `GET /api/belief-snapshots` | Read-only — shadow-banned users should still be able to read their own existing private snapshots. Fixed in D-89D: uses `requireUserId` (identity-only, no ban check). |
| All `GET` read routes | Reads are not writes; no public-content creation risk. |
| Admin routes (`x-humanx-admin`) | Admin auth path is separate; admin is never shadow-banned. |

---

## D-89D Correction

After D-89C merged, it was discovered that `GET /api/belief-snapshots` had been given the env-bound async `requireUser` helper (same as the write routes), which blocked shadow-banned users from reading their own private snapshots.

**Fix (D-89D):** A new sync helper `requireUserId` was introduced:

```js
function requireUserId(request) {
  const userId = cleanId(request.headers.get('x-humanx-user') || '');
  if (!userId) throw new Error('MISSING_PSEUDONYMOUS_USER');
  return userId;
}
```

`requireUser` was refactored to delegate header extraction to `requireUserId`:

```js
async function requireUser(request, env) {
  const userId = requireUserId(request);
  if (env?.DB) { ... ban check ... }
  return userId;
}
```

The GET belief-snapshots route now passes `requireUserId` directly:

```js
// GET — identity-only (no ban check)
if (url.pathname === '/api/belief-snapshots' && request.method === 'GET')
  return await listBeliefSnapshots(request, env, { json, requireUser: requireUserId });

// POST — still ban-enforced
if (url.pathname === '/api/belief-snapshots' && request.method === 'POST')
  return await saveBeliefSnapshot(request, env, { ..., requireUser: async (req) => requireUser(req, env), ... });
```

---

## Hardening Smoke Tests

Section 28 (D-89C, 8 tests):
- `requireUser is declared as async function`
- `requireUser queries is_shadow_banned from users table`
- `requireUser throws USER_SHADOW_BANNED when banned`
- `catch block handles USER_SHADOW_BANNED with 403`
- `requireUser guards DB lookup with env?.DB presence check`
- `createClaim uses await requireUser(request, env)`
- `addPressure uses await requireUser(request, env)`
- `module dispatch passes env-bound requireUser to helpers`

Section 29 (D-89D, 6 tests):
- `requireUserId is declared as sync function in worker.js`
- `requireUser delegates header check to requireUserId`
- `GET /api/belief-snapshots passes requireUserId (identity-only, read)`
- `POST /api/belief-snapshots still passes env-bound async requireUser`
- `POST /api/belief-promote still passes env-bound async requireUser`
- `USER_SHADOW_BANNED still maps to 403 after refactor`

Static check baseline after D-89C+D-89D: **161 / 24 / 39**

---

## Safety Notes

- Shadow-banned users receive a generic 403 — not a specific ban message. They cannot detect they are banned from the API response alone.
- The ban check requires a DB round-trip on every write. The `env?.DB` guard ensures this is skipped in unit-test / no-env contexts.
- No new column was added; `is_shadow_banned` has been in the schema since migration 0003. No migration is needed.
- Banning a user requires a direct D1 write: `UPDATE users SET is_shadow_banned=1 WHERE id=?`. This is not exposed as an API route — admin-only D1 operation.
- Read routes are not covered by design. Shadow banning is a write-restriction mechanism, not a visibility-restriction mechanism.
