# D-234A — Similar Advisory Display Clarity

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — D-234B live sanity PASS
**Baseline:** 2448 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D234A_SIMILAR_ADVISORY_DISPLAY_CLARITY.md`, `docs/README.md`
**App UI changes:** Yes — inspect panel banner, Similar claim field, resolveSimilarUI modal copy
**CSS changes:** Yes — `.review-similar-note` restructured; new sub-classes added
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes — owner deploy complete (D-234B)

---

## Purpose

Make the existing near-duplicate/similar-claim advisory easier to read and understand in the review queue. Addresses D-233A audit findings F-2 and F-4: the advisory was visually present but the copy did not guide the moderator, and the dismiss modal did not explain what the action does.

This is a copy and visual clarity change only — no duplicate semantics, backend data, or moderation actions changed.

---

## D-233A findings addressed

### F-2: Similar claim advisory shows raw ID only — easy to miss

Old inspect panel banner:
```
~similar  This claim was automatically flagged as similar to an existing claim. This is advisory — no automatic merge or action has occurred. Use Approve, Keep Pending, or Reject as normal.
```

Old Similar claim field value:
```
clm_abc123 ↗
```

**Problems:** Single-line flat copy gave no structural hierarchy. The "Similar claim (advisory)" field just showed a bare ID with an external link; no label explaining what the ID was.

### F-4: `resolveSimilarUI` modal shows raw ID but needs clearer advisory meaning

Old modal body:
```
Dismiss the similarity advisory linking this claim to `clm_abc123`.
No state change, no merge, no delete — the claim stays in Review.
```

**Problem:** Did not explicitly say "does not approve, reject, or merge." A moderator could misread this as a soft approval or data-change action.

---

## Changes made

### 1. Inspect panel advisory banner (`renderReviewInspectPanel`)

**Old:** `<p class="review-similar-note">` — flat `<p>` tag, badge and text inline

**New:** `<div class="review-similar-note">` with two children:
- `<div class="review-similar-note-head">` — badge + "Similar claim advisory" label
- `<p class="review-similar-body">` — explanatory copy

**New copy:**
> "This claim was automatically flagged as similar to an existing claim. Advisory only — no automatic merge or action has occurred. Review manually before deciding — normal moderation actions still apply."

Changes from old copy:
- "This is advisory" → "Advisory only"
- "Use Approve, Keep Pending, or Reject as normal." → "Review manually before deciding — normal moderation actions still apply."
- Added structured `review-similar-label` header "Similar claim advisory"

### 2. Inspect panel `Similar claim (advisory)` field

**Old:** `<button class="btn-link-small" onclick="openReviewClaimStudy('...')">clm_abc123 ↗</button>`

**New:** `<span class="review-similar-id">Possible related claim: <button ...>clm_abc123 ↗</button></span>`

Changes:
- Wraps the button in `review-similar-id` span
- Prefixes with "Possible related claim:" label text
- Raw claim ID remains visible
- `openReviewClaimStudy` link and ↗ icon unchanged

### 3. `resolveSimilarUI` modal body

**Old:**
```
Dismiss the similarity advisory linking this claim to `clm_abc123`.
No state change, no merge, no delete — the claim stays in Review.
```

**New (three short paragraphs):**
```
Dismiss the similar-claim advisory for this review item?

Possible related claim: `clm_abc123`

