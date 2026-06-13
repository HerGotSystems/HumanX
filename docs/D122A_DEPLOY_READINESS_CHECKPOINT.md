# D-122A — Deploy Readiness Checkpoint

**Date:** 2026-06-13  
**Mode:** DOCS ONLY — no code changes, no deploy, no Wrangler, no D1, no production query, no admin token, no live write, no mutation.

> Purpose: pre-deploy go/no-go record covering D-119B, D-119C, and D-120C changes before the next Cloudflare Worker deployment.

---

## 1. Current State

| Field | Value |
|---|---|
| Current main HEAD | `2eaca6a` (Merge PR #143 — D-120D audit) |
| Last deployed Worker version | `3fe7ab7f-b603-407b-b7b8-31111956a3ea` |
| Static baseline | `416 / 24 / 56` (hardening / belief-engine / worker-route) |
| Worker entrypoint | `src/worker.js` |
| Frontend entry | `public/index.html`, `public/app-v10.js` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` |

---

## 2. What Has Changed Since Last Deployed Worker

Commits between last recorded deploy and current main HEAD that touch deployable files:

| Commit | Task | Files changed |
|---|---|---|
| `77df741` | D-119B | `public/app-v10.js`, `public/apps/humanx-belief-engine/humanx-bridge.js`, `docs/README.md` |
| `4683c69` | D-119C | `public/apps/humanx-belief-engine/index.html` |
| `3f07c1e` | D-120C | `src/worker.js`, `src/belief-snapshots.js` |

Docs-only commits (`e6a4eaf`, `e5ef450`, `c63a07e`, `2eaca6a`, etc.) have no deployable surface and are not listed.

---

## 3. Change Summaries

### 3A — D-119B: Belief Engine public onboarding copy (`public/app-v10.js`, `humanx-bridge.js`)

**Copy changes — no logic changes, no new routes, no schema changes.**

| Surface | Change |
|---|---|
| Home card — Belief Engine description | Added: "It helps separate personal certainty, inherited ideas, identity pressure, and what could change your mind." |
| Home card — Drift description | Changed to: "A trail of what you believed and how it changed — not a scoreboard." |
| Home card — Truths description | Updated to clarify that a Truth records repeated assertion, not proven fact; HumanX does not decide correctness. |
| `humanx-bridge.js` pre-click note | Added `<p>` note before Send to HumanX button: clarifies snapshot is not immediately published, and that turning it into a Truth or Claim enters Review before becoming visible to others. |
| `docs/README.md` | Fixed capitalisation ("Live write" → "live write") to match smoke-test assertion. Restored 416 baseline. |

**Risk:** Low. Copy-only. No new endpoints. No logic change. No schema change.

### 3B — D-119C: Belief Engine intro/result screen copy (`public/apps/humanx-belief-engine/index.html`)

**Copy changes — no logic changes.**

| Surface | Change |
|---|---|
| Intro hook | "This exposes the actual architecture." → "This is not a test you pass or fail." |
| Intro sub (new) | Added: "It maps the structure around a belief: where it came from, how strongly it is tied to identity, what pressure it survives, and what could change it. The result is a pressure map, not a label." |
| Intro note | Expanded: clarified no correct answers, no religion assigned, no diagnosis, no score of worth; added note that result can be sent into HumanX Review privately or later. |
| Results framing (new) | Added `<p class="results-framing">` beneath the results heading: "This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict." |

**Risk:** Low. Frontend HTML only. Static file — no Worker change. No schema change.

### 3C — D-120C: Public write guardrails (`src/worker.js`, `src/belief-snapshots.js`)

**Backend logic changes — Worker code only, no schema change.**

| Patch | File | Change |
|---|---|---|
| Patch 1 — RunPack rate limit | `src/worker.js` | Added `safeRateLimit(request, env, \`runpack:${ip(request)}\`, 20, 3600000)` as first statement in `createAipPacket`. Applies to both `/api/runpack` and `/api/aip`. Fail-closed: unavailability → HTTP 503, exhaustion → HTTP 429. |
| Patch 2 — Report escalation threshold | `src/worker.js` | Raised all 3 auto-escalation thresholds from `report_count+1>=2` to `report_count+1>=5` (claim, evidence, pressure branches). Evidence score-recalc trigger also raised from `===2` to `===5` to stay in sync. |
| Patch 3 — Belief snapshot payload cap | `src/belief-snapshots.js` | Added 64 KB guard (`MAX_SNAPSHOT_BYTES = 65536`) in `saveBeliefSnapshot` after object type-check, before any DB access. Error: `BAD_BELIEF_SNAPSHOT_TOO_LARGE` / HTTP 400. |

**Risk:** Medium. Worker code changes. All 3 patches are additive guards — they tighten, not loosen. No new routes. No schema migration. No D1 table changes. No admin-token change. Fail-closed rate limiting means unavailability blocks rather than opens. Threshold raise is a moderation policy change (5 reports now needed to auto-escalate, vs. 2 before); single-user or low-volume harassment window is slightly wider.

---

## 4. Static Checks

Run against current main HEAD (`2eaca6a`):

| Check | Command | Result |
|---|---|---|
| Worker syntax | `node --check src/worker.js` | **OK** |
| Frontend syntax | `node --check public/app-v10.js` | **OK** |
| Hardening smoke tests | `node scripts/hardening-smoke-test.mjs` | **416 passed, 0 failed** |
| Worker route static check | `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed** |
| Belief Engine static check | `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |

All 5 checks green. No regressions from pre-D-119B baseline.

---

## 5. Deploy Risk Review

### 5A — Copy changes (D-119B, D-119C)

| Item | Assessment |
|---|---|
| Logic change | None |
| New endpoints | None |
| Schema change | None |
| D1 mutation | None |
| Admin-token change | None |
| Trust wording preserved | Yes — "HumanX does not decide if a Truth is correct" added explicitly |
| Belief Engine wording preserved | Yes — "not a diagnosis", "not a label", "not a verdict" all present |
| Review-first wording preserved | Yes — bridge note states content enters Review before becoming visible |
| Rollback | Trivial — revert the 2 frontend files to previous HEAD |

**Risk: LOW**

### 5B — Backend guardrails (D-120C)

| Item | Assessment |
|---|---|
| Logic change | Yes — rate limit added to RunPack; report thresholds raised; payload cap added |
| New endpoints | None |
| Schema change | None — uses existing `rate_limits` table with same schema |
| D1 mutation | `rate_limits` table will gain `runpack:<ip>` rows on first RunPack call; this is expected and harmless |
| Admin-token change | None |
| Fail-open risk | None — all 3 patches fail closed (503 on unavailability, 429 on exhaustion, 400 on oversize) |
| Regression risk | Low — existing callers that were under 20 RunPacks/hr are unaffected; report escalation behaviour is looser (harder to auto-escalate), not stricter |
| Rollback | Revert `src/worker.js` and `src/belief-snapshots.js` to pre-D-120C; no schema rollback needed |

**Risk: MEDIUM** — Worker code change with side-effectful rate-limit writes, but all guards are additive and fail-closed. No breaking change to any existing API response shape.

### 5C — No-go conditions

| Condition | Status |
|---|---|
| Any static check failing | Not present — all 5 green |
| Schema migration required | Not required |
| Admin-token rotation required | Not required |
| Breaking API shape change | Not present |
| Known defect in changed code | Not found — D-120D audit verdict PASS |

---

## 6. Manual Post-Deploy Smoke Checklist

To be executed by the owner after deploy. All steps are read-only unless noted.

| # | Check | Expected result |
|---|---|---|
| 1 | `GET /api/health` | Returns `{ ok: true, ... }` — no 5xx |
| 2 | Home page loads | Cards render; Belief Engine card shows updated description copy |
| 3 | Claims list loads | `/api/claims` returns public claims list |
| 4 | Belief Engine loads | `public/apps/humanx-belief-engine/index.html` renders; intro screen shows "not a test you pass or fail" |
| 5 | Review page (no token) | Shows "authorisation required" / prompt — does not expose queue |
| 6 | RunPack for a public claim | Builds successfully for first call; `aip_packets` row created. After 20 calls from same IP in 1 hour, next call returns HTTP 429. *(Rate exhaustion test is optional at launch; confirm by inspection only.)* |
| 7 | Report escalation threshold | Any auto-escalation to `review` state now requires 5 reports, not 2. Cannot verify without live reports; accept on audit evidence unless a test report flow exists. |
| 8 | Oversized belief snapshot | If a test harness is available: POST >64 KB JSON to `/api/belief-snapshots` → expect HTTP 400 `BAD_BELIEF_SNAPSHOT_TOO_LARGE`. Otherwise defer to post-launch testing. |

---

## 7. Deploy Boundary

**This task does not deploy.**

The next deploy requires a separate explicit instruction from the owner. The deploy command is `wrangler deploy` (or equivalent) and must be explicitly authorised. No deploy was performed in D-119B, D-119C, D-120C, D-120D, or this D-122A task.

---

## 8. Final Recommendation

**READY TO DEPLOY WITH NOTES**

Go conditions satisfied:
- All 5 static checks green.
- No schema migration required.
- No admin-token change required.
- No breaking API shape change.
- D-120D post-merge audit: PASS.
- D-119D onboarding copy audit: PASS WITH NOTES (minor gap in drift-trail copy, non-blocking).

Notes (not blockers):
- D-120C report threshold raise (2 → 5) is a moderation policy change. The window for a single user to harass a claim before auto-escalation is wider. Acceptable for current low-volume beta; revisit before scaling.
- D-116B read-only D1 audit, D-117B normal-user browser QA, and D-118C tokened Review QA were environment-blocked (not failed). Source-verification audit was substituted. Owner accepts this risk per D-121A.
- Post-deploy smoke checklist items 7 and 8 cannot be verified without live traffic or a test harness. These are deferred to post-launch observation.

Deploy when ready. No further code changes required for this batch.

---

## 9. Confirmation

> Docs-only checkpoint. No code changes. No Wrangler. No D1. No production query. No admin token. No live write. No mutation. Doc committed locally only, not pushed.
