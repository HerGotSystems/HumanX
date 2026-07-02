# D-285A — Owner Pending-Review Truth Visibility Audit

**Scope:** Docs only
**Status:** COMPLETE — docs only, no deploy needed
**Branch:** main (direct commit)
**Baseline:** 3317 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**HEAD before D-285A:** `cb0d150`
**Files changed:** `docs/D285A_OWNER_PENDING_REVIEW_TRUTH_VISIBILITY_AUDIT.md`, `docs/README.md`

---

## Purpose

Audit whether owners can safely see their own Truth submissions while pending Review, and determine whether this requires backend/API/storage work or can be done frontend-only. Follows from D-284A F-1 LOW finding. Does not implement anything.

---

## Correction to D-283A/D-284A Finding F-1

The D-283A audit stated: "The `renderMe()` function fetches from `GET /api/me` which queries truths for the owner with `WHERE user_id=? AND COALESCE(review_state,'public')='public'`."

**This was incorrect.** The correct picture is:

- `GET /api/me` → `getMe()` in `worker.js` — returns only the `users` row; no truths at all.
- `GET /api/my-humanx` → `myHumanX()` in `worker.js` — returns all owner truths with no `review_state` filter.
- Line 788 (`WHERE user_id=? AND COALESCE(review_state,'public')='public'`) is in `loadPublicProfileSummary` (the public `/u/:slug` route), not in the owner dashboard query.

`renderMe()` calls `GET /api/my-humanx`, not `GET /api/me`. **The owner dashboard already receives pending-Review truths from the backend.**

---

## Audit Questions and Answers

### Q1 — Where are owner-created Truths submitted from in the frontend?

Three locations:

| Location | Function | Form trigger |
|----------|----------|-------------|
| Truths tab — "Add a public Truth" form | `submitTruth()` | "Submit Truth for Review" button |
| Claim Builder step 2/3 (truth route) | `submitBuilderTruth()` | "Save as Truth for Review" button |
| Drift — belief snapshot promote | `promoteBelief(snapshotId, 'truth')` | "Save as Truth" action on snapshot card |

---

### Q2 — What request body is sent when a Truth is submitted?

**`submitTruth()`:** `{ statement, category, origin, truthType }`

**`submitBuilderTruth()`:** `{ statement, category, origin: 'Claim Builder raw thought', truthType, confidenceLabel: 'claimed', claim_builder: builderPayload() }`

**`promoteBelief('truth')`:** `{ snapshotId, target: 'truth' }` to `POST /api/belief-promote` (backend creates the truth internally).

---

### Q3 — What backend route receives the Truth submission?

- `submitTruth()` and `submitBuilderTruth()` → `POST /api/truths` → `createTruth()` in `src/truths.js`
- `promoteBelief('truth')` → `POST /api/belief-promote` (backend calls `createTruth` or equivalent internally)

---

### Q4 — What `review_state` is assigned to a newly submitted Truth?

`'review'` — always. Confirmed in D-283A. `createTruth()` inserts with `review_state='review'`. No path creates a Truth with `review_state='public'` directly.

---

### Q5 — Where are approved/public Truths currently fetched for owner/private claim detail views?

**My HumanX dashboard** (`GET /api/my-humanx` → `myHumanX()`, `worker.js` line 298):

```sql
SELECT id, statement, category, origin, review_state, created_at, updated_at
FROM truths WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20
```

**No `review_state` filter.** Returns all truths including `'review'`, `'rejected'`, and `'archived'`.

**Public profile** (`loadPublicProfileSummary`, `worker.js` line 788):

```sql
SELECT id, statement, category, origin, truth_type, confidence_label, pressure_score, created_at, updated_at
FROM truths WHERE user_id=? AND COALESCE(review_state,'public')='public' AND COALESCE(archived_by_user,0)=0
ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 10
```

Filters to `'public'` only.

**Public Truths tab** (`GET /api/truths` → `listTruths()` in `src/truths.js`): returns only public truths. Frontend: `loadTruths()` → `GET /api/truths?q=...`.

---

### Q6 — Where are pending-Review Truths currently fetched for admin Review?

`GET /api/review` → `reviewQueue()` in `worker.js`. Admin-only. The truths sub-query (line 980):

```sql
SELECT 'truth' AS target_type, t.*, ...
FROM truths t LEFT JOIN claims c ON c.id=t.linked_claim_id
WHERE COALESCE(t.review_state,'public') NOT IN ('public','archived','rejected')
```

