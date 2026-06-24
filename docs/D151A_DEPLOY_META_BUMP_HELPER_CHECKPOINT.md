# D-151A — Deploy Metadata Bump Helper

**Date:** 2026-06-24
**Scope:** New helper script, smoke tests, docs. No migration. No `wrangler.toml`. No backend feature work. No enforcement. No soft warning.

---

## Why This Exists

D-150A/B introduced `GET /api/version` backed by `src/deploy-meta.js`. The workflow requires updating `deploy-meta.js` manually before each deploy so `checkpoint`, `commit`, and `baseline` reflect what production is actually running. Without a helper it is easy to forget the bump, or to copy the wrong SHA by hand.

`scripts/bump-deploy-meta.mjs` automates the file-write step.

---

## What Was Added

### `scripts/bump-deploy-meta.mjs`

A direct-node ES module script. No framework. No env reads. No secrets. No deploy.

**Usage:**

```bash
node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>
```

**Example:**

```bash
node scripts/bump-deploy-meta.mjs D-151A 1042/24/57
```

**What it does:**

1. Reads the current git short SHA from `git rev-parse --short HEAD`.
2. Validates: checkpoint must be non-empty and have no whitespace; baseline must match `NNN/NN/NN`; git SHA must look like a valid short hash.
3. Writes `src/deploy-meta.js` with: `app: 'humanx'`, `checkpoint`, `commit` (from git), `baseline`, `updated_at` (current ISO timestamp).
4. Prints a confirmation summary and next-step instructions.

**What it does not do:**

- Does not read `process.env` or any secret.
- Does not call `wrangler deploy`.
- Does not touch any file other than `src/deploy-meta.js`.
- Does not make network requests.
- Does not write to D1.

---

## Full Deploy Workflow

After completing a patch:

```bash
# 1. Bump deploy metadata
node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>

# 2. Run baseline checks
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs

# 3. Commit the bump (can be combined with the patch commit)
git add src/deploy-meta.js
git commit -m "chore: bump deploy-meta for <checkpoint>"

# 4. Deploy
npx wrangler deploy

# 5. Verify production reflects the new values
# Browser console (no auth needed):
fetch('https://humanx.rinkimirikata.com/api/version').then(r => r.json()).then(console.log)
```

The `checkpoint` and `commit` in the `/api/version` response should match what the bump script printed.

---

## Validation Errors

The script exits with a clear error message (exit code 1) for:

| Condition | Message |
|---|---|
| Missing checkpoint arg | `checkpoint label is required` |
| Missing baseline arg | `baseline string is required` |
| Baseline format wrong | `does not match the expected format NNN/NN/NN` |
| Checkpoint has whitespace | `must not contain whitespace` |
| git not available / not a repo | `could not read git HEAD` |
| Unexpected SHA format | `unexpected git short SHA format` |

---

## Smoke Tests Added

Fourteen new tests in `scripts/hardening-smoke-test.mjs` (Section 85 — D-151A):

| Test | What it checks |
|---|---|
| Script exists and is readable | File present |
| Writes checkpoint/commit/baseline/updated_at | All four fields written |
| Always writes `app: 'humanx'` | App field stable |
| Reads commit from `git rev-parse --short HEAD` | SHA from git, not from args |
| Validates baseline format `NNN/NN/NN` | Bad baselines rejected |
| Exits with error when checkpoint is missing | Arg validation |
| Exits with error when baseline is missing | Arg validation |
| No secret/token/admin-token strings | Safe helper |
| Does not read `process.env` | No env access |
| Does not execute `wrangler deploy` via `execSync` | No auto-deploy |
| Writes only to `src/deploy-meta.js` | Scoped file write |
| Prints next-step instructions | UX — deploy and verify reminder |
| `/api/version` still uses `src/deploy-meta.js` | Route still reads the module |
| No owner-token enforcement resumed | Enforcement policy unchanged |

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1042 passed, 0 failed  (+14 from D-150B baseline of 1028)
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

`src/deploy-meta.js` was also bumped by the helper itself during development of this patch:
- `checkpoint: D-151A`
- `commit: bd4ab1e` (D-150B commit — the HEAD at bump time)
- `baseline: 1042/24/57`
