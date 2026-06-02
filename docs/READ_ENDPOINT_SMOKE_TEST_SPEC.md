# Read Endpoint Smoke Test Spec

## 1. Purpose

This spec defines the first safe automated backend smoke test PR before any Worker
refactor or module split begins.

The goal of the first PR is narrow: establish a reproducible, non-destructive baseline
that can be run against the live Worker to confirm that read endpoints return expected
HTTP statuses, parseable JSON, and the top-level keys that `public/app-v10.js` depends
on. This baseline becomes the regression signal for every structural change that follows.

This document is a specification only. No tests are implemented here.

---

## 2. Why Read Endpoints First

| Reason | Detail |
|---|---|
| **No production data mutation** | Read endpoints do not insert, update, or delete D1 rows. They are safe to run against the live `humanx` database without creating test data that must be cleaned up. |
| **Lower risk** | A failed read-endpoint test does not leave the database in an unknown state. It fails cleanly and can be re-run immediately. |
| **Easier response-shape baseline** | Read endpoints return stable shapes that do not depend on prior test state. The same call returns comparable structure on every run. |
| **Safer proof before write endpoints** | Establishing that read shapes have not changed is the minimum bar before it is safe to claim that a Worker refactor preserved behaviour. Write-endpoint tests require a separate test database, cleanup strategy, and more complex assertions. They should not be the first thing built. |

---

## 3. Candidate Read Endpoints

All routes below are from `src/worker.js` (read in full). Visibility and response shapes
are derived from the route handlers and supporting functions in that file.
Module-delegated routes are marked uncertain where the shape cannot be confirmed from
`src/worker.js` alone.

---

### Tier 1 — Completely safe, no auth, no D1 required

#### `GET /api/health`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/health` |
| Auth required | None |
| D1 touched | No |
| Safe against production | Yes — static response, no DB read |
| Expected top-level keys | `ok`, `service`, `mode`, `ai`, `legacy_ai` |
| Expected HTTP status | 200 |
| Notes | `ok` must be `true`. `mode` will be `'d1-live'` if D1 is connected, `'demo-fallback'` otherwise. The presence of `mode: 'd1-live'` is itself a useful signal that the Worker is connected to D1 before running further tests. |

#### `GET /api/ai/analyse`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/ai/analyse` |
| Auth required | None |
| D1 touched | No |
| Safe against production | Yes — intentionally blocked, static response |
| Expected top-level keys | `error`, `legacy_error`, `message` |
| Expected HTTP status | 402 |
| Notes | This endpoint is intentionally disabled in RunPack-first mode. The 402 status is the correct expected value — treat any other status as a failure. `error` must equal `'RUNPACK_MODE'`. Confirms no AI provider is called and no API key is consumed. |

---

### Tier 2 — Safe reads, no auth, touches D1

#### `GET /api/claims`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/claims` |
| Auth required | None |
| D1 touched | Yes — `claims`, `users` (read-only) |
| Safe against production | Yes — read-only, only returns `review_state='public'` rows |
| Expected top-level keys | `claims` (array) |
| Expected HTTP status | 200 |
| Notes | The `claims` key must be an array (may be empty on a fresh database). Do not assert specific claim content — assert only that `claims` is present and is an array. Each item in the array should have `id`, `claim`, `status`, `evidenceScore`, `survivability`, `testability`, `reviewState` per `mapClaim()` in `src/worker.js`. Asserting presence of these keys on the first element (if array is non-empty) is a useful shape check. |

#### `GET /api/truths`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/truths` |
| Auth required | None (not confirmed from `worker.js` — delegates to `src/truths.js`) |
| D1 touched | `truths` (uncertain — verify in `src/truths.js`) |
| Safe against production | Likely yes — appears to be a read-only list |
| Expected top-level keys | Uncertain — delegates to `src/truths.js`. Expected to include a top-level array or object wrapping truths records. Mark result as uncertain until confirmed from module. |
| Expected HTTP status | 200 |
| Notes | **Uncertain.** The response shape must be confirmed by reading `src/truths.js` before asserting specific keys. Initial test should only assert HTTP 200 and valid JSON. |

#### `GET /api/evidence-vault`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/evidence-vault` |
| Auth required | None (not confirmed from `worker.js` — delegates to `src/evidence-vault.js`) |
| D1 touched | `evidence` (uncertain — verify in `src/evidence-vault.js`) |
| Safe against production | Likely yes — appears to be a read-only list |
| Expected top-level keys | Uncertain — delegates to `src/evidence-vault.js`. |
| Expected HTTP status | 200 |
| Notes | **Uncertain.** Confirm response shape from `src/evidence-vault.js` before asserting specific keys. Initial test should only assert HTTP 200 and valid JSON. |

