# D-72: E-5 Astrology — Direct DOI/Publisher Capture Attempt

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called.

---

## 1. Summary

D-72 is a direct DOI/publisher capture attempt for the three E-5 source targets identified
in D-71: Carlson 1985 (Nature), Hartmann/Reuter/Nyborg 2006 (Personality and Individual
Differences), and Musch & Grondin 2001 (Developmental Review).

All three targets were fetched via WebFetch with direct official/publisher URLs.

**Result: 0 sources VERIFIED. E-5 gate remains BLOCKED.**

| Target | Outcome |
|--------|---------|
| Carlson 1985 — Nature | PAYWALLED_OR_INACCESSIBLE — bibliographic metadata confirmed; article conclusion blocked by paywall; stable URL redirects to auth |
| Hartmann/Reuter/Nyborg 2006 — PAID | BLOCKED — ScienceDirect HTTP 403; not indexed in PubMed |
| Musch & Grondin 2001 — Developmental Review | BLOCKED — Elsevier LinkingHub redirect only; no content visible |

The Carlson 1985 finding is an upgrade over the prior D-71 status: bibliographic metadata
(title, author, DOI, journal, volume, year, opening abstract sentence) was confirmed on
the Nature article page. However, the article finding/conclusion is behind a paywall and
the stable URL requires authentication. This does not satisfy D-63 acceptance criteria 1,
4, and 7 as a sole source.

No seed files were edited. No import route was called. No D1 or production mutation
occurred. No D-61 worksheet field moves to VERIFIED in D-72.

---

## 2. Capture Attempt Records

### Target 1 — Carlson 1985, Nature: "A double-blind test of astrology"

| Field | Value |
|-------|-------|
| attempted_url_primary | https://www.nature.com/articles/318419a0 |
| DOI | 10.1038/318419a0 |
| HTTP result | 303 → auth redirect (idp.nature.com) → cookie-error redirect → partial content page |
| verification_status | **PAYWALLED_OR_INACCESSIBLE** |

**Fetch sequence:**
1. `https://www.nature.com/articles/318419a0` → HTTP 303 to `https://idp.nature.com/authorize?response_type=cookie&client_id=grover&redirect_uri=https://www.nature.com/articles/318419a0`
2. Auth redirect → `https://www.nature.com/articles/318419a0?error=cookies_not_supported&code=[session-token]`
3. Cookie-error URL returns partial article landing page

**Confirmed visible on cookie-error URL (not a stable public URL):**
- Article title: "A double-blind test of astrology" ✅
- Author: Shawn Carlson, UC Berkeley and Lawrence Berkeley Labs ✅
- Journal: Nature ✅
- Volume 318, Pages 419–425, Published: 05 December 1985 ✅
- DOI: https://doi.org/10.1038/318419a0 ✅
- Opening abstract sentence: "Two double-blind tests were made of the thesis that astrological 'natal charts' can be used to describe accurately personality traits of test subjects." ✅
- Citation count: 101 citations, 12,000 accesses, Altmetric score 724

**NOT visible / blocked:**
- Full abstract (remaining sentences and conclusion) — paywall blocked
- Article results and discussion — paywall blocked
- Paywall message: "Enjoying our latest content? Log in or create an account to continue"

**PubMed check:** Carlson 1985 is NOT indexed in PubMed. Nature publishes across all
sciences; this 1985 physics/parapsychology paper does not meet PubMed's biomedical scope.
No PMID exists for this paper.

**D-63 acceptance test:**

| Criterion | Result |
|-----------|--------|
| URL loads without login (stable URL) | ❌ — `nature.com/articles/318419a0` redirects to auth; only a session-specific cookie-error URL shows partial content |
| Domain is recognised institution (nature.com — Nature/Springer) | ✅ |
| Author/institution/date visible | ✅ — Carlson, UC Berkeley, 05 Dec 1985, all confirmed |
| Content directly supports the specific claim (finding visible) | ❌ — opening abstract sentence visible ("two double-blind tests were made…") but the test result (astrologers did not perform better than chance) is blocked by paywall |
| Neutral 2–4 sentence evidence body writable from visible content | ⚠️ — can describe the test design; cannot confirm the finding from visible text alone |
| Reliability score consistent with `repeatable` (88) | ✅ — paper design is described as double-blind; score is appropriate IF finding is confirmed |
| No paywall-only sole source | ❌ — full abstract and conclusion require subscription; no free-access equivalent found (PubMed not indexed, PMC not found) |
| No AI summary as evidence | ✅ |
| No screenshot-only proof | ✅ |

**Criteria failed: 1, 4, 7. Status: PAYWALLED_OR_INACCESSIBLE.**

**What this means:** The paper unambiguously exists at the correct DOI, is authored by
Shawn Carlson, and was published in Nature Vol. 318, 1985. The bibliographic record is
confirmed. However, per D-63, a paywalled source requires "at least one free-access
equivalent (preprint, abstract + agency summary, institutional copy) alongside it." No
free-access equivalent has been found for this paper. A human researcher with institutional
library access (university library with Nature/Springer archive subscription) can retrieve
the full abstract and complete the VERIFIED record.

