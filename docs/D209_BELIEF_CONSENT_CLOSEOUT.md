# D-209 — Shared Belief Snapshot Consent Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `06b65ef`
**Baseline:** 1805/24/57
**Status:** COMPLETE — D-209A audit + D-209B preview alignment shipped, deploy confirmed, sanity passed

---

## D-209A Audit Summary

The D-209A audit mapped the full belief data surface and defined a four-class privacy taxonomy:

| Class | Fields | Status |
|-------|--------|--------|
| 1 — Safe public basics | `label`, `createdAt`, `contradictionCount` | Currently public — low risk |
| 2 — Sensitive belief identity | `dominant_pattern`, `top_beliefs_json`, `topAlignmentName` | Excluded from public API (D-208B) |
| 3 — Sensitive inference | `stability_score`, `openness_score`, `pressure_score`, `dimensions_json` | In API response but not rendered (medium risk) |
| 4 — Private-only reflection | My HumanX reflection cards, `raw_json`, `contradictions_json`, `stress_points_json` | Never in public path |

**Critical live gap identified:** `meSharedSnapshotCardHtml` (owner-side preview in Profile Settings) was rendering `dominantPattern`, `topAlignmentName`, and score meters from the private `/api/my-humanx` snapshot rows. The actual public card (`renderPublicProfileSnapshotHtml`) no longer rendered those fields after D-208B. The owner preview showed more than the public actually saw — breaking informed consent in the safe direction, but creating real confusion about what was being shared.

**Recommended backend consent model:** Option 1 — `visibility_json` TEXT column on `belief_snapshots`, parsed at response-shaping layer. Absent = all-private default. Not implemented yet — waiting for per-field toggle UI (D-209D).

---

## D-209B Implementation Summary

Commit `06b65ef`. Two files changed.

### Problem fixed

An owner who marked a snapshot `public_summary_enabled=1` saw a preview card in Profile Settings showing:
- `dominant_pattern` / "Self-reported dominant pattern" heading
- Score meters (Stability, Openness, Pressure)
- `topAlignmentName` ("Top alignment: [named belief system]")

None of those fields were actually visible on the live public profile after D-208B. The preview was misleading.

### Changes made

**`meSharedSnapshotSummary()` — field scope reduced to Class-1 only:**

Before D-209B, this function extracted from the owner's private `meData.belief_snapshots`:
```
{ label, dominantPattern, stabilityScore, opennessScore, pressureScore, topAlignmentName, contradictionCount }
```
After D-209B, it returns only:
```
{ label, contradictionCount, createdAt }
```
`dominant_pattern`, `top_beliefs_json` (parsed for `topAlignmentName`), and all three score fields are no longer extracted. The summary object cannot carry data that the public card does not expose.

**`meSharedSnapshotCardHtml(s)` — card mirrors public card exactly:**

Before D-209B: rendered `s.dominantPattern`, score meters, `s.topAlignmentName`, two generic disclaimers.

After D-209B: renders only:
- `<h3>Shared Belief Snapshot</h3>`
- Two guardrail paragraphs matching `renderPublicProfileSnapshotHtml` word-for-word
- Owner-written `s.label` (if present)
- `s.contradictionCount` tension count
- `s.createdAt` formatted date
- No pattern label, no score meters, no alignment name

The card is now structurally identical to the public visitor's view.

**`meSharedSnapshotPreviewBlockHtml()` — explicit scope disclosure added:**

Intro text now reads:
> *"Belief snapshot sharing is optional and separate from your public profile toggle. Shared snapshots show only your chosen label, tension count, and date. Belief alignment details, pattern labels, and reflection cards stay private unless a future per-field consent model is added."*

A `"this is exactly what others will see:"` label precedes the preview card when a snapshot is selected.

### Smoke tests

20 new D-209B tests. 7 stale D-142B/C tests updated to reflect the new privacy-first field set. Baseline 1785 → 1805/0.

Tests cover:
- `meSharedSnapshotCardHtml` does not render `dominantPattern`, `topAlignmentName`, score meters, or "Self-reported dominant pattern" label
- Card renders tension count and formatted date
- Card includes both guardrail paragraphs including "not a score of intelligence, morality, or truth" and "Belief identity details are private by default"
- `meSharedSnapshotSummary` does not extract `dominant_pattern`, `top_beliefs_json`, or score fields
- Sharing helper includes "Shared snapshots show only your chosen label, tension count, and date"
- Sharing helper includes "Belief alignment details, pattern labels, and reflection cards stay private"
- Preview block includes "this is exactly what others will see"
- `getPublicProfile` still does not select `top_beliefs_json` or `dominant_pattern`
- `renderPublicProfileSnapshotHtml` still does not render `dominantPattern` or `topAlignmentName`
- `renderPublicProfileHtml` still does not include `meBeliefReflectionHtml`
- No new migration file added

---

## New Owner Preview Rule

> **The owner-facing shared snapshot preview must mirror the actual public card exactly.**
>
> `meSharedSnapshotCardHtml` and `renderPublicProfileSnapshotHtml` must render the same fields, the same guardrail copy, and the same structure. Any future change to either function must be applied to both.

This rule is enforced by the D-209B smoke tests. Any drift between the two functions will cause test failures.

---

## What the Public Shared Snapshot Currently Exposes

After D-208B + D-209B, the public profile shared snapshot card shows:

