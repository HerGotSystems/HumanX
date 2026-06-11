# D-111D — Submit Trust Framing: Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no token rotation, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `26acb56` — Merge pull request #129 from HerGotSystems/ux/d111b-submit-trust-framing |
| **Feature commit** | `e9dfce6` — D-111B surface submit trust framing |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `f089e116-bde7-4735-8e14-b16e1c50c436` |
| **Wrangler version** | 4.100.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 8 files from `public/` |
| **Assets uploaded** | 2 — `/styles.css`, `/app-v10.js` |
| **D1 binding** | Present — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

---

## Deployed Change (D-111B)

**Submit-panel trust framing surfaced in the visible main column.**

| Change | Description |
|---|---|
| Submit main panel | Now shows the visible note: "Scores reflect submitted evidence — not an automatic verdict." (after the intro, before writing tips) |
| `.submit-trust-note` CSS | Muted, italic, 11px, compact — readable on desktop and mobile |
| Fix rationale | The line previously lived only in the submit-mode `helperText()` injected into the side dock, which is `display:none` in submit mode — so it never displayed. Now surfaced where submitters read it. |

No submit form fields changed. No claim submission/API behavior change. No backend/Worker/schema change. No token rotation.

---

## Live Verification

Confirmed by user after deploy:

| Expected live behavior | Observed |
|---|---|
| Submit page shows visible trust note "Scores reflect submitted evidence — not an automatic verdict." | ✅ confirmed |
| Note appears in the visible submit main panel (not only hidden helperText/side dock) | ✅ confirmed |
| Existing home / Study / Truths trust framing intact | ✅ confirmed |
| Submit form fields and writing tips unchanged | ✅ confirmed |
| No backend/Worker/API behavior changed | ✅ confirmed |
| No source verification/trusted wording added | ✅ confirmed |
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
| No claim submission behavior change | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `26acb56`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **383 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |

---

## Trust-Framing Coverage (now complete across public surfaces)

| Surface | Framing |
|---|---|
| Home | hero "HumanX organises what people assert — it does not decide what is true" |
| Submit | **"Scores reflect submitted evidence — not an automatic verdict." (D-111B, now visible)** |
| Arena (browse) | searchbar "Verdicts are pressure-test labels, not automatic truth rulings" (D-98B) |
| Study | "Verdict is a pressure-test label, not an automatic truth ruling." (D-100B) |
| Truths | "Public means visible, not proven." (D-92C/D-97B) |

The submit surface was the last public page missing the framing; D-111B closes that gap.

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. `HUMANX_ADMIN_TOKEN` rotation remains a recommended but unscheduled operator follow-up (D-106A). This rule is unchanged by D-111B/D.
