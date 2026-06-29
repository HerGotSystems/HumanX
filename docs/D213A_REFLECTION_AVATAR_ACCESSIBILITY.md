# D-213A — Reflection Avatar Accessibility Polish

**Scope:** Frontend only
**Status:** LIVE CLOSEOUT COMPLETE
**Baseline:** 1980 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Backend changes:** None
**Migration:** None
**Schema change:** None
**Public avatar:** None
**Public profile change:** None

---

## Purpose

Make the private Reflection Avatar card, transparency disclosure, and hide/show controls comfortable for keyboard users, screen reader users, and mobile users. No data model changes. No public profile changes. No new JS state.

---

## Changes: `public/app-v10.js`

### `type="button"` on all buttons

All three `<button>` elements inside `meReflectionAvatarHtml` now carry `type="button"`:

| Button | Location |
|---|---|
| "Show again" | Hidden placeholder return |
| "Hide this" | `hideControl` constant (appears in empty + populated card returns) |

Prevents browsers from treating them as submit buttons if the card ever ends up inside a form context.

### `aria-label="Reflection avatar — private section"` on card wrappers

Added to all three card wrapper divs:

| State | Wrapper |
|---|---|
| Hidden placeholder | `<div class="panel me-avatar-card me-avatar-hidden" aria-label="Reflection avatar — private section">` |
| Empty state (no activity) | `<div class="panel me-avatar-card" aria-label="Reflection avatar — private section">` |
| Populated card | `<div class="panel me-avatar-card" aria-label="Reflection avatar — private section">` |

Gives screen reader users an orientation landmark without changing visual output.

### Native `<details>`/`<summary>` unchanged

The transparency disclosure continues to use native `<details>`/`<summary>` — no custom JS state. This gives built-in keyboard activation (Enter/Space on `<summary>`) and screen reader expand/collapse semantics for free.

---

## Changes: `public/styles.css`

### `:focus-visible` rings

| Selector | Effect |
|---|---|
| `.me-avatar-hide-btn:focus-visible` | 2px blue outline, 2px offset, 2px radius |
| `.me-avatar-why-summary:focus-visible` | 2px blue outline, 2px offset, 2px radius |
| `.me-avatar-hidden .btn-mini:focus-visible` | 2px blue outline, 2px offset |

Uses `var(--blue, #57b8ff)` — consistent with existing HumanX focus patterns. `:focus-visible` only activates for keyboard navigation, not mouse clicks.

### Mobile touch targets (32px minimum height)

| Selector | Change |
|---|---|
| `.me-avatar-hide-btn` | `min-height:32px`, `display:inline-flex`, `align-items:center`, `padding:2px 0` |
| `.me-avatar-why-summary` | `min-height:32px`, `display:inline-flex`, `align-items:center`, `padding:2px 0` |

Ensures "Hide this" and the disclosure "How this is formed" summary are comfortably tappable on mobile without changing visual appearance for desktop.

---

## Keyboard behavior (expected after deploy)

| Action | Keyboard |
|---|---|
| Focus "Hide this" | Tab |
| Activate "Hide this" | Enter or Space |
| Focus "Show again" (after hiding) | Tab |
| Activate "Show again" | Enter or Space |
| Focus "How this is formed" | Tab |
| Toggle disclosure open/closed | Enter or Space |
| Navigate disclosure content | Tab |

---

## Screen reader behavior (expected after deploy)

- Card announced as "Reflection avatar — private section" landmark
- "Hide this" button announced as a button (not a link)
- "Show again" button announced as a button
- "How this is formed" disclosure announced with expand/collapse state via native `<details>`
- Hidden placeholder copy announced: "Reflection avatar hidden on this device." + "This only changes your private My HumanX view." + "Show again" button

---

## Copy guardrails

### New copy added — none

No new user-visible copy was added. The `aria-label` value "Reflection avatar — private section" is machine-readable only.

### Forbidden copy still absent

- truth level, purity, ideology type, religious alignment, smart score, HumanX rank, good believer, bad believer: all absent from avatar function

