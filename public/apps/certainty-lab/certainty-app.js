import { CERTAINTY_QUESTIONS, scoreCertaintyLab } from './certainty-core.js';
import { CERTAINTY_CZECH, CERTAINTY_UI } from './certainty-copy.js';
import { createTranslator, languageSwitcherMarkup, pathWithLanguage, resolveLanguage } from '../shared/language.js';

const app = document.getElementById('app');
const language = resolveLanguage({ search: location.search, browserLanguage: navigator.language });
const t = createTranslator(CERTAINTY_UI, language);
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

function localQuestion(source) {
  return language === 'cs' ? { ...source, ...(CERTAINTY_CZECH[source.id] || {}) } : source;
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">${esc(t('eyebrow'))}</span><h1>${esc(t('title'))}</h1><p class="lead">${esc(t('lead'))}</p><div class="boundary"><strong>${esc(t('boundaryTitle'))}</strong><p class="muted">${esc(t('boundaryBody'))}</p></div><p>${esc(t('intro'))}</p><details class="plain-help"><summary>${esc(t('simpleSummary'))}</summary><p>${esc(t('simpleBody'))}</p><p class="muted">${esc(t('simpleExample'))}</p></details><div class="actions"><button class="btn btn-primary" id="startLab">${esc(t('start'))}</button></div><p class="muted privacy-note"><span class="badge badge-private">${esc(t('sessionOnly'))}</span> ${esc(t('privacy'))}</p></section>`;
  document.getElementById('startLab').addEventListener('click', () => {
    state.index = 0;
    state.responses = {};
    questionScreen();
  });
}

function currentResponse(questionId) {
  return state.responses[questionId] || { choiceId: null, confidence: 60, deferred: false };
}

function questionScreen() {
  const source = CERTAINTY_QUESTIONS[state.index];
  const question = localQuestion(source);
  const response = currentResponse(source.id);
  const progress = Math.round(((state.index + 1) / CERTAINTY_QUESTIONS.length) * 100);
  const choices = question.choices.map(([id, label], choiceIndex) => `<button class="choice${response.choiceId === id && !response.deferred ? ' selected' : ''}" type="button" data-choice="${esc(id)}"><span class="choice-letter">${choiceIndex + 1}</span><span>${esc(label)}</span></button>`).join('');
  app.innerHTML = `<section class="card"><div class="progress-row"><span>${esc(t('progress', { current: state.index + 1, total: CERTAINTY_QUESTIONS.length }))}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="badge">${esc(t('answerBadge'))}</span><h2>${esc(question.prompt)}</h2><div class="choice-grid">${choices}</div><div class="confidence-box"><div class="confidence-head"><label for="confidence">${esc(t('confidenceQuestion'))}</label><span class="confidence-value" id="confidenceValue">${response.confidence}%</span></div><input class="confidence-input" id="confidence" type="range" min="0" max="100" step="5" value="${response.confidence}" ${response.deferred || !response.choiceId ? 'disabled' : ''}><div class="confidence-scale"><span>${esc(t('confidenceLow'))}</span><span>${esc(t('confidenceHigh'))}</span></div></div><p class="defer-note">${esc(t('deferNote'))}</p><div class="actions"><button class="btn btn-quiet" id="backQuestion" ${state.index === 0 ? 'disabled' : ''}>${esc(t('backButton'))}</button><button class="btn" id="deferQuestion">${esc(t('deferButton'))}</button><button class="btn btn-primary" id="nextQuestion" ${!response.choiceId && !response.deferred ? 'disabled' : ''}>${esc(t(state.index === CERTAINTY_QUESTIONS.length - 1 ? 'resultsButton' : 'next'))}</button></div></section>`;

  document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    state.responses[source.id] = { choiceId: button.dataset.choice, confidence: response.confidence ?? 60, deferred: false };
    questionScreen();
  }));
  document.getElementById('confidence').addEventListener('input', event => {
    const saved = currentResponse(source.id);
    saved.confidence = Number(event.target.value);
    saved.deferred = false;
    state.responses[source.id] = saved;
    document.getElementById('confidenceValue').textContent = `${saved.confidence}%`;
  });
  document.getElementById('deferQuestion').addEventListener('click', () => {
    state.responses[source.id] = { choiceId: null, confidence: 60, deferred: true };
    advance();
  });
  document.getElementById('backQuestion').addEventListener('click', () => {
    if (state.index > 0) { state.index -= 1; questionScreen(); }
  });
  document.getElementById('nextQuestion').addEventListener('click', advance);
}

