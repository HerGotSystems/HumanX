# D-91D2 — Archive One Rejected Pressure Test Artifact (Result)

**Date:** 2026-06-08
**Type:** Docs-only (direct main) — no POST executed
**Static checks:** 204 / 24 / 39

---

## A. Scope

User-approved target for archive:

| Field | Value |
|---|---|
| ID | `prs_2e507cb03a5f4df49c` |
| Type | `pressure` |
| Title | "HX_TEST_D90F pressure moderation test" |
| State | `rejected` |
| Handle | `anon-xksavy` |
| Origin | test-account |

This is the single item confirmed by the user as an already-rejected pressure test artifact
(submitted during D-90F manual test planning, handle `anon-xksavy` is a known dev/test
account).

---

## B. Pre-action evidence

**Artefact signals present (all three fire):**

| Signal | Match | Value |
|---|---|---|
| Keyword match | ✅ | Title contains `\btest\b` — "HX_TEST_D90F pressure moderation test" |
| ID pattern | ✅ | Matches `HX-\d` — actually `prs_*` (no ID pattern fire here) |
| Dev handle | ✅ | `anon-xksavy` is in `DEV_HANDLES` set |

Corrected: ID pattern does not fire (`prs_*` is not `clm_seed_*` or `HX-\d`). Keyword
match and dev handle both fire — sufficient for `test_artifact_v2` classification.

**Frontend `isSuspectedTestArtefact` would return `true`** for this item (state=`rejected`,
handle=`anon-xksavy` matches `DEV_HANDLES`), so the "Archive test artefact" button appears
in the Inspect panel.

---

## C. Endpoint analysis — critical blocker discovered

### Intended action

The UI "Archive test artefact" button calls `reviewCleanupUI(type, id)` with:
```js
type = 'pressure'   // from item.target_type
id   = 'prs_2e507cb03a5f4df49c'
```

This POSTs to:
```
POST /api/review/cleanup
x-humanx-admin: <token>
{ "target_type": "pressure", "target_id": "prs_2e507cb03a5f4df49c" }
```

### Backend response — BAD_TARGET_TYPE (400)

`src/worker.js` — `reviewCleanup` function, line 96:

```js
if (!['claim','truth'].includes(targetType))
  return json({ error: 'BAD_TARGET_TYPE', allowed: ['claim','truth'] }, 400);
```

The endpoint **only accepts `claim` or `truth`**. Any `target_type: 'pressure'` request
returns:
```json
{ "error": "BAD_TARGET_TYPE", "allowed": ["claim", "truth"] }
```
HTTP 400.

### No alternative archive path exists

`reviewDecision` supports `pressure` as a target type, but only these decisions:
```js
const allowed = new Set(['public', 'review', 'rejected']);
```
There is no `archived` decision. Sending `decision: 'archived'` returns `BAD_REVIEW_DECISION`.

**Summary: there is currently no backend route to set `review_state='archived'` on a
pressure item.** The `pressure_points.review_state` column (added in migration 0009) can
only be set to `public`, `review`, or `rejected` via the existing API.

---

## D. Action taken

**No POST was executed.**

The archive action was blocked by the backend capability gap documented in Section C.
The item `prs_2e507cb03a5f4df49c` remains in `review_state='rejected'` — unchanged from
its pre-action state.

---

## E. Current item status

| Field | Value |
|---|---|
| ID | `prs_2e507cb03a5f4df49c` |
| Type | `pressure` |
| State | `rejected` (unchanged) |
| Public feed | NOT visible — `rejected` state excluded from `getClaim`/`claimDetail` |
| Review queue | Appears under Rejected filter only |
| Archive state | Not archived — no archive path available |

**Safety note:** the item is already non-public. A `rejected` pressure point is excluded
from all public-facing queries (`COALESCE(review_state,'public')='public'` filter in
`getClaim`, `claimDetail`, `recalcClaimScore`). It does not affect claim scores, RunPack
content, or the public feed. The practical harm from its continued existence is zero.

---

## F. Backend gap — identified

**Gap:** `reviewCleanup` does not support `target_type: 'pressure'` or `target_type: 'evidence'`.

**Current allowed types:** `claim`, `truth`.

**Impact of gap:**
- Pressure test artifacts cannot be archived via the UI.
- The "Archive test artefact" button appears correctly (frontend detects handle/keyword),
  but clicking Confirm returns HTTP 400 from the backend.
- Evidence items have the same gap (`evidence` is also not in the allowed list).

**Options:**

| Option | Description | Effort |
|---|---|---|
| A. Leave as-is | Item is `rejected` (non-public, non-scoring). Functional impact = zero. | None |
| B. Add pressure/evidence support to `reviewCleanup` | Backend branch + PR. Extend `allowed` list, add pressure/evidence DB query + archive UPDATE. +smoke tests. | Medium — backend change, branch + PR |

**Recommendation:** Option A is safe for now. The item is already non-public and does not
require immediate removal from the admin queue. Option B is the correct long-term fix and
should be a named future batch (suggested: **D-91D3**) when queue cleanup is a priority.

---

## G. Queue state — no change

Pre- and post-action queue state is unchanged (no POST was executed):

| Metric | Before | After |
|---|---|---|
| Total loaded | 31 | 31 (unchanged) |
| Pending (review) | 15 | 15 |
| Rejected | 16 | 16 |
| Archived total | 11 | 11 |

---

## H. No other items touched

This batch targeted only `prs_2e507cb03a5f4df49c`. No other items were inspected,
approved, rejected, archived, or modified. The 5 editorial launch seed claims are
unaffected. All other queue items are unaffected.

---

## I. Recommended next steps

1. **Accept Option A (leave as-is)** — item is non-public; no functional urgency.
2. **Plan D-91D3** (future) — extend `reviewCleanup` backend to support `pressure` and
   `evidence` types. This is a backend branch + PR change.
3. **Continue D-91D (main)** — reject + archive C4 demo seeds and C5 HX dev seed (still
   pending browser ID confirmation from D-91D1).
4. **D-91E** — frontend Review density polish (localStorage filter persistence, Evidence
   filter chip).
