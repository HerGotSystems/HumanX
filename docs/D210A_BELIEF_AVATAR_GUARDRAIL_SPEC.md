# D-210A — Belief Avatar / Show-Off Layer Guardrail Spec

**Scope:** Spec only — no code, no images, no avatar prototype, no public avatar
**Status:** COMPLETE
**Baseline:** 1886/24/57
**Next task:** D-210B (see Section K)

---

## A. Product Goal

The avatar/show-off layer exists to help users reflect on *how* they investigate claims — not to label *what* they believe.

Safe purposes:
- Make self-study more playful and visually engaging
- Help users recognise their own investigation patterns without being ranked or sorted
- Show investigation habits in a form the user might enjoy or share
- Give users something interesting to look at without giving outsiders a label to judge them by
- Keep the avatar private by default; sharing is explicit and controlled

The avatar must never function as a credential, a grade, a tribal badge, or a public identity declaration. It is a mirror, not a report card.

---

## B. What the Avatar May Represent

These dimensions are safe because they describe *how* a user investigates, not *what* they believe or how correct they are.

| Dimension | Example expression |
|---|---|
| Investigation style | "tends to seek multiple sources before settling" |
| Question style | "often questions framing before accepting the claim" |
| Source diversity style | "draws from varied source types across claims" |
| Evidence habit style | "favours direct evidence over testimony" |
| Pressure openness | "frequently engages with pressure-test prompts" |
| Test-seeking tendency | "often adds home tests to active claims" |
| Uncertainty posture | "regularly marks confidence levels; updates them" |
| Reflection mode | "revisits older claims after new evidence" |
| Exploration rhythm | "investigates in focused bursts; long gaps between" |

All of these can be derived from private owner data without exposing identity beliefs.

---

## C. What the Avatar Must NOT Represent

These are permanently forbidden from the avatar layer regardless of consent state:

| Forbidden dimension | Why |
|---|---|
| Intelligence | Directly harmful — implies some users are smarter than others |
| Morality | Belief habits do not indicate moral character |
| Truth level | HumanX does not adjudicate truth |
| Ideological tribe | No sorting into political/cultural camps |
| Religious correctness | No ranking of religious beliefs |
| Political alignment | No inference of political identity from habits |
| Purity / corruption | No "clean thinker" vs "corrupt thinker" framing |
| Good believer / bad believer | No virtue signal or shame signal |
| Conspiracy score | No "conspiracy prone" label or indicator |
| Credibility ranking | No credibility score relative to other users |
| Mental health diagnosis | No "paranoid," "delusional," or clinical framing |
| Official HumanX verdict | Avatar is not an endorsement or judgment from HumanX |

These are not implementation risks to manage — they are permanent design constraints.

---

## D. Safe Visual Metaphors

### Recommended metaphors

These metaphors suggest exploration, discovery, and self-study without implying rank or correctness:

| Metaphor | Why it works |
|---|---|
| Explorer | Active, curious; no hierarchy |
| Cartographer | Mapping the terrain; no judgment of the territory |
| Lighthouse | Illuminates; does not judge what it reveals |
| Compass | Orientation tool; not a ranking instrument |
| Mirror | Reflection; shows back what the user brings |
| Workshop | Process and craft; work in progress |
| Constellation | Pattern recognition; not a fixed score |
| Garden | Growth and tending; no correct garden shape |
| Weather map | Patterns over time; neutral descriptors |
| Library | Breadth and depth of engagement; not a ranking |
| Laboratory notebook | Record-keeping and method; not verdict |
| Signal/noise dial | Attention calibration; not intelligence |

### Forbidden visual elements

| Element | Why forbidden |
|---|---|
| Crowns | Implies hierarchy and winners |
| Medals / trophies | Implies competitive ranking |
| Halos | Religious purity framing |
| Devil horns | Moral condemnation |
| Police badges | Authority and enforcement framing |
| Judge gavel | Verdict framing |
| Red/green truth meter | HumanX does not judge truth |
| IQ / brain rank imagery | Intelligence ranking |
| Religious symbols | Unless user explicitly adds them in their own content |
| Political colors or flags | Tribal sorting |

---

## E. Data Sources Allowed

### Private-only candidate data

The following fields from the owner's private data are safe inputs for avatar generation:

| Source | Field / signal |
|---|---|
| Evidence records | `source_type` distribution — source diversity style |
| Evidence records | `evidence_strength` distribution — evidence habit style |
| Evidence records | Count per claim — investigation depth signal |
| `home_tests` records | Count, recency — test-seeking tendency |
| `home_tests.updated_at` | Recency rhythm — exploration rhythm |
| Pressure events | Engagement rate — pressure openness |
| Claim confidence fields | Update frequency — uncertainty posture |
| Claim creation patterns | Burst vs. sustained — exploration rhythm |

### Rules

- Use only owner/private data by default — no cross-user data, no inference from public profile
- No public avatar data without explicit consent (separate from scores consent)
- Never use `top_beliefs_json` — named ideology/religion/alignment data
- Never use `dominant_pattern` — named belief archetype
- Never use `alignment_labels` — named political/religious groupings
- Never infer religion, ideology, or worldview from habit patterns and then surface that inference to the avatar
- Avatar generation prompt must not include alignment-derived descriptors

---

## F. Privacy Model

