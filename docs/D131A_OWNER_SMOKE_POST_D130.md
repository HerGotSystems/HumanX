# D-131A — Owner Smoke Post-D130

**Date:** 2026-06-15
**Label:** Post-D130 deploy owner smoke — confirmed good

---

## Production URLs

- https://humanx.rinkimirikata.com
- https://humanx.veltrusky-michal.workers.dev

---

## Confirmed Working

| Check | Result |
|-------|--------|
| Admin Review opens (token accepted, queue loads) | ✅ pass |
| Inspected item shows structured Claim Builder context in right panel | ✅ pass |
| Right context panel (`#casefile`) updates on inspect open/close | ✅ pass |
| Approve / Keep Pending / Reject moderation actions | ✅ pass |
| Mark Duplicate for claim items | ✅ pass |
| Queue anchor — page stays near moderated card, no jump to top | ✅ pass |
| Public claim page loads | ✅ pass |
| Public study/truth page loads | ✅ pass |

---

## Current Baseline

```
node --check public/app-v10.js              → SYNTAX OK
node scripts/hardening-smoke-test.mjs       → 498 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed
```

---

## Notes

- No new code changes in this checkpoint.
- Records owner-confirmed production behaviour after D-130 (D-130B queue cap comment, D-130C `whyUserThinksThis` fix, D-130D escaping tests) deploy.
- Next feature work can branch from this confirmed-good state.
