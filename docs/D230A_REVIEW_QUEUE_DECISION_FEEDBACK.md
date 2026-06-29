# D-230A — Review Queue Decision Feedback

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — live PASS (D-230B)
**Baseline:** 2366 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D230A_REVIEW_QUEUE_DECISION_FEEDBACK.md`, `docs/README.md`
**App UI changes:** Yes — `reviewDecisionUI`, `renderReviewList`
**CSS changes:** Yes — 4 new rule blocks
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes

---

## Purpose

Address D-227A friction points F-3/F-4: after completing a moderation decision, there is no clear inline confirmation that the action was applied. The existing floating `toast()` disappears after 1.8 s and is easily missed. This task adds a persistent inline feedback banner below the filter bar so the moderator can verify which decision was applied before moving on.

---

## What changed

### `public/app-v10.js`

**`reviewDecisionFeedback` state variable** — added after `reviewSortOrder`:
```js
let reviewDecisionFeedback = null;
```
Holds the message string after a decision completes, or `null` when no feedback is active.

**`clearReviewDecisionFeedback()`** — new helper added before `withReviewScrollPreserved`:
```js
function clearReviewDecisionFeedback(){reviewDecisionFeedback=null;renderReviewList();}
```
Called by the Dismiss button. Sets feedback to null and re-renders the list. Exposed on `window`.

**`reviewDecisionUI`** — sets feedback immediately after a successful API call, before `renderReviewList()`:
```js
const _fbMsgs={public:'Approved review item.',rejected:'Rejected review item.',review:'Kept review item.'};
reviewDecisionFeedback=_fbMsgs[decision]||null;
```
The existing `toast()` call is preserved — the banner adds a persistent complement, not a replacement.

**`renderReviewList`** — builds and inserts the feedback banner:
```js
const feedbackBanner=reviewDecisionFeedback
  ?`<div class="review-decision-feedback" role="status" aria-live="polite" style="grid-column:1/-1">
      <span class="review-feedback-msg">${esc(reviewDecisionFeedback)}</span>
      <button type="button" class="review-feedback-dismiss" onclick="clearReviewDecisionFeedback()">Dismiss</button>
    </div>`
  :'';
