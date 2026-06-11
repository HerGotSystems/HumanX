# D-100A — Study / Claim Evidence Display Trust Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 312 / belief-engine-static-check 24 / worker-route-static-check 39

---

## A. Files Inspected

| File | Sections read |
|---|---|
| `public/app-v10.js` | `renderArena`, `card`, `cls`, `meter`, `renderStudy`, `sectionArgumentFlow`, `sectionEvidence`, `sectionPressure`, `reviewStatusBadge`, `studyReviewBadge`, `helperText` (submit/arena/study), `CLAIM_TYPE_HINTS`, Review inspect score fields |
| `public/styles.css` | verdict/meter/study/badge classes (cross-referenced) |
| `scripts/hardening-smoke-test.mjs` | claim-card / verdict / score test coverage |
| `docs/D99A_PRODUCTION_CHECKPOINT...md`, `D-98A`, `D98B`, `D-97A`, `D97B` | Prior trust/clarity policy |

---

## B. Current Claim / Study Display Flow Map

```
CLAIM LIST (mode=arena, renderArena → card(c,true) × N)
  card():
    head: [verdict badge cls(c.status)]  [category chip]
          ── green: Proven / *Supported / rising
          ── red:   Disproven / *Collapse / falling
          ── blue:  Plausible
          ── yellow: everything else (Weak Evidence, Untestable, unknown)
    <h3> claim title
    reviewStatusBadge(c)        ← Public(green)/Pending/Rejected/Reported/Archived
    meta: type · by handle
    meters: [Evidence N] [Test N] [Survive N]   ← raw 0-100 + bar, NO tooltip
    votes: ▲ believe  ▼ reject  ~ unsure  ⊘ N pressure
    [Study Claim →]

STUDY DETAIL (selectClaim → renderStudy)
  header:
    [← Back]  [verdict badge cls(selected.status)]   ← same big coloured verdict
    <h2> claim title
    studyReviewBadge(selected)   ← Public/Pending/Rejected + note
    meta: category · type · by handle
    meters wide: [Evidence N] [Testability N] [Survivability N]  ← raw, NO explanation
    vote row + [Build RunPack]
  sectionArgumentFlow()  "Claim Flow — read this first"
    1 Why people think it is true (first evidence)
    2 What attacks it (first pressure)
    3 How to test it (first test)
    4 What analysis says (first analysis)
  sectionLineage()
  Investigation Board:
    Support Evidence | Pressure / Attacks | Tests | Analyses
      sectionEvidence(): groups analyses / direct / reused; good empty state
      sectionPressure(): groups Significant (sev≥3, red) / Other; good empty state

SIDE PANEL helperText:
  submit → "Scores reflect what evidence has been submitted — not an automatic verdict." ✅
  arena  → "Browse public claims… Badges: Public · Pending… Use the search bar and verdict filter." ✗ no verdict-methodology note
  study  → (uses arena/default branch — same, no verdict qualifier)
```

---

## C. Verdict / Evidence / Score Terminology Map

| Term | Where shown | Explained to user? | Notes |
|---|---|---|---|
| **Verdict status** (Proven/Disproven/Reality Collapse/…) | card head + study header — large coloured badge | 🔴 **No** — no qualifier on card or study; only the global searchbar (D-98B) and submit helper carry framing | Most prominent element; least qualified |
| **Evidence Score** | meter (card + study), raw 0-100 | 🔴 **No** — no tooltip, no legend | Bare number + bar |
| **Testability** | meter (study "Testability", card "Test") | 🔴 **No** | Bare number |
| **Survivability** | meter (study "Survivability", card "Survive") | 🔴 **No** | Bare number |
| **Support Evidence** | study section | ✅ "What currently supports this claim." | Good purpose line |
| **Pressure / Attacks** | study section | ✅ "What challenges, contradicts, or weakens it." | Good purpose line |
| **Significant vs Other pressure** | study sub-heads | ✅ severity grouping, red badge for ≥3 | Good |
| **Reused vs Direct evidence** | study section | ✅ grouped + labelled | Good |
| **Public / Pending / Rejected** | reviewStatusBadge | ✅ (D-97B; claims keep green Public) | Correct |
| **Claim type** (Religious/Belief etc.) | CLAIM_TYPE_HINTS (submit) | ✅ neutral ("Difficult to falsify — evidence scores will reflect that") | Good, non-endorsing |

---

## D. Trust / Confusion Risks (Ranked by Severity)

### D.1 — HIGH: Verdict badge on Study + Claim cards has no methodology qualifier

