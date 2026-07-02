# D-276A — RunPack Provenance Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3263 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Files changed:** `docs/D276A_RUNPACK_PROVENANCE_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`
**App changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No
**HEAD before D-276A:** `bb2be33`

---

## Purpose

Close the D-274→D-275 RunPack provenance mini-arc. Record the live schema/backend/frontend baseline so future work starts from a known-good state.

---

## Mini-Arc Summary

| Task | Type | What it did |
|------|------|-------------|
| D-274A | Audit | F-4 snapshot-hash stale detection audit. Frontend-only feasible. `simpleClaimHash(selected)` vs `meta.source_snapshot_hash` comparison identified as correct approach. Docs only. Baseline unchanged: 3239/0/24/57. |
| D-274B | Implementation | Single `if` block in `detectPacketStaleness()`: `if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('source snapshot changed')`. 22 new tests + 3 prior F-4-deferred tests flipped. Baseline 3217 → 3239. |
| D-274C | Live closeout | Owner deploy PASS (2026-07-02). 24/24 live sanity PASS. Deployed Worker version not captured. |
| D-275A | Audit | F-5 packet-ID storage audit. NOT frontend-only — requires schema migration + backend handler + frontend update. Docs only. Baseline unchanged: 3239/0/24/57. |
| D-275B | Branch implementation | `migrations/0017_analysis_results_packet_id.sql`, `src/analysis-results.js`, `public/app-v10.js` line 573. 20 new tests + 3 prior slice-width fixes. Baseline 3239 → 3263. Branch `d275b-runpack-packet-id-storage`. |
| D-275C | Pre-merge review | 22-item checklist. No blocker found. Branch safe and ready. Docs only on branch. |
| D-275D | Merge + migration + deploy | Branch merged to main (`--ff-only`). D1 migration applied live. Owner deploy PASS (2026-07-02). 22/22 live sanity PASS. Deployed Worker version: `759acc15-a6dd-4e50-a070-0d3356e5c257`. |

**Tests added in arc:** 22 (D-274B) + 20 (D-275B) + 3 (slice-width fixes, wash) = **42 meaningful new tests** (3217 → 3263 total).
**Deploys in arc:** 2 (D-274C, D-275D).
**Schema migrations applied in arc:** 1 (`0017_analysis_results_packet_id.sql`).
**Audit/review/checkpoint tasks:** D-274A, D-275A, D-275C, D-276A — no deploy needed.

---

## Live Schema State After Arc

| Table | Column | Type | Applied | Notes |
|-------|--------|------|---------|-------|
| `analysis_results` | `packet_id` | `TEXT` (nullable) | D-275D, 2026-07-02 | Links saved AI analysis to originating RunPack. NULL for historical rows. |

**D1 database:** `humanx`
**D1 database ID:** `f68709d8-b93a-4e5b-8a0e-5b58cc357125`
**Migration file:** `migrations/0017_analysis_results_packet_id.sql`
**Apply result:** PASS — 2 commands in 0.71ms

---

## F-4 Snapshot-Hash Stale Detection Behavior (COMPLETE, D-274B)

| Check | Behavior |
|-------|---------|
| `source_snapshot_hash` guard | `if(meta.source_snapshot_hash!=null)` — no false positives on old packets without the field |
| Hash comparison | `simpleClaimHash(selected) !== meta.source_snapshot_hash` |
| Stale reason emitted | `'source snapshot changed'` pushed to `w[]` |
| For fallback packets | Exact comparison (same algorithm used at generation and comparison) |
| For backend packets | Coarser comparison — misses content edits that don't change counts (known, acceptable limitation from D-274A) |
| Existing count-based checks | Unchanged — evidence_count, pressure_count, test_count |
| Age-based stale check | Unchanged — `> 3600000ms` |
| Stale threshold | `3600000` (1h) — unchanged |
| Generated-time row | Unchanged — `rp-summary-generated`, `rpRelativeTime()` (D-268B) |

---

## F-5 Packet-ID Storage Behavior (COMPLETE, D-275B/C/D)

