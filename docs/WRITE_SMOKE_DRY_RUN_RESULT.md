# Write Smoke Dry-Run Result

## 1. Purpose

This file records the confirmed dry-run baseline for `scripts/write-endpoint-smoke-test.mjs`.
It proves that the script fails safe when mutation safety gates are absent: it makes no
network requests, prints the payloads it would use, flags all missing gates clearly, and
exits 0.

This is not a live write result. It does not prove that any write endpoint works.

---

## 2. Test Context

| Field | Value |
|---|---|
| Script | `scripts/write-endpoint-smoke-test.mjs` |
| Command | `node scripts/write-endpoint-smoke-test.mjs https://example.invalid` |
| Mode | Dry-run (no safety gates provided) |
| Network requests | None |
| Live site mutation | None |
| Date | 2026-06-01 |

No environment variables were set. No `--i-understand-this-mutates-data` CLI flag was
provided. The target URL `https://example.invalid` is deliberately non-routable.

---

## 3. Confirmed Behaviour

- [x] `node --check scripts/write-endpoint-smoke-test.mjs` passed — syntax is valid.
- [x] Missing `--i-understand-this-mutates-data` CLI gate was clearly flagged in output.
- [x] Missing `HUMANX_ALLOW_WRITE_SMOKE_TEST=1` environment variable gate was clearly flagged in output.
- [x] Script printed `DRY RUN — no network requests will be made`.
- [x] Script showed the generated smoke-test user payload (`id`, `handle`).
- [x] Script showed the generated smoke-test claim payload (`claim`, `type`, `category`).
- [x] Script exited with code `0`.
- [x] Script did not send any network requests.

---

## 4. Safety Meaning

This dry-run result proves that the script's fail-safe default is working correctly.
When both mutation gates are absent, the script stops before making any HTTP calls,
prints the payloads it would send so they can be reviewed, and exits cleanly.

It does **not** prove that live write endpoints are working. No requests reached the
Worker. No D1 rows were created or read. This result only confirms that the gate logic
and dry-run output path in the script behave as specified.

---

## 5. What This Does Not Prove

- Does not prove `POST /api/session` works or returns the expected response shape.
- Does not prove `POST /api/claims` works or lands claims in `reviewState: 'review'`.
- Does not prove claim review-state behaviour — a new claim could land in an unexpected
  state if something changes in the Worker.
- Does not prove duplicate/dedup behaviour — the `existing: true` response path was not
  exercised.
- Does not prove any production write path end-to-end.
- Does not replace `scripts/read-endpoint-smoke-test.mjs` — read endpoint health is a
  separate baseline; see `docs/LIVE_READ_SMOKE_RESULT.md`.
- Does not replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` — browser UI behaviour
  was not verified.

---

## 6. Before Any Live Write Run

All of the following must be confirmed before running the script in live mutation mode:

- [ ] Read smoke test passes: `node scripts/read-endpoint-smoke-test.mjs https://YOUR-URL`
      — see `docs/LIVE_READ_SMOKE_RESULT.md` for the baseline result.
- [ ] Manual frontend QA passes: `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` run in a
      browser against the live site.
- [ ] User has explicitly approved running write tests against production in the current
      task. Approval in a prior session does not carry forward.
- [ ] Only one clearly marked smoke claim will be submitted per run (the script enforces
      this — do not modify the script to loop or batch).
- [ ] Do not approve, vote on, or attach evidence to the smoke-test claim.
- [ ] Do not call admin or review routes (`POST /api/review/decision`,
      `POST /api/report`, etc.).
- [ ] Do not run any Wrangler or D1 commands as part of or alongside the test.
- [ ] Do not rerun migration 0004 (`migrations/0004_unique_normalized_content.sql` is
      already applied to production D1 — running it again will fail).

---

## 7. Maintenance Rule

Update or create a dated result file only after an explicitly approved dry-run or live
write smoke test. Do not backfill or estimate results. Each result file must record the
exact command used, the date, and what was and was not confirmed.
