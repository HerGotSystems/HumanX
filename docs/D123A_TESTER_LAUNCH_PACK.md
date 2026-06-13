# D-123A — Tester Launch Pack

**Date:** 2026-06-13  
**Amended:** 2026-06-13 (D-123B — canonical URL corrected; launch status updated to not-yet-inviting)  
**Canonical public URL:** https://humanx.rinkimirikata.com  
**Worker origin (technical fallback only):** https://humanx.rinkimirikata.com  
**Version:** Guarded internal beta — owner review only. External tester invites not yet issued.  
**Mode:** DOCS ONLY — no mutation, no deploy, no admin token.

> **Status note (D-123B):** This pack is drafted and ready but invites are not being sent yet. The canonical public URL has been corrected to `humanx.rinkimirikata.com`. The next phase is improvement work before external testers are invited. When ready, use this pack with the corrected URL below.

---

## 1. Short Invite Message

> **HumanX — early beta, invitation only**
>
> I'm testing a small tool for mapping beliefs — not checking if they're right, just seeing how they're structured.
>
> You can browse public claims, add evidence, or run the Belief Engine privately in your browser.
>
> Link: https://humanx.rinkimirikata.com
>
> It's rough. Nothing is permanent. Tell me what feels confusing.

---

## 2. Longer Invite Message

> **HumanX — early beta**
>
> I've been building a tool called HumanX. It's a system for mapping the structure of beliefs — where they come from, what pressure they survive, what could change them. It does not judge whether a belief is correct. It records what gets asserted as true and lets people pressure-test it with evidence.
>
> It's early. The interface is functional but not polished. There are rough edges.
>
> Here's what you can do:
> - Browse Claims: public statements people submitted for pressure-testing
> - Browse Truths: things people repeat as true (repeated assertion — not verified fact)
> - Study a Claim: read the evidence, pressure points, and votes attached to it
> - Submit a Claim: write a precise, testable statement and send it for review
> - Run the Belief Engine: a private in-browser tool that maps how a belief is structured — no data is sent unless you choose to
>
> A few things it is not: it's not a fact-checker, not a debate forum, not a diagnosis tool, and not an AI that decides what's true. It records and organises what gets asserted — that's it.
>
> Link: https://humanx.rinkimirikata.com
>
> If you try it, I'd love to know: what was confusing, what felt wrong, what you'd want to do that you couldn't.
>
> Don't share this link publicly yet — I'm keeping the tester group small for now.

---

## 3. Tester Instructions

### What this is

HumanX is a tool for mapping beliefs — not deciding which ones are true. It's pseudonymous (no account, no password, no real name required). Everything you submit goes through a Review queue before becoming public.

### What to try

Follow this route in order:

1. **Home** — read the card descriptions. You'll see what each section does.
2. **Claims** — browse the list of public claims. These are statements people submitted for pressure-testing.
3. **Study a Claim** — click into a claim and read the evidence, pressure points, and votes.
4. **Truths** — browse the Truths list. Truths are statements people repeat as true. "Public" here means visible, not proven.
5. **Submit a Claim** — try submitting one harmless, testable, non-personal claim. It will enter Review and will not be immediately public.
6. **Belief Engine** — open the standalone Belief Engine. It runs entirely in your browser. Nothing is sent to HumanX unless you choose to click "Send to HumanX" at the end.

### Things to note while testing

- Does any wording confuse you about what HumanX does or doesn't do?
- Do the tabs load what you expected?
- Does anything feel misleading about how claims or truths are described?
- Does the Belief Engine intro make sense before you start?
- Did anything break or return an error?

### What not to do

- Do not submit any real personal information (your name, location, medical history, financial situation, legal status, beliefs that could identify you).
- Do not try to access the Review or admin queue — it requires a token you don't have.
- Do not try to stress-test or rate-limit the system on purpose.
- Do not share this URL publicly.

---

## 4. Feedback to Ask For

Ask testers these specific questions:

**Wording / clarity**
- Did anything make you think HumanX is checking whether beliefs are correct or true?
- Did anything sound like a diagnosis or a judgement of your worth?
- Was it clear that submitting a claim puts it into Review, not immediately public?
- Was it clear that a "Truth" in HumanX means a repeated assertion — not a verified fact?

**Usability**
- What did you try first? Did that make sense?
- Was there anything you wanted to do that you couldn't find?
- Did any page or section feel broken or incomplete?

**Belief Engine**
- Was it clear that the Belief Engine runs in your browser and nothing is sent unless you choose to?
- Did "Send to HumanX" feel risky or ambiguous? What did you think it would do?

**General**
- What's your one-line description of what HumanX does? (This tells you if the framing landed.)
- Would you use this again? What would make you more likely to?

---

## 5. Bug Report Template

```
**URL:** (which page or feature)
**What I did:** (steps)
**What I expected:** 
**What happened instead:**
**Browser / device:**
**Any error message shown:** (copy/paste if possible)
```

---

