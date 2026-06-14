# D-125C — Owner Test Cycle 2: Belief Engine Full-Run Audit

**Date:** 2026-06-14  
**Branch:** fix/d125c-belief-full-run-clarity  
**Auditor:** Static code inspection — `public/apps/humanx-belief-engine/index.html`, `public/apps/humanx-belief-engine/humanx-bridge.js`  
**Mode:** Audit + minimal copy patch. No scoring, question semantics, or bridge payload changes.

**Verdict: PATCHED**

Four copy issues found and fixed. No stop conditions triggered. No layout blockers. No verdict/diagnosis language on the result screen.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Patches Applied

### P1 — Intro note: "HumanX Review" → correct Drift destination

**File:** `index.html` line 425  
**Severity:** Copy error — factually wrong destination

| Before | After |
|---|---|
| "…or later choose to send a snapshot into HumanX Review." | "…or later choose to send a snapshot to HumanX — it will appear in your Drift, not published." |

**Why:** The intro said the snapshot goes "into HumanX Review" — the admin moderation queue. It actually goes into the user's Drift (a private personal feed). Review is the owner's moderation queue for approving public submissions. A user reading the intro would think their snapshot immediately enters an admin review process, which is both wrong and alarming. The corrected text names Drift explicitly and confirms it is not published.

---

### P2 — Identity CTA: "Start the test →" → "Continue →"

**File:** `index.html` line 482  
**Severity:** Copy friction — contradicts intro framing

| Before | After |
|---|---|
| `Start the test →` | `Continue →` |

**Why:** The intro hook reads "This is not a test you pass or fail." The identity screen's CTA said "Start the test →" — directly reintroducing the word the intro explicitly rejects. A user who accepted the "not a test" framing sees "Start the test" as they proceed and either notices the contradiction or quietly re-absorbs the test framing. "Continue →" is neutral and accurate.

---

### P3 — Timeline screen: add local-only note at point of input

**File:** `index.html` — inside `.timeline-intro`  
**Severity:** Privacy gap — users type intimate text with no local-only reminder visible

**Added:**
```
Your written answers stay in this browser only — nothing typed here is sent anywhere, even if you later click "Send to HumanX".
```

**Why:** The intro screen has a local-only note ("Stored in this browser only"). The result screen has a local-only note in the Belief Timeline panel. But the timeline *input* screen — where users type childhood memories, fears, and identity questions — had no such note. A user arriving at the hard questions after 10–15 minutes of quiz flow has long left the intro. The note at the input screen closes the gap between when users write private content and when they see confirmation that it stays local.

---

### P4 — Gap panel: remove "self-knowledge appears accurate"

**File:** `index.html` line 2491  
**Severity:** Copy friction — mild verdict tone

| Before | After |
|---|---|
| "Your declared identity and your actual belief architecture are broadly consistent. Your self-knowledge appears accurate." | "Your declared identity and your scored belief profile broadly align — no major gaps detected." |

**Why:** "Your self-knowledge appears accurate" reads as the tool evaluating the user's cognitive reliability — a soft verdict about the person, not a description of a gap. The replacement describes the same result (no significant divergence between declared identity and scored dimensions) without implying the tool is judging the quality of the user's self-perception.

---

## Audit Results by Area

### Q1 — Intro

**PASS (after P1).**

| Item | Status |
|---|---|
| Privacy note: "Stored in this browser only. Nothing leaves your device unless you export it." | ✓ |
| "This is not a test you pass or fail." | ✓ |
| "No correct answers. No religion assigned. No diagnosis. No score of your worth." | ✓ |
| Snapshot destination: was "HumanX Review" (wrong) → now "your Drift, not published" | PATCHED (P1) |
| "Begin Mapping" CTA — clear, no test/score framing | ✓ |
| View previous results block with local-data note | ✓ (D-124E/G) |
| Clear button — visually distinct, accessible | ✓ |

---

### Q2 — Identity step

**PASS (after P2).**

| Item | Status |
|---|---|
| Skip banner: "Everything here is optional. None of it is required." | ✓ |
| "Skip all of this →" — prominent, styled as a primary action | ✓ |
| No diagnosis or verdict framing in any section label | ✓ |
| Worldview chips — factual descriptions, no judgment of choices | ✓ |
| God Question — framed as a neutral count question with skip option | ✓ |
| Political leaning — "or skip entirely" in label | ✓ |
| Run mode picker — clearly explains what each mode saves | ✓ |
| CTA: was "Start the test →" (contradicts intro) → now "Continue →" | PATCHED (P2) |

**Note:** The worldview descriptions for fringe options (Flat Earth, conspiracy spirituality, etc.) are written in a blunt, analytical tone that accurately describes each belief from an outside perspective. Some holders of these views may read the descriptions as dismissive. This is an intentional voice choice, not a copy error — the descriptions are factually grounded and not mocking. Not patching.

---

### Q3 — Quiz flow

**PASS.**

| Item | Status |
|---|---|
| Progress bar visible at top of quiz | ✓ |
| Category number + title + description shown per category | ✓ |
| Answer count (`N/M answered`) shown in nav bar | ✓ |
| Back / Next navigation — clearly labelled, scroll-to-top on navigate | ✓ |
| Back from category 0 returns to identity screen | ✓ |
| Final category Next → timeline screen | ✓ |
| No "correct answer" framing in any question or label | ✓ |
| Likert response labels: Strongly Disagree → Strongly Agree | ✓ |
| Mobile tap targets: `resp-btn` and `choice-btn` are block-level, reasonable tap size | ✓ (no small inline targets found) |

---

