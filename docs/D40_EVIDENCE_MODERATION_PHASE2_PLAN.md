# D-40: Evidence Moderation Phase 2 — Plan

Date: 2026-06-06
Status: Docs-only planning. No code changes, no schema changes, no migrations, no D1 commands, no Wrangler, no live tests.

---

## Summary

D-38 closed the three claim-level visibility gaps identified in D-37. Evidence is now
excluded from the Vault when its parent claim is non-public. However, evidence items
themselves have no independent `review_state` or `report_count` — every item submitted
to a public claim is immediately publicly visible. This document plans the schema change,
backend changes, frontend changes, implementation sequence, and out-of-scope boundaries
for evidence-level moderation.

**Nothing in this document is implemented yet. This is a planning document only.**

---

## 1. Current state after D-38

### What exists

| Column | Table | Description |
|--------|-------|-------------|
| `review_state` | `claims` | `TEXT DEFAULT 'review'`. States: `public`, `review`, `rejected`, `archived`, `duplicate`. |
| `review_state` | `truths` | Same pattern as claims. |
| `report_count` | `claims` | `INTEGER DEFAULT 0`. Auto-incremented by `/api/report`. |
| — | `evidence` | **No `review_state`. No `report_count`.** |

### What the Vault does today (post D-38)

`GET /api/evidence-vault` filters evidence to claims where
`COALESCE(c.review_state,'public')='public'`. Evidence on non-public parent claims is
excluded. This is the only existing evidence moderation — inherited from the parent claim.

### Remaining gap

Evidence submitted to a public claim is immediately publicly visible to anyone browsing
the Vault or the Study view. There is no way to moderate individual evidence items.
A spam link, a propaganda injection, or a low-quality unsourced testimony attached to an
approved claim has no removal path short of rejecting the entire parent claim (which may
be legitimate).

---

## 2. Why D-38 was only Phase 1

D-38 was deliberately no-migration. The three gaps it closed were all readable at the
application layer — they required no schema changes. Evidence-level moderation requires
new columns on the `evidence` table, which requires a migration. A migration requires:

- Explicit per-session user approval before applying to production.
- `PRAGMA table_info(evidence)` confirmation that the columns are absent.
- A tested backfill strategy so existing evidence is not silently suppressed.
- Worker changes (branch + PR) that are decoupled from the migration.
- Frontend review UI changes.

That scope belongs in a separate, planned D-41 → D-44 sequence, not in D-38.

---

## 3. Evidence moderation goals

**Minimum viable evidence moderation:**

1. New evidence submitted to a public claim is held in `review_state='review'` rather than
   being immediately public.
2. An admin can approve (→ `public`), reject (→ `rejected`), or dismiss (→ `archived`)
   individual evidence items from the Review queue.
3. Evidence in `review`, `rejected`, or `archived` state is not visible to public users
   in the Vault or in the Study view.
4. Existing public evidence is not disrupted — no retrospective review wave on current
   live items.
5. Users can report individual evidence items via `/api/report` (already supports
   `target_type` as a free text field — just needs a new branch in the Worker).

**Out of scope for Phase 2 (explicitly deferred):**

- Hard delete of evidence rows.
- Automatic moderation by AI verdict or report-count threshold.
- Bulk evidence cleanup.
- Automatic suppression of evidence on claim rejection (current behaviour: evidence
  disappears from public view because the parent claim filter in D-38 hides it — no
  change needed here, but individual evidence state should not be cascaded automatically).
- Evidence vote moderation (evidence_votes table exists but votes are not shown publicly
  in a way that requires moderation today).
- Evidence deduplication at the schema level.

---

## 4. Proposed schema

### New columns on `evidence`

```sql
ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE evidence ADD COLUMN report_count INTEGER DEFAULT 0;
```

**Why `DEFAULT 'public'` for the column:**
SQLite `ALTER TABLE ... ADD COLUMN` fills all existing rows with the column's default
value. `DEFAULT 'public'` means every current evidence row becomes `review_state='public'`
— no existing evidence is suppressed. New evidence inserts must explicitly pass `'review'`
to enter the moderation queue (see section 5 — Worker changes).

**`DEFAULT 'review'` is NOT recommended** because it would immediately hide all existing
evidence from the public Vault and Study views when the migration applies. This would
break the live site for every public claim that currently has evidence.

