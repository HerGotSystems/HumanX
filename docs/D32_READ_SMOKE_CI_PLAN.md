# D-32: CI Read-Only Smoke Workflow

Date: 2026-06-06
Status: CI-only addition. No code changes, no schema changes, no D1 commands, no Wrangler, no live write smoke.

---

## Why this exists

`docs/PROJECT_STATE.md` has documented the following known limitation since D-22:

> **Live read smoke from Windows sandbox may fail.**
> `scripts/read-endpoint-smoke-test.mjs` uses Node.js `fetch`, which inherits the Windows `schannel`
> TLS library. In sandboxed or restricted environments `schannel` cannot reach CRL/OCSP revocation
> servers, producing `CRYPT_E_NO_REVOCATION_CHECK` and `fetch failed` for all HTTPS requests.
> This is a local TLS policy restriction, not an app failure. Run the live read smoke from a CI
> environment or a dev machine with unrestricted outbound TLS (e.g. GitHub Actions, WSL with
> curl's CA bundle).

The D-32 workflow adds a GitHub Actions job that runs `read-endpoint-smoke-test.mjs` on
`ubuntu-latest`, where `fetch` uses the system's OpenSSL CA bundle and is not affected by Windows
`schannel` restrictions. This closes the gap without requiring any local environment change.

---

## Read-only scope

The workflow only calls `scripts/read-endpoint-smoke-test.mjs`. That script:

- Makes **only GET requests**. There are no POST, PUT, PATCH, or DELETE calls anywhere in the file.
- Does **not** call any admin endpoint (`/api/review`, `/api/import-*`, `/api/debug`, `/api/seed`).
- Does **not** call `/api/runpack` (the RunPack builder is a POST and is out of scope for this check).
- Does **not** trigger any AI provider, consume API credits, or require an AI key.
- Does **not** run Wrangler, `wrangler d1 execute`, `wrangler deploy`, or any variant.
- Does **not** modify D1, create records, or change any Worker state.
- Exits 0 on full pass, 1 if any check fails, 2 if the base URL is missing.

The `x-humanx-user` header sent to `/api/belief-snapshots` uses the deterministic fake ID
`usr_smoketest000000000000000`. This ID has never saved a snapshot; the endpoint returns an empty
array. No record is created or modified.

---

## Endpoints audited

| # | Method | Path | Notes |
|---|--------|------|-------|
| 1 | GET | `/api/health` | Static response; no D1 query |
| 2 | GET | `/api/ai/analyse` | Intentionally disabled; must return 402 |
| 3 | GET | `/api/claims` | Public read; empty array is valid |
| 4 | GET | `/api/truths` | Public read; empty array is valid |
| 5 | GET | `/api/evidence-vault` | Public read; empty array is valid |
| 6 | GET | `/api/graph-status` | Public read; live D1 count query |
| 7 | GET | `/api/belief-snapshots` | Fake smoke user; empty array expected |
| 8 | GET | `/api/claims/:id` | Optional; only runs if step 3 returns items |

No write endpoint is called. No admin token is sent. No secret is required.

---

## Workflow trigger

File: `.github/workflows/read-smoke.yml`

```yaml
on:
  workflow_dispatch:       # manual trigger from GitHub Actions UI
  pull_request:
    branches:
      - main               # also runs automatically on PRs against main
```

### Manual run (workflow_dispatch)

1. Go to the repo on GitHub.
2. Click **Actions** tab.
3. Select **HumanX Read Smoke** in the left sidebar.
4. Click **Run workflow** → select branch → **Run workflow**.
5. Watch the `read-smoke` job log. Each check prints `PASS`, `FAIL`, or `SKIP`.

### Automatic run (pull_request)

The workflow fires on every PR targeting `main`. This catches any Worker route change that breaks a
public GET endpoint before the PR is merged. Because the script requires no secrets, the PR runner
has all it needs.

---

## What success means

All 8 endpoint groups returned the expected HTTP status, parseable JSON, and top-level keys. The
live HumanX Worker at `humanx.rinkimirikata.com` is reachable and responding correctly to public
GET requests. D1 is connected (if `/api/graph-status` returns non-zero counts and `/api/health`
does not say `mode: demo-fallback`).

Exit code: `0 — all tested endpoints passed`.

---

## What failure means

One or more checks printed `FAIL:`. The log shows the endpoint, expected status or keys, and actual
value. Common causes:

| Symptom | Likely cause |
|---------|-------------|
| All checks: network error / timeout | Worker not deployed; Cloudflare incident |
| `/api/health` → `mode: demo-fallback` note | D1 not connected to Worker binding |
| `/api/claims` → 5xx | Worker crash; check Cloudflare dashboard logs |
| `/api/ai/analyse` → 200 instead of 402 | Disabled endpoint was accidentally re-enabled |
| `/api/claims/:id` skipped | No claims exist in D1 — not a failure, just a skip |

A `SKIP` is not a failure. Skipped checks are expected (e.g. no claims in DB → claim-by-id test
skips gracefully).

---

## What this does NOT prove

- **Does not prove write paths work** — no POST, PUT, or DELETE is tested. Use D-26 manual live UI
  test plan for write-path verification.
- **Does not prove frontend JS is correct** — the smoke test is API-level only. Browser rendering,
  mode transitions, scroll restoration, and RunPack generation are not tested.
- **Does not prove moderation routes work** — `/api/review/*` is intentionally excluded (admin-only,
  requires token).
- **Does not prove RunPack provenance** — `/api/runpack` is a POST and is not called.
- **Does not prove AI analysis flows** — `/api/ai/analyse` intentionally returns 402; no AI call
  is made.
- **Does not replace the D-26 manual live UI test plan.**
- **Does not replace the hardening smoke tests** — `hardening-smoke-test.mjs`,
  `belief-engine-static-check.mjs`, and `worker-route-static-check.mjs` run locally against
  static source files and are independent of the live Worker.

---

## Explicit boundaries

| Boundary | Status |
|----------|--------|
| No Wrangler commands | ✅ None in workflow or script |
| No D1 write commands | ✅ None |
| No `wrangler deploy` | ✅ Not present |
| No GitHub secrets required | ✅ `HUMANX_BASE_URL` is a hardcoded public URL |
| No admin token | ✅ Not sent to any endpoint |
| No live write smoke | ✅ No POST/PUT/PATCH/DELETE |
| No production mutations | ✅ All GET |
| No AI provider calls | ✅ `/api/ai/analyse` is disabled and tested for 402 |

---

## Static checks (unchanged by D-32)

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | No output, exit 0 |
| `node --check src/worker.js` | No output, exit 0 |
| `hardening-smoke-test.mjs` | **100 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed (39 hard checks)** |

No new hardening smoke checks added in D-32 (CI-only addition, no source code changed).
