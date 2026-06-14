# D-128E Frontend Structured Builder Payload

**Date:** 2026-06-14
**Branch:** `fix/d128e-frontend-structured-builder-payload`
**Basis:** D-128D Review API read path merged (PR #188, merge `6029e88`).

---

## Scope

Frontend submit payload only. No Worker logic change. No Review UI change. No D1 schema change. No deploy. Legacy `initialEvidence` sentinel preserved.

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | Added `builderPayload()`; `submitBuilderClaim()` and `submitBuilderTruth()` send `claim_builder` field |
| `docs/D128E_FRONTEND_STRUCTURED_PAYLOAD.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: `src/worker.js`, `src/truths.js`, `src/claim-builder-contexts.js`, `public/styles.css`, migrations, any backend endpoint.

---

## `builderPayload()`

New pure helper function (line 111, between `builderBack()` and `submitBuilderClaim()`). Reads the current `_bs` state and returns the structured object expected by the D-128C Worker write path:

```js
{
  route,          // 'claim' or 'truth' — from claimBuilderRoute(_bs.flags)
  rawText,        // _bs.raw
  why,            // _bs.why
  scope,          // _bs.scope
  falsifier,      // _bs.falsifier
  draftClaim,     // _bs.draft
  finalClaim,     // _bs.draft  (same for claim route; truth route saves raw)
  category,       // _bs.category
  claimType,      // _bs.type
  systemFlags,    // _bs.flags mapped to code strings (via f.code || f)
}
```

Field naming uses the camelCase aliases accepted by `cleanClaimBuilderContext()` in `src/claim-builder-contexts.js` (`why`, `falsifier`, `draftClaim`, `finalClaim`, `claimType`, `systemFlags`). No duplication of field names needed.

`systemFlags` is mapped from the flag objects array (`[{code, msg, route}]`) to an array of code strings (`['too_short', 'testable_enough', ...]`). The Worker serialises this array to JSON for `system_flags_json`.

Not exported on `window` — internal to the submit functions only.

---

## `submitBuilderClaim()` — Claim route

POST body gains one new field alongside all existing fields:

```js
{
  claim:          _bs.draft.trim(),
  category:       _bs.category || 'general',
  type:           _bs.type || 'Physical/Testable',
  initialEvidence: context,   // ← legacy D-127B sentinel KEPT
  claim_builder:  builderPayload(),  // ← NEW structured field
}
```

The legacy `initialEvidence` plain-text sentinel is preserved so that:
- The D-127D `parseClaimBuilderContext()` parser in Review UI continues to work for any rollback scenario
- The D-128D API read path uses the structured table, but the fallback remains in the evidence record

Worker behaviour: `createClaim()` writes to `claim_builder_contexts` when `body.claim_builder` is present (D-128C). The `initialEvidence` is also inserted as evidence (unchanged).

---

## `submitBuilderTruth()` — Truth route

POST body gains one new field:

```js
{
  statement:       _bs.raw.trim(),
  category:        _bs.category || 'general',
  origin:          'Claim Builder raw thought',
  truthType:       route === 'truth' ? 'personal-belief' : 'common',
  confidenceLabel: 'claimed',
  claim_builder:   builderPayload(),  // ← NEW structured field
}
```

Worker behaviour: `createTruth()` / `repeatExistingTruth()` writes to `claim_builder_contexts` when `body.claim_builder` is present (D-128C).

---

## Non-builder Submissions Unaffected

`saveClaim()` (the old single-form path) does not call `builderPayload()` and does not send `claim_builder`. Its behaviour is completely unchanged.

---

## What Is NOT Done Yet

| Item | Task |
|---|---|
| Review UI prefers structured data over plain-text parse | D-128F |
| Deploy | Pending owner authorisation |

---

## Checks

```
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```

---

## Deploy Note

**Deploy required** (frontend and worker both changed across D-128C through D-128E). Standard `wrangler deploy` after this PR and D-128F merge.

---

## Recommended Next Task

**D-128F** — Review UI structured fallback: update `reviewBuilderContextHtml()` in `public/app-v10.js` to prefer `item.claimBuilderContext` (structured, from D-128D API) over `parseClaimBuilderContext(item.initialEvidence)` (legacy D-127D parser), with a source label indicating which path rendered.
