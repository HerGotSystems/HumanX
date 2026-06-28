# D-209G — Owner Consent UI/API Audit

**Date:** 2026-06-28
**Status:** AUDIT ONLY — no app code added
**HEAD at audit:** `00b7700`

---

## A. Current Consent/Storage State

| Item | Status |
|------|--------|
| `visibility_json TEXT` on `belief_snapshots` | Live in production (migration 0016) |
| `parseBeliefVisibility(raw)` | Live in `src/worker.js` — null/invalid → all-private safe default |
| `beliefVisibilityAllows(visibility, group)` | Live — returns false for any group not explicitly true |
| `buildPublicSharedSnapshot(snapshotRow)` | Live — whitelist-only public response builder; currently returns Class-1 fields only |
| Owner visibility toggle UI | **Does not exist** |
| Backend endpoint to update `visibility_json` | **Does not exist** |
| Public sharedSnapshot fields | `label`, `contradictionCount`, `createdAt` only |
| All sensitive belief groups | Non-public regardless of `visibility_json` value |

All existing rows have `visibility_json = null` — the safe default. No owner has ever set any consent preference. The backend scaffold is inert: `visibility_json` is parsed but the result is `void`'d.

---

## B. Existing Share Model

### How snapshot sharing currently works

1. Owner visits My HumanX → Profile Settings.
2. Snapshot list shows all their snapshots with a radio button: `Share on public profile`.
3. Selecting a snapshot triggers `meShareSnapshotUI` (data-action), which fires `POST /api/me/profile-settings` with `{ shared_snapshot_id: "<id>" }`.
4. The `saveProfileSettings` handler:
   - Validates snapshot belongs to the authenticated user and is not hidden.
   - Clears `public_summary_enabled=0` for ALL the user's snapshots.
   - Sets `public_summary_enabled=1` for the chosen snapshot only.
   - At most one row per user can be `public_summary_enabled=1` — enforced server-side.
5. A "Do not share" radio option sends `{ shared_snapshot_id: "" }` — clears sharing for all snapshots.

### What `public_summary_enabled` means

- Binary flag: 0/1 on the `belief_snapshots` row.
- Selecting it means the owner has opted to display the snapshot's Class-1 fields on their public profile.
- It does not mean any sensitive field group is consented — that requires a separate per-field `visibility_json` entry.
- Only the single shared snapshot appears publicly (`LIMIT 1`).

### Whether any current endpoint can safely update `visibility_json`

**No.** The current `saveProfileSettings` handler (`POST /api/me/profile-settings`) does not read or write `visibility_json`. Piggybacking `visibility_json` onto it is possible but inadvisable — the route handles profile toggle, slug, bio, and snapshot selection in one call. Visibility consent is a separate axis and belongs in a dedicated route.

The `saveBeliefSnapshot` / `POST /api/belief-snapshots` handler (in `src/belief-snapshots.js`) creates a snapshot from Belief Engine results. It does not handle visibility preferences. Adding visibility updates there would couple consent with snapshot creation — wrong lifecycle.

---

## C. Proposed Owner UI Location

**Location: My HumanX → Profile Settings → inside the shared snapshot preview block.**

Specifically, add the per-field consent controls directly below `meSharedSnapshotPreviewBlockHtml()`, inside the same panel that already shows:
- "Preview — this is exactly what others will see"
- The snapshot card (label + tension count + date + guardrails)

### Why this location

- The owner is already thinking about sharing at this point.
- The preview card sets the context — they can see exactly what others see and decide whether to expand it.
- It is behind the profile toggle (owner must already have a public profile + a shared snapshot selected).
- Controls are invisible to visitors — this is the `me` view only.
- Nothing appears on the public profile page.

### What to avoid

| Location | Risk | Verdict |
|----------|------|---------|
| Inside Belief Engine results screen | Owner may enable fields immediately after generating a snapshot, before reflecting | Defer — confusing lifecycle |
| Separate "Belief Visibility Settings" page | Owner has to navigate away from preview context | Acceptable but worse UX |
| Public profile page | Visitors can see the toggle state or toggle UI | Never |
| Snapshot list row (per-row consent) | Complex; multiple snapshots could have conflicting consent before one is shared | Defer — only the active shared snapshot matters |

**Recommended: single block below the existing shared snapshot preview card, only rendered when a snapshot is actively shared.**

---

## D. Proposed UI Model

### Structure (rendered order)

```
[Profile Settings panel — existing]
  ↳ Profile toggle (existing)
  ↳ Slug / bio (existing)
  ↳ Snapshot share radio list (existing)
  ↳ meSharedSnapshotPreviewBlockHtml (existing)
       ↳ "Preview — this is exactly what others will see:"
       ↳ [snapshot card — label + tension count + date + guardrail copy]
       ↳ --- NEW BELOW ---
       ↳ Optional public fields  [only shown if a snapshot is shared]
            ↳ [toggle group(s)]
            ↳ [live preview updates as toggles change]
       ↳ [Save public belief visibility]  ← explicit save button
```

### Toggle behavior

- All toggles default off (rendering the saved `visibility_json` state, or off if null).
- Each toggle label: `[Group name] — Visible on public profile`.
- Warning copy appears inline below each toggle (see section F).
- Live preview: the shared snapshot preview card below the toggles re-renders as toggles change, before saving. This shows the owner exactly what will change on their public profile.
- `Save public belief visibility` button: explicit save. Does not save automatically on toggle — prevents accidental exposure.
- After save: confirmation: `Public visibility saved.`
- Revoke path: separate `Unshare snapshot` control (existing radio → "Do not share") remains obvious and is unaffected by the visibility toggles.

### What to avoid in the UI

| Mistake | Risk |
|---------|------|
| Auto-save on toggle | Accidental exposure — owner clicks toggle to preview, not realizing it published |
| "Enable all" / "Share all" bulk button | Owner grants more than intended |
| Toggles without warning copy | Owner doesn't understand what each field reveals |
| Showing toggle state on public profile page | Visitors learn which fields the owner declined to share — information leak |
| Toggle UI inside snapshot creation flow | Consent mixed with creation; owner may not understand the snapshot is not shared yet |

---

## E. Field Group Rollout Recommendation

### Assessment

| Group | Risk | Blocker |
|-------|------|---------|
| `scores` | Medium — Class-3 sensitive inference | Requires warning copy + caveats. Numeric signals can be misread as intelligence or moral rankings. |
| `pattern_summary` | Medium-high — Class-2 identity | `dominant_pattern` is a named behavioral interpretation. More identity-like than scores. |
| `alignment_labels` | High — Class-2 very high risk | `top_beliefs_json` sanitized names can directly reveal religious, ideological, or worldview associations. Requires separate acknowledgement modal. |
| `reflection_habits` | N/A — Class-4 private-only | Source/strength/activity reflection cards contain behavior patterns that are too intimate. Block permanently in this arc. |
| `drift_history` | N/A — Class-3 timeline inference | Not implemented yet; would reveal how views changed over time. Block permanently in this arc. |

### Recommendation for D-209H

**Implement `scores` toggle only, with mandatory warning copy.**

Rationale:
- Scores are the least identity-sensitive of the sensitive groups — they are numeric reflections of how the owner engages with claims, not named categories.
- They are still sensitive (cannot be auto-enabled) but are easier to caveat clearly.
- Implementing scores first validates the full UI/API/preview/save/revoke cycle with minimal risk before enabling higher-risk groups.
- `pattern_summary` and `alignment_labels` have higher identity disclosure risk and should wait for a separate audit.

**Do NOT implement `pattern_summary` or `alignment_labels` toggles in D-209H.**
- `pattern_summary` exposes a named behavioral archetype — more identity-like than scores.
- `alignment_labels` can expose religious/ideological labels directly. It requires a separate acknowledgement modal and legal/ethics review before implementation.

**`reflection_habits` and `drift_history` remain permanently blocked in this arc.**

### D-209H scope: scores-only toggle

One toggle in the UI:
- `Stability, Openness, Pressure scores — Visible on public profile`
- Warning copy inline below toggle
- Live preview shows scores added/removed from snapshot card
- Save button explicit
- `alignment_labels` toggle: do not render at all in D-209H — no disabled/greyed state either, to avoid implying it will be available soon

---

