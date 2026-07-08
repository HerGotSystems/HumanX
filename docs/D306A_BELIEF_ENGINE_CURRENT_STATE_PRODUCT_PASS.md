# D-306A — Belief Engine Current-State Product Pass

**Scope:** Docs only
**Status:** COMPLETE
**Branch:** main (direct commit)
**Baseline:** 3515 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 known warn)
**Date:** 2026-07-08
**HEAD at pass:** `4567b1b` (D-305A)

---

## Context

The D-297→D-303 arc made Home self-demonstrating for a cold visitor (Step 5, static demo card, vocabulary glossary), and D-304→D-305 established a Review-intake process for real submissions. Rather than wait for more testers, Mike wants to keep building — the next area named is the Belief Engine and its connected belief-flow experience (Belief Engine → Drift → My HumanX → promote-to-Claim/Truth). This pass audits that whole chain before recommending anything to build.

---

## 1. Current-State Summary

The Belief Engine (`public/apps/humanx-belief-engine/index.html`, 2,764 lines + `humanx-bridge.js`, 191 lines) is a **standalone, self-contained HTML page** — not part of the main SPA's render tree. It is reached by a **hard full-page redirect** (`location.href='/apps/humanx-belief-engine/'`), not client-side routing. It presents a 77-statement questionnaire across 19 scored dimensions, produces a "Pressure Map" (radar chart), a "Profile Snapshot" (dominant pattern, closest alignments, belief-origin mix), a contradiction scan, and a "What to Test Next" section. A user can optionally send a derived snapshot back to the main HumanX app via `humanx-bridge.js`, where it appears privately in **Drift** and can later be promoted to a Truth or Claim (which enters Review).

The tool is already unusually well-guarded on safety framing (see section 5) — this pass's findings are mostly about **the on-ramp (no example before a 10–12 minute commitment) and the off-ramp (no way back to HumanX except finishing or the browser Back button)**, not about the assessment content itself.

---

## 2. Entry Points Found

| Entry point | Location | Mechanism |
|---|---|---|
| Top nav tab | `public/index.html` — `#tab-belief` | `onclick="location.href='/apps/humanx-belief-engine/'"` — hard redirect |
| Home Actions card | `renderHome()` "Belief Engine" card | `data-action="navBeliefEngine"` → `renderBelief()` → same hard redirect |
| Drift tab, empty state (no full profile) | `renderDrift()` | "Open Belief Engine" button, same redirect |
| Drift tab, empty state (no snapshots at all) | `renderDrift()` | Second "Open Belief Engine" button, same redirect |
| My HumanX → Belief Mirror panel, empty state | `meMirrorHtml()` | "Open Belief Engine →" button, same redirect |

**Finding:** all five entry points converge on the identical hard redirect. There is no SPA-level state preserved across the jump (expected and accepted — this is documented as a standing architectural fact in `docs/README.md`), but it does mean every entry point carries the same one-way-door property described in section 4.

---

## 3. What First-Time Users See

The intro screen (`#screen-intro`) is genuinely strong copy:

> "Most people do not actually know what they believe. They know what they were told... This is not a test you pass or fail... The result is a pressure map, not a label."

It states stats (77 statements / 19 dimensions / 15 archetypes / 36 contradictions checked), a single clear CTA ("Begin Mapping"), and an explicit privacy/safety note directly under the button:

> "No correct answers. No religion assigned. No diagnosis. No score of your worth. ~10–12 minutes. You can use it privately, or later choose to send a snapshot to HumanX — it will appear in your Drift, not published. Stored in this browser only. Nothing leaves your device unless you export it."

**Assessment:**
- **The first action is obvious** — one button, "Begin Mapping."
- **It explains what Belief Engine is** — reasonably well, though it explains it in its *own* vocabulary (pressure map, dimensions, archetypes) rather than connecting to HumanX's Claim/Truth/Review vocabulary until the very end of the flow.
- **It does not connect back to HumanX Claim/Truth/Review language up front.** The only place Claim/Truth/Review terms appear is in the "What to Test Next" section at the *bottom of the results screen* — reachable only after completing the full questionnaire.