This does not approve, reject, or merge the claim — only the advisory flag is cleared. The claim stays in Review.
```

Changes:
- "Dismiss the similarity advisory" → "Dismiss the similar-claim advisory for this review item?"
- Separates the "Possible related claim" ID onto its own line for readability
- Third paragraph explicitly says "does not approve, reject, or merge" — addresses F-4
- Adds `review-similar-dismiss-note` class to the clarification paragraph

### 4. CSS additions

`.review-similar-note` restructured to column flex (was row flex):

```css
/* D-234A: similar advisory display clarity */
.review-similar-note{display:flex;flex-direction:column;gap:4px; ...}
.review-similar-note-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.review-similar-label{font-size:11px;font-weight:600;color:var(--muted)}
.review-similar-body{margin:2px 0 0;font-size:11px;color:var(--muted);line-height:1.4}
.review-similar-id{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px}
.review-similar-dismiss-note{color:var(--muted)}
```

Background, border, border-radius, padding, margin unchanged. Amber color palette unchanged.

---

## What did NOT change

- `near_duplicate_of` semantics: still advisory only
- `duplicate_of` semantics: unchanged
- `applyReviewFilter` `~Similar` filter: still filters by `near_duplicate_of` only
- `applyReviewSort` `~Similar first`: unchanged
- `markDuplicateUI` behavior and copy: unchanged
- `resolveSimilarUI` API route: `/api/review/resolve-similar` — unchanged
- `resolveSimilarUI` confirm label: "Dismiss Advisory" — unchanged
- `resolveSimilarUI` success path: unchanged (closes, toasts, reloads queue, scrolls to anchor)
- `reviewCard` `~similar` badge and `review-card-similar` class: unchanged
- `rc-chip-dup` chip for `duplicate_of`: unchanged
- All normal moderation actions (Approve/Keep/Reject): unchanged
- `b-similar` color: unchanged
- `review-card-similar` amber border: unchanged
- Raw claim ID: still visible in both inspect panel field and dismiss modal
- Worker, CSP, public profile, backend: all unchanged

---

## Window slice fixes required

D-234A added ~220 chars of HTML to `renderReviewInspectPanel` (the review-similar-note restructuring + Similar claim field wrapper), pushing existing test slice windows past their limits. Two pairs of D-129B/C tests fixed:

| Test | Old window | New window | Reason |
|------|-----------|-----------|--------|
| `D-129B: inspect panel has exactly one review-inspect-actions row` | `idx+12000` | `idx+13500` | review-similar-note expansion pushes actions past 12000 |
| `D-129C: D-129B single action row preserved` | `idx+12000` | `idx+13500` | same |
| `D-129B: bottom action row has Approve, Keep Pending, Reject, and Mark Duplicate` | `idx+13000` | `idx+13500` | `${studyBtn}` now at offset 13003 |
| `D-129B: Open Study View still present in bottom action row` | `idx+13000` | `idx+13500` | `${studyBtn}` now at offset 13003 |

One D-233B test also updated: "modal copy unchanged — 'Dismiss the similarity advisory'" updated to match D-234A copy change (now OR-checks old and new copy for soft compatibility).

---

## Tests added (18 new, 4 window fixes, 1 D-233B update)

| Test | What it confirms |
|------|-----------------|
| `inspect panel advisory banner now says "Similar claim advisory"` | New label present |
| `inspect panel advisory banner still has review-similar-note class` | CSS hook not removed |
| `inspect panel advisory banner now uses review-similar-note-head` | Structured head row |
| `inspect panel advisory banner now includes "Review manually before deciding"` | Guidance copy |
| `inspect panel advisory banner includes "normal moderation actions still apply"` | Advisory framing |
| `inspect panel "Similar claim" field prefixes with "Possible related claim:"` | Field prefix copy |
| `inspect panel still emits review-similar-id class on field value` | CSS hook present |
| `inspect panel similar field still links to openReviewClaimStudy (raw ID visible)` | ID preserved, link intact |
| `resolveSimilarUI modal now says "Dismiss the similar-claim advisory"` | Updated modal title |
| `resolveSimilarUI modal now says "does not approve, reject, or merge"` | F-4 addressed |
| `resolveSimilarUI modal still shows the near_duplicate_of ID` | ID remains visible |
| `resolveSimilarUI still posts to /api/review/resolve-similar` | Route unchanged |
| `near_duplicate_of still used in applyReviewFilter` | Semantics unchanged |
| `review-similar-note CSS class present in styles.css` | Not removed |
| `review-similar-note-head CSS class present in styles.css` | New sub-class |
| `review-similar-body CSS class present in styles.css` | New sub-class |
| `review-similar-id CSS class present in styles.css` | New sub-class |
| `renderPublicProfileHtml does not include similar advisory CSS classes` | No public exposure |
| `deploy integrity — worker.js unchanged` | Worker not modified |

**Hardening smoke:** 2448 passed / 0 failed (+19 new tests net, 4 window fixes, 1 D-233B update)

---

## Live sanity checklist — D-234B PASS

- [x] Deploy to production via owner terminal
- [x] Open Review queue — find a claim with `~similar` badge
- [x] Inspect the claim — advisory banner shows "Similar claim advisory" label and "Review manually before deciding" copy
- [x] Advisory banner still uses amber background/border (not red/green)
- [x] `Similar claim (advisory)` inspect field now shows "Possible related claim: clm_abc123 ↗"
- [x] Raw claim ID still visible in the field
- [x] Click "Dismiss ~Similar" — modal now says "Dismiss the similar-claim advisory for this review item?"
- [x] Modal shows "Possible related claim: clm_abc123" on its own line
- [x] Modal says "This does not approve, reject, or merge the claim"
- [x] Confirm dismiss — advisory clears, page scrolls to anchor (D-233B parity)
- [x] Normal Approve/Keep/Reject actions unchanged
- [x] Mark Duplicate modal unchanged
- [x] `~similar` badge on card unchanged
- [x] Public profile pages do not contain review-similar-note or review-similar-advisory
- [x] No console errors

**Live sanity result:** 15/15 PASS (D-234B, 2026-06-29)

---

## Confirmations

- **App changed:** Yes — inspect panel banner, Similar claim field, resolveSimilarUI modal copy
- **CSS changed:** Yes — `.review-similar-note` restructured + 5 new sub-classes
- **Worker unchanged:** Confirmed
- **No new public data fields:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No duplicate/advisory semantics change:** Confirmed
- **No merge/canonical behavior added:** Confirmed
- **Raw ID remains visible:** Confirmed
- **No public profile exposure:** Confirmed
- **Deploy needed:** Yes — owner deploy complete (D-234B)
- **Owner deploy:** PASS
- **Live similar-advisory sanity:** PASS — inspect panel advisory banner shows "Similar claim advisory" label + "Review manually before deciding"; Similar claim field shows "Possible related claim: {id}"; dismiss modal says "Dismiss the similar-claim advisory" + "does not approve, reject, or merge"
- **Raw ID remains visible:** PASS — raw claim ID visible in inspect panel field and dismiss modal
- **Advisory-only semantics unchanged:** Confirmed
- **No merge/canonical behavior:** Confirmed
- **Resolve-similar scroll from D-233B:** Confirmed intact
- **Normal moderation actions (Approve/Keep/Reject):** Confirmed unchanged
- **D-227B selected-card anchor:** Confirmed intact
- **D-228A scroll preservation:** Confirmed intact
- **D-229A confirm-state clarity:** Confirmed intact
- **D-230A decision feedback:** Confirmed intact
- **No public profile exposure:** Confirmed
- **Hardening smoke:** 2448 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)
- **D-234B live sanity:** 15/15 PASS
