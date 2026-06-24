# D-158B — Public Profile Snapshot-First Hierarchy

**Date:** 2026-06-24
**Scope:** Frontend only (`public/app-v10.js`, `public/styles.css`). No backend changes. No migration. No `wrangler.toml`. No admin-route changes. No owner-token work.

---

## What Changed

### 1. Card order — snapshot promoted before context block

**Before (D-154B order):**
Header → Context block → Snapshot → Counts → Claims → Truths → Evidence → Pressure

**After (D-158B order):**
Header → Snapshot → Context block → Claims → Truths → Counts → Evidence → Pressure

**Why:** The Shared Belief Snapshot is the strongest first-impression hook — it has personality, pattern labels, and meter scores that are genuinely interesting to a stranger. Placing it before three paragraphs of meta-explanation means a visitor reaches actual signal within the first scroll. The context block now functions as "what is all this I just saw?" which is more useful after seeing the snapshot.

Counts moved after Truths: they are social-proof context, not a hook. A count of "5 claims" means nothing before the visitor has read any of them.

### 2. Empty secondary sections suppressed

Three render functions now return `''` for empty input:
- `renderPublicProfileTruthsHtml(rows)` — was "No public truths yet."
- `renderPublicProfileEvidenceHtml(rows)` — was "No public supporting evidence yet."
- `renderPublicProfilePressureHtml(rows)` — was "No public questions under pressure yet."

The corresponding section wrappers in `renderPublicProfileHtml` are now conditional:
```
${truthsHtml ? `<div class="panel pp-section"><h3>Public truths</h3>${truthsHtml}</div>` : ''}
${evidenceHtml ? `<div class="panel pp-section"><h3>Supporting evidence</h3>${evidenceHtml}</div>` : ''}
${pressureHtml ? `<div class="panel pp-section"><h3>Questions under pressure</h3>${pressureHtml}</div>` : ''}
```

**Why:** Empty section headers ("No public X yet.") add clutter without adding information. The claims section retains its empty state ("No public claims yet.") because the absence of claims is specifically informative — this person has not yet shared a public belief position.

### 3. Bio fallback from snapshot

When `p.bio` is absent but a snapshot exists, a generated fallback line is shown in the header card instead of rendering only the display name and slug:

```
Belief pattern: [dominantPattern] · Top alignment: [topAlignmentName]
```

Built from `sn.dominantPattern` and `sn.topAlignmentName` — both already rendered in the snapshot card, already public. The fallback is omitted entirely if neither field is present on the snapshot.

CSS: `.pp-bio-fallback { color:var(--muted); font-style:italic }` — muted italic distinguishes it visually from a real bio.

**Why:** Without a bio, the header shows only a name and a slug, which communicates nothing about the person's intellectual agenda. The fallback gives a visitor one factual line about what this person is tracking, before they scroll.

**Note:** The fallback reads `sn.dominantPattern` and `sn.topAlignmentName`, which are already exposed in the snapshot card. No new fields are introduced.

### 4. D-154B/D-155A/D-156A/D-157A features all preserved

Confirmed:
- HumanX context block with full vocab guide ✓
- "Claims being tested", "Public truths", "Questions under pressure" labels ✓
- "View in HumanX →" CTA ✓
- `const BATCH=5` (first-5 default for evidence/pressure) ✓
- `aria-expanded="false"` / `aria-controls` on show-more toggles ✓
- `'Copied!'` feedback on copy-link button ✓
- `pp-footer-actions` mobile stacking ✓
- `min-width:0; overflow-wrap:anywhere` text wrapping ✓

---

## Privacy Boundary Confirmation

- No API change. No new fields rendered.
- Bio fallback uses `sn.dominantPattern` and `sn.topAlignmentName` — already rendered in the snapshot card.
- No `email`, `is_admin`, `owner_token`, `evidence.body`, `pressure_points.body`, or debug metadata referenced.
- Section suppression is frontend-only; the API payload is unchanged.

---

## Baseline

New section 91 added (18 tests). Updated D-141B, D-142B, and D-155A locked tests to reflect D-158B superseding earlier positional and empty-state decisions.

```
node scripts/hardening-smoke-test.mjs       → 1138 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

---

## Recommended Next Step

**D-158C** — Bump deploy metadata for D-158B and live-verify. Owner checks `https://humanx.rinkimirikata.com/u/calenhir` for: snapshot appearing before context block, empty sections absent, bio fallback visible if bio is unset.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.
