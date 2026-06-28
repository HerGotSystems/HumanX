# D-192A — Lightweight Analytics / Observation Audit

**Date:** 2026-06-28
**HEAD at audit:** `2e8efe1`
**Baseline:** 1589/24/57
**Scope:** Read-only audit. No code changes. `public/app-v10.js`, `src/worker.js`, `src/graph-status.js`.

---

## Privacy Principles (Non-Negotiable)

These apply to any observability work in HumanX, now and later:

1. **No external analytics services.** No Google Analytics, no Meta Pixel, no Mixpanel, no Hotjar, no session replay of any kind.
2. **No fingerprinting.** No canvas fingerprinting, no navigator probing, no cross-device linking.
3. **No individual user tracking.** Aggregate counters only. Do not log which specific user did what.
4. **No cookies for analytics.** Existing session behavior (localStorage user ID) is not tracking — it's session state. Do not add analytics cookies.
5. **No third-party beacons.** All observability stays inside the Cloudflare D1 / Worker boundary already in use.
6. **Prefer manual observation for the first 20 users.** The preview group is small enough to observe directly through conversations and Review queue inspection.
7. **Collect only what you will actually read.** Vanity metrics that don't inform a decision are waste, not data.

---

## Current Observability Map

### What exists today — without any new code

#### 1. Graph status (public aggregate counts)

`GET /api/graph-status` → `src/graph-status.js`

Returns raw row counts from six tables:

| Counter | What it tells you |
|---------|------------------|
| `claims` total | How many claims exist |
| `evidence` total | How many evidence items exist |
| `truths` total | How many truth statements exist |
| `evidenceClaimLinks` total | How many evidence-to-claim links exist |
| `claimVotes` total | How many votes cast (all time) |
| `reports` total | How many report actions taken |

**Limitation:** All counts are cumulative lifetime totals. No time window, no per-user breakdown, no per-claim breakdown from this endpoint. No way to tell from this alone whether activity is from preview users or demo seed data.

#### 2. Debug state (admin-only)

`GET /api/debug-state` → `debugState()` in `worker.js` (admin token required)

Returns row counts for all 17 tables including internal ones: `users`, `rate_limits`, `duplicate_signatures`, `aip_packets`, `analysis_results`, `belief_snapshots`, `home_tests`, etc. Also returns the 5 most recent claims with `review_state`.

**Most useful signal during preview:** `users` count tells you how many distinct user IDs have been generated (includes anon visitors). `home_tests` tells you how many tests have been submitted. `analysis_results` tells you how many RunPacks have been completed.

#### 3. Review queue (admin UI)

The Review tab (visible to admin only) shows all pending evidence, pressure, claims, and truths awaiting approval. During a preview:
- Each new submission from a preview user appears here
- You can see item content and timestamp
- You cannot see which user submitted without cross-referencing

**This is the richest signal available for preview.** Every contribution action (except tests and analysis, which are immediate) surfaces here.

#### 4. My HumanX (per-user, not admin-accessible)

Each user can see their own submissions at `/api/my-humanx`. The operator cannot inspect another user's My HumanX without logging in as that user. Not a usable operator signal.

#### 5. Owner token telemetry (admin-only)

`GET /api/debug/owner-token-telemetry` → logs to `owner_token_telemetry` D1 table.

Tracks which routes are hit by users with owner tokens (belief snapshots, belief promote, getMe, myHumanX, saveProfileSettings, archiveMyHumanXItem). Broken down by route and status bucket. Includes `uid_suffix` (last 6 chars of user ID) and a hashed user agent — not a full identity but correlatable for debugging.

**Useful for:** Knowing whether verified users are actually using profile/account features vs. leaving them untouched.

#### 6. Rate limit table

`rate_limits` table exists. Row count visible via debug state. No structured logging of which rate limits were hit, just cumulative rows. Useful for detecting spam waves (sudden rate_limits spike).

#### 7. Cloudflare Worker request logs

The Worker logs `console.log()` calls for owner-token telemetry events:
```
[owner-token] route=getMe status=valid uid=...abc
```

These go to Cloudflare's Worker Logs (Logpush or the dashboard "Logs" tab). Not structured or queryable without Logpush set up. They exist but are ephemeral.

---

## What Is Currently Invisible

These are the blind spots — things that happen on the frontend or in user sessions that produce no signal today:

