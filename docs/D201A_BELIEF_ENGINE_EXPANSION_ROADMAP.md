# D-201A — Belief Engine Expansion Audit and Roadmap

**Date:** 2026-06-28
**HEAD at creation:** `4a8e324`
**Baseline:** 1589/24/57
**Scope:** Audit and roadmap only — no code changes

---

## A. Current Belief Engine State

### What exists today

`public/apps/humanx-belief-engine/index.html` is a 2763-line standalone HTML app. It runs a single mapping session and produces one snapshot.

**Input flow:**
- Belief type selection (what you believe — multi-select chips)
- God/deity count section
- Political leaning (optional)
- Belief stability setting
- Run mode (what gets saved)
- Belief timeline: events → fear/certainty scored entries

**Output (result screen):**
- Pressure Map (visual)
- Profile Snapshot: Belief DNA, Identity Fragmentation, Closest Alignments
- Core Dimensions
- Identity Attachment
- Structural Snapshot
- Belief Origin Load
- Stress Test Readout
- Under Pressure
- Contradiction Constellation + Contradiction Scan

**Backend:**
- `belief_snapshots` table: `label`, `dominant_pattern`, `stability_score`, `openness_score`, `pressure_score`, `dimensions_json`, `top_beliefs_json`, `contradictions_json`, `contradiction_count`, `public_summary_enabled`
- `/api/belief-snapshots` GET/POST — owner-only read, requires `requireUser`
- `/api/belief-promote` POST — promotes a snapshot into a Truth or Claim
- Public profile: one snapshot per user can be set as `public_summary_enabled=1`

**Evidence model:**
- `quality` field: `repeatable`, `documented`, `media`, `testimony`, `vibes`
- `source_url` optional URL
- No source-type taxonomy distinguishing empirical from scriptural from personal

**Truths model:**
- `origin` field (free text — "family", "media", "scripture", "science")
- `truth_type` field (common, religious, political, scientific, family, cultural)
- Both fields exist but are not displayed distinctly in the evidence/claim flow

### What is missing

- No way to run a second or different session without overwriting the first
- No snapshot comparison or drift tracking over time
- No shareable identity card beyond the raw snapshot summary text on a profile
- No global aggregate views (how users as a whole answer the same questions)
- Evidence `quality` field conflates epistemological weight with source type — testimony and scripture are not distinguished
- No UI for citing scripture/tradition as a source with honest framing
- No avatar or visual identity object

---

## B. What Is Missing (Priority View)

| Gap | Impact | Risk if ignored |
|-----|--------|----------------|
| Source-type taxonomy | High — dishonest framing when scripture = evidence | Religious claims will be mislabelled as empirically supported |
| Belief drift / comparison | High — single session = no longitudinal self-knowledge | Users have no reason to return to Belief Engine |
| Avatar / identity card | Medium — shareable hook | No social traction; no reason to show someone else |
| Global aggregate charts | Medium — curiosity driver | Product feels empty beyond personal use |
| Contradiction Finder module | Medium — deepens self-knowledge | Current contradiction scan is underused |
| Multiple belief sessions | Medium — basic multi-run support | Each run overwrites the story |

---

## C. Proposed Modules, Ranked

### Priority 1 — Source-Type Taxonomy (D-201B)

**Why first:** Affects evidence integrity across all claims, not just the Belief Engine. If a user cites the Bible as evidence that a factual claim is true, the system must be able to represent that honestly.

The current `quality` field mixes reliability (how replicable is this?) with source category (where does it come from?). These need to be separate.

See Section F for the full taxonomy.

---

### Priority 2 — Belief Engine Module: Contradiction Finder (D-201C)

A focused module that takes a user's saved beliefs and surfaces tensions — beliefs that imply opposing conclusions when applied to the same claim.

- Input: existing snapshot beliefs + active claims
- Output: ranked contradiction list with explainer text
- No new data model needed — works from existing snapshot + claim graph

---

### Priority 3 — Belief Engine Module: Origin Tracker

Where did each belief come from?

- For each belief in a snapshot, prompt: "Where did you get this?"
- Source categories: upbringing, personal experience, education, media, scripture/tradition, peer group, research, unknown
- Produces an "origin load" breakdown: what proportion of your beliefs came from each source category
- Connects to source-type taxonomy (D-201B)

---

### Priority 4 — Belief Engine Module: Pressure Profile

How does each belief hold up when challenged?

- Take a belief from a snapshot
- Link it to claims and evidence on the main platform
- Show: how many pieces of evidence support vs. challenge this belief
- Show: survivability score for each linked claim
- Result: a view of which beliefs are well-evidenced vs. asserted

