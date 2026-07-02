# D-279B — RunPack Stale Warning Wording Polish

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — deploy needed (`public/app-v10.js` changed)
**Branch:** main (direct commit)
**Baseline before:** 3288 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3298 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**New tests:** +10 (3 new D-279B assertions + 7 lock preservation tests; 3 existing test labels updated — count unchanged for those)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D279B_RUNPACK_STALE_WARNING_WORDING_POLISH.md`, `docs/README.md`
**App changes:** `public/app-v10.js` — one string in `detectPacketStaleness()` only
**CSS changes:** None
**Worker changes:** None — `src/worker.js` not modified
**Backend changes:** None — `src/analysis-results.js` not modified
**Schema/migration changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes — `public/app-v10.js` changed

---

## D-279A Finding Addressed

D-279A audit finding F-2:

> `source snapshot changed` is not user-facing friendly. A clearer label would be `claim data changed` or `claim updated since packet was built`. This is a frontend-only copy fix confined to `detectPacketStaleness()`. It requires no backend/schema change. However, `source snapshot changed` is regression-locked in D-274B, D-275B, and D-277B tests — any rename must update those tests.

This task implements the fix.

---

## Wording Replacement

**File:** `public/app-v10.js`
**Function:** `detectPacketStaleness()` (line 567)

| | Value |
|-|-------|
| **Old string** | `source snapshot changed` |
| **New string** | `claim updated since packet` |

**Change in context:**

```javascript
// Before:
if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('source snapshot changed');

// After:
if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('claim updated since packet');
```

**Detection logic unchanged:** The condition `meta.source_snapshot_hash!=null && simpleClaimHash(selected)!==meta.source_snapshot_hash` is identical. Only the pushed warning string changes.

---

## What Is Unchanged

| Item | Status |
|------|--------|
| `meta.source_snapshot_hash!=null` guard | Unchanged |
| `simpleClaimHash(selected)` call | Unchanged |
| Hash comparison operator `!==` | Unchanged |
| Stale threshold `3600000ms` | Unchanged |
| Generated-time stale warning (`packet is Nh old`) | Unchanged |
| Evidence count stale check | Unchanged |
| Pressure count stale check | Unchanged |
| Test count stale check | Unchanged |
| `rp-status-warn` chip styling | Unchanged |
| Status hint: `Rebuild the packet to capture the latest evidence and pressure.` | Unchanged |
| All D-271/D-272/D-274/D-275/D-277 locks | Preserved |

---

## No Backend / Schema / API / Storage Changes

- `src/analysis-results.js` — not modified
- `src/worker.js` — not modified
- `migrations/` — not modified
- `GET /api/claims/:id` — unchanged
- `POST /api/analysis` — unchanged

---

## No CSS Changes

- `public/styles.css` — not modified
- `public/index.html` — not modified

---

## Smoke Test Changes

### Updated existing test labels (3 tests — assertion strings updated, `test()` count unchanged)

| Block | Old label / assertion | New label / assertion |
|-------|-----------------------|-----------------------|
| D-274B | `pushes "source snapshot changed" on hash mismatch` / checks for `'source snapshot changed'` | `pushes user-facing stale copy on hash mismatch (D-279B: now "claim updated since packet")` / checks for `'claim updated since packet'` |
| D-275B | `pushes "source snapshot changed" (D-274 lock)` / checks for `source snapshot changed` | `pushes user-facing stale copy on hash mismatch (D-279B: now "claim updated since packet")` / checks for `claim updated since packet` |
| D-277B | `[D-274 lock]: detectPacketStaleness still pushes "source snapshot changed"` / checks for `source snapshot changed` | `[D-274 lock / D-279B]: detectPacketStaleness pushes user-facing stale copy on hash mismatch` / checks for `claim updated since packet` |

### New D-279B block (10 tests)

| # | Category | What is tested |
|---|----------|---------------|
| 1 | Wording | `detectPacketStaleness` pushes `claim updated since packet` |
| 2 | Wording | Old string `source snapshot changed` absent from `detectPacketStaleness` |
| 3 | Logic | Hash comparison logic unchanged: `meta.source_snapshot_hash`, `simpleClaimHash(selected)`, `meta.source_snapshot_hash!=null` |
| 4 | Logic | Stale threshold `3600000ms` unchanged |
| 5 | D-271 lock | `rp-return-section` still present |
| 6 | D-271 lock | `Load AI Analysis Return` still present |
| 7 | D-271 lock | No-auto-publish guidance still present |
| 8 | D-275 lock | `saveAnalysisResult` gates packet_id on `lastPacketClaimId===selected?.id` |
| 9 | D-277 lock | `analysisItem` still renders `Saved from RunPack:` |
| 10 | D-277 lock | `renderPublicProfileHtml` does not expose `Saved from RunPack` |

D-93B allowlist updated at both occurrences: `3288 passed, 0 failed` → `3298 passed, 0 failed`.

---

## Checks Run

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3298 passed, 0 failed` |
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
