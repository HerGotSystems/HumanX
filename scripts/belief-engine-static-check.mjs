/**
 * scripts/belief-engine-static-check.mjs
 *
 * Local static Belief Engine integrity check.
 *
 * WHAT THIS DOES:
 *   Reads local frontend files and asserts that key structural markers are present:
 *   nav links, Drift classification strings, questionnaire content, result sections,
 *   and the humanx-bridge.js script tag. Also checks for accidental provider key
 *   or endpoint exposure.
 *
 * WHAT THIS DOES NOT DO:
 *   - Makes no network calls of any kind
 *   - Causes no mutations (no D1, no Wrangler, no writes)
 *   - Does not execute Belief Engine JavaScript or generate profiles
 *   - Does not prove scoring correctness or that users can complete the flow
 *   - Does not replace manual Belief Engine QA or browser-based tests
 *   - Does not call any production endpoint
 *
 * USAGE:
 *   node scripts/belief-engine-static-check.mjs
 *
 * EXIT CODES:
 *   0 — all hard checks passed
 *   1 — one or more hard checks failed
 *   2 — a required file is missing or unreadable
 *
 * SPEC:
 *   docs/BELIEF_ENGINE_STATIC_CHECK_SPEC.md
 */

import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Root resolution ────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function abs(...parts) {
  return join(ROOT, ...parts);
}

// ── Result tracking ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let warned = 0;

function pass(label) {
  console.log(`  PASS: ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  FAIL: ${label}`);
  if (detail) console.error(`        ${detail}`);
  failed++;
}

function warn(label, detail) {
  console.warn(`  WARN: ${label}`);
  if (detail) console.warn(`        ${detail}`);
  warned++;
}

// ── File helpers ───────────────────────────────────────────────────────────────

async function readRequired(relPath) {
  try {
    return await readFile(abs(relPath), 'utf8');
  } catch {
    console.error(`\nFATAL: Required file missing or unreadable: ${relPath}`);
    process.exit(2);
  }
}

async function readOptional(relPath) {
  try {
    await access(abs(relPath));
    return await readFile(abs(relPath), 'utf8');
  } catch {
    return null;
  }
}

// ── Checks ─────────────────────────────────────────────────────────────────────

function checkContains(content, needle, passLabel, failLabel, file) {
  if (content.includes(needle)) {
    pass(passLabel);
  } else {
    fail(failLabel, `Expected in: ${file}`);
  }
}

