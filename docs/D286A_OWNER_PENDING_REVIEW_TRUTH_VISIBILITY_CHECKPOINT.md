# D-286A — Owner Pending-Review Truth Visibility Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3337 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-286A:** `685e54e`
**Files changed:** `docs/D286A_OWNER_PENDING_REVIEW_TRUTH_VISIBILITY_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-285 owner pending-Review Truth visibility arc with a single durable checkpoint. Future Truth workflow work starts from the correct live baseline recorded here.

---

## D-285 Arc Summary

### D-285A — Audit (docs only)

Full audit of whether owners can see their own pending-Review Truths. Key finding:

- **`GET /api/my-humanx`** (worker.js line 319) has no `review_state` filter:
  ```sql
  SELECT id, statement, category, origin, review_state, created_at, updated_at
  FROM truths WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20
  ```
  Returns all owner truths including `review_state='review'` items.

- **`meRecentTruthsHtml()`** (app-v10.js line 296) already renders pending-Review truths with:
  - `ME_STATE_LABELS = {review:'Review'}` — "Review" label
  - `ME_STATE_CLR = {review:'b-yellow'}` — yellow badge

- **D-283A/D-284A F-1 was overstated.** The finding stated `renderMe()` fetched from `GET /api/me` which filtered to `review_state='public'` only. This was incorrect — `renderMe()` calls `GET /api/my-humanx`, not `GET /api/me`. The line 788 public-filter query is in `loadPublicProfileSummary` (public `/u/:slug`), not in the owner dashboard.

- **Remaining gap (post-audit):** After `submitTruth()`, `submitBuilderTruth()`, or `promoteBelief('truth')`, the code navigated to `renderTruths()` (public tab) where pending truths are not visible. Owner was not directed to My HumanX.

- **D-285B classified: frontend-only.** No backend/schema/API change needed.

### D-285B — Implementation

Three Truth submission success paths changed to navigate to My HumanX:

| Function | Before | After |
|----------|--------|-------|
| `submitTruth()` | `renderTruths()` | `renderMe()` + `tab-me` |
| `submitBuilderTruth()` | `renderTruths()` | `renderMe()` + `tab-me` |
| `promoteBelief('truth')` | `renderTruths()` + `tab-truths` | `renderMe()` + `tab-me` |

**New toast:**
```
Submitted for Review — you can see it in My HumanX with the Review badge.
```

**Existing truth toast** (`promoteBelief` `data.existing` path, unchanged):
```
Truth reinforced — already in Truths.
```

20 new tests + 1 existing test updated (`promoteBelief truth path activates tab-me`). Baseline 3317 → 3337.

### D-285C — Live Closeout

- Owner deploy PASS (2026-07-02)
- 25/25 live sanity PASS
- Deployed Worker version: not captured

---

## D-285 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| Owner can see pending-Review Truths in My HumanX | **Yes** — `GET /api/my-humanx` returns all owner truths without `review_state` filter |
| Pending truths show yellow `Review` badge | **Yes** — `ME_STATE_CLR = {review:'b-yellow'}` + `ME_STATE_LABELS = {review:'Review'}` |
| Post-submission navigation | **My HumanX** — all three paths use `renderMe()` + `tab-me` |
| `review_state='review'` on new Truth | **Yes** — unchanged in `src/truths.js` and `POST /api/truths` handler |
| No auto-publish | **No** — Review gate preserved |
| Admin Review remains the only approval path | **Yes** — `reviewDecisionUI`, `POST /api/review/decision` unchanged |
| Public Truths tab behavior | **Unchanged** — shows only `review_state='public'` truths |
| Public profile `/u/:slug` | **Unchanged** — `COALESCE(review_state,'public')='public'` filter preserved |
| Pending truths visible on public profile | **No** — public profile filter unchanged |
| Saved analysis separate from Truth submission | **Yes** — `saveAnalysisResult()` posts only to `/api/analysis` |
| No new backend route | **Yes** — `GET /api/my-humanx` already existed |
| No schema/storage change | **Yes** — zero migrations in D-285 |

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

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-286A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-286A |
| `src/worker.js` | Not modified in D-285 or D-286A |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| Backend/API/schema/storage | No changes in D-285 |
| Review/moderation handlers | Unchanged |
| Public profile `/u/:slug` | Unaffected |

---

## Static Checks (D-286A baseline)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3337 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-285A | No | Audit / docs only |
| D-285B | **Yes — owner deployed** | PASS — D-285C live closeout |
| D-285C | No | Live closeout |
| D-286A | No | Docs only |
