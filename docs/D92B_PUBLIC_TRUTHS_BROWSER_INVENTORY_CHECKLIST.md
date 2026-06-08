# D-92B — Public Truths Browser Inventory Checklist

**Date:** 2026-06-08
**Type:** Docs-only (direct main) — manual inventory template, no mutations
**Static checks:** 204 / 24 / 39

---

## A. Scope and safety

This document is a **manual browser checklist only**. No live endpoint calls, no moderation
actions, no approve/reject/archive/cleanup operations are made in this batch.

Scope:
- **Truths tab only** — the public `/truths` feed as seen by a non-admin user
- **Admin Review queue** — to verify which truths are pending vs public
- **Drift is excluded** — D-92A confirmed Drift is private per-user; no public inventory
  is needed unless a specific public leak is identified

Rules for the inventory session:
- Open the Truths tab in a browser; record what you see
- Do **not** click "Send to Claim Review →" on any truth card (this is a write action)
- Do **not** click "Submit Truth for Review" in the add form
- Do **not** approve/reject/archive any items in the admin Review queue
- Record the ID only via browser DevTools (Section B Step 6) — do not type it anywhere
  that would submit it

---

## B. Browser method — step by step

### Before you start

- Open `https://humanx.rinkimirikata.com` in a browser.
- Do **not** enter admin token yet.
- Have DevTools open (F12 → Network tab, or Application → Console for quick inspection).

### Step 1 — Load the Truths tab

1. Click the **Truths** tab.
2. Wait for the grid to load fully (spinner disappears).
3. Note the total number of cards visible in the grid.
   Record: **Total visible truth cards = ___**

### Step 2 — Screenshot the top of the Truths page

Save screenshot as: `truths_top.png`

The screenshot should show:
- The page header ("Truths" + `widely asserted · not auto-verified` badge)
- The disclaimer paragraph
- The "Add a Truth" form
- The first row of truth cards

### Step 3 — Record what each card shows

For every visible truth card, the card face shows:

| Field | Where it appears on card | Notes |
|---|---|---|
| `truthType` | Yellow badge top-left | e.g. `common`, `cultural`, `religious`, `scientific`, `family`, `personal-belief` |
| `confidenceLabel` | Second badge (grey) | e.g. `claimed`, `held`, `strongly held`, `weakly held` |
| `→ claim exists` | Green badge (if present) | means `linkedClaimId` is set |
| Statement text | Card title `<h3>` | the full truth statement |
| Review state badge | Below title | `b-yellow` = review, `b-green` = public, `b-red` = rejected |
| Category | Meta line, first item | e.g. `culture`, `religion`, `human nature` |
| Origin | Meta line, `origin: …` | e.g. `family / school`, `cynicism / internet` |
| Handle | Meta line, `by <handle>` | e.g. `by anon`, `by anon-xksavy`, `by truth-seed` |
| Repetition score | Stats row, `↻ N repeated` | N = number of times this statement was repeated |
| Pressure score | Stats row, `⊘ N pressure` | only visible if > 0 |

**The truth ID is NOT shown on the card face.** See Step 6 for how to get the ID.

### Step 4 — For each card, ask these questions

Fill one row in the inventory table (Section F) per card:

1. What is the statement text?
2. What is the `truthType` badge?
3. What is the origin field?
4. Who is the handle? Is it `anon`, `truth-seed`, a known dev handle, or a real user?
5. Does the statement look like a:
   - Widely-repeated cultural belief (T1/T3/T4)?
   - Personal/individual belief output from Belief Engine (T2)?
   - Keyboard smash or test artefact (T6)?
   - Something sensitive but real (T7)?
   - Something unclear (T9)?
6. Does `→ claim exists` badge appear?

### Step 5 — Scroll and screenshot

- After recording the first screen of cards, scroll down.
- Save each screen as `truths_scroll_01.png`, `truths_scroll_02.png`, etc.
- Record the total count only after all cards are visible.

### Step 6 — Getting the truth ID from DevTools (read-only)

The card does not show the ID. To find it:

**Option A — Network tab:**
1. Open DevTools → Network tab.
2. Reload the Truths page.
3. Find the `GET /api/truths` request.
4. Click it → Response tab.
5. In the JSON, find the truth by its `statement` text.
6. Copy the `id` field (e.g. `tru_abc123def456`).

**Option B — Console:**
```js
// Paste in DevTools console after Truths tab loads:
fetch('/api/truths?limit=100').then(r=>r.json()).then(d=>
  d.truths.forEach(t=>console.log(t.id, '|', t.statement.slice(0,60), '|', t.handle))
)
```
This prints `id | statement | handle` for every public truth.

Do **not** submit or post anything. This is a read-only inspection.

