# D-224A — Public Profile Empty-State Polish

**Scope:** Frontend/CSS + tests + docs
**Status:** LIVE CLOSEOUT COMPLETE (D-224B)
**Baseline:** 2275 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D224A_PUBLIC_PROFILE_EMPTY_STATES.md`, `docs/README.md`
**App UI changes:** Yes (empty-state copy/classes updated; snapshot always renders)
**CSS changes:** Yes (`.pp-empty-card`, `.pp-empty-title`, `.pp-empty-note` added)
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes (app-v10.js and styles.css changed)

---

## Purpose

Improve the visual and semantic quality of public profile empty states so a profile with no shared snapshot, no public claims, or no public truths still feels intentional and understandable to a visitor. Previously, the snapshot section vanished completely when no snapshot was shared — leaving a gap between the counts card and the claims section with no explanation. Claims and truths used a small `<p class="small pp-empty">` paragraph with no visual framing.

D-224A:
- Adds a calm, styled empty-state card for each section (snapshot, claims, truths)
- Uses public-safe copy that describes absence without implying hidden or private data
- Makes `id="public-snapshot"` always present so the section nav anchor always works
- Removes the conditional on the Snapshot nav link — Snapshot always appears in the nav
- Introduces scoped CSS classes: `.pp-empty-card`, `.pp-empty-title`, `.pp-empty-note`

---

## What changed

### `public/app-v10.js`

**`renderPublicProfileSnapshotHtml(s)`:**
- Previously: `if(!s)return'';` — returned empty string, no anchor, section nav Snapshot link was absent
- D-224A: `if(!s)return'<div id="public-snapshot" class="panel pp-card pp-empty-card"><p class="pp-empty-title">No public snapshot shared yet.</p><p class="small pp-empty-note">Public sections appear here when shared.</p></div>';`
- Now always emits `id="public-snapshot"` — anchor target always exists
- Empty-state copy is public-safe; does not imply private content

**`renderPublicProfileClaimsHtml(rows)`:**
- Previously: `return'<p class="small pp-empty">No public claims yet.</p>';`
- D-224A: `return'<div class="pp-empty-card"><p class="pp-empty-title">No public claims yet.</p></div>';`
- Same copy; now wrapped in a card with title class

**`renderPublicProfileTruthsHtml(rows)`:**
- Previously: `return'<p class="small pp-empty">No public truths on this profile yet.</p>';`
- D-224A: `return'<div class="pp-empty-card"><p class="pp-empty-title">No public truths on this profile yet.</p></div>';`
- Same copy; now wrapped in a card with title class

**`renderPublicProfileHtml(p)` — sectionNav:**
- Previously: `${sn?'<a href="#public-snapshot" class="pp-nav-link">Snapshot</a>':''}`
- D-224A: `<a href="#public-snapshot" class="pp-nav-link">Snapshot</a>` (always present)
- `sn` variable is still declared; used by `${renderPublicProfileSnapshotHtml(sn)}` call — unchanged
- `sn?` ternary removed only from sectionNav because `#public-snapshot` anchor now always exists

### Empty-state HTML structure

**Snapshot (no shared snapshot):**
```html
<div id="public-snapshot" class="panel pp-card pp-empty-card">
  <p class="pp-empty-title">No public snapshot shared yet.</p>
  <p class="small pp-empty-note">Public sections appear here when shared.</p>
</div>
```

**Claims (no public claims):**
```html
<div class="pp-empty-card">
  <p class="pp-empty-title">No public claims yet.</p>
</div>
```

**Truths (no public truths):**
```html
<div class="pp-empty-card">
  <p class="pp-empty-title">No public truths on this profile yet.</p>
</div>
```

### `public/styles.css`

Added after D-222A block:

```css
/* D-224A: public profile empty-state styling */
.pp-empty-card{padding:16px 0 8px;text-align:center}
.pp-empty-title{color:var(--muted,#8892a4);font-size:13px;margin:0 0 4px}
.pp-empty-note{color:var(--muted,#8892a4);font-size:12px;margin:0}
```

All three classes are calm and muted — no error coloring, no warning framing.

---

