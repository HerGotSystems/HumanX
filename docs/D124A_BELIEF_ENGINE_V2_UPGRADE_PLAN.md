# D-124A — Belief Engine V2 Upgrade Plan

**Date:** 2026-06-13  
**Mode:** DOCS ONLY — no code changes, no deploy, no Wrangler, no D1, no production query, no admin token, no live writes, no browser testing.

> Purpose: Design the next version of the Belief Engine before coding begins. This plan is source-grounded — based on a full read of `index.html` (2674 lines), `humanx-bridge.js`, and the D-119A/D plan and audit.

---

## 1. Current State Audit

### 1A — What the current engine does well

The current BE is technically more complete than it first appears. Key strengths:

| Strength | Detail |
|---|---|
| Rich question model | 77 questions across 11 categories including Reality, Truth, Authority, Morality, Spirituality, Society, Death, Self, Belief Origins, Certainty vs Understanding, and Moral Stress Tests |
| Two-layer scoring | 9 core worldview dimensions (DIMS) + 10 forensic/structural dimensions (FORENSIC_DIMS) — structural layer tracks how beliefs are held, not just what they are |
| Contradiction detection | 36 contradiction checks with severity levels (critical / high / moderate / low) and precise natural-language descriptions |
| Identity context screen | Optional worldview selection (breadth: fringe beliefs, occult, pagan, Eastern, Middle Eastern, Abrahamic, non-religious + God count + political + settled/questioning) — creates before/after gap analysis |
| Timeline screen | Optional — 3 scored questions (drift, driver, cost of disconfirmation) + 5 free-text fields on belief change across life stages |
| Moral Stress Tests | Category 10 — choice-format scenarios, not Likert — expose ethical operating system under pressure |
| Run mode selector | Main Profile / Sandbox Test / Anonymous Voice |
| Results dashboard | Radar chart, constellation canvas, profile snapshot, contradiction scan, behavioral profile, forensic meta-scores, origin load, stress readout, share card |
| HumanX bridge | Working `sendBeliefEngineToHumanX()` with pre-click note |
| Visual quality | Typography (Syne + DM Mono + Inter), dark palette, gradient logo — strong aesthetic baseline |

### 1B — What feels thin, boring, or confusing

| Issue | Detail |
|---|---|
| **Dashboard overwhelm** | The result screen is 13+ panels. A first-time user has no clear reading order. There is no guided entry point or summary of what to look at first. |
| **Archetype framing risk** | "Top Archetypes" section lists best-matching philosophical systems (Scientific Materialism, Mysticism, etc.). These are named systems, not personality types — but the presentation can feel like a personality label. |
| **Behavioral Profile section name** | "Behavioral Profile" sounds clinical/predictive. The content is fine; the name is the problem. |
| **Forensic Meta-Scores section name** | "Forensic" is a powerful word. Used correctly here, but sounds like profiling. |
| **Timeline free-text privacy risk** | Fields like "What belief are you afraid might actually be true?" and "What belief would isolate you from people you care about?" produce high-sensitivity text. This text is currently included in `stressPoints` inside the raw snapshot sent to HumanX. |
| **No replayability affordance** | Nothing in the UI invites users to try a different scenario, compare runs, or revisit the engine. The "Retake" button is present but unlabelled as a meaningful action. |
| **Static result — no "what now" bridge** | After completing the result, users have share/download/retake. No connection to: "here are the specific tensions you could investigate as Claims" or "here is what HumanX would let you do with this." |
| **10–12 minute estimate feels heavy** | Given the optional identity and timeline screens, the actual time varies widely. The fixed estimate may make the experience feel longer than it is for some users. |
| **No progress clarity** | The progress bar moves but doesn't say "category 3 of 11" — first-timers may not know how much remains. |
| **Mobile layout** | Results grid degrades to single column but 13 panels in sequence is very long on mobile. |

### 1C — Copy that is safe and must be preserved

From D-119A audit, D-119D, and D-123B rules:

| Copy element | Source | Preserve |
|---|---|---|
| "This is not a test you pass or fail." | D-119C / index.html | ✅ Core framing — do not change |
| "The result is a pressure map, not a label." | D-119C | ✅ Do not change |
| "This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict." | D-119C | ✅ Do not change |
| "No correct answers. No religion assigned. No diagnosis. No score of your worth." | D-119C | ✅ Do not remove |
| "Stored in this browser only. Nothing leaves your device unless you export it." | index.html intro | ✅ Accurate and important — keep |
| "This saves a snapshot to your HumanX session. It does not publish it immediately." | humanx-bridge.js | ✅ Keep and extend |
| "These reflect belief structure — where beliefs came from and how they're held — not what they are." | result panel note | ✅ Correct framing — extend this approach to other panels |

### 1D — Where the UX likely loses users

1. **Identity screen** — long scroll of worldview chips. Many testers will skip entirely. That is by design, but the "skip all of this" banner could be more prominent or the screen could feel more inviting to engage with rather than something to bypass.
2. **Timeline free-text** — high-effort questions. "What belief, if it turned out to be false, would feel like losing yourself?" is a serious question that requires trust and emotional safety. Some users will close the app here.
3. **Results dashboard** — too much too fast. The radar chart, constellation, archetypes, dimensions, forensic scores, meta-grid, behavioral profile, and contradiction scan all appear simultaneously. Without a reading order, this reads as noise.
4. **Send to HumanX** — buried at the bottom of a crowded share panel. First-time users may not find it; returning users may not understand what changes when they send a snapshot.

---

## 2. V2 Product Goal

Design the Belief Engine v2 as:

- **A belief pressure map** — not a personality test, not a diagnosis, not a truth detector
- **A mirror, not a verdict** — the framing established in D-119C is correct and must be the organizing principle of the entire experience
- **A replayable self-investigation** — users should want to return: to try different answers, to see how their map changes after a year, to test a specific belief they are examining
- **A better HumanX entry point** — the result screen should make it obvious how the map connects to Claims, Truths, and Evidence; it should invite engagement with HumanX, not just snapshot storage
- **Safe for teenagers and adults** — no sensitive personal data required; free-text questions should be clearly optional and clearly explained before any of that text is sent anywhere

The V2 goal is not to replace the engine. The question model, scoring system, and contradiction detection are good. The upgrade is in **result presentation, replayability, privacy handling, and HumanX bridge quality**.

---

## 3. Question System Upgrade

### 3A — Current question categories (preserve)

The 11 current categories are well-chosen and cover the required ground:

1. Reality & Existence
2. Truth & Evidence
3. Authority & Order
4. Morality & Ethics
5. Spirituality & Sacred
6. Society & Civilisation
7. Death & Meaning
8. Self & Belief
9. Belief Origins
10. Certainty vs Understanding
11. Moral Stress Tests

**Recommendation:** Keep all 11. The coverage is strong.

### 3B — Additions within existing categories

Some dimensions are underrepresented in the scored questions. Recommend adding up to 7 new questions across categories 1–10 (not Stress Tests) to better capture:

| Gap | Suggested addition | Category |
|---|---|---|
| Change resistance — social cost | "I have changed a significant belief and lost a relationship or social standing because of it." | Self & Belief (cat 7) |
| Contradiction comfort | "I am comfortable holding two beliefs that I cannot fully reconcile." | Certainty vs Understanding (cat 9) |
| Uncertainty comfort | "I find genuine uncertainty more honest than a confident but unexamined answer." | Certainty vs Understanding (cat 9) |
| Emotional trigger | "When a belief I hold is challenged, my emotional response happens before my rational one." | Self & Belief (cat 7) |
| What would change your mind | "For my most important belief, I can clearly state what evidence would cause me to revise it." | Truth & Evidence (cat 1) |
| Social pressure independence | "I have held a public position that I knew most people around me would reject." | Society & Civilisation (cat 5) |
| Origin awareness | "I know where most of my strongest beliefs came from and can name the source." | Belief Origins (cat 8) |

