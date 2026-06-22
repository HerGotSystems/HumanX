# D-147B — Persist Owner Token Telemetry Safely

**Date:** 2026-06-22
**Chain:** D-145A→C (advisory foundation) → D-146A→C (log-only telemetry + live confirmation) → D-147A (audit) → D-147B (this doc — persistent telemetry)
**Scope:** Code + migration + docs. Adds best-effort D1 persistence to the existing console-only telemetry. **No enforcement. No rejection logic. No frontend change.**

---

## Summary

D-147A's audit identified the binding gap before enforcement could ever be considered: telemetry was real and live (D-146C), but entirely observational — visible only via a manual `wrangler tail` session, with no historical record. D-147B closes that gap by adding best-effort, additive-only D1 persistence alongside the existing console logging, plus a small admin-only aggregate read endpoint.

### What changed

1. **New migration** ([migrations/0014_owner_token_telemetry.sql](../migrations/0014_owner_token_telemetry.sql)) — adds one new table, `owner_token_telemetry`. Does not alter or touch any existing table (`users`, `claims`, `belief_snapshots`, etc.).
2. **`logOwnerTokenTelemetry()`** (`src/worker.js`) widened from `(routeName, status, extra)` to `async (env, request, routeName, status, extra)`:
   - Still `console.log`s first, exactly as before.
   - Then, if `env.DB` exists, best-effort inserts one row: `id` (`makeId('otl')`), `route`, `status`, `uid_suffix` (optional), `user_agent_hash` (optional), `created_at`.
   - The insert is wrapped in `try/catch` with a swallowed catch body — a missing table (migration not applied), a missing DB binding, or any other insert failure never throws, never blocks, and never changes the calling route's response.
3. **`requestFamilyHash(request)`** — a small synchronous FNV-1a hash of the `User-Agent` header, used only to populate the optional `user_agent_hash` column. Non-cryptographic on purpose: this is a low-stakes grouping aid for telemetry, not a security boundary. One-way — the raw User-Agent string is never stored.
4. **All eight existing call sites** (`getMe`, `myHumanX`, `archiveMyHumanXItem`, `exportMyHumanX`, `saveProfileSettings`, `saveBeliefSnapshot`, `listBeliefSnapshots`, `promoteBeliefSnapshot`) updated to `await` the now-async helper and pass `env`/`request` through. No other behavior at these call sites changed — `ownerStatus` is still captured and still only ever passed to the telemetry helper, never branched on.
5. **New admin-only endpoint**: `GET /api/debug/owner-token-telemetry` — gated by the existing `requireAdmin()` (same pattern as `/api/debug`). Returns aggregate counts by status, aggregate counts by route, and the 20 most recent rows (same safe columns the table stores — never a raw token, the secret, or a full user id).

