# D-274B — RunPack Snapshot-Hash Stale Detection Implementation

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-274C, 2026-07-02) — 24/24 live sanity PASS
**Baseline before:** 3217 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after:** 3239 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**New tests:** +22 (D-274B block: 22 new; 3 prior F-4-deferred tests updated)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D274B_RUNPACK_SNAPSHOT_HASH_STALE_DETECTION_IMPLEMENTATION.md`, `docs/README.md`
**App changes:** `public/app-v10.js` line 567 (`detectPacketStaleness()`) only
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No — deployed (D-274C, 2026-07-02)

---

## Purpose

Implements F-4 (snapshot-hash stale detection) as identified in D-268A and audited in D-274A. Adds a content-level stale signal to `detectPacketStaleness()` by comparing the packet's stored `source_snapshot_hash` against a fresh `simpleClaimHash(selected)` computation.

---

## Change

### `public/app-v10.js` — line 567 (`detectPacketStaleness()`)

One `if` block inserted after the existing `test_count` check and before the `generated_at` age check:

```javascript
if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('source snapshot changed');
```

**Before:**
```
...if(meta.test_count!=null&&meta.test_count!==(selected.tests||[]).length)w.push('test count changed');if(meta.generated_at){...
```

**After:**
```
...if(meta.test_count!=null&&meta.test_count!==(selected.tests||[]).length)w.push('test count changed');if(meta.source_snapshot_hash!=null&&simpleClaimHash(selected)!==meta.source_snapshot_hash)w.push('source snapshot changed');if(meta.generated_at){...
```

No other functions changed.

---

## Behavior

| Condition | Stale warning fired |
|-----------|-------------------|
| `meta.source_snapshot_hash` is null/absent (old packets without the field) | No — guarded |
| `simpleClaimHash(selected) === meta.source_snapshot_hash` (unchanged) | No |
| `simpleClaimHash(selected) !== meta.source_snapshot_hash` (claim changed) | Yes — "source snapshot changed" appended to stale warning |

The `source snapshot changed` string is appended to `w[]` and joined with `·` in the existing stale chip, consistent with other stale reasons ("evidence count changed", "packet is Xh old", etc.).

---

## Known Limitation (from D-274A audit)

For **backend-generated packets**, `workerSnapshotHash()` was used at generation time (richer: includes all evidence/pressure/test IDs and `created_at`/`updated_at` timestamps sorted). The frontend recomputation uses `simpleClaimHash(selected)` (coarser: counts + `claim.updated_at` only).

This means:
- Count changes or claim `updated_at` changes → stale fires correctly.
- Content edits to evidence/pressure/test items that don't change counts or `updated_at` → stale may not fire.

This is the same limitation the existing count-based checks have. It is better than the pre-D-274B state (no hash comparison at all) and is acceptable for a frontend-only implementation.

For **fallback packets**, `simpleClaimHash(selected)` is an **exact match** comparison (same algorithm, same inputs) — stale detection is precise.

---

## Smoke Test Changes

### New D-274B block (22 tests)

1. `detectPacketStaleness` checks `meta.source_snapshot_hash`
2. Comparison uses `simpleClaimHash(selected)`
3. Pushes `"source snapshot changed"` on mismatch
4. Guard: `source_snapshot_hash!=null` (no false positives on old packets)
5. Stale threshold still `3600000ms`
6. `generated_at` age check still present
7. Evidence count check still present
8. Test count check still present
9. `simpleClaimHash` still defined
10. F-5 `packet_id` advisory still non-blocking (deferred)
11. `worker.js` not modified by D-274B
12. `styles.css` not modified by D-274B
13. `detectPacketStaleness` not called from `renderPublicProfileHtml`
14. `simpleClaimHash` not called from `renderPublicProfileHtml`
15. `rp-return-section` still present (D-271 lock)
16. `Load AI Analysis Return` still present (D-271 lock)
17. Auto-expand condition unchanged (D-271 lock)
18. `rp-return-next-step` still present (D-271 lock)
19. No-auto-publish copy unchanged (D-271 lock)
20. `JSON.parse` validation unchanged (D-271 lock)
21. Field extraction unchanged (D-271 lock)
22. `saveAnalysisResult` posts to `/api/analysis` only (D-271 lock)

### Updated prior F-4-deferred tests (3 tests, same assertions flipped)

| Test | Old assertion | New assertion |
|------|--------------|---------------|
| D-269A [stale-lock] test 24 | `!staleSlice.includes('source_snapshot_hash')` | `staleSlice.includes('source_snapshot_hash')` |
| D-271A test 19 | `!staleSlice.includes('source_snapshot_hash')` | `staleSlice.includes('source_snapshot_hash')` |
| D-272A test 34 | `!staleSlice.includes('source_snapshot_hash')` | `staleSlice.includes('source_snapshot_hash')` |

---

## Behavior Guarantees Preserved

| Item | Status |
|------|--------|
| Existing count-based stale checks | Unchanged |
| `generated_at` age stale check | Unchanged |
| Stale threshold `3600000ms` | Unchanged |
| `rp-return-section` auto-expand | Unchanged |
| `rp-return-next-step` copy | Unchanged |
| No-auto-publish copy | Unchanged |
| `saveAnalysisResult` parser | Unchanged |
| `saveAnalysisResult` field extraction | Unchanged |
| `saveAnalysisResult` posts to `/api/analysis` only | Unchanged |
| Public truth state | Unchanged |
| Review/moderation | Unchanged |
| `rpRelativeTime` / `rp-summary-generated` | Unchanged |
| Fallback `instruction` / `output_contract` | Unchanged |
| F-5 `packet_id` advisory | Still non-blocking (F-5 still deferred) |
| Public profile | `detectPacketStaleness` / `simpleClaimHash` absent from `renderPublicProfileHtml` |
| Drift/Belief expansion files | Not touched |
| `src/worker.js` | Not touched |
| `public/index.html` | Not touched |
| `public/styles.css` | Not touched |
| No backend/API/migration/schema/CSP changes | Confirmed |

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

## D-274C — Live Closeout (2026-07-02)

**Owner deploy:** PASS
**Live snapshot-hash stale detection sanity:** PASS — 24/24
**Deployed Worker version:** not captured

### Post-deploy static checks

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3239 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

### Live sanity results (24/24 PASS)

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Claim/RunPack area opens without console-breaking errors | PASS |
| 3 | Existing claim can be selected | PASS |
| 4 | RunPack/Investigation Packet can be generated or displayed | PASS |
| 5 | Normal generated-time stale warning still works | PASS |
| 6 | Evidence/test count stale checks still work | PASS |
| 7 | New `source snapshot changed` stale warning appears when claim hash differs from packet | PASS |
| 8 | Non-stale packet state still does not show the new warning | PASS |
| 9 | `Load AI Analysis Return` still appears | PASS |
| 10 | `rp-return-section` auto-expands when `lastPacket && lastPacketClaimId === selected?.id` | PASS |
| 11 | `rp-return-next-step` copy still appears | PASS |
| 12 | Copy tells user to paste AI/JSON return | PASS |
| 13 | Copy states "Saving does not publish a truth automatically" | PASS |
| 14 | Parser behavior unchanged (`JSON.parse`, field extraction) | PASS |
| 15 | Parse failure toast unchanged | PASS |
| 16 | Success toast unchanged | PASS |
| 17 | `saveAnalysisResult` posts only to `/api/analysis` | PASS |
| 18 | Public truth state unchanged | PASS |
| 19 | Review/moderation unchanged | PASS |
| 20 | Public profile does not expose AI-return import controls | PASS |
| 21 | F-5 packet-ID storage still deferred | PASS |
| 22 | Drift/Belief expansion unaffected | PASS |
| 23 | No backend/API/schema/storage behavior changed | PASS |
| 24 | No console errors | PASS |
