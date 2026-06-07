# D-70: Batch D Source Research — Sleep Deprivation (D-2), Dunning-Kruger (D-3), Anchoring Bias (D-5)

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-63 designated Batch D (human behaviour / cognitive bias) as the fourth research batch,
covering claims D-2 (sleep deprivation), D-3 (Dunning-Kruger effect), and D-5 (anchoring
bias). D-70 records the results of the Batch D source research pass using WebFetch
verification.

**Result: D-2 fully resolved. D-3 and D-5 partially blocked.**

- D-2 slot 1: Van Dongen et al. 2003 — academic.oup.com (Sleep journal) — VERIFIED
- D-2 slot 2: CDC "About Sleep" — cdc.gov — VERIFIED
- D-3 slot 1: Kruger & Dunning 1999 — PubMed (ncbi.nlm.nih.gov) — VERIFIED
- D-3 slot 2 / pressure: Nuhfer et al. 2016 — digitalcommons.usf.edu (Numeracy) — CANDIDATE_FOUND (borderline claim-specificity; see Section 5)
- D-5 slot 1: Tversky & Kahneman 1974 — PubMed (ncbi.nlm.nih.gov) — VERIFIED
- D-5 slot 2: TODO_FIND_SOURCE — blocked; requires additional research pass

D-2 is fully resolved (2 VERIFIED + no pressure URL required).
D-3 has 1 VERIFIED + 1 CANDIDATE; needs CANDIDATE confirmed or alternative found.
D-5 has 1 VERIFIED + 1 blocked slot; requires additional research pass.

No seed files were edited. No import route was called. No D1 or production mutation
occurred.

---

## 2. Claim Records

### Claim D-2

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-D2` |
| exact claim | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy |
| D-55 short name | D-2 — Sleep deprivation |
| category | Human Behaviour / Biology |
| type | Physical/Testable |
| status target | Proven |
| launch_blocker | yes |

### Claim D-3

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-D3` |
| exact claim | People with lower competence in a domain tend to overestimate their own ability |
| D-55 short name | D-3 — Dunning-Kruger effect |
| category | Cognitive / Psychology |
| type | Empirical/Documented |
| status target | Plausible |
| launch_blocker | yes |

Note: D-3 status is `Plausible` not `Proven`. Both the original finding and the
methodological critique are required evidence slots. Honest grading is the point.

