# D-303A — Home Collapsed HumanX Words Glossary Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD before D-303A:** `2270746` (D-302C live closeout)

---

## Purpose

Closes the D-302 cold-visitor vocabulary clarity arc with a checkpoint, so future onboarding/cold-visitor work starts from the correct live baseline. Records the D-302A → D-302B → D-302C chain in one place and updates `docs/PROJECT_STATE.md` accordingly.

---

## GitHub Sync

`git status -sb` at the start of this task showed `## main...origin/main` — local `main` and `origin/main` are in sync, no divergence, confirming the owner's D-302C push landed before this checkpoint began.

---

## Arc Recap

### D-302A — Cold-visitor vocabulary clarity product pass

22-question product pass. **Conclusion: real vocabulary gaps remained after D-297 (Home Step 5) and D-300 (before/after demo card).** My HumanX was never defined on Home (only a tab/button label); Truth vs. Claim was only connected in one deep Actions card; Evidence had only a 3-word pipeline tagline; Review was named at Step 3 before being defined at Step 5. The task's suggested Truth wording (`"a claim approved for public display after Review"`) was evaluated and found **inaccurate** — it inverts HumanX's real Truth→Claim conversion direction and contradicts the existing Truth Actions-card copy. Corrected wording was provided. Recommended a single collapsed `<details>/<summary>` "HumanX words" glossary, placed below the D-300 demo card and above Actions. Docs only. Baseline unchanged 3487/0/24/57.

### D-302B — Home collapsed HumanX words glossary (implementation)

Implemented the D-302A recommendation in `renderHome()`:

- Placed directly below the D-300 "See it work" demo card, above the "Actions" section
- Summary label: `HumanX words`, rendered as bare `<summary>HumanX words</summary>` (no attributes)
- Collapsed by default — no `open` attribute
- Five one-line definitions using the corrected D-302A wording (Claim, Truth, Review, Evidence, My HumanX)
- Inaccurate suggested Truth wording confirmed absent from `app-v10.js`
- No CSS changes — reused existing `cc-section`/`panel`/`small` classes
- No backend/API/schema/storage changes
- 28 new regression tests + 3 pre-existing D-159B slice-window widenings (renderHome grew by 666 chars)
- Baseline 3487 → 3515/0/24/57

### D-302C — Live closeout

- Owner deploy PASS
- **36/36 live sanity PASS**
- Deployed Worker version: not captured

---

## D-302 Guarantees Now Live (Recorded)

| Guarantee | Value |
|---|---|
| Glossary summary | `HumanX words` |
| Collapsed by default | Yes — no `open` attribute |
| Placement | Below `Example — not a real claim` (D-300 demo label), above Home Actions section |
| Includes | Claim, Truth, Review, Evidence, My HumanX |
| Review definition | Preserves "admin approval / waiting for approval" |
| Review not described as proof | Confirmed |
| Review not described as verification | Confirmed |
| Evidence definition | Uses support/challenge/reasons/sources language |
| My HumanX definition | Says private/owner dashboard |
| Inaccurate Truth wording (`Truth — a claim approved for public display after Review`) | Confirmed absent |

---

## Previous Locks Preserved (Confirmed Unchanged by D-302)

**D-300 Home static demo card:**
- Demo label: `Example — not a real claim` — preserved
- Demo explanation: `"HumanX turns a raw thought into a structured claim, shows what would need evidence, and keeps public Truths behind Review."` — preserved
- Review label: `Review — example only, not verified` — preserved
- Demo remains static-only — confirmed
- Demo does not submit, fetch, write, create claim IDs, or pollute Review — confirmed

**D-297 beta-readiness Home guidance:**
- Home Step 5: `"5. Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge."` — preserved
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

**Truth/Review baseline:**
- Truth creation paths produce `review_state='review'` — unchanged
- No current route publishes directly without Review — unchanged
- Admin-only Review handles approval — unchanged
- Saved analysis does not create, submit, approve, or publish a Truth — unchanged

**RunPack/saved-analysis locks:**
- `saveAnalysisResult()` posts only to `/api/analysis` — unchanged
- Stale warning remains `claim updated since packet` — unchanged
- AI-return import remains: `rp-return-section`, `Load AI Analysis Return`, `Saving does not publish a truth automatically` — unchanged

All of the above were re-confirmed passing via the full hardening smoke suite (3515/0) run as part of this checkpoint — no regression tests for these locks were modified.

---

## PROJECT_STATE.md Updates

- "Last updated" / "Previous checkpoint" header updated to D-303A
- `Current HEAD` table: added D-303A checkpoint row
- `Current baseline` section retitled "as of D-303A"; numbers updated `3487` → `3515`
- New `### D-302 mini-arc: Home collapsed HumanX words glossary` section added (with guarantees table), inserted after the D-300 mini-arc and before the D-274→D-275 behavior reference section
- `Deployment state` table: added D-301A/D-302A/D-302B/D-302C/D-303A rows; `Latest deployed Worker` updated to "not captured (D-302B/C, 2026-07-08)"
- `Safe next-work rules`: added rules 120–122 (glossary Review-as-proof lock, collapsed/low-weight default lock, term-meaning-change audit requirement)
- `Suggested next feature lanes`: added "Home collapsed HumanX words glossary" (COMPLETE); updated "Next cold-visitor work" to require a concrete confusion/Review-queue signal rather than speculative polish

---

## Files Changed

- `docs/D303A_HOME_COLLAPSED_HUMANX_WORDS_GLOSSARY_CHECKPOINT.md` — this doc
- `docs/PROJECT_STATE.md` — checkpoint, baseline, arc summary, deployment state, safe-next rules, suggested lanes updated
- `docs/README.md` — D-303A added as current checkpoint entry

**Not modified:** `scripts/hardening-smoke-test.mjs`, `public/app-v10.js`, `public/index.html`, `public/styles.css`, `public/belief-drift-expansion.js`, `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, migrations.

---

## Checks

| Check | Result |
|---|---|
| `git status -sb` (before this commit) | `## main...origin/main` — synced, no divergence |
| `node scripts/hardening-smoke-test.mjs` | 3515 passed, 0 failed |
| `node scripts/belief-engine-static-check.mjs` | 24 passed, 0 failed |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## No Deploy Needed

Docs-only checkpoint. No `public/app-v10.js`, `public/index.html`, `public/styles.css`, or `src/worker.js` changes.

---

## Summary

| Item | State |
|---|---|
| D-302 arc | COMPLETE — audit → implementation → live closeout |
| Home glossary | Live, collapsed by default, corrected vocabulary |
| PROJECT_STATE.md | Now reflects D-302 live baseline as current checkpoint |
| Baseline | 3515/0/24/57 |
| Deployed Worker version | Not captured (D-302B/C) |
| Deploy needed | No |
| Previous locks (D-300, D-297, D-295, D-293, D-291, Truth/Review, RunPack) | All confirmed preserved |
