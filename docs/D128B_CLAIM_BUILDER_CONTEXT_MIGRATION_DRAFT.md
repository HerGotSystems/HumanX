# D-128B Claim Builder Context Migration Draft

**Date:** 2026-06-14
**Branch:** `fix/d128b-builder-context-migration-draft`
**Basis:** D-128 Structured Builder Persistence Design (PR #179, merged).

---

## ⚠ Draft Only — Not Applied

> **This migration file exists as a draft. It has NOT been executed against production D1.**
> **No `wrangler d1 execute` command was run.**
> **No live schema change has occurred.**
> **Do not apply this migration without explicit owner approval.**

---

## Purpose

D-127B packed Claim Builder intake context into `initialEvidence` as plain text. D-128 designed a dedicated `claim_builder_contexts` table to replace that bridge. D-128B prepares the SQL migration file so it is ready to apply when the owner approves the schema change.

---

## Files Changed

| File | Change |
|---|---|
| `migrations/0006_claim_builder_contexts.sql` | Draft migration — `CREATE TABLE IF NOT EXISTS claim_builder_contexts` + 3 indexes |
| `docs/D128B_CLAIM_BUILDER_CONTEXT_MIGRATION_DRAFT.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: `src/worker.js`, `src/truths.js`, `public/app-v10.js`, `public/styles.css`, any existing migration, D1 production schema, frontend, backend, or deploy.

---

## Migration Contents

### Table: `claim_builder_contexts`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID for the context record |
| `target_type` | TEXT NOT NULL | `'claim'` or `'truth'` — which entity this context belongs to |
| `target_id` | TEXT NOT NULL | Foreign key to `claims.id` or `truths.id` |
| `user_id` | TEXT | Pseudonymous user identifier (nullable) |
| `route` | TEXT NOT NULL | `'claim'` or `'truth'` — builder route taken |
| `version` | TEXT NOT NULL | Schema version for forward compatibility, default `'1.0'` |
| `raw_text` | TEXT NOT NULL | Step 1 raw user thought (`_bs.raw`) |
| `why_user_thinks_this` | TEXT | Step 1 why field (`_bs.why`) |
| `scope` | TEXT | Step 1/2 scope field (`_bs.scope`) |
| `pressure_or_falsifier` | TEXT | Step 1/2 falsifier field (`_bs.falsifier`) |
| `draft_claim` | TEXT | Step 2 edited draft (`_bs.draft`) |
| `final_claim` | TEXT | Step 3 final submitted claim text |
| `category` | TEXT | Builder category selection (`_bs.category`) |
| `claim_type` | TEXT | Builder type selection (`_bs.type`) |
| `system_flags_json` | TEXT | JSON-serialised flag array from `claimBuilderFlags()` |
| `created_at` | INTEGER NOT NULL | Unix timestamp ms |
| `updated_at` | INTEGER NOT NULL | Unix timestamp ms |

### Indexes

| Index | On | Purpose |
|---|---|---|
| `idx_claim_builder_contexts_target` | `(target_type, target_id)` | Look up context for a specific claim/truth in Review |
| `idx_claim_builder_contexts_user` | `(user_id, created_at)` | User history queries |
| `idx_claim_builder_contexts_route` | `(route, created_at)` | Route analytics |

---

## Relationship to D-127B / D-127D

- **D-127B** packs builder context as plain text into `initialEvidence`. This is the current live bridge.
- **D-127D** parses that plain text in `parseClaimBuilderContext()` for display in Review. This parser remains as a **legacy fallback** for items submitted before the structured table is live.
- **D-128B** (this task) prepares the schema. No write path exists yet.

---

## Intended Future Sequence

| Task | Scope |
|---|---|
| **D-128C** | Worker write-path — `submitBuilderClaim()` and `submitBuilderTruth()` insert a row into `claim_builder_contexts` after the primary record is created. Requires explicit D1 approval before applying migration. |
| **D-128D** | Review API read-path — `GET /api/review` response includes joined builder context for claim/truth items. `renderReviewInspectPanel()` prefers structured data over D-127D plain-text parse. |
| **D-128E** | Frontend structured payload — builder functions post `builder_context` JSON field alongside claim/truth payload, retiring the `initialEvidence` plain-text bridge. |

D-128C cannot start until the owner explicitly approves applying migration `0006` to production D1.

---

## Applying the Migration (owner step — not done yet)

When the owner approves:

```sh
wrangler d1 execute humanx --file=migrations/0006_claim_builder_contexts.sql
```

Verify with:

```sh
wrangler d1 execute humanx --command="SELECT name FROM sqlite_master WHERE type='table' AND name='claim_builder_contexts';"
```

---

## Recommended Next Task

**D-128C** — Worker write-path implementation. Requires explicit owner approval to apply migration `0006` to production D1 before any backend code changes.
