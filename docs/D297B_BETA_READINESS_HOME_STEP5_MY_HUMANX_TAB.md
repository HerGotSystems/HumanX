# D-297B — Beta Readiness Home Step 5 and My HumanX Tab

**Scope:** Frontend-only (`public/app-v10.js`, `public/index.html`, `scripts/hardening-smoke-test.mjs`)
**Status:** COMPLETE — deploy needed (frontend files changed)
**Branch:** main (direct commit)
**Baseline before D-297B:** 3442 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Baseline after D-297B:** 3462 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/index.html`, `scripts/hardening-smoke-test.mjs`, `docs/D297B_BETA_READINESS_HOME_STEP5_MY_HUMANX_TAB.md`, `docs/README.md`

---

## D-297A Finding Addressed

D-297A found that the post-submit path is unguided: a tester who submits a Claim lands in My HumanX with a yellow Review badge and no on-screen context for what it means, who approves it, or where to track it. The "Me" tab label also does not communicate "owner dashboard" to someone seeing it for the first time.

D-297B addresses both gaps with minimal, targeted changes.

---

## Changes

### 1. Home "Start here" strip — Step 5 added (`public/app-v10.js`)

A fifth step was appended to the `cc-start-strip` inside `renderHome()`:

```html
<div class="cc-start-step">
  <span class="cc-start-n">Step 5</span>
  <b>Track Review</b>
  <span class="cc-start-desc">
    Submitted Truths wait for admin approval and appear in My HumanX with a Review badge.
    Open My HumanX to see status.
  </span>
  <button class="cc-start-btn" data-action="setMode" data-value="me">My HumanX →</button>
</div>
```

The "My HumanX →" button navigates to the Me/My HumanX mode via the existing `data-action="setMode" data-value="me"` pattern — no new event handler.

### 2. "Me" tab label renamed to "My HumanX" (`public/index.html`)

Before:
```html
<button id="tab-me" class="tab" onclick="setMode('me')">Me</button>
```

After:
```html
<button id="tab-me" class="tab" onclick="setMode('me')">My HumanX</button>
```

The `id`, `class`, and `onclick` are unchanged — only the visible text label changed.

---

## Behavior Preserved

| Item | Status |
|------|--------|
| `tab-me` id | Preserved — unchanged |
| `setMode('me')` onclick | Preserved — unchanged |
| `renderMe()` function | Preserved — unchanged |
| D-285B post-submit navigation (`renderMe()`, `tab-me`, toast) | Preserved |
| Toast copy: `"Submitted for Review — you can see it in My HumanX with the Review badge."` | Preserved |
| `GET /api/my-humanx` as My HumanX data source | Preserved |
| Review explanation: `"Review: awaiting admin approval — goes Public when approved."` | Preserved |
| Yellow Review badge (`ME_STATE_CLR.review = 'b-yellow'`) | Preserved |
| Truth submission uses `review_state='review'` | Preserved |
| No auto-publish | Confirmed |
| Admin Review remains the only approval path | Confirmed |
| Public profile `/u/:slug` | Unaffected |
| Saved analysis private | Confirmed |
| `Draft Truth from analysis` draft-only | Confirmed |
| Profile setup nudge (D-295B) | Preserved |
| Profile Settings collapsible (D-293B) | Preserved |
| Recent Truths position (D-291B) | Preserved |

---

## Files Not Modified

| File | Status |
|------|--------|
| `public/styles.css` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `src/worker.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `src/truths.js` | Not modified |
| `migrations/` | Not modified |

---

## Tests

| Category | Count |
|----------|-------|
| New D-297B tests | 18 |
| Updated existing tests (slice size widenings + label update) | 4 |
| Total regression tests (after) | 3462 |

**Updated existing tests:**
- `D-137D: Me nav tab exists in index.html` — assertion updated from `>Me<` to `>My HumanX<` to match renamed label
- `D-159B: Browse Claims card appears before Submit Claim in renderHome` — slice 4000 → 4400 (Step 5 addition shifted content ~300 chars)
- `D-159B: Browse Claims card appears before Belief Engine in renderHome` — slice 4200 → 4600
- `D-159B: Browse Claims card has cc-card-primary class` — slice 4000 → 4400

**New D-297B tests (18):** all confirmed PASS — see test block in `hardening-smoke-test.mjs`.

---

## Static Checks

| Check | Before D-297B | After D-297B |
|-------|---------------|--------------|
| `node --check public/app-v10.js` | exit 0 | exit 0 |
| `hardening-smoke-test.mjs` | `3442 passed, 0 failed` | `3462 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 warn` | `57 passed, 0 failed / 1 warn` |

---

## Deployment State

| Task | Deploy | Notes |
|------|--------|-------|
| D-297A | No | Product pass / docs only |
| D-297B | **Needed** | Frontend files changed (`app-v10.js`, `index.html`) |
