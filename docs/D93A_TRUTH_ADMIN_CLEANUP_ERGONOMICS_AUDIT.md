# D-93A — Truth Admin Cleanup Ergonomics Audit

**Date:** 2026-06-08
**Scope:** Docs-only audit and implementation plan. No code changes.
**Static baseline:** 235 / 24 / 39

---

## A. What Worked Well in D-92G

### Admin-only artefact cleanup button
`truthCard` computes `isAdmin = !!adminToken()` and `artifact = isTruthArtifact(t)`. The button is rendered only when both are true. This means:
- Normal users see nothing different
- Admin users see a small orange "archive artefact" button only on cards already showing `? ARTEFACT`
- No accidental exposure to non-admin users

### Confirmation dialog
`archiveTruthArtefact(id)` calls `confirm('Archive this Truth artefact?\n\n"${statement}"\nID: ${id}\n\nThis will reject then archive it.')`. The exact statement text and full ID are shown before any mutation. This gave the operator a clear confirmation step and caught any potential mismatch.

### Exact ID usage
`t.id` from the truth data object is passed directly to `archiveTruthArtefact`. No text matching, no fuzzy lookup, no bulk loop. The function POSTs to:
1. `/api/review/decision` with `{targetType:'truth', targetId:id, decision:'rejected'}`
2. `/api/review/cleanup` with `{target_type:'truth', target_id:id, junk_override:true, reason:'Admin UI artefact cleanup'}`

### Reject-then-archive path
`reviewCleanup` requires `review_state='rejected'` before archiving. The sequential two-POST pattern respects this gate. If the reject fails, the archive POST never runs — failure surfaces as a toast.

### Safe preservation of real beliefs
The `isTruthArtifact` heuristic correctly did NOT flag any of the socially real or belief truths (People are stupid, Trust the experts, My religion is the only true path, etc.). `isTruthPersonalBelief` also correctly flagged Stoic Atheism as personal belief, not artefact, so no archive button appeared on that card.

---

## B. What Was Awkward

### Archive button visually undersized and easily missed

Current CSS:
```css
.btn-archive-artifact {
  font-size: 9px;
  padding: 1px 6px;
  opacity: .6;
  border: 1px solid #ff6b3533;   /* very low opacity border */
  color: #ff6b35cc;              /* medium opacity text */
}
```

9px font, opacity 0.6, with a nearly transparent border. In practice the button is very small and low-contrast against the card background. An operator scanning the page would likely miss it unless they knew to look. When `.truth-card-artifact` reduces the whole card to `opacity:.7`, the button gets even harder to see.

### No admin-mode banner on the Truths page

`renderReview()` shows a prominent "admin only" badge in a header bar. `renderTruths()` has no such indicator. When an operator loads the Truths page with admin token active, nothing signals that admin controls are present. The only difference is subtle: small full-ID code elements + a tiny orange button on a few cards. Easy to miss entirely.

### No artefact-only or admin-focused filter

The Truths page has no filter controls. To see only artefact-flagged cards, an operator must scroll the full Truths list. In D-92G's live test, there were ~16 remaining public truths — manageable now, but will degrade as the list grows.

No filter exists for:
- All truths with `? ARTEFACT` badge
- All truths with `personal belief` badge
- Admin-review candidates (borderline items like SMALL INDEFERENT TRUTH)

### No count of flagged artefacts

The Truths page section header shows `widely asserted · not auto-verified` badge but gives no count of how many cards are flagged as artefacts or personal beliefs. An operator entering the page blind has no quick signal about the current cleanup state.

### Borderline items are invisible to the heuristic

SMALL INDEFERENT TRUTH passed through `isTruthArtifact` without triggering. The operator had to manually identify it as likely junk. There is no "borderline" or "admin-review candidate" signal, so borderline items are indistinguishable from legitimate truths unless an operator reads every card.

---

## C. Heuristic Gap Analysis — SMALL INDEFERENT TRUTH

**Statement:** `SMALL INDEFERENT TRUTH`
**ID:** `tru_67ae90e56f7449ee85`

Current `isTruthArtifact` checks (from `public/app-v10.js` line 102):

```
1. s.length < 4               → "SMALL INDEFERENT TRUTH" = 22 chars   ❌ MISS
2. single generic word regex  → 3 words, not a single word             ❌ MISS
3. vowel ratio < 0.12         → S,M,A,L,L,I,N,D,E,F,F,E,R,E,N,T,T,R,U,T,H
                                 letters: smallindeferenttruth = 20
                                 vowels: a,i,e,e,u = 5
                                 ratio: 5/20 = 0.25                    ❌ MISS (>0.12)
4. repeated syllable regex    → (.{2,5})\1{2,} → no 2–5 char repeats  ❌ MISS
```

**What distinguishes SMALL INDEFERENT TRUTH as a likely artefact:**
- ALL CAPS — common signal for placeholder or test data
- 3 words, each ≤8 chars — typical "title-case placeholder" shape
- Total length 22 — short for a truth claim, but not <4
- No semantic content — the words combined carry no assertable meaning
- "INDEFERENT" is not a real English word — suggests typo or random generation

