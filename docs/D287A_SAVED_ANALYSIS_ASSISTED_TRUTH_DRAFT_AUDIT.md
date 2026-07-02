# D-287A — Saved Analysis Assisted Truth Draft Audit

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3337 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-287A:** `4c8e956`
**Files changed:** `docs/D287A_SAVED_ANALYSIS_ASSISTED_TRUTH_DRAFT_AUDIT.md`, `docs/README.md`

---

## Purpose

Audit whether saved AI analysis can safely assist the owner in drafting a Truth — specifically via prefill of the Truth submission form. No implementation in this task. Docs only. Determines whether D-287B is safe, what its minimum scope would be, and what must be preserved.

**Constraint:** prefill only — no auto-submit, no auto-publish, Review gate must remain intact.

---

## Source Material

Code reads performed before this audit:

| Location | What was read |
|----------|--------------|
| `app-v10.js` line 466 | `analysisItem(a)` — full field list, rendering logic |
| `app-v10.js` line 555 | `sectionAnalyses()` — Study view Analysis panel, save flow, disclaimer copy |
| `app-v10.js` line 296 | `meRecentTruthsHtml()` — My HumanX Truth rendering |
| `app-v10.js` line 450 | `submitTruth()` — Truth form fields, submission handler |
| `app-v10.js` line 175 | `submitBuilderTruth()` — Builder submission path |
| `app-v10.js` line 153 | `promoteBelief('truth')` — Belief-to-Truth path |
| `app-v10.js` line 386 | `renderMe()` — My HumanX dashboard |

---

## Audit Questions and Answers

### Q1 — What analysis fields does `analysisItem(a)` expose?

`analysisItem(a)` reads the following fields from each saved analysis object (with `raw` fallback):

| Field | Source key | Type | Notes |
|-------|-----------|------|-------|
| `verdict` | `a.verdict \|\| raw.verdict` | string | AI verdict label; legacy-remapped via `LEGACY_VERDICT_MAP` |
| `plainLanguageSummary` | `a.plainLanguageSummary \|\| raw.plain_language_summary` | string | Plain-text AI summary of claim evidence |
| `source` | `a.source \|\| raw.source` | string | e.g. `'runpack-user'` |
| `packetId` | `a.packetId` | string | Identifies the RunPack that produced this analysis |
| `evidenceScore` | `a.evidenceScore \|\| raw.evidence_score` | number | 0–10 score |
| `testability` | `a.testability \|\| raw.testability` | number | 0–10 score |
| `survivability` | `a.survivability \|\| raw.survivability` | number | 0–10 score |
| `strongestSupport` | `a.strongestSupport \|\| raw.strongest_support` | list | Supporting evidence items |
| `strongestPressure` | `a.strongestPressure \|\| raw.strongest_pressure` | list | Pressure / counter-evidence items |
| `missingTests` | `a.missingTests \|\| raw.missing_tests` | list | Gaps in evidence |

---

### Q2 — Which field is the safest candidate for prefilling `truthStatement`?

**`plainLanguageSummary`** is the safest candidate.

- It is prose text, not a score or label.
- It is AI-generated text that describes what the evidence says about the claim — close in register to what an owner might write as a Truth statement.
- It does not carry an approval/rejection judgment, unlike `verdict`.
- It is already rendered as the main body text in `analysisItem()` cards and is what an owner reads when reviewing analysis.

Second-best candidate: `strongestSupport` items (could inform the statement). Not recommended as a direct prefill because they are list items rather than a composed statement.

---

### Q3 — Why must `verdict` not be used as truth text?

`verdict` is an AI classification label, not a claim statement. It is stored as a machine-readable token (e.g. `'strongly-supported'`, `'contested'`, or legacy values like `'high'`, `'medium'`) and is remapped via `LEGACY_VERDICT_MAP` for display. It is never suitable as the body of an owner-authored Truth because:

1. It is a category label, not a sentence.
2. The displayed form (post-remap) is a display string like `"Strongly Supported"` — grammatically incomplete as a Truth statement.
3. Presenting an AI label as the owner's stated belief would misrepresent the nature of the claim.
4. The Review moderator would receive a Truth body that reads like a machine classification, not a human statement.

