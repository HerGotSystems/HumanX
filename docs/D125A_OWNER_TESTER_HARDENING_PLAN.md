# D-125A — Owner-as-Tester Product Hardening Plan

**Date:** 2026-06-14  
**Branch:** docs/d125a-owner-tester-hardening-plan  
**Mode:** Docs/planning only — no code changes, no deploy, no Wrangler, no D1, no admin token.  
**Canonical URL:** https://humanx.rinkimirikata.com

---

## 1. New Posture: Owner-Only Testing Loop

External testers are not required yet. The owner runs structured self-testing across six cycles, simulating different user types against the live site. Each cycle produces a verdict and a backlog item list. Blockers get a dedicated fix task (D-125B, D-125C, …). Friction and copy issues are batched into a polish pass when enough accumulate.

**This is not a public launch.** The canonical URL is not being shared externally. The product is a guarded public beta: technically live, not actively promoted.

**Posture rules:**
- Owner tests using personal devices against `https://humanx.rinkimirikata.com` only.
- Worker origin (`https://humanx.veltrusky-michal.workers.dev`) is a technical fallback — not used in any test scenario.
- No admin token is recorded in docs, logs, or commits.
- Blocker findings → new task immediately. Friction/copy → add to backlog section 5 of this doc for batching.
- No code or backend changes without a task branch and checks.

---

## 2. Testing Personas

The owner simulates these six user types across test cycles.

### P1 — Fresh mobile anonymous user
**Device:** phone, normal browser (not incognito)  
**State:** no prior localStorage, no prior claims, no HumanX session  
**Goal:** represents a first-time mobile visitor who found the site cold  
**Key risks:** onboarding clarity, mobile layout, privacy confusion at first contact

### P2 — Returning desktop user
**Device:** desktop, normal browser  
**State:** prior localStorage (existing Belief Engine result), prior submitted claim in Review or public  
**Goal:** represents someone returning after a first session  
**Key risks:** saved-result surfacing, Drift showing prior profiles, Review queue surfacing own submissions

### P3 — Incognito / no-token user
**Device:** desktop or mobile, private/incognito window  
**State:** no localStorage, no admin token  
**Goal:** represents any user who opens the site without prior context — also the tester-side check for the Review gate  
**Key risks:** Review gate (must show prompt only, no queue), no leaked state from prior sessions

### P4 — Hostile / spammy submitter
**Device:** desktop, normal browser  
**State:** any  
**Goal:** attempts to submit low-quality, abusive, or boundary-testing content through normal submission flows  
**Key risks:** Review queue accepting junk without friction, rate-limit behaviour, normalization collisions  
**Note:** Submit only benign test content. Do not submit genuinely offensive content. Observe the submission and Review experience, not the content itself.

### P5 — Confused normal user
**Device:** desktop or mobile  
**State:** any  
**Goal:** simulates a user who misreads labels, clicks the wrong button, or interprets copy incorrectly  
**Key risks:** copy that implies diagnosis/proof/verdict, buttons that do unexpected things (Clear, Start Over, Send to HumanX), modal or nav confusion  
**Method:** read each screen as if seeing it for the first time. Note any moment of hesitation.

### P6 — Admin reviewer
**Device:** desktop, normal browser with admin token stored  
**State:** live Review queue with pending submissions  
**Goal:** represents the owner's moderation workflow  
**Key risks:** Review ergonomics, approve/reject clarity, ability to inspect submission before decision  
**Note:** Admin token is used only in the live session. Not recorded anywhere.

---

## 3–4. Test Cycles

Each cycle defines what to do, what to observe, and how to grade each item.

**Grading:**
- **PASS** — works as intended, no hesitation
- **FRICTION** — works but required effort, re-reading, or a second attempt
- **BLOCKER** — could not complete the intended action, or the result was incorrect/misleading

---

### Cycle 1 — Onboarding and Home Clarity

**Persona:** P1 (fresh mobile) and P5 (confused normal user)  
**Start:** open `https://humanx.rinkimirikata.com` cold

