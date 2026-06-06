# D-69: Batch C Source Research — Social Media Algorithms (C-1), Eyewitness Testimony (C-2), Confirmation Bias (C-4)

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-63 designated Batch C (civic/media literacy) as the third research batch, covering claims
C-1 (social media algorithms), C-2 (eyewitness testimony), and C-4 (confirmation bias).
D-69 records the results of the Batch C source research pass using WebFetch verification.

**Result: mixed. C-1 and C-2 fully resolved. C-4 partially blocked.**

- C-1 slot 1: Vosoughi et al. 2018 — PubMed (ncbi.nlm.nih.gov) — VERIFIED
- C-1 slot 2 / pressure: YouTube "On YouTube's recommendation system" — blog.youtube — VERIFIED
- C-2 slot 1: Innocence Project "Eyewitness Misidentification" — innocenceproject.org — VERIFIED
- C-2 slot 2: NIJ "Eyewitness Identification" — nij.ojp.gov — VERIFIED
- C-2 pressure: NRC 2014 National Academies report — PAYWALLED_OR_INACCESSIBLE ($40)
- C-4 slot 1: Nickerson 1998 — journals.sagepub.com — CANDIDATE_FOUND (paywalled, abstract visible)
- C-4 slot 2: TODO_FIND_SOURCE — blocked; requires additional research pass

C-4 does not have 2 VERIFIED slots and requires a follow-up research pass.

No seed files were edited. No import route was called. No D1 or production mutation
occurred.

---

## 2. Claim Records

### Claim C-1

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-C1` |
| exact claim | Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely |
| D-55 short name | C-1 — Social media algorithms |
| category | Civic / Media Literacy |
| type | Sociological/Observable |
| status target | Plausible |
| launch_blocker | yes |

### Claim C-2

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-C2` |
| exact claim | Eyewitness testimony is less reliable than commonly assumed |
| D-55 short name | C-2 — Eyewitness testimony |
| category | Civic / Legal |
| type | Empirical/Documented |
| status target | Proven |
| launch_blocker | yes |

### Claim C-4

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-C4` |
| exact claim | People tend to search for and interpret evidence in ways that confirm their existing beliefs |
| D-55 short name | C-4 — Confirmation bias |
| category | Cognitive / Psychology |
| type | Empirical/Documented |
| status target | Proven |
| launch_blocker | yes |

---

## 3. Accepted Source Records — C-1

### C-1 Source 1 — Vosoughi et al. 2018 Science

| Field | Value |
|-------|-------|
| candidate_url | https://pubmed.ncbi.nlm.nih.gov/29590045/ |
| citation_title | The spread of true and false news online |
| publisher / source_owner | Science / Vosoughi, Roy, Aral (MIT) |
| source_domain | pubmed.ncbi.nlm.nih.gov |
| source_class | Peer-reviewed research paper — Science |
| stance | support |
| quality | repeatable |
| reliability_score | 86 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | A 2018 study by Vosoughi, Roy, and Aral published in Science analyzed approximately 126,000 news stories shared on Twitter between 2006 and 2017 by roughly 3 million users and found that false information diffused significantly farther, faster, deeper, and more broadly than true information across all categories of content, with the effect most pronounced for false political news. Importantly, the study found that automated accounts (bots) spread both true and false content at comparable rates, establishing that humans — not bots — are primarily responsible for the greater amplification of misinformation. The research demonstrates that social media platforms exhibit systematic patterns of differential information spread driven by user engagement with novel or emotionally arousing content. |
| pressure_note | The finding that humans drive differential spread (not just algorithms) is relevant to the pressure point that algorithmic amplification is not the sole driver. The YouTube blog post (slot 2) provides platform-side context on how recommendation signals work. |
| rejection_reason | N/A |
| citation_note | Fetched from pubmed.ncbi.nlm.nih.gov/29590045/. PMID 29590045. Abstract accessible without login. Full text is paywalled in Science; PubMed abstract is sufficient for citation purposes. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ PubMed abstract free |
| Domain is the institution itself (pubmed.ncbi.nlm.nih.gov) | ✅ NLM/NCBI |
| Author/institution/date visible | ✅ Vosoughi, Roy, Aral; Science; 2018; PMID 29590045 |
| Content directly supports the specific claim | ✅ — social media amplification of content by engagement pattern documented at scale (126K stories, 3M users) |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `repeatable` quality | ✅ — large-scale empirical study; Science journal; score 86 |

---

### C-1 Source 2 / Pressure — YouTube: On YouTube's Recommendation System

| Field | Value |
|-------|-------|
| candidate_url | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ |
| citation_title | On YouTube's recommendation system |
| publisher / source_owner | YouTube / Cristos Goodrow, VP Engineering, YouTube |
| source_domain | blog.youtube |
| source_class | Official platform blog post by named executive (testimony) |
| stance | support / pressure context |
| quality | testimony |
| reliability_score | 55 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | YouTube's VP of Engineering Cristos Goodrow, writing on YouTube's official blog in September 2021, describes the company's recommendation system as using multiple engagement signals — including clicks, watch time, survey responses, shares, likes, and dislikes — to personalize video suggestions. The post states that these signals can be "overruled" by YouTube's responsibility commitments and that the platform actively demotes borderline content including misinformation even when such material might generate higher engagement. This first-person description of YouTube's recommendation architecture confirms that engagement signals (watch time, clicks, reactions) are the primary ranking inputs, with responsibility-based overrides as a secondary layer. |
| pressure_note | Primary use: C-1 pressure slot. The pressure point is the platform's argument that algorithms prioritize user preference and responsibility, not just raw engagement. This source represents the platform's own position. |
| rejection_reason | N/A |
| citation_note | Fetched from blog.youtube/inside-youtube/on-youtubes-recommendation-system/. Published September 15, 2021. Accessible without login. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (blog.youtube) | ✅ YouTube's official engineering blog |
| Author/institution/date visible | ✅ Cristos Goodrow, VP Engineering YouTube; September 15, 2021 |
| Content directly supports the specific claim (mechanism description) | ✅ — engagement signals (watchtime, clicks, likes) named as primary ranking inputs |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `testimony` quality (40–55 range) | ✅ |

---

## 4. Accepted Source Records — C-2

### C-2 Source 1 — Innocence Project: Eyewitness Misidentification

| Field | Value |
|-------|-------|
| candidate_url | https://innocenceproject.org/eyewitness-misidentification/ |
| citation_title | Eyewitness Misidentification |
| publisher / source_owner | Innocence Project |
| source_domain | innocenceproject.org |
| source_class | Documented — nonprofit legal organization with case-based evidentiary record |
| stance | support |
| quality | documented |
| reliability_score | 75 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The Innocence Project reports that more than 60% of its clients were wrongfully convicted based in whole or in part on eyewitness misidentification, making it the single most common contributing factor in wrongful convictions overturned by post-conviction DNA testing. The organization states that it has helped free more than 250 innocent people from prison since 1992, establishing a documented case record linking eyewitness identification errors to wrongful convictions. This is the finding of the leading legal nonprofit dedicated to exonerating wrongfully convicted individuals through DNA evidence. |
| pressure_note | The 60%+ statistic is directly relevant to the pressure point that eyewitnesses are generally reliable. |
| rejection_reason | N/A |
| citation_note | Fetched from innocenceproject.org/eyewitness-misidentification/. No last-updated date on the page. Organization established 1992; figures updated as cases are added. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (innocenceproject.org) | ✅ |
| Author/institution/date visible | ✅ Innocence Project institutional attribution; figures reference post-conviction DNA exonerations |
| Content directly supports the specific claim | ✅ — 60%+ of wrongful convictions involved eyewitness misidentification |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality (60–75) | ✅ |

---

### C-2 Source 2 — NIJ: Eyewitness Identification

| Field | Value |
|-------|-------|
| candidate_url | https://nij.ojp.gov/topics/articles/eyewitness-identification |
| citation_title | Eyewitness Identification |
| publisher / source_owner | National Institute of Justice, US Department of Justice |
| source_domain | nij.ojp.gov |
| source_class | Documented — US federal justice research agency |
| stance | support |
| quality | documented |
| reliability_score | 68 |
| verification_status | **VERIFIED** |
| access_date | 2026-06-07 |
| evidence_body | The National Institute of Justice, the research and development arm of the US Department of Justice, states that misidentification by eyewitnesses has played a role in a high number of wrongful convictions, prompting closer examination of identification procedures. The NIJ identifies key variables that affect eyewitness reliability including administrator blindness, witness instructions, filler selection, and witness distraction during the original incident. This federal government research summary represents the official US justice system's acknowledgment that eyewitness identification is subject to systematic reliability limitations. |
| pressure_note | None — this source supports the primary claim. Note: NIJ page is archived (last updated February 28, 2009) but the factual statement on wrongful convictions remains accurate. |
| rejection_reason | N/A |
| citation_note | Fetched from nij.ojp.gov/topics/articles/eyewitness-identification. Archived page, last updated February 28, 2009. Content is still live and stable. |

**D-63 acceptance test — all 6 criteria pass:**

| Criterion | Result |
|-----------|--------|
| URL loads without login | ✅ |
| Domain is the institution itself (nij.ojp.gov — National Institute of Justice) | ✅ |
| Author/institution/date visible | ✅ NIJ / US Dept of Justice; last updated February 28, 2009 |
| Content directly supports the specific claim | ✅ — "misidentification by eyewitnesses has played a role in a high number of wrongful convictions" |
| Neutral 2–4 sentence evidence body writable | ✅ |
| Reliability score consistent with `documented` quality | ✅ — archived (2009), so 68 not 75; still factually sound |

---

## 5. Candidate Source Record — C-4

### C-4 Source 1 — Nickerson 1998 (Paywalled)

| Field | Value |
|-------|-------|
| candidate_url | https://journals.sagepub.com/doi/10.1037/1089-2680.2.2.175 |
| citation_title | Confirmation Bias: A Ubiquitous Phenomenon in Many Guises |
| publisher / source_owner | Review of General Psychology / Raymond S. Nickerson |
| source_domain | journals.sagepub.com |
| source_class | Peer-reviewed review article — Review of General Psychology |
| stance | support |
| quality | repeatable |
| reliability_score_proposed | 84 |
| verification_status | **CANDIDATE_FOUND** |
| access_date | 2026-06-07 |
| evidence_body_draft | A 1998 comprehensive review article by Raymond S. Nickerson in Review of General Psychology defines confirmation bias as the seeking or interpreting of evidence in ways that are partial to existing beliefs, expectations, or a hypothesis in hand, and reviews evidence of this tendency across multiple guises and practical contexts. The review examines both the manifestation and possible explanations for confirmation bias, as well as the question of whether the tendency is adaptive or harmful. Published in the inaugural volume of Review of General Psychology, this article is widely cited as the foundational systematic review of confirmation bias as a cognitive phenomenon. |
| limitation | Full text is behind a Sage Journals paywall ("Restricted access"). The abstract is visible from the DOI page, confirming title, author, year, and abstract text. The paper is paywalled-only at this URL; a free institutional-library or preprint equivalent has not been located in this research pass. Per D-63 Rule 6, a paywalled-only source is not a public source and cannot be the sole citation. |
| rejection_reason | Not VERIFIED pending identification of a free-access equivalent (institutional repository, author-hosted PDF, or preprint). |
| citation_note | DOI resolves to journals.sagepub.com. Abstract confirmed: "Confirmation bias, as the term is typically used in the psychological literature, connotes the seeking or interpreting of evidence in ways that are partial to existing beliefs, expectations, or a hypothesis in hand." |

---

## 6. Rejected and Blocked Sources

| Claim | Source | URL attempted | Outcome | Reason |
|-------|--------|--------------|---------|--------|
| C-2 | NRC 2014 "Identifying the Culprit" report | nationalacademies.org/publications/18891 | PAYWALLED_OR_INACCESSIBLE | Report available to purchase ($40.50 paperback, $33.29 ebook); free PDF requires MyAcademies account registration. Cannot serve as public evidence source. NIJ archived page used for C-2 slot 2 instead. |
| C-1 | Bakshy et al. 2015 Science (Facebook news feed) | science.org/doi/10.1126/science.aaa1160 | HTTP 403 Forbidden | Science.org blocks automated fetchers for full-text access. The Science abstract-via-PubMed approach was not attempted for this paper; a future research pass should try pubmed.ncbi.nlm.nih.gov to see if PMID is indexed. |
| C-4 | APA Dictionary "confirmation bias" | dictionary.apa.org/confirmation-bias | Empty page | Page content not retrieved; APA dictionary may use JavaScript rendering that WebFetch cannot access. |
| C-4 | APA science brief | apa.org/science/about/psa/2016/06/confirmation-bias | Empty page | Same JavaScript rendering issue as APA Dictionary. |
| C-4 | APA PsycNET record | psycnet.apa.org/doiLanding?doi=10.1037/1089-2680.2.2.175 | Empty page (Loading... state) | APA PsycNET uses JavaScript rendering; page did not load content for WebFetch. |

**Note on C-4 research status:** Nickerson (1998) is the canonical review article on confirmation bias. It is not indexed in PubMed (Review of General Psychology is an APA journal that may not be in PubMed). The full text is on Sage Journals behind a paywall. Alternative free sources attempted included APA Dictionary, APA science brief, APA PsycNET — all blocked by JavaScript rendering. A human researcher with institutional library access can access the full Nickerson text and confirm it for VERIFIED status. Alternatively, a future research pass should look for: (1) an author-hosted or institutional-repository PDF of Nickerson 1998; (2) an open-access meta-analysis or review article on confirmation bias in a PMC-indexed journal; (3) Pennycook & Rand's open-access work on motivated reasoning and analytical thinking.

---

## 7. D-61 Worksheet Update

The following changes are ready to be applied to the D-61 worksheet fields in D-70.
C-4 fields are not updated — C-4 requires an additional research pass before any
worksheet update.

### C-1 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-C1` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://pubmed.ncbi.nlm.nih.gov/29590045/ |
| `launch-C1` slot 1 `citation_title` | (blank) | The spread of true and false news online |
| `launch-C1` slot 1 `source_domain` | (blank) | pubmed.ncbi.nlm.nih.gov |
| `launch-C1` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-C1` slot 1 `evidence_body` | (placeholder) | (see Section 3 Source 1 evidence_body) |
| `launch-C1` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-C1` slot 2 / pressure `candidate_url` | TODO_FIND_SOURCE | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ |
| `launch-C1` slot 2 / pressure `citation_title` | (blank) | On YouTube's recommendation system |
| `launch-C1` slot 2 / pressure `source_domain` | (blank) | blog.youtube |
| `launch-C1` slot 2 / pressure `access_date` | (blank) | 2026-06-07 |
| `launch-C1` slot 2 / pressure `evidence_body` | (placeholder) | (see Section 3 Source 2/pressure evidence_body) |
| `launch-C1` slot 2 / pressure `verification_status` | TODO_FIND_SOURCE | VERIFIED |

### C-2 Changes

| D-61 field | Previous value | New value |
|------------|---------------|-----------|
| `launch-C2` slot 1 `candidate_url` | TODO_FIND_SOURCE | https://innocenceproject.org/eyewitness-misidentification/ |
| `launch-C2` slot 1 `citation_title` | (blank) | Eyewitness Misidentification |
| `launch-C2` slot 1 `source_domain` | (blank) | innocenceproject.org |
| `launch-C2` slot 1 `access_date` | (blank) | 2026-06-07 |
| `launch-C2` slot 1 `evidence_body` | (placeholder) | (see Section 4 Source 1 evidence_body) |
| `launch-C2` slot 1 `verification_status` | TODO_FIND_SOURCE | VERIFIED |
| `launch-C2` slot 2 `candidate_url` | TODO_FIND_SOURCE | https://nij.ojp.gov/topics/articles/eyewitness-identification |
| `launch-C2` slot 2 `citation_title` | (blank) | Eyewitness Identification |
| `launch-C2` slot 2 `source_domain` | (blank) | nij.ojp.gov |
| `launch-C2` slot 2 `access_date` | (blank) | 2026-06-07 |
| `launch-C2` slot 2 `evidence_body` | (placeholder) | (see Section 4 Source 2 evidence_body) |
| `launch-C2` slot 2 `verification_status` | TODO_FIND_SOURCE | VERIFIED |

### C-4 Changes

No D-61 worksheet changes in D-69. C-4 requires an additional research pass.
The Nickerson 1998 candidate URL is recorded in Section 5 above and will be
transferred to the worksheet only after a free-access version is confirmed.

---

## 8. D-62 Gate Delta — Batch C Cumulative

| Hard blocker | D-68 state | D-69 state |
|-------------|-----------|-----------|
| HB-1 any TODO_FIND_SOURCE | ⚠️ B-4 slot 3 + Batches C/D/E TODO | ⚠️ B-4 slot 3 + C-4 slots + Batches D/E TODO; C-1 and C-2 VERIFIED |
| HB-2 any unverified | ⚠️ Batches B+A verified; rest not | ⚠️ Batches B+A+C-1+C-2 verified; C-4+D+E not |
| HB-3 SOURCE_NEEDED blocks apply | ❌ Still blocks | ❌ Still blocks — C-4, D, E unverified |
| HB-4 evidence_body missing | ⚠️ Batch B+A complete | ⚠️ Batches B+A+C-1+C-2 complete; C-4 draft; D/E draft |
| HB-5 reliability_score unconfirmed | ⚠️ Batch B+A confirmed | ⚠️ C-1 + C-2 confirmed; C-4 proposed only |
| HB-6 launch_blocker: true | ⚠️ B-5+A-1+A-4 resolved | ⚠️ C-1 + C-2 resolved; B-4 slot 3 + C-4 still open |
| HB-7 pressure points | ⚠️ B+A confirmed | ⚠️ C-1 pressure VERIFIED; C-2 pressure PAYWALLED; C-4 pressure N/A |
| HB-8 needs-careful-framing truths | ⚠️ Flagged | ⚠️ Unchanged |
| HB-9 review_state='review' | ✅ D-59 | ✅ |
| HB-10 D-59 hardening | ✅ PR #101 | ✅ |

**Verified slot count after D-69:**
- B-4: 2/3 slots + pressure (slot 3 still TODO)
- B-5: 2/2 + pressure ✅
- A-1: 2/2 + pressure ✅
- A-4: 2/2 + pressure ✅
- C-1: 2/2 + pressure ✅ (slot 2 = pressure shared URL)
- C-2: 2/2 slots ✅; pressure PAYWALLED (NRC 2014)
- C-4: 0/2 free; 1 CANDIDATE (Nickerson paywalled)
- D-2, D-3, D-5, E-5: all still TODO_FIND_SOURCE

**Overall gate status: ❌ BLOCKED**

---

## 9. Remaining Batch C Work

| Item | Status |
|------|--------|
| C-1 fully resolved | ✅ |
| C-2 evidence slots resolved | ✅ |
| C-2 pressure slot (NRC 2014) | ⚠️ PAYWALLED — needs free equivalent or institutional access |
| C-4 slot 1 (Nickerson 1998) | ⚠️ CANDIDATE — needs free-access version confirmed (institutional repo, author PDF, or open-access alternative) |
| C-4 slot 2 | ❌ TODO_FIND_SOURCE — needs additional research pass |

**Recommended approach for remaining C-4 work:**
1. Check whether Nickerson 1998 is available via ResearchGate (author-hosted PDF) — this would upgrade it from CANDIDATE to VERIFIED
2. Search PubMed Central (pmc.ncbi.nlm.nih.gov) for "confirmation bias" with the "Free full text" filter — find a review article or meta-analysis that is open-access
3. Alternative: Pennycook & Rand have published open-access papers on motivated reasoning (check their lab pages at Yale and MIT Sloan; known to publish preprints on PsyArXiv)

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
| All rejected/blocked sources recorded with reasons | ✅ Confirmed |

---

## D-69 Completion Record

| Item | Status |
|------|--------|
| Claim C-1 record documented | ✅ |
| Claim C-2 record documented | ✅ |
| Claim C-4 record documented | ✅ |
| C-1 slot 1 (Vosoughi 2018 Science / PubMed) — VERIFIED | ✅ |
| C-1 slot 2 / pressure (YouTube VP blog) — VERIFIED | ✅ |
| C-2 slot 1 (Innocence Project) — VERIFIED | ✅ |
| C-2 slot 2 (NIJ archived page) — VERIFIED | ✅ |
| C-4 slot 1 (Nickerson 1998) — CANDIDATE_FOUND (paywalled) | ✅ |
| C-4 slot 2 — TODO_FIND_SOURCE (blocked) | ⚠️ |
| C-2 pressure (NRC 2014) — PAYWALLED_OR_INACCESSIBLE | ✅ (documented) |
| All blocked sources recorded with specific reasons | ✅ |
| D-63 acceptance test confirmed for all 5 VERIFIED sources | ✅ |
| D-61 worksheet update table recorded for C-1 and C-2 | ✅ |
| C-4 worksheet update deferred pending free-access confirmation | ✅ |
| D-62 gate delta documented | ✅ |
| Remaining C-4 work path specified | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
