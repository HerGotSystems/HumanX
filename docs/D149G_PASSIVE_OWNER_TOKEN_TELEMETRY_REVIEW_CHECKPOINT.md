# D-149G — Passive Owner Token Telemetry Review

**Date:** 2026-06-24
**Chain:** D-145A→C → D-146A→C → D-147A→C → D-148A→F → D-149A→F (telemetry added, widened, curated sample confirmed, time-windowing added and live-verified) → D-149G (this doc — first organic/passive review)
**Scope:** Analysis only. No code changes. No migration. No `wrangler.toml` change. No enforcement. No soft warning.

---

## Purpose

D-149F confirmed that time-windowed telemetry is live and correct. This is the first review of genuinely organic traffic — traffic that accumulated since D-149F without any deliberate triggering by the owner. It reviews the telemetry across three windows (`1h`, `24h`, `7d`) and gives a verdict on enforcement readiness.

---

## Sanitized Telemetry Evidence

Source: `GET /api/debug/owner-token-telemetry?window=<value>` via `x-humanx-admin` header.
No owner token value, no `HUMANX_OWNER_SECRET`, no admin token value is printed or stored here.

### 1h window

| Field | Value |
|---|---|
| `total_count` | 1 |
| `valid_count` | 1 |
| `valid_ratio` | 1.0 |
| `status_counts` | valid: 1, all others: 0 |
| `route_counts` | getMe: 1 |
| `observed_routes` | getMe |
| `unobserved_owner_routes` | myHumanX, archiveMyHumanXItem, exportMyHumanX, saveProfileSettings, saveBeliefSnapshot, listBeliefSnapshots, promoteBeliefSnapshot |

### 24h window

| Field | Value |
|---|---|
| `total_count` | 5 |
| `valid_count` | 5 |
| `valid_ratio` | 1.0 |
| `status_counts` | valid: 5, all others: 0 |
| `route_counts` | getMe: 3, listBeliefSnapshots: 1, myHumanX: 1 |
| `observed_routes` | getMe, myHumanX, listBeliefSnapshots |
| `unobserved_owner_routes` | archiveMyHumanXItem, exportMyHumanX, saveProfileSettings, saveBeliefSnapshot, promoteBeliefSnapshot |

### 7d window

| Field | Value |
|---|---|
| `total_count` | 19 |
| `valid_count` | 19 |
| `valid_ratio` | 1.0 |
| `status_counts` | valid: 19, all others: 0 |
| `route_counts` | getMe: 8, myHumanX: 3, listBeliefSnapshots: 3, archiveMyHumanXItem: 1, exportMyHumanX: 1, saveProfileSettings: 1, saveBeliefSnapshot: 1, promoteBeliefSnapshot: 1 |
| `observed_routes` | all 8 owner routes |
| `unobserved_owner_routes` | (none) |

---

## Passive-Sampling Interpretation

### 1. Volume

| Window | total_count | valid_count |
|---|---|---|
| 1h | 1 | 1 |
| 24h | 5 | 5 |
| 7d | 19 | 19 |

The 7d count is 19. After excluding D-149D's curated session (which exercised all 8 routes deliberately), the post-D-149F organic volume is low but non-zero. The `1h` and `24h` windows reflect only recent organic activity, making them clean signals.

### 2. Valid Ratio

`valid_ratio = 1.0` across all three windows. There are zero non-valid events: no `missing`, `invalid`, `expired`, `uid_mismatch`, or `secret_missing` records in any window. This is a strong early signal — the owner token infrastructure is functioning correctly and the owner's client is issuing valid tokens consistently.

### 3. Non-valid Status Buckets

None observed in any window. All five non-valid buckets are at zero for every window. There is nothing to investigate here.

### 4. Route Coverage

- **1h / 24h:** Partial route coverage only. This is expected and normal for short windows with low-cadence organic use. Read-heavy routes (`getMe`, `myHumanX`, `listBeliefSnapshots`) dominate, which is consistent with browsing sessions rather than write actions.
- **7d:** All 8 owner routes appear, meaning the owner has exercised every route at least once over the past week. This includes lower-frequency write routes (`saveProfileSettings`, `saveBeliefSnapshot`, `promoteBeliefSnapshot`, `archiveMyHumanXItem`, `exportMyHumanX`) each appearing exactly once.

The `getMe` count of 8 across 7d (≈1.1/day) is consistent with occasional, non-automated use — not synthetic load.

### 5. Organic vs. Curated Assessment

This traffic is **organic**. Indicators:

- The short windows (`1h`, `24h`) have unobserved routes, which is what genuine usage patterns look like — not every route is hit every hour.
- Write routes appear only once each over 7d, consistent with real, infrequent write actions rather than scripted exercise.
- `getMe` dominates (8/19 = 42%), reflecting natural read-heavy usage patterns where the client checks identity frequently.
- No burst patterns or uniform distribution across routes that would suggest deliberate cycling.

### 6. Remaining Gaps

- **Sample size is still small.** 19 total events over 7d from a single user (the owner) is not a statistically significant sample for enforcement design.
- **Single-user data only.** All observed traffic is from the owner. There is no multi-user organic data to observe because HumanX does not yet have additional users issuing owner tokens.
- **Short-window coverage is naturally incomplete.** The 1h window having 7 unobserved routes is expected, not a signal of a problem.
- **No non-valid events observed.** This is good, but it also means there is no data on how the system behaves when a degraded or missing token hits a production route — that scenario has not been seen organically yet.

---

## Enforcement-Readiness Verdict

**Hard enforcement: NOT justified.**

Reasons:

1. Sample is still small (n=19 over 7d, single user).
2. No multi-user organic token data exists.
3. The valid_ratio of 1.0 on a tiny sample tells us the happy path works — it does not tell us what real-world failure rates look like in production across users.
4. No non-valid events have been observed, so we have no empirical data on the frequency or source of invalid/missing tokens under organic conditions.
5. Enforcement that was triggered today would fire only on the owner's own traffic — there is no meaningful enforcement target.

This verdict matches the chain's existing position, established in D-149A and reconfirmed at every step since.

**Soft-warning design: NOT yet justified.**

Soft warnings require a meaningful base rate of non-valid events to warn about. With `valid_ratio = 1.0` and zero non-valid events across all windows, there is nothing to warn against. Designing a warning mechanism now would be premature — it would be warning infrastructure with no trigger condition observed in production.

---

## Recommended Next Step

**D-149H — Longer passive sampling.** Continue accumulating organic data without any deliberate triggering. Suggested criteria before reconsidering:

- At least 50–100 total_count events in a 7d window, OR
- At least one non-valid event observed organically, OR
- A second user begins issuing owner tokens and their traffic appears in telemetry.

Until one of those conditions is met, D-150A (soft-warning design) remains premature. The recommended next patch is D-149H: a passive sampling hold with a defined re-review trigger.

---

## Baseline

```
node scripts/hardening-smoke-test.mjs       → 1016 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected parameterised-route warning
```

Unchanged from D-149F. This checkpoint made no code, migration, or test changes.

---

## D-149 Chain Status

| Patch | Summary |
|---|---|
| D-149A | First telemetry review — sample n=1, 1 route, too small. |
| D-149B | Sampling report widened — per-route, per-status, observed/unobserved. |
| D-149C | Widened report confirmed live. |
| D-149D | All 8 routes exercised and confirmed observed (curated sample, not organic). |
| D-149E | Time-window reporting added to isolate organic from curated traffic. |
| D-149F | Time-windowing confirmed live and correct for all supported values. |
| **D-149G** | **First organic/passive review. Valid_ratio 1.0, n=19/7d, single user. No enforcement, no soft-warning design justified. Recommend D-149H passive hold.** |