| Step | What to do | What to observe |
|---|---|---|
| 1a | Read the Home page without clicking anything | Is it clear what HumanX does from the cards alone? Which card is most confusing? |
| 1b | Read the Belief Engine card copy | Does it imply diagnosis, score, or judgement? Does "map" land correctly? |
| 1c | Read the Claims card | Is "public means visible, not proven" or equivalent present and legible? |
| 1d | Read the Truths card | Is "repeated assertion, not verified fact" clear? |
| 1e | Read the Submit card | Is it clear submissions go to Review, not immediately public? |
| 1f | Click into each tab with no goal | Do the tabs match what the Home cards promised? |
| 1g | Note any card or label where you hesitated | Record as FRICTION with exact wording |

**PASS:** All cards communicate their purpose without implying proof, diagnosis, or immediate publication.  
**FRICTION:** One card or label caused hesitation — wording is ambiguous but not actively misleading.  
**BLOCKER:** Any card implies HumanX decides what is true, diagnoses the user, or publishes content without review.

---

### Cycle 2 — Belief Engine Full Run

**Persona:** P1 (fresh mobile, first run) then P2 (returning desktop, second run)  
**Start:** Belief Engine intro screen

| Step | What to do | What to observe |
|---|---|---|
| 2a | Read the intro screen without clicking | Is it clear this is private and in-browser? Is "not a test you pass or fail" prominent? |
| 2b | Click Begin Mapping | Does the identity screen appear? Does Skip work? |
| 2c | Complete all 11 question categories | Does progress advance correctly? Do any categories feel stuck or broken? |
| 2d | Reach the Timeline screen | Is the Skip option visible? Do free-text fields accept input? |
| 2e | Complete Timeline with text, then proceed | Does the result screen load? |
| 2f | Read the result screen top to bottom | Does any label feel like a verdict, score, or diagnosis? |
| 2g | Check the Belief Timeline panel | Is the "stored in this browser only" note visible directly below the heading? |
| 2h | Check the Send to HumanX pre-click note | Is the "not sent: private timeline text" note visible before any click? |
| 2i | *(Optional)* Click Send to HumanX | Does the button show "Sending…" then "Saved to HumanX ✓"? Does the post-send alert appear? |
| 2j | Click Start Over | Does the quiz reset? Does reloading confirm no saved result? |
| 2k | (P2) Reload after completing a run | Does "View previous results" appear with the privacy note? |
| 2l | (P2) Click View previous results | Does the correct result load? |
| 2m | (P2) Click Clear from intro | Does the button disappear? Does reloading confirm it stays gone? |

**PASS:** Full flow completes without confusion; no verdict/diagnosis language on result; all privacy notes visible and believable.  
**FRICTION:** One panel or label caused hesitation about what was saved or sent; result language felt close to a verdict but recoverable with re-reading.  
**BLOCKER:** Any of the following: result described as score/diagnosis/proof; "Send to HumanX" wording implied publication; Clear or Start Over behaved unexpectedly (data reappeared); timeline text appeared to be sent.

---

### Cycle 3 — Drift and Saved Results

**Persona:** P2 (returning desktop, has prior Belief Engine profile in Drift)  
**Start:** Main app, Drift tab

| Step | What to do | What to observe |
|---|---|---|
| 3a | Open Drift tab | Does a full Belief Engine profile appear under "Full Belief Engine Profiles"? |
| 3b | Check profile classification | Is it listed as a full profile, not a Quick Belief Record? |
| 3c | If two or more profiles exist, check comparison | Is the delta (stability, openness, pressure, contradictions) visible? |
| 3d | Read the comparison framing | Does it imply the newer profile is better, worse, or more correct than the older one? |
| 3e | Check Drift for Quick Belief Records (if any) | Are they correctly separated from full profiles? |
| 3f | Reload and check Drift again | Does the profile list remain stable? No duplication or ghost records? |

**PASS:** Drift shows profiles correctly classified; comparison shows delta without implying verdict; stable on reload.  
**FRICTION:** Classification labels were ambiguous (e.g., "profile" without qualifying "full" or "quick"); comparison framing implied progress or regression.  
**BLOCKER:** Full profile appears under Quick Belief Records or vice versa; comparison crashes or shows empty state erroneously; Drift shows another user's data.

---

### Cycle 4 — Claim Submission and Review

**Persona:** P4 (hostile/spammy submitter) for submission; P6 (admin reviewer) for Review  
**Start:** Submit tab

