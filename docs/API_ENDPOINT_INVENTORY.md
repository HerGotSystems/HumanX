# API Endpoint Inventory

> **This file is descriptive, not authoritative.**
> `src/worker.js` is the single source of truth for all endpoint behaviour.
> Update this file whenever endpoints are added, removed, or renamed in `src/worker.js`.

---

## 1. Purpose

This document lists every `/api/...` route currently handled by the HumanX Cloudflare Worker.
It exists to make the endpoint surface visible for review, planning, and risk assessment.
It does not propose changes. It does not define new endpoints.

---

## 2. Source of Truth

| Item | Value |
|---|---|
| Worker entrypoint | `src/worker.js` |
| D1 binding | `DB` |
| Database name | `humanx` |
| Admin token env var | `HUMANX_ADMIN_TOKEN` |
| User identity header | `x-humanx-user` |
| Admin identity header | `x-humanx-admin` |
| CORS | `*` (all origins, GET/POST/OPTIONS) |

---

## 3. Endpoint Table

### Health / System

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/health` | Returns service status, mode flags, and AI mode label | Public | None | None — no DB read |
| GET | `/api/debug` | Returns row counts for all tables and the 5 most recent claims | Internal-ish | All tables (COUNT only), `claims` | Exposes full table inventory and live data. No admin token required — relies on obscurity only |
| GET | `/api/seed` | Seeds demo claims if `claims` table is empty | **Admin only** (D-59) | `claims`, `users` | D-59: now requires admin token (`x-humanx-admin`). Unauthenticated calls return 403. DB-empty guard preserved. Inserts as `review_state='public'` (demo fallback only — not used for launch pack) |
| GET | `/api/debug/owner-token-telemetry` | Accepts optional `?window=all\|1h\|24h\|7d` (default `all`; unrecognized values normalize to `all`). Returns `{ ok, sample_window, all_time, window_started_at, window_ended_at, status_counts (all 6 buckets, zero-defaulted), valid_count, total_count, valid_ratio, route_counts, route_status_counts (all 8 routes × 6 buckets, zero-defaulted), observed_routes, unobserved_owner_routes, recent (≤20 sanitized rows), query_error }` (D-149E time-windowed shape) | **Admin only** (D-147B) | `owner_token_telemetry` (read-only) | Requires admin token (`x-humanx-admin`). Non-`all` windows filter by `created_at`. Never returns a raw token, secret, admin token, or full user id — `recent` rows are an explicit allowlist of route/status/uid_suffix/request_family_hash/created_at only |

### Session / User

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/session` | Creates or retrieves a pseudonymous user by ID | Public | `users` | No authentication. ID is caller-supplied or auto-generated. Fingerprint hash stored but not validated |
| GET | `/api/me` | Returns the current user row (D-136B) | Public (requires `x-humanx-user`) | `users` | Same identity model as `/api/session` — `x-humanx-user` is unsigned and spoofable (known limitation, no cookie/magic-link yet). Response omits `is_admin` and any admin-token material |
| GET | `/api/my-humanx` | Returns the current user's own claims/truths/evidence/pressure/belief-snapshot content + per-state counts (D-137B) | Public (requires `x-humanx-user`) | `users`, `claims`, `truths`, `evidence`, `pressure_points`, `belief_snapshots` | Always scoped to the requester's own `x-humanx-user` — never accepts a target user id. Same spoofing limitation as `/api/me`. Lists capped (20 claims/truths/evidence/pressure, 10 belief snapshots). Response omits `is_admin` and any admin-token material |
| POST | `/api/my-humanx/archive` | Soft-archives the caller's own claim/truth/evidence/pressure row (`review_state='archived'`, `archived_by_user=1`) (D-138B) | Public (requires `x-humanx-user`) | `claims`, `truths`, `evidence`, `pressure_points`, `evidence_claim_links` | Ownership enforced via `WHERE id=? AND user_id=?` — `404 NOT_FOUND_OR_NOT_OWNED` on any mismatch (never reveals row existence to non-owners). Blocks `PROTECTED_SEEDS`/dev-handle/seed-id-prefix rows with `403 PROTECTED`. Blocks evidence/pressure still cited by another user's public claim with `409 STILL_REFERENCED`. No hard delete, no restore endpoint yet |
| GET | `/api/my-humanx/export` | Full, uncapped JSON export of the caller's own data across all owned tables (D-138B) | Public (requires `x-humanx-user`), rate-limited 5/hr/user | `users`, `claims`, `truths`, `evidence`, `pressure_points`, `belief_snapshots`, `claim_votes`, `evidence_votes`, `truth_votes`, `home_tests` | Always scoped to the requester's own `x-humanx-user` — never accepts a target user id. No `LIMIT` on any query. `Content-Disposition: attachment` JSON download. Response omits `is_admin` and any admin-token material (explicit `users` column list, never `SELECT *`) |
| POST | `/api/my-humanx/profile-settings` | Saves the caller's own public-profile settings (`profile_public`, `profile_slug`, `profile_bio`) (D-140B) | Public (requires `x-humanx-user`) | `users` | Always scoped to the requester's own `x-humanx-user` — never accepts a target user id. Slug required only when `profile_public=1`; validated (lowercase, `a-z0-9-`, 3-40 chars, no leading/trailing/double hyphen, reserved-word list), enforced unique via `idx_users_profile_slug` (`409 SLUG_TAKEN` on conflict). When `profile_public=0` the slug is always stored as NULL. Bio capped at 240 chars, plain text only |
| GET | `/api/u/:slug` | Public, no-auth, read-only profile for an opted-in user (D-140C) | Public (no auth required) | `users`, `claims`, `truths`, `evidence`, `pressure_points` | Looks up `WHERE profile_slug=? AND profile_public=1` — same `404 PROFILE_NOT_FOUND` for a missing slug, an invalid slug, and a slug that exists but isn't public (never distinguishes private from not-found). Returns only `slug`, `bio`, `displayName`, public-state content counts, and up to 10 most-recent rows per type (`COALESCE(review_state,'public')='public' AND COALESCE(archived_by_user,0)=0`). Never returns `email`/`id`/`verified`/`trust_score`/`strike_count`/`is_shadow_banned`/`is_admin`/admin-token material/`raw_json`/`stress_points_json`/export data. Evidence rows omit `body`/`source_url`; pressure rows omit `body` — v1 public profile is summary-level only |
| POST | `/api/auth/invite/create` | Mints a single-use invite code (D-136B) | **Admin only** | `invite_codes` | Requires `x-humanx-admin`. Does not echo back the admin token |
| POST | `/api/auth/invite/redeem` | Redeems an invite code to verify the current `x-humanx-user` row with an email (D-136B) | Public (requires `x-humanx-user`) | `users`, `invite_codes` | Rate-limited (8/hr/IP). Single-use, atomic claim via guarded `UPDATE ... WHERE redeemed_by IS NULL`. Enforces email uniqueness. Never sets `is_admin`. Upgrades the existing anonymous row in place — never mints a new user id |

