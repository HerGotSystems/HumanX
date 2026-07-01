# HumanX Docs Index

Quick reference for all documentation in this folder.
Read the relevant file before starting any task that touches the area it covers.

---

## ⚠ Standing Warnings

These apply to every task in this repo unless the user explicitly overrides them.

| Warning | Detail |
|---|---|
| **Active Worker entrypoint** | `src/worker.js` — do not remove or rename without a deployment change |
| **Active frontend** | `public/index.html`, `public/app-v10.js`, `public/styles.css` — response shape changes will break these silently |
| **Belief Engine** | `public/apps/humanx-belief-engine/index.html` — standalone app, navigated to by hard redirect from the main frontend |
| **Do not rerun migration 0004** | `migrations/0004_unique_normalized_content.sql` is already applied to production D1. Running it again will fail. |
| **Do not rerun migration 0005** | `migrations/0005_add_home_tests_updated_at.sql` was applied manually via Cloudflare D1 console. Do not rerun it unless the target database is known to be missing `home_tests.updated_at`. |
| **Do not run Wrangler or D1 commands** | `wrangler d1 execute`, `wrangler deploy`, and all variants are off-limits unless the user explicitly requests them in the task. |
| **Keep tasks small and branch-based** | One branch per task. Show diff before committing. Stop after commit — do not push. The user pushes and merges manually. |

---

## Known-good checks

Run these locally before and after any change. All must pass with exit 0.

```sh
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

Expected results:

| Script | Expected |
|---|---|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2877 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |

**Note:** A `MODULE_TYPELESS_PACKAGE_JSON` warning may appear during `hardening-smoke-test.mjs`. This is non-blocking and does not affect the pass count.

**Caution: live write smoke tests require explicit per-session user approval before running.** Do not run them routinely.

---

## 1. Current Status / Baseline

Read these first when starting a new session or returning after time away.

**Project state checkpoint:** [`docs/PROJECT_STATE.md`](PROJECT_STATE.md) — updated D-255A (2026-07-01). Covers D-210→D-218 hardening arc + D-220→D-225 public profile polish arc + D-227→D-231 review ergonomics arc + D-233→D-237 duplicate advisory arc + D-239→D-240 review-to-study navigation arc + D-242→D-243 review next-item flow arc + D-245→D-248 review card metadata density arc + D-250→D-254 review search/filter clarity arc, current baseline 2877/0/24/57, privacy boundary state, Drift/Belief expansion state, deployment state, safe next-work rules 1–43.

### `D255A_REVIEW_SEARCH_FILTER_CLARITY_MILESTONE_CHECKPOINT.md` ⭐ CURRENT — D-255A REVIEW SEARCH/FILTER CLARITY MILESTONE CHECKPOINT — DOCS ONLY

Docs only. No deploy needed. Baseline: 2877/0/24/57. Closes the D-250→D-254 review search/filter clarity arc: 155 new tests total (8+13+15+20+35+64), 4 owner deploys (D-250C 29/29, D-251B 20/20, D-252B, D-253B 41/41). PROJECT_STATE.md updated with arc summary, review search/filter behavior table, privacy boundary entries, deployment state, and 11 new safe-next-work rules (33–43). Active summary guarantees, zero-results guarantees, ambiguous filter helper copy guarantees, client-side search guarantees, clear search guarantees, and search-aware navigation guarantees all confirmed and locked. No app/CSS/worker/Drift/Belief changes. No backend/API/migration/schema/CSP/external asset changes.

### `D254A_REVIEW_SEARCH_FILTER_CLARITY_REGRESSION_LOCK.md` — D-254A REVIEW SEARCH/FILTER CLARITY REGRESSION LOCK — TESTS+DOCS ONLY

Tests+docs only. No deploy needed. Baseline: 2877/0/24/57 (+64 tests). Regression lock for the D-250→D-253 search/filter clarity arc. Locks: D-250B active summary (Showing: filter · count · Search: query · sort), D-251A zero-results title/context/Show-all button, D-252A exact helper copy for ~Quality/Dupes/~Similar, D-253A search pipeline (applyReviewSort(applyReviewSearch(applyReviewFilter(all)))), label/placeholder, field coverage, clear search isolation, search-aware next-item and inspect prev/next navigation. Public profile boundary locked for all four arc additions. No app/CSS/worker/Drift files modified.

### `D253A_REVIEW_CLIENT_SIDE_SEARCH.md` — D-253A REVIEW CLIENT-SIDE SEARCH — LIVE PASS

App/CSS change. Owner deploy PASS (D-253B live sanity PASS 2026-07-01). Baseline: 2813/0/24/57 (+35 tests). Adds `reviewSearchQuery` state, `applyReviewSearch(list)`, `setReviewSearch(q)`, `renderReviewSearchRow()`, and `clearReviewSearch` zero-param action. Search input renders between filter bar and overview strip with `<label>` for accessibility, `type="search"`, and `data-review-search` attribute for delegated `input` event (no inline handlers). Search combines with filter then sort: `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))`. Active summary includes `· Search: "query"` when active. Zero-results context line includes search context; "Clear search" button added alongside "Show all review items". Next-item and inspect-panel prev/next also use search-aware list. D-250A F-1 (no search) addressed. No filter/sort/predicate/moderation/next-item logic otherwise changed. D-250B active summary preserved. D-251A zero-results state preserved. D-252A filter helper preserved. No public profile exposure. No Drift/Belief expansion changes. No backend/API/migration/schema/CSP/external asset changes. Worker unchanged. index.html unchanged. No localStorage/persistence.

### `D252A_REVIEW_AMBIGUOUS_FILTER_HELPER_COPY.md` — D-252A REVIEW AMBIGUOUS FILTER HELPER COPY — LIVE PASS

App/CSS change. Owner deploy PASS (D-252B live sanity PASS 2026-07-01). Baseline: 2778/0/24/57 (+20 tests). Adds `renderReviewFilterHelper()` returning a calm one-line helper note for ambiguous filters (`~Quality`, `Dupes`, `~Similar`). Renders between D-250B active summary and feedbackBanner. No helper for All/default/other filters. Helper uses `.review-filter-helper` CSS class. No filter/sort/predicate/next-item/moderation logic changed. No search added. D-250B active summary preserved. D-251A zero-results state preserved. No public profile exposure. No Drift/Belief expansion changes. No backend/API/migration/schema/CSP/external asset changes. Worker unchanged. index.html unchanged.

### `D251A_REVIEW_ZERO_RESULTS_FILTER_CLARITY.md` — D-251A REVIEW ZERO-RESULTS FILTER CLARITY — LIVE PASS

App/CSS change. Owner deploy PASS (D-251B live sanity PASS 2026-07-01). Baseline: 2758/0/24/57 (+15 tests). Adds `renderReviewEmptyState()` function replacing the inline empty-state template in `renderReviewList`. When the current filter/sort shows 0 items: renders `"No review items match this view."` title, a context line (`Current view: {filter} · Sorted: {sort}`), the existing per-filter explanatory copy (preserved), and a `"Show all review items"` button (absent when already on All). Button uses `data-action="setReviewFilter" data-value="all"` (D-181C compliant — no inline `onclick`). Sort is not reset. D-250B active summary remains visible. No filter/sort/moderation/next-item logic changed. No search added. No public profile exposure. No Drift/Belief expansion changes. No backend/API/migration/schema/CSP/external asset changes. Worker unchanged.

### `D250B_REVIEW_ACTIVE_FILTER_SORT_SUMMARY.md` — D-250B REVIEW ACTIVE FILTER/SORT SUMMARY — LIVE PASS

App/CSS change. Deploy complete. D-250C live sanity 29/29 PASS (2026-07-01). Baseline: 2743/0/24/57 (+13 tests). Adds `renderReviewActiveSummary(list)` function that renders a small muted summary line (`Showing: {filterLabel} · {count} item(s) · Sorted: {sortLabel}`) between the audit bar and the card list. Addresses D-250A F-2: no active filter/sort context near cards. Summary uses existing `reviewStateFilter`/`reviewSortOrder` state and the already-computed filtered+sorted `list` — no behavior change. Filter/sort/next-item/moderation logic all unchanged. D-250A guard tests (D-93B allowlist extended with `2730` and `2743`). CSS `.review-active-summary` added (muted, 11px). No search added. No public profile exposure. No Drift/Belief expansion changes. No backend/API/migration/schema/CSP/external asset changes. Worker unchanged.

### `D250A_REVIEW_SEARCH_FILTER_CLARITY_AUDIT.md` — D-250A REVIEW SEARCH/FILTER CLARITY AUDIT

Docs + guard tests. Deploy not needed. Baseline: 2730/0/24/57 (+8 guard tests). Full audit of all Review queue filter chips (11 chips: Pending/Public/Rejected/Reported/~Similar/~Quality/Pressure/Dupes/Demo-Test/Truth-Derived/All), sort select (5 options: Newest/Oldest/Reported/~Similar/~Quality first), and search (not present — confirmed gap). 7 friction findings: F-1 HIGH no search; F-2 MEDIUM no active filter/sort context near cards; F-3 MEDIUM ~Quality silently claim-only; F-4 MEDIUM Dupes conflates confirmed+advisory; F-5–F-7 LOW. Recommended next slices: D-250B active filter/sort summary line (preferred first), D-251A label clarity, D-252A lightweight client-side search, D-253A regression lock. Guard tests confirm filter/sort hooks, ~Quality non-claim exclusion behavior, no search state var, and public boundary. No app/CSS/worker/Drift/Belief changes. No backend/API/migration/schema/CSP/external asset changes.

### `D249A_REVIEW_CARD_METADATA_DENSITY_MILESTONE_CHECKPOINT.md` — D-249A REVIEW CARD METADATA DENSITY MILESTONE CHECKPOINT

Docs only. Deploy not needed. Baseline: 2722/0/24/57. Closes the D-245→D-248 review card metadata-density mini-arc: 84 new tests total (14+13+16+41), 3 owner deploys (D-245C 24/24, D-246B 28/28, D-247B 31/31). PROJECT_STATE.md updated with arc summary, review card behavior table (meta line, score labels, hints row), privacy boundary entries, deployment state, and 8 new safe-next-work rules (25–32). D-245A F-1/F-2/F-3 resolved; F-4 deferred. No app/CSS/worker/Drift/Belief changes. No backend/API/migration/schema/CSP/external asset changes.

### `D248A_REVIEW_CARD_METADATA_DENSITY_REGRESSION_LOCK.md` — D-248A REVIEW CARD METADATA DENSITY REGRESSION LOCK

Tests + docs only. Deploy not needed. Baseline: 2722/0/24/57 (+41 tests). Regression lock for the D-245→D-247 review card metadata-density mini-arc: 7 categories / 41 tests locking inline date (D-245B), readable score labels (D-246A), advisory hint grouping (D-247A), primary head-row badge set, cross-arc behavior compatibility (D-227B/D-229A/D-230A/D-242B/D-237A/D-239→D-240), public/Drift/backend boundaries, and deploy integrity. No app/CSS/worker/Drift/Belief changes. No backend/API/migration/schema/CSP/external asset changes.

### `D247A_REVIEW_CARD_ADVISORY_HINT_GROUPING.md` — D-247A REVIEW CARD ADVISORY HINT GROUPING

App/CSS change. Deploy complete. D-247B live sanity 31/31 PASS (2026-07-01). Baseline: 2681/0/24/57 (+16 tests). Moves low-priority advisory/quality hints (`needs sharpening`, `category echo`, `? borderline origin`) out of the primary `.review-card-head` badge row into a dedicated `.review-card-hints` secondary row rendered below the meta line. Scan-critical badges (type, state, ⚑ report, ~similar, truth-derived, Builder) stay in the primary head row. Hints row renders only when hints exist; empty when none apply. CSS `.review-card-hints` added with `opacity:.75` for visual quiet. No hint data removed. D-245B date and D-246A score labels preserved. No moderation/advisory/filter/sort/next-item/Study-nav change. No backend/API/migration/schema/CSP/external asset changes. Drift/Belief expansion files untouched. Worker unchanged.

### `D246A_REVIEW_CARD_SCORE_LABEL_CLARITY.md` — D-246A REVIEW CARD SCORE LABEL CLARITY

App change only (no CSS). Deploy complete. D-246B live sanity 28/28 PASS (2026-07-01). Baseline: 2665/0/24/57 (+13 tests). Replaces cryptic `ev:N ts:N sv:N` score abbreviations in claim review cards with readable `Evidence N · Test N · Survive N` labels, matching the existing inspect-panel/analysisSummary convention. Score values and source fields unchanged. No extra row added. D-245B inline date behavior preserved. No moderation semantics change. No duplicate/advisory/filter/sort/next-item/Study-nav change. No backend/API/migration/schema/CSP/external asset changes. Drift/Belief expansion files untouched. Worker unchanged.

### `D245B_INLINE_REVIEW_CARD_DATE_METADATA.md` — D-245B INLINE REVIEW CARD DATE METADATA

App/CSS change. Deploy complete. D-245C live sanity 24/24 PASS (2026-07-01). Baseline: 2652/0/24/57 (+14 tests). Moves "Updated {age}" from a standalone `<p class="review-card-date">` row into the existing `.review-card-meta` line for all card types. One visual row removed per card (~18–20px per card, ~400px per 20-item queue). Date information fully preserved. CSS `.review-card-date` rules removed; `.review-card-meta` margin updated to absorb spacing. No moderation semantics change. No duplicate/advisory/filter/sort/next-item/Study-nav change. No backend/API/migration/schema/CSP/external asset changes. Drift/Belief expansion files untouched. Worker unchanged.

### `D245A_REVIEW_CARD_METADATA_DENSITY_AUDIT.md` — D-245A REVIEW CARD METADATA DENSITY AUDIT

Docs only. Deploy not needed. Baseline: 2638/0/24/57 (unchanged). Full inventory of every badge, chip, and row in `reviewCard`: 7 friction findings including head-row badge overflow (F-1 HIGH), dense score triplet (F-2 MEDIUM), dedicated date row (F-3 MEDIUM), and pressure handle duplication (F-4 MEDIUM). Recommends D-245B (inline date into meta row) as first implementation slice. No app/CSS/worker/Drift/Belief changes. No backend/API/migration/schema/CSP/external asset changes.

### `D244A_REVIEW_NEXT_ITEM_FLOW_MILESTONE_CHECKPOINT.md` — D-244A REVIEW NEXT-ITEM FLOW MILESTONE CHECKPOINT

Docs only. Deploy not needed. Baseline: 2638/0/24/57. Closes the D-242→D-243 review next-item flow mini-arc: 65 new tests total (7+24+34), 1 owner deploy (D-242C 34/34 PASS). PROJECT_STATE.md updated with arc summary, next-item behavior table, Drift/Belief expansion state, privacy boundary entries, deployment state, and 5 new safe-next-work rules (20–24). "Open next item →" manual-only affordance confirmed and locked. No app/CSS/worker/Drift/Belief changes. No backend/API/migration/schema/CSP/external asset changes.

### `D243A_REVIEW_NEXT_ITEM_FLOW_REGRESSION_LOCK.md` — D-243A REVIEW NEXT-ITEM FLOW REGRESSION LOCK

Tests + docs only. Deploy not needed. Baseline: 2638/0/24/57 (+34 new tests). Locks D-242A/B/C next-item behavior across 7 categories: next-ID state (`reviewDecisionFeedbackNextId` + clear), candidate capture (sorted/filtered, approve/reject only, Keep Pending excluded), post-reload validity (candidate checked against fresh queue), manual action (button copy, type, inspectReviewItem, no reviewDecisionUI/fetch), cross-arc compat (D-227B/D-228A/D-229A/D-230A/D-239/D-240/keyboard), public boundary (3 assertions on renderPublicProfileHtml), deploy integrity (app/CSS/worker unchanged). App/CSS/worker/Drift files unchanged. No backend/API/migration/schema/CSP/external asset changes.

### `D242B_REVIEW_DECISION_OPEN_NEXT_ITEM.md` — D-242B/D-242C REVIEW DECISION: OPEN NEXT ITEM — LIVE PASS

App + CSS + tests + docs. Owner deploy complete — D-242C live sanity 34/34 PASS. Baseline: 2604/0/24/57 (+24 new tests, +5 slice-window fixes). Adds "Open next item →" button to D-230A feedback banner after Approve/Reject when a next item exists in the current sorted/filtered queue. Next item captured before queue reload via applyReviewSort(applyReviewFilter(...)). Button calls clearReviewDecisionFeedback()+inspectReviewItem(nextId) — manual only, no auto-moderation, no backend call. Keep Pending unchanged (no button for 'review' decision). Last-item/empty-queue suppresses button. Keyboard _advanceId path unchanged. New state: reviewDecisionFeedbackNextId. CSS: .review-feedback-next with focus-visible. Drift/Belief expansion files untouched. No backend/API/migration/schema/CSP/external asset changes.

### `D242A_REVIEW_QUEUE_NEXT_ITEM_FLOW_AUDIT.md` — D-242A REVIEW QUEUE NEXT-ITEM FLOW AUDIT

Audit + guard tests + docs. Deploy not needed. Baseline: 2580/0/24/57 (+7 new tests). Documents post-decision behavior after Approve/Keep/Reject: item removal from pending filter, inspect panel clearance, feedback banner (D-230A), scroll fallback, and the hidden keyboard auto-advance path (initReviewKb already auto-advances after A+A/R+R/K — button path does not). 7 guard tests lock keyboard advance logic (_advanceId pre-capture, .then() dispatch, next-first preference, _reviewKbInFlight guard), inspect panel nav computation (sorted/filtered _prev/_next, Next → button wiring), and the gap invariant (reviewDecisionUI does not call inspectReviewItem). App/CSS/worker unchanged. No backend/API/migration/schema/CSP/external asset changes. Recommended next: D-242B — "Open next item →" button in the D-230A feedback banner.

### `D241A_REVIEW_TO_STUDY_NAVIGATION_MILESTONE_CHECKPOINT.md` — D-241A REVIEW-TO-STUDY NAVIGATION MILESTONE CHECKPOINT

Docs only. Deploy not needed. Baseline: 2573/0/24/57. Closes the D-239→D-240 review-to-study navigation mini-arc: 47 new tests total (17+30), 1 owner deploy (D-239B/C). PROJECT_STATE.md updated with arc summary, review-to-study behavior table, privacy boundary entries, deployment state, and 3 new safe-next-work rules. Review-origin capture, Back-to-Review button, inspected item restore, post-render RAF scroll, no-queue-reload, no pushState, and public exposure isolation all confirmed and locked. No app/CSS/worker/backend/API/migration/schema/CSP/external asset changes.

### `D240A_REVIEW_TO_STUDY_NAVIGATION_REGRESSION_LOCK.md` — D-240A REVIEW-TO-STUDY NAVIGATION REGRESSION LOCK

Tests + docs only. Deploy not needed. Baseline: 2573/0/24/57. Locks D-239A/D-239B behavior: 30 new regression tests covering review-origin capture (openReviewClaimStudy sets lastModeBeforeStudy + lastInspectedReviewItemId), Study header "← Back to Review" wiring, backToArena() item restore + setMode("review"), post-render RAF scroll (scrollToReviewAnchor(_savedId) guarded by _savedId), no-queue-reload guarantee, no pushState, D-227B/D-228A/D-229A/D-230A/D-233B/D-236A compat, public exposure isolation (5 checks), and deploy integrity. App/CSS/worker unchanged. No backend/API/migration/schema/CSP/external asset changes. Future rule: any Review/Study navigation change must preserve this lock or update it with owner approval.

### `D239B_BACK_TO_REVIEW_SCROLL_RESTORE.md` — D-239B/C BACK TO REVIEW SCROLL RESTORE — LIVE PASS

App + tests + docs. Deploy complete (D-239C). Baseline: 2543/0/24/57. HEAD: 5c12a10. Addresses D-239A F-1: `backToArena()` now calls `scrollToReviewAnchor(_savedId)` via `requestAnimationFrame` after restoring `inspectedReviewItem` and calling `setMode('review')`. One line added. No queue reload. Non-review origins (vault/truths/me/arena) unchanged. No browser `pushState`. Null-safe guard: scroll only fires when `_savedId` is non-null. D-227B/D-228A/D-229A/D-230A/D-233B/D-234A/D-235A/D-236A behavior all confirmed intact. 17 new smoke tests. No CSS/worker/backend/API/migration/schema/CSP/external asset changes. D-239C live sanity: 13/13 PASS (2026-06-29).

### `D239A_REVIEW_TO_STUDY_NAVIGATION_AUDIT.md` — D-239A REVIEW-TO-STUDY NAVIGATION AUDIT

Docs only. Deploy not needed. Baseline: 2526/0/24/57. App/CSS/worker unchanged. Audits the moderator navigation path from Review queue / inspect panel into Study View and back. Key findings: "← Back to Review" button and `lastModeBeforeStudy`/`lastInspectedReviewItemId` context-save mechanism exist and work correctly; `backToArena()` restores `inspectedReviewItem` on return. Gap: `backToArena()` does not scroll to the restored card (`scrollToReviewAnchor`/`scrollSelectedReviewCardIntoView` not called on return). 5 findings (F-1: scroll gap medium, F-2: button prominence low, F-3: no browser-back low, F-4: button style inconsistency low, F-5: similar-advisory ↗ Study return friction medium). Recommended next code slice: D-239B — scroll to selected card after returning from Study to Review. No backend/API/migration/schema/CSP/external asset changes.

### `D238A_DUPLICATE_ADVISORY_MILESTONE_CHECKPOINT.md` — D-238A DUPLICATE ADVISORY MILESTONE CHECKPOINT

Docs only. Deploy not needed. Baseline: 2526/0/24/57. Closes the D-233→D-237 duplicate advisory UX mini-arc: 123 new tests total (15+11+19+19+18+41), 4 owner deploys (D-233B/C, D-234A/B, D-235A/B, D-236A/B). PROJECT_STATE.md updated with arc summary, duplicate advisory behavior table, privacy boundary entries, deployment state, and 5 new safe-next-work rules. Advisory-only semantics, Copy ID guarantee, prefill-only guarantee, explicit confirmation requirement, scroll parity, and public exposure isolation all confirmed and locked. No app/CSS/worker/backend/API/migration/schema/CSP/external asset changes.

### `D237A_DUPLICATE_ADVISORY_WORKFLOW_REGRESSION_LOCK.md` — D-237A DUPLICATE ADVISORY WORKFLOW REGRESSION LOCK

Tests + docs only. Deploy not needed. Baseline: 2526/0/24/57. Locks the D-233→D-236 duplicate advisory UX mini-arc: 41 new regression tests covering resolve-similar scroll parity (D-233B), advisory display clarity (D-234A), Copy ID guarantee (D-235A), prefill-only duplicate-target guarantee (D-236A), advisory-only semantics, public profile isolation, and deploy integrity. App/CSS/worker unchanged. No backend/API/migration/schema/CSP/external asset changes. Future rule: any duplicate/canonical/merge work must preserve this lock or update it with owner approval. Worker route static: 57/0/1 known warn.

### `D236A_SIMILAR_ADVISORY_DUPLICATE_TARGET_PREFILL.md` — D-236A/B SIMILAR ADVISORY DUPLICATE-TARGET PREFILL — LIVE PASS

App + CSS + tests + docs. Deploy complete (D-236B). Baseline: 2485/0/24/57. HEAD: 3136539. Completes D-233A F-1 friction reduction arc: "Use as duplicate target" button in inspect panel Similar claim advisory field calls `markDuplicateUI(claimId, nearDupId)` — opens the existing mark-duplicate modal with canonical target field pre-filled with the `near_duplicate_of` ID. `markDuplicateUI` signature: `(claimId, suggestedCanonicalId='')` — existing one-arg callers unchanged. When prefilled: modal shows "Pre-filled from similar-claim advisory — confirm the ID below before marking." note + pre-filled input. Moderator can still edit or cancel — API call still gated inside `onConfirm`. No auto-submit. Cancel does not mutate queue. Copy ID from D-235A and raw ID display from D-234A both remain intact. 4 new CSS classes. 18 new smoke tests + 6 window-slice fixes (D-129A: 1600→1800, 13000→14000; D-129B/C: 13500→14000 ×4). No `near_duplicate_of` semantics change. No backend/API/migration/schema/CSP/external asset changes. D-236B live sanity: 16/16 PASS (2026-06-29).

### `D235A_SIMILAR_ADVISORY_COPY_ID.md` — D-235A/B SIMILAR ADVISORY COPY ID — LIVE PASS

App + CSS + tests + docs. Deploy complete. Baseline: 2467/0/24/57. Adds one-click "Copy ID" affordance to the similar-claim advisory in the review inspect panel: `copySimilarClaimId(id)` helper uses `navigator.clipboard?.writeText` with toast on success ("ID copied") / failure ("Copy failed — select the ID manually"), guards `if(!id)return`, no `fetch`/`api()`/`localStorage`. Inspect panel `Similar claim (advisory)` field: raw ID now in `<code class="review-similar-id-code" user-select:all>` for single-click selection; `↗ Study` link still opens Study View; `[Copy ID]` button calls `copySimilarClaimId`. Practical workflow: Copy ID → paste directly into `markDuplicateUI` canonical target field. 2 new CSS classes. 19 new smoke tests covering helper, button, CSS, API routes unchanged, no public profile exposure. No `near_duplicate_of` semantics change. No backend/API/migration/schema/CSP/external asset changes. D-235B live sanity: 14/14 PASS (2026-06-29).

### `D234A_SIMILAR_ADVISORY_DISPLAY_CLARITY.md` — D-234A/B SIMILAR ADVISORY DISPLAY CLARITY — LIVE PASS

App + CSS + tests + docs. Deploy complete. Baseline: 2448/0/24/57. Addresses D-233A findings F-2 and F-4: (1) inspect panel advisory banner restructured — `review-similar-note` now column-flex with `review-similar-note-head` (badge + "Similar claim advisory" label) and `review-similar-body` ("Advisory only... Review manually before deciding — normal moderation actions still apply."); (2) `Similar claim (advisory)` field prefixes raw ID with "Possible related claim:"; (3) `resolveSimilarUI` modal copy updated to "Dismiss the similar-claim advisory for this review item?" with explicit "does not approve, reject, or merge" paragraph. Raw ID remains visible in all contexts. 5 new CSS sub-classes. 19 new smoke tests + 4 window-slice fixes (D-129B/C: 12000→13500, 13000→13500) + 1 D-233B modal-copy test updated. No `near_duplicate_of` semantics change. No backend/API/migration/schema/CSP/external asset changes. No public profile exposure. D-234B live sanity: 15/15 PASS (2026-06-29).

### `D233B_RESOLVE_SIMILAR_SCROLL_ANCHOR.md` — D-233B/C RESOLVE SIMILAR SCROLL ANCHOR — LIVE PASS

App fix + tests + docs. Deploy complete. Baseline: 2429/0/24/57. Fixes D-233A friction finding F-6: after dismissing a `~similar` advisory via `resolveSimilarUI`, the review queue now scrolls back to the dismissed claim's card (`scrollToReviewAnchor(claimId)` added after `renderReviewList()` in the success path), matching the existing `markDuplicateUI` behavior. One-line change in `public/app-v10.js`. 11 new smoke tests: core fix, call order, parity with markDuplicateUI, scrollToReviewAnchor existence, API routes unchanged, modal copy unchanged, queue load before scroll, public profile exclusion, deploy integrity. No CSS, no worker, no backend/API/migration/schema/CSP/external asset changes. No duplicate/advisory semantics change. D-233C live sanity: 11/11 PASS (2026-06-29).

### `D233A_DUPLICATE_REVIEW_UX_AUDIT.md` — D-233A DUPLICATE REVIEW UX AUDIT

Docs + tiny smoke tests. No app/CSS/worker changes. No deploy needed. Baseline: 2418/0/24/57. Audits the current duplicate/near-duplicate handling in the review queue: two-concept data surface (`near_duplicate_of` advisory vs `duplicate_of` explicit), card/inspect/audit-summary UI display, all available actions (`markDuplicateUI`, `resolveSimilarUI`, `openReviewClaimStudy`), 7 concrete friction findings (F-1: manual ID entry in mark-duplicate modal; F-2: similar field shows ID not text; F-3: openReviewClaimStudy navigates away; F-4: resolveSimilarUI modal shows ID not text; F-5: Dupes filter conflates advisory+explicit; F-6: resolveSimilarUI missing scroll anchor; F-7: no similarity confidence signal). 4 safe next slices proposed (D-233B scroll fix, D-234A similar text display, D-235A pre-populate modal, D-236A regression lock). 15 new guard tests confirming existing hooks + public profile exclusion. No backend/API/migration/schema/CSP/external asset changes.

### `D232A_REVIEW_ERGONOMICS_MILESTONE_CHECKPOINT.md` — D-232A REVIEW ERGONOMICS MILESTONE CHECKPOINT

Docs only. No app/CSS/worker changes. No deploy needed. Baseline: 2403/0/24/57. Updates `PROJECT_STATE.md` as the authoritative checkpoint after the D-227→D-231 review queue ergonomics arc: arc summary (10 tasks, 113 new tests, 4 owner deploys + live closeouts), review queue current behavior, privacy/public boundary update (D-231A review markers confirmed absent from public profile), deployment history, safe-next-work rules including D-231A regression lock rule and moderation route/action-name freeze. No backend/API/migration/schema/CSP/external asset changes.

### `D231A_REVIEW_QUEUE_ERGONOMICS_REGRESSION_LOCK.md` — D-231A REVIEW QUEUE ERGONOMICS REGRESSION LOCK

Tests + docs only. No app/CSS/worker changes. No deploy needed. Baseline: 2403/0/24/57. Consolidated regression lock for the D-227→D-230 review queue ergonomics arc: 37 new tests across 7 categories — D-227 selected-card anchor lock (5), D-228 scroll preservation lock (7), D-229 confirm-state clarity lock (6), D-230 decision-feedback lock (7), moderation semantics lock (4), public profile exposure lock (5), deploy integrity lock (3). Any future review UI change breaking these tests requires updating this lock with explicit owner approval. No backend/API/migration/schema/CSP/external asset changes.

### `D230A_REVIEW_QUEUE_DECISION_FEEDBACK.md` — D-230A/B REVIEW QUEUE DECISION FEEDBACK — LIVE PASS

App + CSS + tests + docs. Owner deploy complete (D-230B live sanity 24/24 PASS, 2026-06-29). Baseline: 2366/0/24/57. Adds `reviewDecisionFeedback` state, `clearReviewDecisionFeedback()` helper, and a `role="status" aria-live="polite"` feedback banner in `renderReviewList` showing "Approved review item.", "Kept review item.", or "Rejected review item." after a successful decision. Banner includes a Dismiss button (`type="button"`). Feedback is set in `reviewDecisionUI` after API success, rendered above the inspect panel, cleared on dismiss. 19 new tests + 4 D-129C/D/E window fixes (1200→1500). No moderation semantics change. D-227B/D-228A/D-229A behavior intact. No backend/API/migration/schema/CSP/external asset changes. No public profile exposure.

### `D229A_REVIEW_QUEUE_CONFIRM_STATE_CLARITY.md` — D-229A/B REVIEW QUEUE CONFIRM-STATE CLARITY — LIVE PASS

App + CSS + tests + docs. Owner deploy complete (D-229B live sanity 23/23 PASS, 2026-06-29). Baseline: 2347/0/24/57. Adds `data-review-confirming="reject|approve|cleanup"` attribute to card article and inspect actions div when armed; adds `review-confirm-armed` class to card actions and inspect actions divs when armed; adds `review-card-approve-pending` card-level highlight when approve is armed (mirrors `review-card-reject-pending`); fixes cleanup section in inspect panel to use neutral amber `review-cleanup-confirm-msg`/`btn-cleanup-confirm`/`btn-cleanup-cancel` classes instead of reusing reject red classes; 20 new tests + 3 D-129B window fixes; no moderation semantics change; D-227B/D-228A behavior intact. No backend/API/migration/schema/CSP/external asset changes.

### `D228A_REVIEW_QUEUE_SCROLL_PRESERVATION.md` — D-228A/B REVIEW QUEUE SCROLL PRESERVATION — LIVE PASS

App + tests + docs. No CSS changes. Owner deploy complete (D-228B live sanity 25/25 PASS, 2026-06-29). Baseline: 2327/0/24/57. Adds `withReviewScrollPreserved(fn)` helper that captures `window.scrollY`, runs the render, then restores scroll via `requestAnimationFrame`; wraps 9 pure local re-renders (filter, sort, confirm-step toggles, audit toggle) to preserve scroll; `inspectReviewItem` intentionally excluded so D-227B selected-card scroll wins; `reviewDecisionUI` excluded so `scrollToReviewAnchor` handles post-decision; 19 new lock tests. No moderation semantics change. No backend/API/migration/schema/CSP/external asset changes.

### `D227B_REVIEW_QUEUE_SELECTED_CARD_ANCHOR.md` — D-227B/C REVIEW QUEUE SELECTED-CARD ANCHOR — LIVE PASS

App + CSS + tests + docs. Owner deploy complete (D-227C live sanity 20/20 PASS, 2026-06-29). Baseline: 2308/0/24/57. Adds `data-review-selected="true"` attribute to the selected review card article; adds `scrollSelectedReviewCardIntoView()` helper that uses `requestAnimationFrame` and optional chaining to scroll the selected card into view after inspect panel opens; enhances `.review-card-selected` CSS with 2px ring and background accent; 18 new lock tests. No moderation semantics change. No backend/API/migration/schema/CSP/external asset changes.

### `D227A_REVIEW_QUEUE_SCANABILITY_AUDIT.md` — D-227A REVIEW QUEUE SCANABILITY AUDIT

Docs only. No app UI, CSS, or worker changes. Deploy not needed. Baseline unchanged: 2290/0/24/57. Audits the current Review/moderation UI: full UI structure (filter bar, overview strip, audit summary, inspect panel position, card anatomy, keyboard shortcuts), all 8 current moderation actions, 6 concrete friction points (inspect panel detached from card, full re-render on every action, action button duplication across card/panel, no selected-card anchor, keyboard hint clarity, no filtered-item count), 5 safe improvement slices (D-227B through D-231A), risk boundaries, and test recommendations. No backend/API/migration/schema/CSP/external asset changes.

### `D226A_PUBLIC_PROFILE_MILESTONE_CHECKPOINT.md` — D-226A PUBLIC PROFILE MILESTONE CHECKPOINT

Docs only. No app UI, CSS, or worker changes. Deploy not needed. Updates `docs/PROJECT_STATE.md` as authoritative project reference after the completed D-220→D-225 public profile polish arc. Records current baseline (2290/0/24/57), full arc summary, deployment state (5 owner live deploys, D-225A tests/docs only), public profile current behavior table, privacy guarantees (no new public data fields; no private/avatar exposure; D-214A/D-215A/D-216A/D-225A locks active), future rules, and suggested next lanes. No backend/API/migration/schema/CSP/external asset changes.

### `D225A_PUBLIC_PROFILE_POLISH_REGRESSION_LOCK.md` — D-225A PUBLIC PROFILE POLISH REGRESSION LOCK

Tests + docs only. No app UI, no CSS, no worker changes. Deploy not needed. Seals the D-220→D-224 public profile polish arc with cross-arc regression tests: (1) page structure order — counts before sectionNav before snapshot before claims; (2) all D-220→D-224 CSS classes present; (3) D-222 copy-link helper integrity — `window.location.href`, `Link copied`, failure copy, no localStorage/fetch; (4) D-223 section nav — all four anchors always present, pure HTML; (5) D-224 empty-state — snapshot id always emitted, claims/truths use `pp-empty-card`; (6) D-216A allowlist contains all arc markers; (7) privacy boundary — no private markers in entire public render path; (8) forbidden wording absent from all public render functions; (9) D-221 accessibility — focus-visible rings and mobile touch targets for all public interactive elements; (10) D-225A deploy integrity — arc tags absent from worker.js; (11) empty-state copy public-safe; (12) copy-link button present in header; (13) README references all arc docs D220A→D225A. 13 new D-225A tests. Baseline 2290/24/57. No privacy boundary change. D-214A/D-215A/D-216A locks active. Future rule: any public profile polish change must preserve D-220→D-224 behavior or explicitly update this regression lock with owner approval.

### `D224A_PUBLIC_PROFILE_EMPTY_STATES.md` — D-224A/D-224B PUBLIC PROFILE EMPTY-STATE POLISH LIVE PASS

Frontend/CSS + tests + docs. **Deploy: LIVE** — owner deployed from terminal; D-224B live sanity all PASS. No backend, no API, no migration, no schema, no CSP, no external asset changes. No new public data fields. No Reflection Avatar / private My HumanX exposure. Polishes empty states for snapshot/claims/truths: snapshot renders styled `pp-empty-card` with `id="public-snapshot"` always (no longer returns empty string — `id` target always present); claims and truths empty states changed from `p.pp-empty` to `div.pp-empty-card + p.pp-empty-title`. Snapshot nav link in section nav now always rendered (no longer conditional on `sn`). New CSS: `.pp-empty-card`, `.pp-empty-title`, `.pp-empty-note`. D-216A allowlist +5 entries. D-142C/D-154B/D-208B window extended for longer function. D-223A snapshot conditional test updated (D-224A: now always present). 13 new D-224A tests (+5 allowlist forEach). Baseline 2275/24/57. No privacy boundary change. D-214A/D-215A/D-216A privacy locks active.

### `D223A_PUBLIC_PROFILE_SECTION_NAV.md` — D-223A/D-223B PUBLIC PROFILE SECTION NAVIGATION LIVE PASS

Frontend/CSS + tests + docs. **Deploy: LIVE** — owner deployed from terminal; D-223B live sanity all PASS. No backend, no API, no migration, no schema, no CSP, no external asset changes. No new public data fields. No Reflection Avatar / private My HumanX exposure. Adds `<nav aria-label="Public profile sections">` row with anchor links to Snapshot (conditional on sn), Claims, Truths, and About sections; adds matching `id` attributes to existing section elements (`public-claims`, `public-truths`, `public-about` in orchestrator; `public-snapshot` in `renderPublicProfileSnapshotHtml`). Pure HTML anchors — no JS. `.pp-section-nav` / `.pp-nav-link` CSS classes with hover, focus-visible, and mobile flex-wrap. D-216A allowlist updated: +7 entries. D-141B test window extended for longer function. 13 new D-223A tests (+7 allowlist forEach). Baseline 2257/24/57. No privacy boundary change. D-214A/D-215A/D-216A privacy locks active.

### `D222A_PUBLIC_PROFILE_COPY_LINK.md` — D-222A/D-222B PUBLIC PROFILE COPY LINK LIVE PASS

Frontend/CSS + tests + docs. **Deploy: LIVE** — owner deployed from terminal; D-222B live sanity all PASS. No backend, no API, no migration, no schema, no CSP, no external asset changes. No new public data fields. No Reflection Avatar / private My HumanX exposure. Adds "Copy profile link" button to the public profile header card for both owners and non-owners: uses `window.location.href`, shows "Link copied" on success, shows "Copy failed — use browser address bar" on clipboard failure, falls back to `execCommand` when Clipboard API unavailable, `try/catch` throughout. Button has `type="button"`, `.pp-copy-link` class, focus-visible CSS, mobile `min-height:44px`. D-216A allowlist updated: +3 entries (`pp-copy-link`, `Copy profile link`, `Link copied`). D-156A test updated: "Copied!" → "Link copied" (intentional). 13 new D-222A tests (+3 allowlist). Baseline 2237/24/57. No privacy boundary change. D-214A/D-215A/D-216A privacy locks active.

### `D221A_PUBLIC_PROFILE_ACCESSIBILITY.md` — D-221A/D-221B PUBLIC PROFILE ACCESSIBILITY LIVE PASS

CSS + tests + docs. **Deploy: LIVE** — owner deployed from terminal; D-221B live sanity all PASS. No backend, no API, no migration, no schema, no CSP, no external asset changes. No new public data fields. No Reflection Avatar / private My HumanX exposure. Keyboard / screen-reader / mobile-touch improvements within the D-216A public profile allowlist: (1) `.pp-item-actions .btn-mini:focus-visible` — scoped focus ring for public profile claim action buttons (previously no pp-scoped focus style); (2) mobile touch target — `@media(max-width:640px)` sets `min-height:44px; padding:10px 12px` on `.pp-item-actions .btn-mini` (previously `min-height:36px` only); no new public classes or copy introduced; no allowlist update needed. 12 new D-221A tests. Baseline 2221/24/57. No privacy boundary change. D-214A/D-215A/D-216A privacy locks active.

### `D220A_PUBLIC_PROFILE_VISUAL_POLISH.md` — D-220A/D-220B PUBLIC PROFILE VISUAL POLISH LIVE PASS

Frontend/CSS + tests + docs. **Deploy: LIVE** — owner deployed from terminal; D-220B live sanity all PASS. No backend, no API, no migration, no schema, no CSP, no external asset changes. No new public data fields. No Reflection Avatar / private My HumanX exposure. Visual polish within the D-216A public profile allowlist contract: (1) counts card moved to top (activity at a glance before snapshot and claims); (2) context/vocabulary block collapsed into native `<details class="pp-vocab-details"><summary>About this profile page</summary>` — reduces vertical clutter, user can expand; (3) claim action buttons wrapped in `pp-item-actions` div for cleaner responsive layout; (4) `renderPublicProfileTruthsHtml` now returns empty-state `pp-empty` message instead of empty string — truths section always renders consistently with claims section. `PUBLIC_PROFILE_ALLOWED_MARKERS` updated: +7 entries. D-158B ordering/truths tests updated. 22 new D-220A tests. Baseline 2209/24/57. No privacy boundary change. D-214A/D-215A/D-216A privacy locks active.

### `D219A_POST_HARDENING_CHECKPOINT.md` — D-219A POST-HARDENING CHECKPOINT

Docs only. No app UI changes, no CSS changes, no worker changes, no deploy needed. Closes the D-210→D-218 hardening arc with a single reliable baseline reference. Updates `docs/PROJECT_STATE.md` (full rewrite — current HEAD, baseline 2186/24/57, arc summary, privacy boundary state per surface, deployment state, worker warning state, 6 safe next-work rules, 5 suggested feature lanes, D/A backend safety rules, full batch history A-2→D-219A). Creates `docs/D219A_POST_HARDENING_CHECKPOINT.md` (arc summary, active privacy locks table, baseline confirmation). Baseline unchanged: 2186/0/24/57. No backend, no API, no migration, no schema, no CSP, no external asset, no app UI, no CSS, no worker changes.

### `D218A_WORKER_ROUTE_WARNING_AUDIT.md` — D-218A WORKER ROUTE WARNING AUDIT
### `D177A_FRONTEND_HTML_ESCAPING_XSS_AUDIT.md` — D-177A FRONTEND XSS AUDIT
### `D177B_FRONTEND_MODAL_HTML_CONTRACT_PATCH.md` — D-177B FRONTEND MODAL CONTRACT
### `D177D_FRONTEND_MODAL_HTML_CONTRACT_LIVE_VERIFY.md` — D-177B/D LIVE VERIFIED
### `D178A_HTTP_HEADERS_CACHE_CORS_AUDIT.md` — D-178A HTTP HEADERS/CACHE/CORS AUDIT
### `D178B_HTTP_HEADERS_CACHE_NOSNIFF_PATCH.md` — D-178B HTTP CACHE/NOSNIFF PATCH
### `D178D_HTTP_HEADERS_CACHE_NOSNIFF_LIVE_VERIFY.md` — D-178B/D LIVE VERIFIED
### `D218A_WORKER_ROUTE_WARNING_AUDIT.md` ⭐ CURRENT — D-218A WORKER ROUTE WARNING AUDIT

Checker improvement + docs. No app UI changes, no CSS changes, no worker changes, no deploy needed. Audits the one recurring `worker-route-static-check.mjs` warning. Root cause: `/api/u/:slug` is implemented in worker.js via regex (`url.pathname.match(/^\/api\/u\/[^/]+$/)`) rather than a literal string — the static checker can only extract string literals, so the route appears absent. Classification: **known false positive / static analysis limitation**. Runtime impact: none. Privacy impact: none. Fix: added `KNOWN_PARAM_ROUTES` Set to `worker-route-static-check.mjs`; updated warning message to distinguish "known" from "NEW parameterised route not in KNOWN_PARAM_ROUTES" so future unknown parameterised routes emit a distinct high-urgency warning. Pass/fail/warn count unchanged (57/0/1). 9 new D-218A smoke tests. Baseline 2186/0/24/57. No D-218B follow-up needed — warning is fully understood and mitigated. No backend, no API, no migration, no schema, no CSP, no external asset, no worker, no app UI changes.

### `D217A_HARDENING_SMOKE_INDEX.md` — D-217A HARDENING SMOKE INDEX

Tests + docs only. No app UI changes, no CSS changes, no deploy needed. Adds a structured comment index near the top of `hardening-smoke-test.mjs` listing all major guard families (baseline/allowlist, worker route, belief engine, My HumanX private surface, Reflection Avatar arc, ★ D-214A regression lock, ★ D-215A privacy boundary lock, ★ D-216A allowlist contract, deploy integrity) with D-block navigation anchors and rules for future slices. 20 new D-217A maintainability tests verifying index presence, key lock tests still active, README references intact, deploy integrity. Baseline 2177/0/24/57. Worker route static 57/0/1 warn (pre-existing, non-blocking). Rule: D-214A/D-215A/D-216A privacy locks cannot be loosened without a new spec + explicit owner approval. No backend, no API, no migration, no schema, no CSP, no external asset, no app UI changes.

### `D216A_PUBLIC_PROFILE_ALLOWLIST_CONTRACT.md` — D-216A PUBLIC PROFILE ALLOWLIST CONTRACT

Tests + docs only. No app UI changes, no CSS changes, no deploy needed. Complements D-214A/D-215A denylists with a positive contract for the public profile surface. Defines `PUBLIC_PROFILE_ALLOWED_MARKERS` (19 CSS classes and copy markers that MUST be present) and `PUBLIC_PROFILE_PRIVATE_DENYLIST` (22 private markers that MUST NOT appear in content helpers). 79 new D-216A tests: public render function contract (6), positive allowlist assertions (19), private denylist for content helpers (22), private helper exclusion from orchestrator (11), backend API shape (10 — top_beliefs_json/dominant_pattern/alignment_labels/avatar_hidden absent; slug/displayName/buildPublicSharedSnapshot present), deploy integrity (3). Baseline 2157/0/24/57. Worker route static 57/0/1 warn (pre-existing, non-blocking). Deny-by-default rule: any new public profile field must be named in docs and tests before merge. No backend, no API, no migration, no schema, no CSP, no external asset, no app UI changes.

### `D215A_MY_HUMANX_PRIVACY_BOUNDARY_LOCK.md` — D-215A MY HUMANX PRIVACY BOUNDARY LOCK

Tests + docs only. No app UI changes, no CSS changes, no deploy needed. Adds 43 new D-215A tests locking the broader My HumanX private surface: private/public render separation (11 — renderMeHtml, meMirrorHtml, meBeliefReflectionHtml, meAccountCardHtml, meProfileSettingsHtml, private copy absent from public render), public-profile-stays-presentation-only (6 — meRerender, saveBeliefVisibilityUI, export/filter/slice controls absent), no localStorage/public coupling (4), backend/API boundary (5 — no preference/avatar routes in worker), public forbidden wording compound phrases (10), renderMeHtml wiring integrity (4), deploy lock (3). Baseline 2078/0/24/57. Worker route static 57/0/1 warn (pre-existing, non-blocking). Future rule: any public profile expansion must state what is made public, what remains private, and which tests are updated. No backend, no API, no migration, no schema, no CSP, no external asset, no app UI changes.

### `D214A_REFLECTION_AVATAR_REGRESSION_LOCK.md` — D-214A REFLECTION AVATAR REGRESSION LOCK

Tests + docs only. No app UI changes, no CSS changes, no deploy needed. Adds 55 new D-214A regression tests locking the Reflection Avatar private render boundary (10 markers), public profile exclusion (9 checks), backend/API exclusion (5 checks), data minimization (5 checks), copy guardrails — forbidden wording + identity chip labels (17 checks), accessibility guarantees (6 checks), and deploy integrity (3 checks). Baseline 2035/0/24/57. Worker route static 57/0/1 warn (pre-existing, non-blocking). Future rule: any intentional public exposure of Reflection Avatar requires a new spec + explicit owner approval before regression tests may be updated. No backend, no API, no migration, no schema, no CSP, no external asset, no app UI changes.

### `D213A_REFLECTION_AVATAR_ACCESSIBILITY.md` — D-213A/B REFLECTION AVATAR ACCESSIBILITY — LIVE PASS

Frontend-only. Adds keyboard and screen reader polish to the private Reflection Avatar card. `type="button"` on all three button elements (Show again, Hide this ×2). `aria-label="Reflection avatar — private section"` on all three card wrapper divs (hidden, empty, populated). Native `<details>`/`<summary>` disclosure unchanged — built-in keyboard expand/collapse. `:focus-visible` rings added for `.me-avatar-hide-btn`, `.me-avatar-why-summary`, `.me-avatar-hidden .btn-mini`. Mobile touch targets: `min-height:32px` on hide button and disclosure summary. 23 new D-213A smoke tests. Baseline 1980/0/24/57. Worker route static 57/0/1 warn (pre-existing, non-blocking). Owner manual deploy (CC Wrangler VPN/proxy issue). Live sanity PASS (D-213B): keyboard Tab reaches all three interactive elements, Enter/Space activates each, focus-visible rings visible on keyboard focus only, mobile touch targets comfortable, no overflow, hide/show and transparency disclosure all functional, no public avatar/profile exposure, no forbidden wording on public profile. No backend, no API, no migration, no schema, no CSP, no external asset changes.

### `D212A_REFLECTION_AVATAR_HIDE_CONTROL.md` — D-212A/B REFLECTION AVATAR HIDE/SHOW CONTROL — LIVE PASS

Frontend-only. Adds device-local hide/show control to the private Reflection Avatar card. Three localStorage helpers: `isMeReflectionAvatarHidden()`, `setMeReflectionAvatarHidden(hidden)`, `toggleMeReflectionAvatarHidden()`. Key: `humanx.me.reflectionAvatar.hidden`. Fail-open (card shown if localStorage blocked). "Hide this" link at card bottom; hidden placeholder ("Reflection avatar hidden on this device." + "This only changes your private My HumanX view.") with "Show again" button; `meRerender()` fires on toggle for immediate re-render. Registered in `_D181B_ZERO_PARAM_ACTIONS`. No backend, no migration, no public profile change. CSS: `.me-avatar-hide-row`, `.me-avatar-hide-btn`, `.me-avatar-hidden`. 24 new D-212A smoke tests. Baseline 1957/0/24/57. Worker route static 57/0/1 warn (pre-existing, non-blocking). Owner manual deploy (CC Wrangler VPN/proxy issue). Live sanity PASS (D-212B): hide/show toggle immediate, state persists across reload, transparency disclosure and guardrail copy intact after restore, no public avatar/profile exposure, no forbidden wording on public profile. No backend, no API, no migration, no schema, no CSP, no external asset changes.

### `D211A_REFLECTION_AVATAR_TRANSPARENCY.md` — D-211A REFLECTION AVATAR TRANSPARENCY

Frontend-only. Adds a native `<details>`/`<summary>` "How this is formed" disclosure block inside the existing private `meReflectionAvatarHtml(data)` card. Present in both populated and empty states. Explains data source (private activity only), lists three source signals with live counts (Evidence added, Pressure checks, Tests created), and states the non-ranking disclaimer ("not a score, rank, diagnosis, ideology, morality label, intelligence label, or truth rating"). No new JS state, no new fetch, no backend change, no migration, no public profile change. New CSS: `.me-avatar-why`, `.me-avatar-why-summary`, `.me-avatar-why-body`, `.me-avatar-why-list`. 19 new D-211A smoke tests. Baseline 1933/24/57. Worker route static 57/0/1 warn (pre-existing). Live sanity PASS — owner manual deploy (CC Wrangler VPN issue); disclosure opens/closes, counts correct, non-ranking disclaimer and private notice visible; no public avatar or disclosure exposure; no forbidden wording on public profile.

### `D210_REFLECTION_AVATAR_CLOSEOUT.md` — D-210C REFLECTION AVATAR CLOSEOUT

D-210A/B/C arc closeout. D-210A: guardrail spec (forbidden dimensions, safe metaphors, privacy model, required copy). D-210B: private static Reflection Avatar concept card in My HumanX — `meReflectionAvatarHtml(data)`, frontend-only (app-v10.js + styles.css), derives 2–4 safe habit chips from private payload, guardrail copy and private notice hardcoded, not called from public profile render, no backend, no migration. 28 D-210B smoke tests. Baseline 1914/24/57. Live sanity PASS — owner manual deploy (CC Wrangler had certificate/proxy/VPN issue); card appeared after Belief reflection, before Recent Truths; neutral habit chips only; guardrail and private-notice copy confirmed; no public avatar exposure; no forbidden wording on public profile.

### `D210A_BELIEF_AVATAR_GUARDRAIL_SPEC.md` — D-210A BELIEF AVATAR GUARDRAIL SPEC

Spec only — no code. Defines safe and forbidden dimensions, visual metaphors, data sources, privacy model, copy principles, and test requirements for the avatar/show-off layer. Forbidden dimensions (permanent): intelligence, morality, truth level, ideological tribe, religious correctness, political alignment, purity, conspiracy score, credibility ranking. Safe dimensions: investigation style, source diversity, evidence habits, pressure openness, test-seeking, uncertainty posture, reflection mode, exploration rhythm. Required guardrail copy: "Your avatar reflects investigation habits, not intelligence, morality, ideology, or truth." Privacy model: private by default; sharing requires explicit opt-in; no auto-generate; preview-before-publish. Biggest risk: framing drift toward identity label. D-210B recommendation: private static Reflection Avatar concept card in My HumanX, frontend only (app-v10.js + styles.css), no backend, no migration, no public surface change, deploy needed.

### `D209I_SCORES_CONSENT_CLOSEOUT.md` — D-209I SCORES CONSENT ARC CLOSEOUT

D-209G/H/I arc closeout. Scores-only public belief consent end-to-end: POST /api/belief-snapshots/:id/visibility (authenticated, ownership-checked, scores allowlist, all other groups forced false). buildPublicSharedSnapshot gates nested scores object {stabilityScore, opennessScore, pressureScore} behind beliefVisibilityAllows(visibility,'scores'). Owner UI: scores toggle (preview-only on change, save button required). No auto-save. Reversible. Public fields when scores=true: label + contradictionCount + createdAt + scores nested object. alignment_labels/pattern_summary/reflection_habits/drift_history/dominant_pattern/top_beliefs_json permanently excluded. No migration needed (visibility_json live since 0016). Baseline 1886/24/57. Live sanity PASS — owner manual deploy (CC Wrangler had certificate/proxy/VPN issue); toggle ON + Save made nested scores public; toggle OFF + Save hid them; no auto-save, no alignment labels, no pattern summary, no private reflection cards.

### `D209G_OWNER_CONSENT_UI_API_AUDIT.md` — D-209G OWNER CONSENT UI/API AUDIT

Audit of the safest path to owner per-field belief visibility controls. Documents current share model (public_summary_enabled via saveProfileSettings, no existing visibility_json update route), proposed UI location (below meSharedSnapshotPreviewBlockHtml in Profile Settings, scores-only toggle in D-209H), proposed route (POST /api/belief-snapshots/:id/visibility, scores allowlist only, blocked groups forced false, basic_snapshot always true), public response wiring plan (buildPublicSharedSnapshot scores gate, SELECT widening required), field group rollout (scores first, pattern_summary/alignment_labels deferred, reflection_habits/drift_history permanently blocked in this arc), required warnings, and testing plan. Highest-risk UI mistake: auto-save on toggle. D-209H scope: scores-only end-to-end (endpoint + UI toggle + live preview + smoke tests). No code changes in this task.

### `D209E_VISIBILITY_JSON_CLOSEOUT.md` — D-209E VISIBILITY_JSON MIGRATION CLOSEOUT

D-209E arc closeout (D + E + E1 + E2). Migration 0016 applied: ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT (additive, null=all-private). Backend scaffold: parseBeliefVisibility() + beliefVisibilityAllows() live; getPublicProfile parses visibility_json but holds result as _visibility (scaffold only — no new public fields). D-209E1: stabilityScore/opennessScore/pressureScore removed from public sharedSnapshot SELECT and response object (Class-3 sensitive inference requires explicit consent). Public sharedSnapshot now: label + contradictionCount + createdAt only. Deployed version 1f1be492-efd0-4a1c-a778-1285c5e5b8f9. Live sanity PASS. 22 D-209E + 12 D-209E1 smoke tests. Baseline 1839/24/57. Next: D-209F backend consent gate wiring, D-209G owner toggle UI — no public belief expansion before both are live.

### `D209D_BELIEF_PER_FIELD_CONSENT_SPEC.md` — D-209D PER-FIELD BELIEF CONSENT SPEC

Spec only — no code. Defines the full per-field consent model for belief data sharing. Six field groups: (1) basic_snapshot [default on — label/date/tension count], (2) pattern_summary [default off — dominant_pattern renamed patternLabel], (3) alignment_labels [default off — highest risk — named religion/ideology; requires separate acknowledgment; top_beliefs_json never returned raw], (4) scores [default off — stability/openness/pressure], (5) reflection_habits [default off — private-only, excluded from this arc], (6) drift_history [default off — private-only, excluded from this arc]. visibility_json shape defined. API response rules: whitelist per group, no raw blobs, scores omitted from wire when not consented. Warning copy drafted for each group. Implementation sequence: D-209E migration (ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT), D-209F backend gating, D-209G toggle UI. What NOT to implement: avatar, ideology badge, religion card by default, share-all button, public ranking, truth level. Highest risk group: alignment_labels. Baseline 1805/24/57.

### `D209_BELIEF_CONSENT_CLOSEOUT.md` — D-209C SHARED BELIEF SNAPSHOT CONSENT CLOSEOUT

D-209 arc closeout (A audit + B preview alignment). Problem fixed: owner preview (meSharedSnapshotCardHtml) was showing dominantPattern/scores/topAlignmentName that no longer appeared on the actual public card after D-208B — breaking informed consent. D-209B reduced meSharedSnapshotSummary to Class-1 fields only (label, contradictionCount, createdAt); updated meSharedSnapshotCardHtml to mirror renderPublicProfileSnapshotHtml exactly; added explicit sharing scope disclosure ("Shared snapshots show only your chosen label, tension count, and date. Belief alignment details, pattern labels, and reflection cards stay private."). 20 new D-209B tests + 7 stale D-142B/C tests updated. Baseline 1805/24/57. Deploy confirmed, sanity PASS. Owner preview now matches public reality. No stored data deleted. No migration needed. Next: D-209D per-field consent spec before any new public belief fields.

### `D209A_BELIEF_CONSENT_MODEL_AUDIT.md` — D-209A BELIEF CONSENT MODEL AUDIT

Audit only — no code changes. Defines the per-field consent model required before any belief data re-enters the public profile. Maps all 18 belief_snapshots columns into four privacy classes: (1) safe public basics (label, date, contradiction count), (2) sensitive belief identity (dominant_pattern, top_beliefs_json, topAlignmentName — named religion/ideology), (3) sensitive inference (stability/openness/pressure scores, dimensions_json, source habits), (4) private-only reflection (My HumanX cards, raw_json, contradictions_json, stress_points_json). Identifies live gap: owner preview (meSharedSnapshotCardHtml) shows dominantPattern/scores that are no longer on the actual public card — misleading in the safe direction but breaks informed consent. Recommends Option 1 (visibility_json column on belief_snapshots) as the migration path. Recommended D-209B scope: small patch aligning owner preview with actual public render + sharing UI copy update. No new public belief fields until D-209C consent migration + toggle UI are live. Risk summary: public profile LOW, owner preview accuracy MEDIUM, consent model completeness MEDIUM.

### `D208_PRIVATE_BELIEF_REFLECTION_CLOSEOUT.md` — D-208E PRIVATE BELIEF REFLECTION CLOSEOUT

D-208D/E closeout. Adds private-only "Belief reflection" panel to My HumanX below existing Mirror section. Three bar-chart cards: Source habits (source_type distribution), Evidence strength habits (evidence_strength distribution), Investigation activity (evidence/pressure/tests counts). All data from already-loaded /api/my-humanx payload (SELECT * on evidence, home_tests) — no backend changes, no migration. Cards are private-only: renderPublicProfileHtml does not call meBeliefReflectionHtml. Guardrails: "not a score of intelligence, morality, or truth" (panel), "Private reflection only — not a public identity label." (per card). 19 new D-208D smoke tests. Baseline: 1785/24/57. Deploy confirmed, sanity PASS. Public belief labels remain private by default.

### `D208_BELIEF_ENGINE_PRIVACY_CLOSEOUT.md` — D-208B/C BELIEF ENGINE PRIVACY CLOSEOUT

D-208 arc closeout (D-208A audit + D-208B privacy/framing patch). Critical risk fixed: public profile (/api/u/:slug) was returning dominant_pattern (named belief archetype), top_beliefs_json (named religious/ideological alignment array), and topAlignmentName (e.g. "Traditional Christianity", "Scientific Materialism") for any shared snapshot. All three removed from public response. Safe fields retained: label (owner-written), stabilityScore, opennessScore, pressureScore, contradictionCount, createdAt. Stored data not deleted. Private owner view unchanged. Belief Engine copy: "Belief DNA"→"Belief Pattern", "Identity Fragmentation"→"Belief Origin Mix". Guardrail added to results screen: "not a score of intelligence, morality, or truth". My HumanX Mirror guardrail extended: "Private belief reflections are for self-study. They are not personality labels or truth rankings." No migration needed. 12 new D-208B smoke tests + 10 stale tests updated. Baseline: 1766/24/57. Deploy confirmed, sanity PASS. Public profile belief identity labels now private by default.

### `D208A_BELIEF_ENGINE_INTEGRATION_AUDIT.md` — D-208A BELIEF ENGINE INTEGRATION AUDIT

Audit only — no code changes. Maps current Belief Engine state: standalone app (2763-line index.html), 77-question questionnaire scoring 16 dimensions (META/EVID/AUTH/TRIB/PAIN/FUSE/RIGD/OPEN etc.), snapshots stored in belief_snapshots table (stability_score/openness_score/pressure_score/dominant_pattern/top_beliefs_json). Already connected: My HumanX Belief Mirror, snapshot list, public profile shared snapshot, Drift view. Not yet connected: Study view charts, claim votes, source_type/evidence_strength patterns, test activity. Critical live risk: top_beliefs_json on public profile exposes named religious/ideological alignment labels without per-field consent. Risks addressed in D-208B. Safe/unsafe dimension taxonomy, avatar guardrail rules, and 6-task roadmap documented. Baseline: 1744/24/57.

### `D207_STUDY_OVERVIEW_CLOSEOUT.md` — D-207 STUDY OVERVIEW CLOSEOUT

D-207 arc closeout (D-207A density audit + D-207B implementation). Study view now has <details class="inv-overview" open> grouping all 4 chart panels (Source Type Mix, Evidence Strength Mix, Pressure Mix, Test Activity) above the content panels. Study order: header → meters → vote → actions → argument flow → lineage → investigation board → inv-overview[details open] → evidence list → pressure list → tests list → analyses. Shared guardrail note: "investigation context — not a final verdict." Individual chart bottom notes shortened to one line (not removed). Content panels (evidence/pressure/tests/analyses) remain outside details group. Mobile: one-tap collapse reveals content lists. CSS: .inv-overview (grid-column:1/-1), .inv-overview-grid (2-col grid, 1-col at ≤900px), print rule. No chart math changed. No backend changes. No scoring/verdict language added. 19 new smoke tests, 2 stale position tests updated. Baseline: 1744/24/57. Deploy confirmed, sanity PASS.

### `D207A_STUDY_VIEW_DENSITY_AUDIT.md` — D-207A STUDY VIEW DENSITY AUDIT

Docs/audit only. Documents current Study layout (8 panels in study-grid: 4 chart panels + 4 content panels; 2-column grid collapses to 1 column at ≤900px). Strengths: per-claim charts, D-203A guardrails, no extra API calls, no truth score. Density risks: 2 chart panels before evidence on desktop, ~520px of chart scroll on mobile before first evidence card, 4 × ev-origin-note becoming visual noise, empty-state charts on new claims show 4 "nothing yet" messages, "analytical before investigatory" impression. Mobile risks: bar label wrapping at ≤360px, action buttons pushed far down, repeated notes adding ~130px. Recommends Option 2: wrap 4 chart panels in <details class="inv-overview" open> with "Investigation overview" summary + shared consolidated guardrail note replacing 4 individual bottom notes. Reduces mobile note clutter while preserving collapse-to-skip behavior. D-207B should be a small code patch: app-v10.js + styles.css, ~10 new smoke tests. Baseline: 1725/24/57. Implemented in D-207B.

### `D206_PRESSURE_MIX_CLOSEOUT.md` — D-206 PRESSURE MIX CHART CLOSEOUT

Fourth per-claim Study chart: Pressure Mix (renderPressureCategoryMix in app-v10.js). Audit: pressure_points has severity (1-5) only; label/kind columns exist in schema but are null in all rows and not returned by getClaim(). Chart aggregates severity using existing pressureSeverityLabel(). Title is "Pressure mix" — not "Debunking mix" (no adjudication) or "Claim weakness" (measures activity not weakness). Placed as pm-mix-panel before pressure-panel. Bar color var(--yellow) matching existing pressure badge, not var(--green). Does not use votes, AI verdicts, evidence strength, source type, or scoring. Guardrail: "challenge activity not proof claim is false." No backend changes. 20 smoke tests. Deploy + sanity PASS. Chart arc complete: all 4 per-claim Study charts live (Source Type Mix, Evidence Strength Mix, Pressure Mix, Test Activity) — all frontend-only, all D-203A compliant. Baseline: 1725/24/57.

### `D205_TEST_ACTIVITY_CLOSEOUT.md` — D-205 TEST ACTIVITY CHART CLOSEOUT

Third per-claim Study chart: Test Activity (renderTestActivityMix in app-v10.js). Audit found: home_tests has difficulty (easy/medium/hard) and safety_level but no status field — tests are proposals only, no pass/fail exists. Chart aggregates difficulty in fixed order (easy/medium/hard/unknown); null→unknown; title is "Test activity" not "Test results" or "Test coverage" (both ruled out — no results exist, no coverage standard exists). Placed before tests-panel, after pressure-panel (not crowding top evidence chart area). Does not use quality, votes, AI, scoring, or safety_level. Guardrail: "submitted test activity, not proof of truth" and "not a final verdict." CSS reuses .st-mix-* classes. No backend changes. 19 smoke tests. Deploy + sanity PASS. Future: if status/result column added to home_tests, requires separate guardrail review before charting. Baseline: 1705/24/57.

### `D204_EVIDENCE_STRENGTH_MIX_CLOSEOUT.md` — D-204 EVIDENCE STRENGTH MIX CLOSEOUT

Second per-claim Study chart: Evidence Strength Mix (renderEvidenceStrengthMix in app-v10.js). Reads evidence_strength/evidenceStrength from already-loaded evidence array; null→unknown; fixed enum order unknown/weak/moderate/strong/disputed; does not use quality, votes, AI verdicts, or scoring; guardrail copy on every render ("not whether the claim is proven"). Injected as es-mix-panel between st-mix-panel and evidence-panel. CSS reuses D-203B .st-mix-* classes intentionally — matched visual pair. No backend changes. 21 smoke tests. Deploy + sanity PASS. Next safe charts: Test Coverage per claim, Pressure Category Mix per claim. Still deferred: global leaderboards, ideology charts, AI dashboards, belief identity cards. Baseline: 1686/24/57.

### `D203_AGGREGATE_CHARTS_CLOSEOUT.md` — D-203 AGGREGATE CHARTS CLOSEOUT

Full arc closeout: D-203A guardrail spec (chart principle — activity not reality; 9 allowed categories; 12 banned framings; required label copy per chart type; visual risk rules — no green for popularity, no trophy language, no truth-score composite, always show n=), D-203B Source Type Mix chart (renderSourceTypeMix in app-v10.js; per-claim horizontal bars from already-loaded evidence array; source_type/sourceType; null→unknown; --blue bar color, --green not used; required guardrail copy on every render; no backend changes; no scoring/votes/AI verdicts used; 20 smoke tests). Deploy + sanity PASS. Remaining safe charts: Evidence Strength Mix, Test Coverage, Pressure Category Mix (all per-claim, no backend needed). Still deferred: global leaderboards, ideology charts, AI confidence dashboards, belief identity cards. Baseline: 1665/24/57.

### `D203A_AGGREGATE_CHART_GUARDRAILS.md` — D-203A AGGREGATE CHART GUARDRAILS

Docs/audit only — no chart implementation. Establishes rules before any aggregate chart is built. A: chart principle (activity, not reality). B: 9 allowed chart categories (source type mix, evidence strength mix, support/challenge balance, pressure distribution, test coverage, belief drift, moderation state, investigation completeness, user activity). C: banned framings (Top Truths, Most Proven Claims, Truth Score, Reality Ranking, Verified by AI, Majority Says True, Credibility Score, AI Confidence axis). D: required label copy for all chart types. E: visual risk rules (no green for popularity, no trophy language, no ranking by support alone, no single truth score, no fake certainty composite, always show n=). F: recommended first chart — Source Type Mix per claim (per-claim, categorical, reuses D-201 data, no backend needed). G: data requirements (evidence.source_type already in getClaim() response, frontend-only aggregation, null→unknown, min 2 non-null items before display). H: deferred — global leaderboards, AI confidence dashboards, ideology charts, claim scoring histograms, belief identity cards. I: existing surfaces and their current risk level. Baseline: 1645/24/57.

### `D202_AUTHORITY_LAUNDERING_CLOSEOUT.md` — D-202 AUTHORITY LAUNDERING CLOSEOUT

Full arc closeout: D-202A epistemology model, D-202B audit (five surfaces, "Proven" as highest risk), D-202C code fix (removed Proven/Disproven/Reality Collapse from verdict vocabulary; added Strongly Supported/Strongly Contested/Internally Contradictory; added ai_provenance_note + source_type_note to output_contract; instruction forbids claiming independent verification; analysisItem() shows permanent provenance note; paste surfaces warn AI read submitted evidence not external sources; LEGACY_VERDICT_MAP remaps old labels on display without touching DB). Deploy + sanity PASS. Remaining: analysis provenance DB fields, AI-output badge, circular-citation detector, re-entry rule, moderation gate for analysis_results. Baseline: 1645/24/57.

### `D202B_RUNPACK_AUTHORITY_LAUNDERING_AUDIT.md` — D-202B AUTHORITY LAUNDERING AUDIT

Audit of where RunPack/AI outputs could be mistaken for independent verification. Identifies five surfaces at risk: "Proven" in output_contract verdict (HIGH — green badge, implies verification standard the system cannot meet), missing provenance note on analysisItem() card (HIGH), paste surfaces lack AI-input warning (MEDIUM), analyses currently visible to all claim viewers not just submitter (MEDIUM-HIGH), no packet_id/ai_model stored (MEDIUM). Documents the full authority-laundering failure loop. Required language principles. D-202C quick-fix spec: remove "Proven"/"Disproven" from verdict vocabulary, add source_type_note to output_contract, add provenance note to analysisItem(), update two paste-surface copy blocks. Long-term: packet_id FK, AI-output badge, circular-citation detector, re-entry rule. Hard stops: no "AI verified" wording, no auto status upgrades from AI output, no aggregate AI consensus score. Baseline: 1628/24/57.

### `D202A_HUMANX_EPISTEMOLOGY_MODEL.md` — D-202A EPISTEMOLOGY MODEL

Defines what HumanX is and is not: a structured claim-analysis environment, not a truth machine. Covers operational definitions (claim/truth/evidence/pressure/test/belief/confidence/source type/moderation), nine critical separations (popularity ≠ truth, confidence ≠ accuracy, source origin ≠ proof, moderation ≠ endorsement, etc.), the investigation loop, the role of scripture/myth/tradition, aggregate chart warning principles, eight future risk modes (ideology capture, brigading, pseudo-scientific aesthetics, interface confidence conflation, moderation overreach, gamification, drift exploitation, RunPack authority laundering), and the product principle: *HumanX maps and pressures claims. Humans still interpret reality.* Reference document for all future feature decisions. Baseline: 1628/24/57.

### `D201_SOURCE_TAXONOMY_CLOSEOUT.md` — D-201 SOURCE TAXONOMY CLOSEOUT

Full arc closeout: migration 0015 applied to production, D-201E backend (enums, helpers, insertEvidence, all read paths) deployed, D-201F frontend (eSourceType/eEvidenceStrength selects, evidenceItem display, origin-source note) deployed, live sanity PASS. Final state: quality kept as legacy, source_type records origin/category, evidence_strength records self-assessed weight, scoring unchanged. Remaining: RunPack output_contract note, aggregate charts, Belief Engine integration. Baseline: 1628/24/57.

### `D201D_SOURCE_TAXONOMY_API_SPEC.md` — D-201D SOURCE TAXONOMY API SPEC

Exact enums (SOURCE_TYPES 11 values, EVIDENCE_STRENGTHS 5 values), request/response shapes, server validation plan (BAD_SOURCE_TYPE/BAD_EVIDENCE_STRENGTH 400s), all 8 read-query touch points, RunPack output_contract note, Review UI plan, backward-compat table, 3-phase implementation sequence, column guard pattern. Migration must apply before any code reads/writes new columns. Baseline: 1599/24/57.

### `D201C_SOURCE_TAXONOMY_MIGRATION_PREFLIGHT.md` — D-201C MIGRATION PREFLIGHT (APPLIED)

Migration file `migrations/0015_evidence_source_taxonomy.sql` adds `source_type` and `evidence_strength` columns to `evidence` table — additive only, no data rewrite, quality column untouched. 10 smoke tests added. **Migration applied to production 2026-06-28.** Baseline: 1599/24/57.

### `D201B_SOURCE_TAXONOMY_AUDIT.md` — D-201B SOURCE TAXONOMY AUDIT

Audit of evidence `quality` field conflation; proposes `source_type` (11 values) + `evidence_strength` (5 values) as additive columns; full surface map (14 locations); backward-compat migration in 4 stages; no destructive migration; contextual note rule for scripture/myth/fiction sources. Baseline: 1589/24/57.

### `D201A_BELIEF_ENGINE_EXPANSION_ROADMAP.md` — D-201A BELIEF ENGINE EXPANSION ROADMAP

Audit + roadmap for Belief Engine v2: 8 ranked modules (Contradiction Finder, Origin Tracker, Pressure Profile, Confidence Ladder, Avatar Card, Drift, Global Charts), source-type taxonomy (scripture vs empirical), avatar/identity card spec, aggregate chart framing rules, 4-phase implementation plan. Baseline: 1589/24/57.

### `D200A_SOLO_PREVIEW_MODE_PLAN.md` — D-200A SOLO PREVIEW MODE PLAN

No external testers yet. Owner runs 5 personas (anonymous, verified, mobile, skeptical submitter, moderator) to surface friction before recruiting anyone. Includes test loops, anti-fake-confidence rules, debrief template, and post-preview decision criteria. Baseline: 1589/24/57.

### `D199C_OWNER_DRY_RUN_CLOSEOUT.md` — D-199C DRY-RUN CLOSEOUT + BATCH 1 GO

Dry-run PASS. D-199B a11y polish applied. Final status: ready for Batch 1 (3–5 trusted users, not public). Pre-send checklist, monitoring plan, stop conditions, next actions. Baseline: 1589/24/57.

### `D199B_DRY_RUN_ACCESSIBILITY_POLISH.md` — D-199B ACCESSIBILITY POLISH

Accessibility/autofill polish from dry-run DevTools Issues: added `name` attributes to all major form fields (evidence, builder, truths, tests, analysis, admin invite), `for` attributes to all Builder labels, `autocomplete` hints on invite-code fields. No logic or ID changes. Baseline: 1589/24/57.

### `D199A_DRY_RUN_WAIT_STATE.md` — D-199A DRY-RUN WAIT STATE

Handoff doc: owner runs the dry run now using D-198A command pack, pastes result block back. Next step determined by PASS / CONDITIONAL PASS / FAIL. No further code or docs needed before the dry run. Complete launch doc index included. Baseline: 1589/24/57.

### `D198A_OWNER_DRY_RUN_COMMAND_PACK.md` — D-198A OWNER DRY-RUN COMMAND PACK

Single-page copy-paste pack for running the Batch 0 dry run without opening other docs. Exact PowerShell commands (git pull, preflight, optional smoke test, optional deploy), 14-item browser checklist shorthand, fill-in result block, PASS/CONDITIONAL PASS/FAIL decision table. Baseline: 1589/24/57.

### `D197B_DRY_RUN_RESULT_TEMPLATE.md` — D-197B DRY-RUN RESULT TEMPLATE + FIX INTAKE

Fill-in template for immediately after the D-197A dry run. Metadata block, 15-step result table, per-issue intake format (ID/summary/repro/expected/actual/severity/fix/target patch), triage rules (P0/P1 block Batch 1; P2 proceed with disclosure; P3 backlog), patch naming convention (D-197C/D/E), PASS/CONDITIONAL PASS/FAIL decision section, copy-paste summary block. Baseline: 1589/24/57.

### `D197A_OWNER_DRY_RUN_EXECUTION_CHECKLIST.md` — D-197A OWNER DRY-RUN EXECUTION CHECKLIST

Batch 0 dry-run script for the owner to run before inviting anyone. 15 browser steps (Home → Arena → Study → Vote → Copy link → /c/:id → evidence → pressure → test → Builder → My HumanX → profile → RunPack → Review queue → mobile). Record template, PASS/FAIL criteria, cleanup instructions. Budget 45–65 min. Baseline: 1589/24/57.

### `D196A_PREVIEW_SEED_USER_BATCH_PLAN.md` — D-196A PREVIEW SEED-USER BATCH PLAN

Batch 0 (owner dry run) → Batch 1 (3–5 trusted) → Batch 2 (10–20). Five user profiles to cover. Who not to invite. 7-step try-list, feedback template, 5–7 day minimum between batches, explicit go/no-go criteria for Batch 2, stop criteria, and daily operator routine. Baseline: 1589/24/57.

### `D195A_PREVIEW_DEPLOYMENT_SANITY_CHECKLIST.md` — D-195A PREVIEW DEPLOYMENT SANITY CHECKLIST

"Before sending invites today" deployment sanity checklist. Exact terminal commands (git pull, preflight, optional smoke test, wrangler deploy), 8 manual browser checks (Home, Arena, Study, Copy link, /c/:id, public profile, Review queue, mobile), go/no-go decision table, safe failure handling per failure mode. Worker: humanx at humanx.veltrusky-michal.workers.dev. Baseline: 1589/24/57.

### `D194A_PREVIEW_MODERATION_PRESSURE_AUDIT.md` — D-194A PREVIEW MODERATION PRESSURE AUDIT

Moderation survivability audit for 5–20 preview users. Covers rate limits, review states, duplicate detection, shadow-ban gap, queue bottlenecks, 5 abuse scenarios, and estimated operator load (10–15 min/day for medium wave). Verdict: survivable with daily queue checks. D-194B optional before wave 1 — only if shadow-ban gap is a concern. Baseline: 1589/24/57.

### `D193A_PREVIEW_FEEDBACK_INGESTION_AUDIT.md` — D-193A PREVIEW FEEDBACK INGESTION AUDIT

Workflow audit for collecting and triaging feedback from 5–20 preview users. Recommends manual private doc with flat row template (date/user/device/flow/issue/severity/status). P0–P3 + FR severity tiers. Escalation rules, spam handling, what not to collect. D-193B deferred until after wave 1. Baseline: 1589/24/57.

### `D192A_LIGHTWEIGHT_ANALYTICS_AUDIT.md` — D-192A LIGHTWEIGHT ANALYTICS AUDIT

Read-only observability audit. Maps what is visible today (graph counts, Review queue, debug state, owner-token telemetry) vs. what is invisible (Study opens, Copy Link clicks, Builder drop-off, bounce). Top metrics: votes delta, home_tests delta, aip_packets delta, Review queue volume, verified user count. D-192B deferred until after first wave feedback — manual observation sufficient for 5–20 users. Baseline: 1589/24/57.

### `D191C_PREVIEW_OPERATOR_RUNBOOK.md` — D-191C PREVIEW OPERATOR RUNBOOK

Full lifecycle runbook for running a 5–20 user trusted preview. Covers: pre-send checklist, daily Review queue routine, bug triage (P0–P3 with response times), feedback tracker format, invite code tracking rules, what to say when things break, stop/expand decision criteria, and known limitations. Baseline: 1589/24/57.

### `D191B_PREVIEW_USER_INVITE_PACK.md` — D-191B PREVIEW USER INVITE PACK

Short + long invite messages, plain-words product description, suggested try-list (8 flows), 7 feedback questions, copy-paste feedback reply template, known limitations to disclose, operator notes (preflight, Review queue, bug tracking). Baseline: 1589/24/57.

### `D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` — D-191A EXTERNAL PREVIEW LAUNCH CHECKLIST

Docs + runnable preflight script (`node scripts/preview-launch-check.mjs`). 22 automated checks (source files, no jargon, OG metadata, direct claim URL, Review tab gating, invite messaging, baseline). 14 manual browser checks across P0/P1/P2. Stop/go decision table. Known limitations and feedback questions for preview users. Baseline: 1589/24/57.

### `D190_EXTERNAL_PREVIEW_READINESS_CLOSEOUT.md` — D-190E EXTERNAL PREVIEW READINESS CLOSEOUT

Four-patch D-190 series (A audit + B P0 trust fixes + C invite-gate audit + D soft messaging). All P0 blockers resolved. Verdict: ready for 5–20 trusted preview users, not yet public launch. Remaining: real invite/request-access path, social preview pass, public feedback/contact path. Baseline: 1589/24/57.

### `D190C_INVITE_GATE_MESSAGING_AUDIT.md` — D-190C INVITE GATE MESSAGING AUDIT

Read-only audit of all contribution actions vs. the home page invite promise. 7 actions correctly open to anon. 5 actions with copy mismatch (home says invite required, UI doesn't). 0 backend hard gates on verified. Recommendation: 5 soft-gate copy changes in D-190D only — no hard blocks, no backend changes. Baseline: 1578/24/57.

### `D190A_PRODUCT_READINESS_AUDIT.md` — D-190A PRODUCT READINESS AUDIT

Read-only audit for first external users. 4 P0 blockers (D1 live label, Review tab visible, calenhir example link, Reports in graph stats), 5 P1s (anon submit gate, anon handle, Vault/Drift/Truths explanations), plus P2/P3 polish. Readiness verdict: cautiously ready for 5–20 trusted preview users, not ready for broad sharing. Baseline: 1566/24/57.

### `D189_CONTRIBUTION_LOOP_CLOSEOUT.md` — D-189 CONTRIBUTION LOOP CLOSEOUT

Three-patch series (D-189A audit + B quick fixes + C microcopy). All review-gated toasts now say so. Immediately visible items (tests, analysis) say so. Vote toast confirms specific vote. side-panel focus buttons open collapsed sections. Flow panel empty rows have inline CTA buttons. Next-action hint shows for 4s after evidence/pressure submit. Baseline: 1566/24/57.

### `D189A_CONTRIBUTION_LOOP_AUDIT.md` — D-189A CONTRIBUTION LOOP AUDIT

Source-code audit of the evidence/pressure/test/analysis contribution flows. 11 friction points found. Top 5 quick fixes: fix misleading evidence toast, ensure focusAdd* opens collapsed panel, fix false severity reference in pressure empty state, rename "Attach to Selected Claim" button, add clickable CTAs to flow panel empty slots. No code changes. Baseline: 1549/24/57.

### `D188_CLAIM_SHARING_UI_CLOSEOUT.md` — D-188 CLAIM SHARING UI CLOSEOUT

Four-patch series (D-188A audit + B0 test fix + B Study button + C Me/profile rows). copyClaimLink() added; Copy link now present in Study view, My HumanX public claims, and public profile claim rows. Arena cards deferred. Baseline: 1549/24/57.

### `D188A_CLAIM_SHARING_UI_AUDIT.md` — D-188A CLAIM SHARING UI AUDIT

Source-code audit of all claim sharing/copy surfaces. No copy-link UI existed anywhere. Recommends Study view as P1, Me claims + public profile as P2, Arena cards deferred. No code changes. Baseline: 1537/24/57.

### `D187_DIRECT_CLAIM_URL_CLOSEOUT.md` — D-187 DIRECT CLAIM URL CLOSEOUT

Two-patch series (D-187A audit + D-187B implementation). `/c/:id` routes now intercepted by Worker: server-rendered OG shell (claim title, description, og-default.png) for public claims; generic noindex shell for missing/private. SPA auto-opens Study mode via `selectClaim(id)` on boot. Live verified 2026-06-28. Baseline: 1537/24/57.

### `D187A_DIRECT_CLAIM_URL_READINESS_AUDIT.md` — D-187A DIRECT CLAIM URL AUDIT

Source-code audit planning `/c/:id` deep-link support. Full implementation plan: Worker shell, SPA boot patch, OG meta, privacy rules, phased D-187B/C spec. No code changes. Baseline: 1525/24/57.

### `D186_PUBLIC_SHARING_READINESS_CLOSEOUT.md` — D-186 PUBLIC SHARING READINESS CLOSEOUT

Five-patch series (D-186A–E): source-code audit + root OG tags + hero access copy + profile Browse CTA + og:image PNG. 7 of 12 audit issues fixed. No backend changes. Baseline: 1525/24/57.

### `D186A_PUBLIC_LANDING_SHARING_READINESS_AUDIT.md` — D-186A PUBLIC LANDING / SHARING AUDIT

Source-code audit of first-time visitor flows, public profile routes, OG/social sharing, and anonymous-user capabilities. 12 issues found (3 P1, 4 P2, 5 P3). No code changes. Baseline: 1525/24/57.

### `D185_MOBILE_LAYOUT_POLISH_CLOSEOUT.md` — D-185 MOBILE LAYOUT POLISH CLOSEOUT

Three-patch series (D-185A–C): source-code mobile audit + 5 CSS quick fixes + Study side-panel scroll-to-top fix. No backend, no logic changes. Baseline: 1525/24/57.

### `D184_FIRST_USER_FLOW_CLOSEOUT.md` — D-184 FIRST-USER FLOW QA CLOSEOUT

Seven-patch frontend-only series (D-184A–G): QA walkthrough + 10 targeted friction fixes across Study, Arena, Home, and RunPack. No backend, no logic changes. Baseline: 1525/24/57.

### `D183_ONBOARDING_CLARITY_CLOSEOUT.md` — D-183 ONBOARDING CLARITY SERIES CLOSEOUT

Six-patch frontend-only series (D-183A–F): first-use helper copy and empty-state guidance across Home, Claim Builder, Study/Arena, RunPack/Export, Truths/Drift, and My HumanX/Profile. No backend, no logic changes. Baseline: 1525/24/57.

### `D181A_INLINE_HANDLER_MIGRATION_PLAN.md` — D-181A INLINE HANDLER INVENTORY + MIGRATION PLAN
### `D179D_CSP_LIVE_VERIFY.md` — D-179B/D CSP LIVE VERIFIED
### `D180G_REVIEW_QUEUE_LIVE_VERIFY.md` — D-180G REVIEW QUEUE LIVE VERIFIED
### `D180B_PRODUCTION_D1_SCHEMA_PREFLIGHT.md` — D-180B PRODUCTION D1 SCHEMA PREFLIGHT
### `D180A_REVIEW_ADMIN_QUEUE_FAILURE_DIAGNOSTIC.md` — D-180A REVIEW QUEUE FAILURE DIAGNOSTIC
### `D179A_CSP_READINESS_AUDIT.md` — D-179A CSP READINESS AUDIT

Production preflight confirms: health ok/d1-live, /api/session clean, invalid report targetType → 400, invalid evidence claimId → 404, admin token input password, no console logging, /api/review without admin → 403. Global 500, TRUTH_LINK_FAILED, builder context, and safeAll hygiene patches are source/static-verified. Baseline: 1335/24/57.

### `D176B_ERROR_RESPONSE_HYGIENE_PATCH.md` — D-176B ERROR HYGIENE PATCH

Patches D-176A F1/F2/F3/F4: global catch 500 → INTERNAL_ERROR/generic message; TRUTH_LINK_FAILED → safe message; builder context throw → safe message; safeAll lineage errors → label-only (no SQL text). +13 smoke tests. Baseline: 1335/24/57.

### `D176A_ERROR_RESPONSE_STATUS_HYGIENE_AUDIT.md` — D-176A ERROR HYGIENE AUDIT

Audit-only. Three patch-recommended findings: F1 (global catch 500 exposes raw err.message), F2 (TRUTH_LINK_FAILED exposes raw linkErr.message), F3 (truths.js builder context embeds raw cbcErr). One questionable: F4 (lineage.errors carries SQL text in public claim response). All other error surfaces acceptable. Baseline: 1322/24/57.

### `D175D_PUBLIC_ABUSE_ORPHAN_ROW_GUARDRAILS_LIVE_VERIFY.md` — D-175B/D LIVE VERIFIED

Production preflight confirms: health ok/d1-live, /api/session clean (no is_admin/is_shadow_banned), invalid evidence claimId → 404, invalid pressure claimId → 404, admin token input password, no console logging, /api/review without admin → 403. Session rate-limit and CLAIM_NOT_FOUND token are source/static-verified. Baseline: 1322/24/57.

### `D175B_PUBLIC_ABUSE_ORPHAN_ROW_GUARDRAILS_PATCH.md` — D-175B ABUSE GUARDRAIL PATCH

Patches D-175A F1/F2/F3: session rate limit (30/hr/IP), claim existence check in addEvidence(), claim existence check in addPressure(). +14 smoke tests. Baseline: 1322/24/57.

### `D175A_PUBLIC_ABUSE_RATE_LIMIT_GUARDRAIL_AUDIT.md` — D-175A ABUSE GUARDRAIL AUDIT

Audit-only. Three findings: F1 (/api/session no rate limit), F2 (addEvidence no claim existence check), F3 (addPressure no claim existence check). All review-first gating confirmed intact. Baseline: 1308/24/57.

### `D174D_HOME_TEST_RAW_ROW_RESPONSE_LIVE_VERIFY.md` — D-174B/D LIVE VERIFIED

Production preflight confirms: health ok/d1-live, /api/session does not expose is_admin or is_shadow_banned, admin token input is type=password, no console logging, /api/review without admin returns 403. mapHomeTest() behavior is source/static-verified by D-174B tests (baseline 1308). Baseline: 1308/24/57.

### `D174B_HOME_TEST_RAW_ROW_RESPONSE_PATCH.md` — D-174B HOME TEST MAPPER PATCH

addHomeTest() now returns test:mapHomeTest(row) instead of raw test:row. mapHomeTest() explicit allowlist omits user_id and future columns. Frontend unaffected (discards response, reloads claim). 8 new smoke tests. Baseline: 1308/24/57.

### `D174A_GLOBAL_RAW_ROW_SELECT_STAR_EXPOSURE_AUDIT.md` — D-174A GLOBAL RAW-ROW AUDIT

Full audit of all SELECT *, raw row returns, and object spreads across 17 src files. One finding (F1, low risk): addHomeTest() returns raw home_tests row to own-user — no user_id/admin fields in home_tests today but inconsistent with mapper pattern. All other surfaces clean: no public raw rows, admin raw rows gated by requireAdmin(), export SELECT * approved by D-138B. D-174B: add mapHomeTest(). Baseline: 1300/24/57.

### `D173D_PUBLIC_MUTATION_GUARDRAILS_LIVE_VERIFY.md` — D-173B/D LIVE VERIFIED

Production preflight from owner terminal confirms: health ok/d1-live, /api/session does not expose is_admin or is_shadow_banned, invalid report targetType returns 400, invalid linkedClaimId returns 400, /api/review without admin returns 403. Report dedupe and convertTruthToClaim sanitization are source/static verified by D-173B tests (baseline 1300). Baseline: 1300/24/57.

### `D173B_PUBLIC_MUTATION_GUARDRAILS_PATCH.md` — D-173B PUBLIC MUTATION GUARDRAILS PATCH

All four D-173A findings patched. P1: reportTarget targetType allowlist (claim/evidence/pressure/truth). P2: per-user per-target report dedupe — duplicate returns ok:true,duplicate:true without incrementing. P3: createTruth validates linkedClaimId existence and state before insert. P4: convertTruthToClaim wraps all claim return paths through mapClaim(). 15 new smoke tests. Baseline: 1300/24/57.

### `D173A_PUBLIC_MUTATION_PATH_AUDIT.md` — D-173A PUBLIC MUTATION AUDIT

All 17 public mutation routes audited. Review-first enforced on all user content. Shadow-ban on all write routes. No admin/moderation field injection possible. F1–F4 all patched in D-173B. Baseline: 1285/24/57.

### `D172D_ADMIN_REVIEW_KEYBOARD_RECOVERY_LIVE_VERIFY.md` — D-172B/D LIVE VERIFIED

All D-172B frontend patches confirmed in production JS. Keyboard two-step copy, `requestRejectReview` arm flow, all three `clearAdminToken` resets, password input, no console logging — all True. `/api/review` 403 without token confirmed. Baseline: 1285/24/57.

### `D172B_ADMIN_REVIEW_KEYBOARD_RECOVERY_PATCH.md` — D-172B KEYBOARD/RECOVERY PATCH

Keyboard `R` reject made two-step (arm → confirm) to match card/panel UX. `clearAdminToken()` now resets all three pending action states. D-164B smoke test updated. New baseline: 1285/24/57.

### `D172A_ADMIN_REVIEW_MUTATION_PATH_AUDIT.md` — D-172A ADMIN REVIEW MUTATION AUDIT

All 5 review mutation routes confirmed `requireAdmin`-gated. Approve/reject two-step in card and inspect-panel UI. F1 (low): keyboard `R` rejects without arm step, inconsistent with card UI. F2 (very low): `clearAdminToken()` resets only `pendingRejectReviewId`, not approve/cleanup pending state. D-172B recommended: KB hint clarification and `clearAdminToken()` consistency fix. Baseline: 1274/24/57.

### `D171E_RUNPACK_EXPORT_CLAIM_PAYLOAD_LIVE_VERIFY.md` — D-171B/C LIVE VERIFIED

Production confirmed: `safeRunPackClaim()` present; fallback RunPack uses it; `safeExportUser()` intact; admin token masked; no console logging. Backend `/api/runpack` POST confirmed — all 14 moderation/internal fields absent from `payload.claim`. `/api/review` returns 403. `downloadJSON` probe regex too narrow (defensive `(claims||[])` wrapper) — static smoke test is authoritative. Baseline: 1274/24/57.

### `D171C_BACKEND_RUNPACK_CLAIM_PAYLOAD_PATCH.md` — D-171C BACKEND RUNPACK CLAIM PAYLOAD PATCH (live-verified in D-171E)

`safeRunPackClaimBackend()` helper added to `src/worker.js`; `buildRunPack()` now applies it to `payload.claim`. Strips the same moderation/dedup/admin fields as D-171B (`nearDuplicateOf`, `duplicateOf`, `statusLocked` etc). `mapClaim()` unchanged. +13 smoke tests. New baseline: 1274/24/57.
**Read before any backend RunPack or buildRunPack change.**

### `D171B_RUNPACK_EXPORT_CLAIM_PAYLOAD_PATCH.md` — D-171B RUNPACK/EXPORT CLAIM PAYLOAD PATCH (backend completed in D-171C)

`safeRunPackClaim()` helper added; fallback RunPack `payload` and `downloadJSON()` claims array now use it. Strips `nearDuplicateOf`, `duplicateOf`, `statusLocked` (and all non-allowlisted fields) from exported claim objects. Backend `mapClaim()` unchanged. +12 smoke tests. New baseline: 1261/24/57.
**Read before any RunPack, export, or claim-payload change.**

### `D171A_RUNPACK_EXPORT_PAYLOAD_ALLOWLIST_AUDIT.md` — D-171A RUNPACK/EXPORT PAYLOAD ALLOWLIST AUDIT (patched in D-171B)

All RunPack/copy/download/export payload surfaces audited. No token, email, user_id, invite code, or secret material found. F1: `mapClaim()` includes three internal dedup/admin fields (`nearDuplicateOf`, `duplicateOf`, `statusLocked`) in RunPack `payload.claim` and JSON download `claims` — not secrets, but unnecessary for AI consumers. D-171B recommended: `safeRunPackClaim()` helper. D-169B export containment confirmed intact. Baseline: 1249/24/57.
**Read before any RunPack, export, or claim-payload change.**

### `D170A_OWNER_TOKEN_ADVISORY_CONTAINMENT_AUDIT.md` — D-170A OWNER-TOKEN CONTAINMENT AUDIT (prior current)

All owner-token surfaces audited: session response, localStorage, in-memory user object, request headers, backend telemetry logging, admin review UI, public UI, public APIs, export/download, docs. No leaks found. `/api/session` returning `owner_token` is confirmed intentional D-148A advisory bootstrap. Export path clean post-D-169B. D-149H hold confirmed in effect. No patches recommended. Baseline: 1249/24/57.

### `D169D_FRONTEND_EXPORT_OWNER_TOKEN_LEAK_LIVE_VERIFY.md` — D-169B LIVE VERIFIED (audited in D-170A)

Production confirmed: `safeExportUser()` present in JS; `downloadJSON` uses it; raw user spread absent; admin token input masked; no console logging. `/api/session` does not expose `ownerToken` (camelCase) or `is_shadow_banned`/`is_admin`; does return `owner_token` (snake_case, existing advisory behavior per D-149H). `/api/review` returns 403 without admin token. Baseline: 1249/24/57.

### `D169B_FRONTEND_EXPORT_OWNER_TOKEN_LEAK_PATCH.md` — FRONTEND EXPORT TOKEN LEAK PATCH (live-verified in D-169D)

`safeExportUser()` helper added; `downloadJSON()` now exports `{id, handle}` only — never `ownerToken`. +9 new smoke tests. New baseline: 1249/24/57.
**Read before any frontend export/downloadJSON change.**

### `D169A_FRONTEND_STORAGE_TOKEN_HANDLING_AUDIT.md` — FRONTEND STORAGE/TOKEN AUDIT (F2 patched in D-169B)

Admin token: masked input, localStorage only, never logged or rendered. Owner token: advisory-only, never rendered in UI. F2 (ownerToken in downloadJSON) patched in D-169B. F1 (user ID in Me card) accepted as-is. Baseline: 1240/24/57.
**Read before any frontend token/storage/export change.**

### `D168D_PUBLIC_API_RESPONSE_ALLOWLIST_LIVE_VERIFY.md` — D-168B LIVE VERIFIED (patched in D-168B, verified in D-168D)

Production confirmed: `is_shadow_banned`/`is_admin` absent from `/api/session`; `duplicate_signature`/`user_id`/`is_shadow_banned`/`is_admin`/`email` absent from `/api/claims/:id` and `/api/evidence-vault`; `users`/`rateLimits`/`duplicateSignatures`/`summary` absent from `/api/graph-status`; `/api/review` returns 403 without admin token. Baseline: 1240/24/57.

### `D168B_PUBLIC_API_RESPONSE_ALLOWLIST_PATCH.md` — PUBLIC API RESPONSE ALLOWLIST PATCH (live-verified in D-168D)

All D-168A gaps patched: `is_shadow_banned` removed from `/api/session`; `getClaim()` evidence/pressure/tests use explicit column SELECTs (no `user_id`/`duplicate_signature`); evidence vault drops `duplicate_signature`; graph-status reduced to 6 product-visible table counts. +17 new smoke tests. Baseline: 1240/24/57.
**Read before any public route response field change.**

### `D168A_PUBLIC_API_RESPONSE_ALLOWLIST_AUDIT.md` — PUBLIC API RESPONSE ALLOWLIST AUDIT (patched in D-168B)

### `D167A_REVIEW_QUEUE_FIELD_CONTRACT_AUDIT.md` — REVIEW QUEUE FIELD CONTRACT AUDIT

All 25 claim fields used by the Review UI confirmed present in D-166B explicit SELECT or via attachClaimBuilderContexts(). Five dropped columns confirmed unused. No code changes needed. Baseline: 1223/24/57.

### `D166D_SENSITIVE_METADATA_GUARDRAILS_LIVE_VERIFY.md` — D-166B LIVE VERIFIED

Production confirmed: health ok/d1-live, /api/review returns 403 without admin, is_shadow_banned absent from /api/me + /api/my-humanx + /api/my-humanx/export, admin token input password-masked, no console logging in production JS. Baseline: 1223/24/57 unchanged.
**Read before starting any follow-on metadata/privacy or next-feature work.**

### `D166B_SENSITIVE_METADATA_GUARDRAILS_PATCH.md` — SENSITIVE METADATA GUARDRAILS PATCH (live-verified in D-166D)

reviewQueue c.* wildcard replaced with explicit column allowlist (F-01). is_shadow_banned removed from /api/me, /api/my-humanx, /api/my-humanx/export, and invite redeem responses (F-04/F-06). Shadow-ban enforcement in requireUser unchanged. 8 smoke tests added/updated. Baseline: 1223/24/57.
**Read before starting any metadata/privacy work.**

### `D164D_SAFER_REVIEW_APPROVAL_ACTIONS_LIVE_VERIFY.md` — D-164B LIVE VERIFIED

Version ID: 366b67a2-7386-452b-9933-f5eb38b72fb3. All preflight checks passed. All admin visual checks passed. Baseline: 1209/24/57.

### `D164B_SAFER_REVIEW_APPROVAL_ACTIONS.md` — D-164B SAFER REVIEW APPROVAL ACTIONS

Inspect-panel Approve now two-step (was one-click). Keyboard `A` now arms pending on first press, confirms on second. Admin token input masked with `type="password"`. No backend changes. 11 new tests, 7 pre-existing tests updated. Baseline: 1209/24/57.
**Read before D-164C bump/deploy or any review/admin flow work.**

### `D164A_REVIEW_ADMIN_MODERATION_WORKFLOW_AUDIT.md` — REVIEW/ADMIN MODERATION WORKFLOW AUDIT

All five review routes admin-gated. Main gaps: inspect-panel Approve is one-click (no confirm), keyboard `A` approves immediately, admin token shown as plaintext. D-164B: add two-step confirm to inspect-panel Approve (required); `type="password"` token input (optional); keyboard guard (optional).
**Read before starting D-164B or any review/admin flow work.**

### `D163D_SUBMIT_CLAIM_CLARITY_LAYER_LIVE_VERIFY.md` — D-163B LIVE VERIFIED

Version ID: b6d46668-5048-46e5-809c-f082e672eb46. All preflight checks passed. All visual checks passed. Baseline: 1198/24/57.

### `D163B_SUBMIT_CLAIM_FIRST_TIME_CLARITY_LAYER.md` — D-163B SUBMIT CLAIM CLARITY LAYER

Frontend only. Added `.builder-intro` subtitle ("Anyone can submit … pseudonymously … after review"), extended Step 1 footer to mention review, added `.builder-truth-vs-claim` note in Truth route, added "Usually within a few days" to success state. 11 new smoke tests. Baseline: 1198/24/57. No backend changes.
**Read before D-163C bump/deploy or any builder flow changes.**

### `D163A_SUBMIT_CLAIM_FIRST_TIME_USER_AUDIT.md` — SUBMIT CLAIM FIRST-TIME USER AUDIT

Builder flow is good. Gap: no "anyone can submit" copy (visitors assume invite required). No subtitle, no review mention in Step 1. D-163B plan: builder-intro subtitle, Step 1 footer note, Truth-vs-Claim note, success timeline hint. No backend changes.

### `D162D_CLAIM_STUDY_PUBLIC_READING_GUIDE_LIVE_VERIFY.md` — D-162B LIVE VERIFIED

Version ID: 82919838-3cab-420b-9c80-40ca181f986c. All 8 preflight checks passed. Orientation sentence, meter key, vote note, RunPack tooltip, renamed sections all confirmed live.

### `D162B_CLAIM_STUDY_PUBLIC_READING_GUIDE.md` — CLAIM STUDY PUBLIC READING GUIDE

Orientation sentence, inline meter key, vote note, RunPack tooltip, "Claim Flow"→"How this claim is being tested", "Lineage"→"Origin and truth trail". 14 new smoke tests (1187/24/57).
**Read before starting D-162C (bump/deploy) or any study view work.**

### `D162A_CLAIM_DETAIL_STUDY_FIRST_VISITOR_AUDIT.md` — CLAIM DETAIL/STUDY FIRST VISITOR AUDIT

Study view is public-safe and clean. "Claim Flow" label opaque, no intro sentence, meter bars unexplained, "Lineage" jargon. D-162B plan: rename Claim Flow, add intro + meter legend + vote note + RunPack tooltip. No backend changes.
**Read before starting D-162B or any study/detail view work.**

### `D161D_BROWSE_CLAIMS_PUBLIC_CLARITY_LIVE_VERIFY.md` — D-161B LIVE VERIFIED

Version ID: a33d0d09-0ad7-4d88-9d0b-1a5f25e496e1. All 8 preflight checks passed. Intro visible, stats collapsed, CTA "Investigate →", verdict copy updated, error heading visitor-safe.

### `D161B_BROWSE_CLAIMS_PUBLIC_CLARITY_LAYER.md` — BROWSE CLAIMS PUBLIC CLARITY LAYER

Intro subheading added, graph stats collapsed by default, CTA renamed to "Investigate →", verdict explanation copy improved, renderError heading visitor-safe. 12 new smoke tests (1173/24/57).
**Read before starting D-161C (bump/deploy) or any Browse Claims / arena UX work.**

### `D161A_BROWSE_CLAIMS_FIRST_VISITOR_AUDIT.md` — BROWSE CLAIMS FIRST VISITOR AUDIT

Claims list lacks inline "what is a claim?" copy. Graph stats box reads as admin panel. 5 friction points identified. D-161B plan: intro subheading, collapse graph box, copy improvements. No backend changes needed.
**Read before starting D-161B or any Browse Claims / arena UX work.**

### `D160D_INVITE_ACCESS_COPY_BRIDGE_LIVE_VERIFY.md` — D-160B LIVE VERIFIED

Version ID: 35ac0544-ffc2-4795-aa0d-b30148aaa01a. All 8 preflight checks passed. Badge shows ◎ Invite, no-code note visible, redeem form intact, no invite codes exposed.

### `D160B_INVITE_ACCESS_COPY_BRIDGE.md` — INVITE ACCESS COPY BRIDGE

Anonymous badge changed to `◎ Invite`. No-code private-preview copy added to account panel. 12 new smoke tests (1161/24/57). Frontend only — no backend changes.
**Read before starting D-160C (bump/deploy) or any account panel / invite UX work.**

### `D160A_INVITE_ACCESS_PATH_AUDIT.md` — INVITE/ACCESS PATH AUDIT

Invite creation correctly gated (requireAdmin + admin UI only). Redemption clean (atomic, rate-limited, no is_admin). Gap: no "don't have a code?" path. D-160B plan: add copy to account panel, optional badge label hint. No backend changes needed.
**Read before starting D-160B or any invite/account/join flow work.**

### `D159D_PUBLIC_HOME_CLARITY_BRIDGE_LIVE_VERIFY.md` — D-159B LIVE VERIFIED

All 8 preflight checks passed. Production running D-159B / f2ca9d8 / 1149/24/57. All home visual checks confirmed by owner.
**Read when:** returning after D-159B/C/D to plan next work.

### `D159B_PUBLIC_HOME_CLARITY_BRIDGE.md` — PUBLIC HOME CLARITY BRIDGE (live-verified in D-159D)

Badge → "invite-only preview", one-sentence intro, bridge link to /u/calenhir, Browse Claims promoted to first card. Baseline: 1149/24/57. Next: D-159C bump + live verify.
**Read before starting D-159C or any home/landing work.**

### `D159A_PUBLIC_ONBOARDING_LANDING_CLARITY_AUDIT.md` — ONBOARDING/LANDING CLARITY AUDIT (implemented in D-159B)

Home page is a full app dashboard, not a landing page. No "invite-only" copy, no profile discovery path. Recommended D-159B: remove "working system" badge, add one-sentence invite/profile intro, reorder action cards. Full plan inside.
**Read before starting D-159B or any home/landing work.**

### `D158D_PUBLIC_PROFILE_SNAPSHOT_FIRST_LIVE_VERIFY.md` — D-158B LIVE VERIFIED

All 8 preflight checks passed. Version ID: `1236c30c-5ed8-45ab-a050-3acaf5f59c24`. Production running D-158B / 9784116 / 1138/24/57. All visual/order checks confirmed by owner.
**Read when:** returning after D-158B/C/D to plan next work.

### `D158B_PUBLIC_PROFILE_SNAPSHOT_FIRST_HIERARCHY.md` — SNAPSHOT-FIRST HIERARCHY (live-verified in D-158D)

Snapshot promoted before context block, counts moved after truths, empty truths/evidence/pressure sections suppressed, bio fallback from snapshot when bio absent. Baseline: 1138/24/57. Next: D-158C bump + live verify.
**Read before starting D-158C or any public profile ordering work.**

### `D158A_PUBLIC_PROFILE_CONTENT_HIERARCHY_AUDIT.md` — CONTENT HIERARCHY AUDIT (implemented in D-158B)

Snapshot promoted before context block, counts moved to footer, empty secondary sections suppressed, optional bio fallback from snapshot. Full recommended D-158B plan inside.
**Read before starting D-158B or any public profile content ordering work.**

### `D157B_PUBLIC_PROFILE_MOBILE_VISUAL_POLISH_LIVE_VERIFY.md` — D-157A LIVE VERIFIED

All 8 preflight checks passed. Version ID: `7a97b3d0-c581-4edd-80a5-ef38d2e16ffe`. Production running D-157A / ea2f899 / 1120/24/57. Visual/mobile checks confirmed by owner.
**Read when:** returning after D-157A/B to plan next work.

### `D157A_PUBLIC_PROFILE_MOBILE_VISUAL_QA_POLISH.md` — D-157A MOBILE/VISUAL QA POLISH (live-verified in D-157B)

Mobile overflow safeguards (`min-width:0`, `overflow-wrap:anywhere` on item text, display name, bio), context block readability bump (12px), `pp-footer-actions` stacking on mobile, snapshot card blue-tinted border. Baseline: 1120/24/57. Next: D-157B bump + live verify.
**Read when:** returning after D-157A to plan D-157B or next public profile work.

### `D156B_PUBLIC_PROFILE_INTERACTION_POLISH_LIVE_VERIFY.md` — D-156A LIVE VERIFIED

Owner confirmed preflight PASS (8/8) and all visual/interaction checks. Production running D-156A / 58e0258 / 1107/24/57. Verbatim terminal output not captured (see standing note in doc).
**Read when:** returning after D-156A/B to plan next work.

### `D156A_PUBLIC_PROFILE_INTERACTION_ACCESSIBILITY_POLISH.md` — PUBLIC PROFILE INTERACTION/A11Y POLISH (live-verified in D-156B)

aria-expanded + aria-controls on show-more toggles; "Copied!" feedback + disabled state on copy-link button; .btn-secondary CSS defined; 44px mobile tap targets. 16 new smoke tests. Baseline: 1107/24/57. Frontend/CSS only.
**Read when:** editing public profile frontend or planning D-156B live-verify.

### `D155B_PUBLIC_PROFILE_DENSITY_POLISH_LIVE_VERIFY.md` — D-155A LIVE VERIFIED

Preflight 8/8 PASS. Production running D-155A / 122ac14 / 1091/24/57 confirmed. Deploy uploaded styles.css + app-v10.js. Version ID: 5e6530b0.
**Read when:** returning after D-155A/B to plan next work.

### `D155A_PUBLIC_PROFILE_DENSITY_READABILITY_POLISH.md` — PUBLIC PROFILE DENSITY POLISH (live-verified in D-155B)

Show-more/show-less toggle for evidence (5 default) and pressure (5 default), visitor-friendly empty states, display name 22px, bio 13px/1.5 line-height, section h3 14px bold, item title 13px readable vs. muted metadata, pp-card explicit 14px padding, de-emphasised counts label. 18 new smoke tests. Baseline: 1091/24/57. Frontend/CSS only. No backend, migration, or owner-token changes.
**Read when:** editing public profile frontend or planning D-155B live-verify.

### `D154C_PUBLIC_PROFILE_CLARITY_LAYER_LIVE_VERIFY.md` — D-154B LIVE VERIFIED

Preflight passed (8/8). Visual check confirmed: context block, visitor-friendly labels, "View in HumanX →" CTA, copy-link, no private data exposure. Baseline: 1073/24/57 unchanged.
**Read when:** returning after D-154B/C to plan next work.

### `D154B_PUBLIC_PROFILE_CLARITY_LAYER.md` — PUBLIC PROFILE CLARITY LAYER (live-verified in D-154C)

### `D154A_PUBLIC_PROFILE_PRODUCT_AUDIT.md` — PUBLIC PROFILE PRODUCT AUDIT (implemented in D-154B)

Full product audit of public profile (`/u/:slug`). Privacy verdict: clean — no `is_admin`, `email`, `owner_token`, `user.id`, evidence/pressure body, or non-public content leaks. Strengths: privacy off by default, consistent 404 treatment, OG tags, owner-recognises-own-profile. Key friction: F-1 (no HumanX context for first-time visitor), F-2 (jargon terminology opaque to outsiders), F-3 (counts-first buries snapshot), F-4 (Open Study CTA cold-drops visitor into app). Mobile: acceptable. Recommended D-154B: add context block, reorder cards (snapshot before counts), consolidate disclaimers, lightweight CTA. No code change. No owner-token work. Baseline: 1057/24/57, unchanged.
**Read when:** starting new feature work or returning after time away.

### `D153B_ADMIN_DEBUG_INVENTORY_DRIFT_FIX.md` — INVENTORY DOCS DRIFT FIXED (audit in D-153A)

Corrects `docs/API_ENDPOINT_INVENTORY.md`: `GET /api/debug` was incorrectly described as "relies on obscurity only" — D-153A audit confirmed `requireAdmin` is in place. Visibility updated from `Internal-ish` to `Admin only (D-153B)`; risk note updated to state 403 on unauthenticated calls. Docs only. Baseline: 1057/24/57, unchanged.
**Read when:** starting new feature work or returning after time away.

### `D153A_ADMIN_REVIEW_SURFACE_SAFETY_AUDIT.md` — ADMIN/REVIEW SURFACE AUDIT CLEAN (drift fixed by D-153B)

Full audit of admin/review surface. 11 admin-gated routes found — all call `requireAdmin` as first statement before any D1 or response. `requireAdmin` is timing-safe (`safeEqual`), fail-closed when `HUMANX_ADMIN_TOKEN` unset. All 5 review routes correctly gated. `is_admin` field confirmed omitted from every user-facing response. Frontend stores admin token in `localStorage` under `humanx_admin_token_v1` only, never logs it. No ungated admin routes found. Weak spots documented (W-1: docs drift on `/api/debug` description, W-2: `exportMyHumanX` `SELECT *` on non-user tables, W-3/W-4: admin-only access to pre-approval content — all intentional). Recommended next: D-153B fix `/api/debug` inventory description. No code change. No owner-token work resumed. Baseline: 1057/24/57, unchanged.
**Read when:** reviewing D-153/D-154 history.

### `D152B_LIVE_PREFLIGHT_LIVE_VERIFICATION_CHECKPOINT.md` — LIVE PREFLIGHT CONFIRMED END-TO-END (audit in D-153A)

`scripts/live-preflight.mjs` confirmed working against production. All 8 preflight checks passed: `/api/version` HTTP 200, `ok`, `app`, `checkpoint D-152A`, `commit c6d1437`, `baseline 1057/24/57`, `/api/health` HTTP 200 and `ok`. Full D-150/151/152 provenance workflow now verified end-to-end: bump helper writes metadata → `/api/version` returns it live → preflight script checks it programmatically. No browser console step needed for future pre-verification. Verification only — no code/migration/`wrangler.toml` change. Baseline: 1057/24/57 (1 expected parameterised-route warning), unchanged.
**Read when:** starting new feature work or returning after time away.

### `D152A_LIVE_PREFLIGHT_SCRIPT_CHECKPOINT.md` — LIVE PREFLIGHT SCRIPT ADDED (confirmed live by D-152B)

Adds `scripts/live-preflight.mjs` — a direct-node script that performs the public-safe production preflight check before any live-verification session. Usage: `node scripts/live-preflight.mjs <baseUrl> <checkpoint> <commit> <baseline> [--json]`. Fetches `/api/version` and `/api/health`; verifies 8 conditions (HTTP status, ok, app, checkpoint, commit, baseline); exits non-zero on any mismatch with a `FAIL:` report showing expected vs got. No auth, no secrets, no env reads, no `wrangler`, no file writes. Supports `--json` for machine-readable output. Does not prove D1 migrations are current or that all routes work. 15 new smoke tests. Baseline: 1057/24/57 (1 expected parameterised-route warning).
**Read when:** starting new feature work or returning after time away.

### `D151B_DEPLOY_META_BUMP_HELPER_LIVE_VERIFICATION_CHECKPOINT.md` — DEPLOY METADATA BUMP HELPER CONFIRMED LIVE (preflight script added in D-152A)

D-151A's `scripts/bump-deploy-meta.mjs` helper confirmed end-to-end in production. Owner-verified, sanitized: `GET /api/version` returns `checkpoint: D-151A`, `commit: f77390b`, no secrets or user data. Baseline field shows `1040/24/57` (cosmetic deploy-time drift — local is `1042/24/57`; the discrepancy is informational only and does not gate anything). Helper workflow is verified: bump script → checks → commit → deploy → `/api/version` confirms. Verification only — no code/migration/`wrangler.toml` change. Baseline: 1042/24/57 (1 expected parameterised-route warning), unchanged.
**Read when:** starting new feature work or returning after time away.

### `D151A_DEPLOY_META_BUMP_HELPER_CHECKPOINT.md` — DEPLOY METADATA BUMP HELPER ADDED (confirmed live by D-151B)

Adds `scripts/bump-deploy-meta.mjs` — a direct-node helper that updates `src/deploy-meta.js` before each manual deploy. Usage: `node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>`. Reads the current git short SHA automatically; validates checkpoint (no whitespace) and baseline (must match `NNN/NN/NN`); writes `app/checkpoint/commit/baseline/updated_at`; never reads env, never calls `wrangler deploy`. Prints next-step instructions after writing. Fourteen new smoke tests guard: file exists, all fields written, no secrets/env/exec-deploy, writes only to `deploy-meta.js`, route still uses the module, no enforcement resumed. `deploy-meta.js` bumped to D-151A/1042/24/57. Baseline: 1042/24/57 (1 expected parameterised-route warning).
**Read when:** reviewing D-151/D-152 history.



### `D150B_DEPLOY_PROVENANCE_LIVE_VERIFICATION_CHECKPOINT.md` — DEPLOYMENT PROVENANCE CONFIRMED LIVE (helper added in D-151A)

D-150A's `GET /api/version` endpoint confirmed live in production. Owner-verified, sanitized: `ok: true`, `app: humanx`, `checkpoint: D-150A`, `commit: 4d79c18`, `baseline: 1028/24/57`, `updated_at: 2026-06-24T00:00:00Z`, advisory `note` present. No secrets, tokens, admin fields, or user data in the response. Endpoint is public-safe, no auth required. Provenance system is working end-to-end. Before any future live-verification pass, pull `/api/version` first to confirm production is running the expected commit. Verification only — no code/migration/`wrangler.toml` change. Baseline: 1028/24/57 (1 expected parameterised-route warning), unchanged.
**Read when:** reviewing D-150 history.

### `D150A_DEPLOY_PROVENANCE_GUARD_CHECKPOINT.md` — DEPLOYMENT PROVENANCE GUARD ADDED (confirmed live by D-150B)

Adds `GET /api/version` (public, no auth, no D1) returning static deployment metadata from `src/deploy-meta.js`: `app`, `checkpoint`, `commit`, `baseline`, `updated_at`, advisory `note`. Solves the D-149 live-verification confusion where production was running stale Worker code while the repo had the new endpoint. Pull `/api/version` before any live-verification pass to confirm the expected commit is actually deployed. `deploy-meta.js` must be updated and redeployed on each manual deploy. Twelve new smoke tests guard: module exists, required fields present, no secrets/tokens/user data, route registered, route is not admin-gated, no D1 query, no enforcement resumed, inventory current. API inventory updated. Baseline: 1028/24/57 (1 expected parameterised-route warning).
**Read when:** reviewing D-150 history.

### `D149H_PASSIVE_OWNER_TOKEN_TELEMETRY_HOLD_PROTOCOL.md` — OWNER TOKEN HOLD PROTOCOL — D-149 CHAIN CLOSED

Freezes the enforcement decision and defines exact re-review thresholds after D-149G's first organic review (n=19/7d, valid_ratio 1.0, zero non-valid events, single user). No enforcement and no soft-warning design are allowed until one of five thresholds is met: T1 (7d total_count ≥ 50), T2 (7d total_count ≥ 100), T3 (any non-valid bucket > 0), T4 (a second real user appears), T5 (valid_ratio drops below 0.98). Includes the exact browser-console snippet for pulling the next sanitized 1h/24h/7d review, an explicit stop condition, and recommended non-token workstreams. Docs only. Baseline: 1016/24/57 (1 expected parameterised-route warning), unchanged. D-149 chain closed pending T1–T5.
**Read when:** reviewing D-149 history.

### `D149G_PASSIVE_OWNER_TOKEN_TELEMETRY_REVIEW_CHECKPOINT.md` — FIRST ORGANIC TELEMETRY REVIEW (hold protocol defined in D-149H)

First organic/passive review of owner-token telemetry using live time-windowed data (D-149E/F). Evidence: `total_count` 1/5/19 across 1h/24h/7d; `valid_ratio: 1.0` in all windows; zero non-valid events; all 8 owner routes observed across 7d with read-heavy distribution consistent with natural use. Sample is still small (n=19, single user). No non-valid events observed, so there is no empirical basis for soft-warning calibration or hard enforcement. Verdict: hard enforcement not justified; soft-warning design (D-150A) not yet justified — no trigger condition observed. Recommended next: D-149H passive hold; re-review when 7d total_count ≥ 50–100, or first non-valid event appears, or a second user begins issuing owner tokens. No code/migration/`wrangler.toml` change. Baseline: 1016/24/57 (1 expected parameterised-route warning), unchanged.
**Read when:** reviewing D-149 history.

### `D149F_OWNER_TOKEN_TELEMETRY_TIME_WINDOW_LIVE_VERIFICATION_CHECKPOINT.md` — TIME-WINDOWED TELEMETRY CONFIRMED LIVE (organic review done in D-149G)
D-149E's `window=all|1h|24h|7d` query-param support was deployed and live-verified across every supported value: default and `?window=all` both return `sample_window: all, all_time: true`; `1h`/`24h`/`7d` each correctly report their own value with `all_time: false`; an invalid value (`banana`) returns 200 and silently normalizes to `all` exactly as designed, with the response itself confirming what was applied. `query_error: null` throughout. No token/secret/admin-token value recorded. Verification only — no code/migration/`wrangler.toml` change, no enforcement, no soft warning. Baseline: 1016/24/57 (1 expected parameterised-route warning), unchanged.
**Read when:** reviewing D-149 history.

### `D149E_OWNER_TOKEN_TELEMETRY_TIME_WINDOW_REPORTING_CHECKPOINT.md` — D-149E TIME-WINDOWED TELEMETRY REPORTING ADDED (confirmed live by D-149F)
D-149D's deliberate route-coverage pass permanently mixed 10 curated verification records into the all-time aggregate, with no way to look at only organic traffic going forward. D-149E added an optional `window=all|1h|24h|7d` query param to `GET /api/debug/owner-token-telemetry` (default `all`, unchanged behavior; an unrecognized value silently normalizes to `all` rather than erroring) plus four new response fields. Still admin-gated, still advisory-only, no enforcement, no soft warning. Baseline: 1016/24/57.
**Read when:** reviewing D-149 history.

### `D149D_OWNER_TOKEN_ROUTE_COVERAGE_REVIEW_CHECKPOINT.md` — D-149D ALL 8 ROUTES OBSERVED; SAMPLE WAS DELIBERATE NOT ORGANIC (time-windowing added by D-149E)
D-149C found persisted telemetry covering only 1 of 8 owner-sensitive routes (`getMe`). D-149D deliberately exercised all seven remaining routes via safe/reversible/disposable-data flows and confirmed via live re-check: `total_count` 3→13 (+10), `valid_ratio: 1` throughout, `unobserved_owner_routes` now empty. Disposable data was created in production specifically for this verification and documented honestly as such. The entire sample came from one deliberately-curated owner session, not organic traffic — this is exactly the limitation D-149E's time-windowing was built to work around. Baseline: 1006/24/57.
**Read when:** reviewing D-149 history.

### `D149C_OWNER_TOKEN_TELEMETRY_SAMPLING_REPORT_LIVE_VERIFICATION_CHECKPOINT.md` — D-149C SAMPLING REPORT CONFIRMED LIVE; COVERAGE WAS WEAK (route coverage generated by D-149D)
D-149B's widened `GET /api/debug/owner-token-telemetry` response was deployed and live-verified: `total_count: 3`, `valid_count: 3`, `valid_ratio: 1`, `observed_routes: ["getMe"]`, `unobserved_owner_routes` correctly naming all seven other owner-sensitive routes. All new D-149B fields confirmed working correctly in production, but coverage was weak — only `getMe` had any persisted telemetry. Baseline: 1006/24/57.
**Read when:** reviewing D-149 history.

### `D149B_OWNER_TOKEN_TELEMETRY_SAMPLING_REPORT_CHECKPOINT.md` — D-149B TELEMETRY SAMPLING REPORT IMPROVED (confirmed live by D-149C)
D-149A's review found a sample of 1 (`route_counts: { getMe: 1 }`) and no way to tell, from the response alone, which of the eight owner-sensitive routes had ever produced telemetry versus which hadn't. D-149B widened `ownerTokenTelemetryDebug()`'s response: `total_count` and a divide-by-zero-safe `valid_ratio`; `route_status_counts` giving every one of the eight known routes all six status buckets, zero-defaulted; `observed_routes`/`unobserved_owner_routes` derived from that fixed route list; and explicit `sample_window`/`all_time` fields. Still admin-gated, still advisory-only. Baseline: 1006/24/57.
**Read when:** reviewing D-149 history.

### `D149A_ACCUMULATED_OWNER_TOKEN_TELEMETRY_REVIEW_CHECKPOINT.md` — D-149A FIRST TELEMETRY REVIEW: SAMPLE TOO SMALL (sampling report improved by D-149B)
First accumulated-telemetry review using the now-working `GET /api/debug/owner-token-telemetry` endpoint (D-148F). Snapshot: `valid_count: 1`, all of `secret_missing`/`missing`/`invalid`/`expired`/`uid_mismatch` at 0, `route_counts` showing only `getMe: 1`. Honestly scoped: a sample of 1, covering 1 of 8 instrumented routes, supports "the telemetry pipeline works" but neither soft-warning calibration nor hard enforcement — explicit not-enforcement-ready verdict. Flagged the route-coverage gap that D-149B's response widening directly addresses. Baseline: 1000/24/57.
**Read when:** reviewing D-149 history.

### `D148F_OWNER_TELEMETRY_DEBUG_RESPONSE_LIVE_VERIFICATION_CHECKPOINT.md` — D-148F NORMALIZED TELEMETRY RESPONSE CONFIRMED LIVE — D-148 CHAIN CLOSED
D-148E's normalized `GET /api/debug/owner-token-telemetry` shape was deployed and live-verified: the endpoint returns 200 with `endpoint_ok: true`, a directly-readable non-null top-level `valid_count` that exactly mirrors `status_counts.valid`, all six `status_counts` buckets present, and `query_error: null` — directly resolving the `valid_count: null` ambiguity D-148D found. This closed the full D-148 chain: D-148A (client gaps closed) → D-148B/C (most flows live-verified) → D-148D (deploy gap found + fixed) → D-148E (response shape normalized) → D-148F (normalized shape confirmed live). Baseline: 1000/24/57.
**Read when:** reviewing D-148 history.

### `D148E_OWNER_TELEMETRY_DEBUG_RESPONSE_NORMALIZATION_CHECKPOINT.md` — D-148E DEBUG RESPONSE SHAPE NORMALIZED (confirmed live by D-148F)
D-148D's live check found `valid_count: null` from a console extraction even though the endpoint returned 200 — traced to the response shape itself: the old `{ byStatus, byRoute, recent }` shape only included a status key if at least one row with that status existed. D-148E rewrote `ownerTokenTelemetryDebug()` to return an explicit shape: `status_counts` always includes all six buckets, zero-defaulted; a new top-level `valid_count` exactly mirrors `status_counts.valid`; `recent` rows are built via an explicit allowlist; a new `query_error` field surfaces a sanitized D1 error message instead of silently looking identical to "zero rows so far". Still `requireAdmin()`-gated, still advisory-only. Baseline: 1000/24/57.
**Read when:** reviewing D-148 history.

### `D148D_OWNER_TELEMETRY_DEBUG_ENDPOINT_DEPLOYMENT_GAP_CHECKPOINT.md` — D-148D DEPLOYMENT GAP RESOLVED; RESPONSE SHAPE ISSUE FOUND (addressed by D-148E)
D-148C found `GET /api/debug/owner-token-telemetry` 404ing in production, contradicting D-147C's earlier success. D-148D investigated first (route/handler/admin-gate/inventory/static-check coverage all correct in committed code; no CI deploy automation exists — every prior production deploy in this chain was manual) and confirmed the cause was a deployment gap, not a code defect. `npx wrangler deploy` was run manually to bring production up to current committed code. Live-verified the 404 was gone, the endpoint was admin-gated, and an authenticated request returned 200 with a sanitized body — but the aggregate `valid` count itself could not be confirmed (console extraction returned `null`), which D-148E traced to an ambiguous response shape and fixed. Baseline: 993/24/57.
**Read when:** reviewing D-148 history.

### `D148C_REMAINING_CLIENT_OWNER_TOKEN_FLOWS_LIVE_VERIFICATION_CHECKPOINT.md` — D-148C MOST CLIENT FLOWS LIVE-VERIFIED; FOUND THE ADMIN TELEMETRY ENDPOINT 404 (resolved by D-148D)
Closed three of D-148B's five open verification gaps with sanitized live evidence: `GET /api/my-humanx/export`, `POST /api/my-humanx/profile-settings` (via a reversible no-op re-save), and `POST /api/belief-snapshots` (via a dedicated verification snapshot) all returned 200 with `wrangler tail` showing `status=valid` telemetry, no `status=missing` anywhere. `POST /api/belief-promote` was deliberately not attempted — would mutate real claim/truth data. Found `GET /api/debug/owner-token-telemetry` returning 404, contradicting D-147C's earlier confirmation — flagged as a likely deploy-state gap rather than a code regression. Baseline: 993/24/57.
**Read when:** reviewing D-148 history.

### `D148B_CLIENT_OWNER_TOKEN_HARDENING_LIVE_VERIFICATION_CHECKPOINT.md` — D-148B PARTIAL LIVE VERIFICATION (remaining flows verified by D-148C)
D-148A's frontend hardening (`ensureSession()`, `ensureHumanXSession()`) was live-verified for the flows actually exercised: a fresh production page load followed by normal UI clicks (My HumanX, Drift/belief snapshots) showed `GET /api/me`/`GET /api/my-humanx`/`GET /api/belief-snapshots` all returning 200 with `wrangler tail` logging `status=valid` telemetry every time, and no `status=missing` appeared anywhere in the fresh flow. Honestly scoped — listed five open verification gaps rather than claiming them confirmed. Baseline: 993/24/57.
**Read when:** reviewing D-148 history.

### `D148A_CLIENT_OWNER_TOKEN_ADOPTION_GAP_HARDENING_CHECKPOINT.md` — D-148A CLIENT-SIDE ADOPTION GAPS CLOSED (live-verified by D-148B/D-148C)
D-147A's audit identified three concrete client-side scenarios that would still produce false `missing` telemetry (and would have been rejected under enforcement): the boot-race window, the standalone Belief Engine never guaranteeing `/api/session` before its one owner-sensitive call, and stale local user objects without `ownerToken`. D-148A closes all three, frontend-only: new idempotent `ensureSession()` helper in `public/app-v10.js` now awaited by every owner-sensitive call site and by `boot()` itself; a new equivalent `ensureHumanXSession()` in the standalone Belief Engine bridge. `headers()` confirmed unchanged. No backend, migration, or `wrangler.toml` change; remains fully advisory-only. Baseline: 993/24/57.
**Read when:** reviewing D-148 implementation history.

### `D147C_OWNER_TOKEN_TELEMETRY_PERSISTENCE_LIVE_VERIFICATION_CHECKPOINT.md` — D-147C PRODUCTION TELEMETRY PERSISTENCE CONFIRMED (superseded by D-148B for current deploy)
D-147A audit (read-only) identified "no persistent telemetry store" as the binding gap before enforcement could even be considered. D-147B shipped best-effort D1 persistence (additive-only migration `0014_owner_token_telemetry.sql`, widened `logOwnerTokenTelemetry()`, new admin-gated `GET /api/debug/owner-token-telemetry`) but explicitly deferred applying the migration to production. D-147C records that follow-through: the owner manually ran `npx wrangler d1 migrations apply humanx --remote`, then confirmed live — sanitized — that `GET /api/me`/`GET /api/my-humanx`/`GET /api/belief-snapshots?limit=1` all still return 200, `wrangler tail` still shows `status=valid` telemetry, and `GET /api/debug/owner-token-telemetry` now returns aggregate data with a `valid` status count greater than 0. No raw token, secret, or admin token value was printed, shared, or recorded. This remains advisory-only — no enforcement was added or implied by confirming persistence. Baseline: 983/24/57.
**Read when:** reviewing D-147 history.

### `D147B_OWNER_TOKEN_TELEMETRY_PERSISTENCE_CHECKPOINT.md` — D-147B PERSISTENT TELEMETRY CODE + MIGRATION (migration apply confirmed by D-147C)
D-146A→C established and confirmed live, log-only owner-token telemetry. D-147A audit identified the persistence gap. D-147B closed it: new additive-only migration `0014_owner_token_telemetry.sql` (table `owner_token_telemetry` — route/status/uid_suffix/user_agent_hash/created_at only, never a raw token/secret/full user id/headers/body/IP); `logOwnerTokenTelemetry()` widened to best-effort-persist alongside its existing console.log (try/catch-wrapped, never blocks or fails the calling route); new admin-gated `GET /api/debug/owner-token-telemetry`. Status buckets, `ownerTokenStatus()`, and all enforcement-absence guarantees unchanged from D-146B. Baseline: 983/24/57.
**Read when:** reviewing D-147 implementation history.

### `D146C_OWNER_TOKEN_TELEMETRY_LIVE_VERIFICATION_CHECKPOINT.md` — D-146 LOG-ONLY TELEMETRY + LIVE ADOPTION CONFIRMED (superseded by D-147C for current deploy)
D-146A enforcement readiness audit (verdict: not ready — secret unconfirmed live, zero telemetry) → D-146B log-only adoption telemetry (`ownerTokenStatus()` widened to six buckets including `secret_missing`; `logOwnerTokenTelemetry()` console-log only, no D1, no migration; still zero enforcement) → D-146C live verification. `HUMANX_OWNER_SECRET` was set in production outside this repo (external config only, never in `wrangler.toml`, never committed). Owner manually confirmed, sanitized: `POST /api/session` returns a non-null `owner_token` (type `string`) for the real owner (`usr_3c204c78f6fa49bfad`), `GET /api/me`/`GET /api/my-humanx`/`GET /api/belief-snapshots?limit=1` all still return 200 with zero enforcement, deployed logs (`wrangler tail`) show `status=valid` telemetry and no more `status=secret_missing`. No token or secret value was ever printed, shared, or recorded. No enforcement added, no migration. Baseline: 970/24/56.
**Read when:** reviewing D-146 history.

### `D145C_OWNER_TOKEN_FOUNDATION_CHECKPOINT.md` — D-145 ADVISORY OWNER TOKEN FOUNDATION (superseded by D-146C for current deploy)
D-145A audit (owner identity / signed owner header) → D-145B advisory-mode owner token foundation (`signOwnerToken()`/`verifyOwnerToken()`/`ownerTokenStatus()`, HMAC-SHA256 via `crypto.subtle`, secret read only from `env.HUMANX_OWNER_SECRET`; `POST /api/session` mints `owner_token` and stops leaking `is_admin`; five owner endpoints switched `requireUserId()`→`requireUser()`; no enforcement). Owner confirmed live: `/api/session` returns `owner_token` (null until the secret is set) with `is_admin` absent, `/api/my-humanx` resolves the real owner with no token enforcement. Baseline: 951/24/56.
**Read when:** reviewing D-145 history.

### `D144C_NOINDEX_ROBOTS_CHECKPOINT.md` — D-144 NOINDEX/ROBOTS POLICY (superseded by D-145C for current deploy)
D-144A audit (public profile discoverability / robots / sitemap) → D-144B share-only indexing policy (`public/robots.txt` disallowing only `/u/`; `renderPublicProfileShell()` injects `<meta name="robots" content="noindex">` unconditionally into every `/u/:slug` response, and `<link rel="canonical" href=".../u/:slug">` only when a public profile resolves). Owner confirmed live: `/u/calenhir` still returns 200 with noindex present, canonical present for the resolved profile, all five D-143 OG/Twitter tags still present, `/robots.txt` returns `User-agent: *` / `Disallow: /u/`, no sitemap.xml. Baseline: 925/24/56.
**Read when:** reviewing D-144 history.

### `D143C_PUBLIC_PROFILE_OG_ROUTE_CHECKPOINT.md` — D-143 PUBLIC PROFILE OG ROUTE (superseded by D-144C for current deploy)
D-143A audit (share-card / OpenGraph / SEO) → D-143B server-rendered OG meta tags for `GET /u/:slug` (`loadPublicProfileSummary()`, `escHtml()`, `renderPublicProfileShell()`, route matched before the static-asset fallback) → D-143B hotfix (root cause was **not** relative asset paths — the real bug was `renderPublicProfileShell()` requesting `/index.html` from `env.ASSETS`, which Cloudflare's default `html_handling` redirects to `/`, producing an empty body; fixed by fetching `/` instead). Owner confirmed live: `https://humanx.rinkimirikata.com/u/calenhir` returns 200 with `<title>Calenhir on HumanX</title>` plus full OG tags, no sensitive fields in source, old `#/u/calenhir` hash route still works. Baseline: 907/24/56.
**Read when:** reviewing D-143 history.

### `D142D_SELECTED_SNAPSHOT_SHARING_CHECKPOINT.md` — D-142 SELECTED SNAPSHOT SHARING (superseded by D-143C for current deploy)
D-142A audit → D-142B selected snapshot sharing foundation (`POST /api/my-humanx/profile-settings` extended with `shared_snapshot_id`, server-enforced single shared snapshot, `GET /api/u/:slug` widened with an optional narrow `sharedSnapshot` field) → D-142C public copy/presentation polish. Owner confirmed: share controls and "Do not share a snapshot" work, only one snapshot can be selected at a time, the public profile shows the shared-snapshot card when one is selected and nothing when none is. Baseline: 883/24/56.
**Read when:** reviewing D-142 history.

### `D141C_PUBLIC_PROFILE_POLISH_CHECKPOINT.md` — D-141 PUBLIC PROFILE POLISH (superseded by D-143C for current deploy)
D-141A audit (public profile polish / selected snapshot sharing) → D-141B public profile visual polish (frontend/CSS only — header/counts/section cards, styled empty states, counts explanation, Me-side preview sample items, mobile pass). Owner confirmed: `#/u/calenhir` loads with cleaner header/card styling, "Counts reflect public, non-archived activity only." is visible, recent public sections look less debug/raw, empty states are styled, the public page still omits email/user id/export/archive/settings controls, the Me-side Profile Settings preview shows sample public items, and Me dashboard/Belief Mirror/Export/Archive/Review all still work. Baseline: 842/24/56.
**Read when:** reviewing D-141 history.

### `D140D_PUBLIC_PROFILE_CHECKPOINT.md` — D-140 PUBLIC PROFILE FOUNDATION (superseded by D-142D for current deploy)
D-140A audit → D-140B profile settings foundation (migration 0013, `POST /api/my-humanx/profile-settings`, Profile Settings panel in Me with live preview) → D-140C public read-only profile (`GET /api/u/:slug`, `#/u/:slug` hash view). Owner confirmed: Profile Settings panel works (off by default, slug required only when public, save works), Copy share link uses `#/u/:slug` and correctly hides/disables when not public, private profile shows a friendly not-found state, public profile loads at `#/u/calenhir` with bio/counts/recent public truths-evidence-pressure, no email/user id/admin/owner-only controls visible, Home/Me/Truths/Review still work. Baseline: 827/24/56.
**Read when:** reviewing D-140 history.

### `D139C_BELIEF_MIRROR_CHECKPOINT.md` — D-139 BELIEF MIRROR (superseded by D-141C for current deploy)
D-139A audit → D-139B Belief Mirror v1 (widened `GET /api/my-humanx` belief_snapshots select + a fully client-side Belief Mirror panel inside Me — latest snapshot, recent drift, recurring categories, pressure/evidence balance, tensions from `contradictions_json`, fixed local question bank). Owner confirmed: Belief Mirror appears in Me between Belief Snapshots and Recent Truths, guardrail wording is visible and feels safe, all six cards render, existing Me controls (filters, show-all, archive, export) still work. No AI/API call anywhere — every card is arithmetic over already-stored data. No new route, no migration. Baseline: 781/24/56.
**Read when:** reviewing D-139 history.

### `D138D_USER_ARCHIVE_EXPORT_CHECKPOINT.md` — D-138 USER ARCHIVE/EXPORT (superseded by D-140D for current deploy)
D-138A audit → D-138B backend foundation (migration 0012, `POST /api/my-humanx/archive`, `GET /api/my-humanx/export`) → D-138C frontend archive/export controls (account-card Export button, per-row Archive action with confirmation modal). Owner confirmed: export downloads JSON, archive confirmation modal appears and clearly states the item is hidden not deleted, a protected item returns a clear protected toast, the rest of My HumanX remains usable. Soft-archive only — no `DELETE FROM`, no restore UI, belief-snapshot archive deferred (no backend endpoint yet). Baseline: 763/24/56.
**Read when:** reviewing D-138 history.

### `D137F_MY_HUMANX_CHECKPOINT.md` — D-137 MY HUMANX DASHBOARD (superseded by D-139C for current deploy)
D-137A audit → D-137B backend (`GET /api/my-humanx`) → D-137C truth claimed-state clarity → D-137D My HumanX dashboard frontend → D-137E scan/polish pass (5-item caps with show-all/show-less, state filter, section reorder, badge-first row layout). Owner confirmed: Me tab works, verified account card visible, content counts visible, state filters work, recent claims/truths/evidence/pressure visible, belief snapshots visible, show all/show less works, public claim Study opens with correct Back-to-Me navigation, non-public items never open broken pages. Baseline: 724/24/56.
**Read when:** reviewing D-137 history.

