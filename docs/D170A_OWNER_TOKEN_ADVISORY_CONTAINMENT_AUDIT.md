# D-170A — Owner-Token Advisory Containment Audit

**Date:** 2026-06-25
**Scope:** `src/worker.js`, `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, docs D-148 onward. Audit only — no source code changes.

---

## Executive Summary

The owner-token system is advisory-only per D-149H and operates correctly within that policy. No endpoint currently rejects a missing or invalid owner token. The token is minted on `POST /api/session`, stored in `localStorage` as part of the user object, sent back as `x-humanx-owner-token` on every API request, and logged to the `owner_token_telemetry` table server-side for aggregate observability only.

Post-D-169B, the export/download surface is clean: `safeExportUser()` prevents the in-memory `ownerToken` from appearing in any downloaded file.

Two minor items are noted for future awareness:
- **F1 (low, advisory):** `logOwnerTokenTelemetry()` calls `console.log()` at the backend (server-side Cloudflare Worker log only — not the browser frontend). This is intentional and not a browser exposure.
- **F2 (low, acceptable):** `owner_token` is present in the `/api/session` response body and stored in `localStorage` alongside `id` and `handle`. This is the designed D-148A advisory bootstrap. No action warranted.

No catastrophic leaks found. No immediate patches required. D-149H hold remains in effect.

---

## Owner-Token Flow

```
HUMANX_OWNER_SECRET (Worker env secret, never in wrangler.toml)
    │
    ▼
signOwnerToken(env, userId)          ← backend, POST /api/session (createOrGetUser)
    │
    ▼ { user, owner_token }
POST /api/session response body
    │
    ▼
ensureSession() [app-v10.js]
    ├── user.ownerToken = s.owner_token
    └── localStorage.setItem(LS_USER, JSON.stringify(user))
    │
    ▼
headers() [app-v10.js]
    └── 'x-humanx-owner-token': user?.ownerToken || ''
        (sent on every api() call)
    │
    ▼
Backend route handlers (getMe, myHumanX, archiveMyHumanXItem, exportMyHumanX,
saveProfileSettings, saveBeliefSnapshot, promoteBeliefSnapshot, listBeliefSnapshots)
    ├── ownerTokenStatus(request, env, userId) → status string
    └── logOwnerTokenTelemetry(env, request, route, status, ...) → DB insert + console.log
        (never rejects — advisory only)
```

---

## Containment Matrix

### 1. Session Response

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| `POST /api/session` response body | Returns `{ user, owner_token }` | The requesting browser session only | **Intentional — D-148A advisory bootstrap** |
| `owner_token` value in response | HMAC-signed opaque token (not a raw secret) | Requesting browser only | Acceptable |

**Verdict:** Expected and correct. The session response returns `owner_token` by design. D-169D confirmed this is live. It is a derived signed token, not the raw `HUMANX_OWNER_SECRET`.

---

### 2. localStorage

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| `LS_USER` (`humanx_public_user_v1`) | Stores `{ id, handle, ownerToken }` after session bootstrap | Browser's own localStorage — same-origin only | Acceptable |
| `HUMANX_OWNER_SECRET` | Never stored in localStorage | N/A | Correct |

**Verdict:** `ownerToken` in localStorage is bounded by same-origin policy. An XSS vulnerability would be required to extract it from a third-party context. The existing `safeHttpUrl()` + `esc()` guards (D-104B) close the known XSS surface.

---

### 3. In-Memory Frontend `user` Object

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| `user.ownerToken` in memory | Set by `ensureSession()` from session response | Browser JS runtime only | Acceptable |
| `downloadJSON()` export | **Post-D-169B:** uses `safeExportUser()` → `{ id, handle }` only | Exported file | **Fixed by D-169B** |
| `generateRunPack()` / `buildProvenanceMeta()` | Never references `user.ownerToken` | RunPack JSON | **Correct — never included** |
| `lastPacket` (fallback RunPack) | Uses `payload: selected` (claim data) — no `user` object | RunPack JSON | **Correct** |

**Verdict:** In-memory `ownerToken` is not accessible to any UI surface or download after D-169B.

---

### 4. Request Headers

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| `x-humanx-owner-token` header | Sent on every `api()` call via `headers()` | Backend Worker only | **Intentional — D-145B advisory design** |
| `x-humanx-admin` header | Separate, read from `LS_ADMIN` via `adminHeaders()` | Backend Worker only | Correct |

**Verdict:** The owner token is sent as a request header to the backend on every call. This is the designed advisory mechanism. The backend reads it via `ownerTokenStatus()` but never rejects on absence or mismatch.

---

### 5. Backend Logging (`logOwnerTokenTelemetry`)

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| `console.log(...)` in `logOwnerTokenTelemetry` | Logs `route=X status=Y uid_suffix=Z` | Cloudflare Worker logs (server-side only — not browser console) | **Intentional, acceptable** |
| DB insert into `owner_token_telemetry` | Stores `route`, `status`, `uid_suffix` (last 6 chars), `user_agent_hash`, `created_at` | Admin-gated `/api/debug/owner-token-telemetry` read only | Acceptable |
| Token value itself | **Never logged** — only the status bucket (valid/invalid/missing/expired/uid_mismatch/secret_missing) | N/A | **Correct** |
| `HUMANX_OWNER_SECRET` | **Never logged** | N/A | **Correct** |

**Verdict:** The backend `console.log` is a Cloudflare Worker server-side log, not the browser frontend. It does not appear in `public/app-v10.js`. The telemetry table never stores the raw token or secret. The D-169B check `D-169B: no console.* calls in frontend` correctly targets the frontend only and passes.

---

### 6. Admin Review UI

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| Owner token in review queue data | Not returned by `/api/review` — review queue rows contain claim/truth/evidence fields only | N/A | **Correct — not present** |
| Owner token in review inspect panel | Not rendered by `renderReviewInspectPanel()` | N/A | **Correct** |

**Verdict:** Owner token is absent from all review queue data and UI.

---

### 7. Public UI

| Surface | Detail | Who sees it | Classification |
|---|---|---|---|
| DOM rendering | `ownerToken` is never passed to any template string, `esc()` call, or DOM text node | Public page visitors | **Correct** |
| `toast()` calls | Never includes token value | Public page visitors | **Correct** |
| Status bar / handle display | Shows `user.handle` only | Public page visitors | **Correct** |

**Verdict:** Owner token is never rendered into the page DOM.

---

### 8. Public API Responses

| Route | Returns `owner_token`? | Classification |
|---|---|---|
| `POST /api/session` | **Yes** — returns `owner_token` per D-148A | Intentional advisory bootstrap |
| `GET /api/me` | No | Correct |
| `GET /api/my-humanx` | No | Correct |
| `GET /api/my-humanx/export` | No | Correct |
| `GET /api/claims` | No | Correct |
| `GET /api/claims/:id` | No | Correct |
| `GET /api/evidence-vault` | No | Correct |
| `GET /api/graph-status` | No | Correct |
| `GET /api/u/:slug` | No | Correct |
| `GET /api/truths` | No | Correct |

**Verdict:** Only `/api/session` returns `owner_token`. All other public routes do not. This is the correct and designed scope.

---

### 9. User Export / Download

| Surface | Detail | After D-169B | Classification |
|---|---|---|---|
| `downloadJSON()` | Exports `{ user: safeExportUser(), claims, ... }` | `safeExportUser()` returns `{ id, handle }` only — `ownerToken` absent | **Fixed by D-169B** |
| `downloadRunPack()` | Downloads `lastPacket` (claim RunPack JSON) | Never contained `user.ownerToken` | **Always correct** |
| `GET /api/my-humanx/export` | Backend data export — returns user claims/truths/evidence/snapshots | No `owner_token` in response — backend does not include it | **Correct** |

**Verdict:** Post-D-169B, no download or export path includes `ownerToken`.

---

### 10. Docs / Checkpoints

Searched all docs from D-148 onward for `owner_token`, `ownerToken`, `HUMANX_OWNER_SECRET`.

| Finding | Detail | Classification |
|---|---|---|
| D-148A/D-148C docs describe the advisory bootstrap | Uses generic descriptions — no token values pasted | Correct |
| D-149H/D-149E docs describe D-149H freeze and telemetry | No token values | Correct |
| D-166A/D-166D mention owner token as advisory | Audit/verify language only — no values | Correct |
| D-169D documents that `/api/session` returns `owner_token` | States presence as fact, no value captured | **Correct — precise** |
| `HUMANX_OWNER_SECRET` value | Never appears in any doc | Correct |
| Raw token values | Never pasted in any doc | Correct |

**Verdict:** No docs contain real owner-token values, the raw secret, or any session token material.

---

## Findings

### F1 — Backend `console.log` in `logOwnerTokenTelemetry` (low, intentional)

**File:** `src/worker.js` — `logOwnerTokenTelemetry()` (line ~971)

```js
console.log(`[owner-token] route=${routeName} status=${status}${uidPart}`);
```

**Who sees it:** Cloudflare Worker server-side logs only (accessible to account owner via Cloudflare dashboard). Not the browser JavaScript console. Not `public/app-v10.js`.

**What is logged:** Route name, status bucket (never the token value), and optionally a 6-char uid suffix.

**Classification:** Intentional. The `uid_suffix` is the last 6 characters of the user ID — not the full ID, not the token. This is existing D-147B telemetry design.

**D-170B action:** None required. The D-169B smoke test `D-169B: no console.* calls in frontend` correctly targets `app-v10.js` only and correctly passes.

---

### F2 — `owner_token` in `/api/session` response and `localStorage` (low, advisory behavior)

**File:** `src/worker.js` — `createOrGetUser()` / `public/app-v10.js` — `ensureSession()`

**What happens:** Backend mints an HMAC-signed token and returns it as `owner_token` in the session response. Frontend stores it as `user.ownerToken` in `localStorage` and sends it as `x-humanx-owner-token` on subsequent requests.

**Who can see it:** The browser's own localStorage (same-origin only). Server-side Worker handlers (never rejected, advisory only).

**Classification:** Intentional preserved D-148A behavior. This is the designed advisory bootstrap that D-149H froze in place. The token is not the raw secret; it is a derived HMAC proof-of-receipt with a 90-day TTL.

**D-170B action:** None required by D-149H freeze. If enforcement is ever unthawed, this would be the starting point for verifying the mechanism is wired correctly — the infrastructure is already in place. That is a separate future design decision, not recommended as a D-170B task.

---

## Smoke Test Coverage

Existing tests that cover owner-token containment:

| Test | What it covers |
|---|---|
| `D-145B: POST /api/session returns owner_token` | Minting confirmed |
| `D-145B/D-148A: public/app-v10.js stores owner_token from session response` | `ensureSession()` bootstrap confirmed |
| `D-145B: public/app-v10.js sends x-humanx-owner-token header` | Header confirmed present in `headers()` |
| `D-145B: advisory mode does not enforce rejection` | `ownerTokenStatus` never throws/returns HTTP error |
| `D-146B: each existing advisory call site captures ownerTokenStatus result` | Telemetry coverage confirmed |
| `D-168B: no owner-token enforcement resumed` | `OWNER_TOKEN_REQUIRED`/`OWNER_TOKEN_INVALID` absent from worker |
| `D-169B: safeExportUser does not include ownerToken` | Export sanitization confirmed |
| `D-169B: downloadJSON uses safeExportUser, not raw user object` | Export path confirmed |
| `D-169B: no owner-token enforcement resumed in frontend` | Frontend enforcement absence confirmed |

The existing test suite provides adequate coverage of the advisory containment boundaries. No new tests are added in D-170A (audit only).

---

## Verdict Summary

| Surface | Status |
|---|---|
| `/api/session` returns `owner_token` | Intentional advisory bootstrap — correct per D-148A/D-149H |
| `localStorage` stores `ownerToken` | Acceptable — same-origin bounded |
| In-memory `user.ownerToken` | Acceptable — never rendered to DOM |
| Request header `x-humanx-owner-token` | Intentional advisory design |
| Frontend console logging | None — `public/app-v10.js` has zero `console.*` calls |
| Backend Worker logging | Advisory telemetry only — route/status/uid_suffix, never token value |
| Export/download after D-169B | Clean — `safeExportUser()` returns `{ id, handle }` only |
| Public API responses (other than `/api/session`) | No `owner_token` in any public route |
| Admin review UI | No `owner_token` present |
| Public profile rendering | No `owner_token` present |
| Docs | No token values, no raw secret |

---

## Recommended Next Step

No immediate patches are required. The owner-token system is correctly contained within its D-148A/D-149H advisory scope.

If the D-149H freeze is ever lifted, the recommended next step would be a dedicated design audit of the enforcement path — `ownerTokenStatus()` already distinguishes six status buckets (valid/missing/invalid/expired/uid_mismatch/secret_missing) and the telemetry infrastructure is in place. That is a future, separate decision.

---

## No Code Changes in D-170A

`src/worker.js`, `public/app-v10.js`, and all other source files were read and audited only. No modifications were made.

---

## Smoke Tests

Baseline unchanged: **1249/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1249 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-170A is audit only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. This audit describes existing behavior. No enforcement, soft warnings, migration, route changes, or behavioral changes were made or recommended as immediate action.
