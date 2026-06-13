# D-123C — Custom Domain Smoke Result

**Date:** 2026-06-13  
**Custom domain tested:** https://humanx.rinkimirikata.com  
**Worker origin (not tested as tester URL):** https://humanx.veltrusky-michal.workers.dev  
**Deployed Worker version:** `fec949c4-fe26-4f95-9c74-6f5fc960f4e4`  
**Verdict:** PASS

---

## Constraints

- Read-only throughout. No writes made.
- No admin token used at any point.
- No RunPack generated.
- No claim submitted.
- No report submitted.
- No Belief Engine "Send to HumanX" clicked.
- No D1, no Wrangler, no deploy, no code changes.

---

## 1. HTTPS / Home loads

**Method:** Browser screenshot (Edge)  
**URL:** https://humanx.rinkimirikata.com/  
**Result:** Page rendered. Address bar confirms `https://humanx.rinkimirikata.com` with valid TLS (no certificate warning). "LIVE" badge and "D1 live" indicator shown in header. Navigation tabs, global stats, and all home cards visible.

**Verdict: PASS**

---

## 2. `/api/health` — D1 live via custom domain

**Method:** `Invoke-WebRequest` (PowerShell)  
**Result:** HTTP 200

```json
{
  "ok": true,
  "service": "humanx",
  "mode": "d1-live",
  "ai": "runpack-first-no-public-inference",
  "legacy_ai": "aip-first-no-public-inference"
}
```

**Verdict: PASS** — Worker reachable via custom domain, D1 live, no degraded mode.

---

## 3. Claims readable

**Method:** `GET https://humanx.rinkimirikata.com/api/claims` (PowerShell)  
**Result:** HTTP 200 — 5 public claims returned, all `reviewState: public`.

| id | reviewState | status |
|---|---|---|
| clm_seed_8e095b6f6d30 | public | Strongly Supported |
| clm_seed_55e17c22e13e | public | Strongly Supported |
| clm_seed_c4e0335e7aae | public | Strongly Supported |
| clm_seed_8ad9ff121579 | public | Plausible |
| clm_seed_7fb1c24747c2 | public | Strongly Supported |

**Verdict: PASS**

---

## 4. Study view readable for a public claim

**Method:** `GET https://humanx.rinkimirikata.com/api/claims/clm_seed_8e095b6f6d30` (PowerShell)  
**Result:** HTTP 200

```
claim: clm_seed_8e095b6f6d30
reviewState: public
text: "The Holocaust resulted in the murder of approximately six million Jews"
evidence count: 2
pressure count: 1
```

**Verdict: PASS** — Claim detail endpoint returns full claim with evidence and pressure via custom domain.

---

## 5. Belief Engine standalone page loads

**Method:** Browser screenshot (Edge)  
**URL:** https://humanx.rinkimirikata.com/apps/humanx-belief-engine/  
**Result:** Page rendered. Address bar confirms the custom domain URL. Intro copy visible: "This is not a test you pass or fail." and "The result is a pressure map, not a label." Stats shown: 77 statements, 19 dimensions, 15 archetypes, 36 contradictions checked. "Begin Mapping" button rendered.

**Note:** A white rectangular overlay appeared in the top-right corner of the screenshot. This is the Claude sidebar panel from the session environment — not a product element. The Belief Engine page content is fully visible and unaffected.

**Verdict: PASS**

---

## 6. Review without admin token — blocked

**Method:** `GET https://humanx.rinkimirikata.com/api/review` with no `x-humanx-admin` header  
**Result:** HTTP 403

```json
{
  "error": "ADMIN_REQUIRED"
}
```

No queue content, no claim data, no truth data in response body.

**Verdict: PASS** — Admin gate holds on the custom domain. No queue exposed.

---

## 7. Docs / invite wording — workers.dev URL check

**Method:** `Grep` across `docs/D123*.md`  
**Result:** `veltrusky-michal.workers.dev` appears only in the following correct contexts:

| File | Context |
|---|---|
| `D123A_DEPLOYED_GUARDED_BETA_CHECKPOINT.md` | Row labelled "Worker origin (technical fallback)" |
| `D123B_CANONICAL_URL_AND_NEXT_UPGRADE_CHECKPOINT.md` | URL correction record (documents the old URL that was replaced) and "Worker origin / technical fallback" row |

No tester invite message, no short/long invite copy, no tester instructions, no owner checklist line uses `workers.dev` as the tester link. All user-facing invite copy uses `humanx.rinkimirikata.com`.

**Verdict: PASS** — workers.dev is correctly scoped to internal/technical-reference rows only.

---

## 8. Summary

| # | Check | Method | Result |
|---|---|---|---|
| 1 | HTTPS / Home loads at custom domain | Screenshot | PASS |
| 2 | `/api/health` — ok, d1-live | API | PASS |
| 3 | Claims readable | API | PASS |
| 4 | Study view readable for public claim | API | PASS |
| 5 | Belief Engine standalone loads | Screenshot | PASS |
| 6 | Review no-token → 403 ADMIN_REQUIRED | API | PASS |
| 7 | No workers.dev in tester invite copy | Grep | PASS |

---

## 9. Deferred Items

Per task rules and D-123B posture:

| Item | Status |
|---|---|
| Live write smoke (claim submit, evidence, vote) | Not tested — deferred, requires explicit approval |
| RunPack generation | Not tested — deferred |
| Report submission | Not tested — deferred |
| Belief Engine "Send to HumanX" | Not tested — deferred |
| D-116B read-only D1 audit | Not started — requires explicit authorisation |
| D-118C tokened Review QA | Not started — requires explicit authorisation |

All deferred items are covered by prior source-level audit evidence (D-120D, D-119D).

---

## 10. Confirmation

> Read-only smoke check only. No writes made. No admin token used. No code changes. No Wrangler. No D1. No deploy. Doc committed locally only, not pushed.

**Canonical public URL is confirmed live and correctly routed: https://humanx.rinkimirikata.com**
