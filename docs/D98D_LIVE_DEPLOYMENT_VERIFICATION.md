# D-98D — Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `33626ac` — Merge pull request #120 from HerGotSystems/feat/d98b-public-onboarding-terminology |
| **Feature commit** | `660e1d6` — D-98B clarify public onboarding terminology |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `9f8c2821-3744-4adf-af49-6d1e476b7a0d` |
| **Wrangler version** | 4.99.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 15 files from `public/` |
| **Assets uploaded** | None — no updated asset files to upload (content already current on the edge) |
| **D1 binding** | Present in wrangler.toml — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

> Note: "No updated asset files to upload" means the deployed asset hashes already matched. The D-98B display-text/CSS changes were part of the bundle published with this Worker version.

---

## Deployed Feature (D-98B)

**Public onboarding terminology clarity.**

Frontend-only change merged from PR #120:

| Change | Description |
|---|---|
| Unified Truth→Claim wording | All public copy now reads "Pressure-test as Claim"; "Send to Claim Review" removed (3 display-text replacements in `helperText` drift/truths branches + Drift profile button) |
| Verdict-label qualifier | Added beside the searchbar verdict filter: "Verdicts are pressure-test labels, not automatic truth rulings." (`.verdict-qualifier` CSS, muted/10px) |
| Preserved trust framing | Hero "it does not decide what is true", noscript "does not automatically decide what is true", Belief Engine "not diagnoses"/"pressure-tendency"/"No religion assigned", submit "not an automatic verdict" — all unchanged and now regression-locked |

No backend routes changed. No schema changed. No D1 migration run. No moderation logic changed. Internal function names and API routes (`/api/truth-to-claim`) untouched — display text only.

---

## Live Verification

Confirmed by user after deploy:

| Expected live behavior | Observed |
|---|---|
| "Send to Claim Review" is gone | ✅ confirmed |
| Truth / Drift action says "Pressure-test as Claim" | ✅ confirmed |
| Search/filter area shows "Verdicts are pressure-test labels, not automatic truth rulings." | ✅ confirmed |
| Hero still says HumanX does not decide what is true | ✅ confirmed |
| Belief Engine still says profiles are not diagnoses / pressure-tendency estimates | ✅ confirmed |

User confirmation: **deployment completed, checks ok.**

---

## Safety Confirmation (this record task)

| Safety check | Status |
|---|---|
| No D1 migration run | ✅ confirmed |
| No database mutation during this record task | ✅ confirmed |
| No admin token used | ✅ confirmed |
| No admin/moderation action during this record task | ✅ confirmed |
| No claim approved/rejected/archived | ✅ confirmed |
| No Truth archived/converted | ✅ confirmed |
| No bulk cleanup | ✅ confirmed |
| No schema change | ✅ confirmed |
| No backend/Worker code change | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `33626ac`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **312 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. This rule is unchanged by D-98B/D and applies to every future task.
