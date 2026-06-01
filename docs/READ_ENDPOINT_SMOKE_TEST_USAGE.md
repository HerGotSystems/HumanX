# Read Endpoint Smoke Test — Usage Guide

## 1. Purpose

This document explains how to safely run `scripts/read-endpoint-smoke-test.mjs` — the
read-only backend smoke test for the HumanX Cloudflare Worker.

It covers what the script checks, what it must never check, how to invoke it, what
the output means, and when it is safe to run.

---

## 2. Current Repo Note

This repo currently has **no `package.json`**. There is no npm script wrapper for
this test.

- Do not create a `package.json` solely to wrap this script.
- Run the script directly using Node.js.
- Node 18 or later is required (uses global `fetch` and `AbortController`).

The hardening smoke test (`scripts/hardening-smoke-test.mjs`) works the same way —
run it directly with `node`.

---

## 3. What the Script Tests

The script makes read-only GET requests and confirms each endpoint returns the
expected HTTP status, parseable JSON, and the top-level keys that
`public/app-v10.js` depends on.

All checks and expected response shapes were derived from `src/worker.js` and the
module files in `src/`. Nothing is invented.

| # | Endpoint | What is checked |
|---|---|---|
| 1 | `GET /api/health` | HTTP 200; keys `ok`, `service`, `mode`, `ai`, `legacy_ai`; confirms `ok=true` and `service='humanx'`; notes if `mode=demo-fallback` meaning D1 is not connected |
| 2 | `GET /api/ai/analyse` | HTTP **402** (not 200); keys `error`, `legacy_error`, `message`; confirms `error='RUNPACK_MODE'` meaning no AI provider was called and no API credits were consumed |
| 3 | `GET /api/claims` | HTTP 200; `claims` is present and is an array; if non-empty, first item has keys `id`, `claim`, `status`, `reviewState`, `evidenceScore` |
| 4 | `GET /api/truths` | HTTP 200; `truths` is present and is an array |
| 5 | `GET /api/evidence-vault` | HTTP 200; `evidence` is present and is an array |
| 6 | `GET /api/graph-status` | HTTP 200; keys `ok`, `graph`, `errors`, `summary` |
| 7 | `GET /api/belief-snapshots` | HTTP 200 with a fake smoke-test user header (`usr_smoketest000000000000000`); `snapshots` is present and is an array; empty result is expected and is not a failure — no data is created |
| 8 | `GET /api/claims/:id` | **Optional** — only runs if step 3 returned at least one claim. Uses the first real claim ID from step 3. Tests a found case (HTTP 200, keys `claim`, `evidence`, `pressure`, `tests`, `analyses`, `lineage`) and a not-found case (HTTP 404, key `error`). Skipped cleanly if there are no claims. |

---

## 4. What It Must Not Test

The following are explicitly excluded from this script and must never be added to it
without a separate, deliberate decision:

- Any `POST`, `PUT`, `PATCH`, or `DELETE` endpoint
- Claim voting (`POST /api/claim-vote`)
- Claim submission (`POST /api/claims`)
- Evidence submission or attach (`POST /api/evidence`, `POST /api/evidence-attach`)
- Truth creation or promotion (`POST /api/truths`, `POST /api/truth-to-claim`)
- Belief snapshot saving or promoting (`POST /api/belief-snapshots`, `POST /api/belief-promote`)
- Review approve/reject (`POST /api/review/decision`)
- `GET /api/debug` — exposes table row counts without auth; testing it would entrench ungated behaviour
- `GET /api/seed` — can write to D1 on an empty database
- `GET /api/import-seed`, `GET /api/import-truths` — admin-only and write-capable
- `GET /api/review` — requires admin token; do not embed credentials in this script
- Any endpoint that triggers a real AI provider call or consumes API credits
- Any D1 migration command
- Any Wrangler command

---

## 5. How to Run When Explicitly Approved

**The script must only be run against the live production Worker when the user
explicitly approves.** See section 7 for safety warnings.

### Using a CLI argument

