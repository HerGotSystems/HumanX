# D-125G Mobile Layout Stress Audit

**Cycle:** 6 of 6 (D-125 hardening chain)
**Branch:** `fix/d125g-mobile-layout-stress`
**Date:** 2026-06-14
**Personas:** P3 incognito/no-token user (390px); P5 confused normal user (768px)
**Hard rules:** No deploy. No Wrangler. No D1 query. No production writes. No admin token.

---

## Scope

Static code audit of mobile layout across all key surfaces at 390px and 768px.

Files read:
- `public/styles.css` (558 lines — all breakpoints catalogued)
- `public/index.html` (nav, filter bar)
- `public/app-v10.js` (renderHome, renderArena, card, renderSubmit, renderReview, renderDrift, renderStudy, renderTruths, renderVault, renderExport)
- `public/apps/humanx-belief-engine/index.html` (all screens, all CSS)
- `public/apps/humanx-belief-engine/humanx-bridge.js` (no canvas/layout concerns found)

---

## CSS Breakpoint Summary (main app — styles.css)

| Breakpoint | Rules |
|---|---|
| ≤900px | Single-column layout (`grid → block`), `html/body overflow:auto`, tabs `overflow-x:auto` with fade mask, sidebar hidden |
| ≤600px | Card grid 2-col, `cc-card-when` hidden, review admin bar/token form/actions stack to column, vault grid 1-col, analysis/test-form 1-col, Truths add-form becomes `<details>`, runpack actions column |
| ≤480px | Modal padding reduced, modal actions column-reverse, stance row stacks |
| ≤400px | Card grid 1-col |

---

## Audit Areas

### 1. Home — card grid + nav tabs (390px and 768px)

**Nav tabs:** At ≤900px, `.tabs` uses `flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none` with a right-fade mask-image gradient. All 9 tabs (Home / Beliefs / Drift / Claims / Submit / Evidence / Truths / Review / RunPack) are reachable by horizontal scroll. No tab is hidden or clipped. **PASS.**

**Card grid:** `.cc-card-grid` is `repeat(auto-fill,minmax(240px,1fr))` at base. At ≤600px → `1fr 1fr` (2 columns). At ≤400px → `1fr` (1 column). At 390px the 1-col layout applies. `.cc-card-when` (date) hidden at ≤600px — expected, consistent with D-125B N3 note. `.cc-title{font-size:34px}` at ≤600px — readable. **PASS.**

**Searchbar:** Hidden in home mode (`.mode-home .searchbar{display:none}`) — correct, no overflow. Visible only in Claims/Arena and Truths modes. **PASS.**

---

### 2. Belief Engine — intro, identity, quiz, timeline, result screens

**Intro screen:** `.intro-sub{max-width:560px}` inside `.screen{padding:24px}`. At 390px, effective content width ~342px, max-width constrained — fine. `.intro-logo::before/after{max-width:60px}` — flex shrink handles narrow widths. **PASS.**

**Identity screen:** `.id-wrap{width:100%;max-width:680px;padding:32px 24px}` — width:100%, padding reduces to effective 342px at 390px. `.id-skip-banner` not checked for fixed widths; no known issue. **PASS.**

**Quiz screen:** `.quiz-wrap{width:100%;max-width:760px;padding:24px}` — width:100%, fine. `.resp-dot{width:12px;height:12px}` — tap target small but these are circular selection dots, not primary CTAs. **PASS.**

**Timeline screen:** `.timeline-wrap{width:100%;max-width:680px;padding:32px 24px}` — fine. `.timeline-input{width:100%;min-height:52px}` — full-width textarea, fine. **PASS.**

