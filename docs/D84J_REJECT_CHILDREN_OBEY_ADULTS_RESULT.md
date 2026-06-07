# D-84J: Reject "Children should always obey adults" — Result

Date: 2026-06-07
Step: D-84J — eighth per-item cleanup action, reject clm_eec72f024040428190
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-84J was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_eec72f024040428190`
("Children should always obey adults").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_eec72f024040428190` |
| Claim text | Children should always obey adults |
| user handle | `anon-xksavy` (`usr_3c204c78f6fa49bfad`) |
| Category | family |
| Type | Truth-Derived |
| status | Proven (scoring artifact — see D-84J-AUDIT) |
| evidence_score | 85 |
| review_state (pre) | `public` (visible to all users) |
| report_count (pre) | 1 (report reason: `2`) |
| Reason for rejection | Prescriptive absolute ("always obey") not a well-formed testable factual claim; status=Proven is scoring artifact from test/dev account; reported; submitted in same junk-batch period as "EVERYBODY IS IDIOT" and "PEOPLE ARE STUPID"; fully analysed in D-84J-AUDIT |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in queue | Yes | Yes | ✅ |
| claim text | "Children should always obey adults" | "Children should always obey adults" | ✅ |
| review_state | `public` | `public` | ✅ |
| report_count | 1 | 1 | ✅ |
| handle | test/dev account | `usr_3c204c78f6fa49bfad` | ✅ |
| queue by state (pre) | rejected:17, public:2, review:2 | rejected:17, public:2, review:2 | ✅ |
| seed claims in queue | 0 | 0 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"clm_eec72f024040428190","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_eec72f024040428190",
    "claim": "Children should always obey adults",
    "category": "family",
    "type": "Truth-Derived",
    "status": "Proven",
    "evidenceScore": 85,
    "survivability": 94,
    "testability": 50,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "rejected",
    "beliefYes": 1,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780391966515,
    "updatedAt": 1780853369772,
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
| item.id | clm_eec72f024040428190 | ✅ |
| item.claim | Children should always obey adults | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target `review_state` | `rejected` | `rejected` | ✅ |
| Target `report_count` | 0 | 0 | ✅ |
| Total claims in queue | 21 (unchanged — rejected items remain in queue view) | 21 | ✅ |
| Queue by state: rejected | 18 (was 17 + this item) | 18 | ✅ |
| Queue by state: public | 1 (was 2 − this item, removed from public feed) | 1 | ✅ |
| Queue by state: review | 2 (unchanged) | 2 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |
| D-84K (`clm_af8da34be53b40f395`) | public | public | ✅ |
| D-84L (`clm_ae59b53d5f4249f0b4`) | review | review | ✅ |
| D-84M (`clm_13afcc7128054661a3`) | review | review | ✅ |

**Public feed now contains:**
- 5 launch seed claims (editorial, sourced)
- 1 remaining non-seed public item: `clm_af8da34be53b40f395` ("Hard work always pays off")

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
| Seed claims unchanged | ✅ |
| Admin token not printed or committed | ✅ |
| Temp files deleted after reading | ✅ |

---

## 8. Remaining Phase 3 Items

| Step | Claim | State | Audit recommendation | Approval needed |
|------|-------|-------|---------------------|-----------------|
| D-84K | "Hard work always pays off" | public | Return to review (or keep public) | ✅ per item |
| D-84L | "Never trust the experts" | review | Reject (Proven scoring artifact, 2 reports) | ✅ per item |
| D-84M | "UK government Covid vaccine contracts" | review | No action / keep in review | ✅ per item |

---

## D-84J Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-84J-AUDIT commit (955c3bd) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Target confirmed public (review_state=public, report_count=1) | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected, reportCount: 0 | ✅ |
| Post-verification queue state confirmed | ✅ |
| public count 2→1 confirmed (removed from public feed) | ✅ |
| rejected count 17→18 confirmed | ✅ |
| review count unchanged at 2 | ✅ |
| Seed claims unaffected | ✅ |
| D-84K/L/M targets in expected states confirmed | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D84J_REJECT_CHILDREN_OBEY_ADULTS_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
