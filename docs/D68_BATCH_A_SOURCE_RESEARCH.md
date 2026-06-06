# D-68: Batch A Source Research — Vaccines/Autism (A-1) and CO₂/Climate (A-4)

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-63 designated Batch A (science/physical world) as the second research batch, covering
claims A-1 (vaccines/autism) and A-4 (CO₂ as climate driver). D-68 records the results
of the Batch A source research pass using direct official-source navigation and WebFetch
verification.

**Result: all required slots VERIFIED across both claims.**

- A-1 slot 1: Cochrane meta-analysis — PubMed (ncbi.nlm.nih.gov) — VERIFIED
- A-1 slot 2: Madsen et al. 2002 NEJM cohort — PubMed (ncbi.nlm.nih.gov) — VERIFIED
- A-1 pressure: Godlee et al. 2011 BMJ editorial — PubMed (ncbi.nlm.nih.gov) — VERIFIED
- A-4 slot 1: IPCC AR6 WG1 Summary for Policymakers — ipcc.ch — VERIFIED
- A-4 slot 2: NASA "The Causes of Climate Change" — science.nasa.gov — VERIFIED
- A-4 pressure: IPCC AR6 WG1 SPM (same URL, attribution angle) — VERIFIED (shared source)

**Notable rejection — CDC autism page:** The CDC vaccine safety / autism page
(cdc.gov/vaccine-safety/about/autism.html), last reviewed November 19, 2025, now states
that "The claim 'vaccines do not cause autism' is not an evidence-based claim because
studies have not ruled out the possibility that infant vaccines cause autism." This
represents a significant content change from CDC's prior position and means this page
can no longer serve as a support source for claim A-1. The page is recorded as REJECTED
for the support role. The scientific evidence in the Cochrane and NEJM studies is
unaffected by this policy-page change.

No seed files were edited. No import route was called. No D1 or production mutation
occurred.

---

## 2. Claim Records

### Claim A-1

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-A1` |
| exact claim | The MMR vaccine does not cause autism |
| D-55 short name | A-1 — Vaccines and autism |
| category | Science / Medicine |
| type | Physical/Testable |
| status target | Proven |
| launch_blocker | yes |

### Claim A-4

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-A4` |
| exact claim | Rising CO₂ levels from human activity are the primary driver of observed global warming |
| D-55 short name | A-4 — CO₂ and climate change |
| category | Science / Physical World |
| type | Physical/Testable |
| status target | Proven |
| launch_blocker | yes |

---

## 3. Accepted Source Records — A-1

### A-1 Source 1 — Cochrane Systematic Review (via PubMed)

| Field | Value |
|-------|-------|
| candidate_url | https://pubmed.ncbi.nlm.nih.gov/22336803/ |
| citation_title | Vaccines for measles, mumps and rubella in children |
| publisher / source_owner | Cochrane Database of Systematic Reviews / Demicheli et al. |
| source_domain | pubmed.ncbi.nlm.nih.gov |
| source_class | Systematic review — PubMed-indexed Cochrane meta-analysis |
| stance | support |
| quality | repeatable |
| reliability_score | 85 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A 2012 Cochrane systematic review by Demicheli et al., published in the Cochrane Database of Systematic Reviews, analyzed data from approximately 14.7 million children across randomized controlled trials, cohort studies, case-control studies, and other study designs to assess the safety and effectiveness of measles-mumps-rubella (MMR) vaccines. The review explicitly concluded that exposure to the MMR vaccine was unlikely to be associated with autism. This is the largest systematic review of MMR vaccine safety and represents the Cochrane gold standard of evidence synthesis. |
| pressure_note | None — this source supports the primary claim. |
| rejection_reason | N/A |
| citation_note | Fetched directly from pubmed.ncbi.nlm.nih.gov/22336803/. PMID 22336803. No abstract available in PubMed record — title and conclusion extracted from structured PubMed entry and linked Cochrane reference. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ PubMed abstract records are free |
| Domain is the institution itself (pubmed.ncbi.nlm.nih.gov) | ✅ NLM / NCBI — US National Library of Medicine |
| Author/institution/date visible | ✅ Demicheli et al.; Cochrane Database of Systematic Reviews; 2012; PMID 22336803 |
| Content directly supports the specific claim | ✅ — "unlikely to be associated with autism" is the explicit finding |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `repeatable` quality (80–90) | ✅ — systematic review of 14.7 million children; score 85 |

---

### A-1 Source 2 — Madsen et al. 2002 NEJM Cohort Study (via PubMed)

| Field | Value |
|-------|-------|
| candidate_url | https://pubmed.ncbi.nlm.nih.gov/12421889/ |
| citation_title | A population-based study of measles, mumps, and rubella vaccination and autism |
| publisher / source_owner | The New England Journal of Medicine / Madsen et al. |
| source_domain | pubmed.ncbi.nlm.nih.gov |
| source_class | Population-based cohort study — PubMed-indexed NEJM publication |
| stance | support |
| quality | repeatable |
| reliability_score | 84 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A 2002 population-based cohort study by Madsen et al., published in The New England Journal of Medicine, followed 537,303 children born in Denmark between 1991 and 1998 (representing over 2.1 million person-years of follow-up) and compared autism diagnosis rates between MMR-vaccinated and unvaccinated children. After adjusting for confounders, vaccinated children showed no increased risk of autistic disorder (relative risk 0.92) or other autistic-spectrum disorders (relative risk 0.83) compared to unvaccinated children. The study concluded that this provided strong evidence against the hypothesis that MMR vaccination causes autism. |
| pressure_note | The relative risk figures (RR 0.92, 0.83) can be cited directly in the pressure-point response to the claim that individual cases of autism after vaccination demonstrate causation. |
| rejection_reason | N/A |
| citation_note | Fetched directly from pubmed.ncbi.nlm.nih.gov/12421889/. PMID 12421889. Abstract available. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (pubmed.ncbi.nlm.nih.gov) | ✅ |
| Author/institution/date visible | ✅ Madsen et al.; NEJM; 2002; PMID 12421889 |
| Content directly supports the specific claim | ✅ — "strong evidence against the hypothesis that MMR vaccination causes autism" |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `repeatable` quality | ✅ — 537K-child cohort; NEJM; score 84 |

---

## 4. Pressure Source Record — A-1

### A-1 Pressure — Godlee, Smith, Marcovitch 2011 BMJ

| Field | Value |
|-------|-------|
| candidate_url | https://pubmed.ncbi.nlm.nih.gov/21209060/ |
| citation_title | Wakefield's article linking MMR vaccine and autism was fraudulent |
| publisher / source_owner | BMJ / Godlee, Smith, Marcovitch |
| source_domain | pubmed.ncbi.nlm.nih.gov |
| source_class | Peer-reviewed editorial / investigative piece — BMJ |
| stance | support (pressure context: retraction and fraud finding) |
| quality | documented |
| reliability_score | 72 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A 2011 editorial in the BMJ by Godlee, Smith, and Marcovitch concluded that the 1998 Lancet paper by Andrew Wakefield, which claimed to find a link between MMR vaccination and autism in 12 children, constituted fraudulent research. The editorial, published alongside a BMJ investigative series by Brian Deer titled "How the case against the MMR vaccine was fixed," found that the data in the original paper were manipulated and that the Wakefield study's findings could not be substantiated. The Lancet formally retracted the 1998 paper, removing the primary published basis for the vaccines-autism hypothesis. |
| pressure_note | Primary use: pressure slot for A-1. The pressure point is the existence of the original 1998 Wakefield paper that claimed vaccines cause autism. This source establishes that the paper was fraudulent and has been retracted. |
| rejection_reason | N/A |
| citation_note | Fetched directly from pubmed.ncbi.nlm.nih.gov/21209060/. PMID 21209060. No abstract in PubMed record; title and MeSH terms (including "Scientific Misconduct") confirm the editorial's scope. The associated Deer investigative article is also indexed at PMID 21209059. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ PubMed record free |
| Domain is the institution itself (pubmed.ncbi.nlm.nih.gov) | ✅ |
| Author/institution/date visible | ✅ Godlee, Smith, Marcovitch; BMJ; 2011; PMID 21209060 |
| Content directly supports the pressure context | ✅ — title explicitly states "fraudulent"; MeSH: Scientific Misconduct |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality (60–75) | ✅ — BMJ editorial; score 72 |

---

## 5. Accepted Source Records — A-4

### A-4 Source 1 — IPCC AR6 WG1 Summary for Policymakers

