# Current Baseline After Smoke Chain

## 1. Purpose

This document records the current known-good HumanX baseline after completing the full
smoke-test chain: live read endpoint smoke, write dry-run, live write smoke, and manual
cleanup of the resulting smoke-test claim. It is the consolidated status reference for
starting any new work from this point.

---

## 2. Current Known-Good Status

| Area | Status |
|---|---|
| Live frontend QA | Passed on desktop and phone |
| Read endpoint smoke | **15 passed, 0 failed, 0 skipped** — see `docs/LIVE_READ_SMOKE_RESULT.md` |
| Write smoke dry-run | Passed safely — no network requests made — see `docs/WRITE_SMOKE_DRY_RUN_RESULT.md` |
| Live write smoke | **4 passed, 0 failed** — see `docs/LIVE_WRITE_SMOKE_RESULT.md` |
| Smoke claim created | `clm_54be6272abbc49d282` landed in `reviewState: 'review'` (not public) |
| Smoke claim cleanup | Completed manually through HumanX Review/admin UI |
| Final smoke claim state | **Rejected** — confirmed by user via Review UI |
| Smoke claim approval | Not approved at any point |
| Belief Engine static check | **24 passed, 0 failed, 0 warnings** — local/static only, no network, no production, no D1/Wrangler — see `docs/BELIEF_ENGINE_STATIC_CHECK_RESULT.md` |
| Worker route static check | **35 passed, 0 failed, 0 warnings** — local/static only, no network, no production, no D1/Wrangler, no Worker execution; `/api/claim-vote` inventory gap found and fixed before this pass — see `docs/WORKER_ROUTE_STATIC_CHECK_RESULT.md` |
| Add Test live verification | **Passed** — `/api/tests` write path confirmed working after schema fix; migration `0005_add_home_tests_updated_at.sql` applied manually via Cloudflare D1 console; test artefact `Sniff / Sniff Butt` appears in Study Tests and Claim Flow — see `docs/ADD_TEST_FIX_RESULT.md` |

---

## 3. Active App / Deployment Facts

| Setting | Value |
|---|---|
| Main app shell | `public/index.html` |
| Frontend logic | `public/app-v10.js` |
| Stylesheet | `public/styles.css` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` |
| Worker entrypoint | `src/worker.js` |
| Assets directory | `./public` |
| D1 binding | `DB` |
| Database name | `humanx` |
| Database ID | `f68709d8-b93a-4e5b-8a0e-5b58cc357125` |

Configured in `wrangler.toml`. Do not change the database ID.

---

## 4. Smoke-Test Proof Files

| File | What it records |
|---|---|
| `docs/LIVE_READ_SMOKE_RESULT.md` | Full result of the live read endpoint smoke test |
| `docs/WRITE_SMOKE_DRY_RUN_RESULT.md` | Confirmed dry-run behaviour of the write smoke script |
| `docs/LIVE_WRITE_SMOKE_RESULT.md` | Full result of the live write smoke test |
| `docs/SMOKE_CLAIM_CLEANUP_RESULT.md` | Manual rejection of the smoke-test claim via Review UI |
| `scripts/read-endpoint-smoke-test.mjs` | Read-only smoke script (safe to run at any time) |
| `scripts/write-endpoint-smoke-test.mjs` | Write smoke script (dry-run default; live run requires explicit approval) |
| `docs/BELIEF_ENGINE_STATIC_CHECK_RESULT.md` | Known-good result of the local static Belief Engine check (24/0/0, 2026-06-01) |
| `docs/BELIEF_ENGINE_STATIC_CHECK_USAGE.md` | How to run the static check and interpret results |
| `scripts/belief-engine-static-check.mjs` | Local static Belief Engine integrity checker (no network, no mutation) |
| `docs/WORKER_ROUTE_STATIC_CHECK_RESULT.md` | Known-good result of the local static Worker route/docs check (35/0/0, 2026-06-01) |
| `docs/WORKER_ROUTE_STATIC_CHECK_SPEC.md` | Spec for the Worker route/docs static consistency check |
| `scripts/worker-route-static-check.mjs` | Local static Worker route/docs checker (no network, no mutation, no Worker execution) |
| `docs/ADD_TEST_FIX_RESULT.md` | Live verification result of the Add Test repair — D1 schema fix, frontend validation, and confirmed write path |
| `migrations/0005_add_home_tests_updated_at.sql` | Migration that added `updated_at` to `home_tests`; applied manually via Cloudflare D1 console |

---

## 5. Safe Next Work

These are appropriate next steps from this baseline, in rough priority order:

- **Frontend-only polish** — copy, empty states, badge improvements that do not touch
  backend routes or response shapes. Low risk; no smoke re-run required unless routes
  are affected.
- **Manual QA checklist after any frontend change** — run `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`
  in a browser before deploying any Worker or frontend change.
- **Read endpoint smoke after any backend change** — run
  `node scripts/read-endpoint-smoke-test.mjs https://humanx.rinkimirikata.com` to
  confirm the read baseline is intact. Compare against `docs/LIVE_READ_SMOKE_RESULT.md`.
