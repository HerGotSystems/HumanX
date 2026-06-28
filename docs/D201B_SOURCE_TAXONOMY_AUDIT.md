# D-201B — Evidence / Source Taxonomy Audit and Migration Plan

**Date:** 2026-06-28
**HEAD at creation:** `9faf601`
**Baseline:** 1589/24/57
**Scope:** Audit and migration plan only — no code changes in this patch

---

## A. Current Model

### The `quality` field

The `evidence` table has a single column `quality TEXT` that currently carries all source metadata.

**Values in use (from frontend enum):**

| Value | Label shown | CSS class | Implied weight |
|-------|------------|-----------|---------------|
| `repeatable` | "Repeatable / raw data" | `ev-q-strong` | Strong |
| `documented` | "Documented source" | `ev-q-strong` | Strong |
| `media` | "Photo / video / screenshot" | `ev-q-mid` | Medium |
| `testimony` | "Testimony" | `ev-q-mid` | Medium |
| `vibes` | "Vibes / weak argument" | `ev-q-weak` | Weak |
| `peer_reviewed` | "peer-reviewed" | `ev-q-neutral` | (undocumented fallback) |

Default if not submitted: `testimony` (set in `addEvidence()`: `cleanText(body.quality || 'testimony', 40)`).

The `evidenceQualityClass()` function maps these to CSS strength classes directly — `repeatable` and `documented` get `ev-q-strong`, `vibes` gets `ev-q-weak`. This means the UI renders a hidden credibility ranking using visual styling.

### Where `quality` is read and written

| Location | Usage | File |
|----------|-------|------|
| `<select id="eQuality">` | User selects at submission | `public/index.html` |
| `addCaseItem()` | Reads `eQuality.value`, sends as `quality` in POST body | `public/app-v10.js:384` |
| `addEvidence()` | Writes `cleanText(body.quality || 'testimony', 40)` to DB | `src/worker.js:799` |
| `insertEvidence()` | `INSERT INTO evidence ... quality ...` | `src/worker.js:892` |
| `evidenceCard()` | Badge display: `esc(quality)`, coloured via `qualClr` | `public/app-v10.js:176` |
| `evidenceMeta()` | Inline label in study view | `public/app-v10.js:365` |
| `evidenceQualityLabel()` | Normalises raw value to display string | `public/app-v10.js:363` |
| `evidenceQualityClass()` | Maps quality → CSS class (`ev-q-strong/mid/weak`) | `public/app-v10.js:364` |
| `meMirrorBalanceCardHtml()` | Aggregates quality counts for My HumanX mirror card | `public/app-v10.js:295` |
| `renderPublicProfileEvidenceHtml()` | Shows `evidenceQualityLabel(e.quality)` on public profile | `public/app-v10.js:256` |
| `getClaim()` SELECT | `e.quality` in direct + reused evidence queries | `src/worker.js:794` |
| `claimDetail()` SELECT | `quality` in direct + reused evidence | `src/worker.js:894` |
| `reviewQueue()` SELECT | `e.quality` included in evidence items for moderator | `src/worker.js:886` |
| `claimLineage()` | `quality` passed into `evidenceLinks` array | `src/worker.js:795` |
| `buildRunPack()` | `quality` present in `detail.evidence` rows in packet JSON | `src/worker.js:900` |
| My HumanX evidence list | `quality AS type` alias in SELECT | `src/worker.js:318` |
| Public profile evidence | `quality` in SELECT | `src/worker.js:683` |

### Where the concept leaks and confuses

**Problem 1: Source type and epistemic weight are the same field.**

`documented` is not a weight — it tells you where the evidence came from (a document), not how reliable the claim is. A tabloid article is `documented`. So is a peer-reviewed meta-analysis. They receive the same `ev-q-strong` class.

`testimony` is not a weight — a credentialed eyewitness and an anonymous blog post are both `testimony`. They receive the same `ev-q-mid` class.

