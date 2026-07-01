# D-258A — Review Queue Mobile Controls/Action Wrapping Audit

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 2903 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D258A_REVIEW_QUEUE_MOBILE_CONTROLS_WRAPPING_AUDIT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit the Review queue moderator UI on narrow/mobile widths before making any CSS changes. Identify where filter/search/sort controls, active summary, helper copy, empty-state buttons, review card actions, inspect panel actions, and duplicate/similar advisory controls may wrap badly, crowd, duplicate, or become hard to tap. Produce a concrete risk list and a recommended minimum D-258B implementation slice.

All findings are supported by code and CSS evidence. No live browser testing was performed — this is a static audit.

---

## 1. Review Mobile Control Inventory

### 1a. Filter chips (`renderReviewFilterBar`)

| Item | Render fn | CSS class | Wrapping behavior | Tap risk |
|------|-----------|-----------|-------------------|----------|
| 11 filter chips | `renderReviewFilterBar` | `.review-filter-chips` → `.review-filter-chip` | `display:flex;gap:6px;flex-wrap:wrap` — chips wrap to new rows ✓ | Chips are `padding:4px 9px;font-size:10px` — at 44px min-height: **no** (only ~24px tall). Low tap precision risk |
| Sort label + select | `renderReviewFilterBar` | `.review-sort-bar` / `.review-sort-label` / `.review-sort-select` | **No CSS rules** for these classes — the sort div is a flex child of `.review-filter-bar` alongside `.review-filter-chips` | The sort `<select>` lands in the same flex row as the chip wrap — **no layout isolation** |
| `review-filter-bar` outer | — | `.review-filter-bar.review-filter-compact` | `display:flex;gap:6px;flex-wrap:wrap;padding:8px 0 4px` | `.review-filter-compact` has **no CSS** (structural marker only, locked by D-129F) |
| Filter help text | — | `.review-filter-help` | `font-size:10px;color:var(--muted)` — block, wraps naturally | Fine |
| Cleanup hint | — | `.review-cleanup-hint` | `font-size:10px` — block | Fine |

**Admin-only:** Yes. **D-256B lock dependency:** `Dupes + Similar` chip label must be preserved exactly.

### 1b. Search row (`renderReviewSearchRow`)

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Search row wrapper | `.review-search-row` | `display:flex;align-items:center;gap:8px;flex-wrap:wrap` ✓ | On ≤360px the label and input/clear split to two lines — acceptable |
| Label "Search review queue" | `.review-search-label` | `white-space:nowrap;flex-shrink:0` | Label forces its own line on very narrow viewports before input appears |
| Input wrapper | `.review-search` | `display:flex;align-items:center;gap:6px;flex:1;min-width:0` ✓ | Input expands to fill row |
| Input | `.review-search-input` | `flex:1;min-width:0` ✓ | Collapses cleanly |
| Clear button | `.review-search-clear` | `flex-shrink:0;white-space:nowrap` ✓ | Stays on same line as input, doesn't wrap |

**Admin-only:** Yes. **D-253A lock:** Input, clear, delegated handler, pipeline all must be preserved.

### 1c. Active summary (`renderReviewActiveSummary`)

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Summary line | `.review-active-summary` | `font-size:11px;color:var(--muted);padding:4px 0 3px;letter-spacing:.01em` — block, wraps naturally | "Showing: Dupes + Similar · 12 items · Search: "some-query" · Sorted: Newest first" can be 80+ chars on one line; no `overflow` rule. Wraps to multiple lines but no explicit `line-height` |

**Admin-only:** Yes. **D-250B lock:** Format must remain unchanged.

### 1d. Ambiguous filter helper (`renderReviewFilterHelper`)

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Helper line | `.review-filter-helper` | `font-size:11px;color:var(--muted);padding:0 0 4px;opacity:.8` — block | Fine, wraps naturally |

**Admin-only:** Yes. **D-252A/D-256B lock:** Exact copy must be preserved.

### 1e. Zero-results empty state (`renderReviewEmptyState`)

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Empty state card | `.review-empty-state` | `background;border-style:dashed` — block, full-width panel | Fine |
| Title | `.review-empty-title` | `font-size:13px;font-weight:600` | Fine |
| Context line | `.review-empty-context` | `color:var(--muted);margin:0 0 6px` | Fine |
| Per-filter copy | `.review-first-note` | `margin:5px 0 0;font-style:italic;opacity:.75` | Fine |
| Actions container | `.review-empty-actions` | `margin-top:10px` only — **no flex/display rule** | Buttons inside are `<button>` elements — default inline-block; "Clear search" + "Show all review items" side-by-side may be cramped on ≤360px |
| Action buttons | `.review-empty-show-all` | `border-radius:6px;padding:4px 10px;font-size:12px` — ~24px tall | No `min-height` — tap precision risk on very small screens |

