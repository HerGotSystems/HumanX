# D-175A — Public Abuse and Rate-Limit Guardrail Audit

**Date:** 2026-06-25
**Entering commit:** 4f746c8 (D-174D — Live verify home test raw-row response patch)
**Entering baseline:** 1308/24/57
**Type:** Audit only. No source code changes.

---

## Executive Summary

All public write routes use review-first behavior — no content submitted by users becomes publicly visible without admin approval. Rate limits are present on all write routes except `/api/session`. Vote counts cannot be inflated (idempotent). Report counts are per-user per-target deduped (D-173B). Shadow-ban enforcement is active on all `requireUser`-gated routes.

Three findings warrant D-175B patches:

| # | Route / Function | Risk | Priority |
|---|---|---|---|
| F1 | `/api/session` has no rate limit | Low–Medium | Medium |
| F2 | `addEvidence()` does not verify claim existence | Low | Low–Medium |
| F3 | `addPressure()` does not verify claim existence | Low | Low–Medium |

No catastrophic issues found. No immediate code changes required in D-175A.

---

## Public Write Route Abuse Matrix

| Route | Function | Auth | Rate Limit | Dedupe | Review-First | Row Creation Risk | Response Exposure Risk | Verdict |
|---|---|---|---|---|---|---|---|---|
| `POST /api/session` | `createOrGetUser` | None | **None** | `INSERT OR IGNORE` (per user_id) | N/A — creates user row | Low: idempotent per ID, but unbounded IDs | Clean: `id, handle, trust_score, strike_count` only | **Questionable (F1)** |
| `POST /api/claims` | `createClaim` | `requireUser` | 8/hr/IP | `normalized_claim` unique | Yes (`review_state='review'`) | Bounded | `mapClaim()` | Acceptable |
| `POST /api/evidence` | `addEvidence` | `requireUser` | 20/hr/IP | None | Yes (`review_state='review'`) | **No claim existence check (F2)** | Explicit response object | **Questionable (F2)** |
| `POST /api/pressure` | `addPressure` | `requireUser` | 20/hr/IP | None | Yes (`review_state='review'`) | **No claim existence check (F3)** | Explicit response object | **Questionable (F3)** |
| `POST /api/tests` | `addHomeTest` | `requireUser` | 20/hr/IP | None | No (`home_tests` has no `review_state`) | Claim existence verified | `mapHomeTest()` (D-174B) | Acceptable |
| `POST /api/truths` | `createTruth` | `requireUser` | 12/hr/IP | `normalized_statement` unique | Yes (`review_state='review'`) | `linkedClaimId` validated (D-173B) | Explicit response fields | Acceptable |
| `POST /api/truth-to-claim` | `convertTruthToClaim` | `requireUser` (admin-exempt) | 8/hr/IP | `normalized_claim` unique | Yes (`review_state='review'`) | `mapClaim()` on all 4 paths (D-173B) | `mapClaim()` | Acceptable |
| `POST /api/evidence-attach` | `attachEvidenceToClaim` | `requireUser` | 20/hr/IP | Bridge table unique | Yes | Both IDs verified | Explicit response fields | Acceptable |
| `POST /api/report` | `reportTarget` | `requireUser` | 20/hr/IP | Per-user per-target (D-173B) | N/A | targetType allowlist (D-173B) | `{ ok:true }` | Acceptable |
| `POST /api/claim-vote` | `voteClaim` | `requireUser` | 120/hr/userId+IP | Idempotent UPDATE | N/A | Cannot inflate counts | `mapClaimLocal()` | Acceptable |
| `POST /api/belief-snapshots` | `saveBeliefSnapshot` | `requireUser` | 20/hr/IP | None | N/A — private | Low: own snapshots only | Explicit fields | Acceptable |
| `POST /api/belief-promote` | `promoteBeliefSnapshot` | `requireUser` | 10/hr/IP | None | Yes (truth + claim both `review`) | Ownership-checked | `mapClaim()` | Acceptable |
| `POST /api/analysis` | `addAnalysisResult` | `requireUser` | 20/hr/IP | None | No (`analysis_results` has no `review_state`) | Claim existence verified | Explicit fields | Acceptable |
| `POST /api/runpack` | `createAipPacket` | **None** | 20/hr/IP | N/A | N/A — reads only public claims | Stores `aip_packets` row (internal) | Public claim data only | Acceptable |
| `POST /api/invite-redeem` | `redeemInviteCode` | `requireUser` | 8/hr/IP | Code uniqueness enforced | N/A | Clean | `{ ok:true, handle }` | Acceptable |
| `POST /api/my-humanx/archive` | `archiveMyHumanXItem` | `requireUser` | None | Ownership-checked | N/A — affects own content only | No new rows | `{ ok:true }` | Acceptable |
| `POST /api/my-humanx/profile-settings` | `saveProfileSettings` | `requireUser` | None | `profile_slug` unique | N/A — own profile | No new rows | `{ ok:true }` | Acceptable |
| `POST /api/my-humanx/export` | `exportMyHumanX` | `requireUser` | 5/hr/userId | N/A | N/A | No new rows | Own data GDPR export (D-138B) | Acceptable |

