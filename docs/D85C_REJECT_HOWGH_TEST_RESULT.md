# D-85C: Reject "HOWGH test" — Result

Date: 2026-06-07
Step: D-85C — second D-85 cleanup action, reject clm_79f69a5075df45f181
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85C was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_79f69a5075df45f181` ("HOWGH test").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_79f69a5075df45f181` |
| Claim text | HOWGH test |
| handle | `anon-73d9y2` |
| Category | General |
| Type | Physical/Testable |
| status | Plausible |
| contradictions | 17 |
| review_state (pre) | `public` |
| report_count | 0 |
| Reason for rejection | Explicit test submission ("HOWGH test"); 17 contradictions; not a claim; identified as 🔴 URGENT in D-85A audit |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| total public claims | 21 | 21 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_79f69a5075df45f181","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_79f69a5075df45f181",
    "claim": "HOWGH test",
    "reviewState": "rejected",
    "reportCount": 0,
    "updatedAt": 1780854979634
  }
}
```

| Field | Value | Pass |
|-------|-------|------|
| ok | true | ✅ |
| item.reviewState | rejected | ✅ |
| item.reportCount | 0 | ✅ |

---

## 6. Post-Moderation Verification

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target in public feed | No | No | ✅ |
| Queue: rejected | 21 (was 20 + this) | 21 | ✅ |
| Queue: review | 2 (unchanged) | 2 | ✅ |
| Total public claims | 20 (was 21) | 20 | ✅ |
| Launch seeds present | 5 | 5 | ✅ |
| D-85D target (`clm_8ad342e93c594f1082`) | public | public | ✅ |

---

## 7. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| Exactly one POST call made | ✅ |
| No other claim changed | ✅ |
| No seed claim touched | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted | ✅ |

---

## 8. Gate

D-85D approval phrase:
> `EXPLICIT USER APPROVAL: The user approves D-85D only: reject clm_8ad342e93c594f1082 — "People are stupid - TEST".`

---

## D-85C Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: rejected | ✅ |
| public feed 21→20 confirmed | ✅ |
| rejected queue 20→21 confirmed | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85C_REJECT_HOWGH_TEST_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
