# D-239A — Review-to-Study Navigation Audit

**Scope:** Docs / audit only
**Status:** COMPLETE — no code changes
**Baseline:** 2526 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D239A_REVIEW_TO_STUDY_NAVIGATION_AUDIT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Backend/API change:** None
**Deploy needed:** No

---

## Purpose

Audit the current navigation from Review queue / inspect panel into Study View, before making UI changes. Identify where moderators leave Review, what context is preserved, whether there is a clear return path, and what a safe minimal improvement looks like.

This follows D-233A F-3 ("openReviewClaimStudy navigates away from review queue — path back not prominent") and the D-238A milestone recommendation to audit open related claim navigation.

---

## 1. Current Navigation Surface

### Entry points from Review to Study

All five entry points call `openReviewClaimStudy(id)`:

| Location | Button label | Call |
|----------|-------------|------|
| Inspect panel — `linked` claim field | `{linked_id} ↗` (btn-link-small) | `openReviewClaimStudy(linked)` |
| Inspect panel — `Similar claim (advisory)` field | `↗ Study` (btn-link-small) | `openReviewClaimStudy(nearDup)` |
| Inspect panel — evidence/pressure item with claim | `Study Parent Claim ↗` (btn-study-review) | `openReviewClaimStudy(item.claim_id)` |
| Inspect panel — truth item with linked claim | `Study Linked Claim ↗` (btn-study-review) | `openReviewClaimStudy(linked_claim)` |
| Inspect panel — bottom actions (claim type) | `Open Study View ↗` (primary, btn-study-review) | `openReviewClaimStudy(id)` |

All five reach the same function. There is no deep-link, hash route, or `pushState` — navigation is a direct client-side mode switch.

### `openReviewClaimStudy(id)` — what it does

```js
async function openReviewClaimStudy(id) {
  lastModeBeforeStudy = 'review';
  lastInspectedReviewItemId = inspectedReviewItem?.id || null;
  mode = 'arena';
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-arena')?.classList.add('active');
  await selectClaim(id);
}
```

Saves:
- `lastModeBeforeStudy = 'review'`
- `lastInspectedReviewItemId` = the current `inspectedReviewItem.id` (null if none)

Navigates:
- Sets `mode = 'arena'`
- Activates the Claims/Arena tab in the tab bar
- Calls `selectClaim(id)` → fetches claim data → calls `renderStudy()`

No hash, no `pushState`, no `sessionStorage`, no `localStorage`. State is in module-scope JS variables only.

---

## 2. Current Return Path

### `"← Back to Review"` button in Study header

`renderStudy()` renders a study-header nav with:

```
lastModeBeforeStudy === 'review' → '← Back to Review'
lastModeBeforeStudy === 'vault'  → '← Back to Vault'
...
```

The button is always present when `renderStudy()` renders. Label dynamically reflects origin.

### `backToArena()` — what it does on review return

```js
function backToArena() {
  document.body.classList.remove('study-mode');
  selected = null;
  const _origin = lastModeBeforeStudy;
  if (_origin === 'review') {
    const _savedId = lastInspectedReviewItemId;
    lastInspectedReviewItemId = null;
    if (_savedId) {
      const _found = (reviewQueue.review || []).find(i => i.id === _savedId);
      if (_found) inspectedReviewItem = _found;
    }
    setMode('review');
  } else { ... }
}
```

`setMode('review')` → `render()` → `renderReview()` → `renderReviewList()` (inside renderReview).

**What works:**
- `lastModeBeforeStudy = 'review'` → "← Back to Review" appears correctly
- `lastInspectedReviewItemId` → `inspectedReviewItem` is restored from saved ID
- `setMode('review')` → full re-render of review page with inspected item highlighted

**What is missing:**

| Gap | Detail |
|-----|--------|
| No scroll to selected card | `backToArena()` does NOT call `scrollToReviewAnchor()` or `scrollSelectedReviewCardIntoView()` |
| No scroll restoration | review queue scroll position is not preserved across Study navigation (only `lastArenaScrollTop` is preserved for Claims mode, not for Review) |
| No queue reload | Queue data is not refreshed on return — this is intentional and correct; stale queue is fine for returning |

### Browser Back behavior

