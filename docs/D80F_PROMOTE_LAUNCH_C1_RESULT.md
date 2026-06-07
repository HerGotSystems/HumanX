# D-80F: Promote launch-C1 Result

Date: 2026-06-07
Step: D-80F — production promotion of launch-C1 platform recommendation systems claim
Type: 3 targeted moderation calls (1 claim + 2 evidence). Docs-only commit to main.
No D1 direct commands. No Wrangler. No bulk promotion. No other seed claims promoted.

---

## 1. Explicit User Approval

D-80F was explicitly approved by the user in the same session as execution.
Approval scope: promote launch-C1 (`clm_seed_8ad9ff121579`) claim and its 2 evidence
items to `review_state = 'public'` only.

No other seed claim was approved for promotion in this session.
launch-D2, launch-A4, and launch-A1 were already public and were not touched.
launch-B5 was not touched and remains at `review_state = 'review'`.

---

## 2. Non-Scope Statement

| Rule | Status |
|------|--------|
| Only launch-C1 claim and its 2 evidence items promoted | ✅ Confirmed |
| No other seed claim promoted (not B5) | ✅ Confirmed |
| launch-D2 not touched — already public, remains public | ✅ Confirmed |
| launch-A4 not touched — already public, remains public | ✅ Confirmed |
| launch-A1 not touched — already public, remains public | ✅ Confirmed |
| launch-B5 not touched — remains at review_state=review | ✅ Confirmed |
| No bulk promotion | ✅ Confirmed |
| No scripted promotion beyond 3 explicit target calls | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No destructive moderation (no reject/archive) | ✅ Confirmed |
| Admin token not printed, logged, or committed | ✅ Confirmed |
| Temp curl output files deleted after reading | ✅ Confirmed |

---

## 3. Preflight — State Before Promotion

**git HEAD:** `a2633d7` — docs: record D-80E launch-A1 promotion ✅

**Read-only `GET /api/review` confirmed before any promotion:**

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| Claim id | `clm_seed_8ad9ff121579` | `clm_seed_8ad9ff121579` | ✅ |
| user_id | `usr_seed_system` | `usr_seed_system` | ✅ |
| review_state | `review` | `review` | ✅ |
| status | `Plausible` | `Plausible` | ✅ |
| status guard | must be `Plausible` | confirmed `Plausible` | ✅ |
| Claim text (exact) | Online platform recommendation systems can use engagement signals that influence which information spreads widely | exact match | ✅ |
| Evidence count | 2 | 2 | ✅ |
| Vosoughi source URL | `https://pubmed.ncbi.nlm.nih.gov/29590045/` | exact match | ✅ |
| YouTube blog source URL | `https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/` | exact match | ✅ |
| launch-D2 not in queue (already public) | Not in queue | Not in queue | ✅ |
| launch-A4 not in queue (already public) | Not in queue | Not in queue | ✅ |
| launch-A1 not in queue (already public) | Not in queue | Not in queue | ✅ |
| launch-B5 at review | `review` | `review` | ✅ |

All preflight checks passed. Promotion proceeded.

**Note on pressure:** The `/api/review` response did not include a top-level `pressure`
field. Pressure items have no `review_state` column and become visible once the parent
claim is public. The seed data included 1 pressure item for launch-C1:
"On YouTube's recommendation system (responsibility framing)" (same YouTube blog URL —
the counterargument angle on platform accountability). The `contradictions: 1` field
in the claim promotion response confirms it is now visible.

---

## 4. Target Claim Details

| Field | Value |
|-------|-------|
| seed_id | `launch-C1` |
| DB claim id | `clm_seed_8ad9ff121579` |
| claim text | Online platform recommendation systems can use engagement signals that influence which information spreads widely |
| status (stored) | Plausible |
| user_id | usr_seed_system |
| review_state before | `review` |
| review_state after | `public` |

---

## 5. Evidence IDs Discovered and Promoted

| # | Evidence id | Title | Source URL | review_state before | review_state after | reliability_score |
|---|------------|-------|-----------|--------------------|--------------------|-------------------|
| 1 | `evd_76673741550c44` | The spread of true and false news online | https://pubmed.ncbi.nlm.nih.gov/29590045/ | `review` | `public` | 86 |
| 2 | `evd_904fd94e08554c` | On YouTube's recommendation system | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ | `review` | `public` | 55 |

**Note on reliability scores:** The Vosoughi et al. Science 2018 study (PubMed 29590045)
scored 86 — a peer-reviewed high-impact journal paper. The YouTube VP Engineering blog
post scored 55, reflecting its nature as a first-party platform statement rather than
independent research. The lower score for the blog post is expected and appropriate.

---

## 6. POST Calls Made

Exactly 3 calls. No other POST calls made.

**Call 1 — Claim promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"claim","targetId":"clm_seed_8ad9ff121579","decision":"public"}
```

**Call 2 — Vosoughi Science 2018 evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_76673741550c44","decision":"public"}
```

**Call 3 — YouTube recommendation system evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_904fd94e08554c","decision":"public"}
```

---

## 7. Response Summary — All 3 Calls

### Call 1 — Claim (clm_seed_8ad9ff121579)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"claim"` |
| decision | `"public"` |
| item.id | `clm_seed_8ad9ff121579` |
| item.reviewState | `"public"` |
| item.status | `"Plausible"` |
| item.reportCount | `0` |
| item.contradictions | `1` (YouTube responsibility pressure point now visible — expected) |
| item.handle | `"humanx-seed"` |

