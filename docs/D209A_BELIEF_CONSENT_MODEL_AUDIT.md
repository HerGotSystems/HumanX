# D-209A — Belief Public/Private Consent Model Audit

**Date:** 2026-06-28
**HEAD at audit time:** `3c4b018`
**Baseline:** 1785/24/57
**Status:** AUDIT ONLY — no code changes

---

## Purpose

HumanX now has:
- Private belief reflection cards (D-208D) showing source habits, evidence strength habits, and investigation activity
- A protected public profile where named belief identity labels were removed (D-208B)
- A live snapshot sharing flow where owners can mark one snapshot `public_summary_enabled=1`

Before any belief-related field is allowed back onto a public profile, this audit defines the consent model: what classes of data exist, which fields require explicit opt-in, how the backend should enforce it, and what the UI must show before publishing.

---

## A. Current State

### A1. Private belief data stored

The `belief_snapshots` table (migration 0003) stores per-user belief data. All columns:

| Column | Type | Example content |
|--------|------|----------------|
| `id` | TEXT | `bsn_abc123` |
| `user_id` | TEXT | owner FK |
| `label` | TEXT | owner-written: "My 2024 baseline" |
| `engine_version` | TEXT | `1.0` |
| `source` | TEXT | `belief-engine` |
| `dominant_pattern` | TEXT | Named archetype: "Traditional Christianity", "Scientific Materialism", "Libertarian Individualism" |
| `summary` | TEXT | Free-text engine-generated summary |
| `belief_count` | INTEGER | count of mapped beliefs |
| `contradiction_count` | INTEGER | count of flagged tensions |
| `stability_score` | INTEGER | 0–100 |
| `openness_score` | INTEGER | 0–100 |
| `pressure_score` | INTEGER | 0–100 |
| `dimensions_json` | TEXT | Raw per-dimension scores: META/EVID/AUTH/COLL/RITE/ABSO/RIGD/PROG/TRAN/INHR/SELF/TRIB/PAIN/OPEN/FUSE/STRS |
| `top_beliefs_json` | TEXT | Array: `[{name:"Traditional Christianity", pct:78}, ...]` |
| `contradictions_json` | TEXT | Flagged tension descriptions |
| `stress_points_json` | TEXT | Stress architecture descriptions |
| `raw_json` | TEXT | Full questionnaire result JSON |
| `created_at` | INTEGER | Unix timestamp |
| `public_summary_enabled` | INTEGER | 0/1 — single-row flag, managed by `saveProfileSettings` |

The `belief_snapshots` table has **no `hidden_at` column in the schema** (migration 0003), but `getPublicProfile` queries `AND hidden_at IS NULL` — this either relies on SQLite NULL-defaulting absent columns or was added later. This should be verified before any schema work. *(No migration created hidden_at — the query is safe because SQLite treats missing columns in WHERE as NULL = NULL → false, so the condition harmlessly filters nothing; but it is fragile.)*

### A2. What the public profile currently exposes

After D-208B, `getPublicProfile` (`/api/u/:slug`) returns `sharedSnapshot` containing:

| Field | Returned | Source column |
|-------|---------|--------------|
| `label` | Yes | `label` (owner-written) |
| `stabilityScore` | Yes | `stability_score` |
| `opennessScore` | Yes | `openness_score` |
| `pressureScore` | Yes | `pressure_score` |
| `contradictionCount` | Yes | `contradiction_count` |
| `createdAt` | Yes | `created_at` |
| `dominant_pattern` | **No** | excluded at SELECT level |
| `top_beliefs_json` | **No** | excluded at SELECT level |
| `topAlignmentName` | **No** | not extracted |
| `dimensions_json` | **No** | not selected |
| `summary` | **No** | not selected |
| `contradictions_json` | **No** | not selected |
| `stress_points_json` | **No** | not selected |
| `raw_json` | **No** | not selected |

