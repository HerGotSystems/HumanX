# D-92A — Truths and Drift Public Cleanup Audit

**Date:** 2026-06-08
**Type:** Docs-only (direct main) — read-only audit, no mutations
**Static checks:** 204 / 24 / 39

---

## A. Scope and safety

This document is a **read-only audit only**. No live endpoint calls, no moderation
actions, no approve/reject/archive/cleanup operations, no code changes are made in this
batch.

All findings are derived from static code analysis of:
- `public/app-v10.js` — Truths and Drift rendering
- `src/worker.js` — route dispatch and review/cleanup handlers
- `src/truths.js` — `listTruths`, `createTruth`
- `src/truth-claim-bridge.js` — `convertTruthToClaim`
- `src/belief-snapshots.js` — `saveBeliefSnapshot`, `listBeliefSnapshots`
- `src/belief-bridge.js` — `promoteBeliefSnapshot`
- `src/truth-seed.js` — `importTruthSeeds` seed list and insert logic
- `database/humanx_truths_v1.sql` — truths table schema
- `database/humanx_belief_snapshots_v1.sql` — belief_snapshots table schema
- `docs/D89A_PRODUCT_MODEL_AND_OWNERSHIP_AUDIT.md`
- `docs/D91A_REVIEW_QUEUE_DENSITY_AUDIT_AND_CLEANUP_PLAN.md`

---

## B. Current Truths product role

### Intended meaning

**A Truth is a widely-asserted, repeatedly-circulated statement or belief — not an
automatically verified fact.**

The Truths page is designed to surface:
- Social slogans ("Hard work always pays off")
- Doctrines ("My religion is the only true path")
- Inherited certainties ("Children should always obey adults")
- Contested cultural beliefs ("People are stupid")
- Consensus framings ("Trust the experts" / "Never trust the experts")

Recording something as a Truth does **not** imply the platform endorses it or has verified
it. The `truthType` field distinguishes `common`, `cultural`, `religious`, `political`,
`scientific`, `family`, `personal-belief`.

The intended user journey:
1. A user records a statement they believe circulates widely.
2. It enters `review_state='review'` (moderation queue).
3. An admin approves it → `review_state='public'`.
4. If pressure-testable, an admin or user converts it to a Claim via **Send to Claim Review**.

### Copy on the current Truths page

`renderTruths` already includes the disclaimer:
> "Statements that circulate as fact — slogans, doctrines, inherited certainties, repeated
> beliefs. Recording a truth here does not verify it."

And the badge: `widely asserted · not auto-verified` (b-yellow).

This is mostly correct copy. Key gaps in the current copy (see Section F for
recommendations):
- Truths submitted via **Save as Truth** from Drift (Belief Engine promote path) are
  `personal-belief` origin, but render identically to widely-repeated cultural beliefs.
- The word "Truths" as a tab name implies verified content — the tab label alone misleads
  first-time users.
- `repetitionScore` shows "↻ 1 repeated" for all brand-new truths — the "1" implies
  one repetition has occurred, but it's actually the creation record.

---

## C. Current Drift product role

### What Drift currently is

Drift is a **personal belief-tracking workspace**. It renders the current user's
`belief_snapshots` — saved outputs from the Belief Engine tool. It is:
- **Entirely private** — `listBeliefSnapshots` queries `WHERE bs.user_id=?`; no other user's
  snapshots are ever shown.
- **Not a public feed** — there is no public-facing Drift route; the tab only renders data
  owned by the authenticated user (identified by `x-humanx-user` header).
- **Not moderated** — `belief_snapshots` has no `review_state` column; snapshots are stored
  as submitted and never go through admin review.

### What Drift displays

```
renderDrift():
  ├─ Full Belief Engine Profiles (isFullBeliefProfile = true)
  │    └─ renderProfileDrift: drift comparison panel (earliest → latest profile)
  │         → stability/openness/pressure/contradiction delta meters
  │         → beliefSnapshotCard per profile
  └─ Quick Belief Records (isFullBeliefProfile = false)
       → grid of beliefSnapshotCard
```

**`isFullBeliefProfile(s)`** fires on:
- `source` contains `'standalone-humanx-belief-engine'`
- `engineVersion` contains `'humanx-belief-engine'`
- `label` contains `'Belief Engine Profile'`

### Why Drift felt less professional in early screenshots

The "weird" content visible in early Drift screenshots (e.g. "Belief Engine Profile —
Stoic Atheism", keyboard-mash labels, "gfsdhdfhfdhdfhdfhgdfa") was the **developer's own
test data** from past Belief Engine sessions — not other users' content. This content was
never public. The issue is that:

1. Old test profiles accumulate in Drift with no way to delete them from the UI.
2. The Drift workspace has no "clear old snapshots" action.
3. The header just says "Drift" with no explanation of what it means.
4. Full profiles and quick records are visually similar but conceptually very different.

**There is no public content leak in Drift.** The only fix needed is UI/UX polish and
optionally a snapshot-delete action.

---

## D. Code and data flow audit

### D1 — Truths

| Aspect | Detail |
|---|---|
| **Route** | `GET /api/truths` → `listTruths()` in `src/truths.js` |
| **Route** | `POST /api/truths` → `createTruth()` in `src/truths.js` |
| **Route** | `POST /api/truth-to-claim` → `convertTruthToClaim()` in `src/truth-claim-bridge.js` |
| **Route** | `POST /api/belief-promote` (target=truth) → `promoteBeliefSnapshot()` → `promoteToTruth()` in `src/belief-bridge.js` |
| **Route** | `GET /api/import-truths` (admin) → `importTruthSeeds()` in `src/truth-seed.js` |
| **Table** | `truths` — see schema below |
| **Public filter** | `WHERE COALESCE(t.review_state,'public')='public'` — NULL treated as public (schema DEFAULT is 'public') |
| **Submission path** | `createTruth`: inserts `review_state='review'` ✅ |
| **Belief promote path** | `promoteToTruth`: inserts `review_state='review'` ✅ |
| **Seed import path** | `importTruthSeeds` (D-59+): inserts `reviewState` param, default `'review'` ✅ |
| **Seed import pre-D-59** | Inserted as `review_state='public'` ⚠️ — if seeds were ever applied before D-59, they are publicly visible |
| **Admin review path** | Appears in review queue when `COALESCE(review_state,'public') NOT IN ('public','archived')` |
| **Approve/reject** | `reviewDecision` supports `target_type:'truth'` → `public`/`review`/`rejected` |
| **Archive** | `reviewCleanup` supports `target_type:'truth'` → `review_state='archived'` |
| **Deletion/hard delete** | No hard-delete route exists for truths |
| **Report path** | `reportTarget` supports `target_type='truth'` in worker.js (audit needed for confirmation) |

#### Schema gap — `review_state DEFAULT 'public'`

```sql
-- database/humanx_truths_v1.sql
review_state TEXT DEFAULT 'public'
```

This is a deliberate legacy design (existing truths stay visible when migration runs).
The risk: **any truth inserted without an explicit `review_state` would be immediately
public**. All current code paths set `review_state` explicitly, but this is a latent risk
if a future code path omits the field.

#### Schema gap — `status_locked` not on truths

`reviewCleanup` checks `row.status_locked` for truths:
```js
row = await env.DB.prepare(
  `SELECT id,statement,review_state,status_locked FROM truths WHERE id=?`
).bind(targetId).first();
// ...
const locked = row.status_locked || 0;
if (locked) return json({ error: 'CLEANUP_REQUIRES_NOT_LOCKED' }, 400);
```

The `truths` table has no `status_locked` column. `row.status_locked` is always
`undefined`, so `undefined || 0 = 0` — the lock check always passes for truths. This is
functionally correct (truths are never locked) but the SELECT query references a
non-existent column. D1 returns NULL for unknown columns in `SELECT *` / named-field
queries; explicit `SELECT ... status_locked ...` on a table without that column silently
returns NULL. Non-blocking, but worth noting.

#### Backend gap — handle detection broken for truths in `reviewCleanup`

```js
// reviewCleanup fetches trust row:
row = await env.DB.prepare(
  `SELECT id,statement,review_state,status_locked FROM truths WHERE id=?`
).bind(targetId).first();
// ...
const handle = (row.handle || '').toLowerCase();  // row.handle is always undefined for truths
const handleMatch = DEV_HANDLES.has(handle);       // never fires
```

The truths SELECT does not JOIN the `users` table. `row.handle` is always `undefined` →
`handleMatch` is always `false` → **dev handle signal never fires for truths**. The
"Archive test artefact" button for a truth from `anon-xksavy` would show in the UI
(frontend `isSuspectedTestArtefact` fires on handle), but the backend would return
`CLEANUP_REQUIRES_TEST_ARTEFACT` unless the truth text contains a keyword.

This is a backend gap: truths submitted by dev handles cannot be archived via handle
signal. They need a keyword in the statement text to pass the artefact check.

---

### D2 — Drift

| Aspect | Detail |
|---|---|
| **Route** | `GET /api/belief-snapshots` → `listBeliefSnapshots()` in `src/belief-snapshots.js` |
| **Route** | `POST /api/belief-snapshots` → `saveBeliefSnapshot()` |
| **Route** | `POST /api/belief-promote` → `promoteBeliefSnapshot()` → truth or claim |
| **Table** | `belief_snapshots` — no `review_state`; always private per-user |
| **Visibility** | Entirely private: `WHERE bs.user_id=?` — no public feed, no admin visibility |
| **Moderation** | Not moderated — no `review_state`, no admin queue for snapshots |
| **Public-facing?** | No — Drift tab is personal only; unauthenticated users see empty state |
| **Promote to truth** | `promoteBeliefSnapshot(target:'truth')` → inserts truth at `review_state='review'` |
| **Promote to claim** | `promoteBeliefSnapshot(target:'claim')` → inserts claim at `review_state='review'` |
| **Deletion** | No delete route exists for belief snapshots; no UI delete button |
| **Test data accumulation** | Dev test sessions permanently accumulate in Drift with no cleanup path |

---

## E. Public cleanup candidate categories

These categories define what types of Truths/Drift content may need cleanup attention.

### E1 — Seed truths from pre-D-59 import (HIGH RISK if applied)

The `SEED_TRUTHS` list in `src/truth-seed.js` contains 12 entries:

| Statement | truth_type | Risk |
|---|---|---|
| "Money is evil" | common | Low — generic cultural belief |
| "Hard work always pays off" | cultural | Low — common proverb |
| "Everything happens for a reason" | religious | Low — common comfort belief |
| "Trust the experts" | institutional | Low — legitimate contested belief |
| "Never trust the experts" | common | Low — legitimate counterpoint |
| "The customer is always right" | common | Low — business slogan |
| "Children should always obey adults" | family | **Medium** — was rejected as claim in D-84J (paternalistic, potentially harmful framing) |
| "Science has proven it" | scientific | **Medium** — incomplete fragment rejected as claim (D-85F) |
| "My religion is the only true path" | religious | **Medium** — doctrinally divisive; acceptable as a recorded belief but sensitive |
| "People are basically good" | common | Low — benign philosophical belief |
| "People are stupid" | common | **High** — vague insult; was rejected as claim D-84H and D-85G |
| "You can be anything you want" | cultural | Low — common motivational belief |

**Key question: were these seeds ever applied to production?**

`GET /api/import-truths?mode=apply` must be called explicitly. This route requires admin
auth. From D-54 records: "truths classified: 9 launch-candidate, 3 needs-framing
(children/adults, religion/only-path, people-are-stupid)." From D-59: the route now
defaults to `dry-run`. There is no record in PROJECT_STATE.md of `?mode=apply` being
executed for truths. **The seeds are likely NOT in the production DB.** But this must be
confirmed by live inspection before any cleanup.

If the seeds WERE applied before D-59, "People are stupid", "Children should always obey
adults", and "Science has proven it" would be publicly visible as Truths.

### E2 — Personal belief outputs promoted to Truths

When a user promotes a Drift snapshot to a Truth, the origin is `'belief snapshot'` and
the `truth_type` is `'personal-belief'`. These are **individual personal beliefs**, not
widely-asserted cultural truths. They should not appear under the same visual treatment as
"Trust the experts" or "Hard work always pays off."

The mix creates UX confusion: the Truths page currently shows both widely-circulated
cultural beliefs and individual personal belief snapshots side by side without distinction.

### E3 — Broad, low-quality, or tautological truths

Statements like:
- "Belief Engine Profile — Stoic Atheism" (if a user's profile label was accidentally
  submitted as a truth statement)
- Very short or fragment statements ("God", "ok", single words)
- Statements that are actually questions or URL fragments

All enter review before going public, so the primary guard is admin review — but there is
no quality hint system for truths analogous to `claimQualityHints` for claims.

### E4 — Duplicate truths

`createTruth` has normalized-statement deduplication: if the normalized text matches an
existing truth, it increments `repetition_score` instead of creating a new row. This is
correct. However:
- Truths from different originators with slightly different wording (punctuation, case)
  are NOT deduplicated (the normalization uses `meaningKey` which strips punctuation and
  lowercases, so most near-duplicates ARE caught).
- Near-duplicate truths without exact meaning match can accumulate.

### E5 — Truths from known dev/test handles

Truths submitted by `anon-xksavy`, `anon-73d9y2`, `anon-ek3562`, `humanx-seed` — if any
were created during testing — would appear in admin review. Frontend detects them via
`isSuspectedTestArtefact`. Backend handle detection is broken for truths (see D2 gap
above).

### E6 — Socially sensitive but legitimate circulated beliefs

Statements like "People are stupid" or "My religion is the only true path" are:
- Offensive to many
- Genuinely widely circulated as social beliefs
- Appropriate to record as a Truth of type `common` or `religious`
- **NOT appropriate** to auto-delete purely because they are offensive

The correct approach is: approve with a `truth_type` label that contextualizes it (e.g.
`cynicism`), not suppress it entirely.

### E7 — Drift test snapshot accumulation

Old belief snapshots from dev test sessions accumulate indefinitely with no delete path.
These are private but create visual noise for the developer account in the Drift view.
This is a UX problem (developer-facing), not a public content problem.

---

## F. Product language recommendation

### Truths page

| Current | Recommended |
|---|---|
| Tab label: "Truths" | Tab label: "Truths" (keep — changing creates confusion) but add sub-label |
| Badge: `widely asserted · not auto-verified` | Keep — correct framing |
| Empty-state copy | Add: "These are not verified by HumanX. Record what circulates, then test it." |
| Form CTA: "Submit Truth for Review" | Keep — correct |
| Card action: "Send to Claim Review →" | Add tooltip: "Converts this repeated belief into a pressure-testable public claim." |
| Missing | Add `personal-belief` badge when `origin` contains 'belief snapshot' or `truth_type='personal-belief'` |
| Missing | Add `not verified` visual tag near truth_type badge for all truths |
| `repetitionScore` "↻ 1 repeated" | Consider "↻ 1 assertion" for fresh truths to avoid implying prior repetitions |
| Missing origin chip for dev handles | Add origin chip using same `reviewItemOriginLabel` logic used in Review |

Recommended truth-type lane labels for UI:

| truth_type | Suggested display badge |
|---|---|
| `common` | Common |
| `cultural` | Cultural |
| `religious` | Religious / Doctrine |
| `political` | Political |
| `scientific` | Consensus / Science |
| `family` | Family wisdom |
| `personal-belief` | Personal belief |
| `institutional` | Institutional |

### Drift page

| Current | Recommended |
|---|---|
| Heading: "Drift" | Add subheading: "Your belief profile over time — private to you" |
| Badge: "N full profiles · N quick records" | Keep |
| No product explanation | Add: "Drift tracks how your beliefs shift across Belief Engine sessions. Snapshots here are private. Promote to a Truth or Claim to share with the platform." |
| No delete action | Consider: delete individual snapshot (future D-92E/D-92F scope) |
| Empty state: "No belief snapshots yet" | Keep — clear |
| Profile card label | Show `dominantPattern` more prominently; de-emphasise raw score meters for quick records |

---

## G. UI cleanup recommendations (frontend-only)

All items in this section are safe frontend-only changes requiring no backend or D1 change.

### G1 — Add `personal-belief` badge to truth cards (priority)

When `t.origin` contains `'belief snapshot'` or `t.truthType === 'personal-belief'`, add
a distinct badge (e.g. muted amber `b-muted`) so users understand these are individual
promoted beliefs, not widely-circulating cultural statements.

```js
const isPersonalBelief = (t.truthType === 'personal-belief') ||
  String(t.origin || '').includes('belief snapshot') ||
  String(t.origin || '').includes('belief-snapshot');
// then render: <span class="badge b-muted">personal belief</span>
```

### G2 — Add "not verified" label near truth_type badge

All truth cards should show a subtle muted "not verified" tag (e.g. via CSS `::after` or
inline `<span class="badge b-muted">not verified</span>`). This prevents any truth type
from being misread as platform-endorsed fact.

### G3 — Add origin chip for dev/test handles on truth cards

Apply `reviewItemOriginLabel` logic (already in app-v10.js from D-87B) to truth cards
in the public Truths view. If `t.handle` is a known dev handle, show a muted chip. This
mirrors what Review cards already do.

### G4 — Drift: add "private" badge

The Drift section header should include a badge or note indicating privacy:
```html
<span class="badge b-muted">private · only you can see this</span>
```

This prevents new users from thinking Drift is a public feed.

### G5 — Drift: product explanation paragraph

Add a one-liner below the header explaining what Drift is:
> "Drift tracks how your beliefs shift across Belief Engine sessions. These snapshots are
> private to you. Use Save as Truth or Send to Claim Review to share with the platform."

### G6 — Truth type filter chip (optional D-92C scope)

Add a horizontal filter bar on the Truths page similar to the Review filter chips, allowing
filter by `truthType`. This helps users quickly separate `religious` truths from `cultural`
or `scientific consensus` entries.

### G7 — Truths quality hints (optional, frontend-only)

Add a `truthQualityHints(statement)` helper analogous to `claimQualityHints` that
flags:
- Statements under 6 chars
- Statements that are URL-like
- Statements that appear to be proper names or profile labels
- Statements ending in `?` (these are questions, not assertions)

This would surface advisory hints to the admin in the Review Inspect panel for truth items,
helping triage.

### G8 — Drift: snapshot count badge per section

Show count of snapshots per section with a more precise label:
- "2 profiles since [earliest date]" instead of just "2 full profiles"
- "3 quick snapshots" with creation date range

---

## H. Moderation cleanup policy

The following policies apply to any future Truths/Drift cleanup batch.

### H1 — Keyboard-smash / gibberish truths

**Action:** Reject in admin Review (already requires rejected state before archive).
**Archive:** Allowed via `reviewCleanup` if keyword (`\btest\b`, `smoke`) or dev handle
fires. Note backend handle gap — see Section D1. May need `junk_override:true` with reason.
**Stop condition:** Do not reject/archive unless confirmed keyboard-mash (no meaning).

### H2 — Personal profile outputs accidentally submitted as truths

A statement like "Belief Engine Profile — Stoic Atheism" is a profile label, not a truth
statement. If one exists in the Truths review queue:
- State = `review`: Reject it.
- State = `rejected`: Archive it (if artefact signal fires — keyword "profile" may not
  fire; may need `junk_override:true`).
**Stop condition:** Do not archive a truth that might be a genuine personal belief about
Stoic atheism.

### H3 — Broad social beliefs ("People are stupid")

These are real circulated beliefs. The correct handling:
- If in review: Approve with `truthType='common'` to make context clear.
- If already public: Leave as-is unless reported.
- Do not reject purely on the basis of being offensive.
- Consider adding a "not verified, not endorsed" tag (G2) before approving.

### H4 — "Children should always obey adults" seed truth

This was rejected as a claim in D-84J (public, status=Proven artifact, paternalistic).
If it exists as a truth (imported via seed):
- It is a real circulated family belief — not automatically wrong to record.
- As a Truth it should carry `truthType='family'` and `confidenceLabel='claimed'`.
- Action: Inspect; if origin is seed import and state is public, return to review.
- Do not reject — it is a legitimate controversial belief that the platform records.

### H5 — Duplicate truths

Do not archive duplicate truths without manual confirmation.
The `normalized_statement` deduplication catches most cases; near-duplicates that slipped
through require human judgment.

### H6 — Old Drift test snapshots

No action needed — they are private. If the developer wants to clean their Drift view,
a future D-92E or D-92F can add a UI delete action for belief snapshots.

---

## I. Manual inventory template

Use this table to record Truths and Drift state from a live browser session.

### Truths inventory

Fill by opening `/truths` tab (no admin token needed — public feed) + admin Review queue
(Truths filter if added, or search by target_type in All view).

| Item ID | Type | Statement (first 80 chars) | Origin / Handle | truth_type | review_state | Reports | Category (E-code) | Recommended action | Notes |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |

### Drift inventory

Drift is private — the developer can inspect their own Drift view.

| Snapshot ID | label | dominant_pattern | source | created_at | isFullProfile? | Category (E-code) | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

---

## J. Future batches

| Batch | Description | Type |
|---|---|---|
| **D-92B** | Manual live Truths/Drift inventory — user fills inventory template (Section I) from browser | User action + docs |
| **D-92C** | Frontend copy and label polish — add `personal-belief` badge (G1), "not verified" tag (G2), Drift "private" badge (G4), Drift explanation paragraph (G5) | Frontend branch + PR |
| **D-92D** | Scoped cleanup of confirmed Truths test artefacts — reject/archive keyboard-mash or accidentally-submitted profile labels from Truths review queue | Live moderation (gated) |
| **D-92E** | Drift UX polish — snapshot type grouping, count + date range labels, optional delete action for old snapshots | Frontend branch + PR |
| **D-92F** | Belief snapshot delete route — backend `DELETE /api/belief-snapshots/:id` with user ownership check | Backend branch + PR |
| **D-92G** | Truth quality hints — add `truthQualityHints()` helper for admin review inspect panel | Frontend branch + PR |

---

## K. Stop conditions

Apply these when planning or executing any future Truths/Drift cleanup:

| Condition | Do not proceed because |
|---|---|
| Rejecting a truth because it is offensive | Offensive beliefs are legitimate records if widely circulated |
| Labelling a truth "proven" or "disproven" | The platform does not verify truths |
| Auto-converting a truth into a claim | Conversion must be user or admin initiated; never automatic |
| Deleting a belief snapshot without user consent | Snapshots are personal; user must initiate deletion |
| Archiving a truth that has `linked_claim_id` set | The linked claim may depend on this truth for the truth-claim bridge |
| Acting on Drift content thinking it is public | Drift is private; no public leak exists |
| Bulk archiving truths by keyword | Each truth must be individually confirmed before action |
| Archiving truths with the backend handle signal | Handle detection is broken for truths (see D1 gap) — rely on keyword or manual `junk_override` |
| Importing seed truths without `?mode=dry-run` first | Always dry-run before apply; confirm no `SOURCE_NEEDED` or `review_state` bypass |

---

## L. Files inspected

| File | What was audited |
|---|---|
| `public/app-v10.js` | `renderTruths`, `renderDrift`, `truthCard`, `beliefSnapshotCard`, `renderProfileDrift`, `isFullBeliefProfile`, `submitTruth`, `convertTruth`, `promoteBelief`, `loadTruths`, `loadBeliefSnapshots` |
| `src/worker.js` | Route dispatch (lines 35–49), `reviewDecision` truth branch, `reviewCleanup` truth branch, `reviewQueue` truth query, `claimLineage` truths join |
| `src/truths.js` | `listTruths` (public filter), `createTruth` (review_state on insert), `mapTruth` |
| `src/truth-claim-bridge.js` | `convertTruthToClaim`, `insertClaimWithNormalizedKey`, `findExistingClaim`, `syncTruthLinkState` |
| `src/belief-snapshots.js` | `saveBeliefSnapshot`, `listBeliefSnapshots` (user_id filter), `mapBeliefSnapshot` |
| `src/belief-bridge.js` | `promoteBeliefSnapshot`, `promoteToTruth` (review_state on insert), `promoteToClaim` |
| `src/truth-seed.js` | `SEED_TRUTHS` list (12 entries), `importTruthSeeds` (review_state default 'review' post D-59) |
| `database/humanx_truths_v1.sql` | `review_state TEXT DEFAULT 'public'` schema gap |
| `database/humanx_belief_snapshots_v1.sql` | No `review_state` column on belief_snapshots |
| `docs/D89A_PRODUCT_MODEL_AND_OWNERSHIP_AUDIT.md` | Product model background |
| `docs/D91A_REVIEW_QUEUE_DENSITY_AUDIT_AND_CLEANUP_PLAN.md` | Queue taxonomy C1–C8 |

---

## M. Top findings summary

| Finding | Severity | Recommended fix |
|---|---|---|
| `truths` schema has `review_state DEFAULT 'public'` — NULL = public | Low (all code paths set it explicitly, but latent risk) | Document; add code-review guard |
| Seed truths include "People are stupid", "Children should always obey adults" — unknown if ever applied to production | **Medium** | Confirm via D-92B live inventory |
| `reviewCleanup` truth row SELECT does not JOIN users — `handleMatch` never fires for truths | **Medium** | Fix in future backend batch (D-92D prep) |
| `reviewCleanup` truth SELECT includes `status_locked` column that doesn't exist on truths table | Low (silently NULL, non-breaking) | Add to known code smells; fix with handle join fix |
| Drift is private — "weird" screenshots were developer's own test data, not public | None | Docs clarification only (this doc) |
| No UI delete for Drift snapshots → test data accumulates permanently | Low (private, not public) | D-92F backend delete route |
| Personal-belief truths and cultural truths render identically — no type distinction | Medium (UX) | D-92C frontend polish |
| Truths tab name ("Truths") implies verified content to new users | Low (badge copy already clarifies) | D-92C copy polish |
| No equivalent of `claimQualityHints` for truths — admin has no advisory signals in inspect panel | Low | D-92G optional |
