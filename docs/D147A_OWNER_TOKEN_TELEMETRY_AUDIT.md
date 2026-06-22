# D-147A — Owner Token Telemetry Audit (Before Enforcement)

**Date:** 2026-06-22
**Scope:** Read-only audit of the D-145B/D-146B/D-146C owner-token telemetry system, after confirmed live adoption, before any enforcement is considered.
**Outcome:** Docs-only checkpoint + one small smoke-test addition to lock current behavior. No backend enforcement. No route rejection changes. No frontend behavioral change. No secret handling change. No `wrangler.toml` change.

---

## 1. Routes Audited

Every route that currently calls `ownerTokenStatus()` and/or `logOwnerTokenTelemetry()`:

| Route | Handler | `userId` source | Telemetry call site |
|---|---|---|---|
| `GET /api/me` | `getMe()` | `await requireUser(request, env)` | `src/worker.js:125-126` |
| `GET /api/my-humanx` | `myHumanX()` | `await requireUser(request, env)` | `src/worker.js:156-157` |
| `POST /api/my-humanx/archive` | `archiveMyHumanXItem()` | `await requireUser(request, env)` | `src/worker.js:218-219` |
| `GET /api/my-humanx/export` | `exportMyHumanX()` | `await requireUser(request, env)` | `src/worker.js:270-271` |
| `POST /api/my-humanx/profile-settings` | `saveProfileSettings()` | `await requireUser(request, env)` | `src/worker.js:335-336` |
| `GET /api/belief-snapshots` | `listBeliefSnapshots()` | `requireUserId` (deliberately, see D-89D below) | `src/belief-snapshots.js:76-77` |
| `POST /api/belief-snapshots` | `saveBeliefSnapshot()` | `await requireUser(request)` (env-bound via dispatch) | `src/belief-snapshots.js:6-7` |
| `POST /api/belief-promote` | `promoteBeliefSnapshot()` | `await requireUser(request)` (env-bound via dispatch) | `src/belief-bridge.js:8-9` |

**Explicitly not instrumented, confirmed by direct inspection:**
- `GET /api/u/:slug` (`getPublicProfile()`) — zero references to `ownerTokenStatus`, `logOwnerTokenTelemetry`, or `requireUser` anywhere in the function body.
- `GET /u/:slug` (`renderPublicProfileShell()`) — same, zero references.
- Public-submit endpoints (`createClaim`, `addEvidence`, `addPressure`, `addHomeTest`, `reportTarget`) — all use `requireUser()` for identity, but none call `ownerTokenStatus()`/`logOwnerTokenTelemetry()`. Consistent with D-145A's original priority ordering: these mis-attribute new content if spoofed, rather than exposing/mutating another identity's private state, and were deliberately left out of the telemetry rollout.
- Admin/review endpoints (`requireAdmin`, `x-humanx-admin`) — entirely separate, non-overlapping system, confirmed untouched.

---

## 2. Current Token Flow

1. `POST /api/session` (`createOrGetUser()`) resolves/creates the `usr_*` row and, if `env.HUMANX_OWNER_SECRET` is set, mints `owner_token` (`signOwnerToken()` — HMAC-SHA256 via `crypto.subtle`, payload `{uid, iat, exp}`, ~90-day TTL). Returns `null` if the secret isn't configured.
2. `public/app-v10.js`'s `boot()` stores `owner_token` into the shared `humanx_public_user_v1` localStorage object as `user.ownerToken`, refreshed silently on every page load.
3. `headers()` (the single function backing every `api()` call) sends `x-humanx-owner-token: user?.ownerToken||''` **paired with** `x-humanx-user: user?.id||''` on every request — confirmed by direct grep there is no other place in `public/` that sends `x-humanx-owner-token` independently of `x-humanx-user`. The standalone Belief Engine bridge (`humanx-bridge.js`) follows the identical pairing on its one `/api/belief-snapshots` POST call.
4. On the server, each instrumented route resolves `userId` from the request (via `requireUser`/`requireUserId`, i.e. from the `x-humanx-user` header), then calls `ownerTokenStatus(request, env, userId)` with that **same** resolved `userId` as the expected match — never a body-supplied or otherwise independently-sourced id.

---

## 3. Current Telemetry Flow

`ownerTokenStatus(request, env, userId)` (`src/worker.js:792-808`) returns exactly one of six status strings, checked in this order:

| Bucket | Condition |
|---|---|
| `secret_missing` | `env.HUMANX_OWNER_SECRET` is unset |
| `missing` | Secret is set, but no `x-humanx-owner-token` header present |
| `invalid` | Token present but malformed, signature mismatch, or unparseable payload |
| `expired` | Token's `exp` has passed |
| `uid_mismatch` | Token's `uid` doesn't match the resolved `userId` |
| `valid` | All checks pass |

All six buckets are present, distinct, and correctly named exactly as specified. Confirmed by direct inspection of the function body — each bucket has its own `return` statement, no fallthrough ambiguity.

`logOwnerTokenTelemetry(routeName, status, extra)` (`src/worker.js:816-819`) is a single `console.log` call: `[owner-token] route=${routeName} status=${status}${uidPart}`, where `uidPart` is only the last 6 characters of the user id, never the full id, never the token, never the secret, never email or any other field.

---

## 4. Safety Confirmation

