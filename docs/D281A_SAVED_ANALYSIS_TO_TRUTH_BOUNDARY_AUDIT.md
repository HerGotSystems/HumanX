# D-281A — Saved Analysis to Truth Boundary Audit

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy
**Branch:** main (direct commit)
**Baseline:** 3298 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D281A_SAVED_ANALYSIS_TO_TRUTH_BOUNDARY_AUDIT.md`, `docs/README.md`

---

## Purpose

Audit the boundary between saved AI analysis and public Truth creation/review. Confirm whether the current workflow clearly prevents "saved analysis" being mistaken for "published truth", and identify the smallest safe next improvement if needed.

---

## Code Surfaces Reviewed

| Function | Location | Purpose |
|----------|----------|---------|
| `saveAnalysisResult()` | `public/app-v10.js` line 573 | Saves AI analysis result |
| `sectionAnalyses()` | line 555 | Renders Analysis panel in Study view |
| `analysisItem(a)` | line 466 | Renders individual saved analysis card |
| `renderExport()` | line 452 | Renders Investigation Packet / RunPack panel — contains `rp-return-section` |
| `renderStudy()` | line 456 | Renders Study view — calls `sectionAnalyses()` |
| `submitTruth` / `submitBuilderTruth` / `convertTruth` | various | Truth creation paths |
| `renderPublicProfileHtml` / `loadPublicProfileSummary` | `src/worker.js` | Public profile surface |

---

## Audit Questions and Answers

### Q1. Where are saved analyses displayed in the owner/private claim workflow?

Saved analyses appear in two places, both authenticated/private:

1. **Study view Analysis panel** — `renderStudy()` → `sectionAnalyses()` → `analysisItem()`. This is inside the `study-mode` class on `document.body` and only renders when `selected` is set (authenticated claim). Analysis results are loaded via `selectClaim()` → `GET /api/claims/:id` → `analyses` array → `mapAnalysis()` → `packetId`.

2. **Investigation Packet panel** — `renderExport()` contains a `<details class="rp-return-section">` with the AI-return import form. This is a second entry point to `saveAnalysisResult()` but it does **not** display saved analysis results — it is a write-only import form.

**Conclusion:** Saved analyses are visible only in the Study view Analysis panel. Never on public profile, truth cards, or review queue.

---

### Q2. Where are public Truths created, submitted, approved, or rejected?

| Action | Function / Route |
|--------|-----------------|
| Truth submission (builder) | `submitBuilderTruth()` → `POST /api/truths` |
| Truth submission (drift) | `submitTruth()` → `POST /api/truths` |
| Truth conversion (from belief) | `convertTruth()` → `POST /api/truths` |
| Truth approval | `reviewDecisionUI('approve')` → `POST /api/review/decision` |
| Truth rejection | `reviewDecisionUI('reject')` → `POST /api/review/decision` |

All Truth-creation paths go through `POST /api/truths` and then enter Review (`review_state='review'`). Approval requires admin/moderator action via the Review queue.

---

### Q3. Does saving analysis currently create, submit, approve, or publish a Truth?

**No.** `saveAnalysisResult()` (line 573) posts only to `POST /api/analysis`. It does not:
- Call `POST /api/truths`
- Call `POST /api/review/decision`
- Set or alter `review_state` on any claim or truth
- Create, submit, or change any public-facing entity

The `_D181B_ZERO_PARAM_ACTIONS` registry (line 584) confirms `saveAnalysisResult` is registered as a zero-parameter action with no side effects on public state.

---

### Q4. Does `saveAnalysisResult()` still post only to `/api/analysis`?

**Yes.** Line 573:

```javascript
await api('/api/analysis', {method:'POST', body:JSON.stringify({
  claimId: selected.id,
  source: 'runpack-user',
  raw: result,
  packet_id: _rppid
})});
```

No other `fetch`/`api()` call in `saveAnalysisResult()`. D-271/D-272 lock preserved.

---

### Q5. Is there any UI path that turns an analysis into a public Truth?

**No.** `analysisItem()` renders: verdict badge, source pill, disclaimer note, provenance note (when `packetId` exists), meters, summary, and a details block (support/pressure/missing tests). There is no "Promote to Truth", "Submit as Truth", or "Create Truth from Analysis" button on the saved analysis card.

No function in the frontend wires analysis results to any Truth creation flow.

---

### Q6. Is there any UI copy that could make the owner think saving analysis publishes a Truth?

**Mostly no — but one gap exists (Finding F-1).**

**Existing protective copy (all confirmed present):**

| Location | Copy |
|----------|------|
| `renderExport()` `rp-return-next-step` (RunPack panel) | "Saving does not publish a truth automatically — it only loads analysis for this claim." |
| `renderExport()` general note | "Creating a packet does not publish anything — visibility still depends on admin Review approval." |
| `sectionAnalyses()` form copy (Study view) | "Save the result as one interpretation, not as a verdict. Do not treat it as verification unless external sources are independently checked." |
| `analysisItem()` disclaimer | "AI analysis of supplied HumanX packet — not independent verification." |
| `helperText()` (home mode) | "New submissions enter Review before becoming public." |
| `helperText()` (drift mode) | "Both actions enter Review before going public." |

**Finding F-1 (MEDIUM):** The explicit no-auto-publish copy (`"Saving does not publish a truth automatically"`) lives **only** in the RunPack panel (`rp-return-next-step`). A user who saves analysis via the Study view Analysis panel (`sectionAnalyses()` form) sees the milder "Save the result as one interpretation, not as a verdict" copy — but **not** the explicit "does not publish" statement.

This is a copy gap, not a functional gap. Saving still goes to `/api/analysis` regardless of which form is used. But a user taking the Study→Analysis path may not have seen the clearest no-auto-publish guidance.

**Finding F-2 (LOW):** `analysisItem()` says "not independent verification" but does not explicitly say the analysis is **private to the owner**. A user could potentially wonder if the analysis card is visible to others. The Study view is authenticated-only, but there is no on-card "private" label.

---

### Q7. Is the no-auto-publish guidance still visible in the AI-return import area?

**Yes.** In `renderExport()` line 452, the `rp-return-section` contains:

```html
<p class="small rp-return-next-step">After your AI analyses the packet, paste its JSON response here.
Saving does not publish a truth automatically — it only loads analysis for this claim.</p>
```

This is D-272A-locked and confirmed present. The auto-expand condition (`lastPacket&&lastPacketClaimId===selected?.id`) ensures it is visible when a matching RunPack is loaded.

---

### Q8. Does the saved analysis card need a clearer "private analysis only" note, or is the current disclaimer enough?

**Current disclaimer in `analysisItem()`:**

```html
<p class="small ev-origin-note">AI analysis of supplied HumanX packet — not independent verification.</p>
```

This correctly frames the AI source but says nothing about privacy/visibility. Given that:

- The Study view is authenticated-only
- Public profile does not expose analysis data
- No visible "public" indicator is shown on the card

The omission of a "private" label is a minor friction. Adding a small note like `"Private to your investigation — not shared publicly."` would complete the boundary picture for the owner without changing any behavior.

**Classification:** Nice-to-have. Not urgent. Low scope.

---

### Q9. Would a "Use analysis to draft a Truth" next-step be useful, or would that introduce risky scope?

**Too broad for now.** A "Draft Truth from analysis" affordance would require:

- Pre-populating a Truth submission form from AI output fields (non-trivial field mapping)
- Touching the Truth builder / submission flow (`submitBuilderTruth`)
- Potentially new UI state to track "analysis → truth draft"

The Truth creation path is not in scope for RunPack work. The no-auto-publish boundary exists precisely to avoid this conflation. Introducing a "draft Truth" button would blur the boundary and require its own audit.

**Verdict:** Do not implement in D-281B. Flag as future lane only if explicitly requested.

---

### Q10. If useful, would such a next-step be frontend-only or backend-required?

A pure form-prefill approach (no new route) would be frontend-only. But touching `submitBuilderTruth`, Truth form state, or any review-adjacent behavior requires a separate spec. Out of scope for D-281B.

---

### Q11. Does Review/moderation remain completely separate from saved analysis?

**Yes.** `saveAnalysisResult()` does not call any Review route. Review decision handlers (`inspectReviewItem`, `reviewDecisionUI`, `requestApproveReview`, `requestRejectReview`) are not called from `saveAnalysisResult()` or `analysisItem()`. The hard security rule blocking modification of Review handlers is still in effect.

---

### Q12. Does public profile `/u/:slug` remain separate from saved analysis metadata?

**Yes.** `loadPublicProfileSummary()` in `src/worker.js` uses count-only queries and never calls `listAnalysisForClaim()`. `packetId`, `analyses`, and any field from `analysis_results` do not appear in the public profile response. D-275C review item 10 and D-277B tests 8–9 regression-lock this.

---

### Q13. Does packet provenance remain owner/private only?

**Yes.** `Saved from RunPack: rp_...` and `packetId` are rendered only in `analysisItem()` → `sectionAnalyses()` → `renderStudy()` (authenticated). D-279B tests 9–10 confirm `renderPublicProfileHtml` does not expose these strings.

---

### Q14. Smallest safe D-281B candidate

**Two candidates — either or both:**

**Candidate A (Preferred — F-1 fix):**
Add no-auto-publish copy to `sectionAnalyses()` in Study view. The RunPack panel already has "Saving does not publish a truth automatically." Adding a parallel line to the Study view Analysis section form closes the copy gap for users who save via the Study path.

Target: `sectionAnalyses()` line 555 — add a `p.small rp-return-next-step` or `p.small ev-origin-note` immediately before or after the existing analysis-save-form copy.

Candidate A is the smallest, most useful, lowest-risk change.

**Candidate B (F-2 fix — lower priority):**
Add a "private to your investigation" note to `analysisItem()`. One additional `p.small ev-origin-note` line. Very small scope. Completes the on-card privacy picture.

**Recommended D-281B:** Candidate A + Candidate B together in one commit. Both are frontend-only, both are confined to `public/app-v10.js`, both have near-zero blast radius.

---

### Q15. D-281B classification

**Frontend-only.**

- `public/app-v10.js` only
- No `src/worker.js` change
- No `src/analysis-results.js` change
- No schema/migration/API change
- No CSS change
- Direct to main (no branch/PR required)
- Requires owner deploy + live closeout

---

### Q16. Regression tests needed for D-281B (do not write yet)

**For Candidate A (no-auto-publish copy in sectionAnalyses):**

1. `sectionAnalyses` rendered HTML contains no-auto-publish copy (exact string TBD in D-281B)
2. The new copy does NOT appear in `renderPublicProfileHtml`
3. The existing `sectionAnalyses` form structure (textarea, Save Analysis button) still present
4. Existing D-272A `rp-return-next-step` copy in `renderExport` still present (non-regression)

**For Candidate B (private note in analysisItem):**

5. `analysisItem` rendered HTML contains "private" or "not shared" copy (exact string TBD)
6. The new copy does NOT appear in `renderPublicProfileHtml`
7. Existing `analysisItem` disclaimer ("not independent verification") still present
8. Existing `analysisItem` provenance note still conditional on `a.packetId` (D-277B lock preserved)

**Cross-arc non-regression (preserve all existing locks):**

9. D-272A: `rp-return-next-step` lock — "Saving does not publish a truth automatically" still in `renderExport`
10. D-277B: `Saved from RunPack` still renders when `a.packetId` exists
11. D-277B: `renderPublicProfileHtml` does not contain `Saved from RunPack`
12. D-275B: `saveAnalysisResult` still posts only to `/api/analysis`
13. D-279B: `detectPacketStaleness` pushes `claim updated since packet`

---

## Summary of Findings

| # | Finding | Severity | D-281B? |
|---|---------|----------|---------|
| F-1 | No-auto-publish copy absent from Study view Analysis panel entry point | MEDIUM | Yes — Candidate A |
| F-2 | `analysisItem()` card has no explicit "private" label | LOW | Yes — Candidate B |

**No functional boundary gaps found.** `saveAnalysisResult()` is correctly isolated to `/api/analysis`. Review/moderation, public profile, and Truth creation are all structurally separate.

---

## Audit Conclusion

The saved analysis ↔ public Truth boundary is structurally sound. Saving analysis does not create, submit, approve, or publish a Truth. The functional isolation is airtight and regression-locked.

The one copy gap (F-1) is that users who save analysis via the Study view Analysis form (rather than the RunPack panel) do not see the explicit "Saving does not publish a truth automatically" line before saving. This is a user-experience gap, not a data-boundary or security gap.

D-281B is frontend-only, low scope, and can go direct to main after owner deploy + live closeout.

---

## No-Touch Confirmation

| File | Touched? |
|------|---------|
| `public/app-v10.js` | No |
| `public/styles.css` | No |
| `public/index.html` | No |
| `public/belief-drift-expansion.js` | No |
| `src/worker.js` | No |
| `src/analysis-results.js` | No |
| `migrations/` | No |
| Backend/API/auth/review/CSP | No |
