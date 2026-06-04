# HumanX Project State Checkpoint

Last updated: 2026-06-04 after D-series (D-1 → D-9C).

---

## Identity

| Item | Value |
|------|-------|
| Live app | https://humanx.rinkimirikata.com |
| Repo | HerGotSystems/HumanX |
| Worker entry | `src/worker.js` |
| Frontend | `public/app-v10.js`, `public/styles.css`, `public/index.html` |
| Belief Engine | `public/apps/humanx-belief-engine/index.html` (standalone) |

---

## Known-good static checks

Run before and after any change. All must pass with exit 0.

```sh
node --check public/app-v10.js
node scripts/hardening-smoke-test.mjs
node scripts/belief-engine-static-check.mjs
node scripts/worker-route-static-check.mjs
```

| Script | Expected |
|--------|----------|
| `node --check public/app-v10.js` | no output, exit 0 |
| `hardening-smoke-test.mjs` | `77 passed, 0 failed` |
| `belief-engine-static-check.mjs` | `24 passed, 0 failed (24 hard checks)` |
| `worker-route-static-check.mjs` | `35 passed, 0 failed (35 hard checks)` |

`MODULE_TYPELESS_PACKAGE_JSON` warning during hardening smoke is non-blocking.

---

## Current functional state

All flows confirmed working (code audit + static checks):

| Flow | State |
|------|-------|
| Submit Claim | → enters Review; duplicate claims surfaced correctly (D-5B) |
| Add Truth | → enters Review |
| Truth → Claim Review | converts truth to a pressure-testable claim in Review |
| Drift promote Truth | → enters Review |
| Drift promote Claim | → enters Review |
| Review approve / reject / keep | admin-only, all three paths functional |
| Review archive (cleanup) | admin-only, rejected smoke/test artefacts only |
| Evidence attach (side panel) | attaches to selected claim, recalculates score |
| Evidence Vault → Study Linked Claim | studyFromVault sets tab + mode correctly |
| Evidence Vault date display | shows `createdAt` from vault response (fixed B-3) |
| RunPack build / copy / download | functional; fallback pack generated locally if backend unreachable |
| Belief Engine → Send to HumanX | bridge sends snapshot via POST /api/belief-snapshots |
| Graph status box | live counts on Home, Claims, Truths, Vault |

---

## Backend / D1 safety rules

| Rule | Detail |
|------|--------|
| Do not rerun migration 0004 | `migrations/0004_unique_normalized_content.sql` already applied to production. Rerunning will fail. |
| Do not rerun migration 0005 | `migrations/0005_add_home_tests_updated_at.sql` was manually applied via Cloudflare D1 console. Do not rerun unless the target DB is confirmed missing `home_tests.updated_at`. |
| No Wrangler / D1 commands | `wrangler d1 execute`, `wrangler deploy`, and all variants are off-limits unless the user explicitly requests them. |
| No live write smoke | `scripts/write-endpoint-smoke-test.mjs` requires explicit per-session user approval. Do not run routinely. |

---

## Batch history (A-2 → D-5C)

