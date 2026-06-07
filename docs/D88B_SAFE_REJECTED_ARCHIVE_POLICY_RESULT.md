# D-88B: Safe Rejected Archive Policy — Implementation Result

Date: 2026-06-07
Step: D-88B — backend expansion of `reviewCleanup` with safe archive policy v2
Type: Backend code change. Branch + PR. No direct-main. No D1 writes. No Wrangler. No live archive calls.

---

## 1. Branch

`feat/d88b-safe-archive-policy` — PR to `main`.

---

## 2. Files Changed

| File | Change type |
|------|------------|
| `src/worker.js` | Backend: `reviewCleanup` function expanded with policy v2 |
| `scripts/hardening-smoke-test.mjs` | +20 tests: D-88B policy checks, v2 heuristic pure-function, junk heuristic pure-function |

No frontend changes. No DB migration. No D1 writes. No new API routes.

---

## 3. Backend Policy Changes (`src/worker.js`)

### Guards added (in order after existing state gate)

#### 3a. Protected seed blocklist
```js
const PROTECTED_SEEDS = new Set([
  'clm_seed_55e17c22e13e', 'clm_seed_8e095b6f6d30', 'clm_seed_c4e0335e7aae',
  'clm_seed_8ad9ff121579', 'clm_seed_7fb1c24747c2'
]);
if (PROTECTED_SEEDS.has(targetId)) return json({ error: 'CLEANUP_PROTECTED_SEED' }, 400);
```
Prevents archiving the 5 editorial launch seed claims regardless of any other signal.

#### 3b. Status lock gate
```js
if (row.status_locked) return json({ error: 'CLEANUP_REQUIRES_NOT_LOCKED' }, 400);
```
A locked-score item has admin editorial intent attached; archiving it silently drops that context.

**Note:** Row query expanded to fetch `status_locked` and `handle` (via LEFT JOIN to `users`) in addition to existing fields.

#### 3c. Expanded artefact detection (v2)

Three signals now tested (OR logic):

| Signal | Pattern | Examples caught |
|--------|---------|----------------|
| keyword (original) | `smoke`, `\btest\b`, `automated write`, `automated smoke` | "HOWGH test", "People are stupid - TEST" |
| id pattern (new) | `/^clm_seed_/`, `/^HX-\d/i` | HX-000001, HX-000002 |
| dev handle (new) | `humanx-seed`, `anon-o_seed`, `anon-xksavy`, `anon-73d9y2`, `anon-ek3562` | test-account submissions |

When a signal matches, the success response includes:
- `archive_policy: 'test_artifact_v2'`
- `archive_reason: 'test_keyword'` | `'dev_seed_id'` | `'dev_handle'`

#### 3d. Junk override path (new)
When no automatic signal matches, admin may supply:
- `junk_override: true` (boolean in request body)
- `reason: string` (required, 8–240 chars after trim)

Backend then applies a conservative secondary heuristic (one of):
- `trimmed.length <= 40` (short text)
- All-caps word/phrase of ≤ 3 words (e.g. "DOCTRINE", "EVERYBODY IS IDIOT")
- Low-alpha ratio: `< 60%` alpha characters of non-space chars (e.g. "gfsdhdfhfdhdfhdfhgdfa")

If heuristic fails → 400 `CLEANUP_JUNK_OVERRIDE_REJECTED` (prevents misuse for substantive claims).
If reason missing/too short → 400 `CLEANUP_REASON_REQUIRED`.
On success: `archive_policy: 'junk_override_v1'`, `archive_reason: <supplied reason>`.

**Note:** `reason` is returned in the response body only — not persisted to DB. No migration needed.

### Policy decision tree

```
POST /api/review/cleanup
  ├─ requireAdmin                          → 403 ADMIN_REQUIRED
  ├─ target_type in {claim,truth}          → 400 BAD_TARGET_TYPE
  ├─ target_id exact match in DB           → 404 CLAIM/TRUTH_NOT_FOUND
  ├─ review_state === 'rejected'           → 400 CLEANUP_REQUIRES_REJECTED
  ├─ PROTECTED_SEEDS.has(targetId)         → 400 CLEANUP_PROTECTED_SEED  [NEW]
  ├─ row.status_locked truthy              → 400 CLEANUP_REQUIRES_NOT_LOCKED  [NEW]
  ├─ artefact v2 (keyword||idPattern||handle)  → archive + archive_policy:'test_artifact_v2'  [EXPANDED]
  ├─ junk_override===true
  │   ├─ reason invalid                   → 400 CLEANUP_REASON_REQUIRED  [NEW]
  │   ├─ heuristic fails                  → 400 CLEANUP_JUNK_OVERRIDE_REJECTED  [NEW]
  │   └─ heuristic passes                 → archive + archive_policy:'junk_override_v1'  [NEW]
  └─ (no signal)                          → 400 CLEANUP_REQUIRES_TEST_ARTEFACT
```

