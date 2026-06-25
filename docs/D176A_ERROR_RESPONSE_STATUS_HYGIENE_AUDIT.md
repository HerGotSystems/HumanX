# D-176A — Error Response and Status-Code Hygiene Audit

**Date:** 2026-06-25
**Entering commit:** 9d8fda1 (D-175D — Live verify public abuse orphan-row guardrails)
**Entering baseline:** 1322/24/57
**Type:** Audit only. No source code changes.

---

## Executive Summary

The global error catch handler and most route-level validation errors are safe and machine-readable. Three surfaces emit raw internal error messages (SQL error text, constraint names, internal variable values) in 500 responses to callers who can trigger them publicly. Two of these are explicit, one is via the global catch fallback. A fourth surface emits raw SQL error text inside the public `GET /api/claims/:id` `lineage.errors` array when a DB error occurs. Frontend error rendering is XSS-safe (`textContent` throughout). Rate-limit errors are clean and do not expose key values.

| # | Finding | Risk | Verdict |
|---|---|---|---|
| F1 | Global catch emits raw `err.message` in 500 `SERVER_ERROR` | Medium (public-triggerable) | Patch recommended |
| F2 | `TRUTH_LINK_FAILED` explicitly emits raw `linkErr.message` in 500 | Low–Medium (requireUser public route) | Patch recommended |
| F3 | `truths.js` builder context error embeds raw `cbcErr.message` in thrown Error | Low (unusual path) | Patch recommended |
| F4 | `lineage.errors` in public claim response carries raw SQL error text | Low (requires DB error) | Questionable |
| F5–F10 | All other error surfaces reviewed | Low or N/A | Acceptable |

---

## Error Helper Matrix

| Helper / Pattern | File | Behavior | Status Code | Safe? |
|---|---|---|---|---|
| `json(data, status)` | `worker.js` | JSON serializes arbitrary data | Caller's choice | Safe (no internal data added) |
| `requireUser()` throw | `worker.js:862` | Throws `MISSING_PSEUDONYMOUS_USER` or `USER_SHADOW_BANNED` | Caught → 401/403 | Safe — no internal data in message |
| `requireAdmin()` return | `worker.js:864` | Returns `json({ error:'ADMIN_REQUIRED' }, 403)` inline | 403 | Safe |
| `safeRateLimit()` throw | All modules | Throws `RATE_LIMITED` or `RATE_LIMIT_UNAVAILABLE` | Caught → 429/503 | Safe — no key value in message |
| Global catch | `worker.js:83–90` | Routes known sentinel messages → structured 4xx/503; else → `{ error:'SERVER_ERROR', message }` 500 | **F1: raw `message` in 500** | **Needs patch** |
| `safeAll()` | `worker.js:747` | Returns `{ results:[], error: \`${label}: ${raw}\` }` on DB error | Included in lineage response | **F4: raw SQL in public response** |

---

## Route / Category Error Matrix

### Public write routes

