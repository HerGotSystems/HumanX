# D-96A — Review Decision Safety Audit

**Date:** 2026-06-09
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 272 / belief-engine-static-check 24 / worker-route-static-check 39

---

## A. Files Inspected

| File | Sections read |
|---|---|
| `public/app-v10.js` | `reviewDecisionUI`, `reviewCard`, `renderReviewInspectPanel`, `inspectReviewItem`, `requestRejectReview`, `cancelRejectReview`, `markDuplicateUI`, `archiveTruthArtefact`, `isTruthDerivedClaim`, `isClaimCategoryEcho`, `isLikelyBorderlineDerivedClaim` |
| `scripts/hardening-smoke-test.mjs` | All approve/reject/confirm/decision tests |
| `docs/D-95A-review-queue-moderation-workflow-audit.md` | Prior workflow audit |
| `docs/D-93C-borderline-truth-derived-policy-audit.md` | Borderline policy constraints |
| `docs/D93D_REVIEW_TRUTH_DERIVED_CONTEXT.md` | Advisory badge implementation |
| `docs/D-93E-review-truth-derived-false-positive-guard-audit.md` | Category-echo guard |
| `docs/D95B_REVIEW_INSPECT_SCROLL_APPROVE_CONSISTENCY.md` | D-95B inspect ergonomics |

---

## B. Current Decision Flow Map

```
Admin enters token
  └─ loadReviewQueue() → GET /api/review
        └─ renderReviewList()
              ├─ renderReviewFilterBar(all)
              ├─ renderReviewAuditSummary(all)
              ├─ renderReviewInspectPanel(item)?   ← if item selected
              └─ reviewCard(item) × N

────────────────────────────────────────────────────
CARD ROW (per card):
  [Inspect]      → inspectReviewItem(id)              safe, toggles panel
  [Approve]      → reviewDecisionUI(type,id,'public')  ★ ONE CLICK — immediate
  [Keep Pending] → reviewDecisionUI(type,id,'review')  one click — safe (no-op)
  [Reject]       → requestRejectReview(id) [step 1]
                    renders: "Reject? It will not be public."
                    [Confirm Reject] → reviewDecisionUI(type,id,'rejected') [step 2]
                    [Cancel]         → cancelRejectReview() — no action

────────────────────────────────────────────────────
INSPECT PANEL:
  header: type badge + title + [✕ Close]
  nav: [← Prev]  [N of total]  [Next →]
  state bar: ● pending / public / rejected

  TOP ACTIONS (before all fields):
    [Approve▲]     → reviewDecisionUI(type,id,'public')  ★ ONE CLICK — immediate
    [Keep Pending] → reviewDecisionUI(type,id,'review')
    [Reject]       → 2-step confirm (same as card row)

  FIELDS: ID, Type, State, Reports, (type-specific), Origin Path*, Review Advisory*, Borderline Hint*
  QUALITY HINTS (advisory)

  BOTTOM ACTIONS (after all fields):
    [Approve▲]          → reviewDecisionUI(type,id,'public')  ★ ONE CLICK — immediate
    [Keep Pending]      → reviewDecisionUI(type,id,'review')
    [Reject]            → 2-step confirm
    [Archive test artefact?] → confirm() dialog (D-92G guard: rejected + artefact only)
    [Mark Duplicate...] → hxModal() with required target-ID input
    [Dismiss ~Similar]  → hxModal() confirmation
    [Open Study View ↗] → tab switch to Study mode (non-destructive)

* D-93D rows, Truth-Derived claims only

────────────────────────────────────────────────────
POST-DECISION (all paths):
  reviewDecisionUI → POST /api/review/decision
    → pendingRejectReviewId = null
    → toast(success message)
    → loadGraphStatus().catch(()=>{})
    → await loadReviewQueue()
    → renderReviewList()        ← full reload + full DOM re-render

Error path: toast(e.message||'Review action failed') — no retry
```

---

## C. One-Click Approve Call Sites (confirmed)

Three direct `reviewDecisionUI(...,'public')` onclick bindings, zero confirmation layers:

| # | Location | Code context |
|---|---|---|
| 1 | **Card row** | `<button class="btn-approve" … onclick="reviewDecisionUI('${type}','${id}','public')">Approve</button>` |
| 2 | **Inspect panel — top-actions** | `<button class="btn-approve review-inspect-approve" … onclick="reviewDecisionUI('${type}','${id}','public')">Approve</button>` |
| 3 | **Inspect panel — bottom-actions** | `<button class="btn-approve review-inspect-approve" … onclick="reviewDecisionUI('${type}','${id}','public')">Approve</button>` |

By contrast, **Reject** at every call site goes through `requestRejectReview(id)` first, which sets a pending state and forces an explicit "Confirm Reject" step before any API call is made.

**Asymmetry summary:**

| Action | Steps to fire API | Reversible in UI? |
|---|---|---|
| Approve | **1** (click) | Yes — reject the now-public item |
| Keep Pending | 1 (click, safe) | N/A |
| Reject | **2** (click + confirm click) | Yes — approve the now-rejected item |
| Mark Duplicate | 3 (click → modal → confirm) | No UI undo |
| Archive artefact | 2 (click + native `confirm()`) | No — D-92G gated |

---

## D. Risk Ranking by Action

| Rank | Action | Risk | Detail |
|---|---|---|---|
| 🔴 HIGH | Card-row Approve | Accidental publish — one click, no confirm, adjacent to Inspect button | Claim goes immediately public; no toast undo; reviewer must find item and reject to recover |
| 🔴 HIGH | Top-actions Approve before reading fields | Bypasses all advisory context — Origin Path, Review Advisory, Borderline Hint fields are below | Reviewer acts before seeing category-echo or borderline-origin warnings |
| 🟡 MEDIUM | Bottom-actions Approve | Low friction but reviewer has passed the fields — lower risk than top | Still one click; acceptable for experienced reviewer |
| 🟡 MEDIUM | Approve on a previously-rejected item | State bar shows "rejected" but Approve is still active with no warning | Re-publication of a deliberately hidden item |
| 🟡 MEDIUM | Approve Truth-Derived + category-echo from card row | Advisory badges visible on card, but still one click | `SMALL INDEFERENT TRUTH`-class claims can go public without the inspector ever opening |
| 🟢 LOW | Keep Pending | Safe — item stays in queue, no state escalation | One click acceptable; mistake is trivially reversed |
| 🟢 LOW | Reject | 2-step — `requestRejectReview` guard prevents accident | Well-designed |
| 🟢 LOW | Mark Duplicate | 3-step modal | Well-designed |
| 🟢 LOW | Archive artefact | 2-step + multi-guard (`isSuspectedTestArtefact` + rejected state) | Well-designed |

---

## E. Existing Hardening Test Coverage

From Section analysis of `scripts/hardening-smoke-test.mjs`:

**Covered:**
- `reviewDecisionUI` backend route tests: evidence branch, pressure branch, `recalcClaimScore` call after decision
- Cleanup gate guards (`CLEANUP_REQUIRES_REJECTED`, `CLEANUP_REQUIRES_TEST_ARTEFACT`)
- `archiveTruthArtefact` uses `confirm()` (D-92G)
- Review card does not contain backend calls (`reviewDecision`, `api(`)
- Top-actions Approve has `review-inspect-approve` class (D-95B)
- Truth-Derived advisory badges in review card (D-93D Section 38)
- `isClaimCategoryEcho` uses exact equality only (D-93E)
- `inspectReviewItem` calls `scrollIntoView` guarded by `if(inspectedReviewItem)` (D-95B)

**Not covered (relevant to D-96B):**
- No test verifies card-row Approve does NOT use a confirm dialog (current documented behavior, not tested)
- No test verifies that Approve on a Truth-Derived + category-echo item uses a soft guard
- No test verifies the top-actions Approve fires before the fields are in DOM order
- No test verifies a second pending-state mechanism exists for Approve (as `pendingRejectReviewId` does for Reject)

---

## F. Option Evaluation for D-96B

### Option A — `confirm()` before Approve on card row only
**Pattern:** `archiveTruthArtefact` already uses `if(!confirm('...'))return;` — established precedent in this codebase.
- Card-row Approve wraps with: `if(!confirm('Approve and publish "'+label+'"?'))return;`
- Inspect panel Approve unchanged (already has field context)
- **Pro:** Minimal change, targets the highest-risk path, consistent with archiveTruthArtefact pattern
- **Con:** Native `confirm()` is blocking and visually inconsistent with the rest of the UI; loses soft UX feel
- **Hardening tests:** ~2 (card-row Approve contains `confirm(`, inspect panel Approve does not)

### Option B — `confirm()` before ALL Approve actions
- All 3 call sites wrapped with `confirm()`
- **Pro:** Complete coverage
- **Con:** Adds friction to the two inspect-panel paths where reviewer has already seen the full context; inspect-panel Approve is the intended deliberate-decision path; double-confirming after reading all fields is annoying
- **Verdict:** Reject — too much friction for inspect-panel users

### Option C — Require Inspect before Approve for Truth-Derived/category-echo/borderline-origin claims only
- Disable card-row Approve for items where `isLikelyBorderlineDerivedClaim` fires; show tooltip "Inspect required for this item type"
- **Pro:** No friction for clean claims; targets only the risky subset
- **Con:** State-dependent disabled button adds complexity; tooltip may be missed; policy says advisory not gate; adds frontend logic that tests borderline heuristic before allowing an action
- **Verdict:** Reject — violates advisory-only policy; heuristic is not reliable enough to gate an action

### Option D — Disable card-row Approve for risky claims only, with tooltip/advisory
- Structural variant of Option C — same verdict
- **Verdict:** Reject for same reasons as C

### Option E — Remove card-row Approve entirely, require inspect panel
- No Approve button on card; reviewer must open panel first
- **Pro:** Forces context-reading before every approval
- **Con:** Breaks normal workflow for clearly-clean claims (wrong category, typo fix, obviously legitimate); every approval now requires two-step interaction; inspect panel adds scroll cost
- **Verdict:** Reject — too disruptive to normal moderation throughput

### Option F — Leave behavior unchanged, add stronger warning badges
- D-93D badges already live (`truth-derived`, `category-echo`, `? borderline origin`)
- Adding a 4th badge or making existing ones more prominent
- **Pro:** Zero code/behavior change
- **Con:** Does not address the asymmetry — reviewer has seen the badge and still clicks Approve immediately with no friction. Badges are already present and visible. More badges do not make the risk go away.
- **Verdict:** Reject for D-96B — badges are the right advisory layer but the click-path asymmetry still needs addressing

### Option G — 2-step pending state for card-row Approve only (mirrors the Reject pattern)
**Pattern mirrors `requestRejectReview` / `cancelRejectReview`.**

Card-row Approve becomes a 2-step flow exactly matching Reject:
1. First click → `requestApproveReview(id)` — sets `pendingApproveReviewId`, calls `renderReviewList()`
2. Card re-renders showing: `"Approve? This item will become public."` + `[Confirm Approve]` + `[Cancel]`
3. Confirm click → `reviewDecisionUI(type, id, 'public')` — actual API call
4. Cancel → `pendingApproveReviewId = null; renderReviewList()`

Inspect panel Approve (top + bottom): unchanged. Panel-based approval remains one click (reviewer chose to open the panel and read context).

- **Pro:** Perfect symmetry with Reject. No native dialog. Inline confirm shows label text. Reviewer can see what they are approving. Zero backend change. Consistent UX pattern already understood by reviewer. Inspect panel remains frictionless — deliberate review path unaffected.
- **Con:** One extra click for card-row Approve. Adds a pending-state variable and a few lines of JS.
- **Hardening tests:** ~4 (pendingApproveReviewId state var exists; card-row Approve calls requestApproveReview not reviewDecisionUI; Confirm Approve calls reviewDecisionUI with 'public'; card-row Approve confirm message contains 'public' or 'publish')

---

## G. Recommended D-96B Option

### **Option G — 2-step pending state for card-row Approve (mirrors Reject pattern)**

**Rationale:**

1. **Targets the highest-risk path precisely.** Card-row Approve (call site 1) is the dangerous case: adjacent to Inspect, reviewer has not seen fields, fires immediately. Inspect-panel Approve (call sites 2 and 3) is the deliberate-decision path — reviewer already chose to open the panel and read it.

2. **Matches established UX pattern.** The `requestRejectReview` / `cancelRejectReview` 2-step pattern is already understood by the reviewer, tested in the codebase, and visually consistent. Building the same pattern for Approve creates symmetry without introducing a new interaction model.

3. **No native `confirm()` dialog.** Inline state (like Reject does) is softer, less jarring, and does not block the browser event loop. The confirm message can show the item label, making it clear which item is being approved.

4. **Inspect-panel paths stay frictionless.** A reviewer who opens the inspect panel and reads Origin Path / Review Advisory / Borderline Hint should not be double-confirmed when they act from the panel. The panel is the context layer. Card-row is the shortcut.

5. **Policy-compliant.** No automatic blocking. No content-based gating. No advisory-to-action promotion. The heuristic helpers (`isLikelyBorderlineDerivedClaim` etc.) remain advisory — the guard is on the shortcut path, not on the item type.

6. **Minimal change.** Three new JS lines (state var, requestApproveReview, cancelApproveReview), one new `pendingApproveReviewId` state variable, a modified `reviewCard` to render the pending confirm UI, and ~4 new hardening tests.

---

## H. Proposed D-96B Specification

### Files to change

