# D-209D — Per-Field Belief Consent Specification

**Date:** 2026-06-28
**HEAD at spec time:** `e7d34e9`
**Baseline:** 1805/24/57
**Status:** SPEC ONLY — no code changes

---

## A. Current Safe Baseline

After D-208B and D-209B, the system is in the following state:

| Surface | What is visible |
|---------|----------------|
| Public shared snapshot card | Owner-written label, tension count, date, static guardrail copy |
| Owner preview card (Profile Settings) | Identical to public card — aligned in D-209B |
| Private My HumanX / Mirror | Full snapshot data including `dominant_pattern`, scores, tensions (owner-only) |
| Private My HumanX / Belief reflection | Source habits, evidence strength habits, investigation activity (owner-only) |
| Public API (`/api/u/:slug`) | `sharedSnapshot` object with: `label`, `stabilityScore`, `opennessScore`, `pressureScore`, `contradictionCount`, `createdAt` — scores travel over the wire but are not rendered |
| Public profile render | Does not render scores, pattern labels, or alignment names |

**What is confirmed NOT on any public surface:**
- `dominant_pattern`
- `top_beliefs_json`
- `topAlignmentName`
- Named religious, ideological, or worldview alignments
- `dimensions_json`
- `raw_json`
- `contradictions_json`
- `stress_points_json`
- Private My HumanX reflection cards

This baseline must be preserved as the floor. No regression allowed.

---

## B. Consent Principle

> **Belief sharing is field-by-field, default-private, previewed before publish, and reversible.**

Corollaries:

1. **Field-by-field:** Sharing a snapshot does not share all fields. Each field group requires its own explicit opt-in.
2. **Default-private:** Every field group starts off. A user who does nothing shares only the Class-1 basics already in the current baseline.
3. **Previewed before publish:** The owner sees the exact public card, updated live, before saving. No surprises.
4. **Reversible:** Any field can be turned off and the public API response updates immediately. No field is permanently disclosed.

---

## C. Field Groups

### Group 1 — `basic_snapshot`

**Contents:**
- `label` — owner-written snapshot name
- `createdAt` — snapshot date
- `contradictionCount` — integer count of flagged tensions

**Classification:** Class 1 — safe public basics.

**Default:** `true` when a snapshot is shared. These fields carry no identity content — the label is owner-written, the date is a timestamp, the count is an integer.

**Notes:** No additional warning needed. Existing guardrail copy is sufficient. This is the current public baseline — no change to implement.

---

### Group 2 — `pattern_summary`

**Contents:**
- `dominant_pattern` — the engine-generated belief archetype label (e.g., "Traditional Conservatism", "Scientific Materialism")

**Classification:** Class 2 — sensitive belief identity.

**Default:** `false`.

**Risk:** `dominant_pattern` can name a religion, political ideology, or worldview. Exposing it publicly labels the owner with an identity category they may not have intended to share. Requires the strongest available warning before enabling.

**Notes:** Even with consent, the public render must frame it as a self-reported pattern derived from questionnaire answers — not a verified religious affiliation or external classification. The heading "Self-reported belief pattern" (not "Identity") should be used. The field name in the public API response must be `patternLabel`, not `dominantPattern`, to prevent client-side code from treating it as an authoritative identity label.

---

### Group 3 — `alignment_labels`

**Contents:**
- Top belief system alignment names from `top_beliefs_json` — an array of named systems with similarity percentages (e.g., "Islam 78%", "Secular Humanism 64%")
- Extracted as a sanitized public array: names only, no raw percentages unless explicitly opted in

**Classification:** Class 2 — highly sensitive belief identity.

**Default:** `false`.

**Risk:** The highest-risk group. Named religious, ideological, and worldview labels directly identify belief systems that are protected characteristics in many jurisdictions. A user seeing "Traditional Christianity 81%" on their public profile may not have understood this would be public when they completed the questionnaire. This group requires:
- The most prominent warning of all groups
- A separate explicit acknowledgment step (not just a toggle)
- Clear statement that public profile visitors — including employers, strangers, and automated scrapers — can see this

**Notes:** `top_beliefs_json` must never be returned raw publicly, even with consent. If `alignment_labels` is enabled, the API returns a sanitized array of names only: `["Traditional Christianity", "Secular Humanism"]`. Percentages are omitted from the public response. The full array with percentages remains available to the owner via the private API only.

**Hard rule:** `top_beliefs_json` is never returned raw publicly under any consent state.

---

### Group 4 — `scores`

**Contents:**
- `stabilityScore` — belief stability score (0–100)
- `opennessScore` — openness to revision score (0–100)
- `pressureScore` — belief-under-pressure score (0–100)

**Classification:** Class 3 — sensitive inference.

**Default:** `false`.

**Risk:** Numeric scores allow inference about cognitive style, flexibility, and worldview rigidity. "Stability 94" could be read as ideological rigidity. "Openness 12" could be read as closed-mindedness. These inferences are not what the scores measure, but they are how a naive reader will interpret them. Requires framing copy adjacent to the scores on the public card.

**Notes:** Scores are already in the `getPublicProfile` API response (as `stabilityScore`, `opennessScore`, `pressureScore`) but are not rendered in the public card. If `scores` is enabled, the public card renders them with the required framing copy. If not enabled, the API should ideally omit them from the response to avoid wire leakage — this is a D-209F cleanup item.

---

### Group 5 — `reflection_habits`

**Contents:**
- Source type distribution (from the owner's private evidence `source_type` breakdown)
- Evidence strength distribution (from the owner's private evidence `evidence_strength` breakdown)
- Investigation activity counts (evidence/pressure/tests)

**Classification:** Class 4 — private-only self-study.

**Default:** `false`. **Must not be exposed publicly under the current architecture.**

**Risk:** These cards derive from the owner's private investigation history — which claims they looked at, what evidence they submitted, how they categorized it. Exposing this publicly reveals private research patterns and could be used to infer belief investment, epistemological style, or claim bias. These are not belief statements the user has chosen to make public.

**Notes:** The reflection habits data comes from `SELECT * FROM evidence WHERE user_id=?` — the private endpoint. There is no public API field that currently carries this data. Implementing public exposure would require a new API path, a new data aggregation step, and a dedicated consent model for investigation data (separate from the belief snapshot consent model). **Do not implement public reflection habits in the D-209 arc.** If this is ever reconsidered, it requires its own full audit.

---

### Group 6 — `drift_history`

**Contents:**
- Confidence/belief score change over time across multiple snapshots
- Delta indicators: stability Δ, openness Δ, pressure Δ, contradiction Δ
- Drift verdict label (e.g., "stability rising", "pressure rising")

**Classification:** Class 3 — sensitive inference timeline.

**Default:** `false`.

**Risk:** Drift data reveals change over time — potentially showing when a user's beliefs shifted, how quickly, and in what direction. This is a longitudinal identity signal. "Stability falling rapidly" may read as deradicalization or crisis. "Pressure rising" over a short period may correlate with life events. This is more sensitive than a single snapshot because it reveals trajectory.

**Notes:** Drift is currently computed client-side in `renderProfileDrift()` from the private snapshot list. There is no public API field for drift. Implementing public drift would require a new data aggregation step. **Do not implement public drift exposure in the D-209 arc.** If considered later, requires a dedicated audit.

---

## D. Recommended `visibility_json` Shape

### Schema

```json
{
  "basic_snapshot": true,
  "pattern_summary": false,
  "alignment_labels": false,
  "scores": false,
  "reflection_habits": false,
  "drift_history": false
}
```

### Parsing rules

| Rule | Behaviour |
|------|-----------|
| Column absent / NULL | All groups default to `false` (private) |
| Column present, value `'{}'` | All groups `false` — same as absent |
| `basic_snapshot` not present in JSON | Default `true` — always return Class-1 basics when snapshot is shared |
| Unknown keys | Ignored silently — forward-compatible |
| Malformed JSON | Treat as `{}` — all groups `false` |
| `reflection_habits: true` in DB | Ignored by `getPublicProfile` — reflection habits are not exposed publicly in this arc regardless of consent state |
| `drift_history: true` in DB | Ignored by `getPublicProfile` — drift is not exposed publicly in this arc |

### Storage location

One `visibility_json` column on `belief_snapshots`. Stored per snapshot, not per user. This means an owner could share two snapshots with different visibility settings — one with scores enabled, one without. This is the intended design: each snapshot is an independent disclosure decision.

---

## E. Public API Response Rules

### Current `getPublicProfile` snapshot SELECT

```sql
SELECT label, stability_score, openness_score, pressure_score, contradiction_count, created_at
FROM belief_snapshots
WHERE user_id=? AND public_summary_enabled=1 AND hidden_at IS NULL LIMIT 1
```

After D-209E/F, this SELECT should be extended to include `visibility_json`:

```sql
SELECT label, stability_score, openness_score, pressure_score, contradiction_count, created_at, visibility_json
FROM belief_snapshots
WHERE user_id=? AND public_summary_enabled=1 AND hidden_at IS NULL LIMIT 1
```

`dominant_pattern` and `top_beliefs_json` remain excluded from the SELECT unless `alignment_labels` or `pattern_summary` will be exposed — at which point they must be selected but are still not returned raw in the response object.

### Response shaping rules per group

#### `basic_snapshot` (always true)
```
label          → response.label       (string or null)
contradictionCount → response.contradictionCount  (integer)
createdAt      → response.createdAt   (timestamp)
```

#### `pattern_summary` (if `visibility_json.pattern_summary === true`)
```
dominant_pattern → response.patternLabel  (string — renamed, not "dominantPattern")
```
Must be accompanied by static framing in the render: "Self-reported belief pattern from questionnaire answers."

#### `alignment_labels` (if `visibility_json.alignment_labels === true`)
```
top_beliefs_json → parse → extract names only → response.alignmentLabels  (string[])
```
**Never return raw percentages. Never return the full `top_beliefs_json` blob.**
Maximum 3 names in the public array. Names must be sanitized strings.

#### `scores` (if `visibility_json.scores === true`)
```
stability_score  → response.stabilityScore  (integer)
openness_score   → response.opennessScore   (integer)
pressure_score   → response.pressureScore   (integer)
```
Must be accompanied by framing copy in the render: "Reflection signals — not rankings of intelligence, morality, or correctness."

#### `reflection_habits` — **not exposed in this arc regardless of consent state**

#### `drift_history` — **not exposed in this arc regardless of consent state**

### Hard rules

1. `top_beliefs_json` is never returned raw publicly under any consent state.
2. `dimensions_json` is never returned publicly under any consent state.
3. `raw_json` is never returned publicly under any consent state.
4. `contradictions_json` is never returned publicly under any consent state.
5. `stress_points_json` is never returned publicly under any consent state.
6. `user_id` and `email` are never included in any public API response.
7. The public render must tolerate any field being absent — graceful degradation, not error.
8. The private endpoint (`/api/my-humanx`, `/api/belief-snapshots`) is unchanged — returns full owner data regardless of `visibility_json`.

---

## F. UI Consent Model

### Field-group toggle panel

Location: My HumanX → Profile Settings → below the snapshot selection list.

Appears only when a snapshot is selected for sharing (`public_summary_enabled=1`).

Layout:
```
── What will appear on your public profile? ─────────────
☑ Basic snapshot (label · tension count · date)    [always on when sharing]
☐ Belief pattern label                              [default off]
☐ Top belief alignments                             [default off — warning]
☐ Reflection scores                                 [default off]
─────────────────────────────────────────────────────────
[Preview] ← updates live as toggles change
```

### Toggle requirements

| Toggle | Default | Warning level |
|--------|---------|--------------|
| `basic_snapshot` | Checked, disabled (always on) | None |
| `pattern_summary` | Unchecked | Inline note |
| `alignment_labels` | Unchecked | Prominent warning + acknowledgment |
| `scores` | Unchecked | Inline note |

### Preview requirements

- The preview card updates live as toggles change — no save required to see the effect.
- The preview must render the **exact** public card, not a simulation.
- The preview label reads: "This is exactly what public profile visitors will see."
- If all sensitive toggles are off, the preview shows the current baseline (label + tension count + date + guardrail).

### No "share all" button

There must be no mechanism that enables all field groups at once. Each toggle must be individually acknowledged.

### Revoke / hide controls

- "Stop sharing this snapshot" button must be visible at all times when a snapshot is shared.
- Clicking it sets `public_summary_enabled=0` and clears `visibility_json` (or sets all fields false).
- Effect is immediate on next request — no caching lag.
- The UI must confirm: "Your snapshot is no longer public. You can re-share it later."

### Save behaviour

- Toggles are not saved until the owner clicks "Save sharing settings."
- The preview updates optimistically while unsaved; the public API reflects only the saved state.
- On save: POST to `/api/my-humanx/profile-settings` (or a new dedicated endpoint) with the `visibility_json` payload.

---

## G. Warning Copy

### General sharing (shown near the snapshot selection control)

> Only the fields you turn on will appear publicly. You can hide them again later.

### Before enabling `alignment_labels` (prominent, blocking warning)

> **This may reveal religious, ideological, or worldview associations.**
>
> Your top belief alignments will be visible to anyone who views your public profile — including people you don't know. Share only if you are comfortable making this public.
>
> [I understand — show alignment labels] [Cancel]

The acknowledgment must be a separate click — not just unchecking a box. The label "I understand" must not be the default-selected button.

### Inline note for `pattern_summary`

> This shows your self-reported belief pattern label. It is derived from your questionnaire answers, not a verified identity or religious affiliation.

### Inline note for `scores`

> Scores are reflection signals, not intelligence, morality, or truth rankings.

### Inline note for `reflection_habits` (shown as read-only, always private)

> Reflection habits describe how you use HumanX. They are for private self-study only and cannot be made public.

### On the public profile card (static, always shown)

> Belief patterns describe how someone interacts with claims. They are not a score of intelligence, morality, or truth. Belief identity details are private by default.

---

## H. Backend Migration Recommendation (D-209E)

### Migration

Add one nullable TEXT column to `belief_snapshots`:

```sql
ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT;
```

**Properties:**
- No `DEFAULT` clause — existing rows get `NULL`, which the response-shaping layer treats as all-groups-false.
- No data rewrite — all existing snapshots remain private until the owner explicitly sets toggles.
- No destructive change — no column removed, no data altered.
- Reversible — the column can be ignored by reverting the response-shaping code; the data stays in place.
- One statement — SQLite-safe, no `IF NOT EXISTS` needed for `ADD COLUMN`.

**Migration file:** `migrations/0007_belief_visibility_json.sql` (or next available number — verify before creating).

### Response-shaping enforcement

`getPublicProfile` must parse `visibility_json` safely:

```js
function parseVisibility(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}
```

Then gate each response field against the parsed object. Fields not gated by a `true` consent value must be omitted from the response object entirely — not returned as `null` or `0`.

---

## I. Backend Implementation Recommendation (D-209F)

### Changes to `getPublicProfile`

1. Add `visibility_json` to the SELECT (one column addition).
2. Parse `visibility_json` with the safe parser above.
3. Build the `sharedSnapshot` response object field-by-field against the consent gates.
4. Remove scores from the response when `scores` is not consented — they currently travel over the wire even though they are not rendered.
5. Add `patternLabel` field (renamed from `dominantPattern`) when `pattern_summary` is true.
6. Add `alignmentLabels` array (sanitized names only, max 3) when `alignment_labels` is true.

### Test coverage required

For each consent group:
- When group is `false` (or absent): field is absent from response
- When group is `true`: field is present and correctly shaped
- Malformed `visibility_json`: treated as all-false
- NULL `visibility_json`: treated as all-false
- `reflection_habits: true` in DB: field still absent from response (not exposed in this arc)
- `drift_history: true` in DB: field still absent from response

### Existing private endpoints

`/api/my-humanx` and `/api/belief-snapshots` are unchanged. They continue to return all snapshot fields to the authenticated owner regardless of `visibility_json`.

---

## J. Frontend Implementation Recommendation (D-209G)

### New UI components required

1. **`meBeliefVisibilityTogglesHtml(snapshot, visibilityJson)`** — renders the field-group toggle panel. Accepts the current snapshot and parsed `visibility_json`. Returns the toggle checklist HTML.

2. **`meBeliefVisibilityPreviewHtml(snapshot, visibilityJson)`** — renders the preview card for the current consent state. Must produce output structurally identical to `renderPublicProfileSnapshotHtml` (same classes, same guardrail copy, same field order).

3. **`meAlignmentLabelWarningModal()`** — renders the blocking acknowledgment modal for `alignment_labels`. Must be dismissed explicitly before the toggle can be set.

4. **`saveBeliefVisibilityUI(snapshotId, visibilityJson)`** — async function that POSTs the updated `visibility_json` to the profile-settings endpoint and re-renders the preview.

### Integration point

Insert the toggle panel and preview between the snapshot selection list and the "Save" button in `meProfileSettingsHtml`. The panel is only shown when a snapshot is selected for sharing.

### Owner-facing rule

The preview card rendered by `meBeliefVisibilityPreviewHtml` must be kept in sync with `renderPublicProfileSnapshotHtml`. Any change to the public card must be reflected in the preview function within the same commit.

---

## K. What NOT to Implement Yet

The following must not be implemented at any point in the D-209 arc or as a consequence of this spec:

| Feature | Why not |
|---------|---------|
| Public belief avatar or identity card | No per-field consent model for visual identity; high misread risk |
| Ideology badge or religion badge | `alignment_labels` is the highest-risk group — requires the strongest warning and a separate acknowledgment step; badges imply permanence |
| Religion card shown by default | Default for all sensitive groups is `false` |
| "Share all belief data" button | Violates the field-by-field consent principle |
| Public ranking of beliefs | Ranks create competitive identity framing — not supported by any field group |
| Truth level, purity score, intelligence proxy | Banned framing — contradicts the "not a score of intelligence, morality, or truth" guardrail |
| Automated public exposure from snapshot sharing alone | `public_summary_enabled=1` is snapshot selection only, not field consent |
| Public exposure of `reflection_habits` or `drift_history` | These groups are excluded from this arc regardless of `visibility_json` state |
| Public `dimensions_json` exposure | TRIB/FUSE/PAIN/RIGD scores are too sensitive for any public surface |

---

## Risk Register

| Group | Risk level | Notes |
|-------|-----------|-------|
| `basic_snapshot` | Low | Already public; owner-written label |
| `pattern_summary` | **High** | Named archetype labels; religion/ideology risk |
| `alignment_labels` | **Very high** | Named belief systems with similarity scores; highest-risk field in the system |
| `scores` | Medium | Inference risk; mitigated by framing copy |
| `reflection_habits` | Medium | Private investigation patterns; excluded from this arc |
| `drift_history` | Medium | Longitudinal identity signal; excluded from this arc |

---

## Implementation Sequence

| Task | Scope | Dependency |
|------|-------|-----------|
| D-209E | Migration: add `visibility_json` | None — safe standalone ALTER TABLE |
| D-209F | Backend: `getPublicProfile` consent gating | D-209E (needs column) |
| D-209G | Frontend: toggle UI + preview + save | D-209F (needs API support) |
| D-209H | Smoke tests: per-group API tests + UI tests | D-209G |
| D-209I | Closeout doc | D-209H |

**D-209E and D-209F may be done in a single commit** if the migration is applied before the backend change is tested. D-209G must not be built until D-209F is live — the toggle UI must not save `visibility_json` values that the backend ignores.

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D209A_BELIEF_CONSENT_MODEL_AUDIT.md` | Full consent model audit |
| `docs/D209_BELIEF_CONSENT_CLOSEOUT.md` | D-209A/B/C arc closeout |
| `docs/D209D_BELIEF_PER_FIELD_CONSENT_SPEC.md` | This document — per-field spec |