**Problem 2: `evidenceQualityClass()` is a hidden credibility ranker.**

The mapping `repeatable/documented → strong`, `media/testimony → mid`, `vibes → weak` encodes an unstated assumption that documents are stronger than testimony and testimony is stronger than argument. This may sometimes be true and sometimes false, but the system never says it — it just renders a badge colour.

**Problem 3: Scripture, folklore, and other non-empirical sources have no value.**

A user who wants to cite a Bible verse as the origin of a widespread belief (e.g. "the Christian tradition holds that...") has no way to categorise this honestly. Their only options are `documented` (wrong — it's not a factual document), `testimony` (wrong — it's not personal observation), or `vibes` (wrong and disrespectful). The system either mislabels religious sources or forces users to submit them dishonestly.

**Problem 4: `quality` is free-text with a 40-char limit.**

`cleanText(body.quality || 'testimony', 40)` — any value gets written. There is no server-side enum validation. A rogue client could write anything into the quality column. This means the field is not clean enough to aggregate or chart reliably.

---

## B. Conceptual Split Proposal

The solution is to split into two separate fields with separate semantics.

### Field 1: `source_type` — what kind of source is this?

**New column:** `source_type TEXT` on the `evidence` table

This answers: "Where does this item come from?" It does not answer whether it is reliable.

| Value | Label | What it means |
|-------|-------|--------------|
| `empirical_study` | Empirical study / dataset | Experiment, measurement, replication, dataset |
| `expert_analysis` | Expert analysis | Peer review, professional report, technical assessment |
| `news_report` | News / journalism | Reporting, official press release, documentary |
| `personal_experience` | Personal experience | First-hand account, memory, observation |
| `eyewitness` | Eyewitness account | Direct observation of a specific event |
| `argument_opinion` | Argument / opinion | Reasoning, inference, editorial, position without data |
| `scripture_tradition` | Scripture / tradition | Religious text, doctrinal statement, canonical teaching |
| `myth_folklore` | Myth / folklore / story | Non-literal narrative, fable, cultural story |
| `fiction_story` | Fiction / made-up story | Invented narrative presented as illustrative |
| `social_media` | Social media post | Unverified online content |
| `unknown` | Unknown / not specified | Source not stated or untraceable |

**Enum validation rule:** server must reject any value not in this set. Default: `unknown`.

### Field 2: `evidence_strength` — how strong is this item?

**New column:** `evidence_strength TEXT` on the `evidence` table

This answers: "How confident is the submitter in this item?" It is self-assessed, not automatically computed.

| Value | Label | What it means |
|-------|-------|--------------|
| `strong` | Strong | High confidence; independently verifiable; replicable |
| `moderate` | Moderate | Reasonable confidence; corroborated but not definitive |
| `weak` | Weak | Low confidence; anecdotal; contested; single source |
| `disputed` | Disputed | Known to be contested; conflicting sources exist |
| `unknown` | Unknown | Submitter does not know how to assess it |

**Enum validation rule:** server must reject any value not in this set. Default: `unknown`.

### What happens to the existing `quality` field?

`quality` is **kept** and **not modified** in this migration. It becomes a legacy field. Existing rows retain their values. New rows get `source_type` and `evidence_strength` in addition, not instead.

The display layer can then:
- For rows with `source_type` set: display `source_type` and `evidence_strength`
- For rows without (legacy): fall back to displaying `quality` as before

This makes the migration non-destructive and reversible.

---

## C. Key Principle: Source Origin Is Not Proof

This principle must be enforced in the UI layer, not only in documentation.

**Rule:** When `source_type` is `scripture_tradition`, `myth_folklore`, or `fiction_story`, the evidence card must display a contextual note:

> *"This records where this belief comes from or what tradition holds it — not independent verification that the factual claim is true."*

