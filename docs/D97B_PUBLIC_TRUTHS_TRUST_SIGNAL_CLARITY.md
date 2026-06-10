# D-97B — Public Truths Trust-Signal Clarity Pass

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 286 / 24 / 39 → **299 / 24 / 39**
**Audit basis:** D-97A public Truths trust/clarity audit

---

## What Changed

### 1. Public Truth visibility badge — reframed from green "Public" to neutral "visible"

`reviewStatusBadge` gained a third parameter `truthCtx` (default `false`):

```js
function reviewStatusBadge(c,withNote=false,truthCtx=false){ ... 
  else if(rs==='public'||rs==='approved'||rs==='live'){
    label=truthCtx?'visible':'Public';
    clr=truthCtx?'b-muted truth-visible-badge':'b-green';
  } ... }
```

`truthCard` now calls `reviewStatusBadge(t,false,true)`. **Only Truth cards** get the neutral `visible` badge. Claim cards (`reviewStatusBadge(c)`) and the Study review badge (`reviewStatusBadge(c,true)`) are untouched — claims still show the green `Public` badge, which is correct because claims go through evidence-based review.

New CSS:
```css
.truth-visible-badge{color:var(--muted);border-color:#273044}
```

### 2. NOT VERIFIED badge — strengthened readability

```css
/* before */ .truth-not-verified{font-size:8px}
/* after  */ .truth-not-verified{font-size:11px;font-weight:700;opacity:1;color:var(--yellow);border-color:#ffd16655}
```

Bumped from 8px → 11px, bold, full opacity, and given the platform caution-yellow colour. It is now the most prominent honesty signal on the card — stronger than the neutral grey visibility badge — but uses caution-yellow, not alarm-red. Wording unchanged (`not verified`). Still always shown; never gated behind admin state.

### 3. Linked-claim chip — de-greened and reworded

```html
<!-- before --> <span class="badge b-green truth-linked-chip">→ claim exists</span>
<!-- after  --> <span class="badge b-muted truth-linked-chip">claim derived</span>
```

Removed success-green (which read as approval) and the `→` arrow; reworded to "claim derived" — factual, no implication of verification or proof.

---

## Why `PUBLIC` Was Reframed

D-97A found the green `Public` badge was the page's core trust risk: green is the platform's success colour (used for "Proven"/"Supported"), so a public Truth card read like a *verified/approved fact* — directly contradicting the page's own "Public means visible, not proven" framing. Renaming to **visible** with neutral grey styling makes the badge state what it actually means: the entry is publicly listed, not validated. The change is scoped to Truths only so claim review semantics (where green Public genuinely means "passed review and is live") are preserved.

## Why `NOT VERIFIED` Was Strengthened

D-97A's second HIGH finding: the single most important honesty signal on a public page was rendered at 8px — smaller than every other badge (default badge is 9px). The D-92C intent ("users could mistake public listing for endorsement") was undercut by making the counter-signal nearly invisible. Raising it to 11px/bold/caution-yellow makes it the dominant trust cue on the card.

---

## Admin-Only Behavior — Unchanged

| Element | Still admin-gated? |
|---|---|
| `? borderline` badge (`isAdmin&&isTruthBorderlineArtefact&&!artifact`) | ✅ |
| Full truth ID + copy button (`isAdmin`) | ✅ |
| Archive artefact button (`isAdmin&&artifact`) | ✅ |
| Truth admin bar + filter chips (`_isAdm`) | ✅ |

No admin surface was exposed to the public view. `? artefact` remains public and advisory (unchanged).

---

## Sensitive Beliefs — Remain Neutral, Not Censored

The seven sensitive social beliefs were re-verified against the structural heuristics (which are content-neutral — length, vowel ratio, repeated syllables, generic placeholder words only):

| Belief | Flagged artefact? | Borderline? | Public badges |
|---|---|---|---|
| People are stupid | ❌ | ❌ | type + **not verified** + (visible if public) |
| Money is evil | ❌ | ❌ | type + **not verified** |
| Trust the experts | ❌ | ❌ | type + **not verified** |
| Never trust the experts | ❌ | ❌ | type + **not verified** |
| Children should always obey adults | ❌ | ❌ | type + **not verified** |
| Science has proven it | ❌ | ❌ | type + **not verified** |
| My religion is the only true path | ❌ | ❌ | type + **not verified** |

A hardening test (Section 41) re-derives the artefact heuristic and asserts none of the seven are flagged. No censorship wording, no artefact wording added for any of them. They render with a neutral type badge and the strengthened honesty badge — recorded, not endorsed; visible, not censored.

---

## Hardening Tests Added (Section 41 — 13 new tests, 286 → 299)

| # | Test |
|---|---|
| 41.1 | `reviewStatusBadge` accepts `truthCtx` parameter |
| 41.2 | Public truth badge says "visible" (not "Public") and is not green |
| 41.3 | `truthCard` passes `truthCtx=true` |
| 41.4 | Claim card still uses default (green) `reviewStatusBadge(c)` — truths-only change |
| 41.5 | `.truth-not-verified` font-size is no longer 8px |
| 41.6 | `.truth-not-verified` font-size is >= 10px |
| 41.7 | NOT VERIFIED badge remains present in `truthCard` |
| 41.8 | Claim-exists chip no longer uses green/approval styling |
| 41.9 | Claim-exists chip avoids "verified"/"proven" wording |
| 41.10 | Borderline badge remains admin-only after restyle |
| 41.11 | Full truth ID + archive button remain admin-only |
| 41.12 | Sensitive social beliefs not structurally flagged as artefact |
| 41.13 | No backend/D1/wrangler/deploy references added |

One legacy test (`truth card rendering calls reviewStatusBadge(t)`) was updated to accept the new `reviewStatusBadge(t,false,true)` signature.

---

## Safety Confirmation

| Check | Status |
|---|---|
| No data/backend/schema/API changes | ✅ — `reviewStatusBadge` POST/route paths untouched; display-only |
| No moderation/admin actions | ✅ |
| No D1 / migration / mutation | ✅ |
| No Wrangler / deploy | ✅ |
| Claim review semantics unchanged | ✅ — green "Public" preserved for claims |
| Sensitive beliefs neutral, not censored | ✅ — verified by test 41.12 |
| Admin-only gating intact | ✅ |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 286 passed, 0 failed | **299 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |
