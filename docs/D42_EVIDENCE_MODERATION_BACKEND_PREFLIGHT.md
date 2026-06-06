# D-42: Evidence Moderation Backend — Preflight Audit

Date: 2026-06-06
Status: Docs-only preflight. No Worker changes, no migrations applied, no D1 commands.

---

## Purpose

This document is the implementation preflight for the D-42 backend branch. It records
the exact current state of every function that must change, the precise SQL and logic
edits required, the two implementation approaches and which is recommended, all risk
points, the static checks to add, and the stop conditions.

Nothing is implemented here. D-42B (the actual branch + PR) must not begin until
migration 0007 is confirmed applied to production (see section 2).

---

## 1. Preconditions checklist

All items must be confirmed true before `feature/d42-evidence-moderation-backend` is
created and any code is written:

- [ ] **Migration 0007 approved**: user gives explicit in-session approval to apply
      `migrations/0007_add_evidence_review_state.sql` to the production D1 database.
- [ ] **PRAGMA confirmed**: `PRAGMA table_info(evidence)` run against production confirms
      `review_state` and `report_count` are absent. If either is already present, the
      migration must not run.
- [ ] **Migration applied**: migration executed via Cloudflare D1 console or Wrangler
      (with explicit approval). Both `ALTER TABLE` statements and both `CREATE INDEX`
      statements completed without error.
- [ ] **Migration verified**: `PRAGMA table_info(evidence)` re-run after apply; both
      `review_state` and `report_count` appear in output with correct defaults.
- [ ] **Static baseline clean**: `node scripts/hardening-smoke-test.mjs` shows
      103 passed, 0 failed immediately before starting the branch.

---

## 2. Approach decision

### Option A — Migration-first strict

Write backend code that assumes `evidence.review_state` and `evidence.report_count`
exist. No fallbacks. Code references the columns directly in SQL.

**Pros:** Clean, readable, no defensive noise, consistent with how claims/truths work.
**Cons:** Code cannot be merged before the migration is applied. If the migration is
delayed, the branch cannot land.

### Option B — Backward-compatible soft

Wrap evidence-column SQL in try/catch blocks. If the column is absent, silently fall
back to pre-D-42 behaviour (all evidence public, no reporting). Column presence can
also be detected at startup via `PRAGMA table_info(evidence)`.

**Pros:** Branch can be merged before migration; migration can follow independently.
**Cons:** Significantly more complex. Two code paths. Fallback logic hides schema bugs.
The try/catch on individual SQL statements can mask real errors. Harder to test.
Produces a permanent false sense that the old behaviour is still valid.

### Recommendation: Option A — migration-first

**Do not merge D-42 Worker code before migration 0007 is applied to production.**
The migration is a prerequisite, not a follow-up. The two must land in the same
deployment window: migrate first, then deploy the Worker. The branch can be prepared
and reviewed before the migration runs, but the final merge/deploy must happen after
the PRAGMA confirm.

This is the same discipline used for migrations 0004 and 0005: the Worker code that
depends on the column should not be in production until the column exists.

---

## 3. Current state of each function to change

### 3.1 `insertEvidence` (worker.js line 92) — **MUST CHANGE**

