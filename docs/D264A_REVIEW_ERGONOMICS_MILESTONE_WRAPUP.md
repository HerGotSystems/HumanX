# D-264A — Review Ergonomics Milestone Wrap-Up

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3011 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D264A_REVIEW_ERGONOMICS_MILESTONE_WRAPUP.md`
**CSS changes:** None
**App changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Creates a single authoritative milestone document for the full D-227 → D-263 Review ergonomics run. Nine mini-arcs progressively improved the admin-only Review/moderation UI over the course of this run. This document records what changed, what is locked, the current baseline, and the recommended next lanes so the project has one place to look before starting any future Review queue work.

---

## D-227 → D-263 Full Run Summary

All work confined to the admin-only Review queue render surface. No public profile exposure. No backend/API/schema changes. No moderation semantic changes.

| Arc | Tasks | What it delivered | Tests added | Baseline after |
|-----|-------|------------------|-------------|----------------|
| Review queue ergonomics | D-227A–D-232A | Selected-card anchor (`data-review-selected`), scroll preservation (`withReviewScrollPreserved`), confirm-state clarity (`data-review-confirming` / `review-confirm-armed`), decision feedback banner (`role="status" aria-live="polite"`), regression lock (37 tests), checkpoint | 113 | 2403 |
| Duplicate advisory UX | D-233A–D-238A | Resolve-similar scroll anchor parity (`scrollToReviewAnchor`), structured advisory banner (`review-similar-note`), Copy ID (`copySimilarClaimId`), duplicate-target prefill (`markDuplicateUI` optional `suggestedCanonicalId`), regression lock (41 tests), checkpoint | 123 | 2526 |
| Review-to-Study navigation | D-239A–D-241A | Back-to-Review scroll restore — `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` in `backToArena()`; Study back button `← Back to Review`; regression lock (30 tests), checkpoint | 47 | 2573 |
| Review next-item flow | D-242A–D-244A | "Open next item →" button in decision feedback banner; `reviewDecisionFeedbackNextId` state; search-aware candidate capture; post-reload validity check; regression lock (34 tests), checkpoint | 65 | 2638 |
| Review card metadata density | D-245A–D-249A | Inline date (`Updated {age}` in `.review-card-meta`); readable score labels (`Evidence N · Test N · Survive N`); advisory hint grouping (`.review-card-hints` secondary row); regression lock (41 tests), checkpoint | 84 | 2722 |
| Review search/filter clarity | D-250A–D-255A | Active filter/sort summary (`renderReviewActiveSummary`); zero-results clarity (`renderReviewEmptyState`); ambiguous filter helper copy (`renderReviewFilterHelper`); client-side search (`applyReviewSearch`, `reviewSearchQuery`, `renderReviewSearchRow`); search-aware pipeline `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))`; regression lock (64 tests), checkpoint | 155 | 2877 |
| Duplicate/similar label clarity | D-256A–D-257A | `Dupes` → `Dupes + Similar` copy rename in 6 locations; predicate/key/badge/actions unchanged; checkpoint | 26 | 2903 |
| Mobile control wrapping | D-258A–D-260A | Sort bar isolation (`.review-sort-bar` / `.review-sort-label` / `.review-sort-select`); decision feedback flex-wrap; empty-actions flex; regression lock (35 tests), checkpoint | 56 | 2959 |
| Inspect panel action spacing | D-261A–D-263A | Desktop Study push (`margin-left:auto`); mobile full-width tap targets (`width:100%`); mobile soft separator (`border-top:1px solid rgba(255,255,255,.06)` on `.review-inspect-markdup` / `.review-inspect-resolvesim`); regression lock (33 tests), checkpoint | 52 | 3011 |

**Total tests added across full run:** 721.
**Code/CSS deploys:** 14 owner manual terminal deploys (one per implementation slice).
**Audit/lock/checkpoint tasks:** No deploy for any audit, regression lock, or checkpoint doc.
**Latest deployed Worker version:** `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` (D-261C, 2026-07-01).

---

## Current Baseline

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3011 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Current Review Queue Behavior Summary (post D-264A)

| Feature | Behavior |
|---------|---------|
| Card scan density | Denser and easier to scan — date inline, hints grouped, advisory-only badges separated |
| Date display | `Updated {age}` in `.review-card-meta` concat (not a standalone `<p>` row) |
| Score labels | `Evidence N · Test N · Survive N` (was `ev:N ts:N sv:N`) |
| Advisory hints | `.review-card-hints` secondary row: `needs sharpening` / `category echo` / `? borderline origin` — conditional, absent when none apply |
| Active summary | `renderReviewActiveSummary(list)`: `Showing: {filter} · {n} item(s) · Sorted: {sort}` + `· Search: "{query}"` when active |
| Zero-results state | `renderReviewEmptyState()`: explains current filter/sort/search, offers `Clear search` / `Show all review items` recovery |
| Filter helper copy | `renderReviewFilterHelper()`: one-line hint for `~Quality`, `Dupes + Similar`, `~Similar` only |
| Combined filter label | `Dupes + Similar` (predicate: `duplicate_of \|\| near_duplicate_of`; internal key: `duplicate`) |
| `~Similar` filter | Advisory-only strict subset of `Dupes + Similar`; `near_duplicate_of` only |
| Client-side search | `reviewSearchQuery` state; `applyReviewSearch(list)`; `renderReviewSearchRow()`; 10-field case-insensitive match |
| Search pipeline | `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))` — filter → search → sort |
| Next-item button | "Open next item →" in feedback banner after Approve/Reject; absent for Keep Pending; search-aware candidate |
| Inspect prev/next | Search-aware `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` in `renderReviewInspectPanel` |
| Back-to-Review scroll | `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` on return from Study View |
| Confirm-state clarity | `data-review-confirming="approve\|reject\|cleanup"` on armed container; `review-confirm-armed` class |
| Decision feedback | `role="status" aria-live="polite"` banner; Dismiss button; does not steal focus |
| Sort bar wrapping | `.review-sort-bar` flex isolation; `.review-sort-label` `white-space:nowrap;flex-shrink:0`; `.review-sort-select` `min-width:120px` |
| Feedback wrapping | `.review-decision-feedback` `flex-wrap:wrap`; buttons `flex-shrink:0` |
| Empty-actions wrapping | `.review-empty-actions` `display:flex;flex-wrap:wrap;gap:6px` |
| Inspect action spacing | Desktop: Study `margin-left:auto` pushes right. Mobile: all buttons `width:100%`; soft separator before dup/advisory group |
| Duplicate/advisory semantics | Unchanged — `markDuplicateUI`, `resolveSimilarUI`, advisory-only `near_duplicate_of`, confirm-only merge |
| Moderation actions | Unchanged — Approve/Keep/Reject/Archive routes, decision values, payload fields |

---

## Active Regression Locks

| Lock | Tasks | Tests | What it guards |
|------|-------|-------|----------------|
| D-231A review ergonomics | D-227→D-230 features | 37 | Selected-card anchor, scroll preservation, confirm-state, decision feedback |
| D-237A duplicate advisory | D-233→D-236 features | 41 | Scroll anchor, advisory banner, Copy ID, duplicate-target prefill, semantics |
| D-240A review-to-study navigation | D-239B feature | 30 | Back-to-Review scroll, Study back button, RAF scroll, navigation state |
| D-243A next-item flow | D-242B feature | 34 | Feedback state, candidate capture, validity, navigation-only action |
| D-248A card metadata density | D-245B/D-246A/D-247A features | 41 | Inline date, readable scores, advisory hint grouping |
| D-254A search/filter clarity | D-250B/D-251A/D-252A/D-253A features | 64 | Active summary, zero-results, helper copy, search pipeline |
| D-259A mobile control wrapping | D-258B features | 35 | Sort bar CSS, feedback flex-wrap, empty-actions flex |
| D-262A inspect action spacing | D-261B features | 33 | Desktop Study push, mobile full-width, calm separator |

**Total lock tests:** 315. All pass at `3011 passed, 0 failed`.

---

## Deploy State Summary

| Slice type | Deploy rule |
|------------|-------------|
| Code/CSS implementation (D-xxxB) | Owner manual terminal deploy + D-xxxC live closeout required before proceeding |
| Audit (D-xxxA doc) | No deploy |
| Regression lock (D-xxxA tests+docs) | No deploy |
| Milestone checkpoint (D-xxxA docs) | No deploy |

| Task | Deploy |
|------|--------|
| D-227B–D-230B | Owner deploy PASS — D-227C/D-228B/D-229B/D-230B live closeouts |
| D-231A, D-232A | No deploy |
| D-233B–D-236B | Owner deploy PASS — D-233C/D-234B/D-235B/D-236B live closeouts |
| D-237A, D-238A | No deploy |
| D-239B | Owner deploy PASS — D-239C live closeout (13/13) |
| D-240A, D-241A | No deploy |
| D-242B | Owner deploy PASS — D-242C live closeout (34/34) |
| D-243A, D-244A | No deploy |
| D-245B, D-246A, D-247A | Owner deploy PASS — D-245C (24/24), D-246B (28/28), D-247B (31/31) |
| D-248A, D-249A | No deploy |
| D-250B, D-251A, D-252A, D-253A | Owner deploy PASS — D-250C (29/29), D-251B (20/20), D-252B, D-253B (41/41) |
| D-254A, D-255A | No deploy |
| D-256B | Owner deploy PASS — D-256C live closeout (35/35) |
| D-257A | No deploy |
| D-258B | Owner deploy PASS — D-258C live closeout (39/39) |
| D-259A, D-260A | No deploy |
| D-261B | Owner deploy PASS — D-261C live closeout (41/41) · Worker `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` |
| D-262A, D-263A, D-264A | No deploy |
| **Current deploy needed** | **No** |

---

## Public / Privacy Guarantees

The following internals are confirmed absent from `renderPublicProfileHtml` across the full D-227→D-263 run, locked by the regression tests cited:

| Internal | Locked by |
|----------|-----------|
| `data-review-selected`, `review-confirm-armed`, `data-review-confirming`, decision-feedback copy | D-231A |
| `copySimilarClaimId`, `markDuplicateUI`, `resolveSimilarUI`, "Similar claim advisory", advisory CSS classes | D-237A |
| `openReviewClaimStudy`, `backToArena`, `lastModeBeforeStudy`, "← Back to Review" | D-240A |
| `reviewDecisionFeedbackNextId`, `review-feedback-next`, "Open next item" | D-243A |
| `review-card-hints`, `review-card-head`, `review-card-meta`, `reviewCard()` call | D-248A |
| `reviewSearchQuery`, `review-search`, `clearReviewSearch`, `review-filter-helper`, `review-active-summary` | D-254A |
| `.review-sort-bar`, `.review-decision-feedback`, `.review-empty-actions`, D-258B CSS classes | D-259A |
| `.review-inspect-actions`, `btn-study-review`, `review-inspect-markdup`, `review-inspect-resolvesim` | D-262A |

No new public data fields were introduced in any task in the full run.
No backend/API/migration/schema/CSP/external asset changes were made in any task in the full run.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` were not modified by any task in the D-227→D-263 Review ergonomics run (beyond the D-242A compatibility fix aligning the D-98B noscript test with the upstream Drift/Belief merge).

