# D-209I — Scores-Only Consent Arc Closeout

**Arc:** D-209G (audit) → D-209H (implementation) → D-209I (closeout)
**Status:** CODE COMPLETE — PENDING OWNER MANUAL DEPLOY + LIVE SANITY
**Baseline:** 1886 passed / 0 failed / 24 (belief-engine) / 57 (route)
**HEAD at closeout:** see D-209I commit

> ⚠ **Deploy not completed by CC.** Wrangler could not reach the Cloudflare API during this session due to a certificate/proxy/VPN issue on the machine. The D-209H worker code is committed and pushed at `3dbed11`. Owner must deploy manually and complete the live sanity checklist below before this arc can be recorded as fully live.

---

## D-209G Audit Summary

D-209G documented the safest path to per-field belief visibility controls before any code was written.

Key findings from the audit:
- No `/api/belief-snapshots/:id/visibility` route existed. The only write path was `saveProfileSettings` which toggled `public_summary_enabled` (all-or-nothing).
- `visibility_json` column was live in production (migration 0016, D-209E). All rows default to null (= all sensitive groups private).
- `parseBeliefVisibility()` and `beliefVisibilityAllows()` were scaffolded and passing tests.
- The proposed route was `POST /api/belief-snapshots/:id/visibility` — authenticated, ownership-checked, scores-only allowlist, all other groups forced false.
- Highest-risk UI mistake: auto-save on toggle. The audit mandated that toggling must update preview only; only the explicit Save button may call the backend.

---

## D-209H Implementation Summary

D-209H delivered the complete scores-only consent end-to-end: backend route, public response gate, owner UI toggle, and smoke tests.

### Files changed

| File | Change |
|---|---|
| `src/worker.js` | New route + handler + widened SELECT + scores gate in `buildPublicSharedSnapshot` |
| `public/app-v10.js` | Owner toggle block, preview update, save action, public render |
| `public/styles.css` | `.me-belief-visibility-block` and `.pp-snapshot-scores` CSS families |
| `scripts/hardening-smoke-test.mjs` | 30 new D-209H tests + stale D-209E1/D-209F/D-209B tests updated |

### No migration needed

`visibility_json TEXT` was already added in migration 0016 (D-209E). D-209H required no schema change.

---

## New Route

```
POST /api/belief-snapshots/:id/visibility
```

### Rules

| Rule | Detail |
|---|---|
| Authenticated owner only | `requireUser()` called; request rejected with 401 if unauthenticated |
| Ownership verified | `SELECT id FROM belief_snapshots WHERE id=? AND user_id=? AND hidden_at IS NULL` — 404 if not found or not owned |
| `scores` may be `true` | Only if `body.scores === true` (strict equality) |
| All other groups forced false | `basic_snapshot` always true; `pattern_summary`, `alignment_labels`, `reflection_habits`, `drift_history` all hardcoded false regardless of request body |
| Unknown keys ignored | Request body is never spread; only `body.scores` is read |
| Sanitized visibility returned | Response always includes the full sanitized `visibility` object |

### Request body

```json
{ "scores": true }
```

or

```json
{ "scores": false }
```

### Response

```json
{
  "ok": true,
  "visibility": {
    "basic_snapshot": true,
    "pattern_summary": false,
    "alignment_labels": false,
    "scores": true,
    "reflection_habits": false,
    "drift_history": false
  }
}
```

---

## Public Fields When Scores Opt-In Is True

When `visibility_json.scores === true`, `buildPublicSharedSnapshot` returns:

```json
{
  "label": "owner-written label or null",
  "contradictionCount": 4,
  "createdAt": "2026-06-29T00:00:00.000Z",
  "scores": {
    "stabilityScore": 72,
    "opennessScore": 61,
    "pressureScore": 44
  }
}
```

Score fields are nested inside `result.scores`. They are never returned as top-level fields (`result.stabilityScore` etc. does not exist).

---

## Public Fields When Scores Is False / Null / Invalid

When `visibility_json` is null, invalid, or `scores` is false, `buildPublicSharedSnapshot` returns:

```json
{
  "label": "owner-written label or null",
  "contradictionCount": 4,
  "createdAt": "2026-06-29T00:00:00.000Z"
}
```

