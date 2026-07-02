# D-289A — Owner Workflow Product Pass

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3360 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-289A:** `9bd22a1`
**Files changed:** `docs/D289A_OWNER_WORKFLOW_PRODUCT_PASS.md`, `docs/README.md`

---

## Purpose

Product pass over the complete owner workflow now that the D-287 arc is live. Identifies the next single most useful visible improvement. No implementation in D-289A.

---

## Workflow Under Review

The end-to-end owner-facing arc:

1. **Claim** — owner selects a claim from Study view
2. **RunPack** — owner builds and exports investigation packet
3. **AI analysis** — owner pastes packet into AI, gets structured result
4. **Import** — owner loads AI return via `rp-return-section` in RunPack
5. **Saved analysis** — result saved via `/api/analysis`; shows in Study Analysis panel as an `analysisItem()` card
6. **Draft Truth** — owner clicks "Draft Truth from analysis"; Truths tab opens with `truthStatement` prefilled
7. **Submit** — owner reviews, fills `truthCategory` / `truthType`, submits for Review
8. **My HumanX** — owner lands in My HumanX with pending Truth visible under yellow `Review` badge

---

## 15 Product-Pass Questions

### Q1. Does each step in the workflow have a clear entry point?

**Yes, mostly.** Each major step has a dedicated button or UI action:
- Claim selection: "Select Claim" / Study view
- RunPack: "Create Investigation Packet" button
- Import: `rp-return-section` with "Load AI Analysis Return" (auto-expanded when packet ready)
- Saved analysis: "Save Analysis" action from import return
- Draft Truth: "Draft Truth from analysis" button at bottom of analysis card
- Submit: "Submit Truth for Review" button in Truth form
- My HumanX: tab navigation or automatic post-submit redirect

**Weak point:** the import step (Load AI Analysis Return) is inside the RunPack accordion, which may be collapsed. The auto-expand condition (`lastPacket && lastPacketClaimId === selected?.id`) helps, but only if the owner hasn't navigated away.

---

### Q2. Is the mental model of "packet → AI → save → draft → submit" communicated at any point?

**Not explicitly in sequence.** Each step's copy explains its own purpose, but there is no single place in the UI that describes the full pipeline or shows where in it the owner currently sits. An owner who discovers saved analyses for the first time has no prompt to connect them to RunPack output or to the "Draft Truth" path.

---

### Q3. After clicking "Draft Truth from analysis", does the owner know where they are and why?

**Partially.** The Truths tab opens, the `truthStatement` field is prefilled, and a toast fires: `"Draft ready — review and submit for Review when ready."` The `truthOrigin` field reads `"RunPack analysis"`.

**Problem:** the owner loses all visual connection to the claim they were studying. The analysis card that triggered the draft is gone. The Truths tab header says "Truths" but nothing says "this draft came from claim X." If the owner wants to verify the prefilled summary against the original claim, they must manually navigate back to Study.

---

### Q4. Are the Truth form fields `truthCategory` and `truthType` prefillable from analysis data?

**No.** The analysis object contains `verdict`, `plainLanguageSummary`, `evidenceScore`, `testability`, `survivability`, `strongestSupport`, `strongestPressure`, `missingTests`, `source`, `packetId`. None of these map cleanly to `truthCategory` (free text) or `truthType` (enum: `common`, `religious`, `political`, `scientific`, `family`, `cultural`).

An AI-produced analysis could potentially suggest a category, but that would require a new field in the analysis schema and is out of scope for the current arc. The owner must fill these two fields manually.

---

### Q5. How many mandatory fields must the owner complete before submitting?

`submitTruth()` reads: `truthStatement` (prefilled), `truthCategory` (default `'general'` if empty), `truthOrigin` (prefilled `'RunPack analysis'`), `truthType` (default `'common'` if empty).

**All four have fallback defaults**, so technically the owner can submit without touching any field after clicking "Draft Truth from analysis." The pre-filled `truthStatement` and `truthOrigin` are correct; the defaults for `category` and `type` are generic. The owner is expected to review and refine, but the UI does not enforce it.

**No mandatory field is blocked.** This is intentional — the Truth enters Review regardless.

---

### Q6. Is the Review gate visibly explained to the owner before and after submission?

**Before:** The Truth form has `"Enters Review before going public."` directly under the submit button, and the Truths tab header badge says `"widely asserted · not auto-verified"`. The draft action guidance says `"Draft only — review and submit for Review when ready."` The copy is adequate.

**After:** The toast `"Submitted for Review — you can see it in My HumanX with the Review badge."` and automatic navigation to My HumanX close the loop clearly.

---

### Q7. Is the connection between saved analysis and the draft button immediately obvious to a new owner?

**Marginally.** The button is at the bottom of the analysis card, after the collapsed `<details>` for Support/Pressure/Missing tests. An owner who reads top-to-bottom will pass through:
- Verdict badge + source pill
- (Optional) Legacy AI label note
- "AI analysis of supplied HumanX packet — not independent verification."
- "Private analysis note — not public truth."
- (Optional) "Saved from RunPack: rp_..."
- Score meters
- Plain-language summary paragraph
- Collapsed details block
- **Draft Truth from analysis** button + guidance

Three stacked `ev-origin-note` paragraphs (provenance/disclaimer lines 3–5 in the list above) appear before the useful content (meters and summary). A quick-scanning owner may not immediately find the draft button, especially on a tall card.

---

### Q8. Does the stale-packet warning interfere with the draft workflow?

