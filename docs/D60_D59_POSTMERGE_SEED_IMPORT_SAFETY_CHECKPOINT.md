# D-60: D-59 Post-Merge Seed Import Safety Checkpoint

Date: 2026-06-06
Type: Docs-only, direct main.
No D1 commands. No Wrangler. No seed imports executed. No live writes.

---

## 1. D-59 Merge Record

| Item | Value |
|------|-------|
| PR | #101 |
| Merge commit | `1c32745` |
| Branch merged | `feature/d59-seed-import-route-safety` |
| Implementation commit | `d35798c` (`security: harden seed import routes`) |
| Files changed | 9 (542 insertions, 132 deletions) |
| Merged to | `main` |

---

## 2. Route Safety Changes Landed

### `GET /api/seed`

| Before D-59 | After D-59 |
|-------------|-----------|
| Unauthenticated — any caller could write to an empty DB | Admin token required (`x-humanx-admin`). Unauthenticated calls return `403 ADMIN_REQUIRED`. |
| No auth gate | DB-empty guard preserved inside `seedDemoClaims` |
| Inserts demo claims as `review_state='public'` | Inserts as `review_state='public'` (demo fallback only — not launch path) |

### `GET /api/import-seed`

| Before D-59 | After D-59 |
|-------------|-----------|
| Always writes on call | Defaults to `?mode=dry-run` — returns structured report, no writes |
| `review_state='public'` hardcoded for all claims | `review_state='review'` by default |
| `review_state` absent from evidence INSERT (schema default `'public'` applied) | `review_state='review'` explicit in evidence INSERT |
| No SOURCE_NEEDED guard | Apply mode blocked if any `source_url` is empty or contains `'SOURCE_NEEDED'` placeholder |
| No structured report | Structured report returned in both dry-run and apply modes |
| No pressure/test dedup | `WHERE claim_id=? AND title=?` dedup guard before each pressure/test INSERT |

### `GET /api/import-truths`

| Before D-59 | After D-59 |
|-------------|-----------|
| Always writes on call | Defaults to `?mode=dry-run` — returns structured report, no writes |
| `review_state='public'` hardcoded for all truths | `review_state='review'` by default |
| No structured report | Structured report returned in both dry-run and apply modes |

### Mode parameter (both import routes)

```
GET /api/import-seed               → dry-run (default, no writes)
GET /api/import-seed?mode=dry-run  → dry-run (explicit, no writes)
GET /api/import-seed?mode=apply    → writes to DB (admin-gated, SOURCE_NEEDED guard active)
GET /api/import-seed?mode=invalid  → 400 INVALID_MODE
```

---

## 3. Static Baseline — Post-Merge

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `node scripts/hardening-smoke-test.mjs` | **119 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `node scripts/worker-route-static-check.mjs` | **39 passed, 0 failed** |

Static checks run locally on `main` at commit `1c32745`. `MODULE_TYPELESS_PACKAGE_JSON`
warning during hardening smoke is non-blocking.

---

## 4. Read Smoke Status

| Item | Status |
|------|--------|
| Workflow | `HumanX Read Smoke` (`.github/workflows/read-smoke.yml`) |
| Run after D-59 merge | ✅ **Green** — confirmed by user |
| Node version | 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` active) |
| Endpoints exercised | Read-only GET endpoints only. No write endpoints, no import routes called. |

The PR `#101` triggered the read-smoke workflow on PR (configured in workflow triggers).
User confirmed the workflow passed post-merge on `main`.

---

## 5. What Is Now Safer

| Gap (before D-59) | Status after D-59 |
|-------------------|------------------|
| `/api/seed` unauthenticated write — any caller could seed demo claims into an empty DB | ✅ **Closed** — admin token required; 403 for unauthenticated callers |
| `/api/import-seed` always writes on call — no safe inspection mode | ✅ **Closed** — defaults to `?mode=dry-run`; writes only on explicit `?mode=apply` |
| `/api/import-truths` always writes on call — no safe inspection mode | ✅ **Closed** — defaults to `?mode=dry-run`; writes only on explicit `?mode=apply` |
| Imported claims published directly as `review_state='public'` (bypass moderation queue) | ✅ **Closed** — `review_state='review'` by default; requires admin review/approval before public |
| Imported evidence published directly as `review_state='public'` (schema default) | ✅ **Closed** — `review_state='review'` explicit in evidence INSERT |
| Imported truths published directly as `review_state='public'` | ✅ **Closed** — `review_state='review'` by default |
| No SOURCE_NEEDED guard — seed data with placeholder URLs could be imported as-is | ✅ **Closed** — apply mode blocked entirely if any `source_url` is empty or contains `'SOURCE_NEEDED'` |
| Pressure points and home tests duplicated on repeated import runs | ✅ **Closed** — dedup guard (`WHERE claim_id=? AND title=?`) before each INSERT |
| No structured import report | ✅ **Closed** — both helpers return `would_create`/`would_skip`/`created`/`skipped` counts in both modes |

---

## 6. What Is Still Not Done

| Item | Status |
|------|--------|
| Source URLs for D-55/D-57 launch seed claims | ❌ Not gathered — all `source_url` fields are empty string or `SOURCE_NEEDED` placeholders |
| Launch seed JSON finalized | ❌ D-57 draft only — all SOURCE_NEEDED, not import-ready |
| Production import of launch seed | ❌ Explicitly blocked — SOURCE_NEEDED guard prevents apply; requires D-61 |
| Demo seed import (4 claims, 12 truths from `src/seed-data.js` + `src/truth-seed.js`) | ❌ Not imported — existing demo seeds have empty `source_url`, guard will block apply |
| D-47 manual evidence lifecycle test | ❌ Not executed — gated by explicit per-session live-write approval |
| Production cleanup / archiving of old seed data | ❌ Not started — no old data exists (DB not seeded) |
| Score backfill for pre-D-50 claims | ❌ Optional, gated by explicit per-session D1 approval |

### Current seed data SOURCE_NEEDED status

`HUMANX_SEED` (`src/seed-data.js`) — all evidence `source_url` fields are empty string `''`.
This means `GET /api/import-seed?mode=apply` is currently **blocked** by the SOURCE_NEEDED
guard. This is correct: the demo data has no verified sources and must not enter production
as launch content without them.

`SEED_TRUTHS` (`src/truth-seed.js`) — no `source_url` field on truth items; SOURCE_NEEDED
guard does not apply to truths. However the content still requires human review before
any production import is authorized.

---

## 7. Safety Confirmation

| Rule | Status |
|------|--------|
| No import routes called in D-60 | ✅ Confirmed |
| No seed data imported | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
| No frontend changes | ✅ Confirmed |
| No workflow changes | ✅ Confirmed |
| No seed file data-content changes | ✅ Confirmed |

---

## 8. Next Safe Work

### Immediate (no gating required)

**D-61 — Source URL candidate worksheet**
Human research task. For each of the 25 launch claims in `docs/D55_LAUNCH_SEED_PACK_DRAFT.md`,
locate and record 1–3 candidate source URLs following the quality rules in
`docs/D56_LAUNCH_SEED_SOURCE_GATHERING_CHECKLIST.md`. Output: a working doc or updated
D-57 JSON draft with all SOURCE_NEEDED placeholders replaced by real, verified URLs.
No Worker changes. No D1. No imports. No seed file edits. Docs-only.

**Read Smoke (if re-run needed)**
GitHub Actions → HumanX Read Smoke → Run workflow on `main`. Read-only; no auth needed;
no write endpoints called.

### Gated (requires explicit per-session approval)

**D-62 — Final launch seed pack**
After D-61 sources verified and documented. Update seed data files with confirmed URLs
and finalized claim/evidence text. No import yet.

**D-63 — Gated dry-run import plan**
After D-62 finalized. Run `GET /api/import-seed?mode=dry-run` and `GET /api/import-truths?mode=dry-run`
to confirm report shape. Requires explicit per-session approval to call any import route.

**D-64 — Gated production import**
After D-63 dry-run reviewed and approved. Run `GET /api/import-seed?mode=apply` and
`GET /api/import-truths?mode=apply`. Requires explicit per-session D1/write approval
each time. Immediately followed by admin Review queue moderation of all newly-imported
`review_state='review'` content.

**D-47 manual evidence lifecycle test**
Gated by explicit per-session live-write approval. Full plan in
`docs/D47_EVIDENCE_MODERATION_MANUAL_TEST_PLAN.md`.

**Score backfill**
Optional. Batch `recalcClaimScore` across affected claims. Gated by explicit per-session
D1 approval. Scores self-correct on next write trigger.

---

## D-60 Completion Record

| Item | Status |
|------|--------|
| D-59 merge commit recorded | ✅ `1c32745` |
| All 8 route safety changes documented | ✅ |
| Static baseline confirmed 119 / 24 / 39 | ✅ |
| Read Smoke confirmed green | ✅ |
| No import routes called | ✅ |
| Remaining gaps documented (sources, JSON, import, cleanup) | ✅ |
| Next safe work documented (D-61 through D-64 sequence) | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No D1/Wrangler/live writes | ✅ |
