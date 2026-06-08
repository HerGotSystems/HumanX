# D-90G — Pressure Review UI Clarity

**Branch:** `fix/d90g-pressure-review-ui-clarity`
**Date:** 2026-06-08
**Type:** Bug fix + UX copy

---

## Summary

Live testing after D-90B (backend) was merged to main exposed three UI bugs and confusing side panel copy. This patch fixes all of them.

---

## Root Cause

D-90C (frontend pressure moderation UI, PR #109) was stacked on D-90B's feature branch. When D-90B was merged to main (PR #108), D-90C was NOT included — it targeted the D-90B branch, not main. All `isPressure` branches in `app-v10.js` were missing from production.

Fix: cherry-pick D-90C commit `a57d2e7` onto this fix branch, then add the D-90G side panel and graphBox improvements on top.

---

## Bugs Fixed

### Bug 1 — Pressure Inspect panel showed only generic fields
**Symptom:** Inspect panel showed ID, TYPE, STATE, SUBMITTED BY, ORIGIN, CREATED, UPDATED — no Title, Body, Severity, Parent Claim, Claim ID, or Report Count.
**Fix:** `renderReviewInspectPanel` now has an `isPressure` branch that renders pressure-specific fields and a "Study Parent Claim" button using `item.claim_id`.

### Bug 2 — Pressure review cards showed "Claim" title and claim-quality UI
**Symptom:** Cards showed generic "Claim" text, `general · score 0` metadata, and claim category/score layout.
**Fix:** `reviewCard` now has an `isPressure` branch: title from `item.title`, meta shows severity/handle/parent_claim, badge is orange, no category/score row.

### Bug 3 — "NEEDS SHARPENING" badge appeared on pressure cards
**Symptom:** Quality hints (`claimQualityHints`) were computed and displayed for pressure cards.
**Fix:** `qhints` guard is now `(!isTruth && !isEvidence && !isPressure)` — pressure items never receive quality hints.

---

## Side Panel Copy Updates (`public/index.html`)

| Element | Old copy | New copy |
|---|---|---|
| `evidence-kind-hint` | "Support backs the claim. Attack challenges or contradicts it." | "**Support** adds evidence. **Attack** adds pressure. New items enter Review first." |
| `eNote` placeholder | "What does this prove or break?" | "What does this support or challenge?" |
| `evidence-attach-note` | "Saved to selected claim. Visibility follows Review state." | "After approval, it can affect the public claim, score, and RunPack. Pending items stay private." |
| `runpack-side-note` | "Private working packet. Exporting does not publish anything." | "RunPack includes approved public evidence, pressure, tests, and analysis for the selected claim." |

---

## Graph Box Label (`public/app-v10.js`)

`graphBox()` now appends `<p class="small graph-global-label">Global graph totals</p>` after the status grid, clarifying that the counts shown are system-wide totals, not per-claim.

---

## Files Changed

- `public/app-v10.js` — cherry-pick of D-90C (`isPressure` branches) + `graphBox` global label
- `public/styles.css` — cherry-pick of D-90C (`.review-card-pressure`, `.b-orange`)
- `public/index.html` — 4 side panel copy changes
- `scripts/hardening-smoke-test.mjs` — Section 32: 6 new smoke tests (190 → 196)
- `docs/README.md` — hardening count 190 → 196
- `docs/PROJECT_STATE.md` — D-90G entry added

---

## Hardening Smoke Tests

Section 32 added 6 tests covering:
1. `eNote` placeholder updated to "support or challenge"
2. Side panel hint contains "Support adds evidence. Attack adds pressure."
3. Side panel hint contains "New items enter Review first."
4. `evidence-attach-note` says "After approval, it can affect the public claim"
5. `runpack-side-note` says "RunPack includes approved public"
6. `graphBox` output includes "Global graph totals"

**New total: 196 passed, 0 failed**

---

## No Backend Changes

All bugs were frontend-only. The `reviewQueue` SQL in `src/worker.js` already returned all required fields (`title`, `body`, `severity`, `parent_claim`, `claim_id`, `handle`, `report_count`). No worker changes were needed.
