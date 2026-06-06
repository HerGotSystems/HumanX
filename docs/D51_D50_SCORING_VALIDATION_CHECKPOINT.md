# D-51: D-50 Scoring Validation Checkpoint

Date: 2026-06-06
Status: Docs-only. Direct main. No code changes.

---

## Purpose

Record the landing of D-50 (`scoring: count public evidence only`) and document what was
changed, what was verified statically, what remains to be verified live, and what the
known limitations are post-merge.

---

## D-50 Landing Record

| Item | Value |
|------|-------|
| Branch | `fix/d50-score-public-evidence-only` |
| Commit | `8ce32a8` |
| PR | #100 |
| Merged into | `main` |
| Merge commit | `619fdce` |
| Date | 2026-06-06 |

---

## What D-50 Changed

### `src/claim-scoring.js` — Evidence query filters

Both evidence queries inside `recalcClaimScore` now restrict to public evidence only.

**Direct evidence** (evidence attached to the claim directly):

```js
// Before (D-50)
SELECT quality, stance FROM evidence WHERE claim_id=?

// After (D-50)
SELECT quality, stance FROM evidence WHERE claim_id=? AND COALESCE(review_state,'public')='public'
```

**Reused evidence** (evidence shared to the claim via `evidence_claim_links`):

```js
// Before (D-50)
WHERE l.claim_id=?

// After (D-50)
WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'
```

`COALESCE(review_state,'public')` treats `NULL` rows (evidence inserted before migration 0007
in D-42A) as `public`, consistent with the D-42B policy used everywhere else.

**Effect:** Pending (`review_state='review'`) and rejected evidence are now excluded from
`evidence_score`, `survivability`, `contradictions`, and `status` calculations. Only
`review_state='public'` evidence (or `NULL` legacy rows) counts toward a claim's score.

---

### `src/worker.js` — `reviewDecision` evidence branch

Added `recalcClaimScore` call after admin decides on an evidence item:

```js
if (!row) return json({ error:'EVIDENCE_NOT_FOUND' },404);
if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(()=>null);
return json({ ok:true, targetType:'evidence', decision, item:row });
```

**Covers all three `reviewDecision` values:**

| Decision | Score effect |
|----------|-------------|
| `public` (approve) | Score recomputed to include newly-approved evidence |
| `rejected` | Score recomputed to exclude newly-rejected evidence |
| `review` (re-queue / keep pending) | Score recomputed to exclude re-queued evidence |

The `.catch(()=>null)` makes the recalc fail-safe — a DB error during scoring does not
fail the admin moderation action.

---

### `src/worker.js` — `reportTarget` evidence branch

Added `claim_id` pre-query and conditional `recalcClaimScore` call on first report escalation:

```js
if (targetType === 'evidence') {
  const evRow=await env.DB.prepare(`SELECT claim_id, report_count FROM evidence WHERE id=?`).bind(targetId).first();
  await env.DB.prepare(`UPDATE evidence SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=2 THEN 'review' ELSE review_state END WHERE id=?`).bind(targetId).run();
  if (evRow?.claim_id && (evRow.report_count+1)===2) await recalcClaimScore(env, evRow.claim_id).catch(()=>null);
}
```

The recalc fires only when `report_count` crosses from 1 to 2 (the exact escalation
threshold). Repeat reports on already-escalated evidence do not trigger extra recalcs.

**Effect:** When a publicly-approved evidence item accumulates its second report and is
auto-escalated to `review_state='review'`, the parent claim score is immediately updated
to exclude that evidence.

---

### `addEvidence` — no change

`addEvidence` retained its existing `recalcClaimScore` call. With the filter now in place,
new evidence inserted as `review_state='review'` is excluded from the score at submission
time — the call is a safe no-op for that path. The call remains correct for any future
insertion path where evidence enters directly as `public`.

---

### `scripts/hardening-smoke-test.mjs` — Section 25

Three checks added (110→113):

1. `recalcClaimScore` direct evidence query includes `COALESCE(review_state,'public')='public'`
2. `recalcClaimScore` reused evidence query includes `COALESCE(e.review_state,'public')='public'`
3. `reviewDecision` evidence branch calls `recalcClaimScore` after decision

Self-reference assertion updated from 110 → 113. `docs/README.md` count updated to match.

---

## Gap Scenarios Closed

From the D-49 audit (`docs/D49_SCORE_RECALC_EVIDENCE_REVIEW_AUDIT.md`):

| Scenario | Description | Closed by |
|----------|-------------|-----------|
| A | New pending evidence counted in score immediately at submission | `claim-scoring.js` query filter — pending evidence excluded at query time |
| B | Approving evidence does not recalculate score | `reviewDecision` evidence branch now calls `recalcClaimScore` |
| C | Rejecting evidence does not recalculate score | Same fix — all three decisions trigger recalc |
| D | Report escalation removes evidence from public view but not from score | `reportTarget` evidence branch now calls `recalcClaimScore` on first escalation |

---

## What Was NOT Changed

| Item | Status |
|------|--------|
| Score algorithm / formula | Unchanged — weights, `verdict()`, `qualityScore()`, `clamp()` all unchanged |
| Schema / D1 migrations | None — application code change only |
| Frontend | None |
| `pressure_points` query | Unchanged — pressure points have no `review_state` and are always counted |
| New API routes | None added |

---

## Static Checks (post-merge, on main)

Confirmed on `main` at `619fdce`:

| Script | Command | Result |
|--------|---------|--------|
| Hardening smoke | `node scripts/hardening-smoke-test.mjs` | **113 passed, 0 failed** |
| Belief engine | `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| Worker routes | `node scripts/worker-route-static-check.mjs` | **39 passed, 0 failed** |

Static baseline: **113 / 24 / 39**.

---

## Live / Read Verification Status

| Check | Status |
|-------|--------|
| `node --check src/claim-scoring.js` | ✅ exit 0 (confirmed on branch before merge) |
| `node --check src/worker.js` | ✅ exit 0 (confirmed on branch before merge) |
| Cloudflare deploy after merge | Not yet confirmed — run Read Smoke after deploy |
| HumanX Read Smoke (GitHub Actions) | Not yet triggered post-merge — trigger manually or wait for next PR |
| Live scoring behavior (write) | Not verified — requires D-47 manual test execution or separate write-smoke approval |

---

## Production Score Backfill — Not Performed

D-50 fixes the scoring logic going forward. It does **not** retroactively correct claim scores
for claims that accumulated stale scores before the fix landed.

### Why this is acceptable

1. **Scores are advisory.** `evidence_score`, `survivability`, and `status` are display
   indicators for users and analysts. They do not gate access to content and do not control
   which evidence is visible — those visibility guards (added in D-42B) operate independently.

2. **Scores self-correct.** Every path that calls `recalcClaimScore` now uses the filtered
   queries. The next time any evidence is submitted, reviewed, or reported on a claim, its
   score will recompute correctly from scratch. No batch operation is needed for the system
   to converge toward correct scores over time.

3. **Volume is bounded.** As of D-42B, all new evidence enters `review_state='review'`. Only
   evidence approved since D-42B merge was ever legitimately `public`. The backlog of stale
   scores is therefore limited to the period between D-42B merge (evidence moderation launched)
   and D-50 merge (score filter applied).

4. **Risk of backfill is non-zero.** A batch `recalcClaimScore` across all claims requires
   D1 access, a controlled script, and explicit per-session user approval. Running it
   unsupervised risks partial update, race conditions, or unexpected status flips. It is not
   included in D-50.

### Optional one-time backfill

A batch score recalculation for all affected claims remains possible. It requires:

- Explicit per-session user approval
- A controlled script (not part of D-50)
- Confirmation of D1 access before execution
- Review of which claims will have their `status` string changed (e.g., `Plausible` →
  `Weak Evidence`) as a side effect

This is a separate optional D (not yet planned). No backfill was performed in D-50 or D-51.

---

## Remaining Verification

| Item | When | Method |
|------|------|--------|
| Read Smoke green post-deploy | After next Cloudflare deploy or PR trigger | GitHub Actions — HumanX Read Smoke |
| Submit evidence → stays hidden from score | After explicit D-47 approval | D-47 Test A (new evidence not in score until approved) |
| Approve evidence → score updates | After explicit D-47 approval | D-47 Test B (approve evidence, confirm score recalculates) |
| Reject evidence → score updates | After explicit D-47 approval | D-47 Test C (reject evidence, confirm score does not include it) |
| Report escalation → score updates | After explicit D-47 approval | D-47 Test D (conditional on evidence report UI path) |
| Batch score backfill | Optional, separate D | Requires explicit D1 approval per-session |

---

## Known Limitations

### Existing stale scores

Claim scores that were computed during the period between D-42B (evidence moderation
launched) and D-50 (score filter applied) may still reflect pending or rejected evidence.
These will self-correct on the next scoring trigger for each affected claim (next evidence
submission, review decision, or pressure addition). No immediate backfill was performed.

### No live write smoke performed

D-51 does not execute any write-endpoint tests. Live scoring behavior is unverified until
D-47 is explicitly approved and run.

### Evidence report UI path uncertain

D-47 Test D (report escalation → score recalc) is conditional on whether the public UI
exposes a Report button on evidence cards in the Study view. If no UI path exists, Test D
must be executed via DevTools API call, which requires explicit per-session approval.

---

## D-51 Completion Record

| Item | Status |
|------|--------|
| D-50 commit and PR confirmed landed on main | ✅ `8ce32a8` / PR #100 / merge `619fdce` |
| Score filter changes documented (direct + reused evidence) | ✅ |
| `reviewDecision` evidence recalc documented | ✅ |
| `reportTarget` evidence escalation recalc documented | ✅ |
| Gap scenarios A–D confirmed closed | ✅ |
| No algorithm / formula changes confirmed | ✅ |
| No migration performed | ✅ |
| Static checks confirmed on main: 113/24/39 | ✅ |
| Production score backfill: not performed, rationale documented | ✅ |
| Self-correction behavior documented | ✅ |
| Optional backfill path documented | ✅ |
| Remaining verification items listed | ✅ |
| Known limitations recorded | ✅ |
| `docs/PROJECT_STATE.md` updated | ✅ |
| No code changes | ✅ Confirmed |
| No Worker changes | ✅ Confirmed |
| No workflow changes | ✅ Confirmed |
| No D1 commands | ✅ Confirmed |
| No Wrangler | ✅ Confirmed |
| No migrations | ✅ Confirmed |
| No live write smoke | ✅ Confirmed |
| No production mutations | ✅ Confirmed |
