# D-23C: Backend Moderation Tooling Plan

Date: 2026-06-06
Status: Planning only. No implementation in D-23. Branch + PR required for all work in this plan.

---

## Context

D-10B/C/D added near-duplicate detection at claim intake. D-11/11B/12/13/14 added frontend advisory UI for similar and quality-flagged claims in the review queue. None of these batches added any write path for duplicate resolution — by design.

This document plans the moderator-controlled merge and resolution tooling that would come next. It does not plan automatic deduplication. It does not plan silent merges. It does not plan any moderation action that executes without explicit admin confirmation.

---

## Hard constraints (non-negotiable)

1. **No automatic deduplication.** The system never merges, archives, or suppresses claims without a moderator taking an explicit action on a specific item.
2. **No silent merges.** Every resolution action must be auditable: logged with admin token, timestamp, source ID, and target ID.
3. **Ancestry preserved.** When a claim is resolved as a duplicate, the `near_duplicate_of` and `duplicate_of` fields are written, but the original claim record is not deleted.
4. **Moderator-controlled exclusively.** All resolution endpoints require `requireAdmin()`. No user-facing resolution path.
5. **Branch + PR required.** No backend moderation work goes direct to main.
6. **No D1 schema changes without a documented migration.** Any new columns must be planned in a migration doc before execution.

---

## Current state of relevant D1 columns

| Column | Table | Status |
|--------|-------|--------|
| `near_duplicate_of` | `claims` | Live — set at intake by `createClaim`; advisory only |
| `duplicate_of` | `claims` | Present in schema (referenced in frontend `renderReviewInspectPanel` field display); not written by any current backend path |
| `review_state` | `claims`, `truths` | Values: `review`, `public`, `rejected`, `archived`; `duplicate` is referenced in frontend but no backend path sets it |

---

## Proposed moderation actions

### Action 1: Mark as duplicate

**Trigger:** Moderator clicks "Mark as duplicate of [ID]" in the review inspect panel.
**Effect:**
- Sets `duplicate_of = target_id` on the source claim.
- Sets `review_state = 'duplicate'` on the source claim.
- Does NOT delete the source claim.
- Does NOT modify the target claim.
- Logs the action with admin token and timestamp.

**API endpoint:** `POST /api/review/mark-duplicate`
**Request body:** `{ claimId, duplicateOf, adminToken }`
**Auth:** `requireAdmin()`
**Branch:** Required. PR review required.

**Frontend:** A "Mark as duplicate of" form in the review inspect panel. Admin enters the target claim ID (or selects from a near-duplicate advisory if `near_duplicate_of` is set). Two-step confirmation. Not available unless the item has `review_state === 'review'`.

---

### Action 2: Resolve similar (dismiss advisory)

**Trigger:** Moderator clicks "Resolve similar — not a duplicate" in the review inspect panel.
**Effect:**
- Clears `near_duplicate_of` on the source claim (sets to NULL).
- Does NOT change `review_state`.
- Logs the action.

**API endpoint:** `POST /api/review/resolve-similar`
**Request body:** `{ claimId, adminToken }`
**Auth:** `requireAdmin()`
**Branch:** Required.

**Frontend:** A "Not a duplicate — dismiss advisory" button in the inspect panel, visible only when `near_duplicate_of` is set. Two-step confirmation.

---

## What is explicitly not planned

- **Bulk resolve:** No action that resolves multiple items at once.
- **Auto-merge evidence:** When a claim is marked duplicate, its evidence is NOT automatically moved to the target claim.
- **Auto-suppress:** No mechanism to hide all claims `near_duplicate_of` a given claim without per-item moderator action.
- **User-facing duplicate UI:** No non-admin user sees or triggers any of these actions.
- **`review_state='duplicate'` in public queries:** The review queue already excludes `archived`; any `duplicate` state would need the same exclusion pattern added to review and claims queries.

---

## D1 migration requirements

Before Action 1 can be implemented:

1. Confirm `duplicate_of` column exists in production D1 `claims` table (it appears in the schema based on frontend references, but must be verified before relying on it).
2. If `review_state = 'duplicate'` is to be a valid value, confirm the column type (TEXT) and that no CHECK constraint limits allowed values.
3. Document in a migration file if any new columns are needed.
4. Apply via manual D1 console execution (not Wrangler in the current environment) per established safety rule.

---

## Implementation sequencing

1. **Audit** — verify `duplicate_of` column and `review_state` constraints in production D1 before writing any code.
2. **Backend branch** — implement `POST /api/review/mark-duplicate` with `requireAdmin()`, logging, and no-delete constraint.
3. **Backend branch** — implement `POST /api/review/resolve-similar`.
4. **PR** — both endpoints reviewed together.
5. **Frontend** — after PR merged, add UI in review inspect panel (direct main, UI-only).
6. **Smoke test** — live write test requires explicit per-session user approval.

Do not begin implementation until D1 audit in step 1 is complete and documented.
