# D-55: Launch Seed Pack Draft

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes. No D1 commands. No data mutations.
No seed files edited. No data imported, archived, or deleted.

---

## 1. Summary

The existing seed claims (`data/seed_claims_v1.json`) were built to demonstrate the HumanX
scoring engine across a wide range of verdict tiers: Disproven, Strongly Supported,
Untestable, Reality Collapse. They do this well. They are not a public-launch-first-impression
seed pack.

D-54 found: 0/7 evidence `source_url` entries filled; two of four claims are demo-only;
both import routes publish directly as `review_state='public'`, bypassing moderation.

D-55 proposes a calm, source-backed launch seed pack. Nothing in this document is executable.
No data is imported, edited, or deleted. All `source_url` entries are marked
`SOURCE_NEEDED: <type>` — placeholders for human-verified links to be filled before any
production import.

---

## 2. Launch Pack Principles

| Principle | Detail |
|-----------|--------|
| **Boring but strong first impression** | No ragebait-first claims. A new visitor should read the opening claim set and feel the platform is credible, calm, and useful — not provocative. |
| **Source-backed** | Every evidence item must have a real `source_url` before import. `SOURCE_NEEDED` placeholders are not importable; they are a checklist for D-56. |
| **Balanced pressure** | Each claim should have at least one pressure point. It signals the platform takes opposing evidence seriously even for well-supported claims. |
| **Safe verification** | Physical/testable claims should have a home test or observation protocol a non-expert can actually try. |
| **Clear Truths framing** | The Truths layer collects repeated sayings, inherited certainties, and cultural claims — not verified facts. This must be visible in the UI before truth seeds are imported. |
| **No conspiracy-first** | Engine-demo claims (flat earth, perpetual motion) are not the first thing a new user sees. They remain in the DB as browseable content, not the featured opening set. |
| **Reversible** | All seed content enters `review_state='review'` or is admin-approved explicitly. No direct-to-public bypass at launch (see D-58 import route safety plan). |

---

## 3. Proposed Claim Set

Twenty-five draft claims across five categories. Each includes the claim text, category,
type, a brief launch rationale, evidence needed, pressure needed, a home test idea where
applicable, and a risk assessment.

All `source_url` values are placeholders — no URLs are verified or linked in this document.

---

### Category A — Science / Physical World

---

**A-1. Vaccines cause autism**

| Field | Value |
|-------|-------|
| Claim | Vaccines cause autism |
| Category | Medicine |
| Type | Physical/Testable |
| Status target | Disproven |
| Launch reason | High-stakes public health claim; massive independent evidence base; demonstrates the platform at its most socially useful |
| Evidence needed | 1. Meta-analysis of autism-vaccine studies (SOURCE_NEEDED: peer-reviewed meta-analysis / CDC / WHO explainer) 2. Retraction of the original Wakefield paper (SOURCE_NEEDED: Lancet retraction notice / BMJ investigation) |
| Pressure needed | 1. Correlational timing coincidence (autism diagnosis often occurs around vaccination age) 2. What the original Wakefield study actually showed vs. claimed |
| Home test | n/a — population-level research; note what a rigorous study would need to show to establish causation |
| Risk | Low — strong scientific consensus; present the evidence structure, not just the verdict |

---

**A-2. The speed of light is constant in a vacuum**

| Field | Value |
|-------|-------|
| Claim | The speed of light is constant in a vacuum |
| Category | Physics |
| Type | Physical/Testable |
| Status target | Strongly Supported |
| Launch reason | Foundational physics; well-sourced; shows the platform handles established science without editorialising |
| Evidence needed | 1. Michelson-Morley experiment (SOURCE_NEEDED: university physics resource / NIST explainer) 2. Definition in SI units (SOURCE_NEEDED: BIPM / NIST) |
| Pressure needed | 1. Speed of light in media other than vacuum (glass, water) is lower — clarify the claim scope |
| Home test | Observe light delay in communications — estimate round-trip ping time vs. speed-of-light travel distance for known satellite distances |
| Risk | Very low |

