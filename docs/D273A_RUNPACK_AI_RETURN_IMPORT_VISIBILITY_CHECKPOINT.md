# D-273A — RunPack AI-Return Import Visibility Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3217 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D273A_RUNPACK_AI_RETURN_IMPORT_VISIBILITY_CHECKPOINT.md`
**App changes:** None (`public/app-v10.js` not touched)
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Closes the D-271A/B + D-272A RunPack AI-return import visibility mini-arc. Confirms the fix is implemented, live sanity passed, and regression-locked. Updates `PROJECT_STATE.md` with the arc summary, visibility behavior table, deployment state, privacy guarantees, and safe-next rules 78–80.

---

## D-271A/B / D-272A Summary

| Task | Type | What it did |
|------|------|-------------|
| D-271A | Frontend + tests | `rp-return-section` now auto-expands when `lastPacket&&lastPacketClaimId===selected?.id`. New `rp-return-next-step` copy: "After your AI analyses the packet, paste its JSON response here. Saving does not publish a truth automatically — it only loads analysis for this claim." 27 new lock tests. Baseline 3144 → 3171. |
| D-271B | Live closeout | Owner deploy PASS (2026-07-01). 32/32 live sanity PASS. Deployed Worker version not captured. |
| D-272A | Regression lock | 46 new tests across 7 categories. D-93B allowlist extended with 3100/3144/3171/3217. Baseline 3171 → 3217. |
| D-273A | Checkpoint | `PROJECT_STATE.md` updated; docs only; no deploy. |

---

## Current Baseline

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3217 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deploy State

| Task | Deploy state |
|------|-------------|
| D-271A | Owner deploy PASS — D-271B confirmed live (32/32) |
| D-271B | Live closeout — no deploy needed |
| D-272A | Tests / docs only — no deploy needed |
| D-273A | Docs only — no deploy needed |
| **Current** | **No deploy needed** |

Latest deployed Worker version: not captured during D-271B. Previous confirmed version: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` (D-261C).

---

## Locked Guarantees (post D-272A)

### AI-return section visibility

| Item | Locked value / behavior |
|------|------------------------|
| Section class | `rp-return-section` present in `renderExport` |
| Section title | `Load AI Analysis Return` |
| Auto-expand condition | `lastPacket&&lastPacketClaimId===selected?.id` |
| Section gate | Only rendered when `selected` claim exists |
| `analysisPaste` textarea | Present |
| `Save Analysis` button | Present |
| Visibility mechanism | Frontend-only — no backend call gates open/closed state |

### Next-step copy

| Item | Locked value / behavior |
|------|------------------------|
| Class | `rp-return-next-step` |
| Paste instruction | Tells user to paste AI/JSON response |
| No-auto-publish phrase | "Saving does not publish a truth automatically" |
| No owner-verified-proof claim | Does not imply AI analysis is verified proof |
| `ev-origin-note` provenance | Present in `rp-return-body` — "not independent external sources; not independent verification" |

### Parser behavior

| Item | Locked value |
|------|-------------|
| Validation | `JSON.parse(text)` |
| Field extraction | `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` |
| Failure toast | `Paste valid JSON first` |
| Success toast | `Analysis saved — verdict shown in the Analysis section.` |
| Format | Not narrowed — all three fallback keys checked |
| Location | Frontend async function — not moved to backend |

### saveAnalysisResult / public truth

| Item | Locked value |
|------|-------------|
| API endpoint | `/api/analysis` only |
| No review/approve/truth routes | Confirmed |
| Public truth state | Unchanged by analysis save |
| `requestApproveReview` / `requestRejectReview` | Still defined — moderation unchanged |

### D-268→D-270 compatibility (all preserved)

| Item | Status |
|------|--------|
| `rpRelativeTime` | Still defined |
| `rp-summary-generated` | Still in `runPackSummary` |
| Fallback `instruction` | Present — emotionally-important/unpopular/no-independent-verification warnings |
| Fallback `output_contract` | Present — all 10 fields + no-invent-evidence warning |
| Stale warning chip | Present in `runPackSummary` |
| Stale threshold | `3600000ms` — unchanged |
| F-4 `source_snapshot_hash` | Deferred — not added |
| F-5 `packet_id` storage | Deferred — not added |
| `generateRunPack` | Still defined |
| Copy/Download buttons | Still present |

---

## Public / Privacy Guarantees

- `rp-return-section` absent from `renderPublicProfileHtml` — D-272A test 24
- `rp-return-next-step` absent from `renderPublicProfileHtml` — D-272A test 25
- `saveAnalysisResult` absent from `renderPublicProfileHtml` — D-272A test 26
- `Load AI Analysis Return` absent from `renderPublicProfileHtml` — D-272A test 27
- `PUBLIC_PROFILE_ALLOWED_MARKERS` contract unchanged
- D-216A denylist unchanged

---

## Deferred Findings (remain deferred after D-273A)

| Finding | Reason deferred |
|---------|----------------|
| F-4 — `source_snapshot_hash` stale check | Count-based check handles common case; content-only edits without count change are rare. Requires backend/schema decision. |
| F-5 — `packet_id` not stored with analysis | Requires `analysis_results` schema migration and backend API change. Must be branch/PR style. |

---

## Safe Next Lanes

| Lane | Notes |
|------|-------|
| Snapshot-hash stale detection | F-4 — compare `source_snapshot_hash` in `detectPacketStaleness()`; requires backend decision; branch/PR style |
| Packet-ID traceability | F-5 — store `packet_id` with saved analysis; requires schema migration; branch/PR style |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, app-to-Belief-Engine framing |
| Study page content hierarchy audit | Study page layout, section ordering, dock/content density |

Do not start any lane without explicit owner assignment.

---

## Safe-Next Rules Added (D-273A)

- **Rule 78** — Do not collapse `rp-return-section` by default without owner approval
- **Rule 79** — Do not remove `rp-return-next-step` or its no-auto-publish copy under a UI clarity task
- **Rule 80** — Next RunPack backend work (F-4/F-5) must be branch/PR style

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-273A
- `public/styles.css` — not modified
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No public profile changes
- No Review/moderation logic changes
