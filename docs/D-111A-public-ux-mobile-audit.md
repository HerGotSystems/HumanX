# D-111A — Public UX / Mobile Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 375 / belief-engine-static-check 24 / worker-route-static-check 56

Audits the public HumanX experience (desktop + narrow/mobile) after the D-103→D-110 security/public-trust pass.

---

## A. Files Read

| File | Focus |
|---|---|
| `public/index.html` | shell, nav tabs, searchbar, side dock, noscript |
| `public/app-v10.js` | `render`/`setMode`, `renderHome`, `renderSubmit`, `renderArena`, `renderStudy`, `renderTruths`, `renderVault`, `renderExport`, `helperText` |
| `public/styles.css` | all `@media` breakpoints (900/600/480/400px), `.layout`, `.sidepanel`, `.tabs`, `.searchbar`, `.cc-hero`, `.cc-card-grid`, study/review/modal rules |
| `public/apps/humanx-belief-engine/index.html` | intro/entry framing (cross-ref D-98A) |
| `docs/D110A_…`, `docs/README.md` | current baseline |

---

## B. Public UX Flow Map (with responsive behavior)

```
index.html shell:
  header.commandbar (flex, wraps — D-101B): brand · nav tabs · statusline
    tabs (9): Home · Beliefs · Drift · Claims · Submit · Evidence · Truths · Review · RunPack
      desktop: flex-wrap
      ≤900px: flex-wrap:nowrap + overflow-x:auto (horizontal-scroll strip, hidden scrollbar) ✅
  searchbar: search + verdict filter + verdict-qualifier (D-98B)
  layout: 2-col (workspace + 280px side dock) ; ≤900px → 1-col, main becomes block, overflow restored ✅

side dock (.sidepanel = Context/helperText + Attach/RunPack/Report tools):
  shown in: arena, study, truths, vault, review, drift
  HIDDEN (display:none) in: home, submit, export   ← see C.1

per-mode main column:
  home    → hero ("does not decide what is true") + pipeline + 7 action cards ; ≤900/600/400 grid reflows ✅
  submit  → Submit Claim form + writing-tips <details> (good/avoid examples)
  arena   → claim cards grid (Study buttons) ; cards reflow ≤900/600/400 ✅
  study   → header verdict + meters + qualifier (D-100B) + Claim Flow + Investigation Board (2-col → 1-col ≤900) ✅
  truths  → intro ("visible, not proven") + add form + truth cards
  vault   → reusable evidence cards
  export  → RunPack panel
  belief  → hard redirect to /apps/humanx-belief-engine/
```

---

## C. Findings (Ranked by Severity)

### C.1 — LOW–MEDIUM: Submit-mode trust line lives in a hidden panel

`renderSubmit` sets `#casefile.innerHTML = helperText()` (which for submit mode contains *"Scores reflect what evidence has been submitted — **not an automatic verdict**"*), but the side dock is `display:none` in submit mode (`.mode-submit .sidepanel{display:none}`). So **that framing line never displays on the submit surface.** The submit main panel has strong writing guidance (good vs avoid claims, falsifiability) but does **not** repeat the "not an automatic verdict" line.

Mitigation: the framing is visible elsewhere in the journey — the hero ("does not decide what is true") on home, the searchbar verdict-qualifier on arena, and the Study qualifier (D-100B). So a user who browses/studies sees it; only the *submit* surface omits it. Same pattern affects **home** and **export** helperText (computed, injected, but the dock is hidden) — home's hero compensates; export's "Packets do not publish anything" line is similarly not shown.

**Net:** minor — wasted helperText computation in 3 modes + one trust line that doesn't reach the submit surface. Not a safety regression.

### C.2 — LOW: "Review" tab is visible to the public

The nav shows a **Review** tab to everyone; clicking it shows an "admin only" badge + token form (content is gated server-side via `requireAdmin`). This is transparent-about-moderation by design (confirmed acceptable in D-98A/D-101A). No data leaks. Could optionally be de-emphasised, but not a defect.

### C.3 — LOW: 9 tabs on a narrow strip

On mobile the 9-tab nav becomes a horizontal-scroll strip with a hidden scrollbar. It works, but tabs past "Truths" (Review, RunPack) require horizontal scrolling that has no visible affordance (scrollbar hidden). Discoverability of the rightmost tabs is slightly reduced. Acceptable for a power-tool; a subtle fade/edge cue would be a nice-to-have.

### C.4 — INFO (good): Responsive coverage is solid
- Layout collapses 2-col → 1-col at ≤900px; `main` becomes block with scroll restored.
- Tabs horizontal-scroll at ≤900px.
- Study Investigation Board, review panel/fields/actions, modals (hx-modal at ≤480), RunPack actions, cc-card/cc-step grids — all have ≤900/600/480/400 rules.
- `.commandbar` flex layout (D-101B) prevents header stacking.
- Verdict-qualifier (`font-size:10px; flex-shrink:1`) wraps rather than overflowing.
No overflow or broken-layout risk found in the CSS for the main public surfaces.

### C.5 — INFO (good): No admin-ish copy leaks into public render paths
Borderline/artefact/category-echo advisories and full IDs are admin-gated (`adminToken()`); the public Truths/Study/arena copy carries only neutral, public-appropriate language. The Review *concept* is described transparently; the *tools* are gated.

### C.6 — INFO: "Does the public user understand HumanX does not decide truth?"
**Yes, on most surfaces:** hero (home) "it does not decide what is true"; searchbar "Verdicts are pressure-test labels, not automatic truth rulings" (arena); Study "Verdict is a pressure-test label, not an automatic truth ruling"; Truths "Public means visible, not proven". **Gap:** the submit surface (C.1) is the one place the framing is computed-but-hidden.

---

## D. Recommended D-111B Patch (optional, small frontend-only)

| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | **Surface the submit trust line in the submit main panel** — add to `renderSubmit`'s intro: "Scores reflect submitted evidence — not an automatic verdict." (the line currently lives only in the hidden dock) | Low — one display line | C.1 |
| W-2 | *(Optional)* Add a subtle right-edge fade/scroll cue to the mobile `.tabs` strip so the rightmost tabs (Review/RunPack) are discoverable | Low — CSS only | C.3 |
| W-3 | *(Optional, micro)* Skip computing `helperText()` for home/submit/export where the dock is hidden, or relocate their guidance into the main column | Very low | C.1 tidy-up |

**Smallest meaningful patch:** W-1 alone — it puts the "not an automatic verdict" framing where submitters actually see it, closing the one trust-framing gap. W-2/W-3 are polish.

### Do not build
- No verdict recolouring, no source-verification badges (standing D-105A/D-110A non-goals).
- No removal of the Review tab (transparency is intentional).
- No full responsive redesign — coverage is already adequate.

---

## E. Suggested Tests for D-111B (if patched)
| # | Test |
|---|---|
| 1 | `renderSubmit` main panel contains "not an automatic verdict" (or "not an automatic verdict"-equivalent) — asserts W-1 |
| 2 | Hero "does not decide what is true" still present (regression) |
| 3 | Searchbar + Study verdict qualifiers still present (D-98B/D-100B regression) |
| 4 | (if W-2) `.tabs` mobile rule retains `overflow-x:auto` |
| 5 | No backend/D1/wrangler/deploy references added |

---

## F. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, admin/moderation, token-rotation, or live mutation was performed.
> No admin token was used.

---

## G. Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **375 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
