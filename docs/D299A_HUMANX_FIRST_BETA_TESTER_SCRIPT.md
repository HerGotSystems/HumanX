# D-299A — HumanX First Beta Tester Script

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3462 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-02
**HEAD at creation:** `369bb78` (D-298A)

---

## 1. Purpose

This test is not to prove HumanX is perfect. It is to find where a first-time user gets confused — before that confusion becomes permanent in more testers.

One person, one session, no explanation from Mike. The goal is observation, not validation.

---

## 2. Rule for Mike

**Do not explain the app during the first run.** If the tester asks what something means, say:

> "What do you think it means?"

Only intervene if the tester is completely stuck and has stopped for more than 60 seconds. Then say:

> "What would you try next if you had to guess?"

At the start of the session, say only:

> "Please open HumanX and try to work out what it does. Say out loud what you think each part means."

Do not use words like "claim", "truth", "review", "RunPack", or "belief engine" before the tester encounters them.

---

## 3. Tester Start Message

Send this to the tester before the session:

---

> Can you test something I am building? It is called HumanX. It is a claim/thought-checking app. I do not want you to be polite — I need to know where it is confusing.
>
> Please open it, try the "Start here" steps, submit one simple claim, and tell me where you got stuck.
>
> The link is: **https://humanx.rinkimirikata.com**
>
> No preparation needed. Just open it and react honestly.

---

## 4. Tester Task List

Give the tester this list at the start. Do not read it out — hand it to them or paste it in chat.

```
1. Open HumanX.
2. Read the Home screen without clicking anything.
3. Say out loud what you think HumanX does.
4. Follow the "Start here" steps in order.
5. Submit one simple claim or belief (use a safe, everyday example).
6. After submitting, find where it appears.
7. Open My HumanX.
8. Find the Review badge on your submitted item.
9. Explain out loud what you think "Review" means.
10. Find Profile Settings or your public profile.
11. When you get stuck or confused, say so — don't push through silently.
```

---

## 5. Suggested Test Claims

If the tester asks what to submit, offer one of these. They are safe, everyday, opinion-neutral:

| # | Suggested claim |
|---|----------------|
| 1 | Walking every day improves health. |
| 2 | Social media makes people more anxious. |
| 3 | Coffee helps people focus. |
| 4 | Most people do not check sources before sharing claims. |
| 5 | Children learn better when they are curious. |
| 6 | A clean room helps concentration. |
| 7 | Music can change your mood. |
| 8 | People trust simple explanations more than complicated ones. |

Do not suggest political, medical, legal, financial, extremist, or inflammatory claims.

---

## 6. Observation Sheet for Mike

Complete this in real time during the session. One row per noteworthy moment.

| Moment | What tester clicked | What tester expected | What actually happened | Confusion level (1–5) | Exact words tester said | Fix idea |
|--------|--------------------|--------------------|----------------------|----------------------|------------------------|---------|
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

**Confusion scale:**

| Level | Meaning |
|-------|---------|
| 1 | Brief pause, figured it out |
| 2 | Slight hesitation, needed a moment |
| 3 | Noticeably stuck, tried wrong thing |
| 4 | Gave up on that step, moved on |
| 5 | Stopped completely, needed help |

---

## 7. Questions to Ask After the Test

Ask these in order after the session ends. Write down the exact answers — do not paraphrase.

| # | Question |
|---|---------|
| 1 | What did you think HumanX was for? |
| 2 | What was the first thing you wanted to click? |
| 3 | Did the "Start here" steps make sense? |
| 4 | Did you understand the difference between Claim and Truth? |
| 5 | Did you understand what Review meant? |
| 6 | Did you understand what My HumanX was? |
| 7 | Did anything feel scary, confusing, or pointless? |
| 8 | What would make you trust it more? |
| 9 | Would you use it again? |
| 10 | In one sentence — how would you explain HumanX to someone else? |

---

## 8. Success Criteria

HumanX is beta-ready for more testers if the tester can do all of the following without Mike explaining:

| Criterion | Confirmed? |
|-----------|-----------|
| Explain the app in one sentence | |
| Submit one claim or truth | |
| Find My HumanX | |
| Understand that Review means waiting for admin approval | |
| Complete the basic flow without a live walkthrough from Mike | |

All five must be met to call this a pass.

---

## 9. Failure Criteria

The app still needs targeted work if the tester hits any of the following:

| Failure | Indicates |
|---------|-----------|
| Cannot tell what HumanX does from the Home screen | Home copy or hero needs work |
| Does not know what to click first | "Start here" steps unclear or invisible |
| Does not understand Review | Step 5 or Review badge copy not landing |
| Cannot find submitted item after submitting | Post-submit navigation or My HumanX unclear |
| Thinks saved analysis is public | Privacy framing gap |
| Thinks Review is automatic verification | Review copy implies machine approval |
| Thinks HumanX proves things without evidence | Core framing issue — "does not decide what is true" not landing |

---

## 10. Next-Action Rules After the Test

| Situation | Action |
|-----------|--------|
| Tester understands the app and passes success criteria | Run two more tests before changing anything |
| Tester gets stuck in one specific place | Create a product pass for that exact friction point |
| Tester gets stuck in the same place twice across two tests | That is a confirmed blocker — fix it |
| Tester gives vague feedback ("feels weird") | Note it, do not act on one vague opinion |
| Tester suggests a new feature | Note it, do not implement it — this is a confusion pass, not a feature request session |
| Tester passes but suggests one copy change | Acceptable to fix if it addresses repeated confusion |

**Do not add features based on a single beta test.** Only fix repeated, concrete confusion.

---

## Notes for Mike

- Run this with one person first. Do not send to more than one person at the same time.
- An invite code may be required depending on current access settings — confirm before sending the link.
- Do not record audio or video unless the tester explicitly agrees.
- Write down quotes verbatim — paraphrasing loses the signal.
- If the tester never finds My HumanX, that is the most useful data point of the session.
- If the tester asks "is this AI?" — say: "HumanX does not decide what is true. You decide what to submit."
