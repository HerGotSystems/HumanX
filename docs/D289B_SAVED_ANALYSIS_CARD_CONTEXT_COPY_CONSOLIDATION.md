# D-289B — Saved Analysis Card Context Copy Consolidation

**Scope:** Frontend + tests + docs
**Status:** COMPLETE — owner deployed (D-289C live closeout)
**Branch:** main (direct commit)
**Baseline before D-289B:** 3360 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Hardening after D-289B:** 3383 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-289B:** `7da1ef5`
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D289B_SAVED_ANALYSIS_CARD_CONTEXT_COPY_CONSOLIDATION.md`, `docs/README.md`

---

## Purpose

Addresses the highest-friction issue identified in D-289A product pass: three stacked `ev-origin-note` paragraphs appeared unconditionally before useful analysis card content on every saved analysis card, burying the verdict badge, score meters, and plain-language summary.

---

## D-289A Product-Pass Finding Addressed

D-289A Q13 identified:

> Three `ev-origin-note` paragraphs appear before useful content on every analysis card, every view:
> 1. `"AI analysis of supplied HumanX packet — not independent verification."` — always shown
> 2. `"Private analysis note — not public truth."` — always shown
> 3. `"Saved from RunPack: rp_..."` — shown when `packetId` present
>
> The result is that the verdict badge, meters, and plain-language summary are buried below these three lines every time.

---

## Change Made

### `public/app-v10.js` — `analysisItem()` (line 466)

**Removed** three separate stacked lines:
```
<p class="small ev-origin-note">AI analysis of supplied HumanX packet — not independent verification.</p>
<p class="small ev-origin-note">Private analysis note — not public truth.</p>
${a.packetId?`<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>`:''}
```

**Replaced** with one compact conditional line:
```
${a.packetId
  ? `<p class="small ev-origin-note">Private analysis · not public truth · not independent verification · RunPack: ${esc(a.packetId)}</p>`
  : '<p class="small ev-origin-note">Private analysis · not public truth · not independent verification</p>'
}
```

All three safety meanings are preserved:
- "Private analysis" — private boundary (was: "Private analysis note — not public truth.")
- "not public truth" — not-truth boundary (was: "Private analysis note — not public truth.")
- "not independent verification" — AI qualification (was: "AI analysis of supplied HumanX packet — not independent verification.")
- "RunPack: `rp_...`" — provenance when `a.packetId` exists (was: "Saved from RunPack: `rp_...`")

When `a.packetId` is absent, the RunPack portion is omitted entirely (no-packet case unchanged in behavior).

---

## Copy Consolidation

| Before | After |
|--------|-------|
| Three separate `<p>` elements stacked before meters | One `<p>` element — compact dot-separated |
| "AI analysis of supplied HumanX packet — not independent verification." | "not independent verification" (meaning preserved) |
| "Private analysis note — not public truth." | "Private analysis · not public truth" (meaning preserved) |
| "Saved from RunPack: rp_..." (conditional) | "RunPack: rp_..." (same condition, shorter label) |

---

## Safety Meaning Preserved

| Meaning | Status |
|---------|--------|
| Analysis is private / not public truth | Yes — "Private analysis · not public truth" |
| AI analysis is not independent verification | Yes — "not independent verification" |
| RunPack provenance visible when packetId present | Yes — "RunPack: ${esc(a.packetId)}" conditional on `a.packetId` |
| Packet ID escaped | Yes — `esc(a.packetId)` |
| RunPack text absent when packetId absent | Yes — ternary else branch has no "RunPack:" |

---

## No-Touch Table

| Area | Status |
|------|--------|
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| Backend/API/schema/storage | No changes |
| `draftTruthFromAnalysis()` | Not modified |
| `saveAnalysisResult()` | Not modified |
| `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')` | Not modified |
| Review/moderation handlers | Not modified |
| Public profile `/u/:slug` | Unaffected |
| `selectClaim`, `studyFromVault`, `attachEvidencePrompt` | Unchanged |
| `sectionAnalyses()` no-auto-publish copy | Unchanged |

---

## Tests Added / Updated

**23 new tests** added in `scripts/hardening-smoke-test.mjs` under `Section D-289B`.

**6 existing tests updated** to reflect the consolidated copy (description and assertion strings only — the underlying guarantees are preserved, not weakened):

| Original test | Update |
|---------------|--------|
| D-277B: `'Saved from RunPack:'` | Updated to `'RunPack:'` |
| D-277B: provenance zone uses `indexOf('Saved from RunPack:')` | Updated to `indexOf('RunPack:')` with `Math.max(0, ...)` guard |
| D-281B: `'Private analysis note'` | Updated to `'Private analysis'` |
| D-281B: `'Saved from RunPack:'` | Updated to `'RunPack:'` |
| D-279B: `'Saved from RunPack:'` | Updated to `'RunPack:'` |
| D-285B: `'Saved from RunPack:'` | Updated to `'RunPack:'` |
| D-287B test 16: `'Private analysis note'` | Updated to `'Private analysis'` |
| D-287B test 21: `'Saved from RunPack:'` | Updated to `'RunPack:'` |

