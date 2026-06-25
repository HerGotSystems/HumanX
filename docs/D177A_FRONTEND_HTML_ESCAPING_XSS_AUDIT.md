# D-177A — Frontend HTML Escaping and XSS Surface Audit

**Date:** 2026-06-25
**Local commit:** 466d81b (D-176D — Live verify error response hygiene)
**Baseline:** 1335/24/57
**Type:** Audit only. No source code changes.

---

## Scope

`public/app-v10.js` — the single minified frontend bundle. All innerHTML assignment sites, template-literal rendering, URL handling, and modal construction reviewed for unescaped user-controlled values.

---

## Helpers Audited

### `esc(s)` (line 37)

```js
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}
```

Covers all five HTML special characters: `&`, `<`, `>`, `"`, `'`. Handles null/undefined via `?? ''`. Used consistently throughout.

### `safeHttpUrl(url)` (line 83)

Uses `new URL()` API for parsing; only allows `http:` and `https:` protocols. Returns `null` for all other protocols (including `javascript:`, `data:`, `blob:`, etc.). Sound protocol gate.

### `sourceLink(url)` (line 84)

Calls `safeHttpUrl()` first. Safe URLs: `<a href="${esc(safe)}">${esc(safe)}</a>`. Unsafe URLs (null return): rendered as escaped text, not a clickable link. No injection vector.

### `toast()` (line 46)

Always uses `el.textContent = message` — never `innerHTML`. No XSS surface.

### `hxModal()` (line 47)

- `title` → `${esc(title)}`
- `confirmLabel` → `${esc(confirmLabel)}`
- `cancelLabel` → `${esc(cancelLabel)}`
- `body` → `${body||''}` — raw HTML; see F1 below.

---

## Rendering Surfaces Audited

### Evidence and text helpers

| Function | Line | User fields | Escaping |
|---|---|---|---|
| `evidenceBodyHtml()` | 91 | `preview`, `t` (text body) | `esc()` in both JSON and plain paths; `<pre>` content escaped |
| `inspectLongText()` | 92 | `t` (long text) | `esc()` in both short and expanded paths; `<pre>` escaped |
| `listBits()` | 93 | array items | `esc(x)` per item |
| `evidenceItem()` | 362 | `e.title`, `e.body/note`, `e.link_note`, `e.source_url` | `esc(e.title)`, `evidenceBodyHtml()`, `esc(e.link_note)`, `sourceLink()` |
| `analysisItem()` | 363 | `verdict`, `src`, `summary`, support/pressure/tests lists | all through `esc()`; lists through `listBits()` |

### Account and profile rendering

| Function | Line | User fields | Escaping |
|---|---|---|---|
| `meAccountCardHtml()` | 214 | `display_name`, `handle`, `email`, `id` | all through `esc()` |
| `meProfileSettingsHtml()` | 245 | `slug` (input value), `bio` (textarea) | `esc(slug)`, `esc(bio)` |
| `meProfilePreviewBodyHtml()` | 238 | `slug`, `bio`, counts | `esc(slug)`, `esc(shortText(bio,240))`, `esc(count)` |
| `meSharedSnapshotCardHtml()` | 232 | `label`, `dominantPattern`, `topAlignmentName`, `contradictionCount` | all through `esc()` |
| `meProfilePreviewSampleHtml()` | 225 | `s.type`, `s.text` | `esc(s.type)`, `esc(s.text)` |
| `renderPublicProfileClaimsHtml()` | 251 | claim text, category, claim ID (in onclick) | `esc(shortText(...))`, `esc(c.category)`, `esc(c.id)` |
| `renderPublicProfileTruthsHtml()` | 252 | statement text, category | `esc(shortText(...))`, `esc(t.category)` |
| `renderPublicProfileEvidenceHtml()` | 253 | evidence title, quality label | `esc(shortText(e.title,...))`, `esc(evidenceQualityLabel(...))` |

### Study view and claim arena

| Function | Line | User fields | Escaping |
|---|---|---|---|
| `renderStudy()` | 357 | `selected.claim`, `selected.status`, `selected.category`, `selected.type`, `selected.handle` | `esc(cleanClaimLabel(...))`, meta parts through `.map(esc).join(...)`, `esc(selected.status)` |
| `renderCaseMini()` | 358 | `selected.claim`, review state label | `esc(cleanClaimLabel(...))`, `esc(rsLabel)` |
| `sectionLineage()` | 364 | truth statement, bridge_note/origin, counts | `esc(cleanClaimLabel(t.statement))`, `esc(t.bridge_note...)`, `esc(l.*)` |
| `claimQualityHints()` | 314 | hint messages | hardcoded strings, not user data |
| `updateClaimQualityHints()` | 315 | hint messages | `esc(h.msg)` (hardcoded strings) |
| `runPackSummary()` | 352 | status label, status hint | `esc(statusLabel)`, `esc(statusHint)` — values are controlled constants |
| `renderExport()` | 353 | `selected.claim`, `selected.status`, `lastPacket` (JSON) | `esc(cleanClaimLabel(...))`, `esc(selected.status)`, `esc(lastPacket)` in `<pre>` |

