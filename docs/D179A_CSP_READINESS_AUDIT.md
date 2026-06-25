# D-179A — Content Security Policy Readiness Audit

**Date:** 2026-06-25
**Local commit:** 1137c78 (D-178D)
**Baseline:** 1358/24/57
**Type:** Audit only. No source code changes.

---

## Executive Summary

HumanX cannot adopt a strict `'no-unsafe-inline'` CSP without significant frontend refactoring. The main SPA uses 47+ inline `onclick` event handlers generated in JS template literals and 25+ inline `style` attribute strings. The belief engine subapp contains a large inline `<style>` block, a large inline `<script>` block, and 24 inline `onclick` handlers. It also loads Google Fonts from an external origin.

However, a **permissive but meaningful CSP** — one that includes `'unsafe-inline'` for scripts and styles but blocks all external origins, `<object>`/`<embed>`, framing, and `javascript:` URLs — is deployable today with no frontend refactoring. This provides real protection at low implementation cost and is the recommended D-179B target.

A strict no-unsafe-inline CSP is a multi-sprint refactor deferred beyond D-179B/C.

---

## CSP Dependency Matrix

### `public/index.html`

| Surface | Details | CSP directive needed |
|---|---|---|
| `<script src="/app-v10.js?v=5">` | Same-origin external JS file | `script-src 'self'` ✓ |
| `<link rel="stylesheet" href="/styles.css?v=10">` | Same-origin external CSS | `style-src 'self'` ✓ |
| `<style>` block (noscript) | Inline CSS for noscript fallback (lines 11–16) | `style-src 'unsafe-inline'` ← **required** |
| `onclick="toggleAccountPanel()"` | Inline event handler on `#who` span | `script-src 'unsafe-inline'` ← **required** |
| `onclick="setMode(...)"` (×3 nav buttons) | Inline event handlers on tab buttons | `script-src 'unsafe-inline'` ← **required** |
| `oninput="searchCurrent()"` | Inline handler on `#search` input | `script-src 'unsafe-inline'` ← **required** |
| `onchange="searchCurrent()"` | Inline handler on `#filter` select | `script-src 'unsafe-inline'` ← **required** |
| `style="cursor:pointer"` | Inline style on `#who` span | `style-src 'unsafe-inline'` ← **required** |

### `public/app-v10.js`

| Surface | Details | CSP directive needed |
|---|---|---|
| `const API = ''` — `fetch(API + path, ...)` | All API calls are same-origin only | `connect-src 'self'` ✓ |
| `onclick="..."` in template literals (47 occurrences) | JS-generated HTML with inline event handlers set via `innerHTML` | `script-src 'unsafe-inline'` ← **required** |
| `style="width:${v}%"` in `meter()` / `deltaMeter()` | Dynamic width computed from score values; set via `innerHTML` | `style-src 'unsafe-inline'` ← **required** |
| Other `style="..."` attrs (25 total) | Layout flags: `display:none`, `grid-column:1/-1`, `margin-top:3px`, etc. | `style-src 'unsafe-inline'` ← **required** |
| `URL.createObjectURL(blob)` + `a.href = blobUrl` (3 download fns) | Blob URL set as anchor href for file download; revoked immediately | No CSP restriction for download anchors; `blob:` in `connect-src` only needed if blob URLs are fetched |
| `document.createElement('a')` / `appendChild` / `click()` | DOM manipulation for download trigger | No CSP concern |
| No `eval`, `new Function`, `document.write` | — | — |
| No external script/style/font origins | — | — |
| No iframes, workers, postMessage, object, embed | — | — |

### `public/apps/humanx-belief-engine/index.html`

