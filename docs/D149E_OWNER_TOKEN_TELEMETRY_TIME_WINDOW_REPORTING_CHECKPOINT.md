# D-149E — Add Time-Windowed Owner Token Telemetry Reporting

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F → D-149A→D (telemetry review, sampling report widened, route coverage generated) → D-149E (this doc — time-window reporting)
**Scope:** Backend response/query change only (`ownerTokenTelemetryDebug()` in `src/worker.js`). No migration, no `wrangler.toml` change, no enforcement, no soft warning, no frontend change.

---

## Why All-Time Was Insufficient

D-149D deliberately exercised all 8 owner-sensitive routes to confirm telemetry coverage, which worked — but as a side effect, it permanently mixed 10 deliberately-curated verification records into the all-time aggregate alongside the 3 organic records from before it. Every future all-time query will include that curated sample forever, with no way to look at *only* what's happened since, say, the last hour or the last day. A meaningful "is this safe to enforce" review needs to be able to look at organic traffic in isolation, not a perpetually-blended total.

---

## New Time-Window Reporting Capability

`GET /api/debug/owner-token-telemetry` now accepts an optional `window` query parameter:

```
GET /api/debug/owner-token-telemetry            → window=all (default, unchanged behavior)
GET /api/debug/owner-token-telemetry?window=1h   → last 1 hour
GET /api/debug/owner-token-telemetry?window=24h  → last 24 hours
GET /api/debug/owner-token-telemetry?window=7d   → last 7 days
```

The response now includes four window-describing fields on every call:

```json
{
  "ok": true,
  "sample_window": "all" | "1h" | "24h" | "7d",
  "all_time": true | false,
  "window_started_at": null | <epoch ms>,
  "window_ended_at": <epoch ms>,
  "...": "...(status_counts, valid_count, total_count, valid_ratio, route_counts, route_status_counts, observed_routes, unobserved_owner_routes, recent, query_error — all unchanged from D-149B)"
}
```

### Design decisions

- **Default stays `all`**, preserving every existing caller's and every prior checkpoint's behavior unless a caller explicitly opts into a narrower window. D-149A through D-149D's findings remain valid descriptions of what the all-time query showed at the time.
- **An unrecognized or missing `window` value silently normalizes to `all`** rather than rejecting the request with a 400. This is a read-only admin reporting endpoint — a typo in a query param shouldn't error, and the response's own `sample_window` field always tells the caller exactly which window was actually applied, so there's no silent ambiguity about what got normalized.
- **`window_started_at` is `null` only when `all_time` is `true`**; for any recognized window it's `Date.now() - windowMs` computed at request time. `window_ended_at` is always the current time, for every window including `all`, so a caller always knows when the snapshot was taken even for an unbounded query.
- **`created_at` filtering is applied to both the aggregate query and the `recent` query** for any non-`all` window — both now run `WHERE created_at >= ?` bound to `window_started_at`, while the `all` path runs the original unfiltered queries unchanged.

---

## Intended Passive Sampling Protocol

This capability exists to support the "longer passive sampling" step D-149C and D-149D both recommended next:

1. Let real, organic traffic accumulate for a meaningful period with no further deliberate triggering.
2. Pull `GET /api/debug/owner-token-telemetry?window=24h` (or `7d`, depending on traffic volume) to see only that period's data, uncontaminated by D-149D's curated verification sample.
3. Review `status_counts`/`route_status_counts`/`valid_ratio` from that windowed view specifically — this is the organic baseline every prior checkpoint has said is the actual prerequisite for any soft-warning or enforcement-readiness decision.
4. The `all`-window view remains available for historical/lifetime totals, but should no longer be treated as representative of "current" adoption health once enough windowed data exists.

---

## Safety / Privacy Constraints — Unchanged, Re-Confirmed

- **Still `requireAdmin()`-gated**, unchanged dispatch line.
- **The windowed queries select exactly the same allowlisted columns** as the all-time queries (`route, status, uid_suffix, user_agent_hash, created_at` for `recent`; `route, status, COUNT(*)` for the aggregate) — filtering by `created_at` does not expand what's selected.
- **Never exposes** a raw token, `HUMANX_OWNER_SECRET`, the admin token, a full user id, request headers, request body, or an IP address — re-confirmed by smoke tests covering the new window-resolution function specifically, in addition to the existing whole-feature-area scan.
- **No soft-warning mechanism was added.** This patch is reporting-only — confirmed by a dedicated smoke test scanning for any `SOFT_WARNING`/`soft_warning`/`softWarning` reference anywhere in `worker.js`, none of which exist.
- **A query failure (including a missing table) still surfaces via `query_error`**, for both the all-time and windowed query paths.

---

## This Remains Advisory-Only

Nothing about request-handling behavior changed. `ownerTokenStatus()`'s result continues to be used for telemetry only; no `OWNER_TOKEN_*` error code exists; no soft-warning mechanism exists; no route's rejection behavior was touched.

---

## Live Verification Still Pending

**This checkpoint ships code only — it has not yet been deployed or live-checked.** Consistent with every prior checkpoint in this chain: this windowing change must not be claimed as "working in production" until the code is deployed and a live call to each window value (`all`, `1h`, `24h`, `7d`) confirms the correct fields and filtering behavior. That follow-up live verification is intentionally out of scope for this checkpoint.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1016 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

10 new smoke tests added (Section 81): all four windows defined correctly; an unrecognized/missing window normalizes to `all` rather than erroring; `window_started_at` is `null` only for `all`; `window_ended_at` is always present; `created_at` filtering is applied for non-`all` windows and omitted for `all`; `sample_window` always echoes the resolved window; all D-149B response-shape guarantees still hold; the endpoint remains admin-gated; no enforcement or soft-warning mechanism exists; and the windowed queries never select beyond the existing column allowlist. 4 pre-existing tests updated (slice windows widened, two literal-string assertions updated) to match the refactored function.

---

## Recommended Next Step

Deploy this patch, then live-verify each window value works correctly (especially that `1h`/`24h`/`7d` actually filter out D-149D's curated sample once enough time has passed). After that, the passive sampling protocol described above becomes possible — pulling a windowed view of genuinely organic traffic is the real prerequisite for the soft-warning design or enforcement-readiness reconsideration every checkpoint since D-146A has deferred.
