# D-212A — Reflection Avatar Private Hide/Show Control

**Scope:** Frontend only
**Status:** LIVE CLOSEOUT COMPLETE
**Baseline:** 1957 passed / 0 failed / 24 (belief-engine) / 57 (route, 1 warn pre-existing)
**Files changed:** `public/app-v10.js`, `public/styles.css`, `scripts/hardening-smoke-test.mjs`, `docs/README.md`
**Backend changes:** None
**Migration:** None
**Schema change:** None
**Public avatar:** None
**Public profile change:** None

---

## Purpose

Give the user control over their own private Reflection Avatar card. They can hide it on their current device and restore it at any time. This is about consent and comfort — not gamification, scoring, or identity labelling.

The control is device-local only. Nothing is sent to the server.

---

## Implementation

### New helper functions (before `meReflectionAvatarHtml`)

```js
const _ME_AVATAR_HIDDEN_KEY = 'humanx.me.reflectionAvatar.hidden';
function isMeReflectionAvatarHidden() { … }
function setMeReflectionAvatarHidden(hidden) { … }
function toggleMeReflectionAvatarHidden() { … }
```

- `isMeReflectionAvatarHidden()` — reads `localStorage`, returns `false` on error (fail-open: card shown)
- `setMeReflectionAvatarHidden(hidden)` — sets or removes the key; `try/catch` swallows blocked-storage errors silently
- `toggleMeReflectionAvatarHidden()` — flips the state and calls `meRerender()` to re-render My HumanX immediately

`toggleMeReflectionAvatarHidden` is registered in `_D181B_ZERO_PARAM_ACTIONS` so the existing `data-action` dispatch handles both "Hide this" and "Show again" buttons without new event listeners.

### Changes to `meReflectionAvatarHtml(data)`

At the top of the function, before any data processing:

```js
if (isMeReflectionAvatarHidden()) {
  return `<div class="panel me-avatar-card me-avatar-hidden">…hidden placeholder…</div>`;
}
```

Hidden placeholder copy:
- "Reflection avatar hidden on this device."
- "This only changes your private My HumanX view."
- "Show again" button (`data-action="toggleMeReflectionAvatarHidden"`)

The full card (populated and empty states) gains a "Hide this" control at the bottom:

```html
<div class="me-avatar-hide-row">
  <button class="btn-link me-avatar-hide-btn" data-action="toggleMeReflectionAvatarHidden">Hide this</button>
</div>
```

---

## localStorage behaviour

| Scenario | Behaviour |
|---|---|
| localStorage available, key absent | Card shown (default) |
| localStorage available, key = `'1'` | Hidden placeholder shown |
| localStorage blocked/unavailable | Card shown (fail-open) |
| User clicks "Hide this" | Key set to `'1'`, page re-renders immediately |
| User clicks "Show again" | Key removed, page re-renders immediately |
| Page reload after hiding | Hidden placeholder persists (localStorage survives reload) |
| Different browser/device | Not hidden (localStorage is device-local) |

---

## Privacy model

- **Device-local only.** The hidden state is never sent to the backend. No new API field, no new DB column, no migration.
- **No backend awareness.** The worker does not know or care whether the card is hidden.
- **No cross-device sync.** Hiding on one device has no effect on another.
- **Fail-open.** If localStorage is blocked (private browsing policy, storage quota, etc.), the card is shown — the safe default is visibility, not concealment.

---

## Copy guardrails

### Allowed copy used

- "Hide this"
- "Show again"
- "Reflection avatar hidden on this device."
- "This only changes your private My HumanX view."

### Forbidden copy — absent

- identity, rank, score, diagnosis, ideology, morality, intelligence, truth level, purity, HumanX rank, good believer, bad believer

---

## Public profile non-exposure

`renderPublicProfileHtml` does not call `meReflectionAvatarHtml`. The hide/show control, hidden placeholder, "Hide this", and "Show again" copy are absent from the public render path. Confirmed by 4 D-212A smoke tests.

---

## New CSS classes

| Class | Purpose |
|---|---|
| `.me-avatar-hide-row` | Container for the "Hide this" link at card bottom |
| `.me-avatar-hide-btn` | Unstyled link-style button for the hide control |
| `.me-avatar-hidden` | Padding for the minimal hidden placeholder panel |

---

## Smoke tests added

24 new D-212A tests covering:
- Three helper functions exist
- localStorage key is correct
- localStorage access is try/catch-wrapped
- Toggle registered in zero-param dispatch
- "Hide this" and hidden placeholder exist in avatar function
- "Show again" and device-local note exist
- `isMeReflectionAvatarHidden()` called at top of function
- Four public profile isolation checks (me-avatar-hidden, placeholder text, "Show again", "Hide this" all absent from public render)
- localStorage key absent from worker.js
- Forbidden wording clean
- Three CSS classes exist
- No migration file
- D-212A comment present

---

## Deploy

Owner deployed manually from local terminal after commit `5da4699`. No migration required.

### Live sanity checklist — D-212B — ALL PASS

| Check | Expected | Actual |
|---|---|---|
| "Hide this" link visible at bottom of Reflection avatar card | Present | PASS |
| Clicking "Hide this" collapses card to hidden placeholder | Immediate, no page reload | PASS |
| Hidden placeholder shows "Reflection avatar hidden on this device." | Present | PASS |
| Hidden placeholder shows "This only changes your private My HumanX view." | Present | PASS |
| "Show again" button visible in hidden placeholder | Present | PASS |
| Clicking "Show again" restores full card | Immediate, no page reload | PASS |
| Reload after hiding — card stays hidden | Persists | PASS |
| Reload after showing — card stays visible | Persists | PASS |
| Transparency disclosure still works after restore | Works | PASS |
| Guardrail copy visible after restore | Present | PASS |
| Private notice visible after restore | Present | PASS |
| Reflection avatar absent from public profile | Absent | PASS |
| "Hide this" / "Show again" absent from public profile | Absent | PASS |
| Hidden placeholder absent from public profile | Absent | PASS |
| No forbidden wording on public profile | All absent | PASS |

### Confirmations

- **Owner deploy:** PASS (manual `wrangler deploy` from owner terminal)
- **localStorage-only:** PASS — hidden state stored in `humanx.me.reflectionAvatar.hidden`; nothing sent to backend
- **Device-local only:** PASS — no cross-device sync; different browser/device shows card normally
- **Fail-open:** PASS — if localStorage is blocked, card shows normally (try/catch on all reads/writes)
- **No public profile/avatar exposure:** PASS — `meReflectionAvatarHtml` not called from `renderPublicProfileHtml`; hide/show controls absent from public render path; confirmed by 4 D-212A smoke tests
- **No backend changes:** PASS
- **No API changes:** PASS
- **No migration:** PASS
- **No schema changes:** PASS
- **No CSP changes:** PASS
- **No external asset changes:** PASS

### Final baselines

- **Hardening smoke:** 1957 passed / 0 failed
- **Worker route static:** 57 passed / 0 failed / 1 warn (pre-existing, non-blocking)