---

**A-3. The universe is approximately 13.8 billion years old**

| Field | Value |
|-------|-------|
| Claim | The universe is approximately 13.8 billion years old |
| Category | Cosmology |
| Type | Physical/Testable |
| Status target | Strongly Supported |
| Launch reason | Demonstrates how a very large scientific claim is graded; good counterpoint to untestable belief claims |
| Evidence needed | 1. CMB measurement (SOURCE_NEEDED: NASA / ESA Planck mission explainer) 2. Stellar age independent confirmation (SOURCE_NEEDED: peer-reviewed astrophysics paper) |
| Pressure needed | 1. Measurement uncertainty range; 2. Alternative cosmological models and why they are less supported |
| Home test | None practical — note what kind of instruments made this measurement |
| Risk | Very low — well-established; note "approximately" is intentional and honest |

---

**A-4. Human-caused carbon dioxide emissions are the primary driver of recent global warming**

| Field | Value |
|-------|-------|
| Claim | Human-caused carbon dioxide emissions are the primary driver of recent global warming |
| Category | Climate |
| Type | Physical/Testable |
| Status target | Strongly Supported |
| Launch reason | Demonstrates that a politically contested claim can be evidence-graded fairly; strong consensus evidence base |
| Evidence needed | 1. IPCC summary (SOURCE_NEEDED: IPCC AR6 Summary for Policymakers) 2. Attribution studies distinguishing natural vs. human forcing (SOURCE_NEEDED: peer-reviewed attribution science paper) |
| Pressure needed | 1. Natural variation has always existed — what makes current warming attributable to CO₂? 2. Feedback uncertainty ranges |
| Home test | Track local temperature anomalies over a decade against a baseline; note limitations of local data vs. global signal |
| Risk | Medium — politically sensitive; present the evidence without verdict inflation; let the scoring engine do the work |

---

**A-5. Antibiotics are ineffective against viral infections**

| Field | Value |
|-------|-------|
| Claim | Antibiotics are ineffective against viral infections |
| Category | Medicine |
| Type | Physical/Testable |
| Status target | Proven |
| Launch reason | High-value public health literacy claim; explains antibiotic resistance risk; strong mechanism-level evidence |
| Evidence needed | 1. Mechanism explanation — antibiotics target bacterial cell walls/processes not present in viruses (SOURCE_NEEDED: CDC / NHS / WHO explainer) 2. Antibiotic resistance data (SOURCE_NEEDED: WHO AMR report) |
| Pressure needed | 1. Secondary bacterial infections can follow viral illness and do respond to antibiotics — clarify the distinction |
| Home test | None practical — note the difference in prescribing guidelines for bacterial vs. viral conditions |
| Risk | Very low |

---

### Category B — History / Public Record

---

**B-1. The Chernobyl nuclear disaster occurred in 1986**

| Field | Value |
|-------|-------|
| Claim | The Chernobyl nuclear disaster occurred in 1986 |
| Category | History |
| Type | Historical |
| Status target | Proven |
| Launch reason | Well-documented event; strong archival evidence; good entry-level historical claim |
| Evidence needed | 1. IAEA official report (SOURCE_NEEDED: IAEA Chernobyl Forum report) 2. Soviet state records / declassified documents (SOURCE_NEEDED: national archive or declassified Soviet records reference) |
| Pressure needed | 1. Disputed casualty estimates — what the data actually shows vs. early Soviet reporting |
| Home test | None applicable — locate and read primary historical source documents |
| Risk | Very low |

---

**B-2. The Berlin Wall fell in 1989**

| Field | Value |
|-------|-------|
| Claim | The Berlin Wall fell in 1989 |
| Category | History |
| Type | Historical |
| Status target | Proven |
| Launch reason | Widely known event; excellent documentary evidence; shows simple historical claims are graded quickly |
| Evidence needed | 1. Contemporary news coverage archive (SOURCE_NEEDED: news archive / museum reference) 2. Official German government historical record (SOURCE_NEEDED: Bundestag or German historical institute) |
| Pressure needed | 1. "Fell" is imprecise — physical demolition continued for months; precise language matters |
| Home test | None applicable |
| Risk | Very low |

