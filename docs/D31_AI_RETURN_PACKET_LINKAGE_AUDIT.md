# D-31: AI-Return Packet Linkage Audit

Date: 2026-06-06
Status: Docs-only audit. No code changes, no schema changes, no migrations, no D1 commands, no Wrangler.

---

## Purpose

D-30 identified one remaining optional item from the D-23A provenance plan:

> AI-return `packet_id` linkage — store `packet_id` alongside the saved analysis in D1 so that
> analysis records can be traced back to the exact packet that produced them.

This document audits the current end-to-end RunPack flow, maps exactly where `packet_id` survives
today, identifies where linkage is still soft or advisory, and evaluates three implementation
options before recommending whether any further action is justified.

---

## 1. Current end-to-end RunPack flow

### Step 1 — Build packet (`generateRunPack`, `public/app-v10.js` line 170)

1. Frontend calls `POST /api/runpack` with `{ claimId }`.
2. Worker (`createAipPacket`, `src/worker.js` line 86):
   - Generates `packetId = makeId('rp')` (server-canonical UUID-derived ID).
   - Computes `workerSnapshotHash(detail)` — 8-field stable hash of claim + evidence/pressure/test IDs and timestamps.
   - Builds `provenance` object containing `packet_id`, `runpack_version:'1.2'`, `generated_at`, `source_claim_id`, `source_snapshot_hash`, `evidence_count`, `pressure_count`, `test_count`, `humanx_worker_version:'v1'`, `is_fallback:false`.
   - Calls `buildRunPack(detail, provenance)` — spreads provenance at top of packet.
   - Inserts full packet JSON into `aip_packets` (columns: `id`, `claim_id`, `packet_json`, `created_at`). **`packet_id` lives inside `packet_json` only — there is no dedicated `packet_id` column.**
   - Returns `{ packet }`.
3. Frontend (D-29): detects `data.packet.packet_id` is present → merges only `{ humanx_app_version:'v10' }` on top → stores in `lastPacket`. Server `packet_id` is preserved in the final packet string.

### Step 2 — Send to AI (manual, out of HumanX)

User copies `lastPacket` and pastes it into an AI tool. The packet JSON contains `packet_id`. Whether the AI echoes `packet_id` back in its output JSON depends entirely on whether the AI follows the `output_contract` — there is currently no explicit instruction in the packet to echo `packet_id`.

### Step 3 — Paste AI return (`saveAnalysisResult`, `public/app-v10.js` line 175)

```js
async function saveAnalysisResult() {
  // 1. Parse pasted text as JSON.
  // 2. Advisory mismatch check:
  if (parsed.packet_id && lastPacket) {
    const _pm = JSON.parse(lastPacket);
    if (_pm.packet_id && _pm.packet_id !== parsed.packet_id)
      toast('Advisory: AI return packet_id does not match current packet...');
  }
  // 3. Extract analysis content:
  const result = parsed.output || parsed.result || parsed.analysis || parsed;
  // 4. POST /api/analysis with { claimId, source:'runpack-user', raw: result }
}
```

Key observations:
- The mismatch check fires only if `parsed.packet_id` is present in the AI return **and** `lastPacket` is set **and** they differ. All three conditions must hold.
- The `result` sent to the backend is `parsed.output || parsed.result || parsed.analysis || parsed`. If the AI returns a top-level object that includes `packet_id` alongside the analysis fields, `result = parsed` — so `packet_id` reaches the backend **only if** the AI echoes it at the top level of its JSON and there is no `output`/`result`/`analysis` wrapper key that strips it.
- In the typical case where the AI wraps its answer in `{ "output": { verdict, evidence_score, ... } }`, `result = parsed.output` — and `packet_id` does **not** reach the backend.

### Step 4 — Store analysis (`addAnalysisResult`, `src/analysis-results.js`)

The backend receives `{ claimId, source, raw }` where `raw` is the extracted `result` object.

```
analysis_results columns:
  id, claim_id, user_id, source, verdict, evidence_score, testability,
  survivability, strongest_support_json, strongest_pressure_json,
  missing_tests_json, plain_language_summary, raw_json, created_at
```

`raw_json` stores `JSON.stringify(analysis)` — i.e. the `result` object extracted in step 3.
There is **no `packet_id` column** in `analysis_results`.

`aip_packets` columns: `id`, `claim_id`, `packet_json`, `created_at`.
There is **no `packet_id` column** in `aip_packets` either (it lives only inside `packet_json`).

---

## 2. Where `packet_id` survives today

