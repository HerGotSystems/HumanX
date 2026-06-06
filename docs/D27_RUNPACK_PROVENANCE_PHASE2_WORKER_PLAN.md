# D-27: RunPack Provenance Phase 2 — Worker-Side Plan

Date: 2026-06-06
Status: Docs-only planning. No code changes, no Worker changes, no D1 changes, no Wrangler.

---

## 1. Current Phase 1 behavior (D-24B, frontend-only)

Phase 1 adds provenance stamping entirely in the frontend (`public/app-v10.js`). When the user clicks **Build RunPack**, `generateRunPack()` calls `POST /api/runpack` to get the raw packet from the Worker, then merges provenance fields on top client-side before storing in `lastPacket`.

### Frontend helpers (`app-v10.js` lines 166–170)

| Function | What it does |
|----------|-------------|
| `generatePacketId(claimId)` | Produces `rp_<last6ofId>_<base36timestamp>` — locally generated, uses `Date.now()` |
| `simpleClaimHash(claim)` | Hashes `[id, updated_at, evidence.length, pressure.length, tests.length]` using a 32-bit Knuth multiply; output is hex string |
| `buildProvenanceMeta(claim)` | Assembles the full provenance object (see fields below) |
| `detectPacketStaleness()` | Compares stored counts / age against current `selected` claim state; returns advisory string or null |

### Phase 1 provenance fields stamped by the frontend

```json
{
  "packet_id":            "rp_abc123_m5j7k9",
  "runpack_version":      "1.2",
  "generated_at":         "2026-06-06T12:00:00.000Z",
  "source_claim_id":      "clm_...",
  "source_snapshot_hash": "3f8a1c2b",
  "evidence_count":       3,
  "pressure_count":       1,
  "test_count":           2,
  "humanx_app_version":   "v10",
  "is_fallback":          false
}
```

These are merged **on top of** the Worker's `buildRunPack` response via `JSON.stringify({...data.packet, ...provenance})`.

### What the Worker currently returns from `buildRunPack` (line 95)

```json
{
  "runpack_version":     "1.1",
  "legacy_aip_version":  "1.1",
  "aip_version":         "1.1",
  "packet_type":         "runpack_task",
  "app":                 "HumanX",
  "mode":                "claim-pressure-analysis",
  "no_owner_api_used":   true,
  "instruction":         "...",
  "output_contract":     { ... },
  "payload":             { claim, evidence, pressure, tests, analyses }
}
```

The Worker sets `runpack_version: '1.1'`. The frontend overwrites this with `'1.2'` via the provenance merge.

### Stale detection (frontend-only, advisory)

`detectPacketStaleness()` fires whenever `runPackSummary()` renders. It compares the stored `evidence_count`, `pressure_count`, `test_count`, and `generated_at` age (> 1 hour threshold) against the live `selected` claim state. If counts drift or the packet is old, a "Possibly stale" chip is shown. This is non-blocking.

### AI-return mismatch toast (frontend-only, advisory)

In `saveAnalysisResult()`, if the pasted JSON contains a `packet_id` and the stored packet also has one, and they differ, a non-blocking toast is shown: `"Advisory: AI return packet_id does not match current packet"`. This is non-blocking.

### Phase 1 limitations

- `packet_id` is generated locally; the server has no knowledge of it.
- The `aip_packets` table in D1 stores a copy of the packet JSON (via `createAipPacket`), but the stored row does not include the Phase 1 `packet_id` — the INSERT happens before the frontend merges provenance on top.
- `source_snapshot_hash` is a 32-bit FNV-lite hash of only five fields; it is not collision-resistant for large evidence sets.
- There is no server-side record linking a `packet_id` to the D1 state at the moment of generation.
- Fallback packets (backend unreachable) still carry Phase 1 provenance, but `is_fallback: true`.

---

## 2. Worker-side provenance target

Phase 2 moves `packet_id` generation and snapshot hashing into the Worker (`createAipPacket` / `buildRunPack`). The goal is that the packet the Worker returns already carries a canonical `packet_id` that is persisted in D1 alongside the packet row, allowing future audit linkage between a saved analysis and the exact D1 snapshot it was based on.

