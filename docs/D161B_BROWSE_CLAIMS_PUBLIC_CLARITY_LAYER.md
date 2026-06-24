# D-161B — Browse Claims Public Clarity Layer

**Date:** 2026-06-24
**Scope:** Frontend only — `public/app-v10.js`, `public/index.html`, `public/styles.css`. No backend, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Intro subheading in `renderArena()` (`public/app-v10.js`)

Added below `<h2>Claims</h2>`:

> "Claims are public ideas being tested. Open one to see the evidence, pressure, and truth trail behind it."

CSS class `.arena-intro`: `color: var(--muted)`, `flex-basis: 100%`, `line-height: 1.45`. Appears inline under the heading before the card grid — visible to a first-time visitor within 2 seconds.

### 2. Graph stats box collapsed behind `<details>` toggle (`public/app-v10.js`)

The `graphBox()` output (Claims / Evidence / Truths / Links / Votes / Reports counts) is now wrapped in:

```html
<details class="arena-stats-details">
  <summary class="small arena-stats-summary">Show public network stats</summary>
  …graphBox()…
</details>
```

Default: **closed**. All stats remain present — the toggle makes them available without leading the first-time visitor experience with count data that reads as an admin panel.

CSS classes: `.arena-stats-details` (full-width, 6px top margin), `.arena-stats-summary` (muted colour, no marker, opens to `var(--text)` colour on expand).

### 3. Claim card CTA renamed (`public/app-v10.js`)

`card()` CTA button label: `Study Claim →` → **`Investigate →`**

`card(c, true)` is only called in `renderArena()` — confirmed no other call sites. The rename is safe and does not affect study mode or any other view.

### 4. Verdict filter explanation (`public/index.html`)

The `#filter` select and the adjacent `.verdict-qualifier` span both updated:

- `title` attribute on the select: "Verdicts show how well a public claim is currently surviving evidence and pressure. They are not automatic truth rulings."
- `.verdict-qualifier` span text updated from "Verdicts are pressure-test labels, not automatic truth rulings." to: **"Verdicts show how well a claim is surviving evidence and pressure — not automatic truth rulings."**

This is a global element visible in the searchbar area whenever the filter is shown.

### 5. Error state heading (`public/app-v10.js`)

`renderError()` heading: `HumanX backend notice` → **`Something went wrong`**

Technical detail (error message) is still shown below the heading. The "← Back to Home" action button is unchanged.

---

## Why It Improves First-Time Visitor Understanding

| Before | After |
|---|---|
| `<h2>Claims</h2>` with no explanation | Intro: "Claims are public ideas being tested…" inline |
| Graph stats visible immediately (reads as admin panel) | Graph stats collapsed, available via "Show public network stats" |
| "Study Claim →" (unusual verb for visitors) | "Investigate →" (universally understood) |
| "Verdicts are pressure-test labels" (abstract) | "Verdicts show how well a claim is surviving evidence and pressure" (concrete) |
| "HumanX backend notice" (developer language) | "Something went wrong" (visitor-safe) |

A first-time visitor now reads within 5 seconds:
1. "Claims are public ideas being tested. Open one to see the evidence, pressure, and truth trail behind it."
2. A grid of claim cards with coloured status badges and "Investigate →" CTAs
3. Verdict filter with inline explanation on hover/focus

---

## Stats / Details Behaviour

The graph stats (`<details class="arena-stats-details">`) default to **closed**. The summary reads "Show public network stats". Clicking expands the full `graphBox()` output. The stats are not removed — they are preserved for users who want them. No backend change involved.

---

## Privacy Boundary Confirmation

- `/api/claims` remains unauthenticated (no `requireUser` gate added)
- `listClaims()` still filters `WHERE COALESCE(review_state,'public')='public'` — only approved rows returned
- `mapClaim()` still excludes `user_id`, `email`, `is_admin`, `evidence.body`, `pressure_points.body`
- `handle` remains public pseudonym
- No new fields exposed by any of the five changes

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1173 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

12 new smoke tests added in Section 94.

---

## Recommended Next Step

D-161C: Bump, deploy, and owner-terminal preflight live verify. Expected:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-161B <commit> 1173/24/57
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
