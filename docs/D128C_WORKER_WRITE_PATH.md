# D-128C Worker Builder Context Write Path

**Date:** 2026-06-14
**Branch:** `fix/d128c-worker-builder-context-write-path`
**Basis:** D-128B migration draft merged; `claim_builder_contexts` table verified live in production D1 (D-128G tracker issue #185).

---

## Scope

Worker write path only. No frontend payload change. No Review API change. No Review UI change. No public display change. No D1 schema change. No deploy.

---

## Files Changed

| File | Change |
|---|---|
| `src/claim-builder-contexts.js` | New helper module: `cleanClaimBuilderContext()` and `insertClaimBuilderContext()` |
| `src/worker.js` | Import helper; `createClaim()` writes optional builder context |
| `src/truths.js` | Import helper; `createTruth()` and `repeatExistingTruth()` write optional builder context |
| `docs/D128C_WORKER_WRITE_PATH.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: `public/app-v10.js`, `public/styles.css`, migrations, any existing D1 table or index, Review/public API response shapes, RunPack flow.

---

## Migration Status at Time of Implementation

- `claim_builder_contexts` table: **exists in production D1**
- Indexes: `idx_claim_builder_contexts_target`, `idx_claim_builder_contexts_user`, `idx_claim_builder_contexts_route` — all confirmed present
- `d1_migrations` reconciled through all current files
- Source: D-128G tracker issue #185

---

## `src/claim-builder-contexts.js`

### `cleanClaimBuilderContext(raw)`

- Returns `null` if `raw` is absent or not an object.
- Validates `route` — must be `'claim'` or `'truth'`; returns `null` otherwise.
- Requires `rawText` / `raw_text` after cleaning; returns `null` if empty.
- Clips all text fields to conservative maximums:
  - `raw_text`: 2000
  - `why_user_thinks_this`: 2000
  - `scope`: 1000
  - `pressure_or_falsifier`: 1500
  - `draft_claim`: 1000
  - `final_claim`: 1000
  - `category`: 80
  - `claim_type`: 80
- Accepts both camelCase (`whyUserThinkThis`, `pressureOrFalsifier`, `draftClaim`, `finalClaim`, `claimType`, `systemFlags`) and snake_case variants.
- Serialises `systemFlags`/`system_flags` array to JSON; defaults to `'[]'` on serialisation error.
- Nullable optional fields are stored as `null` rather than empty string.

### `insertClaimBuilderContext(env, makeId, { targetType, targetId, userId, context })`

- Inserts one row with `id = makeId('cbc')`, `version = '1.0'`, timestamps `created_at` / `updated_at` = `Date.now()`.
- Throws on DB error (caller decides how to handle).

---

## `/api/claims` POST — Claim route

In `createClaim()`:

1. Existing claim creation behaviour is **unchanged**. All validation, deduplication, rate-limiting, and `initialEvidence` handling are identical.
2. After a **new** claim is successfully inserted, if `body.claim_builder` is present:
   - `cleanClaimBuilderContext(body.claim_builder)` is called.
   - If non-null, `insertClaimBuilderContext()` inserts a row with `target_type='claim'`, `target_id=claimId`.
   - If context insert fails, a `SERVER_ERROR` is thrown. This is intentional for the first implementation — the call is non-idempotent and a silent swallow could hide issues. Callers still have the `initialEvidence` sentinel as a fallback in Review if the error is caught upstream.
3. **Duplicate/existing claim path** (`existing` detected before insert): builder context is **not** written. The existing claim already has its own intake history. The response remains backward-compatible (`{ ok:true, existing:true, claim:... }`).
4. Non-builder submissions (no `body.claim_builder`) are completely unaffected.

---

## `/api/truths` POST — Truth route

In `createTruth()`:

1. All existing validation, rate-limiting, and response shapes are **unchanged**.
2. **New truth path**: after successful insert, if `body.claim_builder` is present:
   - `cleanClaimBuilderContext()` is called; if non-null, context row inserted with `target_type='truth'`, `target_id=id`.
   - If context insert fails, `SERVER_ERROR` is thrown (same rationale as claim route).
3. **Repeated truth path** (`repeatExistingTruth()`): builder context is **also written** for repeated assertions. Repeated submissions are useful intake history — each occurrence records independent user intent. Context insert failure is non-fatal here (swallowed) to avoid disrupting the repetition count update.
4. Race condition path (unique constraint on insert): falls back to `repeatExistingTruth()` with builder context forwarded.
5. Non-builder submissions are completely unaffected.

---

## Legacy Fallback

The D-127B `initialEvidence` plain-text sentinel and the D-127D `parseClaimBuilderContext()` parser in `app-v10.js` are **not touched**. Existing items submitted before D-128C remain visible in the Review inspect panel via the plain-text fallback.

---

## What Is NOT Done Yet

| Item | Task |
|---|---|
| Frontend sends `claim_builder` field | D-128E |
| Review API includes `claimBuilderContext` in response | D-128D |
| Review UI prefers structured data over plain-text parse | D-128F |
| Deploy | Pending owner authorisation |

---

## Checks

```
node --check src/worker.js                    →  syntax OK (exit 0)
node --check src/truths.js                    →  syntax OK (exit 0)
node --check src/claim-builder-contexts.js    →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```

---

## Deploy Note

**Deploy required** (worker code changed). No D1 schema changes — `claim_builder_contexts` is already live. A standard `wrangler deploy` after this PR merges is sufficient.

---

## Recommended Next Tasks

- **D-128D** — Review API read path: join `claim_builder_contexts` into the review queue response so the frontend can use structured data.
- **D-128E** — Frontend structured payload: `submitBuilderClaim()` and `submitBuilderTruth()` send `claim_builder` JSON field.
- **D-128F** — Review UI structured fallback: prefer `item.claimBuilderContext` over `parseClaimBuilderContext(item.initialEvidence)`.
