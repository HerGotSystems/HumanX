# D-138D — User Archive/Export Checkpoint

**Date:** 2026-06-21
**Chain:** D-138A (audit) → D-138B (backend foundation) → D-138C (frontend controls) → D-138D (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-138 Chain

### D-138A — User-owned delete/archive/export audit
Read-only audit of what safe ownership controls My HumanX needed once users could see their own content (D-137). Reviewed existing admin archive patterns (`reviewCleanup()`, `markDuplicate()`), the `user_id`/`review_state` schema across all owned tables, and the `x-humanx-user` spoofing limitation. Concluded: soft-archive only (reuse `review_state='archived'` with a new `archived_by_user` flag so it's distinguishable from admin cleanup), full JSON export, no hard delete, no restore in v1, evidence/pressure archiving must check for cross-claim reuse before archiving. No code changed.

### D-138B — User-owned archive/export backend foundation
Added `migrations/0012_user_owned_archive_export.sql` (gated, additive only). Added two Worker endpoints in `src/worker.js`:
- `POST /api/my-humanx/archive` — `archiveMyHumanXItem()`. Requires `x-humanx-user` via `requireUserId()`, never accepts a target-user id. Ownership enforced via `WHERE id=? AND user_id=?` — `404 NOT_FOUND_OR_NOT_OWNED` on any mismatch (never confirms row existence to a non-owner). Blocks `PROTECTED_SEEDS`/seed-id-prefix/dev-handle rows with `403 PROTECTED`. Blocks evidence (via its primary `claim_id` plus the `evidence_claim_links` bridge table) and pressure (via `claim_id`) still cited by another user's *public* claim with `409 STILL_REFERENCED`. Otherwise sets `review_state='archived'`, `archived_by_user=1`, `updated_at=now`. No `DELETE FROM` anywhere in the function.
- `GET /api/my-humanx/export` — `exportMyHumanX()`. Requires `x-humanx-user`, never accepts a target-user id, rate-limited 5/hr/user. Full, uncapped export across nine owned tables (users, claims, truths, evidence, pressure_points, belief_snapshots, claim_votes, evidence_votes, truth_votes, home_tests), every query filtered `WHERE user_id=?`. Explicit `users` column list (never `SELECT *`) omits `is_admin` and any admin-token material. Sets `Content-Disposition: attachment; filename="humanx-export-<user_id>.json"`.

### D-138C — My HumanX archive/export frontend controls
Wired the dashboard to the D-138B backend:
- Export button in the account card (`exportMyHumanXData()`) — calls `GET /api/my-humanx/export` via the shared `api()`/`headers()` pattern (never an admin header), builds a downloadable `Blob` client-side, toasts on success/failure.
- Archive action (`meArchiveItemUI()`) on each non-archived own claim/truth/evidence/pressure row — gated by `!isArchived` so already-archived rows never show the button. Confirms via `hxModal()` with copy explicitly stating the item "does not delete it" before `POST /api/my-humanx/archive {targetType,targetId}`. On success, reloads the dashboard via `renderMe()` (a real re-fetch of `/api/my-humanx`, not a stale-cache re-render). On failure, `meArchiveErrorMessage()` maps `STILL_REFERENCED`/`PROTECTED`/`NOT_FOUND_OR_NOT_OWNED` to distinct, human-readable toasts.
- Belief snapshots deliberately excluded — no archive action rendered, since no backend endpoint exists for them yet.
- No Delete-labeled button, no `DELETE` method call, no restore button, no public profile/share/comments UI, and the archive action is not wired into the admin Review Queue (it stays scoped to My HumanX only).

---

## Production Confirmed (owner-smoked)

- Export downloads a JSON file.
- Archive confirmation modal appears before any archive action runs.
- The modal clearly states the item is hidden, not deleted.
- A protected item returns a clear "protected" toast.
- The rest of the My HumanX dashboard remains usable (filters, show-all/show-less, public Study opening, account panel) after the archive/export controls were added.
- No hard-delete UI exists anywhere in the archive/export controls.
- No restore UI exists.
- Belief snapshot archive remains deferred (no backend endpoint, no frontend action).
- Home, Truths, and Review pages still work unchanged.

---

## API Added

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/my-humanx/archive` | `x-humanx-user` | Soft-archives the caller's own claim/truth/evidence/pressure row. Ownership via `WHERE id=? AND user_id=?`. Blocks protected/seed/dev-handle rows (`403 PROTECTED`) and evidence/pressure still cited by another user's public claim (`409 STILL_REFERENCED`). Sets `review_state='archived'`, `archived_by_user=1`. No hard delete, no restore endpoint yet. |
| `GET` | `/api/my-humanx/export` | `x-humanx-user`, rate-limited 5/hr/user | Full, uncapped JSON export of the caller's own data across nine owned tables. Always scoped to the requester's own `x-humanx-user` — never accepts a target user id. `Content-Disposition: attachment`. Omits `is_admin` and admin-token material. |

---

## Migration Added

`migrations/0012_user_owned_archive_export.sql` (gated, additive only — no `DROP`, no `DELETE`, no removed columns):

- `archived_by_user INTEGER DEFAULT 0` on `claims`, `truths`, `evidence`, `pressure_points` — disambiguates a user-initiated archive from an admin `reviewCleanup()` archive without changing `review_state` semantics or any existing queue-exclusion query.
- `hidden_at INTEGER` on `belief_snapshots` — belief_snapshots had no state column at all before this migration (immutable, insert-only table); this is its first soft-hide mechanism, not yet wired to any endpoint.
- `updated_at INTEGER` on `evidence` — evidence previously had no `updated_at` column; needed so the archive endpoint can stamp evidence rows the same way it stamps claims/truths/pressure_points.
- `CREATE INDEX IF NOT EXISTS idx_belief_snapshots_hidden_at ON belief_snapshots(hidden_at)`.

---

## Frontend Added

- Export button in the My HumanX account card (`public/app-v10.js`: `exportMyHumanXData()`).
- Archive buttons on claims/truths/evidence/pressure rows (`meRecentClaimsHtml`, `meRecentTruthsHtml`, `meRecentEvidenceHtml`, `meRecentPressureHtml`), gated behind `!isArchived`.
- Confirmation modal (`meArchiveItemUI()` via the shared `hxModal()` pattern).
- Distinct user-facing messages for `STILL_REFERENCED` / `PROTECTED` / `NOT_FOUND_OR_NOT_OWNED` (`meArchiveErrorMessage()`).
- No delete wording or action anywhere except the explicit "does not delete it" reassurance copy in the confirmation modal.
- CSS: `.me-account-actions`, `.me-item-row button.danger` (`public/styles.css`).

---

## Safety Model

- **Soft archive only** — every archive path sets `review_state='archived'` plus `archived_by_user=1`. No table in this chain ever receives a `DELETE FROM`.
- **Ownership scoped by `x-humanx-user`** — both endpoints derive the acting user solely from `requireUserId(request)`; neither accepts a target-user id from the request body, query string, or anywhere else.
- **Protected seed/dev content blocked** — `PROTECTED_SEEDS`, seed-id-prefix patterns (`clm_seed_`/`tru_seed_`/`evd_seed_`/`prs_seed_`), and `DEV_HANDLES` all return `403 PROTECTED` before any write.
- **Cross-claim reference protection** — evidence/pressure rows still cited by another user's *public* claim cannot be archived (`409 STILL_REFERENCED`), preventing a user from silently breaking someone else's public claim's evidence list.
- **Export is self-scoped only** — no target-user parameter exists on `/api/my-humanx/export`; it can only ever return the caller's own data.
- **`x-humanx-user` is still unsigned and spoofable** — this entire chain inherits that pre-existing limitation from D-136/D-137. Ownership checks are correct *given* the identity in the header, but the header itself has no cryptographic guarantee. This is not final auth security — it is the same trust model the rest of the platform already operates under.

---

## Explicit Known Limitations

| Limitation | Detail |
|---|---|
| **`x-humanx-user` is still unsigned and spoofable** | No cookie or session signing exists. Any client can claim any `usr_*` id via the header. Archive/export ownership checks are only as strong as this identity model — signed sessions or magic links are a prerequisite for stronger guarantees, not something this chain attempted to fix. |
| **Restore is deferred** | There is no `POST /api/my-humanx/restore` and no restore button. An archived item stays archived until an admin manually changes its `review_state` via the existing Review Queue tooling. |
| **Hard delete is intentionally absent** | No `DELETE FROM` exists anywhere in this chain, by design — irreversible deletion was explicitly out of scope for v1 per the D-138A audit. |
| **Belief snapshot archive endpoint/UI deferred** | `belief_snapshots.hidden_at` exists in the schema (migration 0012) but has no reading or writing endpoint and no frontend action yet. |
| **No public profile/sharing/comments** | This chain only ever operates on the caller's own private My HumanX view — no public-facing surface was added or changed. |
| **Export is JSON only** | `GET /api/my-humanx/export` returns a raw JSON download. There is no formatted/human-readable report view yet. |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 763 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed
```

---

## Recommended Next Implementation

**D-139A — Belief Mirror / personal profile usefulness audit**

Ownership, export, and archive are now safe enough that the next value isn't more list-management — it's making the user's own My HumanX page actually meaningful, not just a paginated list of rows. A read-only audit should look at how belief snapshots, claims, and truths could be synthesized into a personal "mirror" view (patterns over time, stability/openness/pressure trends, a plain-language summary of what the user has been claiming and how it's held up) — building on the Belief Engine's existing scoring (`stability_score`, `openness_score`, `pressure_score`) rather than introducing new ML/AI inference.
