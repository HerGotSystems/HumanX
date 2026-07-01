# D-250B — Review Active Filter/Sort Summary

**Scope:** Frontend (app-v10.js, styles.css) + tests + docs
**Status:** COMPLETE — owner deploy pending (D-250C)
**Baseline:** 2743 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D250B_REVIEW_ACTIVE_FILTER_SORT_SUMMARY.md`, `docs/README.md`
**App UI changes:** Yes — active filter/sort summary line added above cards
**CSS changes:** Yes — `.review-active-summary` rule added
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

Address D-250A finding F-2: the review queue shows no persistent context near the card list explaining what the moderator is currently seeing, in what order, and how many items match. The filter chip and sort select at the top of the page scroll out of view in a long queue, leaving the moderator without orientation — especially when "Open next item →" (D-242B) silently follows the current filter+sort.

---

## D-250A Finding Addressed

**F-2 (MEDIUM) — No active filter/sort context near the card list:**
> When a moderator is on `~Quality` filter sorted by `~Quality first`, nothing above the card list says what they're looking at. The "Open next item →" button follows the current filter+sort silently.

---

## Exact Change

### `public/app-v10.js` — new `renderReviewActiveSummary(list)` function

Added immediately before `renderReviewList`:

```js
function renderReviewActiveSummary(list){
  const filterLabels = {
    review:'Pending', public:'Public', rejected:'Rejected',
    reported:'Reported', similar:'~Similar', quality:'~Quality',
    pressure:'Pressure', duplicate:'Dupes', 'demo-test':'Demo/Test',
    'truth-derived':'Truth-Derived', all:'All review items'
  };
  const sortLabels = {
    newest:'Newest first', oldest:'Oldest first',
    reported:'Reported first', similar:'~Similar first', quality:'~Quality first'
  };
  const fl = filterLabels[reviewStateFilter||'review'] || 'Pending';
  const sl = sortLabels[reviewSortOrder||'newest'] || 'Newest first';
  const n = list.length;
  const items = n === 1 ? '1 item' : `${n} items`;
  return `<div class="review-active-summary" style="grid-column:1/-1">
    Showing: ${esc(fl)} · ${esc(items)} · Sorted: ${esc(sl)}
  </div>`;
}
```

**`renderReviewList` changes (two lines):**
1. Added `const summary=renderReviewActiveSummary(list);` after `const audit=renderReviewAuditSummary(all);`
2. Changed innerHTML concat from `bar+overview+audit+feedbackBanner+panel+…` to `bar+overview+audit+summary+feedbackBanner+panel+…`

### `public/styles.css`

New rule added after `.review-audit-archived-note`:
```css
.review-active-summary{font-size:11px;color:var(--muted);padding:4px 0 3px;letter-spacing:.01em}
```

Small, muted — visually quieter than cards and confirm states.

---

## Rendered Output

The summary line appears between the audit bar and the feedback banner/first card.

| Active state | Summary line rendered |
|-------------|----------------------|
| Pending filter, Newest first sort, 12 items | `Showing: Pending · 12 items · Sorted: Newest first` |
| ~Quality filter, ~Quality first sort, 3 items | `Showing: ~Quality · 3 items · Sorted: ~Quality first` |
| ~Similar filter, ~Similar first sort, 1 item | `Showing: ~Similar · 1 item · Sorted: ~Similar first` |
| All filter, Oldest first sort, 47 items | `Showing: All review items · 47 items · Sorted: Oldest first` |
| Pending filter, any sort, 0 items (empty state) | `Showing: Pending · 0 items · Sorted: Newest first` |

**Label mapping:** Filter labels match the chip copy visible in the filter bar. Sort labels match the `<select>` option copy.

**Singular/plural:** `1 item` vs `N items` handled explicitly.

**Zero results:** Summary still renders when the filtered list is empty — `0 items` — and appears above the empty-state card.

---

## Position in Page Layout

```
[.review-filter-bar]        ← filter chips + sort select
[.review-overview-strip]    ← total count pills (pending/public/rejected/type)
[.review-audit-bar]         ← collapsible audit summary
[.review-active-summary]    ← NEW: Showing: {filter} · {count} · Sorted: {sort}
[.review-decision-feedback] ← feedback banner after decision (conditional)
[.review-inspect-panel]     ← inspect panel (conditional)
[review card × N]           ← card list
```

---

## What Is Unchanged

| Behavior | Status |
|----------|--------|
| `applyReviewFilter` logic | **Unchanged** |
| `applyReviewSort` logic | **Unchanged** |
| Filter chip labels/order | **Unchanged** |
| Sort select options/order | **Unchanged** |
| `reviewStateFilter` state variable | **Unchanged** |
| `reviewSortOrder` state variable | **Unchanged** |
| `setReviewFilter` / `setReviewSort` | **Unchanged** |
| "Open next item →" behavior (D-242B) | **Unchanged** — still follows current filter+sort |
| Next-item capture (`applyReviewSort(applyReviewFilter(...))`) | **Unchanged** |
| Keyboard advance (`initReviewKb`) | **Unchanged** |
| Moderation actions (Approve/Keep/Reject) | **Unchanged** |
| Confirm-state flow (D-229A) | **Unchanged** |
| Decision feedback banner (D-230A) | **Unchanged** |
| Review card metadata (D-245B/D-246A/D-247A) | **Unchanged** |
| Duplicate/advisory semantics (D-237A) | **Unchanged** |
| Review-to-Study navigation (D-239/D-240) | **Unchanged** |
| Empty-state text | **Unchanged** |
| Filter help text | **Unchanged** |
| Public profile render path | **No review summary exposed** |
| No search added | **Confirmed** |

---

## Risk Boundaries

- No filter behavior change
- No sort behavior change
- No moderation semantics change
- No duplicate/advisory semantics change
- No next-item behavior change (D-242B/D-243A locks still pass)
- No public profile exposure
- No Drift/Belief expansion changes (`public/belief-drift-expansion.js`, `public/index.html` untouched)
- No backend/API route changes
- No migration/schema/CSP/external asset changes
- No localStorage or persistent preference

---

## Tests Added (13 new → baseline 2730 + 13 = **2743**)

| Test | Category |
|------|----------|
| `renderReviewActiveSummary` function defined | Summary hook |
| Summary references `reviewStateFilter` | Filter state |
| Summary references `reviewSortOrder` | Sort state |
| Summary uses `list.length` for visible item count | Count |
| Summary handles singular `"1 item"` | Copy |
| Summary emits `review-active-summary` CSS class | CSS |
| Filter label map includes `Pending` for `review` key | Label accuracy |
| `renderReviewList` calls `renderReviewActiveSummary(list)` | Wiring |
| `audit+summary+feedbackBanner` order in innerHTML concat | Position |
| CSS defines `.review-active-summary` | CSS |
| `applyReviewFilter` behavior unchanged (D-250A compat) | Behavior lock |
| `renderPublicProfileHtml` does not reference `review-active-summary` | Public boundary |
| `worker.js` not modified | Deploy integrity |

**D-93B allowlist updated:** `2730 passed, 0 failed` and `2743 passed, 0 failed` added.

**Hardening smoke:** 2743 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist — D-250C (pending owner deploy)

- [ ] Review queue loads without JS errors
- [ ] Summary line visible above cards: `Showing: Pending · N items · Sorted: Newest first` on default load
- [ ] Changing filter chip updates summary filter label and item count
- [ ] Changing sort select updates summary sort label
- [ ] Summary renders `0 items` when filter matches nothing
- [ ] Summary renders `1 item` (singular) when filter matches exactly one item
- [ ] Summary styled muted — visually calmer than cards and confirm states
- [ ] Summary does not render on public profile page
- [ ] "Open next item →" button continues to follow current filter+sort
- [ ] Moderation actions (Approve/Keep/Reject) unaffected
- [ ] Confirm-state (D-229A) unaffected
- [ ] Decision feedback banner (D-230A) unaffected
- [ ] D-245B inline date still in meta line
- [ ] D-246A score labels still in meta line
- [ ] D-247A advisory hints row still renders below meta line
- [ ] Review-to-Study navigation (D-239/D-240) unaffected
- [ ] Mobile layout: summary wraps cleanly on narrow screens
- [ ] No console errors
