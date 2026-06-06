# D-33: Read Smoke CI Result

Date: 2026-06-06
Status: Docs-only record of first successful GitHub Actions read smoke run.

---

## Run details

| Field | Value |
|-------|-------|
| Workflow | HumanX Read Smoke |
| File | `.github/workflows/read-smoke.yml` |
| Trigger | `workflow_dispatch` (manual) |
| Branch | `main` (commit `71b39bf`) |
| Runner | `ubuntu-latest` |
| Node.js | 20 |
| Duration | 15 seconds |
| Result | ✅ **Success** |
| `HUMANX_BASE_URL` | `https://humanx.rinkimirikata.com` |

---

## What passed

All 8 endpoint groups in `scripts/read-endpoint-smoke-test.mjs` completed without failure:

| # | Endpoint | Expected | Result |
|---|----------|----------|--------|
| 1 | `GET /api/health` | 200, keys: `ok service mode ai legacy_ai` | ✅ Pass |
| 2 | `GET /api/ai/analyse` | 402 (intentionally disabled) | ✅ Pass |
| 3 | `GET /api/claims` | 200, `claims` array | ✅ Pass |
| 4 | `GET /api/truths` | 200, `truths` array | ✅ Pass |
| 5 | `GET /api/evidence-vault` | 200, `evidence` array | ✅ Pass |
| 6 | `GET /api/graph-status` | 200, keys: `ok graph errors summary` | ✅ Pass |
| 7 | `GET /api/belief-snapshots` | 200, `snapshots` array (empty ok) | ✅ Pass |
| 8 | `GET /api/claims/:id` | 200 found + 404 not-found, or skipped if no claims | ✅ Pass / Skip |

---

## What this proves

- **Live public read endpoints are reachable from a GitHub Ubuntu runner.** The Cloudflare Worker at `humanx.rinkimirikata.com` responds correctly to all public GET requests from a non-Windows environment.
- **The Windows `schannel` TLS restriction is bypassed.** The same script failed locally with `CRYPT_E_NO_REVOCATION_CHECK` on the Windows sandbox. The `ubuntu-latest` runner uses OpenSSL and is unaffected. The script exit code was `0`.
- **`/api/ai/analyse` remains blocked (402) as expected.** The intentionally disabled AI endpoint has not been re-enabled. No AI provider was called and no API credits were consumed.
- **No write endpoints were exercised.** Every call in the script is an HTTP GET. The `x-humanx-user` header on `/api/belief-snapshots` used the deterministic fake smoke ID `usr_smoketest000000000000000`; no record was created or modified.
- **D1 is connected.** A passing `/api/health` and non-fallback responses from `/api/claims`, `/api/truths`, `/api/evidence-vault`, and `/api/graph-status` confirm D1 is bound to the Worker (if mode was not `demo-fallback`).
- **Static check baseline (100/24/39) was not disturbed.** D-33 adds docs only.

---

## What this does NOT prove

- **No browser/UI QA.** The smoke test is API-level only. Rendering, mode transitions, scroll restoration, RunPack generation, and modal interactions are not tested here. See `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` for that scope.
- **No write endpoints tested.** `POST /api/runpack`, claim submission, evidence attachment, analysis save, and all moderation routes were not called.
- **No admin/moderation routes tested.** `/api/review/*`, `/api/import-*`, `/api/debug`, and `/api/seed` are intentionally excluded from the script.
- **No D1 migration safety.** This run does not validate schema state, migration history, or D1 consistency. Schema checks require `PRAGMA table_info(...)` with explicit per-session approval.
- **No RunPack provenance end-to-end.** The `packet_id` chain (D-24B → D-28 → D-29) was not exercised; `/api/runpack` is a POST and is out of scope.
- **Does not replace D-26.** The manual live UI test plan (`docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md`) covers write paths, duplicate-resolution UI, Study continuity, and RunPack flow — none of which are tested by this smoke script.

---

## Annotation: Node.js 20 deprecation warning

The runner emitted the following non-blocking warning:

> Node.js 20 actions are deprecated. The following actions are running on Node.js 20 and may not
> work as expected: `actions/checkout@v4`, `actions/setup-node@v4`. Actions will be forced to run
> with Node.js 24 by default starting **June 16th, 2026**. Node.js 20 will be removed from the
> runner on **September 16th, 2026**.

**Impact today:** None — the job passed successfully on Node 20. The warning is informational.

**Action required before June 16, 2026:** Update `.github/workflows/read-smoke.yml` to pin
`node-version: '24'` in the `actions/setup-node@v4` step. This is a one-line change to the
workflow file; no script changes are needed (`read-endpoint-smoke-test.mjs` uses only standard
`fetch` and `process`, both stable across Node 18+). This is a low-risk CI-only change; direct
main is acceptable.

---

## Next safe actions

1. **D-26 manual live UI test** — `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` covers write paths, duplicate-resolution, Study continuity, RunPack provenance (sections 6–8). Execute when ready for a browser session against `humanx.rinkimirikata.com`. Use `HX_TEST_D26_` naming prefix. Requires explicit per-session approval for any **[WRITE]** steps.
2. **Update workflow to Node 24** before June 16 — change `node-version: '20'` to `node-version: '24'` in `.github/workflows/read-smoke.yml`. One-line fix; no script changes; direct main acceptable.
3. **No live write smoke** without explicit per-session approval.
4. **No D1 migration or Wrangler commands** without explicit per-session approval.