```
node scripts/read-endpoint-smoke-test.mjs https://YOUR-HUMANX-SITE.example
```

### Using an environment variable

```
HUMANX_BASE_URL=https://YOUR-HUMANX-SITE.example node scripts/read-endpoint-smoke-test.mjs
```

The URL must start with `http://` or `https://`. A trailing slash is normalised
automatically. If the URL is missing or invalid, the script exits with code 2 and
prints usage instructions.

### Node version requirement

Node 18 or later. The script uses global `fetch` (available since Node 18) and
`AbortController`. No external dependencies are installed.

---

## 6. Expected Result

### Output format

The script prints a header, one numbered section per endpoint, and a summary:

```
═══════════════════════════════════════════════════════
  HumanX Read-Endpoint Smoke Test
═══════════════════════════════════════════════════════
  Base URL : https://your-worker.workers.dev
  Timeout  : 10000ms per request
  Mode     : read-only, no data mutation
═══════════════════════════════════════════════════════

1. GET /api/health
  PASS: GET /api/health → 200, keys present: ok, service, mode, ai, legacy_ai
  PASS: GET /api/health → ok value
  PASS: GET /api/health → service value

...

═══════════════════════════════════════════════════════
  Results: N passed, 0 failed, 0 skipped (N total checks)
═══════════════════════════════════════════════════════

  All checks passed. Safe to continue.
```

### Per-check labels

| Label | Meaning |
|---|---|
| `PASS: ...` | Check passed |
| `FAIL: ...` | Check failed — reason printed on the next line |
| `SKIP: ...` | Check was skipped for an expected reason (e.g. no claims exist) |

### Skipped `GET /api/claims/:id`

If `GET /api/claims` returns an empty array, the per-ID checks are skipped. This is
**not a failure** — a freshly seeded or empty database will produce this result.
The script exits 0 if all other checks pass.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | All tested endpoints passed. Skipped checks do not count as failures. Safe to continue. |
| `1` | At least one endpoint failed. Do not proceed with any Worker refactor until the failure is understood and resolved. |
| `2` | Base URL is missing or does not start with `http://` or `https://`. |

---

## 7. Safety Warnings

- **Only run against the live production Worker when the user explicitly approves.**
  The script is read-only in design, but production endpoints should not be hit
  routinely without intent.

- **This script is read-only by design.** It makes only GET requests. If any output
  suggests data was created, changed, or deleted — stop immediately and investigate
  before running again.

- **Do not use admin tokens.** This script does not accept or use
  `HUMANX_ADMIN_TOKEN`. Do not modify it to embed credentials.

- **Do not run Wrangler or D1 commands** as part of running or acting on this script's
  output. If the script reveals a problem, diagnose it by reading code — not by
  running `wrangler d1 execute`.

- **Do not rerun migration 0004.** If the script surfaces a D1 issue, do not respond
  by re-running `migrations/0004_unique_normalized_content.sql`. That migration is
  already applied to production. See `docs/OPERATIONAL_STATUS.md`.

- **A `mode: demo-fallback` result from `/api/health`** means the Worker is running
  but D1 is not connected. The D1-dependent endpoints (claims, truths, evidence-vault,
  graph-status, belief-snapshots) may return empty arrays or fallback responses in this
  state — this is not a bug in the test script.

---

## 8. Relationship to Manual QA

This script does **not** replace `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`.

Automated read-endpoint checks confirm HTTP status codes, JSON parseability, and
top-level key presence. They do not confirm:

- That the browser renders data correctly
- That navigation between views works
- That forms submit and display confirmation states
- That mobile layout is usable
- That the Belief Engine save bridge completes end-to-end
- That the Drift page classifies full profiles correctly
- That empty states display the correct copy

The recommended sequence before any Worker structural change:

1. `node scripts/hardening-smoke-test.mjs` — pure function tests, no network (16 checks)
2. `node scripts/read-endpoint-smoke-test.mjs https://YOUR-URL` — read endpoint checks
3. `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` — human QA in a browser
4. Only then proceed with the structural change
