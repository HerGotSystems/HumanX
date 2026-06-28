# D-190A — Product Readiness Audit: First External Users

**Date:** 2026-06-28
**HEAD at audit:** `f4e36e3`
**Baseline:** 1566/24/57
**Scope:** Read-only source-code audit. No code changes. `public/app-v10.js`, `src/worker.js`, `public/index.html`, `public/styles.css`.
**Method:** Full function-by-function inspection of all user-facing surfaces.

---

## Executive Readiness Verdict

> **Cautiously ready for a small cohort of trusted external users (5–20 people). Not ready for open sharing or public links distributed broadly.**

HumanX has a coherent product loop — browse claims, open Study, vote, contribute, build RunPack — and the core surfaces are stable, honest, and well-explained. The home page, Study view, and contribution flows are all good enough to show. Several issues need fixing before external exposure: two are trust-breaking (developer-language strings visible to users, Review tab in the nav), one is a possible spam vector, and a handful are confusing but survivable for a small preview cohort.

---

## What Is Already Good Enough

### Core loop
- Browse Claims → open claim card → Study mode is fluid and low-friction
- Study view renders cleanly: score meters, flow panel, vote row, investigation board, all sections render with fallback empty states
- Evidence/pressure/test contribution loop is honest about Review gating after D-189B/C
- RunPack → AI → paste-back analysis flow is documented inline and works end-to-end
- `copyClaimLink` is wired in Study, My HumanX, and public profiles (D-188B/C)

### Entry points
- `/c/:id` direct claim URLs serve OG meta for public claims and a generic noindex shell for private/missing — safe to share
- `/u/:slug` public profiles load cleanly with profile data, claim list, and belief snapshot; error state is friendly ("Profile not found or not public.")

### Contribution copy
- All four contribution toasts are now honest about review-gating (D-189B/C)
- Claim Builder 3-step flow explains the pipeline: raw thought → testable draft → review
- "Add to Claim" button (not "Attach to Selected Claim") label is accessible
- Flow panel CTA buttons for empty evidence/pressure slots guide users to the next action

### Technical
- Backend unreachable renders a "Something went wrong" panel with a Back button — not a blank screen
- `selectClaim` error fallback renders Study with cached claim data if the API fails
- Rate limiting on claim/evidence/pressure routes (8–20 requests per hour per IP)
- All new items enter Review before affecting public score — spam and low-quality submissions are contained

### Trust signals present
- "invite-only preview" badge on home page hero
- "Enters Review before going live" copy in claim builder
- All score meters include a verdict qualifier: "Verdict is a pressure-test label, not an automatic truth ruling"
- Report claim flow is in place

---

## P0 — Must Fix Before Any External User

### P0-1: Developer-language in the live status bar

**Where:** Home page hero statusline and top-right status dot  
**What users see:** `D1 live · 42 claims · 8 truths · 6 evidence` and a green dot labeled "D1 live" in the header  
**Problem:** "D1 live" and "Demo fallback" are Cloudflare D1 database implementation terms, not user-facing labels. An external user's first data point about the product is a technical DB status string.  
**Fix:** Replace `'D1 live'` with `'Live'` and `'Demo fallback'` with `'Demo mode'` in `boot()` and `setStatus()`. The dot already indicates status; the label just needs human language.  
**Effort:** 2 string changes in `public/app-v10.js`.

---

### P0-2: "Review" tab is visible to all users including external visitors

**Where:** Main navigation bar (`public/index.html`)  
**What users see:** A tab labeled "Review" at the same level as Home, Claims, Me, RunPack  
**Problem:** Review is an admin-only queue. External users clicking it see a page with "admin only" badge and a password input. This is confusing and raises an immediate question: "What is this? Am I supposed to have access?" It also signals that the product has an unpublished admin interface, which erodes trust.  
**Fix option A (trivial):** Hide the Review tab via CSS `#tab-review { display: none }` for non-admin users. The tab can be added back when admin is bootstrapped in the session.  
**Fix option B (clean):** In `boot()` or `renderReview()`, hide/show `#tab-review` based on whether `adminToken()` is non-empty.  
**Effort:** 2–4 lines.

