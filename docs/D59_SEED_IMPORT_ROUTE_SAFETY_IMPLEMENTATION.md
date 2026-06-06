# D-59: Seed Import Route Safety Implementation

Date: 2026-06-06
Branch: feature/d59-seed-import-route-safety
Status: Worker/API behaviour change. Branch + PR required. No direct main commit.
No D1 commands. No Wrangler. No seed imports executed. No live writes.

---

## 1. Summary

D-58 documented 10 risks in the three seed/import routes. D-59 implements the fixes
planned in D-58 Sections 4 and 5.

**Changes in this batch:**

| File | What changed |
|------|-------------|
| `src/worker.js` | `/api/seed` now requires admin token. `/api/import-seed` and `/api/import-truths` extract `?mode` param (default `dry-run`), validate it, and pass `{ dryRun }` option to helpers |
| `src/importer.js` | `importSeedData` accepts `{ dryRun, reviewState }` options. Dry-run returns counts without writes. Apply: SOURCE_NEEDED guard blocks if any `source_url` is empty or contains placeholder. Claims inserted as `review_state='review'` (not `'public'`). Evidence inserted with explicit `review_state='review'`. Pressure/test dedup guards added. Structured report returned in both modes |
| `src/truth-seed.js` | `importTruthSeeds` accepts `{ dryRun, reviewState }` options. Dry-run returns counts without writes. Truths inserted as `review_state='review'` (not `'public'`). Structured report returned |
| `scripts/hardening-smoke-test.mjs` | Section 26 added: 6 new checks (113 → 119). Self-reference assertion updated |
| `docs/README.md` | Hardening smoke count updated: `113 passed` → `119 passed` |
| `docs/API_ENDPOINT_INVENTORY.md` | All three route rows updated with D-59 behaviour |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` | `/api/seed` row updated; known-gaps section updated |
| `docs/PROJECT_STATE.md` | Last-updated, D-59 batch row, next-work updated |

No D1 migration required. No schema changes. No frontend changes. No workflow changes.

---

## 2. Route Changes

### 2A. `GET /api/seed`

**Before D-59:**
```
if (url.pathname === '/api/seed' && request.method === 'GET')
  return seedDemoClaims(request, env);
```
Unauthenticated. Any caller can write to an empty DB.

**After D-59:**
```
if (url.pathname === '/api/seed' && request.method === 'GET') {
  const adminError = requireAdmin(request, env);
  if (adminError) return adminError;
  return seedDemoClaims(request, env);
}
```
Admin token required. Unauthenticated calls return `403 ADMIN_REQUIRED`.
DB-empty guard inside `seedDemoClaims` is preserved.

### 2B. `GET /api/import-seed`

**Before D-59:**
```
{ const adminError = requireAdmin(request, env);
  if (adminError) return adminError;
  return json(await importSeedData(env)); }
```
Always writes. Always publishes as `'public'`. No dry-run.

**After D-59:**
```
{ const adminError = requireAdmin(request, env);
  if (adminError) return adminError;
  const mode = url.searchParams.get('mode') || 'dry-run';
  if (mode !== 'dry-run' && mode !== 'apply') return json({ error:'INVALID_MODE', ... }, 400);
  return json(await importSeedData(env, { dryRun: mode !== 'apply' })); }
