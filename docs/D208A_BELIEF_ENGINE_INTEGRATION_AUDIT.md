# D-208A — Belief Engine Integration Audit

**Date:** 2026-06-28
**HEAD at audit:** `bfc1e04`
**Baseline:** 1744/24/57
**Scope:** Audit and recommendation only — no code changes in this patch

---

## A. Current Belief Engine State

### What exists

The Belief Engine is a standalone app at `public/apps/humanx-belief-engine/index.html` (~2 763 lines). It runs as a separate page navigated to by a hard redirect from `mode='belief'` in the main app. It is architecturally isolated: it does not share the main app's JavaScript bundle, CSS, state, or data-loading pipeline.

**What the Belief Engine does:**

1. **Optional identity capture** — user selects from a categorized list of ~80+ belief systems, ranging from major world religions to niche philosophical positions (Chaos Magick, Animism, Simulation Theory as literal belief, etc.). All optional; "Skip" available.
2. **77-question questionnaire** — statements across ~10 categories (epistemological, metaphysical, identity & self, social structures, moral philosophy, religious/spiritual, belief origins, etc.). Each answer scores one or more of ~16 dimensions.
3. **Belief Timeline** — open-text questions about childhood beliefs, adult drift, and identity-threatening beliefs. Completely optional. Data never leaves the browser unless explicitly sent.
4. **Results screen** — radar chart, "Profile Snapshot" section (labelled "Belief DNA" + "Identity Fragmentation"), dominant signals strip, Identity Attachment panel, Structural Snapshot & Origin (collapsible), Contradiction Constellation.
5. **"Send to HumanX" flow** — user can optionally save a snapshot. This POSTs to `/api/belief-snapshots`. The intro explicitly states: "Your answers start in your browser; sending to HumanX is optional and enters Review before becoming public."
6. **Promote to Truth** — `/api/belief-promote` turns a belief statement into a public Truth, entering the normal Review queue.

**Dimensions tracked (all stored in `dimensions_json`):**

| Code | Label | What it measures |
|------|-------|-----------------|
| META | Metaphysical | Openness to non-physical explanations |
| EVID | Evidence reliance | Scientific/empirical weighting |
| AUTH | Authority deference | Deference to scripture, tradition, hierarchy |
| COLL | Collectivism | Group vs individual orientation |
| RITE | Ritual importance | Value placed on ceremony/practice |
| ABSO | Absolutism | Belief in universal moral absolutes |
| RIGD | Rigidity | Resistance to changing core beliefs |
| PROG | Progressive tendency | Openness to change and revision |
| TRAN | Transcendence orientation | Orientation toward spiritual transcendence |
| INHR | Inherited | Beliefs absorbed pre-consciously |
| SELF | Self-Built | Beliefs deliberately assembled |
| TRIB | Tribal Load | Belief dependence on community belonging |
| PAIN | Pain Architecture | Beliefs organized around suffering/threat |
| OPEN | Revision Openness | Capacity to doubt and update |
| FUSE | Identity Fusion | How much belief fuses with selfhood |
| STRS | Stress/Nuance tolerance | Tolerance for complexity and contradiction |
| HUMI | (used in questions) | Intellectual humility signals |
| DOGM | (used in questions) | Dogmatic certainty signals |

**Snapshot fields stored in DB (`belief_snapshots` table):**

```
id, user_id, label, engine_version, source, dominant_pattern,
summary, belief_count, contradiction_count,
stability_score, openness_score, pressure_score,
dimensions_json, top_beliefs_json, contradictions_json,
stress_points_json, raw_json, created_at, public_summary_enabled
```

**Guardrails already present in the Belief Engine:**
- Intro: "No correct answers. No religion assigned. No diagnosis. No score of your worth."
- Results framing: "This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict."
- Results copy: "These reflect belief structure — where beliefs came from and how they're held — not what they are."
- Intro note: "Your answers start in your browser; sending to HumanX is optional."

These are the right instincts. They are undermined by other framing in the same app (see Section C).