This would bring the total to ~84 questions. That is within the 10–12 minute window.

### 3C — Question styles — keep both

**Likert (–2 to +2):** Works for the majority of questions. Retain.

**Choice format:** Works for Moral Stress Tests. Consider extending the choice format to 2–3 questions in other categories where a scenario reveals more than a stance. Example candidate: a question about what you would do if you found your most trusted source was systematically wrong.

**Do not add:** open text questions to the core quiz flow. Free text should remain in the optional Timeline screen only.

### 3D — Replay / branching option

Introduce a lightweight **"Flip mode"** — a single button visible on the results screen that says: "Run the opposite — answer every question with the inverse of what you chose." This does not change the stored result; it generates a comparison overlay showing which dimensions would shift and by how much. This is computationally trivial (invert the sign of each answer and recalculate) and makes the result immediately interactive.

Longer-term: offer **"Focus mode"** — run only one category (e.g. "just Truth & Evidence") to refresh a single dimension without re-running the full 77 questions.

### 3E — Anti-diagnosis wording

Enforce consistently across all result sections:

| Avoid | Use instead |
|---|---|
| "You are..." | "From these answers, this pattern shows..." |
| "Your type is..." | "Closest alignment with..." |
| "This proves..." | "This suggests a tendency toward..." |
| "This predicts..." | "Under pressure, this pattern often..." |
| "High/low [dimension]" without context | "[Dimension] score: [N] — this reflects..." |

### 3F — How to avoid private/medical/legal/trauma questions in the core quiz

**Rule:** The 77 core questions (Likert + choice) must not ask about:
- Specific traumatic events
- Mental health diagnoses or history
- Medical conditions
- Legal status or history
- Named relationships (family members, partners, etc.)

**The Timeline screen is where depth lives — and it is optional.** If a user skips the Timeline, they never encounter the high-sensitivity questions. This design is correct and must be preserved.

**V2 addition:** Before the Timeline screen, add a single clear line: "These questions ask about personal change over time. They are optional and go no further than your browser unless you choose to send a snapshot to HumanX."

---

## 4. Result Screen Upgrade

### 4A — The core problem

The current result is a flat dashboard — all 13 panels visible at once, no guided reading order. V2 should have a **primary summary view** and **expandable detail layers**.

### 4B — Primary summary view (always visible, mobile-friendly)

These three panels should render above the fold on all devices:

**1. Pressure Map** (renamed from "Worldview Radar")
- Keep the radar canvas — it is visually distinctive
- Add a one-sentence plain-English summary beneath: "Your pattern shows high [dimension] and low [dimension] — [one line of what that typically means in belief structure terms, not behaviour prediction]."
- Rename: "Pressure Map" or "Belief Structure Map"

**2. Certainty Shape** (renamed from "Core Dimensions" bar chart)
- Condense to the 5 highest-variance dimensions for the summary view
- Full 9-dim view available via expand
- Add per-dimension one-line descriptions anchored to the non-diagnostic framing (currently present in `DIMS` data — surface it in the UI)

**3. What to test next** (new — HumanX bridge panel)
- Not a share panel — an action panel
- Shows 2–3 contradictions most relevant to the user's score pattern
- Shows a suggested "Claim you could pressure-test" derived from the highest-scoring contradiction
- Direct link to HumanX Submit and Browse Claims

### 4C — Secondary panels (collapsible or tabbed, not all open by default)

| Panel | Current name | V2 name | Change |
|---|---|---|---|
| Identity Attachment | "Psychological Dimensions" forensic bars | "Identity Attachment" | Rename; surface FUSE, TRIB, DOGM, INHR as the key four with plain descriptions |
| Change Gates | currently distributed across forensic + contradiction | "Change Gates" (new) | Consolidate OPEN, HUMI, RIGD into a single panel: "What would it take for these beliefs to change?" |
| Contradiction Response | "Contradiction Scan" | "Contradiction Response" | Rename; sort by severity; add one-line "what this means for belief revision" per contradiction |
| Social Pressure Response | currently inside "Behavioral Profile" | "Social Pressure Response" | Extract from behavioral profile; focus on TRIB, COLL, and Moral Stress Test responses |
| Belief Origin Load | "Belief Origin Load" | Keep name | Solid framing — keep |
| Forensic Snapshot | "Forensic Meta-Scores" | "Structural Snapshot" | Rename to reduce clinical tone |
| HumanX Bridge Summary | currently bottom of share panel | Move to its own section | See section 6 |

