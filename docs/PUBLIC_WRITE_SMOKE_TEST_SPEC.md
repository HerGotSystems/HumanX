# Public Write Smoke Test Spec

## 1. Purpose

This spec defines a future opt-in public-write smoke test plan for HumanX. It is the
next planned test layer after read-only smoke tests are confirmed passing.

The read-only smoke test (`scripts/read-endpoint-smoke-test.mjs`) confirmed live
baseline behaviour on 2026-06-01 — see `docs/LIVE_READ_SMOKE_RESULT.md`. This spec
describes what comes after that baseline is established: a deliberately narrow,
clearly opt-in smoke test for the public-write surface.

This document is a specification only. No test script is implemented here.

---

## 2. Why This Must Be Opt-In

Write endpoint tests are categorically different from read tests. They must never run
by accident or by default.

| Risk | Detail |
|---|---|
| **Production data pollution** | Every POST creates or modifies real D1 rows. Test data mixed with real content is not automatically separable. |
| **Rate limit consumption** | Public write endpoints are rate-limited per IP. Running a write test against the live Worker burns rate limit budget for that IP for up to one hour, potentially blocking legitimate users. |
| **Duplicate handling risk** | Claim and truth deduplication uses `normalized_claim` / `normalized_statement` unique indexes. A smoke test claim that collides with a real user's claim will return the real user's content — or the smoke test claim may become the canonical record. |
| **Admin/review flow sensitivity** | The review queue is the only current moderation tool. Test items appearing in the review queue create real administrative work for the site owner. |
| **Irreversibility** | Rows written to `claims`, `truths`, `evidence`, `reports`, etc. are not auto-deleted. Cleanup is manual unless a purpose-built cleanup route is added. |
| **Labelling requirement** | Any test that reaches production must be clearly labelled as automated smoke-test data so it can be identified and cleaned up manually if needed. |

---

## 3. Candidate Mutating Endpoints

All endpoints below are from `src/worker.js` (read in full) and
`docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`. Rate limits are from `src/worker.js` inline
handlers and confirmed module files. Tables touched are from handler code.
Module-delegated rate limits are marked uncertain where the source file was not
re-verified for this spec.

| Method | Path | Public / admin / uncertain | What it writes | Tables touched | Safe test strategy | Risk level |
|---|---|---|---|---|---|---|
| POST | `/api/session` | Public — no auth | Creates or retrieves a user row | `users` | Use a deterministic smoke-test user ID; INSERT OR IGNORE makes it idempotent; no rate limit | **Low** |
| POST | `/api/claims` | Public — requires `x-humanx-user` | Creates a claim in `review_state='review'` | `claims`, optionally `evidence`, `users`, `rate_limits` | Submit one clearly prefixed claim; verify `reviewState='review'` in response; dedup prevents duplicate rows on re-run; rate limit 8/hr per IP | **Low-medium** |
| POST | `/api/runpack` | Public — no auth required | Reads claim detail; creates one `aip_packets` row | `aip_packets`, reads `claims`, `evidence`, `pressure_points`, `home_tests`, `analysis_results` | Provide a known real claim ID from the live site; verify packet structure; no rate limit | **Low-medium** |
| POST | `/api/aip` | Public — no auth required | Alias for `/api/runpack` — identical handler | Same as `/api/runpack` | Same as `/api/runpack` | **Low-medium** |
| POST | `/api/evidence` | Public — requires `x-humanx-user` | Adds direct evidence to a claim; triggers score recalc | `evidence`, `users`, `rate_limits`, `claims` | Use a test claim ID; prefix evidence title; rate limit 20/hr per IP | **Medium** |
| POST | `/api/pressure` | Public — requires `x-humanx-user` | Adds a pressure point to a claim; triggers score recalc | `pressure_points`, `users`, `rate_limits`, `claims` | Use a test claim ID; prefix pressure title; rate limit 20/hr per IP | **Medium** |
| POST | `/api/tests` | Public — requires `x-humanx-user` | Adds a home test to a claim | `home_tests`, `users`, `rate_limits`, `claims` | Use a test claim ID; prefix test title; rate limit 20/hr per IP; validates claim exists before insert | **Medium** |
| POST | `/api/truths` | Public — requires `x-humanx-user` | Creates a truth record; dedup via `normalized_statement` | `truths`, `users`, `rate_limits` | Prefix statement; rate limit 12/hr per IP (confirmed from `src/truths.js`); dedup prevents duplicate rows on re-run | **Medium** |
| POST | `/api/analysis` | Public — requires `x-humanx-user` | Stores a caller-supplied analysis payload for a claim | `analysis_results`, `users` | Rate limiting uncertain — verify in `src/analysis-results.js` before testing; no server AI call | **Medium** |
| POST | `/api/belief-snapshots` | Public — requires `x-humanx-user` | Saves a Belief Engine snapshot | `belief_snapshots`, `users` | Use smoke-test user; prefix label; rate limit 20/hr per IP (confirmed from `src/belief-snapshots.js`) | **Medium** |
| POST | `/api/claim-vote` | Public — requires `x-humanx-user` | Votes on a claim; triggers score recalc | `claim_votes`, `claims` | Rate limit 120/hr per user+IP (confirmed from `docs/OPERATIONAL_STATUS.md`); affects live claim scores | **Medium-high** |
| POST | `/api/evidence-attach` | Public — requires `x-humanx-user` | Links existing evidence to a different claim | `evidence_claim_links`, `evidence`, `users`, `rate_limits` | Rate limiting uncertain — verify in `src/evidence-reuse.js`; PR #13 fix must not regress (returns real DB id) | **Medium-high** |
| POST | `/api/truth-to-claim` | Public — requires `x-humanx-user` | Converts a truth to a claim; two-table write | `claims`, `truth_claim_links`, `truths`, `users` | Rate limiting uncertain — verify in `src/truth-claim-bridge.js`; partial failure risk if first write succeeds and second fails | **High** |
| POST | `/api/belief-promote` | Public — requires `x-humanx-user` | Promotes a snapshot into claims or truths; cross-system write | `belief_snapshots`, `claims` or `truths` | Rate limiting uncertain — verify in `src/belief-bridge.js`; highest-consequence Belief Engine write | **High** |
| POST | `/api/report` | Public — requires `x-humanx-user` | Records a report; auto-escalates claim to `review_state='review'` at 2+ reports | `reports`, `claims`, `users`, `rate_limits` | **Do not test against a real claim** — auto-escalation suppresses the claim from public list; rate limit 20/hr per IP | **High** |
| POST | `/api/review/decision` | Admin only — requires `x-humanx-admin` | Sets `review_state` on claims or truths; closes reports | `claims` or `truths`, `reports` | Requires `HUMANX_ADMIN_TOKEN`; irreversible without a follow-up decision call; keep in separate admin-test suite | **Admin / high** |

---

## 4. Test Data Naming Convention

All content created by write smoke tests must use the following prefix so it can be
identified and cleaned up manually:

```
HUMANX_SMOKE_TEST_
```

Every smoke-test data item must include all four of:

| Component | Example | Purpose |
|---|---|---|
| Prefix | `HUMANX_SMOKE_TEST_` | Identifies automated test data |
| ISO timestamp | `2026-06-01T12:00:00Z` | Records when the test ran |
| Random suffix | `a3f8` | Prevents collisions between runs |
| Note field | `"automated smoke-test data, safe to delete"` | Human-readable label if the row appears in review queue or UI |

**Example claim text:**
```
HUMANX_SMOKE_TEST_2026-06-01T12:00:00Z_a3f8 — automated smoke-test data, safe to delete
```

**Example evidence title:**
```
HUMANX_SMOKE_TEST_2026-06-01T12:00:00Z_a3f8 — smoke test evidence, safe to delete
```

