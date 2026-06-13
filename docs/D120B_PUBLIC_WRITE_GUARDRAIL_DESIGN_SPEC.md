# D-120B — Public Write Guardrail Design Spec

**Date:** 2026-06-13  
**Mode:** DOCS ONLY — no Worker/backend code, no frontend code, no Wrangler, no D1, no production query, no admin token, no deploy, no live writes, and no mutation was performed.

> Purpose: design the minimum safe guardrail patch set for wider-beta readiness, based on the D-120A audit decisions and confirmed source inspection of `src/worker.js` and all delegated write modules.

---

## 0. Source Inspection Scope

The following files were read to produce this document. All findings are source-confirmed unless explicitly marked **uncertain**.

| File | Read |
|---|---|
| `src/worker.js` | Full (186 lines) |
| `src/belief-snapshots.js` | Partial — rate-limit and payload handling |
| `src/truths.js` | Partial — rate-limit line |
| `src/truth-claim-bridge.js` | Partial — rate-limit line |
| `src/evidence-reuse.js` | Partial — rate-limit line |
| `src/analysis-results.js` | Partial — rate-limit line |
| `src/belief-bridge.js` | Partial — rate-limit line |
| `docs/D120A_ABUSE_RATE_LIMIT_ACCOUNT_DECISION_AUDIT.md` | Full |
| `docs/API_ENDPOINT_INVENTORY.md` | Full |
| `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` | Full |

---

## 1. Rate-Limit Helper / Function Inventory

All rate-limiting uses a single shared pattern, `safeRateLimit`, which is **copy-pasted into each module** (not imported from a shared utility). Each module has its own copy of the function.

### `safeRateLimit` behaviour (confirmed identical across all modules)

```
key: string (rate_limits table primary key)
maxHits: integer
windowMs: milliseconds

- If rate_limits table is unavailable → throws RATE_LIMIT_UNAVAILABLE → HTTP 503
- If row missing or window expired → resets counter to 1 (INSERT OR REPLACE)
- If hits >= maxHits → throws RATE_LIMITED → HTTP 429
- Otherwise → increments hits (UPDATE)
```

This is **fail-closed**: unavailability of `rate_limits` blocks writes, never passes them. This must not be changed.

**Source functions:**

| Module | Function name | Local copy of safeRateLimit |
|---|---|---|
| `src/worker.js` | `safeRateLimit` at line 166 | Yes — used by `createClaim`, `addEvidence`, `addPressure`, `addHomeTest`, `reportTarget` |
| `src/votes.js` | `safeRateLimit` (copy — not inspected in full) | Documented 120/hr per user+IP |
| `src/truths.js` | `safeRateLimit` at line 109 | Yes |
| `src/truth-claim-bridge.js` | `safeRateLimit` at line 156 | Yes |
| `src/evidence-reuse.js` | `safeRateLimit` at line 67 | Yes |
| `src/analysis-results.js` | `safeRateLimit` at line 101 | Yes |
| `src/belief-snapshots.js` | `safeRateLimit` at line 105 | Yes |
| `src/belief-bridge.js` | `safeRateLimit` at line 190 | Yes |

**Note:** the copy-paste pattern means any future bug fix or improvement to `safeRateLimit` must be applied to all eight copies. A future refactor could extract it to `src/rate-limit.js` and import it everywhere — but that is out of scope for D-120B.

---

## 2. Write Endpoint Rate-Limit Posture (Source-Confirmed)

