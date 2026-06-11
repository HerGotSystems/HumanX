# D-99A — Production Checkpoint: Review / Truth / Onboarding Safety Run

**Date:** 2026-06-10
**Mode:** Audit + checkpoint doc only — no code, no backend/D1/Wrangler/live mutation.
**Main HEAD:** `b8d69b4` — D-98D record onboarding terminology deployment verification

---

## A. Static Baseline (verified at this checkpoint)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **312 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed — all hard checks passed** |
| `node scripts/worker-route-static-check.mjs` | **39 passed — all hard checks passed** |

**Baseline: 312 / 24 / 39.**

---

## B. Latest Deployed Worker

| Field | Value |
|---|---|
| **Worker version ID** | `9f8c2821-3744-4adf-af49-6d1e476b7a0d` (recorded in D-98D) |
| **Wrangler version** | 4.99.0 |
| **Worker name / URL** | `humanx` · https://humanx.veltrusky-michal.workers.dev |
| **Deployment method** | local `npx wrangler deploy` (user) |
| **Main HEAD deployed** | `33626ac` (PR #120 merge) → docs checkpoint now at `b8d69b4` (docs-only since) |

---

## C. Completed Safety / Clarity Improvements (D-93 → D-98)

| Pass | Change | Live record |
|---|---|---|
| **D-93D** | Review UI context for Truth-Derived / borderline-derived claims (3 helpers, filter chip, 3 badges, 3 inspect rows) | D-94C |
| **D-93E** | Category-echo false-positive fix — `isClaimCategoryEcho` tightened to exact equality (`cl===ca`), no substring matching | D-94C |
| **D-95B** | Review Inspect panel `scrollIntoView` after Inspect; top Approve styling aligned with bottom Approve | D-95F |
| **D-96B** | Card-row Approve requires two-step confirmation (`pendingApproveReviewId` mirrors Reject flow); inspect-panel Approve stays one-click | D-96E |
| **D-97B** | Public Truth trust-signal clarity — visibility badge "Public"(green)→"visible"(neutral); NOT VERIFIED 8px→11px bold; linked-claim chip de-greened to "claim derived"; claims keep green "Public" | D-97E |
| **D-98B** | Public onboarding terminology — Truth→Claim wording unified to "Pressure-test as Claim"; verdict-label qualifier added; no-overclaim hero/Belief Engine framing regression-locked | D-98D |

All six shipped frontend-only, behind branch + PR, with per-pass deployment-verification records.

---

## D. Current Safe Operating Rules

| Rule | Status |
|---|---|
| No Wrangler / D1 / live commands without explicit per-task approval | **Standing** — `wrangler deploy`, `wrangler d1 execute`, all variants off-limits unless the task requests them |
| Backend / Worker / D1 risky changes use branch + PR | **Standing** — one branch per task, show diff, stop after commit; user pushes/merges/deploys |
| Frontend / docs / static-check changes | branch as appropriate; static checks must pass before commit |
| No cleanup by text matching | **Standing** — content-based moderation forbidden |
| No bulk cleanup | **Standing** — no mass actions |
| Exact-ID actions only | **Standing** — moderation acts on a specific `clm_`/`tru_` ID |
| Borderline ≠ artefact | **Standing** — borderline is advisory badge only, no archive button; artefact has archive |
| Public / visible ≠ verified | **Standing** — D-97B/D-98B; visibility never implies verification |
| Migrations 0004 / 0005 not rerun | **Standing** — already applied to production D1 |

---

## E. Current Known Live Moderation State

| Item | State |
|---|---|
| `tru_67ae90e56f7449ee85` — **SMALL INDEFERENT TRUTH** | Remains **visible** on the Truths page as a borderline advisory Truth (admin-only `? borderline` badge). Not archived. |
| `clm_30889d651e3b4b2cb6` — its Truth-derived claim | Remains **pending / not approved** in Review. No moderation action taken; will stay pending unless manually changed. |
| Personal-belief policy | **Deferred** — `isTruthPersonalBelief` produces an advisory badge only; no automated handling decided. |
| `Sniff / Sniff Butt` home-test artefact | Known visible production marker (per ADD_TEST_FIX_RESULT); left in place. |

No live data was mutated in any D-93→D-99A task.

---

## F. Current Test Coverage Summary

| Section | Pass | Coverage |
|---|---|---|
| Section 34 | D-92C | Public Truths clarity — "Public means visible, not proven", not-verified badge, Pressure-test button, isTruthPersonalBelief/isTruthArtifact, no auto-hide |
| D-92E/G | Truth admin ID + artefact cleanup | Admin-aware ID display, archive gating, no direct API in `truthCard` |
| D-93B | Truth admin ergonomics | borderline badge admin-only, no archive for borderline-only |
| Section 38 | D-93D/E | Truth-derived Review context (badges, filter chip, inspect rows) + category-echo exact-equality guard |
| Section 39 | D-95B | Review inspect scroll + Approve visual consistency |
| Section 40 | D-96B | Card-row Approve two-step confirmation; inspect-panel Approve unchanged; reject flow intact |
| Section 41 | D-97B | Truth trust signals — neutral "visible" badge, NOT VERIFIED ≥10px, de-greened chip, claims keep green, sensitive beliefs content-neutral |
| Section 42 | D-98B | Onboarding terminology — no-overclaim hero/Belief Engine locks, "Pressure-test as Claim" consistency, verdict qualifier, "Send to Claim Review" removed |

---

## G. Recommended Next Work

### G.1 — Safe frontend-only
| ID | Idea |
|---|---|
| SF-1 | **Study/Claim evidence display audit** — how evidence, pressure, scores, and verdicts render on the public claim/Study view; verify the D-98B "not automatic verdict" framing carries through into the Study screen where verdicts are most prominent |
| SF-2 | Public journey smoke audit — walk the first-time-user path end to end (home → submit/browse/truths → study → runpack) for dead ends, jargon, or confusing empty states |
| SF-3 | Glossary / "what do these mean?" affordance for Truth / Claim / Pressure-test / Verdict (D-98A deferred W-4) |

### G.2 — Needs backend / schema / API thought
| ID | Idea |
|---|---|
| BE-1 | Per-truth "verification state" field distinct from `review_state` so visibility never conflates with verification (D-97A B-1) |
| BE-2 | Verdict-definition tooltips sourced from the actual scoring thresholds (D-98A B-1) |
| BE-3 | Extend `reviewCleanup` to `pressure`/`evidence` target types (long-standing D-91D3 backlog) |

### G.3 — Admin / manual operations only
| ID | Idea |
|---|---|
| OPS-1 | Manual decision on `clm_30889d651e3b4b2cb6` (approve or keep pending) via Review UI with admin token |
| OPS-2 | Manual review of `SMALL INDEFERENT TRUTH` borderline status |
| OPS-3 | Personal-belief policy decision (currently deferred) |

### G.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Automatic/content-based moderation of sensitive beliefs — violates standing policy |
| DN-2 | Bulk cleanup or text-matching deletion — forbidden |
| DN-3 | Auto-archive of borderline Truths — borderline ≠ artefact |
| DN-4 | Renaming core vocabulary (Truth/Claim/Pressure-test) — churn; framing already tuned |

---

## H. Suggested Next Task

**Recommend D-100A — Study / Claim evidence display audit.**

Why this over D-99B (public journey smoke audit):
- The D-93→D-98 run hardened the **Review queue** (admin side) and the **Truths page + onboarding copy** (public entry). The one major public surface **not** yet audited in this run is the **Study / Claim view** — where evidence, pressure, scores, and the verdict labels actually render.
- The D-98B verdict qualifier was added to the global searchbar, but verdicts are most prominent and consequential on the **Study/Claim screen**. Confirming the "verdicts summarise submitted evidence, not automatic truth rulings" framing carries through to where users actually read a verdict closes the loop opened by D-98B.
- It is the natural continuation of the trust/clarity arc: Review (D-93–96) → Truths/onboarding (D-97–98) → **Claims/Study (D-100)**.
- D-99B (journey smoke) is valuable but broader and shallower; it can follow D-100A as a final end-to-end pass once the Study surface is verified.

---

## I. No Mutation Confirmation

> No code changes were made during this checkpoint (docs-only).
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated.
> No admin token was used.
