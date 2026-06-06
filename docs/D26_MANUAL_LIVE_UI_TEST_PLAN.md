# D-26: Manual Live UI Test Plan

Date: 2026-06-06
Status: Docs-only. No live write tests have been run. This document is a pre-prepared plan for the user to execute when ready.

Live app: https://humanx.rinkimirikata.com

---

## How to use this document

Work through each section in order. Record results in the Pass/Fail capture table at the end of each section. Destructive steps (those that write to production D1) are marked **[WRITE]**. Read-only steps are marked **[READ]**. Steps that are explicitly optional are marked **[OPTIONAL]**.

Do not execute **[WRITE]** steps on production without deliberate intent. Use the `HX_TEST_D26_` naming prefix for all test-created claims so they can be identified and cleaned up later.

---

## 1. Preconditions

| Precondition | Notes |
|-------------|-------|
| Admin token available | You must have the `HUMANX_ADMIN_TOKEN` value to access the Review queue and use moderation controls |
| Live site reachable | https://humanx.rinkimirikata.com must load without Cloudflare error |
| Test claim naming convention | All test-created claims must begin with `HX_TEST_D26_` so they are identifiable for cleanup |
| No real-user data destruction | Do not reject or archive claims submitted by real users during testing. Only operate on your own `HX_TEST_D26_` test items |
| Browser console open | Open DevTools → Console before starting. Record any errors seen |
| No Wrangler / D1 console | Do not use `wrangler d1 execute` or the Cloudflare D1 console during this test session unless cleanup requires it |

---

## 2. Read-only smoke sequence [READ]

Verify basic navigation and rendering. No account or admin token required for most steps.

### Steps

1. Open https://humanx.rinkimirikata.com in a fresh browser tab (or incognito).
2. Confirm the Home workspace loads — graph status box visible, hero copy present.
3. Click **Claims** in the sidebar. Confirm the claims grid renders without blank panels.
4. Click at least one claim card. Confirm Study view opens and shows claim details.
5. Click **← Back** (or back button). Confirm you return to Claims.
6. Click **Truths** in the sidebar. Confirm the Truths workspace renders.
7. Click **Evidence Vault** in the sidebar. Confirm the Vault renders without errors.
8. Click **RunPack** / Investigation Packet in the sidebar (or via Study dock). Confirm the RunPack panel renders in its default state.
9. Open browser DevTools console. Confirm no red errors on page load or during any of the above navigation steps.

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 2.1 | Open home page | Home workspace loads, graph status visible | | | |
| 2.2 | Navigate to Claims | Claims grid renders, no blank panels | | | |
| 2.3 | Open a claim (Study) | Study view shows claim details | | | |
| 2.4 | Back from Study | Returns to Claims grid | | | |
| 2.5 | Navigate to Truths | Truths workspace renders | | | |
| 2.6 | Navigate to Evidence Vault | Vault renders without errors | | | |
| 2.7 | Navigate to RunPack/Inv. Packet | Panel renders in default state | | | |
| 2.8 | Check console | No red errors during all above steps | | | |

---

## 3. Claim submission / exact duplicate flow [WRITE]

Tests the intake path and exact-duplicate detection.

### Steps

1. Navigate to **Submit** (or Submit Claim).
2. Enter claim text: `HX_TEST_D26_EXACT_DUPLICATE This is a test claim for D-26 exact duplicate detection`
3. Select a category and claim type.
4. Submit. Confirm it enters Review (you should see a "submitted for Review" confirmation, not an "already exists" panel).
5. Submit the **identical** claim text again (same text, same category and type).
6. Confirm the response shows "already exists" and links to the existing claim — NOT a second submission to Review.
7. [OPTIONAL] Navigate to the Review queue (admin token required) and confirm only one instance of the test claim appears.

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 3.1 | Submit new test claim | "Submitted for Review" confirmation panel | | | |
| 3.2 | Submit exact duplicate | "Already exists" panel with Study link | | | |
| 3.3 | [OPTIONAL] Review queue check | Only one instance in queue | | | |

---

## 4. Near-duplicate advisory flow [WRITE]

Tests the soft-similarity warning on intake and the Dismiss ~Similar control in Review.

### Steps

