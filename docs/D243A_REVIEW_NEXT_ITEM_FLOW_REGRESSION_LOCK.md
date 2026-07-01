# D-243A — Review Next-Item Flow Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2638 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D243A_REVIEW_NEXT_ITEM_FLOW_REGRESSION_LOCK.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Deploy needed:** No

---

## Purpose

Lock the D-242A/B/C next-item affordance so future review queue, feedback banner, or navigation changes cannot accidentally:

- Remove `reviewDecisionFeedbackNextId` state or the `clearReviewDecisionFeedback` reset
- Turn "Open next item →" into auto-moderation
- Break filter/sort order for the candidate
- Suppress the button incorrectly (or show it when no valid next item exists)
- Interfere with Keep Pending, keyboard advance, or the existing D-227→D-230 review ergonomics

Any task touching the feedback banner, `reviewDecisionUI`, `renderReviewList`, or `inspectReviewItem` must either pass all D-243A tests unchanged, or update this lock with explicit owner approval before merging.

---

## D-242A/B/C Summary

| Task | Commit | What it delivered |
|------|--------|------------------|
| D-242A | `1226341`/`6189bf8` | Audit — found F-1 (no post-decision next-item affordance for mouse path); 7 guard tests; docs |
| D-242B | `4f2e031` | Feature — "Open next item →" button in D-230A feedback banner; `reviewDecisionFeedbackNextId` state; 24 tests |
| D-242C | `443bcc6` | Live closeout — 34/34 PASS (owner deploy 2026-07-01) |

---

## What Is Now Locked

### 1. Next-item state lock (4 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| `reviewDecisionFeedbackNextId` declared at module level | `let reviewDecisionFeedbackNextId = null` |
| `clearReviewDecisionFeedback` clears feedback message | `reviewDecisionFeedback = null` |
| `clearReviewDecisionFeedback` clears next-ID state | `reviewDecisionFeedbackNextId = null` |
| `clearReviewDecisionFeedback` re-renders the list | `renderReviewList()` |

### 2. Candidate capture lock (4 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| Captured before `loadReviewQueue()` | `_nextCandidateId` computed before reload |
| Derived from sorted/filtered current list | `applyReviewSort(applyReviewFilter(reviewQueue.review))` |
| Only for Approve / Reject | `_captureNext = (decision === 'public' || decision === 'rejected')` |
| Keep Pending skips capture | `_captureNext` false for `'review'` — `_nextCandidateId` stays null |

### 3. Post-reload validity lock (5 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| Button only shown if candidate in post-reload queue | `(reviewQueue.review||[]).find(i=>i.id===reviewDecisionFeedbackNextId)` |
| Button absent when candidate gone | `_fbNextBtn = _fbNextInQueue ? ... : ''` |
| "Approved review item." unchanged | Literal string check |
| "Rejected review item." unchanged | Literal string check |
| "Kept review item." unchanged | Literal string check |

### 4. Manual action lock (6 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| Button copy "Open next item →" | Literal string check |
| Button `type="button"` | HTML attribute check |
| Button calls `inspectReviewItem` | onclick string check |
| Button clears feedback before opening | `clearReviewDecisionFeedback()` in onclick |
| Button does not call `reviewDecisionUI` | Absence check |
| Button does not call `fetch`/`api()` | Absence check |

### 5. Existing review flow compatibility lock (7 tests)

| Test | What it confirms |
|------|-----------------|
| `scrollSelectedReviewCardIntoView` still exists | D-227B intact |
| `withReviewScrollPreserved` still exists | D-228A intact |
| `data-review-confirming` still used | D-229A intact |
| `review-decision-feedback` in `renderReviewList` | D-230A intact |
| Dismiss button still calls `clearReviewDecisionFeedback` | D-230A dismiss intact |
| `backToArena` RAF scroll to restored card intact | D-239/D-240 intact |
| Keyboard `_advanceId` auto-advance unchanged | D-242A compat intact |

### 6. Duplicate / Drift / public boundary lock (5 tests)

| Test | What it confirms |
|------|-----------------|
| `resolveSimilarUI` calls `scrollToReviewAnchor(claimId)` | D-233B intact |
| "Use as duplicate target" button present | D-236A intact |
| `renderPublicProfileHtml` excludes `reviewDecisionFeedbackNextId` | Not public |
| `renderPublicProfileHtml` excludes `review-feedback-next` | Not public |
| `renderPublicProfileHtml` excludes "Open next item" | Not public |

### 7. Deploy integrity lock (3 tests)

| Test | What it confirms |
|------|-----------------|
| `app-v10.js` not modified by D-243A | Tests+docs only |
| `worker.js` not modified by D-243A | Tests+docs only |
| `styles.css` not modified by D-243A | Tests+docs only |

---

## Manual-Only / No Auto-Moderation Guarantee

- The "Open next item →" button calls `clearReviewDecisionFeedback()` + `inspectReviewItem(id)` only
- `inspectReviewItem` opens the inspect panel — it does not make any moderation decision
- The button does not call `reviewDecisionUI`, `fetch`, or `api()`
- Nothing fires automatically — the moderator must click the button

---

## Filter/Sort Respect Guarantee

- `_nextCandidateId` is captured from `applyReviewSort(applyReviewFilter(reviewQueue.review))` before the API call
- This is the same computation used by `renderReviewInspectPanel` ← Prev / Next → nav and `initReviewKb`
- The button respects the current filter chip and sort order

---

## Post-Reload Validity Guarantee

- After `loadReviewQueue()`, the candidate is validated against the fresh `reviewQueue.review` array
- If the candidate is no longer present (e.g. queue is now empty, item was already removed), the button is suppressed
- No stale candidate is ever shown

---

## Keep Pending Unchanged Guarantee

- `_captureNext` is `false` for `decision === 'review'` — no candidate is captured
- `reviewDecisionFeedbackNextId` is assigned `null` for Keep Pending
- The feedback banner shows "Kept review item." + Dismiss only
- The item stays open in the inspect panel

---

## Keyboard Shortcut Unchanged Guarantee

- `initReviewKb` `_advanceId` auto-advance (pre-capture before decision → `inspectReviewItem(_advanceId)` in `.then()`) is not touched
- D-243A test asserts `_advanceId` and `inspectReviewItem(_advanceId)` remain present in `initReviewKb`

---

## Public Exposure Guarantees

All of the following are confirmed absent from `renderPublicProfileHtml`:
- `reviewDecisionFeedbackNextId`
- `review-feedback-next`
- `"Open next item"`

---

## Drift/Belief Expansion Untouched

`public/belief-drift-expansion.js` and `public/index.html` are not modified by D-243A. Confirmed by deploy integrity lock assertions and clean `git status` at commit time.

---

## Worker Known-Warning State

| Warning | Count | Status |
|---------|-------|--------|
| `/api/u/:slug` parameterised route | 1 | Known — D-218A documented limitation |
| Unknown warnings | 0 | Any new WARN text not matching known-warn must be investigated |

---

## Tests Added (34 new → baseline 2604 + 34 = **2638**)

7 categories / 34 tests — all PASS on first run.

**Hardening smoke:** 2638 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Future Rule

> Any task touching the review decision feedback banner (`reviewDecisionFeedback`, `reviewDecisionFeedbackNextId`, `clearReviewDecisionFeedback`), `reviewDecisionUI`, `renderReviewList` feedback rendering, or `inspectReviewItem` must either pass all D-243A regression tests unchanged, or update this lock with explicit owner approval before merging.
>
> Do not add auto-moderation to the "Open next item →" flow — the button must remain a navigation-only action with no decision side-effects.
