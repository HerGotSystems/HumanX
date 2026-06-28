# D-202A — HumanX Epistemology Model

**Date:** 2026-06-28
**HEAD at creation:** `4af9940`
**Baseline:** 1628/24/57
**Scope:** Conceptual model only — no code, no migrations, no schema changes

---

## Purpose of This Document

HumanX now contains claims, truths, evidence, pressure, votes, source types, evidence strength, belief snapshots, moderation, RunPacks, and aggregate charts in planning. Without a shared model of what these things measure and what they do not, the system risks becoming something it was not designed to be: a credibility engine, a popularity contest, or a pseudo-scientific authority.

This document fixes the conceptual model before the system scales. It is the reference for all future feature decisions.

---

## A. What HumanX IS

**A structured claim-analysis environment.**
HumanX gives users a common format for stating a claim and then systematically attaching support, challenge, and testing to it. The structure makes reasoning visible, not correct.

**A belief and pressure mapping system.**
HumanX records what people believe, what they use to support those beliefs, and what pressure they acknowledge against them. It maps the landscape of a belief, not the ground truth beneath it.

**A way to compare support, criticism, and reasoning.**
A claim with ten pieces of support and five pressure points is a claim that has been examined. It is not a claim that has been proven. HumanX makes examination visible.

**A collaborative investigation environment.**
Multiple users can contribute evidence and pressure to the same claim. The system accumulates perspectives. It does not synthesize them into a verdict.

**A study of how claims are formed and defended.**
The Belief Engine, drift tracking, and conviction snapshots record how a person's stated confidence moves over time. This is psychological and social data, not epistemological validation.

**An input layer for AI pressure-testing (RunPack).**
RunPacks export structured claim data to AI systems for external analysis. The AI's output is one more input to the investigation, not a final answer. HumanX is the container; humans and AI are analysts within it.

---

## B. What HumanX is NOT

**Not a truth machine.**
HumanX cannot determine whether a claim is factually correct. It can map how well-supported and well-challenged a claim is. These are different things. A claim can be popular, well-supported by testimony, and completely false.

**Not a democracy of reality.**
Vote counts, belief percentages, and evidence counts are measures of user behavior. They are not measures of the claim's correspondence with reality. One person citing a peer-reviewed replication study outweighs a hundred people citing vibes. HumanX does not currently implement that weighting, and even if it did, the underlying reality would remain independent of the tally.

**Not a fact oracle.**
The `status` field on a claim (`Plausible`, `Contested`, `Debunked`) reflects the evidence/pressure balance as submitted by users. It is not a declaration of fact. It is an aggregate label for the current state of the investigation.

**Not a scientific journal.**
Peer review, replication, methodology audit, conflict-of-interest disclosure, statistical significance — none of these are enforced by HumanX. A claim backed by a single empirical study and a claim backed by a scripture citation both pass moderation if the content is acceptable. The source type field distinguishes origin; it does not validate the claim.

**Not a religion filter.**
HumanX does not rank religious, traditional, or mythological sources as lower than empirical ones. It records the distinction. A claim that is believed because of scripture is a real claim held by real people. Recording its source type honestly is not a dismissal. Pretending scripture is empirical evidence would be a worse distortion.

**Not an automatic credibility engine.**
High `evidence_score` means the current evidence pool is weighted toward support. It does not mean the claim is credible by any external standard. Low `survivability` means the current pressure pool is heavy. It does not mean the claim will collapse under rigorous investigation.

**Not a moderator of truth.**
Moderation approves or rejects content based on whether it meets community standards for clarity and relevance. A moderated-public claim is a claim that passed content review. It is not a claim that has been endorsed as factually correct.

---

## C. Definitions

These are the operational definitions HumanX uses. They are not philosophical definitions of the underlying concepts.

**Claim**
A statement a user asserts as true or worthy of investigation. Stored with a category, type, and testability inference. The claim text is the user's words; the system does not rephrase or validate them. A claim may be physical/testable, social/normative, or metaphysical. All types are accepted.

**Truth**
A personal or shared belief statement — something a user holds to be true about themselves, the world, or their experience. Truths are softer than claims: they are not always falsifiable, and they often record conviction rather than argument. A truth can be converted to a claim if the user wants to subject it to structured investigation.

