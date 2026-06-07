# D-84I: Reject "DOCTRINE" — Result

Date: 2026-06-07
Step: D-84I — seventh per-item cleanup action, reject clm_3905faadfa9c47159e
Type: Single moderation POST. Docs-only commit to main.
No D1. No Wrangler. No archive route. No other moderation action.

---

## 1. Explicit Approval

D-84I was explicitly approved by the user in the same session.
Approved scope: reject exactly one claim — `clm_3905faadfa9c47159e` ("DOCTRINE").

---

## 2. Target Details

| Field | Value |
|-------|-------|
| id | `clm_3905faadfa9c47159e` |
| Claim text | DOCTRINE |
| user handle | `anon-xksavy` (`usr_3c204c78f6fa49bfad`) |
| Category | WHAT IT CAN BE |
| Type | Truth-Derived |
| status | Proven |
| evidence_score | 85 |
| review_state (pre) | `public` (visible to all users) |
| report_count (pre) | 1 (report reason: `3`) |
| Reason for rejection | Single all-caps word, not a falsifiable factual claim; category is itself nonsensical ("WHAT IT CAN BE"); reported by a user; from test/dev account; Phase 2 public junk removal |

---

## 3. Preflight State (before POST)

Confirmed via `GET /api/review`:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| id present in queue | Yes | Yes | ✅ |
| claim text | "DOCTRINE" | "DOCTRINE" | ✅ |
| review_state | `public` | `public` | ✅ |
| report_count | 1 | 1 | ✅ |
| handle | test/dev account | `usr_3c204c78f6fa49bfad` | ✅ |
| queue by state (pre) | rejected:16, public:3, review:2 | rejected:16, public:3, review:2 | ✅ |
| seed claims in queue | 0 | 0 | ✅ |

All preflight checks passed. POST executed.

---

## 4. POST Executed

Exactly one POST call:

```
POST https://humanx.rinkimirikata.com/api/review/decision
Content-Type: application/json
x-humanx-admin: [redacted]

{"targetType":"claim","targetId":"clm_3905faadfa9c47159e","decision":"rejected"}
```

---

## 5. POST Response

```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "rejected",
  "item": {
    "id": "clm_3905faadfa9c47159e",
    "claim": "DOCTRINE",
    "category": "WHAT IT CAN BE",
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
    "createdAt": 1780413440639,
    "updatedAt": 1780848655904,
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
| item.id | clm_3905faadfa9c47159e | ✅ |
| item.claim | DOCTRINE | ✅ |

---

## 6. Post-Moderation Verification

Confirmed via `GET /api/review` after POST:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Target `review_state` | `rejected` | `rejected` | ✅ |
| Target `report_count` | 0 | 0 | ✅ |
| Total claims in queue | 21 (unchanged — rejected items remain in queue view) | 21 | ✅ |
| Queue by state: rejected | 17 (was 16 + this item) | 17 | ✅ |
| Queue by state: public | 2 (was 3 − this item, removed from public feed) | 2 | ✅ |
| Queue by state: review | 2 (unchanged) | 2 | ✅ |
| Seed claims in queue | 0 | 0 | ✅ |

**Remaining public non-seed claims (2):**
- `clm_eec72f024040428190` — "Children should always obey adults" (state: public) — Phase 3 judgment call
- `clm_af8da34be53b40f395` — "Hard work always pays off" (state: public) — Phase 3 judgment call

**Remaining review-state non-seed claims (2):**
- `clm_ae59b53d5f4249f0b4` — "Never trust the experts" (state: review) — Phase 3 judgment call
- `clm_13afcc7128054661a3` — "The UK government published Covid vaccine contract terms in 2021" (state: review) — Phase 3 judgment call

---

## 7. Phase 2 Complete

All 3 Phase 2 (public junk) items from D-84B plan are now rejected:

| Step | Claim | Was public | Status |
|------|-------|-----------|--------|
| D-84G | "EVERYBODY IS IDIOT" | Yes | ✅ rejected |
| D-84H | "PEOPLE ARE STUPID" | Yes | ✅ rejected |
| D-84I | "DOCTRINE" | Yes | ✅ rejected (this doc) |

**The public feed now contains only the 5 launch seed claims + any other legitimate public content.**
Non-seed public count reduced from 5 → 2 over Phase 2 (D-84G/H/I removed 3; 2 judgment-call items remain public pending Phase 3 decisions).

---

## 8. Non-Scope Confirmations

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

## 9. Gate — Phase 3

Phase 3 items are judgment calls requiring individual human decisions. Each requires explicit per-item approval. None has been prejudged here.

| Item | Claim | State | Notes |
|------|-------|-------|-------|
| D-84J | "Children should always obey adults" | public, report_count=1 | Contentious social norm claim; not clearly invalid |
| D-84K | "Hard work always pays off" | public, report_count=1 | Common proverb; debatable; report reason unhelpful |
| D-84L | "Never trust the experts" | review, report_count=2 | Anti-expertise framing; `status=Proven` scoring error |
| D-84M | "The UK government published Covid vaccine contract terms in 2021" | review | Potentially factual; needs care |

---

## D-84I Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-84H commit (312bc5a) | ✅ |
| Preflight GET /api/review — all checks passed | ✅ |
| Target confirmed public (review_state=public, report_count=1) | ✅ |
| Exactly 1 POST call made | ✅ |
| POST returned ok: true, reviewState: rejected, reportCount: 0 | ✅ |
| Post-verification queue state confirmed | ✅ |
| public count 3→2 confirmed (removed from public feed) | ✅ |
| rejected count 16→17 confirmed | ✅ |
| review count unchanged at 2 | ✅ |
| Seed claims unaffected | ✅ |
| Phase 2 of D-84B plan fully complete | ✅ |
| No archive route called | ✅ |
| No D1 | ✅ |
| No Wrangler | ✅ |
| Temp files deleted | ✅ |
| docs/D84I_REJECT_DOCTRINE_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
