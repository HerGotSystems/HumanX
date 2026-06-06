# D-48: Evidence Moderation Platform Checkpoint

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes.

---

## Purpose

This document is a structured checkpoint covering the full evidence moderation
implementation sequence from D-40 (planning) through D-47 (manual test plan). It records
what is implemented, what is verified, what remains untested, and what the known
limitations are. It is the authoritative reference for the current state of evidence
moderation in HumanX.

---

## D-40 → D-47 Sequence Summary

| D | Type | What it did |
|---|------|-------------|
| D-40 | Docs-only | Phase 2 evidence moderation plan — schema proposal, backend route changes, frontend review UI changes, implementation sequence D-41 → D-44, out-of-scope list |
| D-41 | Docs-only | Migration proposal — `migrations/0007_add_evidence_review_state.sql` (`ALTER TABLE evidence ADD COLUMN review_state TEXT DEFAULT 'public'`; `report_count INTEGER DEFAULT 0`; two indexes); production apply gated on explicit approval |
| D-42A | Docs-only | Migration 0007 applied to production D1 via Cloudflare Console; preflight PRAGMA confirmed columns absent; post-apply PRAGMA confirmed `review_state TEXT DEFAULT 'public'` and `report_count INTEGER DEFAULT 0`; both indexes confirmed; 5 existing rows spot-checked all `public` / `0` |
| D-42B | Branch + PR | Backend: `insertEvidence` adds `review_state='review'`; `claimDetail` + `getClaim` filter `COALESCE(review_state,'public')='public'`; `evidence-vault.js` same filter; `reportTarget` adds evidence branch (auto-escalate at report_count ≥ 2); `reviewQueue` adds evidence query + `evidence` array + merged `review` array; `reviewDecision` adds evidence branch (update state, reset report_count, close reports) |
| D-43 | Direct main | Frontend: `reviewCard` and `renderReviewInspectPanel` handle `target_type='evidence'`; purple badge; evidence-specific inspect fields; study button → parent claim; dupSection/qhints hidden for evidence; `reviewDecisionUI` title fallback; quality filter skips evidence; `.b-purple` CSS; 2 hardening checks (108→110) |
| D-44 | Docs-only | D-43 live validation green; Actions Node warning root-caused |
| D-45 | CI | `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` added to workflow |
| D-46 | Docs-only | D-45 Read Smoke green; force override active; residual annotation is upstream metadata |
| D-47 | Docs-only | Evidence moderation manual test plan written; `HX_TEST_D47_` prefix; 5 tests A–E; not yet executed |

---

## What Is Implemented (Production)

### Schema — `evidence` table (migration 0007, D-42A)

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `review_state` | `TEXT` | `'public'` | Moderation state: `public`, `review`, `rejected`, `archived` |
| `report_count` | `INTEGER` | `0` | Cumulative user report count; auto-escalation trigger |
| `idx_evidence_review_state` | index | — | Query performance |
| `idx_evidence_report_count` | index | — | Query performance |

Existing evidence at migration time: all rows set to `review_state='public'`, `report_count=0`
by column default. No existing evidence was suppressed. `COALESCE(...,'public')` guards
protect any NULL rows from pre-migration inserts.

### Backend — `src/worker.js` (D-42B, merged PR #98)

| Function | Change |
|----------|--------|
| `insertEvidence` | `review_state='review'` added to INSERT; new evidence enters queue, not public |
| `claimDetail` | Both direct and reused evidence queries: `COALESCE(review_state,'public')='public'` filter |
| `getClaim` (`GET /api/claims/:id`) | Same filter on both evidence subqueries |
| `evidence-vault.js` | `COALESCE(e.review_state,'public')='public'` filter added alongside claim filter |
| `reportTarget` | Evidence branch: `UPDATE evidence SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END WHERE id=?`; auto-escalates at ≥ 2 reports |
| `reviewQueue` | Evidence SELECT added; `evidence` array in response; items merged into combined `review` array with `target_type='evidence'`; sort fallback uses `created_at` |
| `reviewDecision` | Evidence branch: `UPDATE evidence SET review_state=?, report_count=0 WHERE id=?`; closes open reports; allowed list updated to `['claim','truth','evidence']` |

### Frontend — `public/app-v10.js` + `public/styles.css` (D-43)

| Function | Change |
|----------|--------|
| `reviewCard` | `isEvidence` flag; title from `item.title`; purple `b-purple` badge; stance/quality metaParts; skip quality hints |
| `renderReviewInspectPanel` | `isEvidence` flag; evidence-specific fields (title, body, stance, quality, source link, parent_claim, claim_id); study button links to parent claim; Mark Duplicate and Dismiss ~Similar hidden; quality hints hidden |
| `reviewDecisionUI` | `item.title` in label fallback chain |
| `applyReviewFilter` | Quality filter skips evidence items |
| `renderReviewFilterBar` | Quality chip count skips evidence items |
| `styles.css` | `.b-purple { color: var(--purple); border-color: #a066ff66 }` |

### Static checks (D-43)

| Script | Count |
|--------|-------|
| `hardening-smoke-test.mjs` | **110 passed, 0 failed** (was 103 before D-41→D-43; +7 across sections 23 and 24) |
| `belief-engine-static-check.mjs` | **24 passed, 0 failed** (unchanged) |
| `worker-route-static-check.mjs` | **39 passed, 0 failed** (unchanged — no new routes) |

---

## What Is Verified

