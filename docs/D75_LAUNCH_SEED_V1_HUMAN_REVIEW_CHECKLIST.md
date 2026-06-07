# D-75: Launch Seed v1 Human Review Checklist

Date: 2026-06-07
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No import routes called. No executable JSON files created.

---

## 1. Summary

D-75 is the human review checklist that must be completed before D-76 creates
`data/seed_claims_v2.json`. A human reviewer reads `docs/D74_SOURCE_INSERTION_DRAFT.md`
and works through this checklist for each READY claim, then records their decision
(APPROVE_FOR_D76 / NEEDS_EDIT / EXCLUDE_FROM_V1 / HOLD_FOR_MORE_SOURCES) in Section 5.

**Nothing in D-75 creates a file, calls an import route, or touches D1.**

D-76 may only proceed when:
- All 5 READY claims are marked APPROVE_FOR_D76 in Section 5, OR
- Any claim marked NEEDS_EDIT is corrected and re-reviewed before D-76 begins

The review is done by a human — this document specifies what to check; it does not
pre-fill the results.

---

## 2. Review Scope

### READY claims — subject to full per-claim review (Section 3)

| # | Claim | seed_id | Source doc |
|---|-------|---------|------------|
| 1 | The Holocaust resulted in the murder of approximately six million Jews | `launch-B5` | D-67 |
| 2 | The MMR vaccine does not cause autism | `launch-A1` | D-68 |
| 3 | Rising CO₂ levels from human activity are the primary driver of observed global warming | `launch-A4` | D-68 |
| 4 | Social media algorithms amplify certain content based on engagement signals, affecting which information spreads widely | `launch-C1` | D-69 |
| 5 | Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy | `launch-D2` | D-70 |

### PARTIAL claims — excluded from v1 unless explicitly promoted

| Claim | seed_id | Blocker |
|-------|---------|---------|
| Smoking tobacco causes lung cancer | `launch-B4` | Slot 3 (Doll & Hill / 1964 SG Report) not found |
| Eyewitness testimony is less reliable than commonly assumed | `launch-C2` | Pressure source (NRC 2014) paywalled |
| People with lower competence in a domain tend to overestimate their own ability | `launch-D3` | Critique slot (Elsevier blocked); Nuhfer 2016 CANDIDATE only |
| People tend to rely too heavily on an initial piece of information when making decisions | `launch-D5` | Slot 2 blocked (Wiley/ScienceDirect) |

PARTIAL claims may only enter v1 if the project owner explicitly promotes them and accepts
the stated gap. Any such promotion must be recorded in the decision table (Section 5) with
explicit reasoning before D-76 begins.

### EXCLUDED v1 claims — no review needed; document for the record

| Claim | seed_id | Reason |
|-------|---------|--------|
| People tend to search for and interpret evidence in ways that confirm their existing beliefs | `launch-C4` | 0 VERIFIED sources — all paths paywalled/JS-rendered |
| Astrology cannot reliably predict personality traits or life outcomes beyond chance | `launch-E5` | 0 VERIFIED sources — Nature/Elsevier paywall; not in PubMed |

---

## 3. Per-Claim Review Checklist

Instructions: For each READY claim, the reviewer verifies each row and marks ✅ or ❌.
Any ❌ must be resolved before APPROVE_FOR_D76 is recorded. If a row cannot be verified,
mark ⚠️ and record a note.

---

### 3.1 — B-5: Holocaust (launch-B5)

D-74 claim object location: Section 3.1

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | Specific: "approximately six million Jews"; "murder"; historically grounded | |
| 2 | Category correct | "History / Public Record" | |
| 3 | Type correct | "Historical/Physical" | |
| 4 | Status correct | "Proven" (not Plausible; documentation is definitive) | |
| 5 | Evidence slot 1 source URL real and loadable | https://avalon.law.yale.edu/imt/wannsee.asp — Yale Law Avalon Project | |
| 6 | Evidence slot 1 body accurately reflects source | Wannsee Protocol: state-sponsored plan, 11M target population, Nuremberg evidence | |
| 7 | Evidence slot 1 reliability_score reasonable | 85 — `documented`; primary historical document hosted at Yale | |
| 8 | Evidence slot 2 source URL real and loadable | https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution | |
| 9 | Evidence slot 2 body accurately reflects source | USHMM: six million; Nazi documents + demographic studies; breakdown by killing method | |
| 10 | Evidence slot 2 reliability_score reasonable | 82 — `documented`; US federal Holocaust institution | |
| 11 | Pressure source URL real and loadable | https://encyclopedia.ushmm.org/content/en/article/antisemitism | |
| 12 | Pressure body is fair and not a strawman | USHMM antisemitism article; describes Holocaust denial and distortion as antisemitism | |
| 13 | Pressure body does not over-amplify denial framing | Evidence body should describe denial's lack of basis, not repeat denial claims | |
| 14 | review_state_intended = "review" | "review" | |
| 15 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated from VERIFIED records | |
| 16 | Launch risk acceptable for v1 | high — sensitive topic; framing must be factual, not performative. Verify evidence bodies read as factual historical record, not political statement | |

**Reviewer notes (B-5):**
_[human reviewer fills in]_

---

### 3.2 — A-1: MMR Vaccine Does Not Cause Autism (launch-A1)

D-74 claim object location: Section 3.2

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | Specific: "The MMR vaccine does not cause autism"; scoped to one specific vaccine | |
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
| 13 | Pressure body does not mischaracterize the original Wakefield paper | Body should describe the retraction and fraud finding, not repeat the original unfounded claim | |
| 14 | CDC autism page rejection is noted | D-74 notes field: "CDC autism page REJECTED (Nov 2025 policy reversal)" — no CDC page in evidence objects | |
| 15 | review_state_intended = "review" | "review" | |
| 16 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 17 | Launch risk acceptable for v1 | high — politically sensitive in current climate; peer-reviewed evidence (Cochrane, NEJM) is unaffected by any policy-page changes; framing should foreground the scientific record | |

**Reviewer notes (A-1):**
_[human reviewer fills in]_

---

### 3.3 — A-4: CO₂ / Human Activity / Primary Driver (launch-A4)

D-74 claim object location: Section 3.3

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "Rising CO₂ levels from human activity are the primary driver of observed global warming" — scoped to CO₂, human activity, primary driver | |
| 2 | Category correct | "Science / Physical World" | |
| 3 | Type correct | "Physical/Testable" | |
| 4 | Status correct | "Proven" — IPCC AR6 "unequivocal"; NASA corroboration | |
| 5 | Evidence slot 1 source URL real and loadable | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ — IPCC AR6 WG1 SPM, 2021 | |
| 6 | Evidence slot 1 body accurately reflects source | IPCC: "unequivocal"; 1.09°C above 1850–1900; near-linear CO₂ relationship | |
| 7 | Evidence slot 1 reliability_score reasonable | 90 — `documented`; highest score allowed; IPCC international consensus | |
| 8 | Evidence slot 2 source URL real and loadable | https://science.nasa.gov/climate-change/causes — NASA, last updated Oct 23, 2024 | |
| 9 | Evidence slot 2 body accurately reflects source | NASA: CO₂ up 50% since 1750; isotopic fingerprint; human source confirmed | |
| 10 | Evidence slot 2 reliability_score reasonable | 82 — `documented`; official US government science agency | |
| 11 | Pressure source URL real and loadable | https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/ — same URL as evidence slot 1 | |
| 12 | Pressure body is fair and not a strawman | IPCC: natural variability ruled out as primary driver; warming "unequivocal" across multiple attribution lines | |
| 13 | Dual-use URL is acceptable | D-73 approved dual-use (same URL serves evidence + pressure with different framing angle) | |
| 14 | review_state_intended = "review" | "review" | |
| 15 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 16 | Launch risk acceptable for v1 | medium — politically contested; scientific evidence is unambiguous at IPCC level; framing should stay at the physical science level, not policy | |