## F. Required Warnings by Group

### Scores (implement in D-209H)

> Scores are reflection signals — how you engaged with claims, not how intelligent, moral, or truthful you are.

One-liner inline below toggle. Also repeat in snapshot card guardrail copy when scores are shown.

### Pattern summary (defer to D-209I or later)

> Pattern summaries describe how you interact with ideas. They are interpretation, not identity or diagnosis.

### Alignment labels (block until dedicated audit)

> This may reveal religious, ideological, or worldview associations. Once shared, visitors can see named belief categories from your answers. Share only if you are comfortable making this public.

Requires a separate modal acknowledgement before the toggle can be enabled — not a simple inline checkbox. The modal must:
- Show the exact list of names that will appear.
- Require explicit "I understand this may reveal my worldview associations" checkbox.
- Have a distinct "Enable" button separate from the toggle.
- Re-confirm before save.

### Reflection habits (block permanently in this arc)

> Reflection habits describe how you use HumanX — not for sharing.

Not rendered as a toggle at all.

### Drift history (block permanently in this arc)

> Drift history may reveal how your views changed over time — not for sharing.

Not rendered as a toggle at all.

---

## G. Backend Endpoint Recommendation

### New route

```
POST /api/belief-snapshots/:id/visibility
```

Do not piggyback on `saveProfileSettings` or `saveBeliefSnapshot`.

### Why a dedicated route

- `saveProfileSettings` already mixes profile toggle, slug, bio, and snapshot selection — adding visibility there creates a wide blast radius for a single bad request.
- Visibility is per-snapshot, not per-user. The `:id` in the route makes the target explicit.
- A dedicated route can enforce snapshot ownership, allowed groups, and return only the sanitized visibility map — never the full snapshot row.

### Handler rules

```
POST /api/belief-snapshots/:id/visibility
```

1. **Auth:** `requireUser(request, env)` — owner only.
2. **Ownership:** `SELECT id FROM belief_snapshots WHERE id=? AND user_id=?` — return 404 if not found or not owned. Use same 404-for-both pattern as existing handlers.
3. **Parse body:** `{ scores: true/false }` (D-209H only). Accept only known keys from an explicit allowlist. Unknown keys are ignored, never stored.
4. **Allowed groups in D-209H:** `scores` only. All others forced false regardless of what the body sends.
5. **Type coercion:** values are coerced to boolean via `=== true`. Truthy strings, numbers, null — all treated as false.
6. **Blocked groups:** `alignment_labels` cannot be set to true without a separate acknowledgement flow — force false until that flow exists.
7. **Merge with existing:** read current `visibility_json`, parse with `parseBeliefVisibility()`, merge new values in, then write back. Do not overwrite groups the owner didn't send.
8. **Write:** `UPDATE belief_snapshots SET visibility_json=? WHERE id=? AND user_id=?`.
9. **Response:** return only `{ ok: true, visibility: { ...sanitizedMap } }`. Never return the snapshot row, `top_beliefs_json`, `dominant_pattern`, or any other sensitive column in this response.
10. **Rate limit:** same rate limit bucket as other `me` write routes.

### Handler pseudocode

```js
async function updateBeliefSnapshotVisibility(request, env, snapshotId) {
  const userId = await requireUser(request, env);
  const snapshot = await env.DB.prepare(
    `SELECT id, visibility_json FROM belief_snapshots WHERE id=? AND user_id=?`
  ).bind(snapshotId, userId).first();
  if (!snapshot) return json({ error: 'SNAPSHOT_NOT_FOUND_OR_NOT_OWNED' }, 404);

  const body = await readJson(request);
  const current = parseBeliefVisibility(snapshot.visibility_json);

  // D-209H allowlist: only scores is unlockable. All others stay false.
  // Expand this list only after dedicated audit per group.
  const ALLOWED_GROUPS = ['scores'];
  const BLOCKED_GROUPS = ['alignment_labels', 'pattern_summary', 'reflection_habits', 'drift_history'];

  const updated = { ...current };
  for (const group of ALLOWED_GROUPS) {
    if (Object.prototype.hasOwnProperty.call(body, group)) {
      updated[group] = body[group] === true;
    }
  }
  for (const group of BLOCKED_GROUPS) {
    updated[group] = false; // force false regardless of body
  }
  updated.basic_snapshot = true; // always true

  await env.DB.prepare(
    `UPDATE belief_snapshots SET visibility_json=? WHERE id=? AND user_id=?`
  ).bind(JSON.stringify(updated), snapshotId, userId).run();

  return json({ ok: true, visibility: updated });
}
```

