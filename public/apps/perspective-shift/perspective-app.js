import { PERSPECTIVE_LENSES, PERSPECTIVE_MOVEMENTS, PERSPECTIVE_SCENARIOS, scorePerspectiveShift } from './perspective-core.js';
import { PERSPECTIVE_CZECH, PERSPECTIVE_UI } from './perspective-copy.js';
import { createTranslator, languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const app = document.getElementById('app');
const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
const t = createTranslator(PERSPECTIVE_UI, language);
const state = { index: 0, phase: 'first', responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function localLens(key) {
  const base = PERSPECTIVE_LENSES.find(lens => lens.key === key) || { key, label: key, description: '' };
  return language === 'cs' ? { ...base, ...(PERSPECTIVE_CZECH.lenses[key] || {}) } : base;
}

function localMovement(key) {
  const base = PERSPECTIVE_MOVEMENTS.find(movement => movement.key === key) || { key, label: key, description: '' };
  return language === 'cs' ? { ...base, ...(PERSPECTIVE_CZECH.movements[key] || {}) } : base;
}

function localScenario(scenario) {
  return language === 'cs' ? { ...scenario, ...(PERSPECTIVE_CZECH.scenarios[scenario.id] || {}) } : scenario;
}

function setupLanguage() {
  document.documentElement.lang = language;
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('pageDescription'));
  const back = document.querySelector('.back-link');
  back.textContent = t('back');
  back.href = pathWithLanguage('/', language);
  document.getElementById('language-switch-slot').innerHTML = languageSwitcherMarkup(language, t('language'));
}

function lensLabel(key) {
  return localLens(key).label;
}

function movementLabel(key) {
  return localMovement(key).label;
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { initialLens: null, finalLens: null, settled: 3, movement: null, unresolved: false };
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">${esc(t('eyebrow'))}</span><h1>${esc(t('title'))}</h1><p class="lead">${esc(t('lead'))}</p><div class="boundary"><strong>${esc(t('boundaryTitle'))}</strong><p class="muted">${esc(t('boundaryBody'))}</p></div><p>${esc(t('intro'))}</p><details class="plain-help"><summary>${esc(t('simpleSummary'))}</summary><p>${esc(t('simpleBody'))}</p><p class="muted">${esc(t('simpleExample'))}</p></details><div class="actions"><button class="btn btn-primary" id="startShift">${esc(t('start'))}</button></div><p class="muted privacy-note"><span class="badge badge-private">${esc(t('sessionOnly'))}</span> ${esc(t('privacy'))}</p></section>`;
  document.getElementById('startShift').addEventListener('click', () => {
    state.index = 0;
    state.phase = 'first';
    state.responses = {};
    firstScreen();
  });
}

function progressMarkup(stage) {
  const complete = state.index * 2 + (state.phase === 'second' ? 2 : 1);
  const total = PERSPECTIVE_SCENARIOS.length * 2;
  const progress = Math.round((complete / total) * 100);
  const label = t('situationProgress', { current: state.index + 1, total: PERSPECTIVE_SCENARIOS.length, stage });
  return `<div class="progress-row"><span>${esc(label)}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div>`;
}

function lensChoices(selected, attribute) {
  return PERSPECTIVE_LENSES.map(item => {
    const lens = localLens(item.key);
    return `<button class="choice${selected === lens.key ? ' selected' : ''}" type="button" ${attribute}="${esc(lens.key)}"><strong>${esc(lens.label)}</strong><span>${esc(lens.description)}</span></button>`;
  }).join('');
}

function firstScreen() {
  const source = PERSPECTIVE_SCENARIOS[state.index];
  const scenario = localScenario(source);
  const response = currentResponse(source.id);
  app.innerHTML = `<section class="card">${progressMarkup(t('firstStage'))}<span class="badge">${esc(t('firstBadge'))}</span><h2>${esc(scenario.title)}</h2><div class="account account-first"><div class="account-head"><b>${esc(t('position', { name: scenario.first.position }))}</b><span class="muted">${esc(t('accountOne'))}</span></div><p>${esc(scenario.first.account)}</p></div><p class="stage-question">${esc(t('firstQuestion'))}</p><div class="choice-grid">${lensChoices(response.initialLens, 'data-initial-lens')}</div><div class="settled-box"><div class="settled-head"><label for="settled">${esc(t('settledQuestion'))}</label><span class="settled-value" id="settledValue">${response.settled} / 5</span></div><input class="settled-input" id="settled" type="range" min="1" max="5" step="1" value="${response.settled}" ${!response.initialLens || response.unresolved ? 'disabled' : ''}><div class="settled-scale"><span>${esc(t('settledLow'))}</span><span>${esc(t('settledMiddle'))}</span><span>${esc(t('settledHigh'))}</span></div></div><p class="muted">${esc(t('settledNote'))}</p><div class="actions"><button class="btn btn-quiet" id="backSituation" ${state.index === 0 ? 'disabled' : ''}>${esc(t('backButton'))}</button><button class="btn" id="leaveUnresolved">${esc(t('unresolvedButton'))}</button><button class="btn btn-primary" id="revealPosition" ${!response.initialLens || response.unresolved ? 'disabled' : ''}>${esc(t('revealButton'))}</button></div></section>`;

  document.querySelectorAll('[data-initial-lens]').forEach(button => button.addEventListener('click', () => {
    state.responses[source.id] = { initialLens: button.dataset.initialLens, finalLens: null, settled: response.settled ?? 3, movement: null, unresolved: false };
    firstScreen();
  }));
  document.getElementById('settled').addEventListener('input', event => {
    const saved = currentResponse(source.id);
    saved.settled = Number(event.target.value);
    saved.unresolved = false;
    state.responses[source.id] = saved;
    document.getElementById('settledValue').textContent = `${saved.settled} / 5`;
  });
  document.getElementById('leaveUnresolved').addEventListener('click', () => {
    state.responses[source.id] = { initialLens: null, finalLens: null, settled: 3, movement: null, unresolved: true };
    advance();
  });
  document.getElementById('backSituation').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      state.phase = currentResponse(PERSPECTIVE_SCENARIOS[state.index].id).unresolved ? 'first' : 'second';
      state.phase === 'second' ? secondScreen() : firstScreen();
    }
  });
  document.getElementById('revealPosition').addEventListener('click', () => {
    state.phase = 'second';
    secondScreen();
  });
}

