# D-106B — Admin Secret Hygiene & Debug Route Hardening

**Date:** 2026-06-10
**Scope:** Security patch — `.gitignore` (new), `src/worker.js`, static coverage, docs. No Wrangler, no D1, no deploy, no token rotation.
**Static baseline:** 357 / 24 / 48 → **362 / 24 / 56**
**Audit basis:** D-106A admin token / secret exposure audit

---

## What Changed

### 1. `.gitignore` added (D-106A finding D.1)

The repo previously had **no `.gitignore`** — nothing prevented accidentally committing a local secrets/env file. Added a root `.gitignore` covering:

- Secrets / local env: `.dev.vars`, `.dev.vars.*`, `.env`, `.env.*` (with `!.env.example`), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `secrets/`
- Cloudflare/Wrangler: `.wrangler/`
- Build/deps/coverage: `node_modules/`, `dist/`, `coverage/`
- OS/editor junk: `.DS_Store`, `Thumbs.db`, `*.swp`, `*~`, `.idea/`, `.vscode/`

Does **not** ignore `docs/`, `public/`, `src/`, or `scripts/`. `.gitignore` only affects untracked files, so nothing currently tracked is removed.

### 2. `/api/debug` admin-gated (D-106A finding D.2)

`/api/debug` (GET → `debugState`) was reachable unauthenticated and disclosed table counts + latest 5 claims. It now requires admin auth:

```js
if (url.pathname === '/api/debug' && request.method === 'GET') {
  const adminError = requireAdmin(request, env);
  if (adminError) return adminError;
  return debugState(request, env);
}
```

- Endpoint not removed; response shape unchanged for an authenticated admin.
- Unauthorized callers get the standard `403 {error:'ADMIN_REQUIRED'}` (no token echoed in response/errors/logs).

### 3. Timing-safe-ish admin comparison (D-106A finding D.3)

Added a dependency-free `safeEqual` and switched `requireAdmin` to use it, preserving fail-closed behavior:

```js
function safeEqual(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  if (!x.length || !y.length) return false;
  const n = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < n; i++) { diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0); }
  return diff === 0;
}
function requireAdmin(request, env) {
  const admin = request.headers.get('x-humanx-admin') || '';
  const expected = env.HUMANX_ADMIN_TOKEN || '';
  if (!expected || !safeEqual(admin, expected)) return json({ error: 'ADMIN_REQUIRED' }, 403);
  return null;
}
```

- No Node `crypto` dependency (Workers-safe); no external packages.
- Does not throw on missing/empty/mismatched token — returns 403.
- **Fail-closed preserved:** if `HUMANX_ADMIN_TOKEN` is unset, `expected=''` → `!expected` short-circuits to 403, so a missing env var blocks *all* admin access (never bypasses). Verified: missing-env→403, wrong-token→403, empty-token→403, exact-match→pass.
- The raw `admin !== (env.HUMANX_ADMIN_TOKEN || '')` comparison is fully removed.

> Note: `safeEqual` is "timing-safe-ish" — it does not early-return on content, but the loop bound reveals the longer length. For an over-the-network credential check this is adequate defense-in-depth without adding dependencies; a perfectly constant-time compare is not warranted here.

---

## No Secret Values Committed

Confirmed: no token/key/password literal is committed. `HUMANX_ADMIN_TOKEN` appears only by name (placeholders) in code and docs. A static guard now fails if any literal value is ever assigned to it (`HUMANX_ADMIN_TOKEN = "…"`).

---

## Token Rotation Procedure (NOT performed in this task)

Rotation is **operational** and was **not done here** (no Wrangler, no secret material handled). Recommended steps for the operator, to be run locally:

1. **Do not paste the token into chat or any commit.**
2. Generate a new high-entropy value locally/offline (e.g. 32+ random bytes, base64url).
3. `npx wrangler secret put HUMANX_ADMIN_TOKEN` → paste the new value at the interactive prompt (never on the command line / shell history).
4. Deploy if needed and verify: a Review-queue call works with the new token; the old token now returns `403 ADMIN_REQUIRED`.
5. In the admin's browser: open Review → **Clear Token** → paste the new token → **Load Queue**.
6. Never store the token in the repo or docs; record only that a rotation occurred, without the value.

**Rotation status for D-106B: NOT performed.** Recommended as a follow-up because token material appeared in earlier chat sessions (D-106A finding D.6).

---

## Tests

### `worker-route-static-check.mjs` (48 → 56 hard checks)
- `.gitignore` exists and ignores `.dev.vars` and `.env`/`.env.*`
- `/api/debug` requires `requireAdmin` before `debugState`
- `debugState` response shape (counts) preserved
- `safeEqual` helper defined
- `requireAdmin` uses `safeEqual`
- no raw `admin !== env.HUMANX_ADMIN_TOKEN` comparison remains
- `requireAdmin` fail-closes on missing env token (`!expected`)
- no `HUMANX_ADMIN_TOKEN` value literal in `src/worker.js`

### `hardening-smoke-test.mjs` (357 → 362) — Section 48
- `.gitignore` ignores local env/secret files
- `/api/debug` admin-gated
- `requireAdmin` uses `safeEqual`; no raw equality remains
- `requireAdmin` fail-closed on missing env token
- no `HUMANX_ADMIN_TOKEN` literal committed

Both README count assertions extended (hardening → 362; worker-route → 56).

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 357 passed, 0 failed | **362 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 48 passed | **56 passed** |

---

## Safety Confirmation

| Check | Status |
|---|---|
| No token rotation performed | ✅ (recommended as operator follow-up) |
| No secret value committed | ✅ — name/placeholders only; static guard added |
| No deploy | ✅ |
| No D1 / migration / schema change | ✅ |
| No live write / database mutation | ✅ |
| No admin/moderation action | ✅ |
| Admin auth not weakened | ✅ — fail-closed preserved, raw equality removed |