### Optional: `updated_at` on evidence

The `evidence` table currently has no `updated_at` column. Review queue ordering and
admin audit would benefit from it, but it is not required for moderation correctness.
Defer to a separate migration unless the review queue needs it.

### New index

```sql
CREATE INDEX IF NOT EXISTS idx_evidence_review_state ON evidence (review_state);
```

Needed for the review queue query filtering evidence by state. Without it, the queue
scan is a full evidence table scan.

### Migration proposal summary

```sql
-- Migration 0007: add review_state and report_count to evidence table
ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE evidence ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_evidence_review_state ON evidence (review_state);
```

Migration number: **0007** (0006 is `near_duplicate_of` on claims — safe for fresh
rebuilds only; 0007 follows in sequence).

**Production apply is FORBIDDEN without explicit per-session user approval.** Always
run `PRAGMA table_info(evidence)` first to confirm `review_state` is absent.

---

## 5. Backfill strategy decision

Three options:

| Option | Default for existing rows | Impact on live site |
|--------|--------------------------|---------------------|
| **A — Column DEFAULT 'public'** | All existing evidence → `'public'` | No disruption. Recommended. |
| B — Column DEFAULT 'review' | All existing evidence → `'review'` | All existing evidence hidden until admin reviews each item. **Do not use.** |
| C — Backfill script mirrors parent claim | Evidence on public claims → `'public'`; evidence on non-public claims → `'review'` | Safer semantically, but requires a separate D1 UPDATE pass after migration and introduces timing risk. |

**Recommendation: Option A.** Use `DEFAULT 'public'` for the column. No backfill script
needed. No disruption to existing evidence. Moderation queue starts clean (empty) and
fills only with new submissions after the Worker change is deployed.

Option C is appealing but introduces a second migration step with failure modes. The
D-38 parent-claim filter already prevents evidence on non-public claims from being
publicly visible, so the added value of Option C is minimal.

---

## 6. Backend route changes

### 6.1 `addEvidence` (`src/worker.js`)

**Current:**
```js
await env.DB.prepare(`INSERT INTO evidence (...) VALUES (...)`).bind(...).run();
```
No `review_state` column — evidence is publicly visible immediately.

**Change:** Pass `review_state='review'` explicitly in the INSERT:
```js
`INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at,review_state)
 VALUES (?,?,?,?,?,?,?,?,?,?)`
.bind(evidenceId, claimId, userId, stance, quality, title, body, sourceUrl, now, 'review')
```

**Also update `insertEvidence` helper** — `addEvidence` delegates to `insertEvidence`
which constructs the SQL. The helper must be updated to include `review_state` in the
INSERT.

**Response shape:** `addEvidence` returns `{ evidence: item, claim: ... }`. The `item`
returned from `insertEvidence` should include `reviewState: 'review'` so the frontend
knows the evidence is pending moderation, not yet public.

**Risk:** Low. New column, new INSERT field. No existing callers break.

---

### 6.2 `listEvidenceVault` (`src/evidence-vault.js`)

**Current (post D-38):**
```sql
WHERE COALESCE(c.review_state,'public')='public'
  AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
```

**Change:** Add evidence-level filter:
```sql
WHERE COALESCE(c.review_state,'public')='public'
  AND COALESCE(e.review_state,'public')='public'
  AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
```

**Risk:** Low. Result set reduced; no shape change.

---

### 6.3 `claimDetail` (`src/worker.js`)

**Current:**
```js
const directEvidence = await env.DB.prepare(
  `SELECT id, created_at, title, body, quality, source_url, stance, 'direct' AS link_type, NULL AS linked_stance, NULL AS link_note
   FROM evidence WHERE claim_id=?`
).bind(claimId).all();
const reusedEvidence = await env.DB.prepare(
  `SELECT e.id, ... FROM evidence_claim_links l JOIN evidence e ON e.id=l.evidence_id WHERE l.claim_id=?`
).bind(claimId).all();
```

No `review_state` filter on either query.

**Change:** Add `COALESCE(e.review_state,'public')='public'` to both queries:

```sql
-- Direct evidence
SELECT ... FROM evidence WHERE claim_id=?
  AND COALESCE(review_state,'public')='public'

-- Reused evidence
SELECT e.id, ... FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=?
  AND COALESCE(e.review_state,'public')='public'
```

