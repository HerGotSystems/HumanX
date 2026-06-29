# D-237A — Duplicate Advisory Workflow Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2526 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D237A_DUPLICATE_ADVISORY_WORKFLOW_REGRESSION_LOCK.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Lock the D-233 → D-236 duplicate advisory UX mini-arc so future duplicate/canonical/merge work cannot accidentally remove:

- Advisory-only semantics for `near_duplicate_of`
- Scroll parity after resolve-similar (D-233B)
- Clearer advisory copy and "Possible related claim:" label (D-234A)
- Copy ID affordance for similar claim ID (D-235A)
- Prefill-only "Use as duplicate target" behavior (D-236A)
- Explicit moderator confirmation requirement
- Public profile isolation from all advisory/review internals

Any future work touching duplicate/canonical/merge UX must either preserve this lock or update it with owner approval before merging.

---

## D-233 → D-236 Mini-Arc Summary

| Task | What it added |
|------|--------------|
| D-233A | Audit of duplicate review UX — 4 findings identified |
| D-233B | `resolveSimilarUI` scroll anchor parity — `scrollToReviewAnchor(claimId)` after queue reload |
| D-234A | Similar advisory display clarity — structured banner, "Possible related claim:" prefix, stronger modal copy |
| D-235A | Copy ID — `copySimilarClaimId(id)` helper, Copy ID button, `user-select:all` code element |
| D-236A | Duplicate-target prefill — "Use as duplicate target" button prefills `markDuplicateUI` modal; explicit confirm still required |

---

## What is now locked

### Advisory-only semantics

- `near_duplicate_of` is advisory only — computed by backend, no moderator action required
- No auto-merge, no canonical resolution, no auto-submit
- Advisory does not change the claim's state in Review
- Explicit moderator action (Approve / Keep / Reject / Mark Duplicate) is always required

### Explicit confirmation guarantee (D-236A)

- "Use as duplicate target" button only opens the `markDuplicateUI` modal with the canonical ID pre-filled
- The `/api/review/mark-duplicate` API call only fires inside `onConfirm` — requires the moderator to click "Mark Duplicate"
- Cancel closes the modal without any mutation to the queue or claim state
- `markDuplicateUI(claimId, suggestedCanonicalId='')` — existing one-arg callers are fully backward-compatible

### Copy ID guarantee (D-235A)

- `copySimilarClaimId(id)` copies only the raw claim ID string via `navigator.clipboard?.writeText`
- No backend lookup, no `fetch`, no `api()`, no `localStorage`
- Success toast: "ID copied"
- Failure toast: "Copy failed — select the ID manually"
- Raw ID also visible in `<code class="review-similar-id-code">` with `user-select:all` for manual selection

### Prefill-only guarantee (D-236A)

- "Use as duplicate target" prefills the mark-duplicate form — it does not mark anything automatically
- Prefill note: "Prefills the duplicate form — does not mark anything by itself."
- No auto-submit, no canonical resolution, no merge behavior

### Resolve-similar scroll parity (D-233B)

- `resolveSimilarUI` calls `renderReviewList()` then `scrollToReviewAnchor(claimId)` on success
- `markDuplicateUI` has matching scroll parity
- Order: render first, scroll after

### Advisory display clarity (D-234A)

- Inspect panel banner: "Similar claim advisory" label + "Review manually before deciding" copy
- Similar claim field: "Possible related claim: `clm_...`" prefix
- Resolve/dismiss modal: "This does not approve, reject, or merge the claim — only the advisory flag is cleared."

### No backend/API lookup

- `copySimilarClaimId` uses only the ID already present in the review queue data — no API call
- "Use as duplicate target" passes the advisory ID as a parameter — no search, no lookup

### No merge/canonical behavior

- No `mergeClaimUI`, no `/api/review/merge`, no `canonicalResolution`, no `autoMergeDuplicate`
- `duplicate_of` (explicit moderator-set) and `near_duplicate_of` (advisory) remain separate concepts

### Public exposure guarantees

All of the following are confirmed absent from `renderPublicProfileHtml`:
- `copySimilarClaimId`
- `markDuplicateUI`
- `resolveSimilarUI`
- "Similar claim advisory"
- "Use as duplicate target"
- `review-similar-use-dup`, `review-dup-prefill-note`
- `review-similar-note` advisory internals

---

## Future rule

> Any task touching duplicate/canonical/merge UX — including new merge actions, canonical lookup, advisory UI changes, or resolve-similar route changes — must either pass all D-237A regression tests unchanged, or update this lock with owner approval first.

---

## Tests added (41 new)

### 1. D-233B resolve-similar scroll lock (5 tests)

| Test | What it confirms |
|------|-----------------|
| `resolveSimilarUI still calls renderReviewList()` | Queue reload preserved |
| `resolveSimilarUI still calls scrollToReviewAnchor(claimId)` | Scroll anchor preserved |
| `scroll comes after renderReviewList (order preserved)` | Order locked |
| `markDuplicateUI still has scroll-anchor parity` | Parity with D-233B |
| `resolve-similar posts to /api/review/resolve-similar` | Route unchanged |

### 2. D-234A advisory clarity lock (6 tests)

| Test | What it confirms |
|------|-----------------|
| `inspect panel still renders "Similar claim advisory"` | Label present |
| `advisory banner still says "Review manually before deciding"` | Guidance copy |
| `similar field still prefixes with "Possible related claim:"` | Field prefix |
| `raw similar ID still visible (review-similar-id-code)` | ID not hidden |
| `resolveSimilarUI modal still says "does not approve, reject, or merge"` | Modal copy |
| `no merge/canonical behavior copy in inspect panel` | No scope creep |

### 3. D-235A Copy ID lock (8 tests)

| Test | What it confirms |
|------|-----------------|
| `copySimilarClaimId function still exists` | Helper not removed |
| `uses navigator.clipboard?.writeText` | Safe clipboard API |
| `copies id argument, not location.href` | Only ID copied |
| `does not call fetch, api, or localStorage` | No backend side-effect |
| `success toast is "ID copied"` | Toast copy locked |
| `failure toast is "Copy failed — select the ID manually"` | Fallback toast locked |
| `"Copy ID" button still in inspect panel` | Button not removed |
| `raw ID in selectable code element` | Display not removed |

### 4. D-236A duplicate-target prefill lock (7 tests)

| Test | What it confirms |
|------|-----------------|
| `markDuplicateUI still accepts optional suggestedCanonicalId` | Backward compat |
| `existing one-arg callers still work (dupSection)` | Old callers safe |
| `inspect panel still renders "Use as duplicate target"` | Button not removed |
| `button calls markDuplicateUI with two args` | Wiring preserved |
| `prefill note still present ("does not mark anything by itself")` | Guarantee copy |
| `mark-duplicate API call gated inside onConfirm (no auto-submit)` | No auto-submit |
| `Copy ID button available alongside "Use as duplicate target"` | Both affordances present |

### 5. Semantics lock (6 tests)

| Test | What it confirms |
|------|-----------------|
| `near_duplicate_of remains advisory (no autoMergeDuplicate)` | Semantics unchanged |
| `resolve-similar route unchanged` | Route locked |
| `mark-duplicate route unchanged` | Route locked |
| `no new merge action in app source` | No scope creep |
| `no canonical resolution behavior` | No scope creep |
| `no backend lookup in copySimilarClaimId` | No API side-effect |

### 6. Public exposure lock (7 tests)

| Test | What it confirms |
|------|-----------------|
| `renderPublicProfileHtml excludes copySimilarClaimId` | Not public |
| `renderPublicProfileHtml excludes markDuplicateUI` | Not public |
| `renderPublicProfileHtml excludes resolveSimilarUI` | Not public |
| `renderPublicProfileHtml excludes "Similar claim advisory"` | Not public |
| `renderPublicProfileHtml excludes "Use as duplicate target"` | Not public |
| `renderPublicProfileHtml excludes prefill CSS classes` | Not public |
| `renderPublicProfileHtml excludes review-similar-note internals` | Not public |

### 7. Deploy integrity lock (2 tests)

| Test | What it confirms |
|------|-----------------|
| `D-237A does not modify app-v10.js` | Tests+docs only |
| `D-237A does not modify worker.js` | Tests+docs only |

**Hardening smoke:** 2526 passed / 0 failed (+41 new)
**Worker route static:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug` — D-218A documented)

---

## Confirmations

- **App changed:** No
- **CSS changed:** No
- **Worker unchanged:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No public profile exposure:** Confirmed
- **Advisory-only semantics:** Confirmed locked
- **Explicit confirmation guarantee:** Confirmed locked
- **Copy ID guarantee:** Confirmed locked
- **Prefill-only guarantee:** Confirmed locked
- **Scroll parity (D-233B):** Confirmed locked
- **Advisory display clarity (D-234A):** Confirmed locked
- **No merge/canonical behavior:** Confirmed locked
- **No backend/API lookup:** Confirmed locked
- **Deploy needed:** No
