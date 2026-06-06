# D-24C: Backend Moderation D1 Audit

Date: 2026-06-06
Status: Audit only. No code changes, no migrations, no D1 commands, no writes.

---

## Audit sources

- `src/worker.js` — full read
- `migrations/0001_init.sql` — initial claims/evidence/pressure schema
- `migrations/0002_home_tests.sql` — home_tests table
- `migrations/0003_full_schema.sql` — full live schema reference
- `migrations/0004_unique_normalized_content.sql` — uniqueness indexes
- `migrations/0005_add_home_tests_updated_at.sql` — ALTER TABLE patch
- `docs/D23_BACKEND_MODERATION_PLAN.md` — plan under audit

---

## Nine core questions answered

### Q1. Is `near_duplicate_of` live in production D1?

**Yes — but it is not in any migration file.**

The column was added manually via the Cloudflare D1 console during D-10A. It does not appear in `migrations/0003_full_schema.sql` (which only has `duplicate_of TEXT`). It was added as an out-of-band ALTER TABLE and is confirmed live because:
- `createClaim` writes `UPDATE claims SET near_duplicate_of=? WHERE id=?` (line 79 of worker.js)
- `mapClaim` reads `nearDuplicateOf: c.near_duplicate_of || null` (line 97)
- The review queue SELECT uses `c.*`, so `near_duplicate_of` is returned

**Risk:** A fresh D1 rebuild from migrations would be missing this column. The full-schema migration (0003) needs to be updated before any new deployment from scratch.

---

### Q2. What is the status of `duplicate_of`?

**Present in schema migration 0003, but not written by any current worker route and not surfaced by `mapClaim`.**

- `migrations/0003_full_schema.sql` line 36: `duplicate_of TEXT` in the `claims` table definition
- No worker route currently writes to `duplicate_of`
- `mapClaim` does not include `duplicate_of` in its return object
- The frontend's `renderReviewInspectPanel` references `item.duplicate_of || item.duplicateOf || null` and would display it in the inspect panel if present — but since `mapClaim` doesn't return it, the field is always null/absent in practice
- No index on `duplicate_of` exists

**Conclusion:** `duplicate_of` is a reserved schema field. It is safe to write to without a migration, but `mapClaim` must be updated to surface it, and `reviewQueue` must handle `review_state='duplicate'` correctly.

---

### Q3. What values of `review_state` are currently in use?

| Value | Written by | Used in queries |
|-------|-----------|-----------------|
| `'review'` | `createClaim` (INSERT), `reportTarget` (conditional UPDATE), `reviewDecision` | `reviewQueue` filter, `listClaims` exclusion |
| `'public'` | `seedDemoClaims` (INSERT), `reviewDecision` | `listClaims` (shows only public) |
| `'rejected'` | `reviewDecision` | `reviewCleanup` prerequisite check |
| `'archived'` | `reviewCleanup` | `reviewQueue` explicit exclusion, archived count query |
| `'duplicate'` | **Nothing currently writes this** | Frontend CSS `review-card-duplicate` exists; `reviewDecision` does NOT allow it |

`review_state='duplicate'` is anticipated by the frontend but has no write path. `reviewDecision` explicitly restricts its `allowed` set to `['public', 'review', 'rejected']` — adding `'duplicate'` there directly is not safe since `reviewDecision` has no ancestry-preservation logic.

---

### Q4. Which worker routes touch `review_state`?

| Route | Method | Auth | Effect on `review_state` |
|-------|--------|------|--------------------------|
| `POST /api/claims` | createClaim | user | Sets `review_state='review'` on INSERT |
| `POST /api/report` | reportTarget | user | Sets `review_state='review'` if `report_count+1 >= 2` (via CASE) |
| `POST /api/review/decision` | reviewDecision | admin | Sets to `public`, `review`, or `rejected` |
| `POST /api/review/cleanup` | reviewCleanup | admin | Sets to `'archived'` (rejected artefacts only) |
| `GET /api/claims` | listClaims | user | Reads: filters `WHERE COALESCE(review_state,'public')='public'` |
| `GET /api/review` | reviewQueue | admin | Reads: excludes `archived`; counts archived separately |

No route currently sets `review_state='duplicate'` or clears `near_duplicate_of`.

---

### Q5. What does `requireAdmin` check?

`x-humanx-admin` request header compared against `env.HUMANX_ADMIN_TOKEN`. Returns 403 `{error:'ADMIN_REQUIRED'}` if absent or mismatched. This is the correct auth pattern to use for the new endpoints.

---

### Q6. Does `listClaims` already exclude `review_state='duplicate'`?

**Yes, implicitly.** `listClaims` filters `WHERE COALESCE(review_state,'public')='public'`. A claim with `review_state='duplicate'` would not match `='public'`, so it would never appear in the public claims list. No additional exclusion is needed for `listClaims`.

---

### Q7. Does `reviewQueue` need updating to handle `review_state='duplicate'`?

**Yes.** `reviewQueue` currently excludes only `'archived'`:
```sql
WHERE COALESCE(c.review_state,'public')!='archived'
AND (COALESCE(c.review_state,'public')!='public' OR c.report_count>0)
```
A `review_state='duplicate'` claim would pass the `!='archived'` filter and, since it is not `'public'`, would appear in the review queue. After D-24C implementation, `reviewQueue` should exclude `'duplicate'` alongside `'archived'`:
```sql
WHERE COALESCE(c.review_state,'public') NOT IN ('public','archived','duplicate')
OR c.report_count>0
```
(with appropriate logic to include reported-but-public claims while excluding duplicate ones).

---

### Q8. Is there any index needed for the new operations?

- `duplicate_of` has no index. If the moderator mark-duplicate endpoint only writes `duplicate_of` (no lookup by it), no index is required immediately.
- `near_duplicate_of` already has `idx_claims_near_duplicate_of` (added manually in D-10A alongside the column). The resolve-similar endpoint would UPDATE `near_duplicate_of = NULL` by claim ID (already indexed by primary key). No additional index needed.
- `review_state` already has `idx_claims_review_state` and `idx_claims_review_updated`. No new indexes needed.

---

### Q9. What is the safest backend branch structure for D-24C implementation?

Based on this audit, the recommended sequence on a new branch from main:

**Step 1 — `POST /api/review/mark-duplicate`** (new endpoint, behind `requireAdmin`)
- Body: `{ claimId, duplicateOf, adminToken }` (adminToken in header, not body)
- Validate: `claimId` and `duplicateOf` are non-empty, distinct, valid IDs
- Validate: target claim exists in D1
- Validate: source claim exists and `review_state` is `'review'` (not already public/archived/duplicate)
- Write: `UPDATE claims SET duplicate_of=?, review_state='duplicate', updated_at=? WHERE id=?`
- Do NOT delete the source claim. Do NOT move evidence. Do NOT alter the target.
- Return: `{ ok:true, claimId, duplicateOf, review_state:'duplicate' }`

**Step 2 — `POST /api/review/resolve-similar`** (new endpoint, behind `requireAdmin`)
- Body: `{ claimId }` (admin via header)
- Validate: `claimId` non-empty, claim exists, `near_duplicate_of` is currently non-null
- Write: `UPDATE claims SET near_duplicate_of=NULL, updated_at=? WHERE id=?`
- Return: `{ ok:true, claimId, action:'resolved' }`

**Step 3 — Update `reviewQueue` query** (same branch)
- Exclude `review_state='duplicate'` from the main review list (alongside `'archived'`)
- Add a `duplicate_total` count to the metadata response (analogous to `archived_total`)

**Step 4 — Update `mapClaim`** (same branch)
- Add `duplicateOf: c.duplicate_of || null` to the returned object so the frontend inspect panel can display it

**Step 5 — Update `reviewDecision`** (optional, same branch)
- Consider NOT adding `'duplicate'` to the `allowed` set in `reviewDecision`. Duplicate resolution should go through the dedicated `mark-duplicate` endpoint only. This preserves the ancestry-preservation and logging semantics.

---

## Schema gaps identified

| Gap | Risk | Status |
|-----|------|--------|
| `near_duplicate_of` not in any migration | A fresh D1 rebuild would be missing this column | **Closed (D-24F)** — `migrations/0006_add_near_duplicate_of.sql` created; safe for fresh rebuilds only; production must not reapply |
| `duplicate_of` not in `mapClaim` | Inspect panel shows null even when set | **Closed (D-24D)** — `mapClaim` now returns `duplicateOf` field |
| `review_state='duplicate'` not excluded from `reviewQueue` | Duplicate claims would linger in the review queue | **Closed (D-24D)** — `reviewQueue` SQL excludes `'duplicate'` alongside `'archived'` |

---

## Safety constraints confirmed

All constraints from `docs/D23_BACKEND_MODERATION_PLAN.md` remain intact:

- No automatic deduplication ✓
- No silent merges ✓  
- Source claim record preserved (not deleted) ✓
- All new endpoints require `requireAdmin()` ✓
- Branch + PR required for implementation ✓
- No new D1 columns needed for the two new endpoints (`duplicate_of` already exists in schema; `near_duplicate_of` already live) ✓

---

## What is not yet audited

- Production D1 row counts and actual `near_duplicate_of` / `duplicate_of` value distribution — requires a live read with admin token. Not done in this batch.
- Whether `review_state` column in the `truths` table needs the same `'duplicate'` exclusion. `truths` does not have `duplicate_of` in its schema — truth deduplication is out of scope for D-24C.
- Cloudflare Worker deploy state — not verified against live endpoints in this batch.
