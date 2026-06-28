# D-201C — Source Taxonomy Migration Preflight

**Date:** 2026-06-28
**HEAD at creation:** `b8a2c98`
**Migration file:** `migrations/0015_evidence_source_taxonomy.sql`
**Status:** READY TO PREFLIGHT — NOT YET APPLIED

---

## Why This Migration Is Additive

`migrations/0015_evidence_source_taxonomy.sql` adds two nullable columns to the `evidence` table:

- `source_type TEXT` — what kind of source the evidence comes from
- `evidence_strength TEXT` — submitter's self-assessed weight of the item

It does **not**:
- Rewrite any existing rows
- Touch the existing `quality` column (legacy, kept as-is)
- Add `NOT NULL` constraints (legacy rows remain valid with `NULL` in both columns)
- Add `CHECK` constraints (enum validation is enforced in server code, not the DB)
- Drop or modify any existing column

Rollback note at the bottom.

---

## Step 1 — Preflight: Confirm Columns Are Absent

Run this before applying. Confirms neither column exists yet.

```powershell
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(evidence);"
```

**Expected output:** a table listing columns of `evidence`. Scan the `name` column.

Columns that must **NOT** appear yet:
- `source_type`
- `evidence_strength`

If either column already appears — stop. The migration may have been partially applied or applied out of order. Investigate before proceeding.

If `quality` does **not** appear — stop. The schema is not in the expected baseline state.

---

## Step 2 — Apply

⚠️ **DO NOT RUN THIS YET.**

This command is documented here for completeness. Apply only after:
- Preflight passes (Step 1 confirms columns absent)
- Server-side enum validation is implemented in `src/worker.js` (D-201E)
- Frontend UI fields are implemented in `public/index.html` and `public/app-v10.js` (D-201F)
- Smoke tests pass at 1589/0

When those conditions are met, apply with:

```powershell
npx wrangler d1 migrations apply humanx --remote
```

Wrangler will detect that `0015_evidence_source_taxonomy.sql` has not been applied and run it. Confirm the output shows the migration applied successfully.

---

## Step 3 — Post-Apply Validation

Run immediately after applying to confirm both columns now exist.

```powershell
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(evidence);"
```

**Expected:** `source_type` and `evidence_strength` now appear in the column list with `type = "TEXT"` and `notnull = 0`.

Spot-check that existing rows are unaffected:

```powershell
npx wrangler d1 execute humanx --remote --command "SELECT id, quality, source_type, evidence_strength FROM evidence LIMIT 5;"
```

Expected: `quality` has existing values, `source_type` and `evidence_strength` are `null` for all legacy rows.

---

## Rollback Note

D1 (SQLite) does not support `ALTER TABLE DROP COLUMN` in the version used by Cloudflare Workers at time of writing. There is no schema rollback command.

If the migration must be reversed:
- The columns remain in the schema but are ignored by application code
- Remove any server-side reads/writes of `source_type` and `evidence_strength` in `src/worker.js`
- Remove any frontend references in `public/app-v10.js` and `public/index.html`
- The columns are harmless if present but unused — they store `NULL` for all rows

This is the standard pattern for additive D1 migrations. Plan migrations carefully before applying; rollback is code-level, not schema-level.

---

## Migration Number Note

The task spec referenced `0013_evidence_source_taxonomy.sql`. However, `migrations/0013_public_profile_foundation.sql` already exists. This migration was created as `0015_evidence_source_taxonomy.sql` to follow the current highest number (`0014_owner_token_telemetry.sql`) and avoid a naming collision.
