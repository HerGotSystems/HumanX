# D-160A — Invite / Access Path Audit

**Date:** 2026-06-24
**Scope:** Docs only. Audit and recommendations for D-160B. No code change in this patch.

---

## Current Behaviour Summary

### Entry paths for a first-time visitor

1. **Direct to `/`** — lands on the home page. Since D-159B, the badge reads "invite-only preview" and a short intro explains that HumanX is invite-only. A "View a public profile example →" link goes to `/u/calenhir`. No further join/request-access path is shown.

2. **Direct to `/u/:slug`** — lands on a public profile. The context block explains what HumanX is. The "Copy profile link" CTA exists (for non-owner visitors). No join/request-access path is shown.

3. **Via "View in HumanX →" from a public profile claim** — opens the claim in arena (study) mode. The visitor is in the app but has no context for how to join.

### Account panel (invite redemption)

The "account panel" is accessed by clicking the `{handle}` badge in the top bar. For an anonymous (unverified) user it shows:
- Badge: "Anonymous"
- Handle and User ID (local pseudonymous ID)
- Invite redemption form: code field + email field + optional display name field + "Redeem" button

The entry label is: **"Have an invite code?"**

No explanation of how to obtain a code is provided. The panel assumes the visitor already has one.

### Admin invite creation

`renderAdminInvitePanel()` renders the invite creation form. It is only displayed when an admin token is present (`${token ? renderAdminInvitePanel() : ''}`). It is inside the admin-gated Review area — not reachable from the public account panel. The comment in the source explicitly confirms: "Never reachable from the public account panel (D-136C), which only ever calls /api/me and /api/auth/invite/redeem."

Backend route `/api/auth/invite/create` requires `requireAdmin(request, env)` — returns 403 if the `x-humanx-admin` token is absent or invalid. This is confirmed in `worker.js`.

### Backend invite redemption

`/api/auth/invite/redeem` (POST):
- Requires `x-humanx-user` header (existing anonymous identity — no new identity minted)
- Rate-limited: 8 attempts/hr/IP
- Single-use: atomic `UPDATE ... WHERE redeemed_by IS NULL AND revoked=0` — closes the race window between read and write
- Enforces email uniqueness
- Sets `email`, `verified=1`, `verified_at`, `display_name` — never sets `is_admin`
- On user-update failure: rolls back the invite claim atomically

### Session and localStorage

`ensureSession()` POSTs to `/api/session` with the existing anonymous `x-humanx-user` identity from localStorage. If `s.owner_token` is returned, it is saved to `user.ownerToken` client-side only — never rendered in any public page. The anonymous user handle and pseudonymous ID in the account panel are local to the current user only.

---

## Visitor 5-Second Read (post D-159B)

At `/`, within 5 seconds a visitor reads:
1. "invite-only preview" (badge)
2. "HumanX is an invite-only space for testing claims, mapping beliefs, and sharing public thinking profiles." (intro sentence)
3. "View a public profile example →" (bridge link)

**What they understand:** It's invite-only, and there's a profile to look at.

**What they still do not understand:**
- How to get an invite code
- Whether there is a request-access or waitlist path
- Where to look if they want to join

A visitor who opens the account panel badge will see "Have an invite code?" — which confirms the invite model but still gives no path forward if they do not have a code.

---

## Invite-Code Path Verdict

**The happy path works cleanly.** A visitor who receives an invite code via out-of-band communication (email, message) can:
1. Open `/` → click the `{handle}` badge → account panel opens
2. See "Have an invite code?" form
3. Enter code + email + optional display name → click Redeem
4. Receive `Invite redeemed — account verified.` toast → account state updates

The flow is functional but its entry point is not discoverable. The `{handle}` badge looks like a user identifier, not a join button. A visitor who does not already know to click it will not find the redemption form.

**No invite code is ever exposed on a public page or unauthenticated API response.** Confirmed.

---

## Request-Access Path Verdict

**None exists.** HumanX currently has no "request an invite", "join waitlist", or "get in touch" path. A visitor who does not have an invite code and wants to join has no action to take.

Given that the home page now explicitly says "invite-only", this gap is honest but creates a dead end. The recommended D-160B patch adds a minimal no-backend "request access" suggestion (a contact method or note about availability) so visitors have somewhere to direct intent.

---

## Admin Invite Creation Safety Verdict

**Correctly gated.** Three independent layers protect the creation route:
1. `requireAdmin(request, env)` in `worker.js` — the route returns 403 if admin token is absent/invalid
2. `renderAdminInvitePanel()` is only rendered inside the admin-token-gated Review UI — not visible in the public account panel
3. The `createInviteCodeUI()` function checks `adminToken()` on the client before making the API call

Generated codes are displayed only in the admin panel (`<code class="admin-invite-code">`) and copyable via `copyAdminInviteCode()`. They are never written to localStorage, never appended to any public page, and never returned by any unauthenticated route.

The `createInviteCode()` backend function returns `{ ok: true, code, invite }` — the invite object includes the code itself, but this response is delivered only to the authenticated admin session. No public route can access this.

---

## Public / Privacy Boundary Verdict

**Clean.** Confirmed:
- No invite code ever appears on a public page or unauthenticated API response
- `accountPanelHtml()` shows the current user's own handle and pseudonymous ID only — never another user's data
- `redeemInviteCode()` never sets `is_admin`, never leaks other users' emails, enforces email uniqueness before writing
- `owner_token` is client-side only, never rendered
- `email` shown in the verified account state panel is the current user's own email — visible only to them in their own panel
- `user.id` (local pseudonymous ID) shown in the anonymous state is the current user's own ID — visible only to them

---

## Recommended D-160B Implementation Plan

**Goal:** Close the "what do I do if I want to join?" dead end without building a full request-access system.

**Scope:** Frontend only — `accountPanelHtml()` in `public/app-v10.js` and/or home intro in `renderHome()`. No backend changes. No new API routes.

### 1. Add a "Don't have a code?" line to the account panel

Currently: form shows only "Have an invite code?" with no alternative.

Add below the redeem form (or when verified is false and no code is available to type):

> "Don't have a code? HumanX is in private preview. Invite codes are shared directly by members."

This is accurate, sets honest expectations, and requires no backend.

**Optional extension (low-risk, also docs-only):** If a contact/social link exists (e.g. a public post or link), add it here. If no such link is currently established, omit this and keep the copy factual.

### 2. Add a "make the badge look like an action" CSS hint

The `{handle}` badge as the account panel trigger does not read as a button to a first-time visitor. Options:
A. Add a small text label next to the handle badge: "Account / Invite"
B. Add a tooltip (`title="Open account panel"`) on the badge
C. Change badge wording: if anonymous, show "◎ Anon" or "◎ Join" instead of just the handle

Recommendation: (C) — change the account badge wording when the user is anonymous to include a small signal like "◎ Invite" so a first-time visitor who has a code knows where to click.

### 3. Keep the home intro as-is

The D-159B intro sentence already accurately communicates the invite model. No change needed there.

### What NOT to Change

- Backend invite routes — already clean
- `requireAdmin` gating on `/api/auth/invite/create` — correct
- The invite redemption form itself — functional
- Any invite code format, expiry, or rate limit logic
- Owner-token flow — frozen (D-149H)
- Admin review area — no changes

---

## Privacy Boundary Confirmation

No API changes proposed. No new fields rendered. D-160B is strictly a `accountPanelHtml()` copy and/or badge label change.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-160B plan.
