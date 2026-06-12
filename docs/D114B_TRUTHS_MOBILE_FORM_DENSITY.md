# D-114B — Collapse Truths Add-Form on Mobile

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js` (markup), `public/styles.css`. Plus static coverage + docs. No Worker, no D1, no Wrangler.
**Static baseline:** 403 / 24 / 56 → **416 / 24 / 56**
**Audit basis:** D-114A Truths form-above-list density audit (Option A)

---

## What Changed

### 1. Add-a-Truth form wrapped in a `<details>` (markup, `renderTruths`)

```html
<details class="truth-add-details">
  <summary class="truth-add-summary">Add a public Truth</summary>
  <div class="panel compact-form hx-form"> …existing form, fields unchanged… </div>
</details>
```

No `open` attribute → collapsed by default. All field IDs (`truthStatement`, `truthCategory`, `truthOrigin`, `truthType`), the submit button (`onclick="submitTruth()"`), and `submitTruth()` itself are unchanged — the elements remain in the DOM, so submission works identically. The form stays **above** the truth list, so the empty-state "Use the form above…" copy remains accurate.

### 2. CSS — mobile collapse, desktop force-expand

```css
.truth-add-summary{cursor:pointer;font-size:11px;text-transform:none;color:var(--blue);padding:4px 0;font-weight:600}
@media(min-width:601px){
  .truth-add-details > summary{display:none}
  .truth-add-details > *:not(summary){display:revert}
}
```

- **Phones (≤600px):** native collapsed `<details>` — the form is hidden behind a tappable "Add a public Truth" summary, so the truth list rises toward the top of the fold.
- **Desktop/tablet (≥601px):** the summary is hidden and the form children are force-shown (`display:revert` overrides the closed-`<details>` UA hiding), so the page looks exactly as before — expanded form, no toggle.

---

## Why Mobile Truths Browsing Needed the Form Collapsed

Per D-114A C.1, the always-expanded form (h3 + 3 inputs + type label + 6-option select + submit + note) was the tallest block above the list. On a phone, browsing Truths — the page's primary public intent — required scrolling past the entire submission form. Collapsing it on phones lifts the truth list near the fold while keeping the contribution flow one tap away.

## Why Desktop/Tablet Remain Expanded

Desktop has ample vertical space, and the form being immediately usable is fine there. To match the D-113B precedent ("compress mobile, preserve desktop"), the `@media(min-width:601px)` rule force-expands the form and hides the summary — desktop/tablet render byte-for-byte as before.

## Why Field IDs and `submitTruth()` Were Preserved

`submitTruth()` reads `#truthStatement`/`#truthCategory`/`#truthOrigin`/`#truthType` via `getElementById`. Wrapping the form in `<details>` keeps those elements in the DOM with unchanged IDs, so submission behaviour is identical — no API, payload, or validation change. (Note: the task brief referenced `truthText`, but the actual field is `truthStatement`; the real IDs were preserved and not renamed.)

---

## Hardening Tests Added (Section 54 — 13 new tests, 403 → 416)

| # | Test |
|---|---|
| 54.1 | Add form wrapped in `.truth-add-details` |
| 54.2 | `<summary>` with add-truth wording |
| 54.3 | Field IDs unchanged (truthStatement/Category/Origin/Type) |
| 54.4 | `submitTruth()` call + function unchanged |
| 54.5 | Mobile default collapsed (no `open` attr) |
| 54.6 | Desktop ≥601px force-expands + hides summary |
| 54.7 | Form remains above the truth list |
| 54.8 | Empty-state "form above" copy remains |
| 54.9 | "Public means visible, not proven" framing remains |
| 54.10 | D-111 submit trust note remains |
| 54.11 | D-112 tab cue + active-tab scroll remain |
| 54.12 | D-113 `.cc-card-when` mobile-hide rule remains |
| 54.13 | No backend/D1/wrangler/deploy references added in `renderTruths` |

README hardening count updated to 416.

---

## Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — markup + CSS only |
| No deploy/D1/live/admin/token mutation | ✅ |
| No truth form removal | ✅ — form intact, just collapsible on mobile |
| No trust/source hardening weakened | ✅ — D-111/D-112/D-113 + "visible, not proven" all preserved |
| Submission behaviour unchanged | ✅ — IDs + `submitTruth()` identical |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 403 passed, 0 failed | **416 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 56 passed | **56 passed** |
| `node --check public/app-v10.js` | OK | **OK** |