**New D-289B tests (23):**

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | `"Private analysis" in analysisItem` | Compact context block present |
| 2 | `"not public truth"` still present | Not-truth meaning preserved |
| 3 | `"not independent verification"` still present | AI qualification preserved |
| 4 | RunPack provenance still conditional on `a.packetId` | Provenance gate unchanged |
| 5 | `esc(a.packetId)` still used | Packet ID still escaped |
| 6 | Old `"Private analysis note — not public truth."` line absent | Consolidation verified |
| 7 | Old `"Saved from RunPack:"` label absent | Consolidation verified |
| 8 | RunPack provenance not removed entirely | Provenance still present |
| 9 | No-packet case has no "RunPack:" in else branch | Conditional correctly omits provenance |
| 10 | `"Draft Truth from analysis"` still present | Draft action unaffected |
| 11 | Draft action still uses `plainLanguageSummary` | Prefill source unchanged |
| 12 | Draft action does not use `verdict` as Truth content | Safety lock preserved |
| 13 | `draftTruthFromAnalysis` does not call `submitTruth()` | No auto-submit |
| 14 | `saveAnalysisResult` still posts only to `/api/analysis` | Analysis boundary preserved |
| 15 | Public profile does not expose metadata, `packetId`, or draft copy | Privacy boundary preserved |
| 16 | Review/moderation handlers remain defined | Moderation lock preserved |
| 17 | Truth submission still references `review_state` | Review gate preserved |
| 18 | D-285B post-submit navigation preserved | `renderMe()`, `tab-me`, toast preserved |
| 19 | Stale detection locks preserved | `claim updated since packet`, `source_snapshot_hash`, `simpleClaimHash` |
| 20 | AI-return import locks preserved | `rp-return-section`, `Load AI Analysis Return`, `Saving does not publish`, `JSON.parse`, field extraction |
| 21 | No CSS changes | `styles.css` untouched |
| 22 | No backend/API/schema/storage changes | `worker.js`, `analysis-results.js`, `truths.js` untouched |
| 23 | Drift/Belief expansion files untouched | `belief-drift-expansion.js` untouched |

---

## Static Checks (D-289B)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3383 passed, 0 failed` (+23 vs D-289A baseline of 3360) |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-289A | No | Docs only |
| D-289B | **Yes — owner deployed** | PASS — D-289C live closeout |
| D-289C | No | Live closeout |

## Live Sanity (D-289C — owner-verified, 2026-07-02)

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Owner can open a claim/Study view without console-breaking errors | PASS |
| 3 | Saved analysis cards still render | PASS |
| 4 | Saved analysis card shows compact context line | PASS |
| 5 | Compact context line includes `Private analysis` | PASS |
| 6 | Compact context line includes `not public truth` | PASS |
| 7 | Compact context line includes `not independent verification` | PASS |
| 8 | When `packetId` exists, compact context line includes RunPack provenance | PASS |
| 9 | Packet ID underscore format remains preserved visually | PASS |
| 10 | Packet ID remains escaped safely | PASS |
| 11 | When `packetId` is absent, RunPack segment is not shown | PASS |
| 12 | Old stacked separate note `"Private analysis note — not public truth."` no longer shown | PASS |
| 13 | Old stacked separate provenance line `"Saved from RunPack:"` no longer shown | PASS |
| 14 | Verdict badge/meters/plain-language summary easier to reach (notes consolidated) | PASS |
| 15 | `Draft Truth from analysis` still appears when `plainLanguageSummary` exists | PASS |
| 16 | Draft action still pre-fills from `plainLanguageSummary` | PASS |
| 17 | Draft action does not use `verdict` as Truth content | PASS |
| 18 | Draft action remains draft-only | PASS |
| 19 | Draft action does not submit or publish | PASS |
| 20 | `saveAnalysisResult()` still posts only to `/api/analysis` | PASS |
| 21 | Public profile `/u/:slug` does not expose saved analysis metadata | PASS |
| 22 | Public profile `/u/:slug` does not expose `packetId` | PASS |
| 23 | Public profile `/u/:slug` does not expose `Draft Truth from analysis` | PASS |
| 24 | Review/moderation behavior unchanged | PASS |
| 25 | Truth submission still uses `review_state='review'` | PASS |
| 26 | D-285B post-submit navigation preserved: `renderMe()`, `tab-me`, toast `Submitted for Review — you can see it in My HumanX with the Review badge.` | PASS |
| 27 | Stale detection preserved: `claim updated since packet` | PASS |
| 28 | AI-return import locks preserved: `rp-return-section`, `Load AI Analysis Return`, `Saving does not publish a truth automatically` | PASS |
| 29 | Parser behavior unchanged: `JSON.parse`, `parsed.output \|\| parsed.result \|\| parsed.analysis \|\| parsed` | PASS |
| 30 | Packet-ID/provenance storage unchanged | PASS |
| 31 | Drift/Belief expansion unaffected | PASS |
| 32 | No backend/API/schema/storage behavior changed | PASS |
| 33 | No console errors | PASS |

**Live sanity: 33/33 PASS**

Deployed Worker version: not captured.
| D-289B | **Yes — deploy needed** | `public/app-v10.js` changed |