---

**B-3. The first powered aircraft flight was made by the Wright Brothers in 1903**

| Field | Value |
|-------|-------|
| Claim | The first powered aircraft flight was made by the Wright Brothers in 1903 |
| Category | History |
| Type | Historical |
| Status target | Strongly Supported |
| Launch reason | Demonstrates that "settled history" still has evidence layers and competing claims; good complexity example |
| Evidence needed | 1. Smithsonian documentation of the Kitty Hawk flight (SOURCE_NEEDED: Smithsonian National Air and Space Museum archive) 2. Patents and contemporary records (SOURCE_NEEDED: US Patent Office records) |
| Pressure needed | 1. Competing claimants (Gustave Whitehead, Alberto Santos-Dumont); what the evidence standard for "first" requires 2. Definitional question: what counts as "powered" and "controlled" flight |
| Home test | None applicable |
| Risk | Low — a small fringe claims Whitehead priority; worth including as an example of how competing historical claims are evaluated |

---

**B-4. Smoking causes lung cancer**

| Field | Value |
|-------|-------|
| Claim | Smoking causes lung cancer |
| Category | Medicine / Public Health |
| Type | Physical/Testable |
| Status target | Proven |
| Launch reason | Landmark public health finding; historically significant evidence battle; excellent model of causal claim grading |
| Evidence needed | 1. Doll and Hill 1950 study (SOURCE_NEEDED: BMJ archive) 2. US Surgeon General 1964 report (SOURCE_NEEDED: US DHHS / CDC historical archive) 3. Longitudinal population cohort data (SOURCE_NEEDED: Cancer Research UK / NCI data) |
| Pressure needed | 1. Not all smokers develop lung cancer — clarify population-level causation vs. individual certainty |
| Home test | None applicable |
| Risk | Very low |

---

**B-5. The Holocaust resulted in the murder of approximately six million Jews**

| Field | Value |
|-------|-------|
| Claim | The Holocaust resulted in the murder of approximately six million Jews |
| Category | History |
| Type | Historical |
| Status target | Proven |
| Launch reason | Demonstrates the platform can handle high-stakes historical facts without hedging; evidence base is overwhelming |
| Evidence needed | 1. Nuremberg trial documentation (SOURCE_NEEDED: Yale Avalon Project / Nuremberg archive) 2. Yad Vashem research (SOURCE_NEEDED: Yad Vashem database / published methodology) |
| Pressure needed | 1. Revisionist denial claims — what the historical evidence standard requires to overturn established findings |
| Home test | None applicable |
| Risk | Medium — denial is politically motivated; the platform should present evidence clearly without appearing to debate the verdict; the pressure section should show why denial arguments fail evidentially, not give them equal weight |

---

### Category C — Civic / Media Literacy

---

**C-1. Social media algorithms are designed to maximise engagement, not accuracy**

| Field | Value |
|-------|-------|
| Claim | Social media algorithms are designed to maximise engagement, not accuracy |
| Category | Technology / Media |
| Type | Sociological |
| Status target | Strongly Supported |
| Launch reason | Core media literacy claim; direct relevance to HumanX's purpose; strong documentary evidence from platform disclosures and research |
| Evidence needed | 1. Facebook internal research (SOURCE_NEEDED: WSJ Facebook Files / congressional testimony reference) 2. Academic engagement-optimisation research (SOURCE_NEEDED: peer-reviewed social media algorithm study) |
| Pressure needed | 1. Platforms argue their algorithms surface content users want, not just outrage — what does the evidence show about the distinction? |
| Home test | Record which posts appear first in a feed after engaging with a topic; note pattern over time |
| Risk | Low — well-documented; avoid wording that implies intent to deceive (design decisions are factual, attribution of motive is harder) |

---

**C-2. Eyewitness testimony is unreliable as sole evidence in criminal convictions**

