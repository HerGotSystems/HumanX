import { REVISION_RESPONSES, REVISION_THRESHOLDS, REVISION_TRIGGERS, analyseRevisionConditions } from './revision-core.js';
import { REVISION_CZECH, REVISION_UI } from './revision-copy.js';
import { createTranslator, languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const app = document.getElementById('app');
const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
const t = createTranslator(REVISION_UI, language);
const blankEntry = () => ({ position: '', certainty: 50, trigger: null, threshold: null, response: null });
const state = { index: 0, entries: [blankEntry()] };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
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

function localOption(group, option) {
  if (language !== 'cs') return option;
  return { ...option, ...(REVISION_CZECH[group][option.key] || {}) };
}

function optionFor(group, options, key) {
  const option = options.find(item => item.key === key) || { key, label: key, description: '' };
  return localOption(group, option);
}

function isComplete(entry) {
  return Boolean(entry.position.trim() && entry.trigger && entry.threshold && entry.response);
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">${esc(t('eyebrow'))}</span><h1>${esc(t('title'))}</h1><p class="lead">${esc(t('lead'))}</p><div class="boundary"><strong>${esc(t('boundaryTitle'))}</strong><p class="muted">${esc(t('boundaryBody'))}</p></div><p>${esc(t('intro'))}</p><details class="plain-help"><summary>${esc(t('simpleSummary'))}</summary><p>${esc(t('simpleBody'))}</p><p class="muted">${esc(t('simpleExample'))}</p></details><div class="actions"><button class="btn btn-primary" id="startLab">${esc(t('start'))}</button></div><p class="muted privacy-note"><span class="badge badge-private">${esc(t('sessionOnly'))}</span> ${esc(t('privacy'))}</p></section>`;
  document.getElementById('startLab').addEventListener('click', () => {
    state.index = 0;
    state.entries = [blankEntry()];
    editorScreen();
  });
}

function choiceButtons(group, options, selected, attribute) {
  return options.map(source => {
    const option = localOption(group, source);
    return `<button type="button" class="choice${selected === option.key ? ' selected' : ''}" ${attribute}="${esc(option.key)}"><strong>${esc(option.label)}</strong><span>${esc(option.description)}</span></button>`;
  }).join('');
}

function editorScreen() {
  const entry = state.entries[state.index];
  const triggerChoices = choiceButtons('triggers', REVISION_TRIGGERS, entry.trigger, 'data-trigger');
  const thresholdChoices = choiceButtons('thresholds', REVISION_THRESHOLDS, entry.threshold, 'data-threshold');
  const responseChoices = choiceButtons('responses', REVISION_RESPONSES, entry.response, 'data-response');
  const complete = isComplete(entry);
  const canAdd = state.index < 2 && complete;
  app.innerHTML = `<section class="card"><div class="progress-row"><span>${esc(t('progress', { current: state.index + 1 }))}</span><span>${esc(t('completeCount', { count: state.entries.filter(isComplete).length }))}</span></div><span class="badge">${esc(t('positionBadge', { number: state.index + 1 }))}</span><h2>${esc(t('positionHeading'))}</h2><label class="field-label" for="positionText">${esc(t('positionLabel'))}</label><textarea id="positionText" maxlength="240" placeholder="${esc(t('positionPlaceholder'))}">${esc(entry.position)}</textarea><div class="text-count"><span>${esc(t('privateText'))}</span><span id="positionCount">${entry.position.length} / 240</span></div><div class="certainty-box"><div class="certainty-head"><label for="certainty">${esc(t('certainty'))}</label><span class="certainty-value" id="certaintyValue">${entry.certainty}%</span></div><input class="certainty-input" id="certainty" type="range" min="0" max="100" step="5" value="${entry.certainty}"><div class="certainty-scale"><span>${esc(t('certaintyLow'))}</span><span>${esc(t('certaintyHigh'))}</span></div></div><section class="editor-section"><h3>${esc(t('triggerQuestion'))}</h3><p class="muted">${esc(t('triggerHelp'))}</p><div class="choice-grid trigger-grid">${triggerChoices}</div></section><section class="editor-section"><h3>${esc(t('thresholdQuestion'))}</h3><div class="choice-grid">${thresholdChoices}</div></section><section class="editor-section"><h3>${esc(t('responseQuestion'))}</h3><div class="choice-grid">${responseChoices}</div></section><p class="completion-note" id="completionNote">${esc(complete ? t('complete') : t('incomplete'))}</p><div class="actions"><button class="btn btn-quiet" id="backCard" ${state.index === 0 ? 'disabled' : ''}>${esc(t('previous'))}</button><button class="btn" id="addCard" ${canAdd ? '' : 'disabled'}>${esc(t('add'))}</button><button class="btn btn-primary" id="finishLab" ${complete ? '' : 'disabled'}>${esc(t('finish'))}</button></div></section>`;

  const textInput = document.getElementById('positionText');
  textInput.addEventListener('input', event => {
    entry.position = event.target.value.slice(0, 240);
    document.getElementById('positionCount').textContent = `${entry.position.length} / 240`;
    syncCompletion();
  });
  document.getElementById('certainty').addEventListener('input', event => {
    entry.certainty = Number(event.target.value);
    document.getElementById('certaintyValue').textContent = `${entry.certainty}%`;
  });
  document.querySelectorAll('[data-trigger]').forEach(button => button.addEventListener('click', () => {
    entry.trigger = button.dataset.trigger;
    editorScreen();
  }));
  document.querySelectorAll('[data-threshold]').forEach(button => button.addEventListener('click', () => {
    entry.threshold = button.dataset.threshold;
    editorScreen();
  }));
  document.querySelectorAll('[data-response]').forEach(button => button.addEventListener('click', () => {
    entry.response = button.dataset.response;
    editorScreen();
  }));
  document.getElementById('backCard').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      editorScreen();
    }
  });
  document.getElementById('addCard').addEventListener('click', () => {
    if (!isComplete(entry) || state.index >= 2) return;
    state.index += 1;
    if (!state.entries[state.index]) state.entries.push(blankEntry());
    editorScreen();
  });
  document.getElementById('finishLab').addEventListener('click', () => {
    if (isComplete(entry)) resultScreen();
  });
}

