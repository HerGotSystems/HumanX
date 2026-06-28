# D-188A — Claim Sharing UI Audit

**Date:** 2026-06-28
**Method:** Source-code review — `public/app-v10.js`, `public/styles.css`
**Starting state:** HEAD `cf8c6a8` · Baseline 1537/24/57
**Scope:** Planning claim-link copy/share UI. No code changes in this patch.

---

## Pre-existing note: two legacy smoke test failures

Two D-93B legacy tests assert `docs/README.md` contains `"254 passed, 0 failed"` — an old count that has not been correct for many patches. These tests pre-date this session and are not caused by D-187 or D-188A. They show as 1535 passed / 2 failed in the runner but do not reflect any current regression. Recommend updating them in a dedicated cleanup patch.

---

## Current state — claim sharing across all UI surfaces

### 1. Arena claim cards (`card()` function, line ~151)

Each claim is rendered as an `<article class="card claim-card">` via `card(c, actions=false)`. The entire card element carries `data-action="cardSelectClaim"` and acts as a navigation target.

When called with `actions=true` (Arena mode), a secondary "Investigate →" button is added inside `<div class="actions">`. There is **no copy-link button and no share affordance of any kind** on any claim card.

### 2. Study view header (`renderStudy()`, line ~360)

Study mode renders a `<div class="study-actions">` containing exactly one button:

```html
<div class="study-actions">
  <button class="primary" data-action="generateRunPack" ...>Build RunPack</button>
</div>
```

There is **no "Copy link", "Share", or direct-URL action** in the Study header or anywhere in Study mode output. The user who wants to share a specific claim currently has no mechanism to do so from within the app — they must manually construct the URL.

### 3. Public profile claim rows (`renderPublicProfileClaimsHtml()`, line ~254)

Each row has:
```
[claim text] [category badge] [View in HumanX → button]
```
`View in HumanX →` calls `openPublicProfileClaimStudy(id)` — it opens Study mode inside the SPA. There is **no copy link**, and no `/c/:id` URL is exposed.

### 4. My HumanX claim rows (`meRecentClaimsHtml()`, line ~273)

Public claims show: `[badge] [text] [timestamp] [Open Study →] [Archive]`

Claims in review/pending show only: `[badge] [text] [timestamp] [Archive]`

There is **no copy-link button** anywhere in the My HumanX claim list. An owner who wants to share their own claim has no in-app way to get the URL.

### 5. RunPack / Export view (`renderExport()`, line ~356)

The export view shows the currently-selected claim's text and status as context, then the RunPack packet. The only copy action is `copyAIP()` (copies the packet text). There is **no direct-URL button** alongside the claim context.

### 6. Existing copy utilities and patterns

| Function | Style | URL built | Dispatch table |
|----------|-------|-----------|----------------|
| `copyTruthId(id)` | `toast('Truth ID copied')` | Raw ID only (not URL) | `_D181E_ID_ACTIONS` |
| `meCopyProfileLink()` | btn mutation + toast fallback | `/u/${slug}` | `_D181B_ZERO_PARAM_ACTIONS` |
| `copyPublicProfileLink(btn, slug)` | btn mutation + `execCommand` fallback | `/u/${slug}` | `_D181E_ID_ACTIONS` (data-slug) |
| `copyAdminInviteCode(code)` | toast | raw code | `_D181E_ID_ACTIONS` (data-id) |
| `copyAIP()` | toast | RunPack text | `_D181B_ZERO_PARAM_ACTIONS` |

**Closest model for a `copyClaimLink` function:**

`copyPublicProfileLink(btn, slug)`:
```js
function copyPublicProfileLink(btn, slug) {
  const url = `${location.origin}/u/${encodeURIComponent(slug||'')}`;
  btn.textContent = 'Copied!';
  btn.disabled = true;
  const reset = () => { btn.textContent = 'Copy profile link'; btn.disabled = false; };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(()=>setTimeout(reset, 1500)).catch(()=>reset());
  } else {
    // execCommand fallback
    setTimeout(reset, 1500);
  }
}
```

Button mutation (textContent → "Copied!" → reset after 1500 ms) is the established pattern. The `navigator.clipboard` path with `execCommand` fallback is already in place. A `copyClaimLink` function can be identical in structure, using `btn.dataset.id` for the claim ID.

### 7. `location.origin` usage

Both profile copy functions use `location.origin` — not a hardcoded domain. This is the correct approach for claim links too:
```js
`${location.origin}/c/${encodeURIComponent(id)}`
```
Works on production, staging, and local dev without changes.

### 8. Dispatch system

The global click handler delegates through four action tables. A `copyClaimLink` action fits in `_D181E_ID_ACTIONS` (takes the button, reads `data-id`):
```js
copyClaimLink: b => copyClaimLink(b, b.dataset.id)
```

No new dispatch infrastructure needed.

---

## Answers to audit questions

| Question | Answer |
|----------|--------|
| Where should `Copy claim link` appear first? | Study view `study-actions` — user is already viewing the specific claim; one button, no card-list noise |
| Should claim cards get a small share button? | Not in first iteration — `card()` is called everywhere including review queues; adding to cards spreads risk across surfaces and adds visual weight to an already dense card layout |
| Should public profile claims expose direct claim links? | Yes, but as P2 — `renderPublicProfileClaimsHtml` is low risk and isolated; useful for visitors who want to share a specific claim found on a profile |
| What is the safest first implementation? | Study view only — one function, one dispatch entry, one button; mirrors profile link pattern exactly |
| What wording avoids confusing users? | "Copy link" (matches the profile footer); not "Share" (implies social platform flow); not "Copy claim ID" (sounds technical) |
| Does copy use `/c/:id` with current origin? | Yes — `${location.origin}/c/${encodeURIComponent(selected.id)}` |

