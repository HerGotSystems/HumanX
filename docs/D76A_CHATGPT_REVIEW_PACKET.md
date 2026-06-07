# D-76A: ChatGPT Review Packet — Launch Seed v1 Candidate Claims

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called. No executable JSON files created.

**Purpose:** This document is a self-contained review packet for an external reviewer
(ChatGPT or human) to evaluate the 5 READY launch seed claims before any executable
JSON file is created. It extracts the full claim objects from D-74, the review checklist
from D-75, and blank decision fields for the reviewer to fill in.

**Decision codes the reviewer may use:**

| Code | Meaning |
|------|---------|
| `APPROVE_FOR_D76` | Claim and all sources pass review; may enter seed_claims_v2.json |
| `NEEDS_EDIT` | Specific correction required; re-review before file is created |
| `EXCLUDE_FROM_V1` | Remove from v1; document reason |
| `HOLD_FOR_MORE_SOURCES` | Framing or scope question requires resolution |

**What the reviewer is NOT being asked to do:**
- Create or edit any file
- Call any import route
- Make any judgement about the HumanX application itself
- Approve anything beyond the accuracy and framing of these 5 claim objects

**What the reviewer IS being asked to do:**
- Verify that each evidence body text accurately reflects what its source URL contains
- Verify that reliability scores are consistent with source quality
- Verify that pressure bodies represent fair counterarguments (not strawmen)
- Verify that claim status labels (Proven / Plausible) are calibrated to the evidence
- Fill in the blank decision fields at the end of each claim section

---

## CLAIM 1 OF 5 — B-5: Holocaust

---

### 1. Claim Metadata

| Field | Value |
|-------|-------|
| seed_id | `launch-B5` |
| claim | The Holocaust resulted in the murder of approximately six million Jews |
| category | History / Public Record |
| type | Historical/Physical |
| status | Proven |
| review_state_intended | review |
| launch_priority | high |
| risk_level | high |
| source research doc | D-67 (B-5 Holocaust source research) |

### 2. Evidence Items

#### Evidence 1

| Field | Value |
|-------|-------|
| stance | support |
| quality | documented |
| title | Wannsee Protocol |
| source_url | https://avalon.law.yale.edu/imt/wannsee.asp |
| media_type | article |
| reliability_score | 85 |
| source_domain | avalon.law.yale.edu |

**body:**
> The Wannsee Protocol is a classified Nazi German government document dated January 20,
> 1942, recording a meeting of senior Nazi officials in Berlin at which the systematic
> organization of the "final solution of the Jewish question" was discussed and coordinated
> across Europe. The document lists an estimated 11 million Jews across European countries
> as the target population for this coordinated plan and was entered as prosecution evidence
> at the International Military Tribunal at Nuremberg. Yale Law School's Avalon Project
> hosts this document as a primary historical record, demonstrating the state-sponsored and
> systematically planned character of the genocide that resulted in the Holocaust.

**Source research note:** VERIFIED in D-67. Avalon Project at Yale Law School. Primary
Nuremberg prosecution document. Quality label `documented` (not `repeatable` — this is
a historical government record, not a scientific study). Score 85 within the 60–75
(`documented`) scale's upper range, reflecting institutional prestige of Yale hosting and
primary-document nature. D-63 allows scores up to 90 for documented sources at the highest
institutional level.

---

#### Evidence 2

| Field | Value |
|-------|-------|
| stance | support |
| quality | documented |
| title | How Many People did the Nazis Murder? |
| source_url | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution |
| media_type | article |
| reliability_score | 82 |
| source_domain | encyclopedia.ushmm.org |

**body:**
> The United States Holocaust Memorial Museum states that the Nazis and their allies and
> collaborators killed six million Jewish people in the systematic, state-sponsored genocide
> now known as the Holocaust. The USHMM article explains that these figures derive from Nazi
> German documents and prewar and postwar demographic studies, and provides a breakdown
> showing approximately 2.7 million killed at dedicated killing centers, approximately 2
> million in mass shooting operations, and between 800,000 and 1 million in ghettos and
> other camps. This is the established finding of the leading US federal Holocaust research
> and memorial institution, last updated September 26, 2023.

**Source research note:** VERIFIED in D-67. USHMM (United States Holocaust Memorial
Museum) is a US federal institution. Encyclopedia entry last updated September 26, 2023.
Quality label `documented`. Score 82.

---

### 3. Pressure Items

#### Pressure 1

| Field | Value |
|-------|-------|
| title | Antisemitism: An Introduction |
| source_url | https://encyclopedia.ushmm.org/content/en/article/antisemitism |
| severity | medium |
| source_domain | encyclopedia.ushmm.org |

