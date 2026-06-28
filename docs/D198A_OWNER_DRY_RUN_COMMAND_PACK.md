# D-198A — Owner Dry-Run Command Pack

**Date:** 2026-06-28
**HEAD at creation:** `9b78537`
**Purpose:** Single-page copy-paste pack. Run this from the terminal, then fill in the result block. No need to open other docs.

Full detail: `docs/D197A_OWNER_DRY_RUN_EXECUTION_CHECKLIST.md`
Result template: `docs/D197B_DRY_RUN_RESULT_TEMPLATE.md`

---

## Terminal Commands

```powershell
cd C:\Users\veltr\HumanX
git pull
git log --oneline -3
node scripts/preview-launch-check.mjs
```

Expected: `All automated checks passed.` (22/22, exit 0). If any FAIL — stop and fix before proceeding.

```powershell
# Only run if source files changed since last deploy:
node scripts/hardening-smoke-test.mjs
```

Expected: `1589 passed, 0 failed`

```powershell
# Only run if app-v10.js / index.html / worker.js changed since last live deploy:
npx wrangler deploy
```

Wait 10 seconds after deploy before opening the browser.

---

## Security Rules

- Do NOT paste the admin token into any terminal command, chat, document, or screenshot
- Do NOT paste the owner secret anywhere
- Before saving any screenshot: confirm no token is visible — crop or blur if needed
- Admin token lives in browser `localStorage` only (`humanx_admin_token_v1`)

---

## Browser Checklist

Work through in order. Private/incognito window for steps 1–13. Normal session (or set token in localStorage) for step 14.

```
[ ] 1   Home           — loads, status = Live or Demo mode, Review tab hidden
[ ] 2   Claims         — Arena list renders, no error toast
[ ] 3   Open claim     — Study mode loads, all tabs visible
[ ] 4   Vote           — toast confirms specific vote
[ ] 5   Copy link      — button copies /c/:id URL to clipboard
[ ] 6   Incognito /c/  — paste URL in new private window, Study auto-opens
[ ] 7   Evidence       — side panel, submit, toast = "submitted for review"
[ ] 8   Pressure       — switch to Attack, submit, toast = "submitted for review"
[ ] 9   Test           — add test, appears immediately in Tests tab
[ ] 10  Submit claim   — Builder Steps 1-3 complete, claim enters queue
[ ] 11  My HumanX      — dry-run submissions visible with review state
[ ] 12  RunPack        — generates successfully, no fallback warning
[ ] 13  Review queue   — set admin token, load queue, approve one / reject test items
[ ] 14  Mobile 375px   — Home + Study usable, no horizontal overflow
```

After step 13: reject all "DRY RUN TEST" items. Archive the test from Step 9 in My HumanX if desired.

---

## Copy-Paste Result Block

Fill in immediately after the run. Paste into the next session or keep in private notes.

```
Dry-run result:
HEAD:           [commit hash]
Preflight:      [22/22 PASS | X/22 — list failures]
Smoke:          [1589/0 | skip]
Deploy:         [yes / no]
Home:           [PASS / FAIL]
Claims:         [PASS / FAIL]
Study:          [PASS / FAIL]
Copy link:      [PASS / FAIL]
Direct /c/:id:  [PASS / FAIL]
Evidence:       [PASS / FAIL]
Pressure:       [PASS / FAIL]
Test:           [PASS / FAIL]
Submit claim:   [PASS / FAIL]
My HumanX:      [PASS / FAIL]
RunPack:        [PASS / FAIL]
Review:         [PASS / FAIL]
Mobile:         [PASS / FAIL]
Console errors: [none | list]
Issues found:   [none | P0: X, P1: X, P2: X, P3: X — one-line summaries]
Decision:       [PASS / CONDITIONAL PASS / FAIL]
```

---

## Decision Rules

| Decision | Meaning | Next step |
|----------|---------|-----------|
| **PASS** | No P0/P1, steps 1–6 + 10 + 13 all pass | Send Batch 1 invites (D-191B messages) |
| **CONDITIONAL PASS** | P2 only, or one P1 fixable in <2h | Fix named items, re-run affected steps, then send |
| **FAIL** | Any P0 open, or 2+ P1 open, or preflight failure | Create D-197C fixes. Re-run full dry run. Do not send. |
