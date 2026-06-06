# D-53: Launch Seed Data Quality Audit Plan

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes. No D1 commands. No data mutations.

---

## Purpose

Before HumanX moves toward a wider or public launch, the seed claims and truths that appear
in the live app on first load need to be reviewed for quality, framing, and launch-readiness.
This document describes why that matters, what the current seed inventory looks like from
the repo files alone (no D1 queries), what the quality criteria are, and what the proposed
follow-on batches are.

No data is modified in D-53. This is a planning document only.

---

## Why Seed-Data Quality Matters

The seed data is the first thing a new visitor sees. It sets expectations for:

- **What kinds of claims belong on HumanX** — the platform's implicit scope signal
- **What quality of evidence looks like** — sparse or URL-less evidence teaches bad habits
- **How the "Truths" layer is framed** — inherited sayings can feel provocative without context
- **Whether the platform looks trustworthy** — conspiracy-flavoured demo seeds work for
  engine testing but read as sensationalist to a visitor with no prior context

The current seed set was built for **engine demonstration** — testing score ranges, evidence
quality tiers, pressure/test workflows, and claim type variety. That goal has been served.
The launch goal is different: a first impression that communicates credibility and purpose.

---

## Current Seed Inventory (from repo files — no D1 queries)

### Seed claims (`data/seed_claims_v1.json` and `src/seed-data.js`)

Both files carry the same four claims (JSON is the canonical source; JS is the runtime
import version). No source URLs are present on any evidence item.

| # | ID | Claim | Category | Type | Status target | Evidence items | Pressure points | Home tests |
|---|----|-------|----------|------|---------------|---------------|----------------|------------|
| 1 | `seed-flat-earth` | The Earth is flat | Cosmology | Physical/Testable | Disproven | 2 (media, vibes) | 4 (all sev 4–5) | 2 |
| 2 | `seed-moon-landing` | Humans landed on the Moon | History/Space | Historical | Strongly Supported | 3 (documented×2, repeatable×1) | 2 (sev 3–4) | 1 |
| 3 | `seed-dream-prediction` | A dream predicted my future | Belief | Religious/Belief | Untestable | 1 (testimony) | 2 (sev 3–4) | 1 |
| 4 | `seed-perpetual-motion` | Perpetual motion machines can produce free energy forever | Physics | Physical/Testable | Reality Collapse | 1 (media) | 3 (all sev 5) | 1 |

### Seed truths (`data/seed_truths_v1.json` and `src/truth-seed.js`)

Twelve truth statements. All `confidence_label: 'claimed'`, all `review_state: 'public'`
on import (set in `importTruthSeeds`).

| # | Statement | Category | Type |
|---|-----------|----------|------|
| 1 | Money is evil | culture | common |
| 2 | Hard work always pays off | culture | cultural |
| 3 | Everything happens for a reason | belief | religious |
| 4 | Trust the experts | institution | institutional |
| 5 | Never trust the experts | institution | common |
| 6 | The customer is always right | business | common |
| 7 | Children should always obey adults | family | family |
| 8 | Science has proven it | science | scientific |
| 9 | My religion is the only true path | religion | religious |
| 10 | People are basically good | human nature | common |
| 11 | People are stupid | human nature | common |
| 12 | You can be anything you want | identity | cultural |

### Other data files (no import hooks confirmed yet)

| File | Contents | Status |
|------|----------|--------|
| `data/humanx_truths_v1.sql` | SQL INSERT statements for truths | Not imported via current Worker routes |
| `data/humanx_d1_schema_v1.sql` | Schema snapshot | Reference only |
| `data/humanx_d1_schema_v2_upgrade.sql` | Schema upgrade snapshot | Reference only |
| `data/humanx_analysis_results_v1.sql` | Sample analysis results | Not confirmed as imported |
| `data/humanx_belief_snapshots_v1.sql` | Sample belief snapshots | Not confirmed as imported |
| `data/humanx_claim_normalized_key_v1.sql` | Normalized claim keys | Not confirmed as imported |
| `data/humanx_evidence_reuse_v1.sql` | Evidence reuse links | Not confirmed as imported |
| `data/humanx_truth_claim_bridge_v1.sql` | Truth–claim bridge links | Not confirmed as imported |

---

