# D-285B — Pending-Review Truth Post-Submit Navigation Copy

**Scope:** Frontend + tests + docs
**Status:** COMPLETE — deploy needed (`public/app-v10.js` changed)
**Branch:** main (direct commit)
**Baseline before D-285B:** 3317 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Hardening after D-285B:** 3337 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-285B:** `d76680a`
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D285B_PENDING_REVIEW_TRUTH_POST_SUBMIT_NAVIGATION_COPY.md`, `docs/README.md`

---

## Purpose

After an owner submits a Truth for Review, send them directly to My HumanX — the view that already shows all owner truths (including pending-Review ones) with the yellow "Review" badge. Follows from D-285A finding that `GET /api/my-humanx` + `meRecentTruthsHtml()` already support this with no backend changes required.

---

## D-285A Finding (Recap)

- `GET /api/my-humanx` (worker.js line 319) has no `review_state` filter — returns all owner truths including pending.
- `meRecentTruthsHtml()` (app-v10.js line 296) renders each truth with its `review_state` badge: `ME_STATE_LABELS = {review:'Review'}`, `ME_STATE_CLR = {review:'b-yellow'}`.
- **No backend, schema, or API change was needed.** The gap was purely post-submission navigation.

---

## Changes Made

### `public/app-v10.js`

Three Truth submission success paths updated to navigate to `renderMe()` (My HumanX) instead of `renderTruths()` (public Truths tab):

| Function | Line | Before | After |
|----------|------|--------|-------|
| `submitTruth()` | 450 | `toast('Truth submitted for Review. It will appear publicly after approval.'); await renderTruths()` | `toast('Submitted for Review — you can see it in My HumanX with the Review badge.'); mode='me'; tab switch to tab-me; await renderMe()` |
| `submitBuilderTruth()` | 175 | `await renderTruths(); toast('Saved as Truth for Review. It will appear publicly after approval.')` | `mode='me'; tab switch to tab-me; await renderMe(); toast('Submitted for Review — you can see it in My HumanX with the Review badge.')` |
| `promoteBelief(snapshotId,'truth')` | 153 | `toast(...'Truth promoted to Review...'); mode='truths'; tab-truths active; await renderTruths()` | `toast(...'Submitted for Review — you can see it in My HumanX with the Review badge.'); mode='me'; tab-me active; await renderMe()` |

**Toast copy (new truths):**
```
Submitted for Review — you can see it in My HumanX with the Review badge.
```

**Toast copy (existing truth — `promoteBelief` `data.existing` path, unchanged):**
```
Truth reinforced — already in Truths.
```

Tab state is updated in all three paths: `mode='me'`, all `.tab` elements lose `active`, `tab-me` gains `active`.

---

## Behavior Preserved

| Guarantee | Value |
|-----------|-------|
| `review_state='review'` on Truth creation | Yes — unchanged in `src/truths.js` and `POST /api/truths` handler |
| No auto-publish | No change — Review gate remains admin-only |
| Review/moderation handlers | Unchanged |
| Public profile `/u/:slug` public-only filter | Unchanged |
| Public Truths tab public-only filter | Unchanged |
| `saveAnalysisResult()` posts only to `/api/analysis` | Unchanged |
| Saved analysis ↔ Truth boundary | Unchanged |
| `GET /api/my-humanx` truths query | Unchanged (worker.js line 319) |
| `meRecentTruthsHtml()` rendering | Unchanged |
| `ME_STATE_LABELS` / `ME_STATE_CLR` | Unchanged |
| D-271/D-272 AI-return import locks | Preserved |
| D-274/D-279 stale detection locks | Preserved |
| D-275 packet-ID storage locks | Preserved |
| D-277/D-281 saved-analysis provenance/private-boundary locks | Preserved |

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
| Review/moderation handlers | Unchanged |
| Public profile `/u/:slug` | Unaffected |

---

## Tests Added

20 new tests in `scripts/hardening-smoke-test.mjs` under `Section D-285B`:

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | `submitTruth no longer calls renderTruths()` | Old navigation pattern absent |
| 2 | `submitTruth calls renderMe()` | New navigation present |
| 3 | `submitBuilderTruth no longer calls renderTruths()` | Old navigation pattern absent |
| 4 | `submitBuilderTruth calls renderMe()` | New navigation present |
| 5 | `promoteBelief truth path switches tab to tab-me` | Tab state updated |
| 6 | `promoteBelief truth path calls renderMe()` | New navigation present |
| 7 | `post-submit toast mentions My HumanX` | Copy points owner to correct view |
| 8 | `post-submit toast mentions Review badge` | Copy describes badge they'll see |
| 9 | `renderMe() fetches from /api/my-humanx` | Data source unchanged |
| 10 | `meRecentTruthsHtml renders truths using ME_STATE_LABELS` | Rendering unchanged |
| 11 | `ME_STATE_CLR maps review to b-yellow` | Yellow badge constant preserved |
| 12 | `ME_STATE_LABELS maps review to Review label` | Label constant preserved |
| 13 | `submitTruth does not call /api/review/decision` | No direct publish after submission |
| 14 | `reviewDecisionUI still present` | Review handlers unchanged |
| 15 | `[D-271/D-272 lock] rp-return-section in renderExport` | AI-return lock preserved |
| 16 | `[D-274/D-279 lock] detectPacketStaleness pushes "claim updated since packet"` | Stale detection lock preserved |
| 17 | `[D-275 lock] saveAnalysisResult gates packet_id` | Packet-ID lock preserved |
| 18 | `[D-277/D-281 lock] saveAnalysisResult posts only to /api/analysis` | Analysis boundary lock preserved |
| 19 | `[D-277/D-281 lock] analysisItem renders Saved from RunPack provenance line` | Provenance lock preserved |
| 20 | `[D-277/D-281 lock] public profile does not expose Saved from RunPack` | Private boundary lock preserved |

One existing test updated: `promoteBelief truth path activates tab-truths` → `promoteBelief truth path activates tab-me (D-285B)` to reflect the new navigation target.

---

## Static Checks (D-285B)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3337 passed, 0 failed` (+20 vs D-285A baseline of 3317) |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-285A | No | Docs only |
| D-285B | **Yes — owner deployed** | PASS — D-285C live closeout |

