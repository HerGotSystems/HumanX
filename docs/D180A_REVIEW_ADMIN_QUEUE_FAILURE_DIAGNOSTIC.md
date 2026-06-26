# D-180A — Review Admin Queue Failure Diagnostic

**Date:** 2026-06-26
**Local commit:** 837f442 (D-179A — Audit CSP readiness)
**Baseline:** 1358/24/57
**Type:** Diagnostic only. No source code changes. No patch in this task.

---

## Safety Constraints

- Admin token not printed, not echoed, not stored, not documented here.
- Owner token not touched.
- D-149H hold remains in effect.
- No route semantics changed.
- No migration applied in this task.

---

## Git State

| Check | Result |
|---|---|
| Local HEAD | 837f442 (D-179A) |
| origin/main | 837f442 |
| Local main | clean |
| D-179A pushed | Yes |
| Sync status | Up to date |

---

## Baseline Check Results

All three test suites pass at confirmed baseline 1358/24/57:
- `hardening-smoke-test.mjs` — 1358 passed, 0 failed
- `belief-engine-static-check.mjs` — all hard checks passed
- `worker-route-static-check.mjs` — all hard checks passed

No regressions introduced by D-177 through D-179 chains.

---

## Problem Statement

The live Review page at `https://humanx.rinkimirikata.com` accepts the admin token input but loading the queue produces:

> **Review unavailable**
> Unexpected server error.
> Check the admin token above, re-enter it if needed, then reload the queue.

---

## Frontend Review Request Path

**File:** `public/app-v10.js`, lines 55–56, 126, 300

### Admin token header assembly
```js
// line 55
function adminHeaders() {
  return { ...headers(), 'x-humanx-admin': adminToken() }
}
// headers() adds: content-type, x-humanx-user, x-humanx-owner-token
```

### Review queue load (line 126)
```js
async function loadReviewQueue() {
  const data = await api('/api/review', { headers: adminHeaders() });
  reviewQueue = { claims: data.claims||[], truths: data.truths||[], review: data.review||[], ... };
  return reviewQueue;
}
```

### `api()` helper (line 56)
```js
async function api(path, opts={}) {
  const r = await fetch(API+path, { ...opts, headers: { ...headers(), ...(opts.headers||{}) } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}
```

### Error rendering (line 300)
```js
catch(e) {
  document.getElementById('reviewList').innerHTML =
    `<div class="panel"><h3>Review unavailable</h3>
    <p class="small">${esc(e.message||e)}</p>
    <p class="small">Check the admin token above, re-enter it if needed, then reload the queue.</p>
    </div>`;
}
```

The footer "Check the admin token above…" is **always static** — it appears for both wrong-token 403 AND backend 500 errors. It does not indicate the cause.

---

## Backend Review Route Path

**File:** `src/worker.js`, lines 79, 839, 867

### Route dispatch (line 79)
```js
if (url.pathname === '/api/review' && request.method === 'GET')
  return await reviewQueue(request, env);
```

### Admin check (line 867)
```js
function requireAdmin(request, env) {
  const admin = request.headers.get('x-humanx-admin') || '';
  const expected = env.HUMANX_ADMIN_TOKEN || '';
  if (!expected || !safeEqual(admin, expected)) return json({ error:'ADMIN_REQUIRED' }, 403);
  return null;
}
```

### Global catch (lines 85–91, applied to all routes)
```js
} catch (err) {
  const message = String(err && err.message ? err.message : err);
  if (message.includes('MISSING_PSEUDONYMOUS_USER')) return json({ error:'UNAUTHORIZED', ... }, 401);
  if (message.includes('USER_SHADOW_BANNED'))         return json({ error:'UNAUTHORIZED', ... }, 403);
  if (message.includes('RATE_LIMITED'))               return json({ error:'RATE_LIMITED', ... }, 429);
  if (message.includes('RATE_LIMIT_UNAVAILABLE'))     return json({ error:'RATE_LIMIT_UNAVAILABLE', ... }, 503);
  return json({ error: 'INTERNAL_ERROR', message: 'Unexpected server error.' }, 500);
}
```

---

## A. Wrong Token Path Analysis

**Result: Wrong token cannot produce the observed message.**

| Token state | Backend response | `data.message` | `data.error` | Frontend throws | UI shows |
|---|---|---|---|---|---|
| Missing / wrong | 403 `{error:'ADMIN_REQUIRED'}` | undefined | `'ADMIN_REQUIRED'` | `new Error('ADMIN_REQUIRED')` | "ADMIN_REQUIRED" |
| `HUMANX_ADMIN_TOKEN` not bound in env | 403 (same, `!expected` → false) | undefined | `'ADMIN_REQUIRED'` | `new Error('ADMIN_REQUIRED')` | "ADMIN_REQUIRED" |
| Correct | null → DB queries run | — | — | — | — |

