# D-221A — Public Profile Accessibility Polish

**Scope:** CSS + tests + docs
**Status:** LIVE CLOSEOUT COMPLETE (D-221B)
**Baseline:** 2221 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D221A_PUBLIC_PROFILE_ACCESSIBILITY.md`, `docs/README.md`
**App UI changes:** None (`app-v10.js` unchanged)
**CSS changes:** Yes (2 rules added)
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**New public classes:** None (rules target existing classes only)
**Deploy needed:** Yes (styles.css changed)

---

## Purpose

Make the public profile page easier to use with keyboard, screen readers, and mobile/touch without adding new public data or changing privacy boundaries.

D-220A introduced `.pp-item-actions` as a wrapper for claim action buttons. D-221A adds the missing CSS for:

1. **Keyboard focus ring** — `.pp-item-actions .btn-mini:focus-visible` was absent. Tab navigation to claim action buttons had no visible focus indicator in the public profile context.
2. **Mobile touch target** — `.btn-mini` has `min-height:36px` globally. The mobile media query already raised `btn-pp-show-more`, footer buttons, and other controls to `min-height:44px`. Claim action buttons inside `.pp-item-actions` were not covered by the existing mobile rule. D-221A adds `min-height:44px; padding:10px 12px` for `.pp-item-actions .btn-mini` on `max-width:640px`.

---

## What was already correct (no changes needed)

- `<details>/<summary>` for "About this profile page" — native keyboard support, no JS state needed ✓
- `.pp-vocab-summary:focus-visible` — already had focus ring from D-220A ✓
- `aria-expanded` / `aria-controls` on "Show N more" buttons — already present from D-216A/D-220A ✓
- Button text "View in HumanX →" and "Copy link" — descriptive, screen-reader readable ✓
- Empty state messages "No public claims yet." and "No public truths on this profile yet." — `pp-empty` class (muted/italic), does not imply private/hidden data ✓
- Heading hierarchy: h2 "Public Profile" → h3 section headings — correct ✓
- Mobile footer buttons `min-height:44px` — already in existing media query ✓

---

## CSS changes

Added after the D-220A block in `public/styles.css`:

```css
/* D-221A: focus-visible and mobile touch for public profile action buttons */
.pp-item-actions .btn-mini:focus-visible{outline:2px solid var(--blue,#57b8ff);outline-offset:2px;border-radius:2px}
@media(max-width:640px){.pp-item-actions .btn-mini{min-height:44px;padding:10px 12px}}
```

Both rules are scoped to `.pp-item-actions` — no impact on `.btn-mini` usage elsewhere in the app.

---

## Keyboard / screen-reader / mobile behavior

| Interaction | Behavior after D-221A |
|---|---|
| Tab to "View in HumanX →" button | Focus ring visible (2px solid blue, 2px offset) |
| Tab to "Copy link" button | Focus ring visible (same style) |
| Touch tap on claim action button (mobile ≤640px) | Min touch target 44px height |
| Screen reader reads claim action | "View in HumanX →" / "Copy link" — descriptive text |
| Screen reader reads context disclosure | Native `<details>/<summary>` — "About this profile page, collapsed" |
| Tab to context disclosure summary | Focus ring visible (`.pp-vocab-summary:focus-visible` — unchanged from D-220A) |
| Screen reader reads empty claims section | "No public claims yet." — plain text, no error or hidden implication |
| Screen reader reads empty truths section | "No public truths on this profile yet." — same |

---

## Public allowlist compliance

No new public HTML classes or copy added. Existing `PUBLIC_PROFILE_ALLOWED_MARKERS` allowlist (D-216A + D-220A) unchanged. No `PUBLIC_PROFILE_PRIVATE_DENYLIST` entries added or removed.

---

## Confirmations

- **No new public data fields:** Confirmed — CSS change only
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **D-214A / D-215A / D-216A privacy locks still active:** Confirmed — 2221 / 0 passed

---

## New tests (D-221A — 12 tests)

1. Public profile context block uses native `<details>`/`<summary>`
2. Public profile disclosure summary has focus-visible CSS
3. Public claim action row remains present and keyboard reachable
4. Public action button text is accessible and descriptive
5. `pp-item-actions .btn-mini:focus-visible` CSS defined (D-221A new)
6. `pp-item-actions .btn-mini` mobile touch target `min-height:44px` added (D-221A new)
7. Empty states do not imply private/hidden data
8. No private My HumanX wording in public render path (confirms D-215A still active)
9. No Reflection Avatar / hide-show in public render path (confirms D-214A still active)
10. No new private field reads in public render path
11. Deploy integrity — D-221A absent from worker.js
12. README references D221A

---

## Live sanity checklist — D-221B PASS

Owner deploy completed from terminal. All checks PASS.

- [x] Live HumanX opened after deploy
- [x] Public profile page opened (`/u/your-slug`)
- [x] Page loads without console-breaking errors
- [x] Claim action buttons remain visible and correctly placed in `pp-item-actions`
- [x] Keyboard Tab reaches public claim action buttons
- [x] Keyboard focus-visible ring appears on claim action buttons
- [x] Focus ring appears only for keyboard focus, not mouse click
- [x] Enter/Space activates action controls as expected for the element type
- [x] On mobile/narrow width, claim action buttons have comfortable touch target height
- [x] On mobile/narrow width, action buttons do not overflow the card
- [x] Context disclosure "About this profile page" still opens/closes normally
- [x] Counts card placement from D-220 remains intact
- [x] Public truths empty state remains intact: "No public truths on this profile yet."
- [x] No private My HumanX controls appear
- [x] No Reflection Avatar appears
- [x] No hide/show controls appear
- [x] No transparency disclosure from avatar appears
- [x] No localStorage/device-local wording appears
- [x] No forbidden wording (truth level / purity / ideology type / religious alignment / smart score / HumanX rank / good believer / bad believer)
- [x] Public profile does not expose new data fields

---

## D-221B live closeout record

- **Owner deploy:** PASS — deployed from owner terminal
- **Hardening smoke post-deploy:** 2221 passed / 0 failed
- **Worker route static post-deploy:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`)
- **Focus-visible ring on claim action buttons:** PASS — visible on keyboard Tab; not triggered by mouse
- **Mobile/touch target on claim actions:** PASS — `min-height:44px` applied at ≤640px; buttons did not overflow card
- **Context disclosure ("About this profile page"):** PASS — opens/closes, keyboard accessible
- **Counts card placement (D-220A):** PASS — still above snapshot and claims
- **Public truths empty state (D-220A):** PASS — message still renders
- **Public allowlist unchanged:** PASS — no new markers; D-216A contract still active
- **No new public data fields:** PASS — CSS-only change confirmed
- **No private My HumanX exposure:** PASS — no dashboard controls visible
- **No Reflection Avatar / public avatar exposure:** PASS — avatar absent from public profile
- **No forbidden wording:** PASS
- **No backend/API/migration/schema/CSP/external asset changes:** PASS
