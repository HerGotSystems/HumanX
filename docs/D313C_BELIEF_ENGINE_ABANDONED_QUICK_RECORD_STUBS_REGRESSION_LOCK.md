# D-313C — Belief Engine Abandoned Quick-Record Stubs Regression Lock

**Scope:** Tests only (no behavior/code changes)
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 → 3529 passed / 0 failed / 104 (belief-engine, unchanged) / 57 (route, 1 known warn, unchanged)
**Date:** 2026-07-08
**HEAD at implementation:** `45ff89b` (D-313B)

---

## D-313B Finding Addressed

D-313B audited the abandoned "quick record" stub cluster in `public/app-v10.js` lines 148–152 (`n(id)`, `v(id)`, `buildBeliefSnapshot()`, `classifyBelief()`, `beliefPreview()`, `saveBeliefMirror()`) and confirmed all six are truly dead/unreachable — but found zero existing test coverage, which the task's own gating rule treats as blocking any same-pass removal. D-313C closes that gap: it adds regression-lock tests proving the dead state, so a future removal pass can verify it is behavior-neutral, and so nobody can silently wire one of these stubs to real behavior without updating this lock.

**No stubs were deleted in this pass** — this is deliberately tests-only, per the task's explicit instruction to stop at a test lock unless an established repo convention combines lock-and-cleanup in one step (no such convention was found; every prior D-30x arc in this session added tests as a distinct step from behavior changes).

---

## Implementation

**File changed:** `scripts/hardening-smoke-test.mjs` only (no `public/app-v10.js`, no `public/index.html`, no `humanx-bridge.js`, no CSS, no backend).

**Location:** Belief Engine dead-stub content lives in `public/app-v10.js`, not the standalone Belief Engine file — so per this repo's established convention (`scripts/belief-engine-static-check.mjs` tracks `public/apps/humanx-belief-engine/*`; `scripts/hardening-smoke-test.mjs` tracks the main-app file `public/app-v10.js`), these locks belong in `hardening-smoke-test.mjs`, not the belief-engine-specific suite.

**14 new tests added**, in a new `// ── D-313C: Belief Engine abandoned quick-record stubs regression lock ──` block, inserted immediately before the file's `// ── Summary ──` section:

1. Sanity check that the dispatch-map slice bounds (`_D181B_ZERO_PARAM_ACTIONS={` through the click-dispatcher definition) are found and non-trivial
2. `buildBeliefSnapshot` absent from the combined action-dispatch map region
3. `classifyBelief` absent from the combined action-dispatch map region
4. `beliefPreview` absent from the combined action-dispatch map region (despite being exported to `window`)
5. `saveBeliefMirror` absent from the combined action-dispatch map region (despite being exported to `window`)
6. No live call-site invokes `n('...')` or `v('...')` — regex-checked across the whole file, distinguishing real calls (string-literal argument) from the functions' own bare-parameter definitions
7. `public/index.html` contains no reference to any of the four named stubs
8. All four stub function bodies match their exact audited text verbatim (`buildBeliefSnapshot(){return{}}`, `classifyBelief(){return'open belief'}`, `beliefPreview(){}`, `saveBeliefMirror(){location.href='/apps/humanx-belief-engine/'}`) — locks that no accidental behavior has been added to any of them
9. The stub cluster (from `function n(id)` through the start of `promoteBelief`) contains no `fetch(`, `/api/`, `promoteBelief(`, `generateRunPack`, `localStorage`, or `sessionStorage` references
10. The stub cluster contains no `/api/claims`, `/api/truths`, `/api/runpack`, `/api/belief-promote`, or `review_state` references — i.e., no Claim/Truth/RunPack/Review creation path
11. `isFullBeliefProfile` remains defined — confirms the real, live quick-record/full-profile labeling logic (explicitly out of scope for any future cleanup) is untouched
12. `beliefSnapshotCard` remains defined and still labels full vs. quick snapshots — same purpose as test 11, for the card-rendering side
13. `belief-drift-expansion.js` still renders the `"quick record"` badge text — confirms the separate Drift-expansion display feature is untouched
14. `promoteBelief` (the real, wired neighbor function, one line below the stub cluster) remains correctly registered in `_D181F_DUAL_ACTIONS` — a control check proving the dispatch-map absence tests (2–5) are meaningful and not a false negative from a bad slice

Hardening smoke baseline: **3515 → 3529 passed, 0 failed** (+14 net).

---

## Invariants Locked

| Invariant | Enforced by |
|---|---|
| The six stub names never appear in any action-dispatch map | Tests 2–5 |
| `n`/`v` helpers have zero real call sites | Test 6 |
| `index.html` never references the four named stubs | Test 7 |
| Stub bodies stay exactly as audited (no silently-added behavior) | Test 8 |
| Stub cluster never gains a fetch/API/backend reference | Test 9 |
| Stub cluster never gains a Claim/Truth/RunPack/Review creation path | Test 10 |
| Real quick-record/full-profile labeling and rendering logic stays intact | Tests 11, 12, 13 |
| The dispatch-map check itself remains valid (not a false negative) | Test 14 |

---

## No Behavior/Backend Changes

- `public/app-v10.js` — **not modified.** The six stub functions still exist exactly as D-313B found them; this pass only added tests that read and assert against the existing file.
- `public/index.html` — not modified.
- `public/apps/humanx-belief-engine/index.html` — not modified.
- `public/apps/humanx-belief-engine/humanx-bridge.js` — not modified; no test-only reference was needed, since the stub cluster lives entirely in `app-v10.js` and has no relationship to the bridge file.
- `public/belief-drift-expansion.js` — not modified; only read by a new test to confirm its existing "quick record" badge text is unchanged.
- `public/styles.css` — not modified.
- `src/worker.js`, D1, schema, storage, auth, API routes, migrations — none touched or referenced by any new test.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | 3529 passed, 0 failed (3515 → 3529, +14) |
| `node scripts/belief-engine-static-check.mjs` | 104 passed, 0 failed (unchanged) |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A, unchanged) |

---

## Files Changed

- `scripts/hardening-smoke-test.mjs` — 14 new D-313C tests
- `docs/D313C_BELIEF_ENGINE_ABANDONED_QUICK_RECORD_STUBS_REGRESSION_LOCK.md` — this doc
- `docs/README.md` — index updated

**Not modified:** `public/app-v10.js`, `public/index.html`, `public/apps/humanx-belief-engine/index.html`, `public/apps/humanx-belief-engine/humanx-bridge.js`, `public/belief-drift-expansion.js`, `public/styles.css`, `src/worker.js`, `scripts/belief-engine-static-check.mjs`, `scripts/worker-route-static-check.mjs`, migrations.

---

## Recommended D-313D Classification

**A — remove the abandoned stubs.**

With this lock now in place and passing, the four gating conditions from D-313B/D-313C are all satisfied for the first time: tiny, frontend-only, confirmed unreachable/dead, and now **covered by tests**. D-313D can safely delete the six dead lines (`n`, `v`, `buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror`) from `public/app-v10.js`, along with their two `window.*` export entries (`beliefPreview`, `saveBeliefMirror`) at line 592, and then update tests 2–10 and 14 above from "must remain absent/unchanged" assertions to "must not exist" assertions (since there will be nothing left to check the body/absence of). Test 14 (the `promoteBelief` control check) should be preserved as-is, since `promoteBelief` itself is not being touched.

Not recommended: **B** (add more tests first) — this lock is already thorough across dispatch-map presence, call-site absence, markup absence, body-exactness, and API/creation-path absence; more tests would not change the removal decision. **C** (docs-only checkpoint) — premature, since no implementation has landed yet to checkpoint. **D** (no-op) — incorrect, since real dead code was found and confirmed removable.

---

## Summary

| Item | State |
|---|---|
| D-313B finding addressed | Yes — dead-state now test-locked before any removal |
| Stubs deleted in this pass | No — tests only, as instructed |
| Tests added | 14, in `scripts/hardening-smoke-test.mjs` |
| Hardening baseline | 3515 → 3529 (+14) |
| Belief static baseline | 104 (unchanged) |
| Worker route static baseline | 57/0/1 warn (unchanged) |
| Behavior/backend files touched | None |
| Recommended D-313D | **A — remove the abandoned stubs** (all four gating conditions now met) |