## Quality Assessment (repo-level, no D1 access)

### Claim quality issues

| Claim | Issue | Severity |
|-------|-------|----------|
| All 4 | `source_url: ''` on all evidence items — no external links | Medium — reduces credibility for a new user |
| `seed-flat-earth` | High controversy signal on first load — works for demo, not for first impression | Low–medium — depends on framing |
| `seed-perpetual-motion` | `Reality Collapse` status — a rare edge-case verdict shown prominently | Low — good engine test but confusing to new visitors unfamiliar with the status system |
| `seed-dream-prediction` | `Religious/Belief` / `Untestable` — legitimate category, but without intro context it reads as dismissive of personal experience | Low — tone risk |
| `seed-moon-landing` | Best quality of the four — `repeatable` evidence present, multiple evidence types, good pressure framing | No issue |

### Evidence quality issues

| Issue | Detail |
|-------|--------|
| No `source_url` on any seed evidence | All evidence items have `source_url: ''`. A new visitor sees evidence bodies without any link to verify. |
| `vibes`-quality evidence on `seed-flat-earth` | The "water finds its level" entry is intentionally low-quality to demonstrate the scale — this is pedagogically correct but reads as filler without context. |
| Single evidence item on 2 of 4 claims | `seed-dream-prediction` and `seed-perpetual-motion` each have one evidence item. That is sufficient for the scoring engine but thin for a launch first impression. |

### Truths quality issues

| Issue | Detail |
|-------|--------|
| "People are stupid" | Blunt, cynical phrasing. Acceptable as a documented cultural truth type but may read as hostile on first load. |
| "My religion is the only true path" | Legitimate cultural truth type, but without visible framing as an inherited saying it may read as HumanX endorsing or attacking the position. |
| "Children should always obey adults" | Touches child safety framing — may be sensitive in some contexts. |
| All 12 import as `review_state: 'public'` directly | `importTruthSeeds` in `src/truth-seed.js` inserts truths as `'public'` without a review step. This bypasses the moderation queue. |
| No `linked_claim_id` on any truth | None of the 12 seed truths are bridged to a claim. The `Truths → Claim` analysis pathway is dormant in the seed set. |

---

## Audit Goals

The following questions should be answered for each seed item before launch:

1. **Does the claim text meet precision standards?** Is it falsifiable, specific, and free of vague universals?
2. **Is the category/type assignment correct** for the platform's current taxonomy?
3. **Does at least one evidence item have a real `source_url`?** External links anchor the claim in verifiable public record.
4. **Is source quality labelled fairly?** `quality` labels (`repeatable`, `documented`, `media`, `testimony`, `vibes`) should reflect actual source type, not aspirational framing.
5. **Is pressure coverage adequate?** At least one pressure point per claim shows the platform takes opposing evidence seriously.
6. **Is there a home test where applicable?** Physical/testable claims should have a usable test; untestable and belief claims should explain why a test is not meaningful.
7. **Is the claim appropriate for the launch audience?** Demo seeds built to stress-test the scoring engine may not be the right first impression.
8. **Does the truth statement have a framing note?** Without a visible origin/category label, some statements can be read as HumanX endorsing a position rather than documenting an inherited saying.

---

## Seed Classification Framework

Each seed item should be classified as one of:

| Tag | Meaning |
|----|---------|
| `keep-as-is` | Passes all audit criteria; no changes needed |
| `add-sources` | Good claim/pressure structure; just needs `source_url` filled in |
| `rewrite` | Claim text, category, or framing needs revision |
| `demo-only` | Structurally useful for engine testing but not appropriate for public launch front page |
| `archive` | Should not appear in public view; can be set to `review_state='archived'` in production |

---

## Proposed Launch Seed Categories

A launch-quality seed pack should cover these categories with one or two well-evidenced claims each:

| Category | Rationale | Example claim type |
|----------|-----------|-------------------|
| Science / physical world | Core platform identity — testable claims with source-backed evidence | `Physical/Testable` with `documented` or `repeatable` evidence |
| History / public record | Demonstrates use for historical claims; strong documentary evidence available | `Historical` with `documented` evidence |
| Civic / media literacy | Demonstrates value for media consumers; claims about how information spreads | `Sociological` or `Physical/Testable` |
| Human behaviour / cognitive bias | Demonstrates that psychology and social science can be evidence-graded | `Sociological` with study-backed evidence |
| Untestable / belief — clearly labelled | Shows the platform is not hostile to belief; marks the boundary clearly | `Religious/Belief` / `Untestable` with empathetic framing |

