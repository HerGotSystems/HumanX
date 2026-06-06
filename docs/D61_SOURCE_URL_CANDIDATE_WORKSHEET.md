# D-61: Source URL Candidate Worksheet

Date: 2026-06-06
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No seed file edits. No data mutations.
No URLs are fabricated in this document. All candidate_url fields are blank or
TODO_FIND_SOURCE — placeholders for human-verified research.

---

## 1. Summary

D-55 drafted 25 launch claims and 25 truth seed candidates.
D-56 defined source quality rules and a 7-step review workflow.
D-57 defined the JSON file shape and 12 representative draft objects.
D-59 hardened the import routes (dry-run default, review_state='review', SOURCE_NEEDED guard).

**D-61 provides the research scaffold.** It does not supply URLs. It tells a researcher
exactly what to find for each claim and records their findings when complete. Until all
required `VERIFIED` entries are present, `GET /api/import-seed?mode=apply` will be blocked
by the SOURCE_NEEDED guard.

Nothing in this document triggers a write to D1, the Worker, or any seed file.

---

## 2. Worksheet Rules

| Rule | Detail |
|------|--------|
| **Real and reachable** | Every candidate URL must load in a browser without login. Paywalled URLs are permitted only as supplementary evidence alongside a free-access equivalent. |
| **Claim-specific** | The URL must address the exact claim, not just the broad topic. A climate change overview page does not verify "human CO₂ is the primary driver". |
| **Prefer primary/official** | Government agencies, peer-reviewed journals, court records, museum archives, and official scientific bodies beat secondary coverage. |
| **No AI summaries** | Wikipedia, AI-generated pages, and aggregator summaries do not count as evidence. They may be consulted to find primary sources. |
| **No screenshots or social posts as primary proof** | Screenshots can be fabricated; social posts are not archived or peer-reviewed. |
| **Archive if fragile** | If a source is a news article, record the archive date or use an archived URL (e.g., web.archive.org). |
| **One weak source is not enough** | A `media`-class source alone does not justify a `Strongly Supported` or `Proven` verdict. Pair with at least one `documented` or `repeatable` source. |
| **No placeholder imports** | A claim with any `candidate_url: TODO_FIND_SOURCE` must not enter `?mode=apply`. The SOURCE_NEEDED guard enforces this. |

---

## 3. Candidate Source Status Values

| Status | Meaning |
|--------|---------|
| `TODO_FIND_SOURCE` | No candidate identified yet. Research required. |
| `CANDIDATE_FOUND` | A URL has been identified but not yet verified (link tested, content confirmed relevant). |
| `VERIFIED` | URL is live, content directly supports the claim, reliability_score assigned, evidence_body drafted. |
| `REJECTED` | URL was found but does not meet quality rules (e.g., AI summary, broken, off-topic). |
| `NEEDS_BETTER_SOURCE` | URL is acceptable as supplementary but needs a stronger primary source alongside it. |
| `PAYWALLED_OR_INACCESSIBLE` | URL is behind a login or paywall with no free-access equivalent found yet. |
| `BROKEN_LINK` | URL no longer resolves. Archive version needed or replacement required. |

---

## 4. Claim Source Worksheet

The 12 D-57 representative claims. Each has one or more evidence slots. Fill each slot
with a real, verified URL before marking `VERIFIED`. Do not invent URLs.

---

### A-1. Vaccines cause autism

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-A1` |
| exact claim | Vaccines cause autism |
| category | Medicine |
| type | Physical/Testable |
| status target | Disproven |
| launch_blocker | yes |

**Evidence slot 1 — meta-analysis**

| Field | Value |
|-------|-------|
| stance | against |
| quality | repeatable |
| preferred source class | Peer-reviewed meta-analysis / CDC / WHO explainer |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Write a 2–3 sentence neutral summary of what the meta-analysis found once URL is confirmed.) |

**Evidence slot 2 — Wakefield retraction**

| Field | Value |
|-------|-------|
| stance | against |
| quality | documented |
| preferred source class | Lancet retraction notice or BMJ investigation |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 75 |
| evidence_body_draft | (Summarise the retraction finding and fraud determination once URL is confirmed.) |

**Pressure needed:** Correlational timing of autism diagnosis vs. vaccination schedule; what Wakefield's paper actually claimed vs. what it showed.

---

### A-4. Human-caused CO₂ is the primary driver of recent global warming

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-A4` |
| exact claim | Human-caused carbon dioxide emissions are the primary driver of recent global warming |
| category | Climate |
| type | Physical/Testable |
| status target | Strongly Supported |
| launch_blocker | yes |

