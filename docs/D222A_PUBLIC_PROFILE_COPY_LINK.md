# D-222A — Public Profile Copy Link Affordance

**Scope:** Frontend/CSS + tests + docs
**Status:** COMPLETE — pending owner deploy
**Baseline:** 2237 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D222A_PUBLIC_PROFILE_COPY_LINK.md`, `docs/README.md`
**App UI changes:** Yes (copy button added to profile header; helper updated)
**CSS changes:** Yes (`.pp-copy-link` class added)
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes (app-v10.js and styles.css changed)

---

## Purpose

Add a prominent "Copy profile link" button to the public profile header card so that any viewer (owner or non-owner) can easily copy and share the current profile URL. Previously, only non-owners had a copy-link button in the footer — owners had no copy affordance, and the footer position was easy to miss.

---

## What changed

### `public/app-v10.js`

**`copyPublicProfileLink(btn, slug)`** — updated:
- Uses `window.location.href` instead of constructing `location.origin + /u/ + slug` — more reliable and handles any URL variation
- Shows `'Link copied'` on success (previously `'Copied!'` — D-156A test updated to match)
- Shows `'Copy failed — use browser address bar'` when clipboard write fails — provides a visible, instructive fallback message instead of silent reset
- Full `try/catch` in both clipboard and fallback paths
- Fallback (`execCommand`) still present for environments where Clipboard API is unavailable
- `btn.disabled=true` during operation, `false` on reset/fail — unchanged
- Reset restores original button text via `origText = btn.textContent || 'Copy profile link'`

**`renderPublicProfileHtml(p)`** — updated:
- Adds `<button type="button" class="btn-mini pp-copy-link" data-action="copyPublicProfileLink" data-slug="...">Copy profile link</button>` inside the `pp-header pp-card` div, after bio — visible for both owners and non-owners
- Existing footer button for non-owners (`btn-secondary`) kept; updated to include `type="button"`
- No new data fields read from the API response

### `public/styles.css`

```css
/* D-222A: copy profile link button in public profile header */
.pp-copy-link{margin-top:6px;align-self:flex-start}
.pp-copy-link:focus-visible{outline:2px solid var(--blue,#57b8ff);outline-offset:2px;border-radius:2px}
@media(max-width:640px){.pp-copy-link{min-height:44px;padding:10px 12px;align-self:stretch}}
```

---

## User-visible behavior

| Action | Result |
|---|---|
| View public profile (any user, owner or not) | "Copy profile link" button visible in the profile header card |
| Click "Copy profile link" | Button text changes to "Link copied"; button re-enables after 1.5s |
| Clipboard blocked or unavailable | Button text changes to "Copy failed — use browser address bar"; re-enables after 2.5s |
| Tab to "Copy profile link" button | Focus ring visible (blue 2px outline) |
| Tap on mobile | Touch target ≥ 44px height |

---

## Copy rules

| Text | Context |
|---|---|
| `Copy profile link` | Button label and reset text |
| `Link copied` | Success feedback |
| `Copy failed — use browser address bar` | Failure feedback |

No forbidden wording introduced. No score, rank, diagnosis, ideology, avatar, private section wording.

---

## Accessibility

- `type="button"` — prevents accidental form submission
- `.pp-copy-link:focus-visible` — 2px solid blue focus ring, 2px offset
- Mobile `min-height:44px` — comfortable touch target on narrow viewport
- Button text is descriptive and reads naturally by screen readers
- No custom JS focus management — native button behavior

---

## D-216A public allowlist compliance

Three new entries added to `PUBLIC_PROFILE_ALLOWED_MARKERS`:

| Entry | Reason |
|---|---|
| `pp-copy-link` | New CSS class on header copy button |
| `Copy profile link` | Button label — public-safe, no private implication |
| `Link copied` | Success feedback — public-safe, no private implication |

No `PUBLIC_PROFILE_PRIVATE_DENYLIST` entries changed.

---

## D-156A test update

D-156A had a test checking `'Copied!'` in `copyPublicProfileLink`. D-222A intentionally changes the success text to `'Link copied'`. The test description and assertion were updated to `D-156A/D-222A` to document this as an intentional boundary change, not a regression.

---

## Confirmations

- **No new public data fields:** Confirmed — no new API fields read
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No localStorage use in copy helper:** Confirmed
- **D-214A / D-215A / D-216A privacy locks still active:** Confirmed — 2237 / 0 passed

---

## New tests (D-222A — 13 tests; +3 from allowlist forEach)

1. Public profile header renders "Copy profile link" button
2. Copy profile link button has `type="button"`
3. `copyPublicProfileLink` uses `window.location.href`
4. `copyPublicProfileLink` shows "Link copied" on success
5. `copyPublicProfileLink` shows failure message when clipboard blocked
6. `copyPublicProfileLink` does not use localStorage
7. `copyPublicProfileLink` does not call backend
8. `copyPublicProfileLink` has try/catch failure handling
9. D-216A allowlist updated with D-222A public classes and copy
10. No private My HumanX wording in public profile orchestrator
11. `.pp-copy-link` CSS class and focus-visible defined
12. Deploy integrity — D-222A absent from worker.js
13. README references D222A

**+3 from D-216A allowlist forEach loop** (new entries `pp-copy-link`, `Copy profile link`, `Link copied` each generate one loop-pass test)

**Total new tests: 16 (13 explicit + 3 allowlist). Running count: 2237.**

---

## Live sanity checklist (pending owner deploy — D-222B)

After owner manually deploys from terminal:

- [ ] Public profile loads without errors
- [ ] "Copy profile link" button visible in the profile header card (below name/slug/bio)
- [ ] Button is present for both owner and non-owner viewing the profile
- [ ] Clicking "Copy profile link" — button briefly shows "Link copied" then resets
- [ ] Pasting elsewhere confirms the URL was the current page URL
- [ ] Keyboard Tab reaches the "Copy profile link" button
- [ ] Focus ring visible when tabbed to button
- [ ] On mobile/narrow width, button tap area is comfortably large
- [ ] If clipboard is blocked: button shows "Copy failed — use browser address bar" and re-enables
- [ ] Non-owner footer "Copy profile link" still works
- [ ] Context disclosure "About this profile page" unaffected by D-222A
- [ ] Counts card placement (D-220A) remains intact
- [ ] No Reflection Avatar content visible on public profile
- [ ] No private My HumanX sections visible
- [ ] No forbidden wording visible
- [ ] No new public data fields exposed
- [ ] Browser console: no JS errors
