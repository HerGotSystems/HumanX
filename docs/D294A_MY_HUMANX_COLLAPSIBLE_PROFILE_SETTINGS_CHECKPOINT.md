# D-294A — My HumanX Collapsible Profile Settings Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3424 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-294A:** `226ebda` (D-293C)
**Files changed:** `docs/D294A_MY_HUMANX_COLLAPSIBLE_PROFILE_SETTINGS_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`

---

## Purpose

Closes the D-293 My HumanX dashboard purpose / collapsible Profile Settings arc with a single durable checkpoint. Future owner-dashboard work starts from the correct live baseline recorded here.

---

## D-293 Arc Summary

### D-293A — My HumanX Dashboard Purpose Product Pass (docs only)

Full 15-question product pass over My HumanX as a whole dashboard, now that the post-submit Truth flow is correct (D-291B/C). Key findings:

- **Page is well-ordered post-D-291B.** The post-submit Truth flow (Recent Truths first after filter bar, Review explanation, yellow badge) works correctly.
- **One remaining medium friction:** Profile Settings is always-open between the Account card and the My Content counts / filter bar / activity area. On every returning-owner visit after initial setup, the slug, bio, toggle, Save, and Copy controls consume vertical space even when the owner has no intention of editing them.
- **Smallest safe fix:** Wrap the editable Profile Settings controls in native `<details>/<summary>`. Account card stays fully visible. No JS, no CSS, no backend change needed.
- **D-293B candidate:** `<details>/<summary>` in `meProfileSettingsHtml()`. Frontend-only. Baseline unchanged: 3405/0/24/57. No deploy.

### D-293B — My HumanX Collapsible Profile Settings

`meProfileSettingsHtml()` updated to wrap all editable controls in `<details>/<summary>`.

**Before:**
```
<div class="panel me-profile-settings">
  <h3>Profile Settings</h3>
  [toggle, slug, bio, preview, Save, Copy]
</div>
```

**After:**
```
<div class="panel me-profile-settings">
  <details>
    <summary>Profile Settings</summary>
    [toggle, slug, bio, preview, Save, Copy]
  </details>
</div>
```

The Account card (`meAccountCardHtml()`) is a completely separate function and panel — unaffected. Only the editable controls inside `meProfileSettingsHtml()` collapse. Native HTML `<details>/<summary>` requires no JS state and no CSS additions.

15 new D-293B tests added. Baseline 3405 → 3424.

### D-293C — Live Closeout

- Owner deploy PASS (2026-07-02)
- 27/27 live sanity PASS
- Deployed Worker version: not captured

---

## D-293 Guarantees (Live State)

| Guarantee | Value |
|-----------|-------|
| Account card always visible | Yes — `meAccountCardHtml()` separate panel above `<details>` block |
| Profile Settings summary always visible | Yes — `<summary>Profile Settings</summary>` always rendered |
| Collapsed controls | Toggle, slug, bio, preview/guardrail copy, Save, Copy link — all inside `<details>` |
| Profile save behavior | Unchanged — `saveProfileSettingsUI` handler untouched |
| Public-link copy behavior | Unchanged — `meCopyProfileLink` handler untouched |
| `meUpdateProfilePreview()` wiring | Unchanged — still wired on toggle, slug, bio inputs |
| My Content counts | Immediately reachable without scrolling through form |
| Filter bar | Immediately reachable |
| Recent Truths | Still first content panel after filter bar (D-291B preserved) |
| Review explanation | `"Review: awaiting admin approval — goes Public when approved."` unchanged |
| Yellow `Review` badge | Preserved — `ME_STATE_CLR.review = 'b-yellow'` |
| `GET /api/my-humanx` data source | Unchanged |
| Public profile `/u/:slug` | Unaffected |
| No CSS, backend, schema, API, migration changes in D-293 | Confirmed |

---

## Preserved Previous Locks

### D-291 Recent Truths Prominence

| Lock | Value |
|------|-------|
| Recent Truths immediately after filter bar | Yes |
| Recent Truths before Recent Claims | Yes |
| Recent Truths before Belief Snapshots / Mirror / Reflection / Avatar | Yes |
| Review explanation present | `"Review: awaiting admin approval — goes Public when approved."` |
| Yellow `Review` badge | Preserved |

### D-285 Owner Pending-Review Truth Visibility

| Lock | Value |
|------|-------|
| All three Truth submission success paths navigate to My HumanX | `submitTruth()`, `submitBuilderTruth()`, `promoteBelief('truth')` — all use `renderMe()` + `tab-me` |
| Post-submit toast | `"Submitted for Review — you can see it in My HumanX with the Review badge."` |
| Pending Truths in My HumanX | Yellow `Review` badge — unchanged |

### D-287 Assisted Truth Draft

| Lock | Value |
|------|-------|
| `"Draft Truth from analysis"` present when `plainLanguageSummary` exists | Yes |
| Prefill source | `plainLanguageSummary` only |
| `verdict` used as Truth content | Never |
| `draftTruthFromAnalysis()` calls `submitTruth()` | No |
| Auto-submit | No |
| Auto-publish | No |

### Truth/Review Baseline

| Lock | Value |
|------|-------|
| Truth creation paths produce `review_state='review'` | Three paths — all unchanged |
| No current route publishes directly without Review | Admin-only `POST /api/review/decision` |
| Saved analysis does not create, submit, approve, or publish a Truth | `saveAnalysisResult()` → `/api/analysis` only |

### RunPack / Saved-Analysis Locks

| Lock | Value |
|------|-------|
| `saveAnalysisResult()` posts only to `/api/analysis` | Unchanged |
| Stale warning | `'claim updated since packet'` |
| `rp-return-section` auto-expands on matching packet | Yes |
| `"Load AI Analysis Return"` title | Present |
| `"Saving does not publish a truth automatically"` copy | Present |

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified in D-294A |
| `scripts/hardening-smoke-test.mjs` | Not modified in D-294A |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |

---

## Static Checks (D-294A)

Docs-only change — no code files modified. Baseline unchanged.

| Check | Expected |
|-------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3424 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deployment State

| Task | Deploy | Result |
|------|--------|--------|
| D-293A | No | Product pass / docs only |
| D-293B | **Yes — owner deployed** | PASS — D-293C live closeout (27/27) |
| D-293C | No | Live closeout |
| D-294A | No | Checkpoint / docs only |
