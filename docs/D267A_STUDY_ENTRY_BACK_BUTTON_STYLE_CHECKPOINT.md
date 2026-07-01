# D-267A — Study Entry / Back Button Style Checkpoint

**Scope:** Docs only
**Status:** COMPLETE — no deploy needed
**Baseline:** 3075 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Files changed:** `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/D267A_STUDY_ENTRY_BACK_BUTTON_STYLE_CHECKPOINT.md`
**App changes:** None (`public/app-v10.js` not touched)
**CSS changes:** None (`public/styles.css` not touched)
**Worker changes:** None
**Drift/Belief expansion files:** Unchanged
**Deploy needed:** No

---

## Purpose

Updates the authoritative project checkpoint docs after the completed D-265 → D-266 Study entry / Back-to-Review style consistency mini-arc. Confirms exact classes, copy, and behavior guarantees that are now locked by D-266A. Does not change any code.

---

## D-265A / B / C / D-266A Summary

| Task | Type | What it did |
|------|------|-------------|
| D-265A | Audit | Full 14-button static audit of all Study entry and Back navigation buttons across `public/app-v10.js`. 8 friction findings: F-1 HIGH (`primary` class on inspect panel claim Study creates false hierarchy), F-2 HIGH (all 5 Back buttons unstyled — browser-default), F-3–F-6 MEDIUM (icon inconsistency, evidence card Study classless, advisory field appearance, raw claim ID label), F-7–F-8 LOW. Docs only. Baseline unchanged: 3011/0/24/57. |
| D-265B | CSS/copy polish | 4 targeted changes: (1) removed `primary` from inspect panel claim Study button; (2) changed linked claim label `{claimId} ↗` → `Study linked claim ↗`; (3) added `btn-link-small` + `↗` to evidence card Study button; (4) added `btn-back-study` class to all 5 Back navigation buttons + `.btn-back-study` CSS rule (calm secondary affordance). 24 new lock tests. No navigation/handler/behavior changes. Baseline 3011 → 3035. |
| D-265C | Live closeout | Owner deploy PASS (2026-07-01). 39/39 live sanity PASS. |
| D-266A | Regression lock | 40 new tests across 8 categories locking the D-265B state permanently. Tests + docs only. Baseline 3035 → 3075. |

---

## Current Baseline

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3075 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## Deploy State

| Task | Deploy state |
|------|-------------|
| D-265A | Audit / docs only — no deploy needed |
| D-265B | Owner deploy PASS — D-265C confirmed live (39/39) |
| D-265C | Live closeout — no deploy needed |
| D-266A | Tests / docs only — no deploy needed |
| D-267A | Docs only — **no deploy needed** |
| **Current** | **No deploy needed** |

Latest deployed Worker version: `cb5caf6f-67ff-4a41-baa5-22ed836e0cb2` (D-261C — unchanged by D-265→D-266).

---

## Exact Study Classes / Copy Locked

| Element | Class | Label | Handler | Lock |
|---------|-------|-------|---------|------|
| Inspect panel claim Study | `btn-study-review` | `Open Study View ↗` | `openReviewClaimStudy(id)` | D-266A tests 1–3 |
| Inspect panel evidence/pressure Study | `btn-study-review` | `Study Parent Claim ↗` | `openReviewClaimStudy(claim_id)` | D-266A test 4 |
| Inspect panel truth Study (public linked claim) | `btn-study-review` | `Study Linked Claim ↗` | `openReviewClaimStudy(linked_id)` | D-266A test 5 |
| Linked claim Study button (truth, public) | `btn-link-small` | `Study linked claim ↗` | `openReviewClaimStudy(linked)` | D-266A tests 6–8 |
| Evidence card Study button | `btn-link-small` | `Study Linked Claim ↗` | `studyFromVault(claimId)` | D-266A tests 10–12 |
| Vault group header Study button | `btn-link-small` | `Study claim ↗` | `studyFromVault(claimId)` | D-266A test 13 |

**`primary btn-study-review` combination must not be reintroduced in the inspect panel** — D-266A test 2.

---

## Exact Back Classes / Copy Locked

| Element | Class | Copy | Handler | Lock |
|---------|-------|------|---------|------|
| All 5 Back navigation buttons | `btn-back-study` | `← Back to Review` / `← Back to Vault` / `← Back to Truths` / `← Back to My HumanX` / `← Back to Claims` | `data-action="backToArena"` | D-266A tests 14, 17–20 |

`.btn-back-study` CSS: calm secondary — `rgba(255,255,255,.06)` fill, `rgba(255,255,255,.12)` border, `var(--muted)` text, `4px 10px` padding, `6px` radius, `12px` font-size — **not destructive red** — D-266A test 16.

`.btn-back-study:hover`: `rgba(255,255,255,.10)` fill, `var(--text)` text.

---

## Navigation Unchanged Guarantee

| Guarantee | Lock |
|-----------|------|
| `openReviewClaimStudy` still defined | D-266A test 22 |
| `studyFromVault` still defined | D-266A test 23 |
| `backToArena()` function behavior | D-266A test 21 |
| `lastModeBeforeStudy` referenced in `renderStudy` | D-266A test 26 |

---

## Scroll Restoration Guarantee

`backToArena()` review branch: `requestAnimationFrame(() => scrollToReviewAnchor(_savedId))` — deferred RAF, null-safe guard. Confirmed by D-266A test 21.

No queue reload on return: `loadReviewQueue()` is NOT called in the `backToArena()` review return path.

---

## Review Search / Filter / Sort Context Guarantee

- Search pipeline `applyReviewSort(applyReviewSearch(applyReviewFilter(...)))` unchanged — D-266A test 24.
- Search-aware inspect prev/next unchanged — D-266A test 25.
- `reviewSearchQuery`, `reviewStateFilter`, `reviewSortOrder` all preserved on return from Study.

---

## Public / Privacy Guarantees

- `btn-back-study` confirmed absent from `renderPublicProfileHtml` — D-266A test 35.
- `openReviewClaimStudy` confirmed absent from `renderPublicProfileHtml` — D-266A test 36.
- Study entry and Back-to-Review admin controls remain entirely internal.
- No new public data fields; no backend/API/schema/CSP changes.
- `PUBLIC_PROFILE_ALLOWED_MARKERS` contract unchanged.
- D-216A denylist unchanged.

---

## Drift / Belief Files Guarantee

`public/belief-drift-expansion.js` and `public/index.html` were not touched by D-265B, D-265C, D-266A, or D-267A. Confirmed by D-266A test 37.

**Rule:** Do not touch Drift/Belief files during Study/Review lane work unless a failing test requires a minimal, explicitly documented compatibility fix.

---

## Cross-Arc Compatibility

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

## No-Touch Guarantees

- `public/app-v10.js` — not modified by D-266A or D-267A
- `public/styles.css` — not modified by D-266A or D-267A
- `public/index.html` — not modified
- `public/belief-drift-expansion.js` — not modified
- `src/worker.js` — not modified
- `wrangler.toml` — not modified
- No backend/API/migration/schema/CSP/external asset changes

---

## Safe Next Lanes

| Lane | Notes |
|------|-------|
| Claim/RunPack flow clarity audit | Investigation Packet workflow, AI-return parsing, stale detection |
| Open related claim / related item navigation | Follow-up on D-239A remaining findings |
| HumanX home/Belief Engine navigation cohesion audit | Entry points, back-navigation, and framing between main app and Belief Engine |
| Study page content hierarchy audit | Study page layout, section ordering, dock/content density |
| Review/Study future follow-up | Only if owner finds live friction — D-265/D-266 arc is now complete |

Do not start any lane without explicit owner assignment.