| Step | What to do | What to observe |
|---|---|---|
| 4a | Submit a well-formed testable claim | Does it reach Review without error? Does the confirmation say "pending review"? |
| 4b | Submit a deliberately vague or short claim ("things are bad") | What feedback does the UI give? Is there any friction before submission? |
| 4c | Submit a claim with unusual characters or very long text | Does it handle gracefully without error or silent truncation? |
| 4d | Attempt rapid repeated submissions | Is there any rate-limit feedback, or does the system accept them silently? |
| 4e | Switch to P6 — open Review with admin token | Does the pending claim appear? |
| 4f | Inspect the claim in Review | Is the full claim text visible before approving/rejecting? |
| 4g | Approve one; reject one | Do the actions reflect immediately in Review queue state? |
| 4h | Navigate to Claims tab | Does the approved claim appear? Does the rejected claim not appear? |

**PASS:** Submission confirms review-first clearly; Review queue shows claim correctly; approve/reject works; approved claim is public, rejected is not.  
**FRICTION:** Vague submission accepted with no friction; rate-limit feedback absent; Review inspect requires extra steps.  
**BLOCKER:** Claim appears publicly without approval; rejection fails silently; Review queue visible without admin token.

---

### Cycle 5 — Public Content Browsing

**Persona:** P3 (incognito, no prior state) and P5 (confused normal user)  
**Start:** Home page in incognito window

| Step | What to do | What to observe |
|---|---|---|
| 5a | Open Claims tab | Is at least one claim visible? |
| 5b | Click into a claim (Study view) | Do evidence, pressure points, and votes all load? |
| 5c | Read the "Public means…" framing | Is it present and accurate? |
| 5d | Open Truths tab | Is at least one Truth visible? |
| 5e | Read a Truth card | Does it clearly say "repeated assertion, not verified fact" or equivalent? |
| 5f | Open Review tab (no token) | Does it show only the gate prompt — no queue contents? |
| 5g | Try navigating to `/api/graph-status` | Does it return a graph object with claim, truth, and evidence counts? |
| 5h | Try navigating to `/api/debug` | Does it return a 401/403 or an admin-gated response — no raw debug output? |

**PASS:** Public content visible; no raw admin/debug data exposed; Review gate holds without token; health endpoint confirms D1 live.  
**FRICTION:** "Public means visible, not proven" framing is present but small or easy to miss.  
**BLOCKER:** `/api/debug` returns unredacted output without a token; Review queue visible without token; a Claim or Truth appears with no framing about what "public" means.

---

### Cycle 6 — Mobile Layout Stress

**Persona:** P1 (fresh mobile) at two widths  
**Device:** phone or DevTools responsive mode at 390px (iPhone 14) and 768px (tablet)  
**Start:** `https://humanx.rinkimirikata.com`

| Step | What to do | What to observe |
|---|---|---|
| 6a | Home page at 390px | Is all card text readable? No horizontal overflow? |
| 6b | Belief Engine intro at 390px | Is "Begin Mapping" fully visible and tappable? |
| 6c | Quiz screen at 390px | Are Likert buttons large enough to tap without mis-firing? No overflow? |
| 6d | Result screen at 390px | Does it scroll vertically without horizontal overflow? Is the Pressure Map (radar chart) legible? |
| 6e | Accordion sections at 390px | Do they open and close without layout breaking? |
| 6f | Export & Share buttons at 390px | Are Start Over, Download PNG, Copy Summary, Send to HumanX all tappable? |
| 6g | Result screen at 768px | Does the 2-column overview grid collapse to single column? No overflow? |
| 6h | Accordion sections at 768px | Comfortable width, content readable? |

**PASS:** No horizontal overflow at either width; all interactive elements tappable; Pressure Map legible; layout degrades gracefully.  
**FRICTION:** One element is technically tappable but small; radar chart labels overlap at 390px but chart itself renders.  
**BLOCKER:** Horizontal scrolling required at 390px; any button not tappable; result screen unreadable; Pressure Map blank or cut off.

---

## 5. Product Hardening Backlog Categories

Use these categories when logging findings from the cycles above. Accumulate friction and copy issues here before batching into a polish task.

### 5.1 Clarity / Copy
Issues with wording that caused hesitation, implied the wrong meaning, or used jargon without explanation. Includes Home card copy, Belief Engine result labels, Submit/Review messaging, and Drift terminology.

