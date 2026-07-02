# D-275B — RunPack Packet-ID Storage Branch Implementation

**Scope:** Schema migration + backend handler + frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-275D, 2026-07-02) — 22/22 live sanity PASS
**Branch:** `d275b-runpack-packet-id-storage`
**Baseline before:** 3239 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3263 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**New tests:** +24 (D-275B block: 20 new; 3 prior slice-width fixes for D-189C/D-268B/D-269A; 1 net wash)
**Files changed:** `migrations/0017_analysis_results_packet_id.sql` (new), `src/analysis-results.js`, `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D275B_RUNPACK_PACKET_ID_STORAGE_BRANCH_IMPLEMENTATION.md`, `docs/README.md`
**App changes:** `public/app-v10.js` line 573 (`saveAnalysisResult()`) only
**CSS changes:** None
**Worker changes:** None — `src/worker.js` not modified
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No — deployed (D-275D, 2026-07-02)
**Migration applied live:** YES — `0017_analysis_results_packet_id.sql` applied to `humanx` D1 (D-275D, 2026-07-02)
**Deployed Worker version:** `759acc15-a6dd-4e50-a070-0d3356e5c257`

---

## Why Branch Workflow Is Required

F-5 requires coordinated changes across three layers:
1. **Schema migration** — new `packet_id TEXT` column on `analysis_results`
2. **Backend handler** — `src/analysis-results.js` must accept and store it
3. **Frontend** — `saveAnalysisResult()` must include it in the POST body