document.getElementById('reviewList').innerHTML=bar+overview+audit+feedbackBanner+panel+(list.map(reviewCard).join('')||empty);
```
The banner appears above the inspect panel and card grid, below the filter bar and overview strip.

### `public/styles.css`

Four new rule blocks after the D-229A cleanup block:

```css
/* D-230A: review decision feedback banner */
.review-decision-feedback{display:flex;align-items:center;gap:8px;background:rgba(47,191,113,.08);border:1px solid rgba(47,191,113,.25);border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;color:var(--fg);grid-column:1/-1}
.review-feedback-msg{flex:1}
.review-feedback-dismiss{background:transparent;border:1px solid var(--line);color:var(--muted);font-size:11px;padding:2px 8px;border-radius:4px;cursor:pointer}
.review-feedback-dismiss:hover{color:var(--fg);border-color:var(--fg)}
```

Uses a subtle green tint (same hue as the approval green) as a neutral positive signal — not alarmist, easy to scan.

---

## Feedback copy by action

| Decision | Feedback message |
|---|---|
| `public` (approve) | "Approved review item." |
| `rejected` (reject) | "Rejected review item." |
| `review` (keep pending) | "Kept review item." |

---

## Feedback lifecycle

1. Feedback is `null` on page load and after dismiss.
2. Set synchronously in `reviewDecisionUI` after API success, before `renderReviewList()`.
3. Rendered above the inspect panel by `renderReviewList`.
4. Persists until the moderator clicks Dismiss.
5. A new decision overwrites the previous feedback message.
6. Existing `toast()` call is unchanged — still fires alongside the banner.

---

## Accessibility

- Banner uses `role="status"` — screen readers announce it without interrupting the current focus.
- `aria-live="polite"` — announcement is queued, not immediate.
- Dismiss button uses `type="button"` — no accidental form submission.
- Focus is not stolen — no auto-focus on the banner.
- `esc()` applied to the feedback string — XSS-safe even if message string changes in future.

---

## Moderation semantics — unchanged

- Decision route `/api/review/decision`: **unchanged**
- Approve / Keep Pending / Reject outcomes: **unchanged**
- Two-step confirm flow: **unchanged**
- Keyboard shortcuts (A/R/K/[]/Esc): **unchanged**
- `reviewDecisionUI` payload: **unchanged**

## D-227B / D-228A / D-229A compatibility

- `data-review-selected="true"` still emitted by `reviewCard` (D-227B intact)
- `scrollSelectedReviewCardIntoView` still called on inspect (D-227B intact)
- `withReviewScrollPreserved` still used in all nine arm/cancel/filter/sort interactions (D-228A intact)
- `data-review-confirming` and `review-confirm-armed` attributes still emitted (D-229A intact)

---

## No backend/API/migration/schema/CSP/external asset changes

Confirmed. All changes are frontend JS, CSS, and copy only.

---

## New/updated tests (D-230A — 19 new + 4 window fixes)

**New D-230A tests (19):**
1. `reviewDecisionFeedback` state variable declared
2. `clearReviewDecisionFeedback` helper exists
3. `clearReviewDecisionFeedback` exposed on window
4. Feedback banner uses `role="status"`
5. Feedback banner uses `aria-live="polite"`
6. Dismiss button uses `type="button"`
7. Dismiss button calls `clearReviewDecisionFeedback()`
8. Approve decision sets "Approved review item." feedback
9. Reject decision sets "Rejected review item." feedback
10. Keep/review decision sets "Kept review item." feedback
11. Feedback rendered in `renderReviewList` (`review-decision-feedback` class)
12. CSS has `review-decision-feedback`
13. CSS has `review-feedback-dismiss`
14. Feedback copy absent from public profile render path
15. `reviewDecisionUI` still calls `/api/review/decision`
16. D-227B `data-review-selected` still emitted (regression)
17. D-228A `withReviewScrollPreserved` still in `setReviewFilter` (regression)
18. D-229A `data-review-confirming` still emitted (regression)
19. Deploy integrity — D-230A tag absent from worker.js

**Window fixes (4):** D-129C/D/E tests used a 1200-char slice from `renderReviewList` — `feedbackBanner` variable pushed `casefile` logic to offset ~1254. Extended to 1500 chars. Tests still assert the same content — no weakening.

---

## Live sanity checklist — D-230B PASS (2026-06-29)

Owner deploy completed from terminal. All 24 live sanity items confirmed PASS.

- [x] Deploy via `wrangler deploy` from owner terminal — PASS
- [x] Open Review tab with admin token — PASS
- [x] Queue loads without console-breaking errors — PASS
- [x] Completing Approve shows banner: "Approved review item." — PASS
- [x] Completing Keep Pending / cleanup shows banner: "Kept review item." — PASS
- [x] Completing Reject shows banner: "Rejected review item." — PASS
- [x] Banner appears near the review queue, not in public profile — PASS
- [x] Banner uses status/live-region behavior and does not steal focus — PASS
- [x] Dismiss button is visible — PASS
- [x] Dismiss button clears the banner — PASS
- [x] Dismiss button does not affect queue contents — PASS
- [x] Existing toast behavior still works alongside banner — PASS
- [x] Two-step confirm behavior unchanged — PASS
- [x] Approve outcome unchanged — PASS
- [x] Keep/Cleanup outcome unchanged — PASS
- [x] Reject outcome unchanged — PASS
- [x] Keyboard shortcuts unchanged — PASS
- [x] Filters/sort unchanged — PASS
- [x] D-227B selected-card anchor still works — PASS
- [x] D-228A scroll preservation still works — PASS
- [x] D-229A confirm-state clarity still works — PASS
- [x] Public profile pages do not contain review feedback copy/classes — PASS
- [x] No backend/API behavior changed — PASS
- [x] No console errors — PASS

**Hardening smoke (post-deploy):** 2366 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug`)

---

## Confirmations

- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantics change:** Confirmed
- **Deploy needed:** No — deploy complete, live PASS recorded (D-230B)
