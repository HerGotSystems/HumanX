# D-251A — Review Zero-Results Filter Clarity

**Scope:** Frontend (app-v10.js, styles.css) + tests + docs
**Status:** COMPLETE — owner deploy pending (D-251B)
**Baseline:** 2758 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D251A_REVIEW_ZERO_RESULTS_FILTER_CLARITY.md`, `docs/README.md`
**App UI changes:** Yes — enhanced zero-results empty state with title, context line, and "Show all review items" button
**CSS changes:** Yes — `.review-empty-title`, `.review-empty-context`, `.review-empty-actions`, `.review-empty-show-all` rules added
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

When a Review queue filter shows zero cards, the existing empty state provides per-filter explanatory copy but gives the moderator no quick escape. If the moderator doesn't remember what filter they're on (especially after scrolling), there's no clear "why is my queue empty?" signal and no one-click path to the full queue.

This slice adds a calm, structured empty state with:
1. A clear title confirming nothing matches the current view
2. A context line naming the active filter and sort
3. The existing per-filter explanatory copy (preserved)
4. A "Show all review items" button for a quick escape (absent when already on All)

The D-250B active summary line remains visible above the empty state for additional context.

---

## D-250A Finding Addressed

**F-2 (MEDIUM) — No active filter/sort context near the card list** (partial — zero-results sub-case):
> When the queue shows 0 items, the moderator sees only the per-filter text with no summary of what they're looking at and no easy way to get back to the full queue.

This complements D-250B (active summary line) for the zero-results case specifically.

---

## Relationship to D-250B

D-250B added the `Showing: {filter} · {count} · Sorted: {sort}` summary line above cards. When count is 0, that line already says `Showing: ~Quality · 0 items · Sorted: ~Quality first`, which is helpful. D-251A adds structured copy inside the empty state panel itself so moderators get:

```
[active summary]  Showing: ~Quality · 0 items · Sorted: ~Quality first
[empty panel]     No review items match this view.
                  Current view: ~Quality · Sorted: ~Quality first
                  No claims with quality hints in this view.   ← existing per-filter copy
                  [ Show all review items ]
```

---

## Exact Change

### `public/app-v10.js` — new `renderReviewEmptyState()` function

Added immediately before `renderReviewList`. Replaces the inline template literal `empty` variable:

```js
function renderReviewEmptyState(){
  const filterLabels = { review:'Pending', public:'Public', rejected:'Rejected',
    reported:'Reported', similar:'~Similar', quality:'~Quality',
    pressure:'Pressure', duplicate:'Dupes', 'demo-test':'Demo/Test',
    'truth-derived':'Truth-Derived', all:'All review items' };
  const sortLabels = { newest:'Newest first', oldest:'Oldest first',
    reported:'Reported first', similar:'~Similar first', quality:'~Quality first' };
  const f = reviewStateFilter || 'review';
  const fl = filterLabels[f] || 'Pending';
  const sl = sortLabels[reviewSortOrder||'newest'] || 'Newest first';
  const isFiltered = f !== 'all';
  const ctxLine = `<p class="review-empty-context small">Current view: ${esc(fl)} · Sorted: ${esc(sl)}</p>`;
  const actionBtn = isFiltered
    ? `<div class="review-empty-actions">
         <button type="button" class="review-empty-show-all"
           data-action="setReviewFilter" data-value="all">Show all review items</button>
       </div>`
    : '';
  return `<div class="panel review-empty-state" style="grid-column:1/-1">
    <p class="review-empty-title">No review items match this view.</p>
    ${ctxLine}
    ${reviewEmptyText(f)}
    ${actionBtn}
  </div>`;
}
```

**`renderReviewList` change:** `const empty=renderReviewEmptyState();` replaces the previous inline template.

**Button wiring:** Uses `data-action="setReviewFilter" data-value="all"` — goes through the existing `_D181C_PARAM_ACTIONS` event delegation. This complies with the D-181C pattern (no raw `onclick="setReviewFilter("` in templates).

### `public/styles.css`

New rules added after `.review-empty-state{...}`:
```css
.review-empty-title{font-size:13px;font-weight:600;color:var(--text);margin:0 0 4px}
.review-empty-context{color:var(--muted);margin:0 0 6px}
.review-empty-actions{margin-top:10px}
.review-empty-show-all{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer}
.review-empty-show-all:hover{color:var(--text);border-color:var(--text)}
```

---

## Rendered Empty State

### Zero-results on a filtered view (e.g. `~Quality`)

```
No review items match this view.
Current view: ~Quality · Sorted: ~Quality first

No claims with quality hints in this view.
Claims with vague, slogan-like, or unfalsifiable wording appear here.
Hints are advisory — approve, keep, or reject as normal.

[ Show all review items ]
```

### Zero-results on All filter (queue genuinely empty)

```
No review items match this view.
Current view: All review items · Sorted: Newest first

No Review items found.

(no button — already on All)
```

### Button behavior

| Behavior | Detail |
|----------|--------|
| Action | Calls `setReviewFilter('all')` via `data-action` delegation |
| Sort | Unchanged — sort order is not reset |
| Only when | `reviewStateFilter !== 'all'` |
| Absent when | Already on All filter (no-op would be confusing) |

---

## What Is Unchanged

| Behavior | Status |
|----------|--------|
| `applyReviewFilter` logic | **Unchanged** |
| `applyReviewSort` logic | **Unchanged** |
| `reviewEmptyText` per-filter copy | **Preserved** — wrapped inside new structure |
| `setReviewFilter` / `setReviewSort` | **Unchanged** |
| `reviewStateFilter` / `reviewSortOrder` state | **Unchanged** |
| D-250B active summary (`renderReviewActiveSummary`) | **Unchanged — still rendered** |
| "Open next item →" behavior (D-242B/D-243A) | **Unchanged** |
| Moderation actions (Approve/Keep/Reject) | **Unchanged** |
| Confirm-state flow (D-229A) | **Unchanged** |
| Decision feedback banner (D-230A) | **Unchanged** |
| Review card metadata (D-245B/D-246A/D-247A) | **Unchanged** |
| Duplicate/advisory semantics (D-237A) | **Unchanged** |
| Review-to-Study navigation (D-239/D-240) | **Unchanged** |
| Public profile render path | **No empty-state internals exposed** |
| No search added | **Confirmed** |

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
- D-181C compliance: button uses `data-action` not inline `onclick="setReviewFilter("`

---

## Tests Added (15 new → baseline 2743 + 15 = **2758**)

| Test | Category |
|------|----------|
| `renderReviewEmptyState` function defined | Hook |
| Empty state title copy: `No review items match this view.` | Copy |
| Empty state mentions `Show all review items` | Copy |
| Empty state uses `review-empty-title` CSS class | CSS |
| `Show all review items` button has `type="button"` | Accessibility |
| Button uses `data-action="setReviewFilter" data-value="all"` | Wiring / D-181C |
| Button does not reference `setReviewSort` | Sort unchanged |
| Context line references `reviewStateFilter` | Context |
| Context line references `reviewSortOrder` | Context |
| Button absent when filter is already `all` | Conditional |
| `renderReviewList` uses `renderReviewEmptyState()` | Wiring |
| D-250B active summary still called in `renderReviewList` | D-250B compat |
| CSS defines `.review-empty-title` | CSS |
| `renderPublicProfileHtml` does not reference `review-empty-title` | Public boundary |
| `worker.js` not modified | Deploy integrity |

**D-93B allowlist updated:** `2758 passed, 0 failed` added.

**Hardening smoke:** 2758 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist — D-251B (pending owner deploy)

- [ ] Review queue loads without JS errors
- [ ] With Pending filter and items: normal card list renders (no empty state)
- [ ] With a filter that has zero results: `No review items match this view.` title visible
- [ ] Context line shows correct filter name and sort label
- [ ] Existing per-filter copy still appears below context line
- [ ] `Show all review items` button visible when on a filtered view with zero results
- [ ] `Show all review items` button absent when on `All` filter with zero items
- [ ] Clicking `Show all review items` switches to All filter without changing sort
- [ ] D-250B active summary still shows `Showing: {filter} · 0 items · Sorted: {sort}` above empty state
- [ ] Empty state is calm — not error-red, not alarming
- [ ] Moderation actions (Approve/Keep/Reject) unaffected on non-empty queues
- [ ] Confirm-state (D-229A) unaffected
- [ ] Decision feedback banner (D-230A) unaffected
- [ ] D-245B inline date still in meta line
- [ ] D-246A score labels still in meta line
- [ ] D-247A advisory hints row still renders
- [ ] Review-to-Study navigation (D-239/D-240) unaffected
- [ ] No console errors
