# Backend Smoke Test Plan

## 1. Purpose

This plan defines the minimum backend proof needed before changing Worker routing, public
write endpoints, duplicate handling, or Belief bridge behaviour in `src/worker.js`.

The goal is not exhaustive coverage. The goal is a reliable signal that the endpoints
`public/app-v10.js` depends on have not had their behaviour or response shape changed.
Without this signal, a Worker refactor or module split can silently break the live frontend
with no immediate error visible in the Worker logs.

This document does not implement tests. It defines what must be tested and what the current
test asset actually covers.

---

## 2. Source Files Checked

| File | Status |
|---|---|
| `src/worker.js` | Read in full |
| `scripts/hardening-smoke-test.mjs` | Read in full |
| `docs/API_ENDPOINT_INVENTORY.md` | Read in full |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` | Read in full |
| `docs/OPERATIONAL_STATUS.md` | Read in full |
| `docs/WORKER_MODULAR_SPLIT_PLAN.md` | Read in full |
| `docs/D1_DUPLICATE_CLEANUP.md` | Present — referenced for duplicate handling context |
| `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` | Present — defines manual QA coverage |

---

## 3. Current Smoke Test Assets

### `scripts/hardening-smoke-test.mjs`

**How to run:**
```
node scripts/hardening-smoke-test.mjs
```

No external test framework is required. Uses Node's built-in `node:assert/strict`.
Runs locally without D1, Wrangler, or a live Worker.

**What it currently tests (16 tests across 4 groups):**

| Group | What is tested |
|---|---|
| 1. `isUniqueConstraintError` | Pure function: detects UNIQUE constraint error messages by string match. 5 cases including case-insensitivity and non-matching errors. |
| 2. `meaningKey` stable output | Pure function: normalises claim/truth text for deduplication. Tests case folding, whitespace collapsing, accent normalisation (é→e), null input, and undefined input. 6 cases. |
| 3. Mock INSERT OR IGNORE id fix | Simulates the `attachEvidenceToClaim` logic using a mock DB object. Confirms that the actual DB row id is returned after `INSERT OR IGNORE`, not the locally generated id. Tests existing row, new row, and defensive null-row fallback. 3 cases. |
| 4. `safeRateLimit` fail-closed behaviour | Inline copy of the rate limit function, run against mock DB objects. Confirms that a broken DB SELECT throws `RATE_LIMIT_UNAVAILABLE` (not silent pass), and that an exceeded limit throws `RATE_LIMITED` (not `RATE_LIMIT_UNAVAILABLE`). 2 cases. |

**What the current script does NOT prove:**

- No HTTP requests are made. No Worker endpoint is called.
- No live D1 database is touched.
- No claim submission, evidence, trust, pressure, test, report, belief, or review endpoint is exercised.
- No response shapes are verified against what `app-v10.js` expects.
- No end-to-end duplicate handling is tested against real database state.
- No admin token protection is verified.
- No actual rate limit window or counter behaviour is tested against a real `rate_limits` table.
- Module delegates (`truths.js`, `belief-bridge.js`, `evidence-reuse.js`, `analysis-results.js`,
  `belief-snapshots.js`, `votes.js`) are not exercised.
- `meaningKey` is imported directly from `src/meaning-key.js`. All other helpers are
  inlined in the test file and may drift from the real implementations in `src/worker.js`.

**Assumptions the script makes:**

- The inlined `isUniqueConstraintError` and `safeRateLimit` functions in the test file are
  identical to the ones in `src/worker.js`. If `src/worker.js` is refactored and those
  functions move or change, the test will no longer reflect real behaviour.
- Mock DB objects behave correctly as stand-ins for real D1 behaviour. A mock that returns
  `{ id: EXISTING_ID }` is not proof that D1 itself returns the right row.

---

## 4. Minimum Behaviours to Preserve

These are the behaviours that must not change without deliberate, tested intent.
Check each item before merging any Worker routing change, module extraction, or
public-write-endpoint modification.

### Health and system

- [ ] `GET /api/health` returns `{ ok: true }` with a `service` field and a `mode` field —
      confirm the response shape has not changed
- [ ] `GET /api/health` does not require authentication and does not touch D1
- [ ] `GET /api/graph-status` still responds (confirm it delegates to `graph-status.js`
      and that module is not broken by any import change)

### Session

- [ ] `POST /api/session` with a new user id creates a user row and returns
      `{ user: { id, handle, trust_score, strike_count } }` — confirm these fields are present
- [ ] Calling `POST /api/session` twice with the same id returns the existing user,
      not a duplicate row (INSERT OR IGNORE is idempotent)

### Claims

- [ ] `GET /api/claims` returns `{ claims: [...] }` where each item has `id`, `claim`,
      `status`, `evidenceScore`, `survivability`, `testability`, `reviewState`
- [ ] `GET /api/claims` only returns items with `review_state='public'` — review-queued
      claims must not appear in the public list
- [ ] `POST /api/claims` with a valid `x-humanx-user` header creates a claim and returns
      the claim object with `reviewState: 'review'` — not `'public'`
- [ ] Submitting the same claim text twice returns `{ ok: true, existing: true }` on the
      second call, with the original claim object — not a new row
- [ ] `POST /api/claims` without `x-humanx-user` returns HTTP 401 with
      `{ error: 'UNAUTHORIZED' }` — not 500
- [ ] `GET /api/claims/:id` returns the full claim detail including `evidence`, `pressure`,
      `tests`, `analyses`, and `lineage` fields

### Votes

- [ ] `POST /api/claim-vote` with a valid user and claim id returns a success response
- [ ] Rate limit on `POST /api/claim-vote` is 120/hr per user+IP — confirm it is active
      in `src/votes.js`

### Evidence

- [ ] `POST /api/evidence` adds evidence to a claim and returns `{ evidence: {...}, claim: {...} }`
- [ ] `POST /api/evidence-attach` returns the actual D1 link id, not a locally generated id
      (PR #13 fix — must not regress)
- [ ] `GET /api/evidence-vault` returns a list without error

### Truths

- [ ] `GET /api/truths` returns a list without error
- [ ] `POST /api/truths` with the same statement text twice returns the existing truth on
      the second call — not a new row (duplicate handling via `normalized_statement`)
- [ ] `POST /api/truth-to-claim` creates both a `claims` row and a `truth_claim_links` row —
      confirm neither is silently skipped on the second call for the same truth

### Belief bridge

- [ ] `POST /api/belief-snapshots` saves a snapshot and returns it in a readable form
- [ ] `GET /api/belief-snapshots` returns the saved snapshot for the same user
- [ ] `POST /api/belief-promote` does not create a duplicate claim if called twice for
      the same snapshot
- [ ] None of the above reveal AI API keys or internal credentials in the response body

### Pressure and tests

- [ ] `POST /api/pressure` adds a pressure point and returns `{ pressure: {...}, claim: {...} }`
- [ ] `POST /api/tests` requires a valid claim id — returns 404 for a nonexistent claim
- [ ] Both remain rate-limited at 20/hr per IP

### Reports

- [ ] `POST /api/report` records a report and returns `{ ok: true }`
- [ ] A claim receiving 2+ reports has its `review_state` set to `'review'` — confirm this
      auto-escalation is still present

### Review / admin

- [ ] `GET /api/review` without `x-humanx-admin` returns HTTP 403 — not 200 or 500
- [ ] `GET /api/review` with the correct admin token returns `{ claims: [...], truths: [...] }`
- [ ] `POST /api/review/decision` without admin token returns HTTP 403
- [ ] `POST /api/review/decision` with admin token and `decision: 'public'` updates
      `review_state` on the target and closes open reports

### AI / RunPack

- [ ] `GET /api/ai/analyse` returns HTTP 402 with `{ error: 'RUNPACK_MODE' }` —
      confirm no API key is consumed and no AI inference occurs
- [ ] `POST /api/runpack` with a valid claim id returns a packet with the expected structure
      (`runpack_version`, `instruction`, `output_contract`, `payload`)
- [ ] `POST /api/aip` returns the same shape as `/api/runpack` (alias — same handler)

### Rate limiting

- [ ] If the `rate_limits` D1 table is unavailable, write endpoints return HTTP 503 with
      `{ error: 'RATE_LIMIT_UNAVAILABLE' }` — not HTTP 200 or a silent pass
- [ ] If a caller exceeds their rate limit, the endpoint returns HTTP 429 with
      `{ error: 'RATE_LIMITED' }` — not 500

---

## 5. Frontend Dependency Warning

`public/app-v10.js` consumes endpoint responses directly. It has no version negotiation
and no schema validation layer. Any field rename, field removal, or type change in a
response body will break the frontend silently from the Worker's perspective — the Worker
returns 200, but the UI renders incorrectly or shows an empty state.

Fields confirmed consumed by `app-v10.js` based on `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`:

```
claim.id           claim.claim         claim.status
claim.reviewState  claim.evidenceScore claim.survivability
claim.testability  claim.contradictions claim.reportCount
claim.handle       evidence.id         evidence.stance
user.id            user.handle         user.trust_score
```

Before any change that touches these field names or types, confirm that `app-v10.js` does
not break. This requires running `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` in full, not
just reading the Worker code.

---

## 6. Suggested Future Automated Test Groups

These groups do not yet exist as tests. They describe what should be added before the
Worker modular split described in `docs/WORKER_MODULAR_SPLIT_PLAN.md` begins.

### Health and read endpoints

Tests that hit real endpoints (against a local dev Worker or staging URL) and verify:
- `GET /api/health` response shape
- `GET /api/claims` response shape including field names
- `GET /api/claims/:id` full detail response structure
- `GET /api/truths` response shape
- `GET /api/evidence-vault` loads without error
- `GET /api/graph-status` loads without error

These are safe to automate because they are read-only and non-destructive.

### Public write endpoints

Tests that exercise write paths against a non-production test database:
- Claim submission with valid user header → confirm `reviewState: 'review'`
- Claim submission without user header → confirm HTTP 401
- Evidence submission → confirm response contains `evidence.id` and `claim.evidenceScore`
- Pressure submission → confirm score recalculation in response
- Home test submission → confirm 404 on nonexistent claim, success on real claim

**These tests are destructive (create rows).** Run only against a test/staging database,
never against the production `humanx` D1 database unless the user explicitly approves.

### Duplicate protection

Tests that confirm idempotent behaviour:
- Submit the same claim text twice → confirm `{ existing: true }` on second call
- Submit the same truth statement twice → confirm deduplication fires
- Call `POST /api/evidence-attach` twice with the same evidence+claim pair → confirm
  one `evidence_claim_links` row, not two

### Rate limiting

Tests that confirm fail-closed behaviour:
- Confirm the `safeRateLimit` inlined copy in `hardening-smoke-test.mjs` matches the
  actual implementation in `src/worker.js` (they are currently separate copies and may
  diverge during a refactor)
- Mock-DB test: confirm HTTP 503 is returned when `rate_limits` table throws
- Live test: confirm HTTP 429 is returned after limit is exceeded

### Admin / review protection

Tests that confirm auth gating:
- `GET /api/review` without token → HTTP 403
- `GET /api/review` with wrong token → HTTP 403
- `POST /api/review/decision` without token → HTTP 403
- `GET /api/import-seed` without token → HTTP 403
- `GET /api/import-truths` without token → HTTP 403

These are read-only or admin-only and safe to run without mutating public data.

### Belief bridge

Tests that confirm the Belief Engine save path:
- `POST /api/belief-snapshots` → persists and is retrievable via `GET`
- `POST /api/belief-promote` twice with the same snapshot → does not create duplicate claim
- Response shape matches what `app-v10.js` Drift tab expects

### AI analysis safety

Tests that confirm the AI endpoint firewall:
- `GET /api/ai/analyse` → HTTP 402, `{ error: 'RUNPACK_MODE' }`, no credentials in body
- `POST /api/analysis` → stores caller-supplied payload, does not call any external API,
  does not echo back any environment variable or token
- `POST /api/runpack` → packet does not include `env.HUMANX_ADMIN_TOKEN` or any secret

---

## 7. Manual Proof Still Required

Automated smoke tests do not replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`.

