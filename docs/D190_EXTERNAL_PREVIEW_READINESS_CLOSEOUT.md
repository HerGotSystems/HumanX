# D-190 — External Preview Readiness Closeout

**Date:** 2026-06-28
**HEAD at closeout:** `7989f0a`
**Baseline at closeout:** 1589/24/57 (+23 tests from D-190B/D)
**Patches:** D-190A (audit) · D-190B (P0 trust fixes) · D-190C (invite-gate audit) · D-190D (soft invite messaging)

---

## Final Readiness Verdict

> **HumanX is ready for 5–20 trusted external preview users. It is not yet ready for public launch or broad social sharing.**

The four-patch D-190 series brought the app from "internal developer tool visible to outsiders" to "coherent invite-only preview product." All P0 trust blockers are resolved. The contribution loop is honest about review gating. The invite/account model is surfaced at every point of action. Unsolicited visitor spam is contained by the Review queue and rate limits.

---

## D-190A — Product Readiness Audit

**Commit:** `dcddca4`
**Scope:** Read-only source-code audit across all 17 user-facing surfaces.

### Audit findings summary

| Severity | Count | Status |
|----------|-------|--------|
| P0 — must fix before any external user | 4 | All fixed in D-190B |
| P1 — fix before wider sharing | 5 | 1 addressed in D-190C/D; 4 tracked as backlog |
| P2 — annoying but usable | 6 | Tracked; none fixed in D-190 series |
| P3 — polish | 7 | Tracked; none fixed in D-190 series |

### Obvious user journey results (pre-fix)

| Journey | Pre-fix result |
|---------|---------------|
| Browse claim | ✅ |
| Open claim (Study) | ✅ |
| Vote | ✅ |
| Add evidence | ✅ (but confusing copy) |
| Submit claim | ⚠️ (copy said "anyone can submit", contradicting home page) |
| Copy claim link | ✅ |
| View public profile | ✅ |

---

## D-190B — P0 Trust Fix Pack

**Commit:** `bb4ee5c`
**Files:** `public/app-v10.js`, `public/index.html`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Tests added:** 12 (Section 104)

### Fixes applied

| Fix | Detail |
|-----|--------|
| **P0-1: Status label** | `'D1 live'` → `'Live'`; `'Demo fallback'` → `'Demo mode'` in both `boot()` status call and `renderHome()` hero statusline. Users no longer see Cloudflare D1 implementation terminology as their first data point. |
| **P0-2: Review tab** | `#tab-review` hidden by default in `index.html` (`style="display:none"`). `boot()` reveals it only when `adminToken()` is non-empty. External visitors no longer see an admin queue tab in the navigation. |
| **P0-3: Example profile link** | Hardcoded `/u/calenhir` link removed from `renderHome()`. Replaced with neutral static sentence: `"Public profiles and claim pages are shareable directly by link."` No stale or unmaintained example profile is exposed. |
| **P0-4: Reports count** | `['Reports', g.reports]` removed from `graphBox()` items array. Visitors no longer see a moderation metric count ("Reports: 3") as a home page stat. Remaining stats: Claims · Evidence · Truths · Links · Votes. |

---

## D-190C — Invite Gate Messaging Audit

**Commit:** `44c4cce`
**Scope:** Read-only. No code changes. Full action-by-action matrix of 15 user-facing actions.

### Key finding

The backend uses `requireUser` (any generated anon user ID passes) on every write route. There is no `requireVerifiedUser` gate anywhere. The home page says "submitting requires an invite" but:

- All write routes accept anon users
- The Claim Builder Step 1 said "Anyone can submit a claim pseudonymously" — directly contradicting the home page
- No action in the frontend checked `accountUser?.verified` before proceeding

The Review queue (all evidence/pressure/claims/truths are review-gated before affecting public scores) and IP rate limits (8–20 requests/hour) are the effective backstops.

### Actions correctly left open to anonymous users

Browse/read all public data · Vote · Generate RunPack · View My HumanX · Redeem invite · Belief snapshots

**Rationale:** Blocking these for anon users would destroy Study mode utility for preview visitors who haven't yet redeemed their invite code.

### Actions with copy mismatch (now fixed in D-190D)

Claim Builder submit · Add evidence/pressure · Add test · Save profile settings with public toggle

---

## D-190D — Soft Invite-Gate Messaging Fixes

**Commit:** `7989f0a`
**Files:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Tests added:** 11 (Section 105)

### Five soft-gate fixes

All fixes are **informative, not blocking**. The Review queue remains the real gate.

#### Fix 1 — Builder Step 1 copy

**Before:** `"Anyone can submit a claim pseudonymously. HumanX turns it into a testable public study after review."`

**After:** `"Submit a testable claim for review. Redeem your invite in ◎ account to associate submissions with your profile. HumanX turns it into a testable public study after review."`

Removes the direct contradiction with the home page promise.

#### Fix 2 — Builder Step 3 guest note

When `!accountUser?.verified`, a compact note appears below the submit buttons:

`"Submitting as a guest — [Redeem invite →] to track this with your profile."`

The button uses `data-action="toggleAccountPanel"` (per D-181B migration rule — no inline `onclick`). Clicking it opens the account/invite panel directly.

#### Fix 3 — Side panel evidence/pressure note

`patchEvidencePanel()` now sets `evidence-attach-note` text conditionally on each Study render:

- **Verified:** `"After approval, it can affect the public claim, score, and RunPack. Pending items stay private."`
- **Unverified:** `"Guest contributions are reviewed before appearing. Redeem an invite to track them with your profile."`

The note is restored to its original content after the 4-second next-action hint timer (D-189C) expires via the `_guestNoteActive` guard check.

#### Fix 4 — Test submit toast (unverified)

`addHomeTestUI()` success path now branches on `accountUser?.verified`:

- **Verified:** `"Test added — now visible in the Tests section."`
- **Unverified:** `"Test added — now visible in the Tests section. Redeem your invite to track this contribution."`

Tests are immediately visible without Review — this surface is the most important to flag for unverified users.

#### Fix 5 — Profile settings warning

`meProfileSettingsHtml()` prepends a guest note when `!accountUser?.verified`:

`"Verify your account with an invite code before enabling a public profile. Use ◎ account in the header to redeem your invite."`

Displayed above the profile toggle. Does not block the toggle interaction.

---

## What Is Now Fixed (Post D-190 Series)

| Issue | Pre-D-190 | Post-D-190 |
|-------|-----------|------------|
| Developer DB jargon in header/statusline | `D1 live` / `Demo fallback` visible | `Live` / `Demo mode` |
| Admin Review tab in nav | Always visible to all users | Hidden; shown only to admins |
| Stale hardcoded example profile | `/u/calenhir` linked from hero | Removed; replaced with neutral text |
| Moderation metric in public stats | `Reports: N` in home graph box | Removed |
| Builder copy contradicting home page | `"Anyone can submit"` | `"Submit a testable claim for review. Redeem your invite..."` |
| Builder Step 3 — no invite reminder | Silent submit for anon users | Guest note with invite CTA when unverified |
| Side panel — no invite context | Same note for all users | Conditional: approval copy (verified) vs. invite prompt (guest) |
| Test submit — no invite context | Same toast for all users | Guest toast includes invite reminder |
| Profile settings — no invite warning | Toggle available with no gate | Warning shown to unverified users |

---

## Remaining Before Public Launch

These are not blocking for a 5–20 person trusted preview. They become important before open access.

### Must address before open / viral sharing

| Item | Why it matters |
|------|---------------|
| **Real invite / request-access path** | Currently invite codes are shared manually by members. There is no self-serve "request access" form or waitlist. Open sharing will generate demand with no way to respond. |
| **Social preview debugger pass** | Run `/c/:id` and `/u/:slug` URLs through Twitter Card Validator and Facebook Debugger to confirm OG preview images render correctly before social sharing begins. |
| **Public feedback / contact path** | External users who hit bugs or have questions have no way to reach the team except direct message. A feedback form or support email is needed before public launch. |

### Should address before open access

| Item | Notes |
|------|-------|
| **Stronger account gating (if required)** | If anon-submit spam becomes an issue despite Review queue, consider adding `requireVerifiedUser` to `createClaim` and `addEvidence` routes. Currently deferred — Review queue is sufficient for preview scale. |
| **Full mobile device QA** | CSS responsive rules exist (26 media queries, breakpoints at 400/480/500/600/640/700/900px) but Study mode contribution form (side panel) is below the fold on phones. Not tested on physical devices. |
| **Vote active state** | Vote buttons have no selected/active visual after voting. Users can't tell which option they last chose. (P2-1 from D-190A.) |
| **Drift / Truths / Evidence Vault empty states** | Drift and Truths tabs have weak onboarding for first-time users with no existing content. (P1-4, P1-5 from D-190A.) |

### Low priority / polish

| Item | Notes |
|------|-------|
| Favicon | No favicon set; default browser icon. |
| RunPack CTA copy | `"Done adding evidence and pressure?"` should include tests. |
| Vote count labels on cards | Raw integers with no label (3 believe, 1 reject) need inline context. |
| Claim type descriptions in Builder | Type dropdown has no inline descriptions. |

---

## Files Changed Across D-190

| File | Patches |
|------|---------|
| `public/app-v10.js` | D-190B (P0-1, P0-2, P0-4) · D-190D (5 messaging fixes) |
| `public/index.html` | D-190B (P0-2 Review tab default-hidden) |
| `scripts/hardening-smoke-test.mjs` | D-190B Section 104 (12 tests) · D-190D Section 105 (11 tests) · legacy test updates |
| `docs/D190A_PRODUCT_READINESS_AUDIT.md` | D-190A |
| `docs/D190C_INVITE_GATE_MESSAGING_AUDIT.md` | D-190C |
| `docs/D190_EXTERNAL_PREVIEW_READINESS_CLOSEOUT.md` | This file (D-190E) |
| `docs/README.md` | Updated each patch |
