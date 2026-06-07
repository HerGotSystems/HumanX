# D-88A: Safe Rejected Archive Policy Audit

Date: 2026-06-07
Step: D-88A — read-only audit of rejected-queue archive mechanism and safe policy design
Type: Audit only. Read-only. No backend changes. No D1 writes. No moderation actions.

---

## 1. Git State

- HEAD: `5c05c75` (docs D-87C)
- Branch: `main`, clean, up to date with origin
- Last code change: `c6bb323` (D-87C CSS fix)

---

## 2. Current Backend Archive Route

### Route spec

| Property | Value |
|---|---|
| Path | `POST /api/review/cleanup` |
| Auth | `x-humanx-admin` header — `requireAdmin(request, env)` |
| Body fields | `target_type` (`claim` \| `truth`), `target_id` (exact ID) |
| Returns on success | `{ ok:true, target_type, target_id, action:'archived', previous_state:'rejected', new_state:'archived' }` |

### State guards (in order)

1. **Auth gate** — `requireAdmin` returns 403 `ADMIN_REQUIRED` if header missing or wrong.
2. **Target ID required** — 400 `TARGET_ID_REQUIRED` if empty.
3. **Target type check** — only `claim` or `truth` accepted; 400 `BAD_TARGET_TYPE` if other.
4. **Row existence** — 404 `CLAIM_NOT_FOUND` / `TRUTH_NOT_FOUND` if not in DB.
5. **State gate** — `review_state` must be `'rejected'`; 400 `CLEANUP_REQUIRES_REJECTED` otherwise.
6. **Artefact gate (THE BLOCKING GUARD)** — text of `claim` or `statement` column must match:
   - `text.includes('smoke')`
   - `/\btest\b/.test(text)` (word boundary, case-insensitive after `.toLowerCase()`)
   - `text.includes('automated write')`
   - `text.includes('automated smoke')`
   If none match → 400 `CLEANUP_REQUIRES_TEST_ARTEFACT`.

### What the route does NOT check

- Does not inspect `handle` or user ID.
- Does not inspect `id` pattern (`clm_seed_*`, `HX-*`).
- Does not check `status_locked`.
- Does not check `duplicate_of` / `near_duplicate_of`.
- Does not check `category` or `origin` fields.

### What the route does on success

- **`UPDATE claims/truths SET review_state='archived', updated_at=? WHERE id=?`** — soft archive only.
- No `DELETE FROM`. Row is retained in DB, excluded from queue by `NOT IN ('archived','duplicate')` clause.
- No cascade to `reports` or `evidence` rows (cleanup route does not touch them).
- No audit field written (e.g., no `archived_by` or `archived_reason` column).
- No `status_locked` awareness — would archive a locked-score row if text matched guard.

### Evidence/reports fate

- Evidence attached to a claim stays in the DB after archive; it's excluded from the review queue only because the evidence query filters `NOT IN ('public','archived')`. So attached evidence is also soft-removed from view.
- Reports linked to the claim are not touched by the cleanup route. They retain their `status`.

---

## 3. Frontend Archive UI

### Where "Archive test artefact" appears

In `renderReviewInspectPanel`, the `cleanupSection` button renders only when:

```js
const isArtefact = state === 'rejected' && isSuspectedTestArtefact(item);
```

Both conditions must be true simultaneously:
- `state === 'rejected'` — item's `review_state` must be `rejected` (not `review`, `public`, etc.)
- `isSuspectedTestArtefact(item)` — D-87B extended version (handle + id pattern + keyword scan)

### D-87B change to `isSuspectedTestArtefact`

Before D-87B, the function only matched text keywords: `smoke`, `\btest\b`, `automated write`, `automated smoke`.

After D-87B, it also matches:
- handles: `humanx-seed`, `anon-o_seed`, `anon-xksavy`, `anon-73d9y2`, `anon-ek3562`
- id patterns: `/^clm_seed_/`, `/^HX-/i`
- (keyword fallback unchanged)

**Critical mismatch:** The frontend `isSuspectedTestArtefact` is now broader than the backend artefact guard. The "Archive test artefact" button will appear for items the backend will still reject with `CLEANUP_REQUIRES_TEST_ARTEFACT` (e.g., HX-000001 / HX-000002, clm_seed_* items in review). This is a frontend/backend divergence introduced by D-87B.

### `reviewCleanupUI` flow

```js
await api('/api/review/cleanup', {
  method: 'POST',
  headers: adminHeaders(),
  body: JSON.stringify({ target_type: targetType, target_id: targetId })
});
```

Two-step: `requestCleanupReview(id)` sets `pendingCleanupReviewId`, then `reviewCleanupUI` fires on "Confirm Archive". The button only appears for `rejected` + `isSuspectedTestArtefact` items.

