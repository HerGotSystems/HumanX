# D-124D — Belief Engine v2 Post-Merge Privacy Audit

**Date:** 2026-06-14  
**Audited branch:** `main` after D-124C merge (PR #151)  
**Mode:** AUDIT ONLY — read-only. No code changes. No deploy. No Wrangler. No D1. No production query. No admin token. No live writes.

**Verdict: PASS WITH NOTES**

> No user-typed free-text answers are sent to `/api/belief-snapshots` by default after D-124C. All audit questions resolved clean. One transparency note added regarding localStorage (expected behaviour, not a defect).

---

## 1. Files Inspected

| File | Lines read |
|---|---|
| `public/apps/humanx-belief-engine/humanx-bridge.js` | All 153 lines |
| `public/apps/humanx-belief-engine/index.html` | `calcMetaReport` (1848–1907), `saveRunRecord` (1497–1508), outbound-call grep |

---

## 2. Audit Questions — Results

### Q1. Confirm no user-typed timeline/free-text answers are sent to `/api/belief-snapshots` by default.

**CONFIRMED CLEAN.**

`buildHumanXBeliefSnapshot()` in `humanx-bridge.js` reads `s.timeline` only in the removed stressPoints lines. After D-124C, `s.timeline` is never read in that function. The only value from `timeline` that could reach the payload would be through `meta.stress` (via `calcMetaReport`) — see Q4 below.

---

### Q2. Confirm `raw.timeline` is not included in snapshot payload.

**CONFIRMED REMOVED.**

`raw` object in bridge.js lines 74–84:
```javascript
raw: {
  scores,
  alignments,
  contradictions,
  // raw.timeline excluded — contains sensitive free-text typed by the user
  identity,
  answers: s.answers || {},
  profileMode: s.profileMode || 'main',
  metaReport: meta,
  exportedAt: new Date().toISOString()
}
```

`raw.timeline` is absent. No other field in `raw` holds the timeline object. Confirmed by source read.

---

### Q3. Confirm `stressPoints` contains only derived predefined moral-scenario labels, not typed timeline text.

**CONFIRMED CLEAN.**

`stressPoints` is now built solely from `meta.stress`:

```javascript
const stressPoints = [];
if (meta.stress && Array.isArray(meta.stress)) stressPoints.push(
  ...meta.stress.map(x => Array.isArray(x) ? x.join(': ') : String(x))
);
```

`meta.stress` is populated by `calcMetaReport` via a static lookup table (`stressMap`). The lookup uses `getChoiceLabel(qid)` which returns `q.choices[idx]?.label` — a predefined button text (e.g. `"Publish it — truth has no gatekeeper"`). The lookup value is a hardcoded `[title, description]` pair from `stressMap`. No user-typed text enters this chain at any step.

---

### Q4. Check whether `raw.metaReport` can contain copied user-typed timeline/free-text answers.

**CONFIRMED SAFE — main risk item, resolved clean.**

`raw.metaReport` = `s.metaReport` = result of `calcMetaReport(answers, scores, contradictions)`.

`calcMetaReport` signature: `function calcMetaReport(answers, scores, contradictions)` — it does not receive `state.timeline` and never reads it. Its three fields:

| Field | What it contains | Contains user text? |
|---|---|---|
| `meta` | 8 computed numbers (`coherence`, `flexibility`, `tribalDependence`, `authorityReliance`, `epistemicDiscipline`, `identityFragility`, `meaningDependency`, `stressIntegrity`) derived from dimension scores | No |
| `origin` | Up to 5 hardcoded template sentences based on dimension score thresholds (e.g. `"High inherited load: family, culture, tradition..."`) — never reads `state.timeline` | No |
| `stress` | Predefined `[title, description]` pairs from `stressMap` lookup — all values are hardcoded strings, never reads `state.timeline` | No |

`calcMetaReport` is called three times in the codebase:
- `finishQuiz()` — with `(state.answers, scores, state.contradictions)`
- `showResults()` — with same pattern
- `renderForensicPanels()` and `drawShareCard()` inline fallbacks

None of these calls pass timeline data as an argument.

---

### Q5. Check whether `raw.identity` contains only predefined clicked chips and not typed free text.

**CONFIRMED SAFE.**

`raw.identity` = `s.identity`:
```javascript
{
  worldview: [...],   // array of predefined chip labels (e.g. "Christian", "Atheist")
  political: label,   // null or predefined label from POLITICAL_OPTIONS
  settled:  label,    // null or predefined label from SETTLED_OPTIONS
  godCount: label,    // null or predefined label from GOD_COUNT_OPTIONS
}
```

All values are string labels set by clicking chip buttons — no textarea, no free-text input contributes to `identity`. `setGodCount`, `setPolitical`, `setSettled`, and `toggleWorldview` all set values from predefined option arrays only.

---

### Q6. Check whether any other outbound path sends Belief Engine free text by default.

**CONFIRMED CLEAN — no other outbound paths.**

Grep for `fetch(`, `XMLHttpRequest`, `navigator.sendBeacon` in `index.html`: **zero matches.**

The only outbound network call from the Belief Engine is in `humanx-bridge.js` line 96:
```javascript
const res = await fetch('/api/belief-snapshots', { ... body: JSON.stringify({ snapshot, ... }) });
```

This is the single network boundary. The sanitized payload is what crosses it.

---

### Q7. Confirm D-124C did not break the standalone result UI, local state, or Send to HumanX button injection.

**CONFIRMED FUNCTIONAL.**

**Button injection:** `injectHumanXButton()` targets `.results-actions` — preserved unchanged in D-124B. Guard `document.getElementById('send-humanx-btn')` prevents double-injection. MutationObserver still active. Injection order (note → button → existing actions) is correct.

**Local state:** `window.state.timeline` still fully populated from `collectTimeline()`. The timeline result panel (`renderTimelinePanel()`) still renders free-text in the local result screen from `state.timeline`. D-124C only excludes that text from the outbound payload — not from the in-session display.

**Result UI:** No changes to index.html in D-124C. D-124B restructure and all panel IDs intact.

---

### Q8. Confirm checks still pass.

**ALL GREEN.**

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `node --check public/app-v10.js` | **Syntax OK** |
| `node scripts/hardening-smoke-test.mjs` | **416 passed, 0 failed** |

---

## 3. Notes

### N1 — localStorage retains raw timeline text (expected behaviour, not a defect)

`saveRunRecord()` in `index.html` saves the full run state to localStorage including `state.timeline` (all 7 free-text fields). This is intentional — it powers the "View previous results" button on the intro screen.

```javascript
saveRunRecord({
  answers: state.answers,
  identity: state.identity,
  profileMode: state.profileMode,
  timeline: state.timeline,   // ← raw free-text stored locally
  scores,
  metaReport: state.metaReport,
  ts: Date.now()
});
```

This local storage is not a privacy defect — the user's own browser is not an untrusted third party. The privacy boundary enforced by D-124C is **what crosses the network to `/api/belief-snapshots`**, which is now clean.

If a user is concerned about local storage: using Anonymous Voice mode and clearing browser data will remove it. This should be noted in user-facing documentation if the Belief Engine is promoted publicly.

**Action required: None.** Document for future tester onboarding copy.

### N2 — `raw.answers` includes timeline scored-question indices (expected)

`raw.answers` contains all answer values including `TL_DRIFT`, `TL_DRIVER`, `TL_COST` as numeric choice indices (0/1/2/3). These are **not** free text — they are integer indices of which predefined button was clicked on the scored timeline questions. They are correctly included in the payload.

---

## 4. Payload Shape After D-124C

For reference: fields present in the outbound snapshot, post-audit.

| Top-level field | Type | Contains user text? |
|---|---|---|
| `label` | String (derived from alignment name) | No |
| `engineVersion` | `"humanx-belief-engine-v2.0"` | No |
| `source` | `"standalone-humanx-belief-engine"` | No |
| `includesTimeline` | `false` | No |
| `runMode` | profile mode string (predefined) | No |
| `dominantPattern` | derived string | No |
| `summary` | derived string | No |
| `beliefCount` | `77` | No |
| `contradictionCount` | number | No |
| `stabilityScore` | number | No |
| `opennessScore` | number | No |
| `pressureScore` | number | No |
| `dimensions` | 19 numeric scores | No |
| `topBeliefs` | 7 alignment objects (name, similarity, desc) — all from SYSTEMS array | No |
| `contradictions` | derived title+desc strings from CONTRADICTIONS array | No |
| `stressPoints` | derived predefined choice labels from stressMap | No |
| `raw.scores` | 19 numeric scores | No |
| `raw.alignments` | alignment objects from SYSTEMS + computed similarity | No |
| `raw.contradictions` | CONTRADICTIONS objects with hardcoded title/desc | No |
| `raw.identity` | predefined chip label strings | No |
| `raw.answers` | numeric Likert/choice indices (integers only) | No |
| `raw.profileMode` | predefined mode string | No |
| `raw.metaReport` | 8 numbers + hardcoded template strings | No |
| `raw.exportedAt` | ISO timestamp | No |
| ~~`raw.timeline`~~ | ~~7 free-text fields~~ | **Removed in D-124C** |
| ~~stressPoints: timeline.fearTrue~~ | ~~raw fear question text~~ | **Removed in D-124C** |
| ~~stressPoints: timeline.isolate~~ | ~~raw isolation question text~~ | **Removed in D-124C** |
| ~~stressPoints: timeline.identity~~ | ~~raw identity question text~~ | **Removed in D-124C** |

---

## 5. Verdict

**PASS WITH NOTES**

D-124C correctly removed all user-typed free-text timeline answers from the default snapshot payload. No residual leak paths found. `raw.metaReport` (the main risk item) is fully derived from hardcoded templates and numeric scores with no user text. The only outbound network path is in `humanx-bridge.js` and the payload it sends is clean.

Notes N1 and N2 are expected behaviours, not defects. No patch required.

---

## 6. Confirmation

> Read-only audit. No code changes. No deploy. No Wrangler. No D1. No production query. No admin token. No live writes. Doc committed locally only, not pushed.
