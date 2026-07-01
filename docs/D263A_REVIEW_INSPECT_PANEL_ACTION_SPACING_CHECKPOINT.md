# D-263A — Review Inspect Panel Action Spacing Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3011 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D263A_REVIEW_INSPECT_PANEL_ACTION_SPACING_CHECKPOINT.md`
**CSS changes:** None
**App changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Closes the D-261A → D-262A Review inspect panel action spacing mini-arc by updating the authoritative project checkpoint (`PROJECT_STATE.md`) with the arc summary, inspect panel action spacing behavior table, privacy boundary additions, deployment state, and six new safe-next-work rules (54–59).

---

## D-261A / D-261B / D-261C / D-262A Summary

| Task | Type | What it did | Tests |
|------|------|-------------|-------|
| D-261A | Audit | Full action inventory (7 sections). 6 risk findings: F-1 HIGH (flat column, no visual break at ≤600px), F-4 MEDIUM (no `width:100%`), F-3 MEDIUM (dead CSS class), F-2/F-5/F-6. Recommended D-261B CSS slice. Docs only. | 0 new |
| D-261B | CSS polish | Desktop Study push (`margin-left:auto`), mobile full-width buttons (`width:100%`), mobile soft separator (`border-top:1px solid rgba(255,255,255,.06)`) + Study column reset. CSS-only — no copy/behavior changes. | +19 (→2978) |
| D-261C | Live closeout | Owner deploy PASS. Deployed Worker: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2`. 41/41 live sanity PASS. | 0 new |
| D-262A | Regression lock | 7 test categories. Desktop Study push, mobile full-width, separator calm styling, behavior lock (Approve/Reject/Keep/markDuplicateUI/resolveSimilarUI/prev-next/Open next item/reviewDecisionUI), cross-arc compat (D-245B/D-256/D-258B/D-259A), public/Drift/backend boundary, deploy integrity. | +33 (→3011) |

**Total new tests in mini-arc:** 52.
**Deploys:** 1 (D-261B via D-261C owner manual terminal deploy).

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

## Deploy State

| Task | Deploy |
|------|--------|
| D-261A | Audit / docs only — no deploy |
| D-261B | CSS change — owner deploy PASS (D-261C, 2026-07-01) · deployed Worker: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` |
| D-261C | Live closeout — no deploy (closeout of D-261B) |
| D-262A | Tests / docs only — no deploy |
| D-263A | Docs only — no deploy |

---

## Exact CSS Classes Locked (D-261B + D-262A)

| Class | Rule | Context | Lock |
|-------|------|---------|------|
| `.review-inspect-actions .btn-study-review` | `margin-left:auto` | Desktop (no media query) | Must not be removed — D-262A rule 54 |
| `.review-inspect-actions button` | `width:100%` | `@media(max-width:600px)` Review block | Must not be removed — D-262A rule 55 |
| `.review-inspect-actions .review-inspect-markdup` | `margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)` | `@media(max-width:600px)` Review block | Must not be removed — D-262A rule 56 |
| `.review-inspect-actions .review-inspect-resolvesim` | same as above | `@media(max-width:600px)` Review block | Must not be removed — D-262A rule 56 |
| `.review-inspect-actions .btn-study-review` | `margin-left:0` (reset) | `@media(max-width:600px)` Review block | Resets desktop push — column layout |

---

## Desktop Study Push Guarantee

- `.review-inspect-actions .btn-study-review{margin-left:auto}` exists outside any media block.
- On desktop (flex row), Study floats to the far right — natural gap before Study without structural HTML changes.
- `btn-study-review` class still emitted by `renderReviewInspectPanel` for all Study variants.
- Study label variants (`Open Study View ↗` / `Study Parent Claim ↗` / `Study Linked Claim ↗`) unchanged.
- Study behavior (`openReviewClaimStudy`) unchanged.

---