| Field | Value |
|-------|-------|
| Claim | Eyewitness testimony is unreliable as sole evidence in criminal convictions |
| Category | Psychology / Law |
| Type | Sociological |
| Status target | Strongly Supported |
| Launch reason | Counter-intuitive result with strong experimental backing; demonstrates value of evidence grading for legal/civic claims |
| Evidence needed | 1. Innocence Project exoneration data (SOURCE_NEEDED: Innocence Project annual report) 2. Elizabeth Loftus memory research (SOURCE_NEEDED: peer-reviewed psychology paper) |
| Pressure needed | 1. Eyewitness testimony is still used in courts worldwide — what safeguards exist and when does it remain valid? |
| Home test | Run the classic "change blindness" video observation test; record what you notice vs. what changed |
| Risk | Very low |

---

**C-3. Photographs can be manipulated without visible detection**

| Field | Value |
|-------|-------|
| Claim | Photographs can be manipulated without visible detection |
| Category | Technology / Media |
| Type | Physical/Testable |
| Status target | Proven |
| Launch reason | Foundational media literacy claim; directly relevant to how people evaluate evidence on HumanX |
| Evidence needed | 1. Documented media manipulation cases (SOURCE_NEEDED: Reuters photo standards / AFP fact-check archive) 2. AI-generated image detection research (SOURCE_NEEDED: peer-reviewed computer vision paper or news coverage of detection failures) |
| Pressure needed | 1. Metadata and forensic tools can detect some manipulations — note the limitation: detection is not guaranteed |
| Home test | Use a free metadata viewer on several photos; check for inconsistencies in EXIF data; note what can and cannot be detected this way |
| Risk | Very low |

---

**C-4. Confirmation bias causes people to favour information that confirms existing beliefs**

| Field | Value |
|-------|-------|
| Claim | Confirmation bias causes people to favour information that confirms existing beliefs |
| Category | Psychology |
| Type | Sociological |
| Status target | Strongly Supported |
| Launch reason | Core cognitive literacy claim; explains why HumanX's evidence-grading model exists; well-replicated |
| Evidence needed | 1. Wason selection task studies (SOURCE_NEEDED: peer-reviewed cognitive psychology paper) 2. Nickerson 1998 review paper on confirmation bias (SOURCE_NEEDED: Psychological Bulletin) |
| Pressure needed | 1. Confirmation bias is not universal — motivated reasoning varies by topic, stakes, and identity salience; note conditions under which it is strongest |
| Home test | Try the Wason selection task on a card-flip problem; record whether you search for confirmations or disconfirmations |
| Risk | Very low |

---

**C-5. Retracted scientific papers continue to be cited after retraction**

| Field | Value |
|-------|-------|
| Claim | Retracted scientific papers continue to be cited after retraction |
| Category | Science / Media |
| Type | Sociological |
| Status target | Strongly Supported |
| Launch reason | Directly explains how misinformation persists; supports the platform's core premise; well-documented by retraction tracking databases |
| Evidence needed | 1. Retraction Watch data (SOURCE_NEEDED: Retraction Watch database / published methodology) 2. Study on post-retraction citations (SOURCE_NEEDED: peer-reviewed scientometrics paper) |
| Pressure needed | 1. Many retractions are for procedural or duplication reasons, not fraud — the claim's strength varies by retraction type |
| Home test | Search a retracted paper (e.g., the Wakefield 1998 MMR paper) on Google Scholar; record how many recent papers cite it |
| Risk | Very low |

---

### Category D — Human Behaviour / Cognitive Bias

---

**D-1. The bystander effect reduces the likelihood of help in crowd emergencies**

| Field | Value |
|-------|-------|
| Claim | The bystander effect reduces the likelihood of help in crowd emergencies |
| Category | Psychology |
| Type | Sociological |
| Status target | Plausible |
| Launch reason | Classic and well-known result; recent replication debates make it a good example of how scientific claims can be revised |
| Evidence needed | 1. Darley and Latané 1968 original study (SOURCE_NEEDED: peer-reviewed psychology journal) 2. Recent meta-analysis on replication attempts (SOURCE_NEEDED: Psychological Bulletin / peer-reviewed replication study) |
| Pressure needed | 1. Recent large-scale studies of real-world emergencies suggest bystanders intervene more often than lab studies predicted — what does the current evidence say? |
| Home test | None practical — note the design requirements for an ethical field study |
| Risk | Low — the status should be `Plausible` not `Proven` given replication debates; honest grading demonstrates platform value |