## 6. Safety and Privacy Wording

> HumanX is pseudonymous. No account, email, or password is required. A random local ID is generated in your browser and used to associate your contributions. This ID is not linked to your real identity.
>
> Anything you submit (claims, evidence, pressure points, truths) is reviewed before becoming public. It is not immediately visible to other users.
>
> Do not submit private information — medical, legal, financial, personal beliefs that could identify you, or information about other people. This is a public beta, not a private journal.
>
> The Belief Engine runs entirely in your browser. Your responses to the questions are not sent anywhere unless you explicitly click "Send to HumanX" at the end of the session.

---

## 7. Warning — Do Not Submit Private or Sensitive Information

> **Important:** HumanX is a public system in beta testing. Content you submit may be reviewed by the site operator and may eventually become publicly visible.
>
> Do not submit:
> - Your name, address, email, phone number, or other identifying details
> - Medical, health, or mental health information
> - Legal or financial information
> - Information about specific other people
> - Beliefs or claims that could put you or others at personal, professional, or legal risk
> - Anything you would not want a stranger to read
>
> Treat any submitted text as potentially public.

---

## 8. What HumanX Is / Is Not

### What it is

- A tool for mapping the structure of a belief: where it came from, what pressure it survives, what could change it
- A system for submitting and pressure-testing public claims with evidence
- A record of what gets asserted as true — organised by how strongly it's held and how much evidence it carries
- Pseudonymous: no account, no password, no identity required

### What it is not

| Not this | Why it matters |
|---|---|
| A fact-checker | HumanX does not decide if a claim is true or false |
| A truth arbiter | "Public" means visible — not proven or verified |
| A diagnostic tool | The Belief Engine does not diagnose, label, or score your worth |
| An AI that infers truth | HumanX generates structured data for external AI — it makes no AI inferences itself |
| A debate forum or social network | There are no comments, threads, or follower relationships |
| A finished product | This is an early beta — rough edges are expected |
| A private journal | Submitted content may become publicly visible after review |
| A commercial service | No payment, no subscription, no monetization |

---

## 9. Suggested Tester Route

| Step | What to do | Notes |
|---|---|---|
| 1 | Open Home | Read the card descriptions — check if they make sense |
| 2 | Click Claims | Browse the public claims list |
| 3 | Click into one claim | Read evidence and pressure points in Study view |
| 4 | Click Truths | Browse the Truths list; note the "visible, not proven" framing |
| 5 | Click Submit | Write one harmless, testable claim and submit it; note the review-first message |
| 6 | Open Belief Engine | Run through the intro — note whether it's clear this is private and in-browser |
| 7 (optional) | Click "Send to HumanX" at end of Belief Engine | Only if tester understands it saves a snapshot into their HumanX session for later |

**Note on Step 7:** "Send to HumanX" saves a belief snapshot to the tester's pseudonymous session. It does not immediately publish it. It does not turn it into a public Claim or Truth unless the tester explicitly chooses to do that later. Testers should only do this if they've read the pre-click note and are comfortable with it.

---

## 10. Owner Checklist Before Inviting Testers

> **Not yet inviting testers (as of D-123B).** Complete the next-upgrade phase first (see D-123B). Return to this checklist when improvement work is done.

Work through this list before sending any invite:

- [ ] Complete Belief Engine upgrade and onboarding improvement (D-123B next-upgrade phase)
- [ ] Confirm https://humanx.rinkimirikata.com loads and shows "D1 live" (custom domain smoke check — not yet verified)
- [ ] Confirm `/api/health` returns `ok: true`, `mode: d1-live`
- [ ] Confirm Home page Belief Engine card reads "It helps separate personal certainty, inherited ideas, identity pressure, and what could change your mind."
- [ ] Confirm Belief Engine intro reads "This is not a test you pass or fail."
- [ ] Confirm at least one public claim is visible in the Claims list
- [ ] Confirm Review tab requires admin token (shows "admin required" / 403 — not a queue)
- [ ] Confirm you have working access to the Review queue via admin token (you will need it to moderate tester submissions)
- [ ] Decide how many testers to invite (recommend 2–5 for first wave)
- [ ] Decide how testers will send you feedback (email, DM, form — not via the site itself)
- [ ] Brief testers on the warning not to submit private information (section 7 above)
- [ ] Verify custom domain smoke at https://humanx.rinkimirikata.com (separate task — do not skip)
- [ ] Do not post the URL publicly
- [ ] Keep the tester list small until the first wave's feedback is reviewed

---

## 11. After the First Tester Wave

When testers have responded:

1. Review feedback against the wording checks in section 4.
2. Check the Review queue for submitted claims, truths, and evidence from testers.
3. Decide which submissions to approve, reject, or leave in review.
4. Note any wording or UX confusion that came up frequently.
5. File a D-124 or equivalent task to address any clear gaps before a wider launch.

Do not approve tester submissions without reading them — the review queue is the only moderation gate before content becomes public.
