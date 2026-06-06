# Write Endpoint Smoke Test — Usage Guide

## 1. Purpose

This document explains how to safely use `scripts/write-endpoint-smoke-test.mjs` — the
opt-in public-write smoke test for the HumanX Cloudflare Worker.

It covers what the script does, what it must never do, how to invoke it safely, what
the output means, and when it is appropriate to run the live mutation path.

**Read `docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md` first.** The read-only smoke test
(`scripts/read-endpoint-smoke-test.mjs`) must pass before this script is useful.

---

## 2. What the Script Does

- **Defaults to dry-run.** Without all three safety gates present, the script makes
  no network requests. It prints the generated payloads and exits 0.

- **When fully enabled**, the script:
  1. Calls `POST /api/session` to create or retrieve a smoke-test user (idempotent —
     safe to run multiple times; uses `INSERT OR IGNORE` in the Worker)
  2. Calls `POST /api/claims` with one clearly labelled smoke-test claim
  3. Verifies the response — new claims must land in `reviewState: 'review'` (not
     publicly visible); a duplicate/existing response is also a valid pass
  4. Prints a summary with the created claim ID and a reminder for manual cleanup

- The script **does not**:
  - Approve the claim
  - Vote on the claim
  - Attach evidence
  - Call any AI provider
  - Delete or clean up created rows

---

## 3. Dry-Run Usage

Running the script with only a URL and no safety gates always produces a dry-run —
**no network requests are made**.

```
node scripts/write-endpoint-smoke-test.mjs https://example.invalid
```

**Expected output:**

```
╔══════════════════════════════════════════════════════╗
  DRY RUN — no network requests will be made
╚══════════════════════════════════════════════════════╝

  Missing safety gates:
    ✗ CLI flag missing: --i-understand-this-mutates-data
    ✗ Environment variable missing: HUMANX_ALLOW_WRITE_SMOKE_TEST=1

  Target URL (would be used if gates were present):
    https://example.invalid

  What would be tested:
    1. POST /api/session  — create/retrieve smoke-test user (idempotent)
    2. POST /api/claims   — submit one labelled smoke-test claim
       Verify: claim.reviewState === "review" (not "public")
       OR: existing/dedup response (ok=true, existing=true)

  Generated test user payload:
  {
    "id": "usr_smoke_xxxxx",
    "handle": "smoke-xxxxx"
  }

  Generated claim payload:
  {
    "claim": "HUMANX_SMOKE_TEST_<timestamp>_<suffix> — automated write smoke test; safe to reject/delete manually",
    "type": "Physical/Testable",
    "category": "General"
  }

  ...

  DRY RUN ONLY — exiting 0, no data was sent or created.
```

The dry-run shows the exact payload that would be sent in live mode. Use it to review
what the script would do before approving a live run.

**Exit code:** `0`

---

## 4. Live Mutation Usage

> ⚠ **Only run this when the user explicitly approves production mutation.**

When all three safety gates are present, the script makes real HTTP requests that
**create rows in the live D1 database**. The smoke-test claim will appear in the
admin review queue and must be manually rejected or deleted afterwards.

```
HUMANX_ALLOW_WRITE_SMOKE_TEST=1 node scripts/write-endpoint-smoke-test.mjs https://YOUR-HUMANX-SITE.example --i-understand-this-mutates-data
```

Or using `HUMANX_BASE_URL` instead of a CLI argument:

```
HUMANX_BASE_URL=https://YOUR-HUMANX-SITE.example \
HUMANX_ALLOW_WRITE_SMOKE_TEST=1 \
node scripts/write-endpoint-smoke-test.mjs --i-understand-this-mutates-data
```

**What happens when all gates are present:**

- One smoke-test user row is created (or reused if it already exists)
- One smoke-test claim is submitted with a unique timestamp and random suffix
- The claim is **not publicly visible** — it lands in `reviewState: 'review'`
- The claim ID is printed in the output
- **No automatic cleanup** — the claim must be rejected/deleted manually by a site admin

**Node version requirement:** Node 18 or later (uses global `fetch`).

---

## 5. Required Safety Gates

All three must be present for a live write run. If any are missing, the script
falls back to dry-run and exits 0 without making any requests.

| Gate | How to provide | What it signals |
|---|---|---|
| Valid base URL | First non-flag CLI argument, or `HUMANX_BASE_URL` environment variable | The target site to test against |
| `HUMANX_ALLOW_WRITE_SMOKE_TEST=1` | Environment variable | Explicit opt-in to mutation; must be exactly `1` |
| `--i-understand-this-mutates-data` | CLI flag | Human-readable acknowledgement that writes will occur |

If the base URL is missing or does not start with `http://` or `https://`, the script
exits with code 2 and prints usage instructions.

---

## 6. Test Data Naming

Every piece of data created by the script includes a clearly identifiable prefix and
contextual metadata.

**Prefix:** `HUMANX_SMOKE_TEST_`

**Full claim text format:**
```
HUMANX_SMOKE_TEST_<ISO-timestamp>_<random-suffix> — automated write smoke test; safe to reject/delete manually
```

**Example:**
```
HUMANX_SMOKE_TEST_2026-06-01T18:00:16.393Z_u457z — automated write smoke test; safe to reject/delete manually
```

**User ID format:** `usr_smoke_<suffix>`
**User handle format:** `smoke-<suffix>`

The prefix is the basis for any manual admin identification. A site admin can find
smoke-test claims in the review queue by looking for entries starting with
`HUMANX_SMOKE_TEST_`.

---

