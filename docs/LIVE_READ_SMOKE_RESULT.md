# Live Read Smoke Test Result

## 1. Purpose

This file records one known-good live read-only backend smoke test against the
deployed HumanX Worker. It serves as a confirmed baseline for the read endpoint
response shapes and HTTP statuses as of the date below.

Future refactors and endpoint changes should be measured against this baseline.

---

## 2. Test Context

| Field | Value |
|---|---|
| Site URL | `https://humanx.rinkimirikata.com` |
| Command | `node scripts/read-endpoint-smoke-test.mjs https://humanx.rinkimirikata.com/` |
| Date | 2026-06-01 |
| Script | `scripts/read-endpoint-smoke-test.mjs` |
| Mode | Read-only — no data was created, changed, or deleted |
| Spec | `docs/READ_ENDPOINT_SMOKE_TEST_SPEC.md` |
| Usage guide | `docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md` |

---

## 3. Summary

| Metric | Value |
|---|---|
| Passed | **15** |
| Failed | **0** |
| Skipped | **0** |
| Total checks | **15** |
| Outcome | ✓ All checks passed — safe to use as baseline |

---

## 4. Endpoint Results Table

| Endpoint | Expected status | Actual status | Result | Notes |
|---|---|---|---|---|
| `GET /api/health` | 200 | 200 | PASS | Keys confirmed: `ok`, `service`, `mode`, `ai`, `legacy_ai` |
| `GET /api/ai/analyse` | 402 | 402 | PASS | Keys confirmed: `error`, `legacy_error`, `message` — no AI provider called |
| `GET /api/claims` | 200 | 200 | PASS | `claims` array confirmed; 11 items returned; first item shape verified |
| `GET /api/truths` | 200 | 200 | PASS | `truths` array confirmed; 12 items returned |
| `GET /api/evidence-vault` | 200 | 200 | PASS | `evidence` array confirmed; 19 items returned |
| `GET /api/graph-status` | 200 | 200 | PASS | Keys confirmed: `ok`, `graph`, `errors`, `summary` |
| `GET /api/belief-snapshots` | 200 | 200 | PASS | `snapshots` array confirmed; 0 items (expected — fake smoke-test user has no saved data) |
| `GET /api/claims/clm_4176a17d0a754b78aa` | 200 | 200 | PASS | Keys confirmed: `claim`, `evidence`, `pressure`, `tests`, `analyses`, `lineage` |
| `GET /api/claims/clm_smoke_notfound_00000000` | 404 | 404 | PASS | Key confirmed: `error` — expected not-found response |

---

## 5. Important Observations

- **`GET /api/ai/analyse` returning HTTP 402 is expected and correct.** This endpoint
  is intentionally blocked in RunPack-first mode. The 402 response confirms that no AI
  provider was called, no API credits were consumed, and the firewall is in place.

- **The fake smoke-test user (`usr_smoketest000000000000000`) for the belief-snapshots
  check created no data.** The endpoint returned an empty `snapshots` array, which is
  the correct behaviour for a user ID that has never saved a snapshot. No rows were
  inserted into the `belief_snapshots` table.

- **The claims detail test (`GET /api/claims/:id`) used the first available claim from
  the `GET /api/claims` response.** The claim ID `clm_4176a17d0a754b78aa` was the first
  ID in the list at the time of the test. Future runs may use a different ID if claim
  ordering changes, which is expected.

- **The not-found claim detail check returned the expected 404 JSON with an `error`
  key.** The bogus ID `clm_smoke_notfound_00000000` correctly produced a
  `{ error: 'CLAIM_NOT_FOUND' }` response rather than a 500 or an empty body.

---

## 6. What This Does Not Prove

This result confirms read-only endpoint availability and response shapes only.
It does not prove:

- That `POST` or other mutating write endpoints work correctly
- That admin review approve/reject (`POST /api/review/decision`) behaves as expected
- That claim submission (`POST /api/claims`) lands in `review_state='review'`
- That voting (`POST /api/claim-vote`) is rate-limited correctly
- That the live Belief Engine completes its full flow and save bridge
- That the Drift page correctly classifies full Belief Engine profiles
- That mobile layout or browser rendering is correct
- That `public/app-v10.js` renders all views without error

For full end-to-end confirmation, run `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` in a
browser against the live site.

---

## 7. Maintenance Rule

Create a new dated result file (e.g. `LIVE_READ_SMOKE_RESULT_2026-07-01.md`) or
update this file only after an explicitly approved live smoke test run against the
deployed Worker.

Do not update this file speculatively or based on expected results — only record
what was actually observed from a real test run.
