# D-127D Review Builder Context Visibility

**Date:** 2026-06-14
**Branch:** `fix/d127d-review-builder-context-visibility`
**Basis:** D-127C Builder Truth Route Save (PR #174, merge `e2872ed`).

---

## Purpose

D-127B packed Claim Builder submission context into `initialEvidence` as plain text:

```
Claim Builder context:
Original user text: ...
Why user thinks this: ...
Scope: ...
Pressure/falsifier: ...
System flags: ...
```

Without this task, moderators reviewing builder-submitted claims would see that context buried inside a raw evidence block with no visual separation. D-127D surfaces it as a structured panel inside the Review inspect view so moderators have full context for their decision.

---

## Scope

Frontend-only. No backend changes, no schema changes, no D1 queries, no Wrangler, no deploy.

---

## Files Changed

| File | Change |
|---|---|
| `public/app-v10.js` | `parseClaimBuilderContext()` and `reviewBuilderContextHtml()` added; `renderReviewInspectPanel()` wired to show builder context panel |
| `public/styles.css` | 6 new rules for `.review-builder-context` and related elements |
| `docs/D127D_REVIEW_BUILDER_CONTEXT_VISIBILITY.md` | This file |
| `docs/README.md` | Updated current status pointer |

No changes to: `src/worker.js`, `src/truths.js`, D1 schema, migrations, Belief Engine SPA, bridge payload, Review backend endpoints, RunPack backend, public claim/truth pages.

---

## What Changed

### `parseClaimBuilderContext(text)`

Parses the plain-text builder context block from `initialEvidence`. Returns `null` if the sentinel `'Claim Builder context:'` is not present. Returns `{original, why, scope, falsifier, flags}` otherwise.

Handles missing fields gracefully — any field not present in the text is returned as an empty string. Returns `null` if all fields are empty (i.e. sentinel present but no parseable content).

### `reviewBuilderContextHtml(item)`

Renders a styled panel. Tries `item.initialEvidence`, `item.initial_evidence`, `item.body`, and `item.note` in order (to cover both camelCase and snake_case field names that different Review queue shapes may expose). Returns `''` if no builder context found.

Rendered rows (only when non-empty):
- ORIGINAL USER TEXT
- WHY USER THINKS THIS
- SCOPE
- PRESSURE / FALSIFIER
- SYSTEM FLAGS (rendered as `b-yellow` badges per flag code)

### `renderReviewInspectPanel()` — builder context injection

The panel output now includes `${reviewBuilderContextHtml(item)}` between the quality hints block and the bottom decision action buttons. This placement is:
- After the structured field grid (ID, type, state, claim details)
- After quality hints (if any)
- Before Approve / Keep Pending / Reject controls
- Review-only: not called from any public claim or truth rendering path

### CSS

6 new rules under `/* ── D-127D REVIEW BUILDER CONTEXT ── */`:

```css
.review-builder-context  — blue-tinted box, 12px radius
.review-builder-head     — badge + label row, flex, 8px gap
.review-builder-row      — field row with top border separator
.review-builder-row b    — 9px uppercase label in --blue
.review-builder-row p    — 11px field value, #c8d0e0
.review-builder-flags    — flex wrap for flag badge chips
```

---

## Review-only display

`reviewBuilderContextHtml()` is called only from `renderReviewInspectPanel()`. It is not used in:
- Public Claims list or claim detail
- Public Truths list
- Evidence Vault
- Study view
- RunPack

---

## Limitations (interim bridge)

- **Parser depends on D-127B label strings.** If labels change in a future builder iteration, the parser will silently miss fields. Label constants are not yet centralised.
- **Plain-text channel.** Context lives in `initialEvidence`/`body` — shared with other evidence text. A dedicated `claim_builder_context` JSON column would be more robust but requires a schema change deferred to D-127E+.
- **Truth submissions.** `submitBuilderTruth()` (D-127C) posts `_bs.raw` to `/api/truths` — no builder context block is packed into that payload. Truth-route Review cards will not show a builder context panel.
- **Public pages unchanged.** Builder context is not shown on public claim detail pages yet. That is a future consideration once the structured persistence design is settled.

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

**D-127E** — owner smoke / deploy checkpoint for D-126B + D-127B + D-127C + D-127D, or structured builder persistence design (dedicated `claim_builder_context` column), depending on whether a deploy has been authorised.
