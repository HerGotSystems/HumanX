# D-129G — Admin Review Ergonomics Deploy Checkpoint

**Date:** 2026-06-15
**Chain:** D-129A → D-129B → D-129C → D-129D → D-129E → D-129F → D-129G (this doc)
**Scope:** Frontend / Admin UX only. No backend route changes. No D1 schema or migration changes.

---

## Summary of the D-129 Chain

### D-129A — Inspector anchor + duplicate action suppression
After a moderation action (Approve / Keep Pending / Reject / Mark Duplicate) the page no longer jumps to the top. A `scrollToReviewAnchor(id)` helper captures the inspected item ID before the async API call, then scrolls back to it after re-render using a fallback chain (`.review-inspect-panel` → `[data-review-id]` → `.review-card`). Cards get `data-review-id` attributes for lookup. When a card is open in the inspect panel, its duplicate Approve/Keep/Reject buttons are suppressed — controls exist only in the inspector panel for the selected item.

### D-129B — Remove duplicate top action row from inspector
The inspect panel previously had two action rows (top and bottom). The top row (`review-inspect-top-actions`) was removed; only the single bottom `review-inspect-actions` row remains. Panel gets `review-inspect-compact` marker class.

### D-129C — Item-specific right context panel
When no item is inspected the right `#casefile` panel shows the existing generic help text. When an item is inspected a new `renderReviewInspectContext(item)` function renders compact item-specific data: scores (ev/ts/sv or repetition), category, stance/severity, report count, created/updated dates, and structured or legacy Claim Builder context. No action buttons in the right panel — it is a decision-aid only.

### D-129D — Compact inspector density pass
CSS-only tightening across ~16 rules: reduced padding in `.review-inspect-panel`, `.review-inspect-state-bar`, `.review-inspect-fields`, `.review-inspect-field`, `.review-inspect-actions`, `.review-inspect-quality`, `.review-similar-note`, `.review-builder-context`; smaller `minmax` for the fields grid; tighter font sizes. No JS logic changed.

### D-129E — Compact queue card density + score/builder scan
Queue cards (`reviewCard`):
- `scoreHint` for claims now shows `ev:N ts:N sv:N` instead of generic `score N`
- Builder context chip (`rc-builder-chip`) added to card head: blue `Builder` badge for structured context, plain `Builder*` for legacy
- Article gets `review-card-compact` class
CSS: tighter `.review-card-head`, `.review-card-title`, `.review-card-date`, `.review-card-chips`; new `.rc-builder-chip`; desktop density block updated.

### D-129F — Compact filter bar + always-visible queue overview strip
- `renderReviewFilterBar` gets `review-filter-compact` marker class
- New `renderReviewOverviewStrip(all)` renders an always-visible inline pill row between the filter chips and the audit summary showing **pending / public / rejected** state counts and **claims / truths / ev / pressure** type breakdown — all derived client-side from the already-loaded `reviewQueue.review` array; zero extra backend calls
- CSS: compact `.review-header` (padding 12→8px), `.review-admin-bar` (10→7px), `.review-filter-chip` (6px 11px→4px 9px, 11→10px font); new `.review-overview-strip`, `.rov-pill`, `.rov-pending`, `.rov-pub`, `.rov-rej`, `.rov-pressure`, `.rov-sep` rules

---

## Files Touched Across D-129 Chain

| File | Changes |
|------|---------|
| `public/app-v10.js` | `scrollToReviewAnchor`, `reviewDecisionUI`, `markDuplicateUI`, `reviewCard`, `renderReviewInspectPanel`, `renderReviewInspectContext`, `renderReviewList`, `renderReviewFilterBar`, `renderReviewOverviewStrip` |
| `public/styles.css` | Inspector density rules, card density rules, filter chip compact rules, `rctx-*` context panel rules, `rc-builder-chip`, `rov-*` overview strip rules |
| `scripts/hardening-smoke-test.mjs` | Sections 40–45 added (D-129A through D-129F); one D-129A slice size fixed dynamically |

**No changes to:** `src/worker.js`, `src/claim-builder-contexts.js`, any Worker module, D1 schema, migrations, public pages, or any backend route.

---

## Final Test Baseline

All checks run against commit on branch `fix/d129f-review-filter-overview` (and D-129G docs commit).

```
node --check public/app-v10.js          → SYNTAX OK
node scripts/hardening-smoke-test.mjs   → 479 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed
```

---

## Owner Smoke Checklist

Run after `npx wrangler deploy`. Check each item in a real browser session.

- [ ] Open production site — public pages load normally
  - https://humanx.rinkimirikata.com
  - https://humanx.veltrusky-michal.workers.dev
- [ ] Navigate to Admin Review tab, enter token → queue loads
- [ ] Confirm the **filter/overview strip** is visible below the filter chips showing pending/public/rejected counts and type breakdown
- [ ] Filter chips (Pending / Public / Rejected / All etc.) still switch queue view correctly
- [ ] Sort select (Newest / Oldest / Reported etc.) still works
- [ ] Open an item with **Inspect** — right context panel (`#casefile`) updates with item-specific scores, dates, and builder context
- [ ] Close inspect — right context panel returns to generic help text
- [ ] Inspector has **one** action row at the bottom (no duplicate top row)
- [ ] Inspected card in the queue **does not** show duplicate Approve/Keep/Reject buttons
- [ ] Non-inspected cards **do** show card-level action buttons
- [ ] Click **Approve** (or Keep / Reject) on an inspected item:
  - Queue refreshes
  - Page does **not** jump to top — stays near the moderated card
- [ ] Queue cards show `ev:N ts:N sv:N` score breakdown for claim-type items
- [ ] Builder context chip (`Builder` or `Builder*`) visible on cards that have it
- [ ] Inspect a Builder item — right context panel shows structured or legacy builder context section
- [ ] Open a public claim page → loads correctly, no regressions
- [ ] Open a public study/truth page → loads correctly, no regressions
- [ ] Mobile view: filter chips wrap cleanly, cards readable

---

## Deploy Command

```
npx wrangler deploy
```

No D1 migration required — no schema changes in D-129.

---

## Production URLs

- https://humanx.rinkimirikata.com
- https://humanx.veltrusky-michal.workers.dev

---

## What Was NOT Changed in D-129

- No backend Worker route added, modified, or removed
- No D1 schema change
- No migration file created or applied
- No public-facing page behavior changed
- No scoring logic changed
- No auth/token logic changed
