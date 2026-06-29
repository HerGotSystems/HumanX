# D-232A — Review Ergonomics Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 2403 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/D232A_REVIEW_ERGONOMICS_MILESTONE_CHECKPOINT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Update the authoritative project checkpoint (`docs/PROJECT_STATE.md`) after the completed D-227→D-231 review queue ergonomics arc. Records the arc summary, current baseline, review queue behavior state, privacy/public boundary update, deployment history, and safe-next-work rules for future review UI changes.

---

## Review ergonomics arc summary (D-227→D-231)

| Task | Type | What it added |
|------|------|---------------|
| D-227A | Audit | Scanability audit — 6 friction points, 5 improvement slices; docs only |
| D-227B/C | Feature + live closeout | `data-review-selected="true"` on selected card; `scrollSelectedReviewCardIntoView()` via RAF; stronger `.review-card-selected` CSS |
| D-228A/B | Feature + live closeout | `withReviewScrollPreserved(fn)` wrapping 9 pure local re-renders; `inspectReviewItem` excluded |
| D-229A/B | Feature + live closeout | `data-review-confirming` attribute; `review-confirm-armed`; `review-card-approve-pending`; neutral amber cleanup styling |
| D-230A/B | Feature + live closeout | `reviewDecisionFeedback` state; `clearReviewDecisionFeedback()`; `role="status" aria-live="polite"` banner with Dismiss |
| D-231A | Regression lock | 37 tests across 7 categories — behavior locked across all four features |

**Tests added in arc:** 113 new (2290 → 2403)
**Deploys in arc:** 4 (D-227C, D-228B, D-229B, D-230B — all owner manual terminal deploy + live sanity PASS)

---

## Current baseline

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2403 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug` — parameterised route, D-218A documented limitation, non-blocking.

---

## Review queue behavior state (confirmed live)

- Inspect marks selected card with `data-review-selected="true"` — confirmed D-227C
- `scrollSelectedReviewCardIntoView()` fires via RAF after inspect panel scroll — confirmed D-227C
- Filter/sort/confirm arm-cancel/audit-toggle preserve scroll via `withReviewScrollPreserved` — confirmed D-228B
- `inspectReviewItem` excluded from scroll preservation so D-227B card scroll wins — confirmed D-228B
- Armed state emits `data-review-confirming="reject|approve|cleanup"` — confirmed D-229B
- `review-confirm-armed` class on actions containers when armed — confirmed D-229B
- `review-card-approve-pending` green highlight when approve armed — confirmed D-229B
- Cleanup confirm uses neutral amber styling (not reject red) — confirmed D-229B
- Decision feedback banner shows "Approved / Kept / Rejected review item." after success — confirmed D-230B
- Banner uses `role="status" aria-live="polite"` and does not steal focus — confirmed D-230B
- Dismiss button (`type="button"`) clears banner only, not queue — confirmed D-230B
- All of the above locked by D-231A regression tests (37 tests)

---

## Moderation guarantees (unchanged throughout arc)

- `/api/review/decision` POST route: unchanged
- Decision values: `'public'` (approve) / `'rejected'` (reject) / `'review'` (keep pending): unchanged
- Payload fields: `targetType`, `targetId`, `decision`: unchanged
- Two-step confirm flow: unchanged
- Keyboard shortcuts (A/R/K/[]/Esc): unchanged
- `reviewDecisionUI` toast call: unchanged (still fires alongside new feedback banner)

---

## Privacy / public exposure guarantees

Confirmed via D-231A public exposure lock tests (5 tests):

- `renderPublicProfileHtml` does not contain `data-review-selected`
- `renderPublicProfileHtml` does not reference `withReviewScrollPreserved`
- `renderPublicProfileHtml` does not contain `review-confirm-armed` or `data-review-confirming`
- `renderPublicProfileHtml` does not contain decision-feedback copy or `review-decision-feedback` class
- `renderPublicProfileHtml` does not contain `reviewDecisionUI`, `requestApproveReview`, or `requestRejectReview`

No new public data fields, no backend/API/schema changes in the D-227→D-231 arc.

---

## Deploy state

| Task | Deploy |
|------|--------|
| D-227A | Docs only — no deploy |
| D-227B | Owner deploy + D-227C live sanity 20/20 PASS |
| D-228A | Owner deploy + D-228B live sanity 25/25 PASS |
| D-229A | Owner deploy + D-229B live sanity 23/23 PASS |
| D-230A | Owner deploy + D-230B live sanity 24/24 PASS |
| D-231A | Tests/docs only — no deploy |
| D-232A | Docs only — no deploy |
| **Current** | **No deploy needed** |

---

## Safe next lanes (suggestions only — do not start without assignment)

| Lane | Notes |
|------|-------|
| Duplicate/near-duplicate review UX | D-227A F-5 follow-on — advisory-to-action upgrade, resolution flow audit |
| Compact review card metadata/status chips | Denser card for long queues |
| Review queue next-item flow | Auto-advance after decision |
| Review search/filter clarity | Filter chip accessibility; empty-state per-filter; counts |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing |

---

## Confirmations

- **App/CSS unchanged:** Confirmed
- **Worker unchanged:** Confirmed
- **No new public data fields:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantics change:** Confirmed
- **D-227→D-231 arc behavior locked:** Confirmed (D-231A, 37 tests)
- **Privacy boundary intact:** Confirmed (D-231A public exposure lock, D-216A allowlist active)
- **Deploy needed:** No
