# D-85E: Reject "Humans landed on the Moon" (HX-000002) — Result

Date: 2026-06-07
Step: D-85E — fourth D-85 cleanup action, reject HX-000002
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85E was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `HX-000002` ("Humans landed on the Moon").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `HX-000002` |
| Claim text | Humans landed on the Moon |
| handle | `anon-o_seed` (early seed script, not a real user) |
| Category | History/Space |
| Type | Historical |
| status | **Weak Evidence** (scoring artifact — well-established historical fact) |
| evidenceScore | 5 |
| survivability | 21 |
| testability | 82 |
| contradictions | 1 |
| review_state (pre) | `public` |
| report_count | 0 |
| Reason for rejection | `status=Weak Evidence` / `evidenceScore=5` on a well-established historical fact is an inverse credibility risk. Early seed row inserted before evidence moderation existed; score was never corrected. Handle `anon-o_seed` is not a real user. Identified as High priority in D-85A audit. |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/claims` and `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in public feed | Yes | Yes | ✅ |
| claim text | "Humans landed on the Moon" | confirmed | ✅ |
| reviewState | `public` | public | ✅ |
| status | Weak Evidence (artifact) | Weak Evidence | ✅ |
| evidenceScore | 5 | 5 | ✅ |
| report_count | 0 | 0 | ✅ |
| queue by state (pre) | rejected:22, review:2 | rejected:22, review:2 | ✅ |
| total public claims | 19 | 19 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"HX-000002","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "HX-000002",
    "claim": "Humans landed on the Moon",
    "category": "History/Space",
    "type": "Historical",
    "status": "Weak Evidence",
    "evidenceScore": 5,
    "survivability": 21,
    "testability": 82,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "rejected",
    "beliefYes": 1,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1779828364138,
    "updatedAt": 1780855361456,
    "handle": "anon-o_seed",
    "nearDuplicateOf": null,
    "duplicateOf": null,
    "statusLocked": false
  }
}
```

| Field | Value | Pass |
|-------|-------|------|
| ok | true | ✅ |
| targetType | claim | ✅ |
| decision | rejected | ✅ |
| item.reviewState | rejected | ✅ |
| item.reportCount | 0 | ✅ |
| item.id | HX-000002 | ✅ |
| item.claim | Humans landed on the Moon | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/claims` and `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| HX-000002 in public feed | No (removed) | No | ✅ |
| Queue by state: rejected | 23 (was 22 + this item) | 23 | ✅ |
| Queue by state: review | 2 (unchanged) | 2 | ✅ |
| Total public claims | 18 (was 19 − this item) | 18 | ✅ |
| Launch seeds present | 5 (unchanged) | 5 | ✅ |
| D-85F target (`clm_4176a17d0a754b78aa`) | still public | public | ✅ |

**HX-000002 removed from public feed.** "Humans landed on the Moon" with
`status=Weak Evidence` / `evidenceScore=5` is no longer visible to users.

---

## 7. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| Exactly one POST call made | ✅ |
| No other claim rejected | ✅ |
| No seed claim touched | ✅ |
| No archive/cleanup route called | ✅ |
| No D1 write | ✅ |
| No Wrangler | ✅ |
| No bulk moderation | ✅ |
| Launch seed claims unchanged | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted after reading | ✅ |

---

## 8. Gate

Remaining high-priority items:

| Step | id | Claim | Issue |
|------|----|-------|-------|
| D-85F | `clm_4176a17d0a754b78aa` | Science has proven it | Incomplete fragment, not a claim |
| D-85G | `clm_cdba3db932b84f279a` | People are stupid | `status=Proven` scoring artifact on insult |

D-85F approval phrase:
> `EXPLICIT USER APPROVAL: The user approves D-85F only: reject clm_4176a17d0a754b78aa — "Science has proven it".`

---

## D-85E Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| Preflight — target confirmed public, status=Weak Evidence artifact | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected | ✅ |
| HX-000002 removed from public feed confirmed | ✅ |
| public count 19→18 confirmed | ✅ |
| rejected count 22→23 confirmed | ✅ |
| Launch seeds unaffected (5 present) | ✅ |
| D-85F target still public confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D85E_REJECT_HUMANS_LANDED_ON_MOON_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
