# HumanX Project State Checkpoint

Last updated: 2026-07-09 after D-313F D-313D deploy/live closeout (confirmed live, no code changed).
Previous checkpoint: 2026-07-08 after D-313E Belief Engine abandoned quick-record stubs cleanup checkpoint.

---

## Identity

| Item | Value |
|------|-------|
| Live app | https://humanx.rinkimirikata.com |
| Repo | HerGotSystems/HumanX |
| Worker entry | `src/worker.js` |
| Frontend | `public/app-v10.js`, `public/styles.css`, `public/index.html` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` (standalone) |

---

## Current HEAD

| Item | Value |
|------|-------|
| **Pre-D-227 stable HEAD** | `f286300` (D-226A public profile milestone checkpoint) |
| **D-232A checkpoint HEAD** | see `docs/README.md` — D-232A review ergonomics milestone |
| **D-238A checkpoint HEAD** | see `docs/README.md` — D-238A duplicate advisory milestone |
| **D-241A checkpoint HEAD** | see `docs/README.md` — D-241A review-to-study navigation milestone |
| **D-244A checkpoint HEAD** | see `docs/README.md` after commit (D-244A review next-item flow milestone) |
| **D-249A checkpoint HEAD** | see `docs/README.md` after commit (D-249A review card metadata density milestone) |
| **D-255A checkpoint HEAD** | see `docs/README.md` after commit (D-255A Review search/filter clarity milestone) |
| **D-257A checkpoint HEAD** | see `docs/README.md` after commit (D-257A duplicate/similar label clarity checkpoint addendum) |
| **D-260A checkpoint HEAD** | see `docs/README.md` after commit (D-260A Review mobile controls wrapping checkpoint) |
| **D-263A checkpoint HEAD** | see `docs/README.md` after commit (D-263A Review inspect panel action spacing checkpoint) |
| **D-264A checkpoint HEAD** | see `docs/README.md` after commit (D-264A Review ergonomics milestone wrap-up) |
| **D-267A checkpoint HEAD** | see `docs/README.md` after commit (D-267A Study entry / Back button style checkpoint) |
| **D-270A checkpoint HEAD** | see `docs/README.md` after commit (D-270A RunPack fallback guidance / generated-time checkpoint) |
| **D-273A checkpoint HEAD** | see `docs/README.md` after commit (D-273A RunPack AI-return import visibility checkpoint) |
| **D-276A checkpoint HEAD** | see `docs/README.md` after commit (D-276A RunPack provenance checkpoint) |
| **D-278A checkpoint HEAD** | see `docs/README.md` after commit (D-278A saved analysis provenance visibility checkpoint) |
| **D-280A checkpoint HEAD** | see `docs/README.md` after commit (D-280A owner RunPack workflow wording checkpoint) |
| **D-282A checkpoint HEAD** | see `docs/README.md` after commit (D-282A saved analysis to Truth boundary checkpoint) |
| **D-284A checkpoint HEAD** | see `docs/README.md` after commit (D-284A Truth drafting and Review workflow checkpoint) |
| **D-286A checkpoint HEAD** | see `docs/README.md` after commit (D-286A owner pending-Review Truth visibility checkpoint) |
| **D-288A checkpoint HEAD** | see `docs/README.md` after commit (D-288A saved analysis assisted Truth draft checkpoint) |
| **D-290A checkpoint HEAD** | see `docs/README.md` after commit (D-290A owner workflow product polish checkpoint) |
| **D-292A checkpoint HEAD** | see `docs/README.md` after commit (D-292A My HumanX Recent Truths prominence checkpoint) |
| **D-294A checkpoint HEAD** | see `docs/README.md` after commit (D-294A My HumanX collapsible Profile Settings checkpoint) |
| **D-296A checkpoint HEAD** | see `docs/README.md` after commit (D-296A My HumanX profile setup nudge checkpoint) |
| **D-298A checkpoint HEAD** | see `docs/README.md` after commit (D-298A Beta readiness Home Step 5 and My HumanX tab checkpoint) |
| **D-301A checkpoint HEAD** | see `docs/README.md` after commit (D-301A Home static before/after demo card checkpoint) |
| **D-303A checkpoint HEAD** | see `docs/README.md` after commit (D-303A Home collapsed HumanX words glossary checkpoint) |
| **D-305A checkpoint HEAD** | see `docs/README.md` after commit (D-305A First outside submission Review intake checkpoint) |
| **D-307A checkpoint HEAD** | see `docs/README.md` after commit (D-307A Belief Engine intro static output preview checkpoint) |
| **D-309A checkpoint HEAD** | see `docs/README.md` after commit (D-309A Belief Engine safe Back to HumanX links checkpoint) |
| **D-311A checkpoint HEAD** | see `docs/README.md` after commit (D-311A Belief Engine results Review handoff sentence checkpoint) |
| **D-313A checkpoint HEAD** | see `docs/README.md` after commit (D-313A Belief Engine Export & Share Drift/Review copy checkpoint) |
| **D-313E checkpoint HEAD** | see `docs/README.md` after commit (D-313E Belief Engine abandoned quick-record stubs cleanup checkpoint) |

---

## Current baseline (as of D-313F)

Run before and after any change. All must pass with exit 0.

```sh
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3529 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `104 passed, 0 failed (104 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |

### Known warning (non-blocking)

```
WARN: /api/u/:slug — known parameterised route; implemented via regex in worker.js,
      not as a literal string (D-218A documented limitation)
```

**Classification:** Known false positive / static analysis limitation.
**Runtime impact:** None. Route implemented as `url.pathname.match(/^\/api\/u\/[^/]+$/)`.
**Reference:** `docs/D218A_WORKER_ROUTE_WARNING_AUDIT.md`.
**Rule:** New unknown parameterised routes emit a distinct "NEW parameterised route not in KNOWN_PARAM_ROUTES" warning that must be investigated before being added to the known set.

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking (Node.js ecosystem warning unrelated to HumanX code).

---

## D-210 → D-218 hardening arc summary

This arc locked the Reflection Avatar as a permanent private feature and added a layered regression fence across the entire My HumanX / public profile boundary.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-210B | `233861b` | Feature | Private Reflection Avatar concept card — investigation habits only, no identity/rank/ideology |
| D-210C | `60ffdf8` | Live closeout | D-210B confirmed live |
| D-211A | `08db623` | Feature | Transparency disclosure — "How this is formed" `<details>` block; private note copy |
| D-212A | `5da4699` | Feature | localStorage hide/show — device-local only; `humanx.me.reflectionAvatar.hidden`; "Hide this" / "Show again" |
| D-212B | `6c86c37` | Live closeout | D-212A confirmed live |
| D-213A | `e9ecdc4` | Polish | Accessibility — `type="button"`, `aria-label`, `:focus-visible` rings, 32px touch targets |
| D-213B | `7ff1684` | Live closeout | D-213A confirmed live |
| D-214A | `814a627` | Regression lock | 55 tests — private boundary, public exclusion, backend/API exclusion, data minimization, copy guardrails, accessibility lock, deploy lock |
| D-215A | `a5eaa97` | Regression lock | 43 tests — private/public render separation, no localStorage/public coupling, backend/API boundary, forbidden wording, renderMeHtml wiring, deploy lock |
| D-216A | `93783d1` | Regression lock | 79 tests — positive allowlist (`PUBLIC_PROFILE_ALLOWED_MARKERS`) + denylist (`PUBLIC_PROFILE_PRIVATE_DENYLIST`); deny-by-default |
| D-217A | `5c8dbe2` | Maintainability | Structured comment index in `hardening-smoke-test.mjs`; 20 maintainability tests; navigation anchors |
| D-218A | `c4ba537` | Checker improvement | `KNOWN_PARAM_ROUTES` constant; distinct NEW-warning for unknown routes; 9 smoke tests; warning audit doc |

**Tests added in arc:** 55 + 43 + 79 + 20 + 9 = **206 new tests** (2186 total after D-218A).
**Deploys required in arc:** 2 (D-212B, D-213B — owner manual terminal deploy from live closeout sessions).
**D-214A through D-218A:** Tests / docs / checker only — no deploy needed.

---

## D-220 → D-225 public profile polish arc summary

This arc delivered visual, accessibility, and UX improvements to the public profile page, all within the D-216A allowlist contract. All changes are confined to the public profile render surface; no new public data fields were introduced and no privacy boundary changes were made.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-220A | `03ff140` | Feature | Visual polish — counts card to top; `<details>` context block; `pp-item-actions` wrapper; truths empty state |
| D-220B | `9ba04ae` | Live closeout | D-220A confirmed live; 21-item sanity PASS |
| D-221A | `89ab5e1` | Polish | Accessibility — `.pp-item-actions .btn-mini:focus-visible` ring; mobile `min-height:44px` on claim action buttons |
| D-221B | `c31dc8f` | Live closeout | D-221A confirmed live; 20-item sanity PASS |
| D-222A | `b967601` | Feature | Copy link — `pp-copy-link` button in header for all visitors; `copyPublicProfileLink` updated to `window.location.href`; "Link copied" / "Copy failed — use browser address bar" |
| D-222B | `c019a23` | Live closeout | D-222A confirmed live; 24-item sanity PASS |
| D-223A | `23eea66` | Feature | Section nav — `<nav aria-label="Public profile sections">` with four anchor links; `id` attributes on all sections; pure HTML anchors |
| D-223B | `a5e6979` | Live closeout | D-223A confirmed live; 26-item sanity PASS |
| D-224A | `910b4db` | Feature | Empty states — `pp-empty-card` on snapshot/claims/truths; snapshot always emits `id="public-snapshot"`; Snapshot nav unconditional |
| D-224B | `053cc67` | Live closeout | D-224A confirmed live; 25-item sanity PASS |
| D-225A | `ad01e7d` | Regression lock | 13 cross-arc composite tests — page structure order, all CSS classes, copy-link contract, section nav, empty states, allowlist, privacy boundary, forbidden wording, accessibility, deploy integrity, empty-state copy, header button, README arc references |

**Tests added in arc:** 12 + 12 + 16 + 20 + 18 + 13 = **91 new tests** (2290 total after D-225A).
**Deploys required in arc:** 5 (D-220B, D-221B, D-222B, D-223B, D-224B — owner manual terminal deploy).
**D-225A:** Tests / docs only — no deploy needed.

---

## D-227 → D-231 review queue ergonomics arc summary

This arc delivered four ergonomics improvements to the admin-only review/moderation UI and locked them with a consolidated regression fence. All changes are confined to the review queue render surface and admin-only interactions; no public profile exposure, no backend/API/schema changes, no moderation semantics changes.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-227A | `ad7680e` | Audit | Scanability audit — full UI structure, 8 actions, 6 friction points (F-1→F-6), 5 improvement slices; docs only |
| D-227B | `ed31b9c` | Feature | Selected-card anchor — `data-review-selected="true"`; `scrollSelectedReviewCardIntoView()`; stronger `.review-card-selected` CSS |
| D-227C | `958ece2` | Live closeout | D-227B confirmed live; 20-item sanity PASS |
| D-228A | `c7d5fb0` | Feature | Scroll preservation — `withReviewScrollPreserved(fn)`; 9 pure local re-renders wrapped; `inspectReviewItem` excluded |
| D-228B | `c2a2f22` | Live closeout | D-228A confirmed live; 25-item sanity PASS |
| D-229A | `d7b7a88` | Feature | Confirm-state clarity — `data-review-confirming` attribute; `review-confirm-armed` class; `review-card-approve-pending`; neutral amber cleanup styling |
| D-229B | `10aa7be` | Live closeout | D-229A confirmed live; 23-item sanity PASS |
| D-230A | `9c6f5f1` | Feature | Decision feedback — `reviewDecisionFeedback` state; `clearReviewDecisionFeedback()`; `role="status" aria-live="polite"` banner; Dismiss button |
| D-230B | `0a7863d` | Live closeout | D-230A confirmed live; 24-item sanity PASS |
| D-231A | `9443ea6` | Regression lock | 37 tests across 7 categories — D-227/D-228/D-229/D-230 behavior locked; moderation semantics lock; public exposure lock; deploy integrity lock |

**Tests added in arc:** 18 + 19 + 20 + 19 + 37 = **113 new tests** (2403 total after D-231A).
**Deploys required in arc:** 4 (D-227C, D-228B, D-229B, D-230B — owner manual terminal deploy).
**D-227A and D-231A:** Docs / tests only — no deploy needed.

---

## D-233 → D-237 duplicate advisory UX mini-arc summary

This arc delivered UX improvements to the duplicate/similar-claim advisory workflow in the admin-only review queue, then locked them with a regression fence. All changes are confined to the review queue render surface and admin-only interactions; no public profile exposure, no backend/API/schema changes, no moderation semantic changes.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-233A | `cb3069d` | Audit | Duplicate review UX audit — 4 findings (F-1→F-4); 15 guard tests; baseline 2403→2418; docs only |
| D-233B | `27df1c7` | Feature | Resolve-similar scroll anchor parity — `scrollToReviewAnchor(claimId)` added to `resolveSimilarUI` success path; 11 tests |
| D-233C | `cb3069d` | Live closeout | D-233B confirmed live; 11/11 PASS |
| D-234A | `df6b524` | Feature | Similar advisory display clarity — structured `review-similar-note` banner; "Possible related claim:" field prefix; "does not approve, reject, or merge" dismiss modal copy; 5 new CSS sub-classes; 19 tests |
| D-234B | `b73a4c5` | Live closeout | D-234A confirmed live; 15/15 PASS |
| D-235A | `d30646a` | Feature | Similar advisory Copy ID — `copySimilarClaimId(id)` helper; Copy ID button; `<code user-select:all>` display element; 19 tests |
| D-235B | `2564d8f` | Live closeout | D-235A confirmed live; 14/14 PASS |
| D-236A | `3136539` | Feature | Duplicate-target prefill — "Use as duplicate target" button in inspect panel; `markDuplicateUI(claimId, suggestedCanonicalId='')` optional param; prefill-only (no auto-submit); 18 tests + 6 window fixes |
| D-236B | `f6c48ae` | Live closeout | D-236A confirmed live; 16/16 PASS |
| D-237A | `959b343` | Regression lock | 41 tests across 7 categories — D-233B scroll lock; D-234A clarity lock; D-235A Copy ID lock; D-236A prefill lock; semantics lock; public exposure lock; deploy integrity lock |

**Tests added in arc:** 15 + 11 + 19 + 19 + 18 + 41 = **123 new tests** (2526 total after D-237A).
**Deploys required in arc:** 4 (D-233C, D-234B, D-235B, D-236B — owner manual terminal deploy).
**D-233A, D-237A:** Audit / tests / docs only — no deploy needed.

---

## D-239 → D-240 review-to-study navigation mini-arc summary

This arc audited and improved the moderator navigation path from Review queue into Study View and back. The core fix closes D-239A F-1: `backToArena()` now scrolls to the restored review card after returning from Study. One line of code added, locked by 47 new smoke tests (17 in D-239B + 30 in D-240A).

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-239A | `23b6a39` | Audit | Review-to-study navigation audit — 5 findings; identified F-1 scroll gap; docs only |
| D-239B | `5c12a10` | Feature | Back-to-Review scroll restore — `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` added to `backToArena()` review branch; 17 tests |
| D-239C | `725f486` | Live closeout | D-239B confirmed live; 13/13 PASS |
| D-240A | `cab9952` | Regression lock | 30 tests across 7 categories — review-origin capture, Study header, item restore, RAF scroll, compat (D-227/228/229/230/233/236), public exposure, deploy integrity |

**Tests added in arc:** 17 + 30 = **47 new tests** (2573 total after D-240A).
**Deploys required in arc:** 1 (D-239C — owner manual terminal deploy).
**D-239A and D-240A:** Docs / tests only — no deploy needed.

---

## Review-to-Study navigation current behavior (post D-239→D-240)

| Feature | Behavior |
|---------|---------|
| Study entry from Review | All five inspect-panel Study buttons call `openReviewClaimStudy(id)` → sets `lastModeBeforeStudy='review'` + saves `lastInspectedReviewItemId`; navigates to Study View |
| Study header back button | `'← Back to Review'` rendered when `lastModeBeforeStudy === 'review'`; `data-action="backToArena"` |
| Back-to-Review item restore | `backToArena()` review branch: restores `inspectedReviewItem` from saved `lastInspectedReviewItemId`; calls `setMode('review')` → re-renders review page with inspect panel |
| Post-render scroll (D-239B) | `if (_savedId) requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` — deferred until after DOM write; null-safe guard |
| No queue reload | `loadReviewQueue()` NOT called on return — cached `reviewQueue.review` array used |
| Non-review origins | vault / truths / me / arena branches in `backToArena()` unchanged |
| Browser history | No `pushState` / `replaceState` — no history changes |

---

## D-242 → D-243 review next-item flow mini-arc summary

This arc audited the post-decision moderator experience and added a manual "Open next item →" button to the D-230A feedback banner. After Approve or Reject, the button appears when a valid next item exists in the current sorted/filtered queue. Clicking it opens the inspect panel for that item without making any moderation decision.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-242A | `6189bf8`/`1226341` | Audit | Post-decision next-item flow audit — found F-1 (no mouse-path next-item affordance); 7 guard tests; also fixed D-98B noscript test broken by upstream Drift/Belief merge |
| D-242B | `4f2e031` | Feature | "Open next item →" button in D-230A feedback banner; `reviewDecisionFeedbackNextId` state; candidate captured before reload from sorted/filtered queue; post-reload validity check; 24 tests |
| D-242C | `443bcc6` | Live closeout | D-242B confirmed live; 34/34 PASS (owner deploy 2026-07-01) |
| D-243A | `d24b5ea` | Regression lock | 34 tests across 7 categories — state, capture, validity, manual-action, cross-arc compat, public boundary, deploy integrity |

**Tests added in arc:** 7 + 24 + 34 = **65 new tests** (2638 total after D-243A).
**Deploys required in arc:** 1 (D-242C — owner manual terminal deploy).
**Docs/tests-only tasks:** D-242A, D-243A.

---

## D-245 → D-248 review card metadata density mini-arc summary

This arc audited and improved the metadata density of review queue cards, reducing visual noise in the primary badge row and replacing cryptic score abbreviations with readable labels. All changes are confined to the review queue render surface and admin-only view; no public profile exposure, no backend/API/schema changes, no moderation semantic changes.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-245A | `7bc3ec6` | Audit | Metadata density audit — 7 friction findings; F-1 badge overflow, F-2 cryptic scores, F-3 standalone date row, F-4 pressure handle duplication; docs only |
| D-245B | `246bd23` | Feature | Inline date — `Updated {age}` moved from standalone `<p class="review-card-date">` into `.review-card-meta` concat; CSS date rules removed; 14 tests |
| D-245C | `dd90094` | Live closeout | D-245B confirmed live; 24/24 PASS |
| D-246A | `acf7bb9` | Feature | Score label clarity — `ev:N ts:N sv:N` → `Evidence N · Test N · Survive N`; 13 tests |
| D-246B | `c4894da` | Live closeout | D-246A confirmed live; 28/28 PASS |
| D-247A | `ed91f29` | Feature | Advisory hint grouping — `needs sharpening` / `category echo` / `? borderline origin` moved to `.review-card-hints` secondary row; CSS added; 16 tests |
| D-247B | `d139e60` | Live closeout | D-247A confirmed live; 31/31 PASS |
| D-248A | `e310da7` | Regression lock | 7 categories / 41 tests — inline date, score labels, hint grouping, head badge set, cross-arc compat, public/Drift/backend boundary, deploy integrity |

**Tests added in arc:** 14 + 13 + 16 + 41 = **84 new tests** (2638 → 2722 total).
**Deploys required in arc:** 3 (D-245C, D-246B, D-247B — owner manual terminal deploy).
**D-245A and D-248A:** Docs / tests only — no deploy needed.

---

## D-250 → D-254 Review search/filter clarity arc summary

This arc audited and improved the Review queue search, filter, and active-state clarity for the moderator, then locked the results with a consolidated regression fence. All changes are confined to the admin-only Review queue render surface; no public profile exposure, no backend/API/schema changes, no moderation semantic changes.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-250A | `2730 baseline` | Audit | Review search/filter clarity audit — 7 findings (F-1 HIGH no search; F-2 MEDIUM no active-filter context; F-3/F-4/F-5/F-6/F-7 low); 8 guard tests; docs only |
| D-250B | `(D-250C live)` | Feature | Active filter/sort summary — `renderReviewActiveSummary(list)` renders `Showing: {filter} · {n} item(s) · Sorted: {sort}` between audit bar and cards; 13 tests |
| D-250C | live closeout | Live | D-250B confirmed live; 29/29 PASS |
| D-251A | `(D-251B live)` | Feature | Zero-results clarity — `renderReviewEmptyState()` with `"No review items match this view."` title, context line, per-filter copy, "Show all review items" button; 15 tests |
| D-251B | live closeout | Live | D-251A confirmed live; 20/20 PASS |
| D-252A | `(D-252B live)` | Feature | Ambiguous filter helper copy — `renderReviewFilterHelper()` for `~Quality`, `Dupes`, `~Similar` only; exact locked copy; 20 tests (helper copy updated to `Dupes + Similar` by D-256B) |
| D-252B | live closeout | Live | D-252A confirmed live |
| D-253A | `(D-253B live)` | Feature | Client-side Review search — `reviewSearchQuery` state, `applyReviewSearch(list)`, `renderReviewSearchRow()`, `clearReviewSearch`; search-aware pipeline `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))`; next-item and inspect-panel nav updated; 35 tests |
| D-253B | live closeout | Live | D-253A confirmed live; 41/41 PASS |
| D-254A | `aedbd3f` | Regression lock | 64 tests across 9 categories — D-250B/D-251A/D-252A/D-253A behavior locked; public boundary locked; Drift/backend boundary locked |
| D-255A | this checkpoint | Docs | Search/filter clarity milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |

**Tests added in arc:** 8 + 13 + 15 + 20 + 35 + 64 = **155 new tests** (2722 → 2877 total).
**Deploys required in arc:** 3 (D-250C, D-251B, D-252B, D-253B — owner manual terminal deploy).
**D-250A, D-254A, D-255A:** Audit / tests / docs only — no deploy needed.

---

## D-256 duplicate/similar label clarity addendum (post D-255A)

This addendum records the copy-only label clarification that followed the D-250→D-254 search/filter clarity arc. No predicate, filter key, card badge, inspect panel field, or moderation action was changed.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-256A | `3a4805e` | Audit | Duplicate/similar filter label audit — full inventory of all `Dupes`/`~Similar` controls, predicates, helper copy, card badges, inspect panel, action buttons, modals; confirmed `~Similar ⊆ Dupes` always; recommended label rename; docs only |
| D-256B | `f73a658` | Feature (copy) | Renamed visible combined filter label `Dupes` → `Dupes + Similar` in 6 copy locations; predicate/key/badge/panel/actions unchanged; 26 new D-256B tests; 2877 → 2903 |
| D-256C | `7615b04` | Live closeout | D-256B owner deploy PASS; 35/35 live sanity PASS |
| D-257A | this checkpoint | Docs | Duplicate/similar label clarity checkpoint addendum — `PROJECT_STATE.md` updated; docs only; no deploy |

**Copy locations changed in D-256B:**
- `renderReviewFilterBar` defs: `['duplicate','Dupes']` → `['duplicate','Dupes + Similar']`
- `renderReviewActiveSummary` filterLabels: `duplicate:'Dupes'` → `duplicate:'Dupes + Similar'`
- `renderReviewEmptyState` filterLabels: `duplicate:'Dupes'` → `duplicate:'Dupes + Similar'`
- `renderReviewFilterHelper` helper copy: `'Dupes includes...'` → `'Dupes + Similar includes confirmed duplicates and near-duplicate advisories.'`
- `reviewEmptyText` duplicate entry: updated to mention confirmed duplicates and similar advisories explicitly
- `renderReviewAuditSummary` stat label: `{label:'Dupes',...}` → `{label:'Dupes + Similar',...}`

**Tests added in D-256:** 26 (D-256B section). Total: 2877 → 2903.
**Deploys required:** 1 (D-256C — owner manual terminal deploy).
**D-256A, D-257A:** Audit / docs only — no deploy needed.

---

## D-258 → D-259 Review mobile controls wrapping mini-arc summary

This mini-arc audited, fixed, and locked the wrapping/layout behavior of Review queue controls on narrow viewports. All changes are CSS-only; no copy, behavior, predicate, or moderation action was changed. All previous Review arc behavior guarantees remain intact.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-258A | `5862e17` | Audit | Mobile controls/action wrapping audit — 7 risk findings: F-1 HIGH (`.review-sort-bar` no CSS), F-2 HIGH (`.review-decision-feedback` no flex-wrap), F-3 MEDIUM (inspect actions column), F-4 MEDIUM (`.review-empty-actions` not flex), F-5–F-7 LOW; 15-group control inventory; recommended D-258B slice; docs only |
| D-258B | `f18db9c` | CSS polish | Sort bar isolation (`.review-sort-bar`, `.review-sort-label`, `.review-sort-select` rules added); decision feedback wrapping (`flex-wrap` + `flex-shrink:0` on buttons); empty-action spacing (`display:flex;flex-wrap:wrap;gap:6px` on `.review-empty-actions`); 21 new tests; 2924 total |
| D-258C | `5b8d667` | Live closeout | D-258B owner deploy PASS; 39/39 live sanity PASS |
| D-259A | `8e36fdc` | Regression lock | 35 tests across 7 categories — sort-bar render path, sort-bar CSS isolation, decision-feedback flex-wrap, button flex-shrink:0, empty-actions flex/wrap/gap, pipeline lock, public profile boundary |
| D-260A | this commit | Docs | Mobile controls wrapping checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |

**CSS changes in D-258B (public/styles.css only):**
- Added `.review-sort-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:2px 0}`
- Added `.review-sort-label{font-size:10px;color:var(--muted);white-space:nowrap;flex-shrink:0}`
- Added `.review-sort-select{...min-width:120px;max-width:180px;width:auto}`
- Updated `.review-decision-feedback` to add `flex-wrap:wrap`
- Updated `.review-feedback-dismiss` and `.review-feedback-next` to add `flex-shrink:0`
- Updated `.review-feedback-msg` to add `min-width:0`
- Updated `.review-empty-actions` to add `display:flex;flex-wrap:wrap;gap:6px;align-items:center`

**Tests added in mini-arc:** 21 (D-258B) + 35 (D-259A) = **56 new tests** (2903 → 2959 total).
**Deploys required:** 1 (D-258C — owner manual terminal deploy).
**D-258A, D-259A, D-260A:** Audit / tests / docs only — no deploy needed.

---

## D-261 → D-262 Review inspect panel action spacing mini-arc summary

This mini-arc audited, fixed, and locked the inspect panel action button layout — specifically the visual density and tap-target quality at narrow viewports. All changes are CSS-only; no copy, behavior, predicate, or moderation action was changed. All previous Review arc behavior guarantees remain intact.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-261A | `036b459` | Audit | Inspect panel action density audit — full action inventory (7 sections: primary moderation, armed states, archive, dup/advisory, Study variants, advisory field actions, feedback/card); 6 risk findings: F-1 HIGH (all 5–7 buttons flat column at ≤600px, no visual break), F-2 MEDIUM (no structural grouping), F-3 MEDIUM (dead CSS class `.review-inspect-top-actions` in mobile rule), F-4 MEDIUM (no `width:100%` for mobile column), F-5–F-6 LOW; recommended D-261B CSS slice; docs only |
| D-261B | `246974a` | CSS polish | Desktop Study push (`margin-left:auto` on `.review-inspect-actions .btn-study-review`); mobile full-width tap targets (`width:100%` on `.review-inspect-actions button`); mobile soft separator before dup/advisory group (`.review-inspect-markdup`/`.review-inspect-resolvesim` `margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)`); Study column reset (`margin-left:0`); 19 new tests; 2978 total |
| D-261C | `ac3e279` | Live closeout | D-261B owner deploy PASS; 41/41 live sanity PASS; deployed Worker: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` |
| D-262A | `92ca239` | Regression lock | 33 tests across 7 categories — desktop Study push, mobile full-width buttons, mobile separator (calm `border-top`, not destructive red), inspect action behavior (Approve/Reject/Keep/markDuplicateUI/resolveSimilarUI/prev-next pipeline/Open next item/reviewDecisionUI), cross-arc compatibility (D-245B/D-256/D-258B/D-259A), public/Drift/backend boundary, deploy integrity |
| D-263A | this commit | Docs | Inspect panel action spacing checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |

**CSS changes in D-261B (`public/styles.css` only):**
- Added `.review-inspect-actions .btn-study-review{margin-left:auto}` (outside media block — desktop push)
- Added inside `@media(max-width:600px)` Review block: `.review-inspect-actions button{width:100%}`
- Added inside `@media(max-width:600px)` Review block: `.review-inspect-actions .review-inspect-markdup,.review-inspect-actions .review-inspect-resolvesim{margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)}`
- Added inside `@media(max-width:600px)` Review block: `.review-inspect-actions .btn-study-review{margin-left:0}` (reset)

**Tests added in mini-arc:** 19 (D-261B) + 33 (D-262A) = **52 new tests** (2959 → 3011 total).
**Deploys required:** 1 (D-261C — owner manual terminal deploy).
**D-261A, D-262A, D-263A:** Audit / tests / docs only — no deploy needed.

---

## Review inspect panel action spacing current behavior (post D-261→D-262)

| Feature | Behavior |
|---------|---------|
| Desktop Study push | `.review-inspect-actions .btn-study-review` has `margin-left:auto` — Study floats to far right of the flex action bar on wider layouts, creating a natural gap between primary/dup group and Study |
| Mobile full-width tap targets | `.review-inspect-actions button{width:100%}` at `@media(max-width:600px)` — all inspect action buttons expand to full container width in the column layout |
| Mobile soft separator | `.review-inspect-markdup` and `.review-inspect-resolvesim` have `margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)` — calm visual break (6% white alpha, not error red) before the dup/advisory button group |
| Mobile Study reset | `.review-inspect-actions .btn-study-review{margin-left:0}` inside mobile block — Study stacks naturally in column; overrides desktop push |
| Action labels | Approve / Keep Pending / Reject / Archive / Mark Duplicate... / Dismiss ~Similar / Study variants — all unchanged |
| Action button order | Approve → Keep Pending → Reject → [Archive] → [Mark Duplicate...] → [Dismiss ~Similar] → [Study] — unchanged |
| Inspect action behavior | `requestApproveReview`, `requestRejectReview`, `markDuplicateUI`, `resolveSimilarUI`, `openReviewClaimStudy` all unchanged |
| Search-aware inspect prev/next | `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` pipeline unchanged in `renderReviewInspectPanel` |
| "Open next item →" | `renderReviewList` feedback banner behavior unchanged |
| Decision feedback | `reviewDecisionUI` still defined and unchanged |
| Duplicate/advisory semantics | Mark Duplicate / Dismiss ~Similar / Use as duplicate target — all unchanged |
| Moderation actions | Approve/Keep/Reject/Archive — all unchanged |
| D-245→D-260 locks | All prior regression lock tests pass without modification |

---

## D-227 → D-263 Review ergonomics full run summary (D-264A wrap-up)

This section records the complete D-227→D-263 Review ergonomics run as a single consolidated milestone. The run delivered nine mini-arcs of progressive improvement to the admin-only Review/moderation UI. All work is confined to the admin Review queue render surface; no public profile exposure, no backend/API/schema changes, and no moderation semantic changes were made across the entire run.

| Arc | Tasks | What it delivered | Tests added | Total after |
|-----|-------|------------------|-------------|-------------|
| Review queue ergonomics | D-227→D-232 | Selected-card anchor, scroll preservation, confirm-state clarity, decision feedback banner, regression lock, checkpoint | 113 | 2403 |
| Duplicate advisory UX | D-233→D-238 | Resolve-similar scroll, structured advisory banner, Copy ID, duplicate-target prefill, regression lock, checkpoint | 123 | 2526 |
| Review-to-Study navigation | D-239→D-241 | Back-to-Review scroll restore (`requestAnimationFrame`), regression lock, checkpoint | 47 | 2573 |
| Review next-item flow | D-242→D-244 | "Open next item →" button in decision feedback, regression lock, checkpoint | 65 | 2638 |
| Review card metadata density | D-245→D-249 | Inline date, readable score labels (`Evidence N · Test N · Survive N`), advisory hint grouping (`.review-card-hints`), regression lock, checkpoint | 84 | 2722 |
| Review search/filter clarity | D-250→D-255 | Active filter/sort summary, zero-results clarity, ambiguous helper copy, client-side Review search, regression lock, checkpoint | 155 | 2877 |
| Duplicate/similar label clarity | D-256→D-257 | `Dupes` → `Dupes + Similar` copy rename in 6 locations, checkpoint | 26 | 2903 |
| Mobile control wrapping | D-258→D-260 | Sort bar isolation, decision feedback flex-wrap, empty-actions flex, regression lock, checkpoint | 56 | 2959 |
| Inspect panel action spacing | D-261→D-263 | Desktop Study push, mobile full-width buttons, mobile soft separator, regression lock, checkpoint | 52 | 3011 |

**Total tests added in full run:** 721 (2403 - 1682 pre-arc baseline → 3011 final).
**Code/CSS deploys in full run:** 14 owner manual terminal deploys.
**Audit/lock/checkpoint tasks:** No deploy needed for any audit, regression lock, or checkpoint task.
**Latest deployed Worker version:** `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` (D-261C, 2026-07-01).

### What is now true of the Review queue (post D-264A)

- Review cards are denser and easier to scan.
- Date metadata appears inline in `.review-card-meta` as `Updated {age}`.
- Score labels are readable: `Evidence N · Test N · Survive N` (was `ev:N ts:N sv:N`).
- Low-priority advisory hints are grouped into a secondary `.review-card-hints` row.
- Active filter / sort / search summary is always visible above the card list.
- Client-side Review search is active; search-aware pipeline used for all navigation.
- Zero-results state explains the current filter/sort/search context and offers recovery actions.
- Ambiguous filter helper copy exists for `~Quality`, `Dupes + Similar`, and `~Similar`.
- Combined filter label is `Dupes + Similar`; `~Similar` remains advisory-only and a strict subset.
- "Open next item →" appears in the decision feedback banner after Approve or Reject.
- Inspect panel prev/next and post-decision next-item both follow the searched + filtered + sorted visible list.
- Sort bar wraps safely at narrow widths (`.review-sort-bar` flex isolation).
- Decision feedback banner wraps safely (`flex-wrap` on `.review-decision-feedback`).
- Empty-state actions stack safely (`display:flex;flex-wrap:wrap` on `.review-empty-actions`).
- Inspect panel actions have: Study push right on desktop, full-width tap targets on mobile, calm soft separator before dup/advisory group.
- Back-to-Review scroll restores the selected card position via `requestAnimationFrame`.
- Confirm-state clarity via `data-review-confirming` attribute and `review-confirm-armed` class.
- Duplicate/advisory semantics unchanged.
- Moderation actions unchanged.
- Public profile render path has not been exposed to any Review internals across the full run.

---

## D-265 → D-266 Study entry / Back button style mini-arc summary

This mini-arc audited and fixed Study entry and Back-to-Review button style inconsistencies in the Review inspect panel, evidence cards, and Study page. Changes are CSS/copy-only; no navigation behavior, scroll restoration, moderation actions, or advisory semantics were changed.

| Task | Commit | Type | What it did |
|------|--------|------|-------------|
| D-265A | `bf45c87` | Audit | Study entry / Back button style consistency audit — full 14-button inventory across inspect panel, vault, evidence cards, Truths page, My HumanX, Study page back buttons; 8 friction findings (F-1 HIGH: `primary` false hierarchy on inspect panel claim Study; F-2 HIGH: all 5 Back buttons unstyled; F-3–F-6 MEDIUM; F-7–F-8 LOW); docs only |
| D-265B | `092d6fc` | CSS/copy polish | 4 targeted changes: (1) removed `primary` from inspect panel claim Study button; (2) changed linked claim field label `{claimId} ↗` → `Study linked claim ↗`; (3) added `btn-link-small` + `↗` to evidence card Study button; (4) added `btn-back-study` class to all 5 Back navigation buttons + `.btn-back-study` CSS rule (calm secondary affordance); 24 new tests; baseline 3011 → 3035 |
| D-265C | `22d99e9` | Live closeout | D-265B owner deploy PASS (2026-07-01); 39/39 live sanity PASS |
| D-266A | `225ab30` | Regression lock | 40 new tests across 8 categories — inspect panel Study hierarchy, linked-claim Study label, evidence card Study style/icon, Back-to-Review style, Back-to-Review behavior, navigation/context, cross-arc compatibility, public/Drift/backend boundary + deploy integrity; baseline 3035 → 3075 |
| D-267A | this commit | Docs | Study entry / Back button style checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |

**Tests added in mini-arc:** 24 (D-265B) + 40 (D-266A) = **64 new tests** (3011 → 3075 total).
**Code/CSS deploys:** 1 (D-265B/C — owner manual terminal deploy).
**D-265A, D-266A, D-267A:** Audit / tests / docs only — no deploy needed.
**Latest deployed Worker version:** `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` (unchanged from D-261C).

### What is now true of Study entry and Back-to-Review buttons (post D-265→D-266)

- Inspect panel claim Study button no longer has false `primary` hierarchy — all inspect panel Study buttons use `btn-study-review` only.
- D-261B Study push (`margin-left:auto` on `.review-inspect-actions .btn-study-review`) remains active on desktop.
- Linked claim field Study button (inspect panel truth branch) shows `Study linked claim ↗` instead of raw claim ID.
- Evidence card Study button uses `btn-link-small` (matching vault group header) and includes `↗` icon.
- All 5 Back navigation buttons use `class="btn-back-study"` with calm secondary styling (`rgba(255,255,255,.06)` fill, `rgba(255,255,255,.12)` border, `var(--muted)` text) — not destructive red.
- All Back-to-Review navigation behavior unchanged: `data-action="backToArena"`, scroll restoration via `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))`, no queue reload on return.
- Review search/filter/sort context preserved on return from Study.
- Search-aware inspect prev/next unchanged.
- "Open next item →" behavior unchanged.
- Moderation actions unchanged.
- Duplicate/advisory semantics unchanged.

---

## Study entry / Back-to-Review button current behavior (post D-265→D-266)

| Feature | Behavior |
|---------|---------|
| Inspect panel claim Study | `class="btn-study-review"`, `Open Study View ↗`, calls `openReviewClaimStudy(id)` — no `primary` class |
| Inspect panel evidence/pressure Study | `class="btn-study-review"`, `Study Parent Claim ↗`, calls `openReviewClaimStudy(claim_id)` |
| Inspect panel truth Study | `class="btn-study-review"`, `Study Linked Claim ↗`, calls `openReviewClaimStudy(linked_id)` (public linked claims only) |
| Linked claim Study button (truth, public) | `class="btn-link-small"`, `Study linked claim ↗`, calls `openReviewClaimStudy(linked)` |
| Non-public linked claim | Shows `review-inspect-id` code element + state span — no Study button |
| Evidence card Study button | `class="btn-link-small"`, `Study Linked Claim ↗`, calls `studyFromVault(claimId)` |
| Vault group header Study button | `class="btn-link-small"`, `Study claim ↗`, calls `studyFromVault(claimId)` |
| All 5 Back navigation buttons | `class="btn-back-study"`, `data-action="backToArena"`, copy variants: `← Back to Review` / `← Back to Vault` / `← Back to Truths` / `← Back to My HumanX` / `← Back to Claims` |
| `.btn-back-study` CSS | `background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:var(--muted);padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer` — calm secondary, not destructive red |
| `.btn-back-study:hover` CSS | `background:rgba(255,255,255,.10);color:var(--text)` |
| D-261B Study push | `.review-inspect-actions .btn-study-review{margin-left:auto}` — Study floats right on desktop, resets to `margin-left:0` on mobile |
| Back-to-Review scroll restore | `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` — deferred RAF, null-safe guard |
| No queue reload on Back-to-Review | `loadReviewQueue()` NOT called on return; cached queue used |
| Review context preserved | `reviewSearchQuery`, `reviewStateFilter`, `reviewSortOrder` all preserved on return from Study |
| Search-aware inspect nav | `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` pipeline unchanged |

---

## D-268 → D-269 RunPack fallback guidance / generated-time mini-arc summary

This arc audited the Claim/RunPack flow, fixed the two highest-value friction findings (F-2 and F-1), and locked the improvements. The implementation was frontend-only. No backend/API/schema changes. No public truth-state changes. No Review/moderation changes.

| Task | Type | What it did |
|------|------|-------------|
| D-268A | Audit | Full Claim/RunPack flow clarity audit. 6-step flow inventory. 7 friction findings: F-2 MEDIUM (fallback missing `instruction`/`output_contract`), F-1 MEDIUM (`generated_at` not shown), F-3 MEDIUM (Load AI Analysis Return collapsed — deferred), F-4 LOW-MEDIUM (`source_snapshot_hash` not in stale check — deferred), F-5 LOW (packet_id not stored — deferred). Docs only. Baseline unchanged: 3075/0/24/57. |
| D-268B | Feature | Added `instruction` + `output_contract` to fallback packet. Added `rpRelativeTime()` helper. Added `rp-summary-generated` row to `runPackSummary()`. 25 new lock tests. Baseline 3075 → 3100. |
| D-268C | Live closeout | Owner deploy PASS (2026-07-01). 36/36 live sanity PASS. |
| D-269A | Regression lock | 44 new tests across 7 categories locking D-268B state permanently. Baseline 3100 → 3144. |

### D-271→D-272 mini-arc: RunPack AI-return import visibility

This arc addressed D-268A finding F-3 (Load AI Analysis Return section always collapsed), implemented the fix, confirmed it live, and locked it. The implementation was frontend-only. No backend/API/schema changes. No public truth-state changes. No Review/moderation changes.

| Task | Type | What it did |
|------|------|-------------|
| D-271A | Feature | `rp-return-section` now auto-expands when `lastPacket&&lastPacketClaimId===selected?.id`. New `rp-return-next-step` copy with no-auto-publish disclaimer. 27 new lock tests. Baseline 3171/0/24/57. |
| D-271B | Live closeout | Owner deploy PASS (2026-07-01). 32/32 live sanity PASS. Deployed Worker version not captured. |
| D-272A | Regression lock | 46 new tests across 7 categories. D-93B allowlist extended. Baseline 3171 → 3217. |
| D-273A | Checkpoint | Docs only — no deploy. Baseline unchanged 3217/0/24/57. |

### AI-return import visibility behavior (post D-271A)

| Feature | Behavior |
|---------|---------|
| **`rp-return-section` visibility** | **Auto-expands** when `lastPacket&&lastPacketClaimId===selected?.id` — i.e. a matching packet is loaded for the current claim (D-271A) |
| Section is gated | Only rendered when `selected` claim exists — not unconditionally shown |
| `Load AI Analysis Return` title | Present in `rp-return-section` summary — unchanged |
| **`rp-return-next-step` copy** | **New** (D-271A) — "After your AI analyses the packet, paste its JSON response here. Saving does not publish a truth automatically — it only loads analysis for this claim." |
| `ev-origin-note` provenance note | Present in `rp-return-body` — "not independent external sources; not independent verification" — unchanged |
| `analysisPaste` textarea | Present — unchanged |
| `saveAnalysisResult` JSON.parse | Unchanged — validates with `JSON.parse(text)` |
| `saveAnalysisResult` field extraction | Unchanged — `parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed` |
| `saveAnalysisResult` failure toast | Unchanged — "Paste valid JSON first" |
| `saveAnalysisResult` success toast | Unchanged — "Analysis saved — verdict shown in the Analysis section." |
| `saveAnalysisResult` route | Unchanged — posts to `/api/analysis` only |
| Public truth state | Unchanged — analysis save does not change `review_state` |
| `packet_id` advisory check | Advisory-only non-blocking toast — unchanged |
| F-4 snapshot-hash stale check | **Added (D-274B)** — `source snapshot changed` fired when `simpleClaimHash(selected) !== meta.source_snapshot_hash` |
| F-5 packet-ID storage | **Added (D-275D live)** — `packet_id` stored in `analysis_results` when `lastPacketClaimId===selected?.id` |

### D-274→D-275 mini-arc: RunPack provenance (snapshot-hash stale detection + packet-ID storage)

This arc addressed D-268A findings F-4 and F-5, implementing content-level stale detection and packet-ID traceability for saved AI analysis results. F-4 was frontend-only; F-5 required schema migration + backend + frontend and used branch/PR workflow.

| Task | Type | What it did |
|------|------|-------------|
| D-274A | Audit | F-4 snapshot-hash stale detection audit. Frontend-only feasible via `simpleClaimHash(selected)` vs `meta.source_snapshot_hash`. Docs only. Baseline unchanged: 3239/0/24/57. |
| D-274B | Feature | Single `if` block in `detectPacketStaleness()`. 22 new tests + 3 prior F-4-deferred tests flipped. Baseline 3217 → 3239. |
| D-274C | Live closeout | Owner deploy PASS (2026-07-02). 24/24 live sanity PASS. Deployed Worker version not captured. |
| D-275A | Audit | F-5 packet-ID storage audit. NOT frontend-only — requires schema migration + backend + frontend. Docs only. Baseline unchanged: 3239/0/24/57. |
| D-275B | Branch implementation | Migration `0017_analysis_results_packet_id.sql`, `src/analysis-results.js`, `public/app-v10.js`. 20 new tests + 3 slice-width fixes. Baseline 3239 → 3263. Branch `d275b-runpack-packet-id-storage`. |
| D-275C | Pre-merge review | 22-item checklist. No blocker. Docs only on branch. |
| D-275D | Merge + migration + deploy | Branch merged to main. D1 migration applied live. Owner deploy PASS (2026-07-02). 22/22 live sanity PASS. Worker: `759acc15-a6dd-4e50-a070-0d3356e5c257`. |
| D-276A | Checkpoint | Docs only — no deploy. Baseline unchanged 3263/0/24/57. |

**Tests added in arc:** 42 new tests (3217 → 3263 total). **Deploys:** 2 (D-274C, D-275D). **Schema migrations applied:** 1 (`0017`). **F-3, F-4, F-5 all COMPLETE.**

### D-277 mini-arc: Saved analysis provenance visibility

This arc surfaced the stored `packet_id` to the owner/private Study view. D-277A confirmed frontend-only feasibility. D-277B added a conditional provenance line to `analysisItem()`. D-277C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-277A | Audit | Confirmed `packetId` is already returned by `GET /api/claims/:id` but not rendered. Frontend-only implementation safe. No backend/schema changes needed. Docs only. Baseline unchanged: 3263/0/24/57. |
| D-277B | Implementation | `analysisItem()` line 466: conditional `<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>` added. 25 new tests. Baseline 3263 → 3288. |
| D-277C | Live closeout | Owner deploy PASS (2026-07-02). 22/22 live sanity PASS. Deployed Worker version: not captured. |

**Tests added in arc:** 25 new tests (3263 → 3288 total). **Deploys:** 1 (D-277C). **Schema migrations applied:** 0. **No backend/API/CSS/index changes.**

### D-279 mini-arc: Owner RunPack workflow wording polish

This arc audited the full owner RunPack workflow for friction, identified that `source snapshot changed` was internal storage language not suited for users, and renamed it. D-279A confirmed no structural gap in the workflow. D-279B was frontend-only. D-279C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-279A | Audit | Full owner RunPack workflow continuity audit. 15 questions answered. Workflow logically complete. F-2 (`source snapshot changed` wording) identified. Docs only. Baseline unchanged: 3288/0/24/57. |
| D-279B | Frontend | `detectPacketStaleness()` wording: `'source snapshot changed'` → `'claim updated since packet'`. 3 existing test assertion strings updated. 10 new D-279B block tests. Baseline 3288 → 3298. |
| D-279C | Live closeout | Owner deploy PASS (2026-07-02). 21/21 live sanity PASS. Deployed Worker version not captured. |

**Detection logic unchanged:** `meta.source_snapshot_hash!=null && simpleClaimHash(selected)!==meta.source_snapshot_hash` — only the pushed string changed.
**Tests added in arc:** 10 new tests (3288 → 3298 total). **Deploys:** 1 (D-279C). **Schema migrations applied:** 0. **No backend/API/CSS/index/worker changes.**

### D-281 mini-arc: Saved analysis to Truth boundary copy polish

This arc audited the boundary between saved AI analysis and public Truth creation, found it structurally sound, and added explicit private/no-auto-publish copy to close two copy-clarity gaps. D-281A confirmed no functional gap. D-281B was frontend-only. D-281C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-281A | Audit | Saved analysis ↔ Truth boundary audit. 16 questions answered. Boundary structurally sound. F-1 (no-auto-publish copy absent from Study view Analysis panel) and F-2 (`analysisItem()` lacked explicit "private" label) identified. Docs only. Baseline unchanged: 3298/0/24/57. |
| D-281B | Frontend | `sectionAnalyses()`: added `"Saving analysis does not publish a truth automatically — it only stores private analysis for this claim."` `analysisItem()`: added `"Private analysis note — not public truth."` Both use existing `ev-origin-note` class. 19 new tests. Baseline 3298 → 3317. |
| D-281C | Live closeout | Owner deploy PASS (2026-07-02). 25/25 live sanity PASS. Deployed Worker version not captured. |

**Behavior unchanged:** `saveAnalysisResult()` still posts only to `/api/analysis`. No Truth creation/submission/approval route added. No CSS/backend/schema/migration/worker changes.
**Tests added in arc:** 19 new tests (3298 → 3317 total). **Deploys:** 1 (D-281C). **Schema migrations applied:** 0.

### D-283 mini-arc: Truth drafting and Review workflow audit

This arc audited the Truth creation and Review gate end-to-end. No code was changed. The audit confirmed all three frontend Truth creation paths produce `review_state='review'`, the Review gate is admin-only, and saved AI analysis has no connection to Truth submission.

| Task | Type | What it did |
|------|------|-------------|
| D-283A | Audit | Full audit of Truth drafting and Review workflow. 21 audit questions answered. Three frontend creation paths (`submitTruth`, `submitBuilderTruth`, `promoteBelief('truth')`) all produce `review_state='review'`. Admin-only Review queue handles approval/rejection. No path bypasses Review. No saved-analysis path connects to Truth creation. All copy accurate. One LOW finding (F-1): owner has no way to see their own pending-Review truths after submission. No fix needed without backend query/API change. Docs only. Baseline unchanged: 3317/0/24/57. |

**No code changes. No schema changes. No deploy. Baseline unchanged.**

### D-285 mini-arc: Owner pending-Review Truth visibility

This arc audited and fixed the post-submission experience for Truth owners. D-285A found the D-283A/D-284A F-1 finding was overstated: the backend already returns pending-Review Truths to the owner and the frontend already renders them in My HumanX. D-285B fixed the one real gap: post-submission navigation. D-285C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-285A | Audit | Full audit of owner pending-Review Truth visibility. 21 questions answered. Key finding: `GET /api/my-humanx` (worker.js line 319) has no `review_state` filter — returns all owner truths including pending. `meRecentTruthsHtml()` already renders them with yellow `Review` badge (`ME_STATE_LABELS = {review:'Review'}`, `ME_STATE_CLR = {review:'b-yellow'}`). D-283A/D-284A F-1 was overstated. Remaining gap: post-submission navigation sends owner to `renderTruths()` (public tab) where pending items are invisible. D-285B classified frontend-only. Docs only. Baseline unchanged: 3317/0/24/57. |
| D-285B | Frontend | All three Truth submission success paths changed to navigate to My HumanX (`renderMe()` + `tab-me`) instead of public Truths tab (`renderTruths()`): `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')`. New toast: `Submitted for Review — you can see it in My HumanX with the Review badge.` 20 new tests + 1 existing test updated (`promoteBelief truth path activates tab-me`). Baseline 3317 → 3337. |
| D-285C | Live closeout | Owner deploy PASS (2026-07-02). 25/25 live sanity PASS. Deployed Worker version not captured. |
| D-286A | Checkpoint | Docs only — closes D-285 arc. No deploy. Baseline unchanged 3337/0/24/57. |

**Backend/schema/API/CSS unchanged across entire D-285 arc.** `review_state='review'` preserved. Review gate preserved. Public profile unaffected. Public Truths tab behavior unchanged. Saved analysis boundary unchanged.
**Tests added in arc:** 20 new tests + 1 updated (3317 → 3337 total). **Deploys:** 1 (D-285B/C).

### D-287 mini-arc: Saved analysis assisted Truth draft

This arc audited and implemented a safe owner-only action that helps draft a Truth from saved AI analysis. D-287A confirmed the action is safe as frontend-only if prefill-only and sourced from `plainLanguageSummary`. D-287B implemented the action. D-287C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-287A | Audit | 23 questions answered. Safe prefill source: `plainLanguageSummary` (prose text). `verdict` must never be used as Truth content (AI label). Action is frontend-only — no backend, schema, or migration. `review_state='review'` and Review gate preserved. Auto-submit and auto-publish remain impossible. Docs only. Baseline unchanged: 3337/0/24/57. |
| D-287B | Frontend | `analysisItem()` now conditionally renders "Draft Truth from analysis" button when `plainLanguageSummary` exists. New `draftTruthFromAnalysis(summary)` async function: switches to Truths tab, calls `renderTruths()`, sets `truthStatement` from `plainLanguageSummary`, focuses field, sets `truthOrigin` to `"RunPack analysis"` if empty, toasts `"Draft ready — review and submit for Review when ready."` Registered in `_D181C_PARAM_ACTIONS`. 23 new tests; two existing `analysisItemSlice` sizes bumped from 1400→2000 and 1200→2000. Baseline 3337 → 3360. |
| D-287C | Live closeout | Owner deploy PASS (2026-07-02). 31/31 live sanity PASS. Deployed Worker version not captured. |
| D-288A | Checkpoint | Docs only — closes D-287 arc. No deploy. Baseline unchanged 3360/0/24/57. |

**D-287 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Draft action label | `"Draft Truth from analysis"` — no `"Publish Truth from analysis"` wording |
| Prefill source | `plainLanguageSummary` only |
| `verdict` used as Truth content | Never |
| Draft-only guidance | `"Draft only — review and submit for Review when ready."` adjacent to button |
| Auto-submit | No — `draftTruthFromAnalysis` never calls `submitTruth()` or `submitBuilderTruth()` |
| Auto-publish | No — no publish/approve route touched |
| Owner must explicitly submit | Yes — must click "Submit Truth for Review" after reviewing draft |
| `review_state='review'` on actual submission | Yes — unchanged in `src/truths.js` and `POST /api/truths` |
| Review gate preserved | Yes — `requestApproveReview`, `requestRejectReview`, `reviewDecisionUI` all unchanged |
| D-285B post-submit navigation | Preserved — all three paths navigate to `renderMe()` + `tab-me`; toast unchanged |
| Public profile | `"Draft Truth from analysis"` not exposed; `analysisItem()` not called from `renderPublicProfileHtml()` |
| Backend/schema/API/CSS | No changes in D-287 |

**Tests added in arc:** 23 new tests (3337 → 3360 total). **Deploys:** 1 (D-287B/C). **Schema migrations applied:** 0. **No backend/API/CSS/index/worker/analysis-results/truths changes.**

### D-289 mini-arc: Owner workflow product polish (saved-analysis card context copy consolidation)

This arc ran a product pass over the full owner workflow (D-289A), identified the highest-friction visual issue — three stacked provenance/disclaimer notes before useful analysis card content — and fixed it by consolidating them into one compact line (D-289B). D-289C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-289A | Product pass (docs) | Full 15-question owner workflow product pass (claim → RunPack → saved analysis → draft Truth → submit → My HumanX). Identified stacked `ev-origin-note` paragraphs as highest-friction issue. Docs only. Baseline unchanged: 3360/0/24/57. |
| D-289B | Frontend | `analysisItem()`: replaced three separate stacked `<p>` notes with one conditional compact line: `"Private analysis · not public truth · not independent verification [· RunPack: rp_...]"`. RunPack provenance still conditional on `a.packetId`; still escaped with `esc(a.packetId)`. No-packet case omits RunPack segment. 23 new D-289B tests; 8 existing tests updated (D-277B ×2, D-279B, D-281B ×2, D-285B, D-287B ×2) to reflect consolidated copy. Baseline 3360 → 3383. |
| D-289C | Live closeout | Owner deploy PASS (2026-07-02). 33/33 live sanity PASS. Deployed Worker version not captured. |
| D-290A | Checkpoint (docs) | Closes D-289 arc. No deploy. Baseline unchanged 3383/0/24/57. |

**D-289 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Compact context line present | `"Private analysis · not public truth · not independent verification"` — always shown |
| Old separate "Private analysis note — not public truth." line | Removed |
| Old separate "Saved from RunPack:" label | Removed |
| RunPack provenance | Still shown when `a.packetId` exists — `"· RunPack: ${esc(a.packetId)}"` |
| RunPack provenance when absent | Omitted — no-packet case produces no RunPack text |
| `esc(a.packetId)` | Preserved — packet ID still XSS-escaped |
| `Draft Truth from analysis` button | Unchanged — still present when `plainLanguageSummary` exists |
| Draft action behavior | Unchanged — prefill-only, no auto-submit, no auto-publish |
| No backend/API/schema/CSS/index/worker changes in D-289 | Confirmed |
| Public profile `/u/:slug` | Unaffected — `analysisItem()` still absent from `renderPublicProfileHtml()` |

**Tests added in arc:** 23 new tests + 8 updated (3360 → 3383 total). **Deploys:** 1 (D-289B/C). **Schema migrations applied:** 0. **No backend/API/CSS/index/worker/analysis-results/truths changes.**

### D-291 mini-arc: My HumanX Recent Truths prominence

This arc ran a product pass over the My HumanX owner dashboard (D-291A), identified that "Recent Truths" was buried after six dense sections in `renderMeHtml()`, and moved it immediately after the filter bar to improve post-submit owner visibility (D-291B). D-291C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-291A | Product pass (docs) | Full 19-question product pass over My HumanX as the post-submit Truth landing page. Key finding: "Recent Truths" panel was at the 12th position in `renderMeHtml()` — after Account card, Profile Settings, My Content counts, filter bar, Recent Claims, Belief Snapshots, Belief Mirror, Belief Reflection, and Reflection Avatar. An owner arriving from "Submit Truth for Review" (D-285B) had to scroll past all of these before seeing their just-submitted Truth. D-291B candidate: move "Recent Truths" above "Recent Claims". Docs only. Baseline unchanged: 3383/0/24/57. |
| D-291B | Frontend | `renderMeHtml()`: moved "Recent Truths" `<div class="panel">` block immediately after `${meFilterBarHtml()}`, before "Recent Claims". Added `<p class="small builder-field-note">Review: awaiting admin approval — goes Public when approved.</p>` inside the panel. 20 new D-291B tests; 2 existing tests updated (D-137E "section order", D-139B "Mirror placement") to reflect new order. Baseline 3383 → 3405. |
| D-291C | Live closeout | Owner deploy PASS (2026-07-02). 24/24 live sanity PASS. Deployed Worker version not captured. |
| D-292A | Checkpoint (docs) | Closes D-291 arc. No deploy. Baseline unchanged 3405/0/24/57. |

**D-291 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| `Recent Truths` position | Immediately after the filter bar — first content panel |
| `Recent Truths` before Recent Claims | Yes |
| `Recent Truths` before Belief Snapshots / Mirror / Reflection / Avatar | Yes |
| Review explanation copy | `"Review: awaiting admin approval — goes Public when approved."` present in Recent Truths panel |
| Yellow `Review` badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` unchanged |
| Data source | `GET /api/my-humanx` unchanged — no filter on `review_state`; all owner truths returned |
| `review_state='review'` on submission | Yes — `src/truths.js` unchanged |
| Admin Review gate | Unchanged — only admin `POST /api/review/decision` can approve |
| Public profile `/u/:slug` | Unaffected — `renderPublicProfileHtml()` not modified |
| Saved analysis separate from Truth submission | Yes — `saveAnalysisResult()` → `/api/analysis` only; unchanged |
| D-285B post-submit navigation | Preserved — `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')` all still call `renderMe()` + `tab-me`; toast unchanged |
| No backend/API/schema/CSS/index/worker changes in D-291 | Confirmed |

**Tests added in arc:** 20 new tests + 2 updated (3383 → 3405 total). **Deploys:** 1 (D-291B/C). **Schema migrations applied:** 0. **No backend/API/CSS/index/worker/analysis-results/truths changes.**

### D-293 mini-arc: My HumanX collapsible Profile Settings

This arc ran a product pass over My HumanX as a whole dashboard (D-293A), identified that Profile Settings was always-open and pushed the My Content counts / filter bar / Recent Truths area down on every returning-owner visit after initial setup, and fixed it by wrapping the editable controls in native HTML `<details>/<summary>` (D-293B). D-293C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-293A | Product pass (docs) | Full 15-question product pass over My HumanX as a whole dashboard. Conclusion: page is well-ordered post-D-291B; one remaining friction — Profile Settings form is always-open between the Account card and the My Content counts/filter/activity area. Expanding and re-collapsing via `<details>/<summary>` identified as smallest safe fix. Docs only. Baseline unchanged: 3405/0/24/57. |
| D-293B | Frontend | `meProfileSettingsHtml()`: replaced `<h3>Profile Settings</h3>` with `<details><summary>Profile Settings</summary>` wrapping all editable controls (toggle, slug, bio, preview, Save, Copy link). Account card in separate `meAccountCardHtml()` function is completely unaffected. 15 new D-293B tests. Baseline 3405 → 3424. |
| D-293C | Live closeout | Owner deploy PASS (2026-07-02). 27/27 live sanity PASS. Deployed Worker version not captured. |
| D-294A | Checkpoint (docs) | Closes D-293 arc. No deploy. Baseline unchanged 3424/0/24/57. |

**D-293 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Account card always visible | Yes — `meAccountCardHtml()` is a separate function/panel, not inside `<details>` |
| Profile Settings summary always visible | Yes — `<summary>Profile Settings</summary>` always rendered |
| Collapsed controls | Toggle, slug, bio, preview/guardrail, Save, Copy link — all inside `<details>` |
| Profile save behavior | Unchanged — `saveProfileSettingsUI` handler untouched |
| Public-link copy behavior | Unchanged — `meCopyProfileLink` handler untouched |
| `meUpdateProfilePreview()` wiring | Unchanged — still wired on toggle, slug, bio inputs |
| My Content counts | Immediately reachable without scrolling through form |
| Filter bar | Immediately reachable |
| Recent Truths | Still first content panel after filter bar |
| Review explanation | `"Review: awaiting admin approval — goes Public when approved."` unchanged |
| Yellow `Review` badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` unchanged |
| Public profile `/u/:slug` | Unaffected |
| No CSS, backend, schema, API, migration changes in D-293 | Confirmed |

**Tests added in arc:** 15 new tests (3405 → 3424 total). **Deploys:** 1 (D-293B/C). **Schema migrations applied:** 0. **No backend/API/CSS/index/worker/analysis-results/truths changes.**

### D-295 mini-arc: My HumanX profile setup nudge

This arc ran a product pass over whether My HumanX needed a "Needs attention" strip (D-295A), concluded that only one genuinely new signal existed — profile setup state — and implemented a narrow, self-clearing nudge (D-295B). D-295C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-295A | Product pass (docs) | Full 18-question product pass on whether My HumanX needs a "Needs attention" strip. Conclusion: a general count-based strip would duplicate My Content counts panel. Only useful signal: owner has never configured a public profile (no slug, not public). D-295B candidate classified frontend-only. Docs only. Baseline unchanged: 3424/0/24/57. |
| D-295B | Frontend | `renderMeHtml()`: added `profileNudge` const — conditional `<p>` rendered only when `!u.profile_public && !u.profile_slug`. Copy: "Set up your public profile: open Profile Settings, choose a slug, and switch your profile public when ready." Placed above Account card in template. 18 new D-295B tests; 7 existing slice-window widenings (D-137D ×2, D-137D/E ×2, D-137E ×2, D-139B, D-140B — preamble grew ~272 chars; all assertion logic unchanged). Baseline 3424 → 3442. |
| D-295C | Live closeout | Owner deploy PASS (2026-07-02). 27/27 live sanity PASS. Deployed Worker version not captured. |
| D-296A | Checkpoint (docs) | Closes D-295 arc. No deploy. Baseline unchanged 3442/0/24/57. |

**D-295 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Nudge condition | `!u.profile_public && !u.profile_slug` — both must be unset |
| Nudge self-clears | Yes — next `renderMe()` re-fetches `GET /api/my-humanx`; if slug set or `profile_public` true, `profileNudge === ''` |
| Nudge placement | Above Account card, below privacy intro paragraph |
| Nudge copy | `"Set up your public profile: open Profile Settings, choose a slug, and switch your profile public when ready."` |
| Not a general count-based strip | Yes — no pending Review count, no My Content count duplication |
| My Content counts panel | Unchanged — still renders all per-state chips via `meCountsRow()` |
| No dismiss state | Yes — no button, no JS state, no localStorage |
| Account card | Unchanged — `meAccountCardHtml()` called after `${profileNudge}` |
| Profile Settings | Unchanged — still `<details>/<summary>` (D-293B preserved) |
| Recent Truths | Still first content panel after filter bar (D-291B preserved) |
| Review explanation | `"Review: awaiting admin approval — goes Public when approved."` unchanged |
| Yellow `Review` badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` unchanged |
| `GET /api/my-humanx` data source | Unchanged |
| Public profile `/u/:slug` | Unaffected |
| No CSS, backend, schema, API, migration changes in D-295 | Confirmed |

**Tests added in arc:** 18 new tests + 7 slice-window widenings (3424 → 3442 total). **Deploys:** 1 (D-295B/C). **Schema migrations applied:** 0. **No backend/API/CSS/index/worker/analysis-results/truths changes.**

### D-297 mini-arc: Beta readiness Home Step 5 and My HumanX tab

This arc ran a beta readiness product pass (D-297A), concluded that the post-submit path was unguided for first testers, and implemented targeted copy and label fixes (D-297B). D-297C was the live closeout.

| Task | Type | What it did |
|------|------|-------------|
| D-297A | Product pass (docs) | Full 22-question beta readiness pass. Conclusion: inbound flow (Browse → Submit) is clear; the post-submit path (Review pending → My HumanX) is unguided. "Me" tab label does not communicate owner dashboard to a first tester. D-297B candidate classified frontend-only. Docs only. Baseline unchanged: 3462/0/24/57. |
| D-297B | Frontend | `renderHome()`: added Step 5 to the "Start here" strip — "Track Review: submitted Truths wait for admin approval and appear in My HumanX with a Review badge." `public/index.html`: renamed visible "Me" tab label to "My HumanX" (`id="tab-me"` and `setMode('me')` preserved). 18 new D-297B tests; 4 existing tests updated (label assertion + 3 slice-window widenings). Baseline 3442 → 3462. |
| D-297C | Live closeout | Owner deploy PASS (2026-07-02). 25/25 live sanity PASS. Deployed Worker version not captured. |
| D-298A | Checkpoint (docs) | Closes D-297 arc. No deploy. Baseline unchanged 3462/0/24/57. |

**D-297 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Home Step 5 copy | `"Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge."` |
| Step 5 explains admin approval | Yes |
| Step 5 directs to My HumanX | Yes |
| Step 5 mentions Review badge | Yes |
| Visible tab label | `My HumanX` |
| Internal tab id | `tab-me` — unchanged |
| Tab onclick | `setMode('me')` — unchanged |
| `renderMe()` | Unchanged |
| D-285B post-submit navigation | `renderMe()` / `tab-me` / toast — all preserved |
| Post-submit toast | `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| My HumanX data source | `GET /api/my-humanx` — unchanged |
| Review explanation | `"Review: awaiting admin approval — goes Public when approved."` — unchanged |
| Yellow Review badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` unchanged |
| Truth submission uses `review_state='review'` | Confirmed |
| No auto-publish | Confirmed |
| Admin Review only approval path | Confirmed |
| Public profile `/u/:slug` | Unaffected |
| Saved analysis | Private — unchanged |
| Draft Truth from analysis | Draft-only — unchanged |
| No CSS, backend, schema, API, migration changes in D-297 | Confirmed |

**Tests added in arc:** 18 new tests + 4 existing test updates (3442 → 3462 total). **Deploys:** 1 (D-297B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-299A: HumanX first beta tester script

Following the D-297 arc, D-299A produced a first beta tester script for Mike to use with one outside person: copy-paste tester start message, 11-step tester task list, 8 safe example claims, observation sheet, 10 post-test questions, success/failure criteria, next-action rules. Docs only — no deploy. Baseline unchanged 3462/0/24/57. Result: most invited testers did not respond or did not test; one outside tester likely submitted a real claim. This outcome is what motivated the D-300 arc below — HumanX cannot rely on a person walking a cold visitor through the app; it must demonstrate itself.

### D-300 mini-arc: Home static before/after demo card

This arc addressed the D-299A finding directly: since most invited testers do not respond, Home must show what HumanX *produces*, not just what it *is*, within the first 10–60 seconds for a cold visitor with no guide. D-300A audited the gap and recommended one static, clearly-labeled before/after demo card. D-300B implemented it, frontend-only. D-300C was the live closeout. A metadata-only correction recorded the deployed Worker version after the initial closeout understated it as "not captured."

| Task | Type | What it did |
|------|------|-------------|
| D-300A | Product pass (docs) | 23-question pass on making HumanX self-explanatory to a cold visitor in 30–60 seconds. Conclusion: Home shows pipeline categories but never a worked example of the pipeline producing output. D-300B candidate: static, clearly-labeled ("Example — not a real claim") before/after demo card in `renderHome()`. Classified frontend-only. Docs only. Baseline unchanged: 3462/0/24/57. |
| D-300B | Frontend | `renderHome()`: added one static demo card under the pipeline banner/Start Here strip, above the Actions card grid. Shows raw thought → structured claim → evidence/testability/survivability illustration → Review-state badge, doubly labeled "example only, not verified". Static markup only — no `data-action`, no `<button>`, no `fetch(`, no claim ID, no `/api/claims`/`/api/truths`/`/api/review` calls. Reused existing `cc-section`/`panel`/`small`/`badge`/`b-yellow` classes only — no CSS changes. 25 new tests + 3 pre-existing D-159B slice-window widenings (renderHome grew by 810 chars). Baseline 3462 → 3487. |
| D-300C | Live closeout | Owner deploy PASS. 35/35 live sanity PASS. Deployed Worker version `866886a0-691f-417b-bbe6-77a2dd8ca1f2` (corrected after initial closeout recorded "not captured"). |
| D-301A | Checkpoint (docs) | Closes D-300 arc. No deploy. Baseline unchanged 3487/0/24/57. |

**D-300 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Demo label | `Example — not a real claim` |
| Raw thought | `People share simple claims faster than they check them.` |
| Structured claim | `People are more likely to share a simple claim online before checking its evidence.` |
| Illustration mentions evidence | Yes — `Evidence: example only` |
| Illustration mentions testability | Yes — `Testability: high` |
| Illustration mentions survivability | Yes — `Survivability: unknown` |
| Explanation copy | `HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review.` |
| Review-state label | `Review — example only, not verified` |
| Demo is static-only | Confirmed — no `data-action`, no `<button>`, no `fetch(` |
| Demo creates no claim ID | Confirmed |
| Demo calls no `/api/claims`, `/api/truths`, or `/api/review` | Confirmed |
| Demo cannot submit, fetch, write, or pollute Review | Confirmed |
| Demo cannot be mistaken for verified truth | Confirmed — double explicit "example only" labeling |
| CSS changes | None — existing classes reused |
| Backend/API/schema/storage changes | None |
| Home Step 5 (D-297B) | Preserved — `"Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge."` |
| Visible tab label / internal id | `My HumanX` / `tab-me` — preserved |
| Public profile `/u/:slug` | Unaffected |
| Saved analysis | Private — unchanged |
| Draft Truth from analysis | Draft-only — unchanged |
| Drift/Belief expansion | Unaffected |

**Tests added in arc:** 25 new tests + 3 pre-existing D-159B slice-window widenings (3462 → 3487 total). **Deploys:** 1 (D-300B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-302 mini-arc: Home collapsed HumanX words glossary

This arc addressed the D-300A "next cold-visitor work" lane: with the demo card and Step 5 both live, D-302A audited whether real vocabulary gaps still existed. They did — My HumanX was never defined on Home, Truth vs. Claim was only connected in one deep Actions card, Evidence had only a 3-word pipeline tagline, and Review was named at Step 3 before being defined at Step 5. D-302B implemented a single collapsed glossary. D-302C was the live closeout. The implementation was frontend-only. No backend/API/schema changes. No public truth-state changes. No Review/moderation changes.

| Task | Type | What it did |
|------|------|-------------|
| D-302A | Product pass (docs) | 22-question pass. Conclusion: real vocabulary gaps remain. Evaluated the task's five suggested plain-English definitions rather than accepting them as-is — found the suggested Truth wording ("a claim approved for public display after Review") **inaccurate**: it inverts HumanX's actual Truth→Claim conversion direction and contradicts existing Truth-card copy; corrected wording provided. D-302B candidate: collapsed `<details>/<summary>` "HumanX words" glossary below the demo card, above Actions. Classified frontend-only. Docs only. Baseline unchanged: 3487/0/24/57. |
| D-302B | Frontend | `renderHome()`: added one collapsed `<details><summary>HumanX words</summary>` glossary, placed directly below the D-300 "See it work" demo card and above "Actions." Five one-line definitions (Claim, Truth, Review, Evidence, My HumanX) using the corrected D-302A wording — not the inaccurate suggested Truth wording. Collapsed by default — no `open` attribute. Reused existing `cc-section`/`panel`/`small` classes only — no CSS changes. 28 new tests + 3 pre-existing D-159B slice-window widenings (renderHome grew by 666 chars). Baseline 3487 → 3515. |
| D-302C | Live closeout | Owner deploy PASS. 36/36 live sanity PASS. Deployed Worker version `3baab973-c299-4ee4-bb08-66a91f490e14` (corrected after initial closeout recorded "not captured"). |
| D-303A | Checkpoint (docs) | Closes D-302 arc. No deploy. Baseline unchanged 3515/0/24/57. |

**D-302 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Glossary summary | `HumanX words` |
| Glossary collapsed by default | Yes — no `open` attribute |
| Glossary placement | Below `Example — not a real claim` (D-300 demo label), above the Home Actions section |
| Claim definition | "Something someone says might be true — testable, and open to evidence." |
| Truth definition | "A belief people repeat as fact — recorded here, not proven here. It can be turned into a testable claim." |
| Review definition | "Admin approval before it can go public — not automatic proof." |
| Evidence definition | "Reasons or sources that support or challenge a claim." |
| My HumanX definition | "Your private dashboard — your submissions, saved analysis, profile, and Review status." |
| Review defined as admin approval, not proof/verification | Confirmed |
| Evidence defined as support/challenge language, not magic verification | Confirmed |
| My HumanX defined as private/owner dashboard | Confirmed |
| Inaccurate Truth wording (`a claim approved for public display after Review`) | Confirmed absent from `app-v10.js` |
| CSS changes | None — existing classes reused |
| Backend/API/schema/storage changes | None |
| D-300 demo card (label, explanation, Review label) | Preserved — untouched |
| D-297 Home Step 5 | Preserved — untouched |
| Visible tab label / internal id | `My HumanX` / `tab-me` — preserved |
| Public profile `/u/:slug` | Unaffected |
| Saved analysis | Private — unchanged |
| Draft Truth from analysis | Draft-only — unchanged |
| Drift/Belief expansion | Unaffected |

**Tests added in arc:** 28 new tests + 3 pre-existing D-159B slice-window widenings (3487 → 3515 total). **Deploys:** 1 (D-302B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-304 mini-arc: First outside submission Review intake protocol/log

D-299A's tester script produced one confirmed real result: most invited testers did not respond, but one outside person likely submitted a real claim through the Builder flow, and it landed correctly in Review. This arc is a process arc, not a code arc — it establishes how Mike should look at that submission (and future ones) as product feedback first, publishable content second, without weakening or bypassing the Review gate. No app/backend/API/schema/storage changes anywhere in this arc.

| Task | Type | What it did |
|------|------|-------------|
| D-304A | Process protocol (docs) | Full intake protocol: what to record per Review item (claim, submitter, date, source path, evidence, wording clarity, real-vs-junk read); a do-not-publish-first rule; six classification categories (Real useful claim / needs better evidence / too vague / test-junk / sensitive-high-risk / duplicate-old-internal-test) each mapped to an action using only the existing Approve/Reject/Keep Pending decision set; the first known submission classified; 7 tester follow-up questions; safety boundaries reconfirmed; a reusable one-page intake table; next-action rules (wait for a 3-submission pattern; no features from one item; no queue-padding approvals). Docs only. Baseline unchanged: 3515/0/24/57. |
| D-304B | Process log (docs) | Seeded row #1 of the intake table with the first confirmed outside submission (claim, submitter `anon-rtpuo3`, source Builder/CLAIM/REVIEW, dates from screenshot, category, action, product lesson, follow-up question). Docs only. Baseline unchanged: 3515/0/24/57. |
| D-305A | Checkpoint (docs) | Closes D-304 arc. No deploy. Baseline unchanged 3515/0/24/57. |

**D-304 guarantees (process, not code):**

| Guarantee | Value |
|-----------|-------|
| First outside submissions must not be auto-approved | Confirmed — do-not-publish-first rule |
| Review queue is intake/learning before it is a publishing decision | Confirmed |
| Borderline useful submissions stay in Review until wording/evidence/public meaning are safe | Confirmed |
| Do not approve borderline claims just to make public feed look active | Confirmed — explicit next-action rule |
| Wait for at least 3 outside submissions before drawing pattern conclusions | Confirmed |
| Create a product pass only if repeated confusion appears | Confirmed |
| Do not add features from one odd submission | Confirmed |
| Do not publish sensitive/political/medical/legal/financial claims casually | Confirmed — "Sensitive/high-risk" category exists specifically for this |
| Review remains admin approval, not proof | Confirmed — unchanged from D-302B glossary/D-297 Step 5 wording |
| Approval is not automatic verification | Confirmed |
| Saved analysis remains private | Confirmed — unchanged |
| Anonymous/beta tester submissions are not exposed beyond normal app behavior | Confirmed — intake-table notes are Mike's own offline record, never added to any public route |
| First logged submission | "People who drive fast/expensive cars are less generous to other drivers and pedestrians..." — submitter `anon-rtpuo3`, source Builder/CLAIM/REVIEW, category Real useful claim / needs better evidence, action "Keep in Review; do not approve yet" |

**Tests added in arc:** 0 (process/log docs only). **Deploys:** 0. **Schema migrations applied:** 0. **No app/backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-306 mini-arc: Belief Engine intro static output preview

This arc audited the Belief Engine (`public/apps/humanx-belief-engine/index.html`, standalone hard-redirect app) end to end, found its safety framing already strong with zero boundary violations, and identified one real gap: cold visitors were asked to invest 10–12 minutes across 77 statements with no visible preview of the output — the same shape of problem D-300A found (and D-300B fixed) on Home. D-306B implemented the recommended static preview, frontend-only. D-306C was the live closeout. D-306D corrected the deployed Worker version and resolved a GitHub push discrepancy. No backend/API/schema changes anywhere in this arc.

| Task | Type | What it did |
|------|------|-------------|
| D-306A | Product pass (docs) | Full audit of Belief Engine and its connected belief-flow (Belief Engine → Drift → My HumanX → promote-to-Claim/Truth). 5 entry points found, all converging on the same hard redirect. Zero safety-boundary violations found. Main gap: no worked-example output before the 77-statement commitment. Secondary findings (not bundled): Home's Belief Engine card compresses the real Drift-then-promote path; `buildBeliefSnapshot()`/`classifyBelief()`/`beliefPreview()` in `app-v10.js` are dead stubs; no persistent back-to-HumanX link exists inside Belief Engine until the end of results. D-306B candidate: static "Example — not your result" preview on the intro screen. Classified frontend-only. Docs only. Baseline unchanged: 3515/0/24/57. |
| D-306B | Frontend | Added one static preview card to `#screen-intro` in `public/apps/humanx-belief-engine/index.html`, placed after the intro-stats row and before the "Begin Mapping" button. Label "Example — not your result"; intro line, "Profile Snapshot" mini-label, three illustrative rows (Strong signal / Pressure check / Next step), and a boundary line ("not a diagnosis, verdict, or proof"). Static-only — no button/onclick/fetch/localStorage/sessionStorage/Claim-Truth-RunPack creation. Reused existing `.panel`/`.compact-panel` classes only — no CSS changes. 20 new tests in `scripts/belief-engine-static-check.mjs`. Belief static baseline 24 → 44. `scripts/hardening-smoke-test.mjs` intentionally not touched (tracks main-app files only, not the standalone Belief Engine file). |
| D-306C | Live closeout | Owner deploy PASS. 34/34 live sanity PASS. |
| D-306D | Metadata correction | Deployed Worker version corrected to `1025ccf7-5953-448f-817c-2b229c525a0d` (was recorded "not captured"). GitHub push discrepancy (local ahead of origin) resolved — confirmed push range `0a54f93..5a30671 main -> main`. Docs only. |
| D-307A | Checkpoint (docs) | Closes D-306 arc. No deploy. Baseline unchanged 3515/44/57. |

**D-306 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Preview label | `Example — not your result` |
| Preview intro line | `After the questions, Belief Engine gives you a mirror-style snapshot like this.` |
| Preview includes | `Profile Snapshot`, `Strong signal` / `You prefer beliefs that can be tested`, `Pressure check` / `social pressure`, `Next step` / `Turn one belief into a clearer claim` |
| Boundary line | `This is not a diagnosis, verdict, or proof — it is a reflection aid.` |
| Preview appears before the 77-statement flow | Confirmed — positioned before `startQuiz()`/"Begin Mapping" |
| Preview is static-only | Confirmed — no button, no onclick, no fetch, no save/write behavior |
| No localStorage/sessionStorage behavior | Confirmed |
| No Claim/Truth/RunPack creation | Confirmed |
| No bridge/session behavior added | Confirmed — `humanx-bridge.js` untouched |
| Existing 77-statement flow, scoring, result generation | Unchanged |
| Existing bridge/export behavior | Unchanged |
| Existing `No diagnosis.` copy | Preserved |
| Existing `Use it as a mirror, not a verdict.` copy | Preserved |
| No diagnosis/proof/verdict claim introduced | Confirmed |
| No user labelled irrational/broken/extremist/unsafe | Confirmed |
| CSS changes | None — existing classes reused |
| Backend/API/schema/storage changes | None |
| Deployed Worker version | `1025ccf7-5953-448f-817c-2b229c525a0d` |

**Tests added in arc:** 20 new belief-engine checks (24 → 44 total). **Deploys:** 1 (D-306B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-308 mini-arc: Belief Engine safe Back to HumanX links

This arc addressed the D-306A secondary finding (deferred at the time): Belief Engine had no in-tab exit path back to HumanX across most of its screens. D-308A audited exactly which screens are safe to add a link to, based on a concrete technical finding — `saveRunRecord()` only persists quiz answers once, at full completion, with no incremental autosave — so a link on the active quiz/timeline screens would risk real progress loss. D-308B implemented the link on the two provably safe screens only. D-308C was the live closeout. No backend/API/schema changes anywhere in this arc.

| Task | Type | What it did |
|------|------|-------------|
| D-308A | Product pass (docs) | 22-question navigation audit. Confirmed zero `<header>`/`<nav>` elements anywhere in the Belief Engine file; all screen transitions are internal-only; the only existing exits are three `target="_blank"` links at the very bottom of results. Found `saveRunRecord()` fires exactly once, in `finishQuiz()`, with no incremental autosave — so a back-link is only safe on `screen-intro` (no answers yet) and `screen-results` (already saved). D-308B candidate: `← Back to HumanX` link (→ `/`) on those two screens only. Classified frontend-only. Docs only. Baseline unchanged: 3515/0/44/57. |
| D-308B | Frontend | Added `<a href="/" style="...">← Back to HumanX</a>` as the first element inside `screen-intro` and `screen-results` in `public/apps/humanx-belief-engine/index.html`. Intentionally absent from `screen-identity`, `screen-timeline`, `screen-quiz`. No CSS changes — inline styles only, matching the file's existing ad hoc pattern. 13 new tests in `scripts/belief-engine-static-check.mjs`, each scoped to a single screen via string slices bounded by adjacent `id="screen-*"` markers. Belief static baseline 44 → 57. |
| D-308C | Live closeout | Owner deploy PASS. 34/34 live sanity PASS. Deployed Worker version not captured. |
| D-309A | Checkpoint (docs) | Closes D-308 arc. No deploy. Baseline unchanged 3515/57/57. |

**D-308 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Intro screen link | `← Back to HumanX` present |
| Results screen link | `← Back to HumanX` present |
| Both links point to | `/` |
| Identity screen | Link absent — confirmed |
| Timeline screen | Link absent — confirmed |
| Quiz screen | Link absent — confirmed |
| Full HumanX nav added | No |
| Progress-loss confirmation dialog added | No |
| Existing 77-statement flow, scoring, result generation | Unchanged |
| Existing bridge/export behavior | Unchanged |
| `saveRunRecord()` behavior | Unchanged |
| Claim/Truth/RunPack creation from links | None — verified absent near both links |
| fetch/write/save behavior from links | None |
| D-306B preview (`Example — not your result`) | Preserved |
| `No diagnosis.` copy | Preserved |
| `Use it as a mirror, not a verdict.` copy | Preserved |
| D-306B boundary line (`not a diagnosis, verdict, or proof`) | Preserved |
| No diagnosis/proof/verdict claim introduced | Confirmed |
| No user labelled irrational/broken/extremist/unsafe | Confirmed |
| CSS changes | None — inline styles only |
| Backend/API/schema/storage changes | None |

**Tests added in arc:** 13 new belief-engine checks (44 → 57 total). **Deploys:** 1 (D-308B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-310 mini-arc: Belief Engine results Review handoff sentence

This arc addressed the D-309A "result-page HumanX handoff clarity" narrow candidate. D-310A audited the results page and found it already had a working "What to Test Next" next-step section — so no new card was needed — but that the word "Review" (the actual admin approval gate) never appeared anywhere in the entire Belief Engine file. D-310B closed exactly that gap with one added sentence, reusing the D-302 glossary's Review wording. D-310C was the live closeout. D-310D corrected a GitHub push-status discrepancy (docs-only, no implementation change). No backend/API/schema changes anywhere in this arc.

| Task | Type | What it did |
|------|------|-------------|
| D-310A | Product pass (docs) | 22-question audit. Corrected its own framing: a "next in HumanX" card already exists ("What to Test Next," pre-existing) — no duplicate needed. Real gap: "Review" never appears anywhere in the file. Secondary finding: results copy doesn't reuse the D-306B "Turn one belief into a clearer claim" phrase. Secondary finding flagged but out of scope: `humanx-bridge.js`'s injected note says "your own review" (lowercase), which could be misread as the admin gate — deferred to a future bridge-copy-precision pass. Zero safety-boundary violations found. D-310B candidate: one sentence added to the existing "What to Test Next" paragraph. Classified frontend-only. Docs only. Baseline unchanged: 3515/0/57/57. |
| D-310B | Frontend | Added `<p>If you turn one belief into a HumanX claim, public display still waits for Review — admin approval, not automatic proof.</p>` as a second paragraph inside `.result-next-section` in `public/apps/humanx-belief-engine/index.html`, after the existing paragraph and before the three next-action links. No new card, no link/button changes, no bridge changes. No CSS changes — reused the section's existing paragraph styling. 21 new tests in `scripts/belief-engine-static-check.mjs`. Belief static baseline 57 → 78. |
| D-310C | Live closeout | Owner deploy PASS. 35/35 live sanity PASS. Deployed Worker version not captured. |
| D-310D | Metadata correction | Corrected a GitHub push-status discrepancy noted at D-310C closeout (local ahead of origin) — resolved after the owner's subsequent push; confirmed via `git ls-remote`. Docs only. |
| D-311A | Checkpoint (docs) | Closes D-310 arc. No deploy. Baseline unchanged 3515/78/57. |

**D-310 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| "What to Test Next" section count | Exactly one — no duplicate card |
| Review handoff sentence | `"If you turn one belief into a HumanX claim, public display still waits for Review — admin approval, not automatic proof."` |
| Sentence mentions Review | Confirmed |
| Sentence says admin approval | Confirmed |
| Sentence says not automatic proof | Confirmed |
| Sentence implies Review is verification | No — explicitly negated |
| Sentence implies snapshot is public Truth | No |
| Existing three results links (`#claims`/`#submit`/`#truths`) | Unchanged |
| Bridge/export behavior (`humanx-bridge.js`) | Unchanged |
| Claim/Truth/RunPack creation from the sentence | None — verified absent |
| fetch/write/save behavior from the sentence | None |
| Existing 77-statement flow, scoring, result generation | Unchanged |
| D-308B `← Back to HumanX` results link | Preserved — present on intro/results only |
| Back link absent from identity/timeline/quiz | Confirmed |
| `No diagnosis.` copy | Preserved |
| `Use it as a mirror, not a verdict.` copy | Preserved |
| D-306B boundary line (`not a diagnosis, verdict, or proof`) | Preserved |
| No diagnosis/proof/verdict claim introduced | Confirmed |
| No user labelled irrational/broken/extremist/unsafe | Confirmed |
| CSS changes | None |
| Backend/API/schema/storage changes | None |
| Deployed Worker version | Not captured |

**Tests added in arc:** 21 new belief-engine checks (57 → 78 total). **Deploys:** 1 (D-310B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift changes.**

### D-312 mini-arc: Belief Engine Export & Share Drift/Review copy

This arc addressed the D-311A "bridge-copy precision" narrow candidate. D-312A audited the results-page bridge/export wording across its three copy surfaces (the static Export & Share paragraph, `humanx-bridge.js`'s injected note, and its post-click alert) and found the static paragraph said the snapshot saves "to your session" — vague, and inconsistent with the rest of the app's "Drift" vocabulary — and never mentioned Review. Two deeper findings inside `humanx-bridge.js` itself (a "your own review" vs. capitalized-Review terminology collision, and a "Saved:" list that undersells the actual payload) were explicitly deferred, not fixed, since touching `humanx-bridge.js` was out of scope for this arc. D-312B tightened only the static paragraph. D-312C was the live closeout. D-312D corrected a GitHub push-status discrepancy (docs-only, no implementation change). No backend/API/schema changes, and no `humanx-bridge.js` changes, anywhere in this arc.

| Task | Type | What it did |
|------|------|-------------|
| D-312A | Product pass (docs) | 22-question audit of bridge/export copy. Found the static Export & Share paragraph vague ("to your session") and silent on Review. Deferred two `humanx-bridge.js`-internal findings (terminology collision, incomplete "Saved:" list) to a separate, explicitly-scoped bridge-script pass. Zero safety-boundary violations found. D-312B candidate: tighten the static paragraph only. Classified frontend-only copy/tests. Docs only. Baseline unchanged: 3515/0/78/57. |
| D-312B | Frontend | Replaced `"to your session"` with `"to your Drift"` and appended `"Saving to Drift does not publish a Truth; any public display still waits for Review."` inside the existing static `<p>` in the "Export & Share" section of `public/apps/humanx-belief-engine/index.html`. No new card, no link changes, `humanx-bridge.js` untouched. No CSS changes. 26 new tests in `scripts/belief-engine-static-check.mjs`. Belief static baseline 78 → 104. |
| D-312C | Live closeout | Owner deploy PASS. 39/39 live sanity PASS. Deployed Worker version not captured. |
| D-312D | Metadata correction | Corrected a GitHub push-status discrepancy noted at D-312C closeout (local ahead of origin) — resolved after the owner's subsequent push; confirmed via `git ls-remote`. Docs only. |
| D-313A | Checkpoint (docs) | Closes D-312 arc. No deploy. Baseline unchanged 3515/104/57. |

**D-312 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| Export & Share paragraph (exact) | `"Download or copy your pressure map. \"Send to HumanX\" saves a snapshot to your Drift — it does not publish anything automatically. Saving to Drift does not publish a Truth; any public display still waits for Review."` |
| "session" wording replaced with "Drift" | Confirmed — `"your session"` no longer appears anywhere in the file |
| Review/public-display reinforcement added | Confirmed |
| No new "Export & Share" card | Confirmed — exactly one occurrence |
| Existing three "What to Test Next" links | Unchanged |
| `humanx-bridge.js` | Untouched — confirmed via preserved-content tests |
| Bridge/export behavior | Unchanged |
| Claim/Truth/RunPack creation from the new copy | None |
| fetch/write/save behavior beyond existing bridge behavior | None |
| Existing 77-statement flow, scoring, result generation | Unchanged |
| D-310B Review handoff sentence | Preserved verbatim |
| D-308B `← Back to HumanX` links | Preserved — present on intro/results only |
| Back link absent from identity/timeline/quiz | Confirmed |
| D-306B preview and safety copy (`No diagnosis.`, `mirror not a verdict`, boundary line) | Preserved |
| No diagnosis/proof/verdict claim introduced | Confirmed |
| No user labelled irrational/broken/extremist/unsafe | Confirmed |
| CSS changes | None |
| Backend/API/schema/storage changes | None |
| Deployed Worker version | Not captured |

**Tests added in arc:** 26 new belief-engine checks (78 → 104 total). **Deploys:** 1 (D-312B/C). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift/bridge changes.**

### D-313 mini-arc: Belief Engine abandoned quick-record stubs cleanup

This arc addressed the last remaining narrow Belief Engine candidate named at D-313A: the abandoned "quick record" stub cluster first flagged in D-306A. D-313B audited and confirmed the cluster was truly dead. D-313C locked that confirmed-dead state with regression tests before allowing removal, per this arc's own explicit gate ("do not remove unless tiny, frontend-only, dead, and test-covered"). D-313D performed the removal once all four gating conditions were met. This is a hardening-suite arc, not a belief-engine-static-check arc — the stub cluster lived in `public/app-v10.js`, not the standalone Belief Engine file. No backend/API/schema changes anywhere in this arc.

| Task | Type | What it did |
|------|------|-------------|
| D-313A | Checkpoint (docs) | Closed the prior D-312 (Export & Share Drift/Review copy) arc. Named the abandoned quick-record stubs as the sole remaining narrow Belief Engine candidate. No deploy. Baseline unchanged 3515/104/57. |
| D-313B | Audit (docs) | Located the exact six-item dead cluster (`n`, `v`, `buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror`) in `public/app-v10.js` lines 148–152. Confirmed via direct inspection of all four action-dispatch maps and `public/index.html` that none are reachable. Confirmed no Claim/Truth/RunPack/Drift/Review/backend behavior. Found zero test coverage. Recommended a test lock before removal. Docs only. Baseline unchanged: 3515/0/104/57. |
| D-313C | Tests | Added 14 regression tests to `scripts/hardening-smoke-test.mjs` locking the confirmed-dead state: dispatch-map absence, `n`/`v` call-site absence, `index.html` absence, exact stub-body verbatim locks, no fetch/API/backend reference, no Claim/Truth/RunPack/Review creation path, and preservation of the real `isFullBeliefProfile`/`beliefSnapshotCard`/`belief-drift-expansion.js` display logic, plus a control check on the real neighboring `promoteBelief`. Hardening baseline 3515 → 3529. |
| D-313D | Frontend cleanup — **deployed, confirmed live in D-313F** | Deleted the five dead lines and the two stray `window.beliefPreview`/`window.saveBeliefMirror` exports from `public/app-v10.js`. `promoteBelief()` and its export left untouched. Converted D-313C tests 8–10 from "body matches audited text" to "no longer exists" / "export removed"; tests 1–7 and 11–14 unchanged and still passing. Test count unchanged at 14. Baseline unchanged 3529/104/57 (a zero-risk, test-covered deletion). |
| D-313E | Checkpoint (docs) | Closes D-313 code arc. No deploy. Baseline unchanged 3529/104/57. |
| D-313F | Live closeout — no deploy needed | Read-only fetch of live `https://humanx.rinkimirikata.com/app-v10.js` confirmed all six removed stub names (`n`, `v`, `buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror`) absent, `promoteBelief`/`window.promoteBelief` and `isFullBeliefProfile`/`beliefSnapshotCard` present, and live content byte-identical (ignoring CRLF/LF) to local `d422985` `public/app-v10.js`. No code changed. Baseline reconfirmed unchanged 3529/104/57 (1 known warn). |

**D-313 guarantees (live):**

| Guarantee | Value |
|-----------|-------|
| `n(id)`, `v(id)` | Removed — no longer defined anywhere |
| `buildBeliefSnapshot()` | Removed — no longer defined anywhere |
| `classifyBelief()` | Removed — no longer defined anywhere |
| `beliefPreview()` | Removed — no longer defined, `window.beliefPreview` export also removed |
| `saveBeliefMirror()` | Removed — no longer defined, `window.saveBeliefMirror` export also removed |
| `promoteBelief()` | Untouched — confirmed by diff and by regression test |
| `window.promoteBelief=promoteBelief` | Untouched — confirmed present by regression test |
| `isFullBeliefProfile` | Untouched — live, tested labeling logic |
| `beliefSnapshotCard` | Untouched — live, tested card-rendering logic |
| `belief-drift-expansion.js` "quick record" badge | Untouched — live display logic |
| Backend/API/D1/schema/storage/auth/migration changes | None |
| Test count in D-313C/D block | Unchanged — 14 (3 converted in purpose, not added) |
| Hardening baseline | 3515 → 3529 (test-lock addition in D-313C; unchanged through D-313D/D-313F) |
| Deploy status | **Confirmed live** — D-313F read-only fetch verified `public/app-v10.js` deployed and matching local `d422985` |

**Tests added in arc:** 14 new hardening-suite checks (3515 → 3529 total). **Deploys:** 1, confirmed live (D-313D — `public/app-v10.js` changed; D-313F closed out live confirmation on 2026-07-09). **Schema migrations applied:** 0. **No backend/API/CSS/worker/analysis-results/truths/belief-drift/bridge changes.**

### D-274→D-275 RunPack provenance behavior (post D-274B + D-275D)

| Feature | Behavior |
|---------|---------|
| **F-4 snapshot-hash stale check** | **`detectPacketStaleness()` checks `meta.source_snapshot_hash`** — `if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('claim updated since packet')` (D-279B: was `'source snapshot changed'`) |
| Guard against old packets | `source_snapshot_hash != null` guard — no false positives for packets without the field |
| Stale reason | `'claim updated since packet'` appended to stale chip (D-279B; was `'source snapshot changed'`) |
| For fallback packets | Exact comparison (same `simpleClaimHash` algorithm used at generation) |
| For backend packets | Coarser comparison — may miss content edits that don't change counts (known acceptable limitation) |
| **F-5 packet-ID storage** | **`analysis_results.packet_id TEXT` live** — nullable; populated when `saveAnalysisResult()` has a matching `lastPacket` |
| Frontend source | `JSON.parse(lastPacket).packet_id` — from session packet, NOT from AI return JSON |
| Frontend gate | `lastPacket && lastPacketClaimId === selected?.id` — prevents stale cross-claim ID |
| Backend sanitizer | `cleanText(body.packet_id \|\| '', 80) \|\| null` — NOT `cleanId()` (preserves `rp_*` underscores) |
| Historical rows | `packet_id = NULL` — no data loss; existing saves unaffected |
| `mapAnalysis()` return | `packetId: a.packet_id \|\| null` |
| `packet_id` in `GET /api/claims/:id` | Present in `analyses` array — non-sensitive metadata identifier |
| Public profile exposure | None — `loadPublicProfileSummary` never calls `listAnalysisForClaim` |
| Advisory mismatch toast | Unchanged — still non-blocking |

### Current RunPack fallback packet behavior (post D-268B)

| Feature | Behavior |
|---------|---------|
| Backend packet `instruction` | Included by `buildRunPack()` (worker.js) — unchanged |
| Backend packet `output_contract` | Included by `buildRunPack()` (worker.js) — unchanged |
| **Fallback packet `instruction`** | **Now included** (D-268B) — "Analyse this claim using only the provided packet and your own reasoning. Do not assume a claim is true because it is emotionally important. Do not dismiss a claim only because it is unpopular. Do not claim independent verification." |
| **Fallback packet `output_contract`** | **Now included** (D-268B) — verdict, plain_language_summary, evidence_score, testability, survivability, strongest_support, strongest_pressure, missing_tests, limitations, ai_provenance_note. "Do not invent evidence not present in the packet." |
| Fallback `is_fallback:true` | Preserved — fallback always flagged |
| Fallback payload | `safeRunPackClaim(selected)` — D-171B lock preserved |
| **Generated-time row** | **New** (D-268B) — `rp-summary-generated small` row, e.g. "Generated just now" / "Generated 12 min ago" / "Generated 2h ago"; conditional on `lastPacketMeta.generated_at`; appears before status chip |
| `rpRelativeTime()` helper | Defined; returns `just now` / `X min ago` / `Xh ago` / `Xd ago` |
| Evidence/pressure/test counts row | Unchanged — always shown |
| Stale warning chip | Unchanged — fires from `detectPacketStaleness()` |
| Stale threshold | Unchanged — `3600000ms` (1h) |
| Source-snapshot-hash stale check | **Added (D-274B), wording updated (D-279B)** — `if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('claim updated since packet')` |
| "Load AI Analysis Return" visibility | **Fixed (D-271A)** — `rp-return-section` auto-expands when `lastPacket&&lastPacketClaimId===selected?.id` |
| Packet-ID storage with analysis | **Added (D-275D live)** — `analysis_results.packet_id` column live; `saveAnalysisResult()` includes `packet_id` from `lastPacket` |
| `saveAnalysisResult()` parsing | Unchanged — JSON.parse validation; `parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed` |
| `packet_id` mismatch check | Advisory-only non-blocking toast — unchanged |
| Public truth state | Unchanged — analysis save does not change review_state |
| Review/moderation | Unchanged |
| Public profile | `generateRunPack` + `saveAnalysisResult` absent from `renderPublicProfileHtml` |

---

## Duplicate/similar filter current behavior (post D-256)

| Feature | Behavior |
|---------|---------|
| Visible combined filter label | `Dupes + Similar` (updated D-256B) |
| Combined filter internal key | `duplicate` (unchanged — `reviewStateFilter === 'duplicate'`) |
| Combined filter predicate | `duplicate_of \|\| duplicateOf \|\| near_duplicate_of \|\| nearDuplicateOf` (unchanged) |
| Combined filter scope | Confirmed duplicates (`duplicate_of`) AND near-duplicate advisories (`near_duplicate_of`) |
| `~Similar` label | `~Similar` (unchanged) |
| `~Similar` predicate | `near_duplicate_of` only (unchanged) |
| `~Similar` scope | Advisory-only; strict subset of `Dupes + Similar` |
| Helper copy | `Dupes + Similar includes confirmed duplicates and near-duplicate advisories.` |
| Empty-state copy | `No confirmed duplicates or similar advisories in this view.` + context note |
| Card badge (near_duplicate_of) | `<span class="badge b-similar">~similar</span>` (unchanged) |
| Card chip (duplicate_of) | `<span class="rc-chip rc-chip-dup">dup</span>` (unchanged) |
| Card CSS modifier | `review-card-similar` on `near_duplicate_of` items (unchanged) |
| Inspect panel fields | `Duplicate Of`, `Similar claim (advisory)`, `~similar` advisory banner (unchanged) |
| Action buttons | `Mark Duplicate...`, `Dismiss ~Similar`, `Use as duplicate target` (unchanged) |
| Modals | `markDuplicateUI` title "Mark as Duplicate"; `resolveSimilarUI` title "Dismiss Similar Advisory" (unchanged) |
| No filter split | Combined `Dupes + Similar` filter was NOT split — single predicate, single chip |
| Moderation semantics | Unchanged — advisory = advisory, confirmed duplicate = confirmed duplicate |

---

## Review search/filter current behavior (post D-250→D-254)

| Feature | Behavior |
|---------|---------|
| Active filter/sort summary | `renderReviewActiveSummary(list)` renders `Showing: {filter} · {n} item(s) · Sorted: {sort}` above card list; extended with `· Search: "{query}"` when search is active |
| Zero-results state | `renderReviewEmptyState()` renders `"No review items match this view."` title; context line shows current filter, sort, and search (when active); per-filter explanatory copy preserved; `"Show all review items"` button (when filter ≠ All); `"Clear search"` button (when search is active) |
| Ambiguous filter helper | `renderReviewFilterHelper()` renders one-line helper below active summary for `~Quality`, `Dupes`, and `~Similar` only; absent for all other filters |
| Helper copy locked | `~Quality` → `~Quality shows claim items with quality hints.` / `Dupes + Similar` → `Dupes + Similar includes confirmed duplicates and near-duplicate advisories.` / `~Similar` → `~Similar shows near-duplicate advisory items.` (updated D-256B) |
| Search input | `renderReviewSearchRow()` — label `"Search review queue"`, placeholder `"Search claim, ID, handle, source…"`, `type="search"`, delegated `input` event (no inline handlers) |
| Search pipeline | `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))` — filter first, then search, then sort |
| Fields searched | item ID, claim/statement/title, handle, category, type, duplicate_of, near_duplicate_of, user_id, origin, source_truth_id — case-insensitive, whitespace-trimmed |
| Clear search | `clearReviewSearch` in `_D181B_ZERO_PARAM_ACTIONS` — sets `reviewSearchQuery = ''` only; preserves filter and sort |
| Show all review items | Resets filter to All only; preserves sort and search |
| Search-aware next-item | `reviewDecisionUI` next-item candidate uses `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` |
| Search-aware inspect nav | `renderReviewInspectPanel` prev/next also uses the search-aware pipeline |
| No backend/API search | Search is 100% client-side — no route in `worker.js`; no `fetch`/`api()` call |
| No localStorage | `reviewSearchQuery` is session-only — not persisted across reload |

---

## Review mobile/control wrapping behavior (post D-258→D-259)

| Feature | Behavior |
|---------|---------|
| Sort bar isolation | `.review-sort-bar` has `display:flex;align-items:center;gap:6px;flex-wrap:wrap` — sort label + select form their own flex unit, separate from chip row |
| Sort label | `.review-sort-label` has `white-space:nowrap;flex-shrink:0` — "Sort:" text never wraps or shrinks |
| Sort select | `.review-sort-select` has `min-width:120px;max-width:180px;width:auto` — select cannot be crushed below 120px |
| Decision feedback wrapping | `.review-decision-feedback` has `flex-wrap:wrap` — feedback message + buttons wrap to new lines on narrow viewports |
| Feedback button protection | `.review-feedback-next` and `.review-feedback-dismiss` both have `flex-shrink:0` — buttons cannot be shrunk below text content; always remain readable/tappable |
| Feedback message safety | `.review-feedback-msg` has `min-width:0` — message text wraps safely inside the flex container |
| Empty-actions stacking | `.review-empty-actions` has `display:flex;flex-wrap:wrap;gap:6px;align-items:center` — "Clear search" and "Show all review items" buttons have consistent 6px gap and stack cleanly on narrow viewports |
| Search row | Unchanged — `renderReviewSearchRow()` renders normally; search input not affected by D-258B |
| Active summary | Unchanged — `renderReviewActiveSummary(list)` render path and copy preserved (D-250B lock) |
| Filter helper copy | Unchanged — `renderReviewFilterHelper()` exact copy preserved (D-252A/D-256B lock) |
| Empty-state copy/title | Unchanged — "No review items match this view." and all per-filter copy preserved (D-251A lock) |
| `Dupes + Similar` label | Unchanged — chip label, helper copy, empty-state copy all preserved (D-256B lock) |
| Review card head/meta/hints | Unchanged — all D-248A card metadata density behavior preserved |
| Search/filter/sort behavior | Unchanged — `applyReviewFilter`, `applyReviewSearch`, `applyReviewSort`, all predicates and sort keys unchanged |
| Next-item | Unchanged — `reviewDecisionFeedbackNextId` capture and display behavior unchanged (D-243A lock) |
| Inspect prev/next | Unchanged — `renderReviewInspectPanel` nav uses full pipeline `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` |
| Moderation actions | Unchanged — `reviewDecisionUI`, approve/keep/reject all unchanged; no auto-moderation |
| Duplicate/advisory semantics | Unchanged — `near_duplicate_of`, `duplicate_of`, advisory banner, Copy ID, Use as dup, Dismiss all unchanged |

---

## Review card current behavior (post D-245→D-248)

| Layer | Content |
|-------|---------|
| `.review-card-head` | type · state · ⚑ report · `~similar` · `truth-derived` · Builder — max 6 badges (was 9) |
| `.review-card-chips` | origin / handle / dup / locked chips — unchanged |
| `.review-reason-tag` | report reason — unchanged, conditional |
| `h3 .review-card-title` | claim text — unchanged |
| `p .review-card-meta` | category · status · `Evidence N · Test N · Survive N` · `Updated {age}` |
| `.review-card-hints` | `needs sharpening` · `category echo` · `? borderline origin` — conditional, opacity .75; absent when none apply |
| `.review-actions` | Inspect / Approve / Keep Pending / Reject — unchanged |

| Score label (old) | Score label (new, D-246A) |
|-------------------|-----------------------------|
| `ev:N ts:N sv:N` | `Evidence N · Test N · Survive N` |

Source fields (`evidence_score`, `testability`, `survivability`) and values unchanged.

---

## Review next-item flow current behavior (post D-242→D-243)

| Feature | Behavior |
|---------|---------|
| Post-Approve feedback | "Approved review item." banner; "Open next item →" button when a valid next item exists |
| Post-Reject feedback | "Rejected review item." banner; "Open next item →" button when a valid next item exists |
| Post-Keep-Pending feedback | "Kept review item." + Dismiss only; item stays open in inspect panel; no next-item button |
| "Open next item →" click | Clears feedback; calls `inspectReviewItem(nextId)`; scrolls to card via existing D-227B behavior |
| No auto-moderation | Button is navigation only — no `reviewDecisionUI`, no `fetch`/`api()` call |
| Last-item suppression | Button absent when no valid next item exists (e.g. last in queue or empty queue after decision) |
| Candidate capture | Derived from `applyReviewSort(applyReviewFilter(reviewQueue.review))` before `loadReviewQueue()` call |
| Post-reload validity | Candidate checked against fresh `reviewQueue.review` after reload — stale candidate suppresses button |
| Filter/sort respect | Next item follows current filter chip and sort order |
| Keyboard advance | `initReviewKb` A+A / R+R / K `_advanceId` auto-advance unchanged |
| Dismiss | Clears both `reviewDecisionFeedback` and `reviewDecisionFeedbackNextId` via `clearReviewDecisionFeedback()` |

---

## Drift/Belief expansion state (post upstream merge)

The upstream `belief-drift-expansion` branch was merged into main around D-242A. It added `public/belief-drift-expansion.js` and modified `public/index.html`. The D-242A fixup aligned the D-98B noscript smoke test with the new simplified noscript fallback. All subsequent Review lane tasks (D-242B, D-242C, D-243A, D-244A) left Drift/Belief files untouched.

**Rule:** Do not touch `public/belief-drift-expansion.js` or `public/index.html` during Review queue work unless a failing test requires a minimal, explicitly documented compatibility fix.

---

## Duplicate advisory current behavior (post D-233→D-237)

| Feature | Behavior |
|---------|---------|
| `near_duplicate_of` advisory | Advisory only — computed by backend; no automatic merge, no auto-submit; `duplicate_of` (explicit) and `near_duplicate_of` (advisory) remain separate concepts |
| Advisory banner | `<div class="review-similar-note">` with structured head row ("Similar claim advisory" label) + body ("Review manually before deciding — normal moderation actions still apply.") |
| Similar claim field | "Possible related claim: `clm_...`" — raw ID in `<code class="review-similar-id-code">` with `user-select:all` |
| Copy ID | `copySimilarClaimId(id)` — copies only raw claim ID via `navigator.clipboard?.writeText`; no backend, no `fetch`, no `localStorage`; toast "ID copied" / "Copy failed — select the ID manually" |
| Study link | `↗ Study` button opens the advisory claim in Study View (unchanged from D-11) |
| Use as duplicate target | Button calls `markDuplicateUI(claimId, nearDupId)` — opens existing mark-duplicate modal with canonical target field pre-filled; prefill note: "Prefills the duplicate form — does not mark anything by itself." |
| Explicit confirm | Mark-duplicate API call (`POST /api/review/mark-duplicate`) fires only inside `onConfirm`; moderator must click "Mark Duplicate"; cancel leaves queue unchanged |
| Dismiss advisory | `resolveSimilarUI` — `POST /api/review/resolve-similar`; does not approve/reject/merge; scrolls back to review item via `scrollToReviewAnchor(claimId)` after reload |
| Backward compat | Existing `Mark Duplicate...` button (one-arg caller) still works unchanged |

---

## Public profile current behavior (post D-220→D-225)

| Feature | Behavior |
|---------|---------|
| Page structure | Header → Counts card → Section nav → Snapshot → Claims → Truths → Evidence → Pressure → About |
| Counts card | Public Activity badge row (Claims/Truths/Evidence/Pressure); always before snapshot |
| Section nav | `<nav aria-label="Public profile sections">` — four HTML anchor links; Snapshot always present; pure anchors, no JS |
| Copy profile link | `pp-copy-link` button in header for all visitors; `copyPublicProfileLink` uses `window.location.href`; no backend, no localStorage |
| Snapshot empty state | `pp-empty-card` with `id="public-snapshot"` always emitted; "No public snapshot shared yet." + "Public sections appear here when shared." |
| Claims empty state | `pp-empty-card` — "No public claims yet." |
| Truths empty state | `pp-empty-card` — "No public truths on this profile yet." |
| About/context block | Native `<details id="public-about"><summary>About this profile page</summary>` |
| Claim action buttons | `pp-item-actions` wrapper; `View in HumanX →`, `Copy link`; focus-visible ring; mobile `min-height:44px` |
| Public allowlist | `PUBLIC_PROFILE_ALLOWED_MARKERS` contract active — deny-by-default for new classes/copy |

---

## Review queue current behavior (post D-227→D-230)

| Feature | Behavior |
|---------|---------|
| Selected-card anchor | `data-review-selected="true"` on inspected card; `scrollSelectedReviewCardIntoView()` fires via `requestAnimationFrame` after inspect panel scroll; stronger `.review-card-selected` ring + background |
| Scroll preservation | `withReviewScrollPreserved(fn)` wraps 9 pure local re-renders (filter, sort, four arm/cancel pairs, audit toggle); captures `window.scrollY`, restores via RAF |
| Inspect exclusion | `inspectReviewItem` excluded from `withReviewScrollPreserved` — D-227B card scroll wins |
| Confirm-state clarity | `data-review-confirming="reject\|approve\|cleanup"` on card article and inspect actions div when armed; `review-confirm-armed` on actions containers; `review-card-approve-pending` for approve armed (green, mirrors reject red) |
| Cleanup confirm styling | Neutral amber — `review-cleanup-confirm-msg`, `btn-cleanup-confirm` (not reusing reject-red classes) |
| Decision feedback banner | `role="status" aria-live="polite"` banner after successful decision: "Approved review item." / "Kept review item." / "Rejected review item."; Dismiss button (`type="button"`); does not steal focus |
| Moderation routes | `/api/review/decision` POST unchanged; approve → `'public'`, reject → `'rejected'`, keep → `'review'` |
| Keyboard shortcuts | A / R / K / [] / Esc — unchanged |
| Toast | Existing `toast()` still fires alongside banner |

---

## Privacy / public boundary state

| Surface | State | Locked by |
|---------|-------|-----------|
| Reflection Avatar | **Private only** — called exclusively from `renderMeHtml` | D-214A |
| Transparency "How this is formed" | **Private only** — inside `meReflectionAvatarHtml` | D-214A / D-215A |
| Hide/show control | **Device-local only** — `localStorage`; never sent to backend | D-214A / D-215A |
| Public profile allowlist | **Active** — `PUBLIC_PROFILE_ALLOWED_MARKERS` / `PUBLIC_PROFILE_PRIVATE_DENYLIST` | D-216A |
| My HumanX private helpers | **Excluded from public render** — `meMirrorHtml`, `meBeliefReflectionHtml`, `meAccountCardHtml`, `meProfileSettingsHtml`, `meReflectionAvatarHtml` | D-215A |
| Public avatar / private preference exposure | **Blocked** — no backend field, no API route, no public render call | D-214A + D-215A + D-216A |
| `top_beliefs_json` | **Permanently private** — never in any public API response | D-216A |
| `alignment_labels` | **Permanently disabled** — never enabled in any UI | D-214A |
| D-220→D-224 polish arc | **Locked** — cross-arc composite regression tests | D-225A |
| No new public data fields in D-220→D-225 | **Confirmed** — zero new API fields | D-225A |
| Review queue markers in public profile | **Blocked** — `data-review-selected`, `withReviewScrollPreserved`, `review-confirm-armed`, `data-review-confirming`, decision-feedback copy/classes, and all review moderation controls confirmed absent from `renderPublicProfileHtml` | D-231A |
| No new public data fields in D-227→D-231 | **Confirmed** — zero new API/schema fields | D-231A |
| Duplicate advisory markers in public profile | **Blocked** — `copySimilarClaimId`, `markDuplicateUI`, `resolveSimilarUI`, "Similar claim advisory", "Use as duplicate target", prefill CSS classes, and all review advisory internals confirmed absent from `renderPublicProfileHtml` | D-237A |
| No new public data fields in D-233→D-237 | **Confirmed** — zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-237A |
| Review-to-Study internals in public profile | **Blocked** — `openReviewClaimStudy`, `backToArena`, `lastModeBeforeStudy`, `lastInspectedReviewItemId`, and "← Back to Review" confirmed absent from `renderPublicProfileHtml` | D-240A |
| No new public data fields in D-239→D-240 | **Confirmed** — zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-240A |
| Next-item internals in public profile | **Blocked** — `reviewDecisionFeedbackNextId`, `review-feedback-next`, and "Open next item" confirmed absent from `renderPublicProfileHtml` | D-243A |
| No new public data fields in D-242→D-243 | **Confirmed** — zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-243A |
| Review card metadata markers in public profile | **Blocked** — `review-card-hints`, `review-card-head`, `review-card-meta`, `Open next item`, and `reviewCard()` call confirmed absent from `renderPublicProfileHtml` | D-248A |
| No new public data fields in D-245→D-248 | **Confirmed** — zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-248A |
| Review search/filter markers in public profile | **Blocked** — `reviewSearchQuery`, `review-search`, `clearReviewSearch`, `review-filter-helper`, and `review-active-summary` confirmed absent from `renderPublicProfileHtml` | D-254A |
| No new public data fields in D-250→D-254 | **Confirmed** — zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-254A |
| Duplicate/similar label internals in public profile | **Blocked** — `Dupes + Similar` filter copy, `duplicate` filter key, duplicate/similar filter controls remain internal/admin Review UI only; confirmed absent from `renderPublicProfileHtml` | D-256B |
| No new public data fields in D-256 | **Confirmed** — copy-only change; zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-256B |
| Review mobile/wrapping CSS in public profile | **Blocked** — `.review-sort-bar`, `.review-decision-feedback`, `.review-empty-actions` and all D-258B CSS classes confirmed absent from `renderPublicProfileHtml`; Review mobile CSS remains internal/admin-only | D-259A |
| No new public data fields in D-258→D-259 | **Confirmed** — CSS-only change; zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-259A |
| Inspect action spacing CSS in public profile | **Blocked** — `.review-inspect-actions`, `btn-study-review`, `review-inspect-markdup`, `review-inspect-resolvesim` and all D-261B CSS classes confirmed absent from `renderPublicProfileHtml`; inspect action spacing remains internal/admin Review UI only | D-262A |
| No new public data fields in D-261→D-262 | **Confirmed** — CSS-only change; zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-262A |
| Study entry / Back button markers in public profile | **Blocked** — `btn-back-study`, `btn-study-review`, and `openReviewClaimStudy` confirmed absent from `renderPublicProfileHtml`; Study entry / Back-to-Review admin controls remain entirely internal | D-266A |
| No new public data fields in D-265→D-266 | **Confirmed** — CSS/copy-only change; zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-266A |
| RunPack / Investigation Packet internals in public profile | **Blocked** — `generateRunPack`, `saveAnalysisResult`, `runPackSummary`, `renderExport`, `rpRelativeTime`, and all RunPack internal controls confirmed absent from `renderPublicProfileHtml` | D-269A |
| No new public data fields in D-268→D-269 | **Confirmed** — frontend-only change; zero new API/schema fields; no backend/API/migration/schema/CSP changes | D-269A |
| RunPack provenance internals in public profile | **Blocked** — `detectPacketStaleness`, `simpleClaimHash`, `source_snapshot_hash` stale check, and `packet_id` resolution all absent from `renderPublicProfileHtml`; AI-return import controls remain internal | D-275B tests 12–15 |
| `analysis_results.packet_id` on public profile | **Not exposed** — `loadPublicProfileSummary` never calls `listAnalysisForClaim`; `packetId` field appears only in authenticated `GET /api/claims/:id` response | D-275C review item 10 |
| No new public data fields in D-274→D-275 | **Confirmed** — F-4 frontend-only (no new API fields); F-5 adds `packet_id` to `analysis_results` only, not surfaced on public profile | D-274B, D-275B |
| Stale warning wording in public profile | **Blocked** — `detectPacketStaleness()`, `simpleClaimHash`, `claim updated since packet` wording, and all RunPack stale-detection internals confirmed absent from `renderPublicProfileHtml` | D-279B tests 5–10 |
| No new public data fields in D-279 | **Confirmed** — frontend-only wording change; zero new API/schema/storage fields; no backend/migration/CSP changes | D-279B |
| Saved-analysis private/no-auto-publish copy in public profile | **Blocked** — `"Saving analysis does not publish a truth automatically"` and `"Private analysis note — not public truth."` confirmed absent from `renderPublicProfileHtml`; `sectionAnalyses()` and `analysisItem()` remain owner/private surfaces only | D-281B tests 10–12 |
| No new public data fields in D-281 | **Confirmed** — frontend-only copy change; zero new API/schema/storage fields; no backend/migration/CSP changes | D-281B |
| Owner pending-Review Truths on public profile | **Not exposed** — `GET /api/my-humanx` is `requireUser`-gated owner-only; public profile `/u/:slug` retains `COALESCE(review_state,'public')='public'` filter; pending truths remain invisible to public | D-285A audit Q12, D-285B tests 4–5 |
| No new public data fields in D-285 | **Confirmed** — frontend-only navigation/copy change; zero new API/schema/storage fields; no backend/migration/CSP changes | D-285B |
| Draft Truth from analysis on public profile | **Blocked** — `"Draft Truth from analysis"` button, `draftTruthFromAnalysis()`, and `analysis-draft-action` class are rendered only inside `analysisItem()` inside `sectionAnalyses()` inside owner-only `renderStudy()`. Confirmed absent from `renderPublicProfileHtml` | D-287B test 14 |
| Saved analysis metadata on public profile (post D-287) | **Blocked** — `analysisItem()` and `sectionAnalyses()` remain absent from `renderPublicProfileHtml`; no new public analysis field introduced | D-287B test 15 |
| No new public data fields in D-287 | **Confirmed** — frontend-only change; zero new API/schema/storage fields; no backend/migration/CSP changes | D-287B |
| Compact context line on public profile (post D-289) | **Blocked** — `analysisItem()` still absent from `renderPublicProfileHtml()`; consolidated compact line (`"Private analysis · not public truth · not independent verification · RunPack: rp_..."`) is owner/private only; `packetId` not exposed | D-289B test 15 |
| No new public data fields in D-289 | **Confirmed** — frontend-only copy consolidation; zero new API/schema/storage fields; no backend/migration/CSS/CSP changes | D-289B |
| Recent Truths / Review explanation in public profile | **Not exposed** — `renderMeHtml()` is owner-private; `meRecentTruthsHtml()` is not called from `renderPublicProfileHtml()`; "Review: awaiting admin approval" explanation copy is owner-dashboard-only | D-291B tests 7–9 |
| Pending Review Truths on public profile (post D-291) | **Not exposed** — My HumanX `renderMeHtml()` reorder did not alter `renderPublicProfileHtml()`; pending Review truths remain absent from `/u/:slug`; `COALESCE(review_state,'public')='public'` filter on public route unchanged | D-291B test 8 |
| No new public data fields in D-291 | **Confirmed** — frontend-only template reorder and copy addition; zero new API/schema/storage fields; no backend/migration/CSS/CSP changes | D-291B |
| Profile Settings controls in public profile | **Not exposed** — `meProfileSettingsHtml()` is owner-private; `<details>/<summary>` wrapping is My HumanX-only; `me-profile-settings` class absent from `renderPublicProfileHtml()` | D-293B test 12 |
| No new public data fields in D-293 | **Confirmed** — frontend-only `<details>/<summary>` wrap; zero new API/schema/storage fields; no backend/migration/CSS/CSP changes | D-293B |
| Profile setup nudge on public profile | **Not exposed** — `profileNudge` is rendered only inside `renderMeHtml()` which is owner-private; `<p>` nudge content is not called from `renderPublicProfileHtml()`; nudge condition uses `u.profile_public` and `u.profile_slug` from owner-only `GET /api/my-humanx` | D-295B test 15 |
| No new public data fields in D-295 | **Confirmed** — frontend-only conditional in `renderMeHtml()`; `u.profile_public` and `u.profile_slug` already in existing `GET /api/my-humanx` response; zero new API/schema/storage fields; no backend/migration/CSS/CSP changes | D-295B |

---

## Deployment state

| Item | State |
|------|-------|
| D-220A | Owner deploy PASS — D-220B confirmed live |
| D-221A | Owner deploy PASS — D-221B confirmed live |
| D-222A | Owner deploy PASS — D-222B confirmed live |
| D-223A | Owner deploy PASS — D-223B confirmed live |
| D-224A | Owner deploy PASS — D-224B confirmed live |
| D-225A | Tests / docs only — no deploy needed |
| D-226A | Docs only — no deploy needed |
| D-227A | Docs only — no deploy needed |
| D-227B | Owner deploy PASS — D-227C confirmed live (20/20) |
| D-228A | Owner deploy PASS — D-228B confirmed live (25/25) |
| D-229A | Owner deploy PASS — D-229B confirmed live (23/23) |
| D-230A | Owner deploy PASS — D-230B confirmed live (24/24) |
| D-231A | Tests / docs only — no deploy needed |
| D-232A | Docs only — no deploy needed |
| D-233A | Audit / tests / docs only — no deploy needed |
| D-233B | Owner deploy PASS — D-233C confirmed live (11/11) |
| D-234A | Owner deploy PASS — D-234B confirmed live (15/15) |
| D-235A | Owner deploy PASS — D-235B confirmed live (14/14) |
| D-236A | Owner deploy PASS — D-236B confirmed live (16/16) |
| D-237A | Tests / docs only — no deploy needed |
| D-238A | Docs only — no deploy needed |
| D-239A | Audit / docs only — no deploy needed |
| D-239B | Owner deploy PASS — D-239C confirmed live (13/13) |
| D-240A | Tests / docs only — no deploy needed |
| D-241A | Docs only — no deploy needed |
| D-242A | Audit / tests / docs only — no deploy needed |
| D-242B | Owner deploy PASS — D-242C confirmed live (34/34) |
| D-243A | Tests / docs only — no deploy needed |
| D-244A | Docs only — no deploy needed |
| D-245A | Audit / docs only — no deploy needed |
| D-245B | Owner deploy PASS — D-245C confirmed live (24/24) |
| D-246A | Owner deploy PASS — D-246B confirmed live (28/28) |
| D-247A | Owner deploy PASS — D-247B confirmed live (31/31) |
| D-248A | Tests / docs only — no deploy needed |
| D-249A | Docs only — no deploy needed |
| D-250A | Audit / tests / docs only — no deploy needed |
| D-250B | Owner deploy PASS — D-250C confirmed live (29/29) |
| D-251A | Owner deploy PASS — D-251B confirmed live (20/20) |
| D-252A | Owner deploy PASS — D-252B confirmed live |
| D-253A | Owner deploy PASS — D-253B confirmed live (41/41) · latest Worker: `46c50000-137f-4bba-9632-aa913798e494` |
| D-254A | Tests / docs only — no deploy needed |
| D-255A | Docs only — no deploy needed |
| D-256A | Audit / docs only — no deploy needed |
| D-256B | Owner deploy PASS — D-256C confirmed live (35/35) |
| D-256C | Live closeout — no deploy needed (closeout of D-256B deploy) |
| D-257A | Docs only — no deploy needed |
| D-258A | Audit / docs only — no deploy needed |
| D-258B | Owner deploy PASS — D-258C confirmed live (39/39) |
| D-258C | Live closeout — no deploy needed (closeout of D-258B deploy) |
| D-259A | Tests / docs only — no deploy needed |
| D-260A | Docs only — no deploy needed |
| D-261A | Audit / docs only — no deploy needed |
| D-261B | Owner deploy PASS — D-261C confirmed live (41/41) · deployed Worker: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` |
| D-261C | Live closeout — no deploy needed (closeout of D-261B deploy) |
| D-262A | Tests / docs only — no deploy needed |
| D-263A | Docs only — no deploy needed |
| D-264A | Docs only — no deploy needed |
| D-265A | Audit / docs only — no deploy needed |
| D-265B | Owner deploy PASS — D-265C confirmed live (39/39) |
| D-265C | Live closeout — no deploy needed (closeout of D-265B deploy) |
| D-266A | Tests / docs only — no deploy needed |
| D-267A | Docs only — no deploy needed |
| D-268A | Audit / docs only — no deploy needed |
| D-268B | Owner deploy PASS — D-268C confirmed live (36/36) |
| D-268C | Live closeout — no deploy needed (closeout of D-268B deploy) |
| D-269A | Tests / docs only — no deploy needed |
| D-270A | Docs only — no deploy needed |
| D-271A | Owner deploy PASS — D-271B confirmed live (32/32) · deployed Worker version not captured |
| D-271B | Live closeout — no deploy needed (closeout of D-271A deploy) |
| D-272A | Tests / docs only — no deploy needed |
| D-273A | Docs only — no deploy needed |
| D-274A | Audit — no deploy needed |
| D-274B | Owner deploy PASS — D-274C confirmed live (24/24) · deployed Worker version not captured |
| D-274C | Live closeout — no deploy needed (closeout of D-274B deploy) |
| D-275A | Audit — no deploy needed |
| D-275B | Branch `d275b-runpack-packet-id-storage` — no standalone deploy (branch-only) |
| D-275C | Pre-merge review — no deploy needed |
| D-275D | Owner deploy PASS — 22/22 live sanity PASS · D1 migration `0017` applied · deployed Worker: `759acc15-a6dd-4e50-a070-0d3356e5c257` |
| D-276A | Docs only — no deploy needed |
| D-277A | Audit — no deploy needed |
| D-277B | Owner deploy PASS — 22/22 live sanity PASS · deployed Worker version not captured |
| D-277C | Live closeout — no deploy needed (closeout of D-277B deploy) |
| D-278A | Docs only — no deploy needed |
| D-279A | Audit / docs only — no deploy needed |
| D-279B | Owner deploy PASS — 21/21 live sanity PASS (D-279C, 2026-07-02) · deployed Worker version not captured |
| D-279C | Live closeout — no deploy needed (closeout of D-279B deploy) |
| D-280A | Docs only — no deploy needed |
| D-281A | Audit / docs only — no deploy needed |
| D-281B | Owner deploy PASS — 25/25 live sanity PASS (D-281C, 2026-07-02) · deployed Worker version not captured |
| D-281C | Live closeout — no deploy needed (closeout of D-281B deploy) |
| D-282A | Docs only — no deploy needed |
| D-283A | Audit / docs only — no deploy needed |
| D-284A | Docs only — no deploy needed |
| D-285A | Audit / docs only — no deploy needed |
| D-285B | Owner deploy PASS — D-285C confirmed live (25/25) · deployed Worker version not captured |
| D-285C | Live closeout — no deploy needed (closeout of D-285B deploy) |
| D-286A | Docs only — no deploy needed |
| D-287A | Audit / docs only — no deploy needed |
| D-287B | Owner deploy PASS — D-287C confirmed live (31/31) · deployed Worker version not captured |
| D-287C | Live closeout — no deploy needed (closeout of D-287B deploy) |
| D-288A | Docs only — no deploy needed |
| D-289A | Docs only — no deploy needed |
| D-289B | Owner deploy PASS — D-289C confirmed live (33/33) · deployed Worker version not captured |
| D-289C | Live closeout — no deploy needed (closeout of D-289B deploy) |
| D-290A | Docs only — no deploy needed |
| D-291A | Docs only — no deploy needed |
| D-291B | Owner deploy PASS — D-291C confirmed live (24/24) · deployed Worker version not captured |
| D-291C | Live closeout — no deploy needed (closeout of D-291B deploy) |
| D-292A | Docs only — no deploy needed |
| D-293A | Docs only — no deploy needed |
| D-293B | Owner deploy PASS — D-293C confirmed live (27/27) · deployed Worker version not captured |
| D-293C | Live closeout — no deploy needed (closeout of D-293B deploy) |
| D-294A | Docs only — no deploy needed |
| D-295A | Docs only — no deploy needed |
| D-295B | Owner deploy PASS — D-295C confirmed live (27/27) · deployed Worker version not captured |
| D-295C | Live closeout — no deploy needed (closeout of D-295B deploy) |
| D-296A | Docs only — no deploy needed |
| D-297A | Docs only — no deploy needed |
| D-297B | Owner deploy PASS — D-297C confirmed live (25/25) · deployed Worker version not captured |
| D-297C | Live closeout — no deploy needed (closeout of D-297B deploy) |
| D-298A | Docs only — no deploy needed |
| D-299A | Docs only — no deploy needed |
| D-300A | Docs only — no deploy needed |
| D-300B | Owner deploy PASS — D-300C confirmed live (35/35) |
| D-300C | Live closeout — no deploy needed (closeout of D-300B deploy) · deployed Worker: `866886a0-691f-417b-bbe6-77a2dd8ca1f2` |
| D-301A | Docs only — no deploy needed |
| D-302A | Docs only — no deploy needed |
| D-302B | Owner deploy PASS — D-302C confirmed live (36/36) |
| D-302C | Live closeout — no deploy needed (closeout of D-302B deploy) · deployed Worker: `3baab973-c299-4ee4-bb08-66a91f490e14` (corrected after initial closeout recorded "not captured") |
| D-303A | Docs only — no deploy needed |
| D-303B | Docs only — no deploy needed |
| D-304A | Docs only (process protocol) — no deploy needed |
| D-304B | Docs only (process log) — no deploy needed |
| D-305A | Docs only — no deploy needed |
| D-306A | Docs only (product pass) — no deploy needed |
| D-306B | Owner deploy PASS — D-306C confirmed live (34/34) |
| D-306C | Live closeout — no deploy needed (closeout of D-306B deploy) · deployed Worker: `1025ccf7-5953-448f-817c-2b229c525a0d` (corrected in D-306D after initial closeout recorded "not captured") |
| D-306D | Metadata correction — no deploy needed |
| D-307A | Docs only — no deploy needed |
| D-308A | Docs only (product pass) — no deploy needed |
| D-308B | Owner deploy PASS — D-308C confirmed live (34/34) |
| D-308C | Live closeout — no deploy needed (closeout of D-308B deploy) · deployed Worker version not captured |
| D-309A | Docs only — no deploy needed |
| D-310A | Docs only (product pass) — no deploy needed |
| D-310B | Owner deploy PASS — D-310C confirmed live (35/35) |
| D-310C | Live closeout — no deploy needed (closeout of D-310B deploy) · deployed Worker version not captured |
| D-310D | Metadata correction (GitHub sync) — no deploy needed |
| D-311A | Docs only — no deploy needed |
| D-312A | Docs only (product pass) — no deploy needed |
| D-312B | Owner deploy PASS — D-312C confirmed live (39/39) |
| D-312C | Live closeout — no deploy needed (closeout of D-312B deploy) · deployed Worker version not captured |
| D-312D | Metadata correction (GitHub sync) — no deploy needed |
| D-313A | Docs only — no deploy needed |
| D-313B | Docs only (audit) — no deploy needed |
| D-313C | Tests only — no deploy needed |
| D-313D | Frontend cleanup — `public/app-v10.js` changed, deployed and confirmed live in D-313F |
| D-313E | Docs only — no deploy needed |
| D-313F (this task) | Live closeout — no deploy needed (closeout of D-313D deploy) · deployed Worker version not captured |
| **Current deploy needed** | **No** |
| **Latest deployed Worker** | not captured (D-313D live content confirmed via D-313F read-only fetch, 2026-07-09) |

CC session wrangler deploy always fails (VPN/proxy/certificate issue). All deploys require owner manual terminal execution. This is expected and permanent.

---

## Worker warning state

| Warning | Count | Status |
|---------|-------|--------|
| Known: `/api/u/:slug` parameterised route | 1 | Documented — `D218A_WORKER_ROUTE_WARNING_AUDIT.md` |
| Unknown warnings | 0 | Any new unknown parameterised route emits a distinct "NEW parameterised route" message |

**Rule:** Do not hide new warnings behind the known `/api/u/:slug` warning. Any new WARN text not matching the exact known-warn string must be investigated immediately.

---

## Safe next-work rules

1. **Reflection Avatar public exposure** — requires new spec + explicit owner approval before any implementation.

2. **New public profile fields** — any new field in `getPublicProfile` response or `renderPublicProfileHtml` must be named in docs, added to `PUBLIC_PROFILE_ALLOWED_MARKERS` with a test, and explicitly approved by owner.

3. **D-214 / D-215 / D-216 privacy locks** — do not loosen or remove tests without a new spec document, explicit owner approval, and updated README.

4. **Live PASS gating** — do not mark live closeout (D-xxxB) as PASS without owner manual deploy + browser sanity check. Static checks passing locally ≠ live PASS.

5. **Worker route warnings** — new parameterised routes must be confirmed in `worker.js`, added to `KNOWN_PARAM_ROUTES`, and documented in `D218A_WORKER_ROUTE_WARNING_AUDIT.md`.

6. **D-225A regression lock** — any public profile change that modifies D-220→D-224 behavior must either leave all D-225A tests passing unchanged, or update the D-225A regression lock with explicit owner approval and a `D-225A/D-NNN` annotation on the modified test. Do not silently remove lock tests.

7. **D-216A public allowlist** — any new public profile class, text, or ID must be added to `PUBLIC_PROFILE_ALLOWED_MARKERS` with a comment and rationale before merge. Empty-state copy follows the same rule.

8. **D-231A review ergonomics lock** — any review queue UI change that causes one or more D-231A tests to fail must either restore the original behavior or update the D-231A lock document with a new approved-deviation section, confirmed by the owner. Do not silently remove or weaken lock tests.

9. **Review moderation action names/routes** — do not change `/api/review/decision` route, decision values (`'public'`/`'rejected'`/`'review'`), or payload field names (`targetType`, `targetId`, `decision`) without a separate backend/API spec.

10. **No bulk review actions** — do not add bulk moderation actions without a separate spec and explicit owner approval.

12. **D-237A duplicate advisory regression lock** — any task touching duplicate/canonical/merge UX (new merge actions, canonical lookup, advisory UI changes, resolve-similar route changes) must either pass all D-237A tests unchanged, or update the D-237A lock with explicit owner approval before merging. Do not silently remove or weaken lock tests.

13. **`near_duplicate_of` advisory-only semantics** — do not treat `near_duplicate_of` as a proven canonical relationship without a separate spec. Do not auto-merge, auto-submit, or take any automatic action based solely on this field.

14. **No merge/canonical route without spec** — do not add `/api/review/merge`, `mergeClaimUI`, `canonicalResolution`, or equivalent behavior without a backend/API spec reviewed by the owner.

15. **No backend lookup for similar claim text** — do not add any `fetch`/`api()` call to `copySimilarClaimId` or the similar advisory field without a separate route/data-shape spec.

16. **New worker-route warnings** — do not hide new worker-route warnings behind the known `/api/u/:slug` warning. Any new WARN text not matching the exact known-warn string must be investigated immediately before being added to `KNOWN_PARAM_ROUTES`.

17. **D-240A review-to-study navigation lock** — any change to `openReviewClaimStudy`, `backToArena`, Study view rendering, or `lastModeBeforeStudy`/`lastInspectedReviewItemId` state must either pass all D-240A regression tests unchanged, or update the D-240A lock with explicit owner approval before merging.

18. **No browser history rewriting without spec** — do not add `pushState`, `replaceState`, or `hashchange`-based navigation to the Review/Study flow without a separate navigation spec document reviewed by the owner.

19. **No queue reload on Back-to-Review** — do not add `loadReviewQueue()` to the `backToArena()` return path without a deliberate spec. Stale-queue behavior on return is correct and expected.

20. **D-243A review next-item flow lock** — any task touching the feedback banner (`reviewDecisionFeedback`, `reviewDecisionFeedbackNextId`, `clearReviewDecisionFeedback`), `reviewDecisionUI`, `renderReviewList` feedback rendering, or `inspectReviewItem` must either pass all D-243A regression tests unchanged, or update the D-243A lock with explicit owner approval before merging.

21. **No auto-moderation on next-item** — do not add auto-approve, auto-reject, auto-keep, or any moderation API call to the "Open next item →" flow. The button must remain navigation-only (`inspectReviewItem` only).

22. **No auto-advance preference/persistence** — do not add `localStorage`, `sessionStorage`, or any backend persistence for the next-item auto-advance preference without a separate owner-approved spec.

23. **No keyboard shortcut advance changes** — do not change `initReviewKb` `_advanceId` behavior, timing, or key bindings without a separate review-flow spec reviewed by the owner.

24. **Drift/Belief expansion boundary** — do not touch `public/belief-drift-expansion.js` or `public/index.html` during Review queue work unless a failing test requires a minimal, explicitly documented compatibility fix.

25. **D-248A review card metadata density lock** — any task touching review card layout, metadata rows, badge/chip render paths, or the advisory hint grouping must either pass all D-248A regression tests unchanged, or update the D-248A lock with explicit owner approval before merging.

26. **No standalone date row** — do not reintroduce `<p class="review-card-date">` — the date belongs in `metaParts` via `.concat(['Updated '+updated])`.

27. **No cryptic score abbreviations** — do not reintroduce `ev:` / `ts:` / `sv:` — the readable `Evidence / Test / Survive` labels must be preserved.

28. **No advisory hints in head row** — do not move `needs sharpening`, `category echo`, or `? borderline origin` back into the primary `.review-card-head` row without a new owner-approved spec.

29. **Hints row preservation** — do not remove the `.review-card-hints` secondary row or its conditional render.

30. **Head row badge set** — do not move scan-critical badges (`~similar`, `truth-derived`, type, state, ⚑ report) out of the primary head row without a new owner-approved spec.

31. **New metadata rows require density audit** — do not add new `<p>` or `<div>` elements between `.review-card-chips` and `.review-actions` without a D-245A-style density audit confirming the new row does not push action buttons below the viewport on a typical queue.

32. **Pressure card meta extension** — do not extend `metaParts` with additional fields for pressure cards without resolving D-245A F-4 (handle duplication) — adding more fields to an already-duplicated surface increases noise, not scan speed.

33. **D-254A Review search/filter clarity lock** — any task touching `renderReviewActiveSummary`, `renderReviewEmptyState`, `renderReviewFilterHelper`, `renderReviewSearchRow`, `applyReviewSearch`, `setReviewSearch`, or `clearReviewSearch` must either pass all D-254A regression tests unchanged, or update the D-254A lock with explicit owner approval before merging.

34. **No backend/API search without spec** — do not add a `/api/review/search` route or any `fetch`/`api()` call triggered by the Review search input without a separate backend/API spec reviewed by the owner.

35. **No Review search persistence** — do not persist `reviewSearchQuery` to `localStorage`, `sessionStorage`, or any backend field without a separate owner-approved spec. Search must remain session-only.

36. **Clear search isolation** — `clearReviewSearch` must only set `reviewSearchQuery = ''`. It must not alter `reviewStateFilter` or `reviewSortOrder`. Do not combine clear-search with filter or sort resets without a new spec.

37. **Show all review items isolation** — `setReviewFilter` must not touch `reviewSearchQuery`. The "Show all review items" button resets filter only; search and sort must be preserved.

38. **Search-aware next-item required** — do not change `reviewDecisionUI` or `renderReviewInspectPanel` nav computation without preserving the `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` pipeline.

39. **No filter predicate change under copy tasks** — do not alter `applyReviewFilter` logic under any task scoped to copy, helper text, or label clarity. Filter behavior changes require a separate spec.

40. **No sort predicate change under copy tasks** — do not alter `applyReviewSort` logic under any task scoped to copy, helper text, or search. Sort behavior changes require a separate spec.

41. **Ambiguous filter helper copy is locked** — do not change the exact wording of `~Quality shows claim items with quality hints.`, `Dupes + Similar includes confirmed duplicates and near-duplicate advisories.`, or `~Similar shows near-duplicate advisory items.` without a D-254A/D-256B update and owner approval. (Updated D-256B: `Dupes` → `Dupes + Similar`.)

42. **No Review queue controls on public profiles** — do not expose search input, filter chips, sort controls, active summary, filter helper, or zero-results state on public profile pages.

43. **Drift/Belief expansion files remain untouched** — the D-250→D-254 arc did not touch `public/belief-drift-expansion.js` or `public/index.html`. Do not touch these files during Review queue work unless a failing test requires a minimal, explicitly documented compatibility fix.

44. **Do not rename `Dupes + Similar` back to `Dupes`** — the D-256B rename was a clarity improvement; reverting requires explicit owner approval and a new spec.

45. **Do not split the combined duplicate/similar filter predicate** — `Dupes + Similar` uses a single predicate covering both `duplicate_of` and `near_duplicate_of`. Splitting into separate confirmed-only and advisory-only filter chips requires a separate audit/spec.

46. **Do not change the internal `duplicate` filter key** — the state key `reviewStateFilter === 'duplicate'` must remain stable under any copy/label-only task. Key renames affect persistence, URL state, and all predicate lookups.

47. **Do not change `~Similar` from advisory-only** — `~Similar` must remain a strict subset of `Dupes + Similar` and advisory-only (`near_duplicate_of` only). Changing its semantics or predicate requires a separate audit/spec.

48. **Do not change duplicate/advisory action semantics under a label-only task** — `Mark Duplicate...`, `Dismiss ~Similar`, `Use as duplicate target`, `markDuplicateUI`, `resolveSimilarUI` actions must remain unchanged under any task scoped to copy, label, or display clarity.

49. **Do not remove `.review-sort-bar` wrapping/isolation without owner approval** — `.review-sort-bar` flex/wrap/gap and `.review-sort-label`/`.review-sort-select` rules address a confirmed HIGH wrapping risk (D-258A F-1). Removing or weakening them requires a new D-259B (or higher) doc and explicit owner approval.

50. **Do not remove `.review-decision-feedback` wrapping without owner approval** — `flex-wrap` on `.review-decision-feedback` and `flex-shrink:0` on feedback buttons address a confirmed HIGH wrapping risk (D-258A F-2). These properties must not be removed under any layout or CSS cleanup task.

51. **Do not remove `.review-empty-actions` flex/wrapping without owner approval** — `display:flex;flex-wrap:wrap;gap:6px` on `.review-empty-actions` addresses D-258A F-4. Must not be regressed to the pre-D-258B `margin-top:10px` only rule.

52. **Do not change Review mobile CSS under a behavior/copy-only task** — any task scoped to filter labels, helper copy, card copy, or moderation behavior must not alter the D-258B wrapping rules. CSS layout and copy/behavior tasks must be kept separate.

53. **Do not treat mobile CSS polish as permission to change filter/search/sort behavior** — D-258B was CSS-only. Any task touching `applyReviewFilter`, `applyReviewSearch`, `applyReviewSort`, or the search pipeline while claiming CSS scope requires a separate explicit spec.

54. **Do not remove desktop Study push without owner approval** — `.review-inspect-actions .btn-study-review{margin-left:auto}` addresses D-261A F-1 (no visual grouping at ≤600px). Removing or weakening it requires a new D-262B (or higher) doc and explicit owner approval.

55. **Do not remove mobile full-width inspect buttons without owner approval** — `.review-inspect-actions button{width:100%}` at ≤600px addresses D-261A F-4 MEDIUM. Must not be removed under any CSS cleanup or layout task.

56. **Do not remove duplicate/advisory soft separator without owner approval** — `border-top:1px solid rgba(255,255,255,.06)` on `.review-inspect-markdup`/`.review-inspect-resolvesim` at ≤600px addresses D-261A F-1 HIGH. Must not be regressed to unseparated column layout without a new spec.

57. **Do not change inspect action labels/order under a CSS-only task** — Approve / Keep Pending / Reject / Archive / Mark Duplicate... / Dismiss ~Similar / Study button order and labels are locked. Any copy or order change requires a separate spec.

58. **Do not change inspect action behavior under a spacing/polish task** — D-261B was CSS-only. Any task claiming CSS scope that touches `requestApproveReview`, `requestRejectReview`, `markDuplicateUI`, `resolveSimilarUI`, `openReviewClaimStudy`, or `reviewDecisionUI` requires a separate explicit spec.

59. **Do not treat inspect spacing polish as permission to change moderation or duplicate/advisory semantics** — D-261B did not alter any moderation route, decision value, advisory semantics, or filter predicate. Future inspect panel CSS tasks must maintain the same constraint.

60. **Review ergonomics protected area — lock preservation** — Any Review queue/card/filter/search/inspect/action layout or CSS change must either pass D-248A, D-254A, D-259A, and D-262A regression lock tests unchanged, or update each affected lock with explicit owner approval and a new documented task. Do not silently weaken any lock in this group.

61. **Do not change moderation semantics under a UI polish task** — Approve/Keep Pending/Reject/Archive routes, decision values, and payload fields must never change under a task scoped to CSS, copy, or layout. Moderation behavior changes require a separate backend/API spec.

62. **Do not change duplicate/advisory semantics under a label/layout task** — `markDuplicateUI`, `resolveSimilarUI`, `mark-duplicate` route, `resolve-similar` route, advisory-only semantics of `near_duplicate_of`, and `Dupes + Similar` filter predicate must never change under a task scoped to copy, CSS, or label clarity.

63. **Do not change search/filter/sort predicates under a copy/CSS task** — `applyReviewFilter`, `applyReviewSearch`, `applyReviewSort`, the `duplicate` filter key, and all filter chip labels must never change under a task scoped to visual polish, CSS, or copy. Predicate changes require a separate spec.

64. **Do not expose Review internals on public profile pages** — No class, function, state variable, or copy string from the Review queue, inspect panel, search/filter/sort system, or admin controls may appear in `renderPublicProfileHtml`. Any new Review feature must add a public-boundary test before merge.

65. **Do not mark live PASS without owner deploy and browser sanity** — Static checks passing locally does not constitute a live closeout. Every code/CSS deploy must be owner-executed via manual terminal deploy and followed by an owner browser sanity check before the live closeout commit is made.

66. **Do not re-add `primary` to the inspect panel Study button without owner approval** — the `primary` class was removed from the claim Study button in D-265B to eliminate a false visual hierarchy. Reintroducing it requires a D-266A lock test update and explicit owner approval.

67. **Do not remove `btn-back-study` from Back-to-Review controls without owner approval** — all 5 Back navigation buttons use `btn-back-study` (D-265B). Removing the class or its CSS rule requires a D-266A lock test update and explicit owner approval.

68. **Do not change Back-to-Review behavior under a style/copy task** — D-265B was CSS/copy only. Any task claiming style or copy scope that touches `backToArena()`, `data-action="backToArena"`, `lastModeBeforeStudy`, or `lastInspectedReviewItemId` requires a separate navigation spec.

69. **Do not change scroll restoration under a style/copy task** — the `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` restore in `backToArena()` must not be altered under any CSS or copy task. Behavior changes require a separate spec.

70. **Do not change Study navigation handlers under a style/copy task** — `openReviewClaimStudy`, `studyFromVault`, and their call sites must not change under any task scoped to Study button style, Back button style, or label clarity.

71. **Do not expose Review/Study admin controls on public profile pages** — `btn-back-study`, `btn-study-review`, `openReviewClaimStudy`, and all Study entry / Back-to-Review internals must remain absent from `renderPublicProfileHtml`. Any new Study/Review feature must add a public-boundary test before merge.

72. **Do not remove fallback `instruction` under a UI clarity task** — `instruction` must remain in the fallback RunPack packet (D-268B). Removing it leaves AI users without any prompt guidance when the backend is unavailable. Any removal requires explicit owner approval and a new documented task.

73. **Do not remove fallback `output_contract` under a UI clarity task** — `output_contract` must remain in the fallback RunPack packet (D-268B). Removing it leaves AI users without any schema guidance. Any removal requires explicit owner approval and a new documented task.

74. **Do not change stale threshold from `3600000ms` without owner approval** — `detectPacketStaleness()` uses `3600000ms` (1h) as the age threshold. Changing this affects when users see the stale warning. Requires explicit owner approval.

75. **Do not change public truth state from RunPack analysis under a UI clarity task** — `saveAnalysisResult()` posts to `/api/analysis` only. It must never call review/approve routes. Any change to this routing requires a separate backend/moderation spec.

76. **Do not change analysis parser/import behavior under a generated-time/fallback-guidance task** — `saveAnalysisResult()` JSON.parse validation, field extraction, and toast copy are locked. Changes require a separate spec.

77. **Do not implement packet-ID storage without an explicit backend/schema/API decision** — F-5 (storing `packet_id` with saved analysis) requires an `analysis_results` schema migration. Do not add this under any frontend-only task.

78. **Do not collapse `rp-return-section` by default without owner approval** — `rp-return-section` auto-expands when a matching RunPack is loaded (`lastPacket&&lastPacketClaimId===selected?.id`). Removing the conditional `open` attribute requires explicit owner approval and a D-272A lock update.

79. **Do not remove `rp-return-next-step` or its no-auto-publish copy under a UI clarity task** — the `rp-return-next-step` paragraph and its "Saving does not publish a truth automatically" copy are D-272A-locked. Any change to this copy requires explicit owner approval and a D-272A lock update.

80. **Next RunPack backend work (F-4/F-5) must be branch/PR style** — any implementation of snapshot-hash stale detection (F-4) or packet-ID storage (F-5) requires a backend/schema change and must follow branch/PR workflow with explicit owner approval before merge. Do not add these under any frontend-only or docs-only task.

81. **Future analysis-result storage changes require branch/PR workflow** — any change to `analysis_results` schema, `addAnalysisResult()`, or the POST body accepted by `/api/analysis` requires a branch/PR-style workflow with explicit owner approval before merge. This includes adding new columns, changing sanitizer logic, or modifying the INSERT column list.

82. **Do not use `cleanId()` for `rp_*` packet IDs** — `cleanId()` strips underscores, which corrupts `rp_abc123_lc2x9k`-format IDs. Use `cleanText(value, 80)` instead for any field that may contain `rp_*` values. Do not switch back to `cleanId()` for packet-ID sanitization.

83. **Do not assume public profile exposes analysis metadata** — `loadPublicProfileSummary()` does not call `listAnalysisForClaim()`. `analysis_results.packet_id` and `packetId` in `GET /api/claims/:id` are authenticated-only fields. Verify `/u/:slug` separately from authenticated claim detail routes before assuming any analysis field is public.

84. **Owner/private provenance display must remain separate from public surfaces** — `analysisItem()` renders in `sectionAnalyses()` inside `renderStudy()` only. Do not call `analysisItem()` from `renderPublicProfileHtml`, truth cards, or any unauthenticated surface. Any reuse across the public/private boundary requires an explicit audit.

85. **Any future public exposure of packet/analysis provenance requires explicit audit first** — `packet_id`, `packetId`, `Saved from RunPack`, and any future provenance field derived from `analysis_results` must be audited for privacy/security impact before appearing in any public route, public profile, or truth card. Do not assume the owner-only display pattern is safe to copy to public surfaces without a new audit task.

86. **Frontend-only provenance UI changes still need public-profile non-exposure tests** — even if an implementation is classified as frontend-only, any change to `analysisItem()` or `sectionAnalyses()` must add or preserve tests confirming the new content does not appear in `renderPublicProfileHtml`. Do not remove D-275B tests 13–15 or D-277B tests 8–9 under any refactor.

87. **User-facing RunPack warnings should avoid internal storage/hash language** — stale warning copy must be user-readable. Language like `source snapshot changed` reveals internal hash state and is unsuitable for user-facing display. Future stale-detection copy should describe what the user needs to know (e.g. `claim updated since packet`) not what field changed internally.

88. **Stale-detection copy changes must preserve the underlying comparison logic** — any rename or reword of `detectPacketStaleness()` warning strings must not alter the detection condition (`meta.source_snapshot_hash!=null && simpleClaimHash(selected)!==meta.source_snapshot_hash`), the stale threshold (`3600000ms`), the evidence/test/pressure count checks, or the generated-time check. Copy changes are D-93B-allowlist-gated and require README update before the smoke test passes.

89. **Any future wording polish touching `public/app-v10.js` still needs deploy + live closeout** — frontend-only copy changes are not zero-risk. They require: (1) `node --check` pass, (2) full hardening smoke pass, (3) owner manual terminal deploy, (4) browser live sanity, (5) live closeout docs update. Do not mark a wording change as complete without a live closeout commit.

90. **Saved analysis must remain separate from Truth publication unless an explicit audited workflow is added** — `saveAnalysisResult()` must not call `POST /api/truths`, `POST /api/review/decision`, or any approve/publish route without a new audit task and explicit owner approval. The no-auto-publish boundary is locked by D-281B tests and must not be regressed under any UI polish or "analysis → Truth" convenience task.

91. **Any "analysis → Truth" action requires audit first and must not auto-publish** — if a future task adds a "draft Truth from analysis" affordance, it must: (1) complete an audit task first, (2) be prefill-only with no auto-submit, (3) require explicit owner confirmation before any `POST /api/truths` call, and (4) add public-boundary non-exposure tests. Do not add this under any copy, UI, or RunPack task.

92. **Public profile and truth surfaces must continue to be tested for non-exposure of saved-analysis metadata** — any new field added to `analysisItem()`, `sectionAnalyses()`, or `saveAnalysisResult()` must add a corresponding test confirming the field does not appear in `renderPublicProfileHtml`. Do not remove D-281B tests 10–12 under any refactor.

93. **Truth creation must continue to route through Review** — all three creation paths (`submitTruth`, `submitBuilderTruth`, `promoteBelief('truth')`) produce `review_state='review'`. No future task may bypass this gate without a separate backend/moderation spec and explicit owner approval.

94. **Saved analysis must never auto-publish a Truth** — `saveAnalysisResult()` must not call `POST /api/truths`, `POST /api/review/decision`, or any approve/publish route. Any "analysis → Truth" affordance must be prefill-only with explicit owner confirmation before any `POST /api/truths` call, must not auto-publish, and must add public-boundary non-exposure tests.

95. **Owner pending-Review Truth visibility is now live in My HumanX** — `GET /api/my-humanx` (worker.js line 319) has no `review_state` filter and already returns all owner truths including pending. `meRecentTruthsHtml()` renders them with the yellow `Review` badge. Post-submission navigation now sends owners to My HumanX. No backend/schema/API change was needed. (D-285A audit corrected the D-283A/D-284A F-1 misidentification; D-285B/C live.)

96. **Post-submission Truth navigation must remain aligned with where pending Review items are visible** — after `submitTruth()`, `submitBuilderTruth()`, or `promoteBelief('truth')`, the owner must land in My HumanX (`renderMe()` + `tab-me`) where pending-Review truths are already visible. Do not change the post-submission navigation target back to `renderTruths()` (public tab) without a new spec, since pending truths are not visible there.

97. **Pending-Review Truth visibility must remain owner/private** — pending truths appearing in My HumanX via `GET /api/my-humanx` are owner-scoped and `requireUser`-gated. This must not extend to the public profile `/u/:slug` route, which retains the `COALESCE(review_state,'public')='public'` filter. Do not expose pending-Review truths on any public surface.

98. **Truth submission UX changes must preserve `review_state='review'` and the admin Review gate** — any future frontend change to Truth submission paths (`submitTruth`, `submitBuilderTruth`, `promoteBelief('truth')`) must not alter `POST /api/truths` behavior, must not add a self-approval path, and must not bypass the admin-only Review queue.

99. **Analysis-assisted Truth actions must remain draft-only unless explicitly audited otherwise** — `draftTruthFromAnalysis()` is prefill-only. It must not call `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')`, or any approve/review route. Any future enhancement that moves from prefill toward automation requires a new audit task and explicit owner approval before implementation.

100. **Do not use machine labels like `verdict` as Truth statement content** — `verdict` is an AI classification token (`'strongly-supported'`, `'contested'`, etc.), not a human-authored claim statement. It must never appear in `truthStatement` or any Truth form field as prefilled content. Only `plainLanguageSummary` (prose text) is approved for Truth prefill.

101. **Any future analysis-to-Truth automation must preserve explicit owner review, normal submit, `review_state='review'`, and admin Review approval** — the D-287B pattern (prefill → owner edits → owner clicks submit → `POST /api/truths` → `review_state='review'` → admin Review → approve/reject) is the minimum safe pipeline. Do not short-circuit any step of this pipeline under any convenience, speed, or UX polish task.

102. **Saved-analysis context copy must stay compact while preserving private/not-truth/not-verification/provenance meaning** — the D-289B compact line (`"Private analysis · not public truth · not independent verification [· RunPack: rp_...]"`) preserves all three safety meanings in one line. Future card copy changes must not remove any of these three meanings, must not restore the three-line stacked layout without explicit owner approval, and must not expose the consolidated line on any public surface.

103. **Product polish must not remove public-profile non-exposure tests** — the D-289B test section confirmed that the compact context line does not appear in `renderPublicProfileHtml`. Do not remove D-289B test 15 (public profile non-exposure) under any card layout refactor. Non-exposure tests are permanently load-bearing regardless of which copy variant is in use.

104. **Any future card layout change in `analysisItem()` must preserve the draft-only Truth action and Review gate locks** — `analysisItem()` now carries both the compact context line and the `"Draft Truth from analysis"` button. Any card layout change must pass D-287B tests 1–23 and D-289B tests 10–18 unchanged, or update each affected lock with explicit owner approval before merging.

105. **My HumanX is now the post-submit owner landing page — pending Review Truth visibility must stay high on the page** — "Recent Truths" is immediately after the filter bar in `renderMeHtml()`. Any future `renderMeHtml()` reorder must not move "Recent Truths" below "Recent Claims" or "Belief Snapshots" without a new spec and explicit owner approval. The D-291B positional tests (D-137E, D-139B, D-291B tests 2–5) must continue to pass.

106. **Review badge explanations must preserve admin Review gate meaning and must not imply automatic publication** — the Review explanation copy `"Review: awaiting admin approval — goes Public when approved."` makes clear that approval is a manual admin action. Any future reword of this copy must not imply self-publication, automatic approval, or an owner-controlled publish action. Copy changes require owner approval and a README/doc update.

107. **Owner dashboard layout changes must preserve `GET /api/my-humanx` as the data source unless separately audited** — `renderMe()` fetches from `GET /api/my-humanx`. Any future My HumanX improvement that requires a different endpoint, a new query parameter, or a `review_state` filter must be explicitly audited for owner/public data isolation before implementation. Do not add query parameters or additional endpoints under a frontend-layout-only task.

108. **My HumanX Account card must remain visible even when Profile Settings controls are collapsed** — the Account card (`meAccountCardHtml()`) is a separate function and panel, always rendered above the Profile Settings `<details>` block. Any future `renderMeHtml()` change must not move `meAccountCardHtml()` inside the `<details>` block or make it conditional on Profile Settings state. The D-293B test (Account card separate from Profile Settings) must continue to pass.

109. **Profile-edit UI polish must preserve profile save/copy behavior and public profile non-exposure locks** — `saveProfileSettingsUI` and `meCopyProfileLink` handlers, `meUpdateProfilePreview()` wiring, and the `me-profile-settings` class must not change under any owner-dashboard layout task. Any change to these handlers requires a separate spec. The profile settings panel must remain absent from `renderPublicProfileHtml()`.

110. **Owner-dashboard layout changes must keep Recent Truths high enough for post-submit Review visibility** — Recent Truths must stay as the first content panel after the filter bar (D-291B). Any future `renderMeHtml()` reorder that moves Recent Truths below the Profile Settings block, My Content counts, or Recent Claims requires a new spec and explicit owner approval. The D-291B and D-293B positional tests must continue to pass.

111. **My HumanX nudges must stay narrow and self-clearing — not become noisy count dashboards** — The D-295B profile-setup nudge fires only when `!profile_public && !profile_slug`. Any future nudge or attention strip in `renderMeHtml()` must be equally specific. A general "Needs attention" strip that repeats My Content counts or pending-Review counts is prohibited. The D-295B tests (no general "Needs attention" strip; no My Content count duplication) must continue to pass.

112. **Profile setup guidance must remain tied to actual profile state from `GET /api/my-humanx`** — The nudge condition uses `u.profile_public` and `u.profile_slug` which are already in the API response. Any future nudge that requires additional backend fields, query parameters, or new API endpoints must be audited as a backend task before implementation. Do not add frontend conditionals that cannot be satisfied by the existing `GET /api/my-humanx` payload.

113. **Do not add dismiss/localStorage state for server-derived profile setup nudges unless separately audited** — The profile-setup nudge has no dismiss button and no localStorage. It self-clears via data alone. Any future addition of a dismiss flag, a `localStorage` key, or a server-side `dismissed` column for this nudge requires a separate audit task and explicit owner approval. The D-295B test (no localStorage introduced) must continue to pass.

114. **Home onboarding copy must keep the post-submit Review state understandable to first testers** — The "Start here" Step 5 (`"Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge."`) was added specifically so a first beta tester can find their submission without Mike explaining it. Any future rewrite of the "Start here" strip must preserve a step that covers the post-submit Review pending state. The D-297B tests 1–4 (Step 5 presence and copy content) must continue to pass.

115. **Visible owner-dashboard naming may say `My HumanX`, but internal `tab-me` behavior must remain stable unless separately audited** — The tab was relabelled from `Me` to `My HumanX` for beta clarity. The `id="tab-me"` attribute, the `onclick="setMode('me')"` handler, and the `tab-me` references in JS (post-submit navigation, `renderMe()`) must not be renamed under a copy task alone. Any future rename of the internal `tab-me` id requires an audit of all JS callers and a separate spec. The D-297B tests 5–6 (label and id) must continue to pass.

116. **Beta-readiness improvements should prefer copy/navigation clarity before new backend features** — The D-297A product pass found that all first-tester gaps were copy and navigation, not missing features. Future beta-readiness tasks should exhaust copy/navigation fixes first. A new backend feature, new API endpoint, or new schema column for onboarding purposes requires an audit task with explicit classification before implementation.

117. **Home demo/example content must stay static-only unless a separate backend/demo-flow audit is completed** — the D-300B before/after demo card in `renderHome()` renders fixed text with no `data-action`, `fetch(`, claim ID, or write call. Any future change that makes the demo dynamic (reads real data, calls an API, or accepts input) requires a new audit task and explicit owner approval before implementation.

118. **Demo/example content must stay clearly labelled as example-only and not verified** — the exact labels `Example — not a real claim` and `Review — example only, not verified` are load-bearing disclaimers, not incidental copy. Any future rewording must preserve both the "not a real claim" and "not verified" meanings. Removing or softening either disclaimer requires explicit owner approval.

119. **Demo cards must never submit, fetch, write, create claim IDs, or pollute Review** — this applies to the D-300B card and any future Home/onboarding demo content. No demo/example element may call `/api/claims`, `/api/truths`, `/api/review`, or any write endpoint, and none may generate a claim ID or Review queue entry. Any proposal to make a demo interactive requires a separate spec covering Review-queue isolation before implementation.

120. **Home glossary definitions must not describe Review as proof or automatic verification** — the D-302B "HumanX words" glossary's Review definition (`"Admin approval before it can go public — not automatic proof."`) is load-bearing, matching the same meaning already locked for the D-297 Step 5 and D-300 demo card. Any future reword must preserve both "admin approval" and the explicit negation of automatic proof/verification. Removing or softening either half requires explicit owner approval.

121. **Vocabulary help should remain low-weight/collapsed unless real user testing proves it must be always visible** — the D-302B glossary is a collapsed `<details>/<summary>` by design (D-302A Q18 risk: an always-open glossary risks making Home too text-heavy, directly undercutting the D-300A "show value in 30–60 seconds" goal). Do not change it to an always-open block, a separate Help page, or an inline-tooltip system without evidence from real cold-visitor testing that the collapsed form is insufficient.

122. **Do not change the meaning of Claim, Truth, Review, Evidence, or My HumanX without a product-pass audit** — the five D-302B glossary definitions were derived from a correction pass (D-302A) that found the naively-suggested Truth wording inaccurate. Any future change to what these five terms mean (not just their wording) requires a new product-pass-style audit before implementation, to avoid reintroducing an inaccurate definition or drifting from the existing Actions-card copy these definitions were derived from.

123. **First outside submissions must be logged/classified before approval decisions** — per the D-304A/B intake protocol and log, any real outside/beta Review submission must be recorded in the intake table (claim, submitter, source, date, evidence, category, action, product lesson, follow-up question) and classified into one of the six D-304A categories before it is approved or rejected. Do not skip logging under time pressure to clear the queue.

124. **Do not approve beta submissions merely to make the public feed look active** — this is the specific failure mode D-304A's do-not-publish-first rule exists to prevent. A first real outside submission creates emotional pressure to reward the tester by fast-tracking approval; that pressure must not override the normal wording/evidence/public-meaning bar. This applies permanently to all future outside submissions, not just the first one logged in D-304B.

125. **Do not create new features from a single Review item; wait for repeated confusion or at least three outside submissions** — per D-304A/B next-action rules, one odd or confusing outside submission is a data point, not a spec. Do not open a new product-pass task off one Review item. Only escalate to a narrow product pass if the same confusion pattern repeats across at least two submissions, or wait for at least three outside submissions before drawing any broader conclusion.

126. **Belief Engine preview content must remain static-only unless a separate bridge/product audit is completed** — the D-306B "Example — not your result" intro preview renders fixed text with no button, onclick, fetch, localStorage/sessionStorage, or Claim/Truth/RunPack creation. Any future change that makes the preview dynamic (reads real user data, calls an API, or accepts input) requires a new audit task and explicit owner approval before implementation.

127. **Belief Engine must not describe itself as diagnosis, proof, verdict, or user classification** — the existing `"No diagnosis."` / `"Use it as a mirror, not a verdict."` copy and the D-306B boundary line (`"This is not a diagnosis, verdict, or proof — it is a reflection aid."`) are load-bearing disclaimers. Any future Belief Engine copy change must preserve all three meanings and must never label a user as irrational, broken, extremist, unsafe, or similar. Removing or softening this language requires explicit owner approval.

128. **Do not add Belief Engine Claim/Truth/RunPack creation from the intro preview without a dedicated audit** — D-306A explicitly deferred any direct "turn this belief into a claim" bridge due to cross-app/session risk (the standalone Belief Engine page has no access to the main SPA's session/auth state beyond the shared-localStorage trick in `humanx-bridge.js`). The D-306B preview must remain inert; any future interactive bridge from the intro screen (or elsewhere in Belief Engine) requires its own audit task before implementation, per the same pattern already used for RunPack F-4/F-5 and saved-analysis-to-Truth (D-287A).

129. **Belief Engine Back to HumanX links must remain absent from active progress-risk screens unless autosave/progress-loss handling is separately audited** — the D-308B `← Back to HumanX` links exist only on `screen-intro` and `screen-results` because `saveRunRecord()` only persists answers once, at full completion, with no incremental autosave. Do not add the link (or any other exit affordance) to `screen-identity`, `screen-timeline`, or `screen-quiz` without first adding incremental answer autosave or a progress-loss confirmation dialog — both are their own audited feature, not a copy/link change.

130. **Belief Engine intro/results links may return to HumanX Home, but must not create Claim/Truth/RunPack behavior** — the D-308B links are plain `<a href="/">` navigation only. Any future change to these links (or any similar exit affordance) must not attach a `fetch(`, `promoteBelief`, `generateRunPack`, or any `/api/belief-promote`/`/api/claims`/`/api/truths`/`/api/runpack` call. If a future task wants the back link to also save or promote something, that is a new feature requiring its own audit, not an extension of this link.

131. **Do not add full HumanX navigation inside Belief Engine without a dedicated product pass** — D-308A explicitly rejected importing the main app's full nav bar/tabs into the standalone Belief Engine as disproportionate to the gap it was fixing. Belief Engine remains a deliberately focused, single-purpose standalone screen (D-306A). Any future proposal to add persistent multi-tab navigation there requires its own product-pass audit and explicit owner approval.

132. **Belief Engine results handoff may explain Review, but must not imply Review is proof or verification** — the D-310B sentence (`"...public display still waits for Review — admin approval, not automatic proof."`) is load-bearing, consistent with the D-302 glossary's Review definition. Any future reword of this sentence must preserve both "admin approval" and the explicit negation of automatic proof/verification. Removing or softening either half requires explicit owner approval.

133. **Belief Engine results handoff must not create Claim/Truth/RunPack behavior without a dedicated bridge/action audit** — the D-310B sentence is static text only — no link, button, `onclick`, or API call. Any future change that attaches a fetch call, a `promoteBelief`/`generateRunPack` call, or any `/api/belief-promote`/`/api/claims`/`/api/truths`/`/api/runpack` reference to this sentence (or the "What to Test Next" section generally) requires its own audit, per the same pattern already locked for the D-308B back links (rule 130) and the D-306B intro preview (rule 128).

134. **Do not add duplicate results next-step cards; keep handoff copy inside the existing "What to Test Next" section unless separately audited** — D-310A found that section already exists and D-310B extended it rather than duplicating it. A regression test confirms `"What to Test Next"` appears exactly once in the file. Any future results-page handoff improvement should extend that section first; adding a second, competing next-step card requires its own product-pass audit and explicit owner approval.

11. **Hard security rules (permanent):**
    - Do NOT touch `selectClaim`, `studyFromVault`, `attachEvidencePrompt`
    - Do NOT touch Review decision handlers: `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview`
    - Do NOT touch belief engine file unless for copy-level safety fixes
    - No CSP tightening
    - No backend/auth/token changes beyond taxonomy work
    - No wrangler.toml changes
    - No Review/admin logic changes
    - No public belief identity cards, no avatar generation, no ideology badges
    - `alignment_labels` must never be enabled in any UI — permanently blocked
    - `top_beliefs_json` must never be returned raw in any public API response

---

## Suggested next feature lanes

These are suggestions only. Do not start any until explicitly assigned.

| Lane | Notes |
|------|-------|
| RunPack AI-return import visibility | **COMPLETE** — F-3 addressed in D-271A/B; regression-locked in D-272A |
| Snapshot-hash stale detection | **COMPLETE** — F-4 implemented in D-274B; `source_snapshot_hash` check live in `detectPacketStaleness()` |
| Packet-ID traceability backend/schema decision | **COMPLETE** — F-5 implemented in D-275B/C/D; `analysis_results.packet_id` live; Worker `759acc15` |
| Saved analysis provenance visibility | **COMPLETE** — D-277B/C; `analysisItem()` renders `Saved from RunPack: rp_...` when `packetId` exists; live |
| Stale warning wording polish | **COMPLETE** — D-279B/C; `claim updated since packet` live; old `source snapshot changed` removed from UI |
| Saved analysis ↔ Truth boundary copy | **COMPLETE** — D-281B/C; explicit no-auto-publish + private-note copy live; boundary structurally confirmed |
| Truth drafting/Review workflow audit | **COMPLETE** — D-283A/D-284A; three creation paths confirmed all produce `review_state='review'`; admin-only Review gate confirmed; copy accurate |
| Owner pending-Review Truth visibility | **COMPLETE** — D-285A/B/C; `GET /api/my-humanx` already returns pending truths; `meRecentTruthsHtml()` renders them with yellow `Review` badge; post-submission navigation now sends owner to My HumanX; live PASS |
| Saved analysis ↔ Truth boundary | **COMPLETE** — D-281A/B/C + D-283A; boundary structurally confirmed; copy accurate; no auto-publish path exists |
| Saved analysis assisted Truth draft | **COMPLETE** — D-287A audit (23 questions); D-287B implementation (`draftTruthFromAnalysis()`, prefill-only, `plainLanguageSummary` only); D-287C live PASS (31/31); baseline 3360/0/24/57. Draft action is owner/private only; auto-submit and auto-publish impossible; Review gate fully preserved. |
| Owner workflow product polish | **COMPLETE** — D-289A product pass (15 questions); D-289B card copy consolidation (three stacked notes → one compact line); D-289C live PASS (33/33); baseline 3383/0/24/57. All safety meanings preserved. |
| My HumanX Recent Truths prominence | **COMPLETE** — D-291A product pass (19 questions); D-291B reorder + Review explanation; D-291C live PASS (24/24); baseline 3405/0/24/57. Recent Truths now visible immediately after filter bar. |
| My HumanX collapsible Profile Settings | **COMPLETE** — D-293A product pass (15 questions); D-293B `<details>/<summary>` wrap in `meProfileSettingsHtml()`; D-293C live PASS (27/27); baseline 3424/0/24/57. Profile Settings collapses by default; Account card always visible; counts/filter/Truths immediately reachable. |
| My HumanX profile setup nudge | **COMPLETE** — D-295A product pass (18 questions; general count strip ruled out); D-295B narrow nudge in `renderMeHtml()` (`!profile_public && !profile_slug` only); D-295C live PASS (27/27); baseline 3442/0/24/57. Nudge self-clears once slug set or profile_public true. No dismiss state. No localStorage. No backend/CSS changes. |
| Beta readiness Home Step 5 and My HumanX tab | **COMPLETE** — D-297A product pass (22 questions; post-submit path unguided identified as top gap); D-297B Home Step 5 + "My HumanX" tab label (internal `tab-me` preserved); D-297C live PASS (25/25); baseline 3462/0/24/57. No backend/CSS/schema changes. |
| HumanX first beta tester script | **COMPLETE** — D-299A produced a tester start message, 11-step task list, 8 safe example claims, observation sheet, and success/failure criteria. Docs only; baseline unchanged 3462/0/24/57. Result: most invited testers did not respond or test — this outcome directly motivated the D-300 arc. |
| Home static before/after demo card | **COMPLETE** — D-300A product pass (23 questions; Home explains what HumanX is but not what it produces); D-300B static demo card in `renderHome()` (frontend-only, no CSS/backend/schema changes); D-300C live PASS (35/35), deployed Worker `866886a0-691f-417b-bbe6-77a2dd8ca1f2`; baseline 3462 → 3487/0/24/57. Demo is static-only, clearly labelled example-only, cannot submit/fetch/write/pollute Review. |
| Home collapsed HumanX words glossary | **COMPLETE** — D-302A product pass (22 questions; real vocabulary gaps confirmed after D-297/D-300 — My HumanX undefined, Truth/Claim scattered, Evidence under-defined, Review named before defined; suggested Truth wording found inaccurate and corrected); D-302B collapsed `<details>/<summary>HumanX words</summary>` glossary in `renderHome()` (frontend-only, no CSS/backend/schema changes); D-302C live PASS (36/36), deployed Worker `3baab973-c299-4ee4-bb08-66a91f490e14`; baseline 3487 → 3515/0/24/57. Glossary collapsed by default; Review defined as admin approval/not proof; Evidence defined as support/challenge; My HumanX defined as private dashboard. |
| First outside submission Review intake | **COMPLETE** — D-304A process protocol (do-not-publish-first rule, 6 classification categories mapped to existing Approve/Reject/Keep Pending actions, 7 tester follow-up questions, safety boundaries reconfirmed); D-304B intake log seeded with the first confirmed outside submission (claim about fast/expensive-car drivers' generosity, submitter `anon-rtpuo3`, source Builder/CLAIM/REVIEW, category Real useful claim / needs better evidence, action "Keep in Review; do not approve yet"). Docs/process only — no app/backend/schema/API changes; baseline unchanged 3515/0/24/57. |
| Belief Engine intro static output preview | **COMPLETE** — D-306A product pass (audit of Belief Engine + connected belief-flow; zero safety-boundary violations found; main gap: no worked-example output before the 77-statement commitment); D-306B static "Example — not your result" preview added to `#screen-intro` in `public/apps/humanx-belief-engine/index.html` (frontend-only, no CSS/backend/schema changes, 20 new tests); D-306C live PASS (34/34); D-306D corrected deployed Worker version to `1025ccf7-5953-448f-817c-2b229c525a0d` and resolved a GitHub push discrepancy; belief static baseline 24 → 44/0. Preview is static-only, cannot submit/fetch/write/create Claim-Truth-RunPack, and preserves all existing "no diagnosis"/"mirror not a verdict" safety copy. |
| Belief Engine safe Back to HumanX links | **COMPLETE** — D-308A product pass (confirmed zero in-tab exit path across 4 of 5 screens; found `saveRunRecord()` only persists once, at full completion, with no incremental autosave — so a link is only safe on `screen-intro`/`screen-results`); D-308B added `← Back to HumanX` (→ `/`) to those two screens only, intentionally absent from `screen-identity`/`screen-timeline`/`screen-quiz` (frontend-only, no CSS/backend/schema changes, 13 new tests); D-308C live PASS (34/34), deployed Worker version not captured; belief static baseline 44 → 57/0. Links create no Claim/Truth/RunPack/fetch behavior; all existing safety copy and D-306B preview preserved. |
| Belief Engine results Review handoff sentence | **COMPLETE** — D-310A product pass (corrected its own framing: "What to Test Next" already existed, no new card needed; real gap: "Review" never appeared anywhere in the file); D-310B added one sentence to that existing section (`"...public display still waits for Review — admin approval, not automatic proof."`), no new card, no link/bridge changes (frontend-only, no CSS/backend/schema changes, 21 new tests); D-310C live PASS (35/35), deployed Worker version not captured; D-310D resolved a GitHub push-status discrepancy (docs only); belief static baseline 57 → 78/0. Sentence creates no Claim/Truth/RunPack/fetch behavior; all existing safety copy, D-306B preview, and D-308B back links preserved. |
| Belief Engine bridge-copy precision (Export & Share Drift/Review copy) | **COMPLETE** — D-312A product pass (audited the three bridge/export copy surfaces — static Export & Share paragraph, `humanx-bridge.js`'s injected note, its post-click alert; found the static paragraph vague ("to your session") and silent on Review; deferred two `humanx-bridge.js`-internal findings to a separate, explicitly-scoped bridge-script pass); D-312B tightened only the static paragraph — replaced "session" with "Drift," added a Review reinforcement (frontend-only, no CSS/backend/schema changes, `humanx-bridge.js` untouched, 26 new tests); D-312C live PASS (39/39), deployed Worker version not captured; D-312D resolved a GitHub push-status discrepancy (docs only); belief static baseline 78 → 104/0. Copy creates no Claim/Truth/RunPack/fetch behavior; all existing safety copy, D-306B preview, D-310B Review sentence, and D-308B back links preserved. |
| Belief Engine abandoned quick-record stubs cleanup | **COMPLETE (code + deploy confirmed live)** — D-313B audit confirmed the six-item stub cluster (`n`, `v`, `buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror`) in `app-v10.js` lines 148–152 was truly dead (unreachable from all dispatch maps and `index.html`, zero test coverage); D-313C added a 14-test regression lock before allowing removal; D-313D deleted the cluster and its two stray `window.*` exports, converted the three body-lock tests to existence-lock tests, and left `promoteBelief()`/`isFullBeliefProfile`/`beliefSnapshotCard`/`belief-drift-expansion.js` display logic fully untouched. Hardening baseline 3515 → 3529/0. No backend/API/D1/schema/storage/auth/migration changes. D-313F confirmed via read-only live fetch that `public/app-v10.js` is deployed and matches local `d422985` — deploy is closed out. |
| Next Belief Engine work | **No known outstanding Belief Engine finding remains** — with navigation (D-308), result-page handoff clarity (D-310), bridge-copy precision (D-312), and the abandoned quick-record stubs (D-313, deploy confirmed live in D-313F) all now addressed, every secondary finding from the original D-306A audit is closed. Future Belief Engine work should wait for a new, real signal (a fresh audit, an owner request, or observed user confusion) rather than manufacturing another speculative polish pass. The next honest candidate is the Review-intake protocol's second/third real outside submission (D-304), which is a waiting condition, not something to start now. |
| Next beta work | **Based on additional outside submissions or direct tester feedback only** — the demo card (D-300), Step 5 (D-297), vocabulary glossary (D-302), and Review-intake protocol (D-304) together close every self-demonstration gap identified across three consecutive product passes plus establish a process for real submissions. Do not start another speculative cold-visitor or beta-readiness improvement without a concrete signal: at least 2 more logged outside submissions, a repeated confusion pattern in the D-304B intake log, direct tester feedback, or an explicit owner request. |
| Next RunPack/provenance work | **Audit-first** — F-3/F-4/F-5, provenance display, stale wording polish, boundary copy, and card copy consolidation all complete; any further RunPack backend work requires an audit task; any "analysis → Truth" action requires audit + explicit owner approval |
| Next Truth workflow work | **Audit-first** — pending-Review visibility, post-submission navigation, analysis-assisted draft, and owner workflow product polish now complete; any further Truth UX, analysis-to-Truth automation, or Review state change requires an audit task before implementation |
| Next owner-dashboard improvement | **Stop** — My HumanX polish arc (D-291→D-297) is complete as of D-298A. Owner-dashboard layout is well-ordered; profile nudge, collapsible settings, Recent Truths prominence, and beta-readiness onboarding copy are all live. Do not add further owner-dashboard improvements unless a real live friction appears and is explicitly assigned. Any change to data source, Review state visibility, or public/private boundary must still audit-first. |
| Next beta-readiness work | **Tester script or first-run checklist only if live testing shows confusion** — the Home Step 5 and My HumanX tab changes (D-297B/C) have closed the post-submit gap. No further beta-readiness copy changes are needed unless a real first-tester confusion is reported. A guided first-run checklist or onboarding wizard would require a separate spec before implementation. |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, and framing between main app and Belief Engine |
| Study page content hierarchy audit | Study page layout, section ordering, dock/content density |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| Review/Study future follow-up | Only if owner finds live friction — D-264A full run and D-265/D-266/D-267A arc are complete |
| D-245A F-4 pressure handle duplication | Separate spec — pressure cards show handle in both chips and meta |
| Duplicate canonical/merge backend spec | If owner wants an explicit merge/canonical resolution flow, needs a backend/API spec first |

---

## Backend / D1 safety rules

| Rule | Detail |
|------|--------|
| Do not rerun migration 0004 | `migrations/0004_unique_normalized_content.sql` already applied to production. Rerunning will fail. |
| Do not rerun migration 0005 | `migrations/0005_add_home_tests_updated_at.sql` was manually applied via Cloudflare D1 console. Do not rerun unless the target DB is confirmed missing `home_tests.updated_at`. |
| `claims.near_duplicate_of` is live | Column added manually via Cloudflare D1 dashboard (D-10A). `idx_claims_near_duplicate_of` index also applied. Do not attempt to re-add either. |
| Do not rerun migration 0006 against production | `migrations/0006_add_near_duplicate_of.sql` is for **fresh D1 rebuilds only**. Production already has the column and index. Applying on production will fail with "duplicate column" and "already exists" errors. Always run `PRAGMA table_info(claims)` to confirm `near_duplicate_of` is absent before executing. |
| No Wrangler / D1 commands | `wrangler d1 execute`, `wrangler deploy`, and all variants are off-limits unless the user explicitly requests them. |
| No live write smoke | `scripts/write-endpoint-smoke-test.mjs` requires explicit per-session user approval. Do not run routinely. |
| Migration 0007 applied — do not re-apply | `migrations/0007_add_evidence_review_state.sql` was applied manually via Cloudflare D1 Console on 2026-06-06 (D-42A). `evidence.review_state TEXT DEFAULT 'public'` and `evidence.report_count INTEGER DEFAULT 0` now exist in production. Both indexes confirmed present. Running the migration again will fail with "duplicate column name". Do not re-apply. Full record in `docs/D42A_EVIDENCE_MIGRATION_APPLY_RESULT.md`. |
| Migration 0017 applied — do not re-apply | `migrations/0017_analysis_results_packet_id.sql` was applied to live `humanx` D1 (f68709d8-b93a-4e5b-8a0e-5b58cc357125) in D-275D (2026-07-02). `analysis_results.packet_id TEXT` (nullable) now exists in production. Do not re-apply. Re-running will fail with "duplicate column name". |

---

## Full batch history (A-2 → D-244A)

| Batch | Commit | Change |
|-------|--------|--------|
| A-2 | — | Home command center simplified — hero copy, pipeline banner, action cards |
| A-3 | — | Claims/Study workspace streamlined — card layout, Study sections, Claim Flow |
| A-4 | — | Review admin workspace + context panel deduplication |
| A-5 | — | Drift workspace streamlined — profile vs quick record split, drift compare panel |
| A-6 | — | Submit/Truth/Evidence input forms polished |
| A-7 | `15b654e` | Live visual QA fixes — spacing, badge alignment, empty states |
| B-1 | `d3c4f40` | Functional flow audit — fixed mode/tab wiring bugs in `promoteBelief`, `convertTruth`, `studyFromVault` |
| B-2 | `f073942` | Static checks added for navigation wiring (hardening smoke section 14) |
| B-3 | `d5a3207` | Frontend ↔ Worker contract audit — fixed Evidence Vault `createdAt` field mismatch in `evidenceCard` |
| B-4 | `6c8ffd7` | Static check added for Evidence Vault `createdAt` contract; hardening smoke 76 → 77 |
| B-5 | `52db796` | Read-only smoke attempted — all local static checks passed; live read smoke blocked by local environment (see Known limitations) |
| C-1 | `601d3d0` | Public clarity pass — README, noscript, Truths terminology, empty states, Home framing |
| C-2 | `33a9669` | Review queue admin scanability — filter chips, inspect panel, state labels, audit summary |
| C-3 | `f0f950f` | Study view clarity — Claim Flow section, investigation board headers, section purpose lines |
| C-4 | `6d65ad5` | Drift workspace scanability — full-profile vs quick-record split, drift compare, badge labels |
| C-5 | `8dde730` | Claims browser scanability — meter numeric values, pressure chip, Study Claim button, empty state CTA |
| C-6 | `d834379` | Truths workspace scanability — split badges, stats row (↻/⊘), linked-claim chip, amber left border |
| C-7 | `d6eb287` | Evidence Vault scanability — stance borders, split quality/media badges, claim block guard, reuse chip |
| C-8 | `41b5c17` | RunPack export clarity — three-state layout, claim context box, Browse Claims CTA, button tooltips |
| C-9 | `0563a94` | Submit and Add Truth form clarity — better placeholders, field-type labels, removed duplicate notes |
| C-10 | `87f7752` | Docs checkpoint — batch history A-2 → C-9, next-steps updated (pushed to origin) |
| C-11 | `b9918a0` | Modal hardening — replaced native `window.prompt` in report flow with `hxModal` in-app modal |
| D-1 | `53d3879` | Workspace-aware layout — sidebar context/casefile text now reflects the active mode in every workspace |
| D-2 | `437cbc3` | RunPack builder state — three-state layout (no claim / claim selected / pack generated) made explicit |
| D-3 | `e393512` | Evidence readability — JSON/object evidence body values rendered as readable text, not `[object Object]` |
| D-4 | — | Report reason visibility audit — confirmed `reports.reason` exists in schema; identified review queue gap |
| D-4B | `dd5a903` | Report reasons in review queue — correlated subquery adds `latest_report_reason` to both claims and truths queries; rendered in `reviewCard` and `renderReviewInspectPanel` (branch → PR #77 → merged) |
| D-5 | — | Claim normalization / intake audit — full audit of `renderSubmit`, `saveClaim`, `meaningKey`, duplicate detection; identified `data.existing` silent-lie bug and UX gaps |
| D-5B-1 | `5eb54d6` | Duplicate claim response fix — `saveClaim` now handles `data.existing: true` correctly; shows "already exists" panel with Study link instead of false "submitted for Review" |
| D-5C | `6ce3fb2` | Claim-writing guidance — collapsible writing-tips section (good/avoid examples), category suggestion chips, claim-type live hint below select |
| D-9A | `0430a88` | Reused-evidence compression — Study view collapses repeated evidence entries under a single source-claim header, eliminating redundant rows |
| D-9B | `7277f98` | Study evidence/pressure grouping — Study dock groups evidence and pressure blocks by linked claim for faster scanning |
| D-9B+ | `9044a07` | Evidence Vault grouping — Vault groups entries by linked claim with claim-level headers |
| D-9C | `1951f09` | Investigation Packet / RunPack workflow clarity — dock redesigned with explicit packet framing, AI-return parsing flow, and RunPack terminology consistency |
| D-10A | `579a783` | Near-duplicate migration plan — `docs/D10_NEAR_DUPLICATE_PLAN.md` created; manual D1 SQL documented; implementation plan for D-10B written |
| D-10B | `74b390c` (PR #78) | Near-duplicate suggestions Phase 1 — `meaningMatch` wired into `createClaim`; bounded 200-candidate scan; `near_duplicate_of` written on new claim only; `saveClaim` soft warning; `reviewCard` similar badge; inspect panel field |
| D-10C | `dcf4696` (PR #79) | Near-duplicate tuning — suffix normalisation (`-s`/`-ing`/`-ed`), contraction normalisation, additional stopwords; threshold 0.8 → 0.65; 10 new smoke checks (77 → 87) |
| D-10D | `dcf4696` | Negation/contradiction safety fix — contractions now normalise to `"not"` (not stripped); `"not"` kept as real token; negation-polarity guard in `meaningMatch`; min-overlap raised for 3-token claims; 2 new D-10D smoke checks (87 → 89) |
| D-11 | `1b41992` | Review moderation clarity — `~Similar` filter chip; amber `b-similar` badge; `review-card-similar` left-border; `~Similar` audit summary stat replaces always-zero Duplicates; `Similar claim (advisory)` inspect field label; advisory note banner in inspect panel; filter help and empty-state text for similar; no merge UI |
| D-11B | `b5fef36` | Fix review similar filter regression — `nearDup` was declared inside `else { }` block (D-11) but used in `return` template outside that scope; runtime `ReferenceError` silently broke all inspect, filter, and audit-toggle interactions; hoisted to function scope; 2 new smoke checks (89 → 91) |
| D-12 | `004f0b0` | Review queue scale/quality pass — sort controls (newest / oldest / reported first / ~similar first) added to filter bar; relative age display (`reviewAge`: "3d ago", "2h ago") replaces static date on review cards; no merge UI, no `duplicate_of` writes, no `review_state='duplicate'` |
| D-13 | `21e411a` | Advisory claim quality hints — frontend-only `claimQualityHints()` heuristic; live hints in Submit; soft "needs sharpening" badge on Review cards; full hint list in Inspect panel; no blocking, no score changes, no backend changes |
| D-14 | `a12f394` | Review quality filter — `~Quality` filter chip and `~Quality first` sort option; both use `claimQualityHints()`; advisory only |
| D-15 | `49db60b` | Review inspect navigation — position indicator + Prev/Next; compact action bar before fields; bottom row preserved |
| D-16 | `5fd1b0a` | Study reused evidence compression — outer-collapse threshold 10→4; ≤3 reused items use compact rows; `.study-sub-reused` styled muted |
| D-17 | `77129c7` | Investigation Packet workflow clarity — 4-step workflow guide; "Download Packet"; "Load AI Analysis Return"; raw JSON in collapsible details |
| D-18 | `9dd1668` | Study tool dock clarity — text-only renames in `index.html`; Evidence & Pressure section head highlighted blue in study mode |
| D-19 | `18cf5c9` | Sidepanel patch stabilization — static HTML elements moved out of dynamic injection; `patchRunPackPanel()` rewired to `#aip-status` |
| D-20 | `b2f53ee` | Study dock refinement — renamed sections; static microcopy; `min-height:32px` on `.runpack-side-status`; narrow-width stacking |
| D-21 | docs-only | Visual QA audit of D-15 → D-20 — all five focus areas pass; no regressions; no code changes |
| D-22 | docs-only | D-series stabilization release checkpoint — full D-1 → D-21 summary |
| D-23 | docs-only | Planning — D-23A: RunPack provenance; D-23B: investigation graph nav audit; D-23C: backend moderation tooling plan |
| D-24A | `4aef4e5` | Study navigation context preservation — `lastModeBeforeStudy`; `lastInspectedReviewItemId`; context-aware back button |
| D-24B | `16fa131` | RunPack provenance Phase 1 — `lastPacketMeta`; `packet_id`; `runpack_version:'1.2'`; staleness advisory; no backend |
| D-24F | docs+migration | Near-duplicate migration proposal — `migrations/0006_add_near_duplicate_of.sql`; safe for fresh D1 rebuilds only |
| D-24E | `5dc33e4` | Moderator duplicate resolution frontend controls — `markDuplicateUI`, `resolveSimilarUI`; 4 new smoke checks (91→95) |
| D-24D | `f2def3b` (PR #86) | Moderator duplicate-resolution backend routes — `POST /api/review/mark-duplicate`, `POST /api/review/resolve-similar`; worker-route-static-check 35→39 |
| D-53 | docs-only | Launch seed data quality audit plan |
| D-54 | docs-only | Seed data inventory and classification |
| D-55 | docs-only | Launch seed pack draft |
| D-56 | docs-only | Launch seed source gathering checklist |
| D-57 | docs-only | Launch seed JSON draft |
| D-58 | docs-only | Seed import route safety plan |
| D-210B | `233861b` | **[Arc start]** Private Reflection Avatar concept card |
| D-210C | `60ffdf8` | Reflection Avatar live closeout |
| D-211A | `08db623` | Reflection Avatar transparency disclosure |
| D-212A | `5da4699` | Reflection Avatar hide/show (localStorage-only) |
| D-212B | `6c86c37` | D-212A live closeout |
| D-213A | `e9ecdc4` | Reflection Avatar accessibility |
| D-213B | `7ff1684` | D-213A live closeout |
| D-214A | `814a627` | Reflection Avatar regression lock (55 tests) |
| D-215A | `a5eaa97` | My HumanX privacy boundary lock (43 tests) |
| D-216A | `93783d1` | Public Profile allowlist contract (79 tests) |
| D-217A | `5c8dbe2` | Hardening smoke index — structured comment index; 20 maintainability tests |
| D-218A | `c4ba537` | Worker route warning audit — `KNOWN_PARAM_ROUTES`; 9 smoke tests |
| D-219A | `<checkpoint>` | Post-hardening checkpoint — `PROJECT_STATE.md` updated; docs only |
| D-220A | `03ff140` | **[Arc start]** Public profile visual polish — counts top; `<details>`; `pp-item-actions`; truths empty state |
| D-220B | `9ba04ae` | D-220A live closeout — 21-item sanity PASS |
| D-221A | `89ab5e1` | Public profile accessibility — focus-visible; mobile touch targets |
| D-221B | `c31dc8f` | D-221A live closeout — 20-item sanity PASS |
| D-222A | `b967601` | Public profile copy link — `pp-copy-link`; `window.location.href`; "Link copied" |
| D-222B | `c019a23` | D-222A live closeout — 24-item sanity PASS |
| D-223A | `23eea66` | Public profile section nav — `<nav>`; four anchor links; section IDs |
| D-223B | `a5e6979` | D-223A live closeout — 26-item sanity PASS |
| D-224A | `910b4db` | Public profile empty states — `pp-empty-card`; snapshot id always; Snapshot nav unconditional |
| D-224B | `053cc67` | D-224A live closeout — 25-item sanity PASS |
| D-225A | `ad01e7d` | Public profile polish regression lock — 13 cross-arc composite tests; no deploy |
| D-226A | `f286300` | Public profile milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-227A | `ad7680e` | **[Arc start]** Review queue scanability audit — docs only |
| D-227B | `ed31b9c` | Review queue selected-card anchor |
| D-227C | `958ece2` | D-227B live closeout — 20-item sanity PASS |
| D-228A | `c7d5fb0` | Review queue scroll preservation |
| D-228B | `c2a2f22` | D-228A live closeout — 25-item sanity PASS |
| D-229A | `d7b7a88` | Review queue confirm-state clarity |
| D-229B | `10aa7be` | D-229A live closeout — 23-item sanity PASS |
| D-230A | `9c6f5f1` | Review queue decision feedback |
| D-230B | `0a7863d` | D-230A live closeout — 24-item sanity PASS |
| D-231A | `9443ea6` | Review queue ergonomics regression lock (37 tests) |
| D-232A | TBD | Review ergonomics milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-233A | `cb3069d` | **[Arc start]** Duplicate review UX audit — 4 findings; 15 guard tests; docs only |
| D-233B | `27df1c7` | Resolve-similar scroll anchor parity — `scrollToReviewAnchor(claimId)` in `resolveSimilarUI` success path; 11 tests |
| D-233C | live closeout | D-233B confirmed live; 11/11 PASS |
| D-234A | `df6b524` | Similar advisory display clarity — structured banner; "Possible related claim:"; dismiss modal copy; 5 CSS sub-classes; 19 tests |
| D-234B | `b73a4c5` | D-234A confirmed live; 15/15 PASS |
| D-235A | `d30646a` | Similar advisory Copy ID — `copySimilarClaimId(id)`; Copy ID button; `user-select:all` code element; 19 tests |
| D-235B | `2564d8f` | D-235A confirmed live; 14/14 PASS |
| D-236A | `3136539` | Duplicate-target prefill — "Use as duplicate target" button; `markDuplicateUI(claimId, suggestedCanonicalId='')` optional param; prefill-only; 18 tests + 6 window fixes |
| D-236B | `f6c48ae` | D-236A confirmed live; 16/16 PASS |
| D-237A | `959b343` | Duplicate advisory workflow regression lock — 41 tests across 7 categories |
| D-238A | TBD | Duplicate advisory milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-239A | `23b6a39` | **[Arc start]** Review-to-study navigation audit — 5 findings; F-1 scroll gap identified; docs only |
| D-239B | `5c12a10` | Back-to-Review scroll restore — `requestAnimationFrame(scrollToReviewAnchor(_savedId))` in `backToArena()`; 17 tests |
| D-239C | `725f486` | D-239B confirmed live; 13/13 PASS |
| D-240A | `cab9952` | Review-to-study navigation regression lock — 30 tests across 7 categories |
| D-241A | TBD | Review-to-study navigation milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-242A | `6189bf8`/`1226341` | **[Arc start]** Review queue next-item flow audit — 7 guard tests; D-98B noscript test fixed for upstream noscript simplification |
| D-242B | `4f2e031` | "Open next item →" button in D-230A feedback banner; `reviewDecisionFeedbackNextId` state; 24 tests |
| D-242C | `443bcc6` | D-242B confirmed live; 34/34 PASS |
| D-243A | `d24b5ea` | Review next-item flow regression lock — 34 tests across 7 categories |
| D-244A | TBD | Review next-item flow milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-245A | `7bc3ec6` | **[Arc start]** Review card metadata density audit — 7 friction findings; F-1/F-2/F-3/F-4 prioritised; docs only |
| D-245B | `246bd23` | Inline date — `Updated {age}` into `.review-card-meta`; CSS `.review-card-date` removed; 14 tests |
| D-245C | `dd90094` | D-245B confirmed live; 24/24 PASS |
| D-246A | `acf7bb9` | Score label clarity — `ev:N ts:N sv:N` → `Evidence N · Test N · Survive N`; 13 tests |
| D-246B | `c4894da` | D-246A confirmed live; 28/28 PASS |
| D-247A | `ed91f29` | Advisory hint grouping — `needs sharpening` / `category echo` / `? borderline origin` to `.review-card-hints`; CSS added; 16 tests |
| D-247B | `d139e60` | D-247A confirmed live; 31/31 PASS |
| D-248A | `e310da7` | Review card metadata density regression lock — 7 categories / 41 tests |
| D-249A | TBD | Review card metadata density milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-250A | `(guard tests)` | **[Arc start]** Review search/filter clarity audit — 7 findings; 8 guard tests; docs only |
| D-250B | `(D-250C live)` | Active filter/sort summary — `renderReviewActiveSummary(list)`; 13 tests |
| D-250C | live closeout | D-250B confirmed live; 29/29 PASS |
| D-251A | `(D-251B live)` | Zero-results filter clarity — `renderReviewEmptyState()`; structured title/context/Show-all; 15 tests |
| D-251B | live closeout | D-251A confirmed live; 20/20 PASS |
| D-252A | `(D-252B live)` | Ambiguous filter helper copy — `renderReviewFilterHelper()`; exact locked copy; 20 tests |
| D-252B | live closeout | D-252A confirmed live |
| D-253A | `(D-253B live)` | Client-side Review search — `reviewSearchQuery`; `applyReviewSearch`; `renderReviewSearchRow`; `clearReviewSearch`; search-aware pipeline; 35 tests |
| D-253B | live closeout | D-253A confirmed live; 41/41 PASS |
| D-254A | `aedbd3f` | Review search/filter clarity regression lock — 9 categories / 64 tests |
| D-255A | `0b8a3a3` | Review search/filter clarity milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-256A | `3a4805e` | **[Arc start]** Duplicate/similar filter label audit — inventory of all `Dupes`/`~Similar` controls, predicates, card badges, inspect panel, action buttons; predicate analysis; docs only |
| D-256B | `f73a658` | Duplicate/similar label clarity — `Dupes` → `Dupes + Similar` copy rename in 6 locations; 26 new tests; 2877 → 2903 |
| D-256C | `7615b04` | D-256B live closeout — owner deploy PASS; 35/35 live sanity PASS |
| D-257A | `40a633b` | Duplicate/similar label clarity checkpoint addendum — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-258A | `5862e17` | **[Arc start]** Review mobile controls/action wrapping audit — 7 risk findings; 15-group control inventory; docs only |
| D-258B | `f18db9c` | Review mobile control wrapping polish — sort bar isolation; decision feedback flex-wrap; empty-actions flex; 21 tests |
| D-258C | `5b8d667` | D-258B live closeout — owner deploy PASS; 39/39 live sanity PASS |
| D-259A | `8e36fdc` | Review mobile control wrapping regression lock — 35 tests across 7 categories |
| D-260A | `2f072f6` | Review mobile controls wrapping checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-261A | `036b459` | **[Arc start]** Review inspect panel action density audit — 7 sections; 6 risk findings; docs only |
| D-261B | `246974a` | Inspect panel action spacing polish — desktop Study push; mobile full-width; mobile soft separator; 19 tests |
| D-261C | `ac3e279` | D-261B live closeout — owner deploy PASS; 41/41 live sanity PASS; Worker `cb5caf6f` |
| D-262A | `92ca239` | Inspect panel action spacing regression lock — 33 tests across 7 categories |
| D-263A | `b9b2c97` | Review inspect panel action spacing checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-264A | TBD | Review ergonomics milestone wrap-up — full D-227→D-263 run summary; safe-next rules 60–65; docs only; no deploy |
| D-265A | `bf45c87` | **[Arc start]** Study entry / Back button style consistency audit — 14-button inventory; 8 friction findings; docs only |
| D-265B | `092d6fc` | Study entry / Back button style consistency — 4 CSS/copy changes; `.btn-back-study` CSS rule; 24 tests |
| D-265C | `22d99e9` | D-265B live closeout — owner deploy PASS; 39/39 live sanity PASS |
| D-266A | `225ab30` | Study entry / Back button style regression lock — 40 tests across 8 categories |
| D-267A | `d8275d0` | Study entry / Back button style checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-268A | `970daf7` | **[Arc start]** Claim/RunPack flow clarity audit — 6-step flow inventory; 7 friction findings (F-2/F-1 addressed, F-3/F-4/F-5 deferred); docs only |
| D-268B | `732774c` | RunPack fallback guidance + generated-time summary — `instruction`/`output_contract` added to fallback packet; `rpRelativeTime()` helper; `rp-summary-generated` row; 25 tests |
| D-268C | `e582d3d` | D-268B live closeout — owner deploy PASS; 36/36 live sanity PASS |
| D-269A | `3a86b10` | RunPack fallback guidance/generated-time regression lock — 44 tests across 7 categories |
| D-270A | `6be4164` | RunPack fallback guidance/generated-time checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-271A | `f948b0e` | **[Arc start]** RunPack AI-return import visibility polish — `rp-return-section` auto-expands on matching RunPack; `rp-return-next-step` no-auto-publish copy; 27 tests |
| D-271B | `cc4fec6` | D-271A live closeout — owner deploy PASS; 32/32 live sanity PASS; deployed Worker version not captured |
| D-272A | `7d6d2bc` | RunPack AI-return import visibility regression lock — 46 tests across 7 categories; D-93B allowlist extended |
| D-273A | `checkpoint` | RunPack AI-return import visibility checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-274A | `audit` | F-4 snapshot-hash stale detection audit — feasibility confirmed; frontend-only via `simpleClaimHash(selected)` vs `meta.source_snapshot_hash`; docs only |
| D-274B | `(D-274C live)` | F-4 stale detection — single `if` block in `detectPacketStaleness()`; 22 new tests + 3 flipped; baseline 3217 → 3239 |
| D-274C | live closeout | D-274B owner deploy PASS; 24/24 live sanity PASS; deployed Worker version not captured |
| D-275A | `audit` | F-5 packet-ID storage audit — NOT frontend-only; schema migration required; docs only |
| D-275B | `branch` | Migration `0017_analysis_results_packet_id.sql`; `src/analysis-results.js`; `public/app-v10.js`; 20 new tests + 3 fixes; baseline 3239 → 3263; branch `d275b-runpack-packet-id-storage` |
| D-275C | `review` | Pre-merge 22-item checklist; no blocker; docs only on branch |
| D-275D | `merge+deploy` | Branch merged to main; D1 migration `0017` applied; owner deploy PASS; 22/22 live sanity PASS; Worker `759acc15-a6dd-4e50-a070-0d3356e5c257` |
| D-276A | `checkpoint` | RunPack provenance checkpoint — `PROJECT_STATE.md` updated; baseline 3263/0/24/57; docs only; no deploy |
| D-277A | `audit` | Saved analysis provenance visibility audit — `packetId` not rendered; frontend-only safe; docs only |
| D-277B | `(D-277C live)` | `analysisItem()` conditional provenance line `Saved from RunPack: ${esc(a.packetId)}`; 25 new tests; baseline 3263 → 3288 |
| D-277C | live closeout | D-277B owner deploy PASS; 22/22 live sanity PASS; deployed Worker version not captured |
| D-278A | `checkpoint` | Saved analysis provenance visibility checkpoint — `PROJECT_STATE.md` updated; baseline 3288/0/24/57; docs only; no deploy |
| D-279A | `audit` | Owner RunPack workflow continuity audit — workflow complete; F-2 wording polish identified; docs only |
| D-279B | `(D-279C live)` | `detectPacketStaleness()` wording: `source snapshot changed` → `claim updated since packet`; 10 new tests; baseline 3288 → 3298 |
| D-279C | live closeout | D-279B owner deploy PASS; 21/21 live sanity PASS; deployed Worker version not captured |
| D-280A | `checkpoint` | Owner RunPack workflow wording checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-281A | `audit` | Saved analysis ↔ Truth boundary audit — boundary structurally sound; F-1/F-2 copy gaps identified; docs only |
| D-281B | `(D-281C live)` | Saved analysis private/no-auto-publish copy polish — `sectionAnalyses()` + `analysisItem()` copy added; 19 new tests; baseline 3298 → 3317 |
| D-281C | live closeout | D-281B owner deploy PASS; 25/25 live sanity PASS; deployed Worker version not captured |
| D-282A | `dbb6f75` | Saved analysis to Truth boundary checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
| D-283A | `e6ab0d0` | Truth drafting and Review workflow audit — 21 questions; three creation paths confirmed; Review gate confirmed; no code changes; docs only; no deploy |
| D-284A | `cb0d150` | Truth drafting and Review workflow checkpoint — `PROJECT_STATE.md` updated; safe-next rules 93–95 added; docs only; no deploy |
| D-285A | `d76680a` | Owner pending-Review Truth visibility audit — 21 questions; key finding: `GET /api/my-humanx` already returns pending truths; D-283A/D-284A F-1 overstated; D-285B classified frontend-only; docs only; no deploy |
| D-285B | `3aea36c` | Post-submit navigation to My HumanX — `submitTruth`, `submitBuilderTruth`, `promoteBelief('truth')` all navigate to `renderMe()`/`tab-me`; new toast copy; 20 new tests; baseline 3317 → 3337; deploy needed |
| D-285C | `685e54e` | D-285B live closeout — owner deploy PASS; 25/25 live sanity PASS; deployed Worker version not captured |
| D-286A | `4c8e956` | Owner pending-Review Truth visibility checkpoint — `PROJECT_STATE.md` updated; safe-next rules 96–98 added; baseline updated to 3337/0/24/57; docs only; no deploy |
| D-287A | `88ed4ed` | Saved analysis assisted Truth draft audit — 23 questions; safe prefill source `plainLanguageSummary`; `verdict` blocked; D-287B classified frontend-only; docs only; no deploy |
| D-287B | `d96a6a1` | Saved analysis assisted Truth draft — `draftTruthFromAnalysis()` added; "Draft Truth from analysis" button in `analysisItem()`; prefill-only; 23 new tests; baseline 3337 → 3360; deploy needed |
| D-287C | `1559793` | D-287B live closeout — owner deploy PASS; 31/31 live sanity PASS; deployed Worker version not captured |
| D-288A | `80877ec` | Saved analysis assisted Truth draft checkpoint — `PROJECT_STATE.md` updated; safe-next rules 99–101 added; baseline confirmed 3360/0/24/57; docs only; no deploy |
| D-289A | `audit` | Owner workflow product pass — 15 questions; stacked ev-origin-note paragraphs identified as highest friction; D-289B classified frontend-only; docs only |
| D-289B | `(D-289C live)` | `analysisItem()` card copy consolidation — three stacked notes → one compact line; 23 new tests + 8 updated; baseline 3360 → 3383 |
| D-289C | live closeout | D-289B owner deploy PASS; 33/33 live sanity PASS; deployed Worker version not captured |
| D-290A | `checkpoint` | Owner workflow product polish checkpoint; docs only; no deploy; baseline unchanged 3383/0/24/57 |
| D-291A | `audit` | My HumanX product pass — 19 questions; Recent Truths buried at position 12; D-291B classified frontend-only; docs only |
| D-291B | `(D-291C live)` | `renderMeHtml()` Recent Truths reorder + Review explanation; 20 new tests + 2 updated; baseline 3383 → 3405 |
| D-291C | live closeout | D-291B owner deploy PASS; 24/24 live sanity PASS; deployed Worker version not captured |
| D-292A | `checkpoint` | My HumanX Recent Truths prominence checkpoint; docs only; no deploy; baseline unchanged 3405/0/24/57 |
| D-293A | `audit` | My HumanX dashboard product pass — 15 questions; Profile Settings always-open identified; D-293B classified frontend-only; docs only |
| D-293B | `(D-293C live)` | `meProfileSettingsHtml()` `<details>/<summary>` wrap; 15 new tests; baseline 3405 → 3424 |
| D-293C | live closeout | D-293B owner deploy PASS; 27/27 live sanity PASS; deployed Worker version not captured |
| D-294A | `checkpoint` | My HumanX collapsible Profile Settings checkpoint; docs only; no deploy; baseline unchanged 3424/0/24/57 |
| D-295A | `audit` | My HumanX "Needs attention" product pass — 18 questions; general strip ruled out; D-295B candidate profile-setup nudge; docs only |
| D-295B | `(D-295C live)` | `renderMeHtml()` profileNudge const — `!profile_public && !profile_slug` condition; 18 new tests + 7 slice fixes; baseline 3424 → 3442 |
| D-295C | live closeout | D-295B owner deploy PASS; 27/27 live sanity PASS; deployed Worker version not captured |
| D-296A | `caee055` | My HumanX profile setup nudge checkpoint — `PROJECT_STATE.md` updated; safe-next rules 111–113 added; baseline confirmed 3442/0/24/57; docs only; no deploy |
| D-297A | `b4d29dd` | HumanX beta readiness product pass — 22 questions; post-submit path unguided identified as top gap; "Me" tab label gap identified; D-297B candidate frontend-only; docs only; no deploy |
| D-297B | `e636ec0` | Home Step 5 added to "Start here" strip; "Me" tab label → "My HumanX" (`tab-me` preserved); 18 new tests + 4 existing updates; baseline 3442 → 3462; deploy needed |
| D-297C | `f1921af` | D-297B live closeout — owner deploy PASS; 25/25 live sanity PASS; deployed Worker version not captured |
| D-298A | this commit | **[Current]** Beta readiness Home Step 5 and My HumanX tab checkpoint — `PROJECT_STATE.md` updated; safe-next rules 114–116 added; baseline confirmed 3462/0/24/57; docs only; no deploy |
