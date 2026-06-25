# D-169A — Frontend Storage and Token Handling Audit

**Date:** 2026-06-25
**Scope:** `public/app-v10.js` — storage keys, session bootstrap, token flows, rendering surfaces, export, docs.
**Type:** Audit only. No source code changes.

---

## Executive Summary

The frontend storage and token-handling surfaces are substantially sound. Admin token handling follows best-practice discipline: stored in localStorage under a dedicated key, read at call site only, sent only via `x-humanx-admin`, never printed or logged, input rendered `type="password"`. The owner-token surface is consistent with the D-149H advisory-only policy — merged from session response into `localStorage` user object, sent as `x-humanx-owner-token`, never rendered in the UI.

Three findings are documented below. All are low-to-medium risk. None are catastrophic secret leaks requiring immediate emergency patch. Two are recommended for D-169B:

1. **F1 (medium):** The My HumanX account card renders `User ID` and `email` values into the DOM for the authenticated owner — these are not public, but are visible to the owner's browser. Email is only rendered when `verified`, and user ID is only shown in the `me` panel to the account holder. Acceptable, but could be narrowed.
2. **F2 (low):** `downloadJSON()` exports `user` (includes `ownerToken` if set in memory) as part of the "download all visible data" JSON dump. The exported file includes `user.id`, `user.handle`, and potentially `user.ownerToken`.
3. **F3 (low, advisory):** The review inspect panel exposes `user_id` in the admin review UI (`renderReviewInspectPanel`) as a "provenance UID" — intentional for moderation, but the field name and context should be noted.

---

## Storage Key Matrix

| Key | Constant | Content stored | Who reads it | Risk |
|---|---|---|---|---|
| `humanx_public_user_v1` | `LS_USER` | `{ id, handle, ownerToken? }` — pseudonymous user object merged from `POST /api/session` | `localUser()`, `ensureSession()`, `headers()`, `downloadJSON()` | Low — pseudonymous. `ownerToken` is advisory (D-149H). Not sent to any third party. |
| `humanx_admin_token_v1` | `LS_ADMIN` | Admin token string (raw) | `adminToken()`, `adminHeaders()`, `renderReview()` | Medium — admin token is a real credential. Stored in plain localStorage (no cookie httpOnly protection). Input `type="password"`. Never printed, logged, or rendered in DOM (only as `value` attribute in the password input which browser does not display). Acceptable for current single-admin model. |

No other `humanx_*` localStorage keys are created in `app-v10.js`.

---

## Token Flow Matrix

### Admin Token

| Surface | How used | Risk |
|---|---|---|
| `LS_ADMIN` localStorage | Stored as raw string on `saveAdminTokenAndLoadReview()` | Medium — see storage key matrix |
| `adminToken()` | Returns `localStorage.getItem(LS_ADMIN) \|\| ''` — read-only getter | Acceptable |
| `adminHeaders()` | `{ ...headers(), 'x-humanx-admin': adminToken() }` — merged at call site | Acceptable |
| Review input `<input id="adminToken" type="password">` | `type="password"` — masked in browser UI; never auto-logged | **Correct** |
| `clearAdminToken()` | `localStorage.removeItem(LS_ADMIN)` — clean removal | **Correct** |
| `console.*` calls | **None found** | **Correct** |
| DOM text injection | Token value is never inserted into DOM as text | **Correct** |
| `downloadJSON()` | Admin token is not included in the visible-data export | **Correct** |
| `renderReview()` output | The token value is used only as a form field's `value` attribute on the password input — it populates the masked field, not visible text | **Correct** |

### Owner Token

| Surface | How used | Risk |
|---|---|---|
| `LS_USER` localStorage | Stored as `user.ownerToken` inside the user JSON object | Low — advisory only per D-149H |
| `headers()` | `'x-humanx-owner-token': user?.ownerToken \|\| ''` — empty string when absent | Acceptable |
| `ensureSession()` | `if (s.owner_token) user.ownerToken = s.owner_token; localStorage.setItem(LS_USER, ...)` — merged silently | **Correct** — comment explicitly says "never logs or returns the token value" |
| DOM rendering | Owner token value is **never rendered** in any UI panel or text node | **Correct** |
| `console.*` calls | **None found** | **Correct** |
| `downloadJSON()` | **F2** — see Finding F2 below | Low risk — see detail |

### Session / User Identity

| Surface | How used | Risk |
|---|---|---|
| `LS_USER` | `{ id, handle, ownerToken? }` — pseudonymous only | Acceptable |
| `headers()` | `'x-humanx-user': user?.id \|\| ''` | Acceptable — pseudonymous |
| `boot()` | `document.getElementById('who').textContent = user.handle` | **Correct** — displays handle, not ID |
| `accountPanelHtml()` — anonymous state | Shows `User ID: <code>${uid}</code>` to the anonymous account holder only | Acceptable — owner-facing only |
| `meAccountCardHtml()` | Shows `User ID: <code>${u.id}</code>` and (if verified) `<p>${u.email}</p>` to the authenticated owner | **F1** — see Finding F1 below |
| Public profile rendering (`renderPublicProfileHtml`) | Shows only `displayName`, `slug`, `bio`, public counts, public claim/truth/evidence titles — no `id`, no `email`, no `is_admin`, no `is_shadow_banned` | **Correct** |

