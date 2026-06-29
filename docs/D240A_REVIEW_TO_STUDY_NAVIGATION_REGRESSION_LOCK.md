# D-240A — Review-to-Study Navigation Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2573 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D240A_REVIEW_TO_STUDY_NAVIGATION_REGRESSION_LOCK.md`, `docs/README.md`
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

Lock the D-239A/D-239B review-to-study navigation behavior so future Study view, Review UI, or navigation changes cannot accidentally remove:

- The Review-origin capture mechanism (`lastModeBeforeStudy`, `lastInspectedReviewItemId`)
- The "← Back to Review" button in Study header
- The `backToArena()` inspect-item restore behavior
- The post-render `requestAnimationFrame` scroll to the restored card
- The no-queue-reload guarantee
- Public exposure isolation from review-to-study internals

Any future work touching Study/Review navigation must either pass all these tests unchanged or update this lock with owner approval before merging.

---

## D-239A/D-239B/D-239C Summary

| Task | What it delivered |
|------|-----------------|
| D-239A | Audit — found F-1: `backToArena()` restores inspect state but doesn't scroll; docs only |
| D-239B | Fix — `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` added to `backToArena()` review branch; 17 smoke tests |
| D-239C | Live closeout — 13/13 PASS (owner deploy 2026-06-29) |

---

## What is Now Locked

### Review-origin capture guarantee

- `openReviewClaimStudy(id)` sets `lastModeBeforeStudy = 'review'` before navigating
- `openReviewClaimStudy(id)` stores `lastInspectedReviewItemId = inspectedReviewItem?.id || null` before navigating
- Review inspect panel still calls `openReviewClaimStudy` for all Study action buttons
- `openReviewClaimStudy` is exposed on `window` for `onclick` use

### Back-to-Review button guarantee

- Study header renders `'← Back to Review'` when `lastModeBeforeStudy === 'review'`
- Study back button uses `data-action="backToArena"`
- `backToArena` is exposed on `window`

### Restored inspected item guarantee

- `backToArena()` review branch: stores `_savedId = lastInspectedReviewItemId`, then clears `lastInspectedReviewItemId`
- Finds item in `reviewQueue.review` and restores `inspectedReviewItem`
- Calls `setMode('review')` → `render()` → `renderReview()` → `renderReviewList()` with inspect panel re-rendered

### Post-render scroll-to-card guarantee (D-239B)

- `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` fires after `setMode('review')`
- `requestAnimationFrame` defers scroll until after DOM write completes
- Guard `if (_savedId)` makes a null saved ID a safe no-op

### No queue reload guarantee

- `loadReviewQueue()` is NOT called in `backToArena()` — queue data is the already-cached `reviewQueue.review` array
- No `fetch()`, no `api()` call added to the return path

### Browser history unchanged

- No `pushState`, no `replaceState` in `backToArena()`

### Non-review Study entry unchanged

- `backToArena()` vault / truths / me / arena branches are untouched

### Public exposure guarantees

All confirmed absent from `renderPublicProfileHtml`:
- `openReviewClaimStudy`
- `backToArena`
- `lastModeBeforeStudy`
- `lastInspectedReviewItemId`
- `'← Back to Review'`

---

## Future Rule

> Any task touching Study View rendering, Review-to-Study navigation, `openReviewClaimStudy`, `backToArena`, `lastModeBeforeStudy`, or `lastInspectedReviewItemId` must either pass all D-240A regression tests unchanged, or update this lock with explicit owner approval before merging.

---

## Tests Added (30 new)

### 1. Review-origin capture lock (4 tests)

| Test | What it confirms |
|------|-----------------|
| `openReviewClaimStudy sets lastModeBeforeStudy to "review"` | Origin saved |
| `openReviewClaimStudy stores lastInspectedReviewItemId` | Item ID saved |
| `inspect panel still calls openReviewClaimStudy for Study action` | Entry point intact |
| `openReviewClaimStudy exposed on window` | onClick accessible |

### 2. Study header Back-to-Review lock (3 tests)

| Test | What it confirms |
|------|-----------------|
| `Study header renders "← Back to Review" when origin is review` | Return label |
| `Study back button uses data-action="backToArena"` | Button wiring |
| `backToArena exposed on window` | onClick accessible |

### 3. Back-to-Review restore lock (6 tests)

| Test | What it confirms |
|------|-----------------|
| `backToArena stores _savedId before clearing lastInspectedReviewItemId` | Save-before-clear |
| `backToArena restores inspectedReviewItem from saved ID` | Item restored |
| `backToArena calls setMode("review")` | Mode restored |
| `backToArena does not call loadReviewQueue` | No queue reload |
| `backToArena does not call fetch or api()` | No backend call |
| `backToArena does not use pushState or replaceState` | No history change |

### 4. Post-render scroll lock (3 tests)

| Test | What it confirms |
|------|-----------------|
| `backToArena uses requestAnimationFrame` | Post-render timing |
| `backToArena calls scrollToReviewAnchor(_savedId) in RAF` | Correct target |
| `RAF scroll guarded by _savedId` | Null-safe |

### 5. Review ergonomics compatibility lock (6 tests)

| Test | What it confirms |
|------|-----------------|
| `D-227B scrollSelectedReviewCardIntoView still exists` | D-227B intact |
| `D-228A withReviewScrollPreserved still exists` | D-228A intact |
| `D-229A data-review-confirming still used` | D-229A intact |
| `D-230A reviewDecisionFeedback state still exists` | D-230A intact |
| `D-233B resolveSimilarUI still calls scrollToReviewAnchor` | D-233B intact |
| `D-236A "Use as duplicate target" button still present` | D-236A intact |

### 6. Semantics / public exposure lock (6 tests)

| Test | What it confirms |
|------|-----------------|
| `mark-duplicate route unchanged` | Route locked |
| `renderPublicProfileHtml excludes openReviewClaimStudy` | Not public |
| `renderPublicProfileHtml excludes backToArena` | Not public |
| `renderPublicProfileHtml excludes lastModeBeforeStudy` | Not public |
| `renderPublicProfileHtml excludes lastInspectedReviewItemId` | Not public |
| `renderPublicProfileHtml excludes "← Back to Review"` | Not public |

### 7. Deploy integrity lock (2 tests)

| Test | What it confirms |
|------|-----------------|
| `D-240A does not modify app-v10.js` | Tests+docs only |
| `D-240A does not modify worker.js` | Tests+docs only |

**Hardening smoke:** 2573 passed / 0 failed (+30 new)
**Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)

---

## Confirmations

- **App changed:** No
- **CSS changed:** No
- **Worker unchanged:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **D-239 review-to-study behavior locked:** Confirmed
- **No queue reload guarantee locked:** Confirmed
- **Non-review Study entry unchanged:** Confirmed
- **Browser history unchanged:** Confirmed
- **Moderation actions unchanged:** Confirmed
- **Duplicate/advisory semantics unchanged:** Confirmed
- **No public profile exposure:** Confirmed
- **Deploy needed:** No
