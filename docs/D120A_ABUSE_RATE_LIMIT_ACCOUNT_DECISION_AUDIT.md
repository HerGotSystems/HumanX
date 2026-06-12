# D-120A — Abuse / Rate-Limit / Account Decision Audit

**Date:** 2026-06-12  
**Mode:** DOCS ONLY — no Worker/backend code, no frontend code, no Wrangler, no D1, no production query, no admin token, no deploy, no live traffic test, and no mutation was performed.

> Purpose: freeze the abuse/rate-limit/account decision surface before any wider public launch. This is an audit/decision document, not an implementation patch.

---

## 0. Current Product Position

HumanX is a working public beta / early MVP. The current model is intentionally lightweight:

- pseudonymous local browser user ID
- no email/account system
- public read surfaces
- public write surfaces gated by `x-humanx-user` + rate limits/review where available
- admin Review gated by `HUMANX_ADMIN_TOKEN`
- RunPack-first, no owner AI API spend

This is acceptable for a small controlled tester launch. It is not enough for broad adversarial public exposure without further decisions.

---

## 1. Key Abuse Surfaces

| Surface | Risk | Current posture | Launch decision needed |
|---|---|---|---|
| Claim submission | Spam, duplicates, junk content | Requires pseudonymous user; rate-limited; Review before public | OK for small beta; monitor queue volume |
| Truth submission | Spam, provocative/junk Truths | Requires pseudonymous user; Review before public | OK for small beta; monitor category/origin quality |
| Evidence submission | Spam, malformed sources, low-quality arguments | Requires pseudonymous user; Review before public; source render/storage hardened | OK for small beta; D1 source audit pending execution |
| Votes | Vote stuffing | Pseudonymous user + rate limit | Needs future account/fingerprint decision before wide launch |
| Reports | Report-bombing can deny visibility by escalating to Review | Rate-limited but intentionally powerful | Needs policy decision before wide launch |
| RunPack / AIP packets | Public unauthenticated packet generation writes rows | No auth/rate-limit noted in risk docs | Needs guardrail before high traffic |
| Belief snapshots | Large/sensitive payloads, spam | Pseudonymous session; Review bridge path | Needs payload-size/rate-limit confirmation |
| Admin Review | Non-public content exposure if token mishandled | Token-gated; token rotation deferred | Token hygiene/rotation before broader launch |

---

## 2. Public Write Endpoint Decision Matrix

| Endpoint | Public? | Writes? | Current beta stance | Wider launch stance |
|---|---:|---:|---|---|
| `POST /api/session` | yes | users | Accept | Add stronger identity/fingerprint controls later |
| `POST /api/claims` | yes | claims/evidence/rate_limits | Accept with Review | Keep Review; add queue monitoring |
| `POST /api/truths` | yes | truths/rate_limits | Accept with Review | Keep Review; add clearer abuse policy |
| `POST /api/evidence` | yes | evidence/rate_limits | Accept with Review | Keep Review; confirm source audit results |
| `POST /api/evidence-attach` | yes | evidence_claim_links | Accept for beta | Confirm rate limit/module guard before scale |
| `POST /api/pressure` | yes | pressure/rate_limits | Accept | Monitor abuse/junk pressure entries |
| `POST /api/tests` | yes | home_tests/rate_limits | Accept | Monitor artefacts; possible Review later |
| `POST /api/claim-vote` | yes | votes/claims | Accept for small beta | Need anti-stuffing/account decision |
| `POST /api/report` | yes | reports + state changes | Cautious | Needs report-bombing policy before scale |
| `POST /api/analysis` | yes | analysis_results | Accept for beta | Confirm payload validation/rate limit |
| `POST /api/belief-snapshots` | yes | belief_snapshots | Accept for beta | Confirm size/rate limit/privacy copy |
| `POST /api/belief-promote` | yes | claims/truths bridge | Accept with Review | Confirm duplicate/rate limit path |
| `POST /api/runpack` / `/api/aip` | yes | aip_packets | Accept for low volume | Add rate limit/auth/TTL/cleanup decision before scale |

---

## 3. Account Model Options

| Option | Description | Pros | Cons | Recommendation |
|---|---|---|---|---|
| A — Current pseudonymous only | Browser-generated ID, no login | Fast, low friction, privacy-friendly | Easy reset/spam/vote stuffing | Keep for small beta only |
| B — Pseudonymous + fingerprint hash | Keep no email, add stronger device/session friction | Still low friction, better abuse control | Privacy explanation needed | Good next step if abuse appears |
| C — Optional accounts | Email/OAuth for persistent identity; anonymous browsing remains | Better moderation/trust | More complexity/privacy burden | Later, not pre-small-beta |
| D — Required accounts | Login required for writes | Strongest moderation | Kills experimentation/frictionless vibe | Not recommended now |

