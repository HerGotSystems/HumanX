# D-71: E-5 Astrology Source Research — Blocked / Partial

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-63 Batch E covers claim E-5: "Astrology cannot reliably predict personality traits or
life outcomes beyond chance." D-71 records the result of the first E-5 source research
pass, conducted externally and reported here for the record.

**Result: 0 sources VERIFIED. 2 sources CANDIDATE_FOUND. Batch E remains BLOCKED.**

- Carlson 1985 Nature — CANDIDATE_FOUND — direct Nature publisher page not yet captured
- Hartmann/Reuter/Nyborg 2006 — CANDIDATE_FOUND — DOI/publisher page not yet captured

Neither candidate can be accepted until a direct official publisher or institutional page
is fetched and confirmed to load without login, with author, journal, and date visible on
the page per the D-63 source acceptance test (all 9 criteria required).

No D-61 worksheet fields move to VERIFIED status in D-71.
No seed files were edited. No import route was called. No D1 or production mutation
occurred.

---

## 2. Claim Record

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-E5` |
| exact claim | Astrology cannot reliably predict personality traits or life outcomes beyond chance |
| D-55 short name | E-5 — Astrology personality prediction |
| category | Untestable / Belief |
| type | Empirical (testable component) |
| status target | Weak Evidence (not Disproven — honest grading per D-63 notes) |
| launch_blocker | yes |

**Note on status target:** D-63 specifies that E-5 should be graded `Weak Evidence`,
not `Disproven`. The Carlson 1985 study tested a specific controlled condition; it does
not establish a universal negative. The honest verdict is that the predictive claim lacks
replicated support under double-blind conditions, not that the claim is logically impossible.

---

## 3. Candidate Source Records

### Candidate 1 — Carlson 1985, Nature: "A double-blind test of astrology"

| Field | Value |
|-------|-------|
| candidate_url | NOT YET CAPTURED — see blocker note |
| citation_title | A double-blind test of astrology |
| author | Shawn Carlson |
| publisher / source_owner | Nature |
| publication | Nature, Volume 318, pages 419–425, 1985 |
| DOI | 10.1038/318419a0 |
| preferred source_domain | nature.com |
| source_class | Peer-reviewed journal article — Nature |
| stance | pressure (primary empirical test against astrology's predictive validity) |
| quality | repeatable |
| reliability_score_proposed | 88 |
| verification_status | **CANDIDATE_FOUND — not VERIFIED** |
| access_date | — (not yet confirmed) |
| evidence_body_draft | A 1985 double-blind study by Shawn Carlson published in Nature tested whether professional astrologers could correctly match natal charts to California Psychological Inventory personality profiles better than chance. Under the agreed test conditions, astrologers did not perform significantly better than chance, despite having reviewed the experimental protocol in advance and agreed it was fair. The study remains one of the most rigorously designed empirical tests of astrological prediction and is cited across sceptical and astrological literature alike. |
| blocker | Direct Nature publisher page at nature.com has not been fetched and confirmed via WebFetch. The DOI (10.1038/318419a0) is known but not yet verified to load without a paywall in the current research pass. Nature articles from 1985 are sometimes freely accessible as archive content; this requires direct confirmation. |
| next_action | Navigate directly to `https://www.nature.com/articles/318419a0` and confirm: (1) page loads without login, (2) author Shawn Carlson visible, (3) "Nature 318" and "1985" visible, (4) abstract confirms the double-blind test and chance-level result. If paywalled, check whether PubMed, PubMed Central, or a free preprint mirror carries an open-access version. |

---

### Candidate 2 — Hartmann / Reuter / Nyborg 2006: "The relationship between date of birth and individual differences in personality and general intelligence"

| Field | Value |
|-------|-------|
| candidate_url | NOT YET CAPTURED — see blocker note |
| citation_title | The relationship between date of birth and individual differences in personality and general intelligence: A large-scale study |
| authors | Hartmann, Reuter, Nyborg |
| publisher / source_owner | Personality and Individual Differences (Elsevier) |
| publication | Personality and Individual Differences, Volume 40, Issue 7, 2006, pages 1349–1362 |
| DOI | 10.1016/j.paid.2005.11.017 |
| preferred source_domain | sciencedirect.com or pubmed.ncbi.nlm.nih.gov |
| source_class | Peer-reviewed journal article |
| stance | pressure / support (tests whether birth date predicts personality/intelligence — relevant to zodiac-sign claims) |
| quality | repeatable |
| reliability_score_proposed | 78 |
| verification_status | **CANDIDATE_FOUND — not VERIFIED** |
| access_date | — (not yet confirmed) |
| evidence_body_draft | A large-scale study by Hartmann, Reuter, and Nyborg tested whether date of birth is associated with individual differences in personality traits and general intelligence in a Danish population sample. The study did not find that birth date reliably predicts the kind of personality differences attributed to astrological sun signs, supporting the position that zodiac-style date-of-birth groupings lack predictive validity for individual differences. |
| blocker | Elsevier / ScienceDirect has consistently returned HTTP 403 for automated fetchers in this research pass (documented in D-70 for multiple psychology papers). The DOI (10.1016/j.paid.2005.11.017) is known but not confirmed accessible. A PubMed abstract page (pubmed.ncbi.nlm.nih.gov) may exist and would serve as the free-access equivalent per D-63 rules. The PMID is not yet known. |
| next_action | Try PubMed search for "Hartmann Reuter Nyborg 2006 date of birth personality" to find the PMID. If found, fetch `https://pubmed.ncbi.nlm.nih.gov/[PMID]/` directly and confirm: (1) loads without login, (2) all three authors visible, (3) 2006 date and journal name visible, (4) abstract confirms the date-of-birth / personality null result. Alternatively check PubMed Central for an open-access version. If ScienceDirect returns 403, PubMed abstract is the acceptable free-access equivalent per D-63 Section 3. |
| limitation | Candidate 2 is less central to E-5 than Carlson 1985. Its relevance is to the narrower claim that birth date predicts personality (the zodiac-sign mechanism). If Carlson 1985 is verified with a second independent source, Hartmann 2006 may be used as the E-5 slot 2 or as a supplementary pressure source. If ScienceDirect remains blocked and no PubMed PMID is found, an alternative second source may be needed. |

---

## 4. Pressure Source Requirement (E-5)

D-63 specifies: "E-5: Season-of-birth / school-entry cutoff study (Musch & Grondin or
equivalent) for the 'real seasonal effect, wrong explanation' pressure point."

The pressure point is that season of birth *does* correlate with some measurable outcomes
(e.g., relative age effect in school sports, academic outcomes) but through entirely
non-astrological mechanisms (school-entry cutoffs, prenatal nutrition). This differentiates
the genuine seasonal-effect literature from astrology's causal claims.

| Field | Value |
|-------|-------|
| Pressure source target | Musch & Grondin 2001 "Unequal Competition as an Impediment to Personal Development" — Developmental Review — or equivalent relative-age-effect study |
| DOI | 10.1006/drev.2000.0516 |
| verification_status | NOT YET ATTEMPTED |
| next_action | Fetch `https://doi.org/10.1006/drev.2000.0516` → Elsevier / ScienceDirect. If 403, search PubMed for Musch & Grondin 2001 to find PMID. This is a well-known paper in sports psychology; open-access versions may exist on ResearchGate or author pages. |
| notes | The D-63 Barnum-effect pressure is noted as definitional — no URL required. Only the seasonal-birth / relative-age pressure requires an external source. |

---

## 5. Rejected Source Classes (This Pass)

Per D-63 Section 3 and D-56 source class rules, the following classes were pre-rejected
without fetching:

| Source class | Reason for rejection |
|-------------|---------------------|
| Wikipedia articles on Carlson 1985 or astrology | AI summary / aggregator — not primary evidence per D-63 criterion 8 |
| Non-English Wikipedia mirrors | Same — aggregator / not independently verifiable |
| Search engine result snippets | Not a primary source; snippets are not independently verifiable pages |
| ML / AI-generated "humorous" astrology papers | Not peer-reviewed scientific research; not relevant to the empirical claim |
| Any page without direct publisher / official citation | Fails D-63 criterion 2 (stable domain belonging to recognised institution or journal) |
| Blog posts or commentary articles about Carlson | Not primary evidence — secondary commentary, not the study itself |

---

## 6. D-62 Gate Status — E-5 After D-71

| Hard blocker | Status |
|-------------|--------|
| HB-1: any TODO_FIND_SOURCE | ⚠️ E-5 all slots remain TODO/CANDIDATE |
| HB-2: any unverified slot | ⚠️ E-5 0 VERIFIED; 2 CANDIDATE |
| HB-3: SOURCE_NEEDED guard blocks apply | ❌ Still blocks — E-5 and other open slots |
| HB-4: evidence_body missing | ⚠️ E-5 drafts written but not VERIFIED-locked |
| HB-5: reliability_score unconfirmed | ⚠️ E-5 scores proposed but not confirmed |
| HB-6: launch_blocker | ⚠️ E-5 still open; D-3 slot 2, D-5 slot 2, C-4 also open |
| HB-7: pressure points | ⚠️ E-5 pressure (Musch & Grondin) not yet attempted |
| HB-8: careful-framing truths | ⚠️ Unchanged |
| HB-9: review_state='review' enforced | ✅ D-59 |
| HB-10: D-59 hardening merged | ✅ PR #101 |

**E-5 VERIFIED slot count: 0 / 2 (+ 0 / 1 pressure)**
**Overall gate status: ❌ BLOCKED**

---

## 7. Cumulative Verified Slot Count After D-71

| Claim | Evidence slots | Status |
|-------|---------------|--------|
| B-4 — smoking / lung cancer | 2 / 3 | ⚠️ slot 3 TODO |
| B-5 — Holocaust | 3 / 3 + pressure | ✅ FULLY RESOLVED |
| A-1 — vaccines / autism | 3 / 3 | ✅ FULLY RESOLVED |
| A-4 — CO₂ / climate | 3 / 3 | ✅ FULLY RESOLVED |
| C-1 — social media algorithms | 3 / 3 | ✅ FULLY RESOLVED |
| C-2 — eyewitness testimony | 2 / 2 (pressure BLOCKED) | ⚠️ pressure needed |
| C-4 — confirmation bias | 0 / 2 | ❌ BLOCKED |
| D-2 — sleep deprivation | 2 / 2 | ✅ FULLY RESOLVED |
| D-3 — Dunning-Kruger | 1 / 2 + CANDIDATE | ⚠️ slot 2 CANDIDATE |
| D-5 — anchoring bias | 1 / 2 | ⚠️ slot 2 BLOCKED |
| E-5 — astrology | 0 / 2 + 0 / 1 pressure | ❌ BLOCKED |

**Total VERIFIED: 20 of ~30 required slots (~67%)**
**Claims fully resolved: 5 of 11**
**Claims with at least 1 VERIFIED slot: 9 of 11**
**Claims with 0 VERIFIED slots: 2 (C-4, E-5)**

---

## 8. Required Next Research Actions

| Priority | Action |
|----------|--------|
| 1 | Fetch `https://www.nature.com/articles/318419a0` — confirm Carlson 1985 loads without paywall; if paywalled check PubMed/PMC for open-access version |
| 2 | Search PubMed for Hartmann/Reuter/Nyborg 2006 PMID; fetch abstract page; confirm date-of-birth / personality null result |
| 3 | Fetch DOI for Musch & Grondin 2001 (10.1006/drev.2000.0516) or find PubMed PMID for E-5 pressure source |
| 4 | Continue blocked D-3 slot 2 (Gignac 2020 or Ehrlinger 2008 — Elsevier; requires institutional access) |
| 5 | Continue blocked D-5 slot 2 (anchoring — Wiley 402; try PMC free text search) |
| 6 | Continue blocked C-4 slots 1–2 (Nickerson 1998 paywalled; find open-access confirmation bias review) |
| 7 | Continue blocked C-2 pressure (NRC 2014 eyewitness report — $40 paywall; find free equivalent) |
| 8 | Continue blocked B-4 slot 3 (Doll & Hill 1950 BMJ or 1964 SG Report specific page) |

Once E-5 evidence slots and pressure are VERIFIED, proceed to D-72 (source insertion
draft) to transfer all VERIFIED records into the D-61 worksheet and D-57 JSON draft.

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
| No URLs fabricated | ✅ Confirmed — both candidates record known DOIs without inventing page content |
| All blocked/rejected sources documented | ✅ Confirmed |

---

## D-71 Completion Record

| Item | Status |
|------|--------|
| E-5 claim record documented | ✅ |
| Carlson 1985 Nature — CANDIDATE_FOUND record with DOI, blocker, next action | ✅ |
| Hartmann/Reuter/Nyborg 2006 — CANDIDATE_FOUND record with DOI, blocker, next action | ✅ |
| E-5 pressure source (Musch & Grondin 2001) — identified, NOT YET ATTEMPTED | ✅ |
| Rejected source classes documented | ✅ |
| D-62 gate delta documented | ✅ |
| Cumulative verified slot count table updated | ✅ |
| Required next research actions listed in priority order | ✅ |
| D-61 worksheet fields: no VERIFIED moves in D-71 | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
