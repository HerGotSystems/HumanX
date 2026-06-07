# D-89A: HumanX Product Model and Ownership Audit

Date: 2026-06-07
Step: D-89A — product model and ownership audit (read-only)
Type: Design/audit document. No code changes. No live calls. No D1 writes. No Wrangler. No moderation actions.

---

## 1. Scope and Safety

This document audits the current product model and ownership architecture of HumanX as of commit `bad86cb` (post D-88N, all 10 archive gates complete).

**Hard scope rules for this step:**
- Read-only. No POST, no D1 writes, no archive calls, no Wrangler.
- Files inspected: `src/worker.js`, `public/app-v10.js`, `public/styles.css`, `public/index.html`, `src/` module files (listing only).
- No live endpoint calls.
- Admin token not referenced, printed, or committed.
- No Co-Authored-By.

**What this document is:**
A structured analysis of who can do what, what objects exist, how they flow through the system, and a set of product model recommendations for the next phase of development. Not a PRD; a diagnostic + decision-enablement doc.

---

## 2. User Journey Audit

### 2.1 Identity bootstrap

On first load, `localUser()` (app-v10.js line 46) generates a pseudonymous identity client-side:

```js
u = { id: 'usr_' + crypto.randomUUID().replaceAll('-','').slice(0,18),
      handle: 'anon-' + Math.random().toString(36).slice(2,8) }
localStorage.setItem(LS_USER, JSON.stringify(u))
```

This UUID is stored in `localStorage` key `humanx_public_user_v1`. It is never bound to an email, phone, or device identifier. On `boot()`, the app calls `POST /api/session` with `{ id, handle }` which does `INSERT OR IGNORE INTO users`. The session response returns `{ user: { id, handle, trust_score, strike_count, is_shadow_banned, is_admin } }` — the frontend merges these fields back into `user`.

**Key observation:** Identity is ephemeral. Clearing localStorage or opening a different browser creates a new identity instantly. There is no recovery path, no account linking, no login wall.

### 2.2 User journey map

| Step | UI mode | API call | Auth required | Gate |
|------|---------|----------|--------------|------|
| Land on site | home | `GET /api/health`, `GET /api/claims` | None | None |
| View a claim | arena (claims list) | `GET /api/claims`, `GET /api/claims/:id` | None | None |
| Vote on a claim | arena | `POST /api/claim-vote` | `x-humanx-user` present | Header existence only |
| Submit a claim | submit | `POST /api/claims` | `x-humanx-user` present | Header existence + rate limit (8/hr) |
| Add evidence | claim detail | `POST /api/evidence` | `x-humanx-user` present | Header existence + rate limit (20/hr) |
| Add pressure point | claim detail | `POST /api/pressure` | `x-humanx-user` present | Header existence + rate limit (20/hr) |
| Add home test | claim detail | `POST /api/tests` | `x-humanx-user` present | Header existence + rate limit (20/hr) |
| Report content | any | `POST /api/report` | `x-humanx-user` present | Header existence + rate limit (20/hr) |
| Submit a truth | truths mode | `POST /api/truths` | `x-humanx-user` present | Header existence |
| Convert truth → claim | truths mode | `POST /api/truth-to-claim` | `x-humanx-user` present | Header existence |
| Attach evidence to claim | vault | `POST /api/evidence-attach` | `x-humanx-user` present | Header existence |
| Save belief snapshot | drift mode | `POST /api/belief-snapshots` | `x-humanx-user` present | Header existence |
| Generate RunPack | export mode | `POST /api/runpack` | None | Claim must be public |
| Admin review | review mode | `GET /api/review`, `POST /api/review/decision`, `POST /api/review/cleanup` | `x-humanx-admin` | Token match against `HUMANX_ADMIN_TOKEN` |

### 2.3 Session fields returned but not enforced

The `/api/session` response includes `trust_score`, `strike_count`, `is_shadow_banned`, `is_admin`. These are read by the frontend but **none of them gate any submission flow**. `is_shadow_banned` and `is_admin` are stored in the `users` table but the backend never checks them in user-facing routes. The only effective user-side check is header presence via `requireUser()`.

---

## 3. Object Lifecycle Map

### 3.1 Claims

```
[created] → review_state='review'
         ↓ report_count >= 2 (auto-escalate via POST /api/report)
         ↓ admin decision (POST /api/review/decision)
         ↓
[public]  ← reviewDecision('public')
[rejected] ← reviewDecision('rejected')
[duplicate] ← markDuplicate()
[archived] ← reviewCleanup() (soft, never DELETE)
         ↑
         re-review via reviewDecision() — can move public↔review↔rejected
```

Status values (score label, not lifecycle): `Plausible`, `Supported`, `Contested`, `Unsupported`, `Debunked`. Set by `recalcClaimScore`. Separate from `review_state`.

