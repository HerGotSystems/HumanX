# D-156A — Public Profile Interaction / Accessibility Polish

**Date:** 2026-06-24
**Scope:** Frontend only (`public/app-v10.js`, `public/styles.css`). No backend changes. No migration. No `wrangler.toml`. No admin-route changes. No owner-token work.

---

## What Changed

### 1. Show more / Show less — accessibility attributes

`ppToggleShowMore(btn)` updated:
- Now calls `btn.setAttribute('aria-expanded', showing ? 'false' : 'true')` on each toggle
- `aria-expanded` starts as `"false"` (rendered in the initial HTML) and flips correctly with each press

`renderPublicProfileEvidenceHtml`:
- Hidden overflow container: `<div class="pp-more-items" id="pp-more-ev" style="display:none">`
- Toggle button: `aria-expanded="false" aria-controls="pp-more-ev"`

`renderPublicProfilePressureHtml`:
- Hidden overflow container: `<div class="pp-more-items" id="pp-more-pr" style="display:none">`
- Toggle button: `aria-expanded="false" aria-controls="pp-more-pr"`

Screen readers now know: (a) the button controls a specific region, (b) whether that region is currently expanded.

### 2. Copy profile link — "Copied!" feedback

`copyPublicProfileLink(btn, slug)` signature updated (was `(slug)`, now `(btn, slug)`):

- `renderPublicProfileHtml` passes `this` as the first argument: `onclick="copyPublicProfileLink(this,'...')"`
- On click: `btn.textContent = 'Copied!'` + `btn.disabled = true`
- On success or after 1500ms: reset to `'Copy profile link'` + `btn.disabled = false`
- `navigator.clipboard` path: resets via `.then(() => setTimeout(reset, 1500))` or immediately on `.catch()`
- Fallback path (`execCommand`): resets via `setTimeout(reset, 1500)` regardless of whether copy succeeded
- No fetch, no api(), no backend call in any path

### 3. `.btn-secondary` CSS

`Copy profile link` was rendered with `class="btn-secondary"` but that class had no style definition. Added:
```css
.btn-secondary { border-color: var(--blue); color: var(--blue); }
.btn-secondary:hover { background: rgba(87,184,255,.1); }
```

The button now has a distinct blue-border appearance, distinguishing it from the primary red-gradient back button.

### 4. Mobile tap area

In `@media (max-width:640px)`:
- `.btn-pp-show-more`: `padding: 10px 12px; min-height: 44px`
- `.btn-secondary`: `min-height: 44px; padding: 10px`

Meets the 44px minimum tap-target guidance for mobile.

---

## Accessibility Notes

- `aria-expanded` on the show-more button is the standard pattern for disclosure widgets (ARIA Authoring Practices 3.2 — Disclosure). Screen readers announce "Show 3 more, collapsed" / "Show less, expanded" as the user navigates.
- `aria-controls` links the button to its controlled region by `id`. This is advisory — not all screen readers use `aria-controls`, but it provides an explicit relationship when supported.
- Hidden items use `style="display:none"` which removes them from the accessibility tree entirely (not just visually hidden) — correct for content that hasn't been disclosed yet.
- The button remains in the DOM and in tab order regardless of state — the visitor can tab to it and trigger it from keyboard.
- Copy feedback (`Copied!` + `disabled`) means keyboard and screen-reader users get the same state signal as sighted users.

---

## Privacy Boundary Confirmation

No API or backend change. No new field rendered. No change to what the API returns or what the frontend reads from the response. `ppToggleShowMore` and `copyPublicProfileLink` are pure client-side DOM operations — no fetch, no api(), no process.env.

---

## D-154B / D-155A Copy and Behaviour Preserved

- `pp-context-block` with "HumanX is a public thinking profile" ✓
- "Claims being tested", "Public truths", "Questions under pressure" section labels ✓
- "View in HumanX →" CTA ✓
- `BATCH=5` first-5 default density ✓
- "Copy profile link" button ✓ (now with feedback)

---

## Baseline

New section 89 added to `scripts/hardening-smoke-test.mjs` (16 new tests).

```
node scripts/hardening-smoke-test.mjs       → 1107 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## Recommended Next Step

**D-156B** — Bump deploy metadata for D-156A and live-verify on `https://humanx.rinkimirikata.com/u/calenhir`. Owner runs preflight from a connected terminal and pastes verbatim output.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
