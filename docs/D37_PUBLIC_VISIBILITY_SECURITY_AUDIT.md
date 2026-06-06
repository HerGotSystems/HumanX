# D-37: Public Visibility / Security Audit

Date: 2026-06-06
Status: Docs-only audit. No code changes, no schema changes, no migrations, no D1 commands, no Wrangler, no live tests.

---

## Summary verdict

**Three confirmed gaps. All are real, all are fixable without schema migration.**

| Gap | Endpoint | Severity | Migration needed? |
|-----|----------|----------|-------------------|
| Evidence Vault leaks evidence on non-public claims | `GET /api/evidence-vault` | Medium | ❌ No |
| Direct claim fetch exposes non-public claims by ID | `GET /api/claims/:id` | Medium | ❌ No |
| RunPack builds and exports packets for non-public claims (unauthenticated) | `POST /api/runpack` / `POST /api/aip` | Medium-High | ❌ No |

The `GET /api/claims` list endpoint is **already correct** — it filters `COALESCE(review_state,'public')='public'`. The gaps are specifically in the three routes above.

Evidence-level moderation (own `review_state` / `report_count` on the `evidence` table) does not exist and is out of scope for D-38. Phase 2 would address it.

---

## 1. Source facts

### `listClaims` (line 76) — SAFE ✅

```sql
WHERE COALESCE(c.review_state,'public')='public' AND c.claim LIKE ? ...
```

The public claims list correctly filters to `review_state='public'` only. A claim in `review`, `rejected`, `archived`, or `duplicate` state will not appear in the list.

---

### `getClaim` (line 77) — EXPOSED ⚠️

```sql
SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?
```

**No `review_state` filter.** Any caller who knows a claim's `id` can fetch its full detail (claim text, evidence, pressure points, home tests, analyses, lineage) regardless of `review_state`. A claim in `review`, `rejected`, `archived`, or `duplicate` state is fully readable via `GET /api/claims/:id`.

**Complication:** `createClaim` (line 81) internally calls `getClaim(request, env, claimId)` as its final step to return the newly created claim to the user. New claims enter `review_state='review'`. If `getClaim` is guarded to 404 non-public claims, `createClaim` would return 404 to the user immediately after a successful submission. This coupling **must be resolved** before the guard is applied.

---

### `claimOnly` (line 93) and `claimDetail` (line 94) — INTERNAL, NO FILTER ⚠️

Both internal helpers query without `review_state` filter by design — they are called by `getClaim`, `createClaim`, `addEvidence`, `addPressure`, `addHomeTest`, and `createAipPacket`. They should not be changed; the filter belongs in the HTTP-layer handler (`getClaim`).

---

### `createAipPacket` — `POST /api/runpack` / `POST /api/aip` (line 86) — EXPOSED + UNAUTHENTICATED ⚠️

```js
async function createAipPacket(request, env) {
  const body = await readJson(request);
  const claimId = cleanId(body.claimId);
  if (!claimId) return json({ error:'BAD_CLAIM_ID' }, 400);
  const detail = await claimDetail(env, claimId);
  if (!detail.claim) return json({ error:'CLAIM_NOT_FOUND' }, 404);
  // ... builds and stores full packet, returns it
}
```

**Two issues:**
1. No `requireUser` call — the endpoint is fully unauthenticated. Any HTTP client can POST `{claimId: "..."}` and get a full RunPack including evidence, pressure points, tests, and analyses.
2. No `review_state` check — packets can be built and stored in `aip_packets` for claims in any state.

`claimDetail` calls `claimOnly` which has no filter, so the full detail of a non-public claim is exported into the packet and stored in D1.

---

### `listEvidenceVault` (`src/evidence-vault.js`) — EXPOSED ⚠️

```sql
SELECT e.id, e.claim_id, e.stance, e.quality, e.title, e.body, e.source_url, ...
  e.created_at, e.duplicate_signature, c.claim, c.status, c.category, u.handle
FROM evidence e
LEFT JOIN claims c ON c.id=e.claim_id
LEFT JOIN users u ON u.id=e.user_id
WHERE e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?
ORDER BY e.reliability_score DESC, e.created_at DESC
LIMIT ?
```

**No `review_state` filter on the joined `claims` table.** Evidence attached to claims in `review`, `rejected`, `archived`, or `duplicate` state appears in the vault. The evidence body text, title, source URL, and linked claim text are all returned.

