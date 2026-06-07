# D-90A — Pressure Point Moderation Implementation Plan

**Date:** 2026-06-07
**Type:** Read-only planning doc — no code changes, no migrations, no D1 writes
**Status:** PLAN ONLY — not implemented

---

## 1. Scope and Safety

This document is a read-only audit and implementation plan. No code was changed, no migration files were created, no D1 commands were executed, no live endpoints were called, and no write tests were run. The only output is this documentation file and an update to `docs/PROJECT_STATE.md`.

All items marked `NOT RUN`, `GATED`, or referencing future batches D-90B through D-90F are plans only. None has been executed.

---

## 2. Current Pressure Point Flow

### 2.1 Insertion — `addPressure` (`src/worker.js` line 84)

`POST /api/pressure` calls `addPressure(request, env)`:

```js
async function addPressure(request, env) {
  const userId = await requireUser(request, env);          // shadow-ban enforced (D-89C)
  await safeRateLimit(request, env, `pressure:${ip(request)}`, 20, 3600000);
  const body = await readJson(request);
  const claimId = cleanId(body.claimId);
  const title = cleanText(body.title || 'Pressure point', 120);
  const note = cleanText(body.body || body.note || '', 1200);
  if (!claimId || note.length < 3) return json({ error: 'BAD_PRESSURE' }, 400);
  await ensureUser(env, userId);
  const now = Date.now();
  const pressureId = makeId('prs');
  const severity = Math.max(1, Math.min(5, Number(body.severity || 1)));
  await env.DB.prepare(
    `INSERT INTO pressure_points (id,claim_id,user_id,title,body,severity,created_at) VALUES (?,?,?,?,?,?,?)`
  ).bind(pressureId, claimId, userId, title, note, severity, now).run();
  await recalcClaimScore(env, claimId);                    // score recalc IMMEDIATELY after insert
  return json({ pressure: { id: pressureId, claim_id: claimId, title, body: note, severity, created_at: now },
                claim: await claimOnly(env, claimId) });
}
```

**Problems:**
- No `review_state` column — pressure is permanently visible from the moment of insertion.
- `recalcClaimScore` is called immediately after every insert, including from untrusted users.
- The row is inserted into `pressure_points` without any moderation gate.

### 2.2 Fetch in `getClaim` (`src/worker.js` line 78)

```js
const pressure = await env.DB.prepare(
  `SELECT p.*, u.handle FROM pressure_points p LEFT JOIN users u ON u.id=p.user_id
   WHERE p.claim_id=? ORDER BY p.created_at DESC`
).bind(claimId).all();
```

**No `review_state` filter.** All pressure points for a claim are returned regardless of state.

### 2.3 Fetch in `claimDetail` (`src/worker.js` line 163)

```js
const pressure = await env.DB.prepare(
  `SELECT id, created_at, title, body, severity FROM pressure_points
   WHERE claim_id=? ORDER BY created_at DESC`
).bind(claimId).all();
```

**No `review_state` filter.** Used by: RunPack construction (`createAipPacket`), `createClaim` tail return, study detail panels.

### 2.4 Score effect in `recalcClaimScore` (`src/claim-scoring.js` line 9)

```js
const pressure = await env.DB.prepare(
  `SELECT severity FROM pressure_points WHERE claim_id=?`
).bind(claimId).all();
```

**No `review_state` filter.** Every pressure point — from any user, in any state — contributes to the score:

```
survivability = clamp(avg - pressureSeverity * 1.8 + testability * 0.22, 0, 100)
contradictions = pressurePointCount + pressureEvidenceCount
```

A single severity-5 pressure point deducts 9 survivability points. There is no pending/review gate.

### 2.5 Frontend rendering — Study / pressure section

`app-v10.js` renders pressure in the Study claim detail panel. The `claim.pressure` array (returned from `getClaim` and `claimDetail`) is rendered directly. The pressure chip on claim cards reads `c.contradictions` (already baked into score). No pending/review state is surfaced.

