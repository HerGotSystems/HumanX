# D-291A — My HumanX Owner Dashboard Product Pass

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3383 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-291A:** `7d1b7a6`
**Files changed:** `docs/D291A_MY_HUMANX_OWNER_DASHBOARD_PRODUCT_PASS.md`, `docs/README.md`

---

## Purpose

Product pass over the My HumanX owner dashboard now that it is the post-submit landing page for Truth submissions (D-285B). Identifies the next single most useful visible improvement for ordinary owner use.

---

## Current Page Layout

`renderMeHtml()` currently renders in this order:

1. Section head "My HumanX"
2. Privacy intro paragraph ("Your activity, contributions, and profile controls...")
3. **Account card** — verified/anonymous badge, name, email, handle, user ID, Export button
4. **Profile Settings** — public toggle, slug, bio, preview, Save/Copy link
5. **My Content** panel — `meCountsRow()` for Claims, Truths, Evidence, Pressure with per-state chips
6. **Filter bar** — All / Public / Review / Rejected / Archived / Duplicate buttons
7. **Recent Claims** panel
8. **Belief Snapshots** panel
9. **Belief Mirror** panel (multi-card private section)
10. **Belief reflection** panel
11. **Reflection Avatar** panel
12. **Recent Truths** panel ← post-submit landing target
13. **Recent Evidence** panel
14. **Recent Pressure** panel

---

## 19 Product-Pass Questions

### Q1. What does My HumanX currently show to an owner?

A multi-section private dashboard containing: account identity (account card), profile settings and preview, counts of all submissions by state (per type), a state filter bar, and separate "Recent" panels for Claims, Belief Snapshots, Belief Mirror, Belief Reflection, Reflection Avatar, Truths, Evidence, and Pressure — in that order.

---

### Q2. What data comes from `GET /api/my-humanx`?

Returns: `user` (account info: handle, display_name, email, id, verified, profile_public, profile_slug, profile_bio), `counts` (per-type, per-state breakdowns), `claims`, `truths`, `evidence`, `pressure`, `belief_snapshots`, `home_tests`.

No `review_state` filter is applied server-side — all owner truths are returned regardless of state. This is correct and enables the pending-Review visibility added in D-285B.

---

### Q3. How are pending Review Truths displayed?

Inside "Recent Truths" (`meRecentTruthsHtml()`), each truth row renders:
```
[yellow Review badge] [statement text, max 140 chars] [relative time] [Archive button]
```

When public (`state === 'public'`): a "View in Truths →" button is added. No action is shown for pending-Review truths other than Archive.

---

### Q4. Is the yellow `Review` badge clear enough?

Marginally. The label `"Review"` matches the admin queue name and the D-285B toast text. An owner who has been through the submit flow will recognize it. But the badge label alone gives no hint about what happens next — it could be read as "needs owner review", "in a queue somewhere", or "pending permanently".

---

### Q5. Does My HumanX explain what "Review" means?

**No.** Nowhere on the page is "Review" defined for the owner. The filter bar button says "Review". The counts panel chips say "Review: N". The badge says "Review". None of these say "awaiting admin approval" or "will go Public when approved by an admin". A first-time owner has no way to know when or how the item will become public.

---

### Q6. After submitting a Truth, is it obvious why the item is not public yet?

**Partially.** The D-285B toast `"Submitted for Review — you can see it in My HumanX with the Review badge."` correctly directs the owner to My HumanX. But on arrival the "Recent Truths" panel is at the **bottom** of a long page — after Account card, Profile Settings, My Content counts, filter bar, Recent Claims, Belief Snapshots, Belief Mirror, Belief Reflection, and Reflection Avatar. An owner must scroll past at minimum six dense sections before seeing their just-submitted Truth.

The first experience after "Submit Truth for Review" is: land in My HumanX → see account info → see profile settings → see counts → see filter bar → see claims → see snapshots → see mirrors → finally see the Truth. The thing the owner just did is not visible at all on the initial viewport.

---

### Q7. Are approved/public Truths visually distinct from pending Review Truths?

**Yes.** `b-green "Public"` badge + "View in Truths →" button for public; `b-yellow "Review"` badge + no action (other than Archive) for pending. The visual distinction is clear once the owner reaches the panel.

---

### Q8. Are rejected/kept/draft states visible, if they exist?

- `b-red "Rejected"` badge + Archive button — visible
- `b-muted "Archived"` badge, no Archive button — visible (already archived)
- `b-purple "Duplicate"` badge + Archive button — visible
- **Draft state:** does not exist. Truths enter `review_state='review'` immediately on `POST /api/truths`. There is no saved-draft state.

All rendered states are correct.

---

### Q9. Is the order of items useful?

Within each "Recent X" panel: items are sorted by `updated_at || created_at` descending (most recent first). That is correct.

**Across sections:** the order of the full page is not useful for the post-submit use case. The owner just submitted a Truth, landed in My HumanX, and wants to see it. But "Recent Truths" is the 12th section, after a dense block of identity, settings, and belief content. The page order was designed before My HumanX was the post-submit landing page.

---

### Q10. Does My HumanX show enough context for each Truth?

The truth row shows: state badge + statement text (140 chars) + relative time. That is enough to identify the item and its state. No category, origin, or truth type is shown — adequate for a short list. The 140-char truncation covers most typical Truth statements.

---

### Q11. Does My HumanX show too much clutter?