```
- Default: `?mode=dry-run` — returns report, no writes.
- `?mode=apply` — performs import.
- Invalid mode: 400 error.

### 2C. `GET /api/import-truths`

Same pattern as `import-seed`:
- Default: `?mode=dry-run` — returns report, no writes.
- `?mode=apply` — performs import.
- Invalid mode: 400 error.

---

## 3. Helper Changes

### 3A. `importSeedData(env, { dryRun, reviewState })` — `src/importer.js`

**New signature:** `importSeedData(env, { dryRun = true, reviewState = 'review' } = {})`

**SOURCE_NEEDED guard (apply mode only):**
Before any DB writes, the function scans all evidence items. If any `source_url` is
empty or contains the string `'SOURCE_NEEDED'`, the import is blocked and returns:
```json
{
  "ok": false,
  "error": "SOURCE_NEEDED_BLOCKED",
  "message": "Import blocked: N evidence item(s) have empty or SOURCE_NEEDED source_url...",
  "evidence": { "source_needed_blocked": N }
}
```

**Claims INSERT:** `review_state` bound to `reviewState` parameter (default `'review'`),
not the previous hardcoded `'public'`.

**Evidence INSERT:** `review_state` column now explicitly set to `reviewState` in the
evidence INSERT statement. Previously the column was absent from the INSERT and inherited
`DEFAULT 'public'` from the schema — this is now explicit.

**Pressure dedup:** Before inserting each pressure point, checks
`SELECT id FROM pressure_points WHERE claim_id=? AND title=?`. Skips if found. Prevents
duplicate pressure points on repeated import runs.

**Test dedup:** Same pattern for `home_tests`.

**Structured report** (both modes):
```json
{
  "ok": true,
  "mode": "dry-run | apply",
  "seed_version": 1,
  "review_state": "review",
  "claims":   { "would_create": N, "would_skip": N, "created": N, "skipped": N },
  "evidence": { "would_create": N, "would_skip": N, "created": N, "skipped": N, "source_needed_blocked": N },
  "pressure": { "would_create": N, "would_skip": N, "created": N, "skipped": N },
  "tests":    { "would_create": N, "would_skip": N, "created": N, "skipped": N },
  "warnings": []
}
```

### 3B. `importTruthSeeds(env, { dryRun, reviewState })` — `src/truth-seed.js`

**New signature:** `importTruthSeeds(env, { dryRun = true, reviewState = 'review' } = {})`

**Truths INSERT:** `review_state` bound to `reviewState` parameter (default `'review'`),
not the previous hardcoded `'public'`.

**Structured report** (both modes):
```json
{
  "ok": true,
  "mode": "dry-run | apply",
  "review_state": "review",
  "truths": { "would_create": N, "would_skip": N, "would_increment": N, "created": N, "skipped": N, "incremented": N },
  "warnings": []
}
```

---

## 4. Hardening Smoke Checks — Section 26

Six new checks (113 → 119):

| Check | What it asserts |
|-------|----------------|
| `/api/seed requires admin` | `requireAdmin` call appears before `seedDemoClaims` in the route handler |
| `/api/import-seed defaults to dry-run` | Route extracts `mode` param, defaults to `'dry-run'`, passes `dryRun: mode !== 'apply'` |
| `/api/import-truths defaults to dry-run` | Same pattern as import-seed |
| `importSeedData uses reviewState not hardcoded 'public'` | `importer.js` contains `reviewState` and `reviewState = 'review'` |
| `importTruthSeeds uses reviewState not hardcoded 'public'` | `truth-seed.js` contains `reviewState` and `reviewState = 'review'` |
| `SOURCE_NEEDED guard exists` | `importer.js` contains `SOURCE_NEEDED_BLOCKED` error key and the `src.includes('SOURCE_NEEDED')` check |

Static checks after D-59: **119 / 24 / 39**.

---

## 5. What Was NOT Changed

| Item | Reason |
|------|--------|
| `seedDemoClaims` function body | Still inserts demo claims as `'public'` — this is the fallback demo path, not the launch pack path; changing it is a separate decision |
| `demoClaims()` helper | Unchanged — still returns 3 demo claim objects |
| `fallbackApi` | Unchanged — still serves demo claims when DB binding is missing |
| D1 schema | No migration required — `review_state` column already exists on both `claims` and `evidence` (migration 0007, D-42A) |
| Seed data files | `src/seed-data.js`, `src/truth-seed.js` SEED_TRUTHS array, `data/seed_claims_v1.json`, `data/seed_truths_v1.json` — data content unchanged |
| Frontend | No changes |
| Workflow | No changes |

---

## 6. Current Seed Data — Source URL Status

The existing seed data (`HUMANX_SEED` in `src/seed-data.js`) has all evidence `source_url`
fields set to empty string `''`. This means:

- `GET /api/import-seed?mode=apply` will be **blocked** by the SOURCE_NEEDED guard
  (empty string triggers the guard alongside `'SOURCE_NEEDED'` placeholders).
- This is the correct behaviour: the demo seed pack does not have verified sources and
  should not be imported as launch content without them.
- `GET /api/import-seed?mode=dry-run` still works — it returns a report showing what
  would happen, including the `source_needed_blocked` count.

To import the existing demo seed despite missing sources (e.g. for a fresh dev DB), an
admin can use a future `?allow_demo=true` flag (not implemented in D-59) or manually
supply source URLs. Production launch import requires the D-57 draft content with all
`SOURCE_NEEDED` placeholders resolved (D-60 task).

---

## 7. Safety

| Rule | Status |
|------|--------|
| No D1 writes in D-59 batch | ✅ Confirmed — routes are not called; this is a code change only |
| No seed data imported | ✅ Confirmed |
| No seed files data-content edited | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No workflow changes | ✅ Confirmed |
| No D1 migrations | ✅ Confirmed — schema unchanged |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |

---

## 8. After PR Merge

1. Read Smoke CI should pass (GitHub Actions → HumanX Read Smoke → Run workflow).
2. Do NOT call any of the three routes after merge — route safety is confirmed by static
   checks, not by live execution.
3. D-60 (source URL research) can proceed independently of this PR.
4. D-61 (gated production import) requires both D-59 merged and D-60 sources confirmed.

---

## D-59 Completion Record

| Item | Status |
|------|--------|
| `/api/seed` admin gate added | ✅ |
| `/api/import-seed` dry-run default + mode validation | ✅ |
| `/api/import-truths` dry-run default + mode validation | ✅ |
| `importSeedData` dryRun option + reviewState default 'review' | ✅ |
| `importSeedData` SOURCE_NEEDED guard (apply mode) | ✅ |
| `importSeedData` evidence review_state explicit | ✅ |
| `importSeedData` pressure/test dedup guards | ✅ |
| `importSeedData` structured report (both modes) | ✅ |
| `importTruthSeeds` dryRun option + reviewState default 'review' | ✅ |
| `importTruthSeeds` structured report (both modes) | ✅ |
| Section 26 hardening checks: 6 checks (113 → 119) | ✅ |
| `docs/README.md` hardening count updated 113 → 119 | ✅ |
| `docs/API_ENDPOINT_INVENTORY.md` updated | ✅ |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` updated | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| `node --check src/worker.js` passes | ✅ |
| `node --check src/importer.js` passes | ✅ |
| `node --check src/truth-seed.js` passes | ✅ |
| Static checks: 119 / 24 / 39 | ✅ |
| Branch: feature/d59-seed-import-route-safety | ✅ |
| No code merged to main | ✅ — PR only |
| No D1 commands | ✅ |
| No Wrangler | ✅ |
| No seed imports executed | ✅ |
| No production mutations | ✅ |
