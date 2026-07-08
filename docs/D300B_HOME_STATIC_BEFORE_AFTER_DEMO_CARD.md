# D-300B — Home Static Before/After Demo Card

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — owner deployed (D-300C live closeout: 35/35 PASS)
**Branch:** main (direct commit)
**Baseline:** 3462 → 3487 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at implementation:** `fdee7ed` (D-300A)
**HEAD at live closeout:** `15e9840` (D-300B)

---

## D-300A Finding Addressed

D-300A's product pass concluded: **Home explains what HumanX *is*, but never shows what HumanX *produces*.** A cold visitor sees the pipeline banner (`Beliefs → Truths → Claims → Evidence → RunPack`) as a list of named categories, and the closest thing to a worked example (the "What makes a good claim?" guidance in the Submit builder) sits 2–3 clicks deep, unreachable in the first 10 seconds on Home.

D-300A recommended a static, clearly-labeled before/after example card as the smallest fix. D-300B implements exactly that.

---

## Implementation

**Function changed:** `renderHome()` in `public/app-v10.js`

**Placement:** A new `<section class="cc-section">` titled **"See it work"** was inserted immediately after the existing "Start here" section closes and immediately before the existing "Actions" section begins — i.e. under the pipeline banner and the Start Here steps, above the deeper Actions card grid.

**Exact demo label:**
> `Example — not a real claim`

**Exact raw thought:**
> `People share simple claims faster than they check them.`

**Exact structured claim:**
> `People are more likely to share a simple claim online before checking its evidence.`

**Illustration scores (static text, not real meters/data):**
> `Evidence: example only · Testability: high · Survivability: unknown`

**Review state:**
> A `badge b-yellow` pill reading `Review`, followed by `— example only, not verified`

**Exact explanatory copy:**
> `HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review.`

**Reused CSS classes only:** `cc-section`, `cc-section-head`, `panel`, `small`, `badge`, `b-yellow`. All of these already existed in `public/styles.css` before this change — **`public/styles.css` was not modified.**

---

## Static-Only Behavior (Verified)

- No `data-action` attribute anywhere in the card
- No `<button>` element anywhere in the card
- No `fetch(...)` call anywhere in the card
- No claim ID, no `claimId`, no reference to `createClaim`, `submitTruth`, or `submitBuilderTruth`
- No `/api/claims`, `/api/truths`, or `/api/review` calls within the card
- The card is pure static markup rendered as part of the existing `renderHome()` template string — it participates in no request/response cycle

**Consequence:** the demo cannot create a Review queue entry, cannot be submitted, cannot be edited, and has no state of its own. It is inert decoration that happens to look like the real Review-badge pattern used elsewhere in the app.

---

## No Verified-Truth Confusion

The card carries two separate explicit disclaimers:
1. `Example — not a real claim` — stated first, in bold, before any of the demo content
2. `— example only, not verified` — repeated a second time directly next to the Review badge itself, so the badge cannot be read in isolation as a real pending item

This double-labeling means a visitor cannot mistake the card for a real claim awaiting Review, even if they only skim the Review-state line.

---

## No Backend/Schema/API/Storage Changes

- `src/worker.js` — not modified
- `src/analysis-results.js` — not modified
- `src/truths.js` — not modified
- No migration added or run
- No new API route, no new request/response shape
- `GET /api/my-humanx` unchanged
- Truth submission `review_state='review'` path unchanged
- Public profile `/u/:slug` route unchanged
- Draft Truth from analysis (`draftTruthFromAnalysis`) remains draft-only, unaffected

---

## CSS

**`public/styles.css` was not modified.** All classes used by the demo card (`cc-section`, `cc-section-head`, `panel`, `small`, `badge`, `b-yellow`) already existed and are used elsewhere in the app for equivalent purposes (section headers, card panels, Review-state badges in My HumanX).

---

## Tests Added

25 new regression tests added to `scripts/hardening-smoke-test.mjs` under a new `D-300B` block, covering:

1. Exact label `Example — not a real claim` present
2. Exact raw thought text present
3. Exact structured claim text present
4. Exact explanatory copy present
5–7. Evidence / Testability / Survivability illustration text present
8. Review state badge present
9. `example only, not verified` present
10. No `data-action`, `fetch(`, or `<button>` inside the demo card slice
11. No claim ID / claim-creation function references inside the demo card
12–14. No `/api/claims`, `/api/truths`, `/api/review` calls inside the demo card
15. `review_state='review'` submission path unchanged
16. Home Step 5 copy unchanged
17–18. `My HumanX` tab label and `tab-me` id unchanged
19. `GET /api/my-humanx` unchanged
20. Public profile `/u/:slug` route unchanged
21. Saved analysis remains private
22. Draft Truth from analysis remains draft-only
23. `worker.js` does not reference demo card content
24. `styles.css` does not contain new demo-specific classes
25. Drift/Belief expansion file untouched

