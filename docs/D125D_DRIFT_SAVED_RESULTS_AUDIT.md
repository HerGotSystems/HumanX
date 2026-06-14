# D-125D — Owner Test Cycle 3: Drift and Saved-Results Audit

**Date:** 2026-06-14  
**Branch:** fix/d125d-drift-saved-results-clarity  
**Auditor:** Static code inspection — `public/app-v10.js`, `public/styles.css`, `public/apps/humanx-belief-engine/index.html`, `public/apps/humanx-belief-engine/humanx-bridge.js`  
**Mode:** Audit + minimal patch. No scoring, payload, backend, or classification logic changes.

**Verdict: PATCHED**

One semantic bug patched (drift verdict badge colour). All other Drift and saved-results checks pass. No stop conditions triggered.

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## Patch Applied

### P1 — Drift verdict badge: `cls(verdict)` → `b-yellow`

**File:** `public/app-v10.js` — `renderProfileDrift()` return template  
**Severity:** Misleading — colour implies moral judgement on neutral change metrics

**Before:**
```
<span class="badge ${cls(verdict)}">${esc(verdict)}</span>
```

**After:**
```
<span class="badge b-yellow">${esc(verdict)}</span>
```

**Why:** `cls()` was written for claim verdicts (`Supported`, `Disproven`, `Plausible`) where green = empirically supported and red = disproven. It classifies any string containing "rising" as green (`b-green`) and any string containing "falling" as red (`b-red`). Applied to Drift verdict strings, this made:

| Drift verdict | `cls()` result | Problem |
|---|---|---|
| `pressure rising` | `b-green` | Higher pressure score = more identity fusion, tribal load, dogma. Not a positive signal. |
| `stability rising` | `b-green` | Stability increasing shows as positive — but stability here is a neutral composite. |
| `openness rising` | `b-green` | Open to change shown as positive — culturally loaded. |
| `stability falling` | `b-red` | Stability decreasing shown as negative — might mean the person is reconsidering. |
| `mixed / stable profile drift` | `b-yellow` | Correct — neutral. |
| `profile baseline` | `b-yellow` | Correct — neutral. |

All Drift verdicts describe change, not quality. Using a fixed `b-yellow` (neutral/informational) for all removes the implied moral direction and keeps the colour consistent with the Drift text narrative, which is deliberately framed as change observation ("pressure increased", "openness narrowed") without judgement.

**Note:** The second `cls(verdict)` occurrence in `analysisItem()` (line 166) was intentionally left unchanged — there `verdict` holds claim analysis verdicts (`Supported`, `Disproven`, `Plausible`) where the green/red colouring is correct and expected.

---

## Audit Results by Area

### Q1 — Full profile classification

**PASS.**

```js
function isFullBeliefProfile(s){
  return String(s?.source||'').includes('standalone-humanx-belief-engine')
    || String(s?.engineVersion||'').includes('humanx-belief-engine')
    || String(s?.label||'').includes('Belief Engine Profile')
}
```

Three independent classification paths — any one of them is sufficient:

| Field | v2.0 value | Matches? |
|---|---|---|
| `source` | `'standalone-humanx-belief-engine'` | `.includes('standalone-humanx-belief-engine')` ✓ |
| `engineVersion` | `'humanx-belief-engine-v2.0'` | `.includes('humanx-belief-engine')` ✓ |
| `label` | `'Belief Engine Profile — Stoic Atheism'` | `.includes('Belief Engine Profile')` ✓ |

v1.0-bridge snapshots also match via the `engineVersion` substring — backward compatible. Quick belief records (e.g. from `saveBeliefMirror`) carry neither `source` field nor the `humanx-belief-engine` engineVersion string and correctly fall through to the quick section.

No misclassification path found. Classification is conservative (3 ORed checks) and resilient to partial payloads.

---

### Q2 — Drift comparison framing

**PASS WITH NOTE (note resolved by P1).**

**`driftText()` narrative — PASS.**

