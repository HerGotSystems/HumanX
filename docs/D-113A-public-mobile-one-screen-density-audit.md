# D-113A — Public Mobile One-Screen Density Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 392 / belief-engine-static-check 24 / worker-route-static-check 56

Assesses whether public surfaces feel too tall / scroll-heavy on a phone after the D-111/D-112 UX polish (submit trust note, mobile tab edge cue, active-tab scroll).

---

## A. Files Read

- `public/index.html` (shell/nav), `public/app-v10.js` (`renderHome`, `renderSubmit`, `renderArena`, `renderStudy`, `renderTruths`, `renderReview`, `renderExport`), `public/styles.css` (responsive rules 900/600/480/400px)
- `scripts/hardening-smoke-test.mjs`
- `docs/D-111A`, `D-112A`, `D112D`, `README.md`

---

## B. Public Mobile Density Map (by screen, ≤414px phone)

| Screen | Leading vertical stack (top → first useful content) | Density |
|---|---|---|
| **Home** | hero badge + H1 + subtitle + statusline + pipeline banner (5 stages, wraps ~2 rows) + **7 action cards, each: icon + title + description + italic "When:" line + action link** (grid is 2-col at 400–600px, **1-col below 400px**) | 🔴 tallest surface |
| **Submit** | H2 + intro para + **submit trust note** + collapsed "Writing tips" `<details>` → then form fields | 🟢 good (tips collapsed; trust note + first field appear early) |
| **Arena** | section-head "Claims" + graphBox + claim card grid (1-col ≤400px) | 🟡 graphBox above list |
| **Study** | back/verdict badge + title + meters(wide) + verdict qualifier + vote row + **"Claim Flow — read this first" (4 steps)** + lineage + Investigation Board | 🟡 useful-first but long pre-board |
| **Truths** | section-head + "widely asserted" badge + intro para + **always-expanded "Add a Truth" form (4 inputs + select + button + note)** → then truth grid | 🔴 form above the list |
| **Review (public)** | "Review Queue" + red **"admin only"** badge + token form + "Enter admin token to load the queue." | 🟢 clearly locked, not broken |
| **RunPack (export)** | claim-context / "no claim selected" guidance + build/copy actions | 🟢 compact, guidance-first |
| **Beliefs** | tab → `location.href` redirect to standalone Belief Engine | n/a (separate app) |

---

## C. Findings (Ranked by Severity)

### C.1 — MEDIUM: Home is the tallest mobile surface (7 full cards × desc + "When:" line)
The home action grid renders **7 cards**, each with an icon, title, description (`.cc-card-desc`, 10px), **and** an italic "When:" line (`.cc-card-when`, 9px). At 400–600px the grid is 2-col; **below 400px it is 1-col**, so all 7 cards stack full-height. The hero (subtitle + statusline) and the pipeline banner (5 stages wrapping to ~2 rows) sit above them. Net: a phone user scrolls through hero + pipeline + 7 tall cards. The **`.cc-card-when` lines are the most compressible element** — secondary "when to use this" guidance that largely restates intent already conveyed by the card title + description. Removing/hiding them on mobile materially shortens the page with no loss of primary information (and no desktop change if scoped to a mobile media query).

### C.2 — MEDIUM: Truths renders the always-expanded "Add a Truth" form above the truth list
`renderTruths` order is: section-head → intro paragraph → **Add-a-Truth form** (statement, category, origin inputs + truth-type select + submit button + review note) → truth grid. The form is **not** collapsible (no `<details>`), so a mobile user who arrives to *browse* existing truths must scroll past the entire submission form first. This pushes the actual public content (the truths) well below the fold on a phone.

### C.3 — LOW: Study shows a long lead before the Investigation Board
Study leads with meters + verdict qualifier + vote row + the 4-step "Claim Flow (read this first)" + lineage before the evidence/pressure board. This is **useful-first** (the flow is genuinely orienting) and each block is compact, so it's acceptable — but it is a lot of vertical content before the evidence sections on a phone. Low priority; do not restructure.