The checklist covers end-to-end browser behaviour: navigation, rendering, form submission
flows, mobile layout, and visual states. These cannot be fully automated without a browser
test harness that is not currently part of this codebase.

The recommended sequence before any Worker structural change:

1. Run `node scripts/hardening-smoke-test.mjs` — confirm 64/64 pass.
2. Run any new automated endpoint tests added under the groups in section 6.
3. Run `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` in a browser against the deployed Worker.
4. Only then proceed with the structural change.

---

## 8. Do-Not-Run Warning

**These constraints apply to this task and to all future smoke testing tasks
unless the user explicitly overrides them:**

- **Do not run Wrangler or D1 commands** as part of a docs or planning task.
  `wrangler d1 execute`, `wrangler deploy`, and all D1 variants are off-limits unless
  the user explicitly requests them in the task description.

- **Do not rerun migration 0004.**
  `migrations/0004_unique_normalized_content.sql` is already applied to the production
  database. Running it again will produce a UNIQUE constraint error.
  See `docs/OPERATIONAL_STATUS.md`.

- **Do not test against production mutating endpoints** (claim submit, evidence, truth,
  belief, report, review) unless the user explicitly asks and acknowledges that test rows
  will be created in the production `humanx` D1 database. Test rows from smoke runs are
  not automatically cleaned up.

