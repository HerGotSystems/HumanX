# D-194A — Preview Moderation Pressure Audit

**Date:** 2026-06-28
**HEAD at audit:** `3105d57`
**Baseline:** 1589/24/57
**Scope:** Read-only audit. No code changes. `src/worker.js`, `public/app-v10.js`.

---

## Summary Verdict

The current moderation system is **survivable for a 5–20 trusted preview user wave** if the operator checks the Review queue once per day. The queue has robust tooling, sensible rate limits, and automatic duplicate detection. The primary risk is not capability — it's operator attention. If the queue goes unreviewed for 3–5 days, a single active user can fill it with 80–100 items.

**Estimated survivable preview size with current tooling: 30–50 total submissions before queue becomes burdensome.** With 5–20 users each submitting 2–5 items in the first week, that's 10–100 items — within range. At the upper end (everyone submits heavily) the queue becomes a meaningful time commitment without any new tooling.

---

## Current Moderation Architecture

### Review states

All content moves through four possible states:

| State | Meaning | Visible to public? |
|-------|---------|-------------------|
| `review` | Default on insert — pending moderation | No |
| `public` | Approved | Yes |
| `rejected` | Explicitly rejected | No — stays in DB, not displayed |
| `archived` | Soft-deleted (test artefacts, spam cleanup) | No — stays in DB |
| `duplicate` | Exact duplicate detected or marked | No |

**Tests and analysis results are exempt from review** — they insert as immediately public (`home_tests` has no `review_state` column; `analysis_results` is user-private by default).

### Rate limits (per IP, per hour)

| Route | Limit |
|-------|-------|
| `POST /api/claims` | 8/hr |
| `POST /api/evidence` | 20/hr |
| `POST /api/pressure` | 20/hr |
| `POST /api/tests` (home_tests) | 20/hr |
| `POST /api/analysis` | 20/hr |
| `POST /api/report` | 20/hr |
| `POST /api/auth/invite/redeem` | 8/hr |
| `GET /api/session` | 30/hr |
| `POST /api/runpack` | 20/hr |

Rate limits fire on IP, not user ID. A determined user on a home connection can exhaust claims in ~8 submissions/hour and evidence/pressure in ~20/hour. The limit resets per hour, so sustained spam across multiple hours is still possible but rate-gated.

### Duplicate detection

`createClaim` runs a `meaningKey()` normalization and checks existing claims before insert. If a near-match exists, it sets `near_duplicate_of` on the new claim and returns a `nearDuplicate: true` response. The claim still inserts in `review_state='review'` — it does not auto-reject.

The Review queue flags `~similar` items with a `near_duplicate_of` chip and a sortable filter. The operator can sort by "~Similar first" to batch-process duplicates.

`markDuplicate` (`POST /api/review/mark-duplicate`) explicitly marks a claim as `review_state='duplicate'` and sets `duplicate_of`. Once marked duplicate, a claim is excluded from future queue loads.

### Shadow banning

`requireUser()` checks `is_shadow_banned` on every write route. A shadow-banned user gets a `USER_SHADOW_BANNED` error (403) on all writes but can still browse. The field exists in the `users` table but **there is no admin UI or API endpoint to set it**. Banning requires a direct D1 console query:

```sql
UPDATE users SET is_shadow_banned=1 WHERE id='usr_...';
```

This is a gap. Banning a spammer requires D1 console access and knowing their user ID (which is not exposed in the Review queue UI — the queue shows `handle` and a last-6-char `uid_suffix` from owner-token telemetry, but the full user ID requires a D1 query).

### Report mechanism

Any user can `POST /api/report` on a claim, evidence, pressure, or truth. Reports increment `report_count` on the target. When `report_count >= 5`, the item is automatically pulled back to `review_state='review'` (even if previously public). Reports from the same user ID on the same item are idempotent (no double-count). The queue shows reported items with a ⚑ badge and a "Reported first" sort option.

---

## Review Queue UI Strengths

The Review tab is the most capable part of the current moderation system. It provides:

| Feature | Available |
|---------|-----------|
| Pending / Public / Rejected / Reported filter chips | Yes |
| ~Similar / ~Quality / Duplicates / Pressure / Demo-Test filters | Yes |
| Newest / Oldest / Reported first / ~Similar first sort | Yes |
| Inspect panel with full item detail and builder context | Yes |
| Two-step confirm on Approve and Reject | Yes |
| Keyboard shortcuts (A = approve, R = reject, K = keep pending, [ ] = navigate) | Yes |
| Audit summary bar (counts by state and type) | Yes |
| `near_duplicate_of` advisory chip | Yes |
| Cleanup path for rejected test artefacts | Yes |
| Claim Builder context shown in inspect panel | Yes |

The two-step confirm on approve and reject is particularly important — it prevents accidental mass-approvals during rapid keyboard triage.

---

## Queue Bottlenecks

### 1. No bulk action

Each item must be individually approved, rejected, or kept pending. With 80 items in the queue, clearing it takes ~5–10 minutes of focused review. There is no "approve all pending" or "reject all similar" batch action.

**Impact during preview:** Low. At 5–20 users submitting a few items each, the queue will typically have 10–40 items — manageable individually.

**Impact at scale:** High. 50+ users generating 3+ items each = 150+ queue items/day. Batch actions become necessary.

### 2. No identity in the Review queue

The queue shows `handle` (which users can set) and `target_type`, but the full user ID is not shown inline. If you need to trace a suspicious submission to a user for shadow-banning, you need a D1 query:

```sql
SELECT id, handle, is_shadow_banned FROM users WHERE handle='<handle>';
```

This requires D1 console access — it's not exposed in the UI.

### 3. Queue cap at 100 per content type

The queue query caps at `LIMIT 100` per type (claims, truths, evidence, pressure) — up to 400 total rows. If any single type exceeds 100 pending items, the oldest items are not shown. During preview, this is an unreachable threshold. At larger scale it becomes a blind spot.

### 4. No notification when queue grows

The operator has no push or email alert when new items enter the queue. Checking requires manually navigating to the Review tab. If the operator is away for 2–3 days, they may return to a full queue.

### 5. No per-user submission view

The queue is ordered by time or flags — there is no "show all items from user X" filter. Identifying a single user's full submission footprint requires eyeballing by handle or a D1 query.

---

## Abuse / Spam Scenarios

### Scenario A: One noisy trusted user submits aggressively

**What happens:** A preview user who finds the product interesting submits 8 claims (rate limit), 20 evidence items (rate limit), 20 pressure items (rate limit) in the first hour. Queue gets 48 new items.

**Current mitigations:** Rate limits cap the volume per hour. All items land in `review` — none go public automatically. The operator sees them the next time they open Review.

**Operator action:** Review the batch. If quality is acceptable: batch-approve. If quality is low: batch-reject using keyboard shortcuts (R → confirm). This takes ~10–15 minutes for 48 items.

**Risk level:** Low — this is a trust user submitting in good faith. The queue handles it.

### Scenario B: Preview URL leaks and anon visitors submit spam

**What happens:** Someone shares the preview link publicly. Anonymous visitors submit low-quality claims and evidence. The queue fills with unfamiliar content.

**Current mitigations:** Rate limits (8 claims/hr, 20 evidence/hr per IP). Duplicate detection catches re-submitted identical content. Review queue keeps it all out of public view.

**Gaps:** Multiple IPs can bypass the per-IP rate limit. With 10 IPs, the effective hourly cap becomes 80 claims and 200 evidence items — queue floods in hours.

**Operator action:**
1. Do not approve unfamiliar items
2. Reject-and-archive obvious spam in bulk using keyboard shortcuts
3. Stop sending new invite codes until source of leak is identified
4. Consider whether to temporarily stop the preview

**Risk level:** Medium. The queue gate holds — nothing goes public — but the operator time cost is high and unsustainable beyond a day.

### Scenario C: A user tests boundaries intentionally

**What happens:** A preview user submits borderline content — controversial claims, aggressive pressure points, potential misinformation — to see how the system responds.

**Current mitigations:** Everything lands in `review`. The inspect panel shows full body text. The operator can reject without the user seeing any confirmation that it was rejected (the item just stays in `review` from the submitter's perspective in My HumanX — there's no "Rejected" notification sent to them).

