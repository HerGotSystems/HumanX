# D-114C — Truths Mobile Form Density: Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no token rotation, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `c93bd3b` — Merge pull request #132 from HerGotSystems/ux/d114b-truths-mobile-form-density |
| **Feature commit** | `d0a8a54` — D-114B collapse Truths add form on mobile |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `3fe7ab7f-b603-407b-b7b8-31111956a3ea` |
| **Wrangler version** | 4.100.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 8 files from `public/` |
| **Assets uploaded** | 2 — `/styles.css`, `/app-v10.js` |
| **D1 binding** | Present — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

---

## Deployed Change (D-114B)

**Truths Add-a-Truth form collapsed on mobile, expanded on desktop.**

| Change | Description |
|---|---|
| Markup | Add form wrapped in `<details class="truth-add-details">` with summary "Add a public Truth"; collapsed by default (no `open`) |
| Phones (≤600px) | Form collapsed behind the summary → truth list rises toward the fold |
| Desktop/tablet (≥601px) | `@media(min-width:601px)` hides the summary and force-expands the form → unchanged from before |
| Preserved | field IDs (`truthStatement`/`truthCategory`/`truthOrigin`/`truthType`), `submitTruth()`, form-above-list ordering, empty-state "form above" copy, "Public means visible, not proven" framing |

No backend/Worker/API behavior change. No schema change. No D1 migration. No token rotation.

---

## Live Verification

Confirmed by user after deploy:

| Expected live behavior | Observed |
|---|---|
| On phones, Truths Add form appears collapsed under "Add a public Truth" | ✅ confirmed |
| Opening the details reveals the same fields + submit button | ✅ confirmed |
| On desktop/tablet, the form remains expanded, summary hidden | ✅ confirmed |
| Browsing Truths content appears sooner on phones | ✅ confirmed |
| Field IDs and `submitTruth()` unchanged | ✅ confirmed |
| Form remains above the list | ✅ confirmed |
| Empty-state "form above" copy remains valid | ✅ confirmed |
| "Public means visible, not proven" remains visible | ✅ confirmed |
| Submit trust note, mobile tab cue, active-tab scroll, Home mobile density, source/admin hardening preserved | ✅ confirmed |
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
| Submission behaviour unchanged | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `c93bd3b`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **416 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
| `node --check public/app-v10.js` | **OK** |

---

## Public-UX Increment Status (D-111 → D-114)

| Pass | Shipped |
|---|---|
| D-111B | Submit-panel trust note surfaced in visible main column |
| D-112B | Mobile tab edge fade cue + active-tab scroll-into-view |
| D-113B | Home action cards hide secondary "When:" line on phones |
| D-114B | Truths add-form collapsed on phones (expanded on desktop) |

With D-114C, the D-111→D-114 public mobile-UX polish increment is fully shipped, verified, and recorded. The Truths form-above-list density gap (the last open item from D-113A) is closed.

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. `HUMANX_ADMIN_TOKEN` rotation remains a recommended but unscheduled operator follow-up (D-106A). This rule is unchanged by D-114B/C.
