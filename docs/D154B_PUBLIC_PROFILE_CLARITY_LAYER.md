# D-154B — Public Profile Clarity Layer

**Date:** 2026-06-24
**Scope:** Frontend only (`public/app-v10.js`). No backend changes. No migration. No `wrangler.toml`. No admin-route changes. No owner-token work.

---

## What Changed

### 1. HumanX context block (F-1, F-2)

Added `pp-context-block` panel after the profile header in `renderPublicProfileHtml`. Contains:
- One introductory sentence explaining what HumanX is and what the page represents.
- Vocabulary guide row: "Claims being tested", "Public truths", "Evidence quality", "Questions under pressure" — each with a plain-English gloss.
- The required D-140C disclaimer relocated here (previously in the header card).

A first-time share-link visitor now has an anchor within the first visible block.

### 2. Visitor-friendly section labels (F-2)

Section `<h3>` headers updated:

| Before | After |
|---|---|
| Recent Public Claims | Claims being tested |
| Recent Public Truths | Public truths |
| Recent Public Evidence | Supporting evidence |
| Recent Public Pressure | Questions under pressure |

Labels match the vocabulary row in the context block for consistency.

### 3. Card reorder — snapshot before counts (F-3)

`renderPublicProfileHtml` render order changed from:
> header → counts → snapshot → content sections

To:
> header → context block → snapshot → counts → content sections

The belief snapshot (most personal element) now appears before the summary count badges. Visitors see the distinctive snapshot first.

### 4. Snapshot disclaimer consolidated (F-6)

`renderPublicProfileSnapshotHtml` had two separate `<p class="pp-disclaimer">` paragraphs that said the same thing in slightly different words. Merged into one `<p>` retaining both required phrases from D-142C:
- "A snapshot this person chose to share — pattern observations from their own self-submitted answers, not a diagnosis or personality test."
- "One snapshot, shared by choice — not their complete profile."

Two sentences, one element. Existing D-142C wording preserved verbatim.

### 5. "View in HumanX →" CTA (F-4)

`renderPublicProfileClaimsHtml`: button label changed from `Open Study →` to `View in HumanX →`. Makes clear the action navigates into HumanX rather than opening a generic "study" with no context. The owner's Me view (`meRecentClaimsHtml`) retains `Open Study →` — that is an authenticated, in-app label where the context is clear.

### 6. Pressure severity human-readable label (F-9)

New `pressureSeverityLabel(s)` function maps integer severity to readable strings:
- 1 → `low pressure`
- 2 → `moderate pressure`
- 3 → `notable pressure`
- 4 → `high pressure`
- 5 → `critical pressure`

`renderPublicProfilePressureHtml` now calls this instead of rendering `severity ${n}`.

### 7. Evidence quality label — `peer_reviewed` mapped (F-7)

`evidenceQualityLabel` map extended: `peer_reviewed` → `'peer-reviewed'`. Previously the raw DB enum value would fall through as-is.

### 8. Visitor copy-profile-link CTA (F-8)

`copyPublicProfileLink(slug)` added. Uses `navigator.clipboard.writeText()` with `document.execCommand('copy')` fallback for older browsers. No tracking, no auth, no backend call. Button appears in the action row only when `!isOwner` — the owner already has a copy-link button in Profile Settings.

---

## Privacy Boundary Confirmation

No API or backend change was made. All privacy properties established in D-154A remain unchanged:

- No `is_admin`, `email`, `owner_token`, `user.id`, `evidence.body`, `pressure_points.body`, or `is_shadow_banned` exposed
- No new API field added
- No admin route modified
- `/api/u/:slug` remains a public route with no `requireAdmin` guard
- Owner-token enforcement not resumed

The changes are presentation-only: copy, label text, element order, and one new helper function.

---

## Before / After Visitor Experience

**Before:** A visitor arriving via a share link saw "Public Profile" as a heading, then a name, then a row of badge counts (`Claims N · Truths N · Evidence N · Pressure N`), then optionally a snapshot card (buried after counts), then a list of claim text rows labelled "Recent Public Claims" with an `Open Study →` button of unclear destination. No explanation of what HumanX is or what any of the terminology means.

**After:** A visitor sees:
1. Name and bio (same as before)
2. Context block: one sentence explaining HumanX, plus a vocabulary guide for every term on the page
3. Belief snapshot (if shared) — now promoted above the counts
4. Summary counts (demoted)
5. Content sections with plain-English h3 labels ("Claims being tested" etc.)
6. "View in HumanX →" button with clear destination label
7. "Copy profile link" button visible to visitors

---

## Tests / Baseline

Section 87 added to `scripts/hardening-smoke-test.mjs` (16 new tests):
- Context block copy exists
- All four visitor-friendly section labels exist
- "View in HumanX →" present; "Open Study →" absent from public-profile claims function
- Snapshot disclaimers consolidated to exactly 1 `pp-disclaimer` element
- `pressureSeverityLabel` present; raw `severity ${` pattern absent
- `evidenceQualityLabel` maps `peer_reviewed`
- `copyPublicProfileLink` present with clipboard + fallback
- `isOwner` check and "← Back to Me" preserved
- `requireAdmin` call count ≥ 11 (no admin route changed)
- `/api/u/:slug` has no `requireAdmin` in its handler
- No owner-token enforcement resumed
- No sensitive fields in public-profile render functions

Prior tests updated to reflect D-154B changes:
- D-140C disclaimer window widened (disclaimer moved to context block)
- D-141B header window widened (context block const precedes return string)
- D-141B counts and section windows widened
- D-142B placement test updated (snapshot now before counts per D-154B reorder)
- D-142C snapshot disclaimer tests updated to reflect single-element consolidation

```
node scripts/hardening-smoke-test.mjs       → 1073 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## Recommended Next Patch

**D-155A or D-154C** — Deploy and live-verify D-154B:
1. `node scripts/bump-deploy-meta.mjs D-154B 1073/24/57`
2. Run local checks
3. Commit and `npx wrangler deploy`
4. `node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-154B <commit> 1073/24/57`
5. Visit `https://humanx.rinkimirikata.com/u/calenhir` and confirm context block and snapshot ordering visible

After live verification, consider whether F-5 (bio-less thin header) warrants a follow-up presentation patch.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. No owner-token enforcement, soft warnings, or sampling changes in this patch.
