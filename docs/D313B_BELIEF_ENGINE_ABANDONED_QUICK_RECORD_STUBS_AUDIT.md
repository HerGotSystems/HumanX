# D-313B — Belief Engine Abandoned Quick-Record Stubs Audit

**Scope:** Docs only (audit — no code changes)
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 104 (belief-engine) / 57 (route, 1 known warn) — unchanged
**Date:** 2026-07-08
**HEAD at pass:** `dcb18a6` (D-313A)

---

## Purpose

D-313A closed the D-312 bridge-copy precision arc and left exactly one remaining narrow Belief Engine candidate: the abandoned "quick record" stubs first flagged in D-306A. This pass audits them directly against the code — locating exact files, functions, and call sites — before any implementation decision.

---

## Search Method

Searched the full repo for: `quick record`, `quick-record`, `quickRecord`, `record`, `save`, `snapshot`, `Drift`, `Send to HumanX`, `claim`, `Truth`, `RunPack`, `review`, plus every function name found along the way (`buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror`, and the generic helpers `n(id)`/`v(id)`). Checked every call site, every `window.*` export, every `data-action` dispatch table, and `public/index.html` for corresponding markup.

---

## Exact Findings

### The stub cluster

All six items sit together in `public/app-v10.js`, lines 148–152, immediately after `beliefSnapshotCard()` (line 147) and immediately before `promoteBelief()` (line 153):

```js
function n(id){return Number(document.getElementById(id)?.value||0)}
function v(id){return document.getElementById(id)?.value||''}
function buildBeliefSnapshot(){return{}}
function classifyBelief(){return'open belief'}
function beliefPreview(){}
async function saveBeliefMirror(){location.href='/apps/humanx-belief-engine/'}
```

| Function | Line | Body | Exported to `window`? | Wired to any `data-action`/`onclick`? | Called anywhere else? |
|---|---|---|---|---|---|
| `n(id)` | 148 | Reads a numeric field value by DOM id | No | No | **No — zero call sites anywhere in the repo** |
| `v(id)` | 148 | Reads a string field value by DOM id | No | No | **No — zero call sites anywhere in the repo** |
| `buildBeliefSnapshot()` | 149 | Returns `{}` | **No** — absent from the `window.*` export list (line 592) | No | **No — zero call sites** |
| `classifyBelief()` | 150 | Returns the hardcoded string `'open belief'` | **No** — absent from the export list | No | **No — zero call sites** |
| `beliefPreview()` | 151 | Empty body — no-op | **Yes** — `window.beliefPreview=beliefPreview` at line 592 | **No** — absent from `_D181B_ZERO_PARAM_ACTIONS`, `_D181C_PARAM_ACTIONS`, `_D181E_ID_ACTIONS`, and `_D181F_DUAL_ACTIONS`; no `onclick="beliefPreview...` in `public/index.html` | No |
| `saveBeliefMirror()` | 152 | `location.href='/apps/humanx-belief-engine/'` — pure client-side redirect | **Yes** — `window.saveBeliefMirror=saveBeliefMirror` at line 592 | **No** — same negative result as `beliefPreview()` | No |

**Confirmed via direct inspection of the three action-dispatch maps** (`_D181B_ZERO_PARAM_ACTIONS`, `_D181C_PARAM_ACTIONS`/`_D181E_ID_ACTIONS`/`_D181F_DUAL_ACTIONS`) that every real, reachable click action in the app is registered in exactly one of these tables. None of the six items above appear in any of them. `promoteBelief` (line 153, the very next function) **is** correctly registered in `_D181F_DUAL_ACTIONS` — confirming the dispatch-map check is a reliable way to distinguish "wired" from "orphaned" functions in this codebase, and that the contrast between `promoteBelief` (wired) and its five neighbors (unwired) is real, not a search artifact.

**`public/index.html` contains no markup referencing any of the six names** — no leftover quick-belief mini-form fields, no buttons, no ids that `n()`/`v()` could plausibly have read.

**No test file references any of the six names** — `scripts/hardening-smoke-test.mjs` and `scripts/belief-engine-static-check.mjs` were both searched directly; zero matches.

### The related, but *not* dead, "quick record" display logic

Separately, `public/app-v10.js` and `public/belief-drift-expansion.js` both contain **live, correct, tested code** that *labels* a belief snapshot as a "quick record" (as opposed to a "full profile") based on `isFullBeliefProfile()` — this is downstream *rendering* logic, not a creation path, and it is not part of this finding. It correctly displays whatever data exists (full or quick) and is exercised by existing belief-engine-static-check.mjs markers (`isFullBeliefProfile` presence, classifier markers). This logic should **not** be touched by any future cleanup of the dead stubs above — it serves the Belief Engine's real, standalone-created "full profile" snapshots and would still be correct even with zero quick records ever created.

---

## Classification (per the five categories requested)

| Item | Classification |
|---|---|
| `n(id)`, `v(id)` | **1. Truly unreachable/dead** — no callers anywhere |
| `buildBeliefSnapshot()` | **1. Truly unreachable/dead** — no callers, not exported |
| `classifyBelief()` | **1. Truly unreachable/dead** — no callers, not exported |
| `beliefPreview()` | **1. Truly unreachable/dead in practice** — exported to `window` but never invoked from any UI element; would no-op even if called |
| `saveBeliefMirror()` | **1. Truly unreachable/dead in practice** — exported to `window` but never invoked from any UI element; current body is a harmless redirect, not a "save" |
| "Quick record" labeling/rendering (`isFullBeliefProfile`, `beliefSnapshotCard`, `belief-drift-expansion.js` badge logic) | **Not part of this finding** — live, tested, correct rendering logic; not a stub |

None of the six stub items fall into category 2 (visible but inactive — there is no corresponding visible UI at all), category 3 (active but incomplete — nothing about them is active), category 4 (test-only leftover — zero test references), or category 5 (documentation-only leftover — they are real code, not just doc mentions).

---

## Behavior Confirmation

- **Do any of the six items create Claim/Truth/RunPack/Drift/Review behavior?** No. `n`/`v`/`buildBeliefSnapshot`/`classifyBelief`/`beliefPreview` have no side effects at all (pure reads, empty bodies, or hardcoded returns). `saveBeliefMirror()`'s only behavior is `location.href` navigation — no `fetch(`, no API call, no state mutation.
- **Do any of the six items touch backend/API/D1/storage/auth/schema/migrations?** No. None call `fetch(`, none reference `/api/*`, none touch `localStorage`/`sessionStorage`, none reference any D1/auth/schema concept.
- **Are they reachable from any current entry point** (Home, nav, Drift, My HumanX, Belief Engine)? No — confirmed via the dispatch-map and `index.html` markup checks above.

---

## Required Output: D-313C Classification

Per this task's own explicit gating condition — *"Do not remove or change behavior yet unless the audit proves the change is tiny, frontend-only, unreachable/dead, and covered by tests"* — three of those four conditions are met (tiny, frontend-only, unreachable/dead, all confirmed above with direct evidence), but the fourth is **not**: none of the six items currently have any test coverage in `scripts/hardening-smoke-test.mjs`. That is the one condition this audit cannot satisfy today.

**Recommended next step: C. Test lock only.**

D-313C should add regression tests to `scripts/hardening-smoke-test.mjs` that lock in the current confirmed-dead state *before* any removal is attempted:
1. Assert `n`, `v`, `buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror` are absent from all four action-dispatch maps (`_D181B_ZERO_PARAM_ACTIONS`, `_D181C_PARAM_ACTIONS`, `_D181E_ID_ACTIONS`, `_D181F_DUAL_ACTIONS`)
2. Assert `public/index.html` contains no reference to any of the six names
3. Assert none of the six names appear as a `fetch(`/`/api/` call target (a permanent guarantee that even if someone "wires them up" later, they don't silently gain backend behavior without a new, explicit test update)

Only *after* that lock is in place and passing would a **B. frontend cleanup** task (actually deleting the six dead lines) be safe to do as a same-pass change — at that point the lock tests themselves would need to be either removed or converted to "must not exist" assertions, and the removal would be trivially verifiable as behavior-neutral.

**D. No-op is not correct** — real dead stubs were found, with exact file/line evidence.
**A. Docs-only note** undersells the finding — this audit already produced code-verified evidence suitable for building a targeted test lock.
**E. Branch/PR required** does not apply — nothing here touches backend/API/storage/auth/schema; this remains a small frontend/tests change eligible for direct-to-main per this repo's own workflow rules.

---

## Checks (unchanged, no code was modified)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | 3515 passed, 0 failed |
| `node scripts/belief-engine-static-check.mjs` | 104 passed, 0 failed |
| `node scripts/worker-route-static-check.mjs` | 57 passed, 0 failed, 1 known warn (`/api/u/:slug`, D-218A) |

---

## Summary

| Question | Answer |
|---|---|
| Exact stub locations | `public/app-v10.js` lines 148–152 (`n`, `v`, `buildBeliefSnapshot`, `classifyBelief`, `beliefPreview`, `saveBeliefMirror`) |
| Truly dead/unreachable | Yes, all six — confirmed via dispatch-map, `index.html`, and cross-repo call-site checks |
| Creates Claim/Truth/RunPack/Drift/Review behavior | No |
| Touches backend/API/D1/storage/auth/schema | No |
| Test coverage today | None — zero references in either test file |
| D-313C classification | **C — test lock only** (must precede any removal) |
| Related "quick record" display logic | Live, tested, correct — explicitly not part of this finding, must not be touched |
