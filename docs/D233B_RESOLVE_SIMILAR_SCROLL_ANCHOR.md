# D-233B — Resolve Similar Scroll Anchor

**Scope:** App fix + tests + docs
**Status:** COMPLETE — deploy needed
**Baseline:** 2429 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `public/app-v10.js`, `scripts/hardening-smoke-test.mjs`, `docs/D233B_RESOLVE_SIMILAR_SCROLL_ANCHOR.md`, `docs/README.md`
**App UI changes:** Yes — `resolveSimilarUI` scroll behavior
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** Yes

---

## Purpose

Fix the scroll anchor parity gap found in D-233A (friction finding F-6): after a moderator dismisses a `near_duplicate_of` advisory via the "Dismiss ~Similar" modal, the review queue now scrolls back to the same review item — matching the existing behavior of `markDuplicateUI`.

---

## D-233A finding addressed (F-6)

> **F-6: `resolveSimilarUI` does not restore scroll position**
>
> After dismissing a similar advisory, the modal calls `loadReviewQueue()` then `renderReviewList()` without `scrollToReviewAnchor(claimId)` or `withReviewScrollPreserved`. The page jumps to the top after the modal closes, unlike `markDuplicateUI` which does call `scrollToReviewAnchor(claimId)` after success.
>
> **Impact:** Low. Scroll jumps are jarring during high-volume review, but the behavior is recoverable.

---

## Exact behavior changed

### Before (D-233A state)

```
resolveSimilarUI success path:
  close() → toast('Similar advisory cleared.') → loadReviewQueue() → renderReviewList()
  ↑ page jumps to top
```

### After (D-233B)

```
resolveSimilarUI success path:
  close() → toast('Similar advisory cleared.') → loadReviewQueue() → renderReviewList() → scrollToReviewAnchor(claimId)
  ↑ page scrolls to the review item anchor
```

One `scrollToReviewAnchor(claimId)` call added after `renderReviewList()`.

---

## Parity with `markDuplicateUI`

`markDuplicateUI` success path (unchanged):

```
close() → inspectedReviewItem=null → toast('Marked as duplicate...') → loadGraphStatus() → loadReviewQueue() → renderReviewList() → scrollToReviewAnchor(claimId)
```

Both functions now end their success path with `scrollToReviewAnchor(claimId)`. The argument is the same — `claimId` — the ID of the claim the moderator just acted on.

---

## What did NOT change

- API route: `/api/review/resolve-similar` — unchanged
- Modal copy: "Dismiss the similarity advisory linking this claim to..." — unchanged
- Modal confirm label: "Dismiss Advisory" — unchanged
- `near_duplicate_of` semantics: still advisory only — unchanged
- `duplicate_of` semantics: unchanged
- All normal moderation actions (Approve/Keep/Reject): unchanged
- `markDuplicateUI` behavior: unchanged
- Review queue data shape: unchanged
- Worker, CSS, public profile, CSP: all unchanged

---

## Code diff

**File:** `public/app-v10.js` — `resolveSimilarUI` function (line 437)

```diff
- await loadReviewQueue();renderReviewList()}catch
+ await loadReviewQueue();renderReviewList();scrollToReviewAnchor(claimId)}catch
```

Single insertion. No other app-v10.js change.

---

## Tests added (11 new)

| Test | What it confirms |
|------|-----------------|
| `resolveSimilarUI now calls scrollToReviewAnchor(claimId) after success` | Core D-233B fix |
| `resolveSimilarUI calls scrollToReviewAnchor after renderReviewList` | Call order correct (render before scroll) |
| `markDuplicateUI still calls scrollToReviewAnchor(claimId) (parity check)` | Parity preserved |
| `scrollToReviewAnchor function still exists` | Dependency not removed |
| `resolveSimilarUI still posts to /api/review/resolve-similar` | API route unchanged |
| `markDuplicateUI still posts to /api/review/mark-duplicate` | API route unchanged |
| `resolveSimilarUI modal copy unchanged` | Modal text not altered |
| `resolveSimilarUI modal still loads review queue before scroll` | Call order: loadQueue → render → scroll |
| `renderPublicProfileHtml does not reference resolveSimilarUI or markDuplicateUI` | No public exposure |
| `deploy integrity — styles.css unchanged` | CSS not modified |
| `deploy integrity — worker.js unchanged` | Worker not modified |

**Hardening smoke:** 2429 passed / 0 failed (+11 new)

---

## Live sanity checklist (pending owner deploy)

- [ ] Deploy to production via owner terminal
- [ ] Open Review queue with at least one `~similar`-flagged claim
- [ ] Inspect the claim — "Dismiss ~Similar" button visible in dupSection
- [ ] Click "Dismiss ~Similar" — advisory dismiss modal appears
- [ ] Confirm "Dismiss Advisory" — modal closes, toast "Similar advisory cleared." appears
- [ ] Verify review queue scrolls back to the dismissed claim's card (not to the top)
- [ ] Verify `~similar` badge and `review-card-similar` class no longer appear on the card after dismiss
- [ ] Open a different claim and click "Mark Duplicate..." — complete the flow — verify it still scrolls to anchor (parity unchanged)
- [ ] Refresh queue — verify dismissed advisory is cleared in the data (claim shows as normal review item)
- [ ] Verify no console errors during dismiss flow
- [ ] Verify public profile does not contain any advisory or duplicate-modal internals

---

## Confirmations

- **App changed:** Yes — `resolveSimilarUI` scroll anchor added
- **CSS unchanged:** Confirmed
- **Worker unchanged:** Confirmed
- **No new public data fields:** Confirmed
- **No backend/API/migration/schema/CSP/external asset changes:** Confirmed
- **No duplicate/advisory semantics change:** Confirmed
- **No public profile exposure:** Confirmed
- **Deploy needed:** Yes
