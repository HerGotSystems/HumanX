# D-159A — Public Onboarding / Landing Clarity Audit

**Date:** 2026-06-24
**Scope:** Docs only. Audit and recommendations for D-159B. No code change in this patch.

---

## Current Landing Behaviour

### Boot sequence

`boot()` runs on page load. It:
1. Resolves a public profile slug from the URL (`/u/:slug` path or `#u/:slug` hash) — if found, goes directly to public profile mode.
2. Calls `/api/health` to determine live vs demo mode.
3. Calls `ensureSession()` to bootstrap an anonymous identity via `/api/session`.
4. Loads graph status and claims.
5. Calls `render()` → `renderHome()`.

There is no gate. Any visitor who reaches `https://humanx.rinkimirikata.com/` gets the full logged-in app shell — home mode renders immediately for anonymous (pseudonymous) users. No separate "logged out" landing page exists.

### What `renderHome()` renders

The home page is a rich app dashboard, not a landing page:

- **Badge**: `working system` (green)
- **H1**: `HumanX`
- **Subtitle**: `Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence. HumanX organises what people assert — it does not decide what is true.`
- **Status line**: `{handle} · D1 live / demo · N claims · N truths · N evidence`
- **Pipeline banner**: `Beliefs → Truths → Claims → Evidence → RunPack` (five stages, abbreviated)
- **Graph box** (right column on desktop): numeric/visual breakdown of total graph state
- **Actions grid**: 7 feature cards — Belief Engine, Drift, Submit Claim, Browse Claims, Evidence Vault, Truths, RunPack
- **Sidebar helper text**: `Beliefs → Truths → Claims → Evidence → RunPack` · "New submissions enter Review before becoming public." · "Pseudonymous. No email required."

### Account / Join panel

The "who" badge in the top bar opens the `accountPanelHtml()` panel. For an unauthenticated anonymous user it shows:
- Badge: `Anonymous`
- Handle and User ID (local pseudonymous ID)
- Invite code redeem form: code + email + optional display name

No public-facing "how to get an invite" copy exists. The invite field just appears with no explanation of how codes are distributed.

### Public profile entry path

- Direct URL: `https://humanx.rinkimirikata.com/u/calenhir` → boot detects the path slug, sets `mode='publicProfile'`, renders profile without showing home first.
- From public profile footer: "← Back to Home" → `setMode('home')` → full app home renders.
- From public profile claims: "View in HumanX →" → opens the claim in arena mode (requires the app to already be loaded — works in-app, but a visitor who navigates directly into a claim study has no explanation of what they are seeing).

### Unauthenticated API surface

All public routes are GET-only or anonymous POST-safe:
- `GET /api/health` — no user data
- `GET /api/version` — no user data
- `POST /api/session` — creates/returns anonymous pseudonymous user (no email, no real identity required)
- `GET /api/u/:slug` — public profile data only (slug, displayName, bio, counts, recentClaims, recentTruths, recentEvidence, recentPressure, sharedSnapshot)

The `/api/session` response does include `owner_token` when conditions are met — but this is consumed client-side only and never rendered in UI. No private fields are exposed in the rendered home or public profile views.

---

## 5-Second Visitor Read

What a first-time visitor sees on `https://humanx.rinkimirikata.com/`:

1. Green `working system` badge
2. Large `HumanX` heading
3. Three-sentence subtitle
4. A status line showing `anon · D1 live · N claims · N truths · N evidence`
5. A five-step pipeline banner: `Beliefs → Truths → Claims → Evidence → RunPack`

**What they understand:** HumanX exists, has data, and involves beliefs, truths, claims, evidence, and something called RunPack. They do not yet understand who it is for or what they should do.

**What they do not understand:**
- Whether they are allowed to use it
- Whether it is invite-only
- What the difference between "Beliefs", "Truths", and "Claims" is
- Whether public profiles (the most sharable entry point) are related to the main app
- What "RunPack" means
- What the graph box on the right means

---

## Strongest Current Hook

| Element | Hook strength | Reasoning |
|---|---|---|
| **Subtitle line** | ★★★☆☆ | Clear but abstract. "Pressure-test public claims with evidence" is the most concrete phrase. |
| **Pipeline banner** | ★★☆☆☆ | Visually interesting but labels are jargon — "Beliefs" vs "Truths" vs "Claims" is not obvious without context. |
| **Belief Engine card** | ★★★★☆ | Has the best copy of any element: "Map how a belief works inside you before turning it into a public claim." This is the clearest single sentence in the entire app. |
| **Browse Claims card** | ★★★☆☆ | "Open, study, vote on, and attach evidence to public claims." Concrete. |
| **Working system badge** | ★☆☆☆☆ | Signals technical status, not value. Meaningless to first-time visitors. |
| **Graph box** | ★☆☆☆☆ | Numbers without context. |
| **Public profile (via /u/ link)** | ★★★★★ | After D-154–D-158, the public profile is now the strongest front-door experience for a visitor who arrives via a shared link. It has a clear subject (a person), a distinctive hook (the Belief Snapshot), and a vocabulary guide. But it requires a shared link — there is no way to discover profiles from the home page. |

