# D-168B — Public API Response Allowlist Patch

**Date:** 2026-06-25
**Scope:** `src/worker.js`, `src/evidence-vault.js`, `src/graph-status.js`, `scripts/hardening-smoke-test.mjs`. No frontend changes, no migration, no wrangler.toml, no owner-token work.
**Source:** D-168A findings.

---

## What Changed

### 1. `POST /api/session` (`createOrGetUser`) — remove `is_shadow_banned` from session response

**File:** `src/worker.js` — `createOrGetUser()` (two SELECT statements)

**Before:**
```sql
SELECT id, handle, trust_score, strike_count, is_shadow_banned FROM users WHERE id=?
```

**After:**
```sql
SELECT id, handle, trust_score, strike_count FROM users WHERE id=?
```

**Why:** D-168A found this as the primary gap from D-166B. Shadow-ban effectiveness depends on the banned user not knowing their status. D-166B removed `is_shadow_banned` from four endpoints (`/api/me`, `/api/my-humanx`, `/api/my-humanx/export`, `/api/auth/invite/redeem`) but missed `createOrGetUser` — which is called on every page load via `boot()`'s `POST /api/session` call.

**What did not change:**
- `requireUser()` still reads `is_shadow_banned` from DB internally and throws `USER_SHADOW_BANNED` — enforcement is unchanged.
- Shadow-ban database column not dropped.
- `ensureUser()` not changed.
- Owner-token minting logic unchanged.

---

### 2. `GET /api/claims/:id` (`getClaim`) — explicit column SELECTs for evidence/pressure/tests

**File:** `src/worker.js` — `getClaim()` (four query strings)

**Before:**
```sql
-- Direct evidence
SELECT e.*, u.handle, 'direct' AS link_type FROM evidence e LEFT JOIN users u ON u.id=e.user_id WHERE ...

-- Reused evidence
SELECT e.*, u.handle, l.stance AS linked_stance, l.link_note, 'reused' AS link_type FROM evidence_claim_links l JOIN evidence e ... WHERE ...

-- Pressure
SELECT p.*, u.handle FROM pressure_points p LEFT JOIN users u ON u.id=p.user_id WHERE ...

-- Tests
SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE ...
```

**After:**
```sql
-- Direct evidence
SELECT e.id, e.claim_id, e.title, e.body, e.source_url, e.stance, e.quality, e.report_count,
  e.review_state, e.created_at, e.media_type, e.reliability_score, e.votes,
  u.handle, 'direct' AS link_type, NULL AS linked_stance, NULL AS link_note
FROM evidence e LEFT JOIN users u ON u.id=e.user_id WHERE ...

-- Reused evidence
SELECT e.id, e.claim_id, e.title, e.body, e.source_url, e.stance, e.quality, e.report_count,
  e.review_state, e.created_at, e.media_type, e.reliability_score, e.votes,
  u.handle, l.stance AS linked_stance, l.link_note, 'reused' AS link_type
FROM evidence_claim_links l JOIN evidence e ON e.id=l.evidence_id LEFT JOIN users u ON u.id=e.user_id WHERE ...

-- Pressure
SELECT p.id, p.claim_id, p.title, p.body, p.severity, p.review_state, p.report_count,
  p.created_at, p.updated_at, u.handle
FROM pressure_points p LEFT JOIN users u ON u.id=p.user_id WHERE ...

-- Tests
SELECT t.id, t.claim_id, t.title, t.instructions, t.safety_level, t.difficulty,
  t.created_at, t.updated_at, u.handle
FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE ...
```

**Fields removed from public `/api/claims/:id` responses:**

| Table | Field removed | Reason |
|---|---|---|
| `evidence` | `user_id` | Internal pseudonymous ID; submitter is displayed via `handle` |
| `evidence` | `duplicate_signature` | Internal dedup hash; no product utility on public claim detail |
| `evidence` | `archived_by_user` | Internal moderation flag |
| `pressure_points` | `user_id` | Internal pseudonymous ID; submitter displayed via `handle` |
| `pressure_points` | `archived_by_user` | Internal moderation flag |
| `home_tests` | `user_id` | Internal pseudonymous ID; submitter displayed via `handle` |

