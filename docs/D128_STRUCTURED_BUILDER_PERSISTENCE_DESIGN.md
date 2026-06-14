# D-128 Structured Builder Persistence Design

**Date:** 2026-06-14  
**Branch:** `fix/d128-structured-builder-persistence-design`  
**Basis:** D-127E deployed / owner smoke PASS; D-127F tester invite pack merged; D-127G feedback triage issue opened but tester feedback intentionally skipped for now.  
**Scope:** Design/spec only. No product code. No backend change. No D1/schema migration. No Wrangler. No deploy. No live writes. No admin token.

---

## Purpose

D-127B introduced the Claim Builder and stored builder context by packing plain text into `initialEvidence`.

D-127D then parsed that plain text in Review so moderators could see:

- original user text
- why the user thinks this
- scope
- pressure/falsifier
- system flags

That was a good bridge, but it is not the final architecture.

D-128 defines the structured persistence design for Claim Builder context so HumanX can stop relying on fragile text parsing.

---

## Current Bridge

Current claim route:

```text
Claim Builder state
→ submitBuilderClaim()
→ POST /api/claims
→ claim fields + initialEvidence plain text
→ Review parses initialEvidence sentinel block
```

Current truth route:

```text
Claim Builder state
→ submitBuilderTruth()
→ POST /api/truths
→ raw statement saved as Truth for Review
```

The current bridge works because it is backward-compatible and required no schema change.

The limitation is that `initialEvidence` is now doing two jobs:

1. user-provided reason/evidence
2. structured builder metadata

Those should be separated.

---

## Design Goals

Structured builder persistence should:

- preserve the user's raw thought exactly
- preserve the cleaned final claim or Truth route choice
- preserve why/scope/falsifier/flags
- keep Review-first publication
- avoid exposing private/admin-only context publicly by accident
- support both Claim and Truth submissions
- avoid breaking existing claims created before D-128
- allow D-127D plain-text parser to remain as legacy fallback
- not turn builder context into proof or evidence by itself

---

## Non-Goals

D-128 does not implement:

- migration files
- D1 writes
- Worker code changes
- frontend code changes
- admin actions
- public display
- RunPack changes
- AI rewriting

This is a design boundary only.

---

## Recommended Data Model

Use a dedicated table rather than overloading `claims` or `truths`.

Recommended table name:

```text
claim_builder_contexts
```

Proposed columns:

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PRIMARY KEY | `cbc_...` |
| `target_type` | TEXT NOT NULL | `claim` or `truth` |
| `target_id` | TEXT NOT NULL | claim/truth id |
| `user_id` | TEXT | pseudonymous user id |
| `route` | TEXT NOT NULL | `claim` or `truth` |
| `version` | TEXT NOT NULL | e.g. `1.0` |
| `raw_text` | TEXT NOT NULL | original user thought |
| `why_user_thinks_this` | TEXT | user reason/motivation |
| `scope` | TEXT | who/where/when/context |
| `pressure_or_falsifier` | TEXT | what would count against it |
| `draft_claim` | TEXT | Step 2 draft |
| `final_claim` | TEXT | final submitted claim, if route claim |
| `category` | TEXT | category at submission |
| `claim_type` | TEXT | type at submission |
| `system_flags_json` | TEXT | JSON array of flag codes/messages |
| `created_at` | INTEGER | epoch ms |
| `updated_at` | INTEGER | epoch ms |

