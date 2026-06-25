# D-166D — Live Verify Sensitive Metadata Guardrails

**Date:** 2026-06-25
**Scope:** Live verification of D-166B guardrails patch. No code, route, migration, wrangler.toml, or owner-token changes in this task.

---

## What this documents

D-166B patched two sensitive metadata exposure findings from the D-166A audit:

1. `reviewQueue` claims SELECT replaced `c.*` wildcard with an explicit 21-column allowlist
2. `is_shadow_banned` removed from four user-facing own-user API responses (`/api/me`, `/api/my-humanx`, `/api/my-humanx/export`, `/api/auth/invite/redeem`)

This document records production evidence confirming the D-166B changes are live and correct. No claim is made beyond what the preflight output shows.

---

## Production Commit State

| Field | Value |
|---|---|
| Local HEAD | `80958d2` (D-166C — Bump deploy metadata for D-166B) |
| D-166B security patch commit | `9684b0b` |
| D-166C deploy metadata bump | `80958d2` |
| `git push origin main` | confirmed (output shown below) |

Owner terminal confirmed `80958d2` pushed to `origin/main` before preflight.

---

## Production Health

`GET /api/health` returned:

- `ok: true`
- `service: humanx`
- `mode: d1-live`

Production is running in live D1 mode. Not demo fallback.

---

## Review Route Admin Guard

`GET /api/review` without admin token returned **HTTP 403**.

The review queue is correctly requireAdmin-gated. No unauthenticated access.

---

## `is_shadow_banned` Absent from Own-User Responses

A throwaway anonymous session was created for preflight only. The user id is redacted from this document per security rules.

| Endpoint | `is_shadow_banned` in response? |
|---|---|
| `GET /api/me` | **False** — field absent |
| `GET /api/my-humanx` | **False** — field absent from full JSON |
| `GET /api/my-humanx/export` | **False** — field absent from full export JSON |

All three confirmed via `($response | ConvertTo-Json -Depth 30 -Compress) -match '"is_shadow_banned"'` returning `False`.

Shadow-ban enforcement in `requireUser()` was not tested here (internal enforcement only, correct by source audit in D-166B).

---

## Admin Token Input

Production `app-v10.js` (fetched live):

- `type="password"` present: **True** — admin token input is masked

---

## Frontend Console Logging

Production `app-v10.js`:

- `console.` present: **False** — no console logging in production JS

---

## Owner Token Not Surfaced in JS

Production `app-v10.js`:

- `'owner token value|owner_token value|ownerToken value'` match: **False** — no owner token value surfaced in JS text

---

## Review Queue `c.*` Wildcard

D-166B replaced `c.*` with an explicit SELECT in `src/worker.js`. This is confirmed by source audit (D-166B) and smoke tests (Section 99). Live production preflight cannot directly inspect SQL sent to D1 without admin backend access — the guardrail is verified at source and test level, not via live query inspection.

---

## What Did Not Change in D-166D

- No `src/worker.js` changes
- No `public/app-v10.js` changes
- No route added, removed, or semantically changed
- No admin-token or owner-token logic changed
- No migration
- No `wrangler.toml`
- No owner-token enforcement resumed — D-149H hold remains in effect

---

## What Is Not Claimed

- `/api/auth/invite/redeem` `is_shadow_banned` removal was not directly live-verified (requires a new account creation flow). It is confirmed at source level in D-166B.
- The SQL SELECT sent to D1 for `reviewQueue` was not inspected live — confirmed at source and test level only.
- No admin token, owner token, invite code, user id, email, `is_admin`, or internal debug metadata was documented or captured in this verification.

---

## Smoke Tests

Baseline unchanged: **1223/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1223 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-166D is documentation/verification only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this task.
