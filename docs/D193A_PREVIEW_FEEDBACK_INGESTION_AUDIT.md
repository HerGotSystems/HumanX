# D-193A — Preview Feedback Ingestion Audit

**Date:** 2026-06-28
**HEAD at audit:** `f2869c2`
**Baseline:** 1589/24/57
**Scope:** Process/workflow audit. No code changes.

---

## Core Principle

For 5–20 named users you already trust, the feedback system should cost less to run than the feedback itself is worth. A shared doc and a dedicated email thread beat any ticketing system at this scale. The goal is capture speed and zero overhead, not reporting fidelity.

---

## Current Feedback Channels

These exist today without any new tooling:

| Channel | What comes through it | Useful for |
|---------|-----------------------|------------|
| **Direct reply to invite message** | Freeform impressions, confusion, praise, bugs | First impressions, friction, UX |
| **Screenshots** | Visual bugs, layout issues, unexpected states | P0/P1 bugs, mobile issues |
| **Copied claim links** | User sharing a specific claim they found interesting or broken | Usage confirmation, sharing flow test |
| **Review queue** | All evidence/pressure/claim/truth submissions from preview users | Contribution loop health, spam detection |
| **debug-state counters** | `claimVotes`, `home_tests`, `aip_packets` deltas | Engagement breadth without direct contact |
| **Direct conversation** | Chat, call, or follow-up thread with a specific user | Deep dive on specific friction |

---

## What Breaks Down at 5–20 Users

At 5 users you can hold everything in your head. At 20, with 3–4 replies per user and 2–3 follow-ups, you have 60–80 data points across multiple threads in multiple channels. Without a single place to land them:

- The same bug gets reported 4 times; you fix it in the 4th reply without realizing it was already logged from the 1st
- A friction point mentioned by 3 users gets lost because each was in a separate DM thread
- A P1 bug is buried between two P3 cosmetic notes in one long email reply
- You can't tell at a glance what's been acknowledged vs. open vs. fixed
- Pattern-matching across users is impossible because you can't see all reports side by side

The breakdown is not complexity — it's loss of cross-user visibility.

---

## What Needs Structured Capture vs. What Can Stay Informal

### Keep informal

- First impressions and general praise/criticism — log the theme, not the exact quote
- Feature requests that are clearly out of scope for the preview — note them once, don't over-structure
- Follow-up conversations after a bug is acknowledged — those are relationship, not process
- One-line "I tried it, here's what I think" replies — read them, extract the one signal, log it

### Needs structured capture (even lightweight)

- **Reproducible bugs** — needs: what flow, what device/browser, what happened, what was expected
- **Copy/messaging confusion** — needs: which screen, exact copy shown, what the user thought it meant
- **Blocked flows** — needs: where they stopped and why, so you can compare across users
- **Spam or unexpected submissions** — needs: when, what content, which route, action taken
- **Invite redemption failures** — needs: error shown (if any), whether they retried, resolution

The test: if the same issue came in from a second user tomorrow, would you know whether you already have it logged? If not, it needs a record.

---

## Recommended Workflow

### The setup (one time, before sending invites)

1. Create a private document titled `HumanX Preview Wave 1 — Feedback Log` (local file, private note, or wherever you keep working notes — not in the repo)
2. Create one section per severity tier: **P0 / P1 / P2 / P3 / Feature Requests**
3. Create a row template (see below)
4. Pin the invite list alongside it so you can cross-reference user → report

That's the entire setup. No tool installation required.

### Per-report routine (under 2 minutes per item)

When a user sends feedback:

1. **Acknowledge immediately** — "Thanks, logged" or "On it" — even if you haven't read it carefully yet. Preview users stop reporting if they feel their reports disappear.
2. **Triage severity** — P0/P1/P2/P3 (see definitions below). If unclear, default one level higher.
3. **Log one row** in the feedback doc — use the row template below.
4. **If P0 or P1:** stop what you're doing and investigate before the next user interaction.
5. **If P2 or P3:** log it and continue. Review P2s before the next invite batch.

### End-of-day review (5 minutes)