## User-visible behavior

| State | Behavior |
|---|---|
| Profile with no shared snapshot | Snapshot section renders a muted "No public snapshot shared yet." card. "Snapshot" nav link present and scrolls to this card. |
| Profile with shared snapshot | Existing snapshot card renders (unchanged). "Snapshot" nav link present and scrolls to it. |
| Profile with no public claims | Claims section renders a muted "No public claims yet." card inside the existing claims section div. |
| Profile with public claims | Claims list renders (unchanged). |
| Profile with no public truths | Truths section renders a muted "No public truths on this profile yet." card (same copy as before, restyled). |
| Profile with public truths | Truths list renders (unchanged). |
| Mobile | Empty-state cards use the same responsive layout as other cards. |

---

## Empty-state copy rules

| Copy | Section | Notes |
|---|---|---|
| `No public snapshot shared yet.` | Snapshot | New; replaces silent empty string |
| `Public sections appear here when shared.` | Snapshot note | Describes the mechanic neutrally |
| `No public claims yet.` | Claims | Unchanged text; restyled |
| `No public truths on this profile yet.` | Truths | Unchanged text; restyled |

**Never used:**
- `private` / `hidden` — no implication of hidden content
- `My HumanX` — not mentioned on the public page
- `score` / `rank` / `diagnosis` / `ideology` / `morality` / `intelligence` / `truth rating` — none
- `localStorage` / `sync` / `device` — none

---

## Section nav behavior change (D-224A)

Previously (D-223A): Snapshot nav link was conditional — `${sn?'<a href="#public-snapshot" ...>':''}`

After D-224A: Snapshot nav link is always rendered.

Reason: `#public-snapshot` anchor now always exists in the DOM (either as the real snapshot card or as the empty-state card). The conditional was only needed because the anchor was absent when no snapshot existed; that condition no longer holds.

---

## Test updates (D-224A modified existing tests)

| Test | Original | D-224A change |
|---|---|---|
| D-141B/D-158B claims empty state | checked `class="small pp-empty"` | Updated to check `pp-empty-card` |
| D-158B/D-220A truths empty state | checked `pp-empty` | Updated to check `pp-empty-card` |
| D-158B claims retains empty state | checked `pp-empty` | Updated to check `pp-empty-card` |
| D-142C public card renders nothing | checked `if(!s)return''` | Updated: D-224A changed to pp-empty-card; test now confirms new behavior |
| D-142B/D-142C/D-154B→D-208B 1200-char window | `idx + 1200` | Extended to `idx + 1700` |
| D-142C/D-154B disclaimer 1000-char window | `idx + 1000` | Extended to `idx + 1300` |
| D-142C/D-154B "One snapshot" 1000-char window | `idx + 1000` | Extended to `idx + 1300` |
| D-142C→D-208B contradictionCount 1200-char window | `idx + 1200` | Extended to `idx + 1700` |
| D-223A snapshot nav conditional | checked `sn?` gating | Updated: D-224A makes Snapshot nav always present |

All window extensions are needed because D-224A's empty-state return (~215 chars) pushes the real snapshot card content further into the function.

---

## D-216A public allowlist compliance

Five new entries added to `PUBLIC_PROFILE_ALLOWED_MARKERS`:

| Entry | Reason |
|---|---|
| `pp-empty-card` | New CSS class on empty-state wrapper div |
| `pp-empty-title` | New CSS class on empty-state title paragraph |
| `pp-empty-note` | New CSS class on empty-state note paragraph |
| `No public snapshot shared yet.` | Empty-state copy — public-safe, no private implication |
| `Public sections appear here when shared.` | Empty-state note — public-safe, no private implication |

No `PUBLIC_PROFILE_PRIVATE_DENYLIST` entries changed.

---

## Confirmations

- **No new public data fields:** Confirmed — no new API fields read
- **No implication of private/hidden content:** Confirmed — copy is neutral
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **D-214A / D-215A / D-216A privacy locks still active:** Confirmed — 2275 / 0 passed

---

## New tests (D-224A — 13 explicit; +5 allowlist forEach)