function secondScreen() {
  const source = PERSPECTIVE_SCENARIOS[state.index];
  const scenario = localScenario(source);
  const response = currentResponse(source.id);
  if (!response.initialLens || response.unresolved) {
    state.phase = 'first';
    return firstScreen();
  }
  const movements = PERSPECTIVE_MOVEMENTS.map(item => {
    const movement = localMovement(item.key);
    return `<button class="movement${response.movement === movement.key ? ' selected' : ''}" type="button" data-movement="${esc(movement.key)}"><strong>${esc(movement.label)}</strong><span>${esc(movement.description)}</span></button>`;
  }).join('');
  app.innerHTML = `<section class="card">${progressMarkup(t('secondStage'))}<span class="badge badge-second">${esc(t('secondBadge'))}</span><h2>${esc(scenario.title)}</h2><div class="initial-record">${esc(t('initialRecord', { lens: lensLabel(response.initialLens), settled: response.settled }))}</div><div class="account account-second"><div class="account-head"><b>${esc(t('position', { name: scenario.second.position }))}</b><span class="muted">${esc(t('accountTwo'))}</span></div><p>${esc(scenario.second.account)}</p></div><p class="muted">${esc(t('secondNote'))}</p><p class="stage-question">${esc(t('secondQuestion'))}</p><div class="choice-grid">${lensChoices(response.finalLens, 'data-final-lens')}</div><p class="stage-question">${esc(t('movementQuestion'))}</p><div class="movement-grid">${movements}</div><div class="actions"><button class="btn btn-quiet" id="reviewFirst">${esc(t('reviewFirst'))}</button><button class="btn btn-primary" id="nextSituation" ${!response.finalLens || !response.movement ? 'disabled' : ''}>${esc(state.index === PERSPECTIVE_SCENARIOS.length - 1 ? t('seeResults') : t('next'))}</button></div></section>`;

  document.querySelectorAll('[data-final-lens]').forEach(button => button.addEventListener('click', () => {
    const saved = currentResponse(source.id);
    saved.finalLens = button.dataset.finalLens;
    saved.unresolved = false;
    state.responses[source.id] = saved;
    secondScreen();
  }));
  document.querySelectorAll('[data-movement]').forEach(button => button.addEventListener('click', () => {
    const saved = currentResponse(source.id);
    saved.movement = button.dataset.movement;
    saved.unresolved = false;
    state.responses[source.id] = saved;
    secondScreen();
  }));
  document.getElementById('reviewFirst').addEventListener('click', () => {
    state.phase = 'first';
    firstScreen();
  });
  document.getElementById('nextSituation').addEventListener('click', advance);
}

function advance() {
  if (state.index < PERSPECTIVE_SCENARIOS.length - 1) {
    state.index += 1;
    state.phase = 'first';
    firstScreen();
  } else {
    resultScreen();
  }
}