**Admin-only:** Yes. **D-251A lock:** Title, context, buttons, and button actions must be preserved.

### 1f. Review card primary head row

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Head row | `.review-card-head` | `display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:4px` ✓ | Up to 6 badges wrap cleanly |
| Badges | `.badge` variants | `display:inline-flex` etc. | Fine |

**D-248A lock:** Head badge set (type, state, ⚑ report, ~similar, truth-derived, builder) must remain.

### 1g. Review card hint row

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Hints row | `.review-card-hints` | `display:flex;flex-wrap:wrap;gap:3px;margin:3px 0 3px;opacity:.75` ✓ | Fine — wraps |

**D-247A lock:** `.review-card-hints` row must remain present and conditional.

### 1h. Review card action buttons (`reviewCard` → `.review-actions`)

| Item | CSS class | Wrapping/mobile behavior | Risk |
|------|-----------|--------------------------|------|
| Actions container | `.review-actions` | `display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center`; at <600px: `flex-direction:column` | Column layout on mobile — all buttons go vertical |
| Inspect button | `.btn-inspect` | `flex:0;min-width:auto;margin-right:auto;white-space:nowrap`; at <600px: `margin-right:0;flex:1` | Becomes full-width on mobile — fine |
| Approve / Keep Pending / Reject | `.btn-approve` / `.btn-keep` / `.btn-reject` | `flex:1;min-width:90px;padding:8px 6px;font-size:11px`; at <600px: column, each full-width | 5 buttons stacked vertically on mobile — long card |
| Confirm armed state | `.review-confirm-armed` | `background;border-radius;padding;outline` — adds wrapping context | Confirm message uses `flex:1 1 100%` — takes full row above confirm/cancel ✓ |

**D-245A→D-248A lock:** Card layout must be preserved.

### 1i. Decision feedback banner + "Open next item →"

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Feedback banner | `.review-decision-feedback` | `display:flex;align-items:center;gap:8px;...font-size:13px` — **no `flex-wrap`** | On ≤360px: long message + "Open next item →" button + "Dismiss" button may overflow or crowd. No line-wrap fallback |
| Feedback message | `.review-feedback-msg` | `flex:1` — takes remaining space | May shrink very small when two buttons present |
| "Open next item →" | `.review-feedback-next` | `font-size:12px;font-weight:600;padding:2px 10px;border-radius:4px` | No `flex-shrink:0` — may shrink |
| Dismiss | `.review-feedback-dismiss` | `font-size:11px;padding:2px 8px` | No `flex-shrink:0` |

**D-242B/D-243A lock:** Next-item button must remain; behavior must remain navigation-only.

### 1j. Inspect panel navigation (`renderReviewInspectPanel` → `.review-inspect-nav`)

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Nav row | `.review-inspect-nav` | `display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px` — **no `flex-wrap`** | Prev/Next buttons are `flex-shrink:0;white-space:nowrap` — hold their size. Position indicator is `flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis` — truncates. Layout stable ✓ |
| ← Prev / Next → | `.review-nav-btn` | `flex-shrink:0;white-space:nowrap;padding:4px 10px` | No `min-height` — ~26px tap target. Acceptable for admin tool |
| Keyboard hint | `.review-kb-hint` | `font-size:9px` — block | Fine |

### 1k. Inspect panel action buttons (`.review-inspect-actions`)

| Item | CSS class | Wrapping/mobile behavior | Risk |
|------|-----------|--------------------------|------|
| Actions container | `.review-inspect-actions` | `display:flex;gap:5px;flex-wrap:wrap;border-top;padding-top:7px`; at <600px: `flex-direction:column` | Column on mobile |
| Approve | `.review-inspect-approve` | `padding:8px 12px;font-size:11px` | Full-width column on mobile |
| Keep Pending | — | same | Full-width column on mobile |
| Reject | `.review-inspect-reject` | same | Full-width column on mobile |
| Archive test artefact | `.review-inspect-cleanup` | same | Full-width column on mobile |
| Mark Duplicate... | `.review-inspect-markdup` | same | Full-width column on mobile |
| Dismiss ~Similar | `.review-inspect-resolvesim` | same | Full-width column on mobile |
| Study View button | `.btn-study-review` | same | Full-width column on mobile |

For a duplicate/similar item with all buttons: 7 buttons in a column → very tall inspect action strip on mobile.

**D-237A lock:** All duplicate/advisory buttons must remain. Moderation semantics unchanged.

### 1l. Duplicate/similar advisory display (`.review-similar-note`, `.review-similar-id`, `.review-similar-use-dup`)

| Item | CSS class | Wrapping behavior | Risk |
|------|-----------|-------------------|------|
| Advisory note | `.review-similar-note` | `display:flex;flex-direction:column;gap:4px` ✓ | Fine |
| Similar ID row | `.review-similar-id` | `display:flex;align-items:center;gap:6px;flex-wrap:wrap` ✓ | Fine |
| Use as dup row | `.review-similar-use-dup` | `display:flex;align-items:center;gap:6px;flex-wrap:wrap` ✓ | Fine |
| Use as dup note | `.review-similar-use-dup-note` | `font-size:10px;color:var(--muted)` | Fine |

### 1m. Review-to-Study back button

Rendered inline in the Study view header (`renderReviewInspectPanel` wires study navigation). Not part of the Review queue grid. Not in scope for this audit.

---

## 2. Narrow-Width Risk Findings

### F-1 — HIGH: Sort bar has no CSS — shares flex row with 11 filter chips

**Location:** `renderReviewFilterBar` → `.review-filter-bar > .review-sort-bar`

**Evidence:** `.review-sort-bar`, `.review-sort-label`, `.review-sort-select` have **zero dedicated CSS rules** in `styles.css`. The `.review-filter-bar` outer div is `display:flex;gap:6px;flex-wrap:wrap`, so `.review-filter-chips` (the chip group) and `.review-sort-bar` (the sort label + select) are both flex children of the same container. Neither has explicit `width`, `flex-basis`, or `flex` sizing.

**Risk:** On narrow viewports, the sort control can land mid-chip-row (if enough space remains after some chips) or be pushed to a new flex row with no visual grouping. The Sort label and select are not wrapped in a flex pair either — they're just inline children of the unstyled `.review-sort-bar` div. Result: sort control position is unpredictable and visually disconnected from the chip set it controls.

**Depends on:** D-253B pipeline lock (sort must remain functional), D-254A regression lock (filter bar structure), D-256B `Dupes + Similar` chip count.

---

### F-2 — HIGH: Decision feedback banner has no `flex-wrap`

**Location:** `.review-decision-feedback` (styles.css line 259)

**Evidence:** `display:flex;align-items:center;gap:8px;...` — no `flex-wrap`. On narrow viewports, the three children (message `flex:1`, "Open next item →", "Dismiss") must all fit on one line. The message shrinks first (`flex:1`), but if the viewport is very narrow (≤340px), the two buttons themselves may crowd out the message entirely or cause overflow.

**Neither button has `flex-shrink:0`:** both can compress, making them hard to read/tap.

**Depends on:** D-242B/D-243A next-item lock — button must remain, behavior unchanged.

---

### F-3 — MEDIUM: 6-7 inspect action buttons stack as a tall column on mobile

**Location:** `.review-inspect-actions` at `max-width:600px` → `flex-direction:column`

**Evidence:** For a duplicate/similar item with all advisory controls visible: Approve, Keep Pending, Reject, Archive (if artefact), Mark Duplicate..., Dismiss ~Similar, Study View = up to 7 full-width buttons in a column. Each button is `padding:8px 12px` → ~34px tall. 7 × 34px + gaps ≈ 260px of buttons alone, below the inspect fields grid. On a 667px (iPhone SE height) this could consume nearly half the visible viewport in the action strip.

**Depends on:** D-237A lock — all buttons must remain; no semantic change.

---

### F-4 — MEDIUM: `.review-empty-actions` is not a flex container

**Location:** `renderReviewEmptyState` → `.review-empty-actions`

**Evidence:** `.review-empty-actions { margin-top:10px }` — no `display:flex` or `display:block`. Buttons inside (`.review-empty-show-all`) are inline-block by default. On ≤360px, two buttons ("Clear search" and "Show all review items") sit inline, may wrap at an unpredictable point mid-label, and have no guaranteed stacking or spacing.

**Additionally:** `.review-empty-show-all` has `padding:4px 10px;font-size:12px` — ~24px height, no `min-height`. Tap precision risk.

**Depends on:** D-251A lock — buttons must remain; `data-action` attributes unchanged.

---

### F-5 — LOW: Audit stat tiles still approach minimum on 375px phones

**Location:** `.review-audit-stats` at `max-width:600px`

**Evidence:** At ≤600px: `min-width:48px` per tile. 9 tiles × 48px = 432px + gaps ≈ 470px. On a 375px screen this still wraps to multiple rows — which is acceptable (`flex-wrap:wrap`) — but wrapping 9 tiles into 2-3 rows may be noisy. Not a functional issue, just dense.

---

### F-6 — LOW: Active summary line may be very long when all fields are active

**Location:** `.review-active-summary`

**Evidence:** Max text: "Showing: Dupes + Similar · 12 items · Search: "some-search" · Sorted: Newest first" ≈ 80 characters at 11px. Since this is a block element spanning full width (`grid-column:1/-1` inline), it wraps naturally. No overflow or truncation risk. Cosmetic only — two lines instead of one on narrow widths.

---

### F-7 — LOW: Search label forces early line-break

**Location:** `.review-search-label` → `white-space:nowrap;flex-shrink:0`

**Evidence:** On viewports where the label "Search review queue" (≈160px at 11px) plus the input/clear row would exceed the container width, the label wraps to its own line. The input then takes the next full row — `flex:1`. This is technically correct but may look like a bug to the moderator. Low risk since the input still works.

---

## 3. Current CSS Behavior Summary

| Control group | Layout rule | Wrapping | Mobile override |
|---------------|-------------|---------|-----------------|
| `.review-filter-bar` | `flex;gap:6px;flex-wrap:wrap` | Yes — chips wrap ✓ | `gap:5px` at <600px |
| `.review-filter-chips` | `flex;gap:6px;flex-wrap:wrap` | Yes ✓ | None |
| `.review-sort-bar` | **None** | **Unpredictable** | None |
| `.review-search-row` | `flex;flex-wrap:wrap` | Yes ✓ | None |
| `.review-search` (inner) | `flex:1;min-width:0` | Yes ✓ | None |
| `.review-active-summary` | Block text | Yes ✓ | None |
| `.review-filter-helper` | Block text | Yes ✓ | None |
| `.review-empty-actions` | **None** | **Inline-block default** | None |
| `.review-card-head` | `flex;flex-wrap:wrap` | Yes ✓ | None |
| `.review-card-hints` | `flex;flex-wrap:wrap` | Yes ✓ | None |
| `.review-actions` | `flex;flex-wrap:wrap` | Yes; column at <600px ✓ | `flex-direction:column` |
| `.review-decision-feedback` | `flex;no wrap` | **No — no flex-wrap** | None |
| `.review-inspect-nav` | `flex;space-between` | No — stable by design ✓ | None |
| `.review-inspect-actions` | `flex;flex-wrap:wrap` | Yes; column at <600px ✓ | `flex-direction:column` |
| `.review-similar-id` | `flex;flex-wrap:wrap` | Yes ✓ | None |
| `.review-similar-use-dup` | `flex;flex-wrap:wrap` | Yes ✓ | None |
| `.review-audit-stats` | `flex;flex-wrap:wrap` | Yes ✓ | `min-width:48px` at <600px |

**Media queries used in Review context:**
- `@media(max-width:600px)` — main Review mobile breakpoint (line 314 and line 451)
- `@media(min-width:601px)` — some truth form rules (not Review-relevant)
- `@media(max-width:900px)` — layout/grid collapse (global, not Review-specific)
- No `@media(max-width:480px)` or `max-width:375px` rules for Review controls

**Button min-heights:** No explicit `min-height` on any Review button. Public profile buttons have `min-height:44px` (D-221A) but Review buttons do not — acceptable for admin-only tool, but noted.

---

## 4. Prior Locks That Must Not Break

Any D-258B CSS implementation must leave these behaviors pixel-identical:

| Lock | Source | What must be preserved |
|------|--------|----------------------|
| D-245B inline date | `D-248A` | `.review-card-meta` concat with `Updated {age}` |
| D-246A score labels | `D-248A` | `Evidence N · Test N · Survive N` format |
| D-247A hint row | `D-248A` | `.review-card-hints` present, conditional, secondary |
| D-248A card metadata density | `D-248A` | Full head/chips/meta/hints/actions structure |
| D-250B active summary | `D-254A` | `renderReviewActiveSummary` format; `.review-active-summary` class |
| D-251A zero-results | `D-254A` | Title, context, per-filter copy; buttons with exact `data-action` attributes |
| D-252A helper copy | `D-254A` | Exact wording; `.review-filter-helper` class |
| D-253A search | `D-254A` | `applyReviewSearch`; pipeline order; `clearReviewSearch`; `data-review-search` |
| D-254A full regression lock | `D-254A` | 64 tests — all structural classes and behaviors |
| D-256B `Dupes + Similar` | `D-256B` | Chip label, active summary label, helper copy, empty-state copy, audit stat label |
| D-237A duplicate advisory | `D-237A` | Advisory banner, Copy ID, Use as dup target, Mark Duplicate..., Dismiss ~Similar |
| D-243A next-item | `D-243A` | Feedback banner, "Open next item →", search-aware next-item candidate |
| D-239B/D-240A nav | `D-240A` | `openReviewClaimStudy`, `backToArena`, RAF scroll |
| D-231A ergonomics | `D-231A` | `withReviewScrollPreserved`, `data-review-confirming`, confirm-armed class |
| Public profile boundary | All arcs | No Review controls exposed in `renderPublicProfileHtml` |