---

## Rate-Limit Coverage Matrix

| Route | Key Pattern | Max | Window | Notes |
|---|---|---|---|---|
| `/api/session` | **No rate limit** | — | — | **F1** |
| `/api/claims` | `claim:${ip}` | 8 | 1 hr | Bounded |
| `/api/evidence` | `evidence:${ip}` | 20 | 1 hr | Bounded |
| `/api/pressure` | `pressure:${ip}` | 20 | 1 hr | Bounded |
| `/api/tests` | `tests:${ip}` | 20 | 1 hr | Bounded |
| `/api/truths` | `truth:${ip}` | 12 | 1 hr | Bounded |
| `/api/truth-to-claim` | `truth-claim:${ip}` | 8 | 1 hr | Admin-exempt |
| `/api/evidence-attach` | `evidence-attach:${ip}` | 20 | 1 hr | Bounded |
| `/api/report` | `report:${ip}` | 20 | 1 hr | Bounded |
| `/api/claim-vote` | `vote:${userId}:${ip}` | 120 | 1 hr | Dual key — user + IP |
| `/api/belief-snapshots` (POST) | `belief-snapshot:${ip}` | 20 | 1 hr | Bounded |
| `/api/belief-promote` | `belief-promote:${ip}` | 10 | 1 hr | Bounded |
| `/api/analysis` | `analysis:${ip}` | 20 | 1 hr | Bounded |
| `/api/runpack` | `runpack:${ip}` | 20 | 1 hr | Bounded |
| `/api/invite-redeem` | `invite-redeem:${ip}` | 8 | 1 hr | Bounded |
| `/api/my-humanx/export` | `my-humanx-export:${userId}` | 5 | 1 hr | User-keyed |
| `/api/my-humanx/archive` | **No rate limit** | — | — | Own content only; acceptable |
| `/api/my-humanx/profile-settings` | **No rate limit** | — | — | Own profile only; acceptable |

**Rate limit key reliability:** All `ip(request)` calls read `cf-connecting-ip` (set by Cloudflare edge, not user-spoofable on Workers deployment). Acceptable for this deployment model.

---

## Duplicate / Dedupe Coverage Matrix

| Resource | Dedupe Mechanism | Behavior on Duplicate |
|---|---|---|
| Claims | `normalized_claim` DB unique constraint | Returns existing claim, no new row |
| Truths | `normalized_statement` DB unique constraint | Returns existing truth, no new row |
| Evidence | **None** | New row created each submission |
| Pressure points | **None** | New row created each submission |
| Home tests | None | New row created each submission |
| Votes | Idempotent UPDATE (no INSERT) | Count unchanged, last vote value wins |
| Reports | Per-user per-target open-report check (D-173B) | Returns `{ ok:true, duplicate:true }`, no INSERT |
| Belief snapshots | None | New snapshot created (private) |
| Analysis results | None | Appended (no public impact) |
| AIP packets | None | New packet created (internal) |

---

## Review-Queue Spam Verdict

**Maximum queue load from a single IP per hour:**
- 8 claims (normalized-deduped, rate-limited)
- 12 truths (statement-deduped, rate-limited)
- 20 evidence rows (no content dedupe, rate-limited)
- 20 pressure rows (no content dedupe, rate-limited)

**Total: up to 60 new review-queue rows/hr/IP**