**Fields intentionally preserved:**

| Field | Reason preserved |
|---|---|
| `report_count` | Used by public frontend for "reported" badge display |
| `review_state` | Required by frontend for item visibility filtering |
| `body` | Evidence text is the product content |
| `source_url` | Evidence sources are intentional public data |
| `media_type` | Used by evidence display |
| `reliability_score` | Used by evidence vault sorting; present in public vault too |
| `votes` | Vote counts are public product data |
| `handle` | Submitter display name (pseudonymous, not user_id) |

**Note:** The `getClaim()` claim row itself continues to use `SELECT c.*, u.handle` → `mapClaim()`, which correctly strips all sensitive fields before returning. This is unchanged.

---

### 3. `/api/evidence-vault` (`listEvidenceVault`) — remove `duplicate_signature`

**File:** `src/evidence-vault.js`

**Before:**
```js
// In SELECT:
e.duplicate_signature,

// In mapper:
duplicateSignature: row.duplicate_signature,
```

**After:** Both removed.

**Why:** Internal dedup hash with no product utility for public vault users. An external observer with this field could determine which evidence items share a dedup signature without authenticating.

---

### 4. `/api/graph-status` (`graphStatus`) — reduce to product-visible table counts

**File:** `src/graph-status.js`

**Before:** 17 tables — included `users`, `rate_limits`, `duplicate_signatures`, `belief_snapshots`, `analysis_results`, `aip_packets`, `truth_claim_links`, `evidence_votes`, `truth_votes`, `home_tests`, `pressure_points` + derived `summary` block.

**After:** 6 tables matching exactly what `graphBox()` in the frontend displays:

```js
const tables = [
  ['claims', 'claims'],
  ['evidence', 'evidence'],
  ['truths', 'truths'],
  ['evidence_claim_links', 'evidenceClaimLinks'],
  ['claim_votes', 'claimVotes'],
  ['reports', 'reports'],
];
```

**`summary` block:** Removed entirely. It was entirely derived from `graph` counts and was not used by any frontend code.

**`reports` count:** Kept. The public `graphBox()` UI displays it as one of six graph counters. This is an intentional public product signal showing moderation activity volume.

**Internal counts removed from public response:**
- `users` — total registered user count (internal metric)
- `rate_limits` — rate-limit table row count (internal operational metric)
- `duplicate_signatures` — dedup table size (internal)
- `belief_snapshots` — not displayed in graph box
- `analysis_results` — not displayed in graph box
- `aip_packets` / `runpacks` — not displayed in graph box
- `truth_claim_links` — not displayed in graph box
- `evidence_votes`, `truth_votes` — not displayed in graph box
- `home_tests`, `pressure_points` — not displayed in graph box

**What did not change:** `ok` field logic, `errors` object, and the six product-visible graph keys all remain in the same positions. No frontend code changes needed.

---

## D-168A Findings Addressed

| D-168A Finding | D-168B Action |
|---|---|
| Primary gap: `is_shadow_banned` in `/api/session` | Fixed: removed from both SELECT statements in `createOrGetUser()` |
| `user_id` in `getClaim()` evidence/pressure/tests | Fixed: explicit column SELECTs omit `user_id` |
| `duplicate_signature` in `getClaim()` evidence | Fixed: not included in explicit evidence SELECT |
| `duplicate_signature` in evidence vault | Fixed: removed from SELECT and mapper |
| `graph-status` internal inventory counts | Fixed: reduced to 6 product-visible tables; `summary` removed |

---

## What Did Not Change

