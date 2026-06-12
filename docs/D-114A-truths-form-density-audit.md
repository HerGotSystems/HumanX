# D-114A — Truths Form-Above-List Density Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 403 / belief-engine-static-check 24 / worker-route-static-check 56

Follows up D-113A finding C.2 (deferred from D-113B): the Truths page renders the always-expanded "Add a Truth" form above the truth list, pushing browsable content below the fold on a phone.

---

## A. Files Read

- `public/app-v10.js` — `renderTruths`, `submitTruth`, `truthCard`, empty-state
- `public/styles.css` — `.hx-form`, `.compact-form`, `.claim-guide`, `details`/`summary` styling, Truths mobile rules
- `scripts/hardening-smoke-test.mjs`
- `docs/D-113A`, `D113C`, `README.md`

---

## B. Current Truths Render Path & Mobile Density Map

`renderTruths` builds (top → bottom):

```
section-head: <h2>Truths</h2> + "widely asserted · not auto-verified" badge + graphBox()
intro <p>: "…Public means visible, not proven. Recording a truth here does not verify it. Use Pressure-test as Claim…"
┌─ .panel.compact-form.hx-form — "Add a Truth"  ← always expanded, ABOVE the list
│   <h3> Add a Truth
│   input #truthStatement
│   input #truthCategory
│   input #truthOrigin
│   <p> "Truth type"
│   select #truthType (6 options)
│   <button> Submit Truth for Review
│   <p> "Enters Review before going public."
└─
[admin only] renderTruthAdminBar + renderTruthFilterBar
<div #truth-grid-container .grid.truth-grid> truthCard × N  (or empty-state)
```

**Mobile (≤414px):** section-head + intro paragraph + the **full ~8-element Add-a-Truth panel** all render before the first truth card. The truth grid is 1-col on phones, so a browsing user scrolls past the entire submission form to reach any actual Truth. The form is the **single tallest block above the list**.

- `submitTruth()` reads `#truthStatement`/`#truthCategory`/`#truthOrigin`/`#truthType` via `getElementById` → any wrapper that keeps the elements in the DOM (e.g. `<details>`) preserves submission.
- The empty-state copy says *"Use the form **above** to record a statement…"* → the form should remain **above** the list for that copy to stay accurate.
- `<details>`/`<summary>` is already a **styled, established pattern** (10 uses in `app-v10.js`; `details summary` + `.claim-guide` CSS exist), so reusing it for the form is low-risk and visually consistent.

---

## C. Findings (Ranked by Severity)

### C.1 — MEDIUM: Add-a-Truth form blocks the truth list above the fold on mobile
The always-expanded form (h3 + 3 inputs + type-label + 6-option select + submit button + review note) is the tallest pre-list block. On a phone, browsing Truths requires scrolling past the whole submission form. For a public page whose **primary mobile intent is browsing** what circulates as fact, the **contribution form is secondary** but currently occupies the prime above-the-fold real estate.

### C.2 — LOW: Browse-vs-add priority is inverted for the common visitor
Most public visitors arrive to *read* Truths, not to *add* one. The current order optimises for the rarer action (adding). This is a priority/ordering observation, not a bug.

### C.3 — INFO (good): Form, submission, and trust copy are otherwise fine
The form is correct, `submitTruth` is robust (ID reads), and the intro carries the "Public means visible, not proven" trust framing. No safety issue — purely density/ordering.

---

## D. Option Evaluation

| Option | Effect | Verdict |
|---|---|---|
| **A — `<details>` collapsed on mobile only** (expanded on desktop via CSS) | Mobile: form collapses to a tappable "Add a Truth" summary; truth list rises near the fold. Desktop: unchanged (force-expanded). | ✅ **Recommended** — fixes the actual problem (mobile), preserves desktop exactly (matches D-113B "compress mobile, preserve desktop" philosophy). Slightly clever CSS (force-open ≥601px). |
| B — `<details>` collapsed on all sizes | Simplest/most robust code; consistent browse-first model everywhere. | ⚠ Changes desktop default (form starts collapsed) — the task flags "changing desktop default unexpectedly" as a risk. Good fallback if a desktop change is acceptable. |
| C — Keep form expanded, move below list | Browse-first; but breaks the empty-state "form above" copy and puts the form under an empty-state message when the list is empty. | ✗ More moving parts; copy change; awkward empty state. |
| D — Jump link / sticky mini button | Adds nav chrome; form still occupies full height. | ✗ Doesn't reduce density; adds complexity. |
| E — Do nothing | — | Acceptable (polish-level), but C.1 is a real, cheap-to-fix mobile gap. |

---

## E. Recommended D-114B Patch

**Option A — wrap the Add-a-Truth form in a `<details>` that is collapsed on mobile (≤600px) and force-expanded on desktop (≥601px).**

Implementation sketch:
1. In `renderTruths`, wrap the existing `.panel.compact-form.hx-form` block in:
   ```html
   <details class="truth-add-details" id="truth-add">
     <summary class="truth-add-summary">+ Add a Truth</summary>
     <div class="panel compact-form hx-form"> …existing fields unchanged… </div>
   </details>
   ```
   (IDs `#truthStatement` etc. unchanged → `submitTruth` unaffected.)
2. CSS:
   ```css
   /* desktop/tablet: behave as always-open, hide the toggle */
   @media(min-width:601px){
     .truth-add-details > summary{display:none}
     .truth-add-details > *:not(summary){display:revert}
   }
   /* phones: native collapsed <details>; summary is the affordance */
   .truth-add-summary{cursor:pointer}
   ```
   At ≥601px the form shows expanded with no summary (desktop unchanged); at ≤600px it's a tappable "+ Add a Truth" that expands on demand.

This keeps the form **above** the list (empty-state copy stays valid), preserves submission, reuses the existing `<details>` styling, changes nothing on desktop, and lifts the truth list toward the top of the fold on phones.

**If the team prefers minimal/robust over clever CSS:** fall back to **Option B** (collapsed everywhere) — one markup change, no media-query force-open — accepting the mild desktop change. Recommend A to stay consistent with D-113B's desktop-preserving precedent.

---

## F. Do-Not-Build

| Item | Reason |
|---|---|
| Removing the Add-a-Truth form | Contribution flow must remain reachable |
| Moving form below the list (Option C) | Breaks "form above" empty-state copy; awkward empty state |
| Hiding the form entirely on mobile with no affordance | Would block contribution on phones |
| Changing `submitTruth` / field IDs / API | Out of scope; submission must stay identical |
| Removing the "Public means visible, not proven" trust framing | Safety copy must remain |
| Sticky buttons / jump-nav chrome | Over-engineering; doesn't reduce density |

---

## G. Suggested Hardening Tests for D-114B

| # | Test |
|---|---|
| 1 | Add-a-Truth form still present in `renderTruths` (`#truthStatement`, `#truthCategory`, `#truthOrigin`, `#truthType`, Submit button) |
| 2 | Form wrapped in `<details class="truth-add-details">` with a `<summary>` |
| 3 | CSS force-expands `.truth-add-details` at ≥601px (desktop unchanged) — `@media(min-width:601px)` rule present |
| 4 | `submitTruth` still reads the four field IDs (submission unchanged) |
| 5 | `#truth-grid-container` / truth list still renders |
| 6 | Empty-state copy still references the form |
| 7 | D-113B `.cc-card-when` mobile-hide remains; D-111 submit trust note remains; D-112 tab cue + active-tab scroll remain |
| 8 | "Public means visible, not proven" trust copy remains |
| 9 | No backend/D1/wrangler/deploy references added |

---

## H. Final D-114B Recommendation

**Implement Option A** — wrap the Add-a-Truth form in a `<details>` collapsed on phones (≤600px) and force-expanded on desktop (≥601px) via a small media-query rule. It fixes the real mobile density gap (C.1) while leaving desktop byte-for-byte unchanged, keeps the form above the list (empty-state copy valid), preserves `submitTruth`, and reuses the app's existing `<details>` pattern. It is a small JS markup change + ~4 lines of CSS. **Option B** (collapse everywhere) is the acceptable simpler fallback if a desktop default change is fine. Build nothing from Section F.

This remains **polish-level density tuning, not a safety issue** — the Truths page is correct and trust-framed today; D-114B just makes browsing reachable sooner on a phone.

---

## I. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, admin/moderation, token-rotation, or live mutation was performed.

---

## J. Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **403 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
