# D-155A — Public Profile Density / Readability Polish

**Date:** 2026-06-24
**Scope:** Frontend only (`public/app-v10.js`, `public/styles.css`). No backend changes. No migration. No `wrangler.toml`. No admin-route changes. No owner-token work.

---

## What Changed

### 1. Show-more / Show-less toggle for evidence and pressure (`app-v10.js`)

New global helper `ppToggleShowMore(btn)`:
- Finds the `.pp-more-items` sibling, toggles `display:none`
- Updates button label between `Show N more` and `Show less`
- Pure DOM — no fetch, no api(), no env access, no backend call

`renderPublicProfileEvidenceHtml` and `renderPublicProfilePressureHtml` both updated:
- First 5 items rendered in the normal list (always visible)
- Items 6–10 wrapped in `<div class="pp-more-items" style="display:none">` (hidden by default)
- A `<button class="btn-pp-show-more">` toggle appended only when the list exceeds 5 items
- Lists of 5 or fewer render identically to before (no toggle rendered)

### 2. Empty state copy

| Function | Before | After |
|---|---|---|
| `renderPublicProfileEvidenceHtml` | "No public evidence yet." | "No public supporting evidence yet." |
| `renderPublicProfilePressureHtml` | "No public pressure points yet." | "No public questions under pressure yet." |
| Claims, Truths | unchanged | unchanged |

### 3. Spacing and hierarchy (`styles.css`)

| Rule | Before | After |
|---|---|---|
| `.pp-header` gap | 2px | 4px |
| `.pp-display-name` font-size | 18px | 22px |
| `.pp-display-name` | no letter-spacing | `letter-spacing: -.02em` |
| `.pp-slug` font-size | inherited (~10px) | 11px explicit |
| `.pp-bio` | `margin:4px 0 0` | `margin:6px 0 0; font-size:13px; line-height:1.5; color:var(--text)` |
| `.pp-card` padding | via `.panel` (10px) | explicit 14px |
| `.pp-counts-card h3` | `margin:0 0 6px` | `margin:0 0 8px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted)` (de-emphasised) |
| `.pp-section` padding | via `.panel` (10px) | explicit 14px |
| `.pp-section h3` | no explicit rule | `margin:0 0 10px; font-size:14px; font-weight:700; color:var(--text)` |
| `.pp-item-list` gap | 6px | 8px |
| `.pp-item-row` padding | `8px 10px` | `10px 12px` |
| `.pp-item-row` align-items | center | flex-start (title wraps naturally) |
| `.pp-item-row .me-item-text` | no explicit rule | `font-size:13px; color:var(--text); line-height:1.45; flex:1 1 55%` |
| `.pp-item-row .me-item-meta` | no explicit rule | `font-size:10px; color:var(--muted); white-space:nowrap; margin-top:2px` |
| `.pp-empty` | `margin:4px 0` | `margin:6px 0; font-size:12px` |
| `.btn-pp-show-more` | did not exist | new rule: full-width, blue text, line border, hover |
| Mobile `.pp-header` padding | 8px | 10px |
| Mobile `.pp-display-name` | 16px | 18px |

---

## Why It Improves Visitor Experience

- **Display name as headline.** 22px + letter-spacing means the visitor immediately knows whose profile they're on.
- **Bio readable.** 13px + line-height 1.5 vs. inheriting the global 10px `small` class treatment.
- **Section headings have weight.** Explicit 14px bold h3 separates sections clearly instead of blending in.
- **Row titles scannable.** 13px `var(--text)` vs. the former uniform "everything is small/muted" look. Metadata (category, quality, severity) is now visually subordinate.
- **Evidence/pressure not wall-like.** A list of 10 raw evidence titles in a row is replaced by 5 visible + a disclosure button. The toggle is pure client-side — no API call, no additional data exposure.
- **Counts de-emphasised.** The "Public Activity" card h3 is now uppercase muted text — a label, not a headline. The section section headers carry the actual hierarchy.

---

## Privacy Boundary Confirmation

No backend change. No new API field rendered. The show-more toggle reveals items that were already fetched in the original API response and already present in the DOM — it does not fetch additional data. `ppToggleShowMore` contains no `fetch()`, no `api()` call, no `process.env` access.

Fields confirmed not rendered by any public-profile function:
- `is_admin`, `email`, `owner_token`, `user.id` — not in any render function
- `evidence.body`, `evidence.source_url` — not in response; API never returns them
- `pressure_points.body` — not in response; API never returns it
- `is_shadow_banned`, `profile_public` — not in response

---

## Mobile / Readability Notes

Mobile breakpoint updated (`max-width:640px`):
- `.pp-header`/`.pp-counts-card`/`.pp-section` padding: 8px → 10px (slight increase from D-154B's 8px)
- `.pp-display-name`: 16px → 18px (D-154B had 16px, now 18px to track the desktop bump proportionally)

Item rows use `flex-wrap:wrap` and `align-items:flex-start`, so long titles still wrap correctly on narrow viewports.

---

## D-154B Clarity Copy Preserved

All D-154B additions confirmed present:
- `pp-context-block` with "HumanX is a public thinking profile" intro copy ✓
- Vocabulary guide row ✓
- Section labels: "Claims being tested", "Public truths", "Supporting evidence", "Questions under pressure" ✓
- "View in HumanX →" CTA ✓
- "Copy profile link" visitor CTA ✓

---

## Baseline

New section 88 added to `scripts/hardening-smoke-test.mjs` (18 new tests).

```
node scripts/hardening-smoke-test.mjs       → 1091 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## Recommended Next Step

**D-155B** — Bump deploy metadata for D-155A and verify live on `https://humanx.rinkimirikata.com/u/calenhir`. Owner runs preflight from a connected terminal.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
