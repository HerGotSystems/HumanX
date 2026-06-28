# D-208 — Belief Engine Privacy / Framing Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `ed81fba`
**Baseline:** 1766/24/57
**Status:** COMPLETE — privacy patch shipped, deploy confirmed, sanity passed

---

## D-208A — Audit Summary

The D-208A audit mapped the full Belief Engine integration surface: the standalone questionnaire app (`public/apps/humanx-belief-engine/index.html`), the backend snapshot routes (`/api/belief-snapshots`, `/api/belief-promote`), the My HumanX Belief Mirror, the Drift view, and the public profile shared snapshot.

**Critical risk identified:** The `/api/u/:slug` public profile endpoint was returning belief identity fields for any snapshot the owner had marked `public_summary_enabled=1`:

- `dominant_pattern` — a named archetype label generated from the user's questionnaire answers. Could resolve to a named religion, ideology, or worldview (e.g., "Traditional Christianity," "Scientific Materialism," "Libertarianism").
- `top_beliefs_json` — the full alignment array from the questionnaire, containing named belief system entries with their similarity percentages.
- `topAlignmentName` — the name of the highest-similarity belief system extracted from `top_beliefs_json` server-side.

These fields were being rendered on the public profile page for any user who had (a) completed the Belief Engine, (b) saved a snapshot, and (c) enabled profile sharing. A user enabling "Make profile public" may not have understood they were also publishing a labelled ideological or religious alignment.