## 7. What the Script Must Not Do

The following are explicitly excluded from this script. If the output suggests any
of these are happening, stop immediately.

- No voting (`POST /api/claim-vote`)
- No evidence submission or attach (`POST /api/evidence`, `POST /api/evidence-attach`)
- No truth creation or promotion (`POST /api/truths`, `POST /api/truth-to-claim`)
- No belief snapshot saving or promotion (`POST /api/belief-snapshots`, `POST /api/belief-promote`)
- No review approve/reject (`POST /api/review/decision`)
- No admin token — `HUMANX_ADMIN_TOKEN` is not used or accepted by this script
- No AI or external provider calls
- No automatic cleanup or deletion of rows
- No D1 or Wrangler commands
- No rerunning migration 0004

---

## 8. Expected Pass Result

### Live run — new claim (first run with this suffix)

```
1. POST /api/session (create/retrieve smoke-test user)
  PASS: POST /api/session → 200, user.id present (usr_smoke_xxxxx)

2. POST /api/claims (submit one labelled smoke-test claim)
  PASS: POST /api/claims → 200, new claim created
  PASS: POST /api/claims → claim.id: clm_xxxxxxxxxxxxxxxxxx
  PASS: POST /api/claims → claim.reviewState: "review" (not public — correct)

  NOTE: Smoke-test claim is now in the admin review queue.
  It is NOT publicly visible. A site admin must reject/delete it manually.
  Claim ID: clm_xxxxxxxxxxxxxxxxxx

═══════════════════════════════════════════════════════
  Results: 3 passed, 0 failed (3 total checks)
═══════════════════════════════════════════════════════

  All write smoke checks passed.
  Remember: smoke-test claim must be manually rejected/deleted by a site admin.
```

### Live run — dedup/existing (if same normalized claim text was seen before)

```
2. POST /api/claims (submit one labelled smoke-test claim)
  PASS: POST /api/claims → 200, dedup triggered (existing=true), claim.id: clm_xxxxx
  PASS: POST /api/claims → dedup behaviour confirmed — no duplicate row created
```

A dedup response is a **pass** — it confirms that duplicate handling is working
correctly.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Dry-run complete with no network requests, OR all live write checks passed |
| `1` | A live write check failed — network error, unexpected status, or unexpected response shape |
| `2` | Base URL is missing, does not start with `http://` or `https://`, or safety gate flags are malformed |

### Failure cases

A `claim.reviewState` value other than `'review'` on a new claim is an explicit
**FAIL** — the script will print a warning that the claim may be publicly visible
and exit 1. Do not proceed with any Worker change until this is investigated.

---

## 9. Cleanup Policy

The first version of this script does not perform any automatic cleanup.

- **Created smoke claims are intentionally labelled.** The `HUMANX_SMOKE_TEST_` prefix
  and the phrase "safe to reject/delete manually" in the claim text make them
  identifiable in the admin review queue.

- **Admin cleanup is manual.** A site admin should reject smoke-test claims through
  the admin review interface (`POST /api/review/decision` with the admin token), which
  sets `review_state='rejected'` and closes any open reports.

- **Do not use D1 or Wrangler commands for cleanup** unless the user explicitly
  requests it in the current task. If direct D1 row deletion is ever needed, follow
  the safe-deletion sequence in `docs/D1_DUPLICATE_CLEANUP.md` (re-point child rows
  before deleting parent rows).

- **Future cleanup tooling** should be admin-gated and purpose-built — not added as a
  side-effect of this smoke test script.

---

## 10. Relationship to Other Tests

**Run the read smoke test first:**
```
node scripts/read-endpoint-smoke-test.mjs https://YOUR-HUMANX-SITE.example
```
Read endpoints must be confirmed passing before write tests are meaningful. If
`/api/health` or `/api/claims` (GET) are failing, there is no point running write tests.
See `docs/READ_ENDPOINT_SMOKE_TEST_USAGE.md` and `docs/LIVE_READ_SMOKE_RESULT.md`.

**Run manual frontend QA separately:**
This script does not confirm that the browser UI works, that forms submit and render
correctly, that mobile layout is usable, or that the Belief Engine save bridge completes.
Those require `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` run by a human in a browser.

**Recommended sequence before any Worker structural change:**

1. `node scripts/hardening-smoke-test.mjs` — pure function tests, no network (baseline: 100 passed, 0 failed)
2. `node scripts/read-endpoint-smoke-test.mjs https://YOUR-URL` — read endpoint baseline
3. `HUMANX_ALLOW_WRITE_SMOKE_TEST=1 node scripts/write-endpoint-smoke-test.mjs https://YOUR-URL --i-understand-this-mutates-data` — write smoke (only when approved)
4. `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` — human QA in a browser
5. Only then proceed with the structural change

---

## 11. Stop Conditions

Stop and investigate before continuing if any of the following occur:

- **Script output suggests more than one claim will be created** — each run creates
  at most one claim (the dedup path prevents duplicates); if the output implies a loop
  or batch operation, stop
- **Script tries to call admin, evidence, vote, truth, belief, or AI routes** — these
  are explicitly excluded; any call to those endpoints is unintended behaviour
- **Claim response does not show `reviewState: 'review'` or an existing/dedup response** —
  a different review state means a claim may be publicly visible; stop and investigate
  before running any further tests
- **Any production mutation was not explicitly approved by the user** — write tests
  must never run by default or without deliberate opt-in
- **Any D1 or Wrangler command is requested as part of the test** — the script runs
  with `node` only; no infrastructure commands are acceptable