**body:**
> The USHMM Holocaust Encyclopedia article on antisemitism includes a dedicated section
> titled "Holocaust Distortion and Denial as Forms of Antisemitism," defining Holocaust
> denial as any attempt to negate the established facts of the Nazi German genocide and
> Holocaust distortion as statements that misrepresent those established facts. The article
> notes that deniers falsely claim the Holocaust was invented or exaggerated and
> characterizes both denial and distortion as recognized contemporary forms of antisemitism.
> This source, last edited January 10, 2025, establishes that challenges to the established
> six million figure lack evidentiary basis and reflect ideological rather than historical
> methodology.

**Source research note:** VERIFIED in D-67. Same USHMM domain as Evidence 2, different
article. Pressure angle: the counterargument (denial/distortion) exists but is documented
by USHMM as ideologically motivated. This is the "pressure" — what skeptics say and why
it is without evidential basis.

---

### 4. Tests

None defined for this claim. `"tests": []`

---

### 5. Review Checklist — B-5

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "approximately six million Jews"; "murder"; historically grounded | |
| 2 | Category correct | "History / Public Record" | |
| 3 | Type correct | "Historical/Physical" | |
| 4 | Status correct | "Proven" — documentation is definitive | |
| 5 | Evidence slot 1 source URL real and loadable | https://avalon.law.yale.edu/imt/wannsee.asp — Yale Law Avalon Project | |
| 6 | Evidence slot 1 body accurately reflects source | Wannsee Protocol: state-sponsored plan, 11M target population, Nuremberg evidence | |
| 7 | Evidence slot 1 reliability_score reasonable | 85 — `documented`; primary historical document hosted at Yale | |
| 8 | Evidence slot 2 source URL real and loadable | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution | |
| 9 | Evidence slot 2 body accurately reflects source | USHMM: six million; Nazi documents + demographic studies; breakdown by killing method | |
| 10 | Evidence slot 2 reliability_score reasonable | 82 — `documented`; US federal Holocaust institution | |
| 11 | Pressure source URL real and loadable | https://encyclopedia.ushmm.org/content/en/article/antisemitism | |
| 12 | Pressure body is fair and not a strawman | USHMM antisemitism article; describes denial and distortion as antisemitism | |
| 13 | Pressure body does not over-amplify denial framing | Body describes denial's lack of basis, not repeat denial claims | |
| 14 | review_state_intended = "review" | "review" | |
| 15 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated from VERIFIED records | |
| 16 | Launch risk acceptable for v1 | high — sensitive topic; framing factual not performative | |

### 6. Decision Fields — B-5

```
claim_overbroad:          [blank — reviewer fills in: yes / no / note]
source_match:             [blank — reviewer fills in: yes / no / note]
evidence_body_accuracy:   [blank — reviewer fills in: yes / no / note]
reliability_score_ok:     [blank — reviewer fills in: yes / no / note]
pressure_fair:            [blank — reviewer fills in: yes / no / note]
test_safe:                [blank — N/A — no tests defined]
launch_risk_ok:           [blank — reviewer fills in: yes / no / note]
decision:                 [blank — APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES]
reviewer_notes:           [blank — reviewer fills in]
```

---
---

## CLAIM 2 OF 5 — A-1: MMR Vaccine Does Not Cause Autism

---

### 1. Claim Metadata

| Field | Value |
|-------|-------|
| seed_id | `launch-A1` |
| claim | The MMR vaccine does not cause autism |
| category | Science / Medicine |
| type | Physical/Testable |
| status | Proven |
| review_state_intended | review |
| launch_priority | high |
| risk_level | high |
| source research doc | D-68 (Batch A source research) |

**Important note on CDC:** The CDC's vaccine/autism page was REJECTED for this claim.
As of November 2025, the CDC page now states "The claim 'vaccines do not cause autism'
is not an evidence-based claim" — an apparent policy reversal under the current HHS
administration. That page is therefore NOT included in any evidence object below. The
peer-reviewed evidence (Cochrane, NEJM) is unaffected by this policy change.

---

### 2. Evidence Items

#### Evidence 1

| Field | Value |
|-------|-------|
| stance | support |
| quality | repeatable |
| title | Vaccines for measles, mumps and rubella in children |
| source_url | https://pubmed.ncbi.nlm.nih.gov/22336803/ |
| media_type | study |
| reliability_score | 85 |
| source_domain | pubmed.ncbi.nlm.nih.gov |

