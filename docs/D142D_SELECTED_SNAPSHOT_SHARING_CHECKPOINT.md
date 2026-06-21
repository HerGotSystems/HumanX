# D-142D — Selected Snapshot Sharing Checkpoint

**Date:** 2026-06-21
**Chain:** D-142A (audit) → D-142B (sharing foundation) → D-142C (public copy/presentation polish) → D-142D (this doc)
**Scope:** Documentation only. No app or backend changes. No D1 migration.

---

## Summary of the D-142 Chain

### D-142A — Selected belief snapshot sharing audit
Read-only audit of whether and how a user could choose one belief snapshot to publish on their public profile. Confirmed the schema was already ready (`belief_snapshots.public_summary_enabled` and `hidden_at` from migration 0013, both unused by any endpoint), flagged `mapBeliefSnapshot()` as a footgun if naively reused publicly (it returns `raw`/`stressPoints`/`userId`), and recommended a precise safe field set: `label`, `dominantPattern` (carefully framed), `stabilityScore`/`opennessScore`/`pressureScore`, a single `topAlignmentName` (never the full `top_beliefs_json` array), and `contradictionCount` only (never `contradictions_json` text, which is more personal than a generic pattern label). Recommended extending the existing `POST /api/my-humanx/profile-settings` endpoint rather than adding a new one, with at-most-one-snapshot enforced server-side. No code changed.

### D-142B — Selected snapshot sharing foundation
Extended `saveProfileSettings()` with an optional `shared_snapshot_id` field: omitted leaves the existing sharing selection untouched, `null`/empty clears it, a non-empty id is verified against `id+user_id+hidden_at IS NULL` (`404 SNAPSHOT_NOT_FOUND_OR_NOT_OWNED` otherwise) and enforced as the only shared snapshot via a clear-all-then-set-one update pair — never relying on client discipline. Widened `myHumanX()`'s belief_snapshots select with `public_summary_enabled` (so the Me-side share control can show current selection) and `dominant_pattern`/`contradiction_count` (needed for the owner preview to match the public-safe field set exactly) — the `dominant_pattern` addition also fixed a real pre-existing bug: the private Belief Mirror's `meMirrorLatestCardHtml` has always read `latest.dominant_pattern`, but that column was never selected since D-139B, so it always fell back to "Pattern not labeled." Widened `GET /api/u/:slug` with an optional `sharedSnapshot` field, gated on `public_summary_enabled=1 AND hidden_at IS NULL` for the profile owner, server-extracting `topAlignmentName` from only the first `top_beliefs_json` entry and never passing the array through. No migration, no new route.

### D-142C — Public copy / presentation polish
Frontend-only polish pass after owner smoke flagged the selection state as unclear and the public card as needing focused wording work. Owner-side: a helper line above Belief Snapshots, a visible `me-item-row-selected` highlight on whichever row (including "Do not share a snapshot") is currently active, dashed-border styling distinguishing the "do not share" option, and a Profile Settings preview that shows either a compact selected-snapshot summary or "No belief snapshot will appear publicly." with an explicit note that sharing is optional and independent of the public-profile toggle. Public-facing: the card was retitled "Shared Belief Snapshot" with the exact required third-person disclaimer, the snapshot label and a "Self-reported dominant pattern" framing heading were added (so `dominantPattern` never reads as a bare assigned label), and the snapshot's created date was added. No backend changes, no migration.

---

## Production Confirmed (owner-smoked)

- Owner can choose one belief snapshot to share.
- Owner can choose "Do not share a snapshot."
- Only one snapshot can be selected at a time (radio semantics, server-enforced).
- The selected row is visually obvious.
- The Profile Settings preview shows the selected snapshot's summary.
- The public profile shows the shared-snapshot card when one is selected.
- The public profile hides the snapshot section entirely when none is selected — no empty placeholder.
- The public profile still omits email, user id, admin fields, and owner-only controls.
- No raw answer text or full contradiction text is ever visible anywhere.

---

## Backend Changes (D-142B)

| Change | Detail |
|---|---|
| `POST /api/my-humanx/profile-settings` extended | New optional `shared_snapshot_id` field — omitted leaves sharing unchanged, `null`/empty clears it, a valid id shares it |
| No new route | Reuses the existing profile-settings endpoint |
| No migration | `public_summary_enabled` and `hidden_at` already existed from migration 0013 |
| Server-enforced exclusivity | A clear-all-then-set-one update pair guarantees at most one `public_summary_enabled=1` row per user — never trusts the client |
| `hidden_at IS NULL` required | Checked both at save time (ownership verification) and at read time (the public query) |
| `GET /api/u/:slug` widened | Optional `profile.sharedSnapshot` field, present only when a public, non-hidden, owner-selected snapshot exists |
| `myHumanX()` belief_snapshots select widened | Added `public_summary_enabled`, `dominant_pattern`, `contradiction_count` |
| Pre-existing bug fixed | `dominant_pattern` had been missing from `myHumanX()`'s select since D-139B, causing the private Belief Mirror to always show "Pattern not labeled" |

