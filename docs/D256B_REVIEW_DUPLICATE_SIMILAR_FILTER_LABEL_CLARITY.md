# D-256B — Review Duplicate/Similar Filter Label Clarity

**Scope:** Copy changes to `public/app-v10.js` + tests + docs
**Status:** COMPLETE — deploy needed
**Baseline:** 2903 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D256B_REVIEW_DUPLICATE_SIMILAR_FILTER_LABEL_CLARITY.md`, `docs/README.md`
**App UI changes:** Copy only — filter button label, active summary label, helper copy, empty-state copy, audit stat label
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** Yes

---

## Purpose

Addresses D-250A F-4 MEDIUM (and D-256A audit recommendation): the `Dupes` filter button label was terse and conflated confirmed `duplicate_of` records with advisory `near_duplicate_of` records, creating moderator confusion. This task renames the visible label to `Dupes + Similar` everywhere it appears, making it explicit that both types are included. No predicate, state key, card badge, inspect panel field, or action button is changed.

---

## What Changed

### `public/app-v10.js`

| Location | Old copy | New copy |
|----------|----------|----------|
| `renderReviewFilterBar` defs | `['duplicate','Dupes']` | `['duplicate','Dupes + Similar']` |
| `renderReviewActiveSummary` filterLabels | `duplicate:'Dupes'` | `duplicate:'Dupes + Similar'` |
| `renderReviewEmptyState` filterLabels | `duplicate:'Dupes'` | `duplicate:'Dupes + Similar'` |
| `renderReviewFilterHelper` copy | `'Dupes includes confirmed duplicates and near-duplicate advisories.'` | `'Dupes + Similar includes confirmed duplicates and near-duplicate advisories.'` |
| `reviewEmptyText` duplicate entry | `'<p class="small">No duplicate-linked items in queue.</p>'` | `'<p class="small">No confirmed duplicates or similar advisories in this view.</p><p class="small review-first-note">Items flagged as confirmed duplicates or near-duplicate advisories appear here. Decide normally — Approve, Keep Pending, or Reject.</p>'` |
| `renderReviewAuditSummary` stat label | `{label:'Dupes',n:dups,cls:'similar'}` | `{label:'Dupes + Similar',n:dups,cls:'similar'}` |

### `scripts/hardening-smoke-test.mjs`

- Updated D-254A locked helper copy test (line ~20457): now checks `'Dupes + Similar includes confirmed duplicates and near-duplicate advisories.'`
- Added 26 new D-256B tests (section after D-254A block)
- Updated D-93B allowlist: added `2903 passed, 0 failed`

---

## What Did NOT Change

- Filter state key: `duplicate` (unchanged — `reviewStateFilter === 'duplicate'`)
- `applyReviewFilter` predicate: `duplicate_of || duplicateOf || near_duplicate_of || nearDuplicateOf` (unchanged)
- `~Similar` filter chip label: `~Similar` (unchanged)
- `~Similar` predicate: `near_duplicate_of` only (unchanged)
- Card badge: `<span class="badge b-similar">~similar</span>` on `near_duplicate_of` (unchanged)
- Card chip: `<span class="rc-chip rc-chip-dup">dup</span>` on `duplicate_of` (unchanged)
- `review-card-similar` CSS modifier on `near_duplicate_of` cards (unchanged)
- Inspect panel fields: `Duplicate Of`, `Similar claim (advisory)`, `~similar` advisory banner (unchanged)
- Action buttons: `Mark Duplicate...`, `Dismiss ~Similar`, `Use as duplicate target` (unchanged)
- Modals: `markDuplicateUI` title, `resolveSimilarUI` title (unchanged)
- Sort option: `~Similar first` (unchanged)
- `renderReviewFilterBar` help text for `duplicate` key (unchanged — `reviewFilterHelpText`)
- Worker, index.html, belief-drift-expansion.js (all unchanged)

---

## Predicate Guarantees (unchanged from D-256A audit)

```
// Dupes + Similar (key: 'duplicate') — UNCHANGED predicate
list.filter(i => !!(i.duplicate_of || i.duplicateOf || i.near_duplicate_of || i.nearDuplicateOf))

// ~Similar (key: 'similar') — UNCHANGED predicate
list.filter(i => !!i.near_duplicate_of)

// ~Similar ⊆ Dupes + Similar always
// (Dupes + Similar count) >= (~Similar count) always
```

---

## Test Results

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2903 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

New tests added: **26** (D-256B section in hardening-smoke-test.mjs)
Previous baseline: 2877. New baseline: 2903.

---

## Privacy / Public Boundary

- `renderPublicProfileHtml` does not reference `Dupes + Similar` or any duplicate filter copy
- No new public data fields
- D-216A allowlist unchanged
- `alignment_labels` not referenced (permanently blocked)
- `top_beliefs_json` not returned raw in public API path

---

## Drift/Belief Files Guarantee

- `public/belief-drift-expansion.js` not modified
- `public/index.html` not modified
- Neither file references `Dupes + Similar`

---

## Deploy

Owner must deploy `public/app-v10.js` via `wrangler deploy` for copy changes to go live. No backend/migration/schema/CSP/external asset changes required.

---

## Future Rule

Any future rename or split of the `Dupes + Similar` / `~Similar` filter labels must:

1. Keep all D-256B lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-256C (or higher) task documenting what changed and why.

Do not silently break a lock test.