---

**D-2. Sleep deprivation impairs cognitive performance comparably to alcohol intoxication**

| Field | Value |
|-------|-------|
| Claim | Sleep deprivation impairs cognitive performance comparably to alcohol intoxication |
| Category | Medicine / Psychology |
| Type | Physical/Testable |
| Status target | Strongly Supported |
| Launch reason | High everyday relevance; strong experimental backing; counter-intuitive for many people |
| Evidence needed | 1. Van Dongen et al. 2003 study (SOURCE_NEEDED: peer-reviewed sleep research paper) 2. WHO or CDC sleep deprivation guidance (SOURCE_NEEDED: public health agency reference) |
| Pressure needed | 1. "Comparable" is imprecise — which specific cognitive functions, at what levels of deprivation and intoxication? |
| Home test | Perform a simple reaction-time test after good sleep vs. after restriction — note limitations: individual variation is high |
| Risk | Very low |

---

**D-3. The Dunning-Kruger effect describes a pattern where people with limited knowledge overestimate their competence**

| Field | Value |
|-------|-------|
| Claim | The Dunning-Kruger effect describes a pattern where people with limited knowledge overestimate their competence |
| Category | Psychology |
| Type | Sociological |
| Status target | Plausible |
| Launch reason | Widely cited result; the popular version is often overstated vs. the original findings; demonstrates how scientific communication distorts empirical results |
| Evidence needed | 1. Dunning and Kruger 1999 original paper (SOURCE_NEEDED: Journal of Personality and Social Psychology) 2. Critiques and replication studies (SOURCE_NEEDED: peer-reviewed psychology paper) |
| Pressure needed | 1. Some researchers argue the effect is partially a statistical artefact; 2. Experts also overestimate in areas outside their expertise |
| Home test | Estimate your score before a short topic quiz; compare to actual result; note direction and size of error |
| Risk | Low — popular framing often overstates the finding; honest `Plausible` grading is more credible than `Proven` |

---

**D-4. People are generally poor at detecting lies in conversation**

| Field | Value |
|-------|-------|
| Claim | People are generally poor at detecting lies in conversation |
| Category | Psychology |
| Type | Sociological |
| Status target | Strongly Supported |
| Launch reason | Counter-intuitive; well-replicated; relevant to how people evaluate claims and sources |
| Evidence needed | 1. Bond and DePaulo 2006 meta-analysis (SOURCE_NEEDED: peer-reviewed psychology meta-analysis) 2. Research on professional lie-detector performance (SOURCE_NEEDED: peer-reviewed paper or government agency review) |
| Pressure needed | 1. Some individuals (e.g., trained investigators) perform above chance — but rarely by large margins |
| Home test | None practical — note what cues people rely on and why they are unreliable |
| Risk | Very low |

---

**D-5. Anchoring bias causes first-presented numbers to disproportionately influence estimates**

| Field | Value |
|-------|-------|
| Claim | Anchoring bias causes first-presented numbers to disproportionately influence estimates |
| Category | Psychology |
| Type | Sociological |
| Status target | Strongly Supported |
| Launch reason | Classic, replicable, everyday-relevant result; directly applicable to how people evaluate evidence quality scores on HumanX |
| Evidence needed | 1. Tversky and Kahneman 1974 original anchoring study (SOURCE_NEEDED: Science journal) 2. Real-world anchoring evidence (SOURCE_NEEDED: behavioural economics paper / legal sentencing study) |
| Pressure needed | 1. Effect size varies by domain and expertise level |
| Home test | Estimate population of a city, first after being told a random high number, then after a random low number; compare; run with a friend |
| Risk | Very low |

