# D-149F — Confirm Time-Windowed Owner Telemetry Reporting Live

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F → D-149A→E (telemetry review, sampling report widened, route coverage generated, time-windowing added) → D-149F (this doc — live verification of D-149E)
**Scope:** Verification only. No code changes. No migration. No `wrangler.toml` change. No enforcement. No soft warning.

Verified against:
- `https://humanx.rinkimirikata.com`

---

## Summary

D-149E added optional `window=all|1h|24h|7d` query-param support to `GET /api/debug/owner-token-telemetry` but explicitly deferred deployment and live verification. This checkpoint records the owner's manual, sanitized confirmation that windowing works correctly in production across every supported value, plus the invalid-input normalization behavior.

---

## Production Confirmed (owner-verified, live, sanitized)

`npx wrangler deploy` was run manually to bring production up to the D-149E code, then each window value was checked live.

| Call | `endpoint_status` | `endpoint_ok` | `sample_window` | `all_time` |
|---|---|---|---|---|
| No `window` param (default) | 200 | `true` | `all` | `true` |
| `?window=all` | 200 | `true` | `all` | `true` |
| `?window=1h` | 200 | `true` | `1h` | `false` |
| `?window=24h` | 200 | `true` | `24h` | `false` |
| `?window=7d` | 200 | `true` | `7d` | `false` |
| `?window=banana` (invalid) | 200 | `true` | `all` | `true` |

`query_error` was `null` in the visible response for the calls checked.

**Every behavior D-149E specified is confirmed live:**
- The default (no `window` param) behaves identically to `?window=all` — both `all`/`true`.
- All three recognized non-`all` windows (`1h`, `24h`, `7d`) correctly report their own `sample_window` value and `all_time: false`.
- An unrecognized value (`banana`) does not error — it returns 200 and silently normalizes to `sample_window: all, all_time: true`, exactly as designed, with the response itself making clear what was applied rather than leaving the caller to guess.

No raw `owner_token` value, no `HUMANX_OWNER_SECRET` value, and no admin token value was printed, shared, or recorded as part of this verification or this document.

---

## This Remains Advisory-Only — No Enforcement, No Soft Warning

This checkpoint only verifies an admin-only reporting endpoint's query-param handling. Nothing about request-handling behavior changed or was tested here:

- No route's rejection behavior was touched by D-149E or re-tested here.
- `ownerTokenStatus()`'s result continues to be used for telemetry only.
- No soft-warning mechanism exists in the codebase (confirmed statically in D-149E, not contradicted by anything observed here).

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1016 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-149E — this checkpoint made no code, migration, or test changes; the baseline was re-run and reconfirmed before this commit.

---

## Status of the D-149 Chain So Far

- D-149A — first telemetry review, sample too small (n=1, 1 route).
- D-149B — sampling report widened (per-route, per-status, observed/unobserved).
- D-149C — widened report confirmed live.
- D-149D — all 8 routes deliberately exercised and confirmed observed (sample still curated, not organic).
- D-149E — time-window reporting added, to separate D-149D's curated sample from future organic traffic.
- D-149F (this checkpoint) — time-windowing confirmed live and correct for every supported value.

With this confirmed, the passive sampling protocol D-149E described is now actually usable: a future review can pull `?window=24h` or `?window=7d` and see only traffic from that period, distinct from the `all`-window total that still includes D-149D's curated records.

---

## Recommended Next Step

Let real, organic traffic accumulate with no further deliberate triggering, then pull a windowed view (`?window=24h` or `?window=7d`, depending on how much traffic has occurred) for the first genuinely organic telemetry review in this chain. That review — not this verification pass, and not any of D-149A through D-149D's curated/small samples — is the actual prerequisite for reconsidering soft-warning design or enforcement readiness.
