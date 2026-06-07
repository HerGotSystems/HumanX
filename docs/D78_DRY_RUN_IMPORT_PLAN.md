# D-78: Dry-Run Import Plan for seed_claims_v2.json

Date: 2026-06-07
Step: D-78A (planning only — no execution)
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No import routes called. No production mutations.

---

## 1. Purpose and Scope

D-78A documents the plan, preflight requirements, and go/no-go criteria for a future gated
dry-run import of `data/seed_claims_v2.json` via `GET /api/import-seed?mode=dry-run`.

**Scope:** Planning, audit, and gate documentation only.
**Out of scope:** Executing the route, touching D1, running Wrangler, or mutating live data.

---

## 2. Explicit Non-Execution Statement

D-78A does not call `/api/import-seed`.
D-78A does not touch D1.
D-78A does not use Wrangler.
D-78A does not mutate live data.
D-78A does not curl production.
D-78A does not run `mode=apply`.

No claim, evidence, pressure, or test row was created or modified during D-78A.

---

## 3. Current Gate State

| Item | Status |
|------|--------|
| D-76D: 5/5 READY claims approved (APPROVE_FOR_D76) | ✅ COMPLETE |
| D-77: `data/seed_claims_v2.json` created on branch | ✅ COMPLETE |
| D-77 PR #102 merged to main | ✅ COMPLETE (merge commit 29a743a8) |
| `data/seed_claims_v2.json` present on main | ✅ CONFIRMED |
| No import route called yet | ✅ CONFIRMED |
| No D1 touched | ✅ CONFIRMED |
| **D-78 BLOCKER: importer reads src/seed-data.js, not data/seed_claims_v2.json** | ⛔ SEE SECTION 4.1 |
| D-78B dry-run execution | ⛔ BLOCKED — see Section 4.1 and Section 8 |
| D-79 production apply | ⛔ BLOCKED — requires D-78B completion + separate explicit approval |

---

## 4. Importer Audit

### 4.1 — CRITICAL: Importer Does Not Read data/seed_claims_v2.json

**This is the primary blocker for D-78B.**

`src/importer.js` line 1 reads:
```js
import { HUMANX_SEED } from './seed-data.js';
```

The importer is hardwired to `src/seed-data.js`. It reads `HUMANX_SEED` from that module
at build/deploy time. It does NOT read `data/seed_claims_v2.json`.

**If `/api/import-seed?mode=dry-run` were called today**, the dry-run report would reflect
the 4 demo claims in `src/seed-data.js`:

| seed_id | claim |
|---------|-------|
| `seed-flat-earth` | The Earth is flat |
| `seed-moon-landing` | Humans landed on the Moon |
| `seed-dream-prediction` | A dream predicted my future |
| `seed-perpetual-motion` | Perpetual motion machines can produce free energy forever |

None of the 5 D-76D approved launch claims would appear in that dry-run output.

**Resolution required before D-78B:** A separate Worker PR must update `src/seed-data.js`
(or the importer) to source the 5 approved claims from `data/seed_claims_v2.json`.
The current `src/seed-data.js` demo claims also have empty `source_url` fields — the
SOURCE_NEEDED apply-mode guard in `src/importer.js` (lines 22–40) would block `mode=apply`
for the demo claims, but `mode=dry-run` would still run against them.

This blocker is documented as a gating step in Section 8 (Go/No-Go Criteria).

---

### 4.2 — Route Path

```
GET /api/import-seed
```

Implemented in `src/worker.js` (line 34). Requires admin authentication via
`x-humanx-admin` header (value must match `env.HUMANX_ADMIN_TOKEN`).

---

### 4.3 — Dry-Run Default Behavior

- `mode` query parameter defaults to `'dry-run'` if omitted.
- Valid values: `'dry-run'` or `'apply'`. Any other value returns HTTP 400:
  ```json
  { "error": "INVALID_MODE", "message": "mode must be 'dry-run' or 'apply'" }
  ```
- In dry-run mode, the importer reads the DB to detect duplicates but writes nothing.
- All `would_create` / `would_skip` counts are populated; `created` / `skipped` remain 0.
- The SOURCE_NEEDED guard is **not** checked in dry-run (it only blocks apply mode).

---