---

## Public profile non-exposure

No changes to `renderPublicProfileHtml`. The following remain absent from the public render path, confirmed by smoke tests:
- `Hide this`
- `Show again`
- `Reflection avatar hidden on this device`
- `How this is formed`
- `me-avatar-hidden`
- `me-avatar-why`

---

## Smoke tests added

23 new D-213A tests covering:
- "Show again" has `type="button"`
- "Hide this" has `type="button"`
- No `<button>` in avatar function without `type="button"`
- Hidden placeholder card has `aria-label`
- Populated card has `aria-label`
- `aria-label` mentions "private section"
- Disclosure uses `<details>` and `<summary>`
- "How this is formed" text present
- No new JS disclosure toggle function added
- `.me-avatar-hide-btn:focus-visible` CSS defined
- `.me-avatar-why-summary:focus-visible` CSS defined
- `.me-avatar-hidden .btn-mini:focus-visible` CSS defined
- `min-height:32px` on hide button
- `min-height:32px` on summary
- 6 public profile isolation checks
- No migration file
- D-213A comment present

---

## Deploy

Owner deployed manually from local terminal after commit `e9ecdc4`. No migration required.

### Live sanity checklist — D-213B — ALL PASS

| Check | Expected | Actual |
|---|---|---|
| Card reads normally visually | No regression | PASS |
| "Hide this" click works | Hides card | PASS |
| "Show again" click works | Restores card | PASS |
| Hidden placeholder appears correctly | Present | PASS |
| Hidden state persists after refresh | Persists | PASS |
| Transparency disclosure opens/closes normally | Works | PASS |
| Keyboard tab reaches "Hide this" | Reachable | PASS |
| Keyboard activation works on "Hide this" (Enter/Space) | Hides card | PASS |
| Keyboard tab reaches "Show again" | Reachable | PASS |
| Keyboard activation works on "Show again" (Enter/Space) | Restores card | PASS |
| Keyboard tab reaches disclosure summary | Reachable | PASS |
| Keyboard activation opens/closes disclosure (Enter/Space) | Opens/closes | PASS |
| Focus-visible ring on "Hide this" (keyboard focus) | Visible blue outline | PASS |
| Focus-visible ring on "Show again" (keyboard focus) | Visible blue outline | PASS |
| Focus-visible ring on disclosure summary (keyboard focus) | Visible blue outline | PASS |
| Mobile/touch layout does not overflow or break | No overflow | PASS |
| Guardrail copy visible after restore | Present | PASS |
| Private notice visible after restore | Present | PASS |
| Reflection avatar absent from public profile | Absent | PASS |
| Hide/show controls absent from public profile | Absent | PASS |
| Hidden placeholder absent from public profile | Absent | PASS |
| Transparency disclosure absent from public profile | Absent | PASS |
| No forbidden wording on public profile | All absent | PASS |

### Confirmations

- **Owner deploy:** PASS (manual `wrangler deploy` from owner terminal)
- **Keyboard behavior:** PASS — Tab reaches all three interactive elements; Enter/Space activates each; focus order logical
- **Focus-visible rings:** PASS — blue outline appears on keyboard focus for "Hide this", "Show again", and disclosure summary; does not appear on mouse click
- **Mobile touch targets:** PASS — 32px min-height on hide button and disclosure summary; no overflow on mobile viewport
- **Private-only:** PASS — Reflection Avatar remains private; `meReflectionAvatarHtml` not called from `renderPublicProfileHtml`
- **localStorage-only unchanged:** PASS — no changes to hide/show state storage; `humanx.me.reflectionAvatar.hidden` still the only key used
- **No public profile/avatar exposure:** PASS
- **No backend changes:** PASS
- **No API changes:** PASS
- **No migration:** PASS
- **No schema changes:** PASS
- **No CSP changes:** PASS
- **No external asset changes:** PASS

### Final baselines

- **Hardening smoke:** 1980 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 warn (pre-existing, non-blocking)