| Route / Function | Error | Code | Safe? | Notes |
|---|---|---|---|---|
| `POST /api/session` | `RATE_LIMITED` | 429 | Safe | Added D-175B |
| `POST /api/claims` | `CLAIM_TOO_SHORT` | 400 | Safe | |
| `POST /api/claims` | Unique constraint race → returns existing | 200 | Safe | |
| `POST /api/evidence` | `BAD_EVIDENCE` | 400 | Safe | |
| `POST /api/evidence` | `CLAIM_NOT_FOUND` | 404 | Safe | Added D-175B |
| `POST /api/pressure` | `BAD_PRESSURE` | 400 | Safe | |
| `POST /api/pressure` | `CLAIM_NOT_FOUND` | 404 | Safe | Added D-175B |
| `POST /api/tests` | `CLAIM_ID_REQUIRED`, `TEST_TITLE_TOO_SHORT`, `TEST_INSTRUCTIONS_TOO_SHORT`, `CLAIM_NOT_FOUND` | 400/404 | Safe | |
| `POST /api/truths` | `TRUTH_TOO_SHORT`, `LINKED_CLAIM_NOT_FOUND`, `LINKED_CLAIM_NOT_ELIGIBLE` | 400 | Mostly safe — see F7 |
| `POST /api/truths` | Builder context failure | 500 via global catch | **F3** |
| `POST /api/truth-to-claim` | `TRUTH_ID_REQUIRED`, `TRUTH_NOT_FOUND` | 400/404 | Safe | |
| `POST /api/truth-to-claim` | `TRUTH_LINK_FAILED` | 500 | **F2: raw `linkErr.message`** |
| `POST /api/evidence-attach` | `EVIDENCE_AND_CLAIM_REQUIRED`, `EVIDENCE_NOT_FOUND`, `CLAIM_NOT_FOUND` | 400/404 | Safe | |
| `POST /api/report` | `BAD_TARGET_TYPE`, `BAD_REPORT` | 400 | Safe | |
| `POST /api/claim-vote` | `BAD_CLAIM_ID`, `BAD_VOTE` | 400 | Safe | |
| `POST /api/analysis` | `CLAIM_NOT_FOUND` | 404 | Safe | |
| `POST /api/runpack` | `BAD_CLAIM_ID`, `CLAIM_NOT_FOUND` | 400/404 | Safe | |
| `POST /api/invite-redeem` | `CODE_REQUIRED`, `INVALID_EMAIL`, `INVITE_NOT_FOUND`, `INVITE_REVOKED`, `INVITE_ALREADY_REDEEMED`, `INVITE_EXPIRED`, `EMAIL_ALREADY_IN_USE` | 400/404 | Safe | |
| `POST /api/belief-snapshots` | `BAD_BELIEF_SNAPSHOT`, `BAD_BELIEF_SNAPSHOT_TOO_LARGE` | 400 | Safe | |
| `POST /api/belief-promote` | `SNAPSHOT_ID_REQUIRED`, `BAD_PROMOTION_TARGET`, `SNAPSHOT_NOT_FOUND`, `PROMOTION_STATEMENT_TOO_SHORT` | 400/404 | Safe | |
| Any public write (unexpected) | `SERVER_ERROR` + raw `message` | 500 | **F1** |

### Public read routes

| Route | Error | Code | Safe? | Notes |
|---|---|---|---|---|
| `GET /api/claims` | None on empty results | 200 | Safe | |
| `GET /api/claims/:id` | `CLAIM_NOT_FOUND` | 404 | Safe | Non-public claims also return 404 (opaque) |
| `GET /api/claims/:id` lineage | `lineage.errors` array on DB error | 200 (with error field) | **F4** |
| `GET /api/truths` | None | 200 | Safe | |
| `GET /api/health` | None | 200 | Safe | |
| `GET /api/version` | None | 200 | Safe | |
| `GET /api/ai/analyse` | `RUNPACK_MODE` | 402 | Safe — 402 unusual but intentional signal |
| All unmatched routes | `NOT_FOUND` | 404 | Safe |

### Own-user (requireUser) routes

| Route / Function | Error | Code | Safe? | Notes |
|---|---|---|---|---|
| `POST /api/my-humanx/archive` | `BAD_TARGET_TYPE`, `TARGET_ID_REQUIRED`, `PROTECTED`, `NOT_FOUND_OR_NOT_OWNED`, `STILL_REFERENCED` | 400/403/404/409 | See F6 |
| `POST /api/my-humanx/profile-settings` | `SLUG_TAKEN` | 409 | Safe | |
| `GET /api/my-humanx/export` | None | 200 | Safe | |
| `POST /api/my-humanx/archive` snapshot | `SNAPSHOT_NOT_FOUND_OR_NOT_OWNED` | 404 | Safe | |

### Admin-only routes