---

### Category E — Untestable / Belief (clearly labelled)

---

**E-1. There is a God**

| Field | Value |
|-------|-------|
| Claim | There is a God |
| Category | Belief / Philosophy |
| Type | Religious/Belief |
| Status target | Untestable |
| Launch reason | Demonstrates that HumanX grades personal and metaphysical claims honestly without dismissal; explains the `Untestable` category |
| Evidence needed | 1. Personal testimony and religious experience (SOURCE_NEEDED: theological / philosophical primary source) |
| Pressure needed | 1. Define what evidence would constitute confirmation or disconfirmation — most definitions of God are not amenable to physical test |
| Home test | n/a — note what a testable version of this claim would look like |
| Risk | Medium — must be framed as `Untestable` clearly, not as `Disproven`; the platform must not read as atheist by default; note that `Untestable` is not dismissal |

---

**E-2. Consciousness continues after death**

| Field | Value |
|-------|-------|
| Claim | Consciousness continues after death |
| Category | Belief / Philosophy |
| Type | Religious/Belief |
| Status target | Untestable |
| Launch reason | High personal relevance; demonstrates empathetic framing of sincere belief claims; strong near-death experience evidence base to grade |
| Evidence needed | 1. Near-death experience reports (SOURCE_NEEDED: medical case study collection / AWARE study reference) |
| Pressure needed | 1. NDE reports occur under conditions of anoxia and drug effects that can produce hallucination; 2. Definition problem: what counts as evidence of continued consciousness? |
| Home test | n/a |
| Risk | Low — framed correctly as `Untestable` with empathetic evidence body; not a referendum on religious belief |

---

**E-3. Meditation reduces measurable stress markers**

| Field | Value |
|-------|-------|
| Claim | Meditation reduces measurable stress markers |
| Category | Psychology / Health |
| Type | Physical/Testable |
| Status target | Strongly Supported |
| Launch reason | Bridges belief/practice and physical measurement; strong RCT evidence; accessible to a broad audience |
| Evidence needed | 1. Mindfulness-Based Stress Reduction trial data (SOURCE_NEEDED: JAMA / peer-reviewed RCT) 2. Cortisol measurement studies (SOURCE_NEEDED: peer-reviewed physiology paper) |
| Pressure needed | 1. Effect sizes vary by practice type, duration, and measurement protocol; publication bias may inflate results |
| Home test | Try a 10-minute breathing protocol; note subjective stress level before and after; note limitations of self-report |
| Risk | Very low |

---

**E-4. Some people have a sixth sense for danger**

| Field | Value |
|-------|-------|
| Claim | Some people have a sixth sense for danger |
| Category | Belief |
| Type | Religious/Belief |
| Status target | Untestable |
| Launch reason | Common intuitive belief; good example of how to respect experience while grading evidence rigorously |
| Evidence needed | 1. Personal testimony — intuition reports (SOURCE_NEEDED: self-report / psychology of intuition literature) |
| Pressure needed | 1. Survivors may attribute narrow escapes to premonition; non-events go unrecorded (survivorship bias) 2. Intuition is often pattern recognition operating below conscious awareness — testable without paranormal explanation |
| Home test | n/a — note what a controlled test of danger-prediction accuracy would require |
| Risk | Low — frame empathetically; distinguish intuition (plausibly real mechanism) from paranormal prediction |

---

**E-5. Astrology can predict personality traits**

| Field | Value |
|-------|-------|
| Claim | Astrology can predict personality traits |
| Category | Belief |
| Type | Physical/Testable |
| Status target | Weak Evidence |
| Launch reason | High cultural visibility; strong testable null-hypothesis; demonstrates that a belief-adjacent claim can be evaluated empirically |
| Evidence needed | 1. Shawn Carlson double-blind study 1985 (SOURCE_NEEDED: Nature journal) 2. Population studies of birth-date personality correlation (SOURCE_NEEDED: peer-reviewed psychology paper) |
| Pressure needed | 1. Barnum effect — vague statements feel personally accurate to most people regardless of sign 2. Time-of-year birth effects are real but mediated by school-entry cutoffs, not celestial position |
| Home test | Read sun-sign descriptions for several signs without knowing which is yours; rate accuracy; reveal which is "yours" |
| Risk | Low — `Weak Evidence` is the honest verdict; frame as a good example of the platform's testability grading |

