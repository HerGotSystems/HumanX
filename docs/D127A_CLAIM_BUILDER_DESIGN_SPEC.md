# D-127A Claim Builder Design Spec

**Date:** 2026-06-14  
**Branch:** `fix/d127a-claim-builder-design-spec`  
**Basis:** D-126B polish backlog batch merged. D-126B deploy is still pending explicit owner authorisation.  
**Scope:** Design/spec only. No frontend changes. No backend changes. No D1/schema changes. No Wrangler. No deploy. No live writes. No admin token.

---

## Purpose

HumanX claim creation should stop behaving like a plain form that expects users to already understand what a good claim is.

The product needs a **Claim Builder**: a guided intake path that accepts messy human text first, then helps turn it into either:

1. a clean, pressure-testable claim suitable for Review, or
2. a saved Truth-style assertion when the user is expressing a belief, identity statement, rant, repeated assertion, or non-testable thought.

This preserves the HumanX core flow:

```text
messy belief / truth / rant
→ HumanX Claim Builder
→ clean testable claim OR save as Truth
→ Review
→ Study mode
→ evidence + pressure + tests
→ RunPack readiness
→ RunPack export/import analysis
```

The builder must improve intake quality without pretending to prove anything at submission time.

---

## Non-Goals For D-127A

D-127A does **not** implement the builder.

Do not change:

| Area | D-127A rule |
|---|---|
| `public/app-v10.js` | no change |
| `public/index.html` | no change |
| `public/styles.css` | no change |
| `src/worker.js` | no change |
| D1 schema/migrations | no change |
| public API payloads | no change |
| Review decision endpoints | no change |
| RunPack output | no change |
| Belief Engine questions/bridge payload | no change |
| deployment state | no Wrangler, no deploy |

This document is the design boundary for the later implementation batch.

---

## Product Problem

The current Submit flow assumes the user can already convert a thought into a useful claim.

Real users usually start with something messier:

- “People are stupid.”
- “The council is lying.”
- “AI will ruin everything.”
- “School does not work for my kid.”
- “This is all corrupt.”
- “I keep seeing the same story everywhere.”
- “I feel like this system is built against people like me.”

Some of these can become testable claims. Some should remain Truths. Some are too broad, emotional, personal, or metaphysical for the claim pipeline without sharpening.

The builder should not reject messy input too early. It should catch it, label what kind of thing it is, and help route it properly.

---

## Core Principle

HumanX should accept the human first, then harden the statement.

The system should not say:

> “Your claim is invalid.”

It should behave more like:

> “Good raw material. Here is what would make it testable. Here is the version that can enter Review. Here is what remains as your original thought.”

This matters because HumanX is not only a fact-checking app. It is a pressure-testing and belief-clarifying system.

---

## Proposed UX: Three-Step Claim Builder

### Step 1 — Raw Thought

Purpose: capture the messy human input before any formalisation.

User-facing prompt:

```text
Write the thought, belief, claim, suspicion, rant, or pattern exactly as it is in your head.
Do not make it perfect yet.
```

Fields:

| Field | Required | Notes |
|---|---:|---|
| Raw thought | yes | free text; accepts messy wording |
| Why do you think this? | optional but encouraged | captures user reasoning/motivation without treating it as evidence |
| Where does this apply? | optional | can become scope later |
| What would change your mind? | optional | can become pressure/falsifier later |

Important behaviour:

- Do not run hard `CLAIM_TOO_SHORT` style rejection at the first keystroke.
- Do show soft guidance if the raw text is extremely short.
- Preserve this text unchanged for later Review display.

---

### Step 2 — Make It Testable

Purpose: transform raw thought into a structured review candidate.

The builder should generate or guide toward these intermediate pieces:

| Piece | Meaning |
|---|---|
| Draft claim | clean sentence that can be studied |
| Scope | who/where/when/context the claim applies to |
| Claim type | observation, causal, prediction, comparison, personal belief, value judgement, systemic suspicion, other |
| Testability flags | what makes it strong or weak as a claim |
| Possible falsifier | what would count against it |
| Evidence prompt | what kind of evidence would help |
| Truth-route warning | whether this looks more like a Truth than a claim |

The user should be able to edit the draft claim before submission.

