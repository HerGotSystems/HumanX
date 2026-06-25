# D-174A — Global Raw-Row / SELECT-Star Exposure Audit

**Date:** 2026-06-25
**Commit:** 8bb9cd0 (D-173D)
**Baseline:** 1300/24/57
**Type:** Audit only. No source code changed.

---

## Executive Summary

Audited all `src/*.js` modules and `src/worker.js` for `SELECT *`, raw DB row returns, object spreads into response payloads, and unfiltered response shapes. Covered 17 source files, all route handlers, all public/own-user/admin/export/auth surfaces.

**Result:** One new finding (F1) in an own-user route. All other raw-row returns fall into three categories:

1. **Admin-only routes** — gated by `requireAdmin()`, intentionally include sensitive fields for review work.
2. **GDPR own-data export** — `SELECT *` approved by D-138B, user receives their own data.
3. **Internal helpers** — SELECT * used for intermediate reads that are never directly serialized to the response.

No public unauthenticated route returns raw DB rows. No `is_admin`, `is_shadow_banned`, `email`, `owner_token`, `admin_token`, or `invite_code` values are exposed outside their intended auth-gated contexts. No catastrophic finding.

---

## Repo-Wide SELECT-Star Matrix

| File | Function | Table(s) | SELECT * Used | Final response disposition |
|---|---|---|---|---|
| `worker.js` | `listClaims()` | `claims + users` | `SELECT c.*, u.handle` | Through `mapClaim()` → safe |
| `worker.js` | `getClaim()` | `claims + users` | `SELECT c.*, u.handle` | Through `mapClaim()` → safe |
| `worker.js` | `createClaim()` | `claims + users` | `SELECT c.*, u.handle` (×2 incl. race) | Through `mapClaim()` → safe |
| `worker.js` | `claimOnly()` | `claims + users` | `SELECT c.*, u.handle` | Through `mapClaim()` → safe |
| `worker.js` | `markDuplicate()` | `claims + users` | `SELECT c.*, u.handle` | Through `mapClaim()` → safe |
| `worker.js` | `exportMyHumanX()` | claims, truths, evidence, pressure_points, belief_snapshots, claim_votes, evidence_votes, truth_votes, home_tests | `SELECT *` (×9 tables) | Raw results returned in GDPR download — approved by D-138B |
| `worker.js` | `archiveMyHumanXItem()` | dynamic table | `SELECT t.*, u.handle` | Not returned to client — used for ownership check only |
| `worker.js` | `addHomeTest()` | `home_tests + users` | `SELECT t.*, u.handle` | **Raw row returned in response as `test:row` — F1** |
| `worker.js` | `reviewDecision()` | truths / evidence / pressure | `SELECT *` (truths) / `SELECT e.*` / `SELECT p.*` | Raw `item:row` — admin-only, acceptable |
| `worker.js` | `reviewQueue()` | truths | `SELECT t.*` | Raw rows — admin-only, acceptable |
| `worker.js` | `debugState()` | claims (latest) | Explicit limited columns | Counts + last 5 claim stubs — admin-only |
| `belief-snapshots.js` | `saveBeliefSnapshot()` | `belief_snapshots` | `SELECT * WHERE id=?` | Through `mapBeliefSnapshot()` → safe |
| `belief-bridge.js` | `promoteToTruth()` | `truths` | `SELECT *` (×3 paths) | Through `mapTruth()` → safe |
| `belief-bridge.js` | `promoteToClaim()` | `claims` | `SELECT *` (×2 paths) | Through `mapClaim()` → safe |
| `belief-bridge.js` | `findExistingClaim()` | `claims` | `SELECT *` | Internal helper only — never serialized directly |
| `truth-claim-bridge.js` | `convertTruthToClaim()` | `truths` | `SELECT * WHERE id=?` | Internal only — `truth` used for fields, never dumped in response |
| `truth-claim-bridge.js` | `convertTruthToClaim()` | `claims` | `SELECT * WHERE id=?` (new claim path) | Through `mapClaim()` — fixed in D-173B |
| `truth-claim-bridge.js` | `findExistingClaim()` | `claims` | `SELECT *, NULL AS link_id` (×4 variants) | Internal helper — results passed through `mapClaim()` before response |
| `truth-claim-bridge.js` | `findNonPublicExistingClaim()` | `claims` | `SELECT *, NULL AS link_id` (×4 variants) | Internal helper — results passed through `mapClaim()` before response |
| `truth-claim-bridge.js` | `findExistingClaimByNormalizedKey()` | `claims` | `SELECT *, NULL AS link_id` | Internal helper — result passed through `mapClaim()` |
| `evidence-reuse.js` | `attachEvidenceToClaim()` | `evidence`, `claims` | `SELECT *` (×3 — evidence, claim, updatedClaim) | `evidence` used for `id` and `title` only; `updatedClaim` through `mapClaim()` → safe |
| `truths.js` | `createTruth()` | `truths` | `SELECT * WHERE normalized_statement=?` | Internal only — `existing.id` used, never serialized |
| `analysis-results.js` | `addAnalysisResult()` | `analysis_results` | `SELECT * WHERE id=?` | Through `mapAnalysis()` → safe |
| `belief-bridge.js` | `promoteBeliefSnapshot()` | `belief_snapshots` | `SELECT * WHERE id=? AND user_id=?` | Internal only — `snap` used for field extraction, never dumped |

