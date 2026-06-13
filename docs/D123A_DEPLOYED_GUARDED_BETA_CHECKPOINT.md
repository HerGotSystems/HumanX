# D-123A — Deployed Guarded Beta Checkpoint

**Date:** 2026-06-13  
**Mode:** DOCS ONLY — no code changes, no deploy, no Wrangler, no D1, no production query, no admin token, no live write, no mutation.

> Purpose: Capture the current deployed HumanX state as a stable baseline before inviting the first small controlled tester group.

---

## 1. Current Deployed State

| Field | Value |
|---|---|
| Live URL | https://humanx.veltrusky-michal.workers.dev |
| Deployed Worker version | `fec949c4-fe26-4f95-9c74-6f5fc960f4e4` |
| Main HEAD at checkpoint | `c15b4f9` (Merge PR #145 — D-122B post-deploy smoke) |
| Static baseline | `416 / 24 / 56` (hardening / belief-engine / worker-route) |
| D1 status at smoke | `d1-live` — confirmed via `/api/health` |
| Worker entrypoint | `src/worker.js` |
| Frontend entry | `public/index.html`, `public/app-v10.js` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` |

---

## 2. What Shipped in This Deployed Version

Changes since the prior recorded deploy (`3fe7ab7f`), verified by D-122A and D-122B:

| Task | Kind | What changed | Audited |
|---|---|---|---|
| D-119B | Copy | Home card descriptions (Belief Engine, Drift, Truths), bridge pre-click note | D-119D PASS WITH NOTES |
| D-119C | Copy | Belief Engine intro hook, intro sub, intro note, results framing | D-119D PASS WITH NOTES |
| D-120C | Backend | RunPack rate limit (20/hr per IP), report escalation threshold (2→5), belief snapshot 64 KB cap | D-120D PASS |

No schema changes. No admin-token change. No breaking API shape changes.

---

## 3. Launch Posture

**Guarded beta. Not a public mass launch.**

- A small number of invited testers only.
- No public link posted to social media, forums, or aggregators.
- No claim of AI truth-determination, diagnosis, or score of personal worth.
- No payment or monetization.
- No account creation, login, or password. Identity is pseudonymous (`x-humanx-user` header, locally generated).
- No personal data required to use the product.
- Owner retains full moderation control via the Review queue (admin-token required, not exposed to testers).

---

## 4. What Is Safe for Testers to Try

These are read-only or low-risk write paths. All tester writes land in `review_state='review'` before becoming public.

| Action | Notes |
|---|---|
| Browse Home | Read-only |
| Browse Claims list | Read-only — only public claims visible |
| Open a claim Study view | Read-only — public claims only |
| Browse Evidence Vault | Read-only |
| Browse Truths list | Read-only |
| Run Belief Engine | Local in browser — no data sent unless tester clicks "Send to HumanX" |
| Submit a harmless public claim | Goes to Review before becoming public |
| Add evidence to an existing claim | Goes to Review before becoming public |
| Add a pressure point to a claim | Goes to Review |
| Convert a Truth to a Claim | Goes to Review |
| Vote on a claim | Live write to `claim_votes`; low-risk |
| Report a claim | Live write; requires 5 reports to auto-escalate (D-120C threshold) |

---

## 5. What Testers Should Not Try

| Action | Reason |
|---|---|
| Admin / Review queue | Requires admin token — not shared with testers |
| RunPack / AIP generation | Writes `aip_packets`; rate-limited at 20/hr per IP; intentionally deferred from tester scope |
| Submitting private, medical, legal, financial, or identifying information | No private data should enter a public beta |
| Attempting to break rate limits | Intentional product behaviour; not a bug bounty |
| Importing seed data | Admin-only; requires token |
| Posting the live URL publicly | Guarded beta — invitation only |

---

## 6. Owner / Admin-Only Areas

| Area | Gate |
|---|---|
| `/api/review` — view queue | `x-humanx-admin` token required |
| `/api/review/decision` — approve/reject/re-queue | `x-humanx-admin` token required |
| `/api/review/cleanup` — archive smoke artefacts | `x-humanx-admin` token required |
| `/api/review/mark-duplicate` — mark duplicates | `x-humanx-admin` token required |
| `/api/review/resolve-similar` — clear near-duplicate flag | `x-humanx-admin` token required |
| `/api/import-seed` — seed claims | `x-humanx-admin` token required |
| `/api/import-truths` — seed truths | `x-humanx-admin` token required |
| `/api/seed` — legacy demo seed | `x-humanx-admin` token required |

No tester path exposes the admin token or the review queue.

---

## 7. Intentionally Deferred Items

These remain not started and require explicit authorisation before execution:

| Item | Status | Auth phrase required |
|---|---|---|
| D-116B read-only D1 audit | Not started | `Authorised: run D-116B read-only D1 audit` |
| D-118C tokened Review read-only QA | Not started | `Authorised: run D-118C tokened Review read-only QA` |
| Live report threshold test (5 reports to escalate) | Deferred | Explicit approval required |
| Live oversized snapshot rejection test | Deferred | Explicit approval required |
| Live RunPack write / rate-limit test | Deferred | Explicit approval required |

These deferrals do not block the guarded beta launch. All are covered by source-level audit evidence.

---

## 8. Known Notes from D-122B Smoke

- Chrome extension was unavailable during smoke; SPA tab visual navigation was environment-constrained. API and source verification substituted. No product defect found.
- Truths "public means visible, not proven" wording confirmed in deployed source.
- Submit "scores reflect submitted evidence — not an automatic verdict" wording confirmed in deployed source.
- Review gate (HTTP 403 `ADMIN_REQUIRED`) confirmed live at `/api/review` with no token.
- Belief Engine intro copy ("not a test you pass or fail", "pressure map, not a label") confirmed by screenshot.

---

## 9. What HumanX Is / Is Not (for owner reference)

**Is:**
- A tool for mapping the structure of a belief — where it came from, what pressure it survives, what could change it
- A pseudonymous public beta — claims, truths, and evidence are submitted by users and reviewed before becoming public
- A system that records what people assert as true — not a system that determines truth

**Is not:**
- A fact-checker or truth arbiter
- A diagnostic tool (no medical, psychological, or ideological diagnosis)
- A scoring system for personal worth or correctness
- An AI inference engine (RunPack generates structured data for external AI; HumanX itself makes no AI inferences)
- A social network, forum, or identity platform
- A finished, hardened, or commercially launched product

---

## 10. Standing Do-Not-Regress Rules

From D-121A — preserved here for reference:

1. No admin token in chat/docs/logs/issues/PRs/commits.
2. No Wrangler/D1/deploy unless explicitly authorised.
3. No production mutation unless exact action is authorised.
4. No raw user URL into `href`; use `sourceLink()` / `safeHttpUrl()`.
5. Preserve trust wording: HumanX does not decide truth.
6. Preserve Truth wording: visible/public does not mean proven/verified.
7. Preserve Review-first wording for new public submissions.
8. Preserve Belief Engine wording: not diagnosis, not label, not prediction.
9. Keep work branch/PR-based for risky/backend/deletion changes.
10. Keep audit-first workflow.

---

## 11. Confirmation

> Docs-only checkpoint. No code changes. No Wrangler. No D1. No production query. No admin token. No live write. No mutation. Doc committed locally only, not pushed.
