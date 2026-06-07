# D-80E: Promote launch-A1 Result

Date: 2026-06-07
Step: D-80E — production promotion of launch-A1 MMR/autism claim
Type: 3 targeted moderation calls (1 claim + 2 evidence). Docs-only commit to main.
No D1 direct commands. No Wrangler. No bulk promotion. No other seed claims promoted.

---

## 1. Explicit User Approval

D-80E was explicitly approved by the user in the same session as execution.
Approval scope: promote launch-A1 (`clm_seed_55e17c22e13e`) claim and its 2 evidence
items to `review_state = 'public'` only.

No other seed claim was approved for promotion in this session.
launch-D2 and launch-A4 were already public and were not touched.

---

## 2. Non-Scope Statement

| Rule | Status |
|------|--------|
| Only launch-A1 claim and its 2 evidence items promoted | ✅ Confirmed |
| No other seed claim promoted (not C1 or B5) | ✅ Confirmed |
| launch-D2 not touched — already public, remains public | ✅ Confirmed |
| launch-A4 not touched — already public, remains public | ✅ Confirmed |
| No bulk promotion | ✅ Confirmed |
| No scripted promotion beyond 3 explicit target calls | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No destructive moderation (no reject/archive) | ✅ Confirmed |
| Admin token not printed, logged, or committed | ✅ Confirmed |
| Temp curl output files deleted after reading | ✅ Confirmed |

---

## 3. Preflight — State Before Promotion

**git HEAD:** `ff0b51a` — docs: record D-80D launch-A4 promotion ✅

**Read-only `GET /api/review` confirmed before any promotion:**

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| Claim id | `clm_seed_55e17c22e13e` | `clm_seed_55e17c22e13e` | ✅ |
| user_id | `usr_seed_system` | `usr_seed_system` | ✅ |
| review_state | `review` | `review` | ✅ |
| status | `Strongly Supported` | `Strongly Supported` | ✅ |
| status NOT `Proven` | must not be Proven | confirmed Strongly Supported | ✅ |
| Claim text (exact) | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism | exact match | ✅ |
| Evidence count | 2 | 2 | ✅ |
| Cochrane source URL | `https://pubmed.ncbi.nlm.nih.gov/22336803/` | exact match | ✅ |
| Madsen NEJM source URL | `https://pubmed.ncbi.nlm.nih.gov/12421889/` | exact match | ✅ |
| launch-D2 not in queue (already public) | Not in queue | Not in queue | ✅ |
| launch-A4 not in queue (already public) | Not in queue | Not in queue | ✅ |
| launch-C1 at review | `review` | `review` | ✅ |
| launch-B5 at review | `review` | `review` | ✅ |

All preflight checks passed including the status guard (`Strongly Supported`, not `Proven`).
Promotion proceeded.

**Note on pressure:** The `/api/review` response did not include a top-level `pressure`
field. Pressure items have no `review_state` column; they become visible once the parent
claim is promoted to public. The seed data included 1 pressure item for launch-A1:
"Wakefield's article linking MMR vaccine and autism was fraudulent" (BMJ, PubMed 21209060).
The `contradictions: 1` field in the claim promotion response confirms it is now visible.

---

## 4. Target Claim Details

| Field | Value |
|-------|-------|
| seed_id | `launch-A1` |
| DB claim id | `clm_seed_55e17c22e13e` |
| claim text | Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism |
| status (stored) | Strongly Supported |
| user_id | usr_seed_system |
| review_state before | `review` |
| review_state after | `public` |

---

## 5. Evidence IDs Discovered and Promoted

| # | Evidence id | Title | Source URL | review_state before | review_state after | reliability_score |
|---|------------|-------|-----------|--------------------|--------------------|-------------------|
| 1 | `evd_d685a866788942` | Vaccines for measles, mumps and rubella in children | https://pubmed.ncbi.nlm.nih.gov/22336803/ | `review` | `public` | 85 |
| 2 | `evd_450723b824024c` | A population-based study of measles, mumps, and rubella vaccination and autism | https://pubmed.ncbi.nlm.nih.gov/12421889/ | `review` | `public` | 84 |

---

## 6. POST Calls Made

Exactly 3 calls. No other POST calls made.

**Call 1 — Claim promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"claim","targetId":"clm_seed_55e17c22e13e","decision":"public"}
```

**Call 2 — Cochrane/Demicheli evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_d685a866788942","decision":"public"}
```

**Call 3 — Madsen NEJM evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_450723b824024c","decision":"public"}
```

---

## 7. Response Summary — All 3 Calls

### Call 1 — Claim (clm_seed_55e17c22e13e)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"claim"` |
| decision | `"public"` |
| item.id | `clm_seed_55e17c22e13e` |
| item.reviewState | `"public"` |
| item.status | `"Strongly Supported"` |
| item.reportCount | `0` |
| item.contradictions | `1` (Wakefield/BMJ pressure point now visible — expected) |
| item.handle | `"humanx-seed"` |