**Impact:** Study view for public claims no longer shows evidence items in `review`,
`rejected`, or `archived` state. This is the correct behaviour — a user should not see
evidence that is pending admin review.

**Note on `getClaim`:** `getClaim` (the HTTP handler) fetches evidence independently
(not via `claimDetail`) using its own inline queries. Both sets of queries need the
same filter:
```sql
-- Direct evidence in getClaim
SELECT e.*, u.handle, 'direct' AS link_type FROM evidence e LEFT JOIN users u ...
  WHERE e.claim_id=?
  AND COALESCE(e.review_state,'public')='public'

-- Reused evidence in getClaim
SELECT e.*, ... FROM evidence_claim_links l JOIN evidence e ON e.id=l.evidence_id
  LEFT JOIN users u ...
  WHERE l.claim_id=?
  AND COALESCE(e.review_state,'public')='public'
```

**Risk:** Medium. Test that existing Study views still show evidence correctly for
claims with fully-public evidence. An evidence row with NULL `review_state` (legacy
pre-migration) must be treated as `'public'` via `COALESCE`.

---

### 6.4 `reportTarget` (`src/worker.js`)

**Current:** handles `targetType='claim'` with auto-escalation at 2 reports. Truths are
inserted into `reports` table but no `report_count` update exists for truths.

**Change:** Add `targetType='evidence'` branch:
```js
if (targetType === 'evidence') {
  await env.DB.prepare(
    `UPDATE evidence SET report_count=report_count+1,
     review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END
     WHERE id=?`
  ).bind(targetId).run();
}
```

Auto-escalation threshold: 2 reports → `review_state='review'`. Same policy as claims.
This means evidence already in `'review'` state stays in review (no-op on state), and
public evidence flips to review at 2 reports.

**Risk:** Low. New branch, no existing paths affected.

---

### 6.5 `reviewQueue` (`src/worker.js`)

**Current:** Returns `claims` and `truths` only.

**Change:** Add an `evidence` query:
```sql
SELECT 'evidence' AS target_type, e.*,
  (SELECT r.reason FROM reports r
   WHERE r.target_type='evidence' AND r.target_id=e.id
   AND r.status='open' ORDER BY r.created_at DESC LIMIT 1) AS latest_report_reason
FROM evidence e
WHERE COALESCE(e.review_state,'public') NOT IN ('public','archived')
   OR e.report_count > 0
ORDER BY e.created_at DESC
LIMIT 100
```

Return in the combined `review` array alongside claims and truths.

**Admin queue impact:** Evidence items with `review_state='review'` or `report_count > 0`
appear in the Review queue. Admin can inspect, approve, reject, or archive each item.

**Risk:** Medium. Queue size grows. Frontend review UI must handle `target_type='evidence'`
cards (see section 7).

---

### 6.6 `reviewDecision` (`src/worker.js`)

**Current:** handles `targetType='claim'` and `targetType='truth'`.

**Change:** Add `targetType='evidence'` branch:
```js
if (targetType === 'evidence') {
  await env.DB.prepare(
    `UPDATE evidence SET review_state=?, report_count=0 WHERE id=?`
  ).bind(decision, targetId).run();
  await env.DB.prepare(
    `UPDATE reports SET status=? WHERE target_type='evidence' AND target_id=? AND status='open'`
  ).bind(decision === 'rejected' ? 'rejected' : 'closed', targetId).run().catch(() => null);
  const row = await env.DB.prepare(`SELECT * FROM evidence WHERE id=?`).bind(targetId).first();
  if (!row) return json({ error: 'EVIDENCE_NOT_FOUND' }, 404);
  return json({ ok: true, targetType: 'evidence', decision, item: row });
}
```

Allowed decisions: `public`, `review`, `rejected`. Not `archived` in first version —
see note on `reviewCleanup` below.

**Risk:** Medium. New branch. Response shape is the raw `evidence` row (no `mapClaim`
equivalent exists for evidence yet — caller receives raw row).

---

### 6.7 `reviewCleanup` for evidence — **Deferred**

`reviewCleanup` currently handles rejected smoke/test artefacts on claims and truths.
Extending it to evidence adds complexity without immediate operational need. Defer to
a future batch. Evidence can be rejected and left in `rejected` state; the review queue
query excludes `archived` items, so they would still appear until a cleanup is implemented.

