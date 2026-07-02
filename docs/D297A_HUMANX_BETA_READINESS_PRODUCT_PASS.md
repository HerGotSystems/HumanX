# D-297A — HumanX Beta Readiness Product Pass

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3442 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-02
**HEAD at pass:** `caee055` (D-296A)

---

## Context

This pass steps back from micro-polish (nudges, ordering, collapsibility) and asks: can one outside person test HumanX today without Mike explaining it live? The goal is not a full product audit but identifying the single most useful improvement before a first beta tester arrives.

Current state going into this pass:

- RunPack → Saved Analysis → Draft Truth → Submit → Review → My HumanX owner flow: complete
- Post-submit lands on My HumanX; Recent Truths is near the top
- Review badge is explained; Profile Settings is collapsible; profile-setup nudge is live
- Review gate is active; no auto-publish; public profile unaffected

---

## Product-Pass Questions (22)

---

### Q1. If a new person opens HumanX today, what do they understand immediately?

The Home screen shows the pipeline banner (`Beliefs → Truths → Claims → Evidence → RunPack`) and a subtitle: *"Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence."* They understand HumanX is about claims and beliefs. The nav has: Home, Belief Engine, Drift, Claims, Submit, Evidence, Truths, Me, RunPack — visible across the top.

**Verdict:** The elevator pitch reads correctly. The first impression is coherent if slightly dense.

---

### Q2. What do they not understand?

Several things a first visitor cannot resolve without external explanation:

| Question a tester will have | Current state |
|-----------------------------|---------------|
| What is a "Truth" vs a "Claim"? | Pipeline banner lists both but no tooltip or glossary exists |
| What is "Drift"? | Tab label only — no inline definition until you click it |
| What is a "RunPack"? | Named in pipeline and Actions but its purpose (AI export) is buried in card body |
| What does "Pressure" mean? | Used on claim cards; no definition on first view |
| What does "Review" mean before it appears for them? | Hidden tab; explained only after submitting |
| What is "Evidence" vs "Vault"? | Two overlapping-sounding concepts |
| What is "My HumanX"? | Tab label "Me" — purpose unclear from label alone |

The vocabulary is domain-specific and consistent internally but opaque to a first-time user.

---

### Q3. Is the Home screen clear enough?

Mostly yes — the hero subtitle, "Start here" steps, and Action cards are all present and functional. The **pipeline banner** (`Beliefs → Truths → Claims → Evidence → RunPack`) is a good orientation device. The "Start here" steps 1–4 give a concrete path.

**Gap:** The four-step path in "Start here" ends at RunPack, but a beta tester who submits a Claim will hit Review and land on My HumanX — neither of which appears in the four steps. The post-submit journey is undocumented on the Home screen.

---

### Q4. Is the difference between Claim, RunPack, Analysis, Truth, Review, and My HumanX understandable?

Not without prior context. A tester reading the nav tabs and Home copy in one sitting can piece together that:

- **Claim** = a testable public statement (clear from Submit copy)
- **RunPack** = an AI export (clear from Actions card)
- **Analysis** = what RunPack produces (not named in nav — only appears as "Saved Analysis" inside My HumanX)
- **Truth** = something asserted as fact (poorly distinguished from Claim for a newcomer)
- **Review** = moderation queue (not visible in nav until you're admin; tester only encounters it as a badge state)
- **My HumanX** = owner dashboard (tab is labelled "Me" — purpose unclear)

**Verdict:** The terminology is self-consistent but not self-explanatory. A one-paragraph glossary or tooltip layer would resolve most of it.

---

### Q5. Is there a clear first action?

Yes — the "Start here" section gives four explicit numbered steps, each with a button. "Browse Claims →" is step 1. A tester will not be lost about what to click first.

**Gap:** If the tester's goal is to *submit something and see the result*, step 3 ("Submit a claim") is the entry — but the next step (Review → My HumanX) is absent from the Start here strip.

---

### Q6. Can someone test the core flow without instructions from Mike?

**Partially.** The inbound Browse → Submit path is followable. The outbound Submit → Review → My HumanX path is only discoverable if the tester:

1. Notices the post-submit toast mentioning "My HumanX"
2. Clicks the "Me" tab (label not self-explanatory)
3. Understands why their submitted claim shows a yellow "Review" badge
4. Waits for admin approval without knowing how long that takes or who does it

None of these steps are explained anywhere on screen. A tester hitting Review for the first time with no context will likely interpret the yellow badge as a bug or an error state.

**Verdict:** The flow is testable by a technically curious person who reads carefully. It is not self-explanatory for a general beta tester.

---

### Q7. What is the biggest blocker to a first beta tester?

**The post-submit experience is unguided.**

After submitting a claim, a tester:
- Lands on My HumanX with no explanation of what just happened
- Sees a yellow "Review" badge on their Truth with no inline context about what Review means, who reviews, or how long it takes
- Has no prompt to explore further

The Review explanation added in D-291B lives inside the Recent Truths panel as a note (`"Review: awaiting admin approval — goes Public when approved."`), but it only appears after the tester expands the panel or already has truths. A tester who just submitted their first claim and lands on My HumanX sees the panel headline but may not read down to the note immediately.

**Second-largest blocker:** Vocabulary. "Truth" vs "Claim" confusion will cause testers to ask Mike what the difference is before they submit anything.

---

### Q8. Is the blocker wording/copy, layout, navigation, missing onboarding, or missing feature?

**Wording/copy and navigation.** The architecture is sound. The issue is:

1. The "Me" tab label does not convey "your dashboard / your activity"
2. The post-submit state (Review pending) is not explained proactively — only incidentally
3. The Truths page and My HumanX "Recent Truths" panel both exist but their relationship is unclear

No missing feature is required. A copy fix and possibly a one-line context note would close the biggest gap.

---

### Q9. Can the best fix be frontend-only?

**Yes.** All identified gaps are copy/UX — no new data, no API changes, no backend. The changes would live entirely in `public/app-v10.js` (and potentially `public/index.html` for tab label).

---

### Q10. Would any useful fix require backend/API/schema changes?

**No.** Nothing identified in this pass requires new API data, schema, or worker changes.

---

### Q11. What should HumanX say it is in one simple sentence?

Current subtitle: *"Map personal belief. Record what gets repeated as fact. Pressure-test public claims with evidence. HumanX organises what people assert — it does not decide what is true."*

That is three sentences. For a first beta tester, one sentence:

> "HumanX is a place to submit testable claims, attach evidence, and see how they hold up — without anyone deciding what is true."

The current copy is accurate but verbose. A single-sentence version would help external communication more than internal app copy.

---

### Q12. What should the first tester be asked to do?

A minimal beta test script:

1. Open HumanX
2. Read the Home screen for 60 seconds — note anything confusing
3. Browse existing Claims
4. Open one Claim and read its Study mode
5. Submit a new Claim about something you believe to be true
6. After submitting, find your submission in "Me"
7. Note the "Review" badge and what you think it means
8. (Optional) Set up a public profile from Me → Profile Settings

This covers the full owner flow and surfaces the vocabulary and post-submit confusion without Mike needing to guide anything.

---

### Q13. Does the app need a small "How to use HumanX" panel?

**Useful but not the first priority.** A "How it works" collapsible on the Home screen would help — but the "Start here" steps and Action cards already cover the inbound flow. The gap is specifically the *post-submit* step, not the entry-point orientation.

**Recommendation:** A targeted note rather than a full how-to panel.

---

### Q14. Does the app need a guided first-run checklist?

**No.** That is feature complexity above what the immediate blocker requires. A tester's first-run confusion is resolvable with copy, not a checklist widget.

---

### Q15. Does the app need better Home copy?

The Home copy is good for what it covers. The "Start here" strip is the right UX pattern. The pipeline banner orients well. The gap is that post-submit is not on the Home screen at all — a fifth step ("Step 5: Find your submission in Me → review pending") would close that gap with minimal copy.

**Candidate:** Add Step 5 to the "Start here" strip: `"After submitting — your item enters Review. Find it in Me (top right). The Review badge means awaiting admin approval."` This is a small, targeted frontend copy change.

---

### Q16. Does the app need a demo/example claim?

**Not yet.** There are already public claims in the arena. A new tester can browse real content. A synthetic demo claim would add maintenance overhead.

---

### Q17. Does the app need public profile polish next?

**No.** Public profile is functional and unblocking. Profile setup nudge is live. `/u/:slug` works. Not the priority.

---

### Q18. Does the app need Review/admin polish next?

**No.** Review gate is correctly gated. Admin Review queue works. Review explanation is present in My HumanX. Not the priority.

---

### Q19. What is the smallest useful D-297B candidate?

**Add Step 5 to the "Start here" strip on the Home screen.**

Current strip: 4 steps ending at RunPack.

Proposed Step 5:

> **Step 5: Find your result**
> After submitting a claim or Truth, your item enters Review. Open **Me** to see it. The yellow Review badge means awaiting admin approval — it goes public when approved.

This:
- Closes the post-submit gap directly (the #1 blocker)
- Requires no backend/API/schema changes
- Requires no new data
- Is reversible
- Is one additional `<div class="cc-start-step">` block in `renderHome()` inside `public/app-v10.js`
- Costs approximately 5 new regression tests

**Secondary candidate (if Step 5 feels too narrow):** Rename the "Me" tab to "My HumanX" or add a `title` attribute — makes the owner dashboard tab label self-explanatory. This is a one-line change to `public/index.html`. Can be bundled with Step 5 in the same D-297B commit.

---

### Q20. Classify D-297B

**Frontend-only.**

All changes are in `public/app-v10.js` and/or `public/index.html`. No backend, no schema, no API, no Wrangler, no migration.

---

### Q21. Is there a clear single frontend-only improvement?

**Yes: the Step 5 addition to the "Start here" strip.**

The current 4-step strip ends the user journey at RunPack. A new step 5 would give the post-submit path its first on-screen explanation without needing Mike to explain anything. This is the gap that most directly blocks a first beta tester from completing the flow unsupported.

Optionally bundle: rename the "Me" tab to "My HumanX" so the destination is legible before the tester reaches it.

---

### Q22. Is HumanX already beta-testable enough to skip D-297B?

**Not quite.** A technically confident tester who reads carefully can complete the flow. The post-submit (Review pending) landing is the one place where a typical beta tester — not a developer — will be confused without Mike explaining it. That gap is one targeted copy change away from being closed.

**Recommendation:** Implement D-297B (Step 5 + "Me" → "My HumanX" tab label), then write a beta test script, then run a first external test.

---

## Summary

| Question | Answer |
|----------|--------|
| First impression | Clear — pipeline, subtitle, and Start here steps all work |
| Biggest gap | Post-submit is undocumented — tester lands on My HumanX with a yellow Review badge and no context |
| Vocabulary | Internally consistent; Claim vs Truth confusion expected from first-time testers |
| Home copy quality | Good for inbound; missing post-submit step |
| First beta tester blocker | #1: Post-submit unguided; #2: "Me" tab not self-labelled |
| Fix type | Frontend-only copy additions |
| Backend/schema needed | No |
| D-297B candidate | Step 5 in Start here strip + rename "Me" tab to "My HumanX" |
| D-297B classification | Frontend-only |
| Stop and write beta script instead? | Not yet — one targeted copy change first |

---

## Recommended D-297B Spec (preview, not implemented)

**D-297B — HumanX post-submit guidance and tab label**

**Scope:** Frontend-only (`public/app-v10.js`, `public/index.html`)

**Changes:**
1. Add Step 5 to the "Start here" strip in `renderHome()` — explains post-submit Review state and "Me" tab destination
2. Rename `<button id="tab-me" ...>Me</button>` to `My HumanX` in `public/index.html`

**Tests (~5 new):**
- Start here strip contains Step 5
- Step 5 references "Review"
- Step 5 references "Me" or "My HumanX"
- Tab label is "My HumanX"
- Existing Start here steps 1–4 preserved

**Classification:** Frontend-only
**No backend/API/schema/migration/Wrangler changes**
**No deploy needed until owner approves D-297B**