Note: `evidence` has no own `review_state` column (see schema section below).

---

### `reviewQueue` (line 91) — SAFE ✅

```js
const adminError = requireAdmin(request, env);
if (adminError) return adminError;
```

Admin-gated. Cannot be called without `x-humanx-admin` token matching `env.HUMANX_ADMIN_TOKEN`.

---

### `mapClaim` (line 102) — NOTE

`mapClaim` exposes `reviewState` in its output. This means `getClaim` returns `reviewState:'review'` (or `rejected`, etc.) in the response. A caller enumerating claim IDs can determine moderation state by reading this field. After the guard is added, this field becomes moot for non-public claims since they will 404.

---

## 2. Schema facts

### `evidence` table — no moderation columns

From `migrations/0003_full_schema.sql`:

```
evidence:
  id, claim_id, user_id, stance, quality, title, body,
  source_url, url, summary, source_quality, strength, verdict,
  media_type, duplicate_signature, reliability_score, source_domain, created_at
```

**No `review_state` column. No `report_count` column.** Evidence cannot be individually moderated via the current schema. Evidence moderation is inherited from the parent claim's `review_state` at the application layer — but only if the application enforces it.

### `claims` table — has `review_state`

```
claims:
  ..., review_state TEXT DEFAULT 'review', ...
```

`review_state` values in use: `'public'`, `'review'`, `'rejected'`, `'archived'`, `'duplicate'`.

---

## 3. Risk table

| Endpoint | Auth | review_state filter | Risk |
|----------|------|---------------------|------|
| `GET /api/claims` | None | ✅ `='public'` | Safe |
| `GET /api/claims/:id` | None | ❌ None | Non-public claims fully readable by ID |
| `GET /api/evidence-vault` | None | ❌ None | Evidence on non-public claims is searchable |
| `POST /api/runpack` | ❌ None | ❌ None | Full claim detail exported unauthenticated for any claimId |
| `POST /api/aip` | ❌ None | ❌ None | Same as above (aliases createAipPacket) |
| `GET /api/review` | `requireAdmin` | N/A | Safe — admin only |
| `POST /api/review/decision` | `requireAdmin` | N/A | Safe — admin only |
| `POST /api/review/cleanup` | `requireAdmin` | N/A | Safe — admin only |
| `POST /api/review/mark-duplicate` | `requireAdmin` | N/A | Safe — admin only |
| `POST /api/review/resolve-similar` | `requireAdmin` | N/A | Safe — admin only |

---

## 4. Phase 1 — No-migration fix proposal

All three fixes are Worker-only changes to `src/worker.js` and `src/evidence-vault.js`. No schema changes. No D1 migrations. Branch + PR required (Worker route behaviour changes).

### Fix A — Evidence Vault: filter by parent claim `review_state`

**File:** `src/evidence-vault.js`

Add `AND COALESCE(c.review_state,'public')='public'` to the WHERE clause:

```sql
WHERE (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
  AND COALESCE(c.review_state,'public')='public'
```

**Impact:** Evidence items whose parent claim is in `review`, `rejected`, `archived`, or `duplicate` state will no longer appear in Vault results. No create-flow side effects — `listEvidenceVault` is a standalone GET with no internal callers.

**Frontend shape change:** None — existing fields unchanged, result set reduced.

**Risk level:** Low.

---

### Fix B — RunPack: require auth + public-only guard

**File:** `src/worker.js`, `createAipPacket` (line 86)

Add `requireUser` and a `review_state` check:

```js
async function createAipPacket(request, env) {
  requireUser(request);  // add: requires x-humanx-user header
  const body = await readJson(request);
  const claimId = cleanId(body.claimId);
  if (!claimId) return json({ error:'BAD_CLAIM_ID' }, 400);
  const detail = await claimDetail(env, claimId);
  if (!detail.claim) return json({ error:'CLAIM_NOT_FOUND' }, 404);
  // add: guard non-public claims
  if ((detail.claim.reviewState || 'public') !== 'public')
    return json({ error:'CLAIM_NOT_PUBLIC' }, 403);
  // ... rest unchanged
}
```

