# D-178A — HTTP Headers, Cache Policy, and CORS Exposure Audit

**Date:** 2026-06-25
**Local commit:** f638299 (D-177D)
**Baseline:** 1344/24/57
**Type:** Audit only. No source code changes.

---

## Executive Summary

All API JSON responses are produced by a single `json()` helper that spreads the global `CORS` object. CORS is appropriately scoped (`*` origin, explicit methods, explicit headers, no credentials). No cookies are used.

The primary gap is the **absence of `Cache-Control: no-store`** on all API responses, including admin-only and user-specific GET routes. A browser or shared-proxy cache could retain stale admin queue data or user-specific payloads across requests. A secondary gap is the absence of `X-Content-Type-Options: nosniff` on all Worker-generated responses. The HTML profile-shell response is also missing basic browser security headers.

No critical CORS bypass, credential exposure, or cache-poisoning vector is present. Findings are in the *questionable → patch recommended* band.

---

## Response Helper and Header Matrix

| Response path | Function | Content-Type | CORS (`ACAO: *`) | Cache-Control | Security headers |
|---|---|---|---|---|---|
| All API JSON routes | `json()` (line 861) | `application/json; charset=utf-8` ✓ | Yes (all) | **Absent** | **Absent** |
| Export download | manual `new Response` (line 443) | `application/json; charset=utf-8` ✓ | Yes | **Absent** | **Absent** |
| HTML profile shell `/u/:slug` | `renderPublicProfileShell()` (line 620) | `text/html; charset=utf-8` ✓ | **No** (intentional) | **Absent** | **Absent** |
| Static assets | `env.ASSETS.fetch()` (line 38) | Cloudflare-set | Cloudflare-set | Cloudflare-set | Cloudflare-set |
| OPTIONS preflight | inline (line 27) | None (null body) ✓ | Yes | **Absent** | **Absent** |
| Fallback API (no DB) | `fallbackApi()` (line 855) via `json()` | Inherited from `json()` | Yes | **Absent** | **Absent** |

### `json()` helper definition (line 861)

```js
function json(data, status=200) {
  return new Response(JSON.stringify(data,null,2),{
    status,
    headers:{ 'content-type':'application/json; charset=utf-8', ...CORS }
  });
}
```

`CORS` object (lines 17–21):
```js
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-humanx-user,x-humanx-admin'
};
```

Every API route — public, user-specific, and admin — returns the same `CORS` spread. No `Cache-Control`, no `X-Content-Type-Options`, no `Referrer-Policy`.

---

## CORS / OPTIONS Verdict

**Verdict: Acceptable as-is.**

- `ACAO: *` is correct here. HumanX does not use cookies or `withCredentials`. Pseudonymous user IDs travel in `x-humanx-user` (not a secret). Admin tokens are required separately for sensitive routes and are not guessable from CORS alone.
- `ACAM: GET,POST,OPTIONS` — no DELETE/PATCH/PUT exposed. Minimal.
- `ACAH: content-type,x-humanx-user,x-humanx-admin` — explicit list, not wildcard.
- `Access-Control-Allow-Credentials` is absent — correct; `*` origin and credentials cannot coexist in the CORS spec.

**OPTIONS preflight (line 27):** Fires before all auth checks. This is correct — preflights carry no body and return no data. Missing `Access-Control-Max-Age` (browsers default to ~5s), which increases preflight frequency but is not a security gap.

**No CORS bypass vector found.**

---

## API Cache Policy Verdict

### Public GET routes (no auth required)

| Route | Auth | Cache risk |
|---|---|---|
| `GET /api/health` | None | Low — no sensitive data |
| `GET /api/version` | None | Low — public deploy metadata |
| `GET /api/claims` | None (public) | Low — intentionally public |
| `GET /api/truths` | None (public) | Low |
| `GET /api/graph-status` | None (public) | Low |
| `GET /api/evidence-vault` | None (public) | Low |
| `GET /api/u/:slug` | None (public profile) | Low |