| Surface | Details | CSP directive needed |
|---|---|---|
| `<style>` block with `@import url('https://fonts.googleapis.com/...')` | Large inline CSS including Google Fonts import | `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` ← **required** |
| Font files served from `fonts.gstatic.com` | Google Fonts CDN font delivery | `font-src https://fonts.gstatic.com` ← **required** |
| Inline `<script>` block (entire engine JS) | All belief engine logic is inline, not a separate file | `script-src 'self' 'unsafe-inline'` ← **required** |
| `onclick` handlers (24 occurrences in HTML) | Inline event handlers on UI buttons | `script-src 'unsafe-inline'` ← **required** |
| `<script src="./humanx-bridge.js">` | Same-origin external JS | `script-src 'self'` ✓ |
| `innerHTML` used in engine JS | Same pattern as main SPA — renders structured data | `'unsafe-inline'` required for inline handlers only; `innerHTML` itself is not a CSP concern |

### `public/apps/humanx-belief-engine/humanx-bridge.js`

| Surface | Details | CSP directive needed |
|---|---|---|
| `fetch('/api/session', ...)` | Same-origin only | `connect-src 'self'` ✓ |
| `localStorage` reads/writes | Not a CSP concern | — |
| `crypto.randomUUID()` | Not a CSP concern | — |

### `renderPublicProfileShell()` — `/u/:slug` (Worker, `src/worker.js`)

| Surface | Details | CSP directive needed |
|---|---|---|
| Serves `index.html` with injected OG meta tags | Inherits all `index.html` inline scripts/styles | Same as `index.html` requirements |
| No additional inline scripts added by server injection | Meta tags only (title, og:*, canonical) | — |
| D-178B added `Referrer-Policy: no-referrer` | Present | — |
| No CSP header currently set on this response | Gap — see Findings | F2 |

---

## Inline Script Verdict

**Verdict: `'unsafe-inline'` is required for the current app.**

Sources requiring `script-src 'unsafe-inline'`:
1. `index.html` — 5 inline event handlers directly in HTML (`onclick`, `oninput`, `onchange`)
2. `app-v10.js` — 47 `onclick="..."` strings generated in template literals and injected via `innerHTML`
3. Belief engine HTML — 24 inline `onclick` handlers + entire engine JS as an inline `<script>` block

Without `'unsafe-inline'`, all inline event handlers on dynamically generated HTML would be silently blocked by the browser. The app would lose all button interactivity.

**Note:** CSP `'unsafe-inline'` blocks `javascript:` URLs even when inline handlers are allowed. This is still meaningful protection.

---

## Inline Event Handler Verdict

**Verdict: Cannot remove without significant refactoring.**

The 47 `onclick` instances in `app-v10.js` template literals are the largest barrier to a strict CSP. These would require either:
- Event delegation (one root listener + `data-action` attributes) — large refactor
- Individual `addEventListener` calls after each `innerHTML` assignment — smaller refactor but error-prone at scale
- Worker-injected nonces into each HTML response — deployment friction

This is a D-179C+ task, not D-179B.

---

## Inline Style Verdict

**Verdict: `style-src 'unsafe-inline'` is required for the current app.**

Sources requiring `style-src 'unsafe-inline'`:
1. `index.html` — 1 `<style>` block (noscript), 1 `style="cursor:pointer"` attribute
2. `app-v10.js` — 25 `style="..."` attributes generated in template literals (meter bar widths, display flags, layout overrides)
3. Belief engine HTML — large inline `<style>` block with Google Fonts `@import`

The meter bar `style="width:${v}%"` pattern is the primary barrier: the bar fill width is a computed value that cannot be expressed without either inline styles or CSS custom properties on each element.

**Possible mitigation (D-179C):** Replace `style="width:${v}%"` with `--meter-fill: ${v}%` as an inline CSS custom property, then reference it from a class rule. Some browsers count inline custom properties as `'unsafe-inline'`; others allow them under `style-src 'nonce-...'`. This requires verification before deployment.

---

## External Origin / `connect-src` Verdict

**Main SPA:** All `fetch()` calls in `app-v10.js` use `const API = ''` — the base is an empty string, so all requests are same-origin. No external API origins. `connect-src 'self'` is sufficient.