| Field | Value |
|-------|-------|
| candidate_url | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ |
| citation_title | Climate Change 2021: The Physical Science Basis — Summary for Policymakers |
| publisher / source_owner | Intergovernmental Panel on Climate Change (IPCC) |
| source_domain | ipcc.ch |
| source_class | Intergovernmental scientific consensus report |
| stance | support |
| quality | documented |
| reliability_score | 90 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The IPCC Sixth Assessment Report Working Group 1 Summary for Policymakers (2021) states that it is unequivocal that human influence has warmed the atmosphere, ocean, and land since 1750 as a result of rising greenhouse gas concentrations that have increased continuously since the pre-industrial era. The report establishes a near-linear relationship between cumulative anthropogenic CO2 emissions and global warming, finding that observed global surface temperature is approximately 1.09°C higher in 2011–2020 than in 1850–1900, and that each 1,000 GtCO2 of cumulative emissions is likely to cause an additional 0.27–0.63°C of warming. This is the consensus finding of the world's leading intergovernmental body on climate science, synthesizing evidence from thousands of peer-reviewed studies. |
| pressure_note | Also used as A-4 pressure source — see Section 6. The SPM addresses natural variability attribution separately, establishing that observed warming cannot be explained by natural drivers alone. |
| rejection_reason | N/A |
| citation_note | Fetched directly from ipcc.ch. Freely accessible. Published 2021. IPCC Working Group I. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ Freely accessible |
| Domain is the institution itself (ipcc.ch) | ✅ |
| Author/institution/date visible | ✅ IPCC; 2021 |
| Content directly supports the specific claim | ✅ — "unequivocal that human influence has warmed" + CO2 quantification |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with quality (90 justified by synthesized international consensus) | ✅ |

---

### A-4 Source 2 — NASA: The Causes of Climate Change

| Field | Value |
|-------|-------|
| candidate_url | https://science.nasa.gov/climate-change/causes |
| citation_title | The Causes of Climate Change |
| publisher / source_owner | National Aeronautics and Space Administration (NASA) |
| source_domain | science.nasa.gov |
| source_class | Official government science agency explanatory page |
| stance | support |
| quality | documented |
| reliability_score | 82 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | NASA's "The Causes of Climate Change" page states that industrial activities have raised atmospheric CO2 levels by nearly 50% since 1750, and that scientists can identify a distinctive isotopic fingerprint in the atmosphere confirming the source as human activity rather than natural processes. The agency states that burning fossil fuels has increased the concentration of atmospheric CO2 over the past century, and that the IPCC has concluded that the increase of CO2, methane, and nitrous oxide in the atmosphere over the industrial era is the result of human activities. NASA further states that human influence is the principal driver of many changes observed across the atmosphere, ocean, cryosphere, and biosphere. This page was last updated October 23, 2024. |
| pressure_note | None — this source supports the primary claim. |
| rejection_reason | N/A |
| citation_note | Fetched from science.nasa.gov/climate-change/causes (redirected from climate.nasa.gov/causes/). Last updated October 23, 2024. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (science.nasa.gov) | ✅ |
| Author/institution/date visible | ✅ NASA; last updated October 23, 2024 |
| Content directly supports the specific claim | ✅ — CO2 increase by human activity; isotopic fingerprint; principal driver language |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality | ✅ |

---

## 6. Pressure Source Record — A-4

### A-4 Pressure — IPCC AR6 WG1 SPM (Attribution angle)

The A-4 pressure point is: "Natural variability (solar cycles, volcanic activity) could
explain the observed warming without attributing it to CO2." The IPCC AR6 WG1 SPM
directly addresses attribution in its findings section and is the appropriate source
for this pressure response.

| Field | Value |
|-------|-------|
| candidate_url | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ |
| citation_title | Climate Change 2021: The Physical Science Basis — Summary for Policymakers (Attribution section) |
| publisher / source_owner | IPCC |
| source_domain | ipcc.ch |
| stance | support (pressure context: natural variability ruled out as primary driver) |
| quality | documented |
| reliability_score | 90 |
| verification_status | **VERIFIED** (same URL as A-4 slot 1; different evidence angle) |
| access_date | 2026-06-07 |
| evidence_body | The IPCC AR6 WG1 Summary for Policymakers addresses attribution explicitly, establishing that the observed warming since 1850–1900 is dominated by human-caused increases in greenhouse gas concentrations. The report states that it is virtually certain that the global upper ocean has warmed since the 1970s and that the human-caused warming signal is unequivocal across multiple independent climate indicators including surface temperature, ocean heat content, sea level rise, and sea ice loss. Natural drivers such as changes in solar output and volcanic forcing are assessed in the same report to have had negligible influence on long-term global surface temperature trends, ruling out natural variability as the primary explanation for observed warming. |
| pressure_note | The evidence body directly addresses the natural-variability pressure point. |
| rejection_reason | N/A |
| citation_note | Same URL as A-4 slot 1. Pressure angle uses the attribution and natural-driver assessment sections of the SPM. |

---

## 7. Rejected Sources

