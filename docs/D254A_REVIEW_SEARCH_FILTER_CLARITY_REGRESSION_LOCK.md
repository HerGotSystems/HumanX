# D-254A — Review Search/Filter Clarity Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 2877 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D254A_REVIEW_SEARCH_FILTER_CLARITY_REGRESSION_LOCK.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

The D-250→D-253 arc delivered four Review queue clarity improvements:

| Task | Feature |
|------|---------|
| D-250B | Active filter/sort summary (`Showing: {filter} · {count} · Sorted: {sort}`) |
| D-251A | Zero-results clarity (structured title, context line, Show-all button) |
| D-252A | Ambiguous filter helper copy (~Quality / Dupes / ~Similar) |
| D-253A | Client-side search (field-matched, search-aware next-item and nav) |

This task adds regression lock tests so future changes cannot silently break any of these four components or their integration.

---

## D-250→D-253 Arc Summary

| Task | What was added | Live since |
|------|---------------|-----------|
| D-250B | `renderReviewActiveSummary(list)` — summary line between audit and cards | D-250C live PASS |
| D-251A | `renderReviewEmptyState()` — structured empty state with title/context/Show-all | D-251B live PASS |
| D-252A | `renderReviewFilterHelper()` — one-line helper for ambiguous filters | D-252B live PASS |
| D-253A | `renderReviewSearchRow()`, `applyReviewSearch()`, `setReviewSearch()`, `clearReviewSearch` | D-253B live PASS |

All four are wired together in `renderReviewList`:

```
bar + searchRow + overview + audit + summary + helper + feedbackBanner + panel + (cards || empty)
```

---

## What Is Now Locked

### Active Filter/Sort Summary (D-250B)

- `renderReviewActiveSummary(list)` must remain defined and wired.
- Summary must include the active filter label, visible item count, and active sort label.
- Summary must include `Search: "query"` context when `reviewSearchQuery` is non-empty.
- Summary must omit search context when query is empty.
- Summary must use `.review-active-summary` CSS class.
- Summary must not alter filter/sort predicates.

### Zero-Results Clarity (D-251A)

- `renderReviewEmptyState()` must remain defined and wired.
- Title must remain exactly: `No review items match this view.`
- Context line must reference current filter and sort.
- Context line must include search context when search is active.
- `reviewEmptyText(f)` per-filter copy must remain embedded.
- "Show all review items" button must remain (when filter ≠ All).
- "Show all review items" must use `data-action="setReviewFilter" data-value="all"` (no inline onclick).
- "Show all review items" must not call `setReviewSort` — sort preserved.
- Zero-results internals must not appear in public profile render path.

### Ambiguous Filter Helper Copy (D-252A)

Exact copy is locked:

| Filter | Locked copy |
|--------|-------------|
| `~Quality` | `~Quality shows claim items with quality hints.` |
| `Dupes` | `Dupes includes confirmed duplicates and near-duplicate advisories.` |
| `~Similar` | `~Similar shows near-duplicate advisory items.` |
| All others | *(empty — no helper rendered)* |

- Helper must use `.review-filter-helper` CSS class.
- Helper must be wired after `summary` in `renderReviewList` (`summary+helper+`).
- Helper must not alter filter predicates.

### Client-Side Search (D-253A)

- `renderReviewSearchRow()` must remain defined and wired.
- Label must remain: `Search review queue`
- Placeholder must remain: `Search claim, ID, handle, source…`
- Input must use `type="search"`.
- `applyReviewSearch(list)` must remain defined.
- Search must short-circuit (return list unchanged) when `reviewSearchQuery` is empty.
- Search must be case-insensitive (`.toLowerCase()`).
- `setReviewSearch` must trim whitespace before storing.
- Fields searched must include: item ID, claim/statement/title, handle, category, type, duplicate_of, near_duplicate_of, user_id, origin, source_truth_id.
- No backend/API search route.
- No localStorage/persistence.
- No inline `oninput=` on search input.

### Combined Pipeline Order

```js
applyReviewSort(applyReviewSearch(applyReviewFilter(all)))
```

This order (filter → search → sort) is locked in `renderReviewList`.

### Clear Search Behavior

