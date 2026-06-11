# D-101A — End-to-End Public Journey Smoke Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 324 / belief-engine-static-check 24 / worker-route-static-check 39

This is a broad end-to-end pass closing the D-93→D-100 safety/clarity sequence. It consolidates the per-surface audits (D-97A home/Truths, D-98A onboarding, D-100A Study/Claim) and adds the surfaces not yet examined: API/error/empty states, mobile/CSS layout, and admin gating.

---

## A. Files Inspected

| File | Focus |
|---|---|
| `public/index.html` | shell, nav tabs, searchbar + verdict qualifier, noscript, side panel |
| `public/app-v10.js` | `render`/`setMode`, `renderHome`, `renderArena`/`card`/`cls`/`meter`, `renderStudy` + sections, `renderTruths`/`truthCard`, `renderDrift`, `helperText`, `api`, `renderError`, `toast`, `adminToken`/`adminHeaders`, `renderReview` |
| `public/styles.css` | media queries (17), `.tabs`, `main`, `.layout`, `.study-grid`, `.meters`, qualifiers |
| `public/apps/humanx-belief-engine/index.html` | intro, identity-optional, "not diagnoses" disclaimer |
| `scripts/hardening-smoke-test.mjs` | Sections 34/38–43 coverage |
| `docs/D99A`, `D98B`, `D97B`, `D100B`, `README.md` | prior policy + state |

---

## B. End-to-End Public Journey Map

```
ENTRY → index.html (mode-home)
  noscript: clear "JS required" + honest one-paragraph description ✅
  header (commandbar): [LIVE] HumanX [anonymous]  ·  nav tabs  ·  status dot
  nav: Home · Beliefs · Drift · Claims · Submit · Evidence · Truths · Review · RunPack
  searchbar: search + verdict filter + qualifier "Verdicts are pressure-test labels, not automatic truth rulings." (D-98B)

1. HOME (renderHome)
   hero: "HumanX organises what people assert — it does not decide what is true." ✅
   pipeline: Beliefs → Truths → Claims → Evidence → RunPack
   7 action cards, each with icon/desc/"When:" line
   side helperText: pipeline + "New submissions enter Review" + "Pseudonymous"

2. SUBMIT (mode=submit)
   helperText: "Scores reflect what evidence has been submitted — not an automatic verdict." ✅
   "New claims enter Review before becoming public." ✅

3. CLAIMS / ARENA (renderArena → card)
   verdict badge cls(status) + category + meters(Evidence/Test/Survive) + votes + Study btn
   empty state: "No claims match… Submit / Show all" ✅
   helperText: "Browse public claims… Verdicts are pressure-test labels…" (D-100B) ✅

4. STUDY (renderStudy)
   header: verdict badge + title + studyReviewBadge + meters(wide)
   D-100B qualifier line + meter tooltips ✅
   Claim Flow ("read this first", 4 steps, each with empty prompt) ✅
   Investigation Board: Support Evidence | Pressure/Attacks | Tests | Analyses
     strong empty states + severity grouping (Significant/Other) + reused/direct split ✅

5. TRUTHS (renderTruths → truthCard)
   intro: "Public means visible, not proven. Recording a truth here does not verify it." ✅
   card: type badge + "not verified" (11px, D-97B) + neutral "visible" badge + "claim derived" chip
   action: "Pressure-test as Claim" ✅

6. DRIFT (renderDrift)
   full profiles + quick records; empty states explain Belief Engine + "Send to HumanX"
   helperText: "Save as Truth" / "Pressure-test as Claim" (D-98B unified) ✅

7. BELIEF ENGINE (/apps/humanx-belief-engine/)
   intro: "No correct answers. No religion assigned. ~12 min. Stored in this browser only." ✅
   identity screen: "Everything here is optional." ✅
   behavioral profile: "not diagnoses, labels, or predictions… pressure-tendency estimates." ✅

8. FAILURE/EMPTY
   api(): throws on !ok with server message; renderError → "HumanX backend notice" panel
   per-view try/catch → renderError or inline panel; toast for action errors
   empty states present on every list surface ✅

9. REVIEW (mode=review)
   "admin only" red badge + token form; queue content requires x-humanx-admin header ✅
```

---

## C. What Currently Works Well

