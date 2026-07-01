# D-256A — Review Duplicate/Similar Filter Label Audit

**Scope:** Docs only (+ optional tiny guard tests)
**Status:** COMPLETE — no deploy needed
**Baseline:** 2877 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D256A_REVIEW_DUPLICATE_SIMILAR_FILTER_LABEL_AUDIT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

D-250A Finding F-4 (MEDIUM): `Dupes` filter conflates confirmed `duplicate_of` items and advisory `near_duplicate_of` items. A moderator reading "Dupes" may expect only confirmed/explicit duplicates, but the filter includes advisory near-duplicates as well. This audit documents the exact current state before proposing a label change in D-256B.

---

## D-250A F-4 Addressed

> **F-4 MEDIUM:** `Dupes` filter conflates confirmed `duplicate_of` and advisory `near_duplicate_of`. `~Similar` is a subset/advisory view and may confuse moderators because it overlaps conceptually with `Dupes`.

This audit confirms the finding. The label confusion is real. Predicate behavior is documented below.

---

## Current Duplicate/Similar Control Inventory

### 1. Filter chip: `Dupes`

| Property | Value |
|---------|-------|
| State key | `duplicate` |
| Button label | `Dupes` |
| Count shown | Yes — sum of items with `duplicate_of || duplicateOf || near_duplicate_of || nearDuplicateOf` |
| Helper copy (D-252A) | `Dupes includes confirmed duplicates and near-duplicate advisories.` |
| Help text (`reviewFilterHelpText`) | `Items with a duplicate_of or near_duplicate_of relationship set. Includes near-similar flagged items.` |
| Empty-state copy (`reviewEmptyText`) | `No duplicate-linked items in queue.` *(brief — no explanatory note)* |
| Active summary label | `Dupes` |

### 2. Filter chip: `~Similar`

| Property | Value |
|---------|-------|
| State key | `similar` |
| Button label | `~Similar` |
| Count shown | Yes — count of items with `near_duplicate_of` only |
| Helper copy (D-252A) | `~Similar shows near-duplicate advisory items.` |
| Help text (`reviewFilterHelpText`) | `Claims with similar wording to an existing claim. Advisory only — no automatic action.` |
| Empty-state copy (`reviewEmptyText`) | `No near-duplicate suggestions in queue.` + full explanatory note |
| Active summary label | `~Similar` |

### 3. Sort option: `~Similar first`

| Property | Value |
|---------|-------|
| State key | `similar` |
| Select label | `~Similar first` |
| Sort predicate | Items with `near_duplicate_of` sorted to top; then by date |

### 4. Card badges

| Badge | Source field | Meaning |
|-------|-------------|---------|
| `<span class="badge b-similar">~similar</span>` in head row | `item.near_duplicate_of` | Advisory: near-duplicate advisory is set |
| `<span class="rc-chip rc-chip-dup">dup</span>` chip | `item.duplicate_of \|\| item.duplicateOf` | Confirmed: explicit duplicate target set |
| `review-card-similar` CSS modifier (amber left border) | `item.near_duplicate_of` | Visual: advisory near-duplicate |

**Note:** The `~similar` badge fires on `near_duplicate_of` only. The `dup` chip fires on `duplicate_of`/`duplicateOf` only. An item with both fields will show both signals. An item that is only confirmed-duplicate (`duplicate_of` set, `near_duplicate_of` absent) will show the `dup` chip but NOT the `~similar` badge.

### 5. Audit summary (`renderReviewAuditSummary`)

| Stat label | Source predicate |
|-----------|----------------|
| `~Similar` | `items.filter(i=>!!i.near_duplicate_of).length` — advisory only |
| `Dupes` | `items.filter(i=>!!(i.duplicate_of\|\|i.duplicateOf\|\|i.near_duplicate_of\|\|i.nearDuplicateOf)).length` — both confirmed + advisory |

### 6. Inspect panel fields

| Field label | Condition | Content |
|-------------|-----------|---------|
| `Duplicate Of` | `item.duplicate_of \|\| item.duplicateOf` exists | Target claim ID (plain text) |
| `Similar claim (advisory)` | `item.near_duplicate_of` exists (claim type only) | Possible related claim ID with `↗ Study`, `Copy ID`, `Use as duplicate target` buttons |
| `~similar` advisory banner | `item.near_duplicate_of` exists | `"This claim was automatically flagged as similar to an existing claim. Advisory only — no automatic merge or action has occurred. Review manually before deciding — normal moderation actions still apply."` |

### 7. Inspect panel action buttons

| Button | Condition | Action |
|--------|-----------|--------|
| `Mark Duplicate...` | Claim type, not archived/duplicate | Opens `markDuplicateUI(claimId)` — canonical target input, confirm required |
| `Dismiss ~Similar` | `nearDup` (near_duplicate_of) exists | Opens `resolveSimilarUI(claimId)` — clears advisory, no moderation |
| `Use as duplicate target` | `nearDup` exists | Opens `markDuplicateUI(claimId, nearDupId)` — prefills canonical field |

### 8. Action modals

| Modal | Title | Confirm label | What it does |
|-------|-------|--------------|-------------|
| `markDuplicateUI` | `Mark as Duplicate` | `Mark Duplicate` | POSTs to `/api/review/mark-duplicate` — sets `duplicate_of` |
| `resolveSimilarUI` | `Dismiss Similar Advisory` | `Dismiss Advisory` | POSTs to `/api/review/resolve-similar` — clears `near_duplicate_of` |

### 9. Search (`applyReviewSearch`)

Both `duplicate_of||duplicateOf` and `near_duplicate_of||nearDuplicateOf` are included in the searched field list. A moderator can search by either type of ID.

---

## Current Predicate Behavior

### `Dupes` predicate (state key `duplicate`)

```js
list.filter(i => !!(i.duplicate_of || i.duplicateOf || i.near_duplicate_of || i.nearDuplicateOf))
```

**Includes:**
- Items where `duplicate_of` is set (explicit/confirmed duplicate — moderator action required or already taken)
- Items where `near_duplicate_of` is set (advisory — automatically flagged as near-duplicate on submission)
- Items where **both** are set

**Excludes:**
- All other items

### `~Similar` predicate (state key `similar`)

```js
list.filter(i => !!i.near_duplicate_of)
```

**Includes:**
- Items where `near_duplicate_of` is set (advisory only)

**Excludes:**
- Items where only `duplicate_of` is set (confirmed-only duplicates are NOT in `~Similar`)
- All other items

### Is `~Similar` a subset of `Dupes`?

**Yes, always.** Every item in `~Similar` also appears in `Dupes`. The reverse is not true: items with only `duplicate_of` set appear in `Dupes` but not in `~Similar`.

```
Dupes = { confirmed-only } ∪ { advisory-only } ∪ { both }
~Similar = { advisory-only } ∪ { both }
~Similar ⊆ Dupes
```

### Count relationship

```
Dupes count ≥ ~Similar count, always
Dupes count - ~Similar count = number of items with only duplicate_of set (no near_duplicate_of)
```

### Do counts match predicates?

- `Dupes` chip count in `renderReviewFilterBar`: `list.filter(i=>!!(i.duplicate_of||i.duplicateOf||i.near_duplicate_of||i.nearDuplicateOf)).length` ✓ matches predicate
- `~Similar` chip count: `list.filter(i=>!!i.near_duplicate_of).length` ✓ matches predicate
- Audit summary `~Similar` stat: `items.filter(i=>!!i.near_duplicate_of).length` ✓ matches filter predicate
- Audit summary `Dupes` stat: `items.filter(i=>!!(i.duplicate_of||i.duplicateOf||i.near_duplicate_of||i.nearDuplicateOf)).length` ✓ matches filter predicate

All counts are consistent with their predicates.

### Next-item / search behavior

`renderReviewInspectPanel` and `reviewDecisionUI` both use `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` — the full search-aware pipeline. Next-item navigation respects the active filter (`Dupes` or `~Similar`) correctly.

