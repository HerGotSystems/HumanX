# D-301A — Home Static Before/After Demo Card Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3487 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD before D-301A:** `56234e8` (D-300C metadata correction)

---

## Purpose

Closes the D-300 self-demonstrating Home demo-card arc with a checkpoint, so future cold-visitor/onboarding work starts from the correct live baseline. Records the D-299A → D-300A → D-300B → D-300C chain in one place and updates `docs/PROJECT_STATE.md` accordingly.

---

## GitHub Sync

Local `main` was confirmed pushed to `origin/main` before this checkpoint: `15e9840..56234e8 main -> main`. `git status -sb` at the start of this task showed `## main...origin/main` — no divergence.

---

## Arc Recap

### D-299A — HumanX first beta tester script

Mike's beta tester script (docs only) produced a copy-paste tester start message, 11-step task list, 8 safe example claims, an observation sheet, and success/failure criteria. Outcome: most invited testers did not respond or did not test; one outside tester likely submitted a real claim. This result is what motivated D-300 — HumanX cannot rely on a person walking a cold visitor through the app.

### D-300A — Self-demonstrating demo mode product pass

23-question product pass. **Conclusion: Home explained what HumanX *is*, but did not show what HumanX *produces*.** The pipeline banner names categories (`Beliefs → Truths → Claims → Evidence → RunPack`) without a worked example, and the closest thing to one (the "What makes a good claim?" guidance in the Submit builder) sat 2–3 clicks deep. Recommended a static, clearly-labeled before/after demo card as the smallest fix. Docs only. Baseline unchanged 3462/0/24/57.

### D-300B — Home static before/after demo card (implementation)

Implemented the D-300A recommendation in `renderHome()`:

- Placed directly under the pipeline banner / Start Here strip, above the Actions card grid
- Demo label: `Example — not a real claim`
- Raw thought: `People share simple claims faster than they check them.`
- Structured claim: `People are more likely to share a simple claim online before checking its evidence.`
- Illustration: `Evidence: example only · Testability: high · Survivability: unknown`
- Review state: `Review — example only, not verified` (reuses existing `badge b-yellow`)
- Explanation: `HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review.`
- Static markup only — no `data-action`, no `<button>`, no `fetch(`, no claim ID, no `/api/claims`/`/api/truths`/`/api/review` calls
- No CSS changes — reused existing `cc-section`/`panel`/`small`/`badge`/`b-yellow` classes
- No backend/API/schema/storage changes
- 25 new regression tests + 3 pre-existing D-159B slice-window widenings (renderHome grew by 810 chars)
- Baseline 3462 → 3487/0/24/57

### D-300C — Live closeout

- Owner deploy PASS
- **35/35 live sanity PASS**
- Deployed Worker version: `866886a0-691f-417b-bbe6-77a2dd8ca1f2`

### D-300C metadata correction

The initial D-300C closeout recorded the deployed Worker version as "not captured." A follow-up correction (docs-only, no implementation claims changed) replaced this with the actual captured version, `866886a0-691f-417b-bbe6-77a2dd8ca1f2`, in both `docs/D300B_HOME_STATIC_BEFORE_AFTER_DEMO_CARD.md` and `docs/README.md`.

---

## D-300 Guarantees Now Live (Recorded)

| Guarantee | Value |
|---|---|
| Demo label | `Example — not a real claim` |
| Raw thought | `People share simple claims faster than they check them.` |
| Structured claim | `People are more likely to share a simple claim online before checking its evidence.` |
| Explanation | `HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review.` |
| Review label | `Review — example only, not verified` |
| Static-only | Confirmed — no `data-action`, no `<button>`, no `fetch(` |
| No claim ID created | Confirmed |
| No `/api/claims`, `/api/truths`, `/api/review` calls | Confirmed |
| Cannot submit, fetch, write, or pollute Review | Confirmed |
| Not described as verified truth | Confirmed — double explicit "example only" labeling |
| Stays clearly example-only | Confirmed |

---

## Previous Locks Preserved (Confirmed Unchanged by D-300)

**D-297 beta-readiness Home guidance:**
- Home Step 5: `"Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge."` — preserved
- Visible tab label: `My HumanX` — preserved
- Internal id: `tab-me` — preserved
- Click behavior: `setMode('me')` — preserved