**Yes — for the post-submit use case.** The Account card and Profile Settings sections are useful for an owner actively managing their profile. The Belief Mirror and Belief Reflection sections are useful for owners engaged in belief tracking. But for an owner who just submitted a Truth and wants to confirm it appeared in review, these sections are all noise before they can find the Truth.

The page is not cluttered in general — each section serves a purpose. But the section **order** does not match the most common task an owner now arrives here to do.

---

### Q12. Is there a clear next step for the owner after seeing a pending Review item?

**No.** A pending-Review Truth row shows only the Archive button. There is no:
- Explanation that "Review means awaiting admin approval"
- Indication of how long review typically takes
- Copy saying the owner will see "Public" when approved
- Link to "Pressure-test as Claim" from the Truth row
- Any path back to the claim this Truth was drafted from

The owner is left with a yellow "Review" badge and no guidance.

---

### Q13. Does My HumanX need copy polish, grouping, or layout polish?

**Layout polish is the highest-value fix.** The "Recent Truths" section needs to appear higher in the page — immediately after the My Content counts and filter bar, before Recent Claims. This is a one-line change to the template literal in `renderMeHtml()`.

**Copy polish is secondary.** The "Recent Truths" panel could include a one-line explanatory note: `"Review: your submission is awaiting admin approval — you'll see it go Public when approved."` This gives the owner a complete picture without requiring them to know how HumanX works.

These are two independent improvements; layout reorder is more impactful and simpler.

---

### Q14. Can the best improvement be frontend-only?

**Yes.** Reordering sections in `renderMeHtml()` is a pure frontend change to the template literal. No backend data changes are needed — all data is already returned by `GET /api/my-humanx`.

---

### Q15. Would any useful improvement require backend/API changes?

No useful improvement for this pass requires backend/API changes. All needed data (truths, state, timestamp) is already in the `GET /api/my-humanx` response.

---

### Q16. Identify the smallest useful D-291B candidate

**Reorder "Recent Truths" above "Recent Claims" in `renderMeHtml()`.**

Specifically: in the `renderMeHtml()` template literal, move the "Recent Truths" `<div class="panel">` block to appear **immediately after** the filter bar (`${meFilterBarHtml()}`), before the "Recent Claims" panel.

This means the page order becomes:
1. (unchanged) Account card
2. (unchanged) Profile Settings
3. (unchanged) My Content counts
4. (unchanged) Filter bar
5. **Recent Truths** ← moved up
6. (unchanged) Recent Claims
7. (unchanged) Belief Snapshots
8. (unchanged) Belief Mirror
9. (unchanged) Belief Reflection
10. (unchanged) Reflection Avatar
11. (unchanged) Recent Evidence
12. (unchanged) Recent Pressure

**Optional addition in the same commit:** Add a brief `"Review means awaiting admin approval — goes Public when approved."` note inside the "Recent Truths" panel header, or as a `builder-field-note` paragraph inside the panel.

---

### Q17. Classify D-291B

**Frontend-only.** Single template literal reorder in `renderMeHtml()`. Optional one-line copy addition in the same function. No backend, schema, API, CSS (beyond any existing classes), or migration changes needed.

---

### Q18. Prefer one visible frontend-only improvement if there is a clear candidate

**Clear candidate: reorder "Recent Truths" to appear immediately after the filter bar, before "Recent Claims".**

This directly addresses the core friction: an owner who just submitted a Truth via "Submit Truth for Review" (the most common post-D-285B flow) currently has to scroll past six or more dense sections before seeing the item they just created. Moving the panel up makes the confirmation visible immediately on arrival.

The copy note ("Review means awaiting admin approval") can be included in the same commit with minimal risk.

---

### Q19. If no worthwhile improvement exists, say stop here.

A clear worthwhile improvement exists. Continue to D-291B.

---

## Friction Summary

| # | Issue | Severity | Fixable without backend? |
|---|-------|----------|--------------------------|
| 1 | "Recent Truths" buried after 6+ sections — not visible on post-submit arrival | High — directly contradicts D-285B post-submit navigation intent | Yes — template reorder in `renderMeHtml()` |
| 2 | No explanation of what "Review" means on the owner dashboard | Medium — owner has no clear next-step guidance | Yes — one-line copy addition |
| 3 | No path from pending-Review Truth back to originating claim | Low — by design at this stage | Out of scope for D-291B |
| 4 | No notification or ETA for pending-Review items | Low — requires admin/notification infrastructure | Requires backend |

---

## D-291B Candidate

**Move "Recent Truths" above "Recent Claims" in `renderMeHtml()`, and add a brief pending-Review guidance note.**

- **Scope:** `public/app-v10.js` — `renderMeHtml()` only.
- **Classification:** Frontend-only.
- **Risk:** Very low. Template literal reorder and one-line copy addition. No data, logic, or behavior changes.
- **No backend/schema/API/CSS/migration/Review changes.**
- **Expected outcome:** An owner who submits a Truth and lands in My HumanX sees their pending-Review Truth immediately after the counts overview, without scrolling past claims, snapshots, or mirror cards.

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-291A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-291A |
| `src/worker.js` | Not modified |
| All backend/schema/API/migration | No changes |

---

## Static Checks (D-291A)

Docs-only change — no code files modified. Expected baseline unchanged.

| Check | Expected |
|-------|----------|
| `hardening-smoke-test.mjs` | `3383 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |
