# D-165A — Review Queue Admin UX Audit

**Date:** 2026-06-25
**Scope:** Docs only. Audit and recommendations for D-165B. No code change in this patch.

---

## Current Behaviour Summary

### renderReview() — initial render

`renderReview()` is called on every tab switch to Review mode. It:

1. Calls `initReviewKb()` — binds keyboard handler once (guarded by `_reviewKbBound`)
2. Reads `adminToken()` from `localStorage`
3. Sets `document.getElementById('main').innerHTML` to the review shell:
   - Header with "Review Queue" heading + `admin only` badge
   - Masked token input (`type="password"`) + "Load Queue" + "Clear Token" buttons
   - Invite code creator panel (only if token is present)
   - `#reviewList` grid with either "Loading review queue…" (if token present) or "Review is owner-only. Enter the admin token to load the queue." (if no token)
4. If token is present: calls `loadReviewQueue()` then `renderReviewList()`
5. On `loadReviewQueue()` failure: sets `#reviewList` to `<div class="panel"><h3>Review unavailable</h3><p class="small">${esc(e.message||e)}</p></div>`

**loadReviewQueue()** calls `GET /api/review` with `adminHeaders()`. If the token is wrong, the backend returns `{ error: 'ADMIN_REQUIRED' }` with HTTP 403. The frontend `api()` helper throws on non-2xx responses, so `renderReview()` catches this and renders the "Review unavailable" error panel. The error message shown comes from `e.message` — for a 403 it will be `'ADMIN_REQUIRED'` or similar. No token value is included in the error message.

### renderReviewList() — re-render on every action

Called after every filter change, sort change, decision, inspect open/close, pending-state change, or audit toggle. It:

1. Reads `reviewQueue.review` (the merged sorted queue from the last `loadReviewQueue()` call)
2. Applies current filter (`applyReviewFilter`) and sort (`applyReviewSort`)
3. Resets `inspectedReviewItem`, `pendingRejectReviewId`, `pendingCleanupReviewId` if the targeted item is no longer in the filtered list
4. Renders: filter bar → overview strip → audit summary → inspect panel (if open) → card grid (or empty state)
5. Updates `#casefile` (sidebar): inspect context if panel open, else `helperText()`

**Note:** `pendingApproveReviewId` is NOT reset by `renderReviewList()` even if the item leaves the list. This means: if an admin arms approve on item X, then changes filter to a view where X is not visible, `pendingApproveReviewId` remains set. If they navigate back to a filter where X appears, the approve confirm state is still active. This is a minor stale-state risk — not safety-critical (confirmation still required) but potentially confusing.

### Empty state coverage

| Filter | Empty state copy |
|---|---|
| Pending (`review`) | "No pending items. New claim and truth submissions appear here before going public. Approve to make an item visible; reject to keep it private." |
| Public | "No approved items in this filter. Approved items are visible to all users." |
| Rejected | "No rejected items. Rejected items stay private. Use Archive on smoke/test artefacts to remove them from the active queue." |
| Reported | "No reported items. User reports are signals, not proof. Review each item before deciding." |
| ~Similar | "No near-duplicate suggestions in queue. Claims flagged as similar appear here. These are advisory…" |
| ~Quality | "No claims with quality hints in this view. Hints are advisory…" |
| Duplicate | "No duplicate-linked items in queue." |
| Demo/Test | "No demo seed or test-account items in queue. Items from humanx-seed, anon-o_seed, and known test accounts appear here." |
| All | "No Review items found." |

All filters have a meaningful empty state. The **truth-derived** filter has no entry in `reviewEmptyText` — it falls through to the default `'<p class="small">No items found.</p>'` with no secondary explanation.

### Loading state

The loading state is the string `'Loading review queue…'` rendered as bare text inside the `#reviewList` `<div class="panel">`. It has no spinner, no progress indicator, no estimated duration. For fast connections this is invisible; on slow connections or large queues it may be visible for several seconds with no feedback.

The loading string is replaced in full once `renderReviewList()` runs — either rendering cards or the error panel.

### Error/failed-load state

On `loadReviewQueue()` failure, the error message is:

```html
<div class="panel">
  <h3>Review unavailable</h3>
  <p class="small">${esc(e.message||e)}</p>
</div>
```

The error message is `esc()`-escaped but comes directly from `e.message`. For a 403 `ADMIN_REQUIRED` error this will display `"ADMIN_REQUIRED"`. For a network failure it will display the browser's network error string. No "retry" button is offered — the admin must manually click "Load Queue" again.

### Admin token missing / invalid states

