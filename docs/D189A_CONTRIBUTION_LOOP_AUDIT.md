# D-189A — Contribution Loop Audit

**Date:** 2026-06-28
**Method:** Source-code review — `public/app-v10.js`, `public/index.html`
**Starting state:** HEAD `f9f8245` · Baseline 1549/24/57
**Scope:** Audit only. No code changes.

---

## What "the contribution loop" means in HumanX

A contribution is any of: adding evidence, adding pressure, adding a test, saving analysis, or casting a vote. The loop is: user opens a claim in Study → understands what's missing → adds something → sees it mattered → knows what to do next.

This audit covers every step of that loop from entry to confirmation.

---

## Current flow summary

### Entry points into Study mode

1. Click any claim card in Arena → `selectClaim(id)` → `renderStudy()`
2. Click "Open Study →" from My HumanX → `openMyClaimStudy(id)`
3. Click "View in HumanX →" from public profile → `openPublicProfileClaimStudy(id)`
4. Navigate directly to `/c/:id` → SPA auto-calls `selectClaim(id)` on boot (D-187B)

All paths land at the same `renderStudy()` output.

### Study view layout (top to bottom)

1. **Study header** — claim text, status badge, meta (category · type · by handle), back nav
2. **Score meters** — Evidence / Testability / Survivability (wide meters)
3. **Meter key + verdict qualifier** — small explanatory text
4. **Vote row** — Believe / Reject / Unsure buttons + Build RunPack + Copy link
5. **"How this claim is being tested" panel** — `sectionArgumentFlow()` — 4 numbered pills showing first evidence / pressure / test / analysis; empty rows contain guidance text
6. **"Origin and truth trail" panel** — `sectionLineage()` — lineage graph and upstream truths
7. **Investigation Board header** — `+ Evidence`, `+ Pressure`, `+ Test` quick-add buttons, "Done adding? Create RunPack →" CTA
8. **Study grid (4 panels)** — Evidence · Pressure · Tests · Analysis — each with inline header, count badge, purpose text, empty state if empty

### Side panel (aside, persistent in Study mode)

- **Context/Casefile** — shows claim name + count badges (X evidence / X pressure / X tests / X analysis). Updates after every contribution via `renderCaseMini()`.
- **Attach Evidence / Pressure** — `<details>` collapsible section with: title input, kind select (Support evidence / Attack·contradiction), quality select (5 options), source URL, body textarea, "Attach to Selected Claim" button, hint "Support backs the claim. Attack challenges…", note "After approval, it can affect the public claim, score, and RunPack. Pending items stay private."
- **Investigation Packet** — Build RunPack + Copy Packet buttons, status line.
- **Report** — danger button to flag the claim.

---

## What works

### 1. Board fully re-renders after every contribution

`addCaseItem()`, `addHomeTestUI()`, `saveAnalysisResult()`, and `voteClaim()` all call `await selectClaim(selected.id)` on success. This re-fetches the full claim object and re-renders Study. Score meters, casefile counts, and the flow panel all update live. No stale UI.

### 2. The "How this claim is being tested" flow panel is a genuine orientation tool

Four numbered pills ("1 · Why people think it is true", "2 · What attacks it", "3 · How to test it", "4 · What analysis says") display the first attached item of each type, or a text placeholder if empty. The "start here" badge is visible immediately. For a brand-new claim, all four show their empty-state text — giving the user a clear mental model of what's expected even before they start.

### 3. Casefile sidebar counts update instantly

After each contribution, `renderCaseMini()` updates the sidebar: "X evidence · X pressure · X tests · X analysis". Fast signal that something changed.

### 4. `focusAddEvidence` / `focusAddPressure` / `focusAddTest` buttons work

The `+ Evidence`, `+ Pressure`, `+ Test` quick-add buttons in the Investigation Board header use ZERO_PARAM/ID actions that set the correct dropdown value, scroll the right panel into view, and focus the input. Users can act without hunting for the form.

### 5. Quality dropdown provides evidence typing

Five options (repeatable, documented, media, testimony, vibes) help users understand how to assess their own source. The "evidence-kind-hint" distinguishes support vs attack inline.

### 6. Empty states contain specific, actionable language

Each section's empty state explains what goes in it and gives a method:
- Evidence: "Use the side panel to add a source, document, or reuse an existing vault item. Each item needs a title, a source, and a stance — supporting or attacking the claim."
- Pressure: "Use the side panel to add an objection, contradiction, or counter-evidence. Rate severity 1–5 to show how much it damages the claim."
- Tests: form is always shown inline — no separate empty state needed
- Analysis: "Build a RunPack above → paste it into any AI → paste the JSON result back here"

### 7. "Done adding? Create RunPack →" CTA is well-placed

Sits between the Board header and the grid panels — visible without scrolling past all content. Closes the contribution loop naturally toward the output phase.

### 8. My HumanX shows "Recent Evidence" and "Recent Pressure" sections

Contributors can see their own submissions in My HumanX. The contribution does have a visible home in the user's record.

---

## Friction points

