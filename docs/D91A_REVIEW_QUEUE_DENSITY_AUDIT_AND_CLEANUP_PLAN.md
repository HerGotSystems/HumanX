# D-91A — Review Queue Density Audit and Cleanup Plan

**Date:** 2026-06-08
**Type:** Docs-only (direct main)
**Static checks:** 204 / 24 / 39

---

## A. Scope and safety

This document is **read-only analysis and planning**. No live data mutations, no moderation
actions, no D1 commands, no archive/reject/approve/cleanup calls were made in this batch.

All item lists and counts are reconstructed from prior D-84 through D-90H records. They
are believed accurate but must be verified against the live queue before any action batch
is executed.

---

## B. Current known Review queue state

**Last verified queue state: post-D-88N / post-D-90H (pressure moderation live)**

| State | Count | Notes |
|---|---|---|
| `review` (pending) | **≥13** | 13 from D-86A + any new pressure/evidence since D-90H |
| `public` | **5** | Exactly 5 editorial launch seed claims |
| `rejected` | **15** | 15 substantive Group D items, retained for audit |
| `archived` | **11** | 1 pre-existing + 10 from D-88E–N sequence |
| `duplicate` | **≥1** | At least 1 from D-24E sequence |

**Since D-90H**, new pressure items submitted via live testing and real users may have
entered `review_state='review'` (by design — all new pressure enters Review). These are
**not yet counted** above and represent the primary new source of queue density.

### What the admin currently sees when opening Review

With the default `Pending` filter active, the queue shows a mixed list of:
1. New legitimate pressure items (orange badge) — the items that matter most
2. New legitimate evidence items (purple badge) — also priority
3. Old returned demo-seed claims (4 from D-85J–M)
4. Old returned HX-dev-seed claim (HX-000003 dream prediction)
5. Old returned test-account belief claims (6 from D-85N–R, D-85I×2)
6. Two D-84 judgment-call claims ("Hard work always pays off", "UK Covid contracts")
7. Any evidence items from D-47 test plan (if ever executed)

All of these appear together, sorted by age, with no type grouping. The demo/test items
(items 3–6) have `rc-chip-origin` chips from D-87B, but they still occupy card space and
push real moderation items down.

---

## C. Review item categories (full taxonomy)

| Category | Description | Expected count |
|---|---|---|
| **C1 — New pressure** | Pressure items at `review_state='review'` submitted since D-90H | Unknown — requires live inventory |
| **C2 — New evidence** | Evidence items at `review_state='review'` submitted by real users | Unknown — requires live inventory |
| **C3 — New claims/truths** | Claims or truths at `review_state='review'` from real users | Unknown — requires live inventory |
| **C4 — Old demo seeds** | 4 demo-seed claims returned to review in D-85J–M (`clm_seed_*`, `humanx-seed` handle) | 4 known |
| **C5 — HX dev seed** | HX-000003 "A dream predicted my future" (`anon-o_seed` handle) | 1 known |
| **C6 — Test-account beliefs** | 6 returned test-account claims (anon-xksavy, D-85N–R + D-85I×2) | 6 known |
| **C7 — Judgment-call claims** | 2 non-test claims kept pending: "Hard work always pays off" and "UK Covid contracts" | 2 known |
| **C8 — Rejected but visible** | 15 Group D rejected claims still in queue (not archived, not removed) | 15 known |
| **C9 — Archived (hidden)** | 11 items archived via D-88E–N — do not appear in active queue | 11 known |

### Known C4 items (old demo seeds — all `review_state='review'`)

| ID | Claim | Handle | Origin label |
|---|---|---|---|
| `clm_seed_0f5608464fb5` | "The Earth is flat" | `humanx-seed` | demo-seed |
| `clm_seed_f5699c8aa3a4` | "Humans landed on the Moon" | `humanx-seed` | demo-seed |
| `clm_seed_f4d482242f5f` | "A dream predicted my future" | `humanx-seed` | demo-seed |
| `clm_seed_8ce1875d322b` | "Perpetual motion machines can produce free energy forever" | `humanx-seed` | demo-seed |

These are `duplicateOf` the rejected HX-000001/HX-000002/HX-000003 items. The archive
policy in `reviewCleanup` will NOT archive them directly because they are at `review_state='review'`,
not `rejected`. They must be rejected first before an archive path opens.

### Known C5 item

| ID | Statement | Handle | Origin label |
|---|---|---|---|
| `HX-000003` | "A dream predicted my future" | `anon-o_seed` | hx-seed |

Returned to review in D-85H. Same content as demo seed `clm_seed_f4d482242f5f`.

### Known C6 items (test-account, `anon-xksavy`)

| ID | Claim | State |
|---|---|---|
| `clm_5624bd2c8d9246598a` | "Money is evil" | review |
| `clm_37d2e262976f46d2b4` | "Money is evil" (duplicate) | review |
| `clm_97c7f7a525c54276bc` | "You can be anything you want" | review |
| `clm_3bc837c5d8a24cf9b5` | "People are basically good" | review |
| `clm_6032e1bc88ff443587` | "god exist" | review |
| `clm_6f14973b90ed48c3bb` | "Everything happens for a reason" | review |

### Known C7 items (judgment calls, keep pending)

| ID | Claim | Reason to keep |
|---|---|---|
| `clm_af8da34be53b40f395` | "Hard work always pays off" | Plausible proverb, debatable, 1 report |
| `clm_13afcc7128054661a3` | "The UK government published Covid vaccine contract terms in 2021" | Potentially factual, testable, 0 reports |

### Known C8 items (rejected but visible — Group D, 15 items)

These are substantive, controversial, or editorially sensitive items. They are correctly
rejected and should NOT be archived. They remain as audit records.

Examples include: "Never trust the experts" (Proven artifact), "Children should always
obey adults" (Proven artifact), "People are stupid" (vague insult, Proven artifact),
"PEOPLE ARE STUPID", "god exist" variants rejected earlier, and others.

Full list is in `docs/D88D_ARCHIVE_DRY_PLAN.md` Group D section.

---

## D. Decision policy

| Category | Recommended action | Notes |
|---|---|---|
| **C1 — New pressure** | Inspect individually; Approve if factual and specific; Reject if spam/junk | Priority — these are why Review exists now |
| **C2 — New evidence** | Inspect individually; Approve with source; Reject if unsourced/spam | Priority |
| **C3 — New claims/truths** | Inspect individually; check claim quality hints; Approve/Keep/Reject | Normal moderation flow |
| **C4 — Old demo seeds** | Reject, then archive via `test_artifact_v2` | All are duplicateOf rejected items; safe to reject+archive |
| **C5 — HX dev seed** | Reject, then archive via `test_artifact_v2` | Same content as C4 counterpart |
| **C6 — Test-account beliefs** | Reject | These are real beliefs but from dev/test account; content not launch-quality; `isSuspectedTestArtefact` detects them; archive only if `test_artifact_v2` path opens |
| **C7 — Judgment-call claims** | Keep pending | Wait for source evidence or editorial decision; do not reject speculatively |
| **C8 — Rejected but visible** | Do not touch | They are correctly rejected and serve as audit records; do not archive substantive content |
| **C9 — Archived** | No action needed | Already removed from active queue |

### Archive policy reminder

The backend `reviewCleanup` only archives items that are already `rejected`. The path for
C4/C5 items is:
1. Reject (POST `/api/review/decision` with `decision:'rejected'`)
2. Archive (POST `/api/review/cleanup` with `target_id` + `target_type:'claim'`)

The archive will succeed automatically via `test_artifact_v2` path because C4/C5 items
have `clm_seed_*` IDs or `anon-o_seed` / `humanx-seed` handles that `isSuspectedTestArtefact`
detects. No `junk_override` needed.

---

## E. UI/UX polish recommendations (safe frontend-only)

These are **recommended future improvements** — none are required for correctness. All
are frontend-only and do not need backend changes.

### E1 — Persist selected filter in `localStorage` (D-91E priority)

Currently `reviewStateFilter` resets to `'review'` on every page load. An admin working
through pressure items repeatedly has to re-select the Pressure filter on every visit.

```js
// On setReviewFilter:
localStorage.setItem('hx_review_filter', f);
// On Review tab open:
reviewStateFilter = localStorage.getItem('hx_review_filter') || 'review';
```

**Tradeoff:** Default `'review'` is correct for first-time admins. Persisting is correct
for working admins. Recommend persist with `'review'` fallback if no stored value.

### E2 — Add `evidence` filter chip

Currently the filter bar has `Pressure` chip but no `Evidence` chip. With evidence
moderation live (D-42B), admins need to quickly isolate evidence items.

```js
evidence: list.filter(i => (i.target_type||...) === 'evidence').length,
// in defs: ['evidence', 'Evidence']
```

### E3 — Stale-review age highlight

Items older than 14 days with `review_state='review'` should show a subtle amber age
indicator beyond the current plain text "Updated Xd ago". A CSS class on the age line
based on `reviewAge` value would be sufficient.

### E4 — Type-grouped display option

An optional "Group by type" toggle that renders Pressure items first, then Evidence, then
Claims, then Truths within the current filter. This makes the priority item types
(pressure/evidence) visually prominent without requiring a filter switch.

### E5 — Demo/test items muted in Pending view

When `reviewStateFilter === 'review'`, items where `isSuspectedTestArtefact(item) === true`
could render with a subtle opacity reduction (e.g., `.review-card-demoted { opacity: 0.6 }`).
This signals "lower priority" without hiding them or taking action.

### E6 — Compact card for rejected items in rejected view

The `Rejected` filter view currently renders full cards for 15 Group D items. A compact
"rejected item row" (no action buttons, just ID + title + reject-date) would reduce scroll
depth when reviewing the archived state.

### E7 — Audit summary: de-emphasise Archived count

The `Archived` expandable in the audit summary is currently styled equivalently to active
stats. A lighter muted style (already has `review-audit-stat-archived`) could be made more
visually recessive so it doesn't compete with the active Pending/Reported counts.

---

## F. Cleanup execution plan

**Do NOT execute this plan in D-91A.** The plan defines future batches only.

### D-91C — Manual browser inventory (docs-only)

User opens live Review UI, works through queue, fills in the inventory template in
Section H below. CC then produces an item-by-item action plan. No mutations.

### D-91D — Manual admin cleanup batch (scoped)

Reject + archive C4 demo seeds (4 items) and C5 HX dev seed (1 item). Each item requires
two POSTs (reject, then archive). Explicit per-item approval. One scoped group only per
batch to limit blast radius.

Order: reject all 5 items → verify queue → archive all 5 items → verify archived_total.

### D-91E — Frontend Review density polish

Implement E1 (localStorage filter persistence) + E2 (Evidence filter chip) from Section E.
Possibly E5 (muted demo-test cards). Branch + PR. Smoke tests updated.

### D-91F — Post-cleanup checkpoint

Docs-only. Record final queue state after D-91C/D are complete. Confirm public=5, review
contains only real moderation items + C7 judgment calls.

---

## G. Stop conditions for any future cleanup

These rules apply to **every** cleanup batch, including D-91D and beyond:

1. **Do not reject factual claims just because they are awkward or low-quality.** "Hard
   work always pays off" and "UK Covid contracts" must not be rejected without editorial
   review.
2. **Do not archive substantive rejected content.** The 15 Group D rejected items are
   audit records. They are correctly rejected; archiving would remove them from admin view.
3. **Do not bulk action without an item list.** Every reject, return-to-review, or archive
   must name the exact item ID and claim text before the POST is made.
4. **Do not automatically merge/suppress ~similar items.** Similar flags are advisory;
   human judgment required.
5. **Do not delete anything.** Archive → deleted is irreversible via UI. Archive is only
   for test artefacts.
6. **Archive only rejected smoke/test artifacts** confirmed by `isSuspectedTestArtefact`
   or explicit `junk_override` with human reason string.
7. **Pressure and evidence items must be judged individually.** No batch approve/reject
   of pressure or evidence — each one may affect claim scores and RunPack content.
8. **Stop and report if queue state differs from expected.** If item counts do not match
   this document, pause and re-audit before proceeding.

---

## H. Manual browser inventory template

User fills this table from the live Review admin UI before D-91C planning begins.

| Item ID | Type | Title / Statement | Origin / Handle | State | Reports | Age | Category | Recommended action | Reason |
|---|---|---|---|---|---|---|---|---|---|
| *(fill from UI)* | claim/truth/evidence/pressure | *(first 60 chars)* | *(origin chip value)* | review/rejected/public | *(count)* | *(age string)* | C1–C8 | approve / keep / reject / archive / do-not-touch | *(brief reason)* |

**How to fill:**
1. Open Review tab as admin (enter token).
2. Select "All" filter to see everything.
3. For each card, note ID (visible in Inspect panel → ID field), type badge, title,
   origin chip (demo-seed / hx-seed / test-account / user handle), state badge, report
   count, age string.
4. Assign category from Section C above.
5. Assign recommended action from Section D above.
6. Paste completed table into D-91C doc.

---

## I. Recommended next CC prompt (D-91C)

> We are continuing HumanX. Current batch: D-91C — Review queue manual inventory.
>
> Context: D-91A defined category taxonomy (C1–C8) and action policy for the Review queue.
> Known items: 13 pending claims (C4×4, C5×1, C6×6, C7×2) plus unknown number of new
> pressure/evidence items since D-90H.
>
> Task: Prepare a manual browser inventory checklist the user can fill in during a live
> admin Review session. The checklist must:
> - List all known C4/C5/C6/C7 items with pre-filled ID, category, and recommended action.
> - Leave rows blank for any new C1/C2/C3 pressure/evidence/claims that appear.
> - Include step-by-step instructions for opening each item in Inspect panel to copy the ID.
> - Include a verification checklist: expected count before and after, stop conditions.
>
> Hard rules: docs-only, direct main, no live endpoint calls, no moderation actions.
> Output: docs/D91C_REVIEW_QUEUE_MANUAL_INVENTORY_CHECKLIST.md

---

## Appendix: Current filter chips and their coverage

| Filter chip | What it shows | Gap |
|---|---|---|
| Pending | `review_state='review'` | Mixes all types; demo/test mixed with real |
| Public | `review_state='public'` | Fine |
| Rejected | `review_state='rejected'` | Full cards for 15 items; could be compact |
| Reported | `report_count > 0` | Fine |
| ~Similar | `near_duplicate_of` set | Fine |
| ~Quality | Claims with quality hints | Fine; skips pressure/evidence/truth |
| Pressure | `target_type='pressure'` | ✅ Present since D-90G |
| Dupes | `duplicate_of` or `near_duplicate_of` | Fine |
| Demo/Test | `isSuspectedTestArtefact` | ✅ Present since D-87B |
| All | Everything | Fine |
| **Evidence** | `target_type='evidence'` | ❌ **Missing** — D-91E recommendation E2 |
