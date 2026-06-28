# D-196A — Preview Seed-User List + Invite Batch Plan

**Date:** 2026-06-28
**HEAD at creation:** `6f2e1f7`
**Baseline:** 1589/24/57
**Audience:** Operator planning the first external preview wave

---

## Overview

The goal of the first preview is not to get feedback from 20 people. It is to find out whether **one real person who wasn't involved in building it** can use HumanX without help. Everything else follows from that.

Start smaller than feels necessary. Three real users giving honest feedback beats twenty users who were too polite to say it was confusing.

---

## Batch Structure

### Batch 0 — Owner dry run (before anyone else)

**Size:** 1 (you)
**When:** Before sending any invite codes
**Goal:** Walk through the full checklist as if you are a new user seeing the product for the first time. Redeem an invite code yourself. Submit a claim. Add evidence. Copy the link. Check My HumanX. Review the submission in the admin queue.

This catches anything the automated preflight misses — phrasing that seems obvious to you but won't be, flows that work in isolation but break in sequence, and mobile issues that only show up under real conditions.

**Do not skip Batch 0.** It costs 20 minutes and catches things no checklist can.

### Batch 1 — First 3–5 trusted users

**Size:** 3–5
**When:** After Batch 0 is clean and the D-195A deployment checklist passes
**Wait time before Batch 2:** 5–7 days minimum, or until all Batch 1 users have replied

Send to people you can reach directly and who will tell you if something is broken. Not a group message — individual direct messages using the invite pack from D-191B.

### Batch 2 — Expand to 10–20

**Size:** Up to 20 total (including Batch 1)
**When:** After Batch 1 go/no-go criteria pass (see below)
**Wait time before any further expansion:** 7–14 days

At this point you have real feedback and can start fixing the highest-friction issues. Do not expand until the top 2–3 Batch 1 friction points are addressed or consciously accepted.

---

## Who to Invite

### The ideal Batch 1 roster (3–5 people)

Pick people who cover as many of these profiles as possible. You don't need one of each — you need people who will actually try it and tell you the truth.

| Profile | What they test | What signal they give you |
|---------|---------------|--------------------------|
| **The technical friend** | Everything — they'll explore edge cases you didn't think of | Whether the system behaves correctly under scrutiny; will notice broken URLs, weird states, console errors |
| **The non-technical curious person** | First impressions, onboarding clarity, whether copy makes sense | Whether the product is legible to someone who doesn't know what a "pressure point" or "RunPack" is |
| **The skeptical / argumentative person** | Whether claims are actually testable, whether the structure is intellectually honest | Whether the product survives contact with someone who disagrees with its framing; will find UX friction immediately |
| **The mobile user** | The full flow on a phone, probably in a few minutes | Whether the side panel, Builder, and Study mode are usable on a small screen; will not bother with desktop |
| **The real-claim submitter** | Someone who has an actual belief or hypothesis they want to stress-test | Whether the Builder produces something they'd actually share; the highest-value signal for whether the product has a use case |

### What makes someone a good Batch 1 candidate

- You have their direct contact (DM, email, phone) — not just social follows
- They will actually try it, not just say they will
- They will tell you it's confusing if it is — they won't protect your feelings
- They are not likely to share the link publicly without asking
- They are not currently dealing with something that makes a 15-minute product test impossible

### Who not to invite yet

| Type | Why not |
|------|---------|
| **Strangers / cold outreach** | No trust, no direct reply channel, no accountability if they share the link |
| **High-volume social posters** | Risk of public sharing; if they post the link, you have an unsanctioned public launch |
| **People who will forward the invite** | Same risk — "I told my friend to check it out" breaks the closed preview |
| **People currently under heavy stress** | They will not have time to give real feedback and may feel obligated |
| **Anyone you'd be uncomfortable calling to ask a follow-up question** | If the bar for direct contact feels too high, they are not Batch 1 material |
| **People who know you primarily as a critic** | Their feedback will be shaped by wanting to support you, not evaluate the product |

---

## What Each User Should Try

Send this as part of the invite or as a follow-up after they've signed up. From D-191B — condensed here for quick reference.

| Step | Task | Why it matters |
|------|------|---------------|
| 1 | **Browse** the Arena for 2–3 minutes | First impression of whether claims are interesting / legible |
| 2 | **Open a claim** and read the Study tabs | Whether Study mode is self-explanatory |
| 3 | **Vote** (Believe / Reject / Unsure) | Baseline engagement — tests the simplest action |
| 4 | **Add evidence or pressure** | Core contribution flow — tests the side panel, note the invite-aware messaging |
| 5 | **Submit a claim** via the Builder (Steps 1–3) | The most structured flow — tests whether the Builder copy makes sense |
| 6 | **Copy a claim link** and paste it into a new tab | Tests the sharing mechanic and `/c/:id` direct URL |
| 7 | **Check My HumanX** | Whether users can find and understand their own submission history |