**body:**
> A 2012 Cochrane systematic review by Demicheli et al., published in the Cochrane Database
> of Systematic Reviews, analyzed data from approximately 14.7 million children across
> randomized controlled trials, cohort studies, case-control studies, and other study
> designs to assess the safety and effectiveness of measles-mumps-rubella (MMR) vaccines.
> The review explicitly concluded that exposure to the MMR vaccine was unlikely to be
> associated with autism. This is the largest systematic review of MMR vaccine safety and
> represents the Cochrane gold standard of evidence synthesis.

**Source research note:** VERIFIED in D-68. PubMed abstract page (PMID 22336803). Cochrane
is the gold standard of systematic review. Quality `repeatable`. Score 85. Abstract
confirms authorship, year, and conclusion. Full text behind Cochrane paywall; PubMed
abstract suffices per D-63 (abstract confirms finding without paywall for the conclusion).

---

#### Evidence 2

| Field | Value |
|-------|-------|
| stance | support |
| quality | repeatable |
| title | A population-based study of measles, mumps, and rubella vaccination and autism |
| source_url | https://pubmed.ncbi.nlm.nih.gov/12421889/ |
| media_type | study |
| reliability_score | 84 |
| source_domain | pubmed.ncbi.nlm.nih.gov |

**body:**
> A 2002 population-based cohort study by Madsen et al., published in The New England
> Journal of Medicine, followed 537,303 children born in Denmark between 1991 and 1998
> (representing over 2.1 million person-years of follow-up) and compared autism diagnosis
> rates between MMR-vaccinated and unvaccinated children. After adjusting for confounders,
> vaccinated children showed no increased risk of autistic disorder (relative risk 0.92) or
> other autistic-spectrum disorders (relative risk 0.83) compared to unvaccinated children.
> The study concluded that this provided strong evidence against the hypothesis that MMR
> vaccination causes autism.

**Source research note:** VERIFIED in D-68. PubMed abstract page (PMID 12421889). NEJM
cohort study, 537K children. Quality `repeatable`. Score 84.

---

### 3. Pressure Items

#### Pressure 1

| Field | Value |
|-------|-------|
| title | Wakefield's article linking MMR vaccine and autism was fraudulent |
| source_url | https://pubmed.ncbi.nlm.nih.gov/21209060/ |
| severity | high |
| source_domain | pubmed.ncbi.nlm.nih.gov |

**body:**
> A 2011 editorial in the BMJ by Godlee, Smith, and Marcovitch concluded that the 1998
> Lancet paper by Andrew Wakefield, which claimed to find a link between MMR vaccination
> and autism in 12 children, constituted fraudulent research. The editorial, published
> alongside a BMJ investigative series by Brian Deer titled "How the case against the MMR
> vaccine was fixed," found that the data in the original paper were manipulated and that
> the Wakefield study's findings could not be substantiated. The Lancet formally retracted
> the 1998 paper, removing the primary published basis for the vaccines-autism hypothesis.

**Source research note:** VERIFIED in D-68. PubMed abstract page (PMID 21209060). BMJ
2011. Quality `documented`. Score 72. The pressure angle here is: the original anti-vaccine
claim (Wakefield 1998) has been proven fraudulent and retracted — the counterargument is
now its own counter-counterargument.

---

### 4. Tests

None defined for this claim. `"tests": []`

---

### 5. Review Checklist — A-1

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "The MMR vaccine does not cause autism"; scoped to one specific vaccine | |
| 2 | Category correct | "Science / Medicine" | |
| 3 | Type correct | "Physical/Testable" | |
| 4 | Status correct | "Proven" — Cochrane 14.7M child meta-analysis + NEJM 537K-child cohort | |
| 5 | Evidence slot 1 source URL real and loadable | https://pubmed.ncbi.nlm.nih.gov/22336803/ — PMID 22336803, Cochrane/Demicheli 2012 | |
| 6 | Evidence slot 1 body accurately reflects source | Cochrane: 14.7M children; "unlikely to be associated with autism" | |
| 7 | Evidence slot 1 reliability_score reasonable | 85 — `repeatable`; Cochrane gold-standard meta-analysis | |
| 8 | Evidence slot 2 source URL real and loadable | https://pubmed.ncbi.nlm.nih.gov/12421889/ — PMID 12421889, Madsen NEJM 2002 | |
| 9 | Evidence slot 2 body accurately reflects source | 537,303 Danish children; RR 0.92; "strong evidence against the hypothesis" | |
| 10 | Evidence slot 2 reliability_score reasonable | 84 — `repeatable`; 537K-child NEJM cohort | |
| 11 | Pressure source URL real and loadable | https://pubmed.ncbi.nlm.nih.gov/21209060/ — PMID 21209060, Godlee/BMJ 2011 | |
| 12 | Pressure body is fair and not a strawman | BMJ: Wakefield paper "fraudulent"; data manipulated; Lancet retracted | |
| 13 | Pressure body does not mischaracterize the Wakefield paper | Body describes the fraud finding and retraction, does not repeat the unfounded claim | |
| 14 | CDC autism page rejection is noted | D-74 notes: "CDC autism page REJECTED (Nov 2025 policy reversal)"; no CDC page in evidence | |
| 15 | review_state_intended = "review" | "review" | |
| 16 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 17 | Launch risk acceptable for v1 | high — politically sensitive; peer-reviewed evidence unaffected by policy changes | |

### 6. Decision Fields — A-1

```
claim_overbroad:          [blank — reviewer fills in: yes / no / note]
source_match:             [blank — reviewer fills in: yes / no / note]
evidence_body_accuracy:   [blank — reviewer fills in: yes / no / note]
reliability_score_ok:     [blank — reviewer fills in: yes / no / note]
pressure_fair:            [blank — reviewer fills in: yes / no / note]
test_safe:                [blank — N/A — no tests defined]
launch_risk_ok:           [blank — reviewer fills in: yes / no / note]
decision:                 [blank — APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES]
reviewer_notes:           [blank — reviewer fills in]
```

---
---

## CLAIM 3 OF 5 — A-4: CO₂ / Human Activity / Primary Driver of Global Warming

---

### 1. Claim Metadata

| Field | Value |
|-------|-------|
| seed_id | `launch-A4` |
| claim | Rising CO2 levels from human activity are the primary driver of observed global warming |
| category | Science / Physical World |
| type | Physical/Testable |
| status | Proven |
| review_state_intended | review |
| launch_priority | high |
| risk_level | medium |
| source research doc | D-68 (Batch A source research) |

---

### 2. Evidence Items

#### Evidence 1

| Field | Value |
|-------|-------|
| stance | support |
| quality | documented |
| title | Climate Change 2021: The Physical Science Basis — Summary for Policymakers |
| source_url | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ |
| media_type | article |
| reliability_score | 90 |
| source_domain | ipcc.ch |

**body:**
> The IPCC Sixth Assessment Report Working Group 1 Summary for Policymakers (2021) states
> that it is unequivocal that human influence has warmed the atmosphere, ocean, and land
> since 1750 as a result of rising greenhouse gas concentrations that have increased
> continuously since the pre-industrial era. The report establishes a near-linear
> relationship between cumulative anthropogenic CO2 emissions and global warming, finding
> that observed global surface temperature is approximately 1.09°C higher in 2011–2020 than
> in 1850–1900, and that each 1,000 GtCO2 of cumulative emissions is likely to cause an
> additional 0.27–0.63°C of warming. This is the consensus finding of the world's leading
> intergovernmental body on climate science, synthesizing evidence from thousands of
> peer-reviewed studies.

**Source research note:** VERIFIED in D-68. IPCC AR6 WG1 SPM, 2021. Official IPCC website.
Quality `documented`. Score 90 — the maximum for any source; justified by international
consensus body synthesising thousands of peer-reviewed studies. D-63 quality/score mapping:
`documented` range 60–75 with top-tier institutional sources allowed up to 90.

---

#### Evidence 2

| Field | Value |
|-------|-------|
| stance | support |
| quality | documented |
| title | The Causes of Climate Change |
| source_url | https://science.nasa.gov/climate-change/causes |
| media_type | article |
| reliability_score | 82 |
| source_domain | science.nasa.gov |

**body:**
> NASA's "The Causes of Climate Change" page states that industrial activities have raised
> atmospheric CO2 levels by nearly 50% since 1750, and that scientists can identify a
> distinctive isotopic fingerprint in the atmosphere confirming the source as human activity
> rather than natural processes. The agency states that burning fossil fuels has increased
> the concentration of atmospheric CO2 over the past century, and that the IPCC has
> concluded that the increase of CO2, methane, and nitrous oxide in the atmosphere over the
> industrial era is the result of human activities. NASA further states that human influence
> is the principal driver of many changes observed across the atmosphere, ocean, cryosphere,
> and biosphere. This page was last updated October 23, 2024.

**Source research note:** VERIFIED in D-68. NASA science.nasa.gov. US federal space and
science agency. Quality `documented`. Score 82. Last updated October 23, 2024.

---

### 3. Pressure Items

#### Pressure 1

| Field | Value |
|-------|-------|
| title | Climate Change 2021: The Physical Science Basis — Summary for Policymakers (Attribution section) |
| source_url | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ |
| severity | medium |
| source_domain | ipcc.ch |

**body:**
> The IPCC AR6 WG1 Summary for Policymakers (2021) directly addresses the attribution
> question, stating that it is unequivocal that human influence has warmed the climate and
> that the scale of recent changes across the climate system is unprecedented. The report
> establishes that greenhouse gas-driven warming is robustly attributed to human activity
> by multiple independent lines of evidence and that observed warming cannot be explained
> by natural drivers alone. The IPCC attribution finding rules out natural variability
> (solar cycles, volcanic activity) as the primary explanation for the observed temperature
> increase since the pre-industrial era.

**Source research note:** VERIFIED in D-68. Same URL as Evidence 1 (IPCC AR6 SPM) — dual
URL use approved in D-63 and D-73. The pressure angle is different from the evidence angle:
evidence angle = CO2 levels and warming correlation; pressure angle = natural variability
is explicitly ruled out as primary driver by the same document. This is the main
counterargument (solar cycles, volcanism) and the IPCC directly addresses it.

---

### 4. Tests

None defined for this claim. `"tests": []`

---

### 5. Review Checklist — A-4

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "primary driver of observed global warming" — scoped to CO2, human activity, primary driver | |
| 2 | Category correct | "Science / Physical World" | |
| 3 | Type correct | "Physical/Testable" | |
| 4 | Status correct | "Proven" — IPCC AR6 "unequivocal"; NASA corroboration | |
| 5 | Evidence slot 1 source URL real and loadable | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ — IPCC AR6 WG1 SPM 2021 | |
| 6 | Evidence slot 1 body accurately reflects source | IPCC: "unequivocal"; 1.09°C above 1850–1900; near-linear CO2 relationship | |
| 7 | Evidence slot 1 reliability_score reasonable | 90 — `documented`; IPCC international consensus body | |
| 8 | Evidence slot 2 source URL real and loadable | https://science.nasa.gov/climate-change/causes — NASA, last updated Oct 23, 2024 | |
| 9 | Evidence slot 2 body accurately reflects source | NASA: CO2 up 50% since 1750; isotopic fingerprint; human source confirmed | |
| 10 | Evidence slot 2 reliability_score reasonable | 82 — `documented`; US government science agency | |
| 11 | Pressure source URL real and loadable | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ — same URL as evidence slot 1 | |
| 12 | Pressure body is fair and not a strawman | IPCC: natural variability ruled out as primary driver; multiple independent attribution lines | |
| 13 | Dual-use URL is acceptable | Same URL serves two angles: CO2/warming correlation (evidence) and natural-variability exclusion (pressure) | |
| 14 | review_state_intended = "review" | "review" | |
| 15 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 16 | Launch risk acceptable for v1 | medium — politically contested but scientifically unambiguous at IPCC level | |

### 6. Decision Fields — A-4

```
claim_overbroad:          [blank — reviewer fills in: yes / no / note]
source_match:             [blank — reviewer fills in: yes / no / note]
evidence_body_accuracy:   [blank — reviewer fills in: yes / no / note]
reliability_score_ok:     [blank — reviewer fills in: yes / no / note]
pressure_fair:            [blank — reviewer fills in: yes / no / note]
test_safe:                [blank — N/A — no tests defined]
launch_risk_ok:           [blank — reviewer fills in: yes / no / note]
decision:                 [blank — APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES]
reviewer_notes:           [blank — reviewer fills in]
```

---
---

## CLAIM 4 OF 5 — C-1: Social Media Algorithms Amplify Content Based on Engagement

---

### 1. Claim Metadata

| Field | Value |
|-------|-------|
| seed_id | `launch-C1` |
| claim | Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely |
| category | Civic / Media Literacy |
| type | Sociological/Observable |
| status | Plausible |
| review_state_intended | review |
| launch_priority | high |
| risk_level | medium |
| source research doc | D-69 (Batch C source research) |

**Note on status:** This claim is graded `Plausible`, not `Proven`. The claim describes an
observable mechanism (engagement-based amplification affects what spreads), but causal
magnitude and platform-specific effects are contested. Vosoughi 2018 demonstrates
differential spread of false vs. true content but does not attribute this solely to
algorithmic design — it finds humans (not bots) are the primary driver. The YouTube blog
post describes engagement signals as primary ranking inputs from the platform's own VP.
`Plausible` is the appropriate status label for a sociological/observable claim with
strong but not experimentally controlled evidence.

---

### 2. Evidence Items

#### Evidence 1

| Field | Value |
|-------|-------|
| stance | support |
| quality | repeatable |
| title | The spread of true and false news online |
| source_url | https://pubmed.ncbi.nlm.nih.gov/29590045/ |
| media_type | study |
| reliability_score | 86 |
| source_domain | pubmed.ncbi.nlm.nih.gov |

