# D-85G: Reject "People are stupid" — Result

Date: 2026-06-07
Step: D-85G — sixth D-85 cleanup action, reject clm_cdba3db932b84f279a
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85G was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_cdba3db932b84f279a` ("People are stupid").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_cdba3db932b84f279a` |
| Claim text | People are stupid |
| handle | `anon-xksavy` |
| status | **Proven** (scoring artifact — unsubstantiated insult elevated by early unmoderated evidence) |
| review_state (pre) | `public` |
| report_count | 0 |
| Reason for rejection | `status=Proven` on a vague insult is a credibility artifact. Claim provides no testable assertion. Submitted by the same test account as D-85F ("Science has proven it"). Identified as High priority in D-85A audit. |

---

## 3. Preflight

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| reviewState | public | public | ✅ |
| status | Proven (artifact) | Proven | ✅ |
| total public claims | 17 | 17 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

---

## 4. POST Executed

```
POST https://humanx.rinkimirikata.com/api/review/decision
{"targetType":"claim","targetId":"clm_cdba3db932b84f279a","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_cdba3db932b84f279a",
    "claim": "People are stupid",
    "reviewState": "rejected",
    "reportCount": 0,
    "updatedAt": 1780855943076
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
| Queue: rejected | 25 (was 24 + this) | 25 | ✅ |
| Queue: review | 2 (unchanged) | 2 | ✅ |
| Total public claims | 16 (was 17) | 16 | ✅ |
| Launch seeds present | 5 | 5 | ✅ |

Remaining non-seed public claims (11 — all D-85H–R return-to-review candidates):
`clm_97c7f7a525c54276bc`, `clm_3bc837c5d8a24cf9b5`, `clm_6032e1bc88ff443587`,
`clm_37d2e262976f46d2b4`, `clm_5624bd2c8d9246598a`, `clm_6f14973b90ed48c3bb`,
`clm_seed_0f5608464fb5`, `clm_seed_f5699c8aa3a4`, `clm_seed_f4d482242f5f`,
`clm_seed_8ce1875d322b`, `HX-000003`

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

## 8. D-85 High-Priority Rejections — Complete

All 7 reject-priority items from D-85A are now resolved:

| Step | Claim | Reason | Outcome |
|------|-------|--------|---------|
| D-85B | "The Earth is flat" (HX-000001) | status=Strongly Supported on false claim 🔴 | Rejected ✅ |
| D-85C | "HOWGH test" | Explicit test submission 🔴 | Rejected ✅ |
| D-85D | "People are stupid - TEST" | Explicit TEST marker 🔴 | Rejected ✅ |
| D-85E | "Humans landed on the Moon" (HX-000002) | status=Weak Evidence / evidenceScore=5 on established fact | Rejected ✅ |
| D-85F | "Science has proven it" | Incomplete fragment, no referent | Rejected ✅ |
| D-85G | "People are stupid" | status=Proven artifact on insult | Rejected ✅ |

Remaining D-85 work (D-85H–R): 11 return-to-review items (lower priority, each requires individual approval).

---

## D-85G Completion Record

| Item | Status |
|------|--------|
| Explicit approval confirmed | ✅ |
| Preflight passed | ✅ |
| Exactly 1 POST | ✅ |
| ok: true, reviewState: rejected | ✅ |
| public feed 17→16 confirmed | ✅ |
| rejected queue 24→25 confirmed | ✅ |
| Launch seeds unaffected | ✅ |
| No D1 / No Wrangler / No archive | ✅ |
| Temp files deleted | ✅ |
| docs/D85G_REJECT_PEOPLE_ARE_STUPID_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
