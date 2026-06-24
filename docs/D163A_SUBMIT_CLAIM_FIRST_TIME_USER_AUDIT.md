# D-163A — Submit Claim First-Time User Audit

**Date:** 2026-06-24
**Scope:** Docs only. Audit and recommendations for D-163B. No code change in this patch.

---

## Current Behaviour Summary

### Entry path

From home: "Submit Claim" card (third, after Browse Claims and Belief Engine):
> "Submit one precise, pressure-testable public statement. Pseudonymous. Enters moderation before going live."
> When: you have a belief or truth ready to test publicly.

Clicking it calls `setMode('submit')` → `renderSubmit()` → initialises `_bs` (builder state, step 1 if unset) → renders `renderBuilderStep1()`.

### Claim Builder flow (3 steps)

**Step 1 — Raw Thought:**
- Step indicator: `1 · Raw Thought | 2 · Make It Testable | 3 · Final Claim`
- Heading: "Claim Builder"
- Note: "Scores reflect submitted evidence — not an automatic verdict."
- Instruction: "Write the thought, belief, suspicion, rant, or pattern exactly as it is. HumanX will help sharpen it before Review."
- Fields: Your raw thought (textarea) / Why do you think this? / Where does this apply? / What would change your mind?
- Live flags: `builderLiveFlags()` renders coloured badge-style flags as the user types (too short, personal belief, normative, emotional, causal, testable, etc.)
- CTA: "Make it testable →"
- Footer note: "Nothing is sent until Step 3."

**Step 2 — Make It Testable:**
- Shows original text in a blockquote
- Shows all builder flags (coloured badges with guidance)
- Shows route verdict: "looks like a Truth" (yellow badge) or "looks testable" (green badge)
- If Truth route: "Save as Truth for Review" button offered
- Fields: Draft claim (auto-populated from raw text, editable) / Scope / Falsifier / Category chips / Claim type select with hint
- CTA: "Continue to final claim →"
- Footer note: "Not submitted yet."

**Step 3 — Final Claim:**
- Summary table: CLAIM / ORIGINAL / WHY / SCOPE / FALSIFIER / FLAGS / DECISION
- Decision badge: "Submit as Claim for Review" (or Truth route alternatives)
- Decision note (claim route): "Enters admin Review before going public. Not visible until approved."
- Decision note (truth route): "Truth route records the original assertion for Review. It does not verify it as fact."
- Actions: "← Back" + "Submit Claim for Review" (+ "Save as Truth for Review" if truth route)

### API: `POST /api/claims`

- Requires `requireUser(request, env)` — reads `x-humanx-user` header
- **No invite/verified gate** — anonymous (pseudonymous) users can submit
- `ensureUser()` creates an anonymous row (`anon-{id}` handle) if the user ID is not in the DB yet
- Rate-limited: 8 claims/hr/IP
- Inserted with `review_state = 'review'` — **never public on submission**
- Duplicate detection via `normalized_claim` (meaning-key match) — returns existing if same claim already exists
- Initial evidence stored as `'testimony'` type (the builder context summary)
- No admin fields set; `is_admin` is never touched

### Success states

- **New claim:** "Claim submitted for Review. It will appear publicly after approval." (toast) + success panel with "Study this claim", "Build another claim", "Browse Claims" buttons
- **Existing claim:** "This claim already exists." (toast) + existing claim panel with "Study existing claim" button
- **Near duplicate (old path, `saveClaim()`):** "Submitted for Review. A similar claim may already exist." — note: this is via the old `saveClaim()` path, not the builder; builder uses `submitBuilderClaim()`

### Error/validation states

- Empty / too-short raw thought: `toast('Add your raw thought before continuing.')` — on Step 1 Next
- Empty / too-short draft: `toast('Write a draft claim before continuing.')` — on Step 2 Next
- Too-short claim on submit: API returns `CLAIM_TOO_SHORT` → `toast('Claim is too short. Add a little more detail before submitting.')`
- Rate limited: API returns `RATE_LIMITED` → `toast('Too many submissions. Try again in about an hour.')`
- Generic: `toast(e.message || 'Claim submission failed.')`

### Anonymous vs verified submission

