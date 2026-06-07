# D-87B: Admin Review Queue — Triage Signal Improvements — Result

Date: 2026-06-07
Step: D-87B — frontend-only admin review queue ergonomics improvement
Type: Frontend code change. Direct-main commit.
No backend/Worker changes. No D1. No Wrangler. No new API routes. No moderation actions.

---

## 1. Files Changed

| File | Change type |
|------|------------|
| `public/app-v10.js` | JS additions — new helper, extended detection, new chips, new filters, extended audit summary, inspect panel field |
| `public/index.html` | CSS additions — 10 new rules for chip styling |

No other files touched.

---

## 2. Changes Made

### 2a. New helper: `reviewItemOriginLabel(item)` (added before `isSuspectedTestArtefact`)

Classifies each review item by handle/id pattern:

| Return value | Trigger condition |
|---|---|
| `demo-seed` | `id` starts with `clm_seed_` OR `handle === 'humanx-seed'` |
| `hx-seed` | `id` starts with `HX-` OR `handle === 'anon-o_seed'` |
| `test-account` | `handle` is `anon-xksavy`, `anon-73d9y2`, or `anon-ek3562` |
| `user` | any other non-empty handle |
| `null` | no handle |

### 2b. Extended: `isSuspectedTestArtefact(item)`

Added handle and id-pattern checks **before** the existing text keyword scan:

```
handles: humanx-seed, anon-o_seed, anon-xksavy, anon-73d9y2, anon-ek3562
id patterns: /^clm_seed_/, /^HX-/i
```

Existing `smoke` / `\btest\b` / `automated write` / `automated smoke` keyword logic unchanged and still runs as fallback.

**Effect on current queue:** All 9 demo/test items (4 demo seeds, 2 HX seed rows, 3 test-account handles) now register as suspected artefacts. The `~Smoke/Test` audit stat and "Archive test artefact" button (shown in inspect panel when `state === 'rejected'`) now correctly reflect these items.

### 2c. Review card — new metadata chips row

A `<div class="review-card-chips">` row is inserted between the badge head and the claim title when any chip is non-empty:

| Chip | Class | Shown when |
|------|-------|-----------|
| Origin label | `rc-chip-origin-demoseed` / `rc-chip-origin-hxseed` / `rc-chip-origin-testaccount` | origin ≠ `user` and ≠ null |
| Handle | `rc-chip-handle` | `item.handle` is set |
| `dup` | `rc-chip-dup` | `duplicate_of` or `duplicateOf` is set |
| `🔒` | `rc-chip-locked` | `status_locked` or `statusLocked` is true |

### 2d. Inspect panel — new fields

After the existing `Duplicate Of` field, two new rows added for claim items:

- **Status Lock** — `<span class="badge b-locked">🔒 Score locked</span>` — shown if `status_locked` or `statusLocked` is truthy
- **Origin** — `<span class="rc-chip rc-chip-origin-*">…</span>` — shown if origin is not `user`

### 2e. New filter chips

Two new chips added to `renderReviewFilterBar` (after `~Quality`, before `All`):

| Filter key | Label | Logic |
|---|---|---|
| `duplicate` | `Dupes` | items with any of: `duplicate_of`, `duplicateOf`, `near_duplicate_of`, `nearDuplicateOf` |
| `demo-test` | `Demo/Test` | items where `isSuspectedTestArtefact(item)` returns true |

`applyReviewFilter`, `reviewFilterHelpText`, and `reviewEmptyText` all updated to handle the two new keys.

### 2f. Audit summary — new stat cells

`renderReviewAuditSummary` now shows:

- **Demo/Test** (was `~Smoke/Test`) — count of `isSuspectedTestArtefact` items (extended detection)
- **Dupes** — count of items with any duplicate relationship

Both visible in the collapsible "▸ Audit Summary" panel.

### 2g. CSS additions (index.html)

```css
.review-card-chips        — flex row, wrapping, 4px gap
.rc-chip                  — base chip style (monospace, small, rounded)
.rc-chip-handle           — dark background, muted text
.rc-chip-dup              — amber/gold, bold — signals dedup needed
.rc-chip-locked           — amber — signals score is frozen
.rc-chip-origin-demoseed  — purple — humanx-seed / clm_seed_*
.rc-chip-origin-hxseed    — green  — anon-o_seed / HX-*
.rc-chip-origin-testaccount — red  — anon-xksavy / anon-73d9y2 / anon-ek3562
.b-locked                 — amber badge for inspect panel
```

---

## 3. What is NOT changed

| Item | Status |
|------|--------|
| Existing filter chips (Pending/Public/Rejected/Reported/~Similar/~Quality/All) | Unchanged ✅ |
| Moderation decision behaviour (Approve/Keep/Reject) | Unchanged ✅ |
| Archive behaviour and `reviewCleanupUI` | Unchanged ✅ |
| Any API route | Unchanged ✅ |
| Worker / `src/worker.js` | Unchanged ✅ |
| D1 / database | Unchanged ✅ |
| Admin token handling | Unchanged ✅ |
| Batch moderation | Not added ✅ |

---

## 4. Static Checks

| Script | Expected | Actual | Pass |
|--------|----------|--------|------|
| `node --check public/app-v10.js` | exit 0 | exit 0 | ✅ |
| `hardening-smoke-test.mjs` | 127 passed | 127 passed | ✅ |
| `belief-engine-static-check.mjs` | 24 passed | 24 passed | ✅ |
| `worker-route-static-check.mjs` | 39 passed | 39 passed | ✅ |

---

## 5. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| No backend/Worker changes | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| No new API routes | ✅ |
| No moderation actions | ✅ |
| No batch moderation | ✅ |
| No archive behaviour added | ✅ |
| Admin token not printed or committed | ✅ |

---

## D-87B Completion Record

| Item | Status |
|------|--------|
| `reviewItemOriginLabel` added | ✅ |
| `isSuspectedTestArtefact` extended | ✅ |
| Card chips row added to `reviewCard` | ✅ |
| `statusLocked` + `Origin` added to inspect panel | ✅ |
| `duplicate` + `demo-test` filter chips added | ✅ |
| `applyReviewFilter` handles new keys | ✅ |
| `reviewFilterHelpText` handles new keys | ✅ |
| `reviewEmptyText` handles new keys | ✅ |
| `renderReviewAuditSummary` — Demo/Test + Dupes stats | ✅ |
| CSS rules added to `public/index.html` | ✅ |
| Static checks 127/24/39 | ✅ |
| No backend/D1/Wrangler/moderation | ✅ |
| docs/D87B result doc written | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Committed and pushed to main | ✅ |
