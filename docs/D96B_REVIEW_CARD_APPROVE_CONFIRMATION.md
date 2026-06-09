# D-96B — Card-Row Review Approve Two-Step Confirmation

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 272 / 24 / 39 → **286 / 24 / 39**
**Policy basis:** D-96A review decision safety audit

---

## What Changed

### 1. New state variable

```js
let pendingApproveReviewId = null;
```
Declared alongside `pendingRejectReviewId` and `pendingCleanupReviewId`. Tracks which card is in the pending-approve confirmation state.

---

### 2. Two new functions

```js
function requestApproveReview(id) {
  pendingApproveReviewId = (pendingApproveReviewId === id) ? null : id;
  renderReviewList();
}
function cancelApproveReview() {
  pendingApproveReviewId = null;
  renderReviewList();
}
```

Mirrors the existing `requestRejectReview` / `cancelRejectReview` pattern exactly. No API calls. No backend interaction. Display-only state toggle.

---

### 3. Card-row Approve button — 2-step confirmation

**Before:** card-row Approve called `reviewDecisionUI(type, id, 'public')` immediately on click — one click, no confirmation.

**After:** `approveBtn` variable is constructed conditionally in `reviewCard`:

- **Normal state** (`pendingApproveReviewId !== id`):
  `<button class="btn-approve" onclick="requestApproveReview('${id}')">Approve</button>`

- **Pending state** (`pendingApproveReviewId === id`):
  ```html
  <span class="review-approve-confirm-msg">Approve this item? It will become public.</span>
  <button class="btn-approve-confirm" onclick="reviewDecisionUI(type, id, 'public')">Confirm Approve</button>
  <button class="btn-approve-cancel" onclick="cancelApproveReview()">Cancel</button>
  ```

The template uses `${approveBtn}` in the card action row.

---

### 4. `reviewDecisionUI` — state reset

`pendingApproveReviewId = null` added alongside the existing `pendingRejectReviewId = null` on successful decision. Ensures pending state is always cleared after any decision action, including Confirm Approve, Reject, or Keep Pending.

---

### 5. Window exposure

`window.requestApproveReview` and `window.cancelApproveReview` added to the global exposure block (alongside existing `requestRejectReview`/`cancelRejectReview`) so inline `onclick` attributes can reach them.

---

### 6. CSS additions (`styles.css`)

```css
/* Approve confirmation state */
.review-approve-confirm-msg { font-size:11px; font-weight:600; color:#2fbf71; display:flex; align-items:center; flex:1 1 100%; padding:2px 0 }
.btn-approve-confirm         { background:linear-gradient(135deg,#0a5c2e,#0d3d1f); border:1px solid #2fbf7188!important; color:#7fffb8; font-weight:700 }
.btn-approve-confirm:hover   { background:linear-gradient(135deg,#0d7a3d,#0a5c2e) }
.btn-approve-cancel          { background:#0b0e16; border:1px solid var(--line); color:var(--muted) }
```

Visually parallel to `.review-reject-confirm-msg` / `.btn-reject-confirm` / `.btn-reject-cancel` — green instead of red.

---

## Why Only Card-Row Approve Was Guarded

The D-96A audit identified three `reviewDecisionUI(...,'public')` call sites:

| Call site | Guarded? | Reason |
|---|---|---|
| Card-row Approve | ✅ Now 2-step | Shortcut path — reviewer has NOT necessarily read advisory fields; adjacent to Inspect button; accidental click risk is real |
| Inspect panel — top-actions Approve | ❌ Unchanged (still 1-click) | Reviewer chose to open the panel; deliberate action |
| Inspect panel — bottom-actions Approve | ❌ Unchanged (still 1-click) | Reviewer has scrolled past all advisory fields (Origin Path, Review Advisory, Borderline Hint) before reaching this button |

The inspect panel is the deliberate review path. Adding a second confirmation after the reviewer has already opened the panel and read the context would be friction without safety benefit.

---

## Why the 2-Step Pattern (Not `confirm()`)

`archiveTruthArtefact` (D-92G) uses a native `confirm()` dialog. However:

- Native `confirm()` is blocking (pauses the browser event loop) and visually inconsistent with the rest of the UI
- The `requestRejectReview` / `cancelRejectReview` inline pending pattern is already established, understood by reviewers, and tested

Using the same inline pattern for Approve gives the reviewer a visible label ("Approve this item? It will become public.") and two buttons in the card row, matching the exact Reject UX they already know.

---

## Safety Confirmation

| Safety check | Status |
|---|---|
| No API changes | ✅ `reviewDecisionUI` POST to `/api/review/decision` is unchanged |
| No backend changes | ✅ No Worker, no route, no handler change |
| No D1 / schema change | ✅ confirmed |
| No moderation action performed | ✅ confirmed |
| Reject 2-step flow intact | ✅ `requestRejectReview` / `cancelRejectReview` / `pendingRejectReviewId` unchanged |
| Inspect-panel Approve unchanged | ✅ Both top-actions and bottom-actions Approve still call `reviewDecisionUI` directly |

---

## Hardening Tests Added (Section 40 — 14 new tests, 272 → 286)

| # | Test |
|---|---|
| 40.1 | `pendingApproveReviewId` state variable declared |
| 40.2 | `requestApproveReview` function defined |
| 40.3 | `cancelApproveReview` function defined |
| 40.4 | Card-row Approve calls `requestApproveReview`, not `reviewDecisionUI` directly |
| 40.5 | Old direct `btn-approve` calling `reviewDecisionUI` is gone from card-row |
| 40.6 | Confirm Approve button calls `reviewDecisionUI` with `'public'` |
| 40.7 | Approve pending copy includes "will become public" |
| 40.8 | `reviewDecisionUI` clears `pendingApproveReviewId` on success |
| 40.9 | Inspect panel top-actions Approve still calls `reviewDecisionUI` directly |
| 40.10 | Inspect panel bottom-actions Approve still calls `reviewDecisionUI` directly |
| 40.11 | Reject 2-step flow remains present |
| 40.12 | `window.requestApproveReview` and `window.cancelApproveReview` exposed |
| 40.13 | CSS approve-confirm classes defined in `styles.css` |
| 40.14 | `requestApproveReview`/`cancelApproveReview` contain no backend references |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 272 passed, 0 failed | **286 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |
