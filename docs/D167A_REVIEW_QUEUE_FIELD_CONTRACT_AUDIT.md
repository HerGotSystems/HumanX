# D-167A — Review Queue Field Contract Audit

**Date:** 2026-06-25
**Scope:** Audit only. No code changes. No migration. No wrangler.toml. No owner-token work.
**Trigger:** D-166B replaced the review queue `claims` SELECT `c.*` wildcard with an explicit 21-column allowlist. This audit verifies the frontend Review UI still receives every field it actually uses.

---

## Executive Summary

**Verdict: D-166B explicit SELECT is complete and correct.**

Every field accessed by the frontend Review UI is present in the D-166B explicit claims SELECT or is computed/attached by a separate mechanism (`attachClaimBuilderContexts`). The five columns dropped from the old `c.*` wildcard (`supporters`, `challengers`, `belief_yes`, `belief_no`, `uncertainty`) are confirmed unused by any review rendering, filtering, sorting, or inspection code.

No code changes are required as a result of this audit.

---

## What D-166B Changed

**Before:**
```sql
SELECT 'claim' AS target_type, c.*, u.handle, ... FROM claims c ...
```

**After (D-166B):**
```sql
SELECT 'claim' AS target_type,
  c.id, c.user_id, c.claim, c.category, c.type, c.status,
  c.evidence_score, c.survivability, c.testability, c.contradictions, c.report_count,
  c.review_state, c.normalized_claim, c.duplicate_of, c.near_duplicate_of,
  c.damage, c.status_locked, c.archived_by_user, c.created_at, c.updated_at,
  u.handle,
  (SELECT tcl.truth_id FROM truth_claim_links ...) AS source_truth_id,
  (SELECT r.reason FROM reports ...) AS latest_report_reason
FROM claims c LEFT JOIN users u ON u.id=c.user_id ...
```

The truths, evidence, and pressure SELECTs in `reviewQueue()` were **not changed** by D-166B. This audit focuses on the claims SELECT.

---

## Field Contract Table — Claims

Each row documents one field accessed by the Review UI in `public/app-v10.js`.

| Field (DB column / alias) | D-166B SELECT | Where used in app-v10.js | Status |
|---|---|---|---|
| `target_type` | `'claim' AS target_type` ✓ | `reviewCard`, `renderReviewInspectPanel`, `applyReviewFilter`, `applyReviewSort`, `reviewDecisionUI` — type dispatch everywhere | **Required** |
| `id` | `c.id` ✓ | Every review function — identity key | **Required** |
| `claim` | `c.claim` ✓ | `reviewCard` title, `renderReviewInspectPanel`, `isSuspectedTestArtefact`, `isClaimCategoryEcho`, quality hints, inspect | **Required** |
| `review_state` / `reviewState` | `c.review_state` ✓ | `applyReviewFilter`, `reviewCard` badge, inspect panel state bar, `reviewStateLabel`, audit summary | **Required** |
| `report_count` / `reportCount` | `c.report_count` ✓ | `applyReviewFilter` reported filter, `applyReviewSort` reported sort, review card badge, inspect panel | **Required** |
| `category` | `c.category` ✓ | `reviewCard` meta, `isClaimCategoryEcho`, inspect panel | **Required** |
| `type` | `c.type` ✓ | `isTruthDerivedClaim` (`item.type === 'truth-derived'`), inspect panel Claim Type | **Required** |
| `status` | `c.status` ✓ | Inspect panel Status field | **Required** |
| `evidence_score` / `evidenceScore` | `c.evidence_score` ✓ | `reviewCard` score hint (`ev:N`), `isLikelyBorderlineDerivedClaim` (threshold ≤10), inspect panel Evidence | **Required** |
| `testability` | `c.testability` ✓ | `reviewCard` score hint (`ts:N`), inspect panel Testability | **Required** |
| `survivability` | `c.survivability` ✓ | `reviewCard` score hint (`sv:N`), inspect panel Survivability | **Required** |
| `contradictions` | `c.contradictions` ✓ | Inspect panel Pressure Points count | **Required** |
| `near_duplicate_of` / `nearDuplicateOf` | `c.near_duplicate_of` ✓ | `applyReviewFilter` similar filter, `applyReviewSort` similar sort, `~similar` badge, inspect panel similar note and Dismiss Similar button, audit summary | **Required** |
| `duplicate_of` / `duplicateOf` | `c.duplicate_of` ✓ | `applyReviewFilter` duplicate filter, inspect panel Duplicate Of field, `dup` chip | **Required** |
| `normalized_claim` | `c.normalized_claim` ✓ | Inspect panel Normalized Key field (admin dedup display only, capped at 60 chars) | **Admin-only, intentional** |
| `damage` | `c.damage` ✓ | Inspect panel Damage field | **Admin-only, intentional** |
| `user_id` | `c.user_id` ✓ | Inspect panel User ID field (moderation provenance) | **Admin-only, intentional** |
| `status_locked` / `statusLocked` | `c.status_locked` ✓ | `reviewCard` lock chip (🔒), inspect panel Status Lock field | **Required** |
| `archived_by_user` | `c.archived_by_user` ✓ | Used in backend WHERE clause; passed through to frontend but not displayed directly | **Optional (passed through)** |
| `created_at` / `createdAt` | `c.created_at` ✓ | `reviewAge()`, `applyReviewSort`, inspect panel Created field | **Required** |
| `updated_at` / `updatedAt` | `c.updated_at` ✓ | `reviewAge()`, `applyReviewSort`, inspect panel Updated field | **Required** |
| `handle` | `u.handle` via JOIN ✓ | `reviewCard` handle chip, `reviewItemOriginLabel`, `isSuspectedTestArtefact`, inspect panel Submitted By | **Required** |
| `source_truth_id` | subquery ✓ | `isSuspectedTestArtefact` (`/^tru_seed_/.test(source_truth_id)`), inspect panel Source Truth field | **Required** |
| `latest_report_reason` | subquery ✓ | `reviewCard` reason tag, inspect panel Report Reason | **Required** |
| `claimBuilderContext` / `claim_builder_context` | `attachClaimBuilderContexts()` — attached after SELECT | `reviewCard` builder chip, `reviewBuilderContextHtml`, inspect panel builder context block | **Required (computed, not from claims table)** |

**Total claims fields used by frontend: 25**
**All 25 accounted for in D-166B SELECT or by `attachClaimBuilderContexts()`.**

---

## Dropped Columns — Confirmed Unused in Review UI

These columns were previously included silently via `c.*` and are absent from the D-166B explicit SELECT.

| Column | Why dropped | Review UI usage |
|---|---|---|
| `supporters` | Unused in review rendering, filter, sort, inspect | **None** — only used in public `card()` via `mapClaim()` as `beliefYes` |
| `challengers` | Unused in review rendering | **None** |
| `belief_yes` | Vote counts not shown in review queue | **None** — `card()` shows them, `reviewCard()` does not |
| `belief_no` | Vote counts not shown in review queue | **None** |
| `uncertainty` | Vote counts not shown in review queue | **None** |

The review queue is an admin moderation surface, not a public voting surface. Vote counts are intentionally absent from review cards and inspect panels.

---

## Legacy Field Clarification: `initial_evidence` / `initialEvidence`

The frontend `reviewBuilderContextHtml()` and `reviewCard()` reference `item.initialEvidence || item.initial_evidence`. This warrants clarification:

- `initial_evidence` is **not a column in the `claims` table**. The `createClaim()` handler reads `body.initialEvidence` from the POST body and inserts it as a separate evidence row (`insertEvidence()`). It is never written to a claims column.
- The `c.*` wildcard in the old SELECT never produced `initialEvidence` or `initial_evidence` on claim rows.
- The frontend fallback for legacy claim-row builder context is therefore a no-op for claim items: `item.initialEvidence` and `item.initial_evidence` are always undefined on review claim rows, before and after D-166B.
- For evidence review items (a separate `evidenceRows` SELECT), `item.body` is populated and the `parseClaimBuilderContext(item.body)` path works correctly for legacy D-127B submissions.

**Conclusion: no gap introduced by D-166B here. This fallback path was always empty for claim rows.**

---

## Truths, Evidence, and Pressure SELECTs

These were not changed by D-166B. For completeness:

**Truths SELECT:** uses `t.*` (still wildcard). The `truths` table has no sensitive user-moderation fields — `is_shadow_banned` is on the `users` table, not `truths`. The wildcard on truths is lower risk than on claims because the truths table schema is narrower and the review UI reads all meaningful truth columns (statement, category, origin, truth_type, confidence_label, repetition_score, pressure_score, linked_claim_id, etc.).

**Evidence SELECT:** explicit named columns — `id, claim_id, user_id, title, body, source_url, stance, quality, review_state, report_count, created_at, handle, parent_claim, latest_report_reason`. All fields used by the evidence inspect panel are present.

**Pressure SELECT:** explicit named columns — `id, claim_id, title, body, severity, review_state, report_count, created_at, updated_at, parent_claim, handle`. All fields used by the pressure inspect panel are present.

---

## Security Properties Verified

| Property | Status |
|---|---|
| `normalized_claim` admin-only | ✓ Only returned by `/api/review` (requireAdmin-gated). Not in any public route. Only shown in inspect panel. |
| `damage` admin-only | ✓ Only in review queue claims SELECT. Not in `mapClaim()` (public route helper). Only shown in inspect panel. |
| `user_id` admin-only | ✓ Only in review queue claims SELECT (and evidence/pressure SELECT). Not in `mapClaim()`. Shown as moderation provenance in inspect panel only. |
| Public routes still use `mapClaim()` | ✓ `listClaims`, `getClaim`, `reviewDecision`, `markDuplicate` all use `mapClaim()` which includes only public-safe fields. |
| `is_shadow_banned` absent from own-user responses | ✓ Confirmed absent from `getMe()`, `myHumanX()`, `exportMyHumanX()`, `redeemInviteCode()` by D-166B and live-verified by D-166D. |
| Review routes requireAdmin-gated | ✓ All five routes (`/api/review`, `/api/review/decision`, `/api/review/cleanup`, `/api/review/mark-duplicate`, `/api/review/resolve-similar`) call `requireAdmin(request, env)` as first statement. |
| Shadow-ban enforcement intact | ✓ `requireUser()` still reads `is_shadow_banned` from DB and throws `USER_SHADOW_BANNED` if set. |

---

## D-167B Recommended Fixes

**None required.**

The D-166B explicit SELECT is complete. No missing fields, no broken UI paths, no security regressions. No code changes are needed as a result of this audit.

If a future migration adds a column to the `claims` table, the explicit SELECT will correctly **exclude** it from the review queue until deliberately added — this is the intended protection of replacing `c.*`.

---

## No Code Changes in This Task

- `src/worker.js` — not touched
- `public/app-v10.js` — not touched
- No route added, removed, or changed
- No admin-token or owner-token logic changed
- No migration
- No `wrangler.toml`
- No owner-token work resumed — D-149H hold remains in effect

---

## Smoke Tests

Baseline unchanged: **1223/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1223 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this task.
