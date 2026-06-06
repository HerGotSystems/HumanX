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
| GET | `/api/seed` | Seeds demo claims if `claims` table is empty | Internal-ish | `claims`, `users` | Runs INSERT OR IGNORE; safe to call on empty DB only. Returns early if data already exists |

### Session / User

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/session` | Creates or retrieves a pseudonymous user by ID | Public | `users` | No authentication. ID is caller-supplied or auto-generated. Fingerprint hash stored but not validated |

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
| GET | `/api/import-seed` | Imports seed claim data via `importer.js` | Admin only (`x-humanx-admin`) | Uncertain — delegates to `importer.js` | Mutates DB. Behaviour and idempotency depend on `importer.js` |
| GET | `/api/import-truths` | Imports seed truth data via `truth-seed.js` | Admin only (`x-humanx-admin`) | Uncertain — delegates to `truth-seed.js` | Mutates DB. Behaviour and idempotency depend on `truth-seed.js` |

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