---

## Recommended UI placements — ranked by priority

### P1 — Study view `study-actions` (D-188B core)

**Where:** Next to "Build RunPack" in `<div class="study-actions">`.

**Why P1:**
- User is already focused on one claim
- No list-rendering changes — only `renderStudy` is modified
- `study-actions` already has `display:flex; gap:6px`; a second `btn-mini` button sits naturally beside it
- At ≤900px, `.actions` wraps — buttons stack cleanly on mobile
- No risk of touching card(), dispatch tables are trivially extended

**Proposed HTML:**
```html
<div class="study-actions">
  <button class="primary" data-action="generateRunPack" ...>Build RunPack</button>
  <button class="btn-mini" data-action="copyClaimLink" data-id="${esc(selected.id)}">Copy link</button>
</div>
```

**Proposed function:**
```js
function copyClaimLink(btn, id) {
  const url = `${location.origin}/c/${encodeURIComponent(id||'')}`;
  btn.textContent = 'Copied!';
  btn.disabled = true;
  const reset = () => { btn.textContent = 'Copy link'; btn.disabled = false; };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(()=>setTimeout(reset, 1500)).catch(()=>reset());
  } else {
    try {
      const t = document.createElement('textarea');
      t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
    } catch(e) {}
    setTimeout(reset, 1500);
  }
}
```

**Dispatch addition** (one line, `_D181E_ID_ACTIONS`):
```js
copyClaimLink: b => copyClaimLink(b, b.dataset.id)
```

**Smoke test additions:** function exists, `data-action="copyClaimLink"` in renderStudy, `/c/` in copyClaimLink source, `location.origin` used, dispatch entry present.

---

### P2 — My HumanX claim rows, public claims only (`meRecentClaimsHtml`)

**Where:** After "Open Study →" button, for claims with `review_state === 'public'` only.

**Why P2:** Owner is the most motivated person to share their own claim link. Low risk — one isolated render function, condition already exists (`isPublic`).

**Proposed addition** (inside `isPublic` guard):
```html
<button class="btn-mini" data-action="copyClaimLink" data-id="${esc(c.id)}">Copy link</button>
```

No new function or dispatch entry needed — reuses the same `copyClaimLink` from P1.

---

### P2 — Public profile claim rows (`renderPublicProfileClaimsHtml`)

**Where:** After "View in HumanX →" button.

**Why P2:** Visitor browsing a public profile may want to share a specific claim, not the whole profile. Low risk — isolated render function, no auth implications (all rows are already confirmed public).

**Proposed addition:**
```html
<button class="btn-mini" data-action="copyClaimLink" data-id="${esc(c.id)}">Copy link</button>
```

Same reused function. No additional wiring.

---

### P3 — Arena claim cards (`card()`)

**Why P3 / defer:** `card()` is called in Arena, search results, and potentially review views. Adding a copy button to every card increases visual weight significantly. The Study-mode copy button covers the common "I want to share this specific claim" use case. Cards are better suited to navigation, not sharing. Revisit after Study copy is in production.

---

### P3 — RunPack export view

**Why P3 / defer:** The export flow is already copy-heavy (Build RunPack → Copy → Paste). Adding a direct-URL copy button here would be useful for sharing context alongside a RunPack, but it's a second-order need. Revisit after P1/P2.

---

## Mobile placement notes

- `study-actions` at ≤900px: `.actions{flex-wrap:wrap}` applies — buttons wrap to next line, each with `min-width:100px`. The "Copy link" button is 9 chars — comfortably fits, wraps gracefully.
- `me-item-row` rows at ≤640px: no explicit flex-wrap, but rows already scroll. A third `btn-mini` in a claim row is tight on very narrow screens — acceptable for P2, worth testing.
- `pp-item-row` at ≤640px: `gap:6px` — a third button may push the row tall. Worth testing on 375px before shipping P2.
- The `btn-mini` min-height of 36px (styles.css line ~97) meets acceptable tap-target size on mobile (though 44px is the iOS HIG recommendation).

---

## What not to touch in D-188B or later

| Item | Reason |
|------|--------|
| `selectClaim`, `studyFromVault`, `attachEvidencePrompt` | Hard rule — do not modify |
| `card()` function | Risk too high for first iteration — touches all card surfaces including review queue |
| Review / admin pages | Out of scope |
| CSP, auth, tokens, migrations | Out of scope |
| `openPublicProfileClaimStudy` / `openMyClaimStudy` | Navigation, not sharing — leave as-is |
| `copyTruthId` | Truth IDs are not URLs — leave as-is |

---

## Risk ranking summary

| Surface | Risk | Value | D-188B? |
|---------|------|-------|---------|
| Study header `study-actions` | Low | High | Yes — core |
| My HumanX public claims | Low | Medium | Optional in same patch |
| Public profile claims | Low | Medium | Optional in same patch |
| Arena claim cards | Medium | Low | Defer to D-188C+ |
| RunPack export view | Low | Low | Defer |

---

## Recommended D-188B scope

**Minimum:** Study view "Copy link" button only.
- Add `copyClaimLink(btn, id)` function
- Add `copyClaimLink` to `_D181E_ID_ACTIONS`
- Add `data-action="copyClaimLink"` button in `renderStudy()` `study-actions` div
- Add to `window.copyClaimLink = copyClaimLink` exports
- Add smoke tests (5–6 new tests in Section 101)

**Extended (same patch, low risk):** Also add `Copy link` to My HumanX public claims and public profile claims using the same function — no new logic, just two additional `btn-mini` buttons in isolated render functions.

**Leave for D-188C:** Arena card copy, RunPack context copy.
