# HumanX Docs Index

Quick reference for all documentation in this folder.
Read the relevant file before starting any task that touches the area it covers.

---

## ⚠ Standing Warnings

These apply to every task in this repo unless the user explicitly overrides them.

| Warning | Detail |
|---|---|
| **Active Worker entrypoint** | `src/worker.js` — do not remove or rename without a deployment change |
| **Active frontend** | `public/index.html`, `public/app-v10.js`, `public/styles.css` — response shape changes will break these silently |
| **Belief Engine** | `public/apps/humanx-belief-engine/index.html` — standalone app, navigated to by hard redirect from the main frontend |
| **Do not rerun migration 0004** | `migrations/0004_unique_normalized_content.sql` is already applied to production D1. Running it again will fail. |
| **Do not rerun migration 0005** | `migrations/0005_add_home_tests_updated_at.sql` was applied manually via Cloudflare D1 console. Do not rerun it unless the target database is known to be missing `home_tests.updated_at`. |
| **Do not run Wrangler or D1 commands** | `wrangler d1 execute`, `wrangler deploy`, and all variants are off-limits unless the user explicitly requests them in the task. |
| **Keep tasks small and branch-based** | One branch per task. Show diff before committing. Stop after commit — do not push. The user pushes and merges manually. |

---

## 1. Current Status / Baseline

Read these first when starting a new session or returning after time away.

### `OPERATIONAL_STATUS.md`
Confirmed live deployment facts: Worker entrypoint, assets directory, D1 binding and database name, all hardening work done before PR #13, migration 0004 status, and current working rules for all tasks.
**Read when:** starting any task, confirming what is live, or checking whether a hardening step has already been done.

### `MANUAL_FRONTEND_SMOKE_CHECKLIST.md`
Human-runnable QA checklist for every view in the main app. Covers navigation, form flows, empty states, mobile layout, and the Belief Engine save bridge.
**Read when:** before or after any change that could affect the visible frontend; required before deploying any Worker or frontend change.

### `CURRENT_BASELINE_AFTER_SMOKE_CHAIN.md`
Concise known-good baseline after completing the full smoke-test chain: live frontend QA (desktop and phone), read endpoint smoke (15 passed), write smoke dry-run, live write smoke (4 passed), and manual smoke-claim cleanup (rejected via Review UI). Includes active deployment facts, proof-file index, safe next work, and do-not-touch warnings.
**Read when:** at the start of any new HumanX session before choosing next work, or when checking what has already been tested and cleaned up.
**Safety note:** Confirms migration 0004 must not be rerun, Wrangler/D1 must not be used casually, and live write smoke tests require explicit per-session approval.

### `ADD_TEST_FIX_RESULT.md`
Records the completed Add Test repair and live verification. Covers the original failure (`D1_ERROR: table home_tests has no column named updated_at`), root cause (production D1 table predated the schema column), the fix path (await dispatch fix, migration 0005, manual D1 console apply), and confirmed live results: title `Sniff`, instructions `Sniff Butt`, appearing in Study Tests and Claim Flow.
**Read when:** before changing `/api/tests`, `home_tests` schema, Study Claim Tests UI, or test display in the Claim Flow.
**Safety note:** Migration `0005_add_home_tests_updated_at.sql` was applied manually through the Cloudflare D1 console; do not rerun it unless the target database is known to be missing `home_tests.updated_at`. Known artefact: `Sniff / Sniff Butt` exists as a visible smoke-test marker in production — leave it unless intentionally cleaning it through the normal UI or admin process.

### `LOCAL_STATIC_CHECKS_USAGE.md`
Simple usage guide for running the two local static check scripts before or after risky changes. Covers both `scripts/belief-engine-static-check.mjs` (24 hard checks) and `scripts/worker-route-static-check.mjs` (35 hard checks): exact run commands, safety properties, when to run each, what they do not prove, relationship to smoke tests, and stop conditions.
**Read when:** before running either static check script, or before/after any Belief Engine or Worker route change.
**Safety note:** Local file reads only. No network, no production calls, no D1/Wrangler, no mutation. Last known-good results: Belief Engine static check — 24 passed, 0 failed, 0 warnings. Worker route static check — 35 passed, 0 failed, 0 warnings.

---

## 2. Backend / API Safety

Read before touching any route, write endpoint, duplicate handling, or rate limiting logic.

### `API_ENDPOINT_INVENTORY.md`
A descriptive table of every `/api/...` route in `src/worker.js`, grouped by area. Includes method, path, purpose, visibility, D1 tables touched, and risk notes for each endpoint. Marks module-delegated routes as uncertain where the source of truth is a separate file.
**Read when:** planning any Worker change, auditing the API surface, or checking which tables a route touches.