**Alternatively:** update the `reviewQueue` filter to exclude `rejected` evidence after
a configurable age. Defer this decision to D-44.

---

### 6.8 `attachEvidenceToClaim` (`src/evidence-reuse.js`)

The reuse flow links existing evidence to a second claim via `evidence_claim_links`. The
evidence item itself is not re-submitted — only a link is created. The evidence's own
`review_state` should travel with it.

**No change needed to the link row** — the link row has no `review_state`. When
`claimDetail` fetches reused evidence (after D-41 changes), the JOIN on `evidence`
will apply the `COALESCE(e.review_state,'public')='public'` filter. If the evidence
itself is in `review`, it won't appear in the linked claim's Study either.

**Risk:** None. Existing behaviour is correct once the evidence-level filter is added
to `claimDetail`.

---

## 7. Frontend changes

### 7.1 Review UI — evidence cards

The Review queue already renders `reviewCard(item)` for claims and truths. After the
backend change, items with `target_type='evidence'` will appear in the queue.

**Required changes to `public/app-v10.js`:**

- `reviewCard(item)` must handle `item.target_type === 'evidence'`: render evidence
  title, body snippet, parent claim link, source_url, stance badge, quality badge,
  and report count. Use a distinct left border colour (e.g. amber-orange) to
  distinguish evidence cards from claim cards (blue) and truth cards (green).
- `renderReviewInspectPanel(item)` must handle `target_type='evidence'`: show full
  evidence detail (title, body, source_url, stance, quality, reliability_score,
  parent claim link with Study shortcut).
- Approve/Reject/Keep actions must call `POST /api/review/decision` with
  `targetType:'evidence'`. The allowed set for evidence is `public`, `review`,
  `rejected` — not `duplicate` or `archived` (in Phase 2).
- `applyReviewFilter` and the filter chip bar do not need new chips in Phase 2
  (evidence items appear in the existing `all`/`pending`/`rejected` filters by state).

**Scope:** Frontend changes that touch Review UI are relatively contained. The review
card and inspect panel are the main areas. These should be a single frontend commit,
direct main (no backend touch), after the backend branch + PR is merged.

### 7.2 Evidence Vault badges — **Deferred**

When a user submits evidence and it enters `review_state='review'`, their submitted
evidence won't appear in the public Vault immediately. The submission response includes
`reviewState:'review'`. The frontend could show a "Pending review" badge in the evidence
response area of the Study view. This is a UX nicety — not a correctness fix. Defer to
D-43 or later.

### 7.3 Study view — in-review evidence notice — **Deferred**

A user who submitted evidence and then views the Study may notice their item is absent.
A "Your submitted evidence is pending review" advisory message could help. Defer.

---

## 8. Abuse and risk model

| Risk | Current state | Phase 2 mitigation |
|------|--------------|-------------------|
| Spam links in evidence | Publicly visible immediately | Evidence enters `review` — admin approves before it is public |
| Propaganda framing attached to legitimate claim | Publicly visible immediately | Same — held in review |
| Evidence submitted to a hidden (review-state) parent claim | Inherited: excluded from Vault by D-38 parent filter | After Phase 2: evidence itself is also in `review`, doubly hidden |
| Bulk evidence spam (same user, many items) | Rate-limited at 20/hr per IP, but all are public | Items queue for review; admin can reject in batch via filter |
| Low-quality testimony (unsourced) | Visible, reliability_score=20 | Review queue gives admin a rejection path |
| Report bombing evidence | No existing path | Phase 2: `/api/report` with `targetType='evidence'`; threshold at 2 escalates to review |
| Source URL empty | Allowed today | No change — quality and stance are self-reported; admin judges in review |

**What Phase 2 does NOT prevent:** a user with a fresh pseudonymous ID who submits
one spam evidence per IP per hour can accumulate up to 20 items per hour per IP before
rate limiting fires. Each item lands in review, not publicly visible, so the attack
requires admin attention but does not pollute the public surface. This is acceptable
for Phase 2.

---

## 9. Evidence states

Evidence in Phase 2 uses four states (not five — no `duplicate`):

| State | Meaning | Publicly visible? | In Review queue? |
|-------|---------|------------------|-----------------|
| `public` | Approved and visible | ✅ Yes | Only if `report_count > 0` |
| `review` | Submitted, pending admin review | ❌ No | ✅ Yes |
| `rejected` | Admin rejected | ❌ No | ✅ Yes (until cleanup) |
| `archived` | Admin archived (smoke/test artefact) | ❌ No | ❌ No |