### What is already connected to the main app

1. **My HumanX → Belief Mirror panel** (`meMirrorHtml` in `app-v10.js`). Renders from saved `belief_snapshots`. Shows:
   - "Latest snapshot" card: `dominant_pattern` text label + three bar meters (stability, openness, pressure)
   - "Recent drift" card: numeric delta between latest and previous snapshot on all three scores
   - Categories card (claims/truths breakdown by category)
   - Support/challenge balance card
   - Tensions card (from contradictions_json)
   - Questions card (reflective prompts based on pressure_score and contradictions)

2. **My HumanX → Snapshot list** (`meBeliefSnapshotsHtml`). Lists snapshots with inline numeric display: "stability 73 · openness 45 · pressure 62". Allows user to choose one snapshot to share on their public profile.

3. **Public Profile** (`getPublicProfile` in `worker.js`). Returns a shared snapshot row containing: `label`, `dominant_pattern`, `stability_score`, `openness_score`, `pressure_score`, `top_beliefs_json`, `contradiction_count`. This is the only currently public-facing belief surface.

4. **Drift view** (`renderDrift` in `app-v10.js`). Shows saved snapshots as a timeline.

5. **Backend routes**: `/api/belief-snapshots` (GET/POST), `/api/belief-promote` (POST).

### What is isolated / not yet connected

- The Study view's Investigation Overview charts (Source Type Mix, Evidence Strength Mix, Pressure Mix, Test Activity) are entirely independent of the Belief Engine. No link exists from Study behavior back to belief patterns.
- Claim votes (`claim_votes` table) are not connected to Belief Engine.
- Evidence submissions (source_type, evidence_strength) are not surfaced in belief reflection.
- Test activity (difficulty) is not connected to belief patterns.
- The `home_tests` table (test proposals) is not connected to belief patterns.
- The Drift view exists but shows only point-in-time snapshots — it does not show evolution relative to claim activity or vote behavior.

### What already works well

- Local-first architecture: belief answers exist only in the browser until the user explicitly sends.
- The questionnaire is genuinely thoughtful and covers structural belief questions (origins, pressure, identity attachment) rather than just belief content.
- Contradiction detection (36 checks) is useful and specific.
- Drift timeline concept is the right shape: snapshot comparison over time.
- The Belief Mirror in My HumanX is a reasonable starting point for personal reflection.
- Guardrail copy in the Engine intro is appropriate.

### What feels disconnected or risky

1. **"Belief DNA" heading** — the word "DNA" implies biological determinism. It sounds like the engine is revealing something fixed about you rather than describing a current pattern.
2. **"Identity Fragmentation"** — pathologizing. This is a clinical-sounding label for what is actually a measure of whether beliefs come from multiple sources. Not neutral.
3. **Numeric scores shown with no context** — "stability 73 · openness 45 · pressure 62" in the My HumanX snapshot list. A user reading this sees numbers that feel authoritative but have no clear meaning.
4. **`dominant_pattern` on public profile** — this is a text label generated from the user's top belief alignment match. It could say "Traditional Christianity" or "Scientific Materialism" or any other named system. Making that publicly visible by default-option is ideological labeling.
5. **`top_beliefs_json` on public profile** — contains named alignment entries (e.g., "Traditional Christianity", "Islam (Traditional)", "Secular Humanism"). These are specific ideological/religious identity labels. Sharing them publicly without clear user consent around what they mean is the highest current risk.
6. **Drift card showing numeric deltas** — "Stability +12, Openness -7, Pressure +18" between snapshots. This is fine as a private tool. Shown publicly or to others, it reads like a health metric changing over time.
7. **"TRIB" (Tribal Load) and "FUSE" (Identity Fusion) dimensions** — valuable for personal reflection; very high risk if ever shown on a public profile ("this user has high tribal load").
8. **Structural Snapshot score "Identity Fragmentation"** — the label says fragmentation, which implies pathology. The underlying measure (beliefs from multiple sources) is not pathological.

---

