# D-150B — Production Deployment Provenance Live Verification

**Date:** 2026-06-24
**Scope:** Verification only. No code changes. No migration. No `wrangler.toml` change. No enforcement. No soft warning.

Verified against:
- `https://humanx.rinkimirikata.com`

---

## Summary

D-150A added `GET /api/version` and `src/deploy-meta.js`. D-150B bumped the metadata to reflect D-150A as the deployed checkpoint. This checkpoint records the owner's sanitized confirmation that production returns the correct provenance after `npx wrangler deploy`.

---

## Production Confirmed (owner-verified, live, sanitized)

`npx wrangler deploy` was run manually to bring production up to the D-150B code, then `GET /api/version` was checked live.

| Field | Value |
|---|---|
| `ok` | `true` |
| `app` | `humanx` |
| `checkpoint` | `D-150A` |
| `commit` | `4d79c18` |
| `baseline` | `1028/24/57` |
| `updated_at` | `2026-06-24T00:00:00Z` |
| `note` | `commit and checkpoint reflect last manual deploy — update deploy-meta.js on each deploy` |

No `owner_token` value, no `HUMANX_OWNER_SECRET` value, no admin token value, and no user data appeared in the response or in this document.

---

## What This Confirms

- `GET /api/version` is live and returns HTTP 200.
- The endpoint is public-safe — no auth required, no sensitive fields.
- The `checkpoint`, `commit`, and `baseline` fields correctly reflect the last deployed state.
- The `note` field is present and advisory-only.
- The provenance system introduced in D-150A is working end-to-end.

---

## How to Use This Endpoint

Before any future live-verification pass, pull `/api/version` first to confirm production is running the expected commit:

```js
// Browser console — no auth header needed
const v = await fetch('https://humanx.rinkimirikata.com/api/version').then(r => r.json());
console.log(v.checkpoint, v.commit);
```

If `checkpoint` and `commit` match the commit just deployed, verification can proceed. If they do not match, the deploy has not taken effect yet — do not start the verification pass.

---

## Deploy Workflow Going Forward

1. Complete a patch (code + docs).
2. Update `src/deploy-meta.js` — checkpoint, commit, baseline, updated_at.
3. Commit (can be part of the patch commit or a follow-on like D-150B).
4. Run `npx wrangler deploy`.
5. Pull `GET /api/version` to confirm production reflects the new values.
6. Write a live-verification checkpoint if the patch requires it.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1028 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-150A/D-150B. This checkpoint made no code, migration, or test changes.
