# D-184A — First Real User Flow QA Pass

**Date:** 2026-06-28  
**Method:** Source-code walkthrough of all major render functions in `public/app-v10.js`  
**Starting state:** HEAD `adac53e` · Baseline 1525/24/57  
**Scope:** Anonymous first-time public user flow — no admin token, no prior activity

---

## Flow tested

1. Land on Home
2. Understand Start Here
3. Browse Claims (Arena)
4. Open a claim / Study view
5. Understand Evidence / Pressure / Tests / Analysis panels
6. Vote (Believe / Reject / Unsure)
7. Add evidence / pressure / test
8. Submit a new claim (Builder, all 3 steps)
9. Generate / export RunPack
10. Visit My HumanX / Profile
11. Mobile / narrow layout (source-level review)

---

## What works well

- **Home pipeline banner** (Beliefs → Truths → Claims → Evidence → RunPack) gives a fast conceptual map
- **Start Here strip** added in D-183A gives clear numbered entry points with action buttons
- **Claim cards** include vote counts, Evidence/Test/Survivability meters, and an "Investigate →" button that directly enters Study mode
- **Study header** is well-structured: claim title, review status badge, score meters, meter key, verdict qualifier, vote row
- **"How this claim is being tested" argument-flow panel** (Step 1–4 format) is a strong first-read orientation for new users on an empty claim
- **Builder 3-step flow** is solid: raw thought → testable draft → final submit. Live quality flags in Step 1 are genuinely useful
- **Builder submit success** shows the claim text, a toast, and three navigation options (Study / Submit another / Browse Claims)
- **Evidence / Pressure / Tests section descriptions** are now clearer after D-183C
- **RunPack intro** now explains Copy (prompt) vs Download (JSON) after D-183D
- **My HumanX private-default intro** added in D-183F clearly sets expectations
- **Truths page** Truth vs Claim clarifier is in place after D-183E
- **Empty states** across all panels are now informative and actionable

---

## Friction points

### High priority — visible dead ends or missing feedback

**F-1: "← Back" is generic when coming from the Claims list**

In `renderStudy()` (line 358), the back button resolves to `'← Back'` when `lastModeBeforeStudy === 'arena'` — the else-branch label. Every other origin (Review, Vault, Truths, My HumanX) has a specific label. A user navigating from the Claims tab sees only `← Back`, with no indication of where it goes.

*Fix:* add `lastModeBeforeStudy==='arena'?'← Back to Claims':` before the final `'← Back'` fallback. One token change.

---

**F-2: Start Here Step 2 button goes to the same page as Step 1**

Step 1 (Explore claims) and Step 2 (Open & investigate) both render `data-action="setMode" data-value="arena"`. Step 2's copy says "Open any claim to enter Study mode" — implying the button will open a specific claim — but it just goes to the Browse page. A user who clicks Step 2 after Step 1 ends up in the same place and wonders what changed.

*Fix:* Change Step 2 button to link directly to the first available claim, or rewrite the step copy to make clear it is instructional ("go to Claims, then click Investigate on any card") rather than a direct action.

---

**F-3: Profile Settings save toast says "Public page comes next."**

`saveProfileSettingsUI()` (line 241) fires `toast('Profile link foundation saved. Public page comes next.')`. The "comes next" language is leftover from when the public profile feature was in development. Public profiles are live at `/u/:slug`. A user who saves profile settings and reads "comes next" will think the feature is unfinished.

*Fix:* Change toast message to `'Profile settings saved.'` or `'Profile link saved — share it with the Copy button.'`.

---

**F-4: Two toasts fire after voting**

`voteClaim()` (line 379) calls `toast('Vote recorded')` then `selectClaim(selected.id)`. `selectClaim` (line 355) unconditionally fires `toast('Study loaded')`. Result: two toasts appear back-to-back on every vote. The second one is noise.

*Fix:* Remove or conditionalize `toast('Study loaded')` in `selectClaim`. It could fire only when invoked directly from the Claims list, not from within Study mode.

---

**F-5: After generating RunPack from Study view, no direct navigation CTA**

`generateRunPack()` (line 389) updates `#aip-status` in the side panel with "RunPack ready — copy it here or open the RunPack tab for full JSON and download." but provides no button. A user who wants to download the packet must manually navigate to the RunPack tab. The status message is easy to miss on mobile where the side panel may be collapsed.

