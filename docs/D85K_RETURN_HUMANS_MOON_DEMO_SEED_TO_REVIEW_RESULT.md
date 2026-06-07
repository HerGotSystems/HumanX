# D-85K: Return "Humans landed on the Moon" demo seed (clm_seed_f5699c8aa3a4) to Review — Result

Date: 2026-06-07
Step: D-85K — tenth D-85 cleanup action, return clm_seed_f5699c8aa3a4 to review
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85K was explicitly approved by the user in the same session.
Approved scope: return exactly one claim to review — `clm_seed_f5699c8aa3a4` ("Humans landed on the Moon" demo seed).

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_seed_f5699c8aa3a4` |
| Claim text | Humans landed on the Moon |
| handle | `humanx-seed` (original demo seed script) |
| status | Strongly Supported |
| duplicateOf | `HX-000002` (rejected in D-85E) |
| review_state (pre) | `public` |
| Reason | Original demo seed; `duplicateOf` HX-000002 which was rejected in D-85E. Demo seed copy removed from public feed and moved to review. |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| duplicateOf | HX-000002 | HX-000002 | ✅ |
| total public claims | 13 | 13 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_seed_f5699c8aa3a4","decision":"review"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "item": {
    "id": "clm_seed_f5699c8aa3a4",
    "claim": "Humans landed on the Moon",
    "reviewState": "review",
    "updatedAt": 1780856781433
  }
}
```

| Field | Value | Pass |
|-------|-------|------|
| ok | true | ✅ |
| item.reviewState | review | ✅ |

---

## 6. Post-Moderation Verification

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target in public feed | No | No | ✅ |
| Queue: review | 6 (was 5 + this) | 6 | ✅ |
| Queue: rejected | 25 (unchanged) | 25 | ✅ |
| Total public claims | 12 (was 13) | 12 | ✅ |
| Launch seeds present | 5 | 5 | ✅ |

---

## 7. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| Exactly one POST call made | ✅ |
| No other claim changed | ✅ |
| No launch seed touched | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted | ✅ |

---

## D-85K Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: review | ✅ |
| public feed 13→12 confirmed | ✅ |
| review queue 5→6 confirmed | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85K_RETURN_HUMANS_MOON_DEMO_SEED_TO_REVIEW_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
