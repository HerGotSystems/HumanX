# D-76B: ChatGPT Seed Review Decisions

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called. No executable JSON files created. No data/seed_claims_v2.json created.

---

## 1. Summary

ChatGPT reviewed `docs/D76A_CHATGPT_REVIEW_PACKET.md` and returned decisions for all
5 READY claims. This document records those decisions verbatim.

**Gate status after D-76B: BLOCKED**

| Decision | Count |
|----------|-------|
| APPROVE_FOR_D76 | 3 / 5 |
| NEEDS_EDIT | 2 / 5 |
| EXCLUDE_FROM_V1 | 0 / 5 |
| HOLD_FOR_MORE_SOURCES | 0 / 5 |

`data/seed_claims_v2.json` must NOT be created until A-1 and C-1 edits are applied and
re-reviewed. The gate requires all 5 claims to carry APPROVE_FOR_D76.

**Next step:** D-76C — apply A-1 and C-1 edits to the source insertion draft (docs-only);
re-review; advance to D-77 executable JSON only once all 5 are approved.

---

## 2. Decisions — Claim by Claim

---

### 2.1 — B-5: Holocaust (`launch-B5`)

| Field | Value |
|-------|-------|
| claim_overbroad | no |
| source_match | yes |
| evidence_body_accuracy | yes |
| reliability_score_ok | yes |
| pressure_fair | yes |
| test_safe | N/A |
| launch_risk_ok | yes — sensitive but factual/public-record framing is controlled |
| **decision** | **APPROVE_FOR_D76** |

**reviewer_notes:**
Strong launch candidate. Keep neutral wording and avoid performative denial framing.

**Gate contribution:** ✅ Approved. No edits required.

---

### 2.2 — A-1: MMR Vaccine / Autism (`launch-A1`)

| Field | Value |
|-------|-------|
| claim_overbroad | yes — current wording is too absolute for launch context |
| source_match | yes |
| evidence_body_accuracy | yes |
| reliability_score_ok | yes |
| pressure_fair | yes |
| test_safe | N/A |
| launch_risk_ok | conditional |
| **decision** | **NEEDS_EDIT** |

**reviewer_notes:**
Change claim text to:
> "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism."

Change status from `Proven` to `Strongly Supported`.

**Gate contribution:** ❌ Blocked. Two edits required before re-review:
1. Claim text — rephrase from absolute negation to evidence-based framing
2. Status label — `Proven` → `Strongly Supported`

**Edit scope:**
- `"claim"` field only — no source URLs change, no evidence bodies change, no pressure changes
- `"status"` field only — one value change
- All VERIFIED source records remain unchanged

---

### 2.3 — A-4: CO₂ / Climate (`launch-A4`)

| Field | Value |
|-------|-------|
| claim_overbroad | no |
| source_match | yes |
| evidence_body_accuracy | yes |
| reliability_score_ok | yes |
| pressure_fair | yes |
| test_safe | N/A |
| launch_risk_ok | yes |
| **decision** | **APPROVE_FOR_D76** |

**reviewer_notes:**
Strong launch candidate. Dual-use IPCC source is acceptable because evidence and pressure
angles are distinct.

**Gate contribution:** ✅ Approved. No edits required.

---

### 2.4 — C-1: Social Media Algorithms (`launch-C1`)

| Field | Value |
|-------|-------|
| claim_overbroad | yes — too broad across platforms and algorithm types |
| source_match | partial |
| evidence_body_accuracy | yes |
| reliability_score_ok | yes |
| pressure_fair | yes |
| test_safe | N/A |
| launch_risk_ok | conditional |
| **decision** | **NEEDS_EDIT** |

**reviewer_notes:**
Narrow claim text to:
> "Online platform recommendation systems can use engagement signals that influence which information spreads widely."

Keep `Plausible` status.

**Gate contribution:** ❌ Blocked. One edit required before re-review:
1. Claim text — narrow from "social media algorithms" (implies all platforms, all algorithm
   types) to "online platform recommendation systems" (narrower and more accurate)

**Edit scope:**
- `"claim"` field only — no source URLs change, no evidence bodies change, no pressure
  changes, no status change
- `"status"` remains `Plausible` — no change needed

---

### 2.5 — D-2: Sleep Deprivation (`launch-D2`)

| Field | Value |
|-------|-------|
| claim_overbroad | no |
| source_match | yes |
| evidence_body_accuracy | yes |
| reliability_score_ok | yes |
| pressure_fair | N/A |
| test_safe | N/A |
| launch_risk_ok | yes |
| **decision** | **APPROVE_FOR_D76** |

**reviewer_notes:**
Strong, low-risk launch candidate. No pressure source required because the underestimation
caveat is embedded in the primary evidence.

**Gate contribution:** ✅ Approved. No edits required.

---

## 3. Required Edits Before Re-Review

| Claim | seed_id | Edit type | Current value | Required value |
|-------|---------|-----------|--------------|----------------|
| A-1 MMR vaccine / autism | `launch-A1` | Claim text | "The MMR vaccine does not cause autism" | "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism." |
| A-1 MMR vaccine / autism | `launch-A1` | Status | `Proven` | `Strongly Supported` |
| C-1 Social media algorithms | `launch-C1` | Claim text | "Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely" | "Online platform recommendation systems can use engagement signals that influence which information spreads widely." |

