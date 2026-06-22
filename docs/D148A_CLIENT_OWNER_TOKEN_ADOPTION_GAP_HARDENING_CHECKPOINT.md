# D-148A — Harden Client Owner Token Adoption

**Date:** 2026-06-22
**Chain:** D-145A→C (advisory foundation) → D-146A→C (telemetry + live adoption) → D-147A (audit) → D-147B→C (persistent telemetry, shipped + production-confirmed) → D-148A (this doc — client-side adoption gap hardening)
**Scope:** Frontend only (`public/app-v10.js`, `public/apps/humanx-belief-engine/humanx-bridge.js`). No backend logic change, no migration, no `wrangler.toml` change, no enforcement.

---

## What Client Gaps Existed

D-147A's audit identified three concrete client-side scenarios that would cause real, legitimate requests to show up as `missing` telemetry — and would have been outright *rejected* had enforcement been live:

1. **Boot-race window.** `boot()` called `POST /api/session` once, inline, but no other owner-sensitive call site (`loadMe`, `renderMe`, `exportMyHumanXData`, `saveProfileSettingsUI`, `meArchiveItemUI`, `meShareSnapshotUI`, `loadBeliefSnapshots`, `promoteBelief`) waited for that call to resolve before firing. A user interacting with the app in the ~100–300ms window before `/api/session` resolved would fire an owner-sensitive request with no `ownerToken` yet present, even though one was about to arrive.
2. **Standalone Belief Engine never guaranteed `/api/session` first.** `public/apps/humanx-belief-engine/humanx-bridge.js` only ever *read* the shared `humanx_public_user_v1` localStorage object via `getOrCreateHumanXUser()` — it never called `/api/session` itself. A user opening the standalone Belief Engine directly (without first visiting the main app in the same browser) would never have an `ownerToken`, no matter how long they waited, and its one `POST /api/belief-snapshots` call would always show `missing`.
3. **Stale local user object without `ownerToken`.** Any previously-stored `humanx_public_user_v1` object created before `HUMANX_OWNER_SECRET` was set in production (D-146C) would have no `ownerToken` field. Without an explicit re-bootstrap point, this would only resolve itself on a `boot()` call that happened to also complete a fresh `/api/session` round-trip before the user interacted with anything.

---

## What Was Hardened

### 1. New idempotent `ensureSession()` helper (`public/app-v10.js`)

```js
let _sessionBootstrapPromise = null;
async function ensureSession(){
  if (!user) user = localUser();
  if (!_sessionBootstrapPromise) {
    _sessionBootstrapPromise = (async () => {
      try {
        const s = await api('/api/session', { method: 'POST', body: JSON.stringify(user) });
        if (s.user) user = { ...user, ...s.user };
        if (s.owner_token) user.ownerToken = s.owner_token;
        localStorage.setItem(LS_USER, JSON.stringify(user));
      } catch (_) { /* advisory-only — never blocks the caller */ }
    })();
  }
  return _sessionBootstrapPromise;
}
```

- **Idempotent / safe to call from many places, many times**: the first call creates one in-flight promise; every subsequent call (even before the first resolves) returns that same promise. No duplicate `/api/session` round-trips.
- **Merges the returned user into local state**, and stores `ownerToken` only on the in-memory `user` object and in `localStorage` — never anywhere else, never logged.
- **Never throws.** A failed `/api/session` call (network error, backend down, anything) is swallowed — the app continues exactly as it did before this patch, fully advisory-only with whatever `ownerToken` (possibly none) was already present.

### 2. Every owner-sensitive frontend call site now awaits it first

| Route | Call site | Change |
|---|---|---|
| `GET /api/me` | `loadMe()` | `await ensureSession();` added before the `api()` call |
| `GET /api/my-humanx` | `renderMe()` | same |
| `POST /api/my-humanx/archive` | `meArchiveItemUI()` (inside `onConfirm`) | same |
| `GET /api/my-humanx/export` | `exportMyHumanXData()` | same |
| `POST /api/my-humanx/profile-settings` | `saveProfileSettingsUI()`, `meShareSnapshotUI()` | same |
| `GET /api/belief-snapshots` | `loadBeliefSnapshots()` | same |
| `POST /api/belief-promote` | `promoteBelief()` | same |

`boot()` itself was simplified to call the same shared helper (`await ensureSession();`) instead of duplicating the merge/persist logic inline — removing the only other place that logic existed, so there is now exactly one implementation to keep correct.

### 3. Standalone Belief Engine bridge gets its own session bootstrap

