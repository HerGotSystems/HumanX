# D-308A — Belief Engine HumanX Navigation Product Pass

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 44 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at pass:** `cdf4454` (D-307B)

---

## Context

D-306A's audit of Belief Engine found strong safety framing and zero boundary violations, with one secondary finding deliberately deferred: **there is no persistent way back to HumanX from inside Belief Engine until the very end of results.** D-306B fixed the unrelated "no example before committing" gap; this pass picks up the deferred navigation finding on its own, as D-306A recommended (narrow, audited, one friction at a time — not bundled with the preview work).

---

## 1. Current-State Summary

Belief Engine (`public/apps/humanx-belief-engine/index.html`) has five screens, confirmed by scanning for `id="screen-*"`: `screen-intro`, `screen-identity`, `screen-timeline`, `screen-quiz`, `screen-results`. There is **no `<header>` and no `<nav>` element anywhere in the file** (confirmed by direct search — zero matches). All screen-to-screen transitions are internal JavaScript phase changes (`skipIdentity()`, `confirmIdentity()`, `skipTimeline()`, `prevCat()`, `nextCat()`); none of them navigate to the main HumanX app. The only two things that reference the main app at all are: (1) three `target="_blank"` links at the very bottom of the results screen ("Browse Claims" / "Submit a Claim" / "Browse Truths"), and (2) the "Send to HumanX" button injected by `humanx-bridge.js`, which posts data but does not navigate anywhere.

---

## 2. Entry and Exit Points Found

**Entry (from D-306A, re-confirmed):** five entry points in the main app (top nav tab, Home Actions card, two Drift empty-state buttons, My HumanX Belief Mirror empty-state button) all converge on one hard redirect: `location.href='/apps/humanx-belief-engine/'`.

**Exit — this is the gap:**

| Screen | Exit to HumanX available? |
|---|---|
| `screen-intro` | **No.** `<div class="intro-logo">HumanX</div>` is plain text, not a link. |
| `screen-identity` | **No.** Only `skipIdentity()`/`confirmIdentity()`, both internal. |
| `screen-timeline` | **No.** Only `skipTimeline()`, internal. |
| `screen-quiz` | **No.** `← Back` calls `prevCat()`, which decrements the category index or returns to `screen-identity` — it never leaves Belief Engine, even from the first question. |
| `screen-results` | **Only at the very bottom**, after scrolling past the entire results dashboard — three `target="_blank"` links that open a **new tab** rather than navigating back in the current one. |

**Conclusion: a user who wants to leave Belief Engine and return to HumanX, at any point before finishing the full flow, has no in-app path — only the browser Back button or closing the tab.**

---

## 3. Navigation Friction Assessment

**Q1. How does a user currently enter Belief Engine from HumanX?** Hard redirect (`location.href`) from any of five entry points — confirmed in D-306A, re-confirmed here.

**Q2/Q3. Visible way back to HumanX Home or My HumanX?** No, from any screen, in the current tab.

**Q4. Visible way back before starting the flow?** No — the intro screen's "HumanX" text is not a link.

**Q5. Visible way back during the flow?** No — `prevCat()` is quiz-internal only.

**Q6. Visible way back on results?** Only after scrolling to the bottom, and only as a new-tab link, not an in-place return.

**Q7. Does Belief Engine feel like part of HumanX or a detached standalone app?** Given the identical dark palette, "HumanX" branding, and eventual bridge back — it reads as *conceptually* part of HumanX. But **navigationally, it behaves like a one-way door**: nothing on any of the first four screens (which cover roughly the first 10 of the advertised 10–12 minutes) offers a way out except the browser chrome. That is a detached-*feeling* experience even though the branding is not detached.

**Q8. Would a persistent small back link help?** Yes — this is a real, low-effort, evidence-backed gap, distinct from and smaller than the D-306A/B preview fix.

---

## 4. Progress-Loss Risk Assessment