## B. HumanX Belief-Learning Goal

The user wants HumanX to help people learn about themselves and their beliefs. This is the right goal. The specific learning outcomes that matter:

1. **Notice belief patterns.** "I tend to weight authority sources heavily." "I have low tolerance for ambiguity." "My beliefs mostly came from inherited context, not deliberate study."
2. **See confidence drift.** "I was more certain about X six months ago. Something changed." "My openness score increased after engaging with the pressure on this claim."
3. **See what sources I rely on.** "80% of the evidence I submit is personal experience." "I almost never submit peer-reviewed sources." This is the source_type data from D-203B that is not yet connected.
4. **See what kinds of claims I engage with.** Am I drawn to political claims? Religious claims? Scientific consensus claims? Contested empirical claims?
5. **See where pressure changes my view.** A user who submitted a "Believe" vote, then added a pressure point, then changed to "Unsure" — that sequence is a belief-drift signal.
6. **Help them ask better questions about themselves.** The Mirror should generate questions, not verdicts. "You've submitted 12 pieces of evidence but no pressure points. What would challenge this claim?" is a useful prompt. "Your belief score is 43" is not.

The product goal is **self-directed inquiry, not AI-directed classification**. The Belief Engine is a tool the user uses to map themselves. It should never map them and then show others the map.

---

## C. What Belief Engine Must NOT Become

These are disqualifying patterns — not edge cases to be careful about, but failure modes that would make the product harmful.

1. **Personality horoscope.** "You are a Type 4 Evidential Pragmatist." Labels that sound specific and definitive but are generated from a questionnaire are personality test theater, not insight.
2. **Ideology sorter.** The questionnaire collects politically and religiously sensitive data (positions on hierarchy, free will, authority, community vs individual, supernatural). Displaying users' "ideological alignment" publicly is a labeling system disguised as self-knowledge.
3. **Purity test.** A version of the Belief Engine that tells you how "rational," "evidence-based," "critical," or "open-minded" you are relative to other users is a purity test. It ranks epistemic virtue. HumanX must not do this.
4. **"Smart/stupid" label.** Dimensions like EVID (Evidence reliance), RIGD (Rigidity), OPEN (Revision Openness) can all be misread as intelligence proxies. "High rigidity, low openness, low evidence score" reads as "closed-minded and not very smart." This is a real risk with the current dimension set.
5. **Truth authority.** The Belief Engine should never imply that it knows which beliefs are true and which are false. The contradiction detection identifies internal tensions — not factual errors.
6. **Belief loyalty badge.** A system that rewards "consistent" believers, "high-growth" believers, or "evidence-aligned" believers is a gamified loyalty system. No badges, streaks, or rewards for belief behavior.
7. **Public shame profile.** Making `dominant_pattern`, `top_beliefs_json`, `stability_score`, `openness_score`, or `pressure_score` visible to other users without explicit per-field consent is involuntary public labeling of ideological and religious identity.
8. **Gamified certainty machine.** Scores that go up when you take more quizzes or show more "consistency" turn self-reflection into points farming. The Drift view is particularly vulnerable to this: "your stability score grew by 12 this month" can be read as a reward.

---

## D. Safe Belief Dimensions

These dimensions describe patterns of inquiry behavior, not character or worth. They are safe because they describe *how someone engages* with beliefs, not *what beliefs are good to have* or *who the person is*.

| Dimension | What it shows | Why it's safe |
|-----------|--------------|---------------|
| Confidence drift | How certain they feel about a belief over time | Describes change, not quality |
| Openness to pressure | Whether encountering counterevidence changes their position | Describes response, not virtue |
| Source diversity | Mix of source types they submit (news, academic, personal experience, etc.) | Behavioral pattern, not judgment |
| Evidence strength preference | Whether they tend to submit "strong" or "moderate" evidence | Behavioral observation |
| Claim category interests | Which claim domains they engage with (science, religion, politics, etc.) | Interest map, not identity |
| Support/challenge balance | Ratio of evidence submitted vs pressure submitted | Investigation style, not correctness |
| Test-seeking tendency | How often they add test proposals vs passive voting | Engagement style |
| Uncertainty tolerance | How they respond to ambiguous or unresolved claims | Pattern observation |
| Belief stability over time | Whether their votes and snapshots stay consistent | Temporal pattern, not score |
| Contradiction frequency | How many internal tensions their answers reveal | Reflection prompt, not indictment |

All of these can be shown privately. Most should NOT be shown publicly without explicit per-field user consent.

---

## E. Unsafe Belief Dimensions

These dimensions — if surfaced to users or the public in their raw form — either label personal worth, reveal sensitive identity data, or invite misreading as intelligence/virtue metrics.

| Dimension / Field | Why it's unsafe |
|-------------------|----------------|
| Intelligence score (any form) | Not what the engine measures; EVID/OPEN easily read as proxies |
| Truthfulness score | Would rank users by how "true" their beliefs are — that's the verdict machine |
| Moral purity score | Aggregating moral philosophy answers into a "goodness" number |
| Ideology score / political label | Categorizing users by ideology based on their questionnaire answers |
| Religious correctness | Any framing that implies one religion or secular position is more correct |
| Conspiracy score | Marking specific belief systems as conspiratorial without clear epistemological grounding |
| Trustworthiness score | Combining belief pattern data with social trust — implies others shouldn't trust you |
| "Good believer / bad believer" | Any gamification that rewards "right" belief patterns |
| Public ranking by belief type | Leaderboards or comparisons of whose belief structure is more "evidence-aligned" |
| `top_beliefs_json` on public profile without per-entry consent | Contains specific religious and ideological alignment names |
| `dominant_pattern` on public profile | Can be a religious or ideological label generated from the user's profile |
| `TRIB` (Tribal Load) shown publicly | Could be read as "this person is tribally dependent" — shaming |
| `FUSE` (Identity Fusion) shown publicly | "This person's identity is fused with their beliefs" — stigmatizing |
| `PAIN` (Pain Architecture) shown publicly | Reveals trauma-organized belief structure — deeply private |
| `RIGD` (Rigidity) shown publicly | Reads as "how stubborn is this person" — character judgment |
| "Identity Fragmentation" label | Pathologizing language for what is actually belief-origin diversity |
| "Belief DNA" label | False biological determinism framing |

---

## F. Integration Points

Where the Belief Engine could responsibly connect to the rest of HumanX, and what guardrails each integration requires.

### F1. My HumanX → Belief Mirror (already exists, needs guardrail refinement)

**Current state:** Shows `dominant_pattern` as a text label, numeric scores, drift deltas.

**Safe additions:**
- Source type pattern: "Most of the evidence you've submitted is Personal Experience (68%). Academic sources: 12%. News: 20%." — pulls from evidence source_type, already available.
- Evidence strength pattern: "67% of your submitted evidence is rated 'moderate'." — pulls from evidence_strength.
- Engagement pattern: "You've engaged mostly with Political claims (40%) and Scientific consensus claims (30%)." — pulls from claim category.
- Support/challenge balance: "You've submitted 18 evidence items and 4 pressure points. Your investigation tends toward supporting rather than challenging." — behavioral observation.

**Guardrail needed:** All Mirror content must be framed as "here is what you've done" (behavioral), not "here is what you are" (identity).

### F2. My HumanX → Snapshot list (exists, numeric display needs softening)

**Current state:** "stability 73 · openness 45 · pressure 62" shown as bare numbers.

**Risk:** Numbers feel authoritative. 73/100 on stability invites comparison and ranking.

**Safer approach:** Describe what the scores mean in context rather than displaying the raw number. Or use bands ("relatively stable," "in flux") rather than precise numbers.

### F3. Public Profile → Shared snapshot (exists, highest risk surface)

**Current state:** Owner can elect to share one snapshot. Public profile returns `dominant_pattern`, `stability_score`, `openness_score`, `pressure_score`, `top_beliefs_json`, `contradiction_count`.

