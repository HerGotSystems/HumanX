# D-97A — Public Truths Page Trust / Clarity Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 286 / belief-engine-static-check 24 / worker-route-static-check 39

---

## A. Files Inspected

| File | Sections read |
|---|---|
| `public/app-v10.js` | `renderTruths`, `truthCard`, `reviewStatusBadge`, `isTruthPersonalBelief`, `isTruthArtifact`, `isTruthBorderlineArtefact`, `convertTruth`, `renderTruthAdminBar`, `renderTruthFilterBar`, `helperText` (truths branch) |
| `public/styles.css` | `.truth-not-verified`, `.truth-personal-badge`, `.truth-artifact-badge`, `.truth-borderline-badge`, `.b-muted`, `.truth-convert-note`, `.truth-card-artifact`, `.truth-id-line`, `.truth-admin-bar`, `.b-yellow`, `.b-green` |
| `scripts/hardening-smoke-test.mjs` | Section 34 (D-92C), D-92E/G, D-93B truth tests |
| `docs/D92C_TRUTHS_PUBLIC_CLARITY.md` | Prior public-clarity decisions |
| `docs/D92G_ADMIN_TRUTH_ARTEFACT_CLEANUP_UI.md`, `D93A/B` | Admin badge/cleanup conventions |
| `docs/D-93C-borderline-truth-derived-policy-audit.md` | Borderline = advisory policy |
| `docs/README.md` | Standing warnings, check baseline |

---

## B. Current Public Truths Page Behavior Map

```
setMode('truths') → renderTruths()
  ├─ loadTruths() → GET /api/truths
  ├─ section-head: <h2>Truths</h2>  [badge: "widely asserted · not auto-verified"]  + graphBox()
  ├─ intro paragraph (PUBLIC, always shown):
  │    "Statements that circulate as fact — slogans, doctrines, inherited
  │     certainties, repeated beliefs. **Public means visible, not proven.**
  │     Recording a truth here does not verify it. Use **Pressure-test as
  │     Claim** to submit one for evidence-based review."
  ├─ Add-a-Truth form (PUBLIC):
  │    inputs: statement, category, origin; select: truth type
  │    button: "Submit Truth for Review"
  │    note: "Enters Review before going public."
  ├─ [ADMIN ONLY] renderTruthAdminBar(artefactCount, borderlineCount, personalCount)
  ├─ [ADMIN ONLY] renderTruthFilterBar(truths)  ← All/Artefacts/Borderline/Personal/Clean chips
  └─ truth grid: applyTruthAdminFilter(truths).map(truthCard)

truthCard(t) — head badge row:
  [b-yellow: truthType||'truth']           ← e.g. "religious", "political", "scientific"
  [b-muted truth-not-verified: "not verified"]   ← ALWAYS, font-size 8px
  [b-muted: "personal belief"]?            ← if isTruthPersonalBelief
  [b-muted: "? artefact"]?                 ← if isTruthArtifact (PUBLIC — visible to all)
  [b-muted: "? borderline"]?               ← ADMIN ONLY (isAdmin && borderline)
  [badge: confidenceLabel]?                ← if present
  [b-green: "→ claim exists"]?             ← if t.linkedClaimId

  <h3 truth-title> statement
  reviewStatusBadge(t)                     ← [b-green "Public"] for public truths
  meta: category · origin · by handle
  stats: ↻ N repeated   ⊘ N pressure?
  id line: admin → full id + copy button; public → "id: …last8"
  [ADMIN ONLY] archive artefact button (if isAdmin && artifact)
  actions: [primary "Pressure-test as Claim →"]
  note: "Creates a claim for review — does not prove this truth." (9px, opacity .6)
```

---

## C. Public vs Admin Badge Distinction

| Element | Visibility | Trigger | Trust meaning |
|---|---|---|---|
| `truthType` badge (yellow) | **Public** | always | category/type label — neutral |
| `not verified` badge | **Public** | always | honesty signal — **but 8px font** |
| `personal belief` badge | **Public** | `isTruthPersonalBelief` | distinguishes belief-engine output |
| `? artefact` badge | **Public** | `isTruthArtifact` | advisory junk signal |
| `? borderline` badge | **Admin only** | `isAdmin && isTruthBorderlineArtefact && !artifact` | advisory — hidden from public ✅ |
| `confidenceLabel` badge | **Public** | if present | self-reported confidence |
| `→ claim exists` (green) | **Public** | `t.linkedClaimId` | a claim was derived — green reads as positive |
| `reviewStatusBadge` → "Public" (green) | **Public** | `review_state==='public'` | **green "Public" can read as "verified"** |
| `reviewStatusBadge` → "Reported" (red) | **Public** | `report_count>0` | flagged |
| Truth admin bar | **Admin only** | `isAdmin` | artefact/borderline/personal counts ✅ |
| Truth filter bar | **Admin only** | `isAdmin` | All/Artefacts/Borderline/Personal/Clean ✅ |
| Full ID + copy button | **Admin only** | `isAdmin` | public sees `…last8` only ✅ |
| Archive artefact button | **Admin only** | `isAdmin && artifact` | gated ✅ |

**Admin clutter is well-hidden.** Borderline badge, admin bar, filter bar, full ID, and archive button are all correctly gated behind `adminToken()`. No admin-only moderation surface leaks to the public view.

---

## D. Trust / Confusion Risks (Ranked by Severity)

### D.1 — HIGH: Green "Public" status badge can read as "verified/approved"

`reviewStatusBadge(t)` renders a **green** `Public` badge for any truth with `review_state==='public'`. Green is the platform's success/positive colour (`--green`, used for "Proven", "Supported"). A normal user scanning the page sees a green badge and the page title "Truths" — the combination can read as *"this is a verified/approved fact"* even though a much smaller `not verified` badge sits beside it.

**Conflict:** the same card shows green "Public" AND grey 8px "not verified". The green is larger, brighter, and higher in the visual hierarchy than the honesty signal. This is the core trust risk on the page.

### D.2 — HIGH: `not verified` badge is 8px — too small to function as the primary honesty signal

`.truth-not-verified{font-size:8px}`. This is the single most important trust signal on a public page where users could mistake listing for endorsement — and it is rendered smaller than every other badge. The D-92C intent ("users could mistake public listing for endorsement") is undercut by making the counter-signal nearly invisible.

### D.3 — MEDIUM: Green "→ claim exists" chip reinforces false endorsement

`t.linkedClaimId` renders a green `→ claim exists` chip. To a normal user, green + "claim exists" can imply *"this has been substantiated / a case has been made for it"* when it only means a pressure-test claim was spun off (which itself proves nothing). Combined with D.1, the card can carry **two green badges** ("Public" + "→ claim exists") against one 8px grey honesty badge.

### D.4 — MEDIUM: Page title "Truths" overstates certainty for first-time users

The page is titled **Truths** with an `<h2>` heading. The qualifying badge ("widely asserted · not auto-verified") and intro paragraph are good, but the bare word "Truths" as the dominant heading does semantic work against the honesty framing. This is a known product-naming tension (the concept is "things asserted as true", not "true things"). The intro mitigates but does not neutralise it.

### D.5 — LOW: "does not prove this truth" convert note is 9px / opacity .6

`.truth-convert-note{font-size:9px;color:var(--muted);opacity:.6}`. The note correctly clarifies that pressure-testing does not prove the truth, but at 9px/60% opacity it is easy to miss. Lower severity than D.2 because the `title` attribute on the button repeats the message and the intro paragraph already covers it.

### D.6 — LOW: `? artefact` badge is public and may read as a quality judgement on sensitive beliefs

`isTruthArtifact` is purely structural (length, vowel ratio, repeated syllables, generic placeholder words). It will **not** fire on any of the sensitive social beliefs (see Section E) — all of them are well-formed sentences. So there is no censorship risk. The minor risk is cosmetic: the public `? artefact` badge uses a question mark that could read as "questionable content" rather than "looks like junk/test data". Acceptable as-is.

### D.7 — INFO (no action): Sensitive social beliefs are handled correctly

See Section E — verified safe.

---

## E. Sensitive / Social Belief Handling (verified safe)

For each example, I traced the structural helpers. None are content-based moderation; none endorse or censor.

| Belief | `isTruthArtifact` | `isTruthBorderlineArtefact` | `isTruthPersonalBelief` | Public badges shown |
|---|---|---|---|---|
| People are stupid | ❌ no | ❌ no (not all-caps, >5 words? 3 words, mixed case) | ❌ no | type + `not verified` |
| Money is evil | ❌ no | ❌ no | ❌ no | type + `not verified` |
| Trust the experts | ❌ no | ❌ no | ❌ no | type + `not verified` |
| Never trust the experts | ❌ no | ❌ no | ❌ no | type + `not verified` |
| Children should always obey adults | ❌ no | ❌ no | ❌ no | type + `not verified` |
| Science has proven it | ❌ no | ❌ no | ❌ no | type + `not verified` |
| My religion is the only true path | ❌ no | ❌ no | ❌ no | type + `not verified` |

**Conclusion:** All seven render identically — a neutral type badge plus the `not verified` honesty badge. No badge endorses (no green "verified"), and no badge censors or hides them. This is exactly the desired "socially real, recorded not endorsed" behaviour. The D-93E exact-equality category-echo guard ensures none are falsely flagged. **No change needed here** — the only adjacent risk is D.1/D.2 (the green "Public" badge applies to these too, so making "not verified" more prominent protects them as well).

---

## F. Existing Hardening Tests Protecting Public Clarity

From `scripts/hardening-smoke-test.mjs`:

**Section 34 (D-92C) — 8 tests:**
- `renderTruths` contains "Public means visible, not proven"
- `renderTruths` contains "not proven" or "Public means visible"
- `truthCard` contains "not verified" badge / class
- `truthCard` button says "Pressure-test as Claim"
- `isTruthPersonalBelief` helper exists
- `isTruthArtifact` helper exists
- `truthCard` includes `truth-id-line`
- No auto-hide of artefact truths (advisory only)