### Q4 — Timeline step

**PASS (after P3).**

| Item | Status |
|---|---|
| Skip banner: "Optional. Skip any question or all of it." | ✓ |
| Skip button → `skipTimeline()` → proceeds to results without collecting data | ✓ |
| Scored questions (TL_DRIFT, TL_DRIVER, TL_COST) are choice-based, not free-text | ✓ |
| Free-text fields: childhood, teen, adult, biggest shift, fear, isolate, identity | all optional |
| Local-only note at point of input: absent → added | PATCHED (P3) |
| "The hard questions" subsection — no additional pressure to answer beyond the top skip banner | ✓ |
| "See Full Report →" CTA — clear, no test/score language | ✓ |

**Note on intimate question framing:** The three hard questions ("What belief are you afraid might actually be true?", "What belief would most isolate you…", "What belief, if false, would feel like losing yourself?") are genuinely personal. The overall skip banner and the new local-only note (P3) together provide sufficient framing that these are optional and private. No further pressure copy is present.

---

### Q5 — Result screen

**PASS.**

| Item | Status |
|---|---|
| Hero framing: "not a diagnosis. Use it as a mirror, not a verdict." | ✓ |
| Contradiction Response accordion: open by default (highest immediate value) | ✓ |
| All other accordions: closed by default | ✓ |
| "What to Test Next" section: "Use this as a starting point, not a verdict." | ✓ |
| Dimension bars — labelled with dimension names, no "good/bad" framing | ✓ |
| Alignment list — shows similarity percentage, not a ranking or verdict | ✓ |
| Belief DNA chips — shows high/low markers without labelling them good or bad | ✓ |
| Contradiction scan — hedged language ("tends to", "correlates with", "appears in") | ✓ |
| Identity Attachment panel note: "These reflect belief structure — where beliefs came from and how they're held — not what they are." | ✓ |
| Mode pill: "counts as real voice" / "excluded from public charts" — factual, not evaluative | ✓ |
| Belief Timeline panel local-data note: "stored in this browser only. Not included in snapshots sent to HumanX." | ✓ (D-124H) |

**Note:** Timeline analysis paragraphs (Belief Drift, Change Driver, Identity Cost, Identity Fusion cost) use clinical analytical language ("Dogmatic architecture. Evidence alone cannot move the position."). These only appear if the user explicitly selected a scored choice; they are not surprise verdicts. Language is intentional voice, not diagnosis. Not patching.

---

### Q6 — Local result controls

**PASS.**

| Item | Status |
|---|---|
| `retake()` / Start Over: clears scores, timeline, answers, storage key, legacy pointer | ✓ (D-124E) |
| `clearSavedResults()`: removes all 6 known BE localStorage keys; hides button immediately | ✓ (D-124E) |
| `getLatestSavedRun()`: picks highest-ts valid record across all 4 single-record keys | ✓ (D-124G) |
| Both `renderIntro()` and `showResults()` use the same helper | ✓ (D-124G) |
| Saved-result note on intro block: "saved in this browser · includes any answers you typed · not synced" | ✓ |

---

### Q7 — Send to HumanX

**PASS.**

| Surface | Content | Status |
|---|---|---|
| Static panel note | "'Send to HumanX' saves a snapshot to your session — it does not publish anything automatically." | ✓ |
| Bridge-injected pre-click note | "Not saved: private timeline text or free-text answers you typed. Nothing is published — the snapshot enters your Drift for your own review only." | ✓ |
| Post-send alert | "It is not published; turning it into a Truth or Claim enters Review before becoming visible to others. Nothing has been proven or verified." | ✓ |
| Bridge payload | `raw.timeline` excluded; only scored `meta.stress` choices included | ✓ (D-124C) |
| `includesTimeline: false` flag in payload | ✓ | ✓ |

No wording implies automatic publication or immediate public visibility.

---

### Q8 — Stop conditions

**None triggered.**

| Stop condition | Status |
|---|---|
| Result reads as diagnosis/proof/verdict | NOT triggered — framing is consistently "map" and "mirror" |
| Send-to-HumanX implies publication | NOT triggered — three-layer note system accurate post-P1 |
| Timeline text implied to be sent | NOT triggered — P3 adds local-only note at input; bridge excludes free-text |
| Mobile layout unusable | NOT triggered — no overflow-causing CSS found; tap targets block-level |
| Review gate failure | Out of scope for this cycle (covered Cycle 5) |

---

## Files Changed

| File | Change |
|---|---|
| `public/apps/humanx-belief-engine/index.html` | P1: intro "HumanX Review" → Drift; P2: identity CTA "Start the test" → "Continue"; P3: timeline local-only note added; P4: gap panel verdict-tone removed |
| `docs/D125C_BELIEF_FULL_RUN_AUDIT.md` | Created (this file) |

---

## Recommended D-125D Scope

**D-125D — Owner test Cycle 3: Drift and saved-results audit**

Simulate P2 (returning desktop, two or more prior full profiles in Drift). Follow Cycle 3 steps from `D125A_OWNER_TESTER_HARDENING_PLAN.md` against the live site. Focus on:

- Full profile vs Quick Belief Record classification — correctly separated in Drift?
- Drift comparison delta rendering — stability/openness/pressure/contradictions shown correctly?
- Comparison framing — does any delta label imply one profile is better or more correct?
- Ghost record / duplication on reload
- Drift empty state — does it navigate cleanly to Belief Engine if no profiles yet?

Owner has already confirmed Drift works from the D-124M smoke (two profiles visible, comparison delta shown). D-125D is the structured code-level audit and graded record.
