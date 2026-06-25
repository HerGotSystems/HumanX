# D-176B — Error Response Hygiene Patch

**Date:** 2026-06-25
**Commit:** (set after commit)
**Entering baseline:** 1322/24/57
**Exiting baseline:** 1335/24/57
**Files changed:** `src/worker.js`, `src/truth-claim-bridge.js`, `src/truths.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`

---

## What Changed

### P1 — Global catch 500 no longer returns raw `err.message` (`src/worker.js`)

**D-176A F1:** The global catch handler returned `{ error:'SERVER_ERROR', message }` where `message` was `String(err.message)` — which for D1/SQLite errors can contain constraint names, table names, or other schema details visible to any public caller.

**Before:**
```js
return json({ error: 'SERVER_ERROR', message }, 500);
```

**After:**
```js
return json({ error: 'INTERNAL_ERROR', message: 'Unexpected server error.' }, 500);
```

- Error code changed from `SERVER_ERROR` to `INTERNAL_ERROR` (more precise; `SERVER_ERROR` was also used as a prefix in thrown Error messages, creating ambiguity)
- `message` field is now a fixed safe string — no raw exception text
- All deliberate validation/auth/rate-limit errors that use the catch block as a sentinel-routing path (`MISSING_PSEUDONYMOUS_USER`, `USER_SHADOW_BANNED`, `RATE_LIMITED`, `RATE_LIMIT_UNAVAILABLE`) are unchanged — they match before the 500 fallback

### P2 — `TRUTH_LINK_FAILED` no longer returns raw `linkErr.message` (`src/truth-claim-bridge.js`)

**D-176A F2:** The `convertTruthToClaim` link step explicitly embedded `String(linkErr.message)` in a 500 response body.

**Before:**
```js
return json({ error: 'TRUTH_LINK_FAILED', message: String(linkErr && linkErr.message ? linkErr.message : linkErr) }, 500);
```

**After:**
```js
return json({ error: 'TRUTH_LINK_FAILED', message: 'Truth claim link failed.' }, 500);
```

- Machine-readable error code `TRUTH_LINK_FAILED` is preserved
- `message` is now a fixed safe string
- Rollback behavior (`DELETE FROM claims WHERE id=?`) is unchanged

### P3 — Builder context failure no longer embeds raw `cbcErr.message` (`src/truths.js`)

**D-176A F3:** On a builder context INSERT failure, `createTruth` threw `new Error(\`SERVER_ERROR: builder context insert failed — ${String(cbcErr?.message || cbcErr)}\`)`, embedding the raw D1 error in the thrown Error's message string, which then surfaced via the global catch `message` field (F1 compounding F3).

**Before:**
```js
throw new Error(`SERVER_ERROR: builder context insert failed — ${String(cbcErr?.message || cbcErr)}`);
```

**After:**
```js
throw new Error('SERVER_ERROR: builder context insert failed');
```

- The thrown message is still caught by the global catch as an unexpected error → now returns `INTERNAL_ERROR` / `'Unexpected server error.'` (P1 applies)
- No raw `cbcErr` content escapes to the caller

### P4 — `safeAll` lineage errors no longer carry raw SQL error text (`src/worker.js`)

**D-176A F4:** `safeAll()` returned `{ results:[], error: \`${label}: ${String(err.message)}\` }` — with raw D1/SQLite error text in the error string, which was surfaced in the public `GET /api/claims/:id` `lineage.errors` array when a DB error occurred.

**Before:**
```js
async function safeAll(env, label, sql, ...args) { try { return await env.DB.prepare(sql).bind(...args).all(); } catch (err) { return { results: [], error: `${label}: ${String(err && err.message ? err.message : err)}` }; } }
```

**After:**
```js
async function safeAll(env, label, sql, ...args) { try { return await env.DB.prepare(sql).bind(...args).all(); } catch (_err) { return { results: [], error: label }; } }
```

- `label` is a known safe internal name (e.g. `truth_claim_links`, `truths.linked_claim_id`) — no user-controlled content, no SQL error text
- `lineage.errors` in the public claim response will now contain label strings only, not SQL error fragments
- Lineage behavior is unchanged — a DB error still returns `results:[]` with an error signal; only the error content is sanitized

---

## D-176A Findings Addressed

| Finding | Status |
|---|---|
| F1 — Global catch 500 returns raw `err.message` | Patched (P1) |
| F2 — `TRUTH_LINK_FAILED` returns raw `linkErr.message` | Patched (P2) |
| F3 — Builder context error embeds raw `cbcErr.message` | Patched (P3) |
| F4 — `safeAll` lineage errors carry raw SQL text | Patched (P4 — included, small and safe) |

