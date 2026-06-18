# D-136E — Invite Auth Checkpoint

**Date:** 2026-06-18
**Chain:** D-136A (audit) → D-136B (backend) → D-136C (account panel) → D-136D (admin invite creator) → D-136E (this doc)
**Scope:** Documentation only. No code changes. No D1 migration.

---

## Summary of the D-136 Chain

### D-136A — Invite-code auth foundation audit
Read-only implementation audit of the existing anonymous user/session model (`localUser()`, `/api/session`, `x-humanx-user`, `requireAdmin`/`x-humanx-admin`) and the `users` table schema. Identified the gaps required to add a minimal invite-code verification layer: missing `email`/`verified`/`verified_at`/`display_name` columns, no `invite_codes` table, no account-facing UI. Produced a PASS/WARN/FAIL table, an exact migration plan, an exact endpoint plan, and a recommended implementation order. No code changed.

### D-136B — Invite-code auth backend foundation
Added `migrations/0010_invite_auth.sql` (gated, not auto-applied): `users.email`/`verified`/`verified_at`/`display_name` columns, a partial unique index on `users.email` (NULLs don't collide), and a new `invite_codes` table with an index on `redeemed_by`. Deliberately did **not** add `handle` uniqueness or touch `is_admin`.

Added three Worker endpoints in `src/worker.js`:
- `POST /api/auth/invite/create` — admin-only (`requireAdmin`), mints a random `inv_*` code, never echoes the admin token.
- `POST /api/auth/invite/redeem` — requires `x-humanx-user`, rate-limited (8/hr/IP via `safeRateLimit`), validates email format and uniqueness, rejects revoked/already-redeemed/expired codes, claims the code via an atomic guarded `UPDATE ... WHERE redeemed_by IS NULL ...` checked against `meta.changes` to close the race window, then upgrades the *existing* `x-humanx-user` row in place — never mints a new user id, never writes `is_admin`. Rolls back the invite claim if the user update fails.
- `GET /api/me` — requires `x-humanx-user`, returns the current user row including the new verified-identity fields; omits `is_admin` and any admin-token material.

`/api/session` and `createOrGetUser` were left completely untouched — the anonymous flow is fully backward compatible.

### D-136C — Frontend account invite redeem panel
Added a compact, non-blocking account panel to the public frontend:
- `public/index.html` — clickable `#who` badge + hidden `#account-panel` popover container.
- `public/app-v10.js` — `loadMe()` (calls `GET /api/me` via the existing `api()`/`headers()` helpers, called non-blockingly from `boot()`), `accountPanelHtml()` (renders Anonymous-state or Verified-state block + invite-redeem form), `redeemInviteUI()` (POSTs `{code,email,displayName}` to `/api/auth/invite/redeem`, refreshes via `loadMe()` on success, toasts either way).
- `public/styles.css` — compact dark-theme popover styling.

No forced login. A failed `/api/me` call never delays or breaks the normal anonymous boot path. The panel never references `is_admin`, the admin token, or the admin invite-create route.

### D-136D — Admin invite-code creator panel
Replaced the PowerShell/curl workaround for minting invite codes with a compact admin-only panel inside the existing Review Queue page:
- `renderAdminInvitePanel()` — note + optional email-hint inputs, Create button, result area. Only ever rendered from `renderReview()` when an admin token is present (`${token?renderAdminInvitePanel():''}`) — never reachable from the public account panel.
- `createInviteCodeUI()` — guards on `adminToken()` first (toasts and bails if missing), POSTs to `/api/auth/invite/create` with `adminHeaders()`, renders the returned code + created timestamp into `#adminInviteResult`.
- `copyAdminInviteCode()` — copies the code via `navigator.clipboard` with a toast confirmation.
- Panel copy explicitly states "no email is sent" — manual-code-only, matching current platform capability.

No backend route changes were needed — D-136B's `/api/auth/invite/create` already supported `note`/`emailHint` and admin gating.

---

## Production Confirmed (owner-smoked)

- Admin can create an invite code from the Review Queue admin panel (no PowerShell/curl required).
- A user can redeem that code from the public account panel (code + email + optional display name).
- After redeeming, the account panel shows **VERIFIED** with display name / email / handle.
- No email is sent at any point in this flow — the owner confirmed this is expected, not a bug.
- The anonymous flow (`localUser()`, `/api/session`, claim/truth/evidence/pressure submission, voting, Admin Review actions) continues to work unchanged throughout.

---

## Files Touched Across D-136

| File | Change |
|------|--------|
| `migrations/0010_invite_auth.sql` | D-136B: new gated migration — `users` columns + `invite_codes` table + indexes |
| `src/worker.js` | D-136B: `getMe`, `createInviteCode`, `redeemInviteCode`, `isValidEmail` + 3 new routes |
| `public/index.html` | D-136C: `#who` badge made clickable, `#account-panel` container added |
| `public/app-v10.js` | D-136C: account panel (`loadMe`, `accountPanelHtml`, `redeemInviteUI`, etc.); D-136D: admin invite panel (`renderAdminInvitePanel`, `createInviteCodeUI`, `copyAdminInviteCode`) |
| `public/styles.css` | D-136C: account panel popover styling; D-136D: admin invite panel styling |
| `scripts/hardening-smoke-test.mjs` | D-136B: Section 57 (22 tests); D-136C: Section 58 (16 tests) + 1 D-136B test updated; D-136D: Section 59 (14 tests) + 1 D-136C test rescoped; D-136E: README smoke-count guard extended to accept `655 passed, 0 failed` |
| `docs/API_ENDPOINT_INVENTORY.md` | D-136B: documented `/api/me`, `/api/auth/invite/create`, `/api/auth/invite/redeem` |
| `docs/D136E_INVITE_AUTH_CHECKPOINT.md` | D-136E: this doc |
| `docs/README.md` | D-136E: ⭐ CURRENT pointer + smoke count updated |

**Not changed:** any existing route's behavior or response shape, `is_admin` authorization logic, `localUser()`, `/api/session`, claim/truth/evidence/pressure/review endpoints, `handle` uniqueness (still unenforced, by design).

---

## API Added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/me` | `x-humanx-user` | Returns the current user row (id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at). Omits `is_admin` and admin-token material. |
| `POST` | `/api/auth/invite/create` | `x-humanx-admin` (admin only) | Mints a single-use invite code. Never echoes the admin token. |
| `POST` | `/api/auth/invite/redeem` | `x-humanx-user`, rate-limited | Redeems a code, verifies the current user (email + optional display name), single-use enforced atomically. Never sets `is_admin`. |

---

## Explicit Known Limitations

| Limitation | Detail |
|---|---|
| **`x-humanx-user` is still unsigned and spoofable** | No cookie or session signing exists. Any client can claim any `usr_*` id via the header. This predates D-136 and is not fixed by it — invite verification upgrades whatever identity the header claims, in place. |
| **No cookies** | Identity is entirely client-supplied via header, backed only by `localStorage`. |
| **No magic links** | Redemption requires manually entering a code; there is no email-delivered verification link. |
| **No email sending** | The platform has no Cloudflare Email/SMTP binding. Invite codes must be shared manually by the admin (copy/paste, message, etc.). This is by design for this checkpoint, not a missing feature. |
| **`users.handle` uniqueness is not enforced** | No unique index exists on `handle`. Pre-existing gap, unrelated to invite auth, deliberately deferred to a separate follow-up migration once duplicate handles in existing data are resolved. |

---

## Final Test Baseline

```
node scripts/hardening-smoke-test.mjs       → 655 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed
```

---

## Recommended Next Implementation

**D-137A — My HumanX personal dashboard audit**

Now that verified identity exists (email + display name + handle, backed by `/api/me`), the natural next step is a read-only audit of what it would take to show a user their own owned content in one place: claims, truths, belief snapshots, and recent activity, scoped to their `user_id`. This builds directly on the account panel surface added in D-136C/D and the provenance work from D-135A, without requiring any further auth changes.
