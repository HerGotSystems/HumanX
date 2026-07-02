# D-298A — Beta Readiness Home Step 5 and My HumanX Tab Checkpoint

**Scope:** Docs only (`docs/PROJECT_STATE.md`, `docs/README.md`, this file)
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3462 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-298A:** `f1921af` (D-297C)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D298A_BETA_READINESS_HOME_STEP5_MY_HUMANX_TAB_CHECKPOINT.md`

---

## Arc Summary

| Task | Type | Result |
|------|------|--------|
| D-297A | Product pass (docs only) | 22 questions; post-submit path unguided identified as the top gap for a first beta tester; "Me" tab label gap identified as secondary |
| D-297B | Implementation (frontend + tests) | Home Step 5 added; "Me" tab label → "My HumanX"; 18 new tests + 4 existing updates; baseline 3442 → 3462 |
| D-297C | Live closeout | Owner deployed; 25/25 live sanity PASS; self-evident post-submit path confirmed |
| D-298A | Checkpoint (docs only) | This task; `PROJECT_STATE.md` updated; safe-next rules 114–116 added |

---

## What D-297 Did

D-297A asked 22 questions about whether HumanX was ready for a first outside beta tester. The conclusion was: the inbound Browse → Submit flow is clear and followable, but the post-submit path (Review pending → track in My HumanX) was completely unguided. A first tester who submitted a Claim would land in My HumanX with a yellow Review badge and no context. A secondary gap: the "Me" tab label did not communicate "owner dashboard."

D-297B made two targeted changes:

**1. Home "Start here" Step 5 — `public/app-v10.js`**

```
Step 5: Track Review
Submitted Truths wait for admin approval and appear in My HumanX with a Review badge.
Open My HumanX to see status.
[My HumanX →]
```

**2. Tab label rename — `public/index.html`**

`id="tab-me"` visible label changed from `Me` → `My HumanX`. The `id`, `class`, and `onclick="setMode('me')"` are unchanged.

---

## D-297 Guarantees (Live)

| Guarantee | Value |
|-----------|-------|
| Home Step 5 | Present — "Track Review" step explains post-submit state |
| Step 5 admin approval copy | `"submitted Truths wait for admin approval"` |
| Step 5 My HumanX pointer | `"appear in My HumanX"` |
| Step 5 Review badge mention | `"with a Review badge"` |
| Visible tab label | `My HumanX` |
| Internal tab id | `tab-me` — preserved |
| Tab onclick | `setMode('me')` — preserved |
| `renderMe()` | Unchanged |
| D-285B post-submit navigation | `renderMe()` / `tab-me` / toast — all preserved |
| Post-submit toast | `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| My HumanX data source | `GET /api/my-humanx` — unchanged |
| Review explanation in My HumanX | `"Review: awaiting admin approval — goes Public when approved."` |
| Yellow Review badge | `ME_STATE_CLR.review = 'b-yellow'` — preserved |
| Truth submission `review_state` | `'review'` — no change |
| No auto-publish | Confirmed |
| Admin Review only approval path | Confirmed |
| Public profile `/u/:slug` | Unaffected |
| Saved analysis | Private — unchanged |
| Draft Truth from analysis | Draft-only — unchanged |
| No CSS/backend/schema/API/migration changes | Confirmed |

---

## Previous Arc Locks Preserved

All prior arc locks remain intact. No changes were made to any of the following in D-297:

| Arc | Preserved |
|-----|-----------|
| D-295 profile setup nudge | `profileNudge` condition, self-clearing, no dismiss state |
| D-293 collapsible Profile Settings | `<details>/<summary>` wrap, Account card always visible |
| D-291 Recent Truths prominence | First content panel after filter bar |
| D-285 owner pending-Review visibility | All three Truth submission paths navigate to My HumanX |
| D-287 assisted Truth draft | `draftTruthFromAnalysis()` draft-only, no auto-submit |
| Truth/Review baseline | `review_state='review'` on all creation paths, admin-only approval |

---

## Safe-Next Rules Added (114–116)

| Rule | Summary |
|------|---------|
| 114 | Home "Start here" must always include a step covering the post-submit Review pending state. D-297B tests 1–4 are permanently load-bearing. |
| 115 | Visible tab label may say "My HumanX" but internal `tab-me` id and `setMode('me')` must remain stable. Any rename of the internal id requires a full JS-caller audit. |
| 116 | Beta-readiness improvements should prefer copy/navigation clarity before new backend features. A new endpoint or schema column for onboarding requires an explicit audit task. |

---

## Checks at D-298A

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | exit 0 |
| `hardening-smoke-test.mjs` | `3462 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 warn` |

---

## Deployment State at D-298A

| Task | Deploy | Result |
|------|--------|--------|
| D-297A | No | Product pass / docs only |
| D-297B | Yes — owner deployed | PASS — D-297C live closeout (25/25) |
| D-297C | No | Live closeout |
| D-298A | No | Checkpoint / docs only |

**Latest deployed Worker:** not captured (D-297B/C, 2026-07-02)