`status_locked=1` on a claim causes `recalcClaimScore` to skip updating `status`. Only used for A1 (`clm_seed_55e17c22e13e`) currently.

### 3.2 Evidence

```
[created via POST /api/evidence] → review_state='review'
[created as initialEvidence on claim submit] → review_state='review'
[attached via POST /api/evidence-attach] → review_state='review'
         ↓ report_count >= 2 (auto-escalate)
         ↓ admin decision
[public]  ← reviewDecision('public')
[rejected] ← reviewDecision('rejected')
[archived] ← reviewDecision('archived') — not via reviewCleanup (cleanup only handles claim/truth)
```

Note: `reviewCleanup` currently only accepts `target_type` of `claim` or `truth`. Evidence can only be archived via `reviewDecision` with `decision='archived'` — there is no evidence-specific cleanup gate.

### 3.3 Truths

```
[created via POST /api/truths] → review_state='review'
         ↓ admin decision
[public]  ← reviewDecision('public')
[rejected] ← reviewDecision('rejected')
[archived] ← reviewCleanup() or reviewDecision('archived')
```

Truths can also be converted to claims via `POST /api/truth-to-claim`.

### 3.4 Supporting objects (no lifecycle states)

| Object | Table | Created via | Deleted | Notes |
|--------|-------|-------------|---------|-------|
| Pressure point | `pressure_points` | `POST /api/pressure` | Never | Affects claim score |
| Home test | `home_tests` | `POST /api/tests` | Never | `safety_level`, `difficulty` fields |
| Report | `reports` | `POST /api/report` | Never | `status`: open→rejected/closed on review decision |
| RunPack/AIP | `aip_packets` | `POST /api/runpack` | Never | JSON snapshot; claim must be public |
| Analysis result | `analysis_results` | `POST /api/analysis` | Never | User-submitted AI analysis |
| Belief snapshot | `belief_snapshots` | `POST /api/belief-snapshots` | Never | Promoted via `/api/belief-promote` |
| Vote | `claim_votes` / `evidence_votes` / `truth_votes` | `POST /api/claim-vote` | Never | No un-vote route |
| Duplicate sig | `duplicate_signatures` | internal | Never | Near-duplicate detection artefact |

**There are zero DELETE routes in the entire worker.** All object removal is soft-state transition only.

---

## 4. Creation and Publication Matrix

| Object type | Who can create | Initial state | Auto-published? | Admin review required? |
|-------------|---------------|--------------|----------------|----------------------|
| Claim | Any pseudonymous user | `review_state='review'` | No | Yes — must be manually set to public |
| Evidence | Any pseudonymous user | `review_state='review'` | No | Yes |
| Truth | Any pseudonymous user | `review_state='review'` | No | Yes |
| Pressure point | Any pseudonymous user | N/A (no review_state) | Yes (always visible on claim) | No |
| Home test | Any pseudonymous user | N/A | Yes | No |
| Vote | Any pseudonymous user | N/A | Yes | No |
| Report | Any pseudonymous user | `status='open'` | N/A | Triggers queue escalation at 2+ |
| RunPack | Anyone (no user required) | N/A | N/A | Claim must already be public |
| Analysis | Any pseudonymous user | N/A | Yes | No |
| Belief snapshot | Any pseudonymous user | N/A (per-user) | Private to user | No |

**Key gap:** Pressure points, home tests, votes, and analysis results are created by any pseudonymous user and published immediately with no review. They can add signal to public claims without admin visibility.

---

## 5. Product Model Recommendation

### 5.1 Current model

HumanX operates as an **open submission / gated publication** model:
- Any visitor can generate a pseudonymous identity in milliseconds
- All claim/evidence/truth submissions enter a moderation queue
- Publication to the public feed requires explicit admin approval
- Supporting objects (pressure, tests, votes, analysis) bypass the queue entirely

This model is appropriate for the current pre-launch / controlled-access phase. It ensures the public feed only contains editorially reviewed content.

### 5.2 What needs to change before public launch

1. **Identity durability**: The current localStorage-only identity means a user cannot recover their submissions after clearing browser data or switching devices. For any ownership model to be meaningful (edit, retract, stake), users need a durable identity path. Recommended: optional account linking (email or passkey) that can be bound to the pseudonymous UUID post-hoc.

2. **Gating gap on supporting objects**: Pressure points, home tests, and analysis results have no review queue. A bad actor can attach misleading "home tests" or "pressure points" to public claims without admin visibility. Recommended: add `review_state` to `pressure_points` and `home_tests` tables, mirror the evidence review pattern.

