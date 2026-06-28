# D-187 — Direct Claim URL Closeout

**Date:** 2026-06-28
**HEAD at closeout:** `89ba10d`
**Baseline at closeout:** 1537/24/57 (+12 tests from D-187B)
**Patches:** D-187A (audit) · D-187B (implementation) · D-187C (live verification)

---

## Summary

D-187 delivered shareable direct claim URLs (`/c/:id`) with full server-rendered OG meta tags and SPA auto-open into Study mode. Two patches: D-187A was a source-code audit that produced the full implementation plan; D-187B executed that plan.

---

## D-187A — Readiness Audit

**Commit:** `5da0062`
**Scope:** Source-code review only. No code changes.

### What `/c/:id` did before D-187B

Route fell through to `env.ASSETS.fetch(request)` — Cloudflare served the generic `index.html` with no OG injection. SPA booted to Home with no claim pre-selected. Visitors sharing a claim link had no indication they were supposed to see a specific claim.

### Reusable building blocks found

| Component | Location | What it provides |
|-----------|----------|-----------------|
| `GET /api/claims/:id` | `worker.js:72` | Single-claim fetch, already enforces `review_state='public'` |
| `selectClaim(id)` | `app-v10.js:355` | Fetches claim + renders Study mode; independent of `claims[]` list |
| `renderPublicProfileShell()` | `worker.js` | Exact pattern for Worker OG shell injection |
| `parsePublicProfilePath()` | `app-v10.js:102` | Exact pattern for SPA path detection |

No new DB tables, no new API endpoints, and no modification to `selectClaim` were needed.

---

## D-187B — Implementation

**Commit:** `89ba10d`
**Files changed:** `src/worker.js`, `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`

### Worker (`src/worker.js`) — 3 additions

**1. Route intercept** (1 line, before static-asset fallback):
```js
if (url.pathname.match(/^\/c\/[^/]+$/) && request.method === 'GET')
  return await renderClaimShell(request, env, url.pathname.split('/').pop());
```

**2. `loadClaimSummary(env, rawId)`** — lightweight single-row read:
- Queries `id, claim, status, category, evidence_score` from `claims`
- `WHERE id=? AND COALESCE(review_state,'public')='public'`
- `rawId` sliced to 80 chars before DB bind
- Returns `null` for missing, private, or rejected claims — never distinguishes between the two

**3. `renderClaimShell(request, env, rawId)`** — mirrors `renderPublicProfileShell()`:
- Fetches `index.html` from static assets
- If `loadClaimSummary` returns null → injects `noindex` only (generic shell)
- If claim found → injects full OG meta block (see table below) + `noindex` + `canonical`

### OG meta injected for a found public claim

| Tag | Value |
|-----|-------|
| `<title>` | Claim text truncated to 80 chars + " — HumanX" |
| `og:title` | Same as `<title>` |
| `og:description` | `"${status} · ${category} · Evidence: ${score}/10. Pressure-tested on HumanX."` |
| `og:type` | `article` |
| `og:url` | `${origin}/c/${claimId}` |
| `og:image` | `${origin}/og-default.png` |
| `twitter:card` | `summary_large_image` |
| `twitter:image` | Same as `og:image` |
| `link rel="canonical"` | `${origin}/c/${claimId}` |
| `meta name="robots"` | `noindex` (consistent with profile shell — no search indexing in v1) |

### SPA (`public/app-v10.js`) — 2 additions

**4. `parseDirectClaimPath()`** — new function alongside `parsePublicProfilePath()`:
```js
function parseDirectClaimPath(){const m=String(location.pathname||'').match(/^\/c\/([^/?#]+)\/?$/);return m?decodeURIComponent(m[1]):null}
```

**5. `boot()` modification** — detect path, auto-open Study after session+data load:
```js
const initialClaimId = parseDirectClaimPath();
// ... after Promise.all([loadGraphStatus(), loadClaims(false)]) ...
if (initialClaimId) {
  lastModeBeforeStudy = 'arena';
  mode = 'arena';
  await selectClaim(initialClaimId);
} else { render(); }
```

`selectClaim` is called unmodified — only the caller is new.

### Smoke tests (`scripts/hardening-smoke-test.mjs`) — Section 100

