# Public Write Endpoints Risk Map

## 1. Purpose

This file exists to make future backend changes safer by collecting public-write hardening
knowledge in one place. Without it, that knowledge lives only in chats, PR descriptions, and
the `src/worker.js` source — all of which are easy to lose context on when returning to the
codebase days or weeks later.

Before touching any write endpoint, read this file. Before merging any change that touches
a write endpoint, update this file.

---

## 2. Scope

This file covers **public and semi-public mutating endpoints only** — those that write to D1,
modify state, or have meaningful abuse or race risk. It does not cover every API route.

Read-only endpoints (`GET /api/claims`, `GET /api/truths`, `GET /api/health`, etc.) are out
of scope here. See `docs/API_ENDPOINT_INVENTORY.md` for the full route list.

Admin-only write endpoints (`POST /api/review/decision`, `POST /api/review/cleanup`,
`POST /api/review/mark-duplicate`, `POST /api/review/resolve-similar`,
`GET /api/import-seed`, `GET /api/import-truths`) are noted briefly for completeness
but are lower public-abuse risk because they require `HUMANX_ADMIN_TOKEN`.

---

## 3. Source Files Checked

The following files were read to produce this document:

| File | Status |
|---|---|
| `src/worker.js` | Read in full |
| `docs/API_ENDPOINT_INVENTORY.md` | Read in full |
| `docs/OPERATIONAL_STATUS.md` | Read in full |
| `docs/D1_DUPLICATE_CLEANUP.md` | Read in full |
| `docs/BELIEF_ENGINE_SCORING_NOTES.md` | Present — not directly relevant to write endpoint risks |
| `docs/WORKER_MODULAR_SPLIT_PLAN.md` | Present — planning only, not a source of endpoint facts |
| `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md` | Present — QA coverage reference |

---

## 4. Public Write Endpoint Table

