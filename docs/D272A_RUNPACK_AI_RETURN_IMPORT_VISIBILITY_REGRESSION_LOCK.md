# D-272A — RunPack AI-Return Import Visibility Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — no deploy needed
**Baseline before:** 3171 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3217 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**New tests:** +46 (7 categories)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D272A_RUNPACK_AI_RETURN_IMPORT_VISIBILITY_REGRESSION_LOCK.md`, `docs/README.md`
**App changes:** None (`public/app-v10.js` not touched)
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Regression lock for D-271A/B — RunPack AI-return import visibility polish. Prevents future Claim/RunPack UI work from accidentally:

- Collapsing the "Load AI Analysis Return" section again (it is now auto-expanded when a matching RunPack is loaded)
- Removing the `rp-return-next-step` no-auto-publish guidance
- Altering parser/save/public-truth behavior under a UI clarity task
- Exposing AI-return import controls in the public profile

---

## D-271A/B Summary

| Task | Type | What it did |
|------|------|-------------|
| D-271A | Frontend + tests | `rp-return-section` now auto-expands when `lastPacket && lastPacketClaimId === selected?.id`. New `rp-return-next-step` copy: "After your AI analyses the packet, paste its JSON response here. Saving does not publish a truth automatically — it only loads analysis for this claim." |
| D-271B | Live closeout | Owner deploy PASS (2026-07-01). 32/32 live sanity PASS. |
| D-272A | Regression lock | 46 new lock tests across 7 categories. No app changes. |

---

## What Is Now Locked

### AI-return section visibility

| Guarantee | Lock |
|-----------|------|
| `rp-return-section` exists in `renderExport` | D-272A test 1 |
| `Load AI Analysis Return` title present | D-272A test 2 |
| Conditional `open` attribute present on `rp-return-section` | D-272A test 3 |
| Auto-expand condition is `lastPacket&&lastPacketClaimId===selected?.id` | D-272A test 4 |
| Section is gated on selected claim (not unconditionally rendered) | D-272A test 5 |
| `analysisPaste` textarea present | D-272A test 6 |
| `Save Analysis` button present | D-272A test 7 |
| Visibility is frontend-only (no backend call gates open/closed state) | D-272A test 8 |

### Next-step copy

| Guarantee | Lock |
|-----------|------|
| `rp-return-next-step` class present | D-272A test 9 |
| Copy tells user to paste AI/JSON response | D-272A test 10 |
| Copy states saving does not publish a truth automatically | D-272A test 11 |
| Copy does not claim AI analysis is owner-verified proof | D-272A test 12 |
| `ev-origin-note` provenance note present in `rp-return-body` | D-272A test 13 |
| No-auto-publish copy is within the `rp-return-section` block | D-272A test 14 |

### Parser behavior

| Guarantee | Lock |
|-----------|------|
| `JSON.parse(text)` validation unchanged | D-272A test 15 |
| Field extraction `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` unchanged | D-272A test 16 |
| Parse failure toast `Paste valid JSON first` unchanged | D-272A test 17 |
| Parse success toast `Analysis saved` unchanged | D-272A test 18 |
| Accepted format not narrowed — all three fallback keys checked | D-272A test 19 |
| `saveAnalysisResult` still defined as async frontend function | D-272A test 20 |

### saveAnalysisResult / public truth

| Guarantee | Lock |
|-----------|------|
| Posts to `/api/analysis` only — no review/approve/truth routes | D-272A test 21 |
| Does not call `submitTruth`, `requestApproveReview`, or `publishTruth` | D-272A test 22 |
| `requestApproveReview` still defined — moderation unchanged | D-272A test 23 |
| `rp-return-section` absent from `renderPublicProfileHtml` | D-272A test 24 |
| `rp-return-next-step` absent from `renderPublicProfileHtml` | D-272A test 25 |
| `saveAnalysisResult` absent from `renderPublicProfileHtml` | D-272A test 26 |
| `Load AI Analysis Return` absent from `renderPublicProfileHtml` | D-272A test 27 |

### D-268→D-270 compatibility

| Guarantee | Lock |
|-----------|------|
| `rpRelativeTime` still defined | D-272A test 28 |
| `rp-summary-generated` still in `runPackSummary` | D-272A test 29 |
| Fallback `instruction` still present (emotionally-important warning) | D-272A test 30 |
| Fallback `output_contract` still present | D-272A test 31 |
| Stale warning chip still in `runPackSummary` | D-272A test 32 |
| Stale threshold `3600000ms` unchanged | D-272A test 33 |
| F-4 `source_snapshot_hash` stale check deferred | D-272A test 34 |
| F-5 `packet_id` advisory non-blocking | D-272A test 35 |
| `generateRunPack` still defined | D-272A test 36 |
| Copy Packet / Download Packet buttons still present | D-272A test 37 |

### Boundary / deploy integrity

| Guarantee | Lock |
|-----------|------|
| `belief-drift-expansion.js` not modified by D-272A | D-272A test 38 |
| `worker.js` not modified by D-272A | D-272A test 39 |
| `index.html` not modified by D-272A | D-272A test 40 |
| `styles.css` not modified by D-272A | D-272A test 41 |
| `app-v10.js` not modified by D-272A | D-272A test 42 |
| `alignment_labels` permanently blocked | D-272A test 43 |
| `top_beliefs_json` not in public `/api/u/` handler | D-272A test 44 |
| `selectClaim` still defined | D-272A test 45 |
| `requestRejectReview` still defined | D-272A test 46 |

---

## Exact Locked Strings / Fields / Classes

| Item | Locked value |
|------|-------------|
| Section class | `rp-return-section` |
| Section title | `Load AI Analysis Return` |
| Auto-expand condition | `lastPacket&&lastPacketClaimId===selected?.id` |
| Next-step class | `rp-return-next-step` |
| No-auto-publish phrase | `Saving does not publish a truth automatically` |
| Parser call | `JSON.parse(text)` |
| Field extraction | `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` |
| Failure toast | `Paste valid JSON first` |
| Success toast | `Analysis saved` |
| API endpoint | `/api/analysis` |

---

## Test Results

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3217 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Behavior Guarantees Preserved

| Item | Status |
|------|--------|
| `selectClaim` | Unchanged |
| `saveAnalysisResult` parser | Unchanged — `JSON.parse`, field extraction, toasts |
| `packet_id` advisory check | Non-blocking toast — unchanged (F-5 deferred) |
| Public truth state | No change — posts to `/api/analysis` only |
| Review queue / moderation | Unchanged |
| `requestApproveReview` / `requestRejectReview` | Still defined |
| `renderPublicProfileHtml` | All AI-return import symbols absent |
| `runPackSummary` | `rp-summary-generated` present |
| `rpRelativeTime` | Unchanged |
| `detectPacketStaleness` | Unchanged (3600000ms) |
| Fallback `instruction` + `output_contract` | Unchanged (D-268B) |
| Drift/Belief expansion files | Not touched |
| `src/worker.js` | Not touched |
| `public/index.html` | Not touched |
| `public/styles.css` | Not touched |
| `public/app-v10.js` | Not touched |
| No backend/API/migration/schema/CSP changes | Confirmed |

---

## Deferred Findings (remain deferred after D-272A)

| Finding | Reason deferred |
|---------|----------------|
| F-4 — `source_snapshot_hash` stale check | Count-based check handles common case |
| F-5 — `packet_id` not stored with analysis | Requires backend schema decision |

---

## Future Rule

Any RunPack AI-return visibility or import work must either:

1. Pass all 46 D-272A lock tests without modification, or
2. Update this lock file and the test block with owner approval before changing the guarded behavior.

Do not collapse `rp-return-section` by default, remove `rp-return-next-step`, or narrow the parser format without an explicit replacement lock.

---

## No-Touch Guarantees

- `selectClaim`, `studyFromVault`, `attachEvidencePrompt` — not touched
- `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview` — not touched
- `public/belief-drift-expansion.js` — not touched
- `public/index.html` — not touched
- `public/styles.css` — not touched
- `src/worker.js` — not touched
- `wrangler.toml` — not touched
- No `alignment_labels` — permanently blocked
- No `top_beliefs_json` in any public API
