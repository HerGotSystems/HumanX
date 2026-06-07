# D-79A: Production Apply Plan

Date: 2026-06-07
Step: D-79A (planning only — no execution)
Type: Docs-only. Direct main.
No code changes. No D1 commands. No Wrangler. No import routes called. No production mutations.

---

## 1. Purpose and Scope

D-79A documents the plan, expected behavior, failure handling, post-apply verification
steps, and gate conditions for a future gated production apply of the 5 D-76D approved
launch seed claims via `GET /api/import-seed?mode=apply`.

**Scope:** Planning and gate documentation only.
**Out of scope:** Executing the route, touching D1, running Wrangler, or mutating live data.

---

## 2. Explicit Non-Execution Statement

D-79A does not call `/api/import-seed`.
D-79A does not call `mode=apply`.
D-79A does not touch D1.
D-79A does not run Wrangler.
D-79A does not mutate production data.
D-79A does not curl production.

No claim, evidence, pressure, or test row was created or modified during D-79A.

---

## 3. D-78B Dry-Run Summary

D-78B executed `GET /api/import-seed?mode=dry-run` on 2026-06-07 and received a full pass.
Full result in `docs/D78B_DRY_RUN_RESULT.md`.

**D-78B response (exact):**

```json
{
  "ok": true,
  "mode": "dry-run",
  "seed_version": 2,
  "review_state": "review",
  "claims":   { "would_create": 5,  "would_skip": 0, "created": 0, "skipped": 0 },
  "evidence": { "would_create": 10, "would_skip": 0, "created": 0, "skipped": 0, "source_needed_blocked": 0 },
  "pressure": { "would_create": 4,  "would_skip": 0, "created": 0, "skipped": 0 },
  "tests":    { "would_create": 0,  "would_skip": 0, "created": 0, "skipped": 0 },
  "warnings": []
}
```

**Key confirmations from D-78B:**
- `seed_version: 2` — PR #103 deployed; importer is reading the 5 launch claims
- `source_needed_blocked: 0` — SOURCE_NEEDED apply-mode guard will not block
- `would_create` totals: 5 claims + 10 evidence + 4 pressure + 0 tests = **19 rows**
- `would_skip: 0` across all categories — no duplicate rows in DB at time of dry-run
- All `created` and `skipped` fields were `0` — dry-run wrote nothing

---

## 4. Apply Expectation

On a successful `mode=apply` (D-79B), the expected response is:

```json
{
  "ok": true,
  "mode": "apply",
  "seed_version": 2,
  "review_state": "review",
  "claims":   { "would_create": 5,  "would_skip": 0, "created": 5,  "skipped": 0 },
  "evidence": { "would_create": 10, "would_skip": 0, "created": 10, "skipped": 0, "source_needed_blocked": 0 },
  "pressure": { "would_create": 4,  "would_skip": 0, "created": 4,  "skipped": 0 },
  "tests":    { "would_create": 0,  "would_skip": 0, "created": 0,  "skipped": 0 },
  "warnings": []
}
```

**Expected DB writes (19 rows total):**

| Table | Rows created | review_state |
|-------|-------------|--------------|
| `users` | 1 (seed system user `usr_seed_system` — `INSERT OR IGNORE`, safe to repeat) | N/A |
| `claims` | 5 | `'review'` |
| `evidence` | 10 | `'review'` |
| `pressure_points` | 4 | (no `review_state` column on this table — pressure is not part of the moderation queue) |
| `home_tests` | 0 | N/A |

**Total moderation queue additions:** 5 claims + 10 evidence = 15 rows at `review_state = 'review'`.
4 pressure rows are inserted without `review_state` (schema confirmed from `src/importer.js`
line 155–168: INSERT includes `id, claim_id, user_id, title, body, severity, created_at` only).

**review_state source (confirmed from code):**
- `src/importer.js` line 9: `{ dryRun = true, reviewState = 'review' } = {}`
- `src/worker.js` line 34: `importSeedData(env, { dryRun: mode !== 'apply' })` — no
  `reviewState` override — defaults to `'review'`
- All 5 claims and all 10 evidence items land with `review_state = 'review'`
- Not publicly visible; must be promoted through the admin Review UI

---

## 5. Safety — Review Queue Behavior

**Claims and evidence land in `review_state = 'review'` — they are invisible to the public.**

The `GET /api/claims` endpoint (public feed) filters by `COALESCE(review_state, 'public') = 'public'`
(confirmed from evidence scoring logic in `src/importer.js` and Worker design). Claims with
`review_state = 'review'` do not appear in the public feed until an admin uses the Review UI
to promote them to `review_state = 'public'`.

**No automatic public publication occurs on apply.** The apply step is not the go-live step.
The manual admin Review UI promotion is the go-live step.

| Object | Post-apply state | Public? | Path to public |
|--------|-----------------|---------|----------------|
| Claims (5) | `review_state = 'review'` | No | Admin Review UI → promote to `public` |
| Evidence (10) | `review_state = 'review'` | No | Admin Review UI → promote to `public` |
| Pressure points (4) | No `review_state` | Visible if claim is public | Inherit from claim visibility |
| Tests (0) | N/A | N/A | N/A |

---

## 6. Idempotency Note

The importer uses dedup guards:
- **Claims:** `SELECT id FROM claims WHERE normalized_claim=?` — if a claim with the same
  normalized text already exists, it is skipped (`skipped += 1`, not `created += 1`).
- **Evidence:** `SELECT id FROM evidence WHERE duplicate_signature=?` — if a signature
  match is found, evidence is skipped.
- **Pressure:** `SELECT id FROM pressure_points WHERE claim_id=? AND title=?` — if a
  matching title exists for that claim, pressure is skipped.

If `mode=apply` is called a second time after a successful first apply, all rows would
be skipped (not duplicated). `created` would be `0` and `skipped` would be non-zero.
This is safe — not an error — but must not be confused with a failed apply.

---

## 7. Future Apply Command — BLOCKED / DO NOT RUN

> ⛔ **BLOCKED — DO NOT RUN**
>
> The command below must not be executed until:
> (a) Explicit per-session user approval is granted in the same session as execution.
>     D-78B approval does NOT carry over to D-79B.
> (b) Admin token is confirmed available in session.
> (c) User confirms they are ready to moderate 15 items in the admin Review UI after apply.

```
# FUTURE COMMAND — NOT TO BE EXECUTED UNTIL D-79B IS EXPLICITLY APPROVED
# Requires:
#   - Explicit same-session user approval for mode=apply
#   - HUMANX_ADMIN_TOKEN confirmed in session
#   - User ready to moderate 5 claims + 10 evidence in admin Review queue

HUMANX_ADMIN_TOKEN='<confirm-token-in-session>'
curl -sS --ssl-no-revoke \
  -D /tmp/humanx-d79b-headers.txt \
  -H "x-humanx-admin: $HUMANX_ADMIN_TOKEN" \
  "https://humanx.rinkimirikata.com/api/import-seed?mode=apply" \
  -o /tmp/humanx-d79b-body.json
```

Note: `--ssl-no-revoke` is required for Windows local curl (known schannel limitation,
documented in D-78B result and prior smoke test records).

---

## 8. Required Capture After D-79B

When D-79B executes, paste the **complete untruncated JSON response** and **HTTP status**
back for review. The capture must include all of the following:

| Field | What to verify |
|-------|---------------|
| HTTP status | Must be `200` |
| `ok` | Must be `true` |
| `mode` | Must be `"apply"` |
| `seed_version` | Must be `2` |
| `review_state` | Must be `"review"` |
| `claims.created` | Expected `5`; `0` if all already existed (check `skipped`) |
| `claims.skipped` | Expected `0` on first apply; `5` if re-run |
| `evidence.created` | Expected `10` on first apply |
| `evidence.source_needed_blocked` | Must be `0` |
| `pressure.created` | Expected `4` on first apply |
| `tests.created` | Expected `0` |
| `warnings` | Preferably `[]`; any warning must be reviewed |

---

## 9. Failure Handling

If the D-79B response is not as expected, stop immediately and do not retry blindly.

| Condition | Action |
|-----------|--------|
| HTTP status is not 200 | Stop. Paste full response. Do not retry. Investigate. |
| `ok: false` for any reason | Stop. Paste full response. Check `error` and `message` fields. |
| `error: SOURCE_NEEDED_BLOCKED` | Stop. SOURCE_NEEDED guard triggered — investigate src/seed-data.js. |
| `claims.created` is 0 and `claims.would_create` was 5 in dry-run | Stop. Claims may have been inserted by a prior apply — check `skipped` count. If skipped is 5, a duplicate apply occurred. |
| `evidence.source_needed_blocked` > 0 | Stop. Source URL issue introduced since D-78B. Do not retry apply. |
| HTTP 403 | Stop. Admin token wrong or missing. Do not retry until token confirmed. |
| HTTP 500 | Stop. Worker or D1 error. Do not retry. Investigate Cloudflare logs. |
| Unexpected `warnings` array content | Paste in full. Review before considering any further action. |

**Do not call `mode=apply` a second time without reviewing skipped/created counts first.**
A second apply is safe (idempotent), but the counts will differ and must not be
misread as an error. See Section 6.

---

## 10. Post-Apply Verification Plan (D-80)

After D-79B apply completes:

### Step 1 — Confirm JSON response (immediate)
Paste the full response per Section 8. Verify `created` counts match expected.

