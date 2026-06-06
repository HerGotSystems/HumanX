# D-65: Direct Official Source Target Map

Date: 2026-06-06
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No URLs inserted. No import routes called.

---

## 1. Summary

D-64 recorded that web-search-based source research returned Wikipedia, news summaries,
mirrors, and general overview pages before reaching stable primary sources. All were
rejected. Zero evidence slots were cleared.

D-65 changes the approach: **direct navigation only**. The researcher opens a known
official institution's website and locates the specific document, study, or data page
from within that site. Search engines are not the starting point — they are a last resort
for finding a DOI or department path when the institution's own site navigation is unclear.

**No URL is accepted in this document.** This is a target map and acceptance specification
only. URLs are added to the D-61 worksheet only after manual verification. No source_url
values are inserted anywhere in this batch.

| What changes in D-65 | Detail |
|----------------------|--------|
| Research entry point | Official domain directly (e.g. `cdc.gov`, `yadvashem.org`) — not a search engine |
| Candidate acceptance | Only after opening the URL directly and confirming all 6 D-63 acceptance criteria |
| Homepages | Not accepted as evidence unless the homepage itself is the primary document |
| Summary pages | Only accepted if the page contains the specific data/finding that supports the claim, not a general topic overview |
| Search engine results | May be used to find a DOI or a department path inside an official site; the landing URL is then verified directly |

---

## 2. Direct Source Target Rules

| Rule | Detail |
|------|--------|
| **Start from the institution domain** | Type the institution's known domain directly into the browser. Do not click a search result for an official page without first confirming the URL resolves to the institution itself. |
| **Use the site's own search** | Once on the official domain, use the site's internal search bar to find the specific document or data page. Record the URL of the specific page found, not the search results page. |
| **Record exact page title and publisher** | The citation record must include the exact title as shown on the target page, not a paraphrase. The publisher/institution name must be visible on the page. |
| **Reject homepages** | `cdc.gov`, `yadvashem.org`, `bmj.com` alone are not evidence. Only a specific document, article, report, or data page within the site is accepted. |
| **Reject summaries that do not quote the claim** | A health education page that says "smoking causes cancer" without linking to the underlying study is `media`-class at best and insufficient as the primary evidence source for a `Proven` verdict. Navigate to the specific study or report. |
| **Prefer stable PDFs or dated encyclopedia entries** | Official PDFs (e.g. published reports, archived documents) and named/dated encyclopedia entries have stable citation characteristics. Prefer these over web pages that may update without notice. |
| **Record access date** | Every accepted source must have an access date — the day the URL was confirmed live and the content verified. This is required for the D-63 citation record. |
| **No guessed URLs** | Do not construct URLs by hand (e.g. guessing a file path). Every URL must be reached by navigating from a known page or confirmed via a DOI resolver. |

---

## 3. Batch B Direct Source Targets

### B-4: Smoking causes lung cancer

Three evidence slots required. For each, the target institution, source class, what the
page must show, and the acceptance and rejection tests are specified below.

---

#### B-4 Slot 1 — Doll & Hill 1950 / BMJ

| Field | Value |
|-------|-------|
| Target institution | British Medical Journal / BMJ Publishing Group |
| Domain to open directly | `bmj.com` |
| Within-site navigation | BMJ site search: "Doll Hill 1950 smoking lung cancer" — or use PubMed at `pubmed.ncbi.nlm.nih.gov` to find the indexed citation and DOI, then resolve the DOI to the BMJ page |
| Source class | `repeatable` (original peer-reviewed cohort study) |
| Claim slot | B-4 Evidence slot 1 |
| What the page must show | The specific 1950 BMJ paper by Richard Doll and A. Bradford Hill; the paper's title, authors, journal, and year visible; the study's finding on the association between smoking and lung cancer |
| Acceptance test | URL resolves to the BMJ archive or PubMed record for this specific paper; author names (Doll, Hill), publication year (1950), journal (British Medical Journal) are visible; content describes the study design and finding |
| Rejection test | Reject if: page is a news article about the paper; page is a Wikipedia article; page is a secondary review article that cites Doll & Hill but is not the paper itself; page requires institutional login with no free abstract available |
| Reliability score if VERIFIED | 88 |
| D-61 field to fill | `launch-B4` slot 1 `candidate_url`, `citation_title`, `source_domain`, `access_date`, `evidence_body`, `verification_status` |
| Alternative if BMJ paywalled | PubMed abstract at `pubmed.ncbi.nlm.nih.gov` is free; the abstract alone may be sufficient for `documented` class (score ~72); note if using abstract-only rather than full paper |

---

#### B-4 Slot 2 — US Surgeon General 1964 Report

| Field | Value |
|-------|-------|
| Target institution | Office of the Surgeon General / US Department of Health and Human Services |
| Domain to open directly | `surgeongeneral.gov` — Reports section; alternatively `cdc.gov` → Tobacco → History |
| Within-site navigation | Navigate to: surgeongeneral.gov → Reports → "Smoking and Health (1964)" — the first Surgeon General's report on smoking; or search surgeongeneral.gov for "1964" |
| Source class | `documented` (official US government report) |
| Claim slot | B-4 Evidence slot 2 |
| What the page must show | The 1964 Report "Smoking and Health: Report of the Advisory Committee to the Surgeon General"; publication date 1964; the report's conclusion on causation between smoking and lung cancer visible or described |
| Acceptance test | URL resolves to a page on surgeongeneral.gov or a direct DHHS/CDC historical page; report title "Smoking and Health" and year 1964 are visible; page is not a news article about the report |
| Rejection test | Reject if: page is a CDC/HHS general tobacco awareness page without the specific 1964 report; page is a news anniversary article; page is a Wikipedia article on the report |
| Reliability score if VERIFIED | 80 |
| D-61 field to fill | `launch-B4` slot 2 `candidate_url`, `citation_title`, `source_domain`, `access_date`, `evidence_body`, `verification_status` |
| Alternative if surgeongeneral.gov page changes | The 1964 report is also referenced in CDC's MMWR historical supplements; a CDC-hosted reference page citing the report document is acceptable as `documented` |

---

#### B-4 Slot 3 — Longitudinal cohort / Cancer epidemiology data

| Field | Value |
|-------|-------|
| Target institution | National Cancer Institute SEER program, or Cancer Research UK statistics |
| Domain to open directly | `seer.cancer.gov` (NCI SEER) or `cancerresearchuk.org` → Cancer statistics → Lung cancer |
| Within-site navigation | NCI SEER: navigate to seer.cancer.gov → Cancer Statistics → Lung and Bronchus → Risk Factors; or Cancer Research UK: cancerresearchuk.org → Cancer information → Types of cancer → Lung cancer → Causes |
| Source class | `documented` (official government cancer statistics or registered charity research page with citations) |
| Claim slot | B-4 Evidence slot 3 |
| What the page must show | Specific data on smoking as a cause/risk factor for lung cancer; ideally a relative risk figure, population-attributable fraction, or stated causal link with citation to underlying studies |
| Acceptance test | URL resolves to a specific statistics or risk-factor page on seer.cancer.gov or cancerresearchuk.org; the page names smoking as a cause with supporting data or citation; access date recorded |
| Rejection test | Reject if: page is a general lung cancer overview without risk-factor data; page is on a third-party health information site (WebMD, NHS summaries are acceptable as `media` only, not `documented`); page does not include data or citations |
| Reliability score if VERIFIED | 78 |
| D-61 field to fill | `launch-B4` slot 3 `candidate_url`, `citation_title`, `source_domain`, `access_date`, `evidence_body`, `verification_status` |
| Note | Cancer Research UK is acceptable as `documented` (registered charity with editorial review); NHS pages are `media`-class only — do not use NHS as sole source for slot 3 |

---

### B-5: The Holocaust resulted in the murder of approximately six million Jews

Two evidence slots and one pressure source required.

---

#### B-5 Slot 1 — Nuremberg documentation

| Field | Value |
|-------|-------|
| Target institution | Yale Avalon Project, Lillian Goldman Law Library, Yale Law School |
| Domain to open directly | `avalon.law.yale.edu` |
| Within-site navigation | Navigate to avalon.law.yale.edu → Subject index → Nuremberg War Crimes Trials; look for the International Military Tribunal documents, the Indictment, or the Judgment document which contains findings on victim numbers |
| Source class | `documented` (primary legal/historical document — official trial record) |
| Claim slot | B-5 Evidence slot 1 |
| What the page must show | A specific Nuremberg trial document (indictment, judgment, or prosecution exhibit) that references the systematic murder of Jewish victims and/or estimates of victim numbers; author/institution (International Military Tribunal) and date (1945–1946) visible |
| Acceptance test | URL resolves to a specific document page on avalon.law.yale.edu; the document is an official trial record, not a summary; the content is directly relevant to the Holocaust death toll or systematic murder |
| Rejection test | Reject if: page is the Yale Avalon Project homepage; page is a Wikipedia article on the Nuremberg trials; page is a secondary history site that links to Avalon but is not the Yale site itself |
| Reliability score if VERIFIED | 85 |
| D-61 field to fill | `launch-B5` slot 1 `candidate_url`, `citation_title`, `source_domain`, `access_date`, `evidence_body`, `verification_status` |
| Alternative institution | United States Holocaust Memorial Museum (ushmm.org) — specifically the Holocaust Encyclopedia article on "documenting numbers of victims" — if Yale Avalon navigation proves difficult |

---

#### B-5 Slot 2 — Yad Vashem research / victim count methodology

| Field | Value |
|-------|-------|
| Target institution | Yad Vashem — The World Holocaust Remembrance Center |
| Domain to open directly | `yadvashem.org` |
| Within-site navigation | Navigate to yadvashem.org → Research → Holocaust Research → Statistical data; or yadvashem.org → About the Holocaust → The Holocaust — an introduction → Facts and Figures |
| Source class | `documented` (official memorial and research institution with named methodology) |
| Claim slot | B-5 Evidence slot 2 |
| What the page must show | Yad Vashem's published methodology for estimating the number of Jewish Holocaust victims, or a specific research page stating the approximately six million figure with methodological notes; author/institution (Yad Vashem) and date visible |
| Acceptance test | URL resolves to a specific research or statistics page on yadvashem.org; the page addresses the victim count or the "Names" database methodology; not the Yad Vashem homepage alone |
| Rejection test | Reject if: page is the yadvashem.org homepage; page is a news article about Yad Vashem; page is a general introduction page without the specific victim-count methodology |
| Reliability score if VERIFIED | 85 |
| D-61 field to fill | `launch-B5` slot 2 `candidate_url`, `citation_title`, `source_domain`, `access_date`, `evidence_body`, `verification_status` |
| Alternative institution | United States Holocaust Memorial Museum (ushmm.org) → Holocaust Encyclopedia → "Documenting Numbers of Victims of the Holocaust and Nazi Persecution" — a specific named encyclopedia article with dates and citations |

---

#### B-5 Pressure slot — Historiography / denial failure

| Field | Value |
|-------|-------|
| Target institution | United States Holocaust Memorial Museum |
| Domain to open directly | `ushmm.org` |
| Within-site navigation | Navigate to ushmm.org → Holocaust Encyclopedia → search "denial" or "historiography" — find the "Holocaust Denial" encyclopedia article, which is authored, dated, and cites primary sources |
| Source class | `documented` (official educational institution encyclopedia entry; authored, dated, reviewed) |
| Claim slot | B-5 Pressure slot |
| What the page must show | An authored, dated encyclopedia article explaining why Holocaust denial arguments fail evidentially and what the evidentiary standard is; not a polemical editorial |
| Acceptance test | URL resolves to a specific USHMM Holocaust Encyclopedia article; the article is named (has a title), is attributed to an author or editorial team, and has a date or last-updated marker |
| Rejection test | Reject if: page is the USHMM homepage; page is a news article; page is a Wikipedia article; page is a partisan advocacy or counter-extremism site rather than a scholarly institution |
| Reliability score if VERIFIED | 78 |
| D-61 field to fill | D-63 pressure slot worksheet: `candidate_url`, `verification_status` for B-5 pressure |

---

## 4. Manual Research Workflow

For each target in Section 3, the researcher follows this sequence exactly:

```
Step 1 — Open the institution domain directly in a browser.
          Do not start from a search engine result page.

Step 2 — Navigate to the specific document, article, or data page
          using the within-site navigation described in Section 3.
          Use the site's own search if needed.

Step 3 — Confirm the URL resolves to the specific page
          (not a homepage, search results page, or redirect).

Step 4 — Run all 6 D-63 acceptance criteria:
          [ ] URL loads without login
          [ ] Domain is the institution itself
          [ ] Author / institution / date visible on the page
          [ ] Content directly supports the specific claim
          [ ] Neutral 2-4 sentence evidence body can be written
          [ ] Reliability score justified by quality label

Step 5 — If all 6 pass: complete the D-63 citation record.
          Record: candidate_url, citation_title, publisher,
          source_domain, access_date, stance, quality,
          reliability_score, evidence_body (full text, neutral),
          verification_status: VERIFIED

Step 6 — If any criterion fails: record the citation record with
          verification_status: REJECTED and a specific rejection_reason.
          Move to the next target or alternative institution.

Step 7 — Enter VERIFIED records into the D-61 worksheet:
          update candidate_url, citation_title, source_domain,
          access_date, evidence_body, verification_status fields.
          Do not enter REJECTED records into the worksheet.

Step 8 — Update the D-62 gate status table when all required
          slots for a claim reach VERIFIED.
```

---

## 5. Output Template for Future D-66

When research is complete for Batch B (or any batch), the output document (D-66) should
contain the following five sections:

### 5A. Accepted sources table

| claim_id | slot | citation_title | source_domain | access_date | quality | reliability_score | verification_status |
|----------|------|---------------|--------------|------------|---------|------------------|-------------------|
| (fill after research) | | | | | | | |

### 5B. Rejected sources table

| claim_id | slot | candidate_url_attempted | rejection_reason |
|----------|------|------------------------|-----------------|
| (fill after research) | | | |

### 5C. Unresolved blockers

| hard_blocker_id | claim_id | slot | reason_unresolved | next_action |
|----------------|----------|------|------------------|------------|
| (fill after research) | | | | |

### 5D. D-62 readiness gate delta

| Hard blocker | D-65 entry state | D-66 state (fill after research) |
|-------------|-----------------|--------------------------------|
| HB-1 any TODO_FIND_SOURCE | ❌ All 18 slots | |
| HB-2 any unverified | ❌ All 18 slots | |
| HB-3 SOURCE_NEEDED blocks apply | ❌ | |
| HB-4 evidence_body missing | ❌ | |
| HB-5 reliability_score unconfirmed | ⚠️ | |
| HB-6 launch_blocker unresolved | ❌ | |
| HB-7 pressure point review | ⚠️ | |
| HB-8 needs-careful-framing truths | ⚠️ | |
| HB-9 review_state='review' enforced | ✅ D-59 | ✅ |
| HB-10 D-59 hardening merged | ✅ PR #101 | ✅ |

---

## 6. Safety

| Rule | Status |
|------|--------|
| No URLs guessed or hand-constructed | ✅ — all targets specify an institution and navigation path, not a pre-written URL |
| No import | ✅ Confirmed |
| No source insertion into seed files or D-61 worksheet | ✅ — insertion occurs only after manual VERIFIED confirmation |
| No D1 writes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No seed file edits | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No AI-generated summaries accepted as evidence | ✅ — acceptance test requires direct institutional page |

---

## D-65 Completion Record

| Item | Status |
|------|--------|
| Direct source target rules defined (8 rules) | ✅ |
| B-4 slot 1 target (Doll & Hill / BMJ + PubMed) specified | ✅ |
| B-4 slot 2 target (Surgeon General 1964 / surgeongeneral.gov) specified | ✅ |
| B-4 slot 3 target (NCI SEER / Cancer Research UK) specified | ✅ |
| B-5 slot 1 target (Nuremberg / Yale Avalon) specified | ✅ |
| B-5 slot 2 target (Yad Vashem research) specified | ✅ |
| B-5 pressure slot target (USHMM Holocaust Encyclopedia) specified | ✅ |
| Manual research workflow defined (8 steps) | ✅ |
| D-66 output template defined (4 sections) | ✅ |
| Safety rules confirmed | ✅ |
| No URLs inserted | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