**Evidence slot 1 — IPCC summary**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | IPCC AR6 Summary for Policymakers (official report, free access) |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 80 |
| evidence_body_draft | (Cite specific finding on attribution of warming to human forcing once URL is confirmed.) |

**Evidence slot 2 — attribution study**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Peer-reviewed climate attribution science paper |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Summarise how attribution studies separate natural vs. human forcing once URL is confirmed.) |

**Pressure needed:** Natural climate variation has always existed — what makes current warming distinctively attributable to CO₂? Feedback uncertainty ranges.

---

### B-4. Smoking causes lung cancer

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-B4` |
| exact claim | Smoking causes lung cancer |
| category | Medicine / Public Health |
| type | Physical/Testable |
| status target | Proven |
| launch_blocker | yes |

**Evidence slot 1 — Doll and Hill 1950**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | BMJ archive — Doll and Hill 1950 study |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 90 |
| evidence_body_draft | (Summarise the study design and finding once URL is confirmed.) |

**Evidence slot 2 — US Surgeon General 1964**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | US DHHS / CDC historical archive — 1964 Surgeon General report |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 80 |
| evidence_body_draft | (Note the report's role as first official US government causation determination once URL is confirmed.) |

**Evidence slot 3 — longitudinal cohort data**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Cancer Research UK / NCI population cohort data |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Summarise population relative risk data once URL is confirmed.) |

**Pressure needed:** Not all smokers develop lung cancer — clarify population-level causation vs. individual certainty.

---

### B-5. The Holocaust murdered approximately six million Jews

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-B5` |
| exact claim | The Holocaust resulted in the murder of approximately six million Jews |
| category | History |
| type | Historical |
| status target | Proven |
| launch_blocker | yes |

**Evidence slot 1 — Nuremberg documentation**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | Yale Avalon Project / Nuremberg trial archive |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Cite specific evidentiary record from Nuremberg proceedings once URL is confirmed.) |

**Evidence slot 2 — Yad Vashem research**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | Yad Vashem database / published methodology |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Summarise the records-based methodology for the victim count estimate once URL is confirmed.) |

**Pressure needed:** Denial claims and why they fail evidentially. Note: this is not equal-weight treatment; the pressure section shows what kind of evidence would be needed to overturn the finding.

---

### C-1. Social media algorithms maximise engagement, not accuracy

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-C1` |
| exact claim | Social media algorithms are designed to maximise engagement, not accuracy |
| category | Technology / Media |
| type | Sociological |
| status target | Strongly Supported |
| launch_blocker | yes |

**Evidence slot 1 — platform internal research**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | WSJ Facebook Files / congressional testimony transcript |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 70 |
| evidence_body_draft | (Quote or paraphrase specific internal finding about engagement optimisation once URL is confirmed.) |

**Evidence slot 2 — academic research**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Peer-reviewed social media algorithm research paper |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 80 |
| evidence_body_draft | (Summarise the study design and engagement vs. accuracy finding once URL is confirmed.) |

**Pressure needed:** Platforms argue their algorithms surface what users want — what does the evidence show about the distinction between engagement optimisation and user-expressed preference?

---

### C-2. Eyewitness testimony is unreliable as sole evidence

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-C2` |
| exact claim | Eyewitness testimony is unreliable as sole evidence in criminal convictions |
| category | Psychology / Law |
| type | Sociological |
| status target | Strongly Supported |
| launch_blocker | yes |

**Evidence slot 1 — Innocence Project**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | Innocence Project exoneration data / annual report |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 75 |
| evidence_body_draft | (State the proportion of wrongful convictions involving eyewitness misidentification once URL is confirmed.) |

