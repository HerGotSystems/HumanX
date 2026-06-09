# D-94C — Live Deployment Verification

**Date:** 2026-06-09  
**Mode:** Deployment record only — no Wrangler run, no D1, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `429cd5f` — Merge PR #116 (D-93D/E review truth-derived context guard) |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `529514a6-e951-4812-a408-a197253e06e9` |
| **Assets uploaded** | 13 files (includes `public/app-v10.js`, `public/styles.css`) |
| **D1 binding** | Present in wrangler.toml — no migration run, no mutation performed |

---

## What Went Live (D-93D/E)

Frontend-only changes merged from PR #116:

| Change | Description |
|---|---|
| `isTruthDerivedClaim(item)` helper | Detects claims created via Pressure-test from a Truth (type field `'Truth-Derived'`) |
| `isClaimCategoryEcho(item)` helper | Exact-equality check: claim text === category text (substring matching removed in D-93E — false-positive fix) |
| `isLikelyBorderlineDerivedClaim(item)` helper | Heuristic advisory: Truth-Derived + (category-echo OR all-caps OR weak evidence) |
| Truth-Derived Review filter chip | New chip in Review filter bar, count-badged, no decision changes |
| `truth-derived` Review card badge | Cyan badge on Truth-Derived claims in Review queue |
| `category-echo` Review card badge | Amber badge when claim text === category; tooltip warns to check parent Truth |
| `? borderline origin` Review card badge | Muted-gold advisory badge; heuristic label, no action |
| Inspect panel — Origin Path row | Shown for all Truth-Derived claims: source path note |
| Inspect panel — Review Advisory row | Shown when category-echo fires: check parent Truth warning |
| Inspect panel — Borderline Hint row | Shown when borderline heuristic fires: advisory, confirm via Truths page |
| CSS: `.b-truth-derived`, `.b-category-echo`, `.b-borderline-origin` | Badge colour rules |

No backend routes changed. No schema changed. No D1 migration run.

---

## Live Visual Verification

Confirmed by user screenshot after deploy.

**Review claim `clm_30889d651e3b4b2cb6` — `SMALL INDEFERENT TRUTH`:**

| Expected UI element | Observed |
|---|---|
| `TRUTH-DERIVED` badge on Review card | ✅ visible |
| `CATEGORY-ECHO` badge on Review card | ✅ visible |
| `? BORDERLINE ORIGIN` badge on Review card | ✅ visible |
| Inspect panel — ORIGIN PATH row | ✅ visible |
| Inspect panel — REVIEW ADVISORY row | ✅ visible |
| Inspect panel — BORDERLINE HINT row | ✅ visible |

Claim status after deploy: **still Pending / not approved** — no moderation action taken.  
Source Truth `tru_67ae90e56f7449ee85` (`SMALL INDEFERENT TRUTH`): **still visible on Truths page** — no archive action taken.

---

## Safety Confirmation

| Safety check | Status |
|---|---|
| No D1 migration run | ✅ confirmed |
| No database mutation | ✅ confirmed |
| No admin token used | ✅ confirmed |
| No claim approved/rejected/archived | ✅ confirmed |
| No Truth archived/withdrawn | ✅ confirmed |
| No bulk cleanup | ✅ confirmed |
| No schema change | ✅ confirmed |
| No backend/Worker code change | ✅ confirmed |
| Frontend-only delta deployed | ✅ confirmed |

---

## Static Checks at Deployment (main HEAD `429cd5f`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **267 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

During D-94B, Wrangler's `npx wrangler deploy` prompt offered to install Cloudflare skills into Claude Code. **This has no effect on the standing HumanX rule:**

> `wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description.

The rule stands regardless of what Wrangler tooling is present in the environment. Apply the same standard to any new Cloudflare CLI skills.