**Three pre-existing D-159B tests were widened** (fixed-length slices from `function renderHome` start) from `4400`/`4600` chars to `5600`/`5800` chars, because the new demo card (810 chars) shifted the position of later content (`navBeliefEngine`, `cc-card-primary`) further into the function body. This is the same maintenance pattern already used once before by D-297B on these same three tests. No test assertion or expected behavior was loosened — only the slice window was widened to keep covering the same markers.

Baseline: **3462 → 3487 passed, 0 failed** (+25 net; the 3 widened tests are pre-existing, not new).

---

## Deploy

**Deployed.** `public/app-v10.js` was changed — this is a live frontend file. Owner deploy has been run. No migration, no Wrangler D1 command, no backend deploy step was needed alongside it.

**Deployed Worker version:** not captured.

---

## Deployment State

| Task | Deploy | Notes |
|------|--------|-------|
| D-300A | No | Product pass / docs only |
| D-300B | **Yes — owner deployed** | PASS — D-300C live closeout (35/35) |
| D-300C | No | Live closeout |

### D-300C Live Sanity (2026-07-08) — 35/35 PASS

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Home loads without console-breaking errors | PASS |
| 3 | Static demo card is visible on Home | PASS |
| 4 | Demo card appears near the top of Home, under the main pipeline/start area | PASS |
| 5 | Demo card label appears: "Example — not a real claim" | PASS |
| 6 | Raw thought appears: "People share simple claims faster than they check them." | PASS |
| 7 | Structured claim appears: "People are more likely to share a simple claim online before checking its evidence." | PASS |
| 8 | Explanation appears: "HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review." | PASS |
| 9 | Demo mentions evidence | PASS |
| 10 | Demo mentions testability | PASS |
| 11 | Demo mentions survivability | PASS |
| 12 | Demo shows Review state | PASS |
| 13 | Review label says: "Review — example only, not verified" | PASS |
| 14 | Demo does not show as a real claim card | PASS |
| 15 | Demo does not have submit/write buttons | PASS |
| 16 | Demo does not submit anything | PASS |
| 17 | Demo does not create a claim ID | PASS |
| 18 | Demo does not fetch data | PASS |
| 19 | Demo does not pollute Review queue | PASS |
| 20 | Review queue item count does not change from merely viewing Home | PASS |
| 21 | Home Step 5 remains: "5. Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge." | PASS |
| 22 | Visible tab label remains "My HumanX" | PASS |
| 23 | Internal `tab-me` behavior remains preserved | PASS |
| 24 | Submit behavior remains unchanged | PASS |
| 25 | Truth submissions still use `review_state='review'` | PASS |
| 26 | No auto-publish behavior introduced | PASS |
| 27 | Admin Review remains the only approval path | PASS |
| 28 | Public profile `/u/:slug` unaffected | PASS |
| 29 | Saved analysis remains private | PASS |
| 30 | `Draft Truth from analysis` remains draft-only | PASS |
| 31 | RunPack behavior unaffected | PASS |
| 32 | Drift/Belief expansion unaffected | PASS |
| 33 | No backend/API/schema/storage behavior changed | PASS |
| 34 | No CSS behavior changed | PASS |
| 35 | No console errors | PASS |

**Basis for this record:** items 5–13 and 15–19 restate properties directly enforced by the 25 automated D-300B regression tests in `scripts/hardening-smoke-test.mjs` (static, deterministic — the demo card is pure static markup, so these cannot regress between a static check and a live view of the same deployed code). Items 21–32 restate D-297B/D-300B lock guarantees re-confirmed unchanged by the same test run. Items 1, 2, 3, 4, 14, 20, 33, 34, 35 reflect the owner's post-deploy browser check following this checklist.

**GitHub sync (`git status -sb` at closeout):** `## main...origin/main` — no ahead/behind divergence; local `main` and `origin/main` are in sync.

---

## Checks

| Check | Result |
|---|---|
| `node --check public/app-v10.js` | Clean, exit 0 |
| `node scripts/hardening-smoke-test.mjs` | 3487 passed, 0 failed |
| `node scripts/belief-engine-static-check.mjs` | 24 passed, 0 failed |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Files Changed

- `public/app-v10.js` — `renderHome()` demo card added
- `scripts/hardening-smoke-test.mjs` — 25 new D-300B tests + 3 widened D-159B slice windows
- `docs/D300B_HOME_STATIC_BEFORE_AFTER_DEMO_CARD.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, migrations.

---

## Summary

| Item | State |
|---|---|
| D-300A finding addressed | Yes — Home now shows a worked example, not just named categories |
| Placement | Under pipeline/Start Here, above Actions grid |
| Static only | Yes — no fetch/write/submit/button/data-action |
| Review queue pollution | Impossible — card is inert markup |
| Verified-truth confusion | Mitigated — double explicit "example only" labeling |
| Backend/schema/API/storage changes | None |
| CSS changes | None — existing classes reused |
| Tests | +25 new, 3 pre-existing widened, all passing |
| Deploy needed | Yes — `public/app-v10.js` changed |
| Deploy status | **Deployed — D-300C live closeout 35/35 PASS** |
| Deployed Worker version | Not captured |
| GitHub sync | `main`...`origin/main` — in sync, no divergence |
