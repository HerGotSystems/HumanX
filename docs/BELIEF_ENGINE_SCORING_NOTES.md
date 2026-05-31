# Belief Engine Scoring Notes

Internal reference for agents and contributors working on
`public/apps/humanx-belief-engine/index.html`.

Do not change scoring logic without reading this file first.

---

## 1. Purpose

The Belief Engine scores 77 statements across 19 dimensions using a
combination of Likert-style sliders and forced-choice scenario questions.
The output drives:

- A 9-dimension radar chart (core worldview)
- 10 forensic/psychological dimension bars (structural layer)
- Alignment matching against ~40 named worldview traditions
- 36+ contradiction checks
- 4 forensic meta-scores (Coherence, Flexibility, Epistemic Discipline,
  Evidence Resistance)
- An optional Belief Timeline analysis (open text, not scored)

---

## 2. Core dimensions vs forensic dimensions

**Core 9 — `DIMS` (line ~648)**

Used for the radar chart, alignment comparison, gap analysis, and
fragmentation score. These represent a person's publicly articulable
worldview orientation.

| Key  | Label           | Description |
|------|-----------------|-------------|
| META | Metaphysical    | Openness to non-physical explanations of reality |
| EVID | Evidence        | Reliance on empirical and testable truth |
| AUTH | Authority       | Deference to hierarchy, tradition, and external power |
| COLL | Collective      | Priority of group over individual |
| RITE | Sacred/Ritual   | Weight given to ritual, sacred objects, and spiritual practice |
| ABSO | Absolutism      | Belief in fixed, universal moral truths |
| RIGD | Rigidity        | Resistance to changing core beliefs |
| PROG | Progress        | Optimism about human and technological advancement |
| TRAN | Transcendence   | Need for meaning that extends beyond the material world |

**Forensic 10 — `FORENSIC_DIMS` (line ~661)**

Psychological and structural dimensions. Not compared against traditions.
Shown in a separate bar section beneath the radar. Represent how a belief
system was acquired and maintained, not what it contains.

| Key  | Label               |
|------|---------------------|
| INHR | Inherited           |
| SELF | Self-Built          |
| TRIB | Tribal Load         |
| PAIN | Pain Architecture   |
| EXPR | Experience          |
| DOGM | Dogma Load          |
| OPEN | Revision Openness   |
| FUSE | Identity Fusion     |
| HUMI | Epistemic Humility  |
| STRS | Stress Ethics       |

**`ALL_DIMS = [...DIMS, ...FORENSIC_DIMS]`** is used for scoring only.
Only the core 9 feed the radar. Do not pass forensic dimensions into the
radar without adding a separate visual track.

---

## 3. `CHOICE_SCALE` assumption

**Defined at line ~1569:**

```js
const CHOICE_SCALE = 3;
```

Scenario (forced-choice) questions contribute to dimension scores at
`weight * CHOICE_SCALE * 2`. The `* 2` accounts for the binary
all-or-nothing nature of a single selection; `CHOICE_SCALE = 3` then
makes that selection weigh approximately as much as three strong Likert
agreements on related statements.

**This is an intentional editorial calibration, not a mathematical
derivation.** It was set to prevent scenario answers from being swamped
by the larger number of Likert items, while avoiding scenario answers
dominating the total.

If `CHOICE_SCALE` is changed:
- Scenario questions will under- or over-represent relative to Likert items.
- Alignment scores will shift for any worldview tradition whose matching
  dimensions rely heavily on scenario questions.
- This will not produce an obvious runtime error — it will silently
  produce different scores.

---

## 4. Choice-index contradiction risk

Many contradiction checks reference answer keys like `a.TR1`, `a.MO3`,
`a.DE5`, etc. These keys are question IDs. The check value is the
**index of the selected choice within the choices array**, and the
threshold is typically `>= 1` (any non-first choice) or a specific index.

**Example (line ~1190):**
```js
check:(a,s)=>(a.TR1??0)>=1 && (a.TR3??0)>=1 && s.EVID>60 && s.META>50
```

This fires when the user selected choice index ≥ 1 for both `TR1` and
`TR3`. If the choices array for `TR1` or `TR3` is reordered, the wrong
choice will trigger (or fail to trigger) the contradiction — **silently
and without a runtime error**.

Some checks use specific index values (e.g. `=== 2`) to target a
particular answer. These are the most fragile.

**Risk:** Any reordering of choices for a question that appears in a
contradiction check will silently corrupt that check's logic.

---

## 5. Timeline optional-answer limitation

The Belief Timeline screen is **optional** — users can skip it. All
timeline inputs (`tl-child-belief`, `tl-teen-change`, `tl-adult-belief`,
`tl-biggest`, `tl-fear-true`, `tl-isolate`, `tl-identity`) are free-text
and not scored numerically.

Timeline contradiction checks and narrative analysis only fire when the
relevant `state.timeline` fields contain non-empty strings. If a user
skips the timeline:

- No timeline contradictions fire.
- The timeline section of the forensic analysis is omitted.
- This is correct behaviour, not a bug.

Do not treat an absent timeline result as incomplete scoring — it reflects
a user's choice to skip.

---

## 6. Coherence score penalty weights

**Formula (line ~1793):**

```js
coherence: clamp(100 - (contradictions||[]).reduce(
  (t,c) => t + ({critical:18, high:12, moderate:7, low:4}[c.severity] || 5),
  0
))
```

Penalty weights per contradiction severity:

| Severity | Penalty |
|----------|---------|
| critical | −18     |
| high     | −12     |
| moderate | −7      |
| low      | −4      |
| unknown  | −5      |

**These weights are editorial design choices.** They were calibrated so
that a single critical contradiction produces a clearly sub-100 score
without collapsing it to zero, and accumulation of lower-severity
contradictions can produce comparable impact.

They are not derived from a psychological model or statistical baseline.
Do not treat coherence as an objective psychological measurement — it is
a structured editorial pressure instrument.

A score of 100 means no detected contradictions, not that a belief system
is internally consistent in an absolute sense.

---

## 7. Safe change rules for future agents

1. **Do not reorder choice options** for any question that appears in a
   contradiction `check()` function without updating every affected check.
   Grep for the question key (e.g. `TR1`, `MO3`) across the
   `CONTRADICTIONS` array before reordering.

2. **Do not change `CHOICE_SCALE`** without documenting the reason and
   re-testing alignment scores against known profiles. A change from 3 to
   any other value will silently shift all scenario-weighted dimensions.

3. **Do not mix forensic dimensions into the 9-dimension radar.** The
   radar is bound to `DIMS` (9 items). Adding forensic dimensions would
   distort the polygon geometry and break alignment comparison. Add a
   separate visual if forensic radar representation is needed.

4. **Treat coherence score as editorial pressure, not objective truth.**
   Do not label it as a clinical or psychological measurement in any UI
   copy. It reflects the number and weight of internal tension signals
   detected by the engine's rule set.

5. **Add tests before changing contradiction logic.** The contradiction
   array has 36+ rules with interdependencies across answer keys and
   dimension scores. A unit test or smoke test against known answer
   fixtures should be run before any rule is modified or added.
   See `scripts/hardening-smoke-test.mjs` for the existing test pattern.
