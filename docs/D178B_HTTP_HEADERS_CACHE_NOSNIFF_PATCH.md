# D-178B — HTTP Cache and Nosniff Headers Patch

**Date:** 2026-06-25
**Commit:** (set after commit)
**Entering baseline:** 1344/24/57
**Exiting baseline:** 1358/24/57
**Files changed:** `src/worker.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`

---

## D-178A Findings Addressed

| Finding | Status |
|---|---|
| F1 — No `Cache-Control: no-store` on any API response | Patched (P1) |
| F3 — `X-Content-Type-Options: nosniff` absent from all Worker responses | Patched (P1) |
| F4 — `renderPublicProfileShell()` HTML missing cache/referrer/nosniff | Patched (P2) |
| F2 — Missing `Vary` header on user-specific routes | Acceptable with F1 patched — no separate change needed |
| F5 — OPTIONS preflight has no `Access-Control-Max-Age` | Informational — no patch |

---

## What Changed

### P1 — `cache-control: no-store` and `x-content-type-options: nosniff` added to `CORS` object (`src/worker.js` lines 17–22)

**Before:**
```js
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-humanx-user,x-humanx-admin'
};
```

**After:**
```js
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-humanx-user,x-humanx-admin',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
```

Because `json()` spreads `...CORS` and the export `new Response` also spreads `...CORS`, this single change propagates to every Worker JSON/API response — including all public routes, all user-specific routes, all admin routes, and all error responses routed through the global catch.

### P2 — Security headers added to `renderPublicProfileShell()` HTML response (`src/worker.js`)

**Before:**
```js
return new Response(injected, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
```

**After:**
```js
return new Response(injected, { status: 200, headers: {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
} });
```

---

## API / Cache Behavior Before / After

| Route category | Before | After |
|---|---|---|
| All JSON API responses (`json()`) | No `Cache-Control` | `Cache-Control: no-store` |
| Export download (`new Response + ...CORS`) | No `Cache-Control` | `Cache-Control: no-store` |
| Admin routes (`/api/review`, `/api/debug`, etc.) | No `Cache-Control` | `Cache-Control: no-store` |
| User-specific routes (`/api/my-humanx`, etc.) | No `Cache-Control` | `Cache-Control: no-store` |
| Error responses (global catch via `json()`) | No `Cache-Control` | `Cache-Control: no-store` |
| HTML profile shell (`/u/:slug`) | No `Cache-Control` | `Cache-Control: no-store` |
| Static assets (`env.ASSETS.fetch()`) | Cloudflare-managed | Cloudflare-managed (unchanged) |

---

## `X-Content-Type-Options` Behavior Before / After

| Response path | Before | After |
|---|---|---|
| All JSON API responses (`json()`) | Absent | `nosniff` |
| Export download (`new Response + ...CORS`) | Absent | `nosniff` |
| HTML profile shell | Absent | `nosniff` |
| Static assets | Cloudflare-managed | Cloudflare-managed (unchanged) |

---

## Public Profile Shell Header Behavior Before / After

| Header | Before | After |
|---|---|---|
| `Content-Type` | `text/html; charset=utf-8` | `text/html; charset=utf-8` (unchanged) |
| `Cache-Control` | Absent | `no-store` |
| `X-Content-Type-Options` | Absent | `nosniff` |
| `Referrer-Policy` | Absent | `no-referrer` |

---

## What Did Not Change

- **CORS behavior unchanged:** `Access-Control-Allow-Origin: *`, explicit allowed methods, explicit allowed headers, no `Access-Control-Allow-Credentials`. P1 adds two new safe headers to the object; existing CORS fields are identical.
- No route semantics changed. No auth behavior changed.
- No response shape, status code, or body content changed on any route.
- No cookies or credentials added.
- No schema change. No migration.
- No `wrangler.toml` changes.
- No owner-token work resumed. D-149H hold remains in effect.
- No admin/review route semantics changed. All `/api/review/*` routes remain `requireAdmin()`-gated.
- No frontend (`public/app-v10.js`) changes.

## CSP Deferred / Out of Scope

Content-Security-Policy is not added in D-178B. A CSP for this SPA requires a dedicated audit of inline scripts, styles, and external resource loads. Deferred to a future task if warranted.

---

## Tests

**14 new D-178B smoke tests** added to `scripts/hardening-smoke-test.mjs`:

| Test | What it proves |
|---|---|
| CORS object includes `cache-control: no-store` | `no-store` present in CORS definition |
| CORS object includes `x-content-type-options: nosniff` | `nosniff` present in CORS definition |
| `json()` helper spreads CORS | `...CORS` present in `json()` — inherits both new headers |
| Export `new Response` spreads CORS | `...CORS` present near `content-disposition` — inherits both headers |
| Review route inherits `no-store` via `json()` | Review route uses `json()` and `requireAdmin` |
| Profile shell has `Cache-Control: no-store` | `no-store` in `renderPublicProfileShell` body |
| Profile shell has `X-Content-Type-Options: nosniff` | `nosniff` in `renderPublicProfileShell` body |
| Profile shell has `Referrer-Policy: no-referrer` | `no-referrer` in `renderPublicProfileShell` body |
| CORS remains wildcard with no credentials | `ACAO: *` unchanged; `allow-credentials` absent |
| No CSP added in D-178B | `content-security-policy` absent from worker source |
| Review routes remain `requireAdmin`-gated | `requireAdmin` and `/api/review` both present |
| No owner-token work resumed | D-149H hold confirmed |
| No frontend console logging | `console.` absent from `app-v10.js` |
| Admin token input remains `type="password"` | `type="password"` present in frontend |

**New baseline: 1358/24/57**
- `scripts/hardening-smoke-test.mjs`: **1358** (was 1344, +14)
- `scripts/belief-engine-static-check.mjs`: **24** (unchanged)
- `scripts/worker-route-static-check.mjs`: **57** (unchanged)

---

## No Owner-Token Work Resumed

D-149H hold is in effect. No owner-token enforcement added or changed.

## No Schema / Migration

Header-only change to `src/worker.js`. No new columns, tables, or migration files.

## No Admin / Review Route Semantics Changed

`/api/review/*` routes are untouched. `requireAdmin()` gate is unchanged. The review queue response now correctly carries `Cache-Control: no-store` to prevent browser caching of admin data.

---

## Recommended Next Step

D-178C — Bump deploy metadata for D-178B. Or D-178D live verification preflight.
