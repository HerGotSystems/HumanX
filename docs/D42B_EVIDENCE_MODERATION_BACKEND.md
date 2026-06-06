# D-42B: Evidence Moderation Backend

Date: 2026-06-06
Branch: `feature/d42b-evidence-moderation-backend`
Status: Branch + PR. No live tests. No Wrangler. No D1 commands. No frontend changes.

---

## Migration prerequisite

Migration 0007 (`evidence.review_state TEXT DEFAULT 'public'`, `evidence.report_count INTEGER DEFAULT 0`,
`idx_evidence_review_state`, `idx_evidence_report_count`) was applied to production D1 manually
via Cloudflare D1 Console on 2026-06-06 (D-42A). PRAGMA-verified before and after. Full record
in `docs/D42A_EVIDENCE_MIGRATION_APPLY_RESULT.md`.

**The backend code in this PR is safe to deploy. The columns exist in production.**

---

## Backend changes — `src/worker.js`

### 1. `insertEvidence` — new evidence enters review

**Before:** `INSERT INTO evidence (id,claim_id,...,created_at) VALUES (?,?,...)` — no
`review_state` column. Column default `'public'` would apply, making new evidence immediately
public.

**After:** `INSERT INTO evidence (id,claim_id,...,created_at,review_state) VALUES (?,?,...,?)`.
Explicit bind of `reviewState` parameter (default `'review'`). New evidence is not publicly
visible until an admin approves it.

**Caller behaviour:**
- `addEvidence` (user submits evidence via `POST /api/evidence`): passes `reviewState='review'`
  (default). Evidence enters queue.
- `createClaim` initialEvidence path: also passes `reviewState='review'` (default). Initial
  evidence enters queue. Conservative choice — admin must approve evidence separately from
  the claim. See risk note below.

**Return shape:** object now includes `review_state: reviewState` field. Response shape
backward-compatible — `review_state` is a new field, not a rename or removal.

---

### 2. `claimDetail` — evidence-level filter (both queries)

**Before:** direct evidence query `FROM evidence WHERE claim_id=?` — no review_state filter.
Reused evidence query `WHERE l.claim_id=?` — no filter.

**After:**
- Direct: `WHERE claim_id=? AND COALESCE(review_state,'public')='public'`
- Reused: `WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'`

**Effect:** Study view and RunPack packet do not include pending or rejected evidence.
`COALESCE(...,'public')` treats any NULL row (pre-migration legacy) as public — no
disruption to existing evidence.

`claimDetail` is called by: `createClaim` tail (response for new claim), `createAipPacket`
(RunPack build). Both now return only approved evidence.

---

### 3. `getClaim` — evidence-level filter (both inline queries)

**Before:** `WHERE e.claim_id=?` (direct), `WHERE l.claim_id=?` (reused) — no filter.

**After:**
- Direct: `WHERE e.claim_id=? AND COALESCE(e.review_state,'public')='public'`
- Reused: `WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'`

**Effect:** `GET /api/claims/:id` (Study view) no longer returns pending evidence.

---

### 4. `reportTarget` — evidence branch

**Before:** only `targetType === 'claim'` incremented report count. `targetType='evidence'`
was ignored (report row was inserted but evidence was never updated).

**After:** new `if (targetType === 'evidence')` branch:
```js
UPDATE evidence SET report_count=report_count+1,
  review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END
  WHERE id=?
```

Auto-escalation threshold: 2 reports → `review_state='review'`. Same policy as claims.
Existing claim behaviour is unchanged.

---

### 5. `reviewQueue` — evidence items

**Before:** returned `claims` and `truths` arrays. `review` combined array contained only
claim and truth rows.

**After:** new evidence query:
```sql
SELECT 'evidence' AS target_type, e.id, e.claim_id, e.title, e.body, e.source_url,
  e.stance, e.quality, e.review_state, e.report_count, e.created_at,
  c.claim AS parent_claim,
  (SELECT r.reason FROM reports r WHERE r.target_type='evidence' AND r.target_id=e.id
   AND r.status='open' ORDER BY r.created_at DESC LIMIT 1) AS latest_report_reason
FROM evidence e LEFT JOIN claims c ON c.id=e.claim_id
WHERE COALESCE(e.review_state,'public') NOT IN ('public','archived') OR e.report_count>0
ORDER BY e.created_at DESC LIMIT 100
```

Response now includes:
- `evidence` array (evidence items in queue)
- `review` combined array (claims + truths + evidence, sorted by `updated_at || created_at`)

**Response shape note:** `evidence` is a new field in the response — existing frontend code
reading `response.claims` and `response.truths` is unaffected. The `review` combined array
now includes items with `target_type='evidence'`. The Review UI (`renderReviewInspectPanel`,
`reviewCard`) does not yet handle `target_type='evidence'` — this is D-43. Evidence cards
will appear in the admin Review queue but may render imperfectly until D-43 is merged.

**Sort fallback:** evidence has no `updated_at`. Sort uses `b.updated_at || b.created_at || 0`
so evidence items sort by creation time alongside claim/truth items.

---

### 6. `reviewDecision` — evidence branch

