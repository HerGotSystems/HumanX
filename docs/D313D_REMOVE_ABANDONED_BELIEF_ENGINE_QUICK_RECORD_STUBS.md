# D-313D — Remove Abandoned Belief Engine Quick-Record Stubs

**Scope:** Frontend cleanup (`public/app-v10.js`) + test conversion + docs
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3529 passed / 0 failed (unchanged) / 104 (belief-engine, unchanged) / 57 (route, 1 known warn, unchanged)
**Date:** 2026-07-08
**HEAD at implementation:** `b9bdd8e` (D-313C)

---

## D-313B/C Finding Addressed

D-313B audited and confirmed a six-item dead stub cluster in `public/app-v10.js` lines 148–152. D-313C locked that confirmed-dead state with 14 regression tests before allowing any removal. With that lock in place and passing, all four gating conditions (tiny, frontend-only, confirmed unreachable/dead, now test-covered) were satisfied, so D-313D performs the actual deletion the D-313C doc explicitly recommended as the next step.

---

## Exact Lines/Functions Removed

**From `public/app-v10.js`**, the five-line block immediately after `beliefSnapshotCard()` and immediately before `promoteBelief()`:

```js
function n(id){return Number(document.getElementById(id)?.value||0)}function v(id){return document.getElementById(id)?.value||''}
function buildBeliefSnapshot(){return{}}
function classifyBelief(){return'open belief'}
function beliefPreview(){}
async function saveBeliefMirror(){location.href='/apps/humanx-belief-engine/'}
```

Deleted in full: `n(id)`, `v(id)`, `buildBeliefSnapshot()`, `classifyBelief()`, `beliefPreview()`, `saveBeliefMirror()`.

**Stray `window.*` exports removed** from the single-line export list (previously containing `window.saveBeliefMirror=saveBeliefMirror;window.beliefPreview=beliefPreview;` immediately before `window.promoteBelief=promoteBelief;`):

- `window.beliefPreview=beliefPreview;` — removed
- `window.saveBeliefMirror=saveBeliefMirror;` — removed
- `window.promoteBelief=promoteBelief;` — **preserved, untouched**

**Total diff footprint:** 5 lines removed from the function-definition area, 2 export entries removed from the single-line export statement. `beliefSnapshotCard()` immediately above and `promoteBelief()` immediately below are now directly adjacent, both byte-for-byte unchanged.

---

## Exact D-313C Tests Converted

In `scripts/hardening-smoke-test.mjs`, within the `// ── D-313C/D: Belief Engine abandoned quick-record stubs regression lock ──` block:

| Test | Before (D-313C) | After (D-313D) |
|---|---|---|
| Test 8 | `'stub function bodies remain exactly as audited'` — asserted each of the four stub bodies matched its exact audited text | **`'the four named abandoned stub functions no longer exist'`** — asserts `function buildBeliefSnapshot`, `function classifyBelief`, `function beliefPreview`, `function saveBeliefMirror` are all absent from `app-v10.js` |
| Test 9 | `'stub cluster contains no fetch/API/backend calls'` — sliced from `function n(id)` to `async function promoteBelief` and checked the slice for risky markers | **`'the n(id)/v(id) helper definitions no longer exist'`** — asserts `function n(id)` and `function v(id)` are both absent (the old slice-based approach no longer applies since there is no cluster left to slice) |
| Test 10 | `'stub cluster creates no Claim/Truth/RunPack/Drift/Review behavior'` — same slice-based approach | **`'stray window exports for beliefPreview and saveBeliefMirror are removed'`** — asserts both stray exports are gone, and explicitly asserts `window.promoteBelief=promoteBelief` **is still present** (confirms the real neighbor wasn't collaterally removed) |

**Tests 1–7 and 11–14 were left unchanged** — they were already written as absence/presence checks that remain valid and still pass after the deletion (dispatch-map absence checks, `index.html` absence check, `n`/`v` call-site absence check via regex, and the preserve-checks for `isFullBeliefProfile`, `beliefSnapshotCard`, the Drift-expansion "quick record" badge, and `promoteBelief`'s continued dispatch-map wiring).

**Test count unchanged: still 14 tests in this block** — same names/numbers 1–14, three converted in purpose, eleven untouched.

---

## Preserved Real Quick-Record/Full-Profile Display Logic

Confirmed untouched, byte-for-byte, by direct diff review and by tests 11–13 continuing to pass:

- `isFullBeliefProfile` — still defined, still used by `beliefSnapshotCard(s)` to decide `full`
- `beliefSnapshotCard(s)` — still defined immediately above where the stub cluster used to sit; still renders `full profile` vs. quick-record badges
- `public/belief-drift-expansion.js` — not modified at all; still renders its own `"quick record"` badge text

---

## No Backend/API/D1/Schema/Storage/Auth/Migration Changes

- `src/worker.js` — not modified
- `public/apps/humanx-belief-engine/humanx-bridge.js` — not modified (no reference to any of the six removed names existed there to begin with, per D-313B's audit)
- `public/apps/humanx-belief-engine/index.html` — not modified
- `public/index.html` — not modified (confirmed no reference to any of the six names existed there before or after)
- `public/styles.css` — not modified
- No D1/schema/storage/auth/API route was ever referenced by the removed code, so none required any change
- `promoteBelief()` (the real, active neighbor function using `/api/belief-promote`) — untouched, confirmed by diff and by test 10's explicit presence check

---

## Checks

| Check | Result |
|---|---|
| `node --check public/app-v10.js` | Clean, exit 0 |
| `node scripts/hardening-smoke-test.mjs` | 3529 passed, 0 failed (unchanged — same 14 D-313C/D tests, converted in place, not added/removed) |
| `node scripts/belief-engine-static-check.mjs` | 104 passed, 0 failed (unchanged) |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A, unchanged) |

---

## Files Changed

- `public/app-v10.js` — five dead lines removed, two stray `window.*` exports removed
- `scripts/hardening-smoke-test.mjs` — tests 8, 9, 10 converted from "matches audited stub body" to "stub no longer exists"
- `docs/D313D_REMOVE_ABANDONED_BELIEF_ENGINE_QUICK_RECORD_STUBS.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/index.html`, `public/apps/humanx-belief-engine/index.html`, `public/apps/humanx-belief-engine/humanx-bridge.js`, `public/belief-drift-expansion.js`, `public/styles.css`, `src/worker.js`, `scripts/belief-engine-static-check.mjs`, `scripts/worker-route-static-check.mjs`, migrations.

---

## Recommended D-313E Classification

**A — D-313E docs/checkpoint closeout.**

This completes the full D-313 arc (audit → test lock → removal). A checkpoint should now close it in `docs/PROJECT_STATE.md`: record that the abandoned quick-record stub cluster has been fully removed, update the "Next Belief Engine work" lane (there is no longer any known outstanding Belief Engine finding from the original D-306A audit — all three secondary findings, navigation, result-page handoff, bridge-copy precision, and now the dead stubs, are complete), and note the baseline is unchanged at 3529/104/57 since this was a zero-risk, test-covered deletion.

Not recommended: **B** (more test lock needed) — the lock already fully covered the removal, and all tests still pass after conversion; no gap remains. **C** (no-op) — incorrect, real code was removed. **D** (branch/PR required) — incorrect, this was a tiny, frontend-only, fully test-covered deletion with zero backend/API/D1/schema/storage/auth surface, squarely within the "small frontend/docs/tests can go direct to main" workflow rule.

---

## Summary

| Item | State |
|---|---|
| D-313B/C findings addressed | Yes — dead cluster removed, exactly as the test lock predicted was safe |
| Functions/lines removed | `n(id)`, `v(id)`, `buildBeliefSnapshot()`, `classifyBelief()`, `beliefPreview()`, `saveBeliefMirror()` — 5 lines |
| Stray window exports removed | `window.beliefPreview`, `window.saveBeliefMirror` — 2 entries |
| `promoteBelief` | Untouched — confirmed by diff and by regression test |
| Real quick-record/full-profile display logic | Untouched — `isFullBeliefProfile`, `beliefSnapshotCard`, `belief-drift-expansion.js` badge all confirmed intact |
| Tests converted | 3 (tests 8, 9, 10) — from "body matches" to "does not exist" |
| Test count | Unchanged — still 14 in this block |
| Baseline | Unchanged — 3529/104/57 |
| Backend/API/D1/schema/storage/auth/migration changes | None |
| Recommended next step | **A — D-313E docs/checkpoint closeout** |
