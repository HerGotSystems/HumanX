# D-113C — Home Mobile Card Density: Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no token rotation, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `5aaa132` — Merge pull request #131 from HerGotSystems/ux/d113b-home-mobile-card-density |
| **Feature commit** | `972adc8` — D-113B compress Home action cards on mobile |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `c0cbe389-49f4-4a97-9e74-c1b49c2815df` |
| **Wrangler version** | 4.100.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 8 files from `public/` |
| **Assets uploaded** | 1 — `/styles.css` (CSS-only change; `app-v10.js` unchanged, not re-uploaded) |
| **D1 binding** | Present — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

> Only `/styles.css` uploaded — consistent with a CSS-only patch (no JS change).

---

## Deployed Change (D-113B)

**Home action-card mobile density compression — CSS only.**

| Change | Description |
|---|---|
| Mobile rule | `@media(max-width:600px){ … .cc-card-when{display:none} }` hides the secondary italic "When:" guidance line on Home cards at phone widths |
| Source text | Unchanged — the "When:" text remains in `renderHome` (`app-v10.js`); only visually hidden on phones |
| Desktop/tablet | Unchanged — "When:" guidance still shown |
| Cards | All 7 Home action cards remain; titles + descriptions unaffected |
| Deferred | Truths form-above-list collapse (D-113A C.2) deliberately not in this patch |

No backend/Worker/API behavior change. No schema change. No D1 migration. No token rotation. No JS change.

---

## Live Verification

Confirmed by user after deploy:

| Expected live behavior | Observed |
|---|---|
| On phones ≤600px, Home cards no longer show the secondary "When:" line | ✅ confirmed |
| Home card titles and descriptions remain visible | ✅ confirmed |
| All 7 Home cards remain | ✅ confirmed |
| Desktop/tablet still show the "When:" guidance | ✅ confirmed |
| Truths form unchanged | ✅ confirmed |
| Submit trust note remains visible | ✅ confirmed |
| Mobile tab edge cue + active-tab scroll remain | ✅ confirmed |
| Source/admin hardening preserved | ✅ confirmed |
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
| No JS change (CSS-only patch) | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `5aaa132`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **403 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
| `node --check public/app-v10.js` | **OK** |

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. `HUMANX_ADMIN_TOKEN` rotation remains a recommended but unscheduled operator follow-up (D-106A). The Truths form-above-list density change (D-113A C.2) remains a deferred, separate decision. This rule set is unchanged by D-113B/C.
