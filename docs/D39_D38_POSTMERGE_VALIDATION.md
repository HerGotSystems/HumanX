# D-39: D-38 Post-Merge Validation Record

Date: 2026-06-06
Status: Docs-only. No frontend, no Worker, no workflow, no Wrangler, no D1, no live tests.
Live validation: user-confirmed all items passed 2026-06-06.

---

## D-38 merge facts

| Item | Value |
|------|-------|
| PR | #97 |
| Branch | `security/d38-public-visibility-guards` |
| Merge commit | `c03e5eb` |
| Squash commit | `7cefa65` |
| Merged into | `main` |
| Merge date | 2026-06-06 |

---

## Guards landed in D-38

### Fix A — Evidence Vault (`src/evidence-vault.js`)

Added `COALESCE(c.review_state,'public')='public'` to the WHERE clause of the vault
query. Evidence items whose parent claim is not in `review_state='public'` are now
excluded from `GET /api/evidence-vault` results.

```sql
-- Before D-38
WHERE e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?

-- After D-38
WHERE COALESCE(c.review_state,'public')='public'
  AND (e.title LIKE ? OR e.body LIKE ? OR COALESCE(e.source_url,'') LIKE ?)
```

### Fix B-1 — createClaim decoupling (`src/worker.js`)

`createClaim` previously called the `getClaim` HTTP handler as its success response.
New claims land in `review_state='review'`; the guarded handler would have returned 404.
The tail now calls `claimDetail` + `claimLineage` directly and constructs the response
inline. Response shape is identical to the pre-D-38 output.

### Fix B-2 — getClaim public guard (`src/worker.js`)

Added a `review_state` check in `getClaim` immediately after the `!claim` null guard:

```js
if ((claim.review_state||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404);
```

`GET /api/claims/:id` now returns 404 for any claim not in `review_state='public'`,
giving no information about whether the claim exists.

### Fix C — createAipPacket public guard (`src/worker.js`)

Added a `reviewState` check in `createAipPacket` after the `!detail.claim` null guard:

```js
if ((detail.claim.reviewState||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404);
```

`POST /api/runpack` and `POST /api/aip` now return 404 before building or storing a
RunPack packet for any non-public claim.

---

## Static baseline — confirmed on merged main (`c03e5eb`)

| Script | Result |
|--------|--------|
| `node --check src/worker.js` | exit 0 |
| `node --check public/app-v10.js` | exit 0 |
| `node scripts/hardening-smoke-test.mjs` | **103 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `node scripts/worker-route-static-check.mjs` | **39 passed, 0 failed** |

All checks run locally against merged `main`. Exit 0 on all scripts.

---

## Live validation status

The items below require Cloudflare deployment propagation and manual user confirmation.
Until confirmed, this section records the expected state and the pending checks.

### GitHub PR checks

- PR #97 merged and closed — branch `security/d38-public-visibility-guards` pushed
  and PR opened in the same session as D-38.
- **Status: merged (confirmed by merge commit `c03e5eb`).**

### Cloudflare Worker deployment

Cloudflare Workers auto-deploy on push to main (when the Worker is wired to the repo).
After merge, the deployed Worker at `https://humanx.rinkimirikata.com` should reflect
the D-38 guards.

**Status: ✅ all items confirmed by user 2026-06-06.**

| Check | Result |
|-------|--------|
| Home loads | ✅ |
| Claims list loads | ✅ |
| Public claim → Study | ✅ |
| Evidence Vault loads | ✅ |
| RunPack on public claim | ✅ |

### HumanX Read Smoke workflow (GitHub Actions)

The `HumanX Read Smoke` workflow (`.github/workflows/read-smoke.yml`) fires on PRs to
main. It may or may not have fired for PR #97 depending on trigger configuration. A
manual trigger confirms post-D-38 read endpoints are healthy.

**Status: ✅ confirmed by user 2026-06-06.**
- `HumanX Read Smoke` on `main` after D-38 merge: green.
- All 8 endpoint groups pass (same baseline as D-33).

### Manual UI sanity

**Status: ✅ all items confirmed by user 2026-06-06.** Checks performed:

| Check | Expected |
|-------|----------|
| Home loads | Page renders, graph status box shows counts |
| Claims list loads | Public claims appear |
| Public claim → Study | Study view renders with evidence, pressure, tests |
| Evidence Vault loads | Vault shows evidence items |
| RunPack on public claim | Packet builds and copies without error |
| Non-public claim URL | Expected: 404 CLAIM_NOT_FOUND — verified by static check; not manually tested in this session |

---

## What D-38 proves

- The three visibility guards exist in source and are verified by static checks (section 22
  of `scripts/hardening-smoke-test.mjs`, checks 101–103).
- New claims created via `POST /api/claims` still receive a full response (decoupled tail
  confirmed by static check on `claimDetail` call path).
- `NULL review_state` (legacy rows) defaults to `'public'` via `COALESCE`/`||'public'`
  pattern — consistent with `listClaims` and `mapClaim`.

---

## What D-38 does not prove

- No browser automation was run — the UI has not been validated by automated or manual
  browser testing in this session.
- No live write smoke was run — `POST /api/claims` and related write endpoints were not
  exercised against production.
- No admin review workflow test — the full approve/reject/archive flow was not tested.
- No D1 migration was applied — schema is unchanged from D-28.
- No confirmation that Cloudflare deployed the merged Worker — Cloudflare propagation
  requires user confirmation.
- No assertion that existing public claims in production still load correctly post-deploy —
  requires manual UI check or read smoke run after merge.

---

## Next safe work

### Manual validation: ✅ passed (user-confirmed 2026-06-06)

1. **D-40 — Evidence moderation Phase 2 plan** (docs-only) — plan the schema change that
   would add per-evidence `review_state` (deferred from D-38). Requires its own branch
   if any Worker/D1 change is involved.
3. **D-26 manual UI test plan** — `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` — run when
   ready to open a browser session. Use `HX_TEST_D26_` prefix for all test claims.

### If validation reveals a regression

Stop. Diagnose before any new feature work. A regression in read endpoints would show as
a failure in `HumanX Read Smoke`. A UI regression would show in the manual sanity checks.
Fix the regression on a branch + PR before proceeding.

### Standing rules

- No live write smoke without explicit per-session approval.
- No D1 migration without explicit per-session approval.
- No production mutation without explicit per-session approval.
- No evidence-level moderation schema change without a D-40 plan doc reviewed first.
