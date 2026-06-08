# D-93B — Truth Admin Cleanup Ergonomics UI

**Date:** 2026-06-08
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 235 / 24 / 39 → **254 / 24 / 39**

---

## What Changed

### 1. Module-level state

```js
let truthAdminFilter = 'all';
```

Tracks the active admin filter chip. Persists across filter clicks without re-fetching.

---

### 2. `isTruthBorderlineArtefact(t)` helper

```js
function isTruthBorderlineArtefact(t){
  if(isTruthArtifact(t)) return false;
  const s = String(t.statement||'').trim();
  if(s.length < 2) return false;
  const words = s.split(/\s+/);
  // All-caps multi-word phrase: 2–5 words, ≤40 chars
  if(words.length>=2 && words.length<=5 && s.length<=40 && s===s.toUpperCase() && /[A-Z]/.test(s))
    return true;
  // Symbol-heavy: non-alpha chars dominate
  const alpha = (s.match(/[a-zA-Z]/g)||[]).length;
  if(s.replace(/\s/g,'').length > 4 && alpha/s.replace(/\s/g,'').length < 0.5)
    return true;
  return false;
}
```

**Catches:** `SMALL INDEFERENT TRUTH` (all-caps, 3 words, 22 chars ≤ 40) → `true`
**Does NOT catch:** `People are stupid` (mixed case) → `false` ✓
**Does NOT catch:** `Belief Engine Profile — Stoic Atheism` (mixed case) → `false` ✓

This is advisory only — no archive button is shown for borderline items.

---

### 3. `applyTruthAdminFilter(list)` helper

```js
function applyTruthAdminFilter(list){
  const f = truthAdminFilter || 'all';
  if(f === 'artefacts')  return list.filter(isTruthArtifact);
  if(f === 'borderline') return list.filter(t => isTruthBorderlineArtefact(t) && !isTruthArtifact(t));
  if(f === 'personal')   return list.filter(isTruthPersonalBelief);
  if(f === 'clean')      return list.filter(t => !isTruthArtifact(t) && !isTruthBorderlineArtefact(t) && !isTruthPersonalBelief(t));
  return list; // 'all'
}
```

Does not mutate the `truths` array. Returns a filtered view.

---

### 4. `renderTruthAdminBar(artefactCount, borderlineCount, personalCount)`

Returns a slim banner HTML string showing counts of each category. Only inserted into the page when `adminToken()` is truthy. Styled with `.truth-admin-bar`.

---

### 5. `renderTruthFilterBar(list)`

Returns filter chip bar HTML with five chips: All / Artefacts / Borderline / Personal / Clean, each showing a count badge. Active chip gets `.truth-filter-chip-active` class. Chip clicks call `setTruthAdminFilter(key)`. Only inserted when `adminToken()` is truthy.

---

### 6. `setTruthAdminFilter(f)`

```js
async function setTruthAdminFilter(f){
  truthAdminFilter = f || 'all';
  await renderTruths();
}
```

Sets the filter variable and re-renders the Truths page (re-fetches and applies filter).

---

### 7. `truthCard` — borderline badge

Added `const borderline = isAdmin && isTruthBorderlineArtefact(t) && !artifact;`

Added badge in card head:
```html
${borderline ? `<span class="badge b-muted truth-borderline-badge">? borderline</span>` : ''}
```

- Admin-only: not shown to regular users
- Advisory only: no archive button for borderline items
- Shown on `SMALL INDEFERENT TRUTH`
- NOT shown on `People are stupid`, `Stoic Atheism`, etc.

---

### 8. `renderTruths` — admin bar + filter bar + filtered grid

After `loadTruths()`, computes `_isAdm`, `_artCnt`, `_brdCnt`, `_perCnt`. Template literal now includes:

```
${_isAdm ? renderTruthAdminBar(_artCnt, _brdCnt, _perCnt) : ''}
${_isAdm ? renderTruthFilterBar(truths) : ''}
<div id="truth-grid-container" class="grid truth-grid">
  ${applyTruthAdminFilter(truths).map(t => truthCard(t)).join('') || ...}
</div>
```

For non-admin users: grid renders identically to before. No visible change.

---

### 9. CSS changes

| Rule | Change |
|------|--------|
| `.btn-archive-artifact` | `font-size: 9px → 10px`, `padding: 1px 6px → 2px 8px`, `opacity: .6 → .75`, `border: #ff6b3533 → #ff6b3566`, `font-weight: 500` added |
| `.truth-borderline-badge` | New — amber-grey badge color for borderline advisory |
| `.truth-admin-bar` | New — slim admin status bar at top of grid |
| `.truth-admin-stat` | New — highlighted count values |
| `.truth-admin-bar-hint` | New — small italic advisory text |
| `.truth-filter-bar` | New — filter chip container |
| `.truth-filter-chip` | New — base chip style |
| `.truth-filter-chip:hover` | New — hover state |
| `.truth-filter-chip-active` | New — active/selected chip |
| `.truth-filter-count` | New — small count badge inside chip |

---

## Safety Notes

- **No archive button for borderline items** — `? borderline` badge is advisory only
- **No auto-cleanup** — filter chips only change the visible view, never mutate data
- **No bulk action** — admin still must click individual archive buttons on confirmed artefacts
- **No hardcoded IDs** — all logic uses `t.id` from fetched data
- **Stoic Atheism untouched** — personal-belief badge only, no borderline flag
- **`SMALL INDEFERENT TRUTH`** — now shows `? borderline` badge in admin mode; archive button still NOT shown (borderline-only)
- Non-admin users see identical Truths page — no visible change

---

## What D-93B Does NOT Include

- No archive button for borderline or personal-belief items
- No auto-cleanup on filter change
- No Worker or D1 change
- No Stoic Atheism cleanup decision (deferred to D-93C)
- No bulk action path

---

## Hardening Smoke

| Batch | Tests |
|-------|-------|
| Pre D-93B baseline | 235 |
| D-93B Section 37 | +19 |
| **Final** | **254** |

All 254 pass. Belief-engine (24) and worker-route (39) static checks unchanged.
