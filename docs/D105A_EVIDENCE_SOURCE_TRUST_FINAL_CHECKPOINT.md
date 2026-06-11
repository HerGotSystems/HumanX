# D-105A — Evidence / Source Trust + Security Arc: Final Checkpoint

**Date:** 2026-06-10
**Mode:** Docs-only checkpoint — no code, no backend/D1/Wrangler/live mutation.

> Start here to understand the D-103/D-104 evidence-display + source-URL safety work: what changed, what is live, what was intentionally not done, and the rules that must not be regressed.

---

## A. Current State

| Field | Value |
|---|---|
| **Repo HEAD** | `446892e` — D-104H record Worker source URL validation deployment |
| **Latest deployed Worker version** | `0bb54517-ea0d-4c46-9198-eb131a31fb46` (Wrangler 4.100.0) |
| **Worker / URL** | `humanx` · https://humanx.veltrusky-michal.workers.dev |
| **Static baseline** | **357 / 24 / 48** (hardening-smoke / belief-engine / worker-route — all pass) |

### Worker version lineage across this arc
| Worker version | Shipped |
|---|---|
| `f9895422` | D-103B evidence quality/source display |
| `eb055ee3` | D-104B frontend `sourceLink` render sanitisation |
| `0bb54517` | D-104F Worker `httpUrlOrNull` storage validation (current) |

---

## B. D-103 — Evidence Quality / Source Display (D-103A audit → D-103B patch → D-103C/D deploy)

- `evidenceQualityLabel(q)` — `vibes` displays as **"weak argument"**; others unchanged; unknown falls back safely.
- `evidenceQualityClass(q)` — tiered styling on the quality pill: **strong** (repeatable/documented) green, **mid** (media/testimony) muted blue, **weak** (vibes) caution-yellow, **neutral** (unknown) muted. Weak evidence is now visually distinct from documented.
- Missing source renders muted **"no source provided"** (was silent).
- Reused compact evidence inherits label/class/source display.
- Score (`meter`) and verdict (`cls`) logic untouched; no "verified/trusted" wording; stored quality values unchanged.

## C. D-104 (frontend) — `sourceLink` Render Sanitisation (D-104A audit → D-104B patch → D-104C/D deploy)

- **Fixed a HIGH-severity stored-XSS vector:** `sourceLink` previously put `esc(url)` straight into `href` for any scheme — `javascript:`/`data:`/etc. were clickable, and the first clicker is typically an admin-token-holding moderator.
- `safeHttpUrl(url)` — `new URL()` in try/catch, returns the URL only for `http:`/`https:`, else null.
- `sourceLink` branches: empty → "no source provided"; safe http/https → escaped anchor (`target="_blank" rel="noopener noreferrer"`); anything else → **escaped non-clickable text** with neutral note "not clickable — not a valid web address".
- Render-time guard protects **all display paths including pre-existing unsafe D1 rows**.

## D. D-104 (Worker) — `sourceUrl` Storage Validation (D-104E audit → D-104F patch → D-104G/H deploy)

- `httpUrlOrNull(url)` — `cleanText(url,500)` → `new URL()` in try/catch → returns the URL only for `http:`/`https:`, else null.
- `POST /api/evidence` routes `body.sourceUrl` through it; invalid/non-web/malformed values are **coerced to null** before D1 insert — the evidence still attaches.
- Single public write path covered; pressure has no `source_url` column; vault/attach/reuse are read-or-reuse only; importer (owner-controlled) intentionally unchanged.
- No schema change, no migration, no cleanup of existing rows.

---

## E. Live Safety Guarantees (both layers active)

| Guarantee | Enforced by |
|---|---|
| Non-http(s) source values are never clickable (`href`) | D-104B render guard (`eb055ee3`) — covers all rows incl. legacy |
| New non-http(s) source values never enter `evidence.source_url` | D-104F storage validation (`0bb54517`) |
| Weak evidence is visually distinguishable from strong | D-103B quality tiers (`f9895422`) |
| Missing source is shown, not hidden | D-103B "no source provided" |
| Invalid optional source never blocks evidence submission | D-104F coerce-to-null |
| Frontend and Worker both restrict source URLs to http/https | D-104B + D-104F (cross-layer test, Section 47) |

---

## F. Explicit Non-Goals (intentionally NOT done)

- ❌ No source **verification** claim — presence ≠ verified
- ❌ No "trusted"/"verified" source badges
- ❌ No domain blocklists/allowlists
- ❌ No link previews / server-side source fetching (SSRF risk)
- ❌ No D1 cleanup or migration of existing `source_url` rows
- ❌ No hiding/filtering/deleting of evidence with weak or invalid sources

---

## G. Do-Not-Regress Rules

1. **Never put an unvalidated source value into an `href`.** All clickable source links must pass `safeHttpUrl` (frontend) — and storage must pass `httpUrlOrNull` (Worker).
2. **Frontend and Worker must both stay http/https-only** for source URLs. Changing one without the other breaks the defense-in-depth invariant (locked by hardening Section 47).
3. **Invalid optional source must not block evidence submission** unless product policy explicitly changes (current behavior: coerce-to-null, evidence still attaches).
4. **Do not confuse source *presence* with source *reliability*.** The UI shows whether a link exists, never whether it is trustworthy.
5. **Do not call weak evidence "fake".** Quality tiers describe submitted-evidence strength ("weak argument"), not falsity.
6. **Do not call source-provided "verified".** No verification/trust wording anywhere in the source/evidence path.

---

## H. Optional Future Audits (none scheduled, none required)

- **Read-only legacy `source_url` row audit** — quantify any pre-existing non-http(s) rows (display already safe via D-104B; remediation, if ever wanted, exact-ID via review path, never bulk/migration).
- **Export / RunPack source rendering audit** — confirm exported packets present source URLs safely/neutrally.
- **Admin-token rotation pass** — operational hygiene for the moderation token.
- **Moderation queue smoke review** — periodic check of the Review workflow end to end.

---

## I. Confirmation

> Docs-only checkpoint. No deploy, no Wrangler, no D1, no admin/moderation action, no backend/schema change. No live data mutated.

---

## J. Static Check Results

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **357 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **24 passed, 0 failed (24 hard checks)** |
| `node scripts/worker-route-static-check.mjs` | **48 passed, 0 failed (48 hard checks)** |