### 4D — Things to remove or restructure

| Item | Recommendation |
|---|---|
| "Behavioral Profile" as a section title | Rename to "Under Pressure" or "Pressure Responses" — same data, less clinical |
| "Forensic Meta-Scores" as a section title | Rename to "Structural Snapshot" |
| "Top Archetypes" as a section title | Rename to "Closest Alignments" — already closer to what the data represents (similarity scores against known systems, not assigned types) |
| 13-panel flat grid | Move to: 3 primary panels always visible + secondary panels behind expand/tab |
| Share canvas as primary CTA | Demote — it is a nice-to-have; HumanX bridge should be equally prominent |

### 4E — Copy guard for new section titles

Proposed V2 section titles — all pass the anti-diagnosis check:

- Pressure Map ✓
- Certainty Shape ✓
- Identity Attachment ✓
- Change Gates ✓
- Contradiction Response ✓
- Social Pressure Response ✓
- Belief Origin Load ✓
- Structural Snapshot ✓
- Closest Alignments ✓
- Under Pressure ✓
- What to Test Next ✓
- HumanX Bridge ✓

---

## 5. Replayability / Game Layer

### 5A — Run modes (already exists — improve presentation)

Current modes exist in identity screen: Main Profile / Sandbox Test / Anonymous Voice. These are good. V2 should surface them more clearly in the result screen ("You ran this as Sandbox — this result does not overwrite your main profile") and make mode-switching feel like a deliberate choice rather than a buried setting.

### 5B — "Try the opposite" mode

See 3D above. Computationally trivial. High engagement value. Implement as a button in the result screen that generates an overlay: "If you had answered the opposite on every question, this is how your map would shift." This makes the user immediately understand which parts of their map are load-bearing vs which are loose.

### 5C — Comparison between runs

If a user has a previous result in localStorage, show a diff overlay: "Since last time: OPEN +12, FUSE –8, DOGM –5." This is already implicitly supported by the existing-result button (`id="existing-btn"`). V2 should make this comparison explicit and visually clear.

### 5D — Drift over time

Stored snapshots in HumanX show in the Drift tab. V2 should make this connection explicit from the result screen: "Send this snapshot to see how your map changes over time in HumanX Drift." This converts "Send to HumanX" from an obscure save action into a meaningful longitudinal tracking feature.

### 5E — Unlockable insight cards

After completing the full run, surface 3–5 "insight cards" derived from the specific combination of high-variance dimensions. These are not diagnoses — they are framed as questions to investigate:

Example: "Your FUSE score is high and your OPEN score is low. That means: a belief that would survive evidence may still feel impossible to update because of what it would cost socially. What belief fits that description?"

These are observation prompts, not labels. They invite self-investigation.

### 5F — Safe challenge cards

A separate mode: "Challenge Cards" — a short (10-question) run that does not score dimensions but presents the user's own highest-contradiction pair and asks them to argue both sides. This is not a separate product — it is a mode within the Belief Engine, accessible from the result screen.

### 5G — Optional educational layer

After the result, offer a one-tap expand per dimension with: "What [dimension] means in belief structure terms — not what it says about you." This is the `desc` field already present in the `DIMS` and `FORENSIC_DIMS` arrays — surface it in the UI without requiring users to find it.

---

## 6. HumanX Bridge Upgrade

### 6A — Current state

The bridge (`humanx-bridge.js`) injects a "Send to HumanX" button into `.results-actions` via a MutationObserver. The pre-click note says: "This saves a snapshot to your HumanX session. It does not publish it immediately. Turning it into a Truth or Claim enters Review before becoming visible to others."

