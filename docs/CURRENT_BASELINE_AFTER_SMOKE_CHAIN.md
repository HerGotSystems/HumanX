# Current Baseline After Smoke Chain

## 1. Purpose

This document records the current known-good HumanX baseline after completing the full
smoke-test chain: live read endpoint smoke, write dry-run, live write smoke, and manual
cleanup of the resulting smoke-test claim. It is the consolidated status reference for
starting any new work from this point.

---

## 2. Current Known-Good Status

| Area | Status |
|---|---|
| Live frontend QA | Passed on desktop and phone |
| Read endpoint smoke | **15 passed, 0 failed, 0 skipped** — see `docs/LIVE_READ_SMOKE_RESULT.md` |
| Write smoke dry-run | Passed safely — no network requests made — see `docs/WRITE_SMOKE_DRY_RUN_RESULT.md` |
| Live write smoke | **4 passed, 0 failed** — see `docs/LIVE_WRITE_SMOKE_RESULT.md` |
| Smoke claim created | `clm_54be6272abbc49d282` landed in `reviewState: 'review'` (not public) |
| Smoke claim cleanup | Completed manually through HumanX Review/admin UI |
| Final smoke claim state | **Rejected** — confirmed by user via Review UI |
| Smoke claim approval | Not approved at any point |

---

## 3. Active App / Deployment Facts

| Setting | Value |
|---|---|
| Main app shell | `public/index.html` |
| Frontend logic | `public/app-v10.js` |
| Stylesheet | `public/styles.css` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` |
| Worker entrypoint | `src/worker.js` |
| Assets directory | `./public` |
| D1 binding | `DB` |
| Database name | `humanx` |
| Database ID | `f68709d8-b93a-4e5b-8a0e-5b58cc357125` |

Configured in `wrangler.toml`. Do not change the database ID.

---

## 4. Smoke-Test Proof Files

| File | What it records |
|---|---|
| `docs/LIVE_READ_SMOKE_RESULT.md` | Full result of the live read endpoint smoke test |
| `docs/WRITE_SMOKE_DRY_RUN_RESULT.md` | Confirmed dry-run behaviour of the write smoke script |
| `docs/LIVE_WRITE_SMOKE_RESULT.md` | Full result of the live write smoke test |
| `docs/SMOKE_CLAIM_CLEANUP_RESULT.md` | Manual rejection of the smoke-test claim via Review UI |
| `scripts/read-endpoint-smoke-test.mjs` | Read-only smoke script (safe to run at any time) |
| `scripts/write-endpoint-smoke-test.mjs` | Write smoke script (dry-run default; live run requires explicit approval) |

---

## 5. Safe Next Work

These are appropriate next steps from this baseline, in rough priority order:

- **Frontend-only polish** — copy, empty states, badge improvements that do not touch
  backend routes or response shapes. Low risk; no smoke re-run required unless routes
  are affected.
- **Manual QA checklist after any frontend change** — run `docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md`
  in a browser before deploying any Worker or frontend change.
- **Read endpoint smoke after any backend change** — run
  `node scripts/read-endpoint-smoke-test.mjs https://humanx.rinkimirikata.com` to
  confirm the read baseline is intact. Compare against `docs/LIVE_READ_SMOKE_RESULT.md`.
- **Tests before changing Belief Engine scoring** — see `docs/BELIEF_ENGINE_SCORING_NOTES.md`
  and `docs/BELIEF_ENGINE_TEST_PLAN.md` before touching any scoring logic, contradiction
  rule, or `CHOICE_SCALE` value.
- **Plan-only work before Worker modular split** — produce a written plan and review it
  before writing any code. See `docs/WORKER_MODULAR_SPLIT_PLAN.md`. Do not refactor
  Worker routing speculatively.

---

## 6. Do-Not-Touch Warnings

- **Do not rerun migration 0004.** `migrations/0004_unique_normalized_content.sql` is
  already applied to production D1. Running it again will fail.
- **Do not run Wrangler or D1 commands** (`wrangler d1 execute`, `wrangler deploy`, or
  any variant) unless the user explicitly requests them in the current task.
- **Do not change `src/worker.js`** without having smoke-test or hardening-test proof
  in place. Run `node scripts/hardening-smoke-test.mjs` before and after any Worker
  change.
- **Do not change public write endpoints** without reading
  `docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md` first.
- **Do not run live write smoke tests** unless the user explicitly approves the run in
  the current task. Approval in a prior session does not carry forward.
- **Do not approve smoke-test claims.** Approval promotes a claim to `reviewState: 'public'`
  and makes it visible to all users. Smoke claims must always be rejected or deleted.
- **Do not change response shapes** used by `public/app-v10.js` casually — shape
  changes break the frontend silently. Check `docs/API_ENDPOINT_INVENTORY.md` before
  modifying any response.

---

## 7. Recommended Next Implementation Step

The next real implementation step should be small and non-invasive: either frontend
polish (copy, layout, empty states) or adding non-mutating unit or integration tests
for existing logic.

Worker modular split should remain plan-only until more backend tests exist. The
current `docs/WORKER_MODULAR_SPLIT_PLAN.md` documents the required proof before any
implementation begins — that proof is not yet complete.
