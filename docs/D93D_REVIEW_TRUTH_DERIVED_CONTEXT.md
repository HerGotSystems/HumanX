# D-93D — Review UI Context for Truth-Derived / Borderline-Derived Claims

**Date:** 2026-06-09  
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.  
**Static baseline:** 254 / 24 / 39 → **266 / 24 / 39**  
**Policy basis:** D-93C borderline Truth-derived policy audit

---

## What Changed

### 1. Three new helpers

```js
function isTruthDerivedClaim(item) {
  return String(item.type||'').toLowerCase() === 'truth-derived'
    || String(item.claim_type||item.claimType||'').toLowerCase() === 'truth-derived';
}
```
Returns true if the queue item is a Truth-Derived claim (created via "Pressure-test as Claim").

```js
function isClaimCategoryEcho(item) {
  const cl = String(item.claim||'').trim().toLowerCase();
  const ca = String(item.category||'').trim().toLowerCase();
  if(!cl || !ca) return false;
  return cl === ca || cl.includes(ca) || ca.includes(cl);
}
```
Returns true when the claim text and its category field are the same or one contains the other — a low-substance signal common in Truth-Derived claims that inherit the truth's raw category.

```js
function isLikelyBorderlineDerivedClaim(item) {
  if(!isTruthDerivedClaim(item)) return false;
  if(isClaimCategoryEcho(item)) return true;
  const cl = String(item.claim||'').trim();
  if(cl.length >= 2 && cl.length <= 40 && cl === cl.toUpperCase() && /[A-Z]/.test(cl)) return true;
  const es = item.evidence_score ?? item.evidenceScore ?? null;
  return es !== null && es <= 10;
}
```
Heuristic — returns true when a Truth-Derived claim shows at least one borderline signal (category-echo, all-caps short text, or very weak evidence ≤10). **Advisory only** — not a cleanup trigger.

---

### 2. Review queue filter chip: Truth-Derived

`applyReviewFilter` now handles `f === 'truth-derived'` → filters by `isTruthDerivedClaim`.  
`renderReviewFilterBar` now includes `['truth-derived', 'Truth-Derived']` chip with live count.

---

### 3. Review card badges

Three new badges appear in the `review-card-head` row for relevant items:

| Badge | Colour | Trigger | Meaning |
|---|---|---|---|
| `truth-derived` | cyan | `isTruthDerivedClaim(item)` | Item was created via Pressure-test from a Truth |
| `category-echo` | amber | `isTruthDerivedClaim && isClaimCategoryEcho` | Category field mirrors claim text — low-substance origin |
| `? borderline origin` | muted gold | `isLikelyBorderlineDerivedClaim` | Heuristic: source Truth may be borderline — advisory only |

All badges are purely visual. No action change; no approve/reject automation.

---

### 4. Review inspect panel — claim branch

When inspecting a claim-type item, three contextual rows are conditionally added:

| Row label | Condition | Content |
|---|---|---|
| Origin Path | `isTruthDerivedClaim` | `truth-derived` badge + "created via Pressure-test as Claim from a public Truth" |
| Review Advisory | `isTruthDerivedClaim && isClaimCategoryEcho` | `⚠ category-echo` badge + "Category matches claim text. Check parent Truth before approving." |
| Borderline Hint | `isLikelyBorderlineDerivedClaim` | `? borderline origin` badge + "Heuristic: source Truth may be borderline. Advisory — confirm via Truths page." |

---

### 5. CSS additions (`styles.css`)

```css
.b-truth-derived   { color:#57d4ff; border-color:#57d4ff44 }
.b-category-echo   { color:#ffaa33; border-color:#ffaa3344 }
.b-borderline-origin { color:#c8a000; border-color:#c8a00033; opacity:.85 }
```

---

## What D-93D explicitly does NOT include

- No approve/reject automation
- No archive button for Truth-Derived claims
- No cleanup or withdrawal action
- No mutation of any kind
- No backend or Worker change
- No schema change
- Socially real beliefs are unaffected (isTruthDerivedClaim is a backend type field, not content-based)

---

## Live case: `SMALL INDEFERENT TRUTH`

Claim `clm_30889d651e3b4b2cb6` in the Review queue will now show:
- `truth-derived` badge (type field matches)
- `category-echo` badge (category === claim text)
- `? borderline origin` badge (all three signals fire)
- Inspect panel: Origin Path note, Review Advisory note, Borderline Hint note

Status remains: **Keep Pending** — no action taken. See D-93C policy.

---

## Hardening tests added

Section 38 — 12 new tests (254 → 266):

| # | Test |
|---|---|
| 38.1 | `isTruthDerivedClaim` helper defined |
| 38.2 | `isTruthDerivedClaim` detects Truth-Derived type string |
| 38.3 | `isClaimCategoryEcho` helper defined |
| 38.4 | `isClaimCategoryEcho` references both claim and category |
| 38.5 | `isLikelyBorderlineDerivedClaim` helper defined |
| 38.6 | `reviewCard` references `b-truth-derived` |
| 38.7 | `reviewCard` references `b-category-echo` |
| 38.8 | `reviewCard` references `b-borderline-origin` |
| 38.9 | `applyReviewFilter` includes `truth-derived` branch |
| 38.10 | `renderReviewFilterBar` includes `truth-derived` chip |
| 38.11 | `b-truth-derived` CSS exists in `styles.css` |
| 38.12 | `b-category-echo` CSS exists in `styles.css` |
