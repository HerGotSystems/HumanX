# D-159B — Public Home Clarity Bridge

**Date:** 2026-06-24
**Scope:** Frontend only (`public/app-v10.js`, `public/styles.css`). No backend changes. No migration. No `wrangler.toml`. No admin-route changes. No owner-token work.

---

## What Changed

### 1. Badge replacement

**Before:** `<span class="badge b-green">working system</span>`
**After:** `<span class="badge b-blue">invite-only preview</span>`

The `working system` badge communicated internal development status, not value to a visitor. `invite-only preview` communicates access model (invite-only) and stage (preview) — both useful to a first-time visitor.

### 2. Short intro paragraph

Added immediately below the existing subtitle:

> "HumanX is an invite-only space for testing claims, mapping beliefs, and sharing public thinking profiles."

This one sentence answers the three questions the subtitle leaves open: who can join (invite-only), what the core activities are (testing claims, mapping beliefs), and that public profiles exist as a sharable output.

CSS: uses `.cc-subtitle.cc-intro` (inherits 12px / 1.55 line-height from `.cc-subtitle`, adds `color:var(--muted)` for slight de-emphasis vs the primary subtitle).

### 3. Public profile bridge link

Added below the intro:

> "View a public profile example →" — links to `/u/calenhir`

CSS: `.cc-intro-bridge` (margin container) + `.cc-bridge-link` (blue, 11px, bold, underline-on-hover).

This gives a visitor arriving at `/` their first direct path into a concrete piece of HumanX content, without requiring an account or an understanding of the vocabulary. The profile link is public and requires no auth.

### 4. Action card reorder

**Before:** Belief Engine (primary) → Drift → Submit Claim → Browse Claims → Evidence Vault → Truths → RunPack

**After:** Browse Claims (primary) → Belief Engine → Submit Claim → Drift → Evidence Vault → Truths → RunPack

**Why:**
- Browse Claims is the safest first action for a visitor or new user: they can read, study, and explore without submitting anything, requiring any prior knowledge, or leaving the app.
- Belief Engine is important but navigates away to a separate app — not ideal as the primary first action for a stranger.
- Submit Claim retains third position — it is a natural second or third step once a visitor has seen what claims look like.
- Drift moves to fourth — it is most useful for returning members who have prior snapshots.

`cc-card-primary` is now on Browse Claims. Belief Engine card retains identical content, just without the primary (purple) accent.

---

## Why This Improves First-Time Visitor Understanding

| Before D-159B | After D-159B |
|---|---|
| Badge: "working system" — meaning unclear | Badge: "invite-only preview" — access model clear |
| Subtitle alone: what HumanX does | Subtitle + intro: what HumanX does AND who it's for |
| No path to see real content without an account | Bridge link to `/u/calenhir` — real content, zero friction |
| First card: Belief Engine (navigates away) | First card: Browse Claims (stays in app, safe first action) |
| Profile discovery: none from home | Profile discovery: one example link |

---

## Public Profile Bridge Behaviour

The bridge link `<a href="/u/calenhir">View a public profile example →</a>` is a standard anchor tag. On click, the browser navigates to `https://humanx.rinkimirikata.com/u/calenhir` and the public profile renders directly (the boot sequence detects the `/u/` path and sets `mode='publicProfile'`). No auth required.

From the profile, the visitor can use "← Back to Home" to return to the home page. The round-trip is clean.

---

## Privacy Boundary Confirmation

- No API change. No new fields rendered.
- The bridge link targets a public URL (`/u/calenhir`) — no user-private data.
- `renderHome()` was audited: no reference to `.email`, `.is_admin`, `owner_token`, or `admin_token` in the rendered HTML.
- Account panel (invite redemption) is unchanged.
- All admin gating unchanged.

---

## Baseline

New section 92 added to `scripts/hardening-smoke-test.mjs` (11 new tests).

```
node scripts/hardening-smoke-test.mjs       → 1149 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## Recommended Next Step

**D-159C** — Bump deploy metadata for D-159B and live-verify. Owner checks `/` for the new badge, intro paragraph, bridge link, and card order. Owner checks `/u/calenhir` to confirm public profile still works correctly.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.
