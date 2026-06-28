# D-202 — Authority-Laundering Closeout

**Date:** 2026-06-28
**Final HEAD before closeout:** `6858074`
**Baseline:** 1645/24/57
**Status:** COMPLETE — audit done, code fixed, deploy confirmed, sanity passed

---

## What This Arc Was

The D-202 arc identified and closed a specific category of misuse risk: AI output from the RunPack system being presented — or perceived — as independent verification of a claim. The arc ran three tasks:

- **D-202A** established the conceptual model (what HumanX measures and does not measure)
- **D-202B** audited the specific code surfaces where authority-laundering could occur
- **D-202C** implemented the fixes

---

## D-202A — HumanX Epistemology Model

Established the foundational product principle before any code changes:

> **HumanX maps and pressures claims. Humans still interpret reality.**

Defined all 10 operational constructs (claim, truth, evidence, pressure, test, belief, confidence, source type, evidence strength, moderation) and fixed their meanings. Documented nine critical separations — the lines that must never be erased in copy or feature design:

- Popularity ≠ truth
- Confidence ≠ accuracy
- Source origin ≠ proof
- Moderation ≠ endorsement
- Quantity of evidence ≠ quality
- Emotional certainty ≠ verification
- Investigation depth ≠ resolved question

Identified authority-laundering as the highest-risk future failure mode: AI reads user-submitted evidence, returns a verdict, user cites that verdict as independent proof of the same claim. The loop is short, invisible to third parties, and plausible-looking.

Reference document `D202A_HUMANX_EPISTEMOLOGY_MODEL.md` governs all future feature decisions involving scoring, aggregation, display, or AI integration.

---

## D-202B — RunPack Authority-Laundering Audit

Code audit of all surfaces where AI output could appear as independent verification. Five surfaces identified and risk-ranked:

| Surface | Risk |
|---------|------|
| `"Proven"` in `output_contract` verdict vocabulary | HIGH |
| No provenance note on `analysisItem()` card | HIGH |
| Analyses visible to all claim viewers (not just submitter) | MEDIUM-HIGH |
| Paste surfaces lacked AI-input warning copy | MEDIUM |
| No `packet_id`/`ai_model` stored in `analysis_results` | MEDIUM |

