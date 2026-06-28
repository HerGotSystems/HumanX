# D-195A — Preview Deployment / Production Sanity Checklist

**Date:** 2026-06-28
**HEAD at creation:** `65e79a8`
**Baseline:** 1589/24/57
**Worker name:** `humanx`
**Production URL:** https://humanx.veltrusky-michal.workers.dev
**D1 database:** `humanx` (binding: `DB`, ID: `f68709d8-b93a-4e5b-8a0e-5b58cc357125`)

Run this checklist immediately before sending invite codes to any new user batch. Takes 10–15 minutes end to end.

---

## Security Reminders — Read First

> **Never paste, share, or echo these in any chat, email, terminal screenshot, or log:**
> - `HUMANX_ADMIN_TOKEN` — the admin token value
> - `HUMANX_OWNER_SECRET` — the owner secret value
> - Raw request headers containing `x-humanx-admin` or `x-humanx-owner`
> - The contents of your `.env` file or Cloudflare Worker secrets panel
>
> The admin token is stored in your browser's `localStorage` under `humanx_admin_token_v1`. It should never appear in screenshots you share with preview users.

---

## Phase 1 — Local Source Checks (Terminal)

Run these from the repo root.

### Step 1: Pull latest

```sh
git pull origin main
git log --oneline -3
```

Confirm HEAD matches the latest commit. The most recent commit should be a known D-series patch, not an in-progress change.

### Step 2: Run automated preflight

```sh
node scripts/preview-launch-check.mjs
```

**Expected:** `All automated checks passed.` (22/22, exit 0)

If any check fails: fix it before proceeding. Do not send invites with a failing preflight.

### Step 3: Check smoke test baseline (only if you changed code since last push)

```sh
node scripts/hardening-smoke-test.mjs
```

**Expected:** `1589 passed, 0 failed`

Skip this step if no code has changed since the last verified push. The preflight script already checks that the README baseline matches `1589 passed, 0 failed`.

### Step 4: Syntax check (only if app-v10.js was touched)

```sh
node --check public/app-v10.js
```

**Expected:** No output, exit 0.

---

## Phase 2 — Deploy (Only If Code Changed)

Only run `wrangler deploy` if `public/app-v10.js`, `public/index.html`, or `src/worker.js` changed since the last deploy. Do not deploy speculatively.

```sh
npx wrangler deploy
```

**Expected output includes:**
- `Uploaded humanx` (or similar success line)
- No `Error` or `Failed` lines
- A deploy URL ending in `workers.dev`

After deploy, wait ~10 seconds for propagation before running browser checks.

**If deploy fails:**

| Symptom | Likely cause | Action |
|---------|-------------|--------|
| `Authentication error` | Wrangler not logged in | Run `npx wrangler login` |
| `D1 database not found` | Wrong account context | Check `wrangler whoami` — must be the correct Cloudflare account |
| `Script too large` | `app-v10.js` exceeded Worker size limit | Check file size: `dir public\app-v10.js` |
| `Error: failed to upload` | Network / Cloudflare API issue | Retry once; check status.cloudflare.com |
| Any other error | Unknown | Do not send invites. Investigate before proceeding. |

---

## Phase 3 — Manual Browser Checks

Open an incognito / private window. No admin token, no invite redeemed. Verify each step.

### 3A. Home page loads cleanly

Navigate to: `https://humanx.veltrusky-michal.workers.dev`

| Check | Expected | Pass? |
|-------|---------|-------|
| Page loads | No blank screen, no 500 error | |
| Status chip | Shows `Live` or `Demo mode` — NOT `D1 live`, `Demo fallback`, or `Backend unreachable` | |
| Review tab | Not visible in nav (hidden from non-admin visitors) | |
| No broken layout | Page renders without obvious CSS failure | |

**If status shows `Backend unreachable`:** Backend D1 health check is failing. Do not send invites. Check Cloudflare dashboard for Worker errors.

### 3B. Arena / Claims list loads

Click "Arena" tab or wait for default load.

| Check | Expected |
|-------|---------|
| Claims list renders | At least one claim visible |
| No JS error toast | No red error toast on screen |

### 3C. Open a claim — Study mode

Click any claim card to open Study mode.

| Check | Expected |
|-------|---------|
| Study view loads | Claim text, score meters, tabs visible |
| Evidence tab | Opens without error |
| Copy link button | Visible in Study view |

### 3D. Copy claim link

In Study mode, click "Copy link".

| Check | Expected |
|-------|---------|
| Button changes to "Copied!" | Clipboard write succeeded (or fallback) |
| Pasting gives a `/c/:id` URL | URL format: `https://humanx.veltrusky-michal.workers.dev/c/<claim-id>` |

### 3E. Direct claim URL (`/c/:id`)

Open the copied `/c/:id` URL in a new tab.

| Check | Expected |
|-------|---------|
| Page loads | Not a 404 or blank page |
| `<title>` shows claim text | View page source — title contains the claim text, not just "HumanX" |
| Study mode auto-opens | SPA opens and loads the specific claim in Study mode |

**If `/c/:id` returns 404 or blank:**
- Worker may not have deployed successfully
- Check Cloudflare dashboard → Workers → humanx → request log
- Do not send invites if direct claim URLs are broken — they are in the invite pack

### 3F. Public profile (if a verified account exists)

If you have a verified account with a public profile enabled:

Navigate to: `https://humanx.veltrusky-michal.workers.dev/u/<your-slug>`

| Check | Expected |
|-------|---------|
| Profile page loads | Display name, bio visible |
| Claim rows visible | At least one public claim listed |
| Copy link buttons work | `/c/:id` URLs copy correctly |

Skip this step if no public profile exists.

### 3G. Review queue with admin token

Open a new incognito window. Navigate to the app. Click the Review tab (it won't be visible — see note).

Actually: load the admin token first.

1. Click ◎ account panel — do not enter invite code here
2. Navigate to Review tab — if not visible, open browser console and set:
   ```js
   localStorage.setItem('humanx_admin_token_v1', '<your-admin-token>');
   location.reload();
   ```
3. Review tab should now appear
4. Click "Load Queue"

| Check | Expected |
|-------|---------|
| Review tab appears after token set | Yes |
| Queue loads | Shows pending items or empty state — no error |
| No 403 error | Token is valid |
| Approve/Reject buttons visible | Yes |

**If Review returns 403:** Admin token is wrong or not set. Re-enter it.

**If Review tab never appears after setting the token:** `adminToken()` function not reading `humanx_admin_token_v1` from localStorage — check if a deploy has the correct boot code.

> ⚠ Never paste your admin token in a screenshot. Never share it with preview users. If you think it has been exposed, rotate it in the Cloudflare dashboard (Workers → humanx → Settings → Variables and Secrets → `HUMANX_ADMIN_TOKEN`).

### 3H. Mobile / narrow screen spot-check

Resize your browser window to approximately 375px wide (or use browser DevTools device emulation).

| Check | Expected |
|-------|---------|
| Home page usable | No horizontal overflow, readable |
| Arena list usable | Claims visible, tap targets reasonable |
| Study mode usable | Study view loads; side panel accessible (may require scrolling) |

Known limitation: Study mode side panel may be partially below fold on small phones. This is a known P2 — disclose to preview users.

---

## Phase 4 — Go / No-Go Decision Table

| Condition | Decision |
|-----------|----------|
| `preview-launch-check.mjs` — any FAIL | **NO-GO** |
| Deploy failed and code changed since last deploy | **NO-GO** |
| Home shows `Backend unreachable` | **NO-GO** |
| Review queue returns 403 with correct token | **NO-GO** |
| `/c/:id` URL returns 404 | **NO-GO** |
| Admin token has been exposed (in screenshot, chat, etc.) | **NO-GO** — rotate token first, then re-run checklist |
| `preview-launch-check.mjs` — all 22 PASS | Proceed to manual checks |
| All manual checks pass | **GO** — send invites |
| Mobile check shows minor layout issues (known P2) | **GO with disclosure** — tell users about mobile limitations |
| Public profile check skipped (no profile exists) | **GO** — not required for first wave |

---

## Phase 5 — Immediately After Sending Invites

Within the first 48 hours:

1. **Open Review queue** — check for first submissions from preview users
2. **Watch for any backend error spike** — Cloudflare dashboard → Workers → humanx → Metrics
3. **Check debug-state counters** as baseline:
   ```
   GET https://humanx.veltrusky-michal.workers.dev/api/debug-state
   (requires admin token in header: x-humanx-admin: <token>)
   ```
   Note: `claimVotes`, `home_tests`, `aip_packets` values at T=0 so you can track deltas.

---

## Safe Failure Handling Reference

| Failure | Safe response |
|---------|--------------|
| Deploy error | Do not send invites. Investigate. Try `npx wrangler deploy` again once. |
| `Backend unreachable` status | Do not send invites. Check Cloudflare Workers health. |
| Review 403 | Re-enter admin token. Do not share the token to diagnose. |
| `/c/:id` 404 | Check Worker deploy. Test with a known claim ID. Don't send invites. |
| Admin token exposed | Rotate immediately in Cloudflare dashboard before anything else. Update `localStorage` on your device. |
| Owner secret exposed | Rotate immediately. This affects owner token validation. |
| `preview-launch-check.mjs` FAIL on "No D1 live in app" | `setStatus` still uses old string — revert to last known-good commit. |
| Smoke test failure after code change | Do not deploy. Fix the failing test or revert the change. |

---

## Quick Reference: Production Identifiers

| Item | Value |
|------|-------|
| Worker name | `humanx` |
| Production URL | `https://humanx.veltrusky-michal.workers.dev` |
| D1 database name | `humanx` |
| D1 database ID | `f68709d8-b93a-4e5b-8a0e-5b58cc357125` |
| D1 binding | `DB` |
| Admin token localStorage key | `humanx_admin_token_v1` |
| Preflight script | `node scripts/preview-launch-check.mjs` |
| Smoke test script | `node scripts/hardening-smoke-test.mjs` |
| Expected baseline | `1589 passed, 0 failed` |

---

## Related Docs

| Doc | Purpose |
|-----|---------|
| `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` | Full launch checklist including invite flow and social preview |
| `docs/D191B_PREVIEW_USER_INVITE_PACK.md` | Invite messages to send to users |
| `docs/D191C_PREVIEW_OPERATOR_RUNBOOK.md` | Full operator lifecycle — daily routine, bug triage, expansion decisions |
| `docs/D194A_PREVIEW_MODERATION_PRESSURE_AUDIT.md` | Moderation capacity, risk scenarios, shadow-ban procedure |