### `D136E_INVITE_AUTH_CHECKPOINT.md` — D-136 INVITE AUTH (superseded by D-138D for current deploy)
D-136A audit → D-136B backend (migration 0010, `/api/me`, `/api/auth/invite/create`, `/api/auth/invite/redeem`) → D-136C public account panel + invite redeem → D-136D admin invite-code creator panel. Owner confirmed: admin creates invite code in Review, user redeems in account panel, panel shows VERIFIED with display name/email/handle, anonymous flow still works, no email sending (expected). Baseline: 655/24/56.
**Read when:** reviewing D-136 history.

### `D131A_OWNER_SMOKE_POST_D130.md` — D-131 OWNER SMOKE (superseded by D-136E for current deploy)
Owner confirmed production good after D-130 deploy. Admin Review, structured builder context, approve/keep/reject/mark-duplicate, queue anchor, public pages — all pass. Baseline: 498/24/56.
**Read when:** reviewing D-131 history.

### `D130E_REVIEW_PATH_HARDENING_CHECKPOINT.md` — D-130 HARDENING BASELINE
D-130A–D review-path hardening chain. Audit (no FAILs), review queue cap comment+tests, builder context `whyUserThinksThis` typo fix (backward-safe), review escaping regression tests. No schema/route/layout changes. Checks: syntax OK, 498/24/56 pass.
**Read when:** reviewing D-130 hardening history or test baseline.