1. Snapshot empty-state renders `id="public-snapshot"` when `!s`
2. Snapshot empty-state uses `pp-empty-card` class
3. Snapshot empty-state copy is public-safe — "No public snapshot shared yet."
4. Snapshot empty-state secondary note uses `pp-empty-note` and "Public sections appear here when shared."
5. Claims empty-state uses `pp-empty-card` class
6. Claims empty-state copy is public-safe — "No public claims yet."
7. Truths empty-state uses `pp-empty-card` class
8. Truths empty-state copy is public-safe — "No public truths on this profile yet."
9. Empty states do not contain forbidden wording
10. Snapshot section nav link is always present — not conditional on `sn` (D-224A change)
11. `pp-empty-card` CSS defined with `text-align:center`
12. `pp-empty-title` and `pp-empty-note` CSS defined
13. Deploy integrity — D-224A absent from worker.js

**+5 from D-216A allowlist forEach** (5 new entries each generate one loop-pass test)
**Running count: 2275**

---

## Live sanity checklist — D-224B PASS

Owner deploy completed from terminal. All 25 checks PASS.

- [x] Live HumanX opened after deploy
- [x] Public profile page opened
- [x] Page loads without console-breaking errors
- [x] Snapshot section anchor exists even when no public snapshot is shared
- [x] Profile with no shared snapshot: snapshot empty-state card visible — "No public snapshot shared yet."
- [x] Snapshot empty note visible — "Public sections appear here when shared."
- [x] Snapshot nav link present and scrolls to the empty-state card
- [x] Profile with shared snapshot: existing snapshot card renders normally (unchanged)
- [x] Claims section shows "No public claims yet." (calm card styling)
- [x] Claims empty state uses calm card styling — not error, not warning
- [x] Truths section shows "No public truths on this profile yet." (calm card styling, restyled)
- [x] Truths empty state uses calm card styling — not error, not warning
- [x] Empty-state copy does not imply private or hidden data exists
- [x] Section navigation from D-223 remains intact — all four links present and functional
- [x] Copy profile link from D-222 remains intact
- [x] Counts card placement from D-220 remains intact
- [x] Context disclosure still opens/closes normally
- [x] Mobile/narrow width: empty-state cards do not overflow
- [x] No private My HumanX controls appear
- [x] No Reflection Avatar appears
- [x] No hide/show controls appear
- [x] No avatar transparency disclosure appears
- [x] No localStorage/device-local wording appears
- [x] No forbidden wording appears (truth level / purity / ideology type / religious alignment / smart score / HumanX rank / good believer / bad believer)
- [x] Public profile does not expose new data fields

---

## D-224B live closeout record

- **Owner deploy:** PASS — deployed from owner terminal
- **Hardening smoke post-deploy:** 2275 passed / 0 failed
- **Worker route static post-deploy:** 57 passed / 0 failed / 1 known warn (`/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`)
- **Snapshot empty-state card:** PASS — renders "No public snapshot shared yet." with "Public sections appear here when shared." note; `id="public-snapshot"` anchor always present
- **Snapshot nav target:** PASS — Snapshot nav link always present; scrolls to empty-state card when no snapshot shared
- **Claims empty-state:** PASS — "No public claims yet." rendered as calm `pp-empty-card`
- **Truths empty-state:** PASS — "No public truths on this profile yet." rendered as calm `pp-empty-card`
- **Empty-state copy — no private/hidden implication:** PASS — neutral absence wording only
- **Mobile no-overflow:** PASS — empty-state cards fit within card layout at narrow width
- **D-223A section nav:** PASS — all four links (Snapshot, Claims, Truths, About) present and functional
- **D-222A copy profile link:** PASS — unaffected
- **D-220A counts card:** PASS — unaffected
- **Context disclosure (D-220A):** PASS — opens/closes normally
- **Public allowlist compliance:** PASS — 5 new entries intentionally added
- **No new public data fields:** PASS — no new API fields read
- **No private My HumanX exposure:** PASS
- **No Reflection Avatar / public avatar exposure:** PASS
- **No forbidden wording:** PASS
- **No backend/API/migration/schema/CSP/external asset changes:** PASS