### Invariants preserved

- No `DELETE FROM` — soft archive only (`review_state='archived'`).
- No batch archive endpoint.
- Single exact ID required.
- Admin token required.
- `review_state` must be `'rejected'`.
- No DB schema change.

---

## 4. Static Test Changes (`scripts/hardening-smoke-test.mjs`)

### Updated

- `isSuspectedTestArtefactPure` inline copy updated to match D-87B extended frontend (handle + id-pattern + keyword).
- `isTestArtefact` legacy v1 kept for backward-compat of existing keyword tests (6 tests still use it).

### Added (20 new tests)

**Policy guard assertions (source string checks on cleanupBody):**
1. `reviewCleanup blocks protected launch seeds with CLEANUP_PROTECTED_SEED`
2. `reviewCleanup blocks status_locked rows with CLEANUP_REQUIRES_NOT_LOCKED`
3. `reviewCleanup recognises clm_seed_ id pattern as artefact`
4. `reviewCleanup recognises HX- id pattern as artefact`
5. `reviewCleanup recognises known dev/test handles as artefacts`
6. `reviewCleanup supports junk_override path`
7. `reviewCleanup requires reason for junk_override`
8. `reviewCleanup applies secondary heuristic for junk_override`
9. `reviewCleanup policy v2: archive_policy field present in success path`

**v2 artefact heuristic pure-function tests:**
10. `v2 heuristic: clm_seed_ id prefix triggers artefact`
11. `v2 heuristic: HX-000001 id triggers artefact`
12. `v2 heuristic: humanx-seed handle triggers artefact`
13. `v2 heuristic: anon-xksavy handle triggers artefact`
14. `v2 heuristic: normal user claim is NOT artefact`
15. `v2 heuristic: text keyword still works alongside id/handle signals`

**Junk heuristic pure-function tests:**
16. `junk heuristic: short text (<= 40 chars) passes`
17. `junk heuristic: gibberish keyboard mash (low alpha ratio) passes`
18. `junk heuristic: all-caps 1-word fragment passes`
19. `junk heuristic: long factual claim does NOT pass`
20. `junk heuristic: full sentence (> 40 chars, normal alpha) does NOT pass`

---

## 5. Static Check Results

| Script | Before D-88B | After D-88B | Pass |
|--------|-------------|-------------|------|
| `node --check src/worker.js` | exit 0 | exit 0 | ✅ |
| `node --check public/app-v10.js` | exit 0 | exit 0 | ✅ |
| `scripts/hardening-smoke-test.mjs` | 127 passed | **147 passed** | ✅ |
| `scripts/belief-engine-static-check.mjs` | 24 passed | 24 passed | ✅ |
| `scripts/worker-route-static-check.mjs` | 39 passed | 39 passed | ✅ |

New hardening baseline: **147**.

---

## 6. Expected Effect on 25 Rejected Items

| Group | Count | Archivable after D-88B? |
|-------|-------|------------------------|
| A — keyword match in text | 2 | ✅ Yes (keyword signal, same as before) |
| B — HX seed rows | 2 | ✅ Yes (id-pattern signal, newly unlocked) |
| C — junk/gibberish/fragments | 6 | ✅ Yes via `junk_override:true` + reason |
| D — factual/controversial content | 15 | ❌ No — no signal matches, junk heuristic fails for prose |

Total archivable: up to 10 of 25. Group D (15 items) correctly remains rejected-visible.

---

## 7. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| No live POST made | ✅ |
| No live archive/cleanup call | ✅ |
| No moderation action | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| No direct-main commit | ✅ (branch + PR) |
| No DB migration | ✅ |
| No frontend behaviour change | ✅ |
| Admin token not printed or committed | ✅ |
| No Co-Authored-By | ✅ |