**Secondary risks identified:**
- "Belief DNA" heading in the Belief Engine results — implies biological determinism.
- "Identity Fragmentation" heading — pathologizing label for what is actually belief-origin diversity (how many different sources a person's beliefs come from).
- Numeric scores in My HumanX snapshot list ("stability 73 · openness 45 · pressure 62") shown without framing context.
- My HumanX Mirror guardrail copy was present but insufficient — it did not include "not a score of intelligence, morality, or truth."

**Unsafe dimensions if ever made public:** `TRIB` (Tribal Load), `FUSE` (Identity Fusion), `PAIN` (Pain Architecture), `RIGD` (Rigidity) — stored in `dimensions_json` which was and remains private.

---

## D-208B — Implementation Summary

Commit `ed81fba`. Four files changed.

### 1. Backend: public profile field exclusion (`src/worker.js`)

**Fields removed from `getPublicProfile` SELECT and response:**

| Field | Was returned | Now returned | Reason removed |
|-------|-------------|-------------|----------------|
| `dominant_pattern` | Yes | No | Named religious/ideological archetype label |
| `top_beliefs_json` | Yes (parsed) | No | Contains named alignment entries with percentages |
| `topAlignmentName` | Yes (extracted) | No | Name of top-similarity belief system |

**Fields retained in public response:**

| Field | Returned | Notes |
|-------|---------|-------|
| `label` | Yes | Owner-written snapshot name — no identity content |
| `stabilityScore` | Yes | Aggregate numeric, no ideological content |
| `opennessScore` | Yes | Aggregate numeric, no ideological content |
| `pressureScore` | Yes | Aggregate numeric, no ideological content |
| `contradictionCount` | Yes | Integer count, no identity content |
| `createdAt` | Yes | Timestamp only |

**Comment added to `getPublicProfile`:**
> `D-208B: Belief identity labels are private by default; public exposure requires explicit per-field opt-in. dominant_pattern and top_beliefs_json are excluded — they can contain named religious/ideological alignments.`

**Stored data not deleted.** The `belief_snapshots` table schema was not changed. `dominant_pattern` and `top_beliefs_json` remain stored in the database and remain fully available in the private owner view (`/api/my-humanx` and `/api/belief-snapshots`). Only the public read path was restricted.

### 2. Belief Engine copy (`public/apps/humanx-belief-engine/index.html`)

| Before | After | Reason |
|--------|-------|--------|
| "Belief DNA" | "Belief Pattern" | "DNA" implies fixed biological determination; "Pattern" describes a current observable pattern that can change |
| "Identity Fragmentation" | "Belief Origin Mix" | "Fragmentation" is a pathologizing clinical term; "Origin Mix" describes what the measurement actually shows — what proportion of beliefs came from which sources |

**Guardrail sentence added to results screen** (below existing framing copy):
> `Belief patterns describe how you interact with claims. They are not a score of intelligence, morality, or truth.`

This appears immediately below the existing "not a diagnosis, use it as a mirror, not a verdict" text, so the two notes are adjacent.

### 3. Public profile render (`public/app-v10.js`)

**`renderPublicProfileSnapshotHtml`:** Removed rendering of `s.dominantPattern`, `s.topAlignmentName`, and the score meters (scores are still in the API response but removed from the card render to reduce identity labeling risk — the card now shows contradictionCount and date only, plus two disclaimer paragraphs). Added D-208B guardrail copy:
> `Belief patterns describe how someone interacts with claims. They are not a score of intelligence, morality, or truth. Belief identity details are private by default.`

**`renderPublicProfileHtml`:** Removed `bfParts` dead code — the array that previously built a bio fallback from `sn.dominantPattern` and `sn.topAlignmentName`. Since those fields are no longer returned by the API, the bio fallback is now always an empty string. The template variable `bioFallback` remains for structural compatibility but is always `''`.

**`meMirrorGuardrailHtml` (private owner Mirror):** Extended with:
> `Private belief reflections are for self-study. They are not personality labels or truth rankings.`

The owner's private view of their own snapshot data (stability/openness/pressure scores, dominant_pattern, top_beliefs) remains fully available — only the public profile render was restricted.

### 4. Smoke tests (`scripts/hardening-smoke-test.mjs`)

- 10 stale tests from D-142B/C, D-154B, D-158B, D-159B updated to assert the new privacy-first behavior.
- 12 new D-208B tests added covering: backend SELECT exclusion, frontend render exclusion, guardrail copy presence, Belief Engine label changes, Mirror guardrail, banned framing, no migration.
- Net result: 1744 → 1766 tests, 0 failures.

---

## Confirmed: Fields No Longer Returned from `/api/u/:slug`

**Yes — confirmed.** The following fields are no longer included in the public profile API response for any user:

- `dominant_pattern` — excluded from SELECT, not in response object
- `top_beliefs_json` — excluded from SELECT, not parsed, not in response object
- `topAlignmentName` — not extracted, not in response object
- "Top alignment: [named religion/ideology]" — never rendered in public profile card

The D-208B smoke test `D-208B: getPublicProfile does not select top_beliefs_json` and `D-208B: getPublicProfile does not select dominant_pattern` guard this regression surface permanently.

---

## Confirmed: Stored Data Not Deleted

No migration was added. No `ALTER TABLE`, `DROP COLUMN`, or `UPDATE` was run. The `belief_snapshots` table retains all columns including `dominant_pattern` and `top_beliefs_json`. All historical snapshot data is preserved.

The restriction is purely at the API read layer — `getPublicProfile` no longer selects or returns these columns for the public response. The private owner routes (`/api/my-humanx`, `/api/belief-snapshots`) continue to return all snapshot fields to the owner.

---

## Confirmed: Private Owner View Remains Available

In My HumanX:
- The Belief Mirror panel continues to show `dominant_pattern` (labeled as the latest snapshot pattern), stability/openness/pressure meters, drift deltas, tensions, and reflection questions.
- The snapshot list continues to show "stability N · openness N · pressure N" for the owner's own snapshots.
- The owner's "Share on public profile" control still works — but the shared snapshot will now expose only the privacy-safe field set.
- The Drift view continues to show full snapshot history.

Nothing in the owner's private self-view was removed.

---

## Confirmed: Belief Engine Wording Changed

| Old | New | Status |
|-----|-----|--------|
| "Belief DNA" | "Belief Pattern" | ✓ Changed in `index.html` line ~576 |
| "Identity Fragmentation" | "Belief Origin Mix" | ✓ Changed in `index.html` line ~580 |
| *(no guardrail on results)* | "Belief patterns describe how you interact with claims. They are not a score of intelligence, morality, or truth." | ✓ Added to results screen |

The JS element IDs (`dna-chips`, `frag-panel`) were not changed — only the visible `<h3>` label text. The underlying measurement behavior is unchanged.

---

## Confirmed: No Avatar, Identity Cards, Ideology Ranking, or Public Belief Labels Added

D-208B was strictly a removal and copy-fix patch. Nothing was added that:
- Generates an avatar or visual identity card
- Creates belief identity cards on any public surface
- Ranks users by ideology, worldview alignment, or belief type
- Adds a truth score, purity score, or intelligence proxy
- Shows named religious or ideological alignment labels publicly
- Adds any new public belief field

The D-208B smoke tests `D-208B: no "truth level" framing added`, `D-208B: no "purity" framing added`, and `D-208B: no "ideology score" framing added` guard these surfaces.

---

## Confirmed: No Migration Needed

The D-208B implementation required no schema changes. The fix was entirely at the API read layer (`getPublicProfile`) and the frontend render layer. The `D-208B: no new migration file 0006 was added` smoke test guards this.

---

## Do-Not-Regress Rules for This Component

1. `getPublicProfile` must never return `dominant_pattern` or `top_beliefs_json` in the shared snapshot object — these require explicit per-field opt-in before they can be public.
2. `topAlignmentName` (or any extracted named belief system label) must not be added to any public API response without a dedicated privacy review.
3. The Belief Engine results screen must always include the guardrail sentence "not a score of intelligence, morality, or truth."
4. The "Belief Pattern" and "Belief Origin Mix" headings must not be reverted to "Belief DNA" or "Identity Fragmentation."
5. `dimensions_json` must never be returned by any public API route — it contains the raw per-dimension scores including TRIB, FUSE, PAIN, RIGD which are private by nature.
6. Any future public belief surface must pass the D-203A three-test gate equivalent for belief data: (1) could a user read it as a truth ranking? (2) does it label ideological or religious identity? (3) does it create a "good/bad believer" impression?

---

## Live Deploy Sanity

Deployed from `HEAD = ed81fba` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. Belief Engine results screen: "Belief DNA" label gone — replaced with "Belief Pattern"
2. Belief Engine results screen: "Identity Fragmentation" label gone — replaced with "Belief Origin Mix"
3. Guardrail copy visible on results screen: "Belief patterns describe how you interact with claims. They are not a score of intelligence, morality, or truth."
4. My HumanX / Mirror: private/self-study framing visible — "Private belief reflections are for self-study. They are not personality labels or truth rankings."
5. Public profile: no named belief alignment labels rendered (no "Traditional Christianity," "Islam," "Scientific Materialism," or dominant pattern labels)
6. Public profile: still loads normally — shared snapshot card shows owner-written label, contradiction count, and date
7. No console errors
8. No layout regressions in Study view, My HumanX, or arena

---

## Public Profile Belief Labels: Status

**Public profile belief identity labels are now private by default.** A user with a public profile and a shared snapshot will no longer have their named religious, ideological, or worldview alignment exposed to the public. The shared snapshot card now shows only the owner-written label, contradiction count, and snapshot date — plus the privacy guardrail copy.

This closes the highest-severity risk identified in D-208A.

---

## Roadmap Status

| Task | Status |
|------|--------|
| D-208A — Audit | ✓ Complete — commit `922c8fb` |
| D-208B — Privacy + framing patch | ✓ Complete — commit `ed81fba` |
| D-208C — Closeout | ✓ This document |
| D-208D — Belief pattern cards in My HumanX Mirror | Pending — safe investigation habit cards (source type, evidence strength, claim category) |
| D-208E — Public/private visibility rules | Pending — per-field consent model |
| D-208F — Optional avatar prototype | Pending — after D-208C spec approved and D-208D cards live |

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D208A_BELIEF_ENGINE_INTEGRATION_AUDIT.md` | Full audit: current state, integration map, risks, safe/unsafe dimensions, roadmap |
| `docs/D208_BELIEF_ENGINE_PRIVACY_CLOSEOUT.md` | This document |
| `src/worker.js` | `getPublicProfile`: excluded `dominant_pattern`, `top_beliefs_json`, `topAlignmentName` from public response; D-208B comment added |
| `public/app-v10.js` | `renderPublicProfileSnapshotHtml`: removed identity fields, added guardrail copy; `renderPublicProfileHtml`: removed bfParts dead code; `meMirrorGuardrailHtml`: extended with self-study framing |
| `public/apps/humanx-belief-engine/index.html` | "Belief DNA" → "Belief Pattern"; "Identity Fragmentation" → "Belief Origin Mix"; guardrail sentence added to results screen |
| `scripts/hardening-smoke-test.mjs` | 12 new D-208B tests; 10 stale D-142B/C/D-154B/D-158B/D-159B tests updated |
