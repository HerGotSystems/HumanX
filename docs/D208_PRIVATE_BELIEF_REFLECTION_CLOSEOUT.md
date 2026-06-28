# D-208E — Private Belief Reflection Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `845b309`
**Baseline:** 1785/24/57
**Status:** COMPLETE — D-208D shipped, deploy confirmed, sanity passed

---

## D-208D Audit Finding

Before implementing, the My HumanX private API endpoint (`/api/my-humanx`) was audited to determine whether `source_type` and `evidence_strength` were already available in the evidence rows returned to the owner.

**Finding:** `/api/my-humanx` issues `SELECT * FROM evidence WHERE user_id=?` (worker.js line 424). This returns all columns including `source_type` and `evidence_strength` — no backend change, schema change, or migration was needed.

`home_tests` is also returned from `SELECT * FROM home_tests WHERE user_id=?` (line 430), providing test difficulty and count.

All data required for the three reflection cards was already present in the existing private API response.

---

## Implementation Summary

Commit `845b309`. Three files changed.

### 1. Frontend (`public/app-v10.js`)

Four new functions added between `meMirrorQuestionsCardHtml` and `meMirrorHtml`:

**`meReflectionMiniBar(label, count, total)`**
Renders a single horizontal bar row: label · proportional bar fill · count. Bar width is `count/total * 100%` clamped to integer percent. Used by all three reflection cards.

**`meReflectionSourceCardHtml(evidence)`**
Source habits card. Iterates `data.evidence`, buckets by `source_type` (falling back to `sourceType`). Renders bars in a fixed display order matching `sourceTypeLabel()`. Empty-guards on no evidence or no non-zero buckets.

**`meReflectionStrengthCardHtml(evidence)`**
Evidence strength habits card. Iterates `data.evidence`, buckets by `evidence_strength` (falling back to `evidenceStrength`). Renders bars in order: strong → moderate → weak → disputed → unknown. Uses `evidenceStrengthLabel()` for display text. Empty-guards on no evidence.

**`meReflectionActivityCardHtml(evidence, pressure, tests)`**
Investigation activity card. Counts evidence items, pressure items, and home tests; renders three bars as proportions of total activity. Empty-guards when all three are zero.

**`meBeliefReflectionHtml(data)`**
Parent panel function. Renders a `<div class="panel">` with heading `<h3>Belief reflection</h3>`, two guardrail paragraphs, and a `<div class="me-mirror-grid">` containing the three cards. Returns empty string if all three cards are empty (no data). Called from `renderMeHtml(data)` immediately after `meMirrorHtml(data)`.

### 2. CSS (`public/styles.css`)

Eight new rules added after the existing `.me-mirror-*` block:

| Class | Purpose |
|-------|---------|
| `.me-refl-card` | Column flex container for a reflection card |
| `.me-refl-row` | Single bar row: flex row, 18px min-height |
| `.me-refl-label` | Fixed 130px label, muted color, text-overflow ellipsis |
| `.me-refl-bar-wrap` | Full-width track, 6px height, line-color background |
| `.me-refl-bar` | Filled portion, accent color, width set inline as % |
| `.me-refl-count` | Right-aligned count, 20px fixed width, muted |
| `.me-refl-note` | Italic per-card note above bars |
| `.me-refl-private` | Italic private guardrail below bars, muted |

### 3. Smoke tests (`scripts/hardening-smoke-test.mjs`)

19 new D-208D tests added. Baseline 1766 → 1785/0.

Tests cover:
- All four function definitions exist
- `Belief reflection` heading exists
- Per-card `Private reflection only — not a public identity label.` present
- Panel guardrail "Private self-study based on how you interact" present
- Panel guardrail "not a personality label or truth ranking" present
- Panel guardrail "not a score of intelligence, morality, or truth" present
- `meBeliefReflectionHtml(data)` injected into `renderMeHtml`
- Source card uses `sourceTypeLabel`
- Strength card uses `evidenceStrengthLabel`
- No `dominantPattern`, `dominant_pattern`, or `topAlignment` inside reflection functions
- `.me-refl-row`, `.me-refl-bar`, `.me-refl-private` CSS present
- `renderPublicProfileHtml` does not include `meBeliefReflectionHtml`
- `data.home_tests` used as data source
- No new migration file added

---

## Where It Appears

| Surface | Reflection cards visible |
|---------|------------------------|
| My HumanX → private owner view | ✓ Yes — below Belief Mirror section |
| Public profile (`/u/:slug`) | ✗ No — `renderPublicProfileHtml` does not call `meBeliefReflectionHtml` |
| Study view | ✗ No |
| Arena | ✗ No |
| Drift view | ✗ No |
| Review queue | ✗ No |

Injection point in `renderMeHtml`: `${meMirrorHtml(data)}${meBeliefReflectionHtml(data)}<div class="panel"><h3>Recent Truths</h3>...`

---

## What It Uses

| Data field | Source | Used for |
|-----------|--------|---------|
| `data.evidence` | `/api/my-humanx` `SELECT *` | All three cards |
| `source_type` / `sourceType` | evidence row field | Source habits card buckets |
| `evidence_strength` / `evidenceStrength` | evidence row field | Evidence strength habits card buckets |
| `data.home_tests` | `/api/my-humanx` `SELECT *` | Activity card test count |
| `data.pressure` | `/api/my-humanx` `SELECT *` | Activity card pressure count |

