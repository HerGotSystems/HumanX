# D-87A: Admin Review Queue UI/Ergonomics Audit

Date: 2026-06-07
Type: Read-only audit. No mutations. No POST calls. No D1 writes. No Wrangler.
Scope: Inspect current review queue UI in `public/app-v10.js` and propose D-87B frontend-only improvement plan.

---

## 1. Git State

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| HEAD | 98cb38f (D-86A) | 98cb38f | ✅ |
| Working tree | clean | clean | ✅ |

---

## 2. Current Admin Review UI — Capabilities Inventory

### 2a. State Variables (lines 19–24)

```js
let reviewQueue = { claims: [], truths: [], review: [], archived_total: 0, ... };
let inspectedReviewItem = null;
let reviewStateFilter = 'review';    // default filter
let reviewAuditOpen = false;
let pendingRejectReviewId = null;
let pendingCleanupReviewId = null;
let reviewSortOrder = 'newest';
```

### 2b. Filter Chips — `renderReviewFilterBar` (line 108)

Existing filter chips:

| Filter | Label | Logic |
|--------|-------|-------|
| `review` | Pending | review_state === 'review' |
| `public` | Public | review_state === 'public' |
| `rejected` | Rejected | review_state === 'rejected' |
| `reported` | Reported | report_count > 0 |
| `similar` | ~Similar | near_duplicate_of !== null |
| `quality` | ~Quality | claimQualityHints() returns hints |
| `all` | All | no filter |

**Missing filters:**
- `duplicate` — items with `duplicate_of` set (distinct from `near_duplicate_of`)
- `demo-seed` — items from `humanx-seed` handle or `clm_seed_*` id pattern
- `test-account` — items from known test handles (e.g., `anon-xksavy`)
- `seed-hx` — items from `anon-o_seed` handle or `HX-000*` id pattern
- `handle` — filter by a specific submitter handle

### 2c. Sort Options — `applyReviewSort` (line 104)

| Sort | Label |
|------|-------|
| `newest` | Newest first ✅ |
| `oldest` | Oldest first ✅ |
| `reported` | Reported first ✅ |
| `similar` | ~Similar first ✅ |
| `quality` | ~Quality first ✅ |

**Missing sorts:**
- `duplicate` — items with `duplicate_of` floated first
- `handle` — alphabetical by submitter

### 2d. Review Card — `reviewCard` (line 111)

Fields shown on the card face:

| Field | Shown | Location |
|-------|:-----:|----------|
| type badge (claim/truth/evidence) | ✅ | head row |
| review_state badge | ✅ | head row |
| report_count badge (⚑) | ✅ | head row (if > 0) |
| near_duplicate_of badge (~similar) | ✅ | head row |
| quality hints badge (needs sharpening) | ✅ | head row |
| claim text | ✅ | h3 title |
| category | ✅ | meta line |
| status | ✅ | meta line |
| evidence_score | ✅ | meta line (as "score N") |
| updated age | ✅ | small date line |
| **handle** | ❌ | not shown on card |
| **duplicate_of** | ❌ | not shown on card |
| **statusLocked** | ❌ | not shown on card |
| **seed/demo/test-account origin label** | ❌ | not shown on card |
| **id** | ❌ | not shown on card |

### 2e. Inspect Panel — `renderReviewInspectPanel` (line 124)

All of these fields **are** shown in the inspect panel when the user clicks "Inspect":

| Field | In Panel |
|-------|:--------:|
| id | ✅ |
| type | ✅ |
| review_state | ✅ |
| report_count / reason | ✅ |
| status | ✅ |
| category | ✅ |
| handle ("Submitted By") | ✅ |
| evidenceScore | ✅ |
| testability | ✅ |
| survivability | ✅ |
| contradictions | ✅ |
| duplicate_of | ✅ |
| near_duplicate_of (with ↗ link) | ✅ |
| created_at / updated_at | ✅ |
| **statusLocked** | ❌ (not shown anywhere) |
| **seed/demo origin label** | ❌ |

### 2f. Inspect Panel Navigation

- Prev / Next buttons navigate through the *currently filtered* list ✅
- Position shown as "N of M" ✅
- Quality hint count appended to position ✅
- Panel renders `grid-column: 1/-1` (full width) ✅

**Scroll issue:** The panel inserts above the card list via innerHTML replacement. When a decision is made (`reviewDecisionUI`), `loadReviewQueue()` is awaited then `renderReviewList()` fires, which does a full `innerHTML` replace of `#reviewList`. This resets scroll position to wherever the browser lands after the DOM update. There is no scroll-preservation or anchor logic. For a 13-item queue this is tolerable; at higher volume it would be disruptive.

### 2g. Audit Summary Bar — `renderReviewAuditSummary` (line 122)

Counts shown (collapsible "▸ Audit Summary"):

| Stat | Shown |
|------|:-----:|
| Total | ✅ |
| Pending | ✅ |
| Public | ✅ |
| Rejected | ✅ |
| Reported | ✅ |
| ~Smoke/Test | ✅ (via `isSuspectedTestArtefact`) |
| ~Similar | ✅ |
| Archived | ✅ (collapsible sub-section) |
| **Duplicates (duplicate_of set)** | ❌ |
| **Demo seeds** | ❌ |
| **Test-account submissions** | ❌ |

### 2h. Test Artefact Detection — `isSuspectedTestArtefact` (line 121)

```js
function isSuspectedTestArtefact(item) {
  const text = [item.claim||'', item.statement||'', item.origin||'',
                item.category||'', item.handle||''].join(' ').toLowerCase();
  return text.includes('smoke')
    || /\btest\b/.test(text)
    || text.includes('automated write')
    || text.includes('automated smoke');
}
```

**Gap:** This matches keyword `test` in text/handle. It does **not** match:
- `humanx-seed` handle (demo seeds in review)
- `anon-o_seed` handle (early HX seed rows)
- `anon-xksavy` handle (the Group C test account that submitted 5 items)
- `clm_seed_*` id pattern
- `HX-000*` id pattern

So none of the 13 current review items trigger `isSuspectedTestArtefact` — the `~Smoke/Test` counter shows 0, and the "Archive test artefact" button never appears for any of them. **This is the primary ergonomic gap.** The 4 demo seeds and 5 test-account items are invisible to the existing detection logic.

### 2i. Decision Buttons

| Button | Available | Location |
|--------|:---------:|----------|
| Approve | ✅ | card + inspect panel top + inspect panel bottom |
| Keep Pending | ✅ | card + inspect panel top + inspect panel bottom |
| Reject (with confirm) | ✅ | card + inspect panel |
| Archive test artefact | ✅ (only if isSuspectedTestArtefact) | inspect panel |
| Mark Duplicate... | ✅ | inspect panel |
| Dismiss ~Similar | ✅ (only if near_duplicate_of) | inspect panel |
| Open Study View ↗ | ✅ | inspect panel |

### 2j. API Fields Available to UI

`GET /api/review` uses `SELECT c.*` for claims, so **every column** is returned. Fields confirmed available in client objects that are **not yet rendered on the card**:

- `handle` — in DB, in inspect panel, **not on card**
- `duplicate_of` — in DB, in inspect panel, **not on card face**
- `status_locked` (mapped as `statusLocked`) — in DB, **nowhere in UI**
- `near_duplicate_of` — in DB, badge on card ✅ but no filter for `duplicate_of`

---

## 3. Gap Summary

### Critical gaps (directly impacting D-84/D-85 queue triage)

| Gap | Impact |
|-----|--------|
| No `duplicate_of` chip on card | 4 demo seeds + 1 test duplicate all have `duplicate_of` set — not visible without inspecting each |
| No origin label on card (demo seed / HX seed / test account) | Reviewer must open Inspect panel and read the handle to know the item's origin |
| `isSuspectedTestArtefact` doesn't detect `humanx-seed` / `anon-o_seed` / `anon-xksavy` | "Archive test artefact" button never appears for any of the 13 current review items despite 9 being demo/test origin |
| No `duplicate` filter chip | Can't isolate the 5 items with `duplicate_of` set |
| No `statusLocked` indicator anywhere | A1 lock is invisible in admin UI |

