# D-191C — Preview Operator Runbook

**Date:** 2026-06-28
**HEAD at creation:** `2e8efe1`
**Audience:** Whoever is running the trusted preview (sending invites, watching the queue, triaging bugs)

This runbook covers the full lifecycle of a 5–20 user trusted preview: setup, daily routine, bug triage, and expansion decisions.

---

## Quick Commands

```sh
# Automated preflight — run before every invite batch
node scripts/preview-launch-check.mjs

# Smoke test suite — run after any code change
node scripts/hardening-smoke-test.mjs

# Syntax check
node --check public/app-v10.js

# Belief engine static check
node scripts/belief-engine-static-check.mjs

# Worker route static check
node scripts/worker-route-static-check.mjs
```

Expected baselines: `1589 passed, 0 failed` · `24 passed, 0 failed` · `57 passed, 0 failed`

---

## Phase 1 — Before Sending Invites

Run this phase once before each new invite batch.

### Step 1: Pull latest

```sh
git pull origin main
```

Confirm HEAD matches the latest commit in the repo. Do not send invites from a stale local build.

### Step 2: Run automated preflight

```sh
node scripts/preview-launch-check.mjs
```

All 22 checks must pass (exit 0). If any fail, fix before continuing. See `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` for what each check covers.

### Step 3: Deploy latest Worker (if any code changed since last deploy)

Check whether `public/app-v10.js`, `public/index.html`, or `src/worker.js` changed since the last deploy. If so:

```sh
# Only run if user has explicitly approved deployment for this session
wrangler deploy
```

Confirm the deploy timestamp in the Cloudflare dashboard matches. Do not run `wrangler deploy` speculatively — only when a meaningful change needs to go out.

### Step 4: Manual spot-checks

Open the live URL in a private/incognito window (no admin token, no invite redeemed):

| Check | Expected |
|-------|----------|
| Home loads | Status shows `Live` or `Demo mode` — not `D1 live`, `Demo fallback`, or `Backend unreachable` |
| Arena tab | Claims list loads without account |
| Open a claim | Study mode opens, tabs visible |
| Review tab | Must not appear in nav without admin token |
| Status chip | Looks clean — no jargon |

Then open with admin token in local storage:

| Check | Expected |
|-------|----------|
| Review tab | Appears in nav |
| Review queue | Loads, shows pending items |
| Approve an item | Item moves out of pending |

### Step 5: Prepare invite codes

- Locate or generate invite codes (see your invite code source — not documented here as it varies per deployment)
- Assign one code per user — do not reuse codes across users
- Log each assignment in the invite code tracker (see Invite Code Tracking below)
- Do not paste invite codes or admin tokens into chat messages, Slack, or email subject lines — put them in the message body only, to a single named recipient

### Step 6: Send invites

Use the messages in `docs/D191B_PREVIEW_USER_INVITE_PACK.md`. Customize `[name]`, `[CODE]`, and `[URL]` per recipient. Send individually — not a group message.

---

## Phase 2 — Daily Preview Routine

During the active preview period, run this once per day (or more often in the first 48 hours).

### Check the Review queue

Open the app with admin token. Click Review tab. For each pending item:

| Item type | Default action |
|-----------|---------------|
| Evidence from a known preview user | Review on merit — approve if substantive, reject if spam/low quality |
| Pressure from a known preview user | Same as evidence |
| Claim from a known preview user | Review more carefully — claims are public once approved |
| Test / analysis | Visible immediately, no queue — check My HumanX for preview user submissions |
| Submission from unknown user | Treat as potential spam — reject or leave pending |

There is no way in the current UI to identify which user submitted each item. Cross-reference by content and timing against what preview users told you they submitted.

### Collect feedback

Check replies to your invite messages. For each reply, log it in the Feedback Tracker (see format below) and note:

- Was this a one-off or have multiple users mentioned the same thing?
- Is it a P0/P1 that needs an immediate fix, or P2/P3 that can wait?

### Note bugs

Log every bug in the Feedback Tracker immediately when you hear about it, even if you can't fix it yet. Do not rely on memory.

### End-of-day status check

Quick 2-minute scan:
- Review queue cleared of obvious approvals/rejections
- No P0 bugs open without a plan
- All user replies acknowledged (even "thanks, logged")

---

## Phase 3 — Bug Triage

### Severity definitions

| Level | Definition | Response time |
|-------|-----------|---------------|
| **P0** | App broken, data corrupted, security issue, token/credential leak, backend unreachable for all users | Fix immediately. Stop sending new invites until resolved. |
| **P1** | Core preview flow blocked — user cannot browse, vote, submit, or share. Feature works for some users but not others. | Fix within 24 hours. Notify affected users. |
| **P2** | Confusing, annoying, or misleading behavior that doesn't block the flow. User can work around it. | Fix before next invite batch. |
| **P3** | Polish, copy, visual inconsistency. No functional impact. | Backlog. Fix when natural. |

### P0 response protocol

1. Stop sending new invites immediately
2. Assess scope: is it all users, specific flows, or specific accounts?
3. If it's a security or token issue: rotate credentials before anything else
4. Fix and deploy
5. Re-run full preflight before resuming
6. Notify affected users (see "What to say when something breaks" below)