Recommended indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_claim_builder_contexts_target
ON claim_builder_contexts(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_claim_builder_contexts_user
ON claim_builder_contexts(user_id, created_at);
```

---

## Why Dedicated Table

A dedicated table is cleaner than adding a JSON blob column to `claims` and `truths`.

Advantages:

- works for both claims and truths
- avoids widening public list queries
- keeps Review-only context separable
- supports future versioning
- allows multiple builder attempts if needed later
- preserves old claims/truths without migration complexity

Disadvantages:

- requires join or second query in Review
- requires one migration and small API mapping work
- needs fallback behaviour for old rows

The advantages are stronger.

---

## Payload Shape

Frontend should eventually send:

```json
{
  "claim": "Some voters support policies that conflict with their stated economic interests.",
  "category": "Politics",
  "type": "Physical/Testable",
  "initialEvidence": "Optional user evidence, not builder metadata.",
  "claim_builder": {
    "version": "1.0",
    "route": "claim",
    "raw_text": "People are stupid because they keep voting against their own interests.",
    "draft_claim": "Some voters support policies that conflict with their stated economic interests.",
    "final_claim": "Some voters support policies that conflict with their stated economic interests.",
    "why_user_thinks_this": "I see people complain about cost of living then support policies that seem to worsen it.",
    "scope": "UK voters discussing cost-of-living policy, 2020s",
    "pressure_or_falsifier": "Survey or voting data showing alignment would weaken this.",
    "category": "Politics",
    "claim_type": "Physical/Testable",
    "system_flags": [
      { "code": "too_broad", "message": "Broad scope — narrow to a specific group, time, or place." },
      { "code": "testable_enough", "message": "Falsifier provided — good signal this is testable." }
    ]
  }
}
```

For Truth route:

```json
{
  "statement": "The system is built against ordinary people.",
  "category": "general",
  "origin": "Claim Builder raw thought",
  "truthType": "personal-belief",
  "confidenceLabel": "claimed",
  "claim_builder": {
    "version": "1.0",
    "route": "truth",
    "raw_text": "The system is built against ordinary people.",
    "why_user_thinks_this": "User explanation if provided.",
    "scope": "Optional scope if provided.",
    "pressure_or_falsifier": "Optional falsifier if provided.",
    "system_flags": [
      { "code": "personal_belief", "message": "Personal framing — reframe as observable if pressure-testing." }
    ]
  }
}
```

---

## API Behaviour

### `/api/claims` POST

When body contains `claim_builder`:

1. create claim exactly as today
2. keep review_state as `review`
3. create builder context row linked to claim id
4. return claim response exactly as today, with optional `claimBuilderContext` if useful

If builder context insert fails:

- safest default: fail the whole request with `SERVER_ERROR`
- do not create a claim without its context if the user submitted through builder
- if this proves too brittle later, design compensating cleanup explicitly

### `/api/truths` POST

When body contains `claim_builder`:

1. create or repeat Truth exactly as today
2. keep review_state as `review` for new truth
3. create builder context row linked to truth id unless repeated existing truth semantics require special handling

Repeated existing Truth design choice:

| Option | Behaviour |
|---|---|
| A | increment repetition only; do not create new builder context |
| B | increment repetition and create additional context row |

Recommendation: **B** later, because repeated assertions from different users are valuable context. But D-128 implementation should decide deliberately.

---

## Review UI Behaviour

Review should prefer structured context when available:

```text
claimBuilderContext from API
→ render structured panel
→ fallback to parseClaimBuilderContext(initialEvidence)
→ otherwise no builder panel
```

D-127D parser remains useful for older builder submissions.

Review display should continue to show:

- ORIGINAL USER TEXT
- WHY USER THINKS THIS
- SCOPE
- PRESSURE / FALSIFIER
- SYSTEM FLAGS

Do not show builder context publicly unless a separate product decision approves that.

---

## Public Display Boundary

Builder context is **Review-first metadata**.

It should not appear on public Claims/Truths pages by default because:

- raw thoughts may be messy or personal
- raw text may include emotional wording not suitable for public display
- final approved claim/truth should be the public object
- context may help moderation but is not itself evidence

Possible future public uses:

- show sanitized origin note
- show “derived from raw belief” badge
- include context in RunPack after approval

All should be separate decisions.

---

## RunPack Boundary

RunPack should not consume raw builder context until approved.

Future possibility:

- approved claim RunPack may include a `builder_context` section if available
- raw text should be labelled as user-origin context, not evidence
- system flags should be labelled as intake flags, not verdict flags

No RunPack change in D-128.

---

## Backward Compatibility

Existing rows fall into three groups:

| Group | Handling |
|---|---|
| pre-builder claims/truths | no builder panel |
| D-127B/C/D builder submissions | parse legacy `initialEvidence` sentinel |
| future structured submissions | use `claim_builder_contexts` table |

Do not migrate old text blocks unless there is a strong reason later.

Legacy parser should remain until at least one full release after structured persistence is stable.

---

## Proposed Implementation Sequence

### D-128B — Migration Draft Only

Create migration file for `claim_builder_contexts`, but do not run it.

### D-128C — Worker Write Path

Update `/api/claims` and `/api/truths` to accept optional `claim_builder` and write context rows.

### D-128D — Review API Read Path

Include structured builder context in `/api/review` response.

### D-128E — Frontend Submit Payload

Update `submitBuilderClaim()` and `submitBuilderTruth()` to send `claim_builder` JSON while keeping `initialEvidence` fallback temporarily.

### D-128F — Review UI Prefer Structured Context

Use `item.claimBuilderContext` first; fallback to D-127D parser.

### D-128G — Owner Smoke / Deploy

Deploy and smoke structured persistence.

---

## Risks

| Risk | Mitigation |
|---|---|
| raw text leaks publicly | keep context Review-only by default |
| schema migration fails | migration draft + explicit owner approval before D1 apply |
| duplicate Truth creates confusing contexts | decide repeated-truth semantics before implementation |
| builder context treated as evidence | label as intake context, not evidence |
| API response grows too much | include context only in Review/detail endpoints |

---

## Acceptance Criteria For D-128

D-128 is complete when:

- structured persistence design is documented
- recommended table and payload shape are defined
- Review/public/RunPack boundaries are explicit
- legacy D-127D parser fallback is preserved in the plan
- implementation sequence is clear
- no code/schema/deploy change is made

---

## Recommended Next Task

**D-128B — migration draft only for `claim_builder_contexts`.**

Create the SQL migration file and static docs, but do not run it against D1 until explicitly approved.
