# D-84L: Reject "Never trust the experts" — Result

Date: 2026-06-07
Step: D-84L — tenth per-item cleanup action, reject clm_ae59b53d5f4249f0b4
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-84L was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_ae59b53d5f4249f0b4`
("Never trust the experts").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_ae59b53d5f4249f0b4` |
| Claim text | Never trust the experts |
| user handle | `anon-xksavy` (`usr_3c204c78f6fa49bfad`) |
| Category | institution |
| Type | Truth-Derived |
| status | Proven (scoring artifact — see D-84J-AUDIT) |
| evidence_score | 85 |
| survivability | 96 |
| review_state (pre) | `review` (never public; auto-escalated by report_count=2) |
| report_count (pre) | 2 (report reason: `5`; triggered auto-escalation) |
| Reason for rejection | Anti-expertise absolute framing ("never trust"); status=Proven is scoring artifact; report_count=2 already correctly escalated it; from test/dev account; fully analysed in D-84J-AUDIT |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in queue | Yes | Yes | ✅ |
| claim text | "Never trust the experts" | "Never trust the experts" | ✅ |
| review_state | `review` | `review` | ✅ |
| report_count | 2 | 2 | ✅ |
| handle | test/dev account | `usr_3c204c78f6fa49bfad` | ✅ |
| queue by state (pre) | rejected:18, public:0, review:3 | rejected:18, public:0, review:3 | ✅ |
| seed claims in queue | 0 | 0 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"clm_ae59b53d5f4249f0b4","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_ae59b53d5f4249f0b4",
    "claim": "Never trust the experts",
    "category": "institution",
    "type": "Truth-Derived",
    "status": "Proven",
    "evidenceScore": 85,
    "survivability": 96,
    "testability": 50,
    "contradictions": 0,
    "reportCount": 0,
    "reviewState": "rejected",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780357211548,
    "updatedAt": 1780854146878,
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
| item.id | clm_ae59b53d5f4249f0b4 | ✅ |
| item.claim | Never trust the experts | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target `review_state` | `rejected` | `rejected` | ✅ |
| Target `report_count` | 0 | 0 | ✅ |
| Total claims in queue | 21 (unchanged) | 21 | ✅ |
| Queue by state: rejected | 19 (was 18 + this item) | 19 | ✅ |
| Queue by state: review | 2 (was 3 − this item) | 2 | ✅ |
| Queue by state: public | 0 (unchanged) | 0 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |
| D-84K (`clm_af8da34be53b40f395`) | review | review | ✅ |
| D-84M (`clm_13afcc7128054661a3`) | review | review | ✅ |

---

## 7. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| Exactly one POST call made | ✅ |
| No other claim changed | ✅ |
| No seed claim touched | ✅ |
| No archive/cleanup route called | ✅ |
| No D1 write | ✅ |
| No Wrangler | ✅ |
| No bulk moderation | ✅ |
| Seed claims unchanged | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted after reading | ✅ |

---

## 8. Remaining Phase 3 Item

One item remains — D-84M. This is the only judgment-call item for which the
recommended disposition is no action (keep in review):

| Step | Claim | State | Audit recommendation |
|------|-------|-------|---------------------|
| D-84M | "The UK government published Covid vaccine contract terms in 2021" | review | No action / keep in review — potentially factual, no reports, testability=75 |

Phase 3 is effectively complete after a D-84M disposition decision (even if that
decision is "take no action").

---

## D-84L Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-84K commit (ce3546c) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Target confirmed review state (report_count=2, never public) | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected, reportCount: 0 | ✅ |
| Post-verification queue state confirmed | ✅ |
| review count 3→2 confirmed | ✅ |
| rejected count 18→19 confirmed | ✅ |
| public count unchanged at 0 | ✅ |
| Seed claims unaffected | ✅ |
| D-84K/M targets in expected states confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D84L_REJECT_NEVER_TRUST_EXPERTS_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
