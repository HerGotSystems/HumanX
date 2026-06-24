# D-154C — Live Verify: Public Profile Clarity Layer

**Date:** 2026-06-24
**Checkpoint:** D-154B
**Commit:** 7445c5f
**Scope:** Docs only. Live verification of D-154B frontend changes. No code, no migration, no `wrangler.toml`, no owner-token work.

---

## Evidence

### Preflight

Command:
```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-154B 7445c5f 1073/24/57
```

**D-154C original record:** preflight output was not captured before commit; the result field was left as a placeholder.

**D-154D correction (2026-06-24):** preflight was re-run from the local dev environment. Result:

```
FAIL: fetch
      expected: no error
      got:      fetch failed
```

This is a **local environment network failure**, not a production failure. The Node.js shell in this environment cannot reach `humanx.rinkimirikata.com` (no outbound internet access). The visual check below was performed by the owner directly in a browser and confirms production is serving the correct build.

**Owner action required:** to close this gap, run the preflight from a machine with outbound internet access:

```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-154B 7445c5f 1073/24/57
```

All 8 checks should pass. If any fail, re-deploy and retry before marking D-154B fully verified.

### Visual Check — `https://humanx.rinkimirikata.com/u/calenhir`

| Item | Status |
|---|---|
| HumanX context block visible near top | ✓ |
| Section label: "Claims being tested" | ✓ |
| Section label: "Public truths" | ✓ |
| Section label: "Supporting evidence" | ✓ |
| Section label: "Questions under pressure" | ✓ |
| "View in HumanX →" CTA (replaces "Open Study →") | ✓ |
| "Copy profile link" CTA visible to visitor | ✓ |
| No admin token exposed | ✓ |
| No owner token exposed | ✓ |
| No user id / email / is_admin visible | ✓ |
| No private evidence body visible | ✓ |
| No private pressure body visible | ✓ |

---

## Baseline Confirmed

```
node scripts/hardening-smoke-test.mjs       → 1073 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

No code change in this checkpoint. Baseline unchanged.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. This checkpoint closes only the D-154B/C deploy-and-verify cycle.
