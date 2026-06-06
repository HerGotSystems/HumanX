# D-22: D-Series Stabilization Release Checkpoint

Date: 2026-06-06
Status: Docs-only checkpoint. No code changes in D-22.

---

## Summary

The D-series (D-1 through D-21) represents the second major development phase of HumanX after the A/B/C series. It focused on investigation ergonomics, claim intake integrity, review queue tooling, RunPack workflow clarity, sidepanel stabilization, and visual QA. D-22 marks the end of this phase as a stable, documented baseline before new feature work begins.

---

## D-Series Scope: D-1 through D-21

### D-1 — D-5C: Workspace awareness and claim intake

| Batch | Change |
|-------|--------|
| D-1 | Workspace-aware sidebar — context text reflects active mode in every workspace |
| D-2 | RunPack builder state — explicit three-state layout (no claim / claim selected / pack ready) |
| D-3 | Evidence readability — JSON body values rendered as readable text, not `[object Object]` |
| D-4 | Report reason audit — confirmed schema field; identified review queue gap |
| D-4B | Report reasons in review queue — correlated subquery; rendered in cards and inspect panel (PR #77) |
| D-5 | Claim normalization audit — `data.existing` silent-lie bug identified |
| D-5B-1 | Duplicate claim response fix — `saveClaim` correctly shows "already exists" with Study link |
| D-5C | Claim-writing guidance — writing tips, category chips, claim-type live hint |

### D-9: Investigation board and evidence grouping

| Batch | Change |
|-------|--------|
| D-9A | Reused evidence compression — collapsed under source-claim headers in Study view |
| D-9B | Study dock evidence/pressure grouping — grouped by linked claim |
| D-9B+ | Evidence Vault grouping — vault entries grouped by linked claim with headers |
| D-9C | Investigation Packet / RunPack workflow clarity — explicit packet framing, AI-return parsing flow |

### D-10 — D-14: Near-duplicate detection and review queue tooling

| Batch | Change |
|-------|--------|
| D-10A | Near-duplicate migration plan — manual D1 SQL documented (PR prerequisite) |
| D-10B | Near-duplicate suggestions Phase 1 — `meaningMatch` wired into `createClaim`; advisory `similar` badge (PR #78) |
| D-10C | Near-duplicate tuning — suffix/contraction normalisation; threshold 0.8 → 0.65; smoke 77 → 87 |
| D-10D | Negation/contradiction safety — contractions → `"not"`; negation-polarity guard; smoke 87 → 89 |
| D-11 | Review moderation clarity — `~Similar` filter chip, amber badge, advisory note banner; no merge UI |
| D-11B | Fix review similar filter regression — `nearDup` scope bug (ReferenceError); smoke 89 → 91 |
| D-12 | Review queue scale/quality — sort controls; relative age display (`reviewAge`) |
| D-13 | Advisory claim quality hints — `claimQualityHints()` heuristic; live hints in Submit; no blocking |
| D-14 | Review quality filter — `~Quality` chip and sort; advisory only |

### D-15 — D-21: UI ergonomics, sidepanel stabilization, visual QA

| Batch | Change |
|-------|--------|
| D-15 | Review inspect navigation — position indicator, Prev/Next, compact top action bar |
| D-16 | Study reused evidence compression — collapse threshold 10 → 4; ≤3 items use compact row format |
| D-17 | Investigation Packet workflow clarity — 4-step guide; renamed buttons; collapsible JSON block |
| D-18 | Study tool dock clarity — safe text-only renames in `index.html`; blue section head highlight |
| D-19 | Sidepanel patch stabilization — static HTML for helper notes; `#aip-status` stable container; `patchRunPackPanel` direct targeting; stale render bug fixed |
| D-20 | Study dock refinement — "Attach Evidence / Pressure" label; Report microcopy; status min-height; narrow-width button stacking |
| D-21 | Visual QA audit — D-15 → D-20 regression check; all five areas pass; no code changes |

---

## Safety boundaries observed across the D-series

The following constraints were held throughout every D-series batch:

| Boundary | Status |
|----------|--------|
| No backend changes in UI batches | Held. All D-15 → D-21 changes are HTML/CSS/static text only. |
| No D1 schema or data changes | Held. D-10A required a manual D1 step (pre-documented); no further D1 changes after that. |
| No moderation behaviour changes | Held. `~Similar` and `~Quality` are advisory only. No `duplicate_of` writes. No `review_state='duplicate'`. No merge UI. |
| No scoring changes | Held. `claimQualityHints()` is frontend display only. Evidence score, testability, survivability unchanged. |
| No duplicate merge/suppress | Held. Near-duplicate detection is read-only at intake. No backend merge path exists. |
| No new persistence | Held. No new D1 columns, no new API endpoints, no new localStorage keys added in late D-series. |
| Branch + PR required for backend/risky changes | Held. D-4B used PR #77; D-10B/C/D used PR #78/#79. All UI-only work went direct to main. |

---

## Known-good static checks at D-22

Confirmed passing on 2026-06-06, commit `5d9c7c7`:

| Script | Result |
|--------|--------|
| `node --check public/app-v10.js` | pass (no output, exit 0) |
| `node scripts/hardening-smoke-test.mjs` | **91 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed** |
| `node scripts/worker-route-static-check.mjs` | **35 passed, 0 failed** |

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking.

---

## What comes next

Work deferred out of D-series scope:

1. **Moderator merge UI** — a "Mark as duplicate of" action in the review inspect panel that writes `duplicate_of` and sets `review_state='duplicate'`. Backend + frontend; branch + PR required. Do not implement without a written plan reviewed first.
2. **RunPack provenance / versioning** — stamp generated packets with a claim snapshot hash and timestamp so AI analysis results are traceable back to the claim state at generation time.

Neither should be started speculatively. Both require a written plan and, for the moderator merge UI, extended usage data first.