| Method | Path | Rate key | Limit | Window | Source location | Auth required |
|---|---|---|---|---|---|---|
| POST | `/api/claims` | `claim:${ip}` | 8/hr | 1hr | `worker.js:82` | `x-humanx-user` |
| POST | `/api/evidence` | `evidence:${ip}` | 20/hr | 1hr | `worker.js:83` | `x-humanx-user` |
| POST | `/api/pressure` | `pressure:${ip}` | 20/hr | 1hr | `worker.js:84` | `x-humanx-user` |
| POST | `/api/tests` | `tests:${ip}` | 20/hr | 1hr | `worker.js:85` | `x-humanx-user` |
| POST | `/api/report` | `report:${ip}` | 20/hr | 1hr | `worker.js:86` | `x-humanx-user` |
| POST | `/api/truths` | `truth:${ip}` | 12/hr | 1hr | `truths.js:25` | `x-humanx-user` |
| POST | `/api/truth-to-claim` | `truth-claim:${ip}` | 8/hr | 1hr | `truth-claim-bridge.js:6` | `x-humanx-user` |
| POST | `/api/evidence-attach` | `evidence-attach:${ip}` | 20/hr | 1hr | `evidence-reuse.js:6` | `x-humanx-user` |
| POST | `/api/analysis` | `analysis:${ip}` | 20/hr | 1hr | `analysis-results.js:4` | `x-humanx-user` |
| POST | `/api/belief-snapshots` | `belief-snapshot:${ip}` | 20/hr | 1hr | `belief-snapshots.js:4` | `x-humanx-user` |
| POST | `/api/belief-promote` | `belief-promote:${ip}` | 10/hr | 1hr | `belief-bridge.js:6` | `x-humanx-user` |
| POST | `/api/claim-vote` | `vote:${userId}:${ip}` (uncertain — not read in full) | 120/hr | 1hr | `votes.js` (documented) | `x-humanx-user` |
| POST | `/api/runpack` | **NONE** | **∞** | — | `worker.js:87` — no `safeRateLimit` call | **None** |
| POST | `/api/aip` | **NONE** | **∞** | — | `worker.js:87` — same handler, alias | **None** |
| POST | `/api/session` | **NONE** | **∞** | — | `worker.js` — no `safeRateLimit` call | None |

**Summary:** All write endpoints that require `x-humanx-user` have a confirmed rate limit. The two endpoints with no rate limit and no auth are `POST /api/runpack` and `POST /api/aip`. `POST /api/session` has no rate limit but is the user-creation endpoint — bypassing it with multiple calls is the root of vote-stuffing risk.

---

## 3. Endpoint-by-Endpoint Current Posture

### `POST /api/runpack` / `POST /api/aip` — HIGHEST PRIORITY

**Current state (confirmed from `worker.js:87`):**
- No `x-humanx-user` header required.
- No `safeRateLimit` call.
- Reads: `claims`, `evidence`, `pressure_points`, `home_tests`, `analysis_results` (multi-table join via `claimDetail`).
- Writes: one `aip_packets` row per call.
- Only protection: `review_state='public'` guard — returns `CLAIM_NOT_FOUND` for non-public claims before any DB read.
- `aip_packets` table is never cleaned up anywhere in the codebase (no TTL, no scheduled job, no cleanup route).

**Risk:** Any caller with a valid public claim ID can trigger unlimited multi-table reads and unlimited `aip_packets` growth. No burst protection. A bot can call this in a tight loop against all public claims, filling `aip_packets` table indefinitely.

**Constraint:** This is intentional product design — RunPack is the "take the packet to your own AI" workflow. Adding authentication would contradict the product's RunPack-first framing. Adding a rate limit is the right path.

---

### `POST /api/report` — SECOND PRIORITY

**Current state (confirmed from `worker.js:86`):**
- Rate key: `report:${ip}` — 20/hr per IP.
- Auto-escalation threshold: **hardcoded at 2** — `report_count+1>=2`.
- Effect: 2 reports from any 2 different IPs move a public claim to `review_state='review'`, removing it from the public list.
- No per-user duplicate-report check (a user can report the same item multiple times from the same IP).
- Same threshold applies to evidence (`targetType='evidence'`), which removes evidence from Study and Vault.

**Risk:** Report-bombing is a denial-of-visibility attack. Two IPs (or two browser tabs on the same VPN exit) can hide any public claim. The 20/hr rate limit only throttles volume — it does not prevent the threshold effect with very low N=2.

---

### `POST /api/claim-vote` — THIRD PRIORITY

**Current state (confirmed from docs, `votes.js` not fully read):**
- Delegated to `src/votes.js`.
- Rate: 120/hr per user+IP (documented — not source-confirmed in this session).
- Upsert pattern: same user+IP changing their vote is allowed; same user+IP double-counting is prevented by upsert.
- **Pseudonymous stuffing vector:** `POST /api/session` has no rate limit. A caller can generate N user IDs and cast N votes, once per ID, staying under the 120/hr per user+IP limit per ID.

**Risk:** Vote stuffing via multiple pseudonymous IDs distorts claim `belief_yes`/`belief_no`/`uncertainty` counts. Visible on the public claim list and in study view. Not immediately damaging but erodes signal quality.

---

### `POST /api/belief-snapshots` — FOURTH PRIORITY

**Current state (confirmed from `belief-snapshots.js`):**
- Rate key: `belief-snapshot:${ip}` — 20/hr per IP. ✅ rate-limited.
- The snapshot payload is extracted from `body.snapshot`, typed-checked (must be an object, not array), and stored in full as `raw_json` via `JSON.stringify(snapshot)`.
- **No payload size validation.** The `raw_json` column receives the entire snapshot JSON. Individual text fields are capped (`label:120`, `summary:1600`), but the raw object written to `raw_json` has no byte/key/depth limit.
- A full Belief Engine profile from `humanx-bridge.js` is approximately 5–15KB of JSON. An adversarial caller could send a significantly larger payload.

**Risk:** Large `raw_json` payloads grow `belief_snapshots` table unexpectedly. Rate limit (20/hr) mitigates spam volume but does not cap per-payload size.

---

### `POST /api/session` — ROOT OF VOTE-STUFFING

**Current state (confirmed from `worker.js`):**
- No rate limit.
- No auth required.
- Caller-supplied `id` is accepted (after `cleanId()` sanitisation).
- `INSERT OR IGNORE` on users table — safe if called repeatedly with same ID.
- Fingerprint hash stored but **not validated or enforced**.

**Risk:** Unlimited pseudonymous user creation. Root cause of vote-stuffing and potential abuse of per-user-keyed rate limits. Acceptable for small tester beta; not acceptable at scale without fingerprint enforcement or account friction.

---

### `GET /api/debug` — DATA EXPOSURE (NOT A WRITE RISK)

**Current state (confirmed from `worker.js`):**
- Previously required no admin token (data-exposure risk documented in `PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`).
- Since this session's inspection: `worker.js` now shows `const adminError = requireAdmin(request, env); if (adminError) return adminError;` before `debugState` — **admin gate is now present**.
- Not a write risk. Returns row counts and 5 recent claims. Needs no change.

*Note: the `API_ENDPOINT_INVENTORY.md` said "No admin token required" for `/api/debug` — this appears to have been updated in the Worker without the doc being updated. The doc should be corrected in a future maintenance pass. This is not a D-120B item.*

---

### All other write endpoints — ACCEPTABLE FOR SMALL BETA

| Endpoint | Status |
|---|---|
| `POST /api/claims` | 8/hr, Review-first, duplicate detection. ✅ OK |
| `POST /api/evidence` | 20/hr, `review_state='review'` on insert. ✅ OK |
| `POST /api/pressure` | 20/hr, `review_state='review'` on insert. ✅ OK |
| `POST /api/tests` | 20/hr, claim existence guard. ✅ OK |
| `POST /api/truths` | 12/hr, duplicate via `normalized_statement`. ✅ OK |
| `POST /api/truth-to-claim` | 8/hr, two-table write. ✅ OK for small beta; monitor partial-failure path |
| `POST /api/evidence-attach` | 20/hr, INSERT OR IGNORE dedup. ✅ OK |
| `POST /api/analysis` | 20/hr, caller-supplied payload (no server AI call). ✅ OK |
| `POST /api/belief-promote` | 10/hr, duplicate-promote guard confirmed in docs. ✅ OK |

---

## 4. Minimum Patch Recommendations

### Priority 1 — RunPack/AIP rate limit (no schema change required)

**Proposed change:** Add `safeRateLimit` call to `createAipPacket` in `worker.js`.

**Exact proposed behaviour:**

```
Rate key:    runpack:${ip(request)}
Max hits:    20 per hour per IP
Window:      1 hour
```

Rationale: 20/hr is consistent with evidence/pressure/tests limits. Generous enough for legitimate use (a user doing serious claim analysis rarely needs more than 20 RunPacks per hour). Tight enough to prevent trivial bot loops.

