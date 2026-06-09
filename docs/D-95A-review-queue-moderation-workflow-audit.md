# D-95A — Review Queue Moderation Workflow Audit

**Date:** 2026-06-09  
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.  
**Baseline:** hardening-smoke-test 267 / belief-engine-static-check 24 / worker-route-static-check 39

---

## A. Files Inspected

| File | Sections read |
|---|---|
| `public/app-v10.js` | `renderReviewList`, `reviewCard`, `renderReviewInspectPanel`, `reviewDecisionUI`, `reviewCleanupUI`, `markDuplicateUI`, `requestRejectReview`, `resolveSimilarUI`, `renderReviewFilterBar`, `applyReviewFilter`, `renderReviewAuditSummary`, `reviewEmptyText`, module-level state vars, window exposures |
| `public/styles.css` | `.btn-approve`, `.btn-reject`, `.btn-keep`, `.btn-reject-confirm`, `.review-inspect-top-actions`, `.review-inspect-actions`, `.review-inspect-approve`, `.review-card-selected`, `.review-inspect-panel` |
| `scripts/hardening-smoke-test.mjs` | All Review-related tests (77 found) |
| `docs/D-93C-borderline-truth-derived-policy-audit.md` | Policy constraints |
| `docs/D93D_REVIEW_TRUTH_DERIVED_CONTEXT.md` | D-93D implementation |
| `docs/D-93E-review-truth-derived-false-positive-guard-audit.md` | D-93E patch |

---

## B. Current Review Workflow Map

```
User enters admin token → Load Queue → loadReviewQueue() → /api/review
  └─ renderReviewList()
        ├─ renderReviewFilterBar(all)          ← filter chips, sort, help text
        ├─ renderReviewAuditSummary(all)        ← counts: pending/public/rejected/reported/similar/smoke/dup
        ├─ renderReviewInspectPanel(item)?      ← full-width panel ABOVE card grid (if item selected)
        └─ card grid: reviewCard(item) × N     ← per-item cards

Card row actions (per card):
  [Inspect / ▲ Inspecting]  → inspectReviewItem(id)   toggle panel
  [Approve]                  → reviewDecisionUI(type, id, 'public')    NO confirmation
  [Keep Pending]             → reviewDecisionUI(type, id, 'review')    NO confirmation
  [Reject]                   → requestRejectReview(id)  → 2-step confirm inline

Inspect panel layout (full width, above cards):
  ┌─ header: type badge + title + ✕ Close ─────────────────────────────┐
  │  nav: ← Prev  [N of total · X hints]  Next →                       │
  │  state bar: ● pending/public/rejected                               │
  │  TOP ACTIONS: [Approve]  [Keep Pending]  [Reject / 2-step]         │
  │  fields: ID, Type, State, Reports, (type-specific fields),          │
  │          Origin Path*, Review Advisory*, Borderline Hint*           │
  │  quality hints (advisory)                                           │
  │  BOTTOM ACTIONS: [Approve▲]  [Keep Pending]  [Reject]              │
  │                  [Archive test artefact?]  [Mark Duplicate...]       │
  │                  [Dismiss ~Similar]  [Open Study View ↗]            │
  └────────────────────────────────────────────────────────────────────┘
  * D-93D rows, Truth-Derived claims only

Post-decision (all paths):
  reviewDecisionUI → POST /api/review/decision → loadReviewQueue() → renderReviewList()
  Full queue reload + full DOM re-render, no scroll position preservation
  If item leaves current filter after decision → panel closes (inspectedReviewItem nulled in renderReviewList)
```

---

## C. Current Strengths