---

## 4. Static Check Coverage of Archive Route

### `scripts/hardening-smoke-test.mjs`

- Does NOT cover `reviewCleanup` guard logic directly. Covers: unique constraints, rate limit, normalisation, file existence.

### `scripts/worker-route-static-check.mjs` (section 9, lines 404–530)

Covers:
| Test | What it checks |
|------|----------------|
| `reviewCleanup function exists` | Function present in worker source |
| `reviewCleanup does NOT contain DELETE FROM` | No hard delete |
| `reviewCleanup sets review_state to archived` | Soft archive only |
| `reviewCleanup calls requireAdmin` | Auth gate present |
| `reviewCleanup checks CLEANUP_REQUIRES_REJECTED` | State gate present |
| `reviewCleanup checks CLEANUP_REQUIRES_TEST_ARTEFACT` | Artefact guard present |

Also covers `reviewQueue` exclusion of archived items and `archived_total` metadata.

### Gap: no test for the guard's keyword list

The static check confirms the artefact guard *exists* but does not test which patterns it accepts or rejects. Adding a new policy path requires new static check assertions.

---

## 5. Live Rejected Queue — Classification (25 items)

Items fetched via `GET /api/review` (read-only). Classification uses three axes:

- **Backend guard**: does the current `CLEANUP_REQUIRES_TEST_ARTEFACT` keyword check pass?
- **Frontend artefact**: does D-87B `isSuspectedTestArtefact` pass (broader check)?
- **Human content**: does the claim contain factual/controversial/editorial content worth keeping visible?

### Group A: Pass current backend guard (safe to archive TODAY)

| # | ID | Claim | Backend pass reason |
|---|----|----|---|
| 4 | `clm_8ad342e93c594f1082` | "People are stupid - TEST" | contains word `test` |
| 5 | `clm_79f69a5075df45f181` | "HOWGH test" | contains word `test` |

Only 2 of 25 pass the current guard. Both are clear junk/dev submissions.

### Group B: Pass frontend check but NOT backend guard — HX seed rows

| # | ID | Claim | Why blocked |
|---|----|----|---|
| 3 | `HX-000002` | "Humans landed on the Moon" | id matches `/^HX-/i` (frontend only), no keyword in text |
| 6 | `HX-000001` | "The Earth is flat" | id matches `/^HX-/i` (frontend only), no keyword in text |

These are early dev seed rows — not user content. Claim text is factual/controversial (Moon landing, flat earth) so keyword guard rightly rejects them. They need an ID-pattern-based gate, not a text keyword gate.

### Group C: Clear junk / gibberish / fragments — neither guard passes

| # | ID | Claim | Notes |
|---|----|----|---|
| 9 | `clm_3905faadfa9c47159e` | "DOCTRINE" | Single word fragment |
| 11 | `clm_6bd4e59efa2a44d1b2` | "EVERYBODY IS IDIOT" | All-caps junk, grammatically broken |
| 14 | `clm_d1e4261798754199a6` | "Belief Engine Profile — Stoic Atheism" | App UI artefact pasted as claim |
| 15 | `clm_2c1751dd6605412db2` | "I am the best" | Personal assertion, not a claim |
| 17 | `clm_1695187b3d6140b88b` | "Blablablabla" | Literal gibberish |
| 21 | `clm_d02ac47783d0423c93` | "gfsdhdfhfdhdfhdfhgdfa" | Keyboard mash |

6 items. No keywords in text; no dev handle. Would need explicit admin override to archive.

### Group D: Claims with factual/controversial content — keep visible

| # | ID | Claim | Notes |
|---|----|----|---|
| 1 | `clm_cdba3db932b84f279a` | "People are stupid" | Rejected by D-85G — credibility artefact |
| 2 | `clm_4176a17d0a754b78aa` | "Science has proven it" | Rejected by D-85F — ambiguous |
| 7 | `clm_ae59b53d5f4249f0b4` | "Never trust the experts" | Substantive anti-expert claim |
| 8 | `clm_eec72f024040428190` | "Children should always obey adults" | Substantive normative claim |
| 10 | `clm_ba71db1962b8474bb7` | "PEOPLE ARE STUPID" | Duplicate content of #1 (all-caps variant) |
| 12 | `clm_a51c7861a89945339b` | "GOD DONT EXIST" | Substantive belief claim (all-caps variant) |
| 13 | `clm_852333ac90654ab495` | "everyone knows the government is hiding everything" | Conspiracy-adjacent, testable |
| 16 | `clm_9c6e0a3aa9924c4e95` | "MONEY IS NO GOOD" | Normative claim |
| 18 | `clm_b3dd4907cb744831b1` | "God doesnt exist" | Substantive belief claim |
| 19 | `clm_180a9127f4ac4b5281` | "Trust the experts" | Counter-claim to #7 |
| 20 | `clm_93b05946babe4e7487` | "dont trust expert" | Near-duplicate of #7 |
| 22 | `clm_da3304ebdfe44e7e8f` | "mOON LANDING" | Low-quality but topically substantive |
| 23 | `clm_cca7de1026f043f5bb` | "Human really landed on Moon" | Substantive factual claim |
| 24 | `clm_721b8ea6de01457ab4` | "Humans didnt land on moon" | Substantive factual claim |
| 25 | `clm_697a5babed9a4332b4` | "We never went to space" | Substantive factual claim |

