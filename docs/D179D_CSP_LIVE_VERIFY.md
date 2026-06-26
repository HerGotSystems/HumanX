# D-179D — CSP Live Verification

**Date:** 2026-06-26
**Patch commit:** 0d7c359 (D-179B)
**Worker version:** 0eb04089-96bf-4a91-b05c-6e65eda7d290
**Baseline:** 1366/24/57
**Type:** Live verification / chain close. No code changes.

---

## Safety Constraints

- Admin token not printed, not echoed, not stored, not documented here.
- Owner token not touched. D-149H hold remains in effect.
- No migration applied.
- No auth/token logic changed.

---

## D-179 Chain Summary

| Task | Description | Outcome |
|---|---|---|
| D-179A | CSP audit | Confirmed app requires `unsafe-inline` for both script-src and style-src (47 inline onclick handlers, 25 inline style attrs); identified Google Fonts dependency; permissive CSP deployable without refactoring |
| D-179B | Add CSP header to public HTML response | `content-security-policy` added to `renderPublicProfileShell()` only; CORS/json() unchanged; 8 smoke tests added |
| D-179C | Bump deploy metadata | `deploy-meta.js` updated to checkpoint `D-179B`, commit `0d7c359`, baseline `1366/24/57` |
| D-179D | Live verification | CSP header confirmed live — this document |

---

## CSP Value Deployed

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self';
img-src 'self' data:;
object-src 'none';
base-uri 'self';
frame-ancestors 'none'
```

---

## Scope

**Changed:** `src/worker.js` line 622 — `renderPublicProfileShell()` HTML response headers only.

**Not changed:**
- `CORS` object (line 17) — no CSP on JSON API responses
- `json()` helper (line 863) — no CSP on JSON API responses
- All API routes — unaffected
- Review/admin flow — unaffected
- Auth/token logic — unaffected
- wrangler.toml — not touched
- No migration

---

## Live Verification Results

| Check | Result |
|---|---|
| Deploy succeeded | Yes — Worker version `0eb04089-96bf-4a91-b05c-6e65eda7d290` |
| App loads | Yes |
| DevTools `content-security-policy` header on HTML response | Present, matches deployed value |
| CSP Console violations | None observed |
| Review queue loads | Yes — pending/rejected/report filters and cards render |
| Auth/token regressions | None |
| API JSON responses changed | No |
| Migration run | No |

---

## Effective Security Improvements

| Directive | Protection |
|---|---|
| `default-src 'self'` | Blocks all unlisted resource types from external origins by default |
| `script-src 'self' 'unsafe-inline'` | Blocks external script injection (CDN hijacking, injected `<script src>` tags) |
| `style-src 'self' 'unsafe-inline' fonts.googleapis.com` | Blocks external stylesheet injection from non-Google-Fonts sources |
| `font-src 'self' fonts.gstatic.com` | Allows Google Fonts glyphs; blocks other external font sources |
| `connect-src 'self'` | Blocks `fetch()`/`XHR` to external origins — data exfiltration vector contained |
| `img-src 'self' data:` | Allows inline data URIs; blocks external image tracking pixels |
| `object-src 'none'` | Blocks Flash/object/embed entirely |
| `base-uri 'self'` | Blocks `<base>` tag hijacking (base tag injection attack) |
| `frame-ancestors 'none'` | Blocks clickjacking via `<iframe>`, `<frame>`, `<embed>` (stronger than X-Frame-Options) |

**Known intentional gap:** `'unsafe-inline'` in `script-src` and `style-src` is retained — required by 47 inline `onclick`/`onXxx` handlers and 25 inline `style=` attributes in `public/app-v10.js`. This means CSP does not protect against XSS via injected inline scripts in the current build. Refactoring to remove `unsafe-inline` is a future hardening opportunity (D-179A documented this tradeoff).

---

## Baseline

All three test suites confirmed passing at 1366/24/57:
- `hardening-smoke-test.mjs` — 1366 passed, 0 failed
- `belief-engine-static-check.mjs` — all hard checks passed
- `worker-route-static-check.mjs` — all hard checks passed

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.