---

## 5. Recommended D-258B Slice

**D-258B — Review filter/sort bar + decision feedback mobile wrapping polish (CSS-only)**

**Rationale:** Addresses the two HIGH-risk findings (F-1 and F-2) with minimal, contained CSS changes. No copy, no JS behavior, no lock breakage.

### Proposed changes

**Fix F-1 — Sort bar layout isolation:**
Add CSS for `.review-sort-bar` to make it a flex row that holds the label + select as a pair, and sits on its own line below the chip set:

```css
.review-sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 2px 0;
}
.review-sort-label {
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
}
.review-sort-select {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 6px;
  background: var(--panel, #10131d);
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
}
```

This makes the sort label + select pair a visually discrete unit. The `.review-filter-bar` flex-wrap then places it as a row beneath the chip set when there isn't horizontal room.

**Fix F-2 — Decision feedback flex-wrap:**
```css
.review-decision-feedback {
  flex-wrap: wrap;
}
.review-feedback-next,
.review-feedback-dismiss {
  flex-shrink: 0;
}
```

**Fix F-4 (MEDIUM) — Empty-state actions stacking:**
```css
@media (max-width: 600px) {
  .review-empty-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
```

### What D-258B must NOT do

- Do not change `review-filter-chip` sizes or the `review-filter-chips` flex behavior
- Do not remove `.review-filter-compact` class (locked by D-129F)
- Do not add `min-height:44px` to Review buttons (admin-only tool — not required)
- Do not change any JS, copy, or action handlers
- Do not modify `renderReviewFilterBar` HTML structure
- Do not break any D-245→D-257 regression tests

---

## 6. Deferred Alternatives

| Slice | Scope | Notes |
|-------|-------|-------|
| D-259A: Inspect action column polish | CSS-only | At mobile, inspect actions are already column; could reduce button padding to `padding:6px 10px` and add `font-size:10px` for denser stack. Low priority — the column works. |
| D-260A: Audit stat tile wrapping | CSS-only | At very narrow (<375px) the 9 stat tiles still wrap densely. Could add `@media(max-width:480px)` rule with `min-width:42px`. Low priority — audit bar is collapsed by default. |
| D-261A: Active summary truncation | CSS-only | Add `overflow:hidden;text-overflow:ellipsis;white-space:nowrap` as option — or omit. The current multi-line wrap is acceptable. |

---

## 7. Recommended Tests for D-258B

When D-258B CSS is implemented, add smoke tests:

1. `.review-sort-bar` CSS class exists in `styles.css`
2. `.review-sort-label` CSS class exists in `styles.css`
3. `.review-sort-select` CSS class exists in `styles.css`
4. `review-decision-feedback` still contains `display:flex`
5. `review-decision-feedback` has `flex-wrap` (after D-258B)
6. `review-empty-actions` still rendered with `.review-empty-show-all` buttons (behavior unchanged)
7. `renderReviewFilterBar` still renders `.review-sort-bar` wrapper
8. All D-254A lock tests pass unchanged (structural — not CSS-specific)
9. `renderPublicProfileHtml` does not reference `.review-sort-bar` or any new mobile class
10. `belief-drift-expansion.js` not modified

---

## 8. Boundaries

- **D-258A is audit/docs only.** No frontend behavior change. No CSS change.
- No copy changes.
- No predicate changes.
- No backend/API/schema/CSP/external asset changes.
- No public profile exposure.
- No Drift/Belief expansion changes.
- No live deploy needed.

The full implementation begins at D-258B.

---

## Public/Privacy Boundary

All Review queue controls audited here are admin-only. None appear in `renderPublicProfileHtml`. This audit introduces no new public data fields. D-216A allowlist unchanged.

---

## Drift/Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-258A.

---

## No Backend/API Changes Guarantee

No routes, migrations, schema, or external assets changed by this audit. All findings are CSS/layout-only.