*Fix:* After generating, add a small "Open RunPack tab →" button inside `#aip-status`, or use `patchRunPackPanel()` to inject one. Or: show a compact download button inline when `lastPacket` is ready.

---

### Medium priority — unclear actions or confused navigation

**F-6: Evidence and Pressure empty states reference "the side panel" — not visible on mobile**

`sectionEvidence()` (line 373) and `sectionPressure()` (line 375) both say "Use the side panel to add..." The side panel (`#side-tools`) is a separate DOM element. On mobile or narrow viewports, there is no visible side panel affordance in the main content area. A first-time mobile user reading "use the side panel" has no indication of how to reach it.

*Fix:* Either add a mobile-visible "Add Evidence" trigger button inside the panel itself (simple), or explain "Use the right-hand panel (tap the ☰ or scroll right on mobile)". The Tests panel already has an inline form — Evidence and Pressure could do the same for the title/stub at minimum.

---

**F-7: Arena page has no visible filter/sort control in the main content area**

`renderArena()` (line 149) renders a `<details class="arena-stats-details">` for network stats but no filter bar in the main panel. The filter (`#filter`) is controlled from `helperText()` (the casefile/sidebar). On a narrow viewport where the sidebar is hidden or below the fold, there is no way for a user to know a verdict filter exists. The empty state shows a "Show all" button (good) but only appears when no claims match — not as an upfront affordance.

*Fix:* Add a compact filter row in `renderArena()` itself above the claim grid — at minimum a "Filter: All / Public / Rejected" inline control.

---

**F-8: Claim card is not fully clickable — only the "Investigate →" button works**

In `card()` (line 150), the claim card is an `<article>` element. Only the `<button class="primary claim-study-btn" onclick="selectClaim(...)">Investigate →</button>` opens the study view. Clicking the claim title, meters, or vote counts does nothing. Users expect a card to be clickable in its entirety.

*Fix:* Wrap the card in a `<button>` or add an invisible full-card click target. Or make the `<h3 class="claim-title">` a clickable button that calls `selectClaim`. (Note: this requires care since the study button is still `onclick=` Cat F — coordinate with any future D-181 migration.)

---

**F-9: Voting reloads the entire claim (including API call) — slow feedback loop**

`voteClaim()` calls `selectClaim(selected.id)` which refetches the full claim, evidence, pressure, tests, and analyses from the API. A user clicking vote feels a visible delay and two toasts (see F-4). This is functional but feels sluggish. Votes could be optimistically applied to the visible counts without a full reload.

*Longer fix — no quick patch.*

---

**F-10: "Status line" on Home can show "offline" for new users**

`renderHome()` (line 136) computes `live?'D1 live':(graphStatus!==null?'demo':'offline')`. If `graphStatus` is null when the page first loads (before `loadGraphStatus()` resolves), the status line shows "offline". A first-time user who sees this immediately thinks something is broken.

*Fix:* Default the status label to `'connecting…'` or omit the status word entirely until resolved.

---

### Lower priority — wording and minor UX

**F-11: "Investigation Board" heading has no description**

`renderStudy()` (line 358) renders `<div class="inv-board-head"><span>Investigation Board</span></div>` with no subtitle. A first-time user doesn't know whether this is different from the earlier "How this claim is being tested" section or whether they should interact with it.

*Fix:* Add a one-line sub: `Manage and review the evidence, pressure, tests, and analysis attached to this claim.`

---

**F-12: Builder Step 2 "Save as Truth for Review" button visible even when not truth-routed**

In `renderBuilderStep2()` (line 157), the "Save as Truth for Review" button in the `routeNote` block only appears for `route==='truth'` claims. Good. But the `renderBuilderStep3()` always shows the Truth save option when `isTruth` is true, without making it clear to the user why they're seeing two submit paths. A user on the truth route may be confused by seeing both "Save as Truth" and "Submit Claim" as equal-weight primary actions.

*Fix:* Make the claim path clearly secondary (e.g., `data-action` button, not `class="primary"`) when the system has routed to truth.

---

**F-13: Analysis panel "Paste RunPack output JSON" instruction is hard to follow cold**