### Claim D-5

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-D5` |
| exact claim | People tend to rely too heavily on an initial piece of information (the "anchor") when making decisions |
| D-55 short name | D-5 — Anchoring bias |
| category | Cognitive / Psychology |
| type | Empirical/Documented |
| status target | Proven |
| launch_blocker | yes |

---

## 3. Accepted Source Records — D-2

### D-2 Source 1 — Van Dongen et al. 2003: The Cumulative Cost of Additional Wakefulness

| Field | Value |
|-------|-------|
| candidate_url | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 |
| citation_title | The Cumulative Cost of Additional Wakefulness: Dose-Response Effects on Neurobehavioral Functions and Sleep Physiology From Chronic Sleep Restriction and Total Sleep Deprivation |
| publisher / source_owner | SLEEP (journal) / Van Dongen, Maislin, Mullington, Dinges |
| source_domain | academic.oup.com |
| source_class | Peer-reviewed sleep research paper — SLEEP journal (Oxford) |
| DOI | 10.1093/sleep/26.2.117 |
| stance | support |
| quality | repeatable |
| reliability_score | 87 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A landmark 2003 study by Van Dongen, Maislin, Mullington, and Dinges published in SLEEP found that restricting sleep to 6 hours or fewer per night for two weeks produced cognitive performance deficits equivalent to up to two nights of total sleep deprivation. Critically, participants in the study underestimated their level of impairment: their subjective sleepiness ratings did not keep pace with the actual measured decline in cognitive performance as sleep debt accumulated. The research established a dose-response relationship between cumulative wakefulness and neurobehavioral deficits, demonstrating that sleep-deprived individuals are systematically unaware of the extent of their own impairment. |
| pressure_note | The finding that participants underestimate their own impairment is directly relevant to the pressure point about individuals feeling "fine" on restricted sleep. D-63 pressure requirement for D-2 is "None — methodological." No external URL required. |
| rejection_reason | N/A |
| citation_note | DOI 10.1093/sleep/26.2.117. Fetched from academic.oup.com abstract page. Abstract freely visible; full text paywalled. Van Dongen et al. 2003, Sleep, Volume 26, Issue 2, Pages 117–126. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ Abstract page freely accessible |
| Domain is the institution itself (academic.oup.com — Oxford University Press) | ✅ |
| Author/institution/date visible | ✅ Van Dongen et al.; SLEEP; 2003; DOI confirmed |
| Content directly supports the specific claim | ✅ — sleep restriction ≤6h for 2 weeks = 2-night total deprivation deficit; participants underestimated impairment |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `repeatable` quality | ✅ — controlled lab study; dose-response design; published in dedicated sleep journal; score 87 |

---

### D-2 Source 2 — CDC: About Sleep

| Field | Value |
|-------|-------|
| candidate_url | https://www.cdc.gov/sleep/about/index.html |
| citation_title | About Sleep |
| publisher / source_owner | Centers for Disease Control and Prevention |
| source_domain | cdc.gov |
| source_class | Official public health agency explanatory page |
| stance | support |
| quality | documented |
| reliability_score | 80 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The CDC states that adults aged 18–60 years need 7 or more hours of sleep per night and that insufficient sleep is associated with a range of adverse health and cognitive outcomes. The agency identifies that inadequate sleep is linked to increased risk of chronic conditions including Type 2 diabetes, heart disease, high blood pressure, and stroke, and notes that sufficient sleep improves cognitive performance, mood, and reduces motor vehicle crash risk. This is the position of the lead US federal public health authority on sleep as a public health issue, last reviewed May 15, 2024. |
| pressure_note | None — this source supports the primary claim. |
| rejection_reason | N/A |
| citation_note | Fetched from cdc.gov/sleep/about/index.html. Last reviewed May 15, 2024. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (cdc.gov) | ✅ |
| Author/institution/date visible | ✅ CDC; last reviewed May 15, 2024 |
| Content directly supports the specific claim | ✅ — insufficient sleep linked to impaired cognitive performance; 7+ hours needed |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality | ✅ |

---

## 4. Accepted Source Records — D-3

### D-3 Source 1 — Kruger & Dunning 1999 JPSP (Original Paper)

| Field | Value |
|-------|-------|
| candidate_url | https://pubmed.ncbi.nlm.nih.gov/10626367/ |
| citation_title | Unskilled and unaware of it: how difficulties in recognizing one's own incompetence lead to inflated self-assessments |
| publisher / source_owner | Journal of Personality and Social Psychology / Kruger & Dunning |
| source_domain | pubmed.ncbi.nlm.nih.gov |
| source_class | Peer-reviewed psychology paper — JPSP (APA) |
| stance | support |
| quality | repeatable |
| reliability_score | 84 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A 1999 study by Justin Kruger and David Dunning published in the Journal of Personality and Social Psychology found that participants scoring in the bottom quartile on tests of humor, grammar, and logic grossly overestimated both their test performance and their general ability in these domains. While their actual test scores placed them in the 12th percentile, they estimated themselves to be in the 62nd percentile. The authors proposed that unskilled individuals face a dual burden: they make poor decisions and simultaneously lack the metacognitive ability to recognize their own errors. |
| pressure_note | The D-3 slot 2 / pressure source (Nuhfer et al. 2016 or confirmed alternative) must accompany this source and explain why the status is Plausible not Proven. |
| rejection_reason | N/A |
| citation_note | Fetched from pubmed.ncbi.nlm.nih.gov/10626367/. PMID 10626367. Abstract available. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is institution itself (pubmed.ncbi.nlm.nih.gov) | ✅ |
| Author/institution/date visible | ✅ Kruger & Dunning; JPSP; 1999; PMID 10626367 |
| Content directly supports the specific claim | ✅ — bottom-quartile performers overestimate themselves (12th vs. 62nd percentile) |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `repeatable` quality | ✅ |

---

## 5. Candidate Source Record — D-3 Slot 2 / Pressure

### D-3 Slot 2 / Pressure Candidate — Nuhfer et al. 2016

| Field | Value |
|-------|-------|
| candidate_url | https://digitalcommons.usf.edu/numeracy/vol9/iss1/art4/ |
| citation_title | Random Number Simulations Reveal How Random Noise Affects the Measurements and Graphical Portrayals of Self-Assessed Competency |
| publisher / source_owner | Numeracy (open-access journal of the National Numeracy Network) / Nuhfer et al. |
| source_domain | digitalcommons.usf.edu |
| source_class | Open-access peer-reviewed journal article |
| stance | support (pressure context: methodological qualification) |
| quality | documented |
| reliability_score_proposed | 65 |
| verification_status | **CANDIDATE_FOUND** |
| access_date | 2026-06-07 |
| evidence_body_draft | A 2016 paper by Nuhfer, Cogan, Fleisher, Gaze, and Wirth in the open-access journal Numeracy used random number simulations with data from 1,154 participants to demonstrate that patterns in self-assessment research are sensitive to graphical conventions and statistical noise. The paper shows that different methodological approaches to measuring self-assessment accuracy yield very different results, and that the visual patterns commonly used to illustrate self-assessment data can emerge from random data without reflecting genuine metacognitive phenomena. This methodological research establishes that the graphical pattern associated with the Dunning-Kruger effect should be interpreted with caution, supporting the classification of the effect as Plausible rather than Proven. |
| limitation | The paper does not directly cite or critique the Kruger & Dunning 1999 paper by name (DK is listed as a keyword). The critique is methodological and addresses the broader self-assessment research domain. A more direct critique of Kruger & Dunning specifically (such as Gignac & Zajenkowski 2020 in Intelligence, or Ehrlinger et al. 2008 in OBHDP) would be preferable as the primary D-3 slot 2 source. Nuhfer 2016 may be used as supplementary context. |
| rejection_reason | Not VERIFIED — criterion 4 (directly claim-specific) is borderline. Paper uses DK as a keyword but does not directly replicate or critique the 1999 paper. |
| citation_note | Fetched from digitalcommons.usf.edu (University of South Florida institutional repository). Freely accessible under Creative Commons Attribution-Noncommercial 4.0 License. Published in Numeracy journal, 2016, Volume 9, Issue 1, Article 4. |

---

## 6. Accepted Source Records — D-5

### D-5 Source 1 — Tversky & Kahneman 1974 Science

| Field | Value |
|-------|-------|
| candidate_url | https://pubmed.ncbi.nlm.nih.gov/17835457/ |
| citation_title | Judgment under Uncertainty: Heuristics and Biases |
| publisher / source_owner | Science / Tversky & Kahneman |
| source_domain | pubmed.ncbi.nlm.nih.gov |
| source_class | Landmark peer-reviewed paper — Science |
| stance | support |
| quality | repeatable |
| reliability_score | 90 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A landmark 1974 paper by Amos Tversky and Daniel Kahneman published in Science identified anchoring as one of three core cognitive heuristics people use when making judgments under uncertainty, describing it as adjustment from an anchor value that is usually employed when a relevant numerical value is available. The paper demonstrates that while these heuristics are typically economical and effective, they lead to systematic and predictable errors — including over-reliance on an initial value even when that value is arbitrary or uninformative. This paper established the scientific foundation for research on cognitive biases in human judgment and decision-making, and Kahneman later received the Nobel Memorial Prize in Economic Sciences in 2002 in part for this body of work. |
| pressure_note | D-63 pressure requirement for D-5: "None — effect-size variation pressure is methodological; no external URL required." |
| rejection_reason | N/A |
| citation_note | Fetched from pubmed.ncbi.nlm.nih.gov/17835457/. PMID 17835457. Science, Volume 185, Issue 4157, pages 1124–1131, 1974. Abstract accessible. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ PubMed abstract free |
| Domain is institution itself (pubmed.ncbi.nlm.nih.gov) | ✅ |
| Author/institution/date visible | ✅ Tversky & Kahneman; Science; 1974; PMID 17835457 |
| Content directly supports the specific claim | ✅ — anchoring described as systematic over-reliance on initial value; leads to "systematic and predictable errors" |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `repeatable` quality (score 90 justified by landmark status and Nobel citation) | ✅ |

---

## 7. Rejected and Blocked Sources

| Claim | Source | URL attempted | Outcome | Reason |
|-------|--------|--------------|---------|--------|
| D-3 | Gignac & Zajenkowski 2020 Intelligence | sciencedirect.com/science/article/pii/S0160289620300234 | HTTP 403 Forbidden | ScienceDirect blocks automated fetchers; Elsevier paywall |
| D-3 | Gignac & Zajenkowski 2020 DOI | doi.org/10.1016/j.intell.2020.101421 | HTTP 404 Not Found | DOI resolves to Elsevier; page not found |
| D-3 | Ehrlinger et al. 2008 OBHDP | doi.org/10.1016/j.obhdp.2007.05.002 → linkinghub.elsevier.com | Redirect loop | Elsevier LinkingHub returns redirect-only page; no content |
| D-2 | Van Dongen 2003 direct | doi.org/10.1093/sleep/26.2.117 → academic.oup.com | VERIFIED (redirect followed successfully) | — |
| D-5 | Furnham & Boo 2011 JBDM review | doi.org/10.1002/bdm.752 → onlinelibrary.wiley.com | HTTP 402 Payment Required | Wiley paywalled |
| D-5 | Epley & Gilovich (various PMIDs guessed) | Multiple PubMed IDs | Wrong records | PMID guessing was unreliable; need author-title search approach |

**Note on D-3 search difficulty:** The Dunning-Kruger critique literature is predominantly published in Elsevier journals (Intelligence, OBHDP, Organizational Behavior) which block automated access. A human researcher with institutional library access can directly retrieve Gignac & Zajenkowski 2020 (Intelligence, 101421) or Ehrlinger et al. 2008 (OBHDP) for VERIFIED status.

**Note on D-5 search difficulty:** The primary anchoring literature (Strack & Mussweiler 1997 JPSP; Epley & Gilovich 2001/2006 Psychological Science; Furnham & Boo 2011 review) is mostly paywalled. The foundational T&K 1974 paper is VERIFIED on PubMed. A follow-up research pass should search PMC with "anchoring bias" for any open-access empirical paper.

---

## 8. D-61 Worksheet Update

D-3 and D-5 worksheet updates are deferred — D-3 needs slot 2 confirmed and D-5 needs
slot 2 found. Only D-2 and D-5 slot 1 are ready for worksheet transfer.

### D-2 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-D2` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 |
| `launch-D2` slot 1 `citation_title` | (blank) | The Cumulative Cost of Additional Wakefulness |
| `launch-D2` slot 1 `source_domain` | (blank) | academic.oup.com |
| `launch-D2` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-D2` slot 1 `evidence_body` | (placeholder) | (see Section 3 Source 1 evidence_body) |
| `launch-D2` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-D2` slot 2 `candidate_url` | TODO_FIND_SOURCE | https://www.cdc.gov/sleep/about/index.html |
| `launch-D2` slot 2 `citation_title` | (blank) | About Sleep |
| `launch-D2` slot 2 `source_domain` | (blank) | cdc.gov |
| `launch-D2` slot 2 `access_date` | (blank) | 2026-06-07 |
| `launch-D2` slot 2 `evidence_body` | (placeholder) | (see Section 3 Source 2 evidence_body) |
| `launch-D2` slot 2 `verification_status` | TODO_FIND_SOURCE | VERIFIED |