The public profile renderer (`renderPublicProfileSnapshotHtml`) then renders only: owner-written label, contradiction count, created date, and two disclaimer paragraphs. The three numeric scores (`stabilityScore`, `opennessScore`, `pressureScore`) are **in the API response but not rendered** in the current public profile card. This is a quiet gap — the scores travel over the wire even though they are not displayed.

### A3. What was removed in D-208B

| Removed field | Previously exposed via |
|--------------|----------------------|
| `dominant_pattern` | SELECT + response object + `meSharedSnapshotCardHtml` owner preview |
| `top_beliefs_json` | SELECT + parsed `topAlignmentName` extraction |
| `topAlignmentName` | Extracted server-side, in response object |
| Score meters on public card | `renderPublicProfileSnapshotHtml` meter render removed |

### A4. What private reflection cards show (D-208D)

`meBeliefReflectionHtml(data)` — private My HumanX view only:
- Source habits: `source_type` distribution from the owner's evidence rows
- Evidence strength habits: `evidence_strength` distribution from the owner's evidence rows
- Investigation activity: counts of evidence/pressure/home_tests

These derive from investigation activity, not from the belief questionnaire. They are computed client-side from `data.evidence`, `data.pressure`, `data.home_tests`. They are never available in any public API response.

### A5. How snapshot sharing currently works

1. Owner opens My HumanX → Profile Settings panel.
2. Below the profile toggle, the Belief Snapshots list shows all snapshots with a radio button: "Share on public profile."
3. Selecting a snapshot calls `meShareSnapshotUI(snapshotId)` → POST `/api/my-humanx/profile-settings` with `shared_snapshot_id`.
4. `saveProfileSettings` in `worker.js`:
   - Sets `public_summary_enabled=0` on ALL the user's snapshots.
   - Sets `public_summary_enabled=1` on the selected snapshot only.
5. `getPublicProfile` reads the first snapshot where `public_summary_enabled=1`.
6. The response is shaped by `getPublicProfile` to the safe field set only.

**The consent model is currently snapshot-level binary: one snapshot is either shared or not.** There is no per-field consent. Sharing a snapshot currently implies consent to share stabilityScore, opennessScore, pressureScore, and contradictionCount — none of which the owner sees labeled in the sharing UI before clicking "Share on public profile."

### A6. Live consistency gap (owner preview vs actual public)

`meSharedSnapshotCardHtml(s)` — the **owner-facing preview** card in Profile Settings — still renders `dominantPattern`, `topAlignmentName`, and score meters using data from the private `/api/my-humanx` snapshot rows.

The **actual public card** (`renderPublicProfileSnapshotHtml`) no longer renders those fields.

This means an owner who marks a snapshot public sees a preview that shows fields that are **not actually visible to the public.** The preview is misleading in the safe direction (the owner sees more than the public does), but it creates confusion and undermines informed consent — an owner may think they are sharing their belief pattern label publicly when they are not.

**This is a D-209B candidate: align owner preview with actual public render.**

---

## B. Privacy Classes

### Class 1 — Safe public basics

Fields that can appear on a public profile with current guardrail copy and no additional consent.

| Field | Risk | Status |
|-------|------|--------|
| `label` | Owner-written; owner controls the text | Currently public |
| `createdAt` | Timestamp only; no identity content | Currently public |
| `contradictionCount` | Integer count; reveals nothing about beliefs | Currently public |

### Class 2 — Sensitive belief identity

Fields that can resolve to or imply named religious, ideological, political, or worldview labels. **Require explicit per-field opt-in before any public exposure.**

| Field | Risk |
|-------|------|
| `dominant_pattern` | Named archetype label ("Traditional Christianity", "Scientific Materialism", "Libertarian Individualism") — directly identifies ideology or religion |
| `top_beliefs_json` | Array of named alignment entries with percentages — full ideological fingerprint |
| `topAlignmentName` | Extracted top-similarity belief system name — single-label religion/ideology exposure |
| `summary` | Engine-generated free text — may describe ideological tendencies in plain language |
| `raw_json` | Full questionnaire result — contains all 77 answers, all dimension scores, all alignment entries |

