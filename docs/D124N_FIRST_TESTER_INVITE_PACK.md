# D-124N — First Guarded Tester Invite Pack: Belief Engine v2

**Date:** 2026-06-14  
**Branch:** docs/d124n-first-tester-invite-pack  
**Mode:** Docs only — no code changes, no deploy, no Wrangler, no D1, no admin token.  
**Status:** Guarded internal beta. Not a public launch. Max 1–3 trusted testers.

---

## 1. Current Status

| Item | State |
|---|---|
| Belief Engine v2 upgrade chain (D-124B–I) | Complete |
| Post-deploy owner smoke (D-124M) | PASS WITH NOTES |
| No-token/incognito Review gate | Owner confirmed OK |
| Tester invites | Authorised for 1–3 trusted testers |
| Public launch | Not yet |

**Do not share the canonical URL publicly. Do not use the Worker origin URL in any tester-facing message.**

---

## 2. Tester Invite Message

Use either version below. Copy, personalise the opening, send via direct message or email.

---

### Short version

> Hey — I've been building a small tool called HumanX. One part of it is a Belief Engine: you answer a set of questions about a belief, and it maps how that belief works for you — where the certainty comes from, where the pressure is, what might change your mind.
>
> It's not a quiz. It doesn't tell you what to believe or whether you're right. The result is more like a map than a score.
>
> Everything runs in your browser. Nothing leaves your device unless you choose to send it.
>
> I'd love to know if any part of it was confusing, felt off, or surprised you. No right answers. No time pressure.
>
> Link: https://humanx.rinkimirikata.com
>
> Start with the Belief Engine — there's a card for it on the home page. Let me know what you think.

---

### Longer version

> Hey — I've been quietly building a tool called HumanX. I'm at the point where I'd like a few people to try it and tell me what's confusing.
>
> The main thing to try: the Belief Engine. It's a private in-browser tool that maps the structure of a belief — where certainty comes from, what kind of pressure it survives, what might change your mind. It's not a test. It doesn't score your worth. It doesn't tell you what's true. The result is a map, not a verdict.
>
> Here's how to try it:
> 1. Open https://humanx.rinkimirikata.com
> 2. Click the Belief Engine card on the home page
> 3. Complete the questions (takes 10–20 minutes — you can skip the identity and timeline sections if you want)
> 4. Read the result
> 5. Optionally click "Send to HumanX" at the end — it saves a private snapshot to your session, nothing is published
>
> A few things worth knowing:
> - Your answers stay in your browser. Nothing is sent anywhere unless you explicitly click "Send to HumanX."
> - The written questions (the timeline section) stay local even if you do send.
> - If you close and come back, "View previous results" will show your last run.
> - "Clear" removes the saved result from your browser.
> - "Start Over" resets the quiz and clears the saved result.
>
> If you want to see the rest of the app: Claims and Truths are public; Submit puts a statement into review before it becomes public. Don't try the Review tab — that's for me.
>
> I'm not asking you to test everything. I just want to know: did the Belief Engine make sense? Did anything feel weird, confusing, or like a diagnosis? Was it clear that your answers stay private?
>
> Link: https://humanx.rinkimirikata.com
>
> Please don't share this link publicly yet — I'm keeping the first round small.

---

## 3. Tester Instructions

Share these with your tester (or paste into a follow-up message after the invite). Keep it short — these cover the basics without overwhelming.

---

> **What to do:**
>
> 1. Open https://humanx.rinkimirikata.com
> 2. Click the **Belief Engine** card on the home page
> 3. Read the intro — click **Begin Mapping**
> 4. Complete the questions. You can skip the identity and timeline sections if you prefer.
> 5. Read your result on the screen
> 6. *(Optional)* Click **Send to HumanX** at the end — this saves a private snapshot to your session. It does not publish anything. The note above the button explains what gets sent.
> 7. *(Optional)* Come back later and click **View previous results** to see if your saved result appears
> 8. *(Optional)* Try **Clear** to delete the saved result from your browser
> 9. *(Optional)* Try **Start Over** from the result screen — this resets the quiz and clears the saved result
> 10. *(Optional)* Try it on a phone if you have one
>
> **Do not:**
> - Submit real personal information you would not want a stranger to read
> - Try to access the Review tab — it requires a token you don't have
> - Share the link publicly
>
> **Privacy note:** Your written answers (the timeline questions) stay in your browser only — they are never sent anywhere, even if you click "Send to HumanX." If you're uncomfortable sharing screenshots of your results, you don't have to. The result screen is personal.

---

## 4. Feedback Questions

Ask these after the tester has tried it. Send them as a list and ask for a few sentences on each, or just talk through them.

**Result and framing**
1. After reading the result, what did you think it was telling you? (A map of how the belief works? A score? A diagnosis? Something else?)
2. Did any word or phrase on the result screen feel like a judgement of you as a person, or like the tool was deciding whether your belief was right?

