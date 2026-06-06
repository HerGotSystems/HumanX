# D-34: Read Smoke Workflow — Node 24 Update

Date: 2026-06-06
Status: CI-only one-line change. No frontend, no Worker, no Wrangler, no D1, no live writes.

---

## Reason

The D-33 run recorded a non-blocking annotation from the GitHub Actions runner:

> Node.js 20 actions are deprecated. Actions will be forced to run with Node.js 24 by default
> starting **June 16th, 2026**. Node.js 20 will be removed from the runner on
> **September 16th, 2026**.

The affected actions were `actions/checkout@v4` and `actions/setup-node@v4`, both of which
run on the Node.js version pinned in the workflow's `setup-node` step. D-34 updates that pin
from `'20'` to `'24'` before the forced cutover date.

---

## Exact change

File: `.github/workflows/read-smoke.yml`

```diff
-          node-version: '20'
+          node-version: '24'
```

No other lines changed. `actions/checkout@v4` and `actions/setup-node@v4` remain at `v4` —
both are Node 24-compatible as of their current `v4` release.

---

## Safety

| Boundary | Status |
|----------|--------|
| No frontend changes | ✅ |
| No Worker changes | ✅ |
| No Wrangler commands | ✅ |
| No D1 commands | ✅ |
| No live write smoke | ✅ |
| No production mutations | ✅ |
| No secrets added | ✅ |
| Read-only workflow scope unchanged | ✅ All 8 checks remain GET-only |

The script `scripts/read-endpoint-smoke-test.mjs` uses only `fetch`, `process`, and standard
`console` — all stable and unchanged across Node 18/20/22/24. No script changes are needed.

---

## Expected result

The `HumanX Read Smoke` workflow should behave identically to the D-33 run:

- All 8 endpoint groups pass
- Exit 0
- Duration ~15s

The Node 20 deprecation annotation should no longer appear. If the annotation still fires after
this change, it is coming from the `actions/checkout@v4` action itself (not the `setup-node`
step) and would require bumping that action to `v5` or later.

---

## After push/merge

Run `HumanX Read Smoke` manually once on `main` via GitHub Actions → Run workflow to confirm
Node 24 produces the same green result as D-33. This run does not need a separate docs batch
unless it fails.

---

## Static checks (unchanged by D-34)

| Script | Result |
|--------|--------|
| `hardening-smoke-test.mjs` | **100 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed (39 hard checks)** |

No hardening smoke checks added or changed — CI-only, no source code modified.
