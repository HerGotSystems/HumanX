# D-207A — Study View Density / Information Architecture Audit

**Date:** 2026-06-28
**HEAD at audit:** `8895d5a`
**Baseline:** 1725/24/57
**Scope:** Audit and recommendation only — no code changes in this patch

---

## A. Current Study Layout Order

From top to bottom as rendered:

### 1. Study header (`study-header`)
- ← Back button + claim status badge
- Claim title (h2, large — `clamp(24px,3vw,38px)`)
- Intro note: "This public study shows the evidence, pressure, votes, and truth trail currently shaping this claim."
- Review/moderation badge (if applicable)
- Study meta: category · type · author
- Evidence / Testability / Survivability meters (three horizontal bars)
- Meter key: "Evidence shows support gathered. Testability shows whether the claim can be checked. Survivability shows how well it holds up under pressure."
- Verdict qualifier: "Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty."
- Vote row: Believe / Reject / Unsure buttons + "Votes show public reaction. They do not directly decide the verdict."
- Build RunPack + Copy link buttons

### 2. Argument Flow (`sectionArgumentFlow`)
Belief snapshot visual — claim ↔ evidence mapping.

### 3. Lineage (`sectionLineage`)
Claim lineage / parent/child links.

### 4. Investigation Board header
Title "Investigation Board" + "+ Evidence / + Pressure / + Test" action buttons.

### 5. RunPack CTA
"Done adding evidence and pressure? Create RunPack →"

### 6. `study-grid` — 2-column grid (collapses to 1 column at ≤900px)

| Slot | Panel class | Content |
|------|-------------|---------|
| 1 | `st-mix-panel` | Source Type Mix chart |
| 2 | `es-mix-panel` | Evidence Strength Mix chart |
| 3 | `evidence-panel` | Evidence list (`sectionEvidence`) |
| 4 | `pm-mix-panel` | Pressure Mix chart |
| 5 | `pressure-panel` | Pressure list (`sectionPressure`) |
| 6 | `ta-mix-panel` | Test Activity chart |
| 7 | `tests-panel` | Tests list (`sectionTests`) |
| 8 | `analysis-panel` | Analyses (`sectionAnalyses`) |

### Visual hierarchy inside the grid

- Content panels (`evidence-panel`, `pressure-panel`, `tests-panel`, `analysis-panel`) have colored top borders (green/red/yellow/blue respectively)
- Chart panels (`st-mix-panel`, `es-mix-panel`, `pm-mix-panel`, `ta-mix-panel`) have no colored top border — they use the default `var(--line)` border
- The 2-column grid pairs panels roughly: chart left / content right, or chart / content alternating depending on DOM order

### Guardrail notes currently rendered

Each chart function contains **3 `ev-origin-note` instances**: empty-state note, unknown-all note, and the always-present bottom note. On a populated claim with no all-unknown items, **1 note per chart** is visible = **4 guardrail notes** in the study-grid, plus:
- 1 verdict qualifier in the header
- 1 vote note in the header
- 1 meter key in the header
- 1–2 notes in `sectionAnalyses` paste area (D-202C)

On a fully populated claim: **~8–9 small italic notes** visible before the user reaches the actual evidence/pressure/test cards.

---

## B. Strengths

**Charts are per-claim and relevant.** Every chart describes the specific claim the user is investigating — no global aggregates, no cross-claim rankings. This is the correct scope.

**Guardrails are genuinely useful.** "Source origin describes where material comes from, not whether it is true" is real epistemic context, not boilerplate. Users who read it will understand the data better.

**Charts use already-loaded data.** Zero additional API calls. Study view load time is not affected by the presence of charts.

**Evidence and pressure are easier to interpret.** Seeing "60% personal experience, 30% news report" before reading evidence cards gives the user a frame for what they're about to read.

**No truth score or leaderboard was introduced.** Every chart survived the D-203A three-test decision gate. None of them rank claims or imply a verdict.

**Colored top borders on content panels** provide weak but real visual differentiation between chart panels and content panels.

---

## C. Density Risks

**Too many panels before raw evidence.**

On desktop (2-column grid, panels flow as pairs):

```
Row 1:  [Source Type Mix]  [Evidence Strength Mix]
Row 2:  [Evidence list   ]  [Pressure Mix        ]
Row 3:  [Pressure list   ]  [Test Activity       ]
Row 4:  [Tests list      ]  [Analyses            ]
```

The user sees two chart panels before they see any evidence at all. On a claim with 10 evidence items, the evidence list is in row 2, column 1 — one scroll. Acceptable.

On mobile (1-column, panels stack):

