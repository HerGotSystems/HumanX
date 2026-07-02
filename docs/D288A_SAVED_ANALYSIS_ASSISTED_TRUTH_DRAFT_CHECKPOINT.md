# D-288A — Saved Analysis Assisted Truth Draft Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3360 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-288A:** `1559793`
**Files changed:** `docs/D288A_SAVED_ANALYSIS_ASSISTED_TRUTH_DRAFT_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-287 saved analysis assisted Truth draft arc with a single durable checkpoint. Future Truth workflow work starts from the correct live baseline recorded here.

---

## D-287 Arc Summary

### D-287A — Audit (docs only)

Full audit (23 questions) of whether saved AI analysis can safely assist the owner in drafting a Truth. Key findings:

- **Safe prefill source:** `plainLanguageSummary` — prose text that describes what the evidence says about the claim.
- **Blocked source:** `verdict` — AI classification label (`'strongly-supported'`, `'contested'`, etc.); must never appear as Truth statement content.
- **Implementation scope:** Frontend-only — `analysisItem()` only. No backend, schema, or migration.
- **Review gate:** Fully preserved. `review_state='review'` set by `src/truths.js` on every `POST /api/truths` call, unchanged.
- **Auto-submit:** Must not happen. Owner must click "Submit Truth for Review" explicitly.
- **Auto-publish:** Must not happen. Admin Review remains the only approval path.
- **D-287B classification:** Frontend-only. Single function. Safe to implement.

Baseline unchanged: `3337/0/24/57`. No deploy.

### D-287B — Implementation

`analysisItem()` updated to conditionally render a "Draft Truth from analysis" button when `plainLanguageSummary` (or `raw.plain_language_summary`) is present. New `draftTruthFromAnalysis(summary)` async function added and registered in `_D181C_PARAM_ACTIONS`.

| What changed | Detail |
|-------------|--------|
| Button | `data-action="draftTruthFromAnalysis" data-summary="${esc(summary)}"` — conditional on `plainLanguageSummary` |
| Draft-only guidance | `"Draft only — review and submit for Review when ready."` adjacent to button |
| `draftTruthFromAnalysis(summary)` | Switches to Truths tab, calls `renderTruths()`, sets `truthStatement`, focuses field, sets `truthOrigin` to `"RunPack analysis"` if empty, toasts `"Draft ready — review and submit for Review when ready."` |
| Action registration | `_D181C_PARAM_ACTIONS.draftTruthFromAnalysis: b => draftTruthFromAnalysis(b.dataset.summary)` |

23 new tests added. Two existing `analysisItemSlice` sizes bumped from 1400→2000 and 1200→2000.

Baseline `3337 → 3360`. Deploy needed.

### D-287C — Live Closeout

- Owner deploy PASS (2026-07-02)
- 31/31 live sanity PASS
- Deployed Worker version: not captured

---

## D-287 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| Draft action label | `"Draft Truth from analysis"` — correct |
| Dangerous wording absent | `"Publish Truth from analysis"` — absent |
| Prefill source | `plainLanguageSummary` only |
| `verdict` used as Truth content | Never |
| Draft-only guidance | `"Draft only — review and submit for Review when ready."` |
| `draftTruthFromAnalysis` calls `submitTruth()` | No |
| `draftTruthFromAnalysis` calls approve/reject/review routes | No |
| Auto-submit | No |
| Auto-publish | No |
| Owner must explicitly submit | Yes — "Submit Truth for Review" button click required |
| `review_state='review'` on actual submission | Yes — `src/truths.js` unchanged |
| Review gate | Preserved — `requestApproveReview`, `requestRejectReview`, `reviewDecisionUI` unchanged |
| D-285B post-submit navigation | Preserved — all three paths use `renderMe()` + `tab-me` |
| D-285B post-submit toast | Preserved — `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| Pending Truths in My HumanX | Yes — yellow `Review` badge; `GET /api/my-humanx` unchanged |
| Public profile | `"Draft Truth from analysis"` not exposed; `analysisItem()` absent from `renderPublicProfileHtml()` |
| Public Truths tab behavior | Unchanged |
| Review/moderation | Unchanged |
| Backend/schema/API | No changes in D-287 |
| CSS | No changes in D-287 |