### Target Worker response fields (v1.2, server-stamped)

```json
{
  "packet_id":            "rp_abc123_m5j7k9",
  "runpack_version":      "1.2",
  "generated_at":         "2026-06-06T12:00:00.000Z",
  "source_claim_id":      "clm_...",
  "source_snapshot_hash": "<hex>",
  "evidence_count":       3,
  "pressure_count":       1,
  "test_count":           2,
  "humanx_worker_version":"v1",
  "is_fallback":          false,

  "legacy_aip_version":   "1.1",
  "aip_version":          "1.1",
  "packet_type":          "runpack_task",
  "app":                  "HumanX",
  "mode":                 "claim-pressure-analysis",
  "no_owner_api_used":    true,
  "instruction":          "...",
  "output_contract":      { ... },
  "payload":              { ... }
}
```

`humanx_app_version` (frontend-stamped `'v10'`) becomes `humanx_worker_version` on the server side to distinguish the two. The frontend may still merge `humanx_app_version` on top for additional context.

---

## 3. Hash / snapshot rules

The Worker's snapshot hash must capture what changed in D1 since the last packet was built. It must be stable (same inputs → same hash on repeated calls) and not include volatile display-only fields.

### Fields to include in the hash

| Field | Source | Rationale |
|-------|--------|-----------|
| `claim.id` | `claims.id` | Unique claim identifier |
| `claim.updated_at` | `claims.updated_at` | Changes whenever the claim record is modified |
| `evidence_ids_sorted` | `evidence.id` (all rows for claim, sorted) | Adding/removing any evidence changes the set |
| `evidence_updated_ats` | `evidence.created_at` sorted (evidence has no `updated_at`) | Detects evidence replacement even when count is equal |
| `pressure_ids_sorted` | `pressure_points.id` sorted | Same rationale as evidence |
| `pressure_updated_ats` | `pressure_points.created_at` sorted | Detects pressure replacement |
| `tests_ids_sorted` | `home_tests.id` sorted | Same rationale |
| `tests_updated_ats` | `home_tests.updated_at` sorted | Detects test edits |

### Fields to explicitly exclude from the hash

| Field | Reason for exclusion |
|-------|---------------------|
| `claim.report_count` | Changes on every report; not relevant to packet content |
| `claim.review_state` | Moderation state; does not change claim substance |
| `claim.near_duplicate_of` | Advisory field; changes on Dismiss ~Similar without content change |
| `claim.duplicate_of` | Moderation field |
| `user.handle` / display names | Display-only; handle changes must not invalidate a packet |
| `evidence.body` text content | Not hashed individually — `id` + `created_at` are sufficient proxies; hashing full text would be expensive in the Worker and fragile to normalisation differences |
| `analyses` / `aip_packets` | Prior analyses do not affect the packet being built now |

### Hash algorithm

Use the same FNV-lite 32-bit approach as Phase 1 (`Math.imul(31, h) + charCodeAt`) for consistency. The input string is the concatenation of the above fields joined by `|`, with array values joined by `,`:

```
<claim.id>|<claim.updated_at>|<eid1,eid2,...>|<eua1,eua2,...>|<pid1,pid2,...>|<pua1,pua2,...>|<tid1,tid2,...>|<tua1,tua2,...>
```

All ID/timestamp arrays must be sorted before joining so the hash is stable regardless of D1 row return order.

A 32-bit hash is not cryptographically secure — it is sufficient as a staleness signal, not a security guarantee. If a stronger guarantee is needed in future, replace with `crypto.subtle.digest('SHA-256', ...)` (available in Cloudflare Workers).

---

## 4. Compatibility

### 4.1 Existing frontend-generated (Phase 1) packets

Phase 1 packets carry `runpack_version: '1.2'` stamped by the frontend. They have a `packet_id` but it is not stored in D1. After Phase 2 is deployed:

- Frontend `generateRunPack()` will receive a v1.2 Worker response and merge provenance on top. The Worker-generated `packet_id` will appear in the final packet.
- The frontend `buildProvenanceMeta` call should be updated (in a later frontend-only batch) to skip re-stamping `packet_id`, `runpack_version`, `generated_at`, and `source_snapshot_hash` if the Worker already returned them — to avoid overwriting the server-canonical values.
- Until that frontend update lands, the frontend merge will overwrite the Worker's `packet_id` with a locally generated one. This is acceptable: both are advisory-only and the stale detection still works.

### 4.2 Fallback packets (backend unreachable)

If `POST /api/runpack` fails, `generateRunPack()` catches the error and builds a local fallback packet with `is_fallback: true`. These packets will continue to carry a frontend-generated `packet_id` and will not have a D1-persisted row. The AI-return mismatch toast and stale detection both already handle `is_fallback` gracefully.

### 4.3 Legacy v1.1 packets

Packets produced before D-24B have `runpack_version: '1.1'` (set by `buildRunPack` in the Worker). They have no `packet_id`, no `source_snapshot_hash`, no `evidence_count`. After Phase 2:

- `saveAnalysisResult` already guards `if(parsed.packet_id && lastPacket)` before comparing — so it silently skips the mismatch check for v1.1 returns.
- `detectPacketStaleness` already guards `if(!meta.packet_id) return null` — so stale detection is a no-op for v1.1 packets.
- No migration of existing `aip_packets` rows is needed. Old rows remain as-is.

### 4.4 AI-return matching logic

The frontend's `saveAnalysisResult` checks `parsed.packet_id !== _pm.packet_id` to fire the mismatch advisory. After Phase 2, the `packet_id` in the current session's packet will be server-canonical and persisted in D1. The check logic does not need to change — it is already tolerant of missing or mismatched IDs.

---

## 5. Required route / code changes (implementation only — not done here)

### 5.1 `buildRunPack(detail)` — `src/worker.js` line 95

This is a pure synchronous function. To add provenance it needs access to a `packetId` and `snapshotHash`. Two options:

**Option A (recommended):** Add a `provenance` parameter:
```js
function buildRunPack(detail, provenance) {
  return {
    ...provenance,           // packet_id, runpack_version, generated_at, etc.
    legacy_aip_version: '1.1',
    ...
  };
}
```

**Option B:** Compute provenance inside `buildRunPack` and pass `claimId` + raw D1 rows. Less clean — mixing data assembly with hash computation.

### 5.2 `createAipPacket(request, env)` — `src/worker.js` line 86

Currently:
```js
async function createAipPacket(request, env) {
  const body = await readJson(request);
  const claimId = cleanId(body.claimId);
  if (!claimId) return json({ error: 'BAD_CLAIM_ID' }, 400);
  const detail = await claimDetail(env, claimId);
  if (!detail.claim) return json({ error: 'CLAIM_NOT_FOUND' }, 404);
  const packet = buildRunPack(detail);
  await env.DB.prepare(
    `INSERT INTO aip_packets (id,claim_id,packet_json,created_at) VALUES (?,?,?,?)`
  ).bind(makeId('aip'), claimId, JSON.stringify(packet), Date.now()).run();
  return json({ packet });
}
```

After Phase 2 it should:
1. Call a new `workerSnapshotHash(detail)` function to compute the hash of the current D1 state.
2. Generate a `packet_id` via `makeId('rp')` (using existing `makeId` helper, consistent with existing ID scheme).
3. Build `provenance` object: `{ packet_id, runpack_version:'1.2', generated_at, source_claim_id: claimId, source_snapshot_hash, evidence_count, pressure_count, test_count, humanx_worker_version:'v1', is_fallback:false }`.
4. Pass provenance to `buildRunPack(detail, provenance)`.
5. Persist `packet_id` alongside the packet row:
   - Either add a `packet_id` column to `aip_packets` (requires a migration) …
   - … or store `packet_id` in `packet_json` only (no migration needed; queryable via JSON extraction if ever needed).
   - **Recommended for Phase 2:** Store in `packet_json` only, avoiding a migration. A `packet_id` column can be added later if audit queries require it.

### 5.3 New helper function `workerSnapshotHash(detail)`

Pure function, no DB access (detail is already fetched):
```js
function workerSnapshotHash(detail) {
  const { claim, evidence, pressure, tests } = detail;
  const eids = (evidence || []).map(e => e.id || '').sort().join(',');
  const euas = (evidence || []).map(e => String(e.created_at || '')).sort().join(',');
  const pids = (pressure || []).map(p => p.id || '').sort().join(',');
  const puas = (pressure || []).map(p => String(p.created_at || '')).sort().join(',');
  const tids = (tests || []).map(t => t.id || '').sort().join(',');
  const tuas = (tests || []).map(t => String(t.updated_at || t.created_at || '')).sort().join(',');
  const s = [claim.id||'', String(claim.updated_at||''), eids, euas, pids, puas, tids, tuas].join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return (h >>> 0).toString(16);
}
```

Note: the current D1 `claimDetail` query for evidence does not return `evidence.id` (it SELECTs `title, body, quality, source_url, stance, link_type, linked_stance, link_note`). The `claimDetail` query must be updated to also SELECT `e.id` and `e.created_at` (for direct evidence) and `e.id`, `e.created_at` (for reused evidence via the join). This is a pure read-query change — no schema migration required.

### 5.4 `claimDetail(env, claimId)` — `src/worker.js` line 94

The two SQL queries in `claimDetail` must add `e.id, e.created_at` to the SELECT lists:

Direct evidence query — add `e.id, e.created_at`:
```sql
SELECT e.id, e.created_at, e.title, e.body, e.quality, e.source_url, e.stance,
       'direct' AS link_type, NULL AS linked_stance, NULL AS link_note
FROM evidence WHERE claim_id=?
```

Reused evidence query — add `e.id, e.created_at`:
```sql
SELECT e.id, e.created_at, e.title, e.body, e.quality, e.source_url, e.stance,
       'reused' AS link_type, l.stance AS linked_stance, l.link_note
FROM evidence_claim_links l JOIN evidence e ON e.id=l.evidence_id WHERE l.claim_id=?
```

Pressure query — add `p.id, p.created_at` (already has `created_at` ordering, but id is not SELECTed):
```sql
SELECT id, created_at, title, body, severity FROM pressure_points WHERE claim_id=? ORDER BY created_at DESC
```

Tests query — `home_tests` already has `id` and `updated_at` accessible; add them to SELECT:
```sql
SELECT id, updated_at, title, instructions, safety_level, difficulty FROM home_tests WHERE claim_id=? ORDER BY created_at DESC
```

These additions are backwards-compatible: new fields in the `detail` object do not break existing callers (`buildRunPack` spreads `detail` into `payload` — extra fields are included harmlessly).

### 5.5 Frontend update (separate frontend batch, after Phase 2 lands)

In `generateRunPack()` (`app-v10.js` line 170), update the provenance merge so that if the Worker already returned `packet_id`, `runpack_version`, `generated_at`, and `source_snapshot_hash`, the frontend does not overwrite them:

```js
// After Phase 2: Worker response already has canonical provenance
const workerHasProvenance = data.packet && data.packet.packet_id;
const provenance = workerHasProvenance
  ? { humanx_app_version: 'v10' }   // only add client-side fields
  : buildProvenanceMeta(selected);   // full fallback stamping
lastPacket = JSON.stringify({ ...data.packet, ...provenance }, null, 2);
```

This is a frontend-only change and can go direct to main. It should be done in a follow-up batch after the Phase 2 PR is merged and deployed.

---

## 6. Testing plan (for when Phase 2 is implemented)

### 6.1 Static checks (no code changes in D-27)

The following must pass before and after the Phase 2 PR is merged:

```sh
node --check src/worker.js
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs       # expect 95 passed (or higher if new checks added)
node scripts/belief-engine-static-check.mjs # expect 24 passed
node scripts/worker-route-static-check.mjs  # expect 39 passed
```

### 6.2 New hardening smoke checks to add (Phase 2 implementation batch)

Add checks in `scripts/hardening-smoke-test.mjs` for:
- `workerSnapshotHash` function definition present in `src/worker.js`
- `packet_id` present in `buildRunPack` output (verify the field flows through)
- `runpack_version:'1.2'` in Worker's `buildRunPack` (not `'1.1'`)
- `humanx_worker_version` field present in Worker output