After `submitPressure()`, the frontend shows a toast (`pressure rising` / `pressure increased`). These messages imply the pressure is live immediately — there is no "submitted for review" confirmation.

### 2.6 RunPack inclusion — `createAipPacket` (`src/worker.js` line 87)

```js
const detail = await claimDetail(env, claimId);
// ...
const provenance = {
  pressure_count: (detail.pressure || []).length,   // all pressure, no filter
  ...
};
const packet = buildRunPack(detail, provenance);
```

`buildRunPack` spreads `detail` directly into the packet payload. `detail.pressure` comes from `claimDetail` which has no `review_state` filter. **All pressure points — including pending/review items from any user — enter the RunPack.**

### 2.7 Review queue — no pressure support

`reviewQueue` (`src/worker.js` line 160) queries `claims`, `truths`, and `evidence`. There is no `pressure_points` query. Pressure points never appear in the admin review queue.

`reviewDecision` handles `targetType` in `['claim', 'truth', 'evidence']`. Pressure is not in the allowed set.

`reportTarget` handles `targetType` in `['claim', 'evidence']`. Pressure reports are not handled — a report on `targetType='pressure'` creates a row in `reports` but does nothing else.

---

## 3. Current Schema

From `migrations/0003_full_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS pressure_points (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT,
  body TEXT,
  severity INTEGER DEFAULT 1,
  label TEXT,
  kind TEXT,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pressure_points_claim_id ON pressure_points (claim_id);
```

### Absent fields (compared to evidence)

| Field | Present in `evidence` | Present in `pressure_points` |
|-------|----------------------|------------------------------|
| `review_state TEXT` | ✅ (migration 0007) | ❌ |
| `report_count INTEGER` | ✅ (migration 0007) | ❌ |
| `updated_at INTEGER` | ❌ (not in evidence either) | ❌ |
| index on `review_state` | ✅ | ❌ |
| index on `report_count` | ✅ | ❌ |

### Existing row compatibility

The production `pressure_points` table currently has rows inserted without `review_state` or `report_count`. Adding these columns with `DEFAULT 'public'` and `DEFAULT 0` respectively means all existing rows will read as `review_state='public'` and `report_count=0` after migration — correct public-by-default behaviour. New inserts after migration must explicitly set `review_state='review'`.

---

## 4. Desired Product Behaviour

After full implementation (D-90B through D-90F):

| Behaviour | Before | After |
|-----------|--------|-------|
| New pressure from public user | Immediately public, immediately scored | Enters `review_state='review'`; not scored, not shown |
| Pending pressure in public claim detail | Visible | Hidden |
| Pending pressure in score | Counted | Excluded |
| Pending pressure in RunPack | Included | Excluded |
| Pending pressure in admin Review queue | Never shown | Shown as pressure item |
| Admin can approve/reject pressure | No | Yes — via `reviewDecision` with `targetType='pressure'` |
| Admin can keep pending | No | Yes — `decision='review'` no-op |
| Existing old pressure rows | All public (no column) | All public via `COALESCE(review_state,'public')='public'` |
| User toast after adding pressure | "pressure rising" (implies live) | "Submitted for review" |
| RunPack `pressure_count` | All pressure | Public-only count |

---

## 5. Proposed Future Migration

**NOT RUN. Do not execute against production without explicit per-session approval and PRAGMA preflight.**

```sql
-- migration 0009 — add pressure point moderation columns
-- NOT RUN — planning document only

ALTER TABLE pressure_points ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE pressure_points ADD COLUMN report_count INTEGER DEFAULT 0;
ALTER TABLE pressure_points ADD COLUMN updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_pressure_points_review_state
  ON pressure_points (review_state);
CREATE INDEX IF NOT EXISTS idx_pressure_points_report_count
  ON pressure_points (report_count);
```