### C.4 — LOW: Arena shows `graphBox` above the claim list
The arena section-head includes `graphBox()` before the claim grid. Minor; the graph is small and the list follows promptly. No action.

### C.5 — INFO (good): Submit, Review gate, RunPack are well-sized
- Submit: writing tips are a **collapsed `<details>`**; the trust note and first input appear early. ✅
- Review public gate: shows the red **"admin only"** badge + token form + "Enter admin token to load the queue." — reads as **clearly locked/admin-only, not broken/empty**. ✅
- RunPack: compact, guidance-first ("no claim selected" path explains the route). ✅

No admin-ish copy leaks into public surfaces; CTAs (Submit/Browse on home cards, Build RunPack, etc.) are present.

---

## D. Smallest Safe D-113B Recommendation

| ID | Change | Risk | Addresses |
|---|---|---|---|
| **W-1 (primary, smallest)** | **Hide `.cc-card-when` lines on mobile** (`@media(max-width:600px){.cc-card-when{display:none}}`) — CSS-only, removes 7 secondary lines of height on phones, **zero desktop change, zero content loss** (the "When:" guidance stays on desktop where there's room) | Very low — one CSS rule | C.1 |
| W-2 (optional, slightly larger) | **Collapse the Truths "Add a Truth" form into a `<details>`** (summary e.g. "+ Add a Truth", collapsed by default) so the truth list is reachable sooner | Low–medium — `renderTruths` markup change; affects desktop too (form starts collapsed) | C.2 |

**Recommended smallest patch: W-1 alone** — a single mobile-scoped CSS rule that meaningfully shortens the tallest surface (Home) with no behavior, content, or desktop impact. W-2 is a worthwhile follow-up but is a markup change that alters desktop layout (form collapsed by default), so it deserves its own explicit decision rather than being bundled as "smallest safe."

If both are wanted, keep them as one small frontend patch but document the desktop-collapse behavior of W-2 explicitly.

---

## E. Do-Not-Build

| Item | Reason |
|---|---|
| Removing home action cards or the pipeline banner | They are the primary navigation/orientation; don't cut content to save height |
| Removing the "When:" lines on **desktop** | They add value where vertical space is ample; scope to mobile only |
| Collapsing/hiding the Study "Claim Flow" | Useful-first orientation; compact already |
| Hiding the submit trust note or any trust framing to save space | Safety copy must stay visible (D-111 just surfaced it) |
| Making the Review gate look "empty" to de-clutter | It must read as clearly locked/admin-only, which it does |
| Multi-step wizards / accordion-everything redesign | Over-engineering; the surfaces are simple lists/forms |

---

## F. Suggested Hardening Tests for D-113B

If W-1 (and/or W-2) is implemented:

| # | Test |
|---|---|
| 1 | `styles.css` hides `.cc-card-when` within a `max-width:600px` media block (asserts W-1, mobile-scoped) |
| 2 | `.cc-card-when` is still defined for desktop (not globally removed) — content preserved on desktop |
| 3 | Home still renders all 7 action cards (`cc-card-desc` count unchanged) — no cards removed |
| 4 | (if W-2) Truths "Add a Truth" form is wrapped in `<details>`; truth grid container still present |
| 5 | (if W-2) submit/trust framing and Truths "Public means visible, not proven" copy remain |
| 6 | No backend/D1/wrangler/deploy references added |

---

## G. Final D-113B Recommendation

**Implement W-1 — a single mobile-scoped CSS rule hiding `.cc-card-when` at ≤600px — as the smallest safe density win.** It shortens the tallest public surface (Home) on phones with no desktop change and no content loss. Optionally pair with **W-2** (collapse the Truths add-form into a `<details>`) to fix the form-above-list density on the Truths page, but treat W-2 as a deliberate choice since it also changes the desktop default. Build nothing from Section E.

This is **polish-level density tuning, not a safety or correctness issue** — the public app is functional and trust-framed on mobile today; D-113B would just make Home (and optionally Truths) shorter on a phone.

---

## H. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, admin/moderation, token-rotation, or live mutation was performed.

---

## I. Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **392 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **56 passed, 0 failed (56 hard checks)** |
