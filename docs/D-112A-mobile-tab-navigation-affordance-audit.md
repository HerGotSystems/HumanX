# D-112A — Mobile Tab / Navigation Affordance Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 383 / belief-engine-static-check 24 / worker-route-static-check 56

Follows up D-111A finding C.3: the 9-tab nav becomes a hidden-scrollbar horizontal strip on mobile; rightmost tabs (Review/RunPack) may be undiscoverable.

---

## A. Files Read

- `public/index.html` — `<nav class="tabs">` markup
- `public/app-v10.js` — `setMode` (active-tab handling)
- `public/styles.css` — `.tabs`, `.tab`, media queries (900/600/480/400px)
- `scripts/hardening-smoke-test.mjs` — nav test coverage
- `docs/D-111A`, `D111D`, `D110A`, `README.md`

---

## B. Current Mobile Nav Behavior Map

```
<nav class="tabs"> — 9 buttons, each id="tab-<mode>":
  Home · Beliefs · Drift · Claims · Submit · Evidence · Truths · Review · RunPack
  (Beliefs → location.href '/apps/humanx-belief-engine/'; the rest → setMode)

setMode(m):
  sets body mode-class, removes .active from all .tab,
  adds .active to #tab-<m>, calls render()
  ✗ does NOT scroll the active tab into view

CSS:
  desktop (.tabs): display:flex; flex-wrap:wrap; gap:6px      → tabs wrap onto 2 rows if needed
  ≤900px (.tabs):  flex-wrap:nowrap; overflow-x:auto;
                   -webkit-overflow-scrolling:touch;
                   scrollbar-width:none                        → single-row horizontal scroll
  .tabs::-webkit-scrollbar{display:none}                       → scrollbar hidden
  .tab: padding 6px 9px; font-size 11px; white-space:nowrap; flex-shrink:0
```

**Net mobile behavior:** at ≤900px the 9 tabs become one horizontally-scrollable row with **no visible scrollbar, no edge fade, no "more →" cue**, and the **active tab is not auto-scrolled into view**. Roughly the first 5–6 tabs are visible at ~380px; Review and RunPack sit off the right edge.

---

## C. Findings (Ranked by Severity)

### C.1 — MEDIUM: Hidden tabs have no discoverability affordance on mobile
At ≤900px the scrollbar is hidden (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`) and there is no edge fade, gradient mask, arrow, or "more" hint. A mobile user sees a flush row of tabs ending at the viewport edge with **no visual signal that more tabs (Review, RunPack) exist to the right**. Horizontal swipe works but is undiscoverable without trying.

### C.2 — MEDIUM: Active tab is not scrolled into view on `setMode`
`setMode` adds `.active` to `#tab-<m>` but never scrolls it into the visible region of the strip. If a user reaches RunPack/Review via another path (e.g. a button that calls `setMode('export')`), the active tab can be highlighted **off-screen** — the strip still shows Home…Truths, with the active RunPack tab invisible to the right. This compounds C.1.

### C.3 — LOW: "Review" tab mid-strip for public users
Review is the 8th tab. On mobile it's off the right edge (so rarely seen by public — arguably fine), but when scrolled to, it presents an "admin only" gated page. Not a defect (transparency by design, content gated), and its off-edge position actually de-emphasises it for the public. No action.

### C.4 — LOW: Beliefs tab leaves the SPA mid-strip
`tab-belief` uses `location.href` (full navigation to the Belief Engine) rather than `setMode`. Expected behavior; the active-class logic doesn't apply to it (no `mode-belief` tab highlight persists). Minor inconsistency, not a nav-affordance issue.

### C.5 — INFO (good): Touch scrolling and no-overflow are handled
`overflow-x:auto` + `-webkit-overflow-scrolling:touch` give smooth momentum scrolling; `white-space:nowrap` + `flex-shrink:0` prevent tab squishing; the strip never wraps or breaks layout at ≤900px. The mechanics are sound — only the *discoverability cue* and *active-tab visibility* are missing.

---

## D. Recommended D-112B Patch (small, frontend-only)

| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | **Right-edge fade affordance on the mobile `.tabs` strip** — a CSS gradient/mask (or a `::after` overlay) on the right edge at ≤900px to signal "more tabs →". Optionally also a left fade when scrolled. | Low — CSS only | C.1 |
| W-2 | **Auto-scroll the active tab into view in `setMode`** — after setting `.active`, call the active tab's horizontal scroll-into-view, scoped to avoid vertical page jump: `document.getElementById('tab-'+m)?.scrollIntoView({block:'nearest', inline:'center'})` (or set the nav's `scrollLeft` to the tab's offset). | Low — one guarded line | C.2 |

**Smallest meaningful patch:** W-1 + W-2 together. W-1 tells the user more tabs exist; W-2 keeps the selected tab visible regardless of how it was reached. Both are pure display/UX, no behavior or backend impact.

**Implementation caveat for W-2:** prefer `inline:'center'`/`'nearest'` with `block:'nearest'` (or direct `nav.scrollLeft` math) so the call scrolls only the horizontal tab strip and does **not** scroll the whole page vertically.

---

## E. Do-Not-Build

| Item | Reason |
|---|---|
| Multi-row tab wrap on mobile | Reintroduces vertical height bloat above the fold; the single-row scroll strip is the better mobile pattern |
| Hamburger / collapsed menu | Admin-like complexity; overkill for 9 flat tabs; hurts one-tap reachability |
| Removing or hiding tabs (e.g. Review) on mobile | Don't hide functionality; off-edge position already de-emphasises Review |
| Always-visible thick scrollbar | Visually heavy on mobile; a fade cue is lighter and sufficient |
| Persistent "scroll →" text button | Consumes horizontal space; a CSS fade is cleaner |

---

## F. Suggested Tests for D-112B

| # | Test |
|---|---|
| 1 | `.tabs` mobile rule retains `overflow-x:auto` (regression — scroll still works) |
| 2 | A right-edge fade affordance is defined for the mobile tab strip (e.g. a `.tabs`-related `::after`/mask rule or a `.tabs-fade` class) — asserts W-1 |
| 3 | `setMode` scrolls the active tab into view (`scrollIntoView` / `scrollLeft` referencing `tab-`+m) — asserts W-2 |
| 4 | `setMode` still toggles `.active` on `#tab-<m>` (regression) |
| 5 | All 9 tabs still present in `index.html` nav (regression) |
| 6 | No backend/D1/wrangler/deploy references added |

---

## G. Final D-112B Recommendation

**Implement W-1 + W-2 as a small frontend-only mobile-nav affordance patch.**

The mobile tab mechanics are sound (smooth touch scroll, no layout break); the gaps are purely *signalling*: (C.1) nothing tells the user more tabs exist to the right, and (C.2) the active tab can be highlighted off-screen. A CSS right-edge fade (W-1) plus a one-line active-tab scroll-into-view in `setMode` (W-2, scoped to horizontal only) close both with negligible risk and no behavior/backend change. Avoid the heavier options in E (multi-row, hamburger, tab removal). Lock with tests F.1–F.5.

This is a polish-level UX improvement, not a safety issue — appropriate as the next small public-UX increment, but not urgent.

---

## H. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, admin/moderation, token-rotation, or live mutation was performed.

---

## I. Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **383 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
