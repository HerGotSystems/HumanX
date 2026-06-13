# D-123B — Canonical URL Correction and Next-Upgrade Checkpoint

**Date:** 2026-06-13  
**Mode:** DOCS ONLY — no code changes, no deploy, no Wrangler, no D1, no production query, no admin token, no live write, no browser testing, no mutation.

> Purpose: Correct the canonical public URL used in D-123A docs, reset the launch posture from "invite testers now" to "improve before inviting testers," and define the next upgrade phase.

---

## 1. URL Correction

D-123A incorrectly used the workers.dev URL as the public tester invite link.

| Role | URL |
|---|---|
| **Canonical public URL** | **https://humanx.rinkimirikata.com** |
| Worker origin / technical fallback | https://humanx.veltrusky-michal.workers.dev |

**Rule going forward:** Use `humanx.rinkimirikata.com` in all tester-facing copy, invite messages, and public references. The `workers.dev` URL is for internal technical use (health checks, deploy verification, Wrangler targets) only. Never share `workers.dev` as the tester link.

---

## 2. Docs Updated in This Task

| File | Changes |
|---|---|
| `docs/D123A_DEPLOYED_GUARDED_BETA_CHECKPOINT.md` | Canonical URL corrected; workers.dev demoted to "technical fallback"; launch posture updated to "owner review only / not yet inviting testers"; deferred-items note updated |
| `docs/D123A_TESTER_LAUNCH_PACK.md` | All 3 occurrences of workers.dev URL replaced with rinkimirikata.com; header status note added; owner checklist updated with "not yet inviting" notice and custom domain smoke item |

### Exact URL replacements made

**D-123A checkpoint:**
- `Live URL | https://humanx.veltrusky-michal.workers.dev` → `Canonical public URL | https://humanx.rinkimirikata.com` + new row `Worker origin (technical fallback) | https://humanx.veltrusky-michal.workers.dev`

**D-123A tester launch pack (3 replacements):**
- Short invite message link
- Long invite message link
- Owner checklist confirmation item

---

## 3. Launch Posture Reset

| Attribute | D-123A (original) | D-123B (corrected) |
|---|---|---|
| Status | "Guarded beta — invitation only" (implied: ready to send invites) | "Deployed guarded internal beta — owner review only. Not yet inviting external testers." |
| Canonical URL | workers.dev (wrong) | rinkimirikata.com (correct) |
| Custom domain smoke | Not mentioned | Required before any tester invite — not yet verified |
| Next action | Send invites | Complete improvement phase first |

---

## 4. Custom Domain Status

`humanx.rinkimirikata.com` is the canonical public URL. It was not explicitly smoke-tested in D-122B (that session used the workers.dev URL). Before any tester invite is sent, a light smoke check of the custom domain should be completed:

- [ ] `https://humanx.rinkimirikata.com` loads (HTTP 200, no TLS error)
- [ ] `/api/health` returns `ok: true`, `mode: d1-live` via the custom domain
- [ ] Home page renders correctly at the custom domain
- [ ] Belief Engine loads at `https://humanx.rinkimirikata.com/apps/humanx-belief-engine/`

This is a separate task (D-124 or equivalent). It does not require code changes — just browser/API verification.

---

## 5. Deployed State (Preserved from D-123A)

No change to deployment. The deployed Worker version is unchanged.

| Field | Value |
|---|---|
| Canonical public URL | https://humanx.rinkimirikata.com |
| Worker origin (technical fallback) | https://humanx.veltrusky-michal.workers.dev |
| Deployed Worker version | `fec949c4-fe26-4f95-9c74-6f5fc960f4e4` |
| Main HEAD at D-123A checkpoint | `c15b4f9` (Merge PR #145 — D-122B post-deploy smoke) |
| Static baseline | `416 / 24 / 56` |
| D1 status at last smoke | `d1-live` (via workers.dev — custom domain not yet separately verified) |

---

## 6. Next-Upgrade Phase

Before external testers are invited, the following improvements are recommended. None are blocking for owner-internal review, but all are worth completing before the product is in front of fresh eyes.

### 6A — Belief Engine upgrade

The Belief Engine is functional but an early version. Improvements to consider:

- Richer result output — the results screen shows patterns but the "what this means" framing could be stronger
- More explicit "this is not a diagnosis" framing at the result screen (currently "pressure map, not a verdict" — confirm visibility)
- Consider whether the 10–12 minute estimate is accurate for current question count
- "Send to HumanX" button copy and pre-click note — confirm they are clear enough that a first-time user understands what they are agreeing to

### 6B — Public onboarding improvement

The home cards were improved in D-119B/C. Outstanding considerations:

- First-time visitor orientation: is it clear enough what to do first?
- The "Submit" flow entry point from Home — is the review-first model explained before a user fills the form?
- Drift tab: currently useful mainly to returning users with saved snapshots — consider whether it needs a better empty-state message for first-timers

### 6C — Review / admin ergonomics

Currently the Review queue is only accessible via raw API calls with the admin token. Before there are tester submissions in the queue:

- Confirm the owner has a reliable workflow for reviewing, approving, and rejecting submissions
- Consider whether a simple admin UI would be worth building before submissions arrive
- Note: the queue is already functional and secure — this is an ergonomics question, not a security gap

### 6D — Tester safety boundaries

Before inviting external testers, ensure the following are explicit in any invite:

- The data warning (section 7 of the tester launch pack) must be communicated before the tester submits anything
- The Belief Engine "Send to HumanX" flow must be clearly opt-in and explained
- Testers must know not to share the URL publicly

### 6E — Custom domain smoke check

As noted in section 4 — verify the rinkimirikata.com domain is live, correctly routed to the Worker, and returns the same content as the workers.dev URL. This is a prerequisite for any tester invite.

---

## 7. Recommended Sequence Before Tester Invites

| Order | Task | Kind | Notes |
|---|---|---|---|
| 1 | Custom domain smoke check | Read-only browser/API | Verify rinkimirikata.com is live and correct |
| 2 | D-116B read-only D1 audit | Production read-only | Explicit authorisation required |
| 3 | D-118C tokened Review read-only QA | Read-only + token | Explicit authorisation required |
| 4 | Belief Engine upgrade (if decided) | Code / copy | Branch/PR |
| 5 | Onboarding improvement (if decided) | Copy | Branch/PR |
| 6 | Review ergonomics (if decided) | Code or workflow | Branch/PR if code |
| 7 | Tester invite | Owner action | Use D-123A launch pack with corrected URL |

---

## 8. Standing Rules (Carried Forward)

1. Canonical public URL for all user-facing copy: `https://humanx.rinkimirikata.com`
2. `workers.dev` URL: internal / technical only — never in invite messages
3. No admin token in chat/docs/logs/issues/PRs/commits
4. No Wrangler/D1/deploy unless explicitly authorised
5. No production mutation unless exact action is authorised
6. Preserve trust wording: HumanX does not decide truth
7. Preserve Belief Engine wording: not diagnosis, not label, not prediction
8. Keep audit-first workflow

---

## 9. Confirmation

> Docs-only correction and checkpoint. No code changes. No Wrangler. No D1. No production query. No admin token. No live write. No browser testing. No mutation. Doc committed locally only, not pushed.
