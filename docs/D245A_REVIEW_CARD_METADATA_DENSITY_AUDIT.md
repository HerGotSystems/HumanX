# D-245A — Review Card Metadata Density Audit

**Scope:** Docs only
**Status:** COMPLETE
**Baseline:** 2638 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D245A_REVIEW_CARD_METADATA_DENSITY_AUDIT.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Audit the current Review queue card layout — every badge, chip, row, and class — before making any UI changes. Identify which metadata helps long-queue scanning, which is redundant or too dense, and what the safest small frontend-only improvement should be.

Prior art: D-227A (Review Queue Scanability Audit, `docs/D227A_REVIEW_QUEUE_SCANABILITY_AUDIT.md`) covered overall queue structure at a high level. This audit zooms in on the **card** itself.

---

## 1. Current Card Structure

The `reviewCard(item)` function (`public/app-v10.js` line 411) returns an `<article>` with this fixed layer order:

```
<article class="card review-card review-card-compact {stateClass}{similarClass}{pressureClass}{truthClass}{selectedClass}{rejectPendingClass}{approvePendingClass}"
         data-review-id="{id}"
         [data-review-selected="true"]
         [data-review-confirming="reject|approve"]>

  [Row A] .review-card-head   — badge strip
  [Row B] .review-card-chips  — identity/provenance chips (conditional)
  [Row C] .review-reason-tag  — latest report reason (conditional)
  [Row D] h3.review-card-title — claim/title text
  [Row E] p.review-card-meta  — category · status/origin · score summary
  [Row F] p.review-card-date  — "Updated {age}"
  [Row G] .review-actions     — Inspect / Approve / Keep Pending / Reject

</article>
```

**When a card is selected:**
- `data-review-selected="true"` + `.review-card-selected` class applied
- Approve / Keep Pending / Reject buttons are **hidden from the card** (action row shows only Inspect toggle)
- All moderation actions move to the full-width `.review-inspect-panel` above the grid

**When a confirm is armed:**
- `data-review-confirming="reject"` or `"approve"` attribute applied
- Corresponding `.review-card-reject-pending` or `.review-card-approve-pending` class applied
- Card action row replaced by confirm/cancel button pair + confirmation copy

---

## 2. Metadata / Chip Inventory

### Row A — `.review-card-head` (badge strip)

Up to **9 badges** rendered in one `flex-wrap` row:

| Badge | Class | Condition | Scan value |
|-------|-------|-----------|------------|
| Type | `badge b-blue/purple/orange/yellow` | Always | **Scan-critical** — claim / truth / evidence / pressure |
| State | `badge b-green/b-red/b-yellow` | Always | **Scan-critical** — public / rejected / review |
| Report count | `badge b-red` ⚑ | `report_count > 0` | **Useful** — immediate attention signal |
| ~similar | `badge b-similar` | `near_duplicate_of` set | **Useful** — fuzzy duplicate advisory |
| needs sharpening | `badge b-quality` | `claimQualityHints` returns hints | **Useful** but subtle (`#c4a460` low-contrast gold) |
| truth-derived | `badge b-truth-derived` | `isTruthDerivedClaim(item)` | **Useful** for truth-derived claim type |
| category-echo | `badge b-category-echo` | `isTruthDerivedClaim && isClaimCategoryEcho` | **Advisory only** — adds noise if truth-derived already shown |
| ? borderline origin | `badge b-borderline-origin` | `isLikelyBorderlineDerivedClaim` | **Advisory only** — lowest contrast, opacity 0.85, heuristic label |
| Builder / Builder* | `.rc-builder-chip badge b-blue / badge` | `claimBuilderContext` or initial evidence | **Useful** for provenance tracking |

All 9 can co-appear on a single claim card. Typical pending claim in production shows 2–4 badges (type + state + optional report + optional quality).

### Row B — `.review-card-chips` (identity/provenance chips)

Rendered only when at least one chip applies. Up to 4 chips in one `flex-wrap` row:

| Chip | Class | Condition | Scan value |
|------|-------|-----------|------------|
| Origin label | `.rc-chip rc-chip-origin rc-chip-origin-{name}` | origin is not `'user'` | **Useful** — distinguishes demo-seed / hx-seed / test-account |
| Handle | `.rc-chip rc-chip-handle` | `item.handle` set | **Useful** — shows submitter identity (monospace, muted) |
| dup | `.rc-chip rc-chip-dup` | `duplicate_of` set | **Useful** but see friction §3 F-7 |
| 🔒 locked | `.rc-chip rc-chip-locked` | `status_locked` set | **Useful** — rare, advisory |

### Row C — `.review-reason-tag`

`<p class="small review-reason-tag">Reason: {latest_report_reason}</p>`

- Rendered only when `item.latest_report_reason` is set
- Truncated to single line (`text-overflow:ellipsis; max-width:100%`)
- **Scan value:** Useful for reported items — but the full text may be cut; full reason is in inspect panel

### Row D — `h3.review-card-title`

`font-size:12px; font-weight:600; line-height:1.3`

