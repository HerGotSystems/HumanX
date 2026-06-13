# D-120D: Public Write Guardrail Implementation Audit

**Branch audited:** `fix/d120c-public-write-guardrails`  
**Merge commit:** `3f07c1e`  
**Audit date:** 2026-06-13  
**Auditor:** Claude Code (D-120D task)  
**Verdict:** PASS — all 3 patches confirmed, all static checks green

---

## 1. Audit Scope

Verify that the 3 patches specified in D-120B and implemented in D-120C landed correctly on main. No code changes are proposed or made in this task.

---

## 2. Patch Verification

### Patch 1 — RunPack / AIP rate limit (`src/worker.js`)

**Requirement:** Add `safeRateLimit` call inside `createAipPacket` before any DB access, keyed `runpack:<ip>`, limit 20 per 3 600 000 ms (1 hour). Must not add auth (`requireUser` / `requireAdmin`).

**Source-confirmed (runtime check against `src/worker.js`):**

```
Route /api/runpack -> createAipPacket: true
Route /api/aip    -> createAipPacket: true

createAipPacket first 250 chars:
  async function createAipPacket(request, env) {
    await safeRateLimit(request,env,`runpack:${ip(request)}`,20,3600000);
    const body=await readJson(request); const claimId=cleanId(body.claimId); ...

createAipPacket has requireUser: false
createAipPacket has requireAdmin: false
```

**Result: PASS**  
- Rate limit is the first statement in the function — fires before any DB read or write.  
- Key: `` `runpack:${ip(request)}` `` — per-IP, matches design spec.  
- Limit: 20 / 3 600 000 ms — matches design spec.  
- No auth added — endpoint remains unauthenticated (by design).  
- Both route aliases (`/api/runpack`, `/api/aip`) resolve to the same function.

---

### Patch 2 — Report auto-escalation threshold (`src/worker.js`)

**Requirement:** Raise all 3 report auto-escalation thresholds from `>=2` to `>=5`. Raise the evidence score-recalc trigger from `===2` to `===5` to stay in sync.

**Source-confirmed (runtime scan of `src/worker.js`):**

```
All report_count+1>=N values found: ['5', '5', '5']
Evidence recalc trigger ===N: 5
```

**Result: PASS**  
- Claim branch: `report_count+1>=5` ✓  
- Evidence branch: `report_count+1>=5` ✓  
- Pressure branch: `report_count+1>=5` ✓  
- Evidence score-recalc trigger: `evRow.report_count+1===5` ✓ (in sync with escalation threshold)  
- No stale `>=2` or `===2` values remain.

---

### Patch 3 — Belief snapshot payload cap (`src/belief-snapshots.js`)

**Requirement:** Add a 64 KB size guard in `saveBeliefSnapshot` after the object type-check, before any DB access.

**Source-confirmed (read of `src/belief-snapshots.js`, lines 8–10):**

```javascript
if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return json({ error: 'BAD_BELIEF_SNAPSHOT' }, 400);
const MAX_SNAPSHOT_BYTES = 65536;
if (JSON.stringify(snapshot).length > MAX_SNAPSHOT_BYTES) return json({ error: 'BAD_BELIEF_SNAPSHOT_TOO_LARGE', message: 'Snapshot payload exceeds 64 KB limit.' }, 400);
```

**Result: PASS**  
- Cap constant: `65536` (64 × 1024) — matches design spec.  
- Guard fires after object type-check and before any `env.DB` call.  
- Error code: `BAD_BELIEF_SNAPSHOT_TOO_LARGE` — machine-readable, no user data echoed.  
- HTTP 400 — correct status for oversized input.  
- Pre-existing per-IP rate limit (`belief-snapshot:<ip>`, 20 / 3 600 000 ms) at line 4 is undisturbed.

---

## 3. Static Check Results

All 5 checks run on the post-merge HEAD:

| Check | Command | Result |
|---|---|---|
| Worker syntax | `node --check src/worker.js` | **OK** |
| Frontend syntax | `node --check public/app-v10.js` | **OK** |
| Hardening smoke tests | `node scripts/hardening-smoke-test.mjs` | **416 passed, 0 failed** |
| Worker route static check | `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed** |
| Belief Engine static check | `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |

No regressions. All baselines held.

---

## 4. Constraints Compliance

| Constraint | Status |
|---|---|
| No admin token in docs, logs, or commits | Confirmed — not present |
| No Wrangler / D1 / deploy | Confirmed — no deploy tools used |
| No production mutation | Confirmed — audit-only, read + static checks only |
| No schema changes | Confirmed — all 3 patches are logic-only; no DDL |
| No live writes or submissions | Confirmed |
| No push (commit locally only) | This doc committed locally; not pushed |

---

## 5. Open Items from D-120B

The D-120B design spec identified 2 items deferred for future tasks:

| Item | Status |
|---|---|
| `/api/debug` unauthenticated table exposure | Deferred — not in D-120C scope |
| Belief promote size / content validation in `belief-bridge.js` | Deferred — not in D-120C scope |

These remain open. No action taken in D-120C or this audit.

---

## 6. Verdict

**PASS — all 3 D-120C patches are correctly present and consistent. No defects found.**