Returns pending truths that are in `'review'` state.

---

### Q7 — Is there any existing owner/private route that returns the owner's own pending-Review Truths?

**Yes — `GET /api/my-humanx` already returns them.**

`myHumanX()` (worker.js line 317–319) queries truths with no `review_state` filter:

```sql
SELECT id, statement, category, origin, review_state, created_at, updated_at
FROM truths WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20
```

This includes truths with `review_state='review'` (pending). The response includes `review_state` in each row. This route is owner-only (`requireUser` gating). No new backend route or query change is needed.

---

### Q8 — Is there any existing frontend state that already contains submitted pending Truths after submission?

**After re-navigation to My HumanX: Yes.** `renderMe()` calls `GET /api/my-humanx` which returns all owner truths including pending.

**Immediately after `submitTruth()` or `submitBuilderTruth()`: No.** Both functions call `renderTruths()` after successful submission, which navigates to the public Truths tab and calls `loadTruths()` → `GET /api/truths` (public only). The pending truth is not visible there. The `meData` state is not updated or checked.

**Immediately after `promoteBelief('truth')`: No.** The function calls `renderTruths()` and sets `mode='truths'`, same situation.

---

### Q9 — After page reload, can the owner see their own pending Truth submission?

**Yes, in the My HumanX tab.** After reload, if the owner navigates to My HumanX, `renderMe()` calls `GET /api/my-humanx` which returns the pending truth with `review_state='review'`. The `renderMeHtml()` function passes truths through `meFilterRows()` and calls `meRecentTruthsHtml()` which renders each truth's state badge.

**Not visible** in the public Truths tab (`renderTruths()`) since that only shows public truths.

---

### Q10 — Would showing owner pending-Review Truths require a new backend query or API route?

**No.** `GET /api/my-humanx` already returns them. No new route or query needed.

---

### Q11 — Could it be done safely using an existing authenticated route?

**Yes — it already is.** The `GET /api/my-humanx` route is already:
- Authenticated (owner-only via `requireUser`)
- Returns all owner truths including pending
- Gated by `OWNER_SENSITIVE_ROUTES` telemetry

The frontend already renders pending truths in My HumanX via `meRecentTruthsHtml()` (line 296) with the yellow "Review" badge from `ME_STATE_LABELS` and `ME_STATE_CLR`.

The `reviewStatusBadge()` function (line 454) also already outputs `"Pending Review"` for `review_state='review'`.

---

### Q12 — Would public profile `/u/:slug` remain unaffected?

**Yes.** The public profile query (line 788) already filters `COALESCE(review_state,'public')='public'`. Pending truths are never included in the public profile response. No change needed to preserve this.

---

### Q13 — Would Review/moderation remain unchanged?

**Yes.** This is a read path only. Admin Review queue, approval/rejection flow, and all moderation handlers are unaffected.

---

### Q14 — Would this require schema changes, or only query/API/frontend changes?

**No schema changes needed.** The schema already has `review_state TEXT` on the `truths` table. The backend already returns it. Only frontend navigation/copy changes could improve the UX.

---

### Q15 — Are there privacy/security issues with showing owners their own pending submissions?

**No.** Owner seeing their own content is the baseline expected behavior of any submission UX. The `GET /api/my-humanx` route is already `requireUser`-gated and scoped to the authenticated owner's `user_id`. The pending truth is already returned and rendered in the Me view — it is not newly exposed to any other user.

The only concern would be leaking to the public Truths tab or public profile, but both of those already filter to `review_state='public'` only and are unaffected by this audit.

---

### Q16 — Should the UI label such items clearly as `Pending Review — not public yet`?

**They already are labeled.** `meRecentTruthsHtml()` renders each truth with a badge using `ME_STATE_LABELS` (`{ review: 'Review' }`) and color `ME_STATE_CLR` (`{ review: 'b-yellow' }`). The yellow "Review" badge already distinguishes pending truths from public ones.

The wording "Review" (not "Pending Review — not public yet") could be made more explicit, but it is already distinct and machine-rendered from the actual `review_state` value.

---

### Q17 — Should owner pending items be visually separate from approved/public Truths?

**They already are in My HumanX.** The Me view shows all truths in a separate "Recent Truths" panel with state badges, filtered by `meStateFilter`. The public Truths tab shows only approved truths. These two surfaces are already visually and functionally separate.

---

### Q18 — Should admin Review remain the only approval path?

