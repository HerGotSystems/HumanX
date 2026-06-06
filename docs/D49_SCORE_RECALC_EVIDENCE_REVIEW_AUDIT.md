# D-49: Claim Scoring — Evidence Review State Audit

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes.

---

## Purpose

D-48 identified `recalcClaimScore` as a known limitation: it counts all evidence rows
regardless of `evidence.review_state`. This document audits the exact behavior, the
precise set of affected call sites, the risk level, and the implementation proposal for
D-50.

---

## Source Files

| File | Role |
|------|------|
| `src/claim-scoring.js` | `recalcClaimScore`, `verdict`, `qualityScore` |
| `src/worker.js` | `addEvidence`, `reviewDecision`, `reportTarget`, `insertEvidence` |

---

## Part 1 — `recalcClaimScore` Current Behavior

### Queries (exact, from `src/claim-scoring.js`)

```js
// Direct evidence — no review_state filter
const directEvidence = await env.DB.prepare(
  `SELECT quality, stance FROM evidence WHERE claim_id=?`
).bind(claimId).all();

// Reused evidence — no review_state filter
const reusedEvidence = await env.DB.prepare(`
  SELECT e.quality, l.stance
  FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=?
`).bind(claimId).all();
```

**Both queries include all evidence rows regardless of `review_state`.** A row with
`review_state='review'` (pending), `review_state='rejected'`, or `review_state='archived'`
is counted identically to a row with `review_state='public'`.

### Score computation summary

```
evidenceRows = directEvidence + reusedEvidence   (all review_states)
supportRows  = rows where stance != 'pressure'
avg          = mean qualityScore of supportRows   (evidence_score)
pressureSeverity = pressure_points.severity sum + pressure-stance evidence count
survivability = clamp(avg - pressureSeverity×1.8 + testability×0.22, 0, 100)
verdict      = function of avg, testability, survivability, contradictions
```

After computing, writes to `claims` table:
`UPDATE claims SET evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=? WHERE id=?`

### Quality → score mapping

| Quality label | Score |
|---------------|-------|
| `repeatable` | 85 |
| `documented` | 68 |
| `media` | 38 |
| `testimony` | 24 |
| `vibes` | 8 |
| (any other / null) | 20 |

---

## Part 2 — Call Sites

### Where `recalcClaimScore` IS called

| Function | Trigger | Timing |
|----------|---------|--------|
| `addEvidence` (line 82) | User submits new evidence via `POST /api/evidence` | Immediately after `insertEvidence` — before evidence is public |
| `addPressure` (line 83) | User submits pressure point via `POST /api/pressure` | After pressure insert — correct |

### Where `recalcClaimScore` is NOT called (gaps)

| Function | Event | Missing call |
|----------|-------|-------------|
| `reviewDecision` (evidence branch, line 87) | Admin approves evidence (`public`) | Score not updated when pending evidence becomes public |
| `reviewDecision` (evidence branch, line 87) | Admin rejects evidence (`rejected`) | Score not updated when rejected evidence is removed from public view |
| `reviewDecision` (evidence branch, line 87) | Admin re-queues evidence (`review`) | Score not updated |
| `reportTarget` (evidence branch, line 85) | Evidence auto-escalated to `review` at ≥ 2 reports (was `public`) | Score not updated when previously-public evidence re-enters review |

---

## Part 3 — Impact Analysis

### Scenario A — New evidence submitted (currently broken)

1. User submits evidence. `insertEvidence` writes row with `review_state='review'`.
2. `addEvidence` immediately calls `recalcClaimScore`.
3. Score query has no filter → pending evidence is **included in score**.
4. Claim `evidence_score`, `survivability`, `status` all reflect the pending evidence.
5. Public users see inflated/deflated claim scores before evidence is reviewed.

**Effect:** Every evidence submission immediately and silently affects the claim's public
score, even though the evidence itself is invisible in Study view and Vault.

### Scenario B — Evidence approved (currently broken)

