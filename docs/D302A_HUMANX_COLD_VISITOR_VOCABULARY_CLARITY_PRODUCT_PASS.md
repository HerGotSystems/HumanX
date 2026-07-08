# D-302A — HumanX Cold-Visitor Vocabulary Clarity Product Pass

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3487 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at pass:** `204b983` (D-301A)

---

## Problem Statement

D-300 made HumanX self-demonstrating: Home now shows a static before/after example (raw thought → structured claim → evidence illustration → Review badge) instead of only naming pipeline categories. That closed the "what does HumanX produce" gap identified in D-300A.

But D-297A's original vocabulary finding — that **Claim, Truth, Review, Evidence, and My HumanX** are used throughout Home without being defined in one place — was deferred, not fixed. This pass asks whether that gap still exists after D-300, and if so, whether the smallest fix is worth doing now or should wait for evidence of real user confusion.

---

## Current State (After D-297 / D-300)

Reading `renderHome()` top to bottom, a cold visitor now encounters these terms in this order:

1. **Hero** — subtitle uses "Claims" and "Truths" as pipeline nouns; pipeline banner labels `Beliefs → Truths → Claims → Evidence → RunPack` with 2–3 word taglines each (`Truths: repeated certainties`, `Claims: public statements`, `Evidence: support & challenge`)
2. **Start Here Step 3** — "Submit a claim... Enters Review before going live" (first use of the word "Review," undefined at this point)
3. **Start Here Step 5** — "Track Review... submitted Truths wait for admin approval and appear in My HumanX with a Review badge" (first real definition of Review, but it arrives two steps after Review was first mentioned)
4. **See it work (demo card)** — shows the Claim path (raw thought → structured claim → evidence/testability/survivability → Review state, labeled "example only, not verified") — demonstrates Review and evidence in context, but only for the Claim path, not Truth
5. **Actions grid** — the **Truth** card is the only place that explicitly distinguishes Truth from Claim: *"A Truth in HumanX records repeated assertion, not proven fact. HumanX does not decide if a Truth is correct. Convert any truth into a pressure-testable claim."* The **Submit Claim** card, elsewhere in the same grid, says *"Enters moderation before going live"* — using "moderation" where every other card and step uses "Review."

No card, step, or line on Home ever states what **My HumanX** is. It appears only as a button label (Step 5) and a nav tab.

---

## Product-Pass Questions (22)

---

### Q1. Does Home currently explain the difference between Claim and Truth?

**Partially, and only if a visitor reaches the Actions grid.** The Truth card explicitly says a Truth is "not proven fact" and can be "convert[ed]... into a pressure-testable claim" — this is the one place Claim and Truth are connected. But it's the 6th of 7 Actions cards, well past the hero/Start Here/demo card a skimming visitor sees first. Nothing earlier on Home states the Claim/Truth distinction.

---

### Q2. Does Home currently explain what Review means?

**Mostly yes, but the term is used before it's explained.** Step 3 says "Enters Review before going live" with no definition. Step 5, two steps later, is the first real explanation ("wait for admin approval... Review badge"). The demo card reinforces it ("Review — example only, not verified"). By the end of Start Here, Review is reasonably well covered — but a visitor who stops reading after Step 3 has only seen the word, not its meaning.

---

### Q3. Does Home currently explain that Review is admin approval, not automatic verification?

**Yes, where it's explained at all.** Step 5's "wait for admin approval" and the demo card's "not verified" both avoid implying automation. This part is already accurate and safe — the gap is *reach* (does a skimming visitor get to Step 5 or the demo card's fine print), not *accuracy*.

---

### Q4. Does Home currently explain Evidence in ordinary language?

**Only in a 3-word pipeline tagline** ("Evidence: support & challenge") and, further down, the Evidence Vault Actions card ("Reusable sources, documents, datasets, and test records"). Neither is a plain one-line definition a visitor would read as "evidence = reasons that back up or push against a claim." It's inferable from context, not stated.

