# D-172B — Admin Review Keyboard/Recovery Consistency Patch

**Date:** 2026-06-25
**Scope:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`. No backend route changes, no migration, no wrangler.toml, no owner-token work.
**Source:** D-172A findings F1 and F2.

---

## What Changed

Two small frontend-only patches. No backend semantics changed. Both changes are in `public/app-v10.js` only.

---

### Patch 1 — Keyboard `R` now uses two-step arm/confirm for reject

**File:** `public/app-v10.js` — `initReviewKb()` (line ~298)

**Before (D-172A finding F1):**

Keyboard `K` and `R` shared a single direct-fire block:

```js
const decision = key === 'k' ? 'review' : 'rejected';
_reviewKbInFlight = true;
reviewDecisionUI(type, id, decision).then(...).finally(...);
```

`R` immediately called `reviewDecisionUI(type, id, 'rejected')` in one step. `K` (keep-pending) also used this block but is non-destructive so one step is correct for `K`.

**After:**

`R` now mirrors the `A` (approve) two-step pattern exactly:

```js
if (key === 'r') {
  if (pendingRejectReviewId === id) {
    // second R — confirm
    _reviewKbInFlight = true;
    const _advanceId = _next?.id || _prev?.id || null;
    reviewDecisionUI(type, id, 'rejected')
      .then(() => { if (_advanceId) inspectReviewItem(_advanceId); })
      .catch(() => {})
      .finally(() => { _reviewKbInFlight = false; });
  } else {
    // first R — arm
    requestRejectReview(id);
  }
  return;
}
// key === 'k' — keep pending; remains single-step (non-destructive)
_reviewKbInFlight = true;
reviewDecisionUI(type, id, 'review').then(...).finally(...);
```

- First `R`: calls `requestRejectReview(id)` → sets `pendingRejectReviewId = id`, re-renders list/panel with Confirm/Cancel buttons.
- Second `R` on the same inspected item: fires `reviewDecisionUI(type, id, 'rejected')`, then advances to the next item in the queue.
- Pressing Cancel in the UI, or `requestRejectReview(id)` again (arm toggling), disarms the pending state.
- `K` (keep-pending) remains single-step — it is non-destructive and its existing direct-fire behavior was intentional.

**Keyboard hint updated:**

```
Before: A arm · A again confirm · K keep · R reject · [ ] prev/next · Esc close
After:  A arm · A again confirm · R arm · R again reject · K keep · [ ] prev/next · Esc close
```

---

### Patch 2 — `clearAdminToken()` resets all three pending action states

**File:** `public/app-v10.js` — `clearAdminToken()` (line ~343)

**Before (D-172A finding F2):**

```js
function clearAdminToken() {
  localStorage.removeItem(LS_ADMIN);
  reviewQueue = { claims: [], truths: [], review: [] };
  inspectedReviewItem = null;
  pendingRejectReviewId = null;   // ← was reset
  // pendingApproveReviewId — stale
  // pendingCleanupReviewId — stale
  renderReview();
}
```

**After:**

```js
function clearAdminToken() {
  localStorage.removeItem(LS_ADMIN);
  reviewQueue = { claims: [], truths: [], review: [] };
  inspectedReviewItem = null;
  pendingRejectReviewId = null;
  pendingApproveReviewId = null;
  pendingCleanupReviewId = null;
  renderReview();
}
```

All three pending-state variables are now reset consistently on token clear. The harmless-but-stale approvals and cleanup arms can no longer surface as unexpected armed state if the admin re-enters the token in the same session.

---

## Why Keyboard `R` Was Made Two-Step

The card and inspect-panel UI both require two steps to reject (arm → confirm). The keyboard shortcut bypassed this protection: a single accidental `R` keypress immediately rejected the item. While `rejected` is reversible (admin can re-approve), the inconsistency with the card UI pattern created a footgun for an admin using the keyboard to move through the queue quickly.

Making keyboard `R` follow the same arm/confirm pattern as keyboard `A` ensures all three entry points (card, inspect-panel, keyboard) have consistent protection for the reject action.

---

## Why All Pending Action State Is Cleared on Token Clear

The original `clearAdminToken()` had partial state clearing — it reset `pendingRejectReviewId` but left `pendingApproveReviewId` and `pendingCleanupReviewId` holding potentially stale item IDs. If an admin armed an approve or a cleanup for item `X`, then cleared their token and re-entered it, the pending state would still point at `X`. On re-load of the same queue, item `X` would appear with its Confirm button already visible — appearing already-armed with no explicit user action in the new session.

Clearing all three states on token clear ensures the admin review queue always starts in a clean, unarmed state when they re-authenticate.

---

## What Did Not Change

- **`src/worker.js`** — not touched. No backend route semantics changed.
- **`requireAdmin()` gating** — unchanged on all five review routes.
- **Allowed decision set** `['public', 'review', 'rejected']` — unchanged.
- **Card and inspect-panel reject flows** — unchanged. They already used `requestRejectReview()` two-step.
- **Approve keyboard `A`** — unchanged.
- **Keep pending keyboard `K`** — unchanged (still direct, single-step; K is non-destructive).
- **`markDuplicateUI()`, `resolveSimilarUI()`, `reviewCleanupUI()`** — unchanged.
- **`requestRejectReview()`, `cancelRejectReview()`** — unchanged. Keyboard `R` now calls them the same way the card buttons do.
- **`reviewDecisionUI()`** — unchanged. The new keyboard path calls it identically to the inspect-panel button.
- **Owner-token behavior** — unchanged. D-149H hold in effect.
- **No migration.**
- **No `wrangler.toml`.**
- **No database schema changes.**

---

## Smoke Tests

12 new tests added. All existing 1274 tests continue to pass. D-164B test updated to reflect the new two-step `R` behavior.

| Test | What it verifies |
|---|---|
| `D-172B: keyboard R no longer fires reviewDecisionUI directly in one step` | Old `k/r` shared decision variable absent |
| `D-172B: keyboard R arms pendingRejectReviewId before confirming` | Two-step pattern present: arm → confirm |
| `D-172B: keyboard R confirms reject only when pendingRejectReviewId matches` | Confirm path calls `reviewDecisionUI` with `rejected` |
| `D-172B: keyboard hint updated to show R arm / R again reject` | KB hint reflects new two-step wording |
| `D-172B: clearAdminToken resets pendingRejectReviewId` | Existing reset confirmed |
| `D-172B: clearAdminToken resets pendingApproveReviewId` | New reset confirmed |
| `D-172B: clearAdminToken resets pendingCleanupReviewId` | New reset confirmed |
| `D-172B: admin token input remains type=password` | Masking intact |
| `D-172B: no console.* calls in frontend` | No console logging added |
| `D-172B: review mutation routes remain requireAdmin-gated in worker` | Backend gates unchanged |
| `D-172B: no owner-token work resumed` | D-149H hold intact |
| `D-164B` (updated) | K direct / R two-step now correctly describes post-D-172B behavior |

**New baseline: 1285/24/57**
(Previous: 1274/24/57. Net: +11 smoke tests.)

```
node scripts/hardening-smoke-test.mjs       → 1285 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, route changes, or migration were added.

---

## No Backend Route Semantics Changed

All five `requireAdmin`-gated review routes are unchanged. `reviewDecision()` still accepts only `['public', 'review', 'rejected']`. The keyboard `R` two-step change is purely frontend UX — the backend call it ultimately makes (`POST /api/review/decision` with `decision: 'rejected'`) is identical to what the card and inspect-panel buttons have always made.

---

## Recommended Next Step

D-172 chain (A/B) is complete. Admin review mutation paths are fully audited and the two consistency findings are patched. No further admin review keyboard/recovery work is pending.

Future optional work: live verification checkpoint (D-172C) confirming the keyboard behavior in production, similar to D-171E for RunPack.
