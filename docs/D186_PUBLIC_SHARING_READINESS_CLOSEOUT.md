# D-186 Public Landing / Sharing Readiness — Closeout

**Merged:** 2026-06-28  
**Patches:** D-186A through D-186E  
**Baseline at close:** 1525 / 24 / 57 (hardening / belief-engine / worker-route)

---

## What the series did

D-186A was a full source-code audit of what a first-time or shared-link visitor experiences — anonymous access, public profile routes, OG/social metadata, and dead-end risks. D-186B through D-186D applied the quick fixes from the audit. D-186E is this closeout document.

---

## D-186A — Audit

**Files inspected:** `public/app-v10.js`, `public/index.html`, `src/worker.js`  
**Method:** Source-code review of all visitor-facing routes and render paths

**Routes inspected:**

| Route | Served by |
|-------|-----------|
| `/` | Static `index.html` → SPA, `mode='home'` |
| `/u/:slug` (resolved) | Worker injects OG meta → same `index.html` → `mode='publicProfile'` |
| `/u/:slug` (missing/private) | Same shell, "Profile not found or not public." |
| Direct claim URL | Does not exist — no `/claim/:id` or `/c/:id` route |
| `#/u/:slug` | Hash fallback, client-side only |

**Issues found (12 total — 3 P1, 4 P2, 5 P3):**

| ID | Severity | Issue |
|----|----------|-------|
| S-1 | P1 | "invite-only preview" badge never says visitors can browse immediately — signals locked door |
| S-2 | P1 | No `og:image` on `/u/:slug` — blank link previews on all platforms |
| S-3 | P1 | No OG tags at all on root `/` — sharing the home URL shows an empty card |
| S-4 | P2 | Public profile dead end — no "Browse all claims" CTA after viewing |
| S-5 | P2 | No visible invite path — only buried in account panel small print |
| S-6 | P2 | Back button after "View in HumanX →" from profile reads "← Back to Claims" |
| S-7 | P2 | No direct claim URL — claims cannot be individually linked |
| S-8 | P3 | "View a public profile example →" easy to miss — small inline `<a>` in a paragraph |
| S-9 | P3 | No favicon or `apple-touch-icon` |
| S-10 | P3 | Profile 404 copy bare — no suggestion to ask the sharer for the correct link |
| S-11 | P3 | No `<meta name="description">` on root |
| S-12 | P3 | `twitter:card: summary` — not `summary_large_image` |

---

## D-186B — Landing + profile quick fixes

**Files:** `public/index.html`, `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`

**Fixes applied:**

1. **Root OG/social metadata** added to `index.html`:
   - `<meta name="description">` with tagline copy
   - `og:title`, `og:description`, `og:type=website`
   - `twitter:card=summary` (upgraded to `summary_large_image` in D-186C)
   - Addresses S-3, S-11

2. **Hero access clarity** — new `<p class="cc-access-note small">` in `renderHome()`:
   > "You can browse and read public claims without an account. Submitting, saving, and public profile controls require an invite. Invite codes are shared directly by members while HumanX is in early access."
   - Addresses S-1, S-5

3. **Public profile footer CTA** — `Browse all claims →` button added to `pp-footer-actions` in `renderPublicProfileHtml()`, using existing `data-action="setMode" data-value="arena"` dispatcher
   - Addresses S-4

4. **Smoke test slices widened** — new paragraph pushed content past `idx+1000` / `idx+4000` windows in D-159B/D-160B tests; widened to `idx+1200` / `idx+4200`

---

## D-186C — OG image asset (SVG placeholder)

**Files:** `public/og-default.svg` (created), `public/index.html`, `src/worker.js`, `scripts/hardening-smoke-test.mjs`

Created `public/og-default.svg` (1200×630):
- Dark background `#07080d` with purple/red radial gradients matching the app body
- "HumanX" in 110px bold white
- Blue subtitle: `CLAIMS · EVIDENCE · PRESSURE · STUDY`
- Muted tagline + domain footer line

Wired into:
- `index.html`: `og:image` + `twitter:image` → `/og-default.svg`
- `src/worker.js`: `ogImage` computed from `${url.origin}/og-default.svg` (domain-agnostic); added to profile `metaBlock`; `twitter:card` upgraded to `summary_large_image`

Updated D-143B smoke test — old "no OG image" prohibition replaced with D-186C positive assertion confirming the image is wired.

---

## D-186D — PNG final asset

**Files:** `public/og-default.png` (1536×1024, generated), `public/index.html`, `src/worker.js`, `scripts/hardening-smoke-test.mjs`

Replaced SVG placeholder with the generated PNG for universal crawler compatibility:
- Twitter/X, Facebook, Slack, WhatsApp, iMessage, LinkedIn all support PNG reliably
- SVG coverage on social crawlers is inconsistent
- `og-default.svg` retained at the same path as reference; nothing in metadata points to it

All three `og:image` / `twitter:image` references updated: `og-default.svg` → `og-default.png`

Remote had the PNG from a direct GitHub upload (`e8b514a Add files via upload`); local commit rebased on top cleanly.

---

## Final public sharing state

### Root `/`

```html
<meta name="description" content="Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence. HumanX organises what people assert — it does not decide what is true.">
<meta property="og:title" content="HumanX — Belief → Truth → Claim → Evidence">
<meta property="og:description" content="...same...">
<meta property="og:type" content="website">
<meta property="og:image" content="https://humanx.rinkimirikata.com/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://humanx.rinkimirikata.com/og-default.png">
```

### `/u/:slug` (resolved public profile)

Worker injects (domain-agnostic via `url.origin`):
- `og:title`: `{{displayName}} on HumanX`
- `og:description`: profile bio (160-char truncation) or fallback
- `og:type`: `profile`
- `og:url`: canonical profile URL
- `og:image`: `{{origin}}/og-default.png`
- `twitter:card`: `summary_large_image`
- `twitter:image`: `{{origin}}/og-default.png`
- `<link rel="canonical">`: profile URL
- `<meta name="robots" content="noindex">`: unconditional

### Home hero (anonymous visitor)

Visible without any account action:
> "You can browse and read public claims without an account. Submitting, saving, and public profile controls require an invite. Invite codes are shared directly by members while HumanX is in early access."

### Public profile footer

Two CTAs for non-owner visitors: `Copy profile link` + `Browse all claims →`

---

## What S-1 through S-12 look like now

| ID | Status |
|----|--------|
| S-1 | ✅ Fixed — access note explains browse-without-account |
| S-2 | ✅ Fixed — `og:image` on `/u/:slug` → `og-default.png` |
| S-3 | ✅ Fixed — root OG tags + `og:image` added to `index.html` |
| S-4 | ✅ Fixed — `Browse all claims →` in profile footer |
| S-5 | ✅ Fixed — invite path explained in home hero |
| S-6 | Open — "← Back to Claims" label after viewing Study from a profile (minor) |
| S-7 | Open — no `/c/:id` direct claim URL |
| S-8 | Open — "View a public profile example →" still easy to miss |
| S-9 | Open — no favicon |
| S-10 | Open — profile 404 copy bare |
| S-11 | ✅ Fixed — `<meta name="description">` added to `index.html` |
| S-12 | ✅ Fixed — `twitter:card=summary_large_image` |

---

## Remaining later ideas

1. **Direct claim URL `/c/:id`** — no route exists to deep-link into a specific claim. Requires: worker route intercept → OG meta injection (claim title + evidence count) → SPA boot → auto-open Study mode. Medium effort, high sharing value. Planned as D-187A+ after audit.

2. **Per-profile / per-claim dynamic OG images** — the current `og-default.png` is a static generic card. A dynamic image (e.g. Satori/Canvas in the Worker) could show the profile owner's display name and claim count. Multi-day effort — deferred.

3. **Invite / request-access page** — the invite path is now explained in copy, but there is no `/access` or `/about` page for visitors who want to join. A lightweight static page or modal would reduce friction for referred users who don't know what to do with the link. Low-code effort.

4. **Social preview validation pass** — use Facebook Debugger, Twitter Card Validator, LinkedIn Post Inspector, and Slack's unfurl to confirm the PNG renders correctly for each platform. Best done after a deploy cycle.

5. **Favicon + PWA assets** — no `<link rel="icon">`, no `apple-touch-icon`, no `manifest.json`. Browser tabs and home-screen shortcuts show a blank icon. One-step addition once an icon asset is created.

6. **Profile 404 copy (S-10)** — "Profile not found or not public." has a Back button but no helpful context. Could add: "If someone shared this link with you, the profile may be private or the URL may have changed. Ask them to send it again."

---

## Commit log

```
cf8a6b7 D-186D — switch OG image from SVG to generated PNG
e8b514a Add files via upload  (direct GitHub upload of og-default.png)
94dc3a4 D-186C — OG image asset + social preview wiring
277882a D-186B — public landing + sharing quick fixes
26e8622 D-186A — public landing / sharing readiness audit (doc only)
```
