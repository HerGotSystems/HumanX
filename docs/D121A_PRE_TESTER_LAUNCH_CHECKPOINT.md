# D-121A — Pre-Tester Launch Checkpoint

**Date:** 2026-06-12  
**Mode:** DOCS ONLY — no frontend code, no Worker/backend code, no Wrangler, no D1, no production query, no admin token, no deploy, no QA execution, and no mutation was performed.

> Purpose: consolidate the D-115→D-120 planning/checkpoint run and define the safest next action before a small controlled tester launch.

---

## A. Current Baseline

| Field | Value |
|---|---|
| Product state | Working public beta / early MVP — not finished product |
| Latest deployed Worker recorded | `3fe7ab7f-b603-407b-b7b8-31111956a3ea` |
| Static baseline recorded | `416 / 24 / 56` |
| Active frontend | `public/index.html`, `public/app-v10.js`, `public/styles.css` |
| Worker entrypoint | `src/worker.js` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` |
| D-116B read-only D1 audit | Not started |
| D-117B normal-user QA run | Not started |
| D-118B no-token Review QA run | Not started |
| D-119B onboarding implementation | Not started |
| D-120B guardrail design/patch | Not started |

---

## B. Completed Planning / Checkpoint Stack

| Task | File | Status |
|---|---|---|
| D-115A | `docs/D115A_POST_POLISH_PRODUCT_READINESS_CHECKPOINT.md` | Current product-readiness baseline |
| D-116A | `docs/D116A_READ_ONLY_D1_DATA_QUALITY_AUDIT_PLAN.md` | Read-only D1/data-quality audit plan |
| D-117A | `docs/D117A_NORMAL_USER_JOURNEY_QA_PLAN.md` | Normal-user journey QA plan |
| D-118A | `docs/D118A_MODERATOR_ADMIN_JOURNEY_QA_PLAN.md` | Moderator/admin journey QA plan |
| D-119A | `docs/D119A_BELIEF_ENGINE_PUBLIC_ONBOARDING_PLAN.md` | Belief Engine onboarding/copy plan |
| D-120A | `docs/D120A_ABUSE_RATE_LIMIT_ACCOUNT_DECISION_AUDIT.md` | Abuse/rate-limit/account decision audit |

---

## C. Launch Readiness Verdict

HumanX is ready for **internal/owner-controlled preparation**, but not yet for a public tester link blast.

Small controlled tester launch should wait until at least:

1. **D-117B** read-only normal-user QA browsing run is completed.
2. **D-118B** no-token Review UI QA is completed.
3. Any obvious public UX breakage is fixed.
4. The owner explicitly accepts the remaining known beta risks.

D-116B read-only D1 audit is strongly recommended before inviting testers, but it requires explicit authorisation because it queries production D1.

---

## D. Safest Next Task

**Recommended next task: D-117B — Execute read-only normal-user QA browsing run.**

Why this first:

- It does not require Wrangler.
- It does not require D1.
- It does not require admin token.
- It can be done with browser navigation only.
- It validates the actual public user experience after the D-111→D-114 mobile polish and D-115→D-120 planning.

Boundary:

- Read-only browsing only.
- Skip write steps unless explicitly authorised.
- Do not submit claim/truth/evidence/pressure/test/vote/report.
- Do not generate RunPack if it writes `aip_packets`.
- Do not use admin token.

---

## E. Exact Authorisation Phrases For Future Risky Tasks

Use explicit phrasing to avoid accidental live actions.

| Future task | Required explicit phrase |
|---|---|
| D-116B read-only D1 audit | `Authorised: run D-116B read-only D1 audit` |
| D-117B read-only browser QA | `Authorised: run D-117B read-only normal-user QA` |
| D-117 write-path QA | `Authorised: submit live test claim` or exact equivalent specifying the write |
| D-118C tokened Review read-only QA | `Authorised: run D-118C tokened Review read-only QA` |
| D-118D exact moderator action smoke | Exact item ID + action required |
| Wrangler deploy | Explicit deploy request required |
| D1 mutation/cleanup | Exact SQL/action approval required; not covered by any audit plan |

---

## F. Standing Do-Not-Regress Rules

1. No admin token in chat/docs/logs/issues/PRs/commits.
2. No Wrangler/D1/deploy unless explicitly authorised.
3. No production mutation unless exact action is authorised.
4. No raw user URL into `href`; use `sourceLink()` / `safeHttpUrl()`.
5. Preserve trust wording: HumanX does not decide truth.
6. Preserve Truth wording: visible/public does not mean proven/verified.
7. Preserve Review-first wording for new public submissions.
8. Preserve Belief Engine wording: not diagnosis, not label, not prediction.
9. Keep work branch/PR-based for risky/backend/deletion changes.
10. Keep audit-first workflow.

---

## G. Recommended Sequence From Here

| Order | Task | Kind | Notes |
|---|---|---|---|
| 1 | D-117B read-only normal-user QA | live browser QA | no writes, no token |
| 2 | D-118B no-token Review QA | live browser QA | no admin token |
| 3 | D-116B read-only D1 audit | production read-only | explicit authorisation required |
| 4 | D-119B Belief Engine onboarding copy | frontend copy | branch/PR; no backend expected |
| 5 | D-120B guardrail design | backend/product plan | only after QA/audit findings |
| 6 | Small tester launch | controlled beta | owner-approved risk acceptance |

---

## H. Confirmation

> Docs-only consolidation checkpoint. No frontend code changed. No Worker/backend code changed. No Wrangler. No D1. No production query. No admin token. No deploy. No QA execution. No mutation. D-116B, D-117B, and D-118B remain not started.
