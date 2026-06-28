# D-203 — Aggregate Charts Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `2281fdb`
**Baseline:** 1665/24/57
**Status:** COMPLETE — guardrails set, first chart shipped, deploy confirmed, sanity passed

---

## What This Arc Was

The D-203 arc designed the rules for aggregate charts before building any of them, then implemented the first safe chart under those rules. Two tasks:

- **D-203A** set chart design principles, banned framings, required copy, and visual risk rules before a single line of chart code was written
- **D-203B** implemented the first chart — Source Type Mix per claim — under those rules

---

## D-203A — Aggregate Chart Guardrails

Established the non-negotiable foundation:

> **Charts show HumanX activity and user-submitted material. Charts do not show reality itself.**

Three build-gate tests for every future chart:
1. Could a user reasonably read this chart as evidence that the claim is true? If yes — change the framing, add a label, or do not build it.
2. Does this chart rank claims by something that implies credibility? If yes — remove the ranking or add an explicit activity-data label.
3. Does this chart combine multiple signals into a single score that looks authoritative? If yes — split the signals or do not build the composite.

### Allowed chart categories (9)

Source Type Mix · Evidence Strength Mix · Support/Challenge Balance · Pressure Category Distribution · Test Coverage · Belief Drift (per user, private) · Moderation State (admin only) · Investigation Completeness · User Activity Over Time (admin only)

### Banned chart framings (12)

| Banned | Why |
|--------|-----|
| Top Truths | Ranks truths by popularity — implies ranking reflects accuracy |
| Most Proven Claims | "Proven" already banned in AI verdicts; doubly banned as chart label |
| Truth Score | Composite measure of truth-correspondence — system cannot produce one |
| Reality Ranking | Claims chart reflects external reality |
| Verified by AI | Authority-laundering re-entry risk |
| Majority Says True | Vote count is not truth determination |
| Credibility Score | Any composite of evidence + votes + confidence is a fabricated authority signal |
| Best Supported Claim (public ranking) | Truth-by-popularity in disguise |
| Community Consensus as truth proxy | HumanX user consensus ≠ reality |
| AI Confidence as chart axis | Verdict labels are packet-level, not independent measurements |
| Source type pie framed as credibility breakdown | Origin ≠ credibility |
| Evidence strength as "overall strength" | Self-assessed; not independently evaluated |

### Required label copy

- All charts: "This chart shows submitted HumanX activity, not proof of truth."
- Vote/support: "Support means users engaged or agreed. It does not verify the claim."
- Source type: "Source origin describes where material comes from, not whether it is true."
- Evidence strength: "Strength ratings are submitters' self-assessments. They are not independently evaluated."
- AI analysis: "AI analysis is based on supplied packets, not independent verification."
- Moderation: "Review state is moderation status, not endorsement."

### Visual risk rules

- No green "truth" coloring for popularity (green reserved for moderation Approved badge)
- No trophy/crown/star/checkmark language for claims
- Sort labels must say "sorted by engagement" not "sorted by strength" or "sorted by truth"
- `evidence_score`, `survivability`, `testability` must stay separate — never blended into a single claim score
- `evidence_score` + AI verdict + `beliefYes` must never be combined into a "certainty" composite
- Always show n= count when displaying percentages
- Source type charts must use neutral colors — no green-for-empirical / red-for-scripture axis

---

## D-203B — Source Type Mix Chart

Commit `2281fdb`. Three files changed, 20 new smoke tests.

### Why Source Type Mix was chosen first

Five reasons made this the safest first chart:

1. **Per-claim, not global** — describes one claim's evidence pool, not a ranking across claims
2. **Categorical, not scalar** — 11 distinct labels, no number implying "more = better"
3. **Directly uses D-201 investment** — users chose source types when submitting evidence; the chart makes that metadata visible and useful
4. **Invites reflection, not conclusion** — a 60% scripture/tradition bar prompts the user to think about the evidence base, not tells them the claim is false
5. **Established copy pair** — the `source_type_note` ("origin is not proof") already exists in the RunPack output_contract from D-202C; the chart and that note are a natural pair

Evidence Strength Mix was not chosen first because self-assessed strength ratings could be misread as independent quality measurement when shown as a chart. It will follow once the framing patterns are established.

### Where it appears

**Study view — first panel in the investigation board, before the evidence list.**

Injected as `st-mix-panel` section at the start of `study-grid`. Does not replace evidence cards. Does not affect the RunPack panel, the review panel, or any other section.

### What it uses

- `selected.evidence` — the evidence array already loaded for the current claim by `getClaim()` → Study view mount. No additional API call.
- `evidence.source_type` and `evidence.sourceType` — both snake_case and camelCase handled.
- Null / empty / missing → counted as `'unknown'`

### What it does NOT use

- `belief_yes`, `belief_no`, `uncertainty` — no vote counts
- AI analysis verdicts — no `analysis_results` data
- `evidence_score`, `survivability`, `testability` — no structural scoring
- `review_state` — no moderation state
- `quality` — the legacy quality field is ignored; `quality` is not a truth proxy and is not used as the chart input
- Any backend aggregation query — pure frontend calculation

### Implementation

`renderSourceTypeMix(evidence)` in `public/app-v10.js`:

```js
// counts by SOURCE_TYPE_ORDER enum (fixed, not winner-first)
// null/empty → 'unknown'
// renders horizontal bar rows: label · bar · n (pct%)
// no composite score, no ranking, no color axis
```

