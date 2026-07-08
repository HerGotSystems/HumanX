# D-304A — First Outside Submission Review Intake Protocol

**Scope:** Docs only (product process)
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at pass:** `4e718c3` (D-303B)

---

## 1. Purpose

D-297→D-303 made HumanX progressively more self-demonstrating: a demo card, a Home Step 5 explaining Review, and a vocabulary glossary are all now live. D-299A's tester script produced one confirmed result — most invited testers did not respond, but **one outside person likely did submit a real claim**, and it landed in Review exactly where it should have.

That single submission is more valuable right now than another round of Home copy polish. It is the first real evidence of how a cold, unguided person actually uses HumanX — what they typed, whether they understood Review, whether the flow held up outside a controlled test script. This protocol exists so that value isn't wasted: **first outside submissions are product feedback first, and only maybe a publishable Truth second.** Reading a submission and immediately approving or rejecting it, without learning from it, throws away the one thing a test script cannot manufacture — a real, unprompted user action.

This document is a process for Mike to follow in the Review queue admin UI. It creates no new Review states, no new fields, no new routes — it is a way of looking at what is already there.

---

## 2. What to Record Before Taking Action

Before approving, rejecting, or otherwise acting on a first outside submission, record the following from the existing Review inspect panel — no new UI is required, this is information already visible there:

| Field | Where to find it |
|---|---|
| Submission title / claim text | Review inspect panel — the claim statement itself |
| Anonymous/user id, if shown | Review card metadata (handle, or anonymous marker if pseudonymous) |
| Created / updated date | Review card date row |
| Source path, if visible | Whether it looks Builder-originated (structured, has "raw thought"/"why"/"scope"/"falsifier" traces in phrasing), manually typed, or Truth-derived (promoted from a Truth/Belief snapshot) |
| Whether evidence was added | Evidence count/chips on the card or inspect panel |
| Whether claim wording is clear | Read it once as a stranger would — is the claim bounded and testable, or vague/rhetorical? |
| Whether it looks like a real attempt or random test | Does it read as a genuine belief/observation, or as placeholder/junk text ("asdf", "test123", copy-pasted meme text)? |
| Screenshot filename/location, if saved | If Mike screenshots the Review card for records, note where that file lives |

This is a **read-and-record** step, not a data-entry feature. It can be written into the intake table in section 9 by hand — no app change is implied.

---

## 3. Do-Not-Publish-First Rule

State plainly, because it is easy to get backwards under the pressure of "finally, a real submission":

- **Do not approve a first outside submission just because it arrived.** Arrival proves the pipeline works, not that the content is safe or accurate to show publicly.
- **Use the Review queue as intake and learning first, approval second.** The goal of looking at the item is to learn what a cold user actually did, not to clear the queue.
- **Only approve when wording, evidence, and public meaning are safe enough** — the same bar that would apply to any other claim, with no first-submission exception either direction. Do not hold it to a *stricter* bar out of over-caution, and do not hold it to a *looser* bar out of excitement that someone finally submitted something.

This rule exists specifically because a first real submission creates emotional pressure to reward the tester by fast-tracking it. Reward the behavior (submitting) separately from the decision (publishing) — see section 7 for how to close the loop with the tester without that being contingent on approval.

---

## 4. Classification Categories

Every first-wave outside submission gets classified into exactly one of:

| Category | Meaning |
|---|---|
| **Real useful claim** | Understandable, bounded, evidence-attachable claim that could become a good public Claim/Truth as-is or with minor polish |
| **Real but needs better evidence** | Genuine, sincere claim, but currently has no (or weak) evidence attached — not ready for public display yet |
| **Real but too vague** | Genuine attempt, but the wording is not bounded/testable enough to pressure-test (e.g. broad rhetorical statement rather than a specific claim) |
| **Test/junk** | Placeholder text, obvious throwaway content, or clearly not a real belief/observation |
| **Sensitive/high-risk** | Touches politically, medically, legally, or financially sensitive territory where public display carries real-world risk regardless of evidence quality |
| **Duplicate/old internal test** | Matches or closely resembles a claim Mike or an internal tester already submitted during earlier development/testing |

---

## 5. Suggested Action per Category

| Category | Recommended action |
|---|---|
| Real useful claim | Approve, or approve after light wording cleanup if the meaning is unchanged |
| Real but needs better evidence | Keep in Review; do not approve; note what evidence would be needed |
| Real but too vague | Keep in Review; ask tester for clarification if identifiable (section 7), or use as a product-feedback note if not |
| Test/junk | Reject |
| Sensitive/high-risk | Keep in Review; do not approve without deliberate, separate consideration outside the normal intake flow — treat as its own decision, not a queue-clearing item |
| Duplicate/old internal test | Reject or merge/dedupe per existing duplicate-advisory tooling (`Mark Duplicate...` / `Dismiss ~Similar`) — do not invent a new duplicate path |

None of these actions require a new Review route or decision value — `Approve` / `Reject` / `Keep Pending` already cover all of them (per the existing `/api/review/decision` contract).

---

## 6. First Known Outside-Submission Example

> `People who drive fast/expensive cars are less generous to other drivers and pedestrians...`

**Classification: Real useful claim / needs better evidence before public approval.**

**Reasoning:**
- The claim is understandable in plain language — a specific, socially legible observation
- Phrasing suggests the tester likely used the Claim Builder flow (a structured, hedged social observation rather than a raw one-liner)
- It's socially interesting — the kind of claim that would generate genuine engagement (evidence, pressure, votes) if it went public
- **But it should not become a public Truth/Claim yet** without clearer bounding (what counts as "fast/expensive," what population/context) and without at least one piece of attached evidence — publishing an unevidenced claim about a group's generosity, even a mild one, is exactly the kind of "looks fine, isn't ready" case this protocol exists to catch

**Action:** Keep in Review. Do not reject — it's a good example of the product working. Do not approve — it isn't ready. Log it in the intake table (section 9) as the first confirmed real-world submission.

---

## 7. What Mike Should Ask the Tester, If Identified

If the submitter can be identified (e.g. a handle Mike recognizes, or someone who mentions it directly), these are the useful questions — not to justify a decision, but to learn what actually happened during a real, unguided session:

1. Was this your submission?
2. Did you understand what Review meant before you submitted?
3. Did you know where the claim went after you submitted it?
4. Did you expect it to become public immediately?
5. Did you understand the evidence step — did you know you could (or should) add evidence?
6. What part felt confusing or pointless?
7. What did you think HumanX was doing with your claim?

These map directly onto the vocabulary and flow work already done (D-297 Step 5, D-300 demo card, D-302 glossary) — the answers tell Mike whether that work actually closed the gaps it targeted, or whether a real user still got confused somewhere those passes didn't anticipate.

---

## 8. Safety Boundaries

This protocol changes nothing about the underlying safety model — it is a lens for looking at the queue, not a new gate. The following remain exactly as they are:

- **Review is not proof.** Nothing in this intake process treats an approved item as verified or true.
- **Approval is not automatic verification.** Every approval is still a discrete, manual admin decision.
- **Admin Review remains the only public gate.** This protocol does not introduce a fast-track, a tester-priority queue, or any bypass of the existing `/api/review/decision` path.
- **Saved analysis remains private.** Nothing here touches `analysis_results` visibility.
- **Anonymous/beta tester submissions should not be exposed beyond normal app behavior.** Recording a submitter's handle or notes for Mike's own intake table (section 9) is an offline note, not a new public-facing field — it must never be added to `renderPublicProfileHtml` or any public route.
- **Do not publish sensitive/political/medical/legal/financial claims casually.** The "Sensitive/high-risk" category (section 4) exists specifically so these get a deliberate, separate decision rather than being nodded through during routine intake.

---

## 9. One-Page Intake Table (Template)

Reusable table Mike can copy for each batch of outside submissions:

| Date | Claim | Submitter | Source | Evidence? | Category | Action | Product lesson | Follow-up question |
|---|---|---|---|---|---|---|---|---|
| 2026-07-08 | "People who drive fast/expensive cars are less generous to other drivers and pedestrians..." | anonymous/unidentified | Likely Builder | No | Real useful claim / needs better evidence | Keep in Review | Confirms an unguided cold user can complete Submit → Review; open question whether they understood Review's meaning | Did you know where this went after submitting? |

Columns, defined:

- **Date** — submission or observation date
- **Claim** — the claim text (trimmed if long)
- **Submitter** — handle if shown, else "anonymous/unidentified"
- **Source** — Builder / manual / Truth-derived, per section 2
- **Evidence?** — yes/no, and roughly how much
- **Category** — one of the six from section 4
- **Action** — one of the actions from section 5
- **Product lesson** — one sentence: what this submission reveals about how the app is actually used
- **Follow-up question** — the single most useful question from section 7 to ask if the tester is ever identified

---

## 10. Next-Action Rules

- **After every 3 outside submissions, look for repeated confusion** — a pattern across multiple entries in the intake table (e.g. three submissions all missing evidence, or all misunderstanding Review) is a real signal. A single entry is not.
- **Only then create a product pass** — do not open a new D-30x product-pass task off one submission. Wait for the 3-submission pattern check above, or an explicit owner request.
- **Do not add features from one weird submission.** A single odd or confusing submission is a data point, not a spec. Log it in the intake table and move on.
- **Do not approve borderline claims just to make the public feed look active.** Queue-clearing pressure and "make the app look alive" pressure are exactly the failure mode section 3 guards against — a thin, active-looking public feed built on under-evidenced claims is worse for trust than a small, well-evidenced one.
- **Prefer clearer examples over more features.** If a submission reveals confusion, the first response to consider is better copy/examples (in the spirit of D-297/D-300/D-302), not a new mechanism. Only escalate to a feature/backend change if a copy-level fix genuinely cannot address the pattern.

---

## Summary

| Item | State |
|---|---|
| Purpose | First outside submissions are product feedback first, publishable content second |
| Do-not-publish-first rule | Established — arrival ≠ approval; Review queue is intake first |
| Classification categories | 6 defined (Real useful / needs evidence / too vague / test-junk / sensitive-high-risk / duplicate) |
| First known example classified | "People who drive fast/expensive cars..." → Real useful claim / needs better evidence, keep in Review |
| Tester follow-up questions | 7 questions defined, tied to D-297/D-300/D-302 flow work |
| Safety boundaries | All existing locks (Review-not-proof, admin-only gate, private saved analysis, no casual sensitive publishing) explicitly reconfirmed unchanged |
| Intake table | One reusable template table, pre-filled with the first known example |
| Next-action rules | Wait for 3-submission pattern before any new product pass; no features from one submission; no queue-padding approvals |
| Implementation | None — docs/process only, no app/backend/schema/API/CSS changes |
| Deploy needed | No |
