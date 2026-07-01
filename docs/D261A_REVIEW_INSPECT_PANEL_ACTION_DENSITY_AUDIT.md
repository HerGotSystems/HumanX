# D-261A — Review Inspect Panel Action Density Audit

**Scope:** Docs + optional tiny guard tests
**Status:** COMPLETE — no deploy needed
**Baseline:** 2959 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D261A_REVIEW_INSPECT_PANEL_ACTION_DENSITY_AUDIT.md`, `docs/README.md`
**CSS changes:** None
**App changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit the Review inspect panel action buttons before any CSS/layout changes. Addresses D-258A F-3 MEDIUM: "6-7 inspect action buttons stack as tall column on mobile — primary moderation, duplicate/similar, destructive, and study actions are undifferentiated." This audit documents the exact current state, identifies concrete risks, and recommends the safest D-261B implementation.

---

## 1. Current Inspect Action Inventory

### 1a. Primary moderation actions (always present for any item in inspect panel)

| Label | Class | Function called | When | Category |
|-------|-------|-----------------|------|----------|
| `Approve` | `btn-approve review-inspect-approve` | `requestApproveReview(id)` | Always (normal state) | Primary/safe |
| `Confirm approve public ✓` | `btn-approve-confirm review-inspect-approve` | `reviewDecisionUI(type,id,'public')` | Only when approve armed | Confirm/safe |
| `Cancel` | `btn-approve-cancel` | `cancelApproveReview()` | Only when approve armed | Cancel |
| `Keep Pending` | `btn-keep` | `reviewDecisionUI(type,id,'review')` | Always | Primary/neutral |
| `Reject` | `review-inspect-reject` | `requestRejectReview(id)` | Always (normal state) | Destructive |
| `Confirm Reject` | `btn-reject-confirm` | `reviewDecisionUI(type,id,'rejected')` | Only when reject armed | Confirm/destructive |
| `Cancel` | `btn-reject-cancel` | `cancelRejectReview()` | Only when reject armed | Cancel |

### 1b. Archive (destructive, conditional)

| Label | Class | Function called | When | Category |
|-------|-------|-----------------|------|----------|
| `Archive test artefact` | `review-inspect-cleanup` | `requestCleanupReview(id)` | Only for rejected test artefacts (`isSuspectedTestArtefact`) | Destructive/advisory |
| `Confirm Archive` | `btn-cleanup-confirm` | `reviewCleanupUI(type,id)` | Only when cleanup armed | Confirm/destructive |
| `Cancel` | `btn-cleanup-cancel` | `cancelCleanupReview()` | Only when cleanup armed | Cancel |

### 1c. Duplicate/similar actions (conditional — claims only)

| Label | Class | Function called | When | Category |
|-------|-------|-----------------|------|----------|
| `Mark Duplicate...` | `review-inspect-markdup` | `markDuplicateUI(id)` | Claims only; absent if `isTruth`, `isEvidence`, `isPressure`, `state==='archived'`, `state==='duplicate'` | Duplicate/advisory |
| `Dismiss ~Similar` | `review-inspect-resolvesim` | `resolveSimilarUI(id)` | Claims only; only when `nearDup` is set (`near_duplicate_of`) | Duplicate/advisory |

### 1d. Study/navigation (conditional by type)

| Label | Class | Function called | When | Category |
|-------|-------|-----------------|------|----------|
| `Open Study View ↗` | `primary btn-study-review` | `openReviewClaimStudy(id)` | Claims (`!isTruth`) | Navigation/study |
| `Study Parent Claim ↗` | `btn-study-review` | `openReviewClaimStudy(item.claim_id)` | Evidence/pressure with `claim_id` | Navigation/study |
| `Study Linked Claim ↗` | `btn-study-review` | `openReviewClaimStudy(linked_claim_id)` | Truths with a linked public claim | Navigation/study |

### 1e. Actions in FIELDS area (not in action row)

| Label | Class | Function called | When | Category |
|-------|-------|-----------------|------|----------|
| `Use as duplicate target` | `review-similar-use-dup-btn` | `markDuplicateUI(id, nearDupId)` | Claims only; only when `nearDup` set | Duplicate/prefill |
| `↗ Study` (advisory) | `btn-link-small` | `openReviewClaimStudy(nearDup)` | Claims with `nearDup` | Study link |
| `Copy ID` | `review-similar-copy-btn` | `copySimilarClaimId(nearDup)` | Claims with `nearDup` | Advisory utility |

### 1f. Inspect nav (above action row)

| Label | Class | When |
|-------|-------|------|
| `← Prev` | `review-nav-btn` | When previous item exists in filtered list |
| `Next →` | `review-nav-btn` | When next item exists in filtered list |
| `{N} of {M}` (position) | `review-nav-pos` | Always |
| Keyboard hint row | `review-kb-hint` | Always |

### 1g. Feedback banner (rendered in `renderReviewList`, not `renderReviewInspectPanel`)

| Label | Class | When |
|-------|-------|------|
| `Open next item →` | `review-feedback-next` | After approve/reject when next item exists |
| `Dismiss` | `review-feedback-dismiss` | When feedback is active |

### 1h. Card-level actions (in `reviewCard`, visible in queue — separate from inspect panel)

| Label | Class | When |
|-------|-------|------|
| `Inspect` / `▲ Inspecting` | `btn-inspect` | Always on card |
| `Approve` | `btn-approve` | Card — hidden when item is inspecting |
| `Keep Pending` | `btn-keep` | Card — hidden when item is inspecting |
| `Reject` | `btn-reject` | Card — hidden when item is inspecting |

---

## 2. Current Grouping / Layout Behavior

### HTML structure

All inspect-panel actions (primary moderation + archive + duplicate/similar + study) are flat siblings in a **single `div.review-inspect-actions`**:

```
div.review-inspect-actions [+ review-confirm-armed when armed]
  ├── Approve  (or Confirm approve + Cancel)
  ├── Keep Pending
  ├── Reject   (or Confirm Reject + Cancel)
  ├── Archive test artefact   [conditional]
  ├── Mark Duplicate...       [conditional]
  ├── Dismiss ~Similar        [conditional]
  └── Open Study View ↗       [conditional]
```

**No sub-groups, no dividers, no labels between groups.**

### CSS behavior (≥601px desktop)

```css
.review-inspect-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  border-top: 1px solid var(--line);
  padding-top: 7px;
  margin-top: 2px;
}
.review-inspect-actions button {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}
```

On desktop: buttons wrap freely as a horizontal flex row. Color-coding provides some visual differentiation:
- Approve: green gradient
- Keep Pending: dark/neutral
- Reject: red gradient
- Archive test artefact: amber
- Mark Duplicate...: purple
- Dismiss ~Similar: blue
- Study: red/purple gradient

### CSS behavior (≤600px mobile — confirmed by line 318)

```css
@media(max-width:600px) {
  .review-inspect-actions { flex-direction: column; }
  .review-inspect-top-actions { flex-direction: column; }  /* dead class — never emitted */
}
```

On mobile: all buttons stack as a **single tall column** with `gap:5px`. No grouping, no separators, no width rules. A typical claim with `near_duplicate_of` gets:

1. Approve (green)
2. Keep Pending (dark)
3. Reject (red)
4. Mark Duplicate... (purple)
5. Dismiss ~Similar (blue)
6. Open Study View ↗ (red/purple)

= **6 buttons stacked**, 48px–60px each ≈ **290–360px of action column**.

For a rejected test artefact claim with near_duplicate_of: **7 buttons**, ≈ **340–420px**.

### Dead class: `.review-inspect-top-actions`

`.review-inspect-top-actions { flex-direction: column }` appears in the ≤600px media rule but the class is **never emitted** by any function in `app-v10.js`. It is a dead CSS rule from a prior iteration. Does not cause bugs but adds confusion.

---

## 3. Narrow-Width Risk Findings

### F-1 HIGH — Single flat column: no visual break between primary and advisory actions

**Evidence:** At ≤600px, `flex-direction:column` on `.review-inspect-actions` stacks all 5–7 buttons in one uninterrupted column. Primary moderation (Approve/Keep/Reject) is immediately adjacent to advisory/duplicate actions (Mark Duplicate.../Dismiss ~Similar) and study navigation (Study ↗) with only background color distinguishing them.

**Risk:** Moderator under time pressure may mis-tap an advisory action (Mark Duplicate...) expecting the next moderation action (Keep Pending / Reject). No structural cue between groups.

### F-2 MEDIUM — No structural action grouping in HTML

**Evidence:** All actions share one `div.review-inspect-actions`. No wrapper divs, no `<hr>`, no `role="group"`, no `aria-label` grouping.

**Risk:** Any future CSS change that flattens the column back to a row will lose even the color-coding separation. Color alone is fragile as a grouping signal.

### F-3 MEDIUM — Dead `.review-inspect-top-actions` mobile rule

**Evidence:** Line 318 of `styles.css` contains `.review-inspect-top-actions{flex-direction:column}` in the ≤600px block. No function emits this class.

**Risk:** Low but adds confusion — future maintainers may search for this class and find nothing, or may introduce it in markup thinking it's active, which would double-apply `flex-direction:column` on a container that doesn't need it.

### F-4 MEDIUM — Long label buttons without mobile width guarantee

**Evidence:** `"Mark Duplicate..."`, `"Dismiss ~Similar"`, `"Archive test artefact"` are 14–22 chars vs `"Approve"` at 7 chars. At ≤600px column layout, all buttons inherit `width: auto` and stretch to the container width. If the inspect panel is narrower than expected (heavy padding, border-box), long-label buttons could clip or overflow.

**Risk:** No explicit `width:100%` or `min-width` on inspect actions in mobile. Buttons rely on implicit stretch from `flex-direction:column` and container width.

### F-5 LOW — Study button class inconsistency

**Evidence:** For claims, the study button is `class="primary btn-study-review"` (has `primary`). For evidence/pressure with a parent claim, it is `class="btn-study-review"` (no `primary`). The `primary` class has no Review-specific CSS rule — its effect depends on a base `.primary` selector that may or may not match.

**Risk:** Cosmetic inconsistency; low impact.

### F-6 LOW — Card-level `review-actions` also goes column on mobile

**Evidence:** Line 318: `.review-actions{flex-direction:column}` — the card-level Inspect/Approve/Keep/Reject row also stacks on mobile. Since D-258A already documented this (F-3 note) and it's for cards rather than the inspect panel, this audit notes it as already known. Out of D-261 scope.

---

## 4. Behavior Boundaries That Must Not Break

Any D-261B implementation must preserve all of the following:

| Boundary | Lock |
|----------|------|
| Approve → `requestApproveReview(id)` → `reviewDecisionUI(type,id,'public')` | D-231A + D-243A |
| Keep Pending → `reviewDecisionUI(type,id,'review')` | D-231A |
| Reject → `requestRejectReview(id)` → `reviewDecisionUI(type,id,'rejected')` | D-231A |
| Archive → `requestCleanupReview(id)` → `reviewCleanupUI(type,id)` | D-231A |
| Mark Duplicate... → `markDuplicateUI(id)` — prefill only, no auto-submit | D-237A |
| Dismiss ~Similar → `resolveSimilarUI(id)` — does not approve/reject/merge | D-237A |
| Use as duplicate target → `markDuplicateUI(id, nearDupId)` | D-237A |
| Study → `openReviewClaimStudy(id/claim_id/linked_claim_id)` | D-240A |
| Inspect prev/next uses `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` | D-259A |
| Open next item → navigation only | D-243A |
| Confirm-state clarity: `data-review-confirming`, `review-confirm-armed` | D-229A / D-231A |
| Scroll preservation: `withReviewScrollPreserved` wraps filter/sort re-renders | D-228A / D-231A |
| Back-to-Review scroll restore | D-239B / D-240A |
| `Dupes + Similar` label | D-256B |
| All D-245→D-260 regression locks | D-248A / D-254A / D-259A |
| No public profile exposure | D-231A / D-237A / D-240A / D-248A / D-254A / D-259A |
| No backend/API/migration/schema/CSP changes | All arcs |

---

## 5. Recommended D-261B Code Slice

### Preferred: CSS-only inspect action visual grouping

Add a CSS-only visual separator before the duplicate/similar group and study button, without changing markup.

**Target selector pattern:** Use the existing color-coded classes (`.review-inspect-markdup`, `.review-inspect-resolvesim`, `.btn-study-review`) to add `margin-top` and `border-top` when these buttons appear in the actions container.

```css
/* D-261B: Visual separator before duplicate/advisory actions */
.review-inspect-actions .review-inspect-markdup,
.review-inspect-actions .review-inspect-resolvesim {
  /* If Mark Duplicate is first in the dup group, add top margin */
}