### 4.4 — Apply Behavior (not executed in D-78B)

- `mode=apply` triggers real DB writes.
- SOURCE_NEEDED guard runs first (lines 22–40): if any evidence `source_url` is empty or
  contains `'SOURCE_NEEDED'`, returns HTTP 200 with:
  ```json
  {
    "ok": false,
    "error": "SOURCE_NEEDED_BLOCKED",
    "message": "Import blocked: N evidence item(s) have empty or SOURCE_NEEDED source_url..."
  }
  ```
- All 5 D-76D claims have populated `source_url` fields → guard would pass for launch claims
  (once the importer is updated to read them).
- Claims inserted with `review_state = reviewState` (default `'review'`).
- Evidence inserted with `review_state = reviewState` (default `'review'`).
- Pressure points and tests are inserted without `review_state` (column not present).

---

### 4.5 — Required Request Shape

```
GET /api/import-seed?mode=dry-run
Headers:
  x-humanx-admin: <HUMANX_ADMIN_TOKEN>
```

No request body required or used (route uses `request.method === 'GET'`).
`mode` is a URL query parameter only.

---

### 4.6 — Seed File Path (Current vs Required)

| State | Seed data source |
|-------|-----------------|
| Current (as-deployed) | `src/seed-data.js` — 4 demo claims, empty `source_url` |
| Required for D-78B | `src/seed-data.js` updated to export the 5 D-76D approved claims, OR importer updated to read `data/seed_claims_v2.json` |

`data/seed_claims_v2.json` is a static JSON file in the repo. Cloudflare Workers do not
natively import JSON files at runtime the same way Node.js does. The cleanest path is to
update `src/seed-data.js` to export the 5 approved claims (matching the field shape it
already uses) rather than JSON file parsing.

---

### 4.7 — Expected Response Shape (dry-run)

When the importer runs in dry-run mode, the full JSON response shape is:

```json
{
  "ok": true,
  "mode": "dry-run",
  "seed_version": <number>,
  "review_state": "review",
  "claims": {
    "would_create": <n>,
    "would_skip": <n>,
    "created": 0,
    "skipped": 0
  },
  "evidence": {
    "would_create": <n>,
    "would_skip": <n>,
    "created": 0,
    "skipped": 0,
    "source_needed_blocked": 0
  },
  "pressure": {
    "would_create": <n>,
    "would_skip": <n>,
    "created": 0,
    "skipped": 0
  },
  "tests": {
    "would_create": <n>,
    "would_skip": <n>,
    "created": 0,
    "skipped": 0
  },
  "warnings": []
}
```

**Expected counts for the 5 D-76D launch claims (once importer is updated):**

| Object | would_create (fresh DB) | would_skip |
|--------|------------------------|------------|
| claims | 5 | 0 |
| evidence | 10 | 0 |
| pressure | 4 | 0 |
| tests | 0 | 0 |

If any claim or evidence item is already in the DB (e.g., from a previous dry-run that
somehow triggered apply), `would_skip` will be non-zero. Dry-run detects duplicates via
the `duplicate_signature` column on evidence and `normalized_claim` on claims.

`seed_version` will reflect the `version` field from `HUMANX_SEED` in `src/seed-data.js`.
After the importer is updated, this should be `2` (matching `data/seed_claims_v2.json`
top-level `"version": 2`).

---

### 4.8 — Known Failure Modes

| Failure | HTTP | Error key | Cause |
|---------|------|-----------|-------|
| Missing or wrong admin token | 403 | `ADMIN_REQUIRED` | `x-humanx-admin` header absent or does not match env secret |
| Invalid mode param | 400 | `INVALID_MODE` | `?mode=` value other than `dry-run` / `apply` |
| SOURCE_NEEDED blocked (apply only) | 200 | `SOURCE_NEEDED_BLOCKED` | Any evidence `source_url` empty or contains `SOURCE_NEEDED` |
| DB unavailable | 500 | (Worker error) | D1 binding failure |
| Importer still on demo claims | 200 | (no error, wrong data) | `src/seed-data.js` not yet updated — dry-run output will show demo claims, not launch v2 |

---

### 4.9 — review_state Default Confirmation

`importSeedData` signature (line 9):
```js
export async function importSeedData(env, { dryRun = true, reviewState = 'review' } = {}) {
```

