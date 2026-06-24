# D-158A — Public Profile Content Hierarchy Audit

**Date:** 2026-06-24
**Scope:** Docs only. Audit and recommendations for D-158B. No code change in this patch.

---

## Current Behaviour (post D-154–157)

Rendered order (top to bottom):

1. **Section heading** — "Public Profile" `<h2>`
2. **Header card** — display name, `/u/slug`, bio (if set)
3. **Context block** — three-paragraph intro: what HumanX is, vocab guide, disclaimer
4. **Shared Belief Snapshot** (only if owner published one) — dominant pattern, stability/openness/pressure meters, top alignment, contradiction count, snapshot date
5. **Counts card** — "Public Activity" badge row: Claims N · Truths N · Evidence N · Pressure N
6. **Claims being tested** — recent public claims, each with category + "View in HumanX →" button
7. **Public truths** — recent public truths, category label, no drill-down
8. **Supporting evidence** — first 5 visible, show-more for remainder, quality label per row
9. **Questions under pressure** — first 5 visible, show-more, severity label per row
10. **Footer** — "← Back to Home" + "Copy profile link" (non-owner only)

---

## 5-Second Visitor Read

What a first-time visitor sees before scrolling on a mid-sized phone (approx. 667px height):
- The "Public Profile" heading
- The header card: display name, slug, bio (if bio is present — often it is not)
- The top half of the context block

**Problem:** The context block appears before the visitor has been given a reason to care. It explains the vocabulary of HumanX before the visitor has seen anything interesting about the person. Three paragraphs of meta-explanation is a lot of scroll to clear before reaching signal.

**What the visitor should understand in 5 seconds:**
1. Who this person is (name / handle)
2. One memorable thing about how they think (their belief pattern or a headline truth)
3. That they can explore further or share the link

Currently: they understand (1) only, and then must read instructions before reaching (2).

---

## Strongest Hook Assessment

| Element | Hook strength | Reasoning |
|---|---|---|
| **Shared Belief Snapshot** | ★★★★★ | Concise, personal, distinctive. Pattern name + three meters + contradiction count is genuinely interesting and shareable. This is the only element with personality. |
| **Claims being tested** | ★★★☆☆ | Interesting if the claims are substantive. The "View in HumanX →" CTA creates a path in. But claims require context to be meaningful to a stranger. |
| **Public truths** | ★★☆☆☆ | Truths are generic by definition ("widely-held statements — collected, not endorsed"). They signal intellectual rigour but are not personally distinctive. |
| **Evidence trail** | ★★☆☆☆ | Quality labels add credibility signal but a list of evidence titles is opaque without the claim context. |
| **Pressure questions** | ★★☆☆☆ | High severity labels are arresting ("critical pressure") but require domain knowledge to appreciate. |
| **Profile header (name/bio)** | ★★★☆☆ | Identity anchor, but only as strong as the bio — often absent. |
| **Context block** | ★☆☆☆☆ | Necessary for comprehension, but not a hook. It currently sits where the hook should be. |
| **Counts card** | ★★☆☆☆ | Social proof only. Meaningless if counts are low. Works better as supporting detail than as a primary card. |

**Conclusion:** The Shared Belief Snapshot is the strongest hook by a large margin. On profiles without a snapshot it does not appear, leaving the context block as the first content block after the header.

---

## Current Order Verdict

**Header → Context → Snapshot → Counts → Claims → Truths → Evidence → Pressure**

Problems:
1. Context block interrupts the header-to-snapshot flow. The visitor should reach the snapshot before being asked to read instructions.
2. Counts appear before any content. A count of "5 claims, 3 truths" means nothing to a stranger who has not read a single claim or truth yet.
3. Public truths and claims sit at equal prominence. Truths are not personally distinctive (they are "widely-held statements"). Claims are personally distinctive. Claims should outrank truths.
4. Evidence and pressure are both secondary; their current buried position is reasonable.

**Recommended order:**

1. Header
2. Snapshot (if present) — promote above context block
3. Context block — now serves as "what is all this?" after the visitor is already curious
4. Claims being tested — personally distinctive, has CTA
5. Public truths — interesting secondary content
6. Counts — summary, not opener; works better as a footer-adjacent card
7. Supporting evidence — secondary drill-down, keep collapsed
8. Questions under pressure — secondary drill-down, keep collapsed
9. Footer actions

Rationale: The visitor sees the snapshot before they need to understand the vocabulary. The context block then explains the sections they are about to scroll. Counts move to the end where they function as social proof for a visitor who has now seen the content and may want to know the total depth.

---

## Should Public Truths Be Promoted Above Claims?

**No.** Public truths are collected, not endorsed. They signal that the person is tracking discourse but do not reveal their personal position. Claims are personal assertions the person is actively testing. Claims are more distinctive and more interesting to a stranger. Claims keep their current advantage over truths.

---

## Should a "Latest Truth" or "Strongest Truth" Become a Hero Card?

