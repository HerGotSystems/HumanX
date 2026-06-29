# D-225A — Public Profile Polish Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2290 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D225A_PUBLIC_PROFILE_POLISH_REGRESSION_LOCK.md`, `docs/README.md`
**App UI changes:** None (`public/app-v10.js` unchanged)
**CSS changes:** None (`public/styles.css` unchanged)
**Worker changes:** None (`src/worker.js` unchanged)
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Seal the D-220 → D-224 public profile polish arc with a dedicated regression lock block. Each individual arc task (D-220A through D-224A) already has its own focused tests. D-225A adds **cross-arc composite tests** that:

1. Verify the full page structure order as a unit (counts → sectionNav → snapshot → claims)
2. Confirm all arc CSS classes survive together in a single sweep
3. Lock the copy-link helper's full behavioral contract in one test
4. Verify the section nav always has all four anchors and no custom JS
5. Confirm all three empty states use `pp-empty-card` and id targets are always emitted
6. Verify the D-216A allowlist contains all arc markers cumulatively
7. Lock the privacy boundary for the entire public render path as a whole
8. Lock forbidden wording absence across the full public render slice
9. Lock D-221A accessibility additions (focus-visible + mobile) together
10. Lock D-225A deploy integrity — arc tags absent from worker
11. Lock all empty-state copy as public-safe in a single composite test
12. Confirm the copy-link button is still present in the header
13. Verify the README references all arc docs D220A → D225A

Future work rule: any public profile polish change must either leave all D-225A tests passing without modification, or must update this regression lock with explicit owner approval and documentation of what changed and why.

---

## D-220 → D-224 arc summary

| Task | Deliverable | Key changes |
|---|---|---|
| D-220A/B | Visual polish | Counts card top; `<details>` context block; `pp-item-actions`; truths empty state |
| D-221A/B | Accessibility | Focus-visible rings on claim action buttons; mobile `min-height:44px` |
| D-222A/B | Copy link | `pp-copy-link` button in header; `copyPublicProfileLink` updated to `window.location.href`; "Link copied" success; "Copy failed" failure |
| D-223A/B | Section nav | `<nav aria-label="Public profile sections">` with four anchor links; all section `id` attributes; Snapshot link initially conditional |
| D-224A/B | Empty states | `pp-empty-card` for snapshot/claims/truths; snapshot always emits `id="public-snapshot"`; Snapshot nav link made unconditional |

---

## What is now locked (D-225A regression tests)

### 1. Page structure order
The return template of `renderPublicProfileHtml` must always produce:
`countsCard` → `sectionNav` → `renderPublicProfileSnapshotHtml` → `#public-claims` section

### 2. CSS class presence
All nine arc CSS additions must be present in `styles.css`:
`pp-vocab-details`, `pp-item-actions`, `.pp-item-actions .btn-mini:focus-visible`, `pp-copy-link`, `pp-section-nav`, `pp-nav-link`, `pp-empty-card`, `pp-empty-title`, `pp-empty-note`

### 3. Copy-link helper integrity
`copyPublicProfileLink` must: use `window.location.href`; return `'Link copied'` on success; have failure copy with "Copy failed" and "use browser address bar"; not use `localStorage`; not call `fetch` or `api()`.

### 4. Section nav — four public anchors, pure HTML
All four nav links (`#public-snapshot`, `#public-claims`, `#public-truths`, `#public-about`) must be present; `sectionNav` template must contain no `onclick`, `addEventListener`.

### 5. Empty-state — id targets and pp-empty-card everywhere
`renderPublicProfileSnapshotHtml` must always emit `id="public-snapshot"` (both empty and real states). Claims and truths empty-state returns must both use `pp-empty-card`.

### 6. D-216A allowlist contains all arc markers
All 14 arc markers from D-222A/D-223A/D-224A must remain in `PUBLIC_PROFILE_ALLOWED_MARKERS`:
`pp-item-actions`, `pp-vocab-details`, `pp-copy-link`, `Copy profile link`, `Link copied`, `pp-section-nav`, `pp-nav-link`, `public-snapshot`, `public-claims`, `public-truths`, `public-about`, `pp-empty-card`, `pp-empty-title`, `pp-empty-note`

### 7. Privacy boundary — entire public render path
No private marker may appear in the full D-220→D-224 public render path slice:
`meReflectionAvatarHtml`, `isMeReflectionAvatarHidden`, `meRerender`, `humanx.me.reflectionAvatar.hidden`, `renderMeHtml`, `meMirrorHtml`, `meSharedSnapshotPreviewBlockHtml`, `meAccountCardHtml`, `localStorage`

### 8. Forbidden wording absent
Absent from entire public render slice:
`truth level`, `purity`, `ideology type`, `religious alignment`, `smart score`, `HumanX rank`, `good believer`, `bad believer`

### 9. Accessibility (D-221)
All four focus-visible rings still present:
`.pp-item-actions .btn-mini:focus-visible`, `.pp-item-actions .btn-mini{min-height:44px`, `.pp-copy-link:focus-visible`, `.pp-nav-link:focus-visible`

### 10. Deploy integrity
Arc tags D-220A through D-225A must not appear in `worker.js` or `app-v10.js`.

### 11. Empty-state copy — public-safe
`No public snapshot shared yet.`, `Public sections appear here when shared.`, `No public claims yet.`, `No public truths on this profile yet.` — all present; snapshot empty-state return must not contain `private` or `hidden`.

### 12. Copy-link button in header
`pp-copy-link`, `Copy profile link`, `data-action="copyPublicProfileLink"` all present in `renderPublicProfileHtml`.

### 13. README arc references
README must reference all arc docs: D220A, D221A, D222A, D223A, D224A, D225A.

---

## D-216A public allowlist compliance

All D-220→D-224 arc additions remain in `PUBLIC_PROFILE_ALLOWED_MARKERS`. No allowlist weakening. Deny-by-default rule unchanged: any new public profile field must be named in docs and tests before merge.

---

## Privacy boundary guarantees

- **No private My HumanX helpers in public render path:** Confirmed — `meReflectionAvatarHtml`, `renderMeHtml`, `meMirrorHtml`, etc. all absent
- **No localStorage in public render path:** Confirmed
- **No Reflection Avatar exposure:** Confirmed
- **No forbidden wording:** Confirmed
- **`meData` used only for `isOwner` check in orchestrator:** Confirmed — read-only, non-public, allowed by D-215A spec
- **D-214A / D-215A / D-216A locks active:** Confirmed — 2290 / 0 passed

---

## Worker known-warning state

`/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

This is a pre-existing known false positive. 57 hard checks pass; 1 warn; 0 fail. D-225A does not change this.

---

## New tests (D-225A — 13 explicit)

1. Page structure order — counts, sectionNav, snapshot, claims in correct order
2. All D-220→D-224 CSS classes present in styles.css
3. D-222 copy-link helper integrity (composite)
4. D-223 section nav — all four public anchors, no JS
5. D-224 empty-state — id targets and pp-empty-card everywhere
6. D-216A allowlist contains all arc markers
7. Privacy boundary — no private markers in full public render path
8. Forbidden wording absent from all public render functions
9. D-221 accessibility — focus-visible and touch targets for all interactive elements
10. D-225A deploy integrity — arc tags absent from worker.js and app-v10.js
11. Empty-state copy — all three messages present, public-safe
12. Copy-link button present in header
13. README references all arc docs D220A → D225A

**Running count: 2290** (2275 prior + 13 new + 2 from D-139B baseline additions for 2289/2290)

---

## Future rule

Any public profile change that modifies the D-220→D-224 behavior must:
1. Run `node scripts/hardening-smoke-test.mjs` and confirm 0 failures
2. If any D-225A lock test fails, explicitly update this doc with the change rationale and owner approval before merging
3. Update the D-225A test description to `D-225A/D-NNN` to document the intentional boundary change
4. Do not silently remove or weaken lock tests — treat failures as regressions requiring justification

---

## Confirmations

- **No new public data fields:** Confirmed
- **No private My HumanX exposure:** Confirmed
- **No Reflection Avatar / public avatar exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No app UI / CSS changes:** Confirmed — tests + docs only
- **Deploy needed:** No