function advance() {
  if (state.index < CERTAINTY_QUESTIONS.length - 1) { state.index += 1; questionScreen(); }
  else resultScreen();
}

function resultObservations(result) {
  const observations = [];
  if (!result.answered) observations.push(t('observationAllDeferred'));
  else if (result.calibrationGap > 10) observations.push(t('observationHigher', { gap: result.calibrationGap }));
  else if (result.calibrationGap < -10) observations.push(t('observationLower', { gap: Math.abs(result.calibrationGap) }));
  else observations.push(t('observationClose', { gap: Math.abs(result.calibrationGap) }));
  if (result.highConfidenceMisses > 0) observations.push(t('observationMisses', { count: result.highConfidenceMisses }));
  if (result.deferred > 0) observations.push(t('observationDeferred', { count: result.deferred }));
  observations.push(t('observationBoundary'));
  return observations;
}

function resultScreen() {
  const result = scoreCertaintyLab(state.responses);
  const bands = result.bands.map(band => `<div class="band"><b>${esc(t('confidenceBand', { band: band.label }))}</b><span>${esc(band.answered ? t('bandResult', { correct: band.correct, answered: band.answered, accuracy: band.accuracyPercent }) : t('bandEmpty'))}</span></div>`).join('');
  const review = result.details.map((row, index) => {
    const question = localQuestion(CERTAINTY_QUESTIONS[index]);
    const chosen = row.choiceId ? question.choices.find(([id]) => id === row.choiceId)?.[1] : null;
    const answer = question.choices.find(([id]) => id === row.answerId)?.[1];
    const stateClass = row.deferred ? 'result-deferred' : row.correct ? 'result-correct' : 'result-wrong';
    const stateLabel = row.deferred ? t('deferred') : row.correct ? t('matched') : t('missed');
    return `<details class="review-item"><summary class="review-head"><span>${index + 1}. ${esc(question.prompt)}</span><strong class="${stateClass}">${esc(stateLabel)}</strong></summary>${row.deferred ? `<p>${esc(t('noAnswer'))}</p>` : `<p>${esc(t('yourAnswer', { answer: chosen, confidence: row.confidence }))}</p>`}<p>${esc(t('answerKey', { answer }))}</p><p class="muted">${esc(question.explanation)}</p></details>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">${esc(t('resultEyebrow'))}</span><h2>${esc(t('resultTitle'))}</h2><p class="muted">${esc(t('resultIntro'))}</p><div class="metric-grid"><div class="metric"><b>${result.averageConfidence}%</b><span>${esc(t('averageConfidence'))}</span></div><div class="metric"><b>${result.accuracyPercent}%</b><span>${esc(t('accuracy'))}</span></div><div class="metric"><b>${result.calibrationGap > 0 ? '+' : ''}${result.calibrationGap}</b><span>${esc(t('gap'))}</span></div><div class="metric"><b>${result.deferred}</b><span>${esc(t('deferredMetric'))}</span></div></div><section><h3>${esc(t('observationsHeading'))}</h3><ul class="observation-list">${resultObservations(result).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>${esc(t('bandsHeading'))}</h3><div class="band-grid">${bands}</div></section><section><h3>${esc(t('evidenceHeading'))}</h3><div class="review-list">${review}</div></section><div class="boundary privacy-note"><strong>${esc(t('boundaryResultTitle'))}</strong><p class="muted">${esc(t('boundaryResultBody'))}</p></div><div class="actions"><button class="btn btn-primary" id="retakeLab">${esc(t('retake'))}</button><a class="btn" href="${esc(pathWithLanguage('/', language))}">${esc(t('return'))}</a></div></section>`;
  document.getElementById('retakeLab').addEventListener('click', introScreen);
}

setupLanguage();
introScreen();
