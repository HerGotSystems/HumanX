# D-201 — Source Taxonomy Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `5756f82`
**Baseline:** 1628/24/57
**Status:** COMPLETE — migration applied, backend adopted, frontend live, sanity passed

---

## What This Arc Was

The D-201 arc added a two-field source taxonomy to the evidence table so that claims citing scripture, myth, or fiction can be distinguished from claims citing peer-reviewed studies or eyewitness accounts. The existing `quality` field was left untouched. Two additive columns — `source_type` and `evidence_strength` — were added alongside it.

The core design principle: **source origin is not proof.** A scripture citation records where a belief comes from; it does not verify that the factual claim is correct. This distinction is now enforced in the data model and surfaced in the UI.

---

## Arc Summary

### D-201A — Belief Engine Expansion Audit and Roadmap

Audit of the Belief Engine and evidence model depth. Identified that `quality` conflates source category (what kind of source) with epistemic weight (how much it proves). Proposed an 8-module expansion roadmap with source-type taxonomy as the first priority. Set the framing rule that scripture and tradition sources must be distinguished from empirical ones, not ranked below them — the distinction is categorical, not evaluative.

Baseline at creation: 1589/24/57.

### D-201B — Evidence/Source Taxonomy Audit

Deep audit of the `quality` field across all 14 code touch points. Documented the conflation problem: a Bible citation and a peer-reviewed study both passed through `evidenceQualityClass()` with identical display treatment. Proposed `source_type` (11 values, origin/category) and `evidence_strength` (5 values, self-assessed weight) as additive columns with `quality` kept forever as legacy fallback.

Key constraint established: **do not infer `evidence_strength` from `quality` and write it to the DB**. The `evidenceQualityClass()` inference (`repeatable → strong`, `vibes → weak`) encodes an unstated assumption. Inference is for display only, never storage.

Baseline at creation: 1589/24/57.

### D-201C — Migration File + Preflight

Created `migrations/0015_evidence_source_taxonomy.sql` — two additive `ALTER TABLE` statements only, no data rewrite, no `NOT NULL`, no `CHECK` constraints. Enum validation is enforced in server code, not the DB.

Created `docs/D201C_SOURCE_TAXONOMY_MIGRATION_PREFLIGHT.md` with exact preflight, apply, and validate commands. Documented column guard risk: `getClaim()` and `claimDetail()` use raw `.all()` — querying a missing column returns 500 and breaks Study for all users.

Added 10 smoke tests for migration file integrity. Baseline: 1599/24/57.

**Migration number note:** spec said `0013`; `0013_public_profile_foundation.sql` already existed. Created as `0015` following `0014_owner_token_telemetry.sql`.

### D-201D — API Adoption Spec

Full spec document covering: canonical enums, request/response shapes, server validation plan, all 8 read-query touch points, RunPack `output_contract` note, Review UI plan, backward-compat table, 3-phase implementation sequence, and the Option A/Option B column guard pattern.

Option A (apply migration first, then deploy code) selected as the safe path. Option B (guard pattern via `safeAll()`) documented as fallback only.

Baseline at creation: 1599/24/57.

### D-201E0 — Production D1 Migration Apply Guide

Docs-only patch. Updated `D201C_SOURCE_TAXONOMY_MIGRATION_PREFLIGHT.md` to reflect Option A in effect. Owner applied the migration via `npx wrangler d1 migrations apply humanx --remote`.

**Production migration confirmed applied.** `evidence.source_type` and `evidence.evidence_strength` columns exist. Existing rows have NULL for both new columns. `quality` intact.

### D-201E — Backend Source Taxonomy Adoption

Commit `7982623`.

- Added `SOURCE_TYPES` (11 values) and `EVIDENCE_STRENGTHS` (5 values) constants
- Added `cleanSourceType()` and `cleanEvidenceStrength()` validation helpers — return `{_err:Response}` for invalid non-empty input, `null` for absent
- Extended `insertEvidence()`: new `sourceType='unknown'` and `evidenceStrength='unknown'` trailing params; INSERT writes both new columns; return shape includes snake_case and camelCase keys
- Extended `addEvidence()`: validates `body.sourceType` / `body.evidenceStrength` against enums; returns 400 `BAD_SOURCE_TYPE` / `BAD_EVIDENCE_STRENGTH` on mismatch; passes validated values to `insertEvidence`
- Extended all evidence read paths: `getClaim()` direct + reused, `claimDetail()` direct + reused, `reviewQueue()`, My HumanX query (line 318), public profile query (line 683)
- Extended `claimLineage()` evidenceLinks map with `sourceType` / `evidenceStrength`
- Extended `evidence-vault.js` SELECT and map
- Updated `createClaim()` initialEvidence call to pass `'unknown','unknown'`
- Updated D-42B smoke test to match extended INSERT column list
- Added 14 new D-201E smoke tests

Baseline after: 1613/24/57.

### D-201F — Frontend Source Taxonomy Collection UI

Commit `5756f82`.

