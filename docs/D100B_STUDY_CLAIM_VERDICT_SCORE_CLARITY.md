# D-100B — Study / Claim Verdict & Score Clarity Pass

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 312 / 24 / 39 → **324 / 24 / 39**
**Audit basis:** D-100A Study/Claim evidence display trust audit

---

## What Changed

### 1. Study verdict qualifier (W-1)

Added a subtle qualifier line directly below the score meters in the Study header, where the verdict badge is most prominent:

```html
<p class="study-verdict-qualifier small">Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty.</p>
```

```css
.study-verdict-qualifier{color:var(--muted);opacity:.7;font-size:10px;margin:4px 0 0;line-height:1.3}
```

This carries the D-98B framing — previously only on the global searchbar — onto the Study view itself, the surface where users actually read and dwell on a verdict.

### 2. Score meter tooltips (W-2)

`meter(n,v)` now derives a per-meter `title` tooltip from the label, with no change to the score value or bar:

| Meter | Tooltip |
|---|---|
| Evidence | "Evidence score reflects submitted support quality and quantity." |
| Testability | "Testability reflects how directly the claim can be checked." |
| Survivability | "Survivability reflects how well the claim holds under pressure." |

Matching is by label prefix (`/^Evidence/`, `/^Test/`, `/^Surviv/`) so both the Study labels (Evidence/Testability/Survivability) and the compact card labels (Evidence/Test/Survive) resolve correctly. The score legend line in the Study header (item 1) additionally frames all three as "the current submitted packet, not absolute certainty."

### 3. helperText reinforcement (W-3)

The arena/study (default) side-panel helperText now includes:

```html
<p class="small review-first-note">Verdicts are pressure-test labels, not automatic truth rulings.</p>
```

placed before the existing "Use the search bar and verdict filter" line.

---

## Why the Verdict Qualifier Was Added Near Study/Claim Surfaces

D-100A's HIGH finding: the large `cls(status)`-coloured verdict badge ("Proven" green / "Disproven" red) sits next to the claim title in the Study header, but the D-98B qualifier was added **only to the global searchbar**. On the Study view — where the verdict is largest and users spend the most time — nothing nearby explained it summarises submitted evidence rather than a HumanX ruling. W-1 closes that gap on the surface that matters most, completing the trust/clarity arc: Review (D-93–96) → Truths/onboarding (D-97–98) → Claims/Study (D-100).

## How Scores / Meters Are Now Framed

Previously the three meters showed a raw 0–100 number + bar with no explanation (D-100A finding D.2). Now:
- Each meter has a hover `title` tooltip describing what it measures.
- A one-line legend under the meter row states scores reflect "the current submitted packet, not absolute certainty."

No score value, threshold, calculation, or bar rendering changed — only explanatory text was added.

---

## What Was NOT Changed

| Preserved | Confirmation |
|---|---|
| Verdict names | unchanged (Proven / Plausible / Disproven / Reality Collapse / …) |
| Verdict colours / classes | `cls()` mapping intact — green/red/blue/yellow unchanged; **no recolour** |
| Score calculations | no change — `meter()` still clamps and displays the same value |
| API payloads / backend routes | untouched |
| D1 schema / data | untouched |
| Review / admin moderation behavior | untouched |
| Sensitive/social claim framing | neutral — no censorship or endorsement language added |

---

## Hardening Tests Added (Section 43 — 12 new tests, 312 → 324)

| # | Test |
|---|---|
| 43.1 | Study view carries a verdict qualifier (`study-verdict-qualifier`) |
| 43.2 | Qualifier says "pressure-test label" + "not an automatic truth ruling" |
| 43.3 | Score framing mentions "submitted packet" + "not absolute certainty" |
| 43.4 | `meter()` emits a `title` tooltip |
| 43.5 | Meter tooltips cover Evidence, Testability, Survivability |
| 43.6 | Evidence/Testability/Survivability meter labels remain present in Study |
| 43.7 | Verdict colour/class logic (`cls`) not removed |
| 43.8 | arena/study helperText reinforces verdict framing |
| 43.9 | D-98B global searchbar verdict qualifier remains present |
| 43.10 | D-97B Truth "visible" / NOT VERIFIED protections remain present |
| 43.11 | `.study-verdict-qualifier` CSS rule defined |
| 43.12 | No backend/D1/wrangler/deploy references added in `meter()` |

---

## Safety Confirmation

| Check | Status |
|---|---|
| No score logic changes | ✅ — `meter()` value/bar unchanged; tooltip text only |
| No verdict class/colour changes | ✅ — `cls()` intact, no recolour |
| No backend/schema/API/data changes | ✅ — display text/CSS only |
| No moderation/admin actions | ✅ |
| No deploy/D1/live mutation | ✅ |
| Sensitive claims neutral | ✅ — no censorship/endorsement language |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 312 passed, 0 failed | **324 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |
