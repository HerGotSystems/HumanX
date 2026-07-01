# D-253A — Review Client-Side Search

**Scope:** Frontend (app-v10.js, styles.css) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-253B live sanity PASS 2026-07-01)
**Baseline:** 2813 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D253A_REVIEW_CLIENT_SIDE_SEARCH.md`, `docs/README.md`
**App UI changes:** Yes — search row with input, label, and clear button
**CSS changes:** Yes — `.review-search-row`, `.review-search`, `.review-search-label`, `.review-search-input`, `.review-search-clear`
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

D-250A Finding F-1 (HIGH): no Review search exists. Finding a specific claim by text, handle, source, or ID requires manual scrolling through the full queue.

This slice adds lightweight client-side search to the Review queue. No backend or API changes. No persistence.

---

## D-250A Finding Addressed

**F-1 (HIGH) — No search exists:**
> Moderators must scroll the full queue to find a specific item by text, handle, source, or ID.

Client-side search now filters the visible list in real time using existing loaded data.

---

## Search Input Label and Placeholder

| Element | Value |
|---------|-------|
| `<label>` text | `Search review queue` |
| `<input>` placeholder | `Search claim, ID, handle, source…` |
| Clear button label | `Clear search` |
| Input type | `type="search"` |

---

## Fields Searched

| Field | Notes |
|-------|-------|
| `i.id` | Review item / claim ID |
| `i.claim` / `i.statement` / `i.title` | Visible claim text |
| `i.handle` | Submitter handle |
| `i.category` | Category label |
| `i.target_type` / `i.targetType` / `i.type` | Item type (claim, truth, evidence, pressure) |
| `i.duplicate_of` / `i.duplicateOf` | Confirmed duplicate target ID |
| `i.near_duplicate_of` / `i.nearDuplicateOf` | Near-duplicate advisory ID |
| `i.user_id` | Submitter user ID |
| `i.origin` | Origin label where present |
| `i.source_truth_id` | Source truth ID where present |

All matching is case-insensitive and whitespace-trimmed. Only fields already loaded by the Review admin queue are searched — no hidden/private internals exposed.

---

## Filter + Search + Sort Order

```
all loaded items
  → applyReviewFilter(all)       current filter (Pending / Dupes / etc.)
  → applyReviewSearch(filtered)  search query (if non-empty)
  → applyReviewSort(searched)    current sort order
  → visible list → cards / empty state
```

Search applied after filter, before sort.

---

## Active Summary Search Copy

When search is active, `renderReviewActiveSummary` appends search context:

```
Showing: Pending · 3 items · Search: "ramiro" · Sorted: Newest first
```

When search is empty:

```
Showing: Pending · 7 items · Sorted: Newest first
```

---

## Zero-Results Search Copy

When the visible list is empty and search is active, `renderReviewEmptyState` shows:

```
No review items match this view.
Current view: Pending · Search: "ramiro" · Sorted: Newest first

[per-filter explanatory copy]

