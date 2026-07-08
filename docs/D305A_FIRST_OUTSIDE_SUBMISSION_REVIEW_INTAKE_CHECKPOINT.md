# D-305A — First Outside Submission Review Intake Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD before D-305A:** `cb4a5d1` (D-304B)

---

## Purpose

Closes the D-304 Review-intake protocol/log arc with a checkpoint, so future beta-review work starts from the correct process baseline. D-304A and D-304B were both docs/process-only tasks that did not touch `docs/PROJECT_STATE.md` — this checkpoint is the first place the arc is recorded there.

---

## GitHub Sync

`git status -sb` at the start of this task showed `## main...origin/main` — local `main` and `origin/main` are in sync, no divergence.

---

## Arc Recap

### D-304A — First outside submission Review intake protocol

Established the process for handling first outside/beta Review submissions:

- **First outside submissions are product feedback first, publishable content second.**
- **Do not approve first outside submissions just because they arrived** — the Review queue is intake/learning before it is a publishing decision.
- **What to record per item:** claim, submitter/anonymous id, created/updated dates, source path (Builder/manual/Truth-derived), whether evidence was added, whether wording is clear, whether it reads as a real attempt or junk, screenshot location if saved.
- **Six classification categories**, each mapped to a recommended action using only the existing Approve/Reject/Keep Pending decision set: Real useful claim; Real but needs better evidence; Real but too vague; Test/junk; Sensitive/high-risk; Duplicate/old internal test.
- **Seven tester follow-up questions**, tied to the D-297/D-300/D-302 flow work, to ask if a submitter is ever identified.
- **Safety boundaries reconfirmed**: Review is not proof; approval is not automatic verification; admin Review remains the only public gate; saved analysis remains private; anonymous/beta submissions are not exposed beyond normal app behavior; sensitive/political/medical/legal/financial claims are never published casually.
- **Next-action rules**: wait for a 3-submission pattern before any new product pass; no features from one odd submission; no queue-padding approvals.

Docs only. Baseline unchanged 3515/0/24/57. No app/backend/API/schema/storage changes.

### D-304B — First outside submission intake log seed

Seeded row #1 of the intake table with the first confirmed real outside submission:

| Field | Value |
|---|---|
| Claim | `People who drive fast/expensive cars are less generous to other drivers and pedestrians...` |
| Submitter | `anon-rtpuo3` |
| Source | Builder / CLAIM / REVIEW |
| Created / updated | 05/07/2026 / 06/07/2026 (per screenshot) |
| Category | Real useful claim / needs better evidence |
| Current action | Keep in Review; do not approve yet |
| Product lesson | At least one outside tester reached Builder submission and Review queue |
| Follow-up question | Did you understand what Review meant and where the claim went after submission? |

Docs only. Baseline unchanged 3515/0/24/57. No app/backend/API/schema/storage changes.

---

## D-304 Guarantees Now Recorded

| Guarantee | Value |
|---|---|
| First outside submissions must not be auto-approved | Confirmed |
| Review queue is intake/learning before it is a publishing decision | Confirmed |
| Borderline useful submissions stay in Review until wording/evidence/public meaning are safe | Confirmed |
| Do not approve borderline claims just to make public feed look active | Confirmed |
| Wait for at least 3 outside submissions before drawing pattern conclusions | Confirmed |
| Create a product pass only if repeated confusion appears | Confirmed |
| Do not add features from one odd submission | Confirmed |
| Do not publish sensitive/political/medical/legal/financial claims casually | Confirmed |
| Review remains admin approval, not proof | Confirmed |
| Approval is not automatic verification | Confirmed |
| Saved analysis remains private | Confirmed |
| Anonymous/beta tester submissions are not exposed beyond normal app behavior | Confirmed |

---

## Previous Locks Preserved (Confirmed Unchanged by D-304)

**D-302 Home vocabulary glossary:**
- Glossary summary: `HumanX words` — preserved
- Glossary remains collapsed by default — preserved
- Review definition does not describe Review as proof or verification — preserved
- Inaccurate Truth wording (`Truth — a claim approved for public display after Review`) remains absent — confirmed

**D-300 Home static demo card:**
- Demo label: `Example — not a real claim` — preserved
- Demo remains static-only — confirmed
- Demo does not submit, fetch, write, create claim IDs, or pollute Review — confirmed

**D-297 beta-readiness Home guidance:**
- Home Step 5: `"5. Track Review — submitted Truths wait for admin approval and appear in My HumanX with a Review badge."` — preserved
- Visible tab label: `My HumanX` — preserved
- Internal id: `tab-me` — preserved

**Truth/Review baseline:**
- Truth creation paths produce `review_state='review'` — unchanged
- No current route publishes directly without Review — unchanged
- Admin-only Review handles approval — unchanged
- Saved analysis does not create, submit, approve, or publish a Truth — unchanged

**RunPack/saved-analysis locks:**
- `saveAnalysisResult()` posts only to `/api/analysis` — unchanged
- Stale warning remains `claim updated since packet` — unchanged
- AI-return import remains: `rp-return-section`, `Load AI Analysis Return`, `Saving does not publish a truth automatically` — unchanged

All of the above were re-confirmed passing via the full hardening smoke suite (3515/0) run as part of this checkpoint — no regression tests for these locks were modified, and none of D-304's changes touched any test file (D-304 was pure process documentation).

---

## PROJECT_STATE.md Updates

- "Last updated" / "Previous checkpoint" header updated to D-305A
- `Current HEAD` table: added D-305A checkpoint row
- `Current baseline` section retitled "as of D-305A"; numbers unchanged (3515/0/24/57 — D-304 added no tests)
- New `### D-304 mini-arc: First outside submission Review intake protocol/log` section added (with guarantees table), inserted after the D-302 mini-arc and before the D-274→D-275 behavior reference section
- `Deployment state` table: added D-304A/D-304B/D-305A rows (all docs-only, no deploy); `Latest deployed Worker` unchanged (D-304 involved no deploy)
- `Safe next-work rules`: added rules 123–125 (log/classify before approving, no queue-padding approvals, no features from a single Review item)
- `Suggested next feature lanes`: added "First outside submission Review intake" (COMPLETE); renamed/updated "Next cold-visitor work" to "Next beta work" requiring additional outside submissions, a repeated confusion pattern, direct tester feedback, or explicit owner request before any further speculative improvement

---

## Files Changed

- `docs/D305A_FIRST_OUTSIDE_SUBMISSION_REVIEW_INTAKE_CHECKPOINT.md` — this doc
- `docs/PROJECT_STATE.md` — checkpoint, arc summary, deployment state, safe-next rules, suggested lanes updated
- `docs/README.md` — D-305A added as current checkpoint entry

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

Docs-only checkpoint. No `public/app-v10.js`, `public/index.html`, `public/styles.css`, or `src/worker.js` changes. No app changes anywhere in the D-304 arc.

---

## Summary

| Item | State |
|---|---|
| D-304 arc | COMPLETE — protocol → log seed → checkpoint |
| Review-intake protocol | Live in docs; process-only, no app change |
| First logged submission | Row #1 seeded, kept in Review, not approved |
| PROJECT_STATE.md | Now reflects the D-304 Review-intake protocol/log baseline |
| Baseline | 3515/0/24/57 (unchanged) |
| Deploy needed | No |
| Previous locks (D-302, D-300, D-297, Truth/Review, RunPack) | All confirmed preserved |
