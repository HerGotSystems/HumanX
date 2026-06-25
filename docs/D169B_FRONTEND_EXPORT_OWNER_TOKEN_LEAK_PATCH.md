# D-169B — Frontend Export ownerToken Leak Patch

**Date:** 2026-06-25
**Scope:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`. No backend changes, no migration, no wrangler.toml, no owner-token work.
**Source:** D-169A finding F2.

---

## What Changed

### `downloadJSON()` — sanitized user export

**File:** `public/app-v10.js` — lines immediately before `downloadJSON()`

**Before:**
```js
function downloadJSON(){
  const blob = new Blob(
    [JSON.stringify({user, claims, evidenceVault, truths, beliefSnapshots, graphStatus}, null, 2)],
    {type:'application/json'}
  );
  ...
}
```

The raw `user` object was spread directly into the export. The `user` object is the in-memory session state, which after `ensureSession()` may include `user.ownerToken` if the backend returned an owner token during session bootstrap.

**After:**
```js
// D-169B: export only safe pseudonymous user fields — never ownerToken, email, is_admin, is_shadow_banned.
function safeExportUser(){return{id:user?.id||'',handle:user?.handle||''}}
function downloadJSON(){
  const blob = new Blob(
    [JSON.stringify({user: safeExportUser(), claims, evidenceVault, truths, beliefSnapshots, graphStatus}, null, 2)],
    {type:'application/json'}
  );
  ...
}
```

---

## Why the Full `user` Export Was Unsafe

After `ensureSession()` completes, `POST /api/session` may return `owner_token` in the response body. The D-148A session bootstrap merges it silently:

```js
if (s.owner_token) user.ownerToken = s.owner_token;
localStorage.setItem(LS_USER, JSON.stringify(user));
```

The `user` object in memory (and in `localStorage`) therefore contains `user.ownerToken` for any session that successfully bootstrapped. The `downloadJSON()` "Download all visible data" export serialized the full `user` variable, including this field.

While `ownerToken` is D-149H advisory-only (no endpoint rejects on absence), it is still a session credential that:

- Could be included in a file the user accidentally shares
- Could be pasted into an AI alongside claim export data
- Would be visible to anyone who received the exported file

The fix is a single-point sanitization helper with an explicit allowlist of safe fields.

---

## Exact Fields Preserved in Export

| Field | Reason preserved |
|---|---|
| `id` | Pseudonymous user ID — needed for export correlation and product debug value |
| `handle` | Pseudonymous display name — included in the export for readability |

---

## Exact Fields Excluded from Export

| Field | Reason excluded |
|---|---|
| `ownerToken` | Session credential (advisory-only per D-149H, but still a token) |
| `owner_token` | Same (alternate key name) |
| `email` | Not present in the `user` in-memory object (only in `accountUser` from `/api/me`), but excluded from `safeExportUser()` by design |
| `is_admin` | Not returned by session bootstrap post-D-168B, but excluded by design |
| `is_shadow_banned` | Not returned by session bootstrap post-D-168B, but excluded by design |
| Admin token | Not in `user` object; excluded by design |

The `safeExportUser()` helper uses an explicit allowlist (`id`, `handle`) rather than a denylist, so any future field added to the `user` object is automatically excluded from exports unless explicitly added to the helper.

---

## D-169A Finding F1 — Not Patched in D-169B

D-169A F1 identified that the My HumanX account card shows the authenticated user their own `user.id` (as `<code>` in the Me panel) and email (if verified). This is intentional owner-facing display of the user's own account metadata and is not a leak to other users or the public.

This is accepted as-is. If desired, a follow-on could narrow the ID display to last-6-chars only, but it is out of scope for D-169B.

---

## What Did Not Change

- **Session bootstrap** — `ensureSession()` unchanged; still merges `owner_token` into `user.ownerToken` per D-148A design.
- **Owner-token behavior** — `headers()` still sends `user?.ownerToken||''` as `x-humanx-owner-token`; no enforcement added.
- **`localStorage` contents** — `LS_USER` still stores the full user object including `ownerToken` (needed for the advisory header). Only the export path is sanitized.
- **`downloadRunPack()`** — downloads `lastPacket` (RunPack JSON only); never included the `user` object. Unchanged and already safe.
- **`generateRunPack()`** / `buildProvenanceMeta()** — build packet from claim data only. Unchanged.
- **Admin token input** — remains `type="password"`. Unchanged.
- **No `console.*` calls** — none added.
- **No backend routes changed.**
- **No migration.**
- **No `wrangler.toml`.**
- **No admin/review route semantics changed.**

---

## Smoke Tests

9 new tests added. All existing 1240 tests continue to pass.

| Test | What it verifies |
|---|---|
| `D-169B: safeExportUser helper exists in frontend` | `safeExportUser()` is defined in `app-v10.js` |
| `D-169B: downloadJSON uses safeExportUser, not raw user object` | `downloadJSON` calls `safeExportUser()` and does not spread the raw `user` into `JSON.stringify` |
| `D-169B: safeExportUser does not include ownerToken` | Helper body contains no `ownerToken` or `owner_token` |
| `D-169B: safeExportUser does not include email, is_admin, is_shadow_banned` | Helper body contains none of these fields |
| `D-169B: admin token localStorage key not exported by safeExportUser` | Helper body does not reference `LS_ADMIN`, `adminToken`, or `humanx_admin_token` |
| `D-169B: admin token input remains type="password" in renderReview` | Password input masking intact |
| `D-169B: no console.* calls in frontend` | Zero `console.log/error/warn/debug/info` in `app-v10.js` |
| `D-169B: no owner-token enforcement resumed in frontend` | `OWNER_TOKEN_REQUIRED`/`OWNER_TOKEN_INVALID` absent from frontend |
| `D-169B: safeExportUser exports id and handle` | Helper includes `id:` and `handle:` |

**New baseline: 1249/24/57**
(Previous: 1240/24/57. Net: +9 smoke tests.)

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. `user.ownerToken` continues to be set in memory and sent as `x-humanx-owner-token` per D-148A design. No enforcement, soft warnings, route changes, or migration were added. The only change is that `ownerToken` is no longer written into the "Download all visible data" export file.

---

## No Backend Route Semantics Changed

No `src/worker.js`, `src/evidence-vault.js`, `src/graph-status.js`, or other backend file was modified. All public and admin routes are unchanged.

---

## Recommended Next Step

D-169C (optional): deploy metadata bump for D-169B (checkpoint `D-169B`, commit from this patch, baseline `1249/24/57`). Then owner-terminal live verification of the `downloadJSON` export shape — confirm `ownerToken` absent from the downloaded file.

Or continue to the next security area identified by the D-169A audit: the only remaining open finding is F1 (My HumanX user ID display), which is accepted as-is.