**Results screen — radar canvas:** ⚠ **ISSUE FOUND AND PATCHED.**
- `<canvas id="radar-canvas" width="360" height="360">` sets the intrinsic bitmap to 360×360px.
- CSS `#radar-canvas{display:block;margin:0 auto}` had no `max-width` constraint.
- `#screen-results{padding:0}` (overrides `.screen` padding), but `.results-wrap{padding:32px 24px 64px}` gives 24px left+right = 48px consumed. At 390px, content width = **342px**. The 360px canvas overflowed by **18px**, causing horizontal scroll on the results screen at 390px.
- **Patch applied:** `#radar-canvas{display:block;margin:0 auto;max-width:100%;height:auto}` — CSS display scaling caps the rendered canvas at container width while preserving aspect ratio. The 360×360 bitmap still renders at full resolution; only display size scales.

**Results screen — other elements:**
- `canvas#share-canvas{width:100%}` — already responsive. **PASS.**
- `.results-actions{flex-wrap:wrap}` + `.btn-action{flex:1;min-width:140px}` — wraps to 2-wide then 1-wide at 390px. **PASS.**
- `.dim-name{width:110px;flex-shrink:0}` + `.dim-score{width:30px;flex-shrink:0}` — 140px of fixed flex items leaves ~202px for the bar on 342px content. **PASS.**
- `.timeline-age{width:72px;flex-shrink:0}` — 72px leaves 262px for text. **PASS.**
- `.frag-pct-bar{width:120px;flex-shrink:0}` — 120px in frag rows, ample remaining space. **PASS.**
- `.constellation{grid-template-columns:repeat(3,1fr)}` → collapses to `repeat(2,1fr)` at ≤800px. At 390px with 24px side padding, 2-col = ~(342-8)/2 ≈ 167px per pill. `.node-pill{padding:8px 10px;font-size:11px}` — fits comfortably. No 1-col collapse at ≤390px, but 2-col is acceptable for short label strings. **PASS (minor density note — see N1).**
- `constellation-canvas width="320"` — at 342px available, the 320px bitmap fits within content area. **PASS.**

---

### 3. Claims / Submit (390px and 768px)

**Submit form:** `.form-panel{max-width:520px}` — max-width (not min-width), collapses to full width on mobile. Inputs are `width:100%`. Submit button full-width. Post-button note visible. `claimQualityHints()` injects inline `<li>` elements — no layout risk. **PASS.**

**Claims list (Arena):** Card grid collapses as per Area 1 above. Filter bar verdict qualifier `<span class="verdict-qualifier small">` — `small` class is `font-size:12px`, inline, wraps naturally. `.cat-chips{flex-wrap:wrap}` — chips wrap. **PASS.**

---

### 4. Drift (390px)

**Drift page:** `.layout{grid-template-columns:1fr}` at ≤900px. No sidebar. Drift timeline cards are block-level, full-width. `.actions{flex-wrap:wrap}` at ≤900px — action buttons wrap. Drift head badge now `b-yellow` (D-125D patch, not a layout issue). **PASS.**

---

### 5. Review / admin (390px)

**Review token form:** `.review-admin-bar{flex-direction:column;align-items:stretch}` at ≤600px. Token input + button: `.review-token-form{flex-direction:column}` + input/button `width:100%`. **PASS.**

**Review cards:** `.review-actions{flex-direction:column}` at ≤600px. Approve/Reject stack vertically. Tap targets become full-width — ideal on mobile. **PASS.**

**Inspect panel:** `.review-inspect-fields{grid-template-columns:1fr}` + `.review-inspect-actions{flex-direction:column}` + `.review-inspect-top-actions{flex-direction:column}` at ≤600px. All controls reachable. **PASS.**

---

### 6. Public browsing — Truths + Study + Evidence Vault (390px)

**Truths list:** Truths add-form: at ≤600px, form is wrapped in `<details>` — collapsible on mobile, always open at ≥601px. `truthCard()` renders "not verified" badge inline — wraps naturally. **PASS.**

**Study view:** `.study-grid{grid-template-columns:1fr}` at ≤900px. `.study-verdict-qualifier` is a `<p>` element, block-level, wraps. `.analysis-detail-grid{grid-template-columns:1fr}` at ≤600px. **PASS.**

**Evidence Vault:** `.vault-group-grid{grid-template-columns:1fr}` at ≤600px. Source links rendered via `sourceLink()` with `word-break` or natural wrapping on long URLs — no fixed-width overflow. **PASS.**

