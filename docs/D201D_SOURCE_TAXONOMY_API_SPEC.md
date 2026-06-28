# D-201D — Source Taxonomy Enum + API Adoption Spec

**Date:** 2026-06-28
**HEAD at creation:** `f731ad9`
**Baseline:** 1599/24/57
**Scope:** Spec only — no code changes in this patch
**Migration status:** `0015_evidence_source_taxonomy.sql` created, NOT applied

---

## 1. Canonical Enums

### `SOURCE_TYPES`

These are the only valid values for `evidence.source_type`.

```js
const SOURCE_TYPES = new Set([
  'empirical_study',     // Experiment, measurement, dataset, replication
  'expert_analysis',     // Peer review, professional report, technical assessment
  'news_report',         // Journalism, official press release, documentary
  'personal_experience', // First-hand account, memory, self-observation
  'eyewitness',          // Direct observation of a specific external event
  'argument_opinion',    // Reasoning, inference, editorial, position without data
  'scripture_tradition', // Religious text, doctrinal statement, canonical teaching
  'myth_folklore',       // Non-literal narrative, fable, cultural story
  'fiction_story',       // Invented narrative presented as illustrative
  'social_media',        // Unverified online content (post, thread, screenshot)
  'unknown',             // Source not stated, untraceable, or submitter unsure
]);
```

Default if not submitted or null: `'unknown'`

### `EVIDENCE_STRENGTHS`

These are the only valid values for `evidence.evidence_strength`.

```js
const EVIDENCE_STRENGTHS = new Set([
  'strong',    // High confidence; independently verifiable; replicable
  'moderate',  // Reasonable confidence; corroborated but not definitive
  'weak',      // Low confidence; anecdotal; contested; single source
  'disputed',  // Known to be contested; conflicting sources exist
  'unknown',   // Submitter does not know how to assess it
]);
```

Default if not submitted or null: `'unknown'`

**Important:** `evidence_strength` is self-reported by the submitter. It does not affect `evidence_score` or `recalcClaimScore()`. The automated scoring algorithm must remain independent of source taxonomy.

---

## 2. Default and Fallback Behaviour

| Field | Missing in request body | NULL in DB | Display fallback |
|-------|------------------------|-----------|-----------------|
| `source_type` | Server defaults to `'unknown'` | Render as `'unknown'` | `evidenceQualityLabel(quality)` badge shown alongside, not instead |
| `evidence_strength` | Server defaults to `'unknown'` | No strength badge shown | Do NOT infer strength from legacy `quality` and write it to DB |

**Critical rule:** Do not backfill `evidence_strength` by inferring from `quality`. The D-201B audit showed the `evidenceQualityClass()` mapping (`repeatable → strong`, `testimony → mid`, `vibes → weak`) encodes an unstated assumption. If we write that inferred value into `evidence_strength`, we corrupt the data with a bias we never disclosed to the user. Inference is for display only, never for storage.

---

## 3. Request Shape for Evidence Submission

Current request body accepted by `POST /api/evidence`:

```json
{
  "claimId": "clm_...",
  "title": "...",
  "body": "...",
  "quality": "documented",
  "sourceUrl": "https://...",
  "stance": "support"
}
```

Proposed new shape (backward-compatible — all new fields optional):

```json
{
  "claimId": "clm_...",
  "title": "...",
  "body": "...",
  "quality": "documented",
  "sourceType": "news_report",
  "evidenceStrength": "moderate",
  "sourceUrl": "https://...",
  "stance": "support"
}
```

- `quality` remains accepted and written to DB as-is (legacy compat)
- `sourceType` is optional; if absent, server writes `'unknown'` to `source_type`
- `evidenceStrength` is optional; if absent, server writes `'unknown'` to `evidence_strength`
- Old clients that do not send `sourceType` / `evidenceStrength` continue working without change

---

## 4. Response Shape

The `evidence` object in all API responses currently includes `quality`. The new fields are added additively:

```json
{
  "id": "evd_...",
  "claim_id": "clm_...",
  "title": "...",
  "body": "...",
  "quality": "documented",
  "source_type": "news_report",
  "evidence_strength": "moderate",
  "source_url": "https://...",
  "stance": "support",
  "review_state": "review",
  "created_at": 1234567890
}
```

**camelCase aliases:** The frontend uses both snake_case (from DB rows) and camelCase (from mapped responses). For consistency with existing patterns:

```json
{
  "sourceType": "news_report",
  "evidenceStrength": "moderate"
}
```

Both must be present in mapped responses where `quality` is already included. Raw DB rows (used in `reviewDecision` return) include snake_case only.

---

## 5. Server Validation Plan

### In `addEvidence()` — `src/worker.js:799`

Add enum validation immediately after existing `BAD_EVIDENCE` check:

```js
const VALID_SOURCE_TYPES = new Set([
  'empirical_study','expert_analysis','news_report','personal_experience',
  'eyewitness','argument_opinion','scripture_tradition','myth_folklore',
  'fiction_story','social_media','unknown'
]);
const VALID_EVIDENCE_STRENGTHS = new Set(['strong','moderate','weak','disputed','unknown']);

const rawSourceType = body.sourceType || body.source_type || null;
const sourceType = rawSourceType && VALID_SOURCE_TYPES.has(rawSourceType)
  ? rawSourceType
  : 'unknown';
if (rawSourceType && !VALID_SOURCE_TYPES.has(rawSourceType)) {
  return json({ error: 'BAD_SOURCE_TYPE', allowed: [...VALID_SOURCE_TYPES] }, 400);
}

const rawStrength = body.evidenceStrength || body.evidence_strength || null;
const evidenceStrength = rawStrength && VALID_EVIDENCE_STRENGTHS.has(rawStrength)
  ? rawStrength
  : 'unknown';
if (rawStrength && !VALID_EVIDENCE_STRENGTHS.has(rawStrength)) {
  return json({ error: 'BAD_EVIDENCE_STRENGTH', allowed: [...VALID_EVIDENCE_STRENGTHS] }, 400);
}
```

**Validation rule:** if the field is absent or null → use default silently. If the field is present but not in the enum → return 400 with error code. Do not silently accept arbitrary strings.

### In `insertEvidence()` — `src/worker.js:892`

Current signature:
```js
async function insertEvidence(env, claimId, userId, stance, body, title, quality, sourceUrl, reviewState='review')
```

Extended signature:
```js
async function insertEvidence(env, claimId, userId, stance, body, title, quality, sourceUrl, reviewState='review', sourceType='unknown', evidenceStrength='unknown')
```

Current INSERT:
```sql
INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at,review_state)
VALUES (?,?,?,?,?,?,?,?,?,?)
```

Extended INSERT (after migration applied):
```sql
INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at,review_state,source_type,evidence_strength)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
```

**⚠ This INSERT change must only be deployed after `0015_evidence_source_taxonomy.sql` is applied.** If deployed before, D1 will throw `no such column: source_type` and evidence submission will break for all users.

The call site in `createClaim()` that passes `'testimony'` hardcoded will pass two new defaults:
```js
await insertEvidence(env, claimId, userId, 'support', cleanText(body.initialEvidence, 900), 'Initial evidence', 'testimony', '', 'review', 'unknown', 'unknown');
```

---

## 6. Read Query Changes

The following queries must be extended to include the new columns. All changes require migration to be applied first.

### `getClaim()` evidence SELECTs — `src/worker.js:794`

Direct evidence query adds:
```sql
e.source_type, e.evidence_strength
```

Reused evidence query adds:
```sql
e.source_type, e.evidence_strength
```

### `claimDetail()` evidence SELECTs — `src/worker.js:894`

Both direct and reused queries add `source_type, evidence_strength`.

### `reviewQueue()` evidence query — `src/worker.js:886`

```sql
SELECT ... e.source_type, e.evidence_strength ...
```

### `listEvidenceVault()` — `src/evidence-vault.js`

Add to SELECT and to the mapped row object:
```js
sourceType: row.source_type || null,
evidenceStrength: row.evidence_strength || null,
```

### My HumanX evidence query — `src/worker.js:318`

```sql
SELECT id, claim_id, title, quality AS type, source_url, source_type, evidence_strength, review_state, created_at
FROM evidence WHERE user_id=? ORDER BY created_at DESC LIMIT 20
```

### Public profile evidence query — `src/worker.js:683`

Add `source_type` to SELECT; omit `evidence_strength` (self-assessment is not public-facing).

### `claimLineage()` evidenceLinks — `src/worker.js:795`

```js
const evidenceLinks = (evidence || []).map(e => ({
  id: e.id,
  title: e.title,
  stance: e.linked_stance || e.stance || 'support',
  linkType: e.link_type || 'direct',
  quality: e.quality || '',
  sourceType: e.source_type || null,
  evidenceStrength: e.evidence_strength || null,
  sourceUrl: e.source_url || e.sourceUrl || ''
}));
```

---

## 7. RunPack Plan

`buildRunPack()` at `src/worker.js:900` spreads `detail` into the packet. Evidence rows in `detail.evidence` will automatically include `source_type` and `evidence_strength` once the read queries are updated (section 6 above).

Additionally, update the `output_contract` to include:

```js
output_contract: {
  // ...existing fields...
  source_type_note: 'source_type="scripture_tradition", "myth_folklore", or "fiction_story" records the origin tradition of a belief — not independent empirical verification that the factual claim is true. Treat these items as context for why the claim is believed, not as empirical evidence that it is correct.'
}
```

This ensures AI systems consuming the packet are explicitly instructed not to treat scripture as empirical verification.

---

## 8. Review UI Plan

When the Review queue inspector renders an evidence item, add a visible `source_type` display:

- Show `source_type` label alongside `quality` badge
- If `source_type` is `scripture_tradition`, `myth_folklore`, or `fiction_story`: show a distinct badge **"Origin / tradition"** in amber/yellow
- Moderator sees this during review so they can apply appropriate context before approval
- Do NOT auto-reject based on source type — the moderator decides
- `evidence_strength` is shown as a secondary pill: "Self-assessed: moderate" etc.

