# D-293B — My HumanX Collapsible Profile Settings

**Scope:** Frontend-only (`public/app-v10.js`, `scripts/hardening-smoke-test.mjs`)
**Status:** COMPLETE — owner deployed (D-293C live closeout: 27/27 PASS)
**Branch:** main (direct commit)
**Baseline before D-293B:** 3405 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after D-293B:** 3424 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-293B:** `9ddbf3f` (D-293A)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D293B_MY_HUMANX_COLLAPSIBLE_PROFILE_SETTINGS.md`, `docs/README.md`

---

## Purpose

D-293A identified that Profile Settings — always-open between the Account card and the My Content counts panel — pushes the counts/filter/activity area down on every returning-owner visit after initial setup. The editable form (slug, bio, toggle, Save, Copy) occupies significant vertical space but is only needed when actively configuring a profile.

D-293B makes Profile Settings collapsible using native HTML `<details>/<summary>`, requiring no JS state and no CSS additions.

---

## Change

### `public/app-v10.js` — `meProfileSettingsHtml()` (line 267)

**Before:**
```
<div class="panel me-profile-settings">
  <h3>Profile Settings</h3>
  {guestNote}
  {guardrail}
  {toggle}
  {slug input}
  {bio textarea}
  {preview block}
  {action buttons}
</div>
```

**After:**
```
<div class="panel me-profile-settings">
  <details>
    <summary>Profile Settings</summary>
    {guestNote}
    {guardrail}
    {toggle}
    {slug input}
    {bio textarea}
    {preview block}
    {action buttons}
  </details>
</div>
```

The `<h3>Profile Settings</h3>` heading is replaced by `<details><summary>Profile Settings</summary>`. All editable controls (slug, bio, toggle, Save, Copy link) move inside `<details>`. The outer panel div (`me-profile-settings`) is unchanged.

**Result:** Profile Settings is collapsed by default on page load. Clicking "Profile Settings ▸" expands the edit form. The Account card above and the My Content counts/filter/Recent Truths below are immediately visible without scrolling through the form.

---

## What Stays Visible

| Element | Visible when collapsed |
|---------|----------------------|
| Account card (name, email, handle, Export) | Yes — separate panel above, not touched |
| "Profile Settings ▸" summary line | Yes — always visible as the disclosure toggle |
| My Content counts panel | Yes — immediately below Profile Settings |
| Filter bar | Yes |
| Recent Truths | Yes — first content panel after filter bar |

---

## What Collapses

| Element | Collapsed by default |
|---------|---------------------|
| Public toggle (`meProfilePublicToggle`) | Yes |
| Slug input (`meProfileSlugInput`) | Yes |
| Bio textarea (`meProfileBioInput`) | Yes |
| Profile preview block | Yes |
| Save button (`saveProfileSettingsUI`) | Yes |
| Copy share link button (`meCopyProfileLink`) | Yes |
| Guest / unverified note (conditional) | Yes |
| Guardrail copy paragraph | Yes |

---

## Safety

| Concern | Status |
|---------|--------|
| Native HTML only | Yes — `<details>/<summary>`, no JS state, no event listeners |
| No CSS changes | No `styles.css` changes needed |
| Save behavior | Unchanged — `saveProfileSettingsUI` handler unchanged |
| Copy link behavior | Unchanged — `meCopyProfileLink` handler unchanged |
| Profile preview update | Unchanged — `meUpdateProfilePreview()` still wired |
| Account card | Not modified — separate `meAccountCardHtml()` function |
| Public profile `/u/:slug` | Not modified |
| Review/moderation | Not modified |
| Truth submission | Not modified |
| D-285B post-submit navigation | Preserved — `submitTruth()` still calls `renderMe()` + `tab-me` |
| Recent Truths position | Preserved — still first content panel after filter bar |
| Review explanation | Preserved — `"Review: awaiting admin approval — goes Public when approved."` |
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
| New D-293B tests | 15 |
| Total regression tests (after) | 3424 |

**New D-293B test coverage:**
1. `meProfileSettingsHtml()` uses `<details`
2. `meProfileSettingsHtml()` uses `<summary>Profile Settings</summary>`
3. Profile slug input is inside `<details>` block
4. Bio textarea is inside `<details>` block
5. Profile visibility toggle is inside `<details>` block
6. Save button is inside `<details>` block
7. Public link copy button is inside `<details>` block
8. Account card (`meAccountCardHtml`) is separate from Profile Settings block
9. `renderMe()` still calls `GET /api/my-humanx`
10. Recent Truths still appears immediately after the filter bar
11. Review explanation `"awaiting admin approval"` remains in `renderMeHtml`
12. Yellow `b-yellow` badge for Review state preserved
13. Truth submission still references `review_state`
14. D-285B post-submit navigation preserved (`renderMe()`, `tab-me`, toast)
15. `draftTruthFromAnalysis()` does not call `submitTruth()`
16. Public profile does not include `meProfileSettingsHtml`
17. No backend/API/schema/storage changes
18. No CSS changes
19. Drift/Belief expansion files untouched

(Items 16–19 counted within the 15 test blocks as multi-assertion tests.)

---

## Static Checks

| Check | Before D-293B | After D-293B |
|-------|---------------|--------------|
| `node --check public/app-v10.js` | exit 0 | exit 0 |
| `hardening-smoke-test.mjs` | `3405 passed, 0 failed` | `3424 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 warn` | `57 passed, 0 failed / 1 warn` |

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-293A | No | Product pass / docs only |
| D-293B | **Yes — owner deployed** | PASS — D-293C live closeout (27/27) |
| D-293C | No | Live closeout |

### D-293C Live Sanity (2026-07-02) — 27/27 PASS

| # | Check | Result |
|---|-------|--------|
| 1 | Live HumanX opens after deploy | PASS |
| 2 | Owner opens My HumanX without console-breaking errors | PASS |
| 3 | Account card remains visible | PASS |
| 4 | Profile Settings summary is visible | PASS |
| 5 | Profile Settings controls are collapsed behind native details/summary | PASS |
| 6 | Expanding Profile Settings reveals profile visibility toggle | PASS |
| 7 | Expanding Profile Settings reveals slug input | PASS |
| 8 | Expanding Profile Settings reveals bio textarea | PASS |
| 9 | Expanding Profile Settings reveals preview/guardrail copy | PASS |
| 10 | Expanding Profile Settings reveals Save button | PASS |
| 11 | Expanding Profile Settings reveals Copy public link button/output | PASS |
| 12 | Profile save behavior remains unchanged | PASS |
| 13 | Public-link copy behavior remains unchanged | PASS |
| 14 | My Content counts remain visible/reachable | PASS |
| 15 | Filter bar remains visible/reachable | PASS |
| 16 | Recent Truths remains immediately after the filter bar | PASS |
| 17 | Review explanation: `"Review: awaiting admin approval — goes Public when approved."` | PASS |
| 18 | Pending Review Truths still show yellow `Review` badge | PASS |
| 19 | Truth submission still uses `review_state='review'` | PASS |
| 20 | D-285B post-submit navigation preserved (`renderMe()`, `tab-me`, toast) | PASS |
| 21 | `Draft Truth from analysis` remains draft-only | PASS |
| 22 | Public profile `/u/:slug` unaffected | PASS |
| 23 | Review/moderation unchanged | PASS |
| 24 | My HumanX data source remains `GET /api/my-humanx` | PASS |
| 25 | No backend/API/schema/storage behavior changed | PASS |
| 26 | Drift/Belief expansion unaffected | PASS |
| 27 | No console errors | PASS |

**Deployed Worker version:** not captured