> **Non-`/api/` route note (D-143B):** `GET /u/:slug` is a Worker-level route, not under `/api/`, so it's outside this table's stated scope — but it's documented here for visibility since it shares the same privacy model as `GET /api/u/:slug` above. It intercepts before the static-asset fallback (`src/worker.js`, matched immediately before `if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);`) and returns `index.html` with server-rendered OpenGraph/Twitter-card meta tags injected into `<head>` for opted-in, public profiles only. It reuses the same `loadPublicProfileSummary()` helper and the same `WHERE profile_slug=? AND profile_public=1` filter as `GET /api/u/:slug` — a missing, invalid, or private slug returns the **unmodified** `index.html` (same response shape/status as any other page load, no distinguishing signal). Meta content is HTML-escaped. Only `displayName`, a truncated `bio` (or a generic fallback sentence), and the canonical URL are ever injected — never email/user id/admin fields, never belief/snapshot data. No mutating behavior, no OG image endpoint, no `wrangler.toml` `not_found_handling`/global SPA-fallback change.

### Claims

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/claims` | Lists public claims, optionally filtered by `q` and `status` | Public | `claims`, `users` | Only returns `review_state='public'` rows. Limit capped at 50 |
| POST | `/api/claims` | Submits a new claim | Public (requires `x-humanx-user`) | `claims`, `users`, `evidence`, `rate_limits` | Rate-limited (8/hr per IP). Duplicate detection via `normalized_claim`. New claims land in `review_state='review'`. Race condition on unique index handled explicitly |
| GET | `/api/claims/:id` | Returns full claim detail including evidence, pressure, tests, analyses, and truth lineage | Public | `claims`, `users`, `evidence`, `evidence_claim_links`, `pressure_points`, `home_tests`, `analysis_results`, `truth_claim_links`, `truths` | Aggregates many tables. `review_state` guard added in D-38: returns `CLAIM_NOT_FOUND` for any claim where `review_state` is not `'public'` |
| POST | `/api/claim-vote` | Records or updates a user's vote/stance on a claim (`believe`, `reject`, or `unsure`). Upserts into `claim_votes` (INSERT OR IGNORE / UPDATE pattern) then refreshes the claim's `belief_yes`, `belief_no`, and `uncertainty` vote counts. Returns updated claim shape. | Public (requires `x-humanx-user`) | `claim_votes`, `claims`, `users`, `rate_limits` | Rate-limited at 120/hr per user+IP (confirmed in `src/votes.js`). Delegates to `voteClaim` in `src/votes.js`. Response shape (`beliefYes`, `beliefNo`, `uncertainty` on the claim object) is used by the frontend — do not change casually. Invalid vote values are rejected with `BAD_VOTE`. |

### Evidence

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/evidence` | Adds direct evidence to a claim | Public (requires `x-humanx-user`) | `evidence`, `users`, `rate_limits`, `claims` | Rate-limited (20/hr per IP). Recalculates claim score after insert. D-42B: evidence inserted with `review_state='review'` — not publicly visible until approved by admin |
| POST | `/api/evidence-attach` | Reuses existing evidence and links it to a different claim | Public (requires `x-humanx-user`) | `evidence_claim_links`, `evidence`, `users`, `rate_limits` | Delegates to `evidence-reuse.js`. Rate limiting applied inside helper (uncertain — verify in module) |
| GET | `/api/evidence-vault` | Lists evidence items from the vault | Public | `evidence`, `claims` (JOIN) | Delegates to `evidence-vault.js`. D-38: evidence filtered to claims where `COALESCE(c.review_state,'public')='public'`. D-42B: also filters `COALESCE(e.review_state,'public')='public'` — evidence itself must be approved to appear in the vault |

