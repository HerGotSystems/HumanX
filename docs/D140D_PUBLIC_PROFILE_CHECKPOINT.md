# D-140D — Public Profile Checkpoint

**Date:** 2026-06-21
**Chain:** D-140A (audit) → D-140B (profile settings foundation) → D-140C (public read route + hash view) → D-140D (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-140 Chain

### D-140A — Public profile / sharing / social layer audit
Read-only audit of whether and how users should be able to selectively publish a profile, belief mirror, or claim collection without leaking private data. Reviewed the existing public/private visibility model (`COALESCE(review_state,'public')='public'` uniformly across claims/truths/evidence/evidence-vault), confirmed only `handle` ever leaks into any existing public response, and found two blocking gaps: `users.handle` has no uniqueness constraint (unsafe to key a public URL on) and no per-user public/private toggle exists anywhere. Recommended **Option A — profile settings foundation only** first: an explicit opt-in toggle plus a separate, uniquely-indexed `profile_slug`, with no public read route and nothing exposed in the same patch. No code changed.

### D-140B — Profile settings foundation
Added `migrations/0013_public_profile_foundation.sql` (gated, additive only). Added `POST /api/my-humanx/profile-settings` in `src/worker.js` (`saveProfileSettings()`): requires `x-humanx-user` via `requireUserId()`, never accepts a target-user id, updates only the caller's own row. `profile_slug` is required and validated only when `profile_public=1` (lowercase, `a-z0-9-`, 3-40 chars, no leading/trailing/double hyphen, reserved-word list); when `profile_public=0` the slug is always stored `NULL` regardless of input, so a slug never stays reserved against a profile that isn't actually public. Uniqueness enforced via `idx_users_profile_slug`, caught and returned as `409 SLUG_TAKEN`. `profile_bio` trimmed and capped at 240 chars via the existing `cleanText()` helper. Widened `myHumanX()`'s `users` select so the owner sees their own saved profile fields. Added a Profile Settings panel inside Me (`public/app-v10.js`): off-by-default disclaimer, toggle/slug/bio inputs, a live client-side preview (slug/bio/public counts only — no email, no user id), Save button, and a Copy-share-link button gated on the saved public+slug state. **No public read route, no public page — nothing was exposed to anyone but the owner in this patch.**

### D-140C — Public profile read route + hash view
Added `GET /api/u/:slug` (`getPublicProfile()`): public, no-auth, no `x-humanx-user` check anywhere. Looks up `WHERE profile_slug=? AND profile_public=1`; a missing slug, an invalid slug, and a slug that exists but isn't public all return the **identical** `404 PROFILE_NOT_FOUND` — the route never distinguishes "private" from "not found." Every content query filters on both `COALESCE(review_state,'public')='public'` and `COALESCE(archived_by_user,0)=0`, so a user's own archive action also removes that item from their public profile. Lists capped at 10 rows per type; evidence and pressure rows are summary-level only (no `body`/`source_url`). Response is limited to `slug`, `bio`, `displayName`, public counts, and the four recent lists — never `email`, the internal user `id`, `verified`, `trust_score`, `strike_count`, `is_shadow_banned`, `is_admin`, admin-token material, `raw_json`, `stress_points_json`, or export data. No migration — reuses the columns added in 0013.

Added a `#/u/:slug` hash route in `public/app-v10.js` (checked on boot and on `hashchange`), a `renderPublicProfile()` view with loading/error states, a friendly "Profile not found or not public." message on any error (never the raw error code), the required disclaimer, and a best-effort "← Back to Me" when the viewer's own saved slug matches the profile being viewed (otherwise "← Back to Home"). No edit/archive/export controls, no owner-only Me data anywhere in this view.

Also fixed an observed bug from D-140B owner smoke: the Copy-share-link button previously reflected only the last-*saved* `profile_public`/`profile_slug` state, so it could stay visible after the owner unchecked "Make my profile public" but before saving. It now re-evaluates from the live checkbox/slug input values on every change (`meUpdateProfilePreview()`), so it hides/disables immediately and matches the copied link to what's actually in the form.

---

## Production Confirmed (owner-smoked)

- Profile Settings exists inside Me.
- Public profile is off by default.
- Slug is required only when going public.
- Saved slug/bio works.
- Copy share link uses `#/u/:slug` and correctly tracks live form state.
- A private profile returns a friendly not-found/not-public state — never distinguishing "private" from "doesn't exist."
- A public profile loads at `#/u/calenhir`, showing bio, public counts, and recent public truths/evidence/pressure.
- No public claims yet is handled cleanly (empty-state copy, not a broken section).
- No email, user id, admin fields, or owner-only controls (export/archive/settings) are visible on the public page.
- Home, Me, Truths, and Review pages still work unchanged.

---

## Migration Added

`migrations/0013_public_profile_foundation.sql` (gated, additive only):

| Column/Index | Table | Purpose |
|---|---|---|
| `profile_public INTEGER DEFAULT 0` | `users` | Explicit opt-in toggle, off for every existing and new user |
| `profile_slug TEXT` | `users` | Separate, user-chosen public identifier — distinct from `handle`, which has no uniqueness constraint |
| `profile_bio TEXT` | `users` | Short public bio, capped at 240 chars at save time |
| `idx_users_profile_slug` (partial unique) | `users` | `ON users(profile_slug) WHERE profile_slug IS NOT NULL` — NULLs never collide, same pattern as `users.email` in migration 0010 |
| `public_summary_enabled INTEGER DEFAULT 0` | `belief_snapshots` | Per-snapshot opt-in for future Mirror sharing — added now as a no-op column so a later endpoint has somewhere to write; unused by any endpoint in this chain |

---

## API Added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/my-humanx/profile-settings` | `x-humanx-user` | Saves the caller's own `profile_public`/`profile_slug`/`profile_bio`. Slug validated and required only when going public; `409 SLUG_TAKEN` on uniqueness conflict; slug always `NULL` when private. |
| `GET` | `/api/u/:slug` | None (public, no-auth) | Read-only, opted-in profile lookup. Identical `404 PROFILE_NOT_FOUND` for missing/invalid/private slugs. Public, non-archived content only, capped at 10 rows per type, evidence/pressure summary-level only. |

---

## Frontend Added

- Profile Settings panel in Me, positioned next to the account card (`meProfileSettingsHtml()`).
- Live client-side preview (`meProfilePreviewBodyHtml()`, `meUpdateProfilePreview()`) — slug/bio/public counts only, recomputed on every input change.
- Copy-profile-link (`meCopyProfileLink()`) — builds `${location.origin}/#/u/${slug}`, live-state-gated.
- `#/u/:slug` hash route (`parsePublicProfileHash()`, `applyHashRoute()`, checked on boot and `hashchange`).
- Public, read-only profile view (`renderPublicProfile()`, `renderPublicProfileHtml()`, and per-type recent-list renderers) — no edit/archive/export controls.
- Friendly not-found/private state, shown identically for both cases.

---

## Public Profile Safety Model

- Explicit opt-in only — `profile_public` defaults to 0; nothing changes visibility for any existing user.
- The public route returns the same generic `404 PROFILE_NOT_FOUND` for a private profile, a nonexistent slug, and an invalid slug — never a distinguishing signal.
- Never exposed: `email`, the internal `id`, `verified`/`verified_at`, `trust_score`, `strike_count`, `is_shadow_banned`, `is_admin`, `fingerprint_hash`, admin-token material.
- Only `review_state='public'` content is ever returned, and only rows where `archived_by_user=0` — a user's own archive action immediately removes that item from their public profile.
- Evidence and pressure rows are summary-level only in v1 — no `body`, no `source_url`.
- No raw belief-engine data — `raw_json`, `stress_points_json`, and `belief_snapshots` are not touched by the public route at all.
- No comments, no social feed, no follows — confirmed by smoke test that no such UI exists anywhere in the public profile view or settings panel.
- No edit, export, or archive controls reachable from the public page — those remain entirely inside the private Me dashboard.

---

## Explicit Known Limitations

| Limitation | Detail |
|---|---|
| **`x-humanx-user` is still unsigned and spoofable for owner settings** | Same pre-existing limitation carried through D-136/D-137/D-138/D-139 — saving profile settings is only as strong as whatever identity the header claims. The public read route itself requires no identity at all, so this limitation doesn't affect public visitors, only who can *change* a given account's settings. |
| **Hash route only — no pretty `/u/slug` path yet** | `wrangler.toml` has no SPA-fallback configuration, so a real path like `/u/handle` would 404 against Cloudflare's static-asset handler. `#/u/slug` requires no infra change and was the only option available without a deploy-config change (see D-140A audit). |
| **No selected snapshot sharing yet** | `belief_snapshots.public_summary_enabled` exists in the schema but has no endpoint — Belief Mirror data is not part of the public profile in this chain. |
| **No custom public sections yet** | The public profile shows a fixed set of sections (bio, counts, four recent lists) — there is no way for a user to choose what appears or reorder it. |
| **Public profile has simple recent lists, not a polished share-card layout** | v1 prioritized correctness and minimal exposure over presentation — recent items render as plain text rows, the same `.me-item-list` pattern used elsewhere, not a designed share card. |
| **`worker-route-static-check.mjs` has one expected warning** | `/api/u/:slug` is a parameterised route, so it triggers the same harmless "parameterised route; expected absence from literal routing block" warning that `/api/claims/:id` already produces — not a failure, not a regression. |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 827 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```

---

## Recommended Next Implementation

**D-141A — Public profile polish / selected snapshot sharing audit**

The public profile now exists safely end-to-end: explicit opt-in, validated and unique slugs, a public route that leaks nothing beyond what was deliberately published, and a working read-only view. The next product decision is presentation and scope, not safety: should the public profile move from plain recent-activity lists to a more polished share-card layout, should users be able to select specific Belief Mirror snapshots to publish (using the already-added but unused `public_summary_enabled` column), or should effort instead go toward a real `/u/slug` path (requiring a `wrangler.toml` SPA-fallback change) before any further content is added? A read-only audit should weigh these against each other before any comments/social layer is considered.