### Moderate gaps (ergonomic, not blocking)

| Gap | Impact |
|-----|--------|
| Handle not on card | Must open Inspect to see submitter — prevents quick origin assessment |
| No "demo-seed" or "test-account" filter | Can't see all items from a given origin group at once |
| Scroll resets on every decision | Loses position after each Approve/Reject; manageable at 13 items |
| Audit summary doesn't count duplicates or demo-seed items | Summary stats incomplete for current queue composition |

### Minor gaps (future-proofing)

| Gap | Impact |
|-----|--------|
| No sort by handle | Can't group by submitter |
| No batch-select for same-handle items | Would speed up clearing test-account submissions |

---

## 4. D-87B Frontend-Only Implementation Plan

**Scope:** `public/app-v10.js` only. No Worker/backend changes. No new API routes. All fields used already exist in the client objects returned by `GET /api/review`.

**Risk level:** Low. All changes are rendering/display only. No new API calls. No state logic changes beyond adding 2 filter values and extending `isSuspectedTestArtefact`.

### 4a. Extend `isSuspectedTestArtefact`

Add detection for demo-seed and test-account handles and ID patterns:

```js
function isSuspectedTestArtefact(item) {
  const text = [item.claim||'', item.statement||'', item.origin||'',
                item.category||'', item.handle||''].join(' ').toLowerCase();
  // existing
  if (text.includes('smoke') || /\btest\b/.test(text) ||
      text.includes('automated write') || text.includes('automated smoke')) return true;
  // new: demo seed handles and id patterns
  const handle = (item.handle||'').toLowerCase();
  const id = (item.id||'');
  if (handle === 'humanx-seed' || handle === 'anon-o_seed') return true;
  if (/^clm_seed_/.test(id)) return true;
  if (/^HX-0+\d+$/.test(id)) return true;
  // new: known test-account handle (anon-xksavy submitted 5 Group C items)
  if (handle === 'anon-xksavy') return true;
  return false;
}
```

This makes "Archive test artefact" available for all 9 demo/test items in the current queue when they are in `rejected` state, and correctly counts them in `~Smoke/Test` in the audit summary.

### 4b. Add origin classification helper

```js
function reviewItemOriginLabel(item) {
  const handle = (item.handle||'').toLowerCase();
  const id = item.id||'';
  if (/^clm_seed_/.test(id) || handle === 'humanx-seed') return 'demo-seed';
  if (/^HX-0+\d+$/.test(id) || handle === 'anon-o_seed') return 'hx-seed';
  if (handle === 'anon-xksavy') return 'test-account';
  return null;
}
```

### 4c. Add origin badge + handle chip + duplicate chip to `reviewCard`

Add to the card `<head>` row after existing badges:

```js
// origin label
const origin = reviewItemOriginLabel(item);
const originBadge = origin
  ? `<span class="badge b-origin-${origin.replace('-','')}">${origin}</span>`
  : '';
// handle chip (compact)
const handleChip = item.handle
  ? `<span class="review-card-handle">${esc(item.handle)}</span>`
  : '';
// duplicate_of chip
const dupOf = item.duplicate_of || item.duplicateOf || null;
const dupChip = dupOf
  ? `<span class="badge b-dup" title="Duplicate of ${esc(dupOf)}">dup</span>`
  : '';
// statusLocked chip (only if true)
const lockedChip = (item.status_locked || item.statusLocked)
  ? `<span class="badge b-locked" title="Status score is locked">🔒 locked</span>`
  : '';
```

### 4d. Add `statusLocked` to inspect panel field list

In `renderReviewInspectPanel`, after the `duplicate_of` field:

```js
const locked = item.status_locked || item.statusLocked || false;
if (locked) fields.push(['Status Lock', '<span class="badge b-locked">🔒 Score locked</span>']);
```

### 4e. Add two new filter chips

Add to the `defs` array in `renderReviewFilterBar`:

```js
['duplicate', 'Duplicates'],
['origin-demo', 'Demo/Test'],
```