**None of these signals are currently tested.** The heuristic was designed for clearly mechanical artefacts (keyboard mash, syllable repetition, single placeholder word) and does not reach this slightly less obvious category.

---

## D. Proposed Options

### Option 1 — Improve button visibility only

Make `.btn-archive-artifact` larger and higher contrast. No logic change.

| | |
|---|---|
| **Effort** | Minimal — CSS only |
| **Solves** | Button hard to find |
| **Does not solve** | Borderline items invisible, no filter, no admin banner |
| **Risk** | Low |

### Option 2 — Admin-only "borderline artefact?" badge

Add a second helper `isTruthBorderlineArtefact(t)` that catches all-caps short multi-word phrases and similar patterns. Show an advisory `? borderline` badge (admin-only, not public). No archive button for borderline items — badge is advisory only.

| | |
|---|---|
| **Effort** | Small — new helper (~5 lines), new badge in `truthCard`, one CSS rule |
| **Solves** | SMALL INDEFERENT TRUTH would be flagged; operator can make a manual call |
| **Does not solve** | No filter, no admin banner, button still small |
| **Risk** | Low — advisory only, no action attached |

### Option 3 — Admin-only Truths filter chips

Add a filter bar to `renderTruths` (admin mode only) with chips: All / Artefacts / Borderline / Personal Belief / Clean. Renders only cards matching the active filter.

| | |
|---|---|
| **Effort** | Medium — filter state variable, filter function, filter bar HTML, module-level truths already available |
| **Solves** | Operator can jump straight to artefact cards; count visible per category |
| **Does not solve** | Button still small; no admin banner |
| **Risk** | Low — pure frontend, no data change |

### Option 4 — Admin inspect drawer for Truth cards

Add an "Inspect" button on every card (admin mode) that opens a drawer with full metadata + action controls, similar to `renderReviewInspectPanel` for the Review queue.

| | |
|---|---|
| **Effort** | Large — new panel component, new renderer, layout changes |
| **Solves** | Full metadata visible; richer admin context |
| **Does not solve** | Doesn't directly solve filter/banner problem |
| **Risk** | Low, but over-engineered for current need |

### Option 5 — Backend admin truth inventory route

Add `GET /api/admin/truths` returning all truths regardless of `review_state` with full metadata, for inventory/export.

| | |
|---|---|
| **Effort** | Medium — new Worker route, admin auth, frontend call |
| **Solves** | Full inventory export; useful for bulk review outside browser |
| **Does not solve** | UI ergonomics for in-browser cleanup |
| **Risk** | Low — admin-only route |

---

## E. Recommended D-93B — Smallest Safe Next Step

**D-93B: Frontend-only ergonomics polish (branch + PR)**

Combine Options 1 + 2 + partial 3. All frontend-only. No Worker change.

### 1. Admin-mode banner on Truths page

In `renderTruths`, when `adminToken()` is truthy, prepend a slim admin bar above the grid:
```
⚙ Admin mode — X artefact(s) flagged · Y borderline · Z personal belief
```
- Count computed from `truths.filter(isTruthArtifact).length`, etc.
- Styled like the Review page's admin bar but smaller
- Makes admin state visible immediately on page load

### 2. Larger, more visible archive button

Update `.btn-archive-artifact`:
```css
font-size: 10px;           /* up from 9px */
padding: 2px 8px;          /* up from 1px 6px */
opacity: .75;              /* up from .6 */
border: 1px solid #ff6b3566;  /* slightly more visible */
```
- Still subtle enough to not dominate the card
- Clearly readable without squinting

### 3. New helper `isTruthBorderlineArtefact(t)`

Detects all-caps multi-word short phrases and other borderline patterns:
```js
function isTruthBorderlineArtefact(t) {
  if (isTruthArtifact(t)) return false;  // already caught by strong signal
  const s = String(t.statement || '').trim();
  // All-caps multi-word phrase ≤ 5 words ≤ 40 chars
  if (
    s === s.toUpperCase() &&
    s.replace(/[^a-z]/gi, '').length > 3 &&
    s.split(/\s+/).length >= 2 &&
    s.split(/\s+/).length <= 5 &&
    s.length <= 40
  ) return true;
  // Non-word characters dominate (punctuation/symbol soup)
  const letters = s.replace(/[^a-z]/gi, '').length;
  if (s.length > 4 && letters / s.length < 0.5) return true;
  return false;
}
```
Catches: `SMALL INDEFERENT TRUTH`, `SOME RANDOM TEXT`, `ABC DEF GHI`

### 4. Admin-only `? borderline` badge

In `truthCard`, when `isAdmin && isTruthBorderlineArtefact(t)`:
```html
<span class="badge b-muted truth-borderline-badge">? borderline</span>
```
- Advisory only — no archive button for borderline items
- Yellow-grey color, clearly distinct from `? artefact` (amber) and `personal belief` (purple)

### 5. Admin-only Truths filter bar (simplified)