**D-295 profile setup nudge:**
- Fires only when `!u.profile_public && !u.profile_slug` — unchanged
- Self-clears once `profile_slug` exists or `profile_public` is true — unchanged
- Not a general count-based dashboard strip — unchanged
- No dismiss/localStorage state — unchanged

**D-293 collapsible Profile Settings:**
- Account card remains fully visible — unchanged
- Profile Settings controls collapsed under native `<details>/<summary>` — unchanged
- Profile save/copy behavior unchanged

**D-291 Recent Truths prominence:**
- `Recent Truths` appears immediately after the filter bar — unchanged
- Pending Review Truths remain visible in My HumanX — unchanged

**D-285 owner pending-Review visibility:**
- All three Truth submission success paths (`submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')`) navigate to My HumanX — unchanged
- Toast: `"Submitted for Review — you can see it in My HumanX with the Review badge."` — unchanged

**D-287 assisted Truth draft:**
- `Draft Truth from analysis` remains present when `plainLanguageSummary` exists — unchanged
- Draft action uses `plainLanguageSummary`, never `verdict` — unchanged
- Draft action does not call `submitTruth()` — unchanged
- Draft action does not submit or publish — unchanged

**Truth/Review baseline:**
- Truth creation paths produce `review_state='review'` — unchanged
- No current route publishes directly without Review — unchanged
- Admin-only Review handles approval — unchanged
- Saved analysis does not create, submit, approve, or publish a Truth — unchanged

**RunPack/saved-analysis locks:**
- `saveAnalysisResult()` posts only to `/api/analysis` — unchanged
- Stale warning remains `claim updated since packet` — unchanged
- AI-return import remains: `rp-return-section`, `Load AI Analysis Return`, `Saving does not publish a truth automatically` — unchanged

All of the above were re-confirmed passing via the full hardening smoke suite (3487/0) run as part of this checkpoint — no regression tests for these locks were modified.

---

## PROJECT_STATE.md Updates

- "Last updated" / "Previous checkpoint" header updated to D-301A
- `Current HEAD` table: added D-301A checkpoint row
- `Current baseline` section retitled "as of D-301A"; numbers updated `3462` → `3487`
- New `### D-299A: HumanX first beta tester script` and `### D-300 mini-arc: Home static before/after demo card` sections added (with guarantees table), inserted after the D-297 mini-arc and before the D-274→D-275 behavior reference section
- `Deployment state` table: added D-298A/D-299A/D-300A/D-300B/D-300C/D-301A rows; `Latest deployed Worker` updated to `866886a0-691f-417b-bbe6-77a2dd8ca1f2` (D-300B/C, 2026-07-08)
- `Safe next-work rules`: added rules 117–119 (demo static-only, demo labeling, demo cannot submit/fetch/write/pollute Review)
- `Suggested next feature lanes`: added "HumanX first beta tester script" (COMPLETE), "Home static before/after demo card" (COMPLETE), and "Next cold-visitor work" (vocabulary clarity only if real users remain confused)

---

## Files Changed

- `docs/D301A_HOME_STATIC_BEFORE_AFTER_DEMO_CARD_CHECKPOINT.md` — this doc
- `docs/PROJECT_STATE.md` — checkpoint, baseline, arc summary, deployment state, safe-next rules, suggested lanes updated
- `docs/README.md` — D-301A added as current checkpoint entry

**Not modified:** `scripts/hardening-smoke-test.mjs`, `public/app-v10.js`, `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, migrations.

---

## Checks

| Check | Result |
|---|---|
| `git status -sb` (before this commit) | `## main...origin/main` — synced, no divergence |
| `node scripts/hardening-smoke-test.mjs` | 3487 passed, 0 failed |
| `node scripts/belief-engine-static-check.mjs` | 24 passed, 0 failed |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## No Deploy Needed

Docs-only checkpoint. No `public/app-v10.js`, `public/index.html`, `public/styles.css`, or `src/worker.js` changes.

---

## Summary

| Item | State |
|---|---|
| D-300 arc | COMPLETE — audit → implementation → live closeout → metadata correction |
| Home demo card | Live, static-only, clearly example-labeled |
| PROJECT_STATE.md | Now reflects D-300 live baseline as current checkpoint |
| Baseline | 3487/0/24/57 |
| Deployed Worker version | `866886a0-691f-417b-bbe6-77a2dd8ca1f2` |
| Deploy needed | No |
| Previous locks (D-297, D-295, D-293, D-291, D-285, D-287, Truth/Review, RunPack) | All confirmed preserved |
