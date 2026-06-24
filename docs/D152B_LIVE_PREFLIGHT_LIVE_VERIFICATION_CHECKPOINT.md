# D-152B — Live Deployment Preflight Live Verification

**Date:** 2026-06-24
**Scope:** Verification only. No code changes. No migration. No `wrangler.toml` change. No enforcement. No soft warning.

Verified against:
- `https://humanx.rinkimirikata.com`

---

## Summary

D-152A added `scripts/live-preflight.mjs`. D-152B bumped `deploy-meta.js` to `D-152A / c6d1437 / 1057/24/57` and deployed. This checkpoint records the owner's sanitized confirmation that the live preflight script passes cleanly against production.

---

## Preflight Run Confirmed (owner-verified, live, sanitized)

Command run after `npx wrangler deploy`:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-152A c6d1437 1057/24/57
```

| Check | Result |
|---|---|
| `/api/version` HTTP status | PASS |
| `/api/version` `ok === true` | PASS |
| `/api/version` `app === humanx` | PASS |
| `checkpoint` matches `D-152A` | PASS |
| `commit` matches `c6d1437` | PASS |
| `baseline` matches `1057/24/57` | PASS |
| `/api/health` HTTP status | PASS |
| `/api/health` `ok === true` | PASS |

All 8 checks passed. Production is running `D-152A / c6d1437`.

No `owner_token` value, no `HUMANX_OWNER_SECRET` value, no admin token value, and no user data appeared in the preflight output or in this document.

---

## What This Confirms

- The live preflight script works end-to-end against production.
- All three layers of the D-150/151/152 provenance workflow are now verified:
  - `bump-deploy-meta.mjs` writes the correct metadata (D-151A/B).
  - `GET /api/version` returns it live (D-150A/B).
  - `live-preflight.mjs` checks it programmatically and exits 0 (this checkpoint).
- No browser console copy-paste needed for future pre-verification checks.

---

## Deploy Workflow — Now Complete

The full tooled workflow for each future patch is:

```bash
# 1. Bump metadata
node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>

# 2. Run checks
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs

# 3. Commit and deploy
git add src/deploy-meta.js && git commit -m "chore: bump deploy-meta for <checkpoint>"
npx wrangler deploy

# 4. Verify (replaces browser console step)
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com <checkpoint> <commit> <baseline>
```

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1057 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged. This checkpoint made no code, migration, or test changes.
