# D-292A — My HumanX Recent Truths Prominence Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3405 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-292A:** `c044523` (D-291C)
**Files changed:** `docs/D292A_MY_HUMANX_RECENT_TRUTHS_PROMINENCE_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-291 My HumanX owner dashboard product pass / Recent Truths prominence arc with a single durable checkpoint. Future owner-dashboard work starts from the correct live baseline recorded here.

---

## D-291 Arc Summary

### D-291A — My HumanX Owner Dashboard Product Pass (docs only)

Full 19-question product pass over My HumanX now that it is the post-submit Truth landing page (D-285B). Key findings:

- **Highest friction:** "Recent Truths" panel was at position 12 in `renderMeHtml()` — after Account card, Profile Settings, My Content counts, filter bar, Recent Claims, Belief Snapshots, Belief Mirror, Belief Reflection, and Reflection Avatar. An owner who just submitted a Truth (the most common post-D-285B flow) had to scroll past all of these sections before finding the item they just created.
- **Secondary gap:** No explanation anywhere on the page told the owner what "Review" meant — when it would resolve, or what happens when it does.
- **Workflow status:** Structurally correct. Data returns correctly. Display order was the only gap.
- **D-291B candidate:** Move "Recent Truths" above "Recent Claims" in `renderMeHtml()` + add a one-line Review explanation. Frontend-only. Baseline unchanged: 3383/0/24/57. No deploy.

### D-291B — My HumanX Recent Truths Prominence

`renderMeHtml()` updated to move "Recent Truths" immediately after the filter bar.

**Section order before D-291B:**
1. Filter bar
2. Recent Claims
3. Belief Snapshots
4. Belief Mirror
5. Belief Reflection
6. Reflection Avatar
7. **Recent Truths** ← was here (position 7 of 9)
8. Recent Evidence
9. Recent Pressure

**Section order after D-291B:**
1. Filter bar
2. **Recent Truths** ← moved up (position 1 of 9)
3. Recent Claims
4. Belief Snapshots
5. Belief Mirror
6. Belief Reflection
7. Reflection Avatar
8. Recent Evidence
9. Recent Pressure

**Review explanation added inside Recent Truths panel:**
```
Review: awaiting admin approval — goes Public when approved.
```

20 new D-291B tests added. 2 existing tests updated (D-137E "section order", D-139B "Mirror placement") to reflect the new order. Baseline 3383 → 3405.

### D-291C — Live Closeout

- Owner deploy PASS (2026-07-02)
- 24/24 live sanity PASS
- Deployed Worker version: not captured

---

## D-291 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| `Recent Truths` position | Immediately after filter bar — first content panel in `renderMeHtml()` |
| `Recent Truths` before `Recent Claims` | Yes |
| `Recent Truths` before Belief Snapshots / Mirror / Reflection / Avatar | Yes |
| Review explanation copy | `"Review: awaiting admin approval — goes Public when approved."` |
| Yellow `Review` badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` |
| `GET /api/my-humanx` data source | Unchanged — no `review_state` filter; all owner truths returned |
| Pending Review Truths in My HumanX | Still appear with yellow `Review` badge |
| Approved/Public Truths in My HumanX | Still appear with green `Public` badge + "View in Truths →" |
| `review_state='review'` on submission | Yes — `src/truths.js` unchanged |
| Admin Review gate | Unchanged — `POST /api/review/decision` admin-only |
| Public profile `/u/:slug` | Unaffected — `renderPublicProfileHtml()` not modified |
| Saved analysis separate from Truth submission | Yes — `saveAnalysisResult()` → `/api/analysis` only |
| No backend/API/schema/CSS/index/worker changes in D-291 | Confirmed |

---

## Preserved Previous Locks

### D-285 Owner Pending-Review Truth Visibility

| Lock | Value |
|------|-------|
| All three Truth submission success paths navigate to My HumanX | `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')` — all use `renderMe()` + `tab-me` |
| Post-submit toast | `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| Pending Truths in My HumanX | Yellow `Review` badge — unchanged |

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

### D-289 Saved-Analysis Card Context Consolidation

| Lock | Value |
|------|-------|
| Compact context line | `"Private analysis · not public truth · not independent verification"` always shown |
| Old separate "Private analysis note" line | Removed |
| Old separate "Saved from RunPack:" label | Removed |
| RunPack provenance | `"· RunPack: ${esc(a.packetId)}"` when `a.packetId` exists |
| RunPack provenance absent | Omitted when no packetId |
| `esc(a.packetId)` | Preserved — XSS-escaped |

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
| `public/app-v10.js` | Not modified in D-292A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-292A |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |

---

## Static Checks (D-292A)

Docs-only change — no code files modified. Baseline unchanged.

| Check | Expected |
|-------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3405 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-291A | No | Product pass / docs only |
| D-291B | **Yes — owner deployed** | PASS — D-291C live closeout (24/24) |
| D-291C | No | Live closeout |
| D-292A | No | Checkpoint / docs only |
