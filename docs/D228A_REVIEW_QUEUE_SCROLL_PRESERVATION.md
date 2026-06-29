# D-228A — Review Queue Scroll Preservation

**Scope:** App + tests + docs (no CSS change)
**Status:** COMPLETE — live PASS (D-228B)
**Baseline:** 2327 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D228A_REVIEW_QUEUE_SCROLL_PRESERVATION.md`, `docs/README.md`
**App UI changes:** Yes — scroll helper + 9 re-render call sites
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes

---

## Purpose

Address D-227A friction point F-2: full DOM re-render on every review queue interaction loses scroll position. After clicking a filter chip, toggling a confirm step, or expanding the audit summary, the page always jumps to the top. This is disorienting when working through a long queue.

This task adds a scroll-preservation helper and applies it to all pure local re-renders (those with no intentional navigation intent). Interactions that intentionally move the viewport (inspect open, post-decision anchor) are deliberately excluded.

---

## What changed

### `public/app-v10.js`

**`withReviewScrollPreserved(fn)`** — new helper added before `setReviewSort`:

```js
function withReviewScrollPreserved(fn){
  const y = typeof window !== 'undefined' ? window.scrollY : 0;
  fn();
  if (typeof window !== 'undefined') requestAnimationFrame(() => window.scrollTo({top: y}));
}
```

- Captures `window.scrollY` before the render.
- Calls the render function synchronously (no async gap between capture and render).
- Schedules `window.scrollTo({top: y})` via `requestAnimationFrame` so it fires after the browser paints the new DOM.
- Guards `typeof window !== 'undefined'` for SSR/test safety — falls back to y=0 and skips restore if window unavailable.
- Exposed on `window` for testability.

### Re-renders wrapped with `withReviewScrollPreserved`

| Function | Was | Now |
|---|---|---|
| `setReviewFilter` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `setReviewSort` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `requestRejectReview` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `cancelRejectReview` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `requestApproveReview` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `cancelApproveReview` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `requestCleanupReview` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `cancelCleanupReview` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |
| `toggleReviewAudit` | `renderReviewList()` | `withReviewScrollPreserved(renderReviewList)` |

### Re-renders intentionally NOT wrapped

| Function | Why excluded |
|---|---|
| `inspectReviewItem` | D-227B scroll (panel + selected card) is the intentional navigation — preserve must not fight it |
| `reviewDecisionUI` | `scrollToReviewAnchor(_anchorId)` already handles post-decision positioning; queue reloads from API so captured scroll would be stale |
| `markDuplicateUI` / `resolveSimilarUI` post-API | Queue reload from API; stale scroll not useful |
| `renderReview` (initial load) | Cold load; no prior scroll to preserve |

---

## Moderation semantics — unchanged

- Approve / Keep Pending / Reject decision logic: **unchanged**
- Two-step confirm flow: **unchanged** (arms/cancels just happen at the same scroll position now)
- Keyboard shortcuts: **unchanged**
- Filter values / sort values: **unchanged**
- Queue data: **unchanged**
- D-227B selected-card scroll on inspect open: **preserved** — `inspectReviewItem` still runs its panel + card scrolls without interference

---

## No backend/API/migration/schema/CSP/external asset changes

Confirmed. This change is frontend JS only.

---

## New tests (D-228A — 19 explicit)

1. `withReviewScrollPreserved` helper exists
2. Helper captures `window.scrollY`
3. Helper uses `requestAnimationFrame`
4. Helper calls `window.scrollTo`
5. Helper guards `typeof window !== 'undefined'` (null-safe)
6. `setReviewFilter` uses `withReviewScrollPreserved`
7. `setReviewSort` uses `withReviewScrollPreserved`
8. `requestRejectReview` uses `withReviewScrollPreserved`
9. `requestApproveReview` uses `withReviewScrollPreserved`
10. `cancelRejectReview` uses `withReviewScrollPreserved`
11. `cancelApproveReview` uses `withReviewScrollPreserved`
12. `toggleReviewAudit` uses `withReviewScrollPreserved`
13. `inspectReviewItem` does NOT use `withReviewScrollPreserved` (D-227B wins)
14. `inspectReviewItem` still calls `scrollSelectedReviewCardIntoView` (D-227B regression)
15. `withReviewScrollPreserved` exposed on window
16. No moderation action names changed — `reviewDecisionUI` still present
17. `reviewDecisionUI` does NOT use `withReviewScrollPreserved` (`scrollToReviewAnchor` wins)
18. Public profile render path does not include `withReviewScrollPreserved`
19. Deploy integrity — D-228A tag absent from worker.js

---

## Live sanity checklist — D-228B PASS (2026-06-29)

Owner deploy completed from terminal. All 25 live sanity items confirmed PASS.

- [x] Deploy via `wrangler deploy` from owner terminal — PASS
- [x] Open Review tab with admin token — PASS
- [x] Queue loads without console-breaking errors — PASS
- [x] Scroll down the review queue — PASS
- [x] Changing filter preserves approximate scroll position — PASS
- [x] Changing sort preserves approximate scroll position — PASS
- [x] Arming Reject preserves approximate scroll position — PASS
- [x] Cancelling Reject preserves approximate scroll position — PASS
- [x] Arming Approve preserves approximate scroll position — PASS
- [x] Cancelling Approve preserves approximate scroll position — PASS
- [x] Arming cleanup/keep action preserves approximate scroll position — PASS
- [x] Cancelling cleanup/keep action preserves approximate scroll position — PASS
- [x] Toggling audit summary preserves approximate scroll position — PASS
- [x] Inspect still uses D-227B selected-card anchor behavior — PASS
- [x] Inspect still visually marks selected card — PASS
- [x] Inspect selected-card scroll is not broken/fought by scroll preservation — PASS
- [x] Approve behavior unchanged — PASS
- [x] Keep/Cleanup behavior unchanged — PASS
- [x] Reject behavior unchanged — PASS
- [x] Two-step confirm behavior unchanged — PASS
- [x] Keyboard shortcuts unchanged — PASS
- [x] Filters/sort values unchanged — PASS
- [x] Public profile pages do not contain review scroll helper or markers — PASS
- [x] No backend/API behavior changed — PASS
- [x] No console errors from scroll helper if window APIs absent — PASS

**Hardening smoke (post-deploy):** 2327 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug`)

---

## Confirmations

- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantics change:** Confirmed
- **Nine wrapped interactions preserve scroll:** filter, sort, reject arm/cancel, approve arm/cancel, cleanup arm/cancel, audit toggle — all PASS live
- **Inspect selected-card anchor (D-227B) intact and wins:** Confirmed
- **Deploy needed:** No — deploy complete, live PASS recorded
