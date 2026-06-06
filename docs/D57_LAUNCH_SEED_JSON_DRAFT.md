# D-57: Launch Seed JSON Draft

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes. No D1 commands. No data mutations.
No seed files edited. No data imported, archived, or deleted.
No real URLs included — all source_url entries are SOURCE_NEEDED placeholders.
This document is a structural draft only. It is not executable.

---

## 1. Summary

D-55 proposed 25 launch claims and 25 truth seed candidates.
D-56 defined source-gathering rules, a per-claim checklist, and a 7-step source review
workflow. No real sources have been gathered yet.

D-57 specifies:

- The file shape for a future `data/seed_claims_v2.json`
- The claim object schema, matched exactly to `HUMANX_SEED` in `src/seed-data.js`
- The truth object schema, matched exactly to `SEED_TRUTHS` in `src/truth-seed.js`
- 12 representative draft claim objects drawn from D-55
- 12 representative draft truth objects drawn from D-55
- Import safety notes for D-58
- The future path to D-58 → D-59 → D-60

**This document is a spec and draft, not a runnable import file.**

Nothing in this document should be executed, imported, or fed into the Worker or D1
until:
1. Every `SOURCE_NEEDED` placeholder is replaced with a real, verified, publicly
   accessible URL (human research per D-56 workflow).
2. The D-58 import route safety change (branch + PR) is merged, so seeds enter as
   `review_state='review'` rather than `'public'`.
3. Explicit per-session D1 approval is given for production import (D-60).

---

## 2. Proposed File Shape

The file `data/seed_claims_v2.json` does not yet exist. When created after sources are
confirmed, it will follow this top-level structure:

```json
{
  "version": "launch-seed-v1-draft",
  "status": "draft_requires_sources",
  "generated": "YYYY-MM-DD",
  "import_route": "GET /api/import-seed (admin only — requires D-58 safety change first)",
  "claims": [],
  "truths": [],
  "notes": [
    "All source_url fields must be real, verified, publicly accessible URLs before import.",
    "Import route must insert as review_state='review' (D-58) before this file is used.",
    "Do not import until explicit per-session D1 approval is given (D-60).",
    "Claim IDs use prefix 'launch-' to distinguish from legacy 'seed-' prefix."
  ]
}
```

A companion truth object list would update or supplement the existing `SEED_TRUTHS` array
in `src/truth-seed.js`, or be provided as a separate `data/seed_truths_v2.json` for human
review before the JS file is touched.

---

## 3. Claim Object Schema

The claim object shape must match the structure consumed by `importSeedData()` in
`src/importer.js`, which reads from `HUMANX_SEED.claims`. The currently active shape
from `src/seed-data.js` is:

```
seed_id            string   — unique identifier; prefix "launch-" for new seeds
claim              string   — the claim text, precise and specific
category           string   — platform taxonomy category
type               string   — Physical/Testable | Historical | Sociological | Religious/Belief | Mathematical
status             string   — Disproven | Weak Evidence | Plausible | Strongly Supported | Proven | Untestable | Reality Collapse
evidence_score     integer  — computed by scoring engine; set to 0 in draft
testability        integer  — 0–100; set to 0 in draft
survivability      integer  — 0–100; set to 0 in draft
evidence[]         array    — see evidence object schema (Section 4)
pressure[]         array    — array of pressure point objects
tests[]            array    — array of home test objects
```

**Extended draft fields** (not in current importer schema — for documentation only in D-57;
to be stripped before actual import or added to importer in a future D):

```
review_state_intended  string   — "review" (must not bypass to 'public' before D-58 merges)
launch_priority        string   — high | medium | low
risk_level             string   — very-low | low | medium | high
source_status          string   — "all_SOURCE_NEEDED" | "partial" | "complete"
notes                  string   — human-readable note for this draft entry
```

**Pressure point object shape** (from `src/seed-data.js`):
```
title    string
body     string
severity integer  (1–5)
```

**Home test object shape** (from `src/seed-data.js`):
```
title          string
instructions   string
difficulty     string   (easy | medium | hard)
safety_level   string   (normal | caution)
```

---

## 4. Evidence Object Schema

The evidence object shape must match the `evidence[]` array items in `src/seed-data.js`.
The currently active field set is:

```
stance             string   — "support" | "pressure"
quality            string   — repeatable | documented | media | testimony | vibes
title              string   — short descriptive title
body               string   — 2–4 sentence plain-English summary of what the source shows
source_url         string   — REAL verified URL required before import; use placeholder in draft
media_type         string   — article | study | report | dataset | video | document |
                              experiment | physical_sample | observation | argument |
                              personal_report | book | archive
reliability_score  integer  — 5–90; consistent with quality label (see D-55 Section 5)
```

**Extended draft fields** (for documentation only in D-57; not in current importer schema):

```
source_url_status  string   — "SOURCE_NEEDED" | "verified" | "partial"
source_domain      string   — domain only, e.g. cdc.gov, bmj.com (for tracking; not imported)
launch_blocker     boolean  — true if this evidence item blocks launch readiness
notes              string   — research notes for this evidence item
```

**Rule:** Any evidence item with `source_url_status: "SOURCE_NEEDED"` and
`launch_blocker: true` must have its `source_url` filled before the parent claim
can be imported. Items with `launch_blocker: false` may be imported with a stub
body if the primary evidence item is satisfied.

---

## 5. Draft Claim Objects

Twelve representative draft claim objects from D-55. All `source_url` values are
`SOURCE_NEEDED` placeholders. All `launch_blocker: true` items block import until a real
URL is confirmed. `evidence_score`, `testability`, and `survivability` are set to 0
(computed by the scoring engine at import time).

Extended draft fields (marked with `[draft]`) are for documentation only and will be
stripped before actual JSON import or handled by an updated importer.

---

### Claim A-1 — Vaccines cause autism

```json
{
  "seed_id": "launch-a1-vaccines-autism",
  "claim": "Vaccines cause autism",
  "category": "Medicine",
  "type": "Physical/Testable",
  "status": "Disproven",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Large-scale vaccine-autism meta-analysis",
      "body": "Multiple independent meta-analyses covering millions of children across several countries have found no statistically significant association between childhood vaccination and autism spectrum disorder. The combined weight of this evidence constitutes a strong scientific consensus.",
      "source_url": "SOURCE_NEEDED: peer-reviewed meta-analysis (Cochrane, Lancet, or equivalent)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 88,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Retraction of the Wakefield 1998 MMR paper",
      "body": "The 1998 Lancet paper by Andrew Wakefield, which first proposed an MMR-autism link, was fully retracted in 2010 after investigation found ethical violations, data manipulation, and undisclosed conflicts of interest. Wakefield's medical licence was subsequently revoked.",
      "source_url": "SOURCE_NEEDED: Lancet retraction notice / BMJ investigation article",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "document",
      "reliability_score": 82,
      "launch_blocker": true
    }
  ],
  "pressure": [
    {
      "title": "Autism diagnosis timing coincides with vaccine schedule",
      "body": "Early signs of autism spectrum disorder often become noticeable around 18–24 months, which overlaps with the MMR vaccination schedule. This temporal correlation is a genuine observation, but temporal correlation does not establish causation — the studies above tested this specifically.",
      "severity": 3
    },
    {
      "title": "What the Wakefield study actually claimed vs. showed",
      "body": "The original study described 12 children and proposed a hypothesis about intestinal inflammation. It did not contain population-level data, did not establish causation, and its dataset was later found to be manipulated. Claims that it 'proved' a link go beyond what the paper stated even before retraction.",
      "severity": 4
    }
  ],
  "tests": [],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] High-priority launch claim. Both evidence items are launch-blockers. Do not import until both source_url fields are verified."
}
```

---

### Claim A-4 — Human-caused CO₂ is the primary driver of recent warming

```json
{
  "seed_id": "launch-a4-co2-warming",
  "claim": "Human-caused carbon dioxide emissions are the primary driver of recent global warming",
  "category": "Climate",
  "type": "Physical/Testable",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "IPCC Sixth Assessment Report — Summary for Policymakers",
      "body": "The Intergovernmental Panel on Climate Change AR6 report, representing the work of thousands of climate scientists across dozens of countries, concludes with high confidence that human influence has warmed the atmosphere, ocean and land. Observed changes are unprecedented over many centuries.",
      "source_url": "SOURCE_NEEDED: IPCC AR6 Summary for Policymakers (ipcc.ch)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 85,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Attribution science distinguishing human vs. natural forcing",
      "body": "Climate attribution studies use physical models to separate the contributions of natural variability (volcanic eruptions, solar cycles) from human-caused greenhouse gas forcing. Multiple independent research groups using different models reach consistent conclusions attributing the majority of observed warming since the mid-20th century to human activity.",
      "source_url": "SOURCE_NEEDED: peer-reviewed climate attribution study (Nature, Science, or equivalent)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 82,
      "launch_blocker": true
    }
  ],
  "pressure": [
    {
      "title": "Natural climate variation has always existed",
      "body": "Earth's climate has changed throughout history due to orbital cycles, volcanic activity and solar variation. The attribution question is not whether natural variation exists, but whether it can explain the rate and pattern of current warming. Attribution studies find it cannot without human CO₂ emissions.",
      "severity": 3
    },
    {
      "title": "Climate feedback and uncertainty ranges",
      "body": "Climate sensitivity — how much warming results from a doubling of CO₂ — has an uncertainty range. This uncertainty is about the magnitude of future warming, not about whether human forcing is the primary cause. The IPCC reports this range explicitly.",
      "severity": 3
    }
  ],
  "tests": [
    {
      "title": "Track local temperature anomalies against historical baseline",
      "instructions": "Access a public climate data portal (e.g. a national meteorological service) and compare recent decade average temperatures in your region against the 1850–1900 baseline. Note the limitations: local data does not prove global attribution, but it illustrates the anomaly signal.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] medium",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Politically sensitive. Both evidence items are launch-blockers. Framing must let the evidence and scoring engine deliver the verdict — do not editorialize in the body text."
}
```

---

### Claim A-5 — Antibiotics are ineffective against viral infections

