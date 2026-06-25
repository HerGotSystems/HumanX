# D-171A — RunPack and Export Payload Allowlist Audit

**Date:** 2026-06-25
**Scope:** `public/app-v10.js`, `src/worker.js`. Audit only — no source code changes.
**Prior context:** D-169B added `safeExportUser()`. D-168B removed `user_id`, `is_shadow_banned`, `is_admin` from public claim/evidence/pressure responses.

---

## Executive Summary

All RunPack/export/copy/download payloads were audited across four surfaces: the backend-generated RunPack (`/api/runpack`), the frontend fallback RunPack, the JSON download export (`downloadJSON()`), and the clipboard copy (`copyAIP()`).

No admin token, owner token, invite code, email, `is_admin`, `is_shadow_banned`, raw user object, or secret material appears in any outbound payload.

One finding is noted:

**F1 (low, questionable):** `mapClaim()` — the shared backend claim-mapping function — includes three internal admin/dedup fields (`nearDuplicateOf`, `duplicateOf`, `statusLocked`) that flow into both the RunPack `payload.claim` and the JSON download export `claims` array. These are not user-private fields, but they are internal moderation metadata not required by an external AI analysis consumer. Recommend a `safeRunPackClaim()` helper in D-171B to strip them from RunPack and export payloads, consistent with the `safeExportUser()` pattern from D-169B.

No other findings. D-169B export containment remains intact. D-149H hold remains in effect.

---

## Payload Matrix

| Payload | Source | Consumed by | Private token risk | D-171B action |
|---|---|---|---|---|
| Backend RunPack (`/api/runpack`) | `buildRunPack(detail, provenance)` | Clipboard copy or download | None found | Strip internal dedup fields (F1) |
| Frontend fallback RunPack | `generateRunPack()` error path — `payload: selected` | Clipboard copy or download | None found | Strip internal dedup fields (F1, same `selected` object) |
| Clipboard copy (`copyAIP()`) | `lastPacket` string | AI tool pasted by user | Same as RunPack | Inherits D-171B fix |
| JSON download (`downloadJSON()`) | `safeExportUser()` + `claims, evidenceVault, truths, beliefSnapshots, graphStatus` | Downloaded file | None (user safe post-D-169B) | Strip internal dedup fields from `claims` (F1) |
| AI analysis import (`saveAnalysisResult()`) | Paste from user — reads and POSTs to `/api/analysis` | Backend only, no export | N/A — import, not export | No action |
| Truth ID copy (`copyTruthId()`) | `navigator.clipboard.writeText(id)` | User clipboard | None — ID only | No action |
| Admin invite code copy (`copyAdminInviteCode()`) | `navigator.clipboard.writeText(code)` | User clipboard (admin UI only) | Sensitive — invite code | Already admin-gated in UI; no public exposure |

---

## Field Allowlist / Denylist

### Tokens and Secrets

| Field | Present in any export/RunPack? | Classification |
|---|---|---|
| Admin token (`LS_ADMIN` value) | **No** | Correct |
| Owner token (`user.ownerToken`) | **No** (excluded by `safeExportUser()` — D-169B) | Correct |
| `HUMANX_OWNER_SECRET` | **No** | Correct |
| Invite code | **No** (admin clipboard copy is admin-UI-only, not part of RunPack or JSON export) | Acceptable |
| `x-humanx-admin` header value | **No** | Correct |
| `x-humanx-owner-token` header value | **No** | Correct |

### User Identity Fields

| Field | Present in any export/RunPack? | Classification |
|---|---|---|
| `user.id` (pseudonymous) | In JSON download via `safeExportUser()` — correct minimal exposure | Intentional per D-169B |
| `user.handle` (pseudonymous) | In JSON download via `safeExportUser()` — correct minimal exposure | Intentional per D-169B |
| `user.email` | **No** | Correct |
| `user.is_admin` | **No** | Correct |
| `user.is_shadow_banned` | **No** | Correct |
| `user_id` in RunPack evidence/pressure/tests | **No** — `claimDetail()` uses explicit column SELECTs that omit `user_id` (D-168B) | Correct |
| `handle` in RunPack `payload.claim` | **Yes** — pseudonymous claim submitter handle | Acceptable: public claim handle, not user_id |
| `handle` in RunPack `payload.evidence` | **No** — `claimDetail()` SQL for evidence does not include `handle` | Correct |
| `handle` in JSON download `claims` array | **Yes** — via `mapClaim()` | Acceptable: public claim handle |

### Internal Dedup / Moderation Fields

| Field | Present in any export/RunPack? | Classification |
|---|---|---|
| `normalized_claim` | **No** — excluded by `mapClaim()` (already correct pre-D-171A) | Correct |
| `damage` | **No** — excluded by `mapClaim()` (already correct) | Correct |
| `archived_by_user` | **No** — excluded by `mapClaim()` | Correct |
| `duplicate_signature` | **No** | Correct |
| `nearDuplicateOf` | **Yes** — in `mapClaim()` output; flows into RunPack `payload.claim` and JSON download `claims` | **F1 — questionable** |
| `duplicateOf` | **Yes** — in `mapClaim()` output; always null for public claims but still present as key | **F1 — questionable** |
| `statusLocked` | **Yes** — in `mapClaim()` output; boolean admin lock flag | **F1 — questionable** |

