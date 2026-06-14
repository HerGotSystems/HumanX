# D-124F — Belief Engine Saved-Results / Privacy Flow Smoke

**Date:** 2026-06-14
**Branch:** docs/d124d-belief-privacy-audit (main post-D-124E merge)
**Auditor:** Claude (automated, D-124F task)
**Scope:** Post-merge functional smoke of the saved-results and privacy flow. Static/code-level audit only — no browser automation. No scoring, questions, bridge payload, backend, Worker, or schema changes.

**Verdict: PASS WITH NOTES**

---

## Checks Run

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Scenario-by-Scenario Findings

### Scenario 1 — Fresh browser / localStorage empty

**Code path:** On page load, `render()` → `renderIntro()` (line 1819–1821):
```javascript
function renderIntro(){
  const saved=localStorage.getItem('humanx_belief');
  $id('existing-btn').classList.toggle('hidden',!saved);
}
```

`humanx_belief` is absent → `existing-btn` gets class `hidden` → both the "View previous results" label and the Clear button are invisible (they are children of the hidden container).

**Result: PASS** — intro renders, button block fully hidden when no saved data.

---

### Scenario 2 — After a completed run

**Code path:** `finishQuiz()` → `saveRunRecord()` (lines 1470–1480):
```javascript
localStorage.setItem(key, JSON.stringify(payload));          // e.g. humanx_belief_main
localStorage.setItem('humanx_belief', JSON.stringify(payload)); // legacy pointer, always written
```

Then `render()` → `state.phase='results'` → intro not re-rendered. On page reload, `renderIntro()` finds `humanx_belief` → button block becomes visible.

HTML structure (lines 427–433):
```html
<div id="existing-btn" class="existing-result hidden">
  <div class="existing-main" onclick="showResults()">
    ↩ View previous results
    <span class="existing-note">saved in this browser · includes any answers you typed · not synced</span>
  </div>
  <button class="existing-clear" onclick="clearSavedResults()">Clear</button>
</div>
```

Both the note and the Clear button appear as part of the same revealed container.

**Result: PASS** — saved result exists, button block shows with privacy note and Clear button.

---

### Scenario 3 — Click "View previous results"

**Code path:** `showResults()` (lines 1583–1598):
```javascript
const saved = localStorage.getItem('humanx_belief_main') || localStorage.getItem('humanx_belief');
if(!saved) return;
const d = JSON.parse(saved);
state.answers = d.answers;
state.timeline = d.timeline || {};
// ... calcAlignments, detectContradictions, calcMetaReport — all local
state.phase = 'results';
render();
```

- All computation is local (no `fetch`, no `sendBeacon`, no tracking pixel in the entire `index.html`).
- `state.timeline` is restored from localStorage so locally-typed text is visible in the timeline result panel.
- The only `fetch` in the codebase is in `humanx-bridge.js` line 99, inside `sendBeliefEngineToHumanX()`, only triggered by explicit button click.

**Result: PASS** — previous result loads, timeline visible locally, zero network calls.

---

### Scenario 4 — Click Clear from intro

**Code path:** `clearSavedResults()` (lines 1532–1536):
```javascript
function clearSavedResults(){
  ['humanx_belief','humanx_belief_main','humanx_belief_sandbox_latest','humanx_belief_anonymous_latest',
   'humanx_belief_sandbox_runs','humanx_belief_anonymous_runs'].forEach(k=>localStorage.removeItem(k));
  $id('existing-btn').classList.add('hidden');
}
```

Removes all six known BE localStorage keys. Manually hides the button without a full `render()` call (correct — no phase transition needed).

On reload: `renderIntro()` finds `humanx_belief` → null → button stays hidden.

**Result: PASS** — all 6 keys cleared, button hides immediately, reload stays clean.

---

### Scenario 5 — Click Retake from result/export panel

**Code path:** `retake()` (lines 1523–1531):
```javascript
function retake(){
  state.answers={};state.scores=null;state.alignments=null;state.contradictions=null;
  state.timeline={childBelief:'',teenChange:'',adultBelief:'',biggest:'',fearTrue:'',isolate:'',identity:''};
  localStorage.removeItem(getStorageKey());          // removes mode-specific key
  localStorage.removeItem('humanx_belief');          // removes legacy pointer (D-124E fix)
  state.phase='quiz';state.catIndex=0;
  render();
  scrollTopNow();
}
```

`getStorageKey()` returns the key for `state.profileMode` at retake time (set correctly by `showResults()` when loading a previous result). Both the mode-specific key and the legacy pointer are removed.

After retake, `state.phase='quiz'` so `renderIntro()` is not called — the intro button's visibility is irrelevant until the user navigates back to intro. On page reload: `humanx_belief` is absent → button hidden.

**Result: PASS** — current mode key and legacy pointer removed; intro button does not resurface stale data.

---

### Scenario 6 — Send-to-HumanX note and payload

**Bridge note (humanx-bridge.js, line 139):**
```
Saved: dimension scores, alignment patterns, contradiction summary, and moral-scenario responses.
Not saved: private timeline text or free-text answers you typed.
Nothing is published — the snapshot enters your Drift for your own review only.
```

**Payload (D-124C):** `includesTimeline: false`; `raw.timeline` explicitly excluded; only `meta.stress` (predefined choice labels from `calcMetaReport`) included in `stressPoints`. No user-typed text in outbound payload.

**Result: PASS** — note text accurately describes payload; D-124C clean payload confirmed.

---

### Scenario 7 — Layout: Clear and View are independent click targets

**CSS:** `.existing-result` is `display:flex; align-items:center; gap:12px`.
- `.existing-main` has `flex:1; cursor:pointer; text-align:left` — fills available width, handles `onclick="showResults()"`.
- `.existing-clear` has `flex-shrink:0; white-space:nowrap` — pinned to the right, handles `onclick="clearSavedResults()"`.

The two `onclick` handlers are on separate elements (`div` and `button`). There is no event propagation risk — `existing-main` is a `div`, `existing-clear` is a `button` inside the parent `div.existing-result`. Clicking the button triggers only `clearSavedResults()`; clicking the left div area triggers only `showResults()`.

The parent `.existing-result` div has no `onclick` of its own, so there is no double-fire on Clear.

**Result: PASS** — click targets are independent; no layout collision.

---

## Notes (Non-Blocking)

### N1 — `renderIntro()` checks only the legacy pointer, not mode-specific keys

`renderIntro()` shows the button when `humanx_belief` exists. `humanx_belief` is always written by `saveRunRecord()` regardless of mode. After a sandbox `retake()`, `humanx_belief` is cleared — even if `humanx_belief_main` holds valid main-profile data. On the next page load, the intro button will not appear, even though main data exists.

Impact: Low. The user re-entering the flow starts at quiz (not intro), so they won't see the missing button until they reload. On reload after a sandbox retake, main data is silently retained in `humanx_belief_main` but not surfaced by the intro button. This data persists until a new run overwrites it or `clearSavedResults()` removes all keys.

Classification: UX gap, not a privacy defect. No data is leaked; data is only under-surfaced.

### N2 — `showResults()` always prefers `humanx_belief_main` over the legacy pointer

If a user has done both a main run and a subsequent sandbox run:
- `humanx_belief` points to the sandbox run (most recent write)
- `humanx_belief_main` still holds the main run

`showResults()` reads `humanx_belief_main || humanx_belief`, so it loads the older main run rather than the most-recent sandbox run. The intro button appears (because `humanx_belief` exists), but tapping it loads different data than `humanx_belief` contains.

Impact: Low. Sandbox runs are intended as ephemeral tests. The main profile is the canonical record. The current behaviour correctly prioritises it. However, a user who just completed a sandbox run and then clicks "View previous results" may be surprised to see their earlier main-profile instead.

Classification: Design choice / minor UX inconsistency. Not a privacy defect. Flagged for awareness.

---

## Summary

All 7 smoke scenarios pass at code level. No real bugs found. No patch required. Two low-impact UX notes documented above; neither is a privacy defect or data-loss risk.

| Scenario | Result |
|---|---|
| 1. Fresh browser — button hidden | PASS |
| 2. After run — note + Clear visible | PASS |
| 3. View previous results — local only, no network | PASS |
| 4. Clear from intro — all 6 keys removed | PASS |
| 5. Retake — legacy key removed, no stale button | PASS |
| 6. Send-to-HumanX note and payload | PASS |
| 7. Click target independence | PASS |
| Static check (24/24) | PASS |
| Syntax check | PASS |
| Hardening smoke (416/416) | PASS |