15 items. These should remain rejected-visible for admin audit trail. Some are low-quality versions of legitimate topics. None should be archived without deliberate human review.

### Summary table

| Group | Count | Description | Archive candidates |
|-------|-------|-------------|-------------------|
| A — pass current guard | 2 | Dev/test keyword in text | Yes — archivable now |
| B — HX seed rows | 2 | Dev seed, id-pattern-only | Yes — safe with id-pattern gate |
| C — junk/gibberish | 6 | Fragments, mash, UI artefacts | Yes — safe with explicit admin override |
| D — factual/controversial | 15 | Real content, rejected but substantive | No — keep rejected-visible |

---

## 6. Proposed Safe Archive Policy

### Core invariants (never relax)

1. **`review_state` must be `'rejected'`** — already enforced; keep.
2. **Never archive `status_locked` items** — add explicit check. A locked-score row has admin editorial intent attached; archiving it silently drops that context.
3. **Never archive launch seed claims** (`clm_seed_55e17c22e13e`, `clm_seed_8e095b6f6d30`, `clm_seed_c4e0335e7aae`, `clm_seed_8ad9ff121579`, `clm_seed_7fb1c24747c2`) — add hardcoded blocklist OR check `id IN (...)`.
4. **Require exact target ID** — already enforced; keep.
5. **Single-item action only** — no batch archive endpoint.
6. **Require admin token** — already enforced; keep.
7. **Never hard-delete** — already the case; keep (soft archive only).

### Expanded artefact detection (backend guard)

Replace the current text-only `isArtefact` check with a multi-signal check:

```js
const id = row.id || '';
const handle = String(row.handle || '').toLowerCase();
const text = String(row.claim || row.statement || '').toLowerCase();

// Signal 1: text keywords (existing)
const keywordMatch = text.includes('smoke') || /\btest\b/.test(text)
  || text.includes('automated write') || text.includes('automated smoke');

// Signal 2: known dev/seed id patterns (new)
const idPatternMatch = /^clm_seed_/.test(id) || /^HX-\d/i.test(id);

// Signal 3: known dev/test handles (new)
const devHandles = new Set(['humanx-seed','anon-o_seed','anon-xksavy','anon-73d9y2','anon-ek3562']);
const handleMatch = devHandles.has(handle);

// Signal 4: explicit junk markers (new) — gibberish/fragment
// Only via explicit `junk_override: true` body flag + reason field (see below)

const isArtefact = keywordMatch || idPatternMatch || handleMatch;
```

### Admin override for junk/gibberish (Group C)

For the 6 Group C items that don't match any automatic pattern, add an explicit override path:

- Body field `junk_override: true` (boolean)
- Body field `reason` (string, required when `junk_override` is true, max 200 chars)
- When `junk_override` is true: only allow if `text.length < 30` OR text matches `/^[^a-zA-Z]*$/` (all non-alpha) OR text is all-caps single word — i.e., the backend applies a "visibly junk" secondary heuristic so the override can't be silently abused for substantive claims.
- Write `reason` to a `archive_reason` column if it exists, or include in the response body only.

**Note:** This requires assessing whether a DB migration adding `archive_reason TEXT` is worthwhile for D-88B. Recommendation: omit the DB column initially; return `reason` in the JSON response only (audit via API logs). Add column in a follow-up migration if needed.

### Policy decision tree (backend)

```
POST /api/review/cleanup
  ├─ Auth check → 403 if fails
  ├─ target_type in {claim, truth} → 400 BAD_TARGET_TYPE if not
  ├─ target_id exact match → 404 NOT_FOUND if not
  ├─ review_state === 'rejected' → 400 CLEANUP_REQUIRES_REJECTED if not
  ├─ status_locked check → 400 CLEANUP_REQUIRES_NOT_LOCKED if locked
  ├─ launch seed blocklist → 400 CLEANUP_PROTECTED_SEED if match
  ├─ isArtefact (keyword || idPattern || handle) → proceed if true
  │   └─ → archive
  ├─ junk_override === true
  │   ├─ reason required → 400 REASON_REQUIRED if empty
  │   ├─ secondary junk heuristic (short/nonsense/all-caps single word) → 400 CLEANUP_REQUIRES_TEST_ARTEFACT if fails
  │   └─ → archive (with reason in response)
  └─ → 400 CLEANUP_REQUIRES_TEST_ARTEFACT if nothing matched
```