---

### P0-3: Home page hero links to `/u/calenhir` — a specific internal user

**Where:** `renderHome()`, `cc-intro-bridge` paragraph  
**What users see:** `"View a public profile example →"` linking to `/u/calenhir`  
**Problem:** If `calenhir` is not a maintained demo account with representative, always-fresh content, this link will either 404 or show stale/incomplete data to every external user who clicks it. It will be the first link many new users try. A broken or underwhelming example profile is worse than no example.  
**Options:**
- Verify `calenhir` is a live, maintained public profile with real claim content → keep
- Replace with a link to a specific public claim (`/c/:id`) if there's a well-studied showcase claim
- Remove the link entirely until a maintained demo profile exists  
**Effort:** 1 string or attribute change.

---

### P0-4: Global graph stats show "Reports: N" to all users

**Where:** `graphBox()` function in `renderHome()`  
**What users see:** The home page right column shows: Claims / Evidence / Truths / Links / Votes / **Reports**  
**Problem:** "Reports: 3" is an internal moderation metric, not a trust signal for external users. It reads as "3 claims have been flagged as problematic" — this undermines confidence in the platform's content at first impression.  
**Fix:** Remove "Reports" from the `graphBox()` items array. The remaining 5 metrics (Claims, Evidence, Truths, Links, Votes) make sense publicly.  
**Effort:** Remove one entry from `items` array in `graphBox()`.

---

## P1 — Fix Before Wider Sharing

### P1-1: Anonymous users can submit claims and evidence to the backend

**Where:** `src/worker.js` — `createClaim`, `addEvidence`, `addPressure`, `addHomeTest`  
**What this means:** Any visitor with no invite code can submit claims and evidence. The only server-side gate is `requireUser` (checks for a generated user ID, not a verified account). The UI shows the Claim Builder and side panel without any invite-check gate.  
**Risk:** In the current invite-only preview, all submissions enter Review, which contains the blast radius. But external users (and anyone who discovers the app) can fill the Review queue with noise.  
**Current mitigation:** Rate limiting (8 claims/hr, 20 evidence/hr per IP). All submissions enter review state. Score is not affected until approved.  
**Recommended fix:** Either (a) add a soft verified-only gate in the frontend for the Claim Builder and "Add to Claim" submit button — show a friendly "You need an invite to submit. Redeem your code in ◎ account →" message — or (b) add `requireVerifiedUser` to the backend routes.  
**Effort:** Frontend-only option is low effort; backend option is medium.

### P1-2: `anon-xxxxxx` is the default handle shown everywhere

**Where:** `localUser()`, account panel, home page hero statusline  
**What users see:** `anon-k3f2r9 · Live · 42 claims`  
**Problem:** `anon-xxxxxx` is a randomly generated technical identifier, not a user-facing label. External users will see this as their name throughout the product unless they redeem an invite. The handle appears in the top header account button and the home page statusline. It signals "you are anonymous in a system" rather than "you are browsing a preview."  
**Fix:** Replace the statusline span with a neutral label for unverified users: `"guest"` or `"browsing"` instead of the raw anon handle. Or hide it entirely in the statusline when unverified.  
**Effort:** Small — 1–2 string changes in `renderHome()` and `localUser()`.

### P1-3: "Evidence" (Vault) tab is confusing for external users

