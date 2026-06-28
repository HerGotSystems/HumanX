# D-197A — Owner Dry-Run Execution Checklist

**Date:** 2026-06-28
**HEAD at creation:** `87279e7`
**Baseline:** 1589/24/57
**Audience:** Owner/operator running Batch 0 — the pre-invite dry run

Run this before inviting anyone. Budget 45–60 minutes for the first run. Subsequent runs (before Batch 2) should take 20–30 minutes.

---

## Security Reminders — Non-Negotiable

Before starting:

- Admin token stays in your browser's `localStorage` only — `humanx_admin_token_v1`
- Do not paste the admin token into any terminal, chat, email, or screenshot
- Do not paste the owner secret anywhere
- If you take a screenshot to record a bug, crop or blur any visible tokens before saving
- Do not share screenshots from the Review queue or admin UI without reviewing them for sensitive values first

---

## Preconditions

Confirm all of these before starting the browser steps:

- [ ] On the `main` branch, HEAD = latest known-good commit
- [ ] No uncommitted changes to `public/app-v10.js`, `public/index.html`, or `src/worker.js`
- [ ] Admin token is accessible to you locally (you know it; it is NOT written anywhere shared)
- [ ] 45–60 minutes of uninterrupted time available
- [ ] A private/incognito browser window available (separate from your normal session)

---

## Phase 1 — Terminal Checks

Run from the repo root. Copy-paste these exactly.

```sh
git pull origin main
git log --oneline -3
```

Confirm the most recent commit is the expected D-series patch. If HEAD is unexpected: stop and investigate before proceeding.

```sh
node scripts/preview-launch-check.mjs
```

**Required:** All 22 checks PASS, exit 0. If any FAIL: fix before continuing.

```sh
# Only run if you made code changes since last deploy:
node scripts/hardening-smoke-test.mjs
```

**Expected:** `1589 passed, 0 failed`. Only needed if `app-v10.js`, `index.html`, or `worker.js` changed.

```sh
# Only run if source files changed since last deploy:
npx wrangler deploy
```

Wait 10 seconds after deploy before opening the browser.

Record the deploy output (timestamp, success/error) in your dry-run notes.

---

## Phase 2 — Browser Dry Run

Work through these steps in order. Use a private/incognito window for steps 1–13 (simulates a first-time visitor with no account). You will need your normal session for step 14 (Review queue with admin token).

Record the time at start: ___________

For each step, note:
- Time taken
- Anything that confused you
- Any failed click, broken state, or unexpected result
- Any console error (open DevTools → Console tab and watch it throughout)

---

### Step 1 — Home page

**Open:** `https://humanx.veltrusky-michal.workers.dev` in private window

**Check:**
- [ ] Page loads without blank screen or error
- [ ] Status chip shows `Live` or `Demo mode` (not `D1 live`, `Demo fallback`, `Backend unreachable`)
- [ ] Review tab is NOT visible in the nav
- [ ] Home copy is readable — no placeholder text, no broken HTML
- [ ] No red error toasts appear on load

**Record:** First impression of the home page in one sentence.

---

### Step 2 — Browse Claims (Arena)

**Action:** Click the Arena tab or wait for default load.

**Check:**
- [ ] Claims list renders — at least one claim visible
- [ ] Claims have titles, categories, and score chips visible
- [ ] No JS error toast appears
- [ ] Clicking a filter or sort doesn't break the list

**Record:** Does the Arena feel like a legible list of things? Yes / No / Notes.

---

### Step 3 — Open a claim (Study mode)

**Action:** Click any claim card.

**Check:**
- [ ] Study mode opens — claim text visible at top
- [ ] Evidence, Pressure, Tests, Analysis tabs all present and clickable
- [ ] Score meters (Evidence, Testability, Survivability) display
- [ ] Side panel visible (or accessible by scrolling)
- [ ] No error toasts

**Record:** Which claim did you open? Note the claim ID from the URL or panel.

---

### Step 4 — Vote

**Action:** In Study mode, click Believe, Reject, or Unsure.

**Check:**
- [ ] Vote registers without error
- [ ] Toast appears confirming specific vote (e.g. "Vote recorded: Believe.")
- [ ] Note: buttons do NOT visually highlight after voting — this is a known P2, not a bug

**Record:** Did the vote toast appear? Yes / No.

---

### Step 5 — Copy claim link

**Action:** In Study mode, click "Copy link".

**Check:**
- [ ] Button text changes to "Copied!" briefly
- [ ] Paste into a text field — confirm the URL is `https://humanx.veltrusky-michal.workers.dev/c/<claim-id>`
- [ ] URL format looks correct (not `/study/`, not `/arena/`)

**Record:** Paste the copied URL here for use in Step 6: ___________

---