### D-3 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-D3` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://pubmed.ncbi.nlm.nih.gov/10626367/ |
| `launch-D3` slot 1 `citation_title` | (blank) | Unskilled and unaware of it |
| `launch-D3` slot 1 `source_domain` | (blank) | pubmed.ncbi.nlm.nih.gov |
| `launch-D3` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-D3` slot 1 `evidence_body` | (placeholder) | (see Section 4 Source 1 evidence_body) |
| `launch-D3` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |

Note: D-3 slot 2 / pressure field update deferred — CANDIDATE pending free-access confirmation.

### D-5 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-D5` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://pubmed.ncbi.nlm.nih.gov/17835457/ |
| `launch-D5` slot 1 `citation_title` | (blank) | Judgment under Uncertainty: Heuristics and Biases |
| `launch-D5` slot 1 `source_domain` | (blank) | pubmed.ncbi.nlm.nih.gov |
| `launch-D5` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-D5` slot 1 `evidence_body` | (placeholder) | (see Section 6 Source 1 evidence_body) |
| `launch-D5` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |

Note: D-5 slot 2 field update deferred — TODO_FIND_SOURCE.

---

## 9. D-62 Gate Delta — Batch D Cumulative

| Hard blocker | D-69 state | D-70 state |
|-------------|-----------|-----------|
| HB-1 any TODO_FIND_SOURCE | ⚠️ C-4 slots + D + E TODO | ⚠️ D-2 resolved; D-3 slot 2 CANDIDATE; D-5 slot 2 TODO; C-4+E5 TODO |
| HB-2 any unverified | ⚠️ C-4+D+E unverified | ⚠️ D-2 VERIFIED; D-3 slot 1 VERIFIED; D-5 slot 1 VERIFIED; D-3 slot 2 + D-5 slot 2 + C-4 + E-5 not |
| HB-3 SOURCE_NEEDED blocks apply | ❌ Still blocks | ❌ Still blocks — D-3 slot 2, D-5 slot 2, C-4, E-5 unverified |
| HB-4 evidence_body missing | ⚠️ C-4+D+E draft | ⚠️ D-2 complete; D-3 slot 1 complete; D-5 slot 1 complete; rest still draft |
| HB-5 reliability_score unconfirmed | ⚠️ D+E unconfirmed | ⚠️ D-2, D-3 slot 1, D-5 slot 1 confirmed |
| HB-6 launch_blocker | ⚠️ C-4 still open | ⚠️ D-2 resolved; D-3 partial; D-5 partial; C-4 still open |
| HB-7 pressure points | ⚠️ C-2 pressure blocked | ⚠️ D-2 pressure N/A; D-3 pressure CANDIDATE; D-5 pressure N/A; C-2 still blocked |
| HB-8 careful-framing truths | ⚠️ Flagged | ⚠️ Unchanged |
| HB-9 review_state='review' | ✅ D-59 | ✅ |
| HB-10 D-59 hardening | ✅ PR #101 | ✅ |

**Verified slot count after D-70:**
- B-4: 2/3 + pressure partial
- B-5: 3/3 ✅
- A-1: 3/3 ✅
- A-4: 3/3 ✅
- C-1: 3/3 ✅
- C-2: 2/2 (pressure blocked)
- C-4: 0/2 BLOCKED
- D-2: 2/2 ✅ FULLY RESOLVED
- D-3: 1/2 VERIFIED + 1 CANDIDATE
- D-5: 1/2 VERIFIED + 1 TODO
- E-5: 0/2 TODO

**Overall gate status: ❌ BLOCKED**

---

## 10. Remaining Batch D Work

| Item | Status |
|------|--------|
| D-2 fully resolved | ✅ |
| D-3 slot 1 | ✅ VERIFIED |
| D-3 slot 2 / pressure (Dunning-Kruger critique) | ⚠️ CANDIDATE — Nuhfer 2016 accessible but borderline; Gignac 2020 or Ehrlinger 2008 preferred; requires institutional library access |
| D-5 slot 1 | ✅ VERIFIED |
| D-5 slot 2 (second anchoring study) | ❌ TODO — all attempts paywalled or 403; try PMC free full text search for "anchoring bias" |

**Recommended approach for remaining Batch D work:**
1. D-3 slot 2: Human researcher with institutional library access retrieves Gignac & Zajenkowski 2020 (Intelligence, DOI 10.1016/j.intell.2020.101421) and writes the evidence body from the actual paper
2. D-5 slot 2: Search pmc.ncbi.nlm.nih.gov for "anchoring heuristic" or "anchoring bias" with "Free full text" filter; alternatively try the APA's Psychological Science free access archive

---

## 11. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated | ✅ Confirmed |
| All rejected/blocked sources recorded | ✅ Confirmed |

---

## D-70 Completion Record

| Item | Status |
|------|--------|
| Claim D-2, D-3, D-5 records documented | ✅ |
| D-2 slot 1 (Van Dongen 2003) — VERIFIED | ✅ |
| D-2 slot 2 (CDC About Sleep) — VERIFIED | ✅ |
| D-2 fully resolved | ✅ |
| D-3 slot 1 (Kruger & Dunning 1999) — VERIFIED | ✅ |
| D-3 slot 2 / pressure (Nuhfer 2016) — CANDIDATE_FOUND | ✅ |
| D-5 slot 1 (Tversky & Kahneman 1974) — VERIFIED | ✅ |
| D-5 slot 2 — TODO_FIND_SOURCE (blocked) | ⚠️ |
| D-63 acceptance test confirmed for 4 VERIFIED sources | ✅ |
| All blocked sources documented with reasons | ✅ |
| D-61 worksheet update table recorded for D-2 and confirmed slots | ✅ |
| D-62 gate delta documented | ✅ |
| Remaining work path specified | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
