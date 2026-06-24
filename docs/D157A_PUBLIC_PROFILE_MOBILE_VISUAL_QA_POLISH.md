# D-157A — Public Profile Mobile / Visual QA Polish

**Date:** 2026-06-24
**Scope:** Frontend only (`public/app-v10.js`, `public/styles.css`). No backend changes. No migration. No `wrangler.toml`. No admin-route changes. No owner-token work.

---

## What Changed

### 1. Overflow safeguards — text wrapping

Added `overflow-wrap:anywhere` to:
- `.pp-display-name` — very long display names wrap instead of overflow
- `.pp-bio` — long bio text wraps cleanly
- `.pp-item-row .me-item-text` — long claim/evidence/pressure titles wrap in narrow rows

Added `min-width:0` to:
- `.pp-item-row` — prevents the flex container itself from overflowing its parent
- `.pp-item-row .me-item-text` — allows the flex child to shrink below its intrinsic content width; required for `overflow-wrap` to work inside flex

Without `min-width:0`, a flex item cannot shrink below its longest word, causing horizontal overflow on narrow viewports regardless of `overflow-wrap`.

### 2. Context block readability

Added `.pp-context-block .small { font-size:12px; line-height:1.5 }`. Previously the intro sentences inherited the global `.small` size of 10px at `line-height:1.35` — too small for a first-impression paragraph. Now 12px / 1.5 line-height. The disclaimer inside the block remains italic per `.pp-disclaimer`.

### 3. Footer action buttons — wrapping and mobile stack

Added `pp-footer-actions` class to the bottom action div in `renderPublicProfileHtml`. CSS:
```css
.pp-footer-actions { flex-wrap:wrap; gap:8px }
```

Mobile (`max-width:640px`):
```css
.pp-footer-actions { flex-direction:column }
.pp-footer-actions button { width:100% }
```

Previously: if both back button and copy-link button were rendered (non-owner visitor), they sat side by side on all screen sizes. On 375px screens the two buttons would be ~170px each with 6px gap — tight but passable. Now they stack vertically on mobile, each full width, with comfortable tap height from the existing `min-height:44px` rules on `.btn-secondary`.

### 4. Snapshot card distinction

`.pp-snapshot-card`: padding increased from 12px to 14px (consistent with other `.pp-card` cards), border-color tinted to `rgba(87,184,255,.35)` — a subtle blue that distinguishes the snapshot from the standard dark-border cards without clashing with the existing gradient.

### 5. D-154B/D-155A/D-156A features all preserved

Confirmed in smoke tests:
- `pp-context-block` + "HumanX is a public thinking profile" ✓
- "Claims being tested", "Public truths", "Questions under pressure" labels ✓
- `const BATCH=5` (first-5 default) ✓
- `aria-expanded="false"` on show-more buttons ✓
- `'Copied!'` feedback in `copyPublicProfileLink` ✓

---

## Mobile / Readability Improvements

| Area | Before | After |
|---|---|---|
| Long titles in item rows | May overflow flex row | `overflow-wrap:anywhere` + `min-width:0` — wrap cleanly |
| Long display names | May overflow header card | `overflow-wrap:anywhere` added |
| Long bio text | May overflow | `overflow-wrap:anywhere` added |
| Context block text | 10px / 1.35 line-height | 12px / 1.5 — readable intro paragraph |
| Footer buttons (visitor, mobile) | Side by side, ~170px each | Stacked full-width (flex-direction:column) |
| Snapshot card | Padding 12px, same dark border as all cards | Padding 14px, blue-tinted border — stands out |

---

## Privacy Boundary Confirmation

No API or backend change. No new field rendered. All changes are pure CSS layout/visual rules. The `pp-footer-actions` class addition to the JS is a presentational class with no data implications.

---

## Baseline

New section 90 added to `scripts/hardening-smoke-test.mjs` (13 new tests).

```
node scripts/hardening-smoke-test.mjs       → 1120 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## Recommended Next Step

**D-157B** — Bump deploy metadata for D-157A and live-verify. Owner runs preflight from connected terminal and pastes verbatim output before checkpoint commit.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