**Reviewer notes (A-4):**
_[human reviewer fills in]_

---

### 3.4 — C-1: Social Media Algorithms / Engagement (launch-C1)

D-74 claim object location: Section 3.4

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "amplify certain content based on engagement signals, affecting which information spreads widely" — observable mechanism; not "cause radicalization" | |
| 2 | Category correct | "Civic / Media Literacy" | |
| 3 | Type correct | "Sociological/Observable" | |
| 4 | Status correct | "Plausible" — not Proven; causal magnitude is contested; Vosoughi 2018 shows differential spread, not algorithmic causation alone | |
| 5 | Evidence slot 1 source URL real and loadable | https://pubmed.ncbi.nlm.nih.gov/29590045/ — PMID 29590045, Vosoughi/Science 2018 | |
| 6 | Evidence slot 1 body accurately reflects source | 126K stories; 3M users; false news spreads farther/faster; humans not bots are primary driver | |
| 7 | Evidence slot 1 reliability_score reasonable | 86 — `repeatable`; large-scale Science paper | |
| 8 | Evidence slot 2 source URL real and loadable | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ — YouTube VP Engineering, Sept 2021 | |
| 9 | Evidence slot 2 body accurately reflects source | Cristos Goodrow; engagement signals (clicks, watchtime, surveys, likes); primary inputs; responsibility overrides as secondary | |
| 10 | Evidence slot 2 reliability_score reasonable | 55 — `testimony`; platform VP blog post; first-person platform description | |
| 11 | Pressure source URL real and loadable | https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/ — same URL | |
| 12 | Pressure body is fair and not a strawman | YouTube's own argument: responsibility overrides moderate pure engagement; platform explicitly claims responsibility commitments reduce amplification of harmful content | |
| 13 | Dual-use URL is acceptable | D-73 approved; evidence angle = engagement signals are primary inputs; pressure angle = responsibility overrides are secondary layer | |
| 14 | Status "Plausible" is appropriate | Yes — the claim describes an observable mechanism (engagement-based amplification) but does not claim magnitude, causation of specific harms, or sole causation | |
| 15 | review_state_intended = "review" | "review" | |
| 16 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 17 | Launch risk acceptable for v1 | medium — topic is contested; framing as Plausible and describing mechanism (not outcome) keeps risk manageable | |

**Reviewer notes (C-1):**
_[human reviewer fills in]_

---

### 3.5 — D-2: Sleep Deprivation / Cognitive Impairment (launch-D2)

D-74 claim object location: Section 3.5

| # | Check | Expected | Reviewer result |
|---|-------|----------|----------------|
| 1 | Claim text is precise and not overbroad | "significantly impairs cognitive performance, even when individuals feel only mildly sleepy" — well-scoped; includes the subjective underestimation angle | |
| 2 | Category correct | "Human Behaviour / Biology" | |
| 3 | Type correct | "Physical/Testable" | |
| 4 | Status correct | "Proven" — Van Dongen 2003 lab study + CDC public health endorsement | |
| 5 | Evidence slot 1 source URL real and loadable | https://academic.oup.com/sleep/article-lookup/doi/10.1093/sleep/26.2.117 — Oxford Academic, SLEEP journal, DOI 10.1093/sleep/26.2.117 | |
| 6 | Evidence slot 1 body accurately reflects source | Van Dongen 2003: ≤6h/night for 2 weeks = 2-night total deprivation deficit; participants underestimated impairment; dose-response established | |
| 7 | Evidence slot 1 reliability_score reasonable | 87 — `repeatable`; controlled lab study, SLEEP journal, Oxford | |
| 8 | Evidence slot 2 source URL real and loadable | https://www.cdc.gov/sleep/about/index.html — CDC About Sleep, last reviewed May 15, 2024 | |
| 9 | Evidence slot 2 body accurately reflects source | CDC: 7+ hours needed; insufficient sleep linked to cognitive impairment, chronic disease, crash risk | |
| 10 | Evidence slot 2 reliability_score reasonable | 80 — `documented`; CDC official public health guidance | |
| 11 | No pressure source required | D-63 specified: methodological pressure — no external URL required. Pressure array is empty. | |
| 12 | Empty pressure array is acceptable | Yes — confirmed by D-63; the subjective underestimation angle is embedded in the Van Dongen evidence body | |
| 13 | review_state_intended = "review" | "review" | |
| 14 | No SOURCE_NEEDED / TODO / placeholder in any field | All fields populated | |
| 15 | Launch risk acceptable for v1 | low — scientifically uncontroversial; broad public interest | |

