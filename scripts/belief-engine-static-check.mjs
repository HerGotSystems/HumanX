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

  // ── 8c. D-308B: safe Back to HumanX links ─────────────────────────────────

  const introStart = beliefHtml.indexOf('id="screen-intro"');
  const identityStart = beliefHtml.indexOf('id="screen-identity"');
  const timelineStart = beliefHtml.indexOf('id="screen-timeline"');
  const quizStart = beliefHtml.indexOf('id="screen-quiz"');
  const resultsStart = beliefHtml.indexOf('id="screen-results"');
  const scriptStart = beliefHtml.indexOf('<script>');

  const introScreenSlice = beliefHtml.slice(introStart, identityStart);
  const identityScreenSlice = beliefHtml.slice(identityStart, timelineStart);
  const timelineScreenSlice = beliefHtml.slice(timelineStart, quizStart);
  const quizScreenSlice = beliefHtml.slice(quizStart, resultsStart);
  const resultsScreenSlice = beliefHtml.slice(resultsStart, scriptStart);

  checkContains(
    introScreenSlice,
    '← Back to HumanX',
    'D-308B: screen-intro contains "← Back to HumanX"',
    'D-308B: screen-intro missing "← Back to HumanX"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    introScreenSlice,
    'href="/"',
    'D-308B: screen-intro back link points to "/"',
    'D-308B: screen-intro back link does not point to "/"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    '← Back to HumanX',
    'D-308B: screen-results contains "← Back to HumanX"',
    'D-308B: screen-results missing "← Back to HumanX"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'href="/"',
    'D-308B: screen-results back link points to "/"',
    'D-308B: screen-results back link does not point to "/"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    identityScreenSlice,
    '← Back to HumanX',
    'D-308B: screen-identity does not contain "← Back to HumanX" (progress-loss risk screen)',
    'D-308B: screen-identity must not contain the back link — progress-loss risk',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    timelineScreenSlice,
    '← Back to HumanX',
    'D-308B: screen-timeline does not contain "← Back to HumanX" (progress-loss risk screen)',
    'D-308B: screen-timeline must not contain the back link — progress-loss risk',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    quizScreenSlice,
    '← Back to HumanX',
    'D-308B: screen-quiz does not contain "← Back to HumanX" (progress-loss risk screen)',
    'D-308B: screen-quiz must not contain the back link — progress-loss risk',
    'public/apps/humanx-belief-engine/index.html'
  );

  const backLinkMarkers = ['/api/belief-promote', '/api/claims', '/api/truths', '/api/runpack', 'promoteBelief', 'generateRunPack', 'fetch('];
  const introBackLinkArea = introScreenSlice.slice(0, introScreenSlice.indexOf('← Back to HumanX') + 50);
  const resultsBackLinkArea = resultsScreenSlice.slice(0, resultsScreenSlice.indexOf('← Back to HumanX') + 50);
  const backLinkFound = backLinkMarkers.filter(m => introBackLinkArea.includes(m) || resultsBackLinkArea.includes(m));
  if (backLinkFound.length === 0) {
    pass('D-308B back links do not create Claim/Truth/RunPack behavior or add fetch/write/save behavior');
  } else {
    fail(
      'D-308B back links must not reference Claim/Truth/RunPack creation or fetch/write/save behavior',
      `Found: ${backLinkFound.map(m => `"${m}"`).join(', ')}`
    );
  }

  checkContains(
    beliefHtml,
    'function saveRunRecord',
    'D-308B preserves saveRunRecord() function unchanged',
    'D-308B must not remove saveRunRecord()',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Example — not your result',
    'D-308B preserves existing D-306B preview label',
    'D-308B must not remove the D-306B preview label',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'No diagnosis.',
    'D-308B preserves existing "No diagnosis." intro copy',
    'D-308B must not remove existing "No diagnosis." intro copy',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Use it as a mirror, not a verdict.',
    'D-308B preserves existing "mirror not a verdict" results copy',
    'D-308B must not remove existing "mirror not a verdict" results copy',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    beliefHtml,
    'irrational',
    'D-308B does not introduce "irrational" user-labeling language',
    'D-308B must not introduce "irrational" user-labeling language',
    'public/apps/humanx-belief-engine/index.html'
  );

  // ── 8d. D-310B: results Review handoff sentence ───────────────────────────

  const reviewSentence = 'If you turn one belief into a HumanX claim, public display still waits for Review — admin approval, not automatic proof.';
  const nextTestIdx = resultsScreenSlice.indexOf('What to Test Next');
  const reviewSentenceIdx = resultsScreenSlice.indexOf(reviewSentence);
  const nextActionRowIdx = resultsScreenSlice.indexOf('next-action-row');

  checkContains(
    resultsScreenSlice,
    reviewSentence,
    'D-310B: screen-results contains the Review handoff sentence',
    'D-310B: screen-results missing the Review handoff sentence',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'Review',
    'D-310B: Review handoff sentence mentions "Review"',
    'D-310B: Review handoff sentence must mention "Review"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'admin approval',
    'D-310B: Review handoff sentence includes admin approval meaning',
    'D-310B: Review handoff sentence must include admin approval meaning',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'not automatic proof',
    'D-310B: Review handoff sentence includes "not automatic proof"',
    'D-310B: Review handoff sentence must include "not automatic proof"',
    'public/apps/humanx-belief-engine/index.html'
  );

  if (nextTestIdx !== -1 && reviewSentenceIdx !== -1 && nextActionRowIdx !== -1 && nextTestIdx < reviewSentenceIdx && reviewSentenceIdx < nextActionRowIdx) {
    pass('D-310B: Review handoff sentence appears inside the existing "What to Test Next" section, before the next-action links');
  } else {
    fail(
      'D-310B: Review handoff sentence must appear inside "What to Test Next", before the next-action links',
      `"What to Test Next" at ${nextTestIdx}, sentence at ${reviewSentenceIdx}, next-action-row at ${nextActionRowIdx}`
    );
  }

  const whatToTestNextCount = (beliefHtml.match(/What to Test Next/g) || []).length;
  if (whatToTestNextCount === 1) {
    pass('D-310B: no second/new "What to Test Next" card was added — exactly one occurrence');
  } else {
    fail(
      'D-310B: "What to Test Next" must appear exactly once (no duplicate card)',
      `Found ${whatToTestNextCount} occurrences`
    );
  }

  checkContains(
    resultsScreenSlice,
    'https://humanx.rinkimirikata.com/#claims',
    'D-310B: existing "Browse Claims" link preserved',
    'D-310B: existing "Browse Claims" link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'https://humanx.rinkimirikata.com/#submit',
    'D-310B: existing "Submit a Claim" link preserved',
    'D-310B: existing "Submit a Claim" link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'https://humanx.rinkimirikata.com/#truths',
    'D-310B: existing "Browse Truths" link preserved',
    'D-310B: existing "Browse Truths" link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'humanx-bridge.js',
    'D-310B: existing bridge/export script reference preserved',
    'D-310B: existing bridge/export script reference must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  const reviewSentenceArea = resultsScreenSlice.slice(Math.max(0, reviewSentenceIdx - 50), reviewSentenceIdx + reviewSentence.length + 50);
  const noCreationMarkers = ['/api/belief-promote', '/api/claims', '/api/truths', '/api/runpack', 'promoteBelief', 'generateRunPack', 'fetch(', 'localStorage', 'sessionStorage'];
  const creationFound = noCreationMarkers.filter(m => reviewSentenceArea.includes(m));
  if (creationFound.length === 0) {
    pass('D-310B: Review handoff sentence adds no Claim/Truth/RunPack creation or fetch/write/save behavior');
  } else {
    fail(
      'D-310B: Review handoff sentence must not introduce Claim/Truth/RunPack creation or fetch/write/save behavior',
      `Found: ${creationFound.map(m => `"${m}"`).join(', ')}`
    );
  }

  checkContains(
    introScreenSlice,
    '← Back to HumanX',
    'D-310B: existing D-308B intro back link preserved',
    'D-310B: existing D-308B intro back link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    '← Back to HumanX',
    'D-310B: existing D-308B results back link preserved',
    'D-310B: existing D-308B results back link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    identityScreenSlice,
    '← Back to HumanX',
    'D-310B: back link still absent from screen-identity',
    'D-310B: back link must remain absent from screen-identity',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    timelineScreenSlice,
    '← Back to HumanX',
    'D-310B: back link still absent from screen-timeline',
    'D-310B: back link must remain absent from screen-timeline',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    quizScreenSlice,
    '← Back to HumanX',
    'D-310B: back link still absent from screen-quiz',
    'D-310B: back link must remain absent from screen-quiz',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Example — not your result',
    'D-310B: existing D-306B preview label preserved',
    'D-310B: existing D-306B preview label must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'No diagnosis.',
    'D-310B: existing "No diagnosis." copy preserved',
    'D-310B: existing "No diagnosis." copy must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Use it as a mirror, not a verdict.',
    'D-310B: existing "mirror not a verdict" copy preserved',
    'D-310B: existing "mirror not a verdict" copy must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'This is not a diagnosis, verdict, or proof — it is a reflection aid.',
    'D-310B: existing D-306B boundary line preserved',
    'D-310B: existing D-306B boundary line must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    reviewSentenceArea,
    'is proof',
    'D-310B: Review handoff sentence does not claim Review is proof',
    'D-310B: Review handoff sentence must not claim Review is proof',
    'public/apps/humanx-belief-engine/index.html'
  );

  // ── 8e. D-312B: Export & Share Drift/Review copy ──────────────────────────

  const exportShareSentence = 'Download or copy your pressure map. "Send to HumanX" saves a snapshot to your Drift — it does not publish anything automatically. Saving to Drift does not publish a Truth; any public display still waits for Review.';
  const exportShareIdx = resultsScreenSlice.indexOf(exportShareSentence);
  const shareHeadingIdx = resultsScreenSlice.indexOf('Export &amp; Share');
  const shareActionsIdx = resultsScreenSlice.indexOf('class="results-actions"');

  checkContains(
    resultsScreenSlice,
    exportShareSentence,
    'D-312B: Export & Share copy contains the updated Drift/Review paragraph',
    'D-312B: Export & Share copy missing the updated Drift/Review paragraph',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'to your Drift',
    'D-312B: Export & Share copy mentions "Drift" as the save destination',
    'D-312B: Export & Share copy must mention "Drift" as the save destination',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    beliefHtml,
    'your session',
    'D-312B: vague "your session" wording removed from index.html',
    'D-312B: vague "your session" wording must not remain in index.html',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'Review',
    'D-312B: Export & Share copy mentions "Review"',
    'D-312B: Export & Share copy must mention "Review"',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'does not publish a Truth',
    'D-312B: Export & Share copy says saving does not publish a Truth',
    'D-312B: Export & Share copy must say saving does not publish a Truth',
    'public/apps/humanx-belief-engine/index.html'
  );

  const exportShareArea = exportShareIdx !== -1 ? resultsScreenSlice.slice(exportShareIdx, exportShareIdx + exportShareSentence.length) : '';

  checkAbsent(
    exportShareArea,
    'is proof',
    'D-312B: Export & Share copy does not claim Review is proof',
    'D-312B: Export & Share copy must not claim Review is proof',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    exportShareArea,
    'verified',
    'D-312B: Export & Share copy does not claim Review is verification',
    'D-312B: Export & Share copy must not claim Review is verification',
    'public/apps/humanx-belief-engine/index.html'
  );

  if (shareHeadingIdx !== -1 && exportShareIdx !== -1 && shareActionsIdx !== -1 && shareHeadingIdx < exportShareIdx && exportShareIdx < shareActionsIdx) {
    pass('D-312B: Drift/Review copy appears inside the existing Export & Share section');
  } else {
    fail(
      'D-312B: Drift/Review copy must appear inside the existing Export & Share section',
      `"Export & Share" heading at ${shareHeadingIdx}, copy at ${exportShareIdx}, results-actions at ${shareActionsIdx}`
    );
  }

  const exportShareHeadingCount = (beliefHtml.match(/Export &amp; Share/g) || []).length;
  if (exportShareHeadingCount === 1) {
    pass('D-312B: no second/new Export & Share card was added — exactly one occurrence');
  } else {
    fail(
      'D-312B: "Export & Share" must appear exactly once (no duplicate card)',
      `Found ${exportShareHeadingCount} occurrences`
    );
  }

  checkContains(
    resultsScreenSlice,
    'https://humanx.rinkimirikata.com/#claims',
    'D-312B: existing "Browse Claims" link preserved',
    'D-312B: existing "Browse Claims" link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'https://humanx.rinkimirikata.com/#submit',
    'D-312B: existing "Submit a Claim" link preserved',
    'D-312B: existing "Submit a Claim" link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    'https://humanx.rinkimirikata.com/#truths',
    'D-312B: existing "Browse Truths" link preserved',
    'D-312B: existing "Browse Truths" link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'humanx-bridge.js',
    'D-312B: existing bridge/export script reference preserved',
    'D-312B: existing bridge/export script reference must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  if (bridgeJs !== null) {
    checkContains(
      bridgeJs,
      'for your own review only',
      'D-312B: humanx-bridge.js untouched — pre-existing injected note text unchanged',
      'D-312B: humanx-bridge.js must not be modified by this task',
      'public/apps/humanx-belief-engine/humanx-bridge.js'
    );
    checkContains(
      bridgeJs,
      'Saved: dimension scores, alignment patterns, contradiction summary, and moral-scenario responses.',
      'D-312B: humanx-bridge.js untouched — pre-existing "Saved:" list unchanged',
      'D-312B: humanx-bridge.js "Saved:" list must not be modified by this task',
      'public/apps/humanx-belief-engine/humanx-bridge.js'
    );
  }

  const noCreationMarkersExportShare = ['/api/belief-promote', '/api/claims', '/api/truths', '/api/runpack', 'promoteBelief', 'generateRunPack', 'fetch(', 'localStorage', 'sessionStorage'];
  const creationFoundExportShare = noCreationMarkersExportShare.filter(m => exportShareArea.includes(m));
  if (creationFoundExportShare.length === 0) {
    pass('D-312B: Export & Share copy adds no Claim/Truth/RunPack creation or fetch/write/save behavior');
  } else {
    fail(
      'D-312B: Export & Share copy must not introduce Claim/Truth/RunPack creation or fetch/write/save behavior',
      `Found: ${creationFoundExportShare.map(m => `"${m}"`).join(', ')}`
    );
  }

  checkContains(
    beliefHtml,
    'If you turn one belief into a HumanX claim, public display still waits for Review — admin approval, not automatic proof.',
    'D-312B: existing D-310B Review handoff sentence preserved',
    'D-312B: existing D-310B Review handoff sentence must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    introScreenSlice,
    '← Back to HumanX',
    'D-312B: existing D-308B intro back link preserved',
    'D-312B: existing D-308B intro back link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    resultsScreenSlice,
    '← Back to HumanX',
    'D-312B: existing D-308B results back link preserved',
    'D-312B: existing D-308B results back link must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    identityScreenSlice,
    '← Back to HumanX',
    'D-312B: back link still absent from screen-identity',
    'D-312B: back link must remain absent from screen-identity',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    timelineScreenSlice,
    '← Back to HumanX',
    'D-312B: back link still absent from screen-timeline',
    'D-312B: back link must remain absent from screen-timeline',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkAbsent(
    quizScreenSlice,
    '← Back to HumanX',
    'D-312B: back link still absent from screen-quiz',
    'D-312B: back link must remain absent from screen-quiz',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Example — not your result',
    'D-312B: existing D-306B preview label preserved',
    'D-312B: existing D-306B preview label must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'No diagnosis.',
    'D-312B: existing "No diagnosis." copy preserved',
    'D-312B: existing "No diagnosis." copy must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'Use it as a mirror, not a verdict.',
    'D-312B: existing "mirror not a verdict" copy preserved',
    'D-312B: existing "mirror not a verdict" copy must remain unchanged',
    'public/apps/humanx-belief-engine/index.html'
  );

  checkContains(
    beliefHtml,
    'This is not a diagnosis, verdict, or proof — it is a reflection aid.',
    'D-312B: existing D-306B boundary line preserved',
    'D-312B: existing D-306B boundary line must remain unchanged',
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
