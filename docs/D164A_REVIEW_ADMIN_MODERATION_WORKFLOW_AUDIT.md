# D-164A — Review / Admin Moderation Workflow Audit

**Date:** 2026-06-25
**Scope:** Docs only. Audit and recommendations for D-164B. No code change in this patch.

---

## Current Behaviour Summary

### Entry point

Admin opens the Review tab → `renderReview()`. If an admin token is stored in `localStorage` (`humanx_admin_token_v1`), the queue is loaded immediately via `GET /api/review`. If not, the UI shows: "Review is owner-only. Enter the admin token to load the queue."

The admin token is stored in `localStorage`, read by `adminToken()`, and sent on every admin API call via `adminHeaders()` as the `x-humanx-admin` header. The token value is **rendered into the token input field** via `value="${esc(token)}"` — it is not masked/`type="password"`.

### Queue data model

`GET /api/review` returns up to 100 items per type (claims, truths, evidence, pressure), merged and sorted by `updated_at DESC`, then globally sliced to 100. Items in `review_state='archived'` or `'duplicate'` are excluded; items in `review_state='rejected'` are also excluded from claims/truths unless they have `report_count > 0`.

The queue response includes:
- `claims` — items in `review_state != 'public'/'archived'/'duplicate'/'rejected'` OR with reports
- `truths` — items in `review_state != 'public'/'archived'/'rejected'`
- `evidence` — items in `review_state != 'public'/'archived'` OR with reports
- `pressure` — same pattern as evidence
- `archived_total`, `archived_claims`, `archived_truths`, `duplicate_total` — aggregate counts only (no sensitive row data)

Each claim row includes: `target_type`, `id`, `claim`, `category`, `type`, `status`, `evidence_score`, `testability`, `survivability`, `review_state`, `report_count`, `near_duplicate_of`, `handle`, `user_id`, `source_truth_id`, `latest_report_reason`, and optionally `claim_builder_context` (structured) or legacy `initialEvidence` parsed text.

### Review queue UI components

1. **Overview strip** — pending/public/rejected counts + type breakdown (claims/truths/evidence/pressure)
2. **Audit Summary** (collapsible) — total/pending/public/rejected/reported/pressure/demo-test/similar/dup counts + archived total
3. **Filter bar** — chips: Pending · Public · Rejected · Reported · ~Similar · ~Quality · Pressure · Dupes · Demo/Test · Truth-Derived · All
4. **Sort bar** — Newest/Oldest/Reported/~Similar/~Quality
5. **Inspect panel** (opens above card list) — full field breakdown, builder context, navigation (Prev/Next), keyboard shortcuts
6. **Card grid** — one `reviewCard()` per item

### Review card actions

For a **pending** item:
- **Inspect** — opens the inspect panel (does not change state)
- **Approve** — two-step (click Approve → confirm dialog): sets `review_state='public'`
- **Keep Pending** — one-click, no confirmation: sets `review_state='review'`
- **Reject** — two-step (click Reject → confirm dialog): sets `review_state='rejected'`

When a card is in Inspect mode, Approve/Keep/Reject buttons are hidden from the card and only appear in the inspect panel.

### Inspect panel actions

All four decisions available:
- **Approve** — one-click in the inspect panel, no second confirmation step
- **Keep Pending** — one-click, no confirmation
- **Reject** — two-step (click Reject → confirm in panel)
- **Archive test artefact** — only shown if `state === 'rejected'` AND `isSuspectedTestArtefact(item)`; two-step confirm
- **Mark Duplicate…** — modal, requires target claim ID; two-step
- **Dismiss ~Similar** — modal, one-confirm; clears `near_duplicate_of` advisory, no state change
- **Open Study View ↗** / **Study Parent Claim ↗** — navigation shortcut

Keyboard shortcuts (active when `mode==='review'` and inspect panel is open):
- `A` → Approve and advance
- `K` → Keep Pending and advance
- `R` → Reject and advance
- `[` / `ArrowLeft` → previous item
- `]` / `ArrowRight` → next item
- `Esc` → close inspect panel

### Review-state transition map

