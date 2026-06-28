# D-203A — Aggregate Chart Guardrails

**Date:** 2026-06-28
**HEAD at creation:** `b8388d2`
**Baseline:** 1645/24/57
**Scope:** Audit and design spec only — no chart implementation in this patch
**Prerequisite reading:** `D202A_HUMANX_EPISTEMOLOGY_MODEL.md` Section G

---

## Why This Document Exists Before Any Chart Is Built

Charts are the fastest way to make aggregated activity look like aggregated fact. A pie chart showing 70% support for a claim reads as "70% proven" to most people, even when the label says "support." The visual grammar of charts — bars, pies, percentages, rankings — carries a cultural meaning of measurement and objectivity that the underlying data does not support.

HumanX now has enough data fields that charts are feasible and genuinely useful:

- `source_type` (11 values) — what kinds of sources are cited for a claim
- `evidence_strength` (5 values) — how submitters rate their own evidence
- `quality` (legacy) — the original evidence category field
- `belief_yes` / `belief_no` / `uncertainty` — vote-style engagement
- `evidence_score` / `survivability` / `testability` — structural investigation metrics
- `analysis_results.verdict` — AI-assessed verdict labels
- `review_state` — moderation state
- Belief snapshots with drift over time
- Pressure point severity counts

None of these are measures of reality. They are measures of activity and user-submitted metadata. This document fixes the chart design rules before any of them are visualised as aggregates.

---

## A. Chart Principle

**Charts show HumanX activity and user-submitted material. Charts do not show reality itself.**

This is the non-negotiable foundation. Every chart built in HumanX must be interpretable as a picture of what users did inside the platform, not a picture of whether the underlying claim is true.

**Three tests for every chart before it is built:**

1. *Could a user reasonably read this chart as evidence that the claim is true?* If yes — change the framing, add a label, or do not build it.
2. *Does this chart rank claims by something that implies credibility?* If yes — remove the ranking or add an explicit "this is activity data, not credibility data" label.
3. *Does this chart combine multiple signals into a single score that looks authoritative?* If yes — split the signals or do not build the composite.

---

## B. Allowed Chart Categories

These chart types are safe to build because they describe the composition of submitted material, not a verdict about truth.

### B.1 — Source Type Mix (per claim)
What types of sources are cited for a single claim's evidence pool.

Example: "40% empirical study · 30% news report · 20% personal experience · 10% scripture/tradition"

Safe because: it is a distribution of origin labels, not a credibility ranking. Includes the source-type note rule (origin ≠ proof).

### B.2 — Evidence Strength Mix (per claim)
Self-assessed strength distribution across a single claim's evidence items.

Example: "25% strong · 30% moderate · 30% weak · 15% unknown"

Safe because: it is a distribution of submitter self-assessments, explicitly subjective. Does not imply the claim is well-evidenced — a claim can have 100% "strong" self-assessments and still be wrong.

### B.3 — Support / Challenge Balance (per claim)
Count of support-stance vs challenge-stance evidence items and pressure points.

Example: bar chart showing 8 support items vs 4 challenge items.

Safe because: it shows investigation activity, not truth determination. Must carry the label: "Support and challenge count reflects submitted material, not verified conclusions."

### B.4 — Pressure Category Distribution (per claim)
What kinds of pressure have been raised (objection, contradiction, untested assumption, exception).

Safe because: purely structural — describes investigation composition.

### B.5 — Test Coverage (per claim)
How many home tests exist and at what safety/difficulty levels.

Safe because: test existence is a structural fact about the investigation. Test results are not stored (tests are proposals, not executed experiments).

### B.6 — Belief Drift Over Time (per user, private)
A line chart of a single user's saved conviction levels across multiple snapshots.

Safe because: it is a private personal record. Describes the user's own belief history. Must be labeled: "Drift shows how your recorded belief changed over time — not whether the claim became more or less true."

