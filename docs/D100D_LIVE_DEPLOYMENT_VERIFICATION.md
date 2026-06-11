# D-100D — Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `08fa3cb` — D-100B clarify Study verdict and scores |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `d3ae3a01-ab61-41a0-bbbb-b1fe6d924a40` |
| **Wrangler version** | 4.99.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 15 files from `public/` |
| **Assets uploaded** | 1 — `/app-v10.js` (12 assets already uploaded) |
| **D1 binding** | Present in wrangler.toml — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

> Note: D-100B was committed directly to `main` (`08fa3cb`), not via a feature-branch PR. It is on origin/main and was deployed from there.

---

## Deployed Feature (D-100B)

**Study / Claim verdict & score clarity.**

Frontend-only change (display text / CSS / tooltips):

| Change | Description |
|---|---|
| Study verdict qualifier | Added below the Study header meters: "Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty." (`.study-verdict-qualifier`, muted/10px) |
| Meter tooltips | `meter()` now emits a per-meter `title`: Evidence → "submitted support quality and quantity"; Testability → "how directly the claim can be checked"; Survivability → "how well the claim holds under pressure" |
| helperText reinforcement | arena/study side panel now includes "Verdicts are pressure-test labels, not automatic truth rulings." |
| Verdict logic / colours | Unchanged — `cls()` mapping intact, no recolour, no name change |
| Score logic | Unchanged — `meter()` value/bar identical; tooltip text only |

No backend routes changed. No schema changed. No D1 migration run. No moderation logic changed.

---

## Live Verification

Confirmed by user after deploy:

| Expected live behavior | Observed |
|---|---|
| Study header shows the verdict/score qualifier line | ✅ confirmed |
| Evidence/Testability/Survivability meters still show values normally | ✅ confirmed |
| Meter tooltips explain Evidence / Testability / Survivability | ✅ confirmed |
| Arena/Study helper text includes "Verdicts are pressure-test labels, not automatic truth rulings." | ✅ confirmed |
| Verdict colours / names unchanged | ✅ confirmed |

---

## Safety Confirmation (this record task)

| Safety check | Status |
|---|---|
| No D1 migration run | ✅ confirmed |
| No database mutation during this record task | ✅ confirmed |
| No admin token used | ✅ confirmed |
| No admin/moderation action during this record task | ✅ confirmed |
| No claim approved/rejected/archived | ✅ confirmed |
| No score/verdict logic change | ✅ confirmed |
| No schema change | ✅ confirmed |
| No backend/Worker code change | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `08fa3cb`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **324 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. This rule is unchanged by D-100B/D and applies to every future task.
