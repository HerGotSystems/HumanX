# D-287B — Saved Analysis Assisted Truth Draft

**Scope:** Frontend + tests + docs
**Status:** COMPLETE — deploy needed (`public/app-v10.js` changed)
**Branch:** main (direct commit)
**Baseline before D-287B:** 3337 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Hardening after D-287B:** 3360 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-287B:** `88ed4ed`
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D287B_SAVED_ANALYSIS_ASSISTED_TRUTH_DRAFT.md`, `docs/README.md`

---

## Purpose

Adds a safe owner-only action that helps draft a Truth from saved AI analysis. The action prefills the Truth submission form — it does not submit, approve, publish, or bypass Review.

Follows directly from D-287A audit conclusion: a "Draft Truth from analysis" button in `analysisItem()` is frontend-only, requires no backend/schema/migration work, and safely preserves the Review gate.

---

## D-287A Audit Conclusion (Recap)

| Dimension | Conclusion |
|-----------|-----------|
| Safe prefill source | `plainLanguageSummary` — prose text description of evidence |
| Blocked source | `verdict` — AI classification label; must never be truth text |
| Backend change needed | None |
| Schema / storage change | None |
| D1 migration needed | None |
| Review gate | Fully preserved |
| `review_state='review'` on submission | Yes — unchanged in backend |
| Auto-submit | Not allowed |
| Auto-publish | Not allowed |
| Implementation scope | Frontend only — `analysisItem()` |

---

## Changes Made

### `public/app-v10.js`

**1. `analysisItem()` (line 466) — draft button added**

A "Draft Truth from analysis" button is now rendered inside each analysis card when `plainLanguageSummary` (or `raw.plain_language_summary`) is present. The button is conditional — it does not render for analysis cards with no summary.

Button uses `data-action="draftTruthFromAnalysis"` with `data-summary="${esc(a.plainLanguageSummary||raw.plain_language_summary||'')}"`.

Adjacent copy:
```
Draft only — review and submit for Review when ready.
```

**2. `draftTruthFromAnalysis(summary)` (new function, inserted after `analysisItem()`)**

```js
async function draftTruthFromAnalysis(summary) {
  if (!summary) return;
  mode = 'truths';
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-truths')?.classList.add('active');
  await renderTruths();
  const el = document.getElementById('truthStatement');
  if (el) {
    el.value = summary;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.focus();
  }
  const ori = document.getElementById('truthOrigin');
  if (ori && !ori.value) ori.value = 'RunPack analysis';
  toast('Draft ready — review and submit for Review when ready.');
}
```

Navigates to the Truths tab, calls `renderTruths()` (so the form is present in DOM), then sets `truthStatement` to `summary`. Optionally sets `truthOrigin` to `"RunPack analysis"` if the field is empty. Ends with a draft-only toast.

**3. `_D181C_PARAM_ACTIONS` (line ~586) — new entry**

```js
draftTruthFromAnalysis: b => draftTruthFromAnalysis(b.dataset.summary)
```

Wires up the `data-action="draftTruthFromAnalysis"` button click to call the new function with `b.dataset.summary`.

---

## Safety Properties

| Property | Status |
|----------|--------|
| Prefill source | `plainLanguageSummary` only |
| `verdict` used as Truth text | Never — not passed to any form field |
| Auto-submit | No — `draftTruthFromAnalysis` never calls `submitTruth()` or `submitBuilderTruth()` |
| Auto-publish | No — no publish route touched |
| Review gate preserved | Yes — `POST /api/truths` still sets `review_state='review'` |
| `review_state='review'` on actual submission | Yes — unchanged in `src/truths.js` |
| Approve/reject routes touched | No — `requestApproveReview`, `requestRejectReview` unchanged |
| Owner must explicitly submit | Yes — must click "Submit Truth for Review" after reviewing prefilled draft |
| Draft-only guidance shown | Yes — `"Draft only — review and submit for Review when ready."` adjacent to button |

---

## Post-Submit Behavior Preserved (D-285B)

Three Truth submission success paths are unchanged:

| Function | Navigation after submit |
|----------|------------------------|
| `submitTruth()` | `renderMe()` + `tab-me` |
| `submitBuilderTruth()` | `renderMe()` + `tab-me` |
| `promoteBelief('truth')` | `renderMe()` + `tab-me` |

Toast preserved:
```
Submitted for Review — you can see it in My HumanX with the Review badge.
```

---

## Private Boundary Copy Preserved (D-281B)

| Copy | Location | Status |
|------|----------|--------|
| `Saving analysis does not publish a truth automatically — it only stores private analysis for this claim.` | `sectionAnalyses()` | Unchanged |
| `Private analysis note — not public truth.` | `analysisItem()` | Unchanged |

---

## Public Profile Unaffected

- `renderPublicProfileHtml()` does not call `analysisItem()`, `sectionAnalyses()`, or `draftTruthFromAnalysis()`
- `"Draft Truth from analysis"` copy does not appear in public profile
- Saved analysis metadata remains private

---

## No-Touch Table

| Area | Status |
|------|--------|
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| Backend/API/schema/storage | No changes |
| Review/moderation handlers | Unchanged |
| `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview` | Unchanged |
| Public profile `/u/:slug` | Unaffected |
| `selectClaim`, `studyFromVault`, `attachEvidencePrompt` | Unchanged |

---

## Tests Added

23 new tests in `scripts/hardening-smoke-test.mjs` under `Section D-287B`:

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | `analysisItem renders "Draft Truth from analysis" button` | Button is present in analysis cards |
| 2 | `draft action is conditional on plainLanguageSummary` | Button only renders when summary exists |
| 3 | `draft action passes plainLanguageSummary via data-summary` | Correct source field used |
| 4 | `draft action does not pass verdict as Truth content` | `verdict` not used as truth text |
| 5 | `"Publish Truth from analysis" wording is absent` | Safe naming enforced |
| 6 | `"Draft only" guidance exists in analysisItem` | Draft-only copy present |
| 7 | `draft-only guidance says review and submit for Review` | Full guidance text verified |
| 8 | `draftTruthFromAnalysis does not call submitTruth()` | No auto-submit |
| 9 | `draftTruthFromAnalysis does not call approve/reject/review routes` | No Review bypass |
| 10 | `existing Truth submission path still references review_state` | Submission gate preserved |
| 11 | `[D-285B lock] submitTruth still calls renderMe() after submission` | Post-submit nav preserved |
| 12 | `[D-285B lock] submitTruth still activates tab-me after submission` | Tab state preserved |
| 13 | `[D-285B lock] post-submit toast preserved` | Toast copy preserved |
| 14 | `public profile does not expose "Draft Truth from analysis"` | Private boundary enforced |
| 15 | `public profile does not expose saved analysis metadata` | Metadata private boundary |
| 16 | `[D-281B lock] analysisItem still renders "Private analysis note"` | Private note preserved |
| 17 | `[D-281B lock] sectionAnalyses still has no-auto-publish copy` | Disclaimer preserved |
| 18 | `[D-277/D-281 lock] saveAnalysisResult still posts only to /api/analysis` | Analysis boundary preserved |
| 19 | `[D-271/D-272 lock] rp-return-section still present in renderExport` | AI-return import lock |
| 20 | `[D-274/D-279 lock] detectPacketStaleness still pushes stale reason` | Stale detection lock |
| 21 | `[D-275/D-277 lock] analysisItem still renders "Saved from RunPack"` | Provenance lock |
| 22 | `draftTruthFromAnalysis registered in _D181C_PARAM_ACTIONS` | Action wiring confirmed |
| 23 | `draftTruthFromAnalysis function exists in app-v10.js` | Function present |

Baseline after: `3360 passed, 0 failed` (+23 vs D-287A baseline of 3337).

Two existing `analysisItemSlice` sizes bumped from 1400→2000 and 1200→2000 to accommodate the expanded `analysisItem()` function body (now 1904 chars; new button content is near the end).

---

## Static Checks (D-287B)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3360 passed, 0 failed` (+23) |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-287A | No | Docs only |
| D-287B | **Yes — needed** | `public/app-v10.js` changed |
