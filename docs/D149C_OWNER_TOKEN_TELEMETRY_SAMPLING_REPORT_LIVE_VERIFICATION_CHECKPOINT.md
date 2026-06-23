# D-149C — Confirm Owner Token Telemetry Sampling Report Live

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F → D-149A (first telemetry review) → D-149B (sampling report widened) → D-149C (this doc — live verification of D-149B)
**Scope:** Verification only. No code changes. No migration. No `wrangler.toml` change. No enforcement.

Verified against:
- `https://humanx.rinkimirikata.com`

---

## Summary

D-149B widened `GET /api/debug/owner-token-telemetry`'s response to add `total_count`, `valid_ratio`, `route_status_counts`, `observed_routes`/`unobserved_owner_routes`, and `sample_window`/`all_time`, but explicitly deferred deployment and live verification. This checkpoint records the owner's manual, sanitized confirmation that the widened response works correctly in production.

---

## Production Confirmed (owner-verified, live, sanitized)

`npx wrangler deploy` was run manually to bring production up to the D-149B code, then the endpoint was checked live.

| Field | Result |
|---|---|
| `GET /api/debug/owner-token-telemetry` | 200 |
| `endpoint_ok` | `true` |
| `query_error` | `null` |
| `total_count` | 3 |
| `valid_count` | 3 |
| `valid_ratio` | 1 |
| `sample_window` / `all_time` | `all_time` / `true` |
| `status_counts` | all of `secret_missing`/`missing`/`invalid`/`expired`/`uid_mismatch` at 0, `valid` at 3 |
| `route_counts` | `getMe: 3` |
| `observed_routes` | `["getMe"]` |
| `unobserved_owner_routes` | `["myHumanX", "archiveMyHumanXItem", "exportMyHumanX", "saveProfileSettings", "saveBeliefSnapshot", "listBeliefSnapshots", "promoteBeliefSnapshot"]` |
| `route_status_counts` keys | All 8 owner-sensitive routes present |

**All new D-149B fields are confirmed live and correctly populated.** `total_count` and `valid_ratio` compute correctly (3/3 = 1). `observed_routes`/`unobserved_owner_routes` correctly partition the full eight-route list based on real data — `getMe` is the only route with any persisted telemetry, and all seven others are explicitly named as unobserved rather than just absent from the response. `route_status_counts` includes all eight routes as keys, confirming the zero-default initialization works for routes with no data, not just the one route that does have data.

No raw `owner_token` value, no `HUMANX_OWNER_SECRET` value, and no admin token value was printed, shared, or recorded as part of this verification or this document.

---

## Interpretation

- **The normalized sampling report is live and readable** — D-149B's design goal is confirmed working end-to-end in production.
- **Coverage is still weak.** Only `getMe` has any persisted telemetry; the other seven instrumented routes remain unobserved in the aggregate. This is the same underlying gap D-149A flagged, now made directly visible via `unobserved_owner_routes` instead of requiring manual inspection.
- **All persisted telemetry observed so far is `valid`** (3/3, `valid_ratio: 1`) — a clean signal, but still too small a sample (n=3, 1 route) to draw any conclusion about real-world `missing`/`invalid`/`uid_mismatch` rates.
- **No negative status bucket has been observed** in any persisted row to date.

---

## This Remains Advisory-Only — No Enforcement

Nothing about request-handling behavior was touched or tested by this checkpoint. `ownerTokenStatus()`'s result continues to be used for telemetry only; no route's rejection behavior was modified.

---

## Not Enforcement-Ready

Consistent with every prior checkpoint in this chain: n=3 across 1 of 8 routes, all `valid`, is not a basis for any enforcement or soft-warning decision. The coverage gap is now precisely visible (`unobserved_owner_routes` names exactly which seven routes need data) rather than just suspected.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1006 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-149B — this checkpoint made no code, migration, or test changes; the baseline was re-run and reconfirmed before this commit.

---

## Recommended Next Step

**D-149D — deliberately generate safe route coverage.** Rather than waiting passively for organic traffic to eventually touch the seven unobserved routes, deliberately exercise each of them once via safe, reversible, or dedicated-test-data flows (mirroring the pattern D-148C already used for `export`/`profile-settings`/`belief-snapshots`), then re-check `observed_routes`/`unobserved_owner_routes` to confirm each one moves from unobserved to observed with a `valid` status. This directly targets the coverage gap this checkpoint reconfirmed, using the now-precise visibility D-149B/C provide.