**rejection_reason:** D-63 criteria 1 (stable URL requires auth), 4 (conclusion/finding
not visible on free portion), and 7 (no free-access equivalent found) all fail. Bibliographic
metadata confirmed; finding/conclusion not confirmed without subscription.

---

### Target 2 — Hartmann, Reuter & Nyborg 2006: "The relationship between date of birth and individual differences in personality and general intelligence"

| Field | Value |
|-------|-------|
| attempted_url_primary | https://www.sciencedirect.com/science/article/pii/S0191886905003806 |
| DOI | 10.1016/j.paid.2005.11.017 |
| HTTP result | HTTP 403 Forbidden |
| attempted_url_secondary | PubMed search (multiple queries) |
| PubMed result | Not indexed — zero results on all search variants |
| verification_status | **BLOCKED** |

**Fetch attempts:**
1. ScienceDirect article page (pii/S0191886905003806) → HTTP 403 Forbidden
2. PubMed: `Hartmann Reuter Nyborg 2006 date birth personality intelligence` → zero results
3. PubMed: `Hartmann Reuter Nyborg personality intelligence birth` → zero results

**Assessment:** Personality and Individual Differences (Elsevier) is not consistently
indexed in PubMed. Elsevier blocks automated fetchers with HTTP 403 across all
ScienceDirect content. No PubMed PMID was found for this paper, which may reflect that
the journal has selective or no PubMed indexing for this article.

**D-63 acceptance test result:** BLOCKED — cannot evaluate criteria 1–7 because no
accessible page was returned.

**rejection_reason:** HTTP 403 on ScienceDirect. Not indexed in PubMed. No free-access
equivalent located. Requires institutional library access (Elsevier subscription) or
author-hosted PDF.

**Note on necessity:** Hartmann/Reuter/Nyborg 2006 is the secondary E-5 candidate. If
Carlson 1985 is eventually verified with a second independent source, this paper could
serve as either E-5 slot 2 or supplementary pressure. If this paper remains blocked, an
alternative second source should be sought (see Section 4).

---

### Target 3 — Musch & Grondin 2001: "Unequal Competition as an Impediment to Personal Development"

| Field | Value |
|-------|-------|
| attempted_url_primary | https://doi.org/10.1006/drev.2000.0516 |
| DOI | 10.1006/drev.2000.0516 |
| HTTP result | 302 → https://linkinghub.elsevier.com/retrieve/pii/S0273229700905161 |
| linkinghub result | "Redirecting" — no content |
| verification_status | **BLOCKED** |

**Fetch attempts:**
1. DOI resolver → Elsevier LinkingHub redirect
2. Elsevier LinkingHub → redirects again; page shows only "Redirecting" with no article content

**Assessment:** Elsevier's LinkingHub acts as a resolver/landing page for subscription
content. For non-browser automated requests, it returns only the redirect message with no
article content visible. The actual article is behind an Elsevier Developmental Review
subscription.

**D-63 acceptance test result:** BLOCKED — no accessible page content returned.

**rejection_reason:** Elsevier LinkingHub returns redirect-only response with no content.
Full article behind subscription paywall. No free-access equivalent located.

**Note on necessity:** Musch & Grondin 2001 was identified as the E-5 pressure source
(relative age effect / season-of-birth — a real seasonal effect with a non-astrological
mechanism). D-63 specifies this as a required pressure slot for E-5. An alternative
pressure source in the relative-age-effect or seasonal-birth literature may be findable on
PMC or as an author-hosted PDF. This is a lower priority than the two main E-5 evidence
slots.

---

## 3. Alternative Source Paths for E-5

The three primary targets are all blocked by Elsevier/Nature paywalls. The following
alternative paths remain unexplored and may yield free-access equivalents:

| Target | Alternative path | Notes |
|--------|-----------------|-------|
| Carlson 1985 | Author-hosted PDF: Lawrence Berkeley National Lab report repository | Carlson was affiliated with LBNL; LBNL technical reports may be publicly archived at `osti.gov` or `escholarship.org` |
| Carlson 1985 | UC Berkeley institutional repository (`escholarship.org`) | Pre-print or author copy may exist |
| Carlson 1985 | Internet Archive Wayback Machine for a historical Nature PDF link | Older Nature articles sometimes have freely archived copies |
| Hartmann 2006 | PubMed Central full-text search for "date of birth personality intelligence" | Less likely but worth one attempt |
| Hartmann 2006 | ResearchGate author page for Hartmann / Nyborg | Author-uploaded PDFs common on ResearchGate for pre-2010 papers |
| Musch & Grondin 2001 | PMC search: "relative age effect sport" | The relative-age-effect literature is well-represented; alternative RAE paper may substitute |
| Alternative E-5 pressure | Helsen et al. 2005 BJSM or Wattie et al. 2015 review on RAE | Multiple free-access RAE reviews exist in sports science |

---

## 4. Alternative E-5 Evidence Sources (If Primary Candidates Remain Blocked)

If Carlson 1985 cannot be accessed via a free path, the following peer-reviewed
alternatives could serve as E-5 slot 1 or slot 2:

| Candidate | Citation | Notes |
|-----------|---------|-------|
| McGrew 1994 "The Waxman-Rae Astrology Experiment" | Skeptical Inquirer 18(4) | Free access via Center for Inquiry (csicop.org) — but source class is `media` (score cap ~45); not ideal |
| Dean & Kelly 2003 "Is Astrology Relevant to Consciousness and Psi?" | Journal of Consciousness Studies | May be openly accessible; tests astrological predictions at scale |
| Fuzeau-Braesch & Denis 2009 "An Empirical Study of an Astrological Tradition" | Correlation journal | Narrow; less well-known |
| Tyson 1982 "People Who Consult Astrologers" | Personality and Individual Differences | Elsevier — likely same 403 block |

**Recommendation:** The strongest alternative free-access evidence source for E-5 is to
search PMC or PsyArXiv for any peer-reviewed meta-analysis or systematic review of
astrological prediction studies. A published systematic review in an open-access journal
would satisfy D-63 criteria more reliably than individual blocked paywalled papers.

---

## 5. D-62 Gate Status — E-5 After D-72

| Hard blocker | Status |
|-------------|--------|
| HB-1: any TODO_FIND_SOURCE | ❌ E-5 all slots remain BLOCKED/PAYWALLED |
| HB-2: any unverified slot | ❌ E-5 0 VERIFIED after D-72 |
| HB-3: SOURCE_NEEDED guard blocks apply | ❌ Still blocks |
| HB-4: evidence_body missing | ❌ E-5 evidence bodies not confirmable without VERIFIED source |
| HB-5: reliability_score unconfirmed | ⚠️ Carlson 1985 metadata confirmed; score remains proposed |
| HB-6: launch_blocker E-5 | ❌ Still open |
| HB-7: pressure point (Musch & Grondin) | ❌ Blocked |
| HB-8: careful-framing truths | ⚠️ Unchanged |
| HB-9: review_state='review' | ✅ D-59 |
| HB-10: D-59 hardening | ✅ PR #101 |

**E-5 VERIFIED slot count after D-72: 0 / 2 evidence + 0 / 1 pressure**

**Overall pack gate status: ❌ BLOCKED**

---

## 6. Cumulative Verified Slot Count After D-72 (Unchanged from D-71)

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

**Total VERIFIED: 20 of ~30 required slots (~67%). No change from D-71.**

---

## 7. Recommended Next Steps

The primary blocker for E-5 is Nature/Elsevier paywalls with no PubMed indexing. The
recommended next steps in priority order:

| Priority | Action |
|----------|--------|
| 1 | Try `https://escholarship.org` search for "Carlson astrology 1985" — UC eScholarship hosts Lawrence Berkeley Lab research outputs; Carlson's affiliation was LBNL |
| 2 | Try `https://www.osti.gov/search/semantic:carlson+astrology` — OSTI hosts DOE/national lab publications; LBNL is a DOE facility |
| 3 | Try PMC search: "astrology personality systematic review" — look for any open-access meta-analysis of astrological prediction research as an alternative to Carlson |
| 4 | Try PubMed search for relative age effect review paper as Musch & Grondin alternative for E-5 pressure slot: `"relative age effect" review sport psychology` |
| 5 | If E-5 remains fully blocked after Steps 1–4, proceed to D-73 (source readiness delta) with the currently VERIFIED 20 slots and document E-5 as a known gap — the 5 fully-resolved claims + D-2 may be sufficient for a partial first import of the unblocked claims while E-5 continues research |

---

## 8. Safety

| Rule | Status |
|------|--------|
| No seed file edits | ✅ Confirmed |
| No D1 writes | ✅ Confirmed |
| No import routes called | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No frontend or Worker changes | ✅ Confirmed |
| No URLs fabricated | ✅ Confirmed — all URLs were directly fetched via WebFetch |
| All blocked/paywalled sources documented with fetch result | ✅ Confirmed |

---

## D-72 Completion Record

| Item | Status |
|------|--------|
| Carlson 1985 — nature.com fetched; metadata confirmed; paywall blocks conclusion | ✅ |
| Carlson 1985 — PubMed checked; not indexed | ✅ |
| Hartmann 2006 — ScienceDirect HTTP 403; PubMed not indexed | ✅ |
| Musch & Grondin 2001 — Elsevier LinkingHub redirect-only | ✅ |
| All D-63 acceptance criteria evaluated for each target | ✅ |
| Alternative source paths documented | ✅ |
| Alternative evidence candidates documented | ✅ |
| D-62 gate delta: 0 VERIFIED gained in D-72 | ✅ |
| Cumulative slot count table updated (unchanged) | ✅ |
| Recommended next steps in priority order | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
