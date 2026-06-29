# D-239B — Back to Review Scroll Restore

**Scope:** App + tests + docs
**Status:** COMPLETE — D-239C live sanity PASS
**Baseline:** 2543 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D239B_BACK_TO_REVIEW_SCROLL_RESTORE.md`, `docs/README.md`
**App UI changes:** Yes — `backToArena()` now scrolls to the restored review item after returning from Study
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes — owner deploy complete (D-239C)
**Implementation HEAD:** 5c12a10

---

## Purpose

Addresses D-239A F-1: when the moderator clicks "← Back to Review" after opening Study View from the Review queue, the correct review item is restored in state but the page did not scroll to it. On a long queue, the restored card is off-screen and the moderator must scroll manually to find it.

---

## D-239A Finding Addressed (F-1)

> **F-1: No scroll-to-card after "← Back to Review"**
>
> `backToArena()` restores `inspectedReviewItem` from `lastInspectedReviewItemId` and calls `setMode('review')`, which re-renders the review page with the inspect panel open. However, `scrollToReviewAnchor()` and `scrollSelectedReviewCardIntoView()` are not called. The moderator must scroll manually to find the selected card.
>
> **Impact:** Medium. Long queues make it easy to lose queue position after returning from Study.

---

## Exact Change

**Old `backToArena()` review branch:**

```js
if (_origin === 'review') {
  const _savedId = lastInspectedReviewItemId;
  lastInspectedReviewItemId = null;
  if (_savedId) {
    const _found = (reviewQueue.review || []).find(i => i.id === _savedId);
    if (_found) inspectedReviewItem = _found;
  }
  setMode('review');
}
```

**New `backToArena()` review branch:**

```js
if (_origin === 'review') {
  const _savedId = lastInspectedReviewItemId;
  lastInspectedReviewItemId = null;
  if (_savedId) {
    const _found = (reviewQueue.review || []).find(i => i.id === _savedId);
    if (_found) inspectedReviewItem = _found;
  }
  setMode('review');
  if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId));
}
```

One line added: `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId));`

---

## Why `requestAnimationFrame`

`setMode('review')` calls `render()` → `renderReview()` → `renderReviewList()`, which writes the full review page DOM synchronously. The review cards and inspect panel are not in the DOM until `renderReviewList()` completes. Scheduling the scroll via `requestAnimationFrame` defers it until after the browser has performed the layout from that DOM write, ensuring the target element exists and has its position calculated before `scrollIntoView` is called.

This pattern is already used in `inspectReviewItem` (D-227B) for `scrollSelectedReviewCardIntoView()`.

---

## Guard

`if (_savedId)` — if `lastInspectedReviewItemId` was `null` (the moderator entered Study without an inspected item, or it was already cleared), the `requestAnimationFrame` is not scheduled. No-op is safe.

---

## What Did NOT Change

- `openReviewClaimStudy` — unchanged. Still sets `lastModeBeforeStudy = 'review'` and saves `lastInspectedReviewItemId`.
- "← Back to Review" button label — unchanged. Still rendered by `renderStudy()` when `lastModeBeforeStudy === 'review'`.
- `backToArena()` behavior for vault / truths / me / arena origins — all unchanged.
- No queue reload — `loadReviewQueue()` is not called on return. Queue data is the cached `reviewQueue.review` array already in memory.
- No browser `pushState` or `replaceState` — no history changes.
- No persistent storage — no `localStorage`, no `sessionStorage`.
- D-227B `scrollSelectedReviewCardIntoView` — still called by `inspectReviewItem`, unchanged.
- D-228A `withReviewScrollPreserved` — unchanged.
- D-233B `resolveSimilarUI` scroll parity — unchanged.
- Normal moderation actions (Approve / Keep / Reject) — unchanged.
- Duplicate/advisory semantics — unchanged.
- Public profile — unchanged.
- Worker, backend, API, schema, CSP, external assets — all unchanged.

---

## Tests Added (17 new)

| Test | What it confirms |
|------|-----------------|
| `openReviewClaimStudy still sets lastModeBeforeStudy to "review"` | Origin saved |
| `openReviewClaimStudy still stores lastInspectedReviewItemId` | Context saved |
| `Study header still renders "← Back to Review" when origin is review` | Return button copy |
| `backToArena still restores inspectedReviewItem from saved review ID` | Item restored |
| `backToArena still calls setMode("review") for review origin` | Mode restored |
| `backToArena schedules scroll via requestAnimationFrame` | Post-render scroll |
| `backToArena calls scrollToReviewAnchor(_savedId) in RAF` | Correct scroll target |
| `scroll restore guarded by _savedId (missing ID is safe)` | Null-safe |
| `backToArena does NOT introduce loadReviewQueue on return` | No queue reload |
| `vault origin unchanged` | Non-review origins intact |
| `truths origin unchanged` | Non-review origins intact |
| `backToArena does not introduce pushState` | No history change |
| `D-227B scrollSelectedReviewCardIntoView still exists` | D-227B not regressed |
| `D-228A withReviewScrollPreserved still exists` | D-228A not regressed |
| `D-233B resolveSimilarUI still calls scrollToReviewAnchor` | D-233B not regressed |
| `renderPublicProfileHtml does not contain backToArena or review-to-study internals` | No public exposure |
| `deploy integrity — worker.js unchanged` | Worker not modified |

**Hardening smoke:** 2543 passed / 0 failed (+17 new)

---

## Live Sanity Checklist — D-239C PASS

- [x] Deploy to production via owner terminal
- [x] Open Review queue, scroll down so at least one review item is off the initial viewport
- [x] Inspect a review item near the bottom of the queue — inspect panel opens
- [x] Click "Open Study View ↗" (or any ↗ Study button) — Study View opens
- [x] Study View shows "← Back to Review" button
- [x] Click "← Back to Review"
- [x] Review queue renders — inspect panel re-opens for the original item
- [x] Page scrolls automatically to the restored review card
- [x] "← Back to Vault" still works from Evidence Vault → Study
- [x] "← Back to Truths" still works from Truths → Study
- [x] Normal Approve/Keep/Reject actions unchanged in Review
- [x] Resolve/dismiss similar advisory scroll still works (D-233B parity)
- [x] No console errors

**Live sanity result:** 13/13 PASS (D-239C, 2026-06-29)

---

## Confirmations

- **Back to Review now scrolls to restored card:** Yes — `scrollToReviewAnchor(_savedId)` via RAF
- **Inspect panel remains visible for restored item:** Confirmed
- **No queue reload added:** Confirmed
- **Non-review Study entry unchanged:** Confirmed — vault/truths/me/arena branches untouched
- **Browser history behavior unchanged:** Confirmed — no `pushState`, no `replaceState`
- **Moderation actions unchanged:** Confirmed
- **Duplicate/advisory semantics unchanged:** Confirmed
- **D-227B/D-228A/D-229A/D-230A behavior intact:** Confirmed
- **D-233B/D-234A/D-235A/D-236A behavior intact:** Confirmed
- **No public profile exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **Deploy needed:** Yes — owner deploy complete (D-239C)
- **Owner deploy:** PASS
- **Live Back-to-Review scroll sanity:** PASS — "← Back to Review" restores inspected item and scrolls to card; inspect panel re-opens; queue not reloaded
- **Hardening smoke:** 2543 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)
- **D-239C live sanity:** 13/13 PASS
