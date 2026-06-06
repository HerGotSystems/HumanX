# D-66: B-4 Smoking / Lung Cancer Source Research

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-65 specified direct official-source navigation targets for Batch B (B-4 smoking/lung
cancer, B-5 Holocaust). D-66 records the results of the B-4 source research pass.

**Result: two evidence slots VERIFIED.** Two official public health agency sources were
confirmed for the claim "Smoking tobacco causes lung cancer":

- CDC `cdc.gov` — VERIFIED
- NCI `cancer.gov` — VERIFIED
- HHS Surgeon General archive `hhs.gov` — CANDIDATE_FOUND (not yet VERIFIED for a specific slot)

No seed files were edited. No import route was called. No D1 or production mutation
occurred. These source records are ready to be transferred into the D-61 worksheet when
the full pack is assembled.

---

## 2. Claim Record

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-B4` |
| exact claim | Smoking tobacco causes lung cancer |
| D-55 short name | B-4 — Smoking causes lung cancer |
| category | Medicine / Public Health |
| type | Physical/Testable |
| status target | Proven |
| launch_blocker | yes — required before any apply call |

---

## 3. Accepted Source Records

### Source 1 — CDC: Smoking and Cancer

| Field | Value |
|-------|-------|
| candidate_url | https://www.cdc.gov/tobacco/campaign/tips/diseases/cancer.html |
| citation_title | Smoking and Cancer |
| publisher / source_owner | Centers for Disease Control and Prevention |
| source_domain | cdc.gov |
| source_class | Official public health agency |
| stance | support |
| quality | documented |
| reliability_score | 84 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | CDC states that smoking can cause cancer by weakening the immune system and damaging or changing cellular DNA. The agency further states that doctors have known for years that smoking causes most lung cancers, and that nearly 9 out of 10 lung cancer deaths are caused by cigarette smoking or secondhand smoke exposure. This is the position of the lead US federal public health authority. |
| pressure_note | None — this source supports the primary claim. |
| rejection_reason | N/A |
| citation_note | Verified from CDC page lines 54–60 in web fetch. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (cdc.gov) | ✅ |
| Author/institution/date visible | ✅ CDC attribution; page is part of the Tips From Former Smokers campaign |
| Content directly supports the specific claim | ✅ — "nearly 9 out of 10 lung cancer deaths" + causal mechanism |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality (target 60–75; CDC accepted at 84 as official agency primary guidance) | ✅ |

---

### Source 2 — NCI: Harms of Cigarette Smoking and Health Benefits of Quitting

| Field | Value |
|-------|-------|
| candidate_url | https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco/cessation-fact-sheet |
| citation_title | Harms of Cigarette Smoking and Health Benefits of Quitting |
| publisher / source_owner | National Cancer Institute |
| source_domain | cancer.gov |
| source_class | Official cancer institute / public health agency |
| stance | support |
| quality | documented |
| reliability_score | 86 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | NCI states that smokers' risk of developing lung cancer has increased relative to nonsmokers since the 1960s, and describes secondhand smoke as a known human carcinogen that causes lung cancer in nonsmoking adults. NCI further states there is no safe level of smoking and that even one cigarette per day over a lifetime can cause smoking-related cancers including lung cancer. This is the position of the US National Cancer Institute, the federal authority on cancer research. |
| pressure_note | The "no safe level" finding is useful context for the pressure point about individual vs. population-level risk. |
| rejection_reason | N/A |
| citation_note | Verified from NCI page lines 85–97 and 123–125 in web fetch. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (cancer.gov) | ✅ |
| Author/institution/date visible | ✅ NCI attribution; fact sheet format with citations |
| Content directly supports the specific claim | ✅ — lung cancer named explicitly; causal and dose-response language |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality | ✅ |

---

## 4. Candidate Source Record (Not Yet a Final Slot)

### Source 3 — HHS Surgeon General: Tobacco Reports and Publications

| Field | Value |
|-------|-------|
| candidate_url | https://www.hhs.gov/surgeongeneral/reports-and-publications/tobacco/index.html |
| citation_title | Tobacco Reports And Publications |
| publisher / source_owner | U.S. Department of Health and Human Services / Office of the Surgeon General |
| source_domain | hhs.gov |
| source_class | Official government report archive |
| stance | support / historical context |
| quality | documented |
| reliability_score_proposed | 80 |
| verification_status | **CANDIDATE_FOUND** |
| access_date | 2026-06-07 |
| support_summary | HHS page states that in 1964 a landmark Surgeon General report warned of the health hazards of smoking, and states today there is no safe level of exposure to tobacco smoke. The page provides an index to official Surgeon General tobacco reports. |
| limitation | This is an index/landing page rather than the specific 1964 report document itself. To upgrade to VERIFIED for a dedicated evidence slot, the researcher should navigate from this page to the specific 1964 "Smoking and Health" report PDF or its dedicated document page, confirm the page title, author, and year, and write an evidence body from the report's own content rather than the index page description. |
| pressure_note | The 1964 report is the historically significant "first official determination" milestone — valuable for historical-context evidence if slotted in separately from the CDC/NCI contemporary sources. |
| rejection_reason | Not VERIFIED for a final evidence slot at this stage — the index page rather than the specific document. |
| citation_note | Verified from HHS page lines 217–220 in web fetch. |

**Recommended next action for Source 3:**
Navigate from the HHS index page to the 1964 "Smoking and Health" report direct link.
Confirm the specific document page URL, title, and year. If the document is a PDF hosted
on hhs.gov or surgeongeneral.gov, record the PDF URL as the candidate_url. Once the
specific document page is confirmed, upgrade to `VERIFIED` and assign to B-4 Evidence
slot 2 (displacing or supplementing the NCI source, or treating as a third supporting
slot if the slot is available).

---

## 5. D-61 Worksheet Update

The following changes are ready to be applied to the D-61 worksheet fields when the
full pack is assembled into final seed JSON (D-68):

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-B4` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://www.cdc.gov/tobacco/campaign/tips/diseases/cancer.html |
| `launch-B4` slot 1 `citation_title` | (blank) | Smoking and Cancer |
| `launch-B4` slot 1 `source_domain` | (blank) | cdc.gov |
| `launch-B4` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-B4` slot 1 `evidence_body` | (placeholder) | (see Section 3 Source 1 evidence_body above) |
| `launch-B4` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-B4` slot 2 `candidate_url` | TODO_FIND_SOURCE | https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco/cessation-fact-sheet |
| `launch-B4` slot 2 `citation_title` | (blank) | Harms of Cigarette Smoking and Health Benefits of Quitting |
| `launch-B4` slot 2 `source_domain` | (blank) | cancer.gov |
| `launch-B4` slot 2 `access_date` | (blank) | 2026-06-07 |
| `launch-B4` slot 2 `evidence_body` | (placeholder) | (see Section 3 Source 2 evidence_body above) |
| `launch-B4` slot 2 `verification_status` | TODO_FIND_SOURCE | VERIFIED |