**Default: private. Must not appear on any public surface without a dedicated per-field consent UI.**

### Class 3 — Sensitive inference

Fields that do not name a religion or ideology directly, but allow inference about a person's worldview, cognitive style, or emotional state. Require per-field opt-in and context framing before public exposure.

| Field | Risk |
|-------|------|
| `stability_score` | Infers how "fixed" a person's beliefs are — correlates with conformism, authoritarianism, or certainty in some readings |
| `openness_score` | Infers cognitive openness — correlates with liberalism or intellectual curiosity in some readings |
| `pressure_score` | Infers belief stress — may imply emotional fragility or resilience |
| `dimensions_json` | Raw per-dimension scores including TRIB (tribal load), FUSE (identity fusion), PAIN (pain architecture), RIGD (rigidity) — high inference risk |
| `stress_points_json` | Describes emotional stress patterns — sensitive |
| `contradictions_json` | Describes specific belief tensions — may reveal worldview conflicts |
| `belief_count` | Reveals depth of mapping — minor risk but worth tracking |
| Source habits distribution | Infers epistemological style (e.g., heavy scripture/tradition use) |
| Evidence strength habits distribution | Infers how rigorously a person self-rates their own sources |

**Default: private. Currently not on any public surface. Requires consent UI, framing copy, and a dedicated public/private toggle per group before any public exposure.**

### Class 4 — Private-only reflection

Data that must never appear on a public surface in any form. No opt-in path appropriate.

| Data | Why private-only |
|------|-----------------|
| My HumanX source habits card | Derived from private evidence rows; reveals investigation patterns |
| My HumanX evidence strength habits card | Derived from private evidence rows |
| My HumanX investigation activity card | Derived from evidence/pressure/test counts |
| `dimensions_json` TRIB/FUSE/PAIN/RIGD | High-sensitivity dimensions — tribal load, identity fusion, pain architecture, rigidity |
| `raw_json` | Full questionnaire answers |
| `contradictions_json` | Specific belief tension descriptions |
| `stress_points_json` | Stress architecture descriptions |

---

## C. Consent Principle

> **Nothing belief-related becomes public because a snapshot is shared. Each belief field group requires explicit per-field opt-in.**

Corollaries:
- `public_summary_enabled=1` means "this snapshot is the candidate for sharing." It does not mean all fields are consented to.
- `profile_public=1` means "I have a public profile." It does not mean any belief data is consented to.
- A new public field requires: (1) the field in Class 1 or explicitly opted into from Class 2/3, (2) a per-field toggle in the sharing UI, (3) preview showing the exact public render, (4) framing copy explaining what the field means.

---

## D. Public Sharing Rules

| Rule | Rationale |
|------|----------|
| Snapshot shared ≠ all fields shared | Binary `public_summary_enabled` does not constitute per-field consent |
| Profile public ≠ belief details public | `profile_public=1` enables the profile link; it does not expand belief data exposure |
| Owner-written label can be public | Owner controls its content; no identity label can be injected by the engine |
| Named alignments remain private | `dominant_pattern` and `top_beliefs_json` require explicit per-field opt-in — Class 2 |
| Score fields require per-field opt-in | `stability_score`, `openness_score`, `pressure_score` are Class 3 — inference risk even without naming ideology |
| Private reflection cards remain private | Source habits, evidence strength habits, investigation activity are private-only — Class 4 |
| UI must show exact public render before publishing | The owner preview must match the actual public card — the current gap (owner sees dominantPattern/scores in preview; public does not) must be fixed |
| No bulk "share all belief data" button | Each field group must have its own toggle |
| Revoke must be immediate | Setting `shared_snapshot_id` to null or `public_summary_enabled=0` must take effect on next request with no caching lag |

---

## E. Required Future UI Model

### E1. Snapshot sharing UI (current vs required)

