# D-104H — Worker Source URL Validation: Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `14c1233` — Merge pull request #124 from HerGotSystems/fix/d104f-worker-source-url-validation |
| **Feature commit** | `172f025` — D-104F validate evidence source URLs in Worker |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `0bb54517-ea0d-4c46-9198-eb131a31fb46` |
| **Wrangler version** | 4.100.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 15 files from `public/` |
| **Assets uploaded** | None — no updated asset files (this was a Worker-code change, not a static-asset change) |
| **D1 binding** | Present in wrangler.toml — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

> Note: unlike D-104B (a frontend/asset change), D-104F is a **Worker code** change — the new behavior ships in the Worker bundle (version `0bb54517`), and no public asset hash changed.

---

## Deployed Feature (D-104F)

**Worker-side evidence source URL validation — defense-in-depth complement to D-104B.**

| Change | Description |
|---|---|
| `httpUrlOrNull(url)` helper | `cleanText(url,500)` → `new URL()` in try/catch → returns the URL only for `http:`/`https:`, else `null` |
| `/api/evidence` write path | `body.sourceUrl` now routed through `httpUrlOrNull` before `insertEvidence` |
| Coerce-to-null | Invalid/non-web/malformed source values stored as `null`; the evidence still attaches |
| Pressure route | Unchanged — no `source_url` write path |
| Importer | Unchanged — owner-controlled, separate SOURCE_NEEDED guard |

No schema change. No D1 migration. No cleanup of existing rows. No moderation logic changed. No verification/trust wording.

---

## Live Verification

Confirmed by user after deploy:

| Expected live backend behavior | Observed |
|---|---|
| `POST /api/evidence` routes `body.sourceUrl` through `httpUrlOrNull` | ✅ confirmed |
| `httpUrlOrNull` applies `cleanText(url,500)` | ✅ confirmed |
| Parses with `new URL()` in try/catch | ✅ confirmed |
| Allows only `http:` / `https:` | ✅ confirmed |
| `javascript:`/`data:`/`vbscript:`/`blob:`/`file:`/protocol-relative/scheme-less/malformed/empty → null | ✅ confirmed |
| Invalid optional source coerced to null before storage | ✅ confirmed |
| Evidence submission preserved when source invalid | ✅ confirmed |
| Pressure route unchanged (no source_url write) | ✅ confirmed |
| Existing rows not cleaned/migrated | ✅ confirmed |
| No source verification/trust wording added | ✅ confirmed |

---

## Defense-in-Depth Status (both layers now live)

| Layer | Deploy | Behavior |
|---|---|---|
| Frontend render (D-104B) | Worker `eb055ee3` | `sourceLink` never emits a non-http(s) `href`; protects all display incl. existing rows |
| Backend storage (D-104F) | Worker `0bb54517` | `/api/evidence` coerces non-http(s) source URLs to null before D1 insert |

New unsafe values can no longer enter `evidence.source_url`, and any pre-existing unsafe rows remain safe to display. Future non-`sourceLink` consumers (exports, RunPack, AI ingestion) now receive clean stored data.

---

## Safety Confirmation (this record task)

| Safety check | Status |
|---|---|
| No D1 migration run | ✅ confirmed |
| No database mutation during this record task | ✅ confirmed |
| No cleanup of existing rows | ✅ confirmed |
| No admin token used | ✅ confirmed |
| No admin/moderation action during this record task | ✅ confirmed |
| No schema change | ✅ confirmed |
| No backend/Worker code change in this task | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `14c1233`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **357 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **48 passed, 0 failed (48 hard checks)** |

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. This rule is unchanged by D-104F/H and applies to every future task.

---

## Optional Future Follow-up (not scheduled)

A **read-only** D1 audit for any pre-existing `evidence.source_url` rows with non-http(s) schemes could quantify legacy exposure. Any remediation would be exact-ID, via the normal review/edit path — never bulk, never a migration. Not required (display is already safe via D-104B); noted only for completeness.
