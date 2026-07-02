# D-282A — Saved Analysis to Truth Boundary Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3317 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-282A:** `308ce0a`
**Files changed:** `docs/D282A_SAVED_ANALYSIS_TO_TRUTH_BOUNDARY_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-281 saved-analysis / private Truth-boundary copy arc. Establishes a clean checkpoint so future work starts from the correct live baseline with all D-281 guarantees recorded.

---

## D-281 Mini-Arc Summary

### D-281A — Saved Analysis to Truth Boundary Audit

**Type:** Docs only. No code change. No deploy.

Full audit of the boundary between saved AI analysis and public Truth creation/review. 16 audit questions answered.

**Conclusion:** The boundary is **structurally sound**. `saveAnalysisResult()` posts only to `/api/analysis`. Saving analysis does not create, submit, approve, or publish a Truth. Review/moderation, public profile, and Truth creation paths are all structurally separate.

**Findings:**

| Finding | Severity | Description | Resolution |
|---------|----------|-------------|------------|
| F-1 | MEDIUM | No-auto-publish copy absent from Study view Analysis panel entry point — only in RunPack panel | Fixed in D-281B |
| F-2 | LOW | `analysisItem()` card lacked explicit "private" label | Fixed in D-281B |

### D-281B — Saved Analysis Private / No-Auto-Publish Copy Polish

**Type:** Frontend only (`public/app-v10.js`). No backend/CSS/index/worker/schema/migration changes.

**Implemented:** D-281A findings F-1 and F-2.

Two copy-only additions using existing `ev-origin-note` class:

**In `sectionAnalyses()` (Study view Analysis form):**
```
Saving analysis does not publish a truth automatically — it only stores private analysis for this claim.
```

**In `analysisItem()` (saved analysis card):**
```
Private analysis note — not public truth.
```

**Tests:** +19 (D-281B block). Baseline 3298 → 3317.

### D-281C — Live Closeout

**Type:** Docs only.

Owner deploy PASS. 25/25 live sanity PASS. Deployed Worker version: not captured.

---

## D-281 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| `saveAnalysisResult()` route | Posts only to `/api/analysis` |
| Saving analysis creates/submits/approves/publishes a Truth | No |
| `sectionAnalyses()` no-auto-publish copy | `Saving analysis does not publish a truth automatically — it only stores private analysis for this claim.` |
| `analysisItem()` private note | `Private analysis note — not public truth.` |
| Existing `analysisItem()` disclaimer | `AI analysis of supplied HumanX packet — not independent verification.` (preserved) |
| `saveAnalysisResult()` JSON.parse validation | Unchanged |
| `saveAnalysisResult()` field extraction | `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` (unchanged) |
| Saved-analysis provenance | `Saved from RunPack: rp_...` (conditional on `a.packetId`) |
| Public profile exposure of private/no-auto-publish copy | None |
| Public profile exposure of `Saved from RunPack` | None |
| Public profile exposure of `packetId` | None |
| Review/moderation | Unchanged |
| Truth creation paths | Unchanged |

---

## D-271/D-272 AI-Return Import Locks (Preserved)

| Item | State |
|------|-------|
| `rp-return-section` auto-expands when `lastPacket&&lastPacketClaimId===selected?.id` | Preserved |
| `Load AI Analysis Return` title | Preserved |
| `rp-return-next-step` copy: `Saving does not publish a truth automatically` | Preserved |
| `saveAnalysisResult()` JSON.parse validation | Preserved |
| `saveAnalysisResult()` field extraction | Preserved |
| `saveAnalysisResult()` posts only to `/api/analysis` | Preserved |

---

## D-274/D-279 Stale Detection Locks (Preserved)

| Item | State |
|------|-------|
| `detectPacketStaleness()` checks `meta.source_snapshot_hash` | Preserved |
| Compared against `simpleClaimHash(selected)` | Preserved |
| Returns `claim updated since packet` | Preserved |
| Stale threshold `3600000ms` | Preserved |
| Generated-time stale warning | Preserved |
| Evidence/test count stale checks | Preserved |

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

## No Changes in D-281

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

## Static Checks (Post D-281C)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3317 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-281A | No | Audit / docs only |
| D-281B | Yes | Owner deploy PASS (D-281C, 2026-07-02) |
| D-281C | No (closeout) | Live closeout only |
| D-282A | No | Docs only |

**Deployed Worker version (D-281C):** not captured

---

## Saved Analysis / Truth Arc Completion State

| Feature | Status |
|---------|--------|
| F-3 AI-return import visibility | **COMPLETE** — D-271A/B; D-272A lock |
| F-4 Snapshot-hash stale detection | **COMPLETE** — D-274B; live in `detectPacketStaleness()` |
| F-5 Packet-ID storage | **COMPLETE** — D-275D; `analysis_results.packet_id` live |
| Saved analysis provenance visibility | **COMPLETE** — D-277B/C; `Saved from RunPack: rp_...` |
| Stale warning wording polish | **COMPLETE** — D-279B/C; `claim updated since packet` live |
| Saved analysis ↔ Truth boundary copy | **COMPLETE** — D-281B/C; explicit no-auto-publish + private-note copy live |

Next public Truth workflow work should be audit-first.
