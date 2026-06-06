# D-47: Evidence Moderation Manual Test Plan

Date: 2026-06-06
Status: Docs-only. Pre-prepared plan. No live tests have been run.

Live app: https://humanx.rinkimirikata.com

---

## How to use this document

Work through each test section in order. Record results in the result table in section 10.
Steps that write to production are marked **[WRITE]**. Read-only steps are marked **[READ]**.

**Do not execute [WRITE] steps without explicit per-session approval.**
Use the `HX_TEST_D47_` prefix on all test-created claims and evidence so they can be
identified and cleaned up later.

---

## 1. Scope and Safety

This plan tests the evidence moderation lifecycle introduced in D-42A/D-42B/D-43:

- New evidence enters `review_state='review'` (not public).
- Admin can approve (→ public), keep pending (→ review), or reject (→ rejected).
- Public Evidence Vault filters pending/rejected evidence.
- Public Claim Study view filters pending/rejected evidence.
- RunPack excludes pending/rejected evidence.
- Report threshold (≥ 2 reports) auto-escalates approved evidence back to review.

**Safety boundaries:**

| Boundary | Rule |
|----------|------|
| No Wrangler | ✅ Not used |
| No D1 console | ✅ Not used |
| No destructive actions | ✅ No hard deletes; reject/archive only |
| Test naming | All test items prefixed `HX_TEST_D47_` |
| Cleanup method | Admin Review UI only (Reject → Archive if smoke artefact eligible) |
| Real user data | Do not reject, archive, or modify items not created during this test |
| Stop conditions | See section 9 |

---

## 2. Preconditions

Before starting any **[WRITE]** steps, confirm all of these:

| # | Precondition | How to verify |
|---|--------------|---------------|
| P-1 | Cloudflare deploy green | Open https://humanx.rinkimirikata.com — app loads |
| P-2 | Read Smoke CI green | Most recent `HumanX Read Smoke` GitHub Actions run: ✅ |
| P-3 | Admin token available | `HUMANX_ADMIN_TOKEN` value in hand |
| P-4 | Browser DevTools console open | Open before first step; stay open throughout |
| P-5 | No console red errors at page load | Confirm before writing any test data |
| P-6 | User session created | Open app once (session created automatically on first API call) |
| P-7 | Evidence Vault accessible | Navigate to Vault tab — renders without errors |
| P-8 | Review queue accessible | Navigate to Review tab, enter admin token, click Load Queue |

---

## 3. Test A — New Evidence Enters Review **[WRITE]**

**Purpose:** Confirm that evidence submitted through the normal UI enters `review_state='review'`
and is not publicly visible until approved.

### Steps

| # | Action | Type |
|---|--------|------|
| A-1 | Navigate to Claims tab. Find or create a suitable test claim. If creating, title it `HX_TEST_D47_Claim_A` and submit it. Wait for it to appear in Review queue, then approve it (admin action). | [WRITE] |
| A-2 | Open the approved claim in Study view. | [READ] |
| A-3 | In the Study view Add Evidence panel, submit evidence with: title `HX_TEST_D47_Evidence_A`, body text describing a test source, stance `support`, quality `anecdotal`. | [WRITE] |
| A-4 | Immediately after submission: navigate to Evidence Vault. Search for `HX_TEST_D47_Evidence_A`. | [READ] |
| A-5 | Open the approved parent claim in Study view. Confirm the submitted evidence does **not** appear in the Evidence list. | [READ] |
| A-6 | Open Review queue (admin). Confirm `HX_TEST_D47_Evidence_A` appears as an item with `target_type='evidence'`. | [READ] |
| A-7 | Click Inspect on the evidence item. | [READ] |

### Expected results

| Check | Expected |
|-------|----------|
| A-4: Vault search | Evidence does **not** appear — `review_state='review'` filters it |
| A-5: Study view evidence list | Evidence does **not** appear |
| A-6: Review queue card | Purple `evidence` badge, title shows `HX_TEST_D47_Evidence_A` |
| A-7: Inspect panel | Fields visible: Title, Body, Stance, Quality; `Parent Claim` links to parent; no Mark Duplicate or Dismiss ~Similar buttons; Approve / Keep Pending / Reject buttons present |
| Throughout: console | No red errors |

---

## 4. Test B — Approve Evidence **[WRITE]**

**Purpose:** Confirm that approving evidence makes it publicly visible.

Precondition: Test A passed. `HX_TEST_D47_Evidence_A` is in the Review queue.

### Steps

| # | Action | Type |
|---|--------|------|
| B-1 | In Review queue, inspect `HX_TEST_D47_Evidence_A`. Click **Approve**. | [WRITE] |
| B-2 | Confirm toast: "Approved. Item is now public." or equivalent. | [READ] |
| B-3 | Navigate to Evidence Vault. Search for `HX_TEST_D47_Evidence_A`. | [READ] |
| B-4 | Open the parent claim in Study view. Confirm the evidence now appears in the Evidence list. | [READ] |
| B-5 | Check console for errors. | [READ] |