---

## What It Does NOT Use

- Public profile data — reflection functions receive `data` from `renderMeHtml`, which is never called by the public profile render path
- Named religion or ideology alignments — no alignment label, archetype, or worldview name is read or rendered
- `top_beliefs_json` — not accessed in any reflection function
- `dominant_pattern` — not accessed in any reflection function
- `topAlignmentName` — not accessed in any reflection function
- AI verdicts — no AIP packet, no analysis score, no survivability/testability meter
- Composite scoring — no claim is ranked, no user is scored, no "better/worse believer" metric is computed
- Rankings — cards show distributions, not ranked lists or leaderboards
- `dimensions_json` — not read (remains private per D-208A)

---

## Confirmed: Privacy

**Public profile does not expose reflection cards.** `renderPublicProfileHtml` builds the public profile HTML independently and never calls `meBeliefReflectionHtml`. The D-208D smoke test `D-208D: public profile render does not include meBeliefReflectionHtml` guards this regression surface.

**Public belief labels remain private by default.** The D-208B restrictions on `dominant_pattern`, `top_beliefs_json`, and `topAlignmentName` are unchanged. The D-208B smoke tests continue to pass in the 1785/0 baseline.

---

## Confirmed: Guardrails

Per-card (bottom of each card):
> `Private reflection only — not a public identity label.`

Panel level (two paragraphs at the top of the Belief reflection panel):
> `Private self-study based on how you interact with HumanX claims. Not a personality label or truth ranking.`
> `Belief patterns describe how you interact with claims. They are not a score of intelligence, morality, or truth.`

### Banned framing — confirmed absent

| Phrase | Present in reflection cards |
|--------|---------------------------|
| truth level | ✗ No |
| purity | ✗ No |
| ideology score | ✗ No |
| intelligence score | ✗ No |
| good believer | ✗ No |
| bad believer | ✗ No |

---

## Confirmed: No Backend or Migration Required

No changes were made to:
- `src/worker.js` — existing `SELECT *` already returns `source_type` and `evidence_strength`
- Any D1 migration file — schema is unchanged
- `wrangler.toml` — unchanged
- Any API route — no new endpoints

The implementation is entirely at the frontend render layer.

---

## Live Deploy Sanity

Deployed from `HEAD = 845b309` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. My HumanX / Mirror — "Belief reflection" section visible below Belief Mirror
2. Source habits card present with mini-bar rows
3. Evidence strength habits card present with mini-bar rows
4. Investigation activity card present with mini-bar rows
5. Guardrail "not a score of intelligence, morality, or truth" visible in panel header
6. "Private reflection only — not a public identity label." visible on each card
7. No banned phrases (truth level / purity / ideology score / intelligence score / good believer / bad believer)
8. Public profile loads normally — no reflection cards visible
9. Public profile belief labels remain private — no dominant_pattern, topAlignmentName, or named ideology label exposed
10. No console errors

---

## Confirmed: No Backend Migration Needed

The D-208D smoke test `D-208D: no new migration file added` passes. No migration file `0006_*` was created. The five existing migrations (0001–0005) remain the complete set.

---

## Roadmap Note

**Per-field public/private consent model should be audited before any public belief sharing expands.**

Currently the public belief snapshot exposes: `label` (owner-written), `stabilityScore`, `opennessScore`, `pressureScore`, `contradictionCount`, `createdAt`. Future expansion of this field set — or any new public belief surface — requires a dedicated per-field consent audit equivalent to the D-208A/B review. Source habits and evidence strength habit data are private-only and must not be added to any public API response without that review.

---

## Do-Not-Regress Rules for This Component

1. `meBeliefReflectionHtml` must never be called from `renderPublicProfileHtml` or any public-facing render path.
2. Reflection cards must never read or render `dominant_pattern`, `top_beliefs_json`, `topAlignmentName`, or `dimensions_json`.
3. The panel must retain both guardrail paragraphs: the self-study framing and the intelligence/morality/truth disclaimer.
4. Each card must retain its per-card "Private reflection only — not a public identity label." note.
5. Any new reflection card must pass the D-203A three-test gate adapted for belief data: (1) could a user read this as a truth ranking? (2) does it label ideological or religious identity? (3) does it create a "good/bad believer" impression?

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D208A_BELIEF_ENGINE_INTEGRATION_AUDIT.md` | Full audit: current state, integration map, risks, safe/unsafe dimensions, roadmap |
| `docs/D208_BELIEF_ENGINE_PRIVACY_CLOSEOUT.md` | D-208B/C: public profile belief label privacy patch |
| `docs/D208_PRIVATE_BELIEF_REFLECTION_CLOSEOUT.md` | This document — D-208D/E private reflection cards |
| `public/app-v10.js` | `meReflectionMiniBar`, `meReflectionSourceCardHtml`, `meReflectionStrengthCardHtml`, `meReflectionActivityCardHtml`, `meBeliefReflectionHtml` — all new |
| `public/styles.css` | `.me-refl-*` CSS rules |
| `scripts/hardening-smoke-test.mjs` | 19 new D-208D tests; baseline 1785/0 |
