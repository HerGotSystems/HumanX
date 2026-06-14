# D-124L — Owner Browser Checklist: Belief Engine Tester Deploy Check

**Date:** 2026-06-14
**Use after:** explicit deploy decision — run this before sending any tester invite
**Canonical URL:** https://humanx.rinkimirikata.com
**Worker origin (technical fallback only — do not share with testers):** https://humanx.veltrusky-michal.workers.dev

Run this checklist in a normal browser window first, then repeat mobile checks (steps 9a–9b) in DevTools responsive mode or on a real phone.

Mark each item: ✅ pass · ⚠ pass with note · ❌ blocked

---

## 1. Production health

Open https://humanx.rinkimirikata.com in a fresh tab.

- [ ] Page loads — no blank screen, no Cloudflare error, no "Worker threw an exception"
- [ ] Status line on the Home page shows **D1 live** (not "demo" or "offline")
- [ ] Open DevTools → Console — no red errors on initial load
- [ ] Open `/api/health` (add `/api/health` to the canonical URL in the address bar)
  - Response should be `{ "ok": true, "mode": "d1-live" }` or similar
  - If it returns `demo` or an error, stop — do not invite testers until fixed

---

## 2. Home card

Still on the Home page.

- [ ] **Belief Engine card is visible** in the Actions grid
- [ ] Card reads: *"It helps separate personal certainty, inherited ideas, identity pressure, and what could change your mind."*
- [ ] Card has "Open Belief Engine →" action link
- [ ] Card does NOT say "diagnose", "score your worth", or imply the result is a verdict

---

## 3. Belief Engine intro (fresh / incognito)

Open a **private/incognito window** and navigate to https://humanx.rinkimirikata.com, then click the Belief Engine card (or the Beliefs tab).

- [ ] Belief Engine intro screen loads — no 404, no blank page
- [ ] Headline reads **"Belief Engine"**
- [ ] Subtext includes: *"This is not a test you pass or fail."*
- [ ] Intro note says: *"No correct answers. No religion assigned. No diagnosis."*
- [ ] Intro note says: *"Stored in this browser only. Nothing leaves your device unless you export it."*
- [ ] **"View previous results" block is NOT visible** (incognito — no saved data)

---

## 4. Belief Engine full flow

Still in the incognito window. Complete a real run.

- [ ] Click **Begin Mapping** — Identity screen appears
- [ ] Identity screen: "Skip all of this →" works and takes you to the quiz
- [ ] Quiz screen: progress bar advances, Likert sliders respond to clicks
- [ ] Back/Next navigation works — no screen gets stuck
- [ ] After final category, Timeline screen appears with a Skip option
- [ ] Skip timeline → results screen appears
- [ ] **Results hero reads:** *"Your Belief Architecture"*
- [ ] **Framing line reads:** *"This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict."*
- [ ] **Pressure Map** (radar chart) is visible and rendered — not a blank canvas
- [ ] **Profile Snapshot** section is visible with at least one alignment shown
- [ ] **Contradiction Response** accordion is open by default and shows a scan list (or "No major internal contradictions detected")
- [ ] **"What to Test Next"** section is visible with Browse Claims / Submit a Claim / Browse Truths links
- [ ] Export & Share section is visible with Download PNG, Copy Summary, Start Over buttons

---

## 5. Timeline / local privacy

Start a new run (or replay the incognito flow). This time, **do not skip the Timeline screen**.

- [ ] Timeline screen appears after the last quiz category
- [ ] Free-text fields accept typing (try typing something in "Childhood" field)
- [ ] Click **See Full Report →**
- [ ] Results screen loads normally
- [ ] Scroll to the **Belief Timeline** panel (near the bottom of results, above Export)
- [ ] Your typed text appears in the panel
- [ ] Directly below the "Belief Timeline" heading, a note reads: *"Your written responses — stored in this browser only. Not included in snapshots sent to HumanX."*

---

## 6. Saved result — view, note, and Clear

After completing any run (normal browser window — not incognito):

- [ ] **Reload the page** (Cmd/Ctrl+R)
- [ ] **"View previous results"** button appears on the intro screen
- [ ] Button shows note: *"saved in this browser · includes any answers you typed · not synced"*
- [ ] Click **View previous results** — result loads correctly
- [ ] Go back (or reload) to intro; button still shows
- [ ] Click **Clear** — button disappears immediately
- [ ] **Reload the page** — "View previous results" button is gone (cleared data does not reappear)

---

## 7. Start Over

Complete a run so results are visible.

- [ ] In the Export & Share section, click **Start Over**
- [ ] Quiz screen appears (fresh start — category 1, no pre-filled answers)
- [ ] Reload the page — **"View previous results" does NOT appear** (Start Over cleared the saved result)

---

## 8. Send to HumanX (optional — owner's choice)

The pre-click note must be visible before the button is clicked. **Testers should not be required to send unless they choose to.**

- [ ] Complete a run — Export & Share section is visible
- [ ] **"Send to HumanX" button appears** (injected by bridge script)
- [ ] Pre-click note is visible and reads: *"Not saved: private timeline text or free-text answers you typed. Nothing is published — the snapshot enters your Drift for your own review only."*
- [ ] Static note above the buttons reads: *"it does not publish anything automatically"*
- [ ] *(Optional — only if owner chooses)* Click Send to HumanX → button shows "Sending…" then "Saved to HumanX ✓"; alert confirms the snapshot is not published
- [ ] *(Optional)* Navigate to the Drift tab in the main app → snapshot appears under **Full Belief Engine Profiles**, not Quick Belief Records

---

## 9a. Mobile check — 390px (phone)

Use browser DevTools responsive mode set to **390 × 844** (iPhone 14) or test on a real phone.

- [ ] Intro screen: text is readable, Begin Mapping button is fully visible and tappable
- [ ] Quiz screen: Likert slider buttons are large enough to tap, no horizontal overflow
- [ ] Results screen: **no horizontal scrolling** (content fits within 390px)
- [ ] Pressure Map (radar chart) renders — labels are readable at this width
- [ ] Accordion sections are tappable and expand correctly
- [ ] Export & Share buttons are tappable

---

## 9b. Mobile check — 768px (tablet)

Set DevTools responsive mode to **768 × 1024**.

- [ ] Results screen: overview grid (Pressure Map + Profile Snapshot) collapses to single column — no overflow
- [ ] Accordion sections are comfortably wide
- [ ] "What to Test Next" links stack or wrap without breaking

---

## 10. Public content

Close incognito if open. On the main app:

- [ ] Click **Claims** tab → at least one public claim is listed
- [ ] Click into a claim → Study view loads with evidence/pressure/vote sections visible
- [ ] Click **Truths** tab → at least one Truth is listed
- [ ] Claims and Truths both show "Public means visible, not proven" framing or equivalent

---

## 11. Review / admin gate

- [ ] Click the **Review** tab (if visible)
- [ ] Page shows **"admin only"** badge and a token input field — NOT a list of submissions
- [ ] No admin token value is pre-filled or visible in the page source
- [ ] Without entering a token, the queue does not load
- [ ] A tester without the token cannot see any pending submissions

---

## 12. Final judgement

Complete the run: circle one and add any notes below.

```
Overall result:  PASS  /  PASS WITH NOTES  /  BLOCKED

Date checked: _______________
Browser + version: _______________
Mobile tested on: _______________

Issues found:
- 
- 
- 

Blocker items (must fix before inviting testers):
- 

Notes-only items (can invite with briefing):
- 

Decision: [ ] Proceed to tester invite   [ ] Fix first (see blockers above)
```

---

## If PASS — next steps

1. Decide how many testers to invite (recommend 1–3 for the first wave).
2. Decide how they will send feedback (email, DM, form — not via the site itself).
3. Brief testers using `docs/D123A_TESTER_LAUNCH_PACK.md` — sections 1–4 for the invite, sections 6–7 for privacy warnings.
4. Do **not** share the Worker origin URL (`https://humanx.veltrusky-michal.workers.dev`) with testers.
5. Do **not** post the canonical URL publicly.
6. Keep admin token access private — testers should not be able to view the Review queue.

## If BLOCKED — do not invite

File any blocking issue as a new task (D-124M or equivalent). Fix and re-run this checklist from step 1 before sending any invite.
