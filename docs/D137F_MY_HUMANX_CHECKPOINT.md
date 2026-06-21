# D-137F — My HumanX Checkpoint

**Date:** 2026-06-21
**Chain:** D-137A (audit) → D-137B (backend) → D-137C (truth claimed-state clarity) → D-137D (dashboard frontend) → D-137E (scan/polish pass) → D-137F (this doc)
**Scope:** Documentation only. No code changes. No D1 migration.

---

## Summary of the D-137 Chain

### D-137A — My HumanX personal dashboard audit
Read-only implementation audit of what it would take to show a user their own owned content (claims, truths, evidence, pressure, belief snapshots) in one place, scoped to their `user_id`. Built directly on the verified-identity surface added in D-136 and the provenance work from D-135A. No code changed.

### D-137B — My HumanX backend endpoint
Added `migrations/0011_user_content_indexes.sql` (indexes on `user_id` for `claims`/`truths`/`evidence`/`pressure_points`/`belief_snapshots` to keep per-user lookups cheap). Added `GET /api/my-humanx` to `src/worker.js` (`myHumanX()`): requires `x-humanx-user`, returns the current user row, per-state counts for claims/truths/evidence/pressure, and the 20 most recent claims/truths/evidence/pressure rows (10 most recent belief snapshots), all filtered strictly by the caller's own `user_id`. Never accepts a target-user id or query parameter. Omits `is_admin` and any admin-token material.

### D-137C — Truth claimed-state clarity
Added `linked_claim_review_state` to `listTruths`'s `LEFT JOIN claims` in `src/truths.js` so the frontend can tell whether a truth's converted claim is public, pending, rejected, archived, or a duplicate — instead of a generic "claim derived" chip. `truthClaimStateMeta()` in `public/app-v10.js` renders state-specific badges and buttons (e.g. public state opens Study directly; rejected/archived/duplicate render a muted, non-primary button instead of inviting a fresh resubmit).

### D-137D — My HumanX dashboard frontend
Added a `Me` nav tab (`public/index.html`) and `renderMe()`/`renderMeHtml()` in `public/app-v10.js`: a read-only dashboard against `GET /api/my-humanx`. Renders an account card (Verified/Anonymous, display name, email, handle, user id), a content-counts panel (claims/truths/evidence/pressure, broken out by all five review states), and Recent Claims/Truths/Evidence/Pressure + Belief Snapshots lists. Public claims/truths render an explicit Open Study / View in Truths action; non-public rows never render a clickable claim-open action (evidence/pressure show the parent claim id as plain `<code>` text only). `openMyClaimStudy()` sets `lastModeBeforeStudy='me'` so Back from Study returns to Me. No share buttons, no public profile, no target-user parameter.

### D-137E — Scan/polish pass
Owner smoke after D-137D flagged the dashboard as useful but too long, with Recent Evidence/Pressure dominating vertical space. Reworked the same dashboard in place:
- Each list section (Recent Claims, Belief Snapshots, Recent Truths, Recent Evidence, Recent Pressure) now caps at 5 visible items by default (`ME_VISIBLE_CAP`), with a per-section **Show all / Show less** toggle (`meExpanded`, `meToggleExpand()`) — all returned data stays cached client-side (`meData`), no new backend query.
- Added a state filter bar (`meFilterBarHtml()`) — All / Public / Review / Rejected / Archived / Duplicate — applied client-side to claims/truths/evidence/pressure lists only (`meFilterRows()`). Belief snapshots and the counts panel are unaffected by the filter; counts always read from `data.counts` (server-side full totals).
- Reordered sections: Account → My Content counts → Recent Claims → **Belief Snapshots** → Recent Truths → Recent Evidence → Recent Pressure (snapshots promoted ahead of the two largest, most repetitive sections).
- Item rows now lead with the state badge, then the item text, then a relative date/updated stamp (`reviewAge()`); evidence/pressure titles are truncated via `shortText()` to avoid long-body overflow.
- Public-claim Open Study gating, non-public no-open behavior, and Back-to-Me navigation were preserved unchanged through the rewrite.

---

## Production Confirmed (owner-smoked)

- Me tab works.
- Verified account card is visible (display name / email / handle / user id, Verified/Anonymous state).
- User content counts are visible, broken out by review state, and remain full totals regardless of the active filter.
- State filters work (All / Public / Review / Rejected / Archived / Duplicate).
- Recent Claims, Truths, Evidence, and Pressure sections are visible.
- Belief snapshots are visible.
- Show all / Show less works per section.
- Public claim Study opens correctly, and Back returns to Me.
- Non-public items do not open broken pages (evidence/pressure show parent claim id as plain text; non-public claims/truths render no open action).