| Blind spot | Why it matters |
|------------|---------------|
| **Did the user reach Study mode?** | A user who opens a claim vs. only seeing the Arena list is a meaningful distinction. No signal. |
| **Did they use the Copy Claim Link button?** | Core sharing flow. `copyClaimLink()` executes entirely in the browser — no backend call. Zero signal. |
| **Did they attempt to add evidence and stop?** | Drop-off inside the side panel (opened the form but didn't submit) is invisible. |
| **Did they try the Builder?** | `renderBuilderStep1/2/3` are frontend-only state changes. No route hit until `POST /api/claims` on final submit. |
| **Did they reach Builder Step 3 but abandon?** | Most critical abandon point. Completely invisible. |
| **Did invite redemption succeed or fail?** | `POST /api/auth/invite/redeem` returns a result, but success/failure rate is not aggregated anywhere. |
| **Did they generate a RunPack?** | `POST /api/runpack` does hit the backend — so this IS logged in route counts, but not surfaced as a named metric anywhere. |
| **Did they download the RunPack?** | `downloadRunPack()` is browser-only. No signal. |
| **Did they view a direct claim URL (`/c/:id`)?** | `renderClaimShell()` fires from the Worker — request logs exist in Cloudflare, but not structured. |
| **Which tabs in Study mode did they visit?** | Evidence / Pressure / Tests / Analysis tab switching is frontend state only. |
| **How long did they spend?** | No session duration, no time-on-page. |
| **Did they bounce immediately?** | No page view signal at all — no beacon, no API call on home load. |
| **Mobile vs desktop?** | `navigator.userAgent` is available but never logged. |
| **Invite code used vs not?** | Redemption is logged as a route hit, but not with which code — so you can't correlate invite batches to activity. |

---

## What Can Be Inferred Without Tracking Individuals

Even without new code, the following are readable from existing data:

| Question | How to answer it today |
|----------|----------------------|
| Is anyone submitting claims? | Review queue + `claims` count delta day-over-day |
| Is anyone voting? | `claimVotes` count delta |
| Is anyone submitting evidence/pressure? | Review queue items |
| Are any preview users verifying their accounts? | `users` count that have `verified=true` — queryable via admin D1 console |
| Are RunPacks being generated? | `aip_packets` row count in debug state |
| Are tests being added? | `home_tests` row count in debug state |
| Is the backend healthy? | `/api/health` — `live` flag and mode |
| Are rate limits being hit? | `rate_limits` count spike |
| Are there spam submissions? | Review queue showing unfamiliar content not from preview users |

---

## Minimum Signals That Would Materially Help

The first preview group is 5–20 users. At this scale, most questions are answerable by talking to users directly. The signals below would help when direct feedback is absent or contradictory — i.e., where you need to check "did anyone actually try this" rather than ask.

### Tier 1 — Already visible, just needs checking (no new code)

| Signal | How to read it |
|--------|---------------|
| Review queue volume | Open Review tab. Count pending items. If zero after 48h, no one submitted. |
| `home_tests` delta | Compare debug-state `home_tests` count before vs. after sending invites. |
| `claimVotes` delta | Same — compare before/after. |
| `aip_packets` delta | Same — indicates RunPack use. |
| `claims` review-state breakdown | D1 console query: `SELECT review_state, COUNT(*) FROM claims GROUP BY review_state` — shows how many claims are in review vs. public. |

### Tier 2 — One aggregate backend counter would provide real signal (D-192B scope)

The single highest-value blind spot is **Study view opens**. Every meaningful user action in HumanX happens inside Study mode — voting, evidence, RunPack, tests. If no one is opening Study mode, everything else is moot. Currently there is no signal for this.

A single write to a D1 counter (no user ID, just an increment) on `GET /api/claims/:id` would give this. The route is already called — it just needs to be counted somewhere queryable.

Second-highest: **Copy Claim Link usage.** The sharing flow is the mechanism for organic preview spread. `copyClaimLink()` is entirely frontend and produces no backend signal. A tiny fire-and-forget `POST /api/event` with `{type: 'copy_link'}` — no user ID, no claim ID in the payload if privacy-sensitive — would confirm whether sharing is being attempted.

### Tier 3 — Answered by talking to users (no code needed)

| Question | Manual method |
|----------|--------------|
| Did they reach Study mode? | Ask in feedback |
| Did they find the Builder? | Ask in feedback |
| Did they try on mobile? | Ask in feedback |
| Did the invite redemption flow make sense? | Ask in feedback |
| Did the Copy Claim Link button do what they expected? | Ask in feedback |

---

## What NOT to Track

| Item | Why not |
|------|---------|
| Individual user page views | Violates privacy principle #3; unnecessary at preview scale |
| Time on page / session duration | Session replay territory; not actionable at 5–20 users |
| Scroll depth | Same |
| Mouse movement or click maps | Hotjar territory — explicitly excluded |
| Which specific user submitted which item | Review queue shows content, not identity; keep it that way |
| Failed login attempts | Would require storing failure data near auth routes; unnecessary for preview |
| User agent strings in full | Already hashed in owner-token telemetry — that's sufficient |
| Geolocation | No value for a trusted preview of named users |
| Cross-session identity linking | The existing localStorage anon ID is per-browser, not cross-device. Do not attempt to link them. |

---

## Useful vs. Vanity Metrics

| Metric | Useful or vanity? | Why |
|--------|-----------------|-----|
| Total claims count | **Vanity** during preview | Includes demo seed data; not meaningful for 5–20 user preview |
| Claims submitted by preview users | **Useful** | Distinguishes preview activity from baseline |
| Votes cast | **Useful** | Indicates engagement with Study mode |
| Evidence/pressure in Review queue | **Useful** | Shows contribution loop working |
| RunPack generates (`aip_packets`) | **Useful** | Shows whether the core output is being used |
| Tests added (`home_tests`) | **Useful** | Shows contribution depth |
| Copy link clicks | **Useful if measurable** | The sharing mechanic is the growth path |
| Study mode opens | **Useful if measurable** | Gateway to all contribution actions |
| Invite redemption rate | **Useful** | How many of the 5–20 actually redeemed? |
| "Total users" count | **Vanity** | Includes every anon visitor |
| `reports` count | **Useful operationally** | Spike = spam or abuse |
| Social preview renders | **Useful post-launch** | Twitter Card validation data — not needed during preview |

---

## Manual Observation Plan — First 5–20 Users

For a preview group this small, structured manual observation is more reliable than metrics. Run this checklist once per day during active preview:

### Daily (5 minutes)

1. Open admin Review queue — note count of pending items, spot-check content
2. Compare debug-state counters to yesterday's baseline:
   - `home_tests` delta
   - `claimVotes` delta
   - `aip_packets` delta
3. Check if any new user IDs with `verified=true` exist (D1 console: `SELECT COUNT(*) FROM users WHERE verified=1`)
4. Note any user messages/replies received

### Weekly (15 minutes)

1. Run full diff of debug-state table counts vs. week-start snapshot
2. Summarize which feedback themes appeared more than once
3. Decide: any P1 friction points to fix before next batch?

### One-time (before expanding the batch)

- D1 console: `SELECT review_state, COUNT(*) FROM claims GROUP BY review_state` — how many claims came in, how many approved?
- D1 console: `SELECT COUNT(*) FROM users WHERE verified=1` — how many preview users redeemed invite?
- Review copy-paste feedback replies — what was the #1 point of confusion?

---

## Suggested D-192B Scope

**Recommendation: Do D-192B after the first feedback round, not before.**

The highest-value gap (Study mode opens) could be covered by a tiny aggregate counter in the Worker — no user ID, no PII, just an increment on `GET /api/claims/:id`. But:

1. The first 5–20 user preview is small enough that you can ask directly whether users reached Study mode
2. The operator has direct contact with each preview user
3. Implementing even a minimal event counter before first feedback adds risk (new code before preview launch) for marginal benefit

If after the first preview round you find yourself asking "did anyone actually open a Study?" and direct feedback is inconclusive, that's the trigger for D-192B.

**If D-192B happens, limit it to:**

| Counter | Storage | User ID? | Claim ID? |
|---------|---------|---------|---------|
| Study view opens (per-day aggregate) | D1 table: `event_counts(date, event, n)` | No | No |
| Copy link button click (aggregate) | Same table | No | No |
| RunPack generate (already exists as `aip_packets` rows) | Already tracked | No | Yes (needed for RunPack itself) |
| Invite redemption success/fail | D1 or owner-token telemetry extension | No | No |

Total: one new D1 table, one lightweight upsert, no frontend JS tracking library. Keep it so small that it can be explained in two sentences to any privacy-conscious user.

**D-192B is optional. Manual observation is sufficient for wave 1.**

---

## Files Referenced

| File | Relevant to this audit |
|------|----------------------|
| `src/graph-status.js` | Public aggregate counts (claims, evidence, truths, votes) |
| `src/worker.js` lines 99, 161–230 | `debugState()`, `ownerTokenTelemetryDebug()` |
| `src/worker.js` lines 1026, 1036 | `logOwnerTokenTelemetry()` — existing structured log |
| `public/app-v10.js` line 267 | `copyClaimLink()` — browser-only, no backend signal |
| `public/app-v10.js` line 392 | `generateRunPack()` — hits `/api/runpack`, so backend-visible |
| `public/app-v10.js` line 120 | `redeemInviteUI()` — hits `/api/auth/invite/redeem` |
