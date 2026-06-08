# D-91C — Manual Review Queue Inventory Checklist

**Date:** 2026-06-08
**Type:** Docs-only (direct main)
**Static checks:** 204 / 24 / 39

---

## A. Scope and safety

This document is a **manual checklist only**. No live endpoint calls, no moderation
actions, no approve/reject/archive/cleanup operations are made in this batch.

The user fills the blank inventory table (Section E) by opening the live Review admin UI
in a browser, browsing through the queue, and recording what they see. Nothing is
submitted or mutated. All action decisions are deferred to D-91D.

**Rules for inventory session:**
- Open Review UI in read-only browser mode (admin token visible, no clicks on action buttons)
- Do **not** click Approve / Reject / Keep Pending / Archive during inventory
- Do **not** close/dismiss any inspect panels in ways that trigger navigation
- Record only — do not act

---

## B. Inventory method — step-by-step

**Before you start:** open the live app at `https://humanx.rinkimirikata.com`, click the
**Review** tab, enter your admin token, and wait for the queue to load.

### Step 1 — Get the total count

1. Select the **All** filter chip.
2. Note the total count shown in the Audit Summary bar (click "▸ Audit Summary" to expand
   if collapsed).
3. Record in the Pre-inventory checklist below: **Total in queue (All filter) = ___**

### Step 2 — Record counts by filter chip

Click each filter chip and record the count badge:

| Filter chip | Count badge shown | Record here |
|---|---|---|
| Pending (review) | | |
| Public | | |
| Rejected | | |
| Reported | | |
| Pressure | | |
| Demo/Test | | |
| Dupes | | |
| ~Similar | | |
| ~Quality | | |
| All | | |

### Step 3 — Inventory pressure items first (Priority)

1. Select the **Pressure** filter.
2. For each card visible:
   - Click **Inspect** to open the inspect panel.
   - Copy the **ID** field from the inspect panel.
   - Note: Type, Title, Submitted By (handle), Review State, Report Count, age.
   - Fill one row in the blank table (Section E).
   - Click **✕ Close** to close the panel. Move to next card.
3. Repeat until all pressure items are recorded.

### Step 4 — Inventory evidence items

No Evidence filter chip exists yet (D-91E recommendation). To find evidence items:
1. Select the **All** filter.
2. Look for purple **evidence** badges on cards.
3. Click Inspect on each evidence card and record the same fields.

### Step 5 — Inventory demo/test items

1. Select the **Demo/Test** filter.
2. Record all items shown. These should match the known C4/C5/C6 pre-filled rows in
   Section D. Note any discrepancies (extra items, missing items).

### Step 6 — Inventory remaining Pending items

1. Select the **Pending** filter.
2. Work through any items not already recorded in Steps 3–5.
3. Pay attention to items without an origin chip — these are likely real user submissions.

### Step 7 — Record Rejected count

1. Select the **Rejected** filter.
2. Note the count only. Do **not** inspect or action any rejected items during inventory.
3. Expected: **15** (Group D substantive items — see D-88D).

### Step 8 — Screenshot convention

Save screenshots as:

| Filename | When to take |
|---|---|
| `review_all_top.png` | After loading All filter — shows audit summary and first cards |
| `review_pressure_filter.png` | Pressure filter active — all pressure cards visible |
| `review_demo_test_filter.png` | Demo/Test filter active — shows C4/C5/C6 candidates |
| `review_pending_filter.png` | Pending filter — full pending view |
| `inspect_<item-id>.png` | Any time you open an Inspect panel — name with the ID shown |
| `before_action_<item-id>.png` | Only needed in D-91D (action batch) — NOT during inventory |

---

## C. Category definitions (from D-91A)

| Code | Name | Description |
|---|---|---|
| **C1** | New pressure | Pressure item (`target_type:'pressure'`) from a real user, `review_state='review'` since D-90H |
| **C2** | New evidence | Evidence item (`target_type:'evidence'`) from a real user, awaiting moderation |
| **C3** | New claim/truth | Claim or truth from a real user, `review_state='review'` |
| **C4** | Old demo seed | Claim with `clm_seed_*` ID or `humanx-seed` handle, returned to review in D-85 |
| **C5** | HX dev seed | Claim with `HX-000*` ID or `anon-o_seed` handle, returned to review in D-85 |
| **C6** | Test-account claim | Claim from known dev/test handles (`anon-xksavy`, `anon-73d9y2`, `anon-ek3562`) |
| **C7** | Judgment call | Claim kept pending by editorial decision — do not reject without review |
| **C8** | Substantive rejected | Rejected item retained as audit record — do not archive |
| **C9** | Duplicate / similar | Item flagged as `duplicate_of` or `near_duplicate_of` another |
| **C10** | Unclear / needs source | Real-looking claim but no evidence or source; keep pending |

---

## D. Pre-filled known items (fill Inventory Status column from browser)

### D1 — Known C4: Old demo seeds (action: reject → then archive)

All four have `review_state='review'`. They are `clm_seed_*` IDs with `humanx-seed`
handle. The archive backend will classify them as `test_artifact_v2 / dev_seed_id`
automatically after they are rejected.

**Two-step per item:** (1) Reject in D-91D. (2) Archive in D-91D after reject confirmed.

| Item ID | Type | Title | Origin / Handle | State | Recommended action | Category | Inventory status |
|---|---|---|---|---|---|---|---|
| `clm_seed_0f5608464fb5` | claim | "The Earth is flat" | demo-seed / `humanx-seed` | review | reject → archive | C4 | *(confirm present / not present / ID differs)* |
| `clm_seed_f5699c8aa3a4` | claim | "Humans landed on the Moon" | demo-seed / `humanx-seed` | review | reject → archive | C4 | |
| `clm_seed_f4d482242f5f` | claim | "A dream predicted my future" | demo-seed / `humanx-seed` | review | reject → archive | C4 | |
| `clm_seed_8ce1875d322b` | claim | "Perpetual motion machines can produce free energy forever" | demo-seed / `humanx-seed` | review | reject → archive | C4 | |

### D2 — Known C5: HX dev seed (action: reject → then archive)

| Item ID | Type | Title | Origin / Handle | State | Recommended action | Category | Inventory status |
|---|---|---|---|---|---|---|---|
| `HX-000003` | claim | "A dream predicted my future" | hx-seed / `anon-o_seed` | review | reject → archive | C5 | *(confirm present / not present)* |

### D3 — Known C6: Test-account claims (action: reject)

All from handle `anon-xksavy`. Safe to reject. Archive may follow if `test_artifact_v2`
path opens (handle detected by `isSuspectedTestArtefact`). No `junk_override` needed.

| Item ID | Type | Title | Origin / Handle | State | Recommended action | Category | Inventory status |
|---|---|---|---|---|---|---|---|
| `clm_5624bd2c8d9246598a` | claim | "Money is evil" | test-account / `anon-xksavy` | review | reject | C6 | |
| `clm_37d2e262976f46d2b4` | claim | "Money is evil" (duplicate) | test-account / `anon-xksavy` | review | reject | C6 | |
| `clm_97c7f7a525c54276bc` | claim | "You can be anything you want" | test-account / `anon-xksavy` | review | reject | C6 | |
| `clm_3bc837c5d8a24cf9b5` | claim | "People are basically good" | test-account / `anon-xksavy` | review | reject | C6 | |
| `clm_6032e1bc88ff443587` | claim | "god exist" | test-account / `anon-xksavy` | review | reject | C6 | |
| `clm_6f14973b90ed48c3bb` | claim | "Everything happens for a reason" | test-account / `anon-xksavy` | review | reject | C6 | |

### D4 — Known C7: Judgment calls (action: keep pending — DO NOT REJECT)

| Item ID | Type | Title | Origin / Handle | State | Recommended action | Category | Inventory status |
|---|---|---|---|---|---|---|---|
| `clm_af8da34be53b40f395` | claim | "Hard work always pays off" | user | review | **keep pending** | C7 | |
| `clm_13afcc7128054661a3` | claim | "The UK government published Covid vaccine contract terms in 2021" | user | review | **keep pending** | C7 | |

### D5 — New items (C1/C2/C3) — blank, fill from browser

Any items visible in Pending/Pressure/All that do not match a pre-filled row above are
new user submissions. Record them in the blank table (Section E). **Judge individually —
do not batch action.**

---

## E. Blank inventory table (fill from browser)

Copy this table and fill one row per item found that is not pre-filled in Section D.
Add as many rows as needed.

| Item ID | Type | Title / Statement (first 80 chars) | Origin / Handle | State | Reports | Age | Category | Recommended action | Notes |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |

---

## F. Stop conditions — when NOT to proceed

During the inventory session, **stop and record a note** if any of the following apply to
an item you are inspecting:

| Condition | Stop because |
|---|---|
| Cannot read the item ID from the Inspect panel | Cannot safely plan action without the ID |
| Title is unusual but could be a genuine personal belief | May be a real submission — category unclear; use C10 |
| Item has `report_count > 0` | Reported items need individual review, not batch action |
| Item is `review_state='public'` | Public items must not be rejected without cause |
| Item appears to belong to a real live claim with evidence attached | Rejecting may break scoring and RunPack for that claim |
| Pressure or evidence item references a real launch seed claim | Those items affect public scores — must judge individually |
| Handle is `user` (not a known dev/test handle) | This is a real user submission — do not treat as C6 |
| Item shows a `🔒` locked badge | Status-locked items require extra care |
| Origin chip shows `user` or no chip | These are real submissions — not safe to batch reject |
| Queue count does not match expected | Stop and re-audit before continuing |

---

## G. Pre-inventory verification checklist

Fill this before the inventory session begins:

- [ ] Admin token is available and working
- [ ] Review tab loads and audit summary shows a count
- [ ] Audit Summary expanded and Pending/Rejected/Total counts recorded (Step 2 table)
- [ ] No prior action buttons accidentally clicked
- [ ] Screenshot `review_all_top.png` saved

Fill this after the inventory session ends:

- [ ] All Pressure filter items recorded (or confirmed empty)
- [ ] All Demo/Test filter items confirmed against D1/D2/D3 pre-filled rows
- [ ] All Pending items not pre-filled recorded in blank table (Section E)
- [ ] Inventory status column filled for all Section D rows
- [ ] Discrepancies noted (any pre-filled item not found, or unexpected items found)
- [ ] Rejected count confirmed (expected ≥15)
- [ ] No action buttons clicked during session

---

## H. D-91D cleanup batch template

After the inventory is filled and reviewed, D-91D will use this template for each scoped
group. **Do not fill this until D-91C inventory is complete and reviewed.**

```
Group name: [e.g. "C4 demo seed reject batch"]
Items:
  - <item-id>: <title> — <expected current state>
  - ...

Action: [reject | archive | return-to-review]
  - POST endpoint: /api/review/decision OR /api/review/cleanup
  - Exact request body per item (fill before executing)

Why safe:
  - [e.g. clm_seed_* IDs, humanx-seed handle, duplicateOf rejected item]
  - isSuspectedTestArtefact returns true
  - No evidence attached
  - No live RunPack references

Expected result per item:
  - reviewState: 'rejected' (reject action)
  - new_state: 'archived', archive_policy: 'test_artifact_v2' (archive action)

Pre-action queue state: review=___, rejected=___, archived_total=___
Expected post-action queue state: review=___, rejected=___, archived_total=___

Stop if:
  - ok: false in response
  - archive_policy not 'test_artifact_v2'
  - review count does not decrease as expected
  - any item title in response does not match expected
```

---

## I. Recommended next step

**User action required before D-91D can proceed:**

1. Open the live Review UI at `https://humanx.rinkimirikata.com` → Review tab.
2. Enter admin token.
3. Follow Steps 1–8 in Section B above.
4. Fill the Inventory Status column in Section D for all pre-filled rows.
5. Fill the blank table in Section E for any new items found.
6. Fill the count table in Section B Step 2.
7. Paste the completed tables back as a message.

Once the completed inventory is received, D-91D will be scoped to the confirmed-present
items only, in the safe order defined by D-91A Section D policy.

**No D-91D action will be taken without the completed inventory.**