**`verdict` must never be prefilled into `truthStatement` or any Truth form field.**

---

### Q4 — What are the editable fields in the Truth submission form (`submitTruth()`)?

`submitTruth()` (app-v10.js line 450) reads four fields via DOM:

| DOM ID | Field role | Type |
|--------|-----------|------|
| `truthStatement` | Body / claim text | textarea |
| `truthCategory` | Category selection | select or input |
| `truthOrigin` | Origin description | input |
| `truthType` | Type selection | select |

All four are standard DOM elements readable via `document.getElementById()` and settable via `.value =`.

---

### Q5 — How does `submitTruth()` read those form fields?

```js
document.getElementById('truthStatement')?.value
document.getElementById('truthCategory')?.value
document.getElementById('truthOrigin')?.value
document.getElementById('truthType')?.value
```

All reads use optional chaining — the form gracefully handles missing elements. Prefill would use the same pattern in reverse: `document.getElementById('truthStatement').value = plainLanguageSummary`.

---

### Q6 — Is `sectionAnalyses()` rendered only in the owner Study view?

**Yes.** `sectionAnalyses()` (app-v10.js line 555) is called only from `renderStudy()`. `renderStudy()` is owner-only — it requires an authenticated session and renders inside the Study tab. It is never called from public profile routes.

---

### Q7 — Is `sectionAnalyses()` (and therefore `analysisItem()`) ever shown on the public profile?

**No.** The public profile (`/u/:slug`, rendered via `loadPublicProfileSummary`) does not call `renderStudy()`, `sectionAnalyses()`, or `analysisItem()`. Saved analyses are never exposed publicly. The "Private analysis note — not public truth." label in `analysisItem()` (D-281B) reinforces this.

---

### Q8 — Does "Draft Truth from analysis" require a new backend route?

**No.** Prefilling the Truth form is a pure frontend DOM operation. No new API call, no new route, no worker change. The existing `POST /api/truths` handler is called only when the owner clicks "Submit Truth for Review" — it is unchanged.

---

### Q9 — Does it require a schema or storage change?

**No.** The `analysis_results` table already stores all fields. The `truths` table already has `statement`, `category`, `origin`, `truth_type`. No new columns, no new tables, no schema migration.

---

### Q10 — Does it require a D1 migration?

**No.** Zero migrations needed for D-287B.

---

### Q11 — Would the action auto-submit the Truth?

**No — it must not.** Prefill is a read-and-populate operation only. The owner must explicitly click "Submit Truth for Review" after reviewing and optionally editing the prefilled content. No code path from `analysisItem()` may call `submitTruth()`, `submitBuilderTruth()`, or `promoteBelief()` automatically.

---

### Q12 — Would `review_state='review'` be preserved on submission?

**Yes.** The submission handler (`POST /api/truths` via `src/truths.js`) hardcodes `review_state = 'review'` for new Truths. Prefilling form fields does not affect submission-time state. The Review gate is in the backend, not the frontend form.

---

### Q13 — Is the Review gate fully preserved?

**Yes.** The Review gate (`POST /api/review/decision` with `decision='public'`) is admin-only and is not touched by prefill. No prefill action reaches the Review decision path.

---

### Q14 — What is the minimum change scope for D-287B?

Minimum safe implementation:

1. Add a "Draft Truth from this analysis" button inside `analysisItem()` render output.
2. On click: populate `document.getElementById('truthStatement').value` with `a.plainLanguageSummary`.
3. Navigate to the Truth submission form (the Truths tab with the form visible).
4. Do not call `submitTruth()` automatically.
5. No backend, no API, no schema, no migration, no CSS change needed beyond the button element itself.

**Frontend only. Single function touched: `analysisItem()`.**

---

### Q15 — Which function in `app-v10.js` would host the prefill button?

**`analysisItem(a)`** (line 466). The button would be part of the analysis card HTML returned by this function. It would read `a.plainLanguageSummary` at click time (already in closure scope) and set the Truth form field.

`sectionAnalyses()` (line 555) does not need to change — it calls `an.map(analysisItem)` and each card handles its own interaction.

---

### Q16 — Does the feature touch any hard-locked handlers?