[ Clear search ]   [ Show all review items ]   ← buttons shown contextually
```

- "Clear search" button appears when `reviewSearchQuery` is non-empty.
- "Show all review items" button appears when filter is not already `all`.
- Both can appear simultaneously.
- Sort is not reset by either button.

---

## Clear Search Behavior

- Registered in `_D181B_ZERO_PARAM_ACTIONS` as `clearReviewSearch`.
- Sets `reviewSearchQuery = ''` and re-renders.
- Does not change `reviewStateFilter`.
- Does not change `reviewSortOrder`.
- Button rendered only when `reviewSearchQuery` is non-empty.

---

## Show All Review Items Behavior (Unchanged)

- Still resets filter to `all` via `data-action="setReviewFilter" data-value="all"`.
- Does not reset sort.
- Does not reset search.
- Behavior from D-251A is fully preserved.

---

## Next-Item Behavior

The next-item candidate (captured in `reviewDecisionUI` for the "Open next item →" button) and the inspect panel prev/next navigation (in `renderReviewInspectPanel`) both use:

```js
applyReviewSort(applyReviewSearch(applyReviewFilter(reviewQueue.review||[])))
```

This means "Open next item →" follows the same searched+filtered+sorted visible list as the card grid. If a moderator has searched for "ramiro", the next item will also be within the "ramiro" search results.

---

## Event Handling — No Inline Handlers

| Handler | Pattern |
|---------|---------|
| Search input | `data-review-search` attribute + `document.addEventListener('input', ...)` |
| Clear search | `data-action="clearReviewSearch"` in `_D181B_ZERO_PARAM_ACTIONS` click delegation |
| Search clear button | `type="button"` |

No `oninput=`, `onclick=`, or other inline event attributes on search elements.

---

## What Is Unchanged

| Behavior | Status |
|----------|--------|
| `applyReviewFilter` logic | **Unchanged** |
| `applyReviewSort` logic | **Unchanged** |
| `setReviewFilter` / `setReviewSort` | **Unchanged** |
| `reviewStateFilter` / `reviewSortOrder` state | **Unchanged** |
| Filter chip labels | **Unchanged** |
| D-250B active summary (`renderReviewActiveSummary`) | **Extended — still rendered, now includes search context** |
| D-251A zero-results state (`renderReviewEmptyState`) | **Extended — still rendered, now includes search context** |
| D-252A filter helper (`renderReviewFilterHelper`) | **Unchanged — still rendered** |
| `reviewEmptyText` per-filter copy | **Unchanged** |
| Moderation actions (Approve/Keep/Reject) | **Unchanged** |
| Confirm-state flow (D-229A) | **Unchanged** |
| Decision feedback banner (D-230A) | **Unchanged** |
| Review card metadata (D-245B/D-246A/D-247A) | **Unchanged** |
| Duplicate/advisory semantics (D-237A) | **Unchanged** |
| Review-to-Study navigation (D-239/D-240) | **Unchanged** |
| Public profile render path | **No search internals exposed** |
| Drift/Belief expansion files | **Untouched** |
| `public/index.html` | **Untouched** |
| `src/worker.js` | **Untouched** |
| `public/belief-drift-expansion.js` | **Untouched** |
| Backend / API / migration / schema / CSP / external assets | **No changes** |
| localStorage / persistence | **None — search is session-only, not saved** |

---

## Risk Boundaries

- No filter behavior change
- No sort behavior change
- No moderation semantics change
- No duplicate/advisory semantics change
- No public profile exposure
- No Drift/Belief expansion changes
- No backend/API route changes
- No migration/schema/CSP/external asset changes
- No localStorage or persistent preference
- D-181C compliance: no inline onclick/oninput in search elements

---

## Tests Added (35 new → baseline 2778 + 35 = **2813**)

| Test | Category |
|------|----------|
| `renderReviewSearchRow` function defined | Hook |
| Search input uses `type="search"` | Accessibility |
| Search input has accessible `<label>` | Accessibility |
| Label says "Search review queue" | Copy |
| Placeholder present | Copy |
| Input uses `data-review-search` (no oninput) | Event handling |
| `reviewSearchQuery` defined and defaults `''` | State |
| `applyReviewSearch` function defined | Hook |
| `applyReviewSearch` short-circuits when empty | Behavior |
| `applyReviewSearch` is case-insensitive | Behavior |
| `setReviewSearch` trims whitespace | Behavior |
| `applyReviewSearch` matches claim text | Fields |
| `applyReviewSearch` matches item ID | Fields |
| `applyReviewSearch` matches handle | Fields |
| `renderReviewList` applies search after filter before sort | Wiring |
| `renderReviewList` renders search row | Wiring |
| `renderReviewList` wires searchRow into innerHTML | Wiring |
| Active summary includes search context when query active | D-250B compat |
| Active summary omits search context when query empty | D-250B compat |
| Zero-results context includes search when active | D-251A compat |
| Clear button renders only when search active | Conditional |
| Clear button uses `data-action="clearReviewSearch"` | Event handling |
| Clear button has `type="button"` | Accessibility |
| `clearReviewSearch` in `_D181B_ZERO_PARAM_ACTIONS` | Event handling |
| Clear does not change `reviewStateFilter` | Isolation |
| Clear does not change `reviewSortOrder` | Isolation |
| Show-all-review-items button unchanged | D-251A compat |
| Show-all does not reset sort | D-251A compat |
| D-252A filter helper still called in `renderReviewList` | D-252A compat |
| `applyReviewFilter` quality predicate unchanged | Filter unchanged |
| `applyReviewSort` still defined | Sort unchanged |
| `renderPublicProfileHtml` does not reference `reviewSearchQuery` | Public boundary |
| No inline onclick for search functions | D-181C compliance |
| `worker.js` not modified | Deploy integrity |
| `belief-drift-expansion.js` not modified | Drift integrity |

**D-93B allowlist updated:** `2813 passed, 0 failed` added.

**Hardening smoke:** 2813 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist — D-253B PASS (2026-07-01, owner deploy)

- [x] Review queue loads without JS errors
- [x] Search row visible: label "Search review queue" + input
- [x] Input has placeholder "Search claim, ID, handle, source…"
- [x] Type a claim text fragment → matching cards filter in real time
- [x] Type an item/claim ID fragment → matching cards filter
- [x] Type a handle → matching cards filter
- [x] Type a category/type string → matching cards filter
- [x] Search is case-insensitive (e.g. "CLAIM" matches "claim")
- [x] Active summary shows `· Search: "query"` when search is active
- [x] Active summary omits search context when search is cleared/empty
- [x] Zero-results empty state shows search context in context line
- [x] Zero-results shows "Clear search" button when search active
- [x] Zero-results shows "Show all review items" button when filter is not All
- [x] Clicking "Clear search" clears search; filter and sort unchanged
- [x] Clicking "Show all review items" resets filter to All; search and sort unchanged
- [x] D-250B active summary still visible for all filters
- [x] D-251A zero-results state still works (with and without search)
- [x] D-252A filter helpers still appear for ~Quality / Dupes / ~Similar
- [x] "Open next item →" follows same searched+sorted list as cards
- [x] Inspect panel Prev/Next navigate within searched list
- [x] Moderation actions (Approve/Keep/Reject) unaffected
- [x] Confirm-state (D-229A) unaffected
- [x] Decision feedback banner (D-230A) unaffected
- [x] D-245B inline date still in meta line
- [x] D-246A score labels still in meta line
- [x] D-247A advisory hints row still renders
- [x] Review-to-Study navigation (D-239/D-240) unaffected
- [x] No backend/API calls made during search (client-side only)
- [x] Search not persisted after page reload (session-only)
- [x] No console errors

**41/41 PASS** — owner live sanity complete 2026-07-01