**Minor pre-existing note:** `initReviewKb` (keyboard shortcuts) uses `applyReviewSort(applyReviewFilter(...))` without `applyReviewSearch`. This means keyboard next/prev does not respect the search query. This is a pre-existing gap, unrelated to the label audit; it should not be addressed in D-256B.

---

## Current User Meaning (Moderator Perspective)

### What a moderator likely thinks when they see `Dupes`:
> "Items that are confirmed duplicates of another claim."

### What `Dupes` actually includes:
> All items with `duplicate_of` (confirmed) **or** `near_duplicate_of` (advisory, auto-set on submission). Advisory near-duplicates are the majority of items in this filter in typical queues.

### What a moderator likely thinks when they see `~Similar`:
> "Items that are similar to another claim — advisory-only, needs review."

### What `~Similar` actually is:
> Near-duplicate advisories only. A strict subset of `Dupes`. A moderator who clicks `Dupes` expecting to only see confirmed duplicates is instead seeing both.

### Where the current copy helps:
- **D-252A helper copy** below the active summary correctly states: `"Dupes includes confirmed duplicates and near-duplicate advisories."` — accurate and visible when the filter is active.
- **`reviewFilterHelpText`** also notes: `"Items with a duplicate_of or near_duplicate_of relationship set."` — visible in the filter bar, but small.

### Where confusion remains:
- The button label `Dupes` does not surface the advisory inclusion. A moderator who hasn't read the helper copy will be surprised.
- `~Similar` and `Dupes` overlap significantly. A moderator may not know that clicking `Dupes` already includes everything from `~Similar` plus more.
- The `Dupes` empty-state copy is unusually brief (`"No duplicate-linked items in queue."`) with no explanatory note, unlike `~Similar` which has a full note.

---

## Risk Analysis

### Risks of a label-only rename:

| Risk | Level | Mitigation |
|------|-------|-----------|
| Existing tests check exact label text | MEDIUM | D-252A, D-254A lock specific copy strings — must update lock tests in D-256B |
| `renderReviewActiveSummary` uses a `filterLabels` map keyed on state — label change is in one place | LOW | Update the map and all label occurrences |
| `renderReviewEmptyState` uses the same `filterLabels` map | LOW | Same update |
| D-252A helper copy references `Dupes` by name — needs alignment | MEDIUM | Update helper copy in same commit |
| `reviewFilterHelpText` copy references `duplicate_of or near_duplicate_of` — accurate, keep | LOW | No change needed |

### Risks of a predicate change (NOT recommended in D-256B):

| Risk | Level |
|------|-------|
| Changes which items appear in `Dupes` filter | HIGH |
| Changes next-item navigation for moderator sessions using `Dupes` filter | HIGH |
| Could cause items to disappear from or appear in the queue unexpectedly | HIGH |
| Breaks D-237A and D-248A regression lock tests that verify predicate behavior | HIGH |
| Deferred — requires separate spec | — |

### Risks of splitting filters into `Duplicates` and `Similar`:

| Risk | Level |
|------|-------|
| Two separate predicates needed — predicate change, not copy change | HIGH |
| Count changes visible to moderator — may be disorienting without explanation | MEDIUM |
| All tests referencing `duplicate` state key would need review | HIGH |
| Could break confirm-state, next-item, keyboard nav flows | HIGH |
| Deferred — requires separate spec | — |

### Risks of changing card badges:

| Risk | Level |
|------|-------|
| `~similar` badge and `dup` chip are correct and distinct — changing them weakens clarity | MEDIUM |
| D-237A regression lock tests verify exact badge behavior | HIGH |
| Do not change in D-256B | — |

### Public profile:
All duplicate/similar filter, badge, and modal internals are confined to admin Review UI. None appear in `renderPublicProfileHtml`. D-254A locks this. No risk.

### Drift/Belief files:
Not touched by any duplicate/similar work. No risk.

---

## Recommended D-256B: Label Clarity Copy

**Approach:** Rename the `Dupes` button label only. Keep predicate, state key, card badges, inspect field labels, and modal titles unchanged.

### Proposed label change