---

## Public 500 Behavior — Before / After

| Scenario | Before | After |
|---|---|---|
| Unexpected DB error on any public route | `{ error:'SERVER_ERROR', message:'D1_ERROR: SQLITE_CONSTRAINT: ...' }` 500 | `{ error:'INTERNAL_ERROR', message:'Unexpected server error.' }` 500 |
| `TRUTH_LINK_FAILED` (link step after claim creation) | `{ error:'TRUTH_LINK_FAILED', message:'D1_ERROR: ...' }` 500 | `{ error:'TRUTH_LINK_FAILED', message:'Truth claim link failed.' }` 500 |
| Builder context INSERT failure in `createTruth` | `{ error:'SERVER_ERROR', message:'SERVER_ERROR: builder context insert failed — D1_ERROR: ...' }` 500 | `{ error:'INTERNAL_ERROR', message:'Unexpected server error.' }` 500 |
| Auth error, rate-limit, validation 400/403/404/429 | Unchanged — caught before 500 fallback | Unchanged |

---

## What Did Not Change

- No schema change. No migration.
- No `wrangler.toml` changes.
- No owner-token work resumed. D-149H hold remains in effect.
- No admin/review route semantics changed. All `/api/review/*` routes remain `requireAdmin()`-gated.
- No 400/403/404/429 error codes or messages changed.
- All machine-readable validation error codes (`CLAIM_NOT_FOUND`, `BAD_TARGET_TYPE`, `RATE_LIMITED`, `UNAUTHORIZED`, `TRUTH_LINK_FAILED`, etc.) are preserved.
- `TRUTH_LINK_FAILED` status code (500) and machine-readable error code are preserved — only the raw message is replaced.
- `lineage.errors` structure is preserved — only raw SQL text stripped from error values.
- Frontend (`public/app-v10.js`) is unchanged.

---

## Tests

**13 new D-176B smoke tests** added to `scripts/hardening-smoke-test.mjs`:

| Test | What it proves |
|---|---|
| Global catch 500 does not return raw `err.message` | Raw `message` variable absent from catch 500 return |
| Global catch 500 returns `INTERNAL_ERROR` with generic message | `INTERNAL_ERROR` code and `'Unexpected server error.'` present |
| Global catch does not expose SQL or stack text | No `SQLITE` or `.stack` reference in catch 500 response |
| Deliberate validation errors remain machine-readable | `CLAIM_NOT_FOUND`, `BAD_TARGET_TYPE`, `RATE_LIMITED`, `UNAUTHORIZED` all still present |
| `TRUTH_LINK_FAILED` does not return raw `linkErr.message` | `linkErr.message` absent from truth-claim-bridge.js |
| `TRUTH_LINK_FAILED` preserves machine-readable code | `TRUTH_LINK_FAILED` code and safe generic message present |
| Builder context failure does not embed raw `cbcErr.message` | `cbcErr.message` absent from truths.js; fixed message present |
| `safeAll` lineage errors do not expose raw SQL text | `safeAll` returns `{ results:[], error:label }` — no `err.message` |
| Rate-limit errors remain safe | Safe message present; IP value not returned in error |
| Review routes remain `requireAdmin`-gated | `requireAdmin` and `reviewDecision` both still present |
| No frontend console logging | No `console.` in `app-v10.js` |
| Admin token input remains `type="password"` | `type="password"` present in frontend |
| No owner-token work resumed | D-149H hold confirmed |

**New baseline: 1335/24/57**
- `scripts/hardening-smoke-test.mjs`: **1335** (was 1322, +13)
- `scripts/belief-engine-static-check.mjs`: **24** (unchanged)
- `scripts/worker-route-static-check.mjs`: **57** (unchanged)

---

## No Owner-Token Work Resumed

D-149H hold is in effect. No owner-token enforcement added or changed.

## No Schema / Migration

Backend-only changes to three source files. No new columns, tables, index changes, or migration files.

## No Admin / Review Route Semantics Changed

`/api/review/*` routes are untouched. `requireAdmin()` gate is unchanged. Admin-visible error details (cleanup state, junk heuristic feedback) are unaffected — those routes are not in scope.

---

## Recommended Next Step

D-176C — Bump deploy metadata for D-176B. Or D-176D live verification preflight.