---

## Raw-Row Return Matrix

| Route | Handler | Raw pattern | Exposure tier | Mapper applied | Verdict |
|---|---|---|---|---|---|
| POST /api/tests | `addHomeTest()` | `test: row` (SELECT t.*, u.handle) | Own-user | None | **F1 — Questionable** |
| POST /api/review/decision (truth) | `reviewDecision()` | `item: row` (SELECT * FROM truths) | Admin-only | None | Acceptable |
| POST /api/review/decision (evidence) | `reviewDecision()` | `item: row` (SELECT e.*, c.claim) | Admin-only | None | Acceptable |
| POST /api/review/decision (pressure) | `reviewDecision()` | `item: row` (SELECT p.*, c.claim) | Admin-only | None | Acceptable |
| GET /api/review | `reviewQueue()` | truths in review array (SELECT t.*) | Admin-only | None | Acceptable |
| GET /api/my-humanx/export | `exportMyHumanX()` | 9 × SELECT * tables | Own-user GDPR download | None (intentional) | Acceptable — D-138B |

---

## Findings and Risk Classification

### F1 — `addHomeTest()` — Own-user raw home_test row returned (Low risk, Questionable)

**File:** `src/worker.js`, line 751  
**Route:** POST `/api/tests` (requireUser gated)  
**Pattern:**
```
SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?
→ return json({ ok:true, test:row, claim:... })
```
**Table:** `home_tests`  
**Who sees it:** The submitting user only (requireUser enforced)  
**Fields in raw row:** `id`, `claim_id`, `user_id`, `title`, `instructions`, `safety_level`, `difficulty`, `created_at`, `updated_at`, `handle`  
**Already gated:** Yes — requireUser gated; this is the user's own data  
**Risk:** `user_id` is returned to the user who owns the test — they already know their own ID from `/api/session`. No sensitive admin/moderation fields exist on `home_tests`. However, the pattern is inconsistent with every other own-user write route, which all use explicit mappers. Any future addition of a column to `home_tests` (e.g., a moderation or admin flag) would be silently exposed.  
**Verdict:** Questionable — low current risk, structural debt. Recommend D-174B fix.

**Recommended D-174B action (P1):** Add `mapHomeTest(row)` returning explicit fields: `{ id, claimId: row.claim_id, title, instructions, safetyLevel: row.safety_level, difficulty, createdAt: row.created_at, updatedAt: row.updated_at, handle: row.handle || 'anon' }`. Replace `test:row` with `test:mapHomeTest(row)`. Omit `user_id` — the caller is the owner and does not need their own ID in the test object.

---

## Public Route Verdict

No public unauthenticated route returns a raw DB row or SELECT * result. All public routes use one of:
- `mapClaim()` — `listClaims`, `getClaim`, `createClaim`, vote response
- `mapTruth()` — `listTruths`, `createTruth`
- Explicit column lists — `listEvidenceVault`, `getPublicProfile`, `graphStatus`
- Error/metadata only — `reportTarget`, `addEvidence`/`addPressure` (pressure uses manual construction, evidence uses `insertEvidence` inline return)
- `buildRunPack()` / `safeRunPackClaimBackend()` — RunPack/AIP routes (D-171C allowlist)

**Result: All public routes pass. No raw row exposure to unauthenticated callers.**

---

## Own-User Route Verdict

Own-user routes use explicit column lists or mappers in all but one case:

| Route | Pattern | Safe? |
|---|---|---|
| GET /api/me | Explicit column list (id, handle, email, verified, display_name, trust_score, strike_count, created_at) | Yes |
| GET /api/my-humanx | Explicit column lists for all 5 tables | Yes |
| GET /api/my-humanx/export | SELECT * (×9 tables, D-138B approved GDPR export) | Yes — by design |
| POST /api/my-humanx/archive | Response is `{ ok, archived, targetType, targetId }` — no row returned | Yes |
| POST /api/my-humanx/profile-settings | Response is explicit safe fields | Yes |
| POST /api/auth/invite/redeem | Explicit column list for user row | Yes |
| POST /api/session | Explicit column list (id, handle, trust_score, strike_count) + owner_token (D-149H frozen) | Yes |
| GET /api/belief-snapshots | mapBeliefSnapshot() — includes userId (own) and raw (own submission) | Yes — own data |
| POST /api/belief-snapshots | mapBeliefSnapshot() | Yes |
| POST /api/belief-promote | mapTruth() / mapClaim() | Yes |
| POST /api/tests | **Raw SELECT t.*, u.handle — F1** | No — see F1 |
| POST /api/truth-to-claim | mapClaim() on all paths (D-173B) | Yes |
| POST /api/evidence-attach | mapClaim() on updatedClaim | Yes |
| POST /api/analysis | mapAnalysis() | Yes |
| POST /api/claim-vote | mapClaimLocal() | Yes |

**Result: One raw-row finding (F1) in own-user context. Low risk. All other own-user routes pass.**

---

## Admin Route Verdict

All admin routes are gated by `requireAdmin()` (constant-time `safeEqual()` check). Raw rows returned in admin-only paths are intentional — admin needs full context to make review decisions.

| Route | Raw surfaces | Intentional? |
|---|---|---|
| GET /api/review | Claims: explicit long column list incl. user_id, normalized_claim, duplicate_of, near_duplicate_of, damage, status_locked, archived_by_user. Truths: SELECT t.*. Evidence: explicit columns. Pressure: explicit columns. | Yes — admin review |
| POST /api/review/decision (truth) | SELECT * FROM truths → item:row | Yes — admin needs full truth |
| POST /api/review/decision (evidence) | SELECT e.*, c.claim → item:row | Yes — admin needs full evidence |
| POST /api/review/decision (pressure) | SELECT p.*, c.claim → item:row | Yes — admin needs full pressure |
| POST /api/review/cleanup | Explicit column lists per type | Yes |
| POST /api/review/mark-duplicate | mapClaim() on updated row | Yes — uses mapper |
| POST /api/review/resolve-similar | Metadata only | Yes |
| GET /api/auth/invite/create | Explicit column list for invite + code returned | Yes — admin creates invite |
| GET /api/debug | Aggregate counts + last 5 claim stubs (explicit columns) | Yes |
| GET /api/debug/owner-token-telemetry | Assembled result with uid_suffix (partial ID only) | Yes |
| GET /api/seed, /api/import-seed, /api/import-truths | Internal seeding, dry-run results | Yes |

**Result: All admin-route raw rows are gated by requireAdmin(). No admin field leaks to public or own-user contexts.**

---

## Internal Helper Verdict

Several functions use `SELECT *` internally but never serialize the raw row to a response:

| Function | File | Pattern | Disposition |
|---|---|---|---|
| `findExistingClaim()` | `truth-claim-bridge.js` | `SELECT *, NULL AS link_id` | Result passed through `mapClaim()` before response |
| `findNonPublicExistingClaim()` | `truth-claim-bridge.js` | `SELECT *, NULL AS link_id` | Result passed through `mapClaim()` before response |
| `findExistingClaimByNormalizedKey()` | `truth-claim-bridge.js` | `SELECT *, NULL AS link_id` | Result passed through `mapClaim()` |
| `findExistingClaim()` | `belief-bridge.js` | `SELECT *` FROM claims | Internal — used for linking, not returned |
| `promoteBeliefSnapshot()` snap load | `belief-bridge.js` | `SELECT * WHERE id=? AND user_id=?` | Internal — snap fields extracted, not serialized |
| `createTruth()` existing check | `truths.js` | `SELECT * WHERE normalized_statement=?` | `existing.id` only used — not returned |
| `attachEvidenceToClaim()` evidence/claim load | `evidence-reuse.js` | `SELECT *` (×2) | `evidence.id`/`title` used explicitly; claim through `mapClaim()` |

**Result: All internal-helper SELECT * are acceptable. Rows are never passed directly to response serialization.**

---

## Special Cases

### `exportMyHumanX()` — SELECT * GDPR Export (D-138B approved)

Route: GET `/api/my-humanx/export`. Returns SELECT * from 9 tables, all scoped to `WHERE user_id=?`. Requires `requireUser`. Users receive their own complete data as a JSON file download. The `users` row uses an explicit column list — `is_admin`, `is_shadow_banned`, `fingerprint_hash` are omitted even from the export. Approved by D-138B. No change recommended.

### `reviewQueue()` truth branch — `SELECT t.*` (admin-only)

The review queue uses `SELECT t.*` only for the truths sub-query. This returns `normalized_statement`, `linked_claim_id`, `user_id`, and all truth columns. Admin-only (requireAdmin gated). Admin intentionally needs this to assess truth content and decide on review disposition. No change recommended.

### `mapBeliefSnapshot()` — `userId` and `raw` fields in own-user response

`mapBeliefSnapshot()` returns `userId: row.user_id` and `raw: safeParse(row.raw_json)`. Both are the user's own data — they submitted the snapshot and the user_id is their own session identity. Own-user routes only (requireUser / requireUserId). No change recommended.

