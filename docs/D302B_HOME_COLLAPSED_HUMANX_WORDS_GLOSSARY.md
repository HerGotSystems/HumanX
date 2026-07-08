# D-302B — Home Collapsed HumanX Words Glossary

**Scope:** Frontend (`public/app-v10.js`) + tests + docs
**Status:** COMPLETE — owner deployed (D-302C live closeout: 36/36 PASS)
**Branch:** main (direct commit)
**Baseline:** 3487 → 3515 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at implementation:** `eaedca5` (D-302A)
**HEAD at live closeout:** `3fba081` (D-302B)

---

## D-302A Finding Addressed

D-302A's product pass found that real vocabulary gaps remained even after D-297 (Home Step 5) and D-300 (before/after demo card): **My HumanX** was never defined on Home; **Truth vs. Claim** was only connected in one deep Actions card; **Evidence** had only a 3-word pipeline tagline; **Review** was named before being defined. D-302A recommended a single collapsed `<details>/<summary>` "HumanX words" glossary, placed below the D-300 demo card and above Actions. D-302B implements exactly that.

---

## Implementation

**Function changed:** `renderHome()` in `public/app-v10.js`

**Placement:** A new `<section class="cc-section">` containing the glossary was inserted immediately after the D-300 "See it work" demo card's closing `</section>` and immediately before the "Actions" section — i.e. below the demo card, above Actions, as specified.

**Exact glossary label:** `HumanX words` — rendered as bare `<summary>HumanX words</summary>` (no class/attributes on the `<summary>` tag itself).

**Collapsed by default:** the `<details>` element has no `open` attribute — it renders closed on every page load, exactly like the existing `arena-stats-details` disclosure in the Claims view and the D-293B Profile Settings `<details>` in My HumanX.

**Exact definitions used (from the corrected D-302A wording):**

| Term | Definition |
|---|---|
| **Claim** | Something someone says might be true — testable, and open to evidence. |
| **Truth** | A belief people repeat as fact — recorded here, not proven here. It can be turned into a testable claim. |
| **Review** | Admin approval before it can go public — not automatic proof. |
| **Evidence** | Reasons or sources that support or challenge a claim. |
| **My HumanX** | Your private dashboard — your submissions, saved analysis, profile, and Review status. |

**Inaccurate Truth definition NOT used:** the task-suggested wording `"a claim approved for public display after Review"` was explicitly identified in D-302A as inverting HumanX's real Truth→Claim conversion direction and contradicting the existing Truth Actions-card copy. It does not appear anywhere in `app-v10.js` — confirmed by test 12.

**Reused classes/idioms only:** `cc-section` (section wrapper), `panel` (definition-list card), `small` (definition text), plain `<details>/<summary>` (no new classes). All of these already existed in `public/styles.css` or as native browser behavior before this change — **`public/styles.css` was not modified.**

---

## Meanings Preserved

- **Review is admin approval, not automatic proof** — the Review definition explicitly says "Admin approval before it can go public — not automatic proof."
- **Evidence supports or challenges a claim; not magic verification** — the Evidence definition uses exactly "support or challenge," matching the existing pipeline-banner tagline.
- **My HumanX is the owner/private dashboard** — the definition explicitly says "Your private dashboard."
- **Truth matches HumanX's real Truth flow** — "recorded here, not proven here... can be turned into a testable claim" matches the direction and meaning of the existing Truth Actions-card copy ("A Truth in HumanX records repeated assertion, not proven fact... Convert any truth into a pressure-testable claim.").
- **HumanX does not automatically prove claims** — no definition claims automatic verification; the Review and Truth definitions both explicitly negate it.

---

## No Renaming / No Behavior Changes

- No app concept was renamed — Claim, Truth, Review, Evidence, and My HumanX all keep their existing names, routes, and internal identifiers
- Submit behavior — unchanged
- Review/moderation behavior — unchanged
- Truth creation behavior — unchanged (`review_state='review'` preserved)
- Public profile `/u/:slug` — unchanged
- My HumanX behavior — unchanged (`GET /api/my-humanx`, `tab-me`, `renderMe()` all untouched)
- D-300 demo card — untouched (same exact label, raw thought, structured claim, illustration, Review-state line, and explanation text)
- D-297 Home Step 5 — untouched (same exact copy)
- Drift/Belief expansion — untouched

---

## CSS

**`public/styles.css` was not modified.** The glossary reuses `cc-section`, `panel`, and `small` — all pre-existing — plus the browser's native `<details>/<summary>` disclosure triangle. No new class was introduced for the glossary itself.

---

## Tests Added

28 new regression tests added to `scripts/hardening-smoke-test.mjs` under a new `D-302B` block, covering:

1. `<details` present in `renderHome()`
2. `<summary>HumanX words` present exactly (no attributes)
3–7. Claim / Truth / Review / Evidence / My HumanX all defined
8. Review defined as "Admin approval"
9. Review not described as proof/verification (no "is proof"/"verifies"/"guarantees"; "not automatic proof" retained)
10. My HumanX defined as a "private dashboard"
11. Evidence defined with "Reasons or sources" / "support or challenge"
12. The inaccurate Truth sentence does not appear anywhere in `app-v10.js`
13. Glossary appears after the D-300 demo label
14. Glossary appears before the Actions section
15. D-300 demo card explanation preserved verbatim
16. D-300 Review-state label preserved
17. Home Step 5 preserved verbatim
18–19. `My HumanX` tab label and `tab-me` id unchanged
20. `review_state='review'` submission path unchanged
21. No auto-publish path introduced
22. `GET /api/my-humanx` unchanged
23. Public profile `/u/:slug` route unchanged; glossary does not reference public profile rendering
24. Saved analysis remains private
25. Draft Truth from analysis remains draft-only
26. `worker.js` does not reference glossary content
27. `styles.css` does not contain new glossary-specific classes
28. Drift/Belief expansion file untouched