---

### Q5. Does Home currently explain My HumanX as the owner dashboard?

**No.** This is the clearest gap. "My HumanX" appears only as: the nav tab label, and the Step 5 button text ("Open My HumanX to see status"). Nothing on Home says what My HumanX actually contains (submissions, saved analysis, profile, Review status). A visitor has to click into it to find out.

---

### Q6. Does the static demo card reduce vocabulary confusion enough by itself?

**Partially.** It's excellent at showing the Claim pipeline in action (raw thought → structured claim → evidence/scores → Review state) — this does more for comprehension than any glossary sentence could, for the Claim path specifically. But it doesn't touch Truth, Evidence Vault, or My HumanX at all, so it only covers part of the vocabulary surface.

---

### Q7. Does the Home Step 5 reduce Review confusion enough by itself?

**Mostly yes for the post-submit question** ("what happens after I submit"), which was D-297A's original target. It does not fix the ordering issue (Review is named at Step 3 before being defined at Step 5), and it doesn't touch Claim/Truth/Evidence/My HumanX definitions at all — Step 5 was scoped narrowly to the post-submit journey, not general vocabulary.

---

### Q8. What words are still likely confusing to a cold visitor?

| Term | Why it's still a risk |
|---|---|
| **My HumanX** | Never defined on Home — only a button/tab label |
| **Truth vs. Claim** | Only connected in one card, 6th of 7 in the Actions grid |
| **Evidence** | Only a 3-word pipeline tagline; no plain-language line |
| **Review** | Used at Step 3 before being defined at Step 5; also called "moderation" on the Submit Claim card — an inconsistent second term for the same thing |
| **RunPack** | Not in scope for this pass (D-268→D-280 already addressed RunPack clarity extensively) |

---

### Q9. Could a small "HumanX words" strip help?

**Yes.** It would consolidate scattered, order-dependent context (Truth card, Step 5, demo card, pipeline taglines) into one place a confused visitor can check at the moment they hit an unfamiliar term, instead of needing to read the whole page in order and connect the dots themselves.

---

### Q10. Where should vocabulary help appear if implemented?

On Home, positioned after the terms have already started appearing (hero, Start Here, demo card) but before the visitor reaches the denser Actions grid — i.e., the same general zone as the D-300B demo card, one section below it.

---

### Q11. Should it appear on Home only?

**Yes for this pass.** The Actions grid, Study view, and My HumanX itself have their own contextual copy already (Truth card, Belief Engine card, etc.). Home is the only place a cold visitor arrives with zero context, so it's the only place a standalone glossary is justified right now.

---

### Q12. Should it appear near the demo card?

**Yes.** The demo card demonstrates the Claim/Review/Evidence relationship in action; a glossary directly below it would let a visitor who is still confused after seeing the demo look up the exact words, without repeating content — the demo shows, the glossary defines.

---

### Q13. Should it appear near Start here?

