# HumanX — Project Index

## Purpose

HumanX is a public pseudonymous belief, truth, claim, evidence and analysis system.

It separates:

- Belief
- Truth
- Claim
- Evidence
- Pressure
- Tests
- Analysis

The core rule: belief is not truth, repetition is not proof, and claims must survive evidence, pressure and testing.

## Repo

HerGotSystems/HumanX

## Live URL

https://humanx.rinkimirikata.com/

## Deployment

Cloudflare Worker / Pages through Wrangler.

Main Worker:

```text
src/worker.js
```

Frontend shell:

```text
public/index.html
```

Current active frontend:

```text
public/app-v10.js
```

`public/index.html` currently loads:

```html
<script src="/app-v10.js?v=5"></script>
```

> Legacy bundles `public/app-v3.js` through `public/app-v9.js` were removed as orphaned static assets in **D-109B** (not loaded by any served HTML; preserved in git history).

## Current Working State

Confirmed working:

- `/api/health`
- `/api/debug`
- `/api/claims`
- `/api/claims/:id`
- `/api/graph-status`
- `/api/evidence-vault`
- `/api/truths`
- `/api/truth-to-claim`
- `/api/evidence-attach`
- `/api/aip`
- `/api/analysis`

`/api/claims/:id` returns:

```json
{
  "claim": {},
  "evidence": [],
  "pressure": [],
  "tests": [],
  "analyses": []
}
```

## Current UI

`app-v10.js` shows Study Claim as:

```text
Evidence | Pressure | Tests | Analysis
```

Old AI JSON saved inside evidence is labelled:

```text
LEGACY ANALYSIS IN EVIDENCE
```

Real analysis results come from:

```text
analysis_results
```

## Database Objects

Main D1 tables:

- users
- claims
- evidence
- pressure_points
- home_tests
- reports
- aip_packets
- rate_limits
- truths
- truth_claim_links
- evidence_claim_links
- analysis_results

## Important Backend Modules

```text
src/evidence-vault.js
src/importer.js
src/votes.js
src/truths.js
src/truth-seed.js
src/truth-claim-bridge.js
src/evidence-reuse.js
src/graph-status.js
src/analysis-results.js
```

## Important Database Migration Files

```text
database/humanx_truth_claim_bridge_v1.sql
database/humanx_evidence_reuse_v1.sql
database/humanx_analysis_results_v1.sql
```

## Known Design Decisions

Public users do not use owner AI/API credits.

HumanX is AIP-first:

```text
Generate AIP packet
User copies it
User runs it in their own AI account/model
Result can be saved back later as Analysis
```

Analysis is not Evidence.

Truth is not Claim.

Evidence can be reused across many claims.

## Current Problems / Next Work

Next planned work:

1. Belief Engine result capture.
2. Add `belief_snapshots` D1 table.
3. Add API for saving/listing pseudonymous belief snapshots.
4. Add UI for viewing belief drift over time.
5. Later connect Belief Engine output to Truth and Claim interpretation.
6. Add proper “Save Analysis Result” UI so users can paste AIP output into `analysis_results`, not evidence.
7. Improve visual design of Evidence / Pressure / Analysis cards.
8. Score hardening: prevent weak or pasted analysis text from falsely making claims Proven.
9. Admin review UI.
10. Better duplicate cleanup for existing old truth-derived claim duplicates.

## Critical Instruction For Future AI Work

User does not code.

Do not give tiny function surgery unless unavoidable.

Prefer:

- direct GitHub file edits
- full file replacements
- one exact copy-paste block
- clear deploy/test steps

Avoid telling the user to hunt for commas, brackets, functions or hidden syntax issues.
