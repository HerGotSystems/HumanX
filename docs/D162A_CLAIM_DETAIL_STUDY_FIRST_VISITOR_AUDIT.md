# D-162A — Claim Detail / Study First Visitor Audit

**Date:** 2026-06-24
**Scope:** Docs only. Audit and recommendations for D-162B. No code change in this patch.

---

## Current Behaviour Summary

### Entry path

A visitor clicks "Investigate →" on a Browse Claims card. `selectClaim(id)` is called, which:
1. Fetches `GET /api/claims/:id` — **no auth gate** — public, unauthenticated
2. Stores `selected` with `claim`, `evidence`, `pressure`, `tests`, `analyses`, `lineage`
3. Calls `renderStudy()`, which calls `document.body.classList.add('study-mode')`

### What renders in study view

`renderStudy()` produces (in order):

1. **Study header**
   - Back button: `← Back` (or context-specific if entered from review/vault/truths/me)
   - Status badge (coloured by verdict)
   - Claim title (`<h2>`)
   - Review state badge (with note: "This claim is kept out of public view" / "This claim is not public until approved")
   - Meta: category · type · "by [handle]"
   - Three meters: Evidence / Testability / Survivability (with hover tooltips)
   - Verdict disclaimer: "Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty."
   - Vote row: "▲ Believe" / "▼ Reject" / "~ Unsure" buttons + "Build RunPack" button

2. **Claim Flow section** (`sectionArgumentFlow()`) — badge: "read this first"
   - Step 1: "Why people think it is true" — first support evidence title + truncated body (260 chars)
   - Step 2: "What attacks it" — first pressure title + truncated body (260 chars)
   - Step 3: "How to test it" — first test title + instructions (260 chars)
   - Step 4: "What analysis says" — first analysis verdict + summary (260 chars)
   - Empty state for each step gives a short instruction on how to add one

3. **Lineage section** — badge: "upstream origin"
   - Graph counts: Beliefs / Truths / Claim / Evidence / Pressure / Tests / Analysis
   - Upstream truths listed (up to 3)
   - Empty state: "No upstream truth linked yet…"

4. **Investigation Board** label
   - **Support Evidence** panel — with purpose: "What currently supports this claim."
   - **Pressure / Attacks** panel — with purpose: "What challenges, contradicts, or weakens it."
   - **Tests** panel — with purpose: "Ways this claim could be checked or falsified." + test add form
   - **Analysis** panel — with purpose: "Saved RunPack or AI analysis results." + analysis paste form

### API: `GET /api/claims/:id`

**No auth gate.** Returns:
- `claim` via `mapClaim()` — same field set as Browse Claims (no private fields)
- `evidence` — `SELECT e.*` — **includes `e.body`, `e.source_url`** — filtered to `review_state='public'` only
- `pressure` — `SELECT p.*` — **includes `p.body`** — filtered to `review_state='public'` only
- `tests` — public, no body restriction (instructions are by design public)
- `analyses` — analysis results (plain language summaries, verdicts, structured scores)
- `lineage` — truth links, belief links, count summary

### Body rendering

`evidenceBodyHtml(text, maxChars)` renders evidence and pressure bodies:
- Short text: `<p class="small ev-body-text">…</p>` truncated at `maxChars`
- JSON/AI output: preview chip + collapsed `<details>` with full text

`sectionArgumentFlow()` shows truncated bodies (260 chars) for the first evidence and pressure items.

`evidenceItem()` and `pressureItemHtml()` show up to 300 chars of body text.

**Note:** `evidence.body` and `pressure_points.body` are intentionally shown in the study view — this is the investigation board, designed to show approved public evidence. This is correct behaviour. The constraint "do not expose evidence.body / pressure_points.body" applies to the *public profile* `/u/:slug` endpoint, which deliberately omits bodies (summary-level only). Study mode is different: it is the investigation surface.

---

## 1. Visitor 5-Second Read

After clicking "Investigate →", within 5 seconds a visitor sees:
1. `← Back` button + coloured status badge + claim title (large `<h2>`)
2. Verdict disclaimer in small text
3. "▲ Believe / ▼ Reject / ~ Unsure" vote buttons

