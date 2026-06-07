# D-74: Source Insertion Draft

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called. No executable JSON files created.

---

## 1. Summary

D-74 is the source insertion draft. It drafts the claim objects that will eventually
become the final `data/seed_claims_v2.json` import file, using only VERIFIED source
records from D-66 through D-73. It does NOT create or edit any executable file. It does
NOT call any import route.

The D-59 SOURCE_NEEDED guard remains the enforcement mechanism at import time. Any claim
object with an empty or SOURCE_NEEDED `source_url` will be blocked when
`GET /api/import-seed?mode=apply` is eventually called. D-74 drafts the content; a
separate D-76 step (branch + PR) will create the actual `data/seed_claims_v2.json` file
after a human reviews this draft.

**Inclusions:**
- 5 READY claims: B-5, A-1, A-4, C-1, D-2 — full evidence and pressure sources populated
- 4 PARTIAL claims: B-4, C-2, D-3, D-5 — appendix only; `SLOT_OPEN` markers; not v1

**Exclusions:**
- C-4 confirmation bias — 0 VERIFIED sources
- E-5 astrology — 0 VERIFIED sources (paywall/access gap — not editorial)

---

## 2. Inclusion Policy

| Classification | D-74 treatment |
|---------------|----------------|
| READY_FOR_SOURCE_INSERTION | Full claim object drafted; all source fields populated from VERIFIED records; may enter D-76 final JSON file |
| PARTIAL_NEEDS_ONE_MORE_SOURCE | Appendix summary only; open slot marked `SLOT_OPEN`; must NOT enter v1 apply-mode import until gap is resolved |
| EXCLUDE_FROM_LAUNCH_V1 | Listed with exclusion reason; no claim object drafted; deferred to future research |

No paywalled-only sources are promoted to VERIFIED. No CANDIDATE_FOUND sources are
treated as VERIFIED. No field values are invented or guessed — all `source_url`, `title`,
`body`, and `reliability_score` values are copied exactly from the D-66 through D-70
source research records.

---

## 3. Launch v1 Source-Inserted Claim Drafts

The JSON-like blocks below match the D-57 claim object shape. They are **not executable**.
They serve as the draft record from which D-76 will construct the actual JSON file.

---

### 3.1 — B-5: Holocaust — Six Million

```
{
  "seed_id": "launch-B5",
  "claim": "The Holocaust resulted in the murder of approximately six million Jews",
  "category": "History / Public Record",
  "type": "Historical/Physical",
  "status": "Proven",
  "review_state_intended": "review",
  "launch_priority": "high",
  "risk_level": "high",
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Wannsee Protocol",
      "body": "The Wannsee Protocol is a classified Nazi German government document dated January 20, 1942, recording a meeting of senior Nazi officials in Berlin at which the systematic organization of the \"final solution of the Jewish question\" was discussed and coordinated across Europe. The document lists an estimated 11 million Jews across European countries as the target population for this coordinated plan and was entered as prosecution evidence at the International Military Tribunal at Nuremberg. Yale Law School's Avalon Project hosts this document as a primary historical record, demonstrating the state-sponsored and systematically planned character of the genocide that resulted in the Holocaust.",
      "source_url": "https://avalon.law.yale.edu/imt/wannsee.asp",
      "media_type": "article",
      "reliability_score": 85,
      "source_domain": "avalon.law.yale.edu"
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "How Many People did the Nazis Murder?",
      "body": "The United States Holocaust Memorial Museum states that the Nazis and their allies and collaborators killed six million Jewish people in the systematic, state-sponsored genocide now known as the Holocaust. The USHMM article explains that these figures derive from Nazi German documents and prewar and postwar demographic studies, and provides a breakdown showing approximately 2.7 million killed at dedicated killing centers, approximately 2 million in mass shooting operations, and between 800,000 and 1 million in ghettos and other camps. This is the established finding of the leading US federal Holocaust research and memorial institution, last updated September 26, 2023.",
      "source_url": "https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution",
      "media_type": "article",
      "reliability_score": 82,
      "source_domain": "encyclopedia.ushmm.org"
    }
  ],
  "pressure": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Antisemitism: An Introduction",
      "body": "The USHMM Holocaust Encyclopedia article on antisemitism includes a dedicated section titled \"Holocaust Distortion and Denial as Forms of Antisemitism,\" defining Holocaust denial as any attempt to negate the established facts of the Nazi German genocide and Holocaust distortion as statements that misrepresent those established facts. The article notes that deniers falsely claim the Holocaust was invented or exaggerated and characterizes both denial and distortion as recognized contemporary forms of antisemitism. This source, last edited January 10, 2025, establishes that challenges to the established six million figure lack evidentiary basis and reflect ideological rather than historical methodology.",
      "source_url": "https://encyclopedia.ushmm.org/content/en/article/antisemitism",
      "media_type": "article",
      "reliability_score": 78,
      "source_domain": "encyclopedia.ushmm.org"
    }
  ],
  "tests": [],
  "notes": "B-5 fully resolved D-67. All 3 sources VERIFIED. Pressure: denial/distortion framing."
}
```