The route does not pass `reviewState` explicitly (line 34 of worker.js):
```js
return json(await importSeedData(env, { dryRun: mode !== 'apply' }));
```

Therefore `reviewState` defaults to `'review'` for all imported claims and evidence.
All 5 launch seed claims and all 10 evidence items will land with `review_state = 'review'`
on apply — not publicly visible until promoted through the admin Review UI.

---

### 4.10 — Top-Level Metadata Safety

`data/seed_claims_v2.json` has a top-level `metadata` block with `review_state_intended`,
`purpose`, `gate`, `claims_count`, `source_doc`, and `review_doc` fields.

The importer reads `HUMANX_SEED.claims` (an array) and `HUMANX_SEED.version` only.
Any extra top-level fields on `HUMANX_SEED` (or in a JSON wrapper) are ignored.

When `src/seed-data.js` is updated to export the launch claims, the `metadata` block from
`data/seed_claims_v2.json` does not need to be included in the JS export — only `version`
and `claims` are consumed by the importer. Extra top-level fields are safe to include but
will be silently ignored.

---

### 4.11 — Claim Object Shape Compliance (data/seed_claims_v2.json vs importer)

| Importer field read | Present in seed_claims_v2.json claim objects | Notes |
|--------------------|---------------------------------------------|-------|
| `claim` | ✅ | |
| `category` | ✅ | |
| `type` | ✅ | |
| `status` | ✅ | |
| `evidence_score` | ✅ (null) | importer binds null → DB stores NULL → recalcClaimScore corrects post-import |
| `survivability` | ✅ (null) | same |
| `testability` | ✅ (null) | same |
| `pressure.length` | ✅ | used as `contradictions` value in INSERT |
| `evidence[].stance` | ✅ | |
| `evidence[].quality` | ✅ | |
| `evidence[].title` | ✅ | |
| `evidence[].body` | ✅ | |
| `evidence[].source_url` | ✅ all 10 populated | SOURCE_NEEDED guard passes |
| `evidence[].media_type` | ✅ | |
| `evidence[].reliability_score` | ✅ | |
| `pressure[].title` | ✅ | |
| `pressure[].body` | ✅ | |
| `pressure[].severity` | ✅ (all 4 set to 5) | |
| `tests[]` | ✅ (all 5 empty arrays) | |
| `seed_id` | present but NOT read by importer | used for human provenance only; not inserted to DB |
| `pressure[].source_url/quality/stance/reliability_score` | present but NOT read by importer | extended provenance fields; importer reads title/body/severity only; safely ignored |

No field mismatch or shape conflict exists between `data/seed_claims_v2.json` and the
current importer, once the importer is updated to source the launch claims.

---

## 5. Preflight Checklist — Required Before Any Future Dry-Run

All items must be satisfied before D-78B is approved and executed.

| # | Check | Required state | Current state |
|---|-------|---------------|---------------|
| 1 | D-78-Blocker PR merged | `src/seed-data.js` updated to export 5 D-76D approved launch claims; branch + PR, no direct main | ⛔ NOT YET — see Section 4.1 |
| 2 | `main` pulled and clean | `git pull origin main` — no uncommitted changes | ✅ Confirmed at D-78A start |
| 3 | D-77 PR #102 merged | commit 29a743a8 on main | ✅ Confirmed |
| 4 | Static checks pass (119/24/39) | `node scripts/hardening-smoke-test.mjs` — 119 passed; `node scripts/belief-engine-static-check.mjs` — 24 passed; `node scripts/worker-route-static-check.mjs` — 39 passed | ✅ Confirmed at D-78A |
| 5 | JSON parse pass | `node -e "require('./data/seed_claims_v2.json')"` exits 0 | ✅ Confirmed at D-78A |
| 6 | SOURCE_NEEDED guard in claim objects | `grep -n "SOURCE_NEEDED" data/seed_claims_v2.json` — zero matches inside claim objects | ✅ Confirmed — only match is line 5 `metadata.review_state_intended` (top-level, not a claim object) |
| 7 | No TODO inside claim objects | `grep -n '"TODO"' data/seed_claims_v2.json` — zero matches | ✅ Confirmed |
| 8 | No launch_blocker / draft-only fields inside claim objects | grep for `launch_blocker`, `draft_only`, `review_state_intended` inside claim objects — zero | ✅ Confirmed (`review_state_intended` is top-level metadata only) |
| 9 | All evidence source_url populated | node check: zero empty `source_url` in any evidence item | ✅ Confirmed at D-77 |
| 10 | Explicit per-session user approval | User must grant approval in the same session as the dry-run call | ⛔ NOT YET granted |
| 11 | D-78-Blocker PR Read Smoke | Read Smoke passes on the post-Blocker-PR main | ⛔ NOT YET — requires Blocker PR first |

