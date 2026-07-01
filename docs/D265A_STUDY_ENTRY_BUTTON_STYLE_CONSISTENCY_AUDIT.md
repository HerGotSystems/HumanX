# D-265A — Study Entry Button Style Consistency Audit

**Scope:** Audit / docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3011 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D265A_STUDY_ENTRY_BUTTON_STYLE_CONSISTENCY_AUDIT.md`, `docs/README.md`
**CSS changes:** None
**App changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audits all Study entry button occurrences across `public/app-v10.js` for style and label consistency. Identifies friction points and ranks them for a follow-on D-265B fix slice. Docs only — no UI changes.

Follows from D-239A (F-2–F-4 remaining findings on Study navigation) and D-264A recommended next lane: "Study entry button style consistency."

---

## Full Inventory — All Study Entry / Back Navigation Buttons

Sourced from static read of `public/app-v10.js` (lines cited are approximate, file is minified one-function-per-line).

| # | Label | Handler | CSS class(es) | Icon | Render location | Admin-only? |
|---|-------|---------|---------------|------|-----------------|-------------|
| 1 | `Open Study View ↗` | `openReviewClaimStudy(id)` | `primary btn-study-review` | ↗ | `renderReviewInspectPanel` — claim items | Yes |
| 2 | `Study Parent Claim ↗` | `openReviewClaimStudy(claim_id)` | `btn-study-review` | ↗ | `renderReviewInspectPanel` — evidence/pressure items | Yes |
| 3 | `Study Linked Claim ↗` | `openReviewClaimStudy(linked_id)` | `btn-study-review` | ↗ | `renderReviewInspectPanel` — truth items (linked claim) | Yes |
| 4 | `↗ Study` | `openReviewClaimStudy(nearDup)` | `btn-link-small` | ↗ | Similar claim advisory field row in inspect panel | Yes |
| 5 | `{claimId} ↗` | `openReviewClaimStudy(linked)` | `btn-link-small` | ↗ | Linked Claim field row in inspect panel (truth items) | Yes |
| 6 | `Study claim ↗` | `studyFromVault(claimId)` | `btn-link-small` | ↗ | Vault group header | No |
| 7 | `Study Linked Claim` | `studyFromVault(claim_id)` | *(none)* | none | Evidence card action area | No |
| 8 | `Open Claim Study →` | `openTruthClaimStudy(claimId)` | `primary` | → | Truths page, when linked claim is public | No |
| 9 | `Open Study →` | `openMyClaimStudy(id)` | `btn-mini` | → | My HumanX recent claims, public claims only | No |
| 10 | `← Back to Review` | `backToArena()` | *(none)* | ← | Study page `.study-nav`, when `lastModeBeforeStudy='review'` | Yes |
| 11 | `← Back to Vault` | `backToArena()` | *(none)* | ← | Study page `.study-nav`, when `lastModeBeforeStudy='vault'` | No |
| 12 | `← Back to Truths` | `backToArena()` | *(none)* | ← | Study page `.study-nav`, when `lastModeBeforeStudy='truths'` | No |
| 13 | `← Back to My HumanX` | `backToArena()` | *(none)* | ← | Study page `.study-nav`, when `lastModeBeforeStudy='me'` | No |
| 14 | `← Back to Claims` | `backToArena()` | *(none)* | ← | Study page `.study-nav`, when `lastModeBeforeStudy='arena'` | No |

**Total Study entry buttons:** 9 (items 1–9)
**Total Back navigation buttons:** 5 (items 10–14)

---

## CSS Class Reference

Classes observed in use across Study / Back buttons:

| Class | Where defined | Appearance |
|-------|--------------|------------|
| `primary` | Global button style | Filled accent (blue/gradient) — highest visual weight |
| `btn-study-review` | D-261B — `.review-inspect-actions .btn-study-review{margin-left:auto}` desktop push | Gradient background (`btn-study-review` has its own gradient rule); right-pushed on desktop, full-width on mobile |
| `btn-link-small` | Global utility | Small inline link-style button — minimal visual weight |
| `btn-mini` | Global utility | Small filled or outlined button |
| *(none)* | n/a | Browser-default `<button>` — unstyled, platform-dependent appearance |

---

## Audit Questions

### Q1 — Are Study entry buttons in the inspect panel visually consistent?

**No.** Item 1 (`Open Study View ↗`) carries both `primary` and `btn-study-review`. Items 2–3 carry only `btn-study-review` (no `primary`). Within the same inspect panel, the claim Study button appears more prominent than evidence/pressure/truth Study buttons — creating a false hierarchy where claim Study is emphasized and subordinate Study actions appear secondary, even though they serve the same user intent (entering Study View).

### Q2 — Are Study entry buttons outside the inspect panel visually consistent?

**No.** Three different patterns:
- `btn-link-small` — items 4, 5, 6 (inline field row links in inspect panel, vault group header)
- `primary` alone — item 8 (Truths page)
- `btn-mini` — item 9 (My HumanX)
- *(none)* — item 7 (Evidence card)

The same conceptual action (enter Study View for a claim) takes four different visual forms across four surfaces.

### Q3 — Are Back navigation buttons visually consistent?

**Yes across themselves, but no in absolute terms.** Items 10–14 all use `backToArena()` and all render with no CSS class — so they are visually consistent with each other (all plain browser-default buttons). However, plain button appearance is weak in the context of the Study page (which has a styled `.study-nav` row); the Back-to-Review button in particular (item 10, admin-only) risks being overlooked by moderators who are actively moderating from Study View.

### Q4 — Is the icon convention (↗ vs →) used consistently?

**No.** Two distinct arrow icons in use:

| Icon | Used by |
|------|---------|
| `↗` (upper-right diagonal — external/new-context) | Items 1–6 (inspect panel + vault) |
| `→` (rightward — same-context continuation) | Items 8–9 (Truths page, My HumanX) |

Both navigate to Study View within the app — they are not semantically different actions. The `↗` vs `→` divergence is likely accidental copy drift rather than intentional design. Using `↗` everywhere (as in the inspect panel) or `→` everywhere would be consistent; the current split is not.

### Q5 — Does any Study button or Back button touch restricted handlers?

**No.** All Study entry buttons call one of: `openReviewClaimStudy`, `studyFromVault`, `openTruthClaimStudy`, `openMyClaimStudy`. None call `selectClaim`, `attachEvidencePrompt`, or any Review decision handler. Back buttons all call `backToArena()`. No restricted handlers involved.

### Q6 — Do D-261B's inspect-panel CSS rules affect other Study entry points?

**No.** D-261B added rules scoped to `.review-inspect-actions .btn-study-review` — applying only within the inspect panel's action row. Items 6–9 (vault, evidence card, Truths page, My HumanX) are unaffected by D-261B. Items 4–5 use `btn-link-small` without `.review-inspect-actions` scope, also unaffected. The D-261B mobile full-width rule (`width:100%`) only applies to buttons within `.review-inspect-actions`.

### Q7 — What would a safe D-265B fix slice look like?

**Copy and class-level polish only.** No handler changes. No backend changes. No Review decision changes. Safe targets:

1. **Normalize inspect panel Study class** — Either add `primary` to items 2–3, or remove it from item 1. Adding is safer (additive CSS, no visual regression for existing users of item 1). Removing from item 1 carries slight risk of visual regression for the claim Study button, which is currently the most prominent.
2. **Add a class to Back buttons** — All 5 Back buttons currently unstyled. Add a simple class (e.g. `btn-back-study`) with lightweight styling (e.g. muted text color, small left-arrow treatment) to make them recognizable without adding heavy visual weight. This directly addresses D-239A F-2.
3. **Normalize arrow icon** — Either `↗` everywhere or `→` everywhere across all 9 Study entry buttons. Recommend `↗` (already used by the majority: items 1–6) — a one-line copy change to items 8–9.
4. **Add class to evidence card Study button (item 7)** — `btn-link-small` matches item 6 (vault Study) and would make it visually consistent.

All four are copy/CSS only. Items 1–9 behavior unchanged; items 10–14 behavior unchanged. No markup structure changes needed.

---

## Friction Findings (Ranked)

| ID | Severity | Finding |
|----|----------|---------|
| F-1 | HIGH | Inspect panel claim Study button has `primary` class; evidence/pressure/truth Study buttons do not — false hierarchy within the same panel |
| F-2 | HIGH | All 5 Back navigation buttons have no CSS class — plain browser-default styling; Back-to-Review (moderator path) risks being overlooked |
| F-3 | MEDIUM | Icon inconsistency: `↗` on inspect panel + vault vs `→` on Truths page + My HumanX — all are in-app navigation, not external links |
| F-4 | MEDIUM | Evidence card Study button (item 7) has no CSS class — plain button; vault group header uses `btn-link-small` for the same action |
| F-5 | MEDIUM | Advisory field Study link (item 4) uses `btn-link-small` with `↗ Study` label — different appearance from the Study action buttons above it in the same inspect panel |
| F-6 | MEDIUM | Linked Claim field row (item 5) shows raw `{claimId} ↗` as the button label — claim ID rather than descriptive text |
| F-7 | LOW | Label variety: `Open Study View`, `Study Parent Claim`, `Study Linked Claim`, `Study claim`, `Open Claim Study`, `Open Study`, `↗ Study` — six+ variants for the same conceptual action across surfaces |
| F-8 | LOW | D-261B desktop Study push (`.review-inspect-actions .btn-study-review{margin-left:auto}`) only affects inspect panel — other Study entry points not covered, but out of scope for that fix |

---

## Recommended D-265B Scope

**Task type:** CSS + copy polish only. No JS handler changes. No backend changes.

| Change | Files | Risk |
|--------|-------|------|
| Add `primary` to items 2–3 (inspect panel Study) | `public/app-v10.js` (markup only) | Low — additive; D-262A lock still passes |
| Add `btn-back-study` class + minimal CSS to Back buttons (items 10–14) | `public/app-v10.js`, `public/styles.css` | Low — new class, no existing rule conflict |
| Normalize arrow icon to `↗` on items 8–9 | `public/app-v10.js` (copy only) | Very low — label-only change |
| Add `btn-link-small` to item 7 (evidence card) | `public/app-v10.js` (markup only) | Low — additive class |

**Deploy required:** Yes (any change to `public/app-v10.js` or `public/styles.css` requires owner manual terminal deploy + D-265C live closeout).

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-265A
- `public/styles.css` — not modified by D-265A
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No Review decision handler changes
- No moderation semantic changes
- No handler changes: `selectClaim`, `studyFromVault`, `attachEvidencePrompt` untouched
- No Review decision handlers touched: `inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`, `cancelApproveReview`, `cancelRejectReview`
- `alignment_labels` remains disabled
- `top_beliefs_json` remains blocked from public API responses

---

## Baseline Confirmation

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3011 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`
