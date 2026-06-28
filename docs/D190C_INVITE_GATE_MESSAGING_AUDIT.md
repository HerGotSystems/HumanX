# D-190C — Invite Gate Messaging Audit

**Date:** 2026-06-28
**HEAD at audit:** `bb4ee5c`
**Baseline:** 1578/24/57
**Scope:** Read-only source-code audit. No code changes. `public/app-v10.js`, `src/worker.js` and modules, `public/index.html`.
**Method:** Traced every writable action from frontend call through backend handler.

---

## Context

The home page (`renderHome`) says:

> "You can browse and read public claims without an account. **Submitting, saving, and public profile controls require an invite.** Invite codes are shared directly by members while HumanX is in early access."

This is the correct intent. The audit below checks how well the actual behavior matches this stated promise for each action.

---

## How the identity model works

| Layer | Object | What it means |
|-------|--------|---------------|
| `user` (local) | Always set from `localStorage` | Generated anon user ID, exists for everyone |
| `accountUser` | Loaded async by `loadMe()` | Verified user row from `/api/me`; `null` if unverified |
| `accountUser.verified` | Boolean | `true` only after invite redemption |
| `adminToken()` | `localStorage` string | Admin access; completely separate |

**Critical detail:** `loadMe()` is called in `boot()` as fire-and-forget (`.catch(()=>{})`). This means `accountUser` is `null` during the first render. No frontend action currently reads `accountUser.verified` before proceeding — all actions fire against the backend without checking it first.

**Backend `requireUser`:** Takes any valid `x-humanx-user` header value. It only checks for shadow-banning. It does **not** check `verified` status. Every anon user passes it.

---

## Action-by-Action Matrix

### Browse / Read actions (should remain open to all)

| Action | Frontend gate | Backend gate | Anon OK? | Assessment |
|--------|--------------|--------------|----------|------------|
| Browse Arena (Claims list) | none | none (GET) | ✅ Yes | Correct — browsing must stay open |
| Open claim (Study view) | none | `GET /api/claims/:id` | ✅ Yes | Correct |
| View evidence / pressure / tests / analysis | none | `GET /api/claims/:id` | ✅ Yes | Correct |
| View public profile `/u/:slug` | none | `GET /api/u/:slug` | ✅ Yes | Correct |
| View direct claim URL `/c/:id` | none | Worker renders OG shell | ✅ Yes | Correct |
| Generate RunPack (build packet) | requires `selected` | `POST /api/runpack` — `requireUser` only | ✅ Yes | Acceptable — RunPack is a read action; anon can build |
| Search / filter claims | none | `GET /api/claims` | ✅ Yes | Correct |

### Contribution actions (should require invite per home page promise)

| Action | Frontend gate | Backend gate | Anon currently works? | Gap |
|--------|--------------|--------------|----------------------|-----|
| **Vote** (Believe/Reject/Unsure) | requires `selected` only | `POST /api/claim-vote` — `requireUser` only | ✅ Yes — no invite needed | **Gap:** home says "submitting" requires invite; voting is a submission |
| **Add evidence** (side panel) | requires `selected` only | `POST /api/evidence` — `requireUser` only | ✅ Yes | **Gap:** submitting evidence is a contribution |
| **Add pressure** (side panel) | requires `selected` only | `POST /api/pressure` — `requireUser` only | ✅ Yes | **Gap:** same |
| **Add test** | requires `selected` only | `POST /api/tests` — `requireUser` only | ✅ Yes | **Gap:** same |
| **Save analysis** | requires `selected` only | `POST /api/analysis` — `requireUser` only | ✅ Yes | **Gap:** same |
| **Submit claim** (Builder) | draft length check only | `POST /api/claims` — `requireUser` only, rate 8/hr | ✅ Yes | **Gap:** explicit promise that "submitting requires invite" |
| **Submit truth** (Drift/Builder) | draft length check only | `POST /api/truths` — `requireUser` only, rate 12/hr | ✅ Yes | **Gap:** same category |
| **Report claim** | requires `selected` only | `POST /api/report` — `requireUser` only | ✅ Yes | Minor: report abuse needs some gate |