Full failure loop documented: user submits claim → attaches evidence → builds RunPack → AI reads packet (built from user's own inputs) → returns "Proven" → green badge appears on Study view → user screenshots it → third party reads "Proven" on a HumanX page and treats it as external validation.

Also identified that `analysis_results` bypasses moderation (`review_state` is absent), and that analyses from any user appear to any other user loading the same claim's Study view via `getClaim()` → `listAnalysisForClaim()`.

Documented hard stops: no "AI verified" wording, no automatic status upgrades from AI output, no aggregate AI consensus display, no scoring influence from saved analyses.

---

## D-202C — Code Fixes

Commit `6858074`. Three files changed, 17 new smoke tests.

### Removed verdict terms

These three labels were removed from the RunPack `output_contract` verdict vocabulary:

| Removed | Reason |
|---------|--------|
| `Proven` | Implies a standard of verification the system cannot meet; drove a green badge with no qualification |
| `Disproven` | Same problem in the negative direction |
| `Reality Collapse` | Dramatically authoritative; implied the system had made a determination |

### Safer replacement terms

| Added | What it actually means |
|-------|----------------------|
| `Strongly Supported` | The submitted evidence pool, as evaluated by the AI, weighs heavily in favour |
| `Strongly Contested` | The submitted evidence and pressure pool, as evaluated by the AI, weighs against |
| `Internally Contradictory` | The submitted evidence contradicts itself or the claim is incoherent under the AI's analysis |

These labels describe what the AI found in the packet. They do not claim correspondence with external reality.

### RunPack `output_contract` additions

Two new fields added to `output_contract` in `buildRunPack()`:

```js
ai_provenance_note: 'AI output is analysis of the supplied packet, not independent verification. Supported or plausible does not mean proven.'
source_type_note: 'Sources marked scripture_tradition, myth_folklore, or fiction_story describe origin/tradition context and are not empirical proof by themselves.'
```

The `source_type_note` was deferred from D-201G and included here. Any AI receiving the packet now has these constraints in its input context.

### RunPack `instruction` update

Updated to explicitly instruct the AI:
- Do not claim independent verification
- Do not call a claim proven
- Distinguish source origin from evidence strength

Old instruction: *"Identify what is proven, weak, contradicted, untestable, or needs better evidence."*

New instruction: *"Identify what is strongly supported, plausible, contested, weak, untestable, or internally contradictory. Do not claim independent verification — you are reading user-submitted evidence, not independently checked sources. Do not call a claim proven."*

### Study Analysis — provenance note

Every saved analysis card (`analysisItem()`) now displays:

> AI analysis of supplied HumanX packet — not independent verification.

This note is permanent and appears on every card regardless of verdict.

### Legacy label handling

Existing rows in `analysis_results` with stored values of `"Proven"`, `"Disproven"`, or `"Reality Collapse"` are not modified. The stored text is preserved as a historical record. On display, `LEGACY_VERDICT_MAP` remaps the visible label:

| Stored (unchanged) | Displayed as |
|-------------------|--------------|
| `Proven` | `Strongly Supported` |
| `Disproven` | `Strongly Contested` |
| `Reality Collapse` | `Internally Contradictory` |

Legacy cards also show an additional note: "Legacy AI label softened — not verification."

No migration. No DB schema change. Display-layer remapping only.

### Paste surfaces — warning copy

Both analysis paste areas now include explicit warnings:

**Study Analysis section (`sectionAnalyses()`):**
> The AI reads the evidence you submitted — not independent external sources. Save the result as one interpretation, not as a verdict. Do not treat it as verification unless external sources are independently checked.

**RunPack panel return area (`rp-return-section`):**
> The AI read the evidence submitted in this packet — not independent external sources. This is one AI interpretation, not independent verification.

### What was NOT changed

- No scoring logic changed — `recalcClaimScore()` remains independent of saved analyses
- No moderation logic changed — analysis still bypasses review queue (tracked as future work)
- No status upgrades added — saving an analysis does not change `claim.status` or `review_state`
- No DB schema changed — `analysis_results` table unchanged
- No CSP, wrangler.toml, or migration changes

---

## Live Deploy Sanity

Deployed from `HEAD = 6858074` via `npx wrangler deploy`.

**Result: PASS**

Confirmed:
1. RunPack packet no longer contains "Proven", "Disproven", or "Reality Collapse" in verdict vocabulary
2. Packet contains "not independent verification" in `ai_provenance_note`
3. Packet instruction contains "Do not call a claim proven"
4. Study Analysis paste area shows the new warning copy
5. Analysis cards show the provenance note
6. Legacy label remapping confirmed visually (if any old labels existed in saved analyses, the softer display label was shown with the legacy note)
7. No scoring or status changes observed

---

## Remaining Future Protections

These were documented in D-202B and are deferred — not urgent, not blocking.

**Analysis provenance DB fields.**
Add `packet_id TEXT` and `ai_model TEXT` to `analysis_results` so that each analysis can be traced back to the exact packet state and declared AI model. Requires a migration. Adds auditability without changing the display model.

**AI-output badge.**
Replace the raw `source` pill in `analysisItem()` with a visually distinct `ev-ai-analysis` badge that cannot be confused with evidence quality pills, moderation state badges, or claim status labels. CSS-only change once the design decision is made.

**Circular-citation detector.**
Detect when a user saves an AI analysis for a claim and then navigates to submit new evidence for the same claim. Show: "Note: the AI read this claim's evidence to produce this analysis. Citing 'AI says Plausible' as evidence for the same claim is circular." Full implementation requires cross-table lookup at evidence-submission time.

**Re-entry rule (policy).**
Platform rule, not yet technically enforced: AI output from a RunPack cannot be submitted as primary evidence for the same claim without citing an external source that is independent of the original evidence pool. Should appear in any future contributor guidelines.

**Moderation gate for analysis results.**
Currently `analysis_results` has no `review_state`. Analyses appear to all claim viewers immediately. If the platform grows, consider gating analysis display behind the same moderation flow as evidence, or at minimum adding rate limits specific to analysis submission per claim per user.

---

## Do-Not-Regress Rules Added by This Arc

1. The words "Proven", "Disproven", and "Reality Collapse" must never re-enter the `output_contract` verdict vocabulary
2. Every analysis card must show the provenance note — "AI analysis of supplied HumanX packet — not independent verification." — this is not optional copy
3. No feature may use "AI verified" wording anywhere in the product
4. Saving an analysis must never trigger an automatic change to `claim.status`, `evidence_score`, `review_state`, or any other claim field
5. `recalcClaimScore()` must remain independent of `analysis_results`
6. The `LEGACY_VERDICT_MAP` must stay in `analysisItem()` until legacy rows are confirmed absent from production (run: `SELECT DISTINCT verdict FROM analysis_results WHERE verdict IN ('Proven','Disproven','Reality Collapse')`)

---

## File Index for This Arc

| File | Purpose |
|------|---------|
| `docs/D202A_HUMANX_EPISTEMOLOGY_MODEL.md` | Foundational product principle and construct definitions |
| `docs/D202B_RUNPACK_AUTHORITY_LAUNDERING_AUDIT.md` | Full audit of five at-risk surfaces |
| `docs/D202_AUTHORITY_LAUNDERING_CLOSEOUT.md` | This document |
| `src/worker.js` | buildRunPack: verdict vocabulary, instruction, output_contract fields |
| `public/app-v10.js` | LEGACY_VERDICT_MAP, analysisItem provenance note, paste surface warnings |
| `scripts/hardening-smoke-test.mjs` | 17 new D-202C tests |
