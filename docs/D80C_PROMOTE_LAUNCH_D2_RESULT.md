# D-80C: Promote launch-D2 Result

Date: 2026-06-07
Step: D-80C — production promotion of launch-D2 sleep deprivation claim
Type: 3 targeted moderation calls (1 claim + 2 evidence). Docs-only commit to main.
No D1 direct commands. No Wrangler. No bulk promotion. No other seed claims promoted.

---

## 1. Explicit User Approval

D-80C was explicitly approved by the user in the same session as execution.
Approval scope: promote launch-D2 (`clm_seed_7fb1c24747c2`) claim and its 2 evidence
items to `review_state = 'public'` only.

No other seed claim was approved for promotion in this session.

---

## 2. Non-Scope Statement

| Rule | Status |
|------|--------|
| Only launch-D2 claim and its 2 evidence items promoted | ✅ Confirmed |
| No other seed claim promoted (not A4, A1, C1, or B5) | ✅ Confirmed |
| No bulk promotion | ✅ Confirmed |
| No scripted promotion beyond 3 explicit target calls | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No destructive moderation (no reject/archive) | ✅ Confirmed |
| Admin token not printed, logged, or committed | ✅ Confirmed |
| Temp curl output files deleted after reading | ✅ Confirmed |

---

## 3. Preflight — State Before Promotion

**git HEAD:** `771bfc8` — docs: add D-80 per-claim promotion plan (D-80B) ✅

**Read-only `GET /api/review` confirmed before any promotion:**

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| Claim id | `clm_seed_7fb1c24747c2` | `clm_seed_7fb1c24747c2` | ✅ |
| user_id | `usr_seed_system` | `usr_seed_system` | ✅ |
| review_state | `review` | `review` | ✅ |
| status | `Proven` | `Proven` | ✅ |
| Claim text (exact) | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | exact match | ✅ |
| Evidence count for claim | 2 | 2 | ✅ |
| Evidence 1 source URL | `https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117` | exact match | ✅ |
| Evidence 2 source URL | `https://www.cdc.gov/sleep/about/index.html` | exact match | ✅ |

All 8 preflight checks passed. Promotion proceeded.

---

## 4. Target Claim Details

| Field | Value |
|-------|-------|
| seed_id | `launch-D2` |
| DB claim id | `clm_seed_7fb1c24747c2` |
| claim text | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy |
| status (stored) | Proven |
| user_id | usr_seed_system |
| review_state before | `review` |
| review_state after | `public` |

---

## 5. Evidence IDs Discovered and Promoted

| # | Evidence id | Title | Source URL | review_state before | review_state after |
|---|------------|-------|-----------|--------------------|--------------------|
| 1 | `evd_ac0a748135aa4e` | The Cumulative Cost of Additional Wakefulness: Dose-Response Effects on Neurobehavioral Functions and Sleep Physiology From Chronic Sleep Restriction and Total Sleep Deprivation | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 | `review` | `public` |
| 2 | `evd_8651fab094cc48` | About Sleep | https://www.cdc.gov/sleep/about/index.html | `review` | `public` |

---

## 6. POST Calls Made

Exactly 3 calls. No other POST calls made.

**Call 1 — Claim promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"claim","targetId":"clm_seed_7fb1c24747c2","decision":"public"}
```

**Call 2 — Van Dongen evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_ac0a748135aa4e","decision":"public"}
```

**Call 3 — CDC About Sleep evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_8651fab094cc48","decision":"public"}
```

---

## 7. Response Summary — All 3 Calls

### Call 1 — Claim (clm_seed_7fb1c24747c2)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"claim"` |
| decision | `"public"` |
| item.id | `clm_seed_7fb1c24747c2` |
| item.reviewState | `"public"` |
| item.status | `"Proven"` |
| item.reportCount | `0` |
| item.handle | `"humanx-seed"` |

Full response:
```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "public",
  "item": {
    "id": "clm_seed_7fb1c24747c2",
    "claim": "Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy",
    "category": "Human Behaviour / Biology",
    "type": "Physical/Testable",
    "status": "Proven",
    "survivability": null,
    "testability": null,
    "contradictions": 0,
    "reportCount": 0,
    "reviewState": "public",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780834993780,
    "updatedAt": 1780836910288,
    "handle": "humanx-seed",
    "nearDuplicateOf": null,
    "duplicateOf": null
  }
}
```

---

### Call 2 — Evidence evd_ac0a748135aa4e (Van Dongen SLEEP 2003)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_ac0a748135aa4e` |
| item.review_state | `"public"` |
| item.stance | `"support"` |
| item.quality | `"repeatable"` |
| item.reliability_score | `87` |
| item.report_count | `0` |

---

### Call 3 — Evidence evd_8651fab094cc48 (CDC About Sleep)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_8651fab094cc48` |
| item.review_state | `"public"` |
| item.stance | `"support"` |
| item.quality | `"documented"` |
| item.reliability_score | `80` |
| item.report_count | `0` |

---

## 8. Post-Promotion Verification

### 8.1 — Review Queue (`GET /api/review`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-D2 claim in review queue | No | Not found | ✅ |
| launch-D2 evidence in review queue | No | Not found (0 items) | ✅ |
| launch-B5 in review queue | Yes — `review` | Yes — `review_state: review` | ✅ |
| launch-A1 in review queue | Yes — `review` | Yes — `review_state: review` | ✅ |
| launch-A4 in review queue | Yes — `review` | Yes — `review_state: review` | ✅ |
| launch-C1 in review queue | Yes — `review` | Yes — `review_state: review` | ✅ |
| Total claims in queue | 25 (26 minus 1 promoted) | 25 | ✅ |

All 4 remaining seed claims confirmed at `review_state = 'review'`.

### 8.2 — Public Claims Feed (`GET /api/claims`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-D2 in public feed | Yes | Yes — `review_state: public` | ✅ |
| launch-D2 claim text | Sleep deprivation... exact | exact match | ✅ |
| launch-B5 in public feed | No | Not found | ✅ |
| launch-A1 in public feed | No | Not found | ✅ |
| launch-A4 in public feed | No | Not found | ✅ |
| launch-C1 in public feed | No | Not found | ✅ |
| Total public claims | 23 | 23 | ✅ |

### 8.3 — Status Field Observation

The claim promotion response (`Call 1`) returned `item.status: "Proven"` — the stored
status as inserted by the importer. The public claims feed (`GET /api/claims`) returned
`status: "Strongly Supported"` for the same claim.

**Assessment:** This discrepancy is expected behavior. When evidence items are promoted
(`Call 2` and `Call 3`), `POST /api/review/decision` for evidence triggers
`recalcClaimScore` in `src/worker.js`. The score recalculation function computes a
derived `status` based on aggregate evidence scores (Van Dongen reliability 87, CDC
reliability 80). The derived status `"Strongly Supported"` reflects the computed
aggregate evidence quality, which may differ from the seed-imported `status` field.
This does not affect the claim's correctness or visibility. The claim is publicly
visible and correctly associated with 2 public evidence items.

---

## 9. Issues

**None — no errors or unexpected conditions.**

The status field discrepancy (stored `Proven` vs. public-feed computed `Strongly Supported`)
is noted in section 8.3 and assessed as expected behavior from `recalcClaimScore`.
No stop condition triggered.

---

## 10. Gate

**D-80C is complete. All 3 promotion calls succeeded. All verifications passed.**

| Step | Status |
|------|--------|
| D-80C — promote launch-D2 | ✅ COMPLETE |
| D-80D — promote launch-A4 (`clm_seed_c4e0335e7aae`) CO2/climate | ⛔ BLOCKED — requires explicit per-session approval |
| D-80E — promote launch-A1 (`clm_seed_55e17c22e13e`) MMR/autism | ⛔ BLOCKED |
| D-80F — promote launch-C1 (`clm_seed_8ad9ff121579`) platform recommendation systems | ⛔ BLOCKED |
| D-80G — promote launch-B5 (`clm_seed_8e095b6f6d30`) Holocaust | ⛔ BLOCKED — promote last |

No further promotion will occur without explicit per-session user approval of a specific claim.
No bulk promotion. No scripted promotion.

---

## D-80C Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-80B commit (771bfc8) | ✅ |
| Preflight read-only GET /api/review — all 8 checks passed | ✅ |
| Claim id, user_id, review_state, status, text confirmed | ✅ |
| Evidence count confirmed: 2 | ✅ |
| Evidence source URLs confirmed — both match expected | ✅ |
| Evidence IDs recorded: evd_ac0a748135aa4e, evd_8651fab094cc48 | ✅ |
| POST claim promotion — HTTP 200, ok: true, reviewState: public | ✅ |
| POST evidence 1 promotion — HTTP 200, ok: true, review_state: public | ✅ |
| POST evidence 2 promotion — HTTP 200, ok: true, review_state: public | ✅ |
| Exactly 3 POST calls made — no extras | ✅ |
| Post-promotion GET /api/review — D2 not in queue, 4 others at review | ✅ |
| Post-promotion GET /api/claims — D2 public, no other seed claims public | ✅ |
| Status field discrepancy documented | ✅ |
| No other seed claim promoted | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| No bulk promotion | ✅ |
| Temp files deleted | ✅ |
| docs/D80C_PROMOTE_LAUNCH_D2_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