**Not recommended.** Truths are explicitly "widely-held statements — collected, not endorsed." A hero truth card risks implying the person endorses the statement, which the disclaimer currently guards against. If a future feature allows personal endorsement or rating of truths, a hero truth card could be reconsidered then. For now, no.

---

## Should the Profile Show a One-Line Intro If Bio Is Missing?

**Yes, but cautiously.** When `bio` is null or empty, the header shows only name and slug — two lines that do not communicate anything about the person's intellectual agenda. Options:

A. **Auto-generate from pattern**: If the snapshot is present, derive a fallback line: "Thinking about [topAlignmentName] · [dominantPattern]". Risk: may look synthetic or cold.
B. **Show nothing** (current). Visitors see only the name/slug header and must scroll to find substance.
C. **Prompt the owner privately** — out of scope for public profile frontend.

**Recommendation for D-158B:** If `bio` is absent AND a snapshot exists, render a single generated fallback line from `dominantPattern` + `topAlignmentName` beneath the slug. If neither bio nor snapshot exists, render nothing (not a generic placeholder). Keep fallback copy low-key: "Belief pattern: [pattern] · Top alignment: [name]" — factual, not editorial.

---

## Should Empty Sections Collapse More Aggressively?

**Yes, partially.** Currently every section renders — even with the "No public X yet." empty-state copy. For truths, evidence, and pressure, an empty section is clutter. Recommendation:

- If `recentTruths` is empty → omit the "Public truths" section entirely (not even the header)
- If `recentEvidence` is empty → omit "Supporting evidence" section
- If `recentPressure` is empty → omit "Questions under pressure" section
- If `recentClaims` is empty → keep the section but keep the "No public claims yet." text (claims are the core unit of HumanX; the absence is informative)

---

## Should Evidence and Pressure Remain Visible, or Become Secondary Drill-Down?

**Remain visible, but below the fold.** Their current position (after claims and truths) is appropriate. The show-more/less toggle from D-155A already makes them reasonably compact. No need to hide them behind a separate modal or tab — that would add interaction cost with minimal gain. Keeping them in the main flow means a motivated visitor can scroll to see the depth of the person's research trail.

---

## Recommended D-158B Implementation Plan

**Goal:** Improve first-impression by reordering cards and adding one optional fallback line.

**Changes:**

1. **Reorder in `renderPublicProfileHtml`:**
   - Move `renderPublicProfileSnapshotHtml(p.sharedSnapshot)` before `contextBlock`
   - Move counts card after the last content section (before footer actions)

2. **Collapse empty secondary sections:**
   - `renderPublicProfileTruthsHtml`: if `!rows||!rows.length` return `''` (not an empty-state paragraph)
   - Same for `renderPublicProfileEvidenceHtml` and `renderPublicProfilePressureHtml`
   - In `renderPublicProfileHtml`: only render the section `<div>` when the inner html is non-empty
   - Claims section: keep empty-state as-is

3. **Optional bio fallback:**
   - In `renderPublicProfileHtml`, if `!p.bio` and snapshot has `dominantPattern` or `topAlignmentName`, render a `<p class="small pp-bio pp-bio-fallback">` with "Belief pattern: [dominantPattern]" or "Belief pattern: [dominantPattern] · Top alignment: [topAlignmentName]"
   - CSS: `.pp-bio-fallback { color:var(--muted); font-style:italic }` — visually distinct from a real bio

**What does NOT change:**
- Context block copy (D-154B)
- Snapshot card content (D-142B)
- Show-more/less behaviour (D-155A)
- ARIA attributes (D-156A)
- Copy profile link (D-156A)
- All privacy boundaries

**Testing for D-158B:**
- Update D-142B/D-154B snapshot-before-counts positional test to reflect new order (snapshot before context now)
- Tests for empty section suppression
- Test for bio fallback render when bio absent and snapshot present
- Test for bio fallback absence when neither bio nor snapshot present
- Confirm no sensitive fields added

---

## Risks / What Not to Change

| Risk | Mitigation |
|---|---|
| Reordering breaks existing positional smoke tests (D-142B/D-154B) | Update the tests to reflect the new canonical order — do not widen assertions to mask the change |
| Empty-section suppression hides sections a returning user expects | Claims section keeps empty state; only secondary sections suppress |
| Bio fallback looks like fabricated data | Use `pp-bio-fallback` CSS class; use "Belief pattern:" prefix not a narrative sentence |
| Counts card moving to bottom devalues it | Acceptable; counts are social proof, not a hook. Position after content is standard |
| Context block moving below snapshot means first-time visitors see the snapshot without vocab | The snapshot labels ("Self-reported dominant pattern", "Stability", "Openness", "Pressure") are self-explanatory. The context block appearing second still explains everything before the content sections |

---

## Privacy Boundary Confirmation

- No API change proposed. No new fields rendered.
- The bio fallback reads `p.sharedSnapshot.dominantPattern` and `p.sharedSnapshot.topAlignmentName` — both already rendered in the snapshot card, already public.
- No `email`, `is_admin`, `owner_token`, `evidence.body`, `pressure_points.body`, or internal debug metadata involved.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-158B plan.