```
                      ┌──────────────┐
    submit/insert ──▶ │    review    │◀──── Keep Pending (admin)
                      └──────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
          public         rejected        review  (no change)
              │              │
              │      ┌───────┴──────┐
              │      │  archived    │  (artefact only, via /cleanup)
              │      └──────────────┘
              │
    (via /review/mark-duplicate)
          duplicate  (source preserved, removed from queue/public list)
```

All transitions are via `POST /api/review/decision` with `requireAdmin` gating.
`duplicate` is set by `POST /api/review/mark-duplicate` (separate endpoint).
`archived` is set by `POST /api/review/cleanup` (requires `rejected` first + artefact detection).

### Route/gating coverage

| Route | Admin gated |
|---|---|
| `GET /api/review` | `requireAdmin` — `403 ADMIN_REQUIRED` if no/wrong token |
| `POST /api/review/decision` | `requireAdmin` — `403 ADMIN_REQUIRED` if no/wrong token |
| `POST /api/review/cleanup` | `requireAdmin` — `403 ADMIN_REQUIRED` if no/wrong token |
| `POST /api/review/mark-duplicate` | `requireAdmin` — `403 ADMIN_REQUIRED` if no/wrong token |
| `POST /api/review/resolve-similar` | `requireAdmin` — `403 ADMIN_REQUIRED` if no/wrong token |

`requireAdmin` uses constant-time `safeEqual()` for token comparison. No timing oracle.

`HUMANX_ADMIN_TOKEN` is read only from `env` (Cloudflare Worker environment binding) — never from the request body, URL, or any committed file.

---

## Audit Answers

### 1. Can an admin quickly understand what needs review?

**Yes — the UI is well-equipped.** The overview strip shows pending/public/rejected counts immediately. The audit summary gives a full breakdown. Filter chips let the admin jump directly to Pending, Reported, Similar, Quality, or Pressure views. Sort gives Reported-first for priority triage.

The `renderReviewOverviewStrip()` count is the first thing visible after queue load — no need to count cards manually.

**Minor gap:** The overview strip has no "new since last visit" signal. Admins returning to a queue with 20 items have no way to know which are new vs. already-reviewed and kept.

### 2. Is submitted claim context visible enough to make a decision?

**Mostly yes, but with one tier gap.** The inspect panel shows:
- Full claim text, category, type, status, evidence score
- Handle and user_id (admin-only context)
- Claim Builder structured context (rawText, why, scope, falsifier, system flags) — shown with `b-blue Builder` badge
- Legacy parsed builder context (from `initialEvidence`) with `b-yellow legacy` badge
- "no builder context" placeholder if both are absent

The builder context is the most important new-submission signal (since D-163B, most claims go through the builder). It is shown fully in the inspect panel.

**One gap:** If a claim was submitted via the old `saveClaim()` path (no builder), there is only the claim text itself and no submission context. This is a minority path but real.

### 3. Are Approve / Keep / Reject / Duplicate actions clear and safe?

**Mostly — with one inconsistency worth noting.**

- **Reject**: two-step confirm in both card and inspect panel. Confirm message: "Reject? It will not become public." — clear.
- **Approve (card)**: two-step confirm. Confirm message: "Approve this item? It will become public." — clear.
- **Approve (inspect panel)**: **one-click, no confirmation.** This is inconsistent with the card behaviour. A keyboard shortcut (`A`) also triggers approve directly with only an advance step, no secondary confirm.
- **Keep Pending**: one-click, no confirmation — appropriate since it's a non-destructive hold.
- **Mark Duplicate**: modal with required target ID — appropriately gated.

The inconsistency between card-level approve (two-step) and inspect-panel approve (one-click) is the most notable safety gap in the moderation flow.

### 4. Is there any chance of accidental public approval?

**Low, but not zero.** Scenarios:
1. Admin clicks `A` keyboard shortcut on the wrong item — item becomes public immediately. The `_reviewKbInFlight` guard prevents double-fire, but there is no undo prompt.
2. Admin clicks Approve in the inspect panel — no confirmation step (unlike the card-level Approve button).
3. After a `reviewDecisionUI()` call, the queue is reloaded and the list re-renders. The `_anchorId` scroll-back is present, which reduces risk of losing context.

