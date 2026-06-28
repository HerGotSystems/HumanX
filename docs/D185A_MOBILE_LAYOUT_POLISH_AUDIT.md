# D-185A — Mobile Layout Polish Audit

**Date:** 2026-06-28  
**Method:** Source-code review — `public/styles.css` (740 lines), `public/index.html`, and all major render functions in `public/app-v10.js`  
**Starting state:** HEAD `0febd87` · Baseline 1525/24/57  
**Scope:** Anonymous and logged-in user flows on narrow viewports — no admin/Review logic

---

## Audit method

All findings are derived from reading CSS media queries, flex/grid declarations, and rendered HTML template strings. No live browser test was run. Breakpoints assessed: 375px (small phone), 480px, 600px, 700px, 900px (tablet/large phone landscape).

**Files inspected:**
- `public/styles.css` — complete read
- `public/index.html` — complete read
- `public/app-v10.js` — renderHome, renderArena, renderStudy, card(), renderBuilderStep1/2/3, renderTruths, renderDrift, renderExport, renderMeHtml, renderPublicProfile, side-panel HTML in index.html

---

## Breakpoint summary

| Width | Key layout change |
|-------|-----------------|
| 900px | `.layout` collapses to 1 column (side panel stacks below main). `main` becomes `display:block;height:auto`. Study grid goes 1-column. `html,body` scroll enabled. Tabs scroll horizontally. |
| 700px | Start Here strip: 4 → 2 columns |
| 640px | Public profile: smaller display-name, button stacking, padding reduced |
| 600px | Tabs shrink further. RunPack actions stack (column). Analysis detail grid 1-col. Claim guide body 1-col. Review admin bar columns. Searchbar inputs tighten. `cc-card-grid` 2→2 columns. `cc-step` 50% width. |
| 480px | Modal actions stack (column). Attach stance row stacks. |
| 400px | Start Here: 2→1 column. cc-card-grid: 2→1 column. cc-step: 100% width. |

---

## Screen-by-screen findings

### 1. Home

**What works:**
- cc-hero right panel (graphBox) hides at 900px — no overflow
- `cc-title` font clamps to 34px at 600px
- Start Here strip: 4→2→1 column at 700px/400px
- Actions grid: 2col at 600px, 1col at 400px
- Pipeline banner: arrows hidden at 600px; stages reflow to 3 per row
- Status line wraps cleanly (flex-wrap)

**Issues:**
- `cc-card-when` ("When:…" context text) set to `display:none` at 600px. This hides useful first-time-user context from the Actions grid on mobile. **P3.**
- Pipeline banner at 600px shows 3 stages per row without arrows — the three-stages-then-wrap layout doesn't make the sequence obvious. **P3.**

---

### 2. Claims / Arena

**What works:**
- Claim cards use `minmax(245px,1fr)` — single column on 375px. Cards are tall but readable.
- Claims grid fully scrollable
- D-184D filter hint paragraph renders inline with wrapping button — fine

**Issues:**
- Searchbar row (`#search` + `#filter` select + `.verdict-qualifier`) on narrow viewports: the verdict-qualifier text (`flex-shrink:1`) compresses aggressively below 420px and may wrap to an unreadable single-word column. The select has `min-width:110px` at 900px — combined with a flex:1 input this is tight at 375px. **P1.**
- No `display:none` or hide rule for the verdict-qualifier below ~450px. At 375px it sits squashed between the select and the edge. **P1.**
- Claim cards have no height cap — a claim with a long title + all meter + votes + button can be ~200px+ on a 375px screen. Not broken, but dense. **P3.**

---

### 3. Study selected-claim view

**What works:**
- Study grid (Evidence/Pressure/Tests/Analysis) goes 1-column at 900px — stacks cleanly
- `study-vote-row` has `flex-wrap:wrap` — vote buttons and Build RunPack wrap fine
- Study header text uses `clamp(24px,3vw,38px)` — scales down on narrow screens
- `study-mode .layout` collapses side panel to below main at 900px
- D-184C `+ Evidence / + Pressure / + Test` buttons use `scrollIntoView` to bring side panel into view

**Issues:**
- **Side panel far below fold on mobile.** Below 900px, `aside.panel.sidepanel` stacks after the full study content: header → argument flow → lineage → Investigation Board heading → 4 stacked grid panels (each can be 200–400px). The side panel (Evidence/Pressure add forms) may be 1000–2000px below the visible area. D-184C's `scrollIntoView` fires but dumps the user at the bottom of the page with the form in view while the claim context is far above. **P1.**
- **`btn-mini` tap targets too small.** The buttons added in D-184B/C/G (`+ Evidence`, `+ Pressure`, `+ Test`, `Create RunPack →`, `Show all`) have no explicit CSS — they inherit default button styles: `padding:8px 10px; font-size:12px`, giving ~28px computed height. The recommended mobile tap target is 44px. **P2.**
- The four stacked study grid panels create a very long scroll. On mobile users may not realise there are panels below the first one. No expand/collapse control. **P3.**
- `inv-board-sub` (the subtitle span) uses `.inv-board-head span` rule which sets `font-size:9px; text-transform:uppercase`. A full sentence in 9px uppercase is hard to read on mobile. **P3.**

---

### 4. Claim Builder

**What works:**
- `max-width:640px; margin:0 auto` — works on all widths
- Builder steps strip: `flex-wrap:wrap`
- `builder-summary-row`: stacks to column at 600px
- Claim guide two-column body stacks to 1-column at 600px
- Category chips: `flex-wrap`
- Quality flags: `flex-wrap`

**Issues:**
- None P0/P1. The Builder is the most mobile-polished screen.
- Builder flag text: `builder-flag{white-space:normal}` — already fixed. ✓
- Long Step 2 builder forms (category chips + falsifier textarea) could benefit from reduced padding on mobile, but not friction. **P3.**

---

### 5. Truths

**What works:**
- Truth filter bar: `flex-wrap:wrap`
- Truth card head: `flex-wrap:wrap`
- Truth admin actions: `flex-wrap:wrap`
- Truth ID line: `word-break:break-all`

**Issues:**
- **Truth cards can have 6–7 badges stacked on mobile:** `truth-not-verified` + `truth-visible-badge` + `truth-personal-badge` + `truth-artifact-badge` + `truth-borderline-badge` + `truth-claim-state-badge`. All in a `flex-wrap:wrap` row — creates a dense 3-row badge cluster before the title on mobile. **P2.**
- No explicit mobile reduction for badge density. **P2.**
- Truth admin bar (`truth-admin-bar`) has `flex-wrap:wrap` but no column stacking — might be cramped on 375px. **P3.**

---

### 6. Drift

**What works:**
- `drift-header: flex-wrap:wrap`
- `drift-section-head: flex-wrap:wrap`
- Belief cards are plain bordered panels — no complex grid

**Issues:**
- Belief cards (`belief-card-full`, `belief-card-quick`) inherit Truth badge density issues when multiple badges are present. **P2.**
- `drift-compare-panel` has `padding:8px 12px` and `border-left:2px` — fine on mobile, though the section label/note can be tight at 375px. **P3.**
- No mobile-specific adjustments for Drift at all — no breakpoints in the `.drift-*` rules. Acceptable since the content is simple, but worth noting. **P3.**

---

### 7. RunPack / Export

**What works:**
- `runpack-actions`: stacks to column at 600px ✓
- `rp-workflow-guide`: arrows hidden at 600px ✓
- `runpack-export-output` max-height: 440px → 260px at 600px ✓
- `analysis-detail-grid`: 3-col → 1-col at 600px ✓
- `rp-return-body textarea`: full width ✓

**Issues:**
- `rp-workflow-guide` step labels (`rp-wf-step{white-space:nowrap}`) at 600px with arrows hidden — the steps may still overflow if the container is narrow enough. **P3.**
- The `runpack-export-output` (monospace textarea) at 260px max-height on mobile is functional but makes editing/reviewing the generated packet quite cramped. **P3 / acceptable.**

---

### 8. My HumanX / Profile

**What works:**
- `me-mirror-grid`: 2-col → 1-col at 640px ✓
- `me-item-row`: `flex-wrap:wrap`
- `me-count-row`: `flex-wrap:wrap`
- `me-filter-bar`: `flex-wrap:wrap`

**Issues:**
- **`me-profile-actions` has no mobile stacking.** The flex row with "Save Profile Settings" + "Copy Share Link" buttons has `display:flex;gap:8px` but no `flex-wrap:wrap` or `flex-direction:column` at narrow widths. On 375px these two full-width-text buttons might be cramped side by side. **P2.**
- **`me-item-row button.danger{margin-left:auto}`** — when the row wraps, the archive button stays on the far right of whatever line it's on. At very narrow widths this can look orphaned. **P2.**
- `me-account-actions` has no mobile-specific style. Fine if it's just a small flex row. **P3.**

---

### 9. Account Panel Popover (commandbar)

**Issues:**
- `.account-panel-popover{position:absolute;top:32px;right:0;z-index:60;width:240px}`. On a 375px phone the popover is 240/375 = 64% of screen width, positioned at the right edge. This should just fit, but there's no `max-width:calc(100vw - 20px)` or responsive clamp. On very narrow screens (320px) it could overflow left. **P2.**
- No `@media` rule for this element anywhere. **P2.**

---

### 10. Review (layout awareness only)

**What works:**
- Most review elements have explicit 600px stacking overrides: admin bar, token form, actions, inspect fields, inspect actions, filter chips, audit stats
- Review inspect panel is the most complete mobile-aware section of the app

**Issues:**
- `.review-inspect-header{flex-direction:column}` at 600px — the close button (`btn-close-inspect`) gets `align-self:flex-end`. This is correct but a minor visual jitter on reflow. **P3.**
- Review cards on mobile still show all action buttons (Inspect/Approve/Reject) as a full column, taking a lot of vertical space per card. This is by design (admin only), so low priority. **P3.**

