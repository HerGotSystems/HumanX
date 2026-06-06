# D-58: Seed Import Route Safety Plan

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes. No D1 commands. No data mutations.
No seed files edited. No data imported, archived, or deleted.

---

## 1. Summary

The three seed/import routes currently in `src/worker.js` were built for engine
demonstration and developer bootstrapping. They work for that purpose. They are not
safe for a public-launch seed import because:

- All three routes insert content directly as `review_state='public'`, bypassing the
  moderation queue that all user-submitted content goes through.
- `GET /api/seed` is unauthenticated — any caller can trigger writes if the DB is empty.
- Neither admin import route has a dry-run mode, a version check, a SOURCE_NEEDED
  guard, or a structured import report.
- No pre-import snapshot is required by the routes themselves.

D-58 is a planning document only. No routes are changed. No data is imported.
The goal is to define exactly what changes are needed in a future D-59 Worker branch+PR
so that when real launch seeds are ready (D-57 with all SOURCE_NEEDED resolved), they
can be imported safely.

---

## 2. Current Route Inventory

### Route 1 — `GET /api/seed`

| Field | Detail |
|-------|--------|
| Path | `/api/seed` |
| Method | GET |
| Auth | **None** — unauthenticated public endpoint |
| Source | Inline `seedDemoClaims()` function in `src/worker.js` using the `demoClaims()` helper |
| DB-empty guard | Yes — checks `SELECT COUNT(*) FROM claims`; returns early if `n > 0` |
| Insert review_state | `'public'` — hardcoded in the INSERT statement |
| Content inserted | 3 demo claims (`demoClaims()` — not from `HUMANX_SEED`) |
| Production risk | **Medium** — unauthenticated write; safe only on a freshly provisioned empty DB; the DB-empty guard prevents reruns on populated DBs but the endpoint is callable by anyone |
| Recommended change | Require admin token (`requireAdmin`) before allowing writes; or convert to read-only (returns what would be seeded without writing); or remove in production (replace with explicit admin seeding only) |

### Route 2 — `GET /api/import-seed`

| Field | Detail |
|-------|--------|
| Path | `/api/import-seed` |
| Method | GET |
| Auth | Admin only (`requireAdmin` — `x-humanx-admin` header) |
| Source | `importSeedData(env)` in `src/importer.js`, which reads `HUMANX_SEED` from `src/seed-data.js` |
| DB-empty guard | No — runs against any DB state; uses `INSERT OR IGNORE` on normalized claim key |
| Insert review_state — claims | `'public'` — hardcoded at line 48 of `src/importer.js` |
| Insert review_state — evidence | No `review_state` column set on evidence INSERT — evidence inherits `DEFAULT 'public'` from schema |
| Insert review_state — pressure | No `review_state` column (pressure_points table has no moderation column) |
| Duplicate guard | Claims: checks `normalized_claim`; Evidence: checks `duplicate_signature`; Pressure/tests: no dedup guard — reruns duplicate these rows |
| Production risk | **High** — publishes claims immediately; no dry-run; no version check; pressure points and home tests duplicate on rerun |
| Recommended change | Default `review_state` to `'review'` for claims; add `review_state='review'` to evidence INSERT; add dry-run mode; add rerun guard for pressure/tests; add SOURCE_NEEDED rejection |

### Route 3 — `GET /api/import-truths`

| Field | Detail |
|-------|--------|
| Path | `/api/import-truths` |
| Method | GET |
| Auth | Admin only (`requireAdmin`) |
| Source | `importTruthSeeds(env)` in `src/truth-seed.js`, which reads `SEED_TRUTHS` array |
| DB-empty guard | No — runs against any DB state |
| Insert review_state | `'public'` — hardcoded in the INSERT at line 29 of `src/truth-seed.js` |
| Duplicate guard | Checks `normalized_statement`; on duplicate increments `repetition_score` instead of inserting again |
| Production risk | **High** — publishes truths immediately; no dry-run; no version tracking; `repetition_score` increment on rerun is silent |
| Recommended change | Default `review_state` to `'review'`; add dry-run mode; add version/pack tracking |

---

## 3. Risks

### 3A. Unauthenticated public route performing writes

`GET /api/seed` has no auth guard. Any caller who knows the URL can trigger a DB write
against an empty database. On a freshly provisioned production DB (e.g. after a DB reset),
this endpoint can be called before the admin sets up the intended seed pack, inserting
the wrong demo content as the first public data.

**Severity:** Medium. The DB-empty guard limits blast radius, but the endpoint has no
business being unauthenticated on a production deployment.

### 3B. Admin import routes publishing directly