---

### Priority 5 — Belief Engine Module: Confidence Ladder

How confident are you in each belief, and has that changed?

- Rate each belief: 0–10 confidence
- After a session with new evidence, re-rate
- Track changes over time
- Simple table: belief / confidence before / confidence after / delta

---

### Priority 6 — Identity / Avatar Card (D-201D)

A shareable visual card generated from the belief snapshot.

- Shows: dominant pattern, top 3 beliefs, stability score, contradiction count
- Does NOT show: personal name, email, handle by default (user-controlled)
- Design: badge / card aesthetic — meant to be shared as an image or linked page
- Image generation: deferred — card starts as HTML/CSS render only
- User controls: show/hide each field independently
- Shareable via `/u/<slug>/belief` or a generated link

---

### Priority 7 — Belief Drift Over Time

Compare two snapshots taken at different times.

- Side-by-side: dominant pattern, stability score, top beliefs, contradiction count
- Delta view: what changed, what held constant
- Requires: multiple saved snapshots (already partially supported by `belief_snapshots` table)
- Requires: UI to select "compare snapshot A to snapshot B"

---

### Priority 8 — Global Aggregate Charts (D-201E)

Anonymous, aggregate views of how users answer the same questions.

- What percentage of users believe X? (by claim category)
- What is the aggregate vote distribution (Believe / Reject / Unsure) per claim?
- What source types appear most often in submitted evidence?
- Presented as bar charts or pie charts — not ranked user lists
- No individual user data visible
- Framing rule: majority position is not displayed as truth

See Section E for full concept.

---

## D. Avatar / Identity Card Concept

### Design principles

- **No doxxing.** The card shows belief architecture, not name or photo by default.
- **User-controlled visibility.** Each field (dominant pattern, top beliefs, stability score, contradiction count) can be toggled on/off independently.
- **Show-off, not confession.** The card should feel like something a user would share to spark a conversation, not a surveillance record.
- **HTML/CSS first.** No image generation API. The card is a rendered HTML section with share-link. User can screenshot it.
- **Later: generated image.** Once the card design is stable, a serverside PNG render (via Cloudflare Workers + Canvas or a lightweight SVG-to-PNG approach) can be added. Do not build this yet.

### Card fields (proposed)

```
[HUMANX BELIEF CARD]
Pattern:      Empirical Skeptic
Stability:    67 / 100
Openness:     82 / 100
Top beliefs:  [list of 3]
Contradictions found: 4
Snapshot date: [date]
```

### Sharing

- Card lives at `/u/<slug>/belief` if profile is public
- Alternative: a one-time share link from My HumanX (no public profile required)
- The card link shows the belief architecture only — no claim history, no evidence, no activity

---

## E. Global Aggregate Charts Concept

### What to show

| Chart | Data source | Framing |
|-------|------------|---------|
| Claim support distribution | `claim_votes` aggregate by claim | "X% believe / Y% reject / Z% unsure" |
| Support by claim category | `claim_votes` JOIN `claims.category` aggregate | Distribution per category (Health, Politics, etc.) |
| Evidence source types | `evidence.source_type` aggregate (new field) | What kinds of sources users cite most |
| Belief pattern distribution | `belief_snapshots.dominant_pattern` aggregate | Most common belief architectures across users |

### What NOT to show

- Individual user vote records
- Ranked lists of "most believed claims" without context
- Any framing that implies aggregate belief = truth
- Sub-group breakdowns that could re-identify small cohorts

### Framing rules (non-negotiable)

Every aggregate chart must include a visible disclaimer:

> "This shows how users of HumanX have responded — not what is true. Majority position is not a verdict."

This disclaimer is not optional copy — it is a product principle. Any chart without it should not ship.

### Implementation constraint

Aggregate queries at scale need pre-computed counters, not live `COUNT(*)` per request. When user count is under 500, live queries are fine. Plan for a `daily_aggregates` table or similar once user count grows.

---

## F. Scripture / Tradition / Source Handling

### The problem

The current evidence `quality` field has these values:

```
repeatable   — Repeatable / raw data
documented   — Documented source
media        — Photo / video / screenshot
testimony    — Testimony
vibes        — Vibes / weak argument
```

This is an epistemological weight scale — it answers "how reliable is this evidence?" But it does not capture source category. A peer-reviewed study and a newspaper article are both `documented`. A personal Bible reading and a memoir are both `testimony`. Scripture is treated the same as personal experience.

This creates a specific problem: a user cites a Bible verse as evidence that "Jesus rose from the dead." Under the current model, this appears as testimony — the same as an eyewitness account. There is no way to say "this is the origin tradition of this belief" vs. "this is empirical evidence for the factual claim."