---

## Preserved Previous Locks

### Truth/Review baseline (D-283/D-284)

| Lock | Value |
|------|-------|
| Truth creation paths produce `review_state='review'` | Three paths: `submitTruth`, `submitBuilderTruth`, `promoteBelief('truth')` — all unchanged |
| No current route publishes directly without Review | Admin-only `POST /api/review/decision` with `decision='public'` |
| Saved analysis does not create, submit, approve, or publish a Truth | `saveAnalysisResult()` → `/api/analysis` only |

### D-271/D-272 AI-return import visibility

| Lock | Value |
|------|-------|
| `rp-return-section` | Present in `renderExport()` |
| `Load AI Analysis Return` title | Present |
| Auto-expand condition | `lastPacket && lastPacketClaimId === selected?.id` |
| No-auto-publish guidance | `Saving does not publish a truth automatically` |
| `saveAnalysisResult()` JSON.parse validation | Preserved |
| `saveAnalysisResult()` field extraction | `parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed` |
| `saveAnalysisResult()` route | Posts only to `/api/analysis` |

### D-274/D-279 stale detection

| Lock | Value |
|------|-------|
| `detectPacketStaleness()` check | `meta.source_snapshot_hash != null && simpleClaimHash(selected) !== meta.source_snapshot_hash` |
| Stale reason | `'claim updated since packet'` |
| Stale threshold | `3600000ms` (1h) |

### D-275 packet-ID storage

| Lock | Value |
|------|-------|
| `analysis_results.packet_id TEXT` | Live — nullable column; migration `0017` applied |
| `/api/analysis` accepts optional `packet_id` | Yes |
| Backend sanitizer | `cleanText(body.packet_id \|\| '', 80) \|\| null` — not `cleanId()` |
| `rp_*` underscore format | Preserved |
| Frontend gate | `lastPacketClaimId === selected?.id` |

### D-277/D-281 saved-analysis boundary

| Lock | Value |
|------|-------|
| Provenance line | `"Saved from RunPack: ${esc(a.packetId)}"` conditional on `a.packetId` |
| `sectionAnalyses()` no-auto-publish copy | `"Saving analysis does not publish a truth automatically — it only stores private analysis for this claim."` |
| `analysisItem()` private note | `"Private analysis note — not public truth."` |
| Public profile exposure of private/no-auto-publish copy | None |
| Public profile exposure of `Saved from RunPack` | None |
| Public profile exposure of `packetId` | None |

### D-285 owner pending-Review Truth visibility

| Lock | Value |
|------|-------|
| All three Truth submission success paths navigate to My HumanX | `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')` — all use `renderMe()` + `tab-me` |
| Post-submit toast | `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| `GET /api/my-humanx` | Owner pending-Truth visibility source — no `review_state` filter |
| Pending truths | Yellow `Review` badge in My HumanX |

### D-287 saved analysis assisted Truth draft (this arc)

| Lock | Value |
|------|-------|
| `draftTruthFromAnalysis()` | Prefill-only; does not call `submitTruth()` or any approve/review route |
| Prefill source | `plainLanguageSummary` only; `verdict` never used |
| Draft-only guidance | `"Draft only — review and submit for Review when ready."` present in `analysisItem()` |
| Button conditional | Only rendered when `plainLanguageSummary` exists |
| `_D181C_PARAM_ACTIONS` registration | `draftTruthFromAnalysis: b => draftTruthFromAnalysis(b.dataset.summary)` |
| Public exposure | None — `analysisItem()` is owner/private `renderStudy()` surface only |

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-288A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-288A |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |

---

## Static Checks (D-288A baseline)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3360 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-287A | No | Audit / docs only |
| D-287B | **Yes — owner deployed** | PASS — D-287C live closeout (31/31) |
| D-287C | No | Live closeout |
| D-288A | No | Docs only |
