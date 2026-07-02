# D-295B — My HumanX Profile Setup Nudge

**Scope:** Frontend-only (`public/app-v10.js`, `scripts/hardening-smoke-test.mjs`)
**Status:** COMPLETE — owner deploy needed
**Branch:** main (direct commit)
**Baseline before D-295B:** 3424 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after D-295B:** 3442 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-295B:** `35c1e33` (D-295A)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D295B_MY_HUMANX_PROFILE_SETUP_NUDGE.md`, `docs/README.md`

---

## Purpose

D-295A found that the only genuinely new signal not already covered by existing My HumanX panels is whether the owner has ever configured a public profile (slug + public flag). Profile Settings is now collapsible (D-293B), so a first-time owner who hasn't explored it may not realize it exists or what it does.

D-295B adds a narrow, self-clearing nudge above the Account card when `profile_public === false && !profile_slug`. The nudge disappears once either condition is cleared.

---

## D-295A Finding Addressed

D-295A conclusion: "Do not add a general count-based strip — it duplicates My Content. Implement a narrow profile-setup nudge: condition `!profile_public && !profile_slug`, one line in `renderMeHtml()`, frontend-only, self-clears."

This is that implementation.

---

## Change

### `public/app-v10.js` — `renderMeHtml()` (line 385)

**Variable added before the return template literal:**

```javascript
const profileNudge = (!u.profile_public && !u.profile_slug)
  ? `<p class="small" style="margin:0 0 12px;padding:8px 10px;border-left:3px solid var(--accent,#4a7cf6)">Set up your public profile: open Profile Settings, choose a slug, and switch your profile public when ready.</p>`
  : '';
```

**Placement in template:** `${profileNudge}` inserted between the privacy intro paragraph and `${meAccountCardHtml(u)}`.

**Result:** When the owner has never set a profile slug and profile_public is false, a short left-bordered paragraph appears below the privacy intro and above the Account card, pointing toward Profile Settings. No other element moves or changes.

---

## Self-Clearing Behavior

The nudge is a pure conditional on two fields already in the `GET /api/my-humanx` response:

| Condition | Nudge shown |
|-----------|------------|
| `profile_public === false` AND `profile_slug` is null/empty | **Yes** |
| `profile_public === true` | No (cleared) |
| `profile_slug` is set (any non-empty value) | No (cleared) |
| Both cleared | No |

The owner sets a slug via Profile Settings → Save → the next `renderMe()` call re-fetches `GET /api/my-humanx` → `u.profile_slug` is now set → `profileNudge` is `''` → nudge is gone. No dismiss button, no JS state, no localStorage — the data self-corrects.

---

## Why This Is Not a General "Needs Attention" Strip

| Property | This nudge | A general strip |
|----------|-----------|-----------------|
| Condition | Narrow — fires only when slug AND public both unset | Broad — fires on any attention-worthy state |
| Content | Single fixed copy about profile setup | Multiple dynamic count-based messages |
| Duplication | No overlap with My Content counts | Would duplicate counts.truths.review etc. |
| Self-clears | Yes — data-driven | Would need dismiss state |
| Implementation | One ternary + one template interpolation | Multiple if-branches, more DOM surface |

---

## Safety

| Concern | Status |
|---------|--------|
| No JS state added | Yes — pure data conditional |
| No CSS file changes | Yes — inline style uses existing `var(--accent,#4a7cf6)` token |
| Account card | Unchanged and still visible — nudge is above it |
| Profile Settings (`<details>/<summary>`) | Unchanged — D-293B preserved |
| Recent Truths position | Unchanged — still first content panel after filter bar |
| Review explanation | Unchanged — `"Review: awaiting admin approval — goes Public when approved."` |
| Yellow Review badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` |
| Profile save/copy behavior | Unchanged — `saveProfileSettingsUI`, `meCopyProfileLink` untouched |
| Public profile `/u/:slug` | Not modified |
| Review/moderation | Not modified |
| Truth submission | Not modified |
| `GET /api/my-humanx` data source | Unchanged |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |

---

## Tests

| Category | Count |
|----------|-------|
| New D-295B tests | 18 |
| Updated existing tests (slice size widening) | 7 |
| Total regression tests (after) | 3442 |

**Updated existing tests (slice size only — no assertion logic change):**
Tests D-137D, D-137D/E (×2), D-137E (×2), D-139B, D-140B used fixed `appSrc.slice(idx, idx + N)` windows to inspect `renderMeHtml()`. The `profileNudge` const declaration added ~272 chars to the function preamble, shifting all template content past the old window sizes. Each affected test's window was increased by 300 chars.

**New D-295B test coverage (18 tests):**
1. `renderMeHtml()` contains a profile setup nudge (profile_slug, profile_public, Profile Settings all referenced)
2. Nudge condition checks `profile_public`
3. Nudge condition checks `profile_slug`
4. Nudge references "Profile Settings"
5. Nudge mentions "slug"
6. Nudge mentions "public when ready"
7. No general "Needs attention" strip added
8. My Content counts panel preserved
9. `renderMe()` still calls `GET /api/my-humanx`
10. `meAccountCardHtml()` still called in `renderMeHtml()`
11. `meProfileSettingsHtml()` still uses `<details>/<summary>` (D-293B preserved)
12. Recent Truths still immediately after filter bar
13. Review explanation "awaiting admin approval" preserved
14. `ME_STATE_CLR` review badge `b-yellow` preserved
15. Public profile route `/u/:slug` not referenced inside `renderMeHtml()`
16. `worker.js` not modified — `myHumanX()` return shape unchanged
17. `styles.css` not modified — no new nudge CSS class added
18. `belief-drift-expansion.js` not modified by D-295B

---

## Static Checks

| Check | Before D-295B | After D-295B |
|-------|---------------|--------------|
| `node --check public/app-v10.js` | exit 0 | exit 0 |
| `hardening-smoke-test.mjs` | `3424 passed, 0 failed` | `3442 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 warn` | `57 passed, 0 failed / 1 warn` |

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-295A | No | Product pass / docs only |
| D-295B | **Pending — owner deploy required** | `public/app-v10.js` changed |