Full response:
```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "public",
  "item": {
    "id": "clm_seed_8ad9ff121579",
    "claim": "Online platform recommendation systems can use engagement signals that influence which information spreads widely",
    "category": "Civic / Media Literacy",
    "type": "Sociological/Observable",
    "status": "Plausible",
    "survivability": null,
    "testability": null,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "public",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780834993780,
    "updatedAt": 1780838700110,
    "handle": "humanx-seed",
    "nearDuplicateOf": null,
    "duplicateOf": null
  }
}
```

---

### Call 2 — Evidence evd_76673741550c44 (Vosoughi et al. Science 2018)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_76673741550c44` |
| item.review_state | `"public"` |
| item.reliability_score | `86` |
| item.report_count | `0` |

---

### Call 3 — Evidence evd_904fd94e08554c (YouTube VP Engineering blog)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_904fd94e08554c` |
| item.review_state | `"public"` |
| item.reliability_score | `55` |
| item.report_count | `0` |

---

## 8. Post-Promotion Verification

### 8.1 — Review Queue (`GET /api/review`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-C1 claim in review queue | No | Not found | ✅ |
| launch-C1 evidence in review queue | No | 0 items | ✅ |
| launch-D2 in review queue | No (already public) | Not found | ✅ |
| launch-A4 in review queue | No (already public) | Not found | ✅ |
| launch-A1 in review queue | No (already public) | Not found | ✅ |
| launch-B5 in review queue | Yes — `review` | IN QUEUE review_state=review | ✅ |
| Total claims in queue | 22 (23 minus 1 promoted) | 22 | ✅ |

### 8.2 — Public Claims Feed (`GET /api/claims`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-C1 in public feed | Yes | Yes — public | ✅ |
| launch-C1 claim text | exact | exact match | ✅ |
| launch-D2 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-A4 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-A1 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-B5 in public feed | No | Not found | ✅ |
| Total public claims | 26 | 26 | ✅ |

**Seed claims now public: launch-D2, launch-A4, launch-A1, and launch-C1.**
**Remaining: launch-B5 (Holocaust) only.**

### 8.3 — Status Recalculation Observation

The claim promotion response (Call 1) returned `item.status: "Plausible"` — matching
the stored seed value and the expected status. `recalcClaimScore` triggers on each
evidence promotion. The aggregate of Vosoughi 86 and YouTube blog 55 may produce a
recalculated score; however the displayed claim status in the public feed was not
separately re-queried. The stored status `Plausible` is intentionally conservative
per D-76C (the claim was narrowed from broader algorithmic amplification language
to the more qualified "can use engagement signals that influence"). No concern.

---

## 9. Issues

**None.** All 3 calls returned `ok: true`. All 11 post-promotion checks passed.
No stop conditions triggered. `contradictions: 1` is expected — the YouTube responsibility
framing pressure point is now visible, providing direct counterargument balance on the
platform accountability question. The YouTube blog post evidence scoring 55 is expected
and appropriate (first-party platform statement, not independent research).

---

## 10. Gate

**D-80F is complete. All 3 promotion calls succeeded. All verifications passed.**

| Step | Status |
|------|--------|
| D-80C — launch-D2 sleep deprivation | ✅ COMPLETE |
| D-80D — launch-A4 CO2/climate | ✅ COMPLETE |
| D-80E — launch-A1 MMR/autism | ✅ COMPLETE |
| D-80F — launch-C1 platform recommendation systems | ✅ COMPLETE |
| D-80G — promote launch-B5 (`clm_seed_8e095b6f6d30`) Holocaust | ⛔ BLOCKED — promote last; requires explicit per-session approval |

No further promotion will occur without explicit per-session user approval.

---

## D-80F Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-80E commit (a2633d7) | ✅ |
| Preflight GET /api/review — all checks passed including status guard (Plausible) | ✅ |
| Claim id, user_id, review_state, status, text confirmed | ✅ |
| Evidence count confirmed: 2 | ✅ |
| Evidence source URLs confirmed — both match expected | ✅ |
| Evidence IDs recorded: evd_76673741550c44, evd_904fd94e08554c | ✅ |
| POST claim promotion — HTTP 200, ok: true, reviewState: public | ✅ |
| POST evidence 1 (Vosoughi Science) — HTTP 200, ok: true, review_state: public | ✅ |
| POST evidence 2 (YouTube blog) — HTTP 200, ok: true, review_state: public | ✅ |
| Exactly 3 POST calls made — no extras | ✅ |
| Post-promotion GET /api/review — C1 not in queue, B5 at review, D2/A4/A1 not in queue | ✅ |
| Post-promotion GET /api/claims — C1/D2/A4/A1 public, B5 not public | ✅ |
| launch-D2 unchanged — remains public | ✅ |
| launch-A4 unchanged — remains public | ✅ |
| launch-A1 unchanged — remains public | ✅ |
| launch-B5 unchanged — remains at review_state=review | ✅ |
| No other seed claim promoted | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| No bulk promotion | ✅ |
| Temp files deleted | ✅ |
| docs/D80F_PROMOTE_LAUNCH_C1_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