This is the single most important technical finding in this pass, because it changes the *safe* answer to "where should the link go."

Checked directly in the file: `saveRunRecord()` — the only function that persists quiz data to `localStorage` — is called **exactly once**, inside `finishQuiz()`, which only runs after the timeline phase completes (i.e., after the full 77-statement flow is answered). There is **no incremental/partial-progress autosave** anywhere in `screen-quiz` or `screen-timeline`. The existing "↩ View previous results" button on the intro screen only surfaces a *completed* prior run — it has no concept of resuming an in-progress, unfinished quiz.

**Consequence:**

- **Q12. Would the link risk losing quiz progress?** **Yes, concretely — if placed on `screen-quiz` or `screen-timeline`.** A user who is 50 statements in and clicks a back-to-HumanX link (or the browser Back button, which already has this exact risk today) loses all 50 answers with no recovery path.
- **On `screen-intro`:** zero risk — no answers exist yet.
- **On `screen-results`:** zero risk — `saveRunRecord()` has already run by the time results render.
- **Q13/Q15. Should the link be present during the quiz, or only on intro/results?** **Only intro/results.** This is not a stylistic preference — it is dictated by the actual persistence behavior of the code. Adding a visible, inviting "leave" affordance on the one part of the flow where leaving is destructive would be a regression, not an improvement.
- **Q14. Would a back link need confirmation if progress could be lost?** Only relevant if a link were ever added to `screen-quiz`/`screen-timeline`, which this pass does not recommend. A confirmation dialog is a heavier, riskier UI pattern (it would need to intercept navigation, which is more code and more surface area) than simply not offering the link where it's unsafe.

---

## 5. Candidate Options Considered

| Option | Verdict |
|---|---|
| No change | Rejected — a real, evidence-backed gap exists (zero in-tab exit path for ~10 of 12 minutes) |
| **Intro-only link: `← Back to HumanX`** | Partial — solves the "I haven't started yet and want to leave" case, but leaves results (the other genuinely safe screen) still exit-only via new-tab links |
| **Intro + results link** | **Recommended** — covers both screens where leaving is provably safe (no answers yet, or already saved), symmetric with how the user arrived (hard redirect in, hard redirect back out) |
| Persistent top link on every Belief Engine screen (including quiz/timeline) | Rejected — directly contradicts the progress-loss finding in section 4; would need either incremental autosave (a real feature, out of scope) or a confirmation-dialog interceptor (added complexity/risk) before it could be done safely |
| Link with progress-loss warning | Rejected for this pass — only becomes relevant if a future task adds the link to quiz/timeline screens, which this pass does not recommend |
| Full HumanX nav (tabs) inside Belief Engine | Rejected — Belief Engine is deliberately a focused, single-purpose standalone screen (D-306A finding); importing the full main-app nav chrome would be a much larger, riskier change than the gap warrants, and risks visually breaking the intro/results screens' distinct design |
| Result-page bridge-copy improvement instead of navigation | Rejected as a *substitute* — bridge copy is already good (D-306A finding); the gap here is navigational, not explanatory, so a copy change would not address it |

---

## 6. Recommended D-308B Candidate

**Add one small, static `← Back to HumanX` link to `screen-intro` and `screen-results` only** (not `screen-identity`, `screen-timeline`, or `screen-quiz`).