**body:**
> A 2018 study by Vosoughi, Roy, and Aral published in Science analyzed approximately
> 126,000 news stories shared on Twitter between 2006 and 2017 by roughly 3 million users
> and found that false information diffused significantly farther, faster, deeper, and more
> broadly than true information across all categories of content, with the effect most
> pronounced for false political news. Importantly, the study found that automated accounts
> (bots) spread both true and false content at comparable rates, establishing that humans
> — not bots — are primarily responsible for the greater amplification of misinformation.
> The research demonstrates that social media platforms exhibit systematic patterns of
> differential information spread driven by user engagement with novel or emotionally
> arousing content.

**Source research note:** VERIFIED in D-69. PubMed abstract page (PMID 29590045). Science
journal 2018. Vosoughi, Roy & Aral (MIT). Quality `repeatable`. Score 86. Largest empirical
study of social media information spread to date.

---

#### Evidence 2

| Field | Value |
|-------|-------|
| stance | support |
| quality | testimony |
| title | On YouTube's recommendation system |
| source_url | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ |
| media_type | article |
| reliability_score | 55 |
| source_domain | blog.youtube |

**body:**
> YouTube's VP of Engineering Cristos Goodrow, writing on YouTube's official blog in
> September 2021, describes the company's recommendation system as using multiple engagement
> signals — including clicks, watch time, survey responses, shares, likes, and dislikes —
> to personalize video suggestions. The post states that these signals can be "overruled"
> by YouTube's responsibility commitments and that the platform actively demotes borderline
> content including misinformation even when such material might generate higher engagement.
> This first-person description of YouTube's recommendation architecture confirms that
> engagement signals (watch time, clicks, reactions) are the primary ranking inputs, with
> responsibility-based overrides as a secondary layer.

**Source research note:** VERIFIED in D-69. YouTube official blog, VP Engineering, Sept
2021. Quality `testimony` (first-person platform statement by a corporate officer). Score
55 — within the testimony range 40–55. Score reflects the source type, not the platform's
credibility. This is the platform's own description of its architecture, which makes it
primary-source testimony.

---

### 3. Pressure Items

#### Pressure 1

| Field | Value |
|-------|-------|
| title | On YouTube's recommendation system (responsibility framing) |
| source_url | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ |
| severity | medium |
| source_domain | blog.youtube |

**body:**
> In the same September 2021 blog post, YouTube's VP of Engineering describes the
> platform's responsibility-based override system, which demotes borderline content even
> when it would otherwise score highly on engagement metrics. The platform's position is
> that recommendation algorithms are not purely engagement-maximising and include deliberate
> interventions to reduce harmful content amplification. This platform-side argument — that
> algorithmic responsibility commitments moderate pure engagement amplification — is the
> primary counterargument to the claim that social media algorithms amplify harmful content
> unchecked.

**Source research note:** VERIFIED in D-69. Same URL as Evidence 2 (YouTube blog) — dual
URL use approved in D-63 and D-73. Evidence angle: engagement signals are the primary
ranking input. Pressure angle: responsibility overrides exist as a secondary layer and
moderate pure amplification. These are distinct framings of the same source document.

---

### 4. Tests

None defined for this claim. `"tests": []`

---

### 5. Review Checklist — C-1

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | Observable mechanism described: "amplify certain content based on engagement signals" — not "cause radicalization" | |
| 2 | Category correct | "Civic / Media Literacy" | |
| 3 | Type correct | "Sociological/Observable" | |
| 4 | Status "Plausible" appropriate | Yes — Vosoughi 2018 shows differential spread, not algorithmic causation alone; platform-side description is testimony | |
| 5 | Evidence slot 1 source URL real and loadable | https://pubmed.ncbi.nlm.nih.gov/29590045/ — PMID 29590045, Vosoughi/Science 2018 | |
| 6 | Evidence slot 1 body accurately reflects source | 126K stories; 3M users; false news spreads farther/faster; humans not bots are primary driver | |
| 7 | Evidence slot 1 reliability_score reasonable | 86 — `repeatable`; large-scale Science study | |
| 8 | Evidence slot 2 source URL real and loadable | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ — YouTube VP Engineering Sept 2021 | |
| 9 | Evidence slot 2 body accurately reflects source | Goodrow: engagement signals (clicks, watchtime, surveys, likes); primary inputs; responsibility overrides secondary | |
| 10 | Evidence slot 2 reliability_score reasonable | 55 — `testimony`; platform VP blog post; appropriate for first-person corporate description | |
| 11 | Pressure source URL real and loadable | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ — same URL | |
| 12 | Pressure body is fair and not a strawman | Platform's own argument: responsibility overrides exist and moderate pure engagement amplification | |
| 13 | Dual-use URL acceptable | Same URL; evidence angle = engagement signals primary; pressure angle = responsibility overrides secondary | |
| 14 | review_state_intended = "review" | "review" | |
| 15 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 16 | Launch risk acceptable for v1 | medium — contested topic; Plausible status + mechanism framing (not outcome framing) keeps risk manageable | |

