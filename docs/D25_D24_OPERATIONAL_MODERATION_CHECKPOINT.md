# D-25: D-24 Operational Moderation Checkpoint

Date: 2026-06-06
Status: Docs-only. No code changes, no backend changes, no D1 changes, no Wrangler.

---

## Overview

D-24 is the completed operational moderation chain for HumanX. It spans seven sub-batches (D-24A → D-24G) covering navigation context preservation, RunPack provenance tracking, backend duplicate-resolution routes, moderator UI controls, a schema-gap migration, and Claims/Arena scroll restoration continuity.

All seven batches are live on `main` as of 2026-06-06.

---

## D-24 sub-batch summary

### D-24A — Study navigation context preservation (`4aef4e5`)

Added `lastModeBeforeStudy` and `lastInspectedReviewItemId` module-level state variables. `setMode()` resets the origin tracker on explicit navigation. `studyFromVault()` sets vault origin; `openReviewClaimStudy()` sets review origin and saves the inspected item ID. `backToArena()` routes back to the correct originating mode and restores the previously inspected review item from the queue. `renderStudy()` shows a context-aware back button ("← Back to Review" / "← Back to Vault" / "← Back").

No backend changes. No moderation behaviour changed.

---

### D-24B — RunPack provenance Phase 1 (`16fa131`)

Added `lastPacketMeta` state and four helper functions: `generatePacketId`, `simpleClaimHash`, `buildProvenanceMeta`, `detectPacketStaleness`. All generated packets now include `packet_id`, `runpack_version: '1.2'`, `generated_at`, `source_claim_id`, `source_snapshot_hash`, `evidence_count`, `pressure_count`, `test_count`, `humanx_app_version`, and `is_fallback`. `runPackSummary` shows a non-blocking advisory "Possibly stale" chip when counts or age drift. `saveAnalysisResult` shows a non-blocking advisory toast on `packet_id` mismatch.

No backend changes. No blocking logic. No schema migration.

---

### D-24C — Backend moderation D1 audit (docs-only, `docs/D24C_BACKEND_MODERATION_D1_AUDIT.md`)

Full audit of the production D1 schema against moderation requirements. Key findings:

- `duplicate_of` column exists in migration 0003 but is not written by any route and not exposed by `mapClaim`.
- `near_duplicate_of` is live in production (added manually during D-10A) but absent from all migration files — schema gap documented.
- `review_state` is an unconstrained TEXT column; `'duplicate'` exists as a frontend CSS value but has no backend write path.
- `reviewDecision` allowed set is `'public'`, `'review'`, `'rejected'` only.
- `reviewQueue` SQL excludes only `'archived'` — `'duplicate'` would slip through until fixed.
- Safe 5-step implementation sequence documented for D-24D/E.

No code changes.

---

### D-24D — Moderator duplicate-resolution backend routes (`f2def3b`, PR #86, merged)

Two new admin-only endpoints added to `src/worker.js`:

- `POST /api/review/mark-duplicate` — validates both claims exist and are distinct; rejects self-duplicates and ineligible sources (already archived or duplicate); writes `duplicate_of` + `review_state='duplicate'`; source claim record preserved (not deleted).
- `POST /api/review/resolve-similar` — clears `near_duplicate_of` (sets NULL); no-op guard if field is already null; returns previous value for audit log.

`mapClaim` updated to expose `duplicateOf` field. `reviewQueue` SQL updated to exclude `review_state='duplicate'` alongside `'archived'`; `duplicate_total` added to queue metadata. Both routes added to `HIGH_RISK_ROUTES` in `worker-route-static-check.mjs`; hard check count 35 → 39.

No frontend changes. No migrations.

---

### D-24E — Moderator duplicate-resolution frontend controls (`5dc33e4`)

`renderReviewInspectPanel` updated with a `dupSection` block containing two context-aware buttons:

- **"Mark Duplicate…"** — hidden for claims already in `archived` or `duplicate` state. Opens `hxModal` with a target claim ID input and optional reason field; calls `POST /api/review/mark-duplicate` via `adminHeaders()`; clears inspect panel and reloads queue on success.
- **"Dismiss ~Similar"** — hidden when `nearDuplicateOf` is null (no advisory). Opens `hxModal` for confirmation; calls `POST /api/review/resolve-similar`; reloads queue on success.

Both functions (`markDuplicateUI`, `resolveSimilarUI`) exposed on `window`. CSS adds muted purple (`review-inspect-markdup`) and muted steel-blue (`review-inspect-resolvesim`) button styles, visually distinct from primary Approve/Reject. 4 new hardening smoke checks; count 91 → 95.

No backend/D1/Worker/migration changes.

---

### D-24F — Migration 0006 proposal (docs + migration file)

Created `migrations/0006_add_near_duplicate_of.sql` to close the schema gap documented in D-24C:

```sql
ALTER TABLE claims ADD COLUMN near_duplicate_of TEXT;
CREATE INDEX IF NOT EXISTS idx_claims_near_duplicate_of ON claims (near_duplicate_of);
```

