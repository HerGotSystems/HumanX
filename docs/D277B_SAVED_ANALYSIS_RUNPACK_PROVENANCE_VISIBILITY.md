# D-277B — Saved Analysis RunPack Provenance Visibility

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — deploy needed (`public/app-v10.js` changed)
**Branch:** main (direct commit)
**Baseline before:** 3263 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3288 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**New tests:** +25 (D-277B block)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D277B_SAVED_ANALYSIS_RUNPACK_PROVENANCE_VISIBILITY.md`, `docs/README.md`
**App changes:** `public/app-v10.js` line 466 (`analysisItem()`) only
**CSS changes:** None
**Worker changes:** None — `src/worker.js` not modified
**Backend changes:** None — `src/analysis-results.js` not modified
**Schema/migration changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes — `public/app-v10.js` changed

---

## D-277A Audit Conclusion

D-277A confirmed:

- `packetId` is already returned by `GET /api/claims/:id` via `mapAnalysis()` (since D-275B)
- `packetId` is present in every `a` object received by `analysisItem()` — but not yet rendered
- Showing it to the owner is safe: `rp_*` format contains no PII (last 6 chars of claim ID + base-36 timestamp)
- Frontend-only implementation — no backend, schema, or API changes required
- Public profile (`/u/:slug`) confirmed unexposed: `loadPublicProfileSummary()` never calls `listAnalysisForClaim()`

---

## UI Change

**File:** `public/app-v10.js`
**Function:** `analysisItem()` (line 466)

**Insertion point:** After the existing `AI analysis of supplied HumanX packet — not independent verification.` disclaimer paragraph, before the `<div class="meters">` block.

**Change:**

```javascript
// Before:
<p class="small ev-origin-note">AI analysis of supplied HumanX packet — not independent verification.</p><div class="meters">

// After:
<p class="small ev-origin-note">AI analysis of supplied HumanX packet — not independent verification.</p>${a.packetId?`<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>`:''}<div class="meters">
```

**Behavior:**
- When `a.packetId` is non-null: renders `<p class="small ev-origin-note">Saved from RunPack: rp_...</p>`
- When `a.packetId` is null (historical rows, analyses saved before D-275D): renders nothing
- `esc()` applied to `a.packetId` — XSS safe
- No new CSS classes — uses existing `small` and `ev-origin-note`

---

## Why This Is Owner/Private Analysis View Only

`analysisItem()` is called only from `sectionAnalyses()`, which is rendered inside `renderStudy()`. The Study view is only accessible to authenticated users — it is not part of `renderPublicProfileHtml`. The `analyses` array is loaded from `GET /api/claims/:id`, which is an authenticated route. Public profile (`/u/:slug`) never calls `listAnalysisForClaim()` and does not receive analysis data at all.

The provenance line is therefore visible only to:
1. The claim owner in Study mode
2. Authenticated users with access to the claim's Study view

It is not visible on:
- Public profile `/u/:slug`
- Truth cards
- Review queue cards
- Any unauthenticated surface

---

## Public Profile Remains Unaffected

- `loadPublicProfileSummary()` uses count aggregates only — no analysis rows
- `renderPublicProfileHtml` does not call `sectionAnalyses()` or `analysisItem()`
- D-275B regression tests 13–15 (public profile exclusion locks) remain passing
- D-277B regression tests 8–9 add explicit `Saved from RunPack` boundary checks

---

## No Backend / Schema / API / Storage Changes

- `src/analysis-results.js` — not modified
- `src/worker.js` — not modified
- `migrations/` — not modified
- `GET /api/claims/:id` response shape — unchanged (already returned `packetId` since D-275B)
- `POST /api/analysis` route — unchanged

---

## No CSS Changes

- `public/styles.css` — not modified
- `public/index.html` — not modified
- Provenance line uses existing `small` and `ev-origin-note` classes only

---

## Tests Added

25 tests in D-277B block (`scripts/hardening-smoke-test.mjs`):

| # | Category | What is tested |
|---|----------|---------------|
| 1 | Frontend | `analysisItem` renders `Saved from RunPack:` |
| 2 | Frontend | Provenance line uses `a.packetId` |
| 3 | Frontend | `esc(a.packetId)` applied — XSS safe |
| 4 | Frontend | Provenance line is conditional — hidden when `packetId` absent |
| 5 | Frontend | Provenance line uses `ev-origin-note` and `small` classes |
| 6 | CSS lock | `styles.css` not modified by D-277B |
| 7 | Backend lock | `analysis-results.js` not modified by D-277B |
| 8 | Boundary | `renderPublicProfileHtml` does not expose `packetId` |
| 9 | Boundary | `renderPublicProfileHtml` does not expose `Saved from RunPack` |
| 10 | Moderation | `requestApproveReview` still defined |
| 11 | Moderation | `requestRejectReview` still defined |
| 12 | D-275 lock | `analysis_results.packet_id` column exists in migration 0017 |
| 13 | D-275 lock | `cleanText` (not `cleanId`) used for packet_id sanitization |
| 14 | D-275 lock | `saveAnalysisResult` sends `packet_id` from `lastPacket` |
| 15 | D-275 lock | `saveAnalysisResult` gates on `lastPacketClaimId===selected?.id` |
| 16 | D-274 lock | `detectPacketStaleness` checks `source_snapshot_hash` |
| 17 | D-274 lock | `detectPacketStaleness` calls `simpleClaimHash(selected)` |
| 18 | D-274 lock | `detectPacketStaleness` pushes `source snapshot changed` |
| 19 | D-274 lock | Stale threshold `3600000ms` unchanged |
| 20 | D-271 lock | `rp-return-section` still present |
| 21 | D-271 lock | `Load AI Analysis Return` still present |
| 22 | D-272 lock | `rp-return-next-step` still present |
| 23 | D-272 lock | No-auto-publish guidance still present |
| 24 | D-271 lock | `JSON.parse(text)` validation unchanged in `saveAnalysisResult` |
| 25 | D-271 lock | Field extraction `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` unchanged |

D-93B allowlist extended at both occurrences: `3263 passed, 0 failed` → `3288 passed, 0 failed`.

---

## Checks Run

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3288 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## No-Touch Guarantees

- `public/styles.css` — not modified
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `src/analysis-results.js` — not modified
- `migrations/` — not modified
- `wrangler.toml` — not modified
- Review/moderation handlers — not modified
- Public profile rendering — not modified
- No `alignment_labels` — permanently blocked
- No `top_beliefs_json` in any public API