`duplicate` state is **not proposed for evidence** in Phase 2. Evidence deduplication
is a different problem (evidence_votes already tracks votes; duplicate_signature exists
on evidence but is unused in the current Worker). Defer.

**Default for new evidence:** `'review'` (set explicitly by the Worker INSERT — the
column default is `'public'` for migration safety, but the Worker always passes `'review'`
for new inserts).

**COALESCE behaviour:** `COALESCE(e.review_state,'public')` treats legacy rows with
`NULL` as `'public'`. After migration, all existing rows have `'public'` via the column
default, so `COALESCE` is a safety net for any rows created before the migration runs.

---

## 10. What must stay unchanged

- `claimOnly` — internal helper, no filter. Unchanged.
- `claimDetail` — internal helper; evidence filter added to its queries, but `claimDetail`
  itself is not guarded (it is used by `createClaim`, `addEvidence`, admin paths).
- Admin review routes — remain `requireAdmin`-gated. No changes to the gate.
- `insertEvidence` helper — **must be updated** to pass `review_state='review'`.
- Response shape of `addEvidence` — must include `reviewState` field in returned evidence.
- `evidence_votes` table — untouched. Vote moderation is out of scope.
- `duplicate_signature` column on evidence — untouched.

---

## 11. Implementation sequence

### D-41 — Migration proposal (docs-only, direct main)

Create `migrations/0007_evidence_review_state.sql`:
```sql
ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE evidence ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_evidence_review_state ON evidence (review_state);
```

Update `migrations/0003_full_schema.sql` to include the new columns (so fresh D1
rebuilds include them). Update `docs/API_ENDPOINT_INVENTORY.md` evidence-vault row.
**Do not apply to production.** Production apply requires explicit per-session approval
and `PRAGMA table_info(evidence)` confirmation.

### D-42 — Backend Worker changes (branch + PR)

**Prerequisite:** D-41 migration proposal reviewed and migration confirmed absent from
production via `PRAGMA table_info(evidence)`.

**Scope:** `src/worker.js` and `src/evidence-vault.js` only.

Changes:
- `insertEvidence`: add `review_state='review'` to INSERT
- `listEvidenceVault`: add `COALESCE(e.review_state,'public')='public'` filter
- `claimDetail`: add evidence review_state filter to both direct and reused queries
- `getClaim` (HTTP handler): add evidence review_state filter to inline evidence queries
- `reportTarget`: add `targetType='evidence'` branch
- `reviewQueue`: add evidence query
- `reviewDecision`: add `targetType='evidence'` branch

**Static checks to add (hardening-smoke-test.mjs, section 23):**
- `insertEvidence passes review_state='review' for new evidence`
- `listEvidenceVault filters COALESCE(e.review_state,'public')='public'`
- `claimDetail direct evidence query filters by evidence review_state`
- `reviewDecision handles targetType evidence`
- `reviewQueue includes evidence items in non-public state`

Expected new count: 103 → 108 (5 new checks).

**Branch name:** `feature/d42-evidence-moderation-backend`

### D-43 — Frontend Review UI changes (branch or direct main)

**Prerequisite:** D-42 merged and confirmed working.

**Scope:** `public/app-v10.js` only.

Changes:
- `reviewCard` handles `target_type='evidence'`
- `renderReviewInspectPanel` handles `target_type='evidence'`
- Approve/Reject/Keep calls `reviewDecision` with `targetType:'evidence'`

Frontend-only changes: assess at the time whether branch or direct main is appropriate
(frontend-only → direct main is permitted by current policy; however, since this
touches moderation UI, a PR for review is recommended).

**Static checks to add (section 24):**
- `reviewCard handles target_type evidence`
- `renderReviewInspectPanel handles evidence inspect`

Expected count after D-43: 108 → 110.

### D-44 — Result record and manual validation (docs-only, direct main)

After D-42 and D-43 are merged and the live site is validated:
- Record static check baseline (110/24/39 or whatever the final count is)
- Record manual Review UI test (submit evidence → appears in queue → approve → visible
  in Vault and Study)
- Record read smoke result
- Update `docs/PROJECT_STATE.md`

