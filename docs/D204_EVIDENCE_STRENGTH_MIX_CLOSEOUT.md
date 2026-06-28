# D-204 — Evidence Strength Mix Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `1cf30f8`
**Baseline:** 1686/24/57
**Status:** COMPLETE — chart shipped, deploy confirmed, sanity passed

---

## D-204A — Implementation Summary

Commit `1cf30f8`. Two files changed (`public/app-v10.js`, `scripts/hardening-smoke-test.mjs`), 21 new smoke tests.

Added to `public/app-v10.js`:

- `evidenceStrengthLabel(v)` — display map for all 5 enum values
- `EVIDENCE_STRENGTH_ORDER` — fixed constant controlling bar order
- `renderEvidenceStrengthMix(evidence)` — per-claim horizontal bar chart

Injected `es-mix-panel` into the Study view `study-grid` between `st-mix-panel` and `evidence-panel`.

No `styles.css` changes — existing `.st-mix-*` classes from D-203B cover all layout needs. This was intentional: Source Type Mix and Evidence Strength Mix share visual language deliberately, so they read as a matched pair rather than two competing components.

---

## Why Evidence Strength Mix Was Safe to Build Second

D-203A Section F identified Evidence Strength Mix as the appropriate second chart, after Source Type Mix was established. Three conditions made it safe to build now:

1. **Framing pattern set.** Source Type Mix established the visual grammar: horizontal bars, n= count, neutral `--blue` color, guardrail note below. Evidence Strength Mix follows the same pattern exactly. The risk of "strong = proven" misread is lower when the chart visually matches a chart the user already understands as "activity data."

2. **Field is submitter self-assessment.** `evidence_strength` is chosen by the user who submits the evidence — it is not calculated from external signals, not inferred from source type, and not derived from votes. The guardrail copy makes this explicit: "Strength labels describe how evidence was categorized, not whether the claim is proven."

3. **No scalar aggregation.** The chart shows a distribution of five categorical labels, not a sum or average. There is no "overall strength score" — just counts per bucket. A claim could show 100% "strong" self-assessments and still be unsupported; the chart does not hide that.

---

## Where It Appears

**Study view — second chart panel, after Source Type Mix, before the evidence list.**

Panel order in `study-grid`:

1. `st-mix-panel` — Source Type Mix
2. `es-mix-panel` — Evidence Strength Mix
3. `evidence-panel` — Evidence list (unchanged)
4. `pressure-panel` — Pressure (unchanged)
5. `tests-panel` — Tests (unchanged)
6. `analysis-panel` — Analyses (unchanged)

The two chart panels stack above the evidence list. They are additive — neither replaces nor reorders evidence cards.

---

## What It Uses

- `selected.evidence` — the evidence array already loaded by `getClaim()` for the Study view. No additional API call.
- `evidence.evidence_strength` and `evidence.evidenceStrength` — both snake_case and camelCase handled.
- Null / empty / missing → counted as `'unknown'`

---

## What It Does NOT Use

- `quality` — the legacy quality field. `evidence_strength` is the new taxonomy field; `quality` is not read, not inferred from, and not used as a strength proxy.
- `belief_yes`, `belief_no`, `uncertainty` — no vote counts.
- AI analysis verdicts — no `analysis_results` data.
- `evidence_score`, `survivability`, `testability` — no structural scoring.
- `review_state` — no moderation state.
- `source_type` — source origin is not used to infer strength. A `scripture_tradition` source is not marked "weak" by the chart; it appears under whatever `evidence_strength` value was submitted for it.

---

## Fixed Enum Order

The chart renders buckets in this fixed order, regardless of count:

```
unknown → weak → moderate → strong → disputed
```

This order is defined by `EVIDENCE_STRENGTH_ORDER` constant and applied via `.filter(k => counts[k])` — buckets with zero items are omitted. The order is not "most common first" or "strongest first." It is a defined scale from least-known to most-known (with `disputed` appended as a category that sits outside the weak-to-strong progression).

Rationale for this order:
- `unknown` first: makes it immediately visible how much of the evidence pool has no strength assessment
- `weak → moderate → strong`: the natural scale, readable left-to-right
- `disputed` last: not a point on the scale — it flags contested status rather than strength level

---

## Guardrail Copy — Confirmed Present

Every rendered instance includes:

> This chart shows submitted HumanX activity, not proof of truth. Strength labels describe how evidence was categorized, not whether the claim is proven.

When all evidence items have `evidence_strength = null` or `unknown`:

> Unknown includes older evidence or submissions without an evidence strength label.

The "not whether the claim is proven" phrase directly addresses the primary risk: a "100% strong" bar chart being read as "this claim is proven."

---

## Confirmed: No Ranking, Truth Score, or Leaderboard

- Chart renders for one claim in Study view only
- No cross-claim comparison
- No "strongest claim" language
- No composite score
- The 21 smoke tests verify all five banned framings are absent from the function body: "Truth Score", "Most Proven", "Strongest Claim", "Verified by AI", "Majority Says True"

---

## Confirmed: No Backend Changes

`getClaim()` already returns `e.evidence_strength` in its evidence SELECT (added in D-201E). No new API endpoint, no schema change, no migration, no `worker.js` change. The smoke test `D-204A: worker.js not changed` guards this regression surface.

---

## Confirmed: CSS Reuse Was Intentional

`renderEvidenceStrengthMix` uses `.st-mix-card`, `.st-mix-row`, `.st-mix-bar-wrap`, `.st-mix-bar`, `.st-mix-label`, `.st-mix-count`, and `.ev-origin-note` — the same classes defined for Source Type Mix in D-203B.

This is deliberate. The two charts are a matched pair that describe different facets of the same evidence pool (origin and self-assessed weight). Shared visual language signals to the user that they are reading the same kind of data. No new CSS was needed.

---

## Live Deploy Sanity

Deployed from `HEAD = 1cf30f8` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. Panel order correct: Source Type Mix → Evidence Strength Mix → Evidence list
2. Strength buckets visible: Unknown, Weak, Moderate, Strong, Disputed (those with evidence items shown)
3. Guardrail copy visible: "submitted activity, not proof of truth" and "not whether the claim is proven"
4. Evidence submitted with `strength = strong` appears in the Strong bar after reload
5. No chart text contains: "Truth Score", "Most Proven", "Strongest Claim", "Verified by AI", "Majority Says True"
6. No console errors
7. No scoring or status changes observed
8. Evidence cards and all other panels unaffected

---

## Remaining Safe Future Charts

Per D-203A and the arc plan, these are the next two safe per-claim charts. Both are frontend-only from already-loaded data.

**Test Coverage per claim.**
Count display of how many home tests exist, optionally broken down by difficulty level. Purely structural — test existence is a fact about investigation completeness, not about claim truth. No result stored (tests are proposals, not executed experiments). Must carry: "Test count shows investigation activity, not proof of truth."

**Pressure Category Mix per claim.**
Distribution of pressure point types (objection, contradiction, untested assumption, exception) across a claim's pressure pool. Describes investigation composition, not truth determination. Must carry: "Pressure count shows challenges submitted, not whether the claim is refuted."

---

## Still Deferred

These must not be built without additional guardrail work specific to their risk surface:

- Global leaderboards
- Ideology comparison charts
- AI confidence dashboards
- User belief identity cards (public)
- Any cross-claim ranking by strength, evidence count, or vote count

---

## Do-Not-Regress Rules for This Component

1. `renderEvidenceStrengthMix` must not read `quality`, `evidence_score`, `belief_yes`, `belief_no`, or any AI verdict field
2. The fixed enum order `['unknown','weak','moderate','strong','disputed']` must not be reordered to rank by count or by perceived "strength"
3. `--green` must not be added to the `st-mix-bar` for the "strong" bucket — green is reserved for moderation Approved and must not signal truth endorsement
4. The guardrail copy "not whether the claim is proven" must appear on every render — it is not optional and must not be shortened to remove the word "proven"

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D204_EVIDENCE_STRENGTH_MIX_CLOSEOUT.md` | This document |
| `public/app-v10.js` | `evidenceStrengthLabel()`, `EVIDENCE_STRENGTH_ORDER`, `renderEvidenceStrengthMix()`, es-mix-panel injection |
| `scripts/hardening-smoke-test.mjs` | 21 new D-204A tests |