### Route registration

```js
// In route dispatch, under authenticated routes:
if (url.pathname.match(/^\/api\/belief-snapshots\/[^/]+\/visibility$/) && request.method === 'POST') {
  const snapshotId = cleanId(url.pathname.split('/')[3]);
  return await updateBeliefSnapshotVisibility(request, env, snapshotId);
}
```

Add `'updateBeliefSnapshotVisibility'` to `OWNER_SENSITIVE_ROUTES`.

---

## H. Public Response Wiring Recommendation

`buildPublicSharedSnapshot(snapshotRow)` in `src/worker.js` is the single gating point. When D-209H ships the backend endpoint and D-209H or D-209I ships the frontend scores toggle, `buildPublicSharedSnapshot` is updated as follows:

```js
function buildPublicSharedSnapshot(snapshotRow) {
  if (!snapshotRow) return null;
  const visibility = parseBeliefVisibility(snapshotRow.visibility_json);

  // Class-1 baseline — always public when snapshot is shared.
  const result = {
    label: snapshotRow.label || null,
    contradictionCount: snapshotRow.contradiction_count || 0,
    createdAt: snapshotRow.created_at,
  };

  // D-209H: scores group — gated by explicit owner consent.
  if (beliefVisibilityAllows(visibility, 'scores')) {
    // SELECT must also include these columns for this branch to be reachable.
    result.stabilityScore = snapshotRow.stability_score || 0;
    result.opennessScore = snapshotRow.openness_score || 0;
    result.pressureScore = snapshotRow.pressure_score || 0;
  }

  // pattern_summary — defer to D-209I+ after dedicated audit.
  // if (beliefVisibilityAllows(visibility, 'pattern_summary')) {
  //   result.patternLabel = snapshotRow.dominant_pattern || null;
  // }

  // alignment_labels — blocked until acknowledgement modal exists.
  // NEVER return raw top_beliefs_json. If this gate ever opens,
  // use sanitizeAlignmentNames(snapshotRow.top_beliefs_json) only.
  // if (beliefVisibilityAllows(visibility, 'alignment_labels')) {
  //   result.alignmentLabels = sanitizeAlignmentNames(snapshotRow.top_beliefs_json);
  // }

  return result;
}
```

**SELECT must be widened when scores gate opens.** Currently `getPublicProfile` selects only `label, contradiction_count, created_at, visibility_json`. When D-209H activates the scores branch, add `stability_score, openness_score, pressure_score` to the SELECT. This is intentional: columns are not selected until the gate is wired and tested.

### Alignment labels rule — permanent

`top_beliefs_json` must **never** be returned raw in any public API response under any consent state. If `alignment_labels` is ever enabled:
- Parse the JSON.
- Extract name strings only (e.g., `item.name`).
- Limit to 3 items maximum.
- Strip percentages and numeric scores.
- Return as a plain string array: `["Name A", "Name B", "Name C"]`.
- Any parse error or missing field → empty array.
- Never pass the raw JSON blob through.

This sanitizer function (`sanitizeAlignmentNames`) should be written and tested before `alignment_labels` group is enabled — not after.

---

## I. Testing Plan

Tests to add when D-209H implementation ships:

### Backend endpoint tests (new smoke test block)

| Test | What to verify |
|------|---------------|
| Route exists: POST /api/belief-snapshots/:id/visibility | Route is registered and in OWNER_SENSITIVE_ROUTES |
| Non-owner returns 404 | Handler uses user_id ownership check |
| Unknown keys in body are ignored | `{ unknown_group: true }` → not stored |
| `alignment_labels: true` in body is forced false | Handler forces blocked groups to false |
| `scores: true` stores in visibility_json | SELECT after update confirms scores: true |
| `scores: false` revokes correctly | SELECT after update confirms scores: false |
| basic_snapshot is always true | Cannot be set to false |
| Response never includes top_beliefs_json | Response shape audit |
| Response never includes dominant_pattern | Response shape audit |