**The observed "Unexpected server error." message comes from `data.message` of a 500 response.** Wrong token produces "ADMIN_REQUIRED" in the UI, not "Unexpected server error." Therefore:

1. The admin token being entered is correct (admin check passes).
2. The 500 is caused by an unhandled exception AFTER `requireAdmin` returns null.

---

## B. Valid Token Path — Failure Analysis

### `reviewQueue()` structure (line 839)

Once `requireAdmin` returns null, the function runs four sequential D1 queries **without per-query try/catch**:

1. **Claims query** — complex: selects from `claims c LEFT JOIN users u` with two correlated subqueries into `truth_claim_links` and `reports`.
2. **Truths query** — selects from `truths t LEFT JOIN claims c` with a correlated subquery into `reports`.
3. **Evidence query** — selects from `evidence e LEFT JOIN claims c LEFT JOIN users u` with a subquery into `reports`.
4. **Pressure query** — selects from `pressure_points p LEFT JOIN claims c LEFT JOIN users u`.

Then calls `attachClaimBuilderContexts(env, claimRows, truthRows)` — but this is fully wrapped in try/catch (non-fatal: see `claim-builder-contexts.js` lines 67–71).

**Any exception from queries 1–4 propagates uncaught to the global catch → 500.**

### Column `c.archived_by_user` in Claims query

The claims query explicitly selects `c.archived_by_user`:

```sql
SELECT 'claim' AS target_type, c.id, c.user_id, c.claim, ...,
  c.status_locked, c.archived_by_user, c.created_at, c.updated_at, u.handle, ...
FROM claims c LEFT JOIN users u ON u.id=c.user_id ...
```

`archived_by_user` was added by **migration `0012_user_owned_archive_export.sql`**, which is explicitly marked:

> "Production apply is GATED — do NOT run this migration without explicit per-session approval."

**If migration 0012 was not applied to the production D1 database, `c.archived_by_user` does not exist → D1 throws "no such column: c.archived_by_user" → global catch → 500.**

This is the **primary hypothesis for the observed failure.**

### Other migration-gated columns in the review queries

| Column | Table | Added by migration | Migration gated? |
|---|---|---|---|
| `c.archived_by_user` | claims | 0012 | **Yes — GATED** |
| `c.status_locked` | claims | 0008 | Yes, but listed as applied in D-130B |
| `c.near_duplicate_of` | claims | 0006_add_near_duplicate_of | Yes |
| `p.review_state` | pressure_points | 0009 | Yes — GATED |
| `p.report_count` | pressure_points | 0009 | Yes — GATED |
| `p.updated_at` | pressure_points | 0009 | Yes — GATED |

If migration 0009 was not applied, the pressure query also fails. However, prior review queue functionality (D-130 chain) implies 0009 was applied. Migration 0012 is the most recent gated migration adding a claims column.

### Empty queue safety

An empty queue is safe — all four queries return 0 rows, not errors. The code handles this correctly with `results || []` guards. **Empty queue cannot cause a 500.**

### JSON parsing / malformed row safety

The code uses `data.claims||[]`, `.truths||[]`, `.review||[]` fallbacks. Individual row field accesses use null-safe chaining or `||` defaults. Malformed rows in DB would not throw.

---

## C. D-178B Header Impact

**D-178B does not cause and cannot cause the observed 500.**

D-178B added `cache-control: no-store` and `x-content-type-options: nosniff` to the `CORS` object. These are spread into all `json()` responses via `{ ...CORS }` in the response constructor. This:
- Does not mutate response body
- Does not affect D1 query execution
- Does not consume body streams
- Does not change route logic

The 500 error was present if it existed before D-178B and was not introduced by it. D-178D preflight only verified unauthenticated 403 — it did not load the queue with a valid token, so a pre-existing 500 on the valid-token path would not have been detected.

---

## D. D-176B Generic Error Hygiene Impact

**D-176B hides the actual error from the UI and from the user.**

Before D-176B, the error message from D1 (e.g., "no such column: c.archived_by_user") may have surfaced in the UI. After D-176B, all unhandled errors are converted to "Unexpected server error." at the global catch. The real error is now visible only via:
- **Cloudflare Worker logs** (`wrangler tail`)
- **Cloudflare dashboard Logs tab** for the Worker

This means `wrangler tail` is the definitive diagnostic tool to see the actual thrown message.

---

## Recommended Diagnostic Probes

### Probe 1 — Confirm D1 alive and admin token valid

Run from the project root PowerShell terminal. Checks `/api/debug` which does simple `COUNT(*)` queries on all tables — does NOT reference `archived_by_user`.

```powershell
$admin = Read-Host "Admin token"
$headers = @{ "x-humanx-admin" = $admin }
try {
  $r = Invoke-WebRequest `
    -Uri "https://humanx.rinkimirikata.com/api/debug" `
    -Method GET `
    -Headers $headers
  Write-Host "Status: $($r.StatusCode)"
  $body = $r.Content | ConvertFrom-Json
  Write-Host "ok: $($body.ok)"
  Write-Host "counts keys:" ($body.counts.PSObject.Properties.Name -join ", ")
} catch {
  Write-Host "HTTP error: $($_.Exception.Response.StatusCode.value__)"
  Write-Host "Body snippet: $($_.ErrorDetails.Message | Select-Object -First 200)"
} finally {
  Remove-Variable admin -ErrorAction SilentlyContinue
  Remove-Variable headers -ErrorAction SilentlyContinue
}
```

**Expected on correct token + D1 live:** `Status: 200`, `ok: True`, table names listed.
**Expected on wrong token:** `HTTP error: 403`.

If `/api/debug` returns 200, the admin token is correct and D1 is alive. The 500 on `/api/review` is then isolated to the review queue's SQL specifically.

### Probe 2 — Confirm review queue returns 500

```powershell
$admin = Read-Host "Admin token"
$headers = @{ "x-humanx-admin" = $admin }
try {
  $r = Invoke-WebRequest `
    -Uri "https://humanx.rinkimirikata.com/api/review" `
    -Method GET `
    -Headers $headers
  Write-Host "Status: $($r.StatusCode)"
  $body = $r.Content | ConvertFrom-Json
  Write-Host "Top-level keys:" ($body.PSObject.Properties.Name -join ", ")
} catch {
  Write-Host "HTTP error: $($_.Exception.Response.StatusCode.value__)"
  Write-Host "Error body: $($_.ErrorDetails.Message)"
} finally {
  Remove-Variable admin -ErrorAction SilentlyContinue
  Remove-Variable headers -ErrorAction SilentlyContinue
}
```

**Expected if primary hypothesis correct:** `HTTP error: 500`, `Error body: {"error":"INTERNAL_ERROR","message":"Unexpected server error."}`.

Do NOT paste output if it contains sensitive values. Only share the status code and top-level JSON keys.

### Probe 3 — wrangler tail (definitive — reveals actual D1 error message)

```powershell
npx wrangler tail
```

Then immediately trigger the review queue from the browser (enter token + click "Load Queue"). In the tail output, look for:
- Route: `GET /api/review`
- Exception message: likely "D1_ERROR" or "no such column: c.archived_by_user" or similar
- HTTP status: 500

Do NOT paste tail output if request headers (including `x-humanx-admin`) appear. Only share the exception name/message and HTTP status.

---

## Hypothesized Root Cause

**Primary hypothesis:** Migration `0012_user_owned_archive_export.sql` was not applied to the production D1 database.

The `reviewQueue()` function explicitly selects `c.archived_by_user` in its claims query. This column was added by migration 0012 and that migration is marked as gated. If it was not applied, D1 throws "no such column: c.archived_by_user" → uncaught → global catch → 500 with "Unexpected server error."

**Secondary hypothesis:** Another migration-gated column is missing from production schema (e.g., 0008 `status_locked` on claims, if not yet applied).

**Tertiary hypothesis:** D1 is temporarily experiencing issues unrelated to schema (would also affect `/api/debug`).

---

## What Is Not Suspected

- **CSP (D-179A):** Audit-only, no code changes. Cannot cause backend 500.
- **Cache-Control / nosniff headers (D-178B):** Header-only patch, does not affect D1 query execution.
- **Admin token incorrectness:** Would produce "ADMIN_REQUIRED" in UI, not "Unexpected server error."
- **Frontend JS:** `loadReviewQueue()` correctly calls GET `/api/review` with `x-humanx-admin` header. No frontend bug.
- **CORS:** Would cause a different failure mode (network error, not 500 JSON body).

---

## Recommended Next Action

1. Run **Probe 1** (`/api/debug`) to confirm the admin token is accepted and D1 is alive.
2. Run **Probe 2** (`/api/review`) to confirm the 500 and capture the error body.
3. If both confirm the hypothesis, run **`wrangler tail`** + trigger review queue to capture the actual D1 error message.
4. If the error is "no such column: c.archived_by_user" or similar, the fix is to apply migration 0012 to production D1 — **this requires explicit approval and PRAGMA preflight per the migration's own safety gate**.
5. Once migration is applied, re-test the review queue.

**Do not apply migration 0012 without explicit confirmation from the owner.** The migration file itself requires explicit per-session approval.

---

## What D-180A Does Not Claim

- Does not claim live verification of the root cause — that requires wrangler tail.
- Does not claim migration 0012 is definitely missing — that requires PRAGMA table_info(claims) in D1.
- Does not claim the admin token is correct — that requires Probe 1.
- Does not contain admin token, owner token, secrets, or raw request headers with token values.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement added or changed.
