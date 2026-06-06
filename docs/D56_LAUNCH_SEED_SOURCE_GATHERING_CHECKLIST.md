# D-56: Launch Seed Source Gathering Checklist

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes. No D1 commands. No data mutations.
No seed files edited. No data imported, archived, or deleted.
No actual URLs included — all entries are research targets and placeholder structures only.

---

## 1. Summary

D-55 proposed 25 launch claims and 25 truth seed candidates. Every evidence item in D-55
carries a `SOURCE_NEEDED: <type>` placeholder. Those placeholders are not importable — they
are a signal that a human researcher must locate, verify, and confirm a real public URL before
any production import can occur.

D-56 turns those placeholders into a structured source-gathering checklist:

- Defines what an acceptable source looks like (quality rules)
- Provides a reusable evidence item template for filling in confirmed sources
- Documents per-category source expectations
- Lists every D-55 claim as a checklist row with evidence count, preferred source type,
  priority, and launch-readiness blocker status
- Lists truth seed framing and source requirements
- Documents the review workflow a researcher follows when vetting a candidate URL
- Confirms the future path to D-57 (JSON draft) and D-58 (import safety)

No URLs are invented in this document. No data is imported. No seed files are edited.
This document is the human-facing research brief for whoever gathers sources before D-57.

---

## 2. Source Quality Rules

### 2A. Acceptable source classes (in descending authority order)

| Class | Description | Typical quality label |
|-------|-------------|----------------------|
| **Primary official source** | Government agency, standards body, international institution. E.g.: CDC, WHO, NIST, IAEA, BIPM, Bundestag, US National Archives, IPCC. | `documented` or `repeatable` |
| **Scientific / public health agency** | NHS, NCI, Cancer Research UK, NIH, ESA, NASA — published guidance or data pages. | `documented` |
| **Peer-reviewed paper** | Published in a named journal; has DOI; findable via PubMed, JSTOR, or publisher site. Author names, year, and journal name should be recorded. | `repeatable` (if study is replicable) or `documented` |
| **Museum / archive / library** | Smithsonian, Yad Vashem, Yale Avalon Project, British Library, Internet Archive. Primary historical documents. | `documented` |
| **University explainer / textbook** | An official university department page or named textbook; not a student essay or forum post. | `documented` |
| **Reputable encyclopedia** | Britannica, Stanford Encyclopedia of Philosophy — acceptable as secondary support only, not as sole source for a factual claim. | `media` |
| **News archive with byline** | Named journalist, named outlet with an editorial standards policy (BBC, AP, Reuters, NYT, BMJ News). Date and URL must resolve. | `media` |
| **Direct dataset** | Government statistics portal (ONS, BLS, Eurostat), university data repository, institutional data release. | `documented` |
| **Fact-check archive** | AFP Fact Check, Reuters Fact Check, Snopes (for documented manipulation cases) — acceptable for media-literacy claims only. | `media` |

### 2B. Weak or disallowed source classes for launch pack

| Class | Reason disallowed | Alternative |
|-------|-------------------|-------------|
| Random blog or personal site as primary proof | No editorial standards; no fact-checking; no accountability | Find the primary source the blog cites; link that instead |
| Screenshots alone | Not verifiable; content changes | Link to the original page; screenshot is supplementary |
| Unsourced social media posts | No attribution chain | Find the named person's statement in a news archive or official context |
| AI-generated summaries as evidence | Not a primary source; content can hallucinate | Use the source the AI would cite if asked |
| Partisan advocacy sites (primary proof only) | Selection bias; motivated framing | Find independent or official source confirming the same fact |
| Ragebait or outrage-optimised content | Violates D-55 launch principles | Locate the underlying event in a neutral news archive |
| Broken or shortened links | Cannot be verified | Resolve to canonical URL before recording |
| Paywalled-only source as sole evidence | Cannot be read by general users | Find a free preprint, press release, or agency summary |
| Undated web pages | Cannot confirm currency | Note date of last modification; find a dated alternative if possible |
| Wikipedia as primary source | Editable; secondary compilation | Use Wikipedia's cited primary source; link that |

---

## 3. Evidence Item Template

Use this structure when recording a confirmed source for any D-55 claim. This is the
pre-import format — not a JSON schema, just the fields that must be filled before D-57.