**Rule:** Do not touch `public/belief-drift-expansion.js` or `public/index.html` during Review queue work unless a failing test requires a minimal, explicitly documented compatibility fix.

---

## Safe Next-Work Rules (Review Ergonomics Protected Area — Rules 60–65)

60. **Lock preservation** — Any Review queue/card/filter/search/inspect/action layout or CSS change must either pass D-248A, D-254A, D-259A, and D-262A regression lock tests unchanged, or update each affected lock with explicit owner approval and a new documented task.
61. **No moderation semantics change under a UI polish task** — Approve/Keep/Reject/Archive routes, decision values, and payload fields must never change under a task scoped to CSS, copy, or layout.
62. **No duplicate/advisory semantics change under a label/layout task** — `markDuplicateUI`, `resolveSimilarUI`, `near_duplicate_of` advisory semantics, and `Dupes + Similar` filter predicate must never change under a task scoped to copy, CSS, or label clarity.
63. **No search/filter/sort predicate change under a copy/CSS task** — `applyReviewFilter`, `applyReviewSearch`, `applyReviewSort`, and all filter chip keys/labels must never change under a task scoped to visual polish or copy.
64. **No Review internals on public profile pages** — No class, function, state variable, or copy string from the Review queue may appear in `renderPublicProfileHtml`. Any new Review feature must add a public-boundary test.
65. **No live PASS without owner deploy and browser sanity** — Static checks passing locally does not constitute a live closeout. Every code/CSS deploy requires owner manual terminal execution + browser sanity check before the live closeout commit.

---

## Recommended Next Lanes

These are suggestions only. Do not start any until explicitly assigned.

| Lane | Notes |
|------|-------|
| Study entry button style consistency | D-239A F-2–F-4: button prominence, browser-back support, Study entry button style inconsistency |
| Claim/RunPack flow clarity audit | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, and framing between main app and Belief Engine |
| Review queue future follow-up | Only if owner finds live friction — full ergonomics run is now closed |
