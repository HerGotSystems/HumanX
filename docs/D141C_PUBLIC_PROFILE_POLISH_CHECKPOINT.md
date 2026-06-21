# D-141C — Public Profile Polish Checkpoint

**Date:** 2026-06-21
**Chain:** D-141A (audit) → D-141B (visual polish) → D-141C (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-141 Chain

### D-141A — Public profile polish / selected snapshot sharing audit
Read-only audit of the public profile shipped in D-140. Confirmed the core safety model was solid (uniform `review_state`/`archived_by_user` filtering, generic 404, no leaked identity fields) but the presentation was thin: bare `.panel`/`.me-item-list` rows with no dedicated visual language, unexplained count chips, and minimal empty states. Separately scoped "selected belief snapshot sharing" as a real but distinct feature — `belief_snapshots.public_summary_enabled` exists in the schema (migration 0013) but is wired to nothing, and surfacing belief data publicly needs its own wording-guardrail pass before implementation, not bundled with a styling patch. Recommended **Option A — visual polish only** first, with no new backend surface. No code changed.

### D-141B — Public profile visual polish
Frontend/CSS-only patch, no backend changes:
- Public profile header and counts panel restyled with a dedicated `pp-card` treatment instead of bare panels.
- Counts row gained an explanation: *"Counts reflect public, non-archived activity only."* — shown on both the public page and the owner-side live preview.
- The four recent-activity sections (claims/truths/evidence/pressure) wrapped in a `pp-section` class with `pp-item-row` cards replacing flat list rows.
- Empty states ("No public claims yet." etc.) moved to a dedicated `pp-empty` styled class instead of bare `<p class="small">` text.
- Me-side Profile Settings preview extended to show 1-2 sample public items (claims/truths only), computed entirely client-side from already-loaded `meData.claims`/`meData.truths`, filtered to `review_state==='public'` — no new backend call. Archived-by-user items are excluded automatically, since archiving flips `review_state` away from `'public'`.
- Mobile pass: `@media (max-width:640px)` tightens padding on the header/counts/section cards and item rows.
- `GET /api/u/:slug`'s response shape is unchanged — verified by smoke test asserting the exact field set (`slug`, `bio`, `displayName`, `counts`, `recentClaims`, `recentTruths`, `recentEvidence`, `recentPressure`) with no additions or removals.

---

## Production Confirmed (owner-smoked)

- `#/u/calenhir` public profile loads.
- Public profile has cleaner header/card styling.
- Public counts explanation is visible: *"Counts reflect public, non-archived activity only."*
- Recent public sections look less debug/raw — styled cards, not flat rows.
- Empty states are styled, not bare text.
- The public page still omits email, user id, and any export/archive/settings controls.
- The Me-side Profile Settings preview shows sample public items.
- Me dashboard, Belief Mirror, Export, Archive, and Review all still work.

---

## D-141B Changes

| Aspect | Detail |
|---|---|
| Scope | Frontend (`public/app-v10.js`) and CSS (`public/styles.css`) only |
| Backend | Untouched — confirmed via `git diff --stat` showing zero changes to `src/worker.js` |
| Migration | None added |
| New endpoint | None added |
| New public fields | None — `GET /api/u/:slug` response shape verified unchanged by smoke test |

---

## Safety Model Reaffirmed

- Only already-public, non-archived data appears anywhere on the public page or in the Me-side sample preview — the `review_state==='public'` filter (server-side in `getPublicProfile()`, client-side in `meProfilePublicSamples()`) is unchanged from D-140C.
- No belief snapshot sharing yet — `getPublicProfile()` still never queries `belief_snapshots`.
- No `raw_json` or `stress_points_json` exposure anywhere in the public profile path.
- No comments, follows, likes, or social feed — confirmed absent by smoke test across both the polished public page and the existing Me-side controls.
- No owner-only controls (archive/export/settings) reachable from the public page — confirmed absent by smoke test.

---

## Explicit Known Limitations

| Limitation | Detail |
|---|---|
| **Public profile still uses the hash route `#/u/:slug`** | `wrangler.toml` has no SPA-fallback configuration, so a real `/u/slug` path would 404 against Cloudflare's static-asset handler. Unchanged from D-140C — still the only option without a deploy-config change. |
| **Selected belief snapshot sharing deferred** | `belief_snapshots.public_summary_enabled` exists in the schema but has no read or write path. This is the explicit subject of the next recommended audit (D-142A). |
| **No share-card image/meta tags yet** | The public profile has no Open Graph/Twitter Card meta tags or preview image — sharing the link to a chat app or social platform won't produce a rich preview. |
| **No public claim collection polish beyond recent lists** | The four recent-activity sections show the same 10-row cap and simple card layout for every content type — there's no filtering, sorting, or "view all" affordance on the public page itself. |
| **No social layer yet** | No comments, follows, likes, or any interaction surface exists or is planned in this chain. |
| **`x-humanx-user` is still unsigned and spoofable for owner-side settings** | Same pre-existing limitation carried through every prior checkpoint — saving Profile Settings is only as strong as whatever identity the header claims. The public read route itself requires no identity at all, so this doesn't affect public visitors. |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 842 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```

---

## Recommended Next Implementation

**D-142A — Selected belief snapshot sharing audit**

Public profile presentation is now safe and reasonably polished. The next meaningful feature is letting a user explicitly choose one belief snapshot or Mirror summary to publish on their profile — using the already-added but unused `belief_snapshots.public_summary_enabled` column. This exposes a genuinely new category of data (belief/personality-adjacent scores and patterns) to the public for the first time, so it needs its own dedicated privacy and wording-guardrail audit — mirroring the rigor D-139A/B already applied to the *private* Belief Mirror — before any implementation work begins. The audit should determine exactly which fields are safe to surface (e.g. `stability_score`/`openness_score`/`pressure_score`/`dominant_pattern`, a single top alignment name, a contradiction *count* rather than text) and which must never appear publicly (`raw_json`, `stress_points_json`, full `contradictions_json` text, any snapshot not explicitly marked `public_summary_enabled=1`).