| State | What admin sees |
|---|---|
| No token in localStorage | "Review is owner-only. Enter the admin token to load the queue." (inside `#reviewList`) |
| Token present, loading | "Loading review queue…" |
| Token present, load failed (wrong token → 403) | "Review unavailable" + `"ADMIN_REQUIRED"` error message |
| Token present, load succeeded | Full queue UI |

**What admin does NOT see:**
- The token value itself (now masked as `type="password"` after D-164B)
- Any hint about token format or length
- A "your token may be wrong" vs "network error" distinction — both show "Review unavailable"

**One gap:** The "Review unavailable" panel with `ADMIN_REQUIRED` does not offer a "Re-enter token" or "Clear token" affordance. The admin must scroll up to find the token form at the top of the page.

### Filter bar

11 filter chips: Pending · Public · Rejected · Reported · ~Similar · ~Quality · Pressure · Dupes · Demo/Test · Truth-Derived · All.

Each chip shows a count badge if `n > 0`. The active chip gets `review-filter-chip-active` class. A `reviewFilterHelpText()` note appears below the filter bar (e.g. "Items awaiting admin decision."). 

**Chips without help text:** `'truth-derived'` has no entry in `reviewFilterHelpText`. It renders no help text below the filter bar.

**Filter persistence:** `reviewStateFilter` is a module-level variable — it persists across tab switches within the session. If an admin switches away from Review and returns, the previous filter is still active. This could be surprising (e.g. returning to Review and seeing "No items found" on the Truth-Derived filter when there are pending items on Pending).

**Stale filter risk:** If an admin has a filter active (e.g. Reported) and all items in that filter are resolved, the empty state is shown. The filter chip count updates to 0 after re-render. The admin must manually click Pending to see remaining items.

### Inspect panel

- Opens above the card grid via `inspectReviewItem(id)`
- `renderReviewList()` re-renders the entire `#reviewList` on every inspect open/close
- `document.querySelector('.review-inspect-panel')?.scrollIntoView({behavior:'smooth',block:'start'})` called after inspect opens — panel scrolls into view
- Position indicator: "N of M" from current filtered list
- Prev/Next navigation: `← Prev` / `Next →` buttons + `[` / `]` / `←` / `→` keyboard shortcuts
- When a decision removes the inspected item from the list, `inspectedReviewItem` is reset to `null` in `renderReviewList()` — panel closes

**Inspect panel stays on the correct card:** The panel is keyed to `inspectedReviewItem.id`. After `loadReviewQueue()` and `renderReviewList()`, the panel re-renders using the updated item from `reviewQueue.review`. If the decision changed the item's `review_state`, the updated badge appears in the panel.

**After approve/keep/reject:** `reviewDecisionUI()` calls `await loadReviewQueue()` then `renderReviewList()`. The `_anchorId` scroll-back via `scrollToReviewAnchor(_anchorId)` fires after re-render — it scrolls to either the inspect panel (if still open) or the card with the matching `data-review-id` attribute.

### Keyboard shortcut discoverability

Shortcut hint rendered inside the inspect panel:

```
A approve · K keep · R reject · [ ] prev/next · Esc close
```

This is only visible when the inspect panel is open. There is no shortcut reference visible at the filter bar level or in the empty state. An admin who has never opened the inspect panel will never see the keyboard hint.

After D-164B: `A` now requires two presses (arm then confirm). The keyboard hint still shows `A approve` without indicating the two-press requirement. This is a discoverability gap — an admin who has learned the old one-press `A` will be confused the first time they use the updated shortcut.

### Action feedback (toast + re-render)

| Action | Feedback |
|---|---|
| Approve | `toast('Approved. Item is now public.')` + queue reload + re-render |
| Keep Pending | `toast('Kept in Review. Item is not yet public.')` + queue reload + re-render |
| Reject | `toast('Rejected. Item will not be public.')` + queue reload + re-render |
| Mark Duplicate | Modal confirm → `toast('Marked as duplicate. Claim removed from queue.')` + queue reload + re-render |
| Archive test artefact | `toast('Archived rejected test artefact.')` + queue reload + re-render |
| Any error | `toast(e.message || 'Review action failed')` |

Toast messages are `esc()`-safe and do not include token values, user IDs, or admin metadata.

On any successful decision, `loadGraphStatus()` is called (non-fatal, `.catch(()=>{})`). This updates the sidebar graph stats.

### Scroll / anchor behaviour after D-164B

After D-164B the flow is:
1. Admin first-clicks Approve in inspect panel → `requestApproveReview(id)` → `renderReviewList()` (no scroll)
2. Admin second-clicks "Confirm approve public ✓" → `reviewDecisionUI(type, id, 'public')` → success → `loadReviewQueue()` → `renderReviewList()` → `scrollToReviewAnchor(id)`

