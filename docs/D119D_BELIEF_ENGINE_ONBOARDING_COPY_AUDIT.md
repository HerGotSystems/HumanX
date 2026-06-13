# D-119D — Belief Engine Onboarding Copy Audit

**Date:** 2026-06-13  
**Mode:** AUDIT ONLY — no frontend code, no Worker/backend code, no Wrangler, no D1, no production query, no admin token, no deploy, no Belief Engine submission, no Review action, no mutation.

> Purpose: confirm the D-119A copy plan is fully implemented after D-119B and D-119C, and that no trust-wording regression was introduced.

---

## Verdict: PASS WITH NOTES

All 7 BE-COPY checks pass. No copy regressions introduced by D-119B or D-119C. Two pre-existing items noted — neither is a regression and neither requires a fix.

---

## Files Inspected

| File | Role |
|---|---|
| `docs/D119A_BELIEF_ENGINE_PUBLIC_ONBOARDING_PLAN.md` | Source plan |
| `public/app-v10.js` | Main app: helperText, home cards, renderDrift, renderTruths |
| `public/apps/humanx-belief-engine/index.html` | Standalone Belief Engine intro and result screen |
| `public/apps/humanx-belief-engine/humanx-bridge.js` | Send to HumanX button and confirmation |

---

## BE-COPY Check Results

### BE-COPY-1 — Main app Beliefs entry

**Required:** explains optional/private/Review boundary before redirect.

**Found — helperText (belief mode):**
> "Belief Engine maps how a belief works inside you — source, identity load, inheritance, pressure, and what could change your mind. It does not diagnose you and does not decide what is true. Your answers start in your browser; sending to HumanX is optional and enters Review before becoming public."

**Found — home card (Belief Engine):**
> "Map how a belief works inside you before turning it into a public claim. It does not diagnose you and does not decide if you are right. It helps separate personal certainty, inherited ideas, identity pressure, and what could change your mind. Your answers start in your browser; sending anything to HumanX is optional and enters Review before becoming public."

**Result: PASS ✅**

---

### BE-COPY-2 — Belief Engine intro

**Required:** says no pass/fail, no diagnosis, no worth score.

**Found — `index.html` intro screen:**
- `intro-hook`: *"This is not a test you pass or fail."*
- `intro-sub`: *"It maps the structure around a belief: where it came from, how strongly it is tied to identity, what pressure it survives, and what could change it. The result is a pressure map, not a label."*
- `intro-note`: *"No correct answers. No religion assigned. No diagnosis. No score of your worth. ~10–12 minutes. You can use it privately, or later choose to send a snapshot into HumanX Review."*

**Result: PASS ✅**

---

### BE-COPY-3 — Result screen

**Required:** uses snapshot/map/mirror language, not identity-label language.

**Found — `index.html` results hero:**
> `<p class="results-framing">This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict.</p>`

**Result: PASS ✅**

---

### BE-COPY-4 — Send to HumanX

**Required:** explains snapshot save, no immediate publishing, Review boundary before public visibility.

**Found — `humanx-bridge.js` pre-click note (injected above button):**
> "This saves a snapshot to your HumanX session. It does not publish it immediately. Turning it into a Truth or Claim enters Review before becoming visible to others."

**Found — confirmation alert (post-send):**
> "Snapshot saved to HumanX. Open the main app → Drift to see it. It is not published; turning it into a Truth or Claim enters Review before becoming visible to others. Nothing has been proven or verified."

Note: confirmation copy is more detailed than the D-119A plan spec; strictly better — adds navigation guidance and explicit "not published" language alongside the plan's required wording.

**Result: PASS ✅**

---

### BE-COPY-5 — Drift

**Required:** explains change over time, not scoreboard.

**Found — helperText (drift mode):**
> "Drift shows how your saved belief snapshots change over time — a trail, not a scoreboard."

**Found — home card (Drift):**
> "A trail of what you believed and how it changed — not a scoreboard."

**Found — renderDrift empty state:**
> "No belief snapshots yet. Open the Belief Engine, map a belief, then optionally send a snapshot back to HumanX. Saved snapshots can be promoted to a Truth or public Claim — which enters Review before becoming public."

**Result: PASS ✅**

---

### BE-COPY-6 — Truth bridge

**Required:** Truth means repeated assertion, not proven fact; Pressure-test as Claim enters Review first.

**Found — helperText (drift mode, Save as Truth):**
> "Save as Truth — records a statement people repeat as true; it does not mean HumanX has proven it."

**Found — helperText (drift mode, Pressure-test as Claim):**
> "Pressure-test as Claim — turns it into a public, testable statement. Evidence and pressure decide how well it survives, not automatic truth status. Both actions enter Review before going public."

**Found — helperText (truths mode):**
> "HumanX records what is asserted, not whether it is correct. Recording a Truth does not verify it."

**Found — home card (Truths):**
> "A Truth in HumanX records repeated assertion, not proven fact. HumanX does not decide if a Truth is correct."

**Result: PASS ✅**

---

### BE-COPY-7 — Negative wording search

Searched all three files for: `verified`, `proven`, `HumanX decides`, `diagnosis`, `prediction`.

#### "verified"