---

## 12. Required tests and checks

### Static checks (hardening-smoke-test.mjs)

Added in D-42 (section 23, 5 checks: 103 → 108):

| Check | What it asserts |
|-------|----------------|
| `insertEvidence passes review_state review` | `'review'` appears in `insertEvidence` INSERT statement |
| `listEvidenceVault filters evidence review_state` | `COALESCE(e.review_state,'public')='public'` in evidence-vault.js |
| `claimDetail direct evidence filters review_state` | Evidence review_state filter in claimDetail direct query |
| `reviewDecision handles evidence targetType` | `targetType==='evidence'` branch in reviewDecision |
| `reviewQueue includes evidence in non-public state` | Evidence query in reviewQueue |

Added in D-43 (section 24, 2 checks: 108 → 110):

| Check | What it asserts |
|-------|----------------|
| `reviewCard handles evidence target_type` | `target_type==='evidence'` in reviewCard |
| `renderReviewInspectPanel handles evidence` | Evidence inspect panel branch |

**Do not update the hardening smoke count until the code changes are committed.**

### Read smoke (GitHub Actions)

After D-42 merges: trigger `HumanX Read Smoke` workflow on `main`. Confirm
`GET /api/evidence-vault` still returns 200 and an `evidence` array. Existing public
evidence should still appear (because column default is `'public'` and existing rows
got `'public'` from the migration).

### Manual validation (live, after D-42 + D-43 merged)

1. Submit evidence on a public claim → confirm it does **not** appear immediately in the
   Vault or the Study evidence list.
2. Open Review queue as admin → confirm the evidence item appears.
3. Approve the evidence → confirm it appears in the Vault and Study.
4. Submit a second evidence item → report it twice → confirm it auto-escalates to `review`.
5. Reject evidence → confirm it disappears from public view.
6. Confirm existing pre-migration evidence on public claims is still visible (no
   disruption from migration).

**No live write smoke without explicit per-session approval.**
**No D1 migration without explicit per-session approval.**

---

## 13. Out of scope — full list

| Item | Reason |
|------|--------|
| Hard delete of evidence rows | Non-destructive first principle (REVIEW_CLEANUP_POLICY.md). No backup mechanism. |
| Automatic AI verdict moderation | Not part of HumanX's no-public-inference design. |
| Automatic suppression on report count | Auto-escalation to `review` at threshold is acceptable; auto-rejection without admin review is not. |
| Bulk evidence cleanup | Phase 3 of REVIEW_CLEANUP_POLICY.md. Not before single-item cleanup is proven. |
| Evidence deduplication | `duplicate_signature` exists but is unused. Separate project. |
| Evidence votes moderation | `evidence_votes` table exists; vote display is not currently part of any public view. |
| Blocking evidence writes to non-public parent claims | `addEvidence` accepts any `claimId`. Blocking this is a separate policy decision. |
| `updated_at` on evidence | Useful but not required for Phase 2 moderation correctness. |
| Evidence `duplicate` state | Not needed in Phase 2; evidence dedup is deferred. |
| `reviewCleanup` for evidence | Defer — rejected evidence can sit in `rejected` state without admin queue exposure (queue filters by non-public OR report_count > 0). |
| Phase 2 migration applied without approval | Always requires explicit per-session user approval + PRAGMA check. |

---

## 14. Recommendation

Implement Phase 2 conservatively:

1. **Existing evidence stays public.** Column default `'public'` means no disruption
   to live content. Admins start with a clean, empty moderation queue for evidence.

2. **New evidence enters review.** Worker INSERT passes `'review'` explicitly. Admins
   approve good submissions; bad submissions can be rejected without ever becoming public.

3. **No automatic rejection.** Report-bombing can escalate to `review` but cannot
   auto-reject. An admin always makes the final call.

4. **No hard delete.** `archived` and `rejected` states are the cleanup mechanism.
   Hard delete is blocked until a backup strategy exists.

5. **Sequential implementation.** D-41 (migration doc) → D-42 (backend PR) →
   D-43 (frontend PR) → D-44 (validation record). Do not merge D-43 before D-42.
   Do not apply the migration before D-42 is ready and approved.

This is the smallest change that gives the site meaningful evidence moderation without
breaking existing content, introducing automatic censorship, or creating an unmanageable
admin queue.
