# D-104D — Live Deployment Verification

**Date:** 2026-06-10
**Mode:** Deployment record only — no Wrangler run, no D1, no mutations performed in this task.

---

## Deployment Facts

| Field | Value |
|---|---|
| **Deployed by** | User — local `npx wrangler deploy` from `cd /c/Users/veltr/HumanX` |
| **Branch at deploy** | `main` |
| **Main HEAD at deploy** | `cb04a87` — Merge pull request #123 from HerGotSystems/fix/d104b-source-url-sanitisation |
| **Feature commit** | `eabebaa` — D-104B sanitise evidence source links |
| **Worker name** | `humanx` |
| **Worker URL** | https://humanx.veltrusky-michal.workers.dev |
| **Deployed Version ID** | `eb055ee3-7dd2-4a4d-8792-0518eacb078b` |
| **Wrangler version** | 4.100.0 |
| **Deployment method** | local `npx wrangler deploy` |
| **Assets read** | 15 files from `public/` |
| **Assets uploaded** | 1 — `/app-v10.js` (12 assets already uploaded) |
| **D1 binding** | Present in wrangler.toml — `env.DB` (humanx) — no migration run, no mutation performed |
| **ASSETS binding** | Present — `env.ASSETS` |

---

## Deployed Feature (D-104B)

**Evidence source link sanitisation — security fix.**

Frontend-only change closing the D-104A HIGH-severity stored-XSS vector:

| Change | Description |
|---|---|
| `safeHttpUrl(url)` helper | Parses with `new URL()` in try/catch; returns the URL only if scheme is `http:`/`https:`, else `null` |
| `sourceLink` rewrite | Three branches — empty → "no source provided"; safe http/https → escaped anchor; anything else → escaped plain text, **no href**, with "not clickable — not a valid web address" |
| Render-time guard | Protects all display paths (study row, vault card, reused compact) including any malicious values already stored in D1 |
| Source verification | none added — neutral, format-based wording only |

No backend routes changed. No schema changed. No D1 migration run. No moderation logic changed. Stored source data untouched.

---

## Live Verification

Confirmed by user after deploy:

| Expected live security behavior | Observed |
|---|---|
| Empty source renders "no source provided" | ✅ confirmed |
| `http:` / `https:` source values render as clickable links | ✅ confirmed |
| `javascript:`/`data:`/`vbscript:`/`blob:`/`file:`/protocol-relative/scheme-less/malformed do NOT render as clickable hrefs | ✅ confirmed |
| Unsafe/non-web source renders escaped plain text with "not clickable — not a valid web address" | ✅ confirmed |
| `rel="noopener noreferrer"` remains on valid source links | ✅ confirmed |
| D-103B evidence quality display intact | ✅ confirmed |
| No "verified source" / "trusted source" wording added | ✅ confirmed |
| No source data mutated/deleted | ✅ confirmed |

---

## Safety Confirmation (this record task)

| Safety check | Status |
|---|---|
| No D1 migration run | ✅ confirmed |
| No database mutation during this record task | ✅ confirmed |
| No admin token used | ✅ confirmed |
| No admin/moderation action during this record task | ✅ confirmed |
| No claim approved/rejected/archived | ✅ confirmed |
| No source data mutated/deleted | ✅ confirmed |
| No schema change | ✅ confirmed |
| No backend/Worker code change | ✅ confirmed |
| Docs-only delta in this task | ✅ confirmed |

---

## Static Checks at Verification (main HEAD `cb04a87`)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **353 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |

---

## Security Status

This deploy closes the **HIGH-severity stored-XSS / admin-targeting vector** identified in D-104A: non-http(s) source URLs (`javascript:`, `data:`, etc.) can no longer reach an anchor `href`. The guard is applied at render time, so it also neutralises any malicious source value that may already be stored in D1.

**Defense-in-depth follow-up (open):** **D-104C / BE-1** — server-side `sourceUrl` scheme validation on `/api/evidence` + `/api/pressure` so non-http(s) values never persist in D1, plus a read-only audit of existing `source_url` rows. This is a Worker change and remains a separate, not-yet-scheduled task.

---

## Operational Note — Wrangler/D1 Explicit-Approval Rule

`wrangler deploy`, `wrangler d1 execute`, and all live-write/deploy variants remain **off-limits** unless the user explicitly requests them in the task description. This rule is unchanged by D-104B/D and applies to every future task.
