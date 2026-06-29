# D-229A — Review Queue Confirm-State Clarity

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — live PASS (D-229B)
**Baseline:** 2347 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D229A_REVIEW_QUEUE_CONFIRM_STATE_CLARITY.md`, `docs/README.md`
**App UI changes:** Yes — `reviewCard` and `renderReviewInspectPanel`
**CSS changes:** Yes — 4 new rule blocks
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes

---

## Purpose

Address D-227A friction point F-3: duplicated action buttons with non-obvious armed state and inconsistent CSS reuse. When a moderator clicks Approve or Reject to arm the two-step confirm, the UI should make the armed state unambiguous — which action is pending, and what clicking confirm will do.

---

## What changed

### `public/app-v10.js` — `reviewCard`

**`data-review-confirming` attribute** on the card `<article>` element:
- `data-review-confirming="reject"` when reject is armed
- `data-review-confirming="approve"` when approve is armed
- Absent when no action is armed

**`review-card-approve-pending` class** on card `<article>` when approve is armed — mirrors the existing `review-card-reject-pending` class. Gives a green card-level highlight equivalent to the existing red reject highlight.

**`review-confirm-armed` class** on the card `.review-actions` div when either reject or approve is armed — subtle container highlight indicating an action is in progress.

### `public/app-v10.js` — `renderReviewInspectPanel`

**`data-review-confirming` attribute** on the `.review-inspect-actions` div:
- `data-review-confirming="approve"` when approve is armed
- `data-review-confirming="reject"` when reject is armed
- `data-review-confirming="cleanup"` when cleanup is armed
- Absent when no action is armed

**`review-confirm-armed` class** on the `.review-inspect-actions` div when any action is armed.

**Cleanup section reclassed** — previously reused reject classes (`review-reject-confirm-msg`, `btn-reject-confirm`, `btn-reject-cancel`), which made cleanup visually indistinguishable from reject. Now uses neutral amber classes:
- `review-cleanup-confirm-msg` — amber text, not red
- `btn-cleanup-confirm` — amber button
- `btn-cleanup-cancel` — same neutral cancel as others

Copy update: "Archive this test artefact?" → "Archive this test artefact? It will be removed from the active queue." — makes the outcome explicit.

### `public/styles.css`

Four new rule blocks after the existing approve confirm block:

```css
/* card-level approve-pending highlight (mirrors review-card-reject-pending) */
.review-card-approve-pending{border-color:#2fbf7188!important;box-shadow:0 0 0 1px #2fbf7122}

/* armed confirm actions wrapper */
.review-confirm-armed{background:rgba(255,255,255,.03);border-radius:8px;padding:4px 6px;outline:1px solid rgba(255,255,255,.08)}

/* cleanup confirm state (neutral amber — not reject red) */
.review-cleanup-confirm-msg{font-size:11px;font-weight:600;color:#ffd166;display:flex;align-items:center;flex:1 1 100%;padding:2px 0}
.btn-cleanup-confirm{background:linear-gradient(135deg,#3d2b00,#1e1500);border:1px solid #ffd16688!important;color:#ffd166;font-weight:700}
.btn-cleanup-confirm:hover{background:linear-gradient(135deg,#5c4000,#3d2b00)}
.btn-cleanup-cancel{background:#0b0e16;border:1px solid var(--line);color:var(--muted)}
```

---

## Confirm-state summary

| Action armed | Card class | Inspect div attr | Copy |
|---|---|---|---|
| Reject | `review-card-reject-pending` + `review-confirm-armed` | `data-review-confirming="reject"` + `review-confirm-armed` | "Reject? It will not become public." |
| Approve | `review-card-approve-pending` + `review-confirm-armed` | `data-review-confirming="approve"` + `review-confirm-armed` | "Approve this item? It will become public." |
| Cleanup | — (inspect panel only) | `data-review-confirming="cleanup"` + `review-confirm-armed` | "Archive this test artefact? It will be removed from the active queue." |

---

## Moderation semantics — unchanged

- Two-step confirm flow: **unchanged** — arm then confirm is still required
- Approve / Keep Pending / Reject backend outcomes: **unchanged**
- Keyboard shortcuts (A/R/K/[]/Esc): **unchanged**
- `reviewDecisionUI` route and payloads: **unchanged**

## D-227B / D-228A compatibility

- `data-review-selected="true"` still emitted by `reviewCard` (D-227B intact)
- `scrollSelectedReviewCardIntoView` still called by `inspectReviewItem` (D-227B intact)
- `withReviewScrollPreserved` still used in `requestRejectReview` / `requestApproveReview` / cancel handlers (D-228A intact)

---

## No backend/API/migration/schema/CSP/external asset changes

Confirmed. All changes are frontend HTML attributes, CSS classes, and copy only.

---

## New/updated tests (D-229A — 20 new + 3 D-129B window fixes)

**New D-229A tests (20):**
1. Card emits `data-review-confirming="reject"` when reject armed
2. Card emits `data-review-confirming="approve"` when approve armed
3. Card adds `review-card-approve-pending` when approve armed
4. Card actions div gets `review-confirm-armed` when armed
5. Card cancel buttons still present in armed state
6. Inspect panel emits `data-review-confirming` for all three armed states
7. Inspect actions div gets `review-confirm-armed` when armed
8. Cleanup uses `review-cleanup-confirm-msg` (not reject class)
9. Cleanup uses `btn-cleanup-confirm` (not btn-reject-confirm)
10. Cleanup cancel uses `btn-cleanup-cancel` (not btn-reject-cancel)
11. CSS has `review-card-approve-pending`
12. CSS has `review-confirm-armed`
13. CSS has `review-cleanup-confirm-msg`
14. CSS has `btn-cleanup-confirm`
15. Backend routes unchanged — `/api/review/decision` present
16. `reviewDecisionUI` handles public/rejected/review
17. D-227B `data-review-selected` still emitted (regression)
18. D-228A `withReviewScrollPreserved` still in `requestRejectReview` (regression)
19. Public profile does not include confirm-state classes
20. Deploy integrity — D-229A tag absent from worker.js

**D-129B window fixes (3):** Slice windows extended (700→1000, 5400→6000) because `confirmingAttr` and inspect panel `data-review-confirming` attributes push content beyond previous windows. Tests still assert the same content — no weakening.

---

## Live sanity checklist — D-229B PASS (2026-06-29)

Owner deploy completed from terminal. All 23 live sanity items confirmed PASS.

- [x] Deploy via `wrangler deploy` from owner terminal — PASS
- [x] Open Review tab with admin token — PASS
- [x] Queue loads without console-breaking errors — PASS
- [x] Arming Reject clearly shows reject confirm state — PASS
- [x] Reject armed card/panel has `data-review-confirming="reject"` — PASS
- [x] Reject armed actions have `review-confirm-armed` — PASS
- [x] Reject confirm/cancel still work — PASS
- [x] Arming Approve clearly shows approve confirm state — PASS
- [x] Approve armed card/panel has `data-review-confirming="approve"` — PASS
- [x] Approve armed card has `review-card-approve-pending` (green border) — PASS
- [x] Approve confirm/cancel still work — PASS
- [x] Arming Keep/Cleanup clearly shows neutral cleanup/keep confirm state — PASS
- [x] Cleanup armed panel has `data-review-confirming="cleanup"` — PASS
- [x] Cleanup confirm/cancel still work — PASS (amber button, not red)
- [x] Confirm copy is understandable and not scary/overstated — PASS
- [x] Two-step confirm behavior unchanged — PASS
- [x] Keyboard shortcuts unchanged — PASS
- [x] Filters/sort unchanged — PASS
- [x] D-227B selected-card marker still works — PASS
- [x] D-228A scroll preservation still works for confirm arm/cancel — PASS
- [x] Public profile pages do not contain review confirm classes/copy — PASS
- [x] No backend/API behavior changed — PASS
- [x] No console errors — PASS

**Hardening smoke (post-deploy):** 2347 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug`)

---

## Confirmations

- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No moderation semantics change:** Confirmed
- **Deploy needed:** No — deploy complete, live PASS recorded (D-229B)
