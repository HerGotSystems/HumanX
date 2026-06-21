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
| `hardening-smoke-test.mjs` | `827 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `56 passed, 0 failed (56 hard checks)` |

**Note:** A `MODULE_TYPELESS_PACKAGE_JSON` warning may appear during `hardening-smoke-test.mjs`. This is non-blocking and does not affect the pass count.

**Caution: live write smoke tests require explicit per-session user approval before running.** Do not run them routinely.

---

## 1. Current Status / Baseline

Read these first when starting a new session or returning after time away.

### `D140D_PUBLIC_PROFILE_CHECKPOINT.md` ⭐ CURRENT — PUBLIC PROFILE DEPLOYED + OWNER SMOKE PASS — READY FOR NEXT FEATURE
D-140A audit → D-140B profile settings foundation (migration 0013, `POST /api/my-humanx/profile-settings`, Profile Settings panel in Me with live preview) → D-140C public read-only profile (`GET /api/u/:slug`, `#/u/:slug` hash view). Owner confirmed: Profile Settings panel works (off by default, slug required only when public, save works), Copy share link uses `#/u/:slug` and correctly hides/disables when not public, private profile shows a friendly not-found state, public profile loads at `#/u/calenhir` with bio/counts/recent public truths-evidence-pressure, no email/user id/admin/owner-only controls visible, Home/Me/Truths/Review still work. Explicit opt-in only — `profile_public` defaults to 0 for every user; public route returns the identical 404 for private/not-found/invalid slugs; only public, non-archived content is ever exposed; evidence/pressure are summary-level only (no body/source_url); no belief data, no comments/social feed. Known limitation carried forward: `x-humanx-user` still unsigned/spoofable for owner settings, hash route only (no pretty `/u/slug` path yet), no selected snapshot sharing yet. Baseline: 827/24/56 (1 expected parameterised-route warning). Recommended next: D-141A — public profile polish / selected snapshot sharing audit.
**Read when:** starting new feature work or returning after time away.

### `D139C_BELIEF_MIRROR_CHECKPOINT.md` — D-139 BELIEF MIRROR (superseded by D-140D for current deploy)
D-139A audit → D-139B Belief Mirror v1 (widened `GET /api/my-humanx` belief_snapshots select + a fully client-side Belief Mirror panel inside Me — latest snapshot, recent drift, recurring categories, pressure/evidence balance, tensions from `contradictions_json`, fixed local question bank). Owner confirmed: Belief Mirror appears in Me between Belief Snapshots and Recent Truths, guardrail wording is visible and feels safe, all six cards render, existing Me controls (filters, show-all, archive, export) still work. No AI/API call anywhere — every card is arithmetic over already-stored data. No new route, no migration. Baseline: 781/24/56.
**Read when:** reviewing D-139 history.

### `D138D_USER_ARCHIVE_EXPORT_CHECKPOINT.md` — D-138 USER ARCHIVE/EXPORT (superseded by D-140D for current deploy)
D-138A audit → D-138B backend foundation (migration 0012, `POST /api/my-humanx/archive`, `GET /api/my-humanx/export`) → D-138C frontend archive/export controls (account-card Export button, per-row Archive action with confirmation modal). Owner confirmed: export downloads JSON, archive confirmation modal appears and clearly states the item is hidden not deleted, a protected item returns a clear protected toast, the rest of My HumanX remains usable. Soft-archive only — no `DELETE FROM`, no restore UI, belief-snapshot archive deferred (no backend endpoint yet). Baseline: 763/24/56.
**Read when:** reviewing D-138 history.

### `D137F_MY_HUMANX_CHECKPOINT.md` — D-137 MY HUMANX DASHBOARD (superseded by D-139C for current deploy)
D-137A audit → D-137B backend (`GET /api/my-humanx`) → D-137C truth claimed-state clarity → D-137D My HumanX dashboard frontend → D-137E scan/polish pass (5-item caps with show-all/show-less, state filter, section reorder, badge-first row layout). Owner confirmed: Me tab works, verified account card visible, content counts visible, state filters work, recent claims/truths/evidence/pressure visible, belief snapshots visible, show all/show less works, public claim Study opens with correct Back-to-Me navigation, non-public items never open broken pages. Baseline: 724/24/56.
**Read when:** reviewing D-137 history.

### `D136E_INVITE_AUTH_CHECKPOINT.md` — D-136 INVITE AUTH (superseded by D-138D for current deploy)
D-136A audit → D-136B backend (migration 0010, `/api/me`, `/api/auth/invite/create`, `/api/auth/invite/redeem`) → D-136C public account panel + invite redeem → D-136D admin invite-code creator panel. Owner confirmed: admin creates invite code in Review, user redeems in account panel, panel shows VERIFIED with display name/email/handle, anonymous flow still works, no email sending (expected). Baseline: 655/24/56.
**Read when:** reviewing D-136 history.

### `D131A_OWNER_SMOKE_POST_D130.md` — D-131 OWNER SMOKE (superseded by D-136E for current deploy)
Owner confirmed production good after D-130 deploy. Admin Review, structured builder context, approve/keep/reject/mark-duplicate, queue anchor, public pages — all pass. Baseline: 498/24/56.
**Read when:** reviewing D-131 history.

### `D130E_REVIEW_PATH_HARDENING_CHECKPOINT.md` — D-130 HARDENING BASELINE
D-130A–D review-path hardening chain. Audit (no FAILs), review queue cap comment+tests, builder context `whyUserThinksThis` typo fix (backward-safe), review escaping regression tests. No schema/route/layout changes. Checks: syntax OK, 498/24/56 pass.
**Read when:** reviewing D-130 hardening history or test baseline.

### `D129G_ADMIN_REVIEW_ERGONOMICS_CHECKPOINT.md` — D-129 CHAIN COMPLETE (superseded by D-130E for current deploy)
D-129A–F Admin Review ergonomics chain merged. Anchor-after-moderation, deduplicated inspector action row, item-specific right context panel, compact inspector density, compact queue cards (ev/ts/sv scores, builder chip), always-visible filter overview strip. Frontend only — no backend/schema/D1 changes. Checks: syntax OK, 479/24/56 pass.
**Read when:** reviewing D-129 ergonomics history.

### `D128H_DEPLOY_CHECKLIST.md` — DEPLOY CHECKLIST (superseded by D-129G for current deploy)
Pre-deploy verification passed at `49571ac`. All 4 static checks green. D-128C/D/E/F chain confirmed merged. Checklist doc includes D1 state checks, deploy command, and 7-step owner smoke procedure. No runtime change in this task.
**Read when:** reviewing D-128 deploy history or D1 migration state.

### `D128F_REVIEW_UI_STRUCTURED_BUILDER_CONTEXT.md` — MERGED — REVIEW UI STRUCTURED-FIRST DISPLAY
Review inspect panel now prefers `item.claimBuilderContext` (structured, from D-128D API) over the legacy `parseClaimBuilderContext()` path. Both paths show a source badge (green `structured` / yellow `legacy parsed`). No backend change. No schema change. No deploy. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing the Review UI builder context display or planning the D-128H deploy.

### `D128E_FRONTEND_STRUCTURED_PAYLOAD.md` — MERGED — FRONTEND PAYLOAD
Frontend now sends structured `claim_builder` field alongside legacy `initialEvidence` sentinel. New `builderPayload()` helper maps `_bs` state to D-128C shape (`route`, `rawText`, `why`, `scope`, `falsifier`, `draftClaim`, `finalClaim`, `category`, `claimType`, `systemFlags`). Both `submitBuilderClaim()` and `submitBuilderTruth()` include it. `initialEvidence` sentinel kept for D-127D fallback compatibility. Non-builder `saveClaim()` unchanged. No Worker change. No Review UI change. No schema change. No deploy. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing frontend payload or planning D-128F Review UI.

### `D128D_REVIEW_API_BUILDER_CONTEXT.md` — MERGED
Review API now attaches optional structured `claimBuilderContext` to claim and truth rows in the admin-only `/api/review` response. New helpers: `safeJsonArray()`, `mapClaimBuilderContext()`, `attachClaimBuilderContexts()` in `src/claim-builder-contexts.js`. Per-row point-lookups (most recent context, `created_at DESC`); failures non-fatal. Public endpoints unchanged. D-127D legacy parser fallback untouched. No frontend payload change. No Review UI change. No schema/migration change. No deploy. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing Review API read path or planning D-128E/F.

### `D128C_WORKER_WRITE_PATH.md` — MERGED
Worker write path for structured Claim Builder context. New helper module `src/claim-builder-contexts.js` exports `cleanClaimBuilderContext()` (validates/clips, returns null if absent or invalid) and `insertClaimBuilderContext()` (inserts one `cbc_*` row). `/api/claims` POST writes context for new claims only (not existing/duplicate). `/api/truths` POST writes context for both new and repeated truths. `claim_builder_contexts` table is already live in production D1. Legacy D-127B/D-127D `initialEvidence` fallback untouched. No frontend payload change yet. No Review API/UI change yet. No deploy yet. Checks: syntax OK, 416/24/56 pass.
**Read when:** reviewing write-path implementation or planning D-128D/E/F.

### `D128H_MIGRATION_STATE_REPAIR_PLAN.md` — COMPLETED (migration unblocked, table live)
Migration-state repair plan after D1 audit revealed schema drift and migration replay failure. `wrangler d1 migrations apply` is blocked: `0003_full_schema.sql` attempts `CREATE UNIQUE INDEX idx_evidence_claim_links_unique` but 4 duplicate `(evidence_id, claim_id)` pairs exist in `evidence_claim_links`. No runtime code or live D1 changes made. Companion SQL draft `migrations/manual_repair_dedupe_evidence_claim_links.sql` provides audit, preview, dry-run DELETE, post-delete verification, and index creation queries. No live execution has occurred. Owner must review, approve backup, and authorise each step. `claim_builder_contexts` table still does not exist — D-128C blocked until migration unblocked.
**Read when:** planning migration repair, reviewing dedupe strategy, or resuming D-128C after migration is unblocked.

### `D128B_CLAIM_BUILDER_CONTEXT_MIGRATION_DRAFT.md` — MIGRATION DRAFT — NOT APPLIED (blocked by D-128H repair)
Draft SQL migration for `claim_builder_contexts` table (`migrations/0006_claim_builder_contexts.sql`). Adds 16-column table (target_type, target_id, route, version, raw_text, why, scope, falsifier, draft_claim, final_claim, category, claim_type, system_flags_json, timestamps) plus 3 indexes. Migration file exists in repo but has NOT been executed against production D1 — no live schema change. Next step (D-128C worker write-path) requires explicit owner approval to apply the migration first.
**Read when:** planning D-128C or reviewing migration before applying.

### `D128_STRUCTURED_BUILDER_PERSISTENCE_DESIGN.md` — MERGED (see D-128B for migration draft)
Design/spec for structured Claim Builder persistence. Recommends a dedicated `claim_builder_contexts` table to separate builder metadata (original text, why, scope, falsifier, flags, route) from the `initialEvidence` plain-text channel used in D-127B. Defines payload shape for both claim and truth routes, Review/public/RunPack visibility boundaries, and the migration strategy. Preserves D-127D plain-text parser as a legacy fallback for existing items. Docs/design only — no product code, backend, schema, D1, or deploy changes.
**Read when:** planning D-128B migration or reviewing builder persistence design.

### `D127F_TESTER_CLAIM_BUILDER_INVITE_PACK.md` — MERGED
Safe tester invite/update pack for the live Claim Builder release (D-126B + D-127B + D-127C + D-127D). Includes short and long invite messages (canonical URL only), tester instructions covering the full builder flow (Steps 1–3, Truth route, Review context), 10 feedback questions specific to the builder, per-tester capture template, stop conditions, and owner rules (no admin token, no Worker URL). Docs-only — no product code, backend, schema, D1, or Wrangler changes.
**Read when:** inviting or updating testers about the Claim Builder; planning D-127G feedback triage.

### `D127E_DEPLOY_SMOKE_CHECKPOINT.md` — DEPLOYED / OWNER SMOKE PASS
Deploy/smoke checkpoint for stacked D-126B + D-127B + D-127C + D-127D release. Pre-deploy checks passed (416/24/56, syntax OK) at HEAD `6ec6fae`. CC/CI Wrangler was blocked by VPN/proxy; owner manually deployed. Owner smoke result: **PASS** ("all works"). Live release covers D-126B polish (nav label, Review hint, friendly toasts), D-127B Claim Builder 3-step flow, D-127C Truth route save, D-127D Review builder context panel. Recommended next: D-127F tester-facing Claim Builder invite/update or D-128 structured builder persistence design.
**Read when:** checking release status or planning next task.

### `D127D_REVIEW_BUILDER_CONTEXT_VISIBILITY.md` — MERGED
Surfaces Claim Builder submission context in the Review inspect panel. `parseClaimBuilderContext()` parses the D-127B plain-text block from `initialEvidence`; `reviewBuilderContextHtml()` renders ORIGINAL USER TEXT, WHY, SCOPE, PRESSURE/FALSIFIER, and SYSTEM FLAGS as a blue-tinted panel. Injected into `renderReviewInspectPanel()` between quality hints and decision buttons. Review-only — no public page change. No backend/schema/D1/Wrangler/deploy changes. CSS: 6 new rules. All 416/24/56 checks pass. Deploy required (frontend assets).
**Read when:** reviewing builder context visibility in Review, or planning D-127E.