When `adminToken()` is truthy, show filter chips above the grid:
```
All (N)  |  Artefacts (N)  |  Borderline (N)  |  Personal (N)  |  Clean (N)
```
- Computed locally from `truths` array — no API call
- Active filter stored in a module-level variable `truthAdminFilter`
- On chip click, re-render grid with filtered truths (no reload)

### What D-93B explicitly does NOT include

- No archive button for borderline items — badge is advisory only
- No auto-clean on filter change
- No bulk action
- No hardcoded IDs
- No Worker change
- Stoic Atheism (`tru_53ee59f3fa4247f4be`) remains policy-deferred — do not add archive button to personal-belief cards

### D-93B hardening tests to add (~12 tests, 235→~247)

| # | Test |
|---|------|
| 1 | `isTruthBorderlineArtefact` helper exists |
| 2 | Helper does not flag already-caught artefacts |
| 3 | Helper flags all-caps multi-word short phrase |
| 4 | `truth-borderline-badge` class in JS |
| 5 | Borderline badge admin-only (not shown without `isAdmin`) |
| 6 | No archive button for borderline items |
| 7 | Admin banner rendered when `adminToken()` truthy |
| 8 | Admin banner includes artefact count reference |
| 9 | Admin filter chips rendered in admin mode |
| 10 | Filter does not mutate `truths` array |
| 11 | `truth-borderline-badge` CSS exists |
| 12 | `btn-archive-artifact` CSS opacity/padding increased |

---

## F. Future D-93C — Personal Belief / Profile Truths Policy

Three open policy questions deferred from D-92:

### 1. Stoic Atheism / Belief Engine Profile truths

Current state: `personal belief` badge, visible on public Truths page. No cleanup action taken.

Options:
- **A. Leave as-is with badge** — acceptable UX signal, low harm. Personal belief truths are marked and not verified.
- **B. Move to review state** — set `review_state='review'` so it no longer appears publicly. Requires admin action (reviewDecision). Non-destructive.
- **C. Add a "make private" admin button** — frontend button that sets to `review` without full archive. Softer than archiving.

Recommendation: Option B or C. A user's Belief Engine Profile output appearing on the public shared Truths page as a general-consumption truth is a product model mismatch. It should probably not be publicly visible by default. D-93C should decide this.

### 2. Drift "Save as Truth" default lane

Current behaviour (from D-92A audit): `promoteToTruth` inserts `review_state='review'` — so Belief Engine–originated truths enter review first. But at some point they were approved to `public` (or they defaulted to public via an older flow).

Decision needed: should Belief Engine or Drift-sourced truths enter a separate `personal` lane and never auto-appear on the public Truths page? This would require a new `review_state` value (e.g. `'personal'`) or a `visibility` column.

### 3. Should personal-belief truths be public at all?

The current product model treats the public Truths page as a collection of shared/societal truths ("statements that circulate as fact"). A personal belief engine output ("My belief profile is Stoic Atheism") does not belong in the same lane.

Recommendation: add a `truth_visibility` field or use `review_state='personal'` as a non-public, non-archived state. This is a backend schema change (D-93D) and is out of scope for D-93B.

---

## G. Files Inspected

| File | Key observations |
|------|-----------------|
| `public/app-v10.js` line 102 | `isTruthArtifact` — four signals; no all-caps multi-word check |
| `public/app-v10.js` line 104 | `archiveTruthArtefact` — good sequential POST pattern; no hardcoded IDs |
| `public/app-v10.js` line 105 | `truthCard` — `isAdmin&&artifact` gate correct; button placement fine; button CSS undersized |
| `public/app-v10.js` line 100 | `renderTruths` — no admin-mode indicator; no filter bar |
| `public/styles.css` lines 163–165 | `.btn-archive-artifact` — `font-size:9px`, `opacity:.6`, very light border — needs visibility improvement |
| `docs/D92H_TRUTH_ARTEFACT_CLEANUP_LIVE_OUTCOME.md` | Confirmed SMALL INDEFERENT TRUTH heuristic miss; token rotation recommendation |

---

## H. D-93B Implementation Checklist

For the next session:

- [ ] `git checkout -b fix/d93b-truth-admin-ergonomics`
- [ ] Add `isTruthBorderlineArtefact(t)` helper in `public/app-v10.js`
- [ ] Add `truth-borderline-badge` to `truthCard` (admin-only)
- [ ] Add admin banner to `renderTruths` with per-category counts
- [ ] Add admin filter chips to `renderTruths`
- [ ] Increase `.btn-archive-artifact` size/opacity in `public/styles.css`
- [ ] Add `.truth-borderline-badge` CSS
- [ ] Section 37 hardening smoke tests (~12 tests, 235→~247)
- [ ] Update `docs/README.md` count
- [ ] Create `docs/D93B_TRUTH_ADMIN_ERGONOMICS.md`
- [ ] Update `docs/PROJECT_STATE.md`
- [ ] `git commit -m "fix: improve Truth admin cleanup ergonomics"`
- [ ] PR to main