**Risk:** `top_beliefs_json` contains named ideology and religion alignments. `dominant_pattern` is generated from these. Showing these publicly is ideological labeling.

**Safer approach:** If a snapshot is shared publicly, only show: label (owner-written name for the snapshot), contradiction_count, and one optional owner-written summary sentence. Never show `dominant_pattern`, `top_beliefs_json`, or numeric scores publicly without per-field opt-in.

**This is the highest-risk integration that already exists and needs a fix.**

### F4. Study view → Belief Engine CTA (does not exist yet)

After a user completes a Study session on a claim, a small CTA could say: "Notice a belief shift? Use the Belief Engine to explore it." — links to the Belief Engine.

**Safe:** Suggestion only, no data sharing, no automatic belief recording.

**Guardrail needed:** Do not auto-log that the user studied a claim. Do not pre-fill any Belief Engine answers from Study behavior.

### F5. Study → Drift (does not exist yet)

A "Did this claim change your view?" micro-prompt at the bottom of Study view. User optionally marks: "Still believe," "Less certain," "More certain," "Changed my view." This is stored as a personal drift marker, private by default.

**Safe:** Opt-in, per-claim, private by default, framed as personal note not as social signal.

**Unsafe version to avoid:** Showing aggregate "X% of users changed their view on this claim" — that is a truth score dressed as engagement data.

### F6. Source type and evidence strength → Belief Mirror (does not exist yet)

The most natural safe connection: a user's evidence submission patterns (source_type, evidence_strength from D-203B) summarized in their Belief Mirror as investigation habits.

**Safe:** Describes what the user has submitted. No scoring against others. No "ideal" source mix implied.

### F7. RunPack export → Belief context note (does not exist yet)

When a user exports a RunPack (AI-formatted evidence packet), include a brief optional reflection line: "This packet was built by a user who has noted uncertainty about X." — user-authored, opt-in, not auto-generated from Belief Engine scores.

**Safe if:** User writes it themselves. Not if it's auto-populated from their `dominant_pattern` or scores.

### F8. Avatar / show-off layer (future, guarded)

See Section G.

---

## G. Avatar / Show-off Layer Guardrails

An avatar or visual identity card could show investigation style and inquiry habits in a way that feels playful and personal without exposing belief content or identity labels.

**The avatar CAN show:**

- Exploration style: "Broad investigator" (engages many claim categories) vs "Specialist" (focuses on one domain)
- Question style: whether the user tends to ask "what is the evidence?" vs "who said this?" vs "what would change this view?"
- Investigation habits: ratio of evidence to pressure to tests submitted
- Uncertainty posture: whether the user frequently marks "Unsure" on votes or tends toward confident positions
- Source mix style: "Primarily uses news sources," "Prefers academic sources" — shown as an investigation pattern, not a quality score
- Claim domain interests: visual map of which claim categories the user engages with most

**The avatar MUST NOT show:**

- Intelligence or epistemic virtue score
- Moral worth or "how good a believer" they are
- Ideological tribe: "You are most aligned with Scientific Materialism" is an ideology badge
- "Truth level": any composite that implies the user's beliefs are more or less true than others'
- Religious correctness: which religion or spiritual stance is more evidence-based
- Political alignment, unless the user has explicitly self-labeled ("I call myself a libertarian")
- Gamified certainty: levels, badges, streaks based on consistency of belief

**The avatar should feel like:** A description of *how* someone investigates, not *what* they believe or *how right* they are.

**Visual language guardrail:** No green "truth" color on belief metrics. No trophies, crowns, or winner language. No ranking against other users.

---

## H. Recommended First Safe Feature for D-208B

**Recommended: Option 2 — Belief Engine landing copy rewrite + guardrail note on My HumanX Belief Mirror**

**Why this over the others:**

