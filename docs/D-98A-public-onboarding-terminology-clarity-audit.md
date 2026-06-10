# D-98A — Public Onboarding & Terminology Clarity Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 299 / belief-engine-static-check 24 / worker-route-static-check 39

---

## A. Files Inspected

| File | Sections read |
|---|---|
| `public/app-v10.js` | `renderHome`, `helperText` (all 9 mode branches), `renderDrift`, `renderBelief`, home action cards, pipeline banner |
| `public/index.html` | `<title>`, noscript notice, nav tab labels, searchbar verdict filter, side panel (evidence/RunPack/report) |
| `public/apps/humanx-belief-engine/index.html` | intro screen copy, identity-optional banner, behavioral-profile "not diagnoses" disclaimer |
| `scripts/hardening-smoke-test.mjs` | Existing nav/wording test coverage |
| `docs/D-97A-public-truths-trust-clarity-audit.md`, `D97B_PUBLIC_TRUTHS_TRUST_SIGNAL_CLARITY.md` | Prior trust-signal policy |
| `docs/D92C_TRUTHS_PUBLIC_CLARITY.md`, `docs/README.md` | Public-clarity baseline |

---

## B. Current Public User Journey Map

```
LANDING (mode=home, renderHome)
  ├─ Hero: badge "working system" + H1 "HumanX"
  │   subtitle: "Map personal belief. Record what gets repeated as fact.
  │              Pressure-test public claims with evidence. HumanX organises
  │              what people assert — it does not decide what is true."
  ├─ statusline: handle · D1 live/demo · N claims · N truths · N evidence
  ├─ pipeline banner: Beliefs → Truths → Claims → Evidence → RunPack
  └─ Action cards (7):
       Belief Engine | Drift | Submit Claim | Browse Claims |
       Evidence Vault | Truths | RunPack
       (each: icon, title, description, "When:" line, action link)

NAV TABS (index.html, persistent):
  Home · Beliefs · Drift · Claims · Submit · Evidence · Truths · Review · RunPack

PRIMARY PATHS:
  1. Belief Engine (external app /apps/humanx-belief-engine/)
       intro → 77 statements → 19 dimensions → archetype + behavioral profile
       → "Send to HumanX" → saved snapshot (Drift)
       → promote to Truth or Claim
  2. Submit Claim (mode=submit) → enters Review → public when approved
  3. Browse Claims (mode=arena) → Study → vote / attach evidence / pressure
  4. Truths (mode=truths) → record → "Pressure-test as Claim" → Review
  5. RunPack (mode=export) → build packet → paste into external AI

SIDE PANEL (context-sensitive, helperText per mode):
  drift · belief · home · vault · truths · review · export · submit · (default=arena)
```

---

## C. Current Terminology Map

| Term | Where defined for public | Current public definition | Clear? |
|---|---|---|---|
| **HumanX** | hero subtitle, noscript | "organises what people assert — it does not decide what is true" | ✅ strong |
| **Belief / Beliefs** | pipeline ("personal structure"), tab "Beliefs" | personal belief structure via Belief Engine | ✅ |
| **Truth / Truths** | home card, helperText, Truths page | "statements that circulate as fact… HumanX records what is asserted, not whether it is correct" | ✅ (post D-92C/D-97B) |
| **Claim** | home card, submit helperText | "a precise, testable public statement. Scores reflect what evidence has been submitted — not an automatic verdict" | ✅ |
| **Study** | Browse Claims card, arena helperText | "Open Study to investigate, vote on, and attach evidence" | 🟡 label-only; "Study" as a verb is mild jargon |
| **Pressure-test** | Truth button, home Truths card | "Convert any truth into a pressure-testable claim" | 🟡 metaphor, not literally defined |
| **Review** | tab, submit/truths helperText | "New submissions enter Review before becoming public" | ✅ |
| **Public / visible** | Truths page (visible), claims (Public) | D-97B: Truths "visible", claims "Public" | ✅ (post D-97B) |
| **Not verified** | Truth cards | strengthened badge (D-97B) | ✅ |
| **Evidence / Pressure** | side panel, vault | "Support adds evidence. Attack adds pressure." | ✅ |
| **Testability / Survivability** | verdict filter, scores | NOT defined in onboarding — appear as verdict labels | 🔴 undefined jargon |
| **Belief Engine / Profile** | home card "forensic belief profile" | 77-statement profile; in-app "not diagnoses… pressure-tendency estimates" | 🟡 see D.3 |
| **RunPack** | home card, export helperText | "structured analysis packet… paste into any AI" | ✅ |
| **Drift** | home card, tab | "how beliefs change across sessions" | ✅ |

---

## D. Confusion Risks (Ranked by Severity)

### D.1 — MEDIUM: Action wording for Truth→Claim conversion is inconsistent across surfaces

Three different phrasings for the *same* action exist:

| Surface | Wording |
|---|---|
| `truthCard` button + home Truths card | **"Pressure-test as Claim"** |
| `helperText` truths branch | **"Send to Claim Review"** |
| `helperText` drift branch | **"Send to Claim Review"** — "creates a public, pressure-testable claim" |

A first-time user reading the side panel ("Send to Claim Review") then clicking the card button ("Pressure-test as Claim →") may not realise they are the same action. D-92C standardised the *button* to "Pressure-test as Claim" but the helperText was not updated to match.

### D.2 — MEDIUM: Verdict-filter vocabulary is undefined jargon on a public surface

The searchbar verdict filter (always visible) offers: **Proven, Strongly Supported, Plausible, Untestable, Weak Evidence, Disproven, Reality Collapse**. None of these are defined anywhere in onboarding. "Reality Collapse" in particular is dramatic and unexplained — a new user has no way to know what it means or how a verdict is reached. This risks reading as HumanX *pronouncing* verdicts (overclaim — see E.1) rather than summarising submitted evidence.

### D.3 — MEDIUM: "Forensic belief profile" overstates the Belief Engine relative to its own disclaimer

The home card says *"Full 77-statement **forensic** belief profile"* and Drift says *"77-statement **forensic** scores"*. Inside the Belief Engine, the behavioral profile correctly disclaims: *"These are **not diagnoses, labels, or predictions**… pressure-tendency estimates."* The public-facing "forensic" framing (a word associated with objective scientific/legal certainty) is in tension with the tool's own honest, interpretive self-description. The disclaimer only appears *after* the user finishes — the entry framing oversells.

### D.4 — LOW: "Study" as a verb is mild jargon

"Open Study to investigate…" — "Study" is used as a mode/verb. Understandable from context but not defined. Low risk; the surrounding description carries it.

### D.5 — LOW: "Pressure-test" metaphor is never literally unpacked for first-timers

The term is evocative and appears on the primary Truth action, but a brand-new user is not told plainly it means "submit it as a public claim so others can challenge it with evidence." The Truths-page intro paragraph gets close; the metaphor mostly lands. Low severity.

---

## E. Overclaim / Trust Risks (Ranked by Severity)

### E.1 — MEDIUM: Verdict labels can read as HumanX issuing authoritative rulings

The verdict filter ("Proven", "Disproven", "Reality Collapse") sits in the global searchbar with no qualifier. Combined with undefined methodology (D.2), a new user could read these as HumanX's *own authoritative judgements* — directly contrary to the hero promise "it does not decide what is true." The submit helperText does clarify "Scores reflect what evidence has been submitted — not an automatic verdict", but that text is mode-scoped and not shown beside the filter. **Mitigation present but not co-located with the risk.**

### E.2 — LOW: "working system" / "LIVE" badges are fine; hero framing is strong

The hero subtitle and noscript notice both explicitly say HumanX "does not decide what is true" / "does not automatically decide what is true." This is the single best trust signal on the platform and is well-placed. No overclaim in the landing framing itself. ✅

### E.3 — LOW: Sensitive beliefs — no endorsement, no censorship in onboarding copy

No onboarding copy endorses or condemns any belief category. The Truths framing ("records what is asserted, not whether it is correct") and the Belief Engine intro ("No correct answers. No religion assigned.") both maintain neutrality. The seven sensitive test beliefs (per D-97A) are unaffected by any onboarding wording. ✅ No action needed.

### E.4 — INFO: No admin-concept leakage in public onboarding

"Review" tab is visible to all, but the *queue* requires an admin token (renderReview gates content behind `adminToken()`). The tab label "Review" + helperText ("Pending items are not public. Approve makes an item public.") describes the moderation concept transparently without exposing controls. Archive/borderline/artefact admin concepts do not appear in public onboarding copy. ✅ Acceptable — transparency about moderation existing is good; the tools stay gated.

---

## F. Existing Hardening Test Coverage

Searched `scripts/hardening-smoke-test.mjs`:

**Covered (navigation wiring only):**
- `convertTruth` activates `tab-arena` before navigating to Study
- `evidenceCard` Study button uses `studyFromVault`
- `copyTruthId` clipboard wiring

**NOT covered (wording / onboarding — coverage gap):**
- No test locks the hero "it does not decide what is true" framing
- No test locks the noscript "does not automatically decide what is true"
- No test locks the Belief Engine "not diagnoses … pressure-tendency estimates" disclaimer
- No test locks any tab label
- No test locks the submit-helper "not an automatic verdict" qualifier
- No test asserts Truth→Claim action wording consistency

**This is the single biggest durability gap:** the platform's core trust promises are wording-only and unprotected — a future copy edit could silently weaken or remove them.

---

## G. Recommended D-98B Patch

### G.1 — Safe frontend-only (wording / CSS) — **RECOMMENDED**

