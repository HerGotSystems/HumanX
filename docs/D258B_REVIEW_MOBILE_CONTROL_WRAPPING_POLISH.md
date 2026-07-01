# D-258B — Review Mobile Control Wrapping Polish

**Scope:** CSS + tests + docs
**Status:** COMPLETE — deploy needed
**Baseline:** 2924 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/D258B_REVIEW_MOBILE_CONTROL_WRAPPING_POLISH.md`, `docs/README.md`
**App UI changes:** CSS-only — layout/wrapping polish; no copy, no behavior
**CSS changes:** Yes — 3 additions, 1 update (see below)
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

Addresses the two HIGH findings and one MEDIUM finding from the D-258A mobile controls wrapping audit:

- **F-1 HIGH** — `.review-sort-bar` / `.review-sort-label` / `.review-sort-select` had no CSS; the sort control shared the same flex row as 11 filter chips with no layout isolation.
- **F-2 HIGH** — `.review-decision-feedback` had no `flex-wrap`; the feedback message + "Open next item →" + Dismiss buttons could crowd/overflow on narrow viewports.
- **F-4 MEDIUM** — `.review-empty-actions` had no display/flex rule; "Clear search" and "Show all review items" buttons had no spacing guarantee.

All changes are CSS-only. No copy, no JS behavior, no predicate, no filter keys, no action handlers changed.

---

## CSS Changes

### 1. Sort bar layout isolation (F-1 fix)

Added three new rules in `public/styles.css`, after the `/* Filter bar help text */` section:

```css
/* D-258B: Sort bar layout — isolates sort label+select pair from chip row */
.review-sort-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:2px 0}
.review-sort-label{font-size:10px;color:var(--muted);white-space:nowrap;flex-shrink:0}
.review-sort-select{font-size:11px;padding:3px 6px;border-radius:6px;background:var(--panel,#10131d);border:1px solid var(--line);color:var(--text);cursor:pointer;min-width:120px;max-width:180px;width:auto}
```

**Effect:** The Sort label and select now form a visually distinct flex unit. They wrap cleanly as a pair below the filter chips when viewport width is narrow. The select cannot be crushed smaller than 120px.

### 2. Decision feedback flex-wrap (F-2 fix)

Updated `.review-decision-feedback` (was `display:flex;align-items:center;gap:8px;...`) to add `flex-wrap:wrap`. Updated `.review-feedback-msg` to add `min-width:0`. Added `flex-shrink:0` to both `.review-feedback-dismiss` and `.review-feedback-next`.

```css
/* D-230A: review decision feedback banner / D-258B: added flex-wrap */
.review-decision-feedback{display:flex;align-items:center;gap:8px;flex-wrap:wrap;...}
.review-feedback-msg{flex:1;min-width:0}
.review-feedback-dismiss{...flex-shrink:0}
.review-feedback-next{...flex-shrink:0}
```

**Effect:** On narrow viewports, the feedback message wraps to its own line cleanly. Both action buttons stay readable and tappable — they cannot shrink below their text content.

### 3. Empty actions flex container (F-4 fix)

Updated `.review-empty-actions` from `margin-top:10px` to:

```css
.review-empty-actions{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
```

**Effect:** "Clear search" and "Show all review items" buttons now have a consistent 6px gap between them and wrap to a new line if needed, instead of running as inline-block with no spacing guarantee.

---

## What Did NOT Change

- `public/app-v10.js` — unchanged
- Filter chip labels, counts, predicates — unchanged
- `Dupes + Similar` label — unchanged (D-256B lock)
- `~Similar` chip, predicate, card badges — unchanged
- `applyReviewFilter`, `applyReviewSearch`, `applyReviewSort` — unchanged
- `renderReviewFilterBar` HTML structure — unchanged (`.review-filter-compact` marker preserved)
- Search pipeline order — unchanged
- Clear search / Show all review items behavior — unchanged
- Next-item behavior — unchanged
- Inspect prev/next behavior — unchanged
- Moderation actions — unchanged
- Duplicate/advisory semantics — unchanged
- Review card metadata (D-245→D-248) — unchanged
- Drift/Belief expansion files — unchanged
- Worker — unchanged
- No backend/API/migration/schema/CSP/external asset changes

---

## D-245→D-257 Locks Preserved

| Lock | Verified |
|------|---------|
| D-245B inline date | ✓ — `.review-card-meta` untouched |
| D-246A score labels | ✓ — `Evidence N · Test N · Survive N` untouched |
| D-247A hint row | ✓ — `.review-card-hints` untouched |
| D-248A card metadata density | ✓ — card head/chips/meta/hints/actions untouched |
| D-250B active summary | ✓ — `renderReviewActiveSummary` wired; class untouched |
| D-251A zero-results | ✓ — title/context/buttons untouched; only actions container got flex |
| D-252A helper copy | ✓ — exact copy preserved |
| D-253A search | ✓ — `applyReviewSearch`, pipeline, clear untouched |
| D-254A full regression lock | ✓ — 64 structural tests all pass |
| D-256B `Dupes + Similar` | ✓ — label, helper, empty-state copy all preserved |
| D-237A duplicate advisory | ✓ — advisory banner, Copy ID, Use as dup, buttons untouched |
| D-243A next-item | ✓ — feedback banner behavior unchanged; `flex-shrink:0` is cosmetic only |
| Public profile boundary | ✓ — no Review CSS added to public profile render path |

---

## Test Results

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2924 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**New tests added:** 21 (D-258B section in `hardening-smoke-test.mjs`)
**Previous baseline:** 2903. **New baseline:** 2924.

---

## Privacy / Public Boundary

All CSS classes added/modified are admin-only Review queue classes. None appear in `renderPublicProfileHtml`. D-216A allowlist unchanged.

---

## Drift/Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` not touched by D-258B.

---

## Deploy

Owner must deploy `public/styles.css` via `wrangler deploy` for CSS changes to go live. No backend/migration/schema/CSP/external asset changes required.

---

## Live Sanity Checklist (pending owner deploy)

When D-258B is deployed, verify:

1. Review/moderation page opens normally.
2. Queue loads without console errors.
3. Filter chips display and wrap correctly.
4. Sort "Sort:" label and select appear below/near the chip row, not mid-chip-row.
5. Sort select is readable and tappable (not crushed).
6. Sort select value persists correctly (behavior unchanged).
7. Active filter + search + sort behavior unchanged.
8. When a decision is made, the feedback banner displays message + buttons.
9. On narrow viewports, feedback banner wraps without overflow.
10. "Open next item →" button remains readable and tappable.
11. "Dismiss" button remains readable and tappable.
12. "Open next item →" click behavior unchanged (navigation only).
13. "Dismiss" click behavior unchanged.
14. When no search/filter matches: zero-results empty state displays.
15. "Clear search" and "Show all review items" buttons have consistent gap.
16. Both buttons are readable and tappable.
17. "Clear search" resets search only (preserves filter/sort).
18. "Show all review items" resets filter only (preserves search/sort).
19. `Dupes + Similar` filter chip label unchanged.
20. `~Similar` filter chip label unchanged.
21. Card badges unchanged (`~similar`, `dup`, type, state).
22. Card metadata unchanged (date, score labels, hint row).
23. Duplicate/similar advisory controls unchanged.
24. D-245→D-257 behavior unchanged throughout.
25. No console errors.

---

## Future Rule

Any future CSS change to `.review-sort-bar`, `.review-decision-feedback`, or `.review-empty-actions` must:

1. Keep all D-258B lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-258C (or higher) task documenting what changed and why.
