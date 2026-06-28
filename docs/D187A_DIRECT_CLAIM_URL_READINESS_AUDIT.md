# D-187A — Direct Claim URL Readiness Audit

**Date:** 2026-06-28  
**Method:** Source-code review — `src/worker.js`, `public/app-v10.js`  
**Starting state:** HEAD `cf9905c` · Baseline 1525/24/57  
**Scope:** Planning `/c/:id` deep-link support. No code changes in this patch.

---

## Current behavior — what happens at `/c/:id` today

`/c/:id` is not intercepted by the Worker. The route falls through to `env.ASSETS.fetch(request)` at line 40 of `worker.js`:

```js
if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
```

Cloudflare serves the static `index.html` with no OG meta injection (the `/u/:slug` intercept at line 39 does not match `/c/`). The SPA boots with `mode='home'`. No claim is pre-selected. The visitor sees the Home screen with no indication that they were supposed to be looking at a specific claim.

---

## What already exists that D-187B can reuse

### 1. Single-claim GET API — `GET /api/claims/:id`

Already implemented at `worker.js` line 72:

```js
if (url.pathname.match(/^\/api\/claims\/[^/]+$/) && request.method === 'GET')
  return await getClaim(request, env, url.pathname.split('/').pop());
```

`getClaim()` at line 748:
- Fetches the full claim row plus evidence, pressure, tests, analyses, lineage
- **Already enforces `review_state='public'`** — returns `404 CLAIM_NOT_FOUND` for missing, non-public, rejected, or private claims
- Returns: `{ claim, evidence, pressure, tests, analyses, lineage }`

No new API endpoint is needed for D-187B.

### 2. `selectClaim(id)` in the SPA

Already implemented at `app-v10.js` line 355:

```js
async function selectClaim(id) {
  const data = await api('/api/claims/' + id);
  selected = data.claim;
  selected.evidence = data.evidence || [];
  // ...
  renderStudy();
}
```

This already fetches from `/api/claims/:id` independently of the `claims[]` list. It does not depend on `loadClaims()` having run. Falls back to cached `claims[]` array on error.

### 3. Worker OG shell pattern — `renderPublicProfileShell()`

The `/u/:slug` flow (D-143B) is the exact template for `/c/:id`:

```
URL match → load lightweight DB summary → inject OG meta → serve index.html
```

The same `loadPublicProfileSummary()` / `renderPublicProfileShell()` structure can be copied with claim-specific queries and meta.

### 4. SPA path-parsing pattern

`parsePublicProfilePath()` at line 102:

```js
function parsePublicProfilePath() {
  const m = String(location.pathname || '').match(/^\/u\/([^/?#]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}
```

An identical `parseDirectClaimPath()` can match `/c/:id`.

### 5. Boot detection pattern

`boot()` at line 106 already handles the profile case:

```js
const initialSlug = resolvePublicProfileSlug();
if (initialSlug) { publicProfileSlug = initialSlug; mode = 'publicProfile'; }
// ... after session + claims load ...
render();
```

The claim case requires a slight variation: rather than setting a mode before data loads, call `selectClaim(id)` after the `Promise.all([loadGraphStatus(), loadClaims(false)])` resolves.

---

## Required changes — full breakdown

### Worker (`src/worker.js`)

**1. Route intercept** — insert before the static-asset fallback (line 40), mirroring the `/u/:slug` pattern:

```js
if (url.pathname.match(/^\/c\/[^/]+$/) && request.method === 'GET')
  return await renderClaimShell(request, env, url.pathname.split('/').pop());
```

**2. `loadClaimSummary(env, claimId)`** — lightweight read, parallel to `loadPublicProfileSummary()`:

```js
async function loadClaimSummary(env, claimId) {
  if (!env.DB) return null;
  const row = await env.DB.prepare(
    `SELECT id, claim, status, category, evidence_score
     FROM claims
     WHERE id = ? AND COALESCE(review_state,'public') = 'public'`
  ).bind(claimId).first();
  return row || null;
}
```

This deliberately omits evidence/pressure/lineage — OG meta needs only the claim text and basic scores. No schema changes required.

**3. `renderClaimShell(request, env, rawId)`** — parallel to `renderPublicProfileShell()`:

```js
async function renderClaimShell(request, env, rawId) {
  const url = new URL(request.url);
  const indexRequest = new Request(new URL('/', url.origin), request);
  const indexResponse = await env.ASSETS.fetch(indexRequest);
  const html = await indexResponse.text();
  const noindexTag = '<meta name="robots" content="noindex">';
  const summary = env.DB ? await loadClaimSummary(env, rawId) : null;

  let injected;
  if (!summary) {
    // Missing, private, or rejected claim — generic shell, noindex
    injected = html.replace(
      '<title>HumanX — Belief → Truth → Claim → Evidence</title>',
      `<title>HumanX — Belief → Truth → Claim → Evidence</title>\n${noindexTag}`
    );
  } else {
    const claimText = String(summary.claim || '');
    const title = escHtml(
      claimText.length > 80 ? claimText.slice(0, 77) + '...' : claimText
    ) + ' — HumanX';
    const description = escHtml(
      `${summary.status || 'Claim'} · ${summary.category || 'General'} · Evidence score: ${summary.evidence_score ?? '?'}/10. Pressure-tested on HumanX.`
    );
    const claimUrl = escHtml(`${url.origin}/c/${encodeURIComponent(rawId)}`);
    const ogImage = escHtml(`${url.origin}/og-default.png`);
    const metaBlock = [
      `<title>${title}</title>`,
      noindexTag,
      `<link rel="canonical" href="${claimUrl}">`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:url" content="${claimUrl}">`,
      `<meta property="og:image" content="${ogImage}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:image" content="${ogImage}">`,
    ].join('\n');
    injected = html.replace(
      '<title>HumanX — Belief → Truth → Claim → Evidence</title>',
      metaBlock
    );
  }

  return new Response(injected, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', /* same headers as profile shell */ }
  });
}
```

### SPA (`public/app-v10.js`)

**4. `parseDirectClaimPath()`** — new function alongside `parsePublicProfilePath()`:

```js
function parseDirectClaimPath() {
  const m = String(location.pathname || '').match(/^\/c\/([^/?#]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}
```

**5. `boot()` modification** — detect the path and call `selectClaim()` after data loads:

```js
async function boot() {
  user = localUser();
  document.getElementById('who').textContent = user.handle;
  const initialSlug = resolvePublicProfileSlug();
  const initialClaimId = parseDirectClaimPath();          // NEW
  if (initialSlug) { publicProfileSlug = initialSlug; mode = 'publicProfile'; }
  try {
    const h = await api('/api/health');
    live = h.mode === 'd1-live';
    setStatus(live ? 'D1 live' : 'Demo fallback', live);
    await ensureSession();
    document.getElementById('who').textContent = user.handle;
    loadMe().catch(() => {});
    await Promise.all([loadGraphStatus(), loadClaims(false)]);
    if (initialClaimId) {                                  // NEW
      lastModeBeforeStudy = 'arena';
      mode = 'arena';
      await selectClaim(initialClaimId);
    } else {
      render();
    }
  } catch (e) {
    setStatus('Backend unreachable', false, true);
    renderError(e);
  }
}
```

This preserves the existing boot sequence exactly. `selectClaim` only fires after session, graph status, and the claims list have all resolved.

---

## Public/privacy rules

The existing `getClaim()` function already enforces the correct visibility rules — the same rules apply to the Worker shell:

| Claim state | Worker shell | SPA behavior |
|-------------|-------------|--------------|
| `review_state = 'public'` | OG meta injected | `selectClaim()` opens Study mode |
| `review_state = 'review'` | Generic shell (noindex) | 404 from API → toast + fallback |
| `review_state = 'rejected'` | Generic shell (noindex) | 404 from API → toast + fallback |
| Row not found | Generic shell (noindex) | 404 from API → toast + fallback |
| DB unavailable (demo) | Generic shell (noindex) | `selectClaim()` may fail → toast |

The query `WHERE COALESCE(review_state,'public') = 'public'` treats null review_state as public, matching the existing public-claims convention.

---

## Failure / 404 behavior

**Worker side:** `loadClaimSummary()` returns `null` for any non-public or missing claim. The shell falls back to the generic `index.html` with a `noindex` tag — same as the profile 404 path. No 404 HTTP status is returned; the SPA boots normally.

**SPA side:** `selectClaim()` on a missing/private claim gets a 404 from `/api/claims/:id`. Existing error handling in `selectClaim()`:
- Tries to fall back to the `claims[]` array (won't help for a non-public claim)
- Calls `toast(e.message || 'Could not load claim')`
- `renderStudy()` is NOT called (since `selected` wasn't set successfully)

Result: the SPA stays on the Home screen with a toast error. This is functional but not ideal — there's no "this claim is not public" explanation rendered inline. D-187B+ could add a `renderClaimNotFound()` inline state.

---

## OG metadata plan

| Field | Content |
|-------|---------|
| `og:title` | First 80 chars of claim text + " — HumanX" |
| `og:description` | `"${status} · ${category} · Evidence score: ${score}/10. Pressure-tested on HumanX."` |
| `og:type` | `article` (not `profile` — claims are content, not identity) |
| `og:url` | `${origin}/c/${claimId}` |
| `og:image` | `${origin}/og-default.png` (same static image as profile) |
| `twitter:card` | `summary_large_image` |
| `twitter:image` | same as `og:image` |
| `<link rel="canonical">` | `${origin}/c/${claimId}` |
| `<meta name="robots">` | `noindex` (consistent with profile policy — no search indexing in v1) |

The claim text truncation at 80 chars is conservative — most social platforms display OG title up to ~60–70 chars. A longer title risks being cut mid-word.

---

## What minimal implementation avoids

- **No new DB table or migration.** `loadClaimSummary` queries the existing `claims` table with columns already present.
- **No new API endpoint.** `GET /api/claims/:id` already exists and already enforces public visibility.
- **No changes to `selectClaim()`, `renderStudy()`, or any downstream Study mode logic.** The hard rule not to touch `selectClaim` is preserved — the only change is the boot detection that *calls* it.
- **No SPA mode changes.** The direct-claim path enters Study mode via the existing `mode='arena'` + `selectClaim()` path, exactly like any other Study entry point.
- **No new state variables beyond `initialClaimId` (local to boot)**. All Study state (`selected`, `lastModeBeforeStudy`) is set through existing paths.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Claim text contains characters that break OG title escaping | Low | `escHtml()` already handles &, <, >, ", ' — same function used for profile OG |
| `loadClaimSummary` adds DB latency to every `/c/:id` request | Low | Single-row SELECT by primary key — same cost as `loadPublicProfileSummary` |
| Very long claim IDs or path-traversal in rawId | Low | `cleanId()` exists in worker; `rawId` should be sanitised before DB bind |
| `selectClaim` fires before the SPA chrome is ready | None | `boot()` awaits session + health + claims first; the DOM is ready by then |
| Smoke test window breakage | Likely if new text is added before existing landmarks | Widen affected slice tests as per D-184D / D-186B precedent |
| `review_state = null` treated as public in shell but claim is actually in review | None | D-143B-established convention: `COALESCE(review_state,'public')='public'` matches only truly public claims (null = legacy public) |
| Back button after direct-URL entry shows "← Back to Claims" but the visitor never went to Claims | Medium | Set `lastModeBeforeStudy = 'direct'` and add a case in `renderStudy()` for a "← Browse Claims" label — optional polish for D-187C |

---

## Phased implementation plan

### D-187B — Core implementation

1. Add `GET /c/:id` route intercept in `worker.js` (1 line)
2. Implement `loadClaimSummary(env, claimId)` in `worker.js` (~8 lines)
3. Implement `renderClaimShell(request, env, rawId)` in `worker.js` (~25 lines, copy of profile shell)
4. Add `parseDirectClaimPath()` in `app-v10.js` (~3 lines)
5. Modify `boot()` in `app-v10.js` to detect and handle the claim path (~8 lines)
6. Add smoke tests covering: route intercept exists, OG title is claim-text-based, `parseDirectClaimPath` function exists, boot calls `selectClaim` when path matches
7. Commit, smoke test, push

**Estimated change size:** ~50 lines across 2 files. No migrations. No new DB tables. Baseline should hold.

### D-187C — Polish (optional follow-up)

- Improve "not found" inline state in SPA (render a `renderClaimNotFound()` panel instead of leaving the user on Home with a toast)
- Handle `lastModeBeforeStudy = 'direct'` for a better back button label
- Consider a `#/c/:id` hash fallback for in-app claim sharing (so internal links can also be deep-linkable)
- Per-claim dynamic OG image (claim text as image overlay) — high effort, deferred

---

## Answers to the audit questions

| Question | Answer |
|----------|--------|
| Does `/c/:id` currently route anywhere? | No. Falls through to static asset (index.html), boots to Home, no claim selected. |
| Can Worker safely render a claim-specific OG shell? | Yes. Same pattern as `/u/:slug`. Single lightweight query, no new schema. |
| Is there an existing single-claim API? | Yes — `GET /api/claims/:id` at `worker.js:72`, already enforces `review_state='public'`. |
| How should SPA boot detect `/c/:id` and auto-open Study mode? | `parseDirectClaimPath()` in `boot()`, call `selectClaim(id)` after session + claims load. |
| What should happen if claim is missing/private/rejected? | Worker: generic shell + noindex. SPA: toast via existing `selectClaim` error path. |
| What title/description/image should claim OG use? | Title: claim text (80-char truncated) + " — HumanX". Description: status + category + evidence score. Image: og-default.png (static). |
| Minimal implementation — avoid schema changes? | Yes. Query uses existing `claims` columns. No migration needed. |