---

## 4. Proposed Truth Seed Set

Twenty-five draft truth statements across five sub-categories. All are repeated sayings,
inherited certainties, cultural assertions, or doctrines — not verified facts.

All enter the platform as `confidence_label: 'claimed'`. None are HumanX's position.

---

### Media literacy

| Statement | Framing note | Risk | Classification |
|-----------|-------------|------|---------------|
| If it's on the internet it must be true | Common digital-era cynicism / warning | Low | `launch-candidate` |
| The news media always tells the truth | Institutional trust claim | Low | `launch-candidate` |
| The news media always lies | Counter-institutional claim | Low | `launch-candidate` — pair with previous |
| You can't trust statistics | Common anti-evidence dismissal | Low | `launch-candidate` |
| A picture is worth a thousand words | Implies visual evidence is decisive | Low | `launch-candidate` |

### Memory and perception

| Statement | Framing note | Risk | Classification |
|-----------|-------------|------|---------------|
| I have a great memory | Self-assessed cognition claim | Low | `launch-candidate` |
| I would know if I was being lied to | Common overconfidence in deception detection | Low | `launch-candidate` |
| Seeing is believing | Appeals to direct perception as final authority | Low | `launch-candidate` |
| I remember it clearly | Subjective certainty claim; memory distortion topic | Low | `launch-candidate` |
| My gut feeling is always right | Appeals to intuition over evidence | Low | `launch-candidate` |

### Social pressure

| Statement | Framing note | Risk | Classification |
|-----------|-------------|------|---------------|
| Everyone knows that | Appeal to consensus without evidence | Low | `launch-candidate` |
| That's just common sense | Dismissal of need for evidence | Low | `launch-candidate` |
| The majority can't be wrong | Majority-appeal claim | Low | `launch-candidate` |
| Follow the money | Motives explain everything claim | Low | `launch-candidate` |
| If you have nothing to hide, you have nothing to fear | Privacy/surveillance claim | Low-medium | `needs-careful-framing` — can be read as HumanX endorsing surveillance; origin label essential |

### Civic claims

| Statement | Framing note | Risk | Classification |
|-----------|-------------|------|---------------|
| Democracy is the best system of government | Political claim presented as self-evident | Low-medium | `needs-careful-framing` — comparative claim; needs visible origin (Western political tradition) |
| Freedom of speech means freedom from consequences | Common misapplication of free speech | Low | `launch-candidate` |
| The government is always corrupt | Blanket institutional distrust claim | Low | `launch-candidate` |
| Voting doesn't make a difference | Civic disengagement claim | Low | `launch-candidate` |
| Laws are fair to everyone | Equal justice claim | Low | `launch-candidate` |

### Belief / identity

| Statement | Framing note | Risk | Classification |
|-----------|-------------|------|---------------|
| Things were better in the past | Nostalgia as fact | Low | `launch-candidate` |
| Human nature never changes | Essentialist claim | Low | `launch-candidate` |
| You can't change who you are | Identity-determinism claim | Low | `launch-candidate` |
| Success is purely the result of hard work | Meritocracy claim | Low | `launch-candidate` |
| Fate is already decided | Determinism / destiny claim | Low | `launch-candidate` |

**Truth summary:**

| Classification | Count |
|---------------|-------|
| `launch-candidate` | 22 |
| `needs-careful-framing` | 3 (privacy/surveillance, democracy, ...) |

---

## 5. Evidence Requirements

### Per-claim minimum for launch import

| Requirement | Minimum | Preferred |
|-------------|---------|-----------|
| Evidence items | 1 | 2–3 |
| `source_url` per item | 1 real URL | 1 per item |
| Source type | `documented` or above | `repeatable` or `documented` |
| Pressure points | 1 | 2 |
| Home test | 1 (Physical/Testable only) | 1 |

### Quality label guidance

| Label | When to use |
|-------|-------------|
| `repeatable` | Peer-reviewed experiment; independently replicable protocol |
| `documented` | Official government/agency report; published scientific paper; court record; news archive with byline |
| `media` | News article, documentary, journalism — verifiable but not primary research |
| `testimony` | Personal account, interview, anecdote — named and attributable |
| `vibes` | Opinion, common saying, social media claim — use only to demonstrate the low end of the scale |

### Source URL requirements before production import

All `SOURCE_NEEDED: <type>` placeholders in this document must be replaced with a real,
publicly accessible URL before any import occurs. The D-56 source-gathering checklist will
track this. No placeholder-URL evidence should be imported.

### Reliability score guidance

| Quality label | Approximate reliability score |
|--------------|-------------------------------|
| `repeatable` | 80–90 |
| `documented` | 60–75 |
| `media` | 30–45 |
| `testimony` | 20–30 |
| `vibes` | 5–15 |

---

## 6. What to Do With Existing Demo Seeds

| Seed | Current status | Recommended action |
|------|---------------|-------------------|
| Moon landing | 3 evidence items, no source URLs; `Strongly Supported` | **Upgrade to launch-candidate:** add 3 real `source_url` entries; keep existing body text; can be included in launch set after D-56 |
| Dream prediction | 1 evidence item, no source URL; `Untestable` | **Upgrade with care:** add 1 real source (memory distortion research); optionally add 1 more evidence item; good `Untestable` example |
| Flat earth | 2 evidence items (media, vibes); `Disproven` | **Demo-only:** retain in DB as browseable; not in the launch-featured set; add sources only if retained prominently |
| Perpetual motion | 1 evidence item (media); `Reality Collapse` | **Demo-only:** retain in DB; not in the launch-featured set; `Reality Collapse` verdict needs platform context to be understood |

**Existing truth seeds (from D-54):**
- 9 of 12 are `launch-candidate` — retain as-is
- 3 need visible `origin` / `category` display in UI before import:
  - "Children should always obey adults"
  - "My religion is the only true path"
  - "People are stupid"

---

## 7. Future Implementation Path

| Batch | Type | Scope |
|-------|------|-------|
| **D-56** | Docs-only | Source-gathering checklist — for each proposed launch claim, list exact source URL candidates to research and verify; mark which `SOURCE_NEEDED` placeholders are filled; produce a checkable list |
| **D-57** | Docs-only | Launch seed JSON draft — write the actual JSON structures for `data/seed_claims_v2.json` and any updated truth seed, using D-55 claim text and D-56 confirmed URLs; no import yet |
| **D-58** | Worker change (branch + PR) | Import route safety plan — modify `importSeedData` and `importTruthSeeds` to insert as `review_state='review'` instead of `'public'`; require admin approval step before seeds go public; this is a code change |
| **D-59** | Gated | Production import / cleanup plan — after D-56 sources confirmed, D-57 JSON finalised, D-58 safety change merged: produce a step-by-step production import plan; execution requires explicit per-session D1 approval |

---

## 8. Safety

| Rule | Status |
|------|--------|
| No D1 writes in D-55 | ✅ Confirmed |
| No seed file edits | ✅ Confirmed |
| No data imported | ✅ Confirmed |
| No data archived or deleted | ✅ Confirmed |
| No source URLs verified or clicked | ✅ All `SOURCE_NEEDED` placeholders |
| No Worker changes | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No production mutations | ✅ Confirmed |

---

## D-55 Completion Record

| Item | Status |
|------|--------|
| Launch pack principles defined | ✅ |
| 25 draft claims across 5 categories | ✅ |
| 25 draft truth statements across 5 sub-categories | ✅ |
| Evidence requirements and quality label guidance | ✅ |
| Existing demo seed disposition recommendations | ✅ |
| Future implementation path D-56 → D-59 defined | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No seed data imported / edited / deleted | ✅ Confirmed |