**Belief engine:** `humanx-bridge.js` fetches `'/api/session'` — same-origin. `connect-src 'self'` is sufficient.

**External font origins:**
- `style-src https://fonts.googleapis.com` — for Google Fonts CSS import in belief engine
- `font-src https://fonts.gstatic.com` — for actual font file delivery

These are needed only for the belief engine subapp. The main SPA (`/`, `/u/:slug`) does not load any external fonts and would not need these in its CSP.

**Summary:** No external `script-src` origins needed. No CDN JS. No third-party analytics, tracking, or external widgets.

---

## Public Profile Shell CSP Verdict

**Verdict: No CSP header currently set on `/u/:slug` HTML responses. Defer to D-179B.**

`renderPublicProfileShell()` serves `index.html` with injected OG meta tags. D-178B added `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer` to this response. A CSP header on this response would cover the full SPA (since the profile shell IS the SPA). The main SPA CSP and the profile shell CSP should be identical.

The profile shell does not add any new external origins beyond what `index.html` itself requires.

---

## Strict CSP Breakage Risk

If `Content-Security-Policy: script-src 'self'` (no `'unsafe-inline'`) were deployed today:

| Feature | Would break? | Reason |
|---|---|---|
| Navigation tab buttons | **Yes** | `onclick="setMode(...)"` on all tabs |
| Account panel toggle | **Yes** | `onclick="toggleAccountPanel()"` |
| Search bar | **Yes** | `oninput="searchCurrent()"` |
| All `<button onclick="...">` in dynamic HTML | **Yes** | 47 inline handler strings blocked |
| Noscript styles | Yes (minor) | Inline `<style>` blocked (noscript only) |
| Meter bars | **Yes** | `style="width:${v}%"` blocked if `style-src` is strict |
| Belief engine UI | **Yes** | Entire inline `<script>` + 24 `onclick` + inline `<style>` |
| Belief engine fonts | **Yes** | `@import url('https://fonts.googleapis.com')` from inline style |
| JSON downloads | No | `blob:` anchor download unaffected |
| API calls | No | `connect-src 'self'` covers all same-origin fetch |

---

## Findings and Risk Classification

### F1 — App requires `script-src 'unsafe-inline'` (Acceptable with staged plan)

| | |
|---|---|
| **Surface** | `index.html` (5 handlers), `app-v10.js` (47 template-literal handlers), belief engine (24 handlers + inline script) |
| **Current behavior** | No CSP; inline handlers work freely |
| **CSP dependency** | `script-src 'unsafe-inline'` required for current code |
| **Security value of removal** | High — removes inline handler execution surface |
| **Breakage risk** | Total if removed without refactor |
| **Verdict** | Acceptable as-is; patch recommended for D-179C+ (event delegation refactor) |
| **D-179B action** | Accept `'unsafe-inline'` in D-179B CSP; document event delegation plan for later |

### F2 — No CSP header set anywhere on Worker-generated responses (Patch recommended for D-179B)

