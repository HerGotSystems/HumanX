# D-173A — Public Mutation Path Audit

**Date:** 2026-06-25
**Scope:** `src/worker.js`, `src/votes.js`, `src/truths.js`, `src/truth-claim-bridge.js`, `src/evidence-reuse.js`, `src/belief-snapshots.js`, `src/belief-bridge.js`, `src/analysis-results.js`, `public/app-v10.js`. Audit only — no source code changes.

---

## Executive Summary

All 17 public mutation routes were audited. No catastrophic security issues were found. The review-first pattern is consistently enforced via hardcoded `review_state='review'` in every user-content INSERT. Shadow-ban is checked via `requireUser()` on every write route that creates or modifies user content. Admin/moderation fields (`is_admin`, `is_shadow_banned`, `verified`, `review_state`) cannot be injected through request bodies.

Four low-risk findings are documented:

- **F1 (low):** `reportTarget()` does not validate `targetType` against an allowlist — spurious report rows can be created with arbitrary target types.
- **F2 (low):** `reportTarget()` has no per-user per-target dedupe — a single user can submit multiple reports on the same item, each incrementing `report_count`.
- **F3 (low):** `createTruth()` accepts `linkedClaimId` from the request body without validating that the referenced claim exists or is public.
- **F4 (low-medium):** `convertTruthToClaim()` returns newly inserted claims as raw `SELECT * FROM claims` rows rather than through `mapClaim()`, exposing internal fields (`normalized_claim`, `near_duplicate_of`, `duplicate_of`, `status_locked`, `damage`, `user_id`, `archived_by_user`) to the submitting user.

One accepted observation:

- **O1 (accepted):** `exportMyHumanX()` uses `SELECT *` on all user-owned tables, exposing internal fields to the data owner. This is intentional per D-138B; owners are entitled to their own data in full.

All admin/review routes remain `requireAdmin`-gated and are not re-audited here.

---

## Public Mutation Route Matrix

| Route | Method | Handler | Module | Auth | Writes | Review-first? | Rate limit |
|---|---|---|---|---|---|---|---|
| `/api/session` | POST | `createOrGetUser()` | worker.js | None (anonymous) | `users` (INSERT OR IGNORE) | N/A | None |
| `/api/claims` | POST | `createClaim()` | worker.js | `requireUser()` | `claims`, optionally `evidence`, `claim_builder_contexts` | ✓ `'review'` | 8/hr/IP |
| `/api/evidence` | POST | `addEvidence()` | worker.js | `requireUser()` | `evidence` | ✓ `'review'` | 20/hr/IP |
| `/api/pressure` | POST | `addPressure()` | worker.js | `requireUser()` | `pressure_points` | ✓ `'review'` | 20/hr/IP |
| `/api/tests` | POST | `addHomeTest()` | worker.js | `requireUser()` | `home_tests` | N/A (no review column) | 20/hr/IP |
| `/api/report` | POST | `reportTarget()` | worker.js | `requireUser()` | `reports`, increments `report_count`, auto-review at 5 | N/A (moderation signal) | 20/hr/IP |
| `/api/claim-vote` | POST | `voteClaim()` | votes.js | `requireUser()` | `claim_votes`, refreshes `belief_yes/no/uncertainty` on claim | N/A (vote) | 120/hr/userId+IP |
| `/api/truths` | POST | `createTruth()` | truths.js | `requireUser()` | `truths`, optionally `claim_builder_contexts` | ✓ `'review'` | 12/hr/IP |
| `/api/truth-to-claim` | POST | `convertTruthToClaim()` | truth-claim-bridge.js | `requireUser()` | `claims`, `truth_claim_links`, updates `truths` | ✓ `'review'` | 8/hr/IP (admin exempt) |
| `/api/evidence-attach` | POST | `attachEvidenceToClaim()` | evidence-reuse.js | `requireUser()` | `evidence_claim_links` | N/A (link only) | 20/hr/IP |
| `/api/analysis` | POST | `addAnalysisResult()` | analysis-results.js | `requireUser()` | `analysis_results` | N/A (private analysis store) | 20/hr/IP |
| `/api/belief-snapshots` | POST | `saveBeliefSnapshot()` | belief-snapshots.js | `requireUser()` | `belief_snapshots` | N/A (private) | 20/hr/IP |
| `/api/belief-promote` | POST | `promoteBeliefSnapshot()` | belief-bridge.js | `requireUser()` | `truths` or `claims`, `truth_claim_links` | ✓ `'review'` | 10/hr/IP |
| `/api/aip` / `/api/runpack` | POST | `createAipPacket()` | worker.js | None | `aip_packets` (append-only log) | N/A (read + log) | 20/hr/IP |
| `/api/auth/invite/redeem` | POST | `redeemInviteCode()` | worker.js | `requireUser()` | `invite_codes`, `users` (email/verified) | N/A (auth) | 8/hr/IP |
| `/api/my-humanx/archive` | POST | `archiveMyHumanXItem()` | worker.js | `requireUser()` | Sets `review_state='archived'` on own item | N/A (owner action) | None |
| `/api/my-humanx/profile-settings` | POST | `saveProfileSettings()` | worker.js | `requireUser()` | `users` (profile_public/slug/bio), optionally `belief_snapshots` (public_summary_enabled) | N/A (profile) | None |