Bar color: `var(--blue)` (neutral). `var(--green)` explicitly not used (reserved for moderation Approved badge and does not appear in this component).

CSS in `public/styles.css`: `.st-mix-card`, `.st-mix-row`, `.st-mix-bar-wrap`, `.st-mix-bar`, `.st-mix-label`, `.st-mix-count`. Mobile breakpoint at 600px narrows label column.

### Required guardrail copy — confirmed present

Every rendered instance of the chart includes:

> This chart shows submitted HumanX activity, not proof of truth. Source origin describes where material comes from, not whether it is true.

When all evidence items have `source_type = null` or `unknown`:

> Unknown includes older evidence or submissions without a source type.

### Confirmed: no banned chart framing introduced

The 20 smoke tests verify the chart contains none of: "Top Truths", "Most Proven", "Truth Score", "Verified by AI", "Majority Says True". The chart title is "Source type mix" — no ranking language.

### Confirmed: no backend changes

`getClaim()` already returns `e.source_type` in its evidence SELECT (added in D-201E). No new API endpoint, no schema change, no migration, no worker.js change.

### Confirmed: no claim ranking, truth score, or leaderboard

The chart renders for one claim at a time in the Study view. There is no global aggregation, no cross-claim comparison, no scoring composite, no leaderboard of any kind.

### Smoke test coverage

20 new D-203B tests added:

- `renderSourceTypeMix` function exists
- reads `source_type` and camelCase `sourceType`
- null/missing → `unknown`
- required guardrail copy present (both notes)
- source labels include `scripture_tradition`, `myth_folklore`, `fiction_story`
- all 5 banned framings absent from function body
- chart does not reference `evidence_score`, `survivability`, `testability`
- `st-mix-panel` injected into study-grid
- `st-mix-card` CSS exists in styles.css
- bar uses `--blue` not `--green`
- `worker.js` not changed

---

## Live Deploy Sanity

Deployed from `HEAD = 2281fdb` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. Source type mix panel appears before the evidence list in Study view
2. Guardrail copy visible: "activity not proof" and "origin not truth"
3. Evidence submitted with a non-unknown source type appears in the chart on reload
4. No chart text contains: "Top Truths", "Truth Score", "Proven", "Verified by AI", "Majority Says True"
5. No console errors
6. No scoring or status changes observed
7. Evidence cards unaffected — chart is additive, does not replace evidence panel

---

## Remaining Safe Future Charts

These were designed as allowed in D-203A and are ready to implement when needed. None require backend changes.

**Evidence Strength Mix, per claim.**
Horizontal bar distribution of `evidence_strength` (5 values: strong/moderate/weak/disputed/unknown) across a claim's evidence pool. Must carry the label: "Strength ratings are submitters' self-assessments. They are not independently evaluated." Deferred because "strong" reads as independently meaningful; framing must be careful and is easier to get right after Source Type Mix is established.

**Test Coverage, per claim.**
Count display of how many home tests exist and at what difficulty level. Purely structural — test existence is a fact about investigation completeness, not about claim truth. No result stored (tests are proposals).

**Pressure Category Mix, per claim.**
Distribution of pressure point types (objection, contradiction, untested assumption, exception) for a single claim. Describes investigation composition, not truth determination.

---

## Charts Still Deferred

These must not be built without additional guardrail work specific to their risk surface.

**Global leaderboards.** Any list of claims ranked by engagement, evidence count, vote count, or AI verdict is a truth-by-popularity ranking in visual disguise.

**Ideology comparison charts.** Grouping claims by category and showing relative "support" implies HumanX is endorsing or attacking that category of belief.

**AI confidence dashboards.** Aggregating AI verdicts across claims into a platform-level distribution. Verdicts come from different packets, different users, different AI interactions — they are not comparable on a single axis.

**User belief identity cards (public).** Belief snapshot data is personal. Any public visualization of a user's belief profile creates social pressure dynamics outside the platform's current design intent.

---

## Do-Not-Regress Rules Added by This Arc

1. Every chart must include the appropriate required label copy from D-203A Section D before it ships
2. `var(--green)` must not be used in chart components — it is reserved for moderation Approved badges and evidence quality "strong" indicators; using it for vote counts or source composition implies truth endorsement
3. Source type charts must use a neutral, non-ranked color palette — empirical study must not appear "greener" than scripture/tradition
4. No chart may rank claims against each other without explicit "sorted by activity" labeling
5. `evidence_score`, `survivability`, `testability`, `belief_yes`, `belief_no` must not be combined into a single composite displayed as a score
6. `renderSourceTypeMix` must continue to include the two required guardrail notes on every render — they are not optional

---

## File Index for This Arc

| File | Purpose |
|------|---------|
| `docs/D203A_AGGREGATE_CHART_GUARDRAILS.md` | Full design rules, banned framings, required copy, visual risk rules, first chart recommendation |
| `docs/D203_AGGREGATE_CHARTS_CLOSEOUT.md` | This document |
| `public/app-v10.js` | `SOURCE_TYPE_ORDER`, `renderSourceTypeMix()`, study-grid injection |
| `public/styles.css` | `.st-mix-*` chart CSS, `.ev-origin-note` |
| `scripts/hardening-smoke-test.mjs` | 20 new D-203B tests |