| | |
|---|---|
| **Surface** | All Worker JSON responses (via `CORS` object), `renderPublicProfileShell()` HTML response |
| **Current behavior** | No `Content-Security-Policy` header on any Worker response |
| **Security value** | Even a permissive CSP blocks external script injection, framing, `<object>`/`<embed>`, and `javascript:` URLs |
| **Breakage risk** | None if `'unsafe-inline'` is included in first CSP |
| **Verdict** | Patch recommended |
| **D-179B action** | Add CSP header to `renderPublicProfileShell()` HTML response. JSON API responses do not need CSP (browsers don't interpret CSP on `application/json`). |

### F3 — `style-src 'unsafe-inline'` required for dynamic meter bars (Acceptable with staged plan)

| | |
|---|---|
| **Surface** | `app-v10.js` `meter()` and `deltaMeter()` functions; 25 inline `style` attributes |
| **Current behavior** | Meter fill width is set as `style="width:${v}%"` |
| **Breakage risk** | All score meters break if `style-src` is strict |
| **Verdict** | Acceptable; refactor to CSS custom properties (`style="--fill:${v}%"`) is a D-179C option |
| **D-179B action** | Accept `'unsafe-inline'` in `style-src`; note CSS custom property path for D-179C |

### F4 — Belief engine uses Google Fonts (external origin in `style-src` / `font-src`)

| | |
|---|---|
| **Surface** | `/apps/humanx-belief-engine/index.html` — `@import url('https://fonts.googleapis.com/...')` |
| **Exposure** | Font CSS served from `fonts.googleapis.com`; font files from `fonts.gstatic.com` |
| **Verdict** | Acceptable — well-known CDN; low risk; must be listed in belief engine CSP |
| **D-179B action** | The belief engine lives under a subpath (`/apps/humanx-belief-engine/`). A per-path CSP via a `_headers` file could scope font origins to that subpath only. Alternatively, main CSP can include both origins. |

### F5 — No `eval`, `new Function`, or dynamic script injection (Positive — no action)

| | |
|---|---|
| **Surface** | `app-v10.js`, `humanx-bridge.js`, belief engine JS |
| **Current behavior** | No `eval`, no `new Function`, no `document.write`, no `importScripts` |
| **Verdict** | No `'unsafe-eval'` needed. |

---

## Recommended Staged CSP Plan

### D-179B — Permissive but meaningful CSP (recommended, deployable now)

Add `Content-Security-Policy` header to the `renderPublicProfileShell()` HTML response (and optionally to static asset responses via a `_headers` file):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self';
  img-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none'
```

**What this blocks (new protection):**
- External scripts from any unknown CDN or injected `<script>` tag
- `javascript:` URL navigation
- Framing by third parties (`frame-ancestors 'none'`)
- `<object>` and `<embed>` content (`object-src 'none'`)
- Base tag hijacking (`base-uri 'self'`)
- External connections other than same-origin

**What this still allows (necessary for current app):**
- Inline event handlers (`'unsafe-inline'` in `script-src`)
- Inline styles and style attributes (`'unsafe-inline'` in `style-src`)
- Google Fonts in belief engine
- Same-origin API fetch and asset loads
- `data:` image URLs (common in SVG/canvas patterns)

### D-179C — Remove `'unsafe-inline'` from `style-src`

Replace `style="width:${v}%"` meter pattern with CSS custom properties:
```js
`<div class="fill" style="--fill:${v}%"></div>`
```
With CSS rule:
```css
.fill { width: var(--fill, 0%); }
```
Custom properties set via `style` attribute may still require `'unsafe-inline'` depending on browser interpretation. Investigate with `'nonce-...'` approach.

Also move noscript `<style>` block from `index.html` into `styles.css`.

### D-179D — Remove `'unsafe-inline'` from `script-src` (large refactor)

Replace all `onclick="..."` template literal patterns in `app-v10.js` with event delegation:
```js
// Instead of: <button onclick="setMode('arena')">
// Use: <button data-action="setMode" data-arg="arena">
```
With a single root event listener dispatching on `data-action`. This is a significant app refactor requiring careful testing.

The belief engine inline `<script>` must move to a separate `.js` file.

---

## CSP for JSON API Responses

Browsers do not enforce or apply `Content-Security-Policy` on `application/json` responses. Adding CSP to the `CORS` object (which spreads into all JSON responses) would be harmless but wasteful — it affects only document responses. **No CSP change to the `CORS` object or `json()` helper is recommended.**

---

## No Code Changes

D-179A is audit-only. No files changed. Baseline 1358/24/57 expected unchanged.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.

---

## Recommended Next Step

D-179B — Add a permissive but meaningful CSP header to the `renderPublicProfileShell()` HTML response (and optionally via a `_headers` file for static assets). No frontend refactoring required for D-179B.
