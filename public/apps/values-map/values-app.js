import { VALUE_CONSIDERATIONS, VALUE_SCENARIOS, scoreValuesMap } from './values-core.js';
import { VALUES_CZECH, VALUES_UI } from './values-copy.js';
import { createTranslator, languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const app = document.getElementById('app');
const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
const t = createTranslator(VALUES_UI, language);
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

function localConsideration(key) {
  const base = VALUE_CONSIDERATIONS.find(value => value.key === key) || { key, label: key, description: '' };
  return language === 'cs' ? { ...base, ...(VALUES_CZECH.considerations[key] || {}) } : base;
}

function localScenario(source) {
  return language === 'cs' ? { ...source, ...(VALUES_CZECH.scenarios[source.id] || {}) } : source;
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">${esc(t('eyebrow'))}</span><h1>${esc(t('title'))}</h1><p class="lead">${esc(t('lead'))}</p><div class="boundary"><strong>${esc(t('boundaryTitle'))}</strong><p class="muted">${esc(t('boundaryBody'))}</p></div><p>${esc(t('intro'))}</p><details class="plain-help"><summary>${esc(t('simpleSummary'))}</summary><p>${esc(t('simpleBody'))}</p><p class="muted">${esc(t('simpleExample'))}</p></details><div class="actions"><button class="btn btn-primary" id="startMap">${esc(t('start'))}</button></div><p class="muted privacy-note"><span class="badge badge-private">${esc(t('sessionOnly'))}</span> ${esc(t('privacy'))}</p></section>`;
  document.getElementById('startMap').addEventListener('click', () => {
    state.index = 0;
    state.responses = {};
    scenarioScreen();
  });
}

function currentResponse(scenarioId) {
  return state.responses[scenarioId] || { choiceId: null, difficulty: 3, unresolved: false };
}

function scenarioScreen() {
  const source = VALUE_SCENARIOS[state.index];
  const scenario = localScenario(source);
  const response = currentResponse(source.id);
  const progress = Math.round(((state.index + 1) / VALUE_SCENARIOS.length) * 100);
  const choices = scenario.choices.map(choice => `<button class="choice${response.choiceId === choice.id && !response.unresolved ? ' selected' : ''}" type="button" data-choice="${esc(choice.id)}"><span class="choice-value">${esc(localConsideration(choice.value).label)}</span><strong>${esc(choice.label)}</strong><span class="choice-cost">${esc(t('acceptedCost', { cost: choice.cost }))}</span></button>`).join('');
  app.innerHTML = `<section class="card"><div class="progress-row"><span>${esc(t('progress', { current: state.index + 1, total: VALUE_SCENARIOS.length }))}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="badge">${esc(t('chooseBadge'))}</span><h2>${esc(scenario.prompt)}</h2><div class="choice-grid">${choices}</div><div class="difficulty-box"><div class="difficulty-head"><label for="difficulty">${esc(t('difficultyQuestion'))}</label><span class="difficulty-value" id="difficultyValue">${response.difficulty} / 5</span></div><input class="difficulty-input" id="difficulty" type="range" min="1" max="5" step="1" value="${response.difficulty}" ${response.unresolved || !response.choiceId ? 'disabled' : ''}><div class="difficulty-scale"><span>${esc(t('difficultyLow'))}</span><span>${esc(t('difficultyMiddle'))}</span><span>${esc(t('difficultyHigh'))}</span></div></div><p class="defer-note">${esc(t('choiceNote'))}</p><div class="actions"><button class="btn btn-quiet" id="backScenario" ${state.index === 0 ? 'disabled' : ''}>${esc(t('backButton'))}</button><button class="btn" id="unresolvedScenario">${esc(t('unresolvedButton'))}</button><button class="btn btn-primary" id="nextScenario" ${!response.choiceId && !response.unresolved ? 'disabled' : ''}>${esc(state.index === VALUE_SCENARIOS.length - 1 ? t('resultsButton') : t('next'))}</button></div></section>`;

  document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    state.responses[source.id] = { choiceId: button.dataset.choice, difficulty: response.difficulty ?? 3, unresolved: false };
    scenarioScreen();
  }));
  document.getElementById('difficulty').addEventListener('input', event => {
    const saved = currentResponse(source.id);
    saved.difficulty = Number(event.target.value);
    saved.unresolved = false;
    state.responses[source.id] = saved;
    document.getElementById('difficultyValue').textContent = `${saved.difficulty} / 5`;
  });
  document.getElementById('unresolvedScenario').addEventListener('click', () => {
    state.responses[source.id] = { choiceId: null, difficulty: 3, unresolved: true };
    advance();
  });
  document.getElementById('backScenario').addEventListener('click', () => {
    if (state.index > 0) { state.index -= 1; scenarioScreen(); }
  });
  document.getElementById('nextScenario').addEventListener('click', advance);
}

function advance() {
  if (state.index < VALUE_SCENARIOS.length - 1) { state.index += 1; scenarioScreen(); }
  else resultScreen();
}

function resultObservations(result) {
  const maxSelected = Math.max(0, ...result.valueRows.map(row => row.selected));
  const leading = maxSelected ? result.valueRows.filter(row => row.selected === maxSelected) : [];
  const observations = [];
  if (!result.resolved) observations.push(t('observationEmpty'));
  else if (leading.length === 1) observations.push(t('observationLeader', { value: localConsideration(leading[0].key).label, selected: maxSelected, opportunities: leading[0].opportunities }));
  else observations.push(t('observationTie', { values: leading.map(row => localConsideration(row.key).label).join(', '), count: maxSelected }));
  if (result.hardChoices.length) observations.push(t('observationHard', { count: result.hardChoices.length }));
  if (result.unresolved) observations.push(t('observationUnresolved', { count: result.unresolved }));
  observations.push(t('observationBoundary'));
  return observations;
}

function resultScreen() {
  const result = scoreValuesMap(state.responses);
  const mapRows = result.valueRows.map(row => {
    const value = localConsideration(row.key);
    const width = Math.round((row.selected / row.opportunities) * 100);
    const unresolved = row.unresolved ? t('unresolvedAppearances', { count: row.unresolved }) : '';
    return `<div class="value-row"><div class="value-head"><span><b>${esc(value.label)}</b><small>${esc(value.description)}</small></span><strong>${row.selected} / ${row.opportunities}</strong></div><div class="value-track"><span style="width:${width}%"></span></div><p>${esc(t('rowSelected', { count: row.selected }))}${esc(unresolved)}</p></div>`;
  }).join('');
  const hardChoices = result.hardChoices.length ? result.hardChoices.map(row => {
    const scenario = localScenario(VALUE_SCENARIOS.find(item => item.id === row.scenarioId));
    const choice = scenario.choices.find(item => item.id === row.choiceId);
    return `<div class="hard-choice"><span class="badge">${esc(t('difficultyBadge', { difficulty: row.difficulty }))}</span><h4>${esc(scenario.prompt)}</h4><p>${esc(t('wonWithCost', { value: localConsideration(row.selectedValue).label, cost: choice.cost }))}</p></div>`;
  }).join('') : `<p class="muted">${esc(t('noHard'))}</p>`;
  const trail = result.details.map((row, index) => {
    const scenario = localScenario(VALUE_SCENARIOS[index]);
    if (row.unresolved) return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.prompt)}</span><strong class="result-unresolved">${esc(t('unresolved'))}</strong></summary><p>${esc(t('unresolvedTrail'))}</p></details>`;
    const choice = scenario.choices.find(item => item.id === row.choiceId);
    return `<details class="trail-item"><summary><span>${index + 1}. ${esc(scenario.prompt)}</span><strong>${esc(localConsideration(row.selectedValue).label)}</strong></summary><p>${esc(t('selectedChoice', { choice: choice.label }))}</p><p>${esc(t('acceptedCostTrail', { cost: choice.cost }))}</p><p class="muted">${esc(t('trailMeta', { difficulty: row.difficulty, other: localConsideration(row.otherValue).label }))}</p></details>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">${esc(t('resultsEyebrow'))}</span><h2>${esc(t('resultsTitle'))}</h2><p class="muted">${esc(t('resultsIntro'))}</p><div class="metric-grid"><div class="metric"><b>${result.resolved}</b><span>${esc(t('resolvedMetric'))}</span></div><div class="metric"><b>${result.unresolved}</b><span>${esc(t('unresolvedMetric'))}</span></div><div class="metric"><b>${result.hardChoices.length}</b><span>${esc(t('difficultMetric'))}</span></div></div><section><h3>${esc(t('sessionHeading'))}</h3><ul class="observation-list">${resultObservations(result).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>${esc(t('mapHeading'))}</h3><div class="value-map">${mapRows}</div></section><section><h3>${esc(t('hardHeading'))}</h3><div class="hard-grid">${hardChoices}</div></section><section><h3>${esc(t('trailHeading'))}</h3><div class="trail-list">${trail}</div></section><div class="boundary privacy-note"><strong>${esc(t('resultBoundaryTitle'))}</strong><p class="muted">${esc(t('resultBoundaryBody'))}</p></div><div class="actions"><button class="btn btn-primary" id="retakeMap">${esc(t('retake'))}</button><a class="btn" href="${esc(pathWithLanguage('/', language))}">${esc(t('return'))}</a></div></section>`;
  document.getElementById('retakeMap').addEventListener('click', introScreen);
}

setupLanguage();
introScreen();