---

## 6. Proposed Future Dry-Run Command

> ⛔ **BLOCKED — DO NOT RUN**
>
> The command below must not be executed until:
> (a) The D-78-Blocker PR (updating `src/seed-data.js`) is merged and deployed,
> (b) All preflight checklist items in Section 5 are satisfied, and
> (c) The user grants explicit per-session approval in the same session as execution.

```
# FUTURE COMMAND — NOT TO BE EXECUTED UNTIL UNBLOCKED
# Requires:
#   - D-78-Blocker PR merged (src/seed-data.js updated to 5 launch claims)
#   - Cloudflare deployment of updated Worker confirmed
#   - Explicit per-session user approval granted
#   - HUMANX_ADMIN_TOKEN value confirmed from env

curl -s -X GET \
  "https://humanx.rinkimirikata.com/api/import-seed?mode=dry-run" \
  -H "x-humanx-admin: <HUMANX_ADMIN_TOKEN>" \
  | jq .
```

If the exact admin token value cannot be confirmed before execution, do not proceed —
request the token value from the user in the same session as the approval grant.

---

## 7. Expected Dry-Run Output to Paste Back for Review

When the dry-run is eventually executed, paste the **complete untruncated JSON response**
and **HTTP status code** back for review. The paste must include all of the following:

| Field | What to verify |
|-------|---------------|
| HTTP status | Must be `200` |
| `ok` | Must be `true` |
| `mode` | Must be `"dry-run"` |
| `seed_version` | Must be `2` (after Blocker PR update) |
| `review_state` | Must be `"review"` |
| `claims.would_create` | Expected `5` (fresh); `0` if all 5 already exist |
| `claims.would_skip` | Expected `0` (fresh); `5` if all already exist |
| `evidence.would_create` | Expected `10` (fresh) |
| `evidence.source_needed_blocked` | Must be `0` |
| `pressure.would_create` | Expected `4` (fresh) |
| `tests.would_create` | Expected `0` (all claims have empty tests arrays) |
| `claims.created` | Must be `0` (dry-run writes nothing) |
| `evidence.created` | Must be `0` (dry-run writes nothing) |
| `pressure.created` | Must be `0` (dry-run writes nothing) |
| `warnings` | Preferably empty array; any warnings must be reviewed |

**If any of the following appear in the response, treat as a D-78B failure:**
- `"ok": false` for any reason
- `"error": "SOURCE_NEEDED_BLOCKED"` (indicates importer still pointing to demo claims with empty source_url)
- `claims.would_create: 0` AND `claims.would_skip: 0` (importer reading no claims)
- `seed_version: 1` (importer still reading demo src/seed-data.js, not launch v2)
- HTTP 403 (admin token missing or wrong)
- HTTP 400 (mode param invalid)
- HTTP 500 (Worker or D1 error)

---

## 8. Go/No-Go Criteria for D-78B Execution

D-78B may NOT be executed until **all** of the following are satisfied:

| # | Criterion | Gate |
|---|-----------|------|
| 1 | D-78-Blocker PR merged and deployed | Branch + PR required; no direct main commit; Worker deployed to Cloudflare |
| 2 | All 11 preflight checklist items (Section 5) satisfied | Verify each item before calling route |
| 3 | Explicit per-session user approval granted | Must be stated in the same session as the curl call |
| 4 | Admin token confirmed | Must not guess or invent the token value |
| 5 | D-78B dry-run response reviewed before any apply | `mode=apply` must NOT be called in the same session as the dry-run without a separate explicit apply approval |

---

## 9. D-78-Blocker: Required Preparatory Work

Before D-78B can execute a meaningful dry-run of the launch seed v2:

**Action required:** Update `src/seed-data.js` to export the 5 D-76D approved claims.

This is a Worker source file change and therefore requires:
- A feature branch (e.g. `feature/d78-blocker-seed-data-update`)
- A PR — no direct main commit
- The PR must update `export const HUMANX_SEED` in `src/seed-data.js` to match the 5 launch
  claims from `data/seed_claims_v2.json`, with the correct importer field shape
- `version` field must be updated to `2`
- All demo claims (flat-earth, moon-landing, dream-prediction, perpetual-motion) must be
  removed or replaced
- After merge: Cloudflare deploys the updated Worker automatically (or confirm deployment)
- After deployment: Read Smoke must pass

The Blocker PR does NOT call any import route or touch D1.
The Blocker PR may be combined with D-78A documentation (this doc) into a single PR,
or kept separate. Either way it requires explicit user approval as a code-change PR.

---

## 10. Rollback / Non-Rollback Note

**Dry-run (D-78B):** No DB writes occur. No rollback is needed or possible — there is
nothing to roll back. If the dry-run response is unexpected, the correct action is to
investigate and fix before proceeding to apply, not to roll back.

**Production apply (D-79):** All 5 claims and their evidence land with `review_state = 'review'`
(not publicly visible). The admin Review UI can reject or archive them individually.
No bulk delete mechanism exists — plan for moderation through the Review UI.
D-79 is a separate gated step and must not be called in the same session as D-78B unless
a separate explicit apply approval is granted.

---

## 11. Next Gate

| Step | Requirement | Status |
|------|-------------|--------|
| D-78-Blocker PR | Update `src/seed-data.js` to 5 launch claims; branch + PR | ⛔ NOT YET — requires explicit user instruction |
| D-78B | Execute `GET /api/import-seed?mode=dry-run`; paste full response | ⛔ BLOCKED on Blocker PR + explicit per-session approval |
| D-79 | Execute `GET /api/import-seed?mode=apply`; moderate all new `review_state='review'` items | ⛔ BLOCKED — requires D-78B completion + separate explicit per-session D1/write approval |

**D-78B may only execute after the Blocker PR is merged and the user grants explicit
per-session approval in the same session as the curl call.**

---

## 12. Safety Confirmation

| Rule | Status |
|------|--------|
| No import route called | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No curl to production | ✅ Confirmed |
| No Co-Authored-By | ✅ Confirmed |
| Static checks 119/24/39 | ✅ Confirmed at D-78A |
| JSON parse pass (seed_claims_v2.json) | ✅ Confirmed |
| SOURCE_NEEDED grep: 0 matches in claim objects | ✅ Confirmed |
| TODO grep: 0 matches | ✅ Confirmed |
| launch_blocker grep: 0 matches | ✅ Confirmed |

---

## D-78A Completion Record

| Item | Status |
|------|--------|
| Purpose and scope documented | ✅ |
| Non-execution statement included | ✅ |
| Current gate state documented | ✅ |
| CRITICAL blocker identified: importer reads src/seed-data.js, not data/seed_claims_v2.json | ✅ |
| Route path, request shape, dry-run default audited from code | ✅ |
| Apply behavior and SOURCE_NEEDED guard audited from code | ✅ |
| Expected response shape and counts documented | ✅ |
| Claim object shape compliance verified (all fields match) | ✅ |
| review_state default ('review') confirmed from code | ✅ |
| Top-level metadata safety confirmed (ignored by importer) | ✅ |
| Preflight checklist (11 items) defined | ✅ |
| Future dry-run command marked BLOCKED — DO NOT RUN | ✅ |
| Expected dry-run output fields and failure conditions defined | ✅ |
| Go/no-go criteria for D-78B defined | ✅ |
| D-78-Blocker action described | ✅ |
| Rollback/non-rollback note included | ✅ |
| Next gate table provided | ✅ |
| Safety confirmation table completed | ✅ |
| docs/README.md updated with D-78 entry | ✅ |
| Static checks 119/24/39 passed | ✅ |
| JSON parse check passed | ✅ |
| SOURCE_NEEDED/TODO/launch_blocker grep checks passed | ✅ |
| No import route called | ✅ |
| No D1/Wrangler/live command executed | ✅ |