### Truths

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/truths` | Lists truth records | Public | `truths` (uncertain — verify in module) | Delegates to `truths.js`. Filter/limit behaviour uncertain from this file alone |
| POST | `/api/truths` | Creates a new truth record | Public (requires `x-humanx-user`) | `truths`, `users`, `rate_limits` (uncertain — verify in module) | Delegates to `truths.js`. Duplicate handling uncertain from this file alone |
| POST | `/api/truth-to-claim` | Converts a truth record into a claim and creates a `truth_claim_links` bridge | Public (requires `x-humanx-user`) | `truths`, `claims`, `truth_claim_links`, `users` (uncertain — verify in module) | Delegates to `truth-claim-bridge.js`. Bridge creation is a write to two tables — failure modes uncertain |

### Beliefs / Drift

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/belief-snapshots` | Lists saved Belief Engine snapshots for the requesting user | Public (requires `x-humanx-user`) | `belief_snapshots` (uncertain — verify in module) | Delegates to `belief-snapshots.js` |
| POST | `/api/belief-snapshots` | Saves a Belief Engine snapshot | Public (requires `x-humanx-user`) | `belief_snapshots`, `users` (uncertain — verify in module) | Delegates to `belief-snapshots.js`. Snapshot payload size not validated in this file |
| POST | `/api/belief-promote` | Promotes a Belief Engine snapshot (bridge to claims or truths) | Public (requires `x-humanx-user`) | `belief_snapshots`, `claims` or `truths` (uncertain — verify in module) | Delegates to `belief-bridge.js`. Promotes data across systems — high side-effect risk |