---

## Request-Body Trust / Allowlist Matrix

For each route, which body fields are accepted, cleaned, and what is ignored or server-set:

### `/api/session`
| Field | Accepted? | Sanitization | Server-set (ignored from body) |
|---|---|---|---|
| `id` | Yes (userId) | `cleanId()` | — |
| `handle` | Yes | `cleanHandle()` (lower, alphanum, max 24) | — |
| `fingerprintHash` | Yes (stored) | `String().slice(0,128)` | — |
| `is_admin` | — | — | Never accepted |
| `is_shadow_banned` | — | — | Never accepted |
| `email`, `verified` | — | — | Never accepted |

### `/api/claims`
| Field | Accepted? | Sanitization | Server-set (ignored from body) |
|---|---|---|---|
| `claim` | Yes | `cleanText(500)` | — |
| `type` | Yes | `cleanText(80)` | — |
| `category` | Yes | `cleanText(80)` or inferred | — |
| `initialEvidence` | Yes (body only) | `cleanText(900)` | — |
| `claim_builder` | Yes (context only) | `cleanClaimBuilderContext()` | — |
| `review_state` | — | — | Hardcoded `'review'` |
| `status` | — | — | Hardcoded `'Plausible'` |
| `evidence_score`, `survivability`, `testability` | — | — | Server-computed |
| `is_admin`, `is_shadow_banned`, `user_id` | — | — | Never accepted |

### `/api/evidence`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `claimId` | Yes | `cleanId()` | — |
| `title` | Yes | `cleanText(120)` | — |
| `body/note` | Yes | `cleanText(1200)` | — |
| `stance` | Yes | `cleanText(20)` | — |
| `quality` | Yes | `cleanText(40)` | — |
| `sourceUrl` | Yes | `httpUrlOrNull()` (must be http/https) | — |
| `review_state` | — | — | Hardcoded `'review'` |
| `report_count` | — | — | Hardcoded `0` |

### `/api/pressure`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `claimId` | Yes | `cleanId()` | — |
| `title` | Yes | `cleanText(120)` | — |
| `body/note` | Yes | `cleanText(1200)` | — |
| `severity` | Yes | `Math.max(1, Math.min(5, Number(...)))` | — |
| `review_state` | — | — | Hardcoded `'review'` |
| `report_count` | — | — | Hardcoded `0` |

### `/api/claim-vote`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `claimId` | Yes | `cleanId()` | — |
| `vote` | Yes | `cleanVote()` → only `believe`, `reject`, `unsure` | — |

### `/api/truths`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `statement` | Yes | `cleanText(500)` | — |
| `category` | Yes | `cleanText(80)` | — |
| `origin` | Yes | `cleanText(120)` | — |
| `truthType` | Yes | `cleanText(60)` | — |
| `confidenceLabel` | Yes | `cleanText(60)` | — |
| `linkedClaimId` | Yes | `cleanId()` | — (⚠ F3 — no existence check) |
| `review_state` | — | — | Hardcoded `'review'` |
| `repetition_score` | — | — | Hardcoded `1` |
| `pressure_score` | — | — | Hardcoded `0` |