- `index.html`: added `eSourceType` select (11 options) and `eEvidenceStrength` select (5 options) to the evidence side panel, after `eQuality`; added helper copy "Source type says where the support comes from. Strength says how much weight it carries. Origin is not proof."
- `app-v10.js`: added `sourceTypeLabel()` and `isOriginSource()` helpers
- `addCaseItem()`: reads and sends `sourceType` + `evidenceStrength` in POST body; resets both selects to `unknown` after submit; legacy `quality` unchanged
- `evidenceItem()`: renders `ev-source-type` pill and `ev-strength` pill when values are set and non-unknown; shows "Origin/tradition source — not empirical proof by itself." for `scripture_tradition`, `myth_folklore`, `fiction_story`
- `renderReviewInspectPanel()`: displays Source Type and Strength rows in the evidence inspect view when non-unknown values come from backend
- Widened D-189B/D-189C test slice windows to accommodate new payload lines
- Added 15 new D-201F smoke tests

Baseline after: 1628/24/57.

### D-201G — Closeout (this document)

Deployment and live sanity confirmed. Closeout doc written.

---

## Deployment

D-201E and D-201F deployed together via `npx wrangler deploy` from `HEAD = 5756f82`.

**Live sanity result: PASS**

Steps confirmed:
1. Opened a claim in Study view
2. Used side panel "Attach Evidence / Pressure"
3. Set Source type = `scripture_tradition`, Evidence strength = `disputed`
4. Submitted evidence — no 500, submitted to Review
5. Opened Review queue — loaded without error
6. Inspected the evidence item — **Source Type** and **Strength** rows visible in inspect panel
7. Existing evidence (legacy rows) still displays normally — no regression
8. Review decision logic unchanged

---

## Final State

### Data model

| Column | Status | Values |
|--------|--------|--------|
| `evidence.quality` | **Legacy — kept forever** | `repeatable`, `documented`, `media`, `testimony`, `vibes` (free text, 40 char max) |
| `evidence.source_type` | **New** | `empirical_study`, `expert_analysis`, `news_report`, `personal_experience`, `eyewitness`, `argument_opinion`, `scripture_tradition`, `myth_folklore`, `fiction_story`, `social_media`, `unknown` |
| `evidence.evidence_strength` | **New** | `strong`, `moderate`, `weak`, `disputed`, `unknown` |

Legacy rows have `source_type = NULL` and `evidence_strength = NULL`. All code handles NULL gracefully with `?? null` fallbacks.

### Invariants that must never be violated

- `quality` is never dropped, renamed, or removed from queries
- `evidence_strength` is never inferred from `quality` and written to the DB — inference is display-only
- `evidenceQualityLabel()` and `evidenceQualityClass()` remain as legacy display fallbacks
- Scoring (`recalcClaimScore`, `evidence_score`) is not affected by source taxonomy
- Review decision logic (approve/reject/keep-pending) is not affected by source type

### Origin-source contextual note rule

Evidence items with `source_type` in `{'scripture_tradition', 'myth_folklore', 'fiction_story'}` display: **"Origin/tradition source — not empirical proof by itself."**

This note is informational only. It does not affect moderation decisions, scoring, or claim status. Moderators apply their own judgment.

---

## What Remains

### D-201G scope (this doc only)

Closeout and documentation. No new feature work in this patch.

### RunPack output_contract note (deferred to D-201H or later)

Per D-201D spec Section 7, `buildRunPack()` output_contract should include:

```
source_type_note: "source_type='scripture_tradition', 'myth_folklore', or 'fiction_story' records the origin tradition of a belief — not independent empirical verification that the factual claim is true. Treat these items as context for why the claim is believed, not as empirical evidence that it is correct."
```

`buildRunPack()` already spreads `detail` — `source_type` and `evidence_strength` flow through automatically now that read queries include them. The explicit `output_contract` note is the only remaining RunPack task.

### Aggregate source-type charts (D-201 Phase C / D-201G in original roadmap)

The D-201A roadmap proposed aggregate pie charts showing source-type distribution across a claim's evidence. Deferred — requires frontend chart component work. Not blocking any current feature.

### Belief Engine integration (long-term)

The Belief Engine expansion roadmap (D-201A) included source-type data in the Belief Mirror panel and the avatar/identity card. These depend on the aggregate chart work and are long-term items.

---

## Do-Not-Regress Rules Added by This Arc

1. Never query `source_type` or `evidence_strength` before confirming migration 0015 is applied (already done in production — note for any new environments)
2. Never backfill `evidence_strength` by inferring from `quality` — inference is display-only
3. Never remove the origin-source contextual note for `scripture_tradition`, `myth_folklore`, `fiction_story` without an explicit decision to do so
4. Never drop or rename `quality` — it is the legacy display fallback for all pre-taxonomy rows
5. Scoring must remain independent of source taxonomy fields

---

## File Index for This Arc

| File | Purpose |
|------|---------|
| `migrations/0015_evidence_source_taxonomy.sql` | Applied to production D1 |
| `docs/D201B_SOURCE_TAXONOMY_AUDIT.md` | Evidence quality audit |
| `docs/D201C_SOURCE_TAXONOMY_MIGRATION_PREFLIGHT.md` | Migration apply guide (Option A applied) |
| `docs/D201D_SOURCE_TAXONOMY_API_SPEC.md` | Canonical enums + full API spec |
| `docs/D201_SOURCE_TAXONOMY_CLOSEOUT.md` | This document |
| `src/worker.js` | Backend: enums, helpers, insertEvidence, read paths |
| `src/evidence-vault.js` | Vault SELECT + map extended |
| `public/index.html` | eSourceType + eEvidenceStrength selects added |
| `public/app-v10.js` | addCaseItem, evidenceItem, sourceTypeLabel, review panel |
| `scripts/hardening-smoke-test.mjs` | 24 new smoke tests across D-201C/E/F |
