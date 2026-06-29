# D-215A — My HumanX Privacy Boundary Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2078 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Backend changes:** None
**Migration:** None
**Schema change:** None
**Public profile change:** None
**Deploy needed:** No

---

## Purpose

Extend the regression fence from Reflection Avatar (D-214A) to the entire My HumanX private surface, ensuring that future refactors, feature additions, or copy changes cannot accidentally:

- Render private My HumanX sections on the public profile page
- Expose device-local/localStorage controls to the public render path
- Add backend routes or API fields for private dashboard preferences
- Introduce ranking/ideology/morality/identity wording into the public profile

---

## Boundary defined

### Private My HumanX render path (`renderMeHtml`)

The following functions are called **only** from `renderMeHtml` and must never appear in the public render path:

| Function | Purpose |
|---|---|
| `meAccountCardHtml` | Account info — private |
| `meProfileSettingsHtml` | Profile settings and save controls — private |
| `meMirrorHtml` | Belief Mirror — private |
| `meBeliefReflectionHtml` | Belief Reflection — private |
| `meReflectionAvatarHtml` | Reflection Avatar — private (also locked by D-214A) |
| `meSharedSnapshotPreviewBlockHtml` | Snapshot preview with save controls — private |
| `meFilterBarHtml` | Activity filter bar — private |
| `meVisibleSlice` | Private data slicing — private |

Private-only copy that must not leak:
- "My HumanX" (page heading)
- "Everything here is private by default"
- "not shown on your public profile"
- "Private concept only."
- "private My HumanX view"

Private-only dashboard actions that must not appear publicly:
- `meRerender`
- `saveBeliefVisibilityUI`
- `exportMyHumanXData`
- `toggleAccountPanel`
- `meFilterBarHtml`

### Public profile render path (`renderPublicProfileHtml` + helpers)

The public render path covers:
- `renderPublicProfileClaimsHtml`
- `renderPublicProfileTruthsHtml`
- `renderPublicProfileEvidenceHtml`
- `renderPublicProfilePressureHtml`
- `renderPublicProfileSnapshotHtml`
- `renderPublicProfileHtml`
- `async renderPublicProfile`

These functions intentionally show: Claims being tested, Public truths, Supporting evidence, Questions under pressure, Shared Belief Snapshot (if enabled), Public Activity counts, profile header (name, slug, bio).

The public snapshot render intentionally includes reflection score signals if the user has opted in — "Reflection scores", stability/openness/pressure values. This is by design and is NOT a regression. The snapshot scores are gated by `buildPublicSharedSnapshot` in the worker.

---

## What is locked

### 1. Private/public render separation (11 checks)

- `renderMeHtml` not called from public render path
- "My HumanX" heading absent from public render path
- `meMirrorHtml`, `meBeliefReflectionHtml`, `meAccountCardHtml`, `meProfileSettingsHtml`, `meSharedSnapshotPreviewBlockHtml` not called from public render
- "Everything here is private by default" absent from public render
- "private My HumanX view" absent from public render
- "not shown on your public profile" absent from public render
- "Private concept only" absent from public render

### 2. Public profile stays presentation-only (6 checks)

- `meRerender` absent from public render
- `saveBeliefVisibilityUI` absent from public render
- `exportMyHumanX` dashboard action absent from public render
- `meFilterBarHtml` absent from public render
- `meVisibleSlice` absent from public render
- `toggleAccountPanel` absent from public render

### 3. No localStorage/public coupling (4 checks)

- `localStorage` absent from public render path
- `humanx.me.` key prefix absent from public render path
- `reflectionAvatar.hidden` absent from public render path
- `isMeReflectionAvatarHidden` absent from public render path

### 4. Backend/API boundary (5 checks)

`src/worker.js` must not contain:
- `my_humanx_preference` or `myHumanxPreference`
- `avatar_hidden` or `avatarHidden`
- `public_avatar` or `publicAvatar`
- `reflection-avatar` or `reflection_avatar`
- `humanx.me.` localStorage prefix

### 5. Public forbidden wording — compound phrases (10 checks)

The following must not appear in the public render path (generic words like "score" may appear in legitimate snapshot disclaimers; only compound forbidden phrases are tested):

- "truth level", "purity", "ideology type", "religious alignment", "smart score", "HumanX rank", "good believer", "bad believer", "morality label", "intelligence label"

### 6. renderMeHtml wires all private sections (4 integrity checks)

Positive assertions confirm private functions remain properly wired in the private path:
- `renderMeHtml` calls `meMirrorHtml`, `meBeliefReflectionHtml`, `meReflectionAvatarHtml`, `meProfileSettingsHtml`

### 7. Deploy integrity lock (3 checks)

- D-215A does not modify `public/app-v10.js`
- D-215A does not require a migration
- D-215A does not modify `worker.js`

---

## Test results

| Block | Tests |
|---|---|
| Private/public render separation | 11 |
| Public profile stays presentation-only | 6 |
| No localStorage/public coupling | 4 |
| Backend/API boundary | 5 |
| Public forbidden wording | 10 |
| renderMeHtml wiring integrity | 4 |
| Deploy integrity lock | 3 |
| **Total** | **43** |

**Hardening smoke after D-215A:** 2078 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 warn (pre-existing, non-blocking)

---

## Future rule

Any future expansion of the public profile page must explicitly state:

1. **What is being made public** — which private function or data is moving to the public render path, and why
2. **What remains private** — what is explicitly excluded from the change
3. **Which regression tests are being updated** — changes must come with a test update that reflects the new intentional boundary, not a rollback of the safety fence

Changes that silently pass these tests but violate the spirit of the boundary (e.g., adding a new public render helper that calls private data) are considered regressions even if no individual test fails.

---

## Confirmations

- **Deploy needed:** No — tests and docs only
- **App UI unchanged:** Confirmed (D-215A absent from `app-v10.js`)
- **CSS unchanged:** Confirmed
- **Worker unchanged:** Confirmed (D-215A absent from `worker.js`)
- **Private My HumanX boundary locked:** Confirmed by 43 new tests
- **No public profile/private preference exposure:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