### B.7 — Moderation State Distribution (admin only)
Counts of claims/evidence by review_state.

Safe because: it is a workload view for moderators. Must be labeled: "Review state is moderation status, not truth status."

### B.8 — Investigation Completeness (per claim)
A composite display of how many evidence items, pressure points, and tests exist for a claim — not as a score, but as a checklist.

Example: "8 evidence items · 3 pressure points · 1 test · 2 analyses"

Safe because: counts are structural facts. Does not imply quality.

### B.9 — User Activity Over Time (admin/owner only)
Submission counts over time, broken down by type.

Safe because: purely operational data.

---

## C. Dangerous and Banned Chart Framings

These framings must never appear in HumanX — not in UI copy, chart labels, sort orders, badge text, or implied by visual hierarchy.

| Banned Framing | Why Dangerous |
|----------------|---------------|
| "Top Truths" | Ranks truths by popularity; implies ranking reflects accuracy |
| "Most Proven Claims" | "Proven" is already banned from AI verdicts; it is doubly banned as a chart label |
| "Truth Score" | Implies a composite measure of truth-correspondence; the system cannot produce one |
| "Reality Ranking" | Claims that the chart reflects external reality |
| "Verified by AI" | Banned per D-202; re-entry risk via chart labels |
| "Majority Says True" | A vote count is not a truth determination |
| "Credibility Score" | Any single number combining evidence, votes, confidence, and source type is a fabricated authority signal |
| "Best Supported Claim" as a public ranking | Ranking claims by evidence count in a public leaderboard implies the top-ranked claims are most likely true |
| "Community Consensus" as truth proxy | Consensus of HumanX users ≠ reality; see D-202A Section D |
| "AI Confidence" as a chart axis | AI analysis verdicts are packet-level assessments; charting them as a confidence axis implies independent measurement |
| Source type pie chart framed as "credibility breakdown" | Source origin is not credibility; a 100% empirical-study chart does not mean the claim is true |
| Evidence strength aggregated as "overall strength" | Self-assessed strength is not independently evaluated; summing it is summing subjectivity |

---

## D. Required Chart Labels and Copy

Every chart must carry contextual framing appropriate to the data it shows. These are the required label patterns.

**For all aggregate charts:**
> This chart shows submitted HumanX activity, not proof of truth.

**For vote / support-count charts (beliefYes, beliefNo, uncertainty):**
> Support means users engaged or agreed. It does not verify the claim.

**For source-type charts:**
> Source origin describes where material comes from, not whether it is true.

**For evidence-strength charts:**
> Strength ratings are submitters' self-assessments. They are not independently evaluated.

**For AI analysis verdict charts (if any):**
> AI analysis is based on supplied packets, not independent verification.

**For moderation state charts:**
> Review state is moderation status, not endorsement.

**For belief drift charts (user-private):**
> Drift shows how your recorded belief changed over time — not whether the claim became more or less true.

**For investigation completeness displays:**
> Evidence and test counts show investigation activity. More items means more has been submitted, not that the claim is more correct.

These labels are not optional. A chart without the appropriate contextual note violates the D-202A principle: "charts show user behavior, not reality itself."

---

## E. Visual Risk Rules

**Avoid green "truth" coloring for popularity.**
If a claim card shows high `beliefYes` count, the visual treatment must not use the same green (`b-green`) as the "Approved" moderation badge. High votes ≠ approved, and approved ≠ true.

**Avoid trophy, crown, star, or check-mark language for claims.**
Any icon that signals "winner" or "verified" on a claim implies it has been validated by the platform. The platform does not validate claims.

**Avoid ranking claims by support alone.**
If claims are sortable by `belief_yes` or `evidence_score`, the sort label must say "sorted by engagement" or "sorted by evidence count," not "sorted by strength" or "sorted by truth."

**Avoid big single-number "truth scores."**
`evidence_score`, `survivability`, and `testability` are structural metrics. They must be displayed as separate named values with explanations, never blended into a single "claim score" that would look like a credibility rating.

