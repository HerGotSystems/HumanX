# D-85I: Return "Money is evil" (clm_37d2e262976f46d2b4) to Review — Result

Date: 2026-06-07
Step: D-85I — eighth D-85 cleanup action, return clm_37d2e262976f46d2b4 to review
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85I was explicitly approved by the user in the same session.
Approved scope: return exactly one claim to review — `clm_37d2e262976f46d2b4` ("Money is evil").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_37d2e262976f46d2b4` |
| Claim text | Money is evil |
| handle | `anon-xksavy` |
| status | Weak Evidence |
| duplicateOf | `clm_5624bd2c8d9246598a` (the source "Money is evil" claim) |
| review_state (pre) | `public` |
| report_count | 0 |
| Reason | Marked `duplicateOf` the source claim; both were public simultaneously. Duplicate copy should not be in public feed. Moved to review for proper deduplication handling. |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| duplicateOf | clm_5624bd2c8d9246598a | clm_5624bd2c8d9246598a | ✅ |
| total public claims | 15 | 15 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_37d2e262976f46d2b4","decision":"review"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "item": {
    "id": "clm_37d2e262976f46d2b4",
    "claim": "Money is evil",
    "reviewState": "review",
    "updatedAt": 1780856414351
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
| Queue: review | 4 (was 3 + this) | 4 | ✅ |
| Queue: rejected | 25 (unchanged) | 25 | ✅ |
| Total public claims | 14 (was 15) | 14 | ✅ |
| Launch seeds present | 5 | 5 | ✅ |

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

## D-85I Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: review | ✅ |
| public feed 15→14 confirmed | ✅ |
| review queue 3→4 confirmed | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85I_RETURN_MONEY_IS_EVIL_DUPLICATE_TO_REVIEW_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
