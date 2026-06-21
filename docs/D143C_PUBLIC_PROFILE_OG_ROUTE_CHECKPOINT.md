# D-143C — Public Profile OG Route Checkpoint

**Date:** 2026-06-21
**Chain:** D-143A (audit) → D-143B (OG route implementation) → D-143B hotfix (white-screen fix) → D-143C (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-143 Chain

### D-143A — Public profile share-card / OpenGraph / SEO audit
Read-only audit of why shared `#/u/:slug` links looked broken/generic outside the app. Confirmed the root architectural problem: link-preview crawlers (Discord, Facebook, Twitter/X, WhatsApp, Slack, iMessage, Telegram) never execute JavaScript and the URL fragment (`#...`) is never sent to the server at all — so a hash route can never carry profile-specific meta tags to a crawler, no matter how the in-app page is polished. Recommended a real `GET /u/:slug` path, intercepted by the Worker (not a global `wrangler.toml` SPA-fallback change, which would have a larger blast radius than needed), serving the same `index.html` to every requester — bot or human — with server-injected OG/Twitter-card meta tags only when the slug resolves to a public profile. Recommended excluding counts and any belief/snapshot data from the preview card as a v1 risk-reduction call (a chat-preview audience is far less controlled than someone who deliberately visits the profile page). No code changed.

### D-143B — Server-rendered OG meta tags for /u/:slug
Implemented exactly as audited: a `GET /u/:slug` route in `src/worker.js`, matched **before** the static-asset fallback line, that fetches the app shell via `env.ASSETS`, injects `<title>`/`og:title`/`og:description`/`og:type`/`og:url`/`twitter:card` for opted-in public profiles, and returns the **unmodified** shell (same response, same status, no distinguishing signal) for any missing, invalid, or private slug. Factored `loadPublicProfileSummary(env, slug)` out of `getPublicProfile()` so the JSON API and the new HTML route share one lookup/privacy filter (`WHERE profile_slug=? AND profile_public=1`) instead of duplicating it — `getPublicProfile()`'s own response shape is unchanged, only internally refactored. Frontend gained `parsePublicProfilePath()`/`resolvePublicProfileSlug()` so a direct `/u/:slug` visit renders the same public profile view as the existing `#/u/:slug` hash (hash still takes priority if both are present); the Copy-share-link button switched to copying the real `/u/:slug` path now that it carries OG tags. `docs/API_ENDPOINT_INVENTORY.md` updated with a short non-`/api/` route note, since the route falls outside that doc's stated `/api/...`-only scope.

### D-143B hotfix — direct /u/:slug white screen
Owner smoke found `https://humanx.rinkimirikata.com/u/calenhir` rendered a white screen while `#/u/calenhir` worked fine. The task's hypothesized cause (relative asset paths in `index.html`) was checked and **disproved** — `public/index.html`'s `<link>`/`<script>` tags already used root-relative hrefs (`/styles.css`, `/app-v10.js`), confirmed by inspection and pinned with a regression test so this misdiagnosis can't silently recur. The real root cause: `renderPublicProfileShell()` requested `/index.html` from `env.ASSETS`, but Cloudflare's default static-asset `html_handling` (`"auto-trailing-slash"`) 308-redirects a direct `/index.html` request to `/`; `env.ASSETS.fetch()` doesn't follow that redirect, so the handler received an empty-bodied redirect response and served it verbatim as a 200 with no HTML at all. Fixed by requesting `/` instead, which resolves straight to the real shell content with no redirect involved.

---

## Production Confirmed (owner-smoked, live)

- `/u/calenhir` (direct real path) works — no white screen.
- `https://humanx.rinkimirikata.com/u/calenhir` returns **200**.
- View-source contains: `<title>Calenhir on HumanX</title>`, `og:title`, `og:description`, `og:type`, `og:url`, `twitter:card`.
- None of the following appear in the source: `email`, `user_id`, `raw_json`, `stress_points_json`, `dimensions_json`, `contradictions_json`, `sharedSnapshot`, `dominantPattern`.
- `https://humanx.rinkimirikata.com/#/u/calenhir` (old hash route) still works.
- Copy Share Link now copies `/u/:slug`, not `#/u/:slug`.
- No global SPA fallback added.
- No `wrangler.toml` `not_found_handling` change.
- No OG image endpoint.
- No mutating endpoint.

---

## D-143B Implementation

| Addition | Detail |
|---|---|
| `GET /u/:slug` route | Matched in `src/worker.js`'s dispatch **before** `if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);`, so it intercepts rather than falling through to the static handler |
| `loadPublicProfileSummary(env, slug)` | Shared lookup/privacy filter — `WHERE profile_slug=? AND profile_public=1`, returns `{userId, slug, bio, displayName, counts}` or `null` |
| `escHtml(s)` | HTML-escapes title/description/url before interpolation — same escaping behavior as the frontend's `esc()` |
| `renderPublicProfileShell(request, env, slug)` | Fetches the shell via `env.ASSETS`, injects meta tags only for a resolved public profile, otherwise returns the shell untouched |
| `getPublicProfile()` refactored | Now calls `loadPublicProfileSummary()` instead of duplicating the user lookup/count queries — **response shape unchanged** for `GET /api/u/:slug` |
| Frontend path fallback | `parsePublicProfilePath()` / `resolvePublicProfileSlug()` — a direct `/u/:slug` visit renders the same client-side public profile view as the hash route |
| Hash route preserved | `#/u/:slug` still works unchanged, still takes priority if both hash and path are present |
| Copy share link | Switched from `${origin}/#/u/${slug}` to `${origin}/u/${slug}` |
| `docs/API_ENDPOINT_INVENTORY.md` | Updated with a short note documenting `GET /u/:slug` outside the doc's `/api/...`-only table scope |

---

## D-143B Hotfix

| Aspect | Detail |
|---|---|
| Hypothesized cause (disproved) | Relative asset paths in `public/index.html` — checked directly, found to already be root-relative (`/styles.css`, `/app-v10.js`); now pinned by a smoke test asserting this |
| Actual root cause | `renderPublicProfileShell()` requested `/index.html` from `env.ASSETS`; Cloudflare's default `html_handling: "auto-trailing-slash"` 308-redirects that to `/`; `env.ASSETS.fetch()` doesn't follow redirects, so the handler served an empty-bodied redirect response as a 200 |
| Fix | Request `/` instead of `/index.html` — resolves directly to the real shell, no redirect |
| Regression coverage | New smoke tests pin both the root-relative asset paths in `index.html` and the corrected fetch target in `renderPublicProfileShell()`, so neither the original misdiagnosis nor the real bug can silently regress |

---

## Safe OG Fields

| Field | Source |
|---|---|
| `<title>` / `og:title` | `{displayName} on HumanX` |
| `og:description` | `profile_bio` (truncated to ~160 chars) or `"A HumanX public profile."` fallback |
| `og:type` | Static `"profile"` |
| `og:url` | `{origin}/u/{slug}` |
| `twitter:card` | Static `"summary"` |

## Fields Intentionally Excluded from OG/Meta

`email`, `user_id`/internal `id`, admin fields, selected snapshot fields, `dominantPattern`, `raw_json`, `stress_points_json`, `dimensions_json`, `contradictions_json`, `sharedSnapshot`, and public content rows (claims/truths/evidence/pressure) are never included in the OG/meta injection — the shell route only ever reads `displayName`/`bio`/`slug` from the shared summary helper.

---

## Safety Model

- Private, not-found, and invalid slugs all return the **unmodified** generic shell — same status, same body shape, no distinguishing signal between "doesn't exist" and "exists but isn't public."
- Identical response served to bots and humans — no user-agent sniffing, no cloaking.
- No new writes anywhere in this chain — `renderPublicProfileShell()` and `loadPublicProfileSummary()` are both read-only.
- No migration — reuses the same `users`/`belief_snapshots` columns already in place since migration 0013.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 907 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **No OG image yet** | Text-only card (title/description/url) — most chat-app unfurls (Discord/Slack/iMessage) render fine without one; deferred as a separate, heavier feature per the D-143A audit |
| **No per-profile share image** | Follows from the above — no canvas/SVG-to-PNG generation infrastructure exists yet |
| **No SEO sitemap** | No `sitemap.xml` or equivalent exists for public profiles |
| **No canonical link tag yet** | The shell doesn't inject `<link rel="canonical">` |
| **No robots policy pass yet** | No `robots.txt` review has been done specifically for public profile discoverability |
| **OG description uses bio only** | Counts and any shared-snapshot data are deliberately excluded from the preview card, per the D-143A risk call |
| **Cloudflare bot protection may block some external fetchers** | Observed during this checkpoint's owner-smoke tooling (a generic web-fetch tool got a 403) — this is Cloudflare's own protection layer, not an app bug, but worth noting since it affects what kinds of automated verification are possible against the live site |

---

## Recommended Next Implementation

**D-144A — Public profile discoverability / robots / sitemap audit**

Real profile paths and OG tags now work end-to-end. The next useful layer is a product decision, not a technical one: should public profiles be indexed by search engines and discoverable at all, or should they remain "shareable but not searchable" (reachable only via a direct link, like today)? A read-only audit should weigh the privacy implications of search-engine indexing against the discoverability upside, and if indexing is desired, define what `robots.txt` policy, sitemap structure, and canonical-link tags would be needed — all without exposing any data beyond what the OG route and the public profile page already safely show.
