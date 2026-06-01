# Manual Frontend Smoke Checklist

---

## 1. Purpose

Run this checklist after every frontend change, docs-visible change, or merge
to confirm the live HumanX app still works correctly.

It is designed to be completed by a non-coder using a browser and a phone.
No code tools required.

---

## 2. Before testing

- Wait for the GitHub / Cloudflare Pages deploy to finish.
  (Check the Deployments tab in GitHub or the Cloudflare Pages dashboard.)
- Open the deployed HumanX site in a normal browser window (not an incognito
  window unless you are specifically testing logged-out behaviour).
- Hard refresh if the page looks stale: `Ctrl + Shift + R` on desktop,
  or pull down to refresh on mobile.
- Complete the desktop checklist first, then the mobile checklist.

---

## 3. Desktop checklist

Work through each item in order. Tick when confirmed.

### Home

- [ ] Page loads without a blank screen.
- [ ] The status dot and status line show a clear backend state
      (live D1, or an understandable message — not a raw stack trace).
- [ ] The pipeline banner is visible and readable:
      **Beliefs → Truths → Claims → Evidence → RunPack**.
- [ ] Home tiles are clickable and navigate correctly.

### Nav tabs

- [ ] **Beliefs** tab opens `/apps/humanx-belief-engine/` in the same window
      (not a 404 or blank page).
- [ ] **Claims** tab loads the claims grid or a clear empty state.
- [ ] **Evidence** tab loads the Evidence Vault or a clear empty state.
- [ ] **Truths** tab loads the truth statements list or a clear empty state.
- [ ] **RunPack** tab opens the RunPack Export page.
- [ ] **Review** tab shows the admin token input and moderation explanation —
      it should not look broken or show a raw error.
- [ ] **Submit** tab opens the claim submission form.
- [ ] **Drift** tab loads without error.

### Claims

- [ ] At least one claim card appears, or the empty state message is
      understandable ("No claims found. Submit the first one.").
- [ ] Clicking **Study** on a claim opens Study mode.

### Study Claim

- [ ] The claim text, category, and status badge are visible.
- [ ] The **Claim Flow** section shows four steps.
- [ ] The **Evidence**, **Pressure**, **Tests**, and **Analysis** sections are
      visible (even if empty).
- [ ] Empty state messages are readable (not blank boxes).
- [ ] **Generate RunPack** button is present and responds without an error.
- [ ] **← Back** button returns to the Claims grid.

### Evidence Vault

- [ ] Page loads without error.
- [ ] Evidence cards or a clear empty state are shown.
- [ ] **Attach** button is present on each evidence card.

### Truths

- [ ] Page loads and the form for adding a truth statement is visible.
- [ ] Existing truth cards show **Convert to Claim** button.

### RunPack

- [ ] Page shows the description of the RunPack flow.
- [ ] **Generate RunPack** and **Download visible data JSON** buttons are present.
- [ ] If a claim is selected, its title appears on the page.

### Review

- [ ] Page shows `admin only` badge and the moderation explanation paragraph.
- [ ] Admin token input is visible.
- [ ] The page does not show a raw error or blank screen without a token.

### Submit

- [ ] Form shows the claim input, category, type, and evidence fields.
- [ ] Submitting a test claim (e.g. "Test claim QA check") shows a
      **review confirmation panel** — not a blank page or silent redirect.
- [ ] The confirmation panel shows the claim text and at least two action
      buttons (Study this claim, Submit another, Browse Claims).

### Search and filter

- [ ] Typing in the search box does not break the current view.
- [ ] The verdict filter dropdown works without crashing.

### Layout

- [ ] The side panel does not overlap or cover the main content area.
- [ ] The context panel updates when a claim is opened in Study mode.

---

## 4. Mobile checklist

Resize browser to ~375px wide, or test on a phone.

- [ ] The header and nav tabs remain visible and usable — tabs wrap if needed
      but no tab is completely hidden or unclickable.
- [ ] The pipeline banner on Home wraps cleanly into rows (arrows hidden at
      narrow width, labels still readable).
- [ ] Claim cards stack to a single column without text overflowing.
- [ ] No important buttons are cut off or pushed off-screen.
- [ ] Study Claim page is readable — claim text, meters, and action buttons are
      all accessible without horizontal scrolling.
- [ ] Evidence, Truths, and RunPack pages do not create unreadable sideways
      scrolling.
- [ ] The submit confirmation panel is readable on a narrow screen.

---

## 5. Stop conditions

Stop testing and report a failure immediately if you see any of the following:

- **Blank page** — any tab or action results in a completely empty white or
  dark page with no content.
- **Button does nothing** — a primary action button (Submit, Study, Generate
  RunPack, Convert to Claim) produces no visible response and no toast.
- **Broken route** — a 404, "Not Found", or Cloudflare error page appears
  where app content is expected.
- **Backend error with no explanation** — a raw stack trace, JSON error object,
  or `500` message is shown directly in the UI.
- **Submit appears successful but no confirmation** — claim submission returns
  without a toast or a confirmation panel.
- **Mobile content is unreadable** — a full page or critical section requires
  horizontal scrolling to read on a 375px screen.
- **Console error connected to the changed area** — open browser DevTools
  (`F12 → Console`) and check for red errors that appear when using the
  changed feature.

---

## 6. Reporting format

Use this format when reporting QA results:

```
QA RESULT:
PASS / FAIL

FAILED:
- item
- item

DEVICE:
Desktop / Phone / Both

NOTES:
short notes
```

---

## 7. Current known-good baseline

- Live QA passed after **PR #13**.
- Full operational status, deployment facts, and confirmed hardening are
  documented in [`docs/OPERATIONAL_STATUS.md`](OPERATIONAL_STATUS.md).