### `/api/truth-to-claim`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `truthId` | Yes | `cleanId()` | — |
| `claim` | Yes | `cleanText(1200)` (overrides truth statement) | — |
| `bridgeNote` | Yes | `cleanText(400)` | — |
| `review_state` | — | — | Hardcoded `'review'` |
| `status` | — | — | Hardcoded `'Plausible'` |
| `category` | — | — | Taken from truth row |

### `/api/report`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `targetType` | Yes (no allowlist) | `cleanText(30)` | — (⚠ F1) |
| `targetId` | Yes | `cleanId()` | — |
| `reason` | Yes | `cleanText(500)` | — |
| `status` | — | — | Hardcoded `'open'` |

### `/api/auth/invite/redeem`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `code` | Yes | `cleanId()` | — |
| `email` | Yes | `isValidEmail()` check + trim/lower | — |
| `displayName` | Yes | `cleanText(80)` | — |
| `is_admin` | — | — | Never written |
| `verified` | — | — | Hardcoded `1` |
| `trust_score`, `strike_count` | — | — | Never written |

### `/api/my-humanx/profile-settings`
| Field | Accepted? | Sanitization | Server-set |
|---|---|---|---|
| `profile_public` | Yes | Boolean coercion | — |
| `profile_slug` | Yes | `validateProfileSlug()` — strict regex + reserved words | — |
| `profile_bio` | Yes | `cleanText(240)` | — |
| `shared_snapshot_id` | Yes | `cleanId()`, ownership check | — |
| `is_admin`, `is_shadow_banned`, `email` | — | — | Never written |

---

## Review-First Verdict

All user-created public content enters moderation before becoming visible:

| Content type | INSERT `review_state` | Can body override? |
|---|---|---|
| `claims` | `'review'` (hardcoded) | No |
| `evidence` | `'review'` (hardcoded via `insertEvidence(..., reviewState='review')`) | No |
| `pressure_points` | `'review'` (hardcoded) | No |
| `truths` | `'review'` (hardcoded) | No |
| Truth-derived `claims` (bridge) | `'review'` (hardcoded in `insertClaimWithNormalizedKey`) | No |
| Belief-promoted `truths`/`claims` | `'review'` (hardcoded in `promoteToTruth`/`promoteToClaim`) | No |

Content without a moderation review cycle (intentional):

| Content type | Reason |
|---|---|
| `home_tests` | No `review_state` column — tests are editorial helpers, not public-facing claims |
| `belief_snapshots` | Private to the submitting user |
| `analysis_results` | Private append-only AI analysis store |
| `evidence_claim_links` | Attach-only; underlying evidence already in review |
| `claim_votes` | Vote state, not public content |
| `reports` | Moderation signal, not content |

---

## Shadow-Ban / Identity Verdict

`requireUser(request, env)` checks `SELECT is_shadow_banned FROM users WHERE id=?` and throws `USER_SHADOW_BANNED` if set. This check applies to every public mutation write route except two:

| Route | Auth | Reason no `requireUser` |
|---|---|---|
| `POST /api/session` | None (anonymous) | Intentional — cannot authenticate if session creation itself is blocked |
| `POST /api/aip` / `/api/runpack` | None | Intentional — public RunPack generation; no user identity required |

All other mutation routes (`/api/claims`, `/api/evidence`, `/api/pressure`, `/api/tests`, `/api/report`, `/api/claim-vote`, `/api/truths`, `/api/truth-to-claim`, `/api/evidence-attach`, `/api/analysis`, `/api/belief-snapshots`, `/api/belief-promote`, `/api/auth/invite/redeem`, `/api/my-humanx/archive`, `/api/my-humanx/profile-settings`) gate on `requireUser()` → shadow-ban checked. ✓

---

## Response Metadata Verdict

### Public mutation response exposure

| Route | Response | Sensitive fields exposed? |
|---|---|---|
| `/api/session` | `{ user: { id, handle, trust_score, strike_count }, owner_token }` | `owner_token` returned to session owner (D-145B design, advisory only) |
| `/api/claims` | `mapClaim(det.claim)` via `claimDetail()` | `nearDuplicateOf`, `duplicateOf`, `statusLocked` included (server-set, not body-injectable) |
| `/api/evidence` | Explicit fields from `insertEvidence` + `mapClaim()` | None |
| `/api/pressure` | Explicit `pressure` object + `mapClaim()` | None |
| `/api/tests` | `SELECT t.*, u.handle FROM home_tests` | `user_id` (pseudonymous `usr_*`) returned to submitter — same as D-168B accepted finding |
| `/api/report` | `{ ok: true }` only | None |
| `/api/claim-vote` | `mapClaimLocal(claim)` — explicit allowlist | None (omits `nearDuplicateOf`, `duplicateOf`, `statusLocked` unlike main `mapClaim`) |
| `/api/truths` | `mapTruth(row)` — explicit allowlist | None |
| `/api/truth-to-claim` | New claims: raw `SELECT * FROM claims` | ⚠ F4 — internal fields exposed to submitter |
| `/api/evidence-attach` | Explicit link fields + `mapClaim()` | None |
| `/api/analysis` | `mapAnalysis(row)` — explicit allowlist | None |
| `/api/belief-snapshots` | `mapBeliefSnapshot(row)` | `userId` (own ID) + `raw` (full snapshot JSON) — to owner |
| `/api/belief-promote` | `mapTruth(row)` or `mapClaim(row)` | None |
| `/api/aip/runpack` | `buildRunPack()` via `safeRunPackClaimBackend()` (D-171C) | None — sanitized payload |
| `/api/auth/invite/redeem` | `SELECT id, handle, email, verified, verified_at, display_name, trust_score, strike_count` | No `is_admin`, no `is_shadow_banned`, invite code not returned |
| `/api/my-humanx/archive` | `{ ok, archived, targetType, targetId }` | None |
| `/api/my-humanx/profile-settings` | `{ ok, profile_public, profile_slug, profile_bio, shared_snapshot_id }` | None |
| `/api/my-humanx/export` | `SELECT *` on all user-owned tables | O1 (accepted) — full owner export |

---

## Findings

### F1 — `reportTarget()` does not validate `targetType` against an allowlist (low)

**File:** `src/worker.js` — `reportTarget()` (~line 752)

**Issue:** The `reports` INSERT accepts any cleaned string as `targetType`:
```js
await env.DB.prepare(`INSERT INTO reports (id,target_type,target_id,...) VALUES (?,?,?,...)`)
  .bind(makeId('rpt'), targetType, targetId, ...)
```
`targetType` is `cleanText(body.targetType || 'claim', 30)` — only length and control-char sanitized, not validated against a known set. The downstream `if (targetType === 'claim')`, `if (targetType === 'evidence')`, `if (targetType === 'pressure')` blocks are safe (they only fire on exact known values), but invalid types produce orphan `reports` rows with no corresponding content update.

**Impact:** An attacker can create spurious `reports` rows with arbitrary `target_type` values (e.g. `'user'`, `'admin'`, `'truth'`). The report table is admin-visible; spurious rows could pollute the moderation queue but cannot affect claim/evidence/pressure state.

**Risk:** Low. No content state affected. Admin-visible pollution only.

**Recommended D-173B action:** Add an allowlist check before the INSERT:
```js
const ALLOWED_REPORT_TYPES = new Set(['claim', 'evidence', 'pressure', 'truth']);
if (!ALLOWED_REPORT_TYPES.has(targetType)) return json({ error: 'BAD_TARGET_TYPE' }, 400);
```

---

### F2 — `reportTarget()` has no per-user per-target dedupe (low)

**File:** `src/worker.js` — `reportTarget()` (~line 752)

**Issue:** The `reports` table has no unique constraint on `(reporter_id, target_id)`. `reportTarget()` performs no pre-check for an existing open report from the same user on the same target. Each call increments `report_count` on the target. A single user at the rate limit of 20/hr per IP can submit 5 reports on a single target within seconds, auto-triggering `review_state='review'` on that target:

```js
if (targetType === 'claim')
  await env.DB.prepare(`UPDATE claims SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=5 THEN 'review' ELSE review_state END WHERE id=?`)
```

**Impact:** A single user could use 5 of their 20 hourly report slots to move any public claim, evidence item, or pressure point from `public` → `review` state, removing it from public visibility. The item would then need admin action to be reinstated. This is not a permanent state (admin can approve) but it is a targeted moderation bypass.

