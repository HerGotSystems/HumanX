# D-186A — Public Landing / Sharing Readiness Audit

**Date:** 2026-06-28  
**Method:** Source-code review — `public/app-v10.js`, `public/index.html`, `src/worker.js`  
**Starting state:** HEAD `fa40449` · Baseline 1525/24/57  
**Scope:** Anonymous and first-time visitor flows. No backend, auth, or admin changes.

---

## Routes inspected

| Route | How served |
|-------|-----------|
| `/` | Static `index.html` via Cloudflare Assets → SPA boots, `mode='home'` |
| `/u/:slug` | Worker intercepts, injects OG meta tags, then serves same `index.html`; SPA boots with `mode='publicProfile'` |
| `#/u/:slug` | Hash fallback — `applyHashRoute()` sets `mode='publicProfile'` client-side |
| Direct claim/study URL | **Not a route.** No `/claim/:id` or `/study/:id` path exists. Claims are only accessible via SPA navigation (clicking a card in Arena, or `View in HumanX →` from a public profile). |
| `/api/u/:slug` | JSON-only API. Returns 404 `PROFILE_NOT_FOUND` for missing/private slugs (deliberately ambiguous — same 404 for private and not-found). |

---

## Current behavior, screen by screen

### 1. Main landing `/`

**What a visitor sees:**

- `invite-only preview` badge top-left
- Tagline: "Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence. HumanX organises what people assert — it does not decide what is true."
- Second sentence: "HumanX is an invite-only space for testing claims, mapping beliefs, and sharing public thinking profiles."
- "View a public profile example →" link to `/u/calenhir`
- Pipeline diagram: Beliefs → Truths → Claims → Evidence → RunPack
- Status line showing anonymous handle, graph counts, and live/demo status
- "Start Here" 4-step strip (Explore → Open → Submit → RunPack)
- Actions grid with 7 cards: Browse Claims, Belief Engine, Submit Claim, Drift, Evidence Vault, Truths, RunPack