`public/apps/humanx-belief-engine/humanx-bridge.js` is a separate page with no access to `app-v10.js`'s module scope, so it needed its own equivalent helper:

```js
let _bridgeSessionPromise = null;
async function ensureHumanXSession(user) {
  if (!_bridgeSessionPromise) {
    _bridgeSessionPromise = (async () => {
      try {
        const res = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(user) });
        const data = await res.json().catch(() => ({}));
        if (data.user) Object.assign(user, data.user);
        if (data.owner_token) user.ownerToken = data.owner_token;
        localStorage.setItem(HUMANX_USER_KEY, JSON.stringify(user));
      } catch (_) { /* advisory-only */ }
    })();
  }
  return _bridgeSessionPromise;
}
```

`sendBeliefEngineToHumanX()` now calls `await ensureHumanXSession(user);` immediately after resolving the local user and before building/sending the snapshot — guaranteeing a session-bootstrap attempt happens even if the user never visited the main app first, while remaining fully advisory: if the bootstrap fails, the snapshot is still sent with whatever token (possibly none) was already available, exactly as before.

### 4. `headers()` unchanged — confirmed, not modified

`headers()` in `app-v10.js` was deliberately left untouched: `x-humanx-owner-token` is still only ever sent in the same call as `x-humanx-user`, never independently. Confirmed by a dedicated smoke test counting exactly two senders across both frontend files (the one `headers()` definition and the one bridge `fetch` call), each pairing both headers together.

---

## What Remains Advisory-Only

- `ownerTokenStatus()`'s result is still never used to allow or reject any request, anywhere — confirmed by a dedicated D-148A smoke test asserting no `OWNER_TOKEN_*` error code and no `ownerStatus !== 'valid'`-style branching exists anywhere in `worker.js` after this patch.
- Both new client bootstrap helpers (`ensureSession()`, `ensureHumanXSession()`) are explicitly fail-open: a failed `/api/session` call never blocks, never throws to the caller, and the app/bridge continue working with whatever token state already existed.
- No backend route's behavior changed in this patch — `src/worker.js`, `src/belief-snapshots.js`, and `src/belief-bridge.js` are untouched.
- No migration, no `wrangler.toml` change.

---

## What Is Still Not Ready for Enforcement

This patch closes the three specific client-side gaps D-147A identified, but does not change the overall enforcement-readiness verdict:

- **The boot-race window is narrowed, not eliminated.** `ensureSession()` makes every owner-sensitive call *wait* for the bootstrap attempt rather than racing it, which removes the false `missing` telemetry these call sites previously produced — but the underlying `/api/session` round-trip still takes nonzero time, and a sufficiently fast double-click or programmatic call immediately on page load could still observe an unresolved state. The difference is that now every owner-sensitive call site *will* wait for that resolution rather than firing blind.
- **No secret-rotation safety net exists yet.** A future `HUMANX_OWNER_SECRET` rotation would still invalidate every outstanding token for its full remaining ~90-day lifetime, with no migration path beyond the next successful `ensureSession()`/`ensureHumanXSession()` call re-minting a fresh one. This patch does not address that.
- **No accumulated telemetry has been reviewed yet.** D-147C confirmed persistence is *working* in production, but no one has yet looked at the actual `missing`/`invalid`/`uid_mismatch` rates via `GET /api/debug/owner-token-telemetry` to judge what fraction of real traffic would be affected by enforcement. That review is still the binding next step before any enforcement decision, now made meaningfully easier by both this patch (which should reduce false `missing` noise from the closed gaps) and D-147B/C (which makes that data queryable at all).

---

## Recommended Next Patch

**Review accumulated telemetry via `GET /api/debug/owner-token-telemetry`** now that (a) persistence is confirmed working in production (D-147C) and (b) the known client-side gaps that were producing false-negative `missing` telemetry have been closed (this patch). A meaningful sample of post-D-148A traffic should be reviewed to get a real read on adoption health — specifically the `missing`/`invalid`/`uid_mismatch` rates — before D-147A's original enforcement-readiness questions can be reconsidered with confidence.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 993 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

10 new smoke tests added (Section 79), covering: `ensureSession()` existence/idempotency/never-throws, no token logging, every owner-sensitive call site awaiting it, `boot()` using the shared helper instead of duplicating logic, `headers()` unchanged, the bridge's own session bootstrap existing and being called before the snapshot POST, the bridge bootstrap's idempotency, the owner-token-header-pairing invariant across both frontend files, no backend enforcement added, and no migration/`wrangler.toml` change. `belief-engine-static-check.mjs` and `worker-route-static-check.mjs` are unchanged — this patch never touches backend code.
