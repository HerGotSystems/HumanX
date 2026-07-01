# D-250A — Review Search/Filter Clarity Audit

**Scope:** Docs + tiny guard tests
**Status:** COMPLETE
**Baseline:** 2722 passed / 0 failed → **2730 passed / 0 failed** (+8 guard tests)
**Files changed:** `docs/D250A_REVIEW_SEARCH_FILTER_CLARITY_AUDIT.md`, `docs/README.md`, `scripts/hardening-smoke-test.mjs`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit every Review queue filter, sort, and search control before any UX change. Identify what each control does, whether labels are clear, and whether filter/sort behavior is safely understood by a moderator operating under time pressure.

This is a read-only audit. No filter or sort behavior is changed. All findings are advisory.

---

## 1. Control Inventory

### Filter chips — `renderReviewFilterBar(list)`

State variable: `reviewStateFilter` (declared on line 24, default `'review'`).
Function called: `setReviewFilter(f)` → sets `reviewStateFilter` → `withReviewScrollPreserved(renderReviewList)`.
Active-state class: `review-filter-chip-active` on the currently active chip button.

| Chip label | Filter key (`data-value`) | What it includes | Count source |
|------------|--------------------------|-----------------|-------------|
| Pending | `review` | items where `review_state === 'review'` | All loaded items |
| Public | `public` | items where `review_state === 'public'` | All loaded items |
| Rejected | `rejected` | items where `review_state === 'rejected'` | All loaded items |
| Reported | `reported` | items where `report_count > 0` | All loaded items |
| ~Similar | `similar` | items where `near_duplicate_of` is truthy | All loaded items |
| ~Quality | `quality` | claim-type items with `claimQualityHints().length > 0` | All loaded items |
| Pressure | `pressure` | items where `target_type === 'pressure'` | All loaded items |
| Dupes | `duplicate` | items where `duplicate_of || near_duplicate_of` | All loaded items |
| Demo/Test | `demo-test` | items matching `isSuspectedTestArtefact(item)` | All loaded items |
| Truth-Derived | `truth-derived` | items matching `isTruthDerivedClaim(item)` | All loaded items |
| All | `all` | all items in loaded queue (no filter applied) | All loaded items |

**Count display:** Badge shown only when `n > 0`; chip renders even when count is 0 (grayed appearance).

**Help text:** `reviewFilterHelpText(reviewStateFilter)` renders a `<p class="review-filter-help">` line below chips for the active filter. Per-filter explanations exist for all 11 keys.

**Empty state:** `reviewEmptyText(reviewStateFilter)` renders a per-filter explanation when the filtered list is empty. Explanations exist for all 11 keys.

**Cleanup hint:** Appears below help text when `counts.rejected > 0 || reviewQueue.archived_total > 0` and an admin token is set. "Cleanup: open Rejected → Inspect a smoke/test artefact → Archive test artefact."

### Sort select — `renderReviewFilterBar(list)` (inline `<select>`)

State variable: `reviewSortOrder` (declared on line 29, default `'newest'`).
Function called: `setReviewSort(s)` via inline `onchange="setReviewSort(this.value)"` on the `<select>` element.
Active-state: `selected` attribute on the matching `<option>`.

| Option label | Sort key | Sort behavior | Secondary sort |
|-------------|---------|--------------|----------------|
| Newest first | `newest` | Descending `updated_at` | — (default) |
| Oldest first | `oldest` | Ascending `updated_at` | — |
| Reported first | `reported` | Descending `report_count` | Descending `updated_at` on tie |
| ~Similar first | `similar` | Near-dups first (1/0), then descending `updated_at` | Descending `updated_at` on tie |
| ~Quality first | `quality` | Descending `claimQualityHints().length` | Descending `updated_at` on tie |

**Pattern difference:** Filter chips use `data-action="setReviewFilter"` event delegation; sort uses an inline `onchange` handler directly. Both produce identical results but are wired differently.

### Search — not present

No search state variable exists (`reviewSearch`, `reviewQuery`, or equivalent). No search input field is rendered anywhere in the review queue UI. Moderators cannot find a specific claim, truth, or handle by text without scrolling through the loaded queue under a given filter.

### Audit summary — `renderReviewAuditSummary(all)`

A collapsible `<button class="review-audit-toggle">` that expands to show aggregate stats (Total / Pending / Public / Rejected / Reported / Pressure / Demo/Test / ~Similar / Dupes). Stats are always computed from the full loaded queue (`all`), not the filtered view. "Archived" stats appear when `reviewAuditOpen` is true and `archived_total > 0`. Toggle function: `toggleReviewAudit()` → `withReviewScrollPreserved(renderReviewList)`.

