# D-92C — Truths Public Page Clarity

**Date:** 2026-06-08
**Branch:** `fix/d92c-truths-public-clarity`
**Scope:** Frontend-only (`public/app-v10.js`, `public/styles.css`)
**Static baseline after:** 212 / 24 / 39

---

## Problem

Live Truths page showed 20 public truths with no visual honesty signals:
- No "not verified" indicator — users could mistake public listing for endorsement
- No distinction between personal belief outputs and general truths
- Obvious test artefacts (keyboard mash, repeated syllable, single placeholder word) displayed identically to real entries
- Button text "Send to Claim Review" was ambiguous about what conversion does
- Truth IDs not visible on card face (required DevTools to retrieve)

---

## Changes Made

### `public/app-v10.js`

**`renderTruths` copy** — Description paragraph now leads with:
> **Public means visible, not proven.** Recording a truth here does not verify it. Use **Pressure-test as Claim** to submit one for evidence-based review.

**New helpers added (between `renderTruths` and `truthCard`):**

`isTruthPersonalBelief(t)` — returns true if:
- `t.truthType === 'personal-belief'`
- `t.origin` contains `'belief snapshot'` (case-insensitive)
- `t.statement` contains `'Belief Engine Profile'` (case-insensitive)

`isTruthArtifact(t)` — returns true if:
- Statement is fewer than 4 characters
- Statement matches single generic placeholder word (`statement`, `slogan`, `truth`, `claim`, `placeholder`, `test`, `demo`, `example`, `sample`, `label`, `title`)
- Letter-only consonant ratio > 88% (vowel ratio < 12%) — catches keyboard mash like `gfsdhdfhdfhdfhgdfa`
- Repeated syllable pattern `(.{2,5})\1{2,}` — catches `Blablabla`, `asdfasdfasdf`

**`truthCard` improvements:**
| Change | Detail |
|--------|--------|
| `not verified` badge | Always shown — `b-muted truth-not-verified` |
| `personal belief` badge | Shown when `isTruthPersonalBelief` fires — `b-muted truth-personal-badge` |
| `? artefact` badge | Shown when `isTruthArtifact` fires — `b-muted truth-artifact-badge` |
| `truth-card-artifact` class | Added to `<article>` when artifact — reduces opacity to 0.7 |
| ID line | `id: …last8chars` below meta — muted, 9px, `user-select:all` |
| Button text | Changed from "Send to Claim Review →" to "Pressure-test as Claim →" |
| Convert note | Added below button: "Creates a claim for review — does not prove this truth." |

**Artefact flag is advisory only.** No truths are hidden, filtered, or auto-removed. Cards remain visible at reduced opacity with a badge.

### `public/styles.css`

New rules added after `.truth-stat-pressure`:
```css
.b-muted{color:var(--muted);border-color:#273044;opacity:.75}
.truth-not-verified{font-size:8px}
.truth-personal-badge{color:#a066ff99;border-color:#a066ff33}
.truth-artifact-badge{color:#ff9a3c99;border-color:#ff9a3c33}
.truth-card-artifact{opacity:.7}
.truth-id-line{margin:3px 0 0;font-size:9px;color:var(--muted);opacity:.55;letter-spacing:.03em;user-select:all}
.truth-convert-note{margin:3px 0 0;font-size:9px;color:var(--muted);opacity:.6}
```

---

## Hardening Smoke Tests (Section 34 — 8 new tests)

| # | Test | Result |
|---|------|--------|
| 1 | `renderTruths` contains "Public means visible, not proven" | PASS |
| 2 | `renderTruths` contains "not proven" or "Public means visible" | PASS |
| 3 | `truthCard` contains "not verified" badge | PASS |
| 4 | `truthCard` button says "Pressure-test as Claim" | PASS |
| 5 | `isTruthPersonalBelief` helper exists | PASS |
| 6 | `isTruthArtifact` helper exists | PASS |
| 7 | `truthCard` includes `truth-id-line` | PASS |
| 8 | No auto-hide of artifact truths | PASS |

Total: 204 → **212 passed, 0 failed**

---

## What Was Not Changed

- **No Worker changes** — `t.id` was already available in frontend data (confirmed: used by existing `convertTruth` function)
- **No D1 changes**
- **No moderation actions**
- **No live calls**
- Artefact flag does NOT hide or delete entries

---

## Observed Truths Addressed

| Category | Examples | Signal Added |
|----------|----------|--------------|
| Artefacts | `gfsdhdfhdfhdfhgdfa`, `Blablabla`, `Statement`, `Slogan` | `? artefact` badge + reduced opacity |
| Personal belief output | `Belief Engine Profile — Stoic Atheism` | `personal belief` badge |
| All truths | All 20 public entries | `not verified` badge |

---

## Next Steps (deferred)

- **D-92D** — Scoped backend cleanup of confirmed T6 artefacts (requires exact IDs from browser inventory)
- **D-91D3** — Extend `reviewCleanup` to support `pressure` and `evidence` target types
