# D-85D: Reject "People are stupid - TEST" — Result

Date: 2026-06-07
Step: D-85D — third D-85 cleanup action, reject clm_8ad342e93c594f1082
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85D was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_8ad342e93c594f1082`
("People are stupid - TEST").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_8ad342e93c594f1082` |
| Claim text | People are stupid - TEST |
| handle | `anon-ek3562` |
| Category | All |
| Type | Physical/Testable |
| status | Plausible |
| contradictions | 6 |
| review_state (pre) | `public` |
| report_count | 0 |
| Reason for rejection | Explicit "- TEST" marker in claim text; test submission from dev account; not a real claim; identified as 🔴 URGENT in D-85A audit |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| total public claims | 20 | 20 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_8ad342e93c594f1082","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_8ad342e93c594f1082",
    "claim": "People are stupid - TEST",
    "reviewState": "rejected",
    "reportCount": 0,
    "updatedAt": 1780855215370
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
| Queue: rejected | 22 (was 21 + this) | 22 | ✅ |
| Queue: review | 2 (unchanged) | 2 | ✅ |
| Total public claims | 19 (was 20) | 19 | ✅ |
| Launch seeds present | 5 | 5 | ✅ |
| D-85E target (`HX-000002`) | public | public | ✅ |

**All three 🔴 URGENT items from D-85A are now removed from the public feed.**

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

Remaining high-priority items:

| Step | id | Claim | Issue |
|------|----|-------|-------|
| D-85E | `HX-000002` | Humans landed on the Moon | `status=Weak Evidence`, `evidenceScore=5` — inversely misleading |
| D-85F | `clm_4176a17d0a754b78aa` | Science has proven it | Incomplete fragment, not a claim |
| D-85G | `clm_cdba3db932b84f279a` | People are stupid | `status=Proven` scoring artifact on insult |

D-85E approval phrase:
> `EXPLICIT USER APPROVAL: The user approves D-85E only: reject HX-000002 — "Humans landed on the Moon".`

---

## D-85D Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: rejected | ✅ |
| public feed 20→19 confirmed | ✅ |
| rejected queue 21→22 confirmed | ✅ |
| All 3 🔴 URGENT items now cleared | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85D_REJECT_PEOPLE_STUPID_TEST_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
