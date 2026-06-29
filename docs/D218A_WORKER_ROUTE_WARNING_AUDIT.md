# D-218A — Worker Route Warning Audit

**Scope:** Tests/docs + minor checker improvement (no worker changes)
**Status:** COMPLETE
**Baseline:** 2186 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/worker-route-static-check.mjs`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Public profile change:** None
**Deploy needed:** No

---

## Current HEAD and baseline at audit time

- **HEAD:** 5c8dbe2 (start of D-218A)
- **Hardening smoke:** 2177 passed / 0 failed (pre-D-218A)
- **Worker route static:** 57 passed / 0 failed / 1 warn

---

## Exact warning text (pre-D-218A)

```
WARN: /api/u/:slug — parameterised route; expected absence from literal routing block (known limitation)
```

**Source:** `scripts/worker-route-static-check.mjs`, line ~240, in the "Routes in inventory but not in code" cross-reference loop. The condition is `r.includes('/:')`; the checker emits a WARN (not a FAIL) when a documented parameterised route is not found as a literal string in `worker.js`.

---

## Root cause analysis

### How the checker finds routes in worker.js

The checker uses string extraction — it reads `worker.js` as text and pulls out string literals that look like `/api/...` paths. This catches routes written as:

```js
if (url.pathname === '/api/me') ...
if (url.pathname === '/api/truths') ...
```

### How `/api/u/:slug` is actually implemented

The route is implemented using a **regex match**, not a literal string comparison:

```js
// src/worker.js line 57
if (url.pathname.match(/^\/api\/u\/[^/]+$/) && request.method === 'GET')
    return await getPublicProfile(request, env, url.pathname.split('/').pop());
```

The literal string `/api/u/:slug` never appears in `worker.js`. The inventory docs use `:slug` notation; the code uses `[^/]+` regex notation. They refer to the same route but the static checker cannot bridge that gap.

Similarly, `/api/claims/:id` is handled via `url.pathname.match(/^\/api\/claims\/[^/]+$/)`.

---

## Classification: Known false positive / structural limitation of static analysis

| Dimension | Assessment |
|---|---|
| Is the route actually implemented? | **Yes** — `getPublicProfile` is called correctly at runtime |
| Is the warning accurate? | Technically accurate (the literal string is absent) but misleading (the route IS handled) |
| Runtime impact | **None** — the route works correctly |
| Privacy impact | **None** — the warning is about tool precision, not about route security |
| Deploy impact | **None** — non-blocking |
| Real technical debt? | Mild — the checker could be enhanced to parse regex routes, but this has no safety benefit |
| Unsafe? | **No** |

---

## What changed in D-218A

### `scripts/worker-route-static-check.mjs`

Added `KNOWN_PARAM_ROUTES` constant:

```js
const KNOWN_PARAM_ROUTES = new Set([
  '/api/u/:slug',      // GET — url.pathname.match(/^\/api\/u\/[^/]+$/)
  '/api/claims/:id',   // GET — url.pathname.match(/^\/api\/claims\/[^/]+$/)
]);
```

Updated the warning message to distinguish **known** from **new unknown** parameterised routes:

- If route is in `KNOWN_PARAM_ROUTES`:
  ```
  WARN: /api/u/:slug — known parameterised route; implemented via regex in worker.js,
        not as a literal string (D-218A documented limitation)
  ```
- If route is NOT in `KNOWN_PARAM_ROUTES`:
  ```
  WARN: /api/u/something — NEW parameterised route not in KNOWN_PARAM_ROUTES;
        add to set after confirming regex implementation in worker.js
  ```

This means future new parameterised routes will emit a distinctly different, higher-urgency warning that cannot be mistaken for the pre-existing known one. The pass count, fail count, and warn count are unchanged (57 / 0 / 1).

### `src/worker.js`

**Unchanged.** The route itself is correct. No worker changes needed.

---

## Future rule: new warnings must not hide behind this known warning

Any future parameterised route added to `docs/API_ENDPOINT_INVENTORY.md` that is NOT in `KNOWN_PARAM_ROUTES` will now emit a "NEW parameterised route" warning distinguishable from this known one.

Steps for adding a new parameterised route:
1. Implement the route in `worker.js` using `url.pathname.match(...)` (the existing pattern)
2. Document it in `docs/API_ENDPOINT_INVENTORY.md` with `:param` notation
3. Add it to `KNOWN_PARAM_ROUTES` in `worker-route-static-check.mjs` with a comment noting the regex pattern
4. The warning count stays at 1 (known); it does not increase

---

## D-218A smoke tests added (9 tests)

- `KNOWN_PARAM_ROUTES` defined in checker
- `/api/u/:slug` in `KNOWN_PARAM_ROUTES`
- `/api/claims/:id` in `KNOWN_PARAM_ROUTES`
- Checker distinguishes known from NEW unknown parameterised routes
- D-218A referenced in checker
- README references D218A doc
- D-218A absent from `app-v10.js`
- D-218A absent from `worker.js`
- D-217A smoke index still present

---

## No D-218B fix needed

The warning is fully understood and documented. The checker improvement in D-218A is sufficient. There is no runtime bug to fix. No separate follow-up slice is recommended.

---

## Confirmations

- **Deploy needed:** No
- **App UI unchanged:** Confirmed
- **CSS unchanged:** Confirmed
- **Worker (`src/worker.js`) unchanged:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **Warning classification:** Known false positive — static analysis limitation
- **Runtime impact:** None
- **Privacy impact:** None
- **Future protection:** New unknown parameterised routes now emit a distinct "NEW" warning
