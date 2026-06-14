# D-128H Deploy Checklist — Structured Claim Builder Persistence

**Date:** 2026-06-14
**Basis:** D-128C (PR #187) + D-128D (PR #188) + D-128E (PR #189) + D-128F (PR #190) all merged into main at `49571ac`.

This checklist must be completed by the owner before and after running `wrangler deploy`.

---

## Pre-deploy: Merged chain confirmed

| Task | PR | Status |
|---|---|---|
| D-128C — Worker write path (`src/claim-builder-contexts.js`, `src/worker.js`, `src/truths.js`) | #187 | ✅ merged |
| D-128D — Review API read path (`attachClaimBuilderContexts` in `reviewQueue()`) | #188 | ✅ merged |
| D-128E — Frontend sends structured `claim_builder` payload (`builderPayload()`, both submit functions) | #189 | ✅ merged |
| D-128F — Review UI structured-first display (`reviewBuilderContextHtml()` prefers `item.claimBuilderContext`) | #190 | ✅ merged |

---

## Pre-deploy: Production D1 state

| Check | How to verify | Status |
|---|---|---|
| `claim_builder_contexts` table exists | Cloudflare D1 console → HumanX DB → Tables list, or `SELECT name FROM sqlite_master WHERE type='table' AND name='claim_builder_contexts';` | Owner must confirm |
| Table columns match migration `0006` schema | Check columns: id, target_type, target_id, user_id, route, version, raw_text, why_user_thinks_this, scope, pressure_or_falsifier, draft_claim, final_claim, category, claim_type, system_flags_json, created_at, updated_at | Owner must confirm |
| `d1_migrations` bookkeeping | `SELECT * FROM d1_migrations ORDER BY id;` — confirm `0006_claim_builder_contexts.sql` is present OR table was created manually (both are acceptable) | Owner must confirm |
| `evidence_claim_links` dedupe applied | `SELECT evidence_id, claim_id, COUNT(*) FROM evidence_claim_links GROUP BY evidence_id, claim_id HAVING COUNT(*) > 1;` — expect 0 rows | Owner confirmed (D-128H repair plan) |

> The `claim_builder_contexts` table was created directly in production D1 before D-128C was merged. If it is not yet in `d1_migrations`, this is non-blocking — the table already exists and Wrangler will not attempt to recreate it.

---

## Pre-deploy: Static checks (run on main at `49571ac`)

```
node --check src/worker.js                    →  syntax OK (exit 0)
node --check src/truths.js                    →  syntax OK (exit 0)
node --check src/claim-builder-contexts.js    →  syntax OK (exit 0)
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed (24 hard checks)
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed (56 hard checks)
```

All checks passed at pre-deploy verification (2026-06-14).

---

## Deploy command

```sh
wrangler deploy
```

Standard deploy from the repo root. No flags needed. No D1 migration flags — the table already exists in production.

> Do NOT run `wrangler d1 execute` — no schema change is required.

---

## Post-deploy: Owner smoke steps

Run these manually after `wrangler deploy` completes successfully.

1. **Submit a Claim Builder claim**
   - Open `https://humanx.rinkimirikata.com`
   - Start a new Claim Builder session
   - Complete all 3 steps (raw thought → testable → final claim)
   - Submit via the **Submit Claim** button on Step 3
   - Confirm the success toast / redirect to review state

2. **Open Admin Review**
   - Navigate to the admin review panel
   - Locate the newly submitted item

3. **Inspect the new item**
   - Open the review inspect panel for the claim
   - Confirm the Claim Builder context panel is visible

4. **Verify structured badge**
   - Confirm the header shows a green **`structured`** badge
   - Confirm fields are populated: ORIGINAL USER TEXT, WHY USER THINKS THIS, SCOPE, PRESSURE / FALSIFIER, SYSTEM FLAGS

5. **Verify legacy fallback on old items (if any pre-D-128C items exist in queue)**
   - Inspect an older item (submitted before this deploy)
   - Confirm it shows yellow **`legacy parsed`** badge (or no context panel if it was submitted without Claim Builder)

6. **Approve/reject still works**
   - Approve or reject an item in the review queue
   - Confirm the action completes without error

7. **Public claim page still works**
   - Navigate to the public claim page for an approved claim
   - Confirm the claim renders correctly

---

## Post-deploy: Record result

Update this file after deploy with actual result:

```
Deploy date: ___________
Deployed by: ___________
wrangler deploy output: PASS / FAIL
Smoke steps: PASS / FAIL
Notes: ___________
```

---

## Rollback plan

If any smoke step fails after deploy:
1. Identify the failing component (Worker, frontend, Review UI).
2. Worker issues: the only new Worker paths are guarded by `body.claim_builder` presence — requests without it are unaffected. No rollback needed for missing context data.
3. Review UI issues: `reviewBuilderContextHtml()` falls back gracefully to legacy parse or returns `''` if neither path has data. No user-facing breakage expected.
4. If deploy itself is broken: `wrangler rollback` to restore the previous Worker version.

No D1 schema rollback is required — the `claim_builder_contexts` table is additive and no existing tables were modified.
