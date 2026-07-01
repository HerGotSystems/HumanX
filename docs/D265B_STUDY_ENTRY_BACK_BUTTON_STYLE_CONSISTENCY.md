# D-265B — Study Entry / Back Button Style Consistency

**Scope:** Frontend copy/CSS/tests/docs
**Status:** COMPLETE — deploy needed (app/CSS changed)
**Baseline:** 3035 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D265B_STUDY_ENTRY_BACK_BUTTON_STYLE_CONSISTENCY.md`, `docs/README.md`
**CSS changes:** Yes — `.btn-back-study` rule added to `public/styles.css`
**App changes:** Yes — 4 copy/class changes in `public/app-v10.js`
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes — owner manual terminal deploy required + D-265C live closeout

---

## Purpose

Applies the smallest safe style/copy consistency patch from D-265A. Addresses the two HIGH and four MEDIUM friction findings identified in D-265A without changing navigation behavior, scroll restoration, or any moderation/advisory semantics.

---

## D-265A Findings Addressed

| Finding | Severity | Status |
|---------|----------|--------|
| F-1: Inspect panel claim Study has `primary` class; evidence/pressure/truth Study buttons do not — false hierarchy | HIGH | Fixed: `primary` removed from claim Study button |
| F-2: All 5 Back navigation buttons have no CSS class — browser-default styling | HIGH | Fixed: `btn-back-study` class added to all 5 Back buttons |
| F-3: Icon inconsistency `↗` vs `→` | MEDIUM | Partial: not changed in this slice (Truths page / My HumanX out of scope for this CSS-only pass) |
| F-4: Evidence card Study button classless | MEDIUM | Fixed: `btn-link-small` class added to evidence card Study button |
| F-5: Advisory field Study different appearance | MEDIUM | No change — `btn-link-small` already applied; appearance accepted as-is |
| F-6: Linked claim field shows raw claim ID | MEDIUM | Fixed: label changed from `{claimId} ↗` to `Study linked claim ↗` |
| F-7: Label variety | LOW | Not addressed in this slice |
| F-8: D-261B scope limited to inspect panel | LOW | No change needed |

---

## Exact Study Button Style / Copy Changes

### Change 1 — Remove false hierarchy from inspect panel claim Study button

**File:** `public/app-v10.js`, `renderReviewInspectPanel` (line 437)

| | Before | After |
|--|--------|-------|
| Class | `primary btn-study-review` | `btn-study-review` |
| Label | `Open Study View ↗` | `Open Study View ↗` (unchanged) |
| Handler | `openReviewClaimStudy(id)` | `openReviewClaimStudy(id)` (unchanged) |

**Why:** The `primary` class created a false visual hierarchy within the inspect panel — the claim Study button appeared more prominent than the evidence/pressure/truth Study buttons, even though they all serve the same user intent. `.btn-study-review` already has its own gradient background rule (D-261B) and does not need `primary` to be visually distinct.

### Change 2 — Fix raw claim ID label on Linked Claim field

**File:** `public/app-v10.js`, `renderReviewInspectPanel` truth branch (line 437)

| | Before | After |
|--|--------|-------|
| Label | `${esc(linked)} ↗` (raw claim ID) | `Study linked claim ↗` |
| Class | `btn-link-small` | `btn-link-small` (unchanged) |
| Handler | `openReviewClaimStudy(linked)` | `openReviewClaimStudy(linked)` (unchanged) |

**Why:** The raw claim ID label (`${esc(linked)} ↗`) exposed the internal ID as the button text, which is confusing to read. The ID is already displayed in the Linked Claim field value. The new label `Study linked claim ↗` is descriptive and consistent with other Study entry labels.

### Change 3 — Add `btn-link-small` and `↗` to evidence card Study button

**File:** `public/app-v10.js`, `evidenceCard` (line 179)

| | Before | After |
|--|--------|-------|
| Class | *(none)* | `btn-link-small` |
| Label | `Study Linked Claim` | `Study Linked Claim ↗` |
| Handler | `studyFromVault(claimId)` | `studyFromVault(claimId)` (unchanged) |

**Why:** The evidence card Study button had no CSS class — plain browser-default appearance. The vault group header uses `btn-link-small` for the same function (`studyFromVault`). Adding `btn-link-small` makes them visually consistent. Adding `↗` makes the icon consistent with item 6 (vault group header).

---

## Exact Back-to-Review Style / Copy Changes

### Change 4 — Add `btn-back-study` class to all 5 Back navigation buttons

**File:** `public/app-v10.js`, `renderStudy` (line 456)

| | Before | After |
|--|--------|-------|
| Class | *(none)* | `btn-back-study` |
| Copy | `← Back to Review` / `← Back to Vault` / etc. | Unchanged |
| Handler | `data-action="backToArena"` | `data-action="backToArena"` (unchanged) |

All 5 back button variants (`← Back to Review`, `← Back to Vault`, `← Back to Truths`, `← Back to My HumanX`, `← Back to Claims`) now share `class="btn-back-study"`.

**New CSS (added to `public/styles.css` after `.study-nav`):**

```css
/* D-265B: Back navigation button — calm secondary affordance in study-nav */
.btn-back-study{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:var(--muted);padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer}
.btn-back-study:hover{background:rgba(255,255,255,.10);color:var(--text)}
```

Style is calm — subtle translucent fill, muted text color, small rounded border — consistent with the study-nav context and clearly distinct from Study entry buttons (which use gradient fills) and moderation buttons (which use color-coded fills).

---

## Raw Claim ID Label Handling

The `{claimId} ↗` label (D-265A item 5) in the Linked Claim field row of the inspect panel (truth items) has been replaced with `Study linked claim ↗`. The linked claim ID is still visible in the Linked Claim field value as a code element, so no information is lost — only the button label text changed.

---

## Navigation Behavior Unchanged

| Guarantee | Status |
|-----------|--------|
| `openReviewClaimStudy` behavior | Unchanged |
| `studyFromVault` behavior | Unchanged |
| `backToArena()` behavior | Unchanged |
| Back-to-Review scroll restore (`requestAnimationFrame(() => scrollToReviewAnchor(_savedId))`) | Unchanged |
| Review search/filter/sort context preservation | Unchanged |
| Search-aware inspect prev/next pipeline | Unchanged |
| "Open next item →" behavior | Unchanged |
| `lastModeBeforeStudy` / `lastInspectedReviewItemId` state | Unchanged |
| `data-action="backToArena"` delegation | Unchanged |

---

## D-261B Inspect Action Spacing Guarantees Preserved

| Rule | Status |
|------|--------|
| `.review-inspect-actions .btn-study-review{margin-left:auto}` desktop push | Present and unchanged |
| `.review-inspect-actions button{width:100%}` mobile full-width | Present and unchanged |
| `.review-inspect-actions .review-inspect-markdup` separator | Present and unchanged |
| `.review-inspect-actions .review-inspect-resolvesim` separator | Present and unchanged |
| `btn-study-review` class emitted by `renderReviewInspectPanel` | Still emitted |

---

## Moderation Actions Unchanged

| Handler | Status |
|---------|--------|
| `requestApproveReview` | Unchanged |
| `requestRejectReview` | Unchanged |
| `markDuplicateUI` | Unchanged |
| `resolveSimilarUI` | Unchanged |
| `reviewDecisionUI` | Unchanged |
| Approve/Keep/Reject/Archive routes | Unchanged |

---

## Duplicate/Advisory Semantics Unchanged

- `Mark Duplicate...` label, handler, and behavior: unchanged
- `Dismiss ~Similar` label, handler, and behavior: unchanged
- `near_duplicate_of` advisory semantics: unchanged
- `↗ Study` in advisory field (item 4): unchanged
- `Use as duplicate target` / `Copy ID`: unchanged

---

## D-245→D-264 Review Ergonomics Locks Preserved

All 315 lock tests (D-231A, D-237A, D-240A, D-243A, D-248A, D-254A, D-259A, D-262A) continue to pass at `3035 passed, 0 failed`. No existing lock tests were modified by D-265B.

---

## Public / Privacy Guarantees

- `btn-back-study` confirmed absent from `renderPublicProfileHtml` — D-265B test 21.
- No new admin-only Review or Study controls exposed on public profile pages.
- `PUBLIC_PROFILE_ALLOWED_MARKERS` contract unchanged.
- D-216A denylist unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not modified by D-265B. Confirmed by D-265B test 24.

---

## No-Touch Guarantees

- `src/worker.js` — not modified
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No Review decision handler changes
- No moderation semantic changes
- No `selectClaim`, `attachEvidencePrompt` changes
- `alignment_labels` remains disabled
- `top_beliefs_json` remains blocked from public API responses

---

## Tests Added (24 new — scripts/hardening-smoke-test.mjs)

New baseline: `3035 passed, 0 failed` (was 3011).

| # | Category | Test |
|---|----------|------|
| 1 | Study entry | `renderReviewInspectPanel` emits `Open Study View ↗` |
| 2 | Study entry | Inspect panel Study still calls `openReviewClaimStudy` |
| 3 | Study entry | Inspect panel claim Study does not use `primary btn-study-review` (false hierarchy removed) |
| 4 | Study entry | Inspect panel Study keeps `btn-study-review` class |
| 5 | D-261B compat | Desktop Study push `margin-left:auto` still in CSS |
| 6 | Study entry | `evidenceCard` Study button uses `btn-link-small` |
| 7 | Study entry | Advisory field `↗ Study` control still present |
| 8 | Study entry | `Study Parent Claim ↗` label unchanged |
| 9 | Study entry | Linked claim field uses `Study linked claim ↗` instead of raw ID |
| 10 | Back button | `renderStudy` emits `btn-back-study` class on Back button |
| 11 | Back button | `← Back to Review` copy present in `renderStudy` |
| 12 | Back button | `← Back to Vault` and `← Back to Truths` copy present |
| 13 | Back button | `backToArena` still defined |
| 14 | Back button | Scroll restoration `requestAnimationFrame` unchanged in `backToArena` |
| 15 | Behavior | Search pipeline `applyReviewSort(applyReviewSearch(applyReviewFilter(` unchanged |
| 16 | Behavior | Search-aware inspect prev/next pipeline unchanged |
| 17 | Behavior | `Open next item →` still emitted in `renderReviewList` |
| 18 | Behavior | `requestApproveReview` and `requestRejectReview` unchanged |
| 19 | Behavior | `markDuplicateUI` and `resolveSimilarUI` unchanged |
| 20 | D-261B compat | Mobile full-width inspect buttons rule preserved |
| 21 | Public boundary | `btn-back-study` not in `renderPublicProfileHtml` |
| 22 | CSS | `.btn-back-study` CSS rule present in `styles.css` |
| 23 | Deploy integrity | `worker.js` not modified by D-265B |
| 24 | Boundary | `belief-drift-expansion.js` not modified by D-265B |

---

## Live Sanity Checklist (Pending Owner Deploy)

The following items should be verified in browser after owner manual terminal deploy:

1. Study page Back button appears visually — no longer plain browser-default styling
2. `← Back to Review` button has subtle fill/border from `.btn-back-study`
3. `← Back to Vault` button has same `.btn-back-study` appearance
4. `← Back to Truths` button has same `.btn-back-study` appearance
5. `← Back to My HumanX` button has same `.btn-back-study` appearance
6. `← Back to Claims` button has same `.btn-back-study` appearance
7. Clicking any Back button navigates correctly — no behavior change
8. Back-to-Review scroll restoration still works — returns to inspect panel card
9. Inspect panel claim Study button (`Open Study View ↗`) no longer has elevated `primary` styling — appears same weight as `Study Parent Claim ↗` and `Study Linked Claim ↗`
10. Inspect panel claim Study button still has gradient background from `btn-study-review`
11. Evidence card Study button (`Study Linked Claim ↗`) appears as a small link-style button (matching vault group header)
12. Linked Claim field row (truth items, public linked claim) shows `Study linked claim ↗` instead of raw claim ID
13. All moderation actions (Approve / Keep / Reject / Mark Duplicate / Dismiss ~Similar) still work correctly
14. No public profile changes — Study/Back controls not visible on public profile pages
15. No backend/API/migration/schema/CSP/external asset changes confirmed

---

## Baseline Confirmation

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3035 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`
