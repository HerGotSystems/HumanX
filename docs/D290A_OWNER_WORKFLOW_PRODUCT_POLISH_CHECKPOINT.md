# D-290A — Owner Workflow Product Polish Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3383 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-290A:** `a212172`
**Files changed:** `docs/D290A_OWNER_WORKFLOW_PRODUCT_POLISH_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-289 owner workflow product pass / saved-analysis card copy consolidation arc with a single durable checkpoint. Future owner-facing work starts from the correct live baseline recorded here.

---

## D-289 Arc Summary

### D-289A — Owner Workflow Product Pass (docs only)

Full 15-question product pass over the complete owner workflow (claim → RunPack → saved analysis → draft Truth → submit → My HumanX). Key findings:

- **Highest friction:** Three stacked `ev-origin-note` paragraphs appeared unconditionally before useful analysis card content on every saved analysis card, burying the verdict badge, meters, and plain-language summary:
  1. `"AI analysis of supplied HumanX packet — not independent verification."` — always shown
  2. `"Private analysis note — not public truth."` — always shown
  3. `"Saved from RunPack: rp_..."` — conditional on `a.packetId`
- **Workflow status:** Complete and logically coherent. No structural gaps in the arc.
- **D-289B candidate:** Consolidate the stacked notes into one compact line — frontend-only, very low risk.
- **Baseline unchanged:** 3360/0/24/57. No deploy.

### D-289B — Saved Analysis Card Context Copy Consolidation

`analysisItem()` updated to replace three stacked `<p>` elements with one compact conditional line.

| Before | After |
|--------|-------|
| Three separate stacked `<p class="small ev-origin-note">` lines | One `<p class="small ev-origin-note">` — compact dot-separated |
| `"AI analysis of supplied HumanX packet — not independent verification."` | `"not independent verification"` (meaning preserved) |
| `"Private analysis note — not public truth."` | `"Private analysis · not public truth"` (meaning preserved) |
| `"Saved from RunPack: rp_..."` (conditional) | `"· RunPack: rp_..."` (same condition, shorter label) |

Compact copy when `a.packetId` exists:
```
Private analysis · not public truth · not independent verification · RunPack: ${esc(a.packetId)}
```

Compact copy when `a.packetId` is absent:
```
Private analysis · not public truth · not independent verification
```

23 new D-289B tests added. 8 existing tests updated (D-277B ×2, D-279B, D-281B ×2, D-285B, D-287B ×2) to reflect consolidated copy. Baseline 3360 → 3383.

### D-289C — Live Closeout

- Owner deploy PASS (2026-07-02)
- 33/33 live sanity PASS
- Deployed Worker version: not captured

---

## D-289 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| Compact context line | `"Private analysis · not public truth · not independent verification"` always shown |
| Old separate `"Private analysis note — not public truth."` line | Removed |
| Old separate `"Saved from RunPack:"` label | Removed |
| RunPack provenance | Shown when `a.packetId` exists — `"· RunPack: ${esc(a.packetId)}"` |
| RunPack provenance when absent | Omitted — no-packet case produces no "RunPack:" text |
| Packet ID escaped | Yes — `esc(a.packetId)` |
| `Draft Truth from analysis` button | Unchanged — still present when `plainLanguageSummary` exists |
| Draft action prefill source | `plainLanguageSummary` only — unchanged |
| Draft action auto-submit | No — unchanged |
| Draft action auto-publish | No — unchanged |
| Public profile exposure | None — `analysisItem()` still absent from `renderPublicProfileHtml()` |
| Backend/API/schema/CSS/index/worker changes in D-289 | None |

---

## Preserved Previous Locks

### D-287 Assisted Truth Draft

| Lock | Value |
|------|-------|
| `"Draft Truth from analysis"` present when `plainLanguageSummary` exists | Yes |
| Prefill source | `plainLanguageSummary` only |
| `verdict` used as Truth content | Never |
| `draftTruthFromAnalysis()` calls `submitTruth()` | No |
| Auto-submit | No |
| Auto-publish | No |
| Owner must explicitly submit | Yes |
| `review_state='review'` on actual submission | Yes — `src/truths.js` unchanged |

### D-285 Owner Pending-Review Truth Visibility

| Lock | Value |
|------|-------|
| All three Truth submission success paths navigate to My HumanX | `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')` — all use `renderMe()` + `tab-me` |
| Post-submit toast | `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| Pending Truths in My HumanX | Yellow `Review` badge — unchanged |

### Truth/Review Baseline

| Lock | Value |
|------|-------|
| Truth creation paths produce `review_state='review'` | Three paths — all unchanged |
| No current route publishes directly without Review | Admin-only `POST /api/review/decision` |
| Saved analysis does not create, submit, approve, or publish a Truth | `saveAnalysisResult()` → `/api/analysis` only |

### RunPack / Saved-Analysis Locks

| Lock | Value |
|------|-------|
| `saveAnalysisResult()` posts only to `/api/analysis` | Unchanged |
| `analysis_results.packet_id` live | Yes — nullable column, migration `0017` applied |
| Stale warning | `'claim updated since packet'` |
| `rp-return-section` auto-expands on matching packet | Yes |
| `"Load AI Analysis Return"` title | Present |
| `"Saving does not publish a truth automatically"` copy | Present in `rp-return-next-step` |
| `JSON.parse` validation in `saveAnalysisResult()` | Unchanged |
| Field extraction `parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed` | Unchanged |

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-290A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-290A |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |

---

## Static Checks (D-290A)

Docs-only change — no code files modified. Baseline unchanged.

| Check | Expected |
|-------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3383 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-289A | No | Product pass / docs only |
| D-289B | **Yes — owner deployed** | PASS — D-289C live closeout (33/33) |
| D-289C | No | Live closeout |
| D-290A | No | Docs only |