```
claim_id_placeholder : <D-55 claim short name, e.g. "A-1-vaccines-autism">
stance               : support | pressure
quality              : repeatable | documented | media | testimony | vibes
title                : <short descriptive title for this evidence item>
body                 : <2–4 sentence summary of what the source shows and why it is relevant
                        to the claim; written in plain English; no raw quote dumps>
source_url           : <confirmed, publicly accessible URL — not a placeholder>
media_type           : article | study | report | dataset | video | book | archive
reliability_score    : <integer 5–90, consistent with quality label — see D-55 Section 5>
source_domain        : <domain only, e.g. cdc.gov, bmj.com, iaea.org>
notes                : <any caveats: paywall note, language, access date, preprint status>
```

Minimum fields required before a source is considered "ready for D-57":
- `source_url` resolved and accessible
- `quality` label assigned
- `body` written (cannot be left as "see link")
- `reliability_score` assigned
- `stance` confirmed

---

## 4. Source Expectations by Category

### Category A — Science / Physical World

| Item | Guidance |
|------|----------|
| Ideal source types | Peer-reviewed studies, government/public health agency pages, university physics explainers, international scientific body publications |
| Minimum source count per claim | 2 (1 primary support + 1 pressure or 2 primary if claim is contested) |
| Pressure source expectations | At least 1 pressure source must challenge a specific limitation of the claim (measurement uncertainty, scope boundary, definitional ambiguity) — not just general opposition |
| Reliability score guidance | Primary support: 70–90 (`repeatable`/`documented`). Pressure items: 30–60 (`media` or `documented`) |
| Home test / source check | For Physical/Testable claims: verify the home test protocol is described in at least one source or a credible explainer; the protocol should be replicable without specialist equipment |

### Category B — History / Public Record

| Item | Guidance |
|------|----------|
| Ideal source types | Official archives, national historical institutes, international body reports (IAEA), published declassified records, named museum holdings, named academic publications |
| Minimum source count per claim | 2 (1 archival/primary + 1 scholarly secondary or second archive) |
| Pressure source expectations | Pressure should surface genuine interpretive debates (casualty estimates, definitional ambiguity of events, competing historical claimants) — not denialism for its own sake |
| Reliability score guidance | Archival primary: 70–80. Peer-reviewed history: 65–75. Named museum page: 60–70. News archive: 35–50 |
| Home test / source check | Identify the specific archive or museum holding where a primary source document can be located; name the collection |

### Category C — Civic / Media Literacy

| Item | Guidance |
|------|----------|
| Ideal source types | Peer-reviewed social science papers, congressional testimony transcripts (for platform-disclosure claims), academic engagement studies, Innocence Project reports, forensic science reviews |
| Minimum source count per claim | 2 (1 study-backed primary + 1 confirming or contextualising source) |
| Pressure source expectations | Pressure must address the real counterargument (not a strawman); e.g. for eyewitness testimony — what conditions improve reliability |
| Reliability score guidance | Peer-reviewed: 70–85. Congressional testimony: 55–70. Investigative journalism archive: 40–55 |
| Home test / source check | For media literacy claims with a home test (e.g. C-3 photo metadata): verify the specific free tool referenced is still publicly accessible |

### Category D — Human Behaviour / Cognitive Bias

| Item | Guidance |
|------|----------|
| Ideal source types | Named peer-reviewed papers in psychology journals (JPSP, Psychological Bulletin, Science, Nature); meta-analyses preferred over single studies; public health agency guidance where applicable |
| Minimum source count per claim | 2 (original study + a replication or meta-analysis) |
| Pressure source expectations | For claims with replication concerns (D-1 bystander effect, D-3 Dunning-Kruger): the pressure source should be a legitimate replication critique, not anecdote; status should reflect current evidence weight |
| Reliability score guidance | Classic peer-reviewed + replicated: 80–90. Contested or mixed-replication: 55–70 (`documented`). Note replication status explicitly |
| Home test / source check | If a home test is proposed, verify the test design is described in at least one cited source; note what it measures vs. what it cannot measure |

### Category E — Untestable / Belief (clearly labelled)

| Item | Guidance |
|------|----------|
| Ideal source types | Philosophical/theological primary texts (named), medical case study collections for NDE claims, peer-reviewed psychology studies for testable sub-claims (meditation, intuition), academic reviews of evidence presented by believers |
| Minimum source count per claim | 1 minimum; prefer 2 (1 presenting the experiential case; 1 examining its epistemic limits) |
| Pressure source expectations | Pressure for Untestable claims should explain why the claim resists physical test — not dismiss the belief; survivorship bias, anoxia effects on NDE, Barnum effect for astrology |
| Reliability score guidance | Testimony/personal account: 20–30. Medical case study: 35–50. Peer-reviewed test of a testable sub-claim: 65–80 |
| Home test / source check | For E-5 (astrology) only: verify the Carlson 1985 study is correctly cited (Nature journal, volume and page); for belief-type claims, note what a falsification test would require |

---

## 5. Claim-by-Claim Source Checklist

One row per D-55 proposed claim. Each row shows:
- What D-55 requires
- Preferred source type
- Minimum confirmed sources needed before D-57 can proceed
- Priority (high = launch-blocking; medium = included if ready; low = nice-to-have for day one)
- Launch readiness blocker (Yes = claim cannot import without this; No = optional)

No URLs are in this table. Columns are research targets only.

---

### Category A — Science / Physical World

| Claim | D-55 evidence items needed | Preferred source type | Min sources for D-57 | Priority | Launch blocker |
|-------|---------------------------|----------------------|---------------------|----------|---------------|
| **A-1** Vaccines cause autism | 1. Vaccine-autism meta-analysis 2. Wakefield retraction | Peer-reviewed meta-analysis + journal retraction notice | 2 | High | Yes — claim has no launch value without both support and the retraction; a single source would misrepresent the evidence structure |
| **A-2** Speed of light is constant in a vacuum | 1. Michelson-Morley experiment source 2. SI unit definition | University physics resource + NIST or BIPM standards page | 2 | Medium | No — foundational physics; can launch with 1 strong source and a pressure item |
| **A-3** Universe is approximately 13.8 billion years old | 1. CMB measurement source 2. Stellar age independent confirmation | NASA/ESA mission explainer + peer-reviewed astrophysics | 2 | Medium | No — 1 well-sourced item sufficient for day one; "approximately" must be in claim text |
| **A-4** Human-caused CO₂ is primary driver of recent warming | 1. IPCC summary source 2. Attribution study | IPCC AR6 SPM + peer-reviewed attribution science paper | 2 | High | Yes — politically sensitive claim; needs both consensus source and at least 1 pressure item to avoid appearing one-sided |
| **A-5** Antibiotics ineffective against viral infections | 1. Mechanism explainer 2. AMR report | CDC/NHS/WHO page + WHO AMR report | 2 | High | Yes — high public health relevance; both mechanism and resistance stakes must be sourced |

---

### Category B — History / Public Record

| Claim | D-55 evidence items needed | Preferred source type | Min sources for D-57 | Priority | Launch blocker |
|-------|---------------------------|----------------------|---------------------|----------|---------------|
| **B-1** Chernobyl disaster occurred in 1986 | 1. IAEA official report 2. Declassified/archival record | IAEA Chernobyl Forum report + national archive reference | 2 | Medium | No — date is non-controversial; 1 archival source sufficient; pressure (casualty estimates) needs its own source |
| **B-2** Berlin Wall fell in 1989 | 1. News archive source 2. Official German historical record | Contemporary news archive + Bundestag or German historical institute | 2 | Low | No — widely documented; 1 strong source sufficient for day one |
| **B-3** First powered aircraft flight by Wright Brothers in 1903 | 1. Smithsonian documentation 2. Patent/contemporary records | Smithsonian NASM archive + US Patent Office records | 2 | Medium | No — 2 sources needed to handle competing-claimant pressure; both support and pressure require sourcing |
| **B-4** Smoking causes lung cancer | 1. Doll and Hill 1950 study 2. US Surgeon General 1964 report 3. Longitudinal cohort data | BMJ archive + CDC/DHHS historical archive + Cancer Research UK or NCI data | 3 | High | Yes — landmark causal claim; needs 3 sources to demonstrate the historical evidence arc; launch-blocking |
| **B-5** Holocaust resulted in murder of approximately six million Jews | 1. Nuremberg trial documentation 2. Yad Vashem research | Yale Avalon Project or Nuremberg archive + Yad Vashem published methodology | 2 | High | Yes — high-stakes historical fact; both archival and scholarly sources required; pressure section (denial) must be carefully sourced |