Deploying the frontend change without the migration would silently drop `packet_id` (column doesn't exist). Deploying the backend without the migration would throw a D1 error on INSERT. The migration must be applied to live D1 first. Per workflow rules, backend/schema/migration changes require branch/PR style.

---

## Schema Change

**New file:** `migrations/0017_analysis_results_packet_id.sql`

```sql
ALTER TABLE analysis_results ADD COLUMN packet_id TEXT;
```

Additive only — no DROP, no RENAME TABLE, no default value required. Existing rows will have `packet_id = NULL`. This is correct: they were saved before packet-ID storage was implemented.

**Not yet applied to live D1.** The migration file is committed to the branch. Owner must apply it via the D1 console or Wrangler before deploying the backend/frontend changes.

---

## Backend Change

**File:** `src/analysis-results.js`

### 1. Read and sanitize from request body

After `const id = makeId('anl');`, added:

```javascript
const packetId = cleanText(body.packet_id || '', 80) || null;
```

**Sanitizer decision:** `cleanText(..., 80)` is used instead of `cleanId()`. `cleanId()` strips underscores, which would corrupt `rp_*`-format packet IDs. `cleanText` preserves the full ID string while capping length at 80 characters. Existing packet IDs fit comfortably within 80 chars (e.g. `rp_abc123_lc2x9k`).

### 2. INSERT column list and bind

Added `packet_id` to the INSERT column list (14 → 15 columns) and bound `packetId` in the corresponding position:

```javascript
INSERT INTO analysis_results (
  id,claim_id,user_id,source,verdict,evidence_score,testability,survivability,
  strongest_support_json,strongest_pressure_json,missing_tests_json,
  plain_language_summary,raw_json,packet_id,created_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
```

`packetId` is bound as the 14th positional arg (before `now`).

### 3. mapAnalysis() return

Added `packetId: a.packet_id || null` to the `mapAnalysis()` return object, so API callers receive the field (as `null` for historical rows).

---

## Frontend Change

**File:** `public/app-v10.js` line 573 (`saveAnalysisResult()`)

Before the `await api(...)` call, added packet-ID resolution:

```javascript
const _rppid = (lastPacket && lastPacketClaimId === selected?.id)
  ? (() => { try { return JSON.parse(lastPacket).packet_id || null } catch(e) { return null } })()
  : null;
```

Then included `packet_id: _rppid` in the POST body:

```javascript
await api('/api/analysis', {
  method: 'POST',
  body: JSON.stringify({ claimId: selected.id, source: 'runpack-user', raw: result, packet_id: _rppid })
});
```

**Gate:** `lastPacket && lastPacketClaimId === selected?.id` — the same gate used for auto-expand and "Recreate Packet" display. This prevents forwarding a stale `packet_id` from a packet built for a different claim. If the gate is false, `_rppid = null` and the backend stores `NULL`.

**Source:** `JSON.parse(lastPacket).packet_id` — reads from the current session packet, not from the AI return JSON. The AI return `packet_id` (which the advisory toast already reads) is intentionally not used here: it may be stale or absent if the AI's output didn't echo it.

**All other behavior unchanged:**
- `JSON.parse(text)` validation
- `parsed.output || parsed.result || parsed.analysis || parsed` field extraction
- Success/failure toasts
- POST target `/api/analysis`
- No-auto-publish behavior
- Advisory mismatch toast (unchanged — still non-blocking)

---

## Smoke Test Changes

### Updated prior slice widths (3 tests)

D-275B adds ~170 chars to `saveAnalysisResult()` before the `await api(...)` call. Three prior tests used fixed 600/800-char slices that no longer reached their checked string:

| Test | Old slice | New slice | Reason |
|------|-----------|-----------|--------|
| D-189C: analysis toast mentions verdict | `idx + 800` | `idx + 950` | `'verdict'` in success toast now beyond 800 chars |
| D-268B: saveAnalysisResult posts to /api/analysis | `sarIdx + 600` | `sarIdx + 950` | `'/api/analysis'` now beyond 600 chars |
| D-269A [runpack-lock]: saveAnalysisResult posts to /api/analysis | `sarIdx + 600` | `sarIdx + 950` | Same reason |

### New D-275B block (20 tests)

| # | Category | What is tested |
|---|----------|---------------|
| 1 | Migration | `0017` adds `packet_id` column to `analysis_results` |
| 2 | Migration | `0017` is additive only — no DROP, no RENAME TABLE |
| 3 | Backend | `analysis-results.js` reads `body.packet_id` |
| 4 | Backend | Sanitized with `cleanText`, not `cleanId` |
| 5 | Backend | `cleanId(body.packet_id)` not used |
| 6 | Backend | `packet_id` present in INSERT INTO analysis_results |
| 7 | Backend | Falls back to null when absent (nullable) |
| 8 | Frontend | `saveAnalysisResult` includes `packet_id` in POST body |
| 9 | Frontend | `packet_id` read from `lastPacket`, not from AI return |
| 10 | Frontend | `JSON.parse(text)` validation unchanged |
| 11 | Frontend | Field extraction unchanged |
| 12 | Frontend | Posts to `/api/analysis` only |
| 13 | Boundary | `packet_id` not exposed via `renderPublicProfileHtml` |
| 14 | Boundary | `rp-return-section` absent from public profile (D-271 lock) |
| 15 | Boundary | `Load AI Analysis Return` absent from public profile (D-271 lock) |
| 16 | Moderation | `requestApproveReview` still defined |
| 17 | Moderation | `requestRejectReview` still defined |
| 18 | D-274 lock | `source_snapshot_hash` check still in `detectPacketStaleness` |
| 19 | D-274 lock | `simpleClaimHash(selected)` still called |
| 20 | D-274 lock | "source snapshot changed" still pushed |
| 21 | D-274 lock | Stale threshold `3600000` unchanged |
| 22 | Boundary | `belief-drift-expansion.js` not modified |
| 23 | Boundary | `styles.css` not modified |
| 24 | Integrity | Migration file contains no wrangler/d1 execute commands |

---

## Checks Run

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `node --check src/worker.js` | no output, exit 0 |
| `node --check src/analysis-results.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3263 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Migration Status

- Migration file created: `migrations/0017_analysis_results_packet_id.sql` ✓
- Migration applied to live D1: **NO — pending owner approval**
- No `wrangler d1 migrations apply` was run
- No live-write smoke tests were run

**Deployment sequence (owner task):**
1. Apply migration to live D1: `ALTER TABLE analysis_results ADD COLUMN packet_id TEXT`
2. Deploy Worker (includes updated `src/analysis-results.js`)
3. Deploy frontend (`public/app-v10.js`)
4. Run live sanity checks

---

## Deploy Status

- No deploy run during D-275B
- Branch `d275b-runpack-packet-id-storage` is not merged to `main`
- Merge and deploy remain pending owner approval

---

## Behavior Guarantees Preserved

| Item | Status |
|------|--------|
| `JSON.parse(text)` validation | Unchanged |
| `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` | Unchanged |
| Success toast copy | Unchanged |
| Failure toast copy | Unchanged |
| POST target `/api/analysis` | Unchanged |
| No-auto-publish behavior | Unchanged |
| Advisory mismatch toast (non-blocking) | Unchanged |
| `rp-return-section` auto-expand | Unchanged |
| `rp-return-next-step` copy | Unchanged |
| `detectPacketStaleness` source_snapshot_hash check | Unchanged |
| `simpleClaimHash(selected)` stale check | Unchanged |
| Stale threshold `3600000ms` | Unchanged |
| Public truth state | Unchanged |
| Review/moderation | Unchanged |
| Public profile boundary | Unchanged |
| `src/worker.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `wrangler.toml` | Not modified |
| No `alignment_labels` | Permanently blocked |
| No `top_beliefs_json` in any public API | Confirmed |

---

## No-Touch Guarantees

- `selectClaim`, `studyFromVault`, `attachEvidencePrompt` — not touched
- `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview` — not touched
- `public/belief-drift-expansion.js` — not touched
- `public/index.html` — not touched
- `public/styles.css` — not touched
- `src/worker.js` — not touched
- `wrangler.toml` — not touched
- No `alignment_labels` — permanently blocked
- No `top_beliefs_json` in any public API

---

## D-275D — Live Closeout (2026-07-02)

**Branch merged to main:** PASS (`git merge --ff-only d275b-runpack-packet-id-storage`) — main HEAD `53a8363`
**D1 migration applied:** PASS — `0017_analysis_results_packet_id.sql` applied to live `humanx` database (f68709d8-b93a-4e5b-8a0e-5b58cc357125) — 2 commands executed in 0.71ms
**Owner deploy:** PASS — `npx wrangler deploy` — `759acc15-a6dd-4e50-a070-0d3356e5c257`
**Deployed Worker version:** `759acc15-a6dd-4e50-a070-0d3356e5c257`
**Live packet-ID storage sanity:** PASS — 22/22

### Post-deploy static checks

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `node --check src/worker.js` | no output, exit 0 |
| `node --check src/analysis-results.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3263 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

### Live sanity results (22/22 PASS)

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Claim/RunPack area opens without console-breaking errors | PASS |
| 3 | Existing claim can be selected | PASS |
| 4 | RunPack/Investigation Packet can be generated or displayed | PASS |
| 5 | AI-return import area still appears | PASS |
| 6 | `rp-return-section` auto-expands only when `lastPacket && lastPacketClaimId === selected?.id` | PASS |
| 7 | `rp-return-next-step` copy still appears | PASS |
| 8 | Copy still tells user to paste AI/JSON return | PASS |
| 9 | Copy still states "Saving does not publish a truth automatically" | PASS |
| 10 | Parser behavior unchanged (`JSON.parse`, field extraction) | PASS |
| 11 | `saveAnalysisResult` still posts only to `/api/analysis` | PASS |
| 12 | Saving analysis with a matching loaded RunPack includes `packet_id` in stored result | PASS |
| 13 | Existing save behavior still works when `packet_id` is absent | PASS |
| 14 | Stored packet ID preserves underscore format (`rp_*`) | PASS |
| 15 | Public truth state unchanged | PASS |
| 16 | Review/moderation unchanged | PASS |
| 17 | Public profile `/u/:slug` unaffected | PASS |
| 18 | Snapshot-hash stale detection still works (`source snapshot changed`) | PASS |
| 19 | Generated-time stale warning still works | PASS |
| 20 | Evidence/test count stale checks still work | PASS |
| 21 | Drift/Belief expansion unaffected | PASS |
| 22 | No console errors | PASS |
