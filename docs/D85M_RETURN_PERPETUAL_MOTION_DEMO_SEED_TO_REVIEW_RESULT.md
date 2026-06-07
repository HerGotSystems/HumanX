# D-85M: Return "Perpetual motion machines…" demo seed (clm_seed_8ce1875d322b) to Review — Result

Date: 2026-06-07
Step: D-85M — twelfth D-85 cleanup action, return clm_seed_8ce1875d322b to review
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85M was explicitly approved by the user in the same session.
Approved scope: return exactly one claim to review — `clm_seed_8ce1875d322b`
("Perpetual motion machines can produce free energy forever" demo seed).

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_seed_8ce1875d322b` |
| Claim text | Perpetual motion machines can produce free energy forever |
| handle | `humanx-seed` (original demo seed script) |
| status | Reality Collapse |
| duplicateOf | null (standalone demo claim) |
| review_state (pre) | `public` |
| Reason | Original demo seed from `humanx-seed` handle; never went through editorial review. Moved to review for proper assessment before public display. |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| total public claims | 11 | 11 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_seed_8ce1875d322b","decision":"review"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "item": {
    "id": "clm_seed_8ce1875d322b",
    "claim": "Perpetual motion machines can produce free energy forever",
    "reviewState": "review",
    "updatedAt": 1780857244144
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
| Queue: review | 8 (was 7 + this) | 8 | ✅ |
| Queue: rejected | 25 (unchanged) | 25 | ✅ |
| Total public claims | 10 (was 11) | 10 | ✅ |
| Launch seeds present | 5 | 5 | ✅ |

Remaining non-seed public claims (5 — D-85N–R targets):
`clm_97c7f7a525c54276bc`, `clm_3bc837c5d8a24cf9b5`, `clm_6032e1bc88ff443587`,
`clm_5624bd2c8d9246598a`, `clm_6f14973b90ed48c3bb`

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

## D-85M Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: review | ✅ |
| public feed 11→10 confirmed | ✅ |
| review queue 7→8 confirmed | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85M_RETURN_PERPETUAL_MOTION_DEMO_SEED_TO_REVIEW_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