| Location | Survives? | Notes |
|----------|-----------|-------|
| `lastPacket` (browser memory) | ✅ Yes | Lives in the stringified packet in session memory only — lost on page reload |
| `aip_packets.packet_json` (D1) | ✅ Yes | Full packet JSON is stored; `packet_id` is inside it. No indexed column; lookups require JSON text search |
| `analysis_results.raw_json` (D1) | ⚠️ Conditional | Only present if AI echoes `packet_id` at the correct nesting level in its return JSON |
| `analysis_results` dedicated column | ❌ No | No `packet_id` column exists |
| Advisory mismatch toast | ✅ Yes (ephemeral) | Fires if AI echoes `packet_id` and it mismatches; non-blocking, no persistence |

---

## 3. Where linkage is still soft / advisory only

The current system provides **session-scoped advisory linkage** — adequate for a user in a single browser session who builds and returns a packet without reloading. It does not provide **durable audit linkage** between a stored analysis record and the exact packet + D1 snapshot that produced it.

Specifically:

| Scenario | Current behavior | Gap |
|----------|-----------------|-----|
| User builds packet, immediately pastes AI return, same session | Advisory toast fires if `packet_id` mismatches; `packet_id` may survive in `raw_json` if AI echoes it at root | Soft — works in practice, not guaranteed |
| User builds packet, reloads page, pastes AI return | `lastPacket` is gone; no mismatch check fires; `packet_id` not echoed unless AI included it | `packet_id` lost from session; no linkage |
| User builds packet, shares packet with another person who pastes return | `lastPacket` is for the builder, not the paster; mismatch check does not fire | No linkage |
| Moderator queries: "which packet produced this analysis?" | No indexed path; would require scanning `aip_packets.packet_json` as text | No queryable linkage |
| Moderator queries: "what D1 state did this analysis assume?" | `aip_packets.packet_json` contains `source_snapshot_hash` but no foreign key from `analysis_results` | No direct path |

---

## 4. Three optional implementation approaches

### Approach A — Raw-JSON preservation (already partially working, no changes needed)

**What it is:** The AI return's `packet_id` is preserved inside `analysis_results.raw_json` when the AI echoes it at the root level of its output and no `output`/`result`/`analysis` wrapper key is present.

**What it requires to work reliably:** The packet's `instruction` or `output_contract` should explicitly tell the AI to include `packet_id` at the root of its return JSON. Currently neither field mentions `packet_id`. This is a single-line text change to `buildRunPack` in `src/worker.js` — a Worker change requiring branch + PR.

**Tradeoffs:**
- ✅ No schema migration
- ✅ No new columns
- ✅ `packet_id` survives in `raw_json` if AI follows instructions
- ⚠️ Linkage is inside a TEXT blob — not queryable without JSON extraction
- ⚠️ Depends on AI compliance with instructions; not guaranteed
- ⚠️ `saveAnalysisResult` currently strips the wrapper key before sending `raw` to the backend — if AI wraps in `{ "output": {...} }`, `packet_id` is lost even if present in the wrapper
- **Risk: low** — text change to instruction string only; branch + PR; no D1 change

**Status:** Partially working today. Would become reliable with a one-line instruction change and a `saveAnalysisResult` update to preserve `packet_id` even when a wrapper key is present.

---

### Approach B — Extracted `packet_id` column in `analysis_results`

**What it is:** Add a `packet_id TEXT` column to `analysis_results`. In `saveAnalysisResult`, extract `parsed.packet_id` (from the pasted return JSON) before the wrapper-key extraction step, and pass it to the backend. In `addAnalysisResult`, bind it alongside the other columns.

**Schema change required:**
```sql
ALTER TABLE analysis_results ADD COLUMN packet_id TEXT;
CREATE INDEX IF NOT EXISTS idx_analysis_results_packet_id ON analysis_results (packet_id);
```

**Tradeoffs:**
- ✅ Direct indexed lookup: given an analysis record, find its `packet_id` instantly
- ✅ Queryable: `SELECT * FROM analysis_results WHERE packet_id = ?`
- ✅ Future join: `analysis_results JOIN aip_packets ON packet_json LIKE '%"packet_id":"'||analysis_results.packet_id||'"%'` (awkward but possible without a second migration)
- ⚠️ Requires a D1 migration — `ALTER TABLE analysis_results ADD COLUMN packet_id TEXT`
- ⚠️ Column will be NULL for all existing rows and for any analysis where AI did not echo `packet_id`
- ⚠️ Still depends on AI compliance; a NULL column is uninformative and may mislead reviewers
- ⚠️ Production migration must be verified absent before applying (same risk class as migration 0005/0006)
- ⚠️ Frontend change required in `saveAnalysisResult` to extract and forward `packet_id`
- ⚠️ Backend change required in `addAnalysisResult` and `mapAnalysis`
- **Risk: medium** — three-layer change (migration + Worker + frontend); branch + PR mandatory; D1 migration cannot be rolled back in SQLite

---

### Approach C — `aip_packets.packet_id` indexed column

**What it is:** Add a `packet_id TEXT` column to `aip_packets`. In `createAipPacket`, bind `packetId` to the new column alongside the existing `id`, `claim_id`, `packet_json`, `created_at`.

