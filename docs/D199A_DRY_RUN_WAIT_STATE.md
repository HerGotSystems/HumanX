# D-199A — Dry-Run Wait State + Post-Run Intake

**Date:** 2026-06-28
**HEAD at creation:** `45bb140`
**Status:** Waiting for owner dry-run result

---

## Current State

The preview launch docs, checklists, runbooks, and scripts are complete. No further code or docs are needed before the dry run unless the dry run surfaces issues.

**The next human action is: run the dry run.**

---

## What to Do Right Now

Open this doc and follow it:

```
docs/D198A_OWNER_DRY_RUN_COMMAND_PACK.md
```

It contains the exact terminal commands, a 14-item browser checklist, and the result block to fill in. Budget 45–65 minutes.

---

## Result Block to Paste Back

After the dry run, paste this filled-in block into the conversation:

```
Dry-run result:
HEAD:           [commit hash]
Preflight:      [22/22 PASS | X/22 — list failures]
Smoke:          [1589/0 | skip]
Deploy:         [yes / no]
Home:           [PASS / FAIL]
Claims:         [PASS / FAIL]
Study:          [PASS / FAIL]
Copy link:      [PASS / FAIL]
Direct /c/:id:  [PASS / FAIL]
Evidence:       [PASS / FAIL]
Pressure:       [PASS / FAIL]
Test:           [PASS / FAIL]
Submit claim:   [PASS / FAIL]
My HumanX:      [PASS / FAIL]
RunPack:        [PASS / FAIL]
Review:         [PASS / FAIL]
Mobile:         [PASS / FAIL]
Console errors: [none | list]
Issues found:   [none | P0: X, P1: X, P2: X, P3: X — one-line summaries]
Decision:       [PASS / CONDITIONAL PASS / FAIL]
```

---

## What NOT to Include in the Paste

- Admin token value
- Owner secret value
- Raw request headers (`x-humanx-admin`, `x-humanx-owner`)
- Screenshots that contain any of the above (crop or blur before attaching)

Describe any issues in plain text — no credentials needed to diagnose them.

---

## What Happens After the Result Comes Back

| Decision | Next step |
|----------|-----------|
| **PASS** | Batch 1 invite prep — send using `docs/D191B_PREVIEW_USER_INVITE_PACK.md` messages |
| **CONDITIONAL PASS** | D-199B: fix named items, re-run affected steps, then send |
| **FAIL** | D-199B: resolve P0/P1 blockers, re-run full dry run, confirm pass before inviting anyone |

In all cases: run `node scripts/preview-launch-check.mjs` one final time immediately before sending the first invite.

---

## Complete Preview Launch Doc Index

For reference — all docs needed to launch are in place:

| Doc | Purpose |
|-----|---------|
| `docs/D198A_OWNER_DRY_RUN_COMMAND_PACK.md` | **Start here** — single-page dry-run command pack |
| `docs/D197A_OWNER_DRY_RUN_EXECUTION_CHECKLIST.md` | Full 15-step dry-run detail |
| `docs/D197B_DRY_RUN_RESULT_TEMPLATE.md` | Per-issue intake format and triage rules |
| `docs/D195A_PREVIEW_DEPLOYMENT_SANITY_CHECKLIST.md` | Deployment sanity — run before each invite batch |
| `docs/D191B_PREVIEW_USER_INVITE_PACK.md` | Invite messages to send |
| `docs/D191C_PREVIEW_OPERATOR_RUNBOOK.md` | Full operator lifecycle during preview |
| `docs/D196A_PREVIEW_SEED_USER_BATCH_PLAN.md` | Batch 0 → 1 → 2 plan, who to invite, go/no-go criteria |
| `docs/D193A_PREVIEW_FEEDBACK_INGESTION_AUDIT.md` | Feedback triage workflow |
| `docs/D194A_PREVIEW_MODERATION_PRESSURE_AUDIT.md` | Review queue capacity and abuse scenarios |
| `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` | Full launch checklist with manual browser checks |