### Overview strip — `renderReviewOverviewStrip(all)`

Inline pill row above the audit bar: `N pending · N pub · N rejected · N claim · N truth · N ev · N pressure`. Always computed from full queue. No interaction.

---

## 2. Filter Behavior

| Filter | What it includes | Fields checked | Notes |
|--------|-----------------|----------------|-------|
| `review` (Pending) | Items still awaiting decision | `review_state === 'review'` | Default view; most common moderator context |
| `public` | Approved items | `review_state === 'public'` | Useful for audit; not action-oriented |
| `rejected` | Rejected items | `review_state === 'rejected'` | Includes test artefacts; cleanup hint shown |
| `reported` | Any item with ≥1 user report | `report_count > 0` | Cross-state: can include pending, public, or rejected items |
| `similar` | Near-duplicate advisory set | `near_duplicate_of` truthy | Advisory only; includes pending + public + rejected |
| `quality` | Claims with quality hints | `claimQualityHints().length > 0`, claim-type only | **Silently excludes truths, evidence, pressure** — `~Quality` filter label does not communicate this |
| `pressure` | Pressure-point items | `target_type === 'pressure'` | Useful for pressure-specific review workflows |
| `duplicate` | Items with any duplicate relationship | `duplicate_of || near_duplicate_of` | **Superset of `~Similar`** — "Dupes" count ≥ "~Similar" count always; near-advisory items included alongside confirmed duplicates |
| `demo-test` | Suspected seed/test artefacts | `isSuspectedTestArtefact(item)` — handle/ID/text heuristics | Advisory heuristic; may have false positives |
| `truth-derived` | Claims from truth/pressure flows | `isTruthDerivedClaim(item)` | Warrants extra context before approval |
| `all` | Everything in loaded queue | No filter applied | Good for audit; large queues can be overwhelming |

**Effect on next-item:** `applyReviewFilter` is called inside `initReviewKb` for keyboard [ ] nav and inside `renderReviewList` for "Open next item →" capture — the next item always follows the current filter.

**Effect on inspect panel position:** `renderReviewInspectPanel` computes `_vl = applyReviewSort(applyReviewFilter(...))` to derive "N of M" and Prev/Next buttons — position indicator reflects current filter+sort.

---

## 3. Sort Behavior

| Sort | Field | Order | Secondary sort |
|------|-------|-------|----------------|
| `newest` | `updated_at` or `updatedAt` or `created_at` | Descending | — |
| `oldest` | `updated_at` or `updatedAt` or `created_at` | Ascending | — |
| `reported` | `report_count` | Descending | Descending `updated_at` on tie |
| `similar` | `near_duplicate_of` present (1 or 0) | Near-dups first | Descending `updated_at` on tie |
| `quality` | `claimQualityHints().length` | Most hints first | Descending `updated_at` on tie |

**Stability:** Sorts use `[...list]` copy before sorting — no in-place mutation of queue state. Secondary `updated_at` sort makes tie-breaking predictable.

**Label accuracy:** All option labels match implementation. "~Similar first" correctly floats items with `near_duplicate_of` set. "~Quality first" correctly sorts by hint count (not evidence_score or any backend field).

**Next-item follows sort:** `reviewDecisionFeedbackNextId` is captured from `applyReviewSort(applyReviewFilter(...))` before queue reload — confirmed in `renderReviewList`. The "Open next item →" button respects current filter and sort.

---

## 4. Search Behavior

**No search exists.** There is no `reviewSearch` or `reviewQuery` state variable, no search input in `renderReviewFilterBar` or `renderReview`, and no text-match filtering in `applyReviewFilter`.

**Is this a meaningful gap?** Yes, for moderator workflows:

- Finding a specific claim by claim text, submitter handle, or claim ID requires loading "All" filter and manually scanning.
- Queue sizes could reach 50–200+ items, making text-scan impractical.
- There is no way to quickly locate a report from a specific user handle.
- Keyboard Prev/Next navigation (`[ ]`) traverses in sort order only; there is no "jump to" affordance.

A lightweight client-side search (filtering the already-loaded `reviewQueue.review` array) would not require backend changes and would be low risk. Backend scope is not needed for a first pass.

---

## 5. UX Friction Findings

### F-1 (HIGH) — No search / no way to find specific items

There is no text search input. With a moderate queue size (30+ items), finding a specific claim, submitter handle, or ID requires scrolling through the list under a filter. The `All` filter view is the closest workaround, but it shows all states (pending + public + rejected) and has no fast-scan affordance.

**Evidence:** No `reviewSearch`, `reviewQuery` state var; no search input in `renderReviewFilterBar`; no text-match branch in `applyReviewFilter`.

**Suggested fix:** D-253A — lightweight client-side text search input above the filter chips; searches `item.claim || item.statement`, `item.handle`, `item.id`.

---

### F-2 (MEDIUM) — No active filter/sort summary line above cards

When a moderator is on `~Quality` filter sorted by `~Quality first`, there is no persistent label saying "Showing: ~Quality items · Sorted: ~Quality first" above the card list. The active filter chip is highlighted (`review-filter-chip-active`) and the sort `<select>` shows the active option, but both are at the top of the filter bar — which is above the overview strip, audit bar, and feedback banner. Under a tall queue, the filter bar can be scrolled out of view.

The "Open next item →" button (D-242B) follows the current filter+sort silently — there is nothing near the button or the card list explaining which item will be next.

**Evidence:** `renderReviewFilterBar` emits `review-filter-chip-active` class and a `selected` option, but nothing is rendered near the card list or feedback banner stating the active context.

**Suggested fix:** D-250B — active filter/sort summary line (`"Showing: ~Quality · 12 items · Sorted: ~Quality first"`) rendered between the audit bar and the first card. Also serves as context for "Open next item →".

---

### F-3 (MEDIUM) — `~Quality` filter silently excludes truths, evidence, and pressure

The `~Quality` filter chip label says `~Quality`, which suggests it applies across all item types. In fact, `applyReviewFilter` returns an empty array for truths, evidence, and pressure items — these types are explicitly excluded (`if(tp==='truth'||tp==='evidence'||tp==='pressure')return false`). The filter help text says "Claims with advisory quality hints (vague, slogan-like, or unfalsifiable wording)" which is accurate, but only visible after clicking the chip.

A moderator looking at `~Quality` with no claim items in queue will see the empty state "No claims with quality hints in this view." without understanding why truths and evidence they know exist aren't shown.

**Evidence:** `applyReviewFilter` line 398: `if(tp==='truth'||tp==='evidence'||tp==='pressure')return false;`

**Suggested fix:** `~Quality (claims)` chip label or add a parenthetical to the help text that is visible without clicking: "Claims only — truths, evidence, and pressure are not scored for quality hints."

---

### F-4 (MEDIUM) — `Dupes` label conflates confirmed and advisory duplicates

The `Dupes` filter (`duplicate` key) includes items with either `duplicate_of` (an explicit confirmed duplicate relationship set by a moderator decision) OR `near_duplicate_of` (an advisory heuristic set by the backend at claim creation time). The `~Similar` filter includes only `near_duplicate_of`.

This means:
- All `~Similar` items also appear in `Dupes`.
- `Dupes` count is always ≥ `~Similar` count.
- A moderator may interpret `Dupes` as "confirmed duplicates only" and miss that it blends advisory near-dups.

**Evidence:** `applyReviewFilter` for `'duplicate'`: `list.filter(i=>!!(i.duplicate_of||i.duplicateOf||i.near_duplicate_of||i.nearDuplicateOf))`.

**Suggested fix:** Rename `Dupes` chip to `Dups/Sim` or `All Dups` and update help text to explicitly state "Includes both confirmed duplicates and advisory near-similar matches."

---

### F-5 (LOW) — Sort select uses inline `onchange` vs filter chips use data-action event delegation

Sort is wired as `onchange="setReviewSort(this.value)"` directly on the `<select>` element. Filter chips use `data-action="setReviewFilter"` processed through `_D181C_PARAM_ACTIONS`. This is an implementation inconsistency rather than a UX issue, but it means the sort select bypasses the standard event-delegation layer. Not a problem for current behavior, but worth noting for future refactors.

**Evidence:** `renderReviewFilterBar` line 406.

**Risk:** None — both paths call the same underlying functions. Low priority.

---

### F-6 (LOW) — Active filter/sort out of view when queue is long

The filter chips and sort select are at the very top of the queue page. In a long queue, once a moderator scrolls down past ~5–10 cards, the filter bar is no longer visible. The active filter/sort context is lost. Combined with F-2 (no summary line near cards), this means moderators working through a long queue may lose track of what they're looking at.

**Evidence:** Filter bar is inside `.review-filter-bar` at the top of `renderReviewList` output; no sticky positioning in CSS.

**Suggested fix:** Part of D-250B (active summary line near cards); or a sticky filter bar. Sticky filter bar is higher-risk (requires CSS changes + careful z-index); a summary line near the cards is lower-risk.

---

### F-7 (LOW) — No indication that sort affects next-item order

After approving or rejecting an item, the "Open next item →" button (D-242B) follows the current filter+sort. There is no label or tooltip on the button explaining this. A moderator who changed the sort order from "Newest first" to "Reported first" may be surprised that the next item is not the next chronologically.

**Evidence:** `renderReviewList` uses `applyReviewSort(applyReviewFilter(reviewQueue.review))` to capture `_fbNextId` before reload. The button copy is just "Open next item →" with no context.

**Suggested fix:** Part of D-250B (active filter/sort summary line) — if it says "Sorted: Reported first" near the action area, moderators can reason about next-item order.

---

## 6. Safe Next Improvements

Recommended slices, smallest first:

| Slice | Scope | What |
|-------|-------|------|
| **D-250B** | App + CSS + tests | Active filter/sort summary line — `"Showing: ~Quality · 12 items · Sorted: ~Quality first"` rendered between audit bar and first card; addresses F-2, F-6, F-7 |
| **D-251A** | App + tests | `~Quality (claims)` chip label change and Dupes label change; addresses F-3 and F-4 |
| **D-252A** | App + CSS + tests | Lightweight client-side text search input above filter chips; searches claim text, handle, ID; client-side only, no backend; addresses F-1 |
| **D-253A** | Tests | Regression lock for filter/sort/search clarity arc |

**Preferred first slice:** D-250B (active filter/sort summary line). It:
- Requires only a small new string rendered in `renderReviewList` (no filter/sort behavior change)
- Directly explains why "Open next item →" follows the order it does
- Addresses three findings (F-2, F-6, F-7)
- Has low risk: no filter/sort logic change, no backend change, no public profile surface

---

## 7. Risk Boundaries

- No moderation semantics change (this audit)
- No filter behavior change (this audit)
- No sort behavior change (this audit)
- No next-item behavior change (this audit)
- No duplicate/advisory semantics change (this audit)
- No public profile exposure (filter/sort controls absent from `renderPublicProfileHtml`)
- No Drift/Belief expansion changes
- No backend/API route changes
- No migration/schema/CSP/external asset changes
- No persistent preference / localStorage

---

## 8. Test Recommendations

Guard tests added in D-250A (8 tests, confirming current hooks exist and public boundary holds):

| Test | Category |
|------|----------|
| `setReviewFilter` function defined | Filter hook |
| `applyReviewFilter` handles default 'review' path | Filter hook |
| `applyReviewFilter` ~Similar path checks `near_duplicate_of` | Filter hook |
| `applyReviewFilter` ~Quality excludes non-claim types | Filter hook (silent exclusion guard) |
| `setReviewSort` function defined | Sort hook |
| `reviewFilterHelpText` function defined | Filter help |
| No review search state variable present | Search absence |
| `renderPublicProfileHtml` does not reference `setReviewFilter` | Public boundary |

Future regression lock (D-253A) should cover:
- Active filter/sort summary matches current `reviewStateFilter`/`reviewSortOrder` values (post D-250B)
- Empty state mentions active filter name (existing behavior locked)
- Next-item capture still calls `applyReviewSort(applyReviewFilter(...))` (behavior lock from D-243A)
- Filter chips remain `<button>` elements (accessibility lock)
- Sort select remains a `<select>` element (accessibility lock — not a click target conflict)
- `renderPublicProfileHtml` does not reference `setReviewFilter`, `applyReviewFilter`, `setReviewSort`, `reviewStateFilter`, `reviewSortOrder`

---

## Summary Table

| Finding | Priority | Type | Addressed by |
|---------|----------|------|-------------|
| F-1: No search | HIGH | Gap | D-252A |
| F-2: No filter/sort context near cards | MEDIUM | Clarity | D-250B |
| F-3: ~Quality silently claim-only | MEDIUM | Label | D-251A |
| F-4: Dupes conflates confirmed + advisory | MEDIUM | Label | D-251A |
| F-5: Sort wiring inconsistency | LOW | Impl | Defer |
| F-6: Filter bar off-screen when scrolled | LOW | Visibility | D-250B |
| F-7: No next-item order explanation | LOW | Context | D-250B |