---

## Files Touched Across D-137

| File | Change |
|------|--------|
| `migrations/0011_user_content_indexes.sql` | D-137B: indexes on `user_id` for claims/truths/evidence/pressure_points/belief_snapshots |
| `src/worker.js` | D-137B: `myHumanX()` + `GET /api/my-humanx` route |
| `src/truths.js` | D-137C: `listTruths` exposes `linked_claim_review_state` via `LEFT JOIN claims` |
| `public/index.html` | D-137D: `Me` nav tab |
| `public/app-v10.js` | D-137C: `truthClaimStateMeta`, `TRUTH_CLAIM_STATE_BADGES`, `openTruthClaimStudy`; D-137D: `renderMe`, `renderMeHtml`, `meAccountCardHtml`, `meCountsRow`, `meRecentClaimsHtml`/`meRecentTruthsHtml`/`meRecentEvidenceHtml`/`meRecentPressureHtml`, `meBeliefSnapshotsHtml`, `openMyClaimStudy`; D-137E: `ME_VISIBLE_CAP`, `ME_FILTER_STATES`, `meData`/`meExpanded`/`meStateFilter`, `meRerender`, `meSetFilter`, `meToggleExpand`, `meFilterRows`, `meVisibleSlice`, `meShowAllControl`, `meFilterBarHtml` + section reorder + row layout rewrite |
| `public/styles.css` | D-137D: `.me-account-card`, `.me-counts-panel`, `.me-item-list`/`.me-item-row` family; D-137E: `.me-filter-bar`, `.me-filter-btn`, `.me-toggle` |
| `scripts/hardening-smoke-test.mjs` | D-137B/C/D/E: Sections 60–63 (My HumanX backend, truth claimed-state, dashboard frontend, scan/polish); D-137F: README smoke-count guard extended to accept `724 passed, 0 failed` |
| `docs/API_ENDPOINT_INVENTORY.md` | D-137B: documented `GET /api/my-humanx` |
| `docs/D137F_MY_HUMANX_CHECKPOINT.md` | D-137F: this doc |
| `docs/README.md` | D-137F: ⭐ CURRENT pointer + smoke count updated |

**Not changed:** any existing route's behavior or response shape, `/api/me`, `/api/auth/invite/*`, anonymous flow, `is_admin` authorization logic, claim/truth/evidence/pressure/review submission or moderation endpoints.

---

## API Added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/my-humanx` | `x-humanx-user` | Returns the current user's own account row, per-state content counts, and recent claims/truths/evidence/pressure/belief-snapshot rows. Always scoped to the requester's own `x-humanx-user` — never accepts a target user id. Lists capped server-side (20 claims/truths/evidence/pressure, 10 belief snapshots); display-side capping/filtering (5-item default, state filter) is handled entirely client-side in D-137E. Omits `is_admin` and admin-token material. |

---

## Explicit Known Limitations

| Limitation | Detail |
|---|---|
| **`x-humanx-user` is still unsigned and spoofable** | No cookie or session signing exists. Any client can claim any `usr_*` id via the header. This predates D-137 and is not fixed by it — My HumanX simply scopes every query to whatever identity the header claims. |
| **No public profile yet** | My HumanX is a private, self-only view. There is no public-facing user profile page. |
| **No sharing yet** | No share links, no "share my dashboard" affordance, no public/anonymized export of dashboard content. |
| **No comments/challenges yet** | No social interaction layer (comments, replies, challenges) exists on claims/truths/evidence/pressure from this dashboard or elsewhere. |
| **No delete/export account tools yet** | Users can view but not delete, archive, or export their own submissions from My HumanX. This is the explicit gap D-138A targets. |
| **My HumanX currently uses current local user identity only** | The dashboard reflects whatever `x-humanx-user` the current browser/localStorage holds — there is no cross-device account linking beyond the invite-verification identity upgrade from D-136. |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 724 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed
```

---

## Recommended Next Implementation

**D-138A — User-owned delete/archive/export audit**

Now that users can see their own content in one place via My HumanX, they need safe controls for hiding, deleting, or exporting their own submissions before any public social features (profile, sharing, comments) are introduced. A read-only audit should map which content types are safe to hard-delete vs. soft-archive (e.g. claims with public evidence/pressure attached, truths with converted claims), what the export format should be, and what guardrails (confirmation, rate limits, irreversibility warnings) are needed before any write endpoint is built.