---

## 4. Belief Engine Purpose Assessment

**Verdict: it is a belief *profile and pressure/drift tool*, not a claim generator, and it is honest about that.** Specifically:

- Not a belief checker (it explicitly refuses to say beliefs are true/false)
- **Is** a belief profile tool (Profile Snapshot, closest alignments, dominant pattern)
- **Is** a pressure/drift tool (Pressure Map, Contradiction Scan, and — once sent to HumanX — Drift tracking over time)
- **Is not** a claim generator on its own — it produces a personal profile; turning any part of that into a public Claim/Truth is a separate, later, explicit action taken back in the main app (`promoteBelief()`)
- **Is not** a separate, unrelated app in *intent* — it is clearly HumanX-branded (logo, matching dark palette, "Send to HumanX" bridge) — but it **behaves** like a separate app technically (own HTML file, own CSS, own JS, no SPA nav chrome)

This is a coherent, single-purpose tool. The confusion risk is not "what is this for" — the copy answers that — it's "how do I get back, and what does 10–12 minutes actually buy me before I start."

---

## 5. Boundary / Safety Assessment

This is the strongest part of the current implementation. Checked directly against the file:

| Boundary | Status |
|---|---|
| Avoids diagnosing users | **Confirmed** — "No diagnosis" (intro), "This is a map of pressure patterns from your answers — not a diagnosis. Use it as a mirror, not a verdict." (results hero) |
| Avoids saying beliefs are true/false without evidence | **Confirmed** — "No correct answers"; results explicitly say patterns are "not a score of intelligence, morality, or truth" |
| Preserves Review/publication boundary | **Confirmed** — `humanx-bridge.js`'s own success alert says: *"It is not published; turning it into a Truth or Claim enters Review before becoming visible to others. Nothing has been proven or verified."* |
| Avoids private/public confusion | **Confirmed, and unusually careful** — `humanx-bridge.js` explicitly **excludes** raw free-text timeline answers from the payload sent to HumanX ("contain sensitive personal content typed by the user and must not leave the browser without explicit opt-in"); only derived, non-free-text fields are sent |
| Does not label people as irrational/broken/extremist/unsafe | **Confirmed** — scanned for `irrational`, `broken`, `extremist`, `delusion`, `pathological`, `toxic`, `disorder` — none appear. `cult`/`dangerous`/`unstable` appear only in descriptive, factual belief-*category* text (e.g. a real-world court classification of a named group) or in structural-pattern language about a belief position, never applied to the user themselves |
| No auto-publish | **Confirmed** — `sendBeliefEngineToHumanX()` posts only to `/api/belief-snapshots`; nothing in the Belief Engine or bridge calls a Truth/Claim-creation or Review-decision route |

No hard boundary from this task's list is currently violated. This pass found **zero safety regressions to fix** — the existing implementation already meets or exceeds every constraint in this task's "hard boundaries" list.

---

## 6. Secondary Findings (Not the Main Recommendation)

Three smaller things surfaced during the audit, listed for the record but explicitly **not** bundled into the D-306B recommendation:

1. **Home's Belief Engine Actions-card copy slightly compresses the real flow.** It reads *"sending anything to HumanX is optional and enters Review before becoming public"* — in reality, sending to HumanX first lands privately in Drift; Review only happens if the user takes a *further*, separate promote-to-Truth/Claim action. The end state described (nothing public without Review) is accurate; the path description skips a step. Low priority — not misleading about safety, just imprecise about mechanism.
2. **Dead/stub code suggests an abandoned "quick record" path.** `renderDrift()`'s copy describes "Quick records" as "lightweight snapshots from a single belief map," but the only functions that could plausibly build one — `buildBeliefSnapshot()`, `classifyBelief()`, `beliefPreview()` in `public/app-v10.js` — are stubs (`return{}`, `return'open belief'`, empty body) and are never called anywhere else in the file. Right now the *only* live way to create any belief snapshot is the full 77-statement standalone Belief Engine. This is a copy-vs-reality gap worth a dedicated look, not a same-pass fix — deciding whether to build the quick path or remove the "quick record" language is its own decision, not a docs-only one.
3. **No persistent way back to HumanX from inside the Belief Engine until the very end.** The only links back to the main app are three `target="_blank"` links ("Browse Claims" / "Submit a Claim" / "Browse Truths") at the *bottom of the results screen* — reachable only after finishing the full questionnaire. The intro screen has a plain, non-clickable `<div class="intro-logo">HumanX</div>` — not a link. A visitor who starts the intro, or gets partway into the questionnaire, and wants to leave has no in-app path back except the browser Back button or closing the tab.

---

## 7. Product-Pass Questions

**Q1. What is currently strongest about Belief Engine?**
The safety/framing language — "not a diagnosis," "mirror not a verdict," explicit free-text exclusion from the HumanX payload, and the bridge's own "nothing has been proven" alert. This is more careful than most of the rest of the app's copy had to be before D-297/D-300/D-302 polish.

**Q2. What is currently most confusing?**
Not the content — the *shape* of the commitment. A visitor is asked to invest 10–12 minutes across 77 statements before seeing anything resembling the actual output, and once started, there is no easy way back to HumanX until the end.

**Q3. What would a cold visitor think it does?**
Correctly: a personality/belief-pattern assessment, in the spirit of a serious (non-BuzzFeed) personality test — the copy successfully avoids reading as either a religious test or a diagnostic tool.

**Q4. Does it need a static example like Home got?**
**Yes — this is the closest direct parallel to the D-300 problem** (Home showed categories with no worked example; Belief Engine sells a method — 77 statements/19 dimensions — with no worked example of the output). A visitor cannot see what a Pressure Map or Profile Snapshot actually looks like before committing 10–12 minutes.

**Q5. Does it need a collapsed "Belief Engine words" glossary?**
Not yet. Unlike Home before D-302, Belief Engine's results screen already defines its own terms inline as they appear ("not a diagnosis," "not a score of... truth," etc.) rather than assuming prior knowledge. Lower priority than the missing example.

**Q6. Does it need better bridge copy to HumanX?**
Already reasonably good at the very end (results screen "What to Test Next" + bridge alert). The one real gap is the compressed Home Actions-card wording (finding 1, section 6) — small and separate from the main recommendation.

**Q7. Does it need a "turn this belief into a claim" action?**
Not yet, as a same-pass build. The path already exists (Send to HumanX → Drift → promote-to-Claim), just with more steps than a hypothetical direct button. Shortening it is a real idea but carries real risk (see Q8).

**Q8. Would that action be frontend-only or backend-risky?**
**Backend-risky enough to deserve its own audit before any build.** The standalone Belief Engine page has no access to the main SPA's session/auth state beyond what `humanx-bridge.js`'s shared-localStorage trick provides; wiring a direct "create Claim" action from inside the standalone page means either calling `/api/belief-promote`-equivalent logic straight from a page with no SPA context, or building a cross-page handoff. Either way this is exactly the kind of "audit first" situation this project has handled correctly before (RunPack F-4/F-5, saved-analysis-to-Truth D-287A). Not something to scope into a "smallest" docs-only-adjacent D-306B.

**Q9. Does any useful improvement require schema/API/storage?**
No — not for the recommended D-306B candidate. It requires no new route, no new column, no new stored field.

**Q10. What is the smallest safe D-306B candidate?**
**Add one small, clearly-labeled static example ("Example — not your result") to the Belief Engine intro screen**, showing a miniature illustrative Profile Snapshot (one dominant-pattern line, one meter-style stat, one closest-alignment line) — the same pattern the D-300B Home demo card already proved works. This is pure static markup added to `#screen-intro` in `public/apps/humanx-belief-engine/index.html`; it does not touch the questionnaire, scoring, results rendering, or `humanx-bridge.js` at all.