**Avoid combining evidence count and confidence into a fake certainty score.**
`evidence_score` (structural) + AI verdict (packet analysis) + `beliefYes` (engagement) = a number that looks like independent certainty measurement. It is not. These three values must remain separate at all times.

**Always show uncertainty and context when displaying aggregates.**
If a chart shows 70% support, the n= count must be visible. 70% of 3 submissions is meaningless. 70% of 3,000 submissions is more meaningful but still not a truth measure. Context prevents the chart from being read as a precision measurement.

**Source type charts must never use a "good vs bad" color axis.**
`empirical_study` must not be colored green while `scripture_tradition` is colored red. This would encode the claim that empirical is good and scripture is bad — a philosophical position the platform does not take. Use neutral, distinct colors that indicate categories, not rankings.

---

## F. Recommended First Safe Chart

**Recommendation: Source Type Mix for a single claim — implemented per-claim in the Study view.**

### Why this one first

Source Type Mix is the safest aggregate to visualise because:

1. It is per-claim, not a global leaderboard — it describes one claim's evidence pool, not a ranking across claims
2. It is categorical (11 distinct types), not scalar — no number implies "more = better"
3. It directly supports the D-201 investment: users chose source types when submitting evidence; showing the distribution makes that metadata visible and useful
4. It invites reflection rather than conclusion: a user seeing "60% scripture/tradition" for a claim is prompted to think about the evidence base, not told the claim is false
5. The source_type_note ("origin is not proof") is already established copy — the chart and the note are a natural pair

**Not Source Type Mix globally** — global source type distribution aggregates all claims, which invites "most evidence on HumanX cites X" framing that could be misread as a platform endorsement of or bias against certain source types.

**Not Evidence Strength Mix first** — evidence strength is self-assessed. Showing "30% strong" for a claim's evidence pool is more misleading than source type distribution because "strong" sounds like it means something independent. It could wait for a second chart once the framing patterns are established.

---

## G. Data Requirements for First Safe Chart (Source Type Mix, per claim)

### Fields needed

- `evidence.source_type` — the 11-value enum added in D-201E
- `evidence.claim_id` — to filter to the current claim
- `evidence.review_state` — to include only `public` evidence (same filter as Study view)

### Whether current API already returns them

**Yes — fully covered by existing responses.**

`GET /api/claims/:id` returns the full evidence array via `getClaim()`, which now includes `e.source_type` in the SELECT (added in D-201E). The Study view already has all evidence rows with their `source_type` values in `selected.evidence`.

No new API endpoint is needed.

### Whether backend changes are needed

**None.** The data is already in the evidence array returned to the Study view. The chart is a pure frontend aggregation: count occurrences of each `source_type` value across `selected.evidence`.

### Whether frontend-only calculation is enough

**Yes.** JavaScript in `app-v10.js` can compute the distribution:

```js
function sourceTypeCounts(evidence) {
  const counts = {};
  (evidence || []).forEach(e => {
    const st = e.source_type || 'unknown';
    counts[st] = (counts[st] || 0) + 1;
  });
  return counts;
}
```

No backend aggregation query needed.

### How old/null values should be handled

- `source_type = NULL` or absent: count as `'unknown'`
- `source_type = 'unknown'`: count normally, displayed as "Unknown / not stated"
- If all evidence items have `source_type = NULL` or `unknown` (all legacy rows): display "No source type data yet — submit evidence with source type to see this chart"
- Minimum threshold before showing chart: at least 2 evidence items with non-null `source_type` (otherwise a chart with n=1 is misleading)

### Display format

A horizontal bar chart or pill count row — not a pie chart. Pie charts invite "slice = share of truth" misreading. A labeled bar or chip count row makes it clearer that each bar is a count of items, not a proportion of proof.

Include total n= count in the chart header. Include source_type_note below: "Source origin describes where material comes from, not whether the claim is true."

