# D-92D — Truth Exact ID Inventory Support Audit

**Date:** 2026-06-08
**Scope:** Read-only audit. No cleanup, no data mutation, no live calls.
**Static baseline:** 212 / 24 / 39

---

## A. Scope and Safety

This audit answers one question only: **what is the smallest safe way to expose exact truth IDs for admin/operator inventory before any cleanup?**

- No cleanup performed here.
- No truth records mutated.
- No moderation actions.
- No D1 queries.
- No Wrangler.
- No live endpoint calls.

Exact IDs are required before D-92E (cleanup) can safely proceed. This audit unblocks that.

---

## B. Current Issue

**D-92C shipped:** truth cards on the public Truths page now show `id: …last8chars` (e.g. `id: …4c899d36`). This is readable by a human but is NOT a usable exact ID for cleanup operations.

**Why exact IDs are required:**
- `reviewDecision` (`POST /api/review-decision`) requires the exact full truth ID as `targetId`.
- `reviewCleanup` (`POST /api/review-cleanup`) requires exact full truth ID.
- The shortened 8-char suffix is not unique enough to be used as a lookup key safely.
- Multiple truths with different full IDs could theoretically share the same last 8 characters.

**Why DevTools fetch was unreliable:**
- The user attempted `fetch('/api/truths?limit=100')` in the browser Console.
- This worked in principle but the result was hard to navigate: 20 objects returned as a JSON blob, no copy-friendly display, no per-statement labelling, and the Console truncates large objects.
- The user could see shortened IDs on card faces (e.g. `id: …4c899d36`) but could not reliably match them to full IDs from the DevTools output.
- Screenshots identify candidate content (statement text, badge state) but do not capture the `id` field.

**Bottom line:** Cleanup is blocked. Exact IDs needed for at minimum:
- `gfsdhdfhdfhdfhgdfa`
- `Blablabla`
- `SMALL INDEFERENT TRUTH`
- `Statement`
- `Slogan`
- `Belief Engine Profile — Stoic Atheism` (if policy later decides private/withdraw)

---

## C. Current Data Availability

### Is full truth ID present in the frontend truth object?

**YES — unconditionally.**

`src/truths.js` `mapTruth` (line 93):
```js
id: t.id,
```

`listTruths` returns `{ truths: rows.map(mapTruth) }`. Every truth object in the frontend `truths` array has its full ID. The public card in `truthCard` only *displays* a shortened suffix:
```js
const idSuffix = t.id ? t.id.slice(-8) : '';
// ...
${idSuffix ? `<p class="small truth-id-line">id: …${esc(idSuffix)}</p>` : ''}
```
The full `t.id` is also already used in the "Pressure-test as Claim" button:
```js
onclick="convertTruth('${esc(t.id)}')"
```

**Conclusion:** Full ID is available in the frontend data object right now. No Worker change needed to access it. The card just doesn't display it in full.

### Is full truth ID present in the Review queue item?

**YES — but only for truths in non-public review states.**

`reviewQueue` in `src/worker.js` queries:
```sql
SELECT 'truth' AS target_type, t.*, ...
FROM truths t
WHERE COALESCE(t.review_state,'public') NOT IN ('public','archived')
```

Public truths (`review_state='public'`) are **excluded** from the Review queue. The 20 currently-visible public truths (including artefacts like `gfsdhdfhdfhdfhgdfa`) are NOT in the Review queue and therefore NOT inspectable through the Review Inspect panel.

If a truth is in Review pending state, its full ID is shown in the inspect panel (`renderReviewInspectPanel` line 128: `fields.push(['ID', <code>...id...</code>])`).

### Is truth inspect available in Review for public truths?

**NO.** Public truths are filtered out of `reviewQueue`. The Inspect panel is only reachable for items returned by `/api/review-queue`, which excludes `review_state='public'`.

To inspect/cleanup a public truth via Review, an admin would first need to use `reviewDecision` to set it back to `review` state — which requires knowing its ID first. Circular dependency.