### Raw Debug / JSON Blob Fields

| Field | Present in any export/RunPack? | Classification |
|---|---|---|
| `dimensions_json` | **No** | Correct |
| `stress_points_json` | **No** | Correct |
| `contradictions_json` | Belief snapshot data (`beliefSnapshots`) is in JSON download only, not RunPack. `contradictions_json` is not returned by `/api/my-humanx` belief-snapshot route; only the computed `contradiction_count` and scalar fields are present | Correct |
| `raw_json` | **No** | Correct |
| `top_beliefs_json` | Not exported in JSON download — `beliefSnapshots` comes from `/api/my-humanx` which returns the parsed snapshot fields, not the raw blob | Correct |

---

## RunPack Verdict

**Backend RunPack (`POST /api/runpack` → `buildRunPack`):**

The packet structure is:

```
{
  packet_id, runpack_version, generated_at, source_claim_id, source_snapshot_hash,
  evidence_count, pressure_count, test_count, humanx_worker_version, is_fallback,
  legacy_aip_version, aip_version, packet_type, app, mode, no_owner_api_used,
  instruction, output_contract,
  payload: {
    claim: mapClaim(row),       ← includes nearDuplicateOf, duplicateOf, statusLocked
    evidence: [...],            ← id, created_at, title, body, quality, source_url, stance, link_type, linked_stance, link_note
    pressure: [...],            ← id, created_at, title, body, severity
    tests: [...],               ← id, updated_at, created_at, title, instructions, safety_level, difficulty
    analyses: [...]             ← saved analysis results
  }
}
```

**Token/secret material:** None.

**Private user fields:** None — `user_id` excluded from evidence/pressure/tests SQL (D-168B). `handle` in `payload.claim` is pseudonymous submitter handle, same as public `/api/claims` response.

**Finding F1:** `payload.claim.nearDuplicateOf`, `payload.claim.duplicateOf`, `payload.claim.statusLocked` are internal admin/dedup fields not required by an external AI analysis consumer. For public claims `duplicateOf` is always null (marked-duplicate claims cannot pass the `reviewState === 'public'` gate in `createAipPacket`). `nearDuplicateOf` could be a non-null claim ID advisory. `statusLocked` is a boolean. None are secrets, but they are internal moderation metadata.

**Fallback RunPack (frontend, backend unavailable):**

```js
lastPacket = JSON.stringify({
  ...provenance, is_fallback: true, ...,
  payload: selected   // ← frontend's current `selected` claim object
}, null, 2);
```

`selected` is populated from the public `/api/claims` API response, which goes through `mapClaim()`. Same `nearDuplicateOf`, `duplicateOf`, `statusLocked` fields apply. No token material.

---

## JSON Download Verdict

`downloadJSON()` exports:

```js
{
  user: safeExportUser(),   // ← { id, handle } only — D-169B clean
  claims,                    // ← from loadClaims() / /api/claims → mapClaim() — includes F1 fields
  evidenceVault,             // ← from /api/evidence-vault — D-168B clean (no user_id)
  truths,                    // ← from /api/truths — public truth data
  beliefSnapshots,           // ← from /api/my-humanx — own user's snapshots, no token
  graphStatus                // ← from /api/graph-status — aggregate public data
}
```

**Token/secret material:** None — `safeExportUser()` confirmed D-169B-clean.

**Private user fields:** None in vault, truths, or graphStatus. `beliefSnapshots` are own-user data (authenticated). `claims` array includes F1 fields via `mapClaim()`.

---

## Clipboard Copy Verdict

`copyAIP()` copies `lastPacket` (the RunPack JSON string) to clipboard. Same content as RunPack — no additional fields. Token material absent.

`copyTruthId()` copies a truth ID string only. Clean.

`copyAdminInviteCode(code)` copies an invite code to clipboard. This function is rendered only inside the admin review UI (requires admin token entry and is behind `adminHeaders()` calls). The invite code itself is sensitive but is only reachable by an authenticated admin. No public exposure. Classified as acceptable admin tooling.

---

## AI Import Verdict

`saveAnalysisResult()` reads a user-pasted JSON blob, extracts `output`, and POSTs to `/api/analysis`. This is an import function — no data is exported or copied to clipboard. The pasted blob may contain AI return data; only `result.output || result.result || result.analysis || result` is sent to the backend. No token material is extracted or forwarded.

---

## Docs / Checkpoint Verdict

Reviewed D-169B patch doc, D-169D live verify doc, D-170A containment audit:

- No real token values, owner token values, invite codes, or admin token values appear in any doc.
- D-169D correctly documents the `owner_token` presence in `/api/session` response as existing advisory behavior.
- No throwaway live-verify IDs appear in docs beyond redacted `[redacted]` references.

**Verdict:** Clean. No docs-level leaks.