**Yes.** This audit does not change the Review gate. Pending truths remain in Review until an admin approves or rejects them. No self-approval or owner-bypass path is being proposed.

---

### Q19 — Identify the smallest safe D-285B candidate, if any.

**Narrowed UX gap (not a structural gap):** After `submitTruth()` or `submitBuilderTruth()`, the code navigates to `renderTruths()` (the public tab) where the pending truth is invisible. The owner is not told where to find it while it is pending. The existing toast says "Truth submitted for Review. It will appear publicly after approval." — accurate, but does not point to My HumanX.

**Smallest safe candidate:** Frontend copy-only — add a "You can see it in My HumanX" line to the post-submission toast, OR add a My HumanX navigation hint to the Truth submission form/flow. No backend change needed.

A slightly larger option: change the post-submission navigation from `renderTruths()` to `renderMe()` after Truth submission, so the owner lands in their dashboard where the pending truth is immediately visible. This is a frontend navigation change only.

Either option is frontend-only.

---

### Q20 — Classify D-285B

**Frontend-only.**

- No backend query change needed
- No new API route needed
- No schema change needed
- The backend already returns pending truths via `GET /api/my-humanx`
- The frontend already renders them in My HumanX
- The only gap is post-submission navigation/copy

D-285B can go direct to main (docs + frontend, no backend/migration/schema).

---

### Q21 — Identify exact regression tests needed for D-285B (do not write yet)

| # | Area | What to test |
|---|------|-------------|
| 1 | Backend contract | `GET /api/my-humanx` truths query has NO `review_state` filter — returns pending truths to owner |
| 2 | Frontend render | `meRecentTruthsHtml` renders truths with `review_state` badge using `ME_STATE_LABELS` |
| 3 | Frontend render | Pending truth renders with `ME_STATE_LABELS['review']` = `'Review'` and `ME_STATE_CLR['review']` = `'b-yellow'` |
| 4 | Public boundary | Public profile query retains `COALESCE(review_state,'public')='public'` filter — pending truths absent |
| 5 | Public boundary | `renderTruths()` / `loadTruths()` retains public-only filter — pending truths absent from public tab |
| 6 | Navigation | After `submitTruth()`, navigation behavior is as expected (define expected behavior in D-285B spec) |
| 7 | Copy | Post-submission toast or copy points to My HumanX for pending-truth visibility |
| 8 | State labels | `ME_STATE_LABELS` and `ME_STATE_CLR` are present and correct for all review states |
| 9 | Review gate | Admin Review remains the only approval path (no self-approval action in Me view) |
| 10 | No backend change | `src/worker.js` not modified in D-285B if it is frontend-only copy/nav change |

---

## Summary

**The backend already returns owner pending-Review Truths.** `GET /api/my-humanx` has no `review_state` filter on the truths query and returns all owner truths including `review_state='review'` items. The frontend already renders them in My HumanX with a yellow "Review" state badge.

**The D-283A/D-284A F-1 finding was overstated.** The visibility gap is narrower than described: the owner CAN see their pending truths in My HumanX. The actual UX gap is post-submission navigation — after calling `submitTruth()` or `submitBuilderTruth()`, the code navigates to `renderTruths()` (the public Truths tab) where pending truths are not shown. The owner is not pointed to My HumanX where they can see the pending submission.

**D-285B classification: Frontend-only.** No backend, schema, or migration work needed. Smallest safe scope: add copy or navigation after Truth submission to direct the owner to My HumanX, where their pending truth is already visible.

---

## Static Checks (D-285A baseline)

| Check | Result |
|-------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `3317 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed` |
| `worker-route-static-check.mjs` | `57 passed, 0 failed / 1 known warn` |

Known warn: `/api/u/:slug — known parameterised route; implemented via regex in worker.js, not as a literal string (D-218A documented limitation)`

---

## No Changes Made

| Area | Status |
|------|--------|
| `public/app-v10.js` | Not modified |
| `src/worker.js` | Not modified |
| `src/truths.js` | Not modified |
| `src/analysis-results.js` | Not modified |
| `public/styles.css` | Not modified |
| `public/index.html` | Not modified |
| `public/belief-drift-expansion.js` | Not modified |
| `migrations/` | Not modified |
| `scripts/hardening-smoke-test.mjs` | Not modified |
| Backend/API/schema/storage | No changes |
| Review/moderation handlers | Unchanged |
| Public profile `/u/:slug` | Unaffected |
