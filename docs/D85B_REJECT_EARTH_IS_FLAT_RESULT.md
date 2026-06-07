# D-85B: Reject "The Earth is flat" (HX-000001) — Result

Date: 2026-06-07
Step: D-85B — first D-85 cleanup action, reject HX-000001
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-85B was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `HX-000001` ("The Earth is flat").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `HX-000001` |
| Claim text | The Earth is flat |
| handle | `anon-o_seed` (not a real user — early seed script) |
| Category | Cosmology |
| Type | Physical/Testable |
| status | **Strongly Supported** (critical scoring artifact — demonstrably false claim) |
| evidenceScore | 68 |
| survivability | 84 |
| testability | 98 |
| contradictions | 3 |
| review_state (pre) | `public` |
| report_count | 0 |
| duplicateOf | null (note: `clm_seed_0f5608464fb5` has `duplicateOf: HX-000001`) |
| Reason for rejection | `status=Strongly Supported` on a demonstrably false claim is the highest-priority credibility risk in the system. Early seed row inserted before evidence moderation existed; unmoderated evidence inflated the score. Handle `anon-o_seed` is not a real user. Identified as 🔴 URGENT in D-85A audit. |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/claims` and `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in public feed | Yes | Yes | ✅ |
| claim text | "The Earth is flat" | "The Earth is flat" | ✅ |
| reviewState | `public` | `public` | ✅ |
| status | Strongly Supported (artifact) | Strongly Supported | ✅ |
| report_count | 0 | 0 | ✅ |
| handle | anon-o_seed | anon-o_seed | ✅ |
| in review queue pre-POST | No (public, report_count=0) | No | ✅ |
| queue by state (pre) | rejected:19, review:2 | rejected:19, review:2 | ✅ |
| total public claims | 22 | 22 | ✅ |
| launch seeds present | 5 | 5 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"HX-000001","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "HX-000001",
    "claim": "The Earth is flat",
    "category": "Cosmology",
    "type": "Physical/Testable",
    "status": "Strongly Supported",
    "evidenceScore": 68,
    "survivability": 84,
    "testability": 98,
    "contradictions": 3,
    "reportCount": 0,
    "reviewState": "rejected",
    "beliefYes": 0,
    "beliefNo": 1,
    "uncertainty": 0,
    "createdAt": 1779828364138,
    "updatedAt": 1780854842081,
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
| item.id | HX-000001 | ✅ |
| item.claim | The Earth is flat | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/claims` and `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| HX-000001 in public feed | No (removed) | No | ✅ |
| HX-000001 in review queue | present as `rejected` | rejected | ✅ |
| Queue by state: rejected | 20 (was 19 + this item) | 20 | ✅ |
| Queue by state: review | 2 (unchanged) | 2 | ✅ |
| Total public claims | 21 (was 22 − this item) | 21 | ✅ |
| Launch seeds present | 5 (unchanged) | 5 | ✅ |
| D-85C target (`clm_79f69a5075df45f181`) | still public | public | ✅ |

**The critical credibility risk is resolved.** "The Earth is flat" with
`status=Strongly Supported` is no longer visible in the public feed.

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

## 8. Remaining D-85 Sequence

Next high-priority items per D-85A plan:

| Step | id | Claim | State | Priority |
|------|----|-------|-------|:---:|
| D-85C | `clm_79f69a5075df45f181` | HOWGH test | public | 🔴 |
| D-85D | `clm_8ad342e93c594f1082` | People are stupid - TEST | public | 🔴 |
| D-85E | `HX-000002` | Humans landed on the Moon | public | High |
| D-85F | `clm_4176a17d0a754b78aa` | Science has proven it | public | High |
| D-85G | `clm_cdba3db932b84f279a` | People are stupid | public | High |

D-85C approval phrase:
> `EXPLICIT USER APPROVAL: The user approves D-85C only: reject clm_79f69a5075df45f181 — "HOWGH test".`

---

## D-85B Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-85A commit (2400b28) | ✅ |
| Preflight — target confirmed public, status=Strongly Supported artifact | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected | ✅ |
| HX-000001 removed from public feed confirmed | ✅ |
| public count 22→21 confirmed | ✅ |
| rejected count 19→20 confirmed | ✅ |
| Launch seeds unaffected (5 present) | ✅ |
| D-85C target still public confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D85B_REJECT_EARTH_IS_FLAT_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