## Live Sanity (D-285C — owner-verified, 2026-07-02)

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Owner can access Truth submission flow | PASS |
| 3 | `submitTruth()` success path sends owner to My HumanX | PASS |
| 4 | `submitBuilderTruth()` success path sends owner to My HumanX | PASS |
| 5 | `promoteBelief('truth')` success path sends owner to My HumanX | PASS |
| 6 | Toast: `Submitted for Review — you can see it in My HumanX with the Review badge.` | PASS |
| 7 | My HumanX tab opens after submission | PASS |
| 8 | Submitted pending Truth visible in My HumanX | PASS |
| 9 | Pending Truth shows yellow `Review` badge | PASS |
| 10 | `GET /api/my-humanx` remains owner pending Truth visibility source | PASS |
| 11 | Truth submissions still use `review_state='review'` | PASS |
| 12 | No submitted Truth publishes automatically | PASS |
| 13 | Admin Review remains the only approval path | PASS |
| 14 | Public Truths tab behavior unchanged for public/approved Truths | PASS |
| 15 | Public profile `/u/:slug` unaffected | PASS |
| 16 | Saved analysis remains separate from Truth submission | PASS |
| 17 | `saveAnalysisResult()` still posts only to `/api/analysis` | PASS |
| 18 | AI-return import locks preserved (`rp-return-section`, `Load AI Analysis Return`, `Saving does not publish a truth automatically`) | PASS |
| 19 | Stale detection still works (`claim updated since packet`) | PASS |
| 20 | Packet-ID storage still works | PASS |
| 21 | Saved-analysis provenance/private-boundary copy preserved | PASS |
| 22 | Review/moderation behavior unchanged | PASS |
| 23 | Drift/Belief expansion unaffected | PASS |
| 24 | No backend/API/schema/storage behavior changed | PASS |
| 25 | No console errors | PASS |

**Live sanity: 25/25 PASS**

Deployed Worker version: not captured.
