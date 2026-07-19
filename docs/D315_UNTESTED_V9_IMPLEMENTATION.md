# D-315 — UNTESTED v9 implementation

**Branch:** `feature/untested-v9`  
**Base:** `ed85a0d` (D-314A)  
**Status:** code complete on branch; migrations not applied; not deployed; no live writes run.

## Placement decision

UNTESTED lives in the existing HumanX repository because HumanX already hosts standalone instruments under `public/apps/` and uses one Worker/D1 deployment. It remains isolated from the main `app-v10.js` UI:

- UI: `public/apps/untested/index.html`
- API module: `src/untested.js`
- routing wrapper: `src/worker-entry.js`
- tables: dedicated `untested_*` namespace in the existing `humanx` D1

`wrangler.toml` points to the wrapper. The wrapper intercepts only `/api/untested/*`; all other requests delegate to the unchanged `src/worker.js` default export.

## API

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/untested/instrument` | Return one sealed versioned instrument bundle | Public read |
| POST | `/api/untested/session` | Create an anonymous instrument session | Public write |
| POST | `/api/untested/response` | Upsert one mild/pressure response for a session | Public write |
| GET | `/api/untested/results?session_id=...` | Return within-scenario movements | Public read by unguessable session id |
| POST | `/api/untested/admin/bootstrap` | Author and seal `untested-v1` from the committed definition | Admin token required |

No endpoint claims to measure actual behaviour. No cross-scenario consistency score is produced. No user id, account, cookie, fingerprint, IP, email, or persistent visitor hash is stored.

## Required application order

Do not run these against production without explicit approval.

1. Apply `migrations/0010_untested_schema.sql` locally.
2. Apply `migrations/0011_untested_triggers.sql` locally.
3. Run trigger smoke tests: draft insert/update/delete increments `draft_revision`; sealed insert/update/delete fails; unsealed session creation fails; sealed+hashed session creation succeeds.
4. Run `node scripts/untested-static-check.mjs` and confirm the deterministic hash fixture passes twice.
5. Repeat migration and trigger smoke tests against a disposable remote D1 or explicitly approved remote test database.
6. Call admin bootstrap once. It performs one D1 `batch()` snapshot read, validates the complete definition, computes SHA-256, and conditionally seals against the returned `draft_revision`.
7. Only after those checks should the Worker/static assets be deployed.

## Public-write risk

`/api/untested/session` and `/api/untested/response` are intentionally anonymous. Structural abuse is limited by foreign keys, checks, and the unique `(session_id, scenario_id, variant)` constraint, but session-row creation is not yet rate-limited. This must be reviewed before public launch; it is not hidden as a solved problem.

## Non-actions

- No production migration was applied.
- No local or remote Wrangler command was run.
- No live write smoke test was run.
- No deployment was performed.
- No pull request was created.