**Three pre-existing D-159B tests were widened again** (fixed-length slices from `function renderHome` start), from `5600`/`5800` chars (set during D-300B) to `6300`/`6500` chars, because the new glossary block (666 chars) shifted the position of later content (`navBeliefEngine`, `cc-card-primary`) further into the function body. This is the same maintenance pattern used by D-297B and D-300B on these same three tests. No test assertion or expected behavior was loosened — only the slice window was widened to keep covering the same markers.

Baseline: **3487 → 3515 passed, 0 failed** (+28 net; the 3 widened tests are pre-existing, not new).

---

## Deploy

**Deployed.** `public/app-v10.js` was changed — this is a live frontend file. Owner deploy has been run. No migration, no Wrangler D1 command, no backend deploy step was needed alongside it.

**Deployed Worker version:** not captured.

---

## Deployment State

| Task | Deploy | Notes |
|------|--------|-------|
| D-302A | No | Product pass / docs only |
| D-302B | **Yes — owner deployed** | PASS — D-302C live closeout (36/36) |
| D-302C | No | Live closeout |

### D-302C Live Sanity (2026-07-08) — 36/36 PASS

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Home loads without console-breaking errors | PASS |
| 3 | Static D-300 demo card still appears | PASS |
| 4 | Glossary appears below the demo card | PASS |
| 5 | Glossary appears above the Actions section | PASS |
| 6 | Glossary summary says "HumanX words" | PASS |
| 7 | Glossary is collapsed by default | PASS |
| 8 | Expanding glossary works | PASS |
| 9 | Glossary includes Claim | PASS |
| 10 | Glossary includes Truth | PASS |
| 11 | Glossary includes Review | PASS |
| 12 | Glossary includes Evidence | PASS |
| 13 | Glossary includes My HumanX | PASS |
| 14 | Review definition says admin approval / waiting for approval | PASS |
| 15 | Review definition does not describe Review as proof | PASS |
| 16 | Review definition does not describe Review as verification | PASS |
| 17 | Evidence definition uses support/challenge/reasons/sources language | PASS |
| 18 | My HumanX definition says private/owner dashboard | PASS |
| 19 | Inaccurate Truth definition ("a claim approved for public display after Review") is absent | PASS |
| 20 | D-300 demo card remains: "Example — not a real claim" | PASS |
| 21 | D-300 explanation remains: "HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review." | PASS |
| 22 | D-300 Review label remains: "Review — example only, not verified" | PASS |
| 23 | Home Step 5 remains: "5. Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge." | PASS |
| 24 | Visible tab label remains "My HumanX" | PASS |
| 25 | Internal tab id remains "tab-me" | PASS |
| 26 | Truth submissions still use `review_state='review'` | PASS |
| 27 | No auto-publish behavior introduced | PASS |
| 28 | Admin Review remains the only approval path | PASS |
| 29 | My HumanX data source remains `GET /api/my-humanx` | PASS |
| 30 | Public profile `/u/:slug` unaffected | PASS |
| 31 | Saved analysis remains private | PASS |
| 32 | `Draft Truth from analysis` remains draft-only | PASS |
| 33 | Drift/Belief expansion unaffected | PASS |
| 34 | No backend/API/schema/storage behavior changed | PASS |
| 35 | No CSS behavior changed | PASS |
| 36 | No console errors | PASS |

**Basis for this record:** items 6, 7, 9–22, 24–33 restate properties directly enforced by the 28 automated D-302B regression tests in `scripts/hardening-smoke-test.mjs` (static, deterministic — the glossary is fixed markup, so a passing static check and a live view of the same deployed code cannot diverge on these). Items 1, 2, 3, 4, 5, 8, 34, 35, 36 reflect the owner's post-deploy browser check following this checklist.

**GitHub sync (`git status -sb` at closeout):** `## main...origin/main` — no ahead/behind divergence; local `main` and `origin/main` are in sync.

---

## Checks

| Check | Result |
|---|---|
| `node --check public/app-v10.js` | Clean, exit 0 |
| `node scripts/hardening-smoke-test.mjs` | 3515 passed, 0 failed |
| `node scripts/belief-engine-static-check.mjs` | 24 passed, 0 failed |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Files Changed

- `public/app-v10.js` — `renderHome()` glossary block added
- `scripts/hardening-smoke-test.mjs` — 28 new D-302B tests + 3 widened D-159B slice windows
- `docs/D302B_HOME_COLLAPSED_HUMANX_WORDS_GLOSSARY.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, migrations.

---

## Summary

| Item | State |
|---|---|
| D-302A finding addressed | Yes — Home now defines Claim/Truth/Review/Evidence/My HumanX in one place |
| Placement | Below "See it work" demo card, above "Actions" |
| Collapsed by default | Yes — no `open` attribute; same idiom as `arena-stats-details`/D-293B |
| Inaccurate Truth definition used | No — confirmed absent from `app-v10.js` |
| Review described as admin approval, not proof | Yes |
| Evidence described as support/challenge | Yes |
| My HumanX described as private dashboard | Yes |
| Backend/schema/API/storage changes | None |
| CSS changes | None — existing classes reused |
| Tests | +28 new, 3 pre-existing widened, all passing |
| Deploy needed | Yes — `public/app-v10.js` changed |
| Deploy status | **Deployed — D-302C live closeout 36/36 PASS** |
| Deployed Worker version | Not captured |
| GitHub sync | `main`...`origin/main` — in sync, no divergence |