### `PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`
Risk map for every public and semi-public mutating endpoint. Covers current protection (rate limits, auth requirements), main abuse risk, duplicate/race risk, and required test coverage per endpoint. Includes a do-not-touch warning list.
**Read when:** before changing any write endpoint, its rate limit, its response shape, or its auth requirement.

### `BACKEND_SMOKE_TEST_PLAN.md`
Defines the minimum backend proof required before any Worker routing change or module split. Documents what the existing `scripts/hardening-smoke-test.mjs` actually tests (pure functions and mock DB only — no HTTP, no live D1), what it does not cover, and what future test groups should be added. Includes a full behaviour checklist.
**Read when:** before starting the Worker modular split, before changing any endpoint handler, or before adding new automated tests.

### `D1_DUPLICATE_CLEANUP.md`
Explains why migration 0004 may fail on a database with duplicate `normalized_statement` or `normalized_claim` values, how to diagnose duplicates using the diagnostics SQL, and the safe manual cleanup sequence (mark before delete, re-point child rows, never blindly delete).
**Read when:** investigating a failed migration 0004 run, cleaning up duplicate claim or truth rows, or understanding the `normalized_claim` / `normalized_statement` unique index constraints.

### `WORKER_ROUTE_STATIC_CHECK_SPEC.md`
Defines the local static route/docs consistency check for Worker API routes. Specifies how `/api/...` route strings are extracted from `src/worker.js` and cross-referenced against `docs/API_ENDPOINT_INVENTORY.md` and `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`. Includes high-risk route list, hard-failure vs warning criteria, limitations, and stop conditions. No Worker execution, no network, no D1/Wrangler.
**Read when:** before changing `src/worker.js` route handling, the endpoint inventory, the public write risk map, or beginning any Worker modular split step.
**Safety note:** Local/static only. Does not execute the Worker or prove endpoint behaviour.

### `WORKER_ROUTE_STATIC_CHECK_RESULT.md`
Records the successful post-inventory-fix static route check from 2026-06-01: 35 passed, 0 failed, 0 warnings, exit 0. Confirms all high-risk and public-write routes are aligned between `src/worker.js` and `docs/API_ENDPOINT_INVENTORY.md`, including `/api/claim-vote` which was missing from the inventory prior to this fix.
**Read when:** before deciding whether route docs are currently aligned with the Worker source, or comparing a new run against this baseline.
**Safety note:** Proves static route/docs alignment only — does not prove endpoint behaviour, response shapes, rate-limit enforcement, or live deployment state.

---

## 3. Belief Engine

Read before touching scoring logic, contradiction rules, the bridge script, or the Drift page.

### `BELIEF_ENGINE_SCORING_NOTES.md`
Internal reference for the Belief Engine's scoring architecture. Covers the 9 core dimensions vs 10 forensic dimensions, `CHOICE_SCALE` calibration and why changing it silently shifts all scenario-weighted scores, choice-index contradiction risk (reordering choices breaks contradiction checks silently), the Timeline optional-answer limitation, coherence score penalty weights, and safe change rules.
**Read when:** before touching any scoring logic, contradiction rule, question weight, or `CHOICE_SCALE` value in `public/apps/humanx-belief-engine/index.html`.

### `BELIEF_ENGINE_TEST_PLAN.md`
Practical test plan for the Belief Engine before any scoring, contradiction, profile, or bridge change. Documents the exact `isFullBeliefProfile` classification logic used by Drift, the three bridge payload fields that must not change (`source`, `engineVersion`, `label`), the scoring formulas for `stabilityScore`, `opennessScore`, and `pressureScore`, five manual test profiles with expected outputs, and a required-proof checklist before any scoring change.
**Read when:** before any Belief Engine change — scoring, contradiction rules, bridge payload, or Drift integration.

### `BELIEF_ENGINE_STATIC_CHECK_SPEC.md`
Defines the local static marker check for the Belief Engine: which files are read, which nav links, bridge markers, questionnaire content, result section markers, and frontend secret/provider-call absence checks must pass. Includes expected output format, exit codes, limitations, and stop conditions. No network calls, no D1/Wrangler, no browser automation.
**Read when:** before changing Belief Engine scoring, contradiction logic, result UI, bridge wiring, or `isFullBeliefProfile` Drift classification.
**Safety note:** Spec is static and non-mutating. Does not replace manual Belief Engine QA or browser-based tests.

