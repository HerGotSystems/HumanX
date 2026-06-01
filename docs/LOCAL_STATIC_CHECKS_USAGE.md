# Local Static Checks — Usage Guide

## 1. Purpose

This document shows how to run the HumanX local static check scripts safely before and
after risky changes. Static checks read local files only, catch structural drift and
documentation gaps early, and produce a clear pass/fail result without touching any live
infrastructure.

---

## 2. Available Local Static Checks

| Script | Purpose | Last known result | When to run |
|---|---|---|---|
| `scripts/belief-engine-static-check.mjs` | Local Belief Engine route, marker, bridge, and secret-exposure check | 24 passed, 0 failed, 0 warnings | Before/after Belief Engine scoring, contradiction, UI, bridge, or Drift-classification changes |
| `scripts/worker-route-static-check.mjs` | Local Worker route, docs, and risk-map consistency check | 35 passed, 0 failed, 0 warnings | Before/after Worker route additions, removals, renames, or modular split steps |

Full result records:

- `docs/BELIEF_ENGINE_STATIC_CHECK_RESULT.md`
- `docs/WORKER_ROUTE_STATIC_CHECK_RESULT.md`

---

## 3. How to Run

Run each script from the repo root with no arguments:

```
node scripts/belief-engine-static-check.mjs
```

```
node scripts/worker-route-static-check.mjs
```

No environment variables. No gates. Node 18 or later required (`fs/promises`).

---

## 4. Safety

| Property | Value |
|---|---|
| File access | Local reads only |
| Network calls | None |
| Production calls | None |
| D1 / Wrangler | Not used |
| Mutations | None — both scripts are entirely read-only |
| Admin token | Not required |

Both scripts are safe to run before or after any local change at any time.

---

## 5. When to Run Belief Engine Static Check

Run `scripts/belief-engine-static-check.mjs` before and after:

- Any change to Belief Engine scoring logic, dimension weights, or `CHOICE_SCALE`.
- Any change to contradiction rules or result UI in the Belief Engine.
- Any change to `public/apps/humanx-belief-engine/humanx-bridge.js`.
- Any change to the `isFullBeliefProfile` Drift classification function in
  `public/app-v10.js`.
- Any file move, rename, or route/link change involving the Belief Engine path
  (`/apps/humanx-belief-engine/`).

All 24 hard checks must pass both before and after the change.

---

## 6. When to Run Worker Route Static Check

Run `scripts/worker-route-static-check.mjs` before and after:

- Any Worker route addition, removal, or rename in `src/worker.js`.
- Any update to `docs/API_ENDPOINT_INVENTORY.md`.
- Any update to `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`.
- Any Worker modular split planning or implementation step that moves route handling to a
  new module.

All 35 hard checks must pass both before and after the change.

---

## 7. What These Checks Do Not Prove

- **Live deployment** — local files only are read; the scripts do not confirm that the
  deployed Worker or frontend matches local state.
- **Endpoint behaviour** — rate limits, auth enforcement, and response shapes are not
  exercised.
- **D1 schema correctness** — no database is queried.
- **Write endpoint behaviour** — no POST/PUT/DELETE requests are made.
- **Frontend mobile layout** — no viewport or CSS check is performed.
- **Manual user flow** — no browser interaction is simulated.
- **Belief Engine questionnaire completion or scoring correctness** — no frontend
  JavaScript is executed and no profiles are generated or compared.

---

## 8. Relationship to Smoke Tests

Static checks are local guardrails. They confirm that structural markers, route strings,
and documentation are aligned. They do not test live behaviour.

- **Read endpoint smoke test** (`scripts/read-endpoint-smoke-test.mjs`) — checks live
  read APIs against a running deployment.
- **Write endpoint smoke test** (`scripts/write-endpoint-smoke-test.mjs`) — mutates
  production data and requires explicit approval before each run.
- **Manual frontend QA** — still required after any UI change; static checks do not
  replace browser-based testing.

Run static checks first; they are instantaneous and safe. Escalate to smoke tests only
when live behaviour needs verification.

---

## 9. Stop Conditions

Stop work and investigate before continuing if any of the following occur:

- **Any FAIL** — a marker or route string the script expected to find is absent.
- **Unexpected WARN** — any warning that was not present on the prior known-good run.
- **Missing file** — a file the script expected to read is absent from disk.
- **Missing route or profile marker** — a Worker route or Belief Engine marker string is
  no longer found in the expected file.
- **Route mismatch** — a route present in `src/worker.js` is absent from
  `docs/API_ENDPOINT_INVENTORY.md`, or vice versa.
- **Provider or API secret marker appears** — any `sk-ant-`, `sk-proj-`,
  `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `Bearer `, `api.anthropic.com`, or
  `api.openai.com` string found in the Belief Engine frontend HTML; stop, do not commit,
  investigate the source.
- **Proposed fix requires D1 or Wrangler** — static check failures are always local file
  issues; if a fix seems to require running Wrangler or touching D1, stop and
  re-evaluate.