### Proposed source-type taxonomy

Add a `source_type` field to evidence (separate from `quality`). Values:

| Value | Label | What it means |
|-------|-------|--------------|
| `empirical` | Empirical / data | Measurement, experiment, dataset, replication |
| `expert` | Expert / technical | Peer review, professional assessment, academic source |
| `documentary` | Documentary / media | Journalism, recorded event, official document |
| `personal` | Personal experience | First-hand account, observation, memory |
| `scripture` | Scripture / tradition | Religious text, canonical teaching, doctrinal statement |
| `myth` | Myth / story / folklore | Non-literal narrative, cultural story, fable |
| `opinion` | Opinion / argument | Reasoning, inference, position without data |
| `unknown` | Unknown / unspecified | Source not stated or untraceable |

### Display rules

When `source_type = scripture` or `source_type = myth`:

- Label the evidence item with a visible badge: **"Origin / tradition"**
- Add inline note: *"This source records where this belief comes from or who holds it — it is not independent empirical evidence that the factual claim is true."*
- Do NOT add this note automatically to other source types
- The badge and note do not hide or suppress the evidence — they contextualise it

### Where this applies

- Evidence attached to claims (main UI side panel)
- RunPack export (include `source_type` in packet JSON)
- Review queue inspector (moderator can see source type)
- Truths model already has `origin` (free text) and `truth_type` — these can map to the new taxonomy in a later migration

### What this does NOT do

- Does not prevent scripture from being submitted as evidence
- Does not auto-reject religious sources
- Does not score religious sources lower by default
- Does not label personal experience as inferior to expert sources
- The user sets `source_type`; the UI displays the appropriate contextual note

---

## G. Implementation Phases

| Patch | Contents | Trigger |
|-------|---------|---------|
| **D-201B** | Source-type taxonomy audit — inspect DB schema, UI quality field, RunPack JSON, Review inspector; propose exact migration and UI change without implementing | This doc approved |
| **D-201C** | Belief Engine module UX sketch — wireframe-level description of Contradiction Finder, Origin Tracker, and Confidence Ladder as new Belief Engine sections | D-201B audit complete |
| **D-201D** | Avatar / identity card spec — HTML/CSS card design, share link structure, My HumanX integration point, visibility toggles | D-201C approved |
| **D-201E** | Aggregate chart data audit — what queries are needed, what the `daily_aggregates` table would look like, what charts are safe to show vs. suppress | D-201D approved |

Implementation of code starts in the patch after each audit/spec is approved. Audit docs do not ship code.

---

## H. What Not to Build Yet

| Item | Reason |
|------|--------|
| Image generation API | Premature — card works as HTML/CSS first |
| Public ranking of users by belief score | Gamifies belief in a way that creates perverse incentives |
| Belief score leaderboard | Same — "most consistent believer" is not a meaningful or safe metric |
| Claim that charts prove truth | Charts show distribution, not verdict |
| Religious source treated as factual proof by default | Honest framing requires explicit source-type taxonomy first |
| Auto-rejection of scripture-sourced evidence | Suppression without review is not HumanX's role |
| Belief pattern matching / "find users like you" | Re-identification risk at small user counts; social pressure risk at scale |
| Drift alerts / push notifications | Not until core multi-session flow is stable |

---

## Recommended First Implementation Step

**D-201B: Source-type taxonomy audit.**

The `quality` field conflation is the highest-risk gap. It is not a cosmetic problem — it determines whether a claim citing scripture can be honestly represented as "here is where this belief comes from" vs. "here is evidence this is true." That distinction is load-bearing for the product's epistemological honesty.

The audit should inspect:
- Current `evidence` table schema (add `source_type` column)
- Current `quality` field values in use (what is live in the DB)
- Side panel UI (where `eQuality` is rendered — already has `id` and `name` from D-199B)
- RunPack JSON schema (`quality` is included; `source_type` would be added)
- Review queue inspector (what moderators see per evidence item)

No code ships in D-201B — the audit produces a safe migration plan and an exact UI change spec.

---

## Biggest Risk to Avoid

**Conflating source origin with factual weight without labelling the difference.**

If a user cites a religious text as evidence and HumanX displays it the same way as a peer-reviewed study, the product is epistemologically dishonest. This is not a future edge case — it will happen in the first wave of real submissions. The source-type taxonomy (D-201B) exists to prevent this.

The second biggest risk: framing aggregate charts as verdicts. Any chart showing majority belief distribution must have the disclaimer visible and non-optional. If the disclaimer is toggleable or collapses behind a "more info" link, it will not be seen by most users.
