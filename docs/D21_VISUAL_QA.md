# D-21 Visual QA Checklist

Date: 2026-06-06
Scope: D-15 through D-20 regression audit

---

## Result: No visual regressions found

All five focus areas passed. No code changes required. Docs-only checkpoint.

---

## 1. Review Queue inspect panel

- [x] Position indicator (`N of M · X hints`) visible — `.review-nav-pos` correctly uses `flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`
- [x] Prev/Next buttons readable — `flex-shrink:0;white-space:nowrap` prevents squish
- [x] Top action bar not cramped — `display:flex;gap:6px;flex-wrap:wrap` wraps at medium width
- [x] Reject confirm message (`flex:1 1 100%`) breaks to its own line cleanly above confirm/cancel buttons
- [x] Bottom action row present and styled — `border-top:1px solid var(--line);flex-wrap:wrap`
- [x] At `max-width:600px`: top and bottom action rows both go `flex-direction:column`
- [x] Hint count text ("2 hints") appended to position string — compact, no overflow

## 2. Study mode evidence sections

- [x] Direct evidence rendered as full `evidenceItem()` rows — primary visual weight
- [x] Reused evidence ≥4: outer `<details class="reused-collapse-outer">` collapsed by default
- [x] Reused evidence ≤3: `<div class="reused-block">` compact row format, visually distinct (blue tint, smaller font)
- [x] Reused group summary wording: "Reused from vault · N source claims · click to expand"
- [x] No broken `<details>` nesting — outer collapse contains inner source-group details correctly

Note: `reusedEvidenceHtml` contains unreachable `return subHead+groupsHtml` after the `if(reused.length>=4)` branch — dead code, not a visual issue.

## 3. Investigation Packet / RunPack page and sidebar

- [x] Workflow guide (`rp-workflow-guide`) wraps cleanly at narrow widths; arrows hidden at `max-width:600px`
- [x] "Technical packet JSON" `<details>` renders with `▸ / ▾` toggle, collapsible output block
- [x] Sidebar `#aip-status` stable — D-20 added `min-height:32px` prevents layout jump between idle/ready/fallback states
- [x] Label consistency:
  - Export page h2: "Investigation Packet" ✓
  - Export page button (no packet): "Create Investigation Packet" ✓
  - Export page button (packet exists): "Recreate Packet" ✓
  - Sidebar button: "Build RunPack" ✓ (intentional RunPack shorthand — unchanged since D-18)
  - "Copy Packet" ✓
  - "Download Packet" ✓
  - "Load AI Analysis Return" ✓

## 4. Study side dock

- [x] "Attach Evidence / Pressure" (D-20A rename) fits in `font-size:9px;text-transform:uppercase` section head
- [x] Report section microcopy renders as `small review-first-note` — italic, muted, not bulky
- [x] Investigation Packet action buttons (`Build RunPack`, `Copy Packet`) styled via `#side-tools .actions button`
- [x] No overlapping controls — `claimbox` grid and `actions` flex separations intact

## 5. Mobile/narrow layout

- [x] `#side-tools .actions` at `max-width:900px`: `flex-direction:column` + `button{width:100%}` (D-20D) — buttons stack full-width
- [x] Review inspect top action bar at `max-width:600px`: `flex-direction:column` — no cramping
- [x] RunPack workflow guide at `max-width:600px`: arrows (`rp-wf-arr`) hidden, steps wrap
- [x] No horizontal overflow sources introduced by D-15 through D-20 additions

---

## Known-good static checks at D-21 (no code changes, not re-run — carried from D-20)

| Script | Status |
|--------|--------|
| `node --check public/app-v10.js` | pass |
| `hardening-smoke-test.mjs` | 91 passed, 0 failed |
| `belief-engine-static-check.mjs` | 24 passed, 0 failed |
| `worker-route-static-check.mjs` | 35 passed, 0 failed |
