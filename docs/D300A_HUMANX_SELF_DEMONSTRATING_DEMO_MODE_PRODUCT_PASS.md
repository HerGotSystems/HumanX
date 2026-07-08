# D-300A — HumanX Self-Demonstrating Demo Mode Product Pass

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3462 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at pass:** `d50455f` (D-299A)

---

## Problem Statement

D-299A shipped a first beta tester script. One outside tester likely submitted a real claim (`People who drive fast/expensive cars are less generous to other drivers and pedestrians...`). Most invited testers — friends, family, people online — did not respond or did not test.

This is not a script problem. It is expected behavior: unpaid, informally-invited testers rarely act on a request, no matter how well the request is worded. **HumanX cannot rely on a person walking a cold visitor through the app.** The app itself has to carry that weight in the first 30–60 seconds, before any attention has been earned.

This pass steps back from the tester-script layer (D-299A) and the post-submit-navigation layer (D-297/D-298) and asks a narrower question: **what is the smallest change that lets HumanX explain its own value to a stranger with no guide and no patience?**

---

## Cold Visitor Target

A person who:
- Was sent a link (or found it) and gives it 30–60 seconds
- Does not know Mike, has no context on what HumanX is for
- Will not read three paragraphs before deciding whether to keep looking
- Has not been told what to type, what a "good claim" looks like, or what happens after they submit one

Everything below is evaluated against this person, not against a cooperative friend who already agreed to test.

---

## Product-Pass Questions (23)

---

### Q1. What does a cold visitor understand from Home in the first 10 seconds?

Current Home hero (`renderHome()` in `public/app-v10.js`) shows, top to bottom: an "invite-only preview" badge, the title "HumanX", a three-sentence subtitle, a one-line access note, a status line (handle · live/demo · claim/truth/evidence counts), and a pipeline banner (`Beliefs → Truths → Claims → Evidence → RunPack`).

In 10 seconds a visitor absorbs: this is some kind of claims/evidence/belief-tracking system, currently invite-gated, with a pipeline of five named stages. They do not yet see an example of any of those stages in action — the pipeline banner names categories, it does not demonstrate one flowing into the next.

**Verdict:** the category is legible; the payoff is not shown yet.

---

### Q2. Does Home currently show an example of a good claim?

**No, not on Home.** A "What makes a good claim?" guidance block with one worked example (*"not 'politicians are corrupt' but 'MP expenses rose 40% from 2010–2020'"*) exists — but only inside the Submit builder (`renderBuilderStep1()`), reached after clicking Step 3 or the Submit Claim action card. A visitor who never clicks through to Submit never sees it.

---

### Q3. Does Home currently show what HumanX produces after a claim?

**No.** Home shows aggregate counts (claims/truths/evidence totals) but no worked example of a single claim's output — no evidence attached, no testability/survivability scores, no Review badge. A visitor cannot see the "after" state without submitting something themselves or browsing into an existing real claim's Study view.

---

### Q4. Does Home currently explain why someone should care?

Partially. The subtitle states the app's philosophy (*"organises what people assert — it does not decide what is true"*), which is a credibility statement, not a payoff statement. It does not show a concrete before/after that makes a visitor think "oh, that's useful for X."

---

### Q5. Would a visitor know what to type without help?

**Only after reaching Submit.** The builder's first textarea has a placeholder example (`"e.g. 'The media always lies about vaccines'"`) and the guidance list above it. This is good once reached, but it sits three clicks deep (Home → Start Here Step 3, or Actions → Submit Claim) and is not visible from Home itself.

---

### Q6. Would a visitor know the difference between Claim / Evidence / Truth / Review / My HumanX?

**No — this gap is unchanged since D-297A.** Nav tabs and the pipeline banner name these terms but do not define them inline. A first-time visitor cannot distinguish "Truth" from "Claim" from the pipeline banner alone, and "Review" is invisible until a submission is made. This pass does not find a smaller fix for the vocabulary gap than what D-297A already identified (a tooltip/glossary layer) — it remains a separate, larger candidate, not this pass's recommendation.

---

### Q7. What is the smallest "demo" experience that shows the value without needing backend changes?

A static, hard-coded example on Home showing one claim traveling through the full pipeline: **raw thought → structured claim → evidence/testability/survivability scores → Review badge → (eventually) Truth**. This can be built entirely from string literals in `renderHome()` — no fetch, no claim ID, no API call, no dependency on any real data existing in the graph.

---

### Q8. Could Home include one built-in example claim?

Yes, and this is the safest version of a "demo": a fixed, hand-written example (not read from `claims[]`, not fetched from `/api/claims`), rendered as its own labeled card. It never touches real data and cannot go stale in a way that breaks anything — worst case it looks slightly dated copy-wise.

---