**Current:**
```js
async function insertEvidence(env, claimId, userId, stance, body, title, quality, sourceUrl) {
  const now = Date.now();
  const evidenceId = makeId('evd');
  await env.DB.prepare(
    `INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(evidenceId, claimId, userId, stance, quality, title, body, sourceUrl, now).run();
  return { id:evidenceId, claim_id:claimId, stance, quality, title, body, source_url:sourceUrl, created_at:now };
}
```

**Problem:** No `review_state` column in INSERT. After migration, new evidence defaults
to `'public'` (column default) rather than `'review'`. The column default is intentionally
`'public'` for migration safety (existing rows stay visible), but *new* evidence must be
`'review'`.

**Required change:**
```js
async function insertEvidence(env, claimId, userId, stance, body, title, quality, sourceUrl) {
  const now = Date.now();
  const evidenceId = makeId('evd');
  await env.DB.prepare(
    `INSERT INTO evidence
       (id,claim_id,user_id,stance,quality,title,body,source_url,created_at,review_state)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(evidenceId, claimId, userId, stance, quality, title, body, sourceUrl, now, 'review').run();
  return { id:evidenceId, claim_id:claimId, stance, quality, title, body,
           source_url:sourceUrl, created_at:now, review_state:'review' };
}
```

The returned object must include `review_state:'review'` so callers (`addEvidence`) can
surface it in the response.

**Callers of `insertEvidence`:**
- `addEvidence` (line 82) — user-submitted evidence, always should be `'review'`. ✅
- `createClaim` (line 81, `body.initialEvidence` path) — see section 3.2 below.

---

### 3.2 `createClaim` — `initialEvidence` path (worker.js line 81) — **DECISION REQUIRED**

**Current:** When `body.initialEvidence` is provided on claim submission:
```js
if (body.initialEvidence) {
  await insertEvidence(env, claimId, userId, 'support',
    cleanText(body.initialEvidence, 900), 'Initial evidence', 'testimony', '');
  await recalcClaimScore(env, claimId);
}
```

After D-42, `insertEvidence` will pass `review_state='review'` for this evidence.
But the parent claim itself is also in `review_state='review'`. The claim is not
publicly visible, so whether the initial evidence is `'review'` or `'public'` does
not affect public visibility (the parent claim filter in D-38 already blocks it).

**Options:**

| Option | Behaviour | Recommendation |
|--------|-----------|----------------|
| Keep as-is (use `insertEvidence` unchanged) | Initial evidence → `'review'`. Consistent. Admin must approve evidence before it appears in Study even after claim is approved. | ✅ Recommended |
| Explicitly pass `'public'` for initialEvidence | Initial evidence → `'public'` immediately. Evidence appears in Study as soon as claim is approved (no separate evidence review step). | Only if admin workflow proves too burdensome |

**Decision: use `insertEvidence` as-is.** Initial evidence enters `review` like all
other evidence. When an admin approves the parent claim via `reviewDecision`, they
will also need to approve the evidence separately. This is the conservative Phase 2
behaviour. If the two-step approval proves burdensome in practice, D-44+ can add a
"approve claim and all pending evidence" action.

**Risk acknowledged:** An admin who approves a claim but forgets to approve its initial
evidence will see an approved public claim with no visible evidence in the Study view.
The Study view will appear empty for evidence even though the claim is approved. This
is a usability issue, not a security issue. Document in D-43 frontend review UI.

---

### 3.3 `addEvidence` (worker.js line 82) — **MINOR RESPONSE CHANGE**

**Current:**
```js
const item = await insertEvidence(env, claimId, userId, ...);
await recalcClaimScore(env, claimId);
return json({ evidence: item, claim: await claimOnly(env, claimId) });
```

After D-42, `insertEvidence` returns `review_state:'review'` in `item`. The response
shape `{ evidence: item, claim: ... }` already carries this field through — no separate
change to `addEvidence` is needed. The frontend receives `evidence.review_state:'review'`
and can show a "pending review" note if it chooses (D-43 optional).

**No structural change to `addEvidence`.** ✅

---

### 3.4 `claimDetail` (worker.js line 94) — **MUST CHANGE (2 queries)**

**Current direct evidence query:**
```sql
SELECT id, created_at, title, body, quality, source_url, stance,
       'direct' AS link_type, NULL AS linked_stance, NULL AS link_note
FROM evidence WHERE claim_id=?
```

**Current reused evidence query:**
```sql
SELECT e.id, e.created_at, e.title, e.body, e.quality, e.source_url, e.stance,
       'reused' AS link_type, l.stance AS linked_stance, l.link_note
FROM evidence_claim_links l
JOIN evidence e ON e.id=l.evidence_id
WHERE l.claim_id=?
```

**Required change** — add evidence review_state filter to both:
```sql
-- Direct:
FROM evidence WHERE claim_id=? AND COALESCE(review_state,'public')='public'

-- Reused:
WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
```

**Impact:** Study view for public claims no longer shows evidence items in `review`,
`rejected`, or `archived` state. `COALESCE(...,'public')` treats NULL (pre-migration
legacy rows) as `'public'` — existing evidence is unaffected.

**`claimDetail` is also called by `createClaim` tail (D-38 decoupled path).** After
D-42, `createClaim`'s response will not include the initial evidence in the evidence
array even though it was just inserted (because it is now `'review'`). The response
returns `evidence: []`. This is correct and expected — the claim is in `review` and
so is its evidence.

---

### 3.5 `getClaim` HTTP handler (worker.js line 77) — **MUST CHANGE (2 inline queries)**

`getClaim` does not use `claimDetail` — it has its own inline evidence queries:

**Current direct evidence query (in getClaim):**
```sql
SELECT e.*, u.handle, 'direct' AS link_type
FROM evidence e LEFT JOIN users u ON u.id=e.user_id
WHERE e.claim_id=?
```

**Current reused evidence query (in getClaim):**
```sql
SELECT e.*, u.handle, l.stance AS linked_stance, l.link_note, 'reused' AS link_type
FROM evidence_claim_links l
JOIN evidence e ON e.id=l.evidence_id
LEFT JOIN users u ON u.id=e.user_id
WHERE l.claim_id=?
```

**Required change** — same filter as claimDetail:
```sql
-- Direct:
WHERE e.claim_id=? AND COALESCE(e.review_state,'public')='public'

-- Reused:
WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
```

**Note:** `getClaim` is already guarded (D-38) to return 404 for non-public claims, so
it is only called for `review_state='public'` claims. But evidence on a public claim
may itself be in `review` — those items must be excluded from the public Study view.

---

### 3.6 `listEvidenceVault` (evidence-vault.js) — **MUST CHANGE (1 WHERE clause)**

**Current (post D-38):**
```sql
WHERE COALESCE(c.review_state,'public')='public'
  AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
```

**Required change:**
```sql
WHERE COALESCE(c.review_state,'public')='public'
  AND COALESCE(e.review_state,'public')='public'
  AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
```

No shape change. Result set reduced to exclude evidence items in `review`, `rejected`,
or `archived` state.

---

### 3.7 `reportTarget` (worker.js line 85) — **MUST CHANGE (new branch)**

**Current:**
```js
if (targetType === 'claim') {
  await env.DB.prepare(
    `UPDATE claims SET report_count=report_count+1,
     review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END
     WHERE id=?`
  ).bind(targetId).run();
}
```
No `targetType === 'evidence'` branch.

**Required addition** — after the claim branch, before the final `return json({ ok:true })`:
```js
if (targetType === 'evidence') {
  await env.DB.prepare(
    `UPDATE evidence SET report_count=report_count+1,
     review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END
     WHERE id=?`
  ).bind(targetId).run();
}
```

Auto-escalation threshold: 2 reports → `'review'`. Same policy as claims. Evidence
already in `'review'` stays in `'review'` (CASE is a no-op on that branch).

**Risk:** The UPDATE silently no-ops if `targetId` does not exist (no NOT FOUND check).
Claims branch has the same behaviour — the report row is inserted regardless. This is
acceptable for Phase 2; a NOT FOUND guard can be added in a later batch if needed.

---

### 3.8 `reviewQueue` (worker.js line 91) — **MUST CHANGE (new evidence query)**

**Current:** fetches only claims and truths.

**Required addition** — a third query for evidence:
```sql
SELECT
  'evidence' AS target_type,
  e.id,
  e.claim_id,
  e.title,
  e.body,
  e.source_url,
  e.stance,
  e.quality,
  e.review_state,
  e.report_count,
  e.created_at,
  c.claim AS parent_claim,
  (SELECT r.reason FROM reports r
   WHERE r.target_type='evidence' AND r.target_id=e.id
   AND r.status='open' ORDER BY r.created_at DESC LIMIT 1) AS latest_report_reason
FROM evidence e
LEFT JOIN claims c ON c.id=e.claim_id
WHERE COALESCE(e.review_state,'public') NOT IN ('public','archived')
   OR e.report_count > 0
ORDER BY e.created_at DESC
LIMIT 100
```

The evidence rows are merged into the `review` array alongside claim and truth rows,
sorted by `created_at` (evidence has no `updated_at`).

**Response shape change:** the `review` array can now contain items with
`target_type='evidence'`. The frontend `reviewCard` must handle this (D-43).

**`archivedMeta`:** add `archived_evidence` count (optional, can defer to D-44):
```sql
SELECT COUNT(*) AS n FROM evidence WHERE review_state='archived'
```

**Sort consideration:** `reviewQueue` currently sorts by `updated_at`. Evidence has no
`updated_at` column (deferred from D-41). Sort evidence items by `created_at` when
merging. The sort key must handle `null` gracefully — `(b.updated_at || b.created_at || 0)`.

---

### 3.9 `reviewDecision` (worker.js line 87) — **MUST CHANGE (new branch)**

**Current:** handles `'claim'` and `'truth'`. Returns `BAD_REVIEW_TARGET` for anything
else.

**Required addition** — before the final `return json({ error:'BAD_REVIEW_TARGET' })`:
```js
if (targetType === 'evidence') {
  await env.DB.prepare(
    `UPDATE evidence SET review_state=?, report_count=0 WHERE id=?`
  ).bind(decision, targetId).run();
  await env.DB.prepare(
    `UPDATE reports SET status=?
     WHERE target_type='evidence' AND target_id=? AND status='open'`
  ).bind(decision === 'rejected' ? 'rejected' : 'closed', targetId).run().catch(() => null);
  const row = await env.DB.prepare(
    `SELECT e.*, c.claim AS parent_claim FROM evidence e
     LEFT JOIN claims c ON c.id=e.claim_id WHERE e.id=?`
  ).bind(targetId).first();
  if (!row) return json({ error: 'EVIDENCE_NOT_FOUND' }, 404);
  return json({ ok: true, targetType: 'evidence', decision, item: row });
}
```

Allowed decisions remain `'public'`, `'review'`, `'rejected'` — the existing
`allowed` Set is already correct. No change to the allowed-decision gate.

**Response shape:** returns raw evidence row + `parent_claim`. No `mapEvidence` helper
exists yet — the frontend receives snake_case fields directly from D1 for this response.
If a `mapEvidence` helper is needed (D-43), add it then; do not add it speculatively.

**`BAD_REVIEW_TARGET` allowed list update:** the error response currently says
`allowed:['claim','truth']`. After D-42 it must say `allowed:['claim','truth','evidence']`.

---

## 4. Functions that do NOT change in D-42

| Function | Reason |
|----------|--------|
| `claimOnly` | Internal helper; no evidence queries |
| `createAipPacket` | Calls `claimDetail` — already gets filtered evidence after D-42 |
| `addPressure` | No evidence involvement |
| `addHomeTest` | No evidence involvement |
| `attachEvidenceToClaim` (`evidence-reuse.js`) | Links existing evidence; the evidence item's own `review_state` travels with it; `claimDetail` will filter it correctly after D-42 |
| `reviewCleanup` | Deferred for evidence (see D-40 section 6.7) |
| `markDuplicate` / `resolveSimilar` | Claim-only |
| `reviewQueue` audit metadata (`archivedMeta`) | Add `archived_evidence` count later |

---

## 5. Risk points

### 5.1 Initial evidence on claim submission appearing empty in Study

**Scenario:** User submits a claim with `initialEvidence`. Both the claim and the
evidence enter `review`. Admin approves the claim (sets `review_state='public'`). Admin
does not notice or approve the evidence. The public Study view for the claim shows an
empty evidence list even though evidence exists.

**Mitigation:** Document in D-43 review UI that approving a claim with pending evidence
requires a second step. Add a visual indicator in the inspect panel: "N evidence items
pending review for this claim."

**No automatic co-approval** — approving a claim must not silently approve its evidence.
Each item must be individually reviewed.

---

### 5.2 Existing evidence suddenly hidden after migrate+deploy

**Scenario:** Migration 0007 applies `DEFAULT 'public'` to all existing evidence. Then
D-42 Worker deploys with `COALESCE(e.review_state,'public')='public'` filters. Existing
evidence rows have `review_state='public'` (from the column default). They should still
appear in Vault and Study.

**Risk:** If the column default is somehow not applied (e.g. migration fails midway and
the column is left as nullable with no default), existing rows may have `NULL`. The
`COALESCE(...,'public')` filter treats NULL as `'public'` — those rows would still
appear. This is the correct safety net.

**Required PRAGMA verify:** after migration, spot-check a handful of existing evidence
rows to confirm `review_state='public'` is populated, not NULL.

---

### 5.3 Review queue mixed target_type shape

**Scenario:** The `review` array now contains objects with `target_type='evidence'`,
`target_type='claim'`, and `target_type='truth'`. The frontend `reviewCard` function
receives these mixed.

**Current `reviewCard` assumption:** it reads `item.claim`, `item.review_state`,
`item.report_count`, `item.near_duplicate_of`. Evidence rows have none of these field
names — they have `item.title`, `item.body`, `item.stance`, `item.parent_claim`.

**D-43 must handle this:** `reviewCard` needs a `target_type` guard before accessing
claim-specific fields. Merging D-42 before D-43 means the Review queue may show broken
or empty cards for evidence items. This is acceptable if the admin queue is not actively
used between D-42 and D-43 landing. Document as a known transient state.

**Stop condition:** if evidence items appear in the Review queue before D-43 is merged
and the admin is actively using the queue, hold D-42 merge until D-43 is ready to land
in the same deployment.

---

### 5.4 `worker-route-static-check.mjs` — HIGH_RISK_ROUTES

The static check currently defines these high-risk routes (lines 143–157):
```js
const HIGH_RISK_ROUTES = [
  '/api/claims',
  '/api/claim-vote',
  '/api/evidence',
  '/api/evidence-attach',
  '/api/truths',
  '/api/truth-to-claim',
  '/api/belief-snapshots',
  '/api/belief-promote',
  '/api/review',
  '/api/review/decision',
  '/api/review/mark-duplicate',
  '/api/review/resolve-similar',
  '/api/ai/analyse',
];
```

D-42 does not add any new routes — all changes are to existing handler functions.
No new `/api/...` strings are introduced. The worker-route-static-check will continue
to pass at 39 checks without modification.

However: if D-43 frontend changes cause any route string change in `app-v10.js`
or `worker.js`, the check must be re-run. Note this for D-43.

---

### 5.5 `recalcClaimScore` side effect after evidence enters review

**Current:** `addEvidence` calls `recalcClaimScore(env, claimId)` after inserting.
After D-42, evidence inserts with `review_state='review'`. `recalcClaimScore` queries
evidence to compute a score. If `recalcClaimScore` also filters by `review_state`, the
score will not reflect the new pending evidence. If it does not filter, the score will
include evidence that is not publicly visible.

**Current `recalcClaimScore` behaviour:** must be checked in `src/claim-scoring.js`
before D-42B. If it counts all evidence regardless of state, pending evidence inflates
the score before admin approval. This is a score accuracy issue, not a security issue.

**D-42 decision:** leave `recalcClaimScore` unchanged in Phase 2. Score recalculation
uses all evidence regardless of state. The score field is advisory (not a trust gate).
Document as a known Phase 2 limitation. D-44+ can add a `review_state='public'` filter
to score recalculation if needed.

---

## 6. Static checks to add in D-42

Add section 23 to `scripts/hardening-smoke-test.mjs`. Five new checks (103 → 108):

| Check label | What it asserts |
|-------------|----------------|
| `insertEvidence passes review_state='review' for new evidence` | String `'review'` appears in `insertEvidence` INSERT bind list in `src/worker.js` |
| `listEvidenceVault filters COALESCE(e.review_state,'public')='public'` | This exact string appears in `src/evidence-vault.js` |
| `claimDetail direct evidence query filters by evidence review_state` | `COALESCE(review_state,'public')='public'` appears in `claimDetail`'s direct evidence SQL in `src/worker.js` |
| `reviewDecision handles targetType evidence` | `targetType === 'evidence'` branch appears in `reviewDecision` in `src/worker.js` |
| `reviewQueue includes evidence items in non-public state` | `target_type` AS `'evidence'` SELECT appears in `reviewQueue` in `src/worker.js` |

These are static string-presence checks only. No network, no D1.

Self-reference in `hardening-smoke-test.mjs` line 672 must be updated from
`'103 passed, 0 failed'` to `'108 passed, 0 failed'` and `docs/README.md`
Known-good table updated to match.

---

## 7. Required PR and deployment sequence

### D-42A — Migration apply (manual, not a commit)

**When:** user explicitly approves migration 0007 apply in a future session.
**What:** run `PRAGMA table_info(evidence)` → confirm absent → execute
`migrations/0007_add_evidence_review_state.sql` via Cloudflare D1 console or
Wrangler (with approval) → re-run PRAGMA to verify → note the apply date.

This is not a git commit. The migration file already exists at
`migrations/0007_add_evidence_review_state.sql`. Update the "APPLIED IN PRODUCTION"
header in that file after apply.

### D-42B — Backend Worker branch + PR

**Branch:** `feature/d42-evidence-moderation-backend`
**When:** after D-42A (migration confirmed applied and verified).
**Files changed:** `src/worker.js`, `src/evidence-vault.js`
**Scope:** sections 3.1–3.9 above.
**Static checks added:** section 23 (5 checks, 103 → 108).
**Docs updated:** `docs/API_ENDPOINT_INVENTORY.md`, `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`,
`docs/PROJECT_STATE.md`.

### D-43 — Frontend Review UI

**Branch or direct main** depending on scope.
**When:** after D-42B is merged.
**Scope:** `reviewCard` + `renderReviewInspectPanel` handle `target_type='evidence'`.
Static checks added: section 24 (2 checks, 108 → 110).

### D-44 — Validation record

**Docs-only, direct main.**
**When:** after D-42B and D-43 are merged, live validation confirmed.
**Scope:** record static/live/manual results; update PROJECT_STATE.md.

---

## 8. Stop conditions for D-42B

Do not open or merge the D-42B PR if any of the following are true:

- Migration 0007 has not been confirmed applied via `PRAGMA table_info(evidence)`.
- `evidence.review_state` or `evidence.report_count` do not appear in PRAGMA output.
- Any of the 103 existing hardening smoke checks fails before starting.
- D-43 frontend Review UI is not ready to land in the same or immediate next deployment,
  and the admin is actively using the Review queue (evidence cards would appear broken).
- A live read smoke run against production fails after migration apply (evidence-vault
  endpoint must still return 200 with an `evidence` array).

---

## 9. D-42 preflight record

| Item | Status |
|------|--------|
| D-42 preflight doc created | ✅ Done (this document) |
| Migration 0007 applied to production | ❌ Not yet |
| `feature/d42-evidence-moderation-backend` branch created | ❌ Not yet |
| Backend Worker changes implemented | ❌ Not yet |
| Section 23 static checks added (103→108) | ❌ Not yet |
| D-43 frontend Review UI | ❌ Not yet |
| D-44 validation record | ❌ Not yet |
