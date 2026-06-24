# D-150A — Production Deployment Provenance Guard

**Date:** 2026-06-24
**Scope:** Backend (new static module + one route), smoke tests, API inventory, docs. No migration. No `wrangler.toml`. No enforcement. No soft warning.

---

## Why This Exists

Multiple D-149 checkpoints were committed to `main` but not immediately deployed. This caused live-verification confusion: the repo's committed code had an endpoint; production was still running the previous Worker; the first verification attempt returned 404. The gap was caught by checking `wrangler tail` output, but it required knowing to look.

`GET /api/version` gives any caller — browser console, curl, a future CI step — an instant answer to "what is production actually running right now?" without needing `wrangler tail`, admin access, or source-code archaeology.

---

## What Was Added

### `src/deploy-meta.js` (new file)

A pure static ES module. No env, no request, no D1, no secrets.

```js
export const DEPLOY_META = {
  app:        'humanx',
  checkpoint: 'D-149H',
  commit:     '66101cb',
  baseline:   '1016/24/57',
  updated_at: '2026-06-24T00:00:00Z',
};
```

Update this file on every manual deploy so the live endpoint reflects the actual running version.

### `GET /api/version` (new route in `src/worker.js`)

- Public. No auth required. No `x-humanx-admin`. No `x-humanx-user`.
- No D1 query. Response is built entirely from `DEPLOY_META`.
- Response shape:

```json
{
  "ok": true,
  "app": "humanx",
  "checkpoint": "D-149H",
  "commit": "66101cb",
  "baseline": "1016/24/57",
  "updated_at": "2026-06-24T00:00:00Z",
  "note": "commit and checkpoint reflect last manual deploy — update deploy-meta.js on each deploy"
}
```

---

## How to Use It Before Live Verification

Before running any live check that depends on specific backend code being present, pull `/api/version` first:

```js
// Browser console — no auth header needed
const v = await fetch('https://humanx.rinkimirikata.com/api/version').then(r => r.json());
console.log(v.checkpoint, v.commit);
```

Or with curl:

```bash
curl -s https://humanx.rinkimirikata.com/api/version | python3 -m json.tool
```

If `checkpoint` and `commit` match the commit you just deployed, production is current. If they do not match, the deploy has not propagated yet — do not run the live verification pass.

---

## What It Does and Does Not Prove

**Proves:**
- Which checkpoint and commit was last manually deployed.
- Whether the Worker you think is live is actually the one serving requests.
- That the basic routing layer is responding (the route is the first thing hit).

**Does not prove:**
- That D1 is connected and healthy (use `/api/health` for that).
- That all routes work correctly — this is not a functional smoke test.
- That the deploy was complete (Cloudflare propagation is usually fast but not instant; edge cache may lag).
- That code is correct — only that the specific commit's Worker is deployed.

---

## Deployment Remains Manual

Nothing in this patch automates deployment. Deploying still requires:

```bash
npx wrangler deploy
```

run manually by the owner. After each deploy, `src/deploy-meta.js` should be updated to the new checkpoint/commit/baseline/updated_at and committed. The update commit itself does not require a new deploy — `deploy-meta.js` is baked into the Worker bundle at deploy time.

### Workflow

1. Complete a patch (code + docs).
2. Run `npx wrangler deploy`.
3. Update `src/deploy-meta.js` with new checkpoint, commit, baseline, updated_at.
4. Commit: `git commit -m "chore: update deploy-meta.js for <patch-id>"` (or include in the patch commit).
5. Next deploy will bake the updated meta into the bundle.

Alternatively, update `deploy-meta.js` as the last file in the patch commit so the provenance is always current after one deploy.

---

## Smoke Tests Added

Twelve new tests in `scripts/hardening-smoke-test.mjs` (Section 84 — D-150A):

| Test | What it checks |
|---|---|
| `src/deploy-meta.js` exists and exports `DEPLOY_META` | Module present |
| `DEPLOY_META` contains required fields | app/checkpoint/commit/baseline/updated_at all present |
| `DEPLOY_META` contains no secret, token, or admin-token value | Safe metadata only |
| `DEPLOY_META` contains no user id or user data | Safe metadata only |
| `GET /api/version` route exists in worker.js | Route registered |
| `GET /api/version` is NOT admin-gated | No `requireAdmin` on this route |
| `GET /api/version` spreads `DEPLOY_META` | No manual field duplication |
| `worker.js` imports `DEPLOY_META` from `deploy-meta.js` | Import wired correctly |
| `GET /api/version` does not reference `env.DB` or D1 | No DB query |
| `deploy-meta.js` does not access env, request, or D1 | Pure static module |
| No owner-token enforcement work was resumed | No `OWNER_TOKEN_REQUIRED` or rejection logic added |
| `docs/API_ENDPOINT_INVENTORY.md` documents `/api/version` | Inventory current |

---

## API Inventory

`docs/API_ENDPOINT_INVENTORY.md` updated — `/api/version` added to the Health / System table.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1028 passed, 0 failed  (+12 from D-149H baseline)
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```