This is technically correct but:
- It is injected late and buried at the bottom of a crowded share panel
- The note appears after the button renders, not before (note is inserted before the button in the DOM via `insertBefore(note, btn)` — actually this is correct but worth verifying visually)
- The success alert text is terse and does not explain what to do next

### 6B — Pre-click warning improvements

Replace the current brief note with a structured pre-click block:

```
What gets saved:
  ✓ Your dimension scores
  ✓ Your contradiction pattern
  ✓ Your top alignments
  ✓ Your run mode (main / sandbox / anonymous)

What does NOT get saved (unless you include it):
  — Free-text timeline responses (only summary scores from scored questions are included)
  — Your worldview identity selections (optional; can be excluded)

What happens next:
  ✓ Snapshot stored in your pseudonymous HumanX session
  ✓ Visible to you in the Drift tab
  ✗ Not published automatically
  ✗ Not entered into Review unless you explicitly create a Truth or Claim from it
```

Note on free-text: currently `stressPoints` in the snapshot includes raw timeline text. See section 7D for the payload change needed.

### 6C — What snapshot becomes in HumanX

Add a brief explanation on the result screen (not just pre-click):

"Sending this snapshot to HumanX saves a structural record of this run. It appears in your Drift tab. You can later choose to turn a specific belief pattern into a Truth (a statement you record as something you or others repeat as true) or a Claim (a testable public statement). Both require passing through Review before they are visible to other users."

### 6D — Review explanation

Add one sentence clarifying what Review means: "Review is a moderation step — the operator reads your submission before it becomes visible to others. It is not automatic approval."

### 6E — Privacy-safe bridge

The bridge should offer a toggle before sending: "Include timeline responses in snapshot? (Not recommended for sensitive content.)" Default: off. The toggle makes the choice visible and explicit.

---

## 7. Data / Payload Design

### 7A — Current snapshot shape

The current payload (from `buildHumanXBeliefSnapshot()`) includes:

```javascript
{
  label, engineVersion, source, dominantPattern, summary,
  beliefCount, contradictionCount, stabilityScore, opennessScore, pressureScore,
  dimensions: scores,       // 19 dimension scores — fine
  topBeliefs: topAlignments.slice(0,7),  // 7 alignment names + similarity + desc — fine
  contradictions: contradictionTexts,    // all contradiction title+desc strings — fine
  stressPoints: [
    "Afraid might be true: [raw user text]",   // ⚠ sensitive
    "Would isolate you: [raw user text]",       // ⚠ sensitive
    "Would break identity: [raw user text]",   // ⚠ sensitive
    ...meta.stress items                        // may include stress test choices — ok
  ],
  raw: {
    scores, alignments, contradictions, timeline,  // timeline includes raw text ⚠
    identity, answers, profileMode, metaReport, exportedAt
  }
}
```

### 7B — V2 payload — recommended changes

**Remove from default payload:**
- Raw timeline free-text from `stressPoints` (the three personal questions)
- `raw.timeline` — raw timeline text fields

**Keep:**
- `raw.scores`, `raw.alignments`, `raw.contradictions`
- `raw.answers` (Likert + choice values only, no text)
- `raw.identity` (worldview selections — chip labels only, no text)
- `raw.profileMode`
- Timeline scored question responses (`TL_DRIFT`, `TL_DRIVER`, `TL_COST` as choice indices, not text)

**Add:**
- `engineVersion: 'humanx-belief-engine-v2.0'`
- `includesTimeline: boolean` — flag for whether scored timeline questions are included
- `runMode: string` — surface at top level for easier filtering in Drift

**Result:** default payload of ~8–12 KB for most users, well within the 64 KB cap. Raw text option opt-in only.

### 7C — 64 KB cap

The cap is already enforced server-side (`MAX_SNAPSHOT_BYTES = 65536`). No change needed. The V2 payload will be smaller by default.

### 7D — Versioning

