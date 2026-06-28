# D-209E — visibility_json Migration + Backend Scaffold Closeout

**Date:** 2026-06-28
**Final HEAD:** `270bbd7`
**Baseline:** 1839/24/57
**Status:** COMPLETE — migration applied, Worker deployed, live sanity passed

---

## Arc Summary: D-209D through D-209E2

| Task | Commit | Summary |
|------|--------|---------|
| D-209D | `72b7d25` | Per-field consent spec: six field groups, visibility_json shape, warning copy, implementation sequence |
| D-209E | `da4bc0f` | Migration 0016 + `parseBeliefVisibility` / `beliefVisibilityAllows` scaffold in worker.js |
| D-209E1 | `270bbd7` | Score fields (stabilityScore/opennessScore/pressureScore) removed from public sharedSnapshot response and SELECT |
| D-209E2 | This document | Migration applied, Worker deployed, live sanity passed |

---

## D-209D Per-Field Consent Spec Summary

The D-209D spec defined six field groups for per-field belief visibility:

| Group | Default | Risk class | Notes |
|-------|---------|-----------|-------|
| `basic_snapshot` | true | Class 1 — safe | label, contradictionCount, createdAt |
| `pattern_summary` | false | Class 2 — sensitive identity | dominant_pattern → `patternLabel` |
| `alignment_labels` | false | Class 2 — very high risk | top_beliefs_json sanitized names only; requires explicit acknowledgment |
| `scores` | false | Class 3 — sensitive inference | stability/openness/pressure scores |
| `reflection_habits` | false | Class 4 — private-only | excluded from public in this arc regardless of consent |
| `drift_history` | false | Class 3 — timeline inference | excluded from public in this arc regardless of consent |

The consent principle: **Belief sharing is field-by-field, default-private, previewed before publish, and reversible.**

---

## D-209E Migration + Scaffold Summary

### Migration applied

**File:** `migrations/0016_belief_visibility_json.sql`
**Statement:** `ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT;`

Properties:
- Additive only — no DROP, no UPDATE, no NOT NULL, no CHECK constraint
- No default value — existing rows received `NULL`
- `NULL` means all sensitive field groups are private (safe default)
- Applied to production D1 database `humanx` via `npx wrangler d1 migrations apply humanx --remote`

**Validation confirmed:**
- `PRAGMA table_info(belief_snapshots)` shows `visibility_json TEXT` column present
- All existing rows have `visibility_json = null`
- No data was rewritten or deleted

### Backend scaffold

Two new functions added to `src/worker.js` before `getPublicProfile`:

**`parseBeliefVisibility(raw)`**
- `null` / empty / invalid JSON → returns safe default object (all sensitive groups false, `basic_snapshot: true`)
- Unknown keys in valid JSON → ignored (spread into safe default)
- Array or non-object JSON → safe default
- Catches all JSON parse errors

**`beliefVisibilityAllows(visibility, group)`**
- Returns `true` only when `visibility[group] === true`
- Returns `false` for any unknown group
- Treats `basic_snapshot` as true when visibility is null/undefined

`getPublicProfile` now:
- Includes `visibility_json` in the belief snapshot SELECT
- Calls `parseBeliefVisibility(sharedSnapshotRow.visibility_json)`
- Holds result as `_visibility` via `void _visibility` — D-209F will use it to gate field groups without touching the SELECT again

---

## D-209E1 Score Field Removal Summary

`stabilityScore`, `opennessScore`, and `pressureScore` were removed from:
- The `getPublicProfile` belief snapshot SELECT
- The `sharedSnapshot` response object

Scores are Class-3 sensitive inference (D-209D spec §C Group 4) and require explicit per-field consent before public exposure. They were traveling over the wire even though the public card did not render them — D-209E1 closes that gap.

**Private endpoints unchanged.** `/api/my-humanx` still selects all columns including `stability_score`, `openness_score`, `pressure_score`, `dominant_pattern`, `top_beliefs_json`. The owner's private view is unaffected.

---

## Migration Applied

| Item | Value |
|------|-------|
| Migration file | `migrations/0016_belief_visibility_json.sql` |
| Column added | `visibility_json TEXT` on `belief_snapshots` |
| Existing rows | `null` — all-private default |
| Apply command | `npx wrangler d1 migrations apply humanx --remote` |
| Validated | `PRAGMA table_info(belief_snapshots)` confirmed column present |

---

## Deployment Recorded

| Item | Value |
|------|-------|
| Deployed version ID | `1f1be492-efd0-4a1c-a778-1285c5e5b8f9` |
| Deploy command | `npx wrangler deploy` |
| Deployed HEAD | `270bbd7` |
| Deploy sequence | Migration applied first, then Worker deployed |

---

## Current Public Behavior

The public profile shared snapshot card (`/api/u/:slug` → `sharedSnapshot` → `renderPublicProfileSnapshotHtml`) shows:

| Element | Shown |
|---------|-------|
| "Shared Belief Snapshot" heading | ✓ Static |
| Guardrail: "not a diagnosis or personality test" | ✓ Static |
| Guardrail: "not a score of intelligence, morality, or truth" | ✓ Static |
| Guardrail: "Belief identity details are private by default" | ✓ Static |
| Owner-written label | ✓ `sharedSnapshot.label` |
| Tension/contradiction count | ✓ `sharedSnapshot.contradictionCount` |
| Snapshot date | ✓ `sharedSnapshot.createdAt` |

### Confirmed NOT public

| Field | Status |
|-------|--------|
| `stabilityScore` | Removed from SELECT and response (D-209E1) |
| `opennessScore` | Removed from SELECT and response (D-209E1) |
| `pressureScore` | Removed from SELECT and response (D-209E1) |
| `dominant_pattern` | Excluded from SELECT (D-208B); not in response |
| `top_beliefs_json` | Excluded from SELECT (D-208B); not parsed for public |
| `topAlignmentName` | Not extracted; not in response |
| Named religion/ideology/worldview labels | None on any public surface |
| Private reflection cards | `meBeliefReflectionHtml` not in `renderPublicProfileHtml` |
| `dimensions_json` | Never selected in public path |
| `raw_json` | Never selected in public path |
| `contradictions_json` | Never selected in public path |
| `stress_points_json` | Never selected in public path |

---

## `visibility_json` — Scaffold Only

The `visibility_json` column exists in the database. The `parseBeliefVisibility` function is live. However:

- No UI toggles exist yet (D-209G)
- All existing rows have `visibility_json = null` → all sensitive groups false
- `getPublicProfile` parses `visibility_json` but holds the result without using it (`void _visibility`)
- No new fields are exposed as a result of the column's presence
- The public `sharedSnapshot` response is identical to pre-D-209E behavior except scores are now also removed

**Public behavior is unchanged from the user's perspective.** The scaffold is in place for D-209F to wire consent gating without touching the SELECT or helper functions.

---

## Live Deploy Sanity

Deployed from `HEAD = 270bbd7` — version ID `1f1be492-efd0-4a1c-a778-1285c5e5b8f9`.

**Result: PASS**

Confirmed:
1. Public profile with shared snapshot — card shows only: label, tension count, date, guardrail copy
2. No dominant pattern visible on public card
3. No top alignment / religion / ideology label visible on public card
4. No score meters (stability/openness/pressure) visible on public card
5. No private reflection cards visible on public profile
6. My HumanX — private belief snapshots load normally with full owner data
7. My HumanX — Belief Reflection cards (source habits, evidence strength habits, investigation activity) load normally
8. Shared snapshot owner preview in Profile Settings still shows exact public card (label + tension count + date + guardrail)
9. No console errors
10. No layout regressions

---

## Do-Not-Regress Rules

1. `getPublicProfile` SELECT for belief snapshots must never include `dominant_pattern`, `top_beliefs_json`, `stability_score`, `openness_score`, or `pressure_score` unless the corresponding consent group is gated.
2. The `sharedSnapshot` response object must contain only `label`, `contradictionCount`, `createdAt` until D-209G UI ships and a user explicitly enables additional groups.
3. `parseBeliefVisibility` must always return the safe default (all sensitive groups false) for null, empty, or invalid JSON.
4. `reflection_habits` and `drift_history` groups must remain non-public regardless of `visibility_json` value until a separate audit approves them.
5. `top_beliefs_json` must never be returned raw in any public API response under any consent state.
6. `visibility_json` value must not be echoed back in the public profile API response.

---

## Future Roadmap

| Task | Scope | Notes |
|------|-------|-------|
| D-209F | Backend consent gate tests | Wire `_visibility` to actually gate field groups; add test coverage for each group state |
| D-209G | Owner UI toggle panel | Per-group toggles, live preview, acknowledgment modal for `alignment_labels`, save/revoke |
| D-209H | Smoke tests + closeout | End-to-end consent flow verified |
| D-209I | Full consent arc closeout | Docs |

**No public belief field expansion before D-209F consent gating is wired and D-209G UI is live.**

---

## File Index

| File | Purpose |
|------|---------|
| `migrations/0016_belief_visibility_json.sql` | Adds `visibility_json TEXT` to `belief_snapshots` — applied |
| `src/worker.js` | `parseBeliefVisibility`, `beliefVisibilityAllows` helpers; `getPublicProfile` SELECT updated; scores removed from public response |
| `docs/D209D_BELIEF_PER_FIELD_CONSENT_SPEC.md` | Full per-field consent spec |
| `docs/D209E_VISIBILITY_JSON_MIGRATION_PREFLIGHT.md` | Owner migration apply commands and validation steps |
| `docs/D209E_VISIBILITY_JSON_CLOSEOUT.md` | This document |
| `scripts/hardening-smoke-test.mjs` | 22 D-209E + 12 D-209E1 tests; 1 stale D-142B test updated; baseline 1839/0 |
