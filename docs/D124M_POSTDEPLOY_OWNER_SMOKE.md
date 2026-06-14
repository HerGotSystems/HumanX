# D-124M — Post-Deploy Owner Smoke Checkpoint: Belief Engine Tester-Check

**Date:** 2026-06-14  
**Branch:** docs/d124m-postdeploy-owner-smoke  
**Mode:** Docs only — no code changes, no deploy, no Wrangler, no D1, no admin token recorded.

**Deployed version:** `ff886046-714a-4756-92b4-ddaa2908959b`  
**Canonical URL:** https://humanx.rinkimirikata.com

**Verdict: PASS WITH NOTES**

All owner-tested flows passed. Two items remain before external tester invites are sent (see Remaining section below).

---

## Checks

| Check | Result |
|---|---|
| `node scripts/belief-engine-static-check.mjs` | 24/24 PASS |
| `node --check public/app-v10.js` | Syntax OK |
| `node scripts/hardening-smoke-test.mjs` | 416/416 PASS |

---

## What Passed (Owner Browser Verification)

### Production health

| Item | Result |
|---|---|
| `https://humanx.rinkimirikata.com` loads without error | PASS |
| D1 live indicator visible on Home page | PASS |
| No blank screen, no Worker exception | PASS |

### Belief Engine — desktop existing-user flow

| Item | Result |
|---|---|
| Belief Engine result screen renders (full forensic profile) | PASS |
| Saved results accessible via "View previous results" | PASS |
| Drift section shows multiple full Belief Engine profiles | PASS |

### Drift — profile comparison

Owner confirmed two full profiles visible in Drift with comparison delta:

| Profile slot | Label |
|---|---|
| Older profile | Stoic Atheism |
| Newer profile | Confucianism |

| Drift delta field | Value |
|---|---|
| stability | 0 |
| openness | −2 |
| pressure | +19 |
| contradictions | +5 |

Drift comparison is operational. Both profiles classified as full Belief Engine profiles (not Quick Belief Records).

### Mobile — fresh/new-user Belief Engine flow

| Item | Result |
|---|---|
| Mobile fresh flow (new-user, no prior localStorage) completed end-to-end | PASS |
| Belief Engine renders on mobile without reported overflow or layout failure | PASS |

### Cross-device — claim submission and Review queue

| Item | Result |
|---|---|
| Mobile-created test claim appeared in desktop Review queue as pending | PASS |
| Review queue operational for owner (admin view confirmed) | PASS |

---

## Notes

### N1 — Admin screenshot contains owner admin token (do not share publicly)

One screenshot captured during the owner browser check shows the admin token visible in the Review input field. **The token value is not recorded anywhere in this document or this repository.**

Owner guidance:
- Do not share admin-view screenshots publicly or with testers.
- Screenshots from the owner browser check are private owner evidence only — they are not part of any public-facing doc or tester pack.
- The Review tab correctly requires the admin token to load the queue; a tester without the token sees only a prompt.

### N2 — Tester-side Review gate check not yet done (no-token / incognito)

The owner browser check confirmed the admin view is operational. The tester-side check — confirming that a browser **without** an admin token sees only the gate and no queue contents — has not yet been performed as a dedicated step. This is a final gate before inviting external testers.

Recommended check (takes under 2 minutes):
1. Open a private/incognito window.
2. Navigate to `https://humanx.rinkimirikata.com`.
3. Click the Review tab.
4. Confirm: "admin only" badge is visible, token input is empty, queue is not visible.

### N3 — Mobile layout at 390px/768px not explicitly measured

The owner mobile flow passed end-to-end. However, a dedicated layout check at exactly 390px and 768px widths (as specified in `D124L_OWNER_BROWSER_CHECKLIST.md` sections 9a–9b) has not been reported as a completed step. If the mobile flow felt comfortable on the test device this is low risk; run the DevTools width check before sending invites if not already done.

---

## Remaining Before External Tester Invite

| Item | Priority | Notes |
|---|---|---|
| Incognito / no-token Review gate check | **Required** | N2 above — 2 minutes, opens an incognito window |
| Mobile layout at 390px + 768px (DevTools) | Optional if mobile flow already felt clean | N3 above |
| Choose 1–3 trusted testers | Required | Keep first wave small |
| Decide feedback channel (email, DM, form) | Required | Not via the site itself |

---

## Recommendation

Owner smoke check: **PASS WITH NOTES.** The product is in a deployable, owner-verified state. The Belief Engine v2 chain (D-124B–L) is live.

**Next task: D-124N — First tester invite, after completing the N2 incognito Review gate check.**

Brief the N2 check first (2 minutes), then use `docs/D123A_TESTER_LAUNCH_PACK.md` sections 1–4 and 6–7 to send invites to 1–3 trusted testers. Do not share the Worker origin URL or any admin-view screenshots with testers.