### What counts as a security issue (escalate immediately)

- Admin token visible in UI, error messages, or network responses
- User A can see User B's private data
- Invite codes exposed in public responses
- Backend returning stack traces with internal paths or credentials
- Rate limiting completely bypassed

---

## Feedback Tracker Format

Keep a running log (a private doc, spreadsheet, or notes file — not in this repo if it contains user names):

| Field | Notes |
|-------|-------|
| **Date** | When reported |
| **User** | Name or identifier (match to invite code log) |
| **Device / Browser** | e.g. iPhone 15 / Safari, Windows / Chrome 125 |
| **Flow** | Which part of the app — Home, Study, Builder, Evidence, Review, Profile, etc. |
| **Issue** | Plain description of what went wrong or what confused them |
| **Severity** | P0 / P1 / P2 / P3 |
| **Screenshot / Link** | URL or attached file if they sent one |
| **Action taken** | Fixed in D-XXX / Backlogged / Won't fix / Explained to user |

### Example entry

| Field | Value |
|-------|-------|
| Date | 2026-06-28 |
| User | Alex |
| Device / Browser | MacBook / Firefox 127 |
| Flow | Builder Step 3 |
| Issue | Guest note appeared even after redeeming invite — `accountUser` was null at first render, showed guest copy for ~2 seconds then switched |
| Severity | P2 |
| Screenshot | [link] |
| Action taken | Backlogged — known timing issue with `loadMe()` fire-and-forget |

---

## Invite Code Tracking

Keep a private log (not in the repo):

| Name | Code | Sent date | Replied date | Notes |
|------|------|-----------|--------------|-------|
| [name] | [code] | [date] | [date] | |

Rules:
- One code per person — do not share the same code with two users
- Do not put admin tokens in this log
- If a code is compromised (forwarded to an unintended person), treat it as if an unknown user has access and watch the Review queue for unexpected submissions

---

## What to Say When Something Breaks

**If a user reports something you've already fixed and deployed:**
> "Thanks — that was a known issue, just pushed a fix. Try refreshing and let me know if it persists."

**If a user reports a bug you haven't seen before:**
> "Thanks for catching this. Logged. I'll look into it — can you tell me what browser/device you were on?"

**If the app is fully down (P0, backend unreachable):**
> "Heads up — the backend is currently unreachable. I'm looking into it. Sorry for the disruption. I'll let you know when it's back."

**If a user is confused by expected behavior (like Review queue delay):**
> "That's expected — evidence and claims go through a quick review before appearing publicly. Tests appear immediately. Your submission is in the queue and I'll get to it."

**If a user asks when public launch is:**
> "Not yet — this is a closed early preview. I'll let you know when it opens up more broadly."

Keep responses short. Don't over-explain or over-apologize. Just acknowledge, answer, and act.

---

## When to Stop the Preview

Stop sending new invites and consider pausing the preview if:

- Any P0 bug is open and unresolved
- The Review queue is accumulating faster than you can review it
- You're getting consistent P1 reports about the same flow from multiple users
- A security or trust issue is discovered (rotate credentials first, then assess)
- Backend costs spike unexpectedly (check Cloudflare dashboard)

To pause: stop sending invite codes. Existing users can still access the app. You do not need to take the app offline unless there's a security issue.

---

## When to Expand Beyond the First Batch

Consider expanding (send to the next batch of users) when:

- All current preview users have replied or it's been 5+ days since you sent invites
- No open P0 or P1 bugs
- Review queue is manageable
- You've addressed the top 2–3 friction points from the first batch
- The preflight script still passes cleanly

Do not expand just because the first batch had no complaints. No reply is not the same as no problems. Follow up directly before expanding.

---

## Known Limitations (from D-191B)

Disclose these to preview users proactively. Do not wait for them to discover them.

| Limitation | Status |
|------------|--------|
| Evidence/pressure/claims/truths are review-gated | By design — manual review during preview |
| Vote buttons have no selected/active state after voting | Known P2 visual gap |
| Mobile side panel may be below fold on small phones | Known P2 — not yet fixed |
| No self-serve invite/waitlist — codes distributed manually | By design for now |
| No in-app feedback form | No fix planned for preview period — reply to invite message |
| Anonymous users can submit to Review queue without invite | By design — Review queue is the gate |
| Reports count not shown publicly | Fixed in D-190B |

---

## Reference Docs

| Doc | Purpose |
|-----|---------|
| `docs/D191A_EXTERNAL_PREVIEW_LAUNCH_CHECKLIST.md` | Full preflight checklist — manual + automated |
| `docs/D191B_PREVIEW_USER_INVITE_PACK.md` | Invite messages, try-list, feedback questions |
| `docs/D190_EXTERNAL_PREVIEW_READINESS_CLOSEOUT.md` | What was fixed in D-190, what remains |
| `docs/D190A_PRODUCT_READINESS_AUDIT.md` | Full P0–P3 audit findings |
| `docs/D190C_INVITE_GATE_MESSAGING_AUDIT.md` | Auth model, anon vs. verified action matrix |
