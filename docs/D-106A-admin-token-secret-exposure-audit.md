# D-106A — Admin Token / Secret Exposure Audit

**Date:** 2026-06-10
**Mode:** Security audit only — no code changes, no token rotation, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 357 / belief-engine-static-check 24 / worker-route-static-check 48

> **Reporting rule honoured:** no full secret value is printed below. The only secret-*like* tracked value found is a non-credential D1 identifier, shown redacted.

---

## A. Files Read / Searched

| Scope | Method |
|---|---|
| All 283 tracked files | `git grep` for `api_key`, `secret`, `password`, `bearer`, `authorization`, `token`, `x-humanx-admin`, `CLOUDFLARE_*`, `WRANGLER_*`, `account_id`, `database_id`, `HUMANX_ADMIN_TOKEN` |
| `src/worker.js` | `requireAdmin`, all `requireAdmin(` callers, `/api/debug`, CORS headers, RunPack/AIP builders |
| `public/app-v10.js` | `adminToken`, `adminHeaders`, `LS_ADMIN`, `renderReview`, `saveAdminTokenAndLoadReview`, console logging |
| `public/index.html`, `public/styles.css` | admin token input, review token form |
| `wrangler.toml`, `package.json`, `scripts/*` | env var names, secret usage |
| `.gitignore` | **absent** (see B.2) |
| `docs/*` | `HUMANX_ADMIN_TOKEN` references (all placeholders) |

---

## B. Admin Auth Flow Map

```
FRONTEND (public/app-v10.js)
  LS_ADMIN = 'humanx_admin_token_v1'
  adminToken()        → localStorage.getItem(LS_ADMIN) || ''
  adminHeaders()      → { ...headers(), 'x-humanx-admin': adminToken() }
  renderReview()      → <input id="adminToken" value="${esc(token)}" autocomplete="off"> + Load/Clear buttons
  saveAdminTokenAndLoadReview() → localStorage.setItem(LS_ADMIN, value)
  → admin token is read from localStorage and sent as the x-humanx-admin header on admin calls

WORKER (src/worker.js)
  requireAdmin(request, env):
    const admin = request.headers.get('x-humanx-admin') || '';
    if (!admin || admin !== (env.HUMANX_ADMIN_TOKEN || '')) return json({ error:'ADMIN_REQUIRED' }, 403);
    return null;
  Admin-gated routes (all call requireAdmin):
    /api/seed, /api/import-seed, /api/import-truths,
    /api/review (reviewQueue), /api/review/decision, /api/review/cleanup,
    /api/review/mark-duplicate, /api/review/resolve-similar
  NOT gated: /api/debug  (see D.2)
```

Failed admin calls return a generic `403 {error:'ADMIN_REQUIRED'}` — no detail leak about why. ✅

---

## C. Secret Storage / Config Map

| Item | Location | Type | Exposure |
|---|---|---|---|
| `HUMANX_ADMIN_TOKEN` | Worker env (Cloudflare secret) | admin credential | **Name only** in code/docs — value never committed ✅ |
| D1 `database_id` | `wrangler.toml:10` → `f68…125` (redacted) | identifier (not a credential) | Committed; normal for wrangler.toml; not usable without account auth |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` / `D1_DATABASE_ID` | `scripts/backfill-normalized-content.mjs` | read from `process.env` | Not hardcoded — placeholders (`xxx`) in comments only ✅ |
| Admin token (runtime) | browser `localStorage` (`humanx_admin_token_v1`) | admin credential | Lives in admin's own browser; sent via header (see E) |

**No API keys, bearer strings, passwords, or token values are committed anywhere in the repo.** All references are names/placeholders.

---

## D. Findings (Ranked by Severity)

### D.1 — MEDIUM (hygiene/prevention): No `.gitignore` in the repo

There is **no `.gitignore` file**. If a developer creates `.dev.vars`, `.env`, `.env.local`, or a Wrangler secrets file locally (the standard way to hold `HUMANX_ADMIN_TOKEN` / Cloudflare creds for local runs), nothing prevents accidentally committing it. Currently no such file is tracked (✅), but the guard rail is missing. **This is the most actionable finding** — a prevention gap, cheap to fix.

### D.2 — MEDIUM (info disclosure): `/api/debug` is not admin-gated

`/api/debug` (GET) → `debugState` runs with **no `requireAdmin`**. It returns row counts for ~17 tables plus the latest 5 claims (`id, claim, status, review_state, created_at`). No secrets or tokens are exposed, but it discloses internal database shape/volume and recent content to any unauthenticated caller. Should be admin-gated or removed in production. (Listed in `LOW_RISK_UNLISTED` of the route static check, so it is intentionally un-inventoried — but "low public-abuse" ≠ "should be public".)

### D.3 — LOW (crypto hygiene): admin token compared with non-constant-time `!==`

`requireAdmin` uses `admin !== (env.HUMANX_ADMIN_TOKEN || '')` — a short-circuiting string compare, theoretically a timing side-channel. Practical risk over the network is very low (jitter dominates), but a constant-time compare is cheap defense-in-depth for a credential check.

**Fail-closed behavior is correct:** if `HUMANX_ADMIN_TOKEN` is unset, `(env...||'')` is `''`; a non-empty submitted token never equals `''`, and an empty token is rejected by `!admin`. So a missing env var **blocks all admin access** (never bypasses). ✅

### D.4 — LOW (browser risk): admin token in localStorage + rendered into input `value`

The token is stored in `localStorage` and re-rendered into the review form as `value="${esc(token)}"`. For a pseudonymous prototype with a single admin, localStorage is acceptable, and `esc()` + `autocomplete="off"` are applied. Residual risk: **any** future XSS in the HumanX origin could read `localStorage` and exfiltrate the token. The D-104B/D-104F source-link fixes removed the known XSS vector, which materially reduces this — but there is **no Content-Security-Policy** to limit exfiltration as a backstop. Proportionate for now; note for later.

### D.5 — LOW (identifier, not secret): D1 `database_id` committed in `wrangler.toml`

`database_id = "f68…125"` is committed. This is a resource identifier, not a credential — it cannot be used without separate Cloudflare account authentication. Standard practice for `wrangler.toml`. No action required; noted for completeness.

### D.6 — INFO (operational): admin token material appeared in earlier chats

Per the task context, admin-token material was present in prior chat sessions. The token itself is not in the repo, but chat exposure is an operational risk. **Recommendation: rotate `HUMANX_ADMIN_TOKEN`** as a follow-up (procedure in F.3). **Not rotated in this task.**

### Good / No-issue observations

- ✅ No committed token/key/password values anywhere.
- ✅ Admin routes cleanly separated behind `requireAdmin`; generic 403 on failure (no detail leak).
- ✅ No `console.log`/`console.error` of the token; no token in URL/query/hash.
- ✅ RunPack/AIP builders do not include `env` or the admin token (BACKEND_SMOKE_TEST_PLAN documents this expectation; code confirms packets are built from claim detail only).
- ✅ Backfill script reads Cloudflare creds from `process.env`, never hardcoded.
- ✅ CORS allow-headers are explicitly scoped to `content-type, x-humanx-user, x-humanx-admin`.

---

## E. Were Tracked Secret-Like Values Found? / Redaction

| Found | Value type | Redacted form | Verdict |
|---|---|---|---|
| `wrangler.toml` `database_id` | D1 resource identifier (not a credential) | `f68…125` | Not a secret; safe to keep |
| `HUMANX_ADMIN_TOKEN` | referenced by **name only** | n/a — no value present | ✅ no exposure |
| Cloudflare account/API token | `process.env` reads + `xxx` placeholders | n/a | ✅ no exposure |

**No full secret value was printed in this report.** No committed credential/token/key value was found.

---

## F. Recommended D-106B Patch / Follow-up

### F.1 — Docs-only / repo hygiene (RECOMMENDED, do first)
| ID | Change | Risk |
|---|---|---|
| H-1 | **Add a `.gitignore`** covering `.dev.vars`, `.dev.vars.*`, `.env`, `.env.*`, `*.local`, and any Wrangler secret files | Very low — additive |
| H-2 | Add a short **secret-setup note** (README or `docs/SECURITY.md`): `HUMANX_ADMIN_TOKEN` is a Cloudflare Worker secret (`wrangler secret put HUMANX_ADMIN_TOKEN`), never committed; document by name without value | Very low |

### F.2 — Code-only hardening (small Worker changes → branch + PR)
| ID | Change | Risk |
|---|---|---|
| C-1 | **Gate `/api/debug` behind `requireAdmin`** (or disable in production) | Low — one guard line; verify no public caller depends on it |
| C-2 | **Constant-time admin token compare** in `requireAdmin` (length-check + XOR/`timingSafeEqual`-style helper) while preserving the fail-closed empty-env behavior | Low — small helper |
| C-3 | *(Optional, larger)* add a baseline **Content-Security-Policy** header to limit XSS exfiltration of localStorage | Medium — needs testing against inline scripts/styles; defer |

### F.3 — Operational: admin token rotation procedure (do NOT run here)
1. Generate a new high-entropy token (e.g. 32+ random bytes, base64url) **locally/offline** — do not paste it into chat.
2. `npx wrangler secret put HUMANX_ADMIN_TOKEN` → paste the new value at the prompt (never on the command line / not in shell history).
3. Verify a Review-queue call works with the new token; confirm the old token now returns `403 ADMIN_REQUIRED`.
4. Update the admin's browser: open Review → paste new token → Load Queue (Clear Token first).
5. Record the rotation in a deployment-style doc **without the value**.

### F.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Full multi-user auth / sessions / OAuth | Disproportionate for a single-admin pseudonymous prototype |
| DN-2 | Moving the admin token to httpOnly cookies | Larger change; localStorage is acceptable given D-104 XSS fixes; revisit only if multi-admin |
| DN-3 | Printing/echoing the token anywhere for "debugging" | Never |

---

## G. Suggested Tests (if D-106B patches)

| # | Test |
|---|---|
| 1 | `requireAdmin` still gates all current admin routes (regression) |
| 2 | `/api/debug` now calls `requireAdmin` (or route removed) |
| 3 | Constant-time compare helper present and used by `requireAdmin`; missing-env still fail-closed |
| 4 | `.gitignore` exists and ignores `.dev.vars` / `.env*` |
| 5 | No token value committed (grep guard: `HUMANX_ADMIN_TOKEN\s*=` with a non-placeholder value fails the check) |
| 6 | RunPack/AIP output contains no `HUMANX_ADMIN_TOKEN` / env (existing expectation, lock it) |

---

## H. No Mutation Confirmation

> No code changes were made during this audit.
> No token rotation, no Wrangler, no D1, no backend/schema change, no admin/moderation action.
> No live data mutated. No full secret value was printed.

---

## I. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **357 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **48 passed, 0 failed (48 hard checks)** |
