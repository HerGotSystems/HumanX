# D-10: Near-Duplicate Claim Suggestions — Plan

Created: 2026-06-04. Split into D-10A (migration prep) and D-10B (implementation).

---

## 1. Current duplicate infrastructure state

| Symbol / Column | Location | Status |
|---|---|---|
| `meaningKey(text)` | `src/meaning-key.js` | **Active** — called in `createClaim()` to compute `normalized_claim` before exact-match lookup |
| `meaningMatch(a, b)` | `src/meaning-key.js` | **Defined, never called** — 80%-word-overlap logic exists; nothing invokes it |
| `normalized_claim TEXT` | `claims` table | **Active** — populated on every insert; unique index enforced by migration 0004 |
| `UNIQUE INDEX idx_claims_normalized_claim_unique` | migration 0004 (applied to prod) | **Active** — prevents exact-key duplicates at DB level; do not rerun |
| `duplicate_of TEXT` | `claims` table | **Defined, never written** — frontend reads it in `renderReviewInspectPanel` and `renderReviewAuditSummary`; always null in live data |
| `duplicate_signatures` table | migration 0003 (applied to prod) | **Exists, empty, unused** — no worker logic reads or writes it; only `debugState` counts rows |
| `duplicate_signature TEXT` | `evidence` table | **Defined, never written** — possibly intended for evidence deduplication; unrelated to claim near-duplicate detection |
| `review_state = 'duplicate'` | `claims.review_state` | **Not implemented** — frontend audit summary counts it; worker never sets this value |

Near-duplicate claims (same meaning, different wording) currently pass through `createClaim()` as distinct claims. `meaningMatch` is the ready-built tool for detecting them — it just needs to be wired in.

---

## 2. Migration SQL — apply manually via Cloudflare D1 dashboard

**Do not run via `wrangler d1 execute` from a local Windows machine** — the known `schannel` TLS restriction (`CRYPT_E_NO_REVOCATION_CHECK`) makes remote Wrangler commands unreliable from this environment.

Apply both statements through the **Cloudflare dashboard → D1 → humanx-db → Execute SQL**:

```sql
ALTER TABLE claims ADD COLUMN near_duplicate_of TEXT;
```

```sql
CREATE INDEX IF NOT EXISTS idx_claims_near_duplicate_of ON claims (near_duplicate_of);
```

Apply them in order. Both are safe to run on existing data:
- `ALTER TABLE … ADD COLUMN` with no `DEFAULT` and no `NOT NULL` sets all existing rows to `NULL`. No data is changed.
- The index is non-unique and covers a nullable column — no constraint violations possible.

---

## 3. Verification SQL — run after applying to confirm

Check the column exists:

```sql
PRAGMA table_info(claims);
```

Expected: a row with `name = near_duplicate_of`, `type = TEXT`, `notnull = 0`, `dflt_value = NULL`.

Check the index exists:

```sql
PRAGMA index_list(claims);
```

Expected: a row with `name = idx_claims_near_duplicate_of`.

Spot-check that existing rows are unaffected:

```sql
SELECT COUNT(*) FROM claims WHERE near_duplicate_of IS NOT NULL;
```

Expected: `0` immediately after migration. Any non-zero result before D-10B implementation indicates unexpected data.

---

## 4. Rollback note

SQLite (and by extension Cloudflare D1) does not support `ALTER TABLE … DROP COLUMN` safely in all versions. A column added with `ALTER TABLE … ADD COLUMN` cannot be trivially removed without:

1. Creating a new table without the column.
2. Copying all data across.
3. Dropping the old table and renaming.

This is a planned migration, not an emergency option.

**For Phase 1 (D-10B), rollback strategy is: leave `near_duplicate_of` unused.** Since the column is nullable with no constraints, leaving it populated-but-ignored has no effect on any existing query or index. If D-10B is rolled back, `near_duplicate_of` values in the column are inert.

A destructive column-removal migration (`0006_remove_near_duplicate_of.sql`) would only be written if the column is confirmed unwanted after extended use.

---

## 5. D-10B implementation plan

**Branch:** `feat/near-duplicate-suggestions`  
**Commit / PR title:** `feat: near-duplicate claim suggestions in review queue (Phase 1)`  
**Must be a branch + PR — never direct main.**

### Steps in order

1. **Create branch** from current `main` after migration is confirmed applied.

2. **`src/worker.js` — `createClaim()`**
   - Add `import { meaningMatch } from './meaning-key.js';` (already exported).
   - After the successful `INSERT`, fetch a bounded candidate set:
     ```sql
     SELECT id, claim FROM claims
     WHERE review_state IN ('public', 'review')
     ORDER BY created_at DESC
     LIMIT 200
     ```
   - Run `meaningMatch(newClaimText, candidate.claim)` for each candidate. Stop at first match.
   - If a match is found:
     - `UPDATE claims SET near_duplicate_of = ? WHERE id = ?` (new claim id, matched claim id).
     - Include `nearDuplicate: true, similarClaim: { id, claim }` in the JSON response alongside the normal `ok: true` response.
   - If no match: response unchanged.
   - The submission is **not blocked** regardless of match result.

3. **`src/meaning-key.js`** — no changes needed.

4. **`public/app-v10.js` — `saveClaim()`**
   - Handle `data.nearDuplicate === true`: after the normal "submitted for Review" panel, show a soft advisory block — "A similar claim may already exist" with a link to `similarClaim.id`. The user can study the similar claim or ignore the suggestion.
   - The new claim is still submitted and the normal confirmation panel is shown. This is advisory only.

5. **`public/app-v10.js` — `reviewCard()` / `renderReviewInspectPanel()`**
   - When `item.near_duplicate_of` is populated, show a "Similar" badge in the review card.
   - In the inspect panel, add a `near_duplicate_of` field row (alongside the existing `duplicate_of` slot) linking to the matched claim ID.
   - No new admin action is required in Phase 1 — the moderator uses existing Approve / Reject / Keep Pending controls.

6. **Static check additions — `scripts/hardening-smoke-test.mjs`**
   - Add a check verifying that `near_duplicate_of` appears as a known field in the `mapClaim` output contract.
   - Increment expected pass count accordingly.

7. **Open PR to `main`.** Do not merge without review and live-QA confirmation.

---

## 6. Safety rules for Phase 1

| Rule | Reason |
|---|---|
| No silent auto-merge | Near-duplicate matching has false-positive risk on short claims; human moderator must decide |
| No `review_state = 'duplicate'` writes | That state has no resolution path or UI in Phase 1; setting it would strand claims in the queue |
| No `duplicate_of` writes | `duplicate_of` is reserved for a confirmed hard-duplicate decision; Phase 1 only flags similarity |
| No destructive writes | `near_duplicate_of` is set on the **new** claim only; the matched existing claim is untouched |
| Moderator-controlled | The review queue is the only place the flag surfaces; no submitter-visible blocking |
| Bounded candidate scan | `LIMIT 200` prevents full-table `meaningMatch` iteration from becoming a latency spike |
| `duplicate_signatures` table untouched | Its purpose is unclear; leave it for a separate audit |
