import { EVIDENCE_SCENARIOS, EVIDENCE_SOURCES, scoreEvidenceReflex } from './evidence-core.js';
import { EVIDENCE_CZECH, EVIDENCE_UI } from './evidence-copy.js';
import { createTranslator, languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const app = document.getElementById('app');
const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
const t = createTranslator(EVIDENCE_UI, language);
const state = { index: 0, responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
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

function localSource(key) {
  const base = EVIDENCE_SOURCES.find(source => source.key === key) || { key, label: key, description: '' };
  return language === 'cs' ? { ...base, ...(EVIDENCE_CZECH.sources[key] || {}) } : base;
}

function localScenario(source) {
  return language === 'cs' ? { ...source, ...(EVIDENCE_CZECH.scenarios[source.id] || {}) } : source;
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">${esc(t('eyebrow'))}</span><h1>${esc(t('title'))}</h1><p class="lead">${esc(t('lead'))}</p><div class="boundary"><strong>${esc(t('boundaryTitle'))}</strong><p class="muted">${esc(t('boundaryBody'))}</p></div><p>${esc(t('intro'))}</p><details class="plain-help"><summary>${esc(t('simpleSummary'))}</summary><p>${esc(t('simpleBody'))}</p><p class="muted">${esc(t('simpleExample'))}</p></details><div class="actions"><button class="btn btn-primary" id="startReflex">${esc(t('start'))}</button></div><p class="muted privacy-note"><span class="badge badge-private">${esc(t('sessionOnly'))}</span> ${esc(t('privacy'))}</p></section>`;
  document.getElementById('startReflex').addEventListener('click', () => {
    state.index = 0;
    state.responses = {};
    scenarioScreen();
  });
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { choiceId: null, weight: 3, unresolved: false };
}

function scenarioScreen() {
  const source = EVIDENCE_SCENARIOS[state.index];
  const scenario = localScenario(source);
  const response = currentResponse(source.id);
  const progress = Math.round(((state.index + 1) / EVIDENCE_SCENARIOS.length) * 100);
  const choices = scenario.choices.map(choice => `<button class="choice${response.choiceId === choice.id && !response.unresolved ? ' selected' : ''}" type="button" data-choice="${esc(choice.id)}"><span class="choice-source">${esc(localSource(choice.source).label)}</span><strong>${esc(choice.label)}</strong><span class="choice-limit">${esc(t('limitation', { text: choice.limitation }))}</span></button>`).join('');
  app.innerHTML = `<section class="card"><div class="progress-row"><span>${esc(t('progress', { current: state.index + 1, total: EVIDENCE_SCENARIOS.length }))}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="badge">${esc(t('chooseBadge'))}</span><h2>${esc(scenario.prompt)}</h2><div class="choice-grid">${choices}</div><div class="weight-box"><div class="weight-head"><label for="weight">${esc(t('weightQuestion'))}</label><span class="weight-value" id="weightValue">${response.weight} / 5</span></div><input class="weight-input" id="weight" type="range" min="1" max="5" step="1" value="${response.weight}" ${response.unresolved || !response.choiceId ? 'disabled' : ''}><div class="weight-scale"><span>${esc(t('weightLow'))}</span><span>${esc(t('weightMiddle'))}</span><span>${esc(t('weightHigh'))}</span></div></div><p class="defer-note">${esc(t('weightNote'))}</p><div class="actions"><button class="btn btn-quiet" id="backScenario" ${state.index === 0 ? 'disabled' : ''}>${esc(t('backButton'))}</button><button class="btn" id="unresolvedScenario">${esc(t('unresolvedButton'))}</button><button class="btn btn-primary" id="nextScenario" ${!response.choiceId && !response.unresolved ? 'disabled' : ''}>${esc(state.index === EVIDENCE_SCENARIOS.length - 1 ? t('resultsButton') : t('next'))}</button></div></section>`;

  document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    state.responses[source.id] = { choiceId: button.dataset.choice, weight: response.weight ?? 3, unresolved: false };
    scenarioScreen();
  }));
  document.getElementById('weight').addEventListener('input', event => {
    const saved = currentResponse(source.id);
    saved.weight = Number(event.target.value);
    saved.unresolved = false;
    state.responses[source.id] = saved;
    document.getElementById('weightValue').textContent = `${saved.weight} / 5`;
  });
  document.getElementById('unresolvedScenario').addEventListener('click', () => {
    state.responses[source.id] = { choiceId: null, weight: 3, unresolved: true };
    advance();
  });
  document.getElementById('backScenario').addEventListener('click', () => {
    if (state.index > 0) { state.index -= 1; scenarioScreen(); }
  });
  document.getElementById('nextScenario').addEventListener('click', advance);
}

