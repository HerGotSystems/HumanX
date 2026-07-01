# D-255A — Review Search/Filter Clarity Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 2877 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D255A_REVIEW_SEARCH_FILTER_CLARITY_MILESTONE_CHECKPOINT.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

This checkpoint closes the D-250→D-254 Review search/filter clarity arc and updates `docs/PROJECT_STATE.md` as the authoritative project reference. The arc delivered four Review queue clarity improvements and locked them with a regression fence. This task records the stable state so future sessions have a complete picture of what exists, what is locked, and what is safe to do next.

---

## D-250→D-254 Arc Summary

| Task | Type | What it did |
|------|------|-------------|
| D-250A | Audit | Review search/filter clarity audit — 7 findings (F-1 HIGH no search; F-2 MEDIUM no active-filter context; F-3/F-4 MEDIUM Dupes/~Similar label conflation; F-5–F-7 LOW); 8 guard tests; docs only |
| D-250B/C | Feature + Live | `renderReviewActiveSummary(list)` — `Showing: {filter} · {n} item(s) · Sorted: {sort}` above cards; 13 tests; D-250C 29/29 live PASS |
| D-251A/B | Feature + Live | `renderReviewEmptyState()` — `"No review items match this view."` title, context line, per-filter copy, "Show all review items" button; 15 tests; D-251B 20/20 live PASS |
| D-252A/B | Feature + Live | `renderReviewFilterHelper()` — one-line helper for `~Quality`, `Dupes`, `~Similar` only; exact locked copy; 20 tests; D-252B live PASS |
| D-253A/B | Feature + Live | `reviewSearchQuery` state, `applyReviewSearch(list)`, `renderReviewSearchRow()`, `clearReviewSearch`, search-aware pipeline; 35 tests; D-253B 41/41 live PASS |
| D-254A | Regression lock | 9 categories / 64 tests across all four arc additions; public/Drift/backend boundaries locked |

**Total new tests in arc:** 8 + 13 + 15 + 20 + 35 + 64 = **155 tests** (2722 → 2877).
**Owner deploys:** 4 (D-250C, D-251B, D-252B, D-253B).
**Latest deployed Worker:** `46c50000-137f-4bba-9632-aa913798e494` (D-253B).

---

## Current Baseline

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2877 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**Known warn:** `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation).` Non-blocking.

---

## Deploy State

| Task | Deploy state |
|------|-------------|
| D-250A | No deploy needed (audit/tests/docs only) |
| D-250B | Owner deploy PASS — D-250C 29/29 live PASS |
| D-251A | Owner deploy PASS — D-251B 20/20 live PASS |
| D-252A | Owner deploy PASS — D-252B live PASS |
| D-253A | Owner deploy PASS — D-253B 41/41 live PASS — Worker `46c50000-137f-4bba-9632-aa913798e494` |
| D-254A | No deploy needed (tests/docs only) |
| D-255A | No deploy needed (docs only) |
| **Current deploy needed** | **No** |

---

## Active Summary Guarantees (D-250B, locked D-254A)

- `renderReviewActiveSummary(list)` is defined and wired in `renderReviewList`.
- Format when search is empty: `Showing: {filter} · {n} item(s) · Sorted: {sort}`
- Format when search is active: `Showing: {filter} · {n} item(s) · Search: "{query}" · Sorted: {sort}`
- Search context omitted when `reviewSearchQuery` is empty.
- Uses `.review-active-summary` CSS class with `grid-column:1/-1`.
- Does not alter filter or sort predicates.

---

## Zero-Results Clarity Guarantees (D-251A, locked D-254A)

- `renderReviewEmptyState()` is defined and wired in `renderReviewList`.
- Title: exactly `No review items match this view.`
- Context line includes current filter and sort always.
- Context line includes `Search: "{query}"` when search is active.
- `reviewEmptyText(f)` per-filter explanatory copy is preserved.
- "Show all review items" button present when filter ≠ All, uses `data-action="setReviewFilter" data-value="all"` (no inline onclick).
- "Clear search" button present when search is active, uses `data-action="clearReviewSearch"`.
- "Show all review items" does not reset sort.
- Zero-results internals do not appear in public profile render path.

---

## Ambiguous Filter Helper Guarantees (D-252A, locked D-254A)

Exact locked copy:

| Filter | Helper text |
|--------|------------|
| `~Quality` | `~Quality shows claim items with quality hints.` |
| `Dupes` | `Dupes includes confirmed duplicates and near-duplicate advisories.` |
| `~Similar` | `~Similar shows near-duplicate advisory items.` |
| All others | *(no helper rendered)* |

- Helper uses `.review-filter-helper` CSS class.
- Helper renders after active summary in `renderReviewList` (`summary+helper+`).
- Helper does not alter filter predicates.

---

## Client-Side Search Guarantees (D-253A, locked D-254A)

- `renderReviewSearchRow()` is defined and wired in `renderReviewList`.
- Label text: `Search review queue`
- Placeholder: `Search claim, ID, handle, source…`
- Input type: `type="search"`
- Input uses `data-review-search` attribute + `document.addEventListener('input', ...)` — no inline `oninput=`.
- `applyReviewSearch(list)` is defined.
- Short-circuits (returns list unchanged) when `reviewSearchQuery` is empty.
- Case-insensitive (`.toLowerCase()`), whitespace-trimmed (`setReviewSearch` trims input).
- Fields searched: item ID, claim/statement/title, handle, category, type, duplicate_of, near_duplicate_of, user_id, origin, source_truth_id.
- Pipeline order: `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))`.
- No backend/API search route.
- No localStorage/persistence — `reviewSearchQuery` is session-only.

---

## Clear Search Guarantees (D-253A, locked D-254A)

- `clearReviewSearch` is registered in `_D181B_ZERO_PARAM_ACTIONS`.
- Sets `reviewSearchQuery = ''` only — does not alter `reviewStateFilter` or `reviewSortOrder`.
- Clear button uses `data-action="clearReviewSearch"` (no inline onclick).
- Clear button renders only when `reviewSearchQuery` is non-empty.
- `setReviewFilter` does not touch `reviewSearchQuery`.

---

## Search-Aware Navigation Guarantees (D-253A, locked D-254A)

- `reviewDecisionUI` next-item candidate: `applyReviewSort(applyReviewSearch(applyReviewFilter(reviewQueue.review||[])))`.
- `renderReviewInspectPanel` prev/next: same search-aware pipeline.
- "Open next item →" button present.
- Next-item capture guarded to approve/reject decisions only (Keep Pending excluded).

---

## Public/Privacy Guarantees (locked D-254A)

`renderPublicProfileHtml` does not reference:
- `reviewSearchQuery`
- `review-search`
- `clearReviewSearch`
- `review-filter-helper`
- `review-active-summary`

Review search/filter controls remain internal/admin-only. No new public data fields introduced. D-216A allowlist unchanged. D-214A/D-215A/D-216A privacy locks remain active.

---

## Drift/Belief Files Untouched Guarantee

- D-250→D-254 did not modify `public/belief-drift-expansion.js`.
- D-250→D-254 did not modify `public/index.html`.
- `public/belief-drift-expansion.js` does not contain `reviewSearchQuery` or `clearReviewSearch`.

---

## No Backend/API Changes Guarantee

- No new routes in `worker.js`.
- No migration, schema, CSP, or external asset changes in the arc.
- No `/api/review/search` route.
- Search is entirely client-side against already-loaded `reviewQueue.review` data.

---

## Safe Next Lanes

These are suggestions only. Do not start any until explicitly assigned.

| Lane | Notes |
|------|-------|
| Review queue mobile controls/action wrapping polish | Filter bar and action buttons on narrow viewports |
| Review filter label rename/split audit | `Dupes` vs `~Similar` conflation (D-250A F-4); separate confirmed vs advisory labels |
| Study entry button style consistency | D-239A F-2–F-4: button prominence, browser-back support, style inconsistency |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, and framing between main app and Belief Engine |
| D-245A F-4 pressure handle duplication | Separate spec — pressure cards show handle in both chips and meta |

---

## Future Rule

Any Review search/filter UI change that touches `renderReviewActiveSummary`, `renderReviewEmptyState`, `renderReviewFilterHelper`, `renderReviewSearchRow`, `applyReviewSearch`, `setReviewSearch`, or `clearReviewSearch` must either:

1. Keep all D-254A lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-254B (or higher) task that documents what changed and why.

Do not silently break or remove a lock test.