Claims in the first-load experience should not lead with conspiracy content. Conspiracy claims
are legitimate subjects for analysis, but they should emerge from user submissions, not dominate
the seed set that new users see before they understand the platform's framing.

---

## Seed Claim Quality Criteria (launch standard)

| Criterion | Requirement |
|-----------|------------|
| Claim text | Precise, specific, not a slogan or universal. ≥ 8 characters, ideally one testable assertion. |
| Category | Assigned from platform taxonomy; consistent with `type` |
| Type | One of: `Physical/Testable`, `Historical`, `Sociological`, `Religious/Belief`, `Mathematical` |
| Evidence | At least 1 item with a real `source_url` (not empty string) |
| Evidence quality | Label reflects actual source type: `repeatable` = peer-reviewed/reproducible; `documented` = public record; `media` = media report; `testimony` = personal report; `vibes` = opinion/saying |
| Pressure | At least 1 pressure point; severity reflects actual challenge strength |
| Home test | Present for `Physical/Testable` claims; omitted or explained for `Untestable`/`Religious/Belief` |
| `review_state` | Must enter as `'review'` then be approved by admin before appearing publicly — never inserted directly as `'public'` for production load |
| Framing | Does not lead with sensationalism; evidence body is written neutrally |

---

## Safety Rules for Any Future Seed Work

| Rule | Detail |
|------|--------|
| No D1 writes without explicit approval | Any production import requires per-session explicit user approval |
| No hard deletes | Archive (`review_state='archived'`) over delete; rows are preserved |
| Export snapshot before any production import | A D1 table export before bulk import provides a rollback reference |
| No Wrangler | `wrangler d1 execute` is off-limits without explicit approval |
| No live write smoke | The write-smoke script requires per-session explicit approval |
| Staging before production | Any new seed pack should be validated in a local / dev D1 instance before production |
| Docs-only plan first | Each seed batch is documented (keep/archive/rewrite/add-sources decision) before any D1 action |

---

## Proposed Follow-On Batches

| Batch | Type | Scope |
|-------|------|-------|
| **D-54** | Docs-only | Read-only seed inventory — read existing repo files plus any additional data/ SQL files not yet inventoried; classify each seed item using the framework above; confirm which items are in production vs. which are repo-only files never imported |
| **D-55** | Docs-only | Launch seed pack draft — write proposed claim text, evidence, pressure, and test content for a 5–8 claim launch set covering the five proposed categories; include `source_url` candidates (no links clicked, just identified); no D1 changes |
| **D-56** | Optional, gated | Production seed cleanup / import plan — docs-only plan for archiving demo-only seeds, adding sources, and importing the new seed pack; execution requires explicit D1 approval per session |

---

## Out of Scope for This Audit Plan

| Item | Reason |
|------|--------|
| D-47 live evidence lifecycle test | Separate track; gated by explicit live-write approval |
| Production score backfill | Separate track; gated by explicit D1 approval |
| AI-assisted claim writing | Not planned; all seed content is human-authored |
| Bulk import scripts | Not written yet; deferred to D-56 planning |
| Changes to any seed file in this D | No edits to `src/seed-data.js`, `src/truth-seed.js`, or `data/` files |
| Changes to any Worker route | No changes in D-53 |

---

## D-53 Completion Record

| Item | Status |
|------|--------|
| Seed file inventory from repo: 4 claims, 12 truths, 8 data/ SQL files | ✅ Done |
| Evidence source URL gap identified (all empty) | ✅ Documented |
| Claim-level quality issues identified | ✅ Documented |
| Truth-level quality issues identified | ✅ Documented |
| Seed classification framework defined | ✅ Done |
| Launch seed category proposals written | ✅ Done |
| Launch standard quality criteria defined | ✅ Done |
| Safety rules for seed work documented | ✅ Done |
| Proposed follow-on batches D-54 / D-55 / D-56 defined | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No seed data imported/edited/deleted | ✅ Confirmed |