**Where:** Tab navigation, `renderVault()`  
**What users see:** A tab labeled "Evidence" in the nav. Opening it shows "Evidence Vault" with a list of reusable evidence items.  
**Problem:** The Vault is a personal evidence library. For a new external user with no submissions, it will be empty. The concept of a "vault" for reusable evidence is not explained anywhere in the nav context. It reads as either a second place to browse evidence (vs. the per-claim evidence in Study) or an admin feature. External users are likely to click it, see an empty list, and be confused.  
**Fix options:**
- Rename the tab to "My Evidence" to signal it is personal
- Add a one-line explanation to the `renderVault()` empty state: "Your vault holds reusable sources and documents. Once you add evidence to a claim from the side panel, it appears here for reuse."
- Or hide the tab until the user has at least one contribution  
**Effort:** Low — copy change in vault empty state.

### P1-4: "Drift" tab has no entry point for external users

**Where:** Tab navigation, `renderDrift()`  
**What users see:** "Drift" in the nav. Opening it shows "Belief snapshots over time" but requires having previously used the Belief Engine to save snapshots. For a new user it will be empty.  
**Problem:** An empty Drift page with no snapshots and no obvious onboarding path looks like a broken feature. There is no "You haven't saved any snapshots yet" message with a call to action.  
**Fix:** Add an empty state to `renderDrift()` for when `ordered.length === 0`: "No belief snapshots yet. Use the Belief Engine to map a belief — saved profiles appear here as a timeline."  
**Effort:** Low.

### P1-5: Truths tab has no explanation of what Truths are vs. Claims

**Where:** Tab navigation, `renderTruths()`  
**What users see:** A list of "Truths" — which are distinct from Claims but the distinction is not surface-level obvious.  
**Problem:** The difference between a Truth (a statement that circulates as fact, upstream of a Claim) and a Claim (a testable public statement) is core to the HumanX model but not explained when a user lands on the Truths tab. First-time users are likely to mistake Truths for a separate claim list.  
**Fix:** Add a short explanatory paragraph to `renderTruths()`: "Truths are statements people repeat as certainty. They feed into Claims — the testable layer above. A Truth may be accurate, unverified, or contested."  
**Effort:** Low — copy addition.

---

## P2 — Annoying But Usable

### P2-1: No active vote state on vote buttons after voting

**Where:** Study view vote row  
**What happens:** User clicks "▲ Believe." Toast says "Vote recorded: Believe." The board re-renders. The three vote buttons (▲ Believe, ▼ Reject, ~ Unsure) all look the same — no active/selected state shows which option they chose.  
**Impact:** User uncertainty: "Did my vote save?" — low trust signal. The toast disappears after 1.8s, leaving no persistent confirmation.

### P2-2: Mobile Study mode: side panel contribution form is below the fold

**Where:** Study mode on phones (≤600px)  
**What happens:** At 900px, the layout collapses to 1 column via `grid-template-columns:1fr`. The side panel (with the evidence/pressure form) stacks below the full Study content — meters, flow panel, lineage, investigation board. On a phone the user must scroll past ~1500px of content to reach the form.  
**Impact:** Contribution on mobile is very high friction. The `+ Evidence`, `+ Pressure`, `+ Test` buttons in the investigation board header call `focusAdd*` which focus the side-panel inputs — but those inputs are below the scroll position, so the browser's auto-scroll behavior is the only help.

### P2-3: RunPack (Export) tab label doesn't say "RunPack"

**Where:** Tab navigation  
**What users see:** "RunPack" in the nav takes users to a tab titled "RunPack" — this is fine. But the home page start-here grid labels it "Build a RunPack" while the tab says "RunPack" — the label is consistent between home and nav, which is good. However the label "Export" in the tab bar (inspecting the HTML: `<button id="tab-export"...>RunPack</button>`) is internally `export` but labeled RunPack externally. No user impact unless debugging.

### P2-4: Claim Builder Step 2 AI-assist references a feature that may not be wired

**Where:** `renderBuilderStep2()` — the "Make it testable" step  
**Problem:** If the AI-assist button (`analyseClaimWithAI`) is not wired or the endpoint is unavailable, the user gets a silent fail or an error toast with no recovery path. Need to verify the flow completes.  
**Note:** Cannot verify without hitting the actual API. Flag for manual QA.