### Does the public Truths page know the admin token state?

**NO.** `truthCard` and `renderTruths` do not call `adminToken()`. The function `adminToken()` exists at line 43:
```js
function adminToken(){ return localStorage.getItem(LS_ADMIN) || '' }
```
and is used only by `renderReview` and `saveAdminTokenAndLoadReview`. The public card renderer is entirely unaware of admin token state.

**However:** `adminToken()` is a module-level function, available in the same JS scope as `truthCard`. A frontend-only change could call it from `truthCard` with zero new infrastructure.

### Can the frontend display/copy the full ID without a Worker change?

**YES — entirely frontend-only.**

`t.id` is already present in the truth object. `adminToken()` is already in scope. A `truthCard` change to:
1. Call `adminToken()` to detect admin mode
2. Render the full `t.id` (not just last 8 chars) when admin token present
3. Add a copy-to-clipboard button inline

…requires changes only to `public/app-v10.js` (and optionally `public/styles.css` for the copy button style). No Worker change, no new route, no D1 change.

---

## D. Options Comparison

### Option 1 — Public card always shows full ID

Show the complete truth ID (`tru_xxxxxxxxxxxxxxxxxxxxxxxx`) on every public card, for all users.

| | |
|---|---|
| **Effort** | Minimal — one-line change in `truthCard` (`t.id.slice(-8)` → `t.id`) |
| **Pros** | Simplest possible change; works immediately without any token |
| **Cons** | Truth IDs are long (20–26 chars), visually noisy on every card for all users; IDs themselves are not sensitive but UX degrades for normal users; sets a precedent of showing internal IDs publicly |
| **Security** | Low risk — truth IDs do not expose user IDs, emails, or other personal data. They are opaque random strings. |

### Option 2 — Short ID on card face, full ID on hover/title

Keep the `id: …last8chars` display but add `title="full-id-here"` so hovering shows the full ID in a browser tooltip. No copy button.

| | |
|---|---|
| **Effort** | One-line change — add `title` attribute to the id line element |
| **Pros** | No visual change for normal users; full ID accessible via hover |
| **Cons** | Not reliably copy-pasteable on mobile/touch; tooltip text is not selectable; poor operator UX for bulk inventory; still no copy button |
| **Security** | Same as Option 1 — low risk |

### Option 3 — Admin-token mode reveals full IDs and copy buttons ✅ RECOMMENDED

`truthCard` checks `adminToken()`. When admin token is present in localStorage (i.e. the same token the user enters in the Review tab), the truth card displays:
- Full truth ID (not shortened)
- A small "copy id" button that calls `navigator.clipboard.writeText(t.id)`

When admin token is absent (normal user), the card shows `id: …last8chars` as today.

| | |
|---|---|
| **Effort** | Small — ~10 lines in `truthCard`, one CSS rule, 2–3 hardening tests |
| **Pros** | Zero visual change for normal users; full ID only visible to operator who already has admin token; copy button makes inventory workflow reliable; no DevTools required; uses existing `adminToken()` and `t.id` — no new infrastructure |
| **Cons** | Operator must have admin token loaded (they already need this for Review); slight coupling between Truths page and admin state |
| **Security** | Ideal — full IDs hidden from public users, visible only to authenticated admin session |
| **Worker change** | None |
| **New route** | None |

### Option 4 — Truth card Inspect drawer/panel

Add a "Inspect" button to each truth card that opens a side panel with full metadata (like `renderReviewInspectPanel` but for public truths).

| | |
|---|---|
| **Effort** | Medium — new drawer component, new panel renderer, layout changes |
| **Pros** | Rich operator view; extensible for future review actions |
| **Cons** | Over-engineered for the immediate need (exact ID inventory); much more frontend code; not needed if Option 3 solves the problem |
| **Security** | Depends on implementation — could be admin-gated or public |

### Option 5 — Admin-only `/api/admin/truths` inventory route

Add a new Worker route (admin-authenticated) that returns all truths regardless of `review_state`, with full IDs and all fields.

| | |
|---|---|
| **Effort** | Medium — new Worker route, new frontend call, new hardening tests |
| **Pros** | Clean separation; useful for bulk export; full data access |
| **Cons** | Requires Worker + PR; over-engineered for one-time inventory need; hard rules say stop and report if backend needed |
| **Security** | Good — admin-only route |

---

### Recommendation

**Option 3 — Admin-token mode reveals full IDs and copy buttons.**

It is:
- **Frontend-only** — no Worker change, no new route, no D1
- **Zero regression** — normal user sees no change
- **Immediately usable** — operator loads admin token in Review tab (already the workflow), switches to Truths tab, sees full IDs + copy buttons
- **Safe** — truth IDs are opaque random strings, not sensitive data; guarding behind admin token is belt-and-suspenders
- **Minimal code** — `adminToken()` and `t.id` already exist in scope

---

## E. Security and Product Judgement

**Is exposing full truth IDs public-safe?**
Yes. Truth IDs follow the pattern `tru_[random alphanumeric]`. They are opaque identifiers with no embedded personal data, no user ID linkage visible to a public user, and no semantic content. Showing them publicly (Option 1) would not constitute a privacy violation.

**Does the ID expose anything sensitive?**
No. The `truths` table does store `user_id` internally, but `mapTruth` does not include `user_id` in the frontend object. The only user-linked field returned is `handle` (display name), which is already shown on the card.

**Is it acceptable to show full IDs only in admin mode?**
Yes — and preferable. It keeps the normal user experience clean. The admin-gating (Option 3) is the right balance: it gives operators what they need without adding noise for everyone.

**What is best for cleanup operations?**
Option 3 with a copy button. The operator workflow becomes:
1. Enter admin token in Review tab (already required for any cleanup action)
2. Switch to Truths tab
3. Cards now show full IDs with a copy button
4. Copy exact ID for any target truth
5. Use that ID in `reviewDecision` or `reviewCleanup` (via Review tab Inspect flow or, in future, a dedicated cleanup route)

No DevTools, no JSON parsing, no shortening ambiguity.

---

## F. D-92E Implementation Plan (Frontend-only)

**Branch:** `fix/d92e-truth-id-copy-admin`
**PR title:** `fix: show full truth ID and copy button in admin mode`

### Changes to `public/app-v10.js`

In `truthCard`, replace the current ID line section:

```js
// CURRENT:
const idSuffix = t.id ? t.id.slice(-8) : '';
// ...
${idSuffix ? `<p class="small truth-id-line">id: …${esc(idSuffix)}</p>` : ''}
```

With admin-aware version:

```js
const isAdmin = !!adminToken();
const idDisplay = isAdmin
  ? `<p class="small truth-id-line truth-id-admin">
       <code class="truth-id-full">${esc(t.id)}</code>
       <button class="btn-copy-id" onclick="navigator.clipboard.writeText('${esc(t.id)}').then(()=>toast('ID copied'))">copy id</button>
     </p>`
  : (t.id ? `<p class="small truth-id-line">id: …${esc(t.id.slice(-8))}</p>` : '');
```

No other changes to `truthCard` logic. All existing badges, helpers, convert note remain unchanged.

### Changes to `public/styles.css`

One new rule:
```css
.truth-id-admin{display:flex;align-items:center;gap:6px}
.truth-id-full{font-size:9px;opacity:.7;user-select:all;letter-spacing:.02em}
.btn-copy-id{font-size:9px;padding:1px 5px;border-radius:3px;cursor:pointer;opacity:.6;background:transparent;border:1px solid var(--muted);color:var(--muted)}
.btn-copy-id:hover{opacity:1}
```

### Hardening smoke tests (Section 35, +3 tests, 212→215)

| # | Test |
|---|------|
| 1 | `truthCard` references `adminToken()` (admin-aware ID display) |
| 2 | `truthCard` contains `btn-copy-id` class (copy button exists) |
| 3 | `truthCard` contains `truth-id-full` class (full ID display element) |

### No Worker change needed
No new routes. No D1 changes. No Wrangler.

---

## G. Cleanup Still Blocked

**Do NOT clean up any truths until D-92E is merged and exact IDs are confirmed.**

Exact IDs are still unknown for the following candidates identified from the live Truths page:

| Statement | Signal | Cleanup candidate? |
|-----------|--------|-------------------|
| `gfsdhdfhdfhdfhgdfa` | `? artefact` badge (vowel ratio < 12%) | Yes — likely T6 artefact |
| `Blablabla` | `? artefact` badge (repeated syllable) | Yes — likely T6 artefact |
| `SMALL INDEFERENT TRUTH` | Unknown origin | Possible — check handle/origin |
| `Statement` | `? artefact` badge (single generic word) | Yes — likely T6 artefact |
| `Slogan` | `? artefact` badge (single generic word) | Yes — likely T6 artefact |
| `Belief Engine Profile — Stoic Atheism` | `personal belief` badge | Policy decision required — not a safety cleanup |

**Cleanup sequence (after D-92E):**
1. Enter admin token → go to Truths tab
2. Copy full ID for each candidate using the new copy button
3. For each candidate: open Review tab → confirm `review_state` (likely `public`)
4. Use `reviewDecision` to set `review_state='rejected'` first
5. Then use `reviewCleanup` to archive if `isSuspectedTestArtefact` fires for it

**Note on `reviewCleanup` for truths:** `reviewCleanup` in `src/worker.js` (line 103) does support `truth` type — it reads `SELECT id,statement,review_state,status_locked FROM truths WHERE id=?` and archives if `review_state='rejected'` and not `status_locked`. The `BAD_TARGET_TYPE` blocker documented in D-91D2 was for `pressure` type only. Truths can be archived via `reviewCleanup` once they are in `rejected` state.

---

## H. Files Inspected

| File | Key finding |
|------|-------------|
| `public/app-v10.js` lines 101–103 | `isTruthPersonalBelief`, `isTruthArtifact`, `truthCard` — full `t.id` present in data object; card only displays `t.id.slice(-8)` |
| `public/app-v10.js` line 43 | `adminToken()` reads `localStorage` — in scope, callable from `truthCard` |
| `public/app-v10.js` line 104 | `renderReview` — admin token input/form; same `LS_ADMIN` localStorage key |
| `public/app-v10.js` line 128 | `renderReviewInspectPanel` — shows full ID in Inspect panel for queue items; public truths not reachable here |
| `src/truths.js` line 90–105 | `mapTruth` returns `id: t.id` — full ID in every frontend truth object |
| `src/truths.js` lines 3–19 | `listTruths` public query: `COALESCE(t.review_state,'public')='public'`; returns `mapTruth` results |
| `src/worker.js` line 160 | `reviewQueue` truths query: `NOT IN ('public','archived')` — public truths excluded from Review queue |
| `src/worker.js` line 103 | `reviewCleanup` — supports `truth` type; requires `review_state='rejected'`; archives by setting `review_state='archived'` |
| `src/worker.js` line 88 | `reviewDecision` — supports `truth` type; can set `rejected` on any truth by exact ID |

---

## Summary

| Question | Answer |
|----------|--------|
| Full truth ID in frontend data? | **YES** — `t.id` present in every truth object |
| Full truth ID in Review queue? | Only for non-public truths (public truths excluded) |
| Truth inspect via Review panel? | Only for non-public truths |
| Public page knows admin token? | **No** — but `adminToken()` is in scope and callable |
| Frontend-only fix possible? | **YES** — Option 3, no Worker change needed |
| Recommended option | **Option 3** — admin-token mode, full ID + copy button |
| Cleanup safe now? | **No** — exact IDs still unknown; await D-92E |
| D-92E blocked on Worker? | **No** — pure frontend change |
