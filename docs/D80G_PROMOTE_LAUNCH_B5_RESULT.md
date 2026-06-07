# D-80G: Promote launch-B5 Result

Date: 2026-06-07
Step: D-80G — production promotion of launch-B5 Holocaust claim (final seed pack item)
Type: 3 targeted moderation calls (1 claim + 2 evidence). Docs-only commit to main.
No D1 direct commands. No Wrangler. No bulk promotion. No other items modified.

---

## 1. Explicit User Approval

D-80G was explicitly approved by the user in the same session as execution.
Approval scope: promote launch-B5 (`clm_seed_8e095b6f6d30`) claim and its 2 evidence
items to `review_state = 'public'` only.

This is the final seed pack promotion. No other items were approved for modification.
launch-D2, launch-A4, launch-A1, and launch-C1 were already public and were not touched.

---

## 2. Non-Scope Statement

| Rule | Status |
|------|--------|
| Only launch-B5 claim and its 2 evidence items promoted | ✅ Confirmed |
| No other item promoted or modified | ✅ Confirmed |
| launch-D2 not touched — already public, remains public | ✅ Confirmed |
| launch-A4 not touched — already public, remains public | ✅ Confirmed |
| launch-A1 not touched — already public, remains public | ✅ Confirmed |
| launch-C1 not touched — already public, remains public | ✅ Confirmed |
| No bulk promotion | ✅ Confirmed |
| No scripted promotion beyond 3 explicit target calls | ✅ Confirmed |
| No D1 direct commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No destructive moderation (no reject/archive) | ✅ Confirmed |
| Admin token not printed, logged, or committed | ✅ Confirmed |
| Temp curl output files deleted after reading | ✅ Confirmed |

---

## 3. Preflight — State Before Promotion

**git HEAD:** `9b10af8` — docs: record D-80F launch-C1 promotion ✅

**Read-only `GET /api/review` confirmed before any promotion:**

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| Claim id | `clm_seed_8e095b6f6d30` | `clm_seed_8e095b6f6d30` | ✅ |
| user_id | `usr_seed_system` | `usr_seed_system` | ✅ |
| review_state | `review` | `review` | ✅ |
| status | `Proven` | `Proven` | ✅ |
| status guard | must be `Proven` | confirmed `Proven` | ✅ |
| Claim text (exact) | The Holocaust resulted in the murder of approximately six million Jews | exact match | ✅ |
| Evidence count | 2 | 2 | ✅ |
| Wannsee source URL | `https://avalon.law.yale.edu/imt/wannsee.asp` | exact match | ✅ |
| USHMM victim numbers URL | `https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution` | exact match | ✅ |
| launch-D2 not in queue | Not in queue | Not in queue | ✅ |
| launch-A4 not in queue | Not in queue | Not in queue | ✅ |
| launch-A1 not in queue | Not in queue | Not in queue | ✅ |
| launch-C1 not in queue | Not in queue | Not in queue | ✅ |

All preflight checks passed. Promotion proceeded.

**Note on pressure:** The `/api/review` response did not include a top-level `pressure`
field. Pressure items have no `review_state` column and become visible once the parent
claim is public. The seed data included 1 pressure item for launch-B5:
"Antisemitism: An Introduction" (USHMM Encyclopedia — `https://encyclopedia.ushmm.org/content/en/article/antisemitism`).
This pressure point addresses Holocaust denial and distortion as a form of antisemitism.
The `contradictions: 1` field in the claim promotion response confirms it is now visible.

---

## 4. Target Claim Details

| Field | Value |
|-------|-------|
| seed_id | `launch-B5` |
| DB claim id | `clm_seed_8e095b6f6d30` |
| claim text | The Holocaust resulted in the murder of approximately six million Jews |
| status (stored) | Proven |
| category | History / Public Record |
| type | Historical/Physical |
| user_id | usr_seed_system |
| review_state before | `review` |
| review_state after | `public` |

---

## 5. Evidence IDs Discovered and Promoted

| # | Evidence id | Title | Source URL | review_state before | review_state after | reliability_score |
|---|------------|-------|-----------|--------------------|--------------------|-------------------|
| 1 | `evd_4dadaaf88e1a42` | Wannsee Protocol | https://avalon.law.yale.edu/imt/wannsee.asp | `review` | `public` | 85 |
| 2 | `evd_acb865805d4a4a` | How Many People did the Nazis Murder? | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution | `review` | `public` | 82 |

---

## 6. POST Calls Made

Exactly 3 calls. No other POST calls made.

**Call 1 — Claim promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"claim","targetId":"clm_seed_8e095b6f6d30","decision":"public"}
```

**Call 2 — Wannsee Protocol evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_4dadaaf88e1a42","decision":"public"}
```

**Call 3 — USHMM victim numbers evidence promotion:**
```
POST https://humanx.rinkimirikata.com/api/review/decision
Body: {"targetType":"evidence","targetId":"evd_acb865805d4a4a","decision":"public"}
```

---

## 7. Response Summary — All 3 Calls

### Call 1 — Claim (clm_seed_8e095b6f6d30)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"claim"` |
| decision | `"public"` |
| item.id | `clm_seed_8e095b6f6d30` |
| item.reviewState | `"public"` |
| item.status | `"Proven"` |
| item.category | `"History / Public Record"` |
| item.type | `"Historical/Physical"` |
| item.reportCount | `0` |
| item.contradictions | `1` (USHMM antisemitism pressure point now visible — expected) |
| item.handle | `"humanx-seed"` |

Full response:
```json
{
  "ok": true,
  "targetType": "claim",
  "decision": "public",
  "item": {
    "id": "clm_seed_8e095b6f6d30",
    "claim": "The Holocaust resulted in the murder of approximately six million Jews",
    "category": "History / Public Record",
    "type": "Historical/Physical",
    "status": "Proven",
    "survivability": null,
    "testability": null,
    "contradictions": 1,
    "reportCount": 0,
    "reviewState": "public",
    "beliefYes": 0,
    "beliefNo": 0,
    "uncertainty": 0,
    "createdAt": 1780834993780,
    "updatedAt": 1780839271400,
    "handle": "humanx-seed",
    "nearDuplicateOf": null,
    "duplicateOf": null
  }
}
```

---

### Call 2 — Evidence evd_4dadaaf88e1a42 (Wannsee Protocol — Yale Avalon)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_4dadaaf88e1a42` |
| item.review_state | `"public"` |
| item.reliability_score | `85` |
| item.report_count | `0` |

---

### Call 3 — Evidence evd_acb865805d4a4a (USHMM — How Many People did the Nazis Murder?)

| Field | Value |
|-------|-------|
| ok | `true` |
| targetType | `"evidence"` |
| decision | `"public"` |
| item.id | `evd_acb865805d4a4a` |
| item.review_state | `"public"` |
| item.reliability_score | `82` |
| item.report_count | `0` |

---

## 8. Post-Promotion Verification

### 8.1 — Review Queue (`GET /api/review`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-B5 claim in review queue | No | Not found | ✅ |
| launch-B5 evidence in review queue | No | 0 items | ✅ |
| launch-D2 in review queue | No (already public) | Not found | ✅ |
| launch-A4 in review queue | No (already public) | Not found | ✅ |
| launch-A1 in review queue | No (already public) | Not found | ✅ |
| launch-C1 in review queue | No (already public) | Not found | ✅ |
| Any seed claim remaining in review queue | No | None found | ✅ |
| Total claims in queue | 21 (22 minus 1 promoted) | 21 | ✅ |

### 8.2 — Public Claims Feed (`GET /api/claims`)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| launch-B5 in public feed | Yes | Yes — public | ✅ |
| launch-B5 claim text | exact | exact match | ✅ |
| launch-D2 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-A4 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-A1 in public feed | Yes (was already public) | Yes — public | ✅ |
| launch-C1 in public feed | Yes (was already public) | Yes — public | ✅ |
| Total public claims | 27 | 27 | ✅ |

**All 5 launch seed claims are now public. No seed claims remain at review_state='review'.**

### 8.3 — Status Recalculation Observation

The claim promotion response returned `item.status: "Proven"` — matching the stored seed
value and the intended status for a historically documented claim backed by the Nuremberg
prosecution evidence record (Wannsee Protocol, Yale Avalon) and USHMM encyclopedic
documentation. Evidence reliability scores are 85 (Wannsee Protocol) and 82 (USHMM).
`recalcClaimScore` triggers on evidence promotion. The stored and displayed status
`"Proven"` is appropriate and defensible for this category (`Historical/Physical`).

---

## 9. Issues

**None.** All 3 calls returned `ok: true`. All checks passed. No stop conditions triggered.
`contradictions: 1` is expected — the USHMM antisemitism/denial pressure point is now
visible, providing direct educational context on Holocaust denial as a form of antisemitism.

---

## 10. Completion

**D-80G is complete. The launch seed pack is fully public.**

| Claim | DB id | Status | Public |
|-------|-------|--------|--------|
| launch-D2 — Sleep deprivation | `clm_seed_7fb1c24747c2` | Proven | ✅ |
| launch-A4 — CO2/climate | `clm_seed_c4e0335e7aae` | Proven | ✅ |
| launch-A1 — MMR/autism | `clm_seed_55e17c22e13e` | Strongly Supported | ✅ |
| launch-C1 — Platform recommendation systems | `clm_seed_8ad9ff121579` | Plausible | ✅ |
| launch-B5 — Holocaust | `clm_seed_8e095b6f6d30` | Proven | ✅ |

All 10 associated evidence items are public.
All 4 pressure points (1 per claim for A4, A1, C1, B5) are visible on their parent claims.
No seed claim remains at `review_state = 'review'`.
No further seed-pack promotion is pending.

---

## D-80G Completion Record

| Item | Status |
|------|--------|
| Explicit same-session user approval confirmed | ✅ |
| git HEAD confirmed at D-80F commit (9b10af8) | ✅ |
| Preflight GET /api/review — all checks passed including status guard (Proven) | ✅ |
| Claim id, user_id, review_state, status, text confirmed | ✅ |
| Evidence count confirmed: 2 | ✅ |
| Evidence source URLs confirmed — Wannsee (Yale Avalon) and USHMM both match | ✅ |
| Evidence IDs recorded: evd_4dadaaf88e1a42, evd_acb865805d4a4a | ✅ |
| Other 4 seed claims confirmed NOT in review queue (already public) | ✅ |
| POST claim promotion — HTTP 200, ok: true, reviewState: public | ✅ |
| POST evidence 1 (Wannsee) — HTTP 200, ok: true, review_state: public | ✅ |
| POST evidence 2 (USHMM) — HTTP 200, ok: true, review_state: public | ✅ |
| Exactly 3 POST calls made — no extras | ✅ |
| Post-promotion GET /api/review — B5 not in queue, no seed claims in queue | ✅ |
| Post-promotion GET /api/claims — all 5 seed claims public | ✅ |
| launch-D2/A4/A1/C1 all unchanged — remain public | ✅ |
| No other item promoted or modified | ✅ |
| No D1 direct commands | ✅ |
| No Wrangler | ✅ |
| No bulk promotion | ✅ |
| Temp files deleted | ✅ |
| docs/D80G_PROMOTE_LAUNCH_B5_RESULT.md created | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Docs committed to main | ✅ |
