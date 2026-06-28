# D-207 — Study Investigation Overview Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `b75a2fe`
**Baseline:** 1744/24/57
**Status:** COMPLETE — grouping shipped, deploy confirmed, sanity passed

---

## D-207A — Density Audit Summary

The Study view accumulated four per-claim chart panels across the D-203 through D-206 arc. Each chart is individually sound — per-claim, frontend-only, no truth framing — but the cumulative layout created two concrete problems:

1. **Mobile scroll depth.** With charts interspersed between content panels, a user on a phone scrolled approximately 520px through chart cards before reaching the first evidence card.
2. **Guardrail note repetition.** Four chart panels each carrying a bottom `ev-origin-note` produced ~130px of identical-looking italic fine print in the mobile stack. Repetition trains the eye to skip the notes — the opposite of the intended effect.

The audit also identified a framing risk: with four chart panels appearing before the evidence list, Study felt analytical before it felt investigatory. Charts are support tools; evidence cards are the primary investigation material.

Nine layout options were considered. The recommended option was **Option 2: group all four chart panels under a native `<details>` element** at the top of the investigation board, above the uninterrupted content lists.

---

## D-207B — Implementation Summary

Commit `b75a2fe`. Three files changed (`public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`), 19 new smoke tests, 2 stale position tests updated.

### Why native `<details>/<summary>` was chosen

Five reasons made `<details>/<summary>` the right implementation:

1. **No JavaScript.** Expand/collapse is native browser behavior. No event listeners, no state, no re-render. The component degrades gracefully if JavaScript fails to load.
2. **Accessible by default.** `<details>/<summary>` is keyboard-navigable and screen-reader announced as a disclosure widget without any ARIA additions.
3. **No viewport detection needed.** The `open` attribute controls state declaratively. A product owner can change the mobile default from open to closed with a single attribute change — no code logic required.
4. **No JS required to expand/collapse.** User interaction is handled entirely by the browser's built-in disclosure behavior.
5. **Print safety handled.** A CSS `@media print` rule forces `details.inv-overview` to display as a block with all children visible, preventing collapsed content from disappearing in print or export.

### Why the overview remains open by default

The `open` attribute is present, so the four charts are visible on first load for all users. Reasons for keeping this as the default:

- New users benefit from seeing the composition charts without needing to discover them behind a toggle
- The collapse behavior is the mobile optimization path — it is available but not forced
- The product owner can observe whether users consistently close the overview before deciding to change the default

If usage patterns show users consistently closing the overview immediately, changing to default-closed on mobile is a one-line attribute change — no new code.

---

## Final Study View Order

From top of page to bottom:

1. **Claim header** — back button, status badge, claim title, intro note, review badge, study meta
2. **Structural meters** — Evidence / Testability / Survivability bars + meter key
3. **Vote row** — Believe / Reject / Unsure + vote note
4. **Actions** — Build RunPack + Copy link
5. **Argument Flow** — belief snapshot visual
6. **Lineage** — parent/child claim links
7. **Investigation Board header** — "+ Evidence / + Pressure / + Test" actions + RunPack CTA
8. **`<details class="inv-overview" open>`** — Investigation overview
   - `<summary>` "Investigation overview"
   - Helper copy: "Activity charts for this claim. These show submitted material and investigation activity, not proof of truth."
   - 2-column grid (collapses to 1 column at ≤900px):
     - Source Type Mix
     - Evidence Strength Mix
     - Pressure Mix
     - Test Activity
   - Shared guardrail note: "These charts show submitted HumanX activity, not proof of truth. Source origin, strength labels, pressure, and test activity are investigation context — not a final verdict."
9. **Evidence list** (`evidence-panel`) — primary investigation material
10. **Pressure list** (`pressure-panel`) — challenge items
11. **Tests list** (`tests-panel`) — proposed test procedures
12. **Analyses** (`analysis-panel`) — saved RunPack analysis cards

---

## The Four Grouped Panels

All four chart panels are now inside `inv-overview-grid`:

| Panel | Class | Field aggregated | Bar color |
|-------|-------|-----------------|-----------|
| Source Type Mix | `st-mix-panel` | `source_type` | `--blue` |
| Evidence Strength Mix | `es-mix-panel` | `evidence_strength` | `--blue` |
| Pressure Mix | `pm-mix-panel` | `severity` | `--yellow` |
| Test Activity | `ta-mix-panel` | `difficulty` | `--blue` |

Order inside the group is preserved from the individual shipping order: Source Type Mix first (the canonical first chart), Evidence Strength Mix second, Pressure Mix third, Test Activity fourth.

---

## Shared Guardrail Copy

The four individual bottom notes were shortened to single-line versions. The full epistemic framing now lives in the shared `inv-overview-note` at the bottom of the group:

> These charts show submitted HumanX activity, not proof of truth. Source origin, strength labels, pressure, and test activity are investigation context — not a final verdict.

Individual chart shortened notes (preserved, not removed):

| Chart | Shortened note |
|-------|---------------|
| Source Type Mix | "Origin describes where material comes from." |
| Evidence Strength Mix | "Strength labels describe categorization, not proof." |
| Pressure Mix | "Pressure shows where support may need testing." |
| Test Activity | "Recorded tests are investigation activity, not verdicts." |

**Empty-state notes and unknown-all notes inside each chart are preserved in full.** Only the bottom "This chart shows submitted HumanX activity" paragraph was shortened — that content moved to the shared group note. The specific-to-chart warnings remain.

The phrase "not a final verdict" in the shared note is the key framing addition. It was not previously present in any chart's bottom note. It directly addresses the risk that a user reads the overview as a summary judgment of the claim rather than a description of investigation activity.

---

## Raw Lists Remain Primary Material

Evidence cards, pressure cards, and test cards remain outside the `<details>` group. They are always visible and not affected by the collapse state of the overview. The investigation board header (with `+ Evidence`, `+ Pressure`, `+ Test` action buttons) is also outside the group — it sits above the overview block and remains accessible regardless of whether the charts are collapsed.

This separation was intentional: charts are synthesis; cards are evidence. The reading model is "see the composition overview, then read the raw material."

---

## Mobile Benefit

On mobile (single-column layout, ≤900px breakpoint):

- **Before D-207B:** User scrolled ~520px through four chart cards before reaching the first evidence card. Four separate `ev-origin-note` paragraphs added ~130px of fine-print in the scroll path.
- **After D-207B:** Overview is one collapsible block. User can tap the summary row to collapse all four charts with one tap, reducing scroll to evidence cards to approximately 60–80px (just the closed `<summary>` bar + Investigation Board header).
- `inv-overview[open] .inv-overview-grid` switches to `grid-template-columns: 1fr` at ≤900px, so charts stack vertically inside the group rather than side-by-side.

---

## Confirmed: No Chart Math Changed

No aggregation logic was modified. `renderSourceTypeMix`, `renderEvidenceStrengthMix`, `renderPressureCategoryMix`, and `renderTestActivityMix` count the same fields in the same way. Only the surrounding HTML structure and the bottom note text changed.

---

## Confirmed: No Scoring, Ranking, Truth Score, or Verdict Language Added

The 19 smoke tests verify: no "Truth Score", "Most Proven", "Verified by AI", "Majority Says True", or "Final verdict" in the overview HTML. The `<summary>` label "Investigation overview" uses the word "investigation" (a process) not "analysis" or "verdict" (conclusions). The `inv-overview-desc` uses "activity" not "results."

The `inv-overview` CSS uses no `var(--green)` — green remains reserved for the moderation Approved badge.

---

## Confirmed: No Backend Changes

No files in `src/` were modified. The D-207B smoke test `D-207B: worker.js not changed` guards this regression surface.

---

## Live Deploy Sanity

Deployed from `HEAD = b75a2fe` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. Study order correct: header → meters → vote → actions → argument flow → lineage → investigation board → inv-overview[details] → evidence list → pressure list → tests list → analyses
2. Investigation overview open by default; all four chart panels visible
3. Collapsing the overview with one click reveals evidence/pressure/tests lists without scrolling
4. Mobile layout: overview collapses to 1-column grid, no layout break
5. No text contains: "Truth Score", "Most Proven", "Verified by AI", "Majority Says True", "Final verdict"
6. Helper copy visible: "Activity charts for this claim. These show submitted material and investigation activity, not proof of truth."
7. Shared guardrail note visible below charts: "investigation context — not a final verdict."
8. No console errors
9. No scoring or status changes

---

## Do-Not-Regress Rules for This Component

1. The `<details>` element must always have a meaningful `<summary>` — not an empty string, not "Charts", not a verdict label
2. The shared `inv-overview-note` must include "not a final verdict" — this phrase is the primary addition of D-207B
3. Evidence, pressure, and tests content panels must remain outside `</details>` — they must not be pulled into the collapse group
4. The Investigation Board header (`+ Evidence / + Pressure / + Test`) must remain above the overview group and outside the collapse
5. `var(--green)` must not appear in any `.inv-overview*` CSS rule
6. The individual shortened chart notes must not be removed entirely — they remain as the per-chart specific framing even after the shared note exists

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D207A_STUDY_VIEW_DENSITY_AUDIT.md` | Full density audit, layout options, recommendation |
| `docs/D207_STUDY_OVERVIEW_CLOSEOUT.md` | This document |
| `public/app-v10.js` | `<details class="inv-overview" open>` wrapper, chart reorder, note shortening |
| `public/styles.css` | `.inv-overview*` CSS, mobile breakpoint, print rule |
| `scripts/hardening-smoke-test.mjs` | 19 new D-207B tests; 2 stale position tests updated |
