# D-149H — Passive Owner Token Telemetry Hold Protocol

**Date:** 2026-06-24
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F → D-149A→G (telemetry built, widened, curated coverage confirmed, time-windowing added and verified, first organic review) → D-149H (this doc — hold protocol)
**Scope:** Docs only. No code, no migration, no `wrangler.toml`, no enforcement, no soft warning.

---

## Purpose

D-149G completed the first organic/passive telemetry review and concluded that neither hard enforcement nor soft-warning design is justified yet. This document freezes the enforcement decision, defines exact re-review thresholds, and specifies the stop condition for owner-token security work until the data warrants it.

---

## 1. Current Telemetry State (from D-149G)

Source: `GET /api/debug/owner-token-telemetry?window=<value>` via `x-humanx-admin` header. Sanitized. No token, secret, or admin-token value is recorded here.

| Window | total_count | valid_count | valid_ratio | observed routes | unobserved routes |
|---|---|---|---|---|---|
| 1h | 1 | 1 | 1.0 | getMe | myHumanX, archiveMyHumanXItem, exportMyHumanX, saveProfileSettings, saveBeliefSnapshot, listBeliefSnapshots, promoteBeliefSnapshot |
| 24h | 5 | 5 | 1.0 | getMe, myHumanX, listBeliefSnapshots | archiveMyHumanXItem, exportMyHumanX, saveProfileSettings, saveBeliefSnapshot, promoteBeliefSnapshot |
| 7d | 19 | 19 | 1.0 | all 8 owner routes | (none) |

Non-valid status buckets (all windows): `secret_missing: 0`, `missing: 0`, `invalid: 0`, `expired: 0`, `uid_mismatch: 0`.

Traffic source: single user (owner), organic browsing. No second user. No scripted load.

---

## 2. Why No Enforcement Is Allowed Yet

1. **Sample too small.** 19 total events over 7d from one user does not constitute a meaningful distribution. Enforcement designed from n=19 single-user data is calibrated on noise.
2. **No multi-user signal.** All traffic is the owner. There is no evidence of how non-owner users' clients would behave — what token-missing or token-invalid rates would look like in practice.
3. **No non-valid events observed.** Enforcement only makes sense when there is empirical evidence of what the non-valid failure rate looks like organically. With zero non-valid events, any threshold for rejection would be invented, not calibrated.
4. **No user harm prevented.** Until a second user exists whose requests might carry invalid tokens, hard enforcement would only block the owner's own requests — which are currently always valid.
5. **The chain's explicit policy.** Every checkpoint from D-145A onward deferred enforcement pending telemetry evidence. D-149G is the first organic data point; it does not overturn that deferral.

**Verdict: hard enforcement is not allowed.** This decision holds until a threshold in §4 is met.

---

## 3. Why Soft-Warning Design Is Still Premature

Soft warnings are only meaningful when there is something to warn about. A soft-warning mechanism requires:

- A non-zero observed rate of non-valid events to calibrate the warning threshold.
- Enough sample volume to distinguish a signal from a transient one-off.
- A second user whose client might produce warnings, giving the warning UI a real audience.

Currently: all three conditions are unmet. Designing warning UI for a scenario that has never appeared organically is speculative infrastructure. It would also create pressure to ship the warning before the data justifies it.

**Verdict: soft-warning design (D-150A) is premature.** Do not begin it until a re-review threshold in §4 is met.

---

## 4. Passive Sampling Thresholds

These are the exact conditions that trigger a re-review. Only one needs to be met.

| Threshold | Condition | Re-review type |
|---|---|---|
| **T1** | 7d `total_count` ≥ 50 | Standard re-review — assess whether volume now supports soft-warning design |
| **T2** | 7d `total_count` ≥ 100 | Stronger re-review — assess whether volume now supports enforcement-readiness discussion |
| **T3** | Any non-valid bucket > 0 in any window | Immediate review — characterize the failure, assess whether it is systemic or transient |
| **T4** | A second real user appears in `route_counts` or telemetry (distinct uid) | Immediate review — multi-user signal changes the enforcement calculus entirely |
| **T5** | `valid_ratio` drops below 0.98 in any window | Immediate review — investigate cause before any enforcement discussion |