```json
{
  "seed_id": "launch-a5-antibiotics-viral",
  "claim": "Antibiotics are ineffective against viral infections",
  "category": "Medicine",
  "type": "Physical/Testable",
  "status": "Proven",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Mechanism: antibiotics target bacterial processes absent in viruses",
      "body": "Antibiotics work by interfering with bacterial cell walls, protein synthesis, or DNA replication — structures and processes that viruses do not have. A virus is not a cell; it has no cell wall, no ribosomes, and no independent metabolic machinery. This is not a contested point in microbiology.",
      "source_url": "SOURCE_NEEDED: CDC / NHS / WHO antibiotic explainer page",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 90,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "WHO antimicrobial resistance report",
      "body": "Inappropriate antibiotic use — including for viral infections — is a primary driver of antimicrobial resistance. The WHO identifies AMR as a major global health threat. This makes the public health stakes of the distinction explicit.",
      "source_url": "SOURCE_NEEDED: WHO Global Antimicrobial Resistance and Use Surveillance System (GLASS) report",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 82,
      "launch_blocker": false
    }
  ],
  "pressure": [
    {
      "title": "Secondary bacterial infections can follow viral illness",
      "body": "A viral infection can weaken immune defences and allow a secondary bacterial infection to develop — for example, bacterial pneumonia following influenza. In those cases, antibiotics treat the bacterial secondary infection, not the original virus. This distinction matters clinically.",
      "severity": 3
    }
  ],
  "tests": [],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] High-value public health literacy claim. Primary mechanism evidence item is launch-blocker; AMR report is not (mechanism alone is sufficient)."
}
```

---

### Claim B-4 — Smoking causes lung cancer

```json
{
  "seed_id": "launch-b4-smoking-lung-cancer",
  "claim": "Smoking causes lung cancer",
  "category": "Medicine / Public Health",
  "type": "Physical/Testable",
  "status": "Proven",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Doll and Hill 1950 prospective cohort study",
      "body": "Richard Doll and Austin Bradford Hill published the first major prospective study demonstrating a strong statistical association between smoking and lung cancer in 1950. Their subsequent British Doctors Study, begun in 1951, tracked 40,000 physicians over decades and confirmed a dose-response relationship — the more one smoked, the higher the risk — one of the strongest criteria for inferring causation.",
      "source_url": "SOURCE_NEEDED: BMJ archive — Doll & Hill 1950 / 1954 study",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 88,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "US Surgeon General 1964 Report on Smoking and Health",
      "body": "The 1964 US Surgeon General's Report was the first official US government conclusion that smoking causes lung cancer and other diseases. It reviewed over 7,000 articles and marked a turning point in public health policy. The finding has been repeatedly confirmed and strengthened in subsequent reports.",
      "source_url": "SOURCE_NEEDED: CDC / DHHS historical archive — Surgeon General 1964 report",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 80,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Population cohort data: relative risk in smokers",
      "body": "Decades of population data show that smokers have approximately 15–30 times the risk of developing lung cancer compared to lifetime non-smokers. The association holds across multiple countries, study designs, and adjustment for confounders.",
      "source_url": "SOURCE_NEEDED: Cancer Research UK / NCI lung cancer statistics page",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "dataset",
      "reliability_score": 78,
      "launch_blocker": false
    }
  ],
  "pressure": [
    {
      "title": "Not all smokers develop lung cancer",
      "body": "Lung cancer develops in roughly 10–15% of heavy lifetime smokers. This does not weaken the causal claim — population-level causation means that smoking substantially increases the probability of lung cancer across a population, not that every smoker will develop it. The dose-response relationship and biological mechanism are both well established.",
      "severity": 3
    }
  ],
  "tests": [],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Landmark causal claim with strong historical evidence arc. First two evidence items are launch-blockers. Third (population data) is not individually blocking but adds depth."
}
```

---

### Claim B-5 — Holocaust resulted in the murder of approximately six million Jews

```json
{
  "seed_id": "launch-b5-holocaust",
  "claim": "The Holocaust resulted in the murder of approximately six million Jews",
  "category": "History",
  "type": "Historical",
  "status": "Proven",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Nuremberg tribunal documentation",
      "body": "The International Military Tribunal at Nuremberg (1945–46) examined thousands of captured Nazi documents, testimony from survivors and perpetrators, and statistical records. The trial established in legal proceedings the systematic nature and approximate scale of the killings.",
      "source_url": "SOURCE_NEEDED: Yale Avalon Project Nuremberg trial documents / official IMT record",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "archive",
      "reliability_score": 85,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Yad Vashem historical research and victim database",
      "body": "Yad Vashem, the World Holocaust Remembrance Center, maintains a database of individual victim names assembled over decades from testimony, community records, and administrative documents. This bottom-up victim accounting provides an independent corroboration of the statistical scale.",
      "source_url": "SOURCE_NEEDED: Yad Vashem Central Database of Shoah Victims' Names — published methodology",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "dataset",
      "reliability_score": 85,
      "launch_blocker": true
    }
  ],
  "pressure": [
    {
      "title": "Revisionist denial: what evidence would be required to revise the figure?",
      "body": "Historical revisionism that questions the scale of the Holocaust must meet the same evidentiary standard as any other historical revision: counter-evidence of equal or greater weight to the tribunal records, victim databases, and perpetrator documentation. To date, no such evidence has been produced. The pressure section should make the evidentiary bar explicit, not present denial as a serious competing hypothesis.",
      "severity": 5
    }
  ],
  "tests": [],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] medium",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] High-stakes historical fact. Both evidence items are launch-blockers. The pressure section must not frame denial as a credible competing hypothesis — it should show what the evidentiary bar for revision actually requires."
}
```

---

### Claim C-1 — Social media algorithms maximise engagement, not accuracy

```json
{
  "seed_id": "launch-c1-algorithm-engagement",
  "claim": "Social media algorithms are designed to maximise engagement, not accuracy",
  "category": "Technology / Media",
  "type": "Sociological",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Platform internal research and congressional testimony",
      "body": "Leaked internal Facebook research (2021) found that the platform's own researchers had identified that its recommendation systems amplified divisive content and that the company had not acted on the findings. Congressional testimony from whistleblowers elaborated on these internal findings. This constitutes documentary evidence of a deliberate design trade-off.",
      "source_url": "SOURCE_NEEDED: WSJ Facebook Files series / Senate Commerce Committee testimony transcript",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "document",
      "reliability_score": 72,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Academic engagement-optimisation research",
      "body": "Multiple independent studies of social media recommendation systems have found that engagement-maximising signals (clicks, shares, time-on-site) are poor proxies for content accuracy and tend to favour emotionally arousing, outrage-generating content. The finding replicates across platforms and study designs.",
      "source_url": "SOURCE_NEEDED: peer-reviewed social media algorithm / engagement study (Nature, Science, ICWSM, or equivalent)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 78,
      "launch_blocker": true
    }
  ],
  "pressure": [
    {
      "title": "Platforms argue algorithms surface content users want",
      "body": "Social media companies argue that their recommendation systems show users content they have demonstrated they want, not content engineered to provoke. The distinction between 'what users click' and 'what maximises platform revenue' is the crux of the debate. The internal research item above is the most direct evidence on this question.",
      "severity": 3
    }
  ],
  "tests": [
    {
      "title": "Observe feed composition after engaging with a topic",
      "instructions": "After engaging with a post on a specific topic — liking, sharing, or commenting — record which posts appear first in your feed over the following 48 hours. Note whether the feed shifts toward more of the same topic and whether that content tends toward stronger emotional framing. Note limitations: this is observational, not a controlled experiment.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Core platform-relevance claim. Both evidence items are launch-blockers."
}
```

---

### Claim C-2 — Eyewitness testimony is unreliable as sole evidence

```json
{
  "seed_id": "launch-c2-eyewitness-unreliable",
  "claim": "Eyewitness testimony is unreliable as sole evidence in criminal convictions",
  "category": "Psychology / Law",
  "type": "Sociological",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "documented",
      "title": "Innocence Project exoneration data",
      "body": "The Innocence Project has used DNA evidence to exonerate over 375 wrongfully convicted people in the United States. Eyewitness misidentification appears in approximately 69% of these wrongful convictions — more than any other contributing factor. This is a direct real-world outcome measure.",
      "source_url": "SOURCE_NEEDED: Innocence Project — published exoneration statistics / annual report",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 80,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Loftus misinformation effect and eyewitness memory research",
      "body": "Psychologist Elizabeth Loftus and colleagues have demonstrated through controlled experiments that memory is reconstructive, not reproductive. Post-event information, suggestive questioning, and the passage of time reliably alter witness recollections in ways the witness is not aware of. The misinformation effect replicates across many study designs and populations.",
      "source_url": "SOURCE_NEEDED: peer-reviewed Loftus eyewitness memory paper (Journal of Applied Psychology or equivalent)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 82,
      "launch_blocker": true
    }
  ],
  "pressure": [
    {
      "title": "Eyewitness testimony is still used and can still be valid",
      "body": "Courts continue to use eyewitness evidence, and under good conditions — brief delay, good lighting, no leading questions, no cross-race effect — reliability improves. The claim is about unreliability as the sole basis for conviction, not a blanket dismissal of all eyewitness evidence. This distinction matters for the claim's accuracy.",
      "severity": 3
    }
  ],
  "tests": [
    {
      "title": "Change blindness observation test",
      "instructions": "Watch a change-blindness video (a person is replaced by a different person during a brief interruption; objects change colour mid-scene). Record what you noticed before the reveal. Note the gap between what you were confident you saw and what actually changed.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Counter-intuitive, well-evidenced. Both evidence items are launch-blockers."
}
```

---

### Claim C-4 — Confirmation bias causes people to favour confirming information