---

## Frontend Changes

- Belief Snapshot sharing radio controls — one per snapshot, mutually exclusive via a shared `name="meSharedSnapshot"` group (`meBeliefSnapshotsHtml()`).
- "Do not share a snapshot" option, visually distinct (dashed border) from real snapshot rows.
- Selected-row highlighting (`me-item-row-selected`) applied to whichever row — snapshot or "do not share" — is currently active.
- Owner preview card (`meSharedSnapshotCardHtml()`) and empty-selection state (`meSharedSnapshotPreviewBlockHtml()`) inside Profile Settings.
- Public "Shared Belief Snapshot" card (`renderPublicProfileSnapshotHtml()`), placed between Public Activity and the recent-content sections, third-person disclaimer wording.
- Required disclaimer copy on both the owner preview and the public card.

---

## Safety Model

- Explicit opt-in **per snapshot**, independent of the `profile_public` toggle — both must be true for a snapshot to actually appear publicly.
- Never exposed anywhere in this chain: `raw_json`, `stress_points_json`, `dimensions_json`, the raw `top_beliefs_json` array, `contradictions_json` text, the internal user `id`, `email`, or any admin field.
- No AI/API call anywhere — every field is arithmetic/extraction over already-stored data.
- No social UI — confirmed by smoke test that no comments, follows, or likes exist in any sharing-related function.

---

## Public Snapshot Safe Fields

| Field | Notes |
|---|---|
| `label` | Owner-authored, capped 120 chars at save time |
| `dominantPattern` | Always shown under a "Self-reported dominant pattern" framing heading — never bare |
| `stabilityScore`, `opennessScore`, `pressureScore` | 0-100 bounded integers, rendered via the existing `meter()` component |
| `topAlignmentName` | Name only — extracted server-side from the first `top_beliefs_json` entry, never the array, never `similarity`/`description` |
| `contradictionCount` | Integer count only — never `contradictions_json` text |
| `createdAt` | Same precedent as every other public timestamp already shown elsewhere |

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Hash route only** | `#/u/:slug`, no pretty `/u/slug` path — unchanged from D-140C, still requires a `wrangler.toml` SPA-fallback change to add. |
| **Only one shared snapshot** | No public snapshot history — by design, per the D-142A audit's "singular and explicit" recommendation. |
| **No per-field public sharing controls** | The owner can't selectively expose, say, just the scores without the dominant pattern — it's all-or-nothing per snapshot. |
| **No OpenGraph/share-card image** | Sharing a profile or snapshot link to chat apps or social platforms produces no rich preview — explicitly the subject of the next recommended audit. |
| **`x-humanx-user` is still unsigned and spoofable for owner-side settings** | Same pre-existing limitation carried through every prior checkpoint — saving sharing settings is only as strong as whatever identity the header claims. The public read route itself requires no identity at all. |

---

## Current Baseline

```
node scripts/hardening-smoke-test.mjs       → 883 passed, 0 failed
node scripts/belief-engine-static-check.mjs → 24 passed, 0 failed
node scripts/worker-route-static-check.mjs  → 56 passed, 0 failed, 1 expected parameterised-route warning
```

---

## Recommended Next Implementation

**D-143A — Public profile share-card / OpenGraph / SEO audit**

Public profiles and selected snapshot sharing now both work safely end-to-end. The next useful layer is making shared links look good *outside* the app — when a `#/u/:slug` link is pasted into a chat app, social platform, or messaging client, there's currently no Open Graph title/description/image, so it renders as a bare URL. A read-only audit should determine what a safe preview card needs (likely just `displayName`, `bio`, and public counts — definitely not the shared snapshot's scores or any belief data), whether a static meta-tag approach is even feasible given the hash-route SPA structure (Open Graph crawlers don't execute JavaScript, so `#/u/:slug` content is invisible to them — this may require either server-side meta tag injection for `/u/:slug`-shaped requests or accepting that rich previews aren't possible without the pretty-path work deferred since D-140C), and what SEO implications (if any) a public, indexable profile page should consider.
