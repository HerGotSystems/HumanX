# D-90H — Pressure Moderation Live Verification Checkpoint

**Date:** 2026-06-08
**Type:** Docs-only checkpoint (direct main)
**Static checks:** 196 / 24 / 39

---

## 1. Scope and safety

This document records the live verification outcome for the pressure point moderation stack
(D-90A through D-90G). No code changes, no D1 commands, no Wrangler, no live write calls,
no moderation actions were taken as part of D-90H itself. Moderation actions during live
testing were performed by the admin in a real browser session with explicit approval.

---

## 2. Migration confirmation

Production D1 migration 0009 was applied manually via Cloudflare D1 Console.

**Migration file:** `migrations/0009_add_pressure_review_state.sql`

**PRAGMA confirmation (post-apply):**

| Column | Type | Default |
|---|---|---|
| `review_state` | TEXT | `'public'` |
| `report_count` | INTEGER | `0` |
| `updated_at` | INTEGER | *(null)* |

All three columns confirmed present in `pressure_points` table before D-90B/D-90G were
deployed. No existing pressure rows were affected (backfill not needed; `COALESCE` filter
used throughout).

---

## 3. PR / commit sequence

| Step | PR / Commit | Branch | Notes |
|---|---|---|---|
| D-90B backend | PR #108 (`b69fac8` / `758bea1`) | `feature/d90b-pressure-moderation-backend` | Merged to main |
| D-90C frontend | PR #109 (`0ed9908`) | `feature/d90c-pressure-moderation-frontend` | Stacked on D-90B branch — never reached main directly |
| D-90G fix | PR #110 (`776a639`) | `fix/d90g-pressure-review-ui-clarity` | Cherry-picked D-90C (`a57d2e7`) + D-90G additions; merged to main |
| **Current HEAD** | `1162d81` | `main` | Merge commit for PR #110 |

**Why D-90C did not land via its own PR:**
PR #109 targeted `feature/d90b-pressure-moderation-backend`, not `main`. When D-90B was
merged (PR #108), only the backend changes landed. The frontend `isPressure` branches in
`app-v10.js` were missing from production until D-90G cherry-picked them.

---

## 4. Live test results

**Overall verdict: PASS WITH UI NOTES**

All core pressure moderation lifecycle paths confirmed working in production.

| Test | Result |
|---|---|
| New pressure point enters Review (not public) | ✅ PASS |
| Pressure item appears in Review queue | ✅ PASS |
| Inspect panel shows Title | ✅ PASS |
| Inspect panel shows Body | ✅ PASS |
| Inspect panel shows Severity | ✅ PASS |
| Inspect panel shows Parent Claim | ✅ PASS |
| Inspect panel shows Claim ID | ✅ PASS |
| Inspect panel shows Submitted By | ✅ PASS |
| Inspect panel shows Review State | ✅ PASS |
| Inspect panel shows Report Count (where available) | ✅ PASS |
| Approve action works | ✅ PASS |
| Reject action works | ✅ PASS |
| Rejected pressure remains non-public | ✅ PASS |
| Side panel copy explains Review-first flow | ✅ PASS |
| Side panel copy says "New items enter Review first" | ✅ PASS |
| Pending items noted as private | ✅ PASS |
| RunPack note says approved public items only | ✅ PASS |
| Graph totals labelled "Global graph totals" | ✅ PASS |
| Pressure cards show pressure title (not "Claim") | ✅ PASS |
| Pressure cards show orange badge | ✅ PASS |
| "NEEDS SHARPENING" does NOT appear on pressure cards | ✅ PASS |
| No claim-quality score/category row on pressure cards | ✅ PASS |
| No duplicate controls on pressure inspect panel | ✅ PASS |

---

## 5. What passed (summary)

The full pressure moderation lifecycle is operational:

- **Submission path**: `addPressure` inserts `review_state='review'`; no immediate score recalc.
- **Visibility filter**: `getClaim`, `claimDetail`, `recalcClaimScore`, `createAipPacket` all
  filter pressure with `COALESCE(review_state,'public')='public'`. Pending pressure is not
  counted in scores and not included in RunPacks.
- **Review queue**: `reviewQueue` returns pressure items alongside claims, truths, and evidence.
  Frontend filter chip, audit summary stat, and inspect panel all handle `target_type:'pressure'`
  correctly.
- **Moderation actions**: `reviewDecision` pressure branch approves/rejects and triggers
  `recalcClaimScore`. Approved pressure becomes public and affects the claim score.
  Rejected pressure stays hidden.
- **Report escalation**: `reportTarget` pressure branch auto-escalates at `report_count >= 2`.
- **Frontend review UI**: `reviewCard` renders pressure title, severity/handle/parent meta,
  orange badge, no quality hints, no dup controls. `renderReviewInspectPanel` renders
  all pressure-specific fields and a "Study Parent Claim" button.

---

## 6. Remaining UI notes (non-blocking)

These are cosmetic/polish items. None block the pressure moderation stack.

### 6a. Long pressure body in Inspect panel

When a pressure item contains pasted JSON, a long AI analysis return, or several
paragraphs of text, the Body field in the Inspect panel can become very tall and dense,
pushing other fields below the visible area.

**Proposed fix (D-91B):** Cap the body field at a max height with vertical scroll, or
collapse it behind a `<details>` toggle when it exceeds ~300 characters.
Affects: `renderReviewInspectPanel` body field render in `public/app-v10.js`.

### 6b. Old demo/test claims in Review queue

Several pre-D-84/D-85 claims were returned to review but not yet fully actioned.
They appear alongside real pressure items, diluting the Review queue scanability.

**Proposed fix (D-91A):** Review queue density cleanup — batch-action remaining
old test/demo review items; consider origin-label filter persistence.

---

## 7. What NOT to do next

- Do **not** re-apply migration 0009. It is live. Re-applying will fail with "duplicate column".
- Do **not** merge PR #109 (D-90C stacked branch). Its changes are already on main via
  PR #110 cherry-pick. Merging PR #109 would create a double-application of the same
  frontend changes and potentially cause conflicts.
- Do **not** run any D1/Wrangler commands without explicit per-session approval and a PRAGMA preflight.
- Do **not** make moderation decisions on live data without explicit per-session approval.
- Do **not** push directly to main with code changes (branch + PR required).

---

## 8. Recommended next batches

| Batch | Type | Description |
|---|---|---|
| **D-91A** | Frontend / docs | Review queue density cleanup — batch-action remaining old test/demo review items; origin-label filter persistence |
| **D-91B** | Frontend | Long body collapse — cap/collapse long body fields in Review Inspect panel for pressure, evidence, and analysis returns (max-height + scroll or `<details>` toggle) |
| **D-92A** | Docs + moderation | Truths/Drift public cleanup plan — audit old demo truths in public Truths list; return or archive where appropriate |
| **D-93A** | Docs | RunPack side-panel workflow clarity audit — verify D-19/D-20 copy changes still correct after D-90G; check AI analysis return path still clear |

---

## 9. Static checks (post-D-90G main)

```
node --check public/app-v10.js    → exit 0, no output
hardening-smoke-test.mjs          → 196 passed, 0 failed
belief-engine-static-check.mjs    → 24 passed, 0 failed (24 hard checks)
worker-route-static-check.mjs     → 39 passed, 0 failed (39 hard checks)
```