```js
function driftText(ds,doo,dp,dc){
  const bits=[];
  if(ds>10) bits.push('belief stability increased');
  if(ds<-10) bits.push('belief stability weakened');
  if(doo>10) bits.push('openness increased');
  if(doo<-10) bits.push('openness narrowed');
  if(dp>10)  bits.push('pressure increased');
  if(dp<-10) bits.push('pressure reduced');
  if(dc>0)   bits.push('more contradictions were detected');
  if(dc<0)   bits.push('fewer contradictions were detected');
  return bits.length ? bits.join('; ')+'.' : 'No major movement detected yet.'
}
```

Each observation is stated as change, not progress. "Pressure increased" does not say better or worse. "More contradictions were detected" does not say good or bad. "Belief stability weakened" uses a slightly negative word ("weakened") but in context reads as description, not judgement — and no corrective framing like "you should stabilise" follows it.

**`deltaMeter()` — PASS.**

The bar fill represents magnitude of change (`Math.abs(v)`), not direction. No colour differentiation on the fill bars — a +19 pressure and a −2 openness delta have the same neutral bar colour. Numerical delta is shown with a sign prefix (`+19`, `−2`). No implied good/bad.

**Verdict badge — PATCHED (P1).** Previously `cls(verdict)` was making "pressure rising" green and "stability falling" red. Now all drift verdicts use `b-yellow`.

**Owner's confirmed comparison (Stoic Atheism → Confucianism):**  
`stability 0 / openness −2 / pressure +19 / contradictions +5`  
`dp = 19` → below the `>20` threshold → verdict was `'mixed / stable profile drift'` → `b-yellow` (was already correct for this specific case). The bug would have triggered for any user with `dp > 20` (e.g. a third profile with larger shift).

---

### Q3 — Empty and single-profile states

**PASS.**

| State | Copy | Status |
|---|---|---|
| No snapshots at all | "No belief snapshots yet. Open the Belief Engine, map a belief, then optionally send a snapshot back to HumanX. Saved snapshots can be promoted to a Truth or public Claim — which enters Review before becoming public." | ✓ |
| No full profiles (only quick records) | "No full profile saved yet. Complete the Belief Engine and click Send to HumanX to record one." | ✓ |
| One full profile, no comparison | "One profile saved — add more to measure drift over time." | ✓ |
| `helperText()` for drift mode | "Drift shows how your saved belief snapshots change over time — a trail, not a scoreboard." | ✓ |

"A trail, not a scoreboard" is the clearest single-phrase framing of what Drift is for. Present in the sidebar helper text for the Drift tab.

Action buttons in empty/single states navigate to the Belief Engine (`location.href='/apps/humanx-belief-engine/'`). ✓

---

### Q4 — Bridge between BE local save and Drift

**PASS.**

The concept split is:
- **Local saved result** — stored in browser `localStorage` via `saveRunRecord()` in `index.html`. Available via "View previous results" on the Belief Engine intro. Includes all typed timeline text. Not sent anywhere.
- **Drift snapshot** — sent to `/api/belief-snapshots` via `humanx-bridge.js` only when "Send to HumanX" is clicked. Excludes free-text. Appears in Drift tab. Not published automatically.

These two are distinct and not mixed:
- Drift does not load from `localStorage` — it calls `/api/belief-snapshots?limit=30` via the main app.
- The BE intro "View previous results" loads from `getLatestSavedRun()` — reads `localStorage`, not the API.
- No mechanism exists to accidentally cross-populate one from the other.

The post-send alert confirms the destination: "Open the main app → Drift to see it." ✓  
The bridge pre-click note confirms exclusions: "Not saved: private timeline text or free-text answers you typed." ✓  
D-125C P1 corrected the intro note from "HumanX Review" to "your Drift, not published." ✓

No wording confusion between local save and Drift snapshot found.

---

### Q5 — Saved-result controls

**PASS.**

| Control | Location | Behaviour | Status |
|---|---|---|---|
| "View previous results" | BE intro | `showResults()` → `getLatestSavedRun()` → loads highest-ts valid record | ✓ (D-124G) |
| "Clear" | BE intro, alongside "View previous results" | `clearSavedResults()` removes all 6 known BE keys; hides button immediately | ✓ (D-124E) |
| "Start Over" | Results screen, Export & Share section | `retake()` clears scores/timeline/answers + mode key + legacy pointer | ✓ (D-124H — renamed from "Retake") |

**"Retake" check:** The function `retake()` remains as the internal JS function name, but no user-visible label says "Retake" — the button reads "Start Over" (patched D-124H). No stale "Retake" text found in any rendered string. ✓

---

### Q6 — Privacy

**PASS.**

| Surface | What it contains | Local only? | Status |
|---|---|---|---|
| `localStorage` (BE saved result) | Full answers, scores, timeline text, identity | Yes — never leaves device | ✓ |
| BE intro "View previous results" note | "saved in this browser · includes any answers you typed · not synced" | Accurately describes local-only | ✓ |
| Drift snapshot (bridge payload) | Scores, alignments, contradictions, stress choices — `raw.timeline` excluded | Sent to `/api/belief-snapshots`; not published | ✓ (D-124C) |
| Bridge pre-click note | "Not saved: private timeline text or free-text answers you typed." | Accurate | ✓ |
| BE timeline input screen | Note added at input point: "nothing typed here is sent anywhere, even if you later click Send to HumanX" | Accurate | ✓ (D-125C P3) |

No confusion between local and Drift privacy boundaries. No typed text reaches Drift. No Drift content reaches the browser's local result display.

---

### Q7 — Promote actions (Save as Truth / Pressure-test as Claim)

**PASS.**

Both buttons in `beliefSnapshotCard` carry:
- `title` tooltip: "Enters moderation before going public" ✓
- On-card note (`.drift-promote-note`): "→ both actions enter Review before going public" ✓
- `promoteBelief()` toast on success: "Truth promoted to Review. It will appear publicly after approval." / "Claim promoted to Review. It will appear publicly after approval." ✓

No path exists where a promote action makes content immediately public without Review. ✓

---

### Q8 — Mobile / compact CSS

**PASS.**

| Rule | Breakpoint | Behaviour |
|---|---|---|
| `main` grid | ≤900px | `grid-template-rows:auto 1fr` → single column | ✓ |
| `.drift-header` | — | `flex-wrap:wrap` → wraps safely on narrow screens | ✓ |
| `.drift-compare-panel` | — | `padding:8px 12px`, left-border accent, no fixed width | ✓ |
| `.meters` | — | No fixed width; fills available space | ✓ |
| Belief cards (`.grid`) | — | Use the standard `.grid` class, which uses CSS grid auto-fit | ✓ |
| `.drift-section-head` | — | `flex-wrap:wrap` | ✓ |

No fixed-width elements in the Drift layout that would cause overflow at 390px. The `deltaMeter` and `meter` components render as `div.meter` → `span` + `div.bar` → fills available width. No horizontal scroll risk identified.

---

### Q9 — Stop conditions

**None triggered.**

| Condition | Status |
|---|---|
| Accidental publication implication | NOT triggered — promote flow explicitly confirms Review before public; Drift snapshots confirmed not published |
| Privacy confusion between local and Drift | NOT triggered — two separate concepts clearly maintained in code and copy |
| Diagnosis/verdict/proof framing | NOT triggered — "a trail, not a scoreboard"; delta text is neutral; no "you got better/worse" language |
| Drift verdict badge implying moral judgement | Resolved by P1 — all drift verdicts now use neutral `b-yellow` |
| Full-profile comparison path broken | NOT triggered — owner confirmed working; classification logic is robust |

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | P1: `cls(verdict)` → `b-yellow` in `renderProfileDrift()` drift verdict badge |
| `docs/D125D_DRIFT_SAVED_RESULTS_AUDIT.md` | Created (this file) |

---

## Recommended D-125E Scope

**D-125E — Owner test Cycle 4: Claim submission and Review audit**

Simulate P4 (hostile/spammy submitter) and P6 (admin reviewer). Follow Cycle 4 steps from `D125A_OWNER_TESTER_HARDENING_PLAN.md`. Focus on:

- Submit form copy: does it clearly communicate review-first before any click?
- Claim quality hints — do they give useful friction against vague submissions?
- POST `/api/belief-promote` and `/api/claim` review-first wording in toasts and confirmations
- `promoteBelief()` toast messages — any path that could imply immediate publication?
- Review queue from admin perspective: inspect-before-decide flow clear?
- Approve/reject feedback to owner — any ambiguity about what "approve" does?
- Rate-limit or duplicate submission handling visible in the frontend?
- `renderSubmit()` — any wording that implies the claim is immediately public?