| Item | Method | Status |
|------|--------|--------|
| Migration 0007 columns present in production | PRAGMA table_info via D1 Console (D-42A) | ✅ Verified |
| Existing evidence unaffected (all `public` / `0`) | Spot-check 5 rows via D1 Console (D-42A) | ✅ Verified |
| Backend static checks pass (110/24/39) | `node scripts/hardening-smoke-test.mjs` + others (D-43) | ✅ Verified |
| Frontend JS parses without error | `node --check public/app-v10.js` (D-43) | ✅ Verified |
| Worker JS parses without error | `node --check src/worker.js` (D-43) | ✅ Verified |
| Cloudflare deploy green after D-43 push | Manual browser sanity — Home, Claims, Vault, RunPack (D-44) | ✅ Verified |
| Read Smoke green after D-43 push | GitHub Actions `HumanX Read Smoke` (D-44) | ✅ Verified |
| Read Smoke green after D-45 push | GitHub Actions `HumanX Read Smoke` (D-46) | ✅ Verified |

---

## What Is NOT Yet Verified

| Item | Reason | Blocker |
|------|--------|---------|
| New evidence enters `review_state='review'` in production | D-47 not executed | Requires explicit live-write approval |
| Evidence Vault hides pending evidence (live) | D-47 not executed | Requires explicit live-write approval |
| Study view hides pending evidence (live) | D-47 not executed | Requires explicit live-write approval |
| Admin can approve evidence → becomes public | D-47 not executed | Requires explicit live-write approval |
| Admin can reject evidence → stays hidden | D-47 not executed | Requires explicit live-write approval |
| Report escalation (≥ 2 reports → review) in browser | D-47 Test D conditional on UI path | Requires explicit live-write approval + UI path confirmation |
| RunPack excludes pending evidence (live) | D-47 not executed | Requires explicit live-write approval |
| Evidence review cards render correctly in live admin UI | No admin session run post-D-43 | Requires admin token + browser session |

---

## Known Limitations

### `recalcClaimScore` counts all evidence regardless of `review_state`

`recalcClaimScore` in `src/worker.js` was not changed in D-42B. It counts all evidence
rows for a claim without filtering by `review_state`. This means pending or rejected
evidence still contributes to the claim's `evidence_score`, `testability`, and
`survivability` meters displayed in the Study view and on claim cards.

**Impact:** Claim scores may be slightly inflated if a claim has pending or rejected evidence.
**Risk level:** Low — scores are advisory, not access-controlling.
**Fix path:** Add `WHERE review_state='public'` (or `COALESCE(review_state,'public')='public'`)
to the evidence COUNT and aggregation subquery inside `recalcClaimScore`. No schema change
required. Should be planned as a separate D (branch + PR; Worker change).

### Evidence report UI path may be incomplete

The `POST /api/report` endpoint supports `targetType='evidence'` (D-42B). Whether the
public UI exposes a Report button on individual evidence cards in the Study view is not
confirmed. D-47 Test D is therefore conditional. If no UI path exists, direct API calls
via DevTools console are available but require explicit per-session approval.

### GitHub Actions Node 20 annotation (cosmetic)

`actions/checkout@v4` and `actions/setup-node@v4` declare `using: node20` in their
release metadata. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` (D-45) forces wrappers to run
on Node 24, but the annotation persists as metadata noise. Non-blocking. Resolves when
`checkout@v5` / `setup-node@v5` publish with native Node 24 support.

### Initial evidence on new claims requires separate admin approval

When a user submits a claim with `initialEvidence`, both the claim and the initial evidence
enter `review_state='review'`. An admin approving the claim does not automatically approve
the evidence. The admin must separately approve each evidence item. An approved claim can
therefore have an empty public evidence list until its evidence is individually approved.
This is intentional (conservative first version).

---

## Safety Boundaries

| Boundary | Status |
|----------|--------|
| No hard deletes of evidence rows | ✅ All decisions set `review_state` only; rows preserved |
| No bulk cleanup | ✅ Archive available only for individual smoke/test artefacts via admin UI |
| No AI moderation | ✅ Out of scope; all decisions are manual admin actions |
| No D1 commands without explicit approval | ✅ Rule enforced per-session |
| No live write smoke without explicit approval | ✅ Rule enforced per-session |
| No migrations without explicit approval + PRAGMA verification | ✅ Rule enforced per-session |
| No Worker changes to main without branch + PR | ✅ Rule enforced |

---

## What Is Out of Scope (not planned)

From D-40 out-of-scope list — confirmed still out of scope:

- Hard delete of evidence rows
- Bulk evidence moderation
- AI-assisted moderation scoring
- Auto-rejection based on quality signals
- Evidence-level near-duplicate detection

---

## What Comes Next

| Step | When | Notes |
|------|------|-------|
| **Execute D-47 manual test plan** | On explicit user approval of live-write session | `docs/D47_EVIDENCE_MODERATION_MANUAL_TEST_PLAN.md` |
| **D-49 — Record D-47 results** | After D-47 execution | Pass/fail, evidence IDs, cleanup record |
| **`recalcClaimScore` audit** | Optional, future D | Branch + PR; no migration required; add `COALESCE(review_state,'public')='public'` filter to score aggregation |
| **Actions v5 upgrade** | When `checkout@v5` / `setup-node@v5` available | CI-only, direct main; drops `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` |
| **D-26 general manual test plan** | On explicit user approval | `docs/D26_MANUAL_LIVE_UI_TEST_PLAN.md` |

---

## D-48 Completion Record

| Item | Status |
|------|--------|
| D-40 → D-47 sequence summarised | ✅ Done |
| Implemented features documented | ✅ Done |
| Verified items listed | ✅ Done |
| Unverified items listed | ✅ Done |
| Known limitations recorded | ✅ Done |
| Safety boundaries confirmed | ✅ Done |
| Out-of-scope items confirmed | ✅ Done |
| `docs/PROJECT_STATE.md` updated | ✅ Done |
| No code changes | ✅ Confirmed |
| No workflow changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
