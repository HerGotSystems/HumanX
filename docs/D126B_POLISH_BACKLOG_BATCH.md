# D-126B Polish Backlog Batch

**Date:** 2026-06-14
**Branch:** `fix/d126b-polish-backlog-batch`
**Basis:** D-126A beta product checkpoint. Clears six low-priority backlog items (B1–B6).
**Hard rules:** No deploy. No Wrangler. No D1 query. No production writes. No admin token. No schema, scoring, Belief Engine questions, bridge payload, review/admin permission model, or public write guardrail changes.

---

## Changes

### B1 — Rate-limit toast: no retry window (FIXED)

**File:** `public/app-v10.js` — `saveClaim()` catch block
**Before:** `toast(e.message||'Claim submission failed.')`
Worker sends `RATE_LIMITED` as the error message; toast showed the raw code.
**After:** Error code intercepted in catch and translated:
```
RATE_LIMITED → 'Too many submissions. Try again in about an hour.'
```
The actual rate limit (8 claims/IP/hour, enforced in worker `safeRateLimit()`) is unchanged.

---

### B2 — `CLAIM_TOO_SHORT` raw toast (FIXED)

**File:** `public/app-v10.js` — same `saveClaim()` catch block as B1
**Before:** `CLAIM_TOO_SHORT` surfaced as a raw error code string in the toast.
**After:** Intercepted alongside B1:
```
CLAIM_TOO_SHORT → 'Claim is too short. Add a little more detail before submitting.'
```
Validation logic in worker is unchanged.

---

### B3 — Nav tab label mismatch: "Beliefs" → "Belief Engine" (FIXED)

**File:** `public/index.html` — `<nav class="tabs">` `tab-belief` button
**Before:** `>Beliefs</button>`
**After:** `>Belief Engine</button>`

The `tab-belief` id, `onclick="location.href='/apps/humanx-belief-engine/'"` route, and all JS references to `tab-belief` are unchanged. Only the visible label is updated. Consistent with the home card label ("Belief Engine"), the Drift sidebar copy ("Open Belief Engine"), and the standalone SPA branding.

---

### B4 — Review tab: no admin hint until after entering token (FIXED)

**File:** `public/app-v10.js` — `renderReview()` no-token empty state
**Before:** `'Enter admin token to load the queue.'`
**After:** `'Review is owner-only. Enter the admin token to load the queue.'`

The gate behaviour is unchanged (no API call made without a token; server-side `requireAdmin()` still enforces independently). Only the visible hint is extended to clarify that this tab is not for general users.

---

### B5 — Evidence Vault source-label density (DEFERRED)

Not patched. The vault groups evidence cards by linked claim via `vaultGroupsHtml()`, and the source link is rendered per-card via `sourceLink()`. Making the per-card source display conditional (suppress if same as previous in the group) would require changing iteration logic in `vaultGroupsHtml()` — outside the safe scope of this copy-only polish batch. Deferred to a future UI pass.

---

### B6 — D-125A doc typo: `/api/health` → `/api/graph-status` (FIXED)

**File:** `docs/D125A_OWNER_TESTER_HARDENING_PLAN.md` — checklist row 5g
**Before:** `| 5g | Try navigating to \`/api/health\` | Does it return \`ok: true, mode: d1-live\`? |`
**After:** `| 5g | Try navigating to \`/api/graph-status\` | Does it return a graph object with claim, truth, and evidence counts? |`

The actual public endpoint is `/api/graph-status` (returns `{graph:{claims,truths,evidence}}`). No code change — docs only.

---

## What Was Intentionally Not Changed

| Area | Reason |
|---|---|
| Worker rate-limit enforcement | `safeRateLimit()` — no change; only toast copy updated |
| Worker `CLAIM_TOO_SHORT` validation | Only toast translation added in catch; server logic untouched |
| `tab-belief` id and route | Only visible label changed; JS event wiring unchanged |
| Review gate behaviour | `requireAdmin()` on server unchanged; no API call made without token |
| Evidence grouping logic | B5 deferred — logic change outside safe scope |
| D1 schema, scoring, Belief Engine questions | No change |
| Bridge payload | No change |
| Public write guardrails | No change |

---

## Checks

```
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
```

---

## Deploy Note

**Deploy required.** `public/app-v10.js` and `public/index.html` are modified (B1–B4). Changes are frontend-only — no worker or D1 changes. A standard `wrangler deploy` from main after this PR merges will push the updated static assets.

---

## Recommended Next Task

**D-126C — Product onboarding / guided first-run path.**

The polish batch (D-126B) removes the known friction items a new user would hit immediately. The next gap is orientation: a visitor who doesn't already know the product has no guided entry point explaining what HumanX is, what a claim is, or where to start. D-126C addresses that before any external tester is invited.
