# D-278A — Saved Analysis Provenance Visibility Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3288 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Files changed:** `docs/D278A_SAVED_ANALYSIS_PROVENANCE_VISIBILITY_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`
**App changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No
**HEAD before D-278A:** `69d03d7`

---

## Purpose

Close the D-277 saved-analysis provenance visibility arc. Record the live baseline so future work starts from a known-good state.

---

## D-277 Arc Summary

| Task | Type | What it did |
|------|------|-------------|
| D-277A | Audit | Confirmed `packetId` is already returned by `GET /api/claims/:id` via `mapAnalysis()` (since D-275B) but not yet rendered anywhere in the frontend. Frontend-only implementation safe — no backend/schema changes needed. Docs only. Baseline unchanged: 3263/0/24/57. |
| D-277B | Implementation | `analysisItem()` in `public/app-v10.js` line 466: conditional `<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>` added after existing disclaimer, before meters block. 25 new regression tests. D-93B allowlist updated 3263 → 3288. Baseline: 3288/0/24/57. |
| D-277C | Live closeout | Owner deploy PASS (2026-07-02). 22/22 live sanity PASS. Deployed Worker version: not captured. |

**Tests added in arc:** 25 (3263 → 3288 total).
**Deploys in arc:** 1 (D-277C).
**Schema migrations applied:** 0.
**No backend/API/CSS/index/worker/Drift/Belief changes.**

---

## D-277A Audit Conclusion

- `packetId` already in scope from `mapAnalysis()` in every `a` object passed to `analysisItem()`
- Not rendered before D-277B — received but silently unused
- `rp_*` format contains no PII — safe to display to owner
- `loadPublicProfileSummary()` never calls `listAnalysisForClaim()` — no public exposure risk
- Frontend-only: no backend route, no schema column, no migration needed
- Implementation target identified: one conditional insertion in `analysisItem()` after disclaimer `<p>`

---

## D-277B Implementation

**File:** `public/app-v10.js` line 466 (`analysisItem()`)

**Change:** After `<p class="small ev-origin-note">AI analysis of supplied HumanX packet — not independent verification.</p>`, before `<div class="meters">`:

```javascript
${a.packetId?`<p class="small ev-origin-note">Saved from RunPack: ${esc(a.packetId)}</p>`:''}
```

**Guarantees:**
- Renders `Saved from RunPack: rp_...` only when `a.packetId` is non-null
- Renders nothing when `a.packetId` is null (historical rows, pre-D-275D saves)
- `esc(a.packetId)` applied — XSS safe
- Uses existing `small` and `ev-origin-note` classes only — no new CSS
- Existing meters still render after the disclaimer/provenance area
- No backend/schema/API/storage changes
- No CSS changes
- No `public/styles.css`, `public/index.html`, `public/belief-drift-expansion.js`, `src/worker.js`, or `src/analysis-results.js` changes

---

## Deployed Worker Version

Not captured (D-277C). D-277B deployed Worker version was not recorded during the live closeout.

---

## Visibility Boundary

| Surface | `Saved from RunPack` | `packetId` |
|---------|---------------------|-----------|
| Owner/private Study view (`analysisItem()`) | **Shown** when non-null | **Rendered** via `esc(a.packetId)` |
| Public profile `/u/:slug` | **Hidden** — `loadPublicProfileSummary` never calls `listAnalysisForClaim` | **Not exposed** |
| Public truth cards | **Hidden** — `truthCard()` never reads `analysis_results` | **Not exposed** |
| Review queue cards | **Hidden** — `reviewCard()` never calls `analysisItem()` | **Not exposed** |
| Authenticated `GET /api/claims/:id` response | Not rendered — `packetId` present in JSON but not surfaced by API consumers beyond `analysisItem()` | **Present** in `analyses` array |

D-277B regression test coverage:
- Test 8: `renderPublicProfileHtml` does not expose `packetId`
- Test 9: `renderPublicProfileHtml` does not expose `Saved from RunPack`
Both pass — boundary confirmed.

---

## Existing Lock Confirmation

### D-271/D-272 AI-return import visibility locks

| Lock | Status |
|------|--------|
| `rp-return-section` auto-expand condition | `lastPacket&&lastPacketClaimId===selected?.id` — unchanged |
| `Load AI Analysis Return` | Present — unchanged |
| `rp-return-next-step` copy | Present — unchanged |
| No-auto-publish copy | `Saving does not publish a truth automatically` — unchanged |
| `JSON.parse(text)` validation | Unchanged |
| `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` field extraction | Unchanged |
| `saveAnalysisResult()` posts only to `/api/analysis` | Unchanged |

### D-274 snapshot-hash stale detection locks

| Lock | Status |
|------|--------|
| `detectPacketStaleness()` checks `meta.source_snapshot_hash` | Unchanged |
| Compares against `simpleClaimHash(selected)` | Unchanged |
| Returns `source snapshot changed` | Unchanged |
| Stale threshold `3600000ms` | Unchanged |
| Generated-time stale warning | Unchanged |
| Evidence/test count stale checks | Unchanged |

### D-275 packet-ID storage locks

| Lock | Status |
|------|--------|
| `analysis_results.packet_id` exists live | Applied D-275D |
| `/api/analysis` accepts optional `packet_id` | Unchanged |
| Backend uses `cleanText(..., 80)`, not `cleanId()` | Unchanged |
| `rp_*` underscore format preserved | Unchanged |
| `saveAnalysisResult()` sends `packet_id` from matching `lastPacket` | Unchanged |
| Frontend gates on `lastPacketClaimId===selected?.id` | Unchanged |
| Missing `packet_id` remains allowed (null) | Unchanged |

### D-277 provenance visibility locks (new)

| Lock | Status |
|------|--------|
| `analysisItem()` renders provenance line only when `a.packetId` non-null | LIVE |
| Provenance line uses `small ev-origin-note` classes | LIVE |
| `esc(a.packetId)` applied | LIVE |
| No provenance line when `a.packetId` absent | LIVE |
| `renderPublicProfileHtml` does not expose `Saved from RunPack` | Regression-locked (D-277B test 9) |
| `renderPublicProfileHtml` does not expose `packetId` | Regression-locked (D-277B test 8) |

---

## Unaffected Areas Confirmed

| Area | Status |
|------|--------|
| Public profile `/u/:slug` | Unaffected — `loadPublicProfileSummary` uses count queries only |
| Public truth behavior | Unchanged — analysis save does not change `review_state` |
| Review/moderation | Unchanged — `requestApproveReview`, `requestRejectReview`, etc. all unchanged |
| Drift/Belief expansion | Unchanged — `belief-drift-expansion.js` not touched |
| CSP / external assets | No changes |
| `src/worker.js` | Not modified in D-277 arc |
| `public/styles.css` | Not modified in D-277 arc |
| `public/index.html` | Not modified in D-277 arc |

---

## No-Touch Confirmation

- `scripts/hardening-smoke-test.mjs` — not modified in D-278A
- `public/app-v10.js` — not modified in D-278A
- `public/styles.css` — not modified in D-278A
- `public/index.html` — not modified in D-278A
- `public/belief-drift-expansion.js` — not modified in D-278A
- `src/worker.js` — not modified in D-278A
- `src/analysis-results.js` — not modified in D-278A
- `migrations/` — not modified in D-278A
- All backend/API/auth/review/public-profile/CSP files — not modified in D-278A