### Step 2 — Admin Review UI (manual, same session or near-term)
Open the HumanX admin Review UI and verify:
- 5 new claims appear in the Review queue with `review_state = 'review'`
- 10 new evidence items appear in the Review queue
- Claims are identifiable by their `seed_id` or claim text:
  - "The Holocaust resulted in the murder of approximately six million Jews"
  - "Large population studies and systematic reviews have not found evidence that the MMR vaccine causes autism"
  - "Rising CO2 levels from human activity are the primary driver of observed global warming"
  - "Online platform recommendation systems can use engagement signals that influence which information spreads widely"
  - "Sleep deprivation significantly impairs cognitive performance, even when individuals feel only mildly sleepy"

### Step 3 — Optional read-only smoke (after Step 2)
Run `node scripts/read-endpoint-smoke-test.mjs` or equivalent read-only check to confirm
the Worker is still healthy after the apply. No write actions.

### Step 4 — Manual promotion (separate deliberate action)
Each claim must be individually reviewed and promoted from `review_state = 'review'` to
`review_state = 'public'` through the admin Review UI. This is the go-live step.

**No bulk promotion. No scripted promotion. One claim at a time through the UI.**

---

## 11. Gate — D-79B Remains Blocked

D-79B requires all of the following before execution:

| # | Requirement | Status |
|---|-------------|--------|
| 1 | D-78B dry-run passed | ✅ CONFIRMED — 2026-06-07 |
| 2 | Explicit same-session user approval for `mode=apply` | ⛔ NOT YET GRANTED |
| 3 | Admin token confirmed in session | ⛔ NOT YET CONFIRMED FOR D-79B |
| 4 | User acknowledges 15 items (5 claims + 10 evidence) will enter Review queue | ⛔ NOT YET CONFIRMED |
| 5 | User ready to verify Review queue after apply | ⛔ NOT YET CONFIRMED |

**D-78B approval does NOT carry over. A new explicit approval is required in the same
session as the `mode=apply` call.**

D-80 (manual Review queue verification) follows D-79B and is separately listed in
`docs/PROJECT_STATE.md`.

---

## 12. Code Audit Findings Summary

Confirmed from `src/importer.js` and `src/worker.js`:

| Finding | Confirmed |
|---------|-----------|
| Route: `GET /api/import-seed?mode=apply` | ✅ worker.js line 34 |
| Admin header required: `x-humanx-admin` | ✅ worker.js `requireAdmin` |
| `mode=apply` passes `dryRun: false` | ✅ `dryRun: mode !== 'apply'` |
| `reviewState` defaults to `'review'` | ✅ importer.js line 9 |
| Worker does not override `reviewState` | ✅ no `reviewState` in worker.js route call |
| Claims inserted with `review_state = 'review'` | ✅ importer.js line 69, 89 |
| Evidence inserted with `review_state = 'review'` | ✅ importer.js line 115, 131 |
| Pressure inserted WITHOUT `review_state` | ✅ importer.js lines 155–168 (columns: id, claim_id, user_id, title, body, severity, created_at) |
| Tests inserted WITHOUT `review_state` | ✅ importer.js lines 190–205 |
| SOURCE_NEEDED guard runs before any writes | ✅ importer.js lines 22–40 |
| `source_needed_blocked` was 0 in D-78B | ✅ guard will not block apply |
| Claim dedup via `normalized_claim` | ✅ importer.js line 51 |
| Evidence dedup via `duplicate_signature` | ✅ importer.js line 101 |
| Pressure dedup via `claim_id + title` | ✅ importer.js lines 141–146 |

---

## 13. Safety Confirmation

| Rule | Status |
|------|--------|
| No import route called | ✅ Confirmed |
| No `mode=apply` called | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No curl to production | ✅ Confirmed |
| Static checks 119/24/39 | ✅ Confirmed at D-79A |

---

## D-79A Completion Record

| Item | Status |
|------|--------|
| Purpose and scope documented | ✅ |
| Non-execution statement included | ✅ |
| D-78B dry-run summary with exact counts | ✅ |
| Apply expectation — HTTP, all counts, review_state | ✅ |
| Safety: review queue behavior, no auto-publish | ✅ |
| Pressure `review_state` absence confirmed from code | ✅ |
| Idempotency note included | ✅ |
| Future apply command marked BLOCKED — DO NOT RUN | ✅ |
| Required capture fields after D-79B defined | ✅ |
| Failure handling table — all conditions covered | ✅ |
| Post-apply verification plan (D-80) defined | ✅ |
| Gate table — D-79B criteria defined | ✅ |
| Code audit findings summary | ✅ |
| docs/PROJECT_STATE.md updated | ✅ |
| Static checks 119/24/39 passed | ✅ |
| No import route called | ✅ |
| No D1/Wrangler/live command executed | ✅ |