### Expected results

| Check | Expected |
|-------|----------|
| B-2: Toast | Approval success message |
| B-3: Vault | `HX_TEST_D47_Evidence_A` is visible |
| B-4: Study view | Evidence appears with correct stance badge |
| B-5: Console | No red errors |

---

## 5. Test C — Reject Evidence **[WRITE]**

**Purpose:** Confirm that rejected evidence stays hidden from public views.

### Steps

| # | Action | Type |
|---|--------|------|
| C-1 | Submit a second evidence item on the same parent claim: title `HX_TEST_D47_Evidence_C`, body text, stance `pressure`, quality `weak`. | [WRITE] |
| C-2 | Open Review queue. Confirm `HX_TEST_D47_Evidence_C` appears as a pending evidence card. | [READ] |
| C-3 | Inspect `HX_TEST_D47_Evidence_C`. Click **Reject**. Confirm reject button / confirm reject flow. | [WRITE] |
| C-4 | Navigate to Evidence Vault. Search for `HX_TEST_D47_Evidence_C`. | [READ] |
| C-5 | Open the parent claim in Study view. Confirm `HX_TEST_D47_Evidence_C` does **not** appear. | [READ] |
| C-6 | In Review queue, switch filter to **Rejected**. Confirm `HX_TEST_D47_Evidence_C` appears there. | [READ] |

### Expected results

| Check | Expected |
|-------|----------|
| C-4: Vault | Evidence does **not** appear |
| C-5: Study view | Evidence does **not** appear |
| C-6: Rejected filter | Evidence visible in Rejected view |

---

## 6. Test D — Report Evidence Escalation **[WRITE / conditional]**

**Purpose:** Confirm that ≥ 2 user reports auto-escalate approved evidence back to
`review_state='review'`.

**Note:** The Report button for evidence exists in the Study view evidence cards only if
the UI exposes a report action. Verify that `POST /api/report` with `targetType='evidence'`
is reachable via the UI before proceeding. If no UI report path for evidence is visible,
mark D as **PENDING — UI path not exposed** and skip to Test E.

Precondition: `HX_TEST_D47_Evidence_A` is approved and public (Test B passed).

### Steps