Both `importSeedData` and `importTruthSeeds` insert content as `review_state='public'`.
This means that as soon as an admin calls either route, all seed content appears publicly
in the live app — it does not go through the Review queue. An admin cannot preview or
selectively approve individual seed items before they become visible.

**Severity:** High. The platform's entire evidence moderation stack (D-42B) exists to
prevent unreviewed content from being public. The import routes bypass this stack entirely.

### 3C. Seed claims bypassing the review queue

All user-submitted claims enter via `createClaim` as `review_state='review'`. Seed claims
enter as `'public'`. There is no consistent policy reason for this distinction at launch.
An admin importing the D-57 launch seed pack needs the ability to review each claim before
it appears publicly, exactly as they would for any other submitted claim.

**Severity:** High. Breaks the principle of the moderation system.

### 3D. Evidence inserted without `review_state`

`importSeedData` in `src/importer.js` does not set `review_state` on evidence INSERTs.
Evidence inherits `DEFAULT 'public'` from the schema column definition (migration 0007).
The D-42B moderation backend adds `review_state='review'` to `insertEvidence()` for
user-submitted evidence, but the seed importer bypasses `insertEvidence()` entirely.
The result: seed evidence is public immediately, even if the parent claim is in review.

**Severity:** Medium. Inconsistent with the evidence moderation model. Seed evidence
should enter as `'review'` alongside the parent claim.

### 3E. Truths labelled public immediately

`importTruthSeeds` hardcodes `review_state='public'` in the INSERT. Truths submitted by
users go through the Review queue. Seed truths do not. Three of the D-55 proposed truth
seeds are flagged as `needs-careful-framing` and should not appear publicly without
explicit admin review of the display context.

**Severity:** Medium. Inconsistent with user-submission flow; specific risk for
framing-sensitive truth statements.

### 3F. Accidental rerun and duplicate imports

`importSeedData` has no rerun guard for pressure points or home tests — both tables lack
`duplicate_signature` or unique-constraint protection in the importer. A second call to
`GET /api/import-seed` will duplicate all pressure points and home tests for any existing
claim, even if the claim itself is skipped by the `normalized_claim` dedup guard.

`importTruthSeeds` increments `repetition_score` on rerun instead of skipping — silent
side effect that changes production data without warning.

**Severity:** Medium. There is no `?dry-run` mode to preview what would be inserted
before committing.

### 3G. No dry-run mode

Neither import route returns a preview of what would be inserted. The admin must commit
to a full live import with no ability to inspect the planned changes first. For a launch
seed pack with 12–25 claims and associated evidence, pressure, and tests, this is a
material risk.

**Severity:** Medium. A `?mode=dry-run` query parameter would allow safe pre-import
inspection without any DB writes.

### 3H. No launch pack version tracking

Neither import route checks what version of the seed pack is being imported. If `src/seed-data.js`
is updated (e.g. from v1 to v2), the import route will silently import the new content
alongside the old without any version comparison or conflict detection.

**Severity:** Low for the current single-admin setup; Medium if multiple admins or
environments are involved.

### 3I. No SOURCE_NEEDED guard

Neither import route checks evidence `source_url` values for placeholder strings. If the
D-57 draft content (which contains `SOURCE_NEEDED: ...` placeholders) were imported via
the current routes, placeholder text would be inserted as the `source_url` in the DB with
no error or warning.

**Severity:** High for launch quality. The placeholder `SOURCE_NEEDED` text in `source_url`
fields would be visible to users via the Study view and Evidence Vault.

### 3J. No pre-import snapshot requirement in route

The import routes do not require or prompt for a DB snapshot before running. If a rerun
corrupts data or inserts wrong content, rollback requires a manual D1 restore from a
snapshot taken before the import. The routes themselves give no indication this is needed.

**Severity:** Low — procedural risk, not a code bug. Documented here to be addressed in
the D-59 implementation plan and D-60 import execution plan.

---

## 4. Recommended Future Behaviour

The following recommendations define the target state for the D-59 Worker branch+PR.
None of these changes are in the code yet.

### 4A. `GET /api/seed` — disable writes or require admin

**Option A (preferred):** Add `requireAdmin` check before any DB write. An unauthenticated
call returns a JSON explanation: `{ error: 'SEED_REQUIRES_ADMIN', message: '...' }`.

**Option B:** Convert to read-only: return what `demoClaims()` would insert without
writing to the DB. Useful for previewing the fallback seed shape.

**Option C:** Remove the route from production routing entirely. The demo seed has served
its purpose; the launch pack replaces it.