**Evidence slot 2 — Loftus memory research**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Peer-reviewed psychology paper — Elizabeth Loftus false memory studies |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Summarise the experimental design showing memory malleability under suggestion once URL is confirmed.) |

**Pressure needed:** Eyewitness testimony is still used in courts worldwide. What safeguards exist and under what conditions does it remain valid?

---

### C-4. Confirmation bias causes people to favour confirming information

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-C4` |
| exact claim | Confirmation bias causes people to favour information that confirms existing beliefs |
| category | Psychology |
| type | Sociological |
| status target | Strongly Supported |
| launch_blocker | yes |

**Evidence slot 1 — Wason selection task studies**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Peer-reviewed cognitive psychology paper (Wason 1968 or follow-up) |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Describe the task design and confirmation-seeking finding once URL is confirmed.) |

**Evidence slot 2 — Nickerson 1998 review**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Psychological Bulletin — Nickerson 1998 confirmation bias review |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Summarise the review's main finding on breadth and robustness of the effect once URL is confirmed.) |

**Pressure needed:** Effect is not universal — varies by topic, identity salience, and stakes. Note conditions under which it is strongest.

---

### D-2. Sleep deprivation impairs cognition comparably to alcohol

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-D2` |
| exact claim | Sleep deprivation impairs cognitive performance comparably to alcohol intoxication |
| category | Medicine / Psychology |
| type | Physical/Testable |
| status target | Strongly Supported |
| launch_blocker | yes |

**Evidence slot 1 — Van Dongen et al. 2003**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Peer-reviewed sleep research paper (Sleep journal or equivalent) |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (State the performance equivalence finding and which cognitive domains were measured once URL is confirmed.) |

**Evidence slot 2 — public health guidance**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | WHO or CDC sleep deprivation health guidance |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 75 |
| evidence_body_draft | (Note recommended sleep duration and impairment thresholds once URL is confirmed.) |

**Pressure needed:** "Comparable" is imprecise — specify which cognitive functions, at what levels of deprivation and intoxication.

---

### D-3. Dunning-Kruger effect: low knowledge → overconfidence

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-D3` |
| exact claim | The Dunning-Kruger effect describes a pattern where people with limited knowledge overestimate their competence |
| category | Psychology |
| type | Sociological |
| status target | Plausible |
| launch_blocker | yes |

**Evidence slot 1 — original 1999 paper**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Journal of Personality and Social Psychology — Kruger & Dunning 1999 |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 80 |
| evidence_body_draft | (Summarise the four-study design and unskilled-and-unaware finding once URL is confirmed.) |

**Evidence slot 2 — critique / replication**

| Field | Value |
|-------|-------|
| stance | against |
| quality | repeatable |
| preferred source class | Peer-reviewed psychology critique or replication attempt |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 80 |
| evidence_body_draft | (Summarise the statistical artefact argument and what replication studies found once URL is confirmed.) |

**Pressure needed:** Some researchers argue the effect is partially a statistical artefact of regression to the mean. Experts also overestimate in areas outside their own field.

---

### D-5. Anchoring bias inflates numerical estimates

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-D5` |
| exact claim | Anchoring bias causes first-presented numbers to disproportionately influence estimates |
| category | Psychology |
| type | Sociological |
| status target | Strongly Supported |
| launch_blocker | yes |

**Evidence slot 1 — Tversky and Kahneman 1974**

| Field | Value |
|-------|-------|
| stance | for |
| quality | repeatable |
| preferred source class | Science journal — Tversky & Kahneman 1974 heuristics paper |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 90 |
| evidence_body_draft | (Describe the wheel-of-fortune anchoring experiment and the UN percentage estimate finding once URL is confirmed.) |

**Evidence slot 2 — real-world anchoring (legal/economic)**

| Field | Value |
|-------|-------|
| stance | for |
| quality | documented |
| preferred source class | Behavioural economics paper or legal sentencing anchoring study |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 75 |
| evidence_body_draft | (Cite a real-world application showing anchoring in sentencing, pricing, or negotiation once URL is confirmed.) |

**Pressure needed:** Effect size varies by domain and expertise level.

---

### E-5. Astrology can predict personality traits

| Field | Value |
|-------|-------|
| draft_claim_id | `launch-E5` |
| exact claim | Astrology can predict personality traits |
| category | Belief |
| type | Physical/Testable |
| status target | Weak Evidence |
| launch_blocker | yes |

**Evidence slot 1 — Shawn Carlson double-blind study 1985**

| Field | Value |
|-------|-------|
| stance | against |
| quality | repeatable |
| preferred source class | Nature journal — Carlson 1985 double-blind astrology test |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 85 |
| evidence_body_draft | (Describe the double-blind design and the null result once URL is confirmed.) |

**Evidence slot 2 — birth-date personality study**

| Field | Value |
|-------|-------|
| stance | against |
| quality | repeatable |
| preferred source class | Peer-reviewed psychology paper on birth date and personality correlation |
| candidate_url | TODO_FIND_SOURCE |
| candidate_title | |
| source_domain | |
| verification_status | TODO_FIND_SOURCE |
| reliability_score_proposed | 80 |
| evidence_body_draft | (Summarise findings on Barnum effect and absence of astrological signal in personality data once URL is confirmed.) |

**Pressure needed:** Barnum effect — vague descriptions feel accurate to most people regardless of sign. Season-of-birth effects are real but explained by school-entry cutoffs, not celestial position.

---

## 5. Pressure / Challenge Source Worksheet

For claims where the pressure point itself needs a source (not all pressure points require
a URL — some are definitional or methodological challenges).

| draft_claim_id | Pressure point | Source needed | candidate_url | verification_status | Notes |
|----------------|---------------|--------------|---------------|-------------------|-------|
| launch-A1 | Wakefield's original study — what it actually claimed vs. showed | Yes — primary source | TODO_FIND_SOURCE | TODO_FIND_SOURCE | BMJ investigation by Brian Deer is the standard reference |
| launch-A4 | Natural climate variation has always existed | Yes — palaeoclimate reference | TODO_FIND_SOURCE | TODO_FIND_SOURCE | IPCC AR6 Chapter 3 discusses attribution; Holocene context |
| launch-B4 | Not all smokers get lung cancer | No — this is a definitional/methodological challenge, no external URL needed | — | N/A | Explain population relative risk vs. individual certainty in body text |
| launch-B5 | Denial arguments and why they fail | Yes — historiography reference | TODO_FIND_SOURCE | TODO_FIND_SOURCE | Deborah Lipstadt's work or US Holocaust Memorial Museum scholarly resource |
| launch-C1 | Platforms argue they surface what users want | Yes — platform policy/transparency report | TODO_FIND_SOURCE | TODO_FIND_SOURCE | Meta / X / YouTube transparency report or policy document |
| launch-C2 | When eyewitness testimony remains valid | Yes — legal standards reference | TODO_FIND_SOURCE | TODO_FIND_SOURCE | National Research Council 2014 eyewitness report or equivalent |
| launch-D3 | Statistical artefact argument against D-K | Yes — included as evidence slot 2 above | See evidence slot 2 | See above | Same URL as evidence slot 2 |
| launch-E5 | Season-of-birth effects are real but school-entry mediated | Yes — social science paper | TODO_FIND_SOURCE | TODO_FIND_SOURCE | Malcolm Gladwell popularised this; need the underlying academic study (Musch & Grondin or equivalent) |

---

## 6. Truth Framing Worksheet

The 12 D-57 truth seed candidates. Truths are repeated sayings and inherited certainties —
not claims of fact. They do not require `source_url` in the importer schema, but some
require careful origin labelling in the UI (as noted in D-55 Section 4).