**No.** Stale-packet detection (`detectPacketStaleness()`) fires in `runPackSummary()` on the RunPack panel. It does not affect the Analysis panel or `analysisItem()`. An owner can still use a saved analysis to draft a Truth even if the current packet is stale. This is correct — the saved analysis is a snapshot at save time, not tied to the current packet's freshness.

---

### Q9. After Truth submission, can the owner find their submitted Truth?

**Yes.** Post-submit navigation goes to My HumanX (`renderMe()` + `tab-me`), which calls `GET /api/my-humanx`. That endpoint returns the owner's pending Truths. Pending Truths render with a yellow `Review` badge. Live-verified in D-287C sanity check items 15–16. The path is complete and working.

---

### Q10. Is there any visible path from My HumanX back to the originating claim?

**No.** My HumanX shows the submitted Truth with its `Review` badge, category, type, and submission timestamp. It does not show which claim the analysis came from, which packet was used, or provide a link back to Study view.

This is by design at this stage — the Truth is a standalone public-bound record, not permanently linked to the private study. But for an owner trying to track their research workflow, there is no breadcrumb.

---

### Q11. Are there any dead ends in the workflow?

**One soft dead end:** after clicking "Draft Truth from analysis", the owner is on the Truths tab. If they decide not to submit, they must manually navigate back to Study to continue research. There is no "Back to study" or "Cancel draft" affordance. The `truthStatement` field is prefilled; clearing it and navigating away is a friction point.

**Another soft dead end:** an owner who submits a Truth and wants to pressure-test it as a Claim must later find the Truth in the public Truths tab and use "Pressure-test as Claim" there. There is no shortcut from My HumanX's pending-Review Truth to that next step.

---

### Q12. Does the workflow have visible progress or orientation markers?

**No.** There is no step indicator, progress bar, or "You are here" marker. The owner must remember where they are in the claim → RunPack → AI → import → save → draft → submit pipeline. Each panel is self-contained with no cross-panel breadcrumb.

This is consistent with the current SPA's general design pattern — it is a navigation-tab architecture, not a wizard. Adding a global pipeline wizard is out of scope.

---

### Q13. Is there any content the owner sees multiple times unnecessarily?

**Yes — the stacked `ev-origin-note` paragraphs.** Each analysis card shows up to three stacked disclaimer/provenance lines before the useful content:
1. `"AI analysis of supplied HumanX packet — not independent verification."` — always shown
2. `"Private analysis note — not public truth."` — always shown
3. `"Saved from RunPack: rp_..."` — shown when `packetId` present

Lines 1 and 2 are important copy for a first-time owner but become noise for an experienced owner who already knows the context. The result is that the most useful part of the card (verdict badge, meters, plain-language summary) is buried below these three lines every time.

This is the highest-friction visual issue in the current workflow.

---

### Q14. Is the label "Draft Truth from analysis" understood without explanation?

**Likely yes.** The label mirrors the Truth terminology used elsewhere in the UI ("Add a public Truth", "Submit Truth for Review"). "Draft" accurately signals that the action does not submit or publish. The adjacent guidance copy (`"Draft only — review and submit for Review when ready."`) reinforces this. The label is clear.

---

### Q15. Should this workflow continue to be extended, or has it reached a natural stopping point?

**Natural pause — not stop.** The core arc (RunPack → AI → save → draft → submit → Review → My HumanX) is now complete and live. The workflow is coherent and safe. The next improvements are visibility/polish, not new capability. The next single most useful change is identified below.

The workflow should not be extended further in its current form without a specific owner pain point to address. Further extension risks feature creep into the Review or moderation flows, which must remain stable.

---

## Friction Summary

| # | Issue | Severity | Fixable without backend? |
|---|-------|----------|--------------------------|
| 1 | Three stacked provenance/disclaimer notes before useful card content | Medium — noise on repeat views | Yes — frontend only |
| 2 | No claim context visible after clicking "Draft Truth from analysis" | Medium — orientation loss | Yes — frontend only |
| 3 | No `truthCategory` / `truthType` prefill from analysis | Low — defaults cover it | Requires schema change |
| 4 | No path back from draft Truths tab to Study | Low — navigable via tabs | Yes — frontend only |
| 5 | No visible workflow progress indicators | Low — consistent with SPA design | Out of scope |
| 6 | No breadcrumb from My HumanX pending Truth to originating claim | Low — by design at this stage | Out of scope |

---

## D-289B Candidate

**Consolidate the stacked provenance/disclaimer notes in `analysisItem()` into a single collapsed or compact block.**

The three `ev-origin-note` paragraphs (lines 1–3 from the friction summary) are shown unconditionally above the analysis meters and summary on every card, every view. For an owner running repeated analyses on the same claim, these three lines appear identically on every card.

**Proposed change (frontend only):**
- Collapse the three disclaimer/provenance lines into a single `<details>` with summary text `"About this analysis"` or display them as a compact single line (e.g., `"Private · AI · RunPack-sourced"`).
- Keep the full text accessible but not prominent on repeat views.
- Scope: `analysisItem()` only. No backend, no schema, no migration. No Review/moderation changes.
- Risk: Very low. Copy-only restructuring. All three pieces of copy remain present and accessible.
- Classification: frontend-only, docs-only follow-on audit first (D-289A pattern).

**Expected outcome:** the verdict badge, score meters, and plain-language summary become the first visible content on each card. The draft button at the card bottom becomes easier to reach on a scan.

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-289A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-289A |
| `src/worker.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| All backend/schema/API/migration | No changes |

---

## Static Checks (D-289A)

Docs-only change — no code files modified. Expected baseline unchanged.

| Check | Expected |
|-------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3360 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`
