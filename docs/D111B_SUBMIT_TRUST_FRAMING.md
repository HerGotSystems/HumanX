# D-111B — Surface Submit Trust Framing in Main Panel

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. Plus static coverage + docs. No Worker, no D1, no Wrangler.
**Static baseline:** 375 / 24 / 56 → **383 / 24 / 56**
**Audit basis:** D-111A public UX / mobile audit (finding C.1)

---

## What Changed

### 1. Visible trust note in the submit main panel

`renderSubmit` now renders a compact trust note directly in the visible main column, after the intro paragraph and before the writing-tips `<details>`:

```html
<p class="small submit-trust-note">Scores reflect submitted evidence — not an automatic verdict.</p>
```

### 2. CSS

```css
.submit-trust-note{color:var(--muted);opacity:.8;font-size:11px;font-style:italic;margin:2px 0 8px}
```

Subtle, muted, readable on desktop and mobile; compact.

---

## Why Submit Needed Visible Trust Framing

D-111A finding C.1: the submit-mode `helperText()` already contained "Scores reflect what evidence has been submitted — not an automatic verdict", but it is injected into the side dock (`#casefile`), which is `display:none` in submit mode (`.mode-submit .sidepanel{display:none}`). So that framing **never displayed on the submit surface** — the one public surface where the "not an automatic verdict" message is most relevant (the user is about to create a claim). Every other surface carries the framing (home hero, arena searchbar qualifier, Study qualifier, Truths "visible, not proven"); submit was the gap. This patch surfaces the line where submitters actually read it, without redesigning the flow.

---

## Preserved (unchanged)

| Item | Status |
|---|---|
| Submit form fields | ✅ |
| Good/avoid writing-tips examples | ✅ |
| Claim submission API behavior | ✅ untouched |
| Home / arena / study / truths / vault / review / export behavior | ✅ |
| Side-dock hiding rules (`.mode-submit/.mode-home/.mode-export .sidepanel`) | ✅ unchanged |
| Source-safety + admin hardening (D-104/D-106/D-107) | ✅ |
| `helperText()` submit line | ✅ still present (now mirrored visibly) |

---

## Hardening Tests Added (Section 51 — 8 new tests, 375 → 383)

| # | Test |
|---|---|
| 51.1 | Submit main panel shows a visible trust note (`submit-trust-note` + "not an automatic verdict") |
| 51.2 | Trust note is inside `renderSubmit`, not only `helperText` |
| 51.3 | `.submit-trust-note` CSS rule defined |
| 51.4 | Hero "does not decide what is true" remains |
| 51.5 | Study verdict qualifier remains |
| 51.6 | Truths "visible, not proven" copy remains |
| 51.7 | No "verified/trusted source" wording added |
| 51.8 | No backend/D1/wrangler/deploy references added in `renderSubmit` |

README hardening count updated to 383.

---

## Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — display text/CSS only |
| No claim submission behavior change | ✅ — `saveClaim`/`/api/claims` untouched |
| No deploy/D1/live mutation | ✅ |
| No admin/moderation action | ✅ |
| No token rotation | ✅ |
| No source verification/trust wording | ✅ |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 375 passed, 0 failed | **383 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 56 passed | **56 passed** |