No changes to `reviewDecision()` logic — source type does not change the approve/reject flow.

---

## 9. Backward Compatibility

| Scenario | Behaviour |
|----------|-----------|
| Old client submits without `sourceType` / `evidenceStrength` | Server defaults both to `'unknown'` — no 400 error |
| Legacy DB row has `quality` set, `source_type` NULL | Display: show `quality` badge as now; no `source_type` badge rendered |
| Legacy DB row has `source_type` NULL, `evidence_strength` NULL | `?? null` fallback in all JS mapping — no crash |
| `quality` field | Kept forever; never dropped; read in display as legacy fallback |
| RunPack from pre-migration evidence | `source_type: null` in packet — AI prompts must tolerate null |

The `evidenceQualityLabel()` and `evidenceQualityClass()` functions remain unchanged. They continue to power the legacy display path for rows where `source_type` is null.

---

## 10. Implementation Sequence

### Phase A — D-201E: Backend validation + read/write

**Gate:** `0015_evidence_source_taxonomy.sql` must be applied to production D1 BEFORE deploying D-201E. Confirm with preflight from `D201C_SOURCE_TAXONOMY_MIGRATION_PREFLIGHT.md`.

1. Add `SOURCE_TYPES` and `EVIDENCE_STRENGTHS` constants to `src/worker.js`
2. Add enum validation in `addEvidence()`
3. Extend `insertEvidence()` signature and INSERT statement
4. Extend evidence SELECT queries in `getClaim()`, `claimDetail()`, `reviewQueue()`, `listEvidenceVault()`, My HumanX query, public profile query
5. Extend `claimLineage()` evidenceLinks
6. Extend `buildRunPack()` output_contract note
7. Update `worker-route-static-check.mjs` for new validation paths

**Deploy:** wrangler deploy after all the above. Smoke test baseline should remain at 1599+/0.

### Phase B — D-201F: Frontend collection UI

1. Replace `<select id="eQuality">` in `public/index.html` with two selects: `eSourceType` and `eEvidenceStrength`
2. Update `addCaseItem()` in `public/app-v10.js` to send `sourceType` and `evidenceStrength` in POST body
3. Update `evidenceCard()` to render `source_type` label and contextual note for scripture/myth/fiction
4. Update `evidenceMeta()` for Study view
5. Update `meMirrorBalanceCardHtml()` to aggregate `source_type` counts
6. Update `renderPublicProfileEvidenceHtml()` to prefer `source_type` label over `quality` where available
7. Keep `evidenceQualityLabel()` and `evidenceQualityClass()` as legacy fallbacks (do not remove)

### Phase C — D-201G: RunPack + aggregates

1. Confirm `source_type` is flowing through RunPack packet correctly
2. Add aggregate chart query (see D-201A Section E)
3. Add aggregate display in main UI

### Migration apply point

```
Migration 0015 applied
       ↓
D-201E deployed (backend reads/writes new columns)
       ↓
D-201F deployed (frontend collects + displays new fields)
       ↓
D-201G (RunPack + aggregates)
```

**Never invert steps 1 and 2.** The code must not read or write `source_type` / `evidence_strength` in production before the migration is applied.

---

## 11. Critical Warning: Column Guard Pattern

From the code audit, the main evidence queries in `getClaim()` and `claimDetail()` use raw `env.DB.prepare(...).all()` without `safeAll()` wrapping:

```js
const directEvidence = await env.DB.prepare(
  `SELECT e.id, e.claim_id, ..., e.quality, ... FROM evidence e ...`
).bind(claimId).all();
```

If `e.source_type` is added to this SELECT before the migration runs, D1 throws:
```
no such column: source_type
```

This error propagates uncaught and returns a 500. Study mode breaks for all users. This is the same failure mode that previously broke Review when a column was queried before migration.

**Two safe approaches:**

**Option A (recommended):** Apply migration first, then deploy code. Zero guard code needed. This is the standard safe sequence.

**Option B (if code must ship before migration):** Wrap new-column reads in a separate `safeAll()` call, then merge results by ID:

```js
// Separate guarded query for new columns only
const extraRows = await safeAll(
  env,
  'evidence.source_type',
  `SELECT id, source_type, evidence_strength FROM evidence WHERE claim_id=?`,
  claimId
);
const extraMap = Object.fromEntries((extraRows.results || []).map(r => [r.id, r]));

// Merge into existing evidence rows
const enriched = evidence.map(e => ({
  ...e,
  source_type: extraMap[e.id]?.source_type ?? null,
  evidence_strength: extraMap[e.id]?.evidence_strength ?? null,
}));
```

This adds one extra query per claim load and returns `null` gracefully if the column doesn't exist. Use Option A unless there is a specific reason to decouple migration from deployment.

**For INSERT:** There is no safe guard for INSERT — either the column exists or the INSERT fails. Apply migration before deploying the extended `insertEvidence()`.
