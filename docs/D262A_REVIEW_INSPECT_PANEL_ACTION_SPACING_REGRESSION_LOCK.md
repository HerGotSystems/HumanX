# D-262A — Review Inspect Panel Action Spacing Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3011 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D262A_REVIEW_INSPECT_PANEL_ACTION_SPACING_REGRESSION_LOCK.md`, `docs/README.md`
**CSS changes:** None
**App changes:** None (`public/app-v10.js` not touched)
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Locks the D-261A/B/C inspect-panel action spacing polish so future CSS or UI work cannot accidentally remove:

- Desktop Study push (`margin-left:auto` on `.review-inspect-actions .btn-study-review`)
- Mobile full-width inspect tap targets (`width:100%` on `.review-inspect-actions button`)
- Mobile soft visual separator before duplicate/advisory actions (`.review-inspect-markdup` / `.review-inspect-resolvesim`)
- All inspect action behavior and label guarantees

This is tests-only. No UI changes.

---

## D-261A / D-261B / D-261C Summary

| Task | Type | What it did |
|------|------|-------------|
| D-261A | Audit | Full inspect panel action inventory. 7 risk findings. F-1 HIGH: no visual grouping at ≤600px. F-4 MEDIUM: no explicit `width:100%`. Docs only. |
| D-261B | CSS polish | 3 CSS additions: desktop Study push, mobile full-width buttons, mobile soft separator + Study column reset. 19 lock tests. | 
| D-261C | Live closeout | Owner deploy PASS. Deployed Worker: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2`. 41/41 live sanity PASS. |

---

## What Is Now Locked

### Desktop Study Push

- `.review-inspect-actions .btn-study-review{margin-left:auto}` exists outside any media block.
- `btn-study-review` class is still emitted by `renderReviewInspectPanel`.
- Study label variants (`Open Study View ↗`, `Study Parent Claim ↗`, `Study Linked Claim ↗`) unchanged.
- Study behavior (`openReviewClaimStudy`) unchanged.

### Mobile Full-Width Inspect Buttons

- Review `@media(max-width:600px)` block exists and contains `.review-inspect-actions{flex-direction:column}`.
- `.review-inspect-actions button{width:100%}` is present in the Review mobile block.
- All inspect action labels remain unchanged.

### Mobile Duplicate/Advisory Soft Separator

- `.review-inspect-markdup` has `margin-top` in Review mobile block.
- `.review-inspect-resolvesim` has `margin-top` in Review mobile block.
- Separator uses calm `border-top` — not error/destructive red (`var(--red)`, `#ff0000`, `#cc0000`).
- `Mark Duplicate...` and `Dismiss ~Similar` labels unchanged.

### CSS-Only / No-Markup / No-Copy Guarantees

- `public/app-v10.js` not modified by D-261B or D-262A.
- `public/styles.css` not modified by D-262A (lock only).
- `public/belief-drift-expansion.js` not modified.
- No copy changes — all button labels unchanged.
- No markup changes — inspect panel HTML structure unchanged.

---

## Exact CSS Classes Locked

| Class | Rule | Context |
|-------|------|---------|
| `.review-inspect-actions .btn-study-review` | `margin-left:auto` | Desktop (no media query) |
| `.review-inspect-actions button` | `width:100%` | `@media(max-width:600px)` Review block |
| `.review-inspect-actions .review-inspect-markdup` | `margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)` | `@media(max-width:600px)` Review block |
| `.review-inspect-actions .review-inspect-resolvesim` | same as above | `@media(max-width:600px)` Review block |
| `.review-inspect-actions .btn-study-review` | `margin-left:0` (reset) | `@media(max-width:600px)` Review block |

---

## Behavior Guarantees Preserved

| Guarantee | D-262A test |
|-----------|------------|
| Approve behavior — `requestApproveReview` still called | test 16 |
| Keep Pending behavior — `reviewDecisionUI(...,'review')` | test 22 (reviewDecisionUI lock) |
| Reject behavior — `requestRejectReview` still called | test 17 |
| Mark Duplicate behavior — `markDuplicateUI` still called | test 18 |
| Dismiss ~Similar behavior — `resolveSimilarUI` still called | test 19 |
| Use as duplicate target — `markDuplicateUI` | test 18 |
| Study behavior — `openReviewClaimStudy` still called | test 5 |
| Search-aware inspect prev/next — `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` | test 20 |
| "Open next item →" — still emitted in `renderReviewList` | test 21 |
| Decision feedback — `reviewDecisionUI` still defined | test 22 |
| Duplicate/advisory semantics — `markDuplicateUI` / `resolveSimilarUI` unchanged | tests 18–19 |
| Moderation actions — Approve/Keep/Reject/Archive paths unchanged | tests 16–17, 22 |

