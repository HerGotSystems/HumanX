# D-199C — Owner Dry-Run Closeout + Batch 1 Go Decision

**Date:** 2026-06-28
**HEAD at closeout:** `e1ac4bf`
**Baseline:** 1589/24/57
**Decision: PASS — ready for Batch 1**

---

## Dry-Run Result

| Item | Result |
|------|--------|
| App loads | PASS |
| Console errors | None |
| DevTools Issues | Form field missing name / label not associated — accessibility/autofill only |
| P0 issues | None |
| P1 issues | None |
| P2 issues | None — accessibility items resolved in D-199B |
| P3 issues | None |

The only issues surfaced during the dry run were browser DevTools accessibility hints: form fields missing `name` attributes and `<label>` elements not associated with their fields. These are not functional blockers and do not affect any user flow.

---

## D-199B Fix Summary

Applied immediately after the dry run. No logic changes — attribute-only additions.

| Area | What was added |
|------|---------------|
| Evidence/pressure side panel (`index.html`) | `name` on `eTitle`, `eKind`, `eQuality`, `eSource`, `eNote` |
| Invite-code fields | `name` + `autocomplete="one-time-code"` / `"email"` / `"name"` |
| Claim Builder Steps 1–2 | `for` on all 9 labels; `name` on all 9 fields |
| Truths form | `name` on `truthStatement`, `truthCategory`, `truthOrigin`, `truthType`; `<p>` → `<label for="truthType">` |
| Tests form | `name` on `testTitle`, `testInstructions`, `testSafety`, `testDifficulty` |
| Analysis paste textarea | `name="analysisPaste"` in both locations |
| Admin invite panel | `name` on `adminInviteNote`, `adminInviteEmailHint` |
| Smoke test | Window widened 2800→3000 chars to accommodate new attribute bytes |

Baseline after D-199B: **1589 passed, 0 failed** (restored).

---

## Final Status

**PASS for Batch 1.**

HumanX is ready to be shared with 3–5 trusted preview users. This is not a public launch. Invite codes are required and distributed manually.

Known limitations to disclose to preview users (from D-191B):
- Vote buttons do not visually highlight after voting
- Side panel may be partially below fold on small phones
- No self-serve request-access or waitlist
- No public feedback form — report issues directly

---

## Before Sending the First Invite

Run these in order. Do not skip.

```powershell
cd C:\Users\veltr\HumanX
git pull
git log --oneline -3
node scripts/preview-launch-check.mjs
```

Expected: `All automated checks passed.` (22/22, exit 0)

```powershell
# Only if app-v10.js / index.html / worker.js changed since last deploy:
npx wrangler deploy
```

Then open `https://humanx.veltrusky-michal.workers.dev` in a private window and confirm:
- [ ] Home loads — status chip shows `Live`
- [ ] Review tab hidden
- [ ] One claim opens in Study mode without error

Then prepare invite codes: create one per user via Review → Create Invite Code. Note the code and recipient in your private invite tracking table (D-191B).

Send invites using the message templates in `docs/D191B_PREVIEW_USER_INVITE_PACK.md`.

---

## What to Monitor After Sending

**Daily (5 min):**
- Review queue: any pending items? Approve or reject.
- Any feedback message received? Log it in your flat feedback tracker (D-193A format).
- Any P0/P1 report? Respond within 2 hours.

**After each day:**
- Note submission counts (evidence, pressure, tests, claims) from `/api/graph-status` or debug panel.
- Note any confusing moments users mentioned.

**Per-user:**
- Did they complete the try-list (D-191B)?
- Did they submit at least one piece of evidence or a claim?
- Did anything stop them?

---

## Stop Conditions

Stop sending more invites and pause Batch 1 if any of:

| Condition | Action |
|-----------|--------|
| Review queue fails to load with correct admin token | Stop. Investigate before continuing. |
| `/c/:id` direct URL returns 404 or blank | Stop. Fix before continuing. |
| Builder Steps 1–3 fail to submit | Stop. Fix before continuing. |
| Admin token or owner secret visible in any UI or network response | Stop immediately. Rotate credentials. |
| Two or more users report the same confusing step and cannot complete the flow | Pause. Fix or add clarification before continuing. |
| Spam or coordinated abuse via leaked invite | Revoke the relevant invite codes. Shadow-ban if needed (SQL in D-194A). |

---

## Next Actions

1. **Send Batch 1** — 3–5 users, using invite messages from `docs/D191B_PREVIEW_USER_INVITE_PACK.md`
2. **Follow Batch 0 → 1 → 2 plan** in `docs/D196A_PREVIEW_SEED_USER_BATCH_PLAN.md`
3. **Run daily routine** from `docs/D191C_PREVIEW_OPERATOR_RUNBOOK.md`
4. **Log all feedback** using the flat row format from `docs/D193A_PREVIEW_FEEDBACK_INGESTION_AUDIT.md`
5. **After 5–7 days with Batch 1**: evaluate go/no-go for Batch 2 (up to 20 total)

Do not build new features or ship code changes during the active preview unless a P0/P1 requires it.

---

## D-199 Series Summary

| Patch | Contents |
|-------|---------|
| D-199A | Dry-run wait state handoff doc |
| D-199B | Accessibility/autofill polish (form `name`, label `for`, `autocomplete`) |
| D-199C | This doc — closeout + Batch 1 go decision |
