# D-295A — My HumanX "Needs Attention" Product Pass

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3424 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-295A:** `80877ec` (D-294A)
**Files changed:** `docs/D295A_MY_HUMANX_NEEDS_ATTENTION_PRODUCT_PASS.md`, `docs/README.md`

---

## Purpose

Audit whether My HumanX needs a small top-level "Needs attention" strip for ordinary owners, using only data already returned by `GET /api/my-humanx`. No implementation.

---

## Product Pass — 18 Questions

### 1. What data does `GET /api/my-humanx` currently provide that could support an attention strip?

The response already contains everything needed:

| Field | Location in response |
|-------|---------------------|
| `user.profile_public` (bool) | `user` object |
| `user.profile_slug` (string or null) | `user` object |
| `user.profile_bio` (string or null) | `user` object |
| Per-state counts for Claims, Truths, Evidence, Pressure | `counts.truths`, `counts.claims`, etc. — each is an object keyed by `review_state` (`public`, `review`, `rejected`, `archived`, `duplicate`) |
| Recent truths rows with `review_state` | `truths[]` array (up to 20 rows, each has `review_state`) |
| Recent claims rows | `claims[]` array |

The `counts` objects returned by `userContentCounts()` are broken down by `review_state`, so `counts.truths.review` is the pending-Review Truth count and `counts.truths.public` is the approved public Truth count — both directly available without any backend change.

### 2. Can My HumanX already know the following — without any backend/API change?

| Signal | Available now? | Source |
|--------|---------------|--------|
| Pending Review Truth count | **Yes** | `counts.truths.review` (integer) |
| Recent Claims count | **Yes** | `claims[].length` or `counts.claims.*` |
| Public/approved Truth count | **Yes** | `counts.truths.public` (integer) |
| Profile slug missing | **Yes** | `user.profile_slug` is null or `''` |
| Profile bio missing | **Yes** | `user.profile_bio` is null or `''` |
| Profile visibility state | **Yes** | `user.profile_public` boolean |

All four signals are already in the payload. No backend change required.

### 3. Would an attention strip help ordinary owners understand what matters next?

**Conditionally yes — but only for two specific moments:**

1. **Immediately after first Truth submission:** The owner lands on My HumanX, sees the yellow `Review` badge and the "Review: awaiting admin approval" explanation (D-291B). A redundant strip above would not add information — the Truths panel already tells the full story.

2. **First-time owner with no public profile yet:** If `profile_public` is false and `profile_slug` is null, a brief nudge above the fold could help orient a new owner who doesn't yet know the Profile Settings panel exists. This is the one moment where a visible prompt adds value that the existing layout does not cover.

For a returning owner with an established profile and active truths, a persistent strip adds noise without value. The My Content counts already show the state breakdown.

### 4. What should the strip say after a Truth submission?

Nothing new. The post-submit state is already fully covered:
- The yellow `Review` badge on each Truth row
- The "Review: awaiting admin approval — goes Public when approved." paragraph in the Recent Truths panel (D-291B)
- The post-submit toast ("Submitted for Review — you can see it in My HumanX with the Review badge.") from D-285B

Adding a strip that repeats "you have N pending Review Truths" would be redundant with the counts panel and the badge. It should say nothing extra here.

### 5. Should it include pending Review count?

**No.** The My Content counts panel already shows `Review: N` as a badge chip directly below `Truths`. Repeating this in a strip above would duplicate the signal one screen-height higher with no new information.

### 6. Should it include profile-public/private status?

**Conditionally.** The only genuinely useful case is a one-time nudge when `profile_public === false && !profile_slug`. This surfaces a setup task the owner may not have noticed. It does not need to say anything for owners who have already configured a profile.

### 7. Should it include claim/truth counts?

**No.** My Content counts panel already shows per-state chips for all four content types. Duplicating any subset of this in a strip above adds clutter with no new information.

### 8. Would the strip duplicate existing My Content counts?

**Yes, for any count-based signal.** The My Content panel (immediately below Profile Settings) already renders `Claims: Public N · Review N · ...` and `Truths: Public N · Review N · ...` as badge chips. A strip that says "You have 2 pending Review Truths" is strictly a subset of what is already visible one panel lower.

### 9. Could the useful version be frontend-only?

**Yes.** The one genuinely new signal — "your profile is not yet public and has no slug" — can be derived entirely from `user.profile_public` and `user.profile_slug`, both already in the `GET /api/my-humanx` response. No backend change needed.

### 10. Would any useful version require backend/API changes?

**No.** Every signal that could go in a useful strip is already in the response payload. Pending Review Truth count, public Truth count, profile slug/bio/public state — all present.