### Profile / account actions (correctly or partially gated)

| Action | Frontend gate | Backend gate | Anon currently works? | Assessment |
|--------|--------------|--------------|----------------------|------------|
| View My HumanX | none | `GET /api/my-humanx` — `requireUser` | ✅ Yes (empty) | OK — anon sees their own (empty) activity |
| Save profile settings | none | `POST /api/profile-settings` — `requireUser` only | ✅ Yes — anon can set a slug | **Gap:** public profile requires verified per intent; anon can set a slug and toggle public |
| Copy profile link | frontend checks `canCopy = isPublic && !!slug` | n/a | Button disabled unless profile saved | Partially gated — good |
| Redeem invite | none | `POST /api/auth/invite/redeem` | ✅ Yes — this is correct | Correct — this is how you become verified |
| Belief Engine (belief snapshots) | none | `POST /api/belief-snapshot` | ✅ Yes | Acceptable — snapshots are private by default |

---

## Existing Backend Mitigations

All write routes go through Review before affecting public state. This significantly reduces blast radius from anon submissions:

| Route | Review-gated? | Rate limit |
|-------|--------------|-----------|
| `POST /api/claims` | Yes (`review_state='review'`) | 8/hr per IP |
| `POST /api/evidence` | Yes (`review_state='review'`) | 20/hr per IP |
| `POST /api/pressure` | Yes (`review_state='review'`) | 20/hr per IP |
| `POST /api/tests` | Immediately visible (no review) | 20/hr per IP |
| `POST /api/analysis` | Immediately visible (no review) | 20/hr per IP |
| `POST /api/claim-vote` | Vote counts update immediately | 20/hr per IP |
| `POST /api/truths` | Yes (`review_state='review'`) | 12/hr per IP |

**Key insight:** Evidence/pressure/claims/truths are all review-gated. An anon user submitting them fills the Review queue but cannot affect public scores directly. Tests and analysis are the exception — they appear immediately without Review.

---

## Which actions should remain anonymous vs. gated

### Recommended to keep anonymous (no invite gate)

| Action | Reason |
|--------|--------|
| Browse / read all public data | Core product utility; blocking browse destroys external preview value |
| Vote | Votes are public reactions, not submitted content. Low risk. Anon votes already count. Gating votes would kill engagement for preview users who haven't yet redeemed invite |
| Generate RunPack | Read-heavy; just assembles existing public data |
| View My HumanX | Shows own (empty) activity; no public impact |
| Redeem invite | Must remain open — this is how users get verified |
| Belief snapshots | Private by default; low public risk |

### Recommended to add invite-required messaging (soft gate, not hard block)

These are the actions that contradict the home page promise. The recommendation is a **soft frontend message** — not a hard block — because:
1. The backend already gates via Review
2. Preview users who just received an invite code may not have redeemed it yet
3. Hard blocks before invite redemption create dead ends

| Action | Recommended message | Where to show it |
|--------|--------------------|----|
| Submit claim (Builder Step 3) | "You're submitting as a guest. Redeem your invite in ◎ account to associate this with your profile." | Before the submit button in Step 3, if `!accountUser?.verified` |
| Add evidence / pressure | Note below the "Add to Claim" button when unverified | Inline in side panel |
| Add test | Toast or inline note on submit, if unverified | After `addHomeTestUI` succeeds |
| Save analysis | Inline note on save, if unverified | After `saveAnalysisResult` succeeds |
| Save profile settings + enable public | Inline warning if `!accountUser?.verified` | In profile settings section of My HumanX |

---

## What the Claim Builder currently says — mismatch

`renderBuilderStep1()` currently reads:
> `"Anyone can submit a claim pseudonymously."`

This **directly contradicts** the home page which says submitting requires an invite. For an external preview user who reads the home page and then opens the Claim Builder, this creates trust confusion: "I thought I needed an invite? Apparently not?"

The reality (all submissions go to Review, rate-limited, anon-friendly) is actually fine for a preview — but the copy conflict is the problem. One of the two statements needs to change.