**No.** Hard-locked handlers are:
- `selectClaim`, `studyFromVault`, `attachEvidencePrompt` — not touched
- `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview` — not touched
- `public/belief-drift-expansion.js`, `public/index.html` — not touched

The feature is entirely inside `analysisItem()` return HTML.

---

### Q17 — What copy should the prefill button show?

Recommended:

```
Draft Truth from this analysis
```

- Communicates intent (draft, not submit)
- Clearly tied to "this analysis" (the card it appears on)
- Does not imply auto-submit

Alternative (shorter): `Use as Truth draft` — acceptable but less clear about the directionality.

---

### Q18 — Should `packetId` be recorded anywhere on the prefilled Truth?

**This is an open design question for D-287B to decide.** Two options:

| Option | Approach | Risk |
|--------|----------|------|
| No linkage | prefill only, no `packetId` in Truth | Clean; no extra fields; simpler |
| Record in `origin` field | prefill `truthOrigin` with e.g. `"RunPack analysis"` or `a.packetId` | Slight complexity; could be edited away by owner before submit |

Recommended for D-287B: prefill `truthOrigin` with `"RunPack analysis"` only — do not embed the raw `packetId` in user-visible text. The `truthOrigin` field is freeform text and this would give the moderator context. The owner can edit or clear it before submitting.

**No new Truth table column needed** — `origin` already exists in `truths`.

---

### Q19 — What is the risk if the owner submits without editing the prefilled content?

The submitted Truth would contain the AI's `plainLanguageSummary` verbatim, attributed to the owner. The Review gate mitigates this — the moderator would see the statement before it goes public. The moderator can reject if the content is unsuitable. This is the same risk as any other Truth submission.

**Net risk: LOW.** Review gate is the primary control. Owner consent (clicking "Submit Truth for Review") is a second control. Neither is bypassed.

---

### Q20 — Does this touch `belief-drift-expansion.js` or `index.html`?

**No.** Both files are off-limits during Review/Truth work and are not involved here. `analysisItem()` is inside `app-v10.js`. No changes to `index.html` or `belief-drift-expansion.js`.

---

### Q21 — What existing disclaimer already sets the right expectation?

`sectionAnalyses()` (app-v10.js line 555) already contains:

```
Saving analysis does not publish a truth automatically — it only stores private analysis for this claim.
```

This disclaimer covers the existing save flow. For D-287B, the prefill button should be distinct — it is not the same action as "Save Analysis". The existing disclaimer does not need to change. D-287B may add a companion note near the prefill button (e.g. `"Drafting does not submit — you must click Submit Truth for Review."`) consistent with the existing disclaimer pattern.

---

### Q22 — Does this require any new API surface?

**No.** No new endpoints, no new query params, no new request/response shapes. The existing `POST /api/truths` and `GET /api/analysis` (study data) are unchanged.

---

### Q23 — What is the D-287B classification?

**Frontend-only. Single function. No backend, no schema, no migration.**

| Dimension | D-287B |
|-----------|--------|
| Backend change | None |
| Schema / storage change | None |
| D1 migration | None |
| Worker (`src/worker.js`) change | None |
| `src/truths.js` change | None |
| `src/analysis-results.js` change | None |
| `public/index.html` change | None |
| `public/belief-drift-expansion.js` change | None |
| `public/styles.css` change | Optional (minor) |
| `public/app-v10.js` change | **Yes — `analysisItem()` only** |
| Review gate preserved | Yes |
| `review_state='review'` preserved | Yes |
| Hard-locked handlers touched | None |
| Auto-submit | No — prefill only |
| Auto-publish | No — unchanged |
| Commit path | Direct to main (frontend + tests + docs) |

---

## Summary Finding

Saved AI analysis can safely assist the owner in drafting a Truth, **subject to the constraint that the action is prefill-only with no auto-submit and no auto-publish.**

The implementation requires a single frontend change: a "Draft Truth from this analysis" button inside `analysisItem()` that populates `truthStatement` with `plainLanguageSummary` and navigates the owner to the Truth submission form. The Review gate is fully preserved. No backend, schema, or migration work is needed.

**D-287B classification: frontend-only. Safe to implement.**

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-287A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-287A |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |

---

## Static Checks (D-287A — docs only, expected unchanged)

| Check | Expected |
|-------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3337 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-287A | No | Docs only |
