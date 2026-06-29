# D-220A — Public Profile Visual Polish

**Scope:** Frontend / CSS + tests + docs
**Status:** COMPLETE — pending owner deploy (D-220B live closeout)
**Baseline:** 2209 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D220A_PUBLIC_PROFILE_VISUAL_POLISH.md`, `docs/README.md`
**App UI changes:** Yes
**CSS changes:** Yes
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes

---

## Purpose

The public profile page existed as a functional but visually raw skeleton. D-220A improves readability and scanability within the existing D-216A public profile allowlist contract — no new public data, no new public fields, no privacy boundary changes.

---

## What changed visually

### 1. Counts card moved to the top

**Before:** Header → Snapshot (if any) → Context block → Claims → Truths → **Counts** → Evidence → Pressure

**After:** Header → **Counts** → Snapshot (if any) → Context block → Claims → Truths → Evidence → Pressure

The public activity counts (Claims / Truths / Evidence / Pressure badges) are now the first thing shown after the name and bio. Visitors get an at-a-glance understanding of the profile's activity level before scrolling through content.

### 2. Context block collapsed into native `<details>` element

The vocabulary/context block ("HumanX is a public thinking profile…") was always fully expanded, pushing the actual claims content further down the page. It is now a native `<details class="pp-vocab-details">` with summary text "About this profile page".

- Collapsed by default — reduces initial page height
- Expands on click with no JavaScript required (`<details>` is native HTML5)
- Summary has `pp-vocab-summary` class with chevron indicator (▸/▾) and 32px touch target
- `pp-context-block` class is preserved on the `<details>` element for CSS continuity
- No JS toggle added — purely native disclosure

### 3. Claim action buttons wrapped in `pp-item-actions` div

**Before:** Each claim row had the text, meta badge, and two action buttons all in the same flex row — cramped on mobile.

**After:** Text and meta badge on the first line; action buttons ("View in HumanX →" and "Copy link") wrapped in `<div class="pp-item-actions">` which creates a separate full-width row with a subtle top border separator.

Both buttons are still present and functional. The claim view and copy link actions are unchanged.

### 4. Truths section always renders with empty state

**Before:** `renderPublicProfileTruthsHtml([])` returned `''` — the truths section was suppressed entirely when there were no truths.

**After:** Returns `<p class="small pp-empty">No public truths on this profile yet.</p>` — the truths section always renders, consistent with how the claims section behaves. This makes the profile feel more intentional ("No public truths" is better than silently hiding the section).

Evidence and pressure sections still suppress when empty (return `''`) — their absence is less expected.

---

## Public allowlist compliance

D-220A adds 7 new entries to `PUBLIC_PROFILE_ALLOWED_MARKERS` in `scripts/hardening-smoke-test.mjs`:

| New entry | Type | Reason |
|---|---|---|
| `pp-vocab-details` | CSS class | Collapsible context block details element |
| `pp-vocab-summary` | CSS class | Summary trigger for context block |
| `pp-item-actions` | CSS class | Action buttons wrapper in claim items |
| `About this profile page` | Copy | Summary text for collapsible context block |
| `Public truths` | Copy heading | `<h3>Public truths</h3>` heading (pre-existing, now documented) |
| `No public claims yet` | Copy | Claims empty state (pre-existing, now documented) |
| `No public truths` | Copy | Truths empty state (new) |

All 7 new markers are in public profile render functions only — confirmed by the D-220A test block.

---

## No new public data fields

D-220A is presentation-only. No new API response fields are read. The functions still read only:
- `p.displayName`, `p.slug`, `p.bio` — header
- `p.counts` — counts card
- `p.sharedSnapshot` — snapshot
- `p.recentClaims`, `p.recentTruths`, `p.recentEvidence`, `p.recentPressure` — content sections

No new `.field` accesses added. Confirmed by D-220A tests.

---

## No private My HumanX exposure

- `renderPublicProfileHtml` still does not call `renderMeHtml`, `meMirrorHtml`, `meBeliefReflectionHtml`, `meReflectionAvatarHtml`, `meAccountCardHtml`, `meProfileSettingsHtml`, or `meSharedSnapshotPreviewBlockHtml`
- No `localStorage` reference in public content helpers
- No `humanx.me.` prefix in public render path
- D-215A and D-216A privacy locks still pass (confirmed: 2209/0)

---

## No Reflection Avatar exposure

- `meReflectionAvatarHtml` absent from all public profile functions
- `me-avatar-*` CSS classes absent from public render path
- `pp-vocab-details` / `pp-vocab-summary` / `pp-item-actions` are public-profile-specific, not avatar-related
- D-214A regression lock still passes (confirmed: 2209/0)

---

## D-158B test updates

D-158B established ordering and suppression contracts that D-220A intentionally changes:

| Test | Change |
|---|---|
| "snapshot renders before claims, claims before counts" | Updated: new order is counts → snapshot → claims |
| "counts card renders after truths and before evidence" | Updated: counts card now renders before snapshot, not between truths and evidence |
| "renderPublicProfileTruthsHtml returns empty string for empty rows" | Updated: truths now returns empty-state message, not `''` |
| "secondary section functions suppress when empty" | Updated: removed truths from loop; evidence and pressure still suppress |

These are intentional changes, not regressions. The test names now explicitly reference D-220A.

---

## New tests (D-220A — 22 tests)

Allowlist expansion: 7 new `PUBLIC_PROFILE_ALLOWED_MARKERS` entries → 7 new allowlist tests (via `forEach` loop).

D-220A explicit test block: 15 tests:
- `pp-vocab-details` in public render path
- `pp-vocab-summary` in public render path
- Context block uses `<details>` not bare `<div>`
- "About this profile page" summary text present in orchestrator
- `pp-item-actions` present in `renderPublicProfileClaimsHtml`
- Claim action buttons still present within `pp-item-actions`
- `renderPublicProfileTruthsHtml` has non-empty empty state
- `renderPublicProfileTruthsHtml` does not return empty string
- Counts card appears before snapshot in return template
- CSS defines `.pp-vocab-details`
- CSS defines `.pp-vocab-summary`
- CSS defines `.pp-item-actions`
- No private markers in public content helpers
- No new data fields
- Deploy integrity: D-220A absent from worker.js
- README references D220A

**Total new tests: 22** (7 allowlist + 15 explicit; count includes sub-assertions in multi-assert tests)

---

## Live sanity checklist (pending owner deploy — D-220B)

After owner manually deploys from terminal:

- [ ] Public profile loads without errors (`/u/your-slug`)
- [ ] Counts card (Claims / Truths / Evidence / Pressure badges) appears immediately below the name/bio header
- [ ] "About this profile page" context block appears collapsed (not expanded) on first load
- [ ] Clicking "About this profile page" expands the context block
- [ ] Claim rows show text + category on top line; action buttons on a separate lower row with a light separator
- [ ] "View in HumanX →" and "Copy link" buttons still work
- [ ] If profile has no truths: "No public truths on this profile yet." message shows in the truths section
- [ ] If profile has no claims: "No public claims yet." message shows in the claims section
- [ ] If evidence/pressure sections are empty: they are fully suppressed (not shown at all)
- [ ] Shared belief snapshot (if present) appears between counts and context block
- [ ] Mobile: action buttons wrap cleanly on narrow viewport
- [ ] Mobile: "About this profile page" toggle is easily tappable (≥32px)
- [ ] Focus ring visible on "About this profile page" summary when tabbing
- [ ] No Reflection Avatar content visible anywhere on the public profile
- [ ] No private My HumanX sections visible on the public profile
- [ ] Browser console: no JS errors

---

## Confirmations

- **Deploy needed:** Yes — app-v10.js and styles.css changed
- **App UI changed:** Yes (counts reordered, context block collapsible, claim button layout, truths empty state)
- **CSS changed:** Yes (`.pp-vocab-details`, `.pp-vocab-summary`, `.pp-item-actions` added)
- **Worker (`src/worker.js`) unchanged:** Confirmed
- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **D-214A / D-215A / D-216A privacy locks still active:** Confirmed — 2209 / 0 passed