- **Admin review routes:** `reviewDecision`, `reviewCleanup`, `markDuplicate`, `resolveSimilar`, `reviewQueue` — all unchanged. Their `SELECT *` queries are admin-gated and intentionally return full rows for moderation context.
- **`addEvidence()` / `addPressure()` / `addHomeTest()` mutation responses** — these are authenticated write routes returning the newly inserted row back to its submitter. The `user_id` in these responses belongs to the requester. Not patched in D-168B; noted for a future audit.
- **`claimDetail()` (internal) / RunPack** — already used explicit column SELECTs before D-168B; unchanged.
- **`mapClaim()`** — unchanged. Still correctly excludes `normalized_claim`, `damage`, `user_id`, `archived_by_user`.
- **`mapTruth()`** — unchanged.
- **Public profile (`getPublicProfile()`)** — unchanged; already had intentional explicit column SELECTs.
- **`requireUser()` enforcement** — unchanged; still reads and enforces `is_shadow_banned` from DB.
- **No migration** — no schema changes, only query minimization.
- **No `wrangler.toml`.**
- **No frontend changes** — `public/app-v10.js` not modified.
- **No route added, removed, or semantically changed.**
- **No admin-token or owner-token logic changed.**
- **No owner-token work resumed** — D-149H hold remains in effect.

---

## Smoke Tests

17 new tests added in Section 99. All existing 1223 tests continue to pass.

**New tests:**

| Test | What it verifies |
|---|---|
| `D-168B: POST /api/session createOrGetUser SELECT does not include is_shadow_banned` | Session SELECT excludes shadow-ban flag |
| `D-168B: shadow-ban enforcement code still present in requireUser` | `requireUser()` enforcement intact after D-168B |
| `D-168B: getClaim() public evidence SELECT does not use SELECT e.*` | Wildcard replaced by explicit list |
| `D-168B: getClaim() public evidence SELECT does not expose user_id` | Column list only (not JOIN condition) |
| `D-168B: getClaim() public evidence SELECT does not expose duplicate_signature` | Dedup hash absent |
| `D-168B: getClaim() public pressure SELECT does not use SELECT p.*` | Wildcard replaced |
| `D-168B: getClaim() public pressure SELECT does not expose user_id` | Column list only |
| `D-168B: getClaim() public tests SELECT does not use SELECT t.*` | Wildcard replaced |
| `D-168B: getClaim() public tests SELECT does not expose user_id` | Column list only |
| `D-168B: public evidence vault SELECT does not expose duplicate_signature` | Hash absent from vault |
| `D-168B: public evidence vault response mapper does not include user_id` | Mapper object check |
| `D-168B: public graph-status does not expose internal inventory counts` | users/rateLimits/duplicateSignatures absent |
| `D-168B: public graph-status retains product-visible counts` | Six graphBox() keys present |
| `D-168B: review routes remain requireAdmin-gated` | All five review functions still call requireAdmin first |
| `D-168B: no owner-token enforcement resumed` | OWNER_TOKEN_REQUIRED/INVALID absent |
| `D-168B: public routes do not expose is_admin on any known own-user SELECT` | SQL column lists checked for all own-user routes |
| `D-168B: public routes do not expose is_shadow_banned on known own-user SELECTs` | SELECT strings checked across all five own-user functions |

**New baseline: 1240/24/57**
(Previous: 1223/24/57. Net: +17 smoke tests.)

---

## Recommended Next Step

D-168C (optional): audit and narrow the authenticated write-route mutation responses (`addEvidence()`, `addPressure()`, `addHomeTest()`) which still return `SELECT *` rows back to the writing user. These are lower priority than the public read surface patched here — the `user_id` in these responses belongs to the authenticated requester — but explicit column SELECTs would make the schema boundary consistent across all public-facing functions.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.

---

## No Admin/Review Route Semantics Changed

All five review routes (`/api/review`, `/api/review/decision`, `/api/review/cleanup`, `/api/review/mark-duplicate`, `/api/review/resolve-similar`) are unchanged. Their `requireAdmin` gating, decision types, cleanup gates, and duplicate flow are all preserved.