### Q9. Could Home include a "Try this example" button that pre-fills the Claim Builder or Submit field?

Yes, technically — it would set `_bs.raw` (and optionally `_bs.why`) to fixed example text and call `setMode('submit')`. This is frontend-only and does not auto-submit anything (the user still has to click through the builder and press Submit). It is a reasonable **secondary** enhancement, but it adds more surface area (state mutation, an extra action handler, more tests) than a static demo card, and it does not by itself show the "after" state (scores, Review badge) — it only helps with the "what do I type" gap (Q5), which is already partially covered by the existing builder placeholder.

---

### Q10. Could Home include a tiny before/after example (raw claim → structured claim → evidence/testability/survivability scores → Review badge)?

Yes — this is the strongest single candidate. It directly answers Q1–Q4 in one glance: it shows the pipeline actually working on one concrete example, including the score meters and the Review badge, entirely as static markup with a clear "Example" label. No claim ID, no evidence rows, no API calls — just illustrative text and pre-set score bars matching the existing score-meter CSS classes already used elsewhere in the app.

---

### Q11. Should the demo use static frontend-only content?

**Yes, unconditionally.** Any version of this demo that reads from real data (a real claim, real evidence, a real score) risks: (a) breaking if that claim is edited/removed/rejected later, (b) looking like the app is holding up one real user's claim as an official "featured" example, and (c) requiring backend awareness of which record is "the demo." A static, clearly-fictional example avoids all three.

---

### Q12. Should demo content be clearly labelled as example/demo so users do not confuse it with verified truth?

**Yes — this is a hard requirement, not an option.** The label must appear directly on the card (e.g. `"Example — not a real claim"` / `"Illustration only"`), and the example claim text should be self-evidently a placeholder (e.g. about a deliberately mundane or obviously-illustrative topic) so it cannot be mistaken for something HumanX has actually verified.

---

### Q13. Would a demo claim pollute the real Review queue?

**Not if built correctly.** A static demo card renders text and score meters directly in `renderHome()` — it never calls `POST /api/claims`, `/api/truths`, or any write endpoint. It cannot appear in Review unless a future implementation mistakenly wires a submit action to it. This pass's recommendation explicitly excludes any submit/write action from the demo card itself.

---

### Q14. Can the best D-300B be frontend-only?

**Yes.** The recommended candidate (static before/after demo card on Home) touches only `public/app-v10.js` (`renderHome()`) and possibly `public/styles.css` for card layout — no `src/worker.js`, no schema, no API, no migration.

---

### Q15. Would any useful demo require backend/API/schema changes?

No version considered in this pass requires backend changes. A *data-backed* "real example claim, pinned and fetched from the API" variant was considered and rejected (see Q11) — that variant would need either a new API flag (`is_demo`/`is_featured`) or a hardcoded claim ID convention, both of which are schema/API-adjacent decisions out of scope for a docs-only, frontend-only pass.

---

### Q16. What should the first cold visitor be asked to do?

Nothing, by default. The demo card should be **look, don't touch** — its job is to show value passively. If the visitor wants to act, the existing "Start here" Step 1 (Browse Claims) and Step 3 (Submit a claim) already give explicit next actions. The demo card supplements those steps; it does not replace them.

---

### Q17. What should the app say if the visitor does not want to create anything yet?

The demo card itself should not ask for anything — no "sign up," no "try now" CTA baked into it. If a call-to-action is wanted, the existing "Browse Claims →" button already covers "let me look at real examples with zero commitment."

---

### Q18. Should we add a "Watch HumanX think" / "See example" section?

Framed narrowly: yes, but as a small labeled section directly under the pipeline banner, not as a separate mode/tab/page. It should read more like "Here's what that looks like" than a marketing feature name — keep it low-key and factual, consistent with the rest of Home's tone.

---

### Q19. Should the example be visible on Home or hidden behind a button?

**Visible by default, not hidden.** Hiding it behind a click reintroduces the exact problem this pass is trying to solve — a cold visitor who will not click around. A visitor who gives HumanX 10 seconds needs to see the payoff in those 10 seconds, not discover a button that might reveal it. If the card is visually heavy, a `<details>` used elsewhere in the app (e.g. `arena-stats-details`) could default it to open, but default-open is what matters here, not default-closed.

---

### Q20. What is the smallest useful D-300B candidate?

**A static before/after example card on Home, placed directly below the pipeline banner, inside (or immediately after) the existing `cc-hero` section.**

Content sketch (illustrative — final copy to be decided at implementation time):

> **See it work — Example (not a real claim)**
> **Raw thought:** "This road is always backed up at rush hour."
> **Structured claim:** "Traffic on [Route X] exceeds free-flow speed by 50%+ on weekdays 5–6pm."
> **After evidence is attached:** Testability ●●●○○ · Survivability ●●○○○ · 3 evidence items
> **Status:** 🟡 Review — awaiting admin approval, not yet public