| Rule | Detail |
|---|---|
| Private by default | Avatar is never shown publicly unless owner explicitly opts in |
| Sharing requires explicit opt-in | A separate consent step, distinct from the scores consent (D-209H) |
| Public avatar cannot reveal hidden belief fields | If avatar is shared, it may only use habit descriptors — no belief identity fields |
| Preview before publish | Owner must see exactly what will be public before sharing is confirmed |
| No automatic avatar on public profile | Avatar does not appear on `/api/u/:slug` or any public render without explicit consent |
| No avatar from viewer assumptions | Public avatar (if ever shared) is generated from owner's private data, not inferred from what a viewer might expect |
| Avatar export | Any image/card export requires explicit save action — no passive publishing |

This model mirrors the no-auto-save principle from D-209G/H: consent is active, not passive.

---

## G. Copy Principles

### Required guardrail copy

Every avatar screen must include:

> Your avatar reflects investigation habits, not intelligence, morality, ideology, or truth.

This line is mandatory wherever the avatar is displayed (private or public).

### Safe wording

| Safe term | Notes |
|---|---|
| `reflection avatar` | Centres self-study |
| `investigation style` | Describes process, not verdict |
| `claim-study pattern` | Neutral description of habit |
| `questioning style` | Describes how, not what |
| `habit map` | Visual and neutral |
| `exploration signature` | Unique but not ranked |

### Forbidden wording

| Forbidden term | Why |
|---|---|
| `belief identity` | Implies the avatar defines who the user is |
| `truth level` | HumanX does not rank truth |
| `purity` | Moral judgment |
| `ideology type` | Tribal sorting |
| `religious alignment` | Identity label |
| `smart score` | Intelligence ranking |
| `HumanX rank` | Competitive hierarchy |
| `credibility` | Implies some users are less credible |
| `conspiracy score` | Stigmatising label |
| `belief archetype` | Too close to `dominant_pattern` framing |

---

## H. Recommended First Implementation After Spec

### Options reviewed

| Option | Description | Risk |
|---|---|---|
| 1 | Private static "Reflection Avatar concept card" in My HumanX — no generated image | Low — frontend only, private, no image generation pipeline |
| 2 | Private avatar settings/spec screen only — UI shell for future settings | Very low — no data, no render |
| 3 | Docs-only visual prompt guide | Zero — no code |
| 4 | No avatar yet — continue consent hardening | Zero — defer entirely |

### Recommendation: Option 1

**D-210B should implement a private static Reflection Avatar concept card in My HumanX.**

Reasons:
- Delivers visible progress toward the show-off layer without any image generation complexity
- Private by default — no public surface change
- Frontend-only — no new backend routes, no new DB columns, no migration
- Forces the copy and visual metaphor choices to be made in real UI, not just spec
- The "concept card" framing is honest: it shows the user their investigation style summary in a visually distinct block, using safe habit descriptors, with the required guardrail copy
- No data new data is needed — all inputs are already in the `/api/my-humanx` payload

The concept card can show: exploration rhythm category, source diversity note, evidence habit note, pressure openness note — all derived from existing private data, all expressed in safe non-ranking language. No generated image. No public render. No alignment data.

---

## I. Avatar Image Generation (Future Only)

If image/visual generation is added in a future arc:

- User must trigger generation explicitly — no automatic generation on login or snapshot save
- Generation prompt must be constructed from safe habit descriptors only — never from `top_beliefs_json`, `dominant_pattern`, or `alignment_labels`
- Prompt must exclude ideology, religion, and politics unless the user manually types those words themselves in a separate free-text field
- No automatic public posting — generated image is saved locally/privately first
- Save/export requires a preview step where the user sees exactly what will be shared
- No "official HumanX identity" framing — generated image is user's own output, not a HumanX-issued certificate
- Image generation pipeline must be audited before implementation (separate spec required)

---

## J. Test Requirements for Future Implementation

When D-210B (or any avatar feature) ships, the following smoke tests must be added:

| Test | What it checks |
|---|---|
| Avatar is private by default | `renderPublicProfileHtml` does not call any avatar render function |
| No public avatar render | No avatar HTML appears in the public profile response path |
| Required guardrail copy present | Avatar block contains "not intelligence, morality, ideology, or truth" |
| No banned field access | Avatar code does not read `top_beliefs_json`, `dominant_pattern`, `alignment_labels` |
| No banned wording | Avatar HTML does not include "truth level", "purity", "ideology type", "HumanX rank", "smart score", "credibility" |
| No share without consent | No avatar share path exists without explicit opt-in action |
| No auto-save | Any avatar setting change requires explicit save action before persisting |
| Guardrail copy in public render | If avatar is ever shared, guardrail copy must be present in the public render too |

These tests must pass before D-210B or any avatar feature is committed.

---

## K. D-210B Recommendation

### Safest next patch

**D-210B: Private static Reflection Avatar concept card — My HumanX, frontend only**

| Detail | Value |
|---|---|
| Files affected | `public/app-v10.js`, `public/styles.css` |
| Frontend only? | Yes |
| Deploy needed? | Yes (static file change) |
| Backend work? | No — all data already in `/api/my-humanx` payload |
| DB/migration? | No |
| New public surface? | No — concept card is private; no change to public profile render |
| Image generation? | No |
| New consent required? | No — private-only; no opt-in needed until sharing is introduced |

### Biggest avatar risk

**Framing drift** — the risk that copy or visual choices gradually shift the card from "investigation habit reflection" toward "belief identity label." This happens incrementally: a slightly too-confident descriptor here, a vaguely ranked visual there, until the card reads as a personality type or tribal identifier. Every future avatar patch must be reviewed against Section C (forbidden dimensions) and Section G (forbidden wording) before shipping.

### D-210B: code or docs-only?

**Code.** The spec is sufficient to build the concept card safely. D-210B should implement the private static card in `app-v10.js` with the required guardrail copy, using only existing private payload data, with no public render change. A docs-only D-210B would just defer the real work without reducing risk.
