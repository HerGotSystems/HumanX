# HumanX Docs Index

Quick reference for all documentation in this folder.
Read the relevant file before starting any task that touches the area it covers.

---

## ⚠ Standing Warnings

These apply to every task in this repo unless the user explicitly overrides them.

| Warning | Detail |
|---|---|
| **Active Worker entrypoint** | `src/worker.js` — do not remove or rename without a deployment change |
| **Active frontend** | `public/index.html`, `public/app-v10.js`, `public/styles.css` — response shape changes will break these silently |
| **Belief Engine** | `public/apps/humanx-belief-engine/index.html` — standalone app, navigated to by hard redirect from the main frontend |
| **Do not rerun migration 0004** | `migrations/0004_unique_normalized_content.sql` is already applied to production D1. Running it again will fail. |
| **Do not rerun migration 0005** | `migrations/0005_add_home_tests_updated_at.sql` was applied manually via Cloudflare D1 console. Do not rerun it unless the target database is known to be missing `home_tests.updated_at`. |
| **Do not run Wrangler or D1 commands** | `wrangler d1 execute`, `wrangler deploy`, and all variants are off-limits unless the user explicitly requests them in the task. |
| **Keep tasks small and branch-based** | One branch per task. Show diff before committing. Stop after commit — do not push. The user pushes and merges manually. |

---

## Known-good checks

Run these locally before and after any change. All must pass with exit 0.

```sh
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

Expected results:

| Script | Expected |
|---|---|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `416 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `56 passed, 0 failed (56 hard checks)` |

**Note:** A `MODULE_TYPELESS_PACKAGE_JSON` warning may appear during `hardening-smoke-test.mjs`. This is non-blocking and does not affect the pass count.

**Caution: live write smoke tests require explicit per-session user approval before running.** Do not run them routinely.

---

## 1. Current Status / Baseline

Read these first when starting a new session or returning after time away.

### `D125G_MOBILE_LAYOUT_AUDIT.md` ⭐ CURRENT — D-125 CHAIN COMPLETE
Mobile layout stress audit (Cycle 6). One CSS patch: `#radar-canvas` in Belief Engine `index.html` — added `max-width:100%;height:auto` to prevent 360px canvas overflowing 342px content width at 390px viewport. All other surfaces (nav tabs, card grids, review admin bar, study/vault/truths grids, RunPack actions) verified responsive at 390px and 768px. No stop conditions. Three non-blocking notes (constellation 2-col at 390px, quiz resp-dot tap size, `/api/health` vs `/api/graph-status` doc discrepancy). Verdict: **PATCHED**. Checks: 24/24 static, syntax OK, 416/416 smoke. **D-125 chain is complete. No D-125H needed.**
**Read when:** checking D-125G mobile audit results or confirming D-125 chain status.

### `D125F_PUBLIC_BROWSING_AUDIT.md` — CYCLE 5 COMPLETE
Public content browsing audit (Cycle 5). No patches needed. All public-list routes filter `COALESCE(review_state,'public')='public'` (claims, truths, evidence). Belief snapshots scoped to `user_id`. "Public means visible, not proven" framing in truths page and both verdict-qualifier surfaces. Source links: `safeHttpUrl()` blocks non-http/https URLs; `rel="noopener noreferrer"` on valid links. Admin UI gated at both client (`!!adminToken()`) and server (`requireAdmin()`). RunPack blocked for non-public claims. Three non-blocking notes: `/api/health` vs `/api/graph-status` discrepancy in D-125A docs, reused evidence source label can be dense. Verdict: **PASS**. Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** starting D-125G (mobile layout stress) or reviewing public browsing audit results.

### `D125E_CLAIM_REVIEW_AUDIT.md` — CYCLE 4 COMPLETE
Claim submission and Review audit (Cycle 4). No patches needed. Verdict: **PASS**. Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** reviewing submission/Review audit results.

### `D125D_DRIFT_SAVED_RESULTS_AUDIT.md` — CYCLE 3 COMPLETE
Drift and saved-results audit (Cycle 3). One patch: drift verdict badge `cls(verdict)` → `b-yellow`. Verdict: **PATCHED**. Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** reviewing Drift audit results.

### `D125A_OWNER_TESTER_HARDENING_PLAN.md` — ACTIVE TESTING POSTURE
Owner-as-tester product hardening plan. Six cycles, six personas. Cycles 1–5 complete (D-125B/C/D/E/F). Next: D-125G cycle 6 (mobile layout stress).
**Read when:** starting any owner-testing session or planning the final hardening task (D-125G).

### `D124N_FIRST_TESTER_INVITE_PACK.md` ⭐ SEND THIS TO TESTERS
First guarded tester invite pack for Belief Engine v2. Contains: short and long invite messages (canonical URL only), tester instructions (BE flow, Send to HumanX, saved-results, Clear, Start Over, mobile), 10 feedback questions, owner rules (max 1–3 trusted testers, no admin token, no Worker URL), per-tester feedback capture template with severity guide, stop conditions (framing/privacy/mobile failures), and next-step trigger for D-124O triage. Invite max 1–3 trusted testers. Do not share link publicly.
**Read when:** ready to send tester invites; resume after first-wave feedback to plan D-124O triage.

