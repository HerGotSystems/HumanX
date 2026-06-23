# D-149B — Improve Owner Token Telemetry Sampling Report

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F → D-149A (first telemetry review) → D-149B (this doc — sampling/reporting improvements)
**Scope:** Backend response-shape change only (`ownerTokenTelemetryDebug()` in `src/worker.js`). No migration, no `wrangler.toml` change, no enforcement, no frontend change.

---

## Why D-149A's Sample Was Insufficient

D-149A's review used the (already-normalized, since D-148E) telemetry endpoint and found a sample of 1: `valid_count: 1`, `route_counts: { getMe: 1 }`, every other bucket and route at 0. Beyond the sample being too small to draw any conclusion, the *response itself* couldn't help diagnose the most important open question that review raised: of the eight owner-sensitive routes, which ones have actually produced any telemetry at all, and which haven't? An admin had to manually diff `route_counts`'s keys against a route list they'd have to remember or look up separately — there was no field that just answered "which routes are we missing data for."

D-149B closes that gap by making route-level coverage a first-class part of the response, alongside total/ratio fields that make "how much data do we actually have" answerable at a glance.

---

## New Sampling/Reporting Shape

`GET /api/debug/owner-token-telemetry` now returns:

```json
{
  "ok": true,
  "status_counts": { "secret_missing": 0, "missing": 0, "invalid": 0, "expired": 0, "uid_mismatch": 0, "valid": 0 },
  "valid_count": 0,
  "total_count": 0,
  "valid_ratio": 0,
  "route_counts": { "...": 0 },
  "route_status_counts": {
    "getMe": { "secret_missing": 0, "missing": 0, "invalid": 0, "expired": 0, "uid_mismatch": 0, "valid": 0 },
    "myHumanX": { "...": 0 },
    "archiveMyHumanXItem": { "...": 0 },
    "exportMyHumanX": { "...": 0 },
    "saveProfileSettings": { "...": 0 },
    "saveBeliefSnapshot": { "...": 0 },
    "listBeliefSnapshots": { "...": 0 },
    "promoteBeliefSnapshot": { "...": 0 }
  },
  "observed_routes": [],
  "unobserved_owner_routes": ["getMe", "myHumanX", "archiveMyHumanXItem", "exportMyHumanX", "saveProfileSettings", "saveBeliefSnapshot", "listBeliefSnapshots", "promoteBeliefSnapshot"],
  "recent": [],
  "sample_window": "all_time",
  "all_time": true,
  "query_error": null
}
```

### New fields, what each is for

| Field | Purpose |
|---|---|
| `total_count` | Sum of all six `status_counts` buckets — "how many telemetry rows exist at all," answerable without summing the object manually. |
| `valid_ratio` | `valid_count / total_count`, safely `0` (never `NaN`/`Infinity`) when `total_count` is 0 — the headline number a future enforcement-readiness review will actually want. |
| `route_status_counts` | The same all-buckets-always-present treatment `status_counts` already had, applied per-route. A route showing `valid: 0` across the board is now distinguishable from a route with real `missing`/`invalid` traffic — D-149A had no way to tell those apart. |
| `observed_routes` / `unobserved_owner_routes` | Derived from a fixed `OWNER_SENSITIVE_ROUTES` list (the same eight routes named in this task), not from whatever happens to appear in query results — so a route that has never produced a single row is explicitly named as unobserved, not just silently missing from `route_counts`. |
| `sample_window` / `all_time` | This table has no time-range filter (no `created_at >= ...` clause) — these fields say so explicitly rather than letting a future reader assume a window (e.g. "last 24h") that doesn't exist. |

`status_counts`, `valid_count`, `route_counts`, `recent`, and `query_error` are unchanged in meaning from D-148E — `route_counts` now sums across all six statuses per route (previously it summed across all statuses too, but via a separate `GROUP BY route` query; both queries are now combined into a single `GROUP BY route, status` query that feeds every per-route and per-status field from one pass).

---

## Safety / Privacy Constraints — Unchanged, Re-Confirmed

- **Still `requireAdmin()`-gated**, unchanged dispatch line.
- **`recent` rows remain an explicit allowlist** (`route`/`status`/`uid_suffix`/`request_family_hash`/`created_at`) — unchanged from D-148E, re-confirmed by the same smoke test plus a new D-149B test scanning the entire feature area (both the new `emptyOwnerTokenTelemetryResponse()` helper and `ownerTokenTelemetryDebug()` itself) for any reference to a raw token, `HUMANX_OWNER_SECRET`, `HUMANX_ADMIN_TOKEN`, a full user id, or header/body/IP fields.
- **`route_status_counts`/`route_counts`/`observed_routes` are aggregate counts and route-name labels only** — never a raw token, never the secret, never a full user id, never any field beyond what was already exposed.
- **A query failure (including a missing table) still surfaces via `query_error`** rather than crashing the worker or silently looking identical to "zero rows so far" — unchanged from D-148E, now covering the single combined `GROUP BY route, status` query plus the unchanged `recent` query.

---

## This Remains Advisory-Only

Nothing about request-handling behavior changed. This patch only widens an admin-only reporting endpoint's response — `ownerTokenStatus()`'s result continues to be used for telemetry only; no `OWNER_TOKEN_*` error code exists; no route's rejection behavior was touched.

---

## Live Verification Still Pending

**This checkpoint ships code only — it has not yet been deployed or live-checked.** Consistent with the discipline established since D-146C: this response-shape change must not be claimed as "working in production" until the code is deployed and a live `GET /api/debug/owner-token-telemetry` call confirms `total_count`, `valid_ratio`, `route_status_counts`, `observed_routes`, and `unobserved_owner_routes` are all present and correctly populated. That follow-up live verification is intentionally out of scope for this checkpoint, the same pattern used for D-148E → D-148F.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1006 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

6 new smoke tests added on top of the D-148E section: `total_count`/`valid_ratio` derived safely; `observed_routes`/`unobserved_owner_routes` derived from the full expected route list; `route_status_counts` zero-defaulted for every expected route; `sample_window`/`all_time` explicit; the whole feature area never references a raw token/secret/admin-token/full-uid/header/body/ip; and no enforcement condition exists anywhere. Five pre-existing D-148E tests were updated (not weakened) to match the refactored function structure (the shared `emptyOwnerTokenTelemetryResponse()` helper, the combined `GROUP BY route, status` query).

---

## Recommended Next Step

Deploy this patch, then perform the live verification described above. Once confirmed live, a future telemetry review (a successor to D-149A) can finally answer the route-coverage question that review couldn't: which of the eight owner-sensitive routes are actually producing telemetry, and what do their individual `valid_ratio`s look like — the real prerequisite for any future soft-warning or enforcement-readiness decision.