**Schema change required:**
```sql
ALTER TABLE aip_packets ADD COLUMN packet_id TEXT;
CREATE INDEX IF NOT EXISTS idx_aip_packets_packet_id ON aip_packets (packet_id);
```

**Tradeoffs:**
- ✅ `aip_packets` row is directly queryable by `packet_id` — resolves "which packet produced this analysis?" if `analysis_results.packet_id` is also present (requires Approach B)
- ✅ Worker already has `packetId` in scope at the INSERT call — trivial to add the bind
- ⚠️ Alone, this approach adds queryability on the packet side but does nothing for the analysis side — still no link from analysis to packet unless Approach B is also implemented
- ⚠️ Requires a D1 migration with the same risk profile as Approach B
- ⚠️ All existing `aip_packets` rows will have NULL `packet_id` — pre-D-28 packets have no `packet_id` at all; D-28+ packets have it only inside `packet_json`
- ⚠️ Only provides value when combined with Approach B; adds migration risk for limited standalone gain
- **Risk: medium** — migration + Worker change; branch + PR mandatory

---

## 5. Tradeoff summary

| | A: raw_json instruction | B: analysis_results column | C: aip_packets column |
|---|---|---|---|
| Schema migration required | No | Yes | Yes |
| Migration rollback possible | N/A | No (SQLite) | No (SQLite) |
| Frontend change | Small (`saveAnalysisResult`) | Yes | No |
| Worker change | Small (instruction text) | Yes (`addAnalysisResult`) | Small (one bind) |
| Queryable by `packet_id` | No (text blob) | Yes | Yes (alone: limited) |
| Depends on AI compliance | Yes | Yes | No |
| NULLs for existing rows | N/A | Yes (all existing) | Yes (all existing) |
| Useful to moderator today | No | Marginal | No (alone) |
| Needed for current workflows | No | No | No |

---

## 6. Recommendation

**Keep the current advisory / raw-json model. Do not implement Approaches B or C at this time.**

Rationale:

1. **No operational need has been identified.** There are no moderator workflows, audit queries, or user-facing features that require a queryable link from an `analysis_results` row to its originating packet. The advisory toast covers the only current user scenario (same-session mismatch warning).

2. **The column would be NULL for most rows.** Approach B requires AI compliance with the `output_contract` to populate the column. Until the AI instruction explicitly asks for `packet_id` to be echoed at the root, the column will be empty for every row. A mostly-null indexed column conveys no useful information and may mislead reviewers into assuming linkage exists when it does not.

3. **Migration risk is not worth the marginal gain.** SQLite `ALTER TABLE` cannot be rolled back. A migration to `analysis_results` or `aip_packets` has the same risk profile as migrations 0005/0006 — confirmed-absent check required before applying, production cannot be recovered if the migration fails partway. The operational value of a nullable `packet_id` column on either table does not justify this risk at present.

4. **Approach A (raw-json instruction) is the right next step if linkage is ever needed.** It adds no schema risk, is trivially reversible (text change to instruction string), and makes `packet_id` survive in `raw_json` when the AI follows the contract. It should be implemented at the same time as any decision to rely on `packet_id` linkage for a real workflow — not speculatively.

5. **The current advisory system is correct for current scale.** The non-blocking mismatch toast is the right UX for a system where packet linkage is informational rather than enforcement. Users are not penalised for working across sessions or sharing packets.

---

## 7. If linkage is ever needed in future

The minimum safe implementation sequence, in order:

1. **Update `buildRunPack` instruction string** — add one sentence asking the AI to include `packet_id` verbatim at the root of its return JSON. Worker change; branch + PR; no migration.

2. **Update `saveAnalysisResult`** — before the wrapper-key extraction (`parsed.output || ...`), capture `const _returnPacketId = parsed.packet_id || null`. Send `packet_id_from_return: _returnPacketId` to the backend alongside `raw`. Frontend change; direct to main.

3. **Update `addAnalysisResult` and `mapAnalysis`** — accept and store `packet_id_from_return` as `packet_id` in a new column. Worker change; branch + PR.

4. **D1 migration** — `ALTER TABLE analysis_results ADD COLUMN packet_id TEXT` + index. Requires `PRAGMA table_info(analysis_results)` to confirm absence before running. Production apply requires explicit per-session user approval.

5. **Optional: `aip_packets.packet_id` column** — only if moderator audit queries from packet → analysis are needed. Add as a separate migration after step 4 is confirmed stable.

All five steps can be deferred indefinitely without any loss of current functionality. None of them should be implemented speculatively.

---

## 8. Static checks (unchanged by D-31)

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | No output, exit 0 |
| `node --check src/worker.js` | No output, exit 0 |
| `hardening-smoke-test.mjs` | **100 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed (39 hard checks)** |

No new checks added in D-31 (docs-only batch).
