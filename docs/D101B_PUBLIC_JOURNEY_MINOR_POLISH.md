# D-101B — Public Journey Minor Polish

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 324 / 24 / 39 → **328 / 24 / 39**
**Audit basis:** D-101A end-to-end public journey smoke audit (LOW findings F.1 + D.1)

---

## What Changed

### 1. `.commandbar` header layout (D-101A finding F.1)

The header element `<header class="commandbar">` previously had **no CSS rule** — its children (`.brand`, `.tabs`, `.statusline`) stacked as block elements, consuming extra vertical space (most noticeable on mobile). Added a flex-row rule that wraps gracefully on small screens:

```css
.commandbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
```

- `display:flex` + `align-items:center` lays brand / tabs / statusline in a single aligned row
- `flex-wrap:wrap` lets them wrap on narrow viewports instead of overflowing
- `gap:10px` gives consistent spacing without per-child margins

No existing breakpoint or layout rule was modified; this is purely additive.

### 2. `renderError` recovery (D-101A finding D.1)

The error panel previously showed only the backend message with no recovery affordance — the user had to rely on the persistent nav tabs. Added a "Back to Home" button:

```js
function renderError(e){document.getElementById('main').innerHTML=`<div class="panel"><h2>HumanX backend notice</h2><p class="small">${esc(e.message||e)}</p><div class="actions" style="margin-top:10px"><button class="primary" onclick="setMode('home')">← Back to Home</button></div></div>`}
```

A **Retry** button was deliberately **skipped** — there is no single safe generic retry pattern (`renderError` is called from multiple `catch` blocks with different fetch contexts), and the task said to add Retry only if a safe existing pattern exists. "Back to Home" routes through the existing `setMode('home')` which re-renders cleanly. No API behavior changed.

---

## Hardening Tests Added (Section 44 — 4 new tests, 324 → 328)

| # | Test |
|---|---|
| 44.1 | `.commandbar` CSS rule defined |
| 44.2 | `.commandbar` uses flex / wrap / gap layout |
| 44.3 | `renderError` includes a Back to Home recovery action (`setMode('home')`) |
| 44.4 | No backend/D1/wrangler/deploy references added in `renderError` |

---

## Safety Confirmation

| Check | Status |
|---|---|
| Display/CSS only | ✅ — one CSS rule + one recovery button |
| No API behavior change | ✅ — `renderError` still only renders a message; new button calls existing `setMode('home')` |
| No backend/schema/D1/data changes | ✅ |
| No moderation/admin actions | ✅ |
| No deploy/D1/live mutation | ✅ |
| Existing breakpoints untouched | ✅ — `.commandbar` rule is additive |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 324 passed, 0 failed | **328 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |

---

## Status

D-101B closes the two LOW cosmetic/UX findings from the D-101A end-to-end audit. With this, the D-93→D-101 public safety/clarity run has no outstanding frontend findings. Remaining deferred items (per-verdict definitions from the scoring model, first-run onboarding tour) require backend/schema thought and are out of scope for this pass.
