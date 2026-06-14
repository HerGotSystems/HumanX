# D-127B Claim Builder Client-Only Prototype

**Date:** 2026-06-14
**Branch:** `fix/d127b-claim-builder-client-prototype`
**Basis:** D-127A design spec (already on main).

---

## Scope

Client-only prototype. No backend changes, no schema changes, no D1 queries, no Wrangler, no deploy.

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | Replace `renderSubmit()` with 3-step Claim Builder; add 12 new functions |
| `public/styles.css` | Add Claim Builder component styles (22 new rules) |
| `docs/D127B_CLAIM_BUILDER_CLIENT_PROTOTYPE.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: worker, D1 schema, migrations, Belief Engine SPA, bridge payload, review/admin permission model, public write guardrails, RunPack flow.

---

## What Changed

### `renderSubmit()` — replaced with 3-step dispatcher

The old single-form submission is replaced. `renderSubmit()` now reads `_bs.step` and dispatches to one of three step renderers:

```
Step 1 → renderBuilderStep1()   Raw Thought
Step 2 → renderBuilderStep2()   Make It Testable
Step 3 → renderBuilderStep3()   Final Claim + Submit
```

State is tracked in `let _bs = {step, raw, why, scope, falsifier, draft, category, type, flags}` (module-level, reset on successful submit).

---

### Step 1 — Raw Thought

Fields:
- **Your raw thought** — freeform textarea, no hard rejection except empty/near-empty
- **Why do you think this?** — context textarea
- **Where does this apply?** — scope input (time period, geography, group)
- **What would change your mind?** — falsifier input

Live flag panel below fields updates as the user types via `builderLiveFlags()`. Button: "Make it testable →" — validates raw thought ≥5 chars, then calls `builderNext(1)`.

Trust note ("Scores reflect submitted evidence — not an automatic verdict.") is present in step 1 to satisfy existing smoke test continuity guards from D-111B.

---

### Step 2 — Make It Testable

Shows:
- Step indicator (active: step 2)
- Quoted original text (`builder-original` panel)
- System flags from `claimBuilderFlags()` rendered as badges
- Route advisory (`builder-route-claim` or `builder-route-truth`)
- Editable **draft claim** textarea — pre-populated with `claimBuilderDraft(raw, scope)` output
- Editable **scope** and **falsifier** fields
- Category chips (same set as before, `builderSetCat()`)
- Claim type select (same options as before, `builderSetType()`)
- Back / Continue to final claim buttons

Route advisory:
- `looks testable` (green) — more claim-route flags than truth-route flags
- `looks like a Truth` (yellow) — more truth-route flags

The Truth route is **advisory only** — no write to `/api/truths` in this prototype. The note says "save it as a Truth later."

---

### Step 3 — Final Claim

Summary card with labelled rows:

| Label | Content |
|---|---|
| CLAIM | Final draft claim (editable in step 2) |
| ORIGINAL | Raw user text |
| WHY | Why user thinks this |
| SCOPE | Scope / context |
| FALSIFIER | What would change their mind |
| FLAGS | Builder flag badges |
| DECISION | "Submit as Claim for Review" badge |

Button: "Submit Claim for Review" → `submitBuilderClaim()`.

---

### `claimBuilderFlags(text, scope, falsifier)`

Extended flag engine (separate from existing `claimQualityHints()`). Returns `[{code, msg, route}]`.

Detected patterns:

| Code | Trigger | Route hint |
|---|---|---|
| `too_short` | text < 20 chars | — |
| `personal_belief` | "I think / I believe / in my opinion" opener | truth |
| `too_broad` | "People are / everyone is" opener + short text | — |
| `normative_value` | "should/must/ought" without evidence signal | truth |
| `too_vague` | absolute words (always/never/all/none) in short text | — |
| `emotional_rant` | evaluative words (evil/corrupt/immoral) | truth |
| `conspiracy` | hidden-actor phrasing (they + hiding/control/secret) | claim |
| `prediction` | future tense / "by 20XX" | claim |
| `causal` | "causes" without evidence citation | claim |
| `testable_enough` | falsifier provided (length > 5) | claim |
| `no_falsifier` | falsifier absent | — |

These are advisory — no hard rejection, no blocking.

---

### `claimBuilderRoute(flags)`

Returns `'truth'` if truth-route flag count > claim-route flag count, else `'claim'`.

---

### `claimBuilderDraft(raw, scope)`

Light deterministic cleaner (not magic, not AI):
- Trim + collapse whitespace
- Strip leading opinion markers ("I think," "I believe," etc.)
- Capitalise first letter
- Ensure terminal punctuation
- If `scope` provided and not already in the text, append "— scope."

Result is editable in step 2. User controls the final claim.

---

### `renderBuilderFlags(flags)`

Returns `<div class="builder-flags">` with badges. Colour by code:
- `b-green` — testable_enough
- `b-red` — emotional_rant
- `b-blue` — conspiracy, prediction, causal
- `b-yellow` — everything else

---

### `submitBuilderClaim()`

Posts to `/api/claims` with `{claim, category, type, initialEvidence}` — fully compatible with existing endpoint. No schema change.

`initialEvidence` carries builder context as plain text:
```
Claim Builder context:
Original user text: ...
Why user thinks this: ...
Scope: ...
Pressure/falsifier: ...
System flags: ...
```

This preserves the builder context for Review moderators without any schema change. On success: resets `_bs`, reloads claims, shows confirm panel with "Study this claim" and "Build another claim" actions.

Error translation: same `RATE_LIMITED` / `CLAIM_TOO_SHORT` friendly copy as `saveClaim()` (D-126B).

---

### `updateClaimQualityHints()` and `claimQualityHints()`

Both remain unchanged from their current definitions. `updateClaimQualityHints()` is still exported on `window` and still callable; it simply finds no DOM elements in builder mode (the old `cClaim` input no longer renders), which is safe.

---

### CSS additions (`styles.css`)

22 new rules under `/* ── D-127B CLAIM BUILDER ── */`:

- `.claim-builder` — max-width container
- `.builder-steps` / `.builder-step` / `.builder-step-active` — step indicator pill row
- `.builder-flags` / `.builder-flags-live` / `.builder-flag` — flag badge layout
- `.builder-original` / `.builder-original-label` / `.builder-original-text` — quoted original text panel
- `.builder-route` / `.builder-route-claim` / `.builder-route-truth` — route advisory panels
- `.builder-summary` / `.builder-summary-row` / `.builder-summary-label` / `.builder-summary-val` / `.builder-summary-muted` — final summary card
- `@media(max-width:600px)` — summary row stacks to column on mobile

---

## Explicit No-Change Confirmations

| Area | Status |
|---|---|
| Worker (`src/worker.js`) | Not touched |
| D1 schema / migrations | Not touched |
| `/api/claims` endpoint | Compatible POST unchanged |
| Belief Engine SPA | Not touched |
| Bridge payload | Not touched |
| Review/admin permission model | Not touched |
| Public write guardrails | Not touched |
| RunPack flow | Not touched; stays in Study mode |
| `saveClaim()` function | Still present and functional |
| Review-first publication | Unchanged — builder submits to `/api/claims` which inserts with `review_state='review'` |

---

## Notes

- **Truth route is advisory/deferred.** The route advisory tells the user their input looks more like a Truth than a testable claim, but no write to `/api/truths` occurs in D-127B. Full Truth save is deferred to D-127C or later.
- **Builder context in `initialEvidence`.** The original user text, why, scope, and falsifier are packed into `initialEvidence` as plain text. This gives Review moderators full context without any schema change. A dedicated `claim_builder` column is a D-127C+ concern.
- **`saveClaim()` preserved.** The old function is still defined and exported. It is not called by the builder flow but may still be called by other paths (e.g. test scripts or future code). No regression.
- **Step state resets on mode change.** If the user navigates away mid-flow via a nav tab, `_bs` retains its state and they return to where they were when they come back to Submit. Reset only happens on successful submit.

---

## Checks

```
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```

---

## Deploy Note

**Deploy required** (frontend assets changed). No worker or D1 changes — a standard `wrangler deploy` after this PR merges is sufficient.

---

## Recommended Next Task

**D-127C** — add Truth-route save to the builder (when user's input routes to `truth`, offer a real "Save as Truth" button that calls the existing `/api/truths` endpoint). No schema change needed — the endpoint already exists and accepts the same pattern as claim submission.
