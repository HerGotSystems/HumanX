# D-155B — Live Verify: Public Profile Density / Readability Polish

**Date:** 2026-06-24
**Checkpoint:** D-155A
**Commit:** 122ac14
**Scope:** Docs only. Live verification of D-155A frontend/CSS changes. No code, no migration, no `wrangler.toml`, no owner-token work.

---

## Deploy Evidence

```
npx wrangler deploy

 ⛅️ wrangler 4.104.0
────────────────────
🌀 Building list of assets...
✨ Read 9 files from the assets directory
🌀 Starting asset upload...
🌀 Found 2 new or modified static assets to upload. Proceeding with upload...
+ /styles.css
+ /app-v10.js
Uploaded 2 of 2 assets
✨ Success! Uploaded 2 files (5 already uploaded) (1.74 sec)

Total Upload: 172.05 KiB / gzip: 36.86 KiB
Uploaded humanx (17.91 sec)
Deployed humanx triggers (6.35 sec)
  https://humanx.veltrusky-michal.workers.dev
Current Version ID: 5e6530b0-6d83-48ca-a066-604990501eeb
```

## Preflight

Command:
```
node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-155A 122ac14 1091/24/57
```

Result:
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

  ✓ All checks passed. Production is running D-155A / 122ac14.
```

All 8 checks passed.

---

## Visual Checks Expected

| Item | Expected |
|---|---|
| Public profile less cramped | ✓ (CSS: 22px display name, 14px section h3, 14px card padding, 13px item titles) |
| Evidence section shows first 5 by default | ✓ (BATCH=5 slice; pp-more-items hidden) |
| Pressure section shows first 5 by default | ✓ (BATCH=5 slice; pp-more-items hidden) |
| Show more / Show less toggle works client-side | ✓ (ppToggleShowMore — pure DOM, no fetch) |
| D-154B context block remains | ✓ |
| "Copy profile link" button remains | ✓ |
| No private/admin/token fields visible | ✓ |

---

## Baseline Confirmed

```
node scripts/hardening-smoke-test.mjs       → 1091 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

No code change in this checkpoint. Baseline unchanged from D-155A.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.
