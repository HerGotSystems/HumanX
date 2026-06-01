# Smoke Claim Admin Cleanup

## 1. Purpose

The live write smoke test run on 2026-06-01 intentionally created one claim in the
HumanX production review queue as proof that `POST /api/claims` works correctly. That
claim is not publicly visible, but it is real D1 data and it occupies a slot in the
admin review queue.

This file records what needs to be cleaned up, how to do it safely, and what must not
be done.

See `docs/LIVE_WRITE_SMOKE_RESULT.md` for the full test record.

---

## 2. Smoke Claim to Clean Up

| Field | Value |
|---|---|
| Claim ID | `clm_54be6272abbc49d282` |
| Smoke ID | `cor41` |
| User ID | `usr_smoke_cor41` |
| Created | `2026-06-01T18:22:26.077Z` |
| Expected review state | `review` |
| Expected public visibility | Not public |

The claim text begins with `HUMANX_SMOKE_TEST_` — it is identifiable by that prefix in
the review queue or in any admin query. It was never approved, voted on, or had evidence
attached.

---

## 3. Recommended Cleanup Path

Use the HumanX admin/review UI if available.

1. Navigate to the Review page at `https://humanx.rinkimirikata.com` (admin token
   required).
2. Locate the claim by ID `clm_54be6272abbc49d282`, or scan for entries whose claim
   text starts with `HUMANX_SMOKE_TEST_`.
3. Reject or delete the claim using the existing admin review process
   (`POST /api/review/decision` with the admin token sets `review_state='rejected'`
   and closes any associated reports).
4. **Do not approve it.** Approving would promote it to `review_state='public'` and
   make it visible to regular users.
5. **Do not use D1 or Wrangler commands for cleanup** unless the user explicitly
   requests it in the current task. If direct D1 row deletion is ever needed, follow
   the safe-deletion sequence in `docs/D1_DUPLICATE_CLEANUP.md` (re-point child rows
   before deleting parent rows).

---

## 4. Verification After Cleanup

- [ ] Review queue no longer shows `clm_54be6272abbc49d282` as pending review.
- [ ] Public Claims page does not show the smoke claim or any entry starting with
      `HUMANX_SMOKE_TEST_`.
- [ ] Read endpoint smoke test still passes:
      `node scripts/read-endpoint-smoke-test.mjs https://humanx.rinkimirikata.com`
      See `docs/LIVE_READ_SMOKE_RESULT.md` for the baseline to compare against.
- [ ] No normal user data was affected — the smoke user (`usr_smoke_cor41`) and smoke
      claim are isolated and clearly labelled.

---

## 5. Do-Not-Do List

- **Do not approve** the smoke claim — it must be rejected or deleted, not promoted.
- **Do not rerun migration 0004** — `migrations/0004_unique_normalized_content.sql` is
  already applied to production D1; running it again will fail.
- **Do not run D1 or Wrangler cleanup commands** unless the user explicitly requests
  it in a separate task.
- **Do not add automated deletion tooling** as part of this cleanup — that belongs in a
  purpose-built, admin-gated route designed and reviewed separately.
- **Do not run another live write smoke test** just to verify cleanup — use the Review
  UI and the read smoke test instead.
- **Do not touch `src/worker.js`** — no code change is needed to clean up this claim.

---

## 6. Future Improvement

A safe, admin-gated cleanup workflow for smoke-test data can be planned as a separate
task once the review process is confirmed stable and the admin token handling has its
own test coverage. That workflow should be designed as a deliberate, audited operation
— not a side-effect of the smoke test script itself, and not implemented here.

When it is built, it should be documented in its own spec before any implementation
begins.
