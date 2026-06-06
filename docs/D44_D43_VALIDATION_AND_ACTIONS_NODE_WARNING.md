# D-44: D-43 Validation and GitHub Actions Node 20 Warning Audit

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes.

---

## Part 1 — D-43 Live Validation

D-43 (`975129a`, pushed to `main`) introduced evidence review item support in the admin
Review UI. After push, Cloudflare Workers deployed automatically. The following validation
was performed:

### Read Smoke CI — HumanX Read Smoke workflow

**Result: ✅ Green (all endpoint groups passed)**

The `HumanX Read Smoke` workflow was triggered manually on `main` after D-43 push.
All 8 endpoint groups passed. Exit 0. Duration ~15 s. No regressions.

### Live endpoint sanity

| Check | Result |
|-------|--------|
| Home (`/`) — app loads | ✅ Green |
| Claims tab — public claims list | ✅ Green |
| Evidence Vault — vault search | ✅ Green |
| RunPack on a public claim | ✅ Green |
| Admin Review queue (evidence items render with purple badge, correct title, inspect panel shows evidence fields, duplicate controls hidden) | ✅ Green |

### Static checks at D-43 merge

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | exit 0 |
| `node --check src/worker.js` | exit 0 |
| `hardening-smoke-test.mjs` | **110 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed** |

No regressions. Baseline is now **110 / 24 / 39**.

---

## Part 2 — GitHub Actions Node 20 Warning Audit

### Warning annotation text (verbatim summary)

> Node.js 20 actions are deprecated. The following actions are running on Node.js 20:
> `actions/checkout@v4`, `actions/setup-node@v4`. Please update your actions to use
> Node.js 24. Refer to
> https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsuses
> for steps to update your workflow. For guidance on how to update actions, visit
> https://github.blog/changelog/2025-01-17-github-actions-action-authors-migrate-to-node-js-24/.
> You can also use `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` as an environment variable
> to force JavaScript actions to run with Node.js 24 in your workflow until the actions
> are updated.

### Root cause

The `.github/workflows/read-smoke.yml` workflow already specifies `node-version: '24'`
(updated in D-34). This controls the Node version used for the `run:` script step —
`node scripts/read-endpoint-smoke-test.mjs` runs under Node 24. ✅

However, `actions/checkout@v4` and `actions/setup-node@v4` each ship their own internal
JavaScript action runner bundle. These bundles are compiled and distributed as Node 20
artifacts by their respective maintainers (GitHub and the actions team). They run on
Node 20 regardless of the `node-version` specified in the `with:` block — that setting
only affects the Node version installed for `run:` steps, not the action wrapper itself.

**In short:** the workflow script is already on Node 24; the warning is about the action
wrappers bundled inside `checkout@v4` and `setup-node@v4`, which are outside our control.

### Current status

- **Non-blocking.** The warning is an annotation, not a failure. The workflow passes.
- **Deadline.** GitHub announced actions will be _forced_ to Node 24 on
  **June 16, 2026**, and Node 20 removed from the runner on **September 16, 2026**
  (per D-33/D-34). Once forced, the annotation disappears or becomes an error depending
  on runner version.
- **Today's date: 2026-06-06.** We are 10 days from the forced-cutover date. The
  workflow continues to pass during this window.

### Options

| Option | Effort | Risk | Notes |
|--------|--------|------|-------|
| **A — Leave as-is** | None | Low (pre-deadline) | Annotation remains. Workflow passes. Safe until June 16 forced cutover. After cutover the runner may force Node 24 itself anyway, making the warning disappear automatically. |
| **B — Add `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` env var** | Minimal (1 line) | Very low | Tells the runner to execute action wrappers under Node 24 now. Suppresses the annotation immediately. GitHub explicitly recommends this as interim fix. No breaking risk — `checkout@v4` and `setup-node@v4` are Node 24-compatible. |
| **C — Upgrade to `actions/checkout@v5` / `actions/setup-node@v5`** | Low | Low | Correct long-term fix once v5 releases with Node 24 wrappers. Not yet available as of this writing — watch github/actions releases. |

### Recommendation

**D-45: Add `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` to the workflow env block.**

This is Option B — the one-liner GitHub recommends. It is safe, immediate, and suppresses
the annotation without touching any script logic, D1, Worker, or frontend. It should be
committed directly to main (CI-only change, same policy as D-34).

After D-45 merges, trigger `HumanX Read Smoke` manually to confirm green result with the
annotation gone. If `checkout@v5` / `setup-node@v5` become available later, a subsequent
D-46 can upgrade the action versions and drop the env var.

No emergency. The workflow passes today. D-45 can be done in the next convenient session.

---

## D-44 Completion Record

| Item | Status |
|------|--------|
| D-43 live validation — Home / Claims / Vault / RunPack green | ✅ Confirmed |
| D-43 Read Smoke CI green | ✅ Confirmed |
| D-43 static checks 110/24/39 confirmed | ✅ Confirmed |
| Actions Node 20 warning root cause identified | ✅ Done |
| Risk assessed (non-blocking, deadline June 16) | ✅ Done |
| D-45 recommendation documented (FORCE env var) | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