This is one new block of static markup in `renderHome()`. No new data source, no new action handler required for the minimal version (Q9's prefill button is optional and separable).

---

### Q21. Classify D-300B

**Frontend-only.**

`public/app-v10.js` (`renderHome()`) and optionally `public/styles.css` for card styling. No `src/worker.js`, `src/analysis-results.js`, `src/truths.js`, migrations, or API changes.

---

### Q22. Prefer one visible frontend-only improvement if there is a clear candidate

**Yes — the static before/after demo card described in Q20 is the recommendation for D-300B.** It is the only candidate in this pass that simultaneously: shows the full pipeline in action (Q1–Q4), requires no backend work (Q14–Q15), cannot pollute Review (Q13), and stays visible without requiring a click (Q19).

---

### Q23. If no implementation is needed, recommend a non-code launch/testing move instead

Not applicable as a substitute — D-300B has a clear, low-risk frontend-only candidate (Q22), so a code change is recommended over a pure process change.

As a **complementary**, zero-code move that can happen immediately regardless of when D-300B ships: when inviting the next round of testers, send a direct link to one specific existing real claim's Study view (not the bare Home URL). A person who lands inside a real, already-populated example skips the cold-Home problem entirely for that one session. This does not fix Home for organic/unguided visitors, but it costs nothing and can be done today.

---

## Recommendation

**Build D-300B: a static, clearly-labeled before/after example card on Home**, placed directly under the pipeline banner, showing one illustrative claim moving from raw thought → structured claim → evidence/score state → Review badge. No real data, no write calls, no new API surface. Label it unambiguously as an example so it cannot be mistaken for a verified Truth or a real pending submission.

Treat the "Try this example" prefill button (Q9) and the vocabulary/glossary gap (Q6) as separate, later candidates — both are real gaps, but neither is as small or as directly load-bearing as the before/after card for the specific problem in this pass (a cold visitor not seeing the payoff fast enough).

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Demo content is mistaken for a real, verified Truth | Explicit "Example — not a real claim" label directly on the card; deliberately mundane/obviously-illustrative example topic |
| Demo content is mistaken for a real pending submission | Card renders only static markup — no claim ID, no `Submit`/write action wired to it, no Review queue entry created |
| Future implementer wires the card to real data or a submit action | This pass explicitly recommends against that (Q11, Q13); flag it in the D-300B implementation spec as a hard constraint |
| Card adds visual clutter to an already dense Home hero | Keep it to one compact block, placed logically (after the pipeline banner, before "Start here"), reusing existing score-meter/badge CSS classes rather than inventing new visual language |
| Card content goes stale/dated over time | Keep the example topic-neutral and evergreen (avoid dates, current events, or anything time-sensitive) |

---

## Classification

**Frontend-only.** No backend/API/schema/migration/Wrangler/deploy changes required for the recommended D-300B candidate.

---

## Summary

| Question | Answer |
|---|---|
| Cold-visitor 10-second understanding | Category is clear (claims/evidence/beliefs pipeline); payoff is not demonstrated |
| Example claim shown on Home today | No — only inside Submit builder, 2–3 clicks deep |
| Before/after output shown on Home today | No — only aggregate counts, no worked example |
| Vocabulary gap (Claim/Truth/Review/etc.) | Still present, same as D-297A finding; separate candidate, not this pass's recommendation |
| Smallest self-demonstrating fix | Static before/after example card under the pipeline banner |
| Requires backend/API/schema | No |
| Risk of demo looking like verified truth | Present if unlabeled; mitigated by explicit "Example" label and static-only rendering |
| D-300B classification | Frontend-only |
| Non-code complementary move | Send next testers a direct link to a real claim's Study view, not the bare Home URL |

---

## Recommended D-300B Spec (preview, not implemented)

**D-300B — HumanX Home self-demonstrating example card**

**Scope:** Frontend-only (`public/app-v10.js`, optionally `public/styles.css`)

**Changes:**
1. Add one static example card to `renderHome()`, placed directly below the pipeline banner
2. Content: raw thought → structured claim → evidence/testability/survivability illustration → Review badge, using fixed, clearly-fictional example text
3. Explicit "Example — not a real claim" label on the card
4. No fetch, no claim ID, no write/submit action wired to the card

**Hard constraints carried into implementation:**
- Must not read from or write to any real claim/truth/evidence record
- Must not create any Review queue entry
- Must not be reachable as a public-profile-visible element
- Must not use `review_state` other than as illustrative, clearly-fake text
- Must not remove or reorder the existing "Start here" steps or Actions grid

**Classification:** Frontend-only
**No backend/API/schema/migration/Wrangler changes**
**No deploy needed until owner approves D-300B**
