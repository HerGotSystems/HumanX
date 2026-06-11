# D-103A — Evidence Quality / Source Display Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 328 / belief-engine-static-check 24 / worker-route-static-check 39

Closes the deferred D-100A finding E.1: *can a reader tell strong evidence from weak "vibes" evidence at a glance?*

---

## A. Files Inspected

| File | Sections read |
|---|---|
| `public/app-v10.js` | `sectionEvidence`, `evidenceItem`, `evidenceMeta`, `evidenceBodyHtml`, `sourceLink`, `reusedItemCompact`, `reusedEvidenceHtml`, `sectionArgumentFlow`, `renderStudy`, `parseAnalysis`, `shortText` |
| `public/index.html` | evidence submission form — `eQuality` / `eKind` / `eSource` options |
| `public/styles.css` | `.pill`, `.ev-row-reused`, `.reused-item-compact`, `.inv-item-title`, `.ev-body-text`, `.source`, `.study-sub-reused`, `.ev-json-chip` |
| `scripts/hardening-smoke-test.mjs` | evidence-rendering test coverage |
| `docs/D-100A`, `D100B`, `D102A`, `README.md` | prior audit + state |

---

## B. Evidence Display Flow Map

```
renderStudy → sectionEvidence()
  head: "Support Evidence" + count badge + "What currently supports this claim."
  empty: "No supporting evidence yet… add a source / reuse a vault item" ✅
  split:
    analyses = items whose body parses as stored AI/AIP analysis
    direct   = non-analysis, link_type !== 'reused'
    reused   = non-analysis, link_type === 'reused'
  render order:
    if no groups → all via evidenceItem (or reusedEvidenceHtml if all reused)
    else → analyses, then "Direct evidence" sub-head + direct, then reusedEvidenceHtml(reused)

evidenceItem(e):
  analysis branch → analysis-card: title + verdict badge cls() + "legacy" pill + meters + summary + <details>
  normal branch  → <div class="row [ev-row-reused?]">
       head: <b>title</b> + <span class="pill">evidenceMeta(e)</span>
       body: evidenceBodyHtml (JSON-aware) 
       reuse note (if link_note)
       sourceLink(source_url)

evidenceMeta(e):  parts = [reused?, quality?, stance].filter → joined " · "
   e.g. "reused · documented · support"  OR  "vibes · support"

reusedEvidenceHtml(reused):
  ≤3 → "Reused from vault" sub-head + reusedItemCompact rows
  ≥4 → grouped by source claim, collapsible <details>
  reusedItemCompact: title + pill(evidenceMeta) + reuse note + sourceLink

sourceLink(url): url ? <a> full URL </a> : ''   ← nothing when no URL

evidenceBodyHtml: JSON-looking → "AI / JSON output" chip + collapse; else plain text
```

---

## C. Evidence Quality / Source Terminology Map

| Field | Source | Displayed as | Visible? |
|---|---|---|---|
| **quality** | `e.quality` (submit `eQuality`) | raw lowercase word inside `.pill` (`documented`, `vibes`…) | 🟡 present but no visual weight |
| Quality tiers | submit form `eQuality` | repeatable / documented / media / testimony / vibes | submit labels are richer than displayed value |
| **stance** | `e.linked_stance \| e.stance` | text in pill (`support`) | 🟡 redundant in Support section |
| **reused flag** | `e.link_type==='reused'` | "reused" in pill + `.ev-row-reused` tint + "Reused from vault" sub-head | ✅ well-distinguished |
| **source / URL** | `e.source_url \| e.sourceUrl` | full URL link via `sourceLink` | ✅ when present; ✗ **silent when absent** |
| **body / quote** | `e.body \| e.note` | `evidenceBodyHtml` (JSON-aware preview/collapse) | ✅ |
| **reuse note** | `e.link_note` | "Reuse note: …" | ✅ |
| **owner / user-submitted** | — | not shown on the public evidence row | (handle shown at claim level only) |
| **AI/JSON output** | `looksLikeJson(body)` | "AI / JSON output" chip + collapse | ✅ |

### Quality submit-label vs displayed-value gap

| Submit form label (`eQuality`) | Stored value | Displayed pill |
|---|---|---|
| Repeatable / raw data | `repeatable` | "repeatable" |
| Documented source | `documented` | "documented" |
| Photo / video / screenshot | `media` | "media" |
| Testimony | `testimony` | "testimony" |
| **Vibes / weak argument** | `vibes` | **"vibes"** |

The richer, more informative submit labels ("weak argument", "raw data") are lost on display — the pill shows the bare slug.

---

## D. Direct vs Reused Evidence Distinction

**Well-handled.** ✅

| Signal | Direct | Reused |
|---|---|---|
| Container | `.row` | `.row.ev-row-reused` (blue left-border + tint) or `.reused-item-compact` |
| Section grouping | under "Direct evidence" sub-head (when groups exist) | under italic "Reused from vault" sub-head |
| Meta pill | no "reused" token | leads with "reused" token |
| Many items (≥4) | inline | collapsed `<details>`, grouped by source claim |

A reader can clearly tell reused-from-another-claim evidence from direct evidence. No action needed here.

---

## E. Trust / Confusion Risks (Ranked by Severity)

### E.1 — HIGH: Evidence quality has no visual weight — weak looks identical to strong

Every quality tier renders in the **same uniform `.pill`** (`font-size:8px; text-transform:uppercase; color:var(--blue)`). A **"vibes"** (weak argument) item and a **"documented"** source are visually identical — only the word inside the pill differs, in tiny 8px uppercase blue. A user scanning the Support Evidence section cannot distinguish strong from weak support at a glance. This is exactly the deferred D-100A E.1 risk and the reason for this audit.

**Effect:** weak anecdotal evidence carries the same visual authority as a documented source — the opposite of the trust posture the D-93→D-101 run established for verdicts/scores.

### E.2 — MEDIUM: Missing source is silent

`sourceLink(url)` returns `''` when no URL is present. An evidence item with no citation shows **nothing** indicating the absence — no "no source provided" marker. Combined with E.1, an unsourced "vibes" claim looks as complete as a documented, linked source. This risks *hiding missing source data* (explicitly a thing to avoid per the task).

### E.3 — MEDIUM: Displayed quality value is the bare slug, not the informative label

The pill shows "vibes" / "repeatable" rather than the submission form's clearer "weak argument" / "raw data". The most trust-relevant tier ("Vibes / weak argument") is shown as the mildest possible word, "vibes", which reads as neutral/quirky rather than "weak". Users unfamiliar with the internal vocabulary get the least information exactly where it matters most.

### E.4 — LOW: stance "support" is redundant in the Support section

`evidenceMeta` appends `stance` ("support") to every item in the Support Evidence section, where everything is by definition support. Minor noise; harmless.

### E.5 — INFO: No implication that HumanX verified sources

Good — the UI never claims source reliability was independently checked. Source URLs are shown as user-submitted links with no verification badge. ✅ No action; preserve this.

---

## F. Evidence-Quality Visibility Risks (Ranked)

| Rank | Risk | Detail |
|---|---|---|
| 🔴 HIGH | Quality tier not visually ranked | E.1 — uniform pill; no colour/ordering/icon separating strong (repeatable/documented) from weak (testimony/vibes) |
| 🟡 MEDIUM | Weak tier under-labelled | E.3 — "vibes" displayed instead of "weak argument" |
| 🟡 MEDIUM | Absent source invisible | E.2 — no "no source" cue |
| 🟢 LOW | Quality absent → pill omits it silently | if `e.quality` empty, pill just shows stance; no "unspecified quality" cue |
| 🟢 LOW | stance redundancy | E.4 |
| ✅ GOOD | direct vs reused | clearly distinguished (Section D) |
| ✅ GOOD | AI/JSON body | flagged + collapsed |
| ✅ GOOD | empty state | instructive |

---

## G. Recommended D-103B Patch

### G.1 — Safe frontend-only (display / CSS) — **RECOMMENDED**

| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | **Give the quality pill visual weight by tier.** Map quality→class: strong (`repeatable`, `documented`) neutral/cool; mid (`media`, `testimony`) muted; weak (`vibes`) amber/muted "weak" styling. CSS-only colour differentiation on a `.ev-quality-{tier}` class. | Low — display only | E.1 (HIGH), F |
| W-2 | **Map the displayed quality value to a clearer label** — e.g. `vibes`→"weak argument", `repeatable`→"raw data", via a small lookup in `evidenceMeta` (display text only; stored value unchanged). | Low — text map | E.3 |
| W-3 | **Show a muted "no source" indicator** when an evidence item has no `source_url` (e.g. a small muted "no source link" tag), so missing citations are visible rather than silent. | Low — one conditional | E.2 |
| W-4 | **(Optional) drop redundant "support" stance** in the Support Evidence section (keep stance only where it adds information, e.g. mixed contexts). | Very low | E.4 |

**Smallest meaningful patch:** W-1 + W-3. W-1 makes weak vs strong legible at a glance (the HIGH gap); W-3 stops missing sources from hiding. W-2 is a cheap, high-value add. All are display-only — no score, schema, or data change.

### G.2 — Needs backend / schema / API thought
| ID | Change | Why deferred |
|---|---|---|
| BE-1 | A computed per-evidence "strength" derived from quality + source presence + corroboration | Requires backend aggregation/scoring rules |
| BE-2 | Source-domain reliability hints (e.g. flag known-unreliable domains) | Requires a maintained source-reliability dataset; also risks implying HumanX "verifies" sources — handle cautiously |

### G.3 — Admin / manual operations only
| ID | Item |
|---|---|
| OPS-1 | None — this is a public-display clarity pass |

### G.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Numeric per-evidence reliability score | Implies HumanX independently verified the source (E.5); overclaim |
| DN-2 | Auto-hide or down-rank weak evidence | No auto-hide policy; weakness should be *shown*, not hidden |
| DN-3 | Content-based judgement of evidence text | Neutrality policy |
| DN-4 | Verification badge on source URLs | Would imply HumanX checked the source |

---

## H. Suggested Hardening Tests for D-103B

| # | Test |
|---|---|
| 1 | `evidenceMeta` (or evidence row) emits a quality-tier class (asserts W-1) — e.g. `ev-quality-` present |
| 2 | CSS defines differentiated quality-tier styling (weak tier visually distinct from strong) |
| 3 | Weak tier displays a clearer label than the bare slug — "weak" wording present for `vibes` (asserts W-2) |
| 4 | Evidence row shows a "no source" indicator when `source_url` is absent (asserts W-3) |
| 5 | Regression: `sectionEvidence` keeps its empty state ("No supporting evidence yet") |
| 6 | Regression: direct-vs-reused distinction preserved (`ev-row-reused` + "Reused from vault") |
| 7 | Regression: no verification/"verified source" wording added (preserve E.5 neutrality) |
| 8 | No backend/D1/wrangler/deploy references added in the changed display helpers |

Tests 5–7 are pure regression locks and can land regardless.

---

## I. Final D-103B Recommendation

**Implement G.1 W-1 + W-3 (+ cheap W-2) as a small frontend-only evidence-display clarity pass, with hardening tests H.1–H.7.**

Rationale:
- **E.1 is the last remaining HIGH-severity trust gap in the public journey:** the D-93→D-101 run made *verdicts and scores* honest, but the evidence layer that drives them still renders weak "vibes" anecdote identically to a documented source. W-1 (tiered quality styling) closes it with CSS + a class — no scoring or data change.
- **E.2/W-3** stops missing citations from being invisible — a small but real "don't hide weak/missing data" fix.
- **E.3/W-2** is a one-line label map that makes the weakest tier read as weak ("weak argument") instead of neutral ("vibes").
- The direct-vs-reused distinction, AI/JSON flagging, and empty states are already strong — so D-103B is a *light* pass focused on quality legibility, not a redesign.
- Explicitly **do not** add numeric reliability scores, source verification badges, or auto-hiding (G.4) — those would imply HumanX verifies sources, violating the neutrality the platform has carefully maintained.

This completes the evidence layer of the trust arc: verdict (D-100) → scores (D-100) → **the evidence behind them (D-103)**.

---

## J. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated. No admin token was used.

---

## K. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **328 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
