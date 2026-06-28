# D-205 — Test Activity Chart Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `6f9758e`
**Baseline:** 1705/24/57
**Status:** COMPLETE — chart shipped, deploy confirmed, sanity passed

---

## D-205A — Audit Findings

Before implementing, the data model was inspected:

**`home_tests` columns (from `migrations/0002_home_tests.sql`):**

```
id, claim_id, user_id, title, instructions,
safety_level TEXT DEFAULT 'low',
difficulty TEXT DEFAULT 'easy',
created_at, updated_at
```

**Key findings:**

1. `difficulty` (easy / medium / hard) — stable enum, explicit values in the add-test form selects
2. `safety_level` (low / medium / high) — stable enum, explicit values in the add-test form selects
3. **No `status` field exists.** Tests are proposals — there is no `passed`, `failed`, `executed`, `completed`, or `in_progress` state in the data model. A test row represents a proposed procedure, not an executed experiment with a result.
4. `selected.tests` is already loaded in the Study view by `getClaim()` → full tests array returned in the claim detail response
5. Zero backend changes were required — all data was already present client-side

The absence of a status field was the most important finding. It rules out any "test results" framing and makes "Test activity" the only honest title.

---

## Why the Title Is `Test activity`, Not `Test results` or `Test coverage`

**Not `Test results`:** There are no results. Tests are proposals — instructions for what a person could do and what outcome would matter. No one has executed them; no outcome is recorded. "Results" would imply the system tracked what happened.

**Not `Test coverage`:** "Coverage" implies a standard that tests are measured against — like code coverage, which asks what percentage of branches are exercised. HumanX has no such standard. Saying "60% coverage" for a claim's tests would imply something meaningful about how thoroughly it has been tested. It has not been tested at all in the formal sense.

**`Test activity`:** Describes what the data actually is — a record of test proposals that have been submitted by users as part of their investigation. The word "activity" is in the same register as "evidence activity" and matches the chart pattern already established: all charts in this arc show what users have done inside the platform, not what has been proven about the claim.

---

## Where It Appears

**Study view — directly before the Tests list, after Pressure.**

Panel order in `study-grid`:

1. `st-mix-panel` — Source Type Mix
2. `es-mix-panel` — Evidence Strength Mix
3. `evidence-panel` — Evidence list
4. `pressure-panel` — Pressure
5. `ta-mix-panel` — Test Activity ← this chart
6. `tests-panel` — Tests list
7. `analysis-panel` — Analyses

Placement rationale: The two evidence-composition charts (Source Type Mix and Evidence Strength Mix) sit at the top of the investigation board as a pair. Placing the Test Activity chart adjacent to those would have created a dense three-chart header that crowds the Evidence list. Instead, the chart is placed directly above the Tests section it describes — the user sees "here is a summary of test difficulty distribution" immediately before "here are the test cards." This mirrors how the evidence charts contextualise the evidence list, but at the appropriate point in the board rather than forcing everything to the top.

---

## What It Uses

- `selected.tests` — the tests array already loaded for the Study view by `getClaim()`. No additional API call.
- `t.difficulty` — the only field aggregated. Values: `easy`, `medium`, `hard`, or absent.
- Null / empty / missing → counted as `'unknown'`

---

## Fixed Enum Order

```
easy → medium → hard → unknown
```

Defined by `TEST_DIFFICULTY_ORDER` constant. Applied via `.filter(k => counts[k])` — zero-count buckets are omitted. Not sorted by count, not sorted by "best first."

Rationale: easy-to-hard is the natural reading direction for a difficulty scale. `unknown` is appended last as the fallback bucket, visible only when tests lack a difficulty label (legacy rows or rows with null).

---

## What It Does NOT Use

- `belief_yes`, `belief_no`, `uncertainty` — no vote counts
- `evidence_strength` / `evidenceStrength` — strength of evidence is not a property of tests
- `source_type` / `sourceType` — source origin is irrelevant to test difficulty
- AI analysis verdicts — no `analysis_results` data
- `evidence_score`, `survivability`, `testability` — no structural scoring
- `review_state` — no moderation state
- `safety_level` — collected but not charted. Safety level describes risk to the person running the test; it is not an investigation-quality signal. Aggregating it could imply the platform is rating the riskiness of investigating a claim, which is a misframe.
- Pass / fail / executed status — does not exist in the data model

---

## Confirmed: No Backend Changes

`getClaim()` already returns the full tests array in its response (included in the claim detail object since D-190 era). `hardening-smoke-test.mjs` includes the test `D-205A: worker.js not changed` which guards this regression surface.

---

## Confirmed: No "Tests Prove Truth" Framing

The 19 smoke tests verify the chart function body contains none of: "Truth Score", "Verified by AI", "Proven by tests", "Passed means true", "Majority Says True".

The chart title is "Test activity" — not "Tests passed", "Tests confirmed", or any phrasing that implies an executed result.

The guardrail copy appears on every render:

> This panel shows submitted test activity, not proof of truth. A recorded test is part of investigation, not a final verdict.

The phrase "not a final verdict" directly addresses the risk: a user seeing "3 hard tests recorded" inferring that the claim has been rigorously tested and found credible. The note makes explicit that recording a test and executing it are different things.

---

## Live Deploy Sanity

Deployed from `HEAD = 6f9758e` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. Panel order correct: Source Type Mix → Evidence Strength Mix → Evidence list → Pressure → Test Activity → Tests list
2. Chart title reads "Test activity"
3. Guardrail copy visible: "submitted test activity, not proof of truth" and "not a final verdict"
4. Test submitted with difficulty = easy/medium/hard appears in the correct bar after reload
5. No chart text contains: "Proven by tests", "Passed means true", "Truth Score", "Verified by AI", "Majority Says True"
6. No console errors
7. No scoring or status changes observed
8. Tests list and all other panels unaffected

---

## Do-Not-Regress Rules for This Component

1. `renderTestActivityMix` must not read any field that implies test execution — if a `status`, `result`, or `executed_at` column is ever added to `home_tests`, it must not feed this chart without a separate guardrail review
2. The chart title must remain "Test activity" — not "Test results", "Test coverage", "Tests passed", or any variant that implies an executed or verified outcome
3. `TEST_DIFFICULTY_ORDER` must not be reordered to rank by count or by perceived difficulty rank
4. The phrase "not a final verdict" must remain in the guardrail copy — it is not optional and must not be shortened

---

## Future Consideration

If `home_tests` ever gains a `status` or `result` field (e.g., a user marks a test as "completed" or records an outcome), the chart can be extended to show a status distribution. That extension must be reviewed against the D-203A guardrail doc before implementation — specifically: "Does this chart rank claims by something that implies credibility?" A "completed tests" bar could be misread as "this claim has been tested and therefore is more credible." The extension will need explicit framing that distinguishes "user marked this as done" from "this test independently verified the claim."

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D205_TEST_ACTIVITY_CLOSEOUT.md` | This document |
| `public/app-v10.js` | `testDifficultyLabel()`, `TEST_DIFFICULTY_ORDER`, `renderTestActivityMix()`, ta-mix-panel injection |
| `scripts/hardening-smoke-test.mjs` | 19 new D-205A tests |