### `D129G_ADMIN_REVIEW_ERGONOMICS_CHECKPOINT.md` — D-129 CHAIN COMPLETE (superseded by D-130E for current deploy)
D-129A–F Admin Review ergonomics chain merged. Anchor-after-moderation, deduplicated inspector action row, item-specific right context panel, compact inspector density, compact queue cards (ev/ts/sv scores, builder chip), always-visible filter overview strip. Frontend only — no backend/schema/D1 changes. Checks: syntax OK, 479/24/56 pass.
**Read when:** reviewing D-129 ergonomics history.

### `D128H_DEPLOY_CHECKLIST.md` — DEPLOY CHECKLIST (superseded by D-129G for current deploy)
Pre-deploy verification passed at `49571ac`. All 4 static checks green. D-128C/D/E/F chain confirmed merged. Checklist doc includes D1 state checks, deploy command, and 7-step owner smoke procedure. No runtime change in this task.
**Read when:** reviewing D-128 deploy history or D1 migration state.

### `D128F_REVIEW_UI_STRUCTURED_BUILDER_CONTEXT.md` — MERGED — REVIEW UI STRUCTURED-FIRST DISPLAY
Review inspect panel now prefers `item.claimBuilderContext` (structured, from D-128D API) over the legacy `parseClaimBuilderContext()` path. Both paths show a source badge (green `structured` / yellow `legacy parsed`). No backend change. No schema change. No deploy. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing the Review UI builder context display or planning the D-128H deploy.

### `D128E_FRONTEND_STRUCTURED_PAYLOAD.md` — MERGED — FRONTEND PAYLOAD
Frontend now sends structured `claim_builder` field alongside legacy `initialEvidence` sentinel. New `builderPayload()` helper maps `_bs` state to D-128C shape (`route`, `rawText`, `why`, `scope`, `falsifier`, `draftClaim`, `finalClaim`, `category`, `claimType`, `systemFlags`). Both `submitBuilderClaim()` and `submitBuilderTruth()` include it. `initialEvidence` sentinel kept for D-127D fallback compatibility. Non-builder `saveClaim()` unchanged. No Worker change. No Review UI change. No schema change. No deploy. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing frontend payload or planning D-128F Review UI.

### `D128D_REVIEW_API_BUILDER_CONTEXT.md` — MERGED
Review API now attaches optional structured `claimBuilderContext` to claim and truth rows in the admin-only `/api/review` response. New helpers: `safeJsonArray()`, `mapClaimBuilderContext()`, `attachClaimBuilderContexts()` in `src/claim-builder-contexts.js`. Per-row point-lookups (most recent context, `created_at DESC`); failures non-fatal. Public endpoints unchanged. D-127D legacy parser fallback untouched. No frontend payload change. No Review UI change. No schema/migration change. No deploy. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing Review API read path or planning D-128E/F.

### `D128C_WORKER_WRITE_PATH.md` — MERGED
Worker write path for structured Claim Builder context. New helper module `src/claim-builder-contexts.js` exports `cleanClaimBuilderContext()` (validates/clips, returns null if absent or invalid) and `insertClaimBuilderContext()` (inserts one `cbc_*` row). `/api/claims` POST writes context for new claims only (not existing/duplicate). `/api/truths` POST writes context for both new and repeated truths. `claim_builder_contexts` table is already live in production D1. Legacy D-127B/D-127D `initialEvidence` fallback untouched. No frontend payload change yet. No Review API/UI change yet. No deploy yet. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing write-path implementation or planning D-128D/E/F.

### `D128H_MIGRATION_STATE_REPAIR_PLAN.md` — COMPLETED (migration unblocked, table live)
Migration-state repair plan after D1 audit revealed schema drift and migration replay failure. `wrangler d1 migrations apply` is blocked: `0003_full_schema.sql` attempts `CREATE UNIQUE INDEX idx_evidence_claim_links_unique` but 4 duplicate `(evidence_id, claim_id)` pairs exist in `evidence_claim_links`. No runtime code or live D1 changes made. Companion SQL draft `migrations/manual_repair_dedupe_evidence_claim_links.sql` provides audit, preview, dry-run DELETE, post-delete verification, and index creation queries. No live execution has occurred. Owner must review, approve backup, and authorise each step. `claim_builder_contexts` table still does not exist — D-128C blocked until migration unblocked.
**Read when:** planning migration repair, reviewing dedupe strategy, or resuming D-128C after migration is unblocked.

### `D128B_CLAIM_BUILDER_CONTEXT_MIGRATION_DRAFT.md` — MIGRATION DRAFT — NOT APPLIED (blocked by D-128H repair)
Draft SQL migration for `claim_builder_contexts` table (`migrations/0006_claim_builder_contexts.sql`). Adds 16-column table (target_type, target_id, route, version, raw_text, why, scope, falsifier, draft_claim, final_claim, category, claim_type, system_flags_json, timestamps) plus 3 indexes. Migration file exists in repo but has NOT been executed against production D1 — no live schema change. Next step (D-128C worker write-path) requires explicit owner approval to apply the migration first.
**Read when:** planning D-128C or reviewing migration before applying.

### `D128_STRUCTURED_BUILDER_PERSISTENCE_DESIGN.md` — MERGED (see D-128B for migration draft)
Design/spec for structured Claim Builder persistence. Recommends a dedicated `claim_builder_contexts` table to separate builder metadata (original text, why, scope, falsifier, flags, route) from the `initialEvidence` plain-text channel used in D-127B. Defines payload shape for both claim and truth routes, Review/public/RunPack visibility boundaries, and the migration strategy. Preserves D-127D plain-text parser as a legacy fallback for existing items. Docs/design only — no product code, backend, schema, D1, or deploy changes.
**Read when:** planning D-128B migration or reviewing builder persistence design.

### `D127F_TESTER_CLAIM_BUILDER_INVITE_PACK.md` — MERGED
Safe tester invite/update pack for the live Claim Builder release (D-126B + D-127B + D-127C + D-127D). Includes short and long invite messages (canonical URL only), tester instructions covering the full builder flow (Steps 1–3, Truth route, Review context), 10 feedback questions specific to the builder, per-tester capture template, stop conditions, and owner rules (no admin token, no Worker URL). Docs-only — no product code, backend, schema, D1, or Wrangler changes.
**Read when:** inviting or updating testers about the Claim Builder; planning D-127G feedback triage.

### `D127E_DEPLOY_SMOKE_CHECKPOINT.md` — DEPLOYED / OWNER SMOKE PASS
Deploy/smoke checkpoint for stacked D-126B + D-127B + D-127C + D-127D release. Pre-deploy checks passed (416/24/56, syntax OK) at HEAD `6ec6fae`. CC/CI Wrangler was blocked by VPN/proxy; owner manually deployed. Owner smoke result: **PASS** ("all works"). Live release covers D-126B polish (nav label, Review hint, friendly toasts), D-127B Claim Builder 3-step flow, D-127C Truth route save, D-127D Review builder context panel. Recommended next: D-127F tester-facing Claim Builder invite/update or D-128 structured builder persistence design.
**Read when:** checking release status or planning next task.

### `D127D_REVIEW_BUILDER_CONTEXT_VISIBILITY.md` — MERGED
Surfaces Claim Builder submission context in the Review inspect panel. `parseClaimBuilderContext()` parses the D-127B plain-text block from `initialEvidence`; `reviewBuilderContextHtml()` renders ORIGINAL USER TEXT, WHY, SCOPE, PRESSURE/FALSIFIER, and SYSTEM FLAGS as a blue-tinted panel. Injected into `renderReviewInspectPanel()` between quality hints and decision buttons. Review-only — no public page change. No backend/schema/D1/Wrangler/deploy changes. CSS: 6 new rules. All 416/24/56 checks pass. Deploy required (frontend assets).
**Read when:** reviewing builder context visibility in Review, or planning D-127E.

### `D127C_BUILDER_TRUTH_ROUTE_SAVE.md` — MERGED (see D-127D for Review context)
Wires up the Truth route save in the Claim Builder. `submitBuilderTruth()` POSTs `_bs.raw` to the existing `/api/truths` endpoint (`review_state='review'` guaranteed). Step 2 truth-route note gains a real "Save as Truth for Review" button. Step 3 DECISION row is now route-aware: truth route shows both badge types plus explanatory copy and two action buttons; claim route unchanged. CSS: `.builder-route-actions` and `.builder-truth-note`. No backend/schema/D1/Wrangler/deploy changes. All 416 smoke + 24 static + 56 worker-route checks pass. Deploy required (frontend assets).
**Read when:** reviewing the builder Truth route or planning the next deploy.

### `D127B_CLAIM_BUILDER_CLIENT_PROTOTYPE.md` — MERGED (see D-127C for Truth route)
Client-only Claim Builder prototype. Replaces single-form `renderSubmit()` with a 3-step builder: Step 1 Raw Thought (raw text + why + scope + falsifier), Step 2 Make It Testable (flags, route advisory, editable draft, category/type), Step 3 Final Claim (summary card + submit). New functions: `claimBuilderFlags()` (11 patterns), `claimBuilderRoute()`, `claimBuilderDraft()` (light cleaner), `renderBuilderFlags()`, `submitBuilderClaim()` (posts to existing `/api/claims` with builder context in `initialEvidence`). State in `_bs` object. Truth route is advisory-only (no write in D-127B). CSS: 22 new rules for builder, steps, flags, original panel, route advisory, summary card. No backend/schema/D1/Wrangler/deploy changes. All 416 smoke + 24 static + 56 worker-route checks pass. Deploy required (frontend assets). Recommended next: D-127C Truth-route save.
**Read when:** implementing or reviewing the Claim Builder or planning D-127C.

### `D127A_CLAIM_BUILDER_DESIGN_SPEC.md` — DESIGN SPEC (see D-127B for implementation)
Design/spec-only checkpoint for turning HumanX submission into a Claim Builder. Defines the three-step flow: Step 1 Raw Thought, Step 2 Make it Testable, Step 3 Final Claim. Accepts messy human text first; extends existing `claimQualityHints()` into builder flags; detects Claim vs Truth route; proposes future `claim_builder` object without schema changes; keeps Review-first publication; keeps RunPack later in Study mode; defines future Review card sections (CLAIM, ORIGINAL USER TEXT, WHY USER THINKS THIS, SCOPE, PRESSURE/FALSIFIER, SYSTEM FLAGS, DECISION) and later admin actions (Convert to Truth, Request Sharpening). **Docs/design only — no frontend/backend/schema/deploy changes.** Recommended next: D-127B client-only builder prototype.
**Read when:** implementing or reviewing the Claim Builder direction.

### `D126B_POLISH_BACKLOG_BATCH.md` — D-126B MERGED. DEPLOY STILL REQUIRED
Polish batch clearing B1–B6 from D-126A backlog. B1: rate-limit toast now reads "Too many submissions. Try again in about an hour." B2: CLAIM_TOO_SHORT now shows friendly copy. B3: nav tab "Beliefs" → "Belief Engine". B4: Review no-token hint extended to "Review is owner-only." B5: deferred (source-label density requires logic change). B6: D-125A doc row 5g `/api/health` → `/api/graph-status`. Files: `app-v10.js`, `index.html`, `D125A` doc. **Deploy required** (frontend assets changed). Checks: 24/24, syntax OK, 416/416. Recommended next: D-126C onboarding.
**Read when:** reviewing D-126B polish changes or planning D-126C.

### `D126A_BETA_PRODUCT_CHECKPOINT.md` — D-125 RELEASED
Beta product checkpoint after D-125 owner-as-tester hardening release. Live Worker `3ab9c7c5-b034-4ae5-8108-12ecb51734e7`, owner smoke PASS. Captures full feature state (claim pipeline, Review, Belief Engine v2, Drift, public browsing, AIP export), trust/safety posture (review-first, source safety, rate limiting, snapshot isolation), six low-priority backlog items (B1–B6: rate-limit toast, CLAIM_TOO_SHORT copy, nav label, review hint, vault density, /api/health doc typo). Five next-build options (D-126B polish → D-126C onboarding → D-126D admin ergonomics → D-126E seed content → D-126F abuse hardening). **Recommendation: D-126B first.** Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** starting any new build task; reviewing beta status before tester invite.

### `D125G_MOBILE_LAYOUT_AUDIT.md` — D-125 CHAIN COMPLETE
Mobile layout stress audit (Cycle 6). One CSS patch: `#radar-canvas` in Belief Engine `index.html` — added `max-width:100%;height:auto` to prevent 360px canvas overflowing 342px content width at 390px viewport. All other surfaces (nav tabs, card grids, review admin bar, study/vault/truths grids, RunPack actions) verified responsive at 390px and 768px. No stop conditions. Three non-blocking notes (constellation 2-col at 390px, quiz resp-dot tap size, `/api/health` vs `/api/graph-status` doc discrepancy). Verdict: **PATCHED**. Checks: 24/24 static, syntax OK, 416/416 smoke. **D-125 chain is complete. No D-125H needed.**
**Read when:** checking D-125G mobile audit results or confirming D-125 chain status.

### `D125F_PUBLIC_BROWSING_AUDIT.md` — CYCLE 5 COMPLETE
Public content browsing audit (Cycle 5). No patches needed. All public-list routes filter `COALESCE(review_state,'public')='public'` (claims, truths, evidence). Belief snapshots scoped to `user_id`. "Public means visible, not proven" framing in truths page and both verdict-qualifier surfaces. Source links: `safeHttpUrl()` blocks non-http/https URLs; `rel="noopener noreferrer"` on valid links. Admin UI gated at both client (`!!adminToken()`) and server (`requireAdmin()`). RunPack blocked for non-public claims. Three non-blocking notes: `/api/health` vs `/api/graph-status` discrepancy in D-125A docs, reused evidence source label can be dense. Verdict: **PASS**. Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** starting D-125G (mobile layout stress) or reviewing public browsing audit results.

### `D125E_CLAIM_REVIEW_AUDIT.md` — CYCLE 4 COMPLETE
Claim submission and Review audit (Cycle 4). No patches needed. Verdict: **PASS**. Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** reviewing submission/Review audit results.

### `D125D_DRIFT_SAVED_RESULTS_AUDIT.md` — CYCLE 3 COMPLETE
Drift and saved-results audit (Cycle 3). One patch: drift verdict badge `cls(verdict)` → `b-yellow`. Verdict: **PATCHED**. Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** reviewing Drift audit results.

### `D125A_OWNER_TESTER_HARDENING_PLAN.md` — ACTIVE TESTING POSTURE
Owner-as-tester product hardening plan. Six cycles, six personas. Cycles 1–5 complete (D-125B/C/D/E/F). Next: D-125G cycle 6 (mobile layout stress).
**Read when:** starting any owner-testing session or planning the final hardening task (D-125G).

### `D124N_FIRST_TESTER_INVITE_PACK.md` ⭐ SEND THIS TO TESTERS
First guarded tester invite pack for Belief Engine v2. Contains: short and long invite messages (canonical URL only), tester instructions (BE flow, Send to HumanX, saved-results, Clear, Start Over, mobile), 10 feedback questions, owner rules (max 1–3 trusted testers, no admin token, no Worker URL), per-tester feedback capture template with severity guide, stop conditions (framing/privacy/mobile failures), and next-step trigger for D-124O triage. Invite max 1–3 trusted testers. Do not share link publicly.
**Read when:** ready to send tester invites; resume after first-wave feedback to plan D-124O triage.

### `D124M_POSTDEPLOY_OWNER_SMOKE.md` ⭐ DEPLOY VERIFIED — PASS WITH NOTES
Post-deploy owner smoke checkpoint for the D-124 Belief Engine tester-check. Deployed version `ff886046-714a-4756-92b4-ddaa2908959b`. Owner confirmed: production loads, D1 live, Belief Engine result renders, Drift captures two full profiles with comparison delta, mobile fresh flow works, mobile-created claim reaches Review queue, admin view operational. Two notes: (N1) admin screenshots must not be shared publicly; (N2) incognito no-token Review gate check still needed before inviting external testers. Verdict: **PASS WITH NOTES**. Next: D-124N first tester invite after N2 check.
**Read when:** checking post-deploy status or starting tester invite planning.

### `D124L_OWNER_BROWSER_CHECKLIST.md` ⭐ RUN THIS BEFORE INVITING TESTERS
Practical step-by-step browser checklist for the owner to verify the live site after an explicit deploy decision. Covers: production health, Home card copy, Belief Engine intro/flow, timeline local-data note, saved-result / Clear / Start Over, Send-to-HumanX note, mobile 390px + 768px, public content, Review admin-gate, and a fill-in-the-blank PASS / BLOCKED final judgement. Run in a normal browser window then repeat mobile steps on a phone or DevTools responsive mode.
**Read when:** ready to run the manual deploy check before sending tester invites.

### `D124I_BELIEF_ENGINE_PRE_TESTER_READINESS_AUDIT.md` ⭐ BELIEF ENGINE CURRENT STATE
Pre-tester readiness audit after D-124B–H upgrade chain. Verdict: **READY WITH NOTES**. All automated checks pass (24/24 static, syntax OK, 416/416 smoke). Privacy boundaries confirmed complete across all five surfaces. Saved-result paths deterministic after D-124G. One stale doc cell corrected (BELIEF_ENGINE_TEST_PLAN.md `engineVersion`). Remaining pre-invite items: run `D124L_OWNER_BROWSER_CHECKLIST.md` against live site after deploy.
**Read when:** starting any Belief Engine session or planning tester invite. See `D123A_TESTER_LAUNCH_PACK.md` for the full pre-invite owner checklist.

### `D121A_PRE_TESTER_LAUNCH_CHECKPOINT.md` ⭐ START HERE (overall product state)
Consolidation checkpoint after the D-115→D-120 planning/checkpoint run. Records HumanX as a working public beta / early MVP, not a finished product; consolidates D-115A through D-120A; confirms D-116B, D-117B, and D-118B are not started; sets the safest next task as **D-117B — read-only normal-user QA browsing run**; preserves exact authorisation phrases and standing no-Wrangler/no-D1/no-admin-token/no-mutation rules. **Note:** for Belief Engine readiness specifically, D-124I supersedes this document.
**Read when:** opening any new session — start here for overall product state. For Belief Engine state, read D-124I instead.

### `D115A_POST_POLISH_PRODUCT_READINESS_CHECKPOINT.md`
Product-readiness checkpoint after the D-111→D-114 public/mobile UX polish increment. Freezes repo input `bf53c97`, deployed Worker `3fe7ab7f-b603-407b-b7b8-31111956a3ea`, and static baseline **416/24/56**. Verdict: HumanX is a working public beta / early MVP, not a finished product. Summarises beta-ready areas (public browsing, claim submission, evidence/pressure/tests, Truths, Review, mobile UX), launch blockers (post-D-114 journey proof, read-only D1/data-quality audit, abuse/rate-limit/account decisions, Belief Engine onboarding, docs checkpoint chain), do-not-regress rules, and the safest next priorities: D-116 read-only D1/data audit plan, D-117 normal-user journey QA, D-118 moderator/admin journey QA, D-119 Belief Engine onboarding pass, D-120 abuse/rate-limit/account audit.
**Read when:** checking the product-readiness baseline after D-111→D-114.

### `D110A_POST_SECURITY_PUBLIC_TRUST_RELEASE_CHECKPOINT.md`
Security/public-trust checkpoint after the full D-103→D-109 evidence/source-safety, admin-hardening, and orphan-cleanup arcs. Repo HEAD `50abf03`, deployed Worker `adb94a83`, static baseline **375/24/56**, served frontend `app-v10.js` only (asset count 8). Summarises D-103 (quality tiers, "weak argument", "no source provided"), D-104 (source `href` http/https-only render + `httpUrlOrNull` storage), D-106 (`.gitignore`, `/api/debug` admin-gate, `safeEqual` fail-closed), D-107 (Review inspect via shared `sourceLink`), D-108 (source-safety regression: no patch needed), D-109 (orphan bundle removal). Records live guarantees, deferred items (token rotation; no D1 cleanup; no verification badges/blocklists/auth system), and the **do-not-regress rules** (never raw `source_url`→href; all render via `sourceLink`/`safeHttpUrl`; all storage via `httpUrlOrNull`; never re-add app-v3..v9; keep `/api/debug` gated; never commit secrets; never paste the admin token).
**Read when:** checking the D-103→D-109 security/source/admin-hardening baseline.