1. Admin approves evidence (`review_state='review'` → `'public'`).
2. `reviewDecision` does **not** call `recalcClaimScore`.
3. Score was already inflated from the submission moment (Scenario A).
4. No corrective recalculation occurs at approval.

**Effect:** Score was wrong from submission; approval does not trigger a clean recompute.
This is a compounding problem: the score is inflated by pending evidence (Scenario A) and
approval does not produce a clean re-baseline.

### Scenario C — Evidence rejected (currently broken)

1. Admin rejects evidence (`review_state='review'` → `'rejected'`).
2. `reviewDecision` does **not** call `recalcClaimScore`.
3. The rejected evidence was counted in the score since submission.
4. After rejection the score remains stale — rejected evidence continues to inflate it.

**Effect:** Rejected evidence permanently inflates/deflates claim scores until something
else triggers a recalculation (which only happens on a new evidence or pressure submission).

### Scenario D — Evidence reported back to review (currently broken)

1. Approved (`public`) evidence accumulates ≥ 2 reports.
2. `reportTarget` sets `review_state='review'` but does **not** call `recalcClaimScore`.
3. The evidence was legitimately included in the score when it was public.
4. After escalation it is still included in the score (no filter, no recalc).

**Effect:** Evidence that has been pulled back from public view (due to reports) continues
to count toward the claim score.

---

## Part 4 — Risk Assessment

| Dimension | Assessment |
|-----------|-----------|
| **Access control** | Not affected. No public API returns non-public evidence. Visibility guards are correct. |
| **Data integrity** | Score columns (`evidence_score`, `survivability`, `status`) in `claims` table may be stale or inflated. |
| **User-facing impact** | Claim cards and Study view show incorrect meters if pending or rejected evidence exists. |
| **Severity** | **Low–Medium.** Scores are advisory indicators, not access-controlling. No evidence is leaked. |
| **Frequency** | Every new evidence submission since D-42B merge has affected scores. Grows over time as evidence enters review and gets decided. |
| **Reversibility** | Running a corrected `recalcClaimScore` on all affected claims would reset scores to accurate values. No migration needed — score data is derived. |
| **Priority** | Should be fixed before D-47 manual test execution; D-50 branch + PR is the correct path. |

---

## Part 5 — Fix Proposal (D-50)

### 5.1 Filter `recalcClaimScore` queries (in `src/claim-scoring.js`)

**Direct evidence** — add `review_state` filter:

```js
// Before
const directEvidence = await env.DB.prepare(
  `SELECT quality, stance FROM evidence WHERE claim_id=?`
).bind(claimId).all();

// After
const directEvidence = await env.DB.prepare(
  `SELECT quality, stance FROM evidence WHERE claim_id=? AND COALESCE(review_state,'public')='public'`
).bind(claimId).all();
```

**Reused evidence** — add `review_state` filter on the joined `evidence` table:

```js
// Before
const reusedEvidence = await env.DB.prepare(`
  SELECT e.quality, l.stance
  FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=?
`).bind(claimId).all();

// After
const reusedEvidence = await env.DB.prepare(`
  SELECT e.quality, l.stance
  FROM evidence_claim_links l
  JOIN evidence e ON e.id=l.evidence_id
  WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
`).bind(claimId).all();
```

`COALESCE(...,'public')` treats any `NULL` row (pre-migration legacy) as public,
consistent with D-42B policy everywhere else.

### 5.2 Call `recalcClaimScore` after evidence `reviewDecision` (in `src/worker.js`)

The `reviewDecision` evidence branch currently returns `row` (the evidence row with
`row.claim_id`). Add a recalc call before the return:

```js
// After (evidence branch of reviewDecision, before return)
if (row.claim_id) await recalcClaimScore(env, row.claim_id);
return json({ ok:true, targetType:'evidence', decision, item:row });
```

This fires for `public` (approve), `review` (re-queue), and `rejected` decisions —
correct in all three cases.

### 5.3 Call `recalcClaimScore` after evidence escalation in `reportTarget` (in `src/worker.js`)

