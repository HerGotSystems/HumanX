# D-164B — Safer Review Approval Actions

**Date:** 2026-06-25
**Scope:** Frontend only — `public/app-v10.js`. No backend, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Inspect-panel Approve — two-step confirm (required fix)

**Before (D-164A gap):** The Approve button inside the inspect panel called `reviewDecisionUI(type, id, 'public')` directly on first click — one-click approval with no confirmation.

**After:** The inspect-panel Approve button now calls `requestApproveReview(id)` on first click (same as the card-level Approve button). The button class and text update to reflect pending state:

- First click: button shows `"Approve"` → arms pending state (`pendingApproveReviewId = id`)
- Re-render: button class becomes `btn-approve-confirm`, text becomes `"Confirm approve public ✓"`; a `"Cancel"` button appears
- Second click on confirm: calls `reviewDecisionUI(type, id, 'public')` — actual approval
- Cancel: calls `cancelApproveReview()` — clears pending state

This matches the existing card-level two-step flow exactly. No new global state was introduced — `pendingApproveReviewId` already existed for the card-level confirm.

### 2. Keyboard `A` shortcut — two-press confirm

**Before (D-164A gap):** Pressing `A` in the review keyboard handler called `reviewDecisionUI(type, id, 'public')` directly — one-keypress approval.

**After:** First `A` press calls `requestApproveReview(id)` (arms the pending state and re-renders the inspect panel). Second `A` press detects `pendingApproveReviewId === id` is already set, then calls `reviewDecisionUI(type, id, 'public')` to confirm.

`K` and `R` keyboard shortcuts are unchanged — they remain direct single-press actions (Keep Pending and Reject have lower accidental-approval risk, and Reject already has a two-step confirm in the UI).

`Esc` clears the inspect panel via `inspectReviewItem(id)` (existing behaviour) — this also re-renders and removes the pending approve state visually, though `pendingApproveReviewId` is only explicitly cleared by `cancelApproveReview()` or on a successful `reviewDecisionUI()` call.

### 3. Admin token input — masked with `type="password"`

**Before (D-164A gap):** `<input id="adminToken" ... >` with no `type` attribute (defaulted to `type="text"`) — token value visible in the browser UI.

**After:** `<input id="adminToken" type="password" ... >` — token value masked in the browser UI.

The `value="${esc(token)}"` attribute is preserved so the field still shows whether a token is stored (as a masked string). Storage and load behaviour (`localStorage`, `saveAdminTokenAndLoadReview`, `clearAdminToken`) are unchanged.

### 4. Smoke test updates

11 new tests in Section 97. Six pre-existing tests updated to reflect D-164B's new two-step inspect-panel Approve behaviour:

- `D-95B: bottom-actions Approve in inspect panel has review-inspect-approve class` — updated assertion to match conditional class attribute
- `D-96B: inspect panel action row Approve calls reviewDecisionUI directly` — updated to verify two-step flow (was verifying old one-click pattern)
- `D-96B: inspect panel bottom-actions Approve still calls reviewDecisionUI directly` — same
- `D-129A: inspect panel still has its own Approve / Keep Pending / Reject controls` — updated slice size (12404-char function)
- `D-129B: bottom action row has Approve, Keep Pending, Reject, and Mark Duplicate` — updated slice size and assertion
- `D-129B: Open Study View still present in bottom action row` — updated slice size
- `D-129D: inspect actions row still has Approve/Keep/Reject buttons wired` — updated assertion

---

## Why Inspect Approval Needed Two-Step Safety

The D-164A audit found that inspect-panel Approve was one-click while the card-level Approve (added in D-96B) already required two clicks. This inconsistency meant that:

1. An admin who opened the inspect panel to read the full claim context could accidentally approve with a single misclick
2. The keyboard shortcut `A` bypassed even the card-level pending state — pressing `A` once approved immediately

The two-step flow existed for card-level approval precisely to prevent accidental public approval. Extending it to the inspect panel closes the gap.

---

## Backend / Gating Unchanged

- `requireAdmin` is the first call in all five review routes — unchanged
- `reviewDecision` route allowed values remain `'public'`, `'review'`, `'rejected'` — unchanged
- `reviewCleanup` three-gate model (admin token + rejected state + artefact detection) — unchanged
- `markDuplicate` modal + target ID requirement — unchanged
- `resolveSimilar` non-destructive advisory clear — unchanged
- `review_state = 'review'` on all new inserts via `createClaim`, `addEvidence`, `addPressure` — unchanged

---

## Privacy / Public Boundary Confirmation

- No backend changes
- Admin token value is not rendered in any `toast()`, `console.log()`, or API response
- Admin token is sent only via `x-humanx-admin` header in `adminHeaders()` — unchanged
- No invite codes, user IDs, email, owner tokens, or internal debug metadata are exposed

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1209 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

11 new smoke tests in Section 97. 7 pre-existing tests updated.

---

## Recommended Next Step

D-164C: Bump, deploy, and owner-terminal preflight live verify. Expected:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-164B <commit> 1209/24/57
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