**Before:** only `'claim'` and `'truth'` handled. `BAD_REVIEW_TARGET` with `allowed:['claim','truth']`.

**After:** new `targetType === 'evidence'` branch:
```js
UPDATE evidence SET review_state=?, report_count=0 WHERE id=?
UPDATE reports SET status=? WHERE target_type='evidence' AND target_id=? AND status='open'
SELECT e.*, c.claim AS parent_claim FROM evidence e LEFT JOIN claims c WHERE e.id=?
return json({ ok:true, targetType:'evidence', decision, item:row })
```

`BAD_REVIEW_TARGET` allowed list updated to `['claim','truth','evidence']`.

Decisions: `'public'` (approve), `'review'` (re-queue), `'rejected'` (reject). Same allowed
set as claims and truths — no new decisions introduced.

---

## Backend change — `src/evidence-vault.js`

**Before (post D-38):**
```sql
WHERE COALESCE(c.review_state,'public')='public' AND (e.title LIKE ? ...)
```

**After:**
```sql
WHERE COALESCE(c.review_state,'public')='public'
  AND COALESCE(e.review_state,'public')='public'
  AND (e.title LIKE ? ...)
```

Evidence in `review` or `rejected` state no longer appears in Vault search results, even
if the parent claim is approved. `COALESCE` ensures pre-migration NULL rows remain visible.

---

## No frontend changes

`public/app-v10.js` is unchanged. The frontend will see:

- Evidence Vault: fewer results (pending evidence filtered out) — correct and expected
- Study view: pending evidence does not appear — correct and expected  
- Review queue: evidence items now appear with `target_type='evidence'` — these will render
  with whatever `reviewCard` does for unknown target types; may show partial data until D-43
- `addEvidence` response: `review_state:'review'` field now present — frontend ignores
  unknown fields, no crash

D-43 will add proper Review UI handling for evidence items.

---

## Risk notes

### Initial evidence on new claims

When a user submits a claim with `initialEvidence`, both the claim and the evidence enter
`review_state='review'`. An admin who approves the claim must also separately approve the
evidence before it appears in the Study view. Failing to do so produces an approved public
claim with an empty evidence list.

**This is intentional.** Each item is reviewed individually. D-43 will add a visual
indicator in the inspect panel: "N evidence items pending review for this claim."

### Existing evidence

All existing evidence was given `review_state='public'` by the column default when migration
0007 applied. The `COALESCE(...,'public')='public'` filter in all queries ensures NULL rows
also pass. Existing evidence is unaffected.

### Review queue evidence cards before D-43

Evidence items in the admin `review` array have a different shape from claim/truth items
(no `claim` field, no `near_duplicate_of`, has `parent_claim`, `stance`, `quality`). Until
D-43 updates `reviewCard`, evidence cards may render with missing text or empty fields.
This does not break the admin UI — it renders partially. It does not affect public users.

### `recalcClaimScore` includes pending evidence

`recalcClaimScore` is not changed in D-42B. It counts all evidence regardless of
`review_state`. Pending evidence that hasn't been approved still contributes to the claim
score. This is a known Phase 2 limitation. D-44+ can add a `review_state='public'` filter
to score recalculation if needed.

---

## Static checks

| Check | Count |
|-------|-------|
| `hardening-smoke-test.mjs` | `108 passed, 0 failed` (was 103, +5 in section 23) |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` (unchanged) |
| `worker-route-static-check.mjs` | `39 passed, 0 failed` (unchanged — no new routes) |
| `node --check src/worker.js` | exit 0 |
| `node --check public/app-v10.js` | exit 0 |

No new API routes were added. `worker-route-static-check.mjs` is unaffected.

---

## What D-43 must do next

- `reviewCard` in `app-v10.js`: handle `target_type='evidence'`, render `title`, `stance`,
  `quality`, `parent_claim`, `review_state`, `report_count`, `latest_report_reason`
- `renderReviewInspectPanel`: add evidence-specific inspect fields (title, body, source_url,
  stance, quality, parent claim link, N pending evidence note on claim cards)
- After D-43 merge + deploy: trigger GitHub Actions `HumanX Read Smoke` to confirm live
  endpoints unaffected

---

## D-42B completion record

| Item | Status |
|------|--------|
| Migration 0007 applied (D-42A) | ✅ Confirmed |
| `insertEvidence` — review_state added | ✅ Done |
| `claimDetail` — evidence filter added | ✅ Done |
| `getClaim` — evidence filter added | ✅ Done |
| `evidence-vault.js` — evidence filter added | ✅ Done |
| `reportTarget` — evidence branch added | ✅ Done |
| `reviewQueue` — evidence query added | ✅ Done |
| `reviewDecision` — evidence branch added | ✅ Done |
| Section 23 static checks (5 checks, 103→108) | ✅ Done |
| `docs/README.md` updated (108) | ✅ Done |
| `docs/API_ENDPOINT_INVENTORY.md` updated | ✅ Done |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` updated | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No Wrangler, no D1 CLI, no live tests | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No new migrations | ✅ Confirmed |
| No data deleted or destructive cleanup | ✅ Confirmed |
