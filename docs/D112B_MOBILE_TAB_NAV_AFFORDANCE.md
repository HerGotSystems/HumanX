# D-112B — Mobile Tab Navigation Affordance

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. Plus static coverage + docs. No Worker, no D1, no Wrangler.
**Static baseline:** 383 / 24 / 56 → **392 / 24 / 56**
**Audit basis:** D-112A mobile tab/navigation affordance audit

---

## What Changed

### 1. Mobile tab-strip edge cue (CSS)

The mobile `.tabs` rule (≤900px) gained a right-edge fade via a CSS mask gradient — signals "more tabs →" without consuming layout space and without touching scroll mechanics:

```css
.tabs{
  flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch;
  scrollbar-width:none; padding-bottom:2px; margin-bottom:4px; gap:4px;
  -webkit-mask-image:linear-gradient(to right,#000 calc(100% - 22px),transparent);
  mask-image:linear-gradient(to right,#000 calc(100% - 22px),transparent);
}
```

The rightmost ~22px of the strip fades, hinting that the row scrolls. Touch scrolling and the hidden scrollbar are unchanged.

### 2. Active tab scroll-into-view (JS)

`setMode(m)` now scrolls the newly-active tab into view horizontally, guarded against a missing element:

```js
document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
const _activeTab=document.getElementById('tab-'+m);
if(_activeTab){
  _activeTab.classList.add('active');
  try{ _activeTab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); }catch(_){}
}
render();
```

`block:'nearest'` + `inline:'center'` keep the scroll horizontal (no vertical page jump); the `if(_activeTab)` guard + `try/catch` make it safe if the tab is missing or `scrollIntoView` options are unsupported.

---

## Why Mobile Tabs Needed a Cue

D-112A findings:
- **C.1:** At ≤900px the 9-tab strip scrolls horizontally but the scrollbar is hidden and there was no edge fade/arrow — nothing told the user that Review/RunPack exist off the right edge.
- **C.2:** `setMode` toggled `.active` but never scrolled the active tab into view, so a mode reached from a button could highlight an off-screen tab.

The edge fade (1) addresses discoverability; the active-tab scroll-into-view (2) ensures the selected tab is always visible regardless of how it was reached.

---

## Preserved (unchanged)

| Item | Status |
|---|---|
| All 9 nav tabs | ✅ |
| `.active` class behavior | ✅ still toggled in `setMode` |
| Mode switching / `render()` | ✅ |
| Beliefs tab `location.href` redirect | ✅ |
| Public/admin gating (Review) | ✅ |
| D-111 submit trust note | ✅ |
| D-104/D-106/D-107 source/admin hardening | ✅ |
| Touch scrolling + hidden scrollbar | ✅ |

No multi-row wrap, no hamburger menu, no hidden/removed tabs, no heavy scrollbar — per D-112A do-not-build.

---

## Hardening Tests Added (Section 52 — 9 new tests, 383 → 392)

| # | Test |
|---|---|
| 52.1 | `.tabs` keeps `overflow-x:auto` + touch scrolling |
| 52.2 | Mobile tab strip has an edge fade affordance (mask/gradient, incl. `-webkit-`) |
| 52.3 | Scrollbar-hidden behavior preserved alongside the cue |
| 52.4 | `setMode` scrolls the active tab into view |
| 52.5 | `setMode` guards a missing active tab safely |
| 52.6 | `setMode` still toggles `.active` |
| 52.7 | D-111 submit trust note remains present |
| 52.8 | All 9 nav tabs remain in `index.html` |
| 52.9 | No backend/D1/wrangler/deploy references added in `setMode` |

README hardening count updated to 392.

---

## Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — display/CSS + client nav only |
| No deploy/D1/live/admin/token mutation | ✅ |
| No tabs hidden/removed | ✅ — all 9 present |
| No full nav redesign | ✅ — same single-row strip + same tabs |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 383 passed, 0 failed | **392 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 56 passed | **56 passed** |
| `node --check public/app-v10.js` | OK | **OK** |