| Method | Path | Public / admin / uncertain | Writes | Protection | Main risk | Test needed |
|---|---|---|---|---|---|---|
| POST | `/api/session` | Public — no auth | `users` (INSERT OR IGNORE) | None | Unlimited user creation; caller-supplied ID accepted without validation | Yes — confirm INSERT OR IGNORE is idempotent; confirm no ID injection possible |
| POST | `/api/claims` | Public — requires `x-humanx-user` | `claims`, optionally `evidence`, `users`, `rate_limits` | Fail-closed rate limit: 8/hr per IP. Duplicate check via `normalized_claim` unique index | Duplicate-race on unique index (handled explicitly); `review_state` defaults to `'review'` not `'public'` — must not regress | Yes — duplicate claim, race condition, rate limit exhaustion, missing header |
| POST | `/api/claim-vote` | Public — requires `x-humanx-user` | `claim_votes`, `claims` (score recalc) | Fail-closed rate limit: 120/hr per user+IP (confirmed in `OPERATIONAL_STATUS.md`) | Vote stuffing if rate limit weakened; score recalc must stay consistent | Yes — double-vote, rate limit, missing claim ID |
| POST | `/api/evidence` | Public — requires `x-humanx-user` | `evidence`, `users`, `rate_limits`, `claims` (score recalc) | Fail-closed rate limit: 20/hr per IP | D-42B: evidence inserted with `review_state='review'` — not publicly visible until admin approves. Spam evidence still enters DB but is invisible to users. Score recalc side effect on parent claim unchanged | Yes — missing claim ID, empty body, rate limit; confirm `review_state='review'` in inserted row |
| POST | `/api/evidence-attach` | Public — requires `x-humanx-user` | `evidence_claim_links`, `users`, `rate_limits` | Delegates to `evidence-reuse.js` — rate limiting status uncertain from `worker.js` alone | Link spam; `INSERT OR IGNORE` returns actual DB link id (fixed in PR #13 — must not regress) | Yes — confirm rate limit active in module; confirm returned id is real DB id, not generated |
| POST | `/api/truths` | Public — requires `x-humanx-user` | `truths`, `users`, `rate_limits` | Delegates to `truths.js` — rate limiting status uncertain from `worker.js` alone; duplicate check via `normalized_statement` unique index | Duplicate-race on unique index (handled in `truths.js`); spam truth creation | Yes — duplicate truth, race condition, confirm rate limit active in module |
| POST | `/api/truth-to-claim` | Public — requires `x-humanx-user` | `claims`, `truth_claim_links`, `truths`, `users` | Delegates to `truth-claim-bridge.js` — rate limiting and duplicate handling uncertain from `worker.js` alone | Two-table write; partial failure risk if claim insert succeeds but link insert fails | Yes — partial failure path, duplicate bridge, confirm rate limit active in module |
| POST | `/api/pressure` | Public — requires `x-humanx-user` | `pressure_points`, `users`, `rate_limits`, `claims` (score recalc) | Fail-closed rate limit: 20/hr per IP | Pressure spam; score recalc side effect on parent claim | Yes — missing claim ID, rate limit |
| POST | `/api/tests` | Public — requires `x-humanx-user` | `home_tests`, `users`, `rate_limits`, `claims` | Fail-closed rate limit: 20/hr per IP. Validates claim existence before insert | Spam home tests; relies on claim existence check — must not be removed | Yes — nonexistent claim ID, short title/instructions, rate limit |
| POST | `/api/report` | Public — requires `x-humanx-user` | `reports`, `claims` or `evidence` (auto-escalation), `users`, `rate_limits` | Fail-closed rate limit: 20/hr per IP | D-42B: supports `targetType='evidence'` — same report-bombing risk as claims. Evidence auto-escalates to `review_state='review'` at 2+ reports, hiding it from Study and Vault. Rate limit (20/hr per IP) is the only defence | Yes — double report by same user, report count threshold, rate limit; confirm evidence auto-escalation fires at threshold 2 |
| POST | `/api/analysis` | Public — requires `x-humanx-user` | `analysis_results`, `users` | Delegates to `analysis-results.js` — rate limiting status uncertain from `worker.js` alone. No server-side AI call — caller supplies payload | Arbitrary analysis payload injection; no server validation visible in this file | Yes — empty payload, malformed payload, confirm rate limit active in module |
| POST | `/api/belief-snapshots` | Public — requires `x-humanx-user` | `belief_snapshots`, `users` | Delegates to `belief-snapshots.js` — rate limiting and payload size validation uncertain from `worker.js` alone | Large snapshot payloads; snapshot spam | Yes — large payload, missing user, confirm rate limit active in module |
| POST | `/api/belief-promote` | Public — requires `x-humanx-user` | `belief_snapshots`, downstream (`claims` or `truths`) | Delegates to `belief-bridge.js` — rate limiting uncertain; duplicate handling confirmed in `OPERATIONAL_STATUS.md` | Cross-system write; promoting a snapshot into claims/truths has downstream effects on scores and lineage | Yes — double-promote, promote nonexistent snapshot, confirm rate limit active in module |
| POST | `/api/runpack` | Public — **no auth, no rate limit** | `aip_packets`, reads `claims`, `evidence`, `pressure_points`, `home_tests`, `analysis_results` | D-38: `review_state='public'` guard — non-public claims return `CLAIM_NOT_FOUND` before packet is built. No rate limit, no auth. | Before D-38 any caller could export a full RunPack for a non-public claim. D-38 closes that gap. No auth gate added (by design for this batch). | Yes — confirm non-public claim returns 404; confirm public claim returns packet; confirm aip_packets does not grow unboundedly |
| POST | `/api/aip` | Public — **no auth, no rate limit** | Same as `/api/runpack` (alias) | Same D-38 guard as `/api/runpack` | Legacy route name, identical handler, same risk profile | Same as `/api/runpack` |
| GET | `/api/seed` | Semi-public — **no admin token required** | `claims`, `users` | Returns early if claims table is non-empty (soft guard only) | Writes to DB if called on empty database; no auth gate | Uncertain — behaviour depends on whether DB is empty |
| GET | `/api/debug` | Semi-public — **no admin token required** | None (read-only) | None | Exposes full table row counts and 5 most recent claims without any auth. Not a write risk but a data exposure risk | Yes — confirm this is not served publicly or add admin gate |

---

## 5. Endpoint Notes

### `POST /api/session`
No authentication. The caller supplies their own `id` in the request body. `cleanId()` strips
non-alphanumeric characters but does not validate format or ownership. `INSERT OR IGNORE` means
calling this repeatedly with the same id is safe. No rate limit is applied here.

### `POST /api/claims`
The most complex public write. Duplicate detection uses `meaningKey()` on the claim text,
stored in `normalized_claim`. On unique index conflict there is an explicit race-condition
recovery path that re-fetches the existing row. New claims land in `review_state='review'`
— they are not visible in the public list until approved. The rate limit is tighter than other
write endpoints: 8 per hour per IP.

### `POST /api/claim-vote`
Fully delegated to `src/votes.js`. Rate-limited at 120/hr per user+IP as confirmed in
`docs/OPERATIONAL_STATUS.md`. Vote stuffing is the primary risk if this limit is weakened.

### `POST /api/evidence` / `POST /api/pressure` / `POST /api/tests`
These three share the same pattern: require user header, fail-closed rate limit at 20/hr per IP,
recalculate parent claim score on success (`recalcClaimScore`). The score recalculation is a
side effect that touches `claims` — any change to the scoring logic has a write-side effect
on claims data.

**D-42B change to `/api/evidence`:** evidence is now inserted with `review_state='review'`
explicitly. New evidence is not publicly visible in the Study view or Evidence Vault until an
admin approves it via `/api/review/decision`. The response shape includes `review_state:'review'`
in the returned evidence object — the frontend can use this to show a "pending review" note.
Score recalculation still runs immediately (the score reflects all evidence regardless of
review state in Phase 2 — this is a known limitation, to be tightened in D-44+).

### `POST /api/evidence-attach`
Fixed in PR #13: now returns the actual D1 link id from the `INSERT OR IGNORE` row, not a
freshly generated id. This must not regress. The fix is inside `src/evidence-reuse.js` —
rate limiting details must be verified there, not assumed from `worker.js`.

### `POST /api/truths` / `POST /api/truth-to-claim`
Both delegate to modules. The `normalized_statement` unique index on `truths` mirrors the
`normalized_claim` index on `claims`. Duplicate-race handling is confirmed in
`src/truths.js` and `src/truth-claim-bridge.js` per `docs/OPERATIONAL_STATUS.md`, but must
be verified in those files before changes. `truth-to-claim` is a two-table write — both the
`claims` insert and the `truth_claim_links` insert must succeed or the bridge is broken.

### `POST /api/report`
Auto-escalation is load-bearing: at 2+ reports a claim's `review_state` flips to `'review'`,
hiding it from the public list. This means report-bombing a claim is a denial-of-visibility
attack. The rate limit (20/hr per IP) is the only current defence.

**D-42B addition:** `targetType='evidence'` is now supported. Evidence auto-escalation mirrors
claim behaviour: 2+ reports flips `evidence.review_state` to `'review'`, hiding the evidence
from Study and Vault. Report-bombing a piece of evidence is a denial-of-visibility attack on
that specific evidence item. The same rate limit applies.

### `POST /api/analysis`
No server-side AI is invoked. The caller submits their own analysis payload (from a RunPack
task). There is no visible validation of payload schema in `worker.js` — this is delegated
to `src/analysis-results.js`. Payload injection risk must be assessed in that module.

### `POST /api/belief-snapshots` / `POST /api/belief-promote`
The Belief Engine save bridge. Snapshot size is not validated in `worker.js`. `belief-promote`
is the highest-consequence write: it crosses the boundary between the standalone Belief Engine
and the main claim/truth graph. Duplicate handling is confirmed as applied; exact behaviour
is in `src/belief-bridge.js`.

### `POST /api/runpack` / `POST /api/aip`
No authentication. No rate limit. Any caller can trigger a full multi-table read and a write
to `aip_packets`. This is intentional (RunPack-first mode — callers need the packet to run
with their own AI), but it means `aip_packets` can grow without bound and there is no burst
protection. D-38: a `review_state='public'` guard was added — calls for non-public claims now
return `CLAIM_NOT_FOUND` before any DB read or packet write. Consider monitoring this table's
row count.

### `GET /api/seed` / `GET /api/debug`
Neither requires an admin token. `seed` is write-capable (on an empty database). `debug` is
read-only but exposes table inventory. Both should be reviewed for whether an admin gate is
appropriate before any future public exposure.

---

## 6. Required Test Coverage Before Future Backend Changes

Before making any change to a public write endpoint, confirm these smoke/test items pass:

- [ ] **Claim submission** — submit a new claim; confirm it lands in `review_state='review'`;
      confirm response shape matches what `app-v10.js` expects
- [ ] **Duplicate claim** — submit the same claim text twice; confirm the second call returns
      `{ ok: true, existing: true }` with the original claim, not a new row
- [ ] **Claim vote** — vote on a claim; confirm rate limit fires after 120/hr per user+IP;
      confirm score reflects the vote
- [ ] **Evidence attach** — attach existing evidence to a claim via `/api/evidence-attach`;
      confirm returned link id is the real DB id, not a generated one
- [ ] **Truth create** — create a truth; confirm `normalized_statement` deduplication fires
      on a second identical submission
- [ ] **Truth promote (truth-to-claim)** — convert a truth to a claim; confirm both
      `claims` and `truth_claim_links` rows are created; confirm partial-failure path does
      not silently succeed
- [ ] **Belief save** — save a snapshot via `/api/belief-snapshots`; confirm it persists
      and is retrievable
- [ ] **Belief promote** — promote a snapshot via `/api/belief-promote`; confirm downstream
      claim or truth row is created/updated; confirm duplicate-promote does not create a
      second claim
- [ ] **Review approve/reject** — via `/api/review/decision` with admin token; confirm
      `review_state` changes; confirm open reports are closed; confirm claim appears or
      disappears from public list accordingly
- [ ] **Mark duplicate** — via `/api/review/mark-duplicate` with admin token; confirm
      `duplicate_of` is written and `review_state='duplicate'` is set; confirm source claim
      is not deleted; confirm self-duplicate is rejected with `SELF_DUPLICATE_NOT_ALLOWED`;
      confirm nonexistent target returns `DUPLICATE_TARGET_NOT_FOUND`;
      confirm already-archived/duplicate source returns `CLAIM_NOT_ELIGIBLE`;
      confirm `duplicate_total` in `reviewQueue` response increments;
      confirm claim no longer appears in public `GET /api/claims` or review queue
- [ ] **Resolve similar** — via `/api/review/resolve-similar` with admin token; confirm
      `near_duplicate_of` is cleared (set to NULL); confirm `previous_near_duplicate_of`
      is returned; confirm `NO_SIMILAR_ADVISORY` error when advisory is already null
- [ ] **Duplicate claim unique-index race** — simulate concurrent identical claim submissions;
      confirm only one row is created and both responses return the same claim id
- [ ] **Rate limit fail-closed** — if `rate_limits` table is unavailable, confirm write
      endpoints return HTTP 503 `RATE_LIMIT_UNAVAILABLE`, never silently pass the request
- [ ] **Missing `x-humanx-user` header** — confirm all protected endpoints return HTTP 401,
      not 500

---

## 7. Do-Not-Touch Warnings

**These apply to all work in this repository unless explicitly overridden in a task.**

- **Do not weaken the fail-closed rate limiting pattern.**
  If the `rate_limits` D1 table is unavailable, requests must be blocked (HTTP 503).
  Any change that makes rate-limited endpoints silently pass on DB failure is a regression.

- **Do not rerun migration 0004.**
  `migrations/0004_unique_normalized_content.sql` has already been applied to the production
  D1 database. Running it again will fail with a UNIQUE constraint error.
  See `docs/OPERATIONAL_STATUS.md` and `docs/D1_DUPLICATE_CLEANUP.md`.

- **Do not remove duplicate handling without replacement tests.**
  The `normalized_claim` and `normalized_statement` unique indexes, and the race-condition
  recovery paths in `worker.js`, `truths.js`, `truth-claim-bridge.js`, and `belief-bridge.js`,
  are load-bearing. Removing or bypassing them without confirming test coverage first risks
  silent duplicate creation.

- **Do not change response shapes used by `public/app-v10.js`.**
  The frontend has no version negotiation. Any field rename, removal, or type change in a
  write-endpoint response will silently break the UI. Fields confirmed consumed by the
  frontend include: `claim.id`, `claim.claim`, `claim.status`, `claim.reviewState`,
  `claim.evidenceScore`, `claim.survivability`, `claim.testability`, `evidence.id`,
  `evidence.stance`, `user.id`, `user.handle`.

- **Do not make admin/review endpoints public.**
  `GET /api/review` and `POST /api/review/decision` must always require `x-humanx-admin`
  matching `env.HUMANX_ADMIN_TOKEN`. They expose non-public content and mutate
  moderation state.

- **Do not run Wrangler or D1 commands unless explicitly requested.**
  Do not execute `wrangler d1 execute`, `wrangler deploy`, or any variant unless the user
  has explicitly requested it in the current task. See `docs/OPERATIONAL_STATUS.md`.

---

## 8. Maintenance Rule

This file must be updated whenever **any** of the following happen:

- A public write endpoint is **added** to `src/worker.js` or a delegated module
- A public write endpoint is **removed** or **renamed**
- The **protection** on an existing endpoint changes (rate limit adjusted, auth added or removed)
- A **response shape** change affects a field consumed by `public/app-v10.js`
- A **module delegate** (`truths.js`, `belief-bridge.js`, `evidence-reuse.js`, etc.) has its
  rate limiting, duplicate handling, or write behaviour changed

When updating: add or amend rows in section 4, update section 5 notes, and update the test
checklist in section 6 if new test cases are needed.

Do not use this file to propose new endpoints or implementation changes.
Use `docs/WORKER_MODULAR_SPLIT_PLAN.md` for structural planning.
