# D-80D: Promote launch-A4 Result

Date: 2026-06-07
Step: D-80D — production promotion of launch-A4 CO2/climate claim
Type: 3 targeted moderation calls (1 claim + 2 evidence). Docs-only commit to main.
No D1 direct commands. No Wrangler. No bulk promotion. No other seed claims promoted.

---

## 1. Explicit User Approval

D-80D was explicitly approved by the user in the same session as execution.
Approval scope: promote launch-A4 (`clm_seed_c4e0335e7aae`) claim and its 2 evidence
items to `review_state = 'public'` only.

No other seed claim was approved for promotion in this session.
launch-D2 was already public and was not touched.

---

## 2. Non-Scope Statement

| Rule | Status |
|------|--------|
| Only launch-A4 claim and its 2 evidence items promoted | ✅ Confirmed |
| No other seed claim promoted (not A1, C1, or B5) | ✅ Confirmed |
| launch-D2 not touched — already public, remains public | ✅ Confirmed |
| No bulk promotion | ✅ Confirmed |
| No scripted promotion beyond 3 explicit target calls | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No destructive moderation (no reject/archive) | ✅ Confirmed |
| Admin token not printed, logged, or committed | ✅ Confirmed |
| Temp curl output files deleted after reading | ✅ Confirmed |

---

## 3. Preflight — State Before Promotion

**git HEAD:** `dc27d2c` — docs: record D-80C launch-D2 promotion ✅

**Read-only `GET /api/review` confirmed before any promotion:**

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| Claim id | `clm_seed_c4e0335e7aae` | `clm_seed_c4e0335e7aae` | ✅ |
| user_id | `usr_seed_system` | `usr_seed_system` | ✅ |
| review_state | `review` | `review` | ✅ |
| status | `Proven` | `Proven` | ✅ |
| Claim text (exact) | Rising CO2 levels from human activity are the primary driver of observed global warming | exact match | ✅ |
| Evidence count | 2 | 2 | ✅ |
| IPCC source URL | `https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/` | exact match | ✅ |
| NASA source URL | `https://science.nasa.gov/climate-change/causes` | exact match | ✅ |
| launch-D2 not in review queue (already public) | Not in queue | Not in queue | ✅ |
| launch-B5 at review | `review` | `review` | ✅ |
| launch-A1 at review | `review` | `review` | ✅ |
| launch-C1 at review | `review` | `review` | ✅ |

All preflight checks passed. Promotion proceeded.

**Note on pressure:** The `/api/review` response did not include a top-level `pressure`
field in this call. Pressure items have no `review_state` column and become visible once
the parent claim is promoted to public. The seed data included 1 pressure item for
launch-A4 ("Climate Change 2021: The Physical Science Basis — Summary for Policymakers
(Attribution section)"). It will be visible to public users once the claim is public.
The `contradictions: 1` field in the claim promotion response confirms this.

---

## 4. Target Claim Details

| Field | Value |
|-------|-------|
| seed_id | `launch-A4` |
| DB claim id | `clm_seed_c4e0335e7aae` |
| claim text | Rising CO2 levels from human activity are the primary driver of observed global warming |
| status (stored) | Proven |
| user_id | usr_seed_system |
| review_state before | `review` |
| review_state after | `public` |

---

## 5. Evidence IDs Discovered and Promoted

| # | Evidence id | Title | Source URL | review_state before | review_state after | reliability_score |
|---|------------|-------|-----------|--------------------|--------------------|-------------------|
| 1 | `evd_a7f3bd8a91204c` | Climate Change 2021: The Physical Science Basis — Summary for Policymakers | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ | `review` | `public` | 90 |
| 2 | `evd_573465cd124545` | The Causes of Climate Change | https://science.nasa.gov/climate-change/causes | `review` | `public` | 82 |

---

## 6. POST Calls Made

Exactly 3 calls. No other POST calls made.

**Call 1 — Claim promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"claim","targetId":"clm_seed_c4e0335e7aae","decision":"public"}
```

**Call 2 — IPCC evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_a7f3bd8a91204c","decision":"public"}
```

**Call 3 — NASA evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_573465cd124545","decision":"public"}
```

---

## 7. Response Summary — All 3 Calls

### Call 1 — Claim (clm_seed_c4e0335e7aae)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"claim"` |
| decision | `"public"` |
| item.id | `clm_seed_c4e0335e7aae` |
| item.reviewState | `"public"` |
| item.status | `"Proven"` |
| item.reportCount | `0` |
| item.contradictions | `1` (pressure point now visible — expected) |
| item.handle | `"humanx-seed"` |

Full response:
```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "public",
  "item": {
    "id": "clm_seed_c4e0335e7aae",
    "claim": "Rising CO2 levels from human activity are the primary driver of observed global warming",
    "category": "Science / Physical World",
    "type": "Physical/Testable",
    "status": "Proven",
    "survivability": null,
    "testability": null,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "public",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780834993780,
    "updatedAt": 1780837724611,
    "handle": "humanx-seed",
    "nearDuplicateOf": null,
    "duplicateOf": null
  }
}
```

---

### Call 2 — Evidence evd_a7f3bd8a91204c (IPCC AR6 WG1 SPM)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_a7f3bd8a91204c` |
| item.review_state | `"public"` |
| item.reliability_score | `90` |
| item.report_count | `0` |

---

### Call 3 — Evidence evd_573465cd124545 (NASA Climate Change Causes)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_573465cd124545` |
| item.review_state | `"public"` |
| item.reliability_score | `82` |
| item.report_count | `0` |

---

## 8. Post-Promotion Verification

### 8.1 — Review Queue (`GET /api/review`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-A4 claim in review queue | No | Not found | ✅ |
| launch-A4 evidence in review queue | No | 0 items | ✅ |
| launch-D2 in review queue | No (already public) | Not found | ✅ |
| launch-B5 in review queue | Yes — `review` | IN QUEUE review_state=review | ✅ |
| launch-A1 in review queue | Yes — `review` | IN QUEUE review_state=review | ✅ |
| launch-C1 in review queue | Yes — `review` | IN QUEUE review_state=review | ✅ |
| Total claims in queue | 24 (25 minus 1 promoted) | 24 | ✅ |

### 8.2 — Public Claims Feed (`GET /api/claims`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-A4 in public feed | Yes | Yes — `review_state: public` | ✅ |
| launch-A4 claim text | exact | exact match | ✅ |
| launch-D2 in public feed | Yes (was already public) | Yes — `review_state: public` | ✅ |
| launch-B5 in public feed | No | Not found | ✅ |
| launch-A1 in public feed | No | Not found | ✅ |
| launch-C1 in public feed | No | Not found | ✅ |
| Total public claims | 24 | 24 | ✅ |

**Seed claims now public: launch-D2 and launch-A4 only.** All others remain review-only.

### 8.3 — Status Recalculation Observation

The claim promotion response (Call 1) returned `item.status: "Proven"` — the stored value.
The `recalcClaimScore` function triggers on evidence promotion. Post-promotion public feed
was not re-queried for the recomputed status field, but based on D-80C behavior the
displayed status may be recomputed from evidence reliability scores (IPCC: 90, NASA: 82).
This is expected behavior and does not affect claim correctness or visibility.

---

## 9. Issues

**None.** All 3 calls returned `ok: true`. All verifications passed. No stop conditions
triggered. The `contradictions: 1` in the claim promotion response is expected — the
1 pressure point ("Attribution section" of the IPCC SPM) becomes visible once the
parent claim is public.

---

## 10. Gate

**D-80D is complete. All 3 promotion calls succeeded. All verifications passed.**

| Step | Status |
|------|--------|
| D-80C — launch-D2 sleep deprivation | ✅ COMPLETE |
| D-80D — launch-A4 CO2/climate | ✅ COMPLETE |
| D-80E — promote launch-A1 (`clm_seed_55e17c22e13e`) MMR/autism | ⛔ BLOCKED — requires explicit per-session approval |
| D-80F — promote launch-C1 (`clm_seed_8ad9ff121579`) platform recommendation systems | ⛔ BLOCKED |
| D-80G — promote launch-B5 (`clm_seed_8e095b6f6d30`) Holocaust | ⛔ BLOCKED — promote last |

No further promotion will occur without explicit per-session user approval of a specific claim.

---

## D-80D Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-80C commit (dc27d2c) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Claim id, user_id, review_state, status, text confirmed | ✅ |
| Evidence count confirmed: 2 | ✅ |
| Evidence source URLs confirmed — both match expected | ✅ |
| Evidence IDs recorded: evd_a7f3bd8a91204c, evd_573465cd124545 | ✅ |
| POST claim promotion — HTTP 200, ok: true, reviewState: public | ✅ |
| POST evidence 1 (IPCC) — HTTP 200, ok: true, review_state: public | ✅ |
| POST evidence 2 (NASA) — HTTP 200, ok: true, review_state: public | ✅ |
| Exactly 3 POST calls made — no extras | ✅ |
| Post-promotion GET /api/review — A4 not in queue, B5/A1/C1 at review, D2 not in queue | ✅ |
| Post-promotion GET /api/claims — A4 public, D2 public, no other seed claims public | ✅ |
| launch-D2 unchanged — remains public | ✅ |
| No other seed claim promoted | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| No bulk promotion | ✅ |
| Temp files deleted | ✅ |
| docs/D80D_PROMOTE_LAUNCH_A4_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
