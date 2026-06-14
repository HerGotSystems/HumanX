# D-125B — Owner Test Cycle 1: Home/Onboarding Clarity Audit

**Date:** 2026-06-14  
**Branch:** fix/d125b-home-onboarding-clarity  
**Auditor:** Static code inspection — `public/app-v10.js`, `public/index.html`, `public/styles.css`  
**Mode:** Audit + minimal copy patch. No backend, scoring, or behaviour changes.

**Verdict: PATCHED**

One copy fix applied. Three notes logged for backlog. No blockers found.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Patch Applied

**[COPY] RunPack card + export panel — "No owner API credits used" → "No AI costs — paste into any AI you already use."**

Three occurrences replaced across `helperText()` (export mode), `renderHome()` RunPack card, and `renderExport()` panel.

| Location | Before | After |
|---|---|---|
| Home → RunPack card | "…No owner API credits used." | "…No AI costs — paste into any AI you already use." |
| `helperText()` export mode | "…No owner API credits used." | "…No AI costs — paste into any AI you already use." |
| `renderExport()` JSON details label | "…No owner API credits used." | "…No AI costs — paste into any AI you already use." |

**Why:** "No owner API credits used" implies the existence of API credits (just not the owner's), raising the question of who is paying. A fresh user who has no context for what "owner API credits" means may hesitate or assume HumanX is calling an AI on their behalf. The replacement is accurate and self-explanatory.

---

## Audit Results by Area

### Q1 — First impression: does Home explain HumanX without overclaiming?

**PASS.**

Hero subtitle: *"Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence. HumanX organises what people assert — it does not decide what is true."*

- No "proves truth" language ✓
- No diagnosis or verdict language ✓
- "working system" badge accurately reflects beta state ✓
- Explicit non-truth-arbiter statement in subtitle ✓
- Pipeline banner (Beliefs → Truths → Claims → Evidence → RunPack) sets structure without promising proof ✓

---

### Q2 — Entry points: cards and tab nav

**PASS WITH NOTE.**

**Cards (7 on Home):** Belief Engine · Drift · Submit Claim · Browse Claims · Evidence Vault · Truths · RunPack

- Belief Engine is visually primary (`cc-card-primary`, purple highlight) — most prominent card ✓
- Each card has a `cc-card-when` contextual hint ("When: …") ✓
- Review tab does not appear as a card — correct, it is admin-only ✓
- Belief Engine card copy accurately describes v2: "does not diagnose you and does not decide if you are right" ✓

**Note N1 — Nav tab label mismatch (FRICTION):**  
Nav tab reads "Beliefs"; Home card reads "Belief Engine". Both navigate to the same destination. A first-time user clicking "Beliefs" arrives at the Belief Engine and will likely connect the two names, but the mismatch may cause a moment of hesitation on return visits.

*Backlog: `[COPY] Nav tab "Beliefs" vs card "Belief Engine" — same destination, inconsistent label. Consider aligning to "Beliefs" in the card or "Belief Engine" in the nav. Low priority.*

**Note N2 — Review tab in nav (FRICTION):**  
"Review" appears as a nav tab visible to all users. Clicking it reveals the admin gate immediately ("admin only" badge, token prompt, no queue content) — the gate itself holds correctly. However a first-time user seeing "Review" in the nav will click it out of curiosity, read "admin only", and may wonder if they are excluded from something. The experience resolves cleanly but causes a small confusion spike.

*Backlog: `[COPY] Review tab label is "Review" with no hint it is admin-only. No queue is ever exposed. Minor friction — no blocker. Consider appending " ↑" or a badge via CSS in a future pass.*

---

### Q3 — User promise: is there a recommended starting path?

**PASS.**

- Belief Engine card is visually prioritised with `cc-card-primary` and carries a "When: starting from personal belief before making a public claim" hint ✓
- The pipeline banner provides a conceptual sequence ✓
- `helperText()` for home mode states "New submissions enter Review before becoming public" and "Pseudonymous. No email required." — sets expectations before the user clicks anything ✓
- No single forced onboarding path (by design) — the card grid is scannable and task-oriented ✓

---

### Q4 — Safety / trust: public, review, and private boundaries

**PASS.**

| Boundary | Where it is stated | Status |
|---|---|---|
| Submissions enter Review before going public | Home helper text + Submit card + Submit page + Truths add form | ✓ |
| HumanX does not decide truth | Hero subtitle + Truths card + Truths page header | ✓ |
| Belief Engine answers stay in browser | Belief Engine card copy | ✓ |
| Review is admin-only | Tab renders gate immediately; "admin only" badge shown | ✓ |
| "Public means visible, not proven" | Truths page header paragraph | ✓ |

No leaked Worker origin URL (`workers.dev`) in any public-facing copy ✓  
No admin token string in any public-facing code ✓  
No "tester" copy visible in any rendered UI ✓  

---

### Q5 — Mobile / compact layout

**PASS WITH NOTE.**

From `public/styles.css`:

| Breakpoint | Behaviour |
|---|---|
| ≤900px | Hero right panel (graph box) hidden; layout single-column |
| ≤600px | Card grid → 2 columns; `cc-card-when` labels hidden |
| ≤400px | Card grid → 1 column |

Core card title and description remain visible at all widths — the minimum needed to understand what each section does. The "When:" contextual hints disappear at ≤600px (phone width).

**Note N3 — `cc-card-when` hidden at ≤600px (FRICTION):**  
The "When:" guidance lines on each card (`cc-card-when`) are hidden via CSS at phone width. This is a deliberate compact-mode trade-off — the card title and description remain. However, for the Belief Engine card specifically, the "When: starting from personal belief before making a public claim" line is the clearest explanation of *why* a user would start there. Its absence on phones means the BE card's purpose is slightly less clear to first-time mobile visitors.

*Backlog: `[MOBILE] cc-card-when hidden at ≤600px removes contextual guidance. Acceptable trade-off for density. Consider keeping the Belief Engine card's cc-card-when visible or folding it into the description at mobile width in a future pass.*

No horizontal overflow risk identified from CSS — card grid uses `auto-fit minmax(190px, 1fr)` collapsing gracefully through 2-col and 1-col at smaller widths ✓  
Pipeline banner arrows hide at ≤600px but stages remain readable ✓

---

### Q6 — Copy consistency

**PASS.**

| Check | Result |
|---|---|
| No Worker origin URL (`workers.dev`) in public app code | ✓ |
| No admin token value in public app code | ✓ |
| No "tester" language in any rendered UI string | ✓ |
| No stale v1 Belief Engine copy in Home card | ✓ |
| "working system" badge (not "beta test" or similar) | ✓ |

---

## Backlog Items (not blockers)

| ID | Category | Item | Priority |
|---|---|---|---|
| N1 | `[COPY]` | Nav "Beliefs" vs card "Belief Engine" — label mismatch, same destination | Low |
| N2 | `[COPY]` | Review tab in nav has no admin-only hint until clicked; gate holds | Low |
| N3 | `[MOBILE]` | `cc-card-when` lines hidden at ≤600px — removes contextual BE card guidance on phones | Low |

None are blockers. The gate holds (N2). No misleading copy (N1 is a naming inconsistency only). Mobile core content remains readable (N3).

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | "No owner API credits used." → "No AI costs — paste into any AI you already use." (3 occurrences) |
| `docs/D125B_HOME_ONBOARDING_CLARITY_AUDIT.md` | Created (this file) |

---

## Recommended D-125C Scope

**D-125C — Owner test Cycle 2: Belief Engine full run**

Simulate P1 (fresh mobile, first run) and P2 (returning desktop, second run). Follow Cycle 2 steps from `D125A_OWNER_TESTER_HARDENING_PLAN.md` against the live site. Focus on:

- Intro screen privacy clarity at mobile width
- Result screen — any verdict/diagnosis language surviving from pre-D-124B layout
- Belief Timeline panel local-data note visibility
- Send-to-HumanX pre-click note visibility and wording
- Clear and Start Over behaviour (localStorage clearing confirmed or not)
- `cc-card-when` absence on mobile (N3 from this audit) — does the result step feel discoverable without it?

The Belief Engine v2 code is well-audited (D-124A through D-124I) but Cycle 2 confirms the live production experience across the full flow, not just static code.
