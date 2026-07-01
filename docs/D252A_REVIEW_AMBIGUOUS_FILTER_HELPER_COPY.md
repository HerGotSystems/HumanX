# D-252A — Review Ambiguous Filter Helper Copy

**Scope:** Frontend (app-v10.js, styles.css) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-252B live sanity PASS 2026-07-01)
**Baseline:** 2778 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D252A_REVIEW_AMBIGUOUS_FILTER_HELPER_COPY.md`, `docs/README.md`
**App UI changes:** Yes — filter helper note for ~Quality, Dupes, ~Similar
**CSS changes:** Yes — `.review-filter-helper` rule added
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

Three Review filters have ambiguous or non-obvious semantics:

- **~Quality** — silently excludes truths, evidence, and pressure items (claim-only). Moderators may not realise items are filtered by type.
- **Dupes** — conflates confirmed duplicates (`duplicate_of`) and near-duplicate advisories (`near_duplicate_of`). The distinction is meaningful for moderation.
- **~Similar** — is a subset of Dupes (near-duplicate advisory only) and may confuse moderators expecting all duplicates.

This slice adds a calm, one-line helper note near the active summary for each ambiguous filter, so moderators understand what they are looking at without changing any filter behavior.

---

## D-250A Findings Addressed

| Finding | Severity | This slice |
|---------|----------|------------|
| F-3 — `~Quality` filter silently excludes truths/evidence/pressure (claim-only) | MEDIUM | Addressed — helper copy explains this |
| F-4 — `Dupes` conflates confirmed duplicate and near-duplicate advisory; `~Similar` is a subset | MEDIUM | Addressed — helper copy explains both |

F-1 (no search) is not addressed in this slice — that remains next lane.

---

## Exact Helper Copy

| Filter | Helper text |
|--------|-------------|
| `~Quality` | `~Quality shows claim items with quality hints.` |
| `Dupes` | `Dupes includes confirmed duplicates and near-duplicate advisories.` |
| `~Similar` | `~Similar shows near-duplicate advisory items.` |
| All other filters | *(no helper — empty string)* |

---

## Where Helper Appears

Rendered by `renderReviewFilterHelper()` called in `renderReviewList`:

```
[filter bar]
[overview strip]
[audit summary]
[active summary]   Showing: ~Quality · 3 items · Sorted: ~Quality first
[filter helper]    ~Quality shows claim items with quality hints.
[feedback banner]  (if present)
[inspect panel]    (if present)
[cards / empty state]
```

Helper appears between the D-250B active summary and the feedbackBanner in the `innerHTML` concat: `bar+overview+audit+summary+helper+feedbackBanner+panel+(list.map(reviewCard).join('')||empty)`.

Helper is visible when zero-results empty state is shown (rendered before the empty state placeholder).

---

## Implementation

### `public/app-v10.js` — new `renderReviewFilterHelper()` function

Added immediately before `renderReviewEmptyState`:

```js
function renderReviewFilterHelper(){
  const f = reviewStateFilter || 'review';
  const copy = {
    quality: '~Quality shows claim items with quality hints.',
    duplicate: 'Dupes includes confirmed duplicates and near-duplicate advisories.',
    similar: '~Similar shows near-duplicate advisory items.'
  };
  const msg = copy[f];
  if (!msg) return '';
  return `<div class="review-filter-helper" style="grid-column:1/-1">${esc(msg)}</div>`;
}
```

**`renderReviewList` changes:**
- Added: `const helper=renderReviewFilterHelper();`
- Changed: `audit+summary+feedbackBanner+panel+` → `audit+summary+helper+feedbackBanner+panel+`

### `public/styles.css`

Added after `.review-active-summary{...}`:
```css
.review-filter-helper{font-size:11px;color:var(--muted);padding:0 0 4px;opacity:.8}
```

---

## What Is Unchanged

| Behavior | Status |
|----------|--------|
| `applyReviewFilter` logic | **Unchanged** |
| `applyReviewSort` logic | **Unchanged** |
| `setReviewFilter` / `setReviewSort` | **Unchanged** |
| `reviewStateFilter` / `reviewSortOrder` state | **Unchanged** |
| Filter chip labels | **Unchanged** |
| D-250B active summary (`renderReviewActiveSummary`) | **Unchanged — still rendered** |
| D-251A zero-results state (`renderReviewEmptyState`) | **Unchanged — still rendered** |
| `reviewEmptyText` per-filter copy | **Unchanged** |
| No search added | **Confirmed** |
| Filter predicates (`duplicate_of`, `near_duplicate_of`, `needs sharpening`) | **Unchanged** |
| Duplicate/advisory semantics (D-237A) | **Unchanged** |
| Next-item behavior (D-242B/D-243A) | **Unchanged** |
| Moderation actions (Approve/Keep/Reject) | **Unchanged** |
| Confirm-state flow (D-229A) | **Unchanged** |
| Decision feedback banner (D-230A) | **Unchanged** |
| Review card metadata (D-245B/D-246A/D-247A) | **Unchanged** |
| Review-to-Study navigation (D-239/D-240) | **Unchanged** |
| Public profile render path | **No filter helper internals exposed** |
| Drift/Belief expansion files | **Untouched** |
| `public/index.html` | **Untouched** |
| `src/worker.js` | **Untouched** |
| `public/belief-drift-expansion.js` | **Untouched** |

---

## Risk Boundaries

- No filter behavior change
- No sort behavior change
- No moderation semantics change
- No duplicate/advisory semantics change
- No next-item behavior change
- No public profile exposure
- No Drift/Belief expansion changes
- No backend/API route changes
- No migration/schema/CSP/external asset changes
- No localStorage or persistent preference
- D-181C compliance: no inline `onclick` in helper output

---

## Tests Added (20 new → baseline 2758 + 20 = **2778**)

| Test | Category |
|------|----------|
| `renderReviewFilterHelper` function defined | Hook |
| Helper returns non-empty for `quality` filter | Filter coverage |
| Quality copy says "claim items with quality hints" | Copy |
| Helper returns non-empty for `duplicate` filter | Filter coverage |
| Duplicate copy mentions "confirmed duplicates and near-duplicate advisories" | Copy |
| Helper returns non-empty for `similar` filter | Filter coverage |
| Similar copy says "near-duplicate advisory items" | Copy |
| Helper returns empty string for all/default filter | Conditional |
| Helper uses `.review-filter-helper` CSS class | CSS |
| `renderReviewList` calls `renderReviewFilterHelper()` | Wiring |
| `renderReviewList` wires helper after summary (`summary+helper+`) | Wiring |
| D-250B active summary still called in `renderReviewList` | D-250B compat |
| D-251A zero-results state still called in `renderReviewList` | D-251A compat |
| `applyReviewFilter` quality predicate still excludes non-claim types | Filter unchanged |
| `applyReviewSort` function still defined | Sort unchanged |
| CSS defines `.review-filter-helper` | CSS |
| `renderPublicProfileHtml` does not reference `review-filter-helper` | Public boundary |
| `belief-drift-expansion.js` not modified | Drift integrity |
| `worker.js` not modified | Deploy integrity |
| `index.html` not modified | Deploy integrity |

**D-93B allowlist updated:** `2778 passed, 0 failed` added.

**Hardening smoke:** 2778 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist — D-252B PASS (2026-07-01, owner deploy)

- [x] Review queue loads without JS errors
- [x] With ~Quality filter active and items: helper shows `~Quality shows claim items with quality hints.`
- [x] With Dupes filter active and items: helper shows `Dupes includes confirmed duplicates and near-duplicate advisories.`
- [x] With ~Similar filter active and items: helper shows `~Similar shows near-duplicate advisory items.`
- [x] With Pending (default) filter: no helper note visible
- [x] With All filter: no helper note visible
- [x] With Public filter: no helper note visible
- [x] Helper appears below active summary and above cards
- [x] Helper text is calm — smaller/muted, not alarming
- [x] Helper visible when zero-results empty state is shown for ~Quality
- [x] Helper visible when zero-results empty state is shown for Dupes
- [x] Helper visible when zero-results empty state is shown for ~Similar
- [x] D-250B active summary (`Showing: X · N items · Sorted: Y`) still visible for all filters
- [x] D-251A zero-results empty state ("No review items match this view.") still works
- [x] `Show all review items` button still works in zero-results state
- [x] Moderation actions (Approve/Keep/Reject) unaffected
- [x] Confirm-state (D-229A) unaffected
- [x] Decision feedback banner (D-230A) unaffected
- [x] D-245B inline date still in meta line
- [x] D-246A score labels still in meta line
- [x] D-247A advisory hints row still renders
- [x] Review-to-Study navigation (D-239/D-240) unaffected
- [x] No console errors

**34/34 PASS** — owner live sanity complete 2026-07-01