## Mobile Full-Width Inspect Buttons Guarantee

- `.review-inspect-actions{flex-direction:column}` active at ≤600px (pre-D-261B rule, unchanged).
- `.review-inspect-actions button{width:100%}` added by D-261B — all inspect action buttons are consistent full-width tap targets in the column layout.
- No variable-width buttons in the mobile column.
- No markup change required — pure CSS.

---

## Duplicate/Advisory Soft Separator Guarantee

- `.review-inspect-markdup` and `.review-inspect-resolvesim` have `margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06)` at ≤600px.
- Separator is calm (6% white alpha `border-top`) — not error-red (`var(--red)`, `#ff0000`, `#cc0000`).
- Creates a visible but non-alarming visual break between primary moderation buttons and the dup/advisory group.
- `Mark Duplicate...` and `Dismiss ~Similar` labels, behavior, and semantics unchanged.

---

## CSS-Only / No-Markup / No-Copy / No-Behavior Guarantee

- `public/app-v10.js` not modified by D-261A, D-261B, or D-262A.
- No markup changes — inspect panel HTML structure unchanged.
- No copy changes — all button labels unchanged.
- No behavior changes — `requestApproveReview`, `requestRejectReview`, `markDuplicateUI`, `resolveSimilarUI`, `openReviewClaimStudy`, `reviewDecisionUI` all unchanged.
- No backend/API/migration/schema/CSP/wrangler.toml changes.
- No Review/admin logic changes.

---

## Inspect Action Behavior Unchanged Guarantee

| Handler | Status |
|---------|--------|
| `requestApproveReview` | Present and unchanged — D-262A test 16 |
| `requestRejectReview` | Present and unchanged — D-262A test 17 |
| `markDuplicateUI` | Present and unchanged — D-262A test 18 |
| `resolveSimilarUI` | Present and unchanged — D-262A test 19 |
| `openReviewClaimStudy` | Present and unchanged — D-262A test 5 |
| `reviewDecisionUI` | Defined and unchanged — D-262A test 22 |
| Duplicate/advisory semantics | All unchanged — Mark Duplicate / Dismiss ~Similar / Use as dup target |
| Moderation actions | All unchanged — Approve/Keep/Reject/Archive |

---

## Search-Aware Inspect Navigation Guarantee

- `renderReviewInspectPanel` prev/next uses `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` — locked by D-262A test 20.
- `renderReviewList` feedback banner still emits "Open next item →" — locked by D-262A test 21.
- `reviewDecisionUI` next-item candidate uses the full search-aware pipeline — unchanged from D-253A.

---

## Public / Privacy Guarantees

- `.review-inspect-actions`, `btn-study-review`, `review-inspect-markdup`, `review-inspect-resolvesim` all confirmed absent from `renderPublicProfileHtml` — locked by D-262A tests 28–29.
- Review inspect action spacing CSS remains entirely internal/admin Review queue surface.
- Public profile allowlist (`PUBLIC_PROFILE_ALLOWED_MARKERS`) contract unchanged.
- D-216A denylist unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-261A, D-261B, D-261C, D-262A, or D-263A. Confirmed by D-262A test 30.

---

## Safe Next Lanes

| Lane | Notes |
|------|-------|
| Study entry button style consistency | D-239A F-2–F-4 remaining |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-nav framing |
| Review queue milestone wrap-up checkpoint | Optional: close the D-227→D-262 Review ergonomics run with a consolidated milestone doc |

Do not start any until explicitly assigned.

---

## Future Rule

Any future change to the Review inspect panel action area — including any CSS touching `.review-inspect-actions`, `.btn-study-review`, `.review-inspect-markdup`, or `.review-inspect-resolvesim` — must:

1. Keep all D-261B and D-262A lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-262B (or higher) task documenting exactly what changed and why.

Safe-next-work rules 54–59 (added in D-263A) codify the specific constraints for inspect panel action spacing.