| Strength | Detail |
|---|---|
| 2-step Reject confirm | `requestRejectReview` + confirm step on both card and inspect panel — prevents accidental rejection |
| Inspect panel has Prev/Next nav | Respects current filter+sort — reviewer can work through queue without returning to card grid |
| Selected card highlight | `.review-card-selected` — blue border — makes active card visible in grid |
| Inspect button toggles state | "Inspect" → "▲ Inspecting" on active card |
| Quality hints in inspect panel | `claimQualityHints` advisory list — non-blocking, labelled "advisory" |
| Truth-Derived advisory rows (D-93D) | Origin Path / Review Advisory / Borderline Hint — contextual, clearly labelled as heuristic |
| Mark Duplicate uses modal | `hxModal` with required target ID — no accidental duplicate marking |
| Dismiss Similar uses modal | Safe: no state change, advisory only |
| Archive test artefact gated | Requires rejected + isSuspectedTestArtefact — not accidentally reachable |
| reviewEmptyText explains first-run | Pending empty state explains what the queue is for |
| Filter bar includes Truth-Derived chip | New in D-93D — allows filtering to Truth-Derived claims specifically |
| Review card shows scores in meta | Evidence score shown in scoreHint |
| 77 hardening tests cover Review | Extensive backend + frontend coverage |

---

## D. Friction Points (Ranked by Severity)

### D.1 — HIGH: Approve button has no confirmation anywhere

**On card row:** `[Approve]` → immediate `reviewDecisionUI(type, id, 'public')`. No confirm dialog, no 2-step. Reject has 2-step confirm; Approve does not.

**In inspect panel top-actions:** Same — immediate Approve, no confirm.
**In inspect panel bottom actions:** Same — immediate Approve, no confirm.

This asymmetry means a reviewer can accidentally approve a claim with one click, while rejecting takes two. The risk is real: on a long queue, a reviewer scanning cards quickly could click Approve intending to click Inspect.

**Impact:** A wrongly-approved claim becomes immediately public with no undo path in the current UI.

### D.2 — MEDIUM: Two Approve buttons in the inspect panel

The panel contains Approve in two places:
1. **Top actions** (`review-inspect-top-actions`): `[Approve]  [Keep Pending]  [Reject]` — just `btn-approve` class, **no green color** (only `font-weight:800`)
2. **Bottom actions** (`review-inspect-actions`): `[Approve]  [Keep Pending]  [Reject] ...` — `btn-approve review-inspect-approve` class, **green gradient**

Result: same action available twice, with different visual styles. The top Approve looks like a default button (just bold); the bottom Approve is distinctly green. A reviewer who approves from the top may not register it as the primary action.

**Impact:** Visual inconsistency. Reviewer may not understand which Approve is authoritative. Top actions row is above the fields, so if a reviewer clicks Approve before reading the fields (including Review Advisory / Borderline Hint), they bypass the advisory context.

### D.3 — MEDIUM: No scroll-to-panel after clicking Inspect on a card below the fold

`inspectReviewItem` calls `renderReviewList()` which does a full DOM re-render. The panel is placed at the top of the grid. If a reviewer has scrolled down and clicks Inspect on a card near the bottom, the panel appears at the top of the `#reviewList` div — off screen. There is no `scrollIntoView` or `scrollTo` targeting the panel.

`scrollTo` exists in the codebase but is used only in Study mode. Not used in `renderReviewList`.

**Impact:** Reviewer clicks Inspect, nothing visually appears to happen, content has been inserted above the scroll position.

### D.4 — MEDIUM: Full queue reload after every decision causes scroll loss

`reviewDecisionUI` calls `await loadReviewQueue()` followed by `renderReviewList()`. This re-fetches the entire queue from `/api/review` and re-renders the full card grid. No scroll position is preserved. A reviewer working through a large queue returns to the top of the grid after every Approve/Keep/Reject.

**Impact:** Friction increases proportionally with queue size. The Prev/Next nav in the inspect panel partially mitigates this (if panel stays open), but the panel closes when an item leaves the current filter.

### D.5 — LOW: Panel closing after Approve/Reject is silent

When a reviewed item is approved or rejected from the Pending filter, `renderReviewList` removes it from the filtered list, nulls `inspectedReviewItem`, and the panel disappears. There is no transition or "item handled" state to confirm what happened.

**Impact:** Reviewer may momentarily lose context about whether the action succeeded, especially if the toast is missed (bottom of screen, briefly visible).

