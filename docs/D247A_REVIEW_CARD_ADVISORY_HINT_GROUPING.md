# D-247A — Review Card Advisory Hint Grouping

**Scope:** Frontend (app-v10.js, styles.css) + tests + docs
**Status:** COMPLETE — pending owner deploy
**Baseline:** 2681 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D247A_REVIEW_CARD_ADVISORY_HINT_GROUPING.md`, `docs/README.md`
**App UI changes:** Yes — three advisory hints moved to a secondary `.review-card-hints` row
**CSS changes:** Yes — `.review-card-hints` rule added
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

Address D-245A finding F-1: the primary `.review-card-head` badge strip could carry up to 9 badges simultaneously when all advisory/quality hints applied. Two specific badges were identified as the main density contributors: `? borderline origin` (heuristic, lowest contrast, opacity 0.85) and `category-echo` (advisory only, meaningful only alongside `truth-derived`). The `needs sharpening` quality hint is similarly low-priority for first-scan use.

All three require the inspect panel for meaningful context and do not inform the immediate approve/keep/reject decision. Moving them to a quieter secondary row reduces head-row clutter without removing any information.

---

## D-245A Finding Addressed

**F-1 (HIGH) — Head row can carry up to 9 badges simultaneously:**
> Two advisory badges are the main culprits: `? borderline origin` (heuristic, opacity 0.85, `#c8a000`) and `category-echo` (only meaningful with `truth-derived`). Both require inspect-panel context to act on.

---

## Exact Change

### `public/app-v10.js` — `reviewCard(item)`

**Three hints removed from `.review-card-head` template:**
- `needs sharpening` (quality hint, `b-quality` badge) — driven by `claimQualityHints`
- `category echo` (`b-category-echo` badge) — only when `isTruthDerivedClaim && isClaimCategoryEcho`
- `? borderline origin` (`b-borderline-origin` badge) — only when `isLikelyBorderlineDerivedClaim`

**New variable added before `return` (uses same conditions, same data):**
```js
const hintBadges = [
  qhints.length ? `<span class="badge b-quality" ...>needs sharpening</span>` : '',
  isTruthDerivedClaim(item) && isClaimCategoryEcho(item)
    ? `<span class="badge b-category-echo" ...>category echo</span>` : '',
  isLikelyBorderlineDerivedClaim(item)
    ? `<span class="badge b-borderline-origin" ...>? borderline origin</span>` : '',
].filter(Boolean);
const hintsRow = hintBadges.length
  ? `<div class="review-card-hints">${hintBadges.join('')}</div>` : '';
```

**Template change:**
- `${hintsRow}` inserted after `</p>` (meta line) and before `<div class="review-actions">` 
- No new row renders if no hints apply (`hintsRow` = `''`)

**Primary `.review-card-head` row now contains (maximum):**
1. Type badge (`b-blue/purple/orange/yellow`) — scan-critical
2. State badge (`b-green/red/yellow`) — scan-critical
3. Report count badge (`b-red ⚑`) — attention signal
4. `~similar` badge (`b-similar`) — duplicate advisory (D-237A, stays in head)
5. `truth-derived` badge (`b-truth-derived`) — provenance context
6. `Builder`/`Builder*` chip — provenance context

Maximum 6 badges (was 9). In the common case (no reports, no similarity, no truth derivation), only 2 badges render.

### `public/styles.css`

New rule added alongside `.review-card-chips`:
```css
.review-card-hints{display:flex;flex-wrap:wrap;gap:3px;margin:3px 0 3px;opacity:.75}
```

The `opacity:.75` gives the hint row a visually quieter presence than the scan-critical head row. The existing badge color classes (`b-quality`, `b-category-echo`, `b-borderline-origin`) are reused unchanged.

### Copy change: `category-echo` → `category echo`

The badge copy was updated from `category-echo` (hyphenated) to `category echo` (spaced) for natural-language readability in the hints row. The CSS class `b-category-echo` and the condition logic are unchanged.

---

## Hints Row Placement

```
[article .review-card]
  [.review-card-head]      ← type · state · ⚑ report · ~similar · truth-derived · Builder
  [.review-card-chips]     ← origin / handle / dup / locked chips (unchanged)
  [.review-reason-tag]     ← report reason (unchanged, conditional)
  [h3 .review-card-title]  ← claim text (unchanged)
  [p .review-card-meta]    ← category · status · scores · Updated {age} (D-245B/D-246A)
  [.review-card-hints]     ← needs sharpening / category echo / ? borderline origin (NEW, conditional)
  [.review-actions]        ← Inspect / Approve / Keep Pending / Reject (unchanged)
```

