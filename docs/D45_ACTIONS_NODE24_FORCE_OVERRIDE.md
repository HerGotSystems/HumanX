# D-45: GitHub Actions Node 24 Wrapper Force Override

Date: 2026-06-06
Status: CI-only change. Direct main. No frontend, no Worker, no D1, no Wrangler.

---

## Reason

D-44 audited a persistent annotation emitted by GitHub Actions on every `HumanX Read Smoke`
run (including the D-43 validation run):

> Node.js 20 actions are deprecated. The following actions are running on Node.js 20:
> `actions/checkout@v4`, `actions/setup-node@v4`. Please update your actions to use
> Node.js 24. You can also use `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` as an
> environment variable to force JavaScript actions to run with Node.js 24 in your
> workflow until the actions are updated.

**Root cause (from D-44):** `node-version: '24'` in the `setup-node` step controls the
Node version installed for `run:` shell steps only. It does not affect the internal
JavaScript wrapper bundles that `actions/checkout@v4` and `actions/setup-node@v4` ship —
those bundles are compiled by their maintainers and currently target Node 20.
`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` is the GitHub-recommended interim override
that tells the runner to execute those wrappers under Node 24 regardless.

---

## Exact change

File: `.github/workflows/read-smoke.yml`

```diff
+env:
+  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
+
 jobs:
```

Added as a top-level `env:` block (applies to all jobs in the workflow). The existing
`HUMANX_BASE_URL` env on the `run:` step is unchanged — it remains scoped to the script
step only.

No other lines changed. `actions/checkout@v4` and `actions/setup-node@v4` stay at `v4`.
`node-version: '24'` is unchanged.

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
| Read-only workflow scope unchanged | ✅ All endpoint checks remain GET-only |
| `HUMANX_BASE_URL` step env unchanged | ✅ |

`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` is a runner-level directive. It has no effect
on the `node scripts/read-endpoint-smoke-test.mjs` step — that step already runs on Node
24 via the `setup-node` install. The directive only affects how the runner launches the
action wrapper JS bundles (`checkout`, `setup-node`) that run before the script step.

`actions/checkout@v4` and `actions/setup-node@v4` are confirmed Node 24-compatible by
GitHub. No breaking behaviour expected.

---

## Expected result

After this change is pushed and `HumanX Read Smoke` is triggered:

- All endpoint groups pass (identical to D-43 validation run)
- Exit 0
- Duration ~15 s
- Node 20 deprecation annotation **does not appear**

If the annotation still appears after this change, it means the GitHub runner is not
honouring the env var (unlikely but possible in older runner versions), or a new action
in the workflow is also using Node 20 wrappers. In that case, the correct next step is to
wait for `actions/checkout@v5` / `actions/setup-node@v5` to ship with native Node 24
wrappers, or for GitHub to enforce Node 24 by default (June 16, 2026 deadline).

---

## Workflow file — final state

```yaml
name: HumanX Read Smoke

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  read-smoke:
    name: Read-only endpoint smoke test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Run read-only smoke test
        env:
          HUMANX_BASE_URL: https://humanx.rinkimirikata.com
        run: node scripts/read-endpoint-smoke-test.mjs
```

---

## Static checks (unchanged by D-45)

| Script | Result |
|--------|--------|
| `hardening-smoke-test.mjs` | **110 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed** |

No hardening smoke checks added — CI-only, no source code modified.

---

## D-45 completion record

| Item | Status |
|------|--------|
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` added to workflow top-level env | ✅ Done |
| `HUMANX_BASE_URL` step env unchanged | ✅ Confirmed |
| `node-version: '24'` unchanged | ✅ Confirmed |
| `actions/checkout@v4` and `actions/setup-node@v4` unchanged | ✅ Confirmed |
| `docs/D45_ACTIONS_NODE24_FORCE_OVERRIDE.md` created | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No frontend changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