### `D124M_POSTDEPLOY_OWNER_SMOKE.md` ⭐ DEPLOY VERIFIED — PASS WITH NOTES
Post-deploy owner smoke checkpoint for the D-124 Belief Engine tester-check. Deployed version `ff886046-714a-4756-92b4-ddaa2908959b`. Owner confirmed: production loads, D1 live, Belief Engine result renders, Drift captures two full profiles with comparison delta, mobile fresh flow works, mobile-created claim reaches Review queue, admin view operational. Two notes: (N1) admin screenshots must not be shared publicly; (N2) incognito no-token Review gate check still needed before inviting external testers. Verdict: **PASS WITH NOTES**. Next: D-124N first tester invite after N2 check.
**Read when:** checking post-deploy status or starting tester invite planning.

### `D124L_OWNER_BROWSER_CHECKLIST.md` ⭐ RUN THIS BEFORE INVITING TESTERS
Practical step-by-step browser checklist for the owner to verify the live site after an explicit deploy decision. Covers: production health, Home card copy, Belief Engine intro/flow, timeline local-data note, saved-result / Clear / Start Over, Send-to-HumanX note, mobile 390px + 768px, public content, Review admin-gate, and a fill-in-the-blank PASS / BLOCKED final judgement. Run in a normal browser window then repeat mobile steps on a phone or DevTools responsive mode.
**Read when:** ready to run the manual deploy check before sending tester invites.

### `D124I_BELIEF_ENGINE_PRE_TESTER_READINESS_AUDIT.md` ⭐ BELIEF ENGINE CURRENT STATE
Pre-tester readiness audit after D-124B–H upgrade chain. Verdict: **READY WITH NOTES**. All automated checks pass (24/24 static, syntax OK, 416/416 smoke). Privacy boundaries confirmed complete across all five surfaces. Saved-result paths deterministic after D-124G. One stale doc cell corrected (BELIEF_ENGINE_TEST_PLAN.md `engineVersion`). Remaining pre-invite items: run `D124L_OWNER_BROWSER_CHECKLIST.md` against live site after deploy.
**Read when:** starting any Belief Engine session or planning tester invite. See `D123A_TESTER_LAUNCH_PACK.md` for the full pre-invite owner checklist.

### `D121A_PRE_TESTER_LAUNCH_CHECKPOINT.md` ⭐ START HERE (overall product state)
Consolidation checkpoint after the D-115→D-120 planning/checkpoint run. Records HumanX as a working public beta / early MVP, not a finished product; consolidates D-115A through D-120A; confirms D-116B, D-117B, and D-118B are not started; sets the safest next task as **D-117B — read-only normal-user QA browsing run**; preserves exact authorisation phrases and standing no-Wrangler/no-D1/no-admin-token/no-mutation rules. **Note:** for Belief Engine readiness specifically, D-124I supersedes this document.
**Read when:** opening any new session — start here for overall product state. For Belief Engine state, read D-124I instead.

### `D115A_POST_POLISH_PRODUCT_READINESS_CHECKPOINT.md`
Product-readiness checkpoint after the D-111→D-114 public/mobile UX polish increment. Freezes repo input `bf53c97`, deployed Worker `3fe7ab7f-b603-407b-b7b8-31111956a3ea`, and static baseline **416/24/56**. Verdict: HumanX is a working public beta / early MVP, not a finished product. Summarises beta-ready areas (public browsing, claim submission, evidence/pressure/tests, Truths, Review, mobile UX), launch blockers (post-D-114 journey proof, read-only D1/data-quality audit, abuse/rate-limit/account decisions, Belief Engine onboarding, docs checkpoint chain), do-not-regress rules, and the safest next priorities: D-116 read-only D1/data audit plan, D-117 normal-user journey QA, D-118 moderator/admin journey QA, D-119 Belief Engine onboarding pass, D-120 abuse/rate-limit/account audit.
**Read when:** checking the product-readiness baseline after D-111→D-114.

### `D110A_POST_SECURITY_PUBLIC_TRUST_RELEASE_CHECKPOINT.md`
Security/public-trust checkpoint after the full D-103→D-109 evidence/source-safety, admin-hardening, and orphan-cleanup arcs. Repo HEAD `50abf03`, deployed Worker `adb94a83`, static baseline **375/24/56**, served frontend `app-v10.js` only (asset count 8). Summarises D-103 (quality tiers, "weak argument", "no source provided"), D-104 (source `href` http/https-only render + `httpUrlOrNull` storage), D-106 (`.gitignore`, `/api/debug` admin-gate, `safeEqual` fail-closed), D-107 (Review inspect via shared `sourceLink`), D-108 (source-safety regression: no patch needed), D-109 (orphan bundle removal). Records live guarantees, deferred items (token rotation; no D1 cleanup; no verification badges/blocklists/auth system), and the **do-not-regress rules** (never raw `source_url`→href; all render via `sourceLink`/`safeHttpUrl`; all storage via `httpUrlOrNull`; never re-add app-v3..v9; keep `/api/debug` gated; never commit secrets; never paste the admin token).
**Read when:** checking the D-103→D-109 security/source/admin-hardening baseline.
