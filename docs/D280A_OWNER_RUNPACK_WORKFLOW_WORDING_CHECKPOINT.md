# D-280A — Owner RunPack Workflow Wording Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3298 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-280A:** `9bd22a1`
**Files changed:** `docs/D280A_OWNER_RUNPACK_WORKFLOW_WORDING_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-279 owner RunPack workflow continuity / wording mini-arc. Establishes a clean checkpoint so future work starts from the correct live baseline with all D-279 guarantees recorded.

---

## D-279 Mini-Arc Summary

### D-279A — Owner RunPack Workflow Continuity Audit

**Type:** Docs only. No code change. No deploy.

Full audit of the owner-side RunPack workflow: claim selection → packet generation → AI analysis → AI-return import → save analysis → view provenance. 15 audit questions answered. Workflow found logically complete with no structural gap.

**Findings:**

| Finding | Severity | Description | Resolution |
|---------|----------|-------------|------------|
| F-1 | LOW | `rp_*` underscore format in UI noted | Not a bug — format is informational |
| F-2 | MEDIUM | `source snapshot changed` is internal storage language | Fixed in D-279B |
| F-3 | LOW | No provenance line when `packetId` absent | Correct behavior — no fix needed |
| F-4 | INFO | Stale threshold `3600000ms` not user-visible | Informational — no fix needed |

### D-279B — RunPack Stale Warning Wording Polish

**Type:** Frontend only (`public/app-v10.js`). No backend/CSS/index/worker/schema/migration changes.

**Implemented:** D-279A finding F-2.

One string change in `detectPacketStaleness()`:

| | Value |
|-|-------|
| **Old string** | `source snapshot changed` |
| **New string** | `claim updated since packet` |

Detection logic unchanged:
```javascript
if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('claim updated since packet');
```

**Tests:** +10 (3 existing assertion strings updated in D-274B/D-275B/D-277B blocks; 10 new D-279B block tests). Baseline 3288 → 3298.

### D-279C — Live Closeout

**Type:** Docs only.

Owner deploy PASS. 21/21 live sanity PASS. Deployed Worker version: not captured.

---

## D-279 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| `detectPacketStaleness()` hash field checked | `meta.source_snapshot_hash` |
| Hash compared against | `simpleClaimHash(selected)` |
| Guard for old packets | `meta.source_snapshot_hash != null` |
| User-facing warning copy (D-279B) | `claim updated since packet` |
| Old copy removed from UI | `source snapshot changed` |
| Stale threshold | `3600000ms` (1h) |
| Generated-time stale warning | Preserved |
| Evidence count stale check | Preserved |
| Test count stale check | Preserved |
| Pressure count stale check | Preserved |
| `rp-status-warn` chip styling | Unchanged |
| Status hint copy | `Rebuild the packet to capture the latest evidence and pressure.` |

---

## D-271/D-272 AI-Return Import Locks (Preserved)

| Item | State |
|------|-------|
| `rp-return-section` auto-expands when `lastPacket&&lastPacketClaimId===selected?.id` | Preserved |
| `Load AI Analysis Return` title | Preserved |
| `rp-return-next-step` copy: `Saving does not publish a truth automatically` | Preserved |
| `saveAnalysisResult()` JSON.parse validation | Preserved |
| `saveAnalysisResult()` field extraction: `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` | Preserved |
| `saveAnalysisResult()` posts only to `/api/analysis` | Preserved |
| No auto-publish guidance | Preserved |

---

## D-275 Packet-ID Storage Locks (Preserved)

| Item | State |
|------|-------|
| `analysis_results.packet_id TEXT` live | Preserved |
| `/api/analysis` accepts optional `packet_id` | Preserved |
| Backend sanitizer: `cleanText(..., 80)` not `cleanId()` | Preserved |
| `rp_*` underscore format preserved | Preserved |
| `saveAnalysisResult()` sends `packet_id` from `lastPacket` | Preserved |
| Frontend gate: `lastPacketClaimId===selected?.id` | Preserved |
| Packet ID source: loaded RunPack, not AI return JSON | Preserved |
| Missing `packet_id` allowed (nullable) | Preserved |

---

## D-277 Saved-Analysis Provenance Locks (Preserved)

| Item | State |
|------|-------|
| Owner/private view shows provenance line when `a.packetId` exists | Preserved |
| Provenance line class: `small ev-origin-note` | Preserved |
| Packet ID escaped: `esc(a.packetId)` | Preserved |
| No provenance line when `a.packetId` absent | Preserved |
| Public profile does not expose `Saved from RunPack` | Preserved |
| Public profile does not expose `packetId` | Preserved |

---

## No Changes in D-279

| Area | Status |
|------|--------|
| `src/worker.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| Backend/API/schema/storage | No changes |
| Review/moderation | Unchanged |
| Public profile `/u/:slug` | Unaffected |
| Public truth behavior | Unchanged |
| Drift/Belief expansion | Unaffected |

---

## Static Checks (Post D-279C)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3298 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-279A | No | Audit / docs only |
| D-279B | Yes | Owner deploy PASS (D-279C, 2026-07-02) |
| D-279C | No (closeout) | Live closeout only |
| D-280A | No | Docs only |

**Deployed Worker version (D-279C):** not captured

---

## RunPack Arc Completion State

| Feature | Status |
|---------|--------|
| F-3 AI-return import visibility | **COMPLETE** — D-271A/B; D-272A lock |
| F-4 Snapshot-hash stale detection | **COMPLETE** — D-274B; live in `detectPacketStaleness()` |
| F-5 Packet-ID storage | **COMPLETE** — D-275D; `analysis_results.packet_id` live; Worker `759acc15` |
| Saved analysis provenance visibility | **COMPLETE** — D-277B/C; `analysisItem()` renders `Saved from RunPack: rp_...` |
| Stale warning wording polish | **COMPLETE** — D-279B/C; `claim updated since packet` live |

Next RunPack work should be audit-first unless clearly frontend-only and already covered by existing data.
