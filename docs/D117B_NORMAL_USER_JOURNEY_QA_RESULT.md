# D-117B — Normal-User Journey QA RESULT

**Date:** 2026-06-10
**Tested URL (intended):** https://humanx.rinkimirikata.com (live) — workers.dev mirror `humanx.veltrusky-michal.workers.dev`
**Browser / device / viewport (intended):** desktop ≥1024px + phone 375px
**Baseline:** repo `294d160` · deployed Worker `3fe7ab7f-b603-407b-b7b8-31111956a3ea` · static 416 / 24 / 56
**Plan executed against:** `docs/D117A_NORMAL_USER_JOURNEY_QA_PLAN.md`

---

## 0. Execution Status — ENVIRONMENT BLOCKED (live render not executed)

**Live browser QA was NOT executed.** This Claude Code environment is a headless CLI sandbox with **no connected browser** (no Claude-in-Chrome extension session, no interactive display) able to load the live production site. Therefore **no PASS/FAIL can be asserted for live visual rendering, real network behavior, or live interaction.** This result file is produced under the D-117A fallback clause ("If browser execution is not available… create D-117B as a 'not executed / environment blocked' result file, with exactly what was blocked and what must be manually checked").

To keep the result useful rather than empty, every checklist item is given a **source-verification** status against the **deployed frontend assets at this commit** (`public/app-v10.js`, `public/index.html`, `public/styles.css` — these are the exact files served by the live Worker `3fe7ab7f`, asset-matched). Source-verification confirms the *code/markup/CSS that produces the behavior is present and correct*; it does **not** prove live rendering. Each item is labelled:

- **SRC-VERIFIED** — the producing code/markup/CSS is present and correct in the deployed asset at this commit (strong evidence, not a live render).
- **BLOCKED(needs-browser)** — requires an actual browser/visual/network check that this environment cannot perform.
- **SKIPPED(needs-approval)** — a write-path step, not run (read-only QA + no authorisation).

### Boundary statement (this task)
> Read-only intent only. No Wrangler, no D1, no production query, no admin token, no deploy, no Review/admin action, and **no write of any kind** (no submit claim/truth/evidence, no vote, no report, no RunPack generation, no Belief Engine "Send to HumanX"). No code was changed. No failure was fixed. Nothing was mutated.

---

## 1. Summary Table

| Section | SRC-VERIFIED | BLOCKED(needs-browser) | SKIPPED(needs-approval) | FAIL |
|---|---|---|---|---|
| Desktop journey (§2) | 8 | 4 (live render/interaction) | 2 (RunPack build, submit) | 0 |
| Phone 375px (§3) | 6 | 2 (live render/scroll) | 1 (truth submit) | 0 |
| Belief Engine handoff (§4) | 3 | 1 (live redirect/return) | 1 ("Send to HumanX") | 0 |
| Drift / Vault / Search (§5) | 4 | 2 (live data/empty render) | 0 | 0 |
| Error recovery (§6) | 2 | 1 (live backend-down render) | 0 | 0 |
| Trust wording (§7) | 7 | 0 | 0 | 0 |
| Mobile hard checks (§8) | 6 | 2 (live 375px render) | 0 | 0 |

**No FAILs detected at the source level.** All BLOCKED items are blocked by the missing live browser, not by an observed defect.

---

## 2. Desktop Journey (≥1024px)

| ID | Status | Evidence |
|---|---|---|
| DT-1/DT-2 Home hero + framing | **SRC-VERIFIED** | hero subtitle "…**it does not decide what is true**" present in `renderHome`; pipeline + 7 cards present |
| DT-3 Browse Claims list | **BLOCKED(needs-browser)** | renderArena + `card()` present in source; live list render needs browser |
| DT-4 Study verdict qualifier + board | **SRC-VERIFIED** | "Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty." present in `renderReviewInspectPanel`/Study path |
| DT-5 Evidence source-link safety | **SRC-VERIFIED** | `sourceLink`→`safeHttpUrl` http/https-only guard present; non-web → non-clickable text; "weak argument" label present |
| DT-6 Meter tooltips | **SRC-VERIFIED** | `meter()` emits per-meter `title`; tooltips text present |
| DT-7 RunPack no-claim guidance | **SRC-VERIFIED** | `renderExport` no-claim guidance present |
| DT-8 ⚠ Build RunPack | **SKIPPED(needs-approval)** | writes `aip_packets` (confirmed in `src/worker.js createAipPacket`) — not run |
| DT-9 Truths page | **SRC-VERIFIED** | "Public means visible, not proven"; neutral "visible" badge; "claim derived" chip in source |
| DT-10 Submit trust note | **SRC-VERIFIED** | `.submit-trust-note` "Scores reflect submitted evidence — not an automatic verdict." in `renderSubmit` main panel |
| DT-11 ❌ Submit claim | **SKIPPED(needs-approval)** | live write — not run |
| DT-12 Tab navigation integrity | **BLOCKED(needs-browser)** | `setMode` logic present; live no-stuck-state needs browser |
| DT-3/DT-12 live render/interaction | **BLOCKED(needs-browser)** | actual rendering/clicks not performable here |

