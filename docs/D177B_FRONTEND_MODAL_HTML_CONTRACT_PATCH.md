# D-177B — Frontend Modal HTML Safety Contract

**Date:** 2026-06-25
**Commit:** (set after commit)
**Entering baseline:** 1335/24/57
**Exiting baseline:** 1344/24/57
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`

---

## D-177A Finding Addressed

**F1 — `hxModal` body parameter is raw HTML (Low / Acceptable)**

`hxModal` inserts its `body` parameter as `${body||''}` without escaping — body is expected to be pre-built HTML. Both callers (`markDuplicateUI`, `resolveSimilarUI`) correctly escape user-controlled values before constructing body strings, but the contract was implicit. A future caller that forgot to escape would create an XSS vector with no signal at the call site.

---

## What Changed

### Comment — `public/app-v10.js` (line 47, before `hxModal` definition)

Added one comment line immediately before the `hxModal` function making the raw-HTML contract explicit:

```js
// hxModal: `body` is raw HTML — callers must escape all user-controlled values with esc() before building the body string. Do not pass untrusted raw text directly.
function hxModal({title,body,confirmLabel='Submit',...
```

No behavior change. No modal logic changed. No callers changed.

---

## Why Comment-Only

Both current callers already satisfy the contract:

| Caller | Line | How user-controlled value is handled |
|---|---|---|
| `markDuplicateUI` | 346 | `esc(label)` — claim body truncated to 48 chars, then escaped |
| `resolveSimilarUI` | 347 | `esc(nearDup)` — server-generated claim ID, escaped |

The contract only needed to be made visible — no bug to fix, no caller to change, no library to add.

---

## F2 — Left Informational, No Action

**F2 — `onclick` pattern with `esc()` on server IDs** was classified informational in D-177A because all values inserted into `onclick="f('${esc(id)}')"` patterns are server-generated alphanumeric IDs that never contain single quotes. No test or patch added.

---

## Tests

**9 new D-177B smoke tests** added to `scripts/hardening-smoke-test.mjs`:

| Test | What it proves |
|---|---|
| `hxModal` has explicit raw-HTML safety contract comment | Comment present before `hxModal`; references `esc()` requirement |
| `markDuplicateUI` caller escapes label before body | `esc(label)` present within the `hxModal` call in `markDuplicateUI` |
| `resolveSimilarUI` caller escapes nearDup before body | `esc(nearDup)` present within the `hxModal` call in `resolveSimilarUI` |
| No unescaped raw user text passed directly to `hxModal` body | No `hxModal` body template embeds raw item fields without `esc()` |
| `toast()` still uses `textContent` (not `innerHTML`) | `textContent` present; `innerHTML` absent from `toast` function body |
| URL rendering goes through `safeHttpUrl` / `sourceLink` | Both helpers defined and used |
| No frontend console logging | `console.` absent from `app-v10.js` |
| Admin token input remains `type="password"` | `type="password"` present in frontend |
| No owner-token work resumed | D-149H hold confirmed |

**New baseline: 1344/24/57**
- `scripts/hardening-smoke-test.mjs`: **1344** (was 1335, +9)
- `scripts/belief-engine-static-check.mjs`: **24** (unchanged)
- `scripts/worker-route-static-check.mjs`: **57** (unchanged)

---

## What Did Not Change

- No modal behavior changed.
- No caller logic changed.
- No frontend rendering semantics changed.
- No libraries added.
- No backend source files touched (`src/worker.js`, `src/truth-claim-bridge.js`, `src/truths.js` unchanged).
- No schema change. No migration.
- No `wrangler.toml` changes.
- No admin/review route semantics changed.
- No owner-token work resumed. D-149H hold remains in effect.

---

## No Owner-Token Work Resumed

D-149H hold is in effect. No owner-token enforcement added or changed.

## No Schema / Migration

No new columns, tables, index changes, or migration files.

## No Admin / Review Route Semantics Changed

`/api/review/*` routes are untouched. `requireAdmin()` gate is unchanged.

---

## Recommended Next Step

D-177C — Bump deploy metadata for D-177B. Or D-177D live verification.