---

### Category C — Civic / Media Literacy

| Claim | D-55 evidence items needed | Preferred source type | Min sources for D-57 | Priority | Launch blocker |
|-------|---------------------------|----------------------|---------------------|----------|---------------|
| **C-1** Social media algorithms designed to maximise engagement | 1. Platform disclosure / internal research source 2. Academic engagement study | Congressional testimony transcript or WSJ/Guardian primary reporting + peer-reviewed social media algorithm paper | 2 | High | Yes — core platform-relevance claim; both documentary and scholarly support needed |
| **C-2** Eyewitness testimony unreliable as sole evidence | 1. Innocence Project exoneration data 2. Elizabeth Loftus memory research | Innocence Project annual report or published methodology + named Loftus paper (peer-reviewed) | 2 | High | Yes — counter-intuitive claim; exoneration data and memory science both needed to make the case |
| **C-3** Photographs can be manipulated without visible detection | 1. Documented manipulation case source 2. AI image detection research | Reuters photo standards / AFP fact-check archive + peer-reviewed detection-failure study or credible news coverage | 2 | Medium | No — 1 strong manipulation-case source is sufficient; AI detection research adds weight |
| **C-4** Confirmation bias causes people to favour confirming information | 1. Wason selection task study 2. Nickerson 1998 review | Named cognitive psychology paper + Psychological Bulletin Nickerson review | 2 | High | Yes — explanation-of-platform claim; both an experimental study and a review needed for credibility |
| **C-5** Retracted papers continue to be cited after retraction | 1. Retraction Watch data 2. Post-retraction citation study | Retraction Watch database/methodology + peer-reviewed scientometrics paper | 2 | Medium | No — Retraction Watch alone may be sufficient for day one; citation study adds scholarly weight |

---

### Category D — Human Behaviour / Cognitive Bias

| Claim | D-55 evidence items needed | Preferred source type | Min sources for D-57 | Priority | Launch blocker |
|-------|---------------------------|----------------------|---------------------|----------|---------------|
| **D-1** Bystander effect reduces likelihood of help | 1. Darley and Latané 1968 study 2. Replication meta-analysis | Named psychology journal + Psychological Bulletin or peer-reviewed replication study | 2 | Medium | No — replication debate makes this a `Plausible` claim; both original and critique needed; pressure must use the replication data |
| **D-2** Sleep deprivation impairs cognition comparably to alcohol | 1. Van Dongen et al. 2003 study 2. Public health guidance | Peer-reviewed sleep research paper + WHO/CDC sleep guidance | 2 | Medium | No — 1 strong study sufficient for day one; public health guidance adds practical weight |
| **D-3** Dunning-Kruger effect describes overestimation by low-knowledge people | 1. Dunning and Kruger 1999 paper 2. Critique/replication | Journal of Personality and Social Psychology + peer-reviewed critique | 2 | Medium | No — both needed to avoid overstating a contested finding; status `Plausible` must be defensible |
| **D-4** People generally poor at detecting lies | 1. Bond and DePaulo 2006 meta-analysis 2. Professional lie-detector research | Peer-reviewed psychology meta-analysis + government or peer-reviewed polygraph/professional-detection review | 2 | Medium | No — meta-analysis alone is strong; professional detection source adds depth |
| **D-5** Anchoring bias causes first numbers to disproportionately influence estimates | 1. Tversky and Kahneman 1974 study 2. Real-world anchoring evidence | Named Science journal study + behavioural economics paper or legal sentencing study | 2 | Medium | No — Tversky/Kahneman citation alone is well-known and accepted; real-world evidence adds applied weight |

---

### Category E — Untestable / Belief

| Claim | D-55 evidence items needed | Preferred source type | Min sources for D-57 | Priority | Launch blocker |
|-------|---------------------------|----------------------|---------------------|----------|---------------|
| **E-1** There is a God | 1. Theological/philosophical primary source | Named philosophical or theological text; framing-heavy; no "proof" claim | 1 (framing only) | Low | No — `Untestable` verdict is the key; the evidence item explains why it is untestable, not why God does/doesn't exist; framing quality is the blocker |
| **E-2** Consciousness continues after death | 1. NDE medical case study collection | Named medical study (AWARE study or equivalent) | 1 | Low | No — 1 empathetically framed source plus clear `Untestable` label; pressure items (anoxia, hallucination) need sourcing |
| **E-3** Meditation reduces measurable stress markers | 1. MBSR trial data 2. Cortisol measurement study | Peer-reviewed RCT (JAMA or equivalent) + peer-reviewed physiology paper | 2 | Medium | No — both sources needed to make the biological mechanism case; this claim is Physical/Testable despite belief framing |
| **E-4** Some people have a sixth sense for danger | 1. Psychology of intuition literature | Named peer-reviewed intuition paper or scholarly review | 1 | Low | No — pressure items (survivorship bias, pattern recognition) are more important than the support source; 1 source sufficient |
| **E-5** Astrology can predict personality traits | 1. Shawn Carlson 1985 double-blind study 2. Birth-date personality correlation study | Nature journal (Carlson 1985) + peer-reviewed psychology paper | 2 | Medium | No — Carlson alone is a classic citation; the second source strengthens the `Weak Evidence` verdict |

---

## 6. Truth Seed Framing and Source Checklist

Truth seeds do not have `source_url` in the current schema. They are repeated sayings and
inherited certainties — the "claim" is that someone sincerely believes or asserts this.
Source needs for truth seeds are framing notes and category labels, not evidence URLs.

### 6A. Truths that need only framing copy confirmation (no source URL required)

These 22 statements are `launch-candidate` and enter with `confidence_label: 'claimed'`.
The checklist task is to confirm the framing note is clear and the category label is set.

| Statement | Category label needed | Framing note status |
|-----------|----------------------|---------------------|
| If it's on the internet it must be true | media-literacy | ✅ Clear |
| The news media always tells the truth | media-literacy | ✅ Clear |
| The news media always lies | media-literacy | ✅ Clear — pair with previous |
| You can't trust statistics | media-literacy | ✅ Clear |
| A picture is worth a thousand words | media-literacy | ✅ Clear |
| I have a great memory | memory-perception | ✅ Clear |
| I would know if I was being lied to | memory-perception | ✅ Clear |
| Seeing is believing | memory-perception | ✅ Clear |
| I remember it clearly | memory-perception | ✅ Clear |
| My gut feeling is always right | memory-perception | ✅ Clear |
| Everyone knows that | social-pressure | ✅ Clear |
| That's just common sense | social-pressure | ✅ Clear |
| The majority can't be wrong | social-pressure | ✅ Clear |
| Follow the money | social-pressure | ✅ Clear |
| Freedom of speech means freedom from consequences | civic | ✅ Clear |
| The government is always corrupt | civic | ✅ Clear |
| Voting doesn't make a difference | civic | ✅ Clear |
| Laws are fair to everyone | civic | ✅ Clear |
| Things were better in the past | belief-identity | ✅ Clear |
| Human nature never changes | belief-identity | ✅ Clear |
| You can't change who you are | belief-identity | ✅ Clear |
| Success is purely the result of hard work | belief-identity | ✅ Clear |
| Fate is already decided | belief-identity | ✅ Clear |

### 6B. Truths that need stronger framing before launch

These 3 statements are `needs-careful-framing`. The blocker is visible origin/category
display in the UI, not a source URL. They should not launch without a category label that
makes the origin of the saying clear to the reader.

| Statement | Required framing | Blocker |
|-----------|-----------------|---------|
| If you have nothing to hide, you have nothing to fear | Must show: origin in surveillance policy debate; not a HumanX endorsement; category label: `social-pressure` or `civic` | UI category label must be visible before import |
| Democracy is the best system of government | Must show: origin in Western liberal political tradition; comparative claim, not a fact; category label: `civic` | UI category label + visible framing note before import |
| [Third `needs-careful-framing` slot — confirm from D-55 Section 4] | TBD — confirm which of the 3 framing-sensitive entries needs the most work | Review D-55 Section 4 to confirm the third entry |

### 6C. Existing truth seeds from D-54 needing UI framing before launch

The following 3 existing seeds (already in the DB via `importTruthSeeds`) require visible
`origin` / `category` display in the frontend before they should appear to new users:

| Statement | Concern | Required action before launch |
|-----------|---------|-------------------------------|
| Children should always obey adults | Child safety framing; may read as HumanX position | Frontend category/origin label must display; deferred to frontend D |
| My religion is the only true path | Without framing: reads as endorsement or attack | Frontend origin label: "religious doctrine / sincere belief" required |
| People are stupid | Hostile phrasing without context | Frontend category label + visible "inherited saying" framing required |