```json
{
  "seed_id": "launch-c4-confirmation-bias",
  "claim": "Confirmation bias causes people to favour information that confirms existing beliefs",
  "category": "Psychology",
  "type": "Sociological",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Wason selection task: people seek confirmation not falsification",
      "body": "Peter Wason's selection task (1960s) demonstrated that people systematically search for confirming examples of a rule rather than falsifying ones, even when finding a disconfirmation would be more logically informative. The task has been replicated extensively and shows the tendency is robust, though the effect varies by domain and familiarity.",
      "source_url": "SOURCE_NEEDED: peer-reviewed cognitive psychology paper citing Wason selection task (Wason 1968 or a meta-analysis)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 80,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Nickerson 1998 comprehensive review of confirmation bias research",
      "body": "Raymond Nickerson's 1998 review in Psychological Bulletin surveyed the confirmation bias literature across multiple domains — hypothesis testing, memory recall, social perception, and argumentation. The review found the tendency to be pervasive and robust, while noting that it is not always irrational and varies by context.",
      "source_url": "SOURCE_NEEDED: Nickerson 1998 — Psychological Bulletin — 'Confirmation Bias: A Ubiquitous Phenomenon in Many Guises'",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 78,
      "launch_blocker": true
    }
  ],
  "pressure": [
    {
      "title": "Confirmation bias is not universal or always irrational",
      "body": "Motivated reasoning varies by the personal stakes of the belief, identity involvement, and domain expertise. In some low-stakes situations people do update on disconfirming evidence. The Nickerson review notes the bias is real but contextually variable. Status 'Strongly Supported' reflects robust evidence of the tendency, not that it is an iron law applying equally in all conditions.",
      "severity": 3
    }
  ],
  "tests": [
    {
      "title": "Wason selection task self-test",
      "instructions": "Given a rule such as 'If a card shows a vowel on one side, it has an even number on the other side', choose which cards you would turn over to test the rule. Record your answer before reading an explanation. Note whether you chose to confirm or potentially falsify the rule.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] high",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Platform-explanation claim. Both evidence items are launch-blockers. Explains why HumanX exists."
}
```

---

### Claim D-2 — Sleep deprivation impairs cognition comparably to alcohol

```json
{
  "seed_id": "launch-d2-sleep-deprivation",
  "claim": "Sleep deprivation impairs cognitive performance comparably to alcohol intoxication",
  "category": "Medicine / Psychology",
  "type": "Physical/Testable",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Van Dongen et al. 2003 — cumulative sleep restriction study",
      "body": "Van Dongen and colleagues restricted participants to 6 or fewer hours of sleep per night for two weeks. Cognitive performance — measured by psychomotor vigilance tasks and subjective sleepiness — degraded to a level equivalent to 24 hours of total sleep deprivation. Crucially, participants underestimated their own impairment, which does not occur to the same degree with alcohol.",
      "source_url": "SOURCE_NEEDED: Van Dongen et al. 2003 — Sleep journal — 'The Cumulative Cost of Additional Wakefulness'",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 84,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Public health agency guidance on sleep and performance",
      "body": "The CDC and WHO document the relationship between sleep deprivation and impaired driving, workplace errors, and cognitive function in public health guidance. The comparison to alcohol intoxication appears in safety communications and official guidance documents.",
      "source_url": "SOURCE_NEEDED: CDC sleep and health page / WHO sleep deprivation guidance",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 72,
      "launch_blocker": false
    }
  ],
  "pressure": [
    {
      "title": "'Comparable' depends on which cognitive functions and at what doses",
      "body": "The comparison depends on which specific functions are measured, the duration of deprivation, and the level of alcohol intoxication used for comparison. Some tasks are more affected by sleep deprivation; others more by alcohol. The claim is well-supported at the level of general cognitive performance, but the comparison is not a perfect equivalence.",
      "severity": 3
    }
  ],
  "tests": [
    {
      "title": "Reaction time test after varied sleep",
      "instructions": "Use a freely available browser-based reaction time test. Record your score after a full night of sleep and after a night of restriction (if safe to do so). Note that individual variation is high and a single self-test is not a controlled experiment — it is an illustration only.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] medium",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Primary study is launch-blocker. Public health source is not blocking individually."
}
```

---

### Claim D-4 — People are generally poor at detecting lies

```json
{
  "seed_id": "launch-d4-lie-detection",
  "claim": "People are generally poor at detecting lies in conversation",
  "category": "Psychology",
  "type": "Sociological",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Bond and DePaulo 2006 meta-analysis",
      "body": "Bond and DePaulo's 2006 meta-analysis of 206 studies found that people correctly identify lies at a rate only slightly above chance — approximately 54% accuracy when chance is 50%. The finding holds across trained and untrained populations, and across cultures. Confidence in one's ability to detect deception does not correlate with actual accuracy.",
      "source_url": "SOURCE_NEEDED: Bond & DePaulo 2006 — Psychological Bulletin — 'Accuracy of Deception Judgments'",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 84,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Research on professional lie-detector accuracy",
      "body": "Studies of trained law enforcement, customs officers, and other professionals who work with deception show they perform only marginally better than chance, and sometimes no better. Some published work from government-commissioned reviews finds similar results.",
      "source_url": "SOURCE_NEEDED: peer-reviewed paper or US government review of professional deception detection accuracy",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "report",
      "reliability_score": 70,
      "launch_blocker": false
    }
  ],
  "pressure": [
    {
      "title": "Some individuals perform above chance, rarely by large margins",
      "body": "A small proportion of people in some studies score notably above chance. Researchers have studied whether these 'wizards' of lie detection exist and what distinguishes them — findings are preliminary and the population is small. This does not overturn the general conclusion.",
      "severity": 2
    }
  ],
  "tests": [],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] medium",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Meta-analysis is launch-blocker. Professional detection research is supplementary."
}
```

---

### Claim D-5 — Anchoring bias influences estimates