### Migration notes

- **Run once only.** Running again against a DB that already has these columns will fail with `duplicate column name`. The migration must not be re-applied.
- **Default `'public'`** preserves existing rows — they remain visible after migration. This is the correct conservative default (same pattern as migration 0007 for evidence).
- **New inserts after migration** must explicitly set `review_state='review'`. The column default alone is not sufficient; the INSERT in `addPressure` must be updated.
- **Fresh rebuild order:** migration 0009 must run after 0003 (which defines the table). Placing it as `migrations/0009_add_pressure_review_state.sql` is correct.
- **Production timing:** only apply after the backend code changes (D-90B) have been deployed. Applying the migration before the code change means all new pressure rows will default to `'public'` until the code catches up — acceptable window but should be minimized.
- **`updated_at` note:** SQLite does not have auto-updating timestamps. The backend must set `updated_at=now` explicitly on each UPDATE. The column is nullable; NULL means "never updated."

---

## 6. Backend Implementation Plan

### 6.1 `addPressure` (inline in `src/worker.js`)

Change the INSERT to include `review_state='review'` and `updated_at=now`:

```js
await env.DB.prepare(
  `INSERT INTO pressure_points
   (id, claim_id, user_id, title, body, severity, review_state, updated_at, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).bind(pressureId, claimId, userId, title, note, severity, 'review', now, now).run();
