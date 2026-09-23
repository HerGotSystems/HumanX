import { CERTAINTY_QUESTIONS, scoreCertaintyLab } from './certainty-core.js';

const app = document.getElementById('app');
const state = { index: 0, responses: {} };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function introScreen() {
  app.innerHTML = `<section class="card hero"><span class="eyebrow">confidence calibration</span><h1>Certainty Lab</h1><p class="lead">How closely does your reported confidence match a fixed answer key?</p><div class="boundary"><strong>This is not a measure of your overall knowledge, intelligence, or personality.</strong><p class="muted">The questions only create a surface for comparing confidence with answers. A result describes this session, not who you are.</p></div><p>For each of 12 neutral factual questions, choose an answer and record how confident you are—or defer instead of guessing. At the end, HumanX shows the comparison without awarding a grade or identity label.</p><div class="actions"><button class="btn btn-primary" id="startLab">Start private session</button></div><p class="muted privacy-note"><span class="badge badge-private">session only</span> Nothing is sent, saved, published, or added to My HumanX. Closing or reloading this page clears the session.</p></section>`;
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
  const question = CERTAINTY_QUESTIONS[state.index];
  const response = currentResponse(question.id);
  const progress = Math.round(((state.index + 1) / CERTAINTY_QUESTIONS.length) * 100);
  const choices = question.choices.map(([id, label], choiceIndex) => `<button class="choice${response.choiceId === id && !response.deferred ? ' selected' : ''}" type="button" data-choice="${esc(id)}"><span class="choice-letter">${choiceIndex + 1}</span><span>${esc(label)}</span></button>`).join('');
  app.innerHTML = `<section class="card"><div class="progress-row"><span>Question ${state.index + 1} of ${CERTAINTY_QUESTIONS.length}</span><span>${progress}%</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="badge">answer + confidence</span><h2>${esc(question.prompt)}</h2><div class="choice-grid">${choices}</div><div class="confidence-box"><div class="confidence-head"><label for="confidence">How confident are you in this answer?</label><span class="confidence-value" id="confidenceValue">${response.confidence}%</span></div><input class="confidence-input" id="confidence" type="range" min="0" max="100" step="5" value="${response.confidence}" ${response.deferred || !response.choiceId ? 'disabled' : ''}><div class="confidence-scale"><span>0% no confidence</span><span>100% certain</span></div></div><p class="defer-note">Not enough information? Deferring is recorded separately from an incorrect answer.</p><div class="actions"><button class="btn btn-quiet" id="backQuestion" ${state.index === 0 ? 'disabled' : ''}>← Back</button><button class="btn" id="deferQuestion">I don’t know / defer</button><button class="btn btn-primary" id="nextQuestion" ${!response.choiceId && !response.deferred ? 'disabled' : ''}>${state.index === CERTAINTY_QUESTIONS.length - 1 ? 'See session result →' : 'Next →'}</button></div></section>`;

  document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    state.responses[question.id] = { choiceId: button.dataset.choice, confidence: response.confidence ?? 60, deferred: false };
    questionScreen();
  }));
  document.getElementById('confidence').addEventListener('input', event => {
    const saved = currentResponse(question.id);
    saved.confidence = Number(event.target.value);
    saved.deferred = false;
    state.responses[question.id] = saved;
    document.getElementById('confidenceValue').textContent = `${saved.confidence}%`;
  });
  document.getElementById('deferQuestion').addEventListener('click', () => {
    state.responses[question.id] = { choiceId: null, confidence: 60, deferred: true };
    advance();
  });
  document.getElementById('backQuestion').addEventListener('click', () => {
    if (state.index > 0) {
      state.index -= 1;
      questionScreen();
    }
  });
  document.getElementById('nextQuestion').addEventListener('click', advance);
}

function advance() {
  if (state.index < CERTAINTY_QUESTIONS.length - 1) {
    state.index += 1;
    questionScreen();
  } else {
    resultScreen();
  }
}

function resultScreen() {
  const result = scoreCertaintyLab(state.responses);
  const bands = result.bands.map(band => `<div class="band"><b>${esc(band.label)} confidence</b><span>${band.answered ? `${band.correct} of ${band.answered} matched the key · ${band.accuracyPercent}%` : 'No answers in this band'}</span></div>`).join('');
  const review = result.details.map((row, index) => {
    const question = CERTAINTY_QUESTIONS[index];
    const chosen = row.choiceId ? question.choices.find(([id]) => id === row.choiceId)?.[1] : null;
    const answer = question.choices.find(([id]) => id === row.answerId)?.[1];
    const stateClass = row.deferred ? 'result-deferred' : row.correct ? 'result-correct' : 'result-wrong';
    const stateLabel = row.deferred ? 'Deferred' : row.correct ? 'Matched key' : 'Did not match key';
    return `<details class="review-item"><summary class="review-head"><span>${index + 1}. ${esc(question.prompt)}</span><strong class="${stateClass}">${stateLabel}</strong></summary>${row.deferred ? '<p>You chose not to answer.</p>' : `<p>Your answer: <b>${esc(chosen)}</b> · confidence ${row.confidence}%</p>`}<p>Answer key: <b>${esc(answer)}</b></p><p class="muted">${esc(row.explanation)}</p></details>`;
  }).join('');
  app.innerHTML = `<section class="card"><span class="eyebrow">session result</span><h2>Confidence compared with answers</h2><p class="muted">This result describes only these 12 questions in this session.</p><div class="metric-grid"><div class="metric"><b>${result.averageConfidence}%</b><span>average reported confidence</span></div><div class="metric"><b>${result.accuracyPercent}%</b><span>answers matching the key</span></div><div class="metric"><b>${result.calibrationGap > 0 ? '+' : ''}${result.calibrationGap}</b><span>confidence minus accuracy</span></div><div class="metric"><b>${result.deferred}</b><span>deferred judgements</span></div></div><section><h3>What happened in this session</h3><ul class="observation-list">${result.observations.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>Confidence bands</h3><div class="band-grid">${bands}</div></section><section><h3>Question-by-question evidence</h3><div class="review-list">${review}</div></section><div class="boundary privacy-note"><strong>Mirror, not verdict.</strong><p class="muted">HumanX is showing the arithmetic behind this session. It is not deciding whether you are knowledgeable, rational, careful, or intelligent.</p></div><div class="actions"><button class="btn btn-primary" id="retakeLab">Run another session</button><a class="btn" href="/">Return to HumanX</a></div></section>`;
  document.getElementById('retakeLab').addEventListener('click', introScreen);
}

introScreen();