**Mitigating factors:**
- All content enters `review_state='review'` — zero public impact before admin approval
- Evidence and pressure have minimum length guards (`note.length < 3` rejected)
- Each row requires a valid session (`requireUser` + `ensureUser`)
- Shadow-banned users are blocked by `requireUser` on all these routes
- Home tests (20/hr/IP) and analysis results (20/hr/IP) do not enter the admin review queue

**Verdict:** Bounded and review-gated. Not a safety issue (no public content created). An admin review queue pollution risk exists but is constrained by IP rate limits and review-first gating. No emergency patch required.

---

## Vote / Report Abuse Verdict

**Votes:**
- `voteClaim` uses `vote:${userId}:${ip(request)}` — doubly keyed on user ID and IP
- Implementation: idempotent UPDATE on existing `claim_votes` row — repeated calls change the vote value, never add new count
- **Cannot inflate vote counts.** Verdict: Acceptable.

**Reports:**
- `reportTarget` has per-user per-target open-report dedupe (D-173B): `SELECT id FROM reports WHERE target_id=? AND reporter_id=? AND status='open' LIMIT 1`
- A single user cannot increment the same target's `report_count` twice via two requests — duplicate returns `{ ok:true, duplicate:true }` without INSERT
- 5 distinct users can each report the same target — triggering auto-requeue is intentional design
- Rate limit is 20/hr/IP — 20 different targets can be reported per hour per IP
- **Cannot inflate report count on a single target beyond 1 per user.** Verdict: Acceptable.

---

## RunPack / Import Abuse Verdict

**`createAipPacket` (RunPack):**
- No `requireUser` — fully anonymous
- Rate-limited 20/hr/IP
- Requires a valid public claim (`review_state='public'` enforced)
- Creates an `aip_packets` row (internal storage, not surfaced to other users)
- Does not create any content that enters the review queue
- Verdict: Acceptable. Intentionally open for external AI consumers; existing-claim gate prevents spam creation.

**`addAnalysisResult` (Analysis import):**
- `requireUser`-gated, rate-limited 20/hr/IP
- Claim existence verified before INSERT
- `analysis_results` table is append-only; no `review_state`
- Not surfaced to other users without claim public status
- Verdict: Acceptable.

---

## Findings and Risk Classification

### F1 — `/api/session` has no rate limit

- **Route:** `POST /api/session` → `createOrGetUser()`
- **Auth:** None (intentionally public — anonymous users need sessions)
- **Behavior:** `INSERT OR IGNORE INTO users` — idempotent per user_id value
- **Risk:** Attacker can generate thousands of distinct user_id values and POST `/api/session` for each, creating thousands of user rows. Each call is a D1 write. No content is created; no review queue is polluted. Users table growth is the only impact.
- **Mitigating factors:** Attacker must send unique user_id values per request; the `INSERT OR IGNORE` means repeated calls with the same ID cost one read. No secret or sensitive data returned.
- **Response:** `{ id, handle, trust_score, strike_count }` — clean, no `is_admin`/`is_shadow_banned`
- **Risk rating:** Low–Medium
- **Verdict:** Questionable
- **Recommended D-175B action:** Add `session:${ip(request)}` rate limit — e.g. `safeRateLimit(request, env, \`session:${ip(request)}\`, 30, 3600000)` (30/hr/IP, generous to avoid breaking legitimate reconnects)

### F2 — `addEvidence()` does not verify claim existence before INSERT

- **Route:** `POST /api/evidence` → `addEvidence()`
- **Auth:** `requireUser` (shadow-ban checked)
- **Behavior:** Validates `claimId` is non-empty via `cleanId()` but does not query `SELECT id FROM claims WHERE id=?` before `insertEvidence()`
- **Risk:** Submitter can pass a non-existent or fabricated `claimId` and create an `evidence` row that is permanently orphaned (no parent claim). Orphaned rows enter `review_state='review'` and appear in the admin review queue with no parent claim context, polluting the queue with unresolvable items.
- **Comparison:** `addHomeTest()` and `addAnalysisResult()` both verify claim existence before INSERT. `addEvidence()` is inconsistent.
- **Risk rating:** Low (bounded by 20/hr/IP rate limit and review-first gating)
- **Verdict:** Questionable
- **Recommended D-175B action:** Add `SELECT id FROM claims WHERE id=? LIMIT 1` guard in `addEvidence()` before `insertEvidence()`; return `{ error:'CLAIM_NOT_FOUND' }` 404 on miss.