#### `GET /api/graph-status`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/graph-status` |
| Auth required | None (not confirmed from `worker.js` — delegates to `src/graph-status.js`) |
| D1 touched | Uncertain — verify in `src/graph-status.js` |
| Safe against production | Likely yes — name implies read-only status |
| Expected top-level keys | Uncertain — delegates to `src/graph-status.js`. |
| Expected HTTP status | 200 |
| Notes | **Uncertain.** Confirm response shape and whether any D1 write occurs from `src/graph-status.js` before including in the test suite. Initial test should only assert HTTP 200 and valid JSON. |

---

### Tier 3 — Safe read, requires `x-humanx-user` header, no data created

#### `GET /api/belief-snapshots`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/belief-snapshots` |
| Auth required | Yes — `x-humanx-user` header (pseudonymous user id) |
| D1 touched | `belief_snapshots` (read-only — delegates to `src/belief-snapshots.js`) |
| Safe against production | Yes — read-only list for the supplied user id; supplying a test-only user id that has never created a snapshot will return an empty list without creating any rows |
| Expected top-level keys | Uncertain — delegates to `src/belief-snapshots.js`. Expected to include a `snapshots` array or similar. Confirm from module. |
| Expected HTTP status | 200 |
| Notes | Supplying any syntactically valid user id (e.g. `usr_smoketest000000000000000`) will cause a list query for that user. If the user has no snapshots, an empty result is expected and is not a failure. **Do not save a snapshot as part of this test.** The GET is non-destructive even with a supplied user header. |

---

### Tier 4 — Not recommended for first PR (admin-only or risky)

#### `GET /api/review`
Not included. Requires `x-humanx-admin` token matching `env.HUMANX_ADMIN_TOKEN`.
Including admin token in a test script is a credential management risk.
Reserve for a dedicated admin-endpoint test suite with a separate approach.

#### `GET /api/debug`
Not included. No admin token required, but exposes full table row counts and recent
claim data. Running this in an automated test that logs output could leak production
data to CI logs. Additionally, `API_ENDPOINT_INVENTORY.md` flags this as an endpoint
that should be reviewed for an admin gate — testing it as-is would entrench the
ungated behaviour. Exclude from first PR.

#### `GET /api/seed`
Not included. Although read-only when the claims table is non-empty, it **writes to D1**
on an empty database. Cannot be safely categorised as read-only. Exclude entirely.

#### `GET /api/import-seed` / `GET /api/import-truths`
Not included. Admin-only and write-capable. Out of scope.

---

### Special case — `GET /api/claims/:id`

#### `GET /api/claims/:id`
| Field | Value |
|---|---|
| Method | GET |
| Path | `/api/claims/{id}` |
| Auth required | None |
| D1 touched | `claims`, `users`, `evidence`, `evidence_claim_links`, `pressure_points`, `home_tests`, `analysis_results`, `truth_claim_links`, `truths` (read-only) |
| Safe against production | Yes — read-only; requires a real claim id |
| Expected top-level keys | `claim`, `evidence`, `pressure`, `tests`, `analyses`, `lineage` |
| Expected HTTP status | 200 (with valid id); 404 (with unknown id) |
| Notes | Requires a known real claim id from the live database. The test script should either accept a known-good claim id as a parameter, or first call `GET /api/claims` and extract the first result's `id`. The 404 case (unknown id) should also be tested to confirm the error shape `{ error: 'CLAIM_NOT_FOUND' }` is returned rather than a 500. |

---

## 4. Out of Scope for First Test PR

The following are explicitly excluded from the first implementation PR. Each requires
either production data mutation, admin credentials, a test database, AI provider access,
or infrastructure commands that are off-limits for this phase.

