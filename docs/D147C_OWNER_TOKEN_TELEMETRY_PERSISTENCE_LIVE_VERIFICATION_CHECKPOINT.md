# D-147C — Confirm Production Owner Token Telemetry Persistence

**Date:** 2026-06-22
**Chain:** D-145A→C (advisory foundation) → D-146A→C (log-only telemetry + live adoption) → D-147A (audit) → D-147B (best-effort D1 persistence, code + migration) → D-147C (this doc — production persistence verification)
**Scope:** Verification only. No code changes. No new migration. No enforcement.

---

## Summary

D-147B shipped best-effort D1 persistence for owner-token telemetry, but explicitly left the migration unapplied to production and stated persistence must not be considered confirmed until applied and live-checked. This checkpoint records that the owner performed exactly that follow-through, manually and outside this automated patch.

`migrations/0014_owner_token_telemetry.sql` was applied to the production D1 database:

```
npx wrangler d1 migrations apply humanx --remote
```

This command was run **outside this repository's automated workflow**, by the owner, with the migration file's contents unchanged from what D-147B committed.

---

## Production Confirmed (owner-verified, live, sanitized)

Verified against:
- `https://humanx.rinkimirikata.com`
- `https://humanx.rinkimirikata.com/u/calenhir`

| Check | Result |
|---|---|
| `GET /api/me` | 200 |
| `GET /api/my-humanx` | 200 |
| `GET /api/belief-snapshots?limit=1` | 200 |
| Deployed logs (`wrangler tail`) | Owner-token telemetry still shows `status=valid` |
| `GET /api/debug/owner-token-telemetry` | Returned aggregate telemetry data |
| Aggregate `byStatus` counts | `valid` count is greater than 0 |
| Raw `owner_token` value | Not printed, not shared, not recorded anywhere |
| `HUMANX_OWNER_SECRET` value | Not printed, not shared, not recorded anywhere |
| Admin token value | Not printed, not shared, not recorded anywhere |

**Production D1 telemetry persistence is now confirmed working.** The `owner_token_telemetry` table exists in production, is receiving real writes from live traffic (`valid` status count > 0), and the admin-gated aggregate read endpoint (`GET /api/debug/owner-token-telemetry`) successfully returns that data.

Every owner-sensitive route above continued returning its normal 200 response throughout — confirming the D-145B/D-146B/D-147B advisory-only guarantee held under live conditions with persistence now active.

---

## This Remains Advisory-Only — No Enforcement

Applying the migration and confirming live writes changes nothing about the enforcement posture established since D-145B:

- `ownerTokenStatus()`'s result is still never used to allow or reject a request, in any of the eight instrumented routes.
- No `OWNER_TOKEN_REQUIRED`/`OWNER_TOKEN_INVALID`/`OWNER_TOKEN_MISMATCH` error code exists anywhere.
- The new `owner_token_telemetry` table is a passive, best-effort write-only record for observability — nothing in the codebase reads from it to make an authorization decision.
- `GET /api/debug/owner-token-telemetry` is a read-only, admin-gated reporting endpoint — it does not feed back into any request-handling logic.

D-147A's "not ready for enforcement yet" verdict still stands. This checkpoint only confirms the *observability* gap D-147A identified is now closed — it does not change the enforcement-readiness recommendation.

---

## Secret Handling

- `HUMANX_OWNER_SECRET` remains external configuration only — never present in `wrangler.toml`, never present in this repository, never present in this or any checkpoint doc.
- No raw `owner_token`, `HUMANX_OWNER_SECRET`, or admin token value was printed, shared, or recorded as part of this checkpoint or the manual verification it documents.
- This doc only ever records sanitized booleans/counts/status labels (e.g. "200", "valid count > 0", "status=valid") — never the underlying secret/token values.

---

## Safety Confirmation

- **No code changes in this checkpoint.** D-147C is documentation plus live verification only — `git diff` against `810ef34` (D-147B) touches only docs.
- **No new migration.** The migration applied (`0014_owner_token_telemetry.sql`) is the same file D-147B already committed; nothing new was added.
- **No enforcement.** Unchanged from D-147B — confirmed above.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 983 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

(Re-run and confirmed unchanged immediately before this commit.)

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Enforcement is still not implemented** | This checkpoint only confirms persistent telemetry is live and working — enforcement remains a deliberately separate, future-scoped decision per D-146A/D-147A. |
| **No automated retention/cleanup policy** | Carried over from D-147B: `owner_token_telemetry` has no TTL or pruning job yet. |
| **No automated dashboard** | Adoption/persistence health is still checked manually (via the admin endpoint or `wrangler tail`/`wrangler d1 execute`), not via an ongoing automated signal. |

---

## Recommended Next Implementation

With persistent telemetry now confirmed live, a future patch can revisit D-147A's enforcement-readiness questions using real aggregated data from `GET /api/debug/owner-token-telemetry` (e.g. the actual `missing`/`invalid`/`uid_mismatch` rates across real traffic) rather than a single point-in-time `wrangler tail` sample. No new checkpoint is required until either (a) accumulated telemetry data is reviewed to make an enforcement-readiness decision, or (b) a different priority is chosen instead.