| Element | Shown | Source |
|---------|-------|--------|
| "Shared Belief Snapshot" heading | ✓ | Static |
| Guardrail: "not a diagnosis or personality test" | ✓ | Static |
| Guardrail: "not a score of intelligence, morality, or truth" | ✓ | Static |
| Guardrail: "Belief identity details are private by default" | ✓ | Static |
| Owner-written label | ✓ if present | `s.label` |
| Tension/contradiction count | ✓ | `s.contradictionCount` |
| Snapshot date | ✓ if present | `s.createdAt` |

### Confirmed NOT exposed

| Field | Confirmation |
|-------|-------------|
| `dominant_pattern` | Excluded from `getPublicProfile` SELECT (D-208B); not in summary object (D-209B); not rendered in card (D-208B + D-209B) |
| `top_beliefs_json` | Excluded from `getPublicProfile` SELECT (D-208B); not parsed in summary (D-209B) |
| `topAlignmentName` | Not extracted server-side (D-208B); not extracted client-side (D-209B); not rendered |
| Belief alignment labels | None — no named religion, ideology, or worldview on any public surface |
| Score meters (stability/openness/pressure) | In API response but not rendered on public card; not in summary object (D-209B) |
| `dimensions_json` | Never selected in `getPublicProfile` |
| `raw_json` | Never selected in `getPublicProfile` |
| `contradictions_json` | Never selected in `getPublicProfile` |
| `stress_points_json` | Never selected in `getPublicProfile` |
| Private reflection cards | `meBeliefReflectionHtml` not called from `renderPublicProfileHtml` |

---

## Confirmed: No Stored Data Deleted

No migration was added. No `ALTER TABLE`, `DROP COLUMN`, or `UPDATE` was run. The `belief_snapshots` table retains all columns. All snapshot data remains available to the owner via `/api/my-humanx` and `/api/belief-snapshots`.

The restrictions are purely at the API read layer (`getPublicProfile`) and the frontend render layer.

---

## Confirmed: No Public Fields Reintroduced

D-209B is a reduction, not an expansion. The set of fields on the public card is unchanged from D-208B. No new field was added to `getPublicProfile`, `sharedSnapshot`, or `renderPublicProfileSnapshotHtml`.

---

## Confirmed: No Migration Needed

D-209A identified Option 1 (`visibility_json` column) as the recommended migration path for a future per-field consent model. That migration has not been implemented — and should not be until the per-field toggle UI is designed and the consent spec is confirmed (D-209D).

---

## Live Deploy Sanity

Deployed from `HEAD = 06b65ef` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. My HumanX → Profile Settings → shared snapshot preview area shows "this is exactly what others will see"
2. Owner preview shows only: label, tension count, date, guardrail copy
3. Owner preview does not show: dominant pattern, top alignment, score meters, alignment labels
4. Public profile card matches owner preview exactly — same fields, same guardrail copy
5. Public profile does not expose `top_beliefs_json`, `dominant_pattern`, or `topAlignmentName`
6. No console errors
7. No layout regressions

---

## Do-Not-Regress Rules

1. `meSharedSnapshotCardHtml` and `renderPublicProfileSnapshotHtml` must always render the same field set and guardrail copy. Any divergence must be caught and corrected before deploy.
2. `meSharedSnapshotSummary` must return only Class-1 fields: `label`, `contradictionCount`, `createdAt`. Score fields and identity fields must not be added back without a dedicated per-field consent UI.
3. `getPublicProfile` must never return `dominant_pattern`, `top_beliefs_json`, or `topAlignmentName` in any shared snapshot response — these require explicit per-field opt-in.
4. The sharing helper text must state explicitly what is and is not shared. The D-209B smoke tests guard the required phrases.
5. Private reflection cards (`meBeliefReflectionHtml`) must remain absent from `renderPublicProfileHtml`.
6. No bulk "share all belief data" button or shortcut may be added. Each field group requires its own per-field toggle.

---

## Future Roadmap

| Task | Scope | Status |
|------|-------|--------|
| D-209A — Consent model audit | Docs | ✓ Complete — commit `8445239` |
| D-209B — Owner preview alignment | Code | ✓ Complete — commit `06b65ef` |
| **D-209C — Consent arc closeout** | **Docs** | **This document** |
| D-209D — Per-field consent spec | Docs/design | Next — specify toggle UI and whitelist rules before any migration |
| D-209E — `visibility_json` migration + toggle UI | Code + migration | After D-209D spec confirmed |
| D-209F — Public belief field opt-in (scores first) | Code | After D-209E live |
| D-209G — Public belief consent closeout | Docs | After D-209F |

**No new public belief fields should be added until D-209D is written and D-209E is live.**

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D209A_BELIEF_CONSENT_MODEL_AUDIT.md` | Full consent model audit: privacy classes, backend options, dangerous mistakes, recommended D-209B scope |
| `docs/D209_BELIEF_CONSENT_CLOSEOUT.md` | This document — D-209A/B/C arc closeout |
| `public/app-v10.js` | `meSharedSnapshotSummary`: Class-1 fields only; `meSharedSnapshotCardHtml`: mirrors public card; `meSharedSnapshotPreviewBlockHtml`: explicit scope disclosure |
| `scripts/hardening-smoke-test.mjs` | 20 new D-209B tests; 7 stale D-142B/C tests updated; baseline 1805/0 |
