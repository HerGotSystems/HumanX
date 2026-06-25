# D-171B — RunPack / Export Claim Payload Patch

**Date:** 2026-06-25
**Scope:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`. No backend changes, no migration, no wrangler.toml, no owner-token work.
**Source:** D-171A finding F1.

---

## What Changed

### `safeRunPackClaim()` — new allowlist helper (`public/app-v10.js`)

Added immediately after `safeExportUser()` (D-169B), following the same pattern:

```js
// D-171B: export only public analysis fields from a claim —
//         strip moderation/dedup/admin-internal fields never needed by AI consumers.
function safeRunPackClaim(c) {
  if (!c) return null;
  return {
    id: c.id || '',
    claim: c.claim || '',
    category: c.category || '',
    type: c.type || '',
    status: c.status || '',
    evidenceScore: c.evidenceScore ?? c.evidence_score ?? 0,
    testability: c.testability ?? 0,
    survivability: c.survivability ?? 0,
    contradictions: c.contradictions ?? 0,
    reportCount: c.reportCount || 0,
    reviewState: c.reviewState || 'public',
    beliefYes: c.beliefYes || 0,
    beliefNo: c.beliefNo || 0,
    uncertainty: c.uncertainty || 0,
    createdAt: c.createdAt || c.created_at || '',
    updatedAt: c.updatedAt || c.updated_at || '',
    handle: c.handle || 'anon',
  };
}
```

Uses an explicit allowlist. Any future field added to claim objects is automatically excluded from RunPack and export payloads unless explicitly added here.

---

### `generateRunPack()` — fallback path patched

**Before:**
```js
lastPacket = JSON.stringify({
  ...provenance, is_fallback: true, ...,
  payload: selected        // ← raw claim object
}, null, 2);
```

**After:**
```js
lastPacket = JSON.stringify({
  ...provenance, is_fallback: true, ...,
  payload: safeRunPackClaim(selected)   // ← sanitized claim object
}, null, 2);
```

The backend-success path (`data.packet` from `/api/runpack`) is unaffected — the backend already controls its own field shape, and D-171B is a separate future concern for the backend's `buildRunPack()` function if desired.

---

### `downloadJSON()` — claims array patched

**Before:**
```js
JSON.stringify({ user: safeExportUser(), claims, evidenceVault, ... })
```

**After:**
```js
JSON.stringify({ user: safeExportUser(), claims: (claims || []).map(safeRunPackClaim), evidenceVault, ... })
```

Each claim in the JSON download export is now sanitized through the same allowlist.

---

## Why Moderation Fields Were Stripped

`mapClaim()` (backend) includes three internal moderation/dedup fields:

| Field | DB column | Purpose |
|---|---|---|
| `nearDuplicateOf` | `near_duplicate_of` | Advisory near-duplicate pointer set at submission time |
| `duplicateOf` | `duplicate_of` | Admin-set canonical duplicate target |
| `statusLocked` | `status_locked` | Admin protection flag preventing review state changes |

These fields serve admin moderation workflows. They are not meaningful to an external AI analysis consumer processing a RunPack. `nearDuplicateOf` could leak a non-public claim ID as an advisory reference. The others are always null/false for standard public claims but were present as unnecessary keys.

The backend `mapClaim()` is intentionally NOT changed — admin and review routes depend on these fields.

---

## Fields Preserved in RunPack / Export Claim Objects

| Field | Why preserved |
|---|---|
| `id` | Claim identity — required for provenance |
| `claim` | Claim text — primary analysis input |
| `category` | Classification label — AI context |
| `type` | Physical/Testable/etc — AI context |
| `status` | Plausible/Proven/etc — AI context |
| `evidenceScore` | Computed score — AI context |
| `testability` | Computed score — AI context |
| `survivability` | Computed score — AI context |
| `contradictions` | Computed count — AI context |
| `reportCount` | Public report signal — AI context |
| `reviewState` | Public visibility state — AI context |
| `beliefYes`, `beliefNo`, `uncertainty` | Belief vote aggregates — AI context |
| `createdAt`, `updatedAt` | Timestamps — AI provenance |
| `handle` | Pseudonymous submitter handle — already public |

---

## Fields Excluded from RunPack / Export Claim Objects

| Field | Reason excluded |
|---|---|
| `nearDuplicateOf` | Internal dedup advisory — not relevant to AI analysis |
| `duplicateOf` | Admin moderation field — not relevant to AI analysis |
| `statusLocked` | Admin protection flag — not relevant to AI analysis |
| `normalizedClaim` / `normalized_claim` | Not in `mapClaim()` output; excluded by design |
| `damage` | Not in `mapClaim()` output; excluded by design |
| `user_id` | Not in `mapClaim()` output; excluded by D-168B |
| `archived_by_user` | Not in `mapClaim()` output; excluded by design |
| `email` | Not in claim objects |
| `is_admin` | Not in claim objects |
| `is_shadow_banned` | Not in claim objects |
| `ownerToken` / `owner_token` | Not in claim objects |
| Admin token | Not in claim objects |
| Invite code | Not in claim objects |
| `duplicate_signature` | Not in claim objects |

`safeRunPackClaim()` uses an explicit allowlist — omission is the default, not enumeration of denied fields.

---

## What Did Not Change

- **Backend `mapClaim()`** — unchanged. Admin/review routes still receive `nearDuplicateOf`, `duplicateOf`, `statusLocked`.
- **Public `/api/claims` route** — unchanged.
- **`/api/runpack` backend response** — unchanged. The backend's `buildRunPack()` still produces its own packet; the frontend merges it via `{ ...data.packet, ...provenance }`. The backend packet's own `payload.claim` is not affected by this frontend patch. A future D-171C could apply an equivalent sanitization at the backend.
- **Session bootstrap / localStorage / headers** — unchanged.
- **Owner-token behavior** — unchanged. D-149H hold in effect.
- **Admin token input** — still `type="password"`, unchanged.
- **`safeExportUser()`** — unchanged; still returns `{ id, handle }`.
- **No `console.*` calls added.**
- **No backend routes changed.**
- **No migration.**
- **No `wrangler.toml`.**
- **No admin/review route semantics changed.**

---

## Smoke Tests

12 new tests added. All existing 1249 tests continue to pass.

| Test | What it verifies |
|---|---|
| `D-171B: safeRunPackClaim helper exists in frontend` | Helper is defined in `app-v10.js` |
| `D-171B: fallback RunPack uses safeRunPackClaim(selected), not raw selected` | Fallback path patched |
| `D-171B: downloadJSON claims array uses safeRunPackClaim, not raw claims` | Export path patched |
| `D-171B: safeRunPackClaim does not include nearDuplicateOf` | Dedup field excluded |
| `D-171B: safeRunPackClaim does not include duplicateOf` | Dedup field excluded |
| `D-171B: safeRunPackClaim does not include statusLocked` | Admin flag excluded |
| `D-171B: safeRunPackClaim does not include ownerToken or owner_token` | Token field excluded |
| `D-171B: safeRunPackClaim does not include user_id, email, is_admin, is_shadow_banned` | User-private fields excluded |
| `D-171B: safeRunPackClaim exports core analysis fields` | Allowlisted fields present |
| `D-171B: backend mapClaim() is not changed` | Confirms `mapClaim()` still has all three moderation fields |
| `D-171B: no owner-token enforcement resumed in frontend` | D-149H hold confirmed |
| `D-171B: no console.* calls in frontend` | Zero console calls |

**New baseline: 1261/24/57**
(Previous: 1249/24/57. Net: +12 smoke tests.)

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, route changes, or migration were added. The only changes are the `safeRunPackClaim()` helper and its application to the fallback RunPack and `downloadJSON()`.

---

## No Backend Route Semantics Changed

No `src/worker.js` or any backend file was modified. All public and admin routes are unchanged. `mapClaim()` is unchanged.

---

## Recommended Next Step

Optional D-171C: apply equivalent sanitization on the backend `buildRunPack()` function in `src/worker.js` — add a `safeRunPackClaim()` helper there too, so the backend-generated RunPack (`/api/runpack`) response also strips `nearDuplicateOf`, `duplicateOf`, `statusLocked` from `payload.claim`. This D-171B patch only covers the frontend fallback path and the JSON download.
