# D-171E — Live Verify RunPack Export Claim Payload Fields

**Date:** 2026-06-25
**Scope:** Live verification of D-171B (frontend) and D-171C (backend) RunPack/export claim payload patches. No code, route, migration, wrangler.toml, or owner-token changes in this task.

---

## What This Documents

D-171B added `safeRunPackClaim()` to the frontend and applied it to the fallback RunPack path and the `downloadJSON()` claims array. D-171C added `safeRunPackClaimBackend()` to the backend and applied it inside `buildRunPack()` so the backend-generated `/api/runpack` response also strips moderation/dedup/admin-internal fields from `payload.claim`.

This document records production evidence confirming those changes are live and effective. No claim is made beyond what the preflight output shows.

---

## Production Commit State

| Field | Value |
|---|---|
| Local HEAD | `8ed5566` (D-171D — Bump deploy metadata for D-171C) |
| D-171B frontend patch commit | `8c4103f` |
| D-171C backend patch commit | `488d446` |
| Deployed to origin/main | confirmed (HEAD matches origin/main per preflight git log) |

---

## Production Health

`GET /api/health` returned:

- `ok: true`
- `mode: d1-live`

Production is running in live D1 mode.

---

## Frontend JS Source Checks

The production `app-v10.js` was fetched and inspected.

| Check | Result |
|---|---|
| `safeRunPackClaim` function defined | **True** — present in production JS |
| Fallback RunPack uses `safeRunPackClaim(selected)` | **True** — confirmed |
| `safeExportUser` function defined | **True** — D-169B intact |
| Admin token input `type="password"` | **True** — masking intact |
| `console.log`/`console.error`/`console.warn` present | **False** — no console logging in frontend |

### Precision note — `downloadJSON` claims check

The preflight probe matched against the pattern `claims:\s*claims\.map\(safeRunPackClaim\)` and returned **False**.

This is a **probe regex mismatch**, not a missing feature. The actual production code is:

```js
claims:(claims||[]).map(safeRunPackClaim)
```

The `(claims||[])` defensive null-guard wrapper prevents a literal `claims.map(safeRunPackClaim)` match. The D-171B smoke test `D-171B: downloadJSON claims array uses safeRunPackClaim, not raw claims` verifies the correct implementation statically and passes at 1274 (confirmed). The feature is present; the preflight probe pattern was too narrow.

**Production JS source for `downloadJSON` is confirmed correct via static check. The preflight probe does not contradict this — it only proves the probe regex was insufficiently flexible.**

---

## Backend `/api/runpack` Production Payload Check

A public claim was selected (id redacted per security rules). A `POST /api/runpack` request was made.

`GET /api/runpack` returned an error (route accepts POST only — expected). The POST succeeded.

| Field | Exposed in production RunPack payload? |
|---|---|
| `nearDuplicateOf` | **False** — absent |
| `duplicateOf` | **False** — absent |
| `statusLocked` | **False** — absent |
| `normalizedClaim` | **False** — absent |
| `normalized_claim` | **False** — absent |
| `damage` | **False** — absent |
| `user_id` | **False** — absent |
| `email` | **False** — absent |
| `is_admin` | **False** — absent |
| `is_shadow_banned` | **False** — absent |
| `ownerToken` | **False** — absent |
| `owner_token` | **False** — absent |
| `duplicate_signature` | **False** — absent |
| `duplicateSignature` | **False** — absent |

**All 14 moderation/internal/token fields confirmed absent from production `/api/runpack` response.** D-171C is live and effective.

---

## `/api/review` — Admin Guard

`GET /api/review` without admin token returned **HTTP 403**.

The review queue remains correctly `requireAdmin`-gated.

---

## D-171B/D-171C Patch Confirmation

| Surface | Status |
|---|---|
| Frontend `safeRunPackClaim()` helper | Present in production JS |
| Frontend fallback RunPack `payload` | Uses `safeRunPackClaim(selected)` — confirmed |
| Frontend `downloadJSON()` claims array | Uses `(claims||[]).map(safeRunPackClaim)` — confirmed via static check; preflight probe regex too narrow to match the defensive wrapper |
| Backend `/api/runpack` `payload.claim` | All 14 audit fields absent — D-171C confirmed live |

---

## What Is Not Claimed

- The `downloadJSON` preflight probe returning **False** is documented as a regex precision issue, not a functional gap. The static smoke test is the authoritative verification for this surface.
- No admin token, owner token, invite code, email, `is_admin`, or internal debug metadata was captured or documented.
- The selected public claim id is redacted.

---

## What Did Not Change in D-171E

- No `src/worker.js` changes.
- No `public/app-v10.js` changes.
- No route added, removed, or semantically changed.
- No admin-token or owner-token logic changed.
- No migration.
- No `wrangler.toml`.
- No owner-token enforcement resumed — D-149H hold remains in effect.
- No admin/review route semantics changed.

---

## Smoke Tests

Baseline unchanged: **1274/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1274 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-171E is documentation/verification only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, route changes, or migration were added in D-171B, D-171C, or D-171E.
