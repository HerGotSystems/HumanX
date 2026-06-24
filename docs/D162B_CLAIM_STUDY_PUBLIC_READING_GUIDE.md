# D-162B — Claim Study Public Reading Guide

**Date:** 2026-06-24
**Scope:** Frontend only — `public/app-v10.js`, `public/styles.css`. No backend, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Orientation sentence below claim title (`renderStudy`)

Added immediately after `<h2>` (claim title):

> "This public study shows the evidence, pressure, votes, and truth trail currently shaping this claim."

CSS class `.study-intro`: muted colour, `line-height: 1.45`, 2px top / 6px bottom margin.

### 2. Inline meter key (`renderStudy`)

Added below the three meter bars (Evidence / Testability / Survivability):

> "Evidence shows support gathered. Testability shows whether the claim can be checked. Survivability shows how well it holds up under pressure."

CSS class `.study-meter-key`: muted, 85% opacity, `line-height: 1.4`. No longer tooltip-only.

### 3. Vote note (`renderStudy`)

Added inside `.study-votes`, below the three vote buttons:

> "Votes show public reaction. They do not directly decide the verdict."

CSS class `.study-vote-note`: muted, 10px font, `flex-basis: 100%` so it wraps under the buttons.

### 4. RunPack button tooltip (`renderStudy`)

Added `title` attribute to the Build RunPack button:

> "Build RunPack creates a portable investigation packet for this claim — paste into any AI for analysis"

Button label unchanged. No layout change.

### 5. "Claim Flow" → "How this claim is being tested" (`sectionArgumentFlow`)

Heading: `Claim Flow` → **`How this claim is being tested`**
Badge: `read this first` → **`start here`**

The section still shows the same four-step layout (Why people think it is true / What attacks it / How to test it / What analysis says). Only the heading changed.

### 6. "Lineage" → "Origin and truth trail" (`sectionLineage`)

Heading: `Lineage` → **`Origin and truth trail`**
Badge: `upstream origin` → **`where this claim came from`**

Added a supporting sentence below the section head:

> "This shows where the claim came from and whether it has produced public truths."

CSS class `.study-lineage-note`: muted, `line-height: 1.4`, 6px bottom margin.

### 7. CSS additions (`styles.css`)

```css
.study-intro        { margin:2px 0 6px; color:var(--muted); line-height:1.45 }
.study-meter-key    { margin:3px 0 0; color:var(--muted); line-height:1.4; opacity:.85 }
.study-vote-note    { color:var(--muted); font-size:10px; line-height:1.3; flex-basis:100%; margin:0 }
.study-lineage-note { margin:0 0 6px; color:var(--muted); line-height:1.4 }
```

---

## Why It Improves First-Time Visitor Understanding

| Before | After |
|---|---|
| Claim title with no context | Orientation sentence: "This public study shows the evidence, pressure, votes, and truth trail…" |
| Meter bars with hover tooltips only | Inline meter key: "Evidence shows support gathered. Testability shows…" |
| "Claim Flow" (opaque jargon) | "How this claim is being tested" (self-explanatory) |
| "read this first" badge (implied) | "start here" badge (explicit) |
| "Lineage" + "upstream origin" | "Origin and truth trail" + "where this claim came from" |
| Vote buttons with no context | Vote note: "Votes show public reaction. They do not directly decide the verdict." |
| Build RunPack button unexplained | `title` tooltip: "creates a portable investigation packet…" |

A first-time visitor arriving via "Investigate →" can now understand within 5 seconds what they are looking at, what the meters mean, and what each section represents — without reading the sidebar or hovering over tooltips.

---

## Privacy / Public Boundary Confirmation

- No backend changes of any kind
- `GET /api/claims/:id` remains unauthenticated, scoped to `review_state='public'`
- `evidence` and `pressure` items rendered in the study view remain scoped to `COALESCE(review_state,'public')='public'` — no widening of exposure
- No new fields are rendered by any of the six copy changes
- No email, is_admin, owner token, admin token, invite code, or user_id is rendered anywhere in the study view

### Public evidence/pressure body note

`evidence.body` and `pressure_points.body` continue to be shown in the Investigation Board — this is intentional and correct. These are approved public items. The public profile endpoint (`/u/:slug`) separately omits bodies (summary-level only). Both surfaces are correctly scoped. D-162B does not change this behaviour.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1187 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

14 new smoke tests added in Section 95.

---

## Recommended Next Step

D-162C: Bump, deploy, and owner-terminal preflight live verify. Expected:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-162B <commit> 1187/24/57
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