---

## H. What NOT to Build Yet

These chart types are explicitly deferred. They are not "future features to plan" — they are specific risks that require additional guardrail work before any design begins.

**Global leaderboards of any kind.**
Any list of claims ranked by engagement, evidence count, vote count, or AI verdict is a truth-by-popularity ranking in visual disguise. Not until explicit anti-leaderboard framing is designed and tested.

**"Most true" or "best supported" public rankings.**
Direct instantiation of the banned framing in Section C.

**AI confidence dashboards.**
Aggregating AI verdicts across claims into a distribution ("40% of analysed claims are Plausible") produces a number that looks like a platform-level assessment. The verdicts come from different packets, different users, different AI interactions — they are not comparable on a single axis.

**Ideology comparison charts.**
Any chart that groups claims by category and implies one category is more "supported" than another will be read as HumanX endorsing or attacking that category of belief. Not until very careful explicit framing exists.

**Claim scoring charts (evidence_score distribution).**
`evidence_score` is a structural investigation metric. Displaying it as a histogram of "how well-evidenced claims are" will be read as a quality distribution. It is not.

**User belief identity cards as public displays.**
Belief snapshot data is personal. Any public visualization of "this user's belief profile" violates the personal nature of the Belief Engine data and creates social pressure dynamics that are out of scope.

**Source type vs. evidence score correlation.**
"Claims backed by empirical studies score higher" would be a genuine finding — but also a finding the platform is not qualified to frame as a quality verdict. Not until the epistemological framing is much more developed.

---

## I. Existing Aggregate Surfaces and Their Current Risk Level

These surfaces already exist in the product. They were not built under these guardrails. They are listed here for awareness, not for immediate change.

| Surface | What it shows | Current risk |
|---------|---------------|--------------|
| Home status line: "X claims · Y truths · Z evidence" | Total row counts from `graph-status.js` | LOW — raw counts with no truth framing |
| Claim card: `▲ beliefYes ▼ beliefNo ~ uncertainty` | Vote engagement counts | LOW-MEDIUM — triangle symbols and "Believe/Reject" labels are intuitive but not labeled as non-truth signals |
| Claim detail: `evidence_score / survivability / testability` | Structural investigation metrics | MEDIUM — displayed as numbers out of 100, which reads like a percentage of "how proven" the claim is |
| `meMirrorBalanceCardHtml`: severity chip counts + quality chip counts | User's own pressure severity and evidence quality breakdown | LOW — shown only to the user for their own submissions; no truth framing |
| Study Analysis: evidence/test/survive meters in `analysisItem()` | AI-assessed structural scores from RunPack output | MEDIUM — now accompanied by provenance note (D-202C), but the meter bars themselves look like measurement instruments |
| Public profile claim list: `evidence_score/10` in description parts | Abbreviated evidence score in OG description meta | LOW — not prominently displayed; truncated format reduces misread risk |

None of these need immediate changes from this audit. They are noted for the next product-polish pass.

---

## J. Summary Table: What to Build, What to Avoid, What to Defer

| Chart | Build? | Why |
|-------|--------|-----|
| Source Type Mix, per claim | **Yes — D-203B** | Per-claim, categorical, directly uses D-201 data |
| Evidence Strength Mix, per claim | Later | Self-assessed; needs careful framing first |
| Support/Challenge Balance, per claim | Later | Risk of reading as "support = proven" |
| Belief Drift, per user, private | Exists (Drift section) | Already implemented; review framing in separate pass |
| Investigation Completeness, per claim | Later | Count display; add with source type chart |
| Moderation State Distribution | Admin-only, later | Fine for admin workload view |
| Global claim rankings | Never without additional guardrail work | Truth-by-popularity risk |
| AI verdict distribution | Never without additional guardrail work | Authority-laundering risk |
| "Truth Score" composite | Never | Banned |
| User belief identity cards (public) | Never in current design | Privacy + social pressure risk |