---

## What Is Preserved

| Data / behaviour | Status |
|-----------------|--------|
| `needs sharpening` quality hint | **Preserved** — in hints row |
| `category echo` hint | **Preserved** — in hints row |
| `? borderline origin` hint | **Preserved** — in hints row |
| `claimQualityHints()` detection logic | **Unchanged** |
| `isTruthDerivedClaim()` detection logic | **Unchanged** |
| `isClaimCategoryEcho()` detection logic | **Unchanged** |
| `isLikelyBorderlineDerivedClaim()` detection logic | **Unchanged** |
| `~similar` advisory (D-237A) | **In primary head row — unchanged** |
| `truth-derived` badge | **In primary head row — unchanged** |
| `Builder`/`Builder*` chip | **In primary head row — unchanged** |
| D-245B inline date (`Updated {age}`) | **Unchanged** |
| D-246A score labels (`Evidence N · Test N · Survive N`) | **Unchanged** |
| Duplicate/similar advisory semantics | **Unchanged** |
| Selected-card state (D-227B) | **Unchanged** |
| Confirm-state classes (D-229A) | **Unchanged** |
| Decision feedback / "Open next item →" (D-242B/D-243A) | **Unchanged** |
| Review-to-Study Back navigation (D-239/D-240) | **Unchanged** |
| Moderation action buttons | **Unchanged** |
| Filter / sort behaviour | **Unchanged** |
| Inspect panel | **Unchanged** |
| Public profile render path | **No review card hint internals exposed** |

---

## Risk Boundaries

- No moderation semantics change
- No hint detection logic change
- No duplicate/advisory semantics change (D-237A `~similar` stays in head)
- No backend/API route changes
- No public profile exposure
- No Drift/Belief expansion changes (`public/belief-drift-expansion.js`, `public/index.html` untouched)
- No review filter/sort behaviour changes
- No decision feedback/next-item behaviour changes
- No Study navigation behaviour changes
- No src/worker.js changes
- No migration/schema/CSP/external asset changes

---

## Tests Added (16 new → baseline 2665 + 16 = **2681**)

| Test | Category |
|------|----------|
| review-card-hints container emitted by reviewCard | Hints row present |
| hintsRow variable computed in reviewCard | Hints row present |
| hintsRow conditionally rendered based on hintBadges.length | Empty when no hints |
| ? borderline origin hint still present in reviewCard | Hint preserved |
| category echo hint still present in reviewCard | Hint preserved |
| needs sharpening quality hint still present in reviewCard | Hint preserved |
| needs sharpening no longer in review-card-head section | Removed from head |
| isLikelyBorderlineDerivedClaim badge no longer in head row | Removed from head |
| ~similar badge remains in review-card-head | Head row intact |
| truth-derived badge remains in review-card-head | Head row intact |
| D-245B inline date still in metaParts | D-245B compat |
| D-246A readable score labels still present | D-246A compat |
| CSS defines .review-card-hints | CSS added |
| renderPublicProfileHtml does not reference review-card-hints | Public boundary |
| renderPublicProfileHtml does not reference hintBadges | Public boundary |
| worker.js not modified | Deploy integrity |

**Hardening smoke:** 2681 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist (pending owner deploy)

- [ ] Review queue loads without JS errors
- [ ] Claim card head row shows max 6 badges (type · state · optional report · optional ~similar · optional truth-derived · optional Builder)
- [ ] `? borderline origin` still visible on qualifying cards, but below the meta line in a quieter hints row
- [ ] `needs sharpening` still visible on qualifying cards, in the hints row
- [ ] `category echo` still visible on qualifying cards, in the hints row
- [ ] Hints row is visually quieter than the head badge row (opacity .75)
- [ ] No hints row renders on cards with no advisory hints
- [ ] `~similar` advisory still visible in the primary head row
- [ ] `truth-derived` badge still visible in the primary head row
- [ ] D-245B inline date still in meta line (`Updated {age}`)
- [ ] D-246A score labels in meta line (`Evidence N · Test N · Survive N`)
- [ ] Category and status still visible in meta line
- [ ] Quality hint badge content readable and not alarming in appearance
- [ ] Inspect button / Approve / Keep Pending / Reject all functional
- [ ] Selected card highlight and scroll intact
- [ ] Confirm-state (approve/reject pending) UI intact
- [ ] Decision feedback banner + "Open next item →" button intact
- [ ] Review-to-Study navigation intact
- [ ] Mobile layout: hints row wraps cleanly
- [ ] No console errors
- [ ] No review internals exposed on public profile page
