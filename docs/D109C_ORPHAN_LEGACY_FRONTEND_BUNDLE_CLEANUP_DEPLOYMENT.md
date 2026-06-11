# D-109C — Orphan Legacy Frontend Bundle Cleanup: Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no token rotation, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `8f48d22` — Merge pull request #128 from HerGotSystems/cleanup/d109b-remove-orphan-frontend-bundles |
| **Feature commit** | `38dba24` — D-109B remove orphan legacy frontend bundles |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `adb94a83-5f42-4c2f-85b6-c640dbc72265` |
| **Wrangler version** | 4.100.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | **8 files** from `public/` (down from 15 — the 7 removed bundles are gone from the asset set) |
| **Assets uploaded** | None — no updated asset files (deletions reflected in the read set; `app-v10.js` unchanged) |
| **D1 binding** | Present — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

> The asset count dropping 15 → 8 confirms the 7 orphan bundles (`app-v3.js`–`app-v9.js`) are no longer part of the deployed asset set.

---

## Deployed Change (D-109B)

**Removal of orphaned legacy frontend bundles.**

| Change | Description |
|---|---|
| Removed | `public/app-v3.js`–`public/app-v9.js` (7 orphaned bundles, loaded by no served HTML) |
| Kept | `public/app-v10.js` — the single served frontend bundle |
| Corrected | `PROJECT_INDEX.md` stale references (app-v9 → app-v10) |
| Guards | Hardening Section 50 (index loads app-v10; orphans absent; no served-HTML ref to v3–v9) |

No runtime `app-v10.js` behavior change. No backend/Worker/schema change. No D1 migration. No token rotation.

---

## Live Verification

Confirmed by user after deploy:

| Expected live behavior | Observed |
|---|---|
| Served app still loads `public/app-v10.js` | ✅ confirmed |
| Legacy `app-v3.js`–`app-v9.js` removed from the asset upload set | ✅ confirmed (assets read 15 → 8) |
| No served HTML references app-v3..v9 | ✅ confirmed |
| Old unsafe source-rendering patterns in orphan bundles no longer in deployed assets | ✅ confirmed |
| Current source-safety chain intact | ✅ confirmed |
| No backend/Worker/schema behavior changed | ✅ confirmed |
| No token rotation performed | ✅ confirmed |

---

## Safety Confirmation (this record task)

| Safety check | Status |
|---|---|
| No D1 migration run | ✅ confirmed |
| No database mutation during this record task | ✅ confirmed |
| No admin token used | ✅ confirmed |
| No token rotation performed | ✅ confirmed |
| No admin/moderation action during this record task | ✅ confirmed |
| No schema change | ✅ confirmed |
| No backend/Worker code change | ✅ confirmed |
| No runtime frontend behavior change (`app-v10.js` untouched) | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |
| Rollback available | ✅ removed bundles preserved in git history |

---

## Static Checks at Verification (main HEAD `8f48d22`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **375 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. `HUMANX_ADMIN_TOKEN` rotation remains a recommended but unscheduled operator follow-up (D-106A). This rule is unchanged by D-109B/C.
