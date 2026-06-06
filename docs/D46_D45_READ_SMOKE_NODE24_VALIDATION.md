# D-46: D-45 Read Smoke Validation — Node 24 Force Override Result

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes.

---

## D-45 Push Confirmation

D-45 (`693e3e2`) was pushed to `main`. The commit added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`
as a top-level `env:` block to `.github/workflows/read-smoke.yml`.

---

## HumanX Read Smoke Result

`HumanX Read Smoke` was triggered manually on `main` after D-45 push.

**Result: ✅ Green — all endpoint groups passed. Exit 0.**

The workflow script (`node scripts/read-endpoint-smoke-test.mjs`) ran on Node 24 as expected.
All live read endpoints responded correctly. No regressions.

---

## Annotation — Before and After D-45

### Before D-45 (annotation text, D-43/D-44 runs)

> Node.js 20 actions are deprecated. The following actions are **running on Node.js 20**:
> `actions/checkout@v4`, `actions/setup-node@v4`.

The action wrappers were executing under the Node 20 runtime.

### After D-45 (annotation text, this run)

> Node.js 20 actions are deprecated. The following actions **target Node.js 20** but are
> **being forced to run on Node.js 24** due to `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`:
> `actions/checkout@v4`, `actions/setup-node@v4`.

### What changed

The wording shift is significant:

| Aspect | Before D-45 | After D-45 |
|--------|-------------|------------|
| Action wrapper runtime | Node 20 | Node 24 (forced) |
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` | Not set | Active (`true`) |
| Annotation present | Yes | Yes (changed form) |
| Workflow green | Yes | Yes |

**D-45 achieved its intended effect.** The action wrappers are now executing under Node 24.
The annotation is no longer saying they ran on Node 20 — it is now a metadata warning that
the action *declares* a Node 20 target in its `action.yml`, which is an upstream property
of `actions/checkout@v4` and `actions/setup-node@v4` that their maintainers control.

---

## Root Cause of Remaining Annotation

`actions/checkout@v4` and `actions/setup-node@v4` each have an `action.yml` that declares
`using: node20` (or equivalent). This is metadata baked into the action's release tag by
its maintainers. No amount of workflow configuration from the consumer side changes this
declaration — it lives in the action's own repository.

`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` overrides the *runtime selection* but cannot
change the upstream *metadata declaration*. GitHub's runner reads the declaration, sees
`node20`, emits the deprecation annotation, then honours the force flag and runs under
Node 24 anyway. The annotation reflects the declared target, not the actual runtime.

**The remaining annotation is upstream action metadata noise. It is not a functional
failure. The workflow runs fully on Node 24 (script and action wrappers).**

---

## Resolution Options

| Option | When | Notes |
|--------|------|-------|
| **Leave as-is** | Now | Read Smoke is green. Action wrappers run on Node 24. Annotation is non-blocking metadata noise. No action needed. |
| **Upgrade to `actions/checkout@v5` / `actions/setup-node@v5`** | When v5 releases with `using: node24` metadata | Correct long-term fix. Removes the annotation entirely. Not yet available. Watch https://github.com/actions/checkout/releases and https://github.com/actions/setup-node/releases. |
| **Remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`** | Only after v5 upgrade | The force flag can be dropped once actions declare Node 24 natively. Until then, keep it. |

**Recommended:** Leave as-is. The system is fully functional. When `checkout@v5` and
`setup-node@v5` become available with native Node 24 support, a single D-47 CI commit
can upgrade both and drop the force flag in one pass.

---

## Static Checks at D-46 (unchanged)

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | exit 0 |
| `node --check src/worker.js` | exit 0 |
| `hardening-smoke-test.mjs` | **110 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed** |

Baseline is **110 / 24 / 39**. No changes.

---

## D-46 Completion Record

| Item | Status |
|------|--------|
| D-45 push confirmed | ✅ |
| Read Smoke green after D-45 | ✅ |
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` confirmed active | ✅ |
| Annotation change documented (was "running on Node 20", now "forced to Node 24") | ✅ |
| Root cause of remaining annotation identified (upstream `action.yml` metadata) | ✅ |
| Resolution options documented (wait for v5 actions) | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No code changes | ✅ Confirmed |
| No workflow changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