The `reportTarget` evidence branch updates `review_state` via a CASE expression but has
no access to `claim_id` without a subsequent query. Add a lookup and conditional recalc:

```js
// After (evidence branch of reportTarget)
if (targetType === 'evidence') {
  await env.DB.prepare(`
    UPDATE evidence SET report_count=report_count+1,
      review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END
    WHERE id=?
  `).bind(targetId).run();
  // Recalc score on the parent claim if evidence exists (non-fatal on miss)
  const evRow = await env.DB.prepare(`SELECT claim_id FROM evidence WHERE id=?`)
    .bind(targetId).first();
  if (evRow?.claim_id) await recalcClaimScore(env, evRow.claim_id).catch(() => null);
}
```

The `.catch(() => null)` matches the fail-safe pattern used elsewhere in the Worker
(score recalc failure should not fail the report submission).

### 5.4 `addEvidence` — no change needed

`addEvidence` already calls `recalcClaimScore` after insert. Once the score query is
filtered (5.1), new pending evidence will **not** affect the score at submission time.
The call remains correct for any cases where the evidence is inserted as `public`
(e.g., `reviewState='public'` passed explicitly, such as in future admin-bypass paths).

---

## Part 6 — Decision Points for D-50

| Question | Answer |
|----------|--------|
| Should approval trigger recalc? | **Yes** — approving evidence should immediately update claim score to include it |
| Should rejection trigger recalc? | **Yes** — rejected evidence should be removed from score |
| Should re-queue trigger recalc? | **Yes** — evidence moving from public back to review should be removed from score |
| Should report escalation trigger recalc? | **Yes** — evidence pulled back to review (from public) should be removed from score |
| Should backfill run after code fix? | **No, not immediately.** Scores self-correct next time any evidence or pressure is submitted to a claim. A batch recalc of all affected claims is a separate optional operation requiring explicit approval. |
| Is a migration required? | **No.** All changes are in application code. Schema is unchanged. |

---

## Part 7 — Testing Plan for D-50

| Phase | Method | When |
|-------|--------|------|
| Static checks | `node scripts/hardening-smoke-test.mjs` must still pass 110 | During D-50 |
| New hardening checks | Add 2 checks: (1) `recalcClaimScore` direct query has `COALESCE(review_state,'public')='public'`; (2) `reviewDecision` evidence branch calls `recalcClaimScore` | D-50 (110→112) |
| `node --check` | Both `src/worker.js` and `src/claim-scoring.js` must parse clean | During D-50 |
| Live validation | D-47 manual test plan Test B (approve evidence) implicitly tests score update; Test C (reject evidence) tests score correction — execute D-47 after D-50 | After D-50 + D-47 execution |
| Batch recalc | Optional, only with explicit user approval; not part of D-50 | Future D |

---

## Part 8 — Out of Scope

| Item | Reason |
|------|--------|
| Score algorithm redesign | D-50 preserves exact formula; only adds filter |
| AI scoring | Out of scope for all current D series |
| Hard delete of evidence | No hard deletes; rows preserved |
| Production recalculation script | Requires explicit approval; deferred |
| Testability column on evidence | Evidence has no `testability` — not applicable |
| Reused evidence link `review_state` | Reuse links in `evidence_claim_links` do not have their own state; the filter applies to the `evidence` row's `review_state` |

---

## D-49 Completion Record

| Item | Status |
|------|--------|
| `recalcClaimScore` queries read and documented | ✅ Done |
| Call sites in `addEvidence`, `reviewDecision`, `reportTarget` audited | ✅ Done |
| Four gap scenarios documented (A–D) | ✅ Done |
| Risk assessment: low–medium, advisory impact only | ✅ Done |
| D-50 fix: filter queries + 3 new `recalcClaimScore` call sites | ✅ Proposed |
| D-50 decision points answered | ✅ Done |
| D-50 testing plan: static checks → hardening → D-47 manual | ✅ Done |
| Out-of-scope items confirmed | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