- The highest semantic element on the card
- **Scan-critical** — the main content to read

### Row E — `p.small.review-card-meta` (meta line)

Content varies by item type:

| Type | metaParts content |
|------|-------------------|
| claim | `category · status · ev:{N} ts:{N} sv:{N}` |
| truth | `category · origin · rep ×{N}` |
| evidence | `stance · quality` |
| pressure | `severity {N}/5 · by {handle} · {parent_claim[:60]}` |

- **category**: useful for triage
- **status** (claim): informational, rarely changes scan order
- **origin** (truth): useful for truth provenance
- **ev/ts/sv score triplet** (claim): dense abbreviation, values are 0-100 integers or `-`; meaningful only if you know the scoring model
- **rep ×N** (truth): useful for truth repetition frequency
- **stance/quality** (evidence): useful
- **severity/handle/parent** (pressure): useful but parent_claim at 60 chars doubles the row height

### Row F — `p.small.review-card-date`

`"Updated {reviewAge(timestamp)}"`

- **Useful** for triage (age-based sort supplement)
- Currently occupies its own `<p>` row with `margin-bottom:5px`

### Row G — `.review-actions` (action row)

`display:flex; gap:6px; flex-wrap:wrap; margin-top:8px`

| Button | Class | Flex behaviour |
|--------|-------|---------------|
| Inspect | `.btn-inspect` | `flex:0; margin-right:auto` — left-anchored, never stretches |
| Approve | `.btn-approve` | `flex:1; min-width:90px` |
| Keep Pending | `.btn-keep` | `flex:1; min-width:90px` |
| Reject | `.btn-reject` | `flex:1; min-width:90px` |

At narrow widths (< ~370px), 3 × `min-width:90px` + left-anchored Inspect = minimum ~290px for the action row. `flex-wrap:wrap` mitigates stacking, but visual order is Inspect / Approve / Keep Pending / Reject which is correct priority order.

---

## 3. Scanability Friction Findings

### F-1 (HIGH) — Head row can carry up to 9 badges simultaneously

**Code:** Row A badge list above.

A single claim card with Builder context, quality hints, truth-derived, category-echo, borderline-origin warning, a report, and a similarity advisory will render all 9 badges in a single `flex-wrap` row. In practice, 3–5 is the common case, but the visual ceiling is extremely high. When 7–9 are present, the head row wraps to 2–3 visual lines, pushing the title (`h3`) significantly down — the most scan-critical content ends up below the fold on a compact card.

**Two advisory badges are the main culprits:**
- `? borderline origin`: heuristic (`isLikelyBorderlineDerivedClaim`), low contrast (opacity 0.85, `#c8a000`), informs no immediate action — full context only available in inspect panel anyway.
- `category-echo`: only meaningful in conjunction with `truth-derived`; its tooltip text is only readable in the inspect panel.

### F-2 (MEDIUM) — Score triplet on meta line is dense abbreviation

**Code:** `scoreHint = \`ev:${item.evidence_score??0} ts:${item.testability??'-'} sv:${item.survivability??'-'}\`` for claims.

`ev:0 ts:- sv:-` means nothing to a moderator scanning fast. The full scoring semantics are explained in the inspect panel. On the card, the triplet takes up roughly half the meta line but conveys less information than the single-word category to its left. It is more accurately an inspect-level detail than a card-level scan aid.

### F-3 (MEDIUM) — Date is its own full row, not inline

**Code:** `<p class="small review-card-date">Updated ${esc(updated)}</p>` has `margin-bottom:5px`.

The date is useful but not important enough to occupy an entire row. On compact cards, it adds 18–20px of height per card. Inlining it with the meta line (e.g. `category · status · Updated {age}`) would collapse the card by one row without losing any information.

### F-4 (MEDIUM) — Pressure items duplicate handle

**Code:** Pressure `metaParts` includes `item.handle?'by '+item.handle:null`. However, `handleChip` in Row B also renders `item.handle` if set. A pressure card with a handle shows it in both the chips row and the meta line.

### F-5 (LOW) — `category-echo` badge only meaningful alongside `truth-derived`

**Code:**
```js
${isTruthDerivedClaim(item)&&isClaimCategoryEcho(item)?`<span class="badge b-category-echo" ...>category-echo</span>`:''}
```

The condition correctly requires `isTruthDerivedClaim`, so they always co-appear. But visually, two consecutive amber-ish advisory badges (`truth-derived` cyan + `category-echo` amber) are easily misread as one. The tooltip copy (`"Category echoes claim text — do not approve without checking parent Truth"`) is only readable on hover/inspect.

### F-6 (LOW) — `dup` chip and `~similar` badge are semantically different but adjacent

- `dupChip` (`.rc-chip-dup`): `duplicate_of` — exact duplicate marked by admin
- `~similar` (`.b-similar`): `near_duplicate_of` — fuzzy match, advisory

Both appear in adjacent rows (B and A respectively). Their visual styles are both amber/yellow and may be conflated at a glance. The distinction matters for moderation: an exact dup should be rejected; a `~similar` item still needs independent review.