---

## Findings

### F1 — `mapClaim()` exposes internal dedup/admin fields in RunPack and JSON download (low, questionable)

**Files:**
- `src/worker.js` — `mapClaim()` (line ~852), `buildRunPack()` (line ~846)
- `public/app-v10.js` — fallback RunPack path (line ~388), `downloadJSON()` (line 396)

**Fields:** `nearDuplicateOf` (`near_duplicate_of` DB column), `duplicateOf` (`duplicate_of` DB column), `statusLocked` (`status_locked` DB column)

**What happens:**
- `mapClaim()` includes all three in its return object.
- `buildRunPack()` passes `detail.claim` (from `claimOnly()` → `mapClaim()`) directly into `payload.claim` with no stripping.
- The frontend fallback RunPack includes `selected` (from `/api/claims` → `mapClaim()`) directly in `payload`.
- `downloadJSON()` includes the `claims` array from `loadClaims()` which calls `/api/claims` → `mapClaim()`.

**Who can see it:** Any user who downloads the JSON export or builds and downloads/copies a RunPack.

**Risk classification:**
- These are not secrets. No token, email, or user-identity material.
- `duplicateOf` will always be null for public claims (the claim's `review_state` must be `'public'` to pass `createAipPacket`'s guard).
- `nearDuplicateOf` may be a non-null claim ID pointing to another claim — an internal advisory set at submission time. Leaking a non-public claim's ID via `nearDuplicateOf` is a minor information disclosure (the ID, not the claim content).
- `statusLocked` is a boolean admin protection flag. Low sensitivity.
- None of these are needed by an external AI analysis consumer.

**Note:** `normalized_claim`, `damage`, `user_id`, `archived_by_user` are already excluded by `mapClaim()` — this was correct before D-171A.

**Recommended D-171B action:**

Add a `safeRunPackClaim()` helper in `src/worker.js` that strips `nearDuplicateOf`, `duplicateOf`, `statusLocked` from the claim object before it enters `buildRunPack()`. This is the same pattern as D-169B's `safeExportUser()`:

```js
// Proposed D-171B helper — strips internal dedup/admin fields from RunPack payload
function safeRunPackClaim(claim) {
  if (!claim) return null;
  const { nearDuplicateOf, duplicateOf, statusLocked, ...safe } = claim;
  return safe;
}
// Usage in buildRunPack():
// payload: { ...detail, claim: safeRunPackClaim(detail.claim) }
```

Optionally apply the same sanitization to the `claims` array in `downloadJSON()` via a `safeExportClaim()` helper in `app-v10.js`.

**Risk if not patched:** Low. No private user data or token material involved. This is internal moderation state leaking to an external AI consumer, which is unnecessary but not dangerous.

---

## Consolidated Verify Checklist

| Check | Result |
|---|---|
| No `console.*` calls in frontend (`app-v10.js`) | **Pass** — zero `console.*` calls |
| Admin token input is `type="password"` | **Pass** — `<input id="adminToken" type="password" ...>` |
| RunPack does not include admin/owner token values | **Pass** — confirmed absent |
| RunPack does not include `user_id` in evidence/pressure/tests | **Pass** — explicit column SELECTs (D-168B) |
| RunPack does not include `normalized_claim`, `damage`, `archived_by_user` | **Pass** — excluded by `mapClaim()` |
| Frontend download export uses `safeExportUser()` | **Pass** — D-169B confirmed |
| `downloadJSON()` does not include `ownerToken` | **Pass** — D-169B confirmed |
| Public `/api/claims` does not expose `is_admin`, `is_shadow_banned`, `user_id` | **Pass** — D-168B, `mapClaim()` exclusions |
| `/api/review` remains `requireAdmin`-gated | **Pass** |
| No owner-token work resumed | **Pass** — D-149H hold intact |
| `copyAdminInviteCode` admin-gated in UI | **Pass** — only rendered inside admin review panel |

---

## Recommended D-171B Patch List

**D-171B (low priority, scoped fix):**

1. Add `safeRunPackClaim(claim)` helper in `src/worker.js` — strips `nearDuplicateOf`, `duplicateOf`, `statusLocked` from RunPack `payload.claim`.
2. Apply in `buildRunPack()`: `payload: { ...detail, claim: safeRunPackClaim(detail.claim) }`.
3. Optionally add `safeExportClaim(c)` helper in `public/app-v10.js` for `downloadJSON()` to strip same fields from the exported `claims` array.
4. Add smoke tests verifying the RunPack `payload.claim` does not include these three fields.

This is a low-risk, bounded patch. `mapClaim()` itself should remain unchanged — it is legitimately used by admin review routes that need `nearDuplicateOf`, `duplicateOf`, and `statusLocked`.

No other patches recommended from this audit.

---

## No Code Changes in D-171A

`src/worker.js`, `public/app-v10.js`, and all other source files were read and audited only. No modifications were made.

---

## Smoke Tests

Baseline unchanged: **1249/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1249 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-171A is audit only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, migration, route changes, or behavioral changes were made or recommended.