**Risk:** Low. Rate-limited to 20/hr/IP. `review` state is recoverable by admin. However, a coordinated or multi-IP actor could make targets disappear from public view repeatedly.

**Recommended D-173B action:** Add a soft-dedupe check before inserting:
```js
const already = await env.DB.prepare(
  `SELECT id FROM reports WHERE target_id=? AND reporter_id=? AND status='open' LIMIT 1`
).bind(targetId, userId).first();
if (already) return json({ ok: true, already_reported: true });
```
This prevents the same user's repeated reports from stacking `report_count`. Different users can still each report independently (correct behavior).

---

### F3 — `createTruth()` accepts `linkedClaimId` from body without existence or visibility check (low)

**File:** `src/truths.js` — `createTruth()` (line 71)

**Issue:**
```js
cleanId(body.linkedClaimId || body.linked_claim_id || '') || null,
```
The `linked_claim_id` column of the new truth is set from the request body without checking that the referenced claim exists, is public, or belongs to the submitter. The truth enters `review_state='review'` so it won't be publicly visible, but the linked claim ID is reflected in the response:
```json
{ "ok": true, "truth": { ..., "linkedClaimId": "clm_injected_value_here" } }
```
A user could use this to probe whether a given `clm_*` ID exists in the DB — though the truth is in review so the linked claim is not publicly advertised. The DB does not enforce a FK constraint preventing a dangling link.

**Risk:** Low. Truth enters review before becoming public. No state change to the referenced claim. No information leak beyond the user's own submitted value being echoed back.

**Recommended D-173B action:** Either validate that `linkedClaimId` references an existing, public claim before accepting it, or simply ignore body-supplied `linkedClaimId` (the link is set server-side during truth-to-claim conversion anyway, which is the canonical path). Ignoring it is the simpler fix.

---

### F4 — `convertTruthToClaim()` returns new claims as raw `SELECT *` rows (low-medium)

**File:** `src/truth-claim-bridge.js` — `convertTruthToClaim()` (line 84)

**Issue:** When a new claim is successfully inserted, the response is:
```js
const claim = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();
return json({ ok: true, ..., claim, ... });
```
This returns the raw claims row including `normalized_claim`, `near_duplicate_of`, `duplicate_of`, `status_locked`, `damage`, `user_id`, `archived_by_user` to the submitting user. The same issue exists for the "non-public existing claim" path:
```js
return json({ ok: true, existing: true, ..., claim: nonPublic, ... });
```
Where `nonPublic` is also from a `SELECT *`.

By contrast, `createClaim()` in `worker.js` wraps its response through `claimDetail()` → `mapClaim()`, and `getPublicProfile()` uses explicit column SELECTs. The `truth-claim-bridge.js` skips this sanitization for the new-claim path.

**Impact:** Internal moderation fields (`normalized_claim`, `near_duplicate_of`, `duplicate_of`, `status_locked`, `damage`) are exposed to the submitting user for truth-derived claims. These go only to the submitter and only for their own just-created claim. Not a public leak, but inconsistent with the established pattern.

**Risk:** Low-medium. Fields go to submitter only. However `normalized_claim` is an internal dedup key; `status_locked`, `duplicate_of`, `near_duplicate_of` are moderation state. Same class of concern as D-168B findings (which were accepted as lower-priority for mutation response bodies back to the writing user).

**Recommended D-173B action:** Wrap the `claim` response through `mapClaim()` in all three return paths in `convertTruthToClaim()`. The function already receives `mapClaim`-equivalent helpers — use the worker's `mapClaim()` or introduce a local copy matching the worker version.

---

### O1 — `exportMyHumanX()` uses `SELECT *` on all tables (accepted, low)

**File:** `src/worker.js` — `exportMyHumanX()` (~line 403)

All user-owned tables are exported via `SELECT *`: claims (includes `normalized_claim`, `status_locked`, `duplicate_of`, `near_duplicate_of`), truths, evidence, pressure, belief_snapshots (includes `raw_json` up to 64KB), votes, home_tests. Rate-limited to 5/hr. Returns only own data.

**Verdict:** Intentional per D-138B. Owners are entitled to their own data including moderation context on their own items. No public leak. Accepted.

---

## Q8 — Report / Vote Spam Safety

