# D-180G — Review Queue Live Verification

**Date:** 2026-06-26
**Fix commit:** 025f9a2 (D-180F)
**Baseline:** 1358/24/57
**Type:** Live verification / chain close. No code changes.

---

## Safety Constraints

- Admin token not printed, not echoed, not stored, not documented here.
- Owner token not touched.
- D-149H hold remains in effect.
- No migration applied.
- No CSP added.

---

## D-180 Chain Summary

| Task | Description | Outcome |
|---|---|---|
| D-180A | Review queue failure diagnostic | Identified 500 after valid admin token; primary suspect was missing `archived_by_user` (migration 0012) |
| D-180B | Production D1 schema preflight | Confirmed migration 0012 applied; primary hypothesis disproven |
| D-180C | Owner-side PRAGMA confirmation | Owner ran PRAGMA; all migration-0012 columns present |
| D-180D | Live runtime failure identification | DevTools confirmed 500; wrangler tail showed "Ok" (caught exception — expected) |
| D-180E | Temporary diagnostic console.error | Added `console.error('[D-180D]', message)` to global catch; deployed; tail captured real error |
| D-180F | Fix — remove stale `c.damage` | Removed `c.damage` from `reviewQueue()` SELECT; removed diagnostic log line |
| D-180G | Live verification | Review queue loads successfully — this document |

---

## Root Cause

`D1_ERROR: no such column: c.damage at offset 244`

The `reviewQueue()` claims SELECT explicitly named `c.damage`. This column exists in the `CREATE TABLE` schema definitions (`migrations/0001_init.sql:13`, `migrations/0003_full_schema.sql:37`) but was **never propagated to production D1 via an `ALTER TABLE` migration**. No such migration exists. Production D1 was initialized before the column was added to the schema definition.

The error was caught by the Worker's global catch handler (D-176B generic error hygiene), which converted it to the generic `{ "error": "INTERNAL_ERROR", "message": "Unexpected server error." }` 500 response. The actual D1 error was invisible until a temporary `console.error` was added in D-180E and captured via `wrangler tail`.

---

## Fix

**File:** `src/worker.js` — `reviewQueue()` function (line ~840)

**Change:** Removed `c.damage` from the explicit column list in the claims SELECT query.

```diff
- c.near_duplicate_of, c.damage, c.status_locked, c.archived_by_user,
+ c.near_duplicate_of, c.status_locked, c.archived_by_user,
```

Also removed the D-180E temporary diagnostic line from the global catch.

**No migration applied.** The `damage` column has no data in production and is not referenced in `mapClaim()`. The frontend inspect panel shows it only when non-null — omitting it from the SELECT has zero functional impact.

---

## Live Verification

Owner confirmed after `npx wrangler deploy` of D-180F:

| Check | Result |
|---|---|
| `GET /api/review` status | 200 OK (no longer 500) |
| Review queue renders | Yes — pending/rejected/report filters and cards display correctly |
| wrangler tail during load | No exception |
| No migration applied | Confirmed |
| No CSP change | Confirmed |
| No auth/token logic change | Confirmed |

---

## Baseline

All three test suites confirmed passing at 1358/24/57 after D-180F:
- `hardening-smoke-test.mjs` — 1358 passed, 0 failed
- `belief-engine-static-check.mjs` — all hard checks passed
- `worker-route-static-check.mjs` — all hard checks passed

---

## What D-180G Does Not Claim

- Does not claim the `damage` column will never be needed — if future use is intended, a migration adding it to production D1 should be created separately.
- Does not claim full review queue functionality was tested beyond basic load and filter render.
- Does not contain admin token, owner token, secrets, or sensitive values.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.

---

## Recommended Next Step

D-180 chain is complete. Repo is clean and synced.

Candidate next chains:
- **D-179B** — Add permissive CSP header to `renderPublicProfileShell()` (deferred from D-179A; no blockers remain)
- Any other hardening or feature work as directed