3. **Shadow ban not enforced**: `is_shadow_banned=1` in the `users` table has no effect in any route. Either implement it (suppress submissions silently) or remove the column to avoid confusion.

4. **Trust score not used**: `trust_score` is stored and returned but drives nothing. Recommended: define a trust score policy before surfacing it to users.

### 5.3 What the current model does well

- Clean separation of public feed from moderation queue
- Soft-archive for test artefacts (no data destruction)
- `status_locked` gate to protect editorial seeds from score drift
- Rate limits on all submission routes prevent trivial spam
- Duplicate detection at claim creation prevents identical re-submissions

---

## 6. Evidence Lane Recommendation

Currently evidence has two creation paths:
1. **Direct attachment**: `POST /api/evidence` — linked to a claim at submission time
2. **Reuse attachment**: `POST /api/evidence-attach` — links existing evidence to a new claim via `evidence_claim_links`

Both paths enter `review_state='review'`. The vault (`GET /api/evidence-vault`) exposes all public evidence for reuse.

**Current gap:** There is no way for a user to see their own evidence across claims (no per-user evidence listing). There is also no way to retract evidence.

**Recommendation:** Maintain current two-path model. Before launch add:
- `GET /api/evidence?user_id=self` — user's own evidence listing
- Evidence review state shown in UI (currently evidence review state is not surfaced to the submitter)
- Consider a third path: **pre-vetted evidence from authoritative sources** (admin-submitted, starts in `public` state), which could be linked to multiple claims as canonical references

---

## 7. Claim/Truth Distinction

| Dimension | Claim | Truth |
|-----------|-------|-------|
| Submitted by | Any user | Any user |
| Initial state | `review_state='review'` | `review_state='review'` |
| Can become public | Yes | Yes |
| Can convert to claim | No | Yes (`/api/truth-to-claim`) |
| Scored | Yes (`status`, `evidence_score`, `survivability`, etc.) | No separate scoring |
| Has evidence directly attached | Yes | No (evidence attaches to claims) |
| Has pressure points | Yes | No |
| Has home tests | Yes | No |
| Has RunPack | Yes (when public) | No |
| Status locked | Yes (`status_locked` column) | Yes (`status_locked` column) |
| Archived via cleanup | Yes | Yes |

**Current model interpretation:** Truths are intended as foundational statements of consensus knowledge that are promoted into the claim arena once scoped. They serve as a "belief registry" layer distinct from contested claims. The `truth-to-claim` conversion is the intended promotion path.

**Recommendation:** This distinction is architecturally sound but not yet product-differentiated in the UI. The truths mode needs copy and UX that makes the epistemic difference clear: a truth is a statement of established consensus, a claim is a testable proposition open to contestation.

---

## 8. Ownership and Deletion Policy

### 8.1 Current policy (as implemented)

There is no deletion in HumanX. The complete policy is:
- No DELETE routes exist anywhere in the worker
- Object removal is soft-state only: `review_state='archived'`
- Archived objects remain in D1 indefinitely
- Users have no mechanism to delete or retract their own submissions
- Admins can archive via `reviewCleanup` (test artefacts and junk) or via `reviewDecision` (evidence only, via the `archived` decision)

### 8.2 What this means for users

A user who submits a claim and later regrets it cannot retract it. The claim enters `review_state='review'` and is invisible to the public feed, but it is visible to admins in the review queue indefinitely. If an admin publishes it, the user has no recourse.

### 8.3 Recommendation

Before public launch, define and document a user-retraction policy. Options:

**Option A — No retraction (current):** Defensible for a fact-checking platform. Content submitted is treated as a public assertion. Admin-only moderation. Simple to maintain.

**Option B — Soft retraction by user:** Allow users to set their own submitted claims to `review_state='retracted'` (new state). Retracted claims are invisible to the public feed but retained in D1 for audit. Cannot be retracted if claim is already `public`.

**Option C — Retraction-as-report:** User submits a report against their own claim with `reason='retraction request'`. Admin reviews and can reject or archive. Keeps audit trail. No new DB state needed.

Recommendation: **Option C** for launch. It reuses existing infrastructure, requires no schema change, and keeps editorial control with the admin.

---

## 9. Unlock and Gating Recommendation

### 9.1 Current gating surface

The only active gates are:
1. **Claim publication**: admin must explicitly call `POST /api/review/decision` with `decision='public'`
2. **Rate limits**: per-IP, enforced in `safeRateLimit` for claims (8/hr), evidence/pressure/tests/reports (20/hr)
3. **`status_locked`**: prevents `recalcClaimScore` from changing status on protected seeds
4. **Admin routes**: `requireAdmin` checks `x-humanx-admin` token

### 9.2 Missing gates

| Gap | Risk | Recommended gate |
|-----|------|-----------------|
| No shadow ban enforcement | Banned users can still submit | Check `is_shadow_banned` in `requireUser()` — throw `USER_SHADOW_BANNED` |
| No trust threshold for evidence submission | Any new pseudonymous user can attach evidence to public claims | Consider: 1 approved claim required before evidence attach; or evidence from <N trust always enters review |
| No vote validation | Same user UUID can potentially be regenerated to re-vote | Add per-claim per-user vote uniqueness constraint in DB |
| No evidence retraction | Approved evidence with errors cannot be corrected | Add soft-retract for user's own evidence before it reaches public state |
| Pressure/test bypass review | Malicious pressure points attach to public claims immediately | Add `review_state` to `pressure_points`, `home_tests` |

### 9.3 Recommended unlock sequence

For launch readiness, implement in order:
1. **Shadow ban enforcement** (1 line in `requireUser`) — zero schema change, closes active risk
2. **Vote deduplication** — add DB unique constraint `(claim_id, user_id)` on `claim_votes`
3. **Pressure point and home test review states** — schema migration + reviewDecision handling

---

## 10. Implementation Order

Prioritised by risk reduction and schema change cost:

| Priority | Task | Schema change | Risk reduced |
|----------|------|--------------|-------------|
| P0 | Shadow ban enforcement in `requireUser` | None | Banned users currently unrestricted |
| P0 | Vote deduplication unique constraint | Additive migration | Double-vote possible |
| P1 | `review_state` on `pressure_points` table | Additive migration | Unreviewed content on public claims |
| P1 | `review_state` on `home_tests` table | Additive migration | Same |
| P2 | User retraction via report pattern (Option C) | None | User consent/trust |
| P2 | Trust score policy definition + enforcement | TBD | `trust_score` currently vestigial |
| P3 | Identity durability (optional account link) | Additive migration | Identity persistence |
| P3 | Per-user evidence listing endpoint | None | User self-service |

---

## 11. Risks and Non-Goals

### 11.1 Active risks

| Risk | Severity | Mitigated? |
|------|----------|-----------|
| Banned users submit freely | High | No — `is_shadow_banned` not enforced |
| New identity generation is instant | Medium | Partially — rate limits per IP |
| Pressure/test content unreviewed | Medium | No — no review queue for these |
| Vote manipulation via UUID regeneration | Medium | No — no uniqueness constraint |
| Public claims accumulate unreviewed pressure attacks | Medium | No |
| User data retention without consent mechanism | Low–Medium | No retraction path |

### 11.2 Non-goals for D-89A

- This document does not recommend any specific account/identity product (OAuth, passkey, etc.) beyond noting the gap
- This document does not define the trust score formula
- No recommendations for AI-assisted moderation (HumanX is explicitly RunPack-first; no owner AI credits used)
- No changes to the archive policy (D-88B–N complete; policy is stable)
- No recommendations about monetisation or access tiers

---

## 12. Files Inspected

| File | Purpose |
|------|---------|
| `src/worker.js` | Full backend — all routes, DB writes, auth, cleanup policy |
| `public/app-v10.js` | Full frontend — mode routing, user identity, API calls |
| `public/styles.css` | UI chip styles (D-87C) |
| `public/index.html` | Entry point, asset references |
| `src/belief-bridge.js`, `src/belief-snapshots.js`, `src/claim-scoring.js`, `src/evidence-reuse.js`, `src/evidence-vault.js`, `src/graph-status.js`, `src/importer.js`, `src/meaning-key.js`, `src/seed-data.js`, `src/truth-claim-bridge.js`, `src/truth-seed.js`, `src/truths.js`, `src/votes.js` | Module listing; not deep-read individually for this doc |
| `docs/D88D_ARCHIVE_DRY_PLAN.md` | Current rejected-queue state, Group D non-archivable list |
| `docs/D88C_SAFE_ARCHIVE_POST_MERGE_VERIFY.md` | Post-merge baseline |

---

## 13. Static Check Results

All checks run at commit `bad86cb` (post D-88N).

| Check | Expected | Result |
|-------|----------|--------|
| `node --check src/worker.js` | exit 0 | ✅ exit 0 |
| `node --check public/app-v10.js` | exit 0 | ✅ exit 0 |
| `scripts/hardening-smoke-test.mjs` | 147 passed | ✅ 147 passed, 0 failed |
| `scripts/belief-engine-static-check.mjs` | 24 passed | ✅ 24 passed, 0 failed |
| `scripts/worker-route-static-check.mjs` | 39 passed | ✅ 39 passed, 0 failed |

---

## 14. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| No POST made | ✅ |
| No `/api/review/cleanup` called | ✅ |
| No moderation action | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| Admin token not printed or committed | ✅ |
| No Co-Authored-By | ✅ |