### F1 — Evidence and pressure toast messages are inconsistent and misleading

**Evidence toast:** `"Evidence attached to selected claim."`
**Pressure toast:** `"Pressure point submitted for review."`

The evidence toast implies immediate attachment. The pressure toast acknowledges a review queue. In practice both go through Review before affecting the public score. The evidence toast gives the user a false sense of immediacy — they may wait for a score change that won't come until Review approval.

**Note:** The `evidence-attach-note` below the button says "After approval, it can affect the public claim…" — but this is small static text the user reads before submitting, not after. After submitting, the toast is the only signal, and it's wrong.

### F2 — Flow panel empty-state rows have no actionable buttons

The 4 pills in `sectionArgumentFlow()` show plain text for empty slots:
- "No support evidence attached yet — add one from the side panel."
- "No pressure attached yet — add an objection from the side panel."
- "No test added yet — add one in the Tests section below."

"Add one from the side panel" is a navigation instruction, not a button. The user reads it and must independently find and open the right panel. There are `+ Evidence` / `+ Pressure` buttons lower on the page, but the flow panel doesn't link to them.

### F3 — `focusAddEvidence` and `focusAddPressure` do not ensure the `<details>` section is open

The "Attach Evidence / Pressure" section in the side panel is a `<details class="dock-section" open>` — starts open, but users can collapse it. The `focusAddEvidence` action sets the dropdown value and calls `eTitle.focus()` but does NOT call `detailsEl.open = true`. If the section is collapsed, focus goes to a hidden input — nothing visible happens from the user's perspective. The `+ Evidence` button appears to not work.

### F4 — Evidence and pressure use the same side-panel form with a mode switch

When a user clicks `+ Pressure`, the dropdown switches to "Attack / contradiction" and the panel scrolls into view. But the form label still says "Attach Evidence / Pressure" and the button still says "Attach to Selected Claim". Nothing visually confirms they're now in pressure mode except the dropdown value. A user who just added evidence and now wants to add pressure must notice the dropdown changed.

### F5 — Pressure empty state mentions "Rate severity 1–5" — this field does not exist in the form

Pressure empty state: _"Rate severity 1–5 to show how much it damages the claim."_

The `addCaseItem()` payload is `{claimId, title, quality, body, sourceUrl}`. There is no severity input in the side panel. The `quality` dropdown (repeatable / documented / media / testimony / vibes) is evidence-quality framing, not a 1–5 severity scale for pressure. A user trying to rate severity will find no such field.

### F6 — Vote buttons show no active/selected state after voting

`voteClaim()` calls `toast('Vote recorded')` then `selectClaim()` which re-renders the whole Study view. The vote count in the flow panel updates. But the three vote buttons (`▲ Believe`, `▼ Reject`, `~ Unsure`) have no active/selected visual state — the user cannot tell which option they chose without externally tracking it. Re-rendering clears any CSS active state the browser might apply.

### F7 — "Evidence attached to selected claim" toast disappears in 1800ms with no next-step nudge

After a successful contribution the form clears and a toast shows briefly. There is no prompt like "Now add something that attacks it →" or "Next: run a test →". The user must self-navigate to the next step using the Investigation Board buttons or the flow panel text.

### F8 — Analysis flow is multi-step with no in-app guidance between steps

The full analysis loop:
1. Click "Build RunPack" (Study header)
2. The RunPack is generated (or copy from side panel)
3. Open an AI externally
4. Paste the RunPack
5. Get the AI's JSON response
6. Come back to HumanX
7. Scroll to the Analysis section
8. Paste the JSON in the textarea
9. Click "Save Analysis"

Steps 3–6 happen outside the app. There is no in-app state that tracks "a RunPack was built but no analysis returned yet" with a visible reminder. If the user builds a RunPack, switches tabs, pastes into an AI, and then returns to HumanX later, the Analysis section shows the same empty state they saw before — nothing indicates a RunPack was recently built for this claim.

### F9 — "Button says 'Attach to Selected Claim'" — impersonal and technical

The primary submit button in the side panel uses the label "Attach to Selected Claim". This language is internal/developer-speak. Users submitting evidence think of it as "sharing" or "adding" something, not "attaching". The verb "attach" implies a file-browser UX.

### F10 — No score-change feedback after contribution

After a contribution causes a score change (e.g., Evidence score rises), the meters re-render silently. There is no "Evidence score: 40 → 45" toast or animation. The user can see the change by comparing the meter to what they remember, but nothing explicitly surfaces it.

### F11 — `study-runpack-cta` mentions only evidence and pressure, not tests

"Done adding evidence and pressure? Create RunPack →"

A complete investigation includes tests as well. The CTA implies tests are optional or after-the-fact, which may discourage users from adding tests before running a RunPack.

---

## Missing reward / feedback signals