- Claim submission (`POST /api/claims`) — mutates `claims` table
- Evidence submission (`POST /api/evidence`) — mutates `evidence` table
- Evidence attach (`POST /api/evidence-attach`) — mutates `evidence_claim_links`
- Claim voting (`POST /api/claim-vote`) — mutates `claim_votes` and triggers score recalc
- Truth creation (`POST /api/truths`) — mutates `truths` table
- Truth-to-claim bridge (`POST /api/truth-to-claim`) — mutates two tables
- Belief snapshot saving (`POST /api/belief-snapshots`) — mutates `belief_snapshots`
- Belief promote (`POST /api/belief-promote`) — cross-system write
- Pressure points (`POST /api/pressure`) — mutates `pressure_points`
- Home tests (`POST /api/tests`) — mutates `home_tests`
- Reports (`POST /api/report`) — mutates `reports`, may flip `review_state` on claims
- RunPack generation (`POST /api/runpack`, `POST /api/aip`) — mutates `aip_packets`
- Analysis storage (`POST /api/analysis`) — mutates `analysis_results`
- Session creation (`POST /api/session`) — mutates `users`
- Review approve/reject (`POST /api/review/decision`) — mutates `claims` or `truths`, requires admin token
- AI analysis calls — any endpoint that triggers an AI provider call (none currently, but must be confirmed)
- Any D1 migration — including migration 0004 which must not be rerun
- Any Wrangler or D1 command — `wrangler d1 execute`, `wrangler deploy`, etc.

---

## 5. First Implementation Recommendation

The first implementation PR should add a new, standalone Node script — for example
`scripts/read-endpoint-smoke-test.mjs` — rather than modifying the existing
`scripts/hardening-smoke-test.mjs`.

**Reason to keep them separate:** `hardening-smoke-test.mjs` tests pure functions and
mock DB logic with no network calls. The new script makes live HTTP calls to a running
Worker. Mixing them would obscure which kind of failure occurred and make the test
harder to run in different environments (local vs CI vs production check).

The new script should:

- **Accept a base URL** from an environment variable (e.g. `HUMANX_BASE_URL`) or a
  command-line argument, with no hardcoded URL. Example:
  ```
  HUMANX_BASE_URL=https://your-worker.workers.dev node scripts/read-endpoint-smoke-test.mjs
  ```
- **Call read endpoints only** — the Tier 1, Tier 2, and the Tier 3 GET request
  described in section 3. Start with Tier 1 (`/api/health` and `/api/ai/analyse`)
  before adding Tier 2 and Tier 3 calls.
- **Check HTTP status** — assert exact expected status codes (200, 402, 404 as
  appropriate). Any unexpected status is a FAIL.
- **Check JSON parse** — assert that the response body parses as valid JSON. A
  non-JSON body (e.g. a Cloudflare error page) is a FAIL.
- **Check presence of expected top-level keys** — for endpoints where the shape is
  confirmed (see section 6), assert that the keys are present. Do not assert specific
  values except where the value is a fixed constant (e.g. `ok === true`,
  `error === 'RUNPACK_MODE'`).
- **Avoid strict content assumptions** — do not assert exact claim counts, specific
  claim text, or specific score values. The live database content will change.
- **Print PASS/FAIL clearly** — each test case should print a single line:
  `PASS: GET /api/health → 200, ok=true` or `FAIL: GET /api/claims → expected 200, got 503`.
- **Exit non-zero on any failure** — so CI pipelines catch failures automatically.
- **Never create, change, or delete data** — the script must be entirely read-only.

Use the same pattern as `scripts/hardening-smoke-test.mjs` (no external framework,
`node:assert/strict`, plain `console.log`/`console.error`) unless there is a specific
reason to deviate. Keeping the same style makes it easier to run both scripts in the
same context.

---

## 6. Suggested Expected Top-Level Keys

The following are derived strictly from `src/worker.js` handlers and helper functions.
Entries marked **uncertain** require reading the named module file before asserting.

| Endpoint | HTTP status | Expected top-level keys | Confidence |
|---|---|---|---|
| `GET /api/health` | 200 | `ok`, `service`, `mode`, `ai`, `legacy_ai` | High — returned inline in `worker.js` |
| `GET /api/ai/analyse` | 402 | `error`, `legacy_error`, `message` | High — returned inline in `worker.js` |
| `GET /api/claims` | 200 | `claims` (array) | High — `listClaims()` in `worker.js` returns `{ claims: mapClaims(...) }` |
| `GET /api/claims/:id` (found) | 200 | `claim`, `evidence`, `pressure`, `tests`, `analyses`, `lineage` | High — `getClaim()` in `worker.js` returns all six keys |
| `GET /api/claims/:id` (not found) | 404 | `error` | High — `getClaim()` returns `{ error: 'CLAIM_NOT_FOUND' }` |
| `GET /api/truths` | 200 | Uncertain — delegates to `src/truths.js` | Uncertain |
| `GET /api/evidence-vault` | 200 | Uncertain — delegates to `src/evidence-vault.js` | Uncertain |
| `GET /api/graph-status` | 200 | Uncertain — delegates to `src/graph-status.js` | Uncertain |
| `GET /api/belief-snapshots` | 200 | Uncertain — delegates to `src/belief-snapshots.js` | Uncertain |

**For `GET /api/claims` — confirmed keys on each item in the `claims` array:**
From `mapClaim()` in `src/worker.js`:
```
id, claim, category, type, status, evidenceScore, survivability,
testability, contradictions, reportCount, reviewState, beliefYes,
beliefNo, uncertainty, createdAt, updatedAt, handle
```
Assert the presence of `id`, `claim`, `status`, `reviewState`, and `evidenceScore` on
the first element if the array is non-empty. These are the fields confirmed consumed by
`public/app-v10.js` per `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`.

**For `GET /api/claims/:id` — confirmed keys on the `claim` object:**
Same as above. Additionally: `evidence` is an array, `pressure` is an array,
`tests` is an array, `analyses` is an array, `lineage` is an object containing
at least `truths`, `evidenceLinks`, `analysisCount`, `pressureCount`, `testCount`.
From `claimLineage()` in `src/worker.js`.

**For `GET /api/health`:**
- `ok` must equal `true` (boolean)
- `service` must equal `'humanx'` (string constant)
- `mode` must be either `'d1-live'` or `'demo-fallback'`
- `ai` must equal `'runpack-first-no-public-inference'`

**For `GET /api/ai/analyse`:**
- `error` must equal `'RUNPACK_MODE'`
- HTTP status must be 402 (not 200, not 404)

---

## 7. Safety Rules for Implementation

These rules apply to the test implementation PR and to all test runs.
They mirror the constraints in `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` and
`docs/BACKEND_SMOKE_TEST_PLAN.md`.

- **No production mutations.** Every HTTP call in the first test PR must be a GET or
  an explicitly non-mutating call. No POST, PUT, PATCH, or DELETE.
- **No admin token required.** Do not embed `HUMANX_ADMIN_TOKEN` in the test script.
  Admin-gated endpoint tests are a separate concern with separate credential handling.
- **No AI provider call.** The test script must not call any endpoint that triggers an
  AI provider. `GET /api/ai/analyse` returns 402 without calling any provider — this is
  safe. No other AI endpoint exists currently.
- **No schema changes.** The test script does not touch migrations, does not add columns,
  does not alter tables.
- **No frontend changes.** The test script does not modify `public/app-v10.js`,
  `public/index.html`, or any static asset.
- **No Wrangler or D1 commands.** The test script runs with `node` only. It does not
  invoke `wrangler`, `npx wrangler`, or any D1 CLI command.
- **No migration 0004 rerun.** The test script must not include or trigger any migration.

---

## 8. Stop Conditions

If any of the following are discovered during implementation, stop work and document
the finding before continuing.

- **Any endpoint requires mutation to test meaningfully** — exclude it from this PR
  and note it for a future write-endpoint test PR
- **Any endpoint requires an admin token** — exclude it; do not embed credentials
- **Any endpoint triggers AI or provider cost** — exclude it immediately; confirm
  cost-free behaviour from source before including
- **Any endpoint's response shape is not understood** — mark it uncertain in the test
  output; do not assert keys that were not confirmed from source code
- **Any test requires changing `src/worker.js`** — stop; the test must work against
  the current unmodified Worker
- **Any test requires Cloudflare or D1 commands** — stop; the test must run with
  `node scripts/read-endpoint-smoke-test.mjs` and a URL argument only

---

## 9. Relationship to Manual QA

Read-endpoint smoke tests do not replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`.

Automated read-endpoint tests confirm HTTP status, JSON parseability, and top-level
key presence. They do not confirm:

- That the browser renders data correctly
- That navigation between views works
- That forms submit and display confirmation states
- That mobile layout is usable
- That the Belief Engine save bridge completes successfully
- That the Drift page classifies full profiles correctly
- That empty states display appropriate copy

All of the above require a human running the manual checklist in a browser against the
live deployed Worker. The automated tests and the manual checklist are complementary,
not interchangeable.

The recommended sequence before any Worker structural change remains:

1. Run `node scripts/hardening-smoke-test.mjs` — confirm 70/70 pass (pure function tests)
2. Run `node scripts/read-endpoint-smoke-test.mjs` — confirm all read endpoint checks pass
3. Run `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` in a browser
4. Only then proceed with the structural change