1. Submit a new claim: `HX_TEST_D26_NEAR_DUP_A Testing near-duplicate advisory detection in HumanX review`
2. Confirm it enters Review without a duplicate warning.
3. Submit a semantically similar claim: `HX_TEST_D26_NEAR_DUP_B Near-duplicate advisory detection test for HumanX review queue`
4. Confirm the submission shows a soft warning / similar badge (not rejected, not exact-duplicate).
5. Navigate to Review queue (admin token required).
6. Locate the `HX_TEST_D26_NEAR_DUP_B` item. Confirm it shows the `~Similar` amber badge and advisory banner in the inspect panel.
7. **[OPTIONAL / WRITE]** Click **Dismiss ~Similar** on `HX_TEST_D26_NEAR_DUP_B`. Confirm the `hxModal` opens for confirmation. Confirm, then verify the `~Similar` badge disappears and the queue reloads.

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 4.1 | Submit first near-dup claim | Enters Review, no warning | | | |
| 4.2 | Submit similar claim | Soft warning / similar badge on intake | | | |
| 4.3 | Review queue: similar badge | `~Similar` amber badge visible on card | | | |
| 4.4 | Review inspect panel | Advisory banner + `Similar claim (advisory)` field shown | | | |
| 4.5 | [OPTIONAL] Dismiss ~Similar | hxModal opens, confirm clears advisory, queue reloads | | | |

---

## 5. Review moderation basic flow [WRITE]

Tests Approve / Keep Pending / Reject paths. Use only `HX_TEST_D26_` items.

### Steps

1. In the Review queue, locate a `HX_TEST_D26_` item (or submit a fresh one: `HX_TEST_D26_BASIC_REVIEW Basic review moderation flow test`).
2. Open the inspect panel for the item. Confirm the compact action bar (Approve / Keep Pending / Reject) appears above the fields block, and the full action row appears below.
3. Confirm the position indicator (`N of M · X hints`) is visible.
4. Confirm **Prev** / **Next** navigation buttons work if there is more than one item.
5. Click **Reject** on the `HX_TEST_D26_BASIC_REVIEW` item. Confirm the rejection modal/confirmation appears. Confirm.
6. Verify the item disappears from the active review queue.
7. [OPTIONAL] Run **Archive Cleanup** (admin-only) to clear the rejected item.

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 5.1 | Open inspect panel | Compact action bar + full action row visible | | | |
| 5.2 | Position indicator | `N of M · X hints` shown | | | |
| 5.3 | Prev/Next navigation | Moves between review items | | | |
| 5.4 | Reject test item | Modal appears, item leaves queue after confirm | | | |
| 5.5 | [OPTIONAL] Archive cleanup | Rejected item archived, no longer visible | | | |

---

## 6. Duplicate-resolution flow [WRITE]

Tests the Mark Duplicate modal and backend route end-to-end.

### Steps

1. Submit two disposable claims:
   - `HX_TEST_D26_DUP_SOURCE This is the source claim to be marked as a duplicate`
   - `HX_TEST_D26_DUP_CANONICAL This is the canonical claim that the source duplicates`
2. Navigate to Review queue. Confirm both items appear.
3. Note the claim ID of `HX_TEST_D26_DUP_CANONICAL` (visible in the inspect panel or URL).
4. Open the inspect panel for `HX_TEST_D26_DUP_SOURCE`.
5. Confirm the **"Mark Duplicate…"** button is visible in the inspect panel (muted purple style).
6. Click **"Mark Duplicate…"**. Confirm the `hxModal` opens with a target claim ID input field and optional reason field.
7. Enter the ID of `HX_TEST_D26_DUP_CANONICAL` in the target field. Optionally enter a reason.
8. Confirm. Verify:
   - `HX_TEST_D26_DUP_SOURCE` disappears from the active Review queue.
   - `HX_TEST_D26_DUP_CANONICAL` remains in the queue.
   - No evidence was moved or deleted (verify via Evidence Vault if any evidence was attached).
9. [OPTIONAL] Open the Study view for `HX_TEST_D26_DUP_CANONICAL` and confirm no unexpected changes to its evidence or pressure blocks.

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 6.1 | Submit source + canonical claims | Both appear in Review queue | | | |
| 6.2 | Mark Duplicate button visible | Muted purple button in inspect panel | | | |
| 6.3 | hxModal opens | Target claim ID input + optional reason field visible | | | |
| 6.4 | Confirm Mark Duplicate | Source leaves queue, canonical remains | | | |
| 6.5 | Evidence integrity | No evidence moved or deleted | | | |
| 6.6 | [OPTIONAL] Study canonical | Canonical claim study view unaffected | | | |

---

## 7. Study continuity [READ / WRITE]

Tests that scroll position and navigation context are preserved across Study round-trips.

### Steps

**7A — Claims → Study → Back (scroll restoration)**

1. Navigate to **Claims**. Scroll down the claims grid until several rows are not visible at the top.
2. Click into any visible claim. Study view opens.
3. Click **← Back**. Confirm the Claims grid scrolls back to approximately the same vertical position as before entering Study.

**7B — Review → Study → Back (context restoration)**

1. Navigate to **Review** queue (admin token required). Open the inspect panel for any item.
2. Click **Open in Study** (or equivalent — opens that claim in Study view with "← Back to Review" back button).
3. Confirm the back button reads "← Back to Review" (not "← Back").
4. Click the back button. Confirm you return to Review with the same item's inspect panel open (not closed/reset).

**7C — Vault → Study → Back (context restoration)**

1. Navigate to **Evidence Vault**.
2. Click a **Study Linked Claim** link on any evidence item.
3. Confirm the Study view opens and back button reads "← Back to Vault" (or similar).
4. Click back. Confirm you return to the Vault (not Claims or Home).

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 7A.1 | Scroll Claims grid, enter Study | Study opens | | | |
| 7A.2 | Back from Study | Claims grid restores scroll position | | | |
| 7B.1 | Review → Open in Study | Back button reads "← Back to Review" | | | |
| 7B.2 | Back from Study | Returns to Review, inspect panel restored | | | |
| 7C.1 | Vault → Study Linked Claim | Study opens with correct back label | | | |
| 7C.2 | Back from Study | Returns to Vault | | | |

---

## 8. RunPack provenance [READ / OPTIONAL WRITE]

Tests RunPack packet generation and provenance metadata.

### Steps

1. Navigate to **Claims**. Open any claim in Study.
2. In the Study dock, click **Build RunPack** (or "Build Investigation Packet").
3. Click **Copy Packet** (or Download). Inspect the JSON content.
4. Verify the packet contains:
   - `packet_id` — a non-empty string
   - `runpack_version` — `"1.2"`
   - `generated_at` — an ISO timestamp
   - `source_claim_id` — the claim's ID
   - `evidence_count` and `pressure_count` — numeric values
5. **[OPTIONAL / WRITE]** Attach a new piece of evidence to the claim while the packet is still in memory. Return to the Study dock. Confirm the "Possibly stale" advisory chip appears on the packet summary.
6. **[OPTIONAL]** Paste an AI analysis return into the return field. Use a different `packet_id` than the one generated. Confirm the non-blocking mismatch advisory toast appears.

### Pass/fail capture

| ID | Action | Expected | Actual | P/F | Notes |
|----|--------|----------|--------|-----|-------|
| 8.1 | Build RunPack | Packet generated, Copy/Download available | | | |
| 8.2 | Inspect packet JSON | `packet_id`, `runpack_version:'1.2'`, `generated_at`, `source_claim_id` present | | | |
| 8.3 | Evidence/pressure counts | Numeric values matching claim's actual evidence | | | |
| 8.4 | [OPTIONAL] Mutate evidence | "Possibly stale" chip appears on packet summary | | | |
| 8.5 | [OPTIONAL] Mismatched packet_id return | Non-blocking advisory toast shown | | | |

---

## 9. Safety cleanup

After testing, identify all `HX_TEST_D26_` claims in the Review queue and clean up:

| Cleanup step | Method | Safety constraint |
|-------------|--------|------------------|
| Reject disposable test claims | Review → Reject (admin-only) | Only reject your own `HX_TEST_D26_` items |
| Archive rejected test artefacts | Review → Archive Cleanup (admin-only) | Only archived items are eligible; cannot be undone |
| Claims already marked `duplicate` | Already excluded from Review queue; no further action needed | Source claim record is preserved (not deleted) — this is by design |
| Verify no real-user data touched | Check that no non-`HX_TEST_D26_` items were approved/rejected/archived during the session | Review the admin action log if available |

**Do not:**
- Use `wrangler d1 execute` to manually delete rows unless absolutely necessary and explicitly approved.
- Archive or reject claims not prefixed `HX_TEST_D26_`.
- Apply migration 0006 to production during cleanup.

---

## 10. Overall pass/fail summary

Fill this in after completing all sections:

| Section | All pass? | Blockers / notes |
|---------|-----------|-----------------|
| 2. Read-only smoke | | |
| 3. Exact duplicate flow | | |
| 4. Near-duplicate advisory | | |
| 5. Review basic flow | | |
| 6. Duplicate-resolution | | |
| 7. Study continuity | | |
| 8. RunPack provenance | | |
| 9. Cleanup complete | | |

---

## Appendix: Key UI locations

| Feature | Where to find it |
|---------|-----------------|
| Submit Claim | Sidebar → Submit (or Submit Claim mode) |
| Review queue | Sidebar → Review (admin token required) |
| Review inspect panel | Click any review card → inspect panel opens on right |
| Mark Duplicate button | Review inspect panel → muted purple button (claim items only, not archived/duplicate) |
| Dismiss ~Similar button | Review inspect panel → muted steel-blue button (only when `~Similar` advisory present) |
| Study view | Click any claim card → Study opens |
| Back button context | Study view top-left — reads "← Back to Review" / "← Back to Vault" / "← Back" |
| Evidence Vault | Sidebar → Evidence Vault |
| Study Linked Claim | Evidence Vault → claim link on any evidence item |
| Build RunPack | Study dock → Build RunPack / Build Investigation Packet |
| Packet JSON | Copy Packet → paste into text editor; or Download JSON |