```
[Source Type Mix]
[Evidence Strength Mix]
[Evidence list]
[Pressure Mix]
[Pressure list]
[Test Activity]
[Tests list]
[Analyses]
```

The user must scroll past two full chart cards before reaching evidence. On a claim with data, each chart card is approximately 100–180px tall. On mobile the user may scroll 300–400px before seeing a single evidence card. This is the primary density risk.

**Repeated guardrail copy creates visual noise.**

Four instances of `ev-origin-note` in the study-grid all use the same italic/muted style. On mobile this looks like a column of fine-print disclaimers — easy to train the eye to skip. Paradoxically, having four nearly identical notes may make each one *less* read than having one well-placed note would be.

**Charts may feel like the main product.**

The study-grid currently has 4 chart panels and 4 content panels. On first load with an empty or lightly populated claim, the chart panels will show "No evidence submitted yet" × 2 and "No pressure submitted yet" and "No tests recorded yet" — four empty-state messages in a row before the user reaches the add-evidence workflow. This is the worst case and the most likely case for a new claim.

**Users may miss the actual evidence cards.**

The "+ Evidence" action button is in the Investigation Board header, which sits above the study-grid. After submitting evidence, the user returns to the top and must scroll down again to see it in the Evidence list, past two chart panels. The chart panels updating with a single data point may look unimpressive.

**Study feels analytical before it feels investigatory.**

Charts communicate "we are analysing this claim" which is the wrong starting frame for a user who has just arrived and wants to contribute. The investigation workflow (add evidence, add pressure, add test) should feel primary. The synthesis view (charts) should feel secondary or optional.

---

## D. Mobile Risks

**Bar label wrapping at narrow widths.**

`.st-mix-row` uses `grid-template-columns: 130px 1fr 56px` (desktop) and `100px 1fr 48px` (mobile at 600px). Labels like "Personal experience" at 10px font may still overflow at 100px on very narrow screens (≤360px). Values would be clipped by `text-overflow: ellipsis` but this degrades readability for less common source types.

**Stacking four chart panels in mobile single-column view.**

Total estimated chart card heights on mobile with data:
- Source Type Mix (5 source types): ~170px
- Evidence Strength Mix (3 strengths): ~130px
- Pressure Mix (2 severity levels): ~110px
- Test Activity (2 difficulty levels): ~110px

**Total chart scroll distance before evidence list: ~520px on mobile.** A user on a 720px-height phone screen will scroll approximately three screens before reaching an evidence card. This is a meaningful UX cost.

**Repeated bottom notes (4 × `ev-origin-note`)** each add ~30–40px of height on mobile. Across four charts: ~130px of italic fine print. On mobile this becomes prominent scrollable content rather than context.

**Action buttons and form inputs pushed down.**

The evidence submission form (`eTitle`, `eNote`, `eSource`, `eSourceType`, `eEvidenceStrength`) is inside `evidence-panel`, which is the third panel in the mobile stack. On a claim with populated charts, the form may be 600–700px below the top of the page. First-time users may not find it without prompting.

**Whitespace accumulation.**

Each `.study-grid section` has `padding: 8px` and the grid has `gap: 10px`. With 8 panels on mobile, the gap and padding alone add ~148px of vertical space.

---

## E. Recommended Layout Model for D-207B

### The options

1. **Keep current order, only tighten spacing/copy** — minimal change, but does not resolve the mobile scroll problem or the "charts first" impression.

2. **Group all charts under `Investigation overview` (collapsible, default open)** — adds a labeled section for charts; user can collapse to reach evidence faster. Moderate implementation. Risk: collapsed by default hides the best part of the charts for casual users; open by default doesn't improve mobile scroll.

3. **Make chart group collapsible with default open on desktop, closed on mobile** — best user-experience answer but requires viewport-conditional logic in the renderer, which adds complexity to a file that is already difficult to edit safely.

4. **Move charts below raw lists** — charts become a synthesis view after the user has seen the raw data. Preserves "investigation first, analysis second" hierarchy. Significant reorder of study-grid but low code risk. Loses the "orient the user before they see the evidence" benefit of charts-first.

5. **Split Study into tabs/anchors** — highest fidelity UX; "Evidence," "Pressure," "Tests," "Charts" as tab sections. Significant implementation, touches the core Study renderer, creates URL anchor complexity.

### Recommendation: Option 2 — grouped charts under a lightweight collapsible section header

**Why this option:**

- Preserves the "context before raw data" value of the current chart placement
- Adds clear visual grouping so charts read as "Investigation overview" rather than a mix of unrelated panels
- A `<details>/<summary>` collapse is CSS-only semantics — no JS state, no viewport detection, no re-rendering
- Default `open` on both desktop and mobile means no behavior change for current users
- Future: the product owner can change to `closed` on mobile with one attribute change once they see real usage patterns

