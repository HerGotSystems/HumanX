# D-236A — Similar Advisory Duplicate-Target Prefill

**Scope:** App + CSS + tests + docs
**Status:** COMPLETE — D-236B live sanity PASS
**Baseline:** 2485 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D236A_SIMILAR_ADVISORY_DUPLICATE_TARGET_PREFILL.md`, `docs/README.md`
**App UI changes:** Yes — "Use as duplicate target" button in inspect panel; `markDuplicateUI` optional prefill param
**CSS changes:** Yes — 4 new classes
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes — owner deploy complete (D-236B)
**Implementation HEAD:** 3136539

---

## Purpose

Complete the duplicate-workflow friction reduction arc (D-233A F-1). After D-235A made the similar-claim ID copyable, D-236A closes the loop: a "Use as duplicate target" button opens the existing `markDuplicateUI` modal with the advisory ID already prefilled in the canonical target field. The moderator still must explicitly confirm — nothing is auto-marked.

---

## D-233A finding addressed (F-1)

> **F-1: `markDuplicateUI` requires manually typing the canonical ID**
>
> The moderator must already know or have copied the target claim ID before opening the modal. There is no search, no suggestion, no lookup.
>
> **Impact:** High. Moderator must context-switch out of the review queue to find the canonical ID.

D-235A gave a Copy ID button (paste into the modal). D-236A goes further: the "Use as duplicate target" button pre-fills the modal directly.

---

## User-visible behavior

### Inspect panel — `Similar claim (advisory)` field

Before D-236A:
```
Possible related claim:  clm_abc123  [↗ Study]  [Copy ID]
                         Prefills the duplicate form — does not mark anything by itself.  (missing)
```

After D-236A:
```
Possible related claim:  clm_abc123  [↗ Study]  [Copy ID]
                         [Use as duplicate target]  Prefills the duplicate form — does not mark anything by itself.
```

### `markDuplicateUI` modal when opened via "Use as duplicate target"

The modal shows all existing fields plus:
- A note: "Pre-filled from similar-claim advisory — confirm the ID below before marking."
- The "Canonical target claim ID" input pre-filled with `clm_abc123`

The moderator can edit or clear the pre-filled ID before confirming. The "Mark Duplicate" button only fires after explicit click. The backend call only happens inside `onConfirm`.

### Existing "Mark Duplicate..." button in `dupSection`

The existing button (`review-inspect-markdup`) calls `markDuplicateUI(claimId)` with one argument — unchanged. No prefill, no note. Fully compatible.

---

## Prefill-only guarantee

- "Use as duplicate target" does NOT auto-submit anything.
- "Use as duplicate target" does NOT post to `/api/review/mark-duplicate`.
- It only calls `markDuplicateUI(claimId, nearDupId)`, which opens a modal.
- The API call is still gated inside `onConfirm` callback — requires explicit "Mark Duplicate" button click.
- The `near_duplicate_of` advisory is not treated as a proven canonical relationship.
- The modal still shows "Source is preserved — no delete, no merge."

---

## Implementation

### `markDuplicateUI` signature change

```js
// Before
async function markDuplicateUI(claimId) {

// After
async function markDuplicateUI(claimId, suggestedCanonicalId = '') {
```

The second parameter defaults to `''`. Existing callers with one argument are unchanged.

### Prefill in modal body

When `suggestedCanonicalId` is non-empty, the modal shows:
1. A `<p class="review-dup-prefill-note">` note: "Pre-filled from similar-claim advisory — confirm the ID below before marking."
2. The `dup-target-id` input has `value="${esc(suggestedCanonicalId)}"` pre-filled.

When `suggestedCanonicalId` is `''` (default), no note and `value=""` (placeholder shows as before).

### Inspect panel field change

Added after the Copy ID button, a second `<span class="review-similar-use-dup">`:

```html
<button type="button" class="review-similar-use-dup-btn"
  onclick="markDuplicateUI('{claimId}', '{nearDupId}')"
  title="Open mark-duplicate form with this ID prefilled">
  Use as duplicate target
</button>
<span class="review-similar-use-dup-note">
  Prefills the duplicate form — does not mark anything by itself.
</span>
```

### CSS additions

```css
/* D-236A: similar advisory duplicate-target prefill */
.review-similar-use-dup{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px}
.review-similar-use-dup-btn{background:transparent;border:1px solid var(--line);color:var(--muted);font-size:11px;padding:2px 6px;border-radius:4px;cursor:pointer;line-height:1.3}
.review-similar-use-dup-btn:hover{color:var(--fg);border-color:var(--fg)}
.review-similar-use-dup-note{font-size:10px;color:var(--muted)}
.review-dup-prefill-note{color:var(--muted)}
```

---

## What did NOT change

- `near_duplicate_of` semantics: still advisory only
- `resolveSimilarUI` route: `/api/review/resolve-similar` — unchanged
- `markDuplicateUI` route: `/api/review/mark-duplicate` — unchanged
- Backend API call: still only fires after explicit confirm in `onConfirm`
- Existing "Mark Duplicate..." button in `dupSection`: still calls `markDuplicateUI(claimId)` with one arg
- `copySimilarClaimId` / Copy ID button from D-235A: still present, unchanged
- Raw similar ID in `<code user-select:all>`: still present, unchanged
- Similar advisory display from D-234A: unchanged
- `resolveSimilarUI` scroll from D-233B: unchanged
- Normal moderation actions (Approve/Keep/Reject): unchanged
- Public profile: unchanged
- Worker, CSP, backend, schema: all unchanged

---

## Window slice fixes required

D-236A added content to the `renderReviewInspectPanel` Similar claim field and to `markDuplicateUI` body. Four slice window fixes:

| Test | Old window | New window | Reason |
|------|-----------|-----------|--------|
| `D-129A: markDuplicateUI scrolls to anchor` | `idx+1600` | `idx+1800` | suggestedCanonicalId + prefill note push scrollToReviewAnchor past 1600 |
| `D-129A: inspect panel has Approve/Keep/Reject` | `idx+13000` | `idx+14000` | Use as duplicate target button pushes actions further |
| `D-129B: inspect panel has exactly one review-inspect-actions row` | `idx+13500` | `idx+14000` | same |
| `D-129B: bottom action row has Approve, Keep Pending, Reject, and Mark Duplicate` | `idx+13500` | `idx+14000` | studyBtn now past 13500 |
| `D-129B: Open Study View still present in bottom action row` | `idx+13500` | `idx+14000` | same |
| `D-129C: D-129B single action row preserved` | `idx+13500` | `idx+14000` | same |

---

## Tests added (18 new, 6 window fixes)

| Test | What it confirms |
|------|-----------------|
| `markDuplicateUI accepts optional suggestedCanonicalId` | Param present |
| `suggestedCanonicalId defaults to empty string` | Backward compatible |
| `dup-target-id input uses value="${esc(suggestedCanonicalId)}"` | Prefill wired |
| `prefill note shown when suggestedCanonicalId provided` | Modal copy |
| `existing Mark Duplicate... button still calls with single arg` | Old callers unchanged |
| `similar advisory field renders "Use as duplicate target" button` | Button present |
| `button has type="button"` | Accessibility |
| `button calls markDuplicateUI with two args` | Wiring correct |
| `"does not mark anything by itself" note present` | Prefill-only guarantee |
| `API call still only inside onConfirm` | No auto-submit |
| `markDuplicateUI still posts to /api/review/mark-duplicate` | Route unchanged |
| `Copy ID button from D-235A still present` | D-235A not regressed |
| `raw similar ID still in code element` | ID still visible |
| `review-similar-use-dup CSS in styles.css` | CSS present |
| `review-similar-use-dup-btn CSS in styles.css` | CSS present |
| `review-dup-prefill-note CSS in styles.css` | CSS present |
| `renderPublicProfileHtml excludes prefill classes` | No public exposure |
| `deploy integrity — worker.js unchanged` | Worker not modified |

**Hardening smoke:** 2485 passed / 0 failed (+18 new, 6 window fixes)

---

## Live sanity checklist — D-236B PASS

- [x] Deploy to production via owner terminal
- [x] Open Review queue — find a claim with `~similar` badge
- [x] Inspect the claim — similar advisory field shows: `clm_abc123` code, `↗ Study`, `[Copy ID]`, `[Use as duplicate target]`
- [x] "Use as duplicate target" button opens mark-duplicate modal
- [x] Modal shows "Pre-filled from similar-claim advisory — confirm the ID below before marking."
- [x] Canonical target claim ID field is pre-filled with the `near_duplicate_of` ID
- [x] Moderator can edit or clear the prefilled ID before confirming
- [x] Clicking "Mark Duplicate" completes the flow with explicit confirmation (API call fires)
- [x] Clicking "Cancel" closes without any action — no duplicate marked
- [x] Existing "Mark Duplicate..." button in dupSection still opens modal with empty input (no prefill)
- [x] Copy ID button still works (toast "ID copied")
- [x] Raw `clm_...` code element still single-click selectable
- [x] Dismiss ~Similar still works and scrolls to anchor (D-233B parity)
- [x] Similar advisory display clarity from D-234A intact
- [x] Normal Approve/Keep/Reject actions unchanged
- [x] No console errors

**Live sanity result:** 16/16 PASS (D-236B, 2026-06-29)

---

## Confirmations

- **App changed:** Yes — `markDuplicateUI` optional prefill param; "Use as duplicate target" button in inspect panel
- **CSS changed:** Yes — 4 new classes
- **Worker unchanged:** Confirmed
- **No new public data fields:** Confirmed
- **No backend/API lookup:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No auto-submit:** Confirmed — API call only inside `onConfirm`
- **No duplicate/advisory semantics change:** Confirmed
- **No merge/canonical behavior added:** Confirmed
- **Explicit confirmation still required:** Confirmed — "Mark Duplicate" button click required
- **Cancel does not mutate queue:** Confirmed — closing modal without confirm leaves queue unchanged
- **Copy ID from D-235A remains available:** Confirmed
- **Raw ID remains visible/selectable:** Confirmed
- **No public profile exposure:** Confirmed
- **Resolve-similar scroll from D-233B:** Confirmed intact
- **D-234A similar advisory display:** Confirmed intact
- **Normal moderation actions (Approve/Keep/Reject):** Confirmed unchanged
- **Deploy needed:** Yes — owner deploy complete (D-236B)
- **Owner deploy:** PASS
- **Live duplicate-target prefill sanity:** PASS — "Use as duplicate target" button opens mark-duplicate modal with canonical ID pre-filled; prefill note visible; explicit confirm required; cancel safe; existing one-arg callers unaffected
- **Hardening smoke:** 2485 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)
- **D-236B live sanity:** 16/16 PASS