**Assessment:** The page explains the *product concept* but not the *access model*. A visitor cannot immediately tell:
- Whether they can browse claims without an account (they can, but it's not stated)
- What specifically requires an invite (submitting and profiling are invite-gated; browsing is not)
- What "invite-only preview" means for them right now — are they locked out, or can they read?

### 2. Public profile `/u/:slug` — resolved slug

**What a visitor sees:**

- "Public Profile" heading
- Display name + `/u/slug`
- Bio text or belief-pattern fallback
- Optional: Shared Belief Snapshot panel (dominant pattern, stability/openness/pressure meters)
- Context block explaining what HumanX profiles are ("not a diagnosis or personality test")
- Sections: Claims being tested / Public truths / Public Activity counts / Supporting evidence / Questions under pressure
- Footer: `← Back to Home` button + `Copy profile link` button (for non-owner visitors)
- Each claim row has a `View in HumanX →` button that opens the claim in Study mode

**Assessment:** The profile page is structurally complete. The context block is good. But there is no invitation to the visitor to explore further — no "Browse all claims", no "Create your own profile", and no explanation of how to get access. A visitor who finds a shared profile arrives, reads it, and hits a dead end.

### 3. Public profile `/u/:slug` — missing or private slug

**What a visitor sees:**

```
Profile not found or not public.
← Back to Home
```

**Assessment:** Handled. Does not distinguish missing from private (intentional). "Back to Home" CTA is present. The copy is functional but bare — no context about what went wrong, no suggestion to ask the profile owner for the correct link.

### 4. Shared profile — "View in HumanX →" from profile claim list

A visitor on a public profile can click `View in HumanX →` on any claim row. This calls `openPublicProfileClaimStudy(claimId)`, which sets `lastModeBeforeStudy='arena'`, switches to arena mode, and calls `selectClaim(claimId)`. The back button then reads `← Back to Claims`.

**Assessment:** Works. But the back button label `← Back to Claims` after arriving from a public profile is slightly confusing — the visitor was looking at a person's profile, not the Arena. The label doesn't reflect where they came from.

### 5. What a visitor can do without an account

The app auto-creates an anonymous local user via `localUser()` on every boot (localStorage only). The anonymous user can:

- Browse all claims in Arena
- Open a claim in Study mode and read evidence, pressure, tests, analysis
- Vote on claims (votes are attributed to the anonymous local ID)
- Browse Truths, Evidence Vault, Drift, RunPack (read-only)
- View public profiles
- Open Belief Engine (fully client-side)
- Submit a claim or truth (enters Review with the anon handle)

The anonymous user **cannot**:
- Redeem an invite code (the invite-code redeem requires a code from a member)
- Create a public profile (requires verified account / invite)
- Share a profile link (no profile means no slug to copy)

**Gap:** This capability matrix is **never stated anywhere on the landing page or in the app**. A visitor who arrives at `/` and sees "invite-only preview" may assume they cannot browse claims at all and leave without exploring.

### 6. Account panel for anonymous users

The account popover (opened via the handle badge top-right) shows:

- "Anonymous" badge + anon handle + user ID
- Invite code redeem form (three inputs: code, email, display name)
- Note: "Don't have a code? HumanX is in private preview. Invite codes are shared directly by members."
- "Close" button

**Assessment:** The invite redemption path is functional. The note is honest. But the panel never explains what the anon user can do *right now* — they may assume browsing requires an invite.

### 7. What happens on mobile

All findings from D-185A/B/C apply. Additionally for public-landing-specific concerns:

- The "View a public profile example →" link (`cc-bridge-link`) is an `<a href="/u/calenhir">`. It is present but styled as a plain paragraph link, easy to miss below the two subtitle paragraphs. On mobile at 375px it sits in a thin line between dense paragraphs.
- The pipeline banner at ≤600px shows 3 stages without arrows, which doesn't communicate the flow well to new visitors.
- The `cc-card-when` "When:…" context text is hidden at ≤600px — new visitors lose the action-card context on mobile.

### 8. OpenGraph / social sharing

**The `/u/:slug` route** injects:

- `<title>{{displayName}} on HumanX</title>`
- `<meta name="robots" content="noindex">` (unconditional — profiles are not search-indexed)
- `<link rel="canonical" href="/u/{{slug}}">` (only on resolved public profiles)
- `og:title`, `og:description` (bio or fallback "A HumanX public profile.")
- `og:type`: `profile`
- `og:url`
- `twitter:card`: `summary`

**Missing on `/u/:slug`:**

- `og:image` — no image at all. Twitter/LinkedIn/Slack preview shows a blank card. Significant sharing gap.
- `og:site_name`
- `twitter:title`, `twitter:description` (Twitter reads `og:` fallbacks but explicit `twitter:*` is more reliable)

**The root `/` route** has no OG tags at all:

- `index.html` only has `<title>HumanX — Belief → Truth → Claim → Evidence</title>` and `<meta name="viewport">`.
- No `og:title`, `og:description`, `og:image`, `og:type`, `og:url`.
- No `twitter:card`.
- No `<meta name="description">` for search previews.
- No favicon, no `apple-touch-icon`, no `manifest.json`.

When someone shares `https://humanx.pages.dev/` on Slack, Twitter, or LinkedIn, the link preview will be **empty** — no image, no description, no meaningful title fallback beyond the tab title.

### 9. Direct claim URLs

There is **no `/claim/:id` or `/study/:id` route**. Claims are not directly linkable by URL. The only way to share a specific claim is:

1. Via a user's public profile (if that user made the claim public) — and even then, the visitor lands on the profile, not the claim directly.
2. By verbally directing someone to find it in Arena.

There is no "Copy claim link" button anywhere in Study mode. A claim's existence in a public profile's claim list is the closest approximation of deep-linking.

---

## Friction points summary

| ID | Severity | Issue |
|----|----------|-------|
| S-1 | P1 | No messaging that anonymous visitors can browse claims immediately — "invite-only preview" badge signals a locked door |
| S-2 | P1 | No `og:image` on `/u/:slug` — link previews on Slack, Twitter, WhatsApp show blank cards |
| S-3 | P1 | No OG tags at all on root `/` — sharing the home URL produces an empty link preview |
| S-4 | P2 | Public profile dead end — no "Browse all claims" or "Explore HumanX" CTA after viewing a profile |
| S-5 | P2 | No CTA for visitors who want access — nowhere does the app say "ask a member for an invite code" or suggest how to get one |
| S-6 | P2 | Back button after "View in HumanX →" from a profile reads "← Back to Claims" not "← Back to Profile" |
| S-7 | P2 | No direct claim URL — claims cannot be linked or shared individually |
| S-8 | P3 | "View a public profile example →" link is easy to miss — small text, plain `<a>` inline in a paragraph |
| S-9 | P3 | No favicon or `apple-touch-icon` — browser tabs show blank favicon |
| S-10 | P3 | Profile not-found copy is bare — no suggestion to ask the sharer for the correct link |
| S-11 | P3 | No `<meta name="description">` on root — search engines show the page title only |
| S-12 | P3 | `twitter:card` present but `twitter:title`/`twitter:description` absent — `og:` fallbacks work but explicit tags are more reliable |

---

## Broken / dead-end risks

1. **Shared `/u/calenhir` link** — the example profile link hardcoded in `renderHome()` points to `/u/calenhir`. If that profile is not public, private, or the slug has changed, first-time visitors get the bare "Profile not found or not public." dead-end screen. There's no fallback (e.g. a demo/seeded profile).

2. **Blank link preview** — any social share of the root URL or a profile URL without `og:image` will show an empty card. On WhatsApp and iMessage this is particularly stark — no image = no preview at all, just the raw URL.

3. **Anonymous vote permanence** — anonymous users can vote on claims. Their votes are stored against the anon UUID in localStorage. If they clear localStorage or open a different browser/device, the vote is not recoverable. There's no indication of this in the UI. Not a blocking risk, but contributes to confusion.

---

## Quick-fix candidates for D-186B+

| # | Fix | File(s) | Effort | Severity |
|---|-----|---------|--------|----------|
| 1 | Add "You can browse claims and read evidence without an account." sentence to the hero section | `app-v10.js` `renderHome()` | 1 line | P1 |
| 2 | Add `<meta name="description" content="...">` + `og:title` + `og:description` + `twitter:card` to root `index.html` | `public/index.html` | 4 lines | P1 |
| 3 | Add `og:site_name` and `twitter:title`/`twitter:description` to the profile OG block in `renderPublicProfileShell()` | `src/worker.js` | 2 lines | P2 |
| 4 | Add "Browse all claims →" button to public profile footer, alongside "← Back to Home" | `app-v10.js` `renderPublicProfileHtml()` | 1 line | P2 |
| 5 | Change "← Back to Claims" label to "← Back" (or detect whether user came from a profile) when entering Study from a public profile claim | `app-v10.js` `openPublicProfileClaimStudy()` | 1 line | P2 |

---

## Longer ideas (not quick fixes)

- **`og:image` for public profiles** — requires either a static placeholder image (e.g. `/og-default.png`) or a server-rendered card (e.g. via Satori / Canvas API in the worker). A static placeholder is a 1-hour job; a dynamic card is a multi-day job. Recommend static placeholder for D-186B, dynamic card as a future milestone.

- **Direct claim URL `/c/:id`** — a claim-deep-link route would need: worker route intercept → OG meta injection (claim title + summary) → SPA boot → auto-open the claim in Study mode. Medium complexity: ~half a day. High value for sharing individual claims.

- **"How to get access" page or modal** — right now the only hint is in the account panel: "Invite codes are shared directly by members." A dedicated `/about` or `/access` static page (or a modal triggered from the invite-only badge) would explain the preview model without requiring the visitor to open the account panel.

- **Hardcoded `/u/calenhir` example link** — replace with either a seeded demo profile (guaranteed to exist) or a configurable env variable, to avoid a dead link risk.

- **Favicon / PWA assets** — adding a favicon, `apple-touch-icon`, and `manifest.json` is low-effort and removes the blank-tab appearance.

---

## Answers to the audit questions

| Question | Answer |
|----------|--------|
| Does the app explain itself to a visitor who did not come from project context? | Partially. The tagline and pipeline banner explain what HumanX does. But the access model ("you can browse right now") is never stated — "invite-only preview" implies a locked door. |
| Does a shared profile/claim route load into the right screen? | Profile routes load correctly. Claim routes do not exist. |
| Are broken/missing public profiles handled clearly? | Handled but bare. "Profile not found or not public." with a Back button — no context or next step. |
| Is there a visible CTA after someone views a public profile? | Only "← Back to Home" and "Copy profile link." No CTA to browse claims or explore the app. |
| Does the visitor know they can browse claims without an account? | No. This is never stated. |
| Does the visitor know what requires an invite/account? | Only if they open the account panel and read the small print. |
| Are OpenGraph/social sharing basics present or missing? | Profile pages have partial OG (no image). Root `/` has no OG tags at all. |