- Is anything unacknowledged? Reply first.
- Any P0/P1 open without a resolution plan? Prioritize.
- Any issue reported by more than one user? Move it to the top of P1 or P2 as appropriate.

---

## Feedback Row Template

Paste this for each logged item:

```
Date:        [YYYY-MM-DD]
User:        [name or identifier — match to invite log]
Channel:     [reply / DM / screenshot / call / other]
Device:      [desktop/mobile, browser if known]
Flow:        [Home / Arena / Study / Builder / Evidence / Profile / Review / Other]
Issue:       [one plain sentence — what went wrong or what confused them]
Severity:    [P0 / P1 / P2 / P3 / FR]
Screenshot:  [link or filename, or "none"]
Status:      [Open / Acknowledged / Fixed in D-XXX / Won't fix / Explained]
```

Keep it flat. No sub-bullets. One issue per row. If a user sends 3 things in one message, log 3 rows.

---

## Severity Definitions

Consistent with `docs/D191C_PREVIEW_OPERATOR_RUNBOOK.md`:

| Level | Definition | Action |
|-------|-----------|--------|
| **P0** | App broken, security issue, token/credential visible, data corruption, backend down for all users | Fix immediately. Pause new invites until resolved. Notify affected users. |
| **P1** | Core flow blocked — user cannot browse, vote, submit, share, or redeem invite. Works for some users but not all. | Fix within 24 hours. Acknowledge to affected user immediately. |
| **P2** | Confusing, annoying, or misleading — but user can work around it. Includes copy mismatch, visual gaps, mobile friction. | Fix before next invite batch. |
| **P3** | Polish, cosmetic, minor wording. No functional impact. | Backlog. Address when a natural refactor touches the area. |
| **FR** | Feature request — not a bug, not confusion, just "I wish it did X." | Log once. Do not commit to timeline. |

### What counts as P0 (be strict here)

- Admin token or invite code visible in any UI, error message, or network response
- User A can read User B's private submissions or profile data
- Backend returning 500 with internal path or stack trace visible to user
- Rate limits completely non-functional (submissions bypassing without throttle)
- App completely unresponsive for all users (not just one browser)

If you are unsure whether something is P0, treat it as P0 until you've verified it isn't.

---

## Feedback by Type

### Bugs

Capture: flow, device/browser, what happened, what was expected, screenshot if available.

For reproducible bugs: try to reproduce before logging the fix. "User said X broke" is not the same as "X is broken." Ask for steps if the report is vague.

For intermittent bugs: log the report, note it's unconfirmed, and watch for a second report. One unconfirmed intermittent is a watch item, not a fix item.

### Confusion / Friction

The most valuable feedback type at this stage. Capture: which screen, what copy was shown, what the user thought it meant or expected to happen.

Do not explain it away immediately. "Oh that's because..." is the wrong first response. Log it first. If 2+ users are confused by the same thing, it's a P2 regardless of how clear it seems to you.

### Feature Requests

Log them as FR. Do not promise anything. A useful response: "Good idea — noted for later. For now, here's how to work around it: [X]."

During a first preview, feature requests are lower signal than confusion. Users who are confused won't tell you they want more features — they'll just stop using it.

### Moderation Issues

Suspicious Review queue content that doesn't match any known preview user's stated interests:

1. Do not approve it
2. Note the submission timestamp, content type, and approximate content
3. Cross-reference with `rate_limits` count in debug state — did rate limiting fire?
4. If it looks like targeted abuse rather than anon spam: reject and watch for recurrence
5. If it persists: consider whether the preview URL has leaked beyond the intended group

### Spam / Abuse

If the Review queue starts filling with low-quality or clearly automated submissions:

1. Reject without engaging
2. Note volume and timing in the feedback log (not per-user, just "wave of N submissions between [time] and [time]")
3. Check Cloudflare Access Logs (if available) or `rate_limits` table for IP clustering
4. If it's sustained: the preview URL has likely leaked — stop sending new invite codes until source is identified

Do not attempt to identify or ban individual anon users based on content alone. The review gate is the mechanism — use it.

---

## Metadata That Is Actually Useful