**Mitigating factors**: approval requires loading the admin token first, the UI is not publicly accessible, and `requireAdmin` rejects every request without a valid token.

### 5. Is there any chance of acting on the wrong card after re-render?

**Low risk — good defensive design is in place.** `reviewDecisionUI` stores `_anchorId = inspectedReviewItem?.id || targetId` before the async API call, then calls `scrollToReviewAnchor(_anchorId)` after re-render. The inspect panel navigation shows "N of M" position which is recalculated from the current filtered list. `pendingRejectReviewId` and `pendingApproveReviewId` are reset to `null` after any decision — no stale confirm state.

**One gap**: if the admin is on an item at position N and approves it (removing it from the queue), the panel closes and the admin is scrolled to the next item but the panel is not auto-opened on the next item. The admin must click Inspect again.

### 6. Does duplicate handling make sense?

**Yes — conservative and non-destructive.** `POST /api/review/mark-duplicate` sets `duplicate_of` and `review_state='duplicate'` on the source claim. The source is never deleted. The canonical claim is not modified. A modal requires the admin to type the target claim ID — accidental duplicate marking via a fat-finger is unlikely. Self-duplicate is explicitly rejected. Cannot mark already-archived or already-duplicate claims.

`Dismiss ~Similar` clears the `near_duplicate_of` advisory without changing state — correctly treated as advisory-only.

### 7. Does cleanup risk deleting/hiding useful review evidence?

**No deletion — archived rows persist.** `POST /api/review/cleanup` sets `review_state='archived'` only. Three gates must all pass: (1) admin token, (2) `review_state='rejected'` (must be rejected first), (3) artefact detection (text keywords, dev-handle, seed-id-prefix, or seed-truth origin). A protected seed blocklist prevents archiving known core demo items. No hard delete path exists in any review route.

The `junk_override` path (for short/all-caps/low-alpha text) also archives rather than deletes, and requires a reason string (≥8 chars).

### 8. Are all review routes admin-gated?

**Yes — all five review routes call `requireAdmin` as the first operation.** The check runs before any DB read. `requireAdmin` returns a `403 ADMIN_REQUIRED` response on failure, and the calling function returns that response immediately (pattern: `const adminError = requireAdmin(request, env); if (adminError) return adminError;`).

`requireAdmin` uses `safeEqual()` which is a constant-time string comparison — no timing oracle on token length.

### 9. Are admin token values ever logged/rendered/exposed?

**Partially exposed — one known issue.** The admin token is stored in `localStorage` and read into the token input field as a plaintext `value` attribute:

```js
`<input id="adminToken" placeholder="Admin token" value="${esc(token)}" autocomplete="off">`
```

The field is `type="text"` (not `type="password"`). This means:
- The token is visible in the browser UI when the Review tab is open
- The token is present in the DOM as a plain attribute
- `autocomplete="off"` prevents browser autocomplete, but does not hide the field value from browser dev tools, shoulder surfing, or screen sharing

**What is safe:** the token is never rendered in a `toast()`, never included in `mapClaim()` output, never returned by any API response, and never logged to the console anywhere in the frontend or worker. The `adminHeaders()` function adds `x-humanx-admin` to API calls without echoing the token to the UI.

**What is unsafe:** the plaintext token input.

**Note:** This is an existing, known state. Changing to `type="password"` would be a low-risk, single-attribute fix — but the question of whether this is worth doing in D-164B depends on the threat model. If the admin console is always used in a controlled environment (private tab, not screen-shared), the current state is acceptable. If screen sharing or shoulder surfing is a concern, `type="password"` is the correct fix.

### 10. What is the safest D-164B implementation patch?

**Primary recommendation:** close the inspect-panel approve inconsistency. Everything else is advisory. Full plan below.

---

## UX Friction Points

1. **Inspect-panel Approve is one-click** — inconsistent with the card-level two-step confirm. A misclick in the inspect panel approves immediately.

