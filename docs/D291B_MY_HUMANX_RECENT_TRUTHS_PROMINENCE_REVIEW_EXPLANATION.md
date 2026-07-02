# D-291B — My HumanX Recent Truths Prominence

**Scope:** Frontend-only (`public/app-v10.js`, `scripts/hardening-smoke-test.mjs`)
**Status:** COMPLETE — owner deployed (D-291C live closeout: 24/24 PASS)
**Branch:** main (direct commit)
**Baseline before D-291B:** 3383 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after D-291B:** 3405 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-291B:** `7d1b7a6` (D-291A)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D291B_MY_HUMANX_RECENT_TRUTHS_PROMINENCE_REVIEW_EXPLANATION.md`, `docs/README.md`

---

## Purpose

After D-285B made My HumanX the post-submit landing page for Truth submissions, the "Recent Truths" panel was still located near the bottom of the page — after Recent Claims, Belief Snapshots, Belief Mirror, Belief Reflection, and Reflection Avatar. An owner arriving from "Submit Truth for Review" had to scroll through six dense sections to see their just-submitted Truth.

D-291B moves "Recent Truths" immediately after the filter bar, making the post-submit confirmation visible on arrival. It also adds a one-line explanation note inside the panel that tells the owner what "Review" means.

---

## Changes

### `public/app-v10.js` — `renderMeHtml()` (line 385)

**Section order before D-291B:**
1. Filter bar
2. Recent Claims
3. Belief Snapshots
4. Belief Mirror
5. Belief Reflection
6. Reflection Avatar
7. **Recent Truths** ← was here
8. Recent Evidence
9. Recent Pressure

**Section order after D-291B:**
1. Filter bar
2. **Recent Truths** ← moved up
3. Recent Claims
4. Belief Snapshots
5. Belief Mirror
6. Belief Reflection
7. Reflection Avatar
8. Recent Evidence
9. Recent Pressure

**Review explanation note added inside Recent Truths panel:**
```
Review: awaiting admin approval — goes Public when approved.
```

Rendered as `<p class="small builder-field-note">` immediately after the `<h3>Recent Truths</h3>` heading, matching the archive-note pattern used in the Recent Claims panel.

### `scripts/hardening-smoke-test.mjs`

- 20 new D-291B tests added (section immediately before Summary line)
- 2 existing tests updated to reflect new section order:
  - `D-137E: section order puts Belief Snapshots before Recent Truths/Evidence/Pressure` → updated to verify new order: `Recent Truths → Recent Claims → Belief Snapshots → Recent Evidence → Recent Pressure`
  - `D-139B: Mirror is placed after Belief Snapshots and before Recent Truths` → updated to verify only `Belief Snapshots → Mirror` (Recent Truths now above both, so "before Recent Truths" constraint removed)

---

## Copy

| Location | Copy |
|----------|------|
| `<h3>` heading | `Recent Truths` (unchanged) |
| Explanation note | `Review: awaiting admin approval — goes Public when approved.` |
| Badge label (Review state) | `Review` (unchanged — `ME_STATE_LABELS.review`) |
| Badge color (Review state) | `b-yellow` (unchanged — `ME_STATE_CLR.review`) |

---

## Safety

| Concern | Status |
|---------|--------|
| Template reorder only | No logic, data, or API changes |
| `meRecentTruthsHtml()` unchanged | Only its call site moved |
| `meFilterBarHtml()` unchanged | Filter bar still renders first |
| Public profile unaffected | `renderPublicProfileHtml()` not modified |
| Backend/API/schema | Not modified |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| Review/moderation handlers | Not modified |
| D-285B post-submit navigation | Preserved — `submitTruth()` still calls `renderMe()` + `tab-me` |
| Draft Truth from analysis | Unchanged — still prefill-only, no auto-submit |

---

## Tests

| Category | Count |
|----------|-------|
| New D-291B tests | 20 |
| Existing tests updated | 2 (D-137E, D-139B) |
| Total regression tests (after) | 3405 |

**New D-291B test coverage:**
1. `renderMeHtml()` renders "Recent Truths" panel
2. Recent Truths appears before Recent Claims (positional)
3. Recent Truths appears before Belief Snapshots (positional)
4. Recent Truths appears before Belief Mirror (positional)
5. Recent Truths appears before Belief Reflection (positional)
6. Review explanation note present: `"Review: awaiting admin approval — goes Public when approved"`
7. Yellow `b-yellow` badge preserved for Review state
8. `renderMe()` still calls `GET /api/my-humanx`
9. `meRecentTruthsHtml` not in `renderPublicProfileHtml`
10. Public profile does not include `renderMeHtml` or "Recent Truths"
11. Public profile does not expose `analysisItem` or `packetId`
12. Review/moderation handlers (`requestApproveReview`, `requestRejectReview`, `reviewDecisionUI`) still defined
13. Truth submission still references `review_state`
14. D-285B post-submit navigation preserved (`renderMe()`, `tab-me`, toast)
15. `saveAnalysisResult()` still posts only to `/api/analysis`
16. `draftTruthFromAnalysis()` does not call `submitTruth()`
17. Draft action still uses `plainLanguageSummary`
18. Draft action does not use `verdict` as Truth content
19. No backend files modified
20. Drift/Belief expansion files untouched

---

## Static Checks

| Check | Before D-291B | After D-291B |
|-------|---------------|--------------|
| `node --check public/app-v10.js` | exit 0 | exit 0 |
| `hardening-smoke-test.mjs` | `3383 passed, 0 failed` | `3405 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 warn` | `57 passed, 0 failed / 1 warn` |

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-291A | No | Product pass / docs only |
| D-291B | **Yes — owner deployed** | PASS — D-291C live closeout (24/24) |
| D-291C | No | Live closeout |

### D-291C Live Sanity (2026-07-02) — 24/24 PASS

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Owner opens My HumanX without console-breaking errors | PASS |
| 3 | My HumanX filter bar appears | PASS |
| 4 | Recent Truths appears immediately after filter bar | PASS |
| 5 | Recent Truths appears before Recent Claims | PASS |
| 6 | Recent Truths appears before Belief Snapshots / Mirror / Reflection / Avatar | PASS |
| 7 | Review explanation present: `"Review: awaiting admin approval — goes Public when approved."` | PASS |
| 8 | Pending Review Truths still appear in My HumanX | PASS |
| 9 | Pending Review Truths still show yellow Review badge | PASS |
| 10 | Approved/Public Truths remain visible as before | PASS |
| 11 | Data source remains `GET /api/my-humanx` | PASS |
| 12 | Public profile `/u/:slug` unaffected | PASS |
| 13 | Public profile does not expose saved-analysis metadata | PASS |
| 14 | Review/moderation behavior unchanged | PASS |
| 15 | Truth submission still uses `review_state='review'` | PASS |
| 16 | D-285B post-submit navigation preserved (`renderMe()`, `tab-me`, toast) | PASS |
| 17 | Saved analysis remains separate from Truth submission | PASS |
| 18 | Draft Truth from analysis remains draft-only | PASS |
| 19 | Draft action still uses `plainLanguageSummary` | PASS |
| 20 | Draft action does not use `verdict` as Truth content | PASS |
| 21 | `saveAnalysisResult()` still posts only to `/api/analysis` | PASS |
| 22 | No backend/API/schema/storage behavior changed | PASS |
| 23 | Drift/Belief expansion unaffected | PASS |
| 24 | No console errors | PASS |

**Deployed Worker version:** not captured