```json
{
  "seed_id": "launch-d5-anchoring-bias",
  "claim": "Anchoring bias causes first-presented numbers to disproportionately influence estimates",
  "category": "Psychology",
  "type": "Sociological",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Tversky and Kahneman 1974 anchoring and adjustment study",
      "body": "Tversky and Kahneman demonstrated that when participants were shown a random number (from a spinning wheel) before estimating an unknown quantity, their estimates were systematically pulled toward the random anchor — even when they knew the anchor was random. The effect has replicated across many settings including legal sentencing, salary negotiation, and consumer pricing.",
      "source_url": "SOURCE_NEEDED: Tversky & Kahneman 1974 — Science — 'Judgment Under Uncertainty: Heuristics and Biases'",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 86,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "documented",
      "title": "Real-world anchoring: legal sentencing and salary negotiation studies",
      "body": "Field studies have found anchoring effects in legal sentencing decisions (the sentencing request influences the sentence given, independent of case merits) and salary negotiations (the first number offered anchors the final agreement). These applied results demonstrate the effect outside the laboratory.",
      "source_url": "SOURCE_NEEDED: behavioural economics paper on real-world anchoring (Ariely, Strack & Mussweiler, or similar applied study)",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 74,
      "launch_blocker": false
    }
  ],
  "pressure": [
    {
      "title": "Effect size varies by domain and expertise level",
      "body": "Domain experts are sometimes less susceptible to anchoring than novices, and the effect size varies across judgment types. The phenomenon is reliable, but it is not a ceiling effect — people do adjust from anchors, just insufficiently.",
      "severity": 2
    }
  ],
  "tests": [
    {
      "title": "City population anchoring test",
      "instructions": "Ask a friend to estimate the population of a city neither of you knows well. Before they answer, tell one group a high random number ('Is it more or less than 50 million?') and another group a low random number ('Is it more or less than 500,000?'). Compare estimates. Note that this is an illustration, not a controlled experiment.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] medium",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] Classic replicable result. Primary study is launch-blocker."
}
```

---

### Claim E-3 — Meditation reduces measurable stress markers (Untestable category example)

```json
{
  "seed_id": "launch-e3-meditation-stress",
  "claim": "Meditation reduces measurable stress markers",
  "category": "Psychology / Health",
  "type": "Physical/Testable",
  "status": "Strongly Supported",
  "evidence_score": 0,
  "testability": 0,
  "survivability": 0,
  "evidence": [
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Mindfulness-Based Stress Reduction RCT data",
      "body": "Mindfulness-Based Stress Reduction (MBSR), developed by Jon Kabat-Zinn, has been evaluated in multiple randomised controlled trials. Studies published in peer-reviewed journals including JAMA have found statistically significant reductions in self-reported stress, anxiety, and in some trials, physiological stress markers compared to control conditions.",
      "source_url": "SOURCE_NEEDED: peer-reviewed MBSR RCT — JAMA Internal Medicine or equivalent",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 76,
      "launch_blocker": true
    },
    {
      "stance": "support",
      "quality": "repeatable",
      "title": "Cortisol reduction in meditation practitioners",
      "body": "Several studies have measured salivary or urinary cortisol (a physiological stress marker) before and after meditation interventions. Results suggest reductions in cortisol, though effect sizes vary by population, practice type, and measurement timing.",
      "source_url": "SOURCE_NEEDED: peer-reviewed physiology paper measuring cortisol in meditation study",
      "source_url_status": "[draft] SOURCE_NEEDED",
      "media_type": "study",
      "reliability_score": 72,
      "launch_blocker": false
    }
  ],
  "pressure": [
    {
      "title": "Effect sizes vary; publication bias may inflate results",
      "body": "Meta-analyses of meditation research find moderate but not large effect sizes, and there are concerns about publication bias (positive results are more likely to be published). The evidence supports the claim that meditation can reduce stress markers on average, but the effect is not large or universal across all practice types and populations.",
      "severity": 3
    }
  ],
  "tests": [
    {
      "title": "Subjective stress self-rating before and after a breathing session",
      "instructions": "Rate your perceived stress on a 1–10 scale before and after a 10-minute guided breathing protocol. Note limitations: self-report is subject to expectation effects and is not the same as physiological measurement. This is an illustration of the measurement concept, not a replication of the clinical studies.",
      "difficulty": "easy",
      "safety_level": "normal"
    }
  ],
  "review_state_intended": "[draft] review",
  "launch_priority": "[draft] medium",
  "risk_level": "[draft] very-low",
  "source_status": "[draft] all_SOURCE_NEEDED",
  "notes": "[draft] This claim is Physical/Testable despite appearing in the belief-adjacent category. Included as the one cross-category example from E. Primary RCT evidence is launch-blocker."
}
```

---

## 6. Truth Object Schema

The truth object shape must match the structure consumed by `importTruthSeeds()` in
`src/truth-seed.js`. The currently active field set is:

```
statement           string   — the truth text as stated; inherited saying or cultural claim
category            string   — platform taxonomy category (culture, belief, institution, etc.)
origin              string   — where this saying comes from (family/school, religion, internet, etc.)
truth_type          string   — common | cultural | religious | institutional | family | scientific
confidence_label    string   — always "claimed" for truth seeds
```

**Extended draft fields** (for documentation only; not in current importer schema):

```
id_placeholder      string   — documentation identifier; e.g. "truth-ml-01"
framing             string   — plain-English framing note for what this saying means culturally
launch_priority     string   — high | medium | low
risk_level          string   — very-low | low | medium
source_status       string   — "no_source_needed" | "needs_framing_only" | "needs_careful_framing"
notes               string   — any import or UI context notes
```