- **Q10. Label:** `← Back to HumanX` — matches the exact arrow-plus-label convention already used elsewhere in this same file (`← Back`, `Skip all of this →`, `Skip →`) and in the main app (`← Back to Review`, etc., per D-265B). Clearer than "HumanX Home" (ambiguous — home page of what?) or "Return to HumanX" (slightly more formal, less consistent with the file's existing short-arrow-link style).
- **Q11. Destination:** `/` (the main app's root — same origin, resolves to Home). A relative same-origin link, not the full `https://humanx.rinkimirikata.com` absolute URL used by the three existing results-bottom links (those are `target="_blank"`, external-style, on purpose; this new link is meant to feel like leaving the sub-app in place, not opening a new tab).
- **Placement:** top of `screen-intro` (near the existing `intro-logo`) and top of `screen-results` (near "Your Belief Architecture"), so it's visible immediately on both screens without scrolling — unlike the existing bottom-of-results links.
- **Does not need a `target="_blank"`** — a plain in-tab navigation is correct here, since there is no in-progress state to protect on either of these two screens.

---

## 7. D-308B Classification

**Frontend-only.** Touches only `public/apps/humanx-belief-engine/index.html` (two small static `<a>` elements plus, if needed, minimal reuse of existing link styling — no new CSS class strictly required, existing text/link color variables can be reused inline as D-306B already did). No backend/API/schema/storage changes. Must preserve every marker currently locked by `scripts/belief-engine-static-check.mjs` (44 checks, including the 20 added in D-306B for the intro preview).

**Q16/Q17.** Frontend-only; no backend/API/schema/storage change is useful or necessary for this fix.

**Q18. Does this overlap with bridge/export behavior?** No. The bridge (`humanx-bridge.js`) only injects the "Send to HumanX" button into `.results-actions`; the recommended link is a separate, independent static element and does not touch the bridge file, the "Send to HumanX" flow, or the existing three bottom-of-results external links.

**Q19/Q21.** The smallest useful, safe, frontend-only candidate is exactly the two-link addition above — no smaller change closes the actual gap (a single link would leave one of the two safe screens still without an exit), and no larger change is justified given the progress-loss finding rules out extending it to quiz/timeline for now.

**Q22.** Navigation is **not** already good enough to say stop — section 2/4's findings are concrete and load-bearing (zero in-tab exit path across four of five screens, backed by a specific, verified persistence gap). A "no implementation" verdict would leave a real, cheap-to-fix gap unaddressed.

---

## 8. Explicit "Do Not Do Next" List

- **Do not add a back-to-HumanX link to `screen-quiz` or `screen-timeline`** without first adding incremental answer autosave (a real feature requiring its own audit) or a progress-loss confirmation dialog (its own, separately-scoped UI risk).
- **Do not remove or alter the existing three bottom-of-results `target="_blank"` links** ("Browse Claims" / "Submit a Claim" / "Browse Truths") — they serve a different purpose (post-completion next-step suggestions) and are unrelated to this fix.
- **Do not touch `humanx-bridge.js`, the "Send to HumanX" button, or `saveRunRecord()`** under this navigation fix.
- **Do not alter the 77-statement flow, scoring, dimension weights, archetype matching, or contradiction logic.**
- **Do not add a full main-app navigation bar** to Belief Engine — the fix is two small links, not new chrome.
- **Do not remove or alter any of the 44 markers locked by `scripts/belief-engine-static-check.mjs`**, including the D-306B preview content.
- **Do not weaken any existing safety copy** ("No diagnosis.", "Use it as a mirror, not a verdict.", the D-306B boundary line) while making this change.

---

## Summary

| Question | Answer |
|---|---|
| Entry points | 5, all converging on the same hard redirect (confirmed, unchanged from D-306A) |
| In-tab exit path today | None on 4 of 5 screens; new-tab-only links at the very bottom of the 5th |
| Does Belief Engine feel detached? | Navigationally yes, for most of the flow, despite matching branding |
| Progress-loss risk if a link were added mid-quiz | **Real and concrete** — `saveRunRecord()` only fires at full completion, no incremental autosave exists |
| Safest placement | Intro and results only |
| Smallest useful D-308B candidate | Add `← Back to HumanX` (→ `/`) to `screen-intro` and `screen-results` |
| D-308B classification | Frontend-only |
| Backend/schema/API needed | No |
| Overlaps bridge/export behavior | No — independent of `humanx-bridge.js` |
| Stop and do nothing? | No — a real, cheap, evidence-backed gap exists |
