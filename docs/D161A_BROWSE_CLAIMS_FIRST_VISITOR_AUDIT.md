# D-161A — Browse Claims First Visitor Audit

**Date:** 2026-06-24
**Scope:** Docs only. Audit and recommendations for D-161B. No code change in this patch.

---

## Current Behaviour Summary

### Entry path

From the home page (post D-159B), "Browse Claims" is the first/primary action card:
> "Open, study, vote on, and attach evidence to public claims. Enter Study mode for evidence, pressure, tests, and analysis."
> When: reviewing, attacking, or supporting existing claims.

Clicking it calls `setMode('arena')`, which calls `renderArena()`.

### What renders on Browse Claims

`renderArena()` produces:
1. `<h2>Claims</h2>` + a graph stats box (claim/evidence/truth/link/vote/report counts pulled from `/api/graph`)
2. A grid of `card()` elements, one per claim from the `claims` array

Each `card()` contains:
- Status badge (coloured: green = Proven/Supported, red = Disproven/Collapse, blue = Plausible, yellow = other)
- Category chip (e.g. "Medicine", "Science")
- Claim title text (cleaned/trimmed via `cleanClaimLabel`)
- Review state badge via `reviewStatusBadge()` — can show "Public", "Reported", "Pending Review", "Rejected", "Archived"
- Meta: type + "by [handle]"
- Three meter bars: Evidence score, Testability, Survivability
- Belief votes: ▲ Believe / ▼ Reject / ~ Unsure + ⊘ pressure count
- "Study Claim →" button

### Context panel (sidebar)

`helperText()` has no `arena` branch — it falls through to the default return:
> "Browse public claims. Open Study to investigate, vote on, and attach evidence to any claim."
> "Badges: Public · Pending Review · Rejected · Reported · Archived."
> "Verdicts are pressure-test labels, not automatic truth rulings."
> "Use the search bar and verdict filter to narrow the list."

### API

`GET /api/claims` — no auth gate; fully public. `listClaims()` queries `WHERE COALESCE(review_state,'public')='public'`, so only approved/public claims are returned. Results are mapped through `mapClaim()`.

### Fields returned by mapClaim

`id`, `claim`, `category`, `type`, `status`, `evidenceScore`, `survivability`, `testability`, `contradictions`, `reportCount`, `reviewState`, `beliefYes`, `beliefNo`, `uncertainty`, `createdAt`, `updatedAt`, `handle`, `nearDuplicateOf`

`handle` is the public pseudonymous handle of the submitter (`'anon'` if none). `reportCount` is returned but used only to drive the "Reported" badge — not displayed as a raw number to visitors. **No private fields** (`user_id`, `email`, `is_admin`, `evidence.body`, `pressure_points.body`) are included.

### Empty / loading / error states

- **Empty list:** `<p>No claims match this view.</p><p class="small">Claims are public, testable statements with evidence and pressure attached. Use the Submit tab to add one, or adjust the verdict filter above.</p>` + "Submit Claim" and "Show all" buttons. Friendly, informative.
- **Error:** `renderError()` shows: "HumanX backend notice" + error message + "← Back to Home" button. Reads like a debug screen rather than a friendly notice.
- **Loading:** no explicit loading skeleton — claims render once loaded, no intermediate state shown.

### Filters / search / sort

- Search bar (top of page, `#search` input) filters in-place by calling `searchCurrent()` → `loadClaims(true)`; search term is URL-encoded and passed as `?q=…`
- Verdict filter (`#filter` select): All verdicts / Proven / Strongly Supported / Plausible / Untestable / Weak Evidence / Disproven / Reality Collapse
- No sort control; always sorted by `created_at DESC` (newest first)

---

## 1. Visitor 5-Second Read

After clicking Browse Claims, within 5 seconds a visitor sees:
1. `<h2>Claims</h2>` — bare title, no explanatory subheading
2. Graph box: counts of Claims / Evidence / Truths / Links / Votes / Reports
3. A grid of claim cards each showing a coloured status badge, category chip, claim title, three thin meter bars, and vote tally

**What they understand:** There is a list of statements with coloured labels and numeric scores.

**What they do not understand:**
- What a "claim" is (never defined on screen)
- What the status badges mean ("Strongly Supported"? "Reality Collapse"?)
- What Evidence / Test / Survive meters measure
- What "▲ Believe / ▼ Reject / ~ Unsure" means for a public list — are these their votes or existing community tallies?
- Whether clicking "Study Claim →" costs them anything or requires an account

---

## 2. Does Browse Claims Explain What a Claim Is?

**Partially — in the wrong place.** The sidebar `helperText()` for arena says "Browse public claims. Open Study to investigate…" but this is in the side panel context area, not inline with the list. Many visitors will not read the sidebar. The claim cards themselves have no definitional copy.

The empty-state copy is better: "Claims are public, testable statements with evidence and pressure attached" — but this is only visible if the list is empty.

---

## 3. Does It Feel Like a Public Gallery or Raw App Data?

**Raw app data.** Current issues:
- `<h2>Claims</h2>` gives no visitor context — it is an app section label, not a public gallery heading
- The graph stats box (counts of Links, Votes, Reports) reads like an admin overview widget, not a public entry point
- Three meter bars with no inline legend require prior knowledge to interpret
- The sidebar context is good but is tucked away; many visitors will miss it

---

## 4. Are Claim Statuses/Labels Understandable?

**Mixed.** Some statuses are reasonably intuitive ("Proven", "Plausible", "Disproven"), but several are not:
- "Reality Collapse" — opaque to a newcomer
- "Strongly Supported" — clearer, but "Supported" vs "Proven" distinction not explained
- "Weak Evidence" — reasonable, but implies a rating system the visitor has not been introduced to

The sidebar legend "Verdicts are pressure-test labels, not automatic truth rulings" is useful context but visible only in the side panel.

---

## 5. Are Empty/Loading/Error States Friendly?

- **Empty state:** friendly and informative — explains what claims are and offers two actions
- **Error state:** functional but reads as a debug screen ("HumanX backend notice") rather than a visitor-friendly message
- **Loading state:** no skeleton/spinner — the list area is blank until data arrives; could feel broken on slow connections

---

## 6. Clear Path From Claim to Study View?

**Yes — the happy path is clear once you see the cards.** Every claim card has a "Study Claim →" button. This is unambiguous. The `selectClaim()` function opens study mode in-place. No account required to enter study mode and read the claim.

The friction is that visitors do not know what "Study" means before they click — there is no tooltip or brief description on the button.

---

## 7. Does the Page Expose Private/Admin/Internal Fields?

**No.** Confirmed:
- `mapClaim()` excludes `user_id`, `email`, `is_admin`
- `handle` is public pseudonym (`'anon'` if none)
- `reportCount` drives the "Reported" badge display only — the raw number is not shown to visitors (it is in the API response but `card()` does not render it as a count)
- `reviewState` is used to gate what appears (only `'public'` rows are returned) and drives the review badge — no internal state leaks

---

## 8. Should Browse Claims Lead With a Short Public Explanation?

**Yes.** The strongest single improvement would be a one-sentence intro below `<h2>Claims</h2>`:
> "Public statements being pressure-tested with evidence. Click any claim to study the evidence, vote, or attach your own."

This closes the 5-second comprehension gap without redesigning the list.

---

## Strongest Hook

**The claim cards themselves.** When a visitor reads an actual claim — "Vitamin C prevents the common cold", "The 1987 Iran-Contra affair was formally pardoned" — they understand immediately what the system does. The hook is the content. The problem is the wrapper gives no context for why the list exists or what to do with it.

---

## Biggest Friction Points

1. **No inline definition of "claim"** — the word is used but never explained on screen for a first-time visitor
2. **Graph stats box** reads as admin instrumentation, not a welcome to a public gallery
3. **Meter bars have no legend** — Evidence / Test / Survive are unlabelled as to meaning; the tooltip text is only visible on hover
4. **Status labels like "Reality Collapse"** are opaque without context
5. **"Study Claim →" button** is clear but "Study" is an unusual verb — "Investigate" or "Open" would be more universally understood
6. **Error state copy** ("HumanX backend notice") reads as internal/developer language

---

## Privacy / Public Boundary Verdict

**Clean.** `/api/claims` is correctly unauthenticated and returns only public claims. `mapClaim()` does not expose sensitive fields. The `handle` is public by design. `reportCount` is in the API response but not rendered as a raw number in the visitor UI. No private data reaches the Browse Claims view.

---

## Recommended D-161B Implementation Plan

**Goal:** Make Browse Claims feel like a public gallery for a first-time visitor in under 5 seconds. No backend changes.

### 1. Add a short intro subheading below `<h2>Claims</h2>` in `renderArena()`

Replace:
```
<div class="section-head"><h2>Claims</h2>${graphBox()}</div>
```
With:
```
<div class="section-head"><h2>Claims</h2><p class="arena-intro small">Public statements being pressure-tested with evidence. Click any claim to study the evidence, vote, or attach your own.</p>${graphBox()}</div>
```

### 2. Move the graph stats box to a less prominent position (or collapse it by default)

The graph box (Claims/Evidence/Truths/Links/Votes/Reports) reads as an admin count panel. Options:
A. Remove it from Browse Claims view entirely (keep it only in admin/review mode)
B. Collapse it behind a `<details>` toggle: `<details><summary>Site stats</summary>${graphBox()}</details>`
C. Leave it but reduce font size / change heading copy from "Site overview" to something neutral

Recommendation: (B) — collapses by default, available if someone wants it, does not confuse first-time visitors.

### 3. Rename "Study Claim →" to "Investigate →" on the Browse Claims card

The word "Study" is used in study mode and understood in context there. On the card grid, "Investigate →" is more universally understood for a first-time visitor.

This is a one-word copy change in `card()` — but `card()` is also used in other contexts. Check call sites before making this change in D-161B.

### 4. Add a status-label glossary tooltip to the verdict filter label (low effort)

Add `title="Verdicts are pressure-test labels, not automatic truth rulings"` to the `#filter` select or its label. One attribute, zero layout change.

### 5. Improve error state copy in `renderError()`

Change "HumanX backend notice" to "Something went wrong" and add a softer description:
> "Could not load claims. Check your connection and try again."

This applies globally (not just Browse Claims), so keep the change minimal.

### What NOT to Change

- `/api/claims` route and `mapClaim()` field set — already correct and clean
- `listClaims()` auth boundary — correctly public
- The empty-state copy in `renderArena()` — already good
- Sidebar `helperText()` arena content — already informative (keep as is, just supplement with inline copy)
- The card voting display — appropriate for the context
- Review state badge logic — correct
- Any admin/review/owner-token route

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-161B plan.