The browser Back button has no effect — there is no `pushState`, no hash route, no history entry created by `openReviewClaimStudy`. Pressing browser Back after entering Study from Review exits the whole app or goes to the previous browser page, not to the Review queue.

### Review queue state on return

`reviewQueue.review` is the module-scope cached queue array. It is NOT cleared or reloaded by `backToArena()`. If the moderator did not make a decision before going to Study, the item is still in the queue and `inspectedReviewItem` is correctly restored. If the moderator did make a decision during Study (unlikely — they would need to switch back to Review to do so), the queue data would be stale.

---

## 3. Current UX Friction

### F-1: No scroll-to-card after "← Back to Review"

The inspected item is correctly restored in state (`inspectedReviewItem`), and `renderReviewList()` re-renders the inspect panel for that item. However, if the review queue is long and the selected card is not in the visible viewport, the moderator must scroll manually to find it.

`scrollSelectedReviewCardIntoView()` (D-227B) and `scrollToReviewAnchor()` (D-233B) both exist and solve this problem for other actions, but neither is called in `backToArena()`.

**Impact:** Medium. Long queues make it easy to lose the review item position after returning from Study.

### F-2: "← Back to Review" button is small and inline with status badge

The back button is inside `<div class="study-nav">` at the top of the study header. It is correct and functional, but visually it shares the line with a status badge. On narrow screens or when the claim title is long, the button may be less prominent.

**Impact:** Low. The button exists and works. A styling/prominence improvement is a separate slice.

### F-3: Browser Back doesn't return to Review

No `pushState`. If a moderator presses browser Back expecting to return to Review, they will leave the app or go to the previous browser session URL.

**Impact:** Low for trained moderators; medium for new users. Implementing proper history requires browser-history work, which is a larger, separate slice with its own risks.

### F-4: Entry points are visually inconsistent

The five entry buttons use different styles:
- `btn-link-small` (inline text with ↗ icon) — used for `linked` field ID and `Similar claim (advisory)` ↗ Study
- `btn-study-review` (block button) — used for "Study Parent Claim ↗", "Study Linked Claim ↗", "Open Study View ↗"
- The "Open Study View ↗" button is also `primary` (filled/colored) while the others are not

All call the same function. The visual inconsistency may cause moderators to overlook some entry points or be surprised by the navigation behavior.

**Impact:** Low. Minor consistency issue.

### F-5: Similar advisory field ↗ Study vs "Use as duplicate target"

After D-236A, the similar advisory field has three affordances:
- `↗ Study` → navigates to Study View for the advisory claim
- `[Copy ID]` → copies ID to clipboard (no navigation)
- `[Use as duplicate target]` → opens mark-duplicate modal (no navigation)

A moderator clicking `↗ Study` to read the advisory claim text leaves Review. The return path ("← Back to Review") exists but adds two steps (read claim → click back → rediscover queue position). The Copy ID + "Use as duplicate target" affordances from D-235A/D-236A reduce the need to visit Study for ID purposes, but not for reading the claim text.

**Impact:** Medium. The most common review-advisory workflow (moderator wants to read the advisory claim content before deciding) involves leaving Review and returning.

---

## 4. Safe Next Improvements

Ordered by impact and safety. All are frontend-only with no backend changes needed.

### D-239B (recommended next): Scroll to selected card after returning from Study

Add `scrollToReviewAnchor(savedId)` or `scrollSelectedReviewCardIntoView()` at the end of the `_origin === 'review'` branch in `backToArena()`, wrapped in `requestAnimationFrame` to allow the DOM to render first.

```js
// Inside backToArena(), after setMode('review'):
if (_savedId) {
  requestAnimationFrame(() => scrollToReviewAnchor(_savedId));
}
```

**Risk:** Very low. `scrollToReviewAnchor` already guards against null/missing elements. No state change, no API call, no backend. Purely cosmetic.
**Tests needed:** 1–3 new smoke tests asserting `backToArena` calls scroll after restore.
**Deploy needed:** Yes (app change).

### D-240A (optional): Make "← Back to Review" button more prominent when origin is Review

Add a `review-origin` class or `data-origin="review"` to the study-header back button when `lastModeBeforeStudy === 'review'`, and style it slightly differently (e.g., bolder, or with a distinct CSS class).

