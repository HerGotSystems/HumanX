# D-158D — Live Verify: Public Profile Snapshot-First Hierarchy

**Date:** 2026-06-24
**Checkpoint:** D-158B
**Commit:** 9784116
**Version ID:** 1236c30c-5ed8-45ab-a050-3acaf5f59c24
**Scope:** Docs only. Live verification of D-158B frontend/CSS changes. No code, no migration, no `wrangler.toml`, no owner-token work.

---

## Deploy

Owner ran `npx wrangler deploy` from connected terminal.

Uploaded modified static assets:
- `/styles.css`
- `/app-v10.js`

Worker deployed successfully. Version ID: `1236c30c-5ed8-45ab-a050-3acaf5f59c24`

---

## Preflight

Command (owner terminal, outbound internet):
```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-158B 9784116 1138/24/57
```

Verbatim output:
```
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

✓ All checks passed. Production is running D-158B / 9784116.
```

---

## Visual Verification

Confirmed by owner at `https://humanx.rinkimirikata.com/u/calenhir`:

| Check | Status |
|---|---|
| Snapshot card appears before the HumanX context block | ✓ |
| Context block appears before the claims section | ✓ |
| Counts card sits after main content, not before the hook | ✓ |
| Empty truths/evidence/pressure sections absent when empty | ✓ |
| Claims section retains its empty state when no claims exist | ✓ |
| Bio fallback line appears in header when bio absent and snapshot present | ✓ |
| "Copy profile link" feedback still works | ✓ |
| Show more / Show less still works where evidence/pressure appear | ✓ |
| No private/admin/token fields visible | ✓ |

---

## Baseline Confirmed

```
node scripts/hardening-smoke-test.mjs       → 1138 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

No code change in this checkpoint. Baseline unchanged from D-158B.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.