Note: The D-61 worksheet file itself is not edited in D-66. The worksheet update table
above records the intended changes. The worksheet and the D-57 JSON draft will be
updated together in the source insertion draft batch (D-68), once sufficient sources
are verified across the full launch pack.

---

## 6. D-62 Gate Delta — B-4 Only

| Hard blocker | D-65 state (B-4) | D-66 state (B-4) |
|-------------|-----------------|-----------------|
| HB-1 any TODO_FIND_SOURCE | ❌ Slots 1–3 all TODO | ✅ Slots 1 and 2 have VERIFIED URLs; slot 3 (Doll & Hill) still TODO_FIND_SOURCE |
| HB-2 any unverified | ❌ All unverified | ⚠️ Slots 1 and 2 VERIFIED; slot 3 still unverified |
| HB-3 SOURCE_NEEDED blocks apply | ❌ | ❌ Still blocks — other claims in pack not yet verified |
| HB-4 evidence_body missing | ❌ | ⚠️ Slots 1 and 2 have complete evidence_body text; slot 3 still draft |
| HB-5 reliability_score unconfirmed | ⚠️ | ✅ Slots 1 (84) and 2 (86) confirmed |
| HB-6 launch_blocker: true | ❌ | ⚠️ Partially resolved for B-4 — 2 of 3 required slots filled |

**B-4 status: partially cleared.** Two of three evidence slots are VERIFIED. Slot 3
(original Doll & Hill 1950 peer-reviewed study, or the specific HHS 1964 Surgeon General
report document) remains at CANDIDATE_FOUND/TODO_FIND_SOURCE. The overall D-62 gate
remains BLOCKED across the pack — B-4 is not the only claim requiring verification.

**Pressure source for B-4:** The pressure point ("not all smokers develop lung cancer —
population-level causation vs. individual certainty") is definitional/methodological.
No external URL is required for this pressure point — the body text can be written from
the same CDC and NCI sources above, which already address this nuance.

---

## 7. Rejected Sources (This Pass)

No sources were rejected in this pass. The three sources found were either VERIFIED or
CANDIDATE_FOUND. No Wikipedia pages, news articles, or mirrors were used.

---

## 8. Remaining B-4 Work

| Item | Status |
|------|--------|
| Evidence slot 1 (CDC) | ✅ VERIFIED |
| Evidence slot 2 (NCI) | ✅ VERIFIED |
| Evidence slot 3 (Doll & Hill original / HHS 1964 report specific document) | ⚠️ CANDIDATE_FOUND for HHS index; specific document page still needed |
| Pressure source | ✅ No external URL required — body text from CDC/NCI |
| D-61 worksheet fields updated (in doc) | ✅ — actual file update deferred to D-68 |

---

## 9. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated — all sourced from web fetch | ✅ Confirmed |

---

## D-66 Completion Record

| Item | Status |
|------|--------|
| Claim B-4 record documented | ✅ |
| Source 1 (CDC) — full citation record, VERIFIED | ✅ |
| Source 2 (NCI) — full citation record, VERIFIED | ✅ |
| Source 3 (HHS index) — citation record, CANDIDATE_FOUND | ✅ |
| D-63 acceptance test confirmed for Sources 1 and 2 | ✅ |
| D-61 worksheet update table recorded | ✅ |
| D-62 gate delta for B-4 documented | ✅ |
| Remaining B-4 work identified | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
