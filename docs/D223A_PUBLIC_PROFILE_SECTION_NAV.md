# D-223A — Public Profile Section Navigation

**Scope:** Frontend/CSS + tests + docs
**Status:** COMPLETE — pending owner deploy
**Baseline:** 2257 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D223A_PUBLIC_PROFILE_SECTION_NAV.md`, `docs/README.md`
**App UI changes:** Yes (nav row added; section IDs added)
**CSS changes:** Yes (`.pp-section-nav`, `.pp-nav-link` added)
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**New JS:** None — pure HTML anchors only
**Deploy needed:** Yes (app-v10.js and styles.css changed)

---

## Purpose

Add a small section navigation row on public profile pages so viewers can jump directly to existing content sections: Snapshot, Claims, Truths, and About. This reduces scrolling on long profiles without adding any JS, backend calls, or new public data.

---

## What changed

### `public/app-v10.js`

**`renderPublicProfileSnapshotHtml(s)`:**
- Added `id="public-snapshot"` to the root div — `<div id="public-snapshot" class="panel pp-card pp-snapshot-card">`

**`renderPublicProfileHtml(p)`:**
- Added `const sectionNav` variable — a `<nav>` containing anchor links to the four public sections
- Snapshot link is conditional: `${sn?'<a href="#public-snapshot" ...>Snapshot</a>':''}` — absent when no snapshot exists
- Claims, Truths, About links always rendered
- Return template: inserted `${sectionNav}` between `${countsCard}` and `${renderPublicProfileSnapshotHtml(sn)}`
- Added `id="public-about"` to the context `<details>` element
- Added `id="public-claims"` to the claims `<div class="panel pp-section">`
- Added `id="public-truths"` to the truths `<div class="panel pp-section">` (conditional render)

No new data fields, no new JS handlers, no backend calls.

### Section nav HTML structure

```html
<nav class="pp-section-nav" aria-label="Public profile sections">
  <!-- only if snapshot exists: -->
  <a href="#public-snapshot" class="pp-nav-link">Snapshot</a>
  <a href="#public-claims" class="pp-nav-link">Claims</a>
  <a href="#public-truths" class="pp-nav-link">Truths</a>
  <a href="#public-about" class="pp-nav-link">About</a>
</nav>
```

### `public/styles.css`

```css
/* D-223A: public profile section navigation */
.pp-section-nav{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;margin-bottom:4px}
.pp-nav-link{font-size:11px;color:var(--blue);text-decoration:none;padding:4px 10px;border:1px solid var(--line);border-radius:999px;white-space:nowrap;background:#080b12}
.pp-nav-link:hover{border-color:var(--blue)}
.pp-nav-link:focus-visible{outline:2px solid var(--blue,#57b8ff);outline-offset:2px;border-radius:999px}
@media(max-width:640px){.pp-section-nav{gap:4px}.pp-nav-link{padding:6px 10px;min-height:36px;display:inline-flex;align-items:center}}
```

---

## User-visible behavior

| Action | Result |
|---|---|
| View public profile | Nav row visible below counts card, before snapshot/content |
| Click "Claims" | Page scrolls to claims section |
| Click "Truths" | Page scrolls to truths section |
| Click "About" | Page scrolls to the "About this profile page" disclosure |
| Click "Snapshot" (only if snapshot exists) | Page scrolls to snapshot card |
| No snapshot on profile | "Snapshot" nav link absent |
| Tab to nav links | Focus ring visible (blue 2px outline, 999px radius) |
| Mobile | Links wrap cleanly; tap target min-height 36px |

---

## Accessibility behavior

- `<nav aria-label="Public profile sections">` — screen readers announce this as a landmark with label
- Anchor links — native browser scroll, no JS, no scroll hijacking
- Focus ring on `:focus-visible` — not shown for mouse clicks
- No sticky/fixed positioning
- No focus trapping
- No scroll JS

---

## Section anchors added

| Anchor ID | Element | Always present? |
|---|---|---|
| `public-snapshot` | Root div of `renderPublicProfileSnapshotHtml` | No — only when owner has shared snapshot |
| `public-claims` | Claims `<div class="panel pp-section">` | Yes |
| `public-truths` | Truths `<div class="panel pp-section">` | Yes (has empty state since D-220A) |
| `public-about` | Context `<details>` element | Yes |

---

## D-216A public allowlist compliance

Seven new entries added to `PUBLIC_PROFILE_ALLOWED_MARKERS`:

| Entry | Reason |
|---|---|
| `pp-section-nav` | New CSS class on nav element |
| `pp-nav-link` | New CSS class on anchor links |
| `public-snapshot` | New section anchor ID |
| `public-claims` | New section anchor ID |
| `public-truths` | New section anchor ID |
| `public-about` | New section anchor ID |
| `Public profile sections` | `aria-label` text — public-safe |

No `PUBLIC_PROFILE_PRIVATE_DENYLIST` entries changed.

---

## D-141B test update

D-141B checked `class="panel pp-section"` count within a fixed 3000-char window from `renderPublicProfileHtml`. With the added `sectionNav` const and longer template, the window no longer reached all four sections. Updated to use the actual function end marker (`\nasync function renderPublicProfile(`) instead of a fixed char count. Test description updated to `D-141B/D-223A` to document the intentional change.

---

## Confirmations

- **No new public data fields:** Confirmed — no new API fields read
- **No JS for section navigation:** Confirmed — pure HTML anchors only
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **D-214A / D-215A / D-216A privacy locks still active:** Confirmed — 2257 / 0 passed

---

## New tests (D-223A — 13 explicit; +7 allowlist forEach)

1. Public profile renders `<nav>` with accessible label
2. Section nav links point only to public section anchors (`#public-claims`, `#public-truths`, `#public-about`)
3. Snapshot nav link is conditional on `sn`
4. `id="public-claims"` present on claims section
5. `id="public-truths"` present on truths section
6. `id="public-about"` present on context block
7. `id="public-snapshot"` present in `renderPublicProfileSnapshotHtml`
8. `.pp-nav-link:focus-visible` CSS defined
9. `pp-section-nav` uses `flex-wrap:wrap` for mobile
10. Section nav uses pure HTML anchors (no JS handlers)
11. No private My HumanX wording in public profile orchestrator
12. Deploy integrity — D-223A absent from worker.js
13. README references D223A

**+7 from D-216A allowlist forEach** (7 new entries each generate one loop-pass test)
**Running count: 2257**

---

## Live sanity checklist (pending owner deploy — D-223B)

After owner manually deploys from terminal:

- [ ] Public profile loads without errors
- [ ] Section nav row visible below counts card
- [ ] "Claims", "Truths", "About" links all present
- [ ] "Snapshot" link present only when profile has a shared snapshot
- [ ] Clicking "Claims" scrolls to claims section
- [ ] Clicking "Truths" scrolls to truths section
- [ ] Clicking "About" scrolls to "About this profile page" disclosure
- [ ] Clicking "Snapshot" (if present) scrolls to snapshot card
- [ ] Keyboard Tab reaches nav links
- [ ] Focus ring visible on nav links when tabbed to
- [ ] Mobile: nav links wrap cleanly, no overflow
- [ ] No network requests triggered by clicking nav links
- [ ] No private My HumanX controls visible
- [ ] No Reflection Avatar visible
- [ ] No forbidden wording visible
- [ ] Context disclosure, counts card, copy button all still present (D-220A/D-221A/D-222A unaffected)
- [ ] Browser console: no JS errors
