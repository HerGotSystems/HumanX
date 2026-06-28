# D-200A — Solo Preview Mode Plan

**Date:** 2026-06-28
**HEAD at creation:** `2255bc5`
**Baseline:** 1589/24/57

---

## Why Solo Preview Mode

No external testers are available yet. Waiting for them before generating any usage feedback creates a standstill. Solo preview mode breaks that: the owner runs through the product as several distinct personas, records honest observations, and surfaces friction before recruiting anyone else.

Solo preview is not a replacement for external feedback — it is what makes the product worth sharing when external testers do arrive.

---

## Personas

Run each persona in a separate session. Do not carry knowledge from one persona into another.

### 1. Anonymous Visitor (incognito)

- No account, no invite code, no prior knowledge of the product
- Fresh incognito window each time
- Goal: understand what a first-time visitor sees and whether they can do anything useful without an account
- Mindset: "I followed a link someone sent me. I have no idea what this is."

### 2. Normal Verified User

- Has an account with a verified invite code
- Uses a real handle and display name
- Goal: go through the full contribution loop — submit a claim, add evidence, check My HumanX, share a link
- Mindset: "I've used this once before and want to contribute something real."

### 3. Mobile-Only User

- Desktop browser in DevTools device mode at 375px (iPhone SE)
- No mouse — touch simulation only (click, scroll)
- Goal: determine whether the core flows (browse, study, vote, add evidence, submit claim) are usable without a keyboard or wide screen
- Mindset: "I'm on my phone during a commute. I have 5 minutes."

### 4. Skeptical Claim Submitter

- Has an account; wants to submit a claim they actually believe but that could be controversial
- Deliberately tries to break the Builder: too-long inputs, vague falsifiers, missing fields
- Reads the review state copy critically: does the product feel trustworthy or bureaucratic?
- Mindset: "I'm not sure this product takes me seriously. I want to submit something real and see what happens."

### 5. Moderator / Admin

- Uses the Review queue with admin token
- Tries to approve, reject, and inspect items from the other persona sessions
- Reads the item metadata: is there enough context to make a decision?
- Mindset: "I'm the person who has to keep this queue clean. Is this survivable?"

---

## Test Loops

Run these flows across the personas. Not every persona runs every loop — see the execution template (D-200B).

| Loop | What to do |
|------|-----------|
| **Browse claims** | Open Arena, scroll, read card metadata, try a filter |
| **Open direct `/c/:id`** | Paste a claim URL into a fresh window; confirm Study auto-opens |
| **Vote** | Click Believe / Reject / Unsure; confirm toast appears |
| **Add evidence** | Use side panel; submit with title and note; confirm review-state toast |
| **Add pressure** | Switch to Attack mode; submit; confirm toast |
| **Add test** | Use Tests tab; confirm test appears immediately |
| **Submit claim** | Run Builder Steps 1–3 with real content; submit |
| **Approve / reject in Review** | Load queue; process the submissions from other persona sessions |
| **Check My HumanX** | Open Me tab; confirm submissions show with correct review state |
| **Copy / share claim link** | Click Copy link; paste into a text editor; confirm format |
| **Create RunPack** | Open a studied claim; build packet; confirm no fallback warning |

---

## How to Avoid Fake Confidence

Solo testing generates false positives if the tester already knows the product. Counter this deliberately:

- **Write notes in real time.** Do not summarize after. Record the moment you hesitate, not your post-hoc explanation of why you hesitated.
- **Try the wrong path first.** On each flow, attempt something that a confused user might do before doing the correct thing. Example: try submitting a Builder claim without filling in the falsifier. Try adding evidence without selecting a claim.
- **Test without reading any docs.** The persona does not have access to D-191B or D-197A. If you find yourself reaching for a runbook, that is a UX gap.
- **Use incognito for anonymous and mobile personas.** No autofill, no cached state, no account badge. Every load is a first load.
- **At 375px, use only clicks and scroll.** No right-click, no hover tooltips, no keyboard shortcuts. If a flow requires one of these, record it.
- **Do not fix things during the run.** Note the friction and keep going. Stopping to fix mid-session corrupts the read.

---

## What to Record

For each persona session, write a brief debrief immediately after. Use this structure:

```
Persona:          [1–5]
Session duration: [minutes]
Device / viewport:[desktop / mobile 375px / incognito]

Where I hesitated:
  -

What felt boring or pointless:
  -

What felt genuinely useful:
  -

What broke or errored:
  -

What I would show someone first:
  -

What I would not show someone first:
  -

Friction I noticed but did not stop on:
  -

One thing I would change before showing this to anyone:
  -
```

---

## Decision After Solo Preview

After running all five personas (or as many as useful), collect the debriefs and triage:

**Fix before recruiting testers:**
- Any flow that a confused user could not complete without prior knowledge
- Any broken state that was not already a known P2
- Any copy that caused hesitation and is easy to improve

**Do not fix yet:**
- P3 cosmetic issues that did not affect completion
- Features that are missing but not expected (autofill, mobile keyboard, notifications)
- Anything already in the known-limitations list (D-191B)

**After fixing obvious friction:**
1. Record a short demo — a screen capture, GIF, or set of annotated screenshots — showing the core loop from a fresh incognito window.
2. The demo does not need to be polished. It needs to show: a claim being studied, evidence being added, and a RunPack being built.
3. Use the demo to recruit the first external tester — show rather than explain.

---

## Persona Execution Order

Run in this order to build the Review queue before processing it:

1. Anonymous visitor — browse and vote only
2. Skeptical claim submitter — submit a claim, add evidence, add pressure
3. Normal verified user — full contribution loop
4. Mobile-only user — browse, vote, open `/c/:id`, attempt evidence
5. Moderator / admin — process queue from sessions 2–4, check My HumanX

The execution template with exact steps is in `docs/D200B_SOLO_PREVIEW_EXECUTION.md`.
