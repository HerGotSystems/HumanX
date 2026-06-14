# Belief Engine Test Plan

## 1. Purpose

This plan defines the proof needed before changing Belief Engine scoring, contradiction
detection, profile output, or HumanX save bridge behaviour.

The Belief Engine is a standalone app that feeds data into the main HumanX frontend
through a bridge script. Changes to scoring logic, contradiction rules, or the payload
shape built by `humanx-bridge.js` can silently break Drift classification, score meter
display, and profile comparison — with no Worker error and no obvious failure visible at
the time of the change.

This document does not implement tests. It defines what must be verified and what the
current architecture actually does.

---

## 2. Source Files Checked

| File | Status |
|---|---|
| `public/apps/humanx-belief-engine/index.html` | Read — structure, screens, and CSS inspected |
| `public/apps/humanx-belief-engine/humanx-bridge.js` | Read in full |
| `public/app-v10.js` | Read — Drift, `isFullBeliefProfile`, snapshot card, and `renderProfileDrift` inspected |
| `src/worker.js` | Read — `/api/belief-snapshots` and `/api/belief-promote` endpoints confirmed |
| `docs/BELIEF_ENGINE_SCORING_NOTES.md` | Read in full |
| `docs/OPERATIONAL_STATUS.md` | Read in full |
| `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` | Present — defines manual QA baseline |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` | Read — belief-snapshots and belief-promote risks noted |
| `docs/BACKEND_SMOKE_TEST_PLAN.md` | Read — belief bridge section referenced |

---

## 3. Current Known Belief Engine Role

- **The Belief Engine lives at** `public/apps/humanx-belief-engine/index.html`.
  It is a fully standalone HTML app — it has its own styling, its own JavaScript, and
  loads `humanx-bridge.js` as its only external script dependency.

- **The main app navigates to it** via the Beliefs nav tab. `renderBelief()` in
  `public/app-v10.js` does `location.href = '/apps/humanx-belief-engine/'` — it is a
  hard redirect, not an embed or iframe.

- **The Belief Engine scores 77 statements** across 19 dimensions (9 core + 10 forensic),
  produces a radar chart, runs 36+ contradiction checks, aligns the result against ~40
  named worldview traditions, and generates 4 forensic meta-scores.

- **The save bridge (`humanx-bridge.js`)** reads `window.state` from the completed
  Belief Engine result, computes three summary scores (`stabilityScore`, `opennessScore`,
  `pressureScore`), builds a structured snapshot payload, and POSTs it to
  `/api/belief-snapshots` using a pseudonymous user id stored in `localStorage`.

- **The bridge injects a "Send to HumanX" button** into `.results-actions` using a
  `MutationObserver`. The button only appears when the result screen is visible.

- **The Drift page** in the main app separates snapshots into full profiles and quick
  belief records using `isFullBeliefProfile()`. Full profiles are classified by checking
  three fields in the payload: `source`, `engineVersion`, and `label`.
  If any of these fields change, Drift will misclassify saved profiles silently.

- **Quick belief records** are snapshots that do not match the `isFullBeliefProfile`
  check. They are displayed in a separate section and are not used in the drift
  delta calculation.

---

## 4. Behaviours to Preserve

Check each item before merging any change to the Belief Engine, `humanx-bridge.js`,
or the `/api/belief-snapshots` / `/api/belief-promote` endpoints.

### Navigation and loading

- [ ] Clicking the Beliefs nav tab in the main app navigates to
      `/apps/humanx-belief-engine/` without a 404 or blank page
- [ ] The Belief Engine intro screen loads standalone (no dependency on the main app
      being loaded or any session being active)
- [ ] The app loads without console errors on a first visit with no `localStorage` data

### Statement and question flow

- [ ] All Likert-style slider statements are reachable and interactive
- [ ] All forced-choice scenario questions are reachable and interactive
- [ ] The Timeline screen is reachable and all free-text inputs accept input
- [ ] Skipping the Timeline screen does not break scoring or the result page
- [ ] Progress through the flow can reach completion without being stuck on any screen

### Result page

- [ ] The final result page appears after all required screens are completed
- [ ] The radar chart renders with 9 dimensions (not 10 or 19)
- [ ] Forensic dimension bars appear in a separate section from the radar
- [ ] At least one worldview alignment match is shown
- [ ] Contradiction count and list are visible
- [ ] Coherence, Flexibility, Epistemic Discipline, and Evidence Resistance scores appear
- [ ] The "Send to HumanX" button appears in `.results-actions`
- [ ] Existing result banner appears on the intro screen if a previous result is in
      `localStorage` (allows re-viewing without re-running)

### Save bridge

- [ ] Clicking "Send to HumanX" calls `POST /api/belief-snapshots` and receives a
      successful response
- [ ] The button changes to "Sending…" during the request and "Saved to HumanX ✓"
      on success
- [ ] On failure, the button re-enables and an alert shows the error message
- [ ] The saved snapshot appears in the Drift page of the main app under
      "Full Belief Engine Profiles" (not "Quick Belief Records")
- [ ] Calling "Send to HumanX" a second time for the same result creates a second
      snapshot entry (this is current behaviour — not treated as a duplicate by the
      backend, unlike claims/truths)

### Drift classification (critical — must not regress)

`app-v10.js` classifies a snapshot as a full Belief Engine profile using this check:
```js
function isFullBeliefProfile(s) {
  return String(s?.source||'').includes('standalone-humanx-belief-engine')
      || String(s?.engineVersion||'').includes('humanx-belief-engine')
      || String(s?.label||'').includes('Belief Engine Profile')
}
```

The following bridge payload fields must not change their values:

| Field | Current value | Used for |
|---|---|---|
| `source` | `'standalone-humanx-belief-engine'` | `isFullBeliefProfile` primary check |
| `engineVersion` | `'humanx-belief-engine-v2.0'` | `isFullBeliefProfile` fallback check (updated D-124C; check is `.includes('humanx-belief-engine')` so both v1 and v2 snapshots classify correctly) |
| `label` | `'Belief Engine Profile — {topAlignment.name}'` | `isFullBeliefProfile` third check |

If any of these values change, **all previously saved full profiles will be
reclassified as quick records** in Drift, silently and retroactively.

### Score ranges and Drift delta

`renderProfileDrift` in `app-v10.js` uses these fields from the saved snapshot:

| Field | Source in bridge | Drift threshold |
|---|---|---|
| `stabilityScore` | `round((EVID + HUMI + (100-RIGD) + OPEN) / 4)` | ±10 for movement signal; ±20 for verdict |
| `opennessScore` | `round((OPEN + HUMI + SELF + (100-DOGM)) / 4)` | ±10 for movement signal; ±20 for verdict |
| `pressureScore` | `round((FUSE + TRIB + PAIN + DOGM) / 4)` | ±10 for movement signal; ±20 for verdict |
| `contradictionCount` | `contradictions.length` | >0 or <0 for movement signal |

- [ ] `stabilityScore` is an integer between 0 and 100 after any scoring change
- [ ] `opennessScore` is an integer between 0 and 100 after any scoring change
- [ ] `pressureScore` is an integer between 0 and 100 after any scoring change
- [ ] `contradictionCount` is a non-negative integer
- [ ] None of the four values are `NaN`, `null`, `undefined`, or a non-numeric string
- [ ] Drift delta labels ("pressure rising", "stability rising", etc.) still fire at
      the correct thresholds

### Quick belief records

- [ ] Snapshots saved via the main app's quick belief form (not the Belief Engine) do
      not match `isFullBeliefProfile` and remain in the "Quick Belief Records" section
- [ ] Quick records still display `dominantPattern`, `stabilityScore`, `opennessScore`,
      `pressureScore`, `label`, `summary`, and timestamp

### Safety

- [ ] No API keys, `HUMANX_ADMIN_TOKEN`, or internal environment variables appear in
      any Belief Engine or bridge response
- [ ] `window.state` is not readable from an external origin
- [ ] The bridge does not expose the user's full `localStorage` contents

### Mobile layout

- [ ] Intro screen is readable and the start button is tappable on a phone
- [ ] Likert sliders are usable on a touchscreen
- [ ] The result page does not require horizontal scrolling
- [ ] The radar chart renders at an acceptable size on a 390px screen
- [ ] "Send to HumanX" button is tappable on mobile

---

## 5. Scoring Areas Requiring Tests Before Changes

Each item below is a scoring area that must have a documented baseline before any
change is made. See `docs/BELIEF_ENGINE_SCORING_NOTES.md` for the implementation
details behind each.

### Bridge-computed summary scores

The three scores sent to HumanX are computed in `humanx-bridge.js`, not in the
Belief Engine itself. They are derived from raw dimension scores in `window.state.scores`.

| Score | Dimensions used | Risk if changed |
|---|---|---|
| `stabilityScore` | EVID, HUMI, RIGD (inverted), OPEN | Drift delta thresholds in `app-v10.js` are calibrated to 0–100 integers |
| `opennessScore` | OPEN, HUMI, SELF, DOGM (inverted) | Same |
| `pressureScore` | FUSE, TRIB, PAIN, DOGM | Same |

### Core 9 dimension scores (`DIMS`)

These feed the radar chart and alignment comparison. Any change to question weights,
`CHOICE_SCALE`, or answer mappings will shift these scores. Tests needed:
- Baseline output for each of the 9 dimensions across at least 3 known answer profiles
- Confirm radar chart still renders with exactly 9 dimensions

### `CHOICE_SCALE` calibration

Currently `CHOICE_SCALE = 3`. Scenario (forced-choice) questions contribute
`weight * CHOICE_SCALE * 2` to dimension scores. Changing this will silently shift
all scenario-weighted dimensions. A before/after comparison against at least one
known profile must be run. See `docs/BELIEF_ENGINE_SCORING_NOTES.md` section 3.

### Contradiction count and coherence

- 36+ contradiction rules, each referencing specific answer key indices and dimension
  score thresholds
- Coherence score = `clamp(100 - sum of severity penalties)`
  with penalty weights: critical −18, high −12, moderate −7, low −4, unknown −5
- Reordering answer choices for any question referenced in a contradiction `check()`
  will silently break that rule — see `docs/BELIEF_ENGINE_SCORING_NOTES.md` section 4
- Tests needed: run each manual test profile (section 7) and record contradiction
  count and severity breakdown before any rule change

### Dominant pattern / profile label

The `dominantPattern` field in the bridge payload is `topAlignments[0]?.name` if
present, or `topDimension(scores)` as a fallback. The `label` field is:
- `'Belief Engine Profile — {topAlignment.name}'` when an alignment match exists
- `'Belief Engine Full Profile'` as fallback

Both values appear in the Drift card badge and header. If alignment matching is
changed, the dominant pattern label will change for all future profiles.

### Result summary text

The `summary` field is:
```
Full 77-statement HumanX Belief Engine profile.
Dominant dimension: {topDimension}. Top alignment: {name}. Contradictions detected: {n}.
```
It is displayed in the Drift snapshot card and mini-card. It must remain a non-empty
string after any change.

### Bridge payload shape

The full payload posted to `/api/belief-snapshots` must include:
`label`, `engineVersion`, `source`, `dominantPattern`, `summary`, `beliefCount`,
`contradictionCount`, `stabilityScore`, `opennessScore`, `pressureScore`,
`dimensions` (object of score keys to values), `topBeliefs` (array), `contradictions`
(array of strings), `stressPoints` (array), `raw` (object).

Any field removal or rename will silently break Drift display or prevent correct
`isFullBeliefProfile` classification.

---

## 6. Known Risk Areas

| Risk | Detail |
|---|---|
| **Completion flow** | If any screen transition breaks, users cannot reach the result page and the save bridge is never invoked. The bridge checks `window.state.scores` — if scores are missing or null, the bridge throws and the button shows an error alert |
| **Excessive scrolling on result page** | The result page includes a radar chart, 10 forensic bars, contradiction list, alignment matches, forensic meta-scores, and optional timeline. On mobile this is a long scroll. Making the result page longer without testing on a phone is a risk |
| **Experimenting with different answers** | The Belief Engine has an "existing result" banner on the intro screen for returning users. If a user clears `localStorage` or opens a private window, they start fresh — the bridge will create a new snapshot, not overwrite the old one |
| **Repeated saves / duplicate snapshots** | There is no duplicate guard on `POST /api/belief-snapshots`. A user who clicks "Send to HumanX" twice will create two snapshot rows. Drift will show both as separate full profiles and use them in the delta comparison |
| **Bridge payload shape** | `app-v10.js` reads `source`, `engineVersion`, `label`, `dominantPattern`, `stabilityScore`, `opennessScore`, `pressureScore`, `contradictionCount`, `summary`, and `id` from the saved snapshot. These are not typed or validated — any shape change is a silent regression |
| **Drift classification** | `isFullBeliefProfile` checks three string fields. These checks are string-contains, not exact-match. If `source` is changed to e.g. `'belief-engine-standalone'` (missing `'standalone-humanx-belief-engine'`), existing profiles will be reclassified as quick records |
| **Mobile readability** | The radar chart uses SVG. On very narrow screens the chart may render at a size that makes the dimension labels unreadable. This has not been tested on all screen sizes |
| **Future contradiction logic becoming too moralistic** | The existing 36+ rules detect internal tensions in stated beliefs. New rules that judge the quality or acceptability of beliefs (rather than their internal consistency) would change the nature of the "coherence" score from editorial pressure to moral judgement — see `docs/BELIEF_ENGINE_SCORING_NOTES.md` section 7 |
| **Future contradiction logic becoming too vague** | Contradiction rules that fire on dimension scores alone (without answer key checks) are less precise than those that check specific answer choices. Vague rules will increase false positives and inflate contradiction counts for typical profiles |
| **Choice-index drift** | Contradiction rules reference answer keys like `a.TR1`, `a.MO3`. The check value is the selected-choice index, not the choice text. If question choices are reordered without updating the contradiction array, the wrong choices will trigger rules silently |

---

## 7. Recommended Manual Test Profiles

Run these five profiles manually before any scoring or contradiction change to establish
a baseline. Record: `stabilityScore`, `opennessScore`, `pressureScore`,
`contradictionCount`, `coherence`, `dominantPattern`, and `label` for each.

### Profile 1 — Stable Inherited Belief

**Answer pattern:** Set all Likert sliders toward the high end of AUTH, ABSO, RIGD, RITE
and low on EVID, META (non-physical), PROG. For scenario questions, always choose the
traditional/authority-deferring option. Skip the timeline.

**What to check:**
- `stabilityScore` should be moderate-to-low (RIGD is high but OPEN and EVID are low —
  the formula `(EVID + HUMI + (100-RIGD) + OPEN) / 4` will pull the result down)
- `pressureScore` should be elevated (FUSE, TRIB, DOGM likely high)
- Contradiction count should be low if answers are internally consistent
- `dominantPattern` should align with a tradition-oriented worldview name
- Coherence should be high if no internal tensions are detected

### Profile 2 — Open but Pressured Belief

**Answer pattern:** High OPEN, HUMI, SELF. Also high TRIB, PAIN — answers reflect
openness to revision but strong group belonging and emotional investment. Scenario
questions split between individual judgment and group loyalty.

**What to check:**
- `opennessScore` should be high (OPEN, HUMI, SELF are all high)
- `pressureScore` should also be high (TRIB and PAIN are high)
- This combination tests whether the bridge correctly handles a profile where both
  openness and pressure are simultaneously elevated — the scores should not cancel
- Contradiction count may be moderate — the combination of openness and tribal load
  could trigger contradiction rules designed to detect this tension

### Profile 3 — High Contradiction Belief

**Answer pattern:** Maximally inconsistent answers. High EVID but also high META (non-physical).
High ABSO but also high HUMI. High RIGD but also high OPEN. For scenario questions,
alternate between opposing orientations.

**What to check:**
- Contradiction count should be significantly higher than profiles 1 and 2
- `coherence` should be clearly below 100 — check that the penalty weights from
  `docs/BELIEF_ENGINE_SCORING_NOTES.md` section 6 produce a non-zero reduction
- `stabilityScore` and `opennessScore` will likely be mid-range due to opposing inputs
- At least one contradiction should appear with `critical` or `high` severity
- The result page must still render without NaN or null in any score display

### Profile 4 — Low Pressure / Low Identity Belief

**Answer pattern:** Low FUSE, TRIB, PAIN, DOGM. Low RIGD. Moderate-to-high EVID. Answers
reflect a belief system held lightly with minimal group or emotional attachment. Complete
the timeline with neutral, non-stress-indicating responses.

**What to check:**
- `pressureScore` should be low (all four input dimensions are low)
- `stabilityScore` should be moderate-to-high (RIGD is low which helps the `(100-RIGD)`
  term, EVID and OPEN are high)
- `contradictionCount` should be low
- Coherence should be near 100
- `dominantPattern` should reflect a secular or evidence-oriented tradition
- Stress points array in bridge payload should be empty or minimal

### Profile 5 — Opportunistic / Random Answer Pattern

**Answer pattern:** Randomise all slider values. Use random scenario choices with no
consistent orientation. Do not skip any screen. Complete the timeline with random text.

**What to check:**
- All three bridge scores must be integers in range 0–100 — confirm no NaN
- `contradictionCount` must be a non-negative integer
- The result page must render without crashing
- `label` must be a non-empty string (falls back to `'Belief Engine Full Profile'` if
  no alignment is confident)
- `summary` must be a non-empty string
- The bridge payload posted to `/api/belief-snapshots` must be valid JSON

---

## 8. Required Proof Before Scoring Changes

Complete this checklist before beginning any change to scoring logic, contradiction
rules, `CHOICE_SCALE`, dimension mappings, or bridge payload construction.

- [ ] Run all five manual test profiles from section 7 and record baseline outputs:
      `stabilityScore`, `opennessScore`, `pressureScore`, `contradictionCount`,
      `coherence`, `dominantPattern`, `label` for each
- [ ] Confirm score ranges for all five profiles are 0–100 integers before the change
- [ ] Confirm `contradictionCount` is a non-negative integer for all five profiles
      before the change
- [ ] After the change, run all five profiles again and confirm the expected delta:
      if the change is intended to affect one profile type, confirm other profiles
      are not unexpectedly changed
- [ ] Confirm `isFullBeliefProfile` still classifies the saved snapshot as a full profile
      (check `source`, `engineVersion`, and `label` values in the saved DB row)
- [ ] Confirm Drift still shows the saved snapshot under "Full Belief Engine Profiles",
      not "Quick Belief Records"
- [ ] Confirm no frontend route change is needed to make the change work
- [ ] Run `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` in full against the deployed app
- [ ] Test the complete flow at least once on a phone (intro → statement flow → result
      → Send to HumanX → Drift)

---

## 9. Non-Goals

The following are explicitly out of scope for any test-plan task or scoring-change task
until explicitly overridden:

- No scoring redesign — tests must establish a baseline first; redesign is a separate task
- No contradiction rule rewrite — same constraint; baseline first
- No UI redesign of the Belief Engine or result page
- No D1 schema change
- No changes to `src/worker.js`
- No Wrangler or D1 commands

---

## 10. Stop Conditions

Stop work on the Belief Engine immediately if any of the following occur:

- **Belief Engine blank page** — the intro screen or any screen does not render;
  do not proceed with scoring changes until the render is confirmed working
- **Final result cannot be reached** — any screen transition that prevents completion
  must be fixed before scoring changes
- **Save bridge fails** — `POST /api/belief-snapshots` returns an error, or the button
  throws and never sends; fix the bridge before testing scoring
- **Drift no longer recognizes full profiles** — saved profiles appear under
  "Quick Belief Records" instead of "Full Belief Engine Profiles"; this means
  `source`, `engineVersion`, or `label` has changed in the bridge payload
- **Score values become NaN, null, or undefined** — any of the three bridge-computed
  scores or any core dimension score is not a finite number; do not deploy
- **Mobile result page becomes unreadable** — horizontal overflow, text cut off,
  or radar chart too small to read on a 390px screen; fix before shipping
- **Any change requires Worker, D1, or schema work** — stop and document the
  dependency before proceeding; it is out of scope for a Belief Engine change