Not as a replacement for Start Here — Start Here is an action list, not a reference. But logically it belongs in the same reading zone (hero → Start Here → demo card → glossary → Actions), so that all three "explain HumanX" surfaces (Start Here's Step 5, the demo card, and the glossary) are adjacent rather than scattered.

---

### Q14. Should it be a static card, `<details>` disclosure, or inline labels?

**A collapsed `<details>/<summary>` disclosure**, not a static always-visible card and not inline tooltips. Reasoning:

- **Not a static card:** unlike the D-300B demo card (which needed to be visible by default because it *is* the value proof), a glossary is reference material — useful only to a visitor who is already confused about a specific word. Forcing it open by default adds a wall of definitions ahead of the Actions grid on every single Home load, which risks exactly the "too text-heavy" outcome Q18 asks about.
- **Not inline tooltips:** HumanX's frontend has no existing tooltip/hover-popover pattern for body copy (the closest precedent, `title="..."` attributes on filter selects and belief-promotion buttons, is a native browser tooltip, not a rich inline popover) — building one would be new UI infrastructure for a docs-only-scoped problem.
- **`<details>/<summary>` is the correct existing pattern**: this app already uses exactly this pattern for optional reference content the average visitor doesn't need by default — `arena-stats-details` ("Show public network stats ▸" in the Claims view) and the D-293B Profile Settings collapse in My HumanX. A "HumanX words ▸" disclosure, collapsed by default, is the same idiom applied to Home.

---

### Q15. What exact plain-English definitions would help?

The task's suggested definitions were evaluated, not accepted as-is. Four hold up; **one does not match HumanX's actual model and would introduce new confusion if shipped as worded:**

| Term | Suggested wording | Verdict |
|---|---|---|
| Claim | "Something someone says might be true." | **Close, but incomplete** — doesn't convey testability, which is central to how Submit Claim is framed elsewhere ("pressure-testable public statement"). Recommend adding "— testable, and open to evidence." |
| Evidence | "Reasons or sources that support or challenge a claim." | **Accurate** — matches the existing pipeline tagline ("support & challenge") almost verbatim. Use as-is. |
| Truth | "A claim approved for public display after Review." | **Inaccurate — do not use as worded.** This describes a Claim that passed Review, not a Truth. HumanX's existing Truth card already says the opposite of what this wording implies: a Truth is "repeated assertion, not proven fact," and it is Truths that get *converted into* Claims — not Claims that become Truths after approval. Shipping the suggested wording would contradict copy already live in the Actions grid and teach visitors the wrong direction of the relationship. |
| Review | "Waiting for admin approval; not automatic proof." | **Accurate** — matches Step 5's existing wording. Use as-is (or trimmed to match Step 5's exact phrasing for consistency). |
| My HumanX | "Your private dashboard for drafts, submissions, profile, and Review status." | **Mostly accurate, one word overclaims** — "drafts" implies a persisted draft-saving feature. No such stored-draft object exists; the closest thing (`draftTruthFromAnalysis`, D-287B) is a one-time prefill action, not a saved draft. Recommend "your submissions, saved analysis, profile, and Review status" instead of "drafts." |

**Recommended corrected set:**

- **Claim** — "Something someone says might be true — testable, and open to evidence."
- **Evidence** — "Reasons or sources that support or challenge a claim."
- **Truth** — "A belief people repeat as fact — recorded here, not proven here. It can be turned into a testable claim."
- **Review** — "A person checks it before it goes public — not automatic proof."
- **My HumanX** — "Your private dashboard — your submissions, saved analysis, profile, and Review status."

---

### Q16. Could the best fix be frontend-only?

**Yes.** All five definitions are fixed text. No claim data, no API call, no new state — the same static-markup pattern as the D-300B demo card, just five short lines inside a `<details>` block.

---

### Q17. Would any useful vocabulary fix require backend/API/schema changes?

**No.** Nothing in this pass needs any data HumanX doesn't already have hardcoded in its own copy.

---

### Q18. Could the vocabulary strip create clutter or make Home feel too text-heavy?

**Yes, if implemented as an always-open block — this is the main risk of this pass.** Home already stacks: hero (4 paragraphs) → Start Here (5 steps) → demo card (6 lines) → Actions (7 cards, 2–3 sentences each). Adding five more always-visible definitions risks making Home feel like a page of rules rather than a place to act, which cuts directly against D-300A's "show value in 30–60 seconds" goal.

**Mitigation:** collapsed-by-default `<details>`, closed on every page load, adding zero default visual weight — a visitor only sees it if they click "HumanX words ▸." This is the same reasoning that made a collapsed disclosure correct for `arena-stats-details` and D-293B Profile Settings.

---

### Q19. What is the smallest useful D-302B candidate?