### `BELIEF_ENGINE_STATIC_CHECK_USAGE.md`
Step-by-step guide for running `scripts/belief-engine-static-check.mjs`. Covers what the script checks (route/link markers, Drift classifier strings, questionnaire content, result markers, bridge script tag, bridge payload strings, secret/provider-URL absence), what it does not check, the exact run command, the expected known-good output, safety properties, when to run, and stop conditions.
**Read when:** before running the static check manually, or before/after any Belief Engine scoring, contradiction, UI, bridge, or Drift-classification change.
**Safety note:** Local file reads only. No network, no production calls, no D1/Wrangler, no mutation. Last known-good result: 24 passed, 0 failed, 0 warnings.

### `BELIEF_ENGINE_STATIC_CHECK_RESULT.md`
Records the known-good local static check result from 2026-06-01: 24 passed, 0 failed, 0 warnings, exit 0. Confirms all nav links, classifier markers, questionnaire and result section markers, bridge script tag, bridge payload strings, and absence of frontend secrets/provider-call URLs.
**Read when:** before deciding whether Belief Engine static markers are currently known-good, or comparing a new run against this baseline.
**Safety note:** Proves static markers only — does not prove questionnaire completion, scoring correctness, mobile layout, or bridge POST success.

---

## 4. Refactor Planning

Read before proposing or beginning any structural change to the Worker or frontend.

### `WORKER_MODULAR_SPLIT_PLAN.md`
Controlled plan for a future safe split of `src/worker.js` into smaller modules. Documents current known facts (entrypoint, D1 binding, migration state, active frontend files), the proposed module layout (proposal only), the required safe migration sequence (8 numbered steps), highest-risk areas, required proof before implementation, and stop conditions.
**Read when:** considering any refactor of Worker routing, before extracting any helper into a module, or before starting the first implementation PR for the split.

---

## 5. Reference / Architecture Background

Older context documents. Useful for understanding design decisions but not required reading before routine tasks.

### `HUMANX_ARCHITECTURE.md`
High-level architecture document describing HumanX as a shared adversarial truth-pressure system: pseudonymous identity, no free public AI inference, BYO-AI via RunPack packets, and the core design constraints that shape the API.
**Read when:** onboarding to the project or questioning a design decision about auth, AI usage, or data model.

### `HUMANX_STRUCTURE.md`
Describes the umbrella structure of HumanX — Belief Engine, Claims, Truths, Evidence Vault, Drift, and RunPack — and how the layers relate to each other.
**Read when:** understanding how the major subsystems fit together, or planning a feature that touches multiple layers.

### `AIP-HUMANX.md`
Explains the AIP (Analysis in Packet) / RunPack-first mode: why the owner's API budget is not used for public inference, how the packet generation and paste-back flow works, and why `GET /api/ai/analyse` intentionally returns HTTP 402.
**Read when:** investigating the `RUNPACK_MODE` error, understanding why the AI analysis endpoint is blocked, or planning anything that involves AI inference.

### `FRONTEND_SPLIT_PLAN.md`
Earlier plan for splitting the large single-file frontend. Superseded in practice by the current `public/app-v10.js` structure but retains useful context about what motivated the split and what the growth pressure points were.
**Read when:** investigating frontend file size, planning a future frontend module split, or understanding why the app is structured the way it is.

### `NEXT_PATCH_IMPORT_SEED.md`
Notes from an earlier patch cycle about the seed import route. Describes the state before `src/importer.js` and `GET /api/import-seed` were added. Largely superseded by the current Worker; retained as a historical reference.
**Read when:** investigating the seed/import route history or understanding what was added in early patching.

---

## 6. Smoke Testing

Automated HTTP smoke tests against the live Worker. Read the spec before changing any covered endpoint; read the usage doc before running a script.

**Standing status (as of 2026-06-01):**
- Read smoke test passed live on 2026-06-01 — see `docs/LIVE_READ_SMOKE_RESULT.md`.
- Write smoke dry-run passed safely on 2026-06-01 — see `docs/WRITE_SMOKE_DRY_RUN_RESULT.md`.
- Write live smoke passed on 2026-06-01 — see `docs/LIVE_WRITE_SMOKE_RESULT.md`.
- Live write smoke created claim `clm_54be6272abbc49d282` in `reviewState: 'review'`. Cleanup was completed manually through the HumanX Review/admin UI — final observed state was rejected. The claim was not approved.
- Do not use D1 or Wrangler commands for any purpose — use the HumanX UI or admin process only.
- Do not run additional write smoke tests against production unless explicitly approved in the current task.
- Do not rerun migration 0004.