**Gaps:** There is no way to tell the user their submission was rejected without a direct message. If they don't check My HumanX, they may keep submitting similar content.

**Operator action:** Reject the item. If the user asks why their submission hasn't appeared: reply directly explaining the review decision. For repeated boundary-testing: shadow-ban via D1 console.

**Risk level:** Low for 5–20 trusted users. Higher if the group includes people with adversarial intent.

### Scenario D: Moderation falls behind for 3–5 days

**What happens:** Operator is unavailable. Preview users have submitted 50–100 items. None have gone public. Users start asking why nothing is appearing.

**Impact:** Users feel like the product is broken. The "review gating" explanation from the invite pack helps, but after 5 days without any approval, trust erodes.

**Current mitigations:** None — there is no auto-approval, no SLA enforcement, no queue alert.

**Operator action:** Prioritize queue clearance on return. Send a brief message to preview users: "Sorry for the delay — I've been reviewing submissions and they'll be appearing shortly."

**Risk level:** Medium. Not a safety risk — nothing bad goes public. But a trust/engagement risk with preview users.

### Scenario E: Vague or low-quality claims flood the queue

**What happens:** Preview users don't understand what makes a good claim and submit 20 vague statements ("things are getting worse", "AI is dangerous").

**Current mitigations:** The Review queue's `~Quality` filter uses `claimQualityHints()` to flag claims that match low-quality heuristics (too short, too vague, no testable predicate). These show a "needs sharpening" badge in the queue.

**Gaps:** The quality heuristic is advisory only — it does not prevent submission or auto-reject. The operator still needs to manually reject each one.

**Operator action:** Use the "~Quality" filter chip to batch-view flagged items. Reject them. Reply to the submitting user with guidance: "The claim needs to be testable — try framing it as 'X causes Y under condition Z'."

**Risk level:** Low operationally (won't harm the product). Medium as a sign that onboarding context wasn't clear enough.

---

## Missing Moderation Actions

### 1. No shadow-ban UI

Setting `is_shadow_banned=1` requires direct D1 console access. For a trusted preview, this is acceptable — you'd only need to ban someone you personally invited. But the workflow is:

1. Get the user's `handle` from the Review queue inspect panel
2. Open D1 console
3. `SELECT id FROM users WHERE handle='<handle>';`
4. `UPDATE users SET is_shadow_banned=1 WHERE id='<user_id>';`

**Minimum viable workaround:** Document this procedure. No new code needed for preview.

### 2. No per-user submission history in the admin UI

The queue is time-ordered and type-filtered, not user-filtered. Seeing everything from one user requires manual eyeballing or a D1 query:

```sql
SELECT 'claim' AS type, id, claim AS body, review_state, created_at FROM claims WHERE user_id='usr_...'
UNION ALL
SELECT 'evidence', id, title, review_state, created_at FROM evidence WHERE user_id='usr_...'
UNION ALL
SELECT 'pressure', id, title, review_state, created_at FROM pressure_points WHERE user_id='usr_...'
ORDER BY created_at DESC;
```

**Minimum viable workaround:** If you need this, run the query. No new code needed for preview.

### 3. No reject message to submitter

When an item is rejected, the submitter sees `review_state='rejected'` in their My HumanX page but receives no explanation. If they submitted in good faith, they don't know what to change.

**Minimum viable workaround:** Reply directly to the user. For preview, this is fine — you have their contact info.

### 4. No queue alert / notification

No push, email, or badge count when new items enter the queue. The operator must proactively check.

**Minimum viable workaround:** Daily Review queue check as part of the operator routine (see D-191C runbook).

---

## Estimated Operator Load

Assumptions: 10 active preview users, each submitting ~5 items over the first week.

| Volume | Items | Daily load |
|--------|-------|-----------|
| Low (5 users, 2 items each) | 10 total | <5 min/day |
| Medium (10 users, 5 items each) | 50 total | 10–15 min/day |
| High (20 users, 8 items each) | 160 total | 30–45 min/day |
| Spike (URL leaked, 50 anon IPs) | 400–1000 | Unsustainable without triage mode |

For the first trusted wave of 5–20 named users: **medium scenario is most likely**. 10–15 minutes of focused queue review per day. Keyboard shortcuts (A/R/K, [ ]) make this faster than clicking.

---

## Minimum Viable Moderation Routine

Run once daily during active preview (from D-191C runbook, condensed):

1. Open Review tab with admin token
2. Check "Audit Summary" bar — note total pending count
3. Filter to "Pending" — work through newest-first
4. For each item:
   - Substantive and on-topic: **Approve** (A → confirm)
   - Low quality but not harmful: **Reject** (R → confirm)
   - Unsure: **Keep Pending** (K) — revisit tomorrow
5. Filter to "~Similar" — mark true duplicates using mark-duplicate
6. Filter to "Reported" — investigate any reported public items
7. Done

Target time: under 15 minutes for a queue of 30–50 items.

---

## What Moderators Should NOT Attempt Yet

| Action | Why not |
|--------|---------|
| Auto-approving all items from known users | No per-user filter in the queue; risk of approving a batch that includes something you didn't intend |
| Turning off review gating entirely | The only trust gate for anon submissions; removing it during preview is too risky |
| Mass-rejecting without reading | Preview users submitted in good faith; a mass-reject sends the wrong signal and wastes their effort |
| Attempting to track which user submitted what | Incomplete identity in the queue; would require cross-referencing handle → D1 → time — not worth the overhead for 5–20 users |
| Setting up automated content moderation (AI filtering, regex blocks) | Overkill for preview scale; adds complexity before the moderation baseline is understood |

---

## D-194B Suggested Scope

**D-194B should happen before the first invite wave if the shadow-ban gap feels risky, otherwise after.**

For a 5–20 person trusted preview where you know each user personally, the shadow-ban gap is theoretical — you'd only need it if a trusted contact turns out to be adversarial, which is unlikely. In that case you have their contact info and can reach out directly before touching the DB.

**If D-194B happens (before wave 1), limit it to:**

| Fix | Complexity | Value |
|-----|-----------|-------|
| Add shadow-ban toggle to Review inspect panel (admin only) | Medium | High if abuse risk is real |
| Add handle-based filter chip to the queue | Low | Medium — "show all from this handle" |
| Add daily Review badge count to admin nav chip | Low | Medium — removes need to check proactively |

**If D-194B happens after wave 1:** Add only what the actual preview experience showed was missing. Don't anticipate problems that didn't materialize.

**D-194B is optional before the first 5–20 user wave.** The current tooling handles the likely scenarios. The gaps (no shadow-ban UI, no user filter, no queue alert) are real but not blocking for a trusted preview where you know every user personally.

---

## Future Moderation Architecture (Separated from Preview Scope)

These belong after the preview phase and are not D-194B scope:

| Feature | When to add |
|---------|------------|
| Per-user submission history view (admin) | Before expanding to 50+ users |
| Shadow-ban toggle in Review UI | Before any public access |
| Rejection reason shown to submitter | Before public access — users deserve to know why |
| Queue email/push alert | Before expanding to 20+ simultaneous active users |
| Batch approve/reject for ~similar items | Before public access — queue volume will require it |
| Auto-moderation (keyword filters, AI content screening) | After manual moderation baselines are understood |
| Moderation audit log (who approved/rejected what, when) | Before multiple moderators share the queue |
| Rate limit configurable per user (trusted vs. anon tier) | When differentiated trust tiers are implemented |

---

## Top 5 Moderation Risks

| Rank | Risk | Likelihood (preview) | Mitigation |
|------|------|----------------------|-----------|
| 1 | **Queue falls behind** — operator unavailable for 3+ days while users are active | Medium | Daily routine from D-191C; tell preview users upfront that review takes time |
| 2 | **Preview URL leaks** — anon spam floods the queue | Low-medium | Don't post the URL publicly; monitor queue for unfamiliar handles |
| 3 | **Vague/untestable claims pile up** — onboarding wasn't clear enough | Medium | Fix in invite messaging (D-191B); use ~Quality filter to batch-reject |
| 4 **No shadow-ban UI** — a user needs to be silenced and D1 console isn't accessible | Low | Know the D1 console workflow before sending invites (SQL query documented above) |
| 5 | **Boundary-testing user** — deliberately submits edge content to test moderation | Low | Reject via queue; reply directly if they ask; shadow-ban if persistent |
