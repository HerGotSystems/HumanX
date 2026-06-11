# D-103B — Evidence Quality & Source Clarity Pass

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 328 / 24 / 39 → **340 / 24 / 39**
**Audit basis:** D-103A evidence quality / source display audit

---

## What Changed

### 1. Quality display-label map (W-2)

New helper `evidenceQualityLabel(q)` maps stored quality slugs to clearer display text — **display only, stored data unchanged**:

| Stored value | Displayed |
|---|---|
| `repeatable` | repeatable |
| `documented` | documented |
| `media` | media |
| `testimony` | testimony |
| `vibes` | **weak argument** |
| unknown | the normalised value as-is (safe fallback) |

`evidenceMeta` now routes `e.quality` through this map, so the weakest tier reads as "weak argument" instead of the neutral-sounding "vibes".

### 2. Tiered quality styling (W-1)

New helper `evidenceQualityClass(q)` returns a tier class applied to the evidence meta pill:

| Tier | Quality values | Class | Colour |
|---|---|---|---|
| strong | repeatable, documented | `ev-q-strong` | green |
| mid | media, testimony | `ev-q-mid` | blue, slightly muted |
| weak | vibes | `ev-q-weak` | caution-yellow |
| neutral | unknown / unspecified | `ev-q-neutral` | muted |

```css
.pill.ev-q-strong{color:var(--green)}
.pill.ev-q-mid{color:var(--blue);opacity:.85}
.pill.ev-q-weak{color:var(--yellow);opacity:.95}
.pill.ev-q-neutral{color:var(--muted)}
```

Both evidence-meta pill sites (`evidenceItem` head + `reusedItemCompact`) apply the class. Weak evidence is now visually distinct from documented/repeatable support at a glance — closing the D-103A HIGH finding. **No tier is called "verified" or "trusted".**

### 3. Missing-source indicator (W-3)

`sourceLink(url)` previously returned `''` when no URL was present (silent). It now returns a muted indicator:

```js
if(!url)return`<p class="small ev-no-source">no source provided</p>`;
```

```css
.ev-no-source{color:var(--muted);opacity:.6;font-style:italic;margin:2px 0 0}
```

Applies in all three evidence contexts that call `sourceLink` (vault evidence card, study evidence row, reused compact row) — missing citations are now visible rather than hidden, without penalising or filtering the evidence.

### 4. Direct vs reused — preserved

No change to the reused grouping/collapse logic (`reusedEvidenceHtml`, `reusedItemCompact`, "Reused from vault" sub-head, `.ev-row-reused` tint). Reused compact rows already route quality through `evidenceMeta` and source through `sourceLink`, so they automatically pick up the new label, tier class, and no-source indicator — no overbuild needed.

---

## Why Weak Evidence Needed Visual Distinction

Per D-103A finding E.1 (HIGH): every quality tier previously rendered in the identical uniform `.pill` (8px uppercase blue). A "vibes" weak-argument item was visually indistinguishable from a "documented" source — only the word differed. That gave weak anecdotal evidence the same visual authority as a documented source, undercutting the honest verdict/score framing built in D-93→D-101. Tiered colour styling lets a reader gauge support strength at a glance.

## How Missing Source Is Now Displayed

Previously an evidence item with no source URL showed nothing where a citation would appear — a missing source was invisible (D-103A E.2). Now a muted, italic "no source provided" appears in that slot, so the absence of a citation is honestly surfaced rather than hidden. It is display-only: the evidence is not blocked, down-ranked, or filtered.

---

## What Was NOT Changed

| Preserved | Confirmation |
|---|---|
| Evidence score calculation | untouched — `meter()` value/clamp unchanged |
| Verdict calculation | untouched — `cls()` mapping unchanged |
| Source verification claims | none added — no "verified"/"trusted" wording |
| API payloads / backend routes | untouched |
| D1 schema / data / stored quality values | untouched — labels are display-only |
| Moderation / review actions | untouched |
| Evidence hiding / filtering | none — weakness/absence is shown, never hidden |
| Direct vs reused distinction | preserved |

---

## Hardening Tests Added (Section 45 — 12 new tests, 328 → 340)

| # | Test |
|---|---|
| 45.1 | `evidenceQualityLabel` maps `vibes` → "weak argument" |
| 45.2 | `evidenceQualityClass` tier logic defined |
| 45.3 | Tier classes cover strong/mid/weak/neutral |
| 45.4 | Evidence pill applies the quality tier class (≥2 sites) |
| 45.5 | Missing source renders "no source provided" |
| 45.6 | Source link still renders an anchor when source exists |
| 45.7 | No "verified source" / "trusted source" wording added |
| 45.8 | Evidence score / verdict calculation not touched (`cls` + `meter` intact) |
| 45.9 | Reused evidence rendering still exists |
| 45.10 | D-100B Study verdict/score qualifier remains present |
| 45.11 | Quality tier + no-source CSS rules defined |
| 45.12 | No backend/D1/wrangler/deploy references added in quality helpers |

---

## Safety Confirmation

| Check | Status |
|---|---|
| No score logic changes | ✅ |
| No verdict logic changes | ✅ |
| No source verification claim added | ✅ — no "verified"/"trusted" |
| No backend/schema/API/data changes | ✅ — display text/CSS only; stored quality untouched |
| No moderation/admin actions | ✅ |
| No deploy/D1/live mutation | ✅ |
| Evidence never hidden/filtered | ✅ — weakness/absence shown, not penalised |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 328 passed, 0 failed | **340 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |
