# D-274A — RunPack Snapshot-Hash Stale Detection Audit

**Scope:** Docs / read-only analysis only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3217 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Files changed:** `docs/D274A_RUNPACK_SNAPSHOT_HASH_STALE_DETECTION_AUDIT.md`, `docs/README.md`
**App changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No
**Implementation:** Not included — see recommendation for D-274B

---

## Purpose

Audit F-4 (snapshot-hash stale detection) from the D-268A friction finding list before any implementation. Determine whether the comparison can be done frontend-only and what is the smallest safe implementation path.

---

## Audit Findings

### 1. Where is `lastPacket` created, assigned, cleared, downloaded/copied, and displayed?

| Operation | Location | Detail |
|-----------|----------|--------|
| Declared | `app-v10.js` line 13 | `let lastPacket = '';` — module-level, session-only |
| Assigned (backend path) | `generateRunPack()` line 568 | `lastPacket = JSON.stringify({...data.packet,..._mp},null,2)` after successful `POST /api/runpack` |
| Assigned (fallback path) | `generateRunPack()` line 568 | `lastPacket = JSON.stringify({...provenance,is_fallback:true,...},null,2)` on backend error |
| Never cleared | — | `lastPacket` persists for the session; no explicit clear on claim change or navigation |
| Copied | `copyAIP()` line 572 | `navigator.clipboard.writeText(lastPacket)` — generates if empty |
| Downloaded | `downloadRunPack()` line 579 | Blobs `lastPacket` as JSON file |
| Displayed | `renderExport()` line 452 | `<pre class="output runpack-export-output">${esc(lastPacket)}</pre>` inside `rp-json-details` |
| Checked for staleness | `detectPacketStaleness()` line 567 | `JSON.parse(lastPacket)` — reads `meta.evidence_count`, `meta.pressure_count`, `meta.test_count`, `meta.generated_at` |

### 2. Where is `lastPacketClaimId` assigned and compared?

| Operation | Location | Detail |
|-----------|----------|--------|
| Declared | `app-v10.js` line 15 | `let lastPacketClaimId = '';` |
| Assigned | `generateRunPack()` line 568 | `lastPacketClaimId = selected.id` — set after every packet generation |
| Compared in `runPackSummary()` | line 451 | `lastPacketClaimId !== selected.id` → "Built for different claim" chip |
| Compared in `renderExport()` | line 452 | `lastPacket && lastPacketClaimId === selected?.id` — gates "Recreate Packet" label and `rp-return-section` auto-expand |

### 3. What exact field exists on generated RunPacks for snapshot hash?

The field is exactly **`source_snapshot_hash`**.

**Backend path** (`workerSnapshotHash`, `src/worker.js` line 989):
```
s = [claim.id, claim.updated_at, eids_sorted, euas_sorted, pids_sorted, puas_sorted, tids_sorted, tuas_sorted].join('|')
```
Includes: claim `updated_at`, all evidence/pressure/test IDs and `created_at`/`updated_at` timestamps (sorted). This is a **content-level hash** — it changes on any item add/edit/delete including items that don't change counts.

**Fallback path** (`simpleClaimHash`, `app-v10.js` line 564):
```
s = [claim.id, claim.updated_at, evidence.length, pressure.length, tests.length].join('|')
```
Includes: claim `updated_at` and **counts only**. This is a **count-level hash** — it does NOT change on content edits that don't change counts.

**Conclusion:** The two hash functions are intentionally different in sensitivity. Backend hash is richer; fallback hash is coarser. Both produce a hex string stored as `source_snapshot_hash` on the packet provenance.

### 4. What field exists on the selected claim/source object for comparison?

After `selectClaim(id)` returns (line 453), `selected` has these fields:
- `selected.id` ✓
- `selected.claim` (cleaned label)
- `selected.evidence[]` — items with `.id`, `.created_at`
- `selected.pressure[]` — items with `.id`, `.created_at`
- `selected.tests[]` — items with `.id`, `.updated_at` or `.created_at`
- `selected.analyses[]`
- `selected.lineage`
- Score fields: `selected.evidenceScore`, `selected.testability`, `selected.survivability`
- Status/category/type/handle fields

**`selected.updated_at` is returned by the `/api/claims/:id` API** — it appears in `reviewCard()` (line 418: `item.updated_at||item.updatedAt`) and in `evidenceCard()` (line 179: `e.updated_at||e.updatedAt`), confirming the API returns it on claim and evidence objects. `selectClaim()` sets `selected = data.claim`, so `selected.updated_at` should be available from the API response.

**No field named `source_snapshot_hash`, `snapshot_hash`, or `claim_snapshot_hash` exists on the claim object** returned by `/api/claims/:id`. There is no pre-computed hash on the claim record.

### 5. Is the selected claim hash computable frontend-only?

**YES — for the fallback-equivalent hash.** The frontend already has `simpleClaimHash(claim)` defined (line 564), which uses `claim.id`, `claim.updated_at`, and the three array lengths. All four of those fields are available on `selected` after `selectClaim()`.

