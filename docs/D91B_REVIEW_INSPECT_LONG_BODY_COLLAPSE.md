# D-91B — Review Inspect Long-Body Collapse

**Branch:** `fix/d91b-review-inspect-long-body-collapse`
**Date:** 2026-06-08
**Type:** Frontend-only polish (branch + PR)

---

## Live problem observed

After D-90G shipped pressure moderation to production, live testing revealed that pressure
items containing long AI-generated text, pasted JSON, or multi-paragraph bodies caused the
Review Inspect panel to render a very tall, dense vertical block. Other fields (Severity,
Parent Claim, Claim ID, etc.) were pushed below the visible viewport. The same problem
existed for evidence items with long body text.

---

## What changed

### `public/app-v10.js`

**New helper — `inspectLongText(value, limit=320)`**

Added after `evidenceBodyHtml`. Takes a plain-text or JSON value and returns safe HTML:

- If `value.length ≤ 320`: returns `esc(value)` — unchanged, renders inline.
- If `value.length > 320`: returns a truncated preview (`…`) followed by a `<details>`
  block containing a `<pre>` of the full escaped text.

```js
function inspectLongText(value, limit=320) {
  const t = String(value||'').trim();
  if (!t) return '';
  if (t.length <= limit) return esc(t);
  return `${esc(t.slice(0,limit))}…<details class="inspect-long-details">
    <summary class="inspect-long-toggle">Show full text</summary>
    <pre class="inspect-long-pre">${esc(t)}</pre>
  </details>`;
}
```

**`renderReviewInspectPanel` — evidence branch**

```diff
- if(item.body)fields.push(['Body', esc(item.body)]);
+ if(item.body)fields.push(['Body', inspectLongText(item.body)]);
```

**`renderReviewInspectPanel` — pressure branch**

```diff
- if(item.body)fields.push(['Body', esc(item.body)]);
+ if(item.body)fields.push(['Body', inspectLongText(item.body)]);
```

No other fields changed. The `title`, `severity`, `parent_claim`, `stance`, `quality`,
`source_url` and all badge/link fields are unchanged.

---

### `public/styles.css`

Four new rules added after the existing `.ev-body-*` block:

```css
/* D-91B inspect long body collapse */
.inspect-long-details { margin: 4px 0 0 }
.inspect-long-toggle  { font-size:9px; text-transform:uppercase; letter-spacing:.06em;
                        color:var(--blue); cursor:pointer; opacity:.65; user-select:none }
.inspect-long-toggle:hover { opacity: 1 }
.inspect-long-pre     { font-size:9px; white-space:pre-wrap; max-height:200px;
                        overflow:auto; background:#060911; border:1px solid var(--line);
                        border-radius:6px; padding:6px; margin-top:4px;
                        line-height:1.5; color:var(--muted) }
```

**Behaviour:**
- Short bodies (≤ 320 chars): no change to existing rendering.
- Long bodies: preview truncated at 320 chars. Full text revealed on "SHOW FULL TEXT"
  click via `<details>` toggle.
- Full-text `<pre>` is capped at `max-height:200px` with `overflow:auto` — prevents
  even very long AI dumps from overflowing the panel.
- Dark theme consistent with existing `.ev-body-full` and review panel palette.
- Panel width unchanged — no layout impact.

---

## Fields covered

| Item type | Field | Covered |
|---|---|---|
| Pressure | Body | ✅ `inspectLongText` |
| Evidence | Body | ✅ `inspectLongText` |
| Truth | Statement (used as title, not a body field) | n/a |
| Claim | Claim text (used as title, not a body field) | n/a |
| All | Report reason / `latest_report_reason` | existing `review-reason-tag` span (usually short) |

---

## Static checks

```
node --check public/app-v10.js    → exit 0, no output
hardening-smoke-test.mjs          → 204 passed, 0 failed
belief-engine-static-check.mjs    → 24 passed, 0 failed (24 hard checks)
worker-route-static-check.mjs     → 39 passed, 0 failed (39 hard checks)
```

Section 33 adds 8 new hardening smoke tests (196 → 204):
1. `inspectLongText` helper exists
2. Helper uses `<details class="inspect-long-details">`
3. Helper uses `<pre class="inspect-long-pre">`
4. Pressure body field uses `inspectLongText`
5. Evidence body field uses `inspectLongText`
6. At least one non-pressure field uses `inspectLongText`
7. CSS defines `.inspect-long-details`
8. CSS has `max-height` and `overflow:auto` on `.inspect-long-pre`

---

## Safety notes

- **No backend changes.** No Worker, no D1, no Wrangler, no migration.
- **No live tests run.** Display-only change — body text is never modified, only how
  it is presented in the admin inspect panel.
- **No moderation actions.** No approve/reject/archive calls.
- **Existing `evidenceBodyHtml` unchanged.** That helper handles evidence cards in the
  Vault and Study views; `inspectLongText` is only used in the Review Inspect panel.
- **Limit 320 chars.** This preserves readability for normal pressure/evidence bodies
  while collapsing only genuinely long blocks.
