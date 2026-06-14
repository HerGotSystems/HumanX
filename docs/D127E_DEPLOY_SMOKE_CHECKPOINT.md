# D-127E Deploy and Owner Smoke Checkpoint

**Date:** 2026-06-14
**Branch:** `main` (no feature branch — checkpoint/deploy task)
**HEAD at checkpoint:** `6ec6fae82a3c4457f4bb9783a0fc17e3a0f79398`
**Merge commit covers:** D-126B → D-127A → D-127B → D-127C → D-127D

---

## Release Contents

This deploy bundles:

| Task | Change |
|---|---|
| **D-126B** | Friendlier RATE_LIMITED and CLAIM_TOO_SHORT toasts; nav label "Beliefs" → "Belief Engine"; Review hint "owner-only"; D-125A doc typo fix |
| **D-127B** | Claim Builder 3-step flow (Raw Thought → Make It Testable → Final Claim); 11-pattern flag engine; builder context packed into `initialEvidence`; `submitBuilderClaim()` posts to `/api/claims` |
| **D-127C** | Truth route save — `submitBuilderTruth()` posts `_bs.raw` to `/api/truths`; Review-first; Step 2 and Step 3 route-aware |
| **D-127D** | Review inspect panel parses and displays builder context (ORIGINAL USER TEXT, WHY USER THINKS THIS, SCOPE, PRESSURE/FALSIFIER, SYSTEM FLAGS); Review-only display |

No backend, D1 schema, or migration changes across D-126B through D-127D.

---

## Pre-deploy Checks (HEAD `6ec6fae`)

```
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node scripts/worker-route-static-check.mjs    →  56 passed, 0 failed
```

All checks passed clean. Working tree clean, branch up to date with `origin/main`.

---

## Deploy Attempt

`npx wrangler deploy` failed with:

```
ERROR fetch failed
WARNING: Wrangler detected that a corporate proxy or VPN might be enabled.
```

This is a network/connectivity blocker in the current environment — not a code issue. The same constraint was present in prior deploy attempts.

**The owner must run the deploy manually** from a terminal with direct Cloudflare API access (no VPN proxy blocking `api.cloudflare.com`).

### Owner manual deploy command

```sh
cd /path/to/HumanX
git checkout main
git pull --ff-only origin main
# Confirm HEAD is 6ec6fae or later
npx wrangler deploy
```

`CLOUDFLARE_API_TOKEN` must be set in the environment (or Wrangler must be authenticated via `wrangler login`) before running.

---

## Post-deploy Worker Version

*(Owner: fill in after deploy)*

```
Deployed Worker version: ________________________________
```

---

## Owner Smoke Checklist

Run in a normal browser window after deploy. Check each item. Fill in PASS / FAIL / NOTE.

### A. Site loads

| # | Check | Result |
|---|---|---|
| A1 | `https://humanx.rinkimirikata.com` loads without error | |
| A2 | LIVE badge and "HumanX" appear in header | |
| A3 | Nav tabs visible: Home · Belief Engine · Drift · Claims · Submit · Evidence · Truths · Review · RunPack | |
| A4 | Status dot appears (green or amber) | |

### B. D-126B polish

| # | Check | Result |
|---|---|---|
| B1 | Nav tab reads **Belief Engine** (not "Beliefs") | |
| B2 | Review tab (no token) shows "Review is owner-only." hint | |

### C. Claim Builder — happy path

| # | Check | Result |
|---|---|---|
| C1 | Submit tab → shows "Claim Builder" heading | |
| C2 | Step 1: type a raw thought ≥ 5 chars; flag panel updates live | |
| C3 | "Make it testable →" advances to Step 2 | |
| C4 | Step 2: route advisory visible (green "looks testable" or yellow "looks like a Truth") | |
| C5 | Step 2 claim route: "Continue to final claim →" advances to Step 3 | |
| C6 | Step 3: summary card shows CLAIM, ORIGINAL, WHY, SCOPE, FALSIFIER, FLAGS, DECISION | |
| C7 | Step 3: "Submit Claim for Review" submits successfully (toast: "Claim submitted for Review") | |
| C8 | After submit: builder resets to Step 1 | |

### D. Claim Builder — Truth route

| # | Check | Result |
|---|---|---|
| D1 | Enter a personal-belief input ("I believe everyone should…") — Step 2 shows yellow "looks like a Truth" advisory | |
| D2 | Step 2 truth route: "Save as Truth for Review" button visible | |
| D3 | Click "Save as Truth for Review" — toast: "Saved as Truth for Review. It will appear publicly after approval." | |
| D4 | Builder resets to Step 1 after truth save | |
| D5 | Step 3 truth route: both "Save as Truth for Review" and "Submit Claim for Review" buttons visible | |

### E. Review builder context (admin only)

| # | Check | Result |
|---|---|---|
| E1 | Open Review with admin token | |
| E2 | Find the builder-submitted claim from step C7 | |
| E3 | Click Inspect → builder context panel visible: blue "Claim Builder" badge + "submission context" label | |
| E4 | ORIGINAL USER TEXT, WHY USER THINKS THIS, SCOPE, PRESSURE/FALSIFIER rows present where filled in | |
| E5 | SYSTEM FLAGS row present as yellow badge chips | |
| E6 | Panel absent on non-builder review items (evidence, old claims) | |

### F. No regression checks

| # | Check | Result |
|---|---|---|
| F1 | Claims tab loads and shows public claims | |
| F2 | Truths tab loads and shows public truths | |
| F3 | Drift tab loads | |
| F4 | Belief Engine link navigates to `/apps/humanx-belief-engine/` | |
| F5 | Evidence Vault loads | |

---

## Stop Conditions

Stop and do not proceed to tester invite if:

- Builder submission fails with an unexpected error (not RATE_LIMITED or CLAIM_TOO_SHORT)
- Truth save fails unexpectedly
- Review builder context panel appears on public-facing pages
- Admin token accidentally visible in any output

---

## Verdict

*(Owner: fill in after smoke run)*

```
Deploy result: PASS / BLOCKED / PARTIAL
Notes:
```

---

## Recommended Next Task

- If smoke PASS: **D-127F** — first tester invite update (inform testers about Claim Builder) or **D-127G** structured builder persistence (dedicated `claim_builder_context` field).
- If smoke BLOCKED: fix blocker, re-deploy, re-smoke.