---

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS owner_token_telemetry (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  status TEXT NOT NULL,
  uid_suffix TEXT,
  user_agent_hash TEXT,
  created_at INTEGER NOT NULL
);
```

**Stored:** route name, status bucket, an optional 6-character non-reversible suffix of the user id, an optional one-way hash of the User-Agent header, a timestamp.

**Never stored — confirmed by both the migration's own column list and a dedicated smoke test asserting no `token`/`secret`/`user_id`/`header`/`body`/`ip` column exists:**
- the raw `owner_token` value
- `HUMANX_OWNER_SECRET`
- the full user id
- request headers (beyond the one-way UA hash)
- request body
- IP address

---

## Status Buckets — Unchanged

`secret_missing` / `missing` / `invalid` / `expired` / `uid_mismatch` / `valid` — identical to D-146B. `ownerTokenStatus()` itself was not modified in this patch.

---

## Admin Read Endpoint

```
GET /api/debug/owner-token-telemetry
Header: x-humanx-admin: <HUMANX_ADMIN_TOKEN>
```

Response shape:
```json
{
  "ok": true,
  "byStatus": { "valid": 0, "missing": 0, "...": 0 },
  "byRoute": { "getMe": 0, "...": 0 },
  "recent": [
    { "route": "...", "status": "...", "uid_suffix": "...", "user_agent_hash": "...", "created_at": 0 }
  ]
}
```

Unauthenticated calls receive the existing `requireAdmin()` rejection — identical behavior to `/api/debug`. `recent` is capped at 20 rows and contains only the same safe columns the table stores.

---

## Safety Confirmation

- **No enforcement added.** Confirmed by dedicated smoke test: no `OWNER_TOKEN_REQUIRED`/`OWNER_TOKEN_INVALID`/`OWNER_TOKEN_MISMATCH` codes anywhere, no `if (ownerStatus !== 'valid')`-style branching anywhere in `worker.js`.
- **Telemetry write is best-effort.** The D1 insert is wrapped in `try/catch`; the catch body is empty (no `throw`, no error response) — confirmed by smoke test. Console logging happens unconditionally before the D1 write is even attempted.
- **No raw token/secret/full user id is ever bound into the INSERT.** Confirmed by smoke test inspecting the exact `.bind()` call.
- **Admin-gated.** `/api/debug/owner-token-telemetry` calls `requireAdmin(request, env)` before `ownerTokenTelemetryDebug()`, mirroring `/api/debug` exactly — confirmed by both a `hardening-smoke-test.mjs` test and a dedicated `worker-route-static-check.mjs` check.
- **Migration is additive only.** No `ALTER TABLE`/`DROP TABLE` against any existing table — confirmed by smoke test reading the migration file directly.
- **No frontend change.** `public/app-v10.js` and the Belief Engine bridge are untouched.
- **No secret handling change.** `HUMANX_OWNER_SECRET` continues to be read only via `env.HUMANX_OWNER_SECRET`; `wrangler.toml` is untouched.
- **Public/admin-token routes untouched.** `GET /api/u/:slug`, `GET /u/:slug`, and the existing admin-token system are unaffected — this patch only touches the eight already-instrumented owner routes plus the one new admin-gated debug route.

---

## ⚠️ Migration Apply Command — Documented Separately, NOT Run

**This migration has not been applied to the production D1 database as part of this checkpoint.** Until it is applied, `logOwnerTokenTelemetry()`'s best-effort D1 insert will silently no-op (the table doesn't exist yet) — console logging continues working exactly as it has since D-146B, with zero behavior change.

To apply, run **outside of this automated patch, with explicit confirmation before executing against production**:

```
wrangler d1 migrations apply <DATABASE_NAME> --remote
```

(Substitute the actual D1 database binding name from `wrangler.toml`. Run without `--remote` first against a local/preview database if you want to verify the migration runs cleanly before touching production.)

**Do not consider production telemetry persistence "confirmed working" until:**
1. The migration above has actually been applied to the production database, and
2. A live check (e.g. a subsequent `GET /api/debug/owner-token-telemetry` call, or a direct `wrangler d1 execute ... --remote` row count) confirms rows are actually being written.

That live confirmation is intentionally **out of scope for this checkpoint** — D-147B ships the code and migration file only. A future D-147C (or similar) should perform and document that live confirmation, the same way D-146C did for live token adoption.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 983 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

15 new smoke tests added in this patch (Section 78), plus the `/api/debug/owner-token-telemetry` admin-gating check added to `worker-route-static-check.mjs`, plus a corresponding row added to `docs/API_ENDPOINT_INVENTORY.md`.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Migration not yet applied to production** | See the section above — this is intentional. Telemetry persistence remains unverified in production until a future, explicitly-scoped live-confirmation step. |
| **No automated retention/cleanup policy** | `owner_token_telemetry` will grow unboundedly with no TTL or pruning job. Acceptable at current traffic levels, but worth revisiting before this table sees sustained high volume. |
| **`user_agent_hash` is non-cryptographic** | FNV-1a was chosen deliberately for simplicity and synchronous use — it is not collision-resistant in the cryptographic sense. This is fine for its purpose (rough request-family grouping), not a security control. |
| **Admin endpoint has no pagination beyond the 20-row cap** | Sufficient for the "is this working" sanity check this endpoint exists for; not a general-purpose telemetry browser. |

---

## Recommended Next Step

Apply the migration to production (with explicit approval, separate from this patch) and perform a live confirmation pass — analogous to D-146C — that rows are actually being written and the admin endpoint returns sane aggregate data. Only after that should D-147A's original enforcement-readiness questions be reconsidered with real persisted data behind them, rather than a point-in-time `wrangler tail` sample.
