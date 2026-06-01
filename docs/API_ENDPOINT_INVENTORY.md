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
| GET | `/api/claims/:id` | Returns full claim detail including evidence, pressure, tests, analyses, and truth lineage | Public | `claims`, `users`, `evidence`, `evidence_claim_links`, `pressure_points`, `home_tests`, `analysis_results`, `truth_claim_links`, `truths` | Aggregates many tables. No `review_state` gate on direct fetch — returns any claim by ID |

### Evidence

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/evidence` | Adds direct evidence to a claim | Public (requires `x-humanx-user`) | `evidence`, `users`, `rate_limits`, `claims` | Rate-limited (20/hr per IP). Recalculates claim score after insert |
| POST | `/api/evidence-attach` | Reuses existing evidence and links it to a different claim | Public (requires `x-humanx-user`) | `evidence_claim_links`, `evidence`, `users`, `rate_limits` | Delegates to `evidence-reuse.js`. Rate limiting applied inside helper (uncertain — verify in module) |
| GET | `/api/evidence-vault` | Lists evidence items from the vault | Public | `evidence` (uncertain — verify in module) | Delegates to `evidence-vault.js`. Exact query and filters uncertain from this file alone |

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
| GET | `/api/review` | Returns review queue: claims not in `public` state, or with reports; plus truths not in `public` state | Admin only (`x-humanx-admin`) | `claims`, `truths` | Returns up to 100 claims + 100 truths. Leaks non-public content — admin token is the only gate |
| POST | `/api/review/decision` | Approves, rejects, or re-queues a claim or truth by ID | Admin only (`x-humanx-admin`) | `claims` or `truths`, `reports` | Mutates `review_state` on claims or truths. Also closes or rejects related open reports. Irreversible without a new decision call |
| POST | `/api/report` | Submits a report against a claim or other target | Public (requires `x-humanx-user`) | `reports`, `claims`, `users`, `rate_limits` | Rate-limited (20/hr per IP). Auto-escalates claim to `review_state='review'` when report count reaches 2 |

### AI / Analysis

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| GET | `/api/ai/analyse` | Intentionally disabled. Returns `RUNPACK_MODE` / `AIP_MODE` error with HTTP 402 | Public | None | No DB access. Static response. Exists to communicate RunPack-first mode to callers |
| POST | `/api/analysis` | Stores an AI analysis result for a claim (results supplied by caller, not generated here) | Public (requires `x-humanx-user`) | `analysis_results`, `users` (uncertain — verify in module) | Delegates to `analysis-results.js`. No server-side AI call. Caller supplies the analysis payload |

### RunPack / Export

| Method | Path | Purpose | Visibility | D1 tables touched | Risk notes |
|---|---|---|---|---|---|
| POST | `/api/runpack` | Builds and stores a RunPack task packet for a claim | Public (no user header required) | `aip_packets`, `claims`, `evidence`, `pressure_points`, `home_tests`, `analysis_results` | No rate limit. No auth required. Packet stored in `aip_packets`. Response includes full claim detail |
| POST | `/api/aip` | Alias for `/api/runpack` — same handler, same behaviour | Public (no user header required) | Same as `/api/runpack` | Legacy route name. Both routes call `createAipPacket` |

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
| `GET /api/import-seed` | Seed claims from importer |
| `GET /api/import-truths` | Seed truths from truth-seed module |

---

## 6. High-Risk Endpoint Notes

| Endpoint | Risk |
|---|---|
| `POST /api/claims` | Duplicate detection uses `normalized_claim` unique index. Race condition handled but review carefully before schema or index changes |
| `POST /api/review/decision` | Mutates `review_state` on claims and truths. Also closes open reports. No undo — decisions must be re-issued to reverse |
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
