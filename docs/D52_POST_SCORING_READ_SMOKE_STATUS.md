# D-52: Post-Scoring Read Smoke and Platform Status

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes.

---

## Purpose

Record the platform status after D-50 (scoring fix) and D-51 (validation checkpoint) landed
on main, confirm HumanX Read Smoke green post-deploy, and establish a clean baseline for
what is verified, what is not yet verified, and what the next safe work is.

---

## D-50 / D-51 Status on Main

| Item | Value |
|------|-------|
| D-50 commit | `8ce32a8` — scoring: count public evidence only |
| D-50 PR | #100 (merged) |
| D-50 merge commit | `619fdce` |
| D-51 commit | `20bad43` — docs: record scoring validation checkpoint |
| HEAD on main | `20bad43` |
| Static baseline | **113 / 24 / 39** |

---

## HumanX Read Smoke — Post D-51 Push

| Item | Result |
|------|--------|
| Trigger | Manual — GitHub Actions → HumanX Read Smoke → Run workflow |
| Branch | `main` |
| Commit | `20bad43` |
| Result | ✅ **Green — all endpoint groups passed. Exit 0.** |

Read Smoke confirms all live public read endpoints are reachable and responsive after
the D-50 scoring changes deployed to production. No regressions detected.

---

## Static Checks on Main

Confirmed at `20bad43`:

| Script | Result |
|--------|--------|
| `node scripts/hardening-smoke-test.mjs` | **113 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `node scripts/worker-route-static-check.mjs` | **39 passed, 0 failed** |

---

## Evidence Moderation Stack — Full Status

### Schema (D-42A)

| Column | Table | Status |
|--------|-------|--------|
| `review_state TEXT DEFAULT 'public'` | `evidence` | ✅ Live in production |
| `report_count INTEGER DEFAULT 0` | `evidence` | ✅ Live in production |
| `idx_evidence_review_state` | index | ✅ Live in production |
| `idx_evidence_report_count` | index | ✅ Live in production |

Migration 0007 applied 2026-06-06. Existing rows: all `review_state='public'`, `report_count=0`.
Do not re-apply.

### Backend (D-42B — merged PR #98)

| Function | Behaviour | Status |
|----------|-----------|--------|
| `insertEvidence` | New evidence enters with `review_state='review'` — not public | ✅ Live |
| `claimDetail` | Both direct + reused evidence queries filter `COALESCE(review_state,'public')='public'` | ✅ Live |
| `getClaim` | Same filter on both evidence subqueries | ✅ Live |
| `evidence-vault.js` | Same filter on vault query | ✅ Live |
| `reportTarget` (evidence) | Auto-escalates to `review_state='review'` at `report_count>=2` | ✅ Live |
| `reviewQueue` | Evidence items included in queue; `target_type='evidence'` in merged `review` array | ✅ Live |
| `reviewDecision` (evidence) | Updates `review_state`, resets `report_count=0`, closes open reports | ✅ Live |

### Scoring (D-50 — merged PR #100)

| Function | Behaviour | Status |
|----------|-----------|--------|
| `recalcClaimScore` direct query | `COALESCE(review_state,'public')='public'` filter applied | ✅ Live |
| `recalcClaimScore` reused query | `COALESCE(e.review_state,'public')='public'` filter applied | ✅ Live |
| `reviewDecision` evidence | Calls `recalcClaimScore` after decision (approve / reject / re-queue) | ✅ Live |
| `reportTarget` evidence | Calls `recalcClaimScore` on parent claim at first escalation (report 2) | ✅ Live |
| `addEvidence` | Existing recalc call retained (safe no-op for pending evidence) | ✅ Live |

### Frontend (D-43)

| Component | Behaviour | Status |
|-----------|-----------|--------|
| `reviewCard` | `isEvidence` flag; purple `b-purple` badge; title from `item.title`; stance/quality metaParts; quality hints skipped | ✅ Live |
| `renderReviewInspectPanel` | Evidence-specific fields; study button → parent claim; dupSection/qhints hidden | ✅ Live |
| `reviewDecisionUI` | `item.title` fallback in label | ✅ Live |
| `applyReviewFilter` / `renderReviewFilterBar` | Quality filter skips evidence items | ✅ Live |
| `styles.css` | `.b-purple { color: var(--purple); border-color: #a066ff66 }` | ✅ Live |

### CI

| Item | Status |
|------|--------|
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` in workflow (D-45) | ✅ Active |
| Read Smoke green post D-51 push | ✅ Confirmed (this D) |

---

## What Is NOT Yet Verified

| Item | Reason | Blocker |
|------|--------|---------|
| New evidence enters `review_state='review'` in production (live write) | D-47 not executed | Requires explicit live-write approval |
| Evidence Vault hides pending evidence (live) | D-47 not executed | Requires explicit live-write approval |
| Study view hides pending evidence (live) | D-47 not executed | Requires explicit live-write approval |
| Approve evidence → score recalculates (live) | D-47 Test B + D-50 scoring | Requires explicit live-write approval |
| Reject evidence → score corrects (live) | D-47 Test C + D-50 scoring | Requires explicit live-write approval |
| Report escalation → score recalculates (live) | D-47 Test D (conditional on UI path) | Requires explicit live-write approval + UI path confirmation |
| RunPack excludes pending evidence (live) | D-47 Test E | Requires explicit live-write approval |
| Production score backfill/recalc | Intentionally deferred | Requires explicit D1 approval + controlled script |
| Admin browser session post-D-43 | Not run post-merge | Requires admin token + browser session |

---

## Known Limitations

### Stale production scores from the D-42B → D-50 gap period

Claim scores computed between D-42B merge (evidence moderation launched, new evidence enters
`review_state='review'`) and D-50 merge (score filter applied) may still reflect pending or
rejected evidence. These scores will self-correct the next time any evidence or pressure
event triggers `recalcClaimScore` for the affected claim. No batch backfill was performed.

**Backfill option:** A one-time batch recalculation across all claims is possible. It requires
explicit per-session D1 approval, a controlled script (not yet written), and review of which
`status` strings will change as a side effect. This is a separate optional D, not yet planned.

### D-47 manual evidence lifecycle test not yet executed

The full evidence moderation flow (submit → pending → approve/reject → score update → RunPack
exclusion) has not been verified via a live browser test. `docs/D47_EVIDENCE_MODERATION_MANUAL_TEST_PLAN.md`
contains the full plan. Execution requires explicit per-session live-write approval.

### Evidence report UI path uncertain

Whether the public UI exposes a Report button on evidence cards in the Study view has not
been confirmed via live browser session. D-47 Test D is therefore conditional.

### GitHub Actions Node 20 annotation (cosmetic)

`actions/checkout@v4` and `actions/setup-node@v4` declare `using: node20` in their release
metadata. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` (D-45) forces wrappers to run on Node 24.
The annotation persists as upstream metadata noise. Non-blocking. Resolves when `checkout@v5`
/ `setup-node@v5` publish with native Node 24 support.

---

## Safety Boundaries

| Boundary | Status |
|----------|--------|
| No hard deletes of evidence rows | ✅ All decisions set `review_state` only |
| No bulk cleanup | ✅ Archive available only for individual smoke/test artefacts via admin UI |
| No AI moderation | ✅ Out of scope |
| No D1 commands without explicit approval | ✅ Rule enforced per-session |
| No live write smoke without explicit approval | ✅ Rule enforced per-session |
| No migrations without explicit approval + PRAGMA verification | ✅ Rule enforced per-session |
| No Worker changes to main without branch + PR | ✅ Rule enforced |
| No Co-Authored-By | ✅ Rule enforced |

---

## Next Safe Work

| Priority | Item | Gating condition |
|----------|------|-----------------|
| 1 | **Execute D-47 manual test plan** | Explicit per-session live-write approval; `HX_TEST_D47_` prefix |
| 2 | **Optional score backfill** | Explicit per-session D1 approval; controlled script required |
| 3 | **Optional seed-data quality audit / plan** | No approval needed for docs-only plan; D1 commands need approval if any queries are run |
| 4 | **Actions v5 upgrade** | When `checkout@v5` / `setup-node@v5` available with native Node 24 support |
| 5 | **D-26 general manual test plan** | Explicit per-session live-write approval |

---

## D-52 Completion Record

| Item | Status |
|------|--------|
| D-50 / D-51 landing confirmed on main | ✅ |
| HumanX Read Smoke confirmed green post-D-51 push | ✅ |
| Static checks confirmed on main: 113/24/39 | ✅ |
| Evidence moderation schema status documented | ✅ |
| Evidence moderation backend status documented | ✅ |
| Evidence moderation scoring status documented | ✅ |
| Evidence moderation frontend status documented | ✅ |
| Unverified items listed | ✅ |
| Known limitations recorded | ✅ |
| Safety boundaries confirmed | ✅ |
| Next safe work listed | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No workflow changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
