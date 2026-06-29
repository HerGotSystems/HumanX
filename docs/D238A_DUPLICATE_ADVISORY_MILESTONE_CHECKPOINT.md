# D-238A — Duplicate Advisory Milestone Checkpoint

**Scope:** Docs only
**Status:** COMPLETE
**Baseline:** 2526 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D238A_DUPLICATE_ADVISORY_MILESTONE_CHECKPOINT.md`
**App UI changes:** None
**CSS changes:** None
**Worker changes:** None
**Migration:** None
**Schema change:** None
**Backend/API change:** None
**New public data fields:** None
**Deploy needed:** No

---

## Purpose

Update the authoritative project checkpoint (`docs/PROJECT_STATE.md`) after the completed D-233 → D-237 duplicate advisory UX mini-arc. This doc records the arc summary, current guarantees, privacy state, deployment state, and safe next-work rules for the duplicate advisory domain.

---

## D-233 → D-237 Mini-Arc Summary

| Task | Commit | What it delivered |
|------|--------|------------------|
| D-233A | `cb3069d` | Duplicate review UX audit — 4 findings (F-1→F-4), 15 guard tests, docs only |
| D-233B/C | `27df1c7` | Resolve-similar scroll anchor parity — `scrollToReviewAnchor(claimId)` in success path; 11 tests; live PASS 11/11 |
| D-234A/B | `df6b524`/`b73a4c5` | Similar advisory display clarity — structured banner, "Possible related claim:" field prefix, "does not approve, reject, or merge" dismiss modal copy; 5 CSS sub-classes; 19 tests; live PASS 15/15 |
| D-235A/B | `d30646a`/`2564d8f` | Similar advisory Copy ID — `copySimilarClaimId(id)` helper, Copy ID button, `user-select:all` code element; 19 tests; live PASS 14/14 |
| D-236A/B | `3136539`/`f6c48ae` | Duplicate-target prefill — "Use as duplicate target" button, `markDuplicateUI(claimId, suggestedCanonicalId='')` optional param, prefill note; 18 tests + 6 window fixes; live PASS 16/16 |
| D-237A | `959b343` | Duplicate advisory workflow regression lock — 41 tests across 7 categories; no deploy |

**Tests added in arc:** 15 + 11 + 19 + 19 + 18 + 41 = **123 new tests**
**Total hardening smoke after arc:** 2526 passed / 0 failed
**Deploys in arc:** 4 (D-233C, D-234B, D-235B, D-236B — owner manual terminal)
**Docs/tests-only tasks:** D-233A, D-237A

---

## Current Baseline

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `2526 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

**Known warn:** `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Duplicate Advisory Guarantees

### Advisory-only semantics

- `near_duplicate_of` remains advisory only — computed by backend, requires no moderator action
- No auto-merge, no canonical resolution, no auto-submit
- `duplicate_of` (explicit moderator-set) and `near_duplicate_of` (advisory) are separate concepts
- Normal approve / keep pending / reject actions are unchanged

### Explicit confirmation guarantee

- "Use as duplicate target" opens `markDuplicateUI` modal with canonical target field pre-filled
- API call (`POST /api/review/mark-duplicate`) fires only inside `onConfirm` — requires explicit "Mark Duplicate" click
- Cancel leaves queue unchanged — no mutation
- `markDuplicateUI(claimId, suggestedCanonicalId='')` — existing one-arg callers backward-compatible

### Copy ID guarantee

- `copySimilarClaimId(id)` copies only the raw claim ID string via `navigator.clipboard?.writeText`
- No backend lookup, no `fetch`, no `api()`, no `localStorage`
- Success toast: "ID copied"
- Failure toast: "Copy failed — select the ID manually"
- Raw ID also visible in `<code class="review-similar-id-code">` with `user-select:all`

### Prefill-only guarantee

- "Use as duplicate target" prefills the form only — it does not mark anything automatically
- Prefill note: "Prefills the duplicate form — does not mark anything by itself."

### Scroll parity (D-233B)

- `resolveSimilarUI` calls `renderReviewList()` then `scrollToReviewAnchor(claimId)` on success
- `markDuplicateUI` has matching scroll parity
- Order locked: render first, scroll after

### No backend/API lookup

- All advisory affordances use the `near_duplicate_of` ID already present in the review queue data
- No new API routes, no new API fields, no backend search or lookup

### No merge/canonical behavior

- No `mergeClaimUI`, no `/api/review/merge`, no `canonicalResolution`, no `autoMergeDuplicate`
- If a canonical/merge flow is wanted in future, it requires a separate backend/API spec

---

## Privacy / Public Exposure Guarantees

All of the following are confirmed absent from `renderPublicProfileHtml` (locked by D-237A):

- `copySimilarClaimId`
- `markDuplicateUI`
- `resolveSimilarUI`
- "Similar claim advisory"
- "Use as duplicate target"
- `review-similar-use-dup`, `review-dup-prefill-note`
- `review-similar-note` and all advisory internals

No new public data fields introduced in D-233→D-237. No backend/API/migration/schema/CSP/external asset changes in the arc.

---

## Deployment State

| Task | State |
|------|-------|
| D-233A | Docs / tests only — no deploy needed |
| D-233B | Owner deploy PASS — D-233C confirmed live (11/11) |
| D-234A | Owner deploy PASS — D-234B confirmed live (15/15) |
| D-235A | Owner deploy PASS — D-235B confirmed live (14/14) |
| D-236A | Owner deploy PASS — D-236B confirmed live (16/16) |
| D-237A | Tests / docs only — no deploy needed |
| D-238A | Docs only — **no deploy needed** |
| **Current** | **No deploy needed** |

---

## Safe Next Lanes

These are suggestions only. Do not start any without explicit assignment.

| Lane | Notes |
|------|-------|
| Open related claim navigation audit | After "↗ Study" or "Use as duplicate target", no explicit back-to-review flow — could be improved |
| Duplicate canonical/merge backend spec | If owner wants explicit merge/canonical flow, needs a backend/API spec first — do not implement without it |
| Review queue next-item flow | After a decision, auto-advance to next pending item |
| Compact review card metadata/status chips | Denser card for long queues |
| Review search/filter clarity | Filter chip accessibility; filter counts; empty-state copy per-filter |
| Claim/RunPack flow clarity | Investigation Packet workflow, AI-return parsing, stale detection |

---

## Future Rule

> Any task touching duplicate/canonical/merge UX — including new merge actions, canonical lookup, advisory UI changes, or resolve-similar route changes — must either pass all D-237A regression tests unchanged, or update the D-237A lock with explicit owner approval before merging.