**PARTIALLY for the backend hash.** `workerSnapshotHash` uses sorted evidence/pressure/test IDs and `created_at`/`updated_at` timestamps. `selected.evidence[]`, `selected.pressure[]`, and `selected.tests[]` are available after `selectClaim()`, with `.id` and `.created_at` on each item. `tests` also have `.updated_at` in the worker hash. Whether `.updated_at` is returned on evidence/pressure/test items by `/api/claims/:id` needs verification in the worker's `claimDetail()` function — but even without it, IDs and `created_at` cover the majority of the signal.

**For the immediate stale check, `simpleClaimHash(selected)` vs the packet's `source_snapshot_hash` is the correct comparison for the fallback path.** For backend-generated packets, `workerSnapshotHash` was used, which is richer than `simpleClaimHash`. A frontend comparison using `simpleClaimHash(selected)` will give a conservative signal: if counts or `updated_at` changed, it fires; if only item content changed without count change, it may miss it. That is the same limitation `detectPacketStaleness()` already has for other fields.

**Conclusion: A frontend-only comparison is possible and meaningful** using `simpleClaimHash(selected)` vs `JSON.parse(lastPacket).source_snapshot_hash`. The signal quality matches or slightly exceeds the current count-based stale check. No backend change is required for D-274B.

### 6. Smallest safe D-274B implementation location

The correct and smallest implementation is a **single new `if` branch inside `detectPacketStaleness()`** (line 567), after the existing count and age checks:

```javascript
if (meta.source_snapshot_hash != null) {
  const currentHash = simpleClaimHash(selected);
  if (currentHash !== meta.source_snapshot_hash) w.push('content changed');
}
```

**Why `detectPacketStaleness()`:**
- Already parses `lastPacket` and reads `meta.*` fields
- Already builds the `w[]` warnings array
- Already integrated into `runPackSummary()` and the stale chip
- `selected` is in scope (module-level)
- `simpleClaimHash` is already defined at line 564 — no new helper needed
- The new branch only fires when `source_snapshot_hash` is present on the packet (both backend and fallback paths include it)
- Adds one stale signal: if `simpleClaimHash(selected)` differs from the packet hash, the stale chip fires with "content changed"

**No changes to `runPackSummary()`, `renderExport()`, or any other function are needed.** The existing stale chip rendering (`Possibly stale — content changed`) already handles any new warning string from `detectPacketStaleness()`.

**Important caveat:** For backend-generated packets, `workerSnapshotHash` was used when the packet was created (richer hash including all item timestamps sorted). The frontend recomputation uses `simpleClaimHash` (coarser). This means:
- If evidence/pressure/test counts changed: BOTH hashes would differ — stale fires correctly.
- If item content changed without count change: `workerSnapshotHash` would differ but `simpleClaimHash` would not — **stale may not fire** for content-only edits.
- This is an acceptable limitation for a frontend-only implementation and is better than the current state (no hash comparison at all).

### 7. Is frontend-only sufficient, or does it require backend investigation?

**Frontend-only is sufficient for D-274B.** The comparison is:

```
simpleClaimHash(selected) !== JSON.parse(lastPacket).source_snapshot_hash
```

No new API routes, no schema changes, no worker changes. The only limitation is that for backend-generated packets, the frontend recomputes using a coarser hash than was used to generate the stored hash — meaning content-only edits (without count changes) may not trigger the stale warning. This is a known, acceptable limitation and is better than no hash comparison.

If the owner later wants full content-level stale detection (matching `workerSnapshotHash` precision), that would require either:
- Replicating the full `workerSnapshotHash` algorithm in the frontend (needs evidence/pressure/test `created_at`/`updated_at` to be reliably populated on all items in `selected`), or
- Adding a `current_snapshot_hash` field to the `/api/claims/:id` response (backend change, branch/PR style).

Those remain F-4 follow-up decisions, not blockers for D-274B.

### 8. Public profile impact

The comparison lives entirely inside `detectPacketStaleness()`, which is called only from `runPackSummary()`. `runPackSummary()` is called from `renderExport()`. Neither of these functions is called from `renderPublicProfileHtml()`.

**Public profile rendering is unaffected.** No new fields or classes would be exposed publicly.

### 9. Review/moderation impact

`detectPacketStaleness()` is a pure read-only frontend function with no API calls. It does not touch `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, or any moderation state.

**Review/moderation is unaffected.**

### 10. Drift/Belief expansion files

`public/belief-drift-expansion.js` and `public/index.html` are not referenced by `detectPacketStaleness()`, `runPackSummary()`, or `simpleClaimHash()`.

**Drift/Belief expansion files remain untouched.**

### 11. Regression tests needed for D-274B (not written yet)

The following tests should be added in the D-274B smoke test block:

| # | Category | What to test |
|---|----------|-------------|
| 1 | Hash detection | `source_snapshot_hash` field present in fallback packet (`buildProvenanceMeta` output) |
| 2 | Hash detection | `source_snapshot_hash` field present in backend packet path (via `detectPacketStaleness` reads it from `lastPacket`) |
| 3 | Hash detection | `simpleClaimHash` is still defined in app-v10.js |
| 4 | Stale detection | `detectPacketStaleness` now checks `source_snapshot_hash` against `simpleClaimHash(selected)` |
| 5 | Stale detection | Hash comparison fires "content changed" warning when hashes differ |
| 6 | Stale detection | Hash comparison does NOT fire when hashes match (no false positive) |
| 7 | Stale detection | New check is inside `detectPacketStaleness` — not a new function |
| 8 | Stale detection | `meta.source_snapshot_hash != null` guard present (does not fire on old packets without the field) |
| 9 | Compatibility | Existing count-based stale checks still present and unchanged |
| 10 | Compatibility | Age-based stale check still present and unchanged (`3600000ms`) |
| 11 | Compatibility | `runPackSummary` stale chip rendering unchanged (uses detectPacketStaleness return) |
| 12 | Boundary | `detectPacketStaleness` not called from `renderPublicProfileHtml` |
| 13 | Boundary | `simpleClaimHash` not called from `renderPublicProfileHtml` |
| 14 | D-271 lock | `rp-return-section` still present in `renderExport` |
| 15 | D-271 lock | Auto-expand condition `lastPacket&&lastPacketClaimId===selected?.id` unchanged |
| 16 | D-271 lock | `rp-return-next-step` still present |
| 17 | D-271 lock | No-auto-publish copy unchanged |
| 18 | Deploy integrity | `worker.js` not modified by D-274B |
| 19 | Deploy integrity | `styles.css` not modified by D-274B |
| 20 | Deploy integrity | `index.html` not modified by D-274B |

---

## Hash Function Comparison

| Attribute | `simpleClaimHash` (frontend) | `workerSnapshotHash` (backend) |
|-----------|------------------------------|-------------------------------|
| Defined at | `app-v10.js` line 564 | `src/worker.js` line 989 |
| Used in | `buildProvenanceMeta()` (fallback packet) | `createAipPacket()` (backend packet) |
| Inputs | `claim.id`, `claim.updated_at`, ev/pr/ts counts | `claim.id`, `claim.updated_at`, all ev/pr/ts IDs + timestamps (sorted) |
| Detects count change | Yes | Yes |
| Detects item-level edit (same count) | No | Yes |
| Detects claim text edit (via `updated_at`) | Only if `updated_at` changes | Only if `updated_at` changes |
| Algorithm | `Math.imul(31, h)` djb2-style | Same algorithm, richer input string |
| Output | 8-char hex string | 8-char hex string |

**Comparison in `detectPacketStaleness()`:** For fallback packets, `simpleClaimHash(selected)` vs `lastPacket.source_snapshot_hash` is an exact match (same algorithm, same inputs). For backend packets, `simpleClaimHash(selected)` vs `lastPacket.source_snapshot_hash` is a coarser comparison — may miss content edits that don't change counts. This is known and acceptable.

---

## D-274B Implementation Recommendation

**Feasibility: Frontend-only. Safe. Small.**

**Exact change:**
- File: `public/app-v10.js`
- Function: `detectPacketStaleness()` (line 567)
- Change: Add one `if` block after the existing `test_count` check:
  ```javascript
  if(meta.source_snapshot_hash!=null){const _ch=simpleClaimHash(selected);if(_ch!==meta.source_snapshot_hash)w.push('content changed');}
  ```
- No other changes needed.

**Side effects:** None. The new branch only adds a string to `w[]` when a hash mismatch is detected. `runPackSummary()` already renders whatever `detectPacketStaleness()` returns.

**Preserved locks (D-271/D-272):**
- `rp-return-section` — not touched
- `Load AI Analysis Return` — not touched
- Auto-expand condition — not touched
- `rp-return-next-step` — not touched
- Parser behavior — not touched
- `saveAnalysisResult` — not touched
- Public truth state — not touched

**Tests:** ~20 new tests in D-274B block (see section 11 above).

**Deploy:** Yes — `public/app-v10.js` will be changed in D-274B.

---

## Existing Lock Preservation Confirmation

All D-271/D-272 locks are confirmed intact and unaffected by D-274B as specified:

| Lock | Affected by D-274B? |
|------|---------------------|
| `rp-return-section` present | No |
| `Load AI Analysis Return` present | No |
| Auto-expand `lastPacket&&lastPacketClaimId===selected?.id` | No |
| `rp-return-next-step` present | No |
| Paste AI/JSON guidance | No |
| "Saving does not publish a truth automatically" | No |
| `JSON.parse` validation | No |
| `parsed.output\|\|parsed.result\|\|parsed.analysis\|\|parsed` | No |
| `saveAnalysisResult` posts to `/api/analysis` only | No |
| `rp-return-section` absent from `renderPublicProfileHtml` | No — still absent |
| `rp-return-next-step` absent from `renderPublicProfileHtml` | No — still absent |
| `saveAnalysisResult` absent from `renderPublicProfileHtml` | No — still absent |
| `Load AI Analysis Return` absent from `renderPublicProfileHtml` | No — still absent |