Add `engineVersion: 'humanx-belief-engine-v2.0'` to distinguish from v1 snapshots in the Drift display. No schema migration needed — the existing `engine_version` column already accepts arbitrary strings.

### 7E — Migration recommendation

**No migration.** V1 snapshots remain valid. V2 snapshots have the same top-level structure with new `engineVersion` value. The Drift display should handle both by checking `engineVersion` string if needed.

---

## 8. UI Upgrade Plan

### 8A — First screen

**Keep:** Belief Engine title, intro sub, hook line, stat bar, begin button, note.

**Add/change:**
- Surfacing the "existing result" button more prominently — currently hidden via `.hidden` class until localStorage check; make it a soft visual state rather than hidden-then-shown pop-in
- Time estimate: change from static "~10–12 minutes" to "~8–15 minutes depending on how far you go — all sections are skippable"
- Add a one-line "What you'll get" below the sub: "A pressure map of how this belief is structured — not a diagnosis, not a score of your worth."

### 8B — Question flow

**Keep:** category header, progress bar, question cards, response buttons, back/next navigation.

**Add:**
- Category progress: "Category 3 of 11" visible in `cat-num` (already has this element — verify it is populated)
- Skip category button: allow the user to skip an entire category if they want. This reduces the barrier to starting and increases completion rate.
- Estimated time remaining: rough decrement shown after category 3+.

### 8C — Progress indicator

Current: fills from left as categories complete. Fine.

V2: add category name dots above the bar (11 dots, current one highlighted). On mobile, show only the current label. This gives the user orientation without clutter.

### 8D — Result screen restructure

**Layer 1 (always visible — summary view):**
- Pressure Map (radar) + one-line description
- Top 3 Contradictions with severity
- "What to test next" panel with HumanX action links

**Layer 2 (expand/tabs — detail):**
- Certainty Shape (full dim bars)
- Identity Attachment (forensic FUSE/TRIB/DOGM/INHR)
- Change Gates (OPEN/HUMI/RIGD)
- Closest Alignments (current archetypes)
- Contradiction Response (full list)
- Social Pressure Response
- Belief Origin Load
- Structural Snapshot (meta-grid)
- Under Pressure (behavioral)

**Layer 3 (share/export):**
- Share card canvas
- Download PNG
- Copy summary
- Send to HumanX (elevated to its own clearly-labelled section, not buried)
- Retake

### 8E — Mobile-first constraints

- Layer 1 must fit one screen (max ~600px tall)
- No horizontal scroll
- Radar canvas: reduce to 280×280 on mobile (currently 360×360)
- Constellation canvas: optional on mobile (collapse by default)
- Layer 2 panels: one column, each collapsible

### 8F — Visual language

- Dark palette, Syne headings, DM Mono data — keep
- Introduce section-level color accents (purple for structural, blue for evidence-related, red for contradiction, green for openness) to help users navigate sections visually
- The gradient title treatment is strong — keep

---

## 9. Implementation Slices

The question model and scoring engine do not need changes until the question additions (3B). Prioritise result screen and bridge over question additions.

### Recommended sequence

| Task | Scope | Risk | Files |
|---|---|---|---|
| **D-124B** | Result screen rename + section restructure (HTML/CSS only, no JS scoring change) | Low | `index.html` |
| **D-124C** | Bridge privacy fix: remove raw timeline text from default payload; add opt-in toggle | Medium | `humanx-bridge.js`, `index.html` (button area) |
| **D-124D** | Question additions (up to 7 new Likert questions across existing categories) + scoring update | Medium | `index.html` (QUESTIONS array + scoring logic) |
| **D-124E** | "Flip mode" / opposite-answer comparison (new JS, no backend) | Low-medium | `index.html` (new JS function + UI) |
| **D-124F** | "What to test next" panel: contradiction-to-Claim bridge + HumanX links | Medium | `index.html`, possible `humanx-bridge.js` |
| **D-124G** | Mobile layout improvements (CSS) + progress dots | Low | `index.html` (CSS block) |
| **D-124H** | Static checks + full smoke | None | `scripts/` |