Full response:
```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "public",
  "item": {
    "id": "clm_seed_55e17c22e13e",
    "claim": "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism",
    "category": "Science / Medicine",
    "type": "Physical/Testable",
    "status": "Strongly Supported",
    "survivability": null,
    "testability": null,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "public",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780834993780,
    "updatedAt": 1780838219893,
    "handle": "humanx-seed",
    "nearDuplicateOf": null,
    "duplicateOf": null
  }
}
```

---

### Call 2 — Evidence evd_d685a866788942 (Cochrane/Demicheli)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_d685a866788942` |
| item.review_state | `"public"` |
| item.reliability_score | `85` |
| item.report_count | `0` |

---

### Call 3 — Evidence evd_450723b824024c (Madsen NEJM 2002)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_450723b824024c` |
| item.review_state | `"public"` |
| item.reliability_score | `84` |
| item.report_count | `0` |

---

## 8. Post-Promotion Verification

### 8.1 — Review Queue (`GET /api/review`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-A1 claim in review queue | No | Not found | ✅ |
| launch-A1 evidence in review queue | No | 0 items | ✅ |
| launch-D2 in review queue | No (already public) | Not found | ✅ |
| launch-A4 in review queue | No (already public) | Not found | ✅ |
| launch-C1 in review queue | Yes — `review` | IN QUEUE review_state=review | ✅ |
| launch-B5 in review queue | Yes — `review` | IN QUEUE review_state=review | ✅ |
| Total claims in queue | 23 (24 minus 1 promoted) | 23 | ✅ |

### 8.2 — Public Claims Feed (`GET /api/claims`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-A1 in public feed | Yes | Yes — `review_state: public` | ✅ |
| launch-A1 claim text | exact | exact match | ✅ |
| launch-D2 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-A4 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-C1 in public feed | No | Not found | ✅ |
| launch-B5 in public feed | No | Not found | ✅ |
| Total public claims | 25 | 25 | ✅ |

**Seed claims now public: launch-D2, launch-A4, and launch-A1. Remaining: C1 and B5.**

### 8.3 — Status Recalculation Observation

The claim promotion response (Call 1) returned `item.status: "Strongly Supported"` —
matching both the stored seed value and the expected status. Evidence reliability scores
are 85 (Cochrane) and 84 (Madsen NEJM). `recalcClaimScore` triggers on each evidence
promotion. The stored and displayed status both align at `Strongly Supported` for this
claim, consistent with the intentional evidence-based framing chosen in D-76C (avoiding
the overclaiming absolute "Proven" for a claim with ongoing public controversy).

---

## 9. Issues

**None.** All 3 calls returned `ok: true`. All 11 post-promotion checks passed.
No stop conditions triggered. `contradictions: 1` is expected (Wakefield/BMJ fraud
pressure point visible once claim is public — this is the intended counterargument for
the MMR claim).

---

## 10. Gate

**D-80E is complete. All 3 promotion calls succeeded. All verifications passed.**

| Step | Status |
|------|--------|
| D-80C — launch-D2 sleep deprivation | ✅ COMPLETE |
| D-80D — launch-A4 CO2/climate | ✅ COMPLETE |
| D-80E — launch-A1 MMR/autism | ✅ COMPLETE |
| D-80F — promote launch-C1 (`clm_seed_8ad9ff121579`) platform recommendation systems | ⛔ BLOCKED — requires explicit per-session approval |
| D-80G — promote launch-B5 (`clm_seed_8e095b6f6d30`) Holocaust | ⛔ BLOCKED — promote last; requires explicit per-session approval |

No further promotion will occur without explicit per-session user approval of a specific claim.

---

## D-80E Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-80D commit (ff0b51a) | ✅ |
| Preflight GET /api/review — all checks passed including status guard | ✅ |
| Claim id, user_id, review_state, status (Strongly Supported), text confirmed | ✅ |
| Status NOT Proven guard passed | ✅ |
| Evidence count confirmed: 2 | ✅ |
| Evidence source URLs confirmed — both PubMed URLs match expected | ✅ |
| Evidence IDs recorded: evd_d685a866788942, evd_450723b824024c | ✅ |
| POST claim promotion — HTTP 200, ok: true, reviewState: public | ✅ |
| POST evidence 1 (Cochrane) — HTTP 200, ok: true, review_state: public | ✅ |
| POST evidence 2 (Madsen NEJM) — HTTP 200, ok: true, review_state: public | ✅ |
| Exactly 3 POST calls made — no extras | ✅ |
| Post-promotion GET /api/review — A1 not in queue, C1/B5 at review, D2/A4 not in queue | ✅ |
| Post-promotion GET /api/claims — A1 public, D2/A4 public, C1/B5 not public | ✅ |
| launch-D2 unchanged — remains public | ✅ |
| launch-A4 unchanged — remains public | ✅ |
| No other seed claim promoted | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| No bulk promotion | ✅ |
| Temp files deleted | ✅ |
| docs/D80E_PROMOTE_LAUNCH_A1_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
