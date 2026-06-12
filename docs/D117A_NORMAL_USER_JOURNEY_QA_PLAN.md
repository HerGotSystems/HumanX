# D-117A — End-to-End Normal-User Journey QA PLAN

**Date:** 2026-06-10
**Mode:** DOCS ONLY — this is a QA *plan/checklist*. No Wrangler, no D1, no production query, no admin token, no deploy, no live test submission was performed to produce it.
**Baseline:** repo `c11b1d2` · deployed Worker `3fe7ab7f-b603-407b-b7b8-31111956a3ea` · static 416 / 24 / 56
**Live URL under test (when authorised):** https://humanx.rinkimirikata.com (or the workers.dev URL)

> This defines how to verify the public, non-admin user experience after D-111→D-116. It is a manual QA checklist a human (or an explicitly-authorised browser session) runs against the live site. **Producing this plan executed nothing.**

---

## 0. Authorisation & Safety Boundary

| Action | Allowed without explicit approval? |
|---|---|
| Reading this plan; reviewing local code/CSS to predict behavior | ✅ yes |
| Loading public pages in a browser (read-only navigation) | ✅ yes — read-only browsing only |
| Search/filter, opening claims, opening Study, scrolling, resizing | ✅ yes — no writes |
| **Submitting a live claim / truth / evidence / vote / report** | ❌ **NO — requires explicit approval** ("Authorised: submit live test claim" or similar) |
| Building a RunPack that **writes** an `aip_packets` row | ⚠ writes a DB row — treat as needing approval (see J) |
| Any admin/Review action, admin token entry | ❌ NO — out of scope for normal-user QA |
| Wrangler / D1 / deploy | ❌ NO |

**Default:** this QA is **read-only browsing**. Any step that mutates production data (submit, vote, report, RunPack-build) is marked ⚠/❌ and is **skipped unless explicitly authorised**.

---

## 1. Pass/Fail Format

For each step record:

```
[Step ID] <action>
  Expected: <expected result>
  Result:   PASS | FAIL | BLOCKED | SKIPPED(needs-approval)
  Notes:    <observation; for FAIL include screenshot/console/network detail>
```

- **PASS** — observed matches expected.
- **FAIL** — observed differs; capture detail.
- **BLOCKED** — could not test (e.g. backend down — itself a finding, see Section R).
- **SKIPPED(needs-approval)** — a write step deferred pending explicit authorisation.

---

## 2. Desktop Journey (≥1024px)

Home → Claims → Study → RunPack → Truths → Submit → confirmation → Browse Claims.

| ID | Step | Expected |
|---|---|---|
| DT-1 | Load Home | Hero loads; subtitle reads "HumanX organises what people assert — **it does not decide what is true**"; pipeline banner + 7 action cards each with description **and** "When:" line (desktop shows "When:"); no console errors |
| DT-2 | Read trust framing on Home | Hero no-overclaim line present; statusline shows live/demo + counts |
| DT-3 | Click **Browse Claims** (or Claims tab) | Claims list renders; each card shows verdict badge + category + meters (Evidence/Test/Survive) + votes; or a clear empty state |
| DT-4 | Open a claim → **Study Claim** | Study view: verdict badge + title + meters(wide) + **"Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty."** + Claim Flow (4 steps) + Investigation Board (Support Evidence / Pressure / Tests / Analyses) |
| DT-5 | Inspect evidence source links in Study | http/https sources are clickable (`target=_blank rel=noopener`); any non-web/empty source shows "not a valid web address" / "no source provided" — **never a clickable `javascript:`/`data:` link**; weak evidence shows "weak argument" with tier colour |
| DT-6 | Hover the score meters | Tooltips explain Evidence/Testability/Survivability |
| DT-7 | RunPack tab (no claim selected) | Guidance: "No claim selected… Open a claim → Study → Build RunPack" — compact, not blank |
| DT-8 | ⚠ Build RunPack from a studied claim | (writes `aip_packets`) **SKIP unless approved.** If approved: packet builds, copy/download work, packet contains no admin token/secret |
| DT-9 | Truths tab | Intro: "**Public means visible, not proven.** Recording a truth here does not verify it." Add-a-Truth form expanded on desktop (no summary toggle); truth cards show neutral "visible" badge + bold "not verified" + "claim derived" chip where applicable |
| DT-10 | Submit tab | H2 + intro + **"Scores reflect submitted evidence — not an automatic verdict."** visible in main panel; collapsed "Writing tips"; form fields; "Enters Review before going public." note |
| DT-11 | ❌/⚠ Submit a claim | **SKIP unless approved.** If approved: success toast, claim enters Review (not immediately public), form clears |
| DT-12 | Return to Browse Claims | List still renders; navigation between tabs leaves no stuck/blank state |

---

## 3. Phone Journey (375px width)

Home → mobile tabs → Claims → Study → Truths (collapsed Add form) → Submit → confirmation.

| ID | Step | Expected |
|---|---|---|
| PH-1 | Load Home at 375px | Single-column; hero readable; **no horizontal page scroll**; action cards stack; "When:" lines **hidden** on phone (D-113B); pipeline arrows hidden, stages wrap |
| PH-2 | Tab strip | Tabs in one horizontal-scroll row with a **right-edge fade cue** (D-112B); swiping reveals Review/RunPack; tapping a tab scrolls it into view |
| PH-3 | Claims tab | Claim cards 1-col; titles/meters/verdict readable; no overflow |
| PH-4 | Open Study | Verdict qualifier + meters wide collapse to fit; Investigation Board sections stack 1-col; no horizontal scroll |
| PH-5 | Truths tab | Add-a-Truth form **collapsed** behind "Add a public Truth" summary (D-114B); truth list visible sooner; tapping summary expands the same fields |
| PH-6 | ⚠ Expand + submit a truth | **SKIP unless approved.** If approved: same submit behavior as desktop |
| PH-7 | Submit tab | Trust note visible; fields usable; buttons reachable without zoom |
| PH-8 | General 375px sweep | No element causes horizontal scrolling; key CTAs visible; tap targets not overlapping |

---

## 4. Belief Engine Handoff

| ID | Step | Expected |
|---|---|---|
| BE-1 | Click **Beliefs** tab | Hard-redirects to `/apps/humanx-belief-engine/` (standalone app) |
| BE-2 | Belief Engine intro | "No correct answers. No religion assigned. ~12 minutes. Stored in this browser only." present; identity screen optional |
| BE-3 | Interpretive framing | Behavioral profile copy: "**not diagnoses, labels, or predictions**… pressure-tendency estimates" |
| BE-4 | Return path | After "Send to HumanX" (⚠ write — skip unless approved), returning to the main app shows the snapshot in Drift; back-navigation works (browser back or tab) |

---

## 5. Drift, Evidence Vault, Search/Filter

| ID | Step | Expected |
|---|---|---|
| DR-1 | Drift tab | Loads without blank/error; shows full profiles + quick records, or an instructive empty state ("Open the Belief Engine… Send to HumanX") — **never a raw error/blank** |
| EV-1 | Evidence Vault tab | Loads public reusable evidence, or a clear empty state; evidence source links obey http/https-only rendering |
| SF-1 | Search bar (in Claims) | Typing filters the current list; clearing restores it; does not break the current mode or throw |
| SF-2 | Verdict filter dropdown | Selecting a verdict narrows the list; the qualifier "Verdicts are pressure-test labels, not automatic truth rulings" is visible near it |
| SF-3 | Search while in a non-claim mode | Search acts on the current workspace; no crash/blank |

---

## 6. Error Recovery (Section R)

| ID | Step | Expected |
|---|---|---|
| ER-1 | Simulate backend unreachable (offline / blocked request) — read-only (DevTools offline, or observe a naturally failed load) | UI shows a readable "HumanX backend notice" panel with a **"← Back to Home"** button (D-101B) — **not raw JSON, not a blank page** |
| ER-2 | Recover via Back to Home | Clicking returns to Home and the app re-renders cleanly |
| ER-3 | Empty states across tabs | Claims/Truths/Vault/Drift empty states are instructive sentences, not blank panels or stack traces |

---

## 7. Public Trust Wording (verify present & correct)

| ID | Surface | Expected wording |
|---|---|---|
| TW-1 | Home hero | "it does not decide what is true" |
| TW-2 | Submit panel | "Scores reflect submitted evidence — not an automatic verdict." (visible in main panel, D-111B) |
| TW-3 | Arena searchbar | "Verdicts are pressure-test labels, not automatic truth rulings." |
| TW-4 | Study header | "Verdict is a pressure-test label, not an automatic truth ruling." |
| TW-5 | Truths page | "Public means visible, not proven." + truth cards show neutral "visible" (not green "Public") + bold "not verified" |
| TW-6 | Belief Engine | "not diagnoses… pressure-tendency estimates" |
| TW-7 | Negative checks | No surface claims HumanX "verifies", "proves", or "decides" truth; no "verified source"/"trusted source"; weak evidence labelled "weak argument", never "fake" |

---

## 8. Mobile Layout Hard Checks (375px)

| ID | Check | Expected |
|---|---|---|
| ML-1 | Horizontal scroll | **None** on any public page at 375px (the page body must not scroll sideways) |
| ML-2 | Tab usability | Tab strip scrolls horizontally with edge-fade cue; active tab scrolls into view; all 9 tabs reachable |
| ML-3 | Key buttons | Submit, Browse, Build RunPack, vote buttons visible and tappable |
| ML-4 | Truths form collapse | Add-a-Truth collapsed behind summary; expands on tap |
| ML-5 | Home card density | "When:" lines hidden; titles + descriptions present; all 7 cards present |
| ML-6 | Belief Engine on phone | Standalone app renders without horizontal scroll |

---

## 9. Stop Conditions (for the future authorised QA run)

Stop and report immediately if:
1. Any page renders a **blank screen or raw JSON / stack trace** to a normal user (capture URL + console/network).
2. An **embarrassing/test artefact** (e.g. `Sniff / Sniff Butt`) is visible on a **public** surface → record ID/text, flag for moderator action (do not fix here).
3. A **`javascript:`/`data:`/non-web source link is clickable** anywhere → security regression; stop, record the claim/evidence ID, escalate (do not click it).
4. Any trust-framing wording from Section 7 is **missing or contradicted** (e.g. a surface implies HumanX verifies truth).
5. **Horizontal scrolling** appears at 375px on a core public page.
6. A QA step would require a **write/mutation** (submit/vote/report/RunPack) and has **not** been explicitly authorised → mark SKIPPED, do not perform it.
7. Backend is unreachable for the whole session → record as BLOCKED; ER-1/ER-2 still testable for the error UI itself.

---

## 10. What Requires Explicit Approval (recap)

- ⚠ **Submitting any content** (claim, truth, evidence, pressure, vote, report) — these write to production D1.
- ⚠ **Building a RunPack** — writes an `aip_packets` row.
- ⚠ **Belief Engine "Send to HumanX"** — writes a `belief_snapshots` row.
- ❌ Any admin/Review action, admin token entry, Wrangler, D1, deploy.

If write-path QA is wanted, request it explicitly; otherwise the run is read-only browsing + the SKIPPED write steps are noted as such. (If approved, prefer a clearly-labelled test claim that can later be rejected/cleaned via the normal Review UI, exact-ID.)

---

## 11. Coverage Map (this plan ↔ shipped work)

| Shipped pass | Covered by |
|---|---|
| D-111B submit trust note | DT-10, TW-2 |
| D-112B mobile tab cue + active-tab scroll | PH-2, ML-2 |
| D-113B Home card density (phone) | PH-1, ML-5 |
| D-114B Truths form mobile collapse | PH-5, ML-4 |
| D-104/D-107 source-URL safety | DT-5, EV-1, stop-condition 3 |
| D-103 evidence quality clarity | DT-5 |
| D-100B Study verdict/score qualifier | DT-4, DT-6, TW-4 |
| D-101B error recovery | ER-1, ER-2 |
| D-97/D-98 trust framing | TW-1, TW-3, TW-5 |

---

## 12. Confirmation (this task)

> Docs-only. No Wrangler, no D1, no production query, no live test submission, no admin token, no deploy, no mutation. Repo unchanged except this plan document. D-116B remains not started. Executing this QA (beyond read-only browsing) — and any write step — requires explicit approval.