### Step 7 — Check admin Review queue for pending truths

1. Click **Review** tab.
2. Enter admin token.
3. Select **All** filter.
4. Look for cards with a yellow `truth` badge.
5. Note how many truth items are in `review` (pending) vs `rejected` vs `public`.
6. Record:

| State | Count |
|---|---|
| public truths (Review queue or Truths tab total) | |
| pending truths in Review queue (`review` state) | |
| rejected truths in Review queue | |
| archived truths (Archived total count in Audit Summary) | |

### Step 8 — Check the priority watchlist (Section C)

For each item in the priority watchlist, note:
- Is it visible on the public Truths tab?
- Is it in the admin Review queue?
- What state is it in?
- What is the ID?

Fill the watchlist status column in Section C.

---

## C. Priority watchlist

These items must be explicitly searched for and their status recorded.

The public Truths page shows only `review_state='public'` truths. If a watchlist item is
NOT visible on the public page, it is either:
- In review (pending approval) — visible in admin Review queue
- Rejected — visible in admin Review queue under Rejected filter
- Archived — not visible anywhere in the UI
- Never created — not in the database at all

| Statement | Why flagged | Expected ID prefix | Public? | Review/Rejected? | ID | Recommended action |
|---|---|---|---|---|---|---|
| "People are stupid" | Vague insult; was rejected as claim D-84H/D-85G; may exist as seed truth | `tru_seed_*` | ??? | ??? | ??? | If public: return to review. If in review: inspect. If rejected: leave as rejected. |
| "Children should always obey adults" | Was rejected as claim D-84J (public, status=Proven artifact); paternalistic; may exist as seed truth | `tru_seed_*` | ??? | ??? | ??? | If public: return to review. If in review: inspect. |
| "Science has proven it" | Incomplete fragment; rejected as claim D-85F; may exist as seed truth | `tru_seed_*` | ??? | ??? | ??? | If public: return to review. Fragment has no referent. |
| "Belief Engine Profile — Stoic Atheism" | Private profile output seen in early screenshots; should be Drift only, not Truths | `tru_*` | Not expected | Possibly in review | ??? | If in review: reject. If public: return to review. |
| "gfsdhdfhfdhdfhdfhgdfa" | Keyboard smash seen in early screenshots | `tru_*` | Not expected | Possibly in review | ??? | If in review: reject. If rejected: archive if keyword fires. |
| Any keyboard-smash-looking truth | Random chars, no meaning | Any | Not expected | Check review queue | ??? | Reject if confirmed artefact |
| Any truth with `by truth-seed` handle | Seed import handle; seed truths if ever applied to production | `tru_seed_*` | Check | Check | ??? | If public: review. State = review is correct. |
| Any truth with `by anon-xksavy` | Known dev/test handle | `tru_*` | Check | Check | ??? | Inspect; likely artefact |
| Any statement that looks like a profile output | e.g. "Stoic Atheist — Identity: High" | Any | Not expected | Check | ??? | If found anywhere public: return to review |

---

## D. Classification categories

Assign one of these categories to each visible truth.

| Code | Name | Description |
|---|---|---|
| **T1** | Legitimate circulated belief | Widely repeated social belief, slogan, or certainty ("Hard work always pays off", "Trust the experts"). Socially real, even if contested. |
| **T2** | Personal belief / profile output | Statement promoted from a personal Belief Engine session. Origin contains `belief snapshot`. `truthType` is `personal-belief`. Not a widely circulated cultural truth. |
| **T3** | Doctrine / scripture / philosophy | Religious, philosophical, or ideological position ("My religion is the only true path", "Everything happens for a reason"). Legitimate if acknowledged as doctrine, not presented as fact. |
| **T4** | Cultural / social saying | Common motivational or social statement of vague scope ("You can be anything you want", "Money is evil"). |
| **T5** | Pressure-testable truth-to-claim candidate | A truth that is specific and falsifiable enough to convert to a public Claim. `linkedClaimId` may already be set. |
| **T6** | Obvious keyboard smash / test artefact | No meaningful content (e.g. "gfsdhdfhfdhdfhdfhgdfa"), or contains explicit test/smoke markers. |
| **T7** | Sensitive / offensive but socially real | Offensive phrasing but describes a real circulated belief ("People are stupid"). Do not delete automatically; contextualise. |
| **T8** | Duplicate / near-duplicate | Similar or identical statement to another truth in the feed. |
| **T9** | Unclear / needs inspect | Can't categorise from the card face alone; requires ID lookup and admin Inspect to determine. |

---

## E. Recommended policy per category

