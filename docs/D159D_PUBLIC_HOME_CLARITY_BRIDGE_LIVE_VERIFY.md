# D-159D — Live Verify: Public Home Clarity Bridge

**Date:** 2026-06-24
**Checkpoint:** D-159B
**Commit:** f2ca9d8
**Scope:** Docs only. Live verification of D-159B frontend/CSS changes. No code, no migration, no `wrangler.toml`, no owner-token work.

---

## Deploy

Owner ran `npx wrangler deploy` from connected terminal. Modified static assets uploaded and Worker deployed successfully.

---

## Preflight

Command (owner terminal, outbound internet):
```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-159B f2ca9d8 1149/24/57
```

Verbatim output:
```
$ cd /c/Users/veltr/HumanX
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-159B f2ca9d8 1149/24/57

HumanX Live Preflight — https://humanx.rinkimirikata.com
────────────────────────────────────────────────────
  PASS: /api/version HTTP status
  PASS: /api/version ok === true
  PASS: /api/version app === humanx
  PASS: checkpoint matches
  PASS: commit matches
  PASS: baseline matches
  PASS: /api/health HTTP status
  PASS: /api/health ok === true

  ✓ All checks passed. Production is running D-159B / f2ca9d8.
```

---

## Visual Verification

Confirmed by owner at `https://humanx.rinkimirikata.com/`:

| Check | Status |
|---|---|
| Home badge reads "invite-only preview", not "working system" | ✓ |
| Short intro sentence visible below the main subtitle | ✓ |
| "View a public profile example →" link visible | ✓ |
| Public profile example link points to `/u/calenhir` | ✓ |
| Browse Claims is the first/primary action card | ✓ |
| Belief Engine remains visible | ✓ |
| Submit Claim remains visible | ✓ |
| No invite codes visible | ✓ |
| No private/admin/token fields visible | ✓ |

---

## Baseline Confirmed

```
node scripts/hardening-smoke-test.mjs       → 1149 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

No code change in this checkpoint. Baseline unchanged from D-159B.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.
