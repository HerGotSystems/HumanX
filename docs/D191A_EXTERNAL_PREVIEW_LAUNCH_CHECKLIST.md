# D-191A — External Preview Launch Checklist

**Date:** 2026-06-28
**HEAD at creation:** `025fa95`
**Baseline:** 1589/24/57
**Audience:** Operators sending invite codes to trusted preview users

Run this checklist before each new batch of preview users receives their invite link.

---

## Quick start

```sh
node scripts/preview-launch-check.mjs
```

This runs all automated checks (22 checks, exit 0 on pass). Complete the manual checklist below after it passes.

---

## Stop / Go Decision Table

| Condition | Action |
|-----------|--------|
| `preview-launch-check.mjs` exits non-zero | **STOP** — fix failing checks before sharing |
| Any P0 manual check fails | **STOP** — fix before sharing |
| Any P1 manual check fails | Judgment call — note the issue, share only if acceptable |
| All checks pass | **GO** — share invite link with preview batch |

---

## Automated Checks

Run `node scripts/preview-launch-check.mjs` and confirm all lines show PASS.

**Automated checks verify:**
- `public/app-v10.js`, `public/index.html`, `public/og-default.png`, `src/worker.js` all exist
- No `D1 live` or `Demo fallback` jargon in user-facing app code
- OG metadata: `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`
- Direct claim URL: `parseDirectClaimPath`, `renderClaimShell`, `/c/` route active
- `copyClaimLink` present
- Review tab hidden by default; `adminToken()` gate in `boot()`
- Anonymous browse messaging present; invite/guest messaging present
- Builder Step 1 invite-aware copy (no "Anyone can submit" contradiction)
- `patchEvidencePanel` invite-aware note present
- README baseline shows `1589 passed, 0 failed`

---

## Manual Browser Checks

Complete these in order after automated checks pass. Mark each with ✓ when verified.

### P0 — Must pass before any invite is sent

| # | Check | How to verify |
|---|-------|---------------|
| M1 | **Deploy** | Latest Worker is deployed (`wrangler deploy` completed without error). Confirm deploy timestamp in Cloudflare dashboard. |
| M2 | **Home — status label** | Open home page. Status chip shows `Live` or `Demo mode`. Must not show `D1 live`, `Demo fallback`, or `Backend unreachable`. |
| M3 | **Home — anonymous browse** | Open home page without any account. Arena tab should be accessible. Claims list loads. No login wall. |
| M4 | **Study — loads without account** | Click a claim in the Arena. Study mode opens. Evidence, Pressure, Tests, Analysis tabs visible. |
| M5 | **Review tab hidden** | Without admin token: Review tab must not appear in the nav. With admin token: Review tab appears and loads the queue. |

### P1 — Should pass before sending invites

| # | Check | How to verify |
|---|-------|---------------|
| M6 | **Vote** | Cast a vote in Study mode. Toast confirms specific choice (e.g. "Vote recorded: Believe."). |
| M7 | **Add evidence (unverified)** | Without invite redemption, add evidence in side panel. Note below "Add to Claim" says guest copy ("Guest contributions are reviewed before appearing. Redeem an invite to track them with your profile."). |
| M8 | **Copy claim link** | Copy link button is visible in Study view. Clicking it copies a `/c/:id` URL to clipboard. Pasting it in browser loads the study. |
| M9 | **Builder Step 1 copy** | Open Claim Builder. Step 1 copy says "Submit a testable claim for review. Redeem your invite…" — must not say "Anyone can submit a claim pseudonymously." |
| M10 | **Builder Step 3 — guest note** | In Builder Step 3 without invite redemption: compact guest note visible below submit buttons. "Submitting as a guest — Redeem invite → to track this with your profile." Clicking "Redeem invite →" opens the account panel. |
| M11 | **Direct claim URL** | Navigate to `/c/<claim-id>` directly. OG shell loads with claim title and description in page `<title>`. SPA auto-opens Study mode for that claim. |

### P2 — Spot-check before sending

| # | Check | How to verify |
|---|-------|---------------|
| M12 | **Public profile** | On a verified account: enable public profile, set a slug, save. Navigate to `/u/<slug>`. Profile page loads. |
| M13 | **Mobile / narrow** | Resize browser to 375px width. Home page, Arena, Study view, and side panel are all usable. Side panel is not completely hidden. |
| M14 | **Admin Review queue** | With admin token in local storage: Review tab appears. Queue loads. Approve/reject controls visible. |
| M15 | **Rate limit sanity** | Attempt to submit the same claim more than 8 times in 1 hour from one IP. Should receive rate limit error on 9th attempt. (Spot-check only — do not attempt to exhaustively test.) |

---

## Social Preview Check

Run once before the first batch, and again if OG metadata or Worker is changed.

| Check | How to verify |
|-------|---------------|
| `/c/:id` Twitter Card | Paste a claim URL into [Twitter Card Validator](https://cards-dev.twitter.com/validator). Confirm preview image and description render. |
| `/u/:slug` Facebook Debug | Paste a public profile URL into [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/). Confirm og:image and og:title render. |
| Root OG | Open root URL in Facebook debugger. Confirm og:image (`og-default.png`) renders. |

---

## Invite / Account Checks

| Check | How to verify |
|-------|---------------|
| Invite redemption flow | Open ◎ account panel → enter a valid invite code → confirm "Verified" status shows. |
| Public profile toggle gated | Unverified user: profile settings shows guest warning before the toggle. |
| Verified user messaging | Verified user adding evidence: side panel note says "After approval, it can affect the public claim, score, and RunPack. Pending items stay private." (not the invite-redemption copy). |
| Test toast (verified vs unverified) | Verified: toast says "Test added — now visible in the Tests section." Unverified: toast appends "Redeem your invite to track this contribution." |

---

## Known Limitations — Tell Preview Users

Include these in your invite message or a brief onboarding note:

1. **Evidence/pressure/claims/truths are review-gated.** Submissions appear in the Review queue and won't be publicly visible until an admin approves them. Tests and analysis appear immediately.
2. **No selected/active state on vote buttons.** After voting, buttons don't visually indicate your choice. Recorded correctly — just a visual gap.
3. **Mobile experience is not fully optimized.** Study mode side panel may be partially below the fold on phones. Usable but not polished.
4. **No self-serve request-access.** Invite codes are distributed directly. There is no waitlist or signup form yet.
5. **No in-app feedback/contact path.** Report bugs or feedback directly to the team (DM, email, etc.).
6. **Anonymous users can submit to the Review queue** even without an invite code — review gating is the protection, not hard auth blocking.
7. **Reports count is not public.** Not shown in the graph stats.

---

## Feedback to Collect from Preview Users

Ask each preview user for:

| Area | Question |
|------|----------|
| First impression | What was the first thing that confused you on the home page? |
| Study mode | Did you understand what evidence, pressure, tests, and analysis do? |
| Invite flow | How clear was the ◎ account invite redemption? Any friction? |
| Claim Builder | Did Step 1–3 feel clear? Where did you slow down? |
| Sharing | Did you try to share a claim? Was copying the link obvious? |
| Mobile | Did you use it on a phone? What broke or felt cramped? |
| Trust | Did anything look unfinished or make you doubt the product was real? |
| Missing | What single thing would make this more useful in your first week? |

---

## Files Changed in D-191A

| File | Change |
|------|--------|
| `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` | This file |
| `scripts/preview-launch-check.mjs` | Automated preflight script (22 checks) |