---

### 3.2 — A-1: MMR Vaccine / Autism (EDITED — D-76B)

```
{
  "seed_id": "launch-A1",
  "claim": "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism",
  "category": "Science / Medicine",
  "type": "Physical/Testable",
  "status": "Strongly Supported",
  "review_state_intended": "review",
  "launch_priority": "high",
  "risk_level": "high",
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Vaccines for measles, mumps and rubella in children",
      "body": "A 2012 Cochrane systematic review by Demicheli et al., published in the Cochrane Database of Systematic Reviews, analyzed data from approximately 14.7 million children across randomized controlled trials, cohort studies, case-control studies, and other study designs to assess the safety and effectiveness of measles-mumps-rubella (MMR) vaccines. The review explicitly concluded that exposure to the MMR vaccine was unlikely to be associated with autism. This is the largest systematic review of MMR vaccine safety and represents the Cochrane gold standard of evidence synthesis.",
      "source_url": "https://pubmed.ncbi.nlm.nih.gov/22336803/",
      "media_type": "study",
      "reliability_score": 85,
      "source_domain": "pubmed.ncbi.nlm.nih.gov"
    },
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "A population-based study of measles, mumps, and rubella vaccination and autism",
      "body": "A 2002 population-based cohort study by Madsen et al., published in The New England Journal of Medicine, followed 537,303 children born in Denmark between 1991 and 1998 (representing over 2.1 million person-years of follow-up) and compared autism diagnosis rates between MMR-vaccinated and unvaccinated children. After adjusting for confounders, vaccinated children showed no increased risk of autistic disorder (relative risk 0.92) or other autistic-spectrum disorders (relative risk 0.83) compared to unvaccinated children. The study concluded that this provided strong evidence against the hypothesis that MMR vaccination causes autism.",
      "source_url": "https://pubmed.ncbi.nlm.nih.gov/12421889/",
      "media_type": "study",
      "reliability_score": 84,
      "source_domain": "pubmed.ncbi.nlm.nih.gov"
    }
  ],
  "pressure": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Wakefield's article linking MMR vaccine and autism was fraudulent",
      "body": "A 2011 editorial in the BMJ by Godlee, Smith, and Marcovitch concluded that the 1998 Lancet paper by Andrew Wakefield, which claimed to find a link between MMR vaccination and autism in 12 children, constituted fraudulent research. The editorial, published alongside a BMJ investigative series by Brian Deer titled \"How the case against the MMR vaccine was fixed,\" found that the data in the original paper were manipulated and that the Wakefield study's findings could not be substantiated. The Lancet formally retracted the 1998 paper, removing the primary published basis for the vaccines-autism hypothesis.",
      "source_url": "https://pubmed.ncbi.nlm.nih.gov/21209060/",
      "media_type": "article",
      "reliability_score": 72,
      "source_domain": "pubmed.ncbi.nlm.nih.gov"
    }
  ],
  "tests": [],
  "notes": "A-1 fully resolved D-68. CDC autism page REJECTED (Nov 2025 policy reversal — content now contradicts claim; peer-reviewed evidence unaffected). Pressure: Wakefield fraud and retraction. EDIT D-76B: claim text rephrased from absolute negation ('does not cause') to evidence-based framing ('have not found evidence'); status changed Proven → Strongly Supported for calibration and launch risk reduction. All source URLs, evidence bodies, pressure bodies, and reliability scores unchanged."
}
```

---

### 3.3 — A-4: CO₂ Levels / Human Activity / Primary Driver of Global Warming

```
{
  "seed_id": "launch-A4",
  "claim": "Rising CO2 levels from human activity are the primary driver of observed global warming",
  "category": "Science / Physical World",
  "type": "Physical/Testable",
  "status": "Proven",
  "review_state_intended": "review",
  "launch_priority": "high",
  "risk_level": "medium",
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Climate Change 2021: The Physical Science Basis — Summary for Policymakers",
      "body": "The IPCC Sixth Assessment Report Working Group 1 Summary for Policymakers (2021) states that it is unequivocal that human influence has warmed the atmosphere, ocean, and land since 1750 as a result of rising greenhouse gas concentrations that have increased continuously since the pre-industrial era. The report establishes a near-linear relationship between cumulative anthropogenic CO2 emissions and global warming, finding that observed global surface temperature is approximately 1.09°C higher in 2011–2020 than in 1850–1900, and that each 1,000 GtCO2 of cumulative emissions is likely to cause an additional 0.27–0.63°C of warming. This is the consensus finding of the world's leading intergovernmental body on climate science, synthesizing evidence from thousands of peer-reviewed studies.",
      "source_url": "https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/",
      "media_type": "article",
      "reliability_score": 90,
      "source_domain": "ipcc.ch"
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "The Causes of Climate Change",
      "body": "NASA's \"The Causes of Climate Change\" page states that industrial activities have raised atmospheric CO2 levels by nearly 50% since 1750, and that scientists can identify a distinctive isotopic fingerprint in the atmosphere confirming the source as human activity rather than natural processes. The agency states that burning fossil fuels has increased the concentration of atmospheric CO2 over the past century, and that the IPCC has concluded that the increase of CO2, methane, and nitrous oxide in the atmosphere over the industrial era is the result of human activities. NASA further states that human influence is the principal driver of many changes observed across the atmosphere, ocean, cryosphere, and biosphere. This page was last updated October 23, 2024.",
      "source_url": "https://science.nasa.gov/climate-change/causes",
      "media_type": "article",
      "reliability_score": 82,
      "source_domain": "science.nasa.gov"
    }
  ],
  "pressure": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Climate Change 2021: The Physical Science Basis — Summary for Policymakers (Attribution section)",
      "body": "The IPCC AR6 WG1 Summary for Policymakers (2021) directly addresses the attribution question, stating that it is unequivocal that human influence has warmed the climate and that the scale of recent changes across the climate system is unprecedented. The report establishes that greenhouse gas-driven warming is robustly attributed to human activity by multiple independent lines of evidence and that observed warming cannot be explained by natural drivers alone. The IPCC attribution finding rules out natural variability (solar cycles, volcanic activity) as the primary explanation for the observed temperature increase since the pre-industrial era.",
      "source_url": "https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/",
      "media_type": "article",
      "reliability_score": 90,
      "source_domain": "ipcc.ch"
    }
  ],
  "tests": [],
  "notes": "A-4 fully resolved D-68. Pressure source shares URL with evidence slot 1 (IPCC AR6 SPM) — dual-use approved per D-63 note. Pressure angle: natural variability ruled out as primary driver."
}
```

---

### 3.4 — C-1: Online Platform Recommendation Systems / Engagement (EDITED — D-76B)

```
{
  "seed_id": "launch-C1",
  "claim": "Online platform recommendation systems can use engagement signals that influence which information spreads widely",
  "category": "Civic / Media Literacy",
  "type": "Sociological/Observable",
  "status": "Plausible",
  "review_state_intended": "review",
  "launch_priority": "high",
  "risk_level": "medium",
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "The spread of true and false news online",
      "body": "A 2018 study by Vosoughi, Roy, and Aral published in Science analyzed approximately 126,000 news stories shared on Twitter between 2006 and 2017 by roughly 3 million users and found that false information diffused significantly farther, faster, deeper, and more broadly than true information across all categories of content, with the effect most pronounced for false political news. Importantly, the study found that automated accounts (bots) spread both true and false content at comparable rates, establishing that humans — not bots — are primarily responsible for the greater amplification of misinformation. The research demonstrates that social media platforms exhibit systematic patterns of differential information spread driven by user engagement with novel or emotionally arousing content.",
      "source_url": "https://pubmed.ncbi.nlm.nih.gov/29590045/",
      "media_type": "study",
      "reliability_score": 86,
      "source_domain": "pubmed.ncbi.nlm.nih.gov"
    },
    {
      "stance": "support",
      "quality": "testimony",
      "title": "On YouTube's recommendation system",
      "body": "YouTube's VP of Engineering Cristos Goodrow, writing on YouTube's official blog in September 2021, describes the company's recommendation system as using multiple engagement signals — including clicks, watch time, survey responses, shares, likes, and dislikes — to personalize video suggestions. The post states that these signals can be \"overruled\" by YouTube's responsibility commitments and that the platform actively demotes borderline content including misinformation even when such material might generate higher engagement. This first-person description of YouTube's recommendation architecture confirms that engagement signals (watch time, clicks, reactions) are the primary ranking inputs, with responsibility-based overrides as a secondary layer.",
      "source_url": "https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/",
      "media_type": "article",
      "reliability_score": 55,
      "source_domain": "blog.youtube"
    }
  ],
  "pressure": [
    {
      "stance": "support",
      "quality": "testimony",
      "title": "On YouTube's recommendation system (responsibility framing)",
      "body": "In the same September 2021 blog post, YouTube's VP of Engineering describes the platform's responsibility-based override system, which demotes borderline content even when it would otherwise score highly on engagement metrics. The platform's position is that recommendation algorithms are not purely engagement-maximising and include deliberate interventions to reduce harmful content amplification. This platform-side argument — that algorithmic responsibility commitments moderate pure engagement amplification — is the primary counterargument to the claim that social media algorithms amplify harmful content unchecked.",
      "source_url": "https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/",
      "media_type": "article",
      "reliability_score": 55,
      "source_domain": "blog.youtube"
    }
  ],
  "tests": [],
  "notes": "C-1 fully resolved D-69. Pressure source shares URL with evidence slot 2 (YouTube blog) — dual-use approved per D-63 note. Pressure angle: platform responsibility argument. Status Plausible (not Proven) — claim is observable/sociological; causal magnitude contested. EDIT D-76B: claim text narrowed from 'social media algorithms amplify' (too broad — implies all platforms and all algorithm types) to 'online platform recommendation systems can use engagement signals that influence' (scoped to recommendation systems; hedged with 'can use'). Status remains Plausible. All source URLs, evidence bodies, pressure bodies, and reliability scores unchanged."
}
```

---

### 3.5 — D-2: Sleep Deprivation Impairs Cognitive Performance

```
{
  "seed_id": "launch-D2",
  "claim": "Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy",
  "category": "Human Behaviour / Biology",
  "type": "Physical/Testable",
  "status": "Proven",
  "review_state_intended": "review",
  "launch_priority": "high",
  "risk_level": "low",
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "The Cumulative Cost of Additional Wakefulness: Dose-Response Effects on Neurobehavioral Functions and Sleep Physiology From Chronic Sleep Restriction and Total Sleep Deprivation",
      "body": "A landmark 2003 study by Van Dongen, Maislin, Mullington, and Dinges published in SLEEP found that restricting sleep to 6 hours or fewer per night for two weeks produced cognitive performance deficits equivalent to up to two nights of total sleep deprivation. Critically, participants in the study underestimated their level of impairment: their subjective sleepiness ratings did not keep pace with the actual measured decline in cognitive performance as sleep debt accumulated. The research established a dose-response relationship between cumulative wakefulness and neurobehavioral deficits, demonstrating that sleep-deprived individuals are systematically unaware of the extent of their own impairment.",
      "source_url": "https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117",
      "media_type": "study",
      "reliability_score": 87,
      "source_domain": "academic.oup.com"
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "About Sleep",
      "body": "The CDC states that adults aged 18–60 years need 7 or more hours of sleep per night and that insufficient sleep is associated with a range of adverse health and cognitive outcomes. The agency identifies that inadequate sleep is linked to increased risk of chronic conditions including Type 2 diabetes, heart disease, high blood pressure, and stroke, and notes that sufficient sleep improves cognitive performance, mood, and reduces motor vehicle crash risk. This is the position of the lead US federal public health authority on sleep as a public health issue, last reviewed May 15, 2024.",
      "source_url": "https://www.cdc.gov/sleep/about/index.html",
      "media_type": "article",
      "reliability_score": 80,
      "source_domain": "cdc.gov"
    }
  ],
  "pressure": [],
  "tests": [],
  "notes": "D-2 fully resolved D-70. No pressure URL required per D-63 (methodological pressure — the claim itself addresses the subjective underestimation point via Van Dongen finding). Status Proven."
}
```

---

## 4. Partial Claims Appendix (Not Launch v1)

These claims have at least one VERIFIED source but have open slots that prevent them from
entering `?mode=apply`. They are NOT included in the v1 JSON draft. They are documented
here so D-76 can add them once their open slots are resolved.

---

### 4.1 — B-4: Smoking Causes Lung Cancer (PARTIAL)

| Field | Value |
|-------|-------|
| seed_id | `launch-B4` |
| claim | Smoking tobacco causes lung cancer |
| VERIFIED evidence | Slot 1: CDC "Smoking and Cancer" (cdc.gov/tobacco, score 84) ✅; Slot 2: NCI "Harms of Cigarette Smoking" (cancer.gov, score 86) ✅ |
| SLOT_OPEN | Slot 3: Doll & Hill 1950 BMJ original paper OR specific 1964 Surgeon General "Smoking and Health" document page — not yet found; HHS index page (hhs.gov) is CANDIDATE_FOUND only |
| Pressure | None required per D-63 (definitional) ✅ |
| Status if included | Would be incomplete; slot 3 is not a hard minimum (D-63 minimum is 3 sources for B-4) |
| Recommendation | Do not include in v1. Resolve slot 3 (Doll & Hill BMJ archive or specific 1964 SG document page) then add to v1.1 or later. Alternatively: confirm with project owner whether 2 sources (CDC + NCI) are sufficient for v1 given the definitional nature of the pressure point. If 2 sources are accepted as sufficient for this claim, B-4 can be promoted to READY. |

---

### 4.2 — C-2: Eyewitness Testimony (PARTIAL)

| Field | Value |
|-------|-------|
| seed_id | `launch-C2` |
| claim | Eyewitness testimony is less reliable than commonly assumed |
| VERIFIED evidence | Slot 1: Innocence Project "Eyewitness Misidentification" (innocenceproject.org, score 75) ✅; Slot 2: NIJ "Eyewitness Identification" (nij.ojp.gov, score 68) ✅ |
| SLOT_OPEN | Pressure: NRC 2014 National Academies "Identifying the Culprit: Assessing Eyewitness Identification" — paywalled ($40); no free-access equivalent found |
| Status if included | Evidence slots are met (2/2 VERIFIED). Pressure slot is open. D-63 specifies NRC 2014 or equivalent as the pressure requirement. |
| Recommendation | Option A: Proceed to v1 without a pressure source, noting that both evidence slots are VERIFIED and the NRC pressure slot remains open. The claim can be imported with 2 evidence sources; the missing pressure source reduces defensibility but does not trigger the D-59 guard (evidence bodies are populated). Option B: Find free-access equivalent (any federal or academic acknowledgment of NRC 2014's findings — e.g., NIJ or state court system guidelines citing the NRC). Recommend Option A for v1 if project owner accepts, noting the pressure gap in the moderation review record. |

---

### 4.3 — D-3: Dunning-Kruger Effect (PARTIAL — Option A)

| Field | Value |
|-------|-------|
| seed_id | `launch-D3` |
| claim | People with lower competence in a domain tend to overestimate their own ability |
| VERIFIED evidence | Slot 1: Kruger & Dunning 1999 JPSP (PubMed 10626367, `repeatable`, score 84) ✅ |
| SLOT_OPEN | Slot 2 / Pressure: D-63 requires BOTH an original paper AND a critique/replication for this claim because status is `Plausible` not `Proven`. Nuhfer et al. 2016 (digitalcommons.usf.edu, open-access CC license) is CANDIDATE_FOUND (borderline claim-specificity — paper addresses statistical noise in self-assessment research and lists DK as a keyword but does not directly cite or test the 1999 paper). Gignac & Zajenkowski 2020 (Intelligence, Elsevier) and Ehrlinger et al. 2008 (OBHDP, Elsevier) are blocked by HTTP 403. |
| D-73 Option A | Include D-3 with Kruger & Dunning 1999 (VERIFIED) and Nuhfer 2016 (flagged as CANDIDATE) entered as `review_state='review'`. Moderator reviews Nuhfer source and can accept or reject. Status `Plausible` protects against overclaiming. |
| Recommendation | Do not include in v1 JSON until: (a) Nuhfer 2016 is confirmed via human review as adequate for the DK critique slot, OR (b) Gignac 2020 or Ehrlinger 2008 is obtained via institutional library access. If Option A is accepted by project owner, D-3 may enter v1.1 with the CANDIDATE source flagged in the evidence body note. |
| Candidate source for critique slot | Nuhfer et al. 2016, "Random Number Simulations Reveal How Random Noise Affects the Measurements and Graphical Portrayals of Self-Assessed Competency," Numeracy 9(1), Art. 4. URL: https://digitalcommons.usf.edu/numeracy/vol9/iss1/art4/ (open-access; CC Attribution-Noncommercial 4.0) |

---

### 4.4 — D-5: Anchoring Bias (PARTIAL)

| Field | Value |
|-------|-------|
| seed_id | `launch-D5` |
| claim | People tend to rely too heavily on an initial piece of information (the "anchor") when making decisions |
| VERIFIED evidence | Slot 1: Tversky & Kahneman 1974 Science (PubMed 17835457, `repeatable`, score 90) ✅ |
| SLOT_OPEN | Slot 2: a second independent anchoring study. Strack & Mussweiler 1997 JPSP, Epley & Gilovich 2006 Psychological Science, and Furnham & Boo 2011 JBDM (DOI 10.1002/bdm.752) are all blocked by paywalls (Wiley 402, ScienceDirect 403). |
| Pressure | None required per D-63 (methodological) ✅ |
| Recommendation | Do not include in v1. Search PMC for open-access anchoring bias empirical paper: `site:pmc.ncbi.nlm.nih.gov anchoring bias` or `anchoring heuristic`. The foundational T&K 1974 paper is VERIFIED but 1 source alone is insufficient for a D-63 minimum-2 requirement. If a second free-access anchoring study is found, D-5 can be promoted to READY. |

---

## 5. Excluded Claims Appendix

### 5.1 — C-4: Confirmation Bias (EXCLUDED v1)

| Field | Value |
|-------|-------|
| seed_id | `launch-C4` |
| claim | People tend to search for and interpret evidence in ways that confirm their existing beliefs |
| VERIFIED evidence | 0 |
| Exclusion reason | Nickerson 1998 "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises" (Review of General Psychology) is the primary candidate — CANDIDATE_FOUND only (Sage paywalled, full abstract partially visible). Slot 2 not found. APA Dictionary, PsycNET, and APA science briefs all return JavaScript-rendered pages inaccessible to automated fetch. Exclusion is an access-gap decision, not editorial. |
| Future path | Search PsyArXiv or ResearchGate for open-access version of Nickerson 1998. Alternatively search PMC for open-access confirmation bias review. If found, can be added to v1.1. |

### 5.2 — E-5: Astrology (EXCLUDED v1)

| Field | Value |
|-------|-------|
| seed_id | `launch-E5` |
| claim | Astrology cannot reliably predict personality traits or life outcomes beyond chance |
| VERIFIED evidence | 0 |
| Exclusion reason | Carlson 1985 Nature "A double-blind test of astrology" — PAYWALLED_OR_INACCESSIBLE (stable URL requires auth; conclusion not visible without subscription; not indexed in PubMed). Hartmann/Reuter/Nyborg 2006 PAID — ScienceDirect HTTP 403; not indexed in PubMed. Musch & Grondin 2001 Developmental Review — Elsevier redirect-only. Exclusion is an access-gap decision only. The scientific standing of these papers is not in question. |
| Future path | Try UC eScholarship / OSTI for LBNL-affiliated Carlson 1985 copy. Search PMC for open-access astrology prediction meta-analysis. If Carlson 1985 full abstract (including finding) can be confirmed on a stable free-access URL, E-5 can be added to v1.1 as `Weak Evidence`. |

---

## 6. D-62 Gate Update — Post D-74

| Hard blocker | State after D-74 |
|-------------|-----------------|
| HB-1: any TODO_FIND_SOURCE | ⚠️ READY claims: no open slots. PARTIAL/EXCLUDED still have open slots but are excluded from v1 JSON |
| HB-2: any unverified slot | ⚠️ READY claims: all slots VERIFIED. PARTIAL/EXCLUDED excluded from v1 |
| HB-3: SOURCE_NEEDED guard blocks apply | ⚠️ Will clear at runtime for v1 JSON if only READY claims included and all source_url fields are populated from this draft |
| HB-4: evidence_body missing | ✅ All 5 READY claims have finalized evidence bodies in Section 3 |
| HB-5: reliability_score unconfirmed | ✅ All 5 READY claims have confirmed scores from source research docs |
| HB-6: launch_blocker items | ✅ All 5 READY claims have all launch_blocker evidence items populated |
| HB-7: pressure points | ✅ All 5 READY claims have pressure satisfied (B-5: USHMM denial; A-1: Godlee fraud/retraction; A-4: IPCC attribution; C-1: YouTube responsibility; D-2: pressure not required) |
| HB-8: careful-framing truths | ⚠️ Truth seed framing decisions not finalized — deferred; truths not included in D-74 scope |
| HB-9: review_state='review' | ✅ D-59 enforces; all objects marked `review_state_intended: "review"` |
| HB-10: D-59 hardening merged | ✅ PR #101 |

**Gate status for READY claims only: ✅ CLEARED for D-76 (final JSON file proposal)**

**Overall gate status: ⚠️ PARTIAL** — HB-8 (truth framing) still open; PARTIAL/EXCLUDED
claims still have open slots. The 5 READY claims can proceed to D-76 independently of
the PARTIAL/EXCLUDED claims.

---

## 7. Future Path

| Step | Task | Prerequisite |
|------|------|-------------|
| D-75 | Launch seed v1 candidate review — human reads this D-74 draft; confirms evidence bodies, framing, and source choices are accurate and appropriate | D-74 (this document) |
| D-76 | Final JSON file proposal — branch + PR creating `data/seed_claims_v2.json` for READY claims only; no direct main commit | D-75 review approval |
| D-77 | Gated dry-run import — `GET /api/import-seed?mode=dry-run`; review structured report; `source_needed_blocked: 0` confirmed | D-76 PR merged |
| D-78 | Production apply — `GET /api/import-seed?mode=apply`; all new seeds enter `review_state='review'`; moderate via admin Review queue | D-77 dry-run reviewed; explicit per-session D1/write approval |

**Truth seeds are not included in D-74.** A separate insertion draft for truth seeds
should follow once truth framing decisions for the 3 `needs-careful-framing` truths
(from D-55/D-62 HB-8) are resolved.

---

## 8. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed — D-74 is a documentation draft only |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated | ✅ Confirmed — all source_url values copied exactly from D-66/D-67/D-68/D-69/D-70 VERIFIED records |
| No paywalled-only sources promoted to VERIFIED | ✅ Confirmed — Carlson 1985, Hartmann 2006, Nickerson 1998, Nuhfer 2016 (CANDIDATE) all excluded from READY claim objects |
| No executable JSON file created | ✅ Confirmed — all claim objects in this document are non-executable draft records |

---

## D-74 Completion Record

| Item | Status |
|------|--------|
| Inclusion policy documented | ✅ |
| B-5 Holocaust — full source-inserted claim object | ✅ |
| A-1 Vaccines/autism — full source-inserted claim object | ✅ |
| A-4 CO₂/climate — full source-inserted claim object | ✅ |
| C-1 Social media algorithms — full source-inserted claim object | ✅ |
| D-2 Sleep deprivation — full source-inserted claim object | ✅ |
| B-4 PARTIAL appendix entry | ✅ |
| C-2 PARTIAL appendix entry | ✅ |
| D-3 PARTIAL appendix entry (Option A documented) | ✅ |
| D-5 PARTIAL appendix entry | ✅ |
| C-4 exclusion documented | ✅ |
| E-5 exclusion documented | ✅ |
| D-62 gate update for READY claims | ✅ — CLEARED for D-76 |
| Future path D-75 → D-78 | ✅ |
| No source_url values invented or guessed | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