*Log format:*  
`[COPY] Screen: <name> · Label: "<exact text>" · Issue: <what it implied> · Suggestion: <alternative>`

### 5.2 Mobile Layout
Layout failures, overflow, element sizing, and tap-target issues at 390px or 768px. Include the exact width and the element.

*Log format:*  
`[MOBILE] Width: <390/768> · Element: <name> · Issue: <overflow/size/illegible> · Screenshot: <optional>`

### 5.3 Privacy / Trust
Any moment where it was unclear what was saved, sent, or visible to others. Includes intro note legibility, timeline panel note, Send-to-HumanX pre-click note, and Clear/Start Over behaviour expectations.

*Log format:*  
`[PRIVACY] Surface: <name> · Moment: <when confusion occurred> · Issue: <what was unclear>`

### 5.4 Review / Admin Ergonomics
Friction in the owner's moderation workflow. Includes queue load time, inspect-before-approve flow, approve/reject feedback, and rejected claim state.

*Log format:*  
`[REVIEW] Step: <name> · Issue: <what caused friction> · Severity: friction / blocker`

### 5.5 Drift / Belief Engine Usefulness
Issues with whether the Belief Engine result, Drift profiles, or comparison delta felt meaningful or useful. This is a harder signal than bugs — log it when the result felt arbitrary, empty, or misleading.

*Log format:*  
`[DRIFT] Surface: <name> · Observation: <what felt off> · Hypothesis: <why>`

### 5.6 Public Content Quality
Issues with existing Claims or Truths that are vague, misleading, poorly formed, or inappropriate for a public beta. Flag for Review moderation, not code changes.

*Log format:*  
`[CONTENT] Type: claim/truth · Identifier: <title or first 10 words> · Issue: <quality concern>`

### 5.7 Abuse / Spam Guardrails
Gaps in submission friction, rate limiting, or content normalisation. Do not test with genuinely offensive content. Observe the system's response to benign edge cases (very short, very long, repeated, unusual characters).

*Log format:*  
`[ABUSE] Flow: <submission/claim/truth> · Test: <what was submitted> · Response: <what happened>`

---

## 6. Stop Conditions

Stop all testing and file a fix task immediately if any of the following occur. Do not continue to the next cycle until the stop condition is resolved.

| Condition | Category | Action |
|---|---|---|
| The Belief Engine result reads as a diagnosis, score, or verdict about the person | Privacy/Trust | File D-125x BLOCKER — result framing fix |
| "Send to HumanX" wording implies the snapshot is published or shared publicly | Privacy/Trust | File D-125x BLOCKER — bridge copy fix |
| `/api/debug` returns unredacted output without an admin token | Security | File D-125x BLOCKER — admin-gate regression |
| Review tab shows queue contents without an admin token | Security | File D-125x BLOCKER — Review gate regression |
| A submitted claim appears publicly without passing through Review | Security | File D-125x BLOCKER — review-first regression |
| Mobile result screen requires horizontal scrolling at 390px | Mobile | File D-125x BLOCKER — mobile layout fix |
| Clear or Start Over causes saved data to reappear after reload | Data | File D-125x BLOCKER — localStorage regression |

---

## 7. Next Task Recommendation

**D-125B — Owner test cycle 1: Home and onboarding clarity audit**

Run Cycle 1 (section 3 above) against the live site at `https://humanx.rinkimirikata.com`. Simulate P1 (fresh mobile) and P5 (confused normal user). Log all FRICTION and BLOCKER findings by category (section 5). Produce a verdict (PASS / PASS WITH NOTES / BLOCKER FOUND) and a backlog list. If no blockers, continue to D-125C (Cycle 2: Belief Engine full run).

---

## Cycle Sequence

| Task | Cycle | Persona | Focus |
|---|---|---|---|
| D-125B | 1 | P1, P5 | Home / onboarding clarity |
| D-125C | 2 | P1, P2 | Belief Engine full run |
| D-125D | 3 | P2 | Drift + saved results |
| D-125E | 4 | P4, P6 | Claim submission + Review |
| D-125F | 5 | P3, P5 | Public content browsing |
| D-125G | 6 | P1 | Mobile layout stress |

Each task produces a verdict and a backlog list. Blockers interrupt the sequence and get a fix task. After all six cycles complete with no blockers, the product is ready for a first external tester invite.
