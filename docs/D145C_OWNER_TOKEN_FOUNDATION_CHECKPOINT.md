# D-145C — Owner Token Foundation Checkpoint

**Date:** 2026-06-22
**Chain:** D-145A (audit) → D-145B (advisory owner-token foundation) → D-145C (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-145 Chain

### D-145A — Public profile trust / owner identity / signed owner header audit
Read-only audit of the repeatedly-noted limitation that `x-humanx-user` is unsigned and spoofable for every owner-side action — archive, export, profile settings, and now selected-snapshot sharing. Confirmed the exact risk surface: `requireUserId()` does nothing but sanitize whatever string the client sends, with zero cryptographic guarantee, while `requireAdmin()` already does this correctly (constant-time comparison against a Worker secret). Found two secondary issues while auditing: `getMe`/`myHumanX`/`archiveMyHumanXItem`/`exportMyHumanX`/`saveProfileSettings` all used the weaker `requireUserId()` instead of `requireUser()`, skipping the shadow-ban check that content-submission endpoints correctly apply; and `POST /api/session` was leaking the caller's own `is_admin` flag in its response. Recommended a **stateless, advisory-mode HMAC owner token** as the v1 trust upgrade — no login system, no cookies, no OAuth — rolled out in two phases to guarantee zero lockout risk: Phase 1 (mint + accept-but-don't-require), Phase 2 (future, separate, enforce only after confirming adoption). No code changed.

### D-145B — Advisory owner-token foundation
Implemented exactly as audited, Phase 1 only:
- `base64UrlEncode()`/`base64UrlDecode()`/`hmacSha256()`/`signOwnerToken()`/`verifyOwnerToken()`/`ownerTokenStatus()` added to `src/worker.js`. Tokens are `payload.signature`, HMAC-SHA256 via `crypto.subtle`, payload `{uid, iat, exp}`, ~90-day TTL. The secret is read only from `env.HUMANX_OWNER_SECRET` — never `wrangler.toml`, never hard-coded.
- `POST /api/session` (`createOrGetUser()`) now mints and returns `owner_token` whenever a user row resolves and the secret is configured (`null` otherwise — never an error), and stops selecting/returning `is_admin` — the leak found during D-145A.
- `ownerTokenStatus()` is called by the five owner-sensitive endpoints (`getMe`, `myHumanX`, `archiveMyHumanXItem`, `exportMyHumanX`, `saveProfileSettings`) plus `POST /api/belief-snapshots` and `POST /api/belief-promote`, but the result is never used to reject a request — purely advisory, purely for future enforcement and observability.
- Those same five endpoints were switched from `requireUserId()` to `requireUser()`, so the shadow-ban check now applies to them. `GET /api/belief-snapshots` deliberately kept `requireUserId()` — confirmed during implementation that this was an intentional D-89D design choice (shadow-banned users can still read their own snapshots; only writes are blocked), not an oversight, and was preserved rather than "fixed."
- Frontend: `headers()` in `public/app-v10.js` sends `x-humanx-owner-token` alongside `x-humanx-user` on every `api()` call; `boot()` stores `owner_token` from the session response into the same `humanx_public_user_v1` localStorage object. The standalone Belief Engine bridge sends the same header and never strips an existing token (`getOrCreateHumanXUser()` only writes localStorage for brand-new users, returning existing objects untouched).
- `GET /api/u/:slug`, `GET /u/:slug`, and the entire admin-token path (`requireAdmin`, `x-humanx-admin`) are completely untouched — this is a separate, non-overlapping system.

---

## Production Confirmed (owner-smoked, live)

- `POST /api/session` returns an `owner_token` field.
- `owner_token` may be `null` until `HUMANX_OWNER_SECRET` is set — confirmed live, behavior unchanged either way.
- `is_admin` is absent from the `/api/session` response.
- `GET /api/my-humanx` still works with no token enforcement.
- The real owner identity still resolves correctly: `usr_3c204c78f6fa49bfad` / Calenhir / slug `calenhir`.
- `/u/calenhir` still returns 200 with OG title and `noindex` intact (D-143/D-144 behavior unaffected).

**Known smoke nuance (not a regression):** a raw PowerShell `POST /api/session` call with an arbitrary body created a *new* anonymous user rather than resolving the existing owner identity. This is expected — identity resolution depends on the browser's `localStorage`-held `usr_*` id being sent in the request body/header, which a bare scripted POST with its own arbitrary body doesn't replicate. `GET /api/my-humanx` (which reads identity from the `x-humanx-user` header as the real browser session does) confirmed the actual owner identity continues to work correctly throughout.

---

## Backend Implementation

| Function | Purpose |
|---|---|
| `base64UrlEncode()` / `base64UrlDecode()` | URL-safe base64 encoding for the token payload and signature |
| `hmacSha256()` | HMAC-SHA256 via `crypto.subtle` — no third-party crypto library |
| `signOwnerToken(env, userId)` | Mints `payload.signature`; returns `null` if `HUMANX_OWNER_SECRET` isn't set |
| `verifyOwnerToken(env, token, expectedUserId)` | Checks signature validity, expiry, and that the token's `uid` matches the caller's `x-humanx-user` — a token for one user never validates for another |
| `ownerTokenStatus(request, env, userId)` | Advisory-only: returns `'missing'`/`'valid'`/`'invalid'`, never throws, never blocks the request |