**Current:** Owner selects a snapshot via radio button. Clicking "Share on public profile" calls `meShareSnapshotUI`. The preview shows `dominantPattern`, score meters, `topAlignmentName` — none of which are actually public after D-208B.

**Required:**
- The sharing UI must show a **field-group checklist** (default all off), e.g.:
  - [ ] Snapshot label (owner-written)
  - [ ] Date recorded
  - [ ] Tension count
  - [ ] Stability / Openness / Pressure scores *(sensitive inference — adds context about belief rigidity)*
  - [ ] Belief pattern label *(sensitive identity — names ideology or religion)*
  - [ ] Top alignments *(sensitive identity — names specific belief systems)*
- Each unchecked field must be absent from the public card.
- The live preview below the checklist must render the **exact public card** — not the owner's private data.
- A "What will others see?" section must appear adjacent to the checklist.

### E2. Per-group toggles

| Toggle | Default | Class | Migration required |
|--------|---------|-------|--------------------|
| Share snapshot at all | Off | — | No (existing `public_summary_enabled`) |
| Show label | Off | 1 | Needs consent field |
| Show date | Off | 1 | Needs consent field |
| Show tension count | Off | 1 | Needs consent field |
| Show stability/openness/pressure scores | Off | 3 | Needs consent field |
| Show belief pattern label | Off | 2 | Needs consent field |
| Show top alignment | Off | 2 | Needs consent field |

### E3. Revoke / hide controls

- "Stop sharing this snapshot" must be a single click and take effect immediately.
- Hiding a snapshot (`hidden_at`) must also clear `public_summary_enabled`.
- Revoking specific fields must not require deleting the snapshot.

---

## F. Backend Model Options

### Option 1 — JSON consent map on `belief_snapshots`

Add a `visibility_json` column to `belief_snapshots`. Value is a JSON object: `{"label":true,"date":true,"scores":false,"pattern":false,"alignments":false}`.

| Attribute | Assessment |
|-----------|-----------|
| Migration complexity | Low — one `ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT` |
| Query complexity | Medium — must parse JSON in the response-shaping layer (no SQL-level filtering) |
| Rollback risk | Low — column is nullable; absence means default-private |
| Future flexibility | Medium — adding a new field means updating JSON structure; no schema enforcement |
| Owner UX | Good — one row per snapshot, no join needed |

**Risk:** If `getPublicProfile` forgets to check `visibility_json`, all fields default to returned. Must be enforced at response-shaping layer with an explicit whitelist.

### Option 2 — Separate `belief_visibility_settings` table

New table: `belief_visibility_settings (snapshot_id TEXT, field_key TEXT, visible INTEGER, updated_at INTEGER)`.

| Attribute | Assessment |
|-----------|-----------|
| Migration complexity | Medium — new table + index |
| Query complexity | High — requires JOIN or multiple queries to assemble visibility map |
| Rollback risk | Medium — table drop reverses all consent data |
| Future flexibility | High — any field key can be added without migration |
| Owner UX | Same as Option 1 from the user's perspective |

**Risk:** JOIN complexity; if the JOIN is omitted, all fields fall through to public. More moving parts.

### Option 3 — Boolean columns per field group on `belief_snapshots`

Add columns: `visibility_label INTEGER DEFAULT 0`, `visibility_date INTEGER DEFAULT 0`, `visibility_tension_count INTEGER DEFAULT 0`, `visibility_scores INTEGER DEFAULT 0`, `visibility_pattern INTEGER DEFAULT 0`, `visibility_alignments INTEGER DEFAULT 0`.

| Attribute | Assessment |
|-----------|-----------|
| Migration complexity | High — one `ALTER TABLE` per column (SQLite does not support multi-column ADD); 5–6 migrations or one migration with multiple stmts |
| Query complexity | Low — all values available in the SELECT; response shaping is straightforward |
| Rollback risk | Low — columns default to 0 (private) |
| Future flexibility | Low — adding a new field requires a new migration |
| Owner UX | Same from user perspective |