**Production safety:** Do NOT apply to production. The column and index already exist there (added manually during D-10A). Applying on production will fail with "duplicate column name". This file is for fresh D1 rebuilds only. Always run `PRAGMA table_info(claims)` to confirm the column is absent before executing.

D-24C audit schema-gaps table updated to mark all three gaps as closed. Backend/D1 safety rule added to `docs/PROJECT_STATE.md`.

No code changes. No Wrangler. No D1 commands.

---

### D-24G — Claims/Arena scroll restoration (`969dfea`)

Three-line patch to `public/app-v10.js`:

1. Added state variable `let lastArenaScrollTop = 0;` alongside `lastModeBeforeStudy`.
2. In `selectClaim`, before calling `renderStudy()`, when `lastModeBeforeStudy === 'arena'`: captures `document.getElementById('main').scrollTop` into `lastArenaScrollTop`.
3. In `backToArena` arena branch, immediately after `setMode('arena')` returns (synchronous render path — no `requestAnimationFrame` needed): restores `#main.scrollTop = lastArenaScrollTop`.

Both capture and restore are null-guarded on `#main`. 3 insertions, 2 deletions.

No backend changes.

---

## What is now operational

| Capability | Status |
|-----------|--------|
| Study navigation tracks originating mode (Arena / Review / Vault) | ✅ Live |
| Back button in Study routes to correct origin | ✅ Live |
| Review → Study → Back restores inspected item | ✅ Live |
| Claims/Arena scroll position preserved across Study round-trip | ✅ Live |
| RunPack packets carry `packet_id`, `generated_at`, evidence snapshot | ✅ Live |
| RunPack stale advisory chip when counts or age drift | ✅ Live |
| AI return mismatch advisory toast | ✅ Live |
| `POST /api/review/mark-duplicate` backend route | ✅ Live |
| `POST /api/review/resolve-similar` backend route | ✅ Live |
| `reviewQueue` excludes `review_state='duplicate'` | ✅ Live |
| `duplicate_total` in queue metadata | ✅ Live |
| `mapClaim` exposes `duplicateOf` field | ✅ Live |
| "Mark Duplicate…" button in Review inspect panel | ✅ Live |
| "Dismiss ~Similar" button in Review inspect panel | ✅ Live |
| Migration 0006 for `near_duplicate_of` (fresh rebuilds only) | ✅ File present |

---

## What remains advisory-only

| Item | Notes |
|------|-------|
| `claimQualityHints()` quality flags | Advisory only — no blocking, no score changes |
| "Possibly stale" RunPack chip | Advisory only — packet still usable |
| "~Similar" advisory in Review queue | Advisory only — no auto-merge, no suppression |
| `packet_id` mismatch toast | Advisory only — non-blocking |
| `near_duplicate_of` similarity flag | Advisory only — no automatic deduplication |

---

## What remains forbidden / unsafe

| Forbidden action | Reason |
|-----------------|--------|
| Apply migration 0006 to production | Column already exists — will fail with "duplicate column name" |
| Rerun migrations 0004 or 0005 | Already applied to production — will fail |
| Run `wrangler d1 execute` or `wrangler deploy` | Off-limits without explicit per-session user approval |
| Run live write smoke tests | Off-limits without explicit per-session user approval |
| Merge backend/D1/Worker/migration changes directly to main | Always branch + PR |
| Add `'duplicate'` to `reviewDecision` allowed set | Dedicated `mark-duplicate` endpoint is the correct path |
| Automatic deduplication or silent merges | Not implemented, must not be added |

---

## Static checks summary

As of D-24G:

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | No output, exit 0 |
| `node --check src/worker.js` | No output, exit 0 |
| `hardening-smoke-test.mjs` | **95 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed (39 hard checks)** |

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking (missing `"type":"module"` in root `package.json`).

---

## Manual / live testing status

**Not yet performed.** All D-24D/E endpoint testing (mark-duplicate, resolve-similar) against the live Cloudflare Worker + D1 database is deferred. Any live write test requires explicit per-session user approval before execution. The live app at `humanx.rinkimirikata.com` is reachable (Cloudflare Worker deployed, DNS confirmed), but no write operations have been verified against production in this batch.

---

## Suggested safe-next-work

1. **Manual live UI testing** — when the user is ready to open a browser session against `humanx.rinkimirikata.com` and manually exercise the new duplicate-resolution buttons.
2. **RunPack provenance Phase 2** — worker-side `packet_id` generation (branch + PR required); plan in `docs/D23_RUNPACK_PROVENANCE_PLAN.md`.
3. **Live read smoke** — `scripts/read-endpoint-smoke-test.mjs` from a non-Windows-sandbox environment (CI, WSL with curl's CA bundle) to verify public endpoints without write risk.
4. **No live write smoke** without explicit per-session approval.
5. **No production migration 0006 apply** unless `PRAGMA table_info(claims)` first confirms `near_duplicate_of` is absent.
