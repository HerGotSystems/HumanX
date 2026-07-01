# D-259A — Review Mobile Control Wrapping Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — deploy not needed
**Baseline:** 2959 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Previous baseline:** 2924 (D-258B/C)
**New tests added:** 35
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D259A_REVIEW_MOBILE_CONTROL_WRAPPING_REGRESSION_LOCK.md`, `docs/README.md`
**CSS changes:** None
**App changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Locks the D-258B/C mobile/wrapping polish so future Review CSS or UI work cannot accidentally remove:

- Sort bar layout isolation (`.review-sort-bar`, `.review-sort-label`, `.review-sort-select`)
- Decision feedback wrapping (`.review-decision-feedback` flex-wrap, button flex-shrink:0)
- Empty-action spacing/stacking (`.review-empty-actions` flex + flex-wrap + gap)
- Existing Review behavior guarantees (pipeline, prev/next, filter labels, duplicate semantics)
- Public/privacy boundary (Review CSS not exposed in public profile render path)

---

## D-258A/B/C Summary

| Task | Description |
|------|-------------|
| D-258A | Audit — identified F-1 HIGH (sort bar no CSS), F-2 HIGH (feedback no flex-wrap), F-4 MEDIUM (empty actions no flex) |
| D-258B | CSS fix — added sort bar rules, added flex-wrap to feedback, converted empty actions to flex |
| D-258C | Live closeout — 39/39 live sanity PASS after owner deploy |

---

## What Is Now Locked

### Sort-bar CSS isolation/wrapping

- `.review-sort-bar` CSS rule exists with `display:flex`, `flex-wrap`, and `gap`
- `.review-sort-label` CSS rule exists (`white-space:nowrap;flex-shrink:0`)
- `.review-sort-select` CSS rule exists with `min-width` anti-crush protection
- `renderReviewFilterBar` render path emits all three classes
- `renderReviewFilterBar` calls `setReviewSort` — sort behavior unchanged

### Decision-feedback wrapping

- `.review-decision-feedback` CSS rule exists with `flex-wrap`
- `.review-feedback-next` has `flex-shrink:0` — button cannot be crushed
- `.review-feedback-dismiss` has `flex-shrink:0` — button cannot be crushed
- `.review-feedback-msg` has `min-width:0` — text wraps safely
- `renderReviewList` emits "Open next item →" button
- `renderReviewList` emits Dismiss (`clearReviewDecisionFeedback`) button

### Empty-actions wrapping/stacking

- `.review-empty-actions` CSS rule exists with `display:flex`, `flex-wrap`, and `gap`
- `renderReviewEmptyState` contains `clearReviewSearch` (Clear search action)
- `renderReviewEmptyState` contains "Show all review items" action

### CSS-only / no copy change guarantee

- `public/app-v10.js` does not contain `D-259A` — tests-only task
- `public/styles.css` does not contain `D-259A` — no CSS changed by D-259A
- `src/worker.js` does not contain `D-259A`
- `public/belief-drift-expansion.js` does not contain `D-259A`

---

## Exact CSS Classes Locked

| Class | Lock |
|-------|------|
| `.review-sort-bar` | flex layout, flex-wrap, gap — must not be removed |
| `.review-sort-label` | sort label isolation rule — must not be removed |
| `.review-sort-select` | min-width anti-crush — must not be removed |
| `.review-decision-feedback` | flex-wrap — must not be removed |
| `.review-feedback-next` | flex-shrink:0 — must not be removed |
| `.review-feedback-dismiss` | flex-shrink:0 — must not be removed |
| `.review-feedback-msg` | min-width:0 — must not be removed |
| `.review-empty-actions` | display:flex, flex-wrap, gap — must not be removed |

---

## Behavior Guarantees Preserved

| Guarantee | Status |
|-----------|--------|
| Search/filter/sort pipeline: `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))` in `renderReviewList` | ✓ locked |
| Inspect prev/next uses same full pipeline in `renderReviewInspectPanel` | ✓ locked |
| Next-item search-aware | ✓ (pipeline in renderReviewInspectPanel) |
| `renderReviewActiveSummary` called in `renderReviewList` (D-250B) | ✓ locked |
| Zero-results title "No review items match this view." (D-251A) | ✓ locked |
| Helper copy "Dupes + Similar includes confirmed duplicates and near-duplicate advisories." (D-252A/D-256B) | ✓ locked |
| `applyReviewSearch` defined (D-253A) | ✓ locked |
| `Dupes + Similar` chip label in `renderReviewFilterBar` (D-256B) | ✓ locked |
| `near_duplicate_of` / `duplicate_of` in `applyReviewFilter` duplicate predicate (D-237A) | ✓ locked |
| `reviewDecisionUI` present (moderation actions unchanged) | ✓ locked |
| D-245B inline date / D-246A score labels / D-247A hint grouping / D-248A card density | ✓ (covered by D-248A regression lock) |

---

## Public / Privacy Guarantees

- `.review-sort-bar` not in `renderPublicProfileHtml` — Review mobile rules confined to admin path
- `.review-decision-feedback` not in `renderPublicProfileHtml`
- `.review-empty-actions` not in `renderPublicProfileHtml`
- D-216A allowlist unchanged

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not modified by D-259A. Locked via test 30.

---

## Worker Known-Warning State

`/api/u/:slug` — known parameterised route; implemented via regex in `worker.js`, not as a literal string (D-218A documented limitation). 1 known warn — unchanged.

---

## Test Results

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2959 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**New tests added:** 35 (D-259A section in `hardening-smoke-test.mjs`)
**Previous baseline:** 2924 (D-258B). **New baseline:** 2959.

---

## Deploy Needed

No. Tests + docs only. No CSS, JS, worker, or asset changes.

---

## Future Rule

Any future Review mobile/control CSS change must:

1. Keep all D-258B and D-259A lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-259B (or higher) task documenting exactly what changed and why.

No Review CSS class that appears in this lock may be removed or renamed without a corresponding test update.