**Option A (simplest):** Remove "Anyone can submit" from Builder Step 1. Replace with "Submit a testable claim for review. Goes public after admin approval." — which is accurate and doesn't promise anything about invite requirements.

**Option B:** Add "Submitting as a guest is fine — you don't need an invite to try. Redeem your invite code to associate submissions with your profile." — which is honest and welcoming.

Option B is better for preview UX.

---

## What NOT to change yet

| Item | Reason to defer |
|------|----------------|
| Backend requireVerifiedUser on claim/evidence routes | Adds complexity; Review queue already filters; anon contributions are fine during preview |
| Hard block on vote for anon users | Votes are the most immediate engagement signal; blocking them kills Study mode for new users |
| Hard block on test/analysis for anon | Tests appear immediately; if blocked, anon users see a dead end after reading the Study flow panel |
| Removing evidence side panel for anon | The form is the entry point for the whole contribution loop; hiding it is too aggressive |
| Changing saveProfileSettings backend | Profile settings are meaningful for verified users; anon can set preferences that become active after verification |

---

## Quick-Fix Plan for D-190D

All frontend-only. No backend changes. All soft-gate (informative, not blocking).

### Fix 1 — Claim Builder Step 1: replace "Anyone can submit" with honest invite-aware copy

**File:** `public/app-v10.js`  
**Change:** `"Anyone can submit a claim pseudonymously."` → `"Submit a testable claim for review. Redeem your invite in ◎ account to associate submissions with your profile."`  
**Why:** The current copy directly contradicts the home page. The replacement is accurate and invite-aware without blocking anon flow.

### Fix 2 — Claim Builder Step 3: add guest note below submit button when unverified

**File:** `public/app-v10.js`  
**Change:** In `renderBuilderStep3()`, append a `<p>` note when `!accountUser?.verified`:  
`"Submitting as a guest. <a data-action='toggleAccountPanel'>Redeem your invite →</a> to associate this with your profile."`  
**Implementation note:** Because `accountUser` is loaded async, the check `!!(window.accountUser?.verified)` is safe at render time (will be available by the time the user reaches Step 3).

### Fix 3 — Side panel: add guest note under evidence/pressure "Add to Claim" when unverified

**File:** `public/index.html`  
**Change:** The `evidence-attach-note` paragraph currently says "After approval, it can affect the public claim, score, and RunPack. Pending items stay private." This is honest but says nothing about invite. Add: "Submitting as a guest — redeem your invite code to track your contributions."  
**Alternative:** In `patchEvidencePanel()` or `renderStudy()`, conditionally update the note text based on `accountUser?.verified`.

### Fix 4 — Tests: add a guest note to the test submit success toast when unverified

**File:** `public/app-v10.js`  
**Change:** In `addHomeTestUI()` success path, if `!accountUser?.verified`: toast appends "— redeem your invite to track this contribution."  
**Note:** Tests are immediately visible; the invite note here is especially useful since there's no Review buffer.

### Fix 5 — Profile settings: add inline note when anon tries to enable public profile

**File:** `public/app-v10.js`  
**Change:** In the profile settings section of `renderMeHtml`, if `!accountUser?.verified`, show: "You need to verify your account with an invite code before enabling a public profile."  
**Why:** An anon user enabling a public profile and setting a slug is a dead end — the backend `saveProfileSettings` will save the data but no public profile exists for that user until they verify.

---

## Summary

| | Count |
|---|---|
| Actions correctly open to anon | 7 |
| Actions with invite-copy mismatch (home promise broken) | 5 |
| Actions with immediate public impact (no Review) | 2 (tests, analysis) |
| Backend hard gates on verified | 0 — all routes use `requireUser` only |
| D-190D fixes required | 5 soft-gate copy changes |

The core product loop for an anonymous preview visitor is already functional and safe. The D-190D fixes are purely copy/messaging — ensuring the stated promise on the home page ("submitting requires invite") matches what the UI actually says at the point of action. No hard blocks needed. The Review queue is the real gate.
