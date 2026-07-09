# D-314A — README Known-Good Baseline Correction

**Scope:** Docs only (plus one approved test-assertion sync, see "Deviation Flagged" below)
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3529 passed / 0 failed / 104 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Date:** 2026-07-09
**HEAD at task start:** `47ffe0b` (D-313F)

---

## GitHub Sync

`git status -sb` → `## main...origin/main`, no ahead/behind.
`git ls-remote origin refs/heads/main` → `47ffe0bcaecf6b50f5bd463f33b4ea90a726b0f0`.

Both confirm local `main` is synced with `origin/main` at `47ffe0b`. No discrepancy.

---

## Stale Values Corrected

`docs/README.md`'s top-of-file **Known-good checks** table (around line 40–42) still documented pre-D-313 counts:

| Script | Before (stale) | After (correct) |
|---|---|---|
| `hardening-smoke-test.mjs` | `3442 passed, 0 failed` | `3529 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` | `104 passed, 0 failed (104 hard checks)` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (57 hard checks)` | unchanged — already correct |

`docs/PROJECT_STATE.md` was checked for the same stale values and found already correct (baseline 3529/104/57 throughout, per D-313F) — no changes needed there.

Historical arc-summary prose elsewhere in `docs/README.md` (e.g. the D-295/D-297 entries mentioning "Baseline 3442/0/24/57") was **left untouched** — those are accurate records of what the baseline was at that point in project history, not claims about the current state.

---

## Deviation Flagged: One Test Assertion Updated

After correcting the README table, `node scripts/hardening-smoke-test.mjs` dropped from `3529 passed, 0 failed` to `3528 passed, 1 failed`. The failure was a self-referential doc-sync guard at `scripts/hardening-smoke-test.mjs:838–840`:

```js
test('docs/README.md documents belief engine count: 24 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('24 passed, 0 failed'), 'docs/README.md must document belief engine static check expected count of 24');
});
```

This test's own preceding comment (line 832–833) reads: *"Self-reference: when new checks are added to this file, update docs/README.md Known-good checks table and this assertion together in the same commit."* Grepping confirmed `'24 passed, 0 failed'` had no other occurrence in `docs/README.md` (it existed only in the now-corrected Known-good table), so the assertion was checking a value that no longer existed anywhere in the doc.

D-314A's task instructions said "do not change tests." This was flagged to the user via `AskUserQuestion` rather than resolved unilaterally, given the direct conflict with the "3529 passed, 0 failed" required baseline. The user confirmed: update the test assertion in the same commit, per the test's own documented convention. Changed to:

```js
test('docs/README.md documents belief engine count: 104 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('104 passed, 0 failed'), 'docs/README.md must document belief engine static check expected count of 104');
});
```

No other test logic changed. Test count in the suite unchanged (still one test at this position, value updated in place).

---

## Checks

| Check | Result |
|---|---|
| `git status -sb` / `git ls-remote origin refs/heads/main` (before this task) | Synced at `47ffe0b`, no divergence |
| `node --check public/app-v10.js` | Clean, exit 0 |
| `node scripts/hardening-smoke-test.mjs` | 3529 passed, 0 failed (restored, after the approved test-assertion sync) |
| `node scripts/belief-engine-static-check.mjs` | 104 passed, 0 failed |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Files Changed

- `docs/README.md` — Known-good checks table corrected (hardening 3442→3529, belief-engine 24→104)
- `scripts/hardening-smoke-test.mjs` — one self-referential test assertion updated (24→104), per its own documented same-commit-sync convention, approved by the user after being flagged
- `docs/D314A_README_KNOWN_GOOD_BASELINE_CORRECTION.md` — this doc

**Not modified:** `docs/PROJECT_STATE.md` (already correct — checked, no stale values found), `public/app-v10.js`, `public/index.html`, `public/apps/humanx-belief-engine/*`, `public/belief-drift-expansion.js`, `public/styles.css`, `src/worker.js`, `scripts/belief-engine-static-check.mjs`, `scripts/worker-route-static-check.mjs`, migrations.

---

## Summary

| Item | State |
|---|---|
| GitHub sync | Confirmed — local and `origin/main` both at `47ffe0b` |
| Stale values corrected | `docs/README.md` Known-good table: hardening 3442→3529, belief-engine 24→104 |
| Scope | Docs only, plus one approved test-assertion sync (flagged and confirmed by user before applying) |
| Baseline | Unchanged overall — 3529/104/57 (briefly 3528/1 mid-task until the approved test sync restored it) |
| Deploy needed | No — docs/test-assertion-only change |
| PROJECT_STATE.md | No changes needed — already accurate |