- **No request rejection depends on `owner_token` anywhere.** Confirmed by `grep` across `src/worker.js`, `src/belief-snapshots.js`, `src/belief-bridge.js`: `ownerStatus` (the captured result) is referenced exactly once per call site, and in every case that single reference is the argument to `logOwnerTokenTelemetry(...)` — never inside an `if`, never compared against `'valid'`/`'invalid'`/etc. to branch control flow.
- **No `OWNER_TOKEN_*` error code exists anywhere** (`OWNER_TOKEN_REQUIRED`, `OWNER_TOKEN_INVALID`, `OWNER_TOKEN_MISMATCH`, or any variant) — confirmed absent from all three files.
- **No migration exists for this system.** `migrations/` contains no owner-token-related file; the token is fully stateless (signature + expiry only).
- **No frontend enforcement exists.** `public/app-v10.js` and the Belief Engine bridge only ever *send* the header — neither contains any logic that reads a response status/error related to the owner token and changes UI behavior accordingly.
- **`wrangler.toml` is unchanged** — confirmed no `HUMANX_OWNER_SECRET` or owner-token-related key present; the secret remains external config only, set via `wrangler secret put`.
- **Telemetry call sites match the documented status buckets** — confirmed every one of the eight routes above logs the new six-bucket status (not the old three-bucket D-145B version), consistent with D-146B's actual shipped code.

---

## 5. Risks / Limitations

| Risk | Detail |
|---|---|
| **No persistent telemetry store** | `console.log` is visible only via `wrangler tail` (a live, point-in-time stream) — there is no historical record, no aggregation, no dashboard. Adoption confidence depends on manually sampling logs during an active session, as D-146C did. |
| **No sampling/rate awareness** | Every single instrumented request logs a line — at meaningful traffic volume this could be noisy, though at HumanX's current scale this is not yet a practical concern. |
| **Boot-race window still exists, now slightly more observable** | As noted in D-146A: a user who interacts with the app in the ~100-300ms window before `boot()`'s `/api/session` call resolves will produce a `missing` telemetry entry even though a token is about to arrive. This is expected, not a bug — but it means raw `missing` counts will always include some amount of this "always-was-going-to-resolve" noise, and should not be read as 1:1 "users without a token." |
| **`GET /api/belief-snapshots` still uses `requireUserId`, not `requireUser`** | Reconfirmed: this is the same deliberate D-89D design choice (shadow-banned users can still read their own snapshots) documented since D-145B — not an oversight, not something this audit recommends changing. |
| **No automated alerting if `secret_missing` reappears** | If the secret were ever accidentally unset or rotated incorrectly, the only way to notice is another manual `wrangler tail` check — there's no automated signal. |

---

## What Would Break If Enforcement Were Enabled Too Early

If a future patch flipped any of the eight instrumented routes to reject on `ownerStatus !== 'valid'` **today**, the following would break immediately:

- **Every request during the boot-race window** (any interaction in the first ~100-300ms after page load, before `/api/session` resolves) would be rejected as `missing`, even for the legitimate owner.
- **Any client whose `localStorage` was cleared, or any first-ever visit**, would have no token until the *next* page load completes its session call — the very first `/api/my-humanx`/`/api/me` call on a fresh session could be rejected if enforcement checked before the session call's response landed.
- **The standalone Belief Engine, opened directly without first visiting the main app**, would have no token in its shared `localStorage` object yet (it only *reads* `getOrCreateHumanXUser()`, it never calls `/api/session` itself) — its one `/api/belief-snapshots` POST would always show `missing`/be rejected unless the main app had been visited first in the same browser.
- **Any token issued before a future secret rotation** would suddenly show `invalid` (signature no longer matches) for its full remaining ~90-day lifetime, with no migration path other than the user's next `/api/session` call re-minting a fresh one — meaning a secret rotation, done carelessly, could cause a window of rejected requests for everyone with an outstanding token.
- **No telemetry-driven confidence interval exists yet** to know what fraction of real traffic would be affected by any of the above — exactly the gap this audit was commissioned to re-confirm is still open.

None of this is a defect in the current advisory-only system — it's the precise list of conditions a future enforcement patch must handle (grace periods, `secret_missing` short-circuiting, etc.) before it can safely ship.

---

## Not Ready for Enforcement Yet

This audit confirms D-146A's verdict still holds, now with live-traffic context added:

- Telemetry is real and live (confirmed by D-146C), but it is **observational only**, with no historical record beyond a live `wrangler tail` session — not yet a reliable basis for a "what fraction of traffic has a valid token" confidence number.
- The boot-race window and the standalone-Belief-Engine-without-prior-main-app-visit scenario are both real, unaddressed edge cases that enforcement would immediately surface as rejections for legitimate users.
- No secret-rotation safety net exists — enforcement would make a future rotation meaningfully riskier than it is today.

**Enforcement should not be scheduled until at least one of the risks above has a concrete mitigation plan, not just an awareness of it.**

---

## Recommended Next Patch

**D-147B — Telemetry hardening (recommended over D-146D log sampling).**

Reasoning: the audit's most actionable gap is the lack of any persistent record — a manual `wrangler tail` check (as done for D-146C) only proves the system works in the moment it's checked, not that it's been reliably working across real traffic over time. A log-sampling patch (D-146D) would help interpret a high-volume log stream, but HumanX's current traffic doesn't yet produce enough volume for sampling to be the binding constraint — persistence is. D-147B should focus narrowly on making telemetry **observable after the fact** (e.g. a lightweight counter in an existing or new low-risk table, or structured log fields that a future dashboard could ingest) without introducing any enforcement, migration risk, or new secret-handling surface. This directly unblocks the "no persistent telemetry store" risk above, which is the precondition every other enforcement-readiness question depends on.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 970 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```
