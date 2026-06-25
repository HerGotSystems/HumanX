# D-171C — Backend RunPack Claim Payload Patch

**Date:** 2026-06-25
**Scope:** `src/worker.js`, `scripts/hardening-smoke-test.mjs`. No public API route changes, no migration, no wrangler.toml, no owner-token work.
**Source:** D-171B recommended next step; D-171A finding F1.

---

## What Changed

### `safeRunPackClaimBackend()` — new allowlist helper (`src/worker.js`)

Added immediately before `buildRunPack()`, following the same allowlist pattern as D-171B's frontend `safeRunPackClaim()`:

```js
// D-171C: allowlist helper for claim objects inside RunPack payloads — strips
// moderation/dedup/admin-internal fields not needed by outside AI consumers.
// mapClaim() is intentionally left unchanged; admin/review routes still receive the full set.
function safeRunPackClaimBackend(c) {
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
    reportCount: c.reportCount || c.report_count || 0,
    reviewState: c.reviewState || c.review_state || 'public',
    beliefYes: c.beliefYes || c.belief_yes || 0,
    beliefNo: c.beliefNo || c.belief_no || 0,
    uncertainty: c.uncertainty || 0,
    createdAt: c.createdAt || c.created_at || '',
    updatedAt: c.updatedAt || c.updated_at || '',
    handle: c.handle || 'anon',
  };
}
```

Uses an explicit allowlist. Any future field added to claim objects is automatically excluded from backend RunPack payloads unless explicitly added here.

---

### `buildRunPack()` — `payload.claim` patched

**Before:**
```js
function buildRunPack(detail, provenance) {
  return { ..., payload: detail };
}
```

`detail` contained `{ claim, evidence, pressure, tests, analyses }` where `claim` came from `claimOnly()` → `mapClaim()` — which includes `nearDuplicateOf`, `duplicateOf`, `statusLocked`.

**After:**
```js
function buildRunPack(detail, provenance) {
  return { ..., payload: { ...detail, claim: safeRunPackClaimBackend(detail.claim) } };
}
```

`detail.evidence`, `detail.pressure`, `detail.tests`, and `detail.analyses` are unchanged — they were already clean (explicit column SELECTs in `claimDetail()` exclude `user_id` and other sensitive fields per D-168B). Only `detail.claim` is sanitized.

---

## Why Backend RunPack Needed the Same Sanitization

D-171B patched the frontend fallback RunPack path and the JSON download. However, when the backend is available, `generateRunPack()` uses `data.packet` from `POST /api/runpack`, which is built by `buildRunPack(detail, provenance)` on the backend. That packet's `payload.claim` flowed from `mapClaim()` and included:

- `nearDuplicateOf` — internal near-duplicate advisory; could leak a non-public claim ID
- `duplicateOf` — admin-set canonical duplicate pointer (always null for public claims, but present as a key)
- `statusLocked` — admin protection boolean

These are moderation-internal fields with no value to an AI analysis consumer. D-171B demonstrated the correct sanitization pattern; D-171C applies the same principle to the backend-generated packet so both code paths are consistent.

---

## Fields Preserved in Backend RunPack Claim Payload

| Field | Why preserved |
|---|---|
| `id` | Claim identity — required for provenance |
| `claim` | Claim text — primary analysis input |
| `category` | Classification label — AI context |
| `type` | Physical/Testable/etc — AI context |
| `status` | Plausible/Proven/etc — AI context |
| `evidenceScore` | Computed score (camelCase and snake_case fallback) |
| `testability` | Computed score |
| `survivability` | Computed score |
| `contradictions` | Computed count |
| `reportCount` | Public report signal |
| `reviewState` | Public visibility state |
| `beliefYes`, `beliefNo`, `uncertainty` | Belief vote aggregates |
| `createdAt`, `updatedAt` | Timestamps |
| `handle` | Pseudonymous submitter handle — already public |

---

## Fields Excluded from Backend RunPack Claim Payload

| Field | Reason excluded |
|---|---|
| `nearDuplicateOf` / `near_duplicate_of` | Internal dedup advisory |
| `duplicateOf` / `duplicate_of` | Admin moderation field |
| `statusLocked` / `status_locked` | Admin protection flag |
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
| `duplicate_signature` / `duplicateSignature` | Not in claim objects |

`safeRunPackClaimBackend()` uses an explicit allowlist — omission is the default.

---

## What Did Not Change

- **`mapClaim()`** — unchanged. Admin/review routes still receive `nearDuplicateOf`, `duplicateOf`, `statusLocked`.
- **`claimDetail()`** — unchanged. Evidence, pressure, and tests SQL already uses explicit column SELECTs.
- **`createAipPacket()`** — unchanged except that `buildRunPack()` now applies the sanitization internally.
- **Public `/api/claims` route** — unchanged.
- **Admin/review routes** — unchanged; `requireAdmin`-gating intact.
- **Session bootstrap / localStorage / headers** — unchanged.
- **Owner-token behavior** — unchanged. D-149H hold in effect.
- **Frontend `safeRunPackClaim()`** — unchanged (D-171B intact).
- **No migration.**
- **No `wrangler.toml`.**
- **No database schema changes.**

---

## Smoke Tests

13 new tests added. All existing 1261 tests continue to pass.

| Test | What it verifies |
|---|---|
| `D-171C: safeRunPackClaimBackend helper exists in worker` | Helper defined in `src/worker.js` |
| `D-171C: buildRunPack uses safeRunPackClaimBackend for payload.claim` | Sanitized path confirmed |
| `D-171C: safeRunPackClaimBackend does not include nearDuplicateOf` | Dedup field excluded |
| `D-171C: safeRunPackClaimBackend does not include duplicateOf` | Dedup field excluded |
| `D-171C: safeRunPackClaimBackend does not include statusLocked` | Admin flag excluded |
| `D-171C: safeRunPackClaimBackend does not include normalizedClaim or normalized_claim` | Normalized field excluded |
| `D-171C: safeRunPackClaimBackend does not include damage` | Internal field excluded |
| `D-171C: safeRunPackClaimBackend does not include user_id, email, is_admin, is_shadow_banned` | User-private fields excluded |
| `D-171C: safeRunPackClaimBackend does not include ownerToken or owner_token` | Token fields excluded |
| `D-171C: safeRunPackClaimBackend does not include duplicate_signature or duplicateSignature` | Signature field excluded |
| `D-171C: backend mapClaim() still includes nearDuplicateOf, duplicateOf, statusLocked (unchanged)` | Confirms `mapClaim()` not changed |
| `D-171C: frontend safeRunPackClaim still exists (D-171B intact)` | D-171B not regressed |
| `D-171C: no owner-token enforcement resumed` | D-149H hold confirmed |

**New baseline: 1274/24/57**
(Previous: 1261/24/57. Net: +13 smoke tests.)

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, route changes, or migration were added.

---

## No Admin/Review Route Semantics Changed

`requireAdmin()`-gating on all review routes is unchanged. `mapClaim()` is unchanged — admin routes receiving it still get the full moderation field set.

---

## Recommended Next Step

The D-171 chain (A/B/C) is complete. Both the frontend fallback RunPack path and the backend-generated RunPack now produce sanitized `payload.claim` objects. No further RunPack claim payload work is pending.

Future optional work: apply the same allowlist pattern to mutation response payloads (`addEvidence()`, `addPressure()`, `addHomeTest()`) which were noted in D-168B as a lower-priority follow-on (those responses go only to the authenticated writing user, not to RunPack consumers).
