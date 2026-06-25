# D-178D — HTTP Cache and Nosniff Headers Live Verification

**Date:** 2026-06-25
**Local commit:** 4cd9f62 (D-178C — Bump deploy metadata for D-178B)
**Patch commit verified:** 611aad5 (D-178B — Patch HTTP cache and nosniff headers)
**Baseline:** 1358/24/57
**Type:** Live verification / documentation only. No code changes.

---

## Evidence Source

Owner-terminal production preflight run from `C:\Users\veltr\HumanX` against `https://humanx.rinkimirikata.com`. Output pasted by owner. Not run from Claude shell.

A first preflight attempt using `Show-Header` was superseded by a corrected run; only the corrected run is used as evidence below. Throwaway live-verify user ID is redacted from this document.

---

## Preflight Results

### Health and API JSON headers (`GET /api/health`)

| Check | Result |
|---|---|
| HTTP status | 200 |
| Service live | `ok: true` |
| Mode | `d1-live` |
| `cache-control` header | `no-store` |
| `x-content-type-options` header | `nosniff` |
| `access-control-allow-origin` | `*` |
| `access-control-allow-credentials` present | False |

### Session API headers (`POST /api/session`)

| Check | Result |
|---|---|
| HTTP status | 200 |
| `cache-control` header | `no-store` |
| `x-content-type-options` header | `nosniff` |
| `access-control-allow-origin` | `*` |
| `access-control-allow-credentials` present | False |
| Exposes `is_admin` | False |
| Exposes `is_shadow_banned` | False |

### OPTIONS preflight (`OPTIONS /api/session`)

| Check | Result |
|---|---|
| HTTP status | 200 |
| `access-control-allow-origin` | `*` |
| `access-control-allow-methods` | `GET,POST,OPTIONS` |
| `access-control-allow-headers` | `content-type,x-humanx-user,x-humanx-admin` |
| `access-control-allow-credentials` present | False |

### Review route unauthenticated (`GET /api/review` — no admin token)

| Check | Result |
|---|---|
| HTTP status | 403 |
| `cache-control` header | `no-store` |
| `x-content-type-options` header | `nosniff` |
| `access-control-allow-origin` | `*` |
| `access-control-allow-credentials` present | False |

### Frontend sanity

| Check | Result |
|---|---|
| Admin token input is `type="password"` | True |
| Console logging present | False |

---

## What the Preflight Confirms

**`Cache-Control: no-store` is live on all sampled API responses:** Confirmed on `/api/health` (200), `/api/session` (200), and `/api/review` 403 error response. The 403 error path confirms that the global catch-block responses — which all route through `json()` — also carry `no-store`. This is consistent with P1 adding `cache-control` to the `CORS` object spread by every `json()` call.

**`X-Content-Type-Options: nosniff` is live on all sampled API responses:** Confirmed on the same three response paths.

**CORS behavior unchanged:** `access-control-allow-origin: *` on all sampled responses. `access-control-allow-credentials` is absent. OPTIONS preflight retains the exact allowed methods and headers from before D-178B. No regression to CORS behavior.

**Session field exposure unchanged:** `/api/session` does not expose `is_admin` or `is_shadow_banned`. Session hardening from prior chains is intact.

**Review gate unchanged:** `/api/review` without admin token returns 403, and that 403 itself carries `no-store` and `nosniff`.

---

## What the Preflight Intentionally Did Not Test (and Why)

**Public profile shell HTML headers (`/u/:slug`):** The D-178B HTML headers (`cache-control: no-store`, `x-content-type-options: nosniff`, `referrer-policy: no-referrer`) were added to `renderPublicProfileShell()`. The preflight does not probe a profile URL — no known safe public profile slug was provided by the owner for this preflight. The HTML response headers are source/static-verified by D-178B tests at baseline 1358:
- `D-178B: public profile shell has Cache-Control no-store`
- `D-178B: public profile shell has X-Content-Type-Options nosniff`
- `D-178B: public profile shell has Referrer-Policy no-referrer`

---

## What D-178D Does Not Claim

- Does not claim live verification of the public profile shell HTML response headers.
- Does not claim any admin token, owner token, invite code, SQL text, D1 internals, stack traces, or internal debug metadata.
- Does not claim production verification from Claude shell.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed in D-178B through D-178D.

## No Admin/Review Route Semantics Changed

`/api/review/*` routes are untouched. The 403 gate is live in production and now correctly carries `Cache-Control: no-store`.

---

## Recommended Next Step

D-179A or equivalent — next audit or feature cycle. D-178 chain (A through D) is complete.
