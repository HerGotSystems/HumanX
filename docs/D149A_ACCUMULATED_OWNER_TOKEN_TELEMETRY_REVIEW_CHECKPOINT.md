# D-149A — Review Accumulated Owner Token Telemetry

**Date:** 2026-06-23
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F (client hardening, deploy-gap fix, response normalization, all confirmed live) → D-149A (this doc — first accumulated-telemetry review)
**Scope:** Analysis only. No code, no migration, no `wrangler.toml`, no enforcement.

---

## Sanitized Telemetry Summary

Pulled from `GET /api/debug/owner-token-telemetry` in production, sanitized:

```
endpoint_status: 200
endpoint_ok: true
valid_count: 1

status_counts:
  secret_missing: 0
  missing: 0
  invalid: 0
  expired: 0
  uid_mismatch: 0
  valid: 1

route_counts:
  getMe: 1

recent_count: 1
query_error: null
```

No raw `owner_token`, `HUMANX_OWNER_SECRET`, or admin token value was printed, shared, or recorded as part of this review or this document.

---

## Interpretation of `status_counts`

All six buckets are present (the D-148E normalization working as designed) and only `valid` has a nonzero count. At face value this is a clean signal — zero `missing`/`invalid`/`expired`/`uid_mismatch` — but the sample is **one single row**. A sample of 1 cannot distinguish "the system reliably produces valid tokens" from "we happened to observe the one easy case." No statistical confidence can be drawn from this snapshot in either direction.

## Interpretation of `route_counts`

Only `getMe` appears, with a count of 1. This single data point confirms the telemetry pipeline works end-to-end for at least one route (write → persist → aggregate read, the same finding D-148F already established) but says nothing about the other seven instrumented routes' real-world behavior.

---

## Review Questions

**1. Are normal owner-sensitive flows producing mostly or entirely `status=valid`?**
The one observed flow (`getMe`) did. Cannot generalize to "normal flows" plural from n=1.

**2. Are there any `missing`/`invalid`/`expired`/`uid_mismatch` buckets present?**
No — all four are 0 in this snapshot. This is consistent with (but does not prove) the D-148A client-hardening fix working as intended. It is equally consistent with simply not having sampled a case that would produce one of those statuses yet.

**3. Which routes have telemetry coverage?**
Of the eight instrumented routes (`getMe`, `myHumanX`, `archiveMyHumanXItem`, `exportMyHumanX`, `saveProfileSettings`, `listBeliefSnapshots`, `saveBeliefSnapshot`, `promoteBeliefSnapshot`), only `getMe` has any recorded telemetry in this snapshot.

**4. Which routes remain weakly verified or not safely live-tested?**
- `myHumanX`, `exportMyHumanX`, `saveProfileSettings`, `listBeliefSnapshots`, `saveBeliefSnapshot` were live-verified for `status=valid` telemetry in D-148B/C via direct `wrangler tail` observation, but **none of that activity appears in this `route_counts` snapshot** — meaning either: (a) the D-147B migration/persistence path was applied after those D-148B/C checks ran and so those specific events predate the table existing, or (b) this snapshot was pulled before enough time/traffic passed to reflect them, or (c) some other gap exists between console-log telemetry and persisted telemetry for those events. This snapshot alone cannot distinguish between these explanations.
- `archiveMyHumanXItem` and `promoteBeliefSnapshot` have never been live-verified at all (per D-148C, `belief-promote` was deliberately skipped to avoid mutating real data; `archive` was not attempted in any D-148 checkpoint).
- This is the single most important finding from this review: **persisted telemetry coverage is currently far narrower than console-log-verified coverage**, and that gap itself needs explanation before route-level conclusions can be trusted.

**5. Does the telemetry support future soft-warning mode?**
Not yet, on the evidence here — a soft-warning design needs to know what real `missing`/`invalid` rates look like under normal traffic in order to be calibrated (e.g. to avoid warning legitimate users constantly). With zero observed non-`valid` events, there's no rate to calibrate against yet. The *system* itself (this telemetry pipeline) is confirmed working and would be the correct foundation for a soft-warning design once enough data accumulates.

**6. Does the telemetry support hard enforcement?**
**No.** A sample size of 1, covering 1 of 8 routes, cannot support any enforcement decision. This is the expected, unsurprising answer given the sample size — not a close call.

**7. What minimum next step is safest?**
**Extend the sampling window**, not design soft-warning mode yet. Soft-warning design requires knowing what's normal; this snapshot doesn't yet establish that. A longer sampling period — ideally also resolving the route_counts coverage gap noted in Q4 — is the safer, more useful next step.

---

## Remaining Gaps

| Gap | Detail |
|---|---|
| **Sample size is far too small** | n=1 across all buckets and routes. No conclusion in this document should be read as more than a directional placeholder pending more data. |
| **`route_counts` coverage gap vs. console-log-verified coverage** | D-148B/C observed `status=valid` console logs for 5 routes; this snapshot's `route_counts` shows only 1. The cause of this discrepancy is unknown and should be investigated alongside the next sampling pass. |
| **No time-window context** | This snapshot has no "since when" boundary — it's unclear whether this is the lifetime total since the D-147B migration was applied, or some other window. |
| **`archiveMyHumanXItem` and `promoteBeliefSnapshot` have zero live or persisted observations** | Two of eight instrumented routes remain entirely unobserved in any D-148/D-149 checkpoint. |

---

## Explicit Verdict: No Enforcement

**This review does not support enabling any enforcement, soft or hard, today.** Consistent with every prior checkpoint in this chain since D-146A: the system remains advisory-only, `ownerTokenStatus()`'s result is not used to allow or reject any request, and nothing about this analysis changes that. This is analysis only — no code, no migration, no configuration change was made or is recommended as part of this checkpoint.

---

## Recommended Next Patch

**D-149B — Longer sampling window**, not soft-warning design. The evidence here is too thin to design or calibrate a soft-warning mode against — a soft-warning threshold needs a real baseline rate of `missing`/`invalid`/`uid_mismatch` under normal traffic, which a single-row, single-route snapshot cannot provide. D-149B should pull a telemetry snapshot after a meaningfully longer period of real usage (and ideally also resolve the `route_counts` coverage discrepancy noted above, e.g. by confirming the other previously-console-verified routes are also being persisted) before any soft-warning design work begins.

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 1000 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-148F — this checkpoint is analysis-only and made no code, migration, or test changes; the baseline was re-run and reconfirmed before this commit.