---

## Cross-Arc Compatibility Preserved

| D-arc | Guarantee | D-262A test |
|-------|-----------|------------|
| D-245B | Review card inline date fields still referenced | test 23 |
| D-256 | `Dupes + Similar` filter chip label unchanged | test 24 |
| D-258B | `.review-sort-bar` CSS still present | test 25 |
| D-258B | `.review-decision-feedback` `flex-wrap` still present | test 26 |
| D-259A | `renderReviewList` pipeline unchanged | test 27 |

---

## Public / Privacy Guarantees

- `.review-inspect-actions` absent from `renderPublicProfileHtml` — test 28.
- `btn-study-review` absent from `renderPublicProfileHtml` — test 29.
- Review inspect-action spacing is entirely internal/admin Review queue surface.
- Public profile allowlist (`PUBLIC_PROFILE_ALLOWED_MARKERS`) contract unchanged.
- D-216A denylist unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` not modified by D-261A, D-261B, D-261C, or D-262A. Confirmed by test 30.

---

## Worker Known-Warning State

`worker-route-static-check.mjs`: `57 passed, 0 failed / 1 known warn`

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Tests Added (33 new — hardening-smoke-test.mjs)

### Category 1 — Desktop Study push lock (5 tests)

| # | Test |
|---|------|
| 1 | `.review-inspect-actions .btn-study-review` has `margin-left:auto` |
| 2 | Desktop Study push rule is not inside a media block |
| 3 | `btn-study-review` class still emitted by `renderReviewInspectPanel` |
| 4 | Study label variants unchanged |
| 5 | Study action still calls `openReviewClaimStudy` |

### Category 2 — Mobile full-width inspect buttons lock (5 tests)

| # | Test |
|---|------|
| 6 | Review mobile media block exists (`.review-inspect-actions{flex-direction:column}`) |
| 7 | `.review-inspect-actions button{width:100%}` in Review mobile block |
| 8 | Approve label unchanged |
| 9 | Keep Pending label unchanged |
| 10 | Reject label unchanged |

### Category 3 — Duplicate/advisory soft separator lock (5 tests)

| # | Test |
|---|------|
| 11 | `.review-inspect-markdup` has `margin-top` in Review mobile block |
| 12 | `.review-inspect-resolvesim` has `margin-top` in Review mobile block |
| 13 | Separator uses calm `border-top`, not destructive red |
| 14 | `Mark Duplicate...` label unchanged |
| 15 | `Dismiss ~Similar` label unchanged |

### Category 4 — Inspect action behavior lock (7 tests)

| # | Test |
|---|------|
| 16 | `requestApproveReview` still called from inspect panel |
| 17 | `requestRejectReview` still called from inspect panel |
| 18 | `markDuplicateUI` still called from inspect panel |
| 19 | `resolveSimilarUI` still called from inspect panel |
| 20 | Search-aware inspect prev/next pipeline unchanged |
| 21 | "Open next item →" still emitted in `renderReviewList` |
| 22 | `reviewDecisionUI` still defined |

### Category 5 — Cross-arc compatibility lock (5 tests)

| # | Test |
|---|------|
| 23 | D-245B inline date still locked |
| 24 | D-256 `Dupes + Similar` label unchanged |
| 25 | D-258B `.review-sort-bar` CSS present |
| 26 | D-258B `.review-decision-feedback` `flex-wrap` present |
| 27 | D-259A `renderReviewList` pipeline unchanged |

### Category 6 — Public/Drift/backend boundary lock (3 tests)

| # | Test |
|---|------|
| 28 | `review-inspect-actions` not in `renderPublicProfileHtml` |
| 29 | `btn-study-review` not in `renderPublicProfileHtml` |
| 30 | `belief-drift-expansion.js` not modified |

### Category 7 — Deploy integrity lock (3 tests)

| # | Test |
|---|------|
| 31 | `app-v10.js` not modified by D-262A |
| 32 | `styles.css` not modified by D-262A |
| 33 | `worker.js` not modified by D-262A |

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-262A
- `public/styles.css` — not modified by D-262A
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No public profile changes

---

## Future Rule

Any future change to the Review inspect panel action area — including any CSS touching `.review-inspect-actions`, `.btn-study-review`, `.review-inspect-markdup`, or `.review-inspect-resolvesim` — must:

1. Keep all D-261B and D-262A lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-262B (or higher) task documenting exactly what changed and why.
