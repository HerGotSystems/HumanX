# D-266A — Study Entry / Back Button Style Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3075 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D266A_STUDY_ENTRY_BACK_BUTTON_STYLE_REGRESSION_LOCK.md`, `docs/README.md`
**CSS changes:** None
**App changes:** None (`public/app-v10.js` not touched)
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Locks the D-265A/B/C Study entry / Back-to-Review style consistency patch so future CSS or UI work cannot accidentally:

- Reintroduce the `primary btn-study-review` false hierarchy in the inspect panel
- Remove the `btn-back-study` class or Back button styling
- Revert the linked-claim Study label back to a raw claim ID
- Remove the `btn-link-small` class from the evidence card Study button
- Break Back-to-Review scroll restoration
- Break Review-to-Study navigation context preservation

This is tests-only. No UI changes.

---

## D-265A / D-265B / D-265C Summary

| Task | Type | What it did |
|------|------|-------------|
| D-265A | Audit | Full Study entry / Back button inventory (14 controls). 8 friction findings: F-1 HIGH (inspect panel false hierarchy — `primary` on claim Study only), F-2 HIGH (all 5 Back buttons unstyled), F-3–F-6 MEDIUM (icon inconsistency, evidenceCard classless, advisory field appearance, raw ID label), F-7–F-8 LOW. Docs only. |
| D-265B | CSS/copy polish | 4 targeted changes: (1) removed `primary` from inspect panel claim Study; (2) changed linked claim field label `{claimId} ↗` → `Study linked claim ↗`; (3) added `btn-link-small` + `↗` to evidence card Study button; (4) added `btn-back-study` class to all 5 Back buttons + `.btn-back-study` CSS rule. 24 lock tests. |
| D-265C | Live closeout | Owner deploy PASS (2026-07-01). 39/39 live sanity PASS. |

---

## What Is Now Locked

### Inspect Panel Study Hierarchy

- `btn-study-review` class emitted by `renderReviewInspectPanel` for all Study button variants.
- `primary btn-study-review` combination must not be reintroduced in the inspect panel.
- `Open Study View ↗` label locked (claim items).
- `Study Parent Claim ↗` label locked (evidence/pressure items).
- `Study Linked Claim ↗` label locked (truth items, inspect panel Study button).

### Linked-Claim Study Label

- `Study linked claim ↗` is the locked label for the linked claim field Study button in the inspect panel truth branch (when linked claim is public).
- Raw-ID-heavy label (`{claimId} ↗` as button text) must not be reintroduced.
- `btn-link-small` class used for linked claim Study button.
- `openReviewClaimStudy(linked)` is the locked handler.
- Non-public linked claim path still shows `review-inspect-id` code element — ID remains accessible.

### Evidence Card Study Button

- `btn-link-small` class on the evidence card Study button.
- `Study Linked Claim ↗` label (with `↗` icon).
- `studyFromVault` handler unchanged.
- Vault group header Study button also uses `btn-link-small` (parity maintained).

### Back-to-Review Style

- All 5 Back navigation buttons use `class="btn-back-study"`.
- `.btn-back-study` CSS rule exists in `public/styles.css`.
- `.btn-back-study` uses calm secondary styling (`rgba(255,255,255,.06)` fill, `rgba(255,255,255,.12)` border, `var(--muted)` text) — not destructive red.
- `← Back to Review`, `← Back to Vault`, `← Back to My HumanX` copy variants locked.
- `data-action="backToArena"` wires all Back buttons.

### Back-to-Review Behavior

- `backToArena()` function unchanged.
- Scroll restoration via `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` intact.
- `lastModeBeforeStudy` state referenced in `renderStudy`.
- Review search/filter/sort context preserved on return from Study.

---

## Exact Copy / Classes Locked

| Element | Class | Label | Handler | Lock |
|---------|-------|-------|---------|------|
| Inspect panel claim Study | `btn-study-review` | `Open Study View ↗` | `openReviewClaimStudy(id)` | D-266A test 1–3 |
| Inspect panel evidence/pressure Study | `btn-study-review` | `Study Parent Claim ↗` | `openReviewClaimStudy(claim_id)` | D-266A test 4 |
| Inspect panel truth Study | `btn-study-review` | `Study Linked Claim ↗` | `openReviewClaimStudy(linked_id)` | D-266A test 5 |
| Linked claim field (truth, public) | `btn-link-small` | `Study linked claim ↗` | `openReviewClaimStudy(linked)` | D-266A tests 6–8 |
| Evidence card Study | `btn-link-small` | `Study Linked Claim ↗` | `studyFromVault(claimId)` | D-266A tests 10–12 |
| Vault group header Study | `btn-link-small` | `Study claim ↗` | `studyFromVault(claimId)` | D-266A test 13 |
| All 5 Back buttons | `btn-back-study` | `← Back to {origin}` | `backToArena()` | D-266A tests 14, 17–20 |

---

## Behavior Guarantees Preserved

| Guarantee | D-266A test |
|-----------|------------|
| `openReviewClaimStudy` still defined | test 22 |
| `studyFromVault` still defined | test 23 |
| `backToArena` scroll restore — RAF + `scrollToReviewAnchor` | test 21 |
| Search pipeline `applyReviewSort(applyReviewSearch(applyReviewFilter(` | test 24 |
| Search-aware inspect prev/next | test 25 |
| `lastModeBeforeStudy` referenced in `renderStudy` | test 26 |
| `requestApproveReview` + `requestRejectReview` in inspect panel | test 33 |
| `markDuplicateUI` + `resolveSimilarUI` in inspect panel | test 34 |

---

## Cross-Arc Compatibility Preserved

| D-arc | Guarantee | D-266A test |
|-------|-----------|------------|
| D-245B | `review-card-meta` inline date unchanged | test 27 |
| D-246A | `Evidence · Test · Survive` score label format unchanged | test 28 |
| D-256 | `Dupes + Similar` filter label unchanged | test 29 |
| D-258B | `.review-sort-bar` CSS present | test 30 |
| D-258B | `.review-decision-feedback` flex-wrap present | test 31 |
| D-261B | `.review-inspect-actions .btn-study-review{margin-left:auto}` preserved | test 32 |
| D-261B/D-262A | Moderation actions (Approve/Keep/Reject) unchanged | test 33 |
| D-237A/D-262A | Duplicate/advisory semantics unchanged | test 34 |

---

## Public / Privacy Guarantees

- `btn-back-study` confirmed absent from `renderPublicProfileHtml` — D-266A test 35.
- `openReviewClaimStudy` confirmed absent from `renderPublicProfileHtml` — D-266A test 36.
- Review/Study admin controls remain entirely internal — no public profile exposure.
- `PUBLIC_PROFILE_ALLOWED_MARKERS` contract unchanged.
- D-216A denylist unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` not modified by D-265B, D-265C, or D-266A. Confirmed by D-266A test 37.

---

## Worker Known-Warning State

`worker-route-static-check.mjs`: `57 passed, 0 failed / 1 known warn`

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Tests Added (40 new — scripts/hardening-smoke-test.mjs)

New baseline: `3075 passed, 0 failed` (was 3035).

### Category 1 — Inspect panel Study hierarchy lock (5 tests)

| # | Test |
|---|------|
| 1 | `renderReviewInspectPanel` emits `btn-study-review` |
| 2 | `primary btn-study-review` false hierarchy not reintroduced |
| 3 | `Open Study View ↗` label present |
| 4 | `Study Parent Claim ↗` label locked |
| 5 | `Study Linked Claim ↗` label locked (inspect panel truth Study button) |

### Category 2 — Linked-claim Study label lock (4 tests)

| # | Test |
|---|------|
| 6 | `Study linked claim ↗` exact label present in linked claim field |
| 7 | Linked claim Study action calls `openReviewClaimStudy(linked)` |
| 8 | Linked claim Study button uses `btn-link-small` |
| 9 | Non-public linked claim path shows `review-inspect-id` code element |

### Category 3 — Evidence card Study button lock (4 tests)

| # | Test |
|---|------|
| 10 | `evidenceCard` Study button uses `btn-link-small` |
| 11 | `evidenceCard` Study button includes `↗` icon |
| 12 | `evidenceCard` Study behavior calls `studyFromVault` |
| 13 | Vault group header Study button uses `btn-link-small` (parity with evidenceCard) |

### Category 4 — Back-to-Review style lock (7 tests)

| # | Test |
|---|------|
| 14 | `renderStudy` emits `btn-back-study` class |
| 15 | `.btn-back-study` CSS rule present in `styles.css` |
| 16 | `.btn-back-study` uses calm secondary styling — not destructive red |
| 17 | `← Back to Review` copy locked |
| 18 | `← Back to Vault` copy locked |
| 19 | `← Back to My HumanX` copy locked |
| 20 | `data-action="backToArena"` wires Back buttons |

### Category 5 — Navigation / context lock (6 tests)

| # | Test |
|---|------|
| 21 | `backToArena` RAF scroll restore (`requestAnimationFrame` + `scrollToReviewAnchor`) |
| 22 | `openReviewClaimStudy` still defined |
| 23 | `studyFromVault` still defined |
| 24 | Search pipeline unchanged |
| 25 | Search-aware inspect prev/next unchanged |
| 26 | `lastModeBeforeStudy` referenced in `renderStudy` |

### Category 6 — Cross-arc compatibility lock (8 tests)

| # | Test |
|---|------|
| 27 | D-245B `review-card-meta` inline date unchanged |
| 28 | D-246A readable score labels unchanged |
| 29 | D-256 `Dupes + Similar` label unchanged |
| 30 | D-258B `.review-sort-bar` CSS present |
| 31 | D-258B `.review-decision-feedback` flex-wrap present |
| 32 | D-261B desktop Study push `margin-left:auto` preserved |
| 33 | Moderation actions unchanged |
| 34 | Duplicate/advisory semantics unchanged |

### Category 7 — Public/Drift/backend boundary lock (3 tests)

| # | Test |
|---|------|
| 35 | `btn-back-study` not in `renderPublicProfileHtml` |
| 36 | `openReviewClaimStudy` not in `renderPublicProfileHtml` |
| 37 | `belief-drift-expansion.js` not modified by D-266A |

### Category 8 — Deploy integrity lock (3 tests)

| # | Test |
|---|------|
| 38 | `app-v10.js` not modified by D-266A |
| 39 | `styles.css` not modified by D-266A |
| 40 | `worker.js` not modified by D-266A |

---

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-266A
- `public/styles.css` — not modified by D-266A
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP changes
- No external asset changes
- No public profile changes

---

## Future Rule

Any future change to Study entry buttons, Back navigation buttons, or the `renderStudy` / `renderReviewInspectPanel` / `evidenceCard` render surfaces must:

1. Keep all D-265B and D-266A lock tests passing without modification, **or**
2. Update the affected lock tests with explicit owner approval and a new D-266B (or higher) task documenting exactly what changed and why.

Specifically prohibited without a new documented task:
- Reintroducing `primary` on the inspect panel claim Study button
- Removing `btn-back-study` class from any Back navigation button
- Removing the `.btn-back-study` CSS rule
- Reverting `Study linked claim ↗` to a raw claim ID button label
- Removing `btn-link-small` from the evidence card Study button
- Altering `backToArena()` RAF scroll restore behavior
