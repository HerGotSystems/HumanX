# D-244A — Review Next-Item Flow Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Baseline:** 2638 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D244A_REVIEW_NEXT_ITEM_FLOW_MILESTONE_CHECKPOINT.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Update the authoritative project checkpoint (`docs/PROJECT_STATE.md`) after the completed D-242 → D-243 review next-item flow mini-arc. Records the arc summary, current next-item behavior guarantees, privacy state, deployment state, Drift/Belief expansion state, and safe next-work rules.

---

## D-242 → D-243 Mini-Arc Summary

| Task | Commit | What it delivered |
|------|--------|------------------|
| D-242A | `6189bf8`/`1226341` | Audit — found F-1 (no mouse-path next-item affordance); 7 guard tests; D-98B noscript test aligned with upstream Drift/Belief merge |
| D-242B | `4f2e031` | "Open next item →" button in D-230A feedback banner; `reviewDecisionFeedbackNextId` state; candidate capture before reload; post-reload validity; 24 tests |
| D-242C | `443bcc6` | D-242B confirmed live; 34/34 PASS (owner deploy 2026-07-01) |
| D-243A | `d24b5ea` | Regression lock — 34 tests across 7 categories; docs only; no deploy |

**Tests added in arc:** 7 + 24 + 34 = **65 new tests**
**Total hardening smoke after arc:** 2638 passed / 0 failed
**Deploys in arc:** 1 (D-242C — owner manual terminal)
**Docs/tests-only tasks:** D-242A, D-243A, D-244A

---

## Current Baseline

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2638 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**Known warn:** `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Review Next-Item Flow Guarantees

### Post-decision affordance

| Decision | Feedback banner | Next-item button |
|----------|----------------|-----------------|
| Approve (→ public) | "Approved review item." | "Open next item →" when valid next item exists |
| Reject (→ rejected) | "Rejected review item." | "Open next item →" when valid next item exists |
| Keep Pending (→ review) | "Kept review item." | Not shown — item stays open in inspect panel |
| No next item / last in queue | Normal message | Not shown |

### Manual-only / no auto-moderation

- Button calls `clearReviewDecisionFeedback()` + `inspectReviewItem(nextId)` — no decision made
- Does not call `reviewDecisionUI`, `fetch`, or `api()`
- Nothing fires automatically — moderator must click

### Candidate capture

- Computed from `applyReviewSort(applyReviewFilter(reviewQueue.review))` **before** `loadReviewQueue()` call
- Prefers `index + 1` (next in list), falls back to `index - 1` if at end
- Only computed for Approve (`'public'`) and Reject (`'rejected'`) — not for Keep Pending (`'review'`)
- Stored in `reviewDecisionFeedbackNextId` module-level variable

### Post-reload validity

- After reload, `(reviewQueue.review||[]).find(i => i.id === reviewDecisionFeedbackNextId)` must return truthy
- If candidate left the queue (e.g. further action, reload edge case), button is suppressed

### Filter/sort respect

- Candidate is derived from `applyReviewSort(applyReviewFilter(...))` — same computation as inspect-panel ← Prev / Next → nav and `initReviewKb`

### Dismiss

- `clearReviewDecisionFeedback()` clears both `reviewDecisionFeedback` and `reviewDecisionFeedbackNextId`, then calls `renderReviewList()`

### Keyboard advance unchanged

- `initReviewKb` A+A / R+R / K `_advanceId` pre-capture → `inspectReviewItem(_advanceId)` in `.then()` — not touched

---

## Privacy / Public Exposure Guarantees

All of the following are confirmed absent from `renderPublicProfileHtml` (locked by D-243A):
- `reviewDecisionFeedbackNextId`
- `review-feedback-next`
- `"Open next item"`

No new public data fields introduced in D-242→D-243. No backend/API/migration/schema/CSP/external asset changes.

---

## Drift/Belief Expansion State

The upstream `belief-drift-expansion` branch was merged into main around D-242A. It added `public/belief-drift-expansion.js` and modified `public/index.html` (simplified noscript fallback). D-242A fixup aligned the D-98B noscript smoke test with the new noscript content. All D-242B, D-242C, D-243A, and D-244A left Drift/Belief expansion files untouched.

**Rule:** Do not touch `public/belief-drift-expansion.js` or `public/index.html` during Review queue work unless a failing test requires a minimal, explicitly documented compatibility fix.

---

## Deployment State

| Task | State |
|------|-------|
| D-242A | Audit / tests / docs only — no deploy needed |
| D-242B | Owner deploy PASS — D-242C confirmed live (34/34) |
| D-243A | Tests / docs only — no deploy needed |
| D-244A | Docs only — **no deploy needed** |
| **Current** | **No deploy needed** |

---

## Safe Next Lanes

These are suggestions only. Do not start any without explicit assignment.

| Lane | Notes |
|------|-------|
| Compact review card metadata/status chips audit | Denser card for long queues — better scan without inspect |
| Review search/filter clarity | Filter chip accessibility; counts; empty-state copy per-filter |
| Study entry button style consistency | D-239A F-2–F-4 remaining findings |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| Duplicate canonical/merge backend spec | Requires backend/API spec before any implementation |

---

## Future Rules

> 1. Any task touching the feedback banner, `reviewDecisionUI`, `renderReviewList` feedback rendering, or `inspectReviewItem` must either pass all D-243A regression tests unchanged, or update the D-243A lock with explicit owner approval before merging.
>
> 2. Do not turn "Open next item →" into auto-moderation. The button must remain navigation-only (`inspectReviewItem` only, no `reviewDecisionUI` call).
>
> 3. Do not add auto-advance preference persistence (`localStorage`/`sessionStorage`/backend) without a separate owner-approved spec.
>
> 4. Do not change `initReviewKb` keyboard advance behavior without a separate review-flow spec.
>
> 5. Do not touch `public/belief-drift-expansion.js` or `public/index.html` during Review queue work unless a failing test requires a minimal documented fix.
