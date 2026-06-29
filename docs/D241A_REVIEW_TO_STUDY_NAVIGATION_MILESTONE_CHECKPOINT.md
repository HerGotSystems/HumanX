# D-241A — Review-to-Study Navigation Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Baseline:** 2573 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D241A_REVIEW_TO_STUDY_NAVIGATION_MILESTONE_CHECKPOINT.md`
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

Update the authoritative project checkpoint (`docs/PROJECT_STATE.md`) after the completed D-239 → D-240 review-to-study navigation mini-arc. Records the arc summary, current guarantees, privacy state, deployment state, and safe next-work rules for the Review/Study navigation domain.

---

## D-239 → D-240 Mini-Arc Summary

| Task | Commit | What it delivered |
|------|--------|------------------|
| D-239A | `23b6a39` | Audit — 5 findings; F-1 (scroll gap, medium) identified as primary fix target; docs only |
| D-239B/C | `5c12a10`/`725f486` | Back-to-Review scroll restore — `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` in `backToArena()` review branch; 17 tests; live PASS 13/13 |
| D-240A | `cab9952` | Navigation regression lock — 30 tests across 7 categories; no deploy |

**Tests added in arc:** 17 + 30 = **47 new tests**
**Total hardening smoke after arc:** 2573 passed / 0 failed
**Deploys in arc:** 1 (D-239C — owner manual terminal)
**Docs/tests-only tasks:** D-239A, D-240A

---

## Current Baseline

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2573 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**Known warn:** `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Review-to-Study Navigation Guarantees

### Review-origin capture

- `openReviewClaimStudy(id)` sets `lastModeBeforeStudy = 'review'` before navigating to Study
- `openReviewClaimStudy(id)` saves `lastInspectedReviewItemId = inspectedReviewItem?.id || null` before navigating
- All five Study action buttons in the inspect panel call `openReviewClaimStudy`

### Back-to-Review button

- Study header renders `'← Back to Review'` when `lastModeBeforeStudy === 'review'`
- `data-action="backToArena"` on the back button; `backToArena` exposed on `window`

### Inspected item restore

- `backToArena()` review branch stores `_savedId`, clears `lastInspectedReviewItemId`, finds item in cached `reviewQueue.review`, restores `inspectedReviewItem`
- Calls `setMode('review')` → full re-render with inspect panel open for the restored item

### Post-render scroll to card (D-239B)

- `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` fires after `setMode('review')`
- `requestAnimationFrame` defers scroll until after DOM write completes
- `if (_savedId)` guard makes a null saved ID a safe no-op

### No queue reload

- `loadReviewQueue()` NOT called in `backToArena()` — stale-queue behavior on return is correct and expected

### No browser history change

- No `pushState` / `replaceState` in `backToArena()`

### Non-review origins unchanged

- vault / truths / me / arena branches in `backToArena()` all unchanged

---

## Privacy / Public Exposure Guarantees

All of the following are confirmed absent from `renderPublicProfileHtml` (locked by D-240A):

- `openReviewClaimStudy`
- `backToArena`
- `lastModeBeforeStudy`
- `lastInspectedReviewItemId`
- `'← Back to Review'`

No new public data fields introduced in D-239→D-240. No backend/API/migration/schema/CSP/external asset changes in the arc.

---

## Deployment State

| Task | State |
|------|-------|
| D-239A | Docs only — no deploy needed |
| D-239B | Owner deploy PASS — D-239C confirmed live (13/13) |
| D-240A | Tests / docs only — no deploy needed |
| D-241A | Docs only — **no deploy needed** |
| **Current** | **No deploy needed** |

---

## Safe Next Lanes

These are suggestions only. Do not start any without explicit assignment.

| Lane | Notes |
|------|-------|
| Review queue next-item flow audit | After a decision, auto-advance to next pending item — natural follow-on to D-239 navigation work |
| Open related claim / Study navigation follow-up | D-239A F-2–F-5 remaining: button prominence, browser-back support, Study entry button style consistency |
| Compact review card metadata/status chips | Denser card for long queues |
| Review search/filter clarity | Filter chip accessibility; filter counts; empty-state copy per-filter |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |

---

## Future Rules

> 1. Any change to `openReviewClaimStudy`, `backToArena`, Study view rendering, or `lastModeBeforeStudy`/`lastInspectedReviewItemId` state must either pass all D-240A regression tests unchanged, or update the D-240A lock with explicit owner approval before merging.
>
> 2. Do not add `pushState`, `replaceState`, or hash-based navigation to the Review/Study flow without a separate navigation spec.
>
> 3. Do not add `loadReviewQueue()` to the `backToArena()` return path without a deliberate spec — stale-queue behavior on return is correct and expected.
