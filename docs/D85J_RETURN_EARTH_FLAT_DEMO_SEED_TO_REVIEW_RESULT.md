# D-85J: Return "The Earth is flat" demo seed (clm_seed_0f5608464fb5) to Review — Result

Date: 2026-06-07
Step: D-85J — ninth D-85 cleanup action, return clm_seed_0f5608464fb5 to review
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85J was explicitly approved by the user in the same session.
Approved scope: return exactly one claim to review — `clm_seed_0f5608464fb5` ("The Earth is flat" demo seed).

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_seed_0f5608464fb5` |
| Claim text | The Earth is flat |
| handle | `humanx-seed` (original demo seed script) |
| status | Plausible |
| duplicateOf | `HX-000001` (already rejected in D-85B) |
| review_state (pre) | `public` |
| Reason | Original demo seed; `duplicateOf` its counterpart HX-000001 which was rejected in D-85B. Both should not remain public; demo seed copy moved to review for assessment. |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| duplicateOf | HX-000001 | HX-000001 | ✅ |
| total public claims | 14 | 14 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_seed_0f5608464fb5","decision":"review"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "item": {
    "id": "clm_seed_0f5608464fb5",
    "claim": "The Earth is flat",
    "reviewState": "review",
    "updatedAt": 1780856591105
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
| Queue: review | 5 (was 4 + this) | 5 | ✅ |
| Queue: rejected | 25 (unchanged) | 25 | ✅ |
| Total public claims | 13 (was 14) | 13 | ✅ |
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

## D-85J Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: review | ✅ |
| public feed 14→13 confirmed | ✅ |
| review queue 4→5 confirmed | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85J_RETURN_EARTH_FLAT_DEMO_SEED_TO_REVIEW_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