| Item | Behavior |
|------|---------|
| Schema | `analysis_results.packet_id TEXT` — nullable, additive |
| Historical rows | `packet_id = NULL` — no data loss |
| Backend accepts `packet_id` | `addAnalysisResult()` reads `body.packet_id` |
| Sanitizer | `cleanText(body.packet_id \|\| '', 80) \|\| null` — NOT `cleanId()` |
| Underscore preservation | `rp_*` format preserved — `cleanId` avoided |
| INSERT | `packet_id` column + `packetId` bind arg (15th of 15) |
| `mapAnalysis()` return | `packetId: a.packet_id \|\| null` |
| Missing `packet_id` | Falls back to `null` — existing saves unaffected |
| Frontend source | `JSON.parse(lastPacket).packet_id` — from session packet, NOT from AI return JSON |
| Frontend gate | `lastPacket && lastPacketClaimId === selected?.id` — prevents stale cross-claim ID |
| POST body | `{claimId, source, raw, packet_id: _rppid}` |
| `packet_id` in `GET /api/claims/:id` | Present in `analyses` array — non-sensitive, not a blocker |
| Public profile exposure | None — `loadPublicProfileSummary` never calls `listAnalysisForClaim` |
| Advisory mismatch toast | Unchanged — still non-blocking |

---

## AI-Return Import Visibility Locks (D-271/D-272, unchanged)

| Lock | Status |
|------|--------|
| `rp-return-section` auto-expand condition | `lastPacket&&lastPacketClaimId===selected?.id` — unchanged |
| `Load AI Analysis Return` title | Present — unchanged |
| `rp-return-next-step` copy | Present — unchanged |
| No-auto-publish copy | `Saving does not publish a truth automatically` — unchanged |
| `JSON.parse(text)` validation | Unchanged |
| `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` field extraction | Unchanged |
| Success toast | `Analysis saved — verdict shown in the Analysis section.` — unchanged |
| Failure toast | `Paste valid JSON first` — unchanged |
| POST target | `/api/analysis` only — unchanged |
| Public profile | All AI-return import controls absent from `renderPublicProfileHtml` |

---

## Unaffected Areas Confirmed

| Area | Status |
|------|--------|
| Public profile `/u/:slug` | Unaffected — `loadPublicProfileSummary` uses count queries only |
| Public truth behavior | Unchanged — analysis save does not change `review_state` |
| Review/moderation | Unchanged — `requestApproveReview`, `requestRejectReview`, etc. all unchanged |
| Drift/Belief expansion | Unchanged — `belief-drift-expansion.js` not touched |
| CSP / external assets | No changes |
| `src/worker.js` | Not modified in D-274/D-275 arc |
| `public/styles.css` | Not modified in D-274/D-275 arc |
| `public/index.html` | Not modified in D-274/D-275 arc |

---

## Privacy / Public Boundary State (additions from this arc)

| Surface | State | Locked by |
|---------|-------|-----------|
| RunPack provenance internals in public profile | **Blocked** — `detectPacketStaleness`, `simpleClaimHash`, `saveAnalysisResult`, and all AI-return/packet-ID controls absent from `renderPublicProfileHtml` | D-275B tests 12–15 |
| `analysis_results.packet_id` on public profile | **Not exposed** — `loadPublicProfileSummary` never calls `listAnalysisForClaim`; field appears only in authenticated `GET /api/claims/:id` response | D-275B test 12 |
| F-4/F-5 provenance internals | **No new public fields** — `source_snapshot_hash` comparison is frontend-only session state; `packet_id` is stored but not surfaced on public profile | D-274B, D-275B |

---

## Deployment State (D-274→D-275 arc)

| Task | State |
|------|-------|
| D-274A | Audit — no deploy needed |
| D-274B | Owner deploy PASS — D-274C confirmed live (24/24) · deployed Worker version not captured |
| D-274C | Live closeout — no deploy needed (closeout of D-274B deploy) |
| D-275A | Audit — no deploy needed |
| D-275B | Branch only — no deploy (pre-merge) |
| D-275C | Pre-merge review — no deploy |
| D-275D | Owner deploy PASS — 22/22 live sanity PASS · D1 migration applied · deployed Worker: `759acc15-a6dd-4e50-a070-0d3356e5c257` |
| D-276A (this task) | Docs only — **no deploy needed** |
| **Current deploy needed** | **No** |
| **Latest deployed Worker** | `759acc15-a6dd-4e50-a070-0d3356e5c257` (D-275D, 2026-07-02) |
