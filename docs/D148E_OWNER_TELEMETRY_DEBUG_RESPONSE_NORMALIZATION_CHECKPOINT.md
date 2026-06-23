# D-148E — Normalize Owner Telemetry Debug Response

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→D (client hardening, live verification, deploy-gap resolution) → D-148E (this doc — response-shape normalization)
**Scope:** Backend response-shape change only (`ownerTokenTelemetryDebug()` in `src/worker.js`). No migration, no `wrangler.toml` change, no enforcement, no frontend change.

---

## Why D-148D Was Insufficient

D-148D confirmed `GET /api/debug/owner-token-telemetry` was reachable, admin-gated, and returned 200 after the production redeploy — but a console-side extraction of `valid_count` returned `null`. The root cause was the response shape itself, not a deeper bug: the original shape (`{ ok, byStatus, byRoute, recent }`) only included a status key in `byStatus` if at least one row with that status existed. There was no single, predictable place to read "the valid count" from — a caller had to know to look inside a nested, possibly-partial `byStatus` object and handle the case where `byStatus.valid` might not exist at all. That ambiguity, not a data or deployment problem, is what produced the `null` extraction result.

---

## What Changed

`ownerTokenTelemetryDebug()` (`src/worker.js`) now returns an explicit, fully-predictable shape:

```json
{
  "ok": true,
  "status_counts": {
    "secret_missing": 0,
    "missing": 0,
    "invalid": 0,
    "expired": 0,
    "uid_mismatch": 0,
    "valid": 0
  },
  "valid_count": 0,
  "route_counts": { "...": 0 },
  "recent": [
    { "route": "...", "status": "...", "uid_suffix": "...", "request_family_hash": "...", "created_at": 0 }
  ],
  "query_error": null
}
```

Key changes from the D-147B shape:

1. **`status_counts` always includes all six known buckets** (`secret_missing`/`missing`/`invalid`/`expired`/`uid_mismatch`/`valid`), pre-initialized to `0` before any query result is merged in. A bucket with zero rows is now explicitly `0`, never simply absent.
2. **`valid_count` is a new top-level field**, an exact mirror of `status_counts.valid` — the single number a caller most likely wants is now reachable with no nested-object knowledge required, on every return path (including the early-return when `env.DB` is absent).
3. **`recent` rows are built via an explicit field-by-field allowlist** (`route`, `status`, `uid_suffix`, `request_family_hash`, `created_at`) instead of spreading whatever a `SELECT *`-shaped query happens to return — this means a future schema change to the `owner_token_telemetry` table can never silently leak an additional column through this endpoint without an explicit code change here too. The DB column `user_agent_hash` is exposed under the clearer name `request_family_hash` in the response; no DB/migration change was made.
4. **`query_error`** is a new field, `null` on success, otherwise a sanitized D1 error message string (e.g. "no such table..."). A failed query (including a missing `owner_token_telemetry` table) no longer silently looks identical to "zero telemetry rows so far" — an admin reading the response can now tell the difference between "nothing has happened yet" and "something is actually broken."
5. **`byStatus`/`byRoute`** (the old, ambiguous field names) are removed and replaced by `status_counts`/`route_counts` respectively — this is a breaking shape change for this one admin-only debug endpoint, which is acceptable since it has no other consumers (confirmed: it is not called anywhere in `public/`).

---

## Safety / Privacy Rules — Unchanged, Re-Confirmed

- **Still `requireAdmin()`-gated** at the same dispatch line, unchanged.
- **Never exposes**: raw `owner_token`, `HUMANX_OWNER_SECRET`, the admin token, a full user id, request headers, request body, or an IP address — confirmed by a dedicated smoke test asserting the `recent`-row mapping references none of `token`/`secret`/`header`/`body`/`ip`/`r.user_id`/`r.userId`.
- **`uid_suffix`** remains the only user-identifying field exposed, unchanged from D-147B — the same short, non-reversible suffix already used everywhere else in this telemetry system.
- **`query_error`** only ever carries D1's own error message (e.g. a missing-table message) — never request data, never a value derived from user input.

---

## This Remains Advisory-Only

Nothing about the enforcement posture changed. `ownerTokenStatus()`'s result continues to be used for telemetry only; no request is rejected based on `owner_token` anywhere; no `OWNER_TOKEN_*` error code exists. This patch only changes the *shape* of an admin-only reporting endpoint's response — it has no bearing on any production request's allow/reject outcome.

---

## Live Verification Still Pending

**This checkpoint ships code only — it has not yet been deployed or live-checked.** Per the same discipline established in D-146C/D-147C/D-148D, this response-shape change must not be claimed as "working in production" until:

1. The code is deployed (`npx wrangler deploy`, run manually outside this session — the same network constraint documented in D-148D applies here too), and
2. A live `GET /api/debug/owner-token-telemetry` call confirms `valid_count` is now a directly-readable top-level number (not `null`), and `status_counts` includes all six buckets even if some are `0`.

That follow-up live verification is intentionally out of scope for this checkpoint.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1000 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

7 new smoke tests added (Section 80): `valid_count` present on every return path, all six status buckets always present and zero-defaulted, `valid_count` exactly mirrors `status_counts.valid` on every `return json(...)` call, `recent` rows built from an explicit allowlist with no forbidden fields, a failed/missing-table query surfaces sanitized `query_error` metadata instead of crashing or being silently swallowed, the route remains `requireAdmin`-gated, and no enforcement condition was introduced.

---

## Recommended Next Step

Deploy this patch, then perform the live verification described above (a future D-148F-style checkpoint, or folded into whatever next checkpoint addresses the still-pending accumulated-telemetry review recommended since D-148A).
