-- HumanX home_tests schema correction
-- Purpose: add the missing updated_at column to the home_tests table.
--
-- Root cause:
--   Databases whose home_tests table was created before migrations 0002 and 0003
--   were finalised do not have updated_at. Because both 0002 and 0003 use
--   CREATE TABLE IF NOT EXISTS, the column was never added to those databases
--   when those migrations were applied — the table already existed and the
--   CREATE TABLE statement was silently skipped.
--
--   The addHomeTest backend INSERT explicitly writes updated_at and therefore
--   fails on affected databases with:
--     D1_ERROR: table home_tests has no column named updated_at
--
-- Safety notes:
--   - Only run this migration on databases where home_tests is missing updated_at.
--   - If your database was created fresh from migrations 0002 or 0003 and already
--     has updated_at, this migration will fail with "duplicate column name". That
--     failure is safe — it means the column is already present and no action is
--     needed.
--   - SQLite does not support ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
--   - The UPDATE backfill is safe: it runs after the column is added (NULL for
--     all existing rows) and sets updated_at from created_at where available,
--     falling back to the current epoch in milliseconds.
--   - unixepoch() is available in SQLite 3.38+ (D1 uses SQLite 3.44+).

ALTER TABLE home_tests ADD COLUMN updated_at INTEGER;

UPDATE home_tests
SET updated_at = COALESCE(created_at, unixepoch() * 1000)
WHERE updated_at IS NULL;
