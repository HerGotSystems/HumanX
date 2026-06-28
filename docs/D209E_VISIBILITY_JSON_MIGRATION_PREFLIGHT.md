# D-209E — visibility_json Migration Preflight

**Date:** 2026-06-28
**Migration file:** `migrations/0016_belief_visibility_json.sql`
**Status:** PENDING OWNER ACTION — do not deploy D-209E code before migration is applied

---

## What this migration does

Adds a single nullable TEXT column `visibility_json` to the `belief_snapshots` table.

```sql
ALTER TABLE belief_snapshots ADD COLUMN visibility_json TEXT;
```

- Additive only — no DROP, no UPDATE, no NOT NULL, no CHECK constraint.
- Existing rows get `NULL` for the new column — this is the correct safe default (all sensitive field groups private).
- No data is rewritten or deleted.
- Rollback path: code-level ignore (D1 cannot drop columns once added).

---

## Deploy ordering warning

**Do not deploy the D-209E Worker code before applying this migration.**

The updated `getPublicProfile` SELECT now includes `visibility_json`. If the column does not exist when the Worker runs:

- D1 returns an error on the SELECT.
- The public profile endpoint fails for any user who has a shared snapshot.

The backend code uses `void _visibility` to hold the parsed result without exposing new fields, so behavior is identical to pre-D-209E after the column exists. But the SELECT will error without the column.

**Apply migration first. Then deploy.**

---

## Preflight — verify column does not yet exist

Run in owner terminal before applying:

```powershell
cd C:\Users\veltr\HumanX
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(belief_snapshots);"
```

**Expected output:** A list of columns. `visibility_json` should **not** appear in the list.

If `visibility_json` already appears, the migration has already been applied — skip to the validate step.

---

## Apply migration

```powershell
npx wrangler d1 migrations apply humanx --remote
```

Wrangler will detect `0016_belief_visibility_json.sql` as the next unapplied migration and run it.

If prompted to confirm, type `y` and press Enter.

---

## Validate — confirm column now exists

```powershell
npx wrangler d1 execute humanx --remote --command "PRAGMA table_info(belief_snapshots);"
```

**Expected output:** The column list now includes an entry for `visibility_json` with type `TEXT`.

**Expected for existing rows:**

```powershell
npx wrangler d1 execute humanx --remote --command "SELECT id, label, visibility_json FROM belief_snapshots LIMIT 5;"
```

All existing rows should have `visibility_json = null`. This is correct — null means all sensitive field groups are private by default.

---

## After migration: deploy Worker

Once the column exists, deploy the D-209E Worker code:

```powershell
npx wrangler deploy
```

**Live sanity after deploy:**

1. Open a public profile with a shared snapshot.
2. Confirm the snapshot card still shows only: label, tension count, date, guardrail copy.
3. Confirm no new fields appear (no pattern label, no scores, no alignment labels).
4. Confirm no console errors.

---

## Rollback

D1 does not support `DROP COLUMN`. If rollback is needed:

1. Revert the Worker code to the pre-D-209E version (remove the `visibility_json` from the SELECT and remove `parseBeliefVisibility` / `beliefVisibilityAllows`).
2. Deploy the reverted code.
3. The `visibility_json` column remains in the DB but is ignored by the Worker.
4. No data is lost.

---

## What this does NOT change

- No new public belief fields are exposed. Public behavior is identical to pre-D-209E.
- `dominant_pattern`, `top_beliefs_json`, `topAlignmentName` remain absent from the public API response.
- Private endpoints (`/api/my-humanx`, `/api/belief-snapshots`) are unchanged.
- No frontend UI changes — consent toggles come in D-209G.
- No existing data is altered.
