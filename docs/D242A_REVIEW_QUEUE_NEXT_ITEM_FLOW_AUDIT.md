# D-242A — Review Queue Next-Item Flow Audit

**Scope:** Audit + small guard tests + docs
**Status:** COMPLETE
**Baseline:** 2580 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D242A_REVIEW_QUEUE_NEXT_ITEM_FLOW_AUDIT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Deploy needed:** No

---

## Purpose

Audit the moderator experience after completing a Review decision (Approve / Keep Pending / Reject). Identify post-decision navigation friction, document how the existing keyboard shortcut path differs from the button path, and recommend the smallest safe next code slice.

---

## 1. Current Post-Decision Behavior

### Code path: `reviewDecisionUI` (app-v10.js ~line 435)

```
reviewDecisionUI(targetType, targetId, decision)
  1. _anchorId = inspectedReviewItem?.id || targetId   ← captured BEFORE reload
  2. POST /api/review/decision
  3. Clear pendingApproveReviewId / pendingRejectReviewId
  4. toast(msgs[decision])
  5. reviewDecisionFeedback = _fbMsgs[decision]         ← sets banner text only
  6. loadReviewQueue()                                   ← full server reload
  7. renderReviewList()
     └─ if inspectedReviewItem not in filtered list → inspectedReviewItem = null
  8. scrollToReviewAnchor(_anchorId)                    ← scrolls to decided item
```

### What happens for each decision under default filter (`review` / Pending)

| Step | Approve (→ public) | Keep Pending (→ review) | Reject (→ rejected) |
|------|-------------------|------------------------|---------------------|
| Item in new queue? | Yes (state=public) | Yes (state=review) | Yes (state=rejected) |
| Item visible in pending filter? | **No** (moved to public) | **Yes** | **No** (moved to rejected) |
| `inspectedReviewItem` after render? | **null** (cleared by `renderReviewList`) | **retained** | **null** (cleared) |
| Inspect panel after decision? | **Closed** | **Stays open** | **Closed** |
| `scrollToReviewAnchor(_anchorId)` | Falls back to first `.review-card` | Scrolls to kept item | Falls back to first `.review-card` |
| Feedback banner | "Approved review item." + Dismiss | "Kept review item." + Dismiss | "Rejected review item." + Dismiss |
| Next-item auto-selected? | **No** | N/A (same item) | **No** |
| Filter/sort preserved? | **Yes** | Yes | **Yes** |

### Keep Pending is a special case

Keep Pending (`decision='review'`) does not remove the item from the pending filter — the item stays at `review_state='review'`. So `inspectedReviewItem` is retained and the inspect panel re-renders. The moderator stays exactly where they were. This is correct behavior.

### Approve and Reject leave the moderator at a dead end

After Approve or Reject, under the default `review` filter:
- Inspect panel closes (item left the filter)
- Feedback banner appears with no navigation affordance
- `scrollToReviewAnchor(_anchorId)` fires but falls back to the first `.review-card` in the list (no element with the decided item's `data-review-id` remains in the DOM, since it's filtered out)
- Moderator must manually select the next item to inspect

---

## 2. Keyboard Shortcut Path (Auto-Advance — Already Implemented)

The keyboard handler (`initReviewKb`, ~line 385) **does auto-advance** after A+A, R+R, and K. This is a hidden capability not surfaced in the button UI.

### Keyboard auto-advance logic

```js
const vl = applyReviewSort(applyReviewFilter(reviewQueue.review || []));
const _i = vl.findIndex(v => v.id === id);
const _next = _i < vl.length - 1 ? vl[_i + 1] : null;
const _prev = _i > 0 ? vl[_i - 1] : null;
// ...
const _advanceId = (_next?.id || _prev?.id || null);  // prefers next, falls back to prev
reviewDecisionUI(type, id, 'public')
  .then(() => { if (_advanceId) inspectReviewItem(_advanceId); })
  .catch(() => {})
  .finally(() => { _reviewKbInFlight = false; });
```

Key properties:
- `_advanceId` is computed from the current sorted/filtered list **before** the API call
- Prefers the item at `index + 1` (next); falls back to `index - 1` (prev) if at end of list
- After `reviewDecisionUI` resolves (queue reloaded), calls `inspectReviewItem(_advanceId)` if the item still exists
- `_reviewKbInFlight` guard prevents duplicate keyboard decisions during in-flight API call