**Add one collapsed `<details>/<summary>` "HumanX words" glossary block to `renderHome()`,** placed directly below the "See it work" demo card and above the "Actions" section, containing the five corrected one-line definitions from Q15. Collapsed by default. No CSS needed (reuses the native `<details>` pattern already styled implicitly by `arena-stats-details`/D-293B usage — plain browser disclosure triangle, no custom class required).

---

### Q20. Classify D-302B

**Frontend-only.** `public/app-v10.js` (`renderHome()`) only. No backend, no schema, no API, no migration.

---

### Q21. Is there a clear single frontend-only improvement?

**Yes — the collapsed "HumanX words" glossary described in Q19.** It is small (five lines), reuses an existing UI idiom, requires no CSS, and directly closes the specific gaps found in Q1–Q8 (My HumanX never defined; Truth/Claim relationship scattered; Evidence under-defined; Review used before explained; "moderation"/"Review" term inconsistency noted as a secondary, out-of-scope-for-D-302B finding).

---

### Q22. Is the demo card and Step 5 already enough — should we stop here?

**No — this pass finds real, specific, still-open gaps, so a stop recommendation would be premature.** D-300's demo card and D-297's Step 5 both worked exactly as scoped (showing the pipeline in action; explaining the post-submit journey), but neither was scoped to solve general vocabulary, and they don't. My HumanX is still never defined on Home. Truth vs. Claim is still only connected in one deep card. Evidence is still only a 3-word tagline. These are the same gaps D-297A originally flagged and D-300A explicitly deferred to "vocabulary clarity only if real users remain confused" (PROJECT_STATE.md safe-next lane).

That said, this recommendation is **small and low-risk enough to implement now** rather than waiting for a confirmed live-user complaint: it's five lines of static text behind a closed disclosure, reuses an existing pattern, costs no CSS, and cannot make anything worse if the corrected wording (Q15) is used exactly as specified — particularly avoiding the inaccurate suggested Truth definition, which would have been a real regression in accuracy had it shipped unexamined.

---

## Vocabulary Risk Table

| Term | What a visitor may think | What HumanX actually means | Risk | Recommended wording |
|---|---|---|---|---|
| **Claim** | A fact or a strong opinion | A testable public statement, not yet proven either way | LOW | "Something someone says might be true — testable, and open to evidence." |
| **Truth** | A claim that HumanX has confirmed is true | A belief people repeat as fact, recorded (not proven), convertible into a testable Claim | **MEDIUM** — the suggested task wording for this term would have made the risk HIGH by implying Truth = approved Claim, the reverse of the real relationship | "A belief people repeat as fact — recorded here, not proven here. It can be turned into a testable claim." |
| **Review** | Either "nothing happens" (if never seen) or "official verification" (if read carelessely) | A human admin checks it before it can appear publicly; not automatic proof | MEDIUM — accurate where explained, but named before defined (Step 3 before Step 5) | "A person checks it before it goes public — not automatic proof." |
| **Evidence** | Formal, vetted proof | Any reason or source, supporting or challenging, attached to a claim | LOW | "Reasons or sources that support or challenge a claim." |
| **My HumanX** | A generic account/settings page | The owner's private dashboard: submissions, saved analysis, profile, Review status | MEDIUM — never defined on Home at all | "Your private dashboard — your submissions, saved analysis, profile, and Review status." |

---

## Candidate Options Considered

| Option | Verdict |
|---|---|
| No change | Rejected — real gaps found (My HumanX undefined; Truth/Claim scattered; Evidence under-defined) |
| Home "HumanX words" card, always visible | Rejected — adds default text weight to an already-dense Home; conflicts with Q18's clutter risk |
| **Collapsed glossary using `<details>`** | **Recommended** — reuses existing app idiom (`arena-stats-details`, D-293B), zero default visual weight, frontend-only, no CSS |
| Inline tooltips/labels | Rejected — no existing rich-tooltip infrastructure in this app; would require new UI work beyond this pass's scope |
| Separate Help page | Rejected — adds a new nav destination/route for content that's better placed exactly where the words are first used |

---

## Recommendation

**Implement D-302B: a single collapsed `<details>/<summary>` "HumanX words ▸" glossary block in `renderHome()`,** placed directly below the "See it work" demo card and above "Actions," containing the five corrected definitions from Q15 (note: the suggested Truth wording must **not** be used verbatim — it inverts the real Claim/Truth relationship; use the corrected wording instead). Collapsed by default. No CSS required.

Treat the "moderation" vs. "Review" terminology inconsistency (Submit Claim Actions card) as a separate, smaller candidate — not bundled into D-302B, since it's a one-word copy fix unrelated to the glossary itself.

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Home becomes too text-heavy / wordy | Collapsed-by-default `<details>` — zero default visual weight; only a visitor who clicks sees the definitions |
| Review sounds like proof/verification | Use the corrected Review wording ("not automatic proof") exactly as specified; do not soften or remove the "not automatic proof" clause in any future edit |
| Truth defined as "approved Claim" (inverts real relationship) | Do not use the task's suggested Truth wording verbatim; use the corrected wording that matches the existing Truth Actions-card copy |
| Glossary drifts out of sync with actual card copy over time | Keep the five definitions short and generic enough that they don't need to track every future Actions-card wording change; revisit only if a term's underlying meaning changes |
| Demo card's "example only" boundary gets blurred by nearby glossary text | Keep the glossary in its own separate `<details>` block, not merged into the demo card's `panel` — preserves the D-300B static/example-only boundary as a distinct, separately-tested unit |

---

## Classification

**D-302B: Frontend-only.** `public/app-v10.js` (`renderHome()`) only. No backend/API/schema/migration/CSS changes anticipated.

---

## Summary

| Question | Answer |
|---|---|
| Home explains Claim vs. Truth | Only in one deep Actions card; not near the top |
| Home explains Review | Mostly, but named (Step 3) before defined (Step 5) |
| Home explains Evidence | Only a 3-word pipeline tagline |
| Home explains My HumanX | No — never defined on Home |
| Demo card alone sufficient | No — only covers the Claim path |
| Step 5 alone sufficient | No — scoped to post-submit only, not general vocabulary |
| Suggested Truth definition safe to use as-is | **No — inverts the real Claim/Truth relationship; corrected wording provided** |
| Smallest useful fix | Collapsed `<details>` "HumanX words" glossary, 5 lines, below demo card |
| Requires backend/API/schema | No |
| D-302B classification | Frontend-only |
| Stop and wait for confirmed user confusion instead? | No — gaps are small, low-risk, and cheap enough to fix now |

---

## Recommended D-302B Spec (preview, not implemented)

**D-302B — HumanX Home vocabulary glossary**

**Scope:** Frontend-only (`public/app-v10.js`)

**Changes:**
1. Add one collapsed `<details class="...">` block titled "HumanX words" to `renderHome()`, placed directly after the "See it work" demo card section and before "Actions"
2. Content: five one-line definitions (Claim, Truth, Review, Evidence, My HumanX) using the corrected wording from this doc's Q15/Risk Table — **not** the task's suggested Truth wording verbatim
3. Collapsed by default (no `open` attribute)
4. No CSS changes — reuse plain `<details>/<summary>` styling already implicit elsewhere in the app

**Hard constraints carried into implementation:**
- Must not describe Review as automatic, proof, or verification
- Must not describe Truth as an "approved Claim" or reverse the Truth→Claim conversion direction
- Must not claim a persisted "draft" feature that doesn't exist
- Must remain collapsed by default
- Must not modify the D-300B demo card, Start Here Step 5, or any existing Actions card copy

**Classification:** Frontend-only
**No backend/API/schema/migration changes**
**No deploy needed until owner approves D-302B**