**Conclusion:** The Belief Engine action card has the best single-sentence value description in the app. But a visitor who arrives at `/` without a profile link has no obvious first action and no explanation of who can use HumanX or how.

---

## Biggest Friction Points

1. **No "who can use this" copy.** The page implies it is a live system someone can join, but gives no signal that it is invite-only. The invite redemption is hidden behind the "anon" badge — a visitor who does not know to look there will not find it.

2. **Vocabulary not front-loaded.** "Beliefs", "Truths", "Claims", "Evidence" are presented as givens. The public profile context block (D-154B) explains these well. The home page does not.

3. **The pipeline banner replaces explanation.** `Beliefs → Truths → Claims → Evidence → RunPack` works as a mnemonic for users who already know the system. For a new visitor it is a list of undefined nouns.

4. **No profile discovery.** If a visitor arrives from a shared public profile link and navigates to "← Back to Home", they land in the full app dashboard — they cannot browse other profiles, and there is no indication that public profiles exist as a feature of the site.

5. **"Working system" badge.** This appears to signal development status to the owner, not value to a visitor. A visitor reads it as "this is a work in progress."

6. **Seven action cards with similar visual weight.** No single card is highlighted as the recommended starting point. "Belief Engine" is the deepest/best-explained, but it navigates away to a different app. "Browse Claims" would be a more natural first action for someone curious about the community's work.

7. **Account panel has no entry point copy.** The invite redemption form appears with no explanation of what an invite code is or how to get one. "Have an invite code?" is the only context provided.

---

## Relationship to Public Profile UX

The public profile (post D-158B) is now the strongest public-facing experience:
- Clear identity card
- Distinctive Belief Snapshot hook
- Vocabulary guide (context block)
- Claims, truths, evidence in order of distinctiveness
- Copy-to-clipboard CTA

But it exists in isolation. There is no link from the home page to any public profile. A visitor who arrives at `/` cannot find profiles. A visitor who arrives at a profile cannot discover others. The two experiences are currently disconnected.

The ideal relationship:
- Public profile is the best shareable unit
- Home page should acknowledge profiles exist and offer at least one entry point to browse or discover them
- "View in HumanX →" from claims navigates into the app correctly, but a first-time visitor landing from a claim study has no context

---

## Privacy / Public Boundary Verdict

**Clean.** No private fields are exposed on unauthenticated routes:
- `/api/u/:slug` returns only: slug, displayName, bio, counts, recentClaims (claim text + category), recentTruths (statement + category), recentEvidence (title + quality), recentPressure (title + severity), sharedSnapshot (pattern, scores, counts, date)
- No user.id, email, is_admin, owner_token, evidence.body, pressure_points.body, internal metadata
- The `owner_token` returned by `/api/session` is client-side only, never rendered
- `accountPanelHtml` renders `user.id` (the local anonymous pseudonymous ID) and `accountUser.email` (post-redeem) — these are shown only to the current user in their own panel, never on public pages

No change needed for the privacy boundary. The current separation is correct.

---

## Recommended D-159B Implementation Plan

**Goal:** Make the first 5 seconds of `/` meaningful to a first-time visitor without rebuilding the app or changing any routes.

**Scope:** Frontend-only, `renderHome()` and minor CSS. No backend changes.

### 1. Replace the `working system` badge with a visitor-oriented tagline

**Before:** `<span class="badge b-green">working system</span>`
**After:** Remove the badge entirely, or replace with a short plain-text eyebrow: `"Public thinking profile"`

The badge communicates nothing useful to a visitor and adds noise.

### 2. Add a short "what is HumanX" one-paragraph intro below the subtitle

Current subtitle is already good. Add one sentence below it that explains who can use it:

> "HumanX is invite-only and pseudonymous. If you have an invite code, open the ◎ badge to redeem it. To explore public profiles shared by members, use `/u/[handle]` links."

This is the minimum viable first-time visitor explanation. It tells visitors: (a) it's invite-only, (b) how to join, (c) that public profiles exist.

### 3. Reorder action cards

Promote "Browse Claims" above "Submit Claim" and "Drift". The recommended first action for a curious visitor who cannot yet submit should be to browse what others have submitted, not to be directed to the Belief Engine (which navigates away) or Submit Claim (which requires prior context).

Suggested order: Browse Claims → Submit Claim → Belief Engine → Truths → Evidence Vault → Drift → RunPack

### 4. Add a "View public profiles" entry point (optional, low-risk)

The home footer or action section could include a minimal CTA: "View a public thinking profile: `/u/[handle]`" with an example or a link to the calenhir profile. This makes the public profile feature discoverable from home.

### What NOT to Change

- The subtitle line — it is good
- The pipeline banner — useful for users who already know the system; can stay
- The helper text — accurate
- All backend routes
- Account panel content — the invite redeem works; just the entry copy is missing
- Any moderation, admin, or review UI

---

## Privacy Boundary Confirmation

No API changes proposed. No new fields rendered. D-159B is strictly a `renderHome()` and CSS-only patch.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-159B plan.