**No other fields change.** All source URLs, evidence bodies, pressure bodies, reliability
scores, categories, types, and review_state_intended values remain as drafted in D-74.

---

## 4. Gate Status After D-76B

| Criterion (from D-75 Section 6) | Status |
|---------------------------------|--------|
| 1. All 5 READY claims carry APPROVE_FOR_D76 | ❌ — 3/5 approved; A-1 and C-1 pending edits |
| 2. NEEDS_EDIT items resolved | ❌ — 2 edits outstanding (A-1 claim/status, C-1 claim) |
| 3. PARTIAL promotions recorded | ✅ — no PARTIAL claims being promoted |
| 4. Source URLs copied exactly from D-74 | ✅ — no URL changes required by edits |
| 5. No SOURCE_NEEDED placeholders | ✅ — no placeholder changes required |
| 6. D-59 guard on main | ✅ — PR #101 confirmed; static checks 119/24/39 |
| 7. No import route in JSON-creation step | ✅ |
| 8. No D1 in JSON-creation step | ✅ |
| 9. Branch + PR for JSON file | ✅ |

**Gate clears when criteria 1 and 2 are satisfied — i.e., after D-76C applies and
re-reviews the two NEEDS_EDIT claims.**

---

## 5. Approved Claims — Final Confirmed Values

These 3 claims are APPROVED as drafted in D-74. Their values are locked — no further
edits allowed without a new review cycle.

### B-5 Holocaust — APPROVED

```
seed_id:   "launch-B5"
claim:     "The Holocaust resulted in the murder of approximately six million Jews"
category:  "History / Public Record"
type:      "Historical/Physical"
status:    "Proven"
evidence:  2 items (Wannsee Protocol; USHMM victim count)
pressure:  1 item (USHMM antisemitism/denial)
```

### A-4 CO₂ / Climate — APPROVED

```
seed_id:   "launch-A4"
claim:     "Rising CO2 levels from human activity are the primary driver of observed global warming"
category:  "Science / Physical World"
type:      "Physical/Testable"
status:    "Proven"
evidence:  2 items (IPCC AR6 SPM; NASA causes)
pressure:  1 item (IPCC AR6 SPM attribution angle)
```

### D-2 Sleep Deprivation — APPROVED

```
seed_id:   "launch-D2"
claim:     "Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy"
category:  "Human Behaviour / Biology"
type:      "Physical/Testable"
status:    "Proven"
evidence:  2 items (Van Dongen 2003; CDC About Sleep)
pressure:  [] (none required)
```

---

## 6. NEEDS_EDIT Claims — Pending Values After D-76C

These are the target values D-76C must produce. D-76C is a docs-only edit to
`docs/D74_SOURCE_INSERTION_DRAFT.md` or a new D-74B equivalent. No executable file
is created in D-76C.

### A-1 MMR Vaccine / Autism — NEEDS_EDIT

| Field | D-74 value | Required after D-76C |
|-------|-----------|---------------------|
| claim | "The MMR vaccine does not cause autism" | "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism." |
| status | "Proven" | "Strongly Supported" |
| All other fields | (unchanged) | (unchanged) |

### C-1 Social Media Algorithms — NEEDS_EDIT

| Field | D-74 value | Required after D-76C |
|-------|-----------|---------------------|
| claim | "Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely" | "Online platform recommendation systems can use engagement signals that influence which information spreads widely." |
| All other fields | (unchanged) | (unchanged) |

---

## 7. Next Steps

| Step | Task | Prerequisite |
|------|------|-------------|
| D-76C | Docs-only edit: update A-1 and C-1 claim fields in source insertion draft; create `docs/D76C_EDITED_CLAIMS_DRAFT.md` | D-76B (this document) |
| D-76C re-review | Confirm edited A-1 and C-1 objects are correct; record APPROVE_FOR_D76 for both | D-76C |
| D-77 | Branch + PR: create `data/seed_claims_v2.json` for all 5 READY claims | All 5 APPROVE_FOR_D76 |
| D-78 | `GET /api/import-seed?mode=dry-run` — review structured report | D-77 PR merged; explicit per-session approval |
| D-79 | `GET /api/import-seed?mode=apply` | D-78 dry-run reviewed; explicit per-session D1/write approval |

---

## 8. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No data/seed_claims_v2.json created | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| Decisions recorded verbatim from reviewer | ✅ Confirmed |
| No APPROVE_FOR_D76 pre-filled for NEEDS_EDIT claims | ✅ Confirmed |
| Gate remains BLOCKED | ✅ Confirmed |

---

## D-76B Completion Record

| Item | Status |
|------|--------|
| All 5 claim decisions recorded verbatim | ✅ |
| 3 APPROVE_FOR_D76 claims confirmed with locked values | ✅ |
| 2 NEEDS_EDIT claims documented with exact required edits | ✅ |
| Gate criterion table updated | ✅ — criteria 1 and 2 still blocking |
| Next step (D-76C) defined with scope | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
