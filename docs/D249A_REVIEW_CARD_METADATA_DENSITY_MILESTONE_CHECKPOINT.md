# D-249A — Review Card Metadata Density Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Baseline:** 2722 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/D249A_REVIEW_CARD_METADATA_DENSITY_MILESTONE_CHECKPOINT.md`, `docs/PROJECT_STATE.md`, `docs/README.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Close the D-245→D-248 review card metadata-density mini-arc with a PROJECT_STATE.md checkpoint. Authoritative reference for the arc history, current behavior guarantees, privacy boundary state, deployment state, and safe-next-work rules through D-248A.

---

## D-245→D-248 Mini-Arc Summary

| Task | Commit | Type | What it delivered |
|------|--------|------|------------------|
| D-245A | `7bc3ec6` | Audit | Review card metadata density audit — 7 friction findings (F-1/F-2/F-3/F-4 prioritised); docs only |
| D-245B | `246bd23` | Feature | Inline date — `Updated {age}` moved from standalone `<p class="review-card-date">` into `.review-card-meta` concat; CSS date rule removed; 14 tests |
| D-245C | `dd90094` | Live closeout | D-245B live sanity 24/24 PASS |
| D-246A | `acf7bb9` | Feature | Score label clarity — `ev:N ts:N sv:N` → `Evidence N · Test N · Survive N`; 13 tests |
| D-246B | `c4894da` | Live closeout | D-246A live sanity 28/28 PASS |
| D-247A | `ed91f29` | Feature | Advisory hint grouping — `needs sharpening` / `category echo` / `? borderline origin` moved to `.review-card-hints` secondary row; CSS rule added; 16 tests |
| D-247B | `d139e60` | Live closeout | D-247A live sanity 31/31 PASS |
| D-248A | `e310da7` | Regression lock | 7 categories / 41 tests — inline date, score labels, advisory hint grouping, head badge set, cross-arc compat, public/Drift/backend boundary, deploy integrity |

**Tests added in arc:** 14 + 13 + 16 + 41 = **84 new tests** (2638 → 2722)
**Deploys in arc:** 3 (D-245C, D-246B, D-247B — all owner manual terminal)
**Docs/tests-only tasks:** D-245A, D-248A

---

## D-245A Audit Findings — Resolution Status

| Finding | Priority | Status |
|---------|----------|--------|
| F-1: Head row badge overflow (up to 9 badges) | HIGH | **Fixed — D-247A** moved 3 advisory hints to `.review-card-hints` row; max 6 in head |
| F-2: Cryptic `ev:N ts:N sv:N` score labels | MEDIUM | **Fixed — D-246A** → `Evidence N · Test N · Survive N` |
| F-3: Standalone date row | MEDIUM | **Fixed — D-245B** → date inline in meta line |
| F-4: Pressure handle duplication | MEDIUM | **Deferred** — pressure handle appears in both chips row and meta row; low-risk, separate spec needed |
| F-5 through F-7 | LOW | **Deferred** — open in next audit cycle |

---

## Review Card Current Behavior (post D-245→D-248)

```
[article .review-card]
  [.review-card-head]      ← type · state · ⚑ report · ~similar · truth-derived · Builder
                              (max 6 badges — was 9 before D-247A)
  [.review-card-chips]     ← origin / handle / dup / locked chips (unchanged)
  [.review-reason-tag]     ← report reason (unchanged, conditional)
  [h3 .review-card-title]  ← claim text (unchanged)
  [p .review-card-meta]    ← category · status · Evidence N · Test N · Survive N · Updated {age}
                              (D-245B date inline, D-246A score labels)
  [.review-card-hints]     ← needs sharpening / category echo / ? borderline origin
                              (D-247A, conditional — empty string when no hints)
  [.review-actions]        ← Inspect / Approve / Keep Pending / Reject (unchanged)
```

### Meta line content by card type

| Card type | Meta line fields |
|-----------|-----------------|
| Claim / Truth (default) | category · status · `Evidence N · Test N · Survive N` · `Updated {age}` |
| Evidence | stance · quality · `Updated {age}` |
| Pressure | `severity N/5` · `by {handle}` (if present) · parent claim excerpt · `Updated {age}` |

### Score labels

| Old (removed) | New (D-246A) |
|---------------|-------------|
| `ev:N ts:N sv:N` | `Evidence N · Test N · Survive N` |

Values (`evidence_score`, `testability`, `survivability`) and all source fields unchanged.

### Advisory hints row (D-247A)

| Badge | Condition |
|-------|-----------|
| `needs sharpening` | `claimQualityHints(item).length > 0` |
| `category echo` | `isTruthDerivedClaim(item) && isClaimCategoryEcho(item)` |
| `? borderline origin` | `isLikelyBorderlineDerivedClaim(item)` |

Row is absent (empty string) when no hints apply. Opacity `.75` for visual quiet.

---

## Privacy / Public Boundary State (D-245→D-248 additions)

| Guarantee | Locked by |
|-----------|-----------|
| `review-card-hints` absent from `renderPublicProfileHtml` | D-248A |
| `review-card-head` absent from `renderPublicProfileHtml` | D-248A |
| `review-card-meta` absent from `renderPublicProfileHtml` | D-248A |
| `Open next item` absent from `renderPublicProfileHtml` | D-248A |
| `reviewCard()` not called from `renderPublicProfileHtml` | D-248A |
| No new API/schema fields in D-245→D-248 | Confirmed — zero changes |
| No backend/API/migration/CSP changes in D-245→D-248 | Confirmed |

---

## Deployment State (D-245→D-248)

| Task | State |
|------|-------|
| D-245A | Audit / docs only — no deploy needed |
| D-245B | Owner deploy PASS — D-245C confirmed live (24/24) |
| D-246A | Owner deploy PASS — D-246B confirmed live (28/28) |
| D-247A | Owner deploy PASS — D-247B confirmed live (31/31) |
| D-248A | Tests / docs only — no deploy needed |
| D-249A (this task) | Docs only — no deploy needed |
| **Current deploy needed** | **No** |

---

## Drift/Belief Expansion State

`public/belief-drift-expansion.js` and `public/index.html` untouched in all D-245→D-248 tasks. Rule: do not touch these files during Review queue work unless a failing test requires a minimal, explicitly documented compatibility fix.

---

## Baseline

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2722 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed (1 known warn)` |

---

## Safe Next-Work Rules Added (D-249A)

**Rule 25:** D-248A review card metadata density lock — any task touching review card layout, metadata rows, badge/chip render paths, or the advisory hint grouping must either pass all D-248A regression tests unchanged, or update the D-248A lock with explicit owner approval before merging.

**Rule 26:** Do not reintroduce a standalone `<p class="review-card-date">` row — the date belongs in `metaParts` via `.concat(['Updated '+updated])`.

**Rule 27:** Do not reintroduce `ev:` / `ts:` / `sv:` score abbreviations — the readable `Evidence / Test / Survive` labels must be preserved.

**Rule 28:** Do not move `needs sharpening`, `category echo`, or `? borderline origin` back into the primary `.review-card-head` row without a new owner-approved spec.

**Rule 29:** Do not remove the `.review-card-hints` secondary row or its conditional render.

**Rule 30:** Do not move scan-critical badges (`~similar`, `truth-derived`, type, state, ⚑ report) out of the primary head row without a new owner-approved spec.

**Rule 31:** Do not add new review card metadata rows (new `<p>` or `<div>` elements between `.review-card-chips` and `.review-actions`) without a D-245A-style density audit confirming the new row does not push action buttons below the viewport on a typical queue.

**Rule 32:** Do not extend `metaParts` with additional fields for pressure cards without resolving D-245A F-4 (handle duplication) — adding more fields to an already-duplicated surface increases noise, not scan speed.

---

## Suggested Next Lanes

| Lane | Notes |
|------|-------|
| Review search/filter clarity audit | Filter chip accessibility; filter counts; empty-state copy per-filter |
| Study entry button style consistency | D-239A F-2–F-4: button prominence, browser-back support, Study entry button inconsistency |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | D-239A remaining findings |
| D-245A F-4 pressure handle duplication | Separate spec — pressure cards show handle in both chips and meta |
| Duplicate canonical/merge backend spec | If owner wants explicit merge/canonical resolution, needs backend/API spec first |
