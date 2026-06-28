# D-202B — RunPack Authority-Laundering Audit

**Date:** 2026-06-28
**HEAD at creation:** `64c2823`
**Baseline:** 1628/24/57
**Scope:** Audit and spec only — no code changes in this patch
**Prerequisite reading:** `D202A_HUMANX_EPISTEMOLOGY_MODEL.md` Section H ("RunPack authority laundering")

---

## Summary

The current RunPack / AI analysis flow has five specific surfaces where AI output can be presented in ways that look like independent verification. The most dangerous is a single word in the `output_contract`: **"Proven"**. The second most dangerous is the absence of any AI-output provenance label in the saved analysis card. Both are fixable in one focused patch (D-202C).

No catastrophic authority-laundering infrastructure exists. The risks are labelling gaps and one vocabulary choice, not architectural failures.

---

## A. Current RunPack / AI Flow

```
1. User builds a RunPack via POST /api/runpack (or /api/aip)
         │
         ▼
2. buildRunPack() assembles:
   - provenance block (packet_id, generated_at, source_claim_id,
     evidence_count, pressure_count, test_count, snapshot_hash)
   - instruction: "Analyse this claim using only the provided packet..."
   - output_contract: { verdict, evidence_score, testability,
     survivability, strongest_support, strongest_pressure,
     missing_tests, plain_language_summary }
   - payload: claim detail (evidence, pressure, tests, analyses)
         │
         ▼
3. Packet returned to frontend; user copies it manually
         │
         ▼
4. User pastes into an external AI (ChatGPT, Claude, etc.)
         │
         ▼
5. AI produces a JSON response matching output_contract shape
         │
         ▼
6. User pastes AI JSON into HumanX (two UI surfaces):
   a. Study view "Analysis" section textarea (sectionAnalyses)
   b. RunPack panel "Load AI Analysis Return" section (rp-return-section)
         │
         ▼
7. POST /api/analysis → addAnalysisResult() stores in analysis_results
   Stored fields: id, claim_id, user_id, source (default 'runpack-user'),
   verdict, evidence_score, testability, survivability,
   strongest_support_json, strongest_pressure_json, missing_tests_json,
   plain_language_summary, raw_json, created_at
   No review_state. No AI model field. No packet_id foreign key.
         │
         ▼
8. analysisItem() renders in Study view with:
   - Verdict badge (green if 'Proven' or 'Supported', blue if 'Plausible')
   - Source pill (value of 'source' field, default 'runpack-user')
   - Evidence / Testability / Survivability meter bars
   - Plain language summary
   - Support / Pressure / Missing tests expandable section
```

---

## B. The Authority-Laundering Failure Mode

The loop that creates the risk:

```
User submits claim text
        │
        ▼
User attaches evidence (personal testimony, scripture, news article)
        │
        ▼
RunPack built — packages all of this as structured data
        │
        ▼
AI receives packet, analyses it using the user's own inputs as its source
        │
        ▼
AI returns verdict: "Proven" (or "Strongly Supported")
        │
        ▼
User saves analysis to HumanX
        │
        ▼
Green "Proven" badge appears on Study view with no attribution note
        │
        ▼
User screenshots or shares the Study view
        │
        ▼
Third party sees "Proven" on a HumanX page and interprets it as
external validation — not as "an AI read back the user's own evidence"
```

The critical failure point: the AI never had independent information. It read what the user submitted, evaluated it on its own reasoning, and returned a label. The label looks authoritative. The loop is invisible to a third party reading the result.

A secondary failure mode: the user cites "the AI analysis" as supporting evidence for the same claim. This is circular — the evidence drives the AI output, and the AI output drives the evidence score. HumanX currently has no guard against this.

---

## C. Surfaces at Risk

### C.1 — `output_contract` verdict vocabulary (`src/worker.js:900`)

**Current:**
```js
verdict: 'Proven | Strongly Supported | Plausible | Untestable | Weak Evidence | Disproven | Reality Collapse'
```

**Risk: HIGH**

The word **"Proven"** is the single most dangerous element in the current system. When an AI returns `verdict: "Proven"`, `analysisItem()` renders a green badge with the text "Proven" on the Study view. There is no qualification. There is no note that the AI produced this verdict by reading user-submitted inputs.

