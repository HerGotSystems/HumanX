# D-165B — Review Queue Admin UX Copy Polish

**Date:** 2026-06-25
**Scope:** Frontend only — `public/app-v10.js`. No backend, no migration, no wrangler.toml, no owner-token work.

---

## What Changed

### 1. Keyboard hint — reflects two-press `A` (required fix from D-165A audit)

**Before (D-165A gap):** The inspect-panel keyboard hint read:

```
A approve · K keep · R reject · [ ] prev/next · Esc close
```

This was written before D-164B introduced the two-press approve flow. After D-164B, pressing `A` once no longer approves — it arms the pending state. The hint was misleading.

**After:**

```
A arm · A again confirm · K keep · R reject · [ ] prev/next · Esc close
```

`K` and `R` remain single-press — the hint correctly reflects this.

---

### 2. `truth-derived` filter — help text and empty state

**Before (D-165A gap):** The `truth-derived` filter chip existed in `renderReviewFilterBar()` but `reviewFilterHelpText()` had no entry for it (fell through to empty string `''`) and `reviewEmptyText()` had no entry (fell through to the default `'No items found.'`).

**After:**

`reviewFilterHelpText('truth-derived')` returns:

> "Truth-derived items come from belief/truth flows and may need extra context before approval. Check the parent Truth and any category-echo or borderline-origin badges."

`reviewEmptyText('truth-derived')` returns:

> "No truth-derived review items right now."
> "Claims created from a Truth via Pressure-test appear here. Check the parent Truth and any category-echo or borderline-origin badges before approving."

---

### 3. "Review unavailable" error — recovery copy

**Before (D-165A gap):** When `loadReviewQueue()` threw an error, `renderReview()` rendered:

```html
<h3>Review unavailable</h3>
<p class="small">{error message}</p>
```

No guidance on what to do. In practice the most common cause is an expired or missing admin token.

**After:**

```html
<h3>Review unavailable</h3>
<p class="small">{error message}</p>
<p class="small">Check the admin token above, re-enter it if needed, then reload the queue.</p>
```

The admin token value is not rendered or logged — the recovery note only tells the admin to scroll up to the token input.

---

## Smoke Tests

6 new tests in Section 98:

| Test | What it checks |
|---|---|
| `D-165B: keyboard hint reflects two-press A` | `renderReviewInspectPanel` slice contains `"A arm · A again confirm"` |
| `D-165B: old one-shot "A approve" hint is gone` | `"A approve · K keep"` not present anywhere in `app-v10.js` |
| `D-165B: reviewFilterHelpText contains truth-derived copy` | `reviewFilterHelpText` slice contains `"Truth-derived items come from belief/truth flows"` |
| `D-165B: reviewEmptyText contains truth-derived empty state copy` | `reviewEmptyText` slice contains `"No truth-derived review items right now"` |
| `D-165B: Review unavailable error panel includes recovery copy` | `renderReview` slice contains `"Check the admin token above, re-enter it if needed"` |
| `D-165B: no owner-token work resumed` | `workerSrc` does not contain `OWNER_TOKEN_REQUIRED` or `OWNER_TOKEN_INVALID` |

---

## Backend / Gating Unchanged

- No backend changes — `src/worker.js` not modified
- `requireAdmin` remains the first call in all five review routes (`reviewDecision`, `reviewCleanup`, `markDuplicate`, `resolveSimilar`, `reviewQueue`)
- `reviewDecision` allowed values (`public`, `review`, `rejected`) — unchanged
- No review route changes, no state model changes, no approval/reject/duplicate/cleanup semantic changes
- Admin token value not rendered, not logged, not in any toast

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1215 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

6 new smoke tests in Section 98.

---

## Recommended Next Step

D-165C: Bump deploy metadata to D-165B, then owner-terminal preflight to confirm production.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