**What they understand:** There is a claim with a coloured status label, and they can vote.

**What they do not understand in 5 seconds:**
- What "Claim Flow" means (it appears just below, but requires scrolling)
- What "Lineage" means (appears below Claim Flow)
- What "Investigation Board" means
- What "Testability" and "Survivability" meters measure (tooltips help on hover, not on first glance)
- Why there is a "Build RunPack" button in the claim header (no explanation visible without hovering)
- What "▲ Believe / ▼ Reject" does — is this a live poll? Does it affect the verdict?

---

## 2. Does the Page Explain What the Visitor Is Looking At?

**Partially.** Each investigation board section has a `<p class="inv-sec-purpose">` explaining what it is:
- "What currently supports this claim."
- "What challenges, contradicts, or weakens it."
- "Ways this claim could be checked or falsified."
- "Saved RunPack or AI analysis results."

The **Claim Flow** section (badge: "read this first") is an excellent structural hook, but its section head label "Claim Flow" is not self-explanatory. A visitor who has never heard the term won't know to read it first based on the label alone.

The verdict disclaimer is present but in `.small` text below the meters.

There is **no intro sentence** below the claim title or below the "Investigate" heading that tells a visitor: "This is what HumanX found about this claim."

---

## 3. Are Evidence, Pressure, Truth, Links, Votes, Reports Understandable?

| Element | Visitor-legibility |
|---|---|
| Support Evidence | Good — "What currently supports this claim." is clear |
| Pressure / Attacks | Good — "What challenges, contradicts, or weakens it." is clear |
| Tests | Good — "Ways this claim could be checked or falsified." is clear |
| Analysis | Moderate — "Saved RunPack or AI analysis results." requires knowing what RunPack is |
| Lineage | Poor — "upstream origin" + counts of Beliefs/Truths is opaque to a newcomer |
| Vote buttons | Moderate — "▲ Believe / ▼ Reject / ~ Unsure" is clear in intent but effect is unexplained |
| Meters (Evidence/Testability/Survivability) | Poor — tooltips only on hover; no inline legend |
| "Build RunPack" | Poor — unexplained button in the claim header |

---

## 4. Do Labels Sound Internal/Admin-ish?

Several terms are internally-oriented:
- **"Lineage"** — a technical/genealogy term; "Where this claim comes from" would be clearer
- **"Investigation Board"** — reasonable but unexplained
- **"Claim Flow"** — completely opaque without context
- **"RunPack"** — product-specific jargon in the claim header CTA
- **"legacy"** pill on old analysis items — clearly an internal state label

---

## 5. Does It Explain How a Claim Becomes Stronger/Weaker?

**Only via the verdict disclaimer.** The disclaimer says: "Verdict is a pressure-test label, not an automatic truth ruling. Scores reflect the current submitted packet, not absolute certainty." This is accurate but passive. It tells visitors what scores are *not*, without explaining what moves them.

A first-time visitor does not understand that attaching support evidence raises the Evidence score, or that high-severity pressure reduces Survivability. This is the core mechanic but it is not explained anywhere in the view.

---

## 6. Is There a Clear Way Back to Browse Claims?

**Yes.** The `← Back` button at the top of the study header always works. If the visitor entered from arena, `backToArena()` restores the arena view and scroll position. This is correct and clear.

---

## 7. Are Private Bodies/Internal Fields Exposed?

**No private fields are exposed.** Confirmed:
- `mapClaim()` is used for the claim object — no `user_id`, `email`, `is_admin`
- `evidence` and `pressure` are filtered to `COALESCE(review_state,'public')='public'` before returning
- `handle` is the public pseudonymous handle
- `evidence.body` and `pressure_points.body` are shown — but this is intentional and correct for the study view (investigation board). All items shown are approved public content.
- `user_id` from the evidence/pressure SELECT is not rendered in the frontend (`evidenceItem()` and `pressureItemHtml()` do not render `user_id`)
- No email, is_admin, owner token, or admin token fields anywhere in the study render path

---

## 8. Is the Detail Page Public-Safe?