| Area | Strength |
|---|---|
| Core honesty framing | Hero + noscript + Belief Engine disclaimers all explicit and now **test-locked** (Section 42) |
| Verdict/score clarity | D-98B searchbar qualifier + D-100B Study qualifier + meter tooltips cover both surfaces |
| Truth trust signals | D-97B neutral "visible", strengthened NOT VERIFIED, de-greened chip |
| Empty states | Every public list (claims, truths, evidence, pressure, drift, tests, analyses) has an instructive empty state |
| Belief Engine consent | Optional identity, local-only storage, "no religion assigned", interpretive framing |
| Content neutrality | Claim-type hints and Truth framing neither endorse nor censor sensitive beliefs |
| Admin gating | Review queue data gated behind admin token + `x-humanx-admin` header; borderline/artefact/full-ID admin-only |
| Error surfacing | Centralised `api()` throw + `renderError` + `toast`; no silent failures on the main paths |
| Regression locking | Sections 34/38–43 lock the trust-critical wording and badge behavior |

The D-93→D-100 sequence has left the public journey in a strong, internally consistent state.

---

## D. Friction / Dead-End Risks (Ranked)

### D.1 — LOW: `renderError` panel is a dead-end (no retry affordance)
On a failed fetch, `renderError` shows "HumanX backend notice" + the message but no **Retry** button or path back Home. The user must use the nav tabs to recover. Not a hard dead-end (tabs persist), but a Retry/Reload affordance would smooth transient API failures.

### D.2 — LOW: RunPack/export requires a selected claim; deep-linking unclear
`mode=export` with no `selected` shows "No claim selected… Open a claim → Study → Build RunPack." Good guidance, but a first-timer landing on RunPack via the tab has to backtrack. Mitigated by clear instructions; low severity.

### D.3 — LOW: "Beliefs" tab hard-redirects to a separate app
Clicking "Beliefs" navigates to `/apps/humanx-belief-engine/` (full page change), leaving the SPA. Expected behavior, but there is no "you are leaving the main app" cue and the back-path relies on the browser. Acceptable; note only.

### D.4 — INFO: No first-run tour
There is no onboarding overlay; the user must infer the pipeline from the home cards. The home page is well-structured so this is acceptable (D-98A deferred the tour to B-2). Not a dead-end.

---

## E. Trust / Confusion Risks (Ranked)

### E.1 — LOW: Verdict colour still reads as authority (residual, mitigated)
Green "Proven" / red "Disproven" remain colour-coded. D-98B + D-100B qualifiers now sit beside the verdict on **both** searchbar and Study surfaces, so the misread is mitigated. Recolouring is explicitly **do-not-build** (verdict legitimately summarises a computed state). No further action recommended.

### E.2 — LOW: Claim **card** (list) has no verdict qualifier
The D-100B qualifier landed in the Study header and arena helperText, but the individual claim **card** in the grid still shows a bare coloured verdict badge. Since the arena helperText (side panel) and searchbar both carry the qualifier on the same screen, this is adequately covered — adding per-card qualifiers would be noisy (D-100A explicitly kept it off the cards). Note only.

### E.3 — LOW: "Reality Collapse" verdict remains undefined in-product
The most dramatic verdict label has no inline definition anywhere public. The qualifiers frame all verdicts as "pressure-test labels", which softens it, but a per-verdict definition (tooltip) is the real fix — deferred to backend (needs scoring-model source, D-100A BE-1). Low severity given the qualifiers.

### E.4 — INFO: Truth-derived/borderline context not shown on public claims
By policy advisory and Review-scoped (D-93C). Correct as-is. Do not build public borderline badges.

---

## F. Mobile / Layout Risks (Ranked, code/CSS only — no device testing)

### F.1 — LOW–MEDIUM: `.commandbar` header has no layout rule
`<header class="commandbar">` has **no CSS rule** — its children (`.brand`, `.tabs`, `.statusline`) stack as block elements rather than laying out as a flex row. `main` uses `grid-template-rows:auto auto 1fr`, so the header simply grows taller. On desktop it works but is visually unoptimised; on narrow screens the stacked brand + wrapped tabs + statusline consume significant vertical space above the fold. Adding a `.commandbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}` (or similar) would tighten it. Display-only.

### F.2 — LOW: Responsive coverage is otherwise solid
17 media queries (`900/600/480/400px`). At ≤900px `.layout` and `.study-mode .layout` collapse to one column and `overflow:auto` is restored; `.study-grid` is handled; pipeline arrows hide at ≤600px. The `.tabs` flex-wraps. No obvious breakpoints missing for the main surfaces.

### F.3 — LOW: `.study-grid` is 2-col by default
`repeat(2,minmax(0,1fr))` — relies on the ≤900px override to collapse. Confirmed the override exists, so acceptable. Note only.

---

## G. Admin Leakage Assessment

| Check | Result |
|---|---|
| Review **tab** visible to public | Yes — but labelled, and clicking shows an "admin only" red badge + token form, no data |
| Review **queue data** | Gated — requires admin token sent as `x-humanx-admin` header; backend enforces |
| Borderline `? borderline` badge | Admin-only (`isAdmin && …`) ✅ |
| `? artefact` badge | Public but advisory-only (structural, content-neutral) ✅ |
| Full Truth ID + copy button | Admin-only; public sees `…last8` ✅ |
| Archive artefact button | Admin-only (`isAdmin && artifact`) ✅ |
| Truth admin bar / filter chips | Admin-only ✅ |
| Approve/Reject/cleanup/duplicate controls | Only rendered inside the admin-gated Review queue ✅ |

**No admin leakage.** Only the *concept* of moderation is transparently visible (Review tab + "Pending items are not public" helper). All admin tools and data stay behind the token. This is the desired transparency posture (D-98A E.4).

---

## H. Recommended D-101B Patch

### H.1 — Safe frontend-only (wording / CSS)
| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | Add a `.commandbar` flex layout rule (`display:flex;flex-wrap:wrap;align-items:center;gap:8px`) to tighten the header, especially on mobile | Low — CSS only | F.1 |
| W-2 | Add a **Retry / Back to Home** button to the `renderError` panel | Low — one button + existing `setMode`/reload | D.1 |

### H.2 — Needs backend / schema / API thought
| ID | Change | Why deferred |
|---|---|---|
| BE-1 | Per-verdict definitions (incl. "Reality Collapse") sourced from `claim-scoring.js` thresholds | Requires exposing scoring constants to frontend (E.3) |
| BE-2 | First-run dismissible onboarding tour with client persistence | localStorage state + larger UX work (D.4) |

### H.3 — Admin / manual operations only
| ID | Item |
|---|---|
| OPS-1 | None required — public-journey audit found no pending admin action |

### H.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Recolour/remove verdict badge | Verdict summarises computed state; qualifiers already mitigate (E.1) |
| DN-2 | Per-card verdict qualifiers | Noisy; arena helper + searchbar already cover the screen (E.2) |
| DN-3 | Public borderline/category-echo badges | Advisory, Review-scoped by policy (E.4) |
| DN-4 | Content-based handling of sensitive claims/beliefs | Neutrality policy |
| DN-5 | Auto-hide low-score/empty claims | No auto-hide policy (D-92C) |

---

## I. Suggested Hardening Tests for D-101B

Only if H.1 changes land:

| # | Test |
|---|---|
| 1 | `.commandbar` CSS rule defined with `display:flex` (asserts W-1) |
| 2 | `renderError` panel includes a retry/home affordance (`onclick` to `setMode('home')` or reload) (asserts W-2) |
| 3 | Regression: noscript honest description still present (`does not automatically decide what is true`) |
| 4 | Regression: header nav still contains all public tabs (Home/Claims/Submit/Truths/RunPack) |
| 5 | Regression: Review tab still shows "admin only" gating text in `renderReview` |

Tests 3–5 are pure regression locks and can be added regardless.

---

## J. Proceed with D-101B or Stop?

**Recommendation: the safety/clarity run can be considered COMPLETE. D-101B is OPTIONAL and minor.**

Reasoning:
- The D-93→D-100 sequence systematically hardened every major public surface — Review (admin), Truths + onboarding (entry), Claims/Study (verdict/evidence). This end-to-end pass found **no HIGH or MEDIUM trust, friction, or leakage risks** remaining. The journey is internally consistent and the core honesty promises are test-locked.
- The only findings are **LOW** (one cosmetic header CSS gap F.1, one error-panel UX nicety D.1) plus correctly-deferred backend items (verdict definitions, first-run tour).
- A natural stopping point: declare the clarity run done at the D-100D checkpoint, and optionally schedule **D-101B as a tiny cosmetic/UX cleanup** (W-1 + W-2) if/when convenient — it is not required for trust or safety.

**Suggested:** either (a) stop here and treat D-100D as the production baseline, or (b) do a small optional D-101B cosmetic pass (commandbar layout + error-panel Retry) to close the two LOW items. Both are reasonable; there is no urgent work outstanding.

---

## K. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated.
> No admin token was used.

---

## L. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **324 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