### Votes
- `claim_votes` has effective per-user-per-claim uniqueness enforced by the `UPDATE/INSERT` logic in `voteClaim()`: an existing vote is UPDATE'd rather than inserted. A user's vote on a given claim is idempotent.
- Rate limit: 120/hr per userId+IP. Generous but bounded.
- **Verdict:** Acceptable. Idempotent per-user-per-claim.

### Reports
- No per-user-per-target dedupe. See F2 above.

---

## Q9 — Invite Redemption Safety

`redeemInviteCode()` checks:
- Atomic single-use claim via `UPDATE WHERE redeemed_by IS NULL AND revoked=0 AND expires_at check` — race-safe
- Email uniqueness checked pre-update and rollback on FK violation
- Response: explicit column SELECT — no `is_admin`, no `is_shadow_banned`, invite code NOT returned
- Never writes `is_admin` — comment in code explicitly confirms this
- Shadow-ban: `requireUser()` blocks shadow-banned users from redeeming (correct)

**Verdict:** Acceptable. Well-constructed invite flow.

---

## Q10 — RunPack Routes

`POST /api/aip` / `POST /api/runpack`:
- No auth required (intentional — public claim analysis task)
- Request body: `claimId` only (cleanId)
- Claim must be `review_state='public'` — non-public claims return 404
- Writes only to `aip_packets` (append-only log, not content)
- Response: `buildRunPack()` → `safeRunPackClaimBackend()` (D-171C) — moderation fields stripped
- Rate limit: 20/hr per IP
- Cannot publish or mutate any public content

**Verdict:** Acceptable. Read-heavy with one append-only write.

---

## Additional Verify Checklist

| Check | Result |
|---|---|
| No owner-token work resumed | ✓ — D-149H hold intact |
| Admin token not rendered/logged/documented | ✓ |
| Admin token input `type="password"` | ✓ |
| No `console.*` frontend logs | ✓ |
| Public APIs do not expose owner/admin tokens | ✓ — `owner_token` returned only in `/api/session` response to the session owner |
| No `wrangler.toml` | ✓ |
| No migration | ✓ |
| All admin/review routes remain `requireAdmin`-gated | ✓ — unchanged from D-172A audit |

---

## Recommended D-173B Patch List

Four changes, all in `src/worker.js` or module files. No frontend changes, no schema changes, no migration.

### P1 — `reportTarget()`: Add `targetType` allowlist (F1)
**File:** `src/worker.js` — `reportTarget()`

Add before the INSERT:
```js
const ALLOWED_REPORT_TYPES = new Set(['claim', 'evidence', 'pressure', 'truth']);
if (!ALLOWED_REPORT_TYPES.has(targetType)) return json({ error: 'BAD_TARGET_TYPE', allowed: [...ALLOWED_REPORT_TYPES] }, 400);
```
No schema change. Blocks spurious report rows.

### P2 — `reportTarget()`: Add per-user per-target dedupe (F2)
**File:** `src/worker.js` — `reportTarget()`

Add after rate-limit, before INSERT:
```js
const already = await env.DB.prepare(
  `SELECT id FROM reports WHERE target_id=? AND reporter_id=? AND status='open' LIMIT 1`
).bind(targetId, userId).first();
if (already) return json({ ok: true, already_reported: true });
```
No schema change. Prevents one user from stacking `report_count` increments on the same target.

### P3 — `createTruth()`: Ignore body-supplied `linkedClaimId` (F3)
**File:** `src/truths.js` — `createTruth()`

Remove `cleanId(body.linkedClaimId || body.linked_claim_id || '') || null` from the INSERT — use `null` instead. The canonical link is set server-side during truth-to-claim conversion, not at truth creation time.

### P4 — `convertTruthToClaim()`: Wrap claim responses through `mapClaim()` (F4)
**File:** `src/truth-claim-bridge.js` — `convertTruthToClaim()`

Three return paths currently return raw `claims` rows. Wrap each `claim` value through a local `mapClaim()` matching the worker's implementation (or pass it as a helper, consistent with how the module already receives `cleanId`, `cleanText` etc.).

---

## No Code Changes in D-173A

`src/worker.js`, `public/app-v10.js`, and all other source files were read and audited only. No modifications were made.

---

## Smoke Tests

Baseline unchanged: **1285/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1285 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-173A is audit only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, route changes, or migration were added or recommended.