### `docs/READ_ENDPOINT_SMOKE_TEST_SPEC.md`
Defines the full contract for the read-endpoint smoke test: which routes are covered, expected status codes, response shape assertions, and pass/fail criteria. No mutations — all requests are read-only.
**Read when:** planning any change to a GET endpoint, interpreting a smoke-test failure, or auditing read-endpoint coverage.

### `docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md`
Step-by-step instructions for running `scripts/read-endpoint-smoke-test.mjs` against a target base URL. Covers required env vars, how to interpret output, and what to do on failure.
**Read when:** about to run the read smoke test, or troubleshooting a failed run.

### `docs/LIVE_READ_SMOKE_RESULT.md`
Recorded result of the live read smoke test run on 2026-06-01. All assertions passed against production. Serves as the baseline proof that read endpoints were healthy at that point.
**Read when:** confirming the pre-existing read-endpoint baseline, or comparing a new run against the last known-good result.

### `docs/PUBLIC_WRITE_SMOKE_TEST_SPEC.md`
Defines the contract for the write-endpoint smoke test: which mutating routes are covered, expected responses, and safety gates. Describes the dry-run mode that is active by default and the explicit opt-in required to perform real mutations.
**Read when:** planning any change to a write endpoint, interpreting a write smoke-test failure, or auditing write-endpoint coverage.
**Safety note:** The write smoke test defaults to dry-run. Do not run it against production unless explicitly approved. Do not rerun migration 0004. Do not run Wrangler/D1 commands.

### `docs/WRITE_ENDPOINT_SMOKE_TEST_USAGE.md`
Step-by-step instructions for running `scripts/write-endpoint-smoke-test.mjs`. Documents the dry-run default, the mutation safety gate flag, required env vars, and how to interpret results.
**Read when:** about to run the write smoke test, or troubleshooting a failed run.
**Safety note:** Dry-run is the safe default. Explicit mutation mode requires a safety gate flag and must not be used against production without approval.

### `docs/WRITE_SMOKE_DRY_RUN_RESULT.md`
Records the confirmed dry-run behaviour of `scripts/write-endpoint-smoke-test.mjs` as observed on 2026-06-01. Proves that the script flags missing safety gates, prints generated payloads, makes no network requests, and exits 0 when mutation gates are absent.
**Read when:** before approving any live write smoke test, or confirming what the dry-run baseline looked like.
**Safety note:** Proves fail-safe dry-run behaviour only. Does not prove live write endpoint behaviour — no requests reached the Worker during this run.

### `docs/LIVE_WRITE_SMOKE_RESULT.md`
Records the explicitly approved live write smoke test run on 2026-06-01 against `https://humanx.rinkimirikata.com`. 4 checks passed, 0 failed. One smoke-test claim (`clm_54be6272abbc49d282`) was created and confirmed to land in `reviewState: 'review'` — not publicly visible. Manual admin reject/delete of that claim is still required.
**Read when:** before changing claim submission, `reviewState` behaviour, any public write endpoint, or the write smoke scripts themselves.
**Safety note:** One real D1 row was created during this run. Claim `clm_54be6272abbc49d282` must be rejected or deleted through the admin review process. Do not run additional live write smoke tests without explicit approval. Do not run Wrangler/D1. Do not rerun migration 0004.

### `docs/SMOKE_CLAIM_ADMIN_CLEANUP.md`
Manual admin cleanup note for smoke-test claim `clm_54be6272abbc49d282` created during the live write smoke test on 2026-06-01. Documents how to locate and reject/delete the claim through the HumanX Review/admin UI, what to verify afterwards, and what must not be done.
**Read when:** before or while cleaning the pending smoke claim from the admin review queue.
**Safety note:** Use the HumanX Review/admin UI only. Do not approve the smoke claim — that would make it publicly visible. Do not use D1 or Wrangler for cleanup. Do not rerun migration 0004.

### `docs/SMOKE_CLAIM_CLEANUP_RESULT.md`
Records the user-confirmed manual rejection of smoke-test claim `clm_54be6272abbc49d282` through the HumanX Review/admin UI. Final observed state: rejected. Cleanup used the Review UI only — no approval, no D1/Wrangler commands, no cleanup tooling.
**Read when:** after any live write smoke test, before deciding whether cleanup of the resulting claim is still pending.
**Safety note:** Cleanup was completed without approving the claim, without D1/Wrangler commands, and without adding any automated cleanup tooling.