**Evidence**
Content submitted to support or challenge a claim. Evidence is tagged with `stance` (support/challenge), legacy `quality` (repeatable/documented/media/testimony/vibes), `source_type` (origin category), and `evidence_strength` (submitter's self-assessed weight). Evidence is not independently verified. The system records what users say about their sources, not what those sources actually prove.

**Pressure**
A challenge, contradiction, or objection attached to a claim. Pressure is not the same as evidence against the claim; it may be a logical challenge, a missing test, a conflicting claim, or a known exception. High pressure means many challenges have been recorded, not that the claim has been falsified.

**Test**
A proposed home experiment or observable check users can perform to probe the claim. Tests are user-generated. They are not peer-reviewed experimental designs. A test that fails does not automatically falsify the claim, and a test that passes does not confirm it. Tests are investigation prompts, not proof mechanisms.

**Belief**
A user's self-reported conviction level in a claim, recorded on a yes/no/uncertain scale. Belief data is subjective and self-reported. Aggregated belief percentages show how a user population currently reports their conviction. They do not show whether the claim is true.

**Confidence**
A user's self-reported certainty level about a belief, recorded in the Belief Engine on a numeric scale. Confidence is psychological self-assessment. High confidence means the user feels certain. It does not mean they are correct.

**Source Type**
The origin category of an evidence item: what kind of source it comes from. Source type distinguishes peer-reviewed studies from eyewitness accounts from scripture citations from social media posts. Source origin is not proof. An empirical study is evidence of measurement; a scripture citation is evidence of tradition. Both can be relevant. Neither is automatically conclusive.

**Evidence Strength**
A submitter's self-assessed weight for their evidence item: strong, moderate, weak, disputed, or unknown. Evidence strength is subjective metadata, not an independent assessment. It does not affect automated scoring. It tells future readers how the submitter rated their own contribution.

**Review / Moderation**
The process by which submitted content transitions from `review` state to `public` or `rejected`. Moderation checks content against community standards: clarity, relevance, absence of abuse. A decision of `public` means the content is acceptable for public display. It does not mean the content is factually accurate. A decision of `rejected` means the content violated standards. It does not mean the content is false.

---

## D. Critical Separations

These are the lines that must never be erased in UI copy, feature design, or user-facing framing.

**Popularity ≠ truth.**
The number of users who believe a claim, vote for it, or submit supporting evidence does not determine whether the claim is true. Reality is not decided by vote. Charts showing majority support must never use language that implies the majority has proven anything.

**Confidence ≠ accuracy.**
A user who reports 100% confidence in a belief has told us something about their psychological state. They have told us nothing about the truth-value of the belief. High conviction scores measure certainty of belief, not correctness of belief.

**Source origin ≠ proof.**
A scripture citation is evidence that someone holds a belief on the basis of religious tradition. A peer-reviewed study is evidence of measurement under controlled conditions. Both record something real. Neither automatically proves the claim true or false. The `source_type` field captures origin; it does not rank epistemological authority.

**Moderation ≠ endorsement.**
When a moderator approves an evidence item, they are saying: this content is appropriate for the platform. They are not saying: this content is correct, verified, or officially endorsed. The platform has no mechanism to endorse truth claims.

**Quantity of evidence ≠ quality.**
Ten pieces of testimony all citing the same anecdotal source do not add up to one peer-reviewed study. Evidence counts are structural metrics. They reflect how much has been submitted, not how conclusive the submission is. `evidence_score` is a participation measure, not a proof measure.

**Emotional certainty ≠ verification.**
Users who express strong conviction — through belief scores, evidence language, or pressure rejections — are reporting their emotional and cognitive state. Verification requires external methods that HumanX does not perform. The system records conviction; it does not validate it.

**Investigation depth ≠ resolved question.**
A claim with many evidence items, pressure points, and home tests has been examined more than a claim with one. It has not necessarily been resolved. Some questions cannot be resolved through this kind of investigation. The system should not suggest otherwise.

---

## E. The HumanX Investigation Loop

```
Claim submitted
      │
      ▼
Evidence attached (support / challenge)
      │
      ▼
Pressure recorded (objections, contradictions, exceptions)
      │
      ▼
Tests proposed (observable checks, home experiments)
      │
      ▼
Belief snapshot taken (conviction level, confidence, drift)
      │
      ▼
RunPack built (structured export for AI pressure-testing)
      │
      ▼
Interpretation — by the user, not by HumanX
```

The loop is a study tool. At every stage, the user is doing the interpreting. HumanX is the format and the archive. When the loop ends with "Interpretation — by the user", that is the design, not a gap. Adding an automated verdict at the end would corrupt the model.

The only score the system produces is `evidence_score`, `survivability`, and `testability`. These are structural signals about the investigation itself — how much has been attached, how pressure-heavy it is, how testable the claim appears. They are not verdicts about reality.

---

## F. The Role of Scripture, Myth, and Tradition

This section exists because the `source_type` field distinguishes `scripture_tradition`, `myth_folklore`, and `fiction_story` from empirical sources, and that distinction requires explicit framing to avoid two opposite misuses.

**Misuse 1 — Dismissal:** Treating any evidence tagged `scripture_tradition` as automatically false, irrelevant, or lower-quality than other sources.

**Misuse 2 — Equivalence:** Treating scripture citations as equivalent to empirical evidence for factual claims about the observable world.

Both misuses corrupt the investigation.

**What these source types actually record:**

Scripture, tradition, myth, and story are among the oldest and most powerful sources of human belief. They explain why billions of people hold the beliefs they hold. They carry historical, cultural, psychological, and sometimes aesthetic weight that empirical studies cannot replicate. They are real evidence of why claims are believed.

They are not independent empirical verification that the factual claims embedded in them correspond to observable reality. A scripture that says the earth is flat does not make it flat. A scripture that says love is a moral duty records a real moral tradition, not a falsifiable physical fact.

The contextual note shown for these source types — "Origin/tradition source — not empirical proof by itself" — is not a dismissal. It is a disambiguation. It says: this source records where the belief comes from. Whether that belief is factually correct requires a different kind of investigation.

**Operational rules:**
- Do not auto-reject evidence tagged with origin source types
- Do not lower the `evidence_score` weight for origin source types
- Do not prevent origin-typed evidence from making a claim `public`
- Do show the contextual note so reviewers and users understand what kind of source they are reading
- Do allow moderators to make their own judgment about specific content

---

## G. Aggregate Chart Warning Principles

When aggregate charts are added (planned in D-201A and D-201G), these principles must govern how they are presented.

**Charts show user behavior, not reality.**
A pie chart showing 70% of belief snapshots say "yes" to a claim tells you how users in this system reported their belief. It does not tell you whether the claim is true. The chart must never be presented without this framing.

**Majority support must never visually imply "proven."**
No green checkmarks, no "verified by majority", no percentage thresholds that trigger a "supported" badge. The only thing a majority proves is that a majority said yes.

**No "Top Truths" or "Most Believed Claims" ranking by popularity alone.**
A ranking of claims by vote count or belief percentage is a popularity chart. Presented without context, it functions as a credibility signal that the system cannot justify. If such rankings are built, they must be labeled explicitly as popularity rankings, not accuracy rankings.

**Source type distribution charts are descriptive.**
A chart showing "40% of evidence is scripture/tradition" describes the composition of the evidence pool. It does not tell you whether the claim is supported or not.

**Drift charts show movement, not convergence on truth.**
If a user's conviction moves from 60% to 90% over three months, that shows their belief intensified. It does not show that the claim became more true. Drift charts must not be labeled in ways that imply investigation resolved the question.

**Never show a single "credibility score."**
Any composite score combining evidence, votes, belief, and source quality into a single number would be an epistemological claim the system cannot support. Separate structural metrics are honest. A blended credibility score is not.

---

## H. Future Risk Analysis

These are the failure modes most likely to corrupt HumanX as it scales. They are recorded here so they can be recognized early.

**Ideology capture.**
A coordinated group submits evidence, votes, and belief snapshots for a set of ideologically connected claims. The aggregate charts begin to reflect the ideology as "well-supported." Countermeasures: rate limits, review moderation, no credibility score, persistent framing of charts as behavior data.

**Coordinated brigading.**
A group targets a specific claim with reports, downvotes, or rejection pressure. The claim enters review and stays there. Countermeasures: existing rate limits, moderation review queue, no auto-rejection on report count, admin override.

**Pseudo-scientific aesthetics.**
Users treat the structural metrics (evidence_score, testability, survivability) as if they were scientific measurements. The interface's structured appearance creates a false sense of rigor. Countermeasures: explicit copy in all metric displays, this document as design reference, no decimal precision in structural scores that implies false accuracy.

**Interface confidence mistaken for truth.**
Users interpret a high evidence_score or a "Plausible" status label as the platform endorsing the claim. Countermeasures: status labels must always be explained as investigation-state labels, not truth labels; the Belief Engine UI must frame confidence as self-report.

**Moderation overreach.**
Moderators begin rejecting claims not for content standard violations but for being factually incorrect by their judgment. This turns moderation into a truth filter the platform was not designed to be. Countermeasures: moderation guidelines must be content-standard focused, never truth-assessment focused.

**Belief tribalism and gamification.**
Users accumulate claims, evidence items, and belief snapshots as a form of social score. The investigation loop becomes a game. Evidence is submitted to win, not to investigate. Countermeasures: no public leaderboards, no points system, no "most active contributor" signals, no social proof mechanics.

**Drift exploitation.**
Users game the Belief Engine by capturing initial low-confidence snapshots and then submitting favorable evidence to show "drift toward certainty." The drift chart becomes a narrative tool rather than an honest record. Countermeasures: snapshots are user-private by design; drift is shown only to the user; aggregate drift data, if ever shown, must not identify specific users.

**RunPack authority laundering.**
Users present AI analysis from a RunPack as independent expert verification of the claim. "The AI said this is plausible" becomes a credibility citation. Countermeasures: RunPack output is explicitly framed as AI pressure-testing input, not verdict; AI output is one more evidence item, not an authority.

---

## I. Product Principle

> **HumanX maps and pressures claims. Humans still interpret reality.**

This is not a limitation. It is the design.

The alternative — a system that tells users what is true — would require the system to have epistemological authority it cannot earn and should not want. No platform can be the arbiter of reality without becoming a power structure. HumanX is a tool for structured inquiry, not a truth institution.

Every feature decision should be tested against this principle:

- Does this feature help users map and pressure a claim? → Build it.
- Does this feature imply the system has decided what is true? → Do not build it, or build it differently.
- Does this feature make it easier for users to interpret their own investigation? → Build it.
- Does this feature substitute the system's judgment for the user's? → Do not build it.

The goal is not to make users believe the right things. The goal is to make the structure of what they believe — and why — visible to them and to each other.

---

## Application to Existing Features

| Feature | What it actually measures | What it must never imply |
|---------|--------------------------|--------------------------|
| `evidence_score` | Balance and count of submitted evidence | That the claim is correct |
| `survivability` | Current pressure weight | That the claim will or will not hold up |
| `testability` | Inferred testability of claim type | That tests have been run |
| Belief snapshot | User's self-reported conviction | That conviction is accurate |
| Confidence level | User's self-reported certainty | That certainty corresponds to reality |
| `review_state: public` | Content passed moderation standards | That the claim or evidence is endorsed |
| Vote counts | User preference behavior | That the majority has established fact |
| `source_type` | Origin category of evidence | Automatic ranking of credibility |
| `evidence_strength` | Submitter's self-assessment | Independent quality certification |
| RunPack AI output | AI analysis of the claim structure | Official verdict on truth |
| Aggregate belief charts | Distribution of reported conviction | Map of actual reality |
| Drift data | Change in self-reported conviction over time | Convergence on fact |

---

## Relationship to Other Docs

- **D-201A_BELIEF_ENGINE_EXPANSION_ROADMAP.md** — the aggregate chart framing rules in that doc should be read alongside Section G of this document
- **D-201D_SOURCE_TAXONOMY_API_SPEC.md** — the `source_type` field and its display rules were designed with Section F in mind
- **D-201_SOURCE_TAXONOMY_CLOSEOUT.md** — the "Origin is not proof" principle in that doc is an application of Section D here
- **D124I_BELIEF_ENGINE_PRE_TESTER_READINESS_AUDIT.md** — the Belief Engine's confidence/drift framing must remain consistent with Section C (Confidence definition) above

Any future feature that introduces ranking, scoring, or aggregate display should be reviewed against this document before implementation.