And in `applyReviewFilter`:

```js
if (f === 'duplicate') return list.filter(i => !!(i.duplicate_of || i.duplicateOf));
if (f === 'origin-demo') return list.filter(i => !!reviewItemOriginLabel(i));
```

### 4f. Add duplicate + demo-seed counts to audit summary

In `renderReviewAuditSummary`, add to the `stats` array:

```js
const dups = items.filter(i => !!(i.duplicate_of || i.duplicateOf)).length;
const demo = items.filter(i => !!reviewItemOriginLabel(i)).length;
// append to stats:
{ label: 'Duplicates', n: dups, cls: 'dup' },
{ label: 'Demo/Test', n: demo, cls: 'smoke' },
```

### 4g. CSS additions needed (in `<style>` block in `index.html` or inline)

```css
.b-origin-demoseed  { background: #6b4e9b; color: #fff; }
.b-origin-hxseed    { background: #7a5c00; color: #fff; }
.b-origin-testaccount { background: #8b3030; color: #fff; }
.b-dup              { background: #555; color: #eee; }
.b-locked           { background: #b8860b; color: #fff; }
.review-card-handle { font-size: 0.7rem; color: var(--text-muted,#888); margin-left: 4px; font-family: monospace; }
.review-audit-stat-dup   { border-color: #555; }
```

### 4h. Files touched

| File | Change type |
|------|------------|
| `public/app-v10.js` | Add `reviewItemOriginLabel`, extend `isSuspectedTestArtefact`, add chips to `reviewCard`, add field to `renderReviewInspectPanel`, add 2 filters to `renderReviewFilterBar`/`applyReviewFilter`, add 2 stats to `renderReviewAuditSummary` |
| `public/index.html` | Add 5–7 CSS rules for new badge classes |

**No Worker changes. No new API routes. No DB writes. No D1.**

### 4i. Risk assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Breaking existing filter logic | Low | New filter keys don't overlap existing ones |
| isSuspectedTestArtefact false positives | Low | Patterns are specific handle/id values, not keyword matching |
| CSS badge conflicts | Very low | New class names are namespaced (`b-origin-*`, `b-dup`, `b-locked`) |
| Card layout overflow with new chips | Low | Chips are small inline-flex items; existing card head already wraps |
| Static check regressions | None expected | No new functions, only extending existing ones |

---

## 5. Static Checks

| Script | Expected | Actual | Pass |
|--------|----------|--------|------|
| `node --check public/app-v10.js` | exit 0 | exit 0 | ✅ |
| `hardening-smoke-test.mjs` | 127 passed | 127 passed | ✅ |
| `belief-engine-static-check.mjs` | 24 passed | 24 passed | ✅ |
| `worker-route-static-check.mjs` | 39 passed | 39 passed | ✅ |

---

## 6. Mutation Confirmation

| Rule | Status |
|------|--------|
| No POST calls made | ✅ |
| No review_state changed | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| No archive/cleanup route called | ✅ |
| No live UI testing | ✅ |
| Admin token not printed or committed | ✅ |

---

## 7. D-87B Implementation Checklist (for next task)

- [ ] Add `reviewItemOriginLabel(item)` helper
- [ ] Extend `isSuspectedTestArtefact` with handle/id pattern checks
- [ ] Add origin badge + handle chip + dup chip + locked chip to `reviewCard` head row
- [ ] Add `statusLocked` field to `renderReviewInspectPanel`
- [ ] Add `duplicate` and `origin-demo` filter chips to `renderReviewFilterBar`
- [ ] Add corresponding filter logic to `applyReviewFilter`
- [ ] Add `Duplicates` and `Demo/Test` stats to `renderReviewAuditSummary`
- [ ] Add CSS rules for new badge classes to `public/index.html`
- [ ] Run static checks (expect 127/24/39)
- [ ] Verify no regressions in existing filter/sort behaviour
- [ ] Commit direct to main (docs + code)
- [ ] Push to main

**Estimated scope:** ~60–80 lines of JS additions, ~10 lines of CSS. Single-session task.
