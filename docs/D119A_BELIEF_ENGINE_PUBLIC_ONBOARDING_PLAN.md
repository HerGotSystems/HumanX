# D-119A — Belief Engine Public Onboarding / Explanation PLAN

**Date:** 2026-06-12  
**Mode:** DOCS ONLY — this is a product/copy plan. No frontend code, no Worker/backend code, no Wrangler, no D1, no production query, no admin token, no deploy, no Belief Engine submission, and no mutation was performed.

> Purpose: define the public explanation pass needed before broader launch so normal users understand what the Belief Engine is, why it is separate, what is stored, what is not diagnosed, and how Beliefs → Truths → Claims works without implying HumanX decides truth.

---

## 0. Scope & Boundaries

| Item | Status |
|---|---|
| Copy/UX planning | ✅ in scope |
| Public onboarding text | ✅ in scope |
| Main app Beliefs/Drift helper copy | ✅ in scope |
| Standalone Belief Engine intro/result explanation | ✅ in scope |
| Code changes | ❌ not in this plan |
| Live testing/submission | ❌ not in this plan |
| D1/Wrangler/deploy/admin token | ❌ not in this plan |

Any implementation should be a later small frontend/copy branch. No backend or schema change should be needed for the first pass.

---

## 1. Current Comprehension Problem

HumanX uses precise internal language, but a first-time public user may not understand:

- why clicking **Beliefs** leaves the main app and opens a standalone Belief Engine
- what a belief snapshot is
- what **Drift** shows
- what happens when a belief is sent to HumanX
- why **Truth** means recorded assertion, not verified fact
- why **Pressure-test as Claim** exists
- what data is local/browser-only vs sent into HumanX Review
- that Belief Engine outputs are not diagnoses, labels, or predictions

This is a launch comprehension blocker, not a backend blocker.

---

## 2. Required Public Mental Model

Users should leave onboarding with this simple model:

```text
Beliefs are personal/internal.
Truths are beliefs or statements people repeat as fact.
Claims are testable public statements.
Evidence and pressure test the claim.
RunPack lets you take the packet to your own AI.
HumanX does not decide what is true.
```

Shorter UI model:

```text
Belief → Truth → Claim → Evidence → Pressure Test
```

---

## 3. Copy Rules / Do-Not-Regress

1. Do not say HumanX diagnoses people.
2. Do not say HumanX predicts behaviour.
3. Do not say HumanX verifies truth.
4. Do not say a Truth is proven because it is public/visible.
5. Do not say Belief Engine results are medical, psychological, legal, or professional assessment.
6. Do not shame users for beliefs; frame as structure, pressure, inheritance, and changeability.
7. Do not hide Review: anything sent into HumanX should clearly enter Review before public visibility.
8. Keep the tone direct, plain, and non-corporate.

---

## 4. Main App Beliefs Entry Copy

### Target placement

Home card / Beliefs tab helper / any Beliefs intro surface before redirect.

### Proposed copy

```text
Belief Engine
Map how a belief works inside you before turning it into a public claim.

It does not diagnose you. It does not decide if you are right.
It helps separate personal certainty, inherited ideas, identity pressure, and what could change your mind.

Your answers start in the browser. Sending anything to HumanX is optional and enters Review before becoming public.
```

### Expected result

A user understands that Belief Engine is introspective and optional, not an authority machine.

---

## 5. Standalone Belief Engine Intro Copy

### Target placement

Top of `public/apps/humanx-belief-engine/index.html` intro/start screen.

### Proposed copy

```text
This is not a test you pass or fail.

The Belief Engine maps the structure around a belief:
where it came from, how strongly it is tied to identity, what pressure it survives, and what could change it.

No religion assigned. No diagnosis. No score of your worth.
The result is a pressure map, not a label.
```

### Microcopy for start button area

```text
Takes about 10–12 minutes. You can use it privately, or choose later to send a snapshot into HumanX Review.
```

---

## 6. Result Screen Explanation

### Problem

Users may treat the result as an identity label or official judgement.

### Proposed copy

```text
Your result is a map of pressure patterns, not a diagnosis.

It shows how this belief appears to behave from your answers: how inherited it may be, how much identity load it carries, and what kind of evidence or experience might change it.

Use it as a mirror, not a verdict.
```

### Negative copy guard

Avoid:

- `You are...`
- `Your type is...`
- `This proves...`
- `This predicts...`

Prefer:

- `This snapshot suggests...`
- `This pattern may indicate...`
- `From these answers...`
- `Pressure tendency...`

---

## 7. Send to HumanX / Bridge Copy

### Target placement

Any action that sends a Belief Engine result into the main HumanX system.

### Proposed copy

```text
Send to HumanX

This will save a snapshot to your HumanX session.
It does not publish it immediately.
If you turn it into a Truth or Claim, it enters Review before becoming visible to others.
```

### Confirmation copy

```text
Snapshot saved. You can review it in Drift.
Nothing has been proven, published, or verified.
```

---

## 8. Drift Page Explanation

### Target placement

Main app Drift helper text / empty state.

### Proposed copy

```text
Drift shows how your saved belief snapshots change over time.

It is not a scoreboard. It is a trail: what you believed, how strongly it carried identity or pressure, and what might change it later.
```

### Empty state copy

```text
No belief snapshots yet.
Open the Belief Engine, map a belief, then optionally send a snapshot back to HumanX.
```

---

## 9. Truths Bridge Explanation

### Problem

The word `Truth` can sound like HumanX is verifying something.

### Required copy pattern

```text
A Truth in HumanX means a statement people repeat as true.
It does not mean HumanX has proven it.
```

### When converting belief/truth to claim

```text
Pressure-test as Claim
Turn this repeated belief into a public, testable statement.
It enters Review first. Evidence and pressure decide how well it survives — not automatic truth status.
```

---

## 10. Suggested First Implementation Pass

| Area | Change type | Risk |
|---|---|---|
| Main app Beliefs helper/card | Copy only | Low |
| Belief Engine intro | Copy only | Low |
| Belief Engine result screen | Copy only | Medium — avoid layout disruption |
| Send to HumanX confirmation | Copy only | Low/medium — check existing flow |
| Drift empty/helper text | Copy only | Low |
| Truths bridge microcopy | Copy only | Low |

No endpoint or schema change expected.

---

## 11. QA for Later Implementation

After the copy pass, verify:

| ID | Check | Expected |
|---|---|---|
| BE-COPY-1 | Main app Beliefs entry | Explains optional/private/Review boundary before redirect |
| BE-COPY-2 | Belief Engine intro | Says no diagnosis, no pass/fail, no worth score |
| BE-COPY-3 | Result screen | Uses snapshot/map language, not identity label language |
| BE-COPY-4 | Send to HumanX | Clearly states save/review/public boundary |
| BE-COPY-5 | Drift | Explains change over time, not scoreboard |
| BE-COPY-6 | Truth bridge | Says Truth means repeated assertion, not proven fact |
| BE-COPY-7 | Negative search | No new `verified`, `proven`, `diagnosis`, `prediction`, or `truth decided` wording introduced |

---

## 12. Recommended Next Task

**D-119B — Belief Engine public onboarding copy implementation**

Suggested branch:

```text
ux/d119b-belief-engine-onboarding-copy
```

Expected files to inspect before editing:

- `public/app-v10.js`
- `public/apps/humanx-belief-engine/index.html`
- `public/styles.css` only if layout needs minor spacing
- relevant static checks after copy implementation

Implementation should stay copy-first. No backend. No D1. No Wrangler/deploy unless explicitly requested after merge.

---

## 13. Confirmation

> Docs-only. No frontend code changed. No backend code changed. No Wrangler. No D1. No production query. No admin token. No deploy. No Belief Engine submission. No Review action. No mutation.