2. **Keyboard `A` shortcut approves immediately** — no secondary confirm. Risk of approving the wrong item on keyboard navigation.

3. **No "new since last visit" signal** — admins returning to the queue cannot distinguish newly submitted items from items they have already seen and kept.

4. **Admin token shown in plaintext** — `type="text"` input. Visible in browser UI and screen shares.

5. **No time expectation for submitters** — (this was addressed in D-163B on the submitter side) but the admin queue shows no SLA / age target. Items that have been pending for weeks look identical to items submitted today.

6. **After approving an item in the inspect panel, the panel closes** — the admin must click Inspect on the next item manually. The keyboard `]` shortcut navigates but does not re-open the inspect panel automatically.

7. **Queue limit is 100 items globally** — with many types in the queue, older items may be cut off. No pagination, no "load more" control.

---

## Safety Risks

| Risk | Severity | Status |
|---|---|---|
| Inspect-panel Approve is one-click (no confirm) | Medium | Open — recommend D-164B fix |
| Keyboard `A` shortcut approves without confirm | Low | Open — advisory |
| Admin token displayed in plaintext `type="text"` | Low | Open — `type="password"` fix is trivial |
| Queue truncated at 100 items — older items may not appear | Low | Open — architecture limitation |
| No accidental approval is possible without a valid admin token | N/A — mitigated | `requireAdmin` constant-time check |
| No hard delete path | N/A — mitigated | All routes use `review_state` transitions only |
| `review_state='review'` enforced on all new inserts | N/A — mitigated | `createClaim`, `addEvidence`, `addPressure` all insert `review_state='review'` |

---

## Privacy / Public Boundary Verdict

**Clean.** The review queue exposes non-public content (pending/rejected items, user handles, user_id, report reasons, builder context) — but only behind `requireAdmin`. No review data is accessible to public or pseudonymous users. `mapClaim()` used in the `reviewDecision` response does not include `email`, `is_admin`, `owner_token`, or `admin_token`.

`user_id` is shown in the inspect panel (as a `<code>` element). This is admin-only content — correct for provenance/moderation tracking.

---

## Recommended D-164B Implementation Plan

**Goal:** Close the inspect-panel approve inconsistency. Low-risk frontend-only fixes. No backend changes.

### 1. Add two-step confirm to inspect-panel Approve (required)

The inspect panel currently renders Approve as a direct `reviewDecisionUI()` call:

```js
<button class="btn-approve review-inspect-approve" onclick="reviewDecisionUI(...)">Approve</button>
```

Change to match the card-level pattern: first click sets `pendingApproveReviewId`, re-render shows a confirm message + "Confirm Approve" / "Cancel" button pair.

This ensures Approve always requires two distinct clicks, whether from the card or the inspect panel.

### 2. Change admin token input to `type="password"` (optional, low-risk)

```
Before: <input id="adminToken" placeholder="Admin token" value="..." autocomplete="off">
After:  <input id="adminToken" type="password" placeholder="Admin token" autocomplete="off">
```

Note: `value="${esc(token)}"` should remain so the field shows whether a token is stored — just mask it. Or show a `●●●●●●` placeholder instead of the real value, with a "Clear" button for actual removal.

### 3. Add keyboard shortcut guard for `A` (optional, low-risk)

The keyboard handler currently calls `reviewDecisionUI()` directly for `'a'`. Changing it to call `requestApproveReview(id)` (the pending-approve setter) would add the same two-step confirm to keyboard approval. This pairs with fix #1.

### What NOT to Change

- `requireAdmin` gating — already correct
- `safeEqual()` constant-time comparison — already correct
- All review-state transitions — correct
- Cleanup three-gate model (`rejected` + artefact + not-protected) — correct
- Mark-duplicate modal with required target ID — correct
- `review_state='review'` on all new inserts — must never change
- Any invite/verify route
- Owner-token work — frozen (D-149H)
- No migration
- No wrangler.toml

---

## API Endpoint Inventory Verdict

The `docs/API_ENDPOINT_INVENTORY.md` entries for the five review routes (lines 103–107) are accurate as of this audit. No drift found. No update needed.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-164B plan.
