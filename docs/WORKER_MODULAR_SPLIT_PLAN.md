# Worker Modular Split Plan

## 1. Purpose

This document is a controlled plan for splitting `src/worker.js` into smaller modules at a future point, without changing any behaviour first. No implementation work should begin based on this document alone. The plan exists to ensure that when the split does happen, it is deliberate, safe, and reversible.

`src/worker.js` is currently the active Cloudflare Worker entrypoint and must remain fully deployable at every stage of any future refactor.

---

## 2. Current Known Facts

- **Worker entrypoint:** `src/worker.js`
- **Assets directory:** `./public`
- **D1 binding:** `DB`
- **Database name:** `humanx`
- **D1 migration 0004** has already been applied and must not be rerun
- **Active frontend files:** `public/index.html`, `public/app-v10.js`, `public/styles.css`
- **Operational baseline** is documented in `docs/OPERATIONAL_STATUS.md`
- **Manual frontend QA** is documented in `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`

---

## 3. Why Split worker.js Later

The current `src/worker.js` handles all routing, middleware, database access, rate limiting, AI analysis, and response shaping in a single file. Splitting it into smaller modules would provide:

- **Easier review** — smaller files with a single responsibility are quicker to read and reason about
- **Smaller changes** — PRs that touch one module do not risk unintended side-effects in unrelated routes
- **Easier endpoint testing** — individual route handlers can be unit-tested in isolation
- **Lower risk when changing public write endpoints** — changes are scoped to one file rather than a large monolith
- **Better separation of concerns** across:
  - AI analysis
  - Claims
  - Truths
  - Evidence
  - Review and admin
  - Rate limiting
  - Shared helpers

---

## 4. Non-Goals

The following are explicitly out of scope for the first modular split:

- Do not change API behaviour during the first split
- Do not rename any public endpoints
- Do not change the D1 schema
- Do not rerun any migrations
- Do not change frontend routes
- Do not move the Belief Engine yet
- Do not introduce a framework (no Hono, itty-router, or similar)

---

## 5. Proposed Future Module Layout

The following is a proposal only. It may change before implementation begins.

```
src/worker.js              ← entrypoint, remains deployable at all times
src/lib/http.js            ← shared response helpers (json, error, cors)
src/lib/rate-limit.js      ← rate limiting logic extracted as pure functions
src/lib/normalize.js       ← input normalisation helpers
src/lib/d1.js              ← shared D1 query helpers
src/routes/health.js       ← GET /health
src/routes/session.js      ← session token handling
src/routes/claims.js       ← claim submission and retrieval
src/routes/truths.js       ← truth submission and retrieval
src/routes/evidence.js     ← evidence submission and retrieval
src/routes/beliefs.js      ← Belief Engine bridge
src/routes/review.js       ← admin review and moderation
src/routes/ai.js           ← AI analysis endpoint
src/routes/runpack.js      ← RunPack endpoint
```

`src/worker.js` would remain the single entrypoint that imports from these modules. No consumer of the API would observe any change.

---

## 6. Safe Migration Sequence

Steps must be followed in order. Do not skip steps.

1. Add tests and smoke checks that document current worker behaviour and response shapes.
2. Extract pure helper functions only (no route logic, no D1 calls, no side effects).
3. Keep `src/worker.js` as the sole entrypoint at all times.
4. Re-export and import helpers without changing any route responses.
5. Test health, claims, submit, evidence, truths, review, RunPack, and Belief bridge after each extraction.
6. Only then split route handlers, one group at a time.
7. After each group is split, run the manual frontend smoke checklist in full.
8. Stop immediately if any behaviour difference is detected.

---

## 7. Highest-Risk Areas

The following areas require extra caution during any future split:

- **Rate limiting fail-closed logic** — must never silently pass requests that should be blocked
- **Public write endpoints** — any shape change will break `app-v10.js`
- **Duplicate handling for claims, truths, and bridges** — unique-index logic must not change
- **Admin review token handling** — must remain consistent and secure
- **AI analysis endpoint** — response shape is consumed directly by the frontend
- **Belief Engine save bridge** — timing and error handling are load-bearing
- **D1 unique-index assumptions** — any reordering of inserts may trigger unexpected constraint errors
- **Any response shape used by `app-v10.js`** — the frontend has no version negotiation; shape changes are breaking

---

## 8. Required Proof Before Implementation

Before any implementation PR is opened, the following must be confirmed:

- Document the current full endpoint list with methods, paths, and expected response shapes
- Add backend smoke test coverage if practical
- Confirm no migration is needed for the split
- Confirm no frontend route changes are required
- Confirm that deployment still points to `src/worker.js` as the entrypoint

---

## 9. Recommended First Implementation PR When Ready

The first implementation PR should only extract shared pure helpers into `src/lib/` and prove no behaviour change. No route handlers should move in the first PR. The PR must include evidence (test output or smoke checklist) that all endpoints respond identically before and after.

---

## 10. Stop Conditions

Work must stop immediately if any of the following occur:

- Any changed API response shape is detected
- Any frontend change is required to make the refactor work
- Any migration is requested or found to be necessary
- Any Wrangler or D1 command is requested as part of the refactor
- Any uncertainty arises about the current behaviour of a route or helper

If a stop condition is hit, revert to the last known-good state and document what was found before continuing.