- **Belief Engine static check before and after Belief Engine or Drift-classification changes** —
  run `node scripts/belief-engine-static-check.mjs` before and after any change to
  scoring logic, contradiction rules, bridge wiring, result UI, or `isFullBeliefProfile`
  classification. All 24 checks must pass. See `docs/BELIEF_ENGINE_STATIC_CHECK_USAGE.md`.
- **Tests before changing Belief Engine scoring** — see `docs/BELIEF_ENGINE_SCORING_NOTES.md`
  and `docs/BELIEF_ENGINE_TEST_PLAN.md` before touching any scoring logic, contradiction
  rule, or `CHOICE_SCALE` value.
- **Worker route static check before and after any Worker route, endpoint inventory, public write risk map, or modular split change** —
  run `node scripts/worker-route-static-check.mjs` before and after any such change.
  All 35 checks must pass. See `docs/WORKER_ROUTE_STATIC_CHECK_RESULT.md`.
- **Plan-only work before Worker modular split** — produce a written plan and review it
  before writing any code. See `docs/WORKER_MODULAR_SPLIT_PLAN.md`. Do not refactor
  Worker routing speculatively.
- **`/api/tests` is now a working baseline** — Add Test is confirmed working after the
  schema fix. Any future change to test-route handling (Worker dispatch, schema, frontend
  validation) should re-check Add Test manually and reference `docs/ADD_TEST_FIX_RESULT.md`.

---

## 6. Do-Not-Touch Warnings

- **Do not rerun migration 0004.** `migrations/0004_unique_normalized_content.sql` is
  already applied to production D1. Running it again will fail.
- **Do not rerun migration 0005** unless you are certain the target database is missing
  `home_tests.updated_at`. On production D1, this column now exists; rerunning will fail.
- **Do not remove `updated_at` from `home_tests`** in code or schema. The production
  table has this column and the backend INSERT depends on it.
- **Do not delete `Sniff / Sniff Butt`** unless intentionally cleaning the smoke-test
  artefact. It is a known, harmless test marker. Use the normal UI or admin process if
  removal is desired; do not use D1/Wrangler unless explicitly requested.
- **Do not run Wrangler or D1 commands** (`wrangler d1 execute`, `wrangler deploy`, or
  any variant) unless the user explicitly requests them in the current task.
- **Do not change `src/worker.js`** without having smoke-test or hardening-test proof
  in place. Run `node scripts/hardening-smoke-test.mjs` before and after any Worker
  change.
- **Do not change public write endpoints** without reading
  `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` first.
- **Do not run live write smoke tests** unless the user explicitly approves the run in
  the current task. Approval in a prior session does not carry forward.
- **Do not approve smoke-test claims.** Approval promotes a claim to `reviewState: 'public'`
  and makes it visible to all users. Smoke claims must always be rejected or deleted.
- **Do not change response shapes** used by `public/app-v10.js` casually — shape
  changes break the frontend silently. Check `docs/API_ENDPOINT_INVENTORY.md` before
  modifying any response.
- **Do not change Belief Engine bridge/profile marker strings** (`source`,
  `engineVersion`, `label` in `humanx-bridge.js`, or the marker strings inside
  `isFullBeliefProfile` in `app-v10.js`) without updating both the Drift classification
  expectations and the static check spec. The static check will fail immediately if
  these strings drift out of sync.
- **Do not remove the `humanx-bridge.js` script reference** from
  `public/apps/humanx-belief-engine/index.html` without a replacement bridge plan in
  place. Removing it silently breaks the Save to HumanX flow and the Drift feed.
- **Do not rename or remove any `/api/...` route** without updating
  `docs/API_ENDPOINT_INVENTORY.md`, `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` (where
  applicable), and re-running `node scripts/worker-route-static-check.mjs`. A route
  present in code but absent from the inventory is a hard failure.
- **Do not begin the Worker modular split** until the Worker route static check,
  read endpoint smoke, and all relevant backend docs (`docs/API_ENDPOINT_INVENTORY.md`,
  `docs/WORKER_MODULAR_SPLIT_PLAN.md`) are current and passing. The route check must
  pass after each module extraction step.

---

## 7. Recommended Next Implementation Step

The next real implementation step should be small and non-invasive: either frontend
polish (copy, layout, empty states) or adding non-mutating unit or integration tests
for existing logic.

Worker modular split should remain plan-only until more backend tests exist. The
current `docs/WORKER_MODULAR_SPLIT_PLAN.md` documents the required proof before any
implementation begins — that proof is not yet complete.