---

## 9. Recommended First Test Implementation PR

The first implementation PR should:

1. Add or expand **local, non-destructive smoke tests** around read endpoint response shapes.
   Specifically: assert that `GET /api/health`, `GET /api/claims`, and `GET /api/claims/:id`
   return the field names that `app-v10.js` depends on.

2. Confirm that the inlined `isUniqueConstraintError` and `safeRateLimit` copies in
   `scripts/hardening-smoke-test.mjs` still match the implementations in `src/worker.js`.
   If a refactor has moved them, update the test file to import from the shared location.

3. Do **not** add live HTTP tests against the production Worker in the first PR.
   Use mock DB objects or a local dev Worker if one exists.

Only after this foundation is in place should the Worker modular split described in
`docs/WORKER_MODULAR_SPLIT_PLAN.md` begin.

---

## 10. Stop Conditions

Work on Worker structure or endpoint behaviour must stop immediately if any of the
following occur during smoke testing:

- A required **schema change** is discovered (a table column is missing, a column type
  is wrong, or an index is absent) — stop and document before proceeding
- A **migration request** arises — do not run migrations without explicit user approval
- A test result reveals a need to **change `public/app-v10.js`** to make the Worker
  work — stop; a frontend change is out of scope for a backend refactor task
- **Uncertainty about whether a test mutates production data** — stop; confirm the
  target database before running any write-path test
- A **failed smoke result** whose cause is not understood — do not proceed with the
  structural change until the failure is diagnosed; do not assume it is a pre-existing
  issue