```

**Do NOT call `recalcClaimScore` immediately after insert.** The pressure is pending and must not affect the score until approved. Remove the `await recalcClaimScore(env, claimId)` call from `addPressure`.

Alternative (less preferred): Call `recalcClaimScore` but ensure the query in `recalcClaimScore` already filters `COALESCE(review_state,'public')='public'` — the pending row would be excluded. This avoids a no-op recalc but is harder to reason about. Preferred approach: **do not recalc on pressure insert at all**; recalc happens in `reviewDecision` when pressure is approved.

### 6.2 `getClaim` (`src/worker.js` line 78)

Add `COALESCE(p.review_state,'public')='public'` filter:

```js
const pressure = await env.DB.prepare(
  `SELECT p.*, u.handle FROM pressure_points p
   LEFT JOIN users u ON u.id=p.user_id
   WHERE p.claim_id=? AND COALESCE(p.review_state,'public')='public'
   ORDER BY p.created_at DESC`
).bind(claimId).all();
```

### 6.3 `claimDetail` (`src/worker.js` line 163)

Add `COALESCE(review_state,'public')='public'` filter:

```js
const pressure = await env.DB.prepare(
  `SELECT id, created_at, title, body, severity FROM pressure_points
   WHERE claim_id=? AND COALESCE(review_state,'public')='public'
   ORDER BY created_at DESC`
).bind(claimId).all();
```

This automatically fixes RunPack (`createAipPacket` calls `claimDetail`).

### 6.4 `recalcClaimScore` (`src/claim-scoring.js`)

Add `COALESCE(review_state,'public')='public'` filter to the pressure query:

```js
const pressure = await env.DB.prepare(
  `SELECT severity FROM pressure_points
   WHERE claim_id=? AND COALESCE(review_state,'public')='public'`
).bind(claimId).all();
```

### 6.5 `reviewQueue`

Add a pressure query alongside claims/truths/evidence:

```js
const pressureItems = await env.DB.prepare(`
  SELECT 'pressure' AS target_type,
         p.id, p.claim_id, p.title, p.body, p.severity,
         p.review_state, p.report_count, p.created_at, p.updated_at,
         c.claim AS parent_claim,
         u.handle
  FROM pressure_points p
  LEFT JOIN claims c ON c.id = p.claim_id
  LEFT JOIN users u ON u.id = p.user_id
  WHERE COALESCE(p.review_state,'public') != 'public'
     OR p.report_count > 0
  ORDER BY p.created_at DESC
  LIMIT 100
`).all();
```

Include `pressureRows` in the merged `review` array and in the response.

### 6.6 `reviewDecision`

Add a `pressure` branch:

```js
if (targetType === 'pressure') {
  const now = Date.now();
  await env.DB.prepare(
    `UPDATE pressure_points SET review_state=?, report_count=0, updated_at=? WHERE id=?`
  ).bind(decision, now, targetId).run();
  await env.DB.prepare(
    `UPDATE reports SET status=? WHERE target_type='pressure' AND target_id=? AND status='open'`
  ).bind(decision === 'rejected' ? 'rejected' : 'closed', targetId).run().catch(() => null);
  const row = await env.DB.prepare(
    `SELECT p.*, c.claim AS parent_claim FROM pressure_points p
     LEFT JOIN claims c ON c.id=p.claim_id WHERE p.id=?`
  ).bind(targetId).first();
  if (!row) return json({ error: 'PRESSURE_NOT_FOUND' }, 404);
  // Recalc score for parent claim on approve or reject
  if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(() => null);
  return json({ ok: true, targetType: 'pressure', decision, item: row });
}
```

Also update the `allowed` target_type error to include `'pressure'`:
```js
return json({ error: 'BAD_REVIEW_TARGET', allowed: ['claim', 'truth', 'evidence', 'pressure'] }, 400);
```

### 6.7 `reportTarget`

Add a `pressure` branch after the existing `evidence` branch:

```js
if (targetType === 'pressure') {
  await env.DB.prepare(
    `UPDATE pressure_points
     SET report_count=report_count+1,
         review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END,
         updated_at=?
     WHERE id=?`
  ).bind(now, targetId).run();
}
```

This makes pressure reportable with auto-escalation at 2 reports — same pattern as evidence. Note: after the migration, new pressure already starts at `review_state='review'`. The report escalation path is primarily for future cases where pressure is inserted as `'public'` (e.g. by a future bulk-approve or admin override), or if old public rows receive reports.

### 6.8 `graphStatus`

`src/graph-status.js` counts total pressure points. Decide whether to:
- **Option A (recommended):** Count only `COALESCE(review_state,'public')='public'` pressure for the public graph display. This reflects "live pressure on the graph."
- **Option B:** Count all pressure regardless of state. Admin-visible count, but misleading for public users.

Option A is preferred. The graph status is shown to all users — pending pressure should not inflate the public pressure count.

### 6.9 `debugState`

`debugState` already counts `pressure_points` via `SELECT COUNT(*) AS n FROM pressure_points`. This counts all rows regardless of state. That is acceptable for debug output — it is admin-only and total count is informative. No change required.

### 6.10 Error handling

No new public error codes needed. `PRESSURE_NOT_FOUND` (404) is returned only to admins via `reviewDecision`. The `BAD_REVIEW_TARGET` error message update (adding `'pressure'` to allowed list) is a minor fix.

---

## 7. Frontend Implementation Plan

### 7.1 `reviewCard` — pressure branch

The `reviewCard` function handles items from the review array. Add a `isPressure` branch alongside the existing `isEvidence` branch:

```js
const isPressure = item.target_type === 'pressure';
```

- Title: `item.title` or `'Pressure Point'`
- Badge: new `b-orange` badge class — `'Pressure'`
- Meta: severity chip (`Severity: N/5`), claim link, handle
- Skip `claimQualityHints` for pressure items
- Show parent claim context (`item.parent_claim`)

### 7.2 `renderReviewInspectPanel` — pressure fields

Add a pressure-specific fields block:

| Field | Value |
|-------|-------|
| Title | `item.title` |
| Body / Note | `item.body` |
| Severity | `item.severity` / 5 |
| Parent Claim | `item.parent_claim` with study button linking to `item.claim_id` |
| Review State | `item.review_state` |
| Submitted by | `item.handle` |

Hide `dupSection` and quality hints for pressure items.

### 7.3 `reviewDecisionUI`

`item.title` fallback already used in the label. Ensure `targetType: 'pressure'` is sent correctly in the POST body. No other changes needed — the decision buttons (Approve / Keep Pending / Reject) are shared.

### 7.4 Filters, sorts, and audit summary

- Add `Pressure` filter chip (alongside `~Quality`, `Dupes`, `Demo/Test`).
- Audit summary: add pressure count stat — e.g. `N pending pressure`.
- Sort: pressure items participate in the default newest-first sort via `created_at`.

### 7.5 Study pressure section — pending wording

After a user submits pressure, the returned `claim.pressure` array (from `addPressure` response) will now be empty for the new item (it was inserted as `'review'`, so the `getClaim` filter excludes it). The frontend pressure section should render correctly with the existing item absent.

However, the **toast** currently says `"pressure rising"` or `"pressure increased"`. This implies the pressure is live. Change to: `"Pressure point submitted for review."` — consistent with the existing evidence submission pattern.

### 7.6 Submit form microcopy

Below the pressure submit button in the Study side panel, add:
> "Enters moderation before affecting the claim."

This is consistent with claim/evidence submission microcopy already in place.

---

## 8. Static Hardening Tests Plan

Estimated +12 new tests. New baseline: **161 + 12 = 173 passed, 0 failed**.

Section 30 — Pressure point moderation (12 tests):

| # | Test | Target |
|---|------|--------|
| 1 | migration file `0009_add_pressure_review_state.sql` contains `review_state TEXT DEFAULT 'public'` | `migrations/0009_add_pressure_review_state.sql` |
| 2 | migration file contains `report_count INTEGER DEFAULT 0` | `migrations/0009_add_pressure_review_state.sql` |
| 3 | `addPressure` inserts `review_state='review'` | `src/worker.js` |
| 4 | `addPressure` does NOT call `recalcClaimScore` (pending pressure must not affect score) | `src/worker.js` |
| 5 | `getClaim` pressure query filters `COALESCE(p.review_state,'public')='public'` | `src/worker.js` |
| 6 | `claimDetail` pressure query filters `COALESCE(review_state,'public')='public'` | `src/worker.js` |
| 7 | `recalcClaimScore` pressure query filters `COALESCE(review_state,'public')='public'` | `src/claim-scoring.js` |
| 8 | `reviewQueue` queries `pressure_points` for non-public items | `src/worker.js` |
| 9 | `reviewDecision` handles `targetType === 'pressure'` | `src/worker.js` |
| 10 | `reviewDecision` calls `recalcClaimScore` after pressure decision | `src/worker.js` |
| 11 | frontend `reviewCard` has a pressure branch (`isPressure` or `target_type === 'pressure'`) | `public/app-v10.js` |
| 12 | `buildRunPack` / `createAipPacket` pressure derives from `claimDetail` (public-filtered) | `src/worker.js` |

Note: tests 1–2 require the migration file to exist. They should be added in D-90B when the file is created, not in D-90A. Tests 3–12 apply once the backend code is written.

---

## 9. Manual / Live Test Plan — GATED, NOT RUN

The following is a future test plan only. **Do not run until D-90F is explicitly approved.**

### Pre-conditions
- D-90B merged (backend) and D-90C merged (frontend)
- D-90E migration applied to production DB
- Use `HX_TEST_D90_` prefix for all test claims/pressure items

### Test sequence

| Step | Action | Expected |
|------|--------|----------|
| T1 | Submit pressure against a public claim | HTTP 200 from `addPressure`. Study panel does NOT show the new pressure item. Score unchanged. |
| T2 | Check admin Review queue | Pressure item appears in queue with `target_type='pressure'` |
| T3 | Generate RunPack before approval | Pressure NOT in RunPack. `pressure_count=0` (or previous count) |
| T4 | Admin: approve pressure | `decision: 'public'`. `POST /api/review/decision` returns ok |
| T5 | Check Study panel after approval | Pressure now visible. Score recalculated (contradictions +1, survivability reduced) |
| T6 | Generate RunPack after approval | Pressure included. `pressure_count` incremented |
| T7 | Submit second pressure, admin: reject | `decision: 'rejected'`. Pressure hidden from Study and RunPack |
| T8 | Check score | Score identical to pre-rejection (rejected pressure does not affect score) |
| T9 | Cleanup | Return test claim to review via `POST /api/review/decision` |

### Stop conditions

- If approved pressure does NOT appear in Study → STOP. Backend filter issue.
- If pending pressure DOES appear in Study → STOP. Filter not applied.
- If score changes on insert (before approval) → STOP. `recalcClaimScore` still being called on pending insert.
- If RunPack includes pending pressure → STOP. `claimDetail` filter not working.

---

## 10. Risk Analysis

### R-1: Score backfill after migration

After migration 0009 applies and new inserts go to `review_state='review'`, the score formula will exclude pending pressure. Existing public pressure rows are unaffected (they default to `'public'`). However, if an admin later rejects existing public pressure rows, their score contribution is removed — the claim score will change. This is a **deferred recalc risk** — no batch backfill is needed at migration time, but rejected-pressure decisions will trigger targeted recalcs via `reviewDecision`. That is the correct behaviour.

### R-2: Old pressure rows default public

All pre-migration pressure rows will default to `review_state='public'` via the `DEFAULT 'public'` column. This is intentional: existing rows were inserted without a review gate and have been visible on the site for the entire product lifetime. Retroactively hiding them without admin review would degrade the site. **No bulk state change is planned.** Old rows stay public and can be moderated individually if needed.

### R-3: Review queue density

The current queue has claims/truths/evidence items. Adding pressure items will increase queue density. The pressure filter chip (Section 7.4) allows admins to filter to pressure only, reducing cognitive load. However, if many pending pressure items accumulate before D-90E, the queue may become noisy. Consider: D-90B backend change should be deployed close to D-90E migration; do not run D-90B in production for extended periods without the migration (pressure inserts would fail — column does not exist yet).

**Sequencing rule:** D-90E (production migration) must be applied before or simultaneously with D-90B deployment. Never deploy D-90B backend code to a production DB that has not run migration 0009.

### R-4: Claim score drift after approval/rejection

When a pending pressure item is approved, `recalcClaimScore` is called and the claim score drops. When a pending item is rejected, the score remains the same (rejected pressure is excluded). This means:

- A claim's public-visible score will change at admin approval time, not at submission time.
- Users who submitted pressure may not see any visible change until approval — this is correct product behaviour.
- Score drift on large batches of approval is possible. Acceptable — advisory scores only.

### R-5: Report escalation complexity

With `review_state` present, the `reportTarget` pressure branch becomes possible. However:
- New pressure starts at `'review'` — it can only be reported if it was somehow inserted as `'public'` (legacy rows or admin override).
- The auto-escalation at `report_count>=2` is consistent with evidence handling but less meaningful when pressure already starts in review.
- Consider whether report-on-pending-pressure has any value. For now, implement for completeness but the primary use case is reporting old public pressure rows.

### R-6: Migration re-run risk

If migration 0009 is run twice against the same DB, the second run will fail with `duplicate column name: review_state`. This matches the pattern of migrations 0007 and 0008. Document clearly: **run once only, guard with PRAGMA `table_info(pressure_points)` to confirm columns absent before applying.**

---

## 11. Recommended Implementation Order

Recommended split — backend and frontend in separate PRs:

### D-90B — Backend pressure moderation (branch + PR)

**Scope:**
- Create `migrations/0009_add_pressure_review_state.sql` (NOT applied to production yet)
- Update `addPressure`: insert `review_state='review'`, `updated_at=now`, remove immediate `recalcClaimScore` call
- Update `getClaim` pressure query: add public filter
- Update `claimDetail` pressure query: add public filter
- Update `recalcClaimScore` pressure query: add public filter
- Update `reviewQueue`: add pressure query
- Update `reviewDecision`: add pressure branch with recalc trigger
- Update `reportTarget`: add pressure branch
- Update `graphStatus` (if Option A chosen): add public filter
- Add hardening smoke Section 30 (12 tests, 161 → 173)

**Why separate from frontend:** backend changes are testable via static smoke; no live DB migration yet; frontend can be reviewed independently.

### D-90C — Frontend review UI pressure support (branch + PR)

**Scope:**
- `reviewCard`: pressure branch with orange badge
- `renderReviewInspectPanel`: pressure fields
- Pressure filter chip and audit stat
- Toast: `"Pressure point submitted for review."`
- Study pressure submit microcopy: "Enters moderation before affecting the claim."
- Additional frontend hardening smoke checks if needed (~2)

**Why separate from backend:** frontend changes do not depend on a live DB migration; they can be reviewed and merged independently and safely.

### D-90D — Scoring / RunPack validation checkpoint (docs-only)

- Confirm static checks 173+/24/39 on merged main
- Document gap-closed confirmations (same pattern as D-51 for evidence)
- Verify RunPack structure does not include pending pressure
- No code changes

### D-90E — Production D1 migration apply (explicit approval only — BLOCKED)

- Run PRAGMA preflight to confirm `review_state` absent
- Apply migration 0009 via Cloudflare D1 Console
- Post-apply PRAGMA confirmation
- Verify existing rows default to `review_state='public'`

**BLOCKED until:** D-90B and D-90C both merged to main, D-90D validation passed, and user explicitly approves live D1 write in session.

### D-90F — Manual live pressure lifecycle test (explicit approval only — BLOCKED)

- Execute test plan from Section 9
- Use `HX_TEST_D90_` prefix
- Verify full approve/reject/RunPack lifecycle

**BLOCKED until:** D-90E complete and user explicitly approves write test in session.

### Why not combine backend + frontend in one PR?

The backend changes include a migration file and scoring logic changes, which are higher risk. Separating allows the scoring/filtering logic to be reviewed and smoke-tested independently before adding the UI layer. The frontend-only PR is lower risk and can be reviewed for visual regressions separately. Combined would be acceptable if time is the constraint, but the split is recommended for reviewability.

---

## 12. Files Inspected

| File | Relevance |
|------|-----------|
| `src/worker.js` | `addPressure`, `getClaim`, `claimDetail`, `reviewQueue`, `reviewDecision`, `reportTarget`, `createAipPacket` |
| `src/claim-scoring.js` | `recalcClaimScore` pressure query, score formula |
| `migrations/0003_full_schema.sql` | Current `pressure_points` schema, indexes |
| `migrations/0007_add_evidence_review_state.sql` | Evidence moderation pattern (reference) |
| `migrations/0008_add_status_locked.sql` | Column-add pattern (reference) |
| `public/app-v10.js` | `submitPressure`, `sectionPressure`, toast messages, RunPack provenance, `reviewCard` |
| `src/graph-status.js` | Referenced for pressure count consideration |

---

## 13. Static Checks

All safe local static checks run before committing this doc. No code changes — all expected to pass at current baseline.

```
node --check src/worker.js
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

Expected: **161 / 24 / 39** — unchanged (docs-only batch).

---

## 14. PROJECT_STATE Update

See `docs/PROJECT_STATE.md` — D-90A entry added. Baseline remains 161 / 24 / 39.

D-90B+ batches are gated:
- D-90B requires backend code change + new migration file — branch + PR, not direct main
- D-90C requires frontend code change — branch + PR, not direct main
- D-90D is docs-only, direct main
- D-90E is a live D1 migration — explicit per-session approval required
- D-90F is a live write test — explicit per-session approval required
