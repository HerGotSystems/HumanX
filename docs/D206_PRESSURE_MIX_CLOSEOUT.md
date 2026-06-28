# D-206 — Pressure Mix Chart Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `3284886`
**Baseline:** 1725/24/57
**Status:** COMPLETE — chart shipped, deploy confirmed, sanity passed

---

## D-206A — Audit Findings

Before implementing, the pressure data model was inspected.

**`pressure_points` columns (from `migrations/0003_full_schema.sql`):**

```
id, claim_id, user_id, title, body,
severity INTEGER DEFAULT 1,
label TEXT,
kind TEXT,
created_at
```

**`getClaim()` pressure SELECT (`src/worker.js`):**

```sql
SELECT p.id, p.claim_id, p.title, p.body, p.severity, p.review_state,
       p.report_count, p.created_at, p.updated_at, u.handle
FROM pressure_points p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.claim_id = ? AND COALESCE(p.review_state,'public') = 'public'
ORDER BY p.created_at DESC
```

**Key findings:**

1. `label` and `kind` columns exist in the schema but are **not included in the getClaim() SELECT** and are **never populated by `addPressure()`**. Every row has these as null. They cannot be used for charting.
2. `severity` (integer 1–5) is the only stable categorization field returned to the frontend. `addPressure()` accepts and stores it; the existing `pressureSeverityLabel()` function already maps it to human-readable text.
3. `selected.pressure` is already loaded in the Study view — no API call needed.
4. Zero backend changes required.

---

## Why the Title Is `Pressure mix`, Not `Debunking mix`, `Claim weakness`, or Anything Verdict-Like

**Not `Debunking mix`:** "Debunking" asserts that the pressure items have successfully refuted the claim. The chart shows submitted pressure proposals — they have not been evaluated, adjudicated, or confirmed. A pressure item titled "this claim contradicts X" is a challenge, not a refutation.

**Not `Claim weakness`:** "Weakness" implies the chart is measuring how weak the claim is. It is measuring how much challenge activity has been submitted and at what intensity level. A claim with five critical-severity pressure items is not necessarily a weak claim — it may be a heavily scrutinised one.

**Not `Pressure score` or any composite number:** The chart shows a distribution of severity levels. It does not produce a single score. Adding up pressure severity to produce a "total pressure" number would be a fabricated credibility signal, which is explicitly banned by D-203A Section C.

**`Pressure mix`:** Describes what the data is — a mix of submitted pressure items categorised by their stated severity. The word "mix" is in the same register as "Source type mix" and "Evidence strength mix," reinforcing that all three are activity-distribution charts, not truth measurements.

---

## Where It Appears

**Study view — before the Pressure list and before Test Activity.**

Panel order in `study-grid`:

1. `st-mix-panel` — Source Type Mix
2. `es-mix-panel` — Evidence Strength Mix
3. `evidence-panel` — Evidence list
4. `pm-mix-panel` — Pressure Mix ← this chart
5. `pressure-panel` — Pressure list
6. `ta-mix-panel` — Test Activity
7. `tests-panel` — Tests list
8. `analysis-panel` — Analyses

Placement rationale: mirrors the evidence chart pattern — the composition chart (Pressure Mix) sits directly above the item list it summarises (Pressure list). The user sees the severity distribution first, then the individual pressure cards below. This is the same reading flow established by Source Type Mix → Evidence list and Test Activity → Tests list.

---

## What It Uses

- `selected.pressure` — the pressure array already loaded by `getClaim()` for the Study view. No additional API call.
- `p.severity` — integer 1–5. The only stable categorization field returned in the getClaim response.
- `pressureSeverityLabel(k)` — the existing frontend function that maps 1→"low pressure", 2→"moderate pressure", 3→"notable pressure", 4→"high pressure", 5→"critical pressure".
- Null / zero / out-of-range severity → tracked as `unknownCount`, shown with legacy note if non-zero.

---

## What It Does NOT Use

- `belief_yes`, `belief_no`, `uncertainty` — no vote counts
- AI analysis verdicts — no `analysis_results` data
- `evidence_strength` / `evidenceStrength` — evidence weight is irrelevant to pressure intensity
- `source_type` / `sourceType` — source origin is not a pressure categorization
- `review_state` — the pressure array in `getClaim()` is already filtered to `review_state = 'public'`; the chart does not re-filter or display moderation state
- `evidence_score`, `survivability`, `testability` — no structural scoring
- `label`, `kind` — exist in the schema but are null in all rows and not returned by `getClaim()`
- Any claim ranking or cross-claim comparison

