# D-30: Canonical RunPack Provenance Checkpoint

Date: 2026-06-06
Status: Docs-only checkpoint. No code changes, no D1 changes, no Wrangler, no live tests.

---

## Overview

D-30 marks the completion of the canonical RunPack provenance chain spanning three batches:
**D-24B** (frontend Phase 1), **D-28** (Worker canonical stamping), and **D-29** (frontend
de-duplication). All three are live on `main`. The provenance system is now end-to-end: every
packet built against a live backend carries a server-generated `packet_id` that survives into the
final packet JSON without being overwritten by the frontend.

---

## What was planned (D-23A)

`docs/D23_RUNPACK_PROVENANCE_PLAN.md` identified the following gaps in the v1.1 packet format:

| Gap | Status |
|-----|--------|
| No stable `packet_id` per packet | ✅ Closed — Worker generates via `makeId('rp')` (D-28) |
| No `generated_at` timestamp | ✅ Closed — Worker stamps ISO timestamp (D-28) |
| `claim_id` only inside `payload`, not top-level | ✅ Closed — `source_claim_id` at top level (D-28) |
| No snapshot hash / content fingerprint | ✅ Closed — `source_snapshot_hash` via `workerSnapshotHash` (D-28) |
| No evidence/pressure/test count snapshot | ✅ Closed — `evidence_count`, `pressure_count`, `test_count` (D-24B, confirmed D-28) |
| No stale detection | ✅ Closed — `detectPacketStaleness()` advisory chip (D-24B) |
| Frontend overwrites Worker `packet_id` | ✅ Closed — conditional merge preserves Worker provenance (D-29) |

One item from D-23A remains advisory/optional:

| Item | Status |
|------|--------|
| AI-return `packet_id` linkage — store `packet_id` alongside saved analysis in D1 | 🔵 Optional future work — not yet implemented; current advisory toast is sufficient |

---

## Provenance chain: batch-by-batch

### D-24B — Frontend provenance Phase 1 (`16fa131`)

Added module-level state `lastPacketMeta` and four helpers to `public/app-v10.js`:

| Helper | Purpose |
|--------|---------|
| `generatePacketId(claimId)` | Locally generates `rp_<last6ofId>_<base36ts>` using `Date.now()` |
| `simpleClaimHash(claim)` | 32-bit FNV-lite hash over 5 fields: `[id, updated_at, evidence.length, pressure.length, tests.length]` |
| `buildProvenanceMeta(claim)` | Assembles full provenance object from frontend state |
| `detectPacketStaleness()` | Compares stored packet counts/age vs current `selected`; returns advisory string or null |

Every non-fallback packet built from D-24B onwards carried:
`packet_id`, `runpack_version:'1.2'`, `generated_at`, `source_claim_id`, `source_snapshot_hash`,
`evidence_count`, `pressure_count`, `test_count`, `humanx_app_version:'v10'`, `is_fallback:false`.

Stale detection: `runPackSummary()` calls `detectPacketStaleness()` on render. If evidence/pressure/test
counts changed since the packet was built, or the packet is >1 hour old, a "Possibly stale" advisory
chip appears. Non-blocking.

AI-return mismatch: `saveAnalysisResult()` compares `parsed.packet_id` vs stored packet's `packet_id`.
If they differ, a non-blocking advisory toast fires. Does not block the save.

**Limitation of Phase 1:** `packet_id` was generated client-side with `Date.now()`. The Worker had no
knowledge of the `packet_id`; the `aip_packets` D1 row stored the packet JSON without it. The
frontend spread `buildProvenanceMeta` on top of `data.packet`, unconditionally overwriting whatever
the Worker returned.

---

### D-27 — Phase 2 Worker plan (docs-only, `0f8037e`)

`docs/D27_RUNPACK_PROVENANCE_PHASE2_WORKER_PLAN.md` defined the full design for Worker-side
provenance: hash algorithm, field list, `claimDetail` query enrichment, `buildRunPack` param
signature, `createAipPacket` generation logic, compatibility rules, and a PR checklist. No code
changed in D-27.

---

### D-28 — Worker canonical provenance (`be1f528`, PR #94)

Implemented the D-27 plan in `src/worker.js`. Three functions changed; one added:

**`claimDetail` (line 94)** — Evidence, pressure, and test SELECT queries now include `id` and
`created_at` (tests also include `updated_at`) so `workerSnapshotHash` has stable per-row inputs.

**`workerSnapshotHash(detail)` (line 95)** — New pure helper. Hashes 8 fields:

```
claim.id | claim.updated_at |
evidence ids (sorted) | evidence created_ats (sorted) |
pressure ids (sorted) | pressure created_ats (sorted) |
test ids (sorted)     | test updated_ats (sorted)
```

Uses the same 32-bit FNV-lite algorithm as Phase 1 (`Math.imul(31, h) + charCodeAt`). Volatile fields
(`report_count`, `review_state`, `near_duplicate_of`, display names, full text) are excluded.

**`buildRunPack(detail, provenance)` (line 95)** — Now accepts an optional `provenance` param and
spreads it at the head of the packet. Defaults to `{}` so legacy callers without provenance are
unaffected. `runpack_version` is now supplied by the caller.

**`createAipPacket` (line 86)** — Now:
1. Generates `packetId = makeId('rp')` (server-canonical, not timestamp-based)
2. Calls `workerSnapshotHash(detail)` to compute the 8-field hash
3. Builds `provenance` object:

```json
{
  "packet_id":             "rp_<uuid_prefix>",
  "runpack_version":       "1.2",
  "generated_at":          "<ISO timestamp>",
  "source_claim_id":       "<claimId>",
  "source_snapshot_hash":  "<hex>",
  "evidence_count":        3,
  "pressure_count":        1,
  "test_count":            2,
  "humanx_worker_version": "v1",
  "is_fallback":           false
}
```

4. Passes provenance to `buildRunPack(detail, provenance)`
5. Stores the complete packet JSON in `aip_packets` (packet_id lives inside `packet_json`; no schema
   migration needed)

4 new hardening smoke checks added (95 → 99): `workerSnapshotHash` defined, `buildRunPack` accepts
provenance param, `packet_id` stamped with `runpack_version:'1.2'`, `humanx_worker_version:'v1'`.

**No D1 migrations. No schema changes. No frontend changes in D-28.**

---

### D-29 — Frontend de-duplication (`1fa98e7`)

Closed the overwrite problem: `generateRunPack()` in `public/app-v10.js` was changed so that it
only merges `{humanx_app_version:'v10'}` on top of `data.packet` when the Worker has already
stamped canonical provenance (`data.packet.packet_id` truthy). When the Worker has no `packet_id`
(legacy v1.1 responses), full `buildProvenanceMeta` is applied as before.

```js
// Before D-29:
lastPacket = JSON.stringify({...data.packet, ...provenance}, null, 2);

// After D-29:
const _wp = !!(data.packet && data.packet.packet_id);
const _mp = _wp ? {humanx_app_version: 'v10'} : provenance;
lastPacket = JSON.stringify({...data.packet, ..._mp}, null, 2);
```

Three cases after D-29:

| Packet source | `packet_id` in final packet | `source_snapshot_hash` |
|--------------|----------------------------|------------------------|
| Worker v1.2 (D-28+) | Server-canonical `rp_<uuid>` | 8-field Worker hash |
| Worker legacy v1.1 | Frontend-generated `rp_<claimId>_<ts>` | 5-field frontend hash |
| Fallback (backend unreachable) | Frontend-generated `rp_<claimId>_<ts>` | 5-field frontend hash, `is_fallback:true` |

`detectPacketStaleness()` and `saveAnalysisResult()` read directly from `JSON.parse(lastPacket)` —
both work correctly with all three cases. `lastPacketMeta` is write-only (never consumed by anything)
and was not changed.

1 new hardening smoke check added (99 → 100): verifies the conditional merge guard and
`humanx_app_version:'v10'` are present in `generateRunPack`.

**No backend/D1 changes in D-29.**

---

## Current packet shape (v1.2, backend available)

```json
{
  "packet_id":             "rp_a1b2c3d4e5f6g7h8",
  "runpack_version":       "1.2",
  "generated_at":          "2026-06-06T14:32:00.000Z",
  "source_claim_id":       "clm_...",
  "source_snapshot_hash":  "3f8a1c2b",
  "evidence_count":        3,
  "pressure_count":        1,
  "test_count":            2,
  "humanx_worker_version": "v1",
  "is_fallback":           false,
  "humanx_app_version":    "v10",

  "legacy_aip_version":    "1.1",
  "aip_version":           "1.1",
  "packet_type":           "runpack_task",
  "app":                   "HumanX",
  "mode":                  "claim-pressure-analysis",
  "no_owner_api_used":     true,
  "instruction":           "...",
  "output_contract":       { ... },
  "payload":               { claim, evidence, pressure, tests, analyses }
}
```

---

## Static checks (known-good as of D-30)

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | No output, exit 0 |
| `node --check src/worker.js` | No output, exit 0 |
| `hardening-smoke-test.mjs` | **100 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed (39 hard checks)** |

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking.

---

## No D1 migrations required

The `packet_id` is stored inside `packet_json` in the existing `aip_packets` table. No new columns,
no new tables, no `ALTER TABLE`. A `packet_id` column could be added later for indexed audit queries
but is not needed now.

---

## No live tests run

All verification in D-28/D-29 was via static checks only. No live Worker deployment was verified in
this session. The live app at `humanx.rinkimirikata.com` serves the merged D-28 code via Cloudflare
Worker, but no `POST /api/runpack` was called from this session.

---

## Remaining optional future work

| Item | Priority | Notes |
|------|----------|-------|
| AI-return `packet_id` storage in D1 | Low / optional | Store `packet_id` alongside saved analysis so analysis records can be traced back to the exact packet. Requires no schema migration (stored in `raw` JSON of analysis row); needs `saveAnalysisResult` change to extract and pass it. Advisory toast already works without this. |
| D-26 manual live UI test plan | When ready | `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` covers RunPack provenance in section 8. Execute when user is ready to open a browser session. Use `HX_TEST_D26_` naming prefix. |
| `aip_packets.packet_id` indexed column | Low / optional | If audit queries against `aip_packets` by `packet_id` are ever needed, add an `ALTER TABLE aip_packets ADD COLUMN packet_id TEXT` migration at that time. Do NOT apply to production without confirming the column is absent first. |
| Live read smoke | When environment allows | `scripts/read-endpoint-smoke-test.mjs` from CI or WSL (Windows schannel blocks local run). |

---

## Safety constraints (unchanged)

- No live write smoke without explicit per-session approval.
- No production migration 0006 unless `PRAGMA table_info(claims)` confirms `near_duplicate_of` absent.
- No `wrangler d1 execute` or `wrangler deploy` without explicit instruction.
- No backend/Worker changes without branch + PR.
