# D-23A: RunPack Provenance Plan

Date: 2026-06-06
Status: Planning only. No implementation in D-23.

---

## Problem

Generated RunPack packets currently have no stable identity and no snapshot of the claim state at generation time. This means:

- An AI analysis return cannot be reliably linked back to the packet that produced it.
- There is no way to detect whether a claim's evidence changed after a packet was built, other than the frontend's same-claim-ID check.
- Two packets built for the same claim at different times are indistinguishable in the JSON.

---

## Current packet structure (v1.1)

From `generateRunPack()` — fallback path (representative of field set):

```json
{
  "runpack_version": "1.1",
  "legacy_aip_version": "1.1",
  "aip_version": "1.1",
  "packet_type": "runpack_task",
  "app": "HumanX",
  "mode": "claim-pressure-analysis",
  "no_owner_api_used": true,
  "payload": { ...selected claim object... }
}
```

Missing provenance fields:
- `packet_id` — no stable UUID per packet
- `generated_at` — no ISO timestamp at generation time
- `claim_id` — not surfaced at the top level (only inside `payload`)
- `claim_updated_at` — no record of the claim's last-modified time at generation
- `evidence_count` / `pressure_count` — no snapshot of item counts at generation time
- `packet_hash` — no content fingerprint

Current frontend stale-detection (partial):
- `lastPacketClaimId !== selected.id` → "Built for different claim" warning — **works**
- No timestamp-based staleness detection — **missing**
- No evidence-count comparison — **missing**
- `lastPacketIsFallback` flag — **works** (warns user packet is locally generated)

---

## Proposed provenance fields

Add to the top-level packet object, not inside `payload`:

```json
{
  "packet_id": "rp_<claimId_prefix>_<timestamp_ms>",
  "runpack_version": "1.2",
  "generated_at": "2026-06-06T14:32:00.000Z",
  "claim_id": "<uuid>",
  "claim_updated_at": "<ISO timestamp from claim.updated_at>",
  "evidence_count": 3,
  "pressure_count": 1,
  "test_count": 0,
  "analysis_count": 0,
  "is_fallback": false,
  ...existing fields...
}
```

### Field decisions

| Field | Where | Why |
|-------|-------|-----|
| `packet_id` | top-level | Stable identifier; embed in AI prompt so AI can echo it back in the return JSON for correlation |
| `generated_at` | top-level | Enables age-based staleness check in UI |
| `claim_id` | top-level | Already in `payload` — surfacing at top level makes it accessible without parsing payload |
| `claim_updated_at` | top-level | Snapshot of `selected.updated_at` at generation; if claim is subsequently updated, staleness is detectable |
| `evidence_count` | top-level | Snapshot; if vault reuse or new attach happens after, count mismatch detects drift |
| `is_fallback` | top-level | Explicit boolean replacing inference from `lastPacketIsFallback` |

---

## Stale packet detection improvements

Current: `lastPacketClaimId !== selected.id` (frontend JS, session-only)

Proposed additional checks (frontend, no backend required):

1. **Age check**: If `packet.generated_at` is present and packet is >1 hour old when user opens RunPack tab, show a soft "Packet is N hours old — consider rebuilding" hint.
2. **Evidence count mismatch**: If `packet.evidence_count !== selected.evidence.length` or `packet.pressure_count !== selected.pressure.length`, show "Evidence changed since packet was built — rebuild recommended."
3. **Claim updated_at mismatch**: If `packet.claim_updated_at !== selected.updated_at`, show "Claim was updated after this packet was built."

All checks are advisory — no blocking. User can always copy/download an older packet.

---

## AI return linkage

Currently: AI returns are pasted into a textarea and saved as a structured analysis. There is no packet_id in the saved analysis record.

Proposed:
- Include `packet_id` in the packet and instruct AI (in the packet's `mode` or a preamble) to echo it back in the return JSON.
- When the user pastes an AI return in `saveAnalysisResult()`, extract `packet_id` from the return JSON if present and store it alongside the analysis.
- This enables tracing: analysis record → packet_id → claim state at generation time.

No schema changes required for the extraction step — the existing `analyses` array in the claim stores whatever JSON is pasted. The `packet_id` would just be preserved inside the stored analysis object.

---

## Implementation approach

### Phase 1 — Frontend only (no backend changes, no schema changes)

- In `generateRunPack()`: add `packet_id`, `generated_at`, `claim_id`, `claim_updated_at`, `evidence_count`, `pressure_count`, `is_fallback` to the packet JSON before stringifying.
- Bump `runpack_version` to `1.2`.
- In `runPackSummary()`: add stale-detection checks using stored `lastPacket` parsed JSON vs current `selected` state.
- In `renderExport()`: surface stale hints when applicable.
- Risk: **low** — frontend-only, no API changes, no D1 changes.

### Phase 2 — Backend (requires branch + PR)

- Worker `/api/runpack` constructs the packet server-side with same provenance fields.
- `packet_id` generated server-side (`crypto.randomUUID()` or equivalent).
- `claim_updated_at` taken from D1 row at generation time.
- Risk: **medium** — requires worker change + branch + PR.

---

## Safety constraints

- Do not write `packet_id` or `generated_at` to D1 — these live in the packet JSON only.
- Do not store packets server-side in this phase.
- Do not block analysis save if `packet_id` is missing from AI return.
- Do not change existing `runpack_version: '1.1'` packets — parse defensively.
- `runpack_version` bump to `1.2` is the only schema change; it is backwards-compatible.

---

## Prerequisites before implementation

- None for Phase 1 (frontend only).
- Phase 2 requires worker branch + PR, reviewed against current worker safety rules.