---

### 7. CSS risk scan — fixed widths, overflow:hidden, tap targets

**Fixed widths causing overflow:** Only `#radar-canvas width="360"` (patched above). All other fixed widths (`width:110px`, `width:72px`, `width:120px`) are flex-items with flex:1 siblings that absorb remaining space. **PASS after patch.**

**`overflow:hidden` clipping controls:** Used only on progress/bar track elements (`overflow:hidden` on `.dim-bar`, `.align-bar`, `.gap-bar-track`, `.behav-bar`, `.frag-pct-bar`, `.result-layer`) — all are decorative bars or card containers, not interactive controls. No interactive control is clipped. **PASS.**

**Tap targets:** Primary CTAs (Submit, Approve, Reject, nav tabs, Belief Engine buttons) are all `padding:10px+` or `min-height:44px+`. `.resp-dot{width:12px}` on the quiz response selection dots — small, but they are supplementary to a larger clickable row. Not a stop condition. **PASS (minor note — see N2).**

**Action bars not wrapping:** `.actions{flex-wrap:wrap}` at ≤900px. `.results-actions{flex-wrap:wrap}`. `.review-actions{flex-direction:column}` at ≤600px. `.runpack-actions{flex-direction:column}` at ≤600px. All verified. **PASS.**

**Horizontal overflow from core layout:** None identified except the patched radar canvas. **PASS after patch.**

---

### 8. Stop conditions check

| Condition | Status |
|---|---|
| Mobile nav unusable | PASS — tab scroll with fade mask; all 9 tabs reachable |
| Primary action unreachable | PASS — Submit, Approve/Reject, BE action buttons all reachable |
| Result unreadable | PASS after patch — radar canvas now constrained to container width |
| Review gate / admin controls broken | PASS — token form and action buttons stack to full-width column |
| Horizontal overflow from core layout | PASS after patch — only radar canvas was overflowing |

---

## Patch Summary

| File | Change | Reason |
|---|---|---|
| `public/apps/humanx-belief-engine/index.html` | `#radar-canvas`: added `max-width:100%;height:auto` | Prevent 360px canvas overflowing 342px content width at 390px viewport |

---

## Non-blocking Notes

**N1 — Constellation grid stays 2-col at 390px:** `.constellation` collapses from 3-col to 2-col at ≤800px but not to 1-col at ≤400px. At 390px the 2-col grid is ~167px per pill — readable for typical node labels (≤20 chars). No action required; could add a ≤480px 1-col rule in a future polish pass if labels become longer.

**N2 — Quiz resp-dot tap targets are 12px:** The circular response-state dots on quiz questions are 12px diameter. The entire response card row is clickable, so the dots are visual affordance, not the hit target. No action required.

**N3 — `/api/health` reference in D-125A docs:** D-125A Cycle 5 step 5g references `/api/health`; the actual public health-like endpoint in the Worker is `/api/graph-status`. Carried forward from D-125F N1. Noting again for record. Non-blocking; no tester-facing impact.

---

## Checks

```
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
```

---

## Verdict: PATCHED

One CSS layout patch applied to the Belief Engine radar canvas. No stop conditions. All checks pass.

---

## D-125 Cycle Status

| Cycle | Doc | Verdict |
|---|---|---|
| D-125B | D125B (pre-chain) | — |
| D-125C | D125C (pre-chain) | — |
| D-125D | `D125D_DRIFT_SAVED_RESULTS_AUDIT.md` | PATCHED |
| D-125E | `D125E_CLAIM_REVIEW_AUDIT.md` | PASS |
| D-125F | `D125F_PUBLIC_BROWSING_AUDIT.md` | PASS |
| D-125G | `D125G_MOBILE_LAYOUT_AUDIT.md` | PATCHED ⭐ |

**D-125 chain is complete. No D-125H backlog consolidation required.**

All six cycles done. No open stop conditions. Three open PRs pending manual merge (D-125D, D-125E, D-125F branches already on remote; D-125G branch ready for push after this commit).