For public routes, lack of `Cache-Control` is a minor efficiency concern (optional edge caching benefit foregone) but no security risk.

### User-specific GET routes (pseudonymous auth)

| Route | Auth | Cache risk |
|---|---|---|
| `GET /api/me` | `x-humanx-user` | **Moderate** — user-specific data |
| `GET /api/my-humanx` | `x-humanx-user` | **Moderate** — user-specific content list |
| `GET /api/my-humanx/export` | `x-humanx-user` | **Moderate** — bulk personal export |
| `GET /api/belief-snapshots` | `x-humanx-user` | **Moderate** — user belief data |
| `GET /api/claims/:id` | None | Low — public claim data |

Without `Cache-Control: no-store` and without `Vary: x-humanx-user`, a shared HTTP proxy cache could theoretically serve user A's `/api/my-humanx` response to user B (same URL, no Vary differentiation). Cloudflare Workers do not cache dynamic API responses by default, and browser caches are per-origin without a shared-proxy layer. Risk is **low-moderate in practice** but the header discipline is missing.

### Admin GET routes (admin-token required)

| Route | Auth | Cache risk |
|---|---|---|
| `GET /api/review` | `requireAdmin` | **High** — full review queue |
| `GET /api/debug` | `requireAdmin` | **High** — DB table counts and recent claims |
| `GET /api/debug/owner-token-telemetry` | `requireAdmin` | **High** — telemetry data |
| `GET /api/seed` | `requireAdmin` | Low — idempotent seed |
| `GET /api/import-seed` | `requireAdmin` | Low — dry-run default |
| `GET /api/import-truths` | `requireAdmin` | Low — dry-run default |

Admin GET routes return sensitive aggregate data and have no `Cache-Control: no-store`. If a browser caches a successful admin response (e.g. `/api/review`), a subsequent `GET /api/review` without the admin token would return a cached 200 with review queue data from the browser's own cache. This is a **browser-local** risk (admin's own browser only — no other user is affected), but is still a discipline gap.

---

## Session / Auth / Invite Cache Policy Verdict

All session and invite routes are POST — POST requests are never cached by browsers or standard proxies. Cache risk is **Low** for these routes.

| Route | Method | Cache risk |
|---|---|---|
| `POST /api/session` | POST | Low — not cached |
| `POST /api/auth/invite/redeem` | POST | Low — not cached |
| `POST /api/auth/invite/create` | POST | Low — not cached |

---

## Frontend HTML Security Header Verdict

`renderPublicProfileShell()` (line 620) returns:

```js
return new Response(injected, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
```

Missing headers:
- `X-Content-Type-Options: nosniff` — absent
- `Referrer-Policy` — absent
- `Cache-Control` — absent (HTML may be cached by browser or CDN)
- `Content-Security-Policy` — absent
- `Permissions-Policy` — absent

Static assets served via `env.ASSETS.fetch()` have Cloudflare-managed headers (not controlled by Worker code). This audit covers only Worker-generated responses.

---

## Error Response Header Verdict

All catch-block responses (lines 85–89) use `json()` and therefore carry the same CORS headers and the same absence of `Cache-Control` and `X-Content-Type-Options` as normal API responses. No extra header risk from error paths.

---

## Findings and Risk Classification

### F1 — No `Cache-Control: no-store` on any API response (Patch recommended)

| | |
|---|---|
| **Surface** | `json()` helper — all API routes |
| **Current behavior** | No Cache-Control header on any Worker JSON response |
| **Risk** | Admin GET routes (review queue, debug, telemetry) may be cached in the admin's own browser. User-specific GET routes may be cached without differentiation by Vary. |
| **Exposure category** | Admin and user-specific data |
| **Verdict** | Patch recommended |
| **D-178B action** | Add `'cache-control': 'no-store'` to the `CORS` object (or directly to `json()`). This covers all API responses in one change. Public GET routes will lose opportunistic browser caching, which is acceptable — HumanX does not currently depend on API response caching for performance. |

### F2 — Missing `Vary: x-humanx-user` on user-specific GET routes (Acceptable with F1 patched)

| | |
|---|---|
| **Surface** | `/api/my-humanx`, `/api/me`, `/api/belief-snapshots`, `/api/my-humanx/export` |
| **Current behavior** | No `Vary` header; responses not differentiated by user ID in shared caches |
| **Risk** | Shared proxy (not browser) could serve wrong user's data at same URL |
| **Exposure category** | User-specific data |
| **Verdict** | Acceptable if F1 is patched (`no-store` prevents caching entirely); informational otherwise |
| **D-178B action** | If F1 is patched, no separate Vary change needed. Note for future if public caching is ever added. |

### F3 — `X-Content-Type-Options: nosniff` absent from all Worker responses (Patch recommended)

| | |
|---|---|
| **Surface** | `json()` and `renderPublicProfileShell()` |
| **Current behavior** | No `X-Content-Type-Options` header |
| **Risk** | Legacy browsers may sniff MIME type and misinterpret JSON or HTML responses |
| **Exposure category** | All public and authenticated responses |
| **Verdict** | Patch recommended |
| **D-178B action** | Add `'x-content-type-options': 'nosniff'` to `CORS` object (covers all `json()` responses) and to the HTML response headers in `renderPublicProfileShell()`. |

### F4 — HTML profile shell missing basic security headers (Patch recommended)

| | |
|---|---|
| **Surface** | `renderPublicProfileShell()` line 620 |
| **Current behavior** | Only `content-type` header; no Cache-Control, Referrer-Policy, or X-Content-Type-Options |
| **Risk** | HTML served without browser security guidance; may be cached without expiry |
| **Exposure category** | Public-facing HTML (no sensitive data, but browser hardening gap) |
| **Verdict** | Patch recommended |
| **D-178B action** | Add `'cache-control': 'no-store'`, `'x-content-type-options': 'nosniff'`, and `'referrer-policy': 'no-referrer'` to the HTML response. CSP evaluation is a separate larger task — do not add in D-178B without a dedicated CSP audit. |

### F5 — OPTIONS preflight has no `Cache-Control` or `Access-Control-Max-Age` (Informational)

| | |
|---|---|
| **Surface** | OPTIONS handler line 27 |
| **Current behavior** | CORS headers only; no max-age |
| **Risk** | None (preflights return no data). Browsers use short default TTL causing extra preflight requests. |
| **Verdict** | Informational — no patch required |

---

## Recommended D-178B Patch List

**P1 — Add `cache-control: no-store` and `x-content-type-options: nosniff` to the `CORS` object (`src/worker.js`)**

```js
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-humanx-user,x-humanx-admin',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
```

This covers every `json()` response and the export `new Response` (which spreads `...CORS`) in a single change.

**P2 — Add security headers to `renderPublicProfileShell()` HTML response (`src/worker.js`)**

```js
return new Response(injected, {
  status: 200,
  headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  },
});
```

**No P3 for CSP:** A Content-Security-Policy for the SPA requires auditing all inline scripts, styles, and external resource loads. This is a separate task — do not add CSP in D-178B without dedicated evaluation.

**No change to CORS `ACAO: *`:** Correct for this API. No credentials used.

**No change to route semantics, auth, or response shape.**

---

## Standing Checks Confirmed

- No frontend `console.*` (confirmed by D-177B tests)
- Admin token input remains `type="password"` (confirmed by D-177B tests)
- No admin/owner token values rendered
- Review routes remain `requireAdmin`-gated (lines 77–81)
- No `wrangler.toml` changes in this audit
- No migration
- No owner-token work resumed (D-149H hold in effect)

---

## No Source Code Changes

D-178A is audit-only. No files changed. Baseline 1344/24/57 expected unchanged.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed.

---

## Recommended Next Step

D-178B — Apply P1 and P2: add `cache-control: no-store` and `x-content-type-options: nosniff` to API responses and HTML profile shell. Add hardening smoke tests. New baseline TBD.