| Location | Context | Safe? |
|---|---|---|
| `app-v10.js` | "not auto-verified" (Truths list badge) | ✅ negation |
| `app-v10.js` | "not automatically verified" (Truths panel) | ✅ negation |
| `app-v10.js` | `truth-not-verified` badge class, "not verified" label | ✅ negation |
| `index.html` | "Only a verified main profile should count as one real voice in HumanX charts." | ⚠️ see note below |
| `index.html` | "independently unverified" (quiz worldview content — clone claim) | ✅ describes external claim |
| `index.html` | "cannot be independently verified" (quiz question about ancient texts) | ✅ describes quiz scenario |
| `humanx-bridge.js` | "Nothing has been proven or verified." | ✅ negation |

**Note on "verified main profile":** This phrase appears on the identity screen (`mode-note` element). It refers to profile run-mode selection (Main Profile vs Sandbox vs Anonymous) — about whether a run should count toward aggregate public charts. It does not assert that HumanX verifies claims or Truths. Pre-existing phrasing, not introduced by D-119B/C. No action required, but a future pass could rephrase to "confirmed main profile" or "designated main profile" to avoid any confusion with Truth verification.

#### "proven"

| Location | Context | Safe? |
|---|---|---|
| `app-v10.js` | `cls()` function: `'Proven'`, `'Disproven'` — claim verdict CSS label names | ✅ pre-existing system terms for pressure-test outcomes |
| `app-v10.js` | "it does not mean HumanX has proven it" (Save as Truth helper) | ✅ negation |
| `app-v10.js` | "not proven fact" (Truths card) | ✅ negation |
| `app-v10.js` | "Could be proven false by evidence" (submit claim guidance) | ✅ describes falsifiability requirement |
| `app-v10.js` | "Public means visible, not proven." (Truths panel) | ✅ negation |
| `app-v10.js` | regex: `found\|proven\|charged\|convicted` (content moderation hint) | ✅ internal code logic |
| `app-v10.js` | `buildProvenanceMeta` (RunPack function name) | ✅ "proven" is substring of "provenance"; not user-facing |
| `index.html` | "proven, documented atrocities" (moral stress test scenario question) | ✅ describes quiz scenario content |
| `humanx-bridge.js` | "Nothing has been proven or verified." | ✅ negation |

#### "HumanX decides"

No matches. ✅

#### "diagnosis"

| Location | Context | Safe? |
|---|---|---|
| `index.html` | "No diagnosis." (intro-note) | ✅ negation |
| `index.html` | "not a diagnosis." (results-framing) | ✅ negation |
| `index.html` | "not diagnoses, labels, or predictions" (behavioral section disclaimer) | ✅ negation |

#### "prediction"

| Location | Context | Safe? |
|---|---|---|
| `index.html` CSS | "Behavioral prediction layer" (CSS comment) | ✅ internal code comment, not user-facing |
| `index.html` JS | `// BEHAVIORAL PREDICTION` (JS comment) | ✅ internal code comment, not user-facing |
| `index.html` | "Provides no testable predictions" (Simulation Theory worldview description) | ✅ describes the theory |
| `index.html` | "end-date predictions that passed" (worldview description for a specific group) | ✅ describes the group's historical record |
| `index.html` | "not diagnoses, labels, or predictions of what you will do" (behavioral section disclaimer) | ✅ negation |

**Result: PASS ✅** — No unsafe instances. All hits are either negations, pre-existing system terms, internal code comments, or quiz scenario content.

---

## CSS / Layout Check

The D-119C changes added:
- One `<p class="intro-sub">` paragraph to the intro screen (between intro-hook and stats grid).
- One `<p class="results-framing">` paragraph to the results hero (with inline style `font-size:13px;color:var(--muted);max-width:560px;margin:6px auto 0;line-height:1.5`).

Both elements use existing classes or constrained inline styles. The `intro-sub` class is used on the paragraph immediately above (same styling). The `results-framing` inline style matches the scale of adjacent elements. No layout disruption is expected. No CSS changes needed.

---

## Static Check Results

| Check | Result |
|---|---|
| `node --check public/app-v10.js` | PASS — syntax OK |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `node scripts/hardening-smoke-test.mjs` | **416 passed, 0 failed** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed** |

---

## Pre-Existing Items Noted (Not Regressions)

| Item | Location | Note |
|---|---|---|
| "Only a verified main profile should count as one real voice in HumanX charts." | `index.html` identity screen | Profile mode / aggregate chart context, not Truth verification. Pre-existing. Could be rephrased in a future copy pass to remove "verified" entirely (e.g. "designated main profile"). |
| CSS comment "Behavioral prediction layer" / JS comment "BEHAVIORAL PREDICTION" | `index.html` | Internal code structure comments, not user-facing. The user-facing behavioral section copy correctly says "not diagnoses, labels, or predictions." |

Neither item was introduced by D-119B or D-119C. Neither requires immediate action.

---

## Copy Gap Assessment

No copy gaps relative to the D-119A plan. All six copy surface areas are covered:

| Area | Covered by | Status |
|---|---|---|
| Main app Beliefs entry | D-119B (`app-v10.js`) | ✅ |
| Belief Engine intro | D-119C (`index.html`) | ✅ |
| Result screen | D-119C (`index.html`) | ✅ |
| Send to HumanX | D-119B (`humanx-bridge.js`) | ✅ |
| Drift | D-119B (`app-v10.js`) | ✅ |
| Truth bridge | D-119B (`app-v10.js`) | ✅ |

---

## Confirmation

> Audit only. No frontend code changed. No Worker/backend code changed. No Wrangler. No D1. No production query. No admin token. No deploy. No Belief Engine submission. No Review action. No mutation beyond this docs commit.
