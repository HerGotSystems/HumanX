# D-98B — Public Onboarding Terminology Clarity Pass

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/index.html`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 299 / 24 / 39 → **312 / 24 / 39**
**Audit basis:** D-98A public onboarding & terminology clarity audit

---

## What Changed

### 1. Unified Truth→Claim action wording (D-98A finding D.1)

The same action was labelled three different ways. All public-facing display copy now reads **"Pressure-test as Claim"**, matching the button D-92C standardised.

| Surface | Before | After |
|---|---|---|
| `helperText` drift branch | "**Send to Claim Review** — creates a public, pressure-testable claim." | "**Pressure-test as Claim** — submits it as a public claim for review." |
| `helperText` truths branch | "**Send to Claim Review** converts a truth into a pressure-testable public claim." | "**Pressure-test as Claim** submits a truth as a public claim for review." |
| Drift profile card button | `>Send to Claim Review</button>` | `>Pressure-test as Claim</button>` |

Only display text changed. The `onclick` handlers, backend route (`/api/truth-to-claim`), and internal function names are untouched. `"Send to Claim Review"` no longer appears anywhere in the codebase.

### 2. Verdict-label qualifier (D-98A findings D.2 / E.1)

The global searchbar verdict filter (Proven / Disproven / Reality Collapse / …) had no nearby methodology note and could read as HumanX issuing authoritative rulings. Added a short, muted qualifier directly beside the filter in `public/index.html`:

```html
<span class="verdict-qualifier small">Verdicts are pressure-test labels, not automatic truth rulings.</span>
```

```css
.verdict-qualifier{color:var(--muted);opacity:.7;font-size:10px;flex-shrink:1;line-height:1.2}
```

Small, muted, non-alarmist — co-locates the existing "not an automatic verdict" framing with the verdict vocabulary itself.

### 3. Preserved good copy (unchanged)

- Hero: **"HumanX organises what people assert — it does not decide what is true."**
- noscript: **"does not automatically decide what is true."**
- Belief Engine: **"not diagnoses… pressure-tendency estimates"**, **"No correct answers. No religion assigned."**
- Submit helper: **"Scores reflect what evidence has been submitted — not an automatic verdict."**
- Truths helper: **"records what is asserted, not whether it is correct."**

"Forensic" (optional W-3 softening) was **left as-is** — the in-app "not diagnoses" disclaimer adequately frames it, and the change was not clearly risk-free wording-only across all surfaces, so it was deferred per the optional/cautious instruction.

---

## Trust Promises Now Regression-Locked

D-98A's biggest finding was that the platform's core trust promises were wording-only and **unprotected by any test** — a future copy edit could silently weaken them. Section 42 now locks them:

| Promise | Test |
|---|---|
| Hero "does not decide what is true" | 42.1 |
| noscript "does not automatically decide what is true" | 42.2 |
| Belief Engine "not diagnoses" + "pressure-tendency" | 42.3 |
| Belief Engine "No correct answers" / "No religion assigned" | 42.4 |
| Submit "not an automatic verdict" | 42.5 |
| Truths "what is asserted, not whether it is correct" (D-92C) | 42.10 |

These six are pure regression locks — they protect existing copy regardless of any wording change.

---

## Why Verdict Labels Got a Qualifier

Verdict terms like "Proven" and "Reality Collapse" appeared in the always-visible searchbar with no methodology context. To a first-time user this risks reading as HumanX *pronouncing* verdicts — directly contradicting the hero promise that HumanX "does not decide what is true." The existing mitigation ("Scores reflect what evidence has been submitted — not an automatic verdict") was mode-scoped to the submit helper and not shown beside the filter. The qualifier co-locates that framing with the risk, in one short muted line.

---

## Hardening Tests Added (Section 42 — 13 new tests, 299 → 312)

| # | Test |
|---|---|
| 42.1 | Hero no-overclaim copy remains present |
| 42.2 | noscript no-overclaim copy remains present |
| 42.3 | Belief Engine not-diagnosis / pressure-tendency disclaimer remains present |
| 42.4 | Belief Engine neutrality copy remains present |
| 42.5 | Submit "not an automatic verdict" qualifier remains present |
| 42.6 | "Send to Claim Review" no longer appears in public copy |
| 42.7 | "Pressure-test as Claim" appears consistently (>= 4 occurrences) |
| 42.8 | Verdict qualifier present near filter ("not automatic truth rulings" + `verdict-qualifier`) |
| 42.9 | Public copy does not claim HumanX proves/decides/verifies truth automatically |
| 42.10 | Truths helper keeps "what is asserted, not whether it is correct" |
| 42.11 | Review-only moderation wording remains in review helper |
| 42.12 | `.verdict-qualifier` CSS rule defined |
| 42.13 | No backend/D1/wrangler/deploy references added in onboarding copy |

A new `beliefEngineSrc` read was added to the smoke test to cover the standalone Belief Engine HTML.

---

## Safety Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — display text only; routes and function names untouched |
| No moderation/admin actions | ✅ |
| No deploy/D1/live mutation | ✅ |
| No Wrangler | ✅ |
| Belief Engine behavior unchanged | ✅ — disclaimer copy preserved, no logic touched |
| Sensitive beliefs neutral, not censored | ✅ — no onboarding copy endorses or condemns any belief |
| Admin/Review tooling stays gated | ✅ — only the moderation concept is described in public helper text |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 299 passed, 0 failed | **312 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |
