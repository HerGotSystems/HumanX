# D-197B — Dry-Run Result Template + Fix Intake

**Date:** 2026-06-28
**HEAD at creation:** `87279e7`
**Baseline:** 1589/24/57
**Audience:** Owner filling this in immediately after completing D-197A dry run

Fill this in while the run is fresh. Aim to complete it within 30 minutes of finishing the browser steps.

---

## Section 1 — Dry-Run Metadata

```
Dry-run date:
Browser / device:
HEAD at run time:
Preflight result: [22/22 PASS | X/22 — list failures]
Deploy run? [yes / no — reason if skipped]
Duration (terminal checks):
Duration (browser steps):
Duration (total):
Notes on environment (VPN, slow connection, unusual setup):
```

---

## Section 2 — Step Result Table

Mark each step PASS / FAIL / SKIP. Add a note for any non-PASS. Severity only needed if FAIL.

| # | Step | Result | Note | Screenshot | Severity |
|---|------|--------|------|------------|----------|
| 1 | Home page loads | | | | |
| 2 | Arena / Claims list | | | | |
| 3 | Open claim — Study mode | | | | |
| 4 | Vote | | | | |
| 5 | Copy claim link | | | | |
| 6 | Direct `/c/:id` URL | | | | |
| 7 | Add evidence | | | | |
| 8 | Add pressure | | | | |
| 9 | Add test | | | | |
| 10 | Submit claim — Builder | | | | |
| 11 | My HumanX | | | | |
| 12 | Profile settings / public profile | | | | |
| 13 | Generate RunPack | | | | |
| 14 | Review queue (admin) | | | | |
| 15 | Mobile / 375px | | | | |

**Screenshot rule:** Before saving any screenshot, confirm it contains no admin token, owner secret, or request headers. If it does, crop or blur before storing.

---

## Section 3 — Issue Intake

Log one entry per distinct issue. Copy this block and fill in once per issue. Leave blank fields as `-` rather than deleting them.

```
Issue ID:       DRY-001   (increment per issue)
Summary:        [one sentence]
Step:           [step number from Section 2]
Screen:         [Home / Arena / Study / Builder / My HumanX / Review / Profile / Mobile]
Steps to repro: 1. ...
                2. ...
                3. ...
Expected:       [what should have happened]
Actual:         [what actually happened]
Console error:  [paste error text or "none"]
Screenshot:     [filename or "none"]
Severity:       [P0 / P1 / P2 / P3]
Proposed fix:   [one sentence — or "unknown, needs investigation"]
Target patch:   [D-197C / D-197D / backlog / skip]
Status:         [Open / Fixed in D-XXX / Won't fix / Explained]
```

---

## Section 4 — Triage Rules

### P0 — Fix before anything else

Definition: App broken, security issue, token/credential visible, data corruption, backend unreachable for all users.

- Do not send Batch 1 invites until resolved
- Create D-197C immediately
- Re-run the full dry run after fix and before sending invites

Examples from this codebase:
- Admin token visible in a rendered UI element or network response
- `/c/:id` returning 500 for all claims
- `Backend unreachable` on every load
- Review queue accessible without admin token

### P1 — Fix before Batch 1

Definition: Core flow blocked for the owner during dry run. A preview user would hit the same wall.

- Do not send Batch 1 invites until resolved
- Can be bundled into D-197C with P0 fixes if small
- Re-run the affected steps after fix

Examples:
- Builder fails to submit on Step 3
- Evidence submit returns an error for all inputs
- Review queue returns 403 with correct admin token
- My HumanX shows no submissions despite having made them

### P2 — Can proceed to Batch 1 if disclosed

Definition: Confusing, annoying, or visually broken — but the flow completes.

- Send Batch 1 with disclosure in the invite message
- Bundle into D-197D for Polish pass after first feedback round
- Do not let P2 backlogs grow beyond 10 items before addressing

Examples:
- Vote button has no active/selected state (already known)
- Mobile side panel partially below fold (already known)
- Inline note wording feels unclear but action completed
- RunPack generates successfully but copy button is hard to find

### P3 — Backlog

Definition: Polish, cosmetic, minor wording. No functional impact.

- Log it and move on
- Address during a later polish pass
- Do not delay Batch 1 for P3 items

---

## Section 5 — Suggested Patch Naming

| Patch | Contents | Trigger |
|-------|---------|---------|
| **D-197C** | P0 + P1 dry-run fixes | Any P0 or P1 found in dry run |
| **D-197D** | Bundled P2 polish from dry run | 2+ P2 issues worth fixing before Batch 2 |
| **D-197E** | Dry-run closeout doc | After D-197C/D complete — mirrors D-189D, D-190E pattern |

If the dry run passes cleanly with no P0/P1: skip D-197C. Proceed directly to Batch 1 invites.

If only P2s are found: optional D-197D, or defer to post-Batch-1 feedback pass. Do not hold invites for P2.

---

## Section 6 — Decision

Fill this in after completing Sections 2–4.

### PASS — send Batch 1

Criteria:
- Preflight: 22/22 PASS
- Steps 1–6: all PASS
- Steps 7–9: at least one PASS
- Steps 10, 11, 14: all PASS
- No P0 or P1 issues open
- Cleanup complete (no junk public claims)

**Action:** Send Batch 1 invites using D-191B messages. Run D-195A deployment checklist one final time immediately before sending.

---

### CONDITIONAL PASS — fix named items, then send

Use this when: only P2 issues found, or one P1 that can be fixed in under 2 hours.

```
Condition: Fix [issue ID(s)] before sending.
Named fixes:
  - DRY-00X: [summary] — target D-197C
  - DRY-00X: [summary] — target D-197C
Estimated fix time:
Re-run required: [full dry run / affected steps only]
```

**Action:** Fix the named items. Re-run affected steps. Confirm pass. Then send.

---

### FAIL — do not send invites

Use this when: any P0 open, or 2+ P1 issues open, or preflight failed.

```
Blockers:
  - DRY-00X: [summary] — P0/P1
  - DRY-00X: [summary] — P0/P1
Next step: Create D-197C. Fix all blockers. Re-run full dry run.
```

**Action:** Do not send any invite codes. Do not share the URL. Fix blockers first.

---

## Section 7 — Copy/Paste Summary Block

Use this to report results back in a conversation or session handoff. Fill in and paste as-is.

```
D-197A DRY RUN RESULT
─────────────────────
Date:           [YYYY-MM-DD]
HEAD:           [commit hash]
Preflight:      [22/22 PASS | X failures]
Duration:       [total minutes]

Steps:
  PASS:  [list step numbers]
  FAIL:  [list step numbers]
  SKIP:  [list step numbers]

Issues found:
  P0:  [count] — [one-line summaries]
  P1:  [count] — [one-line summaries]
  P2:  [count] — [one-line summaries]
  P3:  [count] — [one-line summaries]

Decision:   [PASS / CONDITIONAL PASS / FAIL]
Next patch: [D-197C / none needed]
Ready for Batch 1: [yes / after D-197C / no]
```

---

## Cleanup Reminder

Before closing out this document:

- [ ] All "DRY RUN TEST" submissions rejected in Review queue
- [ ] Any accidentally-approved test items set back to `rejected`
- [ ] Test added in Step 9 archived from My HumanX (or left — it's not visible publicly)
- [ ] No admin token visible in any saved screenshots
- [ ] This file (or your filled-in copy) kept in private notes — not committed to the repo if it contains issue detail with token references