**No threshold, no action.** If none of T1–T5 are met, owner-token security work does not resume.

---

## 5. Future Review Command

When a threshold is met, pull the three windows from the browser console or a terminal session authenticated with the admin header. Do not print, paste, or commit the admin token value.

### Browser console (on a tab where the admin session is active)

```js
// Run each separately; paste only the sanitized JSON here — never the header value.
const base = 'https://humanx.rinkimirikata.com/api/debug/owner-token-telemetry';
const h = { 'x-humanx-admin': '<ADMIN_TOKEN_NOT_PRINTED>' };

const [r1h, r24h, r7d] = await Promise.all([
  fetch(`${base}?window=1h`,  { headers: h }).then(r => r.json()),
  fetch(`${base}?window=24h`, { headers: h }).then(r => r.json()),
  fetch(`${base}?window=7d`,  { headers: h }).then(r => r.json()),
]);

console.log(JSON.stringify({ one_hour: r1h, twenty_four_hours: r24h, seven_days: r7d }, null, 2));
```

### Sanitized fields to record per window

For each window record only: `window`, `total_count`, `valid_count`, `valid_ratio`, `status_counts`, `route_counts`, `observed_routes`, `unobserved_owner_routes`, `query_error`. Do not record `window_started_at`, `window_ended_at`, or any raw token/uid/secret value.

---

## 6. Stop Condition

> **Do not continue owner-token security work — no enforcement, no soft-warning design, no related backend or frontend changes — until at least one threshold from §4 is met, unless a concrete bug is found in the token infrastructure itself.**

"Security work" includes: adding rejection logic, adding warning UI, adding rate-limiting, adding alert mechanisms, changing the behavior of `ownerTokenStatus()`, or adding new owner-token-related routes. It does not include: fixing a crash, fixing incorrect telemetry recording, or fixing a security issue unrelated to owner-token enforcement.

If a threshold is met, open a new checkpoint doc (D-149I or later) citing which threshold triggered the review, paste the sanitized telemetry evidence, and assess from there. Do not amend this document — it is a protocol record, not a living assessment.

---

## 7. Recommended Next Non-Token Workstream

Owner-token telemetry is in a hold. The following workstreams are available and do not depend on the hold being lifted:

- **UI/product polish.** The public profile, Belief Mirror, and My HumanX dashboard all have known polish gaps from prior QA passes.
- **Evidence moderation operations.** The review queue and moderation tooling are live; any accumulated queue items or edge-case behavior can be addressed.
- **Belief Engine improvements.** Scoring, snapshot display, or belief-engine UX refinements.
- **General hardening or observability.** Non-owner-token hardening passes, read-smoke CI, or other static-check extensions.

Any of these can proceed immediately without waiting for owner-token telemetry to mature.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1016 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-149G. This checkpoint made no code, migration, or test changes.

---

## D-149 Chain — Final Status

| Patch | Summary |
|---|---|
| D-149A | First telemetry review — n=1, 1 route, too small. |
| D-149B | Sampling report widened — per-route, per-status, observed/unobserved. |
| D-149C | Widened report confirmed live. |
| D-149D | All 8 routes exercised (curated, not organic). |
| D-149E | Time-window reporting added. |
| D-149F | Time-windowing confirmed live. |
| D-149G | First organic review — n=19/7d, valid_ratio 1.0, zero non-valid. No enforcement, no soft warning justified. |
| **D-149H** | **Hold protocol defined. Exact thresholds set. Stop condition stated. Non-token workstreams identified. D-149 chain closed pending T1–T5.** |