| File | Change |
|---|---|
| `public/app-v10.js` | 4 JS changes (see below) |
| `scripts/hardening-smoke-test.mjs` | ~4 new tests (Section 40) |

### JS changes

**1. State variable** — add alongside `pendingRejectReviewId`:
```js
let pendingApproveReviewId = null;
```

**2. New functions** — add alongside `requestRejectReview` / `cancelRejectReview`:
```js
function requestApproveReview(id) {
  pendingApproveReviewId = (pendingApproveReviewId === id) ? null : id;
  renderReviewList();
}
function cancelApproveReview() {
  pendingApproveReviewId = null;
  renderReviewList();
}
```

**3. Card-row Approve button** — change from direct call to request:
```js
// BEFORE:
<button class="btn-approve" title="Approve and publish to all users"
  onclick="reviewDecisionUI('${type}','${id}','public')">Approve</button>

// AFTER:
const isPendingApprove = pendingApproveReviewId === id;
const approveBtn = isPendingApprove
  ? `<span class="review-approve-confirm-msg">Approve? This item will become public.</span>
     <button class="btn-approve-confirm" onclick="reviewDecisionUI('${type}','${id}','public')">Confirm Approve</button>
     <button class="btn-approve-cancel" onclick="cancelApproveReview()">Cancel</button>`
  : `<button class="btn-approve" title="Approve and publish to all users"
       onclick="requestApproveReview('${id}')">Approve</button>`;
```

**4. `reviewDecisionUI` cleanup** — reset pending approve state on any decision:
```js
// add alongside: pendingRejectReviewId = null;
pendingApproveReviewId = null;
```

### Inspect panel — no change
`renderReviewInspectPanel` top-actions and bottom-actions Approve remain one-click. They call `reviewDecisionUI` directly, unchanged.

### CSS additions (styles.css)
```css
.review-approve-confirm-msg { color: var(--approve-green, #2fbf71); font-size: .82rem; font-weight: 600; }
.btn-approve-confirm        { /* match btn-approve green gradient */ }
.btn-approve-cancel         { /* match btn-reject-cancel muted style */ }
```
Alternatively reuse existing classes (`.btn-approve` for confirm, `.btn-reject-cancel` for cancel) — matching existing button style avoids adding CSS. To be determined in D-96B implementation.

---

## I. Proposed Hardening Tests (Section 40 — D-96B)

| # | Test |
|---|---|
| 40.1 | `pendingApproveReviewId` state variable is declared |
| 40.2 | `requestApproveReview` function is defined |
| 40.3 | `cancelApproveReview` function is defined |
| 40.4 | Card-row `btn-approve` button calls `requestApproveReview`, NOT `reviewDecisionUI` directly |
| 40.5 | Confirm Approve button calls `reviewDecisionUI` with `'public'` |
| 40.6 | `reviewDecisionUI` body resets `pendingApproveReviewId` |
| 40.7 | Inspect panel top-actions Approve still calls `reviewDecisionUI` directly (unchanged) |
| 40.8 | Inspect panel bottom-actions Approve still calls `reviewDecisionUI` directly (unchanged) |

---

## J. Rejected Options Summary

| Option | Rejected reason |
|---|---|
| B — `confirm()` all Approve | Too much friction for inspect-panel deliberate-review path |
| C — Require Inspect for borderline claims | Violates advisory-only policy; heuristic not reliable enough to gate |
| D — Disable card-row Approve for risky claims | Same as C |
| E — Remove card-row Approve entirely | Breaks normal workflow for clean claims; too disruptive |
| F — More badges only | Does not address click-path asymmetry; badges already live |
| A — `confirm()` on card row only | Functional but native `confirm()` is blocking / inconsistent with rest of UI; Option G is better-matched to existing UX patterns |

---

## K. Policy Constraints Preserved

| Constraint | How D-96B option respects it |
|---|---|
| No automatic blocking | Guard is on shortcut path, not on item type or content |
| No bulk moderation | No change to bulk behavior |
| No text-matching moderation | `isClaimCategoryEcho` etc. remain advisory-only; not used as gate |
| Borderline = advisory, not artefact | D-96B does not add any artefact-treatment to borderline claims |
| Socially real beliefs not auto-rejected | Card-row pending-approve does not reject anything; it gates the shortcut |
| Review actions on claims only | No Truth actions proposed |
| No mutation in this audit | Confirmed — no code/live/backend/D1/admin mutation performed |

---

## L. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **272 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |

---

## M. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated.
> `tru_67ae90e56f7449ee85` and `clm_30889d651e3b4b2cb6` are unchanged.