`HUMANX_OWNER_SECRET` is referenced only via `env.HUMANX_OWNER_SECRET` — confirmed absent from `wrangler.toml` and never hard-coded anywhere in the codebase. `POST /api/session` mints `owner_token` when the secret exists and omits `is_admin` unconditionally. Advisory checks are wired into the owner-sensitive endpoints listed above; no request is ever rejected for a missing or invalid token in this patch.

---

## Endpoint Behavior

| Endpoint | Change |
|---|---|
| `getMe`, `myHumanX`, `archiveMyHumanXItem`, `exportMyHumanX`, `saveProfileSettings` | Advisory token check added; switched `requireUserId()` → `requireUser()` (shadow-ban check now applies) |
| `POST /api/belief-snapshots`, `POST /api/belief-promote` | Advisory token check added (already used `requireUser()`, unchanged there) |
| `GET /api/belief-snapshots` | Advisory token check added; **`requireUserId()` deliberately preserved** — D-89D intentionally lets shadow-banned users read their own snapshots |
| `GET /api/u/:slug` | Unchanged — fully public, no identity check of any kind |
| `GET /u/:slug` | Unchanged — fully public, no identity check of any kind |
| Admin token path (`requireAdmin`, `x-humanx-admin`) | Completely unchanged — separate, non-overlapping system |

---

## Frontend Implementation

- `headers()` (`public/app-v10.js`) sends `x-humanx-owner-token` alongside `x-humanx-user` whenever the latter is sent — empty string when absent, never an error.
- `boot()` stores `owner_token` from the `/api/session` response into the same `humanx_public_user_v1` localStorage object used for the rest of the user record.
- Old stored users with no `owner_token` field continue to work unchanged — `user?.ownerToken||''` degrades safely.
- The Belief Engine bridge (`public/apps/humanx-belief-engine/humanx-bridge.js`) preserves an existing token (never rewrites a stored user object it finds) and sends `x-humanx-owner-token` on its own `/api/belief-snapshots` POST.

---

## Safety Model

- Advisory only — no endpoint rejects a missing or invalid token in this patch.
- No lockout risk — every existing flow continues working exactly as before, with or without a token present.
- No cookie-based auth, no CSRF/CORS changes, no OAuth, no magic-link/email login, no migration.
- The token never appears in a URL or query string — header-only.
- No token value appears in docs, logs, or version control.
- The admin-token system is entirely separate and unaffected.

---

## Secret Setup

`HUMANX_OWNER_SECRET` is **optional** for this deploy. Without it, `owner_token` is always `null` and behavior is completely unchanged from before D-145B. Once set, `POST /api/session` begins minting real owner tokens automatically — no other deploy step or migration is needed.

```
wrangler secret put HUMANX_OWNER_SECRET
```

Never add this value to `wrangler.toml` — it must remain a Worker secret, outside version control.

---

## Bugs Fixed

| Bug | Detail |
|---|---|
| `/api/session` `is_admin` leak | `createOrGetUser()` previously selected and returned `is_admin` to every caller (every page load, via `boot()`). Removed — same omission discipline as `getMe()`/`myHumanX()`/`exportMyHumanX()`. |
| D-89D nuance confirmed, not "fixed" | `GET /api/belief-snapshots`'s `requireUserId()`-only behavior (allowing shadow-banned reads) was found during implementation to be an intentional prior design choice, evidenced by an existing test's name and docstring. Preserved exactly as-is rather than blanket-switched to `requireUser()`. |

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Owner token is not enforced yet** | Phase 1 (advisory) only — Phase 2 (enforcement) is explicitly deferred to a future, separately-scoped patch. |
| **`x-humanx-user` spoofing is still technically possible until Phase 2** | The token closes the gap only once enforcement lands; until then, the underlying vulnerability from D-145A remains open. |
| **No token telemetry/adoption dashboard** | There's currently no way to measure what fraction of active sessions have picked up a valid token — needed before Phase 2 enforcement can be safely scheduled. |
| **No token rotation UI** | Tokens refresh silently on every `/api/session` call (every page load) — there's no user-facing "revoke my sessions" or rotation control. |
| **No cross-device login** | The token is bound to whatever `usr_*` id a given browser's `localStorage` holds — it doesn't make identity portable across devices, only harder to spoof for a given id. |
| **Raw scripted `/api/session` calls can create a new anonymous user** | Documented smoke nuance, not a bug — a bare POST that doesn't replicate the browser's stored identity will resolve/create a *different* user, as designed. |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 951 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```

---

## Recommended Next Implementation

**D-146A — Owner token enforcement readiness audit**

The token foundation has shipped safely in advisory mode, with zero lockout risk and zero behavior change for anyone not yet presenting a token. Before flipping any endpoint to actually require it (Phase 2), a read-only audit should determine: which endpoints are safe to enforce first (archive/export/profile-settings remain the highest-risk, highest-priority candidates per D-145A); how to confirm real-world token adoption before enforcing (since there's currently no telemetry); what the safest rollout sequencing looks like (e.g. log-only "would have rejected" mode before actual rejection); and explicit confirmation that `HUMANX_OWNER_SECRET` has been set and is stable in production before any enforcement work begins.