Recommendation: Option A is the minimum safe change. Option C is acceptable if the demo
seed claims are already in the production DB and the route is no longer needed.

### 4B. `/api/import-seed` — default `review`, add dry-run, add guards

Changes to `src/importer.js` (`importSeedData`):

```
1. Claims INSERT: change 'public' → 'review'
   (line 48: review_state hardcoded to 'public' → 'review')

2. Evidence INSERT: add review_state='review' to evidence INSERT
   (currently no review_state set; inherits DEFAULT 'public')

3. Add ?mode=dry-run support (passed as a parameter from the route handler):
   - dry-run: collect would_create / would_skip / would_duplicate counts
   - dry-run: return structured report without writing to DB
   - apply: perform all writes; return same structured report with actuals

4. Add SOURCE_NEEDED guard:
   - Before any INSERT, check each evidence item's source_url
   - If source_url contains 'SOURCE_NEEDED' or is empty string:
     - In dry-run: flag item in report
     - In apply: block the entire import and return SOURCE_NEEDED_BLOCKED error

5. Add rerun guard for pressure_points and home_tests:
   - Before inserting each pressure point, check if a matching title+body already
     exists for this claim_id; skip if duplicate
   - Same for home_tests: check title+instructions+claim_id

6. Return structured import report:
   {
     ok: true | false,
     mode: 'dry-run' | 'apply',
     seed_version: HUMANX_SEED.version,
     claims: {
       would_create | created: N,
       would_skip | skipped: N,
       source_needed_blocked: N
     },
     evidence: {
       would_create | created: N,
       would_skip | skipped: N,
       source_needed_blocked: N
     },
     pressure: {
       would_create | created: N,
       would_skip | skipped: N
     },
     tests: {
       would_create | created: N,
       would_skip | skipped: N
     }
   }
```

### 4C. `/api/import-truths` — default `review`, add dry-run, add guards

Changes to `src/truth-seed.js` (`importTruthSeeds`):

```
1. Truths INSERT: change 'public' → 'review'
   (line 29: review_state hardcoded to 'public' → 'review')

2. Add ?mode=dry-run support:
   - dry-run: count would_create / would_skip / would_increment_repetition_score
   - apply: perform writes; return actuals

3. Return structured import report:
   {
     ok: true | false,
     mode: 'dry-run' | 'apply',
     truths: {
       would_create | created: N,
       would_skip | skipped: N,
       would_increment | incremented: N
     }
   }
```

### 4D. Worker route handler changes

The route handler lines in `src/worker.js` (lines 33–35) should be updated to:

```
1. GET /api/seed: add requireAdmin before seedDemoClaims call (or disable)

2. GET /api/import-seed: extract ?mode query parameter; pass to importSeedData(env, mode)

3. GET /api/import-truths: extract ?mode query parameter; pass to importTruthSeeds(env, mode)
```

Route handler pattern (example — not executable, planning only):

```
// GET /api/import-seed
if (url.pathname === '/api/import-seed' && request.method === 'GET') {
  const adminError = requireAdmin(request, env);
  if (adminError) return adminError;
  const mode = url.searchParams.get('mode') || 'dry-run';  // default to safe dry-run
  if (mode !== 'dry-run' && mode !== 'apply') return json({ error: 'INVALID_MODE' }, 400);
  return json(await importSeedData(env, mode));
}
```

Defaulting `?mode` to `dry-run` means a bare `GET /api/import-seed` (no query param)
runs a dry-run and returns a preview — the admin must explicitly pass `?mode=apply` to
commit writes. This is the safest default.

---

## 5. Proposed D-59 Implementation Plan

D-59 is the Worker branch+PR that implements the changes described in Section 4.
No D1 migration is required — all changes are in application logic only.

### Files to change in D-59

| File | Changes |
|------|---------|
| `src/worker.js` | Lines 33–35: add `requireAdmin` to `/api/seed` route; extract `mode` param for import-seed and import-truths; pass to handler functions |
| `src/importer.js` | `importSeedData(env, mode)`: change claim insert to `review_state='review'`; add evidence `review_state='review'`; add SOURCE_NEEDED guard; add pressure/test dedup guards; add dry-run logic; return structured report |
| `src/truth-seed.js` | `importTruthSeeds(env, mode)`: change truth insert to `review_state='review'`; add dry-run logic; return structured report |

### Hardening smoke checks to add in D-59

```
Section 26 — Seed Import Safety (D-59)

test("importSeedData source contains review_state='review' for claims (D-59)", ...)
test("importTruthSeeds source contains review_state='review' for truths (D-59)", ...)
test("importer.js contains SOURCE_NEEDED guard (D-59)", ...)
test("worker.js /api/import-seed route passes mode parameter to importSeedData (D-59)", ...)
```