**D-92E/G:**
- `truthCard` calls `adminToken()` for admin-aware ID display
- `truthCard` does not call review APIs directly
- Archive button gated on `isAdmin && artifact`

**D-93B:**
- `truth-borderline-badge` referenced in `truthCard`
- Borderline badge is admin-only
- No archive button for borderline-only cards
- `truth-borderline-badge` CSS rule exists

**Coverage gap (no test today):**
- No test asserts the relative prominence of `not verified` vs the green "Public" badge
- No test asserts `not verified` font-size floor (8px is currently untested and could silently regress to 0)
- No test asserts the convert note wording survives

---

## G. Recommended D-97B Patch

### G.1 — Safe frontend-only (wording / CSS) — **RECOMMENDED**

| ID | Change | Risk | Rationale |
|---|---|---|---|
| W-1 | **Bump `.truth-not-verified` font-size** from 8px to match other badges (or at least ~10–11px) so the honesty signal is legible | Very low — CSS only | Directly addresses D.2; the primary honesty signal should not be the smallest text on the card |
| W-2 | **Soften the green "Public" status badge on the Truths page** — render the public-state badge in a neutral/muted colour (or relabel to "Listed" / "Visible") rather than success-green, OR suppress `reviewStatusBadge` green on truth cards since "not verified" already covers state | Low — display only | Addresses D.1 — green reads as endorsement; "visible" is not "verified" |
| W-3 | **Recolour or relabel `→ claim exists`** from green to neutral, e.g. "claim derived" in muted style | Very low — CSS/text | Addresses D.3 — removes the second false-positive green signal |
| W-4 | **Promote the convert note** slightly (e.g. 10px, opacity .75) OR leave as-is given `title` + intro redundancy | Very low — CSS | Addresses D.5; optional |

**Smallest meaningful patch:** W-1 + W-2 together. They neutralise the green-reads-as-verified problem and make the counter-signal legible — the two HIGH risks — with pure CSS/wording and no behavior change.

### G.2 — Needs backend / schema / API thought

| ID | Change | Why deferred |
|---|---|---|
| B-1 | Add an explicit per-truth "verification state" field distinct from `review_state` (so "public" never implies "verified") | Schema + Worker change; current model conflates visibility and state. Out of scope for a wording pass. |
| B-2 | Aggregate "claims derived / supported / disproven" rollup onto the truth card | Requires backend join + new response shape |

### G.3 — Do not build

| ID | Rejected change | Reason |
|---|---|---|
| X-1 | Content-based flagging of sensitive beliefs (religious/political) | Policy: socially real beliefs recorded not endorsed; no content moderation |
| X-2 | Hiding or auto-archiving any public truth based on a badge | Policy: artefact/borderline are advisory only; D-92C established no auto-hide |
| X-3 | Renaming the page away from "Truths" | Product-level naming decision, not a clarity patch; intro paragraph already mitigates |
| X-4 | Making `? artefact` more aggressive / public-shaming | Structural heuristic only; must stay advisory |

---

## H. Suggested Hardening Tests for D-97B

If W-1 / W-2 / W-3 are implemented:

| # | Test |
|---|---|
| 1 | `.truth-not-verified` CSS font-size is >= 10px (no longer 8px) — protects D.2 fix |
| 2 | `truthCard` still renders the `not verified` badge (regression guard on the signal itself) |
| 3 | Truth-page public status badge is NOT rendered with `b-green` success colour (asserts W-2 — neutral/muted instead) OR `reviewStatusBadge` green is suppressed for truth context |
| 4 | `→ claim exists` chip no longer uses `b-green` (asserts W-3) — or uses a neutral class |
| 5 | `renderTruths` intro still contains "Public means visible, not proven" (regression guard) |
| 6 | `truthCard` convert note still contains "does not prove this truth" (regression guard) |
| 7 | Sensitive-belief safety: `isTruthArtifact` returns false for "My religion is the only true path" and "Science has proven it" (content-neutrality guard) |
| 8 | Borderline badge remains admin-only after any badge restyle |

---

## I. Final D-97B Recommendation

**Implement G.1 W-1 + W-2 as the D-97B patch — a small, frontend-only wording/CSS pass.**

The two HIGH-severity risks are:
1. The green **"Public"** status badge reads as "verified/approved" to normal users (D.1).
2. The **"not verified"** honesty badge is 8px — the smallest text on the card, undercutting the very signal D-92C added (D.2).

Both are fixable with pure CSS/wording, zero behavior change, zero backend involvement, and they protect the sensitive-belief framing as a side effect (those cards carry the same green "Public" badge). Optionally fold in W-3 (recolour `→ claim exists`) since it is a one-line change that removes the second misleading green signal.

Defer the deeper "verification state" model (B-1) — it is the correct long-term fix but requires schema/Worker work outside a clarity pass. Build nothing from G.3.

---

## J. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated.
> No admin token was used; no Truth was archived, converted, or reviewed.

---

## K. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **286 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