### Inspect panel ← Prev / Next → nav (Already Implemented)

`renderReviewInspectPanel` already computes `_prev`/`_next` from the sorted/filtered list and renders `← Prev` / `Next →` nav buttons. The moderator can navigate without making a decision. These buttons use `inspectReviewItem` and are visible in the inspect panel header.

### Summary of auto-advance coverage

| Path | Auto-advance after decision? | Mechanism |
|------|--------------------------|-----------|
| Keyboard A+A | **Yes** — next or prev | `_advanceId` pre-captured; `inspectReviewItem` in `.then()` |
| Keyboard R+R | **Yes** — next or prev | Same |
| Keyboard K | **Yes** — next or prev | Same |
| Mouse Confirm Approve button | **No** | `reviewDecisionUI` does not call `inspectReviewItem` |
| Mouse Confirm Reject button | **No** | Same |
| Mouse Keep Pending button | N/A — item stays visible | Item stays in filter |
| Inspect panel ← Prev / Next → | **Navigation only** (no decision) | `inspectReviewItem` directly |

---

## 3. UX Friction Findings

### F-1: No post-decision next-item affordance for mouse/button users (High)

After approving or rejecting via button, the inspect panel closes and the feedback banner only offers a Dismiss button. The moderator must scroll the queue and click Inspect on the next card manually. The keyboard path already solves this — the gap is in the button UI.

**Code evidence:** `reviewDecisionUI` (line 435) does not call `inspectReviewItem` anywhere in its success path. The keyboard handler in `initReviewKb` does so in a `.then()` callback.

### F-2: `scrollToReviewAnchor` falls back to first card after Approve/Reject (Low)

After a decision that removes the item from the filter, `scrollToReviewAnchor(_anchorId)` is called with the old item's ID. Since the item is no longer in the DOM (filter removed it), the function falls through to the first `.review-card`. This is not harmful but does not guide the moderator toward the next actionable item.

**Code evidence:** `scrollToReviewAnchor(id)` queries `.review-inspect-panel` first, then `[data-review-id="${id}"]` (the decided item — gone from DOM after filter), then `.review-card` (first in list). The fallback scroll is incidental, not intentional.

### F-3: Feedback banner is informational only — no action (Medium)

The D-230A feedback banner renders: `"Approved review item." [Dismiss]`. It has role="status" and aria-live, but no navigation action to help the moderator reach the next item.

**Code evidence:** `renderReviewList()` (line 409): `const feedbackBanner = reviewDecisionFeedback ? ... <button onclick="clearReviewDecisionFeedback()">Dismiss</button> : ''`

### F-4: Next-item computation already available in two places — not reused for button path (Observation)

The `_advanceId` pattern in `initReviewKb` and the `_prev`/`_next` in `renderReviewInspectPanel` both use the same `applyReviewSort(applyReviewFilter(reviewQueue.review||[]))` computation. A "Open next item" action could reuse `inspectReviewItem` as the entry point.

### F-5: Keyboard auto-advance is not documented in the UI (Low)

The keyboard hint shows `A arm · A again confirm · R arm · R again reject · K keep · [ ] prev/next · Esc close` but does not hint that A+A / R+R advance automatically after the decision. This is not a regression risk but is discoverable friction.

---

## 4. Risk Boundaries

These guarantees must hold for any future next-item implementation:

- No moderation semantics change — no auto-approve, auto-reject, auto-keep
- No backend/API route changes — `/api/review/decision` payload unchanged
- No queue reload changes
- No public profile exposure
- No duplicate/advisory semantics change
- No browser-history changes
- Filter/sort must be respected when computing next item
- Next-item action must be optional/manual — not automatic

---

## 5. Recommended Next Code Slice

### D-242B: "Open next item" button in feedback banner (Recommended first slice)

Add an optional "Open next item →" button to the existing D-230A feedback banner when a next item is available after a decision.

**Approach:**
1. In `reviewDecisionUI`, before calling `loadReviewQueue()`, capture `_nextItemId` from the current sorted/filtered list (same logic as `initReviewKb`):
   ```js
   const _vl = applyReviewSort(applyReviewFilter(reviewQueue.review || []));
   const _ci = _vl.findIndex(v => v.id === targetId);
   const _nextItem = _ci < _vl.length - 1 ? _vl[_ci + 1] : (_ci > 0 ? _vl[_ci - 1] : null);
   const _nextItemId = _nextItem?.id || null;
   ```
