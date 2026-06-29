# D-231A — Review Queue Ergonomics Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 2403 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D231A_REVIEW_QUEUE_ERGONOMICS_REGRESSION_LOCK.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Lock the completed D-227→D-230 review queue ergonomics arc. Future review UI changes must not accidentally remove or break:

- D-227B/C — Selected-card anchor (scroll to selected card after inspect opens)
- D-228A/B — Scroll preservation (nine re-render interactions preserve scroll position)
- D-229A/B — Confirm-state clarity (armed state indicators, neutral cleanup styling)
- D-230A/B — Decision feedback (inline banner after successful decision)

Any test in this block that fails after a future change means a D-227→D-230 behavior has been removed or broken. The change must restore the behavior **or** update this regression lock document with explicit owner approval before proceeding.

---

## D-227 → D-230 arc summary

| Task | What it added | Live PASS |
|---|---|---|
| D-227B | `data-review-selected="true"` on selected card; `scrollSelectedReviewCardIntoView()` via RAF; stronger `.review-card-selected` CSS | D-227C (2026-06-29) |
| D-228A | `withReviewScrollPreserved(fn)` helper; wrapped 9 pure local re-renders (filter, sort, arm/cancel ×4, audit toggle) | D-228B (2026-06-29) |
| D-229A | `data-review-confirming` attribute; `review-confirm-armed` class; `review-card-approve-pending`; neutral amber cleanup styling | D-229B (2026-06-29) |
| D-230A | `reviewDecisionFeedback` state; `clearReviewDecisionFeedback()`; `role="status" aria-live="polite"` banner with Dismiss button | D-230B (2026-06-29) |

---

## What is now locked

### 1. D-227 selected-card anchor

- `reviewCard` emits `data-review-selected="true"` on the currently inspected card
- `review-card-selected` class applied to inspected card
- `scrollSelectedReviewCardIntoView()` function exists and queries `[data-review-selected="true"]`
- `inspectReviewItem` fires `scrollSelectedReviewCardIntoView` via `requestAnimationFrame`

### 2. D-228 scroll preservation

- `withReviewScrollPreserved(fn)` exists and captures `window.scrollY`, restores via RAF + `window.scrollTo`
- `setReviewFilter` and `setReviewSort` wrap their render calls with `withReviewScrollPreserved`
- `requestApproveReview` wraps its render call with `withReviewScrollPreserved`
- `inspectReviewItem` remains excluded (D-227B card scroll wins — must not be wrapped)

### 3. D-229 confirm-state clarity

- `data-review-confirming="reject"` and `data-review-confirming="approve"` emitted by `reviewCard` when armed
- `review-confirm-armed` class applied to armed actions div
- `review-card-approve-pending` class applied to card when approve is armed
- `renderReviewInspectPanel` uses `review-cleanup-confirm-msg` and `btn-cleanup-confirm` (neutral amber — not reject red)
- `pendingApproveReviewId` and `pendingRejectReviewId` state variables still in use

### 4. D-230 decision feedback

- `let reviewDecisionFeedback` declared
- `clearReviewDecisionFeedback()` helper exists
- Feedback banner in `renderReviewList` uses `role="status"` and `aria-live="polite"`
- Dismiss button uses `type="button"`
- Feedback copy: "Approved review item." / "Kept review item." / "Rejected review item."

### 5. Moderation semantics

- `/api/review/decision` POST route unchanged
- `reviewDecisionUI` payload still contains `targetType`, `targetId`, `decision`
- Decision values `'public'` / `'rejected'` / `'review'` still passed as onclick arguments in `reviewCard`
- Existing `toast(msgs[decision]...)` call still present in `reviewDecisionUI` success path

### 6. Public profile exposure guarantee

`renderPublicProfileHtml` does not contain:
- `data-review-selected`
- `withReviewScrollPreserved`
- `review-confirm-armed` or `data-review-confirming`
- `review-decision-feedback` or any decision-feedback copy
- `reviewDecisionUI`, `requestApproveReview`, or `requestRejectReview`

### 7. Deploy integrity

D-231A itself is tests+docs only. `public/app-v10.js`, `public/styles.css`, and `src/worker.js` must not carry a `D-231A` marker.

---

## Tests added (37 new)

| Category | Count |
|---|---|
| D-227 selected-card anchor lock | 5 |
| D-228 scroll preservation lock | 7 |
| D-229 confirm-state clarity lock | 6 |
| D-230 decision-feedback lock | 7 |
| Moderation semantics lock | 4 |
| Public profile exposure lock | 5 |
| Deploy integrity lock | 3 |
| **Total** | **37** |

---

## Future rule

> **Any review queue UI change that causes one or more D-231A tests to fail must either restore the original behavior or update this document with a new section explaining the approved deviation, confirmed by the owner.**

---

## Worker known-warning state

`/api/u/:slug` — parameterised route implemented via regex in `worker.js`. Not a literal string match. Documented D-218A limitation. Non-blocking. Count: 57 passed / 0 failed / 1 known warn.

---

## Confirmations

- **App/CSS unchanged:** Confirmed — no changes to `public/app-v10.js` or `public/styles.css`
- **Worker unchanged:** Confirmed — no changes to `src/worker.js`
- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantics change:** Confirmed
- **Deploy needed:** No