"Proven" implies a standard of verification that neither the AI nor HumanX can meet. The AI has no access to physical reality. It evaluated coherence, source type, and reasoning quality within the packet — all of which were assembled from user submissions.

The other strong label, "Disproven", carries the same risk in the opposite direction. "Reality Collapse" is dramatic enough that it implies the system has made a determination, not that an AI parsed a text packet.

**Recommended fix:** Replace "Proven" with "Well-Supported" or "Strongly Supported". Replace "Disproven" with "Well-Challenged" or "Strongly Contested". Replace "Reality Collapse" with "Internally Contradictory" or "Collapses Under Pressure". See Section E for the D-202C spec.

---

### C.2 — `analysisItem()` render — no provenance label (`public/app-v10.js`)

**Current render:**
```js
<div class="analysis-result-card">
  <div class="inv-item-head">
    <span class="badge ${cls(verdict)}">${esc(verdict)}</span>
    <span class="pill">${esc(src)}</span>   <!-- src = 'runpack-user' by default -->
  </div>
  <div class="meters">…</div>
  <p class="small">${esc(summary)}</p>
  <details class="analysis-details">…</details>
</div>
```

**Risk: HIGH**

The card has no text identifying it as AI output. The source pill says `'runpack-user'` by default, which is meaningless to a reader. There is no statement that the AI analysed a packet built from this claim's own evidence — not from independent sources.

A user sharing a screenshot of this card would show: a green "Proven" badge, three meter bars, and a paragraph of AI-generated reasoning. Nothing in the card's visual hierarchy says "this is what an AI said after reading the evidence you submitted."

**Recommended fix:** Add a visible provenance line — "AI analysis of submitted evidence packet — not independent verification." See Section E.

---

### C.3 — Two analysis paste surfaces with no consistency

**Surface A:** Study view "Analysis" section (`sectionAnalyses()`)
- Copy: "Click **Build RunPack** in the claim header → paste into any AI → paste the JSON result here to save it."
- This is accurate but brief. It does not say the AI received user-submitted inputs.

**Surface B:** RunPack panel "Load AI Analysis Return" (`rp-return-section`)
- Copy: "Paste the JSON result from your AI here to save it as a structured analysis for this claim."
- Shorter and gives less context. "From your AI" implies it is the user's private analysis tool. But the result lands in the same shared study view as if it were public analysis.

**Risk: MEDIUM**

Neither surface warns that the AI output reflects what was submitted, not what is true. Both surfaces treat the paste step as a technical operation (move JSON from A to B) rather than an interpretive one (this is AI commentary on your evidence, not an external check).

---

### C.4 — `source` field has no AI-model or packet-version provenance

**In `analysis_results` table:**
```
source TEXT  -- stored from body.source || 'runpack-user'
```

**In `addAnalysisResult()`:**
```js
cleanText(body.source || 'runpack-user', 40)
```

**Risk: MEDIUM**

There is no stored reference to:
- Which AI model produced the output
- Which packet version was used (`runpack_version`, `packet_id`, `source_snapshot_hash`)
- Whether the packet and the analysis refer to the same state of the evidence

If a claim's evidence changes significantly after an analysis is saved, the analysis card continues to display. It refers to a prior evidence state with no indication that the claim has been updated since.

There is also no foreign key from `analysis_results` to `aip_packets`. The analysis and the packet that produced it are unlinked records. A future audit cannot trace back which packet a given analysis came from.

**Recommended fix (long-term):** Add `packet_id` and `ai_model` fields to `analysis_results`. See Section F.

---

### C.5 — `analysisItem()` verdict CSS class maps "Proven" to green (`b-green`)

**In `cls()` function:**
```js
function cls(s) {
  if (s === 'Proven' || String(s).includes('Supported') || String(s).includes('rising'))
    return 'b-green';
  if (String(s).includes('Disproven') || String(s).includes('Collapse') || String(s).includes('falling'))
    return 'b-red';
  if (s === 'Plausible')
    return 'b-blue';
  return 'b-yellow';
}
```

**Risk: MEDIUM**

Green visually signals correctness. A green "Proven" badge on a Study page is a strong visual assertion. The color mapping reinforces the authority-laundering problem: the UI is designed around a vocabulary that implies verification.

If "Proven" is removed from the vocabulary (Section E), this mapping does not need to change. "Well-Supported" or "Strongly Supported" already matches the `includes('Supported')` check and gets the green class, which is acceptable — "supported" is appropriately hedged.

---

### C.6 — Analysis bypasses moderation (`analysis_results` has no `review_state`)

**In `addAnalysisResult()`:**
```js
INSERT INTO analysis_results (id, claim_id, user_id, source, verdict, ...)
-- no review_state column
```

**Risk: LOW (current scope) / MEDIUM (at scale)**

Saved analysis currently appears only to the user who is studying the claim (the Study view is gated by claim selection and requires navigation). Analysis is not surfaced in the public profile, the Review queue, or the public claim listing.

However, if analysis cards are ever made visible to other users studying the same claim, the lack of moderation becomes significant. An analysis card with the verdict "Proven" and a fabricated summary would be visible to all claim viewers with no review gate.

**Recommended monitoring:** Track whether `analyses` is ever exposed in the `getClaim()` public response. Currently `listAnalysisForClaim()` is called in both `getClaim()` and `claimDetail()` — meaning analyses **are already included** in the claim API response returned by `GET /api/claims/:id`. Any user who loads the Study view for a public claim receives all stored analyses for that claim. This is broader exposure than "only the submitter sees it."

**Revised risk: MEDIUM-HIGH.** Analysis from any user appears to any other user loading the same claim's Study view. There is currently no indication in the UI that an analysis was submitted by a specific user, or that it represents one person's AI output rather than an official assessment.

---

### C.7 — `evidenceItem()` legacy path can render stored AI JSON as evidence

**In `evidenceItem()` (app-v10.js):**
```js
function evidenceItem(e) {
  const a = parseAnalysis(e.body || e.note);
  if (a) return `<div class="row analysis-card">…`; // renders as analysis card
  ...
}
```

**Risk: LOW (current scope)**

`parseAnalysis()` detects JSON in evidence body text and renders it as an analysis card with the legacy `legacy` pill. This was a historical path before `analysis_results` existed. Old evidence items that stored raw AIP/RunPack JSON in the body field render with verdict badges and meter bars — identical visually to new analysis cards, but gated by the `legacy` pill.

This surface is not a current risk because new analysis goes through `/api/analysis`. But it represents a precedent: AI output has been stored as evidence. If a user manually crafts evidence body text to look like analysis JSON, `parseAnalysis()` will render it as a verdict card.

---

## D. Required Language Principles

These are the principles D-202C must enforce in copy and code.

**D.1 — AI output is analysis of the supplied packet, not independent verification.**
The AI read what the user submitted. It did not consult external databases, perform experiments, or access real-world sources. Any verdict it produces is a judgment about the coherence and weight of the submitted evidence — not a determination about reality.

**D.2 — HumanX did not verify sources.**
Evidence in the RunPack was submitted by users and may have passed content moderation, but moderation is not source verification. A `public` evidence item is an item that passed content review. It is not an item whose sources have been independently confirmed.

**D.3 — RunPack provenance must be traceable.**
The analysis card must indicate that it derives from an AI reading of a HumanX packet built from this claim's evidence. A reader should not need to guess what the card is.

**D.4 — "Plausible" is not proof.**
This principle applies to all verdict labels below "Proven." "Plausible" means the submitted evidence, as evaluated by an AI, did not obviously fail. It does not mean the claim has been established.

**D.5 — AI output cannot be cited as primary evidence for the same claim without an external source.**
This is the circular-citation rule. It cannot be enforced technically at this stage (see Section F), but it must be stated in the UI at the point where analysis is pasted in.

---

## E. Recommended Quick Fixes for D-202C

These are the minimum changes that close the highest-risk surfaces. D-202C should be scoped to exactly these — no more.

### E.1 — Remove "Proven" and "Disproven" from `output_contract` vocabulary

**File:** `src/worker.js`, `buildRunPack()` at line 900

**Current:**
```js
verdict: 'Proven | Strongly Supported | Plausible | Untestable | Weak Evidence | Disproven | Reality Collapse'
```

**Proposed:**
```js
verdict: 'Strongly Supported | Plausible | Contested | Weak Evidence | Strongly Contested | Internally Contradictory'
```

**Rationale:** "Proven" and "Disproven" imply a standard of verification the system cannot meet. "Strongly Supported" and "Strongly Contested" are accurate descriptions of what the AI is actually measuring: the coherence and weight of the submitted evidence. "Reality Collapse" is replaced with "Internally Contradictory" — same diagnostic value, less theatrical authority claim.

This also requires updating the `instruction` field to list the new vocabulary, so the AI knows which terms to use.

**Also update `cls()` in `public/app-v10.js`:** Add explicit check for "Strongly Supported" if not already covered. The existing `includes('Supported')` check handles it, but explicit is safer.

---

### E.2 — Add provenance note to `analysisItem()` card

**File:** `public/app-v10.js`, `analysisItem()` function

Add below the inv-item-head div:
```html
<p class="small ev-origin-note">
  AI analysis of submitted evidence packet — not independent source verification.
</p>
```

**Rationale:** This is the same pattern as the origin-source note added in D-201F. It is visible, brief, and does not block the card's utility. It appears once per card, below the verdict badge.

---

### E.3 — Add provenance note to `sectionAnalyses()` paste instructions

**File:** `public/app-v10.js`, `sectionAnalyses()` function

**Current copy:**
> "Click **Build RunPack** in the claim header → paste into any AI → paste the JSON result here to save it."

**Proposed addition (second `<p>` tag):**
> "The AI analyses the evidence you submitted — it does not independently verify those sources. Save the result as one interpretation, not as a verdict."

---

### E.4 — Add provenance note to RunPack panel paste surface

**File:** `public/app-v10.js`, `renderExport()` / `patchRunPackPanel()` — the `rp-return-section`

**Current copy:**
> "Paste the JSON result from your AI here to save it as a structured analysis for this claim."

**Proposed addition:**
> "The AI read the evidence you submitted in this packet — not external independent sources. This result is one AI's interpretation."

---

### E.5 — Add `source_type_note` to `output_contract` in `buildRunPack()`

Per D-201D spec Section 7. Add to `output_contract`:

```js
source_type_note: "source_type='scripture_tradition', 'myth_folklore', or 'fiction_story' records the origin tradition of a belief — not independent empirical verification that the factual claim is true. Treat these items as context for why the claim is believed, not as empirical evidence that it is correct."
```

This was deferred from D-201G and belongs in D-202C as it is a one-liner in the same function.

---

## F. Long-Term Protections

These are not D-202C scope. Record them for future task planning.

### F.1 — Analysis provenance fields

Add to `analysis_results` table:
- `packet_id TEXT` — foreign key to `aip_packets.id` (which packet this analysis came from)
- `ai_model TEXT` — which AI model was used (user-declared, not verified)
- `packet_snapshot_hash TEXT` — `source_snapshot_hash` from the packet, so we know if the claim changed after analysis

Requires a migration. Adds traceability without changing the display model.

### F.2 — AI-output provenance badge

Replace the raw `source` pill in `analysisItem()` with a dedicated AI-output badge that is visually distinct from evidence badges. Something like:
```html
<span class="pill ev-ai-analysis">AI analysis · runpack-user</span>
```
The class `ev-ai-analysis` can carry a distinct color in CSS — not green, not the same as evidence quality pills.

### F.3 — Circular-citation detector (long-term)

When a user saves an AI analysis and then navigates to the evidence panel, show a note:

> "Note: the AI read this claim's evidence to produce this analysis. Citing 'AI says Plausible' as evidence for the same claim is circular — the evidence drove the AI output."

Full implementation requires detecting when the same claim_id appears in both `analysis_results` and a new `evidence` submission within a time window. This is complex and can wait.

### F.4 — Re-entry rule (policy, not enforcement)

Establish as a platform rule: AI output from a RunPack cannot be submitted as primary evidence for the same claim without citing an external source that is independent of the original evidence pool. This rule should appear in any future community guidelines or contribution guidelines doc.

### F.5 — Analysis visibility audit before any public surfacing

Before `analysis_results` is ever shown publicly (leaderboards, shared claim pages, public profiles, aggregate views), conduct a full audit of what those cards display and add review gates. Currently analyses appear to anyone who loads the same claim in Study view — this is already broader than "owner only" and should be reviewed if the user base grows.

---

## G. What NOT to Do

These are specific design choices that would make the authority-laundering problem worse. They are recorded here as hard stops, not just guidance.

**No "AI verified" wording anywhere.** Not in copy, not in badges, not in hover text, not in tooltips. The phrase "verified" implies an independent check. No AI running on a RunPack packet has performed one.

**No automatic status upgrades from AI output.** A "Proven" or "Strongly Supported" verdict from a saved analysis must never automatically change a claim's `status` field, `evidence_score`, or `review_state`. AI output is interpretive metadata. Claim status is computed from submitted evidence and moderation decisions.

**No AI confidence badge that looks official.** If a badge is added to display AI output, it must be visually distinct from the evidence quality badges, moderation state badges, and claim status labels. It must not share the same visual language as these. A user reading the UI must be able to distinguish "this AI interpreted the evidence" from "this passed moderation" or "this is the current claim status."

**No aggregate "AI consensus" display.** If multiple users submit AI analyses for the same claim, do not aggregate the verdicts into a consensus score. The verdicts all came from AI systems reading the same or similar packets. They are not independent assessments; they are correlated outputs of similar models reading similar inputs.

**No score from AI output in `recalcClaimScore()`.** The scoring algorithm must remain independent of saved analyses. This is already the case; it must never change.

---

## H. Risk Ranking Summary

| Surface | Risk | In D-202C? |
|---------|------|------------|
| "Proven" in `output_contract` verdict | **HIGH** | Yes |
| No provenance note on `analysisItem()` | **HIGH** | Yes |
| Paste surfaces lack AI-input warning | **MEDIUM** | Yes |
| Analyses visible to all claim viewers (not just submitter) | **MEDIUM-HIGH** | Note only (no code change) |
| No packet_id / ai_model stored | **MEDIUM** | No — long-term |
| `source` field default is meaningless | **MEDIUM** | Partial (copy improvement) |
| Legacy `evidenceItem` JSON detection path | **LOW** | No |
| `cls()` green for "Proven" | **MEDIUM** | Resolved if E.1 lands |
| No moderation on `analysis_results` | **LOW–MEDIUM** | No — monitor |
| No circular-citation guard | **MEDIUM** | No — long-term |

---

## I. Recommended D-202C Scope

**D-202C should be a single focused patch** touching:

1. `src/worker.js` — `buildRunPack()` verdict vocabulary + `source_type_note` in `output_contract` + update `instruction` to name new verdicts
2. `public/app-v10.js` — `analysisItem()` provenance note + `sectionAnalyses()` paste copy + `rp-return-section` paste copy
3. `scripts/hardening-smoke-test.mjs` — smoke tests for: new verdict vocabulary absent of "Proven"/"Disproven", provenance note present in analysisItem, paste copy updated

**D-202C should NOT touch:**
- `analysis_results` DB schema (no migration)
- `cls()` function (resolves automatically when "Proven" is removed)
- Review queue or moderation flow
- RunPack packet structure or provenance block (already good)
- Any scoring logic

Estimated scope: 3 files, ~15 lines changed, ~8 new smoke tests.

---

## J. What Is Already Good

The existing RunPack has meaningful protections that are worth preserving:

- `provenance` block is present and includes `packet_id`, `generated_at`, `source_claim_id`, `evidence_count`, `pressure_count`, `test_count`, and `source_snapshot_hash` — the AI receives traceability data
- `instruction` explicitly says "Analyse this claim using only the provided packet and your own reasoning" — a reasonable prompt-level guard
- `no_owner_api_used: true` signals to the AI that no external data sources were used
- Rate limit on `/api/runpack`: 20 per hour per IP — prevents bulk analysis laundering
- Rate limit on `/api/analysis`: 20 per hour per IP — prevents bulk analysis submission
- `safeRunPackClaimBackend()` strips admin/internal fields before including the claim in the packet

These are solid. D-202C builds on them rather than replacing them.