### Public response tests (extend buildPublicSharedSnapshot block)

| Test | What to verify |
|------|---------------|
| scores false → no scores in public response | buildPublicSharedSnapshot with visibility.scores=false |
| scores true → scores in public response | buildPublicSharedSnapshot with visibility.scores=true |
| revoke: scores true → false → scores absent | Lifecycle test |
| alignment_labels forced false even if stored true | buildPublicSharedSnapshot never returns alignmentLabels |
| top_beliefs_json never returned raw | No raw JSON blob in public response |
| Public response shape unchanged for null visibility_json | Existing behavior unchanged |

### Frontend tests (extend existing D-142B block)

| Test | What to verify |
|------|---------------|
| Consent toggle block only renders when snapshot is shared | No toggle shown if public_summary_enabled=0 |
| Save button required — no auto-save | data-action fires only on explicit save click |
| Preview card updates before save | Preview re-renders on toggle change without saving |
| Scores warning copy present | Inline text below scores toggle |
| No alignment_labels toggle rendered | Field group not in UI |

---

## J. D-209H Recommendation

**D-209H scope: scores-only backend endpoint + scores toggle UI + scores live preview + smoke tests.**

This is the minimum complete implementation unit: one field group, end-to-end, from toggle to saved consent to public response to revoke.

| Option | Assessment |
|--------|-----------|
| Endpoint-only scaffold (no UI) | Owner cannot test or use it; backend dead code without UI |
| Docs-only | D-209G is already docs — D-209H should produce working code |
| Disabled/greyed preview toggles for all groups | Confusing — implies groups will ship imminently; raises expectation |
| Scores-only, end-to-end | **Recommended.** Validates the full consent cycle with the lowest-risk field group. |

**What D-209H must include:**
1. `POST /api/belief-snapshots/:id/visibility` handler (scores-only allowlist)
2. `visibility_json` SELECT widening in `getPublicProfile` for score columns
3. `buildPublicSharedSnapshot` scores gate wired and active
4. Frontend scores toggle + warning copy + live preview + explicit save button
5. Smoke tests for all of the above
6. No `pattern_summary` or `alignment_labels` toggle or API surface

**Deploy ordering for D-209H:**
No new migration required — `visibility_json` column already exists. Worker deploy only.

---

## Highest-Risk UI Mistakes to Avoid

1. **Auto-save on toggle.** If the UI saves immediately when a toggle changes state, the owner can accidentally expose a sensitive field by clicking to preview, not realizing it published. Explicit save button is mandatory.

2. **Missing warning copy at the moment of choice.** Warning copy must appear inline, adjacent to the toggle, not in a separate help panel the owner might not read.

3. **"Enable all" button.** Any bulk-enable shortcut defeats the per-field consent model entirely.

4. **Rendering the toggle UI when no snapshot is shared.** If the owner hasn't chosen a snapshot to share, consent settings are meaningless and confusing.

5. **Returning `visibility_json` raw in any API response.** The consent map itself is an owner-private document. The public API must never echo back `visibility_json`.

---

## File Index

| File | Purpose |
|------|---------|
| `docs/D209D_BELIEF_PER_FIELD_CONSENT_SPEC.md` | Original six-group spec |
| `docs/D209E_VISIBILITY_JSON_CLOSEOUT.md` | Migration closeout + current state |
| `docs/D209G_OWNER_CONSENT_UI_API_AUDIT.md` | This document |
| `src/worker.js` — `buildPublicSharedSnapshot` | Current whitelist public builder — extend here in D-209H |
| `src/worker.js` — `parseBeliefVisibility` / `beliefVisibilityAllows` | Consent helpers — no changes needed for D-209H |
| `src/worker.js` — `saveProfileSettings` | Existing snapshot share/unshare — do not modify for D-209H |
| `public/app-v10.js` — `meSharedSnapshotPreviewBlockHtml` | Insert toggle block below here in D-209H |
| `public/app-v10.js` — `meSharedSnapshotCardHtml` | Extend to render scores conditionally in D-209H |