The prefix format must not be changed once adopted — it is the basis for manual
cleanup queries like:
```sql
SELECT id, claim, review_state FROM claims WHERE claim LIKE 'HUMANX_SMOKE_TEST_%';
```

---

## 5. Proposed Script Safety Gates

The future write smoke test script must require all of the following before making any
mutating request. If any are missing, the script must exit with a non-zero code and
print clear instructions — it must never fall back to running tests.

| Gate | Mechanism | Purpose |
|---|---|---|
| `HUMANX_BASE_URL` | Environment variable | Same as read smoke test — target URL must be explicit |
| `HUMANX_ALLOW_WRITE_SMOKE_TEST=1` | Environment variable | Explicit opt-in to mutation; must not default to enabled |
| `--i-understand-this-mutates-data` | CLI flag | Human-readable confirmation that the operator knows writes will occur |
| `HUMANX_ADMIN_TOKEN` | Environment variable — **optional** | Only required for admin/review endpoint tests; must not be embedded in the script |
| Dry-run mode | Default behaviour | If the opt-in flag is absent, the script should describe what it would test without making any requests |

**Recommended gate check order in the script:**
1. Validate `HUMANX_BASE_URL` (exit 2 if missing/invalid — same as read script)
2. Check for `--i-understand-this-mutates-data` CLI flag (exit 3 if absent)
3. Check `HUMANX_ALLOW_WRITE_SMOKE_TEST=1` (exit 3 if not set to `1`)
4. If all gates pass, proceed with a clearly labelled header stating that mutation tests are running

---

## 6. Recommended First Write-Test Scope

The first implementation PR for public write testing should test **one flow only**:

**Submit one clearly marked test claim and verify the response.**

Specifically:

1. Call `POST /api/session` with a deterministic smoke-test user ID to ensure the user
   row exists (INSERT OR IGNORE — idempotent, no rate limit impact)
2. Call `POST /api/claims` with:
   - `x-humanx-user` header set to the smoke-test user ID
   - A claim text prefixed with `HUMANX_SMOKE_TEST_` plus timestamp and random suffix
   - No `initialEvidence` field (keep the write minimal)
3. Confirm the response includes:
   - `claim.reviewState === 'review'` (not `'public'`)
   - `claim.id` is a non-empty string
   - `claim.claim` contains the submitted text
4. If the claim already exists from a previous run (response contains `existing: true`),
   confirm `claim.reviewState` and treat it as a pass — deduplication is working correctly

**Do not, in the first PR:**
- Approve the claim via the review queue
- Vote on the claim
- Attach evidence to it
- Require the admin token
- Test any other endpoint

This scope proves that the most important public write endpoint (claim submission) works
correctly and that new claims are not accidentally made public.

---

## 7. Out of Scope for First Write-Test PR

The following are explicitly deferred to later PRs or separate test suites:

- Admin approve/reject flow (`POST /api/review/decision`) — requires admin token; belongs in a separate admin test suite
- Vote rate-limit stress testing (`POST /api/claim-vote`) — consumes rate budget and affects live claim scores
- Duplicate race condition testing — requires concurrent requests; not practical as a simple smoke test
- Evidence submission and attach (`POST /api/evidence`, `POST /api/evidence-attach`) — affects claim scores; higher cleanup burden
- Truth creation and promotion (`POST /api/truths`, `POST /api/truth-to-claim`) — dedup risks; two-table write risk
- Belief Engine full bridge (`POST /api/belief-snapshots`, `POST /api/belief-promote`) — cross-system write; highest consequence
- AI analysis storage (`POST /api/analysis`) — rate limiting uncertain; payload validation unclear from `worker.js` alone
- Report submission (`POST /api/report`) — auto-escalation makes this too risky to test against real claims
- Destructive cleanup — no safe delete endpoint exists currently; cleanup is manual
- Schema or migration work — none required for these tests

---

## 8. Cleanup Policy

Write smoke tests create real D1 rows. The following policy applies until a purpose-built
cleanup route is explicitly designed and added:

- **First version must not auto-delete.** There is no safe delete endpoint currently.
  Automatic deletion via D1/Wrangler commands is not acceptable unless the user
  explicitly requests it in the task.

- **Test data must be findable by prefix.** The `HUMANX_SMOKE_TEST_` prefix in all
  claim text, evidence titles, truth statements, and snapshot labels allows a site admin
  to identify test rows via the admin review queue or via a manual D1 query (when
  explicitly approved).

- **Cleanup is manual and admin-gated.** A site admin using the review queue can reject
  smoke-test claims. Direct D1 deletion should only happen on explicit user instruction
  following `docs/D1_DUPLICATE_CLEANUP.md` safe-deletion principles (re-point child rows
  before deleting parents).

- **Do not use Wrangler/D1 commands for cleanup** unless the user explicitly requests
  it in the current task.

- **If a cleanup endpoint is later built** (e.g. `POST /api/admin/purge-smoke-data`),
  it must be admin-gated and designed as a deliberate, audited operation — not a
  side-effect of the smoke test script itself.

---

## 9. Expected Proof Before Implementation

Complete this checklist before opening the first write smoke test implementation PR:

- [ ] Read endpoint smoke test passes (`node scripts/read-endpoint-smoke-test.mjs https://…`) — confirms baseline is stable
- [ ] Live frontend QA passes (`docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`) — confirms no regressions from current state
- [ ] `docs/API_ENDPOINT_INVENTORY.md` is current — no routes added or removed since last update
- [ ] `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` is current — no protection changes since last update
- [ ] Exact response shape for `POST /api/claims` is confirmed from `src/worker.js` (already confirmed: `{ claim: { id, claim, reviewState, ... } }` or `{ ok: true, existing: true, claim: {...} }`)
- [ ] Exact response shape for `POST /api/session` is confirmed from `src/worker.js` (already confirmed: `{ user: { id, handle, trust_score, strike_count } }`)
- [ ] Rate limit for `POST /api/claims` (8/hr per IP) is understood and the test will make at most one call per run
- [ ] User has explicitly approved running write tests against the live site if the target is production

---

## 10. Stop Conditions

Work on the write smoke test implementation must stop immediately if any of the
following occur:

- **Any uncertainty about whether an endpoint mutates data** — default to treating it as mutating; exclude it
- **Any need for D1 or Wrangler** — the script must run with `node` only, no `wrangler d1 execute`
- **Any endpoint requires admin token unexpectedly** — stop; do not embed credentials
- **Any test would create many rows** — if a loop or retry logic would create more than one row per run, it is out of scope for a smoke test
- **Any response shape is unclear** — mark it uncertain; do not assert keys that were not confirmed from source code
- **Any rate limit behaviour is not understood** — verify in the source module before testing; do not test an endpoint whose rate limit is marked uncertain in this spec
- **Any need to change `src/worker.js` before the test works** — stop; the test must work against the current unmodified Worker

---

## 11. Relationship to Read Smoke Test

The public write smoke test must remain **a separate script** from
`scripts/read-endpoint-smoke-test.mjs`.

The read smoke test is safe to run at any time, against any environment, without
approval. The write smoke test requires explicit opt-in gates, a different invocation,
and a different risk posture.

Mixing them into one script would:
- Make it easy to accidentally trigger write calls when only reads were intended
- Obscure which kind of failure occurred (network read failure vs. write rejection)
- Remove the safety gate mechanism that makes write tests opt-in

The recommended final invocation pattern for the write test, once implemented:

```
HUMANX_BASE_URL=https://your-site.example \
HUMANX_ALLOW_WRITE_SMOKE_TEST=1 \
node scripts/public-write-smoke-test.mjs --i-understand-this-mutates-data
```

This must never be the default. A bare `node scripts/public-write-smoke-test.mjs` with
no flags must print instructions and exit without making any requests.