### D.6 — LOW: Approve button on card has no visual danger distinction from Keep Pending

On the card action row, order is: `[Inspect]  [Approve]  [Keep Pending]  [Reject]`. Approve is bold; Keep Pending is muted. However, both are similar in size and proximity. Inspect is first (safe), then Approve (consequential), then Keep (safe), then Reject (dangerous but confirmed). The Approve button being second in a row of four, just after Inspect, makes accidental click plausible on small screens or touch.

---

## E. Safety Risks (Ranked by Severity)

### E.1 — HIGH: Approve on Truth-Derived + category-echo claim is one click from card row

The D-93D advisory badges (`category-echo`, `? borderline origin`) appear on the card and in the inspect panel. However, the card row's Approve button fires immediately with no confirmation, before the reviewer has seen the inspect panel fields. A reviewer could approve `clm_30889d651e3b4b2cb6` (`SMALL INDEFERENT TRUTH`) from the card row in a single click without reading the Review Advisory note.

**Mitigation in place:** Advisory badges on card are visible before click. Quality hints also visible.  
**Gap:** No blocking gate for Truth-Derived claims with category-echo.  
**Policy constraint:** Do not add automatic blocking — advisory only. But a soft confirm on Approve from the card row would help.

### E.2 — MEDIUM: Approve-from-top-actions bypasses advisory fields in inspect panel

Top actions (Approve/Keep/Reject) appear BEFORE the fields in the panel layout. A reviewer who acts from the top actions has not scrolled through `Review Advisory` or `Borderline Hint` fields. The field order is: state bar → **top actions** → fields → quality hints → **bottom actions**. The top Approve is above the advisory information.

**Safe counterpoint:** The card badges are already visible before opening inspect. The Inspect panel is opened by intent. But layout ordering could be improved.

### E.3 — MEDIUM: No protection against approving a rejected claim back to public

A rejected item remains visible in the queue under All/Rejected filters. Its inspect panel still shows Approve. Clicking Approve on a previously-rejected item re-publishes it. There is no warning that the item was previously rejected.

**Impact:** Accidental re-publication of a claim that was deliberately hidden. The state bar shows "rejected" clearly, so this requires reading the state before acting — but the Approve button is still active.

### E.4 — LOW: Duplicate marking has no verification of target ID validity

`markDuplicateUI` requires a `clm_...` target ID input. The modal does a client-side `if(!targetId)` guard but does not validate the format or confirm the target exists before posting. If an admin types a wrong ID, the duplicate link is set to a nonexistent claim.

**Backend presumably validates** this (foreign key or existence check), but the frontend gives no pre-submission feedback.

### E.5 — LOW (policy): Rejecting a socially real belief on quality hint grounds

The `~Quality` filter and quality hints in the inspect panel might nudge a reviewer toward rejecting a claim that is simply controversial, not malformed. The quality hints are marked `(advisory — not blocking)` which is correct, but the path from "review advisory: category-echo" → Reject is only one click on the card row.

**Current safeguard:** Reject is 2-step confirmed. Quality hints say "advisory — not blocking."

---

## F. Implementation Notes

| Observation | Detail |
|---|---|
| `inspectedReviewItem` persists across filter changes | If a reviewer changes filter while a panel is open, panel stays for items still in the new filter, closes for items that are out. Good behavior. |
| Filter counts use `all` list (not filtered) | `renderReviewFilterBar(all)` — all filter chips show counts over the full loaded queue, not the filtered subset. Correct and expected behavior. |
| `reviewDecisionUI` does not reset `inspectedReviewItem` | The panel close is handled implicitly by `renderReviewList`. No explicit close action. Means panel stays for non-pending filters (e.g., approving from All filter keeps panel open showing new public state). |
| `loadGraphStatus().catch(()=>{})` on every decision | Graph status updates after decisions, failure is non-fatal. Good. |
| Error handling is `toast(e.message)` only | No retry mechanism; no detailed error display. Acceptable for admin UI. |
| `hxModal` used for Mark Duplicate | Proper modal with required field guard. Safe. |
| No stale inspect panel risk | After decision, full reload always gets fresh data before re-render. |
| `claimQualityHints` skipped for truth/evidence/pressure | Correct — quality hints are claim-specific. |

