# D-126A HumanX Beta Product Checkpoint

**Date:** 2026-06-14
**Branch:** `docs/d126a-beta-product-checkpoint`
**Basis:** D-125 owner-as-tester hardening chain complete and deployed.
**Live Worker:** `3ab9c7c5-b034-4ae5-8108-12ecb51734e7`
**Owner smoke:** PASS

---

## 1. Current Live Status

| Item | State |
|---|---|
| D-125 release | Live |
| Owner smoke | PASS |
| External testers | Not required — product is stable but still guarded |
| Public launch | Not yet — guarded beta only |
| Admin token | Owner-held only, not shared |
| Deployment gate | Manual Wrangler deploy by owner; no CI/CD auto-deploy |

HumanX is a working guarded beta. All six D-125 owner-testing cycles passed or were patched before release. No open stop conditions. The product is stable enough for trusted early testers but is not at public launch posture.

---

## 2. What HumanX Currently Does

### Claim pipeline
- Any visitor can submit a claim. Claims enter **Review** immediately — not public until approved.
- Rate limit: 8 claims / IP / hour. Evidence, pressure, and tests: 20 / IP / hour.
- Admin approves or rejects from the Review tab (token-gated). Approved claims become public.
- Quality hints shown at submission (advisory, not blocking — 8 trigger patterns).

### Public browsing
- **Claims / Arena:** Public approved claims with verdict badges, scores, evidence count, category filter, search.
- **Study view:** Per-claim deep-dive — evidence list, pressure tests, AIP packet, pressure verdict with qualifier copy.
- **Truths:** Public approved truths. "Not verified" badge on every card. "Pressure-test as Claim" available.
- **Evidence Vault:** Cross-claim evidence browser. Source links validated http/https-only.
- **RunPack / AIP export:** Owner-initiated export of claim analysis packets.

### Belief Engine v2
- Standalone SPA at `/apps/humanx-belief-engine/`.
- 9-dimension questionnaire (Reality & Existence, Truth & Evidence, Authority & Order, and six more).
- Radar chart, dimension bars, alignment archetypes, constellation, behavioral prediction, gap analysis, fragmentation score, share canvas.
- Timeline input stays **browser-local only** — not sent to HumanX.
- "Send to HumanX" action saves a Belief Snapshot (requires user session) — scoped to `user_id`, no cross-user visibility.
- Result framing: "mirror, not diagnosis."

### Drift comparison
- Saves named Belief profiles to `localStorage`.
- Side-by-side delta comparison of two profiles.
- Drift verdict badge neutral (`b-yellow`) — not a moral judgment.
- Export and Clear controls available.

### Admin / Review
- Review tab requires admin token (`humanx_admin_token_v1` in `localStorage`).
- Token validated server-side via constant-time compare (`safeEqual()`).
- Two-step approve/reject with confirmation prompt ("It will become public" / "It will not be public").
- Inspect panel with full claim/evidence detail, source links, quality score.

---

## 3. Trust and Safety Posture

| Principle | Implementation |
|---|---|
| Review-first publication | All claims and truths enter `review_state='review'` on creation; only `COALESCE(review_state,'public')='public'` records appear in public listings |
| Public means visible, not proven | Verdict qualifier on filter bar, study verdict qualifier in study view, "not verified" badge on every Truth card |
| Belief Engine is mirror, not diagnosis | Framed explicitly in result screen copy and bridge payload description |
| Typed timeline stays local | Timeline input processed client-side only; never sent to server |
| Review/admin token guarded | Client-side: Review tab renders empty without token. Server-side: `requireAdmin()` returns 403 before any queue data is sent |
| Source link safety | `safeHttpUrl()` (frontend) and `httpUrlOrNull()` (worker) both enforce http/https-only; non-http URLs stored as null, rendered as escaped text |
| Rate limiting | `safeRateLimit()` keyed by IP; 429 `RATE_LIMITED` on breach |
| Shadow ban | `requireUser()` checks `is_shadow_banned`; returns 403 `USER_SHADOW_BANNED` silently |
| No cross-user snapshot visibility | `listBeliefSnapshots()` scoped to `WHERE bs.user_id=?` |

---

## 4. Remaining Known Low-Priority Backlog

These are friction notes and doc discrepancies from D-125 cycles. None are stop conditions. None affect publish/private boundaries or security.

| ID | Area | Note | Source |
|---|---|---|---|
| B1 | Rate limit | Toast on 429 does not mention retry window ("You've submitted too many…" — no "try again in X min") | D-125E N1 |
| B2 | Claim submit | `CLAIM_TOO_SHORT` is surfaced as a raw toast key string if triggered before copy is localised | D-125E N2 |
| B3 | Nav label | Tab reads "Beliefs" but navigates to the Belief Engine SPA — label mismatch for first-time users | D-125F N2 |
| B4 | Review tab | Admin hint "Enter admin token to load the queue" is the only instruction — no link, no explainer for where to find the token | D-125E friction note |
| B5 | Evidence Vault | Source label reused across evidence cards from the same claim — can feel dense when many entries share one source | D-125F N3 |
| B6 | Docs | D-125A Cycle 5 step 5g references `/api/health`; actual public endpoint is `/api/graph-status` | D-125F N1, D-125G N3 |

---

## 5. Next-Build Options

### D-126B — Polish backlog batch
Clear all six backlog items above. Frontend copy/CSS only. Low risk, no schema or worker changes. Improves first-impression quality before inviting any external tester.

### D-126C — Product onboarding / guided first-run path
Add a first-run banner or tooltip sequence to explain what HumanX is, what a claim is, and what the Belief Engine does. Needed before any user who doesn't already know the product arrives. Medium effort; frontend only.

### D-126D — Review/admin ergonomics upgrade
Keyboard shortcuts, bulk approve/reject, audit log view, cleaner inspect layout. Useful if the owner will be reviewing high volumes. Medium effort; frontend only (worker already has the endpoints).

### D-126E — Public content quality / seed content
Owner-authored seed claims, truths, and evidence to give the product a populated feel for new visitors. Requires D1 data entry via Review flow or direct admin — no code changes needed. Low-effort if done via the existing Submit + Review cycle.

### D-126F — Abuse and spam hardening
IP blocklist, content-pattern filtering, duplicate-normalisation stricter threshold, challenge on repeated 429s. Higher effort; requires worker changes and possibly schema migration.

---

## 6. Recommendation

**Start with D-126B (polish backlog batch).**

- Lowest risk: frontend copy and CSS only.
- Highest immediate impact: removes known rough edges a first-time tester would hit.
- Unblocks D-126C: onboarding copy lands better once baseline friction is cleared.
- All six backlog items are small, well-scoped, and can ship in a single PR.

After D-126B: run D-126C (onboarding) before inviting any external tester who is not already briefed on the product.

---

## 7. Deploy Note

No deploy required for this checkpoint. The D-125 release (`3ab9c7c5-b034-4ae5-8108-12ecb51734e7`) is live and owner-smoked PASS. Next deploy will follow whichever build task ships code changes.

---

## Checks

```
node scripts/belief-engine-static-check.mjs   →  24 passed, 0 failed
node --check public/app-v10.js                →  syntax OK (exit 0)
node scripts/hardening-smoke-test.mjs         →  416 passed, 0 failed
```
