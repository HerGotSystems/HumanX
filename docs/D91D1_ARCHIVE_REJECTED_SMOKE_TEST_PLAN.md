# D-91D1 — Archive Rejected Smoke/Test Artifacts Plan

**Date:** 2026-06-08
**Type:** Docs-only (plan phase) — live POSTs blocked pending ID confirmation
**Static checks:** 204 / 24 / 39

---

## A. Scope and safety

This batch archives **only already-rejected smoke/test artifacts**. It does not:
- Approve or reject any item
- Touch any pending (review-state) item
- Touch any substantive rejected historical item (Group D from D-88D)
- Take any action on pressure or evidence items
- Use bulk or filter-based operations

Every POST must be scoped to an exact item ID confirmed present and already-rejected in
the live queue. **This document blocks on live POSTs until the user provides confirmed IDs.**

---

## B. Live queue state (from user observation, 2026-06-08)

| Metric | Count |
|---|---|
| Total loaded queue | 31 |
| Pending (review) | 15 |
| Public | 0 |
| Rejected | 16 |
| Reported | 0 |
| Pressure | 3 |
| Demo/Test | 8 |
| ~Similar | 2 |
| Dupes | 6 |
| Archived total | 11 |

**Notes:**
- Rejected=16 is +1 vs post-D-88N baseline (was 15). One new item was rejected between
  D-88N and now.
- Archived total=11 is unchanged from D-88N. No archives have occurred since D-88N.
- Demo/Test=8 is fewer than the 11 expected from known C4(4)+C5(1)+C6(6) items. Three
  items are missing from the Demo/Test count — reason unknown without browser inspection.
  Possible: 3 C6 items were rejected or otherwise removed from the pending bucket.

---

## C. Archive endpoint analysis

**Endpoint:** `POST /api/review/cleanup`
**Auth:** `x-humanx-admin` header required

**Supported target types:** `claim` and `truth` only.
- `pressure` and `evidence` items **cannot** be archived via this endpoint.
- The endpoint returns `BAD_TARGET_TYPE` error for any other type.

**Required request body:**
```json
{
  "target_type": "claim",
  "target_id": "<exact-claim-id>"
}
```

**Gate sequence (must all pass for archive to succeed):**

| Gate | Condition | Error if fails |
|---|---|---|
| 1. Auth | valid admin token | 401 |
| 2. Target ID | non-empty, valid format | `TARGET_ID_REQUIRED` |
| 3. Target type | `claim` or `truth` | `BAD_TARGET_TYPE` |
| 4. Item exists | found in DB | `CLAIM_NOT_FOUND` / `TRUTH_NOT_FOUND` |
| 5. State gate | `review_state='rejected'` | `CLEANUP_REQUIRES_REJECTED` |
| 6. Protected seed | NOT in 5-item editorial blocklist | `CLEANUP_PROTECTED_SEED` |
| 7. Status lock | `status_locked=0` | `CLEANUP_REQUIRES_NOT_LOCKED` |
| 8. Artefact detection | keyword OR id-pattern OR dev-handle match | `CLEANUP_REQUIRES_TEST_ARTEFACT` |

**Artefact detection logic (v2):**
- **Keyword match** (`test_keyword`): claim text contains `smoke`, `\btest\b`,
  `automated write`, or `automated smoke`
- **ID pattern match** (`dev_seed_id`): ID starts with `clm_seed_` or `HX-\d`
- **Dev handle match** (`dev_handle`): submitting handle is one of
  `humanx-seed`, `anon-o_seed`, `anon-xksavy`, `anon-73d9y2`, `anon-ek3562`

If any signal matches, archive proceeds automatically with `archive_policy:'test_artifact_v2'`.
No `junk_override` needed for items from dev handles or with seed IDs.

**Protected seeds (cannot be archived under any circumstances):**
- `clm_seed_55e17c22e13e` (launch-A1)
- `clm_seed_8e095b6f6d30` (launch-B5)
- `clm_seed_c4e0335e7aae` (launch-A4)
- `clm_seed_8ad9ff121579` (launch-C1)
- `clm_seed_7fb1c24747c2` (launch-D2)

These are the 5 editorial seed claims and cannot be archived regardless of any signal.

**Pressure/evidence items:** The archive endpoint does not support `target_type:'pressure'`
or `target_type:'evidence'`. The 3 pressure items in the queue are all in `review` state
(not rejected) and cannot be archived regardless.

---

## D. Candidate criteria

An item is a valid D-91D1 archive candidate **only** if ALL of the following are true:

1. `review_state = 'rejected'` — already rejected, not pending
2. `target_type = 'claim'` or `target_type = 'truth'` — supported by endpoint
3. One or more artefact signals fire:
   - ID starts with `clm_seed_` or `HX-\d`, OR
   - Submitting handle is `humanx-seed`, `anon-o_seed`, `anon-xksavy`, `anon-73d9y2`,
     or `anon-ek3562`
4. NOT in the protected seed blocklist (the 5 editorial seeds)
5. NOT `status_locked`
6. NOT a substantive historical rejected item (Group D — see Section F)

---

## E. Exclusions (do not archive)

These items must never be targeted in D-91D1:

| Exclusion | Reason |
|---|---|
| Any item with `review_state != 'rejected'` | Archive requires rejected state; would return `CLEANUP_REQUIRES_REJECTED` |
| Any pending C4 demo seed (`clm_seed_*` in review) | These must be rejected first; this batch does not reject anything |
| `HX-000003` (in review) | Pending, not rejected — wrong state for archive |
| Any C6 test-account item still in review | Pending — this batch does not reject |
| Any C7 judgment-call claim | Keep pending — must not be rejected or archived |
| Any Group D substantive rejected item | Editorial records — do not archive even if artefact signal fires |
| Any pressure or evidence item | Not supported by archive endpoint |
| Any item whose ID is not confirmed present and rejected in browser | Cannot act on unknown state |

### Group D — substantive rejected items (do not archive)

From D-88D audit and D-91A, the following are confirmed as Group D (substantive content
retained as audit records). **Do not archive these under any circumstances:**

| Item | Notes |
|---|---|
| "Never trust the experts" (`clm_ae59b53d5f4249f0b4`) | Proven artifact; report_count=2; kept for audit |
| "Children should always obey adults" (`clm_eec72f024040428190`) | Proven artifact; rejected D-84J |
| "People are stupid" (`clm_cdba3db932b84f279a`) | Vague insult; Proven artifact; rejected D-85G |
| "PEOPLE ARE STUPID" (`clm_ba71db1962b8474bb7`) | All-caps; rejected D-84H |
| "god exist" (`clm_a51c7861a89945339b`) | Rejected D-84F |
| "everyone knows the government is hiding everything" (`clm_852333ac90654ab495`) | Rejected D-84E |
| "Science has proven it" (`clm_4176a17d0a754b78aa`) | Incomplete fragment; rejected D-85F |
| Any "Money is evil" variant that is rejected (not the ones in review) | |
| Any "god exist" / "GOD DONT EXIST" variant | |
| Pre-D-84 unknown rejected items | 10 pre-existing items from D-84A audit — identity unknown |

The 16th rejected item (the new +1 since D-88N) is also unknown and must not be archived
without ID confirmation.

---

## F. Target list — REQUIRES BROWSER CONFIRMATION

**Current status: BLOCKED — no POSTs until IDs confirmed**

The table below cannot be pre-filled because no rejected item IDs were provided in the
current session beyond what is already known to be excluded (Group D).

| Item ID | Type | Title | State | Origin/Handle | Artefact signal | Archive allowed? | Action |
|---|---|---|---|---|---|---|---|
| *requires confirmation* | | | | | | | |

### How to confirm

To fill this table, the user must:

1. Open Review → select **Rejected** filter.
2. Look for cards with an origin chip of `demo-seed`, `hx-seed`, or `test-account`.
3. For each such card, click **Inspect** and copy:
   - ID field (exact string, e.g. `clm_xxxxxxxxxxxxxxxx`)
   - Title / claim text (first 60 chars)
   - Handle (Submitted By field)
   - State (must say `rejected`)
4. Cross-reference against the Group D exclusion list in Section E.
5. Paste the confirmed list back into this chat.

**Expected candidates (if still in queue):**
Based on D-91A analysis, the C4/C5/C6 items should all be in `review` state (pending),
not `rejected`. If any appear under the Rejected filter with a demo-seed/test-account
chip and are NOT in the Group D exclusion list, they are candidates.

**The 1 new rejected item (+1 since D-88N) must also be identified.** It may or may not
be a smoke/test artefact. Do not act on it without inspecting it.

---

## G. Stop conditions

During any future execution of D-91D1 POSTs, stop immediately if:

| Condition | Action |
|---|---|
| Response `ok: false` for any item | Stop all remaining POSTs; report error and item ID |
| Response `archive_policy` is not `test_artifact_v2` | Unexpected path — stop and review |
| Response `archive_reason` says `junk_override_v1` | Wrong path — only `test_artifact_v2` expected |
| Any target item title in response does not match expected | ID mismatch — stop immediately |
| Archive count (archived_total) does not increment after POST | DB issue — stop |
| Rejected count does not decrease after archive | Unexpected — stop and verify |
| Any item turns out to be `review_state != 'rejected'` at POST time | Stop — state changed |
| Any item is a Group D substantive claim (cross-check before each POST) | Stop — wrong target |
| Admin token fails mid-session | Stop — do not retry blindly |
| More than 1 unexpected error in sequence | Stop entire batch |

---

## H. Expected POST sequence (after ID confirmation)

Once the user provides confirmed rejected smoke/test IDs, each archive is:

```
POST /api/review/cleanup
Header: x-humanx-admin: <token>
Body: { "target_type": "claim", "target_id": "<confirmed-id>" }

Expected response:
{
  "ok": true,
  "target_type": "claim",
  "target_id": "<confirmed-id>",
  "action": "archived",
  "previous_state": "rejected",
  "new_state": "archived",
  "archive_policy": "test_artifact_v2",
  "archive_reason": "dev_handle"  -- or "dev_seed_id"
}
```

After each POST:
- Verify `ok: true`
- Verify `new_state: 'archived'`
- Verify `archive_policy: 'test_artifact_v2'`
- Re-fetch `GET /api/review` and confirm `archived_total` incremented by 1
- Confirm rejected count decreased by 1

---

## I. What the user must provide next

**Before any D-91D1 POST is executed, provide:**

1. **Rejected filter inspection** — for each card visible under the Rejected filter:
   - Item ID (from Inspect panel)
   - Title / claim text
   - Handle / origin chip label
   - Any `🔒` locked badge visible?

2. **Crosscheck** — confirm which (if any) of those 16 rejected items have an origin
   chip of `demo-seed`, `hx-seed`, or `test-account` and are NOT in the Group D
   exclusion list.

3. **The new +1 rejected item** — identify what was rejected between D-88N and now.

Once that list is returned and confirmed safe, explicit approval will be requested for
each individual POST before execution.

**No POSTs will be executed in this document.**