**Alternative if time is limited:** D-124B + D-124C are the minimum valuable upgrade. D-124B improves result comprehension immediately; D-124C fixes the privacy issue with raw timeline text in the snapshot payload.

---

## 10. Safety Boundaries

These are absolute constraints for V2. They do not change from V1.

| Constraint | Rule |
|---|---|
| Not a diagnosis | No language implying medical, psychological, or clinical assessment |
| Not a truth verdict | No language implying HumanX has verified what is correct |
| Not a psychological profile | No language implying this is a qualified professional assessment |
| No sensitive personal-data requests | No questions asking for name, medical history, legal status, trauma detail, mental health history — core quiz only |
| No private medical/legal/financial advice | The engine does not give advice — it maps structure |
| No scoring of worth/intelligence | No dimension or score should be framed as measuring personal quality or capability |
| No automatic publishing | Sending a snapshot to HumanX does not make it public — Review step always required |
| Free-text = optional + local | Timeline free-text stays local unless user explicitly opts in |
| Anti-diagnosis wording audit | Before any D-124 branch merges, grep for "diagnos", "predict", "proven", "verified", "you are", "your type" — none should appear in new result copy |

---

## 11. Acceptance Criteria

V2 is considered ready when all of the following are true:

**Functional:**
- [ ] All 5 static checks pass: `node --check` on worker.js + app-v10.js, hardening smoke, worker-route-static, belief-engine-static
- [ ] Belief Engine loads at `https://humanx.rinkimirikata.com/apps/humanx-belief-engine/`
- [ ] Full run completes without JS error in console
- [ ] Scoring produces non-null results for all 19 dimensions
- [ ] Contradiction detection produces at least 1 result for a test run with maximally contrarian answers
- [ ] "Send to HumanX" sends a valid snapshot and returns `ok: true` (no raw free-text in default payload)
- [ ] Payload size under 64 KB for a full run including all optional sections

**Copy / safety:**
- [ ] No occurrence of "diagnos", "predict", "your type", "you are [label]", "proven", "verified by HumanX" in result screen copy
- [ ] Pre-click note for Send to HumanX clearly states what is and is not included in snapshot
- [ ] Timeline screen has explicit "these responses stay local unless you opt in" notice
- [ ] All new result section titles pass anti-diagnosis check (see section 4E)

**UX:**
- [ ] Primary summary view (Layer 1) visible without scrolling on a 375px-wide mobile screen
- [ ] Category progress visible during quiz (at minimum "Category N of 11")
- [ ] "What to test next" panel links correctly to `https://humanx.rinkimirikata.com/#claims` and `https://humanx.rinkimirikata.com/#submit`
- [ ] "Flip mode" comparison renders without overwriting the stored result

**Privacy:**
- [ ] Default snapshot sent to `/api/belief-snapshots` contains no raw timeline free-text
- [ ] Opt-in toggle for including timeline text is visible before the Send action
- [ ] Raw answers (Likert values only, not text) remain in `raw.answers`

---

## 12. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Result screen restructure breaks existing layout on desktop | Medium | D-124B is HTML/CSS only — test both breakpoints before merging |
| Question additions shift scoring for existing users | Low | New questions are additive; existing question weights unchanged; `engineVersion` field distinguishes runs |
| Bridge privacy fix removes data some users want to save | Low | Opt-in toggle preserves the option; default is safer |
| "Flip mode" JS is complex | Low | Trivially computed — invert sign of each answer value, recalculate dim scores, render overlay diff; no backend change |
| Timeline screen optional-but-sensitive questions | Medium | Already optional; add explicit local-only notice; no code change needed for the notice |
| Mobile layout with 13 panels | High (existing) | D-124G addresses this; primary summary view in D-124B partially addresses it |

---

## 13. Confirmation

> Docs-only plan. No code changes. No deploy. No Wrangler. No D1. No production query. No admin token. No live writes. No browser testing. Doc committed locally only, not pushed.