This note is:
- Always visible (not collapsible)
- Part of the card render, not a tooltip
- Not a rejection or suppression of the evidence
- Not shown for other source types automatically (though `argument_opinion` could eventually get a similar softer note)

**What this does NOT do:**
- Does not prevent submission of scripture-sourced evidence
- Does not lower the visible evidence score for religious sources
- Does not mark religious sources as less valuable by default
- Does not apply any hidden weighting

---

## D. UI Implications

### Side-panel submission form (`public/index.html`)

Current:
```html
<select id="eQuality" name="eQuality">
  <option value="repeatable">Repeatable / raw data</option>
  <option value="documented">Documented source</option>
  <option value="media">Photo / video / screenshot</option>
  <option value="testimony">Testimony</option>
  <option value="vibes">Vibes / weak argument</option>
</select>
```

Proposed change (D-201C):
- Replace single `eQuality` select with two selects:
  - `id="eSourceType"` → Source type (11 options)
  - `id="eEvidenceStrength"` → Evidence strength (5 options)
- Keep `eQuality` hidden for legacy compat or remove it entirely once all reads are migrated
- `eQuality` submission continues to be sent for backward compat during transition

### Evidence cards (`evidenceCard()`)

- Replace `quality` badge with `source_type` label + `evidence_strength` pill
- Add contextual note when `source_type` is `scripture_tradition / myth_folklore / fiction_story`
- `evidenceQualityLabel()` and `evidenceQualityClass()` updated to use new fields; legacy fallback if new fields absent

### Review queue inspector

- Add `source_type` and `evidence_strength` visible to moderator alongside existing `quality`
- Moderator can see immediately if a submitted evidence item is scripture-sourced — contextual note visible during review

### RunPack packet structure

Current evidence items in packet include `quality` field. Proposed change:
- Add `source_type` and `evidence_strength` to each evidence item in packet
- Keep `quality` for backward compat with existing AI prompts
- Update `output_contract` in `buildRunPack()` to mention that `source_type = "scripture_tradition"` does not constitute empirical verification

### Aggregate chart support

Once `source_type` is a validated enum column, aggregate queries become safe:

```sql
SELECT source_type, COUNT(*) AS n
FROM evidence
WHERE COALESCE(review_state, 'public') = 'public'
GROUP BY source_type
ORDER BY n DESC;
```

This chart can show "what kinds of sources users cite" without any credibility ranking.

### Public profile display

`renderPublicProfileEvidenceHtml()` currently shows `evidenceQualityLabel(e.quality)`. Post-migration: show `source_type` label instead, or omit quality metadata from public profile entirely (less privacy exposure).

### My HumanX mirror card

`meMirrorBalanceCardHtml()` counts quality values. Post-migration: count `source_type` values instead for a more meaningful self-reflection breakdown.

---

## E. Backward Compatibility

### Legacy value mapping (for display only — no data rewrite)

| Legacy `quality` | Closest `source_type` | Closest `evidence_strength` |
|------------------|-----------------------|-----------------------------|
| `repeatable` | `empirical_study` | `strong` |
| `documented` | `news_report` (ambiguous) | `moderate` |
| `media` | `eyewitness` (ambiguous) | `moderate` |
| `testimony` | `personal_experience` | `weak` |
| `vibes` | `argument_opinion` | `weak` |

These mappings are for display inference only. They must never be written back to the database — doing so would corrupt the record of what the user actually said.

### Migration staging plan

**Stage 0 (D-201C spec):** Define exact enum values, UI labels, and server validation. No DB changes.

**Stage 1 (D-201D — schema extension):**
```sql
ALTER TABLE evidence ADD COLUMN source_type TEXT;
ALTER TABLE evidence ADD COLUMN evidence_strength TEXT;
```
D1 `ALTER TABLE ADD COLUMN` is supported. Both columns default to `NULL`. Existing rows unaffected.

**Stage 2 (D-201E — server read/write):**
- `addEvidence()` reads `body.sourceType` and `body.evidenceStrength` in addition to `body.quality`
- `insertEvidence()` writes new columns
- `getClaim()`, `claimDetail()`, `reviewQueue()` SELECT queries add `source_type, evidence_strength`
- Server validates against enum; rejects invalid values with `BAD_SOURCE_TYPE` / `BAD_EVIDENCE_STRENGTH`

**Stage 3 (D-201F — frontend):**
- Side panel form: add `eSourceType` and `eEvidenceStrength` selects
- `addCaseItem()` sends new fields in POST body
- `evidenceCard()` renders new fields; contextual note for scripture/myth/fiction
- Legacy fallback: if `source_type` null, fall back to `quality` display

**Stage 4 (D-201G — RunPack + aggregates):**
- `buildRunPack()` adds `source_type` and `evidence_strength` to evidence items
- Aggregate query endpoint (new or extended `/api/graph-status`)
- Aggregate chart UI in main app

**No destructive migration at any stage.** The `quality` column is never dropped. If the new fields are later stable and fully adopted, `quality` can be deprecated in a future patch (documented separately).

---

## F. What NOT to Do

| Thing | Why not |
|-------|---------|
| Automatic credibility ranking by source type | Embeds the system's bias invisibly; users should assess weight, not the algorithm |
| Religion blacklist / suppression | Not HumanX's role; contextual note is sufficient |
| "Science always true" assumption | `empirical_study` is self-reported; a bad study is still an `empirical_study` |
| Hidden weighting of `source_type` in evidence score | Score recalc must remain independent of source category |
| Enum values with built-in pejorative labels | "Vibes" is borderline; "nonsense" would be wrong |
| Retroactive rewrite of existing `quality` values | Corrupts user intent; break compat with existing smoke tests |
| Removing `quality` before new fields are fully adopted | Creates a window where evidence has no metadata at all |
| Making contextual note collapsible or opt-in | Users will never expand it; defeats the purpose |

---

## G. Recommended Implementation Order

1. **Schema extension (Stage 1)** — Two `ALTER TABLE ADD COLUMN` statements. Safe, additive, non-breaking. Can be run in D1 console without a wrangler deploy. No frontend change needed yet.

2. **Server read/write (Stage 2)** — `addEvidence()` and `insertEvidence()` extended. `getClaim()` and related queries extended. New rows get `source_type` and `evidence_strength`; old rows get `NULL`. Enum validation server-side.

3. **UI collection (Stage 3)** — Two new selects in the side panel. `addCaseItem()` sends both fields. Evidence card renders contextual note where applicable.

4. **Review queue display** — Moderator sees `source_type` alongside quality during review. Critical before large user volumes.

5. **RunPack export update** — Once `source_type` is stable in the DB and UI, include it in the packet JSON. Update `output_contract` to reference it.

6. **Aggregate chart support** — After enum is validated and clean in the DB, aggregate queries are safe. Chart UI added last.

7. **Belief Engine integration** — Origin Tracker module (D-201C roadmap item) can use `source_type` data from submitted evidence to show the submitter what kinds of sources they rely on. This is the final integration point.

---

## Biggest Schema Trap to Avoid

**Do not reuse the `quality` column to store `source_type` values.**

It is tempting to say "we'll just put `scripture_tradition` into `quality` for existing users." Do not do this. The reasons:

1. `quality` has no server-side enum validation — any string gets written
2. Legacy rows already have `repeatable / documented / testimony` etc. — mixing old and new values in the same column makes the field unqueryable and unrenderable without per-row type detection
3. `evidenceQualityClass()` will render `scripture_tradition` as `ev-q-neutral` (unknown fallback) — not wrong but not useful
4. Smoke tests explicitly check quality values and badge rendering — mixing schemas would fail them silently

The new `source_type` and `evidence_strength` columns are additive. The `quality` column stays as-is. That is the only safe path.