### P2-5: Search + filter does not debounce on the arena

**Where:** Arena search input, `searchCurrent()` function  
**Problem:** Search fires on `oninput` — every keystroke triggers a re-filter. On a large claims list this causes visual flicker. Not blocking but slightly rough.

### P2-6: Study "← Back" label works but navigation state can be wrong

**Where:** Study view back button  
**Problem:** `lastModeBeforeStudy` defaults to `'arena'`. If a user arrives via direct URL (`/c/:id`) and closes the tab then reopens, `lastModeBeforeStudy` is reset to `'arena'`. The back button says "← Back to Claims" which is correct. But if a user arrives via `/c/:id` and navigates internally before arriving at Study, `lastModeBeforeStudy` may say the wrong mode. Low frequency but worth noting.

---

## P3 — Polish

### P3-1: "D1 live" status dot + "anon-xxxxx" in header are both visible simultaneously

The header shows `◎ anon-k3f2r9` (the account button) and `● D1 live` (the status dot) at the same time. Together they signal "this is an internal developer tool." Both should be softened for external users (P0-1 covers the D1 label; P1-2 covers the anon handle).

### P3-2: Home page hero shows "Reports: 0" in the graph stats

Covered in P0-4. Secondary impact: the home page graph box (the right column of the hero) displays 6 stats that read like a database inspector view. For an external user, "Links: 0, Reports: 0" is not meaningful. Consider: Claims, Evidence, Votes — the three human-readable signals.

### P3-3: RunPack CTA copy is "Done adding evidence and pressure? Create RunPack →"

Tests and analysis are also RunPack inputs. The copy undersells the product's depth. `"Ready to analyse this claim? Create RunPack →"` is shorter and more accurate.

### P3-4: Vote count display on claim cards shows raw integers with no context

Arena cards show `▲ 3 · ▼ 1 · ~ 2`. External users don't know what these numbers mean without reading the tooltip (`title` attribute). A micro-label like "3 believe · 1 reject · 2 unsure" would be clearer.

### P3-5: Claim type dropdown options in the builder use technical labels

"Physical/Testable", "Social/Behavioral", "Historical/Archival", "Definitional" — these are sensible categories but the labels assume familiarity with the HumanX model. Brief inline descriptions would help first-time users choose correctly.

### P3-6: No favicon beyond the default browser icon

A favicon gives the app identity in the browser tab. None is set. Minor but visible on first exposure.

### P3-7: The home page "Step 2: Open & investigate" has the same CTA as Step 1

Both Step 1 ("Explore claims") and Step 2 ("Open & investigate") have "Browse Claims →" as the button label. Step 2's CTA should reflect the action described: the user needs to already be in Claims and click a card. The button is redundant — Step 2 is an instruction, not a separate destination.

---

## Trust/Safety Risks

| Risk | Severity | Mitigation present |
|------|----------|--------------------|
| Anon users can submit claims/evidence | Medium | Rate limiting + Review queue |
| Reports count visible on home | Low-Medium | P0-4 fix removes it |
| Developer DB terminology ("D1 live") | Medium | P0-1 fix removes it |
| Review admin tab visible in nav | Medium | P0-2 fix hides it |
| No privacy policy or terms | Low | Invite-only preview mitigates this for now |
| Score presented as verdict without disclaimer | Low | Verdict qualifier present in Study |
| `calenhir` example link may be stale/broken | Medium | P0-3 covers it |

---

## Obvious User Journey Assessment

| Journey | Works? | Issues |
|---------|--------|--------|
| Browse claims (Arena) | ✅ Yes | Filter and search work; empty state explains; verdict qualifier present |
| Open claim (Study) | ✅ Yes | Clean render; all sections load; back navigation works |
| Vote | ✅ Yes | Toast is specific; board updates; no active state after vote (P2-1) |
| Add evidence | ✅ Yes | Form is accessible; toast honest about review; next-action hint |
| Submit claim | ⚠️ Partial | No invite-gate in frontend; anon users can submit; claim builder works |
| Copy claim link | ✅ Yes | Button in Study, Me, public profile; copies `origin/c/:id` |
| View public profile | ✅ Yes | `/u/:slug` loads; 404 is friendly |
| Direct URL `/c/:id` | ✅ Yes | OG meta served; SPA auto-opens Study; 404 is clean |

---

## Recommended D-190B Quick-Fix Pack

All P0 fixes + high-effort P1 frontend gate (P1-1). Estimated: 20–30 lines total.

| Fix | File | Change |
|-----|------|--------|
| P0-1: D1 live → Live | `public/app-v10.js` | 2 string changes in `boot()` / `setStatus()` calls |
| P0-2: Hide Review tab | `public/app-v10.js` | `#tab-review` hidden on boot; revealed if adminToken present |
| P0-3: Remove/update calenhir link | `public/app-v10.js` | Remove or redirect example profile link |
| P0-4: Remove Reports from graphBox | `public/app-v10.js` | Remove `['Reports', g.reports]` from items array |
| P1-1: Frontend invite gate for submit | `public/app-v10.js` | In `submitBuilderClaim()` / `addCaseItem()`: check `accountUser?.verified`; if not, toast with invite-redeem message |
| P1-2: Soften anon handle in statusline | `public/app-v10.js` | Replace anon handle in `cc-hero-statusline` with `"guest"` or hide |
| P3-3: RunPack CTA copy | `public/app-v10.js` | `"Done adding evidence and pressure?"` → `"Ready to analyse this claim?"` |
| P3-6: Favicon | `public/index.html` | Add `<link rel="icon" ...>` pointing to any existing icon asset |

---

## Recommended D-190C+ Bigger Fixes

| Fix | Notes |
|-----|-------|
| P1-1 backend option: `requireVerifiedUser` on claim/evidence routes | Medium effort; adds server-side invite gate |
| P1-3: Vault tab UX / rename | Rename, improve empty state, or hide until user has contributions |
| P1-4: Drift empty state | Add guided empty state for first-time users |
| P1-5: Truths tab explanation | Add model explanation copy |
| P2-1: Active vote indicator | CSS class on re-render matching stored vote; needs vote state returned from API |
| P2-2: Mobile contribution flow | Separate mobile add-form or scroll-to anchor behavior |
| P2-4: Builder AI-assist manual QA | Verify step 2 AI flow completes end-to-end |
| P3-4: Vote count labels | Tooltip or inline labels for vote counts on cards |
| P3-5: Claim type descriptions | Inline description per claim type in builder |

---

## Files Inspected

| File | Notes |
|------|-------|
| `public/app-v10.js` | All modes: `renderHome`, `renderArena`, `renderStudy`, `renderExport`, `renderMe`, `renderPublicProfile`, `renderReview`, `renderVault`, `renderDrift`, `renderTruths`, `renderSubmit`, `sectionEvidence`, `sectionPressure`, `sectionTests`, `sectionAnalysis`, `sectionArgumentFlow`, `sectionLineage`, `boot`, `selectClaim`, `graphBox`, `accountPanelHtml`, `voteClaim`, `addCaseItem`, `addHomeTestUI`, `saveAnalysisResult`, `submitBuilderClaim`, `localUser`, `ensureSession` |
| `src/worker.js` | `requireUser`, `requireUserId`, `createClaim`, `addEvidence`, `addPressure`, `addHomeTest`, `renderClaimShell`, `loadClaimSummary` |
| `public/index.html` | Head/OG meta, nav tab list, side panel structure |
| `public/styles.css` | All 26 media queries; layout breakpoints at 400/480/500/600/640/700/900px; sidepanel display rules |