| Current label | Proposed label | State key (unchanged) |
|--------------|---------------|----------------------|
| `Dupes` | `Dupes + Similar` | `duplicate` |
| `~Similar` | `~Similar` | `similar` |

**Rationale:**
- `Dupes + Similar` directly communicates what the filter contains (both confirmed duplicates and near-duplicate advisories) without requiring the moderator to read helper copy first.
- `~Similar` stays unchanged — it is accurate and the `~` prefix already signals "advisory."
- State key `duplicate` stays unchanged — no predicate or wiring change.
- Helper copy stays unchanged or is updated to match the new label.

### Alternative: keep `Dupes`, update helper and empty-state only

| What changes | Detail |
|-------------|--------|
| `Dupes` button label | **No change** |
| Helper copy | Update to be even more explicit — e.g., `"Dupes shows confirmed duplicates and near-duplicate advisories (same items as ~Similar, plus explicit duplicates)."` |
| Empty-state copy for `Dupes` | Add explanatory note matching `~Similar` style |

**Trade-off:** Does not solve the label-level confusion. Moderators who don't read the helper still see "Dupes" and assume confirmed-only. This is the weaker option.

### Rejected alternatives for D-256B:

| Option | Rejected because |
|--------|-----------------|
| Split into separate `Duplicates` and `Similar` filters | Predicate change required — needs separate spec |
| Rename `~Similar` to `Similar only` | Confusing alongside `Dupes + Similar`; the `~` prefix is established convention |
| Change card badge copy | D-237A lock — unnecessary risk; badges are accurate |
| Change `Duplicate Of` / `Similar claim (advisory)` inspect field labels | D-237A lock — no label confusion in inspect context |
| Change modal titles | No label confusion in modal context; modals have full explanatory copy |

---

## Exact Current Copy Snapshot (for D-256B test authoring)

### Button labels (in `renderReviewFilterBar` `defs` array):
```js
['similar', '~Similar']
['duplicate', 'Dupes']
```

### Active summary filter labels (in `renderReviewActiveSummary` and `renderReviewEmptyState` `filterLabels` map):
```js
similar: '~Similar'
duplicate: 'Dupes'
```

### D-252A helper copy (in `renderReviewFilterHelper` `copy` map):
```js
similar: '~Similar shows near-duplicate advisory items.'
duplicate: 'Dupes includes confirmed duplicates and near-duplicate advisories.'
```

### Filter help text (in `reviewFilterHelpText` map):
```js
similar: 'Claims with similar wording to an existing claim. Advisory only — no automatic action.'
duplicate: 'Items with a duplicate_of or near_duplicate_of relationship set. Includes near-similar flagged items.'
```

### Empty-state copy (in `reviewEmptyText` map):
```js
similar: '<p class="small">No near-duplicate suggestions in queue.</p><p class="small review-first-note">Claims flagged as similar appear here. These are advisory — use Approve, Keep Pending, or Reject as normal. No automatic action is taken.</p>'
duplicate: '<p class="small">No duplicate-linked items in queue.</p>'
```

Note the asymmetry: `~Similar` empty state has a full explanatory note; `Dupes` empty state does not. D-256B should address this if renaming the label.

### Audit summary stat labels (in `renderReviewAuditSummary`):
```js
{ label: '~Similar', n: similar, cls: 'similar' }
{ label: 'Dupes', n: dups, cls: 'similar' }
```

---

## Test Recommendations for D-256B

The following tests should be written or updated in D-256B:

| Test | Category |
|------|----------|
| `Dupes + Similar` (or new label) appears in filter bar | Label |
| `duplicate` state key unchanged in `setReviewFilter` | Predicate unchanged |
| `Dupes` predicate still uses `duplicate_of \|\| near_duplicate_of` (both fields) | Predicate unchanged |
| `~Similar` predicate still uses `near_duplicate_of` only | Predicate unchanged |
| `Dupes + Similar` count matches `duplicate` predicate count | Count consistency |
| `~Similar` count unchanged | Count consistency |
| Helper copy updated to reference new label | Copy aligned |
| Empty-state copy for `Dupes` updated to match label and include note | Copy aligned |
| Active summary shows new label | Copy aligned |
| `applyReviewFilter` `duplicate` predicate text unchanged | Lock |
| `applyReviewFilter` `similar` predicate text unchanged | Lock |
| `~similar` card badge still fires on `near_duplicate_of` only | D-237A compat |
| `dup` chip still fires on `duplicate_of` only | D-237A compat |
| `Similar claim (advisory)` inspect field label unchanged | D-237A compat |
| `resolveSimilarUI` / `markDuplicateUI` unchanged | D-237A compat |
| Search pipeline (`applyReviewSearch`) still searches `duplicate_of` and `near_duplicate_of` | D-253A compat |
| Next-item follows visible list under `Dupes + Similar` filter | D-243A compat |
| `renderPublicProfileHtml` does not reference new label | Public boundary |
| Worker unchanged | Deploy integrity |

---

## Public/Privacy Boundary

- Duplicate/similar filter controls, badges, inspect fields, and modals are entirely admin-only Review UI.
- `renderPublicProfileHtml` does not reference `duplicate`, `Dupes`, `~Similar`, `near_duplicate_of`, `duplicate_of`, `review-similar`, `copySimilarClaimId`, `markDuplicateUI`, or `resolveSimilarUI`. Locked by D-254A and D-237A.
- No public data fields are affected.
- D-216A allowlist unchanged.
- D-214A/D-215A/D-216A privacy locks remain active.

---

## Drift/Belief Files Untouched

- `public/belief-drift-expansion.js` — not touched by duplicate/similar arc.
- `public/index.html` — not touched.
- No reference to `near_duplicate_of` or `duplicate_of` in Drift/Belief files.

---

## No Backend/API/Schema Changes

- `/api/review/mark-duplicate` and `/api/review/resolve-similar` routes unchanged.
- `claims.duplicate_of` and `claims.near_duplicate_of` columns unchanged.
- No migration, schema, CSP, or external asset changes in this audit.
- D-256B label change requires no backend changes.

---

## What Is NOT Changed in This Audit

| Behavior | Status |
|----------|--------|
| `applyReviewFilter` predicate for `duplicate` | Unchanged — no D-256B predicate change |
| `applyReviewFilter` predicate for `similar` | Unchanged |
| State key `duplicate` | Unchanged |
| State key `similar` | Unchanged |
| Card badges (`~similar`, `dup`) | Unchanged |
| Inspect panel fields and labels | Unchanged |
| Modals (`markDuplicateUI`, `resolveSimilarUI`) | Unchanged |
| Moderation semantics | Unchanged |
| Public profile render path | Unchanged |
| Drift/Belief expansion files | Unchanged |

---

## Suggested Next: D-256B — Review Duplicate/Similar Label Clarity

**Scope:** `public/app-v10.js`, `public/styles.css` (if any), `scripts/hardening-smoke-test.mjs`, docs.
**Type:** Copy change only — no predicate change, no new backend.
**Deploy needed:** Yes (owner deploy after D-256B).

**Changes:**
1. Rename `Dupes` button label → `Dupes + Similar` in `renderReviewFilterBar` `defs`.
2. Update `filterLabels` map in `renderReviewActiveSummary` and `renderReviewEmptyState`.
3. Update `renderReviewFilterHelper` helper copy for `duplicate` key to reference new label.
4. Update `reviewEmptyText` `duplicate` entry to add explanatory note.
5. Update `renderReviewAuditSummary` stat label from `Dupes` to `Dupes + Similar`.
6. Update hardening smoke tests that lock the old `Dupes` label string.
7. Create `docs/D256B_REVIEW_DUPLICATE_SIMILAR_LABEL_CLARITY.md`.
8. Update `docs/README.md`.

**Preserve in D-256B:**
- `duplicate` state key
- `applyReviewFilter` predicate (both confirmed + advisory)
- `~Similar` button label and state key
- All card badges
- All inspect panel field labels
- All modal titles and copy
- D-237A regression lock (update any label-specific tests, preserve predicate tests)
- D-254A regression lock (update any label-specific tests)