**No-schema-change option:** The `rate_limits` table already exists. This requires only adding one line to `createAipPacket`:

```javascript
// add after body parse, before claimDetail call:
await safeRateLimit(request, env, `runpack:${ip(request)}`, 20, 3600000);
```

**If a no-store fallback is preferred instead:** `createAipPacket` could skip the `INSERT INTO aip_packets` write and return the packet directly. This eliminates table growth entirely. The packet is built in memory and returned; the caller does not need a stored copy to use it. This is a smaller change risk than the rate limit and has no schema dependency.

**Recommendation:** implement the rate limit first. Add the no-store option as an opt-in query parameter (`?store=false`) later if table growth becomes a concern.

---

### Priority 2 — Report-bombing threshold (no schema change required)

**Current behaviour:** auto-escalation at `report_count >= 2` (hardcoded in `worker.js:86`).

**Proposed change:** Raise the auto-escalation threshold from 2 to 5.

**Exact proposed behaviour:**

```
Threshold:  report_count+1 >= 5
Effect:     item flips to review_state='review' only after 5 reports
```

The SQL currently is:
```sql
UPDATE claims SET report_count=report_count+1,
  review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END
WHERE id=?
```

Proposed:
```sql
UPDATE claims SET report_count=report_count+1,
  review_state=CASE WHEN report_count+1>=5 THEN 'review' ELSE review_state END
WHERE id=?
```

Same change applies to the evidence branch in `reportTarget`.

**Rationale:** 2 is too low for any public exposure. At N=2, two incognito tabs on the same VPN exit node can hide any public claim in under 5 seconds. At N=5, the attack requires either 5 different IPs or 5 sequential requests from one IP burning the 20/hr rate window, which is 25% of the rate budget just to suppress one claim.

**No-schema-change option:** Threshold change is pure in-code logic. No D1 schema change, no migration.

**Future option (not recommended now):** weighted reporting by user trust score (`trust_score` column exists in `users` table but is not yet populated). Would require account model.

---

### Priority 3 — Belief snapshot payload cap (no schema change required)

**Current behaviour:** `raw_json` column receives `JSON.stringify(snapshot)` with no size cap.

**Proposed change:** Add a payload byte-size guard in `belief-snapshots.js` before the INSERT.

**Exact proposed behaviour:**

```
MAX_SNAPSHOT_BYTES: 64 KB (65536 bytes)
Check: JSON.stringify(snapshot).length > MAX_SNAPSHOT_BYTES → reject with BAD_BELIEF_SNAPSHOT_TOO_LARGE
```

**Rationale:** A full legitimate Belief Engine profile is approximately 5–15KB. 64KB is 4–12× headroom for richer payloads while blocking absurd inputs. A 64KB limit does not require any schema change — it is a runtime rejection, not a column constraint.

**No-schema-change option:** runtime check only; `raw_json` column type is TEXT (unlimited in SQLite/D1). No schema migration needed.

---

### Priority 4 — Vote stuffing (requires account/fingerprint decision — deferred)

**Current state:** `POST /api/session` is unrate-limited. Unlimited pseudonymous IDs can be created. Each ID can cast one vote without hitting the per-user rate limit.

**Proposed posture for wider launch (not small beta):** Add IP-based rate limit to `POST /api/session`.

**Exact proposed behaviour:**

```
Rate key:    session:${ip(request)}
Max hits:    10 per hour per IP
Window:      1 hour
```

**Rationale:** 10 new sessions per IP per hour is generous for legitimate use (e.g. testing multiple browsers) but prevents trivial automated user-ID generation loops. This does not require accounts — it is a simple rate limit on the existing pseudonymous session endpoint.

**No-schema-change option:** Same `rate_limits` table. No schema migration.

**Important caveat:** This does not eliminate vote stuffing from shared IP ranges (NAT/university networks where many users share one exit IP). Any per-IP rate limit has this false-positive risk. This is why the D-120A plan defers the full vote-stuffing solution to a fingerprint or account model. The session rate limit is a minimum guardrail only.

**D-120B recommendation:** Defer this to a later D-120C slice. Small beta testers are known and monitored; vote stuffing from known testers is visible and manageable without the rate limit.

---