### `createOrGetUser()` — Returns `owner_token`

`/api/session` returns `{ user, owner_token }`. D-149H: owner-token work is frozen. Existing behavior preserved. Not changed.

### `addEvidence()` — `insertEvidence()` inline construction

`insertEvidence()` returns a manually constructed object `{ id, claim_id, stance, quality, title, body, source_url, created_at, review_state }`. No internal fields exposed. Acceptable.

---

## Watchlist: Fields to Monitor

| Field | Where found | Exposed to public? | Exposed to own-user? | Exposed to admin? | Status |
|---|---|---|---|---|---|
| `user_id` | home_tests row (F1) | No | Yes (own ID) | Yes (intentional) | Questionable in F1 |
| `user_id` | exportMyHumanX | No | Yes (own ID, D-138B) | — | Acceptable |
| `user_id` | reviewQueue, reviewDecision | No | No | Yes | Acceptable |
| `email` | getMe, myHumanX, exportMyHumanX, redeemInviteCode | No | Yes (own email) | — | Acceptable |
| `is_admin` | Never in any response | No | No | No | Clean |
| `is_shadow_banned` | Never in any response | No | No | No | Clean |
| `owner_token` | /api/session (D-149H frozen) | Yes (own token) | Yes | — | Frozen — not changing |
| `admin_token` / `HUMANX_ADMIN_TOKEN` | Never in any response | No | No | No | Clean |
| `invite_code` | /api/auth/invite/create response | No | No | Yes (admin creates) | Acceptable |
| `normalized_claim` | reviewQueue explicit columns | No | No | Yes | Acceptable (admin) |
| `duplicate_of` / `near_duplicate_of` | mapClaim() as camelCase, reviewQueue | Public via mapClaim() | Own via mapClaim() | Yes | mapClaim() camelCase — acceptable |
| `status_locked` | mapClaim() as statusLocked (bool), reviewQueue | Public via mapClaim() | Own via mapClaim() | Yes | mapClaim() camelCase bool — acceptable |
| `damage` | reviewQueue explicit column | No | No | Yes | Acceptable (admin) |
| `normalized_statement` | reviewQueue (t.*) | No | No | Yes | Acceptable (admin) |
| `raw_json` (belief snapshot) | mapBeliefSnapshot() as `raw` | No | Yes (own data) | — | Acceptable |
| `dimensions_json` etc. | mapBeliefSnapshot() as parsed objects | No | Yes (own data) | — | Acceptable |
| `archived_by_user` | reviewQueue explicit column | No | No | Yes | Acceptable (admin) |

---

## Recommended D-174B Patch List

Only one patch is recommended. All other surfaces are acceptable.

### P1 — `addHomeTest()` — Add `mapHomeTest()` mapper (Low priority)

**File:** `src/worker.js`  
**Change:** Add local `mapHomeTest(row)` function returning explicit safe fields. Replace `test:row` with `test:mapHomeTest(row)`.  
**Fields to include:** `id`, `claimId` (`row.claim_id`), `title`, `instructions`, `safetyLevel` (`row.safety_level`), `difficulty`, `createdAt` (`row.created_at`), `updatedAt` (`row.updated_at`), `handle` (`row.handle || 'anon'`).  
**Fields to omit:** `user_id` (caller is the owner, redundant), `claim_id` aliased to `claimId` (included above).  
**Risk if skipped:** Low — `home_tests` has no moderation/admin columns today. Future schema additions could silently expose new columns.  
**Priority:** Low. No current security impact.

No other backend patches recommended.

---

## Confirmed: No Catastrophic Findings

- No public unauthenticated route returns raw DB rows.
- No `is_admin`, `is_shadow_banned`, `admin_token`, `owner_token`, or `invite_code` is reachable from public or unauthorized contexts.
- No email or fingerprint hash is exposed in public routes.
- All review/admin routes are `requireAdmin()`-gated.
- All mappers (`mapClaim`, `mapTruth`, `mapAnalysis`, `mapBeliefSnapshot`, `mapClaimLocal`, local `mapClaim` in evidence-reuse/truth-claim-bridge/belief-bridge, `safeRunPackClaimBackend`) correctly omit internal fields.

---

## No Code Change Confirmation

No source code was changed in this task. `src/worker.js`, `public/app-v10.js`, and all `src/*.js` modules are unchanged from commit `8bb9cd0`.

## No Owner-Token Work Resumed

D-149H hold remains in effect. The audit noted the `/api/session` owner_token return as an existing frozen behavior — no recommendation, no change.

## Current Baseline

**1300/24/57** — unchanged from D-173D. No new tests added in this audit-only task.

---

## Recommended Next Step

D-174B — Patch `addHomeTest()` to use `mapHomeTest()` and omit `user_id` from the response. Single-function backend-only change. No schema change, no migration.