**Yes.** All content shown is filtered to `review_state='public'`. The API is correctly unauthenticated. Evidence and pressure bodies shown are approved public items, not private user data. No invite codes, tokens, admin fields, or email addresses are rendered.

The test-add form and vote buttons are functional for all visitors (including unauthenticated) — submitting requires `ensureSession()` which creates/restores an anonymous identity. This is correct: the system allows anonymous participation. No exploit surface here.

---

## Strongest Hook

**The Claim Flow section.** Four numbered steps ("Why people think it is true", "What attacks it", "How to test it", "What analysis says") give a first-time visitor an instant understanding of the system's logic. If they read it, they understand HumanX. The problem is it is labelled "Claim Flow" with a badge that says "read this first" — visitors may not know what "Claim Flow" means and may scroll past it.

---

## Biggest Friction Points

1. **"Claim Flow" label is opaque** — the section that explains everything is labelled with jargon. Renaming to "How this claim is being tested" or adding an intro sentence would fix this.

2. **No intro sentence below the claim title** — a visitor who just clicked "Investigate →" has no orientation text. One line ("Here is what HumanX has gathered about this claim.") would help.

3. **Meter bars have no inline legend** — the three meters (Evidence/Testability/Survivability) have hover tooltips but no inline explanation of what they measure or what a high/low score means.

4. **"Lineage" section is opaque** — graph counts of Beliefs/Truths/Evidence/Pressure are not useful for a first-time visitor. The label "upstream origin" helps a little but the content is hard to interpret without context.

5. **"Build RunPack" in the header is unexplained** — it appears prominently next to vote buttons. A visitor does not know what a RunPack is.

6. **Vote effect is unexplained** — "▲ Believe / ▼ Reject / ~ Unsure" votes are visible on claim cards in Browse Claims as tallies, but there is no explanation of how they interact with the verdict or scores.

---

## Privacy / Public Boundary Verdict

**Clean.** All items in the study view are filtered to `review_state='public'`. No private fields are rendered. `evidence.body` and `pressure_points.body` are shown intentionally (investigation board) and contain only approved public content. The public profile endpoint (`/u/:slug`) separately omits these bodies — both behaviours are correct for their respective surfaces.

---

## Recommended D-162B Implementation Plan

**Goal:** Make the study view self-explanatory for a first-time visitor within 5 seconds, without redesigning the layout.

### 1. Rename "Claim Flow" to "How this claim is being tested" and add a one-line intro

Change the `<h3>` and its section head:
```
Before: <h3>Claim Flow</h3><span class="badge b-green">read this first</span>
After:  <h3>How this claim is being tested</h3><span class="badge b-green">start here</span>
```

### 2. Add a one-sentence orientation below the claim title in `renderStudy()`

After the `<h2>${claim}</h2>` line, add:
```
<p class="study-intro small">Here is what HumanX has gathered about this claim — evidence for, challenges against, and tests that could settle it.</p>
```

### 3. Add inline meter legend below the three meters

Below the `.meters.wide` block in the study header:
```
<p class="study-meter-key small">Evidence — support quality. Testability — how directly this can be checked. Survivability — how well it holds under pressure.</p>
```

### 4. Rename "Lineage" section head to "Where this claim comes from"

The section head badge says "upstream origin" — rename the `<h3>` to "Where this claim comes from" to reduce jargon.

### 5. Add a one-line "What is RunPack?" tooltip to the Build RunPack button

Add `title="Generate an investigation packet from this claim — paste into any AI for analysis"` to the "Build RunPack" button.

### 6. Add vote effect explanation below the vote row

Below the vote buttons, add:
```
<p class="study-vote-note small">Votes are community signals. They do not change the verdict directly — evidence and pressure scores drive the verdict.</p>
```

### What NOT to Change

- `GET /api/claims/:id` — no auth gate, correctly public
- `getClaim()` evidence/pressure filter — correctly scoped to public
- `mapClaim()` field set — no private fields
- `evidenceBodyHtml()` body rendering — correct for study view
- Back button behaviour — correct
- The Investigation Board structure and section purposes
- Vote, report, test-add, evidence-add functionality
- Admin/review routes — no changes
- Owner-token — frozen (D-149H)

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this audit or in the recommended D-162B plan.
