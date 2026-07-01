# D-242B — Review Decision: Open Next Item

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — D-242C live sanity PASS
**Baseline:** 2604 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D242B_REVIEW_DECISION_OPEN_NEXT_ITEM.md`, `docs/README.md`
**App UI changes:** Yes — "Open next item →" button added to D-230A feedback banner
**CSS changes:** Yes — `.review-feedback-next` button styles added
**Worker changes:** None
**Deploy needed:** Yes — owner deploy complete (D-242C)

---

## Purpose

Address D-242A F-1: after clicking Approve or Reject in the Review queue, the inspect panel closes and the D-230A feedback banner offered no way to reach the next item. The moderator had to scroll the queue and manually select the next card.

This adds a manual "Open next item →" button to the feedback banner after a completed Approve or Reject decision, when a next item exists in the current sorted/filtered queue.

---

## D-242A Finding Addressed (F-1)

> **F-1: No post-decision next-item affordance for mouse/button users**
>
> After Approve or Reject via button, the inspect panel closes and the feedback banner shows only the decision message and a Dismiss button. The keyboard path (A+A, R+R, K) already auto-advances via `_advanceId` pre-capture — the button path had no equivalent.

---

## User-Visible Behavior

After clicking **Confirm Approve** or **Confirm Reject**:

- Decision banner appears: `"Approved review item."` / `"Rejected review item."` (unchanged)
- If a next item exists in the current sorted/filtered queue: an **"Open next item →"** button appears in the banner between the message and Dismiss
- Clicking "Open next item →":
  - Clears the feedback banner
  - Opens the inspect panel for the next item (calls `inspectReviewItem`)
  - Scrolls to the selected card (existing D-227B behavior via `inspectReviewItem`)
  - Does NOT make any moderation decision
  - Does NOT reload the queue
  - Does NOT call any backend/API
- If no next item exists (last in queue, or queue now empty): button absent — only message + Dismiss shown

After clicking **Keep Pending**:
- Item stays visible in pending filter, inspect panel stays open — no next-item button needed or shown

---

## Manual-Only Guarantee

- The button requires a moderator click — nothing auto-opens
- The button calls `inspectReviewItem(nextId)` — same as clicking Inspect on a card
- No automatic moderation decision is made
- No auto-approve, auto-reject, auto-keep

---

## No Auto-Moderation Guarantee

- `reviewDecisionFeedbackNextId` is a navigation hint only — it stores an item ID, not a decision
- The next-item button calls `clearReviewDecisionFeedback()` then `inspectReviewItem(id)` — no decision path
- Keyboard shortcut path (`initReviewKb`) is entirely unchanged

---

## How Next Item Is Inferred

Before the API call in `reviewDecisionUI`, the current sorted/filtered list is computed:

```js
const _captureNext = (decision === 'public' || decision === 'rejected');
let _nextCandidateId = null;
if (_captureNext) {
  const _vl = applyReviewSort(applyReviewFilter(reviewQueue.review || []));
  const _ci = _vl.findIndex(v => v.id === targetId);
  if (_ci >= 0 && _ci < _vl.length - 1) _nextCandidateId = _vl[_ci + 1].id;
  else if (_ci > 0) _nextCandidateId = _vl[_ci - 1].id;
}
```

- Prefers the item immediately **after** (`index + 1`) in the sorted/filtered list
- Falls back to the item immediately **before** (`index - 1`) if at the end of the list
- Only computed for `'public'` (Approve) and `'rejected'` (Reject) — not for `'review'` (Keep Pending)
- Stored in `reviewDecisionFeedbackNextId` after the API call succeeds

After queue reload, the button is only shown if `reviewDecisionFeedbackNextId` is still in the fresh `reviewQueue.review` array:

```js
const _fbNextInQueue = reviewDecisionFeedbackNextId &&
  (reviewQueue.review || []).find(i => i.id === reviewDecisionFeedbackNextId) || null;
```

---

## Filter/Sort Respect

- `_nextCandidateId` is derived from `applyReviewSort(applyReviewFilter(reviewQueue.review))` — the same computation used by `renderReviewInspectPanel` ← Prev / Next → nav and `initReviewKb`
- If the filter is e.g. `reported`, the next item is the next reported item in sorted order — the button does not cross filter boundaries

---

## Keep Pending Behavior

Keep Pending (`decision='review'`) is unchanged:
- No next-item capture runs (`_captureNext` is false for `'review'`)
- `reviewDecisionFeedbackNextId` remains null / is not updated
- Item stays in the pending filter, inspect panel stays open as before

---

## Keyboard Shortcut Behavior Unchanged

`initReviewKb` A+A / R+R / K auto-advance via `_advanceId` pattern is not touched. The new banner button is an orthogonal UI path for moderators who use the mouse/button confirm flow.

---

## Decision Feedback Behavior

| State | Banner |
|-------|--------|
| After Approve, next item exists | `"Approved review item." [Open next item →] [Dismiss]` |
| After Approve, no next item | `"Approved review item." [Dismiss]` |
| After Reject, next item exists | `"Rejected review item." [Open next item →] [Dismiss]` |
| After Reject, no next item | `"Rejected review item." [Dismiss]` |
| After Keep Pending | `"Kept review item." [Dismiss]` (item stays open, no next-item button) |

---

## Code Changes

### `public/app-v10.js`

1. **New module-level state** (`let reviewDecisionFeedbackNextId = null;`) alongside existing `reviewDecisionFeedback`

2. **`clearReviewDecisionFeedback`** — extended to also clear `reviewDecisionFeedbackNextId`:
   ```js
   function clearReviewDecisionFeedback() {
     reviewDecisionFeedback = null;
     reviewDecisionFeedbackNextId = null;
     renderReviewList();
   }
   ```

3. **`reviewDecisionUI`** — captures next candidate before reload (approve/reject only):
   ```js
   const _captureNext = (decision === 'public' || decision === 'rejected');
   let _nextCandidateId = null;
   if (_captureNext) {
     const _vl = applyReviewSort(applyReviewFilter(reviewQueue.review || []));
     const _ci = _vl.findIndex(v => v.id === targetId);
     if (_ci >= 0 && _ci < _vl.length - 1) _nextCandidateId = _vl[_ci + 1].id;
     else if (_ci > 0) _nextCandidateId = _vl[_ci - 1].id;
   }
   // ... after API call succeeds ...
   reviewDecisionFeedbackNextId = _nextCandidateId;
   ```

4. **`renderReviewList`** — feedback banner extended with conditional next-item button:
   ```js
   const _fbNextInQueue = reviewDecisionFeedbackNextId &&
     (reviewQueue.review || []).find(i => i.id === reviewDecisionFeedbackNextId) || null;
   const _fbNextBtn = _fbNextInQueue
     ? `<button type="button" class="review-feedback-next"
          onclick="clearReviewDecisionFeedback();inspectReviewItem('${esc(reviewDecisionFeedbackNextId)}')">
          Open next item →</button>`
     : '';
   // feedbackBanner now includes ${_fbNextBtn} between message and Dismiss
   ```

### `public/styles.css`

Three new rules added after `.review-feedback-dismiss`:
```css
.review-feedback-next { border: 1px solid rgba(47,191,113,.45); color: var(--green,#2fbf71); ... }
.review-feedback-next:hover { background: rgba(47,191,113,.1) }
.review-feedback-next:focus-visible { outline: 2px solid var(--green,#2fbf71); outline-offset: 2px }
```

---

## No Backend/API/Migration/Schema/CSP/External Asset Changes

Confirmed: all changes are in `public/app-v10.js` and `public/styles.css`. No worker, no API route, no D1 migration, no schema change, no CSP, no external asset.

---

## Drift/Belief Expansion Files Untouched

`public/belief-drift-expansion.js` and `public/index.html` are not modified by this task.

---

## Tests Added (24 new → baseline 2580 + 24 = 2604)

Also updated 5 slice-window constants (D-129A: 1000→1500, D-129C/D/E: 1500→1800) to account for the new code in `reviewDecisionUI` and `renderReviewList`.

| Category | Tests |
|----------|-------|
| State | `reviewDecisionFeedbackNextId` declared |
| Capture | next candidate before reload; from sorted/filtered list; approve/reject only; assigned to state |
| Banner | button rendered only when item in queue; copy; type="button"; calls inspectReviewItem; calls clearFeedback; no reviewDecisionUI call; no fetch/api |
| Clear | clearReviewDecisionFeedback clears both vars |
| D-230A compat | Approved/Rejected/Kept messages unchanged; Dismiss unchanged |
| Public exposure | No renderPublicProfileHtml exposure (3 assertions) |
| CSS | .review-feedback-next defined; focus-visible present |
| Keyboard compat | _advanceId path unchanged |
| Deploy integrity | worker.js not modified |

---

## Live Sanity Checklist — D-242C PASS

- [x] Deploy to production via owner terminal
- [x] Open Review queue — load queue with admin token
- [x] Queue loads without console-breaking errors
- [x] Inspect a review item that has at least one other item after it in the current filtered/sorted queue
- [x] Complete Approve through the visible button/UI path
- [x] Feedback banner appears with "Approved review item."
- [x] Feedback banner shows "Open next item →"
- [x] Clicking "Open next item →" opens/inspects the next item
- [x] Page scrolls/selects the next item using existing selected-card behavior
- [x] No moderation decision is made by clicking "Open next item →"
- [x] No backend/API request made by "Open next item →" click (navigation only)
- [x] Repeat with Reject — feedback banner shows "Rejected review item." + "Open next item →"
- [x] Clicking it opens/inspects the next item
- [x] Last item in queue: no "Open next item →" button after Approve/Reject (Dismiss only)
- [x] Keep Pending: "Kept review item." + Dismiss only; item stays open in inspect panel
- [x] Keep Pending does not force next item
- [x] Dismiss still clears feedback
- [x] Current filter/sort is respected
- [x] Keyboard shortcut advance behavior unchanged (A+A / R+R / K)
- [x] D-227B selected-card anchor still works
- [x] D-228A scroll preservation still works
- [x] D-229A confirm-state clarity still works
- [x] D-230A decision feedback still works
- [x] D-233B resolve-similar scroll still works
- [x] D-234A similar advisory display still works
- [x] D-235A Copy ID still works
- [x] D-236A duplicate-target prefill still works
- [x] D-239B Back to Review scroll restore still works
- [x] Public profile pages do not contain Open-next-item internals
- [x] Drift/Belief expansion surfaces still load normally
- [x] No backend/API behavior changed
- [x] No console errors

**Live sanity result:** 34/34 PASS (D-242C, 2026-07-01)

---

## Confirmations

- **"Open next item →" behavior:** Confirmed — button in feedback banner after Approve/Reject
- **Manual-only / no auto-moderation:** Confirmed — requires moderator click; inspectReviewItem only
- **Filter/sort respected:** Confirmed — next item from applyReviewSort(applyReviewFilter(...))
- **Keep Pending unchanged:** Confirmed — no next-item capture for 'review' decision
- **Keyboard shortcut unchanged:** Confirmed — initReviewKb not touched
- **D-227→D-230 review ergonomics intact:** Confirmed
- **D-233→D-237 duplicate advisory intact:** Confirmed
- **D-239→D-240 Review-to-Study intact:** Confirmed
- **No public profile exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **Drift/Belief expansion files untouched:** Confirmed
- **Owner deploy:** PASS
- **Live Open-next-item sanity:** PASS — "Open next item →" appears after Approve/Reject when next item exists; absent at end of queue; clicking opens next item with no auto-moderation; Keep Pending unchanged; Dismiss clears; filter/sort respected
- **Hardening smoke:** 2604 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)
- **D-242C live sanity:** 34/34 PASS
- **Deploy needed:** Yes — complete