**Reviewer notes (D-2):**
_[human reviewer fills in]_

---

## 4. Global Review Checklist

These checks apply across all READY claims collectively. Reviewer fills in result column.

| # | Check | Pass condition | Reviewer result |
|---|-------|---------------|----------------|
| G-1 | No fabricated or invented URLs | All 7 unique source_url values in D-74 READY claim objects are traceable to a specific D-66/D-67/D-68/D-69/D-70 VERIFIED record | |
| G-2 | No paywalled-only source promoted without accessible evidence | Carlson 1985 (Nature, paywalled) is excluded from all READY claim objects; PubMed abstract pages used where full text is paywalled | |
| G-3 | No ragebait-first framing in claim text | Claim texts state verifiable facts or consensus findings; none use "wake up", "they don't want you to know", or adversarial framing | |
| G-4 | No claim exceeds its source support | B-5: "approximately six million" matches USHMM language; A-1: "does not cause autism" matches Cochrane conclusion; A-4: "primary driver" matches IPCC "unequivocal human influence"; C-1: "Plausible" status acknowledged; D-2: "significantly impairs" matches Van Dongen finding | |
| G-5 | Evidence bodies are neutral and 2–4 sentences | All 10 evidence bodies (2 per READY claim) stay within 2–4 sentences; no editorialising or political language | |
| G-6 | Pressure bodies are fair and represent genuine counterarguments | B-5 pressure: USHMM denial framing (accurate); A-1 pressure: Wakefield fraud/retraction (factual); A-4 pressure: natural variability attribution angle (addressed by IPCC directly); C-1 pressure: platform responsibility argument (YouTube's own stated position) | |
| G-7 | Status labels are correctly calibrated | B-5 Proven ✓; A-1 Proven ✓; A-4 Proven ✓; C-1 Plausible ✓ (not Proven — observable mechanism, causal magnitude contested); D-2 Proven ✓ | |
| G-8 | review_state_intended = "review" on all objects | All 5 READY claim objects carry `"review_state_intended": "review"` — D-59 enforces this at import time | |
| G-9 | No import route call planned in D-76 | D-76 creates the JSON file only; no route call is made in D-76 | |
| G-10 | No D1 action planned in D-76 | D-76 is branch + PR creating one data file; no wrangler, no D1 execute | |
| G-11 | D-59 SOURCE_NEEDED guard still active | PR #101 merged; guard blocks apply mode if any source_url is empty or contains SOURCE_NEEDED | |
| G-12 | Partial/excluded claims absent from READY draft section | D-74 Section 3 contains exactly 5 objects; B-4/C-2/D-3/D-5/C-4/E-5 are not in that section | |

**Reviewer notes (global):**
_[human reviewer fills in]_

---

## 5. Decision Table

The human reviewer records their decision for each claim here before D-76 begins.
All READY claims must have a recorded decision. PARTIAL claims record any promotion
decision. EXCLUDED claims are listed for completeness.

**Decision codes:**
| Code | Meaning |
|------|---------|
| `APPROVE_FOR_D76` | Claim passes all checklist items; may enter seed_claims_v2.json |
| `NEEDS_EDIT` | Specific correction required; re-review before D-76 |
| `EXCLUDE_FROM_V1` | Remove from v1 JSON file; document reason |
| `HOLD_FOR_MORE_SOURCES` | Sufficient sources exist but a question about framing or claim scope requires resolution before inclusion |

| Claim | seed_id | Decision | Notes / corrections required |
|-------|---------|----------|------------------------------|
| Holocaust: six million | `launch-B5` | _[reviewer records]_ | |
| MMR vaccine / autism | `launch-A1` | _[reviewer records]_ | |
| CO₂ / climate driver | `launch-A4` | _[reviewer records]_ | |
| Social media algorithms | `launch-C1` | _[reviewer records]_ | |
| Sleep deprivation | `launch-D2` | _[reviewer records]_ | |
| Smoking / lung cancer | `launch-B4` | _[reviewer records — PARTIAL; only promote if slot 3 gap is explicitly accepted]_ | |
| Eyewitness testimony | `launch-C2` | _[reviewer records — PARTIAL; only promote if pressure gap is explicitly accepted]_ | |
| Dunning-Kruger | `launch-D3` | _[reviewer records — PARTIAL; only promote if Nuhfer 2016 CANDIDATE is accepted for critique slot]_ | |
| Anchoring bias | `launch-D5` | _[reviewer records — PARTIAL; only promote if slot 2 gap is explicitly accepted]_ | |
| Confirmation bias | `launch-C4` | EXCLUDE_FROM_V1 — 0 VERIFIED sources | Access gap; deferred to v1.1 |
| Astrology | `launch-E5` | EXCLUDE_FROM_V1 — 0 VERIFIED sources | Nature/Elsevier paywall; deferred to v1.1 |

---

## 6. D-76 Entry Criteria

D-76 (final JSON file proposal) may begin only when ALL of the following are true:

| Criterion | Required state |
|-----------|---------------|
| All READY claims | All 5 carry `APPROVE_FOR_D76` in Section 5 decision table |
| NEEDS_EDIT items | Zero — all edits resolved and re-reviewed |
| PARTIAL promotions | Any PARTIAL claim entering v1 has an explicit promotion decision in Section 5 |
| Source URLs | All `source_url` values copied exactly from D-74 Section 3; no invention |
| Placeholders | Zero SOURCE_NEEDED / TODO / blank `source_url` fields in the scope of claims being imported |
| D-59 guard | PR #101 confirmed still merged on main (static checks 119/24/39) |
| Import route | No import call made in D-76 — D-76 creates `data/seed_claims_v2.json` only |
| D1 | No D1 command issued in D-76 |
| Branch + PR | D-76 uses a branch and PR; no direct main commit for the data file |

---

## 7. Safety Boundaries

| Step | Scope | No-cross line |
|------|-------|--------------|
| D-75 (this document) | Review checklist only | No file created, no route called, no D1 touched |
| D-76 | Branch + PR creating `data/seed_claims_v2.json` | No import route called; no wrangler; no D1; direct main commit forbidden |
| D-77 | Gated dry-run: `GET /api/import-seed?mode=dry-run` | Requires explicit per-session approval before the route is called |
| D-78 | Gated apply: `GET /api/import-seed?mode=apply` | Requires separate explicit per-session D1/write approval; moderates all seeds as `review_state='review'` |

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
| No executable JSON files created | ✅ Confirmed — D-75 is a checklist document only |

---

## D-75 Completion Record

| Item | Status |
|------|--------|
| Summary and scope documented | ✅ |
| Per-claim review checklist for all 5 READY claims | ✅ |
| Global review checklist (G-1 through G-12) | ✅ |
| Decision table with all 11 claims listed | ✅ — reviewer fields left blank for human completion |
| D-76 entry criteria defined | ✅ |
| Safety boundaries for D-76 through D-78 | ✅ |
| PARTIAL promotion procedure documented | ✅ |
| EXCLUDED claims noted with reason | ✅ |
| No seed files edited | ✅ |
| No import routes called | ✅ |
| No D1/Wrangler/live writes | ✅ |
