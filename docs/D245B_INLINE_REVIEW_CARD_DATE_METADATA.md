# D-245B — Inline Review Card Date Metadata

**Scope:** Frontend (app-v10.js, styles.css) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-245C live sanity PASS 2026-07-01)
**Baseline:** 2652 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D245B_INLINE_REVIEW_CARD_DATE_METADATA.md`, `docs/README.md`
**App UI changes:** Yes — "Updated {age}" moved into meta row; standalone date row removed
**CSS changes:** Yes — `.review-card-meta` bottom margin updated; `.review-card-date` rules removed
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No (deployed)

---

## Purpose

Address D-245A finding F-3 (MEDIUM): the "Updated {age}" date was rendered as a standalone `<p class="review-card-date">` row on every review card. This dedicated row added ~18–20px of height per card. In a 20-item queue, that is 360–400px of extra scroll height — roughly one full viewport — for low-priority metadata.

---

## D-245A Finding Addressed

**F-3 (MEDIUM) — Date is its own full row, not inline:**
> `<p class="small review-card-date">Updated {age}</p>` occupies its own `<p>` row with `margin-bottom:5px`. The date is useful but not important enough to occupy an entire row. Inlining it with the meta line would collapse the card by one row without losing any information.

---

## Exact Change

### `public/app-v10.js` — `reviewCard(item)`

**Before:**
```js
const metaParts = isEvidence ? [...] : isPressure ? [...] : [...];
const updated = reviewAge(item.updated_at || ...);
// ...template...
<p class="small review-card-meta">${metaParts.map(esc).join(' · ')}</p>
<p class="small review-card-date">Updated ${esc(updated)}</p>
```

**After:**
```js
const updated = reviewAge(item.updated_at || ...);  // moved before metaParts
const metaParts = (...).concat(['Updated ' + updated]);
// ...template...
<p class="small review-card-meta">${metaParts.map(esc).join(' · ')}</p>
// standalone date <p> removed
```

The `updated` declaration was moved before `metaParts` so it can be referenced in the `.concat()` call. The date string is appended as the final element of `metaParts` for all item types (claim, truth, evidence, pressure).

**User-visible result:**
- Claim card meta line: `general · pending · ev:0 ts:- sv:- · Updated 3 days ago`
- Evidence card meta line: `stance · quality · Updated 3 days ago`
- Pressure card meta line: `severity 2/5 · by handle · Updated 3 days ago`
- Truth card meta line: `category · origin · rep ×1 · Updated 3 days ago`

### `public/styles.css`

- `.review-card-meta{margin:0 0 2px}` → `margin:0 0 5px` (absorbs the former `.review-card-date` bottom spacing)
- `.review-card-date{margin:0 0 5px}` — **removed** (rule no longer used)
- `.review-card-meta{margin-bottom:1px}` (mobile) → `margin-bottom:4px` (absorbs the former `.review-card-date` mobile spacing)
- `.review-card-date{margin-bottom:4px}` (mobile) — **removed** (rule no longer used)

---

## What Is Preserved

| Data / behaviour | Status |
|-----------------|--------|
| "Updated {age}" date string | **Preserved** — now inline in meta row |
| `reviewAge()` date calculation | **Unchanged** |
| Date source field (`updated_at` / `created_at`) | **Unchanged** |
| Category / status / origin metadata | **Unchanged** |
| Score triplet (ev/ts/sv) | **Unchanged** |
| Evidence stance / quality | **Unchanged** |
| Pressure severity / handle / parent claim | **Unchanged** |
| Truth `rep ×N` | **Unchanged** |
| Quality hints badge ("needs sharpening") | **Unchanged** |
| Duplicate / similar advisory markers | **Unchanged** |
| Selected-card state (D-227B) | **Unchanged** |
| Confirm-state classes (D-229A) | **Unchanged** |
| Decision feedback / "Open next item →" (D-242B/D-243A) | **Unchanged** |
| Review-to-Study Back navigation (D-239/D-240) | **Unchanged** |
| Moderation action buttons | **Unchanged** |
| Filter / sort behaviour | **Unchanged** |
| Inspect panel date / details | **Unchanged** |
| Public profile render path | **No review card internals exposed** |

---

## What Changed (Appearance Only)

- One `<p>` row removed per card
- "Updated {age}" now appears at the end of the meta line, separated by ` · `
- Card total height reduced by approximately one text row (~18–20px per card)

---

## Risk Boundaries

- No moderation semantics change
- No duplicate/advisory semantics change
- No backend/API route changes
- No public profile exposure
- No Drift/Belief expansion changes (`public/belief-drift-expansion.js`, `public/index.html` untouched)
- No review filter/sort behaviour changes
- No decision feedback/next-item behaviour changes
- No Study navigation behaviour changes
- No src/worker.js changes
- No migration/schema/CSP/external asset changes

---

## Tests Added (14 new → baseline 2638 + 14 = **2652**)

| Test | Category |
|------|----------|
| reviewCard still emits "Updated" date in metadata | Date preserved |
| reviewAge still called for date calculation | Date source |
| Standalone `review-card-date` `<p>` no longer in reviewCard output | Row removed |
| `review-card-meta` still emitted in reviewCard | Meta intact |
| Category still in metaParts for claim/truth | Metadata intact |
| scoreHint still in metaParts for claim/truth | Metadata intact |
| Pressure severity still in metaParts | Metadata intact |
| reviewDecisionFeedbackNextId state intact after D-245B | D-242B/D-243A compat |
| renderPublicProfileHtml does not reference review-card-meta | Public boundary |
| renderPublicProfileHtml does not reference review-card-date | Public boundary |
| CSS `.review-card-meta` still defined | CSS intact |
| CSS `.review-card-date` no longer defined | CSS cleaned |
| worker.js not modified | Deploy integrity |
| Drift/Belief expansion files not modified | Deploy integrity |

**Hardening smoke:** 2652 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist — D-245C PASS (2026-07-01, owner deploy)

- [x] Review queue loads without JS errors
- [x] Review card date ("Updated N days/hours ago") visible in meta row
- [x] Meta row format: `{category} · {status} · {score} · Updated {age}` (or type-appropriate equivalent)
- [x] No standalone "Updated" line below the title on any card
- [x] Cards visibly more compact (one fewer text row per card)
- [x] Evidence card: `{stance} · {quality} · Updated {age}`
- [x] Pressure card: `severity N/5 · [by handle ·] Updated {age}`
- [x] Truth card: `{category} · {origin} · rep ×N · Updated {age}`
- [x] Quality hint badge ("needs sharpening") still appears in head row
- [x] Similar/duplicate advisory still visible (badge row + card border)
- [x] Inspect button / Approve / Keep Pending / Reject all functional
- [x] Selected card highlight and scroll intact
- [x] Confirm-state (approve/reject pending) UI intact
- [x] Decision feedback banner + "Open next item →" button intact
- [x] Review-to-Study navigation intact (Back to Review restores scroll)
- [x] Mobile layout: meta row wraps cleanly, date visible
- [x] No review internals exposed on public profile page

**24/24 PASS** — owner live sanity complete 2026-07-01