`sectionAnalyses()` (line 377) says: "Click Build RunPack in the claim header → paste into any AI → paste the JSON result here". This is correct but requires the user to know (1) what "Build RunPack" produces, (2) what to do with it in their AI, and (3) that the AI will produce valid JSON to paste back. For a first-time user this is a multi-step black box.

*Fix:* Link to a short explainer or add a one-sentence example: "e.g. ask your AI: 'Analyse this claim packet and return JSON with verdict, evidence_score, and plain_language_summary.'"

---

## Mobile / layout notes

- **Start Here strip** gracefully collapses (2-col at 700px, 1-col at 400px) — good
- **Side panel in Study mode** has no clear mobile access point. On narrow screens it disappears or sits below the fold. Evidence / Pressure add forms are blocked for mobile users until this is addressed (see F-6)
- **Claims grid** is `<div class="grid">` — presumably using CSS grid. Claim cards with multiple badges and meters can be very tall on mobile. No card density control for mobile view in the arena (unlike the Home actions grid which has `.cc-card-when` hidden on mobile)
- **Truth cards** are similarly dense — type badge + not-verified badge + personal-belief badge + artifact badge + borderline badge + confidence badge + claim-state badge can stack awkwardly on mobile
- **Nav tabs** scroll behavior was fixed in D-112B — should be fine
- **Actions within panels** (vote row, Build RunPack button) are `flex` row — may wrap on very narrow screens but should be usable

---

## Inline handlers remaining (code quality, not user-visible)

Two `onclick=` inline handlers in dynamically-generated success panels — these are in Cat F scope, excluded from D-181 migration, but are dormant until a submit completes:

- `submitBuilderClaim()` success panel: `onclick="selectClaim('${esc(selected.id)}')"` (line 169)
- `saveClaim()` success/similar panels: `onclick="selectClaim('${esc(selected.id)}')"` (line 380)

Not user-facing friction on first use, but worth migrating in a future D-181J pass.

---

## Quick-fix candidates for D-184B

In priority order:

| # | Location | Change | Effort |
|---|----------|--------|--------|
| 1 | `renderStudy()` line 358 | Add `lastModeBeforeStudy==='arena'?'← Back to Claims':` | 1 token |
| 2 | `saveProfileSettingsUI()` line 241 | Change toast from "Public page comes next." to "Profile settings saved." | 1 token |
| 3 | `selectClaim()` line 355 | Remove or conditionalize `toast('Study loaded')` | 1 line |
| 4 | `renderStudy()` line 358 | Add "Investigation Board" subtitle | 1 line |
| 5 | `renderHome()` line 136 | Change `'offline'` default to `'connecting…'` | 1 token |

All five are safe, isolated copy/string changes. Could be bundled as D-184B in one commit.

---

## Longer product ideas (D-185+)

- **Mobile side panel drawer**: The Evidence / Pressure add-form needs to be accessible on mobile without needing the sidebar. A `<details>` expand inside the Study panel, or a modal triggered by an "Add Evidence" button in the main content, would close this gap
- **Fully clickable claim cards**: Make the entire claim card (`<article>`) a clickable surface that opens Study mode — improves mobile tap targets significantly
- **Filter bar in Arena**: A compact inline verdict-filter above the claims grid so users on mobile can see and change filtering without reaching the sidebar
- **Reduce vote feedback latency**: Optimistic vote count update without full `selectClaim` reload
- **RunPack → Analysis closed loop**: After generating a RunPack in Study view, inject a "Download / Copy" button directly into the study view (not only in the side panel status)
- **Onboarding overlay**: Step-by-step interactive first-visit guide (noted in D-183G closeout)
- **Claim example prefill**: Example claim in Builder Step 1 to show new users what a well-scoped, falsifiable claim looks like

---

## Summary

The app is navigable for a first-time user after the D-183 clarity series. The biggest remaining gaps are:

1. **Back button label** from Study to Claims is generic (F-1)
2. **Start Here Step 2** is a no-op duplicate of Step 1 (F-2)
3. **Profile toast** is confusing legacy copy (F-3)
4. **Mobile side panel** blocks Evidence/Pressure add flows on narrow screens (F-6)
5. **Two-toast vote sequence** is noisy (F-4)

Items 1–4 of the D-184B quick-fix table address the top four with minimal risk.