**Q11. Classify D-306B**
**Frontend-only.** File touched: `public/apps/humanx-belief-engine/index.html` only (a different file from the main app's `public/app-v10.js`/`public/styles.css`, per the standing "standalone app" warning in `docs/README.md`). No backend/API/schema/storage changes. Must preserve every marker currently locked by `scripts/belief-engine-static-check.mjs` (24 checks: "Belief Engine" identity marker, questionnaire category markers, "Your Belief Architecture"/"Profile Snapshot" result markers, `humanx-bridge.js` script reference, and the "no API key" negative checks).

**Q12. If Belief Engine is too broad/unclear, recommend one narrowing move only.**
Belief Engine's *concept* is not too broad — it is a single, coherent, well-guarded self-reflection tool. The one narrowing move worth stating explicitly: **treat Drift → explicit promote-to-Truth/Claim as the only sanctioned bridge from private belief data to public HumanX content, and do not add a second, more direct bridge without its own dedicated audit** (this closes off the Q7/Q8 risk from being casually added later under a different task's scope).

---

## 8. Candidate Options Considered

| Option | Verdict |
|---|---|
| Static example preview on intro screen | **Recommended** — directly mirrors the proven D-300B pattern; frontend-only; touches only the standalone Belief Engine file |
| Home Belief Engine card copy precision fix (Drift-step) | Real but small; separate, optional follow-up — not bundled |
| Persistent back-to-HumanX link on every Belief Engine screen | Real gap (section 6, finding 3); worth a future small pass, but is a distinct fix (navigation, not on-ramp) from the recommended example — not bundled into D-306B to keep it surgical |
| Collapsed "Belief Engine words" glossary | Not needed yet — Belief Engine already explains its own terms inline |
| Direct "turn this belief into a claim" bridge from inside Belief Engine | Rejected for this pass — backend/cross-app-risk requires its own audit first |
| Fix/remove the dead "quick record" path | Rejected for this pass — requires a build-or-remove decision, not docs-only |
| No change yet | Rejected — a real, low-risk, high-leverage gap (missing example) exists and has an already-proven fix pattern available |

---

## 9. Explicit "Do Not Do Next" List

- **Do not build a direct Belief Engine → Claim/Truth bridge** without a dedicated cross-app audit (session/auth handling across the standalone page boundary, and a Review-safety review of what such a bridge could post).
- **Do not fix the "quick record" dead-stub gap** in this pass — decide separately whether to build it or remove the copy that implies it exists.
- **Do not add a "Belief Engine words" glossary yet** — the existing inline explanations are already doing that job; revisit only if real confusion is reported.
- **Do not touch scoring, dimension weights, archetype matching, or contradiction logic** in any D-306B implementation — none of that is in scope or in question here.
- **Do not remove or alter any of the 24 markers locked by `scripts/belief-engine-static-check.mjs`.**
- **Do not add any new field to the `/api/belief-snapshots` payload** or otherwise touch `humanx-bridge.js`'s data-minimization logic (the deliberate exclusion of raw free-text) under a "make it more example-y" task.

---

## Summary

| Question | Answer |
|---|---|
| Strongest current asset | Safety/framing language ("not a diagnosis," "mirror not a verdict," data-minimized bridge) |
| Biggest gap | No worked-example output before a 10–12 minute commitment (same shape as the pre-D-300 Home gap) |
| Purpose | Belief profile + pressure/drift tool; explicitly not a claim generator, not a diagnosis |
| Safety boundaries | All confirmed intact — zero violations found |
| Smallest useful D-306B candidate | Static "Example — not your result" preview on the Belief Engine intro screen |
| D-306B classification | Frontend-only (`public/apps/humanx-belief-engine/index.html` only) |
| Backend/schema/API needed | No |
| Direct claim-bridge action | Explicitly deferred — needs its own audit first |
| Narrowing move | Drift → explicit promote is the only sanctioned public bridge; do not add a second one casually |
