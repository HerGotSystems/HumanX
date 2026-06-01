# Live Write Smoke Result

## 1. Purpose

This file records one explicitly approved live write smoke test against the HumanX
production Worker. It proves that the lowest-risk public write flow — session creation
and claim submission — works correctly end-to-end and that new claims land in
`reviewState: 'review'` rather than being made publicly visible.

This run was approved by the user and executed with all required safety gates present.

---

## 2. Test Context

| Field | Value |
|---|---|
| Site URL | `https://humanx.rinkimirikata.com` |
| Script | `scripts/write-endpoint-smoke-test.mjs` |
| Command | `HUMANX_ALLOW_WRITE_SMOKE_TEST=1 node scripts/write-endpoint-smoke-test.mjs https://humanx.rinkimirikata.com/ --i-understand-this-mutates-data` |
| Date / time | `2026-06-01T18:22:26.077Z` |
| Mode | Live write smoke test |
| Safety gate — env | `HUMANX_ALLOW_WRITE_SMOKE_TEST=1` present |
| Safety gate — CLI | `--i-understand-this-mutates-data` present |

**Read/write warning:** This run made real HTTP requests to the live D1-backed Worker
and created real database rows. The smoke-test claim is in the admin review queue and
must be rejected or deleted manually. Do not rerun without explicit approval.

---

## 3. Summary

| Item | Value |
|---|---|
| Checks passed | 4 |
| Checks failed | 0 |
| Claims created | 1 |
| Claim review state | `review` |

One smoke-test claim was created and confirmed to be in `reviewState: 'review'` — not
publicly visible. This establishes a safe baseline for the lowest-risk public write
flow: session creation followed by claim submission to the review queue.

---

## 4. Endpoint Results

| Step | Endpoint | Status | Result | Notes |
|---|---|---|---|---|
| 1 | `POST /api/session` | 200 | PASS | Returned `user.id: usr_smoke_cor41` |
| 2 | `POST /api/claims` | 200 | PASS | New claim created |
| 2 | `POST /api/claims` | — | PASS | `claim.id: clm_54be6272abbc49d282` returned |
| 2 | `POST /api/claims` | — | PASS | `claim.reviewState: "review"` — not publicly visible |

---

## 5. Created Smoke Data

| Field | Value |
|---|---|
| Smoke ID | `cor41` |
| User ID | `usr_smoke_cor41` |
| Claim ID | `clm_54be6272abbc49d282` |
| Claim review state | `review` |
| Cleanup status | **Pending** — manual reject/delete required via admin review process |
| Public visibility | Not public (confirmed by script result: `reviewState: 'review'`) |

---

## 6. Important Observations

- The write script created exactly one claim. No loop, batch, or retry logic ran.
- The claim landed in `reviewState: 'review'`, not `'public'` — it is not visible to
  regular users.
- The script did not call any of the following during this run:
  - Voting (`POST /api/claim-vote`)
  - Evidence submission or attach (`POST /api/evidence`, `POST /api/evidence-attach`)
  - Admin or review endpoints (`POST /api/review/decision`, `POST /api/report`)
  - AI or provider endpoints
  - Import or seed routes
  - Debug routes
  - Any Wrangler or D1 command
- This confirms the lowest-risk write path only: session creation (`POST /api/session`)
  and claim submission to the review queue (`POST /api/claims`).

---

## 7. What This Does Not Prove

- Does not prove voting (`POST /api/claim-vote`) works or respects rate limits.
- Does not prove evidence submission or attach works correctly.
- Does not prove truth creation or promotion works.
- Does not prove the Belief Engine bridge write path (`POST /api/belief-promote`).
- Does not prove admin approve/reject behaviour (`POST /api/review/decision`).
- Does not prove duplicate/race handling under concurrent writes.
- Does not prove rate-limit stress behaviour for any write endpoint.
- Does not replace `scripts/read-endpoint-smoke-test.mjs` — read endpoint health is a
  separate baseline; see `docs/LIVE_READ_SMOKE_RESULT.md`.
- Does not replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` — browser UI behaviour
  and form submission flows were not verified by this test.

---

## 8. Cleanup Note

Smoke claim `clm_54be6272abbc49d282` is currently in the admin review queue with
`reviewState: 'review'`. It is not publicly visible but it is real D1 data.

**Required:** A site admin should reject or delete this claim through the admin review
interface (`POST /api/review/decision` with the admin token), which sets
`review_state='rejected'` and closes any associated reports.

**Do not** use D1 or Wrangler commands for cleanup unless the user explicitly requests
it in the current task. If direct D1 row deletion is ever needed, follow the
safe-deletion sequence in `docs/D1_DUPLICATE_CLEANUP.md`.

**Do not rerun migration 0004.** `migrations/0004_unique_normalized_content.sql` is
already applied to production D1. Running it again will fail.

---

## 9. Maintenance Rule

Create a new dated result file or update this file only after an explicitly approved
live write smoke test run. Do not backfill or estimate results. Each result must record
the exact command, date/time, smoke ID, created claim ID, and what was and was not
confirmed.