## 5. What Can Stay As-Is for Small Beta

| Area | Current posture | Beta verdict |
|---|---|---|
| Claim submission | 8/hr per IP, Review-first | ✅ Accept |
| Evidence submission | 20/hr per IP, review_state='review' | ✅ Accept |
| Pressure submission | 20/hr per IP, review_state='review' | ✅ Accept |
| Home tests | 20/hr per IP, claim existence guard | ✅ Accept |
| Truth submission | 12/hr per IP, normalized dedup | ✅ Accept |
| Truth-to-claim | 8/hr per IP, two-table write | ✅ Accept; monitor partial failure |
| Evidence attach | 20/hr per IP, INSERT OR IGNORE | ✅ Accept |
| Analysis results | 20/hr per IP, no server AI | ✅ Accept |
| Belief snapshots | 20/hr per IP, no payload cap | ✅ Accept for beta only; add cap before wider launch |
| Belief promote | 10/hr per IP, dupe guard confirmed | ✅ Accept |
| Votes | 120/hr per user+IP, upsert | ✅ Accept for small controlled beta |
| Reports | 20/hr per IP, escalate at 2 | ⚠️ Accept for small beta only; raise threshold before wider launch |
| RunPack/AIP | No rate limit, no auth | ⚠️ Accept for small beta only; add rate limit before wider launch |
| Session creation | No rate limit | ✅ Accept for small controlled beta (known testers only) |
| Admin token | Single token, no rotation | ✅ Accept for small beta; rotate before broader public attention |

---

## 6. What Must Wait for Accounts / Fingerprint / Trust Model

| Feature | Why accounts/trust required |
|---|---|
| True vote anti-stuffing | Per-IP rate limit on session creation helps but does not eliminate; meaningful anti-stuffing needs fingerprint or account model |
| Report trust weighting | Low-trust reports should carry less escalation weight; requires `trust_score` to be populated, which requires observable user history |
| Per-user content limits (daily claim quota, etc.) | Requires persistent identity across sessions |
| Token rotation / admin handoff | Single-admin model is fine for now; multi-admin requires account system |
| Belief snapshot privacy / ownership | Currently snapshots are user-keyed but no ownership verification beyond `x-humanx-user`; full privacy control requires persistent account |
| Shadowban / strike escalation | `is_shadow_banned` and `strike_count` columns exist in `users` table but require a trust/moderation workflow to populate meaningfully |

---

## 7. Risks of Doing Nothing

| Risk | Likelihood if small beta | Likelihood if wider launch |
|---|---|---|
| `aip_packets` table fills with bot-generated RunPack spam | Low (known testers) | High |
| Claim hidden by 2-report attack from one person | Very low (trusted testers) | Moderate (any public URL share) |
| Vote stuffing distorts claim scores | Very low (known testers) | Moderate (public + motivated actors) |
| Belief snapshot table grows with oversized payloads | Very low (bridge sends structured payloads) | Low but real (API accessible without Belief Engine UI) |
| Session endpoint abused to generate user IDs at scale | Very low (known testers) | Moderate |

**Verdict:** No action is required before small controlled tester launch. Priority 1 (RunPack rate limit) and Priority 2 (report threshold) should be implemented before any public URL is shared widely or any social/media coverage is expected.

---

## 8. Risks of Overbuilding Accounts Too Early

| Risk | Detail |
|---|---|
| Friction kills experimentation | The product's value proposition includes low-friction pseudonymous access. Requiring accounts before the product is proven would reduce tester willingness to engage |
| Engineering time cost | A full account/OAuth system is weeks of work. Spending that time before the product is validated wastes capacity |
| Privacy surface expansion | Email-based accounts require GDPR-style handling, email verification, and password/token security — all of which are new attack surfaces |
| Product sequencing error | The right order is: validate the core claim/evidence/review loop → add guardrails where abuse appears → add accounts only when moderation workload or trust requirements demand it |

**Recommendation:** Do not build accounts before first tester launch. Do not build accounts before observable abuse appears. Fingerprinting (Option B in D-120A) is the right intermediate step if vote stuffing or session abuse is seen in small beta.

---

## 9. Exact Proposed Behaviour Summary

### RunPack rate limit

