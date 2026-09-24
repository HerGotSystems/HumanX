import { UNCERTAINTY_MODES, UNCERTAINTY_SCENARIOS, scoreMissingInformation } from './uncertainty-core.js';
import { UNCERTAINTY_CZECH, UNCERTAINTY_UI } from './uncertainty-copy.js';
import { createTranslator, languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const app = document.getElementById('app');
const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
const t = createTranslator(UNCERTAINTY_UI, language);
const state = { index: 0, phase: 'initial', responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function localMode(key) {
  const base = UNCERTAINTY_MODES.find(mode => mode.key === key) || { key, label: key, description: '' };
  return language === 'cs' ? { ...base, ...(UNCERTAINTY_CZECH.modes[key] || {}) } : base;
}

function localScenario(scenario) {
  return language === 'cs' ? { ...scenario, ...(UNCERTAINTY_CZECH.scenarios[scenario.id] || {}) } : scenario;
}

function localAction(scenario, actionId) {
  return scenario.actions.find(action => action.id === actionId);
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

function modeLabel(key) {
  return localMode(key).label;
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { initialActionId: null, finalActionId: null, readiness: 3, unresolved: false };
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">${esc(t('eyebrow'))}</span><h1>${esc(t('title'))}</h1><p class="lead">${esc(t('lead'))}</p><div class="boundary"><strong>${esc(t('boundaryTitle'))}</strong><p class="muted">${esc(t('boundaryBody'))}</p></div><p>${esc(t('intro'))}</p><details class="plain-help"><summary>${esc(t('simpleSummary'))}</summary><p>${esc(t('simpleBody'))}</p><p class="muted">${esc(t('simpleExample'))}</p></details><div class="actions"><button class="btn btn-primary" id="startLab">${esc(t('start'))}</button></div><p class="muted privacy-note"><span class="badge badge-private">${esc(t('sessionOnly'))}</span> ${esc(t('privacy'))}</p></section>`;
  document.getElementById('startLab').addEventListener('click', () => {
    state.index = 0;
    state.phase = 'initial';
    state.responses = {};
    renderStage();
  });
}

function actionCards(scenario, selectedId, attribute) {
  return scenario.actions.map(action => `<button class="choice${selectedId === action.id ? ' selected' : ''}" type="button" ${attribute}="${esc(action.id)}"><span class="choice-mode">${esc(modeLabel(action.mode))}</span><strong>${esc(action.label)}</strong><span class="choice-tradeoff">${esc(t('tradeoff', { text: action.tradeoff }))}</span></button>`).join('');
}

function progressMarkup(stageLabel) {
  const completedStages = state.index * 2 + (state.phase === 'reveal' ? 2 : 1);
  const totalStages = UNCERTAINTY_SCENARIOS.length * 2;
  const progress = Math.round((completedStages / totalStages) * 100);
  const label = t('progress', { current: state.index + 1, total: UNCERTAINTY_SCENARIOS.length, stage: stageLabel });
  return `<div class="progress-row"><span>${esc(label)}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div>`;
}

function renderStage() {
  if (state.phase === 'reveal') revealScreen();
  else initialScreen();
}

function initialScreen() {
  const source = UNCERTAINTY_SCENARIOS[state.index];
  const scenario = localScenario(source);
  const response = currentResponse(source.id);
  const choices = actionCards(scenario, response.initialActionId, 'data-initial-action');
  const nextLabel = response.unresolved ? t('continueUnresolved') : t('revealFact');
  const note = response.unresolved ? `<p class="unresolved-note">${esc(t('unresolvedNote'))}</p>` : `<p class="defer-note">${esc(t('readinessNote'))}</p>`;
  app.innerHTML = `<section class="card">${progressMarkup(t('initialStage'))}<span class="badge">${esc(t('beforeFact'))}</span><h2>${esc(scenario.prompt)}</h2><p class="stage-question">${esc(t('firstQuestion'))}</p><div class="choice-grid">${choices}</div><div class="readiness-box"><div class="readiness-head"><label for="readiness">${esc(t('readinessQuestion'))}</label><span class="readiness-value" id="readinessValue">${response.readiness} / 5</span></div><input class="readiness-input" id="readiness" type="range" min="1" max="5" step="1" value="${response.readiness}" ${response.unresolved || !response.initialActionId ? 'disabled' : ''}><div class="readiness-scale"><span>${esc(t('readinessLow'))}</span><span>${esc(t('readinessMiddle'))}</span><span>${esc(t('readinessHigh'))}</span></div></div>${note}<div class="actions"><button class="btn btn-quiet" id="backStage" ${state.index === 0 ? 'disabled' : ''}>${esc(t('backButton'))}</button><button class="btn" id="leaveUnresolved">${esc(t('leaveUnresolved'))}</button><button class="btn btn-primary" id="revealFact" ${!response.initialActionId && !response.unresolved ? 'disabled' : ''}>${esc(nextLabel)}</button></div></section>`;

  document.querySelectorAll('[data-initial-action]').forEach(button => button.addEventListener('click', () => {
    state.responses[source.id] = { initialActionId: button.dataset.initialAction, finalActionId: null, readiness: response.readiness ?? 3, unresolved: false };
    initialScreen();
  }));
  document.getElementById('readiness').addEventListener('input', event => {
    const saved = currentResponse(source.id);
    saved.readiness = Number(event.target.value);
    saved.unresolved = false;
    state.responses[source.id] = saved;
    document.getElementById('readinessValue').textContent = `${saved.readiness} / 5`;
  });
  document.getElementById('leaveUnresolved').addEventListener('click', () => {
    state.responses[source.id] = { initialActionId: null, finalActionId: null, readiness: 3, unresolved: true };
    advanceScenario();
  });
  document.getElementById('backStage').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      const previous = currentResponse(UNCERTAINTY_SCENARIOS[state.index].id);
      state.phase = previous.unresolved ? 'initial' : 'reveal';
      renderStage();
    }
  });
  document.getElementById('revealFact').addEventListener('click', () => {
    const saved = currentResponse(source.id);
    if (saved.unresolved) return advanceScenario();
    if (!saved.finalActionId) saved.finalActionId = saved.initialActionId;
    state.responses[source.id] = saved;
    state.phase = 'reveal';
    revealScreen();
  });
}

