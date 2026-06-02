# Review Cleanup Policy

Policy governing how and when items in the HumanX Review queue may be cleaned up, archived, or deleted. Read this document before implementing any cleanup, archive, or delete action in the Review UI or backend.

---

## 1. Purpose

The Review queue accumulates items that should not be publicly visible but still consume admin attention and clutter the queue. Categories that need cleanup:

- **Smoke-test artefacts** — claims submitted by automated test scripts (e.g. `clm_54be6272abbc49d282`) that were never intended to be real content.
- **Rejected junk** — spam or bad-faith submissions that have already been rejected and serve no further purpose.
- **Duplicate claims** — items normalised to the same content as an existing approved claim.
- **Old public/rejected review clutter** — items left in `review` or `rejected` state for an extended period with no associated evidence, reports, or pressure history.

Without a documented policy, ad-hoc cleanup risks destroying audit history, lineage links, and evidence records that the system depends on for integrity.

---

## 2. Non-Destructive First Principle

**Default cleanup action is hide / archive / soft-mark — not hard delete.**

Any action that removes a row from a D1 table is irreversible without a backup. A soft archive preserves lineage, allows audit, and can be undone. Hard delete is a last-resort step that requires a separate explicit confirmation and, eventually, a backup/export pre-condition (see Phase 5).

---

## 3. What Can Be Safely Cleaned

The following item categories are candidates for cleanup:

| Category | Criteria | Minimum safe action |
|---|---|---|
| Automated smoke-test claims | Submitted by a known test script; `reviewState: 'review'` or `'rejected'`; no evidence attached; no report history | Archive / reject |
| Rejected test submissions | Manually submitted as obvious tests; admin-confirmed; no pressure or evidence links | Archive |
| Duplicate items | `normalized_claim` matches an existing approved or active claim; no unique evidence | Archive with duplicate pointer |
| Empty or malformed items | Missing required fields; failed validation at submission; not publicly visible | Archive |
| Admin-confirmed obvious test entries | User-created entries explicitly flagged by an admin as test data | Archive only — requires admin explicit confirmation per item |

---

## 4. What Must NOT Be Auto-Deleted

The following must never be deleted automatically or in bulk:

- **Public claims with attached evidence, pressure events, or associated tests/analysis** — these are the core data the system exists to preserve.
- **User-submitted claims not explicitly selected by an admin** — bulk deletion of user content requires per-item admin selection.
- **Anything with a report history** — if a claim has been reported or flagged, the report record is part of the audit trail.
- **Lineage-linked truth or claim records** — deleting a claim that a truth record points to breaks referential integrity. Lineage must be preserved or re-pointed before any delete.
- **Evidence records linked to claims** — evidence rows must not be deleted as a side effect of cleaning the parent claim unless the evidence is also explicitly selected and reviewed.
- **Items in `approved` state** — no approved item should ever be deleted through the cleanup flow; use the normal review/reject path first.

---

## 5. Required UI Safeguards

Before any cleanup action is exposed in the Review UI:

1. **Visible audit summary** — the Review page must show counts of items by state (smoke/test/duplicate/rejected) so the admin can see the scope before acting. *(Already implemented.)*
2. **Item inspection before cleanup** — the admin must be able to open and inspect an item in the inspection panel before acting on it. *(Already implemented.)*
3. **Two-step confirmation** — any destructive or semi-destructive action (archive, reject, delete) must require a second explicit confirmation step. Reject confirmation is already implemented; archive and delete must follow the same pattern.
4. **Selected-item-only cleanup at first** — the first implementation must only act on the item(s) the admin has explicitly selected. No implicit "clean all like this" behaviour.
5. **No bulk cleanup until single-item cleanup is proven safe** — bulk actions must not be added until the single-item archive/reject path has been used in production without incident.
6. **Clear toast after action** — every cleanup action must produce a visible toast or status message confirming what changed and how many items were affected. *(Toast pattern already in place for reject; extend for new actions.)*

---

## 6. Required Backend Safeguards

Before any cleanup endpoint is added to the Worker:

1. **Admin token required** — every cleanup route must verify the admin auth token. No unauthenticated cleanup.
2. **Exact id and type required** — the request body must include the item's exact `id` and item type. No wildcard or pattern-based targeting.
3. **Reject/archive before delete** — the backend must transition an item to `rejected` or `archived` state before any hard-delete path is reached. A single request must not skip straight to hard delete.
4. **Hard delete must verify no protected links** — before executing a hard delete, the backend must confirm the item has no attached evidence rows, no report history, and no lineage links, unless the caller explicitly passes an `allowForce` flag that has been approved by an admin.
5. **Return a JSON summary of what changed** — every cleanup response must include the item id, the action taken, and the resulting state. No silent success.
6. **No silent cascading deletes** — child rows (evidence, reports, lineage pointers) must not be deleted as an implicit cascade. Any cascade must be explicit, listed in the response, and separately confirmed.

---

## 7. Proposed Implementation Phases

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Frontend audit summary (smoke/test/duplicate counts visible in Review header) | Done |
| **Phase 2** | Selected-item archive/hide cleanup for rejected smoke-test and obvious test artefacts — single item at a time, two-step confirm, toast feedback | Not started |
| **Phase 3** | Safe duplicate handling — archive with duplicate pointer, surface duplicate target to admin before acting | Not started |
| **Phase 4** | Optional bulk cleanup with preview — admin sees a list of candidates, confirms, then archives in batch | Not started — requires Phase 2 to be proven safe first |
| **Phase 5** | Hard delete — only after a backup/export mechanism exists; requires explicit per-item admin selection and force flag | Not started — blocked on backup strategy |

---

## 8. Manual Cleanup Rule

**Until Phase 2 backend cleanup is implemented:** use the Review UI filters and the Reject action to move unwanted items to `rejected` state. This is the only approved cleanup mechanism.

Do not manually delete D1 rows using `wrangler d1 execute` or the Cloudflare D1 console except as part of an explicit, separately documented database maintenance plan that has been approved for the current session.

---

## 9. Current Status

**Review features implemented as of 2026-06-02:**

| Feature | Status |
|---|---|
| Review queue view with item list | Done |
| State filters (pending / approved / rejected / all) | Done |
| Item inspection panel | Done |
| Reject with confirmation dialog | Done |
| Action feedback toast | Done |
| State helper text | Done |
| Audit summary (smoke / test / duplicate counts) | Done |
| Archive / hide action | **Not implemented** |
| Duplicate merge / archive | **Not implemented** |
| Bulk cleanup | **Not implemented** |
| Hard delete | **Not implemented** |

Cleanup actions are explicitly **not yet implemented**. This document is the pre-implementation policy that must be in place before any cleanup action is added.
