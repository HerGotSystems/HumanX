# D-152A — Live Deployment Preflight Script

**Date:** 2026-06-24
**Scope:** New helper script, smoke tests, docs. No migration. No `wrangler.toml`. No backend feature work. No enforcement. No soft warning.

---

## Why This Exists

After each deploy, live verification requires pulling `/api/version` and `/api/health` and confirming the expected `checkpoint`, `commit`, and `baseline` match. Previously this meant copying values from the browser console and eyeballing them. `scripts/live-preflight.mjs` runs the same checks programmatically, exits non-zero on any mismatch, and produces a clean pass/fail report — removing the manual copy-paste step and making the check reliable enough to invoke before any live-verification session.

---

## What Was Added

### `scripts/live-preflight.mjs`

A direct-node ES module. No auth, no secrets, no env reads, no deploy.

**Usage:**

```bash
node scripts/live-preflight.mjs <baseUrl> <checkpoint> <commit> <baseline> [--json]
```

**Example:**

```bash
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-151A f77390b 1042/24/57
```

**Example with `--json` flag (machine-readable output):**

```bash
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-151A f77390b 1042/24/57 --json
```

---

## Checks Performed

| Check | Against |
|---|---|
| `GET /api/version` HTTP status | `200` |
| `ok === true` | `/api/version` body |
| `app === 'humanx'` | `/api/version` body |
| `checkpoint` matches expected arg | `/api/version` body |
| `commit` matches expected arg | `/api/version` body |
| `baseline` matches expected arg | `/api/version` body |
| `GET /api/health` HTTP status | `200` |
| `ok === true` | `/api/health` body |

All eight checks must pass for exit code 0. Any failure produces exit code 1 and a `FAIL:` line in the report showing expected vs got.

---

## Example Output

**Pass:**

```
HumanX Live Preflight — https://humanx.rinkimirikata.com
────────────────────────────────────────────────────
  PASS: /api/version HTTP status
  PASS: /api/version ok === true
  PASS: /api/version app === humanx
  PASS: checkpoint matches
  PASS: commit matches
  PASS: baseline matches
  PASS: /api/health HTTP status
  PASS: /api/health ok === true

  ✓ All checks passed. Production is running D-151A / f77390b.
```

**Fail (stale deploy):**

```
HumanX Live Preflight — https://humanx.rinkimirikata.com
────────────────────────────────────────────────────
  PASS: /api/version HTTP status
  PASS: /api/version ok === true
  PASS: /api/version app === humanx
  FAIL: checkpoint matches
        expected: D-152A
        got:      D-151A
  ...

  ✗ One or more checks failed. Do not start live verification.
```

---

## What Pass Means

A passing run confirms:
- Production is serving the expected Worker bundle (checkpoint + commit match).
- The routing layer is up (`/api/version` returned 200).
- The health endpoint is up (`/api/health` returned 200).
- No auth header was needed — the preflight used only public endpoints.

## What Pass Does Not Prove

- That D1 migrations are current — `/api/health` reports `mode: d1-live` only if `env.DB` is bound; it does not verify schema version.
- That all routes work correctly — this is not a functional smoke test.
- That edge propagation is complete — Cloudflare Workers propagate fast but not instantly; re-running after a minute resolves most edge-cache lag.
- That code is correct — only that the expected commit's Worker is deployed.

---

## What the Script Does Not Do

- Does not read `process.env` or any secret.
- Does not send `x-humanx-admin` or any auth header.
- Does not call `wrangler` or trigger a deploy.
- Does not write any file.
- Does not touch D1 or any backend data.

---

## Smoke Tests Added

Fifteen new tests in `scripts/hardening-smoke-test.mjs` (Section 86 — D-152A):

| Test | What it checks |
|---|---|
| Script exists and is readable | File present |
| Fetches `/api/version` | Correct endpoint |
| Fetches `/api/health` | Correct endpoint |
| Checks `checkpoint` against expected arg | Mismatch detected |
| Checks `commit` against expected arg | Mismatch detected |
| Checks `baseline` against expected arg | Mismatch detected |
| Exits non-zero on mismatch | `process.exit(1)` present |
| Supports `--json` flag | Machine-readable output |
| No secret/token/admin-token strings | Safe script |
| Does not read `process.env` | No env access |
| Does not execute `wrangler` via `execSync` | No auto-deploy |
| Checks `/api/version` HTTP status 200 | Status verified |
| Checks `/api/health` HTTP status 200 | Status verified |
| Does not send `x-humanx-admin` header | Public-safe |
| No owner-token enforcement resumed | Policy unchanged |

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1057 passed, 0 failed  (+15 from D-151B baseline of 1042)
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```
