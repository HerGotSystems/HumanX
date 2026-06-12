# D-115A — Post-Polish Product Readiness Checkpoint

**Date:** 2026-06-12  
**Mode:** Docs-only product-readiness checkpoint audit — no code, no backend/D1/Wrangler/live mutation.

> ⭐ **START HERE** for any new HumanX session after the D-111→D-114 public/mobile UX polish increment. This checkpoint supersedes D-110A as the current baseline. D-110A remains the canonical security/public-trust checkpoint for D-103→D-109.

---

## A. Current Frozen Baseline

| Field | Value |
|---|---|
| **Repo HEAD at checkpoint input** | `bf53c97` — D-114C record Truths mobile form density deployment |
| **Latest deployed Worker** | `3fe7ab7f-b603-407b-b7b8-31111956a3ea` |
| **Worker / URL** | `humanx` · `https://humanx.veltrusky-michal.workers.dev` |
| **Static baseline** | **416 / 24 / 56** (hardening-smoke / belief-engine / worker-route — all pass) |
| **Active frontend** | `public/index.html`, `public/app-v10.js`, `public/styles.css` |
| **Worker entrypoint** | `src/worker.js` |
| **Belief Engine** | `public/apps/humanx-belief-engine/index.html` — standalone app, hard-redirected from main frontend |
| **Product state** | Working public beta / early MVP — not a finished product |

---

## B. Completed Public/Mobile UX Polish Increment (D-111 → D-114)

| Pass | Shipped | Result |
|---|---|---|
| **D-111** | Submit trust framing | Submit page now visibly says scores reflect submitted evidence, not an automatic verdict |
| **D-112** | Mobile tab affordance | Phone nav gets right-edge scroll cue + active tab scrolls into view |
| **D-113** | Home mobile card density | Secondary `When:` line hidden on Home cards at phone widths |
| **D-114** | Truths mobile form density | Add-a-Truth form collapses on phones, stays expanded on desktop |

This closes the D-111→D-114 public/mobile UX polish run.

---

## C. Product Readiness Verdict

**HumanX is now a working public beta / early MVP.**

The core spine exists and is connected:

`Beliefs → Truths → Claims → Evidence → Study → RunPack → Review`

Core public/admin surfaces exist:

- public Home / Claims / Study / Evidence Vault / Truths / Submit / Drift / RunPack
- standalone Belief Engine
- public write flows for claims, truths, evidence, pressure, tests, reports, votes, RunPack packets, belief snapshots/promotions
- admin Review queue, inspect, approve/reject/requeue, cleanup, duplicate/similar handling

Safety/trust baseline is much stronger after D-103→D-114:

- source links render through `sourceLink()` / `safeHttpUrl()` only
- Worker evidence storage validates source URLs via `httpUrlOrNull()`
- source absence is visible (`no source provided`)
- weak evidence is framed as `weak argument`, not fake
- public wording repeatedly says verdicts/scores are pressure-test labels, not truth rulings
- new claims/truths/evidence go through Review before becoming public
- `/api/debug` is admin-gated
- orphan frontend bundles were removed
- mobile public surfaces are less cramped after D-111→D-114

**Ready for:** small controlled tester launch after one documented post-D-114 journey pass.  
**Not ready for:** wider public launch, viral sharing, paid users, or high-volume adversarial traffic.

---

## D. Beta-Ready Areas

### 1. Public browsing / reading

**Status:** beta-ready.

Claims list, claim Study, Evidence Vault, Truths list, and RunPack export have working surfaces and public/private review separation. Public claim list and claim detail are guarded against non-public claim exposure.

### 2. Claim submission

**Status:** beta-ready for small testers.

New claims require pseudonymous user identity, are rate-limited, duplicate-checked, and land in Review rather than becoming public immediately. D-111 closed the visible submit-page trust-framing gap.

### 3. Evidence / pressure / tests

**Status:** beta-ready with moderation caveat.

Evidence, pressure, and tests exist as public contribution flows. Evidence enters Review before public display. Evidence Vault filters to public/approved evidence linked to public claims.

**Caveat to verify before wider launch:** older risk docs note score recalculation side effects around pending evidence. Confirm current behaviour during D-116/D-117 before changing policy.

### 4. Truths

**Status:** beta-ready for recording/assertion workflow.

Truths can be listed, submitted, and pressure-tested as claims. D-114 makes the phone browsing experience materially better by collapsing the add form.

### 5. Review / moderation

**Status:** beta-ready for single-admin early beta.

Review queue, inspect, approve/reject/requeue, cleanup, duplicate marking, and similar-resolution exist behind admin token routes. This is acceptable for controlled beta, not a long-term moderation model.

### 6. Mobile public UX

**Status:** beta-ready for structured phone testing.

D-112/D-113/D-114 improve the main mobile pain points. This does not prove mobile is perfect; it means it is now good enough to run a proper phone smoke pass.

---

## E. Blocks Before Wider Public Launch

### Blocker 1 — No fresh post-D-114 journey proof

D-111→D-114 were individually verified, but there is no single documented end-to-end proof after the full polish increment.

Required before wider launch:

- Desktop normal-user journey: Home → Claims → Study → RunPack → Truths → Submit claim → confirmation
- Phone normal-user journey: Home → mobile tabs → Claims → Study → Truths collapsed form → Submit → confirmation
- Moderator journey: Review without token must not look broken; Review with token must still inspect/approve/reject correctly

### Blocker 2 — Read-only D1/data quality unknown

D-110 explicitly deferred D1 legacy/data audit. Display is safe, but product quality may still be harmed by stale smoke artefacts, weird test rows, duplicate rows, legacy source strings, or review-state edge cases.

Required before wider launch:

- read-only counts by table/state
- latest public rows
- latest review rows
- archived/rejected/test artefacts
- legacy source URL shape count
- duplicate/near-duplicate count
- RunPack packet count

### Blocker 3 — Abuse / rate-limit / account decision incomplete

Known areas to review before broader exposure:

- `/api/runpack` and `/api/aip` are public and unauthenticated; packet table growth needs monitoring or guardrails
- report-bombing can deny visibility by escalating claims/evidence to Review
- delegated modules need explicit confirmation for rate limiting and payload-size validation
- pseudonymous identity is acceptable for beta but not a long-term trust model by itself

### Blocker 4 — Belief Engine public onboarding is still thin

The Belief Engine works as a standalone surface, but normal users may not understand:

- why they are being sent to a separate app
- what a belief snapshot means
- what Drift is
- what happens when a belief becomes a Truth or Claim
- why `Truth` means recorded assertion, not verified fact

This is a comprehension blocker, not a backend blocker.

### Blocker 5 — Docs checkpoint chain must now point here

D-110A was the previous `START HERE` checkpoint. After D-111→D-114, this D-115A checkpoint is the correct current baseline.

---

## F. Recommended Next Work

| Priority | Task | Type | Live risk |
|---|---|---|---|
| 1 | **D-116A — Read-only D1/data quality audit plan** | audit plan | none if docs-only |
| 2 | **D-116B — Read-only D1/data quality audit** | read-only live audit | requires explicit user authorisation before any Wrangler/D1/admin command |
| 3 | **D-117A — End-to-end normal-user journey test** | QA | no data mutation unless a test submission is explicitly authorised |
| 4 | **D-118A — Moderator/admin journey test** | QA | requires explicit admin-token use authorisation; token must not be pasted in chat |
| 5 | **D-119A — Belief Engine public onboarding/explanation pass** | frontend/docs | low if copy-only |
| 6 | **D-120A — Abuse/rate-limit/account decision audit** | security/product audit | none if read-only |
| 7 | **Small tester launch** | controlled beta | only after D-116→D-118 are recorded |

---

## G. Do-Not-Regress Rules

Carry forward all D-110A rules plus the D-111→D-114 polish guarantees:

1. Never render user URLs directly into `href`; all source rendering goes through `sourceLink()` / `safeHttpUrl()`.
2. Worker evidence source storage must keep validating via `httpUrlOrNull()`.
3. Do not re-add orphan `app-v3.js`–`app-v9.js` bundles.
4. Keep `/api/debug` admin-gated.
5. Never commit secrets, `.env`, `.dev.vars`, keys, or token material.
6. Never paste the admin token into chat, docs, issues, PRs, commits, or logs.
7. Do not run Wrangler/D1/live/admin/token actions unless explicitly authorised for that task.
8. Public wording must preserve: verdicts/scores are pressure-test labels, not automatic truth rulings.
9. Truth wording must preserve: visible/public does not mean verified/proven.
10. Submit trust framing from D-111 must remain visible in the main submit panel.
11. Mobile tab affordance from D-112 must not regress.
12. Home phone card density from D-113 must not regress.
13. Truths mobile collapsed add form from D-114 must not regress.

---

## H. Explicitly Deferred

- `HUMANX_ADMIN_TOKEN` rotation remains deferred.
- No D1 cleanup was performed.
- No schema/migration was performed.
- No live write smoke was performed.
- No admin/moderation action was performed.
- No backend/API/runtime behaviour changed.
- No deploy was performed.

---

## I. Confirmation

Docs-only checkpoint. No code patch. No deploy. No Wrangler. No D1. No admin/moderation action. No token rotation. No live data mutated.