### F3 — `addPressure()` does not verify claim existence before INSERT

- **Route:** `POST /api/pressure` → `addPressure()`
- **Auth:** `requireUser` (shadow-ban checked)
- **Behavior:** Same pattern as F2 — validates `claimId` non-empty but does not check existence before INSERT into `pressure_points`
- **Risk:** Same as F2 — orphaned pressure_point rows with a fabricated or non-existent `claim_id` enter the review queue
- **Comparison:** `addHomeTest()` and `addAnalysisResult()` verify claim existence. `addPressure()` is inconsistent.
- **Risk rating:** Low (bounded by 20/hr/IP, review-first)
- **Verdict:** Questionable
- **Recommended D-175B action:** Add `SELECT id FROM claims WHERE id=? LIMIT 1` guard in `addPressure()` before INSERT; return `{ error:'CLAIM_NOT_FOUND' }` 404 on miss.

---

## Additional Observations (Acceptable — No Patch Needed)

**Shadow-ban enforcement:** `requireUser()` calls `SELECT is_shadow_banned FROM users WHERE id=?` and throws `USER_SHADOW_BANNED` if set. Applied to all write routes except `/api/session` (intentionally) and `/api/runpack` (intentionally public). Correct.

**Review routes remain `requireAdmin`-gated:** `reviewDecision`, `reviewCleanup`, `markDuplicate` all start with `const adminError=requireAdmin(request,env); if (adminError) return adminError;`. No changes in D-175A.

**`archiveMyHumanXItem()` and `saveProfileSettings()` have no rate limit:** Both are `requireUser`-gated and affect only the caller's own data. No new publicly-visible rows created. No review queue impact. Acceptable without rate limiting.

**`createAipPacket` has no `requireUser`:** Intentionally open — RunPack is designed for anonymous external AI consumption. Public claim gate (`review_state='public'`) prevents creation of packets for non-public content. Acceptable.

**`addPressure` response uses snake_case `claim_id`:** The manually-constructed response object uses `claim_id` instead of `claimId`. Minor inconsistency with camelCase convention elsewhere; not a security issue. Not patched in D-175A.

**Rate limit key reliability:** `ip(request)` reads `cf-connecting-ip` set by Cloudflare edge. On Cloudflare Workers deployment, this is not user-spoofable. Acceptable.

---

## Recommended D-175B Patch List

| Priority | ID | Route/Function | Patch |
|---|---|---|---|
| Medium | P1 | `POST /api/session` / `createOrGetUser` | Add `safeRateLimit` — `session:${ip(request)}`, 30/hr/IP |
| Low–Medium | P2 | `POST /api/evidence` / `addEvidence` | Add claim existence check before `insertEvidence()` |
| Low–Medium | P3 | `POST /api/pressure` / `addPressure` | Add claim existence check before pressure INSERT |

All three patches are low-risk backend additions with no schema change, no migration, and no frontend impact.

---

## Verification — Review Routes and Frontend Integrity

| Check | Status |
|---|---|
| `requireAdmin` enforced on `reviewDecision` | Confirmed — first line |
| `requireAdmin` enforced on `reviewCleanup` | Confirmed — first line |
| `requireAdmin` enforced on `markDuplicate` | Confirmed |
| No admin/owner token values in any source file | Confirmed — no source code changes |
| No `wrangler.toml` created or modified | Confirmed |
| No migration created | Confirmed |
| No owner-token work resumed | Confirmed — D-149H hold in effect |

---

## No Code Change Confirmation

D-175A is an audit document only. No files in `src/` were modified. No files in `public/` were modified. No files in `scripts/` were modified. The only file changes are this audit document and the `docs/README.md` current pointer.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or owner-token-adjacent changes were introduced or planned in D-175A. Recommendations in this document do not touch owner-token logic.

---

## Baseline

**1308/24/57** — unchanged from D-174D.

- `scripts/hardening-smoke-test.mjs`: 1308 passed
- `scripts/belief-engine-static-check.mjs`: 24 passed
- `scripts/worker-route-static-check.mjs`: 57 passed

---

## Recommended Next Step

D-175B — Implement the three patches (P1/P2/P3) from this audit. No schema changes required. Expected baseline increase: +~9 smoke tests.