### Step 6 — Open copied link in a second private window

**Action:** Open a new private/incognito window. Paste the `/c/:id` URL and navigate to it.

**Check:**
- [ ] Page loads — not a 404 or blank
- [ ] View page source (`Ctrl+U` / `Cmd+U`) — `<title>` contains the claim text, not just "HumanX"
- [ ] SPA loads and auto-opens Study mode for the correct claim
- [ ] The specific claim matches what you copied the link from

**Record:** Did the direct URL open the correct claim? Yes / No / Notes.

---

### Step 7 — Add evidence

**Action:** In Study mode (same or different claim), use the side panel to add a piece of evidence. Use clearly test-labelled content: "DRY RUN TEST — ignore" as the title.

**Check:**
- [ ] Side panel visible; Evidence/Attack dropdown present
- [ ] Note below "Add to Claim" button shows invite-aware copy (if unverified) or approval copy (if verified)
- [ ] Fill in title, note, submit — toast appears: "Evidence submitted for review. It will appear after approval."
- [ ] After 4 seconds, the inline note resets (next-action hint fades back)
- [ ] No error toast

**Record:** What did the inline note say? (copy the exact text)

---

### Step 8 — Add pressure

**Action:** In the same side panel, switch to "Attack" mode (or pressure). Add a test pressure point with title "DRY RUN TEST — pressure — ignore".

**Check:**
- [ ] Side panel switches to pressure mode correctly
- [ ] Toast appears: "Pressure submitted for review. It will appear after approval."
- [ ] No error

**Record:** Pass / Fail

---

### Step 9 — Add a test

**Action:** In Study mode, find the Tests tab. Add a test with title "DRY RUN TEST — test — ignore".

**Check:**
- [ ] Test form accessible (may need to scroll)
- [ ] Submit — toast appears: "Test added — now visible in the Tests section." (plus invite reminder if unverified)
- [ ] Test appears immediately in the Tests tab (no review wait)
- [ ] No error

**Record:** Did the test appear immediately? Yes / No.

---

### Step 10 — Submit a new claim via the Builder

**Action:** Click "Build a Claim" or the relevant nav/button. Complete all three steps.

- Step 1: Enter a clearly test-labelled claim — "DRY RUN TEST — please reject — ignore"
- Step 2: Fill in category, type
- Step 3: Submit

**Check:**
- [ ] Step 1 copy says "Submit a testable claim for review. Redeem your invite…" — NOT "Anyone can submit"
- [ ] If unverified: Step 3 shows guest note below submit button
- [ ] Submission toast appears after Step 3
- [ ] No error mid-flow
- [ ] Claim enters the queue (visible in Review tab as a pending item — check in Step 14)

**Record:** How many steps was the Builder? Did any step feel unclear?

---

### Step 11 — Open My HumanX

**Action:** Click "My HumanX" in the nav.

**Check:**
- [ ] Page loads — shows activity summary
- [ ] Your dry-run submissions appear (claims, evidence, pressure, test)
- [ ] Items show correct `review` state (not `public` — they haven't been approved yet)
- [ ] Archive buttons present where expected

**Record:** Did your submissions show up? Yes / No. How many items visible?

---

### Step 12 — Profile settings (if verified account exists)

**Action:** In My HumanX, navigate to Profile Settings section.

If **unverified:**
- [ ] Guest warning appears above the toggle: "Verify your account with an invite code before enabling a public profile..."
- [ ] Toggle is present but guest note is visible

If **verified:**
- [ ] No guest warning
- [ ] Enable public profile, set a slug, save
- [ ] Open `https://humanx.veltrusky-michal.workers.dev/u/<your-slug>` in a new tab
- [ ] Profile page loads with display name, bio, and any public claims

**Record:** Verified or unverified for this run? Profile URL if tested: ___________

---

### Step 13 — Generate a RunPack

**Action:** From a Study view with an open claim, find the "Build RunPack" / "Copy RunPack" flow.

**Check:**
- [ ] RunPack or "Build Investigation Packet" button accessible
- [ ] Clicking it generates a packet (toast: "RunPack ready — copy it into your AI")
- [ ] The RunPack tab / copy button is available
- [ ] Copying the packet gives valid JSON (paste into a text editor, scan for structure)
- [ ] No error or fallback warning (fallback indicates backend issue)

**Record:** Did RunPack generate successfully? Yes / No / Fallback.

---

### Step 14 — Review queue (admin)

**Action:** Switch to your normal browser session (or set admin token in localStorage in the incognito window — see below). Open the Review tab.

To set the admin token in browser console (incognito window is fine):
```js
localStorage.setItem('humanx_admin_token_v1', '<your-admin-token>');
location.reload();
```

> ⚠ Do not paste this command with your actual token into any shared document. Run it in the browser console only.

**Check:**
- [ ] Review tab appears in nav after token set
- [ ] Click "Load Queue" — queue loads without 403
- [ ] Your dry-run test submissions appear (the DRY RUN TEST items from Steps 7–10)
- [ ] Builder context visible in inspect panel for the claim from Step 10
- [ ] Approve one item — confirm it becomes `public`
- [ ] Reject the test items — "DRY RUN TEST" submissions should all end up rejected

**Record:** How many items appeared in the queue from this dry run? ___________

---

### Step 15 — Mobile / narrow screen

**Action:** Resize browser to approximately 375px wide (or use DevTools → Device emulation → iPhone SE or similar).

**Check:**
- [ ] Home page renders without horizontal overflow
- [ ] Arena list is readable; claim cards don't overflow
- [ ] Study mode loads; tabs clickable
- [ ] Side panel accessible (may require scrolling — this is a known P2)
- [ ] Builder Steps 1–3 usable on narrow screen

**Record:** Any specific element that broke or became unusable at 375px width?

---

## Phase 3 — What to Record

At the end of the dry run, fill in:

```
Dry-run date:
Total time taken:
Deploy needed? (yes/no):
Preflight result: 22/22 PASS or [list failures]

--- Step results ---
Step 1  Home:         PASS / FAIL / Notes:
Step 2  Arena:        PASS / FAIL / Notes:
Step 3  Study:        PASS / FAIL / Notes:
Step 4  Vote:         PASS / FAIL / Notes:
Step 5  Copy link:    PASS / FAIL / Notes:
Step 6  /c/:id:       PASS / FAIL / Notes:
Step 7  Evidence:     PASS / FAIL / Notes:
Step 8  Pressure:     PASS / FAIL / Notes:
Step 9  Test:         PASS / FAIL / Notes:
Step 10 Builder:      PASS / FAIL / Notes:
Step 11 My HumanX:    PASS / FAIL / Notes:
Step 12 Profile:      PASS / FAIL / SKIPPED / Notes:
Step 13 RunPack:      PASS / FAIL / Notes:
Step 14 Review queue: PASS / FAIL / Notes:
Step 15 Mobile:       PASS / FAIL / Notes:

--- Open issues ---
Confusing moments:
Failed clicks:
Console errors:
Screenshots taken: (filenames, confirm no tokens visible)

--- Verdict ---
PASS — ready for Batch 1
FAIL — create D-197B fixes first
```

Keep this record in your private notes (not in the repo unless you redact any token references first).

---

## Phase 4 — Cleanup

After the dry run, clean up test content:

1. Open Review queue (admin)
2. Filter to "Pending" — find all "DRY RUN TEST" items
3. Reject each one
4. For any that you accidentally approved: use Review → set back to `rejected`
5. If a "DRY RUN TEST" claim ended up public: reject it from the Review queue

The rejected items remain in the database but are not visible to users. Do not archive them immediately — they serve as evidence that the flow worked during the dry run.

For the dry-run test added in Step 9 (which appears immediately without review): it will be visible in the Tests tab of that claim. You can archive it from My HumanX → Tests → Archive.

---

## Pass / Fail Criteria

### PASS — ready for Batch 1

All of these must be true:

- [ ] `preview-launch-check.mjs` passed 22/22 before the run
- [ ] Steps 1–6 all pass (Home, Arena, Study, Vote, Copy link, Direct URL)
- [ ] At least one contribution flow passes (Step 7, 8, or 9)
- [ ] Builder (Step 10) completes without error
- [ ] Review queue (Step 14) loads and decisions work
- [ ] No P0 issues found (security, data corruption, backend unreachable)
- [ ] Cleanup complete (no junk public claims left)

You may proceed to Batch 1 with open P2/P3 issues — but disclose them to preview users using the limitations text from D-191B.

### FAIL — create D-197B fixes first

Stop and do not send invites if any of:

- `preview-launch-check.mjs` failed any check
- Home shows `Backend unreachable`
- `/c/:id` direct URL returns 404 or blank
- Builder Steps 1–3 fail to submit
- Review queue returns 403 with correct admin token
- A P0 bug was discovered during the run (security, token exposure, data corruption)
- RunPack generates a fallback every time (indicates backend issue)

Create a `D-197B` fix task, resolve the failures, re-run the full dry run, and pass before sending any invites.

---

## Timing Reference

| Phase | Expected time |
|-------|--------------|
| Phase 1 — Terminal checks | 3–5 min |
| Phase 2 — Browser steps 1–15 | 30–45 min |
| Phase 3 — Record results | 5–10 min |
| Phase 4 — Cleanup | 5 min |
| **Total** | **45–65 min** |

Second and subsequent dry runs (before Batch 2): 20–30 min, since you know the flows.