### Pressure / Tests

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/pressure` | Adds a pressure point to a claim | Public (requires `x-humanx-user`) | `pressure_points`, `users`, `rate_limits`, `claims` | Rate-limited (20/hr per IP). Recalculates claim score after insert |
| POST | `/api/tests` | Adds a home test to a claim | Public (requires `x-humanx-user`) | `home_tests`, `users`, `rate_limits`, `claims` | Rate-limited (20/hr per IP). Validates claim existence before insert |

### Review / Admin

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/review` | Returns review queue: claims, truths, and evidence not in `public` or `archived` state (or with reports) | Admin only (`x-humanx-admin`) | `claims`, `truths`, `evidence` | D-42B: now includes evidence items in `review_state != 'public'/'archived'` or `report_count > 0`. Response includes `evidence` array and merged `review` array with `target_type` field. Returns up to 100 of each type. Leaks non-public content — admin token is the only gate |
| POST | `/api/review/decision` | Approves, rejects, or re-queues a claim, truth, or evidence item by ID | Admin only (`x-humanx-admin`) | `claims` or `truths` or `evidence`, `reports` | D-42B: now supports `targetType='evidence'` — updates `evidence.review_state`, resets `report_count=0`, closes open reports. Mutates `review_state`. Irreversible without a new decision call. D-50: now calls `recalcClaimScore` after evidence decision (approve/reject/re-queue all trigger score update on parent claim) |
| POST | `/api/review/cleanup` | Archives a single already-rejected smoke or test artefact by exact target_type + target_id. Sets `review_state='archived'` — no hard delete. Enforces three gates: (1) admin token, (2) item must be in `rejected` state, (3) item text must match smoke/test heuristic. Returns JSON summary of action taken. | Admin only (`x-humanx-admin`) | `claims` or `truths` | Non-destructive — no rows are deleted. `archived` state removes item from queue display but preserves the DB row for audit. No cascading side effects. |
| POST | `/api/review/mark-duplicate` | Marks a claim as a duplicate of another claim. Sets `duplicate_of` and `review_state='duplicate'` on the source claim. Source is not deleted. Both claims must exist; self-duplicate is rejected. Source must not already be `archived` or `duplicate`. | Admin only (`x-humanx-admin`) | `claims` | Non-destructive — source claim is preserved. `duplicate` state removes claim from review queue and public list. `mapClaim` now returns `duplicateOf` field. Optional `reason` field accepted but not persisted (for admin logging only). |
| POST | `/api/review/resolve-similar` | Clears the `near_duplicate_of` advisory on a claim (dismisses the similarity flag without merging or deleting). Returns `previous_near_duplicate_of` for audit. No-op guard: returns error if `near_duplicate_of` is already null. | Admin only (`x-humanx-admin`) | `claims` | Non-destructive — no merges, no deletes, no `review_state` change. Only clears `near_duplicate_of`. |
| POST | `/api/report` | Submits a report against a claim or evidence item | Public (requires `x-humanx-user`) | `reports`, `claims` or `evidence`, `users`, `rate_limits` | Rate-limited (20/hr per IP). D-42B: supports `targetType='evidence'` — increments `evidence.report_count` and auto-escalates to `review_state='review'` at threshold 2. Claim auto-escalation behaviour unchanged. D-50: now calls `recalcClaimScore` on the parent claim when evidence is first escalated (report_count crosses from 1 to 2) |

### AI / Analysis

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/ai/analyse` | Intentionally disabled. Returns `RUNPACK_MODE` / `AIP_MODE` error with HTTP 402 | Public | None | No DB access. Static response. Exists to communicate RunPack-first mode to callers |
| POST | `/api/analysis` | Stores an AI analysis result for a claim (results supplied by caller, not generated here) | Public (requires `x-humanx-user`) | `analysis_results`, `users` (uncertain — verify in module) | Delegates to `analysis-results.js`. No server-side AI call. Caller supplies the analysis payload |

### RunPack / Export

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/runpack` | Builds and stores a RunPack task packet for a claim | Public (no user header required) | `aip_packets`, `claims`, `evidence`, `pressure_points`, `home_tests`, `analysis_results` | No rate limit. No auth required. D-38: returns `CLAIM_NOT_FOUND` if claim `reviewState` is not `'public'` — prevents RunPack export of non-public claims |
| POST | `/api/aip` | Alias for `/api/runpack` — same handler, same behaviour | Public (no user header required) | Same as `/api/runpack` | Legacy route name. Both routes call `createAipPacket`. Same D-38 `review_state` guard applies |

### Admin / Seed (Import)

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/import-seed` | Imports seed claim data via `importer.js` | Admin only (`x-humanx-admin`) | `claims`, `evidence`, `pressure_points`, `home_tests`, `users` | D-59: defaults to `?mode=dry-run` (no writes). Pass `?mode=apply` to commit. Claims and evidence inserted as `review_state='review'`. SOURCE_NEEDED guard blocks apply if any `source_url` is empty or contains placeholder. Returns structured import report |
| GET | `/api/import-truths` | Imports seed truth data via `truth-seed.js` | Admin only (`x-humanx-admin`) | `truths`, `users` | D-59: defaults to `?mode=dry-run` (no writes). Pass `?mode=apply` to commit. Truths inserted as `review_state='review'`. Returns structured import report |

### Graph

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/graph-status` | Returns graph/relationship status | Public | Uncertain — delegates to `graph-status.js` | Read-only. Behaviour uncertain from this file alone |

