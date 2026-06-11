# D-104F — Worker-Side Source URL Validation

**Date:** 2026-06-10
**Scope:** Backend / Worker — `src/worker.js`. Plus static coverage (`worker-route-static-check.mjs`, `hardening-smoke-test.mjs`) and docs. No schema change, no D1, no Wrangler.
**Static baseline:** 353 / 24 / 39 → **357 / 24 / 48**
**Audit basis:** D-104E worker-side sourceUrl validation audit

---

## What Changed

### 1. New Worker helper `httpUrlOrNull(url)`

Added in `src/worker.js` immediately after `cleanText`:

```js
function httpUrlOrNull(url) {
  const s = cleanText(url, 500);
  if (!s) return null;
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
  } catch (_) {
    return null;
  }
}
```

- Reuses `cleanText(url, 500)` first, preserving the existing control-char strip + length cap.
- Parses with WHATWG `new URL()` inside try/catch (available in the Workers runtime).
- Returns the normalised URL **only** for `http:` / `https:`; everything else → `null`.
- No auto-prefixing, no domain blocklists, no verification/trust claims.

### 2. `/api/evidence` write path

```js
// before
insertEvidence(env, …, cleanText(body.sourceUrl || '', 500));
// after
insertEvidence(env, …, httpUrlOrNull(body.sourceUrl));
```

A non-http(s) or malformed `sourceUrl` is now **coerced to `null`** before storage — the evidence (title/body/quality/stance) still attaches; only the unsafe URL is dropped.

### 3. Importer

**Not changed.** Per D-104E, the importer is owner-controlled, lower-risk, and has its own SOURCE_NEEDED presence guard. Routing it through the helper was optional; it is documented here as a deliberate skip to avoid overbuilding. The single public write path (`/api/evidence`) is covered.

### 4. Routes / fields covered

| Path | Covered |
|---|---|
| `POST /api/evidence` (public user `sourceUrl`) | ✅ validated via `httpUrlOrNull` |
| `POST /api/pressure` | n/a — no `source_url` column (verified unchanged) |
| vault / attach / reuse / serialise | n/a — read-or-reuse only, no new URL persisted |
| importer seed `source_url` | owner-controlled — intentionally not changed |

---

## Why Backend Validation Is Defense-in-Depth After D-104B

D-104B fixed **rendering**: `sourceLink` never emits a non-http(s) `href`, protecting every display path including any unsafe rows already in D1. D-104F fixes **storage**: new unsafe values never enter `evidence.source_url` in the first place. Together: even a future consumer that does *not* go through `sourceLink` (exports, RunPack, AI ingestion) gets clean data. Neither layer depends on the other — both independently restrict source URLs to http/https.

## Why Invalid URLs Coerce to Null (Not Reject)

The source URL is an **optional** field. Hard-rejecting the whole evidence submission over one bad optional value would lose the user's actual evidence (body/title/quality) and block prose accidentally pasted into the URL slot. Coercing to `null` keeps the evidence attaching and lets the frontend render "no source provided" — matching the established no-source behavior and the "don't break legitimate submissions" principle. Existing D1 rows are untouched.

---

## Non-Goals (unchanged from D-104E)

- ❌ No D1 cleanup of existing rows
- ❌ No migration / schema change
- ❌ No source verification / "trusted source" claims
- ❌ No domain blocklists/allowlists or link previews
- ❌ No hiding/deleting evidence with bad URLs

---

## Tests Added

### `worker-route-static-check.mjs` (39 → 48 hard checks)
- `httpUrlOrNull` helper defined
- uses `new URL()` inside try/catch
- whitelists only http:/https:
- returns null for disallowed/invalid (coerce-to-null)
- `/api/evidence` routes `body.sourceUrl` through `httpUrlOrNull`
- `/api/evidence` no longer inserts raw `cleanText(body.sourceUrl)`
- pressure_points insert still has no `source_url` (unchanged)
- no verification/trust wording in Worker
- no evidence schema/migration change

### `hardening-smoke-test.mjs` (353 → 357) — Section 47 cross-layer locks
- frontend `safeHttpUrl` (D-104B) remains present
- Worker `httpUrlOrNull` present
- both layers whitelist only http:/https:
- evidence route validates `body.sourceUrl` (no raw cleanText insert)

The README worker-route count assertion was extended to accept 48.

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 353 passed, 0 failed | **357 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **48 passed** |

---

## Safety Confirmation

| Check | Status |
|---|---|
| No D1 migration | ✅ |
| No database mutation | ✅ — existing rows untouched |
| No live write | ✅ |
| No deploy | ✅ |
| No admin/moderation action | ✅ |
| No schema change | ✅ — no new column, no ALTER |
| No source verification claim | ✅ |
| Evidence submission preserved when source invalid | ✅ — coerce-to-null |