The builder should not use AI in v1 unless explicitly designed later. A deterministic first version is enough: string heuristics, existing `claimQualityHints()`, and structured prompts.

---

### Step 3 — Final Claim

Purpose: let the user choose the final route.

Possible routes:

| Route | When used | Result |
|---|---|---|
| Submit as Claim | statement is testable enough | enters existing Review-first claim queue |
| Save as Truth | statement is a repeated assertion, belief, personal view, identity/worldview statement, or not directly testable | enters Truth flow/review path, not public proof |
| Keep editing | user wants to sharpen more | returns to Step 2 |
| Cancel | user stops | no write |

Final confirmation should show:

```text
Original text
Clean claim
Why you think this
Scope
What would count against it
System flags
Selected route
```

Submission copy must preserve the existing trust posture:

```text
Submitted for Review. It will appear publicly only after approval.
```

For Truth route:

```text
Saved as a Truth-style assertion for Review. This does not verify it as fact.
```

---

## Use Existing `claimQualityHints()` As Builder Flags

The existing `claimQualityHints()` should become the seed for the builder’s flag engine rather than remaining only a passive helper.

Expected extensions:

| Flag | Meaning | UX response |
|---|---|---|
| Too short | not enough substance | ask for more detail |
| Too broad | scope missing or global claim | ask “where / who / when?” |
| Too vague | unclear actor/action | ask for concrete subject and outcome |
| Emotional/rant-like | high heat, low testability | preserve original text, suggest cleaner claim |
| Personal belief | about feelings, identity, preference | suggest Truth route or personal-scope claim |
| Normative/value judgement | “should”, “wrong”, “evil”, “stupid” | ask what observable result supports it |
| Causal claim | says X causes Y | ask for mechanism/evidence/falsifier |
| Prediction | future event | ask for date/window/observable outcome |
| Conspiracy/system suspicion | hidden actor/motive | ask for observable behaviour rather than motive-only claim |
| Already testable | clear subject + observable predicate | allow final claim route |

No flag should auto-prove or auto-reject. Flags are guidance plus Review context.

---

## Truth vs Claim Route Detection

The builder should detect whether the user is creating a testable claim or a Truth-style assertion.

### Likely Claim

Characteristics:

- observable subject
- clear action/state/outcome
- possible supporting evidence
- possible pressure/falsifier
- can be studied by others

Examples:

```text
Guildford bus delays increased after the route change in May 2026.
```

```text
Students using game-based practice complete more voluntary revision sessions than students using worksheet-only practice.
```

### Likely Truth

Characteristics:

- repeated assertion
- personal worldview
- moral judgement
- identity claim
- emotional/rant-like statement
- too broad to test directly
- no clear falsifier

Examples:

```text
People are stupid.
```

```text
The system is built against ordinary people.
```

```text
School does not work for my daughter.
```

The third example could become a scoped claim, but the raw version is personal and context-heavy. The builder should offer both:

- Save as Truth: “School does not work for my daughter.”
- Sharpen as Claim: “My daughter learns more consistently through self-directed project work than through her previous school routine.”

---

## Future `claim_builder` Object

A structured object should eventually travel with claim/truth submissions.

No D1 change is allowed in D-127A. This is a future payload/schema design only.

Proposed shape:

```json
{
  "claim_builder": {
    "version": "1.0",
    "route": "claim",
    "raw_text": "People are stupid because they keep voting against their own interests.",
    "draft_claim": "Some voters support policies that conflict with their stated economic interests.",
    "final_claim": "Some voters support policies that conflict with their stated economic interests.",
    "why_user_thinks_this": "I see people complain about cost of living then support policies that seem to worsen it.",
    "scope": "UK voters discussing cost-of-living policy, 2020s",
    "claim_type": "observation",
    "pressure_or_falsifier": "Survey or voting data showing voters' stated interests align with their chosen policies would weaken this.",
    "evidence_needed": [
      "survey data",
      "voting behaviour data",
      "policy impact analysis"
    ],
    "system_flags": [
      "raw_text_emotional",
      "scope_added",
      "normative_language_softened",
      "testability_improved"
    ],
    "user_confirmed_final": true
  }
}
```

Open design question for implementation:

| Option | Pros | Cons |
|---|---|---|
| Store as JSON text column on claims/truths | preserves full context | requires migration |
| Store in new `claim_builder_sessions` table | cleaner lifecycle and audit trail | more schema/API work |
| Store only inside review metadata first | fastest, lower risk | may be awkward once claim is public |
| Store nowhere in v1, display client-side only | no schema risk | loses Review context, not ideal |

Recommendation for later implementation: start with review metadata or a JSON field only after a dedicated schema design pass. Do not hide it in unrelated columns.

---

## Review-First Publication Must Stay

The Claim Builder must not bypass Review.

Routes after Step 3:

```text
Final Claim → existing claim submission → Review queue → public only after approval
Truth route → Truth review path → public only after approval / existing truth rules
```

No direct public publishing.

No automatic conversion to public claim.

No automatic proof badge.

No automatic RunPack generation during submission.

---

## Review Card Future Layout

Review cards should eventually show the builder output clearly.

Target structure:

```text
CLAIM
[final cleaned claim]

ORIGINAL USER TEXT
[raw text]

WHY USER THINKS THIS
[user explanation]

SCOPE
[who / where / when / context]

PRESSURE / FALSIFIER
[what would count against it]

SYSTEM FLAGS
[too broad] [emotional raw text] [scope added] [truth route suggested]

DECISION
Approve / Keep in Review / Reject / Convert to Truth / Request Sharpening
```

The original text must remain visible so the reviewer can see whether the clean claim faithfully represents the user’s actual thought.

---

## New Possible Admin Actions Later

These are future actions only. They are not part of D-127A implementation.

| Action | Meaning |
|---|---|
| Convert to Truth | Reviewer decides the submission is valuable but not a pressure-testable claim |
| Request Sharpening | Reviewer decides the idea has potential but needs more user detail/scope/falsifier |
| Approve Clean Claim | Existing approval path, but with builder context visible |
| Reject as Junk/Unsafe/Unusable | Existing rejection/cleanup logic as appropriate |

`Request Sharpening` needs a separate product decision later because HumanX currently does not have user accounts/messaging that can reliably notify the submitter.

Until that exists, it may behave as an internal status only.

---

## Study Mode Boundary

RunPack belongs later in Study mode, not during submission.

Correct order:

```text
Submit/Truth route
→ Review
→ public/approved item
→ Study mode
→ evidence, pressure, tests
→ RunPack readiness
→ RunPack export/import analysis
```

Reason:

- submission is for intake and review
- Study is for investigation
- RunPack is for structured analysis once the item has enough context
- generating RunPack too early would confuse “raw thought” with “case-ready claim”

---

## Minimal Future Implementation Sequence

This is the recommended implementation order after D-127A.

### D-127B — Client-Only Builder Prototype

- Replace or wrap Submit UI with the three-step builder.
- Keep the final POST payload compatible with existing `/api/claims`.
- No schema change.
- Preserve existing Review-first claim path.
- Keep Truth route disabled or mock-only unless safe existing endpoint behaviour is confirmed.

### D-127C — Review Card Builder Context

- If no schema exists yet, only show context that is actually persisted safely.
- Do not fake missing builder fields.
- Add visual grouping for original text, final claim, scope, falsifier, flags.

### D-127D — Persistence Design / Schema Decision

- Decide how `claim_builder` survives reload and appears in Review.
- Design migration but do not run it without explicit D1 approval.

### D-127E — Truth Route / Convert Actions

- Add safe Truth route after existing truth API/review behaviour is audited.
- Add Convert to Truth only after server-side semantics are clear.

### D-127F — Request Sharpening Model

- Define what this means without accounts.
- Avoid dead-end UX where user thinks they will be contacted but cannot be.

---

## Acceptance Criteria For D-127A

D-127A is complete when:

- this design doc exists
- docs index points to it as the current next design baseline
- no app/source files are changed
- no schema/migration files are changed
- no deploy/Wrangler/D1 command is run
- the later implementation boundary is clear

---

## Recommended Next Task

**D-127B — Claim Builder client-only prototype.**

Build the three-step UI using existing frontend surfaces, deterministic hints, and existing claim submission route. Keep persistence and schema changes out until the product behaviour is proven in-browser.
