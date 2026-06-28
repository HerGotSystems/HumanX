#!/usr/bin/env node
/**
 * D-191A — External Preview Launch Preflight
 *
 * Checks local source files only. No network required.
 * Exit 0 = all automated checks pass.
 * Exit 1 = one or more automated checks failed.
 *
 * Usage: node scripts/preview-launch-check.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── helpers ────────────────────────────────────────────────────────────────

const PASS = '\x1b[32mPASS\x1b[0m';
const FAIL = '\x1b[31mFAIL\x1b[0m';
const INFO = '\x1b[33m    \x1b[0m';
const DIVIDER = '─'.repeat(60);

let failed = 0;

function read(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

function check(label, pass, detail = '') {
  if (pass) {
    console.log(`  ${PASS}  ${label}`);
  } else {
    console.log(`  ${FAIL}  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function contains(src, pattern) {
  if (src === null) return false;
  if (typeof pattern === 'string') return src.includes(pattern);
  return pattern.test(src);
}

function notContains(src, pattern) {
  return !contains(src, pattern);
}

// ── load source files ──────────────────────────────────────────────────────

const app    = read('public/app-v10.js');
const html   = read('public/index.html');
const worker = read('src/worker.js');
const readme = read('docs/README.md');

const appOk    = app !== null;
const htmlOk   = html !== null;
const workerOk = worker !== null;
const readmeOk = readme !== null;

// ── report header ──────────────────────────────────────────────────────────

console.log('');
console.log('HumanX — External Preview Launch Preflight');
console.log(DIVIDER);

// ── SECTION 1: source files present ───────────────────────────────────────

console.log('\nSource files');
check('public/app-v10.js exists',  appOk);
check('public/index.html exists',  htmlOk);
check('public/og-default.png exists', existsSync(resolve(ROOT, 'public/og-default.png')));
check('docs/README.md exists',     readmeOk);

// ── SECTION 2: no dev/internal jargon ─────────────────────────────────────

console.log('\nNo developer jargon visible to users');

// "D1 live" is not allowed in user-facing status strings
// Allow it in comments, docs strings, or test source — we check app-v10.js only
check(
  'No "D1 live" in app-v10.js',
  app === null || notContains(app, /['"`]D1 live['"`]/),
  'status label still uses internal DB name'
);
check(
  'No "Demo fallback" in app-v10.js',
  app === null || notContains(app, /['"`]Demo fallback['"`]/),
  'status label still uses internal fallback name'
);

// ── SECTION 3: OG / social metadata ───────────────────────────────────────

console.log('\nOG / social preview metadata');
// Static index.html has title/description/image; og:url is set dynamically by Worker shells
check('og:title present in index.html',          htmlOk && contains(html, 'og:title'));
check('og:description present in index.html',    htmlOk && contains(html, 'og:description'));
check('og:image present in index.html',          htmlOk && contains(html, 'og:image'));
check('twitter:card present in index.html',      htmlOk && contains(html, 'twitter:card'));
// Worker shells set og:url dynamically per-route
check('og:url set in Worker OG shell',           workerOk && contains(worker, "og:url"));

// ── SECTION 4: direct claim URL support ───────────────────────────────────

console.log('\nDirect claim URL support (/c/:id)');
// parseDirectClaimPath is in app-v10.js; renderClaimShell and /c/ route interception are in worker.js
check('parseDirectClaimPath exists in app',      appOk    && contains(app, 'parseDirectClaimPath'));
check('renderClaimShell exists in Worker',       workerOk && contains(worker, 'renderClaimShell'));
check('/c/ route intercepted in Worker',          workerOk && contains(worker, '/c/') && contains(worker, 'renderClaimShell'));

// ── SECTION 5: sharing ─────────────────────────────────────────────────────

console.log('\nClaim sharing');
check('copyClaimLink exists in app', appOk && contains(app, 'copyClaimLink'));

// ── SECTION 6: Review tab gating ──────────────────────────────────────────

console.log('\nAdmin Review tab gating');
check(
  'tab-review hidden by default in index.html',
  htmlOk && contains(html, 'tab-review') && contains(html, /id="tab-review"[^>]*style="display:none"/)
);
check(
  'adminToken() gate in app boot()',
  appOk && contains(app, "adminToken()?'':'none'")
);

// ── SECTION 7: anonymous browse messaging ─────────────────────────────────

console.log('\nAnonymous user messaging');
check(
  'Home says browse without account',
  appOk && contains(app, 'browse')
);
check(
  'Invite/guest messaging present in app',
  appOk && contains(app, 'Redeem your invite') && contains(app, 'guest')
);
check(
  'Builder Step 1 no longer says "Anyone can submit"',
  app === null || notContains(app, 'Anyone can submit a claim pseudonymously')
);
check(
  'patchEvidencePanel invite-aware note present',
  appOk && contains(app, 'Redeem an invite to track them with your profile')
);

// ── SECTION 8: README baseline ────────────────────────────────────────────

console.log('\nTest baseline');
check(
  'README baseline shows 1589 passed, 0 failed',
  readmeOk && contains(readme, '1589 passed, 0 failed')
);

// ── SECTION 9: manual checklist ───────────────────────────────────────────

console.log('');
console.log(DIVIDER);
console.log('Manual checks (cannot be automated — verify before each batch)');
console.log(DIVIDER);

const manual = [
  ['Deploy',          'Latest Worker deployed to Cloudflare (wrangler deploy)'],
  ['Home',            'Open home page — status shows "Live" or "Demo mode", no jargon'],
  ['Browse',          'Arena loads claim list without account'],
  ['Study',           'Open a claim — Study mode loads, tabs visible'],
  ['Vote',            'Cast a vote — toast confirms specific choice'],
  ['Evidence',        'Add evidence in side panel — side panel note is invite-aware'],
  ['Copy claim link', 'Copy link button present in Study view — URL copies correctly'],
  ['Builder',         'Create claim (Steps 1→3) — Step 1 invite copy correct, Step 3 guest note if unverified'],
  ['Public profile',  'Enable public profile on a verified account — /u/:slug loads'],
  ['Direct claim URL','/c/:id URL loads OG shell and auto-opens Study mode'],
  ['Review queue',    'Log in as admin — Review tab appears, queue loads'],
  ['Mobile',          'Narrow to 375px — Home, Study, side panel all usable'],
  ['Social preview',  'Run /c/:id through Twitter Card Validator — preview image renders'],
  ['Rate limits',     'Confirm IP rate limits active (claims: 8/hr, evidence: 20/hr)'],
];

for (const [label, detail] of manual) {
  console.log(`  ${INFO}  [ ]  ${label.padEnd(18)} ${detail}`);
}

// ── SECTION 10: known limitations to tell preview users ───────────────────

console.log('');
console.log(DIVIDER);
console.log('Known limitations — tell each preview user before they start');
console.log(DIVIDER);

const limits = [
  'All evidence/pressure/claims/truths go to Review before appearing publicly.',
  'Tests and analysis are immediately visible — no review buffer.',
  'Anon users can submit to Review queue even without invite (by design for now).',
  'Vote buttons have no selected/active visual after voting.',
  'Study side panel may be partially below fold on small phones.',
  'No self-serve request-access or waitlist — invite codes distributed manually.',
  'No public feedback/contact form — report issues directly to the team.',
  'Reports metric is not shown publicly.',
];

for (const line of limits) {
  console.log(`  ${INFO}  • ${line}`);
}

// ── final result ───────────────────────────────────────────────────────────

console.log('');
console.log(DIVIDER);

if (failed === 0) {
  console.log(`\x1b[32mAll automated checks passed.\x1b[0m Complete manual checklist above before sharing.\n`);
} else {
  console.log(`\x1b[31m${failed} automated check(s) failed. Fix before sharing with external users.\x1b[0m\n`);
}

process.exit(failed > 0 ? 1 : 0);
