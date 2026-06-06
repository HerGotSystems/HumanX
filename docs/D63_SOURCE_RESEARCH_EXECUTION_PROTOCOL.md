# D-63: Source Research Execution Protocol

Date: 2026-06-06
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No URLs inserted. No import routes called.

---

## 1. Summary

| Batch | Output |
|-------|--------|
| D-61 | Source URL candidate worksheet — 18 evidence slots, all `TODO_FIND_SOURCE` |
| D-62 | Readiness gate — BLOCKED on HB-1 through HB-8; no source verified |
| **D-63** | **This document — source research execution protocol** |

D-63 defines *how* source research is conducted and recorded. It does not perform the
research. No URLs are added here. Actual research requires a web browser, access to
academic or government sources, and human judgment about source quality.

**D-63 is protocol only. It does not change any file except docs.
No import, no D1, no seed edits.**

---

## 2. Research Batch Model

The 12 D-57 representative claims are split into five research batches, ordered by
approachability and launch-trust priority. Start with Batch A (calm, heavily-documented
science). End with Batch E (belief/untestable). Do not begin with the demo-only claims
(flat earth, perpetual motion) — those are not in the launch set.

---

### Batch A — Science / Physical World

**Claims included:** A-1 (vaccines-autism), A-4 (CO₂ climate driver)

| Field | Value |
|-------|-------|
| Minimum source count | A-1: 2 sources. A-4: 2 sources. |
| Preferred domains/source classes | PubMed (ncbi.nlm.nih.gov), Cochrane Library (cochranelibrary.com), WHO (who.int), CDC (cdc.gov), IPCC (ipcc.ch), Lancet (thelancet.com), BMJ (bmj.com), Nature (nature.com), NIST (nist.gov) |
| Pressure source requirement | A-1: BMJ investigation or equivalent for Wakefield retraction context. A-4: IPCC AR6 Chapter 3 or attribution study for natural-variation pressure. |
| Stop conditions | Stop if: no free-access version of a required study is findable (mark `PAYWALLED_OR_INACCESSIBLE`); the source covers the topic but not the exact claim scope (mark `REJECTED`, note reason); the domain is a partisan advocacy site. |
| Notes | A-1 meta-analysis: Cochrane systematic reviews are the gold standard. BMJ/Lancet retraction is a dated document — an archived URL is acceptable. A-4: IPCC reports are free public documents; the Summary for Policymakers is the recommended entry point. |

---

### Batch B — History / Public Record

**Claims included:** B-4 (smoking-cancer), B-5 (Holocaust)

| Field | Value |
|-------|-------|
| Minimum source count | B-4: 3 sources. B-5: 2 sources. |
| Preferred domains/source classes | BMJ (bmj.com), CDC historical archive (cdc.gov), NCI (cancer.gov), Cancer Research UK (cancerresearchuk.org), Yale Avalon Project (avalon.law.yale.edu), Yad Vashem (yadvashem.org), US Holocaust Memorial Museum (ushmm.org) |
| Pressure source requirement | B-4: None — population-level vs. individual certainty pressure is definitional, no external URL required. B-5: US Holocaust Memorial Museum or equivalent historiography source for the denial-argument failure pressure point. |
| Stop conditions | Stop if: historical document is behind institutional paywall with no free-access equivalent (internet archive may have copy); source is a revisionist site (mark `REJECTED`). |
| Notes | B-4: The Doll & Hill 1950 paper and the 1964 Surgeon General report are both historical documents; check BMJ archive and CDC/DHHS historical pages. The NCI or Cancer Research UK survival/risk data pages are stable government/charity sources. B-5: Yad Vashem and USHMM have publicly accessible research pages; the Nuremberg records via Yale Avalon Project are free. |

---

### Batch C — Civic / Media Literacy

**Claims included:** C-1 (social media algorithms), C-2 (eyewitness testimony), C-4 (confirmation bias)

| Field | Value |
|-------|-------|
| Minimum source count | C-1: 2 sources. C-2: 2 sources. C-4: 2 sources. |
| Preferred domains/source classes | WSJ (wsj.com — congressional testimony transcripts may be free via congress.gov), peer-reviewed communication/psychology journals (via PubMed, JSTOR, Semantic Scholar), Innocence Project (innocenceproject.org), Psychological Bulletin (apa.org or publisher), congressional hearing transcripts (congress.gov) |
| Pressure source requirement | C-1: Platform transparency report (Meta, X, YouTube — free public documents) for the "platforms argue user preference" pressure. C-2: National Research Council 2014 eyewitness report or equivalent legal standards reference. C-4: None — non-universality pressure is methodological; no external URL required. |
| Stop conditions | Stop if: the WSJ Facebook Files article is paywalled with no free alternative (check congressional testimony transcripts at congress.gov as free substitute); a psychology paper's DOI resolves only to a paywall (check PubMed abstract + open-access preprint via Semantic Scholar or PsyArXiv). |
| Notes | C-1: Congressional testimony records are free public documents on congress.gov. The WSJ "Facebook Files" (2021 Wall Street Journal investigation) may be partially paywalled — a congressional hearing transcript where the same evidence was presented is a valid documented-class alternative. C-2: The Innocence Project publishes annual reports with exoneration statistics free on their website. Loftus's work is widely available via Google Scholar or PsyArXiv. |

---

### Batch D — Human Behaviour / Cognitive Bias

**Claims included:** D-2 (sleep deprivation), D-3 (Dunning-Kruger), D-5 (anchoring bias)

| Field | Value |
|-------|-------|
| Minimum source count | D-2: 2 sources. D-3: 2 sources (original + critique). D-5: 2 sources. |
| Preferred domains/source classes | Sleep journals (SleepFoundation.org for guidance; peer-reviewed via PubMed), WHO (who.int), CDC (cdc.gov), Journal of Personality and Social Psychology (apa.org/pubs/journals/psp), Psychological Bulletin (apa.org/pubs/journals/bul), Science (science.org or JSTOR), behavioural economics journals |
| Pressure source requirement | D-3: The critique/replication evidence slot is itself a pressure source — use the same URL for the "statistical artefact" pressure point. D-2: None — the domain-and-threshold precision pressure is methodological. D-5: None — effect-size variation pressure is methodological. |
| Stop conditions | Stop if: the Van Dongen 2003 sleep paper is paywalled (find the PubMed abstract + a public-health summary that cites it); the Tversky & Kahneman 1974 Science paper is paywalled (Kahneman's later books summarise the result — acceptable as `documented` supplementary but not sole source). |
| Notes | D-3: Two evidence slots required — the 1999 original AND a critique or replication attempt. The critique/replication slot serves double duty as a pressure source; use the same URL for both. Status should remain `Plausible` not `Proven` — honest grading is the point. D-5: The 1974 Science paper is a landmark; JSTOR institutional access may be needed. Check if the author's PDF is publicly hosted (common for older papers). |

---

### Batch E — Untestable / Belief

**Claims included:** E-5 (astrology personality prediction)

| Field | Value |
|-------|-------|
| Minimum source count | E-5: 2 sources. |
| Preferred domains/source classes | Nature (nature.com), peer-reviewed psychology journals (via PubMed), behavioural science journals |
| Pressure source requirement | E-5: Season-of-birth / school-entry cutoff study (Musch & Grondin or equivalent) for the "real seasonal effect, wrong explanation" pressure point. |
| Stop conditions | Stop if: Carlson 1985 is paywalled (Nature archive; check if institutional or preprint copy exists); the birth-date personality study is only in a paid database (look for author-hosted PDF or PsyArXiv preprint). |
| Notes | E-5: Status `Weak Evidence` (not `Disproven`) is the correct and honest verdict for astrology. The Carlson 1985 double-blind study in Nature is a classic; it is cited in hundreds of papers and a stable reference. The Barnum-effect pressure is definitional — no URL required. The seasonal-birth pressure needs an academic citation. |

---

## 3. Source Acceptance Test

A candidate URL passes the acceptance test only when **all** of the following are true:

| Test | Pass condition |
|------|---------------|
| **Reachable** | URL loads without login in an incognito browser window right now. |
| **Stable domain** | Domain belongs to a recognised institution, journal, government body, or archive. Not a personal blog, Reddit thread, or aggregator. |
| **Source identity clear** | Author name (or institutional authority), publication name, and date are all visible on the page. |
| **Directly claim-specific** | The page content directly addresses the specific claim being evaluated — not just the general topic area. A CDC page about vaccination schedules does not verify "vaccines cause autism"; the specific meta-analysis or retraction notice does. |
| **Neutral body writable** | It is possible to write a 2–4 sentence neutral summary of what the source shows without editorialising, overclaiming, or reproducing verbatim quotes at excessive length. |
| **Reliability score justified** | The assigned `reliability_score` is consistent with the source's quality label per D-55 guidance: `repeatable` 80–90, `documented` 60–75, `media` 30–45. A news article cannot receive a score of 85. |
| **No paywall-only sole source** | If the URL is paywalled, at least one free-access equivalent (preprint, abstract + agency summary, institutional copy) exists alongside it. A paywalled-only source is not a public source. |
| **No AI summary as evidence** | The page is not an AI-generated summary, Wikipedia article, or aggregator page. These may point to primary sources but are not themselves evidence. |
| **No screenshot-only proof** | The claim is not supported by a screenshot of another page. Screenshots are not independently verifiable. |

If any test fails, mark the source `REJECTED` and record the failure reason in the
citation record `rejection_reason` field.

---

## 4. Citation Record Format

For each candidate URL researched, complete one citation record. Record all candidates,
including rejected ones — rejected records show that due diligence was performed.

```
claim_id          : <D-57 draft_claim_id, e.g. "launch-A1">
evidence_slot     : <slot number, e.g. "slot 1 — meta-analysis">
candidate_url     : <full URL — no shortened links>
citation_title    : <title of the page/paper as shown on the source>
publisher         : <journal name, government body, institution>
source_domain     : <domain only, e.g. cochranelibrary.com>
access_date       : <YYYY-MM-DD — date the URL was confirmed live>
stance            : <for | against>
quality           : <repeatable | documented | media | testimony>
reliability_score : <integer 5–90>
evidence_body     : <2–4 sentence neutral plain-English summary of what this
                     source shows and why it is relevant to the exact claim>
pressure_note     : <if this source also informs a pressure point, note here>
verification_status : <VERIFIED | CANDIDATE_FOUND | REJECTED | PAYWALLED_OR_INACCESSIBLE | BROKEN_LINK>
rejection_reason  : <if REJECTED — specific reason why this source failed the acceptance test>
```

**Minimum required fields for a `VERIFIED` record:**
`claim_id`, `evidence_slot`, `candidate_url`, `citation_title`, `publisher`,
`source_domain`, `access_date`, `stance`, `quality`, `reliability_score`,
`evidence_body` (complete, not a placeholder), `verification_status: VERIFIED`.

---

## 5. Research Output Format

When source research is complete for a batch or for the full set, produce a companion
research log document. The log should contain four sections:

### 5A. Accepted sources table

One row per `VERIFIED` record. Columns:
`claim_id | evidence_slot | source_domain | citation_title | access_date | quality | reliability_score | verification_status`

### 5B. Candidate sources table (not yet VERIFIED)

One row per `CANDIDATE_FOUND` record. Columns:
`claim_id | evidence_slot | candidate_url | status | next_action`

### 5C. Rejected sources table

One row per `REJECTED` record. Columns:
`claim_id | evidence_slot | candidate_url | rejection_reason`

### 5D. Unresolved blockers

List any D-62 hard blocker that remains unresolved after the research batch:
`blocker_id | claim_id | slot | reason_unresolved | suggested_next_action`

### 5E. Readiness delta against D-62

A table comparing the D-62 gate state to the post-research state:

| Hard blocker | D-62 state | Post-research state |
|-------------|-----------|-------------------|
| HB-1 any TODO_FIND_SOURCE | ❌ All 18 slots | (update after research) |
| HB-2 any unverified | ❌ All 18 slots | (update after research) |
| HB-3 SOURCE_NEEDED guard | ❌ blocks apply | (update after research) |
| ... | | |

The readiness delta shows the gate progress and what remains before D-64 (final JSON)
can begin.

---

## 6. Safety

| Rule | Detail |
|------|--------|
| **Do not paste unverified URLs into final JSON** | A `CANDIDATE_FOUND` URL has not passed the acceptance test. Only `VERIFIED` URLs enter `data/seed_claims_v2.json`. |
| **Do not import anything** | No import route is called during source research. Research output goes into docs only. |
| **Do not use AI-generated summaries as evidence** | If an AI tool is used to locate a source, the primary source itself must be found and verified independently. The AI summary is not the evidence. |
| **Do not overclaim beyond what sources support** | The `evidence_body` text must reflect what the source actually shows. A study showing correlation must not be summarised as showing causation unless the paper itself makes that causal claim. |
| **Do not source controversial claims from one partisan source** | Claims in Categories A–D must have at least one `repeatable` or `documented` source from a non-advocacy institution. A single think-tank report is not sufficient. |
| **Do not skip rejected records** | Every candidate that fails the acceptance test must be recorded with a `rejection_reason`. Discarded records show rigour; missing records raise questions. |
| **Do not archive broken links without noting the archive date** | If using web.archive.org, record the snapshot date alongside the archive URL. |

---

## 7. Execution Order Recommendation

| Order | Batch | Rationale |
|-------|-------|-----------|
| 1st | **Batch B** (history/public record) | B-4 (smoking-cancer) and B-5 (Holocaust) have the most authoritative and stable primary sources — government archives, established research institutions, court records. Good for calibrating the citation record process before tackling more contested claims. |
| 2nd | **Batch A** (science/physical) | A-1 (vaccines) and A-4 (climate) have strong peer-reviewed evidence bases. IPCC and Cochrane are well-known, stable sources. These are high-priority launch claims. |
| 3rd | **Batch C** (civic/media literacy) | C-2 (eyewitness) and C-4 (confirmation bias) are classic, well-replicated psychology findings with accessible sources. C-1 (social media algorithms) requires more source navigation (congressional transcripts, platform documents). |
| 4th | **Batch D** (behaviour/cognitive bias) | D-2, D-3, D-5 are psychology findings with peer-reviewed backing. D-3 requires two evidence slots — both the original paper and a critique — which involves more judgment. |
| 5th | **Batch E** (untestable/belief) | E-5 (astrology) is physically testable but culturally sensitive. Placing it last avoids anchoring the research process on a claim that requires careful framing. |

**Do not start with:**
- Flat earth or perpetual motion (demo-only seeds; not in the launch set)
- E-1 (there is a God) or E-2 (consciousness after death) — these are `Untestable` claims that require no URL verification; they are handled separately in the truth framing track

---

## 8. Future Path

| Batch | Type | Scope | Gate |
|-------|------|-------|------|
| **D-64** | Human research + docs | Cited source research — Batch A (or B first per execution order); researcher finds and verifies real URLs; completes citation records; produces research output per Section 5; no seed file edits | Human URL research; D-63 protocol in hand |
| **D-65** | Docs-only | Source insertion draft — all TODO_FIND_SOURCE for the full launch set resolved to VERIFIED; evidence_body text finalized; `data/seed_claims_v2.json` created with all readiness gates passing; no import yet | D-64 + all HB-1/HB-2/HB-3 cleared |
| **D-66** | Admin action (gated) | Dry-run import — call `GET /api/import-seed?mode=dry-run` and `GET /api/import-truths?mode=dry-run`; review structured report; confirm `source_needed_blocked: 0` and counts match expected | D-65 + explicit per-session admin approval |
| **D-67** | Admin action (gated) | Production apply — call `?mode=apply`; immediately moderate all new `review_state='review'` content in admin Review queue | D-66 dry-run reviewed + separate explicit per-session D1/write approval |

---

## D-63 Completion Record

| Item | Status |
|------|--------|
| Research batch model defined (5 batches, 12 claims) | ✅ |
| Source acceptance test defined (9 criteria) | ✅ |
| Citation record format defined (14 fields) | ✅ |
| Research output format defined (5 sections) | ✅ |
| Safety rules documented (7 rules) | ✅ |
| Execution order recommendation documented | ✅ |
| Future path D-64 → D-67 defined | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No URLs inserted | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