### 11. Where should it appear if implemented?

Immediately below the section head (`<h2>My HumanX</h2>`) and the privacy intro paragraph, above the Account card. This is the topmost visible position on the page, making it a true "you have something to do" banner rather than information buried mid-scroll.

### 12. Should it be above or below the Account card?

**Above** the Account card. A nudge that asks the owner to take action (set up their profile) should appear before the read-only identity display, not after it.

### 13. Should it be above or below the Profile Settings panel?

**Above** Profile Settings. The strip's purpose is to surface the existence of Profile Settings to an owner who has not yet opened it. Placing it after the thing it is pointing to defeats the purpose.

### 14. Should it be above or below the filter bar?

**Above** — well above the filter bar. The filter bar and Recent Truths panel are content-navigation elements. An attention strip is a setup-guidance element. These should be separate zones. Placing the strip above the Account card keeps the zones clean.

### 15. What is the smallest useful D-295B candidate?

A **conditional, dismissible profile-setup nudge** rendered by `renderMeHtml()` using data already in `meData`:

- Condition: `!data.user.profile_public && !data.user.profile_slug`
- Copy: `"Your profile is private and has no public link yet. Open Profile Settings below to set a slug and make it public."`
- Placement: between the privacy intro paragraph and the Account card (topmost panel slot)
- Implementation: a single `if`-branch in the `renderMeHtml()` template string, conditional on the two already-available fields
- No JS, no CSS additions, no backend change, no new API field
- Dismissible via `<details>` (same pattern as Profile Settings) or just a permanent conditional — no dismiss state needed since the condition self-clears when the owner sets a slug and makes the profile public

This is a **single-line template addition** to `renderMeHtml()`, analogous in size to the D-291B Review explanation line.

One regression test: "profile-setup nudge appears when profile_public is false and profile_slug is missing."
One regression test: "profile-setup nudge does not appear when profile_public is true."
One regression test: "profile-setup nudge does not appear when profile_slug is set."

Baseline impact: +3 tests → 3427.

### 16. D-295B classification

**Frontend-only.** No backend, no schema, no API, no migration. Touches only `public/app-v10.js` (`renderMeHtml()`) and `scripts/hardening-smoke-test.mjs` (3 new tests).

### 17. Preferred candidate

The profile-setup nudge (Q15) is the clear candidate. It surfaces a setup task the owner may have missed, self-clears once the profile is configured, requires zero backend work, and does not duplicate any existing panel content. It is smaller than D-293B and lower risk.

All other potential strip content (pending Review count, claim counts, public Truth count) would duplicate the My Content counts panel and should not be added.

### 18. Would it add clutter rather than value?

For the profile-setup nudge: **No.** The condition is narrow (private profile, no slug). The copy is short and action-oriented. It self-clears. Owners who have already set up a profile never see it.

For any count-based strip: **Yes — stop here.** Counts are already covered by My Content. Adding a second counts display above the Account card adds clutter without value and should not be implemented.

---

## Conclusion

**Do not implement a general "Needs attention" strip with counts.** The My Content panel already covers this.

**Implement a narrow profile-setup nudge in D-295B.** Condition: `!profile_public && !profile_slug`. One line added to `renderMeHtml()`, 3 new regression tests, frontend-only, no backend change.

---

## D-295B Candidate Summary

| Field | Value |
|-------|-------|
| Name | Profile-setup nudge in `renderMeHtml()` |
| Condition | `!data.user.profile_public && !data.user.profile_slug` |
| Placement | Between privacy intro paragraph and Account card |
| Implementation | Single conditional in `renderMeHtml()` template string |
| Files to touch | `public/app-v10.js`, `scripts/hardening-smoke-test.mjs` |
| Backend/API/schema/migration | None |
| Classification | Frontend-only |
| New tests | 3 |
| Expected baseline | 3424 → 3427 |
| Deploy needed | Yes (after owner testing) |

---

## Hard Boundary Confirmation

| Boundary | Status |
|----------|--------|
| Review not weakened | Yes — no change to review_state, admin decision, or badge |
| No auto-publish | Yes — strip is read-only guidance, no publish action |
| Saved analysis metadata not exposed publicly | Yes |
| Public profile `/u/:slug` unchanged | Yes |
| No backend/schema/API change in this pass | Yes |
| Drift/Belief expansion untouched | Yes |
| Truth submissions keep `review_state='review'` | Yes |
| Admin Review remains sole approval path | Yes |
| `GET /api/my-humanx` remains owner dashboard source | Yes |

---

## Static Checks (D-295A)

Docs-only change — no code files modified. Baseline unchanged.

| Check | Expected |
|-------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3424 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-295A | No | Product pass / docs only |
