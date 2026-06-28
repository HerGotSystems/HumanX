# D-185 Mobile Layout Polish — Closeout

**Merged:** 2026-06-28  
**Patches:** D-185A through D-185C  
**Baseline at close:** 1525 / 24 / 57 (hardening / belief-engine / worker-route)

---

## What the series did

D-185A was a full source-code audit of mobile/narrow-viewport behaviour across all nine major screens, producing a prioritised list of 13 issues (0 P0, 2 P1, 5 P2, 6 P3). D-185B applied the five P1/P2 CSS-only quick fixes. D-185C resolved the remaining P1 Study side-panel scroll issue with a minimal unavoidable JS change.

---

## D-185A — Audit

**Files inspected:** `public/styles.css` (740 lines), `public/index.html`, all major render functions in `public/app-v10.js`  
**Method:** Source-code review at 375 / 480 / 600 / 700 / 900 px breakpoints

**Issues found:**

| ID | Severity | Screen | Issue |
|----|----------|--------|-------|
| M-1 | P1 | Arena | `.verdict-qualifier` squashes searchbar on 375px |
| M-2 | P1 | Study | Side-panel forms far below fold; `block:'nearest'` scrolls form to bottom of viewport |
| M-3 | P2 | Study/Arena | `btn-mini` tap targets ~28px (below 44px recommended) |
| M-4 | P2 | Truths/Drift | Up to 6 wrapping badge rows per card on mobile |
| M-5 | P2 | Me/Profile | `me-profile-actions` buttons side-by-side on 375px |
| M-6 | P2 | Me/Profile | Archive button (`margin-left:auto`) can look orphaned on wrap |
| M-7 | P2 | Header | Account popover (240px fixed) can overflow on 320px screens |
| M-8 | P3 | Home | `cc-card-when` hidden at 600px — first-time context gone on mobile |
| M-9 | P3 | Home | Pipeline banner: 3 stages without arrows at 600px |
| M-10 | P3 | Study | 4 stacked study grid panels, no collapse — very long mobile scroll |
| M-11 | P3 | Study | `inv-board-sub` subtitle in 9px uppercase — hard to read |
| M-12 | P3 | RunPack | `rp-wf-step{white-space:nowrap}` potential overflow at narrow widths |
| M-13 | P3 | Review | Minor reflow jitter in inspect header close button |

---

## D-185B — Quick CSS pack (5 fixes)

All five are CSS-only, one rule each. Files: `public/styles.css` (+5 lines). No JS changes.

| Fix | Rule | Issue resolved |
|-----|------|---------------|
| M-11 | `.inv-board-sub{font-size:10px;text-transform:none;letter-spacing:0;font-weight:400;font-style:italic;opacity:.75}` | Subtitle readable — no longer 9px uppercase |
| M-3 | `.btn-mini{font-size:11px;padding:6px 10px;min-height:36px;line-height:1}` | Tap targets up to 36px from ~28px |
| M-1 | `@media(≤500px){.verdict-qualifier{display:none}}` | Searchbar uncramps on 375px phones |
| M-5 | `@media(≤500px){.me-profile-actions{flex-direction:column}}` | Profile save/copy buttons stack on narrow screens |
| M-7 | `@media(≤400px){.account-panel-popover{max-width:calc(100vw - 16px)}}` | Popover safe on 320px screens |

---

## D-185C — Study side-panel scroll fix (M-2)

**Problem:** `focusAddEvidence` and `focusAddPressure` called `scrollIntoView({block:'nearest'})` on `#side-tools`. When the side panel is below the fold on mobile, `nearest` behaves as `end` — the element's BOTTOM aligns with the viewport BOTTOM. The form inputs land at the screen edge, barely visible.

**Fix:** Changed `block:'nearest'` → `block:'start'` for the two `#side-tools` scrollIntoView calls. This pins the side panel to the top of the viewport when scrolled into view. `focusAddTest` (which scrolls within `#main`) left unchanged.

**CSS companion:** `@media(≤900px){.study-mode #side-tools{scroll-margin-top:8px}}` — 8px gap below chrome when the panel anchors at the top.

**Why JS was unavoidable:** No CSS property can change `scrollIntoView` alignment behaviour. The `min-height:100vh` hack that could approximate `block:'start'` creates blank-space visual regressions on mobile.

Files: `public/app-v10.js` (+2 chars), `public/styles.css` (+1 rule).

---

## What improved on mobile

- Searchbar no longer cramps at 375px — verdict qualifier hidden below 500px
- Investigation Board subtitle is human-readable (10px normal text, not 9px uppercase)
- `+ Evidence / + Pressure / + Test` buttons have 36px tap targets (up from ~28px)
- Clicking `+ Evidence` or `+ Pressure` now scrolls the add-form to the TOP of the viewport, not the bottom edge
- Me/Profile action buttons stack vertically on narrow screens
- Account popover safe from viewport overflow on 320px screens

---

## What remains for later (not in scope)

1. **Real mobile drawer / inline add forms (M-2 remainder)** — the `scrollIntoView` fix reduces friction, but the Evidence/Pressure forms are still physically at the bottom of the page behind a long scroll. A complete solution requires either:
   - Inline add-form stubs in the study grid panels themselves (duplicate form logic), or
   - A mobile bottom-drawer overlay anchored to the add buttons (new component)
   Planned as D-185E+ once priorities are confirmed.

2. **Physical device QA** — this series was source-code review only. A live browser test on iOS Safari and Android Chrome would surface any rendering edge cases missed here (especially for the searchbar, dock-section scroll, and account popover).

3. **Public profile mobile pass** — `/u/:slug` has 640px breakpoints but was not exercised as a primary flow in this series. Worth a dedicated pass once sharing features are more prominently surfaced.

4. **Truth / Drift card badge density (M-4)** — up to 6 wrapping badge rows per card on mobile. Needs render-logic changes (conditional badge display) rather than CSS, so deferred.

5. **Study grid collapse (M-10)** — 4 stacked panels create a very long scroll. Wrapping each in `<details>` would improve navigability but needs template and smoke-test changes.

6. **cc-card-when on mobile (M-8)** — currently `display:none` at 600px. Could restore at reduced opacity but deferred while the larger Home redesign direction is unclear.

---

## Commit log

```
34e9fc5 D-185C — Study side-panel mobile access: scroll-to-top fix
a1b5c2f D-185B — mobile quick CSS polish pack (5 fixes from D-185A audit)
c2aa962 D-185A — Mobile layout polish audit (doc only)
```