**Privacy**
3. Before you clicked anything, was it clear that your answers stay in your browser and nothing is sent automatically? At what point did you feel sure of that — or did you not feel sure?
4. If you used the timeline/written questions section: did you notice the note saying that text stays local and is not included in any snapshot? Did you believe it?

**Controls**
5. Did Clear and Start Over do what you expected? Were you surprised by anything they did?
6. Was "View previous results" useful, or did it feel risky to have your answers saved locally?

**Usability and mobile**
7. Did any button, label, or section confuse you about what it would do?
8. If you tried on mobile: was it usable? Did anything overflow, break, or feel too small to tap?

**General**
9. Did anything feel unsafe, too personal, or like it was extracting something from you that you didn't expect?
10. What's your one-sentence description of what the Belief Engine does?

---

## 5. Owner Rules

Read before sending any invite.

- **Invite max 1–3 people.** Keep the first wave small. You need to be able to read and respond to every piece of feedback personally.
- **Trusted people only.** These are not anonymous public testers. Choose people who will be honest, who you can ask follow-up questions, and who won't share the link.
- **Do not give out the admin token.** Testers should not be able to see the Review queue or moderate submissions.
- **Do not ask testers to use the Review tab.** Explicitly tell them it is not for them.
- **Do not share the Worker origin URL** (`https://humanx.veltrusky-michal.workers.dev`) in any invite or instruction message. It is a technical fallback for the owner only.
- **Collect feedback manually.** Email reply, DM, or a call. Do not set up a public feedback form for this wave.
- **Do not approve tester submissions without reading them.** The Review queue is the only moderation gate before content becomes public. Check it after each tester session.
- **Do not publish any tester-provided content** (screenshots, quotes, feedback text) without explicit consent from the tester.

---

## 6. Feedback Capture Template

Use this to record notes from each tester after they reply. One copy per tester. Keep it in a private doc or message thread — not committed to the repo.

```
Tester: [name or nickname — do not use real name in any shared doc]
Date tested: 
Device: 
Browser: 

Completed Belief Engine run?  yes / no / partial (stopped at: _____________)
Used timeline/written questions section?  yes / no / skipped
Clicked "Send to HumanX"?  yes / no / did not notice it
Tried saved results / View previous results?  yes / no
Tried Clear?  yes / no
Tried Start Over?  yes / no
Tried on mobile?  yes / no  (device: _____________)

--- Feedback summary ---

Q1 (what did result tell you):
Q2 (judgement language):
Q3 (privacy clarity):
Q4 (timeline note):
Q5 (Clear / Start Over):
Q6 (View previous results):
Q7 (confusing buttons):
Q8 (mobile):
Q9 (unsafe / extractive):
Q10 (one-sentence description):

--- Issues ---

Issue 1:
  What happened:
  Where (screen/step):
  Severity: blocker / friction / copy / idea

Issue 2:
  What happened:
  Where (screen/step):
  Severity: blocker / friction / copy / idea

(add more as needed)

--- Overall impression ---
[Tester's own words, if they gave a summary]

--- Owner notes ---
[Anything you noticed that the tester didn't name explicitly]
```

**Severity guide:**
- **blocker** — tester could not complete the intended action; something is broken or deeply confusing
- **friction** — tester completed the action but it took effort or caused hesitation
- **copy** — wording was confusing, misleading, or felt wrong; no functional breakage
- **idea** — tester suggested something new; not a complaint about existing behaviour

---

## 7. Stop Conditions

Pause the tester wave and file a new task (D-124O or equivalent) immediately if any of the following occur:

| Condition | Why it matters |
|---|---|
| Any tester believes the result is a diagnosis, proof, or verdict about them | Core framing failure — must fix before inviting more testers |
| Any tester is confused about whether Send-to-HumanX publishes their data | Privacy misrepresentation — must fix before inviting more testers |
| Any tester finds "View previous results" or Clear behaves unexpectedly in a way they consider a bug | Saved-result flow regression — investigate before inviting more testers |
| Mobile is reported as unusable (overflow, text unreadable, buttons untappable) | UI regression — investigate before inviting more testers |
| Any tester describes the experience as extractive, surveillance-like, or unsafe in a way that persists after reading the privacy notes | Framing/copy issue — may need design change before wider rollout |

A single piece of friction or a copy confusion note is not a stop condition — collect it and triage in D-124O.

---

## 8. After the First Wave — Next Task

When 1–3 testers have responded (or after two weeks, whichever comes first):

**File D-124O — Tester Feedback Triage.**

That task should:
1. Compile all feedback capture templates into a single view
2. Classify each issue by severity (blocker / friction / copy / idea)
3. Identify any stop conditions that were triggered
4. Recommend a fix list before the second wave or wider rollout
5. Update D-123A tester launch pack if any instructions need revision

Do not invite additional testers until D-124O triage is complete and any blockers are resolved.

---

## Files Changed

| File | Change |
|---|---|
| `docs/D124N_FIRST_TESTER_INVITE_PACK.md` | Created (this file) |
| `docs/README.md` | D-124N pointer added to Current Status section |
