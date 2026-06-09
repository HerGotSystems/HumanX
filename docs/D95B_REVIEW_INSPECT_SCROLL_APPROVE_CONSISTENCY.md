# D-95B — Review Inspect Panel Scroll + Approve Visual Consistency

**Date:** 2026-06-09  
**Scope:** Frontend-only — `public/app-v10.js`. No Worker, no D1, no Wrangler, no schema change.  
**Static baseline:** 267 / 24 / 39 → **272 / 24 / 39**  
**Policy basis:** D-95A Review queue moderation workflow audit

---

## What Changed

### 1. `inspectReviewItem` — scroll panel into view after opening

```js
// BEFORE:
function inspectReviewItem(id){
  const item=(reviewQueue.review||[]).find(i=>i.id===id)||null;
  inspectedReviewItem=(inspectedReviewItem&&inspectedReviewItem.id===id)?null:item;
  renderReviewList()
}

// AFTER:
function inspectReviewItem(id){
  const item=(reviewQueue.review||[]).find(i=>i.id===id)||null;
  inspectedReviewItem=(inspectedReviewItem&&inspectedReviewItem.id===id)?null:item;
  renderReviewList();
  if(inspectedReviewItem)
    document.querySelector('.review-inspect-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
}
```

**Why:** The inspect panel renders at the top of the `#reviewList` grid (above all cards). When a reviewer clicks Inspect on a card that is scrolled below the fold, the panel is inserted above the current scroll position and is not visible. `scrollIntoView` brings it into view.

**Guard:** `if(inspectedReviewItem)` — the scroll only fires when the panel is being *opened*, not when clicking Inspect again to *close* it (toggle-close sets `inspectedReviewItem = null` first).

**Safety:** Display-only change. No API call, no decision behavior change, no state mutation beyond what was already there.

---

### 2. Top-actions Approve button — add `review-inspect-approve` class

```js
// BEFORE (in topActionsHtml):
<button class="btn-approve" onclick="reviewDecisionUI(...)">Approve</button>

// AFTER:
<button class="btn-approve review-inspect-approve" onclick="reviewDecisionUI(...)">Approve</button>
```

**Why:** The inspect panel contains two Approve buttons:
- Top-actions row (before fields): was only `btn-approve` — bold font weight, no color
- Bottom-actions row (after fields): already `btn-approve review-inspect-approve` — green gradient

Adding `review-inspect-approve` to the top button makes both visually identical — green, weighted, clearly primary. The action (`reviewDecisionUI`) is unchanged.

**Effect on moderator:** The top Approve is now clearly recognizable as the same action as the bottom Approve. No ambiguity about which button is the "real" one.

---

## What Did NOT Change

- No approve/reject/keep/duplicate logic changed
- No confirmation dialogs added or removed
- No API calls changed
- No Review filtering logic changed
- No Truth archive/cleanup logic touched
- No backend, Worker, schema, or D1 change
- No new decision paths

---

## Hardening Tests Added (Section 39 — 5 tests, 267 → 272)

| # | Test |
|---|---|
| 39.1 | `inspectReviewItem` calls `renderReviewList` |
| 39.2 | `inspectReviewItem` scrolls `.review-inspect-panel` into view after render |
| 39.3 | `scrollIntoView` is guarded — only fires when panel is opening, not closing |
| 39.4 | Top-actions Approve has `review-inspect-approve` class |
| 39.5 | `inspectReviewItem` contains no API/backend/D1/wrangler references |

---

## Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **272 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |

---

## Confirmation

No moderation decision behavior was changed. No backend, D1, Wrangler, schema, or live mutations were performed.