**Decision:** Keep Option A for small controlled testers. Do not build accounts before first tester launch unless abuse appears immediately.

---

## 4. Rate-Limit Priorities

| Priority | Area | Why |
|---|---|---|
| 1 | RunPack/AIP packet generation | Public unauthenticated write; can grow `aip_packets` with traffic |
| 2 | Reports | Report-bombing can hide public items by moving them to Review |
| 3 | Votes | Pseudonymous vote stuffing can distort claim perception |
| 4 | Belief snapshots / analysis payloads | Possible large payload or spam table growth |
| 5 | Evidence attach / truth bridge modules | Confirm delegated-module rate limits before scale |

---

## 5. Report-Bombing Policy Decision

Current risk:

```text
Reports are useful, but enough reports can make content disappear from public surfaces by escalating it to Review.
```

Possible policies:

| Policy | Effect | Recommendation |
|---|---|---|
| Keep auto-escalation at low threshold | Strong safety, easy visibility denial | OK for small beta only |
| Raise threshold after tester launch | Reduces report-bombing | Likely needed before wider public launch |
| Weight reports by trust/user history | Better signal | Requires account/trust system |
| Show item as flagged but still visible | More transparent, more risk | Later policy decision |
| Manual-only report handling | Slower safety response | Not ideal if public grows |

**Small beta decision:** keep current auto-escalation, but monitor.  
**Wider launch decision:** revisit threshold/trust weighting before viral/public push.

---

## 6. RunPack/AIP Growth Decision

Current risk:

```text
RunPack generation is a public utility but writes packet rows. High traffic can grow `aip_packets` without producing direct product value.
```

Options:

| Option | Pros | Cons |
|---|---|---|
| Keep as-is | Frictionless, simple | Table growth / bot spam |
| Add rate limit per IP/user | Simple guardrail | Requires Worker patch/tests |
| Store only latest packet per claim/user | Controls growth | More logic/schema thinking |
| Add TTL/cleanup job | Keeps history bounded | Requires scheduled cleanup/process |
| Make packet generation client-only | No table growth | Larger frontend change; loses stored packet trail |

**Recommendation before wider launch:** add a rate limit or non-storing preview path. Not required before small tester launch.

---

## 7. Token / Admin Decision

Current state:

- single admin-token model
- `/api/debug` admin-gated
- Review admin-gated
- token rotation deferred
- token must never be pasted into chat/docs/logs

Decision:

- acceptable for small private beta
- rotate `HUMANX_ADMIN_TOKEN` before broader public attention
- do not build multi-admin auth yet unless moderation workload increases

---

## 8. Privacy / User-Expectation Decision

Before wider launch, public copy should make clear:

- pseudonymous does not mean invisible
- public submissions may become visible after Review
- Belief snapshots may be sensitive
- HumanX is not medical/legal/professional assessment
- reports are moderation signals, not proof
- RunPack packets may contain the visible claim/evidence packet intended for user-owned AI analysis

D-119A covers Belief Engine copy. A later privacy/help page may be needed before broad launch.

---

## 9. Small Tester Launch Gate

Small controlled tester launch can proceed if these are recorded:

| Gate | Status |
|---|---|
| D-115A product readiness checkpoint | ✅ done |
| D-116A D1 audit plan | ✅ done |
| D-117A normal-user QA plan | ✅ done |
| D-118A moderator/admin QA plan | ✅ done |
| D-119A Belief Engine onboarding plan | ✅ done |
| D-116B read-only D1 audit | ⏸ optional but recommended before testers |
| D-117B read-only normal-user QA run | ⏸ recommended before testers |
| D-118B no-token Review UI QA | ⏸ recommended before testers |

---

## 10. Wider Public Launch Gate

Do not go wide until decisions are made for:

1. RunPack/AIP rate limiting or non-storing generation.
2. Report-bombing threshold/trust policy.
3. Vote-stuffing/account/fingerprint posture.
4. Belief snapshot payload size/rate limit confirmation.
5. Admin token rotation.
6. D1 visible-data quality review and cleanup plan if needed.
7. Public privacy/help wording.

---

## 11. Recommended Next Tasks

| Task | Scope |
|---|---|
| **D-117B** | Execute read-only normal-user QA browsing run; skip write steps unless authorised |
| **D-118B** | Execute no-token Review UI QA; no admin token |
| **D-116B** | Execute read-only D1 audit only if explicitly authorised |
| **D-119B** | Implement Belief Engine onboarding copy |
| **D-120B** | Design RunPack/report/vote guardrail patch if needed after QA/audit |

---

## 12. Confirmation

> Docs-only. No Worker/backend code changed. No frontend code changed. No Wrangler. No D1. No production query. No admin token. No deploy. No live traffic test. No mutation. This document makes decisions/recommendations only; implementation requires later explicit tasking.