These 3 items are a frontend work item (display of `category` and a framing note), not a
data import item. They cannot be resolved in D-56 alone.

---

## 7. Source Review Workflow

When a researcher locates a candidate URL for any D-55 claim, they should follow this
seven-step workflow before marking a source as "ready for D-57":

```
Step 1: Collect candidate URL
  - Record the full, unshortened URL
  - Confirm it resolves and loads without error
  - Note the access date

Step 2: Verify source identity
  - Name the author(s), institution, or organisation responsible for the content
  - Confirm it matches the expected source class (see Section 2A)
  - If peer-reviewed: note the journal name, volume, year, and DOI if available

Step 3: Verify claim match
  - Read the source; confirm it directly supports or challenges the claim as worded
  - If the source is about a related but different claim, flag it as "partial match"
    and do not mark as ready
  - Confirm scope: a general population study should not be cited for an individual-
    certainty claim; clarify in the evidence body

Step 4: Write a short evidence body
  - 2–4 sentences in plain English summarising what the source shows
  - Do not quote directly (paraphrase and interpret)
  - State clearly why this source is relevant to the specific claim text
  - Note any scope limitation in the body (e.g. "in the study population of...")

Step 5: Assign reliability_score
  - Use Section 2A quality label first; derive score from D-55 Section 5 guidance
  - If the source is contested or partially replicated, score lower and note in body

Step 6: Add pressure source if needed
  - If the claim row has a pressure requirement (see Section 5 checklist), locate
    a separate source for the pressure item following the same 7-step process
  - Pressure sources should address a genuine limitation, not a strawman

Step 7: Mark as ready for D-57
  - All required fields in the evidence item template (Section 3) are filled
  - source_url resolves
  - body is written
  - reliability_score is assigned
  - stance is confirmed
  - Record: "D-57 ready: YES" in the working notes
```

---

## 8. Future Path

| Batch | Type | Scope |
|-------|------|-------|
| **D-57** | Docs-only | Launch seed JSON draft — write complete JSON structures for `data/seed_claims_v2.json` using D-55 claim text and D-56 confirmed sources; include placeholder IDs (e.g. `launch-a1-vaccines-autism`); evidence items use filled `source_url` from D-56 review workflow; no import yet; format must match `HUMANX_SEED` object shape in `src/seed-data.js` |
| **D-58** | Worker change (branch + PR) | Import route safety plan — modify `importSeedData` and `importTruthSeeds` to insert content as `review_state='review'` instead of `'public'`; admin must explicitly approve each item before it goes public; this is a code change requiring branch + PR per project rules |
| **D-59** | Gated | Production import / cleanup plan — after D-56 sources confirmed, D-57 JSON finalised, D-58 safety change merged: step-by-step plan for production import; execution requires explicit per-session D1 approval; includes pre-import DB snapshot, post-import PRAGMA check, and admin review step |
| **Optional** | Human research | Live source gathering — a human researcher (or approved future session) fills D-56 rows using real web research; must not invent URLs; must follow the Section 7 review workflow; results feed into D-57 JSON draft |

---

## 9. Safety

| Rule | Status |
|------|--------|
| No D1 writes in D-56 | ✅ Confirmed |
| No seed file edits | ✅ Confirmed |
| No data imported | ✅ Confirmed |
| No data archived or deleted | ✅ Confirmed |
| No URLs invented or verified in this document | ✅ All entries are research targets and placeholder structures only |
| No Worker changes | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No production mutations | ✅ Confirmed |

---

## D-56 Completion Record

| Item | Status |
|------|--------|
| Source quality rules defined (acceptable and disallowed classes) | ✅ |
| Evidence item template defined | ✅ |
| Per-category source expectations (A–E) | ✅ |
| Claim-by-claim checklist: all 25 D-55 claims | ✅ |
| Truth seed framing/source checklist (22 launch-candidate + 3 needs-framing + 3 existing DB) | ✅ |
| Source review workflow (7-step) | ✅ |
| Future path D-57 → D-58 → D-59 defined | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No seed data imported / edited / deleted | ✅ Confirmed |
| No fake or invented URLs | ✅ Confirmed |
