# HumanX Operational Status

Last updated after PR #13 and live QA pass.

---

## App entrypoints

| File | Role |
|------|------|
| `public/index.html` | Main app shell. Nav, layout, loads `app-v10.js`. This is the deployed static root. |
| `public/app-v10.js` | All frontend logic — rendering, API calls, state, RunPack, Study, Drift, Vault, Truths, Review. |
| `public/styles.css` | Single minified stylesheet for the main app. |
| `public/apps/humanx-belief-engine/index.html` | Standalone Belief Engine (77-statement profile). Self-contained. Sends snapshots to HumanX via `humanx-bridge.js`. |

The root `index.html` is a legacy placeholder that redirects to `public/index.html`.
It is never served in production (Cloudflare Pages serves `public/` as the static root).

---

## Backend deployment facts

| Setting | Value |
|---------|-------|
| Cloudflare Worker entry | `src/worker.js` |
| Assets directory | `./public` |
| D1 binding | `DB` |
| Database name | `humanx` |
| Database ID | `f68709d8-b93a-4e5b-8a0e-5b58cc357125` |

Configured in `wrangler.toml`. Do not change the database ID.

---

## Backend hardening — confirmed done

All of the following were applied, tested, and merged before PR #13:

- **Fail-closed rate limiting** on all public write endpoints.
  DB failure throws `RATE_LIMIT_UNAVAILABLE`, never silently passes.
- **`voteClaim` rate-limited** at 120 requests/hour per user-per-IP.
- **Public write endpoints audited**: `createClaim`, `addEvidence`, `addPressure`,
  `addHomeTest`, `reportTarget`, `createTruth`, `convertTruthToClaim`,
  `attachEvidenceToClaim`, `addAnalysisResult`, `saveBeliefSnapshot`,
  `promoteBeliefSnapshot`.
- **Duplicate-race handling** for unique index conflicts on:
  - `truths.normalized_statement`
  - `claims.normalized_claim`
  - Applied in: `src/truths.js`, `src/worker.js`, `src/truth-claim-bridge.js`,
    `src/belief-bridge.js`.
- **`attachEvidenceToClaim`** fixed to return actual DB link id after
  `INSERT OR IGNORE`, not a generated id.
- **D1 duplicate content cleanup** completed before migration 0004.
- **Migration 0004** (`migrations/0004_unique_normalized_content.sql`) applied
  and verified on production D1.

### ⚠ Do not rerun migration 0004

Migration 0004 adds unique indexes. Running it again on a database where it
has already been applied will fail. Do not run it unless explicitly instructed
after confirming it has not been applied.

### ⚠ Do not run D1 or Wrangler commands

Do not execute `wrangler d1 execute`, `wrangler deploy`, or any D1 mutation
unless the user explicitly requests it in a task.

---

## Live QA pass checklist

Verified after PR #13 merge:

- [x] Home loads — pipeline banner, hero copy, home tiles
- [x] Beliefs nav tab opens Belief Engine (`/apps/humanx-belief-engine/`)
- [x] Claims loads — card grid, empty state copy
- [x] Study Claim opens — Lineage, Claim Flow, Evidence, Pressure, Tests, Analysis sections
- [x] Evidence Vault loads — badge, empty state, Attach button
- [x] Truths loads — form, cards, Convert to Claim button
- [x] RunPack opens — Generate RunPack / Copy RunPack / Download JSON buttons
- [x] Review page shows admin token input, moderation explanation, `admin only` badge
- [x] Submit Claim shows review confirmation panel after successful submission
- [x] Mobile layout passes — pipeline banner wraps at 600px, arrows hidden

---

## Recommended next safe work

Listed in rough priority order. Each should be a separate branch and small commit.

1. **Manual frontend smoke checklist** (`docs/FRONTEND_SMOKE_CHECKLIST.md`) —
   a human-runnable QA checklist for every view, so regressions are caught
   without a full agent audit.

2. **Frontend-only polish** — any remaining copy, empty state, or badge
   improvements that do not touch backend or routes.

3. **Tests before Belief Engine scoring changes** — see
   `docs/BELIEF_ENGINE_SCORING_NOTES.md`. Contradiction logic and `CHOICE_SCALE`
   are fragile. Write fixtures and smoke tests before touching either.

4. **Plan `worker.js` modular split before implementing it** — `src/worker.js`
   is large but functional. Produce a written plan (`docs/WORKER_SPLIT_PLAN.md`)
   and review it before writing any code. Do not refactor worker routing
   speculatively.

---

## Current working rules

These apply to all tasks in this repo until explicitly changed:

- Keep tasks small and focused.
- One new branch per task.
- Show diff before committing.
- Stop after commit. Do not push.
- The user pushes and merges manually.
- No Co-Authored-By trailers on commits.
- No D1 / Wrangler commands unless explicitly requested.
- No broad refactors.