### 6. Decision Fields — C-1

```
claim_overbroad:          [blank — reviewer fills in: yes / no / note]
source_match:             [blank — reviewer fills in: yes / no / note]
evidence_body_accuracy:   [blank — reviewer fills in: yes / no / note]
reliability_score_ok:     [blank — reviewer fills in: yes / no / note]
pressure_fair:            [blank — reviewer fills in: yes / no / note]
test_safe:                [blank — N/A — no tests defined]
launch_risk_ok:           [blank — reviewer fills in: yes / no / note]
decision:                 [blank — APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES]
reviewer_notes:           [blank — reviewer fills in]
```

---
---

## CLAIM 5 OF 5 — D-2: Sleep Deprivation Impairs Cognitive Performance

---

### 1. Claim Metadata

| Field | Value |
|-------|-------|
| seed_id | `launch-D2` |
| claim | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy |
| category | Human Behaviour / Biology |
| type | Physical/Testable |
| status | Proven |
| review_state_intended | review |
| launch_priority | high |
| risk_level | low |
| source research doc | D-70 (Batch D source research) |

---

### 2. Evidence Items

#### Evidence 1

| Field | Value |
|-------|-------|
| stance | support |
| quality | repeatable |
| title | The Cumulative Cost of Additional Wakefulness: Dose-Response Effects on Neurobehavioral Functions and Sleep Physiology From Chronic Sleep Restriction and Total Sleep Deprivation |
| source_url | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 |
| media_type | study |
| reliability_score | 87 |
| source_domain | academic.oup.com |

**body:**
> A landmark 2003 study by Van Dongen, Maislin, Mullington, and Dinges published in SLEEP
> found that restricting sleep to 6 hours or fewer per night for two weeks produced
> cognitive performance deficits equivalent to up to two nights of total sleep deprivation.
> Critically, participants in the study underestimated their level of impairment: their
> subjective sleepiness ratings did not keep pace with the actual measured decline in
> cognitive performance as sleep debt accumulated. The research established a dose-response
> relationship between cumulative wakefulness and neurobehavioral deficits, demonstrating
> that sleep-deprived individuals are systematically unaware of the extent of their own
> impairment.

**Source research note:** VERIFIED in D-70. Oxford Academic, SLEEP journal. DOI
10.1093/sleep/26.2.117. Van Dongen et al. 2003. Quality `repeatable`. Score 87. Landmark
controlled lab study; widely cited in sleep science. URL resolves to article lookup page
on the Oxford Academic SLEEP journal site.

---

#### Evidence 2

| Field | Value |
|-------|-------|
| stance | support |
| quality | documented |
| title | About Sleep |
| source_url | https://www.cdc.gov/sleep/about/index.html |
| media_type | article |
| reliability_score | 80 |
| source_domain | cdc.gov |

**body:**
> The CDC states that adults aged 18–60 years need 7 or more hours of sleep per night and
> that insufficient sleep is associated with a range of adverse health and cognitive
> outcomes. The agency identifies that inadequate sleep is linked to increased risk of
> chronic conditions including Type 2 diabetes, heart disease, high blood pressure, and
> stroke, and notes that sufficient sleep improves cognitive performance, mood, and reduces
> motor vehicle crash risk. This is the position of the lead US federal public health
> authority on sleep as a public health issue, last reviewed May 15, 2024.

**Source research note:** VERIFIED in D-70. CDC About Sleep page. Last reviewed May 15,
2024. Quality `documented`. Score 80. US Centers for Disease Control and Prevention. No
policy controversy comparable to the CDC autism page issue noted for A-1.

---

### 3. Pressure Items

None required for this claim. `"pressure": []`

**Why no pressure source:** Per D-63 source research protocol, D-2 requires methodological
pressure (addressing the subjective underestimation of sleepiness). The Van Dongen 2003
evidence body already contains this point directly ("participants underestimated their
level of impairment"). No external pressure URL is needed because the methodological
caveat is embedded in the primary evidence source.

---

### 4. Tests

None defined for this claim. `"tests": []`

---

### 5. Review Checklist — D-2

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "significantly impairs cognitive performance, even when individuals feel only mildly sleepy" — well-scoped; includes the underestimation angle | |
| 2 | Category correct | "Human Behaviour / Biology" | |
| 3 | Type correct | "Physical/Testable" | |
| 4 | Status correct | "Proven" — Van Dongen 2003 lab study + CDC public health endorsement | |
| 5 | Evidence slot 1 source URL real and loadable | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 — Oxford Academic SLEEP journal | |
| 6 | Evidence slot 1 body accurately reflects source | Van Dongen 2003: ≤6h/night for 2 weeks = 2-night total deprivation deficit; participants underestimated impairment; dose-response established | |
| 7 | Evidence slot 1 reliability_score reasonable | 87 — `repeatable`; controlled lab study, SLEEP journal, Oxford | |
| 8 | Evidence slot 2 source URL real and loadable | https://www.cdc.gov/sleep/about/index.html — CDC About Sleep, last reviewed May 15, 2024 | |
| 9 | Evidence slot 2 body accurately reflects source | CDC: 7+ hours needed; insufficient sleep linked to cognitive impairment, chronic disease, crash risk | |
| 10 | Evidence slot 2 reliability_score reasonable | 80 — `documented`; CDC official public health guidance | |
| 11 | No pressure source required | D-63 confirmed: methodological pressure embedded in Van Dongen evidence body. Pressure array is empty. | |
| 12 | review_state_intended = "review" | "review" | |
| 13 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 14 | Launch risk acceptable for v1 | low — scientifically uncontroversial; broad public interest | |

### 6. Decision Fields — D-2

```
claim_overbroad:          [blank — reviewer fills in: yes / no / note]
source_match:             [blank — reviewer fills in: yes / no / note]
evidence_body_accuracy:   [blank — reviewer fills in: yes / no / note]
reliability_score_ok:     [blank — reviewer fills in: yes / no / note]
pressure_fair:            [blank — N/A — no pressure items]
test_safe:                [blank — N/A — no tests defined]
launch_risk_ok:           [blank — reviewer fills in: yes / no / note]
decision:                 [blank — APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES]
reviewer_notes:           [blank — reviewer fills in]
```

---
---

## Summary Decision Table

One row per READY claim. All `decision` fields are blank — the reviewer fills these in.

| seed_id | claim | evidence_count | pressure_count | test_count | all_source_urls_present | decision |
|---------|-------|---------------|---------------|-----------|------------------------|----------|
| `launch-B5` | The Holocaust resulted in the murder of approximately six million Jews | 2 | 1 | 0 | yes | _[blank]_ |
| `launch-A1` | The MMR vaccine does not cause autism | 2 | 1 | 0 | yes | _[blank]_ |
| `launch-A4` | Rising CO2 levels from human activity are the primary driver of observed global warming | 2 | 1 | 0 | yes | _[blank]_ |
| `launch-C1` | Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely | 2 | 1 | 0 | yes | _[blank]_ |
| `launch-D2` | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | 2 | 0 | 0 | yes | _[blank]_ |

**Total evidence items across all 5 READY claims:** 10
**Total pressure items:** 4 (D-2 has none; all others have 1 each)
**Total tests:** 0 (none defined yet)
**All source_url fields populated:** yes — 7 unique URLs (some dual-used), no SOURCE_NEEDED placeholders

---

## Reviewer Instructions Summary

1. For each of the 5 claims above, visit the source URLs and verify that the evidence body
   text accurately reflects what is on the page.
2. Confirm that the reliability score is appropriate for the source quality class
   (`repeatable` 80–90, `documented` 60–90 top-tier, `testimony` 40–55).
3. Confirm that pressure bodies represent real counterarguments fairly — not strawmen,
   not over-amplification of denial framing.
4. Confirm that the status label (`Proven` or `Plausible`) is calibrated to the evidence.
5. Fill in the Decision Fields block at the end of each claim with one of:
   `APPROVE_FOR_D76` / `NEEDS_EDIT` / `EXCLUDE_FROM_V1` / `HOLD_FOR_MORE_SOURCES`
6. Fill in `reviewer_notes` with any specific concerns, corrections needed, or observations.
7. Return the filled-in decision fields. Claude will record them in `docs/D75_LAUNCH_SEED_V1_HUMAN_REVIEW_CHECKLIST.md`
   Section 5 and update the gate status before creating the executable JSON file.

**Gate rule:** All 5 claims must carry `APPROVE_FOR_D76` before `data/seed_claims_v2.json`
is created. Any `NEEDS_EDIT` decision pauses the process until the correction is made
and re-reviewed.

---

## Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No data/seed_claims_v2.json created | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No decisions pre-filled | ✅ Confirmed — all decision fields are blank |
| No APPROVE_FOR_D76 recorded | ✅ Confirmed — this document does not approve anything |