Four new checks: 113 → 117.

### Branch name

`feature/d59-seed-import-safety`

### PR checklist for D-59

- [ ] `src/importer.js` claim INSERT uses `'review'` not `'public'`
- [ ] `src/importer.js` evidence INSERT sets `review_state='review'`
- [ ] `src/importer.js` SOURCE_NEEDED guard blocks apply mode
- [ ] `src/importer.js` pressure/test dedup guards added
- [ ] `src/importer.js` returns structured report in both modes
- [ ] `src/truth-seed.js` truth INSERT uses `'review'` not `'public'`
- [ ] `src/truth-seed.js` returns structured report in both modes
- [ ] `src/worker.js` `/api/seed` requires admin or is disabled
- [ ] `src/worker.js` `/api/import-seed` extracts and passes `mode` param; defaults to `dry-run`
- [ ] `src/worker.js` `/api/import-truths` extracts and passes `mode` param; defaults to `dry-run`
- [ ] 4 new hardening smoke checks (113 → 117)
- [ ] `docs/API_ENDPOINT_INVENTORY.md` risk notes updated
- [ ] `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` rows updated
- [ ] Static checks: 117 / 24 / 39 (or revised count)
- [ ] Read Smoke green after merge

---

## 6. Safety Gates Before Any Real Import

Even after D-59 merges, no production import of the D-57 launch seed pack should occur
until every gate below is explicitly confirmed:

| Gate | Description | Who confirms |
|------|-------------|-------------|
| **Source URLs verified** | Every `SOURCE_NEEDED` placeholder in the D-57 draft has been replaced with a real, verified, publicly accessible URL following the D-56 7-step workflow | Human researcher |
| **Seed JSON reviewed** | A human has read the full D-57 draft JSON (or D-60 final version) and confirmed claim text, evidence bodies, pressure points, and framing are all correct | Admin / author |
| **D-59 route safety merged** | The D-59 Worker branch+PR is merged and deployed; import routes now default to `dry-run` and insert as `review_state='review'` | Confirmed via git + Read Smoke |
| **Dry-run output reviewed** | Admin runs `GET /api/import-seed?mode=dry-run` and reviews the structured report; `source_needed_blocked: 0`; counts match expectations | Admin |
| **D1 backup confirmed** | A D1 table export or snapshot has been taken immediately before running `?mode=apply` | Admin |
| **Explicit per-session D1 approval** | User explicitly approves the production import in the active session | User |
| **Apply import run** | Admin runs `GET /api/import-seed?mode=apply` and `GET /api/import-truths?mode=apply` | Admin |
| **Post-import review** | Admin reviews each imported claim and truth in the Review queue; approves items for public visibility individually | Admin |
| **Read Smoke green** | `HumanX Read Smoke` GitHub Actions workflow passes after import | CI |

---

## 7. Out of Scope for D-58

| Item | Reason |
|------|--------|
| Source URL gathering | Human research task; deferred to D-59 / D-60 preparation |
| Launch pack JSON finalisation | Deferred to D-60; D-57 is the draft |
| D1 cleanup or archive | No rows to delete or archive in D-58 |
| Automatic public publishing | Explicitly rejected — admin Review queue approval is required |
| Production import execution | Deferred; requires all gates in Section 6 |
| Bulk seed archiving | Not planned; demo seeds remain browseable |
| Frontend category label display | Required for 3 framing-sensitive truth seeds; separate frontend D |

---

## 8. Safety

| Rule | Status |
|------|--------|
| No D1 writes in D-58 | ✅ Confirmed |
| No seed file edits | ✅ Confirmed — `src/importer.js`, `src/truth-seed.js`, `src/seed-data.js`, `src/worker.js` all unchanged |
| No data imported | ✅ Confirmed |
| No data archived or deleted | ✅ Confirmed |
| No Worker changes | ✅ Confirmed — D-59 is the implementation batch |
| No frontend changes | ✅ Confirmed |
| No production mutations | ✅ Confirmed |

---

## D-58 Completion Record

| Item | Status |
|------|--------|
| Current route inventory: all 3 routes documented | ✅ |
| Risk analysis: 10 risk items documented with severity | ✅ |
| Recommended future behaviour for all 3 routes | ✅ |
| D-59 implementation plan: files, hardening checks, branch name, PR checklist | ✅ |
| Safety gates before any real import: 9-gate checklist | ✅ |
| Out of scope list | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No seed data imported / edited / deleted | ✅ Confirmed |