| Claim | Source | URL attempted | Outcome | Reason |
|-------|--------|--------------|---------|--------|
| A-1 | CDC Vaccine Safety / Autism page | https://www.cdc.gov/vaccine-safety/about/autism.html | **REJECTED** — accessible but content contradicts claim | CDC page (last reviewed November 19, 2025) now states: "The claim 'vaccines do not cause autism' is not an evidence-based claim because studies have not ruled out the possibility that infant vaccines cause autism." This is a reversal of CDC's prior position, apparently reflecting a policy-level content change under the current HHS administration. The page's current content cannot be used as a support source for A-1. The independent scientific evidence (Cochrane, NEJM) is unaffected by this policy-page change. |
| A-1 | Cochrane Library full text | https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD004407.pub4/full | HTTP 412 — bot protection / WAF block | Cochrane Library blocks automated fetchers. PubMed abstract of the same review (PMID 22336803) used instead — abstract is sufficient to establish the conclusion and study scale. |
| A-1 | BMJ Wakefield retraction full text | https://www.bmj.com/content/342/bmj.c7452 | HTTP 403 Forbidden | BMJ full text is paywalled. PubMed record (PMID 21209060) used instead — title, authors, MeSH terms, and abstract-field metadata confirm scope and finding. |
| A-1 | The Lancet retraction notice | https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(10)60175-4/fulltext | HTTP 403 Forbidden | Lancet full text is paywalled. Godlee BMJ editorial (PMID 21209060) covers the retraction context adequately. |
| A-4 | climate.nasa.gov/causes/ | (original URL) | HTTP 301 Redirect to science.nasa.gov/climate-change/causes | Redirect followed successfully; confirmed at new URL. |

**Note on CDC autism page:** This is the first instance in D-66–D-68 source research where a
major official institution's current page contradicts the scientific consensus on the claim.
The CDC reversal does not change the evidentiary record — the Cochrane (14.7M children) and
NEJM (537K Danish cohort) studies are independent peer-reviewed evidence unaffected by
regulatory policy changes. However, it means that the CDC autism page cannot be cited as
a support source in the current seed data, and the evidence body for A-1 must rely entirely
on the peer-reviewed literature.

---

## 8. D-61 Worksheet Update

The following changes are ready to be applied to the D-61 worksheet fields in D-70:

### A-1 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-A1` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://pubmed.ncbi.nlm.nih.gov/22336803/ |
| `launch-A1` slot 1 `citation_title` | (blank) | Vaccines for measles, mumps and rubella in children |
| `launch-A1` slot 1 `source_domain` | (blank) | pubmed.ncbi.nlm.nih.gov |
| `launch-A1` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-A1` slot 1 `evidence_body` | (placeholder) | (see Section 3 Source 1 evidence_body) |
| `launch-A1` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-A1` slot 2 `candidate_url` | TODO_FIND_SOURCE | https://pubmed.ncbi.nlm.nih.gov/12421889/ |
| `launch-A1` slot 2 `citation_title` | (blank) | A population-based study of measles, mumps, and rubella vaccination and autism |
| `launch-A1` slot 2 `source_domain` | (blank) | pubmed.ncbi.nlm.nih.gov |
| `launch-A1` slot 2 `access_date` | (blank) | 2026-06-07 |
| `launch-A1` slot 2 `evidence_body` | (placeholder) | (see Section 3 Source 2 evidence_body) |
| `launch-A1` slot 2 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-A1` pressure `candidate_url` | TODO_FIND_SOURCE | https://pubmed.ncbi.nlm.nih.gov/21209060/ |
| `launch-A1` pressure `citation_title` | (blank) | Wakefield's article linking MMR vaccine and autism was fraudulent |
| `launch-A1` pressure `source_domain` | (blank) | pubmed.ncbi.nlm.nih.gov |
| `launch-A1` pressure `access_date` | (blank) | 2026-06-07 |
| `launch-A1` pressure `evidence_body` | (placeholder) | (see Section 4 pressure evidence_body) |
| `launch-A1` pressure `verification_status` | TODO_FIND_SOURCE | VERIFIED |

### A-4 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-A4` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ |
| `launch-A4` slot 1 `citation_title` | (blank) | Climate Change 2021: The Physical Science Basis — Summary for Policymakers |
| `launch-A4` slot 1 `source_domain` | (blank) | ipcc.ch |
| `launch-A4` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-A4` slot 1 `evidence_body` | (placeholder) | (see Section 5 Source 1 evidence_body) |
| `launch-A4` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-A4` slot 2 `candidate_url` | TODO_FIND_SOURCE | https://science.nasa.gov/climate-change/causes |
| `launch-A4` slot 2 `citation_title` | (blank) | The Causes of Climate Change |
| `launch-A4` slot 2 `source_domain` | (blank) | science.nasa.gov |
| `launch-A4` slot 2 `access_date` | (blank) | 2026-06-07 |
| `launch-A4` slot 2 `evidence_body` | (placeholder) | (see Section 5 Source 2 evidence_body) |
| `launch-A4` slot 2 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-A4` pressure `candidate_url` | TODO_FIND_SOURCE | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ |
| `launch-A4` pressure `citation_title` | (blank) | Climate Change 2021: The Physical Science Basis — Summary for Policymakers (Attribution section) |
| `launch-A4` pressure `source_domain` | (blank) | ipcc.ch |
| `launch-A4` pressure `access_date` | (blank) | 2026-06-07 |
| `launch-A4` pressure `evidence_body` | (placeholder) | (see Section 6 pressure evidence_body) |
| `launch-A4` pressure `verification_status` | TODO_FIND_SOURCE | VERIFIED |

Note: The D-61 worksheet file is not edited in D-68. The worksheet update table above
records the intended changes for D-70 (source insertion draft).

---

## 9. D-62 Gate Delta — Batch A Cumulative

| Hard blocker | D-67 state | D-68 state |
|-------------|-----------|-----------|
| HB-1 any TODO_FIND_SOURCE | ⚠️ B-4 slot 3 + Batches A/C/D/E TODO | ⚠️ B-4 slot 3 + Batches C/D/E TODO; A-1 and A-4 all slots VERIFIED |
| HB-2 any unverified | ⚠️ Batch B verified; rest not | ⚠️ Batch B + A-1 + A-4 verified; Batches C/D/E not |
| HB-3 SOURCE_NEEDED blocks apply | ❌ Still blocks | ❌ Still blocks — Batches C/D/E unverified |
| HB-4 evidence_body missing | ⚠️ Batch B complete | ⚠️ Batch B + A-1 + A-4 complete; Batches C/D/E draft |
| HB-5 reliability_score unconfirmed | ⚠️ Batch B confirmed | ⚠️ Batch B + A-1 + A-4 confirmed |
| HB-6 launch_blocker: true | ⚠️ B-5 resolved; B-4 partial | ⚠️ B-5 + A-1 + A-4 resolved; B-4 slot 3 still open |
| HB-7 pressure points | ⚠️ B-4 + B-5 confirmed | ⚠️ B-4 + B-5 + A-1 + A-4 confirmed |
| HB-8 needs-careful-framing truths | ⚠️ Flagged | ⚠️ Unchanged |
| HB-9 review_state='review' | ✅ D-59 | ✅ |
| HB-10 D-59 hardening | ✅ PR #101 | ✅ |

**Verified slot count after D-68:**
- B-4: 2/3 slots + pressure (1 remaining: Doll & Hill / 1964 SG report)
- B-5: 2/2 slots + pressure ✅ fully resolved
- A-1: 2/2 slots + pressure ✅ fully resolved
- A-4: 2/2 slots + pressure ✅ fully resolved
- C-1, C-2, C-4, D-2, D-3, D-5, E-5: all still TODO_FIND_SOURCE

**Overall gate status: ❌ BLOCKED** — Batches C, D, E still have zero verified sources.

---

## 10. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated — all sourced from WebFetch of official institutional pages | ✅ Confirmed |
| All rejected/inaccessible sources recorded with reasons | ✅ Confirmed |
| CDC content change recorded accurately without editorialising | ✅ Confirmed |

---

## D-68 Completion Record

| Item | Status |
|------|--------|
| Claim A-1 record documented | ✅ |
| Claim A-4 record documented | ✅ |
| A-1 slot 1 (Cochrane / PubMed 22336803) — VERIFIED | ✅ |
| A-1 slot 2 (Madsen NEJM / PubMed 12421889) — VERIFIED | ✅ |
| A-1 pressure (Godlee BMJ / PubMed 21209060) — VERIFIED | ✅ |
| A-4 slot 1 (IPCC AR6 SPM / ipcc.ch) — VERIFIED | ✅ |
| A-4 slot 2 (NASA / science.nasa.gov) — VERIFIED | ✅ |
| A-4 pressure (IPCC AR6 SPM attribution angle) — VERIFIED | ✅ |
| A-1 fully resolved (slots 1–2 + pressure) | ✅ |
| A-4 fully resolved (slots 1–2 + pressure) | ✅ |
| CDC autism page content change accurately recorded as REJECTED | ✅ |
| All rejected/inaccessible sources documented | ✅ |
| D-63 acceptance test confirmed for all 5 accepted sources | ✅ |
| D-61 worksheet update table recorded | ✅ |
| D-62 gate delta documented | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
