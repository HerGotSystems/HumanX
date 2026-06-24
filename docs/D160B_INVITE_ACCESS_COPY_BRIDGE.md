# D-160B — Invite Access Copy Bridge

**Date:** 2026-06-24
**Scope:** Frontend only — `public/index.html`, `public/app-v10.js`, `public/styles.css`. No backend, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Anonymous account badge — invite signal (`public/index.html` + `public/app-v10.js`)

**Before:** The `#who` badge showed the user's pseudonymous handle (e.g. `autumn-fox-42`), or `anonymous` as the initial text. This looked like an identifier, not a button.

**After:** The badge now reads **`◎ Invite`** for anonymous (unverified) users.

- `public/index.html`: initial text changed from `anonymous` → `◎ Invite`; `title` changed from `Account` → `Account / Invite`
- `updateWhoBadge()` in `app-v10.js`: the else-branch (anonymous path) now sets `el.textContent = '◎ Invite'` instead of the pseudonymous handle string

Verified users continue to see their display name / handle as before.

### 2. No-code explanatory copy in account panel (`public/app-v10.js`)

Inside `accountPanelHtml()`, the `redeemHtml` block (shown only to unverified users) now includes a paragraph below the Redeem button:

> "Don't have a code? HumanX is in private preview. Invite codes are shared directly by members."

CSS class `.account-nocode-note` applied: muted, italic, 4px top margin.

### 3. CSS addition (`public/styles.css`)

```css
.account-nocode-note{margin:4px 0 0;color:var(--muted);font-style:italic;line-height:1.45}
```

---

## Why It Helps First-Time Visitors

Before D-160B, a visitor who had received an invite code via email or message had no visual signal that the `autumn-fox-42` badge was the entry point for redemption. The D-160A audit confirmed the flow was functional but its entry point was not discoverable.

After D-160B:
- The badge itself (`◎ Invite`) communicates action intent — a visitor with a code will click it
- The no-code note sets honest expectations for visitors without a code ("private preview, codes shared directly by members") — they understand they need to obtain one through social contact, not an open form

---

## What It Deliberately Does Not Implement

- No request-access form or email collection
- No waitlist endpoint
- No new API route
- No change to admin invite creation (`renderAdminInvitePanel`, `/api/auth/invite/create`)
- No change to invite redemption flow (`redeemInviteUI`, `/api/auth/invite/redeem`)
- No change to rate limits, code format, expiry, or atomic claim logic
- No session or owner-token behaviour change

---

## Invite / Privacy Boundary Confirmation

- No invite code is rendered on any public page or unauthenticated API response
- `accountPanelHtml()` continues to show only the current user's own state — no other user's data
- The no-code note is static copy with no API call
- `/api/auth/invite/create` remains behind `requireAdmin` — unchanged
- `/api/auth/invite/redeem` remains rate-limited (8/hr/IP), atomic, single-use, and never sets `is_admin` — unchanged

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1161 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

12 new smoke tests added in Section 93.

---

## Recommended Next Step

D-160C: Bump, deploy, and owner-terminal preflight live verify this change. Expected preflight args:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-160B <commit> 1161/24/57
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