| Batch | Commit | Change |
|-------|--------|--------|
| A-2 | — | Home command center simplified — hero copy, pipeline banner, action cards |
| A-3 | — | Claims/Study workspace streamlined — card layout, Study sections, Claim Flow |
| A-4 | — | Review admin workspace + context panel deduplication |
| A-5 | — | Drift workspace streamlined — profile vs quick record split, drift compare panel |
| A-6 | — | Submit/Truth/Evidence input forms polished |
| A-7 | `15b654e` | Live visual QA fixes — spacing, badge alignment, empty states |
| B-1 | `d3c4f40` | Functional flow audit — fixed mode/tab wiring bugs in `promoteBelief`, `convertTruth`, `studyFromVault` |
| B-2 | `f073942` | Static checks added for navigation wiring (hardening smoke section 14) |
| B-3 | `d5a3207` | Frontend ↔ Worker contract audit — fixed Evidence Vault `createdAt` field mismatch in `evidenceCard` |
| B-4 | `6c8ffd7` | Static check added for Evidence Vault `createdAt` contract; hardening smoke 76 → 77 |
| B-5 | `52db796` | Read-only smoke attempted — all local static checks passed; live read smoke blocked by local environment (see Known limitations) |
| C-1 | `601d3d0` | Public clarity pass — README, noscript, Truths terminology, empty states, Home framing |
| C-2 | `33a9669` | Review queue admin scanability — filter chips, inspect panel, state labels, audit summary |
| C-3 | `f0f950f` | Study view clarity — Claim Flow section, investigation board headers, section purpose lines |
| C-4 | `6d65ad5` | Drift workspace scanability — full-profile vs quick-record split, drift compare, badge labels |
| C-5 | `8dde730` | Claims browser scanability — meter numeric values, pressure chip, Study Claim button, empty state CTA |
| C-6 | `d834379` | Truths workspace scanability — split badges, stats row (↻/⊘), linked-claim chip, amber left border |
| C-7 | `d6eb287` | Evidence Vault scanability — stance borders, split quality/media badges, claim block guard, reuse chip |
| C-8 | `41b5c17` | RunPack export clarity — three-state layout, claim context box, Browse Claims CTA, button tooltips |
| C-9 | `0563a94` | Submit and Add Truth form clarity — better placeholders, field-type labels, removed duplicate notes |
| C-10 | `87f7752` | Docs checkpoint — batch history A-2 → C-9, next-steps updated (pushed to origin) |
| C-11 | `b9918a0` | Modal hardening — replaced native `window.prompt` in report flow with `hxModal` in-app modal |
| D-1 | `53d3879` | Workspace-aware layout — sidebar context/casefile text now reflects the active mode in every workspace |
| D-2 | `437cbc3` | RunPack builder state — three-state layout (no claim / claim selected / pack generated) made explicit |
| D-3 | `e393512` | Evidence readability — JSON/object evidence body values rendered as readable text, not `[object Object]` |
| D-4 | — | Report reason visibility audit — confirmed `reports.reason` exists in schema; identified review queue gap |
| D-4B | `dd5a903` | Report reasons in review queue — correlated subquery adds `latest_report_reason` to both claims and truths queries; rendered in `reviewCard` and `renderReviewInspectPanel` (branch → PR #77 → merged) |
| D-5 | — | Claim normalization / intake audit — full audit of `renderSubmit`, `saveClaim`, `meaningKey`, duplicate detection; identified `data.existing` silent-lie bug and UX gaps |
| D-5B-1 | `5eb54d6` | Duplicate claim response fix — `saveClaim` now handles `data.existing: true` correctly; shows "already exists" panel with Study link instead of false "submitted for Review" |
| D-5C | `6ce3fb2` | Claim-writing guidance — collapsible writing-tips section (good/avoid examples), category suggestion chips, claim-type live hint below select |
| D-9A | `0430a88` | Reused-evidence compression — Study view collapses repeated evidence entries under a single source-claim header, eliminating redundant rows |
| D-9B | `7277f98` | Study evidence/pressure grouping — Study dock groups evidence and pressure blocks by linked claim for faster scanning |
| D-9B+ | `9044a07` | Evidence Vault grouping — Vault groups entries by linked claim with claim-level headers |
| D-9C | `1951f09` | Investigation Packet / RunPack workflow clarity — dock redesigned with explicit packet framing, AI-return parsing flow, and RunPack terminology consistency |

---

## Known limitations

**Live read smoke from Windows sandbox may fail.**
`scripts/read-endpoint-smoke-test.mjs` uses Node.js `fetch`, which inherits the Windows `schannel` TLS library. In sandboxed or restricted environments `schannel` cannot reach CRL/OCSP revocation servers, producing `CRYPT_E_NO_REVOCATION_CHECK` and `fetch failed` for all HTTPS requests. This is a local TLS policy restriction, not an app failure. The live app is reachable (DNS resolves to Cloudflare). Run the live read smoke from a CI environment or a dev machine with unrestricted outbound TLS (e.g. GitHub Actions, WSL with curl's CA bundle).

---

## What is safe to do next

Live QA passed after D-9A/B/C. The Study dock, Evidence Vault grouping, and Investigation Packet flow are confirmed working in the live app.

Next work:

1. **D-10 semantic duplicate infrastructure** — activate `meaningMatch` (80% word-overlap) server-side in `createClaim`; **must use a branch + PR, not direct main**. Include a static check covering the new path.
2. **RunPack provenance / versioning** (optional) — stamp generated packets with a claim snapshot hash and timestamp so AI analysis can be traced back to the state of the claim at generation time.
3. **Study dock refinements** (optional, after more use) — collect real usage feedback on the grouped Study view before further structural changes.

**Do not:**
- Speculatively refactor `src/worker.js` routing without a written plan reviewed first.
- Rerun migration 0004 or 0005 (see Backend / D1 safety rules above).
- Run live write smoke tests without explicit per-session approval.
- Merge backend duplicate/near-duplicate work directly to main — always use a branch and PR.