function resultObservations(result) {
  const maxInitial = Math.max(0, ...result.lensRows.map(row => row.initial));
  const leading = maxInitial ? result.lensRows.filter(row => row.initial === maxInitial) : [];
  const observations = [];
  if (!result.resolved) {
    observations.push(t('observationEmpty'));
  } else if (leading.length === 1) {
    observations.push(t('observationLeader', { lens: lensLabel(leading[0].key).toLowerCase(), count: maxInitial, resolved: result.resolved }));
  } else {
    observations.push(t('observationTie', { lenses: leading.map(row => lensLabel(row.key)).join(', '), count: maxInitial }));
  }
  if (result.resolved) {
    observations.push(t('observationChanges', { count: result.lensChanges, resolved: result.resolved }));
    observations.push(t('observationReconsidered', { count: result.reconsidered, resolved: result.resolved }));
  }
  if (result.highSettledReconsidered.length) observations.push(t('observationHigh', { count: result.highSettledReconsidered.length }));
  if (result.unresolved) observations.push(t('observationUnresolved', { count: result.unresolved }));
  observations.push(t('observationBoundary'));
  return observations;
}

function resultScreen() {
  const result = scorePerspectiveShift(state.responses);
  const lensRows = result.lensRows.map(row => {
    const lens = localLens(row.key);
    return `<div class="lens-row"><div class="lens-head"><span><b>${esc(lens.label)}</b><small>${esc(lens.description)}</small></span><strong>${row.initial} → ${row.after}</strong></div><p>${esc(t('firstAccountCount', { initial: row.initial, after: row.after }))}</p></div>`;
  }).join('');
  const movementRows = result.movementRows.map(row => {
    const movement = localMovement(row.key);
    return `<div class="movement-row"><div class="movement-head"><b>${esc(movement.label)}</b><strong>${row.count}</strong></div><p>${esc(movement.description)}</p></div>`;
  }).join('');
  const changed = result.details.filter(row => !row.unresolved && row.lensChanged);
  const shiftCards = changed.length ? changed.map(row => {
    const scenario = localScenario(PERSPECTIVE_SCENARIOS.find(item => item.id === row.scenarioId));
    return `<div class="shift-card"><span class="badge">${esc(t('startedSettled', { settled: row.settled }))}</span><h4>${esc(scenario.title)}</h4><p><b>${esc(lensLabel(row.initialLens))}</b> → <b>${esc(lensLabel(row.finalLens))}</b></p><p class="muted">${esc(movementLabel(row.movement))}</p></div>`;
  }).join('') : `<p class="muted">${esc(t('noLensChanges'))}</p>`;
  const trail = result.details.map((row, index) => {
    const scenario = localScenario(PERSPECTIVE_SCENARIOS[index]);
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.title)}</span><strong class="result-unresolved">${esc(t('unresolved'))}</strong></summary><p>${esc(t('unresolvedTrail'))}</p></details>`;
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.title)}</span><strong>${esc(lensLabel(row.initialLens))} → ${esc(lensLabel(row.finalLens))}</strong></summary><p><b>${esc(scenario.first.position)}:</b> ${esc(scenario.first.account)}</p><p><b>${esc(scenario.second.position)}:</b> ${esc(scenario.second.account)}</p><p>${esc(t('firstTrail', { lens: lensLabel(row.initialLens), settled: row.settled }))}</p><p>${esc(t('afterTrail', { lens: lensLabel(row.finalLens), movement: movementLabel(row.movement) }))}</p></details>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">${esc(t('resultsEyebrow'))}</span><h2>${esc(t('resultsTitle'))}</h2><p class="muted">${esc(t('resultsIntro'))}</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>${esc(t('resolvedPairs'))}</span></div><div class="metric"><b>${result.unresolved}</b><span>${esc(t('unresolvedPairs'))}</span></div><div class="metric"><b>${result.lensChanges}</b><span>${esc(t('lensChanges'))}</span></div><div class="metric"><b>${result.reconsidered}</b><span>${esc(t('reconsidered'))}</span></div></div><section><h3>${esc(t('sessionHeading'))}</h3><ul class="observation-list">${resultObservations(result).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>${esc(t('lensHeading'))}</h3><div class="lens-map">${lensRows}</div></section><section><h3>${esc(t('movementHeading'))}</h3><div class="movement-map">${movementRows}</div></section><section><h3>${esc(t('changedHeading'))}</h3><div class="shift-list">${shiftCards}</div></section><section><h3>${esc(t('trailHeading'))}</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>${esc(t('finalBoundaryTitle'))}</strong><p class="muted">${esc(t('finalBoundaryBody'))}</p></div><div class="actions"><button class="btn btn-primary" id="retakeShift">${esc(t('retake'))}</button><a class="btn" href="${esc(pathWithLanguage('/', language))}">${esc(t('return'))}</a></div></section>`;
  document.getElementById('retakeShift').addEventListener('click', introScreen);
}

setupLanguage();
introScreen();