---

## Bar Color

The pressure mix bar uses `var(--yellow)` with `opacity: 0.65`, defined as `.st-mix-bar.pm-bar` in `styles.css`.

- `--yellow` matches the existing yellow pressure badge (`b-yellow`) already used on the Pressure section header — consistent visual language for pressure-related content
- `--green` is explicitly not used — green is reserved for moderation Approved badges and must not appear in charts to avoid implying truth endorsement
- `--blue` is not used — blue is reserved for the evidence composition charts (Source Type Mix, Evidence Strength Mix), maintaining distinct visual lanes for different data types

The 20 smoke tests include `D-206A: pm-bar uses --yellow not --green` which guards this color choice.

---

## Guardrail Copy — Confirmed Present

Every rendered instance includes:

> This panel shows submitted challenge activity, not proof that a claim is false. Pressure helps investigation by showing where a claim may need better support.

When pressure items have null/zero severity:

> Unknown includes older pressure items or submissions without a severity level.

The phrase "not proof that a claim is false" directly mirrors the pattern established in D-202C: just as "Strongly Supported" does not mean proven, "critical pressure" does not mean false. The chart describes challenge activity, not a verdict.

---

## Confirmed: No "Pressure Disproves Claim" Framing

The 20 smoke tests verify the chart function body contains none of: "Debunked", "False by pressure", "Pressure wins", "Truth Score", "Verified by AI", "Majority Says True".

No language in the chart implies that a high-severity pressure item has been adjudicated, that the pressure has been found valid, or that the claim has been refuted.

---

## Confirmed: No Backend Changes

`getClaim()` already returns `p.severity` in its pressure SELECT. `hardening-smoke-test.mjs` includes `D-206A: worker.js not changed` which guards this.

---

## Live Deploy Sanity

Deployed from `HEAD = 3284886` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. Panel order correct: Source Type Mix → Evidence Strength Mix → Evidence list → Pressure Mix → Pressure list → Test Activity → Tests list
2. Chart title reads "Pressure mix"
3. Severity bars appear (low/moderate/notable/high/critical — those with items)
4. Guardrail copy visible: "challenge activity, not proof that a claim is false" and "Pressure helps investigation"
5. Pressure item submitted with a severity level appears in the correct bar after reload
6. No chart text contains: "Debunked", "False by pressure", "Pressure wins", "Truth Score", "Verified by AI", "Majority Says True"
7. Bar color is yellow (matching pressure badge), not green
8. No console errors
9. No scoring or status changes observed
10. Pressure list and all other panels unaffected

---

## Chart Arc Summary — All Four Per-Claim Study Charts

Four per-claim charts are now live in Study view, all following D-203A guardrails:

| Chart | Panel | Field aggregated | Bar color | Guardrail framing |
|-------|-------|-----------------|-----------|-------------------|
| Source Type Mix | `st-mix-panel` | `source_type` | `--blue` | Origin ≠ proof |
| Evidence Strength Mix | `es-mix-panel` | `evidence_strength` | `--blue` | Self-assessed ≠ proven |
| Pressure Mix | `pm-mix-panel` | `severity` | `--yellow` | Challenge ≠ false |
| Test Activity | `ta-mix-panel` | `difficulty` | `--blue` | Proposed ≠ executed |

All are frontend-only from already-loaded data. No backend changes across the entire arc.

---

## Do-Not-Regress Rules for This Component

1. `renderPressureCategoryMix` must not read `label` or `kind` — they are null in all rows; if they are ever populated, a separate review is needed before charting them
2. The bar color must remain `var(--yellow)` — `var(--green)` must not be introduced for any severity level, even "critical"
3. The guardrail phrase "not proof that a claim is false" must appear on every render
4. If a genuine category/type field is ever added to `pressure_points` and populated by the form, the chart may be updated to use it — but it must go through the D-203A three-test decision gate before shipping

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D206_PRESSURE_MIX_CLOSEOUT.md` | This document |
| `public/app-v10.js` | `PRESSURE_SEVERITY_ORDER`, `renderPressureCategoryMix()`, pm-mix-panel injection |
| `public/styles.css` | `.st-mix-bar.pm-bar` — `var(--yellow)` override |
| `scripts/hardening-smoke-test.mjs` | 20 new D-206A tests |