| ID | Change | Risk | Rationale |
|---|---|---|---|
| W-1 | **Unify Truth→Claim action wording.** Update `helperText` (truths + drift branches) from "Send to Claim Review" to match the button: "Pressure-test as Claim" (keep a short clarifier "— submits it as a public claim for review") | Very low — text only | Fixes D.1; one consistent verb across all surfaces |
| W-2 | **Add a one-line verdict-methodology note beside the verdict filter** (or in arena helperText, co-located) e.g. "Verdicts summarise submitted evidence — HumanX does not rule on truth." | Low — text only | Addresses E.1 + D.2; co-locates the existing mitigation with the risk |
| W-3 | **Soften "forensic" on public Belief Engine entry copy** — home card and Drift: "structured 77-statement belief profile" (or "in-depth"), reserving the honest "pressure-tendency, not diagnosis" framing | Low — text only | Aligns entry framing with the tool's own disclaimer (D.3) |
| W-4 | **(Optional) brief glossary / "What do these mean?" affordance** for Truth / Claim / Pressure-test / Verdict on the home page | Low — additive UI | Addresses D.2/D.5 for first-timers; can be a collapsible note |

**Smallest meaningful patch:** W-1 + W-2. They fix the one real inconsistency (D.1) and co-locate the anti-overclaim qualifier with the verdict vocabulary (E.1) — the two MEDIUM items most likely to mislead — with pure text changes and zero behavior impact.

### G.2 — Needs backend / schema / API thought

| ID | Change | Why deferred |
|---|---|---|
| B-1 | Per-verdict tooltip/definition sourced from the actual scoring model | Requires exposing scoring thresholds/definitions from the Worker scoring logic; not a pure copy change |
| B-2 | First-run onboarding tour / dismissible state | Requires client persistence (localStorage) + possibly a `seen_onboarding` concept; larger than a wording pass |

### G.3 — Do not build

| ID | Rejected change | Reason |
|---|---|---|
| X-1 | Renaming "Truths" / "Claims" / "Pressure-test" wholesale | Established product vocabulary; D-92C/D-97B already tuned the trust framing around these terms; churn risk |
| X-2 | Removing the verdict filter | It is a legitimate browse tool; the fix is a qualifier, not removal |
| X-3 | Content warnings on sensitive belief categories | Policy: socially real beliefs recorded not endorsed, not censored |
| X-4 | Moving the "Review" tool into public view or hiding the "Review" tab | Current gating is correct; transparency about moderation is a feature |

---

## H. Suggested Hardening Tests for D-98B

Whether or not wording changes land, these lock the core trust promises (addresses the F gap):

| # | Test |
|---|---|
| 1 | `renderHome` hero contains "does not decide what is true" (anti-overclaim lock) |
| 2 | `index.html` noscript contains "does not automatically decide what is true" |
| 3 | Belief Engine `index.html` contains "not diagnoses" AND "pressure-tendency" (interpretive-framing lock) |
| 4 | Belief Engine intro contains "No correct answers" / "No religion assigned" (neutrality lock) |
| 5 | Submit helperText contains "not an automatic verdict" (anti-overclaim lock) |
| 6 | Truth→Claim action wording is consistent: `helperText` truths branch references "Pressure-test as Claim" (asserts W-1) |
| 7 | Arena/searchbar carries a verdict-methodology qualifier (asserts W-2) — e.g. "does not rule on truth" present in arena helperText |
| 8 | Home Belief Engine card no longer uses "forensic" (asserts W-3) — or, if W-3 not taken, a no-op placeholder is omitted |
| 9 | Truths helperText still contains "records what is asserted, not whether it is correct" (D-92C regression lock) |

Tests 1–5 and 9 are pure regression locks and can be added even with **no wording change** — they protect what already exists. 6–8 only apply if the corresponding W-change is implemented.

---

## I. Final D-98B Recommendation

**Implement G.1 W-1 + W-2 as a small frontend-only wording pass, and add hardening tests H.1–H.5 + H.9 to lock the existing trust promises regardless.**

Rationale:
- The platform's onboarding framing is already strong — the hero "does not decide what is true" and the Belief Engine "not diagnoses" disclaimer are excellent and should simply be **protected by tests** (they are currently unguarded — the biggest durability risk found).
- The only genuine inconsistency is **D.1** (three phrasings for one action) — a pure text fix (W-1).
- The only MEDIUM overclaim risk is **E.1/D.2** (undefined verdict vocabulary readable as authoritative rulings) — fixable by co-locating the existing "not an automatic verdict" qualifier with the verdict filter (W-2).
- Optionally fold in **W-3** (drop "forensic" from public entry copy) since it is a one-word change that aligns the entry with the tool's own honest framing.

Defer B-1/B-2 (verdict definitions from the scoring model; first-run tour) — correct long-term, but require backend/state work outside a wording pass. Build nothing from G.3.

---

## J. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated.
> No admin token was used.

---

## K. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **299 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