| truth_id | statement | framing needed | source/framing type | candidate_url if needed | verification_status | launch decision |
|----------|-----------|---------------|--------------------|-----------------------|-------------------|----------------|
| `truth-T1` | If it's on the internet it must be true | Ironic/media-literacy framing; origin label as common digital-era saying | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T2` | The news media always tells the truth | Institutional trust claim | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T3` | The news media always lies | Counter-institutional claim; pair with T2 | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T4` | You can't trust statistics | Anti-evidence dismissal | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T5` | I would know if I was being lied to | Overconfidence in deception detection | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T6` | Seeing is believing | Appeals to direct perception as final authority | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T7` | Everyone knows that | Appeal to consensus without evidence | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T8` | That's just common sense | Dismissal of need for evidence | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T9` | The majority can't be wrong | Majority-appeal claim | Cultural saying | — | N/A | `launch-candidate` |
| `truth-T10` | If you have nothing to hide, you have nothing to fear | Privacy/surveillance claim; politically sensitive | Political saying | May need scholarly origin ref | TODO_FIND_SOURCE if needed | `needs-careful-framing` — origin label essential; must not read as HumanX endorsing surveillance |
| `truth-T11` | Freedom of speech means freedom from consequences | Common misapplication; origin in legal/civic discourse | Legal/civic saying | — | N/A | `launch-candidate` |
| `truth-T12` | Success is purely the result of hard work | Meritocracy claim | Cultural/economic saying | — | N/A | `launch-candidate` |

**3 truths from D-55 flagged `needs-careful-framing` (not in D-57 representative 12):**
- "If you have nothing to hide, you have nothing to fear" — included as T10 above
- "Democracy is the best system of government" — origin label as Western political tradition essential; comparative claim
- "My religion is the only true path" — requires visible religious-claim origin label in UI; do not import until frontend origin/category display is confirmed working

---

## 7. Readiness Gates

A claim cannot move to final seed JSON (`data/seed_claims_v2.json`) or be submitted to
`GET /api/import-seed?mode=apply` until all of the following are met:

| Gate | Check |
|------|-------|
| All required `candidate_url` fields are `VERIFIED` (not `TODO_FIND_SOURCE`, `CANDIDATE_FOUND`, `REJECTED`, etc.) | ☐ |
| All `VERIFIED` URLs tested live and load without login | ☐ |
| `evidence_body` drafted in neutral, factual language for each slot | ☐ |
| `reliability_score` assigned to each evidence item | ☐ |
| `pressure` slot reviewed — at least 1 pressure point per claim | ☐ |
| `launch_blocker` confirmed `false` for this claim | ☐ |
| D-56 7-step review workflow complete for this claim | ☐ |
| Claim text reviewed for precision (no ambiguous scope, no unsupported verdict inflation) | ☐ |

**No partial import is permitted.** If any claim in the seed pack fails a gate, the
entire pack is held until all claims pass. The SOURCE_NEEDED guard in `?mode=apply`
enforces this at the technical level.

---

## 8. D-61 Completion Status

This worksheet is the research scaffold. The actual research (finding and verifying URLs)
is a human task — it cannot be completed by docs-only tooling.

| Item | Status |
|------|--------|
| Worksheet structure created | ✅ |
| 12 D-57 claims mapped to evidence slots | ✅ |
| Preferred source class specified per slot | ✅ |
| Pressure source needs identified | ✅ |
| 12 truth framing decisions documented | ✅ |
| Readiness gates defined | ✅ |
| All candidate_url fields: TODO_FIND_SOURCE | ✅ (no URLs fabricated) |
| No seed files edited | ✅ |
| No D1/Wrangler/import routes called | ✅ |
| No production mutations | ✅ |

**What still needs human research:**
- Find and verify candidate URLs for all 18 evidence slots above
- Find and verify candidate URLs for pressure points that need sources (5 items)
- Decide whether T10 needs a scholarly origin reference
- Confirm the 3 `needs-careful-framing` truths are safe to import given current UI

---

## 9. Future Path

| Batch | Type | Scope |
|-------|------|-------|
| **D-62** | Docs-only | Final launch seed pack source-insertion draft — human fills in real URLs from research; all TODO_FIND_SOURCE → VERIFIED; evidence_body text finalized; readiness gates checked; no import yet |
| **D-63** | Admin action (gated) | Dry-run import plan — run `GET /api/import-seed?mode=dry-run` and `GET /api/import-truths?mode=dry-run`; review structured report; confirm counts match expected; requires explicit per-session approval to call any import route |
| **D-64** | Admin action (gated) | Production import — run `?mode=apply` only after D-63 dry-run reviewed; immediately followed by admin Review queue moderation of all `review_state='review'` content; requires explicit per-session D1/write approval |