function checkAbsent(content, needle, passLabel, failLabel, file) {
  if (!content.includes(needle)) {
    pass(passLabel);
  } else {
    fail(failLabel, `Found in: ${file}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('Belief Engine Static Check');
  console.log('--------------------------');

  // ── 1. Read required files ─────────────────────────────────────────────────

  const mainHtml     = await readRequired('public/index.html');
  const mainApp      = await readRequired('public/app-v10.js');
  const beliefHtml   = await readRequired('public/apps/humanx-belief-engine/index.html');

  pass('public/index.html exists and is readable');
  pass('public/app-v10.js exists and is readable');
  pass('public/apps/humanx-belief-engine/index.html exists and is readable');

  // ── 2. Optional: bridge file ───────────────────────────────────────────────

  const bridgeJs = await readOptional('public/apps/humanx-belief-engine/humanx-bridge.js');
  if (bridgeJs !== null) {
    pass('public/apps/humanx-belief-engine/humanx-bridge.js exists and is readable');
  } else {
    warn(
      'humanx-bridge.js not found',
      'Bridge file is referenced in Belief Engine HTML but missing from disk — packaging risk'
    );
  }

  // ── 3. Main app nav checks ─────────────────────────────────────────────────

  checkContains(
    mainHtml,
    'tab-belief',
    'main app nav contains tab-belief',
    'main app nav missing tab-belief element',
    'public/index.html'
  );

  checkContains(
    mainHtml,
    '/apps/humanx-belief-engine/',
    'main app nav links to /apps/humanx-belief-engine/',
    'main app nav missing link to /apps/humanx-belief-engine/',
    'public/index.html'
  );

  // ── 4. Drift / full-profile classifier ────────────────────────────────────

  const classifierMarkers = [
    'standalone-humanx-belief-engine',
    'humanx-belief-engine',
    'Belief Engine Profile',
  ];
  const classifierFound = classifierMarkers.some(m => mainApp.includes(m));
  if (classifierFound) {
    pass('app-v10.js Drift classifier contains expected full-profile marker string(s)');
  } else {
    fail(
      'app-v10.js Drift classifier missing all full-profile marker strings',
      `Expected at least one of: ${classifierMarkers.map(m => `"${m}"`).join(', ')} — Expected in: public/app-v10.js`
    );
  }

  // Also confirm isFullBeliefProfile function is present
  checkContains(
    mainApp,
    'isFullBeliefProfile',
    'app-v10.js contains isFullBeliefProfile function',
    'app-v10.js missing isFullBeliefProfile function',
    'public/app-v10.js'
  );

  // Home tile link to Belief Engine
  checkContains(
    mainApp,
    '/apps/humanx-belief-engine/',
    'app-v10.js home tile links to /apps/humanx-belief-engine/',
    'app-v10.js home tile missing link to /apps/humanx-belief-engine/',
    'public/app-v10.js'
  );

  // ── 5. Belief Engine identity markers ─────────────────────────────────────

  checkContains(
    beliefHtml,
    'Belief Engine',
    'Belief Engine HTML contains "Belief Engine" identity marker',
    'Belief Engine HTML missing "Belief Engine" identity marker',
    'public/apps/humanx-belief-engine/index.html'
  );

  // ── 6. Questionnaire dimension markers ────────────────────────────────────

  const dimensionMarkers = [
    'Reality & Existence',
    'Truth & Evidence',
    'Authority & Order',
  ];
  for (const marker of dimensionMarkers) {
    checkContains(
      beliefHtml,
      marker,
      `Belief Engine HTML contains questionnaire marker: "${marker}"`,
      `Belief Engine HTML missing questionnaire marker: "${marker}"`,
      'public/apps/humanx-belief-engine/index.html'
    );
  }

  // ── 7. Result / profile section markers ───────────────────────────────────

  checkContains(
    beliefHtml,
    'Your Belief Architecture',
    'Belief Engine HTML contains result marker: "Your Belief Architecture"',
    'Belief Engine HTML missing result marker: "Your Belief Architecture"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Profile Snapshot',
    'Belief Engine HTML contains result marker: "Profile Snapshot"',
    'Belief Engine HTML missing result marker: "Profile Snapshot"',
    'public/apps/humanx-belief-engine/index.html'
  );

  // ── 8. Bridge script tag ───────────────────────────────────────────────────

  checkContains(
    beliefHtml,
    'humanx-bridge.js',
    'Belief Engine HTML references humanx-bridge.js via script tag',
    'Belief Engine HTML missing humanx-bridge.js script reference',
    'public/apps/humanx-belief-engine/index.html'
  );

  // ── 8b. D-306B: intro static output preview ───────────────────────────────

  const introIdx = beliefHtml.indexOf('id="screen-intro"');
  const startQuizIdx = beliefHtml.indexOf('onclick="startQuiz()"');
  const previewIdx = beliefHtml.indexOf('Example — not your result');

  checkContains(
    beliefHtml,
    'Example — not your result',
    'Belief Engine HTML contains D-306B preview label: "Example — not your result"',
    'Belief Engine HTML missing D-306B preview label: "Example — not your result"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'After the questions, Belief Engine gives you a mirror-style snapshot like this.',
    'Belief Engine HTML contains D-306B preview intro line',
    'Belief Engine HTML missing D-306B preview intro line',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Profile Snapshot',
    'Belief Engine HTML contains D-306B preview mini-snapshot label: "Profile Snapshot"',
    'Belief Engine HTML missing D-306B preview mini-snapshot label: "Profile Snapshot"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Strong signal',
    'Belief Engine HTML contains D-306B preview row: "Strong signal"',
    'Belief Engine HTML missing D-306B preview row: "Strong signal"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'You prefer beliefs that can be tested',
    'Belief Engine HTML contains D-306B preview row copy: "You prefer beliefs that can be tested"',
    'Belief Engine HTML missing D-306B preview row copy: "You prefer beliefs that can be tested"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Pressure check',
    'Belief Engine HTML contains D-306B preview row: "Pressure check"',
    'Belief Engine HTML missing D-306B preview row: "Pressure check"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'social pressure',
    'Belief Engine HTML contains D-306B preview row copy: "social pressure"',
    'Belief Engine HTML missing D-306B preview row copy: "social pressure"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Next step',
    'Belief Engine HTML contains D-306B preview row: "Next step"',
    'Belief Engine HTML missing D-306B preview row: "Next step"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Turn one belief into a clearer claim',
    'Belief Engine HTML contains D-306B preview row copy: "Turn one belief into a clearer claim"',
    'Belief Engine HTML missing D-306B preview row copy: "Turn one belief into a clearer claim"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'not a diagnosis, verdict, or proof',
    'Belief Engine HTML contains D-306B preview boundary line: "not a diagnosis, verdict, or proof"',
    'Belief Engine HTML missing D-306B preview boundary line: "not a diagnosis, verdict, or proof"',
    'public/apps/humanx-belief-engine/index.html'
  );

  if (introIdx !== -1 && previewIdx !== -1 && startQuizIdx !== -1 && previewIdx > introIdx && previewIdx < startQuizIdx) {
    pass('D-306B preview appears inside the intro screen, before the Begin Mapping / startQuiz() flow marker');
  } else {
    fail(
      'D-306B preview does not appear before the Begin Mapping / startQuiz() flow marker',
      `screen-intro at ${introIdx}, preview at ${previewIdx}, startQuiz() at ${startQuizIdx}`
    );
  }

  const previewSliceEnd = beliefHtml.indexOf('</section>', previewIdx);
  const previewSlice = previewIdx !== -1 && previewSliceEnd !== -1 ? beliefHtml.slice(previewIdx - 400, previewSliceEnd) : '';

  checkAbsent(
    previewSlice,
    '<button',
    'D-306B preview does not add a button',
    'D-306B preview must not contain a <button> element',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    previewSlice,
    'fetch(',
    'D-306B preview does not add fetch/write/save behavior',
    'D-306B preview must not contain a fetch( call',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    previewSlice,
    'onclick',
    'D-306B preview has no onclick handlers (no interactive/save behavior)',
    'D-306B preview must not contain an onclick handler',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    previewSlice,
    'localStorage',
    'D-306B preview does not add localStorage behavior',
    'D-306B preview must not reference localStorage',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    previewSlice,
    'sessionStorage',
    'D-306B preview does not add sessionStorage behavior',
    'D-306B preview must not reference sessionStorage',
    'public/apps/humanx-belief-engine/index.html'
  );

  const claimTruthMarkers = ['/api/belief-promote', '/api/claims', '/api/truths', '/api/runpack', 'promoteBelief', 'generateRunPack'];
  const claimTruthFound = claimTruthMarkers.filter(m => previewSlice.includes(m));
  if (claimTruthFound.length === 0) {
    pass('D-306B preview does not create Claim/Truth/RunPack behavior');
  } else {
    fail(
      'D-306B preview must not reference Claim/Truth/RunPack creation',
      `Found: ${claimTruthFound.map(m => `"${m}"`).join(', ')}`
    );
  }

  checkContains(
    beliefHtml,
    'No diagnosis.',
    'D-306B preserves existing "No diagnosis." intro copy',
    'D-306B must not remove existing "No diagnosis." intro copy',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Use it as a mirror, not a verdict.',
    'D-306B preserves existing "mirror not a verdict" results copy',
    'D-306B must not remove existing "mirror not a verdict" results copy',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    '77',
    'D-306B preserves existing 77-statement marker',
    'D-306B must not remove the 77-statement marker',
    'public/apps/humanx-belief-engine/index.html'
  );

  // ── 9. No accidental API key / secret exposure ────────────────────────────

  const keyMarkers = ['sk-ant-', 'sk-proj-', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'Bearer '];
  const providerUrls = ['api.anthropic.com', 'api.openai.com'];

  for (const marker of keyMarkers) {
    checkAbsent(
      beliefHtml,
      marker,
      `Belief Engine HTML does not contain API key marker: "${marker}"`,
      `Belief Engine HTML contains potential API key marker: "${marker}" — review immediately`,
      'public/apps/humanx-belief-engine/index.html'
    );
  }

  for (const url of providerUrls) {
    checkAbsent(
      beliefHtml,
      url,
      `Belief Engine HTML does not contain provider API URL: "${url}"`,
      `Belief Engine HTML contains direct provider API URL: "${url}" — review immediately`,
      'public/apps/humanx-belief-engine/index.html'
    );
  }

  // ── 10. WARN: bridge file marker checks (soft) ────────────────────────────

  if (bridgeJs !== null) {
    const bridgeMarkers = [
      'standalone-humanx-belief-engine',
      'humanx-belief-engine',
      'Belief Engine Profile',
      '/api/belief-snapshots',
    ];
    const bridgeFound = bridgeMarkers.filter(m => bridgeJs.includes(m));
    const bridgeMissing = bridgeMarkers.filter(m => !bridgeJs.includes(m));

    if (bridgeFound.length > 0) {
      pass(`humanx-bridge.js contains bridge/profile marker(s): ${bridgeFound.map(m => `"${m}"`).join(', ')}`);
    }
    if (bridgeMissing.length > 0) {
      warn(
        `humanx-bridge.js missing expected marker(s): ${bridgeMissing.map(m => `"${m}"`).join(', ')}`,
        'These strings are expected in the bridge payload — verify bridge is still wiring isFullBeliefProfile fields correctly'
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const total = passed + failed;
  console.log('--------------------------');
  console.log(`  ${passed} passed, ${failed} failed${warned > 0 ? `, ${warned} warn` : ''} (${total} hard checks)`);
  console.log('');

  if (failed > 0) {
    console.error(`  BELIEF ENGINE STATIC CHECK FAILED — ${failed} hard check(s) did not pass.`);
    console.error('  Review failures before making any Belief Engine or Drift classification change.');
    console.log('');
    process.exit(1);
  }

  console.log('  All hard checks passed.');
  if (warned > 0) {
    console.warn(`  ${warned} warning(s) above — review before changing bridge or packaging.`);
  }
  console.log('');
  process.exit(0);
}

main().catch(err => {
  console.error('\nUnhandled error during static check:');
  console.error(err);
  process.exit(1);
});
