# D-191B — Preview User Invite Pack

**Date:** 2026-06-28
**HEAD at creation:** `e206bcc`
**Audience:** Operators sending invites to trusted preview users

---

## Before You Send

Run the preflight script and confirm 22/22 PASS:

```sh
node scripts/preview-launch-check.mjs
```

Only send if it exits 0. See `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` for the full manual checklist.

---

## Short Invite Message

> Subject: HumanX preview — invite + code inside
>
> Hey [name],
>
> I'd like you to try HumanX. It's a tool for stress-testing claims — you pick something testable, attach evidence for and against, and it generates a structured brief you can share or think with.
>
> It's early. Some things are rough. That's why I'm sending it to you specifically, not blasting it out.
>
> **Your invite code:** `[CODE]`
> **Link:** [URL]
>
> Redeem the code in the ◎ account button at the top right. You can browse without redeeming, but the code ties your contributions to your profile.
>
> Try it for 10–15 minutes, then reply with what confused you, what felt useful, and where you stopped. That's it.
>
> Thanks

---

## Longer Invite Message

> Subject: HumanX early preview — feedback welcome
>
> Hey [name],
>
> I've been working on something I'd like you to look at. It's called HumanX — an early-stage tool for making claims testable and structured.
>
> **What it does:** You pick a claim ("Coffee improves cognitive performance", "Remote work reduces team cohesion", anything testable). HumanX gives it a study structure — evidence for, pressure against, test conditions, analysis. At the end you can generate a RunPack: a shareable brief with everything organized. The idea is to make it harder to argue from vibes and easier to see what you actually know.
>
> **Why I'm sending it to you:** This is a closed early preview. The core loop works. The design is rough in places. I'd rather get honest feedback from someone I trust than polish it in the dark.
>
> **Your invite code:** `[CODE]`
> **Link:** [URL]
>
> To redeem: click ◎ in the top right, paste the code. You can try everything without redeeming, but the code attaches your submissions to your profile so you can track what you've added.
>
> **What I'd like you to try:**
> 1. Browse the existing claims
> 2. Open one and read the study
> 3. Vote on whether you believe it
> 4. Add a piece of evidence or pressure (counterargument)
> 5. Submit a claim of your own
> 6. Copy the link to a claim and send it to yourself
>
> **What I'd like to hear back:**
> - What confused you immediately?
> - What felt actually useful?
> - Where did you stop and why?
> - Did anything feel sketchy or untrustworthy?
> - Did you try it on a phone? What happened?
>
> No need for a long reply. A few lines is fine. I'll follow up if I have questions.
>
> Thanks for taking the time.

---

## What HumanX Is — Plain Words

For users who ask before clicking:

> HumanX is a tool for stress-testing claims. You take something you want to believe or argue — a hypothesis, a business decision, a contested fact — and put it through a structured study: evidence for, counterarguments against, conditions that would prove or disprove it, and a final analysis. The result is a brief you can share or revisit. It's not AI-generated opinions — it's a structured way to organize what you and others actually know about a question.

---

## What Preview Users Should Try

Include this as a numbered list in your invite, or as a follow-up after they've signed up.

### 1. Browse claims (2 min)
Open the link. The Arena is the default view — a list of existing claims. Read a few. Notice the structure: claim text, tags, vote counts.

### 2. Open a claim — Study mode (5 min)
Click any claim. Study mode opens. Explore the tabs:
- **Evidence** — supporting content
- **Pressure** — counterarguments
- **Tests** — conditions that would falsify or confirm
- **Analysis** — written verdict

### 3. Vote (30 seconds)
Pick Believe, Reject, or Unsure. A toast confirms your vote. (Note: the button won't highlight after voting — known visual gap.)

### 4. Add evidence or pressure (3 min)
In the side panel on the right, add a piece of evidence or a counterargument. It goes into the Review queue — you won't see it immediately on the public study, but you'll see it in your My HumanX page.

### 5. Add a test (1 min)
Tests are conditions that would confirm or disprove the claim. These appear immediately (no review wait).

### 6. Submit a claim (5 min)
Click "Build a Claim" and walk through the three-step builder. The claim goes to review before it's public.

### 7. Copy a claim link (30 seconds)
In Study mode, click "Copy link". Paste it in a new tab or send it to yourself. It should open the study directly.

### 8. Check My HumanX (1 min)
Click "My HumanX" in the nav. Your contributions, votes, and pending items are listed here.

---

## Feedback Questions

Ask these directly, or paste them into your invite message. Short answers are fine.

| # | Question | What you're learning |
|---|----------|---------------------|
| 1 | What confused you immediately? | First-impression friction |
| 2 | What felt actually useful? | Core value hypothesis |
| 3 | Where did you stop, and why? | Drop-off points |
| 4 | Did anything feel sketchy or untrustworthy? | Trust signals / red flags |
| 5 | Did you try it on a phone? What happened? | Mobile experience |
| 6 | Did you try to share something? Was it obvious how? | Sharing discoverability |
| 7 | If you were going to use this seriously, what's the first thing you'd want to be different? | Highest-priority gap |

---

## Simple Feedback Reply Format

Give users this template to make replies easy:

```
Confused by: 
Found useful: 
Stopped at: 
Phone: [yes/no — issues?]
One thing I'd change: 
```

---

## Known Limitations to Disclose

Be upfront about these. Hiding them wastes trust.

| Limitation | What to tell users |
|------------|-------------------|
| **Early preview** | This is an early working preview. Some things are unfinished. That's expected. |
| **Review is manual** | Evidence, pressure, claims, and truths go into a moderation queue. They won't appear publicly until reviewed. This may take time. |
| **Invite and profile system is basic** | Invite codes are shared directly, one by one. There's no waitlist, no self-serve signup, no password recovery. |
| **Vote state not shown** | After voting, the vote buttons don't visually show which one you picked. Your vote is recorded — it just doesn't highlight. |
| **Mobile not fully polished** | It works on phones but the side panel can end up below the fold. Best experienced on desktop or a large tablet. |
| **Not ready for public sharing** | Please don't post the link publicly or share it beyond people you trust. This is a closed preview. |
| **No feedback form in the app** | There's no in-app way to report bugs. Reply to this message directly. |

---

## Operator Notes

**Before sending any batch:**

1. Run `node scripts/preview-launch-check.mjs` — all 22 checks must pass
2. Run through the P0 manual checks in `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md`
3. Confirm the Worker is deployed (`wrangler deploy` completed cleanly)
4. Have a valid invite code ready for each user — codes are distributed manually

**During the preview period:**

- Send to trusted users only. Do not post the link publicly.
- Check the Review queue regularly (admin token required). Submissions from preview users will queue here.
- Track reported bugs in a separate note or doc — there's no in-app issue tracker.
- If a user hits something broken before you've fixed it, reply promptly. Early users have low tolerance for silence on bugs.

**After each feedback round:**

- Note which friction points came up more than once — those are the highest-priority fixes
- Check whether any submission spam hit the Review queue from unexpected sources
- Decide whether to expand the next batch or fix first

---

## Invite Code Tracking

Keep a simple log. Example format:

| Name | Code | Sent | Replied | Notes |
|------|------|------|---------|-------|
| [name] | [code] | [date] | [date] | |

Don't store invite codes in this file if the repo is private but you share docs externally. Use a separate private note.
