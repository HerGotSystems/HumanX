# D-283A — Truth Drafting and Review Workflow Audit

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3317 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-283A:** `dbb6f75`
**Files changed:** `docs/D283A_TRUTH_DRAFTING_AND_REVIEW_WORKFLOW_AUDIT.md`, `docs/README.md`

---

## Purpose

Full audit of the Truth drafting and Review workflow. Maps every creation path, the Review gate, approval/rejection handlers, and the boundary between saved AI analysis and Truth submission. Identifies any copy or structural findings and recommends D-283B work.

---

## Audit Questions and Answers

### Q1 — How many distinct frontend paths lead to Truth creation?

**Three:**

| Path | Frontend function | API call |
|------|------------------|----------|
| Truths view "Add a public Truth" form | `submitTruth()` (line 450) | `POST /api/truths` |
| Claim Builder (step 3, route=`truth`) | `submitBuilderTruth()` (line 175) | `POST /api/truths` |
| Drift/Belief snapshot promote | `promoteBelief(snapshotId, 'truth')` (line 153) | `POST /api/belief-promote` |

`convertTruth()` is **not** a Truth creation path — it converts an existing Truth to a Claim via `POST /api/truth-to-claim`.

---

### Q2 — What fields does each path send?

**`submitTruth()`** — `{ statement, category, origin, truthType }`

**`submitBuilderTruth()`** — `{ statement, category, origin: 'Claim Builder raw thought', truthType, confidenceLabel: 'claimed', claim_builder: builderPayload() }`

**`promoteBelief('truth')`** — `{ snapshotId, target: 'truth' }` sent to `POST /api/belief-promote`; backend creates the truth internally.

---

### Q3 — What backend handler handles `POST /api/truths`?

`worker.js` line 64: routes to `createTruth(request, env, {...})` imported from `src/truths.js`.

---

### Q4 — What `review_state` do new Truths receive on creation?

`'review'` — always. `createTruth()` in `src/truths.js` inserts with `review_state='review'`. No path creates a Truth with `review_state='public'` directly.

---

### Q5 — Is there a "draft" state for Truths (private to owner, not yet in Review)?

No. There is no draft state. A submitted Truth enters Review immediately. The owner cannot hold a Truth as a local draft on the server before submission. The only "draft" experience is the unfilled form in the UI before the user clicks Submit.

---

### Q6 — Can any frontend path create a Truth that is directly public?

No. All three creation paths produce `review_state='review'`. Approval to `'public'` requires an explicit admin action via the Review queue.

---

### Q7 — What fields does the `truths` table store?

From the `reviewQueue` SQL and `renderTruths` query (worker.js lines 319 and 980):

`id`, `statement`, `category`, `origin`, `truth_type`, `confidence_label`, `pressure_score`, `review_state`, `user_id`, `linked_claim_id`, `archived_by_user`, `created_at`, `updated_at`

No "body" or "supporting notes" field beyond `statement`. No free-form draft content separate from the statement.

---

### Q8 — Who can approve or reject a Truth from Review?

Admin only. `reviewDecision()` in `worker.js` (line 898) calls `requireAdmin(request, env)` at the top and returns an error if not satisfied. Non-admin users cannot approve or reject Truths.

---

### Q9 — What route handles Truth approval and rejection?

`POST /api/review/decision` with body `{ targetType: 'truth', targetId, decision }`.

`decision='public'` → `UPDATE truths SET review_state='public'`
`decision='rejected'` → `UPDATE truths SET review_state='rejected'`
`decision='review'` → `UPDATE truths SET review_state='review'` (return to Review)

All three values are allowed per the `allowed` Set in `reviewDecision()`.

---

### Q10 — Can a Truth be archived? By whom?

Yes — admin only. `archiveTruthArtefact(id)` in `public/app-v10.js` (line 190) calls `POST /api/review/decision` (reject) then `POST /api/review/cleanup` with `junk_override: true`. The cleanup handler in `worker.js` (line 951/972) sets `review_state='archived'` on the truth row. The Archive action is only rendered if `adminToken()` is set.

---

### Q11 — Does saving AI analysis (`saveAnalysisResult`) feed into Truth creation anywhere?

No. `saveAnalysisResult()` posts only to `POST /api/analysis`. It does not call `POST /api/truths`, `POST /api/belief-promote`, or `POST /api/review/decision`. No code path connects a saved analysis to a Truth submission automatically.

---

### Q12 — Is there a "Use analysis to draft a Truth" action in the UI today?

No. There is no button, link, or function that pre-fills the Truth submission form with saved analysis content. The saved-analysis card (`analysisItem()`) renders three items: not-independent-verification disclaimer, private-analysis note, and optional RunPack provenance. None of these trigger Truth creation.

---

### Q13 — Can an owner see their own Truths while they are in Review?

Partially. The `renderMe()` function fetches from `GET /api/me` which queries truths for the owner with `WHERE user_id=? ... COALESCE(review_state,'public')='public'` (worker.js line 788). This filters to **public** truths only — the owner cannot see their own pending-Review truths via the Me view.

The Truths tab (`renderTruths()` → `GET /api/truths`) serves only `review_state='public'` truths to non-admins (standard list endpoint behavior). So an owner cannot easily confirm their Truth is in the queue without admin access.

**Finding F-1 LOW:** No owner-facing "your Truth is in Review" feedback path. The toast after submission says "Truth submitted for Review. It will appear publicly after approval." — this is the only confirmation. No UI shows pending-review truths back to the submitter.

---

### Q14 — Does the Review queue expose Truth review state to non-admins?

No. The Review queue (`GET /api/review`) is gated behind `requireAdmin`. Non-admins receive a 401. The Review tab (`renderReview()`) only renders content if `adminToken()` is truthy. There is no public view of the pending-Review queue.

---

### Q15 — Is the `helperText()` copy for Truths mode accurate?

Yes. The `'truths'` branch of `helperText()` (line 139) reads:

> "HumanX records what is asserted, not whether it is correct. Recording a Truth does not verify it."
> "Added truths enter Review before going public."

This accurately reflects the `review_state='review'` insertion behavior. No inaccuracy found.

---

### Q16 — Is the "Add a public Truth" form copy in `renderTruths()` accurate?

Yes. The inline form (line 181) includes `<button ... >Submit Truth for Review</button>` and `<p class="small review-first-note">Enters Review before going public.</p>`. The button label and note accurately reflect the Review gate.

---

### Q17 — Is the `submitBuilderTruth()` toast copy accurate?

Yes. Line 175: `toast('Saved as Truth for Review. It will appear publicly after approval.')`. Accurate.

---

### Q18 — Is the `submitTruth()` toast copy accurate?

Yes. Line 450: `toast('Truth submitted for Review. It will appear publicly after approval.')`. Accurate.

---

### Q19 — Is `promoteBelief('truth')` toast copy accurate?

Yes. Line 153: `toast(data.existing ? 'Truth reinforced — already in Truths.' : 'Truth promoted to Review. It will appear publicly after approval.')`. Accurate for both the existing-truth and new-truth cases.

---

### Q20 — Are there any copy or structural gaps that need fixing?

| Finding | Severity | Description |
|---------|----------|-------------|
| F-1 | LOW | No owner-facing path shows pending-Review truths back to the submitter. Owner toast confirms submission but cannot verify queue position. Not a copy error — a structural limitation. No immediate fix needed without a backend/schema change. |

No MEDIUM or HIGH findings. The boundary between saved AI analysis and Truth creation is intact (confirmed by Q11–Q12). All toast copy is accurate. All Review gate behavior is correct. `helperText()` is accurate.

---

### Q21 — What is safe next work for D-283B?

Given that:
- All copy is accurate and Review gate behavior is structurally sound
- The only finding (F-1) is LOW severity and requires a backend query change to expose pending-Review truths to the owner
- Safe-next rule 91 (from D-282A) blocks "analysis→Truth" UI actions pending explicit approval
- Safe-next rule 92 blocks changes to `inspectReviewItem`, `reviewDecisionUI`, and all Review decision handlers

**Recommended D-283B candidates (smallest to largest):**

| Option | Scope | Size |
|--------|-------|------|
| A — Docs checkpoint (D-283B as arc close) | Docs only | XS — update PROJECT_STATE.md + README |
| B — Owner pending-Truth visibility (F-1) | Frontend + backend query | S — new `review_state IN ('review')` filter in `/api/me` truths query; show pending card in Me view |
| C — Audit of Truth-to-Claim conversion path (`convertTruth` + `POST /api/truth-to-claim`) | Docs only | XS — targeted audit |

Option A is the safe default. Option C is a natural follow-on audit. Option B requires a backend query change and a new frontend card render — branch/PR style. None touch Review decision handlers.

---

## Summary

The Truth drafting and Review workflow is **structurally sound**. Three frontend creation paths all produce `review_state='review'`. Admin-only Review queue handles approval/rejection. No path bypasses Review. Saved AI analysis has no connection to Truth creation. All copy is accurate. One LOW finding (F-1): no owner-facing view of pending-Review truths. No immediate fix required.

---

## Static Checks (D-283A baseline)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3317 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| Backend/API/schema/storage | No changes |
| Review/moderation handlers | Unchanged |
