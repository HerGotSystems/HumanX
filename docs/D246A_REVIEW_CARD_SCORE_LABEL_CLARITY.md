# D-246A — Review Card Score Label Clarity

**Scope:** Frontend (app-v10.js only) + tests + docs
**Status:** COMPLETE — owner deploy PASS (D-246B live sanity PASS 2026-07-01)
**Baseline:** 2665 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D246A_REVIEW_CARD_SCORE_LABEL_CLARITY.md`, `docs/README.md`
**App UI changes:** Yes — score labels changed from `ev:N ts:N sv:N` to `Evidence N · Test N · Survive N`
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No (deployed)

---

## Purpose

Address D-245A finding F-2: the claim score triplet on review cards used cryptic abbreviations (`ev:`, `ts:`, `sv:`) that are opaque to moderators who haven't memorised the scoring model. The underlying values are useful for triage but the labels made them hard to read at a glance.

---

## D-245A Finding Addressed

**F-2 (MEDIUM) — Score triplet on meta line is dense abbreviation:**
> `ev:0 ts:- sv:-` means nothing to a moderator scanning fast. The full scoring semantics are explained in the inspect panel. On the card, the triplet takes up roughly half the meta line but conveys less information than the single-word category to its left.

---

## Exact Change

### `public/app-v10.js` — `reviewCard(item)` scoreHint

**Before:**
```js
const scoreHint = isEvidence ? (item.stance||'evidence')
  : isTruth ? `rep ×${item.repetition_score||1}`
  : `ev:${item.evidence_score??0} ts:${item.testability??'-'} sv:${item.survivability??'-'}`;
```

**After:**
```js
const scoreHint = isEvidence ? (item.stance||'evidence')
  : isTruth ? `rep ×${item.repetition_score||1}`
  : `Evidence ${item.evidence_score??0} · Test ${item.testability??'-'} · Survive ${item.survivability??'-'}`;
```

Only the claim branch is changed. Evidence and truth scoreHint are untouched.

**Score copy used:** `Evidence`, `Test`, `Survive` — matches the existing convention in `analysisSummary` / `meter()` and the inspect panel score meters.

**User-visible result (claim card meta line):**
- Before: `general · pending · ev:0 ts:- sv:- · Updated 3h ago`
- After: `general · pending · Evidence 0 · Test - · Survive - · Updated 3h ago`

The internal ` · ` separators within `scoreHint` blend with the outer `metaParts.join(' · ')` separator, producing a consistent readable meta line without adding a new row.

---

## What Is Preserved

| Data / behaviour | Status |
|-----------------|--------|
| `evidence_score` source field | **Unchanged** — same field, value still rendered |
| `testability` source field | **Unchanged** — same field, value still rendered |
| `survivability` source field | **Unchanged** — same field, value still rendered |
| Score calculation / scoring logic | **Unchanged** |
| Truth `rep ×N` label | **Unchanged** |
| Evidence stance label | **Unchanged** |
| D-245B inline date (`Updated {age}` in meta line) | **Unchanged** |
| Category / status / origin metadata | **Unchanged** |
| Quality hints badge ("needs sharpening") | **Unchanged** |
| Duplicate / similar advisory markers | **Unchanged** |
| Selected-card state (D-227B) | **Unchanged** |
| Confirm-state classes (D-229A) | **Unchanged** |
| Decision feedback / "Open next item →" (D-242B/D-243A) | **Unchanged** |
| Review-to-Study Back navigation (D-239/D-240) | **Unchanged** |
| Moderation action buttons | **Unchanged** |
| Filter / sort behaviour | **Unchanged** |
| Inspect panel score display | **Unchanged** (meters show `Evidence`, `Test`, `Survive` as before) |
| Public profile render path | **No review score internals exposed** |

---

## What Changed (Appearance Only)

- Claim card meta line: `ev:N ts:N sv:N` → `Evidence N · Test N · Survive N`
- Evidence and truth cards: unchanged
- No row added, no row removed
- Meta line may be slightly wider on some claim cards; wraps naturally on narrow screens

---

## Label Convention Alignment

The `meter()` helper (used in `analysisSummary` and the study/inspect panel) already uses:
- `'Evidence'`
- `'Test'`
- `'Survive'`

D-246A brings the card meta line into alignment with this existing convention.

---

## Risk Boundaries

- No moderation semantics change
- No score calculation change
- No duplicate/advisory semantics change
- No backend/API route changes
- No public profile exposure
- No Drift/Belief expansion changes (`public/belief-drift-expansion.js`, `public/index.html` untouched)
- No review filter/sort behaviour changes
- No decision feedback/next-item behaviour changes
- No Study navigation behaviour changes
- No src/worker.js changes
- No public/styles.css changes
- No migration/schema/CSP/external asset changes

---

## Tests Added (13 new → baseline 2652 + 13 = **2665**)

| Test | Category |
|------|----------|
| reviewCard scoreHint uses readable "Evidence" label | Labels changed |
| reviewCard scoreHint uses readable "Test" label | Labels changed |
| reviewCard scoreHint uses readable "Survive" label | Labels changed |
| Cryptic `ev:` template literal no longer in reviewCard scoreHint | Old format gone |
| `evidence_score` still referenced in scoreHint | Values preserved |
| `testability` still referenced in scoreHint | Values preserved |
| `survivability` still referenced in scoreHint | Values preserved |
| D-245B inline date still in metaParts | D-245B compat |
| Category still in metaParts for claim/truth | Metadata intact |
| Truth `rep ×` label still intact | Truth unchanged |
| renderPublicProfileHtml does not reference Evidence score label | Public boundary |
| CSS has no new review-score-label rule | CSS unchanged |
| worker.js not modified | Deploy integrity |

Also updated: D-129E legacy test (previously asserted `ev:/ts:/sv:` string presence) updated to assert `evidence_score`/`testability`/`survivability` field references instead, preserving the semantic intent.

**Hardening smoke:** 2665 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Live Sanity Checklist — D-246B PASS (2026-07-01, owner deploy)

- [x] Review queue loads without JS errors
- [x] Claim card meta line shows `Evidence N · Test N · Survive N` (not `ev:N ts:N sv:N`)
- [x] Evidence and truth card meta lines unchanged
- [x] Date (`Updated {age}`) still in meta line — D-245B preserved
- [x] Category and status still visible in meta line
- [x] Quality hint badge ("needs sharpening") still appears in head row
- [x] Similar/duplicate advisory still visible
- [x] Inspect button / Approve / Keep Pending / Reject all functional
- [x] Selected card highlight and scroll intact
- [x] Confirm-state (approve/reject pending) UI intact
- [x] Decision feedback banner + "Open next item →" button intact
- [x] Review-to-Study navigation intact
- [x] No console errors
- [x] No review internals exposed on public profile page

**28/28 PASS** — owner live sanity complete 2026-07-01