**Risk:** Migration proliferation. SQLite does not support `ADD COLUMN IF NOT EXISTS`, so column additions on existing DBs require careful idempotency handling (as seen in migration 0005).

---

## G. Recommended Backend Model for D-209B

**Recommended: Option 1 — JSON consent map (`visibility_json` on `belief_snapshots`).**

Rationale:
- One migration (`ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT`) — low risk, matches the pattern already used for `dimensions_json`, `top_beliefs_json`, etc.
- Response-shaping layer already exists in `getPublicProfile` — the whitelist check can be added there without a JOIN.
- Absence of the column (existing rows) defaults to `null`, which the shaping layer treats as all-private. This is the safe default.
- Future field groups can be added to the JSON object without a schema migration.

**Required enforcement rule:** `getPublicProfile` must parse `visibility_json` and build the response object field-by-field against an explicit whitelist. Fields not present in `visibility_json` with value `true` must be omitted from the response — not returned with a fallback value.

**The response-shaping layer is the consent gate.** No raw snapshot data should pass through unchecked.

---

## H. API Response Rules

### Current rules (post D-208B)

`getPublicProfile` SELECT:
```sql
SELECT label, stability_score, openness_score, pressure_score, contradiction_count, created_at
FROM belief_snapshots
WHERE user_id=? AND public_summary_enabled=1 AND hidden_at IS NULL LIMIT 1
```

Response object is shaped explicitly — only named fields are included. This is correct.

### Future rules (with consent model)

1. **Whitelist enforcement at SELECT:** Only columns that could ever be returned publicly should be selected. `dominant_pattern`, `top_beliefs_json`, `raw_json`, `dimensions_json`, `contradictions_json`, `stress_points_json` must never appear in the `getPublicProfile` SELECT regardless of consent state.

2. **Whitelist enforcement at response shaping:** Even after SELECT, each field must be gated by the corresponding `visibility_json` flag. If `visibility_json.scores !== true`, `stabilityScore`, `opennessScore`, and `pressureScore` must be omitted from the response object entirely (not returned as 0 or null).

3. **Never return raw snapshot blob publicly.** The `raw_json` field must never appear in any public API response, even as a debug field.

4. **Private API may return full owner data.** `/api/my-humanx` returns all fields to the authenticated owner — this is correct and must not be changed.

5. **Public render must tolerate missing fields.** `renderPublicProfileSnapshotHtml(s)` must render gracefully when any optional field is absent. This is already true for the current implementation.

6. **Scores require `visibility_json.scores === true`.** The current implementation returns scores in the API response but does not render them in the public card. This is inconsistent. Either: (a) add `visibility_scores` to the consent gate and only return scores when opted in, or (b) stop selecting scores until the consent model is live. Option (a) is cleaner.

---

## I. Dangerous Mistakes

The following mistakes must be prevented by code review, smoke tests, and the response-shaping whitelist:

| Mistake | Risk | Prevention |
|---------|------|-----------|
| Reusing `/api/my-humanx` data in public renderer | Private fields exposed to unauthenticated visitors | `renderPublicProfileHtml` must only use `p.sharedSnapshot` from the public API response, never `meData` |
| Returning raw DB rows publicly | Unintentional full snapshot disclosure | `getPublicProfile` must always shape response explicitly — no `SELECT *` on belief_snapshots in any public path |
| Treating `public_summary_enabled=1` as consent for all fields | Shares belief identity labels user never approved | `public_summary_enabled` is snapshot selection only — not per-field consent |
| Showing ideology labels through extracted helper fields | Named alignment leaks via `topAlignmentName` extraction | Do not extract `topAlignmentName` in any public path — only in private owner preview (and even there, only when consent exists) |
| Public profile fallback inferring hidden fields | Hidden → null fallback reveals presence | Response object must omit absent fields entirely, not return `null` or `0` |
| Making consent irreversible or unclear | Owner cannot understand or undo what is public | Revoke must be single-click; UI must show exact public render before publishing |
| Adding `meBeliefReflectionHtml` to public render path | Private investigation habits exposed | Smoke test `D-208D: public profile render does not include meBeliefReflectionHtml` guards this |
| Owner preview showing more than actual public card | Owner believes fields are public when they are not | `meSharedSnapshotCardHtml` must be aligned with `renderPublicProfileSnapshotHtml` — **current live gap** |
| Extending `dimensions_json` public exposure | TRIB/FUSE/PAIN/RIGD scores reveal sensitive belief dimensions | `dimensions_json` must never appear in the `getPublicProfile` SELECT |
| Adding a "share all" bulk toggle | No per-field consent; batch identity disclosure | Must not be implemented — each field group requires its own toggle |

---

## J. Recommended D-209B Scope

### What D-209B should be

**Small code patch — owner preview alignment + UI copy.**

Specifically:
1. Fix `meSharedSnapshotCardHtml` to match the actual public card render — the owner preview should show exactly what the public sees, not the private data. This means: show only label, contradiction count, date, and two disclaimer paragraphs — the same as `renderPublicProfileSnapshotHtml`.
2. Update the Belief Snapshots sharing helper text to say explicitly what is and is not shared: *"Sharing a snapshot makes your label, tension count, and date visible. Belief pattern labels and scores remain private."*
3. Add smoke tests confirming the owner preview and public card render the same set of fields.

### What D-209B should NOT do

- Add `visibility_json` migration — that is D-209C (after UI spec is confirmed).
- Add per-field toggles to the sharing UI — that is D-209D (after migration is live).
- Expose any new public belief field — premature without the consent UI.
- Change `getPublicProfile` SELECT — already safe after D-208B.

### Why not migrate now

The migration (Option 1) is low-risk, but implementing it without the consent UI means the `visibility_json` column would always be null on all rows, and `getPublicProfile` would ignore it. There is no user-facing benefit until the toggle UI exists. Migrating first and shipping UI second risks a window where the column exists but consent state is undefined. Better to ship the UI and migration together in D-209C.

### Rationale for the "small patch first" approach

The current public profile is **already safe** — scores are in the API response but not rendered; identity labels are excluded. The one live problem is the owner preview showing fields that are not actually public, which could confuse the owner. That is a one-function fix. The full consent model (toggles, migration, new public fields) requires more design surface and should not be rushed.

---

## Risk Summary

| Area | Current risk level | Notes |
|------|-------------------|-------|
| Public profile — identity labels | **Low** | Removed in D-208B; smoke tests guard |
| Public profile — score meters | **Low-medium** | Scores in API response but not rendered; minor information leak via wire |
| Owner preview accuracy | **Medium** | Owner sees dominantPattern/scores/topAlignment in preview; public does not — misleading |
| Private reflection cards | **Low** | Private-only; smoke test guards public surface exclusion |
| `dimensions_json` public exposure | **Low** | Never selected in public path |
| `raw_json` public exposure | **Low** | Never selected in public path |
| Consent model completeness | **Medium** | No per-field consent exists; sharing is all-or-nothing at the snapshot level |
| Migration readiness for full consent | **Ready** | Option 1 (visibility_json) is low-risk when ready |

---

## Roadmap

| Task | Scope | Status |
|------|-------|--------|
| D-208A — Belief Engine audit | Docs | ✓ Complete |
| D-208B — Privacy patch | Code | ✓ Complete |
| D-208C — Privacy closeout | Docs | ✓ Complete |
| D-208D — Private reflection cards | Code | ✓ Complete |
| D-208E — Reflection closeout | Docs | ✓ Complete |
| **D-209A — Consent model audit** | **Docs** | **This document** |
| D-209B — Owner preview alignment + sharing UI copy | Small code patch | Next |
| D-209C — Consent migration (`visibility_json`) + toggle UI | Code + migration | After D-209B confirmed |
| D-209D — Public belief field opt-in (scores first, identity later) | Code | After D-209C |
| D-209E — Public belief consent closeout | Docs | After D-209D |
