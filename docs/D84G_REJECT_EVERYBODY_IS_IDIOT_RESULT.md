# D-84G: Reject "EVERYBODY IS IDIOT" — Result

Date: 2026-06-07
Step: D-84G — fifth per-item cleanup action, reject clm_6bd4e59efa2a44d1b2
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-84G was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_6bd4e59efa2a44d1b2` ("EVERYBODY IS IDIOT").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_6bd4e59efa2a44d1b2` |
| Claim text | EVERYBODY IS IDIOT |
| user handle | `anon-xksavy` (`usr_3c204c78f6fa49bfad`) |
| Category | Law |
| Type | Physical/Testable |
| review_state (pre) | `public` (visible to all users) |
| report_count (pre) | 1 (report reason: `2`) |
| Reason for rejection | All-caps insult, not a falsifiable factual claim; reported by a user; Phase 2 public junk removal |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in queue | Yes | Yes | ✅ |
| claim text | "EVERYBODY IS IDIOT" | "EVERYBODY IS IDIOT" | ✅ |
| review_state | `public` | `public` | ✅ |
| report_count | 1 | 1 | ✅ |
| handle | test/dev account | `usr_3c204c78f6fa49bfad` | ✅ |
| queue by state (pre) | rejected:14, public:5, review:2 | rejected:14, public:5, review:2 | ✅ |
| seed claims in queue | 0 | 0 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"clm_6bd4e59efa2a44d1b2","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_6bd4e59efa2a44d1b2",
    "claim": "EVERYBODY IS IDIOT",
    "category": "Law",
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
    "createdAt": 1780612085771,
    "updatedAt": 1780848341650,
    "handle": "anon-xksavy",
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
| item.reportCount | 0 (reports closed by decision) | ✅ |
| item.id | clm_6bd4e59efa2a44d1b2 | ✅ |
| item.claim | EVERYBODY IS IDIOT | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target `review_state` | `rejected` | `rejected` | ✅ |
| Target `report_count` | 0 | 0 | ✅ |
| Total claims in queue | 21 (unchanged — rejected items remain in queue view) | 21 | ✅ |
| Queue by state: rejected | 15 (was 14 + this item) | 15 | ✅ |
| Queue by state: public | 4 (was 5 − this item, removed from public feed) | 4 | ✅ |
| Queue by state: review | 2 (unchanged) | 2 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |
| D-84H target (`clm_ba71db1962b8474bb7`) state | public | public | ✅ |

**Note:** This is the first Phase 2 rejection — target was `review_state='public'` before the
POST. Rejecting a public claim removes it from the public feed (public count 5→4). The
`reviewDecision` route sets `review_state='rejected'` and resets `report_count=0`.

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
| D-84G — "EVERYBODY IS IDIOT" (public) | ✅ COMPLETE (this doc) |
| D-84H — "PEOPLE ARE STUPID" (public) | ⛔ BLOCKED |
| D-84I — "DOCTRINE" (public) | ⛔ BLOCKED |

D-84H requires explicit same-session approval:
> `EXPLICIT USER APPROVAL: The user approves D-84H only: reject clm_ba71db1962b8474bb7 — "PEOPLE ARE STUPID".`

---

## D-84G Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-84F commit (7f6e625) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Target confirmed public (review_state=public, report_count=1) | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected, reportCount: 0 | ✅ |
| Post-verification queue state confirmed | ✅ |
| public count 5→4 confirmed (removed from public feed) | ✅ |
| rejected count 14→15 confirmed | ✅ |
| review count unchanged at 2 | ✅ |
| Seed claims unaffected | ✅ |
| D-84H target (`clm_ba71db1962b8474bb7`) still public confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D84G_REJECT_EVERYBODY_IS_IDIOT_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