**What to group:** All four chart panels (`st-mix-panel`, `es-mix-panel`, `pm-mix-panel`, `ta-mix-panel`) wrapped in a `<details class="inv-overview" open>` element with a `<summary>Investigation overview</summary>` header, placed above the main study-grid content panels.

**What NOT to group:** The content panels (`evidence-panel`, `pressure-panel`, `tests-panel`, `analysis-panel`) stay as they are. The grouping only affects the four chart panels.

**Guardrail copy consolidation:** Replace the 4 × bottom chart note with a single shared note at the bottom of the `<details>` group: "These charts show submitted HumanX activity. They do not show whether the claim is true." This eliminates ~3 redundant notes and reduces mobile note-scroll significantly.

**Mobile improvement:** On mobile, the user can collapse the overview group with one tap to reach evidence directly. First-time users see it open; returning users can close it. The `<details>` element is accessible and works without JavaScript.

---

## F. Guardrails for Any Future Layout Patch

These rules apply regardless of which layout option is chosen:

1. **Do not hide evidence entirely.** The evidence panel must always be reachable without a page reload or navigation. Tabs are allowed only if the evidence tab is accessible without JavaScript.

2. **Do not remove chart warning copy.** Consolidating four notes into one shared note is acceptable. Removing the note entirely is not. The note is not optional (D-203A Section D).

3. **Do not make charts look like verdicts.** Any grouping label (e.g., "Investigation overview") must not imply conclusions. Avoid: "Claim analysis," "Evidence verdict," "Truth summary."

4. **Do not add truth score.** No change in layout should introduce a numeric composite of evidence + pressure + AI verdict.

5. **Do not make mobile harder.** If a change reduces the mobile scroll distance to evidence, it must not simultaneously require more taps to reach the add-evidence form.

6. **Preserve direct evidence/pressure/test workflows.** The `+ Evidence`, `+ Pressure`, `+ Test` action buttons in the Investigation Board header must remain above the study-grid, regardless of chart grouping.

7. **`<details>` collapse must not hide content in print view.** If the product ever adds print/export, collapsed `<details>` hides content by default in print. Add `@media print { details { display: block; } details > * { display: revert; } }` if using `<details>`.

---

## G. D-207B Implementation Recommendation

**Recommendation: small frontend patch — implement Option 2.**

### Exact UI change

In `public/app-v10.js`, wrap the four chart section injections in a single `<details class="inv-overview" open>` element:

```html
<details class="inv-overview" open>
  <summary class="inv-overview-summary">Investigation overview</summary>
  <div class="inv-overview-grid">
    <section class="panel st-mix-panel">…</section>
    <section class="panel es-mix-panel">…</section>
    <section class="panel pm-mix-panel">…</section>
    <section class="panel ta-mix-panel">…</section>
  </div>
  <p class="small ev-origin-note inv-overview-note">
    These charts show submitted HumanX activity — source types, evidence strength, pressure intensity, and test difficulty. They do not show whether the claim is true.
  </p>
</details>
```

The remaining four panels (`evidence-panel`, `pressure-panel`, `tests-panel`, `analysis-panel`) stay in the existing `study-grid` unchanged.

### Guardrail copy consolidation

Remove the bottom `ev-origin-note` from each of the four chart functions. The shared note in `<details>` replaces them. The empty-state notes and unknown-all notes inside each function stay — those are functionally distinct messages.

### Files likely affected

- `public/app-v10.js` — wrap four chart sections; remove 4 bottom guardrail notes; add shared note
- `public/styles.css` — add `.inv-overview`, `.inv-overview-summary`, `.inv-overview-grid`, `.inv-overview-note` styles; add print rule

### Expected smoke tests

- `inv-overview` details element exists in study-grid HTML
- `<summary>` contains "Investigation overview"
- Shared guardrail note "These charts show submitted HumanX activity" exists
- Chart functions still render their empty-state notes
- Chart functions still render their unknown-all notes
- Chart functions no longer contain the bottom guardrail note (consolidated)
- `<details>` has `open` attribute by default
- No banned framing in summary label
- No scoring fields in overview group
- Worker not changed

### Whether deploy needed

Yes — `app-v10.js` and `styles.css` will both change.

### Risk level

Low. `<details>/<summary>` is a native HTML element with full browser support. No JavaScript. No state. Collapsing and reopening does not trigger any re-render. The only risk is visual regression if `.inv-overview-grid` sizing is incorrect — addressable in smoke tests or a quick deploy sanity check.