- `clearReviewSearch` must be registered in `_D181B_ZERO_PARAM_ACTIONS`.
- Clear search sets `reviewSearchQuery = ''` only.
- Clear search must not alter `reviewStateFilter`.
- Clear search must not alter `reviewSortOrder`.
- Clear button must use `data-action="clearReviewSearch"` (no inline onclick).
- Clear button must only render when `reviewSearchQuery` is non-empty.

### Show All Review Items Behavior

- Still uses `data-action="setReviewFilter" data-value="all"`.
- Does not clear search.
- Does not reset sort.
- `setReviewFilter` must not touch `reviewSearchQuery`.

### Search-Aware Navigation

- `reviewDecisionUI` next-item candidate uses `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))`.
- `renderReviewInspectPanel` prev/next uses the same search-aware pipeline.
- "Open next item →" button must remain present.
- Next-item capture must remain guarded to approve/reject decisions only.

---

## No Backend/API Search Guarantee

- No `/api/review/search` route in `worker.js`.
- No `reviewSearch` identifier in `worker.js`.
- Search is 100% client-side: filters already-loaded data in `reviewQueue.review`.

---

## No localStorage/Persistence Guarantee

- `reviewSearchQuery` is session-only state (JS `let`).
- No `localStorage.setItem` or `localStorage.getItem` in search functions.
- Search resets on page reload.

---

## No Filter/Sort Predicate Change Guarantee

- `applyReviewFilter` logic unchanged — quality predicate still excludes truth/evidence/pressure types.
- `applyReviewSort` still defined and unchanged.
- `setReviewFilter` / `setReviewSort` state behavior unchanged.

---

## Moderation Actions Unchanged

- Approve / Keep / Reject actions still present in inspect panel.
- Confirm-state flows unchanged.
- Decision feedback banner unchanged.

---

## Duplicate/Advisory Semantics Unchanged

- `near_duplicate_of` and `duplicate_of` field references preserved.
- Duplicate advisory display unchanged.
- `~Similar` advisory workflow unchanged.

---

## Public Exposure Guarantees

`renderPublicProfileHtml` must not reference:
- `reviewSearchQuery`
- `review-search`
- `clearReviewSearch`
- `review-filter-helper`
- `review-active-summary`

---

## Drift/Belief Files Untouched

- `public/belief-drift-expansion.js` must not contain `reviewSearchQuery` or `clearReviewSearch`.

---

## Worker Known Warning State

`/api/u/:slug` — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation). 1 warn is expected and non-blocking.

---

## Tests Added (64 new → baseline 2813 + 64 = **2877**)

| Group | Tests | Coverage |
|-------|-------|----------|
| D-250B active summary lock | 8 | Defined, classes, Showing: prefix, filter/count/sort labels, search conditional, wired |
| D-251A zero-results clarity lock | 8 | Defined, title exact, context line, reviewEmptyText, Show-all button, delegation, sort preserved, wired |
| D-252A helper copy lock | 7 | Defined, exact copy × 3, empty for non-ambiguous, CSS class, wired after summary |
| D-253A client-side search lock | 11 | Defined, label, placeholder, type=search, applyReviewSearch, short-circuit, case-insensitive, fields × 1, pipeline order, search row wired, no localStorage, no oninput |
| D-253A search UI behavior lock | 8 | Active summary search context, zero-results search context, clear button conditional, clear data-action, clearReviewSearch in zero-param actions, clear isolates to query, Show-all doesn't clear search |
| Search-aware navigation lock | 5 | reviewDecisionUI search-aware, inspectPanel search-aware, Open next item present, guard approve/reject, moderation buttons |
| Cross-arc compatibility lock | 6 | D-245B date, D-246A scores, D-247A hints, dup semantics, Review-to-Study, all four arc components in renderReviewList |
| Public/Drift/backend boundary lock | 7 | Public profile × 5, worker no search route, drift file clean |
| Deploy integrity | 3 | app-v10.js unchanged, worker.js unchanged, index.html unchanged |

**D-93B allowlist updated:** `2877 passed, 0 failed` added.

**Hardening smoke:** 2877 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Future Rule

Any Review search/filter UI change that touches `renderReviewActiveSummary`, `renderReviewEmptyState`, `renderReviewFilterHelper`, `renderReviewSearchRow`, `applyReviewSearch`, `setReviewSearch`, or `clearReviewSearch` must either:

1. Keep all D-254A lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-254B (or higher) task that documents what changed and why.

Silently breaking a lock test is not acceptable.
