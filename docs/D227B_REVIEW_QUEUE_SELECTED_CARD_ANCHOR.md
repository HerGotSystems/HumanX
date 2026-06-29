# D-227B — Review Queue Selected-Card Anchor

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — live PASS (D-227C)
**Baseline:** 2308 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D227B_REVIEW_QUEUE_SELECTED_CARD_ANCHOR.md`, `docs/README.md`
**App UI changes:** Yes — `reviewCard` and `inspectReviewItem`
**CSS changes:** Yes — `.review-card-selected`
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes

---

## Purpose

Address friction point F-1 and F-4 from the D-227A audit: when a moderator clicks Inspect on a card, the inspect panel appears at the top of the grid while the selected card remains mid-page with no strong visual or spatial connection. After a decision, the queue re-renders and the viewport lands at the panel (top), far from where the moderator was working.

This task adds:
1. A `data-review-selected="true"` attribute on the inspected card so it can be queried by any scroll helper.
2. A `scrollSelectedReviewCardIntoView()` helper that scrolls the card into view via `requestAnimationFrame` after the inspect panel opens.
3. A stronger visual highlight on `.review-card-selected` so the card remains findable below the panel.

---

## What changed

### `public/app-v10.js`

**`reviewCard(item)`** — added `data-review-selected="true"` attribute to the article element when the card is the currently inspected item:

```js
// before
<article data-review-id="${esc(id)}" class="card review-card ...">

// after
<article data-review-id="${esc(id)}"${isSelected?' data-review-selected="true"':''} class="card review-card ...">
```

The attribute is conditional — only present when `isSelected` is true. Non-selected cards do not carry it.

**`scrollSelectedReviewCardIntoView()`** — new helper function added immediately before `inspectReviewItem`:

```js
function scrollSelectedReviewCardIntoView(){
  document.querySelector('[data-review-selected="true"]')
    ?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
```

- Uses optional chaining — absent card is a no-op (no errors).
- `block:'nearest'` minimises viewport jump; the panel scroll (`block:'start'`) still controls the primary jump.
- Exposed on `window` for testability.

**`inspectReviewItem(id)`** — updated to schedule the card scroll via `requestAnimationFrame` after the panel scroll:

```js
// before
if(inspectedReviewItem) document.querySelector('.review-inspect-panel')?.scrollIntoView({behavior:'smooth',block:'start'});

// after
if(inspectedReviewItem){
  document.querySelector('.review-inspect-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
  requestAnimationFrame(scrollSelectedReviewCardIntoView);
}
```

The RAF fires after the browser paints the new DOM, so the card element exists when the query runs. The panel scroll and card scroll are sequential; in practice the browser coalesces them.

### `public/styles.css`

Enhanced `.review-card-selected` with a stronger ring and background:

```css
/* before */
.review-card-selected{border-color:var(--blue)!important;box-shadow:0 0 0 1px #57b8ff33}

/* after */
.review-card-selected{border-color:var(--blue)!important;box-shadow:0 0 0 2px #57b8ff55;background:linear-gradient(180deg,rgba(87,184,255,.08),rgba(16,19,29,.86))}
```

The ring goes from 1px/33-opacity to 2px/55-opacity. A subtle blue gradient background is added so the card reads as distinctly selected even at a glance in a dense queue. Both changes are within the existing theme variables and readable on mobile.

---

## Moderation semantics — unchanged

- Approve / Keep Pending / Reject decision logic: **unchanged**
- Two-step confirm flow: **unchanged**
- Keyboard shortcuts (A/R/K/[]/Esc): **unchanged**
- Filter / sort: **unchanged**
- Inspect panel structure: **unchanged**
- Queue loading / API calls: **unchanged**

---

## No backend/API/migration/schema/CSP/external asset changes

Confirmed. This change is frontend HTML attribute + CSS only.

---

## New tests (D-227B — 18 explicit)

1. `reviewCard` emits `data-review-selected="true"` when inspected
2. `data-review-selected` is conditional on `isSelected` only
3. `scrollSelectedReviewCardIntoView` function exists
4. It queries `[data-review-selected="true"]`
5. It uses optional chaining (null-safe if card absent)
6. It uses `block:'nearest'`
7. `inspectReviewItem` calls `requestAnimationFrame(scrollSelectedReviewCardIntoView)`
8. RAF scroll is guarded — only fires when `inspectedReviewItem` is truthy
9. `inspectReviewItem` still scrolls inspect panel into view (D-95B regression)
10. `scrollSelectedReviewCardIntoView` exposed on `window`
11. `styles.css` selected card has 2px ring (`#57b8ff55`)
12. `styles.css` selected card has background accent (`rgba(87,184,255,.08)`)
13. `requestApproveReview` still present (no action name change)
14. `requestRejectReview` still present
15. `reviewDecisionUI` still present
16. `/api/review/decision` route unchanged
17. `renderPublicProfileHtml` does not reference `data-review-selected` or `review-card-selected`
18. Deploy integrity — D-227B tag absent from `worker.js`

---

## Live sanity checklist — D-227C PASS (2026-06-29)

Owner deploy completed from terminal. All 20 live sanity items confirmed PASS.

- [x] Deploy via `wrangler deploy` from owner terminal — PASS
- [x] Open Review tab with admin token — PASS
- [x] Queue loads without console-breaking errors — PASS
- [x] Clicking Inspect opens the existing inspect panel as before — PASS
- [x] The inspected card receives visible selected styling — PASS
- [x] The inspected card has `data-review-selected="true"` in DOM — PASS
- [x] Non-selected cards do not have `data-review-selected="true"` — PASS
- [x] Inspecting another card moves selected styling/attribute to the new card — PASS
- [x] `scrollSelectedReviewCardIntoView()` runs without errors — PASS
- [x] If selected card exists, page scrolls enough to keep/find the selected card — PASS
- [x] If selected card is absent, no error is thrown — PASS
- [x] Approve behavior unchanged — PASS
- [x] Keep behavior unchanged — PASS
- [x] Reject behavior unchanged — PASS
- [x] Two-step confirm behavior unchanged — PASS
- [x] Filters/sort behavior unchanged — PASS
- [x] Keyboard shortcuts remain unchanged — PASS
- [x] Public profile pages do not contain review selected-card markers — PASS
- [x] No backend/API behavior changed — PASS
- [x] No forbidden public/privacy boundary issue appears — PASS

**Hardening smoke (post-deploy):** 2308 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug`)

---

## Confirmations

- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantics change:** Confirmed
- **Deploy needed:** Yes — owner deploy + browser sanity before marking live PASS