---

## G. Test Coverage Assessment

**77 hardening tests** cover Review — strong backend/route coverage (cleanup gates, duplicate logic, pressure review, archived metadata) and growing frontend coverage (D-90C, D-91B, D-93D, D-93E).

**Gaps worth noting for future:**
- No test verifies that Approve on card row does NOT use a confirm dialog (current documented behavior)
- No test verifies that Reject on card row DOES use 2-step confirm (requestRejectReview)
- No test verifies inspect panel position in DOM (above cards)
- No test verifies inspect panel Prev/Next navigation logic
- No test for reject → re-approve path (no current protection, acceptable gap for now)
- No test that `reviewDecisionUI` does NOT reset `inspectedReviewItem` before re-render

---

## H. Recommended Next Patches

### H.1 Safe now / frontend-only

| ID | Change | Risk | Rationale |
|---|---|---|---|
| UI-1 | Give top-actions Approve the same green style as bottom inspect-approve (`review-inspect-approve`) | Very low — CSS only | Eliminates visual inconsistency between two Approve buttons in inspect panel |
| UI-2 | Add `scrollIntoView` on the inspect panel element after `inspectReviewItem` opens it | Low — one DOM call after render | Fixes scroll-to-top problem when clicking Inspect on below-fold cards |
| UI-3 | Add a "currently reviewing" label in the inspect panel header noting the item's state clearly before top actions | Low — display only | Improves reviewer awareness before acting from top actions |

### H.2 Requires backend / schema / API thought

| ID | Change | Why deferred |
|---|---|---|
| UI-4 | Soft confirm on card-level Approve (especially for Truth-Derived + category-echo claims) | Needs policy decision: when is confirm appropriate? For all claims? Only flagged ones? Adds friction to normal workflow |
| UI-5 | "Undo" / Re-queue path for accidentally-approved claims | Requires backend state machine change; approved items can already be rejected (same button) so effectively this exists but is not surfaced as "undo" |
| UI-6 | Validate duplicate target ID client-side before modal submission | Requires `/api/claim/:id` check or a search helper; minor network addition |

### H.3 Reject / do not build

| ID | Rejected change | Reason |
|---|---|---|
| X-1 | Automatic blocking of category-echo claims at Approve | Policy constraint: advisory only, no gates |
| X-2 | Auto-reject borderline-origin claims | Policy constraint: borderline is not artefact |
| X-3 | Remove Approve from card row | Would break primary workflow for clean claims |
| X-4 | Require inspect panel before approving | Too disruptive to normal moderate-queue flow |
| X-5 | Show "rejected by X" history on re-approval path | Requires audit log backend feature |

---

## I. Suggested D-95B Scope

**One small safe frontend-only patch:**

**D-95B: Inspect panel Approve visual consistency + scroll-to-panel fix**

Changes:
1. **CSS only**: Add `review-inspect-approve` class (green gradient) to the top-actions Approve button in `renderReviewInspectPanel`, so both Approve buttons in the panel are visually identical — green, weighted, clearly primary.
2. **JS — one line**: After `renderReviewList()` DOM update in `inspectReviewItem`, call `document.querySelector('.review-inspect-panel')?.scrollIntoView({behavior:'smooth',block:'start'})` to bring the panel into view when opened from a below-fold card.

Both changes are read-display only — no decision behavior change, no new action paths, no backend involvement, no moderation logic change.

**Estimated hardening tests to add:** ~3 (top-actions Approve has green class; scrollIntoView call present in inspectReviewItem; both Approve buttons in panel share same visual class)

---

## J. No Mutation Confirmation

> No code changes were made during this audit.  
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.  
> No live data was mutated.  
> `tru_67ae90e56f7449ee85` and `clm_30889d651e3b4b2cb6` are unchanged.

---

## K. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **267 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