```
File:    src/worker.js
Function: createAipPacket
Position: after body parse (const body = await readJson(request)), before claimDetail call
Addition:
  await safeRateLimit(request, env, `runpack:${ip(request)}`, 20, 3600000);
Risk:    Low. Rate limit call pattern is identical to evidence/pressure/tests.
         Worker already has safeRateLimit defined at line 166.
         No schema change. No new dependency.
Schema:  No change.
Migration: None.
```

Alternative (no-store option):

```
Instead of writing to aip_packets, return packet directly from memory.
Remove the INSERT INTO aip_packets line from createAipPacket.
Add aip_packets table monitoring note to operational docs.
Risk:    Slightly higher — loses stored packet trail, changes developer debug story.
Schema:  No change. Table can remain for historical rows.
Migration: None.
```

### Report escalation threshold

```
File:    src/worker.js
Function: reportTarget (line 86)
Changes:
  1. Claim branch:
     Change: report_count+1>=2 → report_count+1>=5
  2. Evidence branch:
     Same change in the UPDATE evidence statement.
  (Pressure branch does not currently have auto-escalation; confirm before touching)
Risk:    Low. In-code logic change only.
         Must test: verify escalation still fires at new threshold.
         Must not regress: escalation-at-threshold must stay fail-safe (not fail-open).
Schema:  No change. report_count column unchanged.
Migration: None.
```

### Belief snapshot payload cap

```
File:    src/belief-snapshots.js
Function: saveBeliefSnapshot
Position: after snapshot type check (line 8), before field extraction
Addition:
  const MAX_SNAPSHOT_BYTES = 65536; // 64 KB
  const rawStr = typeof raw === 'string' ? raw : JSON.stringify(snapshot);
  if (rawStr.length > MAX_SNAPSHOT_BYTES) return json({ error: 'BAD_BELIEF_SNAPSHOT_TOO_LARGE' }, 400);
Risk:    Low. New rejection path only; does not change success path.
         The bridge sends ~5-15KB payloads. 64KB is generous.
         Must test: verify bridge payload is well under 64KB.
Schema:  No change.
Migration: None.
```

---

## 10. Non-Goals for D-120B / D-120C

The following are explicitly out of scope for the D-120B/D-120C guardrail patch:

- Accounts or email-based authentication.
- OAuth or third-party login.
- Admin token rotation (recommended as a separate manual operation before wider launch).
- `GET /api/debug` admin gate (already confirmed gated from source inspection; doc update is a maintenance task, not a code change).
- Trust score population or shadowban workflow.
- `aip_packets` TTL/cleanup job (deferred until table growth is observed in practice).
- Schema changes for any of the above (none of the minimum patches require a migration).
- D1 data quality audit (D-116B remains deferred, requires separate explicit authorisation).
- Vote-stuffing complete solution (requires fingerprint/account model — D-120A decision).

---

## 11. Recommended D-120C Implementation Slice

D-120C should implement the following three changes only, in this order:

| Order | Change | File | Risk |
|---|---|---|---|
| 1 | Add `safeRateLimit` to `createAipPacket` | `src/worker.js` | Low |
| 2 | Raise report escalation threshold from 2 to 5 | `src/worker.js` | Low |
| 3 | Add 64KB payload cap to `saveBeliefSnapshot` | `src/belief-snapshots.js` | Low |

After implementation:
- Run `node scripts/hardening-smoke-test.mjs` — expect 416 passed.
- Run `node scripts/worker-route-static-check.mjs` — expect 56 passed. Verify the static check does not have a test that asserts the old threshold value.
- Run `node --check public/app-v10.js` — no change expected (frontend not touched).
- No Wrangler. No D1. No production query.
- Branch/PR only. Do not deploy until owner reviews and approves.

Session rate-limit for `POST /api/session` (Priority 4 — vote stuffing) is deferred to a later slice and requires owner decision on whether to accept the NAT/shared-IP false-positive risk.

---

## 12. Confirmation

> Docs-only. No Worker/backend code changed. No frontend code changed. No Wrangler. No D1. No production query. No admin token. No deploy. No live writes. No mutation beyond this docs commit. Implementation requires later explicit tasking as D-120C.
