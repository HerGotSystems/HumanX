# D-168A — Public API Response Allowlist Audit

**Date:** 2026-06-25
**Scope:** Audit only. No code changes. No migration. No wrangler.toml. No owner-token work.
**Trigger:** D-166B hardened admin review queue and own-user responses. This audit extends that coverage to all unauthenticated/public surfaces.

---

## Executive Summary

**Overall verdict: public routes are substantially safe with one definite D-166B-class gap and three questionable exposures.**

The public claim, truth, and profile surfaces are well-controlled through `mapClaim()` and `mapTruth()` mappers, and the public profile routes apply deliberate explicit column allowlists. No admin token, owner token, invite code, email, `is_admin`, or sensitive internal credential is exposed on any public route.

**Primary gap found:** `POST /api/session` (`createOrGetUser`) still returns `is_shadow_banned` in the user object. D-166B removed it from four endpoints (`/api/me`, `/api/my-humanx`, `/api/my-humanx/export`, `/api/auth/invite/redeem`) but missed this fifth one. Every page load calls this endpoint, so every shadow-banned user can trivially determine their ban state on every session.

**Secondary findings:** Three lower-priority items are documented below. None constitute a secret leak; all are recommended for evaluation as part of D-168B.

---

## Route-by-Route Matrix

### `/api/health` — `GET`, unauthenticated

**File:** `src/worker.js` line 30 (inline return)

```
{ ok, service, mode, ai, legacy_ai }
```

**Verdict: Clean.** No user data, no internal IDs, no credentials. Mode string (`d1-live` / `demo-fallback`) reveals deployment type — intentional public signal.

---

### `/api/version` — `GET`, unauthenticated

**File:** `src/worker.js` line 31 + `src/deploy-meta.js`

```
{ ok, app, checkpoint, commit, baseline, updated_at, note }
```

**Verdict: Acceptable.** Exposes the git commit hash, internal checkpoint name (e.g. `D-166B`), and test baseline counts. These reveal the deployment versioning convention and build cadence. No credentials, no user data, no DB content. Acceptable for a transparent public app; the owner is aware of this tradeoff.

---

### `/api/graph-status` — `GET`, unauthenticated

**File:** `src/graph-status.js`

Returns aggregate row counts for every DB table including `users`, `reports`, `rate_limits`, `duplicate_signatures`. No rows — only counts.

**Verdict: Questionable (low risk).** The `users` count reveals total registered users. The `reports` count reveals total moderation reports. The `rateLimits` count reveals rate-limit table size. `duplicateSignatures` reveals dedup table size. None of these expose user-identifiable data. The aggregate counts could help an adversary estimate platform scale and moderation activity volume. Recommended for D-168B review: consider admin-gating or omitting the `reports`, `rateLimits`, `duplicateSignatures`, and `users` sub-counts, keeping only content-graph counts public.

---

### `POST /api/session` (`createOrGetUser`) — unauthenticated bootstrap

**File:** `src/worker.js` lines 232–253

```js
let user = await env.DB.prepare(
  `SELECT id, handle, trust_score, strike_count, is_shadow_banned FROM users WHERE id=?`
).bind(userId).first();
return json({ user, owner_token });
```

**Verdict: Gap — D-168B fix required.**

`is_shadow_banned` is included in the returned `user` object. D-166B (D-166A finding F-04/F-06) removed `is_shadow_banned` from four user-facing endpoints but did not audit this fifth endpoint. Every page load calls `POST /api/session`; a shadow-banned user can therefore trivially detect their ban on every visit by inspecting the session response.

The D-145B comment on this function explicitly notes that `is_admin` was omitted — but `is_shadow_banned` was overlooked.

**D-168B action:** Remove `is_shadow_banned` from the SELECT in `createOrGetUser()`, matching the treatment already applied to `getMe()`, `myHumanX()`, `exportMyHumanX()`, and `redeemInviteCode()`.

---

### `/api/claims` — `GET`, unauthenticated

**File:** `src/worker.js` line 746 (`listClaims`)

```js
SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id
WHERE COALESCE(c.review_state,'public')='public' ...
→ mapClaims(rows.results)
```

`mapClaim()` reduces to: `id, claim, category, type, status, evidenceScore, survivability, testability, contradictions, reportCount, reviewState, beliefYes, beliefNo, uncertainty, createdAt, updatedAt, handle, nearDuplicateOf, duplicateOf, statusLocked`.

**Fields to note:**

| Field | Classification | Verdict |
|---|---|---|
| `reportCount` | Internal moderation signal | **Acceptable.** Public apps commonly surface report counts as a quality/trust signal. No individual reporters are identified. |
| `nearDuplicateOf` | Internal dedup reference | **Acceptable as public product UX.** Used in the frontend to surface "similar claim" context. The linked claim ID reveals an existing public claim, not a private entity. |
| `duplicateOf` | Internal dedup reference | **Acceptable as public product UX.** Same rationale. |
| `statusLocked` | Admin flag | **Acceptable as public product UX.** Signals the claim status cannot be voted on. Used in public card rendering. |

**Verdict: Clean.** `c.*` is used in the SELECT but is correctly stripped by `mapClaim()` before the response. Sensitive fields (`user_id`, `normalized_claim`, `damage`, `archived_by_user`, `is_shadow_banned`) are not in `mapClaim()` and are not returned.

---

### `/api/claims/:id` — `GET`, unauthenticated

**File:** `src/worker.js` line 747 (`getClaim`)

The claim row is correctly mapped through `mapClaim()`. However, three sub-objects are returned raw via `SELECT *`:

#### Evidence (`SELECT e.*, u.handle`)

Returns all columns of the `evidence` table, including:
- `e.user_id` — pseudonymous internal user ID of the evidence submitter
- `e.report_count` — evidence-level report count
- `e.review_state` — already required for filtering (public only)
- `e.duplicate_signature` — internal dedup hash

**`e.user_id` verdict: Questionable.** This is a pseudonymous ID (e.g. `usr_abc123`), not an email or real identity. However, it links an evidence submission to an account that could potentially be cross-referenced. The frontend `getClaim()` flow does not display `user_id` — it displays `handle`. Recommended for D-168B: add an explicit evidence mapper that omits `user_id`, `duplicate_signature`, and any future-sensitive columns.

#### Pressure (`SELECT p.*, u.handle`)

Returns all columns of `pressure_points`, including `p.user_id`.

Same analysis as evidence. Recommended for D-168B: add explicit pressure mapper.

#### Tests (`SELECT t.*, u.handle`)

Returns all columns of `home_tests`, including `t.user_id`.

Same analysis. Recommended for D-168B: add explicit test mapper.

---

### `/api/evidence-vault` — `GET`, unauthenticated

**File:** `src/evidence-vault.js`

Uses an explicit named SELECT (not `*`). Maps through an explicit inline mapper. Fields returned:

`id, claimId, stance, quality, title, body, sourceUrl, mediaType, reliabilityScore, votes, duplicateSignature, createdAt, claim, claimStatus, category, handle`

**`body` verdict: Intentional.** The evidence vault is a public search surface — evidence text must be searchable and displayed. Intentional by design.

**`sourceUrl` verdict: Intentional.** Public evidence vault shows source links.

**`duplicateSignature` verdict: Questionable.** This is an internal dedup hash used to detect duplicate evidence submissions. Exposing it publicly means external observers can determine which evidence items share a hash without authenticating. No direct harm, but it is an internal implementation detail. Recommended for D-168B: evaluate whether `duplicateSignature` has any public-facing utility; if not, remove it from the vault response.

**`user_id` verdict: Not present.** Joined as `handle` only. Clean.

---

### `/api/truths` — `GET`, unauthenticated

**File:** `src/truths.js` (`listTruths`)

Uses `SELECT t.*, u.handle` but passes through `mapTruth()`. `mapTruth()` explicitly names:

`id, statement, category, origin, truthType, confidenceLabel, repetitionScore, pressureScore, linkedClaimId, linkedClaimReviewState, reviewState, createdAt, updatedAt, handle`

**Excluded by `mapTruth()`:** `user_id`, `normalized_statement`, and any future columns.

**Verdict: Clean.** No sensitive fields exposed. `normalized_statement` is an internal dedup key analogous to `normalized_claim` — correctly excluded from the public mapper.

---

### `/api/u/:slug` — `GET`, unauthenticated (public profile)

**File:** `src/worker.js` lines 625–679 (`getPublicProfile`)

All four content SELECTs use explicit named column lists. Evidence deliberately omits `body`/`source_url` (comment-confirmed). Pressure deliberately omits `body`. No `user_id` returned for any sub-object.

Belief snapshot: narrow explicit SELECT (`label, dominant_pattern, stability_score, openness_score, pressure_score, top_beliefs_json, contradiction_count, created_at`). `dimensions_json`, `contradictions_json`, and `answer_payload` blobs are excluded. Only the single owner-opted-in snapshot is returned.

**Verdict: Clean.** The profile surface is well-controlled with intentional field minimization documented inline.

---

### `/u/:slug` — Server-rendered HTML (`renderPublicProfileShell`)

**File:** `src/worker.js` lines 584–622

Injects only OG meta tags (title, description, canonical URL, og:url) using `displayName` and `bio` from `loadPublicProfileSummary()`. No user IDs, no email, no tokens, no internal IDs in the injected HTML.

**Verdict: Clean.**

---

### Own-user routes (authenticated, in scope for public surface check)

| Endpoint | `is_shadow_banned` | `is_admin` | `email` | Notes |
|---|---|---|---|---|
| `GET /api/me` | Not present ✓ (D-166B) | Not present ✓ (D-145B) | Present — intentional own-user identity |
| `GET /api/my-humanx` | Not present ✓ (D-166B) | Not present ✓ | Present — intentional |
| `GET /api/my-humanx/export` | Not present ✓ (D-166B) | Not present ✓ | Present — full data export, intentional |
| `POST /api/auth/invite/redeem` | Not present ✓ (D-166B) | Not present ✓ | Present — identity confirmed on redemption |
| `POST /api/session` | **Still present ✗** | Not present ✓ (D-145B) | Not present | **Gap — D-168B fix required** |

`exportMyHumanX()` uses `SELECT *` for all user-content tables. This is intentional for a data export endpoint scoped to the requesting user's own data. The users row SELECT is correctly explicit (excludes `is_admin`, `is_shadow_banned`, `fingerprint_hash`).

---

## Claims and Truths Mapper Verification

| Mapper | File | Sensitive fields excluded | Verdict |
|---|---|---|---|
| `mapClaim()` | `src/worker.js:855` | `user_id`, `normalized_claim`, `damage`, `archived_by_user` | Clean — used on all public claim routes |
| `mapTruth()` | `src/truths.js:118` | `user_id`, `normalized_statement` | Clean — used on public truths route |
| Evidence public profile | `src/worker.js:636` | `body`, `source_url`, `user_id` | Clean — intentional field restriction |
| Pressure public profile | `src/worker.js:638` | `body`, `user_id` | Clean — intentional field restriction |

---

## Console/Log Exposure in Frontend

Per D-166D live verification: `console.` is **absent** from production `public/app-v10.js`. No console logging in the production frontend.

---

## Claim-Builder Context Exposure

`claimBuilderContext` is injected by `attachClaimBuilderContexts()` and is only present in the `/api/review` (admin-gated) response. It is not attached to public `listClaims()` or `getClaim()` responses. Confirmed safe.

---

## Public Routes — Private Field Summary

| Private field | Present on any public unauthenticated route? |
|---|---|
| `is_shadow_banned` | `/api/session` only — **gap, fix in D-168B** |
| `is_admin` | Not present anywhere public ✓ |
| `user_id` (own) | Not present on any own-user response ✓ |
| `user_id` (others) | Present in `getClaim()` evidence/pressure/tests via `SELECT *` — **questionable, D-168B recommend** |
| `email` | Not present on any public route ✓ |
| `fingerprint_hash` | Not present on any route (omitted since D-145B) ✓ |
| `normalized_claim` | Not present on any public route (`mapClaim()` excludes it) ✓ |
| `normalized_statement` | Not present on public truths route (`mapTruth()` excludes it) ✓ |
| `damage` | Not present on any public route ✓ |
| `invite_code` values | Not present on any public route ✓ |
| Admin token value | Not present anywhere ✓ |
| Owner token value | Not present on frontend JS ✓ (D-166D) |
| `HUMANX_OWNER_SECRET` | Not present anywhere ✓ |

---

## D-168B Recommended Patch List

### Fix 1 — Required: Remove `is_shadow_banned` from `createOrGetUser` (`POST /api/session`)

**File:** `src/worker.js` line 244 (and line 247 — the fallback re-query)  
**Change:** Remove `is_shadow_banned` from both SELECT statements in `createOrGetUser()`.  
**Why:** Shadow-ban effectiveness depends on the banned user not knowing their status. This is the same reason D-166B removed it from four other endpoints — the fifth one was overlooked.

```sql
-- Before:
SELECT id, handle, trust_score, strike_count, is_shadow_banned FROM users WHERE id=?

-- After:
SELECT id, handle, trust_score, strike_count FROM users WHERE id=?
```

### Fix 2 — Recommended: Add explicit mappers for evidence/pressure/tests in `getClaim()`

**File:** `src/worker.js` line 747 (`getClaim`)  
**Change:** Replace `SELECT e.*`, `SELECT p.*`, `SELECT t.*` with named-column SELECTs that omit `user_id`, `duplicate_signature`, and any other internal fields not needed for the public claim detail view.  
**Why:** `user_id` is a pseudonymous internal ID but follows the same principle as `mapClaim()` excluding it — public surfaces should not surface internal row identifiers beyond what the product intentionally displays. `duplicate_signature` is an internal dedup hash with no product value on the public detail page.

### Fix 3 — Recommended: Remove `duplicateSignature` from evidence vault response

**File:** `src/evidence-vault.js` line 44  
**Change:** Remove `duplicate_signature` from the SELECT and the mapper.  
**Why:** Internal dedup hash. No product utility for public users. Follows the principle of not exposing internal implementation fields through public surfaces.

### Fix 4 — Evaluate: Admin-gate or narrow `GET /api/graph-status`

**File:** `src/graph-status.js`  
**Change options:** (a) Add `requireAdmin` gate, (b) return only content-graph counts (`claims`, `evidence`, `truths`, `pressure`, `tests`), or (c) leave as-is with documented rationale.  
**Why:** Returns aggregate counts for `users`, `reports`, `rate_limits`, `duplicate_signatures` — internal operational metrics. No individual data exposed, but scale/moderation activity is publicly visible. Low severity; depends on whether public graph transparency is a product goal.

---

## Security Properties Confirmed Clean

- No admin token value on any route ✓
- No owner token value on any route ✓ (advisory token from POST /api/session is user-specific HMAC, not the secret)
- No invite code values on any public route ✓
- No `is_admin` anywhere public ✓
- No `email` on public unauthenticated routes ✓
- `mapClaim()` correctly excludes `normalized_claim`, `damage`, `user_id`, `archived_by_user` ✓
- `mapTruth()` correctly excludes `user_id`, `normalized_statement` ✓
- Public profile deliberately omits `body`/`source_url` for evidence, `body` for pressure ✓
- Public profile returns only owner-opted-in belief snapshot ✓
- All five review routes remain `requireAdmin`-gated ✓
- Shadow-ban enforcement (`requireUser()` → `USER_SHADOW_BANNED`) intact ✓
- No console logging in production frontend JS ✓

---

## No Code Changes in This Task

- `src/worker.js` — not touched
- `public/app-v10.js` — not touched
- No route added, removed, or changed
- No admin-token or owner-token logic changed
- No migration
- No `wrangler.toml`
- No owner-token work resumed — D-149H hold remains in effect

---

## Smoke Tests

Baseline unchanged: **1223/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1223 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this task.