| Route | Error | Code | Safe? | Notes |
|---|---|---|---|---|
| All `/api/review/*` | `ADMIN_REQUIRED` on fail | 403 | Safe | |
| `GET /api/debug` | Table counts with `ERROR: ${err.message}` | 200 admin-only | Acceptable — admin context |
| `GET /api/import-seed` | `INVALID_MODE` | 400 | Safe | |
| `GET /api/review/cleanup` | `CLEANUP_REQUIRES_REJECTED`, `CLEANUP_PROTECTED_SEED`, `CLEANUP_REQUIRES_NOT_LOCKED`, `CLEANUP_REASON_REQUIRED`, `CLEANUP_JUNK_OVERRIDE_REJECTED` | 400/403 | Safe — admin sees internal state, intentional |

---

## Findings and Risk Classification

### F1 — Global catch exposes raw `err.message` in `SERVER_ERROR` 500

- **File:** `src/worker.js` line 89
- **Code:** `return json({ error: 'SERVER_ERROR', message }, 500);`
- **Who can trigger:** Any public user who causes an unexpected DB error (e.g. D1 transient failure, unhandled constraint, network issue during write)
- **Exposure:** Raw `err.message` can contain SQLite/D1 error text such as `SQLITE_CONSTRAINT: UNIQUE constraint failed: claims.normalized_claim` — revealing schema/table/column names. Also captures the pre-prefixed messages from F3.
- **Context:** All known unique-constraint errors are caught before this point. This path is reached only for truly unexpected errors. Frequency is low in normal operation.
- **Frontend impact:** `api()` helper reads `data.message` and creates `new Error(data.message)` — user sees raw SQL error text in a `textContent` toast (no XSS, but visible to user).
- **Risk rating:** Medium
- **Verdict:** Patch recommended
- **Recommended D-176B action (P1):** Replace `message` in the 500 response with a fixed safe string, e.g. `'An unexpected error occurred. No data was exposed.'`. If the original message is needed for debugging, this is a Cloudflare Worker with no stdout — consider structured internal logging via a side-effect rather than returning it to the caller.

### F2 — `TRUTH_LINK_FAILED` explicitly returns raw `linkErr.message` in 500

- **File:** `src/truth-claim-bridge.js` line 81
- **Code:** `return json({ error: 'TRUTH_LINK_FAILED', message: String(linkErr && linkErr.message ? linkErr.message : linkErr) }, 500);`
- **Who can trigger:** Any `requireUser`-gated caller of `POST /api/truth-to-claim` who hits the post-INSERT link step after a claim race is resolved
- **Exposure:** Same as F1 — raw D1/SQLite error text in `message` field. Unlike F1 (global catch fallback), this is an explicitly written `message:` field.
- **Risk rating:** Low–Medium
- **Verdict:** Patch recommended
- **Recommended D-176B action (P2):** Replace `message: String(linkErr...)` with a fixed safe string, e.g. `message: 'Internal error creating truth-claim link. No data was committed.'`

### F3 — `truths.js` builder context error embeds raw `cbcErr.message` in thrown Error

- **File:** `src/truths.js` line 98
- **Code:** `throw new Error(\`SERVER_ERROR: builder context insert failed — ${String(cbcErr?.message || cbcErr)}\`);`
- **Who can trigger:** Any `requireUser` caller of `POST /api/truths` who provides `claim_builder` context and triggers a DB error on the context INSERT
- **Exposure:** `cbcErr.message` (raw D1 error) is embedded in the thrown Error's message string, which then becomes the `message` field in the global catch 500 response (F1 compounds this)
- **Risk rating:** Low (unusual code path; requires both claim_builder context AND a DB error on the context insert)
- **Verdict:** Patch recommended
- **Recommended D-176B action (P3):** Replace with `throw new Error('SERVER_ERROR: builder context insert failed');` — drop the raw `cbcErr` message embedding.

### F4 — `lineage.errors` in public `GET /api/claims/:id` response carries raw SQL error text

- **File:** `src/worker.js` lines 746–747 (`claimLineage` + `safeAll`)
- **Code:** `safeAll` returns `{ results:[], error: \`${label}: ${String(err.message)}\` }` and `lineageErrors.push(...)` → `errors: lineageErrors` in the public response
- **Who can trigger:** Any public user fetching a claim when a D1 error occurs on the `truth_claim_links` or `truths` lineage query
- **Exposure:** Raw SQL error text (e.g. `truth_claim_links: D1_ERROR: ...`) visible in `lineage.errors` to any public caller. Not a persistent exposure — only appears when there is an active DB error.
- **Risk rating:** Low (requires transient DB error; doesn't expose data, only schema fragments)
- **Verdict:** Questionable
- **Recommended D-176B action (P4 — optional):** Strip error text from `lineage.errors` in public responses. Either omit the `errors` array entirely or replace error strings with a boolean/count. The label pattern (`truth_claim_links: ...`) already leaks table names.

### F5 — `redeemInviteCode` response includes user's own `email` field (Acceptable)

- **File:** `src/worker.js` line 741–742
- **Code:** `SELECT id, handle, email, verified, verified_at, display_name, trust_score, strike_count, created_at FROM users WHERE id=?` → `json({ ok:true, user })`
- **Who can trigger:** The user who just successfully redeemed an invite with their own email
- **Exposure:** User's own email returned in their own session response
- **Risk rating:** Low — appropriate disclosure (own-user, post-redemption)
- **Verdict:** Acceptable. The submitter provided the email; receiving it back is expected. No third-party disclosure.

### F6 — `STILL_REFERENCED` includes `referencedBy: claimId` (Acceptable)

- **File:** `src/worker.js` lines 383, 387, 394
- **Code:** `return json({ error:'STILL_REFERENCED', referencedBy: primaryClaim.id }, 409);`
- **Who can trigger:** Own-user archiving their own evidence or pressure when another claim still references it
- **Exposure:** A claim ID is returned to the user whose content is being referenced
- **Risk rating:** Low — claim IDs are non-secret identifiers; own-user context; this helps the user understand what prevents the archive
- **Verdict:** Acceptable

### F7 — `LINKED_CLAIM_NOT_ELIGIBLE` includes `review_state` of a provided claim ID (Acceptable)

- **File:** `src/truths.js` line 58
- **Code:** `return json({ error:'LINKED_CLAIM_NOT_ELIGIBLE', review_state: linkedState }, 400);`
- **Who can trigger:** Any `requireUser` caller of `POST /api/truths` who provides a `linkedClaimId` pointing to an archived/rejected/duplicate claim
- **Exposure:** Tells the caller that the specific claim ID they provided has `review_state` of `archived`, `rejected`, or `duplicate`
- **Risk rating:** Low — the caller provided the ID; knowing its terminal state does not reveal data about other users or secret content
- **Verdict:** Acceptable. This is load-bearing feedback (D-173B P3) — the submitter needs to know why their ID was rejected to take corrective action.

### F8 — Frontend toast renders `data.message || data.error` via `textContent` (Acceptable)

- **File:** `public/app-v10.js` lines 46, 55
- **Code:** `api()` throws `new Error(data.message||data.error||'Request failed')`; callers use `toast(e.message||'...')`; `toast()` sets `e.textContent = t`
- **Exposure:** If a 500 `message` field contains SQL text, the user sees it in their own toast. No XSS risk (`textContent`). The user can only see their own request's error.
- **Risk rating:** Low — textContent is safe; user-visible SQL fragments are a UX quality issue, not a security breach
- **Verdict:** Acceptable. Patching F1 (which sanitizes the 500 `message` at source) eliminates the user-visible SQL text as a side effect.

---

## Public Error Verdict

Most public errors are safe, machine-readable, and consistent. The three raw-message exposures (F1/F2/F3) are the only substantive findings. All require either a DB error or an unusual code path to trigger, so real-world exposure frequency is low — but the blast radius when triggered is non-zero (schema names, table names, constraint names visible to any public caller).

Status codes are sensible throughout:
- 400 for bad input — consistent
- 401/403 for auth — consistent
- 404 for missing objects (non-public claims return 404 not 403 — opaque, intentional)
- 409 for conflicts (`STILL_REFERENCED`, `SLUG_TAKEN`, `EMAIL_ALREADY_IN_USE`)
- 429 for rate limits — consistent
- 402 for RunPack-mode signal — non-standard but intentional
- 503 for rate-limit-table unavailable — correct
- 500 only on unexpected errors — correct, but message field is the gap

---

## Admin Error Verdict

Admin-only errors (`requireAdmin`-gated) intentionally reveal more context — cleanup state, allowed review decisions, junk heuristic feedback. This is acceptable; the admin is trusted. `debugState` exposes `err.message` for table count errors but is admin-gated. No admin-level exposure reaches public callers.

---

## Frontend Error Rendering Verdict

- `toast()` always uses `e.textContent` — safe from XSS regardless of message content
- No `innerHTML` assignment from server data in error paths
- `api()` uses `data.message || data.error || 'Request failed'` as the toast string — safe but surfaces raw 500 messages to users (mitigated by patching F1)
- Admin token input is `type="password"` — confirmed
- No `console.*` calls — confirmed

---

## Docs / Live-Verify Error Output Verdict

D-173D, D-174D, D-175D documents:
- Do not paste raw response bodies
- Record only boolean/status evidence
- Mark body-match `False` results explicitly as stream-reading artifacts
- No tokens, invite codes, emails, or user IDs recorded
- Verdict: Acceptable

---

## Rate-Limit Error Verdict

All `safeRateLimit` implementations throw `RATE_LIMITED` or `RATE_LIMIT_UNAVAILABLE` — no rate-limit key value or IP address is included in the thrown message or in the global catch 429/503 response. The rate-limit key itself (`session:1.2.3.4`, `claim:1.2.3.4`, etc.) never appears in any response. Verdict: Acceptable.

---

## Recommended D-176B Patch List

| Priority | ID | File/Function | Patch |
|---|---|---|---|
| Medium | P1 | `src/worker.js:89` — global catch 500 | Replace `message` in 500 response with fixed safe string; remove raw `err.message` from public response |
| Low–Medium | P2 | `src/truth-claim-bridge.js:81` — `TRUTH_LINK_FAILED` | Replace `message: String(linkErr...)` with a fixed generic string |
| Low | P3 | `src/truths.js:98` — builder context throw | Drop raw `cbcErr.message` from thrown Error message |
| Optional | P4 | `src/worker.js:747` — `safeAll` lineage errors | Strip error text from `lineage.errors` in public claim response |

All patches are backend-only, no schema/migration change, no route semantics change.

---

## Verification — Review Routes and Frontend Integrity

| Check | Status |
|---|---|
| `requireAdmin` enforced on all `/api/review/*` routes | Confirmed |
| `/api/debug` gated by `requireAdmin` | Confirmed |
| Public routes do not return admin or owner token values | Confirmed |
| Frontend `app-v10.js` — no `console.*` | Confirmed |
| Admin token input is `type="password"` | Confirmed |
| No `wrangler.toml` | Confirmed |
| No migration | Confirmed |
| No owner-token work resumed | Confirmed |

---

## No Code Change Confirmation

D-176A is an audit document only. No files in `src/` were modified. No files in `public/` were modified. No files in `scripts/` were modified.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or owner-token-adjacent changes were introduced or planned in D-176A.

---

## Baseline

**1322/24/57** — unchanged from D-175D.

---

## Recommended Next Step

D-176B — Implement P1/P2/P3 (and optionally P4) from this audit. No schema changes required. Expected baseline increase: +~10 smoke tests.