- **Option 1 (My HumanX "Belief reflection" card)** requires frontend code to add a new surface. Worth doing but higher risk of getting framing wrong on first pass.
- **Option 2 (Belief Engine landing copy rewrite)** is docs-adjacent work: rewrite the landing copy to remove "Belief DNA" and "Identity Fragmentation" labels, add the guardrail sentence to the results screen, and add a note about what the scores do not mean. No database changes. No new features. Purely safety work.
- **Option 3 (Study → Belief Engine CTA)** is a code change. Low risk but adds a new user path without having fixed the underlying framing problems first.
- **Option 4 (Public profile belief caveat copy)** is urgently needed but requires touching both the public profile render logic and the copy — medium scope.
- **Option 5 (Local-only belief snapshot explainer)** is useful but doesn't address the framing problems that already exist in the live app.

**The right first move is to fix the existing framing problems before adding new surfaces:**

1. Remove "Belief DNA" → replace with "Belief Profile" or "Belief Snapshot"
2. Remove "Identity Fragmentation" → replace with "Belief Origin Mix" or "Source of beliefs"
3. Add the D-208A guardrail sentence to the Belief Engine results screen: "Belief patterns describe how you interact with claims. They are not a score of intelligence, morality, or truth."
4. Soften `dominant_pattern` display in My HumanX Belief Mirror — add a qualifier: "Your current pattern (from your most recent snapshot)"
5. Add a note to the public profile shared snapshot warning: "Only share what you want others to see. Belief data describes your patterns, not a score of character or correctness."

**Scope:** All in `public/apps/humanx-belief-engine/index.html` and one section of `app-v10.js`. No backend changes. No migrations. No new routes.

---

## I. Data Requirements for D-208B

### Already exists

| Data | Where | Used for |
|------|-------|---------|
| Belief snapshots | `belief_snapshots` table | Mirror, Drift, public profile sharing |
| `dominant_pattern` | belief_snapshots | Mirror latest card |
| `stability_score`, `openness_score`, `pressure_score` | belief_snapshots | Mirror meters and drift card |
| `top_beliefs_json` | belief_snapshots | Public profile (currently — needs restriction) |
| `contradictions_json` | belief_snapshots | Mirror tensions card |
| Evidence source_type | evidence table | Available but not in Mirror yet |
| Evidence strength | evidence table | Available but not in Mirror yet |

### Backend needed for D-208B?

**No.** D-208B is a copy/framing fix. No new routes, no schema changes, no migrations. The data already exists; what changes is how it is labeled and described.

### Frontend-only enough?

**Yes.** `public/apps/humanx-belief-engine/index.html` contains all the label strings for "Belief DNA" and "Identity Fragmentation." The Mirror guardrail note can be added to `meMirrorGuardrailHtml()` in `app-v10.js`. No backend changes required for the copy work.

### Privacy risk

**Current active risk:** `top_beliefs_json` on public profile can expose specific religious/ideological alignment names. This is an existing live risk — it should be addressed in D-208B or immediately after, even if it requires a small backend change to filter what is returned by `getPublicProfile`.

**Resolved by D-208B if:** The `getPublicProfile` endpoint is updated to exclude `top_beliefs_json` from the public response, or if the frontend render of the public profile is updated to not display named alignment entries.

**No new privacy risk is introduced by D-208B** as long as D-208B stays within copy fixes and does not add new data sharing.

### Public profile exposure safety

**Currently not safe** for `top_beliefs_json` and `dominant_pattern`. Needs filtering or explicit per-field opt-in. "I agree to show my belief alignment labels on my public profile" is a different consent level than "I agree to make my profile public."

---

## J. Guardrail Copy

The following copy should appear in the Belief Engine results screen (and optionally in My HumanX Belief Mirror):

> Belief patterns describe how you interact with claims. They are not a score of intelligence, morality, or truth.

Additional copy for My HumanX Belief Mirror:

> Your Mirror shows patterns from your Belief Engine snapshots and HumanX activity. It describes investigation habits, not character. These are a starting point for self-reflection, not a verdict.

For the public profile shared snapshot context (if a user shares):

> This is a snapshot this user chose to share. Belief patterns describe how someone engages with claims — not a score of character, correctness, or intelligence.