function advance() {
  if (state.index < EVIDENCE_SCENARIOS.length - 1) { state.index += 1; scenarioScreen(); }
  else resultScreen();
}

function resultObservations(result) {
  const maxSelected = Math.max(0, ...result.sourceRows.map(row => row.selected));
  const leading = maxSelected ? result.sourceRows.filter(row => row.selected === maxSelected) : [];
  const observations = [];
  if (!result.resolved) observations.push(t('observationEmpty'));
  else if (leading.length === 1) observations.push(t('observationLeader', { source: localSource(leading[0].key).label, selected: maxSelected, opportunities: leading[0].opportunities }));
  else observations.push(t('observationTie', { sources: leading.map(row => localSource(row.key).label).join(', '), count: maxSelected }));
  if (result.highWeightChoices.length) observations.push(t('observationHigh', { count: result.highWeightChoices.length }));
  if (result.unresolved) observations.push(t('observationUnresolved', { count: result.unresolved }));
  observations.push(t('observationBoundary'));
  return observations;
}

function resultScreen() {
  const result = scoreEvidenceReflex(state.responses);
  const sourceRows = result.sourceRows.map(row => {
    const source = localSource(row.key);
    const width = Math.round((row.selected / row.opportunities) * 100);
    const weight = row.averageWeight === null ? t('noWeight') : t('averageWeight', { weight: row.averageWeight });
    const unresolved = row.unresolved ? t('unresolvedAppearances', { count: row.unresolved }) : '';
    return `<div class="source-row"><div class="source-head"><span><b>${esc(source.label)}</b><small>${esc(source.description)}</small></span><strong>${row.selected} / ${row.opportunities}</strong></div><div class="source-track"><span style="width:${width}%"></span></div><p>${esc(weight)}${esc(unresolved)}</p></div>`;
  }).join('');
  const highWeight = result.highWeightChoices.length ? result.highWeightChoices.map(row => {
    const scenario = localScenario(EVIDENCE_SCENARIOS.find(item => item.id === row.scenarioId));
    const choice = scenario.choices.find(item => item.id === row.choiceId);
    return `<div class="high-choice"><span class="badge">${esc(t('highBadge', { weight: row.weight }))}</span><h4>${esc(scenario.prompt)}</h4><p><b>${esc(localSource(row.source).label)}</b> · ${esc(choice.label)}</p><p class="muted">${esc(t('visibleLimit', { text: choice.limitation }))}</p></div>`;
  }).join('') : `<p class="muted">${esc(t('noHigh'))}</p>`;
  const trail = result.details.map((row, index) => {
    const scenario = localScenario(EVIDENCE_SCENARIOS[index]);
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.prompt)}</span><strong class="result-unresolved">${esc(t('unresolved'))}</strong></summary><p>${esc(t('unresolvedTrail'))}</p></details>`;
    const choice = scenario.choices.find(item => item.id === row.choiceId);
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.prompt)}</span><strong>${esc(localSource(row.source).label)}</strong></summary><p>${esc(t('firstInspection', { choice: choice.label }))}</p><p>${esc(t('initialWeight', { weight: row.weight }))}</p><p class="muted">${esc(t('visibleLimit', { text: choice.limitation }))}</p></details>`;
  }).join('');
  const averageWeight = result.averageWeight === null ? '—' : `${result.averageWeight}`;
  app.innerHTML = `<section class="card"><span class="eyebrow">${esc(t('resultsEyebrow'))}</span><h2>${esc(t('resultsTitle'))}</h2><p class="muted">${esc(t('resultsIntro'))}</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>${esc(t('resolvedMetric'))}</span></div><div class="metric"><b>${result.unresolved}</b><span>${esc(t('unresolvedMetric'))}</span></div><div class="metric"><b>${averageWeight}</b><span>${esc(t('averageMetric'))}</span></div></div><section><h3>${esc(t('sessionHeading'))}</h3><ul class="observation-list">${resultObservations(result).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>${esc(t('sourceHeading'))}</h3><div class="source-map">${sourceRows}</div></section><section><h3>${esc(t('highHeading'))}</h3><div class="high-grid">${highWeight}</div></section><section><h3>${esc(t('trailHeading'))}</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>${esc(t('resultBoundaryTitle'))}</strong><p class="muted">${esc(t('resultBoundaryBody'))}</p></div><div class="actions"><button class="btn btn-primary" id="retakeReflex">${esc(t('retake'))}</button><a class="btn" href="${esc(pathWithLanguage('/', language))}">${esc(t('return'))}</a></div></section>`;
  document.getElementById('retakeReflex').addEventListener('click', introScreen);
}

setupLanguage();
introScreen();