---

## 3. Phone Journey (375px)

| ID | Status | Evidence |
|---|---|---|
| PH-1 Home 1-col, no h-scroll, "When:" hidden | **SRC-VERIFIED (code)** / **BLOCKED(needs-browser) (visual)** | `@media(max-width:600px){….cc-card-when{display:none}}` + hero/card mobile rules present; actual no-horizontal-scroll needs a 375px render |
| PH-2 Tab strip edge-fade + swipe | **SRC-VERIFIED** | `.tabs` mask-image right-edge fade + `overflow-x:auto` + touch scrolling present |
| PH-3 Claims 1-col | **BLOCKED(needs-browser)** | grid rules present; live render needed |
| PH-4 Study stacks 1-col | **SRC-VERIFIED (code)** | `.study-grid` 1-col at ≤900px present |
| PH-5 Truths add-form collapsed | **SRC-VERIFIED** | `<details class="truth-add-details">` + `@media(min-width:601px)` force-expand present (collapsed on phone) |
| PH-6 ⚠ Expand + submit truth | **SKIPPED(needs-approval)** | live write — not run |
| PH-7 Submit usable | **SRC-VERIFIED (code)** | form + trust note present |
| PH-8 375px overflow sweep | **BLOCKED(needs-browser)** | requires live 375px render |

---

## 4. Belief Engine Handoff

| ID | Status | Evidence |
|---|---|---|
| BE-1 Beliefs tab redirect | **SRC-VERIFIED** | `tab-belief` uses `location.href='/apps/humanx-belief-engine/'` |
| BE-2 Intro copy | **SRC-VERIFIED** | "No correct answers. No religion assigned." present in belief-engine `index.html` |
| BE-3 Interpretive framing | **SRC-VERIFIED** | "not diagnoses… pressure-tendency" present |
| BE-4 Redirect + return live | **BLOCKED(needs-browser)** | live navigation/return needs browser |
| BE "Send to HumanX" | **SKIPPED(needs-approval)** | writes `belief_snapshots` — not run |

---

## 5. Drift / Evidence Vault / Search / Filter

| ID | Status | Evidence |
|---|---|---|
| DR-1 Drift loads (no blank/error) | **SRC-VERIFIED (code)** / **BLOCKED (live data)** | `renderDrift` + empty-state copy present; live data render needs browser |
| EV-1 Vault loads / empty state | **SRC-VERIFIED (code)** / **BLOCKED (live data)** | `renderVault` + source-link safety present |
| SF-1 Search filters current mode | **SRC-VERIFIED (code)** | `searchCurrent` wiring present |
| SF-2 Verdict filter + qualifier | **SRC-VERIFIED** | searchbar verdict filter + "not automatic truth rulings" qualifier present in `index.html` |
| SF-3 Search in non-claim mode | **BLOCKED(needs-browser)** | live behavior needs browser |

---

## 6. Error Recovery

| ID | Status | Evidence |
|---|---|---|
| ER-1 Backend-down → readable panel | **SRC-VERIFIED** | `renderError` renders "HumanX backend notice" + escaped message + **"← Back to Home"** button (not raw JSON/blank) |
| ER-2 Recover via Back to Home | **SRC-VERIFIED** | Back-to-Home button calls `setMode('home')` |
| ER-1 live backend-down render | **BLOCKED(needs-browser)** | cannot simulate a live failed fetch here |
| ER-3 Empty states | **SRC-VERIFIED (code)** | instructive empty-state strings present across renderers |

---

## 7. Public Trust Wording — all SRC-VERIFIED ✅

| ID | Surface | Result |
|---|---|---|
| TW-1 | Home hero "it does not decide what is true" | **SRC-VERIFIED** |
| TW-2 | Submit "Scores reflect submitted evidence — not an automatic verdict." (visible main panel) | **SRC-VERIFIED** |
| TW-3 | Arena searchbar "Verdicts are pressure-test labels, not automatic truth rulings." | **SRC-VERIFIED** |
| TW-4 | Study "Verdict is a pressure-test label, not an automatic truth ruling." | **SRC-VERIFIED** |
| TW-5 | Truths "Public means visible, not proven." + neutral "visible" badge + bold "not verified" | **SRC-VERIFIED** |
| TW-6 | Belief Engine "not diagnoses… pressure-tendency" | **SRC-VERIFIED** |
| TW-7 | Negative checks — no "verifies/proves/decides truth", no "verified/trusted source", weak="weak argument" not "fake" | **SRC-VERIFIED** (no banned phrasing in deployed assets) |

This is the strongest section: every trust-framing string the plan requires is present in the deployed assets at this commit.

---

## 8. Mobile Hard Checks (375px)

| ID | Status | Evidence |
|---|---|---|
| ML-1 No horizontal scroll | **BLOCKED(needs-browser)** | mobile rules present (layout 1-col ≤900px, overflow:auto); actual no-side-scroll must be visually confirmed |
| ML-2 Tab usability + edge fade + active-scroll | **SRC-VERIFIED** | mask fade + overflow-x + `_activeTab.scrollIntoView` present |
| ML-3 Key buttons visible | **BLOCKED(needs-browser)** | needs render |
| ML-4 Truths form collapse | **SRC-VERIFIED** | `.truth-add-details` collapse present |
| ML-5 Home card density | **SRC-VERIFIED** | `.cc-card-when` hidden ≤600px; 7 cards present |
| ML-6 Belief Engine on phone | **SRC-VERIFIED (code)** / **BLOCKED (visual)** | standalone app present; 375px render needs browser |

---

## 9. Stop-Condition Review

| # | Condition | Triggered? |
|---|---|---|
| 1 | Blank screen / raw JSON to user | Not observed at source (renderError is friendly + Back-to-Home). Live render unverified. |
| 2 | Embarrassing/test artefact on public surface | **Not checkable here** — requires live data read (the D-116B audit, not yet run, would surface `Sniff/Sniff Butt` etc.). Flagged for manual/D-116B. |
| 3 | Clickable `javascript:`/`data:` source link | **No** — `sourceLink`/`safeHttpUrl` http/https-only guard present in deployed source; any non-web value renders non-clickable. |
| 4 | Missing/contradicted trust wording | **No** — all §7 strings present. |
| 5 | Horizontal scroll at 375px | **Not visually verified** — needs browser. |
| 6 | Step needs a write/mutation, not authorised | All write steps correctly **SKIPPED(needs-approval)**. |
| 7 | Backend unreachable whole session | Not applicable (no live session attempted). |

---

## 10. What Must Still Be Manually Checked (live browser required)

A human (or an authorised connected-browser session) must visually confirm, read-only:
1. **375px: no horizontal scrolling** on Home, Claims, Study, Truths, Submit (ML-1, PH-8).
2. **Live render** of Claims list, Study board, Drift, Evidence Vault (DT-3, PH-3, DR-1, EV-1) — including real empty/populated states.
3. **Mobile tab strip** actually scrolls, shows the edge fade, and the active tab scrolls into view on tap (PH-2, ML-2).
4. **Truths add-form** is collapsed on phone and expands on tap; expanded on desktop with no summary (PH-5, ML-4).
5. **Error panel** appears (not raw JSON/blank) on a real failed request, and Back-to-Home recovers (ER-1/ER-2).
6. **Public-surface artefact scan** — whether any test/embarrassing row (e.g. `Sniff`) is visible to a normal user (overlaps D-116B read-only D1 audit).
7. **Belief Engine** redirect + return path on a real device (BE-4).

Write-path verification (submit/vote/report/RunPack/"Send to HumanX") remains **out of scope** until explicitly authorised.

---

## 11. Final Verdict

**BLOCKED (live render) — with SRC-VERIFIED PASS on all source-checkable items, 0 FAIL.**

- Live browser QA could not be executed in this environment (no connected browser); all live-visual/interaction items are **BLOCKED(needs-browser)**, not failed.
- Every behavior the deployed assets *can* prove at this commit is **SRC-VERIFIED** — most importantly, **all public trust-wording (§7) and the source-link XSS safety guard are present and correct**, and the mobile density/tab/Truths-collapse CSS+JS are in place.
- **No FAIL and no stop-condition breach was detected at the source level.**
- All write-path steps are correctly **SKIPPED(needs-approval)**.

**Recommendation:** the source baseline is clean and launch-relevant wording/safety is verified; the remaining gap is a one-pass **manual live browser walk** (Section 10) on a real phone + desktop, plus the read-only **D-116B** data audit for the public-artefact scan. No code change, deploy, or live write was performed.

---

## 12. Confirmation (this task)

> Docs-only result file. No Wrangler, no D1, no production query, no admin token, no deploy, no Review/admin action, no submit/vote/report/RunPack/"Send to HumanX", no mutation, no code change, no fix. Browser execution was not available; live items recorded as BLOCKED(needs-browser); write items recorded as SKIPPED(needs-approval). D-116B remains not started.
