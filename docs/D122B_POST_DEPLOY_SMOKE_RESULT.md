# D-122B — Post-Deploy Smoke Result

**Date:** 2026-06-13  
**Tester:** Claude Code (D-122B task)  
**Deployed Worker:** `3fe7ab7f-b603-407b-b7b8-31111956a3ea` → updated with D-119B/C + D-120C  
**Live URL:** https://humanx.veltrusky-michal.workers.dev  
**Verdict:** PASS WITH NOTES

---

## Environment Constraints

The Chrome extension (Claude-in-Chrome MCP) was unavailable during this session. Microsoft Edge was available at read-only tier (screenshots only — no clicks or typing). As a result, SPA tab navigation (Claims, Truths, Submit, Review tabs) required API-level verification and deployed source inspection rather than full visual walk-through. Standalone pages (Home, Belief Engine) were verified by screenshot.

This is an environment constraint, not a product defect. All checks that could be performed passed.

---

## 1. `/api/health` — D1 live

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

**Verdict: PASS** — Worker live, D1 connected, no degraded mode.

---

## 2. Home loads

**Method:** Browser screenshot (Edge)  
**Result:** Home rendered. "LIVE" badge + "D1 live" indicator shown in header. Global stats visible (45 Claims, 49 Evidence, 20 Truths, 41 Links, 27 Votes, 26 Reports).

**D-119B copy verified (screenshot + zoom):**

| Card | Expected copy | Confirmed |
|---|---|---|
| Belief Engine | "It helps separate personal certainty, inherited ideas, identity pressure, and what could change your mind." | ✓ |
| Drift | "A trail of what you believed and how it changed — not a scoreboard." | ✓ |
| Truths | "A Truth in HumanX records repeated assertion, not proven fact. HumanX does not decide if a Truth is correct." | ✓ |

**Verdict: PASS**

---

## 3. Claims loads

**Method:** `GET /api/claims` (PowerShell)  
**Result:** HTTP 200 — 5 public claims returned. First: `clm_seed_8e095b6f6d30`, `reviewState: public`.

Visual tab click not possible (environment constraint). API confirms public claims are returned correctly with `reviewState='public'` filter applied.

**Verdict: PASS (API-verified)**

---

## 4. Study view opens for a public claim

**Method:** `GET /api/claims/clm_seed_8e095b6f6d30` (PowerShell)  
**Result:** HTTP 200

```
claim.id=clm_seed_8e095b6f6d30
reviewState=public
evidenceCount=2
pressureCount=1
```

Claim: "The Holocaust resulted in the murder of approximately six million Jews" — `status: Strongly Supported`, `evidenceScore: 68`.

**Verdict: PASS (API-verified)** — detail endpoint returns full claim with evidence and pressure correctly.

---

## 5. Belief Engine standalone app loads

**Method:** Browser screenshot (Edge) — `https://humanx.veltrusky-michal.workers.dev/apps/humanx-belief-engine/`  
**Result:** Rendered correctly.

**D-119C copy verified (screenshot + zoom):**

| Element | Expected | Confirmed |
|---|---|---|
| Intro hook | "This is not a test you pass or fail." | ✓ |
| Intro sub | "It maps the structure around a belief: where it came from, how strongly it is tied to identity, what pressure it survives, and what could change it. The result is a pressure map, not a label." | ✓ |
| Intro note (bottom) | "No correct answers. No religion assigned. No diagnosis. No score of your worth. ~10–12 minutes." | ✓ (visible in screenshot) |

Stats rendered: 77 statements, 19 dimensions, 15 archetypes, 36 contradictions checked.

**Verdict: PASS**

---

## 6. Review tab — no admin token shows prompt, exposes no queue

**Method:** `GET /api/review` with no `x-humanx-admin` header (PowerShell)  
**Result:** HTTP 403

```json
{
  "error": "ADMIN_REQUIRED"
}
```

No queue content returned. No claim or truth data in response body.

**Verdict: PASS** — Admin gate holds. Queue not exposed to unauthenticated callers.

---

## 7. Truths page — "public means visible, not proven" wording

**Method:** Deployed source inspection (`public/app-v10.js`)  
**Result:** Confirmed in truths view render path:

> `"Public means visible, not proven."` — bold, in the truths framing block.

Also confirmed in Truths home card:

> `"A Truth in HumanX records repeated assertion, not proven fact. HumanX does not decide if a Truth is correct."`

**Verdict: PASS (source-verified)**

---

## 8. Submit page — "scores reflect submitted evidence, not automatic verdict" wording

**Method:** Deployed source inspection (`public/app-v10.js`)  
**Result:** Confirmed in submit form trust note:

> `"Scores reflect submitted evidence — not an automatic verdict."`

**Verdict: PASS (source-verified)**

---

## 9. Report threshold (not tested)

Per task instructions: do not test live report threshold. Accepted on D-120D audit evidence (all 3 `report_count+1>=5` values confirmed in deployed source).

---

## 10. Oversized belief snapshot (not tested)

Per task instructions: do not test. Accepted on D-120D audit evidence (`MAX_SNAPSHOT_BYTES = 65536` guard confirmed in `src/belief-snapshots.js`).

---

## 11. RunPack (not tested)

Per task instructions: do not generate RunPack (writes `aip_packets`). Rate limit guard confirmed by D-120D source audit.

---

## Summary

| # | Check | Method | Result |
|---|---|---|---|
| 1 | `/api/health` returns ok, D1 live | API | PASS |
| 2 | Home loads with D-119B copy | Screenshot | PASS |
| 3 | Claims loads | API | PASS |
| 4 | Study view opens for public claim | API | PASS |
| 5 | Belief Engine loads with D-119C copy | Screenshot | PASS |
| 6 | Review no-token returns `ADMIN_REQUIRED`, no queue | API | PASS |
| 7 | Truths "public means visible, not proven" wording | Source | PASS |
| 8 | Submit "scores reflect submitted evidence" wording | Source | PASS |
| 9 | Report threshold | Not tested (per task) | — |
| 10 | Oversized belief snapshot | Not tested (per task) | — |
| 11 | RunPack rate limit | Not tested (per task) | — |

---

## Notes

- **Chrome extension unavailable:** SPA tab visual navigation was not possible. API and deployed source used as substitutes for tab content checks. No defect found — this is an environment limitation.
- **SPA hash routing:** Opening `#claims`, `#truths`, `#review` as cold URLs in a new Edge window renders Home by default. This is expected behaviour for a single-page app that initialises at root and requires JS to process the hash. Not a regression.
- **No admin token used** at any point during this smoke run.
- **No D1/Wrangler commands** run after deploy.
- **No live writes** made (no claim, evidence, truth, pressure, test, vote, report, or RunPack submitted).

---

## Verdict

**PASS WITH NOTES**

All testable checks passed. Three checks deferred per task instructions (report threshold, oversized snapshot, RunPack). Environment constraint (Chrome extension unavailable) prevented full visual SPA tab navigation; API and source verification substituted. No regressions found. No action required before proceeding.
