# D-257A — Review Duplicate/Similar Label Clarity Checkpoint Addendum

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 2903 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D257A_REVIEW_DUPLICATE_SIMILAR_LABEL_CLARITY_CHECKPOINT.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

This checkpoint addendum closes the D-256A/B/C duplicate/similar filter label clarity mini-arc and updates `docs/PROJECT_STATE.md` as the authoritative project reference. The arc delivered a copy-only label rename (`Dupes` → `Dupes + Similar`) to resolve D-250A F-4 MEDIUM moderator confusion, then locked it with 26 new tests and a live closeout. This task records the stable state so future sessions have a complete picture of what changed, what is locked, and what is safe to do next.

---

## D-256A/B/C Arc Summary

| Task | Type | What it did |
|------|------|-------------|
| D-256A | Audit | Full inventory of all `Dupes`/`~Similar` controls: filter chips, counts, helper copy, card badges, inspect panel fields, action buttons, modals; predicate analysis confirming `~Similar ⊆ Dupes` always; recommended D-256B rename; docs only |
| D-256B | Feature (copy) | Renamed visible combined filter label `Dupes` → `Dupes + Similar` in 6 copy locations; predicate/key/badge/panel/actions unchanged; 26 new tests; baseline 2877 → 2903 |
| D-256C | Live closeout | Owner deploy PASS; 35/35 live sanity checklist PASS |

**New tests in arc:** 26 (D-256B section, `hardening-smoke-test.mjs`)
**Baseline change:** 2877 → 2903
**Deploys:** 1 (D-256C — owner manual terminal deploy)
**D-256A, D-257A:** Docs only — no deploy needed

---

## Current Baseline

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2903 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**Known warn:** `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation).` Non-blocking.

---

## Deploy State

| Task | Deploy state |
|------|-------------|
| D-256A | Docs only — no deploy needed |
| D-256B | Owner deploy PASS — D-256C 35/35 live PASS |
| D-256C | Live closeout — no deploy needed |
| D-257A | Docs only — no deploy needed |
| **Current deploy needed** | **No** |

---

## Exact Label/Copy Changes (D-256B)

| Location | Before | After |
|----------|--------|-------|
| `renderReviewFilterBar` defs | `['duplicate','Dupes']` | `['duplicate','Dupes + Similar']` |
| `renderReviewActiveSummary` filterLabels | `duplicate:'Dupes'` | `duplicate:'Dupes + Similar'` |
| `renderReviewEmptyState` filterLabels | `duplicate:'Dupes'` | `duplicate:'Dupes + Similar'` |
| `renderReviewFilterHelper` helper copy | `Dupes includes confirmed duplicates and near-duplicate advisories.` | `Dupes + Similar includes confirmed duplicates and near-duplicate advisories.` |
| `reviewEmptyText` duplicate entry | `No duplicate-linked items in queue.` | `No confirmed duplicates or similar advisories in this view.` + context note |
| `renderReviewAuditSummary` stat label | `{label:'Dupes',...}` | `{label:'Dupes + Similar',...}` |

---

## Predicate Unchanged Guarantees

```
// Dupes + Similar (key: 'duplicate') — UNCHANGED predicate
list.filter(i => !!(i.duplicate_of || i.duplicateOf || i.near_duplicate_of || i.nearDuplicateOf))

// ~Similar (key: 'similar') — UNCHANGED predicate
list.filter(i => !!i.near_duplicate_of)

// ~Similar ⊆ Dupes + Similar always
// (Dupes + Similar count) >= (~Similar count) always
```

- Internal filter key `duplicate` unchanged
- No filter split: single combined chip `Dupes + Similar` retained
- `~Similar` filter chip label unchanged
- `~Similar` predicate unchanged: `near_duplicate_of` only
- `~Similar` remains advisory-only and a strict subset of `Dupes + Similar`

---

## What Did NOT Change

- Filter state key: `duplicate` (`reviewStateFilter === 'duplicate'`)
- `applyReviewFilter` logic
- Card badge `<span class="badge b-similar">~similar</span>` on `near_duplicate_of`
- Card chip `<span class="rc-chip rc-chip-dup">dup</span>` on `duplicate_of`
- `review-card-similar` CSS modifier
- Inspect panel fields: `Duplicate Of`, `Similar claim (advisory)`, `~similar` advisory banner
- Action buttons: `Mark Duplicate...`, `Dismiss ~Similar`, `Use as duplicate target`
- Modals: `markDuplicateUI` title, `resolveSimilarUI` title
- Sort option `~Similar first`
- `reviewFilterHelpText` for `duplicate` key
- All moderation routes and semantics
- Search/filter/sort pipeline behavior
- Next-item and inspect prev/next search-aware navigation

---

## Search-Aware Navigation Guarantee (unchanged from D-253/D-254)

- Search-aware pipeline: `applyReviewSort(applyReviewSearch(applyReviewFilter(all)))`
- `reviewDecisionUI` next-item candidate uses this pipeline
- `renderReviewInspectPanel` prev/next uses this pipeline
- Search works with `Dupes + Similar` filter (confirmed D-256C live sanity item 21)
- Clear search: sets `reviewSearchQuery = ''` only; preserves filter and sort
- Show all review items: resets filter to All only; preserves sort and search

---

## Public/Privacy Guarantees

- `renderPublicProfileHtml` does not reference `Dupes + Similar` or any duplicate/similar filter copy
- Duplicate/similar filter controls remain internal/admin Review UI only
- No new public data fields introduced
- D-216A allowlist unchanged
- `alignment_labels` not referenced (permanently blocked)
- `top_beliefs_json` not returned raw in public API path

---

## Drift/Belief Files Guarantee

- `public/belief-drift-expansion.js` not modified by D-256A/B/C
- `public/index.html` not modified by D-256A/B/C
- Neither file references `Dupes + Similar`

---

## No Backend/API Changes Guarantee

- No new routes in `worker.js`
- No migration, schema, CSP, or external asset changes
- No `/api/review/duplicate` or similar new route
- All predicate evaluation is client-side against already-loaded `reviewQueue.review` data

---

## Safe Next Lanes

These are suggestions only. Do not start any until explicitly assigned.

| Lane | Notes |
|------|-------|
| Review queue mobile controls/action wrapping polish | Filter bar and action buttons on narrow viewports |
| Study entry button style consistency | D-239A F-2–F-4: button prominence, browser-back support, style inconsistency |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, framing between main app and Belief Engine |
| D-245A F-4 pressure handle duplication | Separate spec — pressure cards show handle in both chips and meta |

---

## Future Rule

Any future rename or split of the `Dupes + Similar` / `~Similar` filter labels must:

1. Keep all D-256B lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-256C+ task documenting what changed and why.

Do not silently break or remove a lock test.
