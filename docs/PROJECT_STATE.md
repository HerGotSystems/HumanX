# HumanX Project State Checkpoint

Last updated: 2026-07-01 after D-244A review next-item flow milestone checkpoint.
Previous checkpoint: 2026-06-29 after D-241A review-to-study navigation milestone checkpoint.

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

---

## Current baseline (as of D-244A)

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
| `hardening-smoke-test.mjs` | `2638 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
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
| D-244A (this task) | Docs only — **no deploy needed** |
| **Current deploy needed** | **No** |

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
| Compact review card metadata/status chips audit | Denser card for long queues — better scan without opening inspect panel |
| Review search/filter clarity | Filter chip accessibility; filter counts; empty-state copy per-filter |
| Study entry button style consistency | D-239A F-2–F-4: button prominence, browser-back support, Study entry button style inconsistency |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
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
| D-244A | TBD | **[Current]** Review next-item flow milestone checkpoint — `PROJECT_STATE.md` updated; docs only; no deploy |