function revealScreen() {
  const source = UNCERTAINTY_SCENARIOS[state.index];
  const scenario = localScenario(source);
  const response = currentResponse(source.id);
  const initial = localAction(scenario, response.initialActionId);
  if (!initial) {
    state.phase = 'initial';
    return initialScreen();
  }
  const choices = actionCards(scenario, response.finalActionId, 'data-final-action');
  app.innerHTML = `<section class="card">${progressMarkup(t('newStage'))}<span class="badge badge-new">${esc(t('newInformation'))}</span><div class="reveal-box"><p>${esc(scenario.reveal)}</p></div><div class="initial-record"><span>${esc(t('initialApproach'))}</span><b>${esc(modeLabel(initial.mode))}</b><small>${esc(t('readinessRecord', { action: initial.label, readiness: response.readiness }))}</small></div><h2>${esc(t('afterQuestion'))}</h2><p class="stage-question">${esc(t('keepOrChange'))}</p><div class="choice-grid">${choices}</div><div class="actions"><button class="btn btn-quiet" id="backToInitial">${esc(t('reviewInitial'))}</button><button class="btn btn-primary" id="nextSituation" ${!response.finalActionId ? 'disabled' : ''}>${esc(state.index === UNCERTAINTY_SCENARIOS.length - 1 ? t('resultsButton') : t('next'))}</button></div></section>`;

  document.querySelectorAll('[data-final-action]').forEach(button => button.addEventListener('click', () => {
    const saved = currentResponse(source.id);
    saved.finalActionId = button.dataset.finalAction;
    saved.unresolved = false;
    state.responses[source.id] = saved;
    revealScreen();
  }));
  document.getElementById('backToInitial').addEventListener('click', () => {
    state.phase = 'initial';
    initialScreen();
  });
  document.getElementById('nextSituation').addEventListener('click', advanceScenario);
}

function advanceScenario() {
  if (state.index < UNCERTAINTY_SCENARIOS.length - 1) {
    state.index += 1;
    state.phase = 'initial';
    initialScreen();
  } else {
    resultScreen();
  }
}

function resultObservations(result) {
  const maxInitial = Math.max(0, ...result.modeRows.map(row => row.initial));
  const leading = maxInitial ? result.modeRows.filter(row => row.initial === maxInitial) : [];
  const observations = [];
  if (!result.resolved) {
    observations.push(t('observationEmpty'));
  } else if (leading.length === 1) {
    observations.push(t('observationLeader', { mode: modeLabel(leading[0].key).toLowerCase(), count: maxInitial }));
  } else {
    observations.push(t('observationTie', { modes: leading.map(row => modeLabel(row.key)).join(', '), count: maxInitial }));
  }
  if (result.resolved) observations.push(t('observationChanged', { changed: result.changed, resolved: result.resolved }));
  if (result.highReadinessChanges.length) observations.push(t('observationHigh', { count: result.highReadinessChanges.length }));
  if (result.unresolved) observations.push(t('observationUnresolved', { count: result.unresolved }));
  observations.push(t('observationBoundary'));
  return observations;
}

function resultScreen() {
  const result = scoreMissingInformation(state.responses);
  const modeRows = result.modeRows.map(row => {
    const mode = localMode(row.key);
    return `<div class="mode-row"><div class="mode-head"><span><b>${esc(mode.label)}</b><small>${esc(mode.description)}</small></span><strong>${row.initial} → ${row.final}</strong></div><div class="bar-pair"><div><i style="width:${Math.round((row.initial / UNCERTAINTY_SCENARIOS.length) * 100)}%"></i></div><div><i style="width:${Math.round((row.final / UNCERTAINTY_SCENARIOS.length) * 100)}%"></i></div></div><p>${esc(t('modeCounts', { initial: row.initial, after: row.final }))}</p></div>`;
  }).join('');
  const changes = result.details.filter(row => !row.unresolved && row.changed);
  const changeCards = changes.length ? changes.map(row => {
    const scenario = localScenario(UNCERTAINTY_SCENARIOS.find(item => item.id === row.scenarioId));
    return `<div class="change-card"><span class="badge">${esc(t('readinessBadge', { readiness: row.readiness }))}</span><h4>${esc(scenario.prompt)}</h4><p><b>${esc(modeLabel(row.initialMode))}</b> → <b>${esc(modeLabel(row.finalMode))}</b></p><p class="muted">${esc(t('newFactLabel', { text: scenario.reveal }))}</p></div>`;
  }).join('') : `<p class="muted">${esc(t('noChanges'))}</p>`;
  const trail = result.details.map((row, index) => {
    const scenario = localScenario(UNCERTAINTY_SCENARIOS[index]);
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.prompt)}</span><strong class="result-unresolved">${esc(t('unresolved'))}</strong></summary><p>${esc(t('unresolvedTrail'))}</p></details>`;
    const initial = localAction(scenario, row.initialActionId);
    const final = localAction(scenario, row.finalActionId);
    const transition = row.changed ? `${modeLabel(row.initialMode)} → ${modeLabel(row.finalMode)}` : t('stayed', { mode: modeLabel(row.initialMode) });
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.prompt)}</span><strong>${esc(transition)}</strong></summary><p>${esc(t('initialTrail', { action: initial.label, readiness: row.readiness }))}</p><p>${esc(t('newFactLabel', { text: scenario.reveal }))}</p><p>${esc(t('afterTrail', { action: final.label }))}</p><p class="muted">${esc(t('finalTradeoff', { text: final.tradeoff }))}</p></details>`;
  }).join('');
  const averageReadiness = result.averageReadiness === null ? '—' : result.averageReadiness;
  app.innerHTML = `<section class="card"><span class="eyebrow">${esc(t('resultsEyebrow'))}</span><h2>${esc(t('resultsTitle'))}</h2><p class="muted">${esc(t('resultsIntro'))}</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>${esc(t('resolvedMetric'))}</span></div><div class="metric"><b>${result.changed}</b><span>${esc(t('changedMetric'))}</span></div><div class="metric"><b>${averageReadiness}</b><span>${esc(t('readinessMetric'))}</span></div><div class="metric"><b>${result.unresolved}</b><span>${esc(t('unresolvedMetric'))}</span></div></div><section><h3>${esc(t('sessionHeading'))}</h3><ul class="observation-list">${resultObservations(result).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>${esc(t('modeHeading'))}</h3><div class="mode-legend"><span>${esc(t('firstBar'))}</span><span>${esc(t('secondBar'))}</span></div><div class="mode-map">${modeRows}</div></section><section><h3>${esc(t('changedHeading'))}</h3><div class="change-grid">${changeCards}</div></section><section><h3>${esc(t('trailHeading'))}</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>${esc(t('boundaryResultTitle'))}</strong><p class="muted">${esc(t('boundaryResultBody'))}</p></div><div class="actions"><button class="btn btn-primary" id="retakeLab">${esc(t('retake'))}</button><a class="btn" href="${esc(pathWithLanguage('/', language))}">${esc(t('return'))}</a></div></section>`;
  document.getElementById('retakeLab').addEventListener('click', introScreen);
}

setupLanguage();
introScreen();