The large `cls(status)`-coloured verdict badge ("Proven" green, "Disproven"/"Reality Collapse" red) appears next to the claim title in **both** `card()` and the **study header** — the single most prominent element on each surface. D-98B added the qualifier *"Verdicts are pressure-test labels, not automatic truth rulings"* **only to the global searchbar**. It is absent from the Study view, where users actually read and dwell on a verdict. A user opening a claim sees a bold green **"Proven"** with nothing nearby explaining it summarises submitted evidence rather than a HumanX ruling — directly the gap D-98B set out to close, on the surface that matters most.

**This is the central finding and the natural completion of the D-98B arc.**

### D.2 — MEDIUM: Score meters are unexplained and have no tooltip

`meter()` renders a one-word label + raw 0-100 number + bar, with **no `title` attribute and no legend**. "Evidence 78 / Testability 40 / Survivability 22" is shown with zero explanation of what the numbers mean, how they are derived, or that they reflect *submitted* evidence and pressure rather than an authoritative measurement. A new user cannot interpret them and may read them as objective scores HumanX assigns.

### D.3 — MEDIUM: Verdict colour reinforces perceived authority

Green = the platform success colour. A green **"Proven"** verdict reads as HumanX endorsing the claim as true. Unlike the D-97B Truth "Public" badge (correctly neutralised), the claim verdict is *derived from evidence* so a colour is defensible — but without D.1's qualifier the colour amplifies the "HumanX decided this is true" misreading. Fixing D.1 (qualifier) largely mitigates this; recolouring is **not** recommended (verdicts legitimately summarise a computed state).

### D.4 — LOW: arena/study helperText omits the "not an automatic verdict" framing

Only **submit** mode's helperText carries "Scores reflect what evidence has been submitted — not an automatic verdict." A user browsing (arena) or studying never sees it in the side panel. Easy win to extend.

### D.5 — LOW: Truth-derived / weak / category-echo context is not surfaced on the public claim

The D-93D borderline/category-echo/truth-derived badges exist only in the **Review queue**. Once a Truth-derived claim is approved public, its card/study shows no origin context. By policy these are advisory-only and Review-scoped, so this is acceptable — noting it for completeness, **do not build** public borderline badges (would imply judgement on content).

---

## E. Evidence-Display Risks (Ranked by Severity)

### E.1 — MEDIUM: Weak/"vibes" evidence renders identically to documented evidence

Evidence carries a `quality` field (repeatable / documented / media / testimony / **vibes**). `sectionEvidence` groups by analyses / direct / reused but does **not** visually distinguish weak evidence quality within the direct group. A "vibes / weak argument" item appears with the same weight as a documented source. Pressure has severity grouping (Significant vs Other); evidence has no equivalent quality cue. A reader scanning support evidence cannot tell strong from weak at a glance.

### E.2 — LOW: Empty states are good (no risk)

Both `sectionEvidence` and `sectionPressure` have clear, instructive empty states ("No supporting evidence yet… add a source"; "No pressure or attacks yet… add an objection"). `sectionArgumentFlow` also fills each of its 4 steps with an explicit "none yet — add one" prompt. ✅ No action.

### E.3 — LOW: Low-score / low-evidence claims are not flagged as low-confidence

A claim with Evidence 5 and no pressure shows a low bar but no "insufficient evidence" framing — combined with D.2 (unexplained meters), a low score is just a small bar. Mitigated once D.2 adds meter context. Low priority.

### E.4 — INFO: Sensitive/social claims handled neutrally

`CLAIM_TYPE_HINTS` frames Religious/Belief as "Matters of faith… Difficult to falsify — evidence scores will reflect that" — neutral, non-endorsing, non-dismissing. The verdict label could still show "Disproven" on a sensitive claim, but that reflects submitted evidence; the correct fix is D.1's qualifier (verdicts are pressure-test labels), not special-casing categories. ✅ No content-based handling needed.

---

## F. Existing Test Coverage

| Covered | Test |
|---|---|
| `card()` calls `reviewStatusBadge(c)` | line 754 |
| Claim card keeps default green `reviewStatusBadge` (D-97B) | line 2474 |
| Submit helper "not an automatic verdict" present (D-98B) | line 2604 |
| Verdict qualifier present near **searchbar** filter (D-98B) | line 2627 |
| `.verdict-qualifier` CSS rule (D-98B) | line 2665 |

**Gaps (no test today):**
- No test that the Study view carries a verdict-methodology qualifier
- No test that score meters explain themselves (tooltip/legend)
- No test that arena/study helperText carries the "not an automatic verdict" framing
- No test locking the Evidence/Pressure section purpose lines or empty states
- No test on `cls()` verdict→colour mapping (regression risk)

---

## G. Recommended D-100B Patch

### G.1 — Safe frontend-only (wording / CSS / tooltip) — **RECOMMENDED**

| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | **Add the verdict-methodology qualifier to the Study view**, co-located with the verdict badge / meters. Reuse the D-98B line: "Verdict and scores summarise submitted evidence and pressure — not an automatic truth ruling." | Low — one display line | D.1 (HIGH), D.3 |
| W-2 | **Add `title` tooltips to the three meters** (and/or a one-line legend under the meter row): Evidence = "how much support has been submitted", Testability = "how checkable the claim is", Survivability = "how well it holds up under submitted pressure". State they reflect submitted material. | Low — `title` attrs + optional legend | D.2 (MEDIUM) |
| W-3 | **Extend arena + study helperText** to include "Verdicts and scores reflect submitted evidence — not an automatic verdict." (mirror the submit-mode line) | Very low — text | D.4 |
| W-4 | **Surface evidence `quality` visually** in `sectionEvidence` — e.g. a small muted quality tag (documented / testimony / weak) per item, or a "weak argument" cue for `vibes`, mirroring pressure's severity grouping | Low–medium — display only | E.1 |

**Smallest meaningful patch:** W-1 + W-2. W-1 closes the HIGH gap (verdict qualifier where the verdict is most prominent); W-2 makes the scores interpretable. Both are pure display/tooltip changes with no behavior impact. W-3 is a cheap add-on; W-4 is the optional stretch.

### G.2 — Needs backend / schema / API thought
| ID | Change | Why deferred |
|---|---|---|
| BE-1 | Per-meter definitions sourced from the actual `claim-scoring.js` thresholds (authoritative tooltips) | Requires exposing scoring model constants to the frontend |
| BE-2 | A computed "confidence / sufficiency" indicator (e.g. "low evidence volume") | Requires backend aggregation rules |

### G.3 — Admin / manual operations only
| ID | Item |
|---|---|
| OPS-1 | None required for D-100B — this is a public-display clarity pass |

### G.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Recolouring/removing the verdict badge | Verdict legitimately summarises a computed state; qualifier is the right fix, not colour removal |
| DN-2 | Public borderline/category-echo badges on approved claims | Advisory-only, Review-scoped by policy; implies content judgement |
| DN-3 | Special-casing sensitive claim categories in verdict/score display | Violates content-neutrality policy |
| DN-4 | Auto-hiding low-score claims | No auto-hide policy (D-92C) |

---

## H. Suggested Hardening Tests for D-100B

| # | Test |
|---|---|
| 1 | Study view (`renderStudy`) contains a verdict-methodology qualifier ("not an automatic truth ruling" or equiv.) — asserts W-1 |
| 2 | `meter()` emits a `title` attribute (or a meter legend exists) — asserts W-2 |
| 3 | arena/study helperText contains "not an automatic verdict" (or "reflect submitted evidence") — asserts W-3 |
| 4 | `sectionEvidence` keeps its empty-state copy ("No supporting evidence yet") — regression lock |
| 5 | `sectionPressure` keeps its empty-state copy + severity grouping ("Significant pressure") — regression lock |
| 6 | `cls()` maps Proven→green, Disproven/Collapse→red, Plausible→blue (verdict-colour regression lock) |
| 7 | (if W-4) evidence `quality` surfaced — `sectionEvidence` references a quality tag/class |
| 8 | No backend/D1/wrangler/deploy references added in the changed display helpers |

Tests 4–6 are pure regression locks and can land even with no wording change.

---

## I. Final D-100B Recommendation

**Implement G.1 W-1 + W-2 (+ cheap W-3) as a small frontend-only display-clarity pass, with hardening tests H.1–H.6.**

Rationale:
- **D.1 is the through-line of the entire D-93→D-98 trust arc:** D-98B added the verdict qualifier to the searchbar, but the Study view — where the verdict badge is largest and users dwell — never got it. W-1 closes that gap on the surface that matters most.
- **D.2 (unexplained meters) is the second real gap:** three raw 0-100 numbers with no tooltip or legend are uninterpretable and can read as authoritative scores. W-2 fixes this with `title` attributes / a one-line legend — zero behavior change.
- The Study view's structure is otherwise strong (good empty states, good evidence/pressure purpose lines, severity grouping, neutral claim-type hints) — so D-100B should be a *light* clarity pass, not a redesign.
- W-4 (evidence quality cue) is worthwhile but slightly larger; fold in only if the change stays purely display-level. Defer BE-1/BE-2 (scoring-model-sourced definitions). Build nothing from G.4.

This completes the trust/clarity arc: Review (D-93–96) → Truths/onboarding (D-97–98) → **Claims/Study (D-100)**.

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
| `node scripts/hardening-smoke-test.mjs` | **312 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