| After action | Current signal | Missing signal |
|-------------|---------------|----------------|
| Adding evidence | Toast "Evidence attached to selected claim." Board re-renders | Clearer Review status; "Now add pressure?" nudge |
| Adding pressure | Toast "Pressure point submitted for review." Board re-renders | "X pressure points against this claim now" |
| Adding test | Toast "Test added" Board re-renders | Confirmation of test visibility / next step |
| Saving analysis | Toast "Analysis saved" Board re-renders | Verdict displayed prominently in toast |
| Voting | Toast "Vote recorded" Board re-renders | Which option is now the user's active vote |
| Score change | Meters update silently | Delta indication ("Evidence ↑") |

---

## Quick fixes for D-189B+

These are all small, isolated changes. No backend required.

### QF1 — Fix evidence toast to mention Review (highest priority)

**Change:** `'Evidence attached to selected claim.'` → `'Evidence submitted for review. It will appear after approval.'`

This fixes F1 and aligns evidence with the pressure toast. One string change in `addCaseItem()`.

**Risk:** None. No UI layout change.

### QF2 — Ensure `focusAdd*` actions open the `<details>` section before focusing

**Change:** In `_D181B_ZERO_PARAM_ACTIONS`, the `focusAddEvidence` and `focusAddPressure` entries should call `document.querySelector('.dock-section')?.setAttribute('open','')` (or target the specific details element by ID) before calling `focus()`.

**Risk:** Low. Additive — only affects the case where the section is collapsed.

### QF3 — Fix pressure empty-state copy (remove false severity reference)

**Change:** `"Rate severity 1–5 to show how much it damages the claim."` → `"Describe what contradicts, weakens, or disproves the claim — be specific about the gap."`

One string change in `sectionPressure()`.

**Risk:** None.

### QF4 — Rename "Attach to Selected Claim" button

**Change:** `"Attach to Selected Claim"` → `"Add to Claim"` (or dynamically: `"Add Evidence"` / `"Add Pressure"` based on kind dropdown value via `oninput` on the select).

The static rename is a one-line change in `public/index.html`. The dynamic version requires a small JS handler.

**Risk:** Low. Start with static rename; dynamic is optional.

### QF5 — Add actionable link in flow panel empty rows

**Change:** In `sectionArgumentFlow()`, when evidence/pressure/test slot is empty, append a `<button>` that calls `focusAddEvidence()`, `focusAddPressure()`, `focusAddTest()` respectively. Example:

```
'No support evidence attached yet. <button class="btn-mini" data-action="focusAddEvidence">+ Add evidence</button>'
```

**Risk:** Low. String template change in `sectionArgumentFlow()`.

---

## Longer product ideas (out of D-189B scope)

| Idea | Value | Effort |
|------|-------|--------|
| Score delta toast ("Evidence ↑ 40→45") | High — direct feedback that contribution mattered | Medium — requires storing pre-contribution score |
| Active vote indicator (highlight chosen vote button) | Medium — reduces "did my vote register?" confusion | Low — CSS class on re-render using saved vote state |
| "Your evidence is pending review" item badge | High — removes confusion about immediacy | Medium — requires tracking submitter vs others |
| "Now add pressure" nudge after first evidence submission | High — drives contribution loop forward | Low — conditional in success path |
| Analysis status indicator ("RunPack built — waiting for AI result") | Medium — bridges the gap in multi-step flow | Medium — requires sessionStorage for RunPack state |
| Contribution streak in My HumanX ("3 contributions this week") | Low-medium — motivational, but secondary | Low |
| "What changed?" panel after contribution | High — shows before/after scores | High — requires snapshot storage |
| Vote state persistence per claim | Medium — remembers user's vote across sessions | Medium — requires storing vote per userId+claimId |

---

## Answers to audit questions

| Question | Answer |
|----------|--------|
| Does user know what to add next? | Partially — the flow panel text says what's missing but has no clickable next step (F2) |
| Does user get clear confirmation after contributing? | Partially — toast + board re-render, but evidence toast misrepresents Review status (F1) |
| Does the board visibly update after a contribution? | Yes — `selectClaim()` re-renders everything including meters and casefile counts |
| Does the user see their contribution mattered? | Partially — meters update silently; no delta signal |
| Are forms too hidden? | Sometimes — side panel `<details>` can collapse and `focusAdd*` doesn't re-open it (F3) |
| Are labels clear enough? | Mostly — except "Attach to Selected Claim" (too technical) and pressure severity reference (false, F5) |
| Are there dead ends after submitting? | Yes after evidence/pressure — no next-step nudge (F7) |
| Is there a natural next action after each contribution? | Only the RunPack CTA at the bottom; nothing between contributions |

---

## Recommended D-189B scope

**Do in D-189B (all quick, low-risk):**

1. QF1 — Fix evidence toast to mention Review
2. QF2 — Ensure `focusAdd*` opens the `<details>` section
3. QF3 — Fix pressure empty-state copy (remove false severity 1–5 reference)
4. QF4 — Rename "Attach to Selected Claim" → "Add to Claim" (static version first)
5. QF5 — Add `+ Add evidence / + Add pressure` buttons in flow panel empty slots

**Leave for later:**
- Score delta feedback
- Vote state persistence
- "Your evidence is pending" badges
- Analysis status indicator
- Post-contribution next-step nudges (can follow after QF5 is in)
