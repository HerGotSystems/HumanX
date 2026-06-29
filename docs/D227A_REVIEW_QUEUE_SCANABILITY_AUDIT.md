# D-227A — Review Queue Scanability Audit

**Scope:** Docs only (no app/CSS/worker changes)
**Status:** COMPLETE
**Baseline:** 2290 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D227A_REVIEW_QUEUE_SCANABILITY_AUDIT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Deploy needed:** No

---

## Purpose

Audit the current Review/moderation UI before making ergonomic changes. This document records the exact current behaviour, identifies concrete friction points supported by code, and proposes safe improvement slices.

---

## 1. Current UI Structure

### Entry point
- Review tab (`#tab-review`) is hidden unless `adminToken()` returns a value (`boot()` line 108).
- `renderReview()` (line 385) initialises keyboard handler, clears side-tools, and injects the admin-token form into `#main`.
- If a token is present, it immediately calls `loadReviewQueue()` → `renderReviewList()`.

### List layout
`renderReviewList()` (line 406) assembles the `#reviewList` grid in this fixed order:
1. `renderReviewFilterBar(all)` — filter chips + sort select
2. `renderReviewOverviewStrip(all)` — summary pill row
3. `renderReviewAuditSummary(all)` — collapsible audit stats block
4. `renderReviewInspectPanel(inspectedItem)` — **full-width inspect panel, injected ABOVE the card grid**
5. Card grid — `reviewCard()` per filtered/sorted item (or empty-state)

The inspect panel is rendered as `style="grid-column:1/-1"` and appears at the top of the grid, not adjacent to the selected card.

Side panel (`#casefile`): shows `renderReviewInspectContext(item)` (abbreviated field summary) when a card is inspected; otherwise shows `helperText()`.

### Card (`reviewCard`, line 407)
Each card renders:
- Badge row: item type (claim/truth/evidence/pressure), review state, report count, ~similar, quality hints, truth-derived, category-echo, borderline-origin, Builder chip
- Chips row: origin chip (demo-seed / hx-seed / test-account / user), handle chip, dup chip, lock chip
- Report reason line (if present)
- Title (`h3.review-card-title`)
- Meta line: category + status + score summary (or evidence/pressure equivalents)
- Date line: relative age
- Actions row: **Inspect** / Approve (with confirm step) / Keep Pending / Reject (with confirm step)

When a card is selected (`review-card-selected`):
- Approve / Keep Pending / Reject buttons are **hidden from the card**.
- Only the Inspect toggle remains.
- All actions move to the inspect panel.

### Inspect panel (`renderReviewInspectPanel`, line 425)
Full-width panel inserted at grid position 1 (top):
- Item type + title header
- Close button
- Prev/Next nav + keyboard hint bar
- State bar (coloured dot + human-readable state label + report badge)
- Near-duplicate advisory (if applicable)
- All available fields (ID, Type, State, Reports, per-type fields, timestamps)
- Quality hints block (if any)
- Builder context block (if any)
- Action buttons: Approve (with confirm), Keep Pending, Reject (with confirm), Archive test artefact (conditional), Mark Duplicate (conditional), Dismiss ~Similar (conditional), Open Study View / Study Parent Claim

### Filters (line 403 `renderReviewFilterBar`)
Filter chips: `Pending | Public | Rejected | Reported | ~Similar | ~Quality | Pressure | Dupes | Demo/Test | Truth-Derived | All`
Sort options (select): `Newest first | Oldest first | Reported first | ~Similar first | ~Quality first`

Default filter on load: `'review'` (pending only). Filter state is module-level `reviewStateFilter`.

### Counts/summary
`renderReviewOverviewStrip` — pill row: `N pending · N pub · N rejected · N claim · N truth · N ev · N pressure`
`renderReviewAuditSummary` — collapsible; stats grid: Total, Pending, Public, Rejected, Reported, Pressure, Demo/Test, ~Similar, Dupes; archived section when expanded.

### Keyboard shortcuts (line 384 `initReviewKb`)
Active only in review mode with an item inspected:
- `A` — arm approve, `A` again — confirm approve + advance
- `R` — arm reject, `R` again — confirm reject + advance
- `K` — keep pending + advance
- `[` / `←` — previous item
- `]` / `→` — next item
- `Esc` — close inspect panel

---

## 2. Current Actions

Exact moderation actions present in the code:

| Action | Where | Function |
|---|---|---|
| **Inspect** | card + keyboard | `inspectReviewItem(id)` — toggles inspect panel |
| **Approve** (two-step) | card (when not selected) + inspect panel + keyboard | `requestApproveReview(id)` → `reviewDecisionUI(type, id, 'public')` |
| **Keep Pending** | card (when not selected) + inspect panel + keyboard | `reviewDecisionUI(type, id, 'review')` |
| **Reject** (two-step) | card (when not selected) + inspect panel + keyboard | `requestRejectReview(id)` → `reviewDecisionUI(type, id, 'rejected')` |
| **Archive test artefact** (two-step) | inspect panel only (rejected + artefact heuristic) | `requestCleanupReview(id)` → `reviewCleanupUI(type, id)` |
| **Mark Duplicate** | inspect panel only (claims only, not archived/duplicate state) | `markDuplicateUI(id)` — modal with target ID input |
| **Dismiss ~Similar** | inspect panel only (when `near_duplicate_of` set) | `resolveSimilarUI(id)` — modal confirm |
| **Open Study View** | inspect panel (claims); Study Parent Claim (evidence/pressure) | `openReviewClaimStudy(id)` |

No other moderation actions exist.

---

## 3. Current Friction

### F-1: Inspect panel is detached from the selected card
`renderReviewInspectPanel` is injected at grid position 1 (top of `#reviewList`), always. When the selected card is item 10 in a long queue, the user must scroll up to see the panel, then scroll back down to navigate to the next card. The `scrollToReviewAnchor` call after a decision scrolls to `.review-inspect-panel` (top), but the card that was just acted on is now removed from the list — the viewport lands at the top regardless.

**Evidence:** `renderReviewList()` order: bar → overview → audit → panel → cards. Panel is always first among card-area children.

### F-2: Full re-render on every action
Every action (inspect toggle, filter change, sort change, pending-confirm toggle) calls `renderReviewList()`, which reconstructs the entire `#reviewList` innerHTML. There is no incremental update. On a large queue this is noticeable, and scroll position is lost on every re-render unless `scrollToReviewAnchor` catches it.

**Evidence:** `inspectReviewItem` (line 408), `requestRejectReview` (line 409), `requestApproveReview` (line 411), `setReviewFilter` (line 404), `setReviewSort` (line 399) all end in `renderReviewList()`.

### F-3: Action buttons duplicated with diverging state
When a card is not selected, it shows Approve + Keep Pending + Reject directly on the card. When selected, those disappear and reappear on the inspect panel. The two-step confirm flow (arm → confirm) resets if the user clicks another card's Inspect — the `pendingApproveReviewId` / `pendingRejectReviewId` state is module-level and clears when another card is inspected via the full re-render. This is correct behaviour but not obvious to the reviewer.

**Evidence:** `reviewCard` checks `isPendingReject`/`isPendingApprove` and hides the non-pending actions from the card when `isSelected`. The inspect panel has a parallel confirm flow.

### F-4: No selected-card visual anchor after inspect opens
After clicking Inspect on card 15, the inspect panel appears at position 1 of the grid. The card itself gets `.review-card-selected` styling but is still mid-page. A reviewer scanning a long queue has no spatial cue that ties the panel at the top to the card below. `scrollIntoView({block:'start'})` targets the panel, not the card.

**Evidence:** `inspectReviewItem` (line 408): `document.querySelector('.review-inspect-panel')?.scrollIntoView(...)`. No call to scroll the card into view.

### F-5: Keyboard hint bar is always visible even before inspect opens
`renderReviewInspectPanel` always includes the keyboard hint bar (`A arm · A again confirm · R arm · R again reject · K keep · [ ] prev/next · Esc close`). This is inside the inspect panel, so it only appears when a card is inspected — correct. However, the hint references `A arm` / `A again confirm` which is not obvious without prior knowledge.

**Evidence:** Hint string hardcoded in `renderReviewInspectPanel` return.

### F-6: No count of currently-filtered items in filter bar
The filter chips show per-category counts but there is no "showing N of M" label indicating how many items are in the current filtered+sorted view. The overview strip shows global queue totals, not the current filter result.

**Evidence:** `renderReviewFilterBar` does not reference `list` length for the active filter view; it counts from `all` for chip labels only.

---

## 4. Safe Next Improvements

Proposed as small independent slices. Do not start any without explicit assignment.

### D-227B — Inspect panel scroll anchor
**Goal:** When inspect panel opens, also ensure the selected card is visible (not just the panel). Add a `data-review-selected` attribute to the selected card in `reviewCard()`, and update `inspectReviewItem` to `scrollIntoView` the card after the panel.
**Risk:** CSS/JS only in `reviewCard` and `inspectReviewItem`. No semantic change. No backend change.

### D-228A — Filtered item count label
**Goal:** Add a `<span class="review-filter-total">Showing N items</span>` inside `renderReviewFilterBar` using the filtered list count, not `all`.
**Risk:** Read-only display addition. No state change.

### D-229A — Preserve scroll position after decision
**Goal:** Before `renderReviewList()`, record `reviewList.scrollTop`. After re-render, restore it (or scroll to the next item if one exists from keyboard advance).
**Risk:** Module-level scroll variable. Carefully scoped. No semantic change.

### D-230A — Compact decision feedback toast clarity
**Goal:** Toast messages after Approve/Keep/Reject currently say "Approved. Item is now public." — correct but generic. Include the item title (truncated to 40 chars) in the message: "Approved: [title]."
**Risk:** Cosmetic copy only inside `reviewDecisionUI`. No state change.

### D-231A — Duplicate resolution UX audit
**Goal:** Audit the `markDuplicateUI` modal and `resolveSimilarUI` modal for ergonomics: missing typeahead for target ID, no confirmation of what the canonical claim is. Docs only (separate from implementation).
**Risk:** Docs audit only — no code change.

---

## 5. Risk Boundaries

- **No moderation semantics changed** — this audit does not alter approve/keep/reject logic.
- **No backend route change** — `/api/review`, `/api/review/decision`, `/api/review/cleanup`, `/api/review/mark-duplicate`, `/api/review/resolve-similar` are unchanged.
- **No data model change** — no schema, migration, or D1 change.
- **No public profile exposure** — review UI is admin-token-gated; no review state or data reaches the public profile render path.
- **No privacy boundary change** — `PUBLIC_PROFILE_ALLOWED_MARKERS` and `PUBLIC_PROFILE_PRIVATE_DENYLIST` are unchanged.

---

## 6. Test Recommendations

The following should be locked before future review UI changes:

| What to lock | Why |
|---|---|
| `renderReview` function exists in `app-v10.js` | Entry point for the entire review mode |
| `renderReviewList` function exists | Primary render orchestrator |
| `reviewCard` function exists | Produces the per-item card HTML |
| `renderReviewInspectPanel` function exists | Detailed inspect view — breaking it silences the whole panel |
| `inspectReviewItem` function exists | Inspect toggle handler |
| `reviewDecisionUI` function exists | All three decision outcomes go through this |
| Action names stable: `requestApproveReview`, `cancelApproveReview`, `requestRejectReview`, `cancelRejectReview` | Two-step confirm contract |
| Decision route stable: `POST /api/review/decision` | Backend contract |
| No review UI in public render path | Privacy boundary — `renderPublicProfileHtml` must not reference any review function |
| Filter chips include all 11 defs | `defs` array in `renderReviewFilterBar` |

These tests do not yet exist as explicit assertions in `hardening-smoke-test.mjs` for the frontend functions. Adding them is recommended as part of D-227B or a dedicated D-227C lock step.

---

## Confirmations

- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No app UI / CSS changes:** Confirmed — docs only
- **Deploy needed:** No
