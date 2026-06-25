# D-168D — Live Verify Public API Response Allowlists

**Date:** 2026-06-25
**Scope:** Live verification of D-168B allowlist patch. No code, route, migration, wrangler.toml, or owner-token changes in this task.

---

## What This Documents

D-168B patched four public API response exposure findings from the D-168A audit:

1. `POST /api/session` (`createOrGetUser`) — removed `is_shadow_banned` from session user object
2. `GET /api/claims/:id` (`getClaim`) — replaced `SELECT *` with explicit column lists for evidence/pressure/tests; removed `user_id` and `duplicate_signature`
3. `GET /api/evidence-vault` — removed `duplicate_signature` from SELECT and mapper
4. `GET /api/graph-status` — reduced to 6 product-visible table counts; removed `users`, `rateLimits`, `duplicateSignatures`, `summary`

This document records production evidence confirming the D-168B changes are live and correct. No claim is made beyond what the preflight output shows.

---

## Production Commit State

| Field | Value |
|---|---|
| Local HEAD | `bdf629f` (D-168C — Bump deploy metadata for D-168B) |
| D-168B public API patch commit | `91269b5` |
| D-168C deploy metadata bump | `bdf629f` |
| `git push origin main` | confirmed (output shown in preflight) |

Owner terminal confirmed `bdf629f` pushed to `origin/main` before preflight.

---

## Production Health

`GET /api/health` returned:

- `ok: true`
- `service: humanx`
- `mode: d1-live`

Production is running in live D1 mode. Not demo fallback.

---

## `/api/session` — Session Response Shape

A throwaway pseudonymous user was created for preflight only. The user id is redacted from this document per security rules.

| Field | Present in response? |
|---|---|
| `is_shadow_banned` | **False** — absent from `/api/session` response |
| `is_admin` | **False** — absent from `/api/session` response |

Confirmed via `$sessionJson -match '"is_shadow_banned"'` → `False` and `$sessionJson -match '"is_admin"'` → `False`.

---

## `/api/graph-status` — Internal Inventory Counts

| Field | Present in response? |
|---|---|
| `users` | **False** — absent |
| `rateLimits` | **False** — absent |
| `duplicateSignatures` | **False** — absent |
| `summary` block | **False** — absent |

`/api/graph-status` confirmed `ok: True`. All four internal inventory signals removed as documented in D-168B.

---

## `/api/claims/:id` — Public Claim Detail Payload

A public claim was selected for preflight inspection. The claim id is redacted from this document per security rules.

| Field | Present in response? |
|---|---|
| `duplicate_signature` | **False** — absent |
| `duplicateSignature` | **False** — absent |
| `user_id` | **False** — absent |
| `is_shadow_banned` | **False** — absent |
| `is_admin` | **False** — absent |
| `email` | **False** — absent |

All six confirmed via `$detailJson -match` checks returning `False`.

---

## `/api/evidence-vault` — Public Evidence Vault Payload

| Field | Present in response? |
|---|---|
| `duplicate_signature` | **False** — absent |
| `duplicateSignature` | **False** — absent |
| `user_id` | **False** — absent |
| `is_shadow_banned` | **False** — absent |
| `is_admin` | **False** — absent |
| `email` | **False** — absent |

All six confirmed via `$vaultJson -match` checks returning `False`.

---

## Review Route Admin Guard

`GET /api/review` without admin token returned **HTTP 403**.

The review queue remains correctly `requireAdmin`-gated. No unauthenticated access.

---

## D-168B `SELECT *` Replacement

D-168B replaced public wildcard SELECT paths in `getClaim()` and removed `duplicate_signature` from the evidence vault with explicit allowlists. These changes are confirmed at source and smoke test level. Live production preflight cannot directly inspect SQL sent to D1 without admin backend access — the guardrail is verified at source and test level, and confirmed above via response-body absence checks.

---

## What Did Not Change in D-168D

- No `src/worker.js` changes
- No `public/app-v10.js` changes
- No route added, removed, or semantically changed
- No admin-token or owner-token logic changed
- No migration
- No `wrangler.toml`
- No owner-token enforcement resumed — D-149H hold remains in effect

---

## What Is Not Claimed

- No admin token, owner token, invite code, user id, email, `is_admin`, or internal debug metadata was documented or captured in this verification.
- The SQL SELECT strings sent to D1 for `getClaim()` evidence/pressure/tests were not inspected live — confirmed at source and smoke test level only.
- Shadow-ban enforcement in `requireUser()` was not tested here (internal enforcement only, correct by source audit in D-168B).

---

## Smoke Tests

Baseline unchanged: **1240/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1240 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-168D is documentation/verification only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this task.