**Both are allowed.** `requireUser` only requires a pseudonymous `x-humanx-user` header (from `ensureSession()`). Whether the user has redeemed an invite code or not makes no difference to claim submission. The handle stored is `anon-{id}` for unverified users, or the user's chosen handle if verified.

---

## 1. Visitor 5-Second Read

After opening Submit Claim, within 5 seconds a first-time user reads:
1. Step indicator: "1 · Raw Thought | 2 · Make It Testable | 3 · Final Claim"
2. "Claim Builder" (heading)
3. "Scores reflect submitted evidence — not an automatic verdict."
4. "Write the thought, belief, suspicion, rant, or pattern exactly as it is. HumanX will help sharpen it before Review."

**What they understand:** There is a multi-step form, they should write their raw thought, and there is a review process.

**What they still do not understand:**
- What HumanX will "help sharpen" means — the live flags and draft improvement in Step 2 is not previewed from Step 1
- Whether they need an account or invite to submit (they don't, but no copy says so)
- What "Review" means — who reviews? how long? what criteria?
- Whether they are anonymous at this point

---

## 2. Does the Form Explain What a Good Claim Is?

**Yes, better than most HumanX forms.** The builder:
- Gives a concrete example in the raw thought placeholder: "e.g. 'The media always lies about vaccines'"
- Provides live flag feedback (too short, personal belief, emotional, normative, causal, etc.) as the user types
- Automatically routes between Truth and Claim based on claim shape
- Provides a falsifier field with example: "e.g. 'A meta-analysis showing no drop'"
- Step 2 shows the `CLAIM_TYPE_HINTS` per-type description

The Step 1 instruction "Write the thought, belief, suspicion, rant, or pattern exactly as it is" is excellent — it lowers the barrier correctly.

**Minor gap:** no upfront example of what a *good final claim* looks like. The flags tell users what's wrong, but no example shows the target.

---

## 3. Does the User Understand Submitted Claims Are Reviewed?

**Partially — but in the right places.**

- Home card: "Enters moderation before going live." ✓
- Step 1 footer: "Nothing is sent until Step 3." ✓ (but does not mention review)
- Step 2 footer: "Not submitted yet." ✓
- Step 3: "Enters admin Review before going public. Not visible until approved." ✓
- Success panel: "Your claim is now in the moderation queue and is not yet public. It will appear publicly after an admin approves it." ✓

The Step 3 and success copy is clear. The Step 1 experience gives no review signal — a user who abandons after Step 1 has not seen review copy. This is acceptable since nothing is sent.

---

## 4. Is It Clear Whether Invite/Access Is Required?

**No — and that is a gap.** The builder has no copy explaining that anyone (including anonymous visitors without an invite code) can submit. A first-time visitor seeing the home badge "invite-only preview" may incorrectly assume submit requires an account.

This matters because anonymous submission is intentional — it lowers the contribution barrier. But there is no copy communicating this.

---

## 5. Is Anonymous Submission Allowed Intentionally?

**Yes.** `requireUser` accepts any `x-humanx-user` header — it is the pseudonymous identity created by `ensureSession()` on first page load. No invite redemption required. The handle is `anon-{id}` until the user verifies.

The sidebar `helperText()` for submit mode says: "A claim is a precise, testable public statement. Scores reflect what evidence has been submitted — not an automatic verdict. New claims enter Review before becoming public." — no mention of anonymity.

The home card does say "Pseudonymous." — this is present but easy to miss.

---

## 6. Are Validation Errors Friendly?

**Yes.** All three validation paths (too-short raw, too-short draft, API CLAIM_TOO_SHORT, RATE_LIMITED) produce friendly toast messages. The live flag system provides proactive guidance before the user even clicks Next.

**One minor issue:** the Step 1 Next button fires `builderNext(1)` which checks `raw.length < 5` — the minimum is 5 characters. A 5-character "thought" would pass Step 1 but likely fail Step 3 validation. No copy tells users the minimum threshold.

---

## 7. Is the Success State Clear About What Happens Next?

**Yes — the best-written state in the flow.** Success panel says:
> "Your claim is now in the moderation queue and is not yet public. It will appear publicly after an admin approves it."

Three clear next actions are offered: Study this claim / Build another claim / Browse Claims.

**One gap:** no time expectation is set ("typically reviewed within X days"). Not blocking, but would reduce follow-up confusion.

---

## 8. Are Private/Admin/Internal Fields Exposed?

**No.** Confirmed:
- `submitBuilderClaim()` sends: `claim`, `category`, `type`, `initialEvidence` (builder context as text), `claim_builder` payload
- `builderPayload()` returns: `route`, `rawText`, `why`, `scope`, `falsifier`, `draftClaim`, `finalClaim`, `category`, `claimType`, `systemFlags` — no user ID, email, token
- Success panel uses `mapClaim(existing)` — only public fields
- No `is_admin`, `email`, `owner_token`, or `invite_code` field is touched anywhere in the submit flow

---

## 9. Is the Route Safe from Open-Signup Confusion?

**Yes.** `/api/claims POST` is not a signup route — it requires an existing pseudonymous identity. `ensureUser()` creates a minimal anonymous row if not present, but this is not account creation in any meaningful sense. The invite/verify flow is separate. No `email`, `verified`, or `is_admin` fields are set by claim submission.

---

## Biggest Friction Points

1. **No "anyone can submit" copy** — visitors who see "invite-only preview" on the home badge may think they need an account to submit. No copy in the builder clarifies that pseudonymous submission is open to all visitors.

2. **"Claim Builder" heading is generic** — does not explain the three-step process intent or what the output is. A subtitle "Turn a thought into a pressure-testable public claim" would orient users immediately.

3. **Step 1 has no review signal** — "Nothing is sent until Step 3" is good, but no copy in Step 1 explains that once submitted it enters admin review. Users who see the moderation copy only at Step 3 might feel surprised by the review state.

4. **No time expectation in success state** — the success panel is clear but sets no expectation for when the claim will be reviewed.

5. **"Save as Truth for Review" button** in the Truth route is somewhat opaque — what is a Truth? What is the difference between a Truth and a Claim? No inline explanation at the point where this decision is made.

---

## Privacy / Public Boundary Verdict

**Clean.** The submit flow uses only pseudonymous identity. `review_state = 'review'` on insert ensures no submitted claim ever appears publicly before admin approval. No private fields are rendered. `mapClaim()` is used for success state display. The builder context (raw thought, why, scope, falsifier) is stored as initial evidence (testimony type) — it is not rendered anywhere on public pages.

---

## Recommended D-163B Implementation Plan

**Goal:** Close the "do I need an account to submit?" gap and make the Step 1 experience self-orienting for a first-time visitor. No backend changes.

### 1. Add a subtitle below "Claim Builder" in Step 1

```
Before: <h2>Claim Builder</h2>
After:  <h2>Claim Builder</h2>
        <p class="small builder-intro">Turn a thought into a public, pressure-testable claim. Pseudonymous — no account required. Enters admin review before going public.</p>
```

This closes the "invite-only" confusion, explains the output, and previews the review step all in one line.

### 2. Add "What's the difference?" inline note near "Save as Truth for Review" button in Step 2 (Truth route)

Near the "Save as Truth for Review" button:
```
<p class="small builder-truth-vs-claim">A Truth records a widely-repeated belief. A Claim is a testable statement that can accumulate evidence and a verdict.</p>
```

### 3. Add a brief review timeline note to the success panel

Change the existing review note (already good) to add:
```
…It will appear publicly after an admin approves it. Review is typically done within a few days.
```

This is a copy-only addition to `submitBuilderClaim()` success state.

### 4. Add review mention to Step 1 footer note

Change:
```
"Nothing is sent until Step 3."
```
To:
```
"Nothing is sent until Step 3. All submissions enter admin review before appearing publicly."
```

### What NOT to Change

- Three-step builder structure — already good
- Live flag system — already excellent
- Truth/Claim routing logic — correct
- `requireUser` gate — pseudonymous-only, correctly open
- Rate limit (8/hr) — correct
- `review_state = 'review'` on insert — must never change
- `ensureUser()` anonymous row creation — correct
- Any invite/verify/admin route
- Owner-token — frozen (D-149H)

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-163B plan.