| # | Action | Type |
|---|--------|------|
| D-1 | In Study view, locate the approved `HX_TEST_D47_Evidence_A`. Look for a Report button or context action on the evidence card. | [READ] |
| D-2 | If report UI is present: report the evidence once (from user session 1). Record evidence ID from DevTools network tab (`POST /api/report` request body). | [WRITE / conditional] |
| D-3 | If possible with a second anonymous session or second user: report the same evidence ID again (report #2 triggers escalation at `report_count >= 2`). | [WRITE / conditional] |
| D-4 | Open Review queue (admin). Check if `HX_TEST_D47_Evidence_A` reappears in the Pending filter with a ⚑ reports badge. | [READ] |
| D-5 | Check console for errors throughout. | [READ] |

### Expected results

| Check | Expected |
|-------|----------|
| D-2/D-3 network | `POST /api/report` returns `{ ok: true }` |
| D-4: Review queue | Evidence reappears with `report_count >= 2` and ⚑ badge |
| D-5: Console | No red errors |

**If no evidence report UI path exists:** Record "D — PENDING (no UI path)" and proceed to Test E.
Direct API report via DevTools console is acceptable if user confirms it:
```js
// In browser console only — paste and run if user explicitly approves
await fetch('/api/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-humanx-user': '<your-user-id>' },
  body: JSON.stringify({ targetType: 'evidence', targetId: '<evidence-id>', reason: 'HX_TEST_D47 report test' })
}).then(r => r.json()).then(console.log);
```
Do not run this without explicit session approval.

---

## 7. Test E — RunPack Filtering **[WRITE]**

**Purpose:** Confirm that pending/rejected evidence is excluded from Investigation Packets
and only approved evidence is included.

Precondition: Parent test claim from Test A is approved and public.

### Steps

| # | Action | Type |
|---|--------|------|
| E-1 | Submit a third evidence item: title `HX_TEST_D47_Evidence_E`, body, stance `support`, quality `good`. Do not approve it yet. | [WRITE] |
| E-2 | In Study view for the parent claim, click **Build RunPack** (or Create Investigation Packet). | [WRITE] |
| E-3 | After packet builds, click **Technical packet JSON** to expand and inspect it. Search the JSON for `HX_TEST_D47_Evidence_E`. | [READ] |
| E-4 | Open Review queue. Approve `HX_TEST_D47_Evidence_E`. | [WRITE] |
| E-5 | Return to Study view. Click **Recreate Packet**. | [WRITE] |
| E-6 | Inspect the new packet JSON. Search for `HX_TEST_D47_Evidence_E`. | [READ] |
| E-7 | Check console for errors. | [READ] |

### Expected results

| Check | Expected |
|-------|----------|
| E-3: Before approval | `HX_TEST_D47_Evidence_E` does **not** appear in packet JSON |
| E-6: After approval | `HX_TEST_D47_Evidence_E` **appears** in packet JSON |
| E-7: Console | No red errors |

---

## 8. Cleanup **[WRITE]**

After all tests are complete, clean up test items through the admin Review UI only.
Do not use D1 console or Wrangler.

| # | Action |
|---|--------|
| CL-1 | Open Review queue. Switch to **All** filter. Search or scroll to find all `HX_TEST_D47_` items. |
| CL-2 | For each test evidence item still in `public` or `review` state: Inspect → Reject. |
| CL-3 | For the test claim `HX_TEST_D47_Claim_A` (if created): Inspect → Reject. |
| CL-4 | Switch to **Rejected** filter. Confirm all `HX_TEST_D47_` items appear there. |
| CL-5 | If eligible (item text contains `HX_TEST_D47` or `smoke`/`test`), use **Archive test artefact** to remove from active queue. |
| CL-6 | Record any items that could not be archived (e.g. real claims attached to test evidence). |

**Items remain in the database for audit — archived state removes from active queue, no hard delete.**

---

## 9. Stop Conditions

Halt the test session immediately if any of the following occur:

| Condition | Action |
|-----------|--------|
| Any unhandled console red error during a test step | Record error text + stack. Stop. Note step that triggered it. |
| Evidence review card renders blank or crashes the Review queue | Stop. Note which evidence ID caused it. |
| Approve/Reject/Keep action mutates the wrong item | Stop. Check Review queue state before proceeding. |
| Public Evidence Vault exposes pending (`review`) or rejected evidence | Critical — record URL + evidence ID. Stop. |
| Public Claim Study shows pending or rejected evidence | Critical — record which claim + evidence ID. Stop. |
| RunPack packet JSON includes pending or rejected evidence | Critical — record packet contents. Stop. |
| Admin buttons (Approve/Keep/Reject) missing from inspect panel for evidence item | Record item shape from DevTools. Stop. |
| Parent claim link ("Study Parent Claim ↗") navigates to wrong claim or 404 | Record. Do not approve — stop the test. |

---

## 10. Result Table

Fill in during or immediately after each test step.

| Test | Step | Status | Evidence ID | Claim ID | Result | Notes |
|------|------|--------|-------------|----------|--------|-------|
| A | A-1 | | | | | |
| A | A-2 | | | | | |
| A | A-3 | | | | | |
| A | A-4 | | | | | |
| A | A-5 | | | | | |
| A | A-6 | | | | | |
| A | A-7 | | | | | |
| B | B-1 | | | | | |
| B | B-2 | | | | | |
| B | B-3 | | | | | |
| B | B-4 | | | | | |
| B | B-5 | | | | | |
| C | C-1 | | | | | |
| C | C-2 | | | | | |
| C | C-3 | | | | | |
| C | C-4 | | | | | |
| C | C-5 | | | | | |
| C | C-6 | | | | | |
| D | D-1 | | | | | |
| D | D-2 | | | | | |
| D | D-3 | | | | | |
| D | D-4 | | | | | |
| D | D-5 | | | | | |
| E | E-1 | | | | | |
| E | E-2 | | | | | |
| E | E-3 | | | | | |
| E | E-4 | | | | | |
| E | E-5 | | | | | |
| E | E-6 | | | | | |
| E | E-7 | | | | | |
| CL | CL-1..6 | | | | | |

**Overall: PASS / FAIL / PARTIAL — fill in after execution.**

---

## 11. After Execution

After completing this plan:

1. Record D-48 validation doc with:
   - Overall pass/fail result
   - Any stop conditions hit
   - Evidence IDs created and their final state
   - Any issues found (link to GitHub issue if filed)
2. Confirm cleanup complete (no `HX_TEST_D47_` items in public state).
3. Update `docs/PROJECT_STATE.md` to mark D-47 as executed.

---

## Reference

| Doc | Purpose |
|-----|---------|
| `docs/D42A_EVIDENCE_MIGRATION_APPLY_RESULT.md` | Migration 0007 apply record |
| `docs/D42B_EVIDENCE_MODERATION_BACKEND.md` | Backend behaviour spec |
| `docs/D43_EVIDENCE_REVIEW_FRONTEND.md` | Frontend review UI spec |
| `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` | General UI test plan (claims, truths, moderation) |
| `docs/API_ENDPOINT_INVENTORY.md` | Endpoint reference |