12 new D-187B tests covering: route intercept present, `review_state` filter in query, `og:image` + `og-default.png`, `og:type=article`, generic fallback for missing/private, no admin logic leakage, `parseDirectClaimPath` exists + regex pattern, boot calls `selectClaim`, `selectClaim` itself unmodified. Slice windows for `og:image`/`og:type` use 2000 chars (metaBlock starts at ~1074 chars into the function).

---

## D-187C — Live Verification

**Date:** 2026-06-28
**Test claim:** `clm_seed_7fb1c24747c2` — "Sleep deprivation significantly impairs cognitive performance…" — `Strongly Supported` · `Human Behaviour / Biology` · evidence score 77

### Results

| Check | Result |
|-------|--------|
| `GET /c/clm_seed_7fb1c24747c2` HTTP status | **200** |
| Content-Type | `text/html; charset=utf-8` |
| `og:title` present | PASS |
| `og:description` present | PASS |
| `og:image` → `og-default.png` | PASS |
| `twitter:card=summary_large_image` | PASS |
| `noindex` present | PASS |
| `canonical` link present | PASS |
| Claim text in title (`Sleep deprivation`) | PASS |

**Actual rendered values:**

```
og:title:       Sleep deprivation significantly impairs cognitive performance, even when indi... — HumanX
og:description: Strongly Supported · Human Behaviour / Biology · Evidence: 77/10. Pressure-tested on HumanX.
og:image:       https://humanx.rinkimirikata.com/og-default.png
```

### Failure / bogus-ID behavior

| Check | Result |
|-------|--------|
| `GET /c/nonexistent_claim_xyz` HTTP status | **200** (generic shell, not crash) |
| `og:title` present (generic) | PASS |
| `noindex` present | PASS |
| Private claim ID leaked in response | **NOT LEAKED** |

The Worker returns the generic `index.html` shell with only `noindex` added. The SPA boots normally; `selectClaim` fires, gets a 404 from `/api/claims/:id`, shows a toast, and leaves the user on Home. No private existence is exposed.

---

## Privacy / visibility rules

| Claim state | Worker shell | SPA behavior |
|-------------|-------------|--------------|
| `review_state = 'public'` | Full OG meta injected | `selectClaim()` opens Study mode |
| `review_state = 'review'` | Generic shell + noindex | 404 from API → toast + stays on Home |
| `review_state = 'rejected'` | Generic shell + noindex | 404 from API → toast + stays on Home |
| Row not found | Generic shell + noindex | 404 from API → toast + stays on Home |
| DB unavailable (demo mode) | Generic shell + noindex | `selectClaim()` may fail → toast |

The distinction between "not found" and "private" is deliberately not exposed — same policy as the profile shell (D-143B).

---

## Later ideas (not in D-187B scope)

| Idea | Effort | Notes |
|------|--------|-------|
| Share button on claim cards (Arena/Study) | Low | Copy `/c/:id` URL to clipboard with one click |
| Copy direct claim link from Study mode | Low | Lives inside Study header, mirrors the share-link concept |
| Improved not-found inline state | Low | `renderClaimNotFound()` inline panel instead of toast + blank Home |
| Better back-button label after direct URL entry | Low | `lastModeBeforeStudy = 'direct'` → "← Browse Claims" instead of "← Back" |
| Dynamic per-claim OG image | High | Claim text as image overlay, requires server-side image generation or Workers Images |
| Social debugger validation | Low | Paste `https://humanx.rinkimirikata.com/c/:id` into Twitter Card Validator + Facebook Debugger after deploying |
| `#/c/:id` hash fallback for in-app sharing | Medium | Allows deep links without reloading the SPA; useful for internal sharing |

---

## Files changed across D-187

| File | Change |
|------|--------|
| `src/worker.js` | Route intercept + `loadClaimSummary()` + `renderClaimShell()` |
| `public/app-v10.js` | `parseDirectClaimPath()` + `boot()` patch |
| `scripts/hardening-smoke-test.mjs` | Section 100: 12 new D-187B tests, slice window widening |
| `docs/D187A_DIRECT_CLAIM_URL_READINESS_AUDIT.md` | Audit + implementation plan (D-187A) |
| `docs/D187_DIRECT_CLAIM_URL_CLOSEOUT.md` | This file (D-187C) |