`parseBeliefVisibility()` safe default: all sensitive groups false. A null or malformed `visibility_json` is treated as "all private" — no silent over-sharing.

---

## No Auto-Save Guarantee

| Action | Backend call? |
|---|---|
| Toggle checkbox ON or OFF | No — `onchange="meBeliefVisibilityPreviewUpdate()"` updates DOM preview only |
| Click "Save public belief visibility" | Yes — `saveBeliefVisibilityUI()` via `data-action` fires `POST /api/belief-snapshots/:id/visibility` |
| Page reload without saving | Checkbox re-renders from saved `visibility_json` — unsaved changes are lost |

The save button is the sole backend writer. This was the critical consent rule from D-209G.

---

## Permanently Excluded Fields (All Consent States)

These fields are never returned in the public belief snapshot response under any conditions in this arc:

| Field | Status |
|---|---|
| `alignment_labels` | Blocked — forced false in visibility gate; no toggle exists or will exist in this arc |
| `pattern_summary` | Deferred — forced false in visibility gate; no toggle until D-209J+ audit |
| `reflection_habits` | Permanently private in this arc — forced false |
| `drift_history` | Permanently private in this arc — forced false |
| `dominant_pattern` | Never selected in `getPublicProfile` SELECT; never appears in `buildPublicSharedSnapshot` |
| `top_beliefs_json` | Never selected; never appears in code path (only in exclusion comments) |
| `topAlignmentName` | Never in public response (removed D-208B) |
| Private reflection cards | Never in public render; `meBeliefReflectionHtml` not called from `renderPublicProfileHtml` |
| `dimensions_json` | Never selected or returned |
| `raw_json` | Never selected or returned |

`buildPublicSharedSnapshot` is the single authoritative public response builder. All public belief shaping passes through it.

---

## Live Sanity Status

**PENDING OWNER MANUAL DEPLOY + LIVE SANITY**

CC was unable to deploy D-209H during the D-209I session. Wrangler (`npx wrangler deploy`) failed with a certificate mismatch error, caused by a corporate proxy or VPN intercepting TLS on this machine. The worker code is committed and pushed at `3dbed11` — no code changes are needed.

### Deploy instructions

```powershell
cd C:\Users\veltr\HumanX
git pull
npx wrangler deploy
```

Run from a terminal not subject to the VPN/proxy intercept. No migration is required.

### Manual verification checklist

Complete this checklist after deploying. Record actual results to replace this table.

| Check | Expected | Actual |
|---|---|---|
| Optional public fields section visible in Profile Settings | Present | — |
| Exactly one toggle: "Show reflection scores on public profile" | Present | — |
| Warning copy visible: "scores are reflection signals, not intelligence, morality, or truth rankings" | Present | — |
| Toggle ON → preview updates locally without backend call | Preview updates, no network request | — |
| Public profile unchanged before Save | No scores visible | — |
| Save → public profile shows label + contradictionCount + date + Reflection scores | All four present | — |
| Public profile does not show dominant pattern | Absent | — |
| Public profile does not show top alignment | Absent | — |
| Public profile does not show alignment labels | Absent | — |
| Public profile does not show religion/ideology/worldview labels | Absent | — |
| Public profile does not show private reflection cards | Absent | — |
| Public profile does not show pattern summary | Absent | — |
| Toggle OFF → Save → Reflection scores hidden on public profile | Scores absent | — |

Live PASS may only be recorded after all checks above show the expected result. Update this section and the docs/README.md entry when done.

---

## Test Baseline

| Script | Result |
|---|---|
| `hardening-smoke-test.mjs` | 1886 passed, 0 failed |
| `worker-route-static-check.mjs` | 57 passed, 0 failed, 1 warn |
| `belief-engine-static-check.mjs` | 24 passed, 0 failed |

---

## What Remains After This Arc

| Item | Status |
|---|---|
| `pattern_summary` toggle | Deferred — requires separate audit (D-209J+) before any UI implementation |
| `alignment_labels` toggle | Blocked in this arc — highest-risk group; requires dedicated audit, separate acknowledgment UI, and explicit future arc authorization |
| `reflection_habits` / `drift_history` | Permanently private in this arc |
| Any new public belief group | Requires audit + spec + explicit user authorization before implementation |