---

## Severity summary

### P0 — Broken (nothing to show)
No completely broken layout found.

### P1 — Blocks normal use

| ID | Issue | Screen | Location |
|----|-------|--------|----------|
| M-1 | Searchbar verdict-qualifier squashes below readability on 375px; select+input+text too cramped | Arena/Claims | `index.html` `.searchbar`, `styles.css` |
| M-2 | Side panel (Evidence/Pressure add forms) far below fold in Study mode on mobile; `scrollIntoView` dumps user at bottom of a ~1500px page | Study | `index.html` `aside.panel.sidepanel`, `styles.css` |

### P2 — Annoying / friction

| ID | Issue | Screen | Location |
|----|-------|--------|----------|
| M-3 | `btn-mini` tap targets ~28px (recommended 44px) — affects `inv-board-actions`, `arena-filter-hint`, `study-runpack-cta` | Study, Arena | `styles.css` (missing rule) |
| M-4 | Truth/Drift card badge rows — up to 6 wrapping badges before the title on mobile | Truths, Drift | `renderTruths`, `renderDrift` |
| M-5 | `me-profile-actions` buttons not stacked on mobile — two wide-label buttons side-by-side at 375px | Me/Profile | `styles.css` |
| M-6 | Archive button (`margin-left:auto`) can look orphaned when `me-item-row` wraps on narrow screens | Me/Profile | `styles.css` |
| M-7 | Account popover (240px fixed width, `position:absolute;right:0`) — no safe-area clamp, can overflow on 320px | Global header | `styles.css` |

### P3 — Polish

| ID | Issue | Screen | Location |
|----|-------|--------|----------|
| M-8 | `cc-card-when` hidden at 600px — valuable context for first-time users gone on mobile | Home | `styles.css` |
| M-9 | Pipeline banner at 600px: 3 stages without arrows, ambiguous order | Home | `styles.css` |
| M-10 | 4 study grid panels stack to 1 column with no collapse — very long mobile scroll | Study | `renderStudy()` |
| M-11 | `inv-board-sub` sentence in 9px uppercase — hard to read on mobile | Study | `styles.css` |
| M-12 | `rp-wf-step{white-space:nowrap}` with arrows hidden — potential overflow on very narrow screens | RunPack | `styles.css` |
| M-13 | Review inspect reflow visual jitter (close button align) | Review | `styles.css` |

---

## Quick-fix candidates for D-185B+

All five can be done as CSS-only or minimal-JS changes:

| # | Fix | Files | Effort | Severity |
|---|-----|-------|--------|----------|
| 1 | Add `.btn-mini{font-size:11px;padding:6px 10px;min-height:36px;line-height:1}` | `styles.css` | 1 line | P2 |
| 2 | Hide `.verdict-qualifier` below 500px; add `@media(max-width:500px){.verdict-qualifier{display:none}}` | `styles.css` | 1 line | P1 |
| 3 | Stack `me-profile-actions` on mobile: `@media(max-width:500px){.me-profile-actions{flex-direction:column}}` | `styles.css` | 1 line | P2 |
| 4 | Clamp account popover: `@media(max-width:400px){.account-panel-popover{right:-4px;max-width:calc(100vw - 16px)}}` | `styles.css` | 1 line | P2 |
| 5 | Show `cc-card-when` on mobile at reduced opacity instead of `display:none`: `@media(max-width:600px){.cc-card-when{display:block;opacity:.5}}` | `styles.css` | 1 line | P3 |

---

## What not to touch yet

- **Side panel drawer (M-2)** — fixing the Study mobile side-panel access properly requires either inline form duplication or a mobile drawer/modal. Scope is larger than a CSS tweak. Should be its own D-185C+ task.
- **Truth card badge density (M-4)** — reducing badges requires logic changes to `renderTruths()` (conditional badge rendering). Not a CSS-only fix.
- **Study panel collapse (M-10)** — wrapping each study grid panel in `<details>` would let mobile users collapse panels. Requires template changes and careful smoke test coverage.
- **Review page** — admin-only; mobile polish is low ROI. Not in scope.
- **inv-board-sub font (M-11)** — the subtitle is inside `inv-board-head span` which applies the 9px uppercase rule globally. Fixing requires either overriding `.inv-board-sub` specifically (easy) or changing the element type from `span` to something not caught by the span rule. Bundleable into D-185B.

---

## Summary

The app is usable on mobile for browsing and voting. The two biggest gaps blocking typical mobile use are:

1. **M-1**: Searchbar collapses on 375px — verdict-qualifier squashes the layout  
2. **M-2**: Study mode side panel is unreachable without significant scroll — the Evidence/Pressure add forms require scrolling past 1000–2000px of content

Items M-3 through M-7 are friction but not blockers. Items M-8 through M-13 are visual polish.

D-185B can address M-1, M-3, M-5, M-7 (and M-11 as a bonus) in a single CSS pass with 5–6 new rules.
