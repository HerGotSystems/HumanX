# D-93C — Borderline Truth / Truth-Derived Claim Policy Audit

**Date:** 2026-06-09  
**Mode:** DOCS-FIRST AUDIT ONLY — no cleanup, no mutation, no backend change, no Wrangler, no D1.  
**Baseline:** hardening-smoke-test 254 / belief-engine-static-check 24 / worker-route-static-check 39 — all passing.  
**Branch at time of audit:** `fix/d93b-truth-admin-cleanup-ergonomics` (D-93B complete)

---

## A. Scope and Audit Questions

This audit answers six policy questions raised at the end of D-93A/D-93B:

1. Should `SMALL INDEFERENT TRUTH` remain visible while its Truth-derived claim stays rejected/pending?
2. Should borderline truths have a disabled/warned "Pressure-test as Claim" path?
3. Should Review cards for borderline Truth-derived claims show an admin-only badge?
4. Should the Review inspect panel surface "derived from borderline truth" context?
5. Should there be a separate admin "withdraw borderline truth" action, distinct from artefact archive?
6. What is the safest policy for future borderline Truth-derived claims?

---

## B. Current Observed Architecture

### B.1 Truth card → Pressure-test path

```
Truths page (renderTruths)
  └─ truthCard(t)
        ├─ always: NOT VERIFIED badge
        ├─ isTruthPersonalBelief(t)  → personal belief badge (public)
        ├─ isTruthArtifact(t)        → ? ARTEFACT badge + archive button (admin-only)
        ├─ isTruthBorderlineArtefact(t) → ? BORDERLINE badge (admin-only, advisory)
        └─ "Pressure-test as Claim →" button
              └─ convertTruth(t.id)
                    └─ POST /api/truth-to-claim
                          └─ truth-claim-bridge.js
                                ├─ creates claim type='Truth-Derived'
                                ├─ status='Plausible'
                                ├─ category = truth.category || 'truth-derived'
                                └─ links claim back to truth via linked_claim_id
```

The "Pressure-test as Claim" button appears on **all** truth cards regardless of borderline status. There is no suppression, warning, or count-gate for borderline truths.

### B.2 Truth-derived claim in the Review queue

Once a Truth-Derived claim exists it enters the Review queue alongside user-submitted claims. The Review queue:
- Loads via `GET /api/review` (admin token required)
- Renders via `reviewCard(item)` — type/state/score badges, category label
- Inspect panel via `renderReviewInspectPanel(item)` — full metadata including `claim_type`, scores, linked truth context

The inspect panel currently shows:
- `claim_type` field (would show `Truth-Derived`)
- `category` field (would show truth's category, e.g., `SMALL INDEFERENT TRUTH`)
- `linked_claim_id` / linked truth button (if set)
- Evidence, testability, survivability scores
- State (Plausible / Pending / Rejected)

There is **no special badge** on Review cards for borderline-origin Truth-Derived claims. The inspect panel does not currently note "this claim was derived from a borderline truth."

### B.3 Live state of `SMALL INDEFERENT TRUTH` — `tru_67ae90e56f7449ee85`

| Attribute | Value |
|---|---|
| Truth ID | `tru_67ae90e56f7449ee85` |
| Statement | `SMALL INDEFERENT TRUTH` |
| Status | Public / still visible on Truths page |
| `isTruthArtifact` result | **false** — slipped all 4 heuristics (correct vowel ratio, not a single generic word, not repeated syllable, not too short) |
| `isTruthBorderlineArtefact` result | **true** — all-caps, 3 words, 22 chars ≤ 40 |
| Admin badge shown | `? BORDERLINE` (admin-only, advisory) |
| Archive button shown | **No** — borderline badge deliberately carries no archive button |
| Linked Truth-Derived claim | `clm_30889d651e3b4b2cb6` |
| Claim category | `SMALL INDEFERENT TRUTH` |
| Claim type | `Truth-Derived` |
| Claim status | Plausible / Pending Review / Not Public |
| Claim scores | Evidence 5/100, Testability 50/100, Survivability 50/100 |

The claim is in a limbo state: the truth it came from is borderline-flagged, the claim itself is not approved/public, and no admin action has been taken on either.

---

## C. Risk Analysis

### C.1 False cleanup risk

**HIGH** if any automatic or text-based cleanup is introduced.

`SMALL INDEFERENT TRUTH` passes the borderline heuristic — it looks like random all-caps noise. But:
- It was a real user submission (repeated enough to enter the Truths pool)
- Its category mirrors its statement (`SMALL INDEFERENT TRUTH`) — it may express something intentional (theological indifference, Stoic minimalism, ironic commentary)
- The associated claim `clm_30889d651e3b4b2cb6` is Plausible and has non-zero scores

Cleaning it via text match, bulk action, or automatic borderline-sweep would set a precedent that **all-caps stylised beliefs are invalid** — which is false. `TRUST THE EXPERTS`, `NEVER TRUST THE EXPERTS`, `MY BODY MY CHOICE` could all match the same heuristic.

**Constraint confirmed:** Do not treat borderline as artefact. Borderline badge is advisory only.

### C.2 Public confusion risk

**LOW** for the truth itself.  
The Truths page already shows `NOT VERIFIED` on every card. `? BORDERLINE` is admin-only, invisible to public users. Public users see the truth statement with no special negative signal.

**MEDIUM** for the derived claim.  
`clm_30889d651e3b4b2cb6` is currently not public (pending review). If it were approved, the Review queue would show a claim with category `SMALL INDEFERENT TRUTH` — which is the statement repeated as the category, a category-echo pattern. Users inspecting the claim would see the category label and may find it confusing or meaningless. This is a known risk of Truth-Derived claims inheriting the truth's raw category field.

### C.3 Moderation burden

**LOW currently.**  
With the D-93B filter chips, an admin can isolate all borderline truths in one click. The borderline count is surfaced in the admin bar. No new Review queue work is required unless the admin explicitly actions the linked claim.

**Increases if `? borderline` truth count grows** without a corresponding policy to either leave them, soft-withdraw them, or review their derived claims separately.

### C.4 Accidental censorship of real beliefs

**HIGH RISK if borderline policy is applied broadly.**

The all-caps multi-word heuristic is a stylistic signal, not a content signal. Many real beliefs are expressed in all caps:
- `TRUST THE EXPERTS`
- `NEVER TRUST THE EXPERTS`
- `MY RELIGION IS THE ONLY TRUE PATH`
- `SCIENCE HAS PROVEN IT`

These are all socially real, sensitive, or user-meaningful — they must remain visible and untouched. The borderline heuristic catches them **by style**, not by meaning. Any policy that auto-acts on borderline truths risks deleting real beliefs that happen to be formatted in all caps.

**Constraint confirmed:** Do not hide or clean borderline truths automatically. Do not treat them as artefacts.

### C.5 ID safety / exact-target safety

Current architecture is safe:
- `archiveTruthArtefact(id)` requires exact ID, admin token, confirmation dialog
- No borderline archive button exists — the only action path is manual admin curl or a future explicit withdrawal action scoped to an exact ID
- The linked claim `clm_30889d651e3b4b2cb6` can only be acted on from the Review queue using `reviewDecisionUI(type, id, decision)` — also exact-ID-based

No bulk or text-matching paths exist in the current codebase for truths or Truth-Derived claims.

---

## D. Recommended Policy: `SMALL INDEFERENT TRUTH` (`tru_67ae90e56f7449ee85`)

### Current status: leave it visible. Do not archive now.

Rationale:
1. `isTruthArtifact` correctly did not flag it — the statement has real vowel ratio and is not a single generic placeholder word.
2. `isTruthBorderlineArtefact` flags it as advisory — this is the correct signal level. Advisory means "look at this" not "delete this."
3. The statement could be intentional. "Small indifferent truth" is a plausible philosophical or ironic self-description for a minimally contentious fact.
4. Its linked claim `clm_30889d651e3b4b2cb6` is not public and has non-zero scores. It is not harmful in its current state.

### Recommended action for linked claim `clm_30889d651e3b4b2cb6`

Keep Pending. Do not approve; do not reject. The claim is not harmful, not public, and its Truth parent is borderline but not artefact. No pressure to act.

If at a later date the admin determines the truth is genuinely meaningless, the correct path is:
1. (Future) Use a "withdraw borderline truth" action (see E.5 below) — not the artefact archive button.
2. After truth withdrawal, the linked claim should be rejected via Review queue, exact ID only.

---

## E. Recommended Policy: Future Borderline Truth-Derived Claims

### E.1 Do not suppress the "Pressure-test as Claim" button for borderline truths

Reasons:
- The borderline classification is stylistic, not semantic. The truth may still be pressure-testable.
- Suppressing the button would make the admin's private classification invisible to the user without explanation.
- If the truth should not be pressure-testable, the correct fix is to withdraw the truth first.

Optional future enhancement (safe, not urgent): show a tooltip or subdued note on the button when `isTruthBorderlineArtefact` is true and user is admin: *"This truth is flagged borderline — consider whether it merits a claim."* This is advisory only, no blocking.

### E.2 Do not approve Truth-Derived claims from borderline truths until the truth is reviewed

This is a **Review queue moderation policy**, not a code change:
- When an admin sees a Review card with `claim_type: Truth-Derived` and the category echoes the statement (category-echo pattern), check the source truth before approving.
- A category-echo is a signal: the truth's category field was populated from the statement itself — common for truths entered without manual categorisation.
- Keep Pending until the source truth has been reviewed.

### E.3 Do not allow bulk rejection of Truth-Derived claims

All claim actions remain exact-ID-based. No bulk or filter-based decisions.

### E.4 Do not conflate borderline with artefact

Artefact = definitively junk (keyboard mash, single generic word, too short, repeated syllable). Archive path exists.  
Borderline = stylistically suspicious but potentially real. Advisory badge only. No archive button.  
These must remain two distinct lanes.

### E.5 Future: "withdraw borderline truth" action (later, not now)

If there is a future need to remove borderline truths that are confirmed meaningless, this should be a **separate, named action** from artefact archive:

| Property | Artefact Archive | Borderline Withdraw (future) |
|---|---|---|
| Trigger | `isTruthArtifact(t)` | `isTruthBorderlineArtefact(t)` |
| Button label | `archive artefact` | `withdraw borderline truth` |
| Confirmation | Yes | Yes + reason required |
| Backend endpoint | `/api/review/cleanup` + `junk_override:true` | TBD — new endpoint or distinct reason string |
| ID targeting | Exact only | Exact only |
| Bulk | No | No |
| Available now | Yes (D-92G) | Not yet |

This is deferred — do not build now. Requires backend policy thought (what "withdrawn" means for a truth vs. archived).

---

## F. UI/UX Recommendations

### F.1 Safe now / frontend-only

| ID | Recommendation | Rationale |
|---|---|---|
| UI-1 | Add admin tooltip to "Pressure-test as Claim" button when truth is borderline | Advisory signal for admins without blocking users. CSS + attribute only. |
| UI-2 | Review inspect panel: when `claim_type === 'Truth-Derived'`, show origin note: "Derived from truth [ID]" with link | Currently linked_claim_id is shown but there is no explicit "this came from a truth" label. Low-risk read-only display. |
| UI-3 | Review inspect panel: when category echoes statement (normalised equality), show admin-only note: "⚠ category-echo — source truth may be borderline" | Helps admin identify Truth-Derived claims that need truth review before approval. Frontend-only. |
| UI-4 | Review filter bar: add "Truth-Derived" chip when admin token present | Allows admin to quickly isolate all Truth-Derived claims in review queue. Frontend-only, no backend change needed if `claim_type` is already in the queue data. |

### F.2 Later / requires backend or schema thought

| ID | Recommendation | Rationale |
|---|---|---|
| UI-5 | "Withdraw borderline truth" action (distinct from artefact archive) | Requires backend endpoint or distinct `reason` semantics. Schema for `withdrawn` state distinct from `archived`. |
| UI-6 | Prevent "Pressure-test as Claim" if linked claim already exists and is non-rejected | Currently the bridge queries for duplicates, but there is no frontend pre-check before the POST. Prevents accidental duplicate claims from borderline truths. Needs bridge to return `already_exists` state. |
| UI-7 | Surface Truth-Derived claim count on truth card for admins | Requires `converted_claim_count` to be returned in the truths list endpoint — may require a JOIN. Advisory only. |

### F.3 Reject / do not build

| ID | Recommendation Rejected | Reason |
|---|---|---|
| X-1 | Auto-reject or auto-archive borderline Truth-Derived claims | Borderline is advisory. Auto-action risks deleting real beliefs. |
| X-2 | Suppress "Pressure-test as Claim" for borderline truths entirely | Borderline is stylistic, not semantic. Suppression conflates style with validity. |
| X-3 | Bulk "clean borderline" action | No bulk actions on truths or claims. Ever. |
| X-4 | Text-matching cleanup (e.g. "if statement is all-caps, archive it") | Text matching is unreliable and risks deleting real beliefs. |
| X-5 | Auto-promote borderline Truth-Derived claims to public | Truth-Derived claims from unreviewed borderline truths must stay Pending. |
| X-6 | Hide personal-belief truths by default from public | Personal belief content should remain visible; NOT VERIFIED badge is sufficient signal. |

---

## G. Decision Table

| Question | Decision | When |
|---|---|---|
| Keep `SMALL INDEFERENT TRUTH` visible? | **Yes — leave as-is** | Now |
| Act on linked claim `clm_30889d651e3b4b2cb6`? | **Keep Pending** | Now |
| Add admin tooltip on "Pressure-test as Claim" for borderline truths? | **Optional / safe** | Next UI pass |
| Add "derived from truth" label in Review inspect panel? | **Recommended (UI-2)** | Next UI pass |
| Add "category-echo" warning in Review inspect panel? | **Recommended (UI-3)** | Next UI pass |
| Add "Truth-Derived" filter chip in Review queue? | **Recommended (UI-4)** | Next UI pass |
| Add "withdraw borderline truth" action? | **Deferred** | Future, with backend policy |
| Approve `clm_30889d651e3b4b2cb6`? | **No** | Until source truth reviewed |
| Archive `tru_67ae90e56f7449ee85`? | **No** | Not artefact; borderline only |
| Apply borderline policy to socially real all-caps beliefs? | **Never** | Permanent constraint |

---

## H. Protected Beliefs Confirmation

The following truths must remain untouched under all future borderline policies — they are socially real, sensitive, or user-meaningful. Several would trigger `isTruthBorderlineArtefact` if formatted in all caps; that heuristic must never be used to auto-delete:

- People are stupid
- Money is evil
- Trust the experts
- Never trust the experts
- Children should always obey adults
- Science has proven it
- My religion is the only true path
- `tru_53ee59f3fa4247f4be` — Belief Engine Profile — Stoic Atheism (personal-belief policy deferred)

---

## I. No Mutation Performed Confirmation

> **No database mutation was performed during this audit.**  
> No curl commands were executed.  
> No Worker endpoints were called.  
> No D1 queries were run.  
> No Wrangler commands were run.  
> No code was changed.  
> No cleanup was performed.  
> `tru_67ae90e56f7449ee85` and `clm_30889d651e3b4b2cb6` are in the same state as before this audit.

---

## J. Static Checks

Run after audit (read-only verification only):

| Check | Command | Expected |
|---|---|---|
| Hardening smoke | `node scripts/hardening-smoke-test.mjs` | 254 passed |
| Belief engine static | `node scripts/belief-engine-static-check.mjs` | 24 passed |
| Worker route static | `node scripts/worker-route-static-check.mjs` | 39 passed |

---

## K. Files Read During Audit

| File | Purpose |
|---|---|
| `public/app-v10.js` | Frontend helpers, Truth card, Review queue, inspect panel |
| `docs/D92A_TRUTHS_DRIFT_PUBLIC_CLEANUP_AUDIT.md` | Original Truth cleanup policy context |
| `docs/D92C_TRUTHS_PUBLIC_CLARITY.md` | NOT VERIFIED badges, personal-belief badges, Pressure-test button |
| `docs/D92D_TRUTH_EXACT_ID_INVENTORY_SUPPORT_AUDIT.md` | Exact ID architecture |
| `docs/D92E_ADMIN_TRUTH_ID_COPY_UI.md` | Admin ID copy feature |
| `docs/D92F_ARCHIVE_PUBLIC_TRUTH_ARTEFACTS_RESULT.md` | Target list, cleanup attempt, edge case documentation |
| `docs/D92G_ADMIN_TRUTH_ARTEFACT_CLEANUP_UI.md` | Archive artefact button |
| `docs/D92H_TRUTH_ARTEFACT_CLEANUP_LIVE_OUTCOME.md` | Live cleanup result, SMALL INDEFERENT TRUTH edge case |
| `docs/D93A_TRUTH_ADMIN_CLEANUP_ERGONOMICS_AUDIT.md` | Borderline helper design, admin bar, filter chips |
| `docs/D93B_TRUTH_ADMIN_CLEANUP_ERGONOMICS_UI.md` | D-93B implementation details, borderline policy constraints |
| `scripts/hardening-smoke-test.mjs` | Smoke test sections D-92C through D-93B |

## L. Files Created/Changed

| File | Action |
|---|---|
| `docs/D-93C-borderline-truth-derived-policy-audit.md` | Created (this file) |