### `D127C_BUILDER_TRUTH_ROUTE_SAVE.md` — MERGED (see D-127D for Review context)
Wires up the Truth route save in the Claim Builder. `submitBuilderTruth()` POSTs `_bs.raw` to the existing `/api/truths` endpoint (`review_state='review'` guaranteed). Step 2 truth-route note gains a real "Save as Truth for Review" button. Step 3 DECISION row is now route-aware: truth route shows both badge types plus explanatory copy and two action buttons; claim route unchanged. CSS: `.builder-route-actions` and `.builder-truth-note`. No backend/schema/D1/Wrangler/deploy changes. All 416 smoke + 24 static + 56 worker-route checks pass. Deploy required (frontend assets).
**Read when:** reviewing the builder Truth route or planning the next deploy.

### `D127B_CLAIM_BUILDER_CLIENT_PROTOTYPE.md` — MERGED (see D-127C for Truth route)
Client-only Claim Builder prototype. Replaces single-form `renderSubmit()` with a 3-step builder: Step 1 Raw Thought (raw text + why + scope + falsifier), Step 2 Make It Testable (flags, route advisory, editable draft, category/type), Step 3 Final Claim (summary card + submit). New functions: `claimBuilderFlags()` (11 patterns), `claimBuilderRoute()`, `claimBuilderDraft()` (light cleaner), `renderBuilderFlags()`, `submitBuilderClaim()` (posts to existing `/api/claims` with builder context in `initialEvidence`). State in `_bs` object. Truth route is advisory-only (no write in D-127B). CSS: 22 new rules for builder, steps, flags, original panel, route advisory, summary card. No backend/schema/D1/Wrangler/deploy changes. All 416 smoke + 24 static + 56 worker-route checks pass. Deploy required (frontend assets). Recommended next: D-127C Truth-route save.
**Read when:** implementing or reviewing the Claim Builder or planning D-127C.

### `D127A_CLAIM_BUILDER_DESIGN_SPEC.md` — DESIGN SPEC (see D-127B for implementation)
Design/spec-only checkpoint for turning HumanX submission into a Claim Builder. Defines the three-step flow: Step 1 Raw Thought, Step 2 Make it Testable, Step 3 Final Claim. Accepts messy human text first; extends existing `claimQualityHints()` into builder flags; detects Claim vs Truth route; proposes future `claim_builder` object without schema changes; keeps Review-first publication; keeps RunPack later in Study mode; defines future Review card sections (CLAIM, ORIGINAL USER TEXT, WHY USER THINKS THIS, SCOPE, PRESSURE/FALSIFIER, SYSTEM FLAGS, DECISION) and later admin actions (Convert to Truth, Request Sharpening). **Docs/design only — no frontend/backend/schema/deploy changes.** Recommended next: D-127B client-only builder prototype.
**Read when:** implementing or reviewing the Claim Builder direction.

### `D126B_POLISH_BACKLOG_BATCH.md` — D-126B MERGED. DEPLOY STILL REQUIRED
Polish batch clearing B1–B6 from D-126A backlog. B1: rate-limit toast now reads "Too many submissions. Try again in about an hour." B2: CLAIM_TOO_SHORT now shows friendly copy. B3: nav tab "Beliefs" → "Belief Engine". B4: Review no-token hint extended to "Review is owner-only." B5: deferred (source-label density requires logic change). B6: D-125A doc row 5g `/api/health` → `/api/graph-status`. Files: `app-v10.js`, `index.html`, `D125A` doc. **Deploy required** (frontend assets changed). Checks: 24/24, syntax OK, 416/416. Recommended next: D-126C onboarding.
**Read when:** reviewing D-126B polish changes or planning D-126C.

### `D126A_BETA_PRODUCT_CHECKPOINT.md` — D-125 RELEASED
Beta product checkpoint after D-125 owner-as-tester hardening release. Live Worker `3ab9c7c5-b034-4ae5-8108-12ecb51734e7`, owner smoke PASS. Captures full feature state (claim pipeline, Review, Belief Engine v2, Drift, public browsing, AIP export), trust/safety posture (review-first, source safety, rate limiting, snapshot isolation), six low-priority backlog items (B1–B6: rate-limit toast, CLAIM_TOO_SHORT copy, nav label, review hint, vault density, /api/health doc typo). Five next-build options (D-126B polish → D-126C onboarding → D-126D admin ergonomics → D-126E seed content → D-126F abuse hardening). **Recommendation: D-126B first.** Checks: 24/24 static, syntax OK, 416/416 smoke.
**Read when:** starting any new build task; reviewing beta status before tester invite.

### `D125G_MOBILE_LAYOUT_AUDIT.md` — D-125 CHAIN COMPLETE
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
