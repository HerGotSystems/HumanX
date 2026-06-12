# D-113B — Compress Home Action Cards on Mobile

**Date:** 2026-06-10
**Scope:** Frontend CSS-only — `public/styles.css`. Plus static coverage + docs. No JS, no Worker, no D1, no Wrangler.
**Static baseline:** 392 / 24 / 56 → **403 / 24 / 56**
**Audit basis:** D-113A public mobile one-screen density audit (finding C.1)

---

## What Changed

A single mobile-scoped CSS rule hides the secondary "When:" guidance line on Home action cards at phone widths. Added inside the existing `@media(max-width:600px)` block (which already targets `.cc-card-grid`):

```css
@media(max-width:600px){
  …
  .cc-card-grid{grid-template-columns:1fr 1fr}
  .cc-stat-grid{grid-template-columns:1fr 1fr}
  .cc-card-when{display:none}   /* ← D-113B */
}
```

Nothing else changed. No JavaScript edit; the "When:" text stays in `renderHome` (`app-v10.js`).

---

## Why `.cc-card-when` Is Hidden Only on Phones

D-113A found Home is the tallest public mobile surface: 7 action cards, each with an icon, title, description, **and** an italic "When:" line, stacking 1–2 columns on a phone under the hero + pipeline banner. The "When:" line is **secondary guidance** that largely restates intent already conveyed by the card title + description. Hiding it at ≤600px removes 7 lines of avoidable height on phones — the smallest safe density win — without touching the primary information (title + description) and without changing the number of cards.

## Why the Text Remains in Source (Desktop/Tablet)

The "When:" guidance is genuinely useful where vertical space is ample. The rule is **mobile-scoped** (`max-width:600px`) and the base `.cc-card-when{font-size:9px…}` styling is untouched, so desktop and tablet render the "When:" lines exactly as before. The text is **not** removed from `app-v10.js` — only visually hidden on narrow screens — so no content is lost and the change is purely presentational.

## Why the Truths Form Collapse Was Deferred

D-113A also flagged the Truths "Add a Truth" form rendering above the truth list (finding C.2). Fixing that (wrapping the form in a collapsed `<details>`) is a **markup change that also alters the desktop default** (form would start collapsed), so it warrants its own explicit decision rather than being bundled into this CSS-only mobile patch. D-113B deliberately does **not** touch the Truths form.

---

## Hardening Tests Added (Section 53 — 11 new tests, 392 → 403)

| # | Test |
|---|---|
| 53.1 | `.cc-card-when` text remains present in `app-v10.js` (≥7) |
| 53.2 | `.cc-card-when` hidden only inside a mobile media query |
| 53.3 | `.cc-card-when` NOT globally hidden (desktop preserved) |
| 53.4 | Base `.cc-card-when` styling still defined for desktop |
| 53.5 | Home still renders 7 action cards |
| 53.6 | Card titles/descriptions not hidden by the mobile rule |
| 53.7 | Truths add form unchanged/not collapsed in this patch |
| 53.8 | D-111 submit trust note remains |
| 53.9 | D-112 mobile tab edge cue remains |
| 53.10 | D-112 active-tab scroll-into-view remains |
| 53.11 | No backend/D1/wrangler/deploy references added (styles.css stays pure CSS) |

README hardening count updated to 403.

---

## Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — CSS only |
| No JavaScript changed | ✅ — `app-v10.js` untouched |
| No deploy/D1/live/admin/token mutation | ✅ |
| No cards removed | ✅ — all 7 present |
| No trust/source hardening weakened | ✅ — D-111 submit note + D-112 tab cues + source/admin hardening intact |
| Desktop/tablet unchanged | ✅ — rule scoped to ≤600px |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 392 passed, 0 failed | **403 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 56 passed | **56 passed** |
| `node --check public/app-v10.js` | OK | **OK** (unchanged) |