**Impact:** 
- Unauthenticated callers get 401 instead of a packet.
- Authenticated users cannot build RunPacks for claims in `review`, `rejected`, `archived`, or `duplicate` state.
- Frontend: the RunPack builder in `generateRunPack` (`public/app-v10.js`) only calls `/api/runpack` when a claim is selected via `selectClaim`. Claims shown in the UI are already filtered to `review_state='public'` (they come from `listClaims`). So the normal flow is unaffected. Edge case: if a user has a direct link to a `review`-state claim and opens Study → RunPack, they would get a 403 — this is the correct behaviour.
- The frontend `generateRunPack` already sends `x-humanx-user` header (it goes through `api()` which attaches the header). So adding `requireUser` does not break the normal flow.

**Risk level:** Low–Medium (behaviour change on non-public claims).

---

### Fix C — `getClaim`: public-only guard with `createClaim` decoupling

**File:** `src/worker.js`, `getClaim` (line 77) and `createClaim` (line 81)

This is the most complex fix due to the `createClaim → getClaim` coupling.

**Step 1 — Decouple `createClaim`:** Replace the tail call to `getClaim(request, env, claimId)` with a direct `claimDetail` call:

```js
// createClaim tail — before:
if (!nearDuplicate) return getClaim(request, env, claimId);
const base = await (await getClaim(request, env, claimId)).json();
return json({...base, nearDuplicate:true, similarClaim});

// createClaim tail — after:
const detail = await claimDetail(env, claimId);
if (!nearDuplicate) return json({ claim: detail.claim, evidence: detail.evidence, pressure: detail.pressure, tests: detail.tests, analyses: detail.analyses, lineage: await claimLineage(env, claimId, detail.evidence, detail.analyses, detail.pressure, detail.tests) });
return json({ claim: detail.claim, evidence: detail.evidence, pressure: detail.pressure, tests: detail.tests, analyses: detail.analyses, lineage: await claimLineage(env, claimId, detail.evidence, detail.analyses, detail.pressure, detail.tests), nearDuplicate:true, similarClaim });
```

**Step 2 — Add guard to `getClaim` handler:**

```js
async function getClaim(request, env, claimId) {
  const claim = await env.DB.prepare(
    `SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`
  ).bind(claimId).first();
  if (!claim) return json({ error:'CLAIM_NOT_FOUND' }, 404);
  // add: block non-public claims
  if ((claim.review_state || 'public') !== 'public')
    return json({ error:'CLAIM_NOT_FOUND' }, 404);  // 404 not 403: do not reveal existence
  // ... rest unchanged
}
```

Returning 404 (not 403) for non-public claims is the correct security posture — it prevents enumeration by state.

**Frontend shape change:** No change to the response fields. A claim that was previously readable by ID and is now in `review`/`rejected` state will return 404 instead of the full detail. The frontend's `selectClaim` will get a 404, display an error toast, and exit — no crash, no shape break.

**Risk level:** Medium. Requires careful testing. `createClaim` response shape must match the existing `getClaim` shape exactly, including `lineage`.

**Alternative (lower-risk):** Return 404 only for `rejected`, `archived`, and `duplicate` states; allow `review`-state claims to be readable by anyone who knows the ID. This reduces leakage of truly removed content while keeping the submitter's in-review claim accessible. The D-38 implementation should decide this policy explicitly.

---

## 5. Phase 2 — Migration-required proposals (deferred)

### Evidence-level moderation

Add `review_state TEXT DEFAULT 'public'` and `report_count INTEGER DEFAULT 0` columns to the `evidence` table:

```sql
ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public';
ALTER TABLE evidence ADD COLUMN report_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_evidence_review_state ON evidence (review_state);
```

This would allow individual evidence items to be moderated independently of their parent claim. Currently impossible without a schema migration.

**Not required for D-38.** Phase 1 fixes cover the immediate leak via parent-claim state. Evidence-level moderation is a separate, larger project with review queue integration, frontend moderation UI, and migration risk.

### Evidence moderation queue

Extend `reviewQueue` to include evidence items. Requires:
- `evidence.review_state` column (above migration)
- Worker changes to `reviewQueue` query
- Frontend review UI changes
- New `reviewDecision` branch for `targetType='evidence'`

**Out of scope for D-38 and D-39 unless explicitly approved.**

---

## 6. Out of scope

The following will NOT be implemented in D-38 or any speculative future batch:

- **Automatic censorship** — no automatic removal of content based on AI verdict or report count threshold.
- **Destructive cleanup** of existing evidence on non-public claims — existing D1 rows are untouched; the fix is a read filter only.
- **AI verdict moderation** — no AI-driven content filtering.
- **Hard user authentication** — HumanX uses pseudonymous `x-humanx-user` headers; there is no session auth system. Adding `requireUser` to RunPack is soft (unverified user ID), not hard auth.
- **Blocking evidence writes to non-public claims** — `addEvidence` and `addPressure` currently accept any `claimId`. Blocking writes to non-public claims is a separate policy decision, not addressed in D-38.

---

## 7. Required implementation sequence

### D-38 — Public visibility guard (branch + PR, no migration)

**Scope:** Worker route behaviour changes → branch + PR mandatory. No D1 migration. No frontend changes.

**Recommended order within D-38:**

1. Fix A: `src/evidence-vault.js` — add `AND COALESCE(c.review_state,'public')='public'` to the WHERE clause.
2. Fix B: `src/worker.js` / `createAipPacket` — add `requireUser` + `review_state='public'` guard.
3. Fix C: `src/worker.js` / `getClaim` + `createClaim` — add public-only guard on `getClaim`; decouple `createClaim` tail call from `getClaim` HTTP handler.

Implement and smoke-check all three together in one PR. Do not partially apply.

**Tests to add before D-38 commit:**

```js
// hardening-smoke-test.mjs — new checks (section 22, 3 checks, 100→103):
test('listEvidenceVault SQL includes review_state public filter on joined claims', ...)
test('createAipPacket contains review_state public guard (CLAIM_NOT_PUBLIC)', ...)
test('getClaim SQL guard present for non-public review_state (CLAIM_NOT_FOUND block)', ...)
```

These static checks assert the guard strings are present in the source files. No network needed.

### D-39 — Evidence-level moderation schema (branch + PR + migration, future)

Only if a real operational need for evidence-level moderation emerges. Not speculative. Requires:
- `PRAGMA table_info(evidence)` to confirm `review_state` is absent before migration
- Explicit per-session user approval for D1 migration
- Full migration plan doc before implementation

---

## 8. What frontend response shapes might break

| Scenario | Break? | Notes |
|----------|--------|-------|
| Normal claim list → select → study | ❌ No | `listClaims` already filters to public; `getClaim` guard matches |
| Submit new claim → success response | ⚠️ Yes, if Fix C naively applied | `createClaim` calls `getClaim` internally; must be decoupled first (see Fix C Step 1) |
| RunPack on public claim | ❌ No | Guard passes for `review_state='public'` |
| RunPack on `review`-state claim | ✅ Correct | Returns 403 after Fix B — this is intended |
| Evidence Vault search | ❌ No shape break | Fields unchanged; result set reduced |
| Admin review queue | ❌ No | `reviewQueue` is unchanged; it already fetches all states |
| `mapClaim` output | ❌ No | `reviewState` field still present; guard fires before `mapClaim` for non-public |

---

## 9. What must stay admin-only

The following routes must remain `requireAdmin`-gated and must not be changed to public in any future batch:

| Route | Function |
|-------|----------|
| `GET /api/review` | `reviewQueue` |
| `POST /api/review/decision` | `reviewDecision` |
| `POST /api/review/cleanup` | `reviewCleanup` |
| `POST /api/review/mark-duplicate` | `markDuplicate` |
| `POST /api/review/resolve-similar` | `resolveSimilar` |

---

## 10. Static checks to add before D-38 implementation

Run before any code change. All must hold at 100/24/39 throughout.

**New checks to add in D-38 (hardening-smoke-test.mjs, section 22):**

1. `evidence-vault.js includes review_state='public' filter on joined claims` — asserts the guard SQL string is present in `src/evidence-vault.js`.
2. `createAipPacket returns CLAIM_NOT_PUBLIC for non-public claims` — asserts the guard condition and error key are present in `src/worker.js`.
3. `getClaim returns CLAIM_NOT_FOUND for non-public claims` — asserts the guard block is present in `getClaim` in `src/worker.js`.

No live write tests. No Wrangler. No D1 commands. Static string presence checks only.

---

## Static checks (unchanged by D-37)

| Script | Result |
|--------|--------|
| `hardening-smoke-test.mjs` | **100 passed, 0 failed** |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `worker-route-static-check.mjs` | **39 passed, 0 failed (39 hard checks)** |

No checks added in D-37 — docs-only audit batch.