/* D-261B: Visual separator before study navigation */
.review-inspect-actions .btn-study-review {
  margin-left: auto; /* push Study to right on desktop */
}

@media(max-width:600px) {
  .review-inspect-actions .btn-study-review {
    margin-left: 0;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .review-inspect-actions button {
    width: 100%; /* explicit full-width in column */
  }
}
```

**Challenge:** Because `Mark Duplicate...` and `Dismiss ~Similar` are conditionally rendered, a `margin-top` on `.review-inspect-markdup` only works as a separator when that button is actually present. If only `Dismiss ~Similar` appears (no Mark Duplicate), `review-inspect-resolvesim` would need the same separator treatment.

**Simplest safe slice:** Add `margin-left:auto` to `.btn-study-review` inside the inspect actions on desktop (pushes Study to far right of the row, creating a natural visual gap), plus explicit `width:100%` for mobile column buttons. This is the smallest change with the clearest visual benefit.

**Second simplest:** Add `margin-top:8px;border-top:1px solid rgba(255,255,255,.06)` to both `.review-inspect-markdup` and `.review-inspect-resolvesim` — creates a soft visual separator above the dup/similar group whenever either button appears.

### What D-261B must NOT do

- Change `onclick` handlers, `data-action` attributes, or function calls
- Change button labels (copy is locked)
- Change confirm-state logic (`data-review-confirming`, `review-confirm-armed`)
- Change `renderReviewInspectPanel` markup structure
- Add new action buttons
- Change scroll behavior
- Touch `public/app-v10.js` beyond any absolutely required CSS class addition
- Touch `src/worker.js`
- Touch `public/belief-drift-expansion.js`
- Touch `public/index.html`

### Deferred alternatives

| Option | Notes |
|--------|-------|
| D-262A: Duplicate/similar action grouping copy audit | If label clarity ("Mark Duplicate...", "Dismiss ~Similar") is a problem independent of layout |
| D-263A: Destructive action spacing audit | If Archive needs stronger visual separation from normal actions |
| D-261B-markup: Wrap actions in sub-groups | Adding `<div class="review-inspect-action-group">` wrappers — more structural but higher risk; needs more extensive testing |

---

## 6. Test Recommendations for D-261B

When D-261B is implemented, add smoke tests for:

1. `.review-inspect-actions` CSS rule exists with `flex-wrap`
2. `.review-inspect-markdup` CSS rule exists (existing lock)
3. `.review-inspect-resolvesim` CSS rule exists (existing lock)
4. `.btn-study-review` CSS rule exists
5. `Mark Duplicate...` button label in `renderReviewInspectPanel` — copy lock
6. `Dismiss ~Similar` button label in `renderReviewInspectPanel` — copy lock
7. `Open Study View ↗` / Study button present in `renderReviewInspectPanel`
8. `review-inspect-approve` class still present in `renderReviewInspectPanel`
9. `review-inspect-reject` class still present in `renderReviewInspectPanel`
10. `btn-keep` still present in `renderReviewInspectPanel`
11. `requestApproveReview` still called from inspect panel
12. `requestRejectReview` still called from inspect panel
13. `reviewDecisionUI` still called for Keep Pending
14. `markDuplicateUI` still called from `review-inspect-markdup`
15. `resolveSimilarUI` still called from `review-inspect-resolvesim`
16. `review-confirm-armed` behavior preserved (data-action/confirm structure)
17. Inspect prev/next still uses search-aware pipeline (D-259A existing lock)
18. No D-261B in `public/app-v10.js` (CSS-only lock)
19. No D-261B in `src/worker.js`
20. No D-261B in `public/belief-drift-expansion.js`
21. `.review-inspect-markdup` not in `renderPublicProfileHtml`
22. `.review-inspect-resolvesim` not in `renderPublicProfileHtml`

---

## 7. Boundaries

- D-261A is audit/docs only.
- No frontend CSS, JS, or markup change.
- No backend/API/schema change.
- No public profile exposure.
- No Drift/Belief expansion changes.
- No live deploy needed.
- Dead class `.review-inspect-top-actions` is documented here but not removed — removal is safe and deferred to D-261B or a cleanup task with owner approval.

---

## Prior Locks Inventory

| Lock | What it covers | Must be preserved |
|------|---------------|-------------------|
| D-229A / D-231A | Confirm-state clarity, `data-review-confirming`, `review-confirm-armed` | ✓ |
| D-231A | All 7 review ergonomics test categories | ✓ |
| D-237A | Duplicate advisory workflow (41 tests) | ✓ |
| D-240A | Review-to-Study navigation (30 tests) | ✓ |
| D-243A | Next-item flow (34 tests) | ✓ |
| D-248A | Card metadata density (41 tests) | ✓ |
| D-254A | Search/filter clarity (64 tests) | ✓ |
| D-259A | Mobile control wrapping (35 tests) | ✓ |

---

## Privacy / Public Boundary

All inspect panel action classes (`review-inspect-approve`, `review-inspect-reject`, `review-inspect-markdup`, `review-inspect-resolvesim`, `review-inspect-cleanup`, `btn-study-review`) are absent from `renderPublicProfileHtml`. Review inspect panel is admin-only. D-261A makes no public profile changes.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-261A.

---

## No Backend / API / Migration Changes

D-261A is audit/docs only. Zero changes to `src/worker.js`, `wrangler.toml`, migrations, schema, CSP, or external assets.
