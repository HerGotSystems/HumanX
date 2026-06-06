# D-42A: Evidence Review Migration — Apply Result

Date: 2026-06-06
Status: Applied. Production D1 verified.
Method: Manual apply via Cloudflare D1 Console.
No Wrangler used. No D1 CLI used. No code changes in this step.

---

## Migration applied

File: `migrations/0007_add_evidence_review_state.sql`

SQL executed:

```sql
ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE evidence ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_evidence_review_state ON evidence (review_state);
CREATE INDEX IF NOT EXISTS idx_evidence_report_count ON evidence (report_count);
```

---

## Preflight — columns confirmed absent before apply

`PRAGMA table_info(evidence)` run before apply. Neither `review_state` nor `report_count`
appeared in the output. Safe to proceed.

---

## Post-apply — columns confirmed present

`PRAGMA table_info(evidence)` run after apply. Results:

| Column | Type | Default |
|--------|------|---------|
| `review_state` | TEXT | `'public'` |
| `report_count` | INTEGER | `0` |

Both columns present with correct types and defaults.

---

## Indexes confirmed present

`PRAGMA index_list(evidence)` run after apply. Results:

| Index name | Present |
|------------|---------|
| `idx_evidence_review_state` | ✅ Yes |
| `idx_evidence_report_count` | ✅ Yes |

---

## Existing row spot-check

`SELECT id, review_state, report_count FROM evidence LIMIT 5` run after apply.

| id | review_state | report_count |
|----|-------------|-------------|
| evd_d98bc976beaa400395 | public | 0 |
| evd_3859ca2419a94bbf8d | public | 0 |
| evd_f6add86e9ba740 | public | 0 |
| evd_c7a17a4f269d47 | public | 0 |
| evd_04be17ed2bd24a | public | 0 |

All existing rows received `review_state='public'` and `report_count=0` from the
column defaults. No existing evidence was hidden or modified in any other way.

---

## Safety record

| Item | Confirmed |
|------|-----------|
| Wrangler CLI used | ❌ No — Cloudflare D1 Console only |
| D1 CLI used | ❌ No |
| Data deleted | ❌ No |
| Data modified (beyond column default) | ❌ No |
| Table rebuilt | ❌ No |
| DROP used | ❌ No |
| Backend code changed | ❌ No — code changes are D-42B |
| Frontend changed | ❌ No |
| Existing evidence visibility changed | ❌ No — all existing rows now have `review_state='public'` |

---

## Effect on production after apply

**Existing evidence:** Unchanged. All rows have `review_state='public'` — they will
continue to be publicly visible in the Evidence Vault and in Study views for approved
claims. No disruption to current users.

**New evidence (before D-42B deploys):** The Worker INSERT does not yet include the
`review_state` column. New evidence submitted between now and D-42B deployment will
hit the column default of `'public'` and be publicly visible immediately. This is
acceptable — it preserves the current pre-moderation behaviour while the backend PR
is prepared and reviewed.

**New evidence (after D-42B deploys):** The Worker INSERT will pass `review_state='review'`
explicitly, overriding the column default. New evidence will enter the moderation queue.

**Query filters (before D-42B deploys):** No `COALESCE(e.review_state,'public')='public'`
filters exist yet in the Worker or evidence-vault module. All evidence queries behave
identically to pre-migration. No regression.

---

## What D-42B backend must do next

The migration is complete. The following backend Worker changes are now safe to
implement in `feature/d42b-evidence-moderation-backend`:

1. `insertEvidence` — add `review_state` to INSERT, bind `'review'`
2. `claimDetail` — add evidence-level `COALESCE(review_state,'public')='public'` filter
3. `getClaim` inline evidence queries — same filter
4. `listEvidenceVault` (`src/evidence-vault.js`) — add evidence-level filter
5. `reportTarget` — add `targetType='evidence'` branch
6. `reviewQueue` — add evidence items query
7. `reviewDecision` — add `targetType='evidence'` branch

Full implementation spec in `docs/D42_EVIDENCE_MODERATION_BACKEND_PREFLIGHT.md`.

---

## D-42A completion record

| Item | Status |
|------|--------|
| Migration file reviewed | ✅ Done |
| Preflight PRAGMA (columns absent) | ✅ Confirmed |
| Migration applied via D1 Console | ✅ Done |
| Post-apply PRAGMA (columns present) | ✅ Confirmed |
| Indexes confirmed | ✅ Confirmed |
| Existing rows spot-checked | ✅ Done — all public/0 |
| Static checks (103/24/39) | ✅ Unchanged — no code changes |
| D-42B backend branch unlocked | ✅ Yes — migration prerequisite satisfied |