function syncCompletion() {
  const complete = isComplete(state.entries[state.index]);
  document.getElementById('finishLab').disabled = !complete;
  document.getElementById('addCard').disabled = !complete || state.index >= 2;
  document.getElementById('completionNote').textContent = complete ? t('complete') : t('incomplete');
}

function resultObservations(result) {
  const observations = [];
  if (!result.total) observations.push(t('observationEmpty'));
  else observations.push(t('observationNamed', { named: result.namedConditions, total: result.total }));
  if (result.highCertaintyWithoutCondition) observations.push(t('observationHigh', { count: result.highCertaintyWithoutCondition }));
  if (result.unclearThresholds) observations.push(t('observationThreshold', { count: result.unclearThresholds }));
  observations.push(t('observationBoundary'));
  return observations;
}

function resultScreen() {
  const result = analyseRevisionConditions(state.entries);
  const triggerRows = result.triggerRows.filter(row => row.count > 0).map(row => {
    const trigger = localOption('triggers', row);
    return `<div class="trigger-row"><span><b>${esc(trigger.label)}</b><small>${esc(trigger.description)}</small></span><strong>${row.count}</strong></div>`;
  }).join('');
  const cards = result.details.map(item => {
    const trigger = optionFor('triggers', REVISION_TRIGGERS, item.trigger);
    const threshold = optionFor('thresholds', REVISION_THRESHOLDS, item.threshold);
    const response = optionFor('responses', REVISION_RESPONSES, item.response);
    return `<article class="revision-card"><div class="revision-head"><span>${esc(t('positionNumber', { number: item.number }))}</span><strong>${esc(t('certaintyValue', { value: item.certainty }))}</strong></div><h3>“${esc(item.position)}”</h3><div class="certainty-track"><span style="width:${item.certainty}%"></span></div><div class="condition"><span>${esc(t('appearedLabel'))}</span><b>${esc(trigger.label)}</b><small>${esc(trigger.description)}</small></div><div class="condition"><span>${esc(t('thresholdLabel'))}</span><b>${esc(threshold.label)}</b><small>${esc(threshold.description)}</small></div><div class="condition"><span>${esc(t('responseLabel'))}</span><b>${esc(response.label)}</b><small>${esc(response.description)}</small></div></article>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">${esc(t('resultsEyebrow'))}</span><h2>${esc(t('resultsTitle'))}</h2><p class="muted">${esc(t('resultsIntro'))}</p><div class="metric-grid"><div class="metric"><b>${result.total}</b><span>${esc(t('positionsMetric'))}</span></div><div class="metric"><b>${result.averageCertainty}%</b><span>${esc(t('certaintyMetric'))}</span></div><div class="metric"><b>${result.namedConditions}</b><span>${esc(t('namedMetric'))}</span></div><div class="metric"><b>${result.unnamedConditions}</b><span>${esc(t('unnamedMetric'))}</span></div></div><section><h3>${esc(t('sessionHeading'))}</h3><ul class="observation-list">${resultObservations(result).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>${esc(t('triggerHeading'))}</h3><div class="trigger-map">${triggerRows || `<p class="muted">${esc(t('noTrigger'))}</p>`}</div></section><section><h3>${esc(t('cardsHeading'))}</h3><div class="revision-grid">${cards}</div></section><div class="boundary privacy-note"><strong>${esc(t('boundaryResultTitle'))}</strong><p class="muted">${esc(t('boundaryResultBody'))}</p></div><div class="actions"><button class="btn btn-primary" id="retakeLab">${esc(t('retake'))}</button><a class="btn" href="${esc(pathWithLanguage('/', language))}">${esc(t('return'))}</a></div></section>`;
  document.getElementById('retakeLab').addEventListener('click', introScreen);
}

setupLanguage();
introScreen();