---

## 4. Public Write Endpoints

These endpoints accept POST requests from any user with a valid `x-humanx-user` header.
Any change to their response shape will break `public/app-v10.js`.

| Path | Creates / mutates |
|---|---|
| `POST /api/session` | `users` |
| `POST /api/claims` | `claims`, optionally `evidence` |
| `POST /api/evidence` | `evidence` |
| `POST /api/evidence-attach` | `evidence_claim_links` |
| `POST /api/truths` | `truths` |
| `POST /api/truth-to-claim` | `claims`, `truth_claim_links` |
| `POST /api/pressure` | `pressure_points` |
| `POST /api/tests` | `home_tests` |
| `POST /api/report` | `reports`, may update `claims` |
| `POST /api/analysis` | `analysis_results` |
| `POST /api/belief-snapshots` | `belief_snapshots` |
| `POST /api/belief-promote` | `belief_snapshots`, downstream tables |
| `POST /api/runpack` | `aip_packets` (no auth required) |
| `POST /api/aip` | `aip_packets` (no auth required, alias) |

---

## 5. Admin / Review Endpoints

These endpoints require the `x-humanx-admin` header to match `env.HUMANX_ADMIN_TOKEN`.
Requests without a valid token receive HTTP 403.

| Path | Action |
|---|---|
| `GET /api/review` | View moderation queue |
| `POST /api/review/decision` | Approve / reject / re-queue a claim or truth |
| `POST /api/review/cleanup` | Archive a rejected smoke/test artefact |
| `POST /api/review/mark-duplicate` | Mark a claim as a duplicate of another claim |
| `POST /api/review/resolve-similar` | Clear the near-duplicate advisory on a claim |
| `GET /api/import-seed` | Seed claims from importer |
| `GET /api/import-truths` | Seed truths from truth-seed module |

---

## 6. High-Risk Endpoint Notes

| Endpoint | Risk |
|---|---|
| `POST /api/claims` | Duplicate detection uses `normalized_claim` unique index. Race condition handled but review carefully before schema or index changes |
| `POST /api/review/decision` | Mutates `review_state` on claims and truths. Also closes open reports. No undo — decisions must be re-issued to reverse |
| `POST /api/review/mark-duplicate` | Writes `duplicate_of` and sets `review_state='duplicate'`. Source claim is preserved but removed from queue and public list. Both claim IDs must be validated before the UPDATE. Self-duplicate rejected. Cannot mark already-archived or already-duplicate claims |
| `POST /api/review/resolve-similar` | Clears `near_duplicate_of` (sets to NULL). Non-destructive. Returns `previous_near_duplicate_of` for audit. Guard: returns error if advisory is not set |
| `POST /api/truth-to-claim` | Writes to two tables (`claims` + `truth_claim_links`). Partial failure behaviour depends on `truth-claim-bridge.js` |
| `POST /api/belief-promote` | Promotes snapshot data across systems. Side effects depend on `belief-bridge.js` |
| `GET /api/debug` | Exposes full table row counts and recent claim data with no authentication. Should not be public in production |
| `POST /api/runpack` / `POST /api/aip` | No authentication and no rate limit. Any caller can trigger a full claim detail read and DB write |
| Rate limiting (all write endpoints) | Uses a fail-closed pattern: if the rate-limit table is unavailable, requests are blocked with HTTP 503 (`RATE_LIMIT_UNAVAILABLE`). This is intentional. Do not remove |

---

## 7. Maintenance Rule

- When a route is **added** to `src/worker.js`, add a row to the table in section 3 and update sections 4–6 as needed.
- When a route is **removed**, strike it from the table and note the version or PR.
- When a route's **response shape changes**, update the risk notes and confirm `public/app-v10.js` compatibility.
- When a module delegate (e.g. `truths.js`, `belief-bridge.js`) changes its D1 queries, update the "D1 tables touched" column.
- Do not use this file to propose new endpoints — use `docs/WORKER_MODULAR_SPLIT_PLAN.md` for structural planning.