Suggested order: in sequence above. Each step takes 2–5 minutes. Total: 15–30 minutes.

Do not require all steps. If a user only does steps 1–3 and replies, that is still useful data. Ask them where they stopped.

---

## Feedback to Collect

Collect after 3–5 days, or whenever the user replies — whichever comes first. From D-191B:

```
What confused you:
What felt useful:
Where you stopped (and why):
Did you try it on a phone? What happened?
One thing you'd change:
```

Additional questions worth asking:

- "Did you understand what 'pressure' meant in the Study context?"
- "Did you find the RunPack / copy packet feature? Did it make sense?"
- "Would you send a claim link to someone? Did that feel natural?"

Do not send a long survey. If you haven't heard back in 5 days, send a one-line follow-up: "Any quick impressions? Even one sentence helps."

---

## Wait Times Between Batches

| Transition | Minimum wait | Condition to proceed |
|------------|-------------|---------------------|
| Batch 0 → Batch 1 | 0 days after dry run passes | Batch 0 complete, D-195A checklist passes |
| Batch 1 → Batch 2 | 5–7 days | All Batch 1 go/no-go criteria met (see below) |
| Batch 2 → broader sharing | 7–14 days | No open P1 bugs, feedback incorporated or triaged |

Do not rush the Batch 1 → Batch 2 transition. The signal from 3–5 people who gave honest feedback is more valuable than 20 people who mostly didn't engage.

---

## Go / No-Go Criteria for Expanding to Batch 2

All of the following must be true:

| Criterion | Check |
|-----------|-------|
| No open P0 bugs from Batch 1 | Nothing broken, no security issues, no data leaks |
| No more than 1 open P1 bug | If 2+ core flows are broken for users, fix first |
| At least 2 of 3–5 Batch 1 users replied with feedback | If fewer than 2 replied, follow up before expanding |
| Review queue not flooded with unfamiliar submissions | No sign that the URL has leaked |
| `node scripts/preview-launch-check.mjs` still passes 22/22 | Run it again before Batch 2 sends |
| Top friction point from Batch 1 is either fixed or explicitly accepted | Do not expand while ignoring a known showstopper |

If all criteria pass: proceed to Batch 2.
If any criterion fails: fix first, then re-evaluate.

---

## Stop Criteria

Stop the preview entirely (pause invites, notify existing users) if:

| Condition | Action |
|-----------|--------|
| P0 security issue found | Pause immediately. Rotate credentials. Fix before resuming. |
| Review queue flooding with clearly non-preview content | Preview URL has leaked. Stop. Identify source before resuming. |
| Backend unreachable for >1 hour | Pause invites. Investigate Cloudflare Worker health. |
| Multiple P1 bugs open simultaneously | Fix before any new invite batch. |
| A preview user shares the link publicly without permission | Reach out to them. Assess whether the public audience is a problem. If yes: pause and address. |

Pausing is not failure. Pausing before a problem becomes a crisis is the correct move.

---

## Operator Daily Routine During Preview

Keep this under 15 minutes per day. From D-191C runbook — condensed:

**Morning (5 min):**
1. Open Review queue with admin token — note pending item count, spot-check for unfamiliar submissions
2. Approve obvious legitimate submissions, reject obvious spam
3. Check for user replies to invite messages

**As replies arrive (2 min each):**
1. Acknowledge receipt immediately ("Thanks — logged")
2. Log the feedback in your private feedback doc (from D-193A format)
3. Triage severity: P0 / P1 / P2 / P3

**Every 2 days (5 min):**
1. Compare debug-state counters (`claimVotes`, `home_tests`, `aip_packets`) to previous snapshot
2. Note any pattern in feedback (same friction mentioned twice → P1 regardless of original severity)

**Before Batch 2 send:**
1. Re-run `node scripts/preview-launch-check.mjs`
2. Run through D-195A deployment checklist
3. Confirm go/no-go criteria above

---

## Invite Code Logistics

- One code per user. Do not reuse codes.
- Keep a private log: name → code → sent date → replied date.
- Do not put admin token or owner secret anywhere near the invite log.
- If a user forwards their invite to someone without asking, treat the forwarded user as a surprise Batch 1 addition — reach out, establish contact, and watch the Review queue for their submissions.

---

## What Success Looks Like at Batch 1 Close

You do not need everyone to love it. Success at Batch 1 is:

- At least 2 of 3–5 users tried the contribution flow (evidence, pressure, or claim submission)
- You understand the single biggest point of confusion
- No P0 or unresolved P1 bugs remain open
- The Review queue has at least a few real submissions to approve
- You have enough signal to decide whether to fix something before Batch 2 or proceed as-is

If you can answer "what was the most confusing thing for Batch 1 users?" you have a successful Batch 1, regardless of how positive or negative the feedback was.
