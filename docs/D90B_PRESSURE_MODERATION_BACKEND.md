# D-90B — Pressure Point Moderation Backend

**Branch:** `feature/d90b-pressure-moderation-backend`
**PR:** pending (DO NOT MERGE until D-90E production migration applied)
**Date:** 2026-06-07

---

## ⚠️ DO NOT MERGE / DEPLOY BEFORE PRODUCTION D1 MIGRATION

The Worker code in this PR references `pressure_points.review_state`, `pressure_points.report_count`, and `pressure_points.updated_at`. These columns do not yet exist in the production D1 database. **If this Worker code is deployed before migration 0009 is applied, every `addPressure` INSERT will fail and every `reviewQueue` pressure query will error.**

**Required sequence:**
1. This PR is merged to `main` (code review only, not deployed)
2. D-90C frontend PR reviewed and merged
3. D-90E: user explicitly approves production D1 migration 0009 in session → applied via Cloudflare D1 Console
4. Worker deployed (Cloudflare pushes automatically on merge to main or via Wrangler — confirm deploy gating)

---

## What Changed

### New File: `migrations/0009_add_pressure_review_state.sql`

Created migration file — **NOT applied to production**. Adds three columns and two indexes to `pressure_points`:

```sql
ALTER TABLE pressure_points ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE pressure_points ADD COLUMN report_count INTEGER DEFAULT 0;
ALTER TABLE pressure_points ADD COLUMN updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_pressure_points_review_state ON pressure_points (review_state);
CREATE INDEX IF NOT EXISTS idx_pressure_points_report_count ON pressure_points (report_count);
```

`DEFAULT 'public'` ensures all existing rows remain publicly visible after migration — no retroactive hiding.

### `src/worker.js`

#### A. `addPressure`

**Before:** inserted 7 columns, called `recalcClaimScore` immediately.

**After:** inserts 10 columns including `review_state='review'`, `report_count=0`, `updated_at=now`. Does NOT call `recalcClaimScore`. Pending pressure does not affect claim score.

Response now includes `review_state:'review'` and `report_count:0`.

```js
// New INSERT
INSERT INTO pressure_points
  (id, claim_id, user_id, title, body, severity, review_state, report_count, updated_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// bound: ..., 'review', 0, now, now
```

#### B. `getClaim` — pressure query

**Before:** `WHERE p.claim_id=?`
**After:** `WHERE p.claim_id=? AND COALESCE(p.review_state,'public')='public'`

Pending/rejected pressure is not returned to public callers.

#### C. `claimDetail` — pressure query

**Before:** `WHERE claim_id=? ORDER BY created_at DESC`
**After:** `WHERE claim_id=? AND COALESCE(review_state,'public')='public' ORDER BY created_at DESC`

This fixes RunPack inclusion automatically — `createAipPacket` calls `claimDetail` for its payload. Pending pressure no longer enters investigation packets.

#### D. `reviewQueue` — pressure items added

New query added alongside claims/truths/evidence:

```sql
SELECT 'pressure' AS target_type,
       p.id, p.claim_id, p.title, p.body, p.severity,
       p.review_state, p.report_count, p.created_at, p.updated_at,
       c.claim AS parent_claim, u.handle
FROM pressure_points p
LEFT JOIN claims c ON c.id=p.claim_id
LEFT JOIN users u ON u.id=p.user_id
WHERE COALESCE(p.review_state,'public') NOT IN ('public','archived')
   OR p.report_count > 0
ORDER BY p.created_at DESC LIMIT 100
```

Response now includes a `pressure` array alongside `claims`, `truths`, `evidence`.
`pressureRows` are included in the merged `review` sort array.

#### E. `reviewDecision` — pressure branch

New branch added:

```js
if (targetType === 'pressure') {
  // UPDATE pressure_points SET review_state=?, report_count=0, updated_at=? WHERE id=?
  // UPDATE reports SET status=? WHERE target_type='pressure' AND target_id=? AND status='open'
  // SELECT p.*, c.claim AS parent_claim ... WHERE p.id=?
  // recalcClaimScore(env, row.claim_id)  ← score updates on approve/reject
  return json({ ok: true, targetType: 'pressure', decision, item: row });
}
```

Allowed target type error updated: `allowed:['claim','truth','evidence','pressure']`

#### F. `reportTarget` — pressure branch

New branch added after evidence branch:

```js
if (targetType === 'pressure') {
  UPDATE pressure_points
    SET report_count=report_count+1,
        review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END,
        updated_at=?
    WHERE id=?
}
```

Auto-escalates to `review_state='review'` at 2 reports — same pattern as evidence.

### `src/claim-scoring.js`

**Before:** `SELECT severity FROM pressure_points WHERE claim_id=?`
**After:** `SELECT severity FROM pressure_points WHERE claim_id=? AND COALESCE(review_state,'public')='public'`

Pending, rejected, and archived pressure rows are excluded from the score formula. Only publicly-approved pressure rows contribute to `pressureSeverity` and `contradictions`.

---

## Scoring Impact

After D-90E (production migration + Worker deploy):

- New pressure inserts go to `review_state='review'` → excluded from score → claim survivability unchanged on submit
- Admin approves pressure → `reviewDecision` sets `review_state='public'` → `recalcClaimScore` called → survivability drops, contradictions incremented
- Admin rejects pressure → `review_state='rejected'` → `recalcClaimScore` called → score unchanged (rejected row excluded)
- Old/existing pressure rows stay at `DEFAULT 'public'` → behaviour unchanged until individually moderated

---

## Review Queue Impact

Admin `GET /api/review` now returns a `pressure` array alongside `claims`, `truths`, `evidence`. Pending pressure items appear in the merged `review` list sorted by `created_at`. No existing queue behaviour is changed.

---

## Report Escalation Impact

Users can now report pressure items via `POST /api/report` with `targetType: 'pressure'`. At 2 reports, `review_state` is set to `'review'` (hidden from public). For new pressure (already in `'review'`), the escalation path is redundant but harmless. Its primary value is for old public pressure rows that receive reports post-migration.

---

## Static Check Output

```
node --check src/worker.js          → syntax OK (exit 0)
node --check src/claim-scoring.js   → syntax OK (exit 0)
node --check public/app-v10.js      → syntax OK (exit 0)
hardening-smoke-test.mjs            → 175 passed, 0 failed
belief-engine-static-check.mjs      → 24 passed, 0 failed (24 hard checks)
worker-route-static-check.mjs       → 39 passed, 0 failed (39 hard checks)
```

Hardening count increased from **161 → 175** (+14 new tests in Section 30; D-42B test updated to include `'pressure'` in allowed list).

---

## Safety Notes

1. **Migration-first deployment required.** Never deploy this Worker to a DB without migration 0009 applied. `addPressure` INSERT references columns that don't exist pre-migration.
2. **No production D1 calls in this PR.** No Wrangler, no D1 execute, no live endpoint calls.
3. **Existing pressure rows default public.** `DEFAULT 'public'` in the migration means all pre-migration pressure rows remain visible and scored exactly as before.
4. **No bulk state changes.** Old pressure rows are not retroactively moved to `review`. They stay public until individually moderated.
5. **Scoring backfill not needed.** After migration + deploy, scores self-correct on next scoring trigger (next `addEvidence`, `reviewDecision`, or `reportTarget` event on that claim). A future batch-recalc across all claims is optional.

---

## Future Steps

| Batch | Action | Gate |
|-------|--------|------|
| D-90C | Frontend review UI support (branch + PR) — `reviewCard` pressure branch, inspect fields, filter chip, toast update | None — frontend only |
| D-90D | Docs-only validation checkpoint — static checks, gap closure confirmation | None — docs only |
| D-90E | Production D1 migration 0009 apply — explicit per-session approval + PRAGMA preflight | **Explicit approval required** |
| Deploy | Worker deployed to production after D-90E confirms migration applied | After D-90E |
| D-90F | Manual live pressure lifecycle test (submit → review queue → approve → score change → RunPack) | **Explicit approval required** |

---

## Files Changed

| File | Change |
|------|--------|
| `migrations/0009_add_pressure_review_state.sql` | New — migration file (NOT RUN) |
| `src/worker.js` | `addPressure`, `getClaim`, `claimDetail`, `reviewQueue`, `reviewDecision`, `reportTarget` |
| `src/claim-scoring.js` | `recalcClaimScore` pressure query filter |
| `scripts/hardening-smoke-test.mjs` | Section 30 (+14 tests); D-42B allowed-list test updated |
| `docs/README.md` | Hardening count updated 161 → 175 |
| `docs/PROJECT_STATE.md` | D-90B entry added |
| `docs/D90B_PRESSURE_MODERATION_BACKEND.md` | This file |