### F-7 (LOW) — State communicated twice: badge + border-left colour

Card border-left colour (`review-card-pending/public/rejected`) and state badge (`b-yellow/green/red`) always communicate the same state. This redundancy is intentional for scanability and accessibility (not colour-alone signalling), but adds one visual element to the head row.

---

## 4. Safe Next Improvements

All recommended slices are **frontend-only** (HTML template + CSS). No data, API, or moderation semantics change.

### D-245B — Compact meta row (priority: HIGH)

Move `review-card-date` content inline with `review-card-meta`, eliminating the dedicated date row. This collapses cards by one row (~20px per card), which in a 20-item queue saves 400px of total scroll height.

**Change:** In `reviewCard`, append ` · Updated {age}` to `metaParts` and remove the standalone `<p class="review-card-date">` element. Update `.review-card-date` CSS to remove margin.

**Risk:** None — date is still shown, just inline. No data removed. D-231A / D-243A regression tests must still pass.

### D-246A — Move advisory-only badges to inspect panel (priority: MEDIUM)

Remove `? borderline origin` and `category-echo` badges from the card head row. Both are heuristic advisories with low-contrast presentation that require the inspect panel for context anyway. Their tooltip text is currently only usable on hover; in the inspect panel they can be shown with full explanatory copy.

**Change:** JS logic change only — remove the two `badge` spans from `reviewCard` head row. Keep them in `renderReviewInspectPanel`. Update D-246A regression lock accordingly.

**Risk:** Low — both are heuristic labels with no moderation semantics. Moderators already need to inspect before acting on these signals.

### D-247A — Suppress score triplet on card; show in inspect panel (priority: MEDIUM)

Replace `ev:{N} ts:{N} sv:{N}` in `review-card-meta` with a simpler composite such as the existing `item.quality` string or just `category · Updated {age}` after D-245B. Full score breakdown remains in the inspect panel.

**Change:** JS change to `scoreHint` assignment in `reviewCard`. No data removed; inspect panel already shows scores in detail.

**Risk:** Low — score triplet is useful only in inspect context; all values are visible in the panel.

### D-248A — Pressure handle deduplication (priority: LOW)

For pressure items: remove `'by ' + item.handle` from `metaParts` when `handleChip` will already render it.

**Change:** Single condition in `reviewCard` `metaParts` construction for pressure type.

**Risk:** Trivial — no data removed, only display deduplication.

### D-249A — Review card metadata regression lock

After any of the above, lock:
- All scan-critical metadata still present on card (type, state, report count)
- Selected/confirm states remain (data attrs + classes)
- Duplicate/similar advisory remains visible (chip or badge)
- Action buttons remain accessible
- Public profile does not expose any review card internals

**Preferred first implementation: D-245B** — CSS + minimal JS change, no data removed, no logic change, immediate visual benefit (compact cards in long queues), fully reversible.

---

## 5. Risk Boundaries

The following are confirmed unchanged by this audit (docs-only task):

- No moderation semantics change
- No duplicate/advisory semantics change
- No backend/API route changes
- No public profile exposure
- No Drift/Belief expansion changes
- No review filter/sort behavior changes
- No decision feedback/next-item behavior changes (D-242/D-243 arc)
- No Study navigation behavior changes (D-239/D-240 arc)
- No src/worker.js changes
- No public/belief-drift-expansion.js or public/index.html changes

---

## 6. Future Test Recommendations

For regression locks on future card changes:

| Test category | What to lock |
|---------------|-------------|
| Scan-critical metadata | `reviewCard` emits type badge, state badge, title h3 |
| Report signal | `b-red` report badge emitted when `report_count > 0` |
| Selected state | `data-review-selected="true"` and `review-card-selected` present |
| Confirm state | `data-review-confirming` attribute present when armed |
| Duplicate/similar | `rc-chip-dup` or `b-similar` badge remains present |
| Action accessibility | Inspect / Approve / Keep Pending / Reject buttons all present on non-selected card |
| Public exclusion | `renderPublicProfileHtml` must not contain `rc-chip`, `review-card`, `review-actions`, or badge row content |
| No backend/API | `reviewCard` must not call `fetch` or `api()` |

---

## Code Reference

| Function / selector | Location |
|--------------------|---------|
| `reviewCard(item)` | `public/app-v10.js` line 411 |
| `renderReviewList()` | `public/app-v10.js` line 410 |
| `renderReviewInspectPanel()` | `public/app-v10.js` ~line 425 |
| `.review-card-head` | `public/styles.css` line 162 |
| `.review-card-chips` | `public/styles.css` line 612 |
| `.rc-chip` | `public/styles.css` line 614 |
| `.review-actions` | `public/styles.css` line 223 |
| `.b-similar / .b-quality / .b-truth-derived / .b-category-echo / .b-borderline-origin` | `public/styles.css` lines 394–398 |
| `.review-card-selected` | `public/styles.css` line 285 |
| `.review-card-reject-pending / -approve-pending` | `public/styles.css` lines 235, 246 |
