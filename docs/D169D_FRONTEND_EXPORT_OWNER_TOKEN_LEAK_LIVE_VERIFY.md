# D-169D — Live Verify Frontend Export ownerToken Patch

**Date:** 2026-06-25
**Scope:** Live verification of D-169B export patch. No code, route, migration, wrangler.toml, or owner-token changes in this task.

---

## What This Documents

D-169B patched the frontend export leak identified in D-169A finding F2:

- Added `safeExportUser()` helper returning only `{ id, handle }`.
- Changed `downloadJSON()` to pass `user: safeExportUser()` instead of the raw `user` object.
- The raw `user` object in memory may contain `ownerToken` after `ensureSession()`. D-169B prevents that field from being written into the "Download all visible data" export file.

This document records production evidence confirming the D-169B changes are live and correct. No claim is made beyond what the preflight output shows.

---

## Production Commit State

| Field | Value |
|---|---|
| Local HEAD | `1293b05` (D-169C — Bump deploy metadata for D-169B) |
| D-169B frontend export patch commit | `036c016` |
| Deployed to origin/main | confirmed |

---

## Production Health

`GET /api/health` returned:

- `ok: true`
- `mode: d1-live`

Production is running in live D1 mode. Not demo fallback.

---

## Frontend JS Source Checks

The production `app-v10.js` was fetched and inspected.

| Check | Result |
|---|---|
| `safeExportUser` function defined | **True** — present in production JS |
| `downloadJSON` uses `safeExportUser()` | **True** — confirmed |
| Raw `user` object in `downloadJSON` `JSON.stringify` | **False** — absent; replaced by `safeExportUser()` call |
| Admin token input `type="password"` | **True** — masking intact |
| `console.log`/`console.error`/`console.warn` present | **False** — no console logging in frontend |

---

## `/api/session` — Session Response Shape

A throwaway pseudonymous user was created for preflight only. The user id is redacted from this document per security rules.

| Field | Present in response? |
|---|---|
| `ownerToken` (camelCase) | **False** — absent |
| `owner_token` (snake_case) | **True** — present (see note below) |
| `is_shadow_banned` | **False** — absent |
| `is_admin` | **False** — absent |

### Precision note on `owner_token`

`/api/session` returns `owner_token` (snake_case) in its response body. This is the existing D-148A session bootstrap behavior: the backend mints and returns an advisory owner token which the frontend merges into `user.ownerToken` via `ensureSession()`.

**This is outside the D-169B patch scope.** D-169B patched the *export* path — preventing the in-memory `user.ownerToken` from being written into the "Download all visible data" JSON file. It did not remove `owner_token` from the `/api/session` response, and no such change was claimed.

The `owner_token` field in the session response is preserved existing advisory behavior per D-149H. It is not enforcement. The preflight confirms it is present, and that is the correct and expected state.

**No owner-token work is resumed by D-169B or D-169D.** If the session response shape is audited in a future task, it should be treated as an independent scope from the export leak patch.

---

## `/api/review` — Admin Guard

`GET /api/review` without admin token returned **HTTP 403**.

The review queue remains correctly `requireAdmin`-gated.

---

## D-169B Export Patch Confirmation

D-169B's core claim — that `downloadJSON()` no longer writes `ownerToken` into the export — is confirmed by the production JS source checks above:

- `safeExportUser()` is defined and present in production.
- `downloadJSON()` calls `safeExportUser()` rather than spreading the raw `user` object.
- The raw `user` spread pattern is absent from `downloadJSON`.

A user who runs "Download all visible data" on the production build will receive a JSON file with `user: { id, handle }` only — not `user.ownerToken`.

---

## What Did Not Change in D-169D

- No `src/worker.js` changes.
- No `public/app-v10.js` changes.
- No route added, removed, or semantically changed.
- No admin-token or owner-token logic changed.
- No migration.
- No `wrangler.toml`.
- No owner-token enforcement resumed — D-149H hold remains in effect.

---

## What Is Not Claimed

- The `owner_token` field was not removed from `/api/session` — the preflight confirms it is present. This is correct existing behavior.
- No admin token, invite code, email, `is_admin`, or internal debug metadata was captured in this verification.
- The local `safeExportUser()` call path was not exercised live (no export download was triggered via the browser UI) — confirmed at source level only.

---

## Smoke Tests

Baseline unchanged: **1249/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1249 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-169D is documentation/verification only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. The presence of `owner_token` in the `/api/session` response is preserved existing advisory behavior. No enforcement, soft warnings, route changes, or migration were added in D-169B or D-169D.
