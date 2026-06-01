# Add Test Fix — Live Verification Result

## 1. Purpose

This file records the completed repair of the Add Test feature and confirms its live verification in production. It serves as a reference for what broke, why it broke, how it was fixed, and what was confirmed working.

---

## 2. Original Failure

Add Test failed on both desktop and phone. The UI showed a generic "Request failed" error with no detail exposed to the user.

After the `worker.js` dispatch was corrected to properly `await` the `addHomeTest` call, the real backend error surfaced:

```
D1_ERROR: table home_tests has no column named updated_at: SQLITE_ERROR
```

This made the root cause diagnosable.

---

## 3. Root Cause

The production D1 `home_tests` table was created before the schema included an `updated_at` column.

Cloudflare D1 migrations that use `CREATE TABLE IF NOT EXISTS` do not alter an existing table — they silently skip creation when the table already exists. As a result, the `updated_at` column was never added to the live table.

The backend `INSERT` statement expected `updated_at` to be present. Because the production table did not have it, every Add Test request failed at the database layer.

---

## 4. Fix Path

The following changes were made to resolve the issue:

- **Frontend validation** was improved to catch and reject empty test titles and instructions that are too short before the request is sent.
- **`src/worker.js`** — the Add Test dispatch was corrected to `await addHomeTest(...)`, allowing backend errors to propagate correctly rather than silently failing.
- **`migrations/0005_add_home_tests_updated_at.sql`** — a new migration was added to `ALTER TABLE home_tests ADD COLUMN updated_at TEXT`.
- **Migration applied manually** — the SQL from `0005` was executed directly through the Cloudflare D1 console to update the live production table without re-running earlier migrations.
- Migration `0004` was not rerun.

---

## 5. Live Verification Result

- [x] Add Test submitted successfully
- [x] Test title `Sniff` saved to production
- [x] Instructions `Sniff Butt` saved to production
- [x] Test appears in the Study Claim **Tests** section
- [x] Test appears in the Claim Flow under **3 · How to test it**
- [x] Empty title validation works — request is blocked before submission
- [x] Short instructions validation works — request is blocked before submission
- [x] Desktop and phone paths were checked during investigation

User confirmation: *"Sniff Butt works, is there."*

---

## 6. Smoke-Test Artefact Note

`Sniff / Sniff Butt` is a harmless, visible smoke-test artefact left in production as a result of live verification.

- It can remain as a known test marker with no functional impact.
- It can be removed later through the normal UI or admin process if desired.
- Do not use D1 console or Wrangler to delete it unless explicitly requested.

---

## 7. What This Proves

- The `/api/tests` write path works correctly after the schema fix.
- `home_tests.updated_at` is now present on the production D1 table.
- Frontend validation prevents obvious bad requests from reaching the backend.
- The Study view refresh and display path correctly renders saved tests.
- The Claim Flow reflects tests that have been saved to the database.

---

## 8. What This Does Not Prove

- Does not prove all public write endpoints are working.
- Does not prove duplicate or race-condition handling for test submissions.
- Does not prove admin cleanup or deletion flows.
- Does not prove the Belief Engine bridge or any downstream consumers of test data.
- Does not replace a full read/write smoke test suite.

---

## 9. Maintenance Rule

If Add Test is repaired or schema-tested again in the future, create a new dated result file (e.g. `ADD_TEST_FIX_RESULT_2026-07-01.md`) rather than editing this one. This file reflects a specific point-in-time verification.