### `scripts/read-endpoint-smoke-test.mjs`
Node script that fires HTTP requests against every covered read endpoint and asserts status codes and response shape. Read-only — makes no mutations. Already passed live on 2026-06-01.
**Use when:** verifying read endpoints after a Worker change. Safe to run without side effects.

### `scripts/write-endpoint-smoke-test.mjs`
Node script that exercises public write endpoints. Defaults to dry-run mode; a mutation safety gate flag must be set explicitly to send real writes. Do not run against production without explicit approval.
**Use when:** verifying write endpoints after a relevant Worker change, in dry-run mode only unless a mutation run has been explicitly approved.

---

## 7. Scripts and Diagnostics References

These files are not in `docs/` but are referenced by docs in this folder.

### `docs/LOCAL_STATIC_CHECKS_USAGE.md`
Combined usage guide for both local static check scripts. Covers purpose, exact run commands, safety properties (local reads only — no network, no production, no D1/Wrangler, no mutation), when to run each script, what they do not prove, how they relate to smoke tests, and stop conditions. Known-good results: Belief Engine static check — 24 passed, 0 failed, 0 warnings; Worker route static check — 35 passed, 0 failed, 0 warnings.
**Read when:** before running `scripts/belief-engine-static-check.mjs` or `scripts/worker-route-static-check.mjs`, or when deciding which static check applies to a pending change.

### `scripts/worker-route-static-check.mjs`
Local static Worker route/docs consistency checker. Reads `src/worker.js`, `docs/API_ENDPOINT_INVENTORY.md`, and `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`; cross-references route strings against the inventory; confirms all high-risk and public-write routes are documented. 35 hard checks. No network, no Worker execution, no D1/Wrangler, no production mutation.
**Use when:** before and after any Worker route addition/removal/rename, endpoint inventory update, public write risk map update, or Worker modular split step. Run with `node scripts/worker-route-static-check.mjs`. All 35 checks must pass.

### `scripts/belief-engine-static-check.mjs`
Local static Belief Engine integrity checker. Reads `public/index.html`, `public/app-v10.js`, `public/apps/humanx-belief-engine/index.html`, and `humanx-bridge.js`; asserts nav links, Drift classifier markers, questionnaire and result section content, bridge script tag, bridge payload strings, and absence of frontend API key/provider-call markers. 24 hard checks. No network, no D1/Wrangler, no production mutation.
**Use when:** before and after any Belief Engine scoring, contradiction, UI, bridge, or Drift-classification change. Run with `node scripts/belief-engine-static-check.mjs`. All 24 checks must pass.

### `scripts/hardening-smoke-test.mjs`
**Run:** `node scripts/hardening-smoke-test.mjs`
16 unit tests (no HTTP, no live D1) covering: `isUniqueConstraintError` pure function, `meaningKey` normalisation stability, mock `attachEvidenceToClaim` INSERT OR IGNORE id fix, and `safeRateLimit` fail-closed behaviour.
**Use when:** confirming hardening logic is intact after any change to `src/worker.js` or before a Worker refactor. Note: the inlined helper copies in this script may drift from `src/worker.js` during a refactor — check they still match.

### `scripts/backfill-normalized-content.mjs`
Backfill script for claim and truth rows with missing `normalized_claim` / `normalized_statement` values. Must be run before migration 0004 if the column exists but has NULL values for existing rows.
**Use when:** preparing for migration 0004 on a database that predates the normalization column, or recovering from a failed migration caused by NULL values. Only run on explicit user instruction.

### `migrations/0005_add_home_tests_updated_at.sql`
Adds the `updated_at` column to `home_tests` via `ALTER TABLE`. Applied manually through the Cloudflare D1 console on the production database. The column is now present on production; do not rerun this migration against any database where `home_tests.updated_at` already exists.
**Use when:** reviewing the Add Test schema fix, or understanding why the migration was applied manually rather than via Wrangler. See `docs/ADD_TEST_FIX_RESULT.md` for full context.

### `migrations/diagnostics_duplicate_normalized_content.sql`
Read-only SQL diagnostics for finding duplicate `normalized_statement` and `normalized_claim` values before migration 0004. Does not mutate data.
**Use when:** investigating whether a database has duplicate rows that would block migration 0004. Run via `wrangler d1 execute` only on explicit user instruction. See `docs/D1_DUPLICATE_CLEANUP.md` for the full procedure.

---

## Maintenance Rule

Update this index whenever a new doc is added to `docs/`, an existing doc is removed or renamed, or a doc's purpose materially changes. Keep descriptions to one or two sentences and the "when to read" note to one line.
