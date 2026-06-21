# D-144C — noindex / robots Checkpoint

**Date:** 2026-06-21
**Chain:** D-144A (audit) → D-144B (implementation) → D-144C (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-144 Chain

### D-144A — Public profile discoverability / robots / sitemap audit
Read-only audit of whether public profiles should be search-indexable now that real `/u/:slug` paths and OG tags work (D-143). Confirmed the gap directly: no `robots.txt`, no canonical link, and no `noindex` meta existed anywhere, meaning `/u/:slug` was already fully crawlable/indexable by default the moment any crawler discovered a link — despite every public-profile checkpoint's UI copy consistently framing `profile_public` as a *share-link* decision, never a *search-indexing* one. Recommended **Option A — share-only, not search-indexed, for v1**: a minimal `robots.txt` disallowing `/u/`, an unconditional `noindex` meta tag on every `/u/:slug` shell response, and a canonical link only for resolved public profiles — with `sitemap.xml` and any opt-in "make my profile indexable" flag explicitly deferred to a future, separately-scoped product decision. No code changed.

### D-144B — Share-only indexing policy implementation
Implemented exactly as audited. Added `public/robots.txt` (two lines: `User-agent: *` / `Disallow: /u/` — no sitemap reference, no whole-site disallow). Extended `renderPublicProfileShell()` (the same D-143B/hotfix function): `<meta name="robots" content="noindex">` is now injected **unconditionally** — into the no-DB demo-fallback branch, private profiles, not-found slugs, and invalid slugs, not just resolved public profiles — via a single shared `noindexTag` constant reused in both branches. `<link rel="canonical" href="{origin}/u/{slug}">` is injected **only** when `loadPublicProfileSummary()` resolves a public profile, built from the real `/u/:slug` path (never the `#/u/` hash route) and escaped through the existing `escHtml()` helper. All five D-143B OG/Twitter tags, the D-143B hotfix's `/` fetch target, `GET /api/u/:slug`'s JSON response shape, and the frontend (hash route, path route, Copy-share-link) are all unchanged — this was a backend-only, additive patch.

---

## Production Confirmed (owner-smoked, live)

- `/u/calenhir` (direct real path) still works.
- `https://humanx.rinkimirikata.com/u/calenhir` returns **200**.
- `noindex` meta is present.
- Canonical link is present for the resolved public profile.
- `og:title`/`og:description`/`og:url`/`og:type`/`twitter:card` all remain present.
- `https://humanx.rinkimirikata.com/robots.txt` returns `User-agent: *` / `Disallow: /u/`.
- No `sitemap.xml` exists.
- No frontend behavior change.
- Public profiles remain shareable by direct link.

---

## Implementation

| Change | Detail |
|---|---|
| `public/robots.txt` | New static file. Exactly `User-agent: *` / `Disallow: /u/` — no `Sitemap:` line, no blanket `Disallow: /` |
| `renderPublicProfileShell()` — `noindex` | Injected unconditionally into **every** `/u/:slug` shell response via a single shared `noindexTag` constant, reused in both the generic/private/not-found branch and the resolved-profile branch |
| `renderPublicProfileShell()` — `canonical` | Injected **only** when `loadPublicProfileSummary()` resolves a public profile — never for the generic/private/not-found shell |
| Canonical URL | Always `/u/:slug` (the real path), never `#/u/:slug` |
| `GET /api/u/:slug` | JSON response unchanged — no robots/canonical fields leak into the API |
| `wrangler.toml` | Unchanged — no `not_found_handling` setting added |
| Migration | None |
| New mutating endpoint | None |
| Sitemap route or file | None |

---

## Safety Model

- `profile_public` continues to mean "reachable by direct link" — it explicitly does **not** mean "search-indexed." This closes the expectation gap identified in D-144A.
- Private, not-found, and invalid slugs continue to get the same generic shell behavior established in D-143B/hotfix — now additionally carrying `noindex`, but still always 200, still no profile-specific meta, still no distinguishing signal between "doesn't exist" and "exists but isn't public."
- Every `/u/:slug` shell response includes `noindex`, with no exceptions.
- No user-agent sniffing, no cloaking — identical response shape served to bots and humans, same as D-143B.
- No email, user id, admin fields, raw belief data, or shared-snapshot data in any metadata — unchanged from D-143B/D-142B's safety guarantees.

---

## Fields Included

| Field | When |
|---|---|
| `noindex` | Every `/u/:slug` shell response, unconditionally |
| `canonical` | Only for a resolved public profile |
| `displayName` (title/`og:title`) | D-143 carried forward, unchanged |
| `bio` or generic fallback (`og:description`) | D-143 carried forward, unchanged |
| `og:type=profile` | D-143 carried forward, unchanged |
| `og:url=/u/:slug` | D-143 carried forward, unchanged |
| `twitter:card=summary` | D-143 carried forward, unchanged |

## Fields Intentionally Excluded

`email`, `user_id`/internal id, admin fields, `raw_json`, `stress_points_json`, `dimensions_json`, `contradictions_json`, `sharedSnapshot`, `dominantPattern`, any sitemap content, and public content rows (claims/truths/evidence/pressure) — none of these have ever appeared in the shell route's metadata (D-143B/D-142B), and D-144B doesn't change that.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 925 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Public profiles are not search-indexed by design** | This is the v1 product policy decision from D-144A, not a bug — profiles remain shareable-by-link only. |
| **No `profile_indexable` opt-in flag yet** | If a user ever wants their profile to be genuinely discoverable via search, no mechanism exists for that — it's a distinct, separately-scoped future feature decision (Option B from D-144A). |
| **No `sitemap.xml`** | Deliberately deferred — building one for `noindex`'d pages would be contradictory. |
| **No `lastmod`/`profile_updated_at` tracking** | The `users` table has no timestamp for profile edits (only `created_at`); a future sitemap would need this added. |
| **No canonical on the generic private/not-found shell** | Only resolved public profiles get a canonical link — there's nothing meaningful to canonicalize a private/nonexistent slug to. |
| **No OG image yet** | Still text-only (title/description/url), per D-143A's deferral. |
| **Cloudflare bot protection may still block some preview/crawler fetchers** | Carried forward from D-143C — observed during this chain's own tooling, not an app-level bug, but worth keeping in mind when verifying indexing/crawling behavior externally. |

---

## Recommended Next Implementation

**D-145A — Public profile trust / owner identity / signed owner header audit**

Public profile, sharing, OG, and noindex policy are now stable end-to-end. The biggest remaining structural weakness, repeatedly noted as a carried-forward limitation in every checkpoint since D-136, is that `x-humanx-user` is still unsigned and spoofable for all owner-side actions — including saving Profile Settings, archiving content, and selecting a shared belief snapshot. A read-only audit should assess the safest path toward signed owner identity (cookies, signed tokens, or another mechanism) before any further owner-facing controls are added on top of an identity model that has no cryptographic guarantee.