**Risk:** Low. CSS-only change.
**Tests needed:** CSS class present in study header when origin is review.
**Deploy needed:** Yes.

### D-241A (later): Browser back support for Review → Study transitions

Use `pushState` or `hashchange` to create a browser history entry when entering Study from Review, so browser Back returns to Review. This is a larger change with more risk (state management, hash routing) and should be specced separately before implementation.

**Risk:** Medium. History API changes can have unexpected interactions with existing mode switching.
**Prerequisite:** Separate spec/design document.

### D-242A (whenever): Review-to-study navigation regression lock

After D-239B (and optionally D-240A), add a smoke test block locking the return path: `backToArena()` calls scroll when returning from Study, `openReviewClaimStudy` saves `lastInspectedReviewItemId`, `lastModeBeforeStudy` is `'review'` after the call, etc.

---

## 5. Risk Boundaries

- No route/backend/API changes in this audit or recommended slices.
- No new Study data fetch — Study content comes from existing `selectClaim()`.
- No public profile exposure — all navigation is admin-only review UI.
- No moderation action change — "← Back to Review" does not approve, reject, or modify queue state.
- No duplicate/advisory semantics change.
- No browser-history rewrite (D-241A would require its own separate spec).
- No persistent storage — `lastModeBeforeStudy` and `lastInspectedReviewItemId` are module-scope JS variables, not persisted.

---

## 6. Test Recommendations (for future D-242A or D-239B close)

| Test | What it locks |
|------|--------------|
| `openReviewClaimStudy sets lastModeBeforeStudy to 'review'` | Origin saved correctly |
| `openReviewClaimStudy saves lastInspectedReviewItemId from inspectedReviewItem` | Context saved before navigation |
| `Study header renders "← Back to Review" when lastModeBeforeStudy is review` | Return button copy correct |
| `backToArena restores inspectedReviewItem from lastInspectedReviewItemId` | Review item restored |
| `backToArena calls setMode('review') when origin is review` | Mode restored |
| `backToArena calls scrollToReviewAnchor or equivalent after restore (D-239B)` | Scroll gap closed |
| `renderPublicProfileHtml does not expose openReviewClaimStudy or backToArena` | No public exposure |
| `Study view from non-review origin leaves Review queue state unchanged` | No cross-origin corruption |

---

## 7. Existing Smoke Test Coverage

The following are already covered (no new tests added in D-239A):

| Already tested | Where |
|---------------|-------|
| `openReviewClaimStudy` function exists | D-233A |
| Inspect panel similar field links to `openReviewClaimStudy` | D-233A / D-234A |
| `scrollSelectedReviewCardIntoView` exists and works (D-227B) | D-227B |
| `scrollToReviewAnchor` called after resolveSimilarUI and markDuplicateUI | D-233B / D-237A |
| `inspectReviewItem` calls `scrollSelectedReviewCardIntoView` via RAF | D-227B |

The specific gap — `backToArena()` does not scroll after restoring the item — is not yet tested. D-239B will add code + tests to close it.

---

## Summary of Findings

| # | Finding | Severity | Fixed by |
|---|---------|----------|----------|
| F-1 | No scroll to selected card after "← Back to Review" | Medium | D-239B |
| F-2 | Back button visually small/inline with status badge | Low | D-240A (optional) |
| F-3 | Browser Back doesn't return to Review (no pushState) | Low | D-241A (separate spec needed) |
| F-4 | Study entry buttons visually inconsistent (btn-link-small vs btn-study-review vs primary) | Low | Styling cleanup (TBD) |
| F-5 | ↗ Study on similar advisory requires leaving Review to read claim text; return adds friction | Medium | D-239B (scroll) / later (preview) |

**Recommended next code slice:** D-239B — scroll to selected card after returning from Study to Review.

---

## Confirmations

- **App changed:** No
- **CSS changed:** No
- **Worker unchanged:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No public profile exposure:** Confirmed
- **No moderation action change:** Confirmed
- **No duplicate/advisory semantics change:** Confirmed
- **No browser-history rewrite:** Confirmed — not in this audit
- **Deploy needed:** No
