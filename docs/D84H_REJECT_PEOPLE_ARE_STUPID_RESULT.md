# D-84H: Reject "PEOPLE ARE STUPID" — Result

Date: 2026-06-07
Step: D-84H — sixth per-item cleanup action, reject clm_ba71db1962b8474bb7
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-84H was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_ba71db1962b8474bb7` ("PEOPLE ARE STUPID").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_ba71db1962b8474bb7` |
| Claim text | PEOPLE ARE STUPID |
| user handle | `anon-xksavy` (`usr_3c204c78f6fa49bfad`) |
| Category | Politics |
| Type | Physical/Testable |
| review_state (pre) | `public` (visible to all users) |
| report_count (pre) | 1 (report reason: `del`) |
| near_duplicate_of | `clm_cdba3db932b84f279a` |
| Reason for rejection | All-caps insult, not a falsifiable factual claim; reported by a user (reason: del); from test/dev account; Phase 2 public junk removal |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in queue | Yes | Yes | ✅ |
| claim text | "PEOPLE ARE STUPID" | "PEOPLE ARE STUPID" | ✅ |
| review_state | `public` | `public` | ✅ |
| report_count | 1 | 1 | ✅ |
| handle | test/dev account | `usr_3c204c78f6fa49bfad` | ✅ |
| queue by state (pre) | rejected:15, public:4, review:2 | rejected:15, public:4, review:2 | ✅ |
| seed claims in queue | 0 | 0 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"clm_ba71db1962b8474bb7","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_ba71db1962b8474bb7",
    "claim": "PEOPLE ARE STUPID",
    "category": "Politics",
    "type": "Physical/Testable",
    "status": "Plausible",
    "evidenceScore": 24,
    "survivability": 41,
    "testability": 75,
    "contradictions": 0,
    "reportCount": 0,
    "reviewState": "rejected",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780612114679,
    "updatedAt": 1780848501217,
    "handle": "anon-xksavy",
    "nearDuplicateOf": "clm_cdba3db932b84f279a",
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
| item.reportCount | 0 (reports closed by decision) | ✅ |
| item.id | clm_ba71db1962b8474bb7 | ✅ |
| item.claim | PEOPLE ARE STUPID | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target `review_state` | `rejected` | `rejected` | ✅ |
| Target `report_count` | 0 | 0 | ✅ |
| Total claims in queue | 21 (unchanged — rejected items remain in queue view) | 21 | ✅ |
| Queue by state: rejected | 16 (was 15 + this item) | 16 | ✅ |
| Queue by state: public | 3 (was 4 − this item, removed from public feed) | 3 | ✅ |
| Queue by state: review | 2 (unchanged) | 2 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |
| D-84I target (`clm_3905faadfa9c47159e`) state | public | public | ✅ |

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
| Seed claims unchanged (5 public seed claims remain) | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted after reading | ✅ |

---

## 8. Gate

| Step | Claim | Status |
|------|-------|--------|
| D-84G — "EVERYBODY IS IDIOT" (public) | ✅ COMPLETE |
| D-84H — "PEOPLE ARE STUPID" (public) | ✅ COMPLETE (this doc) |
| D-84I — "DOCTRINE" (public) | ⛔ BLOCKED |

D-84I requires explicit same-session approval:
> `EXPLICIT USER APPROVAL: The user approves D-84I only: reject clm_3905faadfa9c47159e — "DOCTRINE".`

---

## D-84H Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-84G commit (96ab3dc) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Target confirmed public (review_state=public, report_count=1) | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected, reportCount: 0 | ✅ |
| Post-verification queue state confirmed | ✅ |
| public count 4→3 confirmed (removed from public feed) | ✅ |
| rejected count 15→16 confirmed | ✅ |
| review count unchanged at 2 | ✅ |
| Seed claims unaffected | ✅ |
| D-84I target (`clm_3905faadfa9c47159e`) still public confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D84H_REJECT_PEOPLE_ARE_STUPID_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