The `scrollToReviewAnchor(id)` call searches for `.review-inspect-panel` first, then `[data-review-id="${id}"]`, then `.review-card`. Since the approved item is removed from the Pending filter (its state changes to `'public'`), the card is no longer in the rendered list — `scrollToReviewAnchor` falls through to `.review-card` (first visible card) if neither the inspect panel nor the approved card is found. This is acceptable but means the admin sees the top of the list rather than the next-in-sequence item. The inspect panel closes because `inspectedReviewItem` is reset when the item leaves the filtered list.

---

## Audit Answers

### 1. What does an admin see when there are zero review items?

The Pending filter empty state:

> "No pending items. New claim and truth submissions appear here before going public. Approve to make an item visible; reject to keep it private."

This is clear — it explains what the queue is for and what to do when it is empty.

### 2. Is it clear whether the queue is empty, filtered empty, or failed to load?

**Mostly yes.** Each filter has a specific empty state. The "All" empty state says "No Review items found." — which should only appear if the queue is genuinely empty (no items in any state).

**Gap:** The filter chips show counts (e.g. `Pending 0`, `Public 3`) when the queue has items — so an admin on a filter with zero items can see other chips with non-zero counts and understand the queue is not empty, just filtered. However, if the queue itself fails to load (network error), the filter bar is never rendered — only the "Review unavailable" panel is shown. There is no way for the admin to distinguish "queue loaded but all filters are empty" from "queue failed to load" without looking at the panel heading.

**Improvement:** The "Review unavailable" panel heading is `<h3>Review unavailable</h3>` rather than `<h2>` — it sits in a `.panel` div, which renders with less visual weight than the queue UI. A "retry" button below the error message would help.

### 3. Is missing/invalid admin token messaging clear without exposing token values?

**Yes — no token value is ever rendered or exposed.** The token input is now `type="password"` (D-164B). The "Review is owner-only. Enter the admin token to load the queue." message is descriptive without giving format hints. The `ADMIN_REQUIRED` error string from the backend is acceptable — it explains the cause without echoing the token.

**Minor gap:** `ADMIN_REQUIRED` is a code-style error string, not a user-readable message. "Invalid or missing admin token. Re-enter and try again." would be clearer. The admin currently must scroll up to the token form — a "re-enter token" prompt near the error would reduce steps.

### 4. Does the UI recover cleanly after a failed review action?

**Yes.** `reviewDecisionUI()` is wrapped in a try/catch that calls `toast(e.message || 'Review action failed')`. The pending-review state variables (`pendingRejectReviewId`, `pendingApproveReviewId`) are only cleared on success — so on failure the UI remains in its pre-action state. The admin can retry. `_reviewKbInFlight` is cleared in `.finally()`.

**One edge case:** If `loadReviewQueue()` throws after a successful decision write (e.g. the queue reload fails on network hiccup), the toast still says "Approved. Item is now public." but the queue list may not update. The admin would need to manually reload the queue. This is unlikely but possible.

### 5. Are filters understandable and safe?

**Yes, with one gap.** Each filter chip has a label, a count badge (when non-zero), and a help text line below the bar. All advisory filters (`~Similar`, `~Quality`, `Duplicate`) explicitly say in their help text and empty states that they are "advisory — no automatic action".

**Gap:** `truth-derived` filter has no help text (`reviewFilterHelpText` returns `''` for it) and no secondary empty state (falls through to "No items found."). A truth-derived claim requires checking the parent Truth before approving — this guidance is only in the inspect panel (as a badge + advisory field), not in the filter help text.

### 6. Does the inspect panel remain attached to the correct card?

**Yes.** `inspectReviewItem(id)` looks up the item from `reviewQueue.review` by ID. After `loadReviewQueue()`, the item is fetched fresh from the server — any state changes (report count updates, near-duplicate resolution) are reflected in the next render. The `data-review-id` attribute on the card allows `scrollToReviewAnchor` to locate it. The "N of M" position indicator recalculates from the current filtered list on each render.

**After D-164B (two-step approve):** Between the first and second approve clicks, `renderReviewList()` re-renders but `inspectedReviewItem` is still set — the panel remains open and the card remains `review-card-selected`. The Approve button changes to "Confirm approve public ✓" and a Cancel button appears. The panel stays attached.

### 7. Are keyboard shortcuts discoverable enough?

**No — only visible inside the inspect panel.** The hint line "A approve · K keep · R reject · [ ] prev/next · Esc close" appears below the navigation row in the inspect panel, and only while the panel is open. An admin who never opens the inspect panel does not know keyboard shortcuts exist.

Additionally, after D-164B the `A` shortcut requires two presses. The hint still says "A approve" — an admin using keyboard navigation will arm the approve state and then have no visible prompt about what to press next to confirm. The inspect panel re-renders with the "Confirm approve public ✓" button, so a mouse-user would notice the change, but a pure keyboard user may not look at the button and may be confused why `A` didn't approve.

### 8. Does scroll/anchor behaviour still work after D-164B?

**Yes, functionally.** The two-step approve adds one intermediate `renderReviewList()` call (on first click) with no scroll. The confirm call flows through the normal `reviewDecisionUI()` path with `scrollToReviewAnchor`. The only behavioural change is that after approval the inspect panel closes and the view scrolls to the first visible card rather than the next-in-sequence item (because the approved item is no longer in the Pending filter).

**No regression** from D-164B is present in scroll behaviour.

### 9. Are any admin token values logged/rendered/exposed?

**No.** Confirmed:
- `adminToken()` reads from `localStorage` — never renders the value in the DOM (field is now `type="password"`)
- No `toast()` call includes `adminToken()`
- No `console.log/warn/error` includes `adminToken()`
- `adminHeaders()` sends the token via `x-humanx-admin` header — not in the URL, body, or response
- `loadReviewQueue()` error message comes from `e.message` (`ADMIN_REQUIRED`) — never includes the token value
- `reviewDecisionUI()` error message is `e.message || 'Review action failed'` — never includes the token

### 10. What is the safest D-165B implementation patch?

**Three targeted copy and UX improvements. No backend changes.**

1. **Update keyboard hint copy** to reflect two-step approve: "A arm approve · A again confirm · K keep · R reject · [ ] prev/next · Esc close"
2. **Add `truth-derived` filter help text** and empty state explanation
3. **Improve error state** when token is invalid/missing after a load attempt — add a "re-enter token" note or scroll-to-form link near the "Review unavailable" panel

All three are copy/UX only. No backend changes, no state model changes, no new global variables.

---

## Friction Points

1. **Keyboard hint says "A approve" but A now requires two presses** — confusing after D-164B
2. **No retry button on "Review unavailable" error** — admin must scroll up to token form
3. **`truth-derived` filter has no help text or specific empty state** — advisory but missing guidance
4. **`pendingApproveReviewId` not cleared on filter change** — stale arm state possible across filter switches (low risk, arm still requires confirm)
5. **Filter state persists across tab switches** — admin returning to Review may see a filtered empty state without realising a different filter has items
6. **No "new since last visit" signal** — mentioned in D-164A, still open
7. **Loading indicator is bare text** — no spinner or visual feedback for slow queue loads

---

## Privacy / Public Boundary Verdict

**Clean.** No admin token, owner token, invite code, email, or private field is rendered in any review UI state. Error messages are `esc()`-cleaned. The `user_id` shown in the inspect panel is admin-only content — correct for provenance tracking.

---

## Recommended D-165B Implementation Plan

**Goal:** Three copy/UX fixes. All frontend-only, all in `app-v10.js`. No backend changes.

### 1. Update keyboard hint to reflect two-step A (required)

Current hint string in `renderReviewInspectPanel()`:

```
A approve · K keep · R reject · [ ] prev/next · Esc close
```

Change to:

```
A arm · A again confirm · K keep · R reject · [ ] prev/next · Esc close
```

This is the single most important D-165B fix — it aligns the keyboard hint with actual behaviour after D-164B.

### 2. Add truth-derived filter help text (recommended)

In `reviewFilterHelpText()`, add entry for `'truth-derived'`:

```
'truth-derived': 'Claims created via Pressure-test from a public Truth. Check the parent Truth before approving — category-echo and borderline-origin badges are advisory signals.'
```

In `reviewEmptyText()`, add entry for `'truth-derived'`:

```
'truth-derived': '<p class="small">No truth-derived claims in queue.</p><p class="small review-first-note">Claims created from a Truth via Pressure-test appear here. Check the parent Truth and any category-echo or borderline-origin badges before approving.</p>'
```

### 3. Improve "Review unavailable" error state (recommended)

Current error panel:

```html
<h3>Review unavailable</h3>
<p class="small">${esc(e.message||e)}</p>
```

Change to give admin a path forward without scrolling:

```html
<h3>Review unavailable</h3>
<p class="small">${esc(e.message||e)}</p>
<p class="small review-token-error-note">If the token is missing or incorrect, scroll up to re-enter it.</p>
```

### What NOT to Change

- `requireAdmin` gating — correct
- `safeEqual()` constant-time comparison — correct
- `reviewDecisionUI()` error recovery — correct
- `reviewCleanupUI()` artefact detection — correct
- `pendingApproveReviewId` / `pendingRejectReviewId` / `pendingCleanupReviewId` state model — correct
- Scroll/anchor behaviour — working correctly
- Toast messages — correct
- Any backend route
- Owner-token — frozen (D-149H)
- No migration, no wrangler.toml

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-165B plan.