---

## 7. Why Current Guard Blocks Useful Cleanup

### Root cause

The current `isArtefact` check is a **text-content-only** test applied to the `claim`/`statement` column. It was written to catch automated write test submissions whose payloads contained the word "smoke" or "test".

This works for Group A items (2 items) but fails for:

- **HX seed rows** (Group B): The claim text ("The Earth is flat", "Humans landed on the Moon") is factually reasonable text with no test markers. The only signal that these are dev artefacts is the `HX-000*` id format.
- **Junk/gibberish** (Group C): Items like "Blablablabla" and "gfsdhdfhfdhdfhdfhgdfa" don't contain the words `smoke` or `test`. They're obviously junk by every other metric but bypass the guard by accident.
- **Known dev handles** (Group B/extended): The D-87B frontend extension adds handle and id-pattern awareness, but the backend never received that update, creating a frontend/backend divergence.

### Effect

- 23 of 25 rejected items are blocked from archive by the current guard.
- The "Archive test artefact" button appears for HX seed rows (frontend shows it) but clicking Confirm will return `CLEANUP_REQUIRES_TEST_ARTEFACT` from the backend — a confusing UX failure.
- Group D (15 factual/controversial items) should remain blocked — they are correctly excluded by the proposed policy too.

---

## 8. D-88B Implementation Recommendation

### Branch required

- **No direct-main.** Backend code change required.
- Create branch: `feat/d88b-safe-archive-policy`
- PR to main; review before merge.

### Files to change

| File | Change |
|------|--------|
| `src/worker.js` | Extend `reviewCleanup`: add `status_locked` gate, launch-seed blocklist, id-pattern + handle artefact signals, optional `junk_override` path |
| `scripts/worker-route-static-check.mjs` | Add tests: locked gate, seed blocklist, id-pattern signal, handle signal, junk_override path |
| `public/app-v10.js` | No change needed — frontend artefact detection already extended by D-87B |
| `public/index.html` / `styles.css` | No change needed |

### No D1 migration required

- Do not add `archive_reason` column in D-88B. The `reason` field can be returned in the JSON response body only; it is not persisted.
- Revisit in a later step if audit trail persistence is required.

### New static check tests needed (worker-route-static-check.mjs)

1. `reviewCleanup rejects status_locked items`
2. `reviewCleanup rejects launch seed IDs`
3. `reviewCleanup accepts HX-* id pattern as artefact`
4. `reviewCleanup accepts clm_seed_* id pattern as artefact`
5. `reviewCleanup accepts known dev handle as artefact`
6. `reviewCleanup junk_override requires reason field`
7. `reviewCleanup junk_override applies secondary heuristic`

These tests check source code string patterns only (same approach as existing section 9 tests) — no D1 or live endpoint calls.

### Group-by-group outcome after D-88B

| Group | Count | Outcome after D-88B |
|-------|-------|-------------------|
| A — keyword match | 2 | Archivable (already archivable today) |
| B — HX seed rows | 2 | Archivable (id-pattern gate unlocks them) |
| C — junk/gibberish | 6 | Archivable via `junk_override:true` + reason + secondary heuristic |
| D — factual/controversial | 15 | Still blocked — no pattern match, junk heuristic would fail for real sentences |

Total archivable after D-88B: **up to 10 of 25**. The remaining 15 (Group D) remain rejected-visible, which is correct — they are substantive claims that were rejected on quality/scope grounds, not dev artefacts.

---

## 9. Static Checks (Baseline Confirmed)

| Script | Expected | Result |
|--------|----------|--------|
| `node --check public/app-v10.js` | exit 0 | ✅ |
| `scripts/hardening-smoke-test.mjs` | 127 passed | ✅ All hard checks passed |
| `scripts/belief-engine-static-check.mjs` | 24 passed | ✅ All hard checks passed |
| `scripts/worker-route-static-check.mjs` | 39 passed | ✅ 39 passed, 0 failed |

---

## 10. Non-Scope Confirmations

| Rule | Status |
|------|--------|
| No POST calls made | ✅ |
| No moderation actions | ✅ |
| No archive/cleanup route called | ✅ |
| No D1 writes | ✅ |
| No Wrangler | ✅ |
| No backend code changes | ✅ |
| Admin token not printed or committed | ✅ |
| No Co-Authored-By | ✅ |