### Review queue rendering

| Function | Line | User fields | Escaping |
|---|---|---|---|
| `reviewCard()` | 321 | type, state, id, title, meta parts, handle, report reason, report count, updated age | all through `esc()`; meta parts via `.map(esc)`; hint title attribute through `esc(qhints.map(...).join(' · '))` |
| `renderReviewInspectPanel()` | 339 | title, type, state, all metadata fields, user_id, builder context fields, near_duplicate_of, linked_claim_id, quality hints | all through `esc()`; builder context (rawText, whyUserThinksThis, scope, pressureOrFalsifier, flags) all through `esc()` |
| `renderReviewInspectContext()` | 318 | title, type, state, rows (all metadata k/v pairs), builder context fields | `esc(k)`, `esc(v)` on all rows; builder context all through `esc()` |
| `reviewBuilderContextHtml()` | 338 | rawText, whyUserThinksThis, scope, pressureOrFalsifier, system flags (both structured and legacy paths) | all through `esc()` |
| `reviewCard()` | 321 | onclick IDs (type, id) | `esc(type)`, `esc(id)` — server-generated values; see F2 |
| `renderReviewList()` | 320 | filter bar labels, help text | `esc(help)` — help text from `reviewFilterHelpText()` (hardcoded strings) |
| `renderReviewAuditSummary()` | 335 | all stat labels and counts | labels are hardcoded; counts are numbers |

### Admin panel (admin-token-gated)

| Function | Line | User fields | Escaping |
|---|---|---|---|
| `renderReview()` | 299 | admin token value in `<input>` | `esc(token)` — reads from localStorage |
| `createInviteCodeUI()` | 305 | invite code, `createdAt` date string | `esc(code)`, `esc(createdAt)` |

### Error display

| Function | Line | User fields | Escaping |
|---|---|---|---|
| `renderError()` | 400 | `e.message` or `e` | `esc(e.message\|\|e)` |
| `renderMe()` error | 297 | `e.message` | `esc(e.message\|\|e)` |
| `renderReview()` error | 299 | `e.message` | `esc(e.message\|\|e)` |

---

## Findings

### F1 — `hxModal` body is caller-constructed raw HTML (Low / Acceptable)

**Location:** line 47 (`hxModal`) and callers at lines 346–347.

**Detail:** `hxModal` inserts its `body` parameter as `${body||''}` with no further escaping — body is expected to be pre-built HTML. The two callers are:

- `markDuplicateUI` (line 346): builds body with `esc(label)` where `label` is the first 48 chars of the claim body — properly escaped.
- `resolveSimilarUI` (line 347): builds body with `esc(nearDup)` where `nearDup` is a server-generated claim ID — properly escaped.

**Current risk:** None — both callers correctly escape user-controlled values before inserting them into the body string.

**Latent risk:** A future caller that forgets to escape dynamic values in the body string would create an XSS vector. The function signature gives no indication that body is raw HTML.

**D-177B recommendation:** Add a one-line comment to `hxModal` marking `body` as raw HTML requiring pre-escaped content. No functional change needed.

---

### F2 — `onclick` string literals use `esc()` on server-generated IDs (Informational)

**Location:** Widespread — reviewCard (line 321), renderReviewInspectPanel (line 339), renderPublicProfileClaimsHtml (line 251), createInviteCodeUI (line 305), and others.

**Detail:** Pattern: `onclick="f('${esc(id)}')"`. `esc()` converts `'` → `&#039;`. After HTML attribute decoding, `&#039;` becomes `'` in the JavaScript string, which would break the JS string if the value contained a literal single quote.

**Current risk:** None — all values passed through this pattern are server-generated IDs (`clm_...`, `tru_...`, etc., using `makeId()` which produces alphanumeric+underscore only) or hardcoded enum strings (`claim`, `truth`, `evidence`, `pressure`, `public`, `rejected`, `review`). These never contain quotes.

**D-177B recommendation:** Informational only. If ID format ever changes to include arbitrary user-supplied characters, the onclick string pattern should be replaced with `data-*` attributes plus event delegation.

---

## Verdict

No critical or high-severity XSS vulnerabilities found.

`esc()` is applied consistently and correctly across all user-controlled text fields in every rendering surface audited:
- Account and profile fields (display_name, handle, email, bio, slug)
- Claim, truth, evidence, and pressure content (body, title, statement, category)
- Review queue (all metadata, builder context, report reason, quality hints)
- Analysis results (verdict, summary, source)
- Error messages
- Admin invite codes

URL sanitization via `safeHttpUrl()` is sound. `sourceLink()` correctly applies both. `toast()` uses `textContent`. No raw `innerHTML` assignments of unescaped user content were found.

The two advisory findings (F1, F2) require no immediate action and no functional code change. They are documented for D-177B consideration.

---

## No Source Code Changes

D-177A is an audit-only checkpoint. `public/app-v10.js` and all source files are unchanged. Baseline 1335/24/57 is expected to be confirmed unchanged by test run.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect.

---

## Recommended Next Step

D-177B — Optional: add `hxModal` body documentation comment (F1, cosmetic/discipline only). Or advance to next audit topic.