For the My HumanX snapshot list (next to numeric scores):

> These scores describe the structure of this snapshot — not how right or rational you are. Higher openness is not better. Higher stability is not worse.

---

## K. Future Roadmap

### D-208B — Belief Engine copy / framing fixes (recommended next, code + docs)
- Remove "Belief DNA" label → "Belief Profile"
- Remove "Identity Fragmentation" label → "Belief Origin Mix"
- Add guardrail sentence to Belief Engine results screen
- Soften `dominant_pattern` display in My HumanX Mirror
- Restrict `top_beliefs_json` from public profile API response (or add render-level filtering)
- Add public profile snapshot caveat
- Scope: `public/apps/humanx-belief-engine/index.html` + `public/app-v10.js` + minimal backend filter if needed

### D-208C — Avatar guardrail spec (docs only)
- Full spec for what an avatar/identity card is allowed to show
- Define visual language: what colors/icons are allowed, which are banned
- Define which behavioral dimensions are avatar-safe
- Map avatar to D-203A three-test gate equivalent for belief surfaces

### D-208D — Belief pattern cards in My HumanX Mirror (code)
- Source type pattern card: "Evidence I've submitted by source type"
- Evidence strength card: "Evidence I've submitted by strength"
- Claim category card: "Claim domains I engage most"
- Support/challenge balance card (already partially exists — refine)
- Each card labeled as "investigation habit" not "belief trait"

### D-208E — Public / private visibility rules (docs + backend)
- Per-field consent for what shows on public profile
- "Show my investigation habits publicly" (safe) vs "Show my belief alignment publicly" (requires separate consent)
- Restrict `dominant_pattern` and `top_beliefs_json` from public API unless user explicitly opts in per field
- Add review-before-public flow for any new belief surface

### D-208F — Optional avatar prototype (design + code, later)
- After D-208C spec is approved and D-208D cards are live
- Avatar shows investigation style only — no belief content
- User customizes what the avatar shows (opt-in per dimension)
- No public leaderboard. No ranking against other users.

---

## Summary of Biggest Risks

| Risk | Severity | Current state | Fix needed |
|------|----------|--------------|------------|
| `top_beliefs_json` on public profile contains named religious/ideological labels | **Critical** | Live — any shared snapshot exposes this | Restrict from public API response |
| `dominant_pattern` on public profile can be an ideological label | **High** | Live | Restrict or add explicit per-field opt-in |
| "Belief DNA" label implies genetic determinism | **Medium** | Live in Belief Engine | Copy fix in index.html |
| "Identity Fragmentation" label pathologizes multi-source beliefs | **Medium** | Live in Belief Engine | Copy fix in index.html |
| Numeric scores (stability/openness/pressure) in snapshot list feel authoritative | **Medium** | Live in My HumanX | Add clarifying copy or use bands instead of numbers |
| TRIB/FUSE/PAIN dimensions could be used to publicly label users | **High** | Stored in `dimensions_json` — not currently public | Ensure dimensions_json is never returned in public API |
| Drift deltas could be gamified (score rising/falling as reward) | **Low** | Private-only currently | Keep drift private; add guardrail copy |
| Study → Belief connection could log belief changes without consent | **Medium** | Does not exist yet | Design opt-in only when this is built |

---

## Files Inspected

| File | Purpose |
|------|---------|
| `public/apps/humanx-belief-engine/index.html` | Standalone Belief Engine app — questionnaire, results, send-to-HumanX flow |
| `src/worker.js` | Backend routes: /api/belief-snapshots, /api/belief-promote, /api/my-humanx, getPublicProfile |
| `src/belief-snapshots.js` | saveBeliefSnapshot, listBeliefSnapshots — snapshot storage and retrieval |
| `src/belief-bridge.js` | promoteBeliefSnapshot — converts snapshot belief to public Truth |
| `public/app-v10.js` | My HumanX Belief Mirror, Drift view, snapshot list, public profile render |