Update self-reference assertion in `hardening-smoke-test.mjs` if new checks are added (current: 95).

### 6.3 Manual live test (post-deploy, using D-26 test plan)

After Phase 2 is deployed:
1. Build a RunPack against a `HX_TEST_D27_` claim.
2. Copy the packet JSON and confirm it contains `packet_id` with a Worker-canonical format (prefix `rp_` or similar; not starting with `rp_<claimId>_` which was the frontend format).
3. Confirm `runpack_version: '1.2'` and `generated_at` are present.
4. Confirm `source_snapshot_hash` is a hex string and changes after attaching new evidence.
5. Paste the packet into an AI and return the result to `saveAnalysisResult`. Confirm the mismatch advisory does **not** fire (because `packet_id` now matches the server-canonical value from the current packet).

### 6.4 No live write smoke in D-27

D-27 is docs-only. No live tests.

---

## 7. Branch / PR requirements

Phase 2 modifies `src/worker.js` — Worker route behavior changes. Branch + PR is mandatory.

**Suggested future branch name:**
```
feature/d27-runpack-provenance-worker
```

**PR checklist for Phase 2 implementation:**

- [ ] `workerSnapshotHash(detail)` added and unit-tested via new hardening smoke checks
- [ ] `claimDetail` queries updated to include `id` and `created_at` for evidence, pressure, tests
- [ ] `buildRunPack(detail, provenance)` updated to accept and spread provenance
- [ ] `createAipPacket` generates `packet_id`, computes hash, builds provenance, passes to `buildRunPack`
- [ ] Worker returns `runpack_version: '1.2'` (not `'1.1'`)
- [ ] `packet_id` stored in `packet_json` in the `aip_packets` D1 row
- [ ] All static checks pass: `node --check src/worker.js`, hardening smoke, belief engine, worker route
- [ ] `docs/API_ENDPOINT_INVENTORY.md` updated to note v1.2 response fields for `POST /api/runpack`
- [ ] `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` updated if relevant
- [ ] `docs/PROJECT_STATE.md` updated with Phase 2 batch row and commit
- [ ] No D1 schema migration required (packet_id stored in `packet_json` only)
- [ ] No new D1 tables or columns
- [ ] No change to authentication model (`/api/runpack` is user-authenticated via `x-humanx-user`)
- [ ] Frontend update (de-duplicate provenance stamping) filed as a separate follow-up batch

**No D1 migration needed** for Phase 2 as specified here (storing `packet_id` in `packet_json` only). If a future audit query requires indexing by `packet_id`, an `ALTER TABLE aip_packets ADD COLUMN packet_id TEXT` migration can be added at that time.

---

## Summary

| Item | Phase 1 (D-24B, done) | Phase 2 (D-27 plan, not yet implemented) |
|------|----------------------|------------------------------------------|
| `packet_id` generated by | Frontend (`Date.now().toString(36)`) | Worker (`makeId('rp')` or similar) |
| `packet_id` persisted in D1 | No | Yes (in `packet_json` column of `aip_packets`) |
| `source_snapshot_hash` | Frontend (5 fields) | Worker (8 fields including all evidence/pressure/test IDs and timestamps) |
| `runpack_version` | Frontend overwrites Worker's `'1.1'` with `'1.2'` | Worker returns `'1.2'` directly |
| `generated_at` | Frontend (`new Date().toISOString()`) | Worker (`Date.now()` converted to ISO) |
| Fallback packet | Frontend-generated, `is_fallback:true` | Unchanged — fallback path stays frontend-only |
| AI-return mismatch toast | Frontend, advisory only | Unchanged — works correctly with server-canonical `packet_id` |
| Stale detection | Frontend, advisory only | Unchanged — `detectPacketStaleness` reads counts from packet JSON |
| Static checks | 95/24/39 | Must hold at ≥ 95/24/39 after Phase 2 |
| Branch + PR required | N/A (frontend-only) | Yes — Worker route behavior change |
