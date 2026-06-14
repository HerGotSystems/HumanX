# D-124H — Belief Engine v2 Result Screen UX Audit

**Date:** 2026-06-14
**Branch:** fix/d124h-belief-result-ux-polish
**Auditor:** Claude (automated, D-124H task)
**Scope:** Result screen UX audit after D-124B–G chain. Code-level audit; no browser automation. No scoring, questions, bridge payload, backend, or schema changes.

**Verdict: PATCHED — 2 small copy/UX fixes applied**

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Audit Questions & Findings

### Q1 — Does the result screen explain this is a mirror, not a diagnosis?

Multiple locations reinforce this:

- `results-framing` (line 561): *"This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict."*
- Intro note: *"No correct answers. No religion assigned. No diagnosis. No score of your worth."*
- What to Test Next: *"Use this as a starting point, not a verdict."*
- Contradiction descriptions use hedged language ("appears", "tends to", "correlates with") rather than direct claims.

**Result: PASS**

---

### Q2 — Does Pressure Map framing avoid overclaiming?

The `h2` label is simply "Pressure Map." The mode pill (dynamically rendered) states run mode and whether it "counts as real voice / excluded from public charts" — accurate and scoped.

Dimension bars are labelled by name with a numeric score; no "you are X" labels. Alignment list shows similarity percentages with descriptions. No absolute claims.

**Result: PASS**

---

### Q3 — Are contradiction/pressure/test-next sections understandable without earlier context?

- "Contradiction Response" accordion (always open) — title + Contradiction Scan list with `title` + `desc` per item. Self-contained.
- "Pressure Responses → Under Pressure" — behavioral profile text populated by JS. Self-contained.
- "What to Test Next" — standalone paragraph explaining next steps, links to Claims/Truths. Self-contained.
- "Dimensions & Structure" and "Structural Snapshot & Origin" — these contain more technical language (dimension bars, meta-grid, stress readout) that assumes the user has read the intro. This is acceptable for optional expandable detail sections.

**Result: PASS**

---

### Q4 — Are expandable details discoverable?

The four `<details>` accordions use `.result-layer-summary::after { content: '↓' }` / `'↑'` arrows as affordance. "Contradiction Response" is open by default, demonstrating the expand/collapse pattern for the others above it. Summary labels are uppercase, styled distinctly from body content.

Three closed layers above the open one may be skimmed by users on first pass, but the open accordion provides clear discovery. No critical information is hidden-only — Layer 1 (Pressure Map + Profile Snapshot) is always visible.

**Result: PASS** — sufficient affordance for the current design; no block on discoverability.

---

### Q5 — Is timeline/free-text display clearly local/private?

**Finding: GAP — PATCHED**

The "Belief Timeline" panel in results displayed the user's full written responses (childhood belief, teenage change, fears, identity threat) with no indication that this text is local-only and excluded from snapshots.

After D-124C removed free-text from the bridge payload, and D-124E added the intro note ("includes any answers you typed · not synced"), the result panel was the remaining location where the text appeared without any privacy context.

**Fix applied** — `renderTimelinePanel()` now emits a subtitle directly below the `<h2>`:

```
Your written responses — stored in this browser only. Not included in snapshots sent to HumanX.
```

This closes the gap: intro, result panel, and bridge all now carry consistent local-data context where user-typed text is visible or referenced.

---

### Q6 — Send-to-HumanX note: visible and accurate?

Two notes exist, both accurate:

1. **Static HTML** (Export & Share panel, above `.results-actions`): *"Download or copy your pressure map. 'Send to HumanX' saves a snapshot to your session — it does not publish anything automatically."*

2. **Bridge-injected** (inside `.results-actions`, before the Send button): *"Saved: dimension scores, alignment patterns, contradiction summary, and moral-scenario responses. Not saved: private timeline text or free-text answers you typed. Nothing is published — the snapshot enters your Drift for your own review only."*

The bridge note is more specific and accurate post-D-124C. The static note is a correct fallback if the bridge script doesn't load.

No stale references to "full profile saved" or "all answers sent" detected.

**Result: PASS**

---

### Q7 — Are actions distinguishable and not dangerous-looking?

**Finding: COPY GAP — PATCHED**

Actions in `.results-actions`: Download PNG, Copy Summary, **Retake** (static); bridge injects Send to HumanX before these.

`retake()` deletes the currently-displayed saved result from localStorage and restarts the quiz — it is destructive. The label "Retake" implies repeating the quiz but does not signal that saved data is cleared. This is particularly surprising in the "View previous results → Retake" path, where the user loads a previously saved result and then destroys it.

**Fix applied** — Label changed from `Retake` to `Start Over`. This is more explicit that the user is discarding the current state to begin fresh, rather than implying a neutral repetition.

No other action is dangerous: Download PNG and Copy Summary are read-only; Send to HumanX requires explicit click and shows a confirmation alert.

**Result: PATCHED**

---

### Q8 — Mobile/compact layout

CSS breakpoint at ≤950px collapses `.results-overview` and `.results-stack` to single-column. The four accordion layers are already block-level and stack naturally. "What to Test Next" links use `flex-wrap:wrap; min-width:140px` and will stack at narrow widths. Export canvas is 900px wide but uses CSS scaling from the parent `.results-wrap` which is width-constrained.

No obvious broken stacking or overflow issues detectable at code level.

**Result: PASS** (code-level; recommend manual browser QA at 375px and 768px)

---

### Q9 — Stale v1 wording or outdated privacy claims?

Scanned for: "full profile saved", "all data saved", "Save to HumanX", old version markers, "all answers", "sent to server".

None found. All references to saving are:
- "saves a snapshot to your session" (static note — accurate)
- "Saves as your current character/profile" (mode card — refers to localStorage only)
- "Stored in this browser only" (intro — accurate)

No stale v1 wording detected.

**Result: PASS**

---

### Q10 — Button/anchor bugs after D-124E/G?

- `existing-btn` click independence confirmed in D-124E/F.
- `showResults()` → `getLatestSavedRun()` confirmed in D-124G.
- `clearSavedResults()` hides button directly — no full re-render needed.
- `retake()` correctly removes mode-specific key and legacy pointer.
- External links (Browse Claims, Submit a Claim, Browse Truths) all use `target="_blank" rel="noopener noreferrer"` — correct.
- `onclick="downloadShare()"`, `onclick="copyShareText()"`, `onclick="retake()"` — all wired to defined functions.
- Bridge injection: `document.querySelector('.results-actions')` — div exists in current DOM; no ID conflicts.

**Result: PASS**

---

## Summary of Changes

| # | Location | Change |
|---|---|---|
| 1 | `renderTimelinePanel()` JS | Added local-data subtitle below "Belief Timeline" h2 |
| 2 | Export & Share HTML | "Retake" button label → "Start Over" |

Both changes are copy/display only. No scoring, questions, bridge payload, backend, or schema modified.
