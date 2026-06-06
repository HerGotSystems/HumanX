# D-23B: Investigation Graph Navigation Audit

Date: 2026-06-06
Status: Audit only. No implementation in D-23.

---

## Purpose

Map all current navigation paths between the major workspaces and identify where investigative context is lost, making it harder for a user to follow a thread from belief through to RunPack analysis.

---

## Current navigation graph

```
Home
 ├─→ Belief Engine (location.href, full page nav — exits SPA)
 ├─→ Drift         (setMode)
 ├─→ Submit        (setMode, selected=null)
 ├─→ Claims        (setMode, selected=null)
 │    └─→ Study    (selectClaim — selected set)
 │         ├─→ Claims  (backToArena — selected=null, scroll lost)
 │         └─→ RunPack (Build RunPack — stays in study-mode, lastPacket set)
 ├─→ Vault         (setMode, selected=null)
 │    └─→ Study    (studyFromVault → setMode arena → selectClaim)
 │         └─→ Claims  (backToArena — returns to Claims, NOT Vault)
 ├─→ Truths        (setMode, selected=null)
 │    └─→ [Convert to Claim] → Claims → Study (setMode arena, selectClaim)
 ├─→ Review        (setMode, selected=null)
 │    └─→ Study    (openReviewClaimStudy → setMode arena → selectClaim)
 │         └─→ Claims  (backToArena — returns to Claims, NOT Review)
 └─→ RunPack       (setMode, selected preserved if was export mode)
      └─→ Claims   (Browse Claims CTA when no claim selected)
```

Key rule in `setMode(m)`:
- `selected` is set to `null` for ALL modes **except** `export`.
- This means navigating away from Study to any tab except RunPack destroys the selected claim reference.

---

## Context dissolution points

### 1. Back from Study → Claims loses scroll position

`backToArena()` calls `selected=null` then `setMode('arena')`. The Claims grid re-renders from the beginning. If the user was 40 cards down, they must re-scroll and re-locate the claim they were studying.

**Severity:** Medium. Frequent in investigation workflows.
**Fix approach:** Store a `lastArenaScrollTop` variable before entering Study, restore it after `backToArena()` renders the grid. Frontend-only, low risk.

---

### 2. Vault → Study → Back returns to Claims, not Vault

`studyFromVault` sets `mode='arena'` and calls `selectClaim`. `backToArena()` then returns to Claims (arena mode), not Vault. The user loses their vault browsing context.

**Severity:** Medium. Common when tracing how a vault item is used across claims.
**Fix approach:** Track `lastModeBeforeStudy` (e.g., `'vault'`). In `backToArena()`, return to `lastModeBeforeStudy` instead of always returning to arena. Frontend-only.

---

### 3. Review → Study → Back returns to Claims, not Review

`openReviewClaimStudy` goes to arena mode to open the Study view. `backToArena()` returns to Claims, losing the Review queue position and the previously inspected item.

**Severity:** High for admin workflows. Moderators studying claims from the review queue must navigate back to Review manually and re-find their position.
**Fix approach:** Same `lastModeBeforeStudy` variable. If origin was `review`, `backToArena()` returns to review mode and restores `inspectedReviewItem`. Frontend-only.

---

### 4. No direct Study → RunPack tab navigation

In Study view, "Build RunPack" generates the packet and stays in study mode. To get to the full RunPack page (for copy/download/AI-return import), the user must manually click the RunPack tab.

**Severity:** Low. The workflow guide in the RunPack tab (D-17) explains this. The sidebar dock partially addresses it with `#aip-status`.
**Fix approach:** Add a small "Open RunPack →" link or button in Study that calls `setMode('export')`. Preserve `selected` (export mode already does this). Frontend-only.

---

### 5. Belief Engine exits the SPA entirely

`location.href='/apps/humanx-belief-engine/'` is a full page navigation. Any in-progress claim selection, search state, or RunPack is lost.

**Severity:** Low for current usage. Belief Engine is intentionally standalone.
**Fix approach:** None in this phase. Noted for future bridge architecture if needed.

---

### 6. Submit → Claim submitted → no path back to the submitted claim's study

After `saveClaim()` succeeds (non-existing, non-near-duplicate), the user sees a confirmation panel with "Study this claim" (which calls `selectClaim`). This works. However, if `data.existing` is true, the UI shows the already-existing claim and offers "Study existing claim". Both paths work.

**Near-duplicate path:** If `data.nearDuplicate`, the panel shows the submitted claim and optionally the similar claim. Both have Study buttons. This also works.

**Severity:** None — paths are complete.

---

### 7. Truths → Convert to Claim → loses Truths context

`convertTruth` sets `mode='arena'` and calls `selectClaim`. User ends up in Study. `backToArena()` returns to Claims, not Truths.

**Severity:** Low. Not a frequent workflow path.
**Fix approach:** Same `lastModeBeforeStudy` mechanism.

---

## Advisory paths (near-duplicate)

Near-duplicate detection adds an advisory path from Submit success panel to the similar claim's Study. This path is present and functional (D-10B).

From Review inspect, the `~Similar` badge and "Similar claim (advisory)" field provide `openReviewClaimStudy(nearDup)` navigation. This is present and functional (D-11).

No gaps in the advisory paths.

---

## Priority ranking for implementation

| # | Issue | Severity | Effort | Approach |
|---|-------|----------|--------|----------|
| 1 | Review → Study → back loses review context | High | Low | `lastModeBeforeStudy` + restore `inspectedReviewItem` |
| 2 | Vault → Study → back returns to Claims | Medium | Low | Same `lastModeBeforeStudy` |
| 3 | Back from Study loses Claims scroll position | Medium | Low | Save/restore `scrollTop` |
| 4 | No Study → RunPack shortcut | Low | Very low | Add `setMode('export')` button in study header |
| 5 | Truths → Study → back loses Truths context | Low | Low | Same `lastModeBeforeStudy` |

---

## Implementation safety notes

- `lastModeBeforeStudy` must not persist across `setMode` calls that aren't triggered by `studyFromVault`/`openReviewClaimStudy`/`selectClaim`. Set it only in those three entry points.
- Restoring `inspectedReviewItem` on return to Review requires storing the ID before leaving — store as `lastInspectedReviewId`, restore in `renderReview`.
- Scroll restoration applies only to `#main` scroll position inside the arena grid. Do not attempt to restore sidebar or search state.
- All fixes are frontend-only, no backend/D1/worker changes.
- These are deferred from D-23. Implement in a dedicated batch (candidate: D-24A).
