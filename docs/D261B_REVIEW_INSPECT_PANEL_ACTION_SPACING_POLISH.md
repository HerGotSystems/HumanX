# D-261B — Review Inspect Panel Action Spacing Polish

**Scope:** CSS + tests + docs
**Status:** COMPLETE — deploy needed
**Baseline:** 2978 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D261B_REVIEW_INSPECT_PANEL_ACTION_SPACING_POLISH.md`, `docs/README.md`
**App changes:** None (`public/app-v10.js` not touched)
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes (CSS change)

---

## Purpose

Addresses D-261A F-1 HIGH and F-4 MEDIUM: at ≤600px, all inspect panel action buttons collapsed into a single flat column with no visual grouping and no explicit full-width tap targets. This task adds three CSS-only improvements:

1. Desktop Study push — natural visual separation between primary/dup group and Study
2. Mobile full-width tap targets — all buttons expand to `width:100%` in the column
3. Mobile soft separator — subtle `border-top` before the duplicate/advisory buttons

No copy changes, no behavior changes, no app/worker/Drift/Belief changes.

---

## CSS Changes (`public/styles.css`)

### Change 1 — Desktop Study push

**After `.btn-study-review` rule (~line 309):**

```css
/* D-261B: Study button pushed to far right on desktop — creates natural gap before advisory/study group */
.review-inspect-actions .btn-study-review{margin-left:auto}
```

Effect: On desktop (flex row), Study floats to the far right of the action bar, creating a natural visual gap between the primary/dup group (Approve/Keep/Reject/Archive/Mark Dup/Dismiss ~Similar) and Study. No layout impact on other buttons.

### Change 2 — Mobile full-width tap targets

**Appended inside `@media(max-width:600px)` Review block (~line 318), before closing `}`:**

```css
/* D-261B: full-width tap targets in mobile column */
.review-inspect-actions button{width:100%}
```

Effect: In mobile column layout, all inspect action buttons expand to the full container width — consistent tap targets, no variable-width buttons.

### Change 3 — Mobile soft separator + Study column reset

**Appended immediately after Change 2 in the same `@media` block:**

```css
/* D-261B: soft visual separator before duplicate/advisory actions in mobile column */
.review-inspect-actions .review-inspect-markdup,.review-inspect-actions .review-inspect-resolvesim{margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)}
/* D-261B: reset desktop Study push in mobile column — Study stacks naturally */
.review-inspect-actions .btn-study-review{margin-left:0}
```

Effect: In mobile column layout, a subtle `border-top` (6% white alpha) appears above "Mark Duplicate..." and above "Dismiss ~Similar", creating a calm visual break before the dup/advisory group. Study button's `margin-left:auto` is reset to `0` so it stacks naturally in the column rather than being pushed (which has no visual effect in a column but avoids any flex side-effects).

---

## CSS Classes Touched

| Class | Change | Breakpoint |
|-------|--------|------------|
| `.review-inspect-actions .btn-study-review` | `margin-left:auto` | Desktop (no media query) |
| `.review-inspect-actions button` | `width:100%` | `@media(max-width:600px)` |
| `.review-inspect-actions .review-inspect-markdup` | `margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)` | `@media(max-width:600px)` |
| `.review-inspect-actions .review-inspect-resolvesim` | same as above | `@media(max-width:600px)` |
| `.review-inspect-actions .btn-study-review` | `margin-left:0` (reset) | `@media(max-width:600px)` |

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified
- `src/worker.js` — not modified
- `public/belief-drift-expansion.js` — not modified
- `public/index.html` — not modified
- No copy changes — button labels (Approve / Keep Pending / Reject / Mark Duplicate... / Dismiss ~Similar / Study) unchanged
- No behavior changes — `requestApproveReview`, `requestRejectReview`, `markDuplicateUI`, `resolveSimilarUI` unchanged
- No backend/API/migration/schema/CSP/wrangler.toml changes
- No Review/admin logic changes
- `alignment_labels` not enabled
- `top_beliefs_json` not returned raw

---

## Tests Added (19 new — hardening-smoke-test.mjs)

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | Desktop Study push: `margin-left:auto` | `.review-inspect-actions .btn-study-review{margin-left:auto}` exists outside any media block |
| 2 | Mobile `width:100%` | Review `@media` block contains `.review-inspect-actions button{width:100%}` |
| 3 | Mobile `.review-inspect-markdup` top separator | Review `@media` block contains `review-inspect-markdup` + `margin-top` |
| 4 | Mobile `.review-inspect-resolvesim` top separator | Review `@media` block contains `review-inspect-resolvesim` + `margin-top` |
| 5 | Mobile separator uses `border-top` (calm styling) | Review `@media` block contains `border-top` + `review-inspect-markdup` |
| 6 | Mobile Study reset `margin-left:0` | Review `@media` block contains `btn-study-review` + `margin-left:0` |
| 7 | `app-v10.js` not modified | mtime unchanged |
| 8 | `worker.js` not modified | mtime unchanged |
| 9 | `belief-drift-expansion.js` not modified | mtime unchanged |
| 10 | Approve label unchanged | `renderReviewInspectPanel` emits `Approve` |
| 11 | Keep Pending label unchanged | `renderReviewInspectPanel` emits `Keep Pending` |
| 12 | Reject label unchanged | `renderReviewInspectPanel` emits `Reject` |
| 13 | Mark Duplicate... label unchanged | `renderReviewInspectPanel` emits `Mark Duplicate...` |
| 14 | Dismiss ~Similar label unchanged | `renderReviewInspectPanel` emits `Dismiss ~Similar` |
| 15 | `requestApproveReview` behavior lock | function still present |
| 16 | `requestRejectReview` behavior lock | function still present |
| 17 | `markDuplicateUI` behavior lock | function still present |
| 18 | `resolveSimilarUI` behavior lock | function still present |
| 19 | Public boundary | `.review-inspect-actions` absent from `renderPublicProfileHtml` |

---

## Media Block Anchor

The Review-specific `@media(max-width:600px)` block is located by anchoring to `.review-inspect-actions{flex-direction:column}` — not by `indexOf('@media(max-width:600px)')` which finds the first occurrence at line 14 (pipeline-banner block). Tests use:

```javascript
const anchorIdx = cssSrc.indexOf('.review-inspect-actions{flex-direction:column}');
const mediaIdx = cssSrc.lastIndexOf('@media(max-width:600px)', anchorIdx);
const mediaSlice = cssSrc.slice(mediaIdx, mediaIdx + 1500);
```

---

## Deploy State

| Task | Deploy |
|------|--------|
| D-261A | Docs only — no deploy |
| D-261B | CSS change — owner deploy needed |

---

## Regression Locks Preserved

All D-229A→D-259A regression lock tests continue to pass. D-261B's 19 new tests pass at baseline `2978 passed, 0 failed`.

| Lock source | Coverage |
|------------|---------|
| D-259A (35 tests) | Sort-bar render, CSS isolation, decision-feedback flex-wrap, button shrink, empty-actions flex, pipeline, public profile boundary |
| D-258B locked classes | `.review-sort-bar`, `.review-sort-label`, `.review-sort-select`, `.review-decision-feedback`, `.review-feedback-next`, `.review-feedback-dismiss`, `.review-feedback-msg`, `.review-empty-actions` |
| D-261B (19 tests) | Desktop Study push, mobile `width:100%`, mobile separator (markdup/resolvesim), `border-top` calm styling, Study reset, behavior/label locks, public boundary |