**Important:** Truth seeds do not have `source_url` in the current schema. The import
checklist task is to confirm the `framing` note is clear and the `category` label is
set correctly before import — not to gather external URLs.

---

## 7. Draft Truth Objects

Twelve representative draft truth objects from D-55. Marked with classification and framing.

---

### Media Literacy

```
id_placeholder:    truth-ml-01
statement:         If it's on the internet it must be true
category:          media-literacy
origin:            digital era / common irony
truth_type:        common
confidence_label:  claimed
framing:           A recurring assumption (sometimes stated sincerely, sometimes sarcastically)
                   that online publication implies verification. Useful for examining
                   how people assess source credibility.
launch_priority:   high
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required. Category label "media-literacy" must display in UI.

---

id_placeholder:    truth-ml-02
statement:         The news media always tells the truth
category:          media-literacy
origin:            institutional trust tradition
truth_type:        institutional
confidence_label:  claimed
framing:           An expression of blanket trust in media institutions. Pairs usefully
                   with the counter-claim below to show HumanX treats both
                   uncritical trust and blanket dismissal as claims requiring evidence.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             Pair with truth-ml-03 in UI if possible.

---

id_placeholder:    truth-ml-03
statement:         The news media always lies
category:          media-literacy
origin:            counterculture / populist politics
truth_type:        common
confidence_label:  claimed
framing:           An expression of blanket institutional distrust. Neither this nor
                   truth-ml-02 is HumanX's position; both are documented cultural
                   assertions that the evidence layer can test.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             Pair with truth-ml-02.

---

id_placeholder:    truth-ml-04
statement:         You can't trust statistics
category:          media-literacy
origin:            common scepticism / misattributed Disraeli quote
truth_type:        common
confidence_label:  claimed
framing:           A widespread anti-evidence dismissal often used to avoid engaging
                   with quantitative data. The HumanX platform can be used to examine
                   whether statistical claims have been tested and replicated.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.
```

---

### Memory and Perception

```
id_placeholder:    truth-mem-01
statement:         Seeing is believing
category:          memory-perception
origin:            common proverb
truth_type:        common
confidence_label:  claimed
framing:           Appeals to direct perception as the final arbiter of truth.
                   Connects directly to HumanX claims about eyewitness reliability
                   and photograph manipulation.
launch_priority:   high
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.

---

id_placeholder:    truth-mem-02
statement:         I would know if I was being lied to
category:          memory-perception
origin:            common overconfidence
truth_type:        common
confidence_label:  claimed
framing:           Overconfidence in one's own deception-detection ability.
                   Links to claim launch-d4-lie-detection.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required. Consider linking to claim C2 or D4 if claim
                   linking is available in UI.

---

id_placeholder:    truth-mem-03
statement:         My gut feeling is always right
category:          memory-perception
origin:            common folk psychology
truth_type:        common
confidence_label:  claimed
framing:           Appeals to intuition as a reliable guide. Connects to survivorship
                   bias, pattern recognition, and the limits of non-conscious processing.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.
```

---

### Social Pressure

```
id_placeholder:    truth-soc-01
statement:         Everyone knows that
category:          social-pressure
origin:            everyday speech
truth_type:        common
confidence_label:  claimed
framing:           Appeal to unstated consensus, used to avoid needing to cite evidence.
                   One of the most common informal rhetorical moves.
launch_priority:   high
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.

---

id_placeholder:    truth-soc-02
statement:         The majority can't be wrong
category:          social-pressure
origin:            consensus appeal / argumentum ad populum
truth_type:        common
confidence_label:  claimed
framing:           Majority belief as a truth standard. HumanX's evidence layer
                   exists precisely to distinguish 'widely believed' from 'well-evidenced'.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.

---

id_placeholder:    truth-soc-03
statement:         If you have nothing to hide, you have nothing to fear
category:          civic
origin:            surveillance policy debate / attributed to multiple historical figures
truth_type:        common
confidence_label:  claimed
framing:           A recurring argument in surveillance and privacy debates.
                   Must display origin label clearly — without it, the statement
                   can be read as HumanX endorsing surveillance.
                   Category: civic or social-pressure.
launch_priority:   low
risk_level:        medium
source_status:     needs_careful_framing
notes:             NEEDS-CAREFUL-FRAMING. Do not import without visible origin label
                   and category display in UI. Deferred until frontend category display
                   is confirmed active.
```

---

### Civic Claims

```
id_placeholder:    truth-civ-01
statement:         Voting doesn't make a difference
category:          civic
origin:            political disengagement / cynicism
truth_type:        common
confidence_label:  claimed
framing:           A civic disengagement claim often cited to justify not participating
                   in elections. The evidence layer can test this against electoral
                   margin data and participation research.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required for the truth seed itself.

---

id_placeholder:    truth-civ-02
statement:         Freedom of speech means freedom from consequences
category:          civic
origin:            common misapplication of free speech doctrine
truth_type:        common
confidence_label:  claimed
framing:           A misapplication of free speech law to social consequences.
                   Legal free speech protections apply to government suppression,
                   not to social, professional, or platform responses.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.
```

---

### Belief / Identity

```
id_placeholder:    truth-bel-01
statement:         Success is purely the result of hard work
category:          belief-identity
origin:            Protestant work ethic / self-help tradition
truth_type:        cultural
confidence_label:  claimed
framing:           A meritocracy claim that ignores structural, circumstantial, and
                   luck-based factors in outcomes. Connects to sociological and
                   economic research on mobility and inequality.
launch_priority:   medium
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required. Origin label "self-help / meritocracy tradition"
                   should display in UI.

---

id_placeholder:    truth-bel-02
statement:         Human nature never changes
category:          belief-identity
origin:            philosophical essentialism
truth_type:        common
confidence_label:  claimed
framing:           An essentialist claim about fixed human characteristics across history
                   and culture. HumanX can examine this against anthropological and
                   historical evidence of behavioural variation.
launch_priority:   low
risk_level:        very-low
source_status:     needs_framing_only
notes:             No source URL required.
```

**Truth draft summary:**

| ID prefix | Category | Count | Classification |
|-----------|----------|-------|---------------|
| truth-ml | media-literacy | 4 | launch-candidate |
| truth-mem | memory-perception | 3 | launch-candidate |
| truth-soc | social-pressure | 2 + 1 framing | 2 launch-candidate, 1 needs-careful-framing |
| truth-civ | civic | 2 | launch-candidate |
| truth-bel | belief-identity | 2 | launch-candidate |
| **Total** | | **12** | **11 launch-candidate, 1 needs-careful-framing** |

---

## 8. Import Safety Notes

**Current state of import routes (from D-54 audit):**

| Route | Who can call | Current behaviour | Risk |
|-------|-------------|-------------------|------|
| `GET /api/import-seed` | Admin only | Inserts as `review_state='public'` | Seeds bypass moderation queue |
| `GET /api/import-truths` | Admin only | Inserts as `review_state='public'` | Truths bypass moderation queue |
| `GET /api/seed` | Public (DB-empty guard) | Inserts 3 fallback `demoClaims()` as `'public'` | DB-empty guard limits risk |

**Required before any production import of D-57 content:**

Option A (preferred — D-58 Worker change):
> Modify `importSeedData()` and `importTruthSeeds()` to insert all items with
> `review_state='review'`. After import, an admin manually reviews and approves
> each item in the Review queue. Nothing appears publicly until approved.

Option B (acceptable if D-58 is deferred):
> Keep the current `'public'` insertion behaviour but restrict it to a
> separately curated, admin-signed seed pack — a distinct route that requires
> both admin token and an explicit per-session D1 approval gate.

**Under no circumstances should either import route be run without:**
1. All `SOURCE_NEEDED` placeholders replaced with real, verified URLs.
2. Explicit per-session D1 approval.
3. A pre-import DB snapshot (in case rollback is needed).
4. The D-58 safety change merged (or Option B explicitly approved).

**The current `GET /api/seed` public route** (DB-empty guard) must not be called on a
production database that already has content — the guard prevents it, but it should not
be tested on production.

---

## 9. Future Path

| Batch | Type | Scope |
|-------|------|-------|
| **D-58** | Worker change (branch + PR) | Import route safety — modify `importSeedData` and `importTruthSeeds` in `src/importer.js` and `src/truth-seed.js` to insert as `review_state='review'`; admin must approve each item explicitly; this is a code change requiring branch + PR |
| **D-59** | Human research + docs | Source URL insertion — a human researcher follows the D-56 7-step workflow to locate, verify, and record a real URL for each `SOURCE_NEEDED` placeholder in the D-57 draft; results are recorded in a D-59 working doc; no import yet |
| **D-60** | Gated | Production import / cleanup plan — after D-59 sources confirmed, D-57 JSON finalised with real URLs, D-58 safety change merged: produce a step-by-step production import plan; execution requires explicit per-session D1 approval; includes pre-import DB snapshot, post-import PRAGMA check, and admin review step for each seed item |

---

## 10. Safety

| Rule | Status |
|------|--------|
| No D1 writes in D-57 | ✅ Confirmed |
| No seed file edits | ✅ Confirmed — `data/seed_claims_v1.json`, `data/seed_truths_v1.json`, `src/seed-data.js`, `src/truth-seed.js` all unchanged |
| No data imported | ✅ Confirmed |
| No data archived or deleted | ✅ Confirmed |
| No fake or invented URLs | ✅ All source_url values are SOURCE_NEEDED placeholders |
| No Worker changes | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No production mutations | ✅ Confirmed |

---

## D-57 Completion Record

| Item | Status |
|------|--------|
| Summary and scope of doc stated | ✅ |
| Proposed file shape for `data/seed_claims_v2.json` | ✅ |
| Claim object schema (matching `src/seed-data.js`) + extended draft fields | ✅ |
| Evidence object schema + extended draft fields | ✅ |
| 12 draft claim objects from D-55 with full body text | ✅ |
| Truth object schema (matching `src/truth-seed.js`) + extended draft fields | ✅ |
| 12 draft truth objects from D-55 with framing notes | ✅ |
| Import safety notes: Option A (D-58 Worker change) and Option B documented | ✅ |
| Future path D-58 → D-59 → D-60 defined | ✅ |
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
