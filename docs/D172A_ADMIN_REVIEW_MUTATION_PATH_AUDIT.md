# D-172A — Admin Review Mutation Path Audit

**Date:** 2026-06-25
**Scope:** `src/worker.js` review routes, `public/app-v10.js` review UI. Audit only — no source code changes.

---

## Executive Summary

All five backend review mutation routes are correctly `requireAdmin`-gated. The frontend approve and reject flows in both the card and inspect-panel UI are two-step (arm then confirm). Cleanup and duplicate-marking are also gated behind a confirmation step (two-step or modal).

Two minor inconsistencies are noted:

- **F1 (low, acceptable):** The keyboard shortcut `R` fires reject in a single step with no arming confirmation, inconsistent with the card/panel two-step reject. The KB hint correctly labels it `R reject` (no "arm · confirm" wording), but the inconsistency with the UI pattern is worth documenting for a D-172B clarification.
- **F2 (very low, cosmetic):** `clearAdminToken()` resets `pendingRejectReviewId` but not `pendingApproveReviewId` or `pendingCleanupReviewId`. Since clearing the token re-renders to the login screen, the stale state is harmless but inconsistent.

No catastrophic security issues found. No immediate patches required.

---

## Mutation Route Matrix

| Route | Method | Handler | `requireAdmin`? | Allowed decisions/actions |
|---|---|---|---|---|
| `/api/review` | GET | `reviewQueue()` | ✓ first line | Read-only — queue fetch |
| `/api/review/decision` | POST | `reviewDecision()` | ✓ first line | `public`, `review`, `rejected` |
| `/api/review/cleanup` | POST | `reviewCleanup()` | ✓ first line | Archive rejected test artefacts only |
| `/api/review/mark-duplicate` | POST | `markDuplicate()` | ✓ first line | Mark claim as duplicate |
| `/api/review/resolve-similar` | POST | `resolveSimilar()` | ✓ first line | Clear near-duplicate advisory |

All five routes gate the first line with `const adminError = requireAdmin(request, env); if (adminError) return adminError;`. No bypass path exists.

`requireAdmin()` uses constant-time `safeEqual()` against `env.HUMANX_ADMIN_TOKEN`. An empty expected token causes rejection (prevents accidental open-access if the Worker secret is unset).

---

## `reviewDecision()` — Allowed State Transitions

```js
const allowed = new Set(['public', 'review', 'rejected']);
```

Only three decisions are accepted. Any other string is rejected with `BAD_REVIEW_DECISION`. The allowed set is validated before any DB write. Target types must be `claim`, `truth`, `evidence`, or `pressure` — all others return `BAD_REVIEW_TARGET`.

State transitions possible per decision:

| Decision | Meaning | Reversible? |
|---|---|---|
| `public` | Approves and publishes item | Yes — admin can re-reject or keep pending |
| `review` | Returns item to pending queue | Yes |
| `rejected` | Hides item permanently from public | Yes — admin can re-approve or keep pending |

No terminal-only state is reachable via `reviewDecision()`. Even `rejected` can be reversed by a subsequent admin decision. The `archived` and `duplicate` states are only reachable via `reviewCleanup()` and `markDuplicate()` respectively (see below).

---

## `reviewCleanup()` — Archive Gate

`reviewCleanup()` requires:
1. `requireAdmin` ✓
2. Target must have `review_state = 'rejected'` — cannot archive from public or pending
3. Artefact detection signals (keyword match / seed ID pattern / dev handle / seed-truth derived)
4. OR explicit `junk_override: true` with a reason ≥ 8 chars and a matching junk heuristic (short text / all-caps fragment / low-alpha ratio)

Archive via `reviewCleanup()` is a terminal state for the item (no route currently reverses it). The multi-signal gate prevents accidental archiving of legitimate public content.

**Frontend:** `requestCleanupReview(id)` sets `pendingCleanupReviewId` (arm) → inspect panel re-renders with Confirm/Cancel → `reviewCleanupUI(type, id)` on confirm. **Two-step. ✓**

---

## `markDuplicate()` — Duplicate Gate

`markDuplicate()` requires:
1. `requireAdmin` ✓
2. Target `claimId` exists and is not already `archived` or `duplicate`
3. `duplicateOf` target exists
4. `claimId !== duplicateOf` (self-duplicate check)

The claim is moved to `review_state = 'duplicate'`. This is effectively terminal — the review queue filters out `duplicate` state items. Only admin could reverse it by direct DB or a new route.

**Frontend:** `markDuplicateUI(claimId)` opens `hxModal()` requiring the admin to manually type the canonical target claim ID and optional reason. The modal's Confirm button calls the API. **Modal-gated with required text input. ✓**

---

## `resolveSimilar()` — Near-Duplicate Advisory Dismissal

`resolveSimilar()` requires:
1. `requireAdmin` ✓
2. `near_duplicate_of` must be non-null on the target claim — errors if not set

This clears the advisory only — no state change, no merge, no delete. Non-destructive.

**Frontend:** `resolveSimilarUI(claimId)` opens `hxModal()` showing the advisory target and a Confirm/Cancel. **Modal-gated. ✓**

---

## Frontend Action Matrix

| Action | Card UI | Inspect Panel | Keyboard |
|---|---|---|---|
| Approve | Two-step: Approve → Confirm Approve | Two-step: Approve → Confirm approve public ✓ | Two-step: `A` arm → `A` again confirm |
| Keep Pending | Single-step (non-destructive) | Single-step | `K` single-step |
| Reject | Two-step: Reject → Confirm Reject | Two-step: Reject → Confirm Reject | **F1: `R` single-step — no arm/confirm** |
| Cleanup/Archive | Not shown in card | Two-step: Archive → Confirm Archive | Not wired to keyboard |
| Mark Duplicate | Not shown in card | Modal (requires typing target ID) | Not wired to keyboard |
| Resolve Similar | Not shown in card | Modal (with Confirm/Cancel) | Not wired to keyboard |

### Card visibility rule

In `reviewCard()`, Approve/Keep/Reject buttons are rendered only when the card is **not** the currently inspected item (`!isSelected`). When the inspect panel is open for an item, the card shows only the Inspect button. This prevents duplicate concurrent action paths on the same item.

---

## Keyboard / Two-Step Verdict

The keyboard handler (`initReviewKb()`) is bound once (guarded by `_reviewKbBound`) and applies only when `mode === 'review'` and focus is not inside a form field or modal.

**Approve:** `A` arm → `A` again confirm — correctly mirrors the two-step UI pattern. `_reviewKbInFlight` prevents double-fire during the API round trip.

**Keep Pending:** `K` single-step. Non-destructive; consistent with card single-step Keep. ✓

**Reject (F1):** `R` single-step, immediately fires `reviewDecisionUI(type, id, 'rejected')` without arming. The keyboard hint correctly states `R reject` without "arm · confirm" language, so it is accurately documented to the admin user. However, it is inconsistent with the card/panel reject flow which requires two steps.

Since reject is reversible (an admin can immediately re-approve), the risk is low. The item is not deleted — it is moved to `rejected` state. The `_reviewKbInFlight` guard prevents rapid repeated presses during the API call.

**Recommended D-172B action:** Consider either (a) adding `R` arm/confirm matching the `A` pattern, or (b) clarifying the KB hint to read `R reject (direct)` to distinguish the behavior. Option (b) is lower risk.

---

## Duplicate / Archive / Cleanup Verdict

- **Mark Duplicate** requires a modal with manual text entry (target claim ID). Difficult to trigger by accident. ✓
- **Resolve Similar** requires a modal with Confirm/Cancel. Clears only the advisory, no state change. ✓
- **Cleanup/Archive** requires: item is in `rejected` state, artefact signals match, frontend two-step, backend multi-signal validation. Strongly gated. ✓
- `markDuplicate()` self-duplicate prevention (`claimId === duplicateOf` check) is correct. ✓

---

## Sensitive Metadata Verdict

### Mutation response payloads (admin-only — `requireAdmin`-gated)

| Route | Response fields | Notes |
|---|---|---|
| `reviewDecision` / claim | `mapClaim(row)` | Includes `nearDuplicateOf`, `duplicateOf`, `statusLocked` — intentional for admin; not public-facing |
| `reviewDecision` / truth | `SELECT * FROM truths` | Full truth row — admin-only; truths table has no user-private fields (no email, no password) |
| `reviewDecision` / evidence | `SELECT e.*, c.claim AS parent_claim` | Includes `user_id` (pseudonymous `usr_*` ID) — intentional admin provenance; D-168B noted this as accepted for admin mutation responses |
| `reviewDecision` / pressure | `SELECT p.*, c.claim AS parent_claim` | Same pattern as evidence |
| `markDuplicate` | `mapClaim(updated)` | Same as claim decision — admin-only |
| `resolveSimilar` | `{ ok, action, claimId, previous_near_duplicate_of }` | No user data |
| `reviewCleanup` | `{ ok, target_type, target_id, action, states, archive_policy, archive_reason }` | No user data |

All mutation responses are returned only after `requireAdmin` passes. No mutation response is returned to public/non-admin callers.

### Inspect panel rendering

The inspect panel (`renderReviewInspectPanel()`) renders `user_id`, `normalized_claim`, `damage`, and `near_duplicate_of` for claims, plus `user_id` for evidence and truths. These fields are:
- Populated by the admin-only `GET /api/review` response (which explicitly selects these columns for admin context)
- Rendered inside the admin review UI only, behind the admin token entry gate
- Escaped via `esc()` before DOM insertion — no XSS risk confirmed

The `normalized_claim` is truncated to 60 chars in the inspect panel for readability. All IDs use `<code class="review-inspect-id">` — escaped. ✓

---

## Admin Token Handling Verdict

- Admin token input: `type="password"` — masked. ✓
- Admin token saved to `localStorage` (LS_ADMIN) only after submit. Not logged. ✓
- All mutation API calls use `adminHeaders()` which appends `x-humanx-admin` from `localStorage`. ✓
- `clearAdminToken()` removes from `localStorage` and resets queue state. ✓
- No admin token value is ever rendered to the DOM or logged to console. ✓

---

## Findings

### F1 — Keyboard `R` rejects without arming step (low, acceptable)

**File:** `public/app-v10.js` — `initReviewKb()` (line ~298)

**Behavior:** Pressing `R` on an inspected item immediately calls `reviewDecisionUI(type, id, 'rejected')` without first calling `requestRejectReview(id)`. The approve flow requires `A` arm + `A` confirm; reject does not mirror this.

**Who can invoke it:** Admin only — keyboard shortcut only triggers when `mode === 'review'`, an admin token is loaded, and the review queue is displayed.

**Risk:** Low. `rejected` state is reversible — admin can immediately re-approve or keep pending. The item is not deleted. The `_reviewKbInFlight` guard prevents rapid repeat. The KB hint correctly states `R reject` (not "arm · confirm") so the behavior is documented to the admin.

**Recommended D-172B action:** Either (a) arm `R` the same way as `A` (add `pendingRejectReviewId` check in keyboard handler), or (b) update the KB hint text to `R reject (direct)` to distinguish it from the two-step pattern. Option (b) is lower risk and sufficient since reject is reversible.

---

### F2 — `clearAdminToken()` resets `pendingRejectReviewId` but not `pendingApproveReviewId` or `pendingCleanupReviewId` (very low, cosmetic)

**File:** `public/app-v10.js` — `clearAdminToken()` (line ~343)

**Behavior:**
```js
function clearAdminToken() {
  localStorage.removeItem(LS_ADMIN);
  reviewQueue = { claims:[], truths:[], review:[] };
  inspectedReviewItem = null;
  pendingRejectReviewId = null;   // ← reset
  // pendingApproveReviewId not reset
  // pendingCleanupReviewId not reset
  renderReview();
}
```

**Risk:** Very low. Clearing the admin token re-renders to the token-entry form. The queue is cleared (`reviewQueue = {}`). Even if `pendingApproveReviewId` or `pendingCleanupReviewId` retain a value, the queue has no items to render them against, so no buttons appear. If the admin re-enters the token and reloads the queue, the stale IDs might cause stale arm indicators on coincidentally matching items, but this is cosmetic.

**Recommended D-172B action:** Reset all three pending state variables in `clearAdminToken()` for consistency:
```js
pendingRejectReviewId = null;
pendingApproveReviewId = null;
pendingCleanupReviewId = null;
```

---

## Verified Against Docs

| Expected behavior (from prior docs) | Current code | Status |
|---|---|---|
| D-164B: inspect-panel Approve is two-step | `requestApproveReview(id)` arm → `reviewDecisionUI(…,'public')` confirm | ✓ Matches |
| D-165B: KB hint says `A arm · A again confirm` | `initReviewKb()` uses `pendingApproveReviewId` two-step for `A` | ✓ Matches |
| D-166B: review queue uses explicit SELECT and remains admin-gated | `reviewQueue()` → explicit column SELECTs → `requireAdmin` first line | ✓ Matches |
| D-167A: explicit review SELECT contract confirmed complete | All four target type SELECTs confirmed in `reviewQueue()` | ✓ Matches |
| Admin review may see `user_id`, `normalized_claim`, `damage` | Inspect panel renders these fields | ✓ Intentional per D-167A |

---

## Additional Verify Checklist

| Check | Result |
|---|---|
| No owner-token work resumed | ✓ — D-149H hold intact |
| No admin token value rendered/logged/documented | ✓ |
| Admin token input `type="password"` | ✓ |
| No `console.*` frontend logs | ✓ |
| No public route mutation bypass | ✓ — all five routes start with `requireAdmin` |
| No `wrangler.toml` | ✓ |
| No migration | ✓ |

---

## Recommended D-172B Patch List

Two small frontend-only changes, both low risk:

1. **Keyboard `R` arming (F1):** Update `initReviewKb()` so `R` mirrors `A` with a two-step arm/confirm — or update the KB hint text to clarify `R reject (direct)` so the inconsistency is explicitly communicated to the admin.

2. **`clearAdminToken()` consistency (F2):** Add `pendingApproveReviewId = null;` and `pendingCleanupReviewId = null;` to `clearAdminToken()`.

Both changes touch only `public/app-v10.js`. No backend changes, no route changes, no migration.

---

## No Code Changes in D-172A

`src/worker.js`, `public/app-v10.js`, and all other source files were read and audited only. No modifications were made.

---

## Smoke Tests

Baseline unchanged: **1274/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1274 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-172A is audit only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No enforcement, soft warnings, route changes, or migration were added or recommended.
