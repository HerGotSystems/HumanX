# D-127F Tester Claim Builder Invite Pack

**Date:** 2026-06-14  
**Branch:** `fix/d127f-tester-claim-builder-invite-pack`  
**Basis:** D-127E deployed / owner smoke PASS. Live release includes D-126B polish, D-127B Claim Builder, D-127C Truth route save, and D-127D Review builder context visibility.  
**Scope:** Docs/tester pack only. No product code. No backend. No D1/schema. No Wrangler. No deploy. No admin token.

---

## Purpose

HumanX is ready for a small tester pass focused on the new Claim Builder.

The goal is not to prove the whole product is finished. The goal is to see whether a normal person can start with a messy thought and understand the path from:

```text
raw thought / belief / suspicion
→ Make It Testable
→ Submit Claim for Review OR Save as Truth for Review
```

This pack gives the owner a safe invite message, tester instructions, feedback questions, and stop conditions.

---

## Tester Scope

Invite only **1–3 trusted testers** first.

Do not send admin token.

Use only the canonical URL:

```text
https://humanx.rinkimirikata.com
```

Do not send the Worker fallback URL unless debugging privately.

---

## Short Invite Message

```text
I’ve added a new Claim Builder to HumanX and need a quick real-person test.

Open this:
https://humanx.rinkimirikata.com

Try the Submit tab. Start with any messy thought, belief, suspicion, or claim. The builder should help you turn it into either a testable Claim or a Truth-style statement for Review.

Please don’t worry about being “right”. I’m testing whether the flow makes sense.

Send me notes on anything confusing, broken, annoying, or surprisingly good.
```

---

## Longer Invite Message

```text
I’m testing a new HumanX flow called Claim Builder.

HumanX is not trying to decide what is true automatically. It helps separate:
- personal beliefs
- repeated “truths” people assert
- public claims that can be pressure-tested with evidence

Please open:
https://humanx.rinkimirikata.com

Go to Submit and try starting with a messy thought, not a polished claim. Examples:
- People are stupid
- The system is built against ordinary people
- School does not work for everyone
- AI will make people lazy
- Politicians lie about cost of living

The builder should guide you through:
1. Raw Thought
2. Make It Testable
3. Final Claim

It may suggest the thought looks more like a Truth than a Claim. That is expected.

Please tell me:
- where you got confused
- whether the wording makes sense
- whether you understood Claim vs Truth
- whether the builder helped or got in your way
- whether you trusted what would happen after submitting

Important: new submissions enter Review before becoming public.
```

---

## Tester Instructions

Ask each tester to try these paths.

### Path A — Claim Builder happy path

1. Open `https://humanx.rinkimirikata.com`.
2. Click **Submit**.
3. Confirm the page says **Claim Builder**.
4. In Raw Thought, enter a messy claim or suspicion.
5. Fill in at least one of:
   - why you think this
   - where it applies
   - what would change your mind
6. Click **Make it testable**.
7. Check whether the flags/advice make sense.
8. Edit the draft claim if needed.
9. Continue to final claim.
10. Read the summary.
11. Optional: submit it for Review.

### Path B — Truth route

1. Start another Submit flow.
2. Enter something belief-like, emotional, or broad.
3. Example: `I believe the system is built against ordinary people.`
4. Click **Make it testable**.
5. Check whether it suggests the Truth route.
6. Confirm there is a **Save as Truth for Review** option.
7. Optional: save it for Review.

### Path C — Browse after submitting

1. Go to Claims.
2. Go to Truths.
3. Confirm pending submissions are not publicly visible immediately.
4. Confirm the site still explains that visibility does not mean proof.

---

## Feedback Questions

Send testers these questions after they try it.

```text
1. Did you understand what HumanX is for after landing on the site?
2. Did the Submit / Claim Builder flow make sense?
3. Was Step 1 clear — could you write a messy thought naturally?
4. Did Step 2 help you make the thought more testable?
5. Did the flags feel useful, annoying, judgemental, or confusing?
6. Did you understand the difference between Claim and Truth?
7. Did you understand that submission goes to Review before becoming public?
8. Was anything too wordy or too technical?
9. Did anything feel broken on mobile?
10. What is the one thing you would change before showing this to more people?
```

---

## Owner Capture Template

Use one copy per tester.

```text
Tester:
Device/browser:
Date:

Path tested:
- Claim Builder: yes/no
- Truth route: yes/no
- Browse Claims/Truths: yes/no
- Mobile: yes/no

What confused them:

What worked well:

Exact wording they disliked:

Bug/error seen:

Did they understand Claim vs Truth?

Did they understand Review-first?

Severity:
- BLOCKER
- HIGH
- MEDIUM
- LOW
- NICE TO HAVE

Owner notes:
```

---

## Stop Conditions

Pause broader tester sharing if any tester reports:

- they thought HumanX automatically proves claims true
- they thought a Truth means verified fact
- they could not understand Claim vs Truth after the builder
- they submitted something and believed it was instantly public
- mobile layout blocks the flow
- Save as Truth or Submit Claim fails unexpectedly
- Review/admin-only behaviour leaks or exposes admin-only controls

---

## What Not To Ask Testers Yet

Do not ask testers to evaluate:

- RunPack export/import unless they naturally reach Study mode
- admin Review tools
- structured builder persistence
- D1/data internals
- scoring accuracy as if it were final truth

The current pass is about comprehension, trust, and flow.

---

## Recommended Next Task

After 1–3 testers respond:

**D-127G — Tester feedback triage.**

Sort feedback into:

- copy/framing fixes
- mobile layout issues
- Claim vs Truth confusion
- Review-first trust issues
- actual bugs
- deferred structured persistence work
