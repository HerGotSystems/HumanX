# D-270A — RunPack Fallback Guidance / Generated-Time Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3144 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D270A_RUNPACK_FALLBACK_GUIDANCE_GENERATED_TIME_CHECKPOINT.md`
**App changes:** None (`public/app-v10.js` not touched)
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Updates the authoritative project checkpoint docs after the completed D-268 → D-269 RunPack fallback guidance + generated-time summary mini-arc. Confirms exact guarantees that are now locked by D-269A. Does not change any code.

---

## D-268A / B / C / D-269A Summary

| Task | Type | What it did |
|------|------|-------------|
| D-268A | Audit | Full Claim/RunPack flow clarity audit. 6-step flow inventory. 7 friction findings. F-2 MEDIUM (fallback missing AI guidance), F-1 MEDIUM (generated_at not shown in UI), F-3 MEDIUM (AI-return import collapsed — deferred), F-4 LOW-MEDIUM (source_snapshot_hash not in stale check — deferred), F-5 LOW (packet_id not stored — deferred). Baseline unchanged: 3075/0/24/57. |
| D-268B | Frontend + tests | Added `instruction` + `output_contract` to fallback packet. Added `rpRelativeTime()` helper. Added `rp-summary-generated` row to `runPackSummary()`. 25 new lock tests. Baseline 3075 → 3100. |
| D-268C | Live closeout | Owner deploy PASS (2026-07-01). 36/36 live sanity PASS. |
| D-269A | Regression lock | 44 new tests across 7 categories. Baseline 3100 → 3144. |
| D-270A | Checkpoint | `PROJECT_STATE.md` updated; docs only; no deploy. |

---

## Current Baseline

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3144 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deploy State

| Task | Deploy state |
|------|-------------|
| D-268A | Audit / docs only — no deploy needed |
| D-268B | Owner deploy PASS — D-268C confirmed live (36/36) |
| D-268C | Live closeout — no deploy needed |
| D-269A | Tests / docs only — no deploy needed |
| D-270A | Docs only — no deploy needed |
| **Current** | **No deploy needed** |

Latest deployed Worker version: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` (D-261C — unchanged by D-268→D-269).

---

## Fallback Packet Guidance Fields — Locked

| Field | Value / lock |
|-------|-------------|
| `instruction` present | D-269A test 1 |
| `output_contract` present | D-269A test 2 |
| Instruction tells AI to analyse claim using the packet | D-269A test 3 |
| Instruction warns: do not assume emotionally important claims are true | D-269A test 4 |
| Instruction warns: do not dismiss claims only because unpopular | D-269A test 5 |
| Instruction warns: do not claim independent verification | D-269A test 6 |
| `output_contract.verdict` | D-269A test 7 |
| `output_contract.plain_language_summary` | D-269A test 8 |
| `output_contract.evidence_score` / `.testability` / `.survivability` | D-269A test 9 |
| `output_contract.strongest_support` / `.strongest_pressure` / `.missing_tests` | D-269A test 10 |
| `output_contract.limitations` / `.ai_provenance_note` | D-269A test 11 |
| `output_contract` warns: do not invent evidence | D-269A test 12 |
| `is_fallback:true` preserved | D-269A test 24 |
| `safeRunPackClaim(selected)` payload preserved (D-171B lock) | D-269A test 25 (via D-269A cat. 5) |

---

## Generated-Time Summary — Locked

| Item | Value / lock |
|------|-------------|
| `rpRelativeTime()` defined | D-269A test 13 |
| Returns `just now` for < 60s | D-269A test 14 |
| Returns `X min ago` for < 1h | D-269A test 15 |
| Returns `Xh ago` for < 24h | D-269A test 16 |
| `rp-summary-generated` class emitted by `runPackSummary()` | D-269A test 17 |
| Row guarded by `lastPacketMeta.generated_at` | D-269A test 18 |
| Row calls `rpRelativeTime()` | D-269A test 19 |
| Row appears before `rp-status-chip` in render order | D-269A test 20 |

---

## Stale Warning / Threshold — Locked

| Item | Value / lock |
|------|-------------|
| Stale warning chip (`rp-status-warn` / `Possibly stale`) preserved | D-269A test 21 |
| `detectPacketStaleness()` still called | D-269A test 22 |
| Stale threshold `3600000ms` unchanged | D-269A test 23 |
| `source_snapshot_hash` comparison not added (F-4 deferred) | D-269A test 24 |

---

## Deferred Findings (remain deferred after D-270A)

| Finding | Reason deferred |
|---------|----------------|
| F-3 — "Load AI Analysis Return" collapsed | Auto-expand may cause UI noise; requires careful state-gating |
| F-4 — `source_snapshot_hash` stale check | Count-based check handles common case; content-only edits without count change are rare |
| F-5 — `packet_id` not stored with analysis | Requires `analysis_results` schema migration and API change |

---

## Behavior Guarantees Preserved

| Item | Status |
|------|--------|
| Claim loading (`selectClaim`) | Unchanged |
| Backend RunPack generation (`POST /api/runpack`) | Unchanged |
| Fallback packet — now adds `instruction` + `output_contract` | D-268B |
| `safeRunPackClaim(selected)` payload | Unchanged (D-171B lock) |
| Copy Packet / Download Packet | Unchanged |
| `saveAnalysisResult()` parsing | Unchanged (JSON.parse, `output \|\| result \|\| analysis \|\| parsed`) |
| `packet_id` advisory check | Non-blocking toast — unchanged |
| Public truth state | No change — `saveAnalysisResult` posts to `/api/analysis` only |
| Review queue / moderation | Unchanged |
| `requestApproveReview` / `requestRejectReview` | Still defined and unchanged |
| Public profile | `generateRunPack`, `saveAnalysisResult` absent from `renderPublicProfileHtml` |
| Drift/Belief expansion files | Not touched |
| `src/worker.js` | Not touched |
| `public/index.html` | Not touched |
| `public/styles.css` | Not touched |
| No backend/API/migration/schema/CSP/external asset changes | Confirmed |

---

## Public / Privacy Guarantees

- `generateRunPack`, `saveAnalysisResult`, `runPackSummary`, `renderExport`, `rpRelativeTime` all absent from `renderPublicProfileHtml` — D-269A tests 36–37.
- RunPack generation gated on public claims only (`POST /api/runpack` → worker 404 for non-public).
- No new public data fields.
- `PUBLIC_PROFILE_ALLOWED_MARKERS` contract unchanged.
- D-216A denylist unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-268A/B/C or D-269A. Confirmed by D-269A tests 38, 42.

**Rule:** Do not touch Drift/Belief files during Claim/RunPack lane work unless a failing test requires a minimal, explicitly documented compatibility fix.

---

## Safe Next Lanes

| Lane | Notes |
|------|-------|
| RunPack AI-return import visibility | F-3 deferred — consider auto-expanding "Load AI Analysis Return" when packet is ready |
| Snapshot-hash stale detection | F-4 deferred — content-level stale detection via `source_snapshot_hash` |
| Packet-ID traceability | F-5 deferred — requires backend schema decision |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, app-to-Belief-Engine framing |
| Study page content hierarchy audit | Study page layout, section ordering, dock/content density |

Do not start any lane without explicit owner assignment.

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-270A
- `public/styles.css` — not modified by D-270A
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No public profile changes
- No Review/moderation logic changes
