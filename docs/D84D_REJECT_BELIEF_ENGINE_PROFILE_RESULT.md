# D-84D: Reject "Belief Engine Profile — Stoic Atheism" — Result

Date: 2026-06-07
Step: D-84D — second per-item cleanup action, reject clm_d1e4261798754199a6
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-84D was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_d1e4261798754199a6`
("Belief Engine Profile — Stoic Atheism").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_d1e4261798754199a6` |
| Claim text | Belief Engine Profile — Stoic Atheism |
| user handle | `anon-xksavy` (`usr_3c204c78f6fa49bfad`) |
| Category | Belief |
| Type | Belief/Testable |
| Reason for rejection | Development artifact from Belief Engine → Send to HumanX flow. Text is a profile label, not a falsifiable factual claim. Should never be promoted to public. |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in queue | Yes | Yes | ✅ |
| claim text | "Belief Engine Profile — Stoic Atheism" | "Belief Engine Profile — Stoic Atheism" | ✅ |
| review_state | `review` | `review` | ✅ |
| report_count | 0 | 0 | ✅ |
| handle | test/dev account | `usr_3c204c78f6fa49bfad` | ✅ |
| target in public feed | No | Not found in `GET /api/claims` | ✅ |
| public feed total | 27 | 27 | ✅ |
| queue by state (pre) | rejected:11, public:5, review:5 | rejected:11, public:5, review:5 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"clm_d1e4261798754199a6","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_d1e4261798754199a6",
    "claim": "Belief Engine Profile — Stoic Atheism",
    "category": "Belief",
    "type": "Belief/Testable",
    "status": "Plausible",
    "evidenceScore": 24,
    "survivability": 34,
    "testability": 55,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "rejected",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 1,
    "createdAt": 1780426392624,
    "updatedAt": 1780846812554,
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
| item.reportCount | 0 | ✅ |
| item.id | clm_d1e4261798754199a6 | ✅ |
| item.claim | Belief Engine Profile — Stoic Atheism | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target `review_state` | `rejected` | `rejected` | ✅ |
| Target `report_count` | 0 | 0 | ✅ |
| Total claims in queue | 21 (unchanged — rejected items remain in queue view) | 21 | ✅ |
| Queue by state: rejected | 12 (was 11 + this item) | 12 | ✅ |
| Queue by state: review | 4 (was 5 − this item) | 4 | ✅ |
| Queue by state: public | 5 (unchanged) | 5 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |
| Public feed count | 27 (unchanged — target was not public) | 27 (pre-check) | ✅ |
| D-84E target (`clm_852333ac90654ab495`) state | review | review | ✅ |

---

## 7. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| Exactly one POST call made | ✅ |
| No other claim rejected | ✅ |
| No public claim touched | ✅ |
| No archive/cleanup route called | ✅ |
| No D1 write | ✅ |
| No Wrangler | ✅ |
| No bulk moderation | ✅ |
| Seed claims unchanged | ✅ |
| Public feed count unchanged (27) | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted after reading | ✅ |

---

## 8. Gate

| Step | Status |
|------|--------|
| D-84C — reject "I am the best" | ✅ COMPLETE |
| D-84D — reject "Belief Engine Profile — Stoic Atheism" | ✅ COMPLETE (this doc) |
| D-84E — reject "everyone knows the government is hiding everything" | ⛔ BLOCKED |

D-84E requires explicit same-session approval:
> `EXPLICIT USER APPROVAL: The user approves D-84E only: reject clm_852333ac90654ab495 — "everyone knows the government is hiding everything".`

---

## D-84D Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-84C commit (7862628) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Target not in public feed confirmed | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected | ✅ |
| Post-verification queue state confirmed | ✅ |
| review-state count 5→4 confirmed | ✅ |
| rejected count 11→12 confirmed | ✅ |
| Seed claims unaffected | ✅ |
| D-84E target (`clm_852333ac90654ab495`) still in review state confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D84D_REJECT_BELIEF_ENGINE_PROFILE_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
