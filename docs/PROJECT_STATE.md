# HumanX Project State Checkpoint

Last updated: 2026-06-03 after Batch B-5.

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
| Submit Claim | → enters Review, not public until approved |
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

## Batch history (A-2 → B-5)

| Batch | Change |
|-------|--------|
| A-2 | Home command center simplified — hero copy, pipeline banner, action cards |
| A-3 | Claims/Study workspace streamlined — card layout, Study sections, Claim Flow |
| A-4 | Review admin workspace + context panel deduplication |
| A-5 | Drift workspace streamlined — profile vs quick record split, drift compare panel |
| A-6 | Submit/Truth/Evidence input forms polished |
| A-7 | Live visual QA fixes — spacing, badge alignment, empty states |
| B-1 | Functional flow audit — fixed mode/tab wiring bugs in `promoteBelief`, `convertTruth`, `studyFromVault` |
| B-2 | Static checks added for navigation wiring (hardening smoke section 14) |
| B-3 | Frontend ↔ Worker contract audit — fixed Evidence Vault `createdAt` field mismatch in `evidenceCard` |
| B-4 | Static check added for Evidence Vault `createdAt` contract; hardening smoke 76 → 77 |
| B-5 | Read-only smoke attempted — all local static checks passed; live read smoke blocked by local environment (see Known limitations) |

---

## Known limitations

**Live read smoke from Windows sandbox may fail.**
`scripts/read-endpoint-smoke-test.mjs` uses Node.js `fetch`, which inherits the Windows `schannel` TLS library. In sandboxed or restricted environments `schannel` cannot reach CRL/OCSP revocation servers, producing `CRYPT_E_NO_REVOCATION_CHECK` and `fetch failed` for all HTTPS requests. This is a local TLS policy restriction, not an app failure. The live app is reachable (DNS resolves to Cloudflare). Run the live read smoke from a CI environment or a dev machine with unrestricted outbound TLS (e.g. GitHub Actions, WSL with curl's CA bundle).

---

## What is safe to do next

- Frontend-only polish (copy, badge labels, empty states) — touch `public/app-v10.js` or `public/styles.css` only
- Add static checks to hardening smoke or the other check scripts
- Docs additions
- Backend route additions in new `src/` modules (follow existing module pattern, add Worker route, update route static check)

**Do not** speculatively refactor `src/worker.js` routing without a written plan reviewed first.