2. After reload, store `_nextItemId` alongside `reviewDecisionFeedback` (e.g. `reviewDecisionFeedbackNextId = _nextItemId`).
3. In `renderReviewList`, if both feedback and `reviewDecisionFeedbackNextId` are set AND the next item is still in the new queue, render a second button: `<button onclick="clearReviewDecisionFeedback(); inspectReviewItem('${id}')">Open next item →</button>`
4. `clearReviewDecisionFeedback` already clears `reviewDecisionFeedback`; extend it to clear `reviewDecisionFeedbackNextId` as well.

**Properties:**
- Manual/optional — moderator clicks the button, not auto-advance
- Respects current filter/sort (computed from `applyReviewSort(applyReviewFilter(...))`)
- Uses existing `inspectReviewItem` helper — no new scroll/render logic
- Disappears if Dismiss is clicked
- Disappears if the next item is no longer in the post-reload queue
- Does not change any moderation semantics or backend behavior
- Does not add browser history changes

**Not recommended first:**
- Auto-advance without button click — surprising on destructive decisions (Reject)
- Separate "Next item" button outside the banner — clutter, and banner already has focus

### D-243A: Keyboard auto-advance documentation / hint improvement (follow-up)

Update the keyboard hint string to mention that A+A and R+R advance to the next item after confirming. Docs-only unless the hint text needs a code change.

### D-244A: Next-item flow regression lock (after D-242B lands)

Lock the next-item button existence, the `reviewDecisionFeedbackNextId` state, and `clearReviewDecisionFeedback` extension.

---

## 6. Test Recommendations (for D-244A)

- Feedback banner remains visible after Approve/Reject
- "Open next item" button appears when next item exists in sorted/filtered queue
- "Open next item" button absent when no next item exists (last in queue)
- "Open next item" button absent when Keep Pending (item stays — not needed)
- Clicking next-item button calls `inspectReviewItem` with correct next ID
- Clicking next-item button clears feedback state
- Current filter/sort preserved after next-item navigation
- Normal Approve/Keep/Reject decision semantics unchanged
- No public profile exposure of `reviewDecisionFeedbackNextId` or next-item button

---

## 7. Current Smoke Test Gap Summary

| Gap | Locked? | Notes |
|-----|---------|-------|
| `reviewDecisionUI` success path (anchor, feedback, route, payload) | ✓ D-129A / D-230A / D-231A | Fully covered |
| Keyboard auto-advance (`_advanceId` pre-capture, `.then()` dispatch) | **Partial** — D-242A adds 4 guard tests | `initReviewKb` advance logic was not explicitly locked |
| Inspect panel ← Prev / Next → nav computation | **Partial** — D-242A adds 2 guard tests | Presence locked by D-231A; sorted/filtered computation not locked |
| `_reviewKbInFlight` in-flight guard | **Partial** — D-242A adds 1 guard test | Prevents duplicate decisions during API call |
| Next-item button in feedback banner | Not yet — feature does not exist | Target of D-242B |

---

## 8. Guard Tests Added (7 new → baseline 2573 + 7 = **2580**)

### D-242A category: Post-decision next-item flow audit locks (7 tests)

| Test | What it locks |
|------|--------------|
| `initReviewKb computes _advanceId from sorted/filtered list before API call` | Keyboard advance pre-capture |
| `initReviewKb calls inspectReviewItem(_advanceId) in .then() after decision` | Keyboard advance post-decision |
| `initReviewKb prefers _next over _prev for _advanceId` | Next-first preference |
| `initReviewKb uses _reviewKbInFlight guard for in-flight decisions` | Duplicate-decision prevention |
| `renderReviewInspectPanel computes _prev/_next from sorted/filtered list` | Inspect nav computation |
| `renderReviewInspectPanel renders Next nav button calling inspectReviewItem` | Inspect nav button wiring |
| `reviewDecisionUI does not call inspectReviewItem (button path has no auto-advance)` | Gap documented as invariant |

---

## Deployment State

| Task | State |
|------|-------|
| D-242A | Audit + tests + docs only — **no deploy needed** |
| **Current** | **No deploy needed** |

---

## Confirmations

- **App UI changed:** No
- **CSS changed:** No
- **Worker unchanged:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantic changes:** Confirmed
- **No public profile exposure:** Confirmed
- **Deploy needed:** No