| Category | Recommended handling |
|---|---|
| **T1** | Keep public. Add "not verified" label (D-92C). No action needed now. |
| **T2** | Return to review if currently public (personal beliefs should not appear identically to cultural truths). Add `personal-belief` badge (D-92C). |
| **T3** | Keep public with `doctrine`/`religious`/`philosophy` lane label. No action now. |
| **T4** | Keep public with `cultural` lane label. No action now. |
| **T5** | No action now; flag for D-92E truth-to-claim bridge clarity review. |
| **T6** | Reject if in review; archive if rejected and policy allows (keyword must fire — handle detection broken for truths per D-92A). No cleanup in this batch. |
| **T7** | Do not reject automatically. Inspect context. If socially real, keep with "widely asserted · not verified" framing. |
| **T8** | No automatic dedup action. Flag for manual confirmation only. |
| **T9** | No action until inspected in admin Review with full ID. |

---

## F. Inventory table

Fill one row per visible truth. Add rows as needed.

| # | Visible statement text (first 80 chars) | ID (via DevTools) | Handle | Origin field | truthType badge | confidenceLabel badge | Repetition score | `→ claim` badge? | Public on Truths page? | Category | Recommended action | Screenshot filename |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | | |
| 2 | | | | | | | | | | | | |
| 3 | | | | | | | | | | | | |
| 4 | | | | | | | | | | | | |
| 5 | | | | | | | | | | | | |
| 6 | | | | | | | | | | | | |
| 7 | | | | | | | | | | | | |
| 8 | | | | | | | | | | | | |
| 9 | | | | | | | | | | | | |
| 10 | | | | | | | | | | | | |
| 11 | | | | | | | | | | | | |
| 12 | | | | | | | | | | | | |
| 13 | | | | | | | | | | | | |
| 14 | | | | | | | | | | | | |
| 15 | | | | | | | | | | | | |
| 16 | | | | | | | | | | | | |
| 17 | | | | | | | | | | | | |
| 18 | | | | | | | | | | | | |
| 19 | | | | | | | | | | | | |
| 20 | | | | | | | | | | | | |
| 21 | | | | | | | | | | | | |
| 22 | | | | | | | | | | | | |
| 23 | | | | | | | | | | | | |
| 24 | | | | | | | | | | | | |
| 25 | | | | | | | | | | | | |
| 26 | | | | | | | | | | | | |
| 27 | | | | | | | | | | | | |
| 28 | | | | | | | | | | | | |
| 29 | | | | | | | | | | | | |
| 30 | | | | | | | | | | | | |

**Priority watchlist items** (fill these first):

| Watchlist item | Found on Truths page? | In Review queue? | State | ID | Category | Action |
|---|---|---|---|---|---|---|
| "People are stupid" | | | | | | |
| "Children should always obey adults" | | | | | | |
| "Science has proven it" | | | | | | |
| "Belief Engine Profile — Stoic Atheism" | | | | | | |
| "gfsdhdfhfdhdfhdfhgdfa" | | | | | | |
| Any `by truth-seed` handle entry | | | | | | |
| Any `by anon-xksavy` entry | | | | | | |

---

## G. Screenshot naming

| Screenshot | When to save |
|---|---|
| `truths_top.png` | After Truths page loads; shows header + first 3–4 cards |
| `truths_scroll_01.png` | After first scroll; shows mid-page cards |
| `truths_scroll_02.png` | After second scroll (if more cards) |
| `truth_item_<short-title>.png` | Any card that looks unusual or is in the watchlist; use the first word or two of the statement in the filename, e.g. `truth_item_people_are_stupid.png` |
| `truth_suspect_<short-title>.png` | Any card you are unsure about — e.g. `truth_suspect_profile_output.png` |
| `truths_review_queue.png` | Admin Review queue with All filter — shows pending truths |
| `truths_inspect_<id-prefix>.png` | If you open Inspect on a truth item in admin queue; use first 8 chars of ID |

---

## H. Stop conditions

Stop and record a note if any of the following occur during the inventory session:

| Condition | Stop because |
|---|---|
| Cannot tell if the page is showing public or cached/preview content | Cannot verify review_state without admin API call |
| Card ID cannot be located via DevTools | Cannot safely plan action without exact ID |
| Statement appears personal or private (looks like a named profile output) | Need to verify it was not a private promotion accident |
| Statement is offensive but clearly describes a real circulated social belief | Do not categorise as T6 — real beliefs are T7 |
| Statement is doctrine or philosophical position | Do not reject — it is a legitimate belief category |
| Statement is a real belief even if it sounds ignorant or wrong | Record as T1/T7; do not clean up without editorial review |
| You see the "Send to Claim Review →" button and are tempted to use it | Do NOT — this is a write action |
| You are unsure if an item is public or in review | Mark as T9; look in admin Review queue to confirm state |
| Queue count does not match expected | Note the discrepancy; do not act |

---

## I. Future batch guidance

| Batch | Scope | Trigger |
|---|---|---|
| **D-92C** | Frontend copy and lane labels — add `personal-belief` badge (G1 from D-92A), "not verified" tag (G2), Drift "private" label (G4), truth type lane chips | After D-92B inventory completed and reviewed |
| **D-92D** | Scoped cleanup of exact confirmed T6 truth artefacts only — reject/archive keyboard-mash or accidentally-submitted profile labels from Truths review queue | Only if D-92B finds confirmed T6 items with exact IDs; requires per-item explicit approval |
| **D-92E** | Drift UX polish — snapshot grouping, date labels, optional delete button for old snapshots | After D-92C ships or independently |
| **D-92F** | Backend belief snapshot delete route — `DELETE /api/belief-snapshots/:id` with user ownership check | After D-92E or independently |

**D-92C does not depend on D-92B finding anything wrong.** The copy polish (not-verified
label, personal-belief badge) is needed regardless of what D-92B finds.

**D-92D only executes if D-92B finds confirmed T6 items.** If the Truths public feed is
clean, D-92D is skipped.

---

## J. What to paste back

After completing the inventory session, paste a message using this compact template:

```
=== D-92B TRUTHS INVENTORY RESULT ===

Total visible truths on public page: ___
Admin Review queue — truths in review state: ___
Admin Review queue — truths in rejected state: ___
Admin Review queue — archived truths total: ___

WATCHLIST STATUS:
- "People are stupid": [visible / in review / rejected / not found] | ID: ___
- "Children should always obey adults": [visible / in review / rejected / not found] | ID: ___
- "Science has proven it": [visible / in review / rejected / not found] | ID: ___
- "Belief Engine Profile...": [visible / in review / rejected / not found] | ID: ___
- "gfsdhdfhfdhdfhdfhgdfa": [visible / in review / rejected / not found] | ID: ___
- Any truth-seed entries: [yes / no] — if yes, list statements
- Any anon-xksavy entries: [yes / no] — if yes, list statements

CATEGORY BREAKDOWN:
- T1 legitimate circulated belief: ___
- T2 personal belief / profile output: ___
- T3 doctrine / philosophy: ___
- T4 cultural saying: ___
- T5 truth-to-claim candidate: ___
- T6 keyboard smash / test artefact: ___
- T7 sensitive but real: ___
- T8 duplicate: ___
- T9 unclear: ___

SUSPICIOUS ITEMS (anything in T2 / T6 / T9 category):
[paste one line per item: statement text | ID | handle | category | notes]

NORMAL ITEMS (T1 / T3 / T4 — no action needed):
[paste count or brief list]

SCREENSHOTS SAVED:
[list filenames]

NOTES / DISCREPANCIES:
[any counts that do not match expected, any unusual items found]
```

---

## K. Pre-inventory verification checklist

Fill before starting:

- [ ] Browser is open at `https://humanx.rinkimirikata.com`
- [ ] Truths tab loads without error
- [ ] DevTools is open (Network or Console tab)
- [ ] Admin token is ready to enter for Review queue check (Step 7)
- [ ] No accidental form submissions have occurred
- [ ] Screenshot tool is ready (`truths_top.png` saved immediately)

Fill after inventory:

- [ ] All visible truth cards recorded in inventory table (Section F)
- [ ] All watchlist items status filled (Section C)
- [ ] Admin Review queue checked for pending/rejected truths
- [ ] Watchlist status column in Section C filled
- [ ] Paste-back template (Section J) completed
- [ ] No action buttons clicked during session

---

## L. What the code confirms about the public Truths feed

From static code analysis (`src/truths.js`, `public/app-v10.js`):

**Public filter:** Only truths with `COALESCE(review_state,'public')='public'` are returned
by `GET /api/truths`. Truths in `review` or `rejected` state are excluded from the public
feed. ✅

**Submission path:** All new truths submitted via the form enter `review_state='review'`.
They are NOT immediately public. ✅

**Seed truths path (post-D-59):** `GET /api/import-truths?mode=apply` now inserts seeds
as `review_state='review'`. If seeds were applied before D-59, they would have been
inserted as `review_state='public'` directly.

**Schema default:** `truths.review_state TEXT DEFAULT 'public'` — any row with a NULL
`review_state` would be treated as public. This is the latent risk from D-92A.

**What the card shows (public page):**
`truthType` badge · `confidenceLabel` badge · `→ claim exists` badge (if linked) ·
statement text · `category · origin: ... · by <handle>` · `↻ N repeated` · `⊘ N pressure`

**The truth ID is never shown on the public card.** DevTools is required to obtain it.
