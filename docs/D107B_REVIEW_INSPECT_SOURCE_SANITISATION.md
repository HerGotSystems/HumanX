# D-107B — Review Inspect Evidence Source Sanitisation

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`. Plus static coverage + docs. No Worker, no D1, no Wrangler.
**Static baseline:** 362 / 24 / 56 → **372 / 24 / 56**
**Audit basis:** D-107A moderation queue smoke review audit (HIGH finding D.1)

---

## Vulnerability Fixed

D-107A found that `renderReviewInspectPanel` rendered the evidence **Source** field with its own inline anchor:

```js
if (item.source_url) fields.push(['Source',
  `<a class="source" href="${esc(item.source_url)}" target="_blank" rel="noopener noreferrer">${esc(item.source_url)}</a>`]);
```

This put `esc(item.source_url)` **straight into `href`** — the exact pattern D-104B fixed in `sourceLink`. `esc()` blocks attribute breakout but **not** scheme injection, so a `javascript:` / `data:` / `vbscript:` source URL rendered as a **clickable link in the Review inspect panel** — the surface a moderator clicks **while holding the admin token** (the admin-targeting XSS scenario raised in D-104A).

This was a **missed render path** from the D-104 source-safety arc: D-104B fixed the public Study display (`sourceLink`) and D-104F fixed *future storage* (`/api/evidence` coerce-to-null), but the Review inspect panel had its **own** unsanitised anchor and never went through `sourceLink`. Legacy unsafe `source_url` rows (intentionally not cleaned by D-104) would render clickable here.

---

## What Changed

### 1. Source field → shared `sourceLink` (centralised, safe)

```js
// before: inline unsafe anchor, only when source_url present
// after:  always push, delegated to the sanitised shared helper
fields.push(['Source', sourceLink(item.source_url)]);
```

- Safe `http:`/`https:` → clickable escaped anchor (`target="_blank" rel="noopener noreferrer"`).
- Unsafe/non-web/malformed → escaped **non-clickable** text with the D-104B note "not clickable — not a valid web address".
- Empty/missing → **"no source provided"** (now shown in Review too, consistent with the public path).
- `item.source_url` never reaches an `href` unless `safeHttpUrl` approved its scheme.

### 2. Quality field → `evidenceQualityLabel` + tier class (consistency)

```js
// before: ['Quality', esc(item.quality)]            // raw: "vibes"
// after:  ['Quality', `<span class="pill ${evidenceQualityClass(item.quality)}">${esc(evidenceQualityLabel(item.quality))}</span>`]
```

`vibes` now displays as **"weak argument"** with the strong/mid/weak/neutral tier colour, matching the public evidence display (D-103B).

### 3. Source rendering is now centralised

Both the public Study path and the Review inspect path render evidence source URLs through the single `sourceLink` → `safeHttpUrl` helper. There is no longer a second, divergent source-render path to drift out of safety.

---

## Preserved (unchanged)

| Item | Status |
|---|---|
| Review inspect panel structure | ✅ |
| Approve / Reject / Keep behavior | ✅ |
| D-96B two-step card-row Approve | ✅ |
| D-95B inspect `scrollIntoView` | ✅ |
| truth-derived / category-echo / ? borderline-origin badges | ✅ |
| Reused evidence grouping | ✅ |
| Admin token handling | ✅ |
| Backend / Worker routes | ✅ untouched |

---

## Hardening Tests Added (Section 49 — 10 new tests, 362 → 372)

| # | Test |
|---|---|
| 49.1 | Review inspect Source field uses shared `sourceLink` |
| 49.2 | Review inspect panel no longer has inline unsafe source `href` |
| 49.3 | `sourceLink` remains protected by `safeHttpUrl` |
| 49.4 | Unsafe source cannot reach an `href` (sourceLink emits exactly one href, the escaped safe URL) |
| 49.5 | Missing source in Review inspect renders "no source provided" |
| 49.6 | Review inspect Quality uses `evidenceQualityLabel` (no raw quality) |
| 49.7 | `vibes` still maps to "weak argument" |
| 49.8 | No "verified source" / "trusted source" wording added |
| 49.9 | Card Approve two-step + inspect approve behavior preserved |
| 49.10 | No backend/D1/wrangler/deploy references added in review inspect path |

Both README hardening-count assertions extended to accept 372.

---

## Safety Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — frontend render only |
| No D1 cleanup/migration | ✅ |
| No source verification claim added | ✅ — neutral wording only |
| No evidence hidden/deleted | ✅ — unsafe source shown as escaped text |
| No moderation/admin actions | ✅ |
| No deploy/D1/live mutation | ✅ |
| Token rotation NOT performed | ✅ |

---

## Follow-up (unchanged from D-107A)

**BE-1 (optional, read-only):** a D1 audit for legacy non-http(s) `source_url` rows would quantify exposure. With D-107B, *both* render paths (public + Review) are now safe, so this is purely informational — remediation, if ever wanted, exact-ID via the review path, never bulk/migration.

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 362 passed, 0 failed | **372 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 56 passed | **56 passed** |