| Metadata | Why |
|----------|-----|
| Device / browser | P2s that are "only on mobile" or "only on Firefox" need different fixes than universal issues |
| Which flow | Lets you spot which surface generates the most confusion |
| Channel (how they told you) | If all feedback comes through one channel, you're missing users who don't use that channel |
| Date reported | Lets you identify whether issues cluster in the first 24h (first impressions) vs. later (deeper use) |
| Whether a second user reported the same thing | The most important signal for prioritization |

## Metadata That Is NOT Useful

| Metadata | Why not |
|----------|---------|
| Exact quote from user | Paraphrase is faster to scan and avoids making users feel surveilled |
| Time spent on each screen | You don't have this; don't try to estimate it |
| Which claim they were looking at | Unless the issue is claim-specific (broken link, missing content), the specific claim is noise |
| Demographic info | Irrelevant for product triage at this scale |
| How they felt about it emotionally | "They seemed frustrated" adds noise; log the friction, not the emotion |

---

## Escalation Rules

| Situation | Action |
|-----------|--------|
| Same issue reported by 3+ users | Treat as P1 regardless of original severity |
| Any security-category issue | Treat as P0 immediately, even if not yet confirmed |
| User stops responding after reporting a P1 | Follow up once. If no reply in 48h, assume resolved or disengaged. |
| User asks "when will X be fixed?" | Give an honest answer: "Working on it / After this wave / No timeline yet." Never promise a date unless you are certain. |
| User finds something that looks like another user's data | Treat as P0. Investigate immediately. Do not confirm or deny until you know what happened. |

---

## What Should NOT Be Collected

- Full message transcripts from users (paraphrase is sufficient)
- Names or identifiers linked to specific bug reports in any place that could leak (keep your feedback doc private)
- IP addresses or device fingerprints (you don't have them; don't go looking)
- Any attempt to infer a user's broader behavior from their feedback content
- Screenshots containing personal information the user didn't intend to share (blur or crop before storing)

---

## On Using HumanX Itself for Feedback

Later — not during the first preview wave. The idea (submitting bugs or friction points as HumanX claims, with evidence/pressure) is genuinely interesting but introduces a bootstrapping problem: you need the product to be stable and clear before users can articulate structured feedback inside it. During wave 1 the product is still being validated. Freeform replies are more honest and faster to send than structured claim submissions.

A reasonable trigger for this: after the product has been stable for a second user cohort and users are comfortable with the contribution loop. At that point, a `#feedback` claim category or a dedicated feedback study could work. That is D-193B territory at the earliest.

---

## When to Move Beyond Manual Handling

Manual handling is sufficient until one of these is true:

- More than 20 active preview users at once (volume exceeds what one person can scan in under 10 min/day)
- More than 3 P1 bugs open simultaneously (coordination overhead exceeds informal method)
- Multiple operators need to share triage (a single doc stops working when two people edit it concurrently)
- A user has reported the same issue twice without acknowledgment (a system failure, not a volume problem)

At that point, a shared lightweight issue tracker (GitHub Issues on a private repo, Linear free tier, or a structured Notion table) is the right move. Do not add that infrastructure before you need it — it costs setup time and operator attention during the period when you most need to be talking to users.

---

## Recommended Feedback Template for Users

Include this in your follow-up message after a user has tried the product:

```
If you have feedback, feel free to reply in this format (or just write freely — I'll sort it):

What confused you:
What felt useful:
Where you stopped:
Bug or broken thing (if any):
Device / browser:
```

Short enough that users actually fill it out. Free-form replies are fine — this just gives them a starting point.

---

## D-193B Recommendation

**D-193B is not needed before the first preview wave. Defer.**

The manual workflow above is sufficient for 5–20 users. D-193B would be appropriate if:

1. Wave 1 generates more feedback volume than the manual system handles (unlikely at 5–20 users)
2. The team expands beyond one operator managing feedback
3. There's a strong case for using HumanX itself as a feedback container (after wave 1 validates the contribution loop)

If D-193B happens, it should be limited to: a private GitHub Issues label convention, or a single Notion table template — nothing that requires installing new software or creating new accounts before the preview is underway.

**The right order:** Send invites → collect feedback manually → after wave 1 closes, decide whether D-193B is warranted based on actual volume and pattern.
