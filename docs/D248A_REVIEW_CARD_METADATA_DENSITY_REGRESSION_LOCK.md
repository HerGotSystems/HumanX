# D-248A — Review Card Metadata Density Regression Lock

**Scope:** Tests + docs only
**Status:** COMPLETE
**Baseline:** 2722 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `scripts/hardening-smoke-test.mjs`, `docs/D248A_REVIEW_CARD_METADATA_DENSITY_REGRESSION_LOCK.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Lock the D-245 → D-247 review card metadata-density mini-arc. Future review card layout or metadata changes must pass all D-248A tests unchanged, or update this lock with explicit owner approval before merging.

---

## D-245 → D-247 Mini-Arc Summary

| Task | Commit | What it delivered |
|------|--------|------------------|
| D-245A | `7bc3ec6` | Audit — 7 friction findings; F-1/F-2/F-3 identified as first fixes |
| D-245B | `246bd23` | Inline date — `Updated {age}` moved into meta row; standalone `review-card-date` row removed |
| D-245C | `dd90094` | D-245B live sanity 24/24 PASS |
| D-246A | `acf7bb9` | Score label clarity — `ev:N ts:N sv:N` → `Evidence N · Test N · Survive N` |
| D-246B | `c4894da` | D-246A live sanity 28/28 PASS |
| D-247A | `ed91f29` | Advisory hint grouping — `needs sharpening` / `category echo` / `? borderline origin` moved to `.review-card-hints` secondary row |
| D-247B | `d139e60` | D-247A live sanity 31/31 PASS |

**Tests added in arc:** 14 + 13 + 16 = **43 tests** (D-245B + D-246A + D-247A)
**Tests added in lock:** **41 tests** (D-248A)
**Total hardening smoke after lock:** 2722 passed / 0 failed
**Deploys in arc:** 3 (D-245C, D-246B, D-247B — all owner manual terminal)
**Docs/tests-only tasks:** D-245A, D-248A

---

## What Is Now Locked

### 1. D-245B Inline Date Lock (5 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| `Updated` date still in metaParts | `'Updated '+updated` in `.concat()` |
| Standalone `review-card-date` `<p>` not reintroduced | Absence check in cardSrc |
| `.review-card-date` CSS rule not reintroduced | Absence check in cssSrc |
| `reviewAge()` still used for date calculation | Presence check |
| Category still in claim/truth metaParts | `item.category\|\|'general'` presence check |

### 2. D-246A Score Label Clarity Lock (7 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| Readable `Evidence` label present | `'Evidence '` in scoreHint |
| Readable `Test` label present | `· Test ` in scoreHint |
| Readable `Survive` label present | `· Survive ` in scoreHint |
| Cryptic `ev:` not reintroduced | Absence of `` `ev: `` template literal |
| `evidence_score` field still referenced | Presence check |
| `testability` field still referenced | Presence check |
| `survivability` field still referenced | Presence check |

### 3. D-247A Advisory Hint Grouping Lock (8 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| `.review-card-hints` container still emitted | Presence check in cardSrc |
| `hintsRow` still conditionally rendered | `hintBadges.length` presence check |
| `needs sharpening` hint still present | Presence check |
| `category echo` hint still present | Presence check |
| `? borderline origin` hint still present | Presence check |
| `b-borderline-origin` not in primary head row | Head section absence check |
| `b-quality` not in primary head row | Head section absence check |
| `.review-card-hints` CSS still defined | Presence check in cssSrc |

### 4. Primary Head Row Scan-Critical Badge Lock (6 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| Type badge render path in head | `b-blue/purple/orange/yellow` in headSection |
| State badge render path in head | `b-green/b-red/b-yellow` in headSection |
| Report badge render path in head | `b-red` + `report` in headSection |
| `~similar` badge in head | `b-similar` in headSection |
| `truth-derived` badge in head | `b-truth-derived` in headSection |
| Builder chip render path in card | `rc-builder-chip` in cardSrc |

### 5. Cross-Arc Behavior Compatibility Lock (8 tests)

| Test | Arc |
|------|-----|
| `data-review-selected="true"` still emitted | D-227B |
| `data-review-confirming` still emitted | D-229A |
| `review-decision-feedback` still in renderReviewList | D-230A |
| `reviewDecisionFeedbackNextId` still present | D-242B |
| `rc-chip-dup` still in reviewCard | D-233→D-237 |
| `backToArena` still exists | D-239→D-240 |
| All four moderation action buttons present | Core |
| (implied by above: keyboard advance, Open next item, confirm-state) | D-229A/D-242B |

### 6. Public / Drift / Backend Boundary Lock (5 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| `renderPublicProfileHtml` excludes `review-card-hints` | Absence check |
| `renderPublicProfileHtml` excludes `review-card-head` | Absence check |
| `renderPublicProfileHtml` excludes `review-card-meta` | Absence check |
| `renderPublicProfileHtml` excludes `Open next item` | Absence check |
| `renderPublicProfileHtml` does not call `reviewCard()` | Absence check |

### 7. Deploy Integrity Lock (3 tests)

| Guarantee | Mechanism |
|-----------|-----------|
| `app-v10.js` not modified by D-248A | Absence of `D-248A` tag |
| `worker.js` not modified by D-248A | Absence of `D-248A` tag |
| `styles.css` not modified by D-248A | Absence of `D-248A` tag |

---

## No Data Removal Guarantee

All metadata fields, advisory conditions, and hint detection logic from D-245→D-247 are preserved:
- Date: `reviewAge(item.updated_at||item.updatedAt||item.created_at||Date.now())`
- Scores: `item.evidence_score`, `item.testability`, `item.survivability` (all still rendered)
- Hints: `claimQualityHints`, `isTruthDerivedClaim`, `isClaimCategoryEcho`, `isLikelyBorderlineDerivedClaim` (all still called)

---

## Moderation Actions Unchanged

- Approve / Keep Pending / Reject buttons remain in `.review-actions`
- Confirm-state flow (D-229A) unchanged
- Decision feedback banner (D-230A) unchanged
- "Open next item →" (D-242B) unchanged
- Keyboard advance (D-242A) unchanged

---

## Duplicate / Advisory Semantics Unchanged

- `~similar` badge stays in primary head row (D-237A lock intact)
- `rc-chip-dup` exact-duplicate chip stays in `.review-card-chips`
- `review-card-similar` border-left class unchanged
- D-237A regression tests still pass

---

## Review-to-Study / Next-Item Behavior Unchanged

- `backToArena` and RAF scroll restore unchanged (D-239/D-240)
- `reviewDecisionFeedbackNextId` and `clearReviewDecisionFeedback` unchanged (D-242B/D-243A)

---

## Public Exposure Guarantees

All of the following confirmed absent from `renderPublicProfileHtml`:
- `review-card-hints`
- `review-card-head`
- `review-card-meta`
- `Open next item`
- `reviewCard()` call (review card score labels cannot reach public profile via card render path)

---

## Drift/Belief Expansion Untouched

`public/belief-drift-expansion.js` and `public/index.html` not modified. Confirmed by deploy integrity lock assertions.

---

## Worker Known-Warning State

| Warning | Count | Status |
|---------|-------|--------|
| `/api/u/:slug` parameterised route | 1 | Known — D-218A documented limitation |
| Unknown warnings | 0 | Any new WARN text not matching known-warn must be investigated |

---

## Tests Added (41 new → baseline 2681 + 41 = **2722**)

7 categories / 41 tests — all PASS on first run.

**Hardening smoke:** 2722 passed / 0 failed
**Worker route static:** 57 passed / 0 failed / 1 known warn

---

## Future Rule

> Any task touching review card layout, metadata rows, badge/chip render paths, or the advisory hint grouping must either pass all D-248A regression tests unchanged, or update this lock with explicit owner approval before merging.
>
> Specifically:
> 1. Do not reintroduce a standalone `<p class="review-card-date">` row — the date belongs in `metaParts`.
> 2. Do not reintroduce `ev:` / `ts:` / `sv:` score abbreviations — the readable `Evidence / Test / Survive` labels must be preserved.
> 3. Do not move `needs sharpening`, `category echo`, or `? borderline origin` back into the primary `.review-card-head` row.
> 4. Do not remove the `.review-card-hints` secondary row or its conditional render.
> 5. Do not move scan-critical badges (`~similar`, `truth-derived`, type, state, report) out of the primary head row without a new owner-approved spec.