---

## Frontend Rendering Verdict

### No `console.*` calls
Confirmed: zero `console.log`, `console.error`, `console.warn`, `console.debug` calls in `app-v10.js`. **Pass.**

### Admin token input type
`<input id="adminToken" type="password" ...>` — confirmed `type="password"`. **Pass.**

### Token values not inserted into DOM as text
Admin token: confirmed absent from all HTML template strings. Owner token: confirmed absent from all HTML template strings. **Pass.**

### Owner token not displayed in UI
`user.ownerToken` is set in memory and localStorage; it is never passed to any template string, `esc()` call, or DOM text node. **Pass.**

### Invite code display after redemption
On successful `redeemInviteUI()`, only a toast message is shown: `'Invite code and email are required.'` or `'Invite redeemed — account verified.'`. The invite code input value is not echoed back into the DOM. **Pass.**

Admin invite creation via `createInviteCodeUI()` is intentionally gated behind `adminToken()` check and only reachable inside the Review tab. The generated invite code is rendered in `adminInviteResult` div as `<code>${esc(code)}</code>` with a Copy button. This is intentional — the admin panel is the controlled distribution surface. **Intentional/Acceptable.**

### Public profile does not expose user ID / email / admin / shadow fields
`renderPublicProfileHtml()` renders only: `displayName`, `slug`, `bio`, public activity counts, public claim texts, truth statements, evidence titles, pressure titles, and shared snapshot scores. No `id`, `email`, `is_admin`, `is_shadow_banned`, or owner/admin token. **Pass.**

### RunPack / export does not include admin or owner token
`generateRunPack()` — builds packet from claim data only; does not include `user` object, admin token, or owner token. **Pass.**

`downloadRunPack()` — downloads `lastPacket` which is the RunPack JSON only. **Pass.**

`downloadJSON()` — **F2** — see below.

---

## Findings

### F1 — `meAccountCardHtml()` renders User ID and email to the authenticated owner

**File:** `app-v10.js` line 214 — `meAccountCardHtml()`

**What is shown:**
```js
// Anonymous state:
`<p class="small account-detail-sub">User ID: <code>${uid}</code></p>`

// Verified state:
`<p class="small me-account-sub">${esc(u.email)}</p>`  // email (verified users only)
`<p class="small me-account-sub">User ID: <code>${esc(u.id||'')}</code></p>`
```

**Who can see it:** Only the authenticated account holder viewing their own My HumanX panel. No public surface, no other user can see this.

**Classification:** Intentional, acceptable. This is the owner-facing account dashboard displaying the user's own account metadata back to them. The email is only shown after the user themselves submitted it during invite redemption.

**Risk:** Low. Not a leak to third parties or other users.

**D-169B action:** Optional — could hide the full user ID from the UI (show only last 6 chars, or omit it entirely from this card since users don't need it for any product action). Email in My HumanX is intentional and acceptable as-is. Low priority.

---

### F2 — `downloadJSON()` exports `user` object which may include `ownerToken`

**File:** `app-v10.js` line 394 — `downloadJSON()`

```js
function downloadJSON(){
  const blob = new Blob(
    [JSON.stringify({user, claims, evidenceVault, truths, beliefSnapshots, graphStatus}, null, 2)],
    {type:'application/json'}
  );
  ...
}
```

**What is exported:** The in-memory `user` object, which is `{ id, handle, ownerToken? }`. If `ensureSession()` has completed and the backend returned an owner token, `user.ownerToken` is included in this download.

**Who can access it:** Only the user themselves, via a deliberate "Download all visible data JSON" action hidden under a `<details>` element in the RunPack/Export tab.

**Classification:** Questionable — the download is intentionally user-facing, but including `ownerToken` (a credential, even advisory-only) in a data-export file is a leak surface. A user could inadvertently share this file, paste it into an AI analysis, or have it intercepted.

**Risk:** Low. The owner token is D-149H advisory-only (no endpoint rejects on absence). But it is still a credential that could be used to make requests appear to come from a specific user.

**D-169B action:** Recommended — strip `ownerToken` from the `downloadJSON()` export. Pass `{ id: user.id, handle: user.handle }` rather than the full `user` object. Admin token is correctly absent; same discipline should apply to ownerToken.

---

### F3 — Review inspect panel renders `user_id` as "User ID" (admin-gated, intentional)

**File:** `app-v10.js` line 339 — `renderReviewInspectPanel()`

```js
if(item.user_id)fields.push(['User ID', `<code class="review-inspect-id review-provenance-uid">${esc(item.user_id)}</code>`]);
```

This appears for claims, truths, evidence, and pressure items in the admin review panel.

**Who can see it:** Only the admin, behind the `adminToken()` gate. The review queue API itself requires `x-humanx-admin` — the user_id returned in review queue items comes from a `requireAdmin`-gated backend route.

**Classification:** Intentional, acceptable. The review queue returns full rows for moderation context by design (noted in D-168B). This is admin-only provenance data for tracking duplicates and test-account content.

**Risk:** None — correctly admin-gated. D-169B action: none required.

---

## Docs / Checkpoint Verdict

Live-verify documents inspected: D-148C, D-149E, D-154B, D-156A–D-164D, D-166D, D-168D.

**No admin token values, owner token values, invite codes, or real user IDs found in any docs file.** All live-verify docs that created throwaway sessions state "user id is redacted from this document per security rules" and do not paste the ID.

**No Cloudflare beacon or telemetry tokens found in docs.**

**No raw JSON response bodies with sensitive fields pasted into docs.**

One docs file (`D-104A`) discusses the admin-token as a victim of a historical stored-XSS vector — this is a description of the risk, not a token value, and the vulnerability was patched (D-104B: `safeHttpUrl()`). Acceptable.

---

## Account Panel / Invite Redemption

- Account panel (`accountPanelHtml()`) in the public header shows invite code redemption form but never echoes the submitted code value back into the DOM.
- `redeemInviteUI()` posts code to `/api/auth/invite/redeem`; on success shows only a toast with no code value.
- `renderAdminInvitePanel()` is only rendered inside `renderReview()` when `adminToken()` is non-empty.
- Admin invite code creation (`createInviteCodeUI()`) renders the generated code in a `<code>` block with a Copy button — intentional, admin-only.

---

## Review Token Input

- `<input id="adminToken" type="password" ...>` — masked.
- `saveAdminTokenAndLoadReview()` reads `document.getElementById('adminToken')?.value` and writes to `LS_ADMIN`.
- `clearAdminToken()` does `localStorage.removeItem(LS_ADMIN)` and resets review state cleanly.
- Admin token is never passed to `toast()`, `esc()` output, `document.title`, or `console.*`.

---

## RunPack / Export Generation

- `generateRunPack()` builds the packet from claim/evidence/pressure/test/analysis data only. The user ID is not directly in the packet structure; `provenance` object contains `source_claim_id` only.
- `buildProvenanceMeta()` includes `packet_id`, `runpack_version`, `generated_at`, `source_claim_id`, `source_snapshot_hash`, counts, and `humanx_app_version`. No token values, no user ID.
- `lastPacket` (fallback path) includes `payload: selected` — claim data only, no user object, no token.
- Admin token is correctly absent from all RunPack outputs.
- `downloadRunPack()` downloads `lastPacket` only — correct.
- `downloadJSON()` — **F2** — includes `user` object with potential `ownerToken`. Patching recommended in D-169B.

---

## Browser Console / Logging

Zero `console.*` calls in `app-v10.js`. **Pass.**

---

## Ownership of Sensitive Rendering

| Field | Public rendering | Owner (Me) rendering | Admin review rendering |
|---|---|---|---|
| `user.id` | No | Yes (My HumanX card) | Yes (via review queue, own id in header) |
| `user.email` | No | Yes (verified only, My HumanX card) | No |
| `user.ownerToken` | No | No (never in template) | No |
| `adminToken` | No | No | As masked password field only |
| `is_admin` | No | No | No |
| `is_shadow_banned` | No | No | No |
| Invite code | No | No (input form only, not echoed) | Yes (generated, intentional) |
| `user_id` of others | No | No | Yes (provenance, F3 — intentional) |

---

## Recommended D-169B Patch List

| Priority | Finding | Recommended action |
|---|---|---|
| Medium | **F2** — `downloadJSON()` exports `user` with potential `ownerToken` | Strip `ownerToken` from export: pass `{ id: user.id, handle: user.handle }` instead of the full `user` object |
| Low | **F1** — My HumanX card shows full user ID | Optionally reduce to last-6-chars display (`id.slice(-6)`) or omit the ID entirely; email display is acceptable as-is |
| None | **F3** — review inspect shows `user_id` | Intentional, admin-gated, no action needed |

---

## No Code Changes in D-169A

`public/app-v10.js` was read and audited only. No modifications were made.
`src/worker.js` was not touched.
No route changes. No migration. No wrangler.toml. No owner-token enforcement resumed.

---

## Smoke Tests

Baseline unchanged: **1240/24/57**

```
node scripts/hardening-smoke-test.mjs       → 1240 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 57 passed, 0 failed, 1 expected warning
```

D-169A is audit only — no new smoke tests added.

---

## No Owner-Token Work Resumed

D-149H hold remains in effect. The owner token is described in this audit as "advisory-only" per D-149H. No enforcement, soft warnings, migration, or route changes were recommended or made.

---

## No Admin/Review Route Semantics Changed

All five review routes remain `requireAdmin`-gated. D-169A made no backend changes.
